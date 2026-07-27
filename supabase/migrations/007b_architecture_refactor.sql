-- ====================================================================================
-- MONICA ERP - MIGRATION 007b: ARCHITECTURE REFACTORING & FINISHING INTEGRATION
-- ====================================================================================

-- 1. TẠO KIỂU DỮ LIỆU ENUM CHẶN RỦI RO TRẠNG THÁI (STRICT TYPING)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bundle_stage_enum') THEN
        CREATE TYPE public.bundle_stage_enum AS ENUM ('CUT', 'SEWING', 'FINISHING', 'PACKED');
    END IF;
END $$;

-- 2. ĐẢM BẢO BẢNG SEWING_LINES & CỘT LINE_CODE HỢP LỆ (FAIL-SAFE)
CREATE TABLE IF NOT EXISTS public.sewing_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    line_code VARCHAR(50) NOT NULL,
    line_name VARCHAR(100) NOT NULL,
    capacity_per_hour INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Khởi tạo UNIQUE Index trên cả line_code và line_name
CREATE UNIQUE INDEX IF NOT EXISTS idx_sewing_lines_code_unique ON public.sewing_lines(line_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sewing_lines_name_unique ON public.sewing_lines(line_name);

-- Nạp sẵn danh mục Chuyền may chuẩn (Cung cấp đủ cả line_code và line_name)
INSERT INTO public.sewing_lines (line_code, line_name)
VALUES 
    ('LINE-01', 'Chuyền 1'),
    ('LINE-02', 'Chuyền 2'),
    ('LINE-03', 'Chuyền 3')
ON CONFLICT (line_code) DO NOTHING;

-- 3. XỬ LÝ DỮ LIỆU RÁC (GRACEFUL MIGRATION) CHO QA_AUDIT_REPORTS
ALTER TABLE public.qa_audit_reports 
ADD COLUMN IF NOT EXISTS line_id UUID REFERENCES public.sewing_lines(id) ON DELETE SET NULL;

-- Map dữ liệu Text cũ sang Foreign Key line_id an toàn 100%
UPDATE public.qa_audit_reports qa
SET line_id = sl.id
FROM public.sewing_lines sl
WHERE qa.line_id IS NULL 
  AND (
    TRIM(LOWER(qa.line_name)) = TRIM(LOWER(sl.line_name))
    OR TRIM(LOWER(qa.line_name)) = TRIM(LOWER(sl.line_code))
  );

CREATE INDEX IF NOT EXISTS idx_qa_audit_line_id ON public.qa_audit_reports(line_id);

-- 4. BỔ SUNG TRƯỜNG CURRENT_STAGE (ENUM) VÀO CUT_BUNDLES
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'cut_bundles' 
          AND column_name = 'current_stage'
    ) THEN
        ALTER TABLE public.cut_bundles 
        ADD COLUMN current_stage public.bundle_stage_enum NOT NULL DEFAULT 'CUT';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cut_bundles_stage ON public.cut_bundles(current_stage);

-- 5. BẢNG FINISHING_LOGS (Phòng Hoàn Thành: Cắt chỉ, Ủi, Final QC)
CREATE TABLE IF NOT EXISTS public.finishing_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bundle_id UUID REFERENCES public.cut_bundles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    trimming_qty INTEGER NOT NULL DEFAULT 0 CHECK (trimming_qty >= 0),
    ironing_qty INTEGER NOT NULL DEFAULT 0 CHECK (ironing_qty >= 0),
    final_qc_passed_qty INTEGER NOT NULL DEFAULT 0 CHECK (final_qc_passed_qty >= 0),
    final_qc_defect_qty INTEGER NOT NULL DEFAULT 0 CHECK (final_qc_defect_qty >= 0),
    inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finishing_bundle ON public.finishing_logs(bundle_id);
CREATE INDEX IF NOT EXISTS idx_finishing_order ON public.finishing_logs(order_id);

ALTER TABLE public.finishing_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for dev and authenticated" ON public.finishing_logs;
CREATE POLICY "Allow all access for dev and authenticated" ON public.finishing_logs FOR ALL USING (true);

-- 6. LIÊN KẾT BẢNG CARTONS TRỰC TIẾP VỚI BUNDLE ĐỂ QUÉT MÃ VẠCH ĐÓNG THÙNG
ALTER TABLE public.cartons
ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES public.cut_bundles(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_cartons_bundle ON public.cartons(bundle_id);

-- 7. TRIGGER AUTO ADVANCE BUNDLE STAGE (TỰ ĐỘNG CHUYỂN SANG FINISHING KHI FINAL QC ĐẠT)
CREATE OR REPLACE FUNCTION public.fn_auto_advance_bundle_stage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.final_qc_passed_qty > 0 THEN
        UPDATE public.cut_bundles
        SET current_stage = 'FINISHING'
        WHERE id = NEW.bundle_id AND current_stage IN ('CUT', 'SEWING');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_advance_bundle ON public.finishing_logs;
CREATE TRIGGER trg_auto_advance_bundle
AFTER INSERT OR UPDATE ON public.finishing_logs
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_advance_bundle_stage();

-- 8. TRIGGER CHẶN BẮT BỎ (STRICT CHECK): CẤM ĐÓNG THÙNG NẾU CHƯA QUA FINAL QC
CREATE OR REPLACE FUNCTION public.fn_validate_carton_packing_stage()
RETURNS TRIGGER AS $$
DECLARE
    v_bundle_stage public.bundle_stage_enum;
    v_passed_qc INT;
BEGIN
    IF NEW.bundle_id IS NOT NULL THEN
        SELECT current_stage INTO v_bundle_stage
        FROM public.cut_bundles
        WHERE id = NEW.bundle_id;

        IF v_bundle_stage IS NULL OR v_bundle_stage NOT IN ('FINISHING', 'PACKED') THEN
            RAISE EXCEPTION 'STRICT_PACKING_ERROR: Bundle % dang o giai doan %. Bat buoc phai qua Final QC phong Hoan Thanh (FINISHING) moi duoc dong thung!', 
                NEW.bundle_id, COALESCE(v_bundle_stage::text, 'UNKNOWN');
        END IF;

        SELECT COALESCE(SUM(final_qc_passed_qty), 0) INTO v_passed_qc
        FROM public.finishing_logs
        WHERE bundle_id = NEW.bundle_id;

        IF v_passed_qc <= 0 THEN
            RAISE EXCEPTION 'STRICT_PACKING_ERROR: Bundle % chua co san luong DAT kieu cuoi (Final QC Passed = 0). Khong the dong thung!', NEW.bundle_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_carton_packing ON public.cartons;
CREATE TRIGGER trg_validate_carton_packing
BEFORE INSERT OR UPDATE ON public.cartons
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_carton_packing_stage();