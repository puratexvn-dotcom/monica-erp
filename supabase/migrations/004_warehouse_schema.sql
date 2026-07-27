-- ====================================================================================
-- MONICA ERP - MODULE 3: WAREHOUSE & INVENTORY MANAGEMENT SCHEMA
-- ====================================================================================

-- 0. XÓA BẢNG CŨ NẾU TỒN TẠI ĐỂ TRÁNH XUNG ĐỘT KHÓA NGOẠI
DROP TABLE IF EXISTS public.warehouse_transactions CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;

-- 1. BẢNG MATERIALS (Danh mục Vật tư & Tồn kho Realtime)
CREATE TABLE public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_code VARCHAR(100) UNIQUE NOT NULL,      -- Mã vật tư (VD: FAB-COTTON-BLK, ZIP-YKK-50CM)
    name VARCHAR(255) NOT NULL,                       -- Tên vật tư (VD: Vải Khaki Cotton Đen Khổ 1m5)
    category VARCHAR(50) NOT NULL,                    -- Phân loại: FABRIC (Vải), TRIMS (Phụ liệu), THREAD (Chỉ)
    unit VARCHAR(20) NOT NULL,                        -- Đơn vị tính: METERS, KG, PCS, ROLLS
    stock_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.00,   -- Số lượng tồn kho thực tế realtime
    min_stock_qty NUMERIC(12, 2) DEFAULT 100.00,      -- Ngưỡng tồn kho tối thiểu để cảnh báo
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG WAREHOUSE_TRANSACTIONS (Nhật ký Nhập / Xuất kho)
CREATE TABLE public.warehouse_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type VARCHAR(10) NOT NULL,             -- Loại giao dịch: 'IN' (Nhập) hoặc 'OUT' (Xuất)
    material_id UUID REFERENCES public.materials(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Gắn với PO nào (nếu xuất cho sản xuất)
    quantity NUMERIC(12, 2) NOT NULL,                 -- Số lượng nhập/xuất
    reference_no VARCHAR(100),                        -- Số phiếu / Số hóa đơn
    notes TEXT,                                       -- Ghi chú (VD: Xuất cho Bàn cắt số 1)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TỐI ƯU HÓA TRUY VẤN (INDEXING)
CREATE INDEX idx_materials_code ON public.materials(material_code);
CREATE INDEX idx_wh_trans_material ON public.warehouse_transactions(material_id);
CREATE INDEX idx_wh_trans_order ON public.warehouse_transactions(order_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for dev and authenticated" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Allow all for dev and authenticated" ON public.materials FOR ALL USING (true);

CREATE POLICY "Allow read access for dev and authenticated" ON public.warehouse_transactions FOR SELECT USING (true);
CREATE POLICY "Allow all for dev and authenticated" ON public.warehouse_transactions FOR ALL USING (true);

-- 5. NẠP DỮ LIỆU MẪU VẬT TƯ BAN ĐẦU (SEED DATA)
INSERT INTO public.materials (material_code, name, category, unit, stock_qty, min_stock_qty)
VALUES 
('FAB-COTTON-BLK', 'Vải Khaki Cotton Đen Khổ 1m5', 'FABRIC', 'METERS', 2500.00, 500.00),
('FAB-POLY-NVY', 'Vải Polyester Navy Chống Nước', 'FABRIC', 'METERS', 1800.00, 300.00),
('ZIP-YKK-50CM', 'Khóa Kéo YKK Metal 50cm', 'TRIMS', 'PCS', 5000.00, 1000.00),
('THREAD-COATS-WHT', 'Chỉ May Coats Spun 40/2 Trắng', 'THREAD', 'ROLLS', 150.00, 20.00)
ON CONFLICT (material_code) DO NOTHING;