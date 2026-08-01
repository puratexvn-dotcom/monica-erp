-- ============================================================================
-- 031a · CẤM NGƯỜI DÙNG BÊN NGOÀI GHI VÀO DỮ LIỆU LÕI
--
-- Phê duyệt: Kiến trúc sư trưởng, 02/08/2026 — phạm vi MỞ RỘNG gồm bốn bảng
--            orders · cut_tickets · cut_bundles · qa_audit_reports
--
-- "QA Reports là dữ liệu thuộc Monica. Subcon chỉ được đọc và phản hồi, không
--  được tạo, sửa hoặc xóa kết quả QA chính thức."
--
-- ─── ĐO ĐƯỢC GÌ (01/08/2026, phiên đăng nhập thật, sau khi gieo S001) ──────
--
--   14 lỗ hổng GHI. Nhà thầu TẠO và SỬA được cả bốn bảng trên.
--
--   ⚠️ Và nhà thầu KHÔNG ĐƯỢC GIAO PHẦN VIỆC NÀO cũng ghi được y hệt nhà thầu
--   có phần việc. Quyền ghi hiện hoàn toàn theo VAI TRÒ, không dính dáng gì
--   tới tài nguyên được giao.
--
-- ─── VÌ SAO THỦNG — TRUY ĐƯỢC ĐẾN TẬN GỐC ─────────────────────────────────
--
-- ① `orders`, `cut_tickets`, `cut_bundles` nằm trong DANH SÁCH CHO PHÉP của
--    migration 025 (Mục 2, mảng `allowed`), nên vòng lặp khoá nhà thầu đã CỐ Ý
--    bỏ qua chúng. Thời điểm đó phân hệ /subcon cần đọc chúng, và 025 chưa có
--    cách nào tách quyền ĐỌC khỏi quyền GHI — nên nó mở cả hai.
--
-- ② `qa_audit_reports` thủng vì lý do KHÁC HẲN, và nặng hơn: bản nháp 031 —
--    thứ ĐÃ BỊ CHẠY NGOÀI DỰ KIẾN — đã **gỡ** `subcon_denied` khỏi bảng này
--    (drafts/031_assignment_rls.INCOMPLETE.sql dòng 150), rồi thay bằng
--    policy `..._partner_read` (SELECT) và `..._partner_write` (INSERT).
--
--    Nó KHÔNG tạo policy cho UPDATE.
--
--    Gỡ một policy RESTRICTIVE mà không thay đủ thì bảng rơi trở lại dưới
--    quyền của policy PERMISSIVE có sẵn từ 003 — tức là mở toang. Đó chính là
--    lý do nhà thầu SỬA được `defect_qty`.
--
--    ⚠️ Bài học: RESTRICTIVE là hàng rào. Gỡ hàng rào trước khi dựng xong
--    hàng rào mới thì trong khoảng giữa KHÔNG CÓ HÀNG RÀO NÀO.
--
-- ─── VÌ SAO KHÔNG DÙNG `FOR ALL` ──────────────────────────────────────────
--
-- `FOR ALL` sẽ chặn luôn `SELECT`. Nhà thầu VẪN PHẢI ĐỌC được ba bảng đầu để
-- làm việc — thu hẹp quyền ĐỌC là việc của 031d/031e, có policy thay thế đàng
-- hoàng. 031a chỉ đóng quyền GHI, không đụng một chữ nào vào quyền ĐỌC.
--
-- Đây cũng đúng kỷ luật "chia tách Policy" Kiến trúc sư đã ban.
--
-- ─── VÌ SAO DÙNG `RESTRICTIVE` CHỨ KHÔNG SỬA POLICY CŨ ────────────────────
--
-- RESTRICTIVE được nối bằng AND với MỌI policy PERMISSIVE, kể cả những policy
-- tôi chưa từng đọc. Nó đóng cửa mà KHÔNG cần biết trước trong nhà có bao
-- nhiêu cửa sổ. Sửa từng policy cũ thì chỉ đóng được đúng cái mình nhìn thấy.
--
-- ─── HIỆU NĂNG — ĐÚNG QUYẾT ĐỊNH ② CỦA KIẾN TRÚC SƯ ───────────────────────
--
-- "RLS không phải nơi tối ưu số dòng code. RLS là nơi tối ưu tốc độ."
--
-- `mos_is_external()` là hàm STABLE **KHÔNG THAM SỐ** → PostgreSQL gọi ĐÚNG
-- MỘT LẦN cho mỗi câu lệnh, không phải một lần cho mỗi dòng. Nó chỉ đọc một
-- claim trong JWT, không chạm bảng nào. Chi phí gần bằng không.
--
-- Đây chính là lý do 031a KHÔNG dùng `mos_can_write_assignment(id)`: hàm có
-- tham số đổi theo dòng thì N dòng = N lần gọi (đã đo ở Bước 4 của phân tích).
--
-- ⚠️ AN TOÀN KHI SAI: `mos_is_external()` trả FALSE nếu không đọc được claim.
-- Nghĩa là hỏng theo hướng "không chặn ai" chứ không phải "khoá cả nhà máy".
-- Với 031a đây là đánh đổi ĐÚNG: một migration siết quyền không được phép
-- biến sự cố token thành sự cố ngừng sản xuất.
--
-- ROLLBACK: xem Mục 5 cuối tệp.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 0. CHẶN TRƯỚC
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc
                  WHERE proname = 'mos_is_external'
                    AND pronamespace = 'public'::regnamespace) THEN
    RAISE EXCEPTION '031a DỪNG: thiếu mos_is_external() — migration 025 chưa chạy.';
  END IF;

  -- Hàm phải bao phủ CẢ hai vai ngoài. Nếu ai đó đã sửa nó thành chỉ 'subcon'
  -- thì Buyer sẽ lọt qua toàn bộ hàng rào dưới đây mà không ai hay.
  IF NOT EXISTS (SELECT 1 FROM pg_proc
                  WHERE proname = 'mos_is_external'
                    AND pronamespace = 'public'::regnamespace
                    AND prosrc LIKE '%buyer%' AND prosrc LIKE '%subcon%') THEN
    RAISE EXCEPTION '031a DỪNG: mos_is_external() không còn bao phủ cả buyer lẫn subcon.';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. BẢO ĐẢM RLS ĐANG BẬT
-- ────────────────────────────────────────────────────────────────────────────
-- Policy trên bảng chưa bật RLS là policy KHÔNG CHẠY — im lặng và vô hại,
-- đúng kiểu hỏng nguy hiểm nhất. Vòng lặp của 025 đã CỐ Ý bỏ qua ba bảng đầu,
-- nên không được cho rằng chúng đã bật.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['orders', 'cut_tickets', 'cut_bundles', 'qa_audit_reports']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. GỠ DI SẢN CỦA BẢN NHÁP 031 TRÊN `qa_audit_reports`
-- ────────────────────────────────────────────────────────────────────────────
-- `qa_audit_reports_partner_write` (PERMISSIVE, FOR INSERT) cho phép đối tác
-- TẠO kết quả QA nếu họ sở hữu phần việc. Quyết định 02/08/2026 nói ngược lại:
--
--     "Subcon chỉ được đọc và phản hồi, không được tạo, sửa hoặc xóa
--      kết quả QA chính thức."
--
-- Policy RESTRICTIVE ở Mục 3 đã đủ chặn nó. Nhưng để lại một policy mang tên
-- "partner_write" trên bảng QA là để lại một câu nói dối trong lược đồ: người
-- đọc sau sẽ tin rằng đối tác được ghi QA. Gỡ hẳn.
--
-- ⚠️ CHỈ gỡ trên `qa_audit_reports`. Hai bảng còn lại mà bản nháp đụng vào —
-- `hourly_production_logs` và `subcon_receipt_logs` — thì đối tác GHI LÀ ĐÚNG
-- Ý ĐỒ (họ có TRÁCH NHIỆM báo cáo sản lượng theo giờ). Không đụng vào chúng.
DROP POLICY IF EXISTS "qa_audit_reports_partner_write" ON public.qa_audit_reports;

-- ⚠️ GIỮ NGUYÊN `qa_audit_reports_partner_read`. Kiến trúc sư đã chốt nhà thầu
-- ĐƯỢC ĐỌC kết quả QA của phần việc mình — "chỉ được đọc và phản hồi".

-- ────────────────────────────────────────────────────────────────────────────
-- 3. BA POLICY CHẶN GHI, CHO TỪNG BẢNG — KHÔNG ĐỤNG `SELECT`
-- ────────────────────────────────────────────────────────────────────────────
-- Tách riêng INSERT / UPDATE / DELETE thay vì `FOR ALL`, vì `FOR ALL` bao gồm
-- cả SELECT. Xem phần đầu tệp.
--
--   INSERT → chỉ cần WITH CHECK  (không có dòng cũ để mà soi)
--   UPDATE → cần CẢ USING (dòng cũ) LẪN WITH CHECK (dòng mới).
--            Thiếu WITH CHECK thì người ngoài vẫn "biến" một dòng họ đọc được
--            thành dòng khác.
--   DELETE → chỉ cần USING
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['orders', 'cut_tickets', 'cut_bundles', 'qa_audit_reports']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "p031a_ext_no_insert" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "p031a_ext_no_insert" ON public.%I '
      'AS RESTRICTIVE FOR INSERT TO authenticated '
      'WITH CHECK (NOT public.mos_is_external())', t);

    EXECUTE format('DROP POLICY IF EXISTS "p031a_ext_no_update" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "p031a_ext_no_update" ON public.%I '
      'AS RESTRICTIVE FOR UPDATE TO authenticated '
      'USING (NOT public.mos_is_external()) '
      'WITH CHECK (NOT public.mos_is_external())', t);

    EXECUTE format('DROP POLICY IF EXISTS "p031a_ext_no_delete" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "p031a_ext_no_delete" ON public.%I '
      'AS RESTRICTIVE FOR DELETE TO authenticated '
      'USING (NOT public.mos_is_external())', t);
  END LOOP;
END $$;

COMMENT ON POLICY "p031a_ext_no_update" ON public.qa_audit_reports IS
  'Kết quả QA chính thức thuộc Monica. Nhà thầu đọc và phản hồi, không sửa.';

-- ────────────────────────────────────────────────────────────────────────────
-- 4. KIỂM TRA SAU KHI CHẠY
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ Mục này chỉ chứng minh POLICY ĐÃ ĐƯỢC TẠO. Nó KHÔNG chứng minh nhà thầu
-- thật sự bị chặn — chỉ phiên đăng nhập thật mới chứng minh được điều đó.
-- Bài kiểm hồi quy live-031a làm việc ấy.
SELECT muc, ket_qua, ky_vong,
       CASE WHEN ket_qua = ky_vong THEN '✅' ELSE '⛔ LỆCH' END AS dat
FROM (VALUES
  ('12 policy chặn ghi đã tạo',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'), '12'),
  ('...đều là RESTRICTIVE',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'
       AND permissive = 'RESTRICTIVE'), '12'),
  ('⚠️ KHÔNG policy nào đụng SELECT',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'
       AND cmd IN ('SELECT', 'ALL')), '0'),
  ('RLS bật trên cả 4 bảng',
   (SELECT COUNT(*)::TEXT FROM pg_class
     WHERE relnamespace = 'public'::regnamespace AND relrowsecurity
       AND relname IN ('orders','cut_tickets','cut_bundles','qa_audit_reports')), '4'),
  ('Di sản bản nháp đã gỡ khỏi QA',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'qa_audit_reports'
       AND policyname = 'qa_audit_reports_partner_write'), '0'),
  ('⭐ Nhà thầu VẪN ĐỌC được QA của mình (policy còn nguyên)',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'qa_audit_reports'
       AND policyname = 'qa_audit_reports_partner_read'), '1'),
  ('⭐ Sản lượng theo giờ KHÔNG bị đụng (nhà thầu vẫn phải ghi)',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'hourly_production_logs'
       AND policyname LIKE 'p031a_%'), '0'),
  ('⭐ Sổ cái báo cáo ngày KHÔNG bị đụng',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'assignment_daily_reports'
       AND policyname LIKE 'p031a_%'), '0')
) AS t(muc, ket_qua, ky_vong);

COMMIT;

-- ============================================================================
-- 5. ROLLBACK
-- ============================================================================
-- Gỡ đúng 12 policy do migration này tạo. KHÔNG khôi phục
-- `qa_audit_reports_partner_write` — policy đó trái quyết định 02/08/2026;
-- muốn dựng lại phải có ADR mới.
--
--   DO $$
--   DECLARE t TEXT;
--   BEGIN
--     FOREACH t IN ARRAY ARRAY['orders','cut_tickets','cut_bundles','qa_audit_reports']
--     LOOP
--       EXECUTE format('DROP POLICY IF EXISTS "p031a_ext_no_insert" ON public.%I', t);
--       EXECUTE format('DROP POLICY IF EXISTS "p031a_ext_no_update" ON public.%I', t);
--       EXECUTE format('DROP POLICY IF EXISTS "p031a_ext_no_delete" ON public.%I', t);
--     END LOOP;
--   END $$;
--
-- ⚠️ Rollback 031a TRẢ LẠI 14 lỗ hổng GHI. Chỉ làm khi có sự cố nghiêm trọng
-- hơn thế, và phải báo Kiến trúc sư ngay.
--
-- ============================================================================
-- 6. NHỮNG THỨ 031a CỐ Ý KHÔNG LÀM
-- ============================================================================
-- ① KHÔNG thu hẹp quyền ĐỌC. Nhà thầu vẫn thấy đủ 4 đơn hàng, 2 phiếu cắt,
--    3 bó, 3 phiếu QA. Đó là việc của 031d/031e.
--
-- ② KHÔNG mở Line Map. `sewing_lines` 0/4 vẫn nguyên — việc của 031b.
--
-- ③ KHÔNG gỡ quyền `DELETE` ở tầng GRANT. 029b mới thu hồi trên 8 bảng, KHÔNG
--    có bảng nào trong bốn bảng này. Nghĩa là NGƯỜI NỘI BỘ vẫn xoá cứng được
--    `orders`, `cut_tickets`, `cut_bundles`, `qa_audit_reports` — trái Hiến
--    pháp "TUYỆT ĐỐI KHÔNG dùng Hard-Delete với dữ liệu nghiệp vụ".
--    Đây là LỖ HỔNG THẬT, nằm ngoài phạm vi đã duyệt của 031a.
--    → Đề xuất `029d` mở rộng REVOKE. Chờ Kiến trúc sư quyết.
-- ============================================================================
