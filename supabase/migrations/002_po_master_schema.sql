-- ====================================================================================
-- MONICA ERP - MODULE 1: PO MASTER & ORDER BREAKDOWN SCHEMA (FIXED)
-- ====================================================================================

-- 0. XÓA BẢNG CŨ NẾU ĐÃ TỒN TẠI ĐỂ TRÁNH XUNG ĐỘT CẤU TRÚC
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- 1. BẢNG ORDERS (Quản lý Đơn hàng Master)
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE NOT NULL,     -- Mã PO (VD: PO-2026-M2602)
    style_code VARCHAR(100) NOT NULL,          -- Mã hàng / Style (VD: JACKET-WINTER-01)
    customer_name VARCHAR(255) NOT NULL,       -- Tên khách hàng / Hãng may
    total_quantity INTEGER NOT NULL DEFAULT 0,    -- Tổng số lượng PO đặt
    delivery_date DATE NOT NULL,               -- Ngày xuất hàng theo kế hoạch
    status VARCHAR(50) DEFAULT 'APPROVED',     -- Trạng thái: DRAFT, APPROVED, IN_PRODUCTION, COMPLETED
    techpack_url TEXT,                         -- Đường dẫn ảnh/tài liệu Techpack duyệt
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG ORDER_ITEMS (Chi tiết Tỷ lệ Màu & Size)
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    color_code VARCHAR(50) NOT NULL,           -- Mã màu (VD: NAVY_BLUE, BLACK_01)
    size_code VARCHAR(20) NOT NULL,             -- Size (S, M, L, XL, XXL)
    quantity INTEGER NOT NULL DEFAULT 0,        -- Số lượng theo màu/size
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (order_id, color_code, size_code)    -- Mỗi PO không được trùng lặp cặp Màu-Size
);

-- 3. TỐI ƯU HÓA TRUY VẤN (INDEXING)
CREATE INDEX idx_orders_po ON public.orders(po_number);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- 4. TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
CREATE TRIGGER handle_updated_at_orders BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy cho phép người dùng đã đăng nhập đọc danh sách PO
CREATE POLICY "Allow read access to authenticated users" ON public.orders 
  FOR SELECT USING (auth.role() = 'authenticated');
  
CREATE POLICY "Allow read access to authenticated users" ON public.order_items 
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy cho phép người dùng tạo và cập nhật PO
CREATE POLICY "Allow insert for authenticated users" ON public.orders 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.orders 
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. NẠP DỮ LIỆU MẪU PO THỰC TẾ (SEED DATA CHO DEMO V1)
INSERT INTO public.orders (po_number, style_code, customer_name, total_quantity, delivery_date, status)
VALUES 
('PO-M2601', 'JK-W26-M1', 'Adidas Global', 5000, '2026-08-15', 'IN_PRODUCTION'),
('PO-M2602', 'TS-S26-M2', 'Uniqlo Casual', 12000, '2026-08-30', 'APPROVED')
ON CONFLICT (po_number) DO NOTHING;