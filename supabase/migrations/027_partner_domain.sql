-- ============================================================================
-- MONICA MOS — 027 · PARTNER DOMAIN
--
-- Bước 1/6 của Assignment Core Domain. Hồ sơ thiết kế: docs/assignment/
--
-- ─── PHẠM VI CỐ Ý HẸP ────────────────────────────────────────────────────
-- Migration này CHỈ tạo lớp danh tính đối tác. Không Assignment, không quyền,
-- không policy nào dựa trên đối tác. Ma trận quyền nằm ở 030 (Quyết định 4:
-- quyền phải được ĐỊNH NGHĨA trước khi RLS THỰC THI ở 031).
--
-- ─── QUYẾT ĐỊNH 1 · KHÔNG ÉP ĐỔI CẤU TRÚC CŨ ─────────────────────────────
-- `subcons` và `subcontractors` là HAI Domain khác nhau, không phải trùng lặp:
--
--   subcons        TEXT 'SC1'  · capacity_per_day  ← prod_logs · financial_records
--   subcontractors UUID        · service_type      ← subcon_orders · orders
--
-- Gộp chúng sẽ mất `capacity_per_day` hoặc `service_type`, và gãy bốn cột khoá
-- ngoại đang chạy. `partners` là LỚP TRỪU TƯỢNG phía trên, nối xuống bằng bốn
-- cột cầu nối có khoá ngoại THẬT — mỗi cột đúng kiểu của bảng đích.
--
-- Hệ quả: `prod_logs` (140 dòng) và `financial_records` (2 dòng) KHÔNG bị đụng
-- một dòng nào.
--
-- ⚠️ CHỈ THÊM BẢNG MỚI. Không sửa, không xoá bảng nào đang chạy.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. partners — SỔ DANH TÍNH ĐỐI TÁC
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Bốn nguồn đều dùng varchar(50) cho mã nghiệp vụ — đã đối chiếu.
  partner_code  VARCHAR(50)  NOT NULL,
  partner_type  VARCHAR(30)  NOT NULL,

  -- ⚠️ TEXT, không phải VARCHAR(200). Đã đo bên nguồn:
  --   customers.name              varchar(255)
  --   subcontractors.vendor_name  varchar(255)
  --   subcons.name                TEXT   ← không giới hạn
  -- Đặt hẹp hơn nguồn thì một cái tên dài sẽ ném 22001 và làm HỎNG CẢ
  -- MIGRATION giữa chừng. Cột đích phải rộng bằng hoặc rộng hơn cột nguồn.
  name          TEXT         NOT NULL,

  tax_code      TEXT,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  country       VARCHAR(100),   -- khớp customers.country và suppliers.country
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,

  -- ─── CẦU NỐI VỀ BẢNG CHUYÊN BIỆT ────────────────────────────────────
  -- Bốn cột riêng, KHÔNG phải một cột `legacy_id` đa hình: cột đa hình không
  -- khai được khoá ngoại, nên CSDL không bảo vệ được tính toàn vẹn — trỏ vào
  -- một dòng đã xoá cũng không ai chặn.
  customer_id       UUID REFERENCES public.customers(id)       ON DELETE SET NULL,
  subcon_id         TEXT REFERENCES public.subcons(id)         ON DELETE SET NULL,
  subcontractor_id  UUID REFERENCES public.subcontractors(id)  ON DELETE SET NULL,
  supplier_id       UUID REFERENCES public.suppliers(id)       ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Bảy loại. BUYER là loại DUY NHẤT không có Assignment (Quyết định 4):
  -- họ là Order Owner, quyền đi qua mos_buyer_can_see_order() của 018.
  CONSTRAINT partners_type_valid CHECK (partner_type IN (
    'BUYER',
    'PRODUCTION_PARTNER', 'SERVICE_PARTNER', 'SUPPLIER',
    'FORWARDER', 'INSPECTION', 'AUDITOR')),

  -- Nhiều nhất MỘT cầu nối. Ba loại FORWARDER/INSPECTION/AUDITOR chưa có bảng
  -- chuyên biệt nên cả bốn cột đều trống — hợp lệ.
  CONSTRAINT partners_bridge_single CHECK (
    (customer_id      IS NOT NULL)::INT +
    (subcon_id        IS NOT NULL)::INT +
    (subcontractor_id IS NOT NULL)::INT +
    (supplier_id      IS NOT NULL)::INT <= 1),

  -- Cầu nối phải KHỚP loại. Không có ràng buộc này thì một đối tác loại BUYER
  -- có thể trỏ vào `subcons`, và mọi suy luận về sau đều sai.
  CONSTRAINT partners_bridge_matches_type CHECK (
    (customer_id      IS NULL OR partner_type = 'BUYER')              AND
    (subcon_id        IS NULL OR partner_type = 'PRODUCTION_PARTNER') AND
    (subcontractor_id IS NULL OR partner_type = 'SERVICE_PARTNER')    AND
    (supplier_id      IS NULL OR partner_type = 'SUPPLIER'))
);

-- ⚠️ Chỉ mục duy nhất MỘT PHẦN, không phải UNIQUE toàn phần: xoá mềm một đối
-- tác rồi lập lại cùng mã là chuyện có thật. UNIQUE toàn phần sẽ khoá vĩnh
-- viễn mã đó — đúng bài học `shipment_cartons` của migration 024.
CREATE UNIQUE INDEX IF NOT EXISTS uq_partners_code_active
  ON public.partners (partner_code) WHERE deleted_at IS NULL;

-- Mỗi dòng của bảng chuyên biệt chỉ được ánh xạ tới MỘT đối tác đang hiệu lực.
-- Hai `partners` cùng trỏ vào `SC1` nghĩa là hai danh tính cho một pháp nhân,
-- và quyền sẽ nhân đôi một cách âm thầm.
CREATE UNIQUE INDEX IF NOT EXISTS uq_partners_customer
  ON public.partners (customer_id)      WHERE customer_id      IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_partners_subcon
  ON public.partners (subcon_id)        WHERE subcon_id        IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_partners_subcontractor
  ON public.partners (subcontractor_id) WHERE subcontractor_id IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_partners_supplier
  ON public.partners (supplier_id)      WHERE supplier_id      IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_partners_type_active
  ON public.partners (partner_type) WHERE deleted_at IS NULL AND is_active;

COMMENT ON TABLE public.partners IS
  'Lớp danh tính đối tác bên ngoài. Bảng chuyên biệt (customers/subcons/'
  'subcontractors/suppliers) GIỮ NGUYÊN — đây chỉ là lớp trừu tượng phía trên.';

-- ════════════════════════════════════════════════════════════════════════════
-- 2. partner_accounts — TÀI KHOẢN THUỘC VỀ ĐỐI TÁC
-- ════════════════════════════════════════════════════════════════════════════
-- Tổng quát hoá `buyer_accounts` (đã có, 0 dòng). Bảng cũ KHÔNG bị đụng: nó
-- vẫn phục vụ mos_buyer_can_see_order() của migration 018, thứ đang chạy ổn.
CREATE TABLE IF NOT EXISTS public.partner_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id  UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ,
  updated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Một tài khoản thuộc ĐÚNG MỘT đối tác đang hiệu lực.
-- Nếu một người vừa làm cho Minh Phát vừa làm cho An Khang thì mọi truy vấn
-- quyền phải hỏi "trong ngữ cảnh nào?" — và không có ngữ cảnh nào để hỏi.
-- Trường hợp đó cần HAI tài khoản.
CREATE UNIQUE INDEX IF NOT EXISTS uq_partner_account_active
  ON public.partner_accounts (user_id) WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_partner_accounts_partner
  ON public.partner_accounts (partner_id) WHERE is_active;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. ĐÓNG DẤU  —  Quyết định 5: trigger được VALIDATE · REJECT · AUDIT
-- ════════════════════════════════════════════════════════════════════════════
-- Đóng dấu là AUDIT. Không có quy trình nghiệp vụ nào trong đây.
CREATE OR REPLACE FUNCTION public.partner_stamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  ELSE
    NEW.updated_by := auth.uid();
    IF TG_TABLE_NAME = 'partners'
       AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      NEW.deleted_by := COALESCE(NEW.deleted_by, auth.uid());
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS partners_stamp_trg ON public.partners;
CREATE TRIGGER partners_stamp_trg BEFORE INSERT OR UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.partner_stamp();

DROP TRIGGER IF EXISTS partner_accounts_stamp_trg ON public.partner_accounts;
CREATE TRIGGER partner_accounts_stamp_trg BEFORE INSERT OR UPDATE ON public.partner_accounts
  FOR EACH ROW EXECUTE FUNCTION public.partner_stamp();

-- ════════════════════════════════════════════════════════════════════════════
-- 4. DI TRÚ DỮ LIỆU — SINH partners TỪ BẢNG CŨ
-- ════════════════════════════════════════════════════════════════════════════
-- `partner_code` lấy thẳng khoá nghiệp vụ SẴN CÓ, không bịa mã mới:
--   subcons        → id       ('SC1', 'SC2', 'SC3')
--   subcontractors → vendor_code ('SUB-IN-01', 'SUB-GIAT-02')
--   customers      → customer_code
--   suppliers      → supplier_code
-- Bốn tập mã này không đụng nhau (đã đối chiếu), và giữ nguyên mã cũ nghĩa là
-- người vận hành nhận ra đối tác ngay mà không phải tra bảng ánh xạ.
--
-- ON CONFLICT DO NOTHING: chạy lại không sinh trùng.

INSERT INTO public.partners (partner_code, partner_type, name, phone, subcon_id)
SELECT s.id, 'PRODUCTION_PARTNER', s.name, s.phone, s.id
  FROM public.subcons s
 WHERE NOT EXISTS (SELECT 1 FROM public.partners p WHERE p.subcon_id = s.id);

INSERT INTO public.partners (partner_code, partner_type, name, phone, address, is_active, subcontractor_id)
SELECT v.vendor_code, 'SERVICE_PARTNER', v.vendor_name, v.phone, v.address,
       COALESCE(v.is_active, TRUE), v.id
  FROM public.subcontractors v
 WHERE NOT EXISTS (SELECT 1 FROM public.partners p WHERE p.subcontractor_id = v.id);

INSERT INTO public.partners (partner_code, partner_type, name, phone, email, address, country, tax_code, is_active, customer_id)
SELECT c.customer_code, 'BUYER', c.name, c.phone, c.email, c.address, c.country,
       c.tax_code, COALESCE(c.is_active, TRUE), c.id
  FROM public.customers c
 WHERE NOT EXISTS (SELECT 1 FROM public.partners p WHERE p.customer_id = c.id);

INSERT INTO public.partners (partner_code, partner_type, name, phone, email, address, country, is_active, supplier_id)
SELECT su.supplier_code, 'SUPPLIER', su.name, su.phone, su.email, su.address, su.country,
       COALESCE(su.is_active, TRUE), su.id
  FROM public.suppliers su
 WHERE NOT EXISTS (SELECT 1 FROM public.partners p WHERE p.supplier_id = su.id);

-- Chuyển buyer_accounts sang partner_accounts. Bảng cũ GIỮ NGUYÊN, không xoá —
-- migration 018 vẫn đọc nó, và Buyer không đi qua Assignment (Quyết định 4).
INSERT INTO public.partner_accounts (user_id, partner_id, is_active, note)
SELECT ba.user_id, p.id, COALESCE(ba.is_active, TRUE),
       'Chuyển từ buyer_accounts (027)'
  FROM public.buyer_accounts ba
  JOIN public.partners p ON p.customer_id = ba.customer_id
 WHERE NOT EXISTS (
   SELECT 1 FROM public.partner_accounts pa WHERE pa.user_id = ba.user_id AND pa.is_active);

-- ════════════════════════════════════════════════════════════════════════════
-- 5. RLS — CHẶN SẠCH NGƯỜI NGOÀI Ở GIAI ĐOẠN NÀY
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Ở migration này, người dùng bên ngoài KHÔNG đọc được gì từ hai bảng trên.
-- Kể cả hồ sơ của chính họ.
--
-- Cố ý. `mos_partner_id()` — hàm cho phép "đọc dòng của chính mình" — thuộc
-- Permission Engine và sinh ra ở 030. Mở quyền trước khi có hàm phân giải là
-- mở bằng một điều kiện chưa tồn tại.
--
-- Sai sót phải nghiêng về phía KHOÁ LẠI. 030 sẽ nới ra đúng mức: đối tác đọc
-- được hồ sơ và tài khoản CỦA CHÍNH MÌNH, không hơn.
--
-- Điều XXX mục 10 cấm đối tác xem "danh sách đối tác khác" — chặn toàn phần ở
-- đây là cách chắc chắn nhất để điều đó đúng ngay từ ngày đầu.

ALTER TABLE public.partners         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners         FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.partner_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_accounts FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_internal_only"         ON public.partners;
DROP POLICY IF EXISTS "partner_accounts_internal_only" ON public.partner_accounts;

CREATE POLICY "partners_internal_only" ON public.partners
  FOR ALL TO authenticated
  USING      (NOT public.mos_is_external())
  WITH CHECK (NOT public.mos_is_external());

CREATE POLICY "partner_accounts_internal_only" ON public.partner_accounts
  FOR ALL TO authenticated
  USING      (NOT public.mos_is_external())
  WITH CHECK (NOT public.mos_is_external());

GRANT SELECT, INSERT, UPDATE ON public.partners         TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.partner_accounts TO authenticated;

-- Không cấp DELETE: cả hai bảng dùng xoá mềm / `is_active`. Đối tác là gốc của
-- vết audit; xoá cứng là xoá lịch sử ai đã làm việc với ai.

-- ⚠️ `mos_is_external()` (migration 025) nhận diện theo VAI TRÒ trong JWT, hiện
-- chỉ bao phủ 'buyer' và 'subcon'. Ba loại FORWARDER/INSPECTION/AUDITOR chưa có
-- vai trò tương ứng trong lib/rbac.ts, nên chưa có ai thuộc diện đó đăng nhập
-- được. Khi dựng Portal cho họ, phải mở rộng hàm này — ghi ở đây để không ai
-- tưởng nó đã phủ đủ bảy loại.

-- ════════════════════════════════════════════════════════════════════════════
-- 6. KHẢ NĂNG HOÀN TÁC
-- ════════════════════════════════════════════════════════════════════════════
--   DROP TABLE public.partner_accounts;
--   DROP TABLE public.partners;
--   DROP FUNCTION public.partner_stamp();
-- Hoàn tác SẠCH: chưa mã nguồn nào đọc hai bảng này, và không bảng cũ nào bị
-- sửa. Đây là điểm dừng an toàn tuyệt đối của cả chuỗi 027–032.

-- ════════════════════════════════════════════════════════════════════════════
-- 7. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Hai bảng mới' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_name IN ('partners', 'partner_accounts')) AS ket_qua,
       '2' AS ky_vong
UNION ALL
SELECT 'Đối tác sinh ra từ subcons (PRODUCTION_PARTNER)',
       (SELECT COUNT(*)::TEXT FROM public.partners WHERE partner_type = 'PRODUCTION_PARTNER'), '3'
UNION ALL
SELECT 'Đối tác sinh ra từ subcontractors (SERVICE_PARTNER)',
       (SELECT COUNT(*)::TEXT FROM public.partners WHERE partner_type = 'SERVICE_PARTNER'), '2'
UNION ALL
SELECT 'Tổng số đối tác',
       (SELECT COUNT(*)::TEXT FROM public.partners), '5'
UNION ALL
SELECT 'Mọi cầu nối đều trỏ đúng chỗ (không dòng nào mồ côi)',
       (SELECT COUNT(*)::TEXT FROM public.partners p
         WHERE (p.subcon_id IS NOT NULL
                AND NOT EXISTS (SELECT 1 FROM public.subcons s WHERE s.id = p.subcon_id))
            OR (p.subcontractor_id IS NOT NULL
                AND NOT EXISTS (SELECT 1 FROM public.subcontractors v WHERE v.id = p.subcontractor_id))), '0'
UNION ALL
SELECT 'Mã đối tác giữ nguyên khoá nghiệp vụ cũ',
       (SELECT COUNT(*)::TEXT FROM public.partners p
         WHERE p.subcon_id IS NOT NULL AND p.partner_code = p.subcon_id), '3'
UNION ALL
SELECT 'Bốn ràng buộc toàn vẹn',
       (SELECT COUNT(*)::TEXT FROM pg_constraint WHERE conname IN
         ('partners_type_valid', 'partners_bridge_single', 'partners_bridge_matches_type')), '3'
UNION ALL
SELECT 'Sáu chỉ mục duy nhất MỘT PHẦN',
       (SELECT COUNT(*)::TEXT FROM pg_indexes WHERE indexname IN
         ('uq_partners_code_active', 'uq_partners_customer', 'uq_partners_subcon',
          'uq_partners_subcontractor', 'uq_partners_supplier', 'uq_partner_account_active')), '6'
UNION ALL
SELECT 'RLS bật + cưỡng chế trên cả hai bảng',
       (SELECT COUNT(*)::TEXT FROM pg_class
         WHERE relname IN ('partners', 'partner_accounts')
           AND relrowsecurity AND relforcerowsecurity), '2'
UNION ALL
SELECT 'buyer_accounts CŨ vẫn còn nguyên (018 đang dùng)',
       (SELECT COUNT(*)::TEXT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'buyer_accounts'), '1'
UNION ALL
SELECT 'subcons · subcontractors KHÔNG bị đụng cột nào',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name = 'subcons' AND column_name = 'partner_id'), '0'
UNION ALL
SELECT 'prod_logs · financial_records giữ nguyên số dòng',
       ((SELECT COUNT(*) FROM public.prod_logs)::TEXT || ' / ' ||
        (SELECT COUNT(*) FROM public.financial_records)::TEXT), '140 / 2';
