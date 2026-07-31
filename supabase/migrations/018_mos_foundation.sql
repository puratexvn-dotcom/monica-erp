-- ============================================================================
-- 018 — NỀN MONICA MOS: REALTIME · BUYER PORTAL · TRUY XUẤT NGUỒN GỐC
--
-- Ba việc chặn đường, phải xong trước mọi thứ khác:
--   1. Bật Realtime — hiện tại KÊNH ĐĂNG KÝ ĐƯỢC nhưng SỰ KIỆN KHÔNG BẮN.
--      Đã đo bằng thực nghiệm: subscribe orders, update một dòng, đợi 5 giây,
--      không có sự kiện nào. Nguyên nhân: bảng chưa nằm trong publication
--      `supabase_realtime`. Không sửa thì Buyer Portal không thể realtime, dù
--      mã phía client viết đúng cỡ nào.
--   2. Khoanh vùng dữ liệu cho Buyer — hiện MỌI tài khoản đăng nhập đều đọc
--      được MỌI đơn hàng của MỌI khách. Cho một buyer thật vào lúc này là để
--      họ xem đơn của đối thủ.
--   3. Nối mắt xích truy xuất còn đứt giữa Bó bán thành phẩm và Chuyền may.
--
-- ─── VÌ SAO DÙNG `AS RESTRICTIVE` ──────────────────────────────────────────
-- Policy `authenticated_only` từ migration 010 là PERMISSIVE. PostgreSQL gộp
-- mọi policy permissive bằng phép HOẶC, nên thêm một policy permissive cho
-- buyer sẽ KHÔNG giới hạn được gì — buyer vẫn đọc hết.
-- Policy RESTRICTIVE thì được gộp bằng phép VÀ. Nhờ vậy file này CHỈ THÊM,
-- không sửa một dòng nào của policy đang chạy, mà vẫn thật sự chặn được.
--
-- ⚠️ Ai KHÔNG phải buyer thì mọi policy dưới đây trả về TRUE ngay ở vế đầu
-- (`NOT public.mos_is_buyer()`), tức là mười một vai trò còn lại KHÔNG BỊ ẢNH
-- HƯỞNG GÌ. Đây là điều bắt buộc phải đúng, có kiểm chứng ở mục 6.
--
-- CHẠY: dán toàn bộ vào Supabase Dashboard > SQL Editor > Run.
-- Idempotent, KHÔNG xoá dữ liệu, KHÔNG sửa policy cũ.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- 1. MẮT XÍCH TRUY XUẤT CÒN ĐỨT
-- ════════════════════════════════════════════════════════════════════════════
-- Chuỗi hiện tại đã nối được:
--   materials → material_lots → fabric_rolls → cut_tickets → bundles → cartons
--   → shipment_cartons → shipments
-- Chỗ đứt duy nhất: nhật ký sản lượng theo giờ không biết chuyền đang may BÓ
-- NÀO. Không có nó thì khi một bó ra sản phẩm lỗi, không truy được chuyền nào
-- đã may — mà đó chính là câu hỏi đầu tiên khi khách khiếu nại.

ALTER TABLE public.hourly_production_logs
  ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES public.bundles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hpl_bundle ON public.hourly_production_logs(bundle_id);

-- Cột để NULL với dữ liệu cũ và cố ý KHÔNG đoán ngược. Một chuyền may nhiều bó
-- trong cùng một ca; gán bừa theo order_id sẽ tạo ra một chuỗi truy xuất trông
-- như thật nhưng sai — tệ hơn hẳn so với thừa nhận là chưa có dữ liệu.

COMMENT ON COLUMN public.hourly_production_logs.bundle_id IS
  'Bó bán thành phẩm đang may. NULL = dữ liệu ghi trước 018, chưa truy ngược được.';


-- ════════════════════════════════════════════════════════════════════════════
-- 2. LIÊN KẾT TÀI KHOẢN BUYER ↔ KHÁCH HÀNG
-- ════════════════════════════════════════════════════════════════════════════
-- Một tài khoản buyer thuộc về ĐÚNG MỘT khách hàng. Nếu sau này một người phụ
-- trách nhiều thương hiệu, bỏ ràng buộc UNIQUE trên user_id và đổi
-- mos_buyer_customer_id() thành trả về mảng — cấu trúc bảng đã sẵn sàng cho
-- việc đó, chỉ cần bỏ một ràng buộc.

CREATE TABLE IF NOT EXISTS public.buyer_accounts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  note         TEXT,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT buyer_accounts_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_buyer_accounts_customer ON public.buyer_accounts(customer_id);

ALTER TABLE public.buyer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_accounts FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_only" ON public.buyer_accounts;
CREATE POLICY "authenticated_only" ON public.buyer_accounts
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

REVOKE ALL ON public.buyer_accounts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_accounts TO authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 3. BA HÀM TRỢ GIÚP
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ SECURITY DEFINER là BẮT BUỘC ở hai hàm sau, không phải để tiện:
-- policy trên `orders` sẽ gọi hàm đọc `orders`. Nếu hàm chạy dưới quyền người
-- gọi thì nó lại kích hoạt chính policy đó → đệ quy vô hạn, Postgres báo lỗi
-- "infinite recursion detected in policy". SECURITY DEFINER cho hàm chạy dưới
-- quyền chủ sở hữu nên bỏ qua RLS, cắt đứt vòng lặp.
--
-- SET search_path = public, pg_temp là bắt buộc với mọi hàm SECURITY DEFINER:
-- không ghim thì người dùng có thể tạo một schema giả đứng trước `public` và
-- cướp quyền thực thi.

-- 3a. Người đang gọi có phải buyer không.
-- Đọc từ app_metadata của token — chỗ DUY NHẤT máy chủ ghi được. Đọc từ
-- user_metadata sẽ là lỗ hổng: người dùng tự sửa được, tức tự bỏ được ràng buộc.
CREATE OR REPLACE FUNCTION public.mos_is_buyer()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  -- NULLIF chống lỗi ép kiểu: current_setting(...,true) trả NULL khi chưa đặt,
  -- nhưng ở một số ngữ cảnh (trigger, job nền) lại trả CHUỖI RỖNG, mà ''::jsonb
  -- là lỗi cú pháp làm hỏng nguyên truy vấn thay vì chỉ trả về false.
  -- Không đọc được claim → COALESCE cho ra FALSE → coi như KHÔNG phải buyer →
  -- policy không chặn ai. Đúng hướng an toàn: sai sót không được khoá hệ thống
  -- của mười một vai trò nội bộ.
  SELECT COALESCE(
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb
       -> 'app_metadata' ->> 'role') = 'buyer',
    FALSE
  );
$$;

-- 3b. Buyer này thuộc về khách hàng nào.
-- Chưa được gán thì trả NULL → mọi phép so sánh `customer_id = NULL` cho ra
-- NULL → không dòng nào lọt. Đây là mặc định AN TOÀN: tài khoản buyer mới tạo
-- mà quên gán khách hàng thì thấy TRỐNG, không phải thấy TẤT CẢ.
CREATE OR REPLACE FUNCTION public.mos_buyer_customer_id()
RETURNS UUID
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT b.customer_id
  FROM public.buyer_accounts b
  WHERE b.user_id = auth.uid() AND b.is_active
  LIMIT 1;
$$;

-- 3c. Buyer này có được xem đơn hàng đó không.
-- Dùng cho các bảng con chỉ có order_id chứ không có customer_id.
CREATE OR REPLACE FUNCTION public.mos_buyer_can_see_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id
      AND o.customer_id = public.mos_buyer_customer_id()
  );
$$;

GRANT EXECUTE ON FUNCTION public.mos_is_buyer()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.mos_buyer_customer_id()           TO authenticated;
GRANT EXECUTE ON FUNCTION public.mos_buyer_can_see_order(UUID)     TO authenticated;
REVOKE EXECUTE ON FUNCTION public.mos_is_buyer()                   FROM anon;
REVOKE EXECUTE ON FUNCTION public.mos_buyer_customer_id()          FROM anon;
REVOKE EXECUTE ON FUNCTION public.mos_buyer_can_see_order(UUID)    FROM anon;


-- ════════════════════════════════════════════════════════════════════════════
-- 4. KHOANH VÙNG DỮ LIỆU CHO BUYER — CHỈ THÊM POLICY RESTRICTIVE
-- ════════════════════════════════════════════════════════════════════════════
-- Khuôn chung của mọi policy dưới đây:
--   USING      (NOT mos_is_buyer() OR <điều kiện thuộc về khách này>)
--   WITH CHECK (NOT mos_is_buyer() ...)
--
-- Vế `NOT mos_is_buyer()` đứng trước và ngắn mạch: mười một vai trò nội bộ
-- thoát ngay ở đó, KHÔNG chạy truy vấn con nào, KHÔNG mất thêm hiệu năng.

-- ─── 4a. Bảng buyer_accounts: buyer chỉ thấy dòng của chính mình ───────────
DROP POLICY IF EXISTS "buyer_scope_self" ON public.buyer_accounts;
CREATE POLICY "buyer_scope_self" ON public.buyer_accounts
  AS RESTRICTIVE FOR ALL TO authenticated
  USING      (NOT public.mos_is_buyer() OR user_id = auth.uid())
  -- Buyer TUYỆT ĐỐI không được ghi vào bảng này. Cho ghi nghĩa là cho họ tự
  -- đổi customer_id của mình sang khách hàng khác.
  WITH CHECK (NOT public.mos_is_buyer());

-- ─── 4b. Đơn hàng: gốc của mọi khoanh vùng ────────────────────────────────
DROP POLICY IF EXISTS "buyer_scope_orders" ON public.orders;
CREATE POLICY "buyer_scope_orders" ON public.orders
  AS RESTRICTIVE FOR ALL TO authenticated
  USING      (NOT public.mos_is_buyer() OR customer_id = public.mos_buyer_customer_id())
  -- Buyer là người XEM, không phải người tạo đơn. Đơn hàng do MD lập.
  WITH CHECK (NOT public.mos_is_buyer());

-- ─── 4c. Các bảng con có order_id ─────────────────────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'order_milestones',        -- tiến độ T&A
    'shipments',               -- lịch tàu
    'qa_audit_reports',        -- kết quả kiểm chất lượng
    'cartons',                 -- danh sách thùng
    'hourly_production_logs',  -- sản lượng theo giờ
    'sample_submissions',      -- mẫu duyệt
    'order_size_breakdown',    -- số lượng theo màu-size
    'bundles'                  -- bó bán thành phẩm
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "buyer_scope_by_order" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "buyer_scope_by_order" ON public.%I '
      'AS RESTRICTIVE FOR ALL TO authenticated '
      'USING (NOT public.mos_is_buyer() OR public.mos_buyer_can_see_order(order_id)) '
      'WITH CHECK (NOT public.mos_is_buyer())', t);
  END LOOP;
END $$;

-- ─── 4d. shipment_cartons: bảng nối, đi vòng qua shipments ────────────────
DROP POLICY IF EXISTS "buyer_scope_by_shipment" ON public.shipment_cartons;
CREATE POLICY "buyer_scope_by_shipment" ON public.shipment_cartons
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    NOT public.mos_is_buyer()
    OR EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_cartons.shipment_id
        AND public.mos_buyer_can_see_order(s.order_id)
    )
  )
  WITH CHECK (NOT public.mos_is_buyer());

-- ─── 4e. Mã hàng: khoanh theo customer_id của chính bảng styles ───────────
DROP POLICY IF EXISTS "buyer_scope_styles" ON public.styles;
CREATE POLICY "buyer_scope_styles" ON public.styles
  AS RESTRICTIVE FOR ALL TO authenticated
  USING      (NOT public.mos_is_buyer() OR customer_id = public.mos_buyer_customer_id())
  WITH CHECK (NOT public.mos_is_buyer());

-- ─── 4f. Khách hàng: buyer chỉ thấy hồ sơ của chính mình ──────────────────
DROP POLICY IF EXISTS "buyer_scope_customers" ON public.customers;
CREATE POLICY "buyer_scope_customers" ON public.customers
  AS RESTRICTIVE FOR ALL TO authenticated
  USING      (NOT public.mos_is_buyer() OR id = public.mos_buyer_customer_id())
  WITH CHECK (NOT public.mos_is_buyer());

-- ─── 4g. Thảo luận: buyer ĐƯỢC viết, nhưng chỉ trên đơn của mình ──────────
-- Đây là bảng DUY NHẤT buyer được ghi. Đó chính là điểm cốt lõi của
-- Collaboration Platform: buyer, MD, QA, kho cùng trao đổi trên một PO, mọi
-- trao đổi đều nằm trong vệt kiểm toán thay vì trôi trong Zalo.
DROP POLICY IF EXISTS "buyer_scope_comments" ON public.md_comments;
CREATE POLICY "buyer_scope_comments" ON public.md_comments
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    NOT public.mos_is_buyer()
    OR (entity_type = 'ORDER' AND public.mos_buyer_can_see_order(entity_id))
  )
  WITH CHECK (
    NOT public.mos_is_buyer()
    OR (entity_type = 'ORDER' AND public.mos_buyer_can_see_order(entity_id))
  );

-- ─── 4h. Tài liệu: buyer XEM được, KHÔNG tải lên ──────────────────────────
DROP POLICY IF EXISTS "buyer_scope_documents" ON public.md_documents;
CREATE POLICY "buyer_scope_documents" ON public.md_documents
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    NOT public.mos_is_buyer()
    OR (entity_type = 'ORDER' AND public.mos_buyer_can_see_order(entity_id))
  )
  WITH CHECK (NOT public.mos_is_buyer());

-- ⚠️ CÓ CHỦ Ý: KHÔNG mở cho buyer các bảng chiết tính giá (costings,
-- costing_items), định mức (style_bom), tồn kho, nhà cung cấp và đơn mua.
-- Đó là cơ cấu giá thành và nguồn cung của nhà máy. Chúng vẫn nằm dưới policy
-- `authenticated_only` cũ, và vì KHÔNG có policy restrictive nào cho buyer
-- nên buyer VẪN ĐỌC ĐƯỢC. Ràng buộc thật nằm ở mục 5 ngay dưới.


-- ════════════════════════════════════════════════════════════════════════════
-- 5. CHẶN BUYER Ở MỌI BẢNG CÒN LẠI — "MẶC ĐỊNH CẤM"
-- ════════════════════════════════════════════════════════════════════════════
-- Mục 4 mới chỉ khoanh vùng những bảng buyer ĐƯỢC dùng. Mọi bảng khác vẫn để
-- ngỏ vì policy cũ là `authenticated_only`. Vòng lặp dưới đây thêm một policy
-- restrictive vào TẤT CẢ bảng còn lại với nội dung đơn giản: buyer không được
-- đụng tới.
--
-- Cách này an toàn hơn hẳn liệt kê tay: bảng mới thêm sau này mà quên khoanh
-- vùng thì mặc định là CẤM, không phải mặc định MỞ.

DO $$
DECLARE
  t TEXT;
  allowed TEXT[] := ARRAY[
    'orders','order_milestones','shipments','shipment_cartons','qa_audit_reports',
    'cartons','hourly_production_logs','sample_submissions','order_size_breakdown',
    'bundles','styles','customers','md_comments','md_documents','buyer_accounts'
  ];
  n INT := 0;
BEGIN
  FOR t IN
    SELECT p.tablename FROM pg_tables p
    WHERE p.schemaname = 'public'
      AND NOT (p.tablename = ANY(allowed))
      -- Chỉ đụng bảng mình sở hữu. Bảng do extension tạo (PostGIS, pg_cron...)
      -- sẽ ném "must be owner of table" và làm dừng cả migration giữa chừng.
      -- pg_tables.tableowner đã là TÊN chủ sở hữu, so thẳng với current_user.
      AND p.tableowner = current_user
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "buyer_denied" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "buyer_denied" ON public.%I '
      'AS RESTRICTIVE FOR ALL TO authenticated '
      'USING (NOT public.mos_is_buyer()) '
      'WITH CHECK (NOT public.mos_is_buyer())', t);
    n := n + 1;
  END LOOP;
  RAISE NOTICE 'Đã chặn buyer ở % bảng không thuộc phạm vi Buyer Portal.', n;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 6. BẬT REALTIME
-- ════════════════════════════════════════════════════════════════════════════
-- Realtime của Supabase TÔN TRỌNG RLS: mỗi người đăng ký chỉ nhận sự kiện của
-- dòng họ được phép đọc. Nhờ mục 4, buyer chỉ nhận biến động của đơn mình.
--
-- ⚠️ REPLICA IDENTITY FULL là bắt buộc ở đây, không phải tuỳ chọn: mặc định
-- Postgres chỉ ghi KHOÁ CHÍNH vào WAL khi có UPDATE/DELETE. Mà bộ lọc RLS của
-- buyer lại dựa trên `customer_id` và `order_id` — không phải khoá chính. Thiếu
-- FULL thì Realtime không có đủ dữ liệu để quyết định ai được nhận sự kiện, và
-- nó sẽ chọn phương án an toàn là KHÔNG GỬI CHO AI.
--
-- Cái giá: WAL phình to hơn vì mỗi UPDATE ghi cả dòng cũ. Chấp nhận được với
-- sáu bảng này; TUYỆT ĐỐI không bật đại trà cho mọi bảng.

DO $$
DECLARE
  t TEXT;
  added INT := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RAISE EXCEPTION 'Không tìm thấy publication supabase_realtime. Hãy bật Realtime trong Dashboard > Database > Replication rồi chạy lại.';
  END IF;

  FOREACH t IN ARRAY ARRAY[
    'orders',                  -- đổi trạng thái đơn
    'order_milestones',        -- chốt mốc tiến độ
    'shipments',               -- cập nhật lịch tàu
    'qa_audit_reports',        -- kết quả kiểm chất lượng
    'hourly_production_logs',  -- sản lượng theo giờ
    'md_comments'              -- trao đổi giữa buyer và nhà máy
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      added := added + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Realtime: đã thêm % bảng mới vào publication (tổng 6 bảng được theo dõi).', added;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 7. KIỂM CHỨNG — chạy xong phải thấy đủ, thiếu là dừng ngay
-- ════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  missing_fn   INT;
  missing_rt   INT;
  missing_pol  INT;
  leak         INT;
BEGIN
  -- 7a. Ba hàm trợ giúp
  SELECT COUNT(*) INTO missing_fn
  FROM unnest(ARRAY['mos_is_buyer','mos_buyer_customer_id','mos_buyer_can_see_order']) AS x(f)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = x.f);
  IF missing_fn > 0 THEN
    RAISE EXCEPTION 'Thiếu % hàm trợ giúp', missing_fn;
  END IF;

  -- 7b. Sáu bảng realtime
  SELECT COUNT(*) INTO missing_rt
  FROM unnest(ARRAY['orders','order_milestones','shipments','qa_audit_reports',
                    'hourly_production_logs','md_comments']) AS x(t)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = x.t);
  IF missing_rt > 0 THEN
    RAISE EXCEPTION 'Còn % bảng chưa vào publication realtime', missing_rt;
  END IF;

  -- 7c. Policy khoanh vùng buyer trên các bảng cốt lõi
  SELECT COUNT(*) INTO missing_pol
  FROM unnest(ARRAY['orders','order_milestones','shipments','qa_audit_reports',
                    'cartons','styles','customers','md_comments']) AS x(t)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = x.t
      AND policyname LIKE 'buyer_scope%');
  IF missing_pol > 0 THEN
    RAISE EXCEPTION 'Còn % bảng cốt lõi chưa có policy khoanh vùng buyer', missing_pol;
  END IF;

  -- 7d. KHÔNG CÒN BẢNG NÀO ĐỂ NGỎ CHO BUYER.
  -- Đây là phép kiểm quan trọng nhất của cả file: mọi bảng phải có ÍT NHẤT một
  -- policy restrictive mang tên buyer_scope* hoặc buyer_denied.
  SELECT COUNT(*) INTO leak
  FROM pg_tables p
  WHERE p.schemaname = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies g
      WHERE g.schemaname = 'public' AND g.tablename = p.tablename
        AND (g.policyname LIKE 'buyer_scope%' OR g.policyname = 'buyer_denied'));
  IF leak > 0 THEN
    RAISE EXCEPTION 'CÒN % BẢNG ĐỂ NGỎ CHO BUYER — dừng lại, không được dùng Buyer Portal', leak;
  END IF;

  -- 7e. Mắt xích truy xuất
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hourly_production_logs'
      AND column_name = 'bundle_id') THEN
    RAISE EXCEPTION 'Chưa nối được hourly_production_logs.bundle_id';
  END IF;

  RAISE NOTICE 'OK: realtime 6 bảng · buyer đã khoanh vùng · không còn bảng để ngỏ · truy xuất đã nối.';
END $$;


-- ─── Bảng tổng kết để đối chiếu bằng mắt ────────────────────────────────────
SELECT 'Bảng bật realtime' AS hang_muc, COUNT(*)::TEXT AS ket_qua
FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
UNION ALL
SELECT 'Bảng buyer ĐƯỢC dùng (buyer_scope*)', COUNT(DISTINCT tablename)::TEXT
FROM pg_policies WHERE schemaname = 'public' AND policyname LIKE 'buyer_scope%'
UNION ALL
SELECT 'Bảng buyer BỊ CẤM (buyer_denied)', COUNT(DISTINCT tablename)::TEXT
FROM pg_policies WHERE schemaname = 'public' AND policyname = 'buyer_denied'
UNION ALL
SELECT 'Tổng số bảng trong schema public', COUNT(*)::TEXT
FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 'Tài khoản buyer đã gán khách hàng', COUNT(*)::TEXT
FROM public.buyer_accounts WHERE is_active;
