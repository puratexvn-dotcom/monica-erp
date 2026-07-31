-- ============================================================================
-- 017 — NỀN DỮ LIỆU CHO TRUNG TÂM ĐIỀU HÀNH KHO
--
-- ─── VÌ SAO CẦN MIGRATION NÀY ──────────────────────────────────────────────
-- Kho hiện chỉ có ba thứ: `materials` (một cột stock_qty duy nhất),
-- `fabric_rolls` (rất mỏng) và `warehouse_transactions` (một dòng IN/OUT phẳng).
-- Với chừng đó KHÔNG thể dựng nổi:
--   · Tồn thực tế / Đã giữ chỗ / Có sẵn  → thiếu stock_levels + reservations
--   · Vị trí Khu-Kệ-Ô                     → thiếu warehouses/zones/racks/bins
--   · Chấm điểm QA 4-Point               → thiếu material_inspections
--   · Luồng nhập 4 bước, xuất 6 bước     → thiếu receipts/issues
--   · Kiểm kê, điều chỉnh                → thiếu counts/adjustments
--   · Truy xuất Cuộn → Bàn cắt           → thiếu khoá ngoại cut_tickets.roll_id
--
-- ─── BA NGUYÊN TẮC CỦA FILE NÀY ────────────────────────────────────────────
-- 1. IDEMPOTENT — chạy lại nhiều lần vẫn ra cùng một kết quả.
-- 2. KHÔNG XOÁ DỮ LIỆU, không DROP bảng nào. Bảng cũ (`inventory`,
--    `warehouse_transactions`) giữ nguyên; phần dưới có bước CHÉP dữ liệu sang
--    cấu trúc mới chứ không thay thế.
-- 3. CHỈ NỚI RỘNG ràng buộc, không thu hẹp — mọi dòng đang có phải còn hợp lệ.
--
-- ─── VÌ SAO CÔNG THỨC NẰM Ở SQL ────────────────────────────────────────────
-- `available` là CỘT SINH TỰ ĐỘNG. Tính ở tầng giao diện thì bảng tồn kho và
-- báo cáo sẽ có ngày ra hai con số khác nhau — trong kho, lệch một con số nghĩa
-- là hoặc cắt thiếu vải, hoặc mua thừa. Đặt ở DB thì chỉ có đúng một sự thật.
--
-- CHẠY: dán toàn bộ vào Supabase Dashboard > SQL Editor > Run.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- 1. SƠ ĐỒ VỊ TRÍ KHO: KHO → KHU → KỆ → Ô
-- ════════════════════════════════════════════════════════════════════════════
-- Tách bốn cấp thay vì nhét một chuỗi "A-01-03" vào một cột: chuỗi thì không
-- lọc được "còn ô trống ở khu A", không tính được sức chứa, và mỗi người gõ
-- một kiểu dấu phân cách.

CREATE TABLE IF NOT EXISTS public.warehouses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code        VARCHAR(20)  UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  address     TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wh_zones (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id  UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  code          VARCHAR(20)  NOT NULL,
  name          VARCHAR(255) NOT NULL,
  -- Khu vực chuyên dụng: vải cuộn cần kệ cao, phụ liệu cần kệ nhiều tầng nhỏ,
  -- hàng chờ kiểm phải tách riêng để không bị lấy nhầm khi chưa đạt QA.
  zone_type     VARCHAR(20) NOT NULL DEFAULT 'GENERAL'
                CHECK (zone_type IN ('GENERAL','FABRIC','ACCESSORY','QUARANTINE','STAGING','SCRAP')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT wh_zones_unique UNIQUE (warehouse_id, code)
);

CREATE TABLE IF NOT EXISTS public.wh_racks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id     UUID NOT NULL REFERENCES public.wh_zones(id) ON DELETE CASCADE,
  code        VARCHAR(20) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT wh_racks_unique UNIQUE (zone_id, code)
);

CREATE TABLE IF NOT EXISTS public.wh_bins (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rack_id      UUID NOT NULL REFERENCES public.wh_racks(id) ON DELETE CASCADE,
  code         VARCHAR(20) NOT NULL,
  level_no     INTEGER,
  -- Sức chứa để cảnh báo trước khi thủ kho khiêng hàng tới nơi mới biết đầy.
  -- NULL = chưa khai, KHÔNG phải bằng không.
  capacity_qty NUMERIC(14,3),
  capacity_uom VARCHAR(20),
  is_blocked   BOOLEAN NOT NULL DEFAULT FALSE,
  block_reason TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT wh_bins_unique UNIQUE (rack_id, code)
);

-- Đường dẫn đầy đủ "WH1 · A · R02 · B03" dựng sẵn thành VIEW để giao diện khỏi
-- phải nối bốn bảng ở mọi chỗ cần hiện vị trí.
CREATE OR REPLACE VIEW public.v_bin_path AS
SELECT b.id            AS bin_id,
       w.id            AS warehouse_id,
       z.id            AS zone_id,
       r.id            AS rack_id,
       w.code          AS warehouse_code,
       z.code          AS zone_code,
       z.zone_type     AS zone_type,
       r.code          AS rack_code,
       b.code          AS bin_code,
       b.is_blocked    AS is_blocked,
       w.code || ' · ' || z.code || ' · ' || r.code || ' · ' || b.code AS full_path
FROM public.wh_bins b
JOIN public.wh_racks  r ON r.id = b.rack_id
JOIN public.wh_zones  z ON z.id = r.zone_id
JOIN public.warehouses w ON w.id = z.warehouse_id;


-- ════════════════════════════════════════════════════════════════════════════
-- 2. NHÀ CUNG CẤP & ĐƠN MUA
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.suppliers (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_code   VARCHAR(50)  UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  contact_person  VARCHAR(255),
  phone           VARCHAR(50),
  email           VARCHAR(255),
  country         VARCHAR(100),
  address         TEXT,
  -- Chỉ số đánh giá lưu sẵn, tính lại theo lô. NULL = CHƯA TỪNG TÍNH, khác hẳn
  -- với 0 (đã tính và thật sự bằng không).
  kpi_on_time_rate  NUMERIC(5,2),
  kpi_quality_rate  NUMERIC(5,2),
  kpi_updated_at    TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_no          VARCHAR(50) UNIQUE NOT NULL,
  supplier_id    UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  -- Mua cho đơn hàng nào. NULL = mua dự trữ chung, hợp lệ.
  order_id       UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  eta_date       DATE,
  currency       VARCHAR(10) DEFAULT 'USD',
  status         VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                 CHECK (status IN ('DRAFT','SENT','CONFIRMED','PARTIAL','RECEIVED','CANCELLED')),
  notes          TEXT,
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id          UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  material_id    UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  ordered_qty    NUMERIC(14,3) NOT NULL CHECK (ordered_qty > 0),
  received_qty   NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  unit_price     NUMERIC(14,4),
  uom            VARCHAR(20) NOT NULL,
  -- Còn phải về bao nhiêu: cột sinh tự động, không thể lệch với hai cột trên.
  -- GREATEST(...,0) để nhận thừa không ra số âm gây hiểu nhầm là còn nợ hàng.
  outstanding_qty NUMERIC(14,3) GENERATED ALWAYS AS (GREATEST(ordered_qty - received_qty, 0)) STORED,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ════════════════════════════════════════════════════════════════════════════
-- 3. MỞ RỘNG BẢNG CŨ — CHỈ THÊM CỘT, KHÔNG SỬA CỘT ĐANG CÓ
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS supplier_id     UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  -- Phân loại phụ liệu chi tiết (§10): thun, nhãn chính, nhãn sườn, thẻ bài...
  ADD COLUMN IF NOT EXISTS sub_category    VARCHAR(30),
  ADD COLUMN IF NOT EXISTS color_code      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS size_code       VARCHAR(30),
  -- Đơn giá để định giá tồn kho. NULL = chưa khai → giao diện hiện "—".
  ADD COLUMN IF NOT EXISTS unit_price      NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS currency        VARCHAR(10) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS barcode         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER,
  ADD COLUMN IF NOT EXISTS is_active       BOOLEAN NOT NULL DEFAULT TRUE;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='materials_sub_category_valid') THEN
    ALTER TABLE public.materials ADD CONSTRAINT materials_sub_category_valid
      CHECK (sub_category IS NULL OR sub_category IN (
        'ELASTIC','MAIN_LABEL','SIDE_LABEL','HANGTAG','BUTTON','HOOK','ZIPPER',
        'TAPE','CARTON','POLYBAG','THREAD','NEEDLE','INTERLINING','VELCRO','OTHER'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_materials_barcode
  ON public.materials(barcode) WHERE barcode IS NOT NULL;

-- ─── Lô nguyên phụ liệu ─────────────────────────────────────────────────────
-- Xen giữa vật tư và cuộn. Vải cùng mã nhưng khác lô nhuộm là khác tông màu —
-- cắt lẫn lô trên cùng một bàn là lỗi không sửa được sau khi đã cắt.
CREATE TABLE IF NOT EXISTS public.material_lots (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id   UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  lot_no        VARCHAR(100) NOT NULL,
  supplier_id   UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  po_id         UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  received_date DATE,
  expiry_date   DATE,
  shade_code    VARCHAR(50),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT material_lots_unique UNIQUE (material_id, lot_no)
);

-- ─── Cuộn vải: bổ sung thông số kỹ thuật (§9) ───────────────────────────────
ALTER TABLE public.fabric_rolls
  ADD COLUMN IF NOT EXISTS lot_id            UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bin_id            UUID REFERENCES public.wh_bins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS width_m           NUMERIC(8,3),
  ADD COLUMN IF NOT EXISTS gsm               NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS weight_kg         NUMERIC(10,3),
  -- Điểm 4-Point: dưới 20 điểm/100 yard vuông là chuẩn thông dụng của ngành.
  ADD COLUMN IF NOT EXISTS four_point_score  NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS qa_status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  -- Xả vải: vải dệt kim co lại sau khi tháo cuộn, cắt ngay là ra sản phẩm hụt.
  ADD COLUMN IF NOT EXISTS relaxation_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN IF NOT EXISTS relaxed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS barcode           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS notes             TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fabric_rolls_qa_status_valid') THEN
    ALTER TABLE public.fabric_rolls ADD CONSTRAINT fabric_rolls_qa_status_valid
      CHECK (qa_status IN ('PENDING','PASSED','FAILED','CONDITIONAL'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fabric_rolls_relaxation_valid') THEN
    ALTER TABLE public.fabric_rolls ADD CONSTRAINT fabric_rolls_relaxation_valid
      CHECK (relaxation_status IN ('NOT_REQUIRED','WAITING','DONE'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fabric_rolls_barcode
  ON public.fabric_rolls(barcode) WHERE barcode IS NOT NULL;

-- ─── Truy xuất nguồn gốc: nối Cuộn → Bàn cắt (§14) ──────────────────────────
-- Đây chính là mắt xích đang đứt. Không có nó thì khi khách khiếu nại lỗi vải
-- trên một lô hàng, không lần ngược được là cuộn nào, lô nào, nhà cung cấp nào.
ALTER TABLE public.cut_tickets
  ADD COLUMN IF NOT EXISTS roll_id     UUID REFERENCES public.fabric_rolls(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lot_id      UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL;


-- ════════════════════════════════════════════════════════════════════════════
-- 4. TỒN KHO THEO VỊ TRÍ — TRÁI TIM CỦA PHÂN HỆ
-- ════════════════════════════════════════════════════════════════════════════
-- `materials.stock_qty` là MỘT con số cho cả nhà máy, giữ nguyên không đụng tới
-- để mọi màn hình cũ còn chạy. Bảng dưới đây mới là tồn kho thật: tách theo
-- vật tư × lô × ô kệ, và tách được ba trạng thái mà một cột không bao giờ tách nổi.

CREATE TABLE IF NOT EXISTS public.stock_levels (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id   UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  lot_id        UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
  bin_id        UUID REFERENCES public.wh_bins(id) ON DELETE SET NULL,
  uom           VARCHAR(20) NOT NULL,

  on_hand_qty       NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (on_hand_qty       >= 0),
  reserved_qty      NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (reserved_qty      >= 0),
  in_inspection_qty NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (in_inspection_qty >= 0),
  blocked_qty       NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (blocked_qty       >= 0),

  -- CÓ SẴN = tồn thực tế − giữ chỗ − đang chờ kiểm − bị khoá.
  -- Cột SINH TỰ ĐỘNG: bảng tồn kho, màn hình cấp phát và báo cáo giám đốc đều
  -- đọc đúng con số này, không thể có chuyện ba nơi ra ba kết quả.
  -- GREATEST(...,0) chặn số âm khi dữ liệu cũ chưa chuẩn.
  available_qty NUMERIC(14,3) GENERATED ALWAYS AS (
                  GREATEST(on_hand_qty - reserved_qty - in_inspection_qty - blocked_qty, 0)
                ) STORED,

  last_counted_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Mỗi tổ hợp vật tư × lô × ô chỉ được có ĐÚNG MỘT dòng. Hai dòng cho cùng một ô
-- là mở đường cho cộng trùng và lệch tồn.
-- COALESCE vì UNIQUE bỏ qua NULL: không có nó thì mười dòng cùng vật tư mà chưa
-- gán lô/ô vẫn được coi là mười tổ hợp khác nhau.
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_levels_unique
  ON public.stock_levels (
    material_id,
    COALESCE(lot_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(bin_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE INDEX IF NOT EXISTS idx_stock_levels_material ON public.stock_levels(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_bin      ON public.stock_levels(bin_id);

-- ─── Giữ chỗ ────────────────────────────────────────────────────────────────
-- Giữ chỗ KHÔNG làm giảm tồn thực tế, chỉ giảm phần có sẵn. Hàng vẫn nằm trong
-- kho, chỉ là đã có chủ. Nhầm hai khái niệm này là nguồn gốc của cảnh "sổ sách
-- còn hàng mà xuống kho không có gì để lấy".
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id   UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  lot_id        UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
  order_id      UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  cut_ticket_id UUID REFERENCES public.cut_tickets(id) ON DELETE SET NULL,
  reserved_qty  NUMERIC(14,3) NOT NULL CHECK (reserved_qty > 0),
  uom           VARCHAR(20) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE','ALLOCATED','CONSUMED','RELEASED','EXPIRED')),
  needed_date   DATE,
  released_at   TIMESTAMPTZ,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reservations_material ON public.stock_reservations(material_id);
CREATE INDEX IF NOT EXISTS idx_reservations_order    ON public.stock_reservations(order_id);


-- ════════════════════════════════════════════════════════════════════════════
-- 5. LUỒNG NHẬP HÀNG (§11)
-- ════════════════════════════════════════════════════════════════════════════
-- PO Thu mua → Hàng về → Kiểm QA → Cất vào vị trí → Có sẵn.
-- Mỗi bước ghi một dòng riêng, KHÔNG sửa đè trạng thái bước trước: khi truy lại
-- phải biết hàng nằm ở khâu kiểm bao lâu, ai cất, cất lúc mấy giờ.

CREATE TABLE IF NOT EXISTS public.inbound_receipts (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_no     VARCHAR(50) UNIQUE NOT NULL,
  po_id          UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  supplier_id    UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  warehouse_id   UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  received_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_no     VARCHAR(100),
  packing_list_no VARCHAR(100),
  status         VARCHAR(20) NOT NULL DEFAULT 'ARRIVED'
                 CHECK (status IN ('ARRIVED','INSPECTING','PUT_AWAY','COMPLETED','REJECTED','CANCELLED')),
  evidence_path  VARCHAR(500),
  notes          TEXT,
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inbound_receipt_items (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id    UUID NOT NULL REFERENCES public.inbound_receipts(id) ON DELETE CASCADE,
  material_id   UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  lot_id        UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
  bin_id        UUID REFERENCES public.wh_bins(id) ON DELETE SET NULL,
  uom           VARCHAR(20) NOT NULL,

  -- Ba con số phải tách bạch: khai trên chứng từ, đếm thực tế, và bị loại sau
  -- khi kiểm. Gộp thành một cột là mất luôn bằng chứng khi tranh chấp với NCC.
  declared_qty  NUMERIC(14,3) NOT NULL CHECK (declared_qty >= 0),
  received_qty  NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  rejected_qty  NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (rejected_qty >= 0),
  accepted_qty  NUMERIC(14,3) GENERATED ALWAYS AS (GREATEST(received_qty - rejected_qty, 0)) STORED,
  -- Chênh lệch so với chứng từ. ÂM là thiếu, DƯƠNG là thừa — cố ý không bọc
  -- GREATEST ở đây, vì thiếu hàng là thứ bắt buộc phải nhìn thấy.
  variance_qty  NUMERIC(14,3) GENERATED ALWAYS AS (received_qty - declared_qty) STORED,

  put_away_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inbound_items_receipt ON public.inbound_receipt_items(receipt_id);


-- ════════════════════════════════════════════════════════════════════════════
-- 6. KIỂM HÀNG QA — HỆ 4 ĐIỂM (§15)
-- ════════════════════════════════════════════════════════════════════════════
-- Hệ 4 điểm là chuẩn thông dụng của ngành dệt may: lỗi ≤3 inch tính 1 điểm,
-- 3–6 inch 2 điểm, 6–9 inch 3 điểm, trên 9 inch 4 điểm. Quy về điểm trên 100
-- yard vuông rồi so với ngưỡng chấp nhận (thường là 20).

CREATE TABLE IF NOT EXISTS public.material_inspections (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_no    VARCHAR(50) UNIQUE NOT NULL,
  receipt_item_id  UUID REFERENCES public.inbound_receipt_items(id) ON DELETE CASCADE,
  material_id      UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  lot_id           UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
  roll_id          UUID REFERENCES public.fabric_rolls(id) ON DELETE SET NULL,

  inspected_qty    NUMERIC(14,3) NOT NULL CHECK (inspected_qty > 0),
  uom              VARCHAR(20) NOT NULL,

  -- Bốn nhóm điểm lỗi theo chiều dài vết lỗi
  points_1         INTEGER NOT NULL DEFAULT 0 CHECK (points_1 >= 0),
  points_2         INTEGER NOT NULL DEFAULT 0 CHECK (points_2 >= 0),
  points_3         INTEGER NOT NULL DEFAULT 0 CHECK (points_3 >= 0),
  points_4         INTEGER NOT NULL DEFAULT 0 CHECK (points_4 >= 0),
  -- Tổng điểm phạt: công thức nằm ở DB nên phiếu kiểm và báo cáo không thể lệch
  total_points     INTEGER GENERATED ALWAYS AS (points_1*1 + points_2*2 + points_3*3 + points_4*4) STORED,

  inspected_area_sqyd NUMERIC(14,3),
  acceptance_limit    NUMERIC(8,2) NOT NULL DEFAULT 20,

  -- Bốn phép thử còn lại của đề bài
  shade_variation  VARCHAR(20) CHECK (shade_variation IS NULL OR shade_variation IN ('OK','SLIGHT','SEVERE')),
  shrinkage_pct    NUMERIC(6,2),
  color_fastness   INTEGER CHECK (color_fastness IS NULL OR color_fastness BETWEEN 1 AND 5),
  yarn_defect_note TEXT,

  result           VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                   CHECK (result IN ('PENDING','PASSED','FAILED','CONDITIONAL')),
  reject_reason    TEXT,
  evidence_path    VARCHAR(500),
  inspected_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  inspected_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inspections_material ON public.material_inspections(material_id);

-- Điểm trên 100 yard vuông + kết luận theo ngưỡng. Để ở view thay vì cột sinh
-- tự động vì phép chia cần chặn mẫu số 0, mà cột sinh tự động không cho phép
-- biểu thức có điều kiện phức tạp trên nhiều cột NULL.
CREATE OR REPLACE VIEW public.v_inspection_score AS
SELECT i.*,
       CASE WHEN COALESCE(i.inspected_area_sqyd,0) > 0
            THEN ROUND(i.total_points * 100.0 / i.inspected_area_sqyd, 2)
            ELSE NULL END AS points_per_100sqyd,
       CASE WHEN COALESCE(i.inspected_area_sqyd,0) <= 0 THEN NULL
            WHEN i.total_points * 100.0 / i.inspected_area_sqyd <= i.acceptance_limit THEN TRUE
            ELSE FALSE END AS within_limit
FROM public.material_inspections i;


-- ════════════════════════════════════════════════════════════════════════════
-- 7. LUỒNG XUẤT KHO (§12)
-- ════════════════════════════════════════════════════════════════════════════
-- Lệnh SX → Giữ chỗ → Phân bổ → Soạn hàng → Quét mã → Xuất → Giao tổ cắt/may.

CREATE TABLE IF NOT EXISTS public.outbound_issues (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_no       VARCHAR(50) UNIQUE NOT NULL,
  order_id       UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  cut_ticket_id  UUID REFERENCES public.cut_tickets(id) ON DELETE SET NULL,
  warehouse_id   UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  -- Giao cho bộ phận nào: khớp mã bộ phận trong bảng departments (CUT, SEW...)
  issue_to_dept  VARCHAR(20),
  issue_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  status         VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'
                 CHECK (status IN ('REQUESTED','ALLOCATED','PICKING','PICKED','ISSUED','CANCELLED')),
  issue_type     VARCHAR(20) NOT NULL DEFAULT 'PRODUCTION'
                 CHECK (issue_type IN ('PRODUCTION','SAMPLE','REPLACEMENT','SUBCON','SCRAP','OTHER')),
  notes          TEXT,
  picked_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  issued_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  issued_at      TIMESTAMPTZ,
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outbound_issue_items (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id       UUID NOT NULL REFERENCES public.outbound_issues(id) ON DELETE CASCADE,
  material_id    UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  lot_id         UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
  roll_id        UUID REFERENCES public.fabric_rolls(id) ON DELETE SET NULL,
  bin_id         UUID REFERENCES public.wh_bins(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.stock_reservations(id) ON DELETE SET NULL,
  uom            VARCHAR(20) NOT NULL,

  requested_qty  NUMERIC(14,3) NOT NULL CHECK (requested_qty > 0),
  picked_qty     NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (picked_qty >= 0),
  issued_qty     NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (issued_qty >= 0),
  -- Cấp thiếu bao nhiêu so với yêu cầu. Đây là con số nuôi cảnh báo "Thiếu hụt
  -- vật tư" ở cột phải của Command Center.
  shortage_qty   NUMERIC(14,3) GENERATED ALWAYS AS (GREATEST(requested_qty - issued_qty, 0)) STORED,

  scanned_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_outbound_items_issue ON public.outbound_issue_items(issue_id);


-- ════════════════════════════════════════════════════════════════════════════
-- 8. KIỂM KÊ & ĐIỀU CHỈNH
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.stock_counts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  count_no      VARCHAR(50) UNIQUE NOT NULL,
  warehouse_id  UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  zone_id       UUID REFERENCES public.wh_zones(id) ON DELETE SET NULL,
  count_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  count_type    VARCHAR(20) NOT NULL DEFAULT 'CYCLE'
                CHECK (count_type IN ('CYCLE','FULL','SPOT')),
  status        VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                CHECK (status IN ('OPEN','COUNTING','REVIEW','POSTED','CANCELLED')),
  notes         TEXT,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  posted_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  posted_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_count_items (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  count_id      UUID NOT NULL REFERENCES public.stock_counts(id) ON DELETE CASCADE,
  material_id   UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  lot_id        UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
  bin_id        UUID REFERENCES public.wh_bins(id) ON DELETE SET NULL,
  uom           VARCHAR(20) NOT NULL,
  -- Tồn sổ sách chốt tại thời điểm bắt đầu đếm. Phải LƯU LẠI chứ không đọc
  -- động: sổ sách thay đổi trong lúc đang đếm thì chênh lệch tính ra vô nghĩa.
  system_qty    NUMERIC(14,3) NOT NULL,
  counted_qty   NUMERIC(14,3),
  variance_qty  NUMERIC(14,3) GENERATED ALWAYS AS (COALESCE(counted_qty,0) - system_qty) STORED,
  counted_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  counted_at    TIMESTAMPTZ,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_count_items_count ON public.stock_count_items(count_id);

CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  adjustment_no VARCHAR(50) UNIQUE NOT NULL,
  material_id   UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  lot_id        UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
  bin_id        UUID REFERENCES public.wh_bins(id) ON DELETE SET NULL,
  count_id      UUID REFERENCES public.stock_counts(id) ON DELETE SET NULL,
  uom           VARCHAR(20) NOT NULL,
  -- Dương là tăng, âm là giảm. KHÔNG cho phép bằng 0: một phiếu điều chỉnh
  -- không đổi gì chỉ làm nhiễu vệt kiểm toán.
  adjust_qty    NUMERIC(14,3) NOT NULL CHECK (adjust_qty <> 0),
  reason_code   VARCHAR(30) NOT NULL
                CHECK (reason_code IN ('COUNT_VARIANCE','DAMAGE','LOSS','FOUND','EXPIRY','RECLASSIFY','OTHER')),
  -- Lý do bằng lời BẮT BUỘC: điều chỉnh tồn là thao tác dễ bị lạm dụng nhất
  -- trong kho, không có lời giải thích thì kiểm toán không kết luận được gì.
  reason_note   TEXT NOT NULL,
  approved_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at   TIMESTAMPTZ,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ════════════════════════════════════════════════════════════════════════════
-- 9. SỔ CÁI BIẾN ĐỘNG (§16) — MỌI THỨ ĐỀU CHẢY QUA ĐÂY
-- ════════════════════════════════════════════════════════════════════════════
-- Bảng `warehouse_transactions` cũ chỉ có IN/OUT phẳng, giữ nguyên không đụng.
-- Bảng này là sổ cái đầy đủ: mỗi biến động một dòng, CHỈ THÊM không bao giờ sửa.
-- Nhờ vậy tồn kho tại bất kỳ thời điểm nào trong quá khứ đều dựng lại được.

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id             BIGSERIAL PRIMARY KEY,
  movement_type  VARCHAR(20) NOT NULL
                 CHECK (movement_type IN (
                   'RECEIPT','INSPECTION_HOLD','INSPECTION_RELEASE','PUT_AWAY',
                   'RESERVE','UNRESERVE','ALLOCATE','PICK','ISSUE',
                   'RETURN','TRANSFER_OUT','TRANSFER_IN','ADJUST','SCRAP','COUNT')),
  material_id    UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  lot_id         UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
  roll_id        UUID REFERENCES public.fabric_rolls(id) ON DELETE SET NULL,
  from_bin_id    UUID REFERENCES public.wh_bins(id) ON DELETE SET NULL,
  to_bin_id      UUID REFERENCES public.wh_bins(id) ON DELETE SET NULL,
  -- Dương là vào kho, âm là ra khỏi kho. Một cột có dấu thay vì hai cột
  -- nhập/xuất: cộng dồn ra tồn kho chỉ bằng một phép SUM, không phải trừ chéo.
  qty            NUMERIC(14,3) NOT NULL CHECK (qty <> 0),
  uom            VARCHAR(20) NOT NULL,

  -- Chứng từ gốc sinh ra biến động này
  ref_table      VARCHAR(50),
  ref_id         UUID,
  order_id       UUID REFERENCES public.orders(id) ON DELETE SET NULL,

  note           TEXT,
  actor_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role     VARCHAR(50),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_movements_material ON public.stock_movements(material_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_ref      ON public.stock_movements(ref_table, ref_id);
CREATE INDEX IF NOT EXISTS idx_movements_order    ON public.stock_movements(order_id);

-- ─── Vệt kiểm toán riêng cho kho (§23) ──────────────────────────────────────
-- `activity_log` của phân hệ MD dùng cho thực thể nghiệp vụ; kho cần thêm LÝ DO
-- bắt buộc và giá trị cũ/mới cho từng thao tác nhạy cảm.
CREATE TABLE IF NOT EXISTS public.wh_audit_log (
  id           BIGSERIAL PRIMARY KEY,
  entity_type  VARCHAR(50) NOT NULL,
  entity_id    UUID,
  action       VARCHAR(20) NOT NULL
               CHECK (action IN ('CREATE','UPDATE','DELETE','APPROVE','REJECT','POST','TRANSFER','SCRAP')),
  -- Chỉ ghi phần THAY ĐỔI, không chép nguyên bản ghi: chép cả dòng mỗi lần sửa
  -- một ô sẽ khiến nhật ký phình rất nhanh mà tra lại vẫn phải tự so từng cột.
  changes      JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason       TEXT,
  actor_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role   VARCHAR(50),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wh_audit_entity ON public.wh_audit_log(entity_type, entity_id);


-- ════════════════════════════════════════════════════════════════════════════
-- 10. VAI TRÒ KHO (§22)
-- ════════════════════════════════════════════════════════════════════════════
-- Thêm ba vai trò còn thiếu. KHÔNG đụng tới vai trò `kho` đang có — tài khoản
-- hiện tại vẫn đăng nhập và vào /kho bình thường.
--
-- ⚠️ Bảng `roles` chỉ là DANH MỤC. Quyền vào route do lib/rbac.ts quyết định và
-- vai trò thật nằm ở app_metadata của tài khoản. Chạy file này xong PHẢI cập
-- nhật ALL_ROLES, ROLE_LABEL và ma trận quyền trong lib/rbac.ts thì ba vai trò
-- mới có tác dụng.

INSERT INTO public.roles (code, name, description) VALUES
  ('khotruong',   'Tổ trưởng Kho',   'Điều phối nhập xuất, duyệt điều chỉnh tồn, phân công soạn hàng'),
  ('thukho',      'Thủ kho',         'Nhận hàng, cất kho, soạn hàng, xuất kho theo lệnh'),
  ('ketoanvattu', 'Kế toán vật tư',  'Định giá tồn kho, đối chiếu kiểm kê, khoá sổ kỳ')
ON CONFLICT (code) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- 11. CHÉP DỮ LIỆU CŨ SANG CẤU TRÚC MỚI — KHÔNG XOÁ GÌ
-- ════════════════════════════════════════════════════════════════════════════
-- Bốn vật tư và hai cuộn đang có phải xuất hiện được trên màn hình mới ngay,
-- nếu không thì mở /kho lên sẽ thấy trống trơn và tưởng là hỏng.

-- Kho mặc định, để dữ liệu cũ có chỗ neo
INSERT INTO public.warehouses (code, name)
VALUES ('WH-MAIN', 'Kho chính')
ON CONFLICT (code) DO NOTHING;

-- Ba khu tối thiểu: vải, phụ liệu, và khu cách ly hàng chờ kiểm
INSERT INTO public.wh_zones (warehouse_id, code, name, zone_type)
SELECT w.id, z.code, z.name, z.zone_type
FROM public.warehouses w
CROSS JOIN (VALUES
  ('A', 'Khu vải',              'FABRIC'),
  ('B', 'Khu phụ liệu',         'ACCESSORY'),
  ('Q', 'Khu chờ kiểm (cách ly)','QUARANTINE')
) AS z(code, name, zone_type)
WHERE w.code = 'WH-MAIN'
ON CONFLICT (warehouse_id, code) DO NOTHING;

-- Mỗi khu một kệ và một ô mặc định, đủ để dữ liệu cũ có vị trí hợp lệ
INSERT INTO public.wh_racks (zone_id, code)
SELECT z.id, 'R01' FROM public.wh_zones z
JOIN public.warehouses w ON w.id = z.warehouse_id AND w.code = 'WH-MAIN'
ON CONFLICT (zone_id, code) DO NOTHING;

INSERT INTO public.wh_bins (rack_id, code, level_no)
SELECT r.id, 'B01', 1 FROM public.wh_racks r
ON CONFLICT (rack_id, code) DO NOTHING;

-- Chuyển materials.stock_qty thành dòng tồn kho thật.
-- Vải vào khu A, còn lại vào khu B. Toàn bộ coi là CÓ SẴN vì trước nay chưa hề
-- có khái niệm giữ chỗ — đó là sự thật của dữ liệu cũ, không phải phỏng đoán.
INSERT INTO public.stock_levels (material_id, bin_id, uom, on_hand_qty)
SELECT m.id,
       (SELECT b.id FROM public.wh_bins b
          JOIN public.wh_racks  r ON r.id = b.rack_id
          JOIN public.wh_zones  z ON z.id = r.zone_id
          JOIN public.warehouses w ON w.id = z.warehouse_id
         WHERE w.code = 'WH-MAIN'
           AND z.code = CASE WHEN m.category = 'FABRIC' THEN 'A' ELSE 'B' END
         LIMIT 1),
       COALESCE(m.unit, 'PCS'),
       COALESCE(m.stock_qty, 0)
FROM public.materials m
WHERE NOT EXISTS (SELECT 1 FROM public.stock_levels s WHERE s.material_id = m.id);

-- Cuộn đang có: gán vào ô khu A và đánh dấu ĐÃ ĐẠT.
-- Lý do đánh PASSED chứ không PENDING: chúng đang ở trạng thái IN_STOCK, tức
-- trên thực tế đã được nhận vào kho từ trước. Để PENDING sẽ tạo ra hai cảnh báo
-- "chờ kiểm" giả ngay khi vừa mở màn hình mới.
UPDATE public.fabric_rolls fr
SET bin_id = (SELECT b.id FROM public.wh_bins b
                JOIN public.wh_racks  r ON r.id = b.rack_id
                JOIN public.wh_zones  z ON z.id = r.zone_id
                JOIN public.warehouses w ON w.id = z.warehouse_id
               WHERE w.code = 'WH-MAIN' AND z.code = 'A' LIMIT 1),
    qa_status = 'PASSED'
WHERE fr.bin_id IS NULL AND fr.status = 'IN_STOCK';


-- ════════════════════════════════════════════════════════════════════════════
-- 12. KHOÁ RLS — MỌI BẢNG MỚI CHỈ CHO NGƯỜI ĐÃ ĐĂNG NHẬP
-- ════════════════════════════════════════════════════════════════════════════
-- Cùng khuôn với migration 010. Bỏ sót một bảng là mở một lỗ thủng đúng bằng
-- toàn bộ dữ liệu bảng đó cho người chưa đăng nhập.

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'warehouses','wh_zones','wh_racks','wh_bins',
    'suppliers','purchase_orders','purchase_order_items',
    'material_lots','stock_levels','stock_reservations',
    'inbound_receipts','inbound_receipt_items','material_inspections',
    'outbound_issues','outbound_issue_items',
    'stock_counts','stock_count_items','stock_adjustments',
    'stock_movements','wh_audit_log'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE  ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_only" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "authenticated_only" ON public.%I FOR ALL TO authenticated '
      'USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

GRANT USAGE, SELECT ON SEQUENCE public.stock_movements_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.wh_audit_log_id_seq    TO authenticated;

-- View kế thừa quyền của bảng gốc; cấp SELECT để PostgREST đọc được.
GRANT SELECT ON public.v_bin_path          TO authenticated;
GRANT SELECT ON public.v_inspection_score  TO authenticated;
REVOKE ALL ON public.v_bin_path            FROM anon;
REVOKE ALL ON public.v_inspection_score    FROM anon;


-- ════════════════════════════════════════════════════════════════════════════
-- 13. KIỂM CHỨNG — chạy xong phải thấy đủ, nếu thiếu thì dừng lại
-- ════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE missing INT; unlocked INT;
BEGIN
  SELECT COUNT(*) INTO missing
  FROM unnest(ARRAY[
    'warehouses','wh_zones','wh_racks','wh_bins','suppliers','purchase_orders',
    'purchase_order_items','material_lots','stock_levels','stock_reservations',
    'inbound_receipts','inbound_receipt_items','material_inspections',
    'outbound_issues','outbound_issue_items','stock_counts','stock_count_items',
    'stock_adjustments','stock_movements','wh_audit_log'
  ]) AS x(t)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_tables p WHERE p.schemaname='public' AND p.tablename = x.t);

  IF missing > 0 THEN
    RAISE EXCEPTION 'Còn % bảng chưa tạo được', missing;
  END IF;

  SELECT COUNT(*) INTO unlocked
  FROM pg_tables p
  WHERE p.schemaname = 'public'
    AND p.tablename IN ('stock_levels','stock_movements','wh_audit_log','material_inspections')
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies g
      WHERE g.schemaname='public' AND g.tablename=p.tablename
        AND g.policyname='authenticated_only');

  IF unlocked > 0 THEN
    RAISE EXCEPTION 'Còn % bảng kho chưa khoá RLS', unlocked;
  END IF;

  RAISE NOTICE 'OK: 20 bảng kho đã tạo và đã khoá RLS về authenticated.';
END $$;

-- Xem lại kết quả chép dữ liệu cũ. Nên thấy 4 dòng tồn kho và 2 cuộn có vị trí.
SELECT 'stock_levels' AS bang, COUNT(*) AS so_dong FROM public.stock_levels
UNION ALL SELECT 'fabric_rolls đã có vị trí', COUNT(*) FROM public.fabric_rolls WHERE bin_id IS NOT NULL
UNION ALL SELECT 'wh_bins',     COUNT(*) FROM public.wh_bins
UNION ALL SELECT 'vai trò kho', COUNT(*) FROM public.roles WHERE code IN ('kho','khotruong','thukho','ketoanvattu');
