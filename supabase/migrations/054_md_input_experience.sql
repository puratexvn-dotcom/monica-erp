-- ============================================================================
-- MONICA ONE — 054 · HỒ SƠ KHÁCH HÀNG B2B  +  BỎ MẶC ĐỊNH "ĐÃ DUYỆT"
--
-- 📐 Board Directive 08/08/2026 — *FIX MD INPUT EXPERIENCE BEFORE GOLDEN FREEZE*
-- 📐 ADR-027 (ADOPTED 08/08/2026)
--
-- ⚠️ Chạy SAU `053`. Idempotent. ⛔ KHÔNG xoá dữ liệu. Hỏng phép tự kiểm nào
--    ⇒ `RAISE` ⇒ **toàn bộ giao dịch quay lui**.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ① 🔴 LỖ HỔNG NẶNG NHẤT CỦA MIGRATION NÀY: `orders.status DEFAULT 'APPROVED'`
-- ════════════════════════════════════════════════════════════════════════════
-- Board: *"**⛔ Không cho mặc định 'Đã duyệt' khi tạo mới.**"*
--
-- Đo trên CSDL đang chạy — `002_po_master_schema.sql` dòng 17:
--
--     status VARCHAR(50) DEFAULT 'APPROVED'
--
-- 🔴 Nghĩa là **bất kỳ dòng nào chèn vào `orders` mà ⛔ không nêu `status` đều
--    ra đời ở trạng thái ĐÃ DUYỆT** — một chứng từ tự phê duyệt chính nó, ⛔
--    không ai bấm nút, ⛔ không dòng nhật ký nào. Vi phạm thẳng `Hiến pháp
--    Điều 8` *(Evidence First: bằng chứng phê duyệt phải có thật)*.
--
-- ⚠️ Đây ⛔ KHÔNG phải rủi ro lý thuyết. Biểu mẫu đời đầu ở `/orders` có
--    `PO_STATUSES` **⛔ KHÔNG chứa `DRAFT`** và ô Trạng thái mở sẵn *"Đã
--    duyệt"* — đúng thứ Board vừa chụp màn hình.
--
-- 🔑 Đổi `DEFAULT` là **phòng thủ chiều sâu**: kể cả khi một màn hình tương lai
--    quên gửi `status`, đơn vẫn ra đời ở `DRAFT`. Mặc định an toàn phải là mặc
--    định **ít quyền nhất**, ⛔ không phải mặc định tiện nhất.
--
-- ⚠️ ⛔ KHÔNG đụng dòng dữ liệu nào đang có. `DEFAULT` chỉ áp cho dòng MỚI.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ② IMPACT ANALYSIS
-- ════════════════════════════════════════════════════════════════════════════
-- BẢNG CHẠM
--   orders    — đổi DEFAULT của `status`; thêm cột `md_owner_id`
--   customers — thêm 4 cột hồ sơ B2B
-- AI MẤT QUYỀN GÌ — ⛔ KHÔNG AI. Migration này thuần thêm cột + đổi mặc định.
-- MÀN HÌNH ĐỔI HÀNH VI
--   · form tạo PO: trạng thái mặc định `DRAFT`, có thêm bậc `REVIEW`
--   · form khách hàng: thêm 4 ô hồ sơ thương mại B2B
--
-- ⚠️ `REVIEW` **⛔ KHÔNG cần migration**: `orders.status` là `VARCHAR(50)` và
--    **⛔ KHÔNG có ràng buộc `CHECK`** (đã đối chiếu `002` dòng 17). Bậc mới
--    khai ở tầng lược đồ Zod. Nhưng cũng vì thế **CSDL ⛔ không chặn giúp giá
--    trị rác** — `kiemSuaPo()` là hàng rào duy nhất cho cột này.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ③ TÍNH ĐẢO NGƯỢC — ĐẢO ĐƯỢC HOÀN TOÀN
-- ════════════════════════════════════════════════════════════════════════════
--   ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'APPROVED';
--   ALTER TABLE orders DROP COLUMN md_owner_id;
--   ALTER TABLE customers DROP COLUMN product_categories, market,
--                                     credit_term_days, buyer_since;
--   ⚠️ Đảo vế DEFAULT là **mở lại** lỗ hổng Điều 8 — cần lý do nghiệp vụ.
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. `orders` — MẶC ĐỊNH AN TOÀN + NGƯỜI PHỤ TRÁCH
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'DRAFT';

COMMENT ON COLUMN public.orders.status IS
  'Vòng đời PO: DRAFT → REVIEW → APPROVED → IN_PRODUCTION → COMPLETED/SHIPPED. '
  '054: DEFAULT đổi APPROVED ⇒ DRAFT — Board 08/08/2026 "⛔ không cho mặc định '
  'Đã duyệt khi tạo mới". Mặc định an toàn = mặc định ÍT QUYỀN NHẤT. '
  '⚠️ Cột ⛔ KHÔNG có CHECK; hàng rào giá trị nằm ở kiemSuaPo() (lib/mos/md).';

-- 🔑 **MD Owner** — Board nhóm A. Trước `054`, màn hình hiện `created_by` và
--    ghi rõ *"⛔ không cho sửa"*, vì ⛔ không có cột nào để chuyển giao.
--
-- ⚠️ `created_by` ⟷ `md_owner_id` là **HAI câu hỏi khác nhau**, và gộp chúng
--    là mất một câu:
--      created_by  → *"AI ĐÃ LẬP đơn này?"*    — sự thật lịch sử, ⛔ không đổi
--      md_owner_id → *"AI ĐANG PHỤ TRÁCH?"*    — đổi khi bàn giao, nghỉ việc
--    Một MD nghỉ việc thì 200 đơn của họ phải chuyển người theo dõi, nhưng
--    **⛔ không được** đổi lịch sử ai lập.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS md_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.orders.md_owner_id IS
  '054. Merchandiser ĐANG phụ trách đơn — KHÁC `created_by` (ai đã lập, sự '
  'thật lịch sử ⛔ không đổi). Chuyển giao khi bàn giao/nghỉ việc.';

-- Đơn đang có: người phụ trách = người đã lập. ⛔ Không bịa, ⛔ không để NULL
-- rồi hiện "⚪ chưa rõ" cho 100% dữ liệu cũ.
UPDATE public.orders SET md_owner_id = created_by
 WHERE md_owner_id IS NULL AND created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_md_owner ON public.orders (md_owner_id);


-- ════════════════════════════════════════════════════════════════════════════
-- 2. `customers` — HỒ SƠ B2B NGÀNH MAY
-- ════════════════════════════════════════════════════════════════════════════
-- Board: *"Bổ sung chuẩn B2B garment: Buyer information · Commercial profile ·
-- Payment profile · Credit rule · Product category · Market."*
--
-- ⚠️ Bốn nhóm đầu **ĐÃ CÓ** cột: buyer_group · brand · contact_person · phone ·
--    email · currency · incoterm · payment_term · credit_limit.
--    Chỉ **hai nhóm cuối** thiếu cột, cộng hai ô làm *"Credit rule"* thành một
--    quy tắc thật thay vì một con số trần.
ALTER TABLE public.customers
  -- Nhóm hàng khách này đặt — lọc mã hàng, gợi ý chiết tính, xếp năng lực chuyền.
  ADD COLUMN IF NOT EXISTS product_categories TEXT,
  -- Thị trường đích: EU · US · JP … Quyết định tiêu chuẩn kiểm và chứng từ.
  ADD COLUMN IF NOT EXISTS market TEXT,
  -- 🔑 `credit_limit` MỘT MÌNH ⛔ không phải một quy tắc tín dụng. *"Cho nợ 100k"*
  -- ⛔ không nói **bao lâu**. Thiếu số ngày thì kế toán ⛔ không tính nổi tuổi nợ.
  ADD COLUMN IF NOT EXISTS credit_term_days INTEGER,
  -- Khách từ năm nào — dùng cho xếp hạng và ưu tiên khi chuyền quá tải.
  ADD COLUMN IF NOT EXISTS buyer_since DATE;

-- ⚠️ `CHECK` cho phép `0` và `NULL`, y hệt `credit_limit`:
--     0    = cho nợ nhưng phải trả NGAY (COD)
--     NULL = ⛔ chưa khai
--   Board 08/08 đã chốt nguyên tắc này cho `credit_limit`; áp cùng nguyên tắc
--   để hai ô cạnh nhau ⛔ không đọc theo hai luật khác nhau.
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_credit_term_days_check;
ALTER TABLE public.customers
  ADD CONSTRAINT customers_credit_term_days_check
  CHECK (credit_term_days IS NULL OR (credit_term_days >= 0 AND credit_term_days <= 365));

COMMENT ON COLUMN public.customers.credit_term_days IS
  '054. Số ngày cho nợ. 0 = phải trả ngay (COD) · NULL = ⛔ chưa khai. '
  'Đi CẶP với credit_limit: "cho nợ bao nhiêu" + "trong bao lâu" mới thành một '
  'quy tắc tín dụng; chỉ có hạn mức thì kế toán ⛔ không tính nổi tuổi nợ.';
COMMENT ON COLUMN public.customers.product_categories IS
  '054. Nhóm hàng khách này đặt (Áo khoác · Quần · Đồ thể thao…). Ngăn cách '
  'bằng dấu phẩy. Dùng để lọc mã hàng và xếp năng lực chuyền.';
COMMENT ON COLUMN public.customers.market IS
  '054. Thị trường đích (EU · US · JP · KR…). Quyết định tiêu chuẩn kiểm và '
  'bộ chứng từ xuất khẩu.';


-- ════════════════════════════════════════════════════════════════════════════
-- 3. TỰ KIỂM — HỎNG LÀ QUAY LUI TOÀN BỘ
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_def TEXT; v_dem INT; v_po UUID; v_style UUID; v_tt TEXT; v_loi TEXT;
BEGIN
  -- 3.1 🔴 Mặc định PHẢI là DRAFT
  SELECT column_default INTO v_def FROM information_schema.columns
   WHERE table_schema='public' AND table_name='orders' AND column_name='status';
  IF v_def IS NULL OR v_def NOT LIKE '%DRAFT%' THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 3.1: mặc định `orders.status` ⛔ không phải DRAFT (thấy %).', v_def;
  END IF;

  -- 3.2 🔴 ĐO THẬT: chèn một đơn ⛔ KHÔNG nêu status ⇒ phải ra DRAFT
  --     Đây là phép thử duy nhất chứng minh Điều 8 được giữ — đọc
  --     `column_default` chỉ chứng minh *khai báo*, ⛔ không chứng minh *hành vi*.
  SELECT id INTO v_style FROM public.styles LIMIT 1;
  INSERT INTO public.orders (po_number, style_code, customer_name, total_quantity,
                             delivery_date, style_id)
  VALUES ('SELFTEST-054-' || substr(md5(random()::text),1,8), 'ZZ', 'Tự kiểm 054',
          10, CURRENT_DATE + 30, v_style)
  RETURNING id, status INTO v_po, v_tt;
  IF v_tt <> 'DRAFT' THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 3.2: đơn tạo mà ⛔ không nêu status ra "%" — '
      'chứng từ TỰ PHÊ DUYỆT CHÍNH NÓ (Hiến pháp Điều 8).', v_tt;
  END IF;

  -- 3.3 `md_owner_id` nhận được người phụ trách
  UPDATE public.orders SET md_owner_id = (SELECT id FROM public.profiles LIMIT 1)
   WHERE id = v_po;
  SELECT count(*) INTO v_dem FROM public.orders WHERE id = v_po AND md_owner_id IS NOT NULL;
  IF v_dem <> 1 THEN RAISE EXCEPTION '⛔ TỰ KIỂM 3.3: ⛔ không đặt được md_owner_id.'; END IF;

  DELETE FROM public.order_milestones WHERE order_id = v_po;
  DELETE FROM public.orders WHERE id = v_po;

  -- 3.4 Bốn cột khách hàng
  SELECT count(*) INTO v_dem FROM information_schema.columns
   WHERE table_schema='public' AND table_name='customers'
     AND column_name IN ('product_categories','market','credit_term_days','buyer_since');
  IF v_dem <> 4 THEN RAISE EXCEPTION '⛔ TỰ KIỂM 3.4: thiếu cột khách hàng (thấy %/4).', v_dem; END IF;

  -- 3.5 🔴 CẶP K-3 cho `credit_term_days`: 0 và NULL ĐƯỢC, số âm BỊ CHẶN
  UPDATE public.customers SET credit_term_days = 0
   WHERE id = (SELECT id FROM public.customers LIMIT 1);
  UPDATE public.customers SET credit_term_days = NULL
   WHERE id = (SELECT id FROM public.customers LIMIT 1);
  v_loi := NULL;
  BEGIN
    UPDATE public.customers SET credit_term_days = -1
     WHERE id = (SELECT id FROM public.customers LIMIT 1);
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE;
  END;
  IF v_loi IS NULL THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 3.5: số ngày cho nợ ÂM mà ⛔ không bị chặn.';
  END IF;

  -- 3.6 Đơn đang có đều đã có người phụ trách (⛔ không để 100% dữ liệu cũ ⚪)
  SELECT count(*) INTO v_dem FROM public.orders
   WHERE md_owner_id IS NULL AND created_by IS NOT NULL;
  IF v_dem > 0 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 3.6: còn % đơn có người lập mà ⛔ chưa gán phụ trách.', v_dem;
  END IF;

  RAISE NOTICE '✅ TỰ KIỂM 054: 6/6 ĐẠT.';
END $$;

COMMIT;

-- ── BÁO CÁO KỲ VỌNG ⟷ THỰC TẾ ──────────────────────────────────────────────
SELECT 'mặc định orders.status' AS muc,
       (SELECT COALESCE(column_default,'(⛔ không có)') FROM information_schema.columns
         WHERE table_schema='public' AND table_name='orders' AND column_name='status') AS thuc_te,
       'DRAFT' AS ky_vong
UNION ALL
SELECT 'cột hồ sơ B2B mới trên customers',
       (SELECT count(*)::text FROM information_schema.columns
         WHERE table_schema='public' AND table_name='customers'
           AND column_name IN ('product_categories','market','credit_term_days','buyer_since')), '4'
UNION ALL
SELECT 'orders.md_owner_id',
       (SELECT count(*)::text FROM information_schema.columns
         WHERE table_schema='public' AND table_name='orders' AND column_name='md_owner_id'), '1'
UNION ALL
SELECT 'đơn ĐÃ có người phụ trách',
       (SELECT count(*)::text FROM public.orders WHERE md_owner_id IS NOT NULL),
       '= số đơn có created_by';

-- ⚠️ SAU KHI CHẠY:  npm run build && node scripts/uat-md-vong-doi.mjs
-- ============================================================================
