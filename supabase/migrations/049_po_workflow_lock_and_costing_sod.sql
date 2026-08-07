-- ============================================================================
-- MONICA ONE — 049 · KHOÁ PO THEO WORKFLOW  +  PHÂN TÁCH TRÁCH NHIỆM DUYỆT GIÁ
--
-- 📐 Board Decision 07/08/2026 — `BUG-4` · *"Khóa theo Workflow"*
-- 📐 Board Directive 08/08/2026 — *MD HANDOVER MODE*
-- 📐 Thay thế phần ④ và ⑥ của bản nháp `supabase/drafts/048_*.INCOMPLETE.sql`
--
-- ⚠️ CHẠY: dán TOÀN BỘ vào Supabase SQL Editor → Run. Chạy nhiều lần được
--    (idempotent). ⛔ KHÔNG xoá dữ liệu. Hỏng bất kỳ phép tự kiểm nào ⇒
--    `RAISE` ⇒ **toàn bộ giao dịch quay lui**, CSDL về đúng trạng thái cũ.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ① IMPACT ANALYSIS  (§8.2 khối ①)
-- ════════════════════════════════════════════════════════════════════════════
-- BẢNG CHẠM
--   orders     — gắn 2 trigger BEFORE UPDATE (⛔ không đổi cột nào)
--   costings   — thay policy UPDATE, thêm 1 policy RESTRICTIVE
--   mos_aggregate_immutability — thêm 1 DÒNG DỮ LIỆU
-- HÀM MỚI
--   mos_po_dang_san_xuat(UUID)      SECURITY DEFINER  ← ghi vào REGISTRY
--   mos_guard_po_content_lock()     trigger, SECURITY INVOKER
--
-- AI MẤT QUYỀN GÌ — ⛔ KHÔNG AI MẤT QUYỀN ĐỌC.
--   · `md` mất quyền sửa NỘI DUNG đơn đã COMPLETED / SHIPPED / CANCELLED
--     ⇒ ĐÚNG ý Board (*"Khóa tuyệt đối"*).
--   · `md` mất quyền sửa NỘI DUNG đơn đã sinh lệnh sản xuất
--     ⇒ ĐÚNG ý Board (*"Chỉ được tạo Request Change"*).
--   · 🔴 `md` mất quyền đặt chiết tính sang `APPROVED`
--     ⇒ ĐÚNG ý Board 06/08 (*"MD trình, MD ⛔ không duyệt"*). Đây là điều
--       khoản SoD hiện **CHỈ SỐNG TRONG MÃ ỨNG DỤNG** — xem §④.
--   · `giamdoc` ĐƯỢC THÊM quyền ghi `costings` — hiện đang bị chặn hoàn toàn,
--     khiến **⛔ không bản chiết tính nào trong hệ thống duyệt được**.
--
-- MÀN HÌNH ĐỔI HÀNH VI: ⛔ KHÔNG màn hình nào phải sửa mã. Tầng ứng dụng đã
--   áp đúng các luật này từ 07–08/08/2026; migration này biến chúng thành
--   **hàng rào thật** (CLAUDE.md §2.1).
--
-- ════════════════════════════════════════════════════════════════════════════
-- ② TÍNH ĐẢO NGƯỢC  (§8.2 khối ② — thay cho `_down.sql`)
-- ════════════════════════════════════════════════════════════════════════════
--   Dòng `orders` trong bảng bất biến ... ĐẢO ĐƯỢC
--       DELETE FROM mos_aggregate_immutability WHERE table_name='orders';
--       DROP TRIGGER mos_immutability_trg ON orders;
--   Trigger khoá theo lệnh sản xuất ..... ĐẢO ĐƯỢC
--       DROP TRIGGER mos_po_content_lock_trg ON orders;
--       DROP FUNCTION mos_guard_po_content_lock(); mos_po_dang_san_xuat(UUID);
--   Policy costings ..................... ĐẢO ĐƯỢC
--       khôi phục `costings_update` với hai vai; DROP policy SoD.
--
--   ⚠️ ĐẢO MỘT PHẦN ở đúng một điểm: các lượt `UPDATE` **đã bị chặn** trong
--      thời gian trigger sống thì ⛔ KHÔNG hoàn lại được — chúng chưa từng xảy
--      ra. Đó là ĐẶC TÍNH của một hàng rào, ⛔ không phải khuyết tật; nhưng
--      phải khai thật.
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- ③ `orders` VÀO ENGINE BẤT BIẾN — MỘT DÒNG DỮ LIỆU
-- ════════════════════════════════════════════════════════════════════════════
-- ⛔ KHÔNG viết engine thứ hai. `045`/`046` đã tự nói: *"Thêm aggregate mới =
-- thêm MỘT DÒNG DỮ LIỆU."* Tệp này làm đúng vậy.
--
-- 🔴 `mutable_after_final` PHẢI CÓ `updated_at` — ĐÂY LÀ CHỖ SUÝT LÀM HỎNG
--    TOÀN BỘ LỆNH SỬA ĐƠN, và nó ⛔ KHÔNG hiển nhiên:
--
--    `002_po_master_schema.sql` dòng 41 gắn
--        CREATE TRIGGER handle_updated_at_orders BEFORE UPDATE ON orders
--          FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
--
--    Postgres chạy các trigger BEFORE cùng sự kiện theo **THỨ TỰ TÊN**:
--        handle_updated_at_orders   <   mos_immutability_trg
--    ⇒ `moddatetime` chạy TRƯỚC và đặt `NEW.updated_at = now()`. Nếu
--    `updated_at` ⛔ không nằm trong danh sách cho-đổi thì guard sẽ thấy **một
--    cột vừa đổi** ở MỌI lượt `UPDATE` ⇒ **mọi lệnh sửa đơn đã đóng đều nổ
--    23514**, kể cả lệnh Re-open hợp lệ của Giám đốc.
--
--    ⚠️ `costings` ⛔ KHÔNG có trigger `moddatetime` (chỉ `001` và `002` gắn,
--    và `015` ⛔ không gắn cho `costings`) — vì thế `045` chạy được mà ⛔ không
--    cần điều này. Chép nguyên khai báo của `costings` sang `orders` là hỏng.
--
-- 🔑 `status` cho đổi để hai đường HỢP LỆ còn sống:
--      · Giám đốc Re-open: COMPLETED → APPROVED
--      · Huỷ đơn (lưu trữ): * → CANCELLED
--    Đúng ranh giới `W.1`: **Workflow Engine** quyết PHÉP CHUYỂN, engine này
--    chỉ giữ BẤT BIẾN NỘI DUNG.
INSERT INTO public.mos_aggregate_immutability
  (table_name, status_column, final_states, mutable_after_final, adr, note)
VALUES
  ('orders', 'status',
   ARRAY['COMPLETED', 'SHIPPED', 'CANCELLED'],
   ARRAY['status', 'updated_at'],
   'ADR-027',
   'Board 07/08/2026 BUG-4 "COMPLETED: Khóa tuyệt đối · SHIPPED: Khóa". '
   'updated_at BẮT BUỘC có mặt: trigger handle_updated_at_orders (moddatetime, '
   'migration 002) chạy TRƯỚC guard theo thứ tự tên, nên nó đổi updated_at ở '
   'mọi UPDATE. Thiếu nó thì Re-open của Giám đốc cũng nổ 23514.')
ON CONFLICT (table_name) DO UPDATE
  SET status_column       = EXCLUDED.status_column,
      final_states        = EXCLUDED.final_states,
      mutable_after_final = EXCLUDED.mutable_after_final,
      adr                 = EXCLUDED.adr,
      note                = EXCLUDED.note,
      updated_at          = NOW();

SELECT public.mos_attach_immutability_guard('orders');


-- ════════════════════════════════════════════════════════════════════════════
-- ④ KHOÁ THEO **WORKFLOW** — *"PO đã sinh Production Order thì phải khóa"*
-- ════════════════════════════════════════════════════════════════════════════
-- 🔴 Engine `045` **⛔ KHÔNG làm được điều này**: nó chỉ so `to_jsonb(OLD)` với
-- `to_jsonb(NEW)` **trong một dòng** và ⛔ không đọc bảng khác. Board nói rõ
-- *"⛔ Không khóa theo Status đơn thuần"* — phép thử nằm ở **bảng hạ nguồn**.

-- ─── Cầu SECURITY DEFINER — quy tắc `K-3` ─────────────────────────────────
-- Trigger chạy `SECURITY INVOKER` ⇒ câu đọc `production_orders` bên trong sẽ
-- chịu RLS của người gọi. Vai ⛔ không đọc được `production_orders` sẽ thấy
-- "⛔ không có lệnh nào" và **đi vòng qua khoá**. Bắc cầu bằng hàm
-- `SECURITY DEFINER` để phép thử luôn nhìn thấy SỰ THẬT.
CREATE OR REPLACE FUNCTION public.mos_po_dang_san_xuat(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
-- ⚠️ `SET search_path` BẮT BUỘC với mọi hàm SECURITY DEFINER: thiếu nó, kẻ tấn
-- công đặt `search_path` riêng rồi dựng một `production_orders` giả trong
-- schema của mình — hàm sẽ đọc bảng giả với quyền chủ sở hữu.
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.production_orders
     WHERE order_id = p_order_id
       AND status IS DISTINCT FROM 'CANCELLED'
  );
$$;

-- 🔴 THU HỒI QUYỀN GỌI TRỰC TIẾP. Hàm nhận THAM SỐ, nên nếu để ngỏ thì ai
-- cũng dò được *"đơn X đã vào sản xuất chưa"* với quyền chủ sở hữu — một kênh
-- rò rỉ nhỏ nhưng ⛔ không cần thiết. Chỉ trigger (chạy dưới quyền chủ sở hữu
-- của bảng) mới cần gọi nó.
REVOKE ALL ON FUNCTION public.mos_po_dang_san_xuat(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mos_po_dang_san_xuat(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.mos_po_dang_san_xuat(UUID) FROM authenticated;

COMMENT ON FUNCTION public.mos_po_dang_san_xuat(UUID) IS
  'ADR-027 / migration 049. Cầu SECURITY DEFINER cho trigger khoá nội dung PO. '
  'Quy tắc K-3: trigger SECURITY INVOKER ⛔ không đọc nổi production_orders dưới '
  'RLS của mọi vai. ĐÃ REVOKE EXECUTE khỏi anon/authenticated — chỉ trigger gọi. '
  'PHẢI có mục trong docs/SECURITY_DEFINER_REGISTRY.md.';

-- ─── Trigger khoá NỘI DUNG ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mos_guard_po_content_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  cu       JSONB;
  moi      JSONB;
  khoa     TEXT;
  vi_pham  TEXT[] := ARRAY[]::TEXT[];
  -- 🔑 `status` CHO ĐỔI — nếu khoá luôn cả nó thì một PO đang chạy sản xuất
  -- **⛔ KHÔNG BAO GIỜ đóng được**, và ta tự tạo một ngõ cụt mới đúng lúc đang
  -- gỡ một ngõ cụt cũ. `updated_at` cho đổi vì `moddatetime` chạy trước.
  duoc_doi TEXT[] := ARRAY['status', 'updated_at'];
BEGIN
  IF TG_OP <> 'UPDATE' THEN RETURN NEW; END IF;
  IF NOT public.mos_po_dang_san_xuat(OLD.id) THEN RETURN NEW; END IF;

  cu := to_jsonb(OLD);
  moi := to_jsonb(NEW);

  FOR khoa IN SELECT jsonb_object_keys(cu) LOOP
    CONTINUE WHEN khoa = ANY (duoc_doi);
    IF (cu -> khoa) IS DISTINCT FROM (moi -> khoa) THEN
      vi_pham := vi_pham || khoa;
    END IF;
  END LOOP;

  IF cardinality(vi_pham) > 0 THEN
    RAISE EXCEPTION
      'Đơn hàng đã sinh LỆNH SẢN XUẤT — ⛔ không sửa trực tiếp nội dung được. '
      'Cột bị đổi: %', array_to_string(vi_pham, ', ')
      USING ERRCODE = '23514',
            HINT = 'Lập YÊU CẦU THAY ĐỔI (change_requests) để chuyền và kế '
                   'hoạch cùng thấy, rồi mới áp dụng.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS mos_po_content_lock_trg ON public.orders;
CREATE TRIGGER mos_po_content_lock_trg
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.mos_guard_po_content_lock();


-- ════════════════════════════════════════════════════════════════════════════
-- ⑤ `costings` — GỠ NGÕ CỤT DUYỆT GIÁ **VÀ** VÁ LỖ HỔNG SoD
-- ════════════════════════════════════════════════════════════════════════════
-- ĐO ĐƯỢC 08/08/2026 bằng ba phiên thật, cùng một bản chiết tính `SUBMITTED`:
--     superadmin → APPROVED   1 dòng   ✅
--     giamdoc    → APPROVED   0 dòng   ⛔ BỊ CHẶN     (lẽ ra ĐƯỢC)
--     md         → APPROVED   1 dòng   ⛔ DUYỆT ĐƯỢC (lẽ ra KHÔNG)
--
-- 🔴 Vế thứ ba NẶNG HƠN: **MD tự duyệt được giá của chính mình** ở tầng CSDL.
--    Điều khoản SoD Board dựng 06/08 hiện chỉ sống trong `kiemQuyen()` — gọi
--    thẳng PostgREST bằng phiên `md` là đi vòng qua nó.

-- ─── 5.1 · Cấp quyền GHI cho `giamdoc` ────────────────────────────────────
-- Chép ĐÚNG khuôn `042` (`mos_narrow_md_table`), chỉ thêm một vai.
-- ⚠️ ⛔ KHÔNG đụng `costing_items`: Giám đốc **DUYỆT** giá, ⛔ không **SỬA**
--    khoản mục — sửa khoản mục là việc của MD, và `046` đã khoá chúng sau duyệt.
DROP POLICY IF EXISTS "costings_update" ON public.costings;
CREATE POLICY "costings_update" ON public.costings
  FOR UPDATE TO authenticated
  USING      (public.mos_current_role() = ANY (ARRAY['superadmin', 'md', 'giamdoc']))
  WITH CHECK (public.mos_current_role() = ANY (ARRAY['superadmin', 'md', 'giamdoc']));

-- ─── 5.2 · 🔴 SoD: chỉ vai DUYỆT mới đặt được `APPROVED` ──────────────────
-- 🔑 `WITH CHECK`, ⛔ KHÔNG `USING`: điều kiện áp lên **DÒNG MỚI**, tức lên
--    *kết quả* của phép chuyển. Dùng `USING` sẽ chặn cả việc MD sửa một bản
--    ⛔ chưa duyệt — tức giết luôn đường trình duyệt bình thường.
--
-- ⚠️ RESTRICTIVE ⇒ **nhân VÀO** điều kiện của `costings_update`, ⛔ không thay
--    nó. Policy `costings_no_edit_after_approve` của `042` vẫn đứng nguyên.
DROP POLICY IF EXISTS "costings_only_director_approves" ON public.costings;
CREATE POLICY "costings_only_director_approves" ON public.costings
  AS RESTRICTIVE FOR UPDATE TO authenticated
  WITH CHECK (
    status <> 'APPROVED'
    OR public.mos_current_role() = ANY (ARRAY['superadmin', 'giamdoc'])
  );

COMMENT ON POLICY "costings_only_director_approves" ON public.costings IS
  'Board 06/08/2026: "MD trình, MD ⛔ không duyệt". Migration 049. '
  'WITH CHECK (⛔ không USING) để MD vẫn sửa/trình được bản chưa duyệt.';


-- ════════════════════════════════════════════════════════════════════════════
-- ⑥ KHỐI TỰ KIỂM  (§8.2 khối ③) — HỎNG LÀ QUAY LUI TOÀN BỘ
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ **PHẠM VI:** khối này đo được **TRIGGER** và **SIÊU DỮ LIỆU**. Nó ⛔ KHÔNG
--    đo được **POLICY**: trong SQL Editor ta chạy dưới quyền chủ sở hữu, ⛔
--    không có JWT, nên `mos_current_role()` ⛔ không phản ánh vai thật và RLS
--    ⛔ không áp lên chủ sở hữu bảng.
--    ⇒ Hành vi policy phải đo bằng **phiên đăng nhập thật** SAU khi chạy —
--    xem lệnh ở cuối tệp. ⛔ KHÔNG kết luận "SoD đã vá" chỉ vì tệp này chạy
--    xong (`V.1`: ⛔ không kết luận trên phép đo chưa thực hiện).
DO $$
DECLARE
  v_style   UUID;
  v_po      UUID;
  v_lsx     UUID;
  v_loi     TEXT;
  v_dem     INT;
BEGIN
  -- ── 6.1 · Siêu dữ liệu ───────────────────────────────────────────────
  SELECT count(*) INTO v_dem FROM public.mos_aggregate_immutability
   WHERE table_name = 'orders'
     AND final_states @> ARRAY['COMPLETED','SHIPPED','CANCELLED']
     AND mutable_after_final @> ARRAY['status','updated_at'];
  IF v_dem <> 1 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.1: khai báo bất biến của `orders` ⛔ không đúng.';
  END IF;

  SELECT count(*) INTO v_dem FROM pg_trigger
   WHERE tgrelid = 'public.orders'::regclass
     AND tgname IN ('mos_immutability_trg','mos_po_content_lock_trg')
     AND NOT tgisinternal;
  IF v_dem <> 2 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.2: thiếu trigger trên `orders` (thấy %/2).', v_dem;
  END IF;

  -- ── 6.3 · DỰNG DỮ LIỆU THẬT rồi thử — dọn ngay trong cùng giao dịch ──
  SELECT id INTO v_style FROM public.styles LIMIT 1;

  INSERT INTO public.orders
    (po_number, style_code, customer_name, total_quantity, delivery_date, status, style_id)
  VALUES
    ('SELFTEST-049-' || substr(md5(random()::text), 1, 8), 'SELFTEST',
     'Tự kiểm 049', 100, CURRENT_DATE + 30, 'DRAFT', v_style)
  RETURNING id INTO v_po;

  -- (a) ⛔ CHƯA có lệnh sản xuất ⇒ sửa nội dung PHẢI ĐƯỢC
  BEGIN
    UPDATE public.orders SET total_quantity = 200 WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.3a: PO ⛔ chưa có lệnh SX mà ⛔ không sửa được — %', SQLERRM;
  END;

  -- (b) CÓ lệnh sản xuất ⇒ sửa nội dung PHẢI BỊ CHẶN
  INSERT INTO public.production_orders (order_no, order_id, planned_qty, status)
  VALUES ('SELFTEST-049-LSX-' || substr(md5(random()::text), 1, 8), v_po, 200, 'PENDING')
  RETURNING id INTO v_lsx;

  v_loi := NULL;
  BEGIN
    UPDATE public.orders SET total_quantity = 999 WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN
    v_loi := SQLERRM;
  END;
  IF v_loi IS NULL THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.3b: PO ĐÃ có lệnh SX mà VẪN sửa được nội dung — '
                    'trigger khoá workflow ⛔ KHÔNG hoạt động.';
  END IF;

  -- (c) 🔑 `status` VẪN phải đổi được, ⛔ không thì PO đang sản xuất ⛔ không
  --     bao giờ đóng được — ta sẽ tạo một ngõ cụt mới.
  BEGIN
    UPDATE public.orders SET status = 'IN_PRODUCTION' WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.3c: ⛔ không đổi được `status` khi đang sản xuất '
                    '⇒ PO ⛔ KHÔNG BAO GIỜ đóng được. Lỗi: %', SQLERRM;
  END;

  -- (d) Lệnh SX huỷ ⇒ khoá phải MỞ ra
  UPDATE public.production_orders SET status = 'CANCELLED' WHERE id = v_lsx;
  BEGIN
    UPDATE public.orders SET total_quantity = 300 WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.3d: huỷ lệnh SX rồi mà PO vẫn khoá — %', SQLERRM;
  END;

  -- (e) COMPLETED ⇒ nội dung KHOÁ TUYỆT ĐỐI, nhưng `status` vẫn đổi được
  UPDATE public.orders SET status = 'COMPLETED' WHERE id = v_po;
  v_loi := NULL;
  BEGIN
    UPDATE public.orders SET total_quantity = 1 WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN
    v_loi := SQLERRM;
  END;
  IF v_loi IS NULL THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.3e: đơn COMPLETED mà VẪN sửa được số lượng.';
  END IF;

  -- (f) 🔴 RE-OPEN của Giám đốc PHẢI còn sống. Đây là phép thử bắt được cái
  --     bẫy `updated_at`/`moddatetime` mô tả ở §③.
  BEGIN
    UPDATE public.orders SET status = 'APPROVED' WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.3f: đơn COMPLETED ⛔ không mở lại được ⇒ Re-open '
                    'của Giám đốc đã chết. Lỗi: %', SQLERRM;
  END;

  -- ── Dọn ─────────────────────────────────────────────────────────────
  DELETE FROM public.production_orders WHERE id = v_lsx;
  DELETE FROM public.order_milestones  WHERE order_id = v_po;
  DELETE FROM public.orders            WHERE id = v_po;

  RAISE NOTICE '✅ TỰ KIỂM 049: 8/8 phép thử trigger ĐẠT.';
END $$;

-- ─── 6.4 · Policy do CHÍNH `049` tạo phải tồn tại ─────────────────────────
--
-- 🔴 SỬA 08/08/2026 — BẢN ĐẦU CỦA PHÉP KIỂM NÀY SAI, VÀ NÓ LÀM MIGRATION
--    QUAY LUI TRÊN CSDL THẬT.
--
-- Bản đầu đòi đủ **BA** tên, trong đó có `costings_no_edit_after_approve`.
-- Đó là **giả định về trạng thái CSDL**, ⛔ không phải điều `049` tạo ra:
--   · `042` Mục 3 tạo policy tên đó
--   · `043` (soạn trên một giả thuyết SAI) đã CHẠY rồi bị **xoá khỏi kho**
--   · `044` tạo lại nó, nhưng chính tệp `044` ghi *"⛔ CHƯA CHẠY"*
-- ⇒ Tên thật trên CSDL đang chạy **⛔ không đoán được từ kho** — đúng điều
--   CLAUDE.md §3 cảnh báo: *"luôn đối chiếu với CSDL đang chạy, ⛔ không tin
--   nội dung file migration hay trí nhớ."* Tôi đã vi phạm chính câu đó.
--
-- 🔑 NAY CHỈ KHẲNG ĐỊNH THỨ `049` CHỊU TRÁCH NHIỆM. Hàng rào cũ được **ĐO và
--    BÁO CÁO**, ⛔ không dùng làm điều kiện đạt/hỏng — một migration ⛔ không
--    được chết vì một tệp khác chưa chạy.
DO $$
DECLARE v_dem INT;
BEGIN
  SELECT count(*) INTO v_dem FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'costings'
     AND policyname IN ('costings_update', 'costings_only_director_approves');
  IF v_dem <> 2 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.4: `049` ⛔ không tạo đủ policy của mình (thấy %/2).', v_dem;
  END IF;
  RAISE NOTICE '✅ TỰ KIỂM 049: 2/2 policy do 049 tạo đã có mặt.';
END $$;

-- ─── 6.5 · ĐO hàng rào "chiết tính ĐÃ DUYỆT ⛔ không sửa được" ────────────
--
-- ⚠️ ĐO và BÁO, ⛔ KHÔNG chặn migration. Đây là hàng rào của `042`/`044`,
--    ⛔ không thuộc phạm vi `049`. Nhưng nếu nó **⛔ không tồn tại** thì
--    chiết tính đã duyệt đang sửa được — một lỗ hổng `Điều 8` (Evidence
--    First) mà Board **phải biết**, ⛔ không được để nó chìm đi.
DO $$
DECLARE
  v_khac INT;
  v_ten  TEXT;
BEGIN
  SELECT count(*), string_agg(policyname, ', ')
    INTO v_khac, v_ten
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'costings'
     AND permissive = 'RESTRICTIVE'
     AND cmd IN ('UPDATE', 'ALL')
     AND policyname <> 'costings_only_director_approves';

  IF v_khac = 0 THEN
    RAISE WARNING '🔴 CẢNH BÁO 6.5 — LỖ HỔNG CÒN MỞ, ⛔ KHÔNG PHẢI DO 049: '
      'costings ⛔ KHÔNG có policy RESTRICTIVE nào chặn sửa bản ĐÃ DUYỆT. '
      'Nghĩa là chiết tính APPROVED hiện SỬA GIÁ ĐƯỢC (Hiến pháp Điều 8). '
      'Nguyên nhân: 043 đã chạy rồi bị xoá khỏi kho; 044 (bản khôi phục) ghi '
      'rõ "CHƯA CHẠY". ⇒ PHẢI chạy 044 sau migration này.';
  ELSE
    RAISE NOTICE '✅ TỰ KIỂM 049 — 6.5: hàng rào "đã duyệt ⛔ không sửa" CÓ (%). ', v_ten;
  END IF;
END $$;

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- ⑦ BÁO CÁO KỲ VỌNG ⟷ THỰC TẾ
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'orders đã vào engine bất biến' AS muc,
       (SELECT count(*)::text FROM public.mos_aggregate_immutability
         WHERE table_name = 'orders') AS thuc_te, '1' AS ky_vong
UNION ALL
SELECT 'trigger trên orders',
       (SELECT count(*)::text FROM pg_trigger
         WHERE tgrelid = 'public.orders'::regclass AND NOT tgisinternal
           AND tgname IN ('mos_immutability_trg','mos_po_content_lock_trg')), '2'
UNION ALL
SELECT 'policy UPDATE costings có giamdoc',
       (SELECT count(*)::text FROM pg_policies
         WHERE schemaname='public' AND tablename='costings'
           AND policyname='costings_update' AND qual ILIKE '%giamdoc%'), '1'
UNION ALL
SELECT 'policy SoD chặn md đặt APPROVED',
       (SELECT count(*)::text FROM pg_policies
         WHERE schemaname='public' AND tablename='costings'
           AND policyname='costings_only_director_approves'), '1'
UNION ALL
SELECT 'mos_po_dang_san_xuat ĐÃ thu hồi quyền gọi của authenticated',
       (SELECT CASE WHEN has_function_privilege('authenticated',
                 'public.mos_po_dang_san_xuat(uuid)', 'EXECUTE')
               THEN 'CÒN' ELSE 'ĐÃ THU HỒI' END), 'ĐÃ THU HỒI'
UNION ALL
-- ⚠️ Dòng này ĐO hiện trạng, ⛔ không phải điều `049` tạo ra. `0` nghĩa là
-- chiết tính ĐÃ DUYỆT hiện sửa giá được ⇒ phải chạy `044`.
SELECT 'hàng rào "chiết tính đã duyệt ⛔ không sửa" (⛔ KHÔNG do 049 tạo)',
       (SELECT count(*)::text FROM pg_policies
         WHERE schemaname='public' AND tablename='costings'
           AND permissive='RESTRICTIVE' AND cmd IN ('UPDATE','ALL')
           AND policyname <> 'costings_only_director_approves'), '≥ 1';

-- 🔎 CHẨN ĐOÁN — in ĐÚNG những policy đang có trên `costings`.
-- CLAUDE.md §3: *"luôn đối chiếu với CSDL đang chạy."* Bản đầu của tệp này
-- ĐOÁN tên policy từ kho và đã quay lui vì thế. Nay in ra để ⛔ không phải đoán.
SELECT policyname   AS ten_policy,
       permissive   AS loai,
       cmd          AS lenh,
       roles::text  AS vai,
       COALESCE(qual, '—')       AS dieu_kien_using,
       COALESCE(with_check, '—') AS dieu_kien_with_check
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'costings'
 ORDER BY permissive DESC, cmd, policyname;

-- ════════════════════════════════════════════════════════════════════════════
-- ⑧ 🔴 SAU KHI CHẠY — BẮT BUỘC ĐO BẰNG PHIÊN THẬT
-- ════════════════════════════════════════════════════════════════════════════
-- Khối tự kiểm ở trên ⛔ KHÔNG đo được policy (xem lý do ở §⑥). Chạy lệnh sau
-- ở máy phát triển để đo bằng ba phiên đăng nhập thật:
--
--     node scripts/kiem-sod-costing.mjs
--
-- KỲ VỌNG:
--     superadmin  SUBMITTED → APPROVED   1 dòng   ✅
--     giamdoc     SUBMITTED → APPROVED   1 dòng   ✅  (trước 049: 0 — ngõ cụt)
--     md          SUBMITTED → APPROVED   0 dòng   ✅  (trước 049: 1 — lỗ SoD)
--     md          DRAFT     → SUBMITTED  1 dòng   ✅  (⛔ không mất quyền trình)
-- ============================================================================
