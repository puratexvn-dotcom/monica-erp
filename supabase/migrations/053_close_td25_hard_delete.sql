-- ============================================================================
-- MONICA ONE — 053 · ĐÓNG NỐT `TD-25` — 5 BẢNG CUỐI CÙNG CÒN XOÁ CỨNG
--
-- 📐 Board Directive 08/08/2026: *"đóng nốt 5 bảng còn lại"*
-- 📐 Hiến pháp III (xoá mềm bắt buộc) · ADR-018 §9.3 `TD-25`
-- 📐 Đóng luôn `TD-01` — xem §④
--
-- ⚠️ Chạy SAU `052`. Idempotent. ⛔ KHÔNG xoá dữ liệu. Hỏng bất kỳ phép tự
--    kiểm nào ⇒ `RAISE` ⇒ **toàn bộ giao dịch quay lui**.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ① NĂM BẢNG, NHƯNG **HAI** BÀI TOÁN KHÁC NHAU
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Chỗ dễ sai nhất của migration này là **đối xử với cả năm như một**.
--    Chúng ⛔ không giống nhau:
--
--   A · BỐN BẢNG "DÒNG CON CỦA BẢN NHÁP"  → XOÁ MỀM
--       costing_items · style_colorways · style_sizes · style_operations
--       Người dùng bỏ một dòng khỏi bản đang soạn. Giữ lại dấu vết là ĐÚNG,
--       và số lượng dòng bỏ đi là HỮU HẠN (vài dòng mỗi mã hàng).
--
--   B · MỘT BẢNG "THAY CẢ CỤM"           → RPC NGUYÊN TỬ, **⛔ KHÔNG xoá mềm**
--       order_size_breakdown
--       🔴 `saveSizeBreakdown` **ghi lại TOÀN BỘ** bảng màu×size mỗi lần lưu.
--       Xoá mềm ở đây sinh **một thế hệ dòng chết SAU MỖI LẦN BẤM LƯU** — một
--       đơn 10 màu × 8 size sửa 20 lần là **1.600 dòng chết**. Đó ⛔ không phải
--       lưu trữ, đó là rác.
--
--       ⇒ Ở B, mục tiêu *"vai nội bộ ⛔ không xoá cứng được"* đạt bằng cách
--         **đưa lệnh xoá vào trong một RPC** — `authenticated` mất quyền
--         `DELETE`, chỉ hàm có tên mới xoá được, và nó xoá **nguyên tử**.
--
-- 🔑 Cùng một điều khoản Hiến pháp, hai cách thi hành, vì bản chất dữ liệu
--    khác nhau. Ép B theo khuôn A là làm đúng hình thức mà hỏng thực chất.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ② TÍNH ĐẢO NGƯỢC
-- ════════════════════════════════════════════════════════════════════════════
--   Cột deleted_at/deleted_by (4 bảng) .. ĐẢO ĐƯỢC  (DROP COLUMN)
--   Policy ẩn dòng đã lưu trữ ............ ĐẢO ĐƯỢC  (DROP POLICY)
--   Chỉ mục MỘT PHẦN ..................... ĐẢO ĐƯỢC  (dựng lại UNIQUE thẳng —
--     ⚠️ chỉ được nếu ⛔ chưa có cặp trùng mà một cái đã lưu trữ)
--   REVOKE DELETE ........................ ĐẢO ĐƯỢC  (GRANT lại)
--   RPC .................................. ĐẢO ĐƯỢC  (DROP FUNCTION)
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- ③ NHÓM A — XOÁ MỀM CHO BỐN BẢNG DÒNG CON
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.costing_items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.style_colorways
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.style_sizes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.style_operations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ⚠️ `style_colorways` NAY CÓ **HAI** CỜ TẮT, và chúng ⛔ KHÔNG cùng nghĩa:
--     is_active = false  →  màu này TẠM thời ⛔ không chào bán (nghiệp vụ)
--     deleted_at ≠ NULL  →  màu này bị GỠ khỏi mã hàng (khai nhầm)
--   Cái thứ nhất giữ chỗ trong `UNIQUE(style_id,color_code)`, cái thứ hai thì
--   ⛔ không. Nhập hai thứ làm một là mất khả năng lập lại đúng mã màu cũ.
COMMENT ON COLUMN public.style_colorways.deleted_at IS
  '053. Xoá mềm — KHÁC `is_active`: is_active=false là "tạm ngừng chào bán" '
  '(vẫn giữ chỗ mã màu); deleted_at là "gỡ khỏi mã hàng" (nhả chỗ mã màu).';

-- ─── Chỉ mục duy nhất MỘT PHẦN — CLAUDE.md §2.5 ──────────────────────────
-- Xoá mềm xung khắc `UNIQUE`: gỡ màu `NAVY` rồi khai lại `NAVY` sẽ đụng khoá
-- trùng, mà người dùng ⛔ không hiểu vì màu cũ *"đã biến mất"* khỏi màn hình.
--
-- ⚠️ TÊN RÀNG BUỘC ĐỌC TỪ CSDL ĐANG CHẠY, ⛔ KHÔNG ĐOÁN TỪ KHO — bài học `049`.
DO $$
DECLARE r RECORD; v_ten TEXT;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('style_colorways', '(style_id, color_code)', 'style_colorways_active_uniq'),
      ('style_sizes',     '(style_id, size_code)',  'style_sizes_active_uniq')
    ) AS t(bang, cot, idx)
  LOOP
    SELECT conname INTO v_ten FROM pg_constraint
     WHERE conrelid = ('public.' || r.bang)::regclass AND contype = 'u' LIMIT 1;
    IF v_ten IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.bang, v_ten);
      RAISE NOTICE '   ↻ gỡ UNIQUE thẳng trên %: %', r.bang, v_ten;
    END IF;
    EXECUTE format(
      'CREATE UNIQUE INDEX IF NOT EXISTS %I ON public.%I %s WHERE deleted_at IS NULL',
      r.idx, r.bang, r.cot);
  END LOOP;
END $$;

-- ─── Policy ẩn dòng đã lưu trữ ───────────────────────────────────────────
-- ⚠️ RESTRICTIVE **FOR SELECT** ⇒ nhân VÀO policy đọc sẵn có, ⛔ KHÔNG khai
--    lại danh sách vai của `042` (nguồn lệch).
-- ⚠️ CỐ Ý ⛔ không lọc ở UPDATE — `036` §3.3: giữ đường khôi phục.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['costing_items','style_colorways','style_sizes','style_operations'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_an_da_luu_tru', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated '
      'USING (deleted_at IS NULL)', t || '_an_da_luu_tru', t);
  END LOOP;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- ④ NHÓM B — `order_size_breakdown`: RPC NGUYÊN TỬ, ĐÓNG LUÔN `TD-01`
-- ════════════════════════════════════════════════════════════════════════════
-- 🔴 `saveSizeBreakdown` hiện làm **XOÁ rồi CHÈN bằng HAI câu lệnh riêng**, và
--    chú thích trong `po.actions.ts` đã tự khai lỗ hổng:
--
--      > *"Câu ghi hỏng — mạng đứt, RLS chặn, ràng buộc đổ — là **MẤT SẠCH**
--      >  bảng cỡ/màu của đơn đó, ⛔ không đường khôi phục."*
--
--    Bản vá hiện tại là **phương án BÙ TRỪ**: chụp trước, hỏng thì ghi lại bản
--    chụp. Chính chú thích ấy ghi: *"Cách đúng là một RPC làm cả hai trong MỘT
--    câu lệnh. Đã ghi vào Technical Debt (TD-01)."*
--
-- 🔑 Hàm dưới đây LÀ cái RPC đó. Nó đóng **hai** món nợ cùng lúc:
--      `TD-25` — `authenticated` mất quyền `DELETE` (§⑥)
--      `TD-01` — xoá và chèn nay nằm trong **MỘT giao dịch**, ⛔ không còn cửa
--                sổ mất dữ liệu, ⛔ không cần bản chụp bù trừ.
CREATE OR REPLACE FUNCTION public.mos_md_thay_bang_size(p_order_id UUID, p_rows JSONB)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_tt TEXT; v_dem INT;
BEGIN
  IF public.mos_is_external() THEN
    RAISE EXCEPTION 'Chỉ người nội bộ mới sửa được bảng cỡ/màu.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 🔴 KHOÁ THEO WORKFLOW — đơn đã đóng thì bảng cỡ/màu cũng đóng.
  -- ⚠️ Trigger của `049` nằm trên `orders`, ⛔ không chạm bảng này; thiếu phép
  --    thử ở đây thì số lượng theo màu/size của một đơn `COMPLETED` **vẫn ghi
  --    đè được** — đúng loại cửa sau mà `BUG-4` đi tìm.
  SELECT status INTO v_tt FROM public.orders WHERE id = p_order_id;
  IF v_tt IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy đơn hàng.' USING ERRCODE = 'no_data_found';
  END IF;
  IF upper(v_tt) = ANY (ARRAY['COMPLETED','SHIPPED','CANCELLED']) THEN
    RAISE EXCEPTION 'Đơn hàng đã đóng (%) — ⛔ không sửa được bảng cỡ/màu.', v_tt
      USING ERRCODE = '23514',
            HINT = 'Trình Giám đốc mở lại đơn, hoặc lập chứng từ điều chỉnh.';
  END IF;

  -- Cả hai câu nằm trong CÙNG một giao dịch của hàm ⇒ hỏng là quay lui SẠCH.
  DELETE FROM public.order_size_breakdown WHERE order_id = p_order_id;

  INSERT INTO public.order_size_breakdown (order_id, color_code, size_code, quantity)
  SELECT p_order_id,
         upper(x ->> 'color_code'),
         upper(x ->> 'size_code'),
         (x ->> 'quantity')::INT
    FROM jsonb_array_elements(COALESCE(p_rows, '[]'::jsonb)) AS x;

  GET DIAGNOSTICS v_dem = ROW_COUNT;
  RETURN v_dem;
END $$;

COMMENT ON FUNCTION public.mos_md_thay_bang_size(UUID, JSONB) IS
  'ADR-027 / migration 053. Thay TOÀN BỘ bảng cỡ/màu của một PO trong MỘT giao '
  'dịch. Đóng TD-01 (xoá-rồi-chèn hai câu ⇒ mất sạch nếu câu hai hỏng) và TD-25 '
  '(authenticated mất DELETE). Khoá theo workflow: đơn đã đóng ⇒ 23514.';


-- ════════════════════════════════════════════════════════════════════════════
-- ⑤ MỞ RỘNG BA RPC CỦA `052` CHO BỐN BẢNG MỚI
-- ════════════════════════════════════════════════════════════════════════════
-- ⛔ KHÔNG dùng SQL động: tập bảng là ĐÓNG và nhỏ ⇒ `IF/ELSIF` tĩnh cho bề mặt
-- tiêm nhiễm bằng KHÔNG.
CREATE OR REPLACE FUNCTION public.mos_md_luu_tru(p_bang TEXT, p_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_id UUID;
BEGIN
  IF public.mos_is_external() THEN
    RAISE EXCEPTION 'Chỉ người nội bộ mới lưu trữ được chứng từ.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_bang = 'md_documents' THEN
    UPDATE public.md_documents SET deleted_at = NOW(), deleted_by = auth.uid()
     WHERE id = p_id AND deleted_at IS NULL RETURNING id INTO v_id;
  ELSIF p_bang = 'style_bom' THEN
    UPDATE public.style_bom SET deleted_at = NOW(), deleted_by = auth.uid()
     WHERE id = p_id AND deleted_at IS NULL RETURNING id INTO v_id;
  ELSIF p_bang = 'material_requests' THEN
    UPDATE public.material_requests SET deleted_at = NOW(), deleted_by = auth.uid()
     WHERE id = p_id AND deleted_at IS NULL
       AND status IS DISTINCT FROM 'RECEIVED' RETURNING id INTO v_id;
  ELSIF p_bang = 'costing_items' THEN
    -- ⚠️ Trigger `046` vẫn đứng: khoản mục của chiết tính ĐÃ DUYỆT bất động
    -- hoàn toàn, nên lệnh này sẽ đổ `23514` — ĐÚNG, ⛔ không cần chặn lại ở đây.
    UPDATE public.costing_items SET deleted_at = NOW(), deleted_by = auth.uid()
     WHERE id = p_id AND deleted_at IS NULL RETURNING id INTO v_id;
  ELSIF p_bang = 'style_colorways' THEN
    UPDATE public.style_colorways SET deleted_at = NOW(), deleted_by = auth.uid()
     WHERE id = p_id AND deleted_at IS NULL RETURNING id INTO v_id;
  ELSIF p_bang = 'style_sizes' THEN
    UPDATE public.style_sizes SET deleted_at = NOW(), deleted_by = auth.uid()
     WHERE id = p_id AND deleted_at IS NULL RETURNING id INTO v_id;
  ELSIF p_bang = 'style_operations' THEN
    UPDATE public.style_operations SET deleted_at = NOW(), deleted_by = auth.uid()
     WHERE id = p_id AND deleted_at IS NULL RETURNING id INTO v_id;
  ELSE
    RAISE EXCEPTION 'Bảng "%" ⛔ không hỗ trợ lưu trữ mềm.', p_bang
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy dòng còn hiệu lực để lưu trữ (hoặc phiếu đã nhận kho).'
      USING ERRCODE = 'no_data_found';
  END IF;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.mos_md_khoi_phuc(p_bang TEXT, p_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_id UUID;
BEGIN
  IF public.mos_is_external() THEN
    RAISE EXCEPTION 'Chỉ người nội bộ mới khôi phục được chứng từ.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_bang = 'md_documents' THEN
    UPDATE public.md_documents SET deleted_at = NULL, deleted_by = NULL
     WHERE id = p_id AND deleted_at IS NOT NULL RETURNING id INTO v_id;
  ELSIF p_bang = 'style_bom' THEN
    UPDATE public.style_bom SET deleted_at = NULL, deleted_by = NULL
     WHERE id = p_id AND deleted_at IS NOT NULL RETURNING id INTO v_id;
  ELSIF p_bang = 'material_requests' THEN
    UPDATE public.material_requests SET deleted_at = NULL, deleted_by = NULL
     WHERE id = p_id AND deleted_at IS NOT NULL RETURNING id INTO v_id;
  ELSIF p_bang = 'costing_items' THEN
    UPDATE public.costing_items SET deleted_at = NULL, deleted_by = NULL
     WHERE id = p_id AND deleted_at IS NOT NULL RETURNING id INTO v_id;
  ELSIF p_bang = 'style_colorways' THEN
    UPDATE public.style_colorways SET deleted_at = NULL, deleted_by = NULL
     WHERE id = p_id AND deleted_at IS NOT NULL RETURNING id INTO v_id;
  ELSIF p_bang = 'style_sizes' THEN
    UPDATE public.style_sizes SET deleted_at = NULL, deleted_by = NULL
     WHERE id = p_id AND deleted_at IS NOT NULL RETURNING id INTO v_id;
  ELSIF p_bang = 'style_operations' THEN
    UPDATE public.style_operations SET deleted_at = NULL, deleted_by = NULL
     WHERE id = p_id AND deleted_at IS NOT NULL RETURNING id INTO v_id;
  ELSE
    RAISE EXCEPTION 'Bảng "%" ⛔ không hỗ trợ lưu trữ mềm.', p_bang
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy dòng đã lưu trữ với mã này.'
      USING ERRCODE = 'no_data_found';
  END IF;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.mos_md_ds_luu_tru(p_bang TEXT)
RETURNS TABLE (id UUID, nhan TEXT, deleted_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.mos_is_external() THEN
    RAISE EXCEPTION 'Chỉ người nội bộ mới xem được danh sách đã lưu trữ.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_bang = 'md_documents' THEN
    RETURN QUERY SELECT d.id, d.title::TEXT, d.deleted_at FROM public.md_documents d
      WHERE d.deleted_at IS NOT NULL ORDER BY d.deleted_at DESC LIMIT 500;
  ELSIF p_bang = 'style_bom' THEN
    RETURN QUERY SELECT b.id, b.item_name::TEXT, b.deleted_at FROM public.style_bom b
      WHERE b.deleted_at IS NOT NULL ORDER BY b.deleted_at DESC LIMIT 500;
  ELSIF p_bang = 'material_requests' THEN
    RETURN QUERY SELECT m.id, (m.request_no || ' — ' || m.material_name)::TEXT, m.deleted_at
      FROM public.material_requests m
      WHERE m.deleted_at IS NOT NULL ORDER BY m.deleted_at DESC LIMIT 500;
  ELSIF p_bang = 'costing_items' THEN
    RETURN QUERY SELECT c.id, c.item_name::TEXT, c.deleted_at FROM public.costing_items c
      WHERE c.deleted_at IS NOT NULL ORDER BY c.deleted_at DESC LIMIT 500;
  ELSIF p_bang = 'style_colorways' THEN
    RETURN QUERY SELECT w.id, (w.color_code || ' — ' || w.color_name)::TEXT, w.deleted_at
      FROM public.style_colorways w
      WHERE w.deleted_at IS NOT NULL ORDER BY w.deleted_at DESC LIMIT 500;
  ELSIF p_bang = 'style_sizes' THEN
    RETURN QUERY SELECT z.id, z.size_code::TEXT, z.deleted_at FROM public.style_sizes z
      WHERE z.deleted_at IS NOT NULL ORDER BY z.deleted_at DESC LIMIT 500;
  ELSIF p_bang = 'style_operations' THEN
    RETURN QUERY SELECT o.id, o.operation::TEXT, o.deleted_at FROM public.style_operations o
      WHERE o.deleted_at IS NOT NULL ORDER BY o.deleted_at DESC LIMIT 500;
  ELSE
    RAISE EXCEPTION 'Bảng "%" ⛔ không hỗ trợ lưu trữ mềm.', p_bang
      USING ERRCODE = 'invalid_parameter_value';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.mos_md_thay_bang_size(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mos_md_thay_bang_size(UUID, JSONB) TO authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- ⑥ THU HỒI `DELETE` — ĐÓNG `TD-25`
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ CHẠY SAU CÙNG. `042` Mục 1c nói rõ: thu hồi TRƯỚC khi có đường thay thế
--    là làm gãy chức năng đang chạy. Nay cả năm bảng đều có đường thay thế.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['costing_items','style_colorways','style_sizes',
                           'style_operations','order_size_breakdown'] LOOP
    EXECUTE format('REVOKE DELETE ON public.%I FROM authenticated', t);
    EXECUTE format('REVOKE ALL    ON public.%I FROM anon', t);
  END LOOP;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- ⑦ TỰ KIỂM — DỰNG DỮ LIỆU THẬT, THỬ, DỌN. HỎNG ⇒ QUAY LUI TOÀN BỘ.
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_dem INT; v_loi TEXT; v_style UUID; v_po UUID; v_cw UUID; v_ct UUID; v_ci UUID;
BEGIN
  -- 7.1 Bốn bảng có đủ hai cột
  SELECT count(*) INTO v_dem FROM information_schema.columns
   WHERE table_schema='public'
     AND table_name IN ('costing_items','style_colorways','style_sizes','style_operations')
     AND column_name IN ('deleted_at','deleted_by');
  IF v_dem <> 8 THEN RAISE EXCEPTION '⛔ TỰ KIỂM 7.1: thiếu cột (thấy %/8).', v_dem; END IF;

  -- 7.2 `authenticated` ⛔ CÒN quyền DELETE trên cả 5 bảng ⇒ TD-25 đóng
  SELECT count(*) INTO v_dem FROM information_schema.role_table_grants
   WHERE table_schema='public' AND grantee='authenticated' AND privilege_type='DELETE'
     AND table_name IN ('costing_items','style_colorways','style_sizes',
                        'style_operations','order_size_breakdown');
  IF v_dem <> 0 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 7.2: còn % bảng cho authenticated xoá cứng.', v_dem;
  END IF;

  -- 7.3 Bảng MD nào còn DELETE? Phải bằng 0 — TD-25 đóng HOÀN TOÀN.
  SELECT count(DISTINCT table_name) INTO v_dem FROM information_schema.role_table_grants
   WHERE table_schema='public' AND grantee='authenticated' AND privilege_type='DELETE'
     AND table_name IN ('costings','costing_items','inquiries','style_bom',
       'production_orders','material_requests','order_milestones','change_requests',
       'risk_assessments','sample_submissions','order_size_breakdown','seasons',
       'customers','customer_contacts','styles','style_colorways','style_sizes',
       'style_operations','ta_templates','ta_template_items','md_documents','md_comments');
  IF v_dem <> 0 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 7.3: TD-25 CHƯA đóng — còn % bảng MD xoá cứng được.', v_dem;
  END IF;

  -- 7.4 🔴 CHỈ MỤC MỘT PHẦN: gỡ một màu rồi khai LẠI đúng mã màu đó
  SELECT id INTO v_style FROM public.styles LIMIT 1;
  INSERT INTO public.style_colorways (style_id, color_code, color_name)
  VALUES (v_style, 'ZZTEST053', 'Màu tự kiểm') RETURNING id INTO v_cw;
  PERFORM public.mos_md_luu_tru('style_colorways', v_cw);
  BEGIN
    INSERT INTO public.style_colorways (style_id, color_code, color_name)
    VALUES (v_style, 'ZZTEST053', 'Màu tự kiểm 2');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 7.4: ⛔ không khai lại được mã màu đã gỡ — %', SQLERRM;
  END;

  -- 7.5 VẾ ĐỐI CHỨNG (K-3): hai màu CÙNG hiệu lực trùng mã ⇒ PHẢI bị chặn
  v_loi := NULL;
  BEGIN
    INSERT INTO public.style_colorways (style_id, color_code, color_name)
    VALUES (v_style, 'ZZTEST053', 'Màu tự kiểm 3');
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE;
  END;
  IF v_loi IS NULL THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 7.5: hai màu CÙNG hiệu lực trùng mã mà ⛔ không bị chặn.';
  END IF;
  DELETE FROM public.style_colorways WHERE style_id = v_style AND color_code = 'ZZTEST053';

  -- 7.6 Lưu trữ ⇄ khôi phục khoản mục chiết tính (bản NHÁP)
  INSERT INTO public.costings (costing_no, version, order_type, currency, status)
  VALUES ('SELFTEST-053-' || substr(md5(random()::text),1,8), 1, 'FOB', 'USD', 'DRAFT')
  RETURNING id INTO v_ct;
  INSERT INTO public.costing_items (costing_id, category, item_name, unit, consumption, unit_price)
  VALUES (v_ct, 'FABRIC', 'Vải tự kiểm', 'm', 1, 2) RETURNING id INTO v_ci;
  PERFORM public.mos_md_luu_tru('costing_items', v_ci);
  SELECT count(*) INTO v_dem FROM public.costing_items WHERE id = v_ci AND deleted_at IS NOT NULL;
  IF v_dem <> 1 THEN RAISE EXCEPTION '⛔ TỰ KIỂM 7.6: lưu trữ khoản mục ⛔ không ghi deleted_at.'; END IF;
  PERFORM public.mos_md_khoi_phuc('costing_items', v_ci);
  SELECT count(*) INTO v_dem FROM public.costing_items WHERE id = v_ci AND deleted_at IS NULL;
  IF v_dem <> 1 THEN RAISE EXCEPTION '⛔ TỰ KIỂM 7.6: khôi phục khoản mục thất bại.'; END IF;
  DELETE FROM public.costing_items WHERE id = v_ci;
  DELETE FROM public.costings WHERE id = v_ct;

  -- 7.7 🔴 RPC THAY BẢNG CỠ/MÀU — nguyên tử, và KHOÁ theo workflow
  INSERT INTO public.orders (po_number, style_code, customer_name, total_quantity,
                             delivery_date, status, style_id)
  VALUES ('SELFTEST-053-' || substr(md5(random()::text),1,8), 'ZZ', 'Tự kiểm 053',
          100, CURRENT_DATE + 30, 'DRAFT', v_style)
  RETURNING id INTO v_po;

  PERFORM public.mos_md_thay_bang_size(v_po,
    '[{"color_code":"navy","size_code":"m","quantity":60},
      {"color_code":"navy","size_code":"l","quantity":40}]'::jsonb);
  SELECT count(*) INTO v_dem FROM public.order_size_breakdown WHERE order_id = v_po;
  IF v_dem <> 2 THEN RAISE EXCEPTION '⛔ TỰ KIỂM 7.7: chờ 2 dòng, thấy %.', v_dem; END IF;
  SELECT count(*) INTO v_dem FROM public.order_size_breakdown
   WHERE order_id = v_po AND color_code = 'NAVY';
  IF v_dem <> 2 THEN RAISE EXCEPTION '⛔ TỰ KIỂM 7.7: RPC ⛔ không viết hoa mã màu.'; END IF;

  -- Thay lần hai ⇒ THAY THẾ, ⛔ không cộng dồn (đây là điểm khác xoá mềm)
  PERFORM public.mos_md_thay_bang_size(v_po,
    '[{"color_code":"RED","size_code":"S","quantity":10}]'::jsonb);
  SELECT count(*) INTO v_dem FROM public.order_size_breakdown WHERE order_id = v_po;
  IF v_dem <> 1 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 7.7: thay cụm mà dòng CỘNG DỒN (thấy %) — đây đúng '
      'là lý do bảng này ⛔ KHÔNG dùng xoá mềm.', v_dem;
  END IF;

  -- 7.8 Đơn ĐÃ ĐÓNG ⇒ RPC phải TỪ CHỐI
  UPDATE public.orders SET status = 'COMPLETED' WHERE id = v_po;
  v_loi := NULL;
  BEGIN
    PERFORM public.mos_md_thay_bang_size(v_po, '[]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE;
  END;
  IF v_loi IS NULL THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 7.8: đơn COMPLETED mà VẪN ghi đè được bảng cỡ/màu.';
  END IF;

  DELETE FROM public.order_size_breakdown WHERE order_id = v_po;
  DELETE FROM public.order_milestones WHERE order_id = v_po;
  DELETE FROM public.orders WHERE id = v_po;

  RAISE NOTICE '✅ TỰ KIỂM 053: 8/8 ĐẠT — TD-25 ĐÓNG, TD-01 ĐÓNG.';
END $$;

COMMIT;

-- ── BÁO CÁO KỲ VỌNG ⟷ THỰC TẾ ──────────────────────────────────────────────
SELECT 'số bảng MD còn cho authenticated XOÁ CỨNG (nợ TD-25)' AS muc,
       (SELECT count(DISTINCT table_name)::text FROM information_schema.role_table_grants
         WHERE table_schema='public' AND grantee='authenticated' AND privilege_type='DELETE'
           AND table_name IN ('costings','costing_items','inquiries','style_bom',
             'production_orders','material_requests','order_milestones','change_requests',
             'risk_assessments','sample_submissions','order_size_breakdown','seasons',
             'customers','customer_contacts','styles','style_colorways','style_sizes',
             'style_operations','ta_templates','ta_template_items','md_documents','md_comments')
       ) AS thuc_te, '0' AS ky_vong
UNION ALL
SELECT 'bảng MD có cột deleted_at',
       (SELECT count(DISTINCT table_name)::text FROM information_schema.columns
         WHERE table_schema='public' AND column_name='deleted_at'
           AND table_name IN ('md_documents','style_bom','material_requests',
             'costing_items','style_colorways','style_sizes','style_operations')), '7'
UNION ALL
SELECT 'policy ẩn dòng đã lưu trữ',
       (SELECT count(*)::text FROM pg_policies
         WHERE schemaname='public' AND policyname LIKE '%_an_da_luu_tru'), '7'
UNION ALL
SELECT 'RPC thay bảng cỡ/màu (đóng TD-01)',
       (SELECT count(*)::text FROM pg_proc WHERE proname='mos_md_thay_bang_size'), '1';

-- ⚠️ SAU KHI CHẠY:
--   node scripts/uat-md-vong-doi.mjs           → chờ 72 đạt · 0 hỏng
--   node tests/security/md-internal-scope.test.mjs → chờ 0 hỏng (TD-25 đóng)
-- ============================================================================
