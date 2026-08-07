-- ============================================================================
-- MONICA ONE — 050 · VÁ GẤP: `049` LÀM MỌI LỆNH SỬA ĐƠN HÀNG ĐỔ `42501`
--
-- 🔴 **CHẠY NGAY.** Sau `049`, vai `md` ⛔ KHÔNG sửa được BẤT KỲ đơn hàng nào.
--    Đây là lỗi của `049`, ⛔ không phải của dữ liệu.
--
-- ─── TRIỆU CHỨNG, ĐO ĐƯỢC BẰNG PHIÊN md001 THẬT ─────────────────────────
--     UPDATE orders SET total_quantity = … (PO ⛔ chưa có lệnh sản xuất)
--       →  42501  permission denied for function mos_po_dang_san_xuat
--   Hỏng **11 phép thử** trong UAT vòng đời, gồm cả Re-open của Giám đốc.
--
-- ─── NGUYÊN NHÂN — MỘT GIẢ ĐỊNH SAI VỀ `SECURITY INVOKER` ───────────────
-- `049` dựng HAI hàm:
--     mos_po_dang_san_xuat(UUID)     SECURITY DEFINER   ← đã REVOKE EXECUTE
--     mos_guard_po_content_lock()    trigger, **SECURITY INVOKER** (mặc định)
--
-- Tôi thu hồi `EXECUTE` của `authenticated` trên hàm thứ nhất, với lý lẽ
-- *"chỉ trigger gọi nó"*. 🔴 **Lý lẽ ấy SAI.** Hàm trigger `SECURITY INVOKER`
-- chạy **dưới quyền NGƯỜI GỌI**, ⛔ không phải dưới quyền chủ sở hữu bảng.
-- Nên khi `md` sửa một đơn, chính `md` là người gọi
-- `mos_po_dang_san_xuat()` — và `md` vừa bị tôi thu hồi quyền gọi.
--
-- 🔑 Thu hồi quyền là ĐÚNG. Chỗ sai là **để hàm cần quyền ấy nằm trên đường
--    chạy của người dùng thường**.
--
-- ─── CÁCH SỬA — MỘT HÀM, ⛔ KHÔNG PHẢI HAI ──────────────────────────────
-- Gộp phép thử vào **chính hàm trigger**, và cho nó `SECURITY DEFINER`.
--
-- ✅ Vì sao an toàn hơn hẳn bản `049`:
--   · Hàm trả `trigger` **⛔ KHÔNG gọi trực tiếp được** — Postgres cấm gọi hàm
--     kiểu `trigger` ngoài ngữ cảnh trigger. Nó ⛔ không phải bề mặt phơi ra,
--     nên ⛔ không cần `REVOKE`, và ⛔ không có kênh dò nào như hàm có tham số.
--   · Bớt được **một** hàm `SECURITY DEFINER` khỏi sổ đăng ký. Mỗi hàm như vậy
--     là một lỗ khoét xuyên RLS — ít hơn một là tốt hơn một.
--   · `SECURITY DEFINER` ở đây là **bắt buộc**, đúng quy tắc `K-3`: câu đọc
--     `production_orders` phải nhìn thấy SỰ THẬT, ⛔ không chịu RLS của người
--     gọi. Vai ⛔ không đọc được bảng đó mà chạy `INVOKER` sẽ thấy *"⛔ không
--     có lệnh nào"* và **đi vòng qua khoá**.
--
-- ⚠️ `SET search_path` VẪN bắt buộc: thiếu nó, kẻ tấn công đặt `search_path`
--    riêng rồi dựng `production_orders` giả — hàm đọc bảng giả với quyền chủ.
--
-- ─── TÍNH ĐẢO NGƯỢC ─────────────────────────────────────────────────────
--   ĐẢO ĐƯỢC hoàn toàn: `DROP TRIGGER mos_po_content_lock_trg ON orders;`
--   `DROP FUNCTION mos_guard_po_content_lock();`
--   ⇒ về đúng trạng thái trước `049` §④.
-- ============================================================================

BEGIN;

-- ⚠️ Gỡ trigger TRƯỚC khi thay hàm: `CREATE OR REPLACE` đổi được thân hàm
-- nhưng ⛔ không đổi được thuộc tính `SECURITY DEFINER` một cách chắc chắn
-- trên mọi phiên bản. Xoá hẳn rồi dựng lại là đường ⛔ không mơ hồ.
DROP TRIGGER IF EXISTS mos_po_content_lock_trg ON public.orders;
DROP FUNCTION IF EXISTS public.mos_guard_po_content_lock();

-- 🔴 Hàm cầu của `049` ⛔ KHÔNG còn cần nữa — phép thử đã nằm trong trigger.
-- Bớt một hàm SECURITY DEFINER khỏi hệ thống.
DROP FUNCTION IF EXISTS public.mos_po_dang_san_xuat(UUID);

CREATE FUNCTION public.mos_guard_po_content_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
-- 🔑 SECURITY DEFINER — xem lý lẽ ở khối chú thích đầu tệp (quy tắc K-3).
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  dang_sx  BOOLEAN;
  cu       JSONB;
  moi      JSONB;
  khoa     TEXT;
  vi_pham  TEXT[] := ARRAY[]::TEXT[];
  -- 🔑 `status` CHO ĐỔI — khoá luôn cả nó thì PO đang chạy sản xuất **⛔ KHÔNG
  -- BAO GIỜ đóng được**, ta tự tạo ngõ cụt mới. `updated_at` cho đổi vì
  -- `handle_updated_at_orders` (moddatetime, migration 002) chạy TRƯỚC guard
  -- theo thứ tự tên trigger và luôn đổi nó.
  duoc_doi TEXT[] := ARRAY['status', 'updated_at'];
BEGIN
  IF TG_OP <> 'UPDATE' THEN RETURN NEW; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.production_orders
     WHERE order_id = OLD.id
       AND status IS DISTINCT FROM 'CANCELLED'
  ) INTO dang_sx;

  IF NOT dang_sx THEN RETURN NEW; END IF;

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

COMMENT ON FUNCTION public.mos_guard_po_content_lock() IS
  'ADR-027 / migration 049+050. Khoá NỘI DUNG đơn hàng đã sinh lệnh sản xuất. '
  'SECURITY DEFINER vì quy tắc K-3: phép thử phải nhìn thấy production_orders '
  'bất kể RLS của người gọi. ⛔ KHÔNG cần REVOKE: hàm trả `trigger` nên '
  'Postgres cấm gọi trực tiếp — ⛔ không phải bề mặt phơi ra. '
  '⚠️ 050 thay 049: bản 049 tách thành hàm cầu CÓ THAM SỐ rồi REVOKE EXECUTE, '
  'nhưng trigger SECURITY INVOKER chạy dưới quyền NGƯỜI GỌI ⇒ mọi lệnh sửa đơn '
  'của vai md đổ 42501.';

CREATE TRIGGER mos_po_content_lock_trg
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.mos_guard_po_content_lock();


-- ════════════════════════════════════════════════════════════════════════════
-- KHỐI TỰ KIỂM — DỰNG DỮ LIỆU THẬT, THỬ, DỌN. HỎNG ⇒ QUAY LUI TOÀN BỘ.
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_style UUID; v_po UUID; v_lsx UUID; v_loi TEXT;
BEGIN
  SELECT id INTO v_style FROM public.styles LIMIT 1;

  INSERT INTO public.orders
    (po_number, style_code, customer_name, total_quantity, delivery_date, status, style_id)
  VALUES ('SELFTEST-050-' || substr(md5(random()::text), 1, 8), 'SELFTEST',
          'Tự kiểm 050', 100, CURRENT_DATE + 30, 'DRAFT', v_style)
  RETURNING id INTO v_po;

  -- (a) ⛔ Chưa có lệnh SX ⇒ sửa PHẢI ĐƯỢC. Đây đúng là phép thử `049` làm hỏng.
  BEGIN
    UPDATE public.orders SET total_quantity = 200 WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 050-a: PO ⛔ chưa có lệnh SX mà ⛔ không sửa được — %', SQLERRM;
  END;

  -- (b) CÓ lệnh SX ⇒ sửa nội dung PHẢI BỊ CHẶN, và phải là 23514 (⛔ không 42501)
  INSERT INTO public.production_orders (order_no, order_id, planned_qty, status)
  VALUES ('SELFTEST-050-LSX-' || substr(md5(random()::text), 1, 8), v_po, 200, 'PENDING')
  RETURNING id INTO v_lsx;

  v_loi := NULL;
  BEGIN
    UPDATE public.orders SET total_quantity = 999 WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN
    v_loi := SQLSTATE || ' ' || SQLERRM;
  END;
  IF v_loi IS NULL THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 050-b: PO ĐÃ có lệnh SX mà VẪN sửa được nội dung.';
  END IF;
  IF v_loi NOT LIKE '23514%' THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 050-b: chặn SAI MÃ — chờ 23514, nhận "%". '
      '42501 nghĩa là lỗi phân quyền vẫn còn.', v_loi;
  END IF;

  -- (c) `status` vẫn đổi được ⇒ PO đang sản xuất vẫn đóng được
  BEGIN
    UPDATE public.orders SET status = 'IN_PRODUCTION' WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 050-c: ⛔ không đổi được status khi đang SX — %', SQLERRM;
  END;

  -- (d) Huỷ lệnh SX ⇒ khoá mở ra
  UPDATE public.production_orders SET status = 'CANCELLED' WHERE id = v_lsx;
  BEGIN
    UPDATE public.orders SET total_quantity = 300 WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 050-d: huỷ lệnh SX rồi mà PO vẫn khoá — %', SQLERRM;
  END;

  -- (e) COMPLETED ⇒ nội dung khoá, nhưng Re-open còn sống
  UPDATE public.orders SET status = 'COMPLETED' WHERE id = v_po;
  v_loi := NULL;
  BEGIN
    UPDATE public.orders SET total_quantity = 1 WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE;
  END;
  IF v_loi IS NULL THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 050-e: đơn COMPLETED mà VẪN sửa được số lượng.';
  END IF;
  BEGIN
    UPDATE public.orders SET status = 'APPROVED' WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 050-e: Re-open của Giám đốc đã chết — %', SQLERRM;
  END;

  DELETE FROM public.production_orders WHERE id = v_lsx;
  DELETE FROM public.order_milestones  WHERE order_id = v_po;
  DELETE FROM public.orders            WHERE id = v_po;

  RAISE NOTICE '✅ TỰ KIỂM 050: 5/5 ĐẠT — 42501 đã hết, khoá workflow vẫn đúng.';
END $$;

-- Hàm cầu của 049 phải BIẾN MẤT.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mos_po_dang_san_xuat') THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 050: `mos_po_dang_san_xuat` vẫn còn — chưa gỡ được.';
  END IF;
  RAISE NOTICE '✅ TỰ KIỂM 050: hàm cầu SECURITY DEFINER của 049 đã gỡ.';
END $$;

COMMIT;

-- ── BÁO CÁO KỲ VỌNG ⟷ THỰC TẾ ──────────────────────────────────────────────
SELECT 'trigger khoá nội dung PO' AS muc,
       (SELECT count(*)::text FROM pg_trigger
         WHERE tgrelid = 'public.orders'::regclass AND NOT tgisinternal
           AND tgname = 'mos_po_content_lock_trg') AS thuc_te, '1' AS ky_vong
UNION ALL
SELECT 'hàm guard nay là SECURITY DEFINER',
       (SELECT CASE WHEN prosecdef THEN 'CÓ' ELSE 'KHÔNG' END FROM pg_proc
         WHERE proname = 'mos_guard_po_content_lock'), 'CÓ'
UNION ALL
SELECT 'hàm cầu mos_po_dang_san_xuat đã gỡ',
       (SELECT CASE WHEN count(*) = 0 THEN 'ĐÃ GỠ' ELSE 'CÒN' END
          FROM pg_proc WHERE proname = 'mos_po_dang_san_xuat'), 'ĐÃ GỠ';

-- ⚠️ SAU KHI CHẠY, ĐO LẠI BẰNG PHIÊN THẬT:
--     node scripts/uat-md-vong-doi.mjs      → chờ 61 đạt · 0 hỏng
--     node scripts/kiem-sod-costing.mjs     → chờ  9 đạt · 0 hỏng
-- ============================================================================
