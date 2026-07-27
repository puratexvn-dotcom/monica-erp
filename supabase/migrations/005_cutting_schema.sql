-- ====================================================================================
-- MONICA ERP - MODULE 4: CUTTING DEPARTMENT & BUNDLE MANAGEMENT SCHEMA
-- ====================================================================================

-- 0. XÓA BẢNG CŨ NẾU TỒN TẠI ĐỂ TRÁNH XUNG ĐỘT CẤU TRÚC
DROP TABLE IF EXISTS public.cut_attachments CASCADE;
DROP TABLE IF EXISTS public.cut_bundles CASCADE;
DROP TABLE IF EXISTS public.cut_ticket_rolls CASCADE;
DROP TABLE IF EXISTS public.cut_tickets CASCADE;
DROP TABLE IF EXISTS public.fabric_rolls CASCADE;

-- 1. BẢNG FABRIC_ROLLS (Quản lý Chi tiết Cuộn/Cây vải)
CREATE TABLE public.fabric_rolls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID REFERENCES public.materials(id) ON DELETE RESTRICT,
    roll_code VARCHAR(100) UNIQUE NOT NULL,            -- Mã cuộn vải (VD: ROLL-BLK-2026-01)
    shade_lot VARCHAR(50) NOT NULL,                    -- Mã lô nhuộm / Ánh màu (VD: SHADE-A1)
    initial_length_m NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Chiều dài ban đầu (Mét)
    current_length_m NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Chiều dài còn lại thực tế (Mét)
    status VARCHAR(50) DEFAULT 'IN_STOCK',             -- IN_STOCK, IN_USE, EXHAUSTED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG CUT_TICKETS (Phiếu Bàn Cắt Master & Quản lý Hao Hụt)
CREATE TABLE public.cut_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_no VARCHAR(100) UNIQUE NOT NULL,            -- Mã phiếu cắt (VD: PK-2026-001)
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT, -- Gắn với Đơn hàng PO
    marker_code VARCHAR(100) NOT NULL,                  -- Mã sơ đồ cắt
    marker_length_m NUMERIC(10, 2) NOT NULL,            -- Chiều dài sơ đồ (Mét)
    ply_count INTEGER NOT NULL DEFAULT 1,                -- Số lớp vải trải
    total_planned_pcs INTEGER NOT NULL DEFAULT 0,      -- Số lượng sản phẩm dự kiến
    total_actual_pcs INTEGER NOT NULL DEFAULT 0,       -- Số lượng bán thành phẩm cắt thực tế
    
    -- DỮ LIỆU HAO HỤT & VẢI ĐẦU TẤM (WASTAGE & REMNANTS)
    bom_allowance_m NUMERIC(10, 2) NOT NULL DEFAULT 0.00,    -- Định mức vải cấp theo BOM (Mét)
    total_fabric_used_m NUMERIC(10, 2) NOT NULL DEFAULT 0.00,-- Tổng vải thực tế đã trải (Mét)
    remnant_length_m NUMERIC(10, 2) NOT NULL DEFAULT 0.00,   -- Số mét vải đầu tấm thu hồi
    defect_length_m NUMERIC(10, 2) NOT NULL DEFAULT 0.00,    -- Số mét vải lỗi cắt bỏ (Khuyết tật dệt)
    
    -- RÀNG BUỘC NHÂN SỰ
    spreader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Thợ trải vải
    cutter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,   -- Thợ cắt chính
    
    status VARCHAR(50) DEFAULT 'COMPLETED',            -- DRAFT, IN_PROGRESS, COMPLETED
    notes TEXT,                                        -- Ghi chú của Tổ trưởng Cắt
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG CUT_TICKET_ROLLS (Nối Truy xuất nguồn gốc Cuộn vải sử dụng)
CREATE TABLE public.cut_ticket_rolls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cut_ticket_id UUID REFERENCES public.cut_tickets(id) ON DELETE CASCADE,
    roll_id UUID REFERENCES public.fabric_rolls(id) ON DELETE RESTRICT,
    used_length_m NUMERIC(10, 2) NOT NULL DEFAULT 0.00,   -- Chiều dài đã xả cắt từ cuộn này
    remnant_length_m NUMERIC(10, 2) NOT NULL DEFAULT 0.00,-- Chiều dài đầu tấm dư của cuộn này
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG CUT_BUNDLES (Chi tiết Phối kiện / Bó bán thành phẩm)
CREATE TABLE public.cut_bundles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cut_ticket_id UUID REFERENCES public.cut_tickets(id) ON DELETE CASCADE,
    bundle_code VARCHAR(100) UNIQUE NOT NULL,          -- Mã vạch Barcode/QR (VD: BDL-M2601-BLK-M-001)
    color_code VARCHAR(50) NOT NULL,                    -- Mã màu
    size_code VARCHAR(20) NOT NULL,                     -- Kích thước (S, M, L, XL)
    start_ply_no INTEGER NOT NULL,                      -- Lớp bắt đầu (VD: 1)
    end_ply_no INTEGER NOT NULL,                        -- Lớp kết thúc (VD: 50)
    quantity INTEGER NOT NULL,                          -- Số lượng sp trong bó
    shade_lot VARCHAR(50) NOT NULL,                     -- Ánh màu/Lô dệt để tránh lệch màu
    status VARCHAR(50) DEFAULT 'READY',                 -- READY, ISSUED_TO_SEWING, COMPLETED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG CUT_ATTACHMENTS (Bằng chứng Sơ đồ cắt & Biên bản Vải hỏng)
CREATE TABLE public.cut_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cut_ticket_id UUID REFERENCES public.cut_tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    attachment_type VARCHAR(50) NOT NULL,              -- 'MARKER_LAYOUT', 'HAUTUT_EVIDENCE'
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TỐI ƯU HÓA TRUY VẤN (INDEXING)
CREATE INDEX idx_fabric_rolls_material ON public.fabric_rolls(material_id);
CREATE INDEX idx_cut_tickets_order ON public.cut_tickets(order_id);
CREATE INDEX idx_cut_bundles_ticket ON public.cut_bundles(cut_ticket_id);
CREATE INDEX idx_cut_bundles_code ON public.cut_bundles(bundle_code);

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.fabric_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_ticket_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for dev and authenticated" ON public.fabric_rolls FOR ALL USING (true);
CREATE POLICY "Allow all access for dev and authenticated" ON public.cut_tickets FOR ALL USING (true);
CREATE POLICY "Allow all access for dev and authenticated" ON public.cut_ticket_rolls FOR ALL USING (true);
CREATE POLICY "Allow all access for dev and authenticated" ON public.cut_bundles FOR ALL USING (true);
CREATE POLICY "Allow all access for dev and authenticated" ON public.cut_attachments FOR ALL USING (true);

-- 8. VIEW TỰ ĐỘNG TÍNH CHÊNH LỆCH HAO HỤT VẢI (VARIANCE ANALYSIS VIEW)
CREATE OR REPLACE VIEW public.vw_cut_ticket_summary AS
SELECT 
    ct.id AS cut_ticket_id,
    ct.ticket_no,
    o.po_number,
    o.style_code,
    ct.bom_allowance_m,
    ct.total_fabric_used_m,
    ct.remnant_length_m,
    ct.defect_length_m,
    (ct.total_fabric_used_m - ct.remnant_length_m - ct.defect_length_m) AS net_fabric_consumed_m,
    ((ct.total_fabric_used_m - ct.remnant_length_m - ct.defect_length_m) - ct.bom_allowance_m) AS variance_m,
    ct.created_at
FROM public.cut_tickets ct
LEFT JOIN public.orders o ON ct.order_id = o.id;

-- 9. SEED DATA MẪU CHO TỔ CẮT
INSERT INTO public.fabric_rolls (id, roll_code, shade_lot, initial_length_m, current_length_m)
VALUES 
('c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c01', 'ROLL-COTTON-BLK-01', 'SHADE-A1', 100.00, 15.00),
('c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c02', 'ROLL-COTTON-BLK-02', 'SHADE-A1', 120.00, 120.00)
ON CONFLICT (roll_code) DO NOTHING;

INSERT INTO public.cut_tickets (
    id, ticket_no, order_id, marker_code, marker_length_m, ply_count, 
    total_planned_pcs, total_actual_pcs, bom_allowance_m, total_fabric_used_m, 
    remnant_length_m, defect_length_m, notes
)
SELECT 
    'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c02'::uuid,
    'PK-2026-001',
    id,
    'MARKER-JK-SIZE-M-L',
    6.50,
    10,
    50,
    50,
    70.00,
    85.00,
    15.00,
    2.00,
    'Trải vải cuộn ROLL-COTTON-BLK-01, phát hiện 2m bị lỗi dệt ở mét số 45.'
FROM public.orders 
WHERE po_number = 'PO-M2601'
LIMIT 1
ON CONFLICT (ticket_no) DO NOTHING;

INSERT INTO public.cut_bundles (cut_ticket_id, bundle_code, color_code, size_code, start_ply_no, end_ply_no, quantity, shade_lot)
VALUES 
('d1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c02', 'BDL-M2601-BLK-M-01', 'BLACK', 'M', 1, 25, 25, 'SHADE-A1'),
('d1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c02', 'BDL-M2601-BLK-M-02', 'BLACK', 'M', 26, 50, 25, 'SHADE-A1')
ON CONFLICT (bundle_code) DO NOTHING;