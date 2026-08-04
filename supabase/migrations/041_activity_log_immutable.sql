-- ============================================================================
-- MONICA ONE — 041 · SỔ KIỂM TOÁN BẤT BIẾN
--
-- 🔴 SECURITY HOTFIX · phát hiện `F-1` · Board Directive 04/08/2026 mục 1
--
-- ─── LỖ HỔNG, ĐÃ ĐO TRÊN CSDL ĐANG CHẠY ──────────────────────────────────
--
-- `docs/audit/VR-001-KET-QUA.md` §3.1 — phiên đăng nhập THẬT, vai `md`:
--
--     UPDATE public.activity_log  →  lệnh CHẠY ĐƯỢC
--     DELETE FROM public.activity_log  →  lệnh CHẠY ĐƯỢC
--
-- Nguyên nhân đúng như 029b đã mô tả: Supabase đặt sẵn
--     ALTER DEFAULT PRIVILEGES IN SCHEMA public
--       GRANT ALL ON TABLES TO anon, authenticated, service_role;
-- và vòng lặp `015_md_order_lifecycle.sql:518` còn cấp thêm một lần nữa
--     GRANT ALL ON public.activity_log TO authenticated;
-- `GRANT` là phép CỘNG, không bao giờ thu hẹp. Chưa migration nào thu hồi.
--
-- `029b_revoke_hard_delete.sql:43` đã làm đúng việc này cho 8 bảng của
-- 027/028/029. **`activity_log` không có trong danh sách đó** — bảng sinh ở 015,
-- không thuộc phạm vi 029b, và không ai quay lại.
--
-- ─── VÌ SAO ĐÂY LÀ LỖ HỔNG NẶNG NHẤT ĐANG BIẾT ───────────────────────────
--
-- `activity_log` là sổ kiểm toán dùng chung. Người sửa dữ liệu **tự xoá được
-- dấu vết của chính mình**. Nó không phải một lỗ hổng nằm cạnh các lỗ hổng
-- khác — nó là lỗ hổng vô hiệu hoá năng lực ĐIỀU TRA mọi lỗ hổng khác, kể cả
-- những lỗ hổng chưa ai tìm ra.
--
-- Vi phạm:
--   • **BDR-14** — Board 04/08/2026: Audit Log bất biến
--   • **quy tắc K-1** — sổ cái chỉ-ghi-thêm là CỬA MỘT CHIỀU
--   • Hiến pháp Điều 8 — bằng chứng phê duyệt phải giữ được
--
-- ─── PHẠM VI — CỐ Ý HẸP ──────────────────────────────────────────────────
--
-- Chỉ thu hồi QUYỀN trên MỘT bảng. Migration này **không**:
--   ⛔ đụng policy `authenticated_only` — đó là việc của **ADR-018**
--   ⛔ đụng 22 bảng còn lại — cũng là việc của **ADR-018**
--   ⛔ tạo bảng · sửa cột · đổi mô hình phân quyền · đổi Business Rule
--
-- Nhờ vậy nó KHÔNG rơi vào ADR-011 §2.2, và nằm đúng trong phần
-- `CLAUDE.md` §2.2 cho phép làm khi SECURITY FREEZE còn hiệu lực:
-- *"vá lỗ hổng đã đo"*.
--
-- ─── VÌ SAO CÓ `TRUNCATE` TRONG KHI Board CHỈ NÓI UPDATE/DELETE ──────────
--
-- `GRANT ALL ON TABLE` bao gồm cả `TRUNCATE`. Thu hồi UPDATE và DELETE mà để
-- lại TRUNCATE là vá cửa sổ và mở toang cửa chính: TRUNCATE **bỏ qua trigger,
-- bỏ qua RLS, và không sinh dòng audit nào** — một lệnh, sạch cả bảng, không
-- một dấu vết. Mục tiêu Board đặt ra là *bất biến*; để lại TRUNCATE thì mục
-- tiêu đó không đạt được.
--
-- Đây không phải mở rộng phạm vi: cùng một bảng, cùng một hành động (gỡ quyền
-- huỷ hoại dữ liệu), và `029b:56` đã lập sẵn tiền lệ — nó thu hồi DELETE và
-- TRUNCATE **cùng nhau**, với đúng lý lẽ này.
--
-- ─── INSERT VÀ SELECT GIỮ NGUYÊN ─────────────────────────────────────────
--
-- Sổ cái phải GHI THÊM được, nếu không nó ngừng ghi nhận. Đã đối chiếu mã ứng
-- dụng: chỉ có `.insert()` và `.select()`, không nơi nào `.update()` hoặc
-- `.delete()` bảng này —
--     app/(dashboard)/md/_actions/audit.ts:28                     insert
--     app/(dashboard)/md/assignments/_services/assignment.service.ts:494  insert
--     app/(dashboard)/md/_services/collaboration.service.ts:209   select
--     app/(dashboard)/md/po/[poId]/_services/executive.service.ts:162     select
-- ⇒ **không đường ghi hợp lệ nào bị chặn.**
--
-- `actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL` vẫn chạy:
-- hành động toàn vẹn tham chiếu do hệ thống thi hành dưới quyền CHỦ SỞ HỮU
-- bảng, không qua phép kiểm quyền của người gọi.
--
-- `service_role` GIỮ NGUYÊN mọi quyền — cùng lý lẽ 029b:61. Ba đường hợp lệ để
-- sửa dữ liệu bất biến (Migration · Maintenance Script · Recovery Procedure)
-- đều đi bằng khoá đó, và cả ba đều để lại dấu vết.
--
-- ─── IDEMPOTENT ──────────────────────────────────────────────────────────
-- `REVOKE` trên quyền đã bị thu hồi là lệnh không-làm-gì. Chạy lại bao nhiêu
-- lần cũng vô hại. Không dòng dữ liệu nào bị đụng tới.
-- ============================================================================

REVOKE UPDATE   ON public.activity_log FROM authenticated;
REVOKE DELETE   ON public.activity_log FROM authenticated;
REVOKE TRUNCATE ON public.activity_log FROM authenticated;

-- 015:519 đã có `REVOKE ALL ... FROM anon`. Lặp lại ở đây để migration này tự
-- đứng vững, không phụ thuộc thứ tự chạy của tệp khác.
REVOKE UPDATE   ON public.activity_log FROM anon;
REVOKE DELETE   ON public.activity_log FROM anon;
REVOKE TRUNCATE ON public.activity_log FROM anon;

COMMENT ON TABLE public.activity_log IS
  'Sổ kiểm toán dùng chung — CHỈ GHI THÊM. BDR-14 (Board 04/08/2026) quy định '
  'bảng này bất biến. Migration 041 thu hồi UPDATE/DELETE/TRUNCATE của vai '
  'authenticated và anon. Chỉ service_role sửa được, qua ba đường hợp lệ: '
  'Migration · Maintenance Script · Recovery Procedure. Xem docs/audit/VR-001-KET-QUA.md.';

-- ─── HOÀN TÁC ───────────────────────────────────────────────────────────────
--   GRANT UPDATE, DELETE, TRUNCATE ON public.activity_log TO authenticated;
-- Không dữ liệu nào thay đổi ⇒ hoàn tác tức thời, vô hại, không mất mát.
--
-- ⚠️ Hoàn tác đưa hệ thống về đúng trạng thái vi phạm BDR-14. Chỉ làm khi có
-- quyết định Board bằng văn bản.

-- ─── CÒN LẠI, KHÔNG THUỘC PHẠM VI TỆP NÀY ───────────────────────────────────
-- `GRANT ALL` còn cấp `TRIGGER` và `REFERENCES` cho `authenticated`. Quyền
-- `TRIGGER` cho phép gắn trigger lên bảng, tức một đường can thiệp nội dung
-- khác. Nó KHÔNG được thu hồi ở đây vì nằm ngoài phạm vi Board duyệt, và vì
-- nó là vấn đề chung của cả 23 bảng chứ không riêng bảng này.
-- ⇒ Ghi vào **ADR-018** như một hạng mục phải xử lý.

-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY — chép kết quả về hồ sơ
-- ============================================================================
SELECT 'authenticated CÒN quyền UPDATE trên activity_log' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee='authenticated' AND privilege_type='UPDATE'
           AND table_schema='public' AND table_name='activity_log') AS ket_qua,
       '0' AS ky_vong
UNION ALL
SELECT 'authenticated CÒN quyền DELETE trên activity_log',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee='authenticated' AND privilege_type='DELETE'
           AND table_schema='public' AND table_name='activity_log'), '0'
UNION ALL
SELECT 'authenticated CÒN quyền TRUNCATE trên activity_log',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee='authenticated' AND privilege_type='TRUNCATE'
           AND table_schema='public' AND table_name='activity_log'), '0'
UNION ALL
SELECT 'anon CÒN quyền ghi bất kỳ trên activity_log',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee='anon' AND privilege_type IN ('UPDATE','DELETE','TRUNCATE','INSERT')
           AND table_schema='public' AND table_name='activity_log'), '0'
UNION ALL
-- ⚠️ HAI DÒNG DƯỚI ĐÂY PHẢI KHÁC 0. Sổ cái ngừng ghi được là hỏng nặng hơn
-- lỗ hổng vừa vá: hệ thống sẽ im lặng mất khả năng ghi nhận.
SELECT '⭐ authenticated VẪN ghi thêm được (INSERT)',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee='authenticated' AND privilege_type='INSERT'
           AND table_schema='public' AND table_name='activity_log'), '1'
UNION ALL
SELECT '⭐ authenticated VẪN đọc được (SELECT)',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee='authenticated' AND privilege_type='SELECT'
           AND table_schema='public' AND table_name='activity_log'), '1'
UNION ALL
SELECT 'service_role GIỮ NGUYÊN quyền UPDATE (ba đường hợp lệ)',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee='service_role' AND privilege_type='UPDATE'
           AND table_schema='public' AND table_name='activity_log'), '1';
