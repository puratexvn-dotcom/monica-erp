-- ====================================================================================
-- MONICA ERP - CORE DATABASE SCHEMA (V1)
-- ====================================================================================

-- 1. BẬT EXTENSION CẦN THIẾT
-- Extension hỗ trợ tự động cập nhật thời gian (updated_at)
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ====================================================================================
-- PHẦN 1: TỔ CHỨC & PHÂN QUYỀN (ORGANIZATION & RBAC)
-- ====================================================================================

-- Bảng 1.1: departments (Phòng ban / Tổ / Chuyền)
CREATE TABLE public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 1.2: roles (Vai trò)
CREATE TABLE public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 1.3: permissions (Quyền hạn chi tiết)
CREATE TABLE public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL, -- Phân cụm nhóm quyền (VD: WAREHOUSE, SEWING, QA)
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 1.4: role_permissions (Bảng trung gian N:N giữa Roles và Permissions)
CREATE TABLE public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ====================================================================================
-- PHẦN 2: NGƯỜI DÙNG HỆ THỐNG (SYSTEM USERS)
-- ====================================================================================

-- Bảng 2.1: profiles (Mở rộng từ auth.users của Supabase)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE,
    full_name VARCHAR(255),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 2.2: user_roles (Bảng trung gian N:N giữa Profiles và Roles)
CREATE TABLE public.user_roles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ====================================================================================
-- PHẦN 3: NHÂN SỰ XƯỞNG & CHẤM CÔNG (WORKFORCE & ATTENDANCE)
-- ====================================================================================

-- Bảng 3.1: employees (Danh sách công nhân, thợ không có tài khoản app)
CREATE TABLE public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    position VARCHAR(100), -- Vd: Thợ may, Thợ trải vải
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 3.2: attendance_logs (Nhật ký chấm công Hybrid)
CREATE TABLE public.attendance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL, -- PRESENT, ABSENT, LATE, LEAVE
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    is_manual_override BOOLEAN DEFAULT FALSE, -- Bằng chứng xem đây là máy quẹt hay người sửa
    override_reason TEXT, -- Lý do Tổ trưởng sửa (nếu có)
    recorded_by UUID REFERENCES public.profiles(id), -- Ai là người sửa/duyệt
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (employee_id, date) -- Mỗi người chỉ có 1 bản ghi chấm công mỗi ngày
);

-- ====================================================================================
-- PHẦN 4: DỮ LIỆU NGHIỆP VỤ LÕI (CORE BUSINESS LOGS)
-- ====================================================================================

-- Bảng 4.1: attachments (Hệ thống lưu trữ ảnh đa hình - Hình ảnh bằng chứng)
CREATE TABLE public.attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL, -- Vd: 'HOURLY_AUDIT', 'BROKEN_NEEDLE', 'GRN'
    entity_id UUID NOT NULL, -- Trỏ về ID của nghiệp vụ tương ứng
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 4.2: daily_production_logs (Báo cáo sản lượng & chất lượng đa năng)
CREATE TABLE public.daily_production_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL, -- Vd: '08:00-09:00'
    target_qty INTEGER NOT NULL DEFAULT 0,
    actual_qty INTEGER NOT NULL DEFAULT 0,
    defect_qty INTEGER NOT NULL DEFAULT 0,
    reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================================
-- PHẦN 5: TỐI ƯU HÓA HIỆU NĂNG (INDEXING)
-- ====================================================================================
-- Đánh index cho các cột thường xuyên được truy vấn để đảm bảo tốc độ khi dữ liệu phình to
CREATE INDEX idx_profiles_dept ON public.profiles(department_id);
CREATE INDEX idx_employees_dept ON public.employees(department_id);
CREATE INDEX idx_attendance_date ON public.attendance_logs(date);
CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX idx_production_dept_date ON public.daily_production_logs(department_id, date);

-- ====================================================================================
-- PHẦN 6: TRIGGERS (TỰ ĐỘNG HÓA)
-- ====================================================================================

-- Trigger 6.1: Tự động cập nhật trường updated_at
CREATE TRIGGER handle_updated_at_profiles BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at_employees BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at_departments BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at_production BEFORE UPDATE ON public.daily_production_logs
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Trigger 6.2: Tự động tạo Profile khi có 1 user mới đăng ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ====================================================================================
-- PHẦN 7: ROW LEVEL SECURITY (RLS) - BẢO MẬT TẦNG CƠ SỞ DỮ LIỆU
-- ====================================================================================
-- Bật RLS cho tất cả các bảng
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_production_logs ENABLE ROW LEVEL SECURITY;

-- Tạo Policy cơ bản: Bất kỳ ai đã đăng nhập (Authenticated) đều có thể ĐỌC dữ liệu.
-- (Lưu ý: Các rule ghi/xóa phức tạp dựa vào Role sẽ được chúng ta định nghĩa sau bằng JWT).
CREATE POLICY "Allow read access to authenticated users" ON public.departments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to authenticated users" ON public.employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to authenticated users" ON public.attendance_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to authenticated users" ON public.attachments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to authenticated users" ON public.daily_production_logs FOR SELECT USING (auth.role() = 'authenticated');

-- Riêng profiles: User có thể tự update thông tin của chính mình
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ====================================================================================
-- END OF SCRIPT
-- ====================================================================================