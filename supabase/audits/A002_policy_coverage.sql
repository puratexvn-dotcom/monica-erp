-- ============================================================================
-- A002 · KIỂM ĐỘ PHỦ CỦA POLICY — chu trình 031a → Regression → **A002** → 031b
--
-- A001 hỏi: "view có vượt mặt RLS không?"
-- A002 hỏi câu ĐỨNG TRƯỚC NÓ: "bảng có hàng rào nào không, và hàng rào ấy có
--                              biết tới người dùng bên ngoài không?"
--
-- ⚠️ ĐÂY LÀ TỆP CHỈ-ĐỌC. Không CREATE, ALTER, INSERT, UPDATE, DELETE.
--
-- ─── VÌ SAO CẦN, VÀ VÌ SAO ĐÚNG LÚC NÀY ───────────────────────────────────
--
-- Hai lỗ hổng lớn nhất tìm được đến giờ đều KHÔNG phải "policy viết sai".
-- Chúng là "KHÔNG CÓ POLICY NÀO CẢ":
--
--   ① 025 cố ý bỏ qua orders/cut_tickets/cut_bundles (danh sách `allowed`)
--   ② bản nháp 031 GỠ `subcon_denied` khỏi qa_audit_reports rồi chỉ thay
--      SELECT + INSERT, quên hẳn UPDATE
--
-- Cả hai đều vô hình với bài kiểm hành vi nếu ta không nghĩ ra đúng phép thử.
-- A002 làm việc ngược lại: đọc `pg_policies` và chỉ ra **chỗ trống**, không
-- cần ai phải đoán trước nên thử cái gì.
--
-- Đây đúng tinh thần K-2: hỏi câu về CẤU HÌNH bằng cách đọc CẤU HÌNH.
--
-- CÁCH ĐỌC: Mục 5 là cổng PASS/FAIL. Mục 1–4 là bằng chứng.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ⛔ BẢNG CHƯA BẬT RLS — POLICY VIẾT KIỂU GÌ CŨNG KHÔNG CHẠY
-- ────────────────────────────────────────────────────────────────────────────
-- Đây là hỏng nguy hiểm nhất vì nó IM LẶNG: policy vẫn nằm đó, `pg_policies`
-- vẫn liệt kê, nhưng PostgreSQL không hề áp dụng.
SELECT
  c.relname                                                        AS bang,
  CASE WHEN c.relrowsecurity THEN '✅' ELSE '⛔ CHƯA BẬT RLS' END   AS rls,
  CASE WHEN c.relforcerowsecurity THEN '🛡' ELSE '—' END            AS force_rls,
  (SELECT COUNT(*) FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = c.relname)      AS so_policy,
  CASE WHEN has_table_privilege('authenticated', c.oid, 'INSERT')
       THEN 'I' ELSE '·' END ||
  CASE WHEN has_table_privilege('authenticated', c.oid, 'UPDATE')
       THEN 'U' ELSE '·' END ||
  CASE WHEN has_table_privilege('authenticated', c.oid, 'DELETE')
       THEN 'D' ELSE '·' END                                        AS grant_ghi
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
ORDER BY c.relrowsecurity, c.relname;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ĐỘ PHỦ THEO TỪNG LỆNH — CHỖ TRỐNG NẰM Ở ĐÂU
-- ────────────────────────────────────────────────────────────────────────────
-- Với mỗi bảng, mỗi lệnh GHI: có policy nào NHẮC TỚI người dùng bên ngoài
-- không? Không nhắc tới nghĩa là lệnh đó **không phân biệt** người trong với
-- người ngoài — chính là hình dạng của cả hai lỗ hổng đã gặp.
--
-- `FOR ALL` (cmd = 'ALL') tính là có phủ cho cả ba lệnh.
WITH t AS (
  SELECT c.oid, c.relname
    FROM pg_class c
   WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
     AND c.relrowsecurity
),
canh_gac AS (
  SELECT p.tablename, p.cmd, p.permissive,
         (COALESCE(p.qual, '') || ' ' || COALESCE(p.with_check, '')) AS bieu_thuc
    FROM pg_policies p
   WHERE p.schemaname = 'public'
)
SELECT
  t.relname AS bang,
  CASE WHEN has_table_privilege('authenticated', t.oid, 'INSERT') THEN
    CASE WHEN EXISTS (SELECT 1 FROM canh_gac g WHERE g.tablename = t.relname
                       AND g.cmd IN ('INSERT','ALL')
                       AND g.bieu_thuc ~ 'mos_is_(external|subcon|buyer)|mos_partner')
         THEN '✅' ELSE '⛔ TRỐNG' END
  ELSE '(không cấp)' END                                            AS insert_co_canh_gac,
  CASE WHEN has_table_privilege('authenticated', t.oid, 'UPDATE') THEN
    CASE WHEN EXISTS (SELECT 1 FROM canh_gac g WHERE g.tablename = t.relname
                       AND g.cmd IN ('UPDATE','ALL')
                       AND g.bieu_thuc ~ 'mos_is_(external|subcon|buyer)|mos_partner')
         THEN '✅' ELSE '⛔ TRỐNG' END
  ELSE '(không cấp)' END                                            AS update_co_canh_gac,
  CASE WHEN has_table_privilege('authenticated', t.oid, 'DELETE') THEN
    CASE WHEN EXISTS (SELECT 1 FROM canh_gac g WHERE g.tablename = t.relname
                       AND g.cmd IN ('DELETE','ALL')
                       AND g.bieu_thuc ~ 'mos_is_(external|subcon|buyer)|mos_partner')
         THEN '✅' ELSE '⛔ TRỐNG' END
  ELSE '✅ đã REVOKE' END                                            AS delete_co_canh_gac,
  (SELECT COUNT(*) FROM canh_gac g
    WHERE g.tablename = t.relname AND g.permissive = 'RESTRICTIVE')  AS so_restrictive
FROM t
ORDER BY
  (SELECT COUNT(*) FROM canh_gac g
    WHERE g.tablename = t.relname AND g.permissive = 'RESTRICTIVE'), t.relname;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. `subcon_denied` CÒN Ở ĐÂU, MẤT Ở ĐÂU
-- ────────────────────────────────────────────────────────────────────────────
-- 025 cài `subcon_denied` (RESTRICTIVE FOR ALL) lên MỌI bảng ngoài 7 bảng
-- trong danh sách cho phép. Bảng nào hôm nay KHÔNG còn nó thì hoặc (a) nằm
-- trong danh sách cho phép ban đầu, hoặc (b) đã bị một migration sau gỡ đi.
--
-- (b) là thứ cần soi: gỡ hàng rào mà không dựng lại đủ chính là nguyên nhân
-- lỗ hổng `qa_audit_reports`.
SELECT
  c.relname                                                         AS bang,
  CASE WHEN EXISTS (SELECT 1 FROM pg_policies p
                     WHERE p.schemaname = 'public' AND p.tablename = c.relname
                       AND p.policyname = 'subcon_denied')
       THEN '✅ còn' ELSE '— không có' END                           AS subcon_denied,
  CASE WHEN c.relname = ANY (ARRAY['subcontractors','subcon_orders','subcon_issue_logs',
                                   'subcon_receipt_logs','cut_bundles','cut_tickets','orders'])
       THEN '025 cố ý cho phép' ELSE '' END                          AS ghi_chu,
  (SELECT string_agg(DISTINCT p.policyname, ', ' ORDER BY p.policyname)
     FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = c.relname
      AND p.permissive = 'RESTRICTIVE')                              AS cac_restrictive
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
  AND c.relrowsecurity
  AND NOT EXISTS (SELECT 1 FROM pg_policies p
                   WHERE p.schemaname = 'public' AND p.tablename = c.relname
                     AND p.policyname = 'subcon_denied')
ORDER BY ghi_chu DESC, c.relname;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. BỐN BẢNG CỦA 031a — ĐỐI CHIẾU CHI TIẾT
-- ────────────────────────────────────────────────────────────────────────────
SELECT p.tablename AS bang, p.policyname AS policy, p.cmd AS lenh,
       p.permissive AS loai, p.roles::TEXT AS vai
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN ('orders','cut_tickets','cut_bundles','qa_audit_reports')
ORDER BY p.tablename, p.permissive DESC, p.cmd, p.policyname;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. ⛔ CỔNG PASS/FAIL
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_khong_rls TEXT[];
  v_31a       INT;
  v_select    INT;
BEGIN
  -- (a) Bảng có cấp quyền GHI cho `authenticated` nhưng CHƯA BẬT RLS.
  -- Ở đó policy là đồ trang trí.
  SELECT array_agg(c.relname ORDER BY c.relname) INTO v_khong_rls
    FROM pg_class c
   WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
     AND NOT c.relrowsecurity
     AND (has_table_privilege('authenticated', c.oid, 'INSERT')
       OR has_table_privilege('authenticated', c.oid, 'UPDATE')
       OR has_table_privilege('authenticated', c.oid, 'DELETE'));

  -- (b) 12 policy của 031a phải còn đủ.
  SELECT COUNT(*) INTO v_31a FROM pg_policies
   WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'
     AND permissive = 'RESTRICTIVE';

  -- (c) Và KHÔNG cái nào được lan sang SELECT.
  SELECT COUNT(*) INTO v_select FROM pg_policies
   WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'
     AND cmd IN ('SELECT', 'ALL');

  IF v_khong_rls IS NOT NULL THEN
    RAISE WARNING '⚠️ % bảng CHO GHI nhưng CHƯA BẬT RLS: %',
      array_length(v_khong_rls, 1), array_to_string(v_khong_rls, ', ');
  END IF;

  IF v_31a <> 12 THEN
    RAISE EXCEPTION 'A002 HỎNG — 031a phải có đúng 12 policy RESTRICTIVE, đang có %.', v_31a;
  END IF;

  IF v_select > 0 THEN
    RAISE EXCEPTION 'A002 HỎNG — % policy của 031a đang chạm SELECT. '
                    '031a KHÔNG được thu hẹp quyền đọc.', v_select;
  END IF;

  RAISE NOTICE '✅ A002 ĐẠT — 031a nguyên vẹn (12 RESTRICTIVE, 0 chạm SELECT).';
  RAISE NOTICE 'ℹ️ Cảnh báo ở trên (nếu có) là việc phải làm, không phải lỗi của 031a.';
END $$;
