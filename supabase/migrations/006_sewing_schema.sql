-- ====================================================================================
-- MONICA ERP - MODULE 5: SEWING LINE PRODUCTION & NEEDLE POLICY SCHEMA
-- ====================================================================================

-- 0. XÓA BẢNG CŨ NẾU TỒN TẠI
DROP TABLE IF EXISTS public.needle_break_logs CASCADE;
DROP TABLE IF EXISTS public.hourly_production_logs CASCADE;
DROP TABLE IF EXISTS public.sewing_lines CASCADE;

-- 1. BẢNG SEWING_LINES (Danh mục Chuyền May)
CREATE TABLE public.sewing_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    line_code VARCHAR(50) UNIQUE NOT NULL,             -- Mã chuyền (VD: LINE-01, LINE-02)
    line_name VARCHAR(100) NOT NULL,                    -- Tên chuyền (VD: Chuyền May Jacket 1)
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Chuyền trưởng
    target_pcs_per_hour INTEGER DEFAULT 50,             -- Target chuẩn/giờ
    status VARCHAR(20) DEFAULT 'ACTIVE',               -- ACTIVE, MAINTENANCE
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG HOURLY_PRODUCTION_LOGS (Nhật ký Sản lượng Chuyền theo Giờ)
CREATE TABLE public.hourly_production_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    line_id UUID REFERENCES public.sewing_lines(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,       -- Ngày sản xuất
    time_slot VARCHAR(50) NOT NULL,                    -- Khung giờ (VD: 08:00 - 09:00)
    operator_count INTEGER NOT NULL DEFAULT 0,         -- Số công nhân đi làm thực tế trên chuyền
    target_qty INTEGER NOT NULL DEFAULT 0,             -- Mục tiêu giờ này
    actual_qty INTEGER NOT NULL DEFAULT 0,             -- Số lượng áo may xong đạt chuẩn
    rework_qty INTEGER NOT NULL DEFAULT 0,             -- Số lượng áo phải sửa (Rework)
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG NEEDLE_BREAK_LOGS (Nhật ký Kiểm soát Kim Gãy & An Toàn)
CREATE TABLE public.needle_break_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    line_id UUID REFERENCES public.sewing_lines(id) ON DELETE RESTRICT,
    operator_name VARCHAR(100) NOT NULL,               -- Tên công nhân làm gãy kim
    machine_code VARCHAR(50) NOT NULL,                 -- Mã máy may
    needle_type VARCHAR(50) NOT NULL,                  -- Loại kim (VD: DBx1 Size 11)
    reason VARCHAR(255) NOT NULL,                      -- Lý do (Đâm vào cúc, vải quá dày...)
    fragments_found BOOLEAN NOT NULL DEFAULT TRUE,     -- Đã tìm đủ mảnh kim gãy chưa? (Bắt buộc TRUE)
    evidence_image_url TEXT NOT NULL,                  -- Ảnh chụp các mảnh kim gãy dán trên băng keo
    mechanic_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Thợ cơ điện xác nhận đổi kim
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TỐI ƯU HÓA TRUY VẤN & INDEXING
CREATE INDEX idx_hourly_logs_line_date ON public.hourly_production_logs(line_id, log_date);
CREATE INDEX idx_hourly_logs_order ON public.hourly_production_logs(order_id);
CREATE INDEX idx_needle_logs_line ON public.needle_break_logs(line_id);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.sewing_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.needle_break_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for dev and authenticated" ON public.sewing_lines FOR ALL USING (true);
CREATE POLICY "Allow all access for dev and authenticated" ON public.hourly_production_logs FOR ALL USING (true);
CREATE POLICY "Allow all access for dev and authenticated" ON public.needle_break_logs FOR ALL USING (true);

-- 6. NẠP DỮ LIỆU MẪU (SEED DATA)
INSERT INTO public.sewing_lines (id, line_code, line_name, target_pcs_per_hour)
VALUES 
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c10', 'LINE-01', 'Tổ May - Chuyền 1', 60),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c20', 'LINE-02', 'Tổ May - Chuyền 2', 50)
ON CONFLICT (line_code) DO NOTHING;

INSERT INTO public.hourly_production_logs (line_id, order_id, log_date, time_slot, operator_count, target_qty, actual_qty, rework_qty, notes)
SELECT 
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c10'::uuid,
    id,
    CURRENT_DATE,
    '08:00 - 09:00',
    25,
    60,
    58,
    2,
    'Chuyền vận hành ổn định đầu giờ sáng'
FROM public.orders WHERE po_number = 'PO-M2601' LIMIT 1;