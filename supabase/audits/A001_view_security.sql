-- ============================================================================
-- A001 · KIỂM AN NINH VIEW & HÀM SECURITY DEFINER — Quyết định ⑦
--
-- "Không kiểm thủ công. Mỗi lần migration." — Kiến trúc sư trưởng
-- Hiến pháp V.4: A001 là bài kiểm hồi quy BẮT BUỘC mỗi vòng phát triển.
--
-- ⚠️ ĐÂY LÀ TỆP CHỈ-ĐỌC. Không CREATE, ALTER, INSERT, UPDATE, DELETE.
--
-- ─── BẢN 2 — VÌ SAO PHẢI VIẾT LẠI ─────────────────────────────────────────
--
-- Bản 1 chia làm bốn câu `SELECT` riêng. SQL Editor của Supabase **chỉ hiển
-- thị kết quả của câu SELECT CUỐI CÙNG**, nên Mục 1 và Mục 2 chạy xong rồi
-- biến mất — ba lần chạy liền, người đọc chỉ thấy được đúng Mục 3.
--
-- Đó là lỗi thiết kế của bài kiểm, không phải lỗi người chạy. Một bài kiểm mà
-- kết quả không đến được mắt người đọc thì bằng không.
--
-- Bản này gộp TẤT CẢ vào MỘT tập kết quả duy nhất bằng `UNION ALL`.
-- Cột `muc` cho biết dòng thuộc phần nào.
--
-- ─── CÁCH ĐỌC ─────────────────────────────────────────────────────────────
--   Cột `danh_gia`:  ✅ đạt   ·   ⛔ HỎNG — phải xử lý   ·   ⚠️ cần để mắt
--   Dòng `muc = '0 · KẾT LUẬN'` là tóm tắt. Đọc dòng đó trước.
-- ============================================================================

WITH
-- ── 1. VIEW: cờ an ninh ────────────────────────────────────────────────────
-- `security_invoker = true` → view chạy bằng quyền NGƯỜI GỌI, RLS của họ áp
-- dụng. Thiếu cờ → chạy bằng quyền NGƯỜI SỞ HỮU (`postgres`), vượt mặt RLS.
v AS (
  SELECT c.relname, c.oid,
         COALESCE(array_to_string(c.reloptions, ','), '') AS opts
    FROM pg_class c
   WHERE c.relnamespace = 'public'::regnamespace
     AND c.relkind IN ('v', 'm')
),
v_rows AS (
  SELECT '1 · VIEW' AS muc,
         v.relname  AS doi_tuong,
         CASE WHEN v.opts ILIKE '%security_invoker=true%'
              THEN 'invoker' ELSE 'DEFINER' END
         || CASE WHEN v.opts ILIKE '%security_barrier=true%' THEN ' + barrier' ELSE '' END
         || CASE WHEN has_table_privilege('anon', v.oid, 'SELECT')
                 THEN ' · anon ĐỌC ĐƯỢC' ELSE '' END        AS chi_tiet,
         CASE WHEN v.opts NOT ILIKE '%security_invoker=true%'
                   THEN '⛔ CỬA SAU — vượt mặt RLS'
              WHEN has_table_privilege('anon', v.oid, 'SELECT')
                   THEN '⛔ anon đọc được'
              ELSE '✅' END                                  AS danh_gia
    FROM v
),
-- ── 2. VIEW đọc bảng nào, bảng đó có RLS không ─────────────────────────────
-- View `security_invoker` mà đọc bảng KHÔNG bật RLS thì vẫn hở: cờ đúng nhưng
-- phía dưới chẳng có gì chặn.
v_dep AS (
  SELECT DISTINCT vv.relname AS view_name, t.relname AS tbl, t.relrowsecurity
    FROM pg_depend d
    JOIN pg_rewrite r ON r.oid = d.objid AND r.rulename = '_RETURN'
    JOIN pg_class vv  ON vv.oid = r.ev_class AND vv.relkind IN ('v','m')
    JOIN pg_class t   ON t.oid = d.refobjid AND t.relkind = 'r'
   WHERE vv.relnamespace = 'public'::regnamespace
     AND t.relnamespace  = 'public'::regnamespace
     AND d.classid = 'pg_rewrite'::regclass AND d.deptype = 'n'
),
v_dep_rows AS (
  SELECT '2 · VIEW→BẢNG' AS muc,
         view_name || ' → ' || tbl AS doi_tuong,
         CASE WHEN relrowsecurity THEN 'bảng gốc có RLS'
              ELSE 'bảng gốc KHÔNG có RLS' END AS chi_tiet,
         CASE WHEN relrowsecurity THEN '✅' ELSE '⛔ view đọc bảng không RLS' END AS danh_gia
    FROM v_dep
   WHERE NOT relrowsecurity          -- chỉ liệt kê chỗ CÓ VẤN ĐỀ, tránh nhiễu
),
-- ── 3. HÀM SECURITY DEFINER ────────────────────────────────────────────────
-- Mỗi hàm loại này là một lỗ khoét có chủ ý xuyên qua RLS (Hiến pháp V.3).
-- Sổ đăng ký: docs/SECURITY_DEFINER_REGISTRY.md
f AS (
  SELECT p.oid, p.proname, p.proconfig,
         pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
   WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
),
f_rows AS (
  SELECT '3 · HÀM SECDEF' AS muc,
         f.proname || '(' || f.args || ')' AS doi_tuong,
         CASE WHEN f.proconfig IS NULL
                   OR NOT EXISTS (SELECT 1 FROM unnest(f.proconfig) x
                                   WHERE x LIKE 'search_path=%')
              THEN 'KHÔNG ghim search_path' ELSE 'search_path đã ghim' END
         || CASE WHEN has_function_privilege('anon', f.oid, 'EXECUTE')
                 THEN ' · ⛔ anon GỌI ĐƯỢC' ELSE ' · anon bị chặn' END AS chi_tiet,
         CASE WHEN has_function_privilege('anon', f.oid, 'EXECUTE')
                   THEN '⛔ anon gọi được'
              WHEN f.proconfig IS NULL
                   OR NOT EXISTS (SELECT 1 FROM unnest(f.proconfig) x
                                   WHERE x LIKE 'search_path=%')
                   THEN '⛔ chưa ghim search_path'
              ELSE '✅' END AS danh_gia
    FROM f
),
-- ── 4. QUYỀN MẶC ĐỊNH — nguồn gốc sự cố 038 ────────────────────────────────
acl_rows AS (
  SELECT '4 · MẶC ĐỊNH' AS muc,
         pg_get_userbyid(d.defaclrole) || ' tạo '
         || CASE d.defaclobjtype WHEN 'f' THEN 'hàm' WHEN 'r' THEN 'bảng'
                                 WHEN 'S' THEN 'sequence' ELSE d.defaclobjtype::TEXT END AS doi_tuong,
         array_to_string(d.defaclacl, ', ') AS chi_tiet,
         -- ⚠️ Bản trước CHỈ soi `defaclobjtype = 'f'` (hàm), nên dòng
         -- "supabase_admin tạo bảng · anon=arwdDxtm" được tô ✅ oan — trong khi
         -- đó là quyền TOÀN PHẦN cấp cho người CHƯA ĐĂNG NHẬP trên mọi bảng
         -- do vai ấy tạo. Bản này soi cả bảng lẫn sequence lẫn hàm.
         CASE WHEN array_to_string(d.defaclacl, ',') ILIKE '%anon=%'
              THEN '⛔ còn cấp mặc định cho anon' ELSE '✅' END AS danh_gia
    FROM pg_default_acl d
    JOIN pg_namespace ns ON ns.oid = d.defaclnamespace
   WHERE ns.nspname = 'public'
),
tat_ca AS (
  SELECT * FROM v_rows
  UNION ALL SELECT * FROM v_dep_rows
  UNION ALL SELECT * FROM f_rows
  UNION ALL SELECT * FROM acl_rows
),
-- ── 0. KẾT LUẬN — đọc dòng này trước ───────────────────────────────────────
ket_luan AS (
  SELECT '0 · KẾT LUẬN' AS muc, k.doi_tuong, k.chi_tiet, k.danh_gia
    FROM (VALUES
      ('View thiếu security_invoker',
       (SELECT COUNT(*)::TEXT FROM v WHERE opts NOT ILIKE '%security_invoker=true%')
         || ' / ' || (SELECT COUNT(*)::TEXT FROM v),
       CASE WHEN (SELECT COUNT(*) FROM v WHERE opts NOT ILIKE '%security_invoker=true%') = 0
            THEN '✅' ELSE '⛔ CÓ CỬA SAU' END),
      ('View cho anon đọc',
       (SELECT COUNT(*)::TEXT FROM v WHERE has_table_privilege('anon', oid, 'SELECT')),
       CASE WHEN (SELECT COUNT(*) FROM v WHERE has_table_privilege('anon', oid, 'SELECT')) = 0
            THEN '✅' ELSE '⛔' END),
      ('⭐ Hàm SECDEF mà anon gọi được',
       (SELECT COUNT(*)::TEXT FROM f WHERE has_function_privilege('anon', oid, 'EXECUTE'))
         || ' / ' || (SELECT COUNT(*)::TEXT FROM f),
       CASE WHEN (SELECT COUNT(*) FROM f WHERE has_function_privilege('anon', oid, 'EXECUTE')) = 0
            THEN '✅' ELSE '⛔ LỖ HỔNG NGHIÊM TRỌNG' END),
      ('Hàm SECDEF chưa ghim search_path',
       (SELECT COUNT(*)::TEXT FROM f
         WHERE proconfig IS NULL
            OR NOT EXISTS (SELECT 1 FROM unnest(proconfig) x WHERE x LIKE 'search_path=%')),
       CASE WHEN (SELECT COUNT(*) FROM f
                   WHERE proconfig IS NULL
                      OR NOT EXISTS (SELECT 1 FROM unnest(proconfig) x
                                      WHERE x LIKE 'search_path=%')) = 0
            THEN '✅' ELSE '⛔' END),
      ('⭐ Vai còn cấp quyền MẶC ĐỊNH cho anon',
       (SELECT COUNT(*)::TEXT FROM pg_default_acl d
          JOIN pg_namespace ns ON ns.oid = d.defaclnamespace
         WHERE ns.nspname = 'public'
           AND array_to_string(d.defaclacl, ',') ILIKE '%anon=%'),
       CASE WHEN (SELECT COUNT(*) FROM pg_default_acl d
                    JOIN pg_namespace ns ON ns.oid = d.defaclnamespace
                   WHERE ns.nspname = 'public'
                     AND array_to_string(d.defaclacl, ',') ILIKE '%anon=%') = 0
            THEN '✅' ELSE '⚠️ xem Mục 4 — đối tượng TẠO SAU sẽ hở' END),
      ('View/matview đã soi', (SELECT COUNT(*)::TEXT FROM v), 'ℹ️'),
      ('Hàm SECDEF đã soi',   (SELECT COUNT(*)::TEXT FROM f), 'ℹ️')
    ) AS k(doi_tuong, chi_tiet, danh_gia)
)
SELECT muc, doi_tuong, chi_tiet, danh_gia
FROM (SELECT * FROM ket_luan UNION ALL SELECT * FROM tat_ca) z
ORDER BY muc,
         CASE WHEN danh_gia LIKE '⛔%' THEN 0 WHEN danh_gia LIKE '⚠️%' THEN 1 ELSE 2 END,
         doi_tuong;

-- ────────────────────────────────────────────────────────────────────────────
-- ⛔ CỔNG PASS/FAIL — NÉM LỖI, KHÔNG CHỈ IN RA
-- ────────────────────────────────────────────────────────────────────────────
-- Báo cáo thì người ta lướt qua. Cổng thì không.
DO $$
DECLARE v_view INT; v_anon_view INT; v_fn INT; v_path INT;
BEGIN
  SELECT COUNT(*) INTO v_view FROM pg_class
   WHERE relnamespace = 'public'::regnamespace AND relkind IN ('v','m')
     AND COALESCE(array_to_string(reloptions, ','), '') NOT ILIKE '%security_invoker=true%';

  SELECT COUNT(*) INTO v_anon_view FROM pg_class
   WHERE relnamespace = 'public'::regnamespace AND relkind IN ('v','m')
     AND has_table_privilege('anon', oid, 'SELECT');

  SELECT COUNT(*) INTO v_fn FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace AND prosecdef
     AND has_function_privilege('anon', oid, 'EXECUTE');

  SELECT COUNT(*) INTO v_path FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace AND prosecdef
     AND (proconfig IS NULL
          OR NOT EXISTS (SELECT 1 FROM unnest(proconfig) x WHERE x LIKE 'search_path=%'));

  IF v_view > 0 THEN
    RAISE EXCEPTION 'A001 HỎNG — % view KHÔNG bật security_invoker (vượt mặt RLS).', v_view;
  END IF;
  IF v_anon_view > 0 THEN
    RAISE EXCEPTION 'A001 HỎNG — % view CHO anon ĐỌC.', v_anon_view;
  END IF;
  IF v_fn > 0 THEN
    RAISE EXCEPTION 'A001 HỎNG — % hàm SECURITY DEFINER mà anon GỌI ĐƯỢC. '
                    'Xem docs/SECURITY_DEFINER_REGISTRY.md.', v_fn;
  END IF;
  IF v_path > 0 THEN
    RAISE EXCEPTION 'A001 HỎNG — % hàm SECURITY DEFINER chưa ghim search_path.', v_path;
  END IF;

  RAISE NOTICE '✅ A001 ĐẠT.';
END $$;
