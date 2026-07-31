-- ============================================================================
-- MONICA MOS — 024 · TRUNG TÂM XUẤT HÀNG
--
-- MỘT TÍNH NĂNG = MỘT MIGRATION HOÀN CHỈNH (Chỉ thị Mục II).
-- Tệp này chứa đủ: Schema · Constraint · Index · View · Security · Audit.
-- Không tách nhỏ để vá lỗi đã biết trước.
--
-- ─── ĐÃ ĐO TRÊN CSDL ĐANG CHẠY TRƯỚC KHI VIẾT ────────────────────────────
--   shipments            : 0 dòng · status VARCHAR(20) mặc định 'DRAFT', KHÔNG
--                          có CHECK · etd_date NOT NULL DEFAULT CURRENT_DATE
--   shipment_no          : ĐÃ UNIQUE sẵn (mã lỗi 23505) → Mục VI đã thoả,
--                          KHÔNG thêm ràng buộc trùng lặp
--   shipment_cartons     : 0 dòng · một thùng nối được vào HAI lô hàng khác
--                          nhau → đếm trùng
--   cartons              : 2 dòng THẬT, gắn đúng PO-M2601
--   mã đang ghi vào bảng : xuat-hang/actions.ts:54 · md/md-actions.ts:341
--                          cả hai chỉ ghi status 'DRAFT' → CHECK an toàn
--
-- ⚠️ KHÔNG đổi tên `destination_port` cho cân với `port_of_loading`. Đổi tên
-- sẽ gãy cả /xuat-hang lẫn /md. Bất đối xứng rẻ hơn gãy.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 0. ĐIỀU KIỆN CẦN
-- ════════════════════════════════════════════════════════════════════════════
-- `security_invoker` cho VIEW chỉ có từ PostgreSQL 15. Không có nó thì hai
-- view bên dưới sẽ chạy dưới quyền CHỦ SỞ HỮU và vượt mặt RLS — đúng lỗ hổng
-- vừa phát hiện ở các view cũ. Thà dừng ngay còn hơn tạo thêm view rò rỉ.
DO $$ BEGIN
  IF current_setting('server_version_num')::INT < 150000 THEN
    RAISE EXCEPTION
      'Cần PostgreSQL 15 trở lên (security_invoker cho VIEW). Bản hiện tại: %',
      current_setting('server_version');
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. shipments — CHỨNG TỪ VÀ MỐC THỜI GIAN
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.shipments
  -- Chứng từ xuất khẩu
  ADD COLUMN IF NOT EXISTS booking_no       VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bl_no            VARCHAR(50),
  ADD COLUMN IF NOT EXISTS co_no            VARCHAR(50),
  ADD COLUMN IF NOT EXISTS invoice_no       VARCHAR(50),
  ADD COLUMN IF NOT EXISTS port_of_loading  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS incoterm         VARCHAR(3),
  ADD COLUMN IF NOT EXISTS forwarder        VARCHAR(120),

  -- ─── BỐN MỐC THỜI GIAN SỐNG CÒN ───────────────────────────────────────
  -- etd_date đã có sẵn. Thêm ba mốc còn lại.
  --
  -- VÌ SAO PHẢI CÓ CẢ KẾ HOẠCH LẪN THỰC TẾ: chỉ giữ một cột thì lần cập nhật
  -- đầu tiên sẽ biến kế hoạch thành thực tế và xoá mất bằng chứng. Không còn
  -- gì để trả lời "tàu rời trễ mấy ngày" — mà đó là con số quyết định có phạt
  -- giao trễ hay không.
  ADD COLUMN IF NOT EXISTS atd_date         DATE,
  ADD COLUMN IF NOT EXISTS eta_date         DATE,
  ADD COLUMN IF NOT EXISTS ata_date         DATE,

  -- Bốn mốc nghiệp vụ FOB
  ADD COLUMN IF NOT EXISTS booking_date          DATE,
  ADD COLUMN IF NOT EXISTS stuffing_date         DATE,
  ADD COLUMN IF NOT EXISTS custom_clearance_date DATE,
  ADD COLUMN IF NOT EXISTS gate_out_date         DATE,

  -- Vết dấu vận hành (Điều XXVIII.3). `created_at` đã có sẵn.
  ADD COLUMN IF NOT EXISTS created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ⚠️ shipments CỐ Ý KHÔNG có deleted_at/deleted_by.
-- Trạng thái CANCELLED đã diễn đạt "lô hàng này bỏ". Thêm xoá mềm nữa là tạo
-- HAI nguồn dữ liệu cho CÙNG một khái niệm — đúng thứ Mục IV cấm. Bảng
-- shipment_cartons thì khác: nó không có cột trạng thái nào, nên phải xoá mềm.

-- ─── VÌ SAO DÙNG `DATE` CHỨ KHÔNG `TIMESTAMPTZ` ──────────────────────────
-- Chứng từ vận tải làm việc theo NGÀY: vận đơn ghi ngày, tờ khai ghi ngày,
-- điều khoản phạt đếm theo ngày. Dùng DATE tránh sạch cái bẫy múi giờ UTC+7 đã
-- phải sửa ở po-flow.ts (máy chủ chạy giờ UTC, nửa đêm ca ba lệch ngày).
-- Đánh đổi đã cân nhắc: không ghi được "rời cảng lúc 23:40".

-- ─── R1 · ETD: BỎ GIÁ TRỊ MẶC ĐỊNH ───────────────────────────────────────
-- Đo được: chèn không truyền etd_date thì cột nhận NGÀY HÔM NAY. Đó tệ hơn
-- NULL — nó trông y hệt dữ liệu thật, và mọi chỉ số trễ tàu sẽ tính trên một
-- con số không ai nhập. "Chưa có lịch" khác hẳn "hôm nay".
--
-- Phải làm CẢ HAI: bỏ mặc định xong mà vẫn NOT NULL thì /xuat-hang (chèn
-- không truyền etd_date) sẽ gãy ngay.
--
-- DROP DEFAULT và DROP NOT NULL KHÔNG vi phạm "không DROP" của Quy tắc 4:
-- chúng nới lỏng ràng buộc, không xoá một byte nào, không đổi kiểu cột.
ALTER TABLE public.shipments ALTER COLUMN etd_date DROP DEFAULT;
ALTER TABLE public.shipments ALTER COLUMN etd_date DROP NOT NULL;

-- ─── TRẠNG THÁI ──────────────────────────────────────────────────────────
-- Kiểm trước rồi mới siết: nếu có dòng nào ngoài danh sách thì DỪNG và báo,
-- tuyệt đối không tự sửa dữ liệu nghiệp vụ để migration chạy trót lọt.
DO $$
DECLARE v INT;
BEGIN
  SELECT COUNT(*) INTO v FROM public.shipments
   WHERE status IS NOT NULL AND status NOT IN
     ('DRAFT','BOOKED','LOADING','DEPARTED','IN_TRANSIT',
      'ARRIVED_PORT','CUSTOM_CLEARANCE','DELIVERED','CANCELLED');
  IF v > 0 THEN
    RAISE EXCEPTION
      'Có % lô hàng mang trạng thái ngoài danh sách chuẩn. Hãy rà soát và quy đổi thủ công trước khi chạy lại migration này.', v;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipments_status_valid') THEN
    ALTER TABLE public.shipments ADD CONSTRAINT shipments_status_valid
      CHECK (status IN
        ('DRAFT','BOOKED','LOADING','DEPARTED','IN_TRANSIT',
         'ARRIVED_PORT','CUSTOM_CLEARANCE','DELIVERED','CANCELLED'));
  END IF;
END $$;

-- ─── INCOTERMS 2020 · ĐỦ 11 ĐIỀU KIỆN ────────────────────────────────────
-- Liệt đủ ngay bây giờ không tốn gì; thiếu một điều kiện thì sau này phải một
-- migration nữa mới thêm được.
-- Không tách thành bảng danh mục: 11 giá trị cố định từ 2020, ICC không đổi
-- hằng năm — dựng một bảng phải bảo trì suốt đời để đổi lấy con số không
-- (Điều XXIX).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipments_incoterm_valid') THEN
    ALTER TABLE public.shipments ADD CONSTRAINT shipments_incoterm_valid
      CHECK (incoterm IS NULL OR incoterm IN
        ('EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'));
  END IF;
END $$;

-- ⚠️ CỐ Ý KHÔNG ràng buộc thứ tự ngày (ata ≥ atd ≥ etd).
-- Tàu chạy sớm hơn kế hoạch là bình thường — etd là DỰ KIẾN, không phải sàn.
-- Và thứ tự nhập liệu không theo thứ tự thời gian: ATA thường biết trước khi
-- ai đó quay lại điền ATD. Một CHECK như vậy sẽ TỪ CHỐI DỮ LIỆU HỢP LỆ đúng
-- lúc người ta cần ghi nhất. Bất thường thuộc về tầng Domain dưới dạng CẢNH
-- BÁO, không thuộc về Postgres dưới dạng TỪ CHỐI.

CREATE INDEX IF NOT EXISTS idx_shipments_order_status ON public.shipments (order_id, status);
-- Chỉ mục một phần: màn hình chỉ hỏi những lô CHƯA xong.
CREATE INDEX IF NOT EXISTS idx_shipments_etd_open ON public.shipments (etd_date)
  WHERE status NOT IN ('DELIVERED','CANCELLED');

-- ════════════════════════════════════════════════════════════════════════════
-- 2. shipment_cartons — XOÁ MỀM VÀ CHỐNG ĐẾM TRÙNG
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.shipment_cartons
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ─── R2 · MỘT THÙNG CHỈ THUỘC MỘT LÔ HÀNG ────────────────────────────────
-- ĐÃ ĐO: cùng một thùng nối được vào HAI lô hàng khác nhau. View sẽ đếm trùng
-- và báo xuất vượt số đặt hàng. Đúng hình dạng lỗi stock_reservations.roll_id
-- của migration 020.
--
-- ⚠️ CHỈ MỤC MỘT PHẦN, không phải UNIQUE toàn phần (Điều XXVIII.3):
-- xoá mềm mà dùng UNIQUE toàn phần thì dòng đã xoá vẫn chiếm chỗ, và gỡ một
-- thùng khỏi lô hàng sẽ KHOÁ VĨNH VIỄN thùng đó — không bao giờ xuất lại được.
--
-- Nghiệp vụ: mã thùng là định danh vật lý không tái sử dụng, ĐÚNG. Nhưng LIÊN
-- KẾT giữa thùng và lô hàng thì đổi được — huỷ booking, đổi container, dồn
-- container là chuyện thường ngày trước khi tàu chạy. Ràng buộc phải đặt lên
-- liên kết ĐANG HIỆU LỰC, không đặt lên toàn bộ lịch sử.
CREATE UNIQUE INDEX IF NOT EXISTS uq_shipment_carton_active
  ON public.shipment_cartons (carton_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shipment_cartons_active
  ON public.shipment_cartons (shipment_id) WHERE deleted_at IS NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. ĐÓNG DẤU Ở MÁY CHỦ
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.shipment_stamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  ELSE
    NEW.updated_by := auth.uid();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shipment_stamp_trg ON public.shipments;
CREATE TRIGGER shipment_stamp_trg BEFORE INSERT OR UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.shipment_stamp();

CREATE OR REPLACE FUNCTION public.shipment_carton_stamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  ELSE
    NEW.updated_by := auth.uid();
    -- Xoá mềm thì phải biết AI xoá, không chỉ biết lúc nào.
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      NEW.deleted_by := COALESCE(NEW.deleted_by, auth.uid());
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shipment_carton_stamp_trg ON public.shipment_cartons;
CREATE TRIGGER shipment_carton_stamp_trg BEFORE INSERT OR UPDATE ON public.shipment_cartons
  FOR EACH ROW EXECUTE FUNCTION public.shipment_carton_stamp();

-- ─── HUỶ LÔ HÀNG PHẢI GIẢI PHÓNG THÙNG ───────────────────────────────────
-- Không có phần này thì cái bẫy nêu ở Điều XXVIII bật ngay: lô hàng chuyển
-- sang CANCELLED nhưng liên kết thùng vẫn còn hiệu lực, chỉ mục một phần vẫn
-- giữ chỗ, và những thùng đó không bao giờ xếp sang lô khác được.
--
-- Nói cách khác: đây không phải tiện ích, đây là thứ giữ cho R2 không tự bắn
-- vào chân mình.
CREATE OR REPLACE FUNCTION public.shipment_release_cartons()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'CANCELLED' AND COALESCE(OLD.status, '') <> 'CANCELLED' THEN
    UPDATE public.shipment_cartons
       SET deleted_at = NOW(), deleted_by = auth.uid()
     WHERE shipment_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS shipment_release_cartons_trg ON public.shipments;
CREATE TRIGGER shipment_release_cartons_trg AFTER UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.shipment_release_cartons();

-- ════════════════════════════════════════════════════════════════════════════
-- 4. VIEW — HAI GRAIN, HAI VIEW
--
-- ⚠️ `security_invoker = true` NGAY TỪ LẦN TẠO ĐẦU TIÊN (Chỉ thị Mục IX).
--
-- Trong PostgreSQL, VIEW mặc định chạy dưới quyền CHỦ SỞ HỮU, nên RLS của bảng
-- gốc được đánh giá theo chủ sở hữu và người gọi thấy TẤT CẢ. Đã kiểm chứng
-- bằng phiên đăng nhập buyer thật: bảng fabric_rolls chặn (0 dòng) trong khi
-- view v_material_roll_trace trả về 2 dòng.
--
-- Không đặt SECURITY DEFINER là CHƯA ĐỦ — mặc định vốn đã nguy hiểm.
--
-- ⚠️ Hai grain phải là HAI view. Nhét cả tổng hợp theo đơn lẫn chi tiết theo lô
-- vào một view sẽ nhân số dòng lên theo số lô hàng, và mọi con số tổng sẽ sai
-- ngay khi một đơn có hai lô.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Grain 1: MỘT DÒNG MỖI ĐƠN HÀNG ──────────────────────────────────────
DROP VIEW IF EXISTS public.v_po_shipment_readiness;
CREATE VIEW public.v_po_shipment_readiness
WITH (security_invoker = true) AS
SELECT
  o.id                              AS order_id,
  o.po_number,
  o.total_quantity                  AS ordered_qty,
  COALESCE(pk.cartons, 0)           AS packed_cartons,
  COALESCE(pk.qty, 0)               AS packed_qty,
  COALESCE(sp.cartons, 0)           AS shipped_cartons,
  COALESCE(sp.qty, 0)               AS shipped_qty,
  COALESCE(sh.total, 0)             AS shipment_count,
  COALESCE(sh.active, 0)            AS shipment_active,
  sh.first_etd,
  sh.last_ata
FROM public.orders o
-- Đã đóng gói: mọi thùng của đơn, bất kể đã xếp lên lô nào chưa.
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INT AS cartons,
         COALESCE(SUM(c.quantity_per_carton), 0)::NUMERIC AS qty
    FROM public.cartons c
   WHERE c.order_id = o.id
) pk ON TRUE
-- Đã xuất: thùng đã xếp lên một lô hàng CÒN HIỆU LỰC.
-- Liên kết đã xoá mềm và lô đã huỷ đều không tính — nếu tính thì huỷ một lô
-- xong con số "đã xuất" vẫn đứng nguyên, và không ai hiểu vì sao.
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INT AS cartons,
         COALESCE(SUM(c.quantity_per_carton), 0)::NUMERIC AS qty
    FROM public.cartons c
    JOIN public.shipment_cartons sc ON sc.carton_id = c.id AND sc.deleted_at IS NULL
    JOIN public.shipments s         ON s.id = sc.shipment_id AND s.status <> 'CANCELLED'
   WHERE c.order_id = o.id
) sp ON TRUE
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INT AS total,
         COUNT(*) FILTER (WHERE s.status NOT IN ('DELIVERED','CANCELLED'))::INT AS active,
         MIN(s.etd_date) AS first_etd,
         MAX(s.ata_date) AS last_ata
    FROM public.shipments s
   WHERE s.order_id = o.id
) sh ON TRUE;

-- ⚠️ View CỐ Ý KHÔNG tính sẵn phần trăm hoàn thành hay số ngày trễ (Quy tắc 1
-- và Mục X). Chỉ trả số thô. Tỉ lệ và độ trễ tính ở tầng Domain — nơi kiểm thử
-- được bằng số mà không cần dựng Postgres, và nơi "chưa có lịch" (NULL) không
-- bị lẫn với "trễ 0 ngày".

COMMENT ON VIEW public.v_po_shipment_readiness IS
  'Tổng hợp xuất hàng theo ĐƠN. Số thô, không tính sẵn tỉ lệ. security_invoker.';
GRANT SELECT ON public.v_po_shipment_readiness TO authenticated;

-- ─── Grain 2: MỘT DÒNG MỖI LÔ HÀNG ───────────────────────────────────────
DROP VIEW IF EXISTS public.v_po_shipments;
CREATE VIEW public.v_po_shipments
WITH (security_invoker = true) AS
SELECT
  s.id            AS shipment_id,
  s.shipment_no,
  s.order_id,
  s.status,
  s.booking_no, s.bl_no, s.co_no, s.invoice_no,
  s.container_no, s.seal_no, s.vessel_name, s.forwarder, s.incoterm,
  s.port_of_loading, s.destination_port,
  s.booking_date, s.stuffing_date, s.custom_clearance_date, s.gate_out_date,
  s.etd_date, s.atd_date, s.eta_date, s.ata_date,
  s.notes, s.evidence_path, s.created_at, s.updated_at,
  COALESCE(ct.cartons, 0) AS cartons,
  COALESCE(ct.qty, 0)     AS qty
FROM public.shipments s
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INT AS cartons,
         COALESCE(SUM(c.quantity_per_carton), 0)::NUMERIC AS qty
    FROM public.shipment_cartons sc
    JOIN public.cartons c ON c.id = sc.carton_id
   WHERE sc.shipment_id = s.id AND sc.deleted_at IS NULL
) ct ON TRUE;

COMMENT ON VIEW public.v_po_shipments IS
  'Chi tiết từng lô hàng kèm số thùng đang hiệu lực. security_invoker.';
GRANT SELECT ON public.v_po_shipments TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. REALTIME
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['shipments', 'shipment_cartons', 'cartons'] LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. KHẢ NĂNG HOÀN TÁC  (Chỉ thị Mục XI)
-- ════════════════════════════════════════════════════════════════════════════
-- Hoàn tác được, KHÔNG mất dữ liệu đang có:
--   ALTER TABLE shipments ALTER COLUMN etd_date SET DEFAULT CURRENT_DATE;
--   ALTER TABLE shipments DROP CONSTRAINT shipments_status_valid;
--   ALTER TABLE shipments DROP CONSTRAINT shipments_incoterm_valid;
--   DROP INDEX uq_shipment_carton_active;
--   DROP TRIGGER shipment_release_cartons_trg ON shipments;  (v.v.)
--   DROP VIEW v_po_shipment_readiness, v_po_shipments;
--
-- ⚠️ KHÔNG hoàn tác được mà không mất dữ liệu: `DROP COLUMN` các cột mới sẽ
-- xoá luôn số vận đơn, số C/O và các mốc thời gian đã nhập. Nếu buộc phải lùi,
-- hãy sao lưu 17 cột mới ra bảng tạm TRƯỚC KHI xoá.
--
-- Đặt lại NOT NULL cho etd_date cũng KHÔNG hoàn tác được nếu đã có dòng NULL.

-- ════════════════════════════════════════════════════════════════════════════
-- 7. VÁ LỖ HỔNG CỦA CÁC VIEW CŨ  (bổ sung sau khi Kiến trúc sư phê duyệt)
--
-- ⚠️ LỖI ĐÃ LÊN PRODUCTION TỪ MIGRATION 017/020/022.
--
-- Trong PostgreSQL, VIEW mặc định chạy dưới quyền CHỦ SỞ HỮU, không phải người
-- gọi. RLS của bảng gốc vì thế được đánh giá theo chủ sở hữu, và người gọi thấy
-- TẤT CẢ. Không đặt `SECURITY DEFINER` là CHƯA ĐỦ — mặc định vốn đã nguy hiểm.
--
-- ĐÃ CHỨNG MINH bằng phiên đăng nhập buyer thật:
--   bảng fabric_rolls          : admin 2 dòng · buyer 0    ← RLS chạy đúng
--   view  v_material_roll_trace: buyer 2 dòng              ← RÒ RỈ
--   view  v_shade_board        : buyer 2 dòng              ← RÒ RỈ
--   view  v_po_material_readiness: buyer của khách A đọc được định mức khách B
--
-- ⚠️ RỦI RO CỦA CHÍNH BẢN VÁ: đổi rò rỉ lấy MẤT ĐIỆN.
-- Sau khi bật, view chỉ trả về những gì NGƯỜI GỌI được phép đọc. Vai trò nào
-- không có policy đọc bảng gốc sẽ thấy màn hình trống.
-- Đã đo trước bằng ba tài khoản tạm `kho`/`qa`/`md` trên mười bảng gốc: cả ba
-- đọc đủ mọi bảng. Dù vậy phải kiểm lại toàn bộ vai trò SAU khi chạy.
--
-- Vòng lặp thay vì bảy câu lệnh rời: không gãy nếu một view nào đó vắng mặt,
-- và chạy lại an toàn.
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v TEXT; n INT := 0;
BEGIN
  FOREACH v IN ARRAY ARRAY[
    'v_po_material_readiness',   -- 022 · định mức nguyên phụ liệu
    'v_material_roll_trace',     -- 022 · truy vết cuộn vải
    'v_shade_board',             -- 020 · bảng tông màu
    'v_order_risk',              -- 017 · điểm rủi ro đơn hàng
    'v_inspection_score',        -- 020 · điểm kiểm 4 điểm
    'v_bin_path',                -- 017 · đường dẫn vị trí kho
    'vw_cut_ticket_summary'      -- 017 · tổng hợp phiếu cắt
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_class
                WHERE relname = v AND relkind = 'v'
                  AND relnamespace = 'public'::regnamespace) THEN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v);
      n := n + 1;
    ELSE
      RAISE NOTICE 'Bỏ qua %: view không tồn tại.', v;
    END IF;
  END LOOP;
  RAISE NOTICE 'Đã bật security_invoker cho % view cũ.', n;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 8. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Cột mới trên shipments' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name = 'shipments' AND column_name IN
           ('booking_no','bl_no','co_no','invoice_no','port_of_loading','incoterm','forwarder',
            'atd_date','eta_date','ata_date','booking_date','stuffing_date',
            'custom_clearance_date','gate_out_date','created_by','updated_at','updated_by')) AS ket_qua,
       '17' AS ky_vong
UNION ALL
SELECT 'etd_date đã BỎ giá trị mặc định',
       (SELECT (column_default IS NULL)::TEXT FROM information_schema.columns
         WHERE table_name = 'shipments' AND column_name = 'etd_date'), 'true'
UNION ALL
SELECT 'etd_date đã cho phép NULL',
       (SELECT (is_nullable = 'YES')::TEXT FROM information_schema.columns
         WHERE table_name = 'shipments' AND column_name = 'etd_date'), 'true'
UNION ALL
SELECT 'Ràng buộc trạng thái + Incoterm',
       (SELECT COUNT(*)::TEXT FROM pg_constraint
         WHERE conname IN ('shipments_status_valid','shipments_incoterm_valid')), '2'
UNION ALL
SELECT 'Cột xoá mềm + vết dấu trên shipment_cartons',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name = 'shipment_cartons' AND column_name IN
           ('created_by','updated_at','updated_by','deleted_at','deleted_by')), '5'
UNION ALL
SELECT 'Chỉ mục duy nhất MỘT PHẦN cho thùng',
       (SELECT COUNT(*)::TEXT FROM pg_indexes
         WHERE indexname = 'uq_shipment_carton_active'
           AND indexdef ILIKE '%WHERE (deleted_at IS NULL)%'), '1'
UNION ALL
SELECT 'Ba trigger đóng dấu / giải phóng thùng',
       (SELECT COUNT(*)::TEXT FROM pg_trigger WHERE tgname IN
         ('shipment_stamp_trg','shipment_carton_stamp_trg','shipment_release_cartons_trg')), '3'
UNION ALL
SELECT 'Hai view MỚI đều bật security_invoker',
       (SELECT COUNT(*)::TEXT FROM pg_class
         WHERE relname IN ('v_po_shipment_readiness','v_po_shipments')
           AND relkind = 'v'
           AND COALESCE(array_to_string(reloptions, ','), '') ILIKE '%security_invoker=true%'), '2'
UNION ALL
SELECT 'View còn bỏ qua RLS (phải bằng 0)',
       (SELECT COUNT(*)::TEXT FROM pg_class
         WHERE relkind = 'v' AND relnamespace = 'public'::regnamespace
           AND COALESCE(array_to_string(reloptions, ','), '') NOT ILIKE '%security_invoker=true%'), '0'
UNION ALL
SELECT 'shipment_no vốn ĐÃ UNIQUE (không đụng tới)',
       (SELECT COUNT(*)::TEXT FROM pg_constraint
         WHERE conrelid = 'public.shipments'::regclass AND contype = 'u'), '1'
UNION ALL
SELECT 'Ba bảng đã vào realtime',
       (SELECT COUNT(*)::TEXT FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND tablename IN ('shipments','shipment_cartons','cartons')), '3';
