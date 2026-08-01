-- ============================================================================
-- 038c · ĐÓNG NỐT MẶC ĐỊNH CỦA VAI `supabase_admin`
--
-- A001 bản 2 Mục 4 cho thấy `038b` mới đóng được một nửa:
--
--   postgres tạo hàm       postgres=X, authenticated=X, service_role=X        ✅
--   postgres tạo bảng      postgres, authenticated, service_role              ✅
--   supabase_admin tạo hàm   ... , anon=X/supabase_admin , ...                ⛔
--   supabase_admin tạo bảng  ... , anon=arwdDxtm/supabase_admin , ...         ⛔
--
-- `ALTER DEFAULT PRIVILEGES` **chỉ áp cho đối tượng do MỘT VAI CỤ THỂ tạo ra**.
-- 038b chạy dưới `postgres` nên chỉ đổi mặc định của `postgres`. Đối tượng do
-- `supabase_admin` tạo — extension, hoặc bất kỳ thứ gì hạ tầng dựng lên trong
-- `public` — vẫn nhận quyền cho `anon`.
--
-- Dòng `supabase_admin tạo bảng · anon=arwdDxtm` đáng lo hơn dòng hàm:
-- `arwdDxtm` là **toàn quyền**, cấp cho người **chưa đăng nhập**.
--
-- ─── ⚠️ TỆP NÀY CÓ THỂ KHÔNG CHẠY ĐƯỢC, VÀ ĐÓ LÀ KẾT QUẢ HỢP LỆ ────────────
--
-- Chỉ đổi được mặc định của một vai nếu vai đang chạy **là** vai đó hoặc **là
-- thành viên** của nó. Trên Supabase, `postgres` thường KHÔNG phải thành viên
-- của `supabase_admin`.
--
-- Nên tệp này **thử**, và nếu không được thì **nói thẳng ra** thay vì đổ cả
-- migration. Không đổi được cũng là một thông tin cần biết, không phải một lỗi
-- cần giấu.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_la_thanh_vien BOOLEAN;
  v_con_ho        INT;
BEGIN
  SELECT pg_has_role(current_user, 'supabase_admin', 'MEMBER') INTO v_la_thanh_vien;
  RAISE NOTICE 'Vai đang chạy: % · là thành viên supabase_admin: %',
    current_user, v_la_thanh_vien;

  IF v_la_thanh_vien THEN
    BEGIN
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public '
              'REVOKE ALL ON FUNCTIONS FROM anon';
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public '
              'REVOKE ALL ON TABLES FROM anon';
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public '
              'REVOKE ALL ON SEQUENCES FROM anon';
      RAISE NOTICE '✅ Đã đóng mặc định của supabase_admin (hàm · bảng · sequence).';
    EXCEPTION WHEN insufficient_privilege OR OTHERS THEN
      RAISE WARNING '⚠️ KHÔNG đổi được mặc định của supabase_admin: % (%)',
        SQLERRM, SQLSTATE;
      RAISE WARNING '   → Phải nhờ Supabase Support, hoặc chấp nhận và dựa vào A001.';
    END;
  ELSE
    RAISE WARNING '⚠️ % KHÔNG phải thành viên của supabase_admin — không đổi được '
                  'mặc định của vai đó.', current_user;
    RAISE WARNING '   Đây KHÔNG phải lỗi của tệp này, mà là giới hạn quyền trên Supabase.';
    RAISE WARNING '   Rủi ro còn lại: đối tượng do supabase_admin tạo trong public sẽ '
                  'mang quyền cho anon.';
    RAISE WARNING '   Giảm nhẹ: A001 Mục 3+4 chạy MỖI VÒNG (Hiến pháp V.4) sẽ bắt được '
                  'ngay khi có đối tượng như vậy xuất hiện.';
  END IF;

  -- Dù nhánh nào, vẫn phải khẳng định hiện trạng KHÔNG xấu đi.
  SELECT COUNT(*) INTO v_con_ho
    FROM pg_proc p
   WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
     AND has_function_privilege('anon', p.oid, 'EXECUTE');
  IF v_con_ho > 0 THEN
    RAISE EXCEPTION '038c DỪNG — % hàm SECURITY DEFINER vẫn cho anon gọi. '
                    '038 đã bị đảo ngược?', v_con_ho;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- KIỂM TRA SAU KHI CHẠY
-- ────────────────────────────────────────────────────────────────────────────
SELECT
  pg_get_userbyid(d.defaclrole) AS vai_tao,
  CASE d.defaclobjtype WHEN 'f' THEN 'hàm' WHEN 'r' THEN 'bảng'
                       WHEN 'S' THEN 'sequence' ELSE d.defaclobjtype::TEXT END AS loai,
  array_to_string(d.defaclacl, ', ') AS quyen_mac_dinh,
  CASE WHEN array_to_string(d.defaclacl, ',') ILIKE '%anon=%'
       THEN '⛔ còn cấp cho anon' ELSE '✅' END AS dat
FROM pg_default_acl d
JOIN pg_namespace ns ON ns.oid = d.defaclnamespace
WHERE ns.nspname = 'public'
ORDER BY dat, vai_tao, loai;

COMMIT;

-- ============================================================================
-- ROLLBACK
--   ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
--     GRANT ALL ON FUNCTIONS TO anon;   -- và TABLES, SEQUENCES tương tự
-- ============================================================================
