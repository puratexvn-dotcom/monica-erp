-- ============================================================================
-- MONICA MOS — 026 · P0 · CHẶN NHÀ THẦU TỰ CẤP QUYỀN CHO MÌNH
--
-- ⚠️ ĐÂY KHÔNG PHẢI RÒ RỈ DỮ LIỆU. ĐÂY LÀ LEO THANG ĐẶC QUYỀN.
--
-- ─── ĐO BẰNG PHIÊN ĐĂNG NHẬP NHÀ THẦU THẬT ───────────────────────────────
--   INSERT subcon_orders { unit_price: 99999 }   → THÀNH CÔNG
--   UPDATE subcon_orders SET unit_price = 1      → THÀNH CÔNG
--   DELETE subcon_orders                          → THÀNH CÔNG
--
-- Tức là nhà thầu TỰ GIAO VIỆC cho chính mình, TỰ ĐẶT ĐƠN GIÁ, rồi TỰ XOÁ dấu
-- vết. `subcon_orders` chính là bản Assignment thô sơ của hệ thống hiện tại —
-- ai tạo được nó thì tự cấp quyền cho mình.
--
-- ─── ĐIỀU XXX, MỤC 4 ─────────────────────────────────────────────────────
-- "Nhà thầu chỉ tồn tại khi có Assignment. Đây mới là nguồn xác định quyền."
-- Mọi Assignment PHẢI do Monica tạo. Nhà thầu chỉ được cập nhật dữ liệu PHÁT
-- SINH trên Assignment ĐÃ TỒN TẠI.
--
-- ─── PHẠM VI CỐ Ý HẸP ────────────────────────────────────────────────────
-- Kiến trúc sư đã quyết KHÔNG gỡ quyền ĐỌC `subcontractors`/`subcon_orders`
-- lúc này, để Cổng Nhà thầu đang chạy không chết. Đây là trạng thái CHUYỂN
-- TIẾP, không phải lời giải cuối. Lời giải cuối là Assignment Engine.
--
-- Vì vậy migration này KHÔNG đụng gì tới quyền ĐỌC. Chỉ chặn GHI.
--
-- ⚠️ KHÔNG chặn ghi `subcon_issue_logs` / `subcon_receipt_logs`: đó là dữ liệu
-- PHÁT SINH trên Assignment đã có, đúng thứ Điều XXX mục 6 nói nhà thầu BẮT
-- BUỘC phải ghi. Chặn chúng là biến nhà thầu thành người chỉ đọc — kiểu thiết
-- kế mà mục 2 gọi thẳng là sai.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. CHẶN GHI, GIỮ ĐỌC
-- ════════════════════════════════════════════════════════════════════════════
-- Ba policy RESTRICTIVE tách theo từng lệnh. Không gộp thành một `FOR ALL` vì
-- `FOR ALL` sẽ chặn luôn SELECT — mà đọc thì phải giữ để cổng nhà thầu sống.
--
-- Lưu ý cú pháp: policy `FOR INSERT` CHỈ có WITH CHECK, không có USING.

DROP POLICY IF EXISTS "subcon_no_insert_assignment" ON public.subcon_orders;
CREATE POLICY "subcon_no_insert_assignment" ON public.subcon_orders
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (NOT public.mos_is_subcon());

DROP POLICY IF EXISTS "subcon_no_update_assignment" ON public.subcon_orders;
CREATE POLICY "subcon_no_update_assignment" ON public.subcon_orders
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING      (NOT public.mos_is_subcon())
  WITH CHECK (NOT public.mos_is_subcon());

DROP POLICY IF EXISTS "subcon_no_delete_assignment" ON public.subcon_orders;
CREATE POLICY "subcon_no_delete_assignment" ON public.subcon_orders
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT public.mos_is_subcon());

-- ─── VÌ SAO CHẶN CẢ DELETE ───────────────────────────────────────────────
-- Chỉ chặn INSERT và UPDATE thì nhà thầu vẫn xoá được đơn gia công của mình —
-- xoá bằng chứng về khối lượng đã nhận. Đã đo: DELETE hiện THÀNH CÔNG.

-- ════════════════════════════════════════════════════════════════════════════
-- 2. CÙNG LÝ LẼ ĐÓ CHO BẢNG NHÀ THẦU
-- ════════════════════════════════════════════════════════════════════════════
-- Nhà thầu tự sửa được hồ sơ nhà thầu KHÁC là leo thang cùng loại: đổi tên,
-- đổi mã, hoặc vô hiệu hoá đối thủ. Quyền đọc vẫn giữ (trạng thái chuyển tiếp).
DROP POLICY IF EXISTS "subcon_no_write_vendor" ON public.subcontractors;
CREATE POLICY "subcon_no_write_vendor" ON public.subcontractors
  AS RESTRICTIVE FOR ALL TO authenticated
  USING      (TRUE)                              -- đọc: không đụng
  WITH CHECK (NOT public.mos_is_subcon());       -- ghi: chặn

-- ⚠️ `USING (TRUE)` ở đây là CỐ Ý và AN TOÀN, không phải sơ suất:
-- với policy RESTRICTIVE, `USING` áp cho SELECT/UPDATE-cũ/DELETE còn
-- `WITH CHECK` áp cho dòng SẮP GHI. Để USING mở nghĩa là không thu hẹp quyền
-- đọc vốn có; WITH CHECK mới là chỗ chặn. Nếu đặt `USING (NOT mos_is_subcon())`
-- thì cổng nhà thầu mất luôn danh sách nhà thầu và màn hình chính trắng xoá.
--
-- Hệ quả đã cân nhắc: DELETE vẫn lọt qua policy này (DELETE không xét WITH
-- CHECK). Bổ sung một policy riêng cho DELETE:
DROP POLICY IF EXISTS "subcon_no_delete_vendor" ON public.subcontractors;
CREATE POLICY "subcon_no_delete_vendor" ON public.subcontractors
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT public.mos_is_subcon());

-- ════════════════════════════════════════════════════════════════════════════
-- 3. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Ba policy chặn ghi trên subcon_orders' AS muc,
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'subcon_orders'
           AND policyname LIKE 'subcon_no_%_assignment') AS ket_qua,
       '3' AS ky_vong
UNION ALL
SELECT 'Chúng đều là RESTRICTIVE (không phải PERMISSIVE)',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'subcon_orders'
           AND policyname LIKE 'subcon_no_%_assignment' AND permissive = 'RESTRICTIVE'), '3'
UNION ALL
SELECT 'Phủ đủ ba lệnh INSERT / UPDATE / DELETE',
       (SELECT COUNT(DISTINCT cmd)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'subcon_orders'
           AND policyname LIKE 'subcon_no_%_assignment'), '3'
UNION ALL
SELECT 'KHÔNG có policy nào chặn SELECT trên subcon_orders',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'subcon_orders'
           AND permissive = 'RESTRICTIVE' AND cmd IN ('SELECT', 'ALL')
           AND policyname LIKE 'subcon_no_%'), '0'
UNION ALL
SELECT 'Hai policy chặn ghi trên subcontractors',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'subcontractors'
           AND policyname LIKE 'subcon_no_%_vendor'), '2'
UNION ALL
SELECT 'subcon_issue_logs CỐ Ý không bị chặn ghi (dữ liệu phát sinh)',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'subcon_issue_logs'
           AND policyname LIKE 'subcon_no_%'), '0'
UNION ALL
SELECT 'subcon_receipt_logs CỐ Ý không bị chặn ghi',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'subcon_receipt_logs'
           AND policyname LIKE 'subcon_no_%'), '0'
UNION ALL
SELECT 'Policy của 025 còn nguyên',
       (SELECT COUNT(DISTINCT tablename)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND policyname = 'subcon_denied'), '> 0';
