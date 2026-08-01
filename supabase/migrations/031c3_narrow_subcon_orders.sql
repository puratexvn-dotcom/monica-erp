-- ============================================================================
-- 031c3 · THU HẸP `subcon_orders` — CHẶN RÒ RỈ GIÁ GIỮA HAI NHÀ THẦU
--
-- Phê duyệt: Kiến trúc sư trưởng, 02/08/2026.
--
--   "Mọi RLS của `subcon_orders` phải phân quyền theo `assignment_id`, không
--    theo `vendor_id`. `vendor_id` chỉ là Business Attribute, không phải ranh
--    giới phân quyền."
--
-- ⚠️ CHẠY SAU `040`. Bất biến I-11 phải có trước, nếu không policy khoanh theo
-- `assignment_id` sẽ gặp những dòng mà `vendor_id` trỏ về một chủ khác — đúng
-- sự mơ hồ mà I-11 sinh ra để dẹp.
--
-- ─── ĐO ĐƯỢC GÌ ───────────────────────────────────────────────────────────
--
-- Security Regression 02/08/2026, ngay sau khi `S001` Phần B gieo dữ liệu vào
-- một bảng vốn RỖNG:
--
--     SUB-GIAT-02   4/4   thấy cả đơn của IN-01
--     SUB-IN-01     4/4   thấy cả đơn của GIAT
--     SC1           4/4   dù không có hồ sơ nhà thầu dịch vụ nào
--
-- 🔴 Nghiêm trọng nhất là `unit_price`: GIAT đọc được đơn giá **7800** của
-- IN-01, và ngược lại. **Hai nhà thầu cạnh tranh cùng một công đoạn đọc được
-- giá của nhau.** Điều XXX: *"❌ không thấy giá của người khác"*.
--
-- ─── VÌ SAO THỦNG ─────────────────────────────────────────────────────────
--
-- `subcon_orders` nằm trong DANH SÁCH CHO PHÉP của `025` nên không có
-- `subcon_denied`. `026` thêm ba policy RESTRICTIVE — nhưng **cả ba đều cho
-- GHI** (`subcon_no_insert/update/delete_assignment`). Quyền ĐỌC chưa từng bị
-- thu hẹp.
--
-- ⚠️ Và nó vô hình cho tới hôm nay **vì bảng rỗng** — cùng vòng tròn với sự cố
-- `bundle_stage_enum`. Lần thứ hai trong một ngày.
--
-- ─── VÌ SAO CHỈ THÊM, KHÔNG GỠ ────────────────────────────────────────────
--
-- Ba policy GHI của `026` và `buyer_denied` GIỮ NGUYÊN. 031c3 chỉ THÊM một
-- RESTRICTIVE cho SELECT. Thêm RESTRICTIVE là SIẾT, không bao giờ là NỚI —
-- nên không lặp lại được sự cố `qa_audit_reports`.
--
-- ─── ⚠️ PHỤ THUỘC NGẦM — ĐỌC TRƯỚC KHI SỬA `assignments` ──────────────────
--
-- Policy dưới đây có truy vấn con vào `assignments`. Theo Playbook **K-3**,
-- truy vấn con trong policy VẪN CHỊU RLS và chạy dưới quyền người gọi — nên
-- nó chỉ hoạt động vì **nhà thầu ĐỌC ĐƯỢC phần việc của mình** (`asg_read`).
--
-- Đây là cùng kiểu phụ thuộc với `p031b_line_scoped_read`. Hệ quả: **siết
-- `assignments` chặt hơn sẽ làm đơn gia công biến mất khỏi cổng nhà thầu mà
-- không ai đụng tới `subcon_orders`.** Phải đo lại bảng này sau MỌI thay đổi
-- trên `assignments`.
--
-- Không dùng `mos_can_read_assignment(id)` (miễn nhiễm RLS) vì nó là hàm CÓ
-- THAM SỐ ⇒ N dòng = N lần gọi — trái Quyết định ②. Đổi lại phải chép luật.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 0. CHẶN TRƯỚC
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger
                  WHERE tgname = 'subcon_orders_i11_trg' AND NOT tgisinternal) THEN
    RAISE EXCEPTION '031c3 DỪNG: bất biến I-11 chưa có. Chạy 040 trước.';
  END IF;
  IF (SELECT COUNT(*) FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'subcon_orders'
         AND policyname LIKE 'subcon_no_%_assignment') <> 3 THEN
    RAISE EXCEPTION '031c3 DỪNG: thiếu hàng rào GHI của 026 trên subcon_orders.';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. CHỈ MỤC
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_subcon_orders_assignment
  ON public.subcon_orders (assignment_id)
  WHERE assignment_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ĐỌC — CHỈ ĐƠN THUỘC PHẦN VIỆC ĐƯỢC GIAO
-- ────────────────────────────────────────────────────────────────────────────
-- Luật chép nguyên từ `mos_can_read_assignment` (030 dòng 181–194):
--   deleted_at IS NULL · mos_partner_id() IS NOT NULL
--   · partner_id = mos_partner_id() · status NOT IN ('DRAFT','CANCELLED')
--
-- ⚠️ Dòng MỒ CÔI (`assignment_id IS NULL`) KHÔNG khớp `a.id = ...` nên rơi ra
-- ngoài — người ngoài không thấy. Đó là hành vi ĐÚNG và có chủ ý: dòng mồ côi
-- không thuộc phần việc nào, nên không thuộc về nhà thầu nào.
DROP POLICY IF EXISTS "p031c3_so_scoped_read" ON public.subcon_orders;
CREATE POLICY "p031c3_so_scoped_read" ON public.subcon_orders
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    NOT public.mos_is_subcon()          -- ngắn mạch: nội bộ + buyer thoát ngay
    OR EXISTS (
      SELECT 1 FROM public.assignments a
       WHERE a.id = subcon_orders.assignment_id
         AND a.deleted_at IS NULL
         AND public.mos_partner_id() IS NOT NULL
         AND a.partner_id = public.mos_partner_id()
         AND a.status NOT IN ('DRAFT', 'CANCELLED')
    )
  );

COMMENT ON POLICY "p031c3_so_scoped_read" ON public.subcon_orders IS
  'Assignment là Security Boundary duy nhất (ADR-008 Mục 0). Khoanh theo '
  '`assignment_id`, KHÔNG theo `vendor_id`. Chặn rò rỉ `unit_price` giữa hai '
  'nhà thầu cạnh tranh — Điều XXX.';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. KIỂM TRA SAU KHI CHẠY
-- ────────────────────────────────────────────────────────────────────────────
SELECT muc, ket_qua, ky_vong,
       CASE WHEN ket_qua = ky_vong THEN '✅' ELSE '⛔ LỆCH' END AS dat
FROM (VALUES
  ('⭐ Policy thu hẹp quyền đọc đã tạo',
   (SELECT (permissive || '/' || cmd) FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'subcon_orders'
       AND policyname = 'p031c3_so_scoped_read'), 'RESTRICTIVE/SELECT'),
  ('⭐ Policy khoanh theo assignment_id, KHÔNG theo vendor_id',
   (SELECT (qual LIKE '%assignment_id%' AND qual NOT LIKE '%vendor_id%')::TEXT
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subcon_orders'
       AND policyname = 'p031c3_so_scoped_read'), 'true'),
  ('⚠️ Ba hàng rào GHI của 026 GIỮ NGUYÊN',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'subcon_orders'
       AND policyname LIKE 'subcon_no_%_assignment'), '3'),
  ('⚠️ buyer_denied GIỮ NGUYÊN',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'subcon_orders'
       AND policyname = 'buyer_denied'), '1'),
  ('Bất biến I-11 còn nguyên',
   (SELECT COUNT(*)::TEXT FROM pg_trigger
     WHERE tgname = 'subcon_orders_i11_trg' AND NOT tgisinternal), '1'),
  ('⭐ 031a còn nguyên', (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'), '12'),
  ('⭐ 031b còn nguyên', (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE 'p031b_%'), '5'),
  ('⭐ 031c còn nguyên', (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE 'p031c_%'), '1')
) AS t(muc, ket_qua, ky_vong);

COMMIT;

-- ============================================================================
-- 4. ROLLBACK
--   DROP POLICY IF EXISTS "p031c3_so_scoped_read" ON public.subcon_orders;
--
-- ⚠️ Rollback mở lại đường cho hai nhà thầu cạnh tranh đọc giá của nhau.
--
-- ============================================================================
-- 5. CỐ Ý KHÔNG LÀM
-- ============================================================================
-- `subcon_issue_logs` và `subcon_receipt_logs` vẫn RỖNG (ADR-008 chưa chốt),
-- nên CHƯA ĐO ĐƯỢC quyền trên chúng — Hiến pháp V.1 cấm kết luận trên bảng
-- rỗng, và cấm luôn việc viết policy dựa trên phỏng đoán.
--
-- Cả hai bảng đã có cột `assignment_id`, nên khuôn policy sẽ giống hệt tệp này.
-- Nhưng viết trước khi đo được là đúng thứ sai lầm đã tạo ra bản nháp 031.
-- ============================================================================
