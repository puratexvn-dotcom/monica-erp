-- ============================================================================
-- MONICA GARMENT ERP — 014: BẢNG CHO PHÂN HỆ MERCHANDISER
--
-- Khảo sát trước khi viết (dò trực tiếp bằng service key):
--   Khách hàng        -> KHÔNG có bảng nào (orders.customer_name chỉ là text)
--   Đề nghị mua NPL   -> KHÔNG có bảng nào
--   Lệnh sản xuất     -> KHÔNG có (cut_tickets là phiếu bàn cắt, khác hẳn)
--   PO                -> đã có `orders`
--   Lệnh giao hàng    -> đã có `shipments`
-- File này tạo 3 bảng còn thiếu và bổ sung cột chứng từ cho 2 bảng đã có.
--
-- CHẠY: dán toàn bộ vào Supabase Dashboard > SQL Editor > Run.
-- Chạy được nhiều lần (idempotent), KHÔNG xoá dữ liệu.
-- ============================================================================

-- ─── 1. KHÁCH HÀNG ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_code  VARCHAR(50)  UNIQUE NOT NULL,
  name           VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone          VARCHAR(50),
  email          VARCHAR(255),
  country        VARCHAR(100),
  address        TEXT,
  notes          TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Nối PO với khách hàng. Giữ NGUYÊN cột customer_name cũ thay vì bỏ đi:
-- 2 PO đang có chỉ lưu tên dạng text, xoá cột là mất dữ liệu. Cột mới để
-- NULL được, PO mới thì điền cả hai.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- ─── 2. ĐỀ NGHỊ MUA NGUYÊN PHỤ LIỆU ─────────────────────────────────────────
-- Thiết kế MỘT DÒNG một đề nghị (mỗi mã NPL một phiếu), không làm header+lines.
-- Lý do: mẫu header+lines cần thêm bảng con và form động thêm/bớt dòng — nhiều
-- gấp đôi công mà nghiệp vụ hiện tại chưa cần. Khi cần gộp nhiều mã vào một
-- phiếu, thêm bảng material_request_items và chuyển các cột NPL xuống đó.
CREATE TABLE IF NOT EXISTS public.material_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_no    VARCHAR(100) UNIQUE NOT NULL,
  order_id      UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  material_name VARCHAR(255) NOT NULL,
  category      VARCHAR(50)  NOT NULL,
  quantity      NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  unit          VARCHAR(20)  NOT NULL,
  needed_date   DATE,
  status        VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
                CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'REJECTED')),
  notes         TEXT,
  -- Đường dẫn trong bucket `evidences`, KHÔNG lưu URL đầy đủ: nếu sau này đổi
  -- bucket sang private thì URL công khai chết hết, còn path vẫn dùng được để
  -- phát Signed URL.
  evidence_path TEXT,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. LỆNH SẢN XUẤT ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.production_orders (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_no      VARCHAR(100) UNIQUE NOT NULL,
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  planned_qty   INTEGER NOT NULL CHECK (planned_qty > 0),
  start_date    DATE,
  due_date      DATE,
  status        VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  notes         TEXT,
  evidence_path TEXT,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Ngày tới hạn không được trước ngày bắt đầu. Đặt ràng buộc ở tầng dữ liệu vì
-- lệnh sản xuất có thể được tạo từ nhiều nơi, không chỉ từ form web.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_orders_date_order') THEN
    ALTER TABLE public.production_orders
      ADD CONSTRAINT production_orders_date_order
      CHECK (start_date IS NULL OR due_date IS NULL OR due_date >= start_date);
  END IF;
END $$;

-- ─── 4. CỘT CHỨNG TỪ CHO BẢNG ĐÃ CÓ ────────────────────────────────────────
ALTER TABLE public.orders    ADD COLUMN IF NOT EXISTS evidence_path TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS evidence_path TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS notes         TEXT;

-- ─── 5. CHỈ MỤC CHO TRUY VẤN NÓNG ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_active       ON public.customers (is_active, customer_code);
CREATE INDEX IF NOT EXISTS idx_mat_req_status         ON public.material_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mat_req_order          ON public.material_requests (order_id);
CREATE INDEX IF NOT EXISTS idx_prod_orders_status     ON public.production_orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prod_orders_order      ON public.production_orders (order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer        ON public.orders (customer_id);

-- ─── 6. RLS: CHỈ authenticated (khớp migration 010) ─────────────────────────
DO $$
DECLARE
  t   TEXT;
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers', 'material_requests', 'production_orders']
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "authenticated_only" ON public.%I FOR ALL TO authenticated '
      'USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t
    );

    -- RLS chỉ lọc dòng; thiếu GRANT là bị chặn từ ngoài với lỗi
    -- "permission denied" chứ không phải "không có dòng nào".
    EXECUTE format('GRANT ALL ON public.%I TO authenticated', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- ─── 7. TỰ CẬP NHẬT updated_at ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers', 'material_requests', 'production_orders']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%s ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_touch_%s BEFORE UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t
    );
  END LOOP;
END $$;

-- ─── 8. TỰ KIỂM TRA ─────────────────────────────────────────────────────────
DO $$
DECLARE missing TEXT := '';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='customers')
    THEN missing := missing || 'customers '; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='material_requests')
    THEN missing := missing || 'material_requests '; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='production_orders')
    THEN missing := missing || 'production_orders '; END IF;

  IF missing <> '' THEN
    RAISE EXCEPTION 'Chưa tạo được bảng: %', missing;
  END IF;

  RAISE NOTICE 'OK: đã có customers, material_requests, production_orders.';
END $$;

-- Bảng chẩn đoán — chụp lại gửi nếu UI vẫn báo lỗi đọc dữ liệu
SELECT
  t.tablename AS bang,
  t.rowsecurity AS rls_bat,
  (SELECT count(*) FROM pg_policies p
     WHERE p.schemaname='public' AND p.tablename=t.tablename) AS so_policy,
  has_table_privilege('authenticated', 'public.'||t.tablename, 'SELECT') AS auth_doc_duoc,
  has_table_privilege('anon',          'public.'||t.tablename, 'SELECT') AS anon_doc_duoc
FROM pg_tables t
WHERE t.schemaname='public'
  AND t.tablename IN ('customers','material_requests','production_orders','orders','shipments')
ORDER BY t.tablename;
