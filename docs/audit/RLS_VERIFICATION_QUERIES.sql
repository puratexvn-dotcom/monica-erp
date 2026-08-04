-- ============================================================================
-- BỘ TRUY VẤN KIỂM CHỨNG PHÂN QUYỀN — HIẾN ĐỊNH
--
-- Board phê duyệt 2026-08-04. Đây là bộ truy vấn CHUẨN để xác minh tầng
-- "Live Database" trong mô hình bốn tầng:
--
--     Business Knowledge → Constitution → LIVE DATABASE → Running Application
--
-- ⚠️ CHỈ ĐỌC. Không câu nào trong tệp này thay đổi dữ liệu hay lược đồ.
--
-- ⚠️ NGUYÊN TẮC BẰNG CHỨNG:  bảng rỗng  ≠  bảng an toàn
--    Kết quả rỗng chỉ chứng minh "không quan sát được dữ liệu". Nó KHÔNG chứng
--    minh "không có lỗ rò". Luôn chạy Q0 trước để biết bảng nào có dữ liệu thật.
--
-- Cách dùng: chạy trên Supabase SQL Editor, dán nguyên văn kết quả về.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- Q0 · CÓ DỮ LIỆU THẬT KHÔNG — chạy TRƯỚC TIÊN
--
-- Không có câu này thì mọi kết luận về sau đều có nguy cơ rơi vào bẫy
-- "bảng rỗng ⇒ tưởng an toàn". Bảng nào ra 0 dòng thì mọi phép đo hành vi
-- trên nó chỉ được ghi "⚪ chưa đo được", KHÔNG được ghi "✅ an toàn".
-- ────────────────────────────────────────────────────────────────────────────
SELECT c.relname                    AS tablename,
       c.reltuples::bigint          AS uoc_luong_so_dong
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.reltuples DESC, c.relname;


-- ────────────────────────────────────────────────────────────────────────────
-- Q1 · TOÀN BỘ POLICY
--
-- Cột `qual` là điều kiện của SELECT/UPDATE/DELETE; `with_check` là điều kiện
-- của INSERT/UPDATE. Bảng nào chỉ có đúng một policy `authenticated_only` với
-- `qual = (auth.uid() IS NOT NULL)` nghĩa là **mọi tài khoản đã đăng nhập đều
-- đọc được toàn bộ bảng** — kể cả đối tác ngoài.
-- ────────────────────────────────────────────────────────────────────────────
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ────────────────────────────────────────────────────────────────────────────
-- Q2 · RLS ĐÃ BẬT VÀ CÓ BỊ ÉP KHÔNG  ★ bản đã sửa
--
-- ⚠️ Bản gốc dùng `pg_tables.forcerowsecurity` — CỘT ĐÓ KHÔNG TỒN TẠI.
-- `pg_tables` chỉ có `rowsecurity`. Cờ FORCE nằm ở `pg_class`.
--
-- Vì sao FORCE quan trọng với dự án này: migration 010 có gọi
-- `FORCE ROW LEVEL SECURITY` để chính chủ sở hữu bảng cũng không đi cửa sau
-- được. Cần biết cờ đó còn hiệu lực hay đã bị một migration sau gỡ mất.
-- ────────────────────────────────────────────────────────────────────────────
SELECT c.relname              AS tablename,
       c.relrowsecurity       AS rls_enabled,
       c.relforcerowsecurity  AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;


-- ────────────────────────────────────────────────────────────────────────────
-- Q3 · QUYỀN CẤP Ở TẦNG GRANT
--
-- RLS đúng vẫn có thể rò nếu GRANT quá rộng. Đặc biệt chú ý grantee `anon`:
-- vai này KHÔNG được có quyền nào trên bảng nghiệp vụ.
-- ────────────────────────────────────────────────────────────────────────────
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY table_name, grantee, privilege_type;


-- ────────────────────────────────────────────────────────────────────────────
-- Q4 · VIEW CÓ VƯỢT MẶT RLS KHÔNG  ★ bản đã mở rộng
--
-- ⚠️ Bản gốc chỉ liệt kê TÊN view. Rủi ro nghiệp vụ không nằm ở chỗ view có
-- tồn tại hay không, mà ở chỗ nó CHẠY BẰNG QUYỀN CỦA AI.
--
-- Mặc định, view chạy bằng quyền của NGƯỜI TẠO ⇒ vượt mặt RLS của người gọi.
-- Đây chính là cái bẫy tài liệu dự án đã ghi ("VIEW mặc định vượt mặt RLS") và
-- là lý do audit A001 ra đời.
--
-- View nào KHÔNG có `security_invoker=true` trong `reloptions` là view đi vòng
-- qua RLS. Một view như vậy trên `costings` sẽ làm mọi policy ở Q1 vô nghĩa.
-- ────────────────────────────────────────────────────────────────────────────
SELECT c.relname AS view_name,
       c.reloptions,
       CASE
         WHEN c.reloptions::text LIKE '%security_invoker=true%' THEN 'AN TOÀN — chạy bằng quyền người gọi'
         ELSE '⚠️ VƯỢT MẶT RLS — chạy bằng quyền người tạo'
       END AS phan_quyet
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v'
ORDER BY c.relname;


-- ────────────────────────────────────────────────────────────────────────────
-- Q5 · HÀM SECURITY DEFINER
--
-- Mỗi hàm `prosecdef = true` là một lỗ khoét xuyên qua toàn bộ RLS. Đối chiếu
-- kết quả với docs/SECURITY_DEFINER_REGISTRY.md — hàm nào chạy thật mà KHÔNG
-- có trong sổ đăng ký là một cửa hậu không ai theo dõi.
-- ────────────────────────────────────────────────────────────────────────────
SELECT p.proname          AS ten_ham,
       p.prosecdef        AS security_definer,
       pg_get_userbyid(p.proowner) AS chu_so_huu
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.prosecdef DESC, p.proname;
