-- ============================================================================
-- MONICA MOS — 029b · THU HỒI QUYỀN XOÁ CỨNG
--
-- ─── VÌ SAO CÓ TỆP NÀY ───────────────────────────────────────────────────
-- Migration 029 Mục 11 ghi: *"Không cấp DELETE ở đâu cả."*
-- **CÂU ĐÓ SAI**, và bài kiểm sống đã chứng minh:
--
--     zztest-asg-900001@monica.vn  (vai trò md, phiên đăng nhập THẬT)
--     DELETE FROM assignments WHERE id = <assignment tạm>   →  xoá được 1 dòng
--
-- Nguyên nhân: Supabase đặt sẵn
--     ALTER DEFAULT PRIVILEGES IN SCHEMA public
--       GRANT ALL ON TABLES TO anon, authenticated, service_role;
-- nên MỌI bảng mới nhận đủ quyền ngay lúc `CREATE TABLE`. Câu
-- `GRANT SELECT, INSERT, UPDATE` của 029 là phép CỘNG THÊM, không phải phép
-- thu hẹp — nó không gỡ đi thứ gì cả. `GRANT` không bao giờ thu hồi.
--
-- Đo được, cả 8 bảng đều hở (probe-delete-grants, phiên đăng nhập thật):
--     assignments · assignment_bundles · assignment_daily_reports
--     assignment_commercial_terms · contract_types
--     partners · partner_accounts · production_sites
--
-- ─── MỨC ĐỘ NGHIÊM TRỌNG ─────────────────────────────────────────────────
-- Khoá ngoại `ON DELETE RESTRICT` đã che phần lớn thiệt hại: một Assignment có
-- báo cáo, có bó, hoặc có điều khoản thì KHÔNG xoá được. Trigger append-only
-- cũng chặn xoá từng dòng sổ cái.
--
-- Nhưng một Assignment **chưa có con** thì xoá cứng được, và khi đó:
--     • biến mất khỏi mọi báo cáo lịch sử, không để lại dấu vết nào;
--     • `activity_log` còn trơ lại những dòng trỏ vào một `entity_id` không
--       còn tồn tại — audit trail thành mồ côi;
--     • xoá mềm (I-6) trở thành quy ước lịch sự chứ không phải hàng rào.
--
-- ─── VÌ SAO KHÔNG DÙNG POLICY MÀ DÙNG REVOKE ─────────────────────────────
-- RLS policy lọc DÒNG NÀO được chạm. `REVOKE` gỡ hẳn CẢ HÀNH ĐỘNG. Với một
-- thao tác không bao giờ hợp lệ, gỡ hành động là hàng rào đúng tầng và rẻ hơn
-- — không tốn một lượt đánh giá biểu thức cho mỗi dòng.
-- ============================================================================

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    -- 029 · Assignment Domain
    'assignments', 'assignment_bundles', 'assignment_daily_reports',
    'assignment_commercial_terms', 'contract_types',
    -- 027 · Partner Domain
    'partners', 'partner_accounts',
    -- 028 · Production Site
    'production_sites'
  ] LOOP
    EXECUTE format('REVOKE DELETE ON public.%I FROM authenticated', t);
    EXECUTE format('REVOKE DELETE ON public.%I FROM anon', t);
    -- ⚠️ TRUNCATE bỏ qua trigger, bỏ qua RLS, và không sinh dòng audit nào.
    -- Nó là cách xoá sạch một bảng mà không để lại một dấu vết nào.
    EXECUTE format('REVOKE TRUNCATE ON public.%I FROM authenticated', t);
    EXECUTE format('REVOKE TRUNCATE ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- `service_role` GIỮ NGUYÊN quyền. Đó là khoá quản trị hệ thống, và Quyết định
-- 2 (REVISED) đã chỉ đúng ba đường hợp lệ để sửa dữ liệu bất biến: Migration ·
-- Maintenance Script · Recovery Procedure. Cả ba đều đi bằng khoá đó, và cả ba
-- đều để lại dấu vết. Chặn nó ở đây chỉ làm hỏng việc chính đáng.
--
-- ⚠️ Sổ cái `assignment_daily_reports` giờ có HAI lớp: trigger append-only chặn
-- từng dòng với mọi vai trò, và `REVOKE` gỡ hẳn hành động với người dùng. Không
-- thừa — trigger bảo vệ nội dung, REVOKE bảo vệ cả bảng.

-- ─── XOÁ MỀM KHÔNG BỊ ẢNH HƯỞNG ─────────────────────────────────────────────
-- `UPDATE ... SET deleted_at = NOW()` vẫn chạy bình thường: `UPDATE` không bị
-- thu hồi. Đây đúng là con đường mà I-6 quy định.

-- ─── HOÀN TÁC ───────────────────────────────────────────────────────────────
--   GRANT DELETE ON public.<bảng> TO authenticated;
-- Không có dữ liệu nào thay đổi, nên hoàn tác là tức thời và vô hại.

-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY
-- ============================================================================
SELECT 'Số bảng CÒN hở quyền DELETE cho authenticated' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee = 'authenticated' AND privilege_type = 'DELETE'
           AND table_schema = 'public'
           AND table_name IN ('assignments','assignment_bundles','assignment_daily_reports',
                              'assignment_commercial_terms','contract_types',
                              'partners','partner_accounts','production_sites')) AS ket_qua,
       '0' AS ky_vong
UNION ALL
SELECT 'Số bảng CÒN hở quyền TRUNCATE cho authenticated',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee = 'authenticated' AND privilege_type = 'TRUNCATE'
           AND table_schema = 'public'
           AND table_name IN ('assignments','assignment_bundles','assignment_daily_reports',
                              'assignment_commercial_terms','contract_types',
                              'partners','partner_accounts','production_sites')), '0'
UNION ALL
SELECT 'UPDATE vẫn còn (xoá mềm phải chạy được)',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee = 'authenticated' AND privilege_type = 'UPDATE'
           AND table_schema = 'public'
           AND table_name IN ('assignments','assignment_bundles','assignment_daily_reports',
                              'assignment_commercial_terms','contract_types',
                              'partners','partner_accounts','production_sites')), '8'
UNION ALL
SELECT 'SELECT vẫn còn',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee = 'authenticated' AND privilege_type = 'SELECT'
           AND table_schema = 'public'
           AND table_name IN ('assignments','assignment_bundles','assignment_daily_reports',
                              'assignment_commercial_terms','contract_types',
                              'partners','partner_accounts','production_sites')), '8'
UNION ALL
SELECT 'service_role GIỮ NGUYÊN quyền DELETE (3 đường hợp lệ)',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee = 'service_role' AND privilege_type = 'DELETE'
           AND table_schema = 'public'
           AND table_name IN ('assignments','assignment_bundles','assignment_daily_reports',
                              'assignment_commercial_terms','contract_types',
                              'partners','partner_accounts','production_sites')), '8';
