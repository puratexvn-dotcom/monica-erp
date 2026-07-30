-- ============================================================================
-- MONICA GARMENT ERP — 015: NỀN DỮ LIỆU VÒNG ĐỜI ĐƠN HÀNG (MERCHANDISER)
--
-- Khảo sát trước khi viết (dò thật bằng service key):
--   ĐÃ CÓ : customers(0) orders(2) order_items(0) materials(4)
--           material_requests(0) production_orders(0) shipments(0) cartons(2)
--           qa_audit_reports(2) qa_defects(3) sewing_lines(3) cut_tickets(1)
--           hourly_production_logs(1) system_logs(4) attachments(0)
--           bom(10) samples(7)  <- hai bảng thời demo, khoá theo order_id
--   THIẾU : styles, style_colorways, style_sizes, style_operations, style_bom,
--           seasons, customer_contacts, inquiries, costings, costing_items,
--           order_size_breakdown, ta_templates, ta_template_items,
--           order_milestones, sample_submissions, md_comments,
--           change_requests, md_documents, risk_assessments, activity_log
--
-- BA QUYẾT ĐỊNH KIẾN TRÚC
--  1. MÃ HÀNG là trung tâm. BOM/định mức/SAM gắn vào `styles`, KHÔNG gắn vào PO.
--     Nhu cầu NPL của một PO = style_bom × số lượng PO, tính ra chứ không nhập
--     lại — đúng nguyên tắc không nhập dữ liệu hai lần.
--  2. KHÔNG đụng `bom` và `samples` cũ (đang có dữ liệu và đang được
--     md-legacy-client.tsx dùng). Bảng mới đặt tên khác: style_bom,
--     sample_submissions. Ai muốn chuyển dữ liệu cũ sang thì làm ở migration
--     riêng, không trộn vào đây.
--  3. `attachments` rỗng nên không suy được cột; tạo md_documents chuyên dụng
--     thay vì đoán cấu trúc bảng cũ rồi ghi sai.
--
-- CHẠY: dán toàn bộ vào Supabase Dashboard > SQL Editor > Run.
-- Idempotent, KHÔNG xoá dữ liệu.
-- ============================================================================

-- ─── 0. DANH MỤC DÙNG CHUNG ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seasons (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code       VARCHAR(50) UNIQUE NOT NULL,
  name       VARCHAR(255) NOT NULL,
  year       INTEGER,
  start_date DATE,
  end_date   DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.seasons (code, name, year) VALUES
  ('SS26', 'Xuân Hè 2026', 2026),
  ('AW26', 'Thu Đông 2026', 2026),
  ('SS27', 'Xuân Hè 2027', 2027)
ON CONFLICT (code) DO NOTHING;

-- ─── 1. CRM ─────────────────────────────────────────────────────────────────
-- Mở rộng customers đã có. Giữ nguyên mọi cột cũ.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS brand          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS buyer_group    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS currency       VARCHAR(10)  DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS incoterm       VARCHAR(10)  DEFAULT 'FOB',
  ADD COLUMN IF NOT EXISTS payment_term   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS credit_limit   NUMERIC(16,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_code       VARCHAR(50),
  -- KPI lưu sẵn (cache): tính lại theo lô, không tính trong mỗi lần mở trang.
  -- Danh sách khách hàng phải mở tức thì, không thể quét toàn bộ PO mỗi lần.
  ADD COLUMN IF NOT EXISTS kpi_on_time_rate  NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS kpi_quality_rate  NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS kpi_lifetime_value NUMERIC(16,2),
  ADD COLUMN IF NOT EXISTS kpi_updated_at TIMESTAMPTZ;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customers_incoterm_valid') THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_incoterm_valid
      CHECK (incoterm IS NULL OR incoterm IN ('EXW','FCA','FOB','CFR','CIF','DAP','DDP'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  full_name   VARCHAR(255) NOT NULL,
  job_title   VARCHAR(255),
  department  VARCHAR(255),
  email       VARCHAR(255),
  phone       VARCHAR(50),
  is_primary  BOOLEAN DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. YÊU CẦU BÁO GIÁ (RFQ) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inquiries (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_no      VARCHAR(100) UNIQUE NOT NULL,
  customer_id     UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  season_id       UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  product_name    VARCHAR(255) NOT NULL,
  description     TEXT,
  expected_qty    INTEGER CHECK (expected_qty IS NULL OR expected_qty > 0),
  target_price    NUMERIC(12,4) CHECK (target_price IS NULL OR target_price >= 0),
  currency        VARCHAR(10) DEFAULT 'USD',
  order_type      VARCHAR(10) DEFAULT 'FOB'
                  CHECK (order_type IN ('FOB','CM','CMT','CMPT','CMPTH')),
  received_date   DATE DEFAULT CURRENT_DATE,
  due_date        DATE,
  status          VARCHAR(30) NOT NULL DEFAULT 'NEW'
                  CHECK (status IN ('NEW','COSTING','QUOTED','WON','LOST','CANCELLED')),
  notes           TEXT,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. CHIẾT TÍNH GIÁ (có phiên bản) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.costings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  costing_no    VARCHAR(100) NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  inquiry_id    UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  style_id      UUID,  -- FK gắn sau khi tạo bảng styles ở mục 4
  customer_id   UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_type    VARCHAR(10) NOT NULL DEFAULT 'FOB'
                CHECK (order_type IN ('FOB','CM','CMT','CMPT','CMPTH')),
  currency      VARCHAR(10) DEFAULT 'USD',
  quantity      INTEGER CHECK (quantity IS NULL OR quantity > 0),
  -- Giá bán chốt và lợi nhuận: lưu để đối chiếu về sau, vì đơn giá NPL
  -- và tỷ giá đều thay đổi theo thời gian.
  target_price  NUMERIC(12,4),
  quoted_price  NUMERIC(12,4),
  margin_percent NUMERIC(6,2),
  status        VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
                CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','REVISE','SUPERSEDED')),
  approved_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at   TIMESTAMPTZ,
  reject_reason TEXT,
  notes         TEXT,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  -- Mỗi số chiết tính chỉ có một bản cho mỗi phiên bản
  CONSTRAINT costings_no_version_unique UNIQUE (costing_no, version)
);

CREATE TABLE IF NOT EXISTS public.costing_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  costing_id  UUID NOT NULL REFERENCES public.costings(id) ON DELETE CASCADE,
  category    VARCHAR(30) NOT NULL
              CHECK (category IN ('FABRIC','TRIM','CM','PRINT_EMB','WASH','PACKING',
                                  'FREIGHT','OVERHEAD','COMMISSION','OTHER')),
  item_name   VARCHAR(255) NOT NULL,
  unit        VARCHAR(20),
  consumption NUMERIC(12,4) CHECK (consumption IS NULL OR consumption >= 0),
  unit_price  NUMERIC(12,4) CHECK (unit_price IS NULL OR unit_price >= 0),
  -- Thành tiền tính NGAY TRONG SQL, không tính ở tầng ứng dụng: cùng một công
  -- thức cho mọi nơi đọc, không sợ hai màn hình ra hai con số khác nhau.
  amount      NUMERIC(14,4) GENERATED ALWAYS AS
              (COALESCE(consumption,0) * COALESCE(unit_price,0)) STORED,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. MÃ HÀNG (STYLE MASTER) — TRUNG TÂM DỮ LIỆU ─────────────────────────
CREATE TABLE IF NOT EXISTS public.styles (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_no       VARCHAR(100) UNIQUE NOT NULL,
  style_name     VARCHAR(255) NOT NULL,
  customer_id    UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  season_id      UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  product_group  VARCHAR(100),
  gender         VARCHAR(20) CHECK (gender IS NULL OR gender IN ('MEN','WOMEN','KIDS','UNISEX')),
  hs_code        VARCHAR(50),
  fabric_type    VARCHAR(255),
  -- Kỹ thuật
  sam_minutes    NUMERIC(8,3) CHECK (sam_minutes IS NULL OR sam_minutes > 0),
  needle_type    VARCHAR(100),
  machine_types  TEXT,
  marker_code    VARCHAR(100),
  marker_length_m NUMERIC(10,3),
  marker_efficiency NUMERIC(5,2),
  tech_pack_url  TEXT,
  status         VARCHAR(30) NOT NULL DEFAULT 'DEVELOPMENT'
                 CHECK (status IN ('DEVELOPMENT','APPROVED','IN_PRODUCTION','DISCONTINUED')),
  notes          TEXT,
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Gắn FK costings.style_id sau khi styles đã tồn tại
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='costings_style_id_fkey') THEN
    ALTER TABLE public.costings
      ADD CONSTRAINT costings_style_id_fkey
      FOREIGN KEY (style_id) REFERENCES public.styles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.style_colorways (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id     UUID NOT NULL REFERENCES public.styles(id) ON DELETE CASCADE,
  color_code   VARCHAR(50) NOT NULL,
  color_name   VARCHAR(255) NOT NULL,
  pantone      VARCHAR(50),
  hex_preview  VARCHAR(7),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT style_colorways_unique UNIQUE (style_id, color_code)
);

CREATE TABLE IF NOT EXISTS public.style_sizes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id   UUID NOT NULL REFERENCES public.styles(id) ON DELETE CASCADE,
  size_code  VARCHAR(20) NOT NULL,
  -- sort_order để bảng size hiện theo đúng thứ tự S < M < L, không phải theo
  -- thứ tự chữ cái (sắp theo chữ sẽ ra L, M, S — sai hoàn toàn)
  sort_order INTEGER NOT NULL DEFAULT 0,
  size_group VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT style_sizes_unique UNIQUE (style_id, size_code)
);

CREATE TABLE IF NOT EXISTS public.style_operations (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id     UUID NOT NULL REFERENCES public.styles(id) ON DELETE CASCADE,
  seq_no       INTEGER NOT NULL DEFAULT 0,
  operation    VARCHAR(255) NOT NULL,
  machine_type VARCHAR(100),
  sam_minutes  NUMERIC(8,3) NOT NULL DEFAULT 0 CHECK (sam_minutes >= 0),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Định mức NPL gắn vào MÃ HÀNG (không gắn vào PO)
CREATE TABLE IF NOT EXISTS public.style_bom (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id         UUID NOT NULL REFERENCES public.styles(id) ON DELETE CASCADE,
  colorway_id      UUID REFERENCES public.style_colorways(id) ON DELETE CASCADE,
  material_id      UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  item_name        VARCHAR(255) NOT NULL,
  category         VARCHAR(30) NOT NULL DEFAULT 'FABRIC'
                   CHECK (category IN ('FABRIC','TRIM','ACCESSORY','PACKAGING','OTHER')),
  unit             VARCHAR(20) NOT NULL,
  consumption_per_pcs NUMERIC(12,5) NOT NULL CHECK (consumption_per_pcs > 0),
  wastage_percent  NUMERIC(5,2) NOT NULL DEFAULT 3 CHECK (wastage_percent >= 0 AND wastage_percent <= 100),
  -- Định mức đã tính hao hụt. Đặt cột sinh tự động để mọi nơi dùng chung một
  -- công thức; nếu để tầng ứng dụng tự nhân thì rất dễ chỗ tính chỗ không.
  net_consumption  NUMERIC(14,5) GENERATED ALWAYS AS
                   (consumption_per_pcs * (1 + wastage_percent / 100)) STORED,
  supplier         VARCHAR(255),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. ĐƠN HÀNG (PO) — mở rộng bảng orders đã có ──────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS style_id       UUID REFERENCES public.styles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS season_id      UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS costing_id     UUID REFERENCES public.costings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_type     VARCHAR(10) DEFAULT 'FOB',
  ADD COLUMN IF NOT EXISTS incoterm       VARCHAR(10),
  ADD COLUMN IF NOT EXISTS currency       VARCHAR(10) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS unit_price     NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS factory_name   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ship_mode      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS order_date     DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS ex_factory_date DATE;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_order_type_valid') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_valid
      CHECK (order_type IS NULL OR order_type IN ('FOB','CM','CMT','CMPT','CMPTH'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_ship_mode_valid') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_ship_mode_valid
      CHECK (ship_mode IS NULL OR ship_mode IN ('SEA','AIR','ROAD','RAIL','EXPRESS'));
  END IF;
END $$;

-- Số lượng theo MÀU × SIZE. Bắt buộc phải có ở nhà máy may: cắt, đóng thùng
-- và kiểm AQL đều làm theo từng cặp màu-size, tổng số lượng PO là không đủ.
CREATE TABLE IF NOT EXISTS public.order_size_breakdown (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  colorway_id UUID REFERENCES public.style_colorways(id) ON DELETE SET NULL,
  color_code  VARCHAR(50) NOT NULL,
  size_code   VARCHAR(20) NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity >= 0),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT order_size_breakdown_unique UNIQUE (order_id, color_code, size_code)
);

-- ─── 6. LỊCH TRÌNH T&A (Time & Action) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ta_templates (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code        VARCHAR(50) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  order_type  VARCHAR(10) CHECK (order_type IS NULL OR order_type IN ('FOB','CM','CMT','CMPT','CMPTH')),
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ta_template_items (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id   UUID NOT NULL REFERENCES public.ta_templates(id) ON DELETE CASCADE,
  seq_no        INTEGER NOT NULL DEFAULT 0,
  milestone     VARCHAR(255) NOT NULL,
  -- Số ngày TRƯỚC ngày giao hàng. Dùng mốc âm so với ngày giao thay vì cộng dồn
  -- từ ngày mở đơn: ngày giao là thứ khách chốt cứng, còn ngày mở đơn hay xê dịch.
  offset_days_before_delivery INTEGER NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 1 CHECK (duration_days >= 0),
  is_critical   BOOLEAN DEFAULT FALSE,
  responsible_role VARCHAR(50),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_milestones (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seq_no        INTEGER NOT NULL DEFAULT 0,
  milestone     VARCHAR(255) NOT NULL,
  planned_date  DATE,
  actual_date   DATE,
  is_critical   BOOLEAN DEFAULT FALSE,
  responsible_role VARCHAR(50),
  status        VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','IN_PROGRESS','DONE','LATE','SKIPPED')),
  -- Số ngày trễ: âm là còn sớm, dương là đã trễ. Cột sinh tự động nên không
  -- thể lệch giữa các màn hình.
  delay_days    INTEGER GENERATED ALWAYS AS
                (CASE WHEN actual_date IS NOT NULL AND planned_date IS NOT NULL
                      THEN actual_date - planned_date END) STORED,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. MẪU DUYỆT ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sample_submissions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id     UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  style_id     UUID REFERENCES public.styles(id) ON DELETE CASCADE,
  stage        VARCHAR(20) NOT NULL
               CHECK (stage IN ('PROTO','FIT','SIZE_SET','SMS','PP','TOP','SHIPMENT')),
  round_no     INTEGER NOT NULL DEFAULT 1 CHECK (round_no >= 1),
  sent_date    DATE,
  reply_date   DATE,
  status       VARCHAR(20) NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING','SENT','APPROVED','REJECTED','APPROVED_WITH_COMMENT')),
  buyer_comment TEXT,
  attachment_url TEXT,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  -- Mỗi loại mẫu chỉ có một bản cho mỗi lần gửi lại
  CONSTRAINT sample_submissions_unique UNIQUE (order_id, stage, round_no)
);

-- ─── 8. TRUNG TÂM TÀI LIỆU ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.md_documents (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Gắn linh hoạt vào bất kỳ thực thể nào (style / order / costing / inquiry)
  entity_type VARCHAR(30) NOT NULL
              CHECK (entity_type IN ('STYLE','ORDER','COSTING','INQUIRY','CUSTOMER','SAMPLE')),
  entity_id   UUID NOT NULL,
  doc_type    VARCHAR(30) NOT NULL
              CHECK (doc_type IN ('TECH_PACK','MARKER','PATTERN','PACKING_LIST',
                                  'ARTWORK','CONTRACT','INVOICE','OTHER')),
  title       VARCHAR(255) NOT NULL,
  -- Lưu ĐƯỜNG DẪN trong bucket, không lưu URL đầy đủ: đổi bucket sang private
  -- thì URL công khai chết hết, còn path vẫn phát được Signed URL.
  storage_path TEXT NOT NULL,
  file_size   INTEGER,
  mime_type   VARCHAR(100),
  version     INTEGER NOT NULL DEFAULT 1,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. THẢO LUẬN (@mention) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.md_comments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type  VARCHAR(30) NOT NULL
               CHECK (entity_type IN ('STYLE','ORDER','COSTING','INQUIRY','SAMPLE','MILESTONE')),
  entity_id    UUID NOT NULL,
  parent_id    UUID REFERENCES public.md_comments(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  -- Vai trò được tag. Mảng để truy vấn "việc của tôi" bằng toán tử && của
  -- Postgres, nhanh hơn nhiều so với bảng nối cho nhu cầu chỉ đọc theo vai trò.
  mentions     TEXT[] DEFAULT '{}',
  is_task      BOOLEAN DEFAULT FALSE,
  task_status  VARCHAR(20) CHECK (task_status IS NULL OR task_status IN ('OPEN','DOING','DONE','CANCELLED')),
  assigned_role VARCHAR(50),
  due_date     DATE,
  author_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 10. YÊU CẦU THAY ĐỔI ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.change_requests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_no   VARCHAR(100) UNIQUE NOT NULL,
  order_id     UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  style_id     UUID REFERENCES public.styles(id) ON DELETE SET NULL,
  change_type  VARCHAR(30) NOT NULL
               CHECK (change_type IN ('QUANTITY','COLOR','SIZE','DELIVERY_DATE',
                                      'MATERIAL','PRICE','PACKING','OTHER')),
  -- Giữ cả giá trị CŨ và MỚI: khi khách đổi phút chót rồi tranh chấp, đây là
  -- bằng chứng duy nhất cho biết ban đầu đã chốt cái gì.
  old_value    TEXT,
  new_value    TEXT,
  reason       TEXT,
  impact_note  TEXT,
  status       VARCHAR(20) NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING','APPROVED','REJECTED','APPLIED')),
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 11. ĐIỂM RỦI RO (công thức trọng số) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.risk_assessments (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id       UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  -- Bốn cấu phần, mỗi cái 0..100
  material_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (material_score BETWEEN 0 AND 100),
  schedule_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (schedule_score BETWEEN 0 AND 100),
  quality_score  NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (quality_score  BETWEEN 0 AND 100),
  capacity_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (capacity_score BETWEEN 0 AND 100),
  -- CÔNG THỨC TRỌNG SỐ, không phải AI: NPL 35%, tiến độ 30%, chất lượng 20%,
  -- năng lực xưởng 15%. Đặt cột sinh tự động để điểm không thể lệch giữa các
  -- màn hình, và đổi trọng số thì chỉ sửa một chỗ duy nhất là ở đây.
  total_score    NUMERIC(6,2) GENERATED ALWAYS AS (
                   material_score * 0.35 + schedule_score * 0.30 +
                   quality_score  * 0.20 + capacity_score * 0.15
                 ) STORED,
  detail         JSONB DEFAULT '{}'::jsonb,
  computed_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT risk_assessments_order_unique UNIQUE (order_id)
);

-- Ngưỡng phân loại để UI tô màu — để ở DB nên báo cáo và giao diện luôn khớp
CREATE OR REPLACE VIEW public.v_order_risk AS
SELECT r.*,
       CASE WHEN r.total_score >= 70 THEN 'CRITICAL'
            WHEN r.total_score >= 45 THEN 'HIGH'
            WHEN r.total_score >= 20 THEN 'MEDIUM'
            ELSE 'LOW' END AS risk_level
FROM public.risk_assessments r;

-- ─── 12. LỊCH SỬ THAO TÁC ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(40) NOT NULL,
  entity_id   UUID,
  action      VARCHAR(30) NOT NULL,
  -- Chỉ lưu phần THAY ĐỔI, không lưu cả bản ghi: nhật ký của 500 chuyền sẽ
  -- phình rất nhanh nếu chép nguyên dòng mỗi lần sửa một ô.
  changes     JSONB DEFAULT '{}'::jsonb,
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role  VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 13. CHỈ MỤC ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cust_contacts_customer  ON public.customer_contacts (customer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status        ON public.inquiries (status, due_date);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer      ON public.inquiries (customer_id);
CREATE INDEX IF NOT EXISTS idx_costings_style          ON public.costings (style_id);
CREATE INDEX IF NOT EXISTS idx_costings_status         ON public.costings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_costing_items_costing   ON public.costing_items (costing_id);
CREATE INDEX IF NOT EXISTS idx_styles_customer         ON public.styles (customer_id);
CREATE INDEX IF NOT EXISTS idx_styles_status           ON public.styles (status, style_no);
CREATE INDEX IF NOT EXISTS idx_colorways_style         ON public.style_colorways (style_id);
CREATE INDEX IF NOT EXISTS idx_sizes_style             ON public.style_sizes (style_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_operations_style        ON public.style_operations (style_id, seq_no);
CREATE INDEX IF NOT EXISTS idx_style_bom_style         ON public.style_bom (style_id);
CREATE INDEX IF NOT EXISTS idx_style_bom_material      ON public.style_bom (material_id);
CREATE INDEX IF NOT EXISTS idx_orders_style            ON public.orders (style_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery         ON public.orders (delivery_date);
CREATE INDEX IF NOT EXISTS idx_osb_order               ON public.order_size_breakdown (order_id);
CREATE INDEX IF NOT EXISTS idx_ta_items_template       ON public.ta_template_items (template_id, seq_no);
CREATE INDEX IF NOT EXISTS idx_milestones_order        ON public.order_milestones (order_id, seq_no);
CREATE INDEX IF NOT EXISTS idx_milestones_late         ON public.order_milestones (status, planned_date);
CREATE INDEX IF NOT EXISTS idx_samples_order           ON public.sample_submissions (order_id, stage);
CREATE INDEX IF NOT EXISTS idx_docs_entity             ON public.md_documents (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_entity         ON public.md_comments (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_mentions       ON public.md_comments USING GIN (mentions);
CREATE INDEX IF NOT EXISTS idx_change_req_order        ON public.change_requests (order_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_entity         ON public.activity_log (entity_type, entity_id, created_at DESC);

-- ─── 14. RLS: CHỈ authenticated (khớp migration 010) ───────────────────────
DO $$
DECLARE t TEXT; pol RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'seasons','customer_contacts','inquiries','costings','costing_items',
    'styles','style_colorways','style_sizes','style_operations','style_bom',
    'order_size_breakdown','ta_templates','ta_template_items','order_milestones',
    'sample_submissions','md_documents','md_comments','change_requests',
    'risk_assessments','activity_log'
  ]
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies
               WHERE schemaname='public' AND tablename=t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "authenticated_only" ON public.%I FOR ALL TO authenticated '
      'USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t);

    -- RLS chỉ lọc dòng; thiếu GRANT là bị chặn từ ngoài với lỗi
    -- "permission denied" chứ không phải "không có dòng nào"
    EXECUTE format('GRANT ALL ON public.%I TO authenticated', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

GRANT USAGE, SELECT ON SEQUENCE public.activity_log_id_seq TO authenticated;
GRANT SELECT ON public.v_order_risk TO authenticated;

-- ─── 15. TRIGGER updated_at (dùng lại hàm từ migration 014) ────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'seasons','customer_contacts','inquiries','costings','styles','style_bom',
    'order_milestones','sample_submissions','md_comments','change_requests'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%s ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_touch_%s BEFORE UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;

-- ─── 16. MẪU LỊCH T&A MẶC ĐỊNH (FOB) ───────────────────────────────────────
INSERT INTO public.ta_templates (code, name, order_type, is_default)
VALUES ('FOB-STD', 'Lịch chuẩn FOB', 'FOB', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.ta_template_items
  (template_id, seq_no, milestone, offset_days_before_delivery, duration_days, is_critical, responsible_role)
SELECT t.id, v.seq, v.ms, v.off, v.dur, v.crit, v.role
FROM public.ta_templates t
CROSS JOIN (VALUES
  ( 1, 'Nhận đơn hàng',              120, 1, FALSE, 'md'),
  ( 2, 'Duyệt mẫu Fit',              105, 7, TRUE,  'md'),
  ( 3, 'Chốt định mức NPL',           98, 3, TRUE,  'md'),
  ( 4, 'Đặt mua NPL',                 95, 5, TRUE,  'md'),
  ( 5, 'Duyệt mẫu Size Set',          88, 7, FALSE, 'md'),
  ( 6, 'NPL về kho',                  60, 3, TRUE,  'kho'),
  ( 7, 'Duyệt mẫu PP',                55, 7, TRUE,  'qa'),
  ( 8, 'Cấp phát NPL cho sản xuất',   45, 2, TRUE,  'kho'),
  ( 9, 'Vào chuyền cắt',              42, 5, TRUE,  'totruongcat'),
  (10, 'Vào chuyền may',              35,20, TRUE,  'totruongmay'),
  (11, 'Duyệt mẫu TOP',               20, 5, FALSE, 'qa'),
  (12, 'Hoàn thành - ủi - gấp',       12, 7, TRUE,  'hoanthanh'),
  (13, 'Kiểm AQL cuối',                7, 2, TRUE,  'qa'),
  (14, 'Đóng thùng',                   5, 3, TRUE,  'hoanthanh'),
  (15, 'Đóng container - xuất hàng',   0, 1, TRUE,  'kho')
) AS v(seq, ms, off, dur, crit, role)
WHERE t.code = 'FOB-STD'
  AND NOT EXISTS (
    SELECT 1 FROM public.ta_template_items i
    WHERE i.template_id = t.id AND i.seq_no = v.seq
  );

-- ─── 17. TỰ KIỂM TRA ────────────────────────────────────────────────────────
DO $$
DECLARE missing TEXT := ''; t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'seasons','customer_contacts','inquiries','costings','costing_items',
    'styles','style_colorways','style_sizes','style_operations','style_bom',
    'order_size_breakdown','ta_templates','ta_template_items','order_milestones',
    'sample_submissions','md_documents','md_comments','change_requests',
    'risk_assessments','activity_log'
  ]
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t)
      THEN missing := missing || t || ' '; END IF;
  END LOOP;

  IF missing <> '' THEN RAISE EXCEPTION 'Chưa tạo được bảng: %', missing; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='orders' AND column_name='style_id')
    THEN RAISE EXCEPTION 'Thiếu orders.style_id'; END IF;

  RAISE NOTICE 'OK: 20 bảng vòng đời đơn hàng đã sẵn sàng, orders.style_id đã gắn.';
END $$;

-- Bảng chẩn đoán — chụp lại gửi nếu UI báo lỗi đọc dữ liệu
SELECT t.tablename AS bang,
       t.rowsecurity AS rls,
       (SELECT count(*) FROM pg_policies p
          WHERE p.schemaname='public' AND p.tablename=t.tablename) AS so_policy,
       has_table_privilege('authenticated','public.'||t.tablename,'SELECT') AS auth_doc,
       has_table_privilege('anon','public.'||t.tablename,'SELECT') AS anon_doc
FROM pg_tables t
WHERE t.schemaname='public' AND t.tablename IN (
  'styles','style_bom','costings','inquiries','order_milestones',
  'risk_assessments','md_comments','orders','customers')
ORDER BY t.tablename;
