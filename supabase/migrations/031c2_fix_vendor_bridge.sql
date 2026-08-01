-- ============================================================================
-- 031c2 · VÁ 031c — POLICY TRUY VẤN MỘT BẢNG MÀ CHÍNH NGƯỜI GỌI KHÔNG ĐỌC ĐƯỢC
--
-- ─── ĐO ĐƯỢC GÌ ───────────────────────────────────────────────────────────
--
-- Hồi quy `live-031c`: 11 đạt · 2 hỏng.
--
--     SERVICE_PARTNER thấy 0/2   — CHỜ 1/2
--
-- 031c không khoanh. Nó **chặn sạch**. Và nếu bài kiểm chỉ dùng
-- PRODUCTION_PARTNER (vốn chờ 0) thì lỗi này ĐÃ LỌT — cả hai đều ra 0, không
-- phân biệt được "khoanh đúng" với "chặn hết".
--
-- ─── VÌ SAO — CÁI BẪY ─────────────────────────────────────────────────────
--
-- Policy của 031c viết:
--
--     EXISTS (SELECT 1 FROM public.partners p
--              WHERE p.id = public.mos_partner_id() ...)
--
-- **Truy vấn con bên trong một policy vẫn chịu RLS**, và được đánh giá dưới
-- quyền NGƯỜI GỌI. Mà `partners` có `partners_internal_only`
-- (`NOT mos_is_external()`) — nhà thầu đọc `partners` ra **0 dòng** (đã đo).
--
-- Nên `EXISTS(...)` **luôn luôn SAI** với mọi nhà thầu. Policy trông như một
-- phép khoanh vùng, nhưng chạy ra một phép chặn phẳng.
--
-- ⚠️ QUY TẮC RÚT RA:
--     **Policy KHÔNG được truy vấn một bảng mà chính người gọi không đọc được.**
--     Muốn bắc cầu qua bảng đóng thì phải đi qua hàm `SECURITY DEFINER`.
--
-- ─── VÌ SAO 031b KHÔNG DÍNH ───────────────────────────────────────────────
--
-- `p031b_line_scoped_read` cũng có truy vấn con — nhưng vào `assignments`, mà
-- nhà thầu ĐỌC ĐƯỢC phần việc của mình (`asg_read` cho phép). Truy vấn con
-- trả về dòng ⇒ policy chạy đúng. Đo được: SC1 thấy 1/4 chuyền.
--
-- Khác biệt nằm ở chỗ **bảng được bắc cầu có mở cho người gọi hay không** —
-- không nằm ở kiểu viết policy. `partners` đóng, `assignments` mở.
--
-- ⚠️ Hệ quả cần nhớ: 031b đang PHỤ THUỘC NGẦM vào policy đọc của `assignments`.
-- Chặng nào sau này siết `assignments` chặt hơn sẽ làm Line Map tối đi mà
-- không hề đụng tới `sewing_lines`. Đã ghi vào Coverage Matrix.
--
-- ─── CÁCH SỬA ─────────────────────────────────────────────────────────────
--
-- Thêm `mos_partner_subcontractor_id()` — `SECURITY DEFINER`, KHÔNG THAM SỐ.
-- Nó bắc cầu `partner_accounts → partners → subcontractor_id` dưới quyền chủ
-- sở hữu, nên không bị RLS của `partners` chặn.
--
-- Không tham số ⇒ `STABLE` có tác dụng thật: gọi MỘT LẦN cho cả câu lệnh
-- (Quyết định ②). Đây cũng chính là khuôn của `mos_partner_id()` ở 030.
--
-- Hàm mới ⇒ phải đủ SÁU MỤC của Hiến pháp V.3 — xem
-- `docs/SECURITY_DEFINER_REGISTRY.md`.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. HÀM BẮC CẦU
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mos_partner_subcontractor_id()
RETURNS UUID
LANGUAGE SQL STABLE
SECURITY DEFINER                          -- Mục 1: phải vượt RLS của `partners`
SET search_path = public, pg_temp         -- Mục 3
AS $$
  SELECT p.subcontractor_id
    FROM public.partner_accounts pa
    JOIN public.partners p ON p.id = pa.partner_id
   WHERE pa.user_id = auth.uid()
     AND pa.is_active
     AND p.is_active
     AND p.deleted_at IS NULL
   LIMIT 1;
$$;

COMMENT ON FUNCTION public.mos_partner_subcontractor_id() IS
  'Hồ sơ `subcontractors` mà đối tác đang đăng nhập trỏ tới, hoặc NULL. '
  'SECURITY DEFINER vì `partners` đóng với chính đối tác — policy truy vấn '
  'thẳng vào đó sẽ luôn ra rỗng (sự cố 031c).';

-- Mục 4 — PHẢI CÓ CẢ HAI DÒNG. `FROM PUBLIC` không xoá grant thẳng cho `anon`;
-- `FROM anon` không xoá quyền thừa kế qua `PUBLIC`. Bài học 038.
REVOKE ALL ON FUNCTION public.mos_partner_subcontractor_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mos_partner_subcontractor_id() FROM anon;
-- Mục 5 — cấp tường minh. Sau 038b, mặc định KHÔNG còn tự cấp cho ai.
GRANT EXECUTE ON FUNCTION public.mos_partner_subcontractor_id() TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. VIẾT LẠI POLICY — SO CỘT, KHÔNG TRUY VẤN CON
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "p031c_vendor_scoped_read" ON public.subcontractors;
CREATE POLICY "p031c_vendor_scoped_read" ON public.subcontractors
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    NOT public.mos_is_subcon()          -- ngắn mạch: nội bộ + buyer thoát ngay
    -- `IS NOT NULL` TƯỜNG MINH, không dựa vào `x = NULL` cho ra NULL. Cùng lý
    -- do 030 dòng 185–187: dựa vào một đặc tính dễ quên là cách để người sau
    -- viết lại và làm thủng.
    OR (public.mos_partner_subcontractor_id() IS NOT NULL
        AND subcontractors.id = public.mos_partner_subcontractor_id())
  );

COMMENT ON POLICY "p031c_vendor_scoped_read" ON public.subcontractors IS
  'Điều XXX mục 10: nhà thầu không thấy nhà thầu khác. Đóng khoản nợ chuyển '
  'tiếp mà migration 026 dòng 65 đã ghi nhận. Bắc cầu bằng hàm SECURITY '
  'DEFINER vì `partners` đóng với chính đối tác.';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. KIỂM TRA SAU KHI CHẠY
-- ────────────────────────────────────────────────────────────────────────────
SELECT muc, ket_qua, ky_vong,
       CASE WHEN ket_qua = ky_vong THEN '✅' ELSE '⛔ LỆCH' END AS dat
FROM (VALUES
  ('Hàm bắc cầu đã tạo',
   (SELECT COUNT(*)::TEXT FROM pg_proc
     WHERE proname = 'mos_partner_subcontractor_id'
       AND pronamespace = 'public'::regnamespace), '1'),
  ('...là SECURITY DEFINER',
   (SELECT prosecdef::TEXT FROM pg_proc
     WHERE proname = 'mos_partner_subcontractor_id'
       AND pronamespace = 'public'::regnamespace), 'true'),
  ('...đã ghim search_path (V.3 Mục 3)',
   (SELECT EXISTS (SELECT 1 FROM unnest(proconfig) x WHERE x LIKE 'search_path=%')::TEXT
      FROM pg_proc WHERE proname = 'mos_partner_subcontractor_id'
       AND pronamespace = 'public'::regnamespace), 'true'),
  ('⭐ ...anon KHÔNG gọi được (V.3 Mục 4)',
   (SELECT has_function_privilege('anon', oid, 'EXECUTE')::TEXT FROM pg_proc
     WHERE proname = 'mos_partner_subcontractor_id'
       AND pronamespace = 'public'::regnamespace), 'false'),
  ('...authenticated GỌI ĐƯỢC (V.3 Mục 5)',
   (SELECT has_function_privilege('authenticated', oid, 'EXECUTE')::TEXT FROM pg_proc
     WHERE proname = 'mos_partner_subcontractor_id'
       AND pronamespace = 'public'::regnamespace), 'true'),
  ('⭐ A001 vẫn xanh — 0 hàm SECDEF cho anon gọi',
   (SELECT COUNT(*)::TEXT FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
       AND has_function_privilege('anon', p.oid, 'EXECUTE')), '0'),
  ('Số hàm SECURITY DEFINER (19 + 1 mới)',
   (SELECT COUNT(*)::TEXT FROM pg_proc
     WHERE pronamespace = 'public'::regnamespace AND prosecdef), '20'),
  ('⭐ Policy đã viết lại, vẫn RESTRICTIVE/SELECT',
   (SELECT (permissive || '/' || cmd) FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'subcontractors'
       AND policyname = 'p031c_vendor_scoped_read'), 'RESTRICTIVE/SELECT'),
  ('⚠️ Hàng rào GHI của 026 GIỮ NGUYÊN',
   (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'subcontractors'
       AND policyname IN ('subcon_no_write_vendor','subcon_no_delete_vendor')), '2'),
  ('⭐ 031a còn nguyên', (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'
       AND permissive = 'RESTRICTIVE'), '12'),
  ('⭐ 031b còn nguyên', (SELECT COUNT(*)::TEXT FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE 'p031b_%'), '5')
) AS t(muc, ket_qua, ky_vong);

COMMIT;

-- ============================================================================
-- 4. ROLLBACK
--   DROP POLICY IF EXISTS "p031c_vendor_scoped_read" ON public.subcontractors;
--   DROP FUNCTION IF EXISTS public.mos_partner_subcontractor_id();
--
-- ⚠️ KHÔNG khôi phục bản 031c: nó chặn phẳng, tức nhà thầu mất luôn hồ sơ của
-- chính mình. Rollback là quay về trạng thái TRƯỚC 031c (thấy cả 2).
-- ============================================================================
