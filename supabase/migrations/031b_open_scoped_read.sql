-- ============================================================================
-- 031b · MỞ QUYỀN ĐỌC THEO PHẠM VI — LINE MAP CHO NHÀ THẦU, CHI TIẾT ĐƠN CHO BUYER
--
-- Phê duyệt: Kiến trúc sư trưởng, 02/08/2026 ("duyệt chạy 031b").
--
-- 031a ĐÓNG quyền ghi. 031b MỞ quyền đọc — đúng thứ tự: đóng cửa sau trước,
-- rồi mới mở cửa trước.
--
-- ─── VÌ SAO CẦN — LỖ HỔNG NGƯỢC CHIỀU ─────────────────────────────────────
--
-- "Không được vì bảo mật mà biến Subcon thành 'người mù'." — Kiến trúc sư
--
-- Đo 01/08/2026: nhà thầu thấy `sewing_lines` **0/4**. Họ không xem được Line
-- Map — thứ bắt buộc phải có để làm việc. Và Buyer thấy `order_items` **0/3**:
-- thấy đơn của mình nhưng không thấy chi tiết cỡ/màu của chính đơn ấy.
--
-- ─── PHẠM VI · BA BẢNG, KHÔNG PHẢI BỐN ────────────────────────────────────
--
--   ① `sewing_lines`      → nhà thầu, CHỈ chuyền được giao
--   ② `assignment_bundles` → nhà thầu, CHỈ bó thuộc phần việc của mình
--   ③ `order_items`        → Buyer, CHỈ chi tiết đơn của mình, CHỈ ĐỌC
--
-- ⚠️ TÔI ĐÃ BỎ `production_sites` KHỎI ĐỀ XUẤT CỦA CHÍNH MÌNH.
--
-- Đề xuất ban đầu của tôi có 4 bảng. Nhưng chỉ thị về Line Map nói rõ:
--
--     "Nhưng chỉ: Line được giao. Không phải Factory. Không phải Site.
--      Không phải Floor. Không phải Toàn bộ."
--
-- `production_sites` CHÍNH LÀ "Site". Mở nó là làm trái một câu đã ban.
-- Nhà thầu biết mình làm ở chuyền nào là đủ để làm việc; biết Monica có bao
-- nhiêu địa điểm sản xuất thì không.
--
-- ─── BÀI HỌC TỪ `qa_audit_reports` — ÁP DỤNG TRỰC TIẾP Ở ĐÂY ──────────────
--
-- Bản nháp 031 GỠ `subcon_denied` khỏi `qa_audit_reports` rồi chỉ thay policy
-- cho SELECT và INSERT, **quên UPDATE** → bảng rơi lại dưới quyền policy
-- PERMISSIVE có sẵn → nhà thầu sửa được kết quả kiểm hàng.
--
-- 031b cũng phải GỠ `subcon_denied` khỏi `sewing_lines`. Nên ở đây, ngay khi
-- gỡ, **phủ ĐỦ CẢ BỐN LỆNH** — SELECT có phạm vi, ba lệnh ghi chặn hẳn.
-- Không để một lệnh nào không có chủ.
--
-- ─── HIỆU NĂNG — QUYẾT ĐỊNH ② ────────────────────────────────────────────
--
-- "RLS không phải nơi tối ưu số dòng code. RLS là nơi tối ưu tốc độ."
--
-- Nên KHÔNG dùng `mos_can_read_assignment(id)`: hàm có tham số đổi theo dòng
-- ⇒ N dòng = N lần gọi (đã đo ở Bước 4). Thay bằng `EXISTS` dạng tập hợp, bên
-- trong chỉ gọi `mos_partner_id()` — hàm KHÔNG tham số, `STABLE`, nên
-- PostgreSQL gọi đúng MỘT LẦN cho cả câu lệnh.
--
-- ⚠️ CÁI GIÁ: luật "đối tác đọc được phần việc nào" bị LẶP LẠI ở đây thay vì
-- nằm một chỗ. Nếu `mos_can_read_assignment` đổi, phải sửa cả ở đây. Đây là
-- đánh đổi Kiến trúc sư đã chọn tường minh — ghi ra để người sau biết mà tìm.
--
-- Luật được sao lại nguyên văn từ `mos_can_read_assignment` (030 dòng 181–194):
--     deleted_at IS NULL · mos_partner_id() IS NOT NULL
--     · partner_id = mos_partner_id() · status NOT IN ('DRAFT','CANCELLED')
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 0. CHẶN TRƯỚC
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mos_partner_id'
                   AND pronamespace = 'public'::regnamespace) THEN
    RAISE EXCEPTION '031b DỪNG: thiếu mos_partner_id() — migration 030 chưa chạy.';
  END IF;
  -- 031a phải còn nguyên. Mở quyền đọc trên nền quyền ghi chưa đóng là sai thứ tự.
  IF (SELECT COUNT(*) FROM pg_policies
       WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'
         AND permissive = 'RESTRICTIVE') <> 12 THEN
    RAISE EXCEPTION '031b DỪNG: 031a không còn đủ 12 policy. Chạy 031a trước.';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. CHỈ MỤC — TRƯỚC KHI CÓ POLICY DÙNG TỚI CHÚNG
-- ────────────────────────────────────────────────────────────────────────────
-- Policy dưới đây lọc `assignments` theo `line_id` và theo `partner_id`. Không
-- có chỉ mục thì mỗi dòng `sewing_lines` kéo theo một lượt quét toàn bảng.
CREATE INDEX IF NOT EXISTS idx_assignments_line_partner
  ON public.assignments (line_id, partner_id)
  WHERE deleted_at IS NULL AND line_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assignment_bundles_assignment
  ON public.assignment_bundles (assignment_id)
  WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. `sewing_lines` — LINE MAP, CHỈ CHUYỀN ĐƯỢC GIAO
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ Đây là chỗ GỠ `subcon_denied`. Đọc lại đoạn "bài học qa_audit_reports"
-- ở đầu tệp trước khi sửa bất cứ dòng nào dưới đây.
--
-- Bốn lệnh, bốn policy. Không lệnh nào không có chủ.
DROP POLICY IF EXISTS "subcon_denied" ON public.sewing_lines;

-- 2.1 · ĐỌC — nội bộ thấy hết; nhà thầu chỉ thấy chuyền có phần việc của mình
DROP POLICY IF EXISTS "p031b_line_scoped_read" ON public.sewing_lines;
CREATE POLICY "p031b_line_scoped_read" ON public.sewing_lines
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    NOT public.mos_is_subcon()          -- ngắn mạch: nội bộ + buyer thoát ngay
    OR EXISTS (
      SELECT 1 FROM public.assignments a
       WHERE a.line_id = sewing_lines.id
         AND a.deleted_at IS NULL
         AND public.mos_partner_id() IS NOT NULL
         AND a.partner_id = public.mos_partner_id()
         AND a.status NOT IN ('DRAFT', 'CANCELLED')
    )
  );

-- 2.2 · GHI — người ngoài KHÔNG BAO GIỜ. Chuyền may là dữ liệu cấu hình của
-- nhà máy, không phải thứ nhà thầu khai báo.
DROP POLICY IF EXISTS "p031b_line_no_ext_insert" ON public.sewing_lines;
CREATE POLICY "p031b_line_no_ext_insert" ON public.sewing_lines
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (NOT public.mos_is_external());

DROP POLICY IF EXISTS "p031b_line_no_ext_update" ON public.sewing_lines;
CREATE POLICY "p031b_line_no_ext_update" ON public.sewing_lines
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (NOT public.mos_is_external())
  WITH CHECK (NOT public.mos_is_external());

DROP POLICY IF EXISTS "p031b_line_no_ext_delete" ON public.sewing_lines;
CREATE POLICY "p031b_line_no_ext_delete" ON public.sewing_lines
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT public.mos_is_external());

-- ⚠️ `buyer_denied` trên bảng này GIỮ NGUYÊN. Khách hàng không có việc gì với
-- sơ đồ chuyền của nhà máy.

-- ────────────────────────────────────────────────────────────────────────────
-- 3. `assignment_bundles` — BÓ THUỘC PHẦN VIỆC CỦA CHÍNH MÌNH
-- ────────────────────────────────────────────────────────────────────────────
-- Bảng này KHÔNG có `subcon_denied` (sinh ở 029, sau 025). Nó đang được canh
-- bằng `assignment_internal_only` — PERMISSIVE, FOR ALL, `NOT mos_is_external()`.
--
-- Nên KHÔNG cần gỡ gì. Chỉ THÊM một policy PERMISSIVE cho SELECT: policy
-- PERMISSIVE nối với nhau bằng OR, nên đối tác có thêm đường đọc, còn ba lệnh
-- ghi vẫn chỉ có `assignment_internal_only` phủ ⇒ đối tác vẫn không ghi được.
--
-- Đây là lý do 031b KHÔNG lặp lại kiểu "gỡ rồi thay" ở đây: không có gì để gỡ.
DROP POLICY IF EXISTS "p031b_abn_partner_read" ON public.assignment_bundles;
CREATE POLICY "p031b_abn_partner_read" ON public.assignment_bundles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
       WHERE a.id = assignment_bundles.assignment_id
         AND a.deleted_at IS NULL
         AND public.mos_partner_id() IS NOT NULL
         AND a.partner_id = public.mos_partner_id()
         AND a.status NOT IN ('DRAFT', 'CANCELLED')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 4. `order_items` — BUYER XEM CHI TIẾT ĐƠN CỦA CHÍNH MÌNH, CHỈ ĐỌC
-- ────────────────────────────────────────────────────────────────────────────
-- "Buyer được quyền xem order_items của chính đơn hàng mình; chỉ có quyền đọc."
--
-- Bảng đang mang `buyer_denied` (RESTRICTIVE FOR ALL, `NOT mos_is_buyer()`) —
-- chặn phẳng. Thay bằng policy có phạm vi, đúng khuôn 018 Mục 4c.
--
-- ⚠️ Phép tự kiểm của 018 (Mục 7d) đòi MỌI bảng phải có ít nhất một policy tên
-- `buyer_scope%` HOẶC `buyer_denied`. Đặt tên `buyer_scope_by_order` để phép
-- kiểm ấy vẫn xanh — đổi tên khác là làm thủng bài kiểm của migration cũ.
DROP POLICY IF EXISTS "buyer_denied" ON public.order_items;
DROP POLICY IF EXISTS "buyer_scope_by_order" ON public.order_items;
CREATE POLICY "buyer_scope_by_order" ON public.order_items
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    NOT public.mos_is_buyer()
    -- Dạng tập hợp, KHÔNG gọi `mos_buyer_can_see_order(order_id)` cho từng
    -- dòng. `mos_buyer_customer_id()` không tham số ⇒ một lần mỗi câu lệnh.
    OR EXISTS (
      SELECT 1 FROM public.orders o
       WHERE o.id = order_items.order_id
         AND public.mos_buyer_customer_id() IS NOT NULL
         AND o.customer_id = public.mos_buyer_customer_id()
    )
  )
  -- CHỈ ĐỌC. Buyer là người xem, không phải người sửa số lượng đặt hàng.
  WITH CHECK (NOT public.mos_is_buyer());

-- ⚠️ `subcon_denied` trên `order_items` GIỮ NGUYÊN — nhà thầu không cần chi
-- tiết cỡ/màu theo đơn; họ làm việc theo phần việc và bó.

-- ────────────────────────────────────────────────────────────────────────────
-- 5. KIỂM TRA SAU KHI CHẠY
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ Chỉ chứng minh POLICY ĐÃ TẠO. Việc chứng minh nhà thầu thật sự thấy đúng
-- những gì cần thấy là của `live-031b`.
SELECT muc, ket_qua, ky_vong,
       CASE WHEN ket_qua = ky_vong THEN '✅' ELSE '⛔ LỆCH' END AS dat
FROM (VALUES
  ('⭐ sewing_lines — đủ 4 policy của 031b',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'sewing_lines'
       AND policyname LIKE 'p031b_line_%'), '4'),
  ('⭐ sewing_lines — 3 lệnh GHI đều bị chặn',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'sewing_lines'
       AND policyname LIKE 'p031b_line_no_ext_%'
       AND permissive = 'RESTRICTIVE'), '3'),
  ('⚠️ sewing_lines — subcon_denied ĐÃ gỡ (có policy thay)',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'sewing_lines'
       AND policyname = 'subcon_denied'), '0'),
  ('⭐ sewing_lines — buyer_denied GIỮ NGUYÊN',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'sewing_lines'
       AND policyname = 'buyer_denied'), '1'),
  ('assignment_bundles — có policy đọc cho đối tác',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'assignment_bundles'
       AND policyname = 'p031b_abn_partner_read'), '1'),
  ('assignment_bundles — internal_only còn nguyên (chặn ghi)',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'assignment_bundles'
       AND policyname = 'assignment_internal_only'), '1'),
  ('⭐ order_items — buyer_scope_by_order thay cho buyer_denied',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'order_items'
       AND policyname = 'buyer_scope_by_order'), '1'),
  ('⚠️ order_items — buyer_denied đã gỡ',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'order_items'
       AND policyname = 'buyer_denied'), '0'),
  ('⭐ order_items — subcon_denied GIỮ NGUYÊN',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'order_items'
       AND policyname = 'subcon_denied'), '1'),
  ('⭐ Phép tự kiểm của 018 vẫn xanh — mọi bảng còn buyer_scope%/buyer_denied',
   (SELECT COUNT(*)::TEXT FROM pg_tables p
     WHERE p.schemaname = 'public'
       AND NOT EXISTS (SELECT 1 FROM pg_policies g
                        WHERE g.schemaname = 'public' AND g.tablename = p.tablename
                          AND (g.policyname LIKE 'buyer_scope%'
                            OR g.policyname = 'buyer_denied'))), '0'),
  ('⭐ 031a còn nguyên 12 policy',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'
       AND permissive = 'RESTRICTIVE'), '12'),
  ('⚠️ production_sites KHÔNG bị đụng (chỉ thị: không phải Site)',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'production_sites'
       AND policyname LIKE 'p031b_%'), '0')
) AS t(muc, ket_qua, ky_vong);

COMMIT;

-- ============================================================================
-- 6. ROLLBACK
-- ============================================================================
--   -- sewing_lines: dựng LẠI hàng rào phẳng TRƯỚC khi gỡ policy có phạm vi,
--   -- để không có khoảng trống nào ở giữa (bài học qa_audit_reports).
--   CREATE POLICY "subcon_denied" ON public.sewing_lines
--     AS RESTRICTIVE FOR ALL TO authenticated
--     USING (NOT public.mos_is_subcon()) WITH CHECK (NOT public.mos_is_subcon());
--   DROP POLICY IF EXISTS "p031b_line_scoped_read"    ON public.sewing_lines;
--   DROP POLICY IF EXISTS "p031b_line_no_ext_insert"  ON public.sewing_lines;
--   DROP POLICY IF EXISTS "p031b_line_no_ext_update"  ON public.sewing_lines;
--   DROP POLICY IF EXISTS "p031b_line_no_ext_delete"  ON public.sewing_lines;
--
--   DROP POLICY IF EXISTS "p031b_abn_partner_read" ON public.assignment_bundles;
--
--   -- order_items: dựng lại chặn phẳng cho buyer
--   DROP POLICY IF EXISTS "buyer_scope_by_order" ON public.order_items;
--   CREATE POLICY "buyer_denied" ON public.order_items
--     AS RESTRICTIVE FOR ALL TO authenticated
--     USING (NOT public.mos_is_buyer()) WITH CHECK (NOT public.mos_is_buyer());
--
-- Rollback 031b làm nhà thầu mù trở lại và Buyer mất chi tiết đơn. Không mở
-- lại lỗ hổng bảo mật nào — 031b chỉ MỞ ĐỌC, không đụng quyền ghi của 031a.
--
-- ============================================================================
-- 7. CỐ Ý KHÔNG LÀM
-- ============================================================================
-- ① `production_sites` — chỉ thị nói rõ "Không phải Site". Xem đầu tệp.
-- ② KHÔNG thu hẹp `orders`/`cut_tickets`/`cut_bundles` — việc của 031d/031e.
--    Nhà thầu vẫn thấy cả 4 đơn hàng. 031b không làm điều đó tệ hơn, cũng
--    không làm tốt hơn.
-- ③ KHÔNG đụng `subcontractors` — việc của 031c.
-- ============================================================================
