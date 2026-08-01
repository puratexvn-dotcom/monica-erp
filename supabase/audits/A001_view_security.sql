-- ============================================================================
-- A001 · KIỂM AN NINH VIEW — Quyết định ⑦ của Kiến trúc sư trưởng
--
-- "Không kiểm thủ công. Mỗi lần migration. Kiểm pg_views · security_invoker ·
--  security_barrier · RLS."
--
-- ⚠️ ĐÂY LÀ TỆP CHỈ-ĐỌC. Không `CREATE`, không `ALTER`, không `INSERT`,
-- không `UPDATE`, không `DELETE`. Chạy bao nhiêu lần cũng không đổi gì.
-- Chạy được cả trên môi trường thật giữa giờ làm việc.
--
-- VÌ SAO CẦN: Migration 024 Mục 7 đã bật `security_invoker` — nhưng bằng một
-- DANH SÁCH VIẾT CỨNG 7 tên view, và bỏ qua trong im lặng thứ không tìm thấy:
--
--     FOREACH v IN ARRAY ARRAY['v_po_material_readiness', ...]
--       IF EXISTS (...) THEN ALTER VIEW ...
--       ELSE RAISE NOTICE 'Bỏ qua %: view không tồn tại.'
--
-- Danh sách viết cứng không tự lớn lên theo lược đồ. Bài kiểm này liệt kê
-- ĐỘNG toàn bộ view trong `public`, nên view sinh sau vẫn bị soi.
--
-- CÁCH ĐỌC KẾT QUẢ: chạy cả tệp. Mục 4 là cổng PASS/FAIL — nó NÉM LỖI nếu có
-- view hở. Mục 1–3 là bằng chứng chi tiết để đọc dù cổng có xanh.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. TOÀN BỘ VIEW TRONG `public` — CỜ AN NINH VÀ NGƯỜI SỞ HỮU
-- ────────────────────────────────────────────────────────────────────────────
-- `security_invoker = true`  → view chạy bằng quyền NGƯỜI GỌI. RLS của họ áp
--                              dụng. Đây là thứ ta cần.
-- thiếu / = false            → view chạy bằng quyền NGƯỜI SỞ HỮU (thường là
--                              `postgres`, kẻ vượt mặt mọi RLS). ⛔ CỬA SAU.
-- `security_barrier = true`  → chặn rò rỉ qua toán tử "rẻ nhưng nhiều chuyện".
--                              Tốn hiệu năng, chỉ cần cho view trên bảng nhạy cảm.
SELECT
  c.relname                                                       AS view_name,
  pg_get_userbyid(c.relowner)                                     AS owner,
  COALESCE(array_to_string(c.reloptions, ', '), '(không có)')      AS reloptions,
  CASE WHEN COALESCE(array_to_string(c.reloptions, ','), '')
            ILIKE '%security_invoker=true%'
       THEN '✅ invoker' ELSE '⛔ DEFINER — CỬA SAU' END           AS invoker,
  CASE WHEN COALESCE(array_to_string(c.reloptions, ','), '')
            ILIKE '%security_barrier=true%'
       THEN '🛡 barrier' ELSE '—' END                              AS barrier,
  CASE WHEN has_table_privilege('authenticated', c.oid, 'SELECT')
       THEN 'authenticated ĐỌC ĐƯỢC' ELSE '—' END                 AS grant_auth,
  CASE WHEN has_table_privilege('anon', c.oid, 'SELECT')
       THEN '⛔ anon ĐỌC ĐƯỢC' ELSE '—' END                        AS grant_anon
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind IN ('v', 'm')          -- 'm' = materialized view, cũng phải soi
ORDER BY invoker DESC, c.relname;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. VIEW ĐỌC BẢNG NÀO — VÀ BẢNG ĐÓ CÓ BẬT RLS KHÔNG
-- ────────────────────────────────────────────────────────────────────────────
-- Một view `security_invoker` đọc bảng KHÔNG bật RLS thì vẫn hở: cờ đúng
-- nhưng phía dưới chẳng có gì chặn. Phải soi cả hai đầu.
--
-- `relforcerowsecurity` quan trọng riêng: không có nó thì CHỦ SỞ HỮU bảng
-- vẫn vượt mặt RLS của chính bảng mình.
SELECT
  v.relname                                                       AS view_name,
  t.relname                                                       AS reads_table,
  CASE WHEN t.relrowsecurity      THEN '✅' ELSE '⛔ KHÔNG BẬT RLS' END AS rls,
  CASE WHEN t.relforcerowsecurity THEN '✅' ELSE '⚠️ chủ sở hữu vượt mặt' END AS force_rls,
  (SELECT COUNT(*) FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = t.relname)     AS so_policy
FROM pg_depend d
JOIN pg_rewrite r ON r.oid = d.objid AND r.rulename = '_RETURN'
JOIN pg_class   v ON v.oid = r.ev_class AND v.relkind IN ('v', 'm')
JOIN pg_class   t ON t.oid = d.refobjid AND t.relkind = 'r'
WHERE v.relnamespace = 'public'::regnamespace
  AND t.relnamespace = 'public'::regnamespace
  AND d.classid = 'pg_rewrite'::regclass
  AND d.deptype = 'n'
GROUP BY v.relname, t.relname, t.relrowsecurity, t.relforcerowsecurity
ORDER BY rls, v.relname, t.relname;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. HÀM SECURITY DEFINER — CÙNG MỘT LOẠI CỬA SAU
-- ────────────────────────────────────────────────────────────────────────────
-- View không phải đường vòng duy nhất. Một hàm `SECURITY DEFINER` mà
-- `authenticated` gọi được, lại không ghim `search_path`, là chỗ leo thang
-- quyền kinh điển.
SELECT
  p.proname                                                       AS func_name,
  pg_get_function_identity_arguments(p.oid)                       AS args,
  pg_get_userbyid(p.proowner)                                     AS owner,
  CASE WHEN p.proconfig IS NULL
            OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) x
                            WHERE x LIKE 'search_path=%')
       THEN '⛔ KHÔNG GHIM search_path' ELSE '✅ đã ghim' END      AS search_path,
  CASE WHEN has_function_privilege('anon', p.oid, 'EXECUTE')
       THEN '⛔ anon GỌI ĐƯỢC' ELSE '—' END                        AS grant_anon,
  CASE WHEN has_function_privilege('authenticated', p.oid, 'EXECUTE')
       THEN 'authenticated' ELSE '—' END                          AS grant_auth
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.prosecdef                                    -- CHỈ hàm SECURITY DEFINER
ORDER BY search_path DESC, p.proname;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. ⛔ CỔNG PASS/FAIL — NÉM LỖI NẾU CÓ VIEW HỞ
-- ────────────────────────────────────────────────────────────────────────────
-- Đây là phần biến tệp này từ "báo cáo để người đọc" thành "cổng chặn".
-- Báo cáo thì người ta lướt qua. Cổng thì không.
DO $$
DECLARE
  v_ho    TEXT[];
  v_anon  TEXT[];
  v_tong  INT;
BEGIN
  SELECT COUNT(*) INTO v_tong
    FROM pg_class c
   WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('v', 'm');

  SELECT array_agg(c.relname ORDER BY c.relname) INTO v_ho
    FROM pg_class c
   WHERE c.relnamespace = 'public'::regnamespace
     AND c.relkind IN ('v', 'm')
     AND COALESCE(array_to_string(c.reloptions, ','), '')
         NOT ILIKE '%security_invoker=true%';

  SELECT array_agg(c.relname ORDER BY c.relname) INTO v_anon
    FROM pg_class c
   WHERE c.relnamespace = 'public'::regnamespace
     AND c.relkind IN ('v', 'm')
     AND has_table_privilege('anon', c.oid, 'SELECT');

  RAISE NOTICE 'Soi % view/matview trong public.', v_tong;

  IF v_anon IS NOT NULL THEN
    RAISE WARNING '⛔ % view CHO anon ĐỌC (chưa đăng nhập đã xem được): %',
      array_length(v_anon, 1), array_to_string(v_anon, ', ');
  END IF;

  IF v_ho IS NOT NULL THEN
    RAISE EXCEPTION
      E'⛔ A001 HỎNG — % / % view KHÔNG bật security_invoker:\n     %\n'
      '     Các view này chạy bằng quyền NGƯỜI SỞ HỮU và VƯỢT MẶT RLS.\n'
      '     Sửa: ALTER VIEW public.<ten> SET (security_invoker = true);',
      array_length(v_ho, 1), v_tong, array_to_string(v_ho, E',\n     ');
  END IF;

  RAISE NOTICE '✅ A001 ĐẠT — cả % view đều bật security_invoker.', v_tong;
END $$;
