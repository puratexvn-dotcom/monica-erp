-- ============================================================================
-- 031c · NHÀ THẦU HẾT THẤY NHÀ THẦU KHÁC
--
-- Phê duyệt: Kiến trúc sư trưởng, 02/08/2026.
--
-- ─── KHOẢN NỢ NÀY DO CHÍNH MIGRATION 026 GHI RA ───────────────────────────
--
-- 026 dòng 64–65, nguyên văn:
--
--     "Nhà thầu tự sửa được hồ sơ nhà thầu KHÁC là leo thang cùng loại: đổi
--      tên, đổi mã, hoặc vô hiệu hoá đối thủ. **Quyền đọc vẫn giữ (trạng thái
--      chuyển tiếp).**"
--
-- 026 đóng quyền GHI và cố ý để ngỏ quyền ĐỌC, ghi rõ đó là tạm. 031c đóng nốt.
--
-- Điều XXX mục 10: nhà thầu **❌ không thấy Subcon khác**.
-- Đo 02/08/2026: SC1 và SC2 đều thấy **2/2** — vi phạm đang sống.
--
-- ─── LUẬT: THẤY ĐÚNG HỒ SƠ CỦA CHÍNH MÌNH, KHÔNG HƠN KHÔNG KÉM ────────────
--
-- `partners` là bảng đối tác mới; `subcontractors` là bảng nhà thầu cũ. Cầu
-- nối là `partners.subcontractor_id` (027 dòng 87 — chỉ hợp lệ với
-- `partner_type = 'SERVICE_PARTNER'`).
--
-- Nên hệ quả của policy này KHÁC NHAU theo loại đối tác, và đó là ĐÚNG:
--
--   SERVICE_PARTNER   (SUB-GIAT-02, SUB-IN-01)  → thấy ĐÚNG 1 dòng của mình
--   PRODUCTION_PARTNER (SC1, SC2, SC3)          → thấy 0
--
-- Xưởng may không có hồ sơ trong bảng nhà thầu-dịch-vụ, nên **không có gì để
-- thấy**. Đó không phải lỗi — đó là "không kém" đúng nghĩa: họ nhận đúng số 0
-- vì phần của họ vốn là 0.
--
-- ─── VÌ SAO CHỈ THÊM MỘT POLICY, KHÔNG GỠ GÌ ──────────────────────────────
--
-- Bài học `qa_audit_reports`: gỡ hàng rào rồi thay không đủ là cách làm thủng.
-- Ở đây KHÔNG có gì phải gỡ:
--
--   `subcon_no_write_vendor`  (RESTRICTIVE FOR ALL, WITH CHECK)   → chặn ghi
--   `subcon_no_delete_vendor` (RESTRICTIVE FOR DELETE)            → chặn xoá
--   `buyer_denied`            (RESTRICTIVE FOR ALL)               → chặn buyer
--
-- Cả ba giữ nguyên. 031c chỉ THÊM một RESTRICTIVE cho SELECT. Policy
-- RESTRICTIVE nối bằng AND nên thêm là siết, không bao giờ là nới.
--
-- ⚠️ `subcon_no_write_vendor` dùng `USING (TRUE)` — cố ý, và 026 đã giải thích.
-- Với RESTRICTIVE, `USING` áp cho SELECT còn `WITH CHECK` áp cho dòng sắp ghi.
-- Chính vì `USING (TRUE)` mà quyền đọc chưa từng bị thu hẹp. Policy mới của
-- 031c là chỗ thu hẹp ấy — KHÔNG được sửa `USING` của 026, vì làm thế sẽ chặn
-- luôn cả UPDATE-dòng-cũ và DELETE theo cách khó lần ra.
--
-- ─── HIỆU NĂNG ────────────────────────────────────────────────────────────
--
-- `EXISTS` tra `partners` theo KHOÁ CHÍNH (`p.id = mos_partner_id()`), nên
-- không cần chỉ mục mới. `mos_partner_id()` không tham số ⇒ gọi một lần cho
-- cả câu lệnh (Quyết định ②). Bảng `subcontractors` có 2 dòng.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 0. CHẶN TRƯỚC
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM pg_policies
       WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'
         AND permissive = 'RESTRICTIVE') <> 12 THEN
    RAISE EXCEPTION '031c DỪNG: 031a không còn đủ 12 policy.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                  WHERE schemaname = 'public' AND tablename = 'sewing_lines'
                    AND policyname = 'p031b_line_scoped_read') THEN
    RAISE EXCEPTION '031c DỪNG: 031b chưa chạy.';
  END IF;
  -- Hai hàng rào GHI của 026 phải còn — 031c dựa vào chúng, không dựng lại.
  IF (SELECT COUNT(*) FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'subcontractors'
         AND policyname IN ('subcon_no_write_vendor', 'subcon_no_delete_vendor')) <> 2 THEN
    RAISE EXCEPTION '031c DỪNG: thiếu hàng rào ghi của 026 trên subcontractors.';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ĐỌC — CHỈ HỒ SƠ CỦA CHÍNH MÌNH
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "p031c_vendor_scoped_read" ON public.subcontractors;
CREATE POLICY "p031c_vendor_scoped_read" ON public.subcontractors
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    NOT public.mos_is_subcon()        -- ngắn mạch: nội bộ + buyer thoát ngay
    OR EXISTS (
      SELECT 1 FROM public.partners p
       WHERE p.id = public.mos_partner_id()
         AND p.subcontractor_id = subcontractors.id
         AND p.deleted_at IS NULL
         AND p.is_active
    )
  );

COMMENT ON POLICY "p031c_vendor_scoped_read" ON public.subcontractors IS
  'Điều XXX mục 10: nhà thầu không thấy nhà thầu khác. Đóng khoản nợ chuyển '
  'tiếp mà migration 026 dòng 65 đã ghi nhận.';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. KIỂM TRA SAU KHI CHẠY
-- ────────────────────────────────────────────────────────────────────────────
SELECT muc, ket_qua, ky_vong,
       CASE WHEN ket_qua = ky_vong THEN '✅' ELSE '⛔ LỆCH' END AS dat
FROM (VALUES
  ('⭐ Policy thu hẹp quyền đọc đã tạo',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'subcontractors'
       AND policyname = 'p031c_vendor_scoped_read'), '1'),
  ('...và là RESTRICTIVE, chỉ FOR SELECT',
   (SELECT (permissive || '/' || cmd) FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'subcontractors'
       AND policyname = 'p031c_vendor_scoped_read'), 'RESTRICTIVE/SELECT'),
  ('⚠️ Hai hàng rào GHI của 026 GIỮ NGUYÊN',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'subcontractors'
       AND policyname IN ('subcon_no_write_vendor','subcon_no_delete_vendor')), '2'),
  ('⚠️ buyer_denied GIỮ NGUYÊN',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'subcontractors'
       AND policyname = 'buyer_denied'), '1'),
  ('Cầu nối tồn tại — SERVICE_PARTNER có subcontractor_id',
   (SELECT COUNT(*)::TEXT FROM public.partners
     WHERE partner_type = 'SERVICE_PARTNER' AND subcontractor_id IS NOT NULL
       AND deleted_at IS NULL), '2'),
  ('⭐ 031a còn nguyên', (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'
       AND permissive = 'RESTRICTIVE'), '12'),
  ('⭐ 031b còn nguyên', (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE 'p031b_%'), '5')
) AS t(muc, ket_qua, ky_vong);

COMMIT;

-- ============================================================================
-- 3. ROLLBACK
--   DROP POLICY IF EXISTS "p031c_vendor_scoped_read" ON public.subcontractors;
--
-- Rollback trả nhà thầu về chỗ nhìn thấy nhà thầu khác — vi phạm Điều XXX
-- mục 10. Chỉ làm nếu phân hệ /subcon gãy nặng hơn thế.
--
-- ============================================================================
-- 4. CỐ Ý KHÔNG LÀM
-- ============================================================================
-- ⚠️ Ba bảng họ hàng vẫn CHƯA ĐO ĐƯỢC vì đang RỖNG (Hiến pháp V.1):
--
--     subcon_orders        0 dòng — ghi đã chặn (026), ĐỌC chưa biết
--     subcon_issue_logs    0 dòng — chỉ có `buyer_denied`
--     subcon_receipt_logs  0 dòng — có partner_read/partner_write của bản nháp 031
--
-- KHÔNG viết policy mò cho chúng. Phải gieo dữ liệu nghiệp vụ rồi ĐO, rồi mới
-- quyết — đúng thứ tự đã dùng cho `sewing_lines`. Đề xuất mở rộng `S001` để
-- ba bảng này có dòng, rồi xử ở một chặng riêng.
--
-- `subcon_receipt_logs` đáng soi trước: nó mang policy do bản nháp 031 để lại,
-- cùng nguồn gốc với lỗ hổng `qa_audit_reports`.
-- ============================================================================
