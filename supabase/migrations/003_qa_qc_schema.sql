-- ====================================================================================
-- MONICA ERP - MODULE 2: QA/QC HOURLY AUDIT & DEFECT TRACKING SCHEMA
-- ====================================================================================

-- 0. XÓA BẢNG CŨ NẾU ĐÃ TỒN TẠI ĐỂ TRÁNH XUNG ĐỘT
DROP TABLE IF EXISTS public.qa_defects CASCADE;
DROP TABLE IF EXISTS public.qa_audit_reports CASCADE;

-- 1. BẢNG QA_AUDIT_REPORTS (Báo cáo kiểm hàng theo giờ)
CREATE TABLE public.qa_audit_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE, -- Đơn hàng được kiểm
    line_name VARCHAR(100) NOT NULL DEFAULT 'Chuyền 1',             -- Chuyền may (VD: Chuyền 1, Chuyền 2)
    time_slot VARCHAR(50) NOT NULL,                                 -- Khung giờ (VD: 08:00 - 09:00)
    inspected_qty INTEGER NOT NULL DEFAULT 0,                       -- Số lượng sản phẩm rút kiểm
    passed_qty INTEGER NOT NULL DEFAULT 0,                          -- Số lượng đạt chuẩn
    defect_qty INTEGER NOT NULL DEFAULT 0,                          -- Số lượng phát hiện lỗi
    notes TEXT,                                                     -- Ghi chú của QA
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG QA_DEFECTS (Chi tiết danh mục lỗi & Bằng chứng ảnh)
CREATE TABLE public.qa_defects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_report_id UUID REFERENCES public.qa_audit_reports(id) ON DELETE CASCADE,
    defect_type VARCHAR(100) NOT NULL,                              -- Loại lỗi (VD: Bỏ mũi, Sụp mí, Dơ vải)
    quantity INTEGER NOT NULL DEFAULT 1,                            -- Số lượng chi tiết bị lỗi này
    image_url TEXT,                                                 -- Đường dẫn ảnh chụp bằng chứng từ Live Camera
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TỐI ƯU HÓA TRUY VẤN (INDEXING)
CREATE INDEX idx_qa_audit_order ON public.qa_audit_reports(order_id);
CREATE INDEX idx_qa_audit_created ON public.qa_audit_reports(created_at);
CREATE INDEX idx_qa_defects_report ON public.qa_defects(audit_report_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.qa_audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_defects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for dev and authenticated" ON public.qa_audit_reports
  FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for dev and authenticated" ON public.qa_audit_reports
  FOR ALL USING (true);

CREATE POLICY "Allow read access for dev and authenticated" ON public.qa_defects
  FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for dev and authenticated" ON public.qa_defects
  FOR ALL USING (true);

-- 5. NẠP DỮ LIỆU MẪU QA/QC CHO DEMO
INSERT INTO public.qa_audit_reports (id, order_id, line_name, time_slot, inspected_qty, passed_qty, defect_qty, notes)
SELECT 
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'::uuid,
    id, 
    'Chuyền 1', 
    '08:00 - 09:00', 
    50, 
    47, 
    3, 
    'Lỗi đứt chỉ rải rác ở đường may sườn'
FROM public.orders 
WHERE po_number = 'PO-M2601'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.qa_defects (audit_report_id, defect_type, quantity, image_url)
VALUES 
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Bỏ mũi', 2, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Dơ vải', 1, 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=500')
ON CONFLICT DO NOTHING;