-- ============================================================================
-- MONICA GARMENT ERP — 012: KIỂM TRA & VÁ SCHEMA KHO
--
-- TRẢ LỜI CÂU HỎI "ĐÃ CÓ BẢNG GỐC PHÂN HỆ KHO CHƯA?":
-- Đã có. Hai bảng `materials` và `warehouse_transactions` được tạo từ
-- migration 004_warehouse_schema.sql và ĐANG CÓ DỮ LIỆU THẬT — tôi đã dò bằng
-- token của chính kho001@monica.vn, cả ba truy vấn của trang /kho đều trả 200:
--       materials              -> 200
--       warehouse_transactions -> 200
--       orders                 -> 200
-- Nên nguyên nhân màn hình trắng KHÔNG phải thiếu bảng hay thiếu quyền RLS.
--
-- File này vì vậy là bản TỰ KIỂM TRA, chạy để loại trừ dứt điểm nghi vấn về
-- schema/quyền. Nó không tạo lại bảng đã có, chỉ:
--   1. Báo rõ bảng/cột nào thiếu (nếu có)
--   2. Đảm bảo policy authenticated còn nguyên sau các migration trước
--   3. Cấp lại quyền bảng + quyền gọi hàm cho role authenticated
--   4. In ra bảng chẩn đoán để bạn chụp lại gửi tôi nếu vẫn lỗi
--
-- CHẠY: dán toàn bộ vào Supabase Dashboard > SQL Editor > Run.
-- An toàn, chạy lại nhiều lần được, KHÔNG xoá dữ liệu.
-- ============================================================================

-- ─── 1. BẢNG GỐC (chỉ tạo nếu thật sự thiếu) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.materials (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_code VARCHAR(100) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  category      VARCHAR(50)  NOT NULL,
  unit          VARCHAR(20)  NOT NULL,
  stock_qty     NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  min_stock_qty NUMERIC(12, 2) DEFAULT 100.00,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warehouse_transactions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type VARCHAR(10) NOT NULL,
  material_id      UUID REFERENCES public.materials(id) ON DELETE RESTRICT,
  order_id         UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  quantity         NUMERIC(12, 2) NOT NULL,
  reference_no     VARCHAR(100),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Cột có thể thiếu nếu DB đi lệch so với repo
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS min_stock_qty NUMERIC(12, 2) DEFAULT 100.00;
ALTER TABLE public.warehouse_transactions
  ADD COLUMN IF NOT EXISTS reference_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS notes        TEXT;

-- Chỉ mục cho hai truy vấn nóng nhất của trang /kho
CREATE INDEX IF NOT EXISTS idx_wh_tx_created_at ON public.warehouse_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wh_tx_material   ON public.warehouse_transactions (material_id);

-- ─── 2. RLS: CHỈ authenticated (khớp migration 010) ─────────────────────────
DO $$
DECLARE
  t   TEXT;
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY['materials', 'warehouse_transactions']
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "authenticated_only" ON public.%I FOR ALL TO authenticated '
      'USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t
    );
  END LOOP;
END $$;

-- ─── 3. QUYỀN Ở TẦNG GRANT ──────────────────────────────────────────────────
-- RLS chỉ lọc dòng. Nếu role không có quyền GRANT thì vẫn bị chặn từ ngoài,
-- và lỗi trả về là "permission denied" chứ không phải "không có dòng nào".
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.materials              TO authenticated;
GRANT ALL ON public.warehouse_transactions TO authenticated;
REVOKE ALL ON public.materials              FROM anon;
REVOKE ALL ON public.warehouse_transactions FROM anon;

-- Hàm giao dịch kho ở migration 011
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'apply_stock_movement'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.apply_stock_movement(UUID, TEXT, NUMERIC, UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated';
    RAISE NOTICE 'OK: apply_stock_movement tồn tại và đã cấp quyền cho authenticated.';
  ELSE
    RAISE WARNING 'THIẾU hàm apply_stock_movement — hãy chạy migration 011 trước.';
  END IF;
END $$;

-- ─── 4. BẢNG CHẨN ĐOÁN ──────────────────────────────────────────────────────
-- Chụp kết quả truy vấn này gửi lại nếu trang /kho vẫn lỗi.
SELECT
  t.tablename                                   AS bang,
  (SELECT count(*) FROM information_schema.columns c
     WHERE c.table_schema = 'public' AND c.table_name = t.tablename) AS so_cot,
  t.rowsecurity                                 AS rls_bat,
  (SELECT count(*) FROM pg_policies p
     WHERE p.schemaname = 'public' AND p.tablename = t.tablename)    AS so_policy,
  has_table_privilege('authenticated', 'public.' || t.tablename, 'SELECT') AS authenticated_doc_duoc,
  has_table_privilege('anon',          'public.' || t.tablename, 'SELECT') AS anon_doc_duoc
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN ('materials', 'warehouse_transactions', 'orders')
ORDER BY t.tablename;
