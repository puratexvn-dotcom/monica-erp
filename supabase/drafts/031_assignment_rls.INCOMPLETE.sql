-- ############################################################################
-- ⛔ BẢN NHÁP CHƯA HOÀN CHỈNH — ĐÃ BỊ CHẠY NHẦM MỘT LẦN. TUYỆT ĐỐI KHÔNG CHẠY.
--
-- Tệp này từng được thực thi ngoài dự kiến và là nguồn gốc TRỰC TIẾP của một
-- lỗ hổng bảo mật thật:
--
--   Nó GỠ `subcon_denied` khỏi `qa_audit_reports` (dòng ~150) rồi chỉ thay
--   policy cho SELECT và INSERT — **quên hẳn UPDATE**. Bảng rơi trở lại dưới
--   quyền policy PERMISSIVE có sẵn, và nhà thầu SỬA ĐƯỢC KẾT QUẢ KIỂM HÀNG
--   của chính mình.
--
--   Lỗ hổng tồn tại nhiều ngày, không ai biết, cho tới khi Migration 031a đo
--   lại bằng phiên đăng nhập thật.
--
-- ⚠️ BÀI HỌC ĐÃ GHI VÀO PLAYBOOK: gỡ một hàng rào RESTRICTIVE trước khi dựng
-- xong hàng rào thay thế thì **trong khoảng giữa không có hàng rào nào**.
--
-- Phần việc của tệp này đã được làm lại tử tế ở: 031a · 031b · 031c · 031c2 ·
-- 031c3. Giữ lại đây làm tư liệu điều tra, KHÔNG phải để dùng.
-- ############################################################################

-- ============================================================================
-- MONICA MOS — 031 · RLS THEO ASSIGNMENT   ⚠️ BẢN NHÁP — CHƯA ĐƯỢC CHẠY
--
-- Tệp mang đuôi `.DRAFT.sql` CÓ CHỦ Ý: nó không được chạy cho tới khi
--   ① ADR-006 phê duyệt
--   ② 030 chạy xong và năm hàm có phép kiểm đối chiếu với bản TypeScript
--   ③ có ÍT NHẤT MỘT `partner_account` thật để kiểm bằng phiên thật
--   ④ đo hiệu năng XEN KẼ trên dữ liệu có ý nghĩa
--
-- ⚠️ ĐÂY LÀ ĐIỂM KHÔNG QUAY LẠI CỦA CẢ ASSIGNMENT ENGINE.
-- Hoàn tác 031 không phải thao tác kỹ thuật — nó là quyết định chấp nhận lại
-- một vi phạm Điều XXX đang sống (xem ADR-006 Mục 5).
-- ============================================================================

BEGIN;   -- ⚠️ TẤT CẢ TRONG MỘT GIAO DỊCH. Xem Mục 1.

-- ════════════════════════════════════════════════════════════════════════════
-- 1. VÌ SAO MỘT GIAO DỊCH DUY NHẤT
-- ════════════════════════════════════════════════════════════════════════════
-- Migration này làm hai việc ngược chiều nhau trên cùng một tập bảng:
--     ① CÀI policy mới theo Assignment
--     ② GỠ `subcon_denied` (RESTRICTIVE, từ 025)
--
-- ⚠️ Nếu chúng chạy ở HAI migration khác nhau thì giữa hai lần chạy hệ thống
-- rơi vào một trong hai trạng thái, và cả hai đều sai:
--
--     gỡ trước, cài sau  →  danh sách cho phép của 025 sống lại
--                           ⇒ subcon lại thấy MỌI đơn hàng và NHÀ THẦU KHÁC
--     cài trước, gỡ sau  →  RESTRICTIVE vẫn AND vào
--                           ⇒ cổng đối tác TRẮNG TRƠN, và không lỗi nào nổ ra
--
-- Trong một giao dịch thì không có khoảnh khắc nào ở giữa.
--
-- ⚠️ VÀ CHỈ GỠ `subcon_denied` Ở ĐÚNG NHỮNG BẢNG ĐÃ CÀI POLICY THAY THẾ.
-- Bảng nào chưa có policy Assignment thì `subcon_denied` PHẢI Ở LẠI — gỡ hết
-- một lượt là mở toang những bảng chưa ai thiết kế quyền.

-- ════════════════════════════════════════════════════════════════════════════
-- 2. ASSIGNMENT — thay policy `FOR ALL` bằng policy tách theo lệnh
-- ════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "assignment_internal_only" ON public.assignments;

-- ─── 2.1 ĐỌC ────────────────────────────────────────────────────────────
CREATE POLICY "asg_read" ON public.assignments
  FOR SELECT TO authenticated
  USING (
    NOT public.mos_is_external()                      -- người nội bộ: thấy hết
    OR public.mos_can_read_assignment(id)             -- đối tác: chỉ việc của mình
  );

-- ─── 2.2 GHI — CHỈ NGƯỜI NỘI BỘ ────────────────────────────────────────
-- ⚠️ Đối tác KHÔNG BAO GIỜ ghi thẳng vào `assignments`.
--
-- Nhận việc / từ chối / báo xong đi qua Server Action, và Service kiểm
-- `canDecideAssignment()` trước khi ghi bằng phiên nội bộ.
--
-- Cho ghi thẳng thì họ sửa luôn `planned_finish` — tức TỰ GIA HẠN CỬA SỔ QUYỀN
-- của chính mình. Đó chính là lỗ hổng mà ADR-004 mô tả, và nó không phải lỗi
-- dữ liệu mà là lỗ hổng phân quyền.
CREATE POLICY "asg_write_internal" ON public.assignments
  FOR INSERT TO authenticated WITH CHECK (NOT public.mos_is_external());

CREATE POLICY "asg_update_internal" ON public.assignments
  FOR UPDATE TO authenticated
  USING (NOT public.mos_is_external())
  WITH CHECK (NOT public.mos_is_external());

-- KHÔNG policy DELETE — cộng với REVOKE của 029b là hai lớp.

-- ════════════════════════════════════════════════════════════════════════════
-- 3. ĐIỀU KHOẢN THƯƠNG MẠI — đối tác thấy đơn giá CỦA CHÍNH MÌNH
-- ════════════════════════════════════════════════════════════════════════════
-- 036 đã tách policy ở đây; 031 chỉ NỚI vế đọc, giữ nguyên phần còn lại.
DROP POLICY IF EXISTS "act_select_active" ON public.assignment_commercial_terms;
CREATE POLICY "act_select_active" ON public.assignment_commercial_terms
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      NOT public.mos_is_external()
      OR public.mos_can_read_assignment(assignment_id)
    )
  );

-- ⚠️ Ranh giới nằm ở chữ "CỦA CHÍNH MÌNH". Đối tác thấy đơn giá của họ vì đó là
-- điều kiện để đối soát — người làm phải biết mình được trả bao nhiêu. Họ KHÔNG
-- thấy giá bán cho khách, giá thành nội bộ, hay điều khoản của đối tác khác.
-- `mos_can_read_assignment` lọc đúng điều đó, và không cần gì thêm.

-- ════════════════════════════════════════════════════════════════════════════
-- 4. SỔ CÁI — ĐỌC của mình · GHI trong cửa sổ
-- ════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "assignment_internal_only" ON public.assignment_daily_reports;

CREATE POLICY "adr_read" ON public.assignment_daily_reports
  FOR SELECT TO authenticated
  USING (
    NOT public.mos_is_external()
    OR public.mos_can_read_assignment(assignment_id)
  );

-- ⭐ ĐÂY LÀ POLICY QUAN TRỌNG NHẤT CỦA CẢ MIGRATION.
-- Điều XXX mục 6: đối tác **bắt buộc phải GHI**. Một cổng chỉ-đọc nghĩa là ai
-- đó bên Monica gõ hộ sản lượng, và lúc đó con số không còn là lời khai của
-- người làm mà là lời kể lại của người thứ ba — truy trách nhiệm sụp đổ.
CREATE POLICY "adr_write_partner" ON public.assignment_daily_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    NOT public.mos_is_external()
    OR (
      public.mos_can_write_assignment(assignment_id)
      AND public.mos_partner_can('assignment_daily_reports', 'WRITE')
    )
  );

-- KHÔNG policy UPDATE/DELETE: sổ cái chỉ-ghi-thêm, trigger của 029 đã chặn.
-- Hai lớp cho cùng một điều.

-- ════════════════════════════════════════════════════════════════════════════
-- 5. BẢNG VẬN HÀNH — nối qua `assignment_id`
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Dòng CŨ có `assignment_id = NULL` (có trước 029). Chúng KHÔNG thuộc
-- Assignment nào và sẽ mãi mãi không thuộc — đó là sự thật lịch sử.
-- Policy phải để người NỘI BỘ vẫn thấy chúng, còn đối tác thì không.
-- `mos_can_read_assignment(NULL)` trả FALSE ⇒ đúng như mong muốn.
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'hourly_production_logs', 'qa_audit_reports', 'subcon_receipt_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_partner_read', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
      USING (NOT public.mos_is_external()
             OR public.mos_can_read_assignment(assignment_id))
    $f$, t || '_partner_read', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_partner_write', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
      WITH CHECK (NOT public.mos_is_external()
                  OR (public.mos_can_write_assignment(assignment_id)
                      AND public.mos_partner_can(%L, 'WRITE')))
    $f$, t || '_partner_write', t, t);

    -- ⚠️ GỠ `subcon_denied` CHỈ Ở BẢNG NÀY, và chỉ vì nó vừa có policy thay thế.
    EXECUTE format('DROP POLICY IF EXISTS "subcon_denied" ON public.%I', t);
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. THU HẸP THỨ ĐANG LỘ — Vấn đề ① của ADR-006
-- ════════════════════════════════════════════════════════════════════════════
-- Đo được hôm nay: một phiên `subcon` thật thấy CẢ 3 đơn hàng, CẢ 2 bó, và
-- **CẢ 2 NHÀ THẦU KHÁC**. Playbook Điều XXX cấm thấy "Other Subcon" — đây là
-- vi phạm ĐANG SỐNG.
--
-- ⚠️ MỤC NÀY LÀ PHẦN RỦI RO NHẤT CỦA 031: nó THU HẸP quyền đang có, nên nếu
-- sai thì phân hệ `/subcon` hiện hành gãy ngay. Phải kiểm bằng phiên thật của
-- CẢ nội bộ lẫn đối tác trước khi chạy thật.

-- ─── 6.1 orders — chỉ đơn có việc của mình ─────────────────────────────
-- ⚠️ CHƯA CHỐT: `orders` cũng phục vụ Buyer qua `mos_buyer_can_see_order()`
-- của 018. Policy mới phải HỢP với đường đó, không được thay thế nó.
-- Cần đọc lại 018 và ghép biểu thức — CHƯA VIẾT Ở BẢN NHÁP NÀY.

-- ─── 6.2 cut_bundles — nối qua bảng quan hệ ────────────────────────────
-- `cut_bundles` KHÔNG có `assignment_id`; nối qua `assignment_bundles`:
--
--   EXISTS (SELECT 1 FROM assignment_bundles ab
--            WHERE ab.bundle_id = cut_bundles.id
--              AND ab.deleted_at IS NULL
--              AND mos_can_read_assignment(ab.assignment_id))
--
-- ⚠️ Đây là policy ĐẮT NHẤT của cả migration: một `EXISTS` lồng, chạy cho từng
-- dòng `cut_bundles`. PHẢI đo trước khi chạy thật, và có thể cần chỉ mục
-- `assignment_bundles(bundle_id) WHERE deleted_at IS NULL` — đã có ở 029
-- (`uq_assignment_bundle_active`), nhưng phải xác nhận planner dùng nó.

-- ─── 6.3 subcontractors — chỉ hồ sơ của chính mình ─────────────────────
-- Nối qua cột cầu `partners.subcontractor_id`. ⚠️ Thu hẹp bảng này sẽ đụng
-- phân hệ `/subcon` nội bộ — phải xác nhận người nội bộ không bị ảnh hưởng.

-- ════════════════════════════════════════════════════════════════════════════
-- 7. NHỮNG THỨ 031 KHÔNG ĐƯỢC ĐỤNG
-- ════════════════════════════════════════════════════════════════════════════
-- `subcon_denied` PHẢI Ở LẠI trên mọi bảng chưa có policy Assignment thay thế —
-- đặc biệt: `financial_records` · `profiles` · `partners` · `subcon_orders` ·
-- `partner_accounts` · bảng lương · bảng điều khiển Giám đốc.
--
-- Đo được hôm nay: cả ba bảng đầu đã chặn đúng. 031 KHÔNG được làm chúng lỏng ra.

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- 8. CÒN THIẾU TRƯỚC KHI BẢN NHÁP NÀY THÀNH MIGRATION THẬT
-- ════════════════════════════════════════════════════════════════════════════
--   ☐ Mục 6.1 · ghép với `mos_buyer_can_see_order()` của 018
--   ☐ Mục 6.2 · viết policy `cut_bundles` + ĐO chi phí `EXISTS` lồng
--   ☐ Mục 6.3 · policy `subcontractors` + xác nhận `/subcon` nội bộ không gãy
--   ☐ `cut_tickets` — vào qua phép nhúng `cut_bundles`, cần policy riêng
--   ☐ Khối kiểm tra cuối tệp (mọi migration khác đều có)
--   ☐ Kịch bản hoàn tác đầy đủ — và ghi rõ nó là HẠ CẤP BẢO MẬT
--
-- ⚠️ Sáu dòng trên là lý do tệp này còn mang đuôi `.DRAFT.sql`.
