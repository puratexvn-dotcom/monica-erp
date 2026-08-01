-- ============================================================================
-- 038 · VÁ KHẨN — NGƯỜI CHƯA ĐĂNG NHẬP GỌI ĐƯỢC HÀM `SECURITY DEFINER`
--
-- Phát hiện: A001 Mục 3, ngày 02/08/2026. Đo lại bằng phiên `anon` thật:
--
--     13 / 14 hàm — người CHƯA ĐĂNG NHẬP qua được cổng quyền.
--     Trong đó 2 hàm là HÀM GHI.
--
-- ─── VÌ SAO ĐÂY LÀ VIỆC KHẨN ──────────────────────────────────────────────
--
-- Hàm `SECURITY DEFINER` chạy dưới quyền NGƯỜI TẠO (`postgres`) — kẻ vượt mặt
-- mọi RLS. Cho người chưa đăng nhập gọi nó là mở một đường vòng quanh toàn bộ
-- hàng rào vừa dựng ở 031a.
--
-- Hai hàm ghi ĐÃ CHẠY THẬT khi gọi bằng `anon`:
--
--     mos_soft_delete_commercial_term(uuid) → P0002 "không tìm thấy điều khoản"
--     mos_restore_commercial_term(uuid)     → P0002 "không tìm thấy điều khoản"
--
-- `P0002` là lỗi NGHIỆP VỤ do chính thân hàm ném ra, KHÔNG phải `42501`.
-- Nghĩa là cổng quyền đã cho qua, hàm đã thực thi, và chỉ dừng vì tôi cố tình
-- truyền một UUID không tồn tại. Truyền UUID thật thì nó XOÁ THẬT — bởi một
-- người không hề đăng nhập.
--
-- `assignment_commercial_terms` là bảng ĐIỀU KHOẢN THƯƠNG MẠI — nơi giữ GIÁ.
--
-- ─── VÌ SAO CÁC LẦN REVOKE TRƯỚC KHÔNG ĂN ─────────────────────────────────
--
-- Không phải vì quên. Đã có đủ cả hai kiểu, và CẢ HAI đều hụt:
--
--   018 dòng 157–159 · 025 dòng 79–80   REVOKE EXECUTE ... FROM anon
--   030 dòng 237 · 036b dòng 138–139    REVOKE ALL ... FROM PUBLIC
--
-- Supabase cài sẵn:
--
--     ALTER DEFAULT PRIVILEGES IN SCHEMA public
--       GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
--
-- Nên MỖI hàm mới sinh ra đã mang sẵn MỘT GRANT THẲNG CHO `anon` — không phải
-- quyền thừa kế qua `PUBLIC`.
--
--   `REVOKE ... FROM PUBLIC` không chạm tới grant thẳng đó.
--   `REVOKE ... FROM anon`   thì đúng đích, nhưng lần `CREATE OR REPLACE` kế
--                            tiếp ở migration sau lại nạp quyền mặc định về.
--
-- ⚠️ Bài học chung, đã gặp lần thứ hai: **`GRANT` chỉ cộng thêm, không bao giờ
-- bớt đi.** Muốn đóng thì phải `REVOKE` đúng người được cấp — và phải đóng
-- LẠI sau mỗi lần tạo lại hàm.
--
-- Bằng chứng đối chứng: `wh_unblock_roll` bị từ chối đúng `42501`. Cơ chế vẫn
-- hoạt động khi grant viết đúng — nên đây là lỗi cấu hình, không phải giới hạn
-- của PostgreSQL.
--
-- ─── PHẠM VI ──────────────────────────────────────────────────────────────
--
-- Chỉ hàm `SECURITY DEFINER` trong schema `public` — đúng tập mà A001 soi.
-- Hàm thường (`SECURITY INVOKER`) chạy dưới quyền người gọi nên không có đặc
-- quyền để mà lạm dụng; để lần sau.
--
-- Migration này KHÔNG đổi Domain, KHÔNG đổi kiến trúc. Nó chỉ **thực hiện cho
-- đúng** điều mà 018, 025, 030 và 036b đều đã tuyên bố mà chưa làm được.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ĐÓNG — VÀ GIỮ NGUYÊN QUYỀN CỦA `authenticated`
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ Chỗ dễ hỏng nhất của migration này: nếu `authenticated` đang có quyền
-- THỪA KẾ QUA `PUBLIC` chứ không phải grant riêng, thì `REVOKE FROM PUBLIC`
-- sẽ cắt luôn quyền của họ — và mọi RLS policy gọi `mos_is_external()` sẽ đổ
-- với "permission denied for function", tức là **khoá sạch mười hai vai trò
-- nội bộ**.
--
-- Nên: CHỤP quyền của `authenticated` TRƯỚC, thu hồi, rồi CẤP LẠI đúng những
-- hàm họ vốn có. Không suy đoán, không cấp bừa cho tất cả.
DO $$
DECLARE
  r          RECORD;
  v_had_auth BOOLEAN;
  n_dong     INT := 0;
  n_giu      INT := 0;
BEGIN
  FOR r IN
    SELECT p.oid,
           p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace
       AND p.prosecdef                       -- CHỈ hàm SECURITY DEFINER
  LOOP
    v_had_auth := has_function_privilege('authenticated', r.oid, 'EXECUTE');

    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC',
                   r.proname, r.args);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM anon',
                   r.proname, r.args);
    n_dong := n_dong + 1;

    IF v_had_auth THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated',
                     r.proname, r.args);
      n_giu := n_giu + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Đã đóng % hàm với PUBLIC và anon; giữ nguyên quyền của authenticated ở % hàm.',
    n_dong, n_giu;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. KIỂM TRA SAU KHI CHẠY
-- ────────────────────────────────────────────────────────────────────────────
SELECT muc, ket_qua, ky_vong,
       CASE WHEN ket_qua = ky_vong THEN '✅' ELSE '⛔ LỆCH' END AS dat
FROM (VALUES
  ('⭐ Hàm SECURITY DEFINER mà anon còn gọi được',
   (SELECT COUNT(*)::TEXT FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
       AND has_function_privilege('anon', p.oid, 'EXECUTE')), '0'),
  ('⭐ Hai RPC xoá mềm — anon còn gọi được',
   (SELECT COUNT(*)::TEXT FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace
       AND p.proname IN ('mos_soft_delete_commercial_term','mos_restore_commercial_term')
       AND has_function_privilege('anon', p.oid, 'EXECUTE')), '0'),
  ('⚠️ authenticated VẪN gọi được mos_is_external (RLS phụ thuộc)',
   (SELECT has_function_privilege('authenticated', p.oid, 'EXECUTE')::TEXT
      FROM pg_proc p WHERE p.proname = 'mos_is_external'
       AND p.pronamespace = 'public'::regnamespace), 'true'),
  ('⚠️ authenticated VẪN gọi được mos_is_subcon',
   (SELECT has_function_privilege('authenticated', p.oid, 'EXECUTE')::TEXT
      FROM pg_proc p WHERE p.proname = 'mos_is_subcon'
       AND p.pronamespace = 'public'::regnamespace), 'true'),
  ('⚠️ authenticated VẪN gọi được mos_is_buyer',
   (SELECT has_function_privilege('authenticated', p.oid, 'EXECUTE')::TEXT
      FROM pg_proc p WHERE p.proname = 'mos_is_buyer'
       AND p.pronamespace = 'public'::regnamespace), 'true'),
  ('⚠️ authenticated VẪN gọi được mos_can_read_assignment',
   (SELECT has_function_privilege('authenticated', p.oid, 'EXECUTE')::TEXT
      FROM pg_proc p WHERE p.proname = 'mos_can_read_assignment'
       AND p.pronamespace = 'public'::regnamespace), 'true'),
  ('Mọi hàm SECURITY DEFINER đều còn ghim search_path',
   (SELECT COUNT(*)::TEXT FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
       AND (p.proconfig IS NULL
            OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) x
                            WHERE x LIKE 'search_path=%'))), '0')
) AS t(muc, ket_qua, ky_vong);

COMMIT;

-- ============================================================================
-- 3. ROLLBACK
-- ============================================================================
--   DO $$
--   DECLARE r RECORD;
--   BEGIN
--     FOR r IN SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
--                FROM pg_proc p
--               WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
--     LOOP
--       EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO anon',
--                      r.proname, r.args);
--     END LOOP;
--   END $$;
--
-- ⚠️ Rollback TRẢ LẠI cho người chưa đăng nhập quyền gọi hai RPC xoá mềm.
-- Gần như không bao giờ nên làm.
--
-- ============================================================================
-- 4. VIỆC CÒN LẠI — KHÔNG THUỘC PHẠM VI TỆP NÀY
-- ============================================================================
-- ⚠️ Migration này đóng cửa cho các hàm ĐANG TỒN TẠI. Nó KHÔNG ngăn hàm TẠO
-- SAU này lại mang sẵn grant cho `anon` theo `ALTER DEFAULT PRIVILEGES` của
-- Supabase.
--
-- Có hai đường xử tận gốc, cần Kiến trúc sư chọn:
--
--   (a) Đổi luôn DEFAULT PRIVILEGES của schema:
--         ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
--       Gọn nhất, nhưng đổi hành vi mặc định của cả dự án — nếu sau này có
--       endpoint công khai thật thì phải nhớ cấp tay.
--
--   (b) Giữ nguyên mặc định, và thêm phép kiểm A001 vào mọi vòng Regression
--       để bắt được ngay khi một hàm mới lọt ra.
--
-- Tôi nghiêng về **(a) kèm (b)**: (a) đóng cửa, (b) canh cửa. Chỉ (b) thì mỗi
-- hàm mới vẫn hở trong khoảng thời gian từ lúc tạo tới lúc ai đó chạy audit.
-- ============================================================================
