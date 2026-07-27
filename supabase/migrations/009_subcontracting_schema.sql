-- ====================================================================
-- MONICA ERP - SUB SYSTEM: SUBCONTRACTING (GIA CÔNG NGOÀI)
-- MIGRATION: 009_subcontracting_schema.sql
-- ARCHITECT: Chief Architect
-- ====================================================================

-- 1. DANH SÁCH ĐỐI TÁC GIA CÔNG (VENDORS)
CREATE TABLE IF NOT EXISTS public.subcontractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_code VARCHAR(50) UNIQUE NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(50) NOT NULL, -- 'PRINTING', 'EMBROIDERY', 'WASHING', 'CMT'
  phone VARCHAR(50),
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ĐƠN ĐẶT HÀNG GIA CÔNG (SUBCON ORDERS)
CREATE TABLE IF NOT EXISTS public.subcon_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subcon_order_no VARCHAR(100) UNIQUE NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  process_type VARCHAR(50) NOT NULL, -- 'IN_THEU', 'GIAT', 'MAY_GIA_CONG'
  total_sent_qty INT DEFAULT 0 CHECK (total_sent_qty >= 0),
  total_received_qty INT DEFAULT 0 CHECK (total_received_qty >= 0),
  total_defect_qty INT DEFAULT 0 CHECK (total_defect_qty >= 0),
  unit_price NUMERIC(12, 2) DEFAULT 0 CHECK (unit_price >= 0), -- Đơn giá gia công / sp
  status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ISSUED', 'IN_PROGRESS', 'PARTIAL_RECEIVED', 'COMPLETED', 'CLOSED')),
  issued_date TIMESTAMPTZ,
  expected_return_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CHI TIẾT XUẤT BÁN THÀNH PHẨM DI GIA CÔNG (OUTBOUND LOGS)
CREATE TABLE IF NOT EXISTS public.subcon_issue_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subcon_order_id UUID NOT NULL REFERENCES public.subcon_orders(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES public.cut_bundles(id) ON DELETE RESTRICT,
  quantity_sent INT NOT NULL CHECK (quantity_sent > 0),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- 4. CHI TIẾT THU HỒI BÁN THÀNH PHẨM VỀ NHÀ MÁY (INBOUND LOGS)
CREATE TABLE IF NOT EXISTS public.subcon_receipt_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subcon_order_id UUID NOT NULL REFERENCES public.subcon_orders(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES public.cut_bundles(id) ON DELETE RESTRICT,
  quantity_good INT NOT NULL DEFAULT 0 CHECK (quantity_good >= 0),
  quantity_defect INT NOT NULL DEFAULT 0 CHECK (quantity_defect >= 0),
  
  -- QUY TẮC 3: CỜ ĐỀN BỦ (CHARGEABLE FLAG)
  is_chargeable BOOLEAN NOT NULL DEFAULT TRUE, 
  defect_reason TEXT,
  
  -- QUY TẮC 1: HỆ THỐNG LƯU BẰNG CHỨNG HÌNH ẢNH (ATTACHMENTS / EVIDENCE)
  defect_evidence_urls TEXT[] DEFAULT '{}', 
  
  received_at TIMESTAMPTZ DEFAULT NOW(),
  received_by UUID REFERENCES auth.users(id),

  -- MÀNG LỌC BẢO VỆ: Nếu có hàng lỗi (quantity_defect > 0), BẮT BUỘC phải kèm theo ít nhất 1 ảnh bằng chứng
  CONSTRAINT chk_defect_requires_evidence CHECK (
    quantity_defect = 0 OR (quantity_defect > 0 AND array_length(defect_evidence_urls, 1) > 0)
  )
);

-- ====================================================================
-- BUSINESS LOGIC TRIGGERS (TỰ ĐỘNG HÓA VÀ RÀNG BUỘC NGHIỆP VỤ)
-- ====================================================================

-- TRIGGER 1: XỬ LÝ XUẤT BÓ HÀNG ĐI GIA CÔNG
CREATE OR REPLACE FUNCTION public.fn_process_subcon_issue()
RETURNS TRIGGER AS $$
BEGIN
  -- Cập nhật trạng thái Bundle sang OUTSIDE_PROCESSING (Chặn Chuyền may quét nhầm)
  UPDATE public.cut_bundles
  SET 
    current_stage = 'OUTSIDE_PROCESSING',
    updated_at = NOW()
  WHERE id = NEW.bundle_id;

  -- Cập nhật lũy kế số lượng xuất trên Đơn gia công
  UPDATE public.subcon_orders
  SET 
    total_sent_qty = total_sent_qty + NEW.quantity_sent,
    status = 'IN_PROGRESS',
    updated_at = NOW()
  WHERE id = NEW.subcon_order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_subcon_issue_after_insert
AFTER INSERT ON public.subcon_issue_logs
FOR EACH ROW EXECUTE FUNCTION public.fn_process_subcon_issue();


-- TRIGGER 2: XỬ LÝ THU HỒI BÓ HÀNG & TỰ ĐỘNG KHẤU TRỪ HAO HỤT (BUNDLE SHRINKAGE)
CREATE OR REPLACE FUNCTION public.fn_process_subcon_receipt()
RETURNS TRIGGER AS $$
DECLARE
  v_current_bundle_qty INT;
BEGIN
  -- 1. Kiểm tra tồn tại và khóa dòng Bundle để xử lý an toàn đa người dùng
  SELECT quantity INTO v_current_bundle_qty
  FROM public.cut_bundles
  WHERE id = NEW.bundle_id FOR UPDATE;

  IF v_current_bundle_qty IS NULL THEN
    RAISE EXCEPTION 'SUBCON_ERROR: Bundle ID % không tồn tại.', NEW.bundle_id;
  END IF;

  -- 2. QUY TẮC 2: TỰ ĐỘNG KHẤU TRỪ SỐ LƯỢNG BÓ HÀNG (BUNDLE SHRINKAGE)
  -- Trừ đi đúng số lượng bị hỏng/lỗi do xưởng ngoài gây ra
  UPDATE public.cut_bundles
  SET 
    quantity = GREATEST(0, quantity - NEW.quantity_defect),
    current_stage = 'SEWING_READY', -- Đưa Bundle trở lại trạng thái sẵn sàng cho Chuyền May
    updated_at = NOW()
  WHERE id = NEW.bundle_id;

  -- 3. Cập nhật lũy kế Nhập & Lỗi trên Đơn gia công
  UPDATE public.subcon_orders
  SET 
    total_received_qty = total_received_qty + NEW.quantity_good,
    total_defect_qty = total_defect_qty + NEW.quantity_defect,
    status = CASE 
      WHEN (total_received_qty + NEW.quantity_good + total_defect_qty + NEW.quantity_defect) >= total_sent_qty THEN 'COMPLETED'
      ELSE 'PARTIAL_RECEIVED'
    END,
    updated_at = NOW()
  WHERE id = NEW.subcon_order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_subcon_receipt_after_insert
AFTER INSERT ON public.subcon_receipt_logs
FOR EACH ROW EXECUTE FUNCTION public.fn_process_subcon_receipt();