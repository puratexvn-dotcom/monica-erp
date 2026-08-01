-- ============================================================================
-- 040 · BẤT BIẾN I-11 · COMMERCIAL OWNERSHIP INTEGRITY
--
-- Phê duyệt: Kiến trúc sư trưởng, 02/08/2026.
--
--   "Assignment là Aggregate Root DUY NHẤT cho Permission, Scope và Ownership.
--    `subcon_orders.vendor_id` phải khớp với `Assignment.partner_id`. Nếu
--    không khớp, từ chối ở tầng Domain VÀ CSDL."
--
-- ─── VÌ SAO CẦN — MỘT TÀI NGUYÊN KHÔNG ĐƯỢC CÓ HAI CHỦ ────────────────────
--
-- Trước quyết định này, `subcon_orders` có HAI đường sở hữu song song:
--
--     vendor_id      → subcontractors → partners   (ai LÀM)
--     assignment_id  → assignments    → partners   (ai ĐƯỢC GIAO)
--
-- Hai đường có thể trỏ về HAI CHỦ KHÁC NHAU. Khi một tài nguyên có hai chủ,
-- **không policy nào viết đúng được** — mọi lựa chọn đều để lộ cho một bên.
--
-- I-11 gỡ sự mơ hồ tận gốc: MỘT tài nguyên, MỘT chủ, MỘT ranh giới.
--
-- ─── CÁCH NỐI HAI ĐẦU ─────────────────────────────────────────────────────
--
--     subcon_orders.vendor_id  ─┐
--                               ├─ phải là CÙNG một `subcontractors.id`
--     assignments.partner_id ─→ partners.subcontractor_id  ─┘
--
-- Hệ quả có chủ ý: assignment thuộc một PRODUCTION_PARTNER (xưởng may) có
-- `partners.subcontractor_id = NULL`, nên **không bao giờ** mang được đơn gia
-- công. Đúng — xưởng may không phải nhà thầu dịch vụ.
--
-- ─── VÌ SAO TRIGGER CHỨ KHÔNG PHẢI `CHECK` ────────────────────────────────
--
-- Luật này phải TRA HAI BẢNG KHÁC. PostgreSQL **cấm truy vấn con trong
-- `CHECK`** (`0A000`) — đã vấp một lần ở migration 035a. `CHECK` chỉ nhìn được
-- các cột của chính dòng đó.
--
-- ─── DÒNG `assignment_id IS NULL` THÌ SAO ─────────────────────────────────
--
-- Không kiểm được, và **cố ý không kiểm**. Dòng mồ côi không thuộc phần việc
-- nào nên không có `partner_id` để đối chiếu. Ép chúng có `assignment_id` là
-- bắt migration **suy diễn dữ liệu nghiệp vụ** — trái Hiến pháp III.1.
-- Chúng vô hình với người ngoài qua RLS, và đó là đủ.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. SOI TRƯỚC — CÓ BAO NHIÊU DÒNG ĐANG VI PHẠM
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE r RECORD; n INT := 0;
BEGIN
  RAISE NOTICE '── Dòng đang vi phạm I-11 ──';
  FOR r IN
    SELECT so.subcon_order_no,
           so.vendor_id,
           p.partner_code,
           p.subcontractor_id AS vendor_dung
      FROM public.subcon_orders so
      JOIN public.assignments a ON a.id = so.assignment_id
      JOIN public.partners p    ON p.id = a.partner_id
     WHERE so.assignment_id IS NOT NULL
       AND (p.subcontractor_id IS NULL OR p.subcontractor_id <> so.vendor_id)
  LOOP
    RAISE NOTICE '  % · phần việc thuộc % · vendor đúng phải là %',
      r.subcon_order_no, r.partner_code, COALESCE(r.vendor_dung::TEXT, '(không có)');
    n := n + 1;
  END LOOP;
  IF n = 0 THEN RAISE NOTICE '  (không có)'; END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. DỌN — CHỈ DÒNG DỮ LIỆU NỀN, VÀ DỪNG NGAY NẾU CÓ DÒNG THẬT
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ `SEED-SO-CROSS` do chính tôi gieo để dò xem policy khoanh theo đường nào.
-- Quyết định 02/08/2026 nói thẳng: *"Dữ liệu vi phạm bất biến không được phép
-- tồn tại để kiểm thử RLS."* Câu hỏi đúng không phải "policy xử sự ra sao với
-- dòng hai chủ" mà là "vì sao dòng hai chủ tồn tại được".
--
-- ⚠️ Và migration này TUYỆT ĐỐI KHÔNG tự xoá dữ liệu NGHIỆP VỤ THẬT. Nếu có
-- dòng vi phạm không mang tiền tố `SEED-`, nó DỪNG và giao lại cho con người —
-- đúng tinh thần Hiến pháp III.1: migration không tự quyết dữ liệu nghiệp vụ.
DO $$
DECLARE
  v_that INT;
  v_seed INT;
BEGIN
  SELECT COUNT(*) INTO v_that
    FROM public.subcon_orders so
    JOIN public.assignments a ON a.id = so.assignment_id
    JOIN public.partners p    ON p.id = a.partner_id
   WHERE so.assignment_id IS NOT NULL
     AND (p.subcontractor_id IS NULL OR p.subcontractor_id <> so.vendor_id)
     AND so.subcon_order_no NOT LIKE 'SEED-%';

  IF v_that > 0 THEN
    RAISE EXCEPTION
      E'040 DỪNG — % đơn gia công NGHIỆP VỤ THẬT đang vi phạm I-11.\n'
      '  Migration KHÔNG tự sửa dữ liệu nghiệp vụ (Hiến pháp III.1).\n'
      '  Phải quyết từng dòng: đổi `vendor_id`, đổi `assignment_id`, hay gỡ liên kết.',
      v_that;
  END IF;

  WITH xoa AS (
    DELETE FROM public.subcon_orders so
     USING public.assignments a, public.partners p
     WHERE a.id = so.assignment_id
       AND p.id = a.partner_id
       AND so.assignment_id IS NOT NULL
       AND (p.subcontractor_id IS NULL OR p.subcontractor_id <> so.vendor_id)
       AND so.subcon_order_no LIKE 'SEED-%'
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_seed FROM xoa;

  RAISE NOTICE 'Đã gỡ % dòng DỮ LIỆU NỀN vi phạm I-11.', v_seed;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. BẤT BIẾN — TỪ CHỐI Ở TẦNG CSDL
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mos_guard_commercial_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vendor_dung UUID;
  v_partner     TEXT;
BEGIN
  -- Dòng mồ côi: không có phần việc để đối chiếu ⇒ không kiểm. Xem đầu tệp.
  IF NEW.assignment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.subcontractor_id, p.partner_code
    INTO v_vendor_dung, v_partner
    FROM public.assignments a
    JOIN public.partners p ON p.id = a.partner_id
   WHERE a.id = NEW.assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'I-11: phần việc % không tồn tại.', NEW.assignment_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_vendor_dung IS NULL THEN
    RAISE EXCEPTION
      'I-11: phần việc thuộc đối tác % — đối tác này KHÔNG phải nhà thầu dịch '
      'vụ nên không thể mang đơn gia công. Assignment là ranh giới sở hữu duy nhất.',
      v_partner
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_vendor_dung <> NEW.vendor_id THEN
    RAISE EXCEPTION
      'I-11: `vendor_id` không khớp chủ của phần việc. Phần việc thuộc %, '
      'nên `vendor_id` phải là %, không phải %.',
      v_partner, v_vendor_dung, NEW.vendor_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.mos_guard_commercial_ownership() IS
  'Bất biến I-11 — Commercial Ownership Integrity. Assignment là Aggregate '
  'Root duy nhất cho Ownership; `vendor_id` chỉ là Business Attribute.';

DROP TRIGGER IF EXISTS subcon_orders_i11_trg ON public.subcon_orders;
CREATE TRIGGER subcon_orders_i11_trg
  BEFORE INSERT OR UPDATE OF vendor_id, assignment_id ON public.subcon_orders
  FOR EACH ROW EXECUTE FUNCTION public.mos_guard_commercial_ownership();

-- ⚠️ `UPDATE OF vendor_id, assignment_id` chứ không phải `UPDATE` trần: chỉ hai
-- cột ấy phá được bất biến. Sửa `total_sent_qty` hay `status` không cần trả
-- giá cho một lượt tra hai bảng — và trigger `fn_process_subcon_issue` cập
-- nhật `total_sent_qty` sau MỖI phiếu xuất.

-- ────────────────────────────────────────────────────────────────────────────
-- 4. KIỂM TRA SAU KHI CHẠY
-- ────────────────────────────────────────────────────────────────────────────
SELECT muc, ket_qua, ky_vong,
       CASE WHEN ket_qua = ky_vong THEN '✅' ELSE '⛔ LỆCH' END AS dat
FROM (VALUES
  ('⭐ Không còn dòng nào vi phạm I-11',
   (SELECT COUNT(*)::TEXT FROM public.subcon_orders so
     JOIN public.assignments a ON a.id = so.assignment_id
     JOIN public.partners p    ON p.id = a.partner_id
    WHERE so.assignment_id IS NOT NULL
      AND (p.subcontractor_id IS NULL OR p.subcontractor_id <> so.vendor_id)), '0'),
  ('Trigger I-11 đã gắn',
   (SELECT COUNT(*)::TEXT FROM pg_trigger
     WHERE tgname = 'subcon_orders_i11_trg' AND NOT tgisinternal), '1'),
  ('Hàm đã ghim search_path',
   (SELECT EXISTS (SELECT 1 FROM unnest(proconfig) x WHERE x LIKE 'search_path=%')::TEXT
      FROM pg_proc WHERE proname = 'mos_guard_commercial_ownership'
       AND pronamespace = 'public'::regnamespace), 'true'),
  ('⚠️ Hàm KHÔNG phải SECURITY DEFINER (không cần vượt RLS)',
   (SELECT prosecdef::TEXT FROM pg_proc
     WHERE proname = 'mos_guard_commercial_ownership'
       AND pronamespace = 'public'::regnamespace), 'false'),
  ('Đơn gia công còn lại',
   (SELECT COUNT(*)::TEXT FROM public.subcon_orders), '3'),
  ('...trong đó MỒ CÔI (không bị I-11 đụng tới)',
   (SELECT COUNT(*)::TEXT FROM public.subcon_orders WHERE assignment_id IS NULL), '1'),
  ('⭐ Vẫn còn HAI mức giá để đo rò rỉ',
   (SELECT COUNT(DISTINCT unit_price)::TEXT FROM public.subcon_orders), '2')
) AS t(muc, ket_qua, ky_vong);

COMMIT;

-- ============================================================================
-- 5. ROLLBACK
--   DROP TRIGGER IF EXISTS subcon_orders_i11_trg ON public.subcon_orders;
--   DROP FUNCTION IF EXISTS public.mos_guard_commercial_ownership();
--
-- ⚠️ KHÔNG khôi phục được dòng `SEED-SO-CROSS` đã gỡ — và cũng không nên.
-- Nó là dữ liệu vi phạm bất biến; dựng lại nó là dựng lại chính sự mơ hồ mà
-- I-11 sinh ra để dẹp.
-- ============================================================================
