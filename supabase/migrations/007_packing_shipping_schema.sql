-- ====================================================================================
-- MONICA ERP - MODULE 7: PACKING LIST & SHIPPING MANAGEMENT SCHEMA
-- ====================================================================================

-- 0. XÓA BẢNG CŨ NẾU TỒN TẠI (TRÁNH XUNG ĐỘT KHÓA NGOẠI)
DROP TABLE IF EXISTS public.shipment_cartons CASCADE;
DROP TABLE IF EXISTS public.shipments CASCADE;
DROP TABLE IF EXISTS public.cartons CASCADE;

-- 1. BẢNG CARTONS (Quản lý Thùng Carton Đóng Hàng)
CREATE TABLE public.cartons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    carton_code VARCHAR(100) UNIQUE NOT NULL,         -- Mã vạch thùng (VD: CTN-PO2601-BLK-M-001)
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    color_code VARCHAR(50) NOT NULL,                  -- Mã màu
    size_code VARCHAR(20) NOT NULL,                   -- Mã size
    quantity_per_carton INTEGER NOT NULL DEFAULT 24,  -- Số lượng áo/thùng (VD: 24 cái/thùng)
    gross_weight_kg NUMERIC(8, 2) DEFAULT 0.00,       -- Trọng lượng cả thùng (GW)
    net_weight_kg NUMERIC(8, 2) DEFAULT 0.00,         -- Trọng lượng hàng (NW)
    status VARCHAR(20) DEFAULT 'PACKED',              -- 'PACKED' (Đã đóng), 'SHIPPED' (Đã xuất)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG SHIPMENTS (Lô Hàng Xuất Khẩu / Container Manifest)
CREATE TABLE public.shipments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shipment_no VARCHAR(100) UNIQUE NOT NULL,         -- Số lô xuất (VD: EXP-2026-07-001)
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    container_no VARCHAR(50),                         -- Số Container (VD: TEMU-123456-7)
    seal_no VARCHAR(50),                              -- Số Seal
    vessel_name VARCHAR(100),                         -- Tên Tàu / Chuyến bay
    destination_port VARCHAR(100),                    -- Cảng đích (VD: Port of Los Angeles)
    etd_date DATE NOT NULL DEFAULT CURRENT_DATE,      -- Ngày xuất hàng dự kiến
    status VARCHAR(20) DEFAULT 'DRAFT',               -- 'DRAFT' (Lập hồ sơ), 'SHIPPED' (Đã rời cảng)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG SHIPMENT_CARTONS (Gắn Thùng vào Container Xuất Hàng)
CREATE TABLE public.shipment_cartons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    carton_id UUID REFERENCES public.cartons(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shipment_id, carton_id)
);

-- 4. INDEXING TỐI ƯU TRUY VẤN
CREATE INDEX idx_cartons_order ON public.cartons(order_id);
CREATE INDEX idx_cartons_code ON public.cartons(carton_code);
CREATE INDEX idx_shipments_order ON public.shipments(order_id);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.cartons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_cartons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for dev and authenticated" ON public.cartons FOR ALL USING (true);
CREATE POLICY "Allow all access for dev and authenticated" ON public.shipments FOR ALL USING (true);
CREATE POLICY "Allow all access for dev and authenticated" ON public.shipment_cartons FOR ALL USING (true);

-- 6. DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
INSERT INTO public.cartons (carton_code, order_id, color_code, size_code, quantity_per_carton, gross_weight_kg, net_weight_kg, status)
SELECT 
    'CTN-PO2601-BLK-M-001',
    id,
    'BLACK',
    'M',
    24,
    12.50,
    11.20,
    'PACKED'
FROM public.orders WHERE po_number = 'PO-M2601' LIMIT 1;

INSERT INTO public.cartons (carton_code, order_id, color_code, size_code, quantity_per_carton, gross_weight_kg, net_weight_kg, status)
SELECT 
    'CTN-PO2601-BLK-M-002',
    id,
    'BLACK',
    'M',
    24,
    12.50,
    11.20,
    'PACKED'
FROM public.orders WHERE po_number = 'PO-M2601' LIMIT 1;