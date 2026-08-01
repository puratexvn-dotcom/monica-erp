-- ============================================================================
-- MONICA MOS — 029 · ASSIGNMENT DOMAIN
--
-- Bước 3/6. Assignment là AGGREGATE ROOT của Manufacturing Execution.
-- Thiết kế: docs/assignment/01-assignment-domain-model.md (bản 5, đã duyệt)
--
-- ─── PHẠM VI ─────────────────────────────────────────────────────────────
--   1 bảng master data  contract_types            (KHỞI TẠO RỖNG)
--   4 bảng aggregate    assignments · bundles · daily_reports · commercial_terms
--   1 dãy số + 1 hàm    sinh Business Number, hỗ trợ nhiều địa điểm
--   6 cột assignment_id thêm vào bảng đang chạy   (đều NULLABLE)
--   2 view đọc          timeline · report status
--   RLS                 chặn sạch người ngoài — 030 sẽ nới
--
-- ─── HAI THỨ CỐ Ý KHÔNG LÀM ──────────────────────────────────────────────
--   ✗ KHÔNG seed contract_types  → Quyết định 4: "không tạo dữ liệu suy đoán".
--     Đo được: subcon_orders 0 dòng, subcons không có cột loại hợp đồng,
--     subcontractors chỉ có service_type (GIAT · IN_THEU) — đó là LOẠI DỊCH VỤ,
--     không phải loại hợp đồng. Không có một mẩu bằng chứng nào về loại hợp
--     đồng đang dùng, nên hệ thống không bịa.
--
--   ✗ KHÔNG đụng md_documents.entity_type  → xem Mục 9.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. contract_types — MASTER DATA, không phải enum (Quyết định 4)
-- ════════════════════════════════════════════════════════════════════════════
-- Loại hợp đồng là DANH MỤC NGHIỆP VỤ: nhà máy thêm bớt theo thực tế kinh
-- doanh, không phải hằng số kỹ thuật. Enum sẽ bắt viết migration mỗi lần ký một
-- kiểu hợp đồng mới.
--
-- Khác với `rate_method` ở Mục 5 — thứ đó là CÁCH TÍNH, hữu hạn và ổn định, nên
-- vẫn dùng CHECK (Điều XXVIII.2).
CREATE TABLE IF NOT EXISTS public.contract_types (
  code        VARCHAR(30) PRIMARY KEY,
  name_vi     VARCHAR(120) NOT NULL,
  name_en     VARCHAR(120),
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 100,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

GRANT SELECT ON public.contract_types TO authenticated;

COMMENT ON TABLE public.contract_types IS
  'Danh mục loại hợp đồng gia công. KHỞI TẠO RỖNG — nghiệp vụ tự khai. '
  'Không seed CMT/CM/FOB vì không có bằng chứng nào trong dữ liệu đang chạy.';

-- ════════════════════════════════════════════════════════════════════════════
-- 2. BUSINESS NUMBER — hỗ trợ nhiều địa điểm (Quyết định 7)
-- ════════════════════════════════════════════════════════════════════════════
CREATE SEQUENCE IF NOT EXISTS public.assignment_no_seq;

CREATE OR REPLACE FUNCTION public.next_assignment_no(p_site_code TEXT DEFAULT NULL)
RETURNS TEXT LANGUAGE SQL VOLATILE SET search_path = public, pg_temp
AS $$
  SELECT 'ASG-'
      || COALESCE(NULLIF(TRIM(p_site_code), ''), 'GEN') || '-'
      || to_char(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY') || '-'
      || lpad(nextval('public.assignment_no_seq')::TEXT, 5, '0');
$$;

-- ASG-GEN-2026-00001   chưa gắn địa điểm
-- ASG-CC01-2026-00002  địa điểm Củ Chi 01
--
-- Đoạn địa điểm nằm SẴN trong khuôn số ngay từ đầu. Khi Monica có nhiều xưởng,
-- chỉ việc truyền `site_code` vào — không phải đổi kiểu cột, không phải đánh số
-- lại, và số cũ vẫn đọc được.
--
-- Dãy số ở CSDL chứ không đếm ở tầng ứng dụng: hai người bấm "Giao việc" cùng
-- lúc mà đếm ở ứng dụng thì sinh trùng số, rồi một trong hai nhận lỗi 23505 vô
-- cớ. `nextval` không bao giờ trả cùng một giá trị cho hai lời gọi.
--
-- Năm lấy theo GIỜ VIỆT NAM. Máy chủ chạy UTC; đêm 31/12 sẽ đánh số sang năm
-- mới sớm bảy tiếng nếu không đổi múi giờ.

GRANT EXECUTE ON FUNCTION public.next_assignment_no(TEXT) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. assignments — GỐC AGGREGATE
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_no  VARCHAR(50) NOT NULL DEFAULT public.next_assignment_no(),

  partner_id     UUID NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
  order_id       UUID NOT NULL REFERENCES public.orders(id)   ON DELETE RESTRICT,

  -- ─── PHẠM VI: TUYÊN BỐ TƯỜNG MINH ─────────────────────────────────
  scope_level        VARCHAR(20) NOT NULL,
  site_id            UUID REFERENCES public.production_sites(id) ON DELETE RESTRICT,
  line_id            UUID REFERENCES public.sewing_lines(id)     ON DELETE RESTRICT,
  style_operation_id UUID REFERENCES public.style_operations(id) ON DELETE RESTRICT,

  assigned_qty   NUMERIC(14,3),
  uom            VARCHAR(20),

  owner_user_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority       VARCHAR(10) NOT NULL DEFAULT 'NORMAL',

  -- ─── KẾ HOẠCH và THỰC TẾ, SONG SONG (Quyết định 2) ────────────────
  planned_start  DATE,
  planned_finish DATE,
  actual_start   DATE,
  actual_finish  DATE,

  status         VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

  -- ─── VẾT DẤU CỦA SÁU SỰ KIỆN, KHÔNG GỘP ───────────────────────────
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at  TIMESTAMPTZ,
  assigned_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_at  TIMESTAMPTZ,
  accepted_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejected_at  TIMESTAMPTZ,
  rejected_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reject_reason  TEXT,
  suspend_reason TEXT,
  closed_at    TIMESTAMPTZ,
  closed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  close_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancel_reason TEXT,
  updated_at   TIMESTAMPTZ,
  updated_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at   TIMESTAMPTZ,
  deleted_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  CONSTRAINT assignments_status_valid CHECK (status IN
    ('DRAFT','ISSUED','ACCEPTED','REJECTED','IN_PROGRESS',
     'SUSPENDED','COMPLETED','CLOSED','CANCELLED')),

  CONSTRAINT assignments_priority_valid CHECK (priority IN
    ('LOW','NORMAL','HIGH','URGENT')),

  CONSTRAINT assignments_scope_level_valid CHECK (scope_level IN
    ('ORDER','SITE','LINE','STYLE_OPERATION')),

  -- ⚠️ RÀNG BUỘC CHUYỂN TIẾP — không phải lỗi. ADR-002 Mục 4.
  -- Cả 3 chuyền hiện chưa gắn địa điểm (nợ từ 028), nên phạm vi `LINE` và
  -- `STYLE_OPERATION` tạm thời chưa dùng được. Phạm vi `ORDER` dùng được ngay.
  -- Nợ tan khi `sewing_lines.site_id` đủ rồi `SET NOT NULL`.
  --
  -- ⚠️ NULL KHÔNG BAO GIỜ NGHĨA LÀ "TẤT CẢ".
  -- Phạm vi rộng được TUYÊN BỐ bằng scope_level='ORDER', không suy từ cột trống.
  -- Ràng buộc này ép: mỗi cấp phải có đúng những cột của cấp đó, và cột dưới
  -- cấp phải trống. Quên chọn chuyền ở cấp LINE → bị từ chối, chứ không âm thầm
  -- nới quyền thành "mọi chuyền".
  CONSTRAINT assignments_scope_shape CHECK (
    CASE scope_level
      WHEN 'ORDER'           THEN site_id IS NULL     AND line_id IS NULL     AND style_operation_id IS NULL
      WHEN 'SITE'            THEN site_id IS NOT NULL AND line_id IS NULL     AND style_operation_id IS NULL
      WHEN 'LINE'            THEN site_id IS NOT NULL AND line_id IS NOT NULL AND style_operation_id IS NULL
      WHEN 'STYLE_OPERATION' THEN site_id IS NOT NULL AND line_id IS NOT NULL AND style_operation_id IS NOT NULL
    END),

  -- Lý do phải là lý do, không phải một chữ (khuôn capa_logs, migration 023)
  CONSTRAINT assignments_reject_needs_reason CHECK (
    status <> 'REJECTED' OR (rejected_at IS NOT NULL
      AND reject_reason IS NOT NULL AND LENGTH(TRIM(reject_reason)) >= 10)),
  CONSTRAINT assignments_close_needs_reason CHECK (
    status <> 'CLOSED' OR (closed_at IS NOT NULL
      AND close_reason IS NOT NULL AND LENGTH(TRIM(close_reason)) >= 10)),
  CONSTRAINT assignments_cancel_needs_reason CHECK (
    status <> 'CANCELLED' OR (cancelled_at IS NOT NULL
      AND cancel_reason IS NOT NULL AND LENGTH(TRIM(cancel_reason)) >= 10)),
  CONSTRAINT assignments_suspend_needs_reason CHECK (
    status <> 'SUSPENDED' OR (suspend_reason IS NOT NULL
      AND LENGTH(TRIM(suspend_reason)) >= 10)),

  -- ─── BẤT BIẾN THỨ TỰ NGÀY (Quyết định 4, REVISED) ─────────────────
  -- Khoan dung với TRỐNG, nghiêm khắc với NGƯỢC.
  --
  -- NULL đi qua được — lúc soạn DRAFT chưa biết ngày, và gõ ngày kết thúc
  -- trước ngày bắt đầu là chuyện bình thường. Nhưng khi ĐÃ CÓ CẢ HAI thì
  -- `finish < start` không phải dữ liệu chưa xong — nó là dữ liệu SAI, và nó
  -- làm mọi phép tính trễ hạn ra số âm.
  CONSTRAINT assignments_planned_order CHECK (
    planned_start IS NULL OR planned_finish IS NULL
    OR planned_finish >= planned_start),
  CONSTRAINT assignments_actual_order CHECK (
    actual_start IS NULL OR actual_finish IS NULL
    OR actual_finish >= actual_start)
);

-- ⚠️ `planned_start`/`planned_finish` CỐ Ý cho phép NULL ở tầng CSDL.
-- Điều kiện "phải có đủ hai ngày mới được chuyển sang ISSUED" là ĐIỀU KIỆN
-- CHUYỂN TRẠNG THÁI, và tài liệu 03 Mục 9 đặt loại luật đó ở **Service** — nơi
-- duy nhất cho được một thông báo người dùng đọc hiểu. CSDL giữ BẤT BIẾN DỮ
-- LIỆU (thứ tự ngày); Service giữ QUY TRÌNH.

-- ⚠️ CỐ Ý KHÔNG ràng buộc planned_finish >= planned_start, cũng không ràng buộc
-- actual_start >= planned_start. Bắt đầu sớm hơn kế hoạch là chuyện TỐT; và thứ
-- tự nhập liệu không theo thứ tự thời gian. Một CHECK như vậy sẽ từ chối dữ
-- liệu hợp lệ đúng lúc người ta cần ghi nhất — bài học bốn mốc ETD/ATD/ETA/ATA
-- ở migration 024. Bất thường được BÁO ở tầng Domain, không bị CHẶN ở đây.

CREATE UNIQUE INDEX IF NOT EXISTS uq_assignments_no_active
  ON public.assignments (assignment_no) WHERE deleted_at IS NULL;

-- Chỉ mục phủ cho đường đọc nóng nhất: phân giải quyền theo đối tác.
-- Một PHẦN — Assignment đã xoá mềm không bao giờ được hỏi tới.
CREATE INDEX IF NOT EXISTS idx_assignments_partner_scope
  ON public.assignments (partner_id, order_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_order
  ON public.assignments (order_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_owner
  ON public.assignments (owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_open_window
  ON public.assignments (planned_finish)
  WHERE deleted_at IS NULL AND status NOT IN ('CLOSED','CANCELLED','REJECTED');

-- ════════════════════════════════════════════════════════════════════════════
-- 4. assignment_bundles — QUAN HỆ, không phải phạm vi
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.assignment_bundles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE RESTRICT,
  bundle_id     UUID NOT NULL REFERENCES public.cut_bundles(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at    TIMESTAMPTZ,
  updated_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at    TIMESTAMPTZ,
  deleted_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Một bó thuộc tối đa MỘT Assignment ĐANG HIỆU LỰC (I-5).
-- ⚠️ Chỉ mục MỘT PHẦN: UNIQUE toàn phần sẽ khoá vĩnh viễn bó đã gỡ, và tái phân
-- công là chuyện hằng ngày — bài học `shipment_cartons` (024).
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignment_bundle_active
  ON public.assignment_bundles (bundle_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_assignment_bundles_asg
  ON public.assignment_bundles (assignment_id) WHERE deleted_at IS NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. assignment_commercial_terms — GIÁ HAI LỚP
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.assignment_commercial_terms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE RESTRICT,
  contract_no   VARCHAR(50),

  -- LỚP 1 · quan hệ thương mại — MASTER DATA, nghiệp vụ tự khai
  contract_type_code VARCHAR(30) REFERENCES public.contract_types(code) ON DELETE RESTRICT,

  -- LỚP 2 · cách tính một đồng — hữu hạn và ổn định, nên là CHECK
  rate_method   VARCHAR(20) NOT NULL,
  rate          NUMERIC(14,4),
  lump_sum      NUMERIC(16,2),
  currency      VARCHAR(3) NOT NULL DEFAULT 'VND',
  payment_term  VARCHAR(100),
  note          TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  CONSTRAINT act_rate_method_valid CHECK (rate_method IN
    ('PER_UNIT','PER_OPERATION','PER_SAM_MINUTE','PER_KG','LUMP_SUM')),
  CONSTRAINT act_currency_valid CHECK (currency IN
    ('VND','USD','EUR','CNY','JPY','KRW')),

  -- `rate_method` tuyên bố cột nào có hiệu lực — cùng khuôn `scope_level`.
  -- NULL không dùng để đoán phương thức: `rate` trống nghĩa là THIẾU DỮ LIỆU,
  -- và ràng buộc này chặn.
  CONSTRAINT act_rate_shape CHECK (
    CASE WHEN rate_method = 'LUMP_SUM'
      THEN lump_sum IS NOT NULL AND rate IS NULL
      ELSE rate     IS NOT NULL AND lump_sum IS NULL
    END)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_act_assignment
  ON public.assignment_commercial_terms (assignment_id);

-- ════════════════════════════════════════════════════════════════════════════
-- 6. assignment_daily_reports — SỔ CÁI BẤT BIẾN (Quyết định 1)
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.assignment_daily_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id     UUID NOT NULL REFERENCES public.assignments(id) ON DELETE RESTRICT,
  report_date       DATE NOT NULL,

  -- NULL = bản GỐC của ngày đó · có giá trị = bản ĐÍNH CHÍNH của bản cha
  parent_report_id  UUID REFERENCES public.assignment_daily_reports(id) ON DELETE RESTRICT,
  correction_reason TEXT,

  target_qty        NUMERIC(14,3),
  output_qty        NUMERIC(14,3),
  defect_qty        NUMERIC(14,3),
  rework_qty        NUMERIC(14,3),
  downtime_minutes  INTEGER,
  issue_note        TEXT,
  support_request   TEXT,
  comment           TEXT,

  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  CONSTRAINT adr_correction_needs_reason CHECK (
    parent_report_id IS NULL
    OR (correction_reason IS NOT NULL AND LENGTH(TRIM(correction_reason)) >= 10))
);

-- Hai chỉ mục duy nhất, mỗi cái chặn MỘT kiểu hỏng khác nhau:
--   ① hai bản GỐC cho cùng một ngày
CREATE UNIQUE INDEX IF NOT EXISTS uq_adr_original_per_day
  ON public.assignment_daily_reports (assignment_id, report_date)
  WHERE parent_report_id IS NULL;
--   ② hai bản ĐÍNH CHÍNH RẼ NHÁNH từ cùng một cha.
--      Nếu một cha có hai con thì câu hỏi "bản nào đang hiệu lực" KHÔNG CÒN
--      CÂU TRẢ LỜI. Chuỗi phải tuyến tính.
CREATE UNIQUE INDEX IF NOT EXISTS uq_adr_linear_chain
  ON public.assignment_daily_reports (parent_report_id)
  WHERE parent_report_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_adr_assignment_date
  ON public.assignment_daily_reports (assignment_id, report_date);

-- ════════════════════════════════════════════════════════════════════════════
-- 7. TRIGGER — chỉ VALIDATE · REJECT · AUDIT (Điều XXX mục 5)
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 7a. Đóng dấu (AUDIT) ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assignment_stamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  ELSE
    NEW.updated_by := auth.uid();
    NEW.updated_at := NOW();
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      NEW.deleted_by := COALESCE(NEW.deleted_by, auth.uid());
    END IF;
  END IF;
  -- updated_at CHI dong dau khi UPDATE. Neu dong ca luc INSERT thi
  -- "chua tung sua" va "vua tao xong" khong con phan biet duoc.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assignments_stamp_trg ON public.assignments;
CREATE TRIGGER assignments_stamp_trg BEFORE INSERT OR UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.assignment_stamp();

DROP TRIGGER IF EXISTS assignment_bundles_stamp_trg ON public.assignment_bundles;
CREATE TRIGGER assignment_bundles_stamp_trg
  BEFORE INSERT OR UPDATE ON public.assignment_bundles
  FOR EACH ROW EXECUTE FUNCTION public.assignment_stamp();

CREATE OR REPLACE FUNCTION public.act_stamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  ELSE
    NEW.updated_by := auth.uid();
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS act_stamp_trg ON public.assignment_commercial_terms;
CREATE TRIGGER act_stamp_trg
  BEFORE INSERT OR UPDATE ON public.assignment_commercial_terms
  FOR EACH ROW EXECUTE FUNCTION public.act_stamp();

-- ─── 7b. I-8 · Partner loại BUYER KHÔNG được có Assignment (REJECT) ──────
-- Buyer là Order Owner, không phải Execution Partner (Quyết định 4 trước đó).
-- Không có ràng buộc này thì một Assignment tạo nhầm sẽ cấp cho Buyer quyền
-- GHI sản lượng — thứ Điều XXX mục 9 cấm tuyệt đối. Đây là loại lỗi im lặng mà
-- chỉ ràng buộc CSDL mới bắt được.
CREATE OR REPLACE FUNCTION public.assignment_guard_partner_type()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
DECLARE v_type TEXT;
BEGIN
  SELECT partner_type INTO v_type FROM public.partners WHERE id = NEW.partner_id;
  IF v_type = 'BUYER' THEN
    RAISE EXCEPTION
      'Không giao được phần việc cho đối tác loại BUYER. Khách hàng là chủ đơn hàng, không phải đối tác thực thi.'
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assignments_partner_type_trg ON public.assignments;
CREATE TRIGGER assignments_partner_type_trg
  BEFORE INSERT OR UPDATE OF partner_id ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.assignment_guard_partner_type();

-- ─── 7c. I-9 · Con không sống ngoài cha (REJECT) ─────────────────────────
CREATE OR REPLACE FUNCTION public.assignment_child_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
DECLARE v_status TEXT; v_deleted TIMESTAMPTZ; v_no TEXT;
BEGIN
  SELECT status, deleted_at, assignment_no
    INTO v_status, v_deleted, v_no
    FROM public.assignments WHERE id = NEW.assignment_id;

  IF v_deleted IS NOT NULL THEN
    RAISE EXCEPTION 'Phần việc % đã bị xoá — không ghi thêm được.', v_no
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF v_status IN ('CLOSED','CANCELLED','REJECTED') THEN
    RAISE EXCEPTION 'Phần việc % đang ở trạng thái % — không ghi thêm được.', v_no, v_status
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS adr_child_guard_trg ON public.assignment_daily_reports;
CREATE TRIGGER adr_child_guard_trg
  BEFORE INSERT ON public.assignment_daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.assignment_child_guard();

DROP TRIGGER IF EXISTS ab_child_guard_trg ON public.assignment_bundles;
CREATE TRIGGER ab_child_guard_trg
  BEFORE INSERT ON public.assignment_bundles
  FOR EACH ROW EXECUTE FUNCTION public.assignment_child_guard();

-- ─── 7d. SỔ CÁI · từ chối mọi UPDATE và DELETE (REJECT) ──────────────────
-- Quyết định 1: "Không UPDATE. Không DELETE. Chỉ thêm Correction."
-- Sản lượng ngày là căn cứ THANH TOÁN. Cho sửa đè nghĩa là cho viết lại quá khứ
-- mà không ai biết.
CREATE OR REPLACE FUNCTION public.ledger_append_only()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
BEGIN
  -- KHÔNG CÓ NGOẠI LỆ. KỂ CẢ `service_role`.
  --
  -- Tôi đã đề xuất chừa một cửa cho khoá quản trị để dọn dữ liệu kiểm thử.
  -- Kiến trúc sư bác bỏ, và lý lẽ đó đúng hơn lý lẽ của tôi:
  --
  --   Một ngoại lệ trong trigger là cửa KHÔNG ĐỂ LẠI DẤU VẾT. Bất kỳ đoạn mã
  --   nào cầm khoá dịch vụ — một script sai, một lần gọi nhầm — đều sửa được
  --   sổ cái mà không ai biết. Còn Migration, Maintenance Script và Recovery
  --   Procedure đều là hành động CÓ CHỦ Ý, CÓ RÀ SOÁT, CÓ LƯU VẾT: chúng gỡ
  --   trigger một cách công khai rồi gắn lại.
  --
  --   Khác nhau không nằm ở QUYỀN. Nó nằm ở DẤU VẾT.
  --
  -- Hệ quả phải gánh: bài kiểm chạm sổ cái không dọn được bằng đường thường.
  -- Cách đúng theo Điều XXXI: dựng Assignment RIÊNG cho bài kiểm, rồi dọn bằng
  -- Maintenance Script gỡ-và-gắn-lại trigger một cách tường minh.
  RAISE EXCEPTION
    'Bảng % là sổ cái — chỉ ghi thêm. Muốn sửa số liệu, hãy ghi một bản đính chính mới trỏ về bản cũ qua parent_report_id.',
    TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS adr_append_only_trg ON public.assignment_daily_reports;
CREATE TRIGGER adr_append_only_trg
  BEFORE UPDATE OR DELETE ON public.assignment_daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.ledger_append_only();

-- Ba đường HỢP LỆ để sửa dữ liệu sổ cái — Quyết định 2 (REVISED):
--     ① Migration            có số thứ tự, nằm trong git
--     ② Maintenance Script   gỡ và gắn lại trigger tường minh
--     ③ Recovery Procedure   có phê duyệt
-- Cả ba ĐỀU ĐỂ LẠI DẤU VẾT. Một ngoại lệ trong trigger thì không.

-- ════════════════════════════════════════════════════════════════════════════
-- 8. NỐI ASSIGNMENT VÀO BẢNG ĐANG CHẠY  (Quyết định 5)
-- ════════════════════════════════════════════════════════════════════════════
-- Tất cả NULLABLE. Dữ liệu cũ không thuộc Assignment nào và sẽ MÃI MÃI không
-- thuộc — đó là sự thật lịch sử, không phải thiếu sót cần lấp. Ép NOT NULL là
-- buộc bịa Assignment ngược cho quá khứ (bài học etd_date, migration 024).
ALTER TABLE public.subcon_orders
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL;
ALTER TABLE public.subcon_issue_logs
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL;
ALTER TABLE public.subcon_receipt_logs
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL;
ALTER TABLE public.hourly_production_logs
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL;
ALTER TABLE public.qa_audit_reports
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL;
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_subcon_orders_asg   ON public.subcon_orders (assignment_id);
CREATE INDEX IF NOT EXISTS idx_hourly_logs_asg     ON public.hourly_production_logs (assignment_id);
CREATE INDEX IF NOT EXISTS idx_qa_audit_asg        ON public.qa_audit_reports (assignment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_asg       ON public.shipments (assignment_id);

-- ════════════════════════════════════════════════════════════════════════════
-- 9. md_documents.entity_type — CỐ Ý KHÔNG ĐỤNG Ở MIGRATION NÀY
-- ════════════════════════════════════════════════════════════════════════════
-- Quyết định 6: dùng lại Document Repository; nếu cần mở rộng entity_type thì
-- ưu tiên Master Data thay vì nới CHECK cứng.
--
-- Đo được: `md_documents` và `md_comments` cùng mang ràng buộc
--   CHECK (entity_type IN ('STYLE','ORDER','COSTING','INQUIRY','CUSTOMER',
--                          'SAMPLE','MILESTONE'))
-- do migration 016 đặt. Không có 'ASSIGNMENT'.
--
-- Chuyển sang Master Data nghĩa là đổi CHECK thành khoá ngoại trên HAI bảng
-- dùng chung của phân hệ /md. Hệ quả có thật, phải xử lý cùng lúc:
--   • mã lỗi đổi từ 23514 sang 23503 — và `friendlyDbError` hiện dịch 23503
--     thành "Dữ liệu đang được tham chiếu ở nơi khác", một câu SAI HẲN cho ca
--     này. Người dùng sẽ nhận một thông báo vô nghĩa.
--   • cần một bảng `document_entity_types` và di trú bảy giá trị cũ.
--
-- Đính kèm tài liệu KHÔNG chặn Assignment Domain: chưa có màn hình nào để tải
-- tệp lên cho tới sau bước 031. Gộp một cuộc đổi ràng buộc trên hai bảng dùng
-- chung vào migration này là trộn hai rủi ro không liên quan.
--
-- → Đề xuất tách thành migration riêng, làm khi dựng màn hình Assignment.
--   Ghi ở đây để không ai tưởng đã xong.

-- ════════════════════════════════════════════════════════════════════════════
-- 10. VIEW ĐỌC — security_invoker NGAY TỪ LẦN TẠO
-- ════════════════════════════════════════════════════════════════════════════
-- Bảy view của 017/020/022 đã rò rỉ THẬT vì thiếu dòng này (đã vá ở 024 Mục 7).
-- Không lặp lại.

-- ─── 10a. Trạng thái báo cáo ngày — TÍNH, không lưu ──────────────────────
DROP VIEW IF EXISTS public.v_assignment_report_status;
CREATE VIEW public.v_assignment_report_status
WITH (security_invoker = true) AS
SELECT
  a.id            AS assignment_id,
  a.assignment_no,
  a.partner_id,
  a.order_id,
  d.day::DATE     AS report_date,
  CASE
    WHEN r.id IS NOT NULL
     AND r.output_qty IS NOT NULL
     AND r.target_qty IS NOT NULL           THEN 'COMPLETE'
    WHEN r.id IS NOT NULL                   THEN 'PARTIAL'
    WHEN d.day::DATE < (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE
                                            THEN 'OVERDUE'
    ELSE 'NOT_STARTED'
  END             AS report_status
FROM public.assignments a
CROSS JOIN LATERAL generate_series(
  a.planned_start,
  LEAST(a.planned_finish, (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE),
  INTERVAL '1 day') AS d(day)
-- Bản ĐANG HIỆU LỰC là bản KHÔNG CÓ CON
LEFT JOIN public.assignment_daily_reports r
       ON r.assignment_id = a.id
      AND r.report_date   = d.day::DATE
      AND NOT EXISTS (SELECT 1 FROM public.assignment_daily_reports c
                       WHERE c.parent_report_id = r.id)
WHERE a.deleted_at IS NULL
  AND a.status IN ('ACCEPTED','IN_PROGRESS','COMPLETED')
  -- Ngày đã thành nullable: không có cửa sổ kế hoạch thì không đòi báo cáo
  -- được. `generate_series(NULL,...)` vốn trả 0 dòng, nhưng viết rõ để người
  -- đọc sau không phải đoán.
  AND a.planned_start  IS NOT NULL
  AND a.planned_finish IS NOT NULL;

-- Bốn quyết định trong hai chục dòng trên:
--  ① NOT_STARTED khác OVERDUE — "chưa tới hạn" khác "đã trễ". Gộp lại thì bảng
--     điều khiển đỏ rực mỗi sáng và không ai nhìn nữa.
--  ② Múi giờ Việt Nam tường minh. Máy chủ chạy UTC; từ 0h–7h sáng, ngày hôm qua
--     sẽ chưa bị tính là trễ.
--  ③ LEAST(planned_finish, hôm_nay) — không sinh ngày tương lai rồi bảo là trễ.
--  ④ SUSPENDED không có trong danh sách: tạm dừng vì hết vải thì không thể đòi
--     báo cáo sản lượng. Cảnh báo giả làm người ta ngừng nhìn bảng cảnh báo.

COMMENT ON VIEW public.v_assignment_report_status IS
  'Trạng thái báo cáo từng ngày. KHÔNG lưu cột nào — Điều XXVIII.1.';
GRANT SELECT ON public.v_assignment_report_status TO authenticated;

-- ─── 10b. Business Timeline — HỢP ĐỒNG, activity_log chỉ là NGUỒN ────────
-- Quyết định 2: giao diện KHÔNG BAO GIỜ đọc thẳng activity_log.
-- View cam kết một hình dạng chuẩn hoá; ba nguồn có ba hình dạng khác nhau, và
-- view là nơi duy nhất nên biết điều đó.
DROP VIEW IF EXISTS public.v_assignment_timeline;
CREATE VIEW public.v_assignment_timeline
WITH (security_invoker = true) AS
  -- ① Đổi trạng thái
  SELECT
    (l.entity_id)                AS assignment_id,
    l.created_at                 AS occurred_at,
    'STATUS'                     AS event_type,
    l.action                     AS event_key,
    l.actor_id,
    l.actor_role,
    l.changes                    AS payload
  FROM public.activity_log l
  WHERE l.entity_type = 'assignment'

  UNION ALL
  -- ② Báo cáo ngày — bản gốc và bản đính chính là HAI sự kiện khác nhau
  SELECT
    r.assignment_id,
    r.submitted_at,
    'DAILY_REPORT',
    CASE WHEN r.parent_report_id IS NULL THEN 'report_submitted'
         ELSE 'report_corrected' END,
    r.submitted_by,
    NULL,
    jsonb_build_object(
      'report_date', r.report_date,
      'output_qty',  r.output_qty,
      'defect_qty',  r.defect_qty,
      'is_correction', r.parent_report_id IS NOT NULL,
      'correction_reason', r.correction_reason)
  FROM public.assignment_daily_reports r

  UNION ALL
  -- ③ Gắn bó
  SELECT
    b.assignment_id, b.created_at, 'BUNDLE', 'bundle_attached',
    b.created_by, NULL,
    jsonb_build_object('bundle_id', b.bundle_id)
  FROM public.assignment_bundles b

  UNION ALL
  -- ④ Gỡ bó
  SELECT
    b.assignment_id, b.deleted_at, 'BUNDLE', 'bundle_detached',
    b.deleted_by, NULL,
    jsonb_build_object('bundle_id', b.bundle_id)
  FROM public.assignment_bundles b
  WHERE b.deleted_at IS NOT NULL;

-- `event_key` là KHOÁ i18n, không phải câu chữ — Điều XXI. View không biết
-- ngôn ngữ; giao diện dịch.
COMMENT ON VIEW public.v_assignment_timeline IS
  'Business Timeline. Giao diện chỉ đọc view này, KHÔNG đọc thẳng activity_log.';
GRANT SELECT ON public.v_assignment_timeline TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 11. RLS — CHẶN SẠCH NGƯỜI NGOÀI Ở GIAI ĐOẠN NÀY
-- ════════════════════════════════════════════════════════════════════════════
-- Cùng lý lẽ 027 và 028: `mos_partner_id()` và `mos_assignment_covers()` thuộc
-- Permission Engine, sinh ra ở 030. Mở quyền trước khi có hàm phân giải là mở
-- bằng một điều kiện chưa tồn tại. Sai sót nghiêng về phía KHOÁ LẠI.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['assignments','assignment_bundles',
                           'assignment_daily_reports','assignment_commercial_terms',
                           'contract_types'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE  ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "assignment_internal_only" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "assignment_internal_only" ON public.%I '
      'FOR ALL TO authenticated '
      'USING (NOT public.mos_is_external()) '
      'WITH CHECK (NOT public.mos_is_external())', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- ⚠️ CÂU TRƯỚC ĐÂY Ở ĐÂY — "Không cấp DELETE ở đâu cả" — LÀ SAI, và migration
-- `029b_revoke_hard_delete.sql` đã sửa.
--
-- `GRANT SELECT, INSERT, UPDATE` ở trên là phép CỘNG THÊM, không phải phép thu
-- hẹp. Supabase đặt sẵn `ALTER DEFAULT PRIVILEGES ... GRANT ALL ON TABLES TO
-- anon, authenticated, service_role`, nên mọi bảng mới nhận đủ quyền ngay lúc
-- `CREATE TABLE` — kể cả DELETE và TRUNCATE. `GRANT` không bao giờ thu hồi.
--
-- Bài kiểm sống với phiên đăng nhập THẬT đã xoá cứng được một Assignment tạm.
-- Muốn chặn thì phải `REVOKE` tường minh — xem 029b.
--
-- Assignment và con đều xoá mềm (I-6); sổ cái thì trigger chặn cứng.

-- ⚠️ `assignment_daily_reports` có RLS bật + FORCE, và trigger append-only chặn
-- UPDATE lẫn DELETE với MỌI vai trò, kể cả `service_role` — xem Mục 7d.
--
-- Bài kiểm chạm sổ cái vì thế phải dựng Assignment RIÊNG, và dọn bằng
-- Maintenance Script gỡ-và-gắn-lại trigger — không bằng một lệnh DELETE lặng lẽ.

-- ════════════════════════════════════════════════════════════════════════════
-- 12. KHẢ NĂNG HOÀN TÁC
-- ════════════════════════════════════════════════════════════════════════════
--   DROP VIEW  v_assignment_timeline, v_assignment_report_status;
--   DROP TABLE assignment_daily_reports, assignment_commercial_terms,
--              assignment_bundles, assignments, contract_types;
--   DROP FUNCTION next_assignment_no(TEXT), assignment_stamp(), act_stamp(),
--                 assignment_guard_partner_type(), assignment_child_guard(),
--                 ledger_append_only();
--   DROP SEQUENCE assignment_no_seq;
--   ALTER TABLE ... DROP COLUMN assignment_id;   (6 bảng)
--
-- Hoàn tác SẠCH khi chưa ai lập Assignment: chưa mã nguồn nào đọc, và sáu cột
-- thêm vào đều rỗng.
-- ⚠️ Sau khi có Assignment thật, `DROP COLUMN assignment_id` sẽ mất liên kết đã
-- gán — sao lưu trước.

-- ════════════════════════════════════════════════════════════════════════════
-- 13. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Năm bảng mới' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN
           ('contract_types','assignments','assignment_bundles',
            'assignment_daily_reports','assignment_commercial_terms')) AS ket_qua,
       '5' AS ky_vong
UNION ALL
SELECT 'contract_types KHỞI TẠO RỖNG (không suy đoán)',
       (SELECT COUNT(*)::TEXT FROM public.contract_types), '0'
UNION ALL
SELECT 'assignments cũng rỗng',
       (SELECT COUNT(*)::TEXT FROM public.assignments), '0'
UNION ALL
SELECT 'Chín trạng thái trong ràng buộc',
       (SELECT COUNT(*)::TEXT FROM pg_constraint WHERE conname = 'assignments_status_valid'), '1'
UNION ALL
SELECT 'Ràng buộc hình dạng phạm vi (NULL không nghĩa là tất cả)',
       (SELECT COUNT(*)::TEXT FROM pg_constraint WHERE conname = 'assignments_scope_shape'), '1'
UNION ALL
SELECT 'Bốn ràng buộc "lý do phải là lý do"',
       (SELECT COUNT(*)::TEXT FROM pg_constraint WHERE conname IN
         ('assignments_reject_needs_reason','assignments_close_needs_reason',
          'assignments_cancel_needs_reason','assignments_suspend_needs_reason')), '4'
UNION ALL
SELECT 'Sổ cái: hai chỉ mục duy nhất một phần',
       (SELECT COUNT(*)::TEXT FROM pg_indexes WHERE indexname IN
         ('uq_adr_original_per_day','uq_adr_linear_chain')), '2'
UNION ALL
SELECT 'Bất biến thứ tự ngày (planned + actual), khoan dung với NULL',
       (SELECT COUNT(*)::TEXT FROM pg_constraint WHERE conname IN
         ('assignments_planned_order','assignments_actual_order')), '2'
UNION ALL
SELECT 'Business Number có DEFAULT — không thể quên',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name = 'assignments' AND column_name = 'assignment_no'
           AND column_default LIKE '%next_assignment_no%'), '1'
UNION ALL
SELECT 'Sổ cái: trigger chặn UPDATE và DELETE',
       (SELECT COUNT(*)::TEXT FROM pg_trigger WHERE tgname = 'adr_append_only_trg'), '1'
UNION ALL
SELECT 'Trigger I-8 (chặn BUYER) và I-9 (chặn ghi vào cha đã đóng)',
       (SELECT COUNT(*)::TEXT FROM pg_trigger WHERE tgname IN
         ('assignments_partner_type_trg','adr_child_guard_trg','ab_child_guard_trg')), '3'
UNION ALL
SELECT 'Hàm sinh Business Number có tham số địa điểm',
       (SELECT COUNT(*)::TEXT FROM pg_proc WHERE proname = 'next_assignment_no'), '1'
UNION ALL
SELECT 'Sáu cột assignment_id thêm vào bảng đang chạy',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema = 'public' AND column_name = 'assignment_id'
           AND table_name IN ('subcon_orders','subcon_issue_logs','subcon_receipt_logs',
                              'hourly_production_logs','qa_audit_reports','shipments')), '6'
UNION ALL
SELECT 'Sáu cột đó đều CHO PHÉP NULL',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema = 'public' AND column_name = 'assignment_id'
           AND is_nullable = 'YES'
           AND table_name IN ('subcon_orders','subcon_issue_logs','subcon_receipt_logs',
                              'hourly_production_logs','qa_audit_reports','shipments')), '6'
UNION ALL
SELECT 'Hai view mới đều bật security_invoker',
       (SELECT COUNT(*)::TEXT FROM pg_class
         WHERE relname IN ('v_assignment_timeline','v_assignment_report_status')
           AND relkind = 'v'
           AND COALESCE(array_to_string(reloptions, ','), '') ILIKE '%security_invoker=true%'), '2'
UNION ALL
SELECT 'KHÔNG view nào trong lược đồ còn bỏ qua RLS',
       (SELECT COUNT(*)::TEXT FROM pg_class
         WHERE relkind = 'v' AND relnamespace = 'public'::regnamespace
           AND COALESCE(array_to_string(reloptions, ','), '') NOT ILIKE '%security_invoker=true%'), '0'
UNION ALL
SELECT 'RLS bật + cưỡng chế trên năm bảng',
       (SELECT COUNT(*)::TEXT FROM pg_class
         WHERE relname IN ('assignments','assignment_bundles','assignment_daily_reports',
                           'assignment_commercial_terms','contract_types')
           AND relrowsecurity AND relforcerowsecurity), '5'
UNION ALL
SELECT '⚠️ md_documents.entity_type CỐ Ý chưa đụng (Mục 9)',
       (SELECT COUNT(*)::TEXT FROM pg_constraint
         WHERE conname = 'md_documents_entity_type_check'), '1'
UNION ALL
SELECT '027 · 028 còn nguyên',
       ((SELECT COUNT(*) FROM public.partners)::TEXT || ' đối tác / ' ||
        (SELECT COUNT(*) FROM public.production_sites)::TEXT || ' địa điểm'), '5 đối tác / 0 địa điểm';
