-- ============================================================================
-- MONICA GARMENT ERP — 010: SIẾT BẢO MẬT TOÀN BỘ SCHEMA public
--
-- BỐI CẢNH (đo trực tiếp trên DB đang chạy trước khi viết file này):
--   • Bảng `users` chứa 11 tài khoản với MẬT KHẨU LƯU DẠNG CHỮ THƯỜNG
--     (vd: "password":"monica123") và anon key ĐỌC ĐƯỢC toàn bộ.
--   • orders / materials / hourly_production_logs / cartons đều đọc được
--     bằng anon key, dù migration 002 khai báo cần authenticated.
--     => RLS trên DB thật KHÔNG khớp với file migration trong repo.
--   • anon key nằm sẵn trong bundle trình duyệt (biến NEXT_PUBLIC_), nên
--     mọi dữ liệu trên coi như đã công khai ra Internet.
--
-- File này làm 4 việc, chạy được nhiều lần (idempotent):
--   1. Thu hồi toàn bộ quyền của vai trò `anon` trên schema public.
--   2. Bật RLS và áp policy "chỉ authenticated" cho MỌI bảng — quét động
--      qua pg_tables nên không bảng nào bị bỏ sót, kể cả bảng thêm sau này.
--   3. Xoá bảng `users` chứa mật khẩu thường (đã được Supabase Auth thay thế).
--   4. Nạp danh mục phòng ban + vai trò để script seed tài khoản dùng lại.
--
-- CÁCH CHẠY: dán toàn bộ vào Supabase Dashboard > SQL Editor > Run.
-- ============================================================================

-- ─── 1. THU HỒI QUYỀN CỦA anon ──────────────────────────────────────────────
-- RLS chỉ lọc dòng; nếu vai trò anon vẫn còn quyền SELECT ở tầng GRANT thì
-- vẫn gọi được API và dò được cấu trúc bảng. Chặn cả hai tầng cho chắc.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE USAGE ON SCHEMA public FROM anon;

-- Bảng tạo về sau cũng mặc định không cấp quyền cho anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

-- Đảm bảo authenticated có đủ quyền ở tầng GRANT (RLS sẽ lọc tiếp)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

-- ─── 2. BẬT RLS + POLICY "CHỈ authenticated" CHO MỌI BẢNG ───────────────────
-- Quét động thay vì liệt kê tay: liệt kê tay là cách chắc chắn sẽ bỏ sót một
-- bảng nào đó, và một bảng hở là đủ để lộ dữ liệu.
DO $$
DECLARE
  t   RECORD;
  pol RECORD;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    -- Gỡ sạch policy cũ (nhiều bảng đang có policy USING (true) quá lỏng)
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t.tablename
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t.tablename);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    -- FORCE: chủ sở hữu bảng cũng phải tuân thủ RLS, không được đi cửa sau
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t.tablename);

    EXECUTE format(
      'CREATE POLICY "authenticated_only" ON public.%I FOR ALL TO authenticated '
      'USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      t.tablename
    );
  END LOOP;
END $$;

-- ─── 3. XOÁ BẢNG MẬT KHẨU DẠNG CHỮ THƯỜNG ───────────────────────────────────
-- Bảng này là tàn dư của cơ chế đăng nhập demo (đối chiếu chuỗi mật khẩu).
-- Supabase Auth đã thay thế hoàn toàn. Để lại là để nguyên một kho mật khẩu
-- chờ rò rỉ — và người dùng thường tái sử dụng mật khẩu ở nơi khác.
--
-- ⚠️ Nếu muốn giữ lại danh sách nhân sự để đối chiếu trước khi seed, hãy
--    export bảng này ra CSV TRƯỚC khi chạy migration.
DROP TABLE IF EXISTS public.users CASCADE;

-- ─── 4. DANH MỤC PHÒNG BAN & VAI TRÒ ────────────────────────────────────────
INSERT INTO public.departments (code, name) VALUES
  ('BOD',        'Ban Giám Đốc'),
  ('MD',         'Merchandising & Thu Mua'),
  ('SALES',      'Khách Hàng / Kinh Doanh'),
  ('ACC',        'Kế Toán'),
  ('WH',         'Kho Vật Tư & Thành Phẩm'),
  ('QA',         'QA / QC'),
  ('CUT',        'Tổ Cắt'),
  ('SEW',        'Tổ May'),
  ('FIN',        'Tổ Hoàn Thành'),
  ('SUBCON',     'Gia Công Ngoài'),
  ('IT',         'Quản Trị Hệ Thống')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- code ở đây TRÙNG KHỚP với type Role trong types/erp.ts và lib/rbac.ts.
-- Đổi ở một nơi thì phải đổi cả hai, nếu không phân quyền sẽ lệch.
INSERT INTO public.roles (code, name, description) VALUES
  ('superadmin',  'Super Admin',            'Toàn quyền hệ thống'),
  ('giamdoc',     'Giám đốc',               'Bảng tổng hợp toàn nhà máy'),
  ('md',          'Merchandiser & Thu Mua', 'Đơn hàng, tiến độ, mua NPL'),
  ('buyer',       'Khách hàng (Buyer)',     'Cổng tra cứu cho đối tác'),
  ('ketoan',      'Kế toán',                'Công nợ & thanh toán'),
  ('kho',         'Quản lý Kho',            'Kho NPL và kho thành phẩm'),
  ('qa',          'QA / QC',                'Kiểm soát chất lượng'),
  ('totruongcat', 'Tổ trưởng Cắt',          'Sản lượng cắt & bán thành phẩm'),
  ('totruongmay', 'Tổ trưởng May',          'Sản lượng chuyền may'),
  ('hoanthanh',   'Tổ Hoàn Thành',          'Ủi, đóng gói, hoàn thiện'),
  ('subcon',      'Xưởng gia công',         'Cổng báo cáo cho xưởng ngoài')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- ─── 5. TỰ TẠO profile KHI CÓ USER MỚI ──────────────────────────────────────
-- Không có trigger này thì mỗi lần tạo tài khoản lại phải nhớ chèn tay vào
-- public.profiles — thiếu một lần là hồ sơ nhân sự lệch với danh sách đăng nhập.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, employee_code, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'employee_code',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 6. TỰ KIỂM TRA SAU KHI CHẠY ────────────────────────────────────────────
-- Chạy khối này để xác nhận không còn bảng nào hở. Kết quả PHẢI rỗng.
DO $$
DECLARE hole INT;
BEGIN
  SELECT count(*) INTO hole
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = t.tablename
        AND p.policyname = 'authenticated_only'
    );
  IF hole > 0 THEN
    RAISE EXCEPTION 'Còn % bảng chưa có policy authenticated_only', hole;
  END IF;
  RAISE NOTICE 'OK: mọi bảng trong schema public đã được khoá về authenticated.';
END $$;
