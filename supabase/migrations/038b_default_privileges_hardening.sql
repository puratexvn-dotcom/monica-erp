-- ============================================================================
-- 038b · ĐÓNG MẶC ĐỊNH — HÀM TẠO SAU NÀY KHÔNG TỰ CẤP QUYỀN CHO `anon`
--
-- Phê duyệt: Kiến trúc sư trưởng, 02/08/2026 — phương án (a) kèm (b).
--
-- 038 đóng cửa cho 19 hàm ĐANG CÓ. Nhưng nó không ngăn được hàm TẠO SAU: mỗi
-- `CREATE FUNCTION` mới lại nhận quyền theo `ALTER DEFAULT PRIVILEGES` mà
-- Supabase cài sẵn:
--
--     ALTER DEFAULT PRIVILEGES IN SCHEMA public
--       GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
--
-- Chỉ có 038 mà không có 038b thì mỗi hàm mới đều hở, từ lúc tạo tới lúc có
-- ai đó nhớ chạy A001. Đó là cửa sổ không nên tồn tại.
--
-- 038  = đóng cửa.        038b = đổi ổ khoá.        A001 = canh cửa.
--
-- ─── ⚠️ TỆP NÀY ĐỔI HÀNH VI MẶC ĐỊNH CỦA CẢ DỰ ÁN ─────────────────────────
--
-- Sau khi chạy, hàm mới tạo trong `public` sẽ **KHÔNG** tự có quyền cho
-- `anon`, và **KHÔNG** tự có `EXECUTE` cho `PUBLIC`.
--
-- Nghĩa là mọi migration về sau **BẮT BUỘC** phải cấp quyền tường minh:
--
--     GRANT EXECUTE ON FUNCTION public.ten_ham(...) TO authenticated;
--
-- Quên dòng đó thì hàm sẽ không gọi được — hỏng **ồn ào và ngay lập tức**,
-- chứ không hỏng im lặng. Đây là đánh đổi CÓ CHỦ Ý: tường minh hơn ngầm định,
-- và hỏng-thấy-ngay hơn hở-không-ai-biết.
--
-- ─── PHẠM VI THẬT SỰ CỦA `ALTER DEFAULT PRIVILEGES` ───────────────────────
--
-- ⚠️ Nó CHỈ áp cho đối tượng do MỘT VAI CỤ THỂ tạo ra. Không có `FOR ROLE` thì
-- vai đó là `current_user`. Nên tệp này chỉ che được hàm do chính vai đang
-- chạy migration tạo ra.
--
-- Hàm do vai KHÁC tạo (ví dụ extension cài bằng `supabase_admin`) vẫn theo
-- mặc định của vai ấy. Mục 1 in ra `pg_default_acl` để nhìn rõ còn vai nào
-- đang cấp quyền cho `anon`. Đó chính là lý do (b) — giữ A001 chạy mỗi vòng —
-- vẫn bắt buộc, chứ 038b không thay được nó.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. NHÌN TRƯỚC KHI ĐỔI — QUYỀN MẶC ĐỊNH ĐANG DO NHỮNG VAI NÀO ĐẶT
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE r RECORD; n INT := 0;
BEGIN
  RAISE NOTICE '── pg_default_acl hiện tại (schema public) ──';
  FOR r IN
    SELECT pg_get_userbyid(d.defaclrole) AS vai_tao,
           CASE d.defaclobjtype WHEN 'f' THEN 'hàm' WHEN 'r' THEN 'bảng'
                                WHEN 'S' THEN 'sequence' ELSE d.defaclobjtype::TEXT END AS loai,
           d.defaclacl::TEXT AS quyen
      FROM pg_default_acl d
      JOIN pg_namespace ns ON ns.oid = d.defaclnamespace
     WHERE ns.nspname = 'public'
  LOOP
    RAISE NOTICE '  vai tạo=% · loại=% · quyền=%', r.vai_tao, r.loai, r.quyen;
    n := n + 1;
  END LOOP;
  IF n = 0 THEN
    RAISE NOTICE '  (không có mục nào — đang dùng mặc định gốc của PostgreSQL)';
  END IF;
  RAISE NOTICE '── vai đang chạy tệp này: % ──', current_user;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ĐỔI MẶC ĐỊNH
-- ────────────────────────────────────────────────────────────────────────────
-- (a) `anon` — người CHƯA ĐĂNG NHẬP. Không có lý do nào để mặc định họ gọi
--     được một hàm nghiệp vụ. Cần công khai thật thì cấp tay, có chủ ý.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;

-- (b) `PUBLIC` — PostgreSQL tự cấp `EXECUTE` cho PUBLIC trên MỌI hàm mới. Đây
--     là mặc định gốc của PostgreSQL, không phải của Supabase, và nó là lý do
--     `REVOKE ... FROM anon` đơn lẻ ở 018/025 không bao giờ đủ.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ⚠️ CỐ Ý KHÔNG đụng `authenticated` và `service_role`. Cắt `authenticated` là
-- khoá mười hai vai trò nội bộ; cắt `service_role` là khoá cả tầng máy chủ.

-- ────────────────────────────────────────────────────────────────────────────
-- 3. KIỂM TRA SAU KHI CHẠY
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ Mục này chỉ đọc CẤU HÌNH MẶC ĐỊNH. Nó không chứng minh được hàm TƯƠNG LAI
-- sẽ đóng — chỉ có A001 chạy sau khi tạo hàm mới mới chứng minh được điều đó.
SELECT muc, ket_qua, ky_vong,
       CASE WHEN ket_qua = ky_vong THEN '✅' ELSE '⛔ LỆCH' END AS dat
FROM (VALUES
  ('⭐ Mặc định của vai hiện tại KHÔNG còn cấp gì cho anon',
   (SELECT COALESCE(
      (SELECT (array_to_string(d.defaclacl, ',') NOT ILIKE '%anon=%')::TEXT
         FROM pg_default_acl d
         JOIN pg_namespace ns ON ns.oid = d.defaclnamespace
        WHERE ns.nspname = 'public' AND d.defaclobjtype = 'f'
          AND d.defaclrole = current_user::regrole),
      'true')), 'true'),
  ('Hàm SECURITY DEFINER mà anon còn gọi được (038 vẫn giữ)',
   (SELECT COUNT(*)::TEXT FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
       AND has_function_privilege('anon', p.oid, 'EXECUTE')), '0'),
  ('⚠️ authenticated VẪN gọi được mos_is_external',
   (SELECT has_function_privilege('authenticated', p.oid, 'EXECUTE')::TEXT
      FROM pg_proc p WHERE p.proname = 'mos_is_external'
       AND p.pronamespace = 'public'::regnamespace), 'true')
) AS t(muc, ket_qua, ky_vong);

COMMIT;

-- ============================================================================
-- 4. ROLLBACK
-- ============================================================================
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
--
-- ⚠️ Rollback đưa dự án về đúng trạng thái đã sinh ra lỗ hổng 038. Nếu lý do
-- quay lui là "một hàm mới không gọi được", thì cách sửa ĐÚNG là thêm
-- `GRANT EXECUTE ... TO authenticated` cho hàm đó, KHÔNG phải mở lại mặc định.
-- ============================================================================
