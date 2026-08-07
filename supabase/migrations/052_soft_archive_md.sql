-- ============================================================================
-- MONICA ONE — 052 · LƯU TRỮ MỀM cho `md_documents` · `style_bom` ·
--                    `material_requests`
--
-- 📐 Board Decision 07/08/2026 `BUG-5`: *"⛔ Không Delete vật lý. **Chỉ
--    Archive.**"* — ba bảng này là phần CÒN LẠI chưa thi hành được.
-- 📐 ADR-027 §③ · thay thế phần §③ của `supabase/drafts/048_*.INCOMPLETE.sql`
--
-- ⚠️ Chạy SAU `051`. Idempotent. ⛔ KHÔNG xoá dữ liệu. Hỏng bất kỳ phép tự
--    kiểm nào ⇒ `RAISE` ⇒ **toàn bộ giao dịch quay lui**.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ① VÌ SAO THÊM CỘT `deleted_at` LÀ CHƯA ĐỦ — VA CHẠM VỚI PostgREST
-- ════════════════════════════════════════════════════════════════════════════
-- Đây đúng chỗ tôi cố ý **⛔ KHÔNG gộp vào `049`**, và lý do vẫn nguyên:
--
--   PostgREST bọc mọi `PATCH` trong một CTE có `RETURNING`, **bất kể** header
--   `Prefer`. Vì có `RETURNING`, PostgreSQL áp policy `SELECT` lên **DÒNG MỚI**.
--   Policy lọc `deleted_at IS NULL` ⇒ dòng vừa lưu trữ **theo định nghĩa** ⛔
--   không thoả điều kiện đó nữa ⇒ lệnh trả **0 dòng**.
--
-- 🔴 Hậu quả nếu làm nửa vời: ba hàm `archiveTechPack` · `archiveBom` ·
--    `archiveMaterialRequest` sẽ báo *"⛔ không có dòng nào được cập nhật —
--    RLS đã chặn"* **dù dữ liệu ĐÃ đổi**. Người dùng bấm Lưu trữ, thấy báo
--    lỗi, bấm lại — và mỗi lần bấm đều "thất bại" trong khi thực ra thành công.
--
-- ⚠️ Đây **⛔ KHÔNG** phải lý do gỡ bộ lọc khỏi RLS. `036` §3.2 ghi rõ: đề
--    nghị lọc ở tầng Service **ĐÃ BỊ BÁC** — gỡ đi là tầng dưới cùng ⛔ không
--    còn hàng rào nào, và ba chỗ đọc `md_documents` sẽ lệch nhau.
--
-- ⇒ LỜI GIẢI: lưu trữ đi qua **RPC `SECURITY DEFINER`**, đúng khuôn `036b`
--   đã chạy thật. Hàm chạy dưới quyền chủ sở hữu nên `RETURNING` ⛔ không bị
--   policy `SELECT` chặn, còn chốt quyền kiểm **tường minh** ngay dòng đầu.
--
-- 🔑 Đổi lại còn được một thứ tốt hơn: **lưu trữ thành một THAO TÁC CÓ TÊN**,
--    ⛔ không phải một lần ghi cột thô. Thêm điều kiện nghiệp vụ về sau thì có
--    đúng một chỗ để thêm.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ② IMPACT ANALYSIS
-- ════════════════════════════════════════════════════════════════════════════
-- BẢNG CHẠM  md_documents · style_bom · material_requests (thêm 2 cột mỗi bảng)
-- POLICY     + `<bảng>_an_da_luu_tru` RESTRICTIVE **FOR SELECT**
--            ⚠️ RESTRICTIVE ⇒ **nhân VÀO** policy đọc sẵn có, ⛔ KHÔNG thay nó
--               ⇒ ⛔ không phải khai lại danh sách vai của `042` (nguồn lệch).
--            ⚠️ CỐ Ý ⛔ KHÔNG lọc ở UPDATE — `036` §3.3: giữ đường khôi phục.
-- CHỈ MỤC    material_requests.request_no: UNIQUE ⇒ UNIQUE **MỘT PHẦN**
-- HÀM MỚI    mos_md_luu_tru / mos_md_khoi_phuc / mos_md_ds_luu_tru
-- AI MẤT GÌ  ⛔ không ai mất quyền. Dòng đã lưu trữ thôi hiện ở màn hình đang
--            dùng — đó CHÍNH LÀ mục đích.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ③ TÍNH ĐẢO NGƯỢC
-- ════════════════════════════════════════════════════════════════════════════
--   Cột deleted_at/deleted_by ...... ĐẢO ĐƯỢC  (DROP COLUMN)
--   Policy ẩn dòng đã lưu trữ ....... ĐẢO ĐƯỢC  (DROP POLICY)
--   Chỉ mục MỘT PHẦN ................ ĐẢO ĐƯỢC  (dựng lại UNIQUE thẳng — ⚠️ chỉ
--     được nếu ⛔ chưa có hai phiếu trùng `request_no` mà một cái đã lưu trữ)
--   Ba hàm RPC ...................... ĐẢO ĐƯỢC  (DROP FUNCTION)
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. CỘT — khuôn `036`, chép đúng, chỉ đổi tên bảng
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.md_documents
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.style_bom
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.material_requests
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;


-- ════════════════════════════════════════════════════════════════════════════
-- 2. XOÁ MỀM XUNG KHẮC `UNIQUE` — CLAUDE.md §2.5
-- ════════════════════════════════════════════════════════════════════════════
-- `material_requests.request_no` đang là `UNIQUE` **thẳng**. Lưu trữ một phiếu
-- rồi lập lại đúng số phiếu đó sẽ đụng khoá trùng — và người dùng ⛔ không hiểu
-- vì sao, vì phiếu cũ *"đã biến mất"* khỏi màn hình.
--
-- ⚠️ TÊN RÀNG BUỘC ĐỌC TỪ CSDL ĐANG CHẠY, ⛔ KHÔNG ĐOÁN TỪ KHO.
--    Đây đúng bài học `049` đã trả giá: tôi đoán tên `costings_no_edit_after_
--    approve` từ migration, và nó ⛔ không tồn tại ⇒ migration quay lui.
DO $$
DECLARE v_ten TEXT;
BEGIN
  SELECT conname INTO v_ten
    FROM pg_constraint
   WHERE conrelid = 'public.material_requests'::regclass
     AND contype = 'u'
     AND pg_get_constraintdef(oid) ILIKE '%(request_no)%'
   LIMIT 1;

  IF v_ten IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.material_requests DROP CONSTRAINT %I', v_ten);
    RAISE NOTICE '   ↻ đã gỡ ràng buộc UNIQUE thẳng: %', v_ten;
  ELSE
    RAISE NOTICE '   ↻ ⛔ không còn UNIQUE thẳng trên request_no (đã đổi trước đó).';
  END IF;
END $$;

-- 🔑 Chỉ mục duy nhất **MỘT PHẦN**: hai phiếu trùng số chỉ bị chặn khi cả hai
-- còn hiệu lực. Phiếu đã lưu trữ ⛔ không giữ chỗ nữa.
CREATE UNIQUE INDEX IF NOT EXISTS material_requests_request_no_active_uniq
  ON public.material_requests (request_no)
  WHERE deleted_at IS NULL;


-- ════════════════════════════════════════════════════════════════════════════
-- 3. POLICY — ẨN DÒNG ĐÃ LƯU TRỮ
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ RESTRICTIVE **FOR SELECT** ⇒ nhân VÀO policy `<bảng>_read` của `042`.
--    ⛔ KHÔNG khai lại danh sách vai — khai lại là dựng nguồn sự thật thứ hai,
--    và `042` dùng tới bốn danh sách vai khác nhau cho ba bảng này.
--
-- ⚠️ CỐ Ý ⛔ KHÔNG có policy tương ứng cho `UPDATE` — `036` §3.3: `UPDATE`
--    ⛔ không lọc để còn gỡ `deleted_at` về `NULL` mà khôi phục.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['md_documents', 'style_bom', 'material_requests'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_an_da_luu_tru', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated '
      'USING (deleted_at IS NULL)', t || '_an_da_luu_tru', t);
  END LOOP;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 4. RPC — LƯU TRỮ · KHÔI PHỤC · LIỆT KÊ
-- ════════════════════════════════════════════════════════════════════════════
-- 🔑 **⛔ KHÔNG DÙNG SQL ĐỘNG.** Ba bảng là tập ĐÓNG và nhỏ, nên `IF/ELSIF`
--    với câu lệnh tĩnh cho **bề mặt tiêm nhiễm bằng KHÔNG**. `format(%I)` trên
--    tên bảng do người dùng gửi là thứ ⛔ không cần thiết phải mạo hiểm ở một
--    hàm `SECURITY DEFINER`.

CREATE OR REPLACE FUNCTION public.mos_md_luu_tru(p_bang TEXT, p_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_id UUID;
BEGIN
  -- ⚠️ `SECURITY DEFINER` VƯỢT RLS. Câu này là hàng rào DUY NHẤT còn lại, nên
  -- nó phải đứng ĐẦU TIÊN và ⛔ không có đường vòng nào.
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
    -- 🔴 LUẬT NGHIỆP VỤ, ⛔ không chỉ phân quyền: phiếu ĐÃ NHẬN KHO là chứng từ
    -- đối ứng của một phiếu nhập — lưu trữ nó làm lệch tồn kho mà ⛔ không lỗi
    -- nào nổ ra. Khớp `LUAT.MATERIAL_REQUEST.khoaTuyetDoi` ở `document-lock.ts`.
    UPDATE public.material_requests SET deleted_at = NOW(), deleted_by = auth.uid()
     WHERE id = p_id AND deleted_at IS NULL
       AND status IS DISTINCT FROM 'RECEIVED' RETURNING id INTO v_id;
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

-- 🔴 LIỆT KÊ DÒNG ĐÃ LƯU TRỮ — **⛔ KHÔNG PHẢI TIỆN NGHI, LÀ AN TOÀN.**
-- Policy §3 ẩn chúng khỏi mọi câu `SELECT` thường, nên ⛔ không có hàm này thì
-- lưu trữ là **cửa MỘT CHIỀU**: bấm nhầm một cái, dòng biến mất và ⛔ không ai
-- tìm lại được để khôi phục. Một thao tác đảo ngược được mà ⛔ không có đường
-- đảo là một thao tác **⛔ không đảo ngược được trên thực tế**.
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
    RETURN QUERY SELECT d.id, d.title::TEXT, d.deleted_at
      FROM public.md_documents d WHERE d.deleted_at IS NOT NULL
      ORDER BY d.deleted_at DESC LIMIT 500;
  ELSIF p_bang = 'style_bom' THEN
    RETURN QUERY SELECT b.id, b.item_name::TEXT, b.deleted_at
      FROM public.style_bom b WHERE b.deleted_at IS NOT NULL
      ORDER BY b.deleted_at DESC LIMIT 500;
  ELSIF p_bang = 'material_requests' THEN
    RETURN QUERY SELECT m.id, (m.request_no || ' — ' || m.material_name)::TEXT, m.deleted_at
      FROM public.material_requests m WHERE m.deleted_at IS NOT NULL
      ORDER BY m.deleted_at DESC LIMIT 500;
  ELSE
    RAISE EXCEPTION 'Bảng "%" ⛔ không hỗ trợ lưu trữ mềm.', p_bang
      USING ERRCODE = 'invalid_parameter_value';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.mos_md_luu_tru(TEXT, UUID)    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mos_md_khoi_phuc(TEXT, UUID)  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mos_md_ds_luu_tru(TEXT)       FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mos_md_luu_tru(TEXT, UUID)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.mos_md_khoi_phuc(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mos_md_ds_luu_tru(TEXT)      TO authenticated;

COMMENT ON FUNCTION public.mos_md_luu_tru(TEXT, UUID) IS
  'ADR-027 §③ / migration 052. Lưu trữ mềm 3 bảng MD. SECURITY DEFINER vì '
  'policy <bảng>_an_da_luu_tru lọc deleted_at, mà PostgREST luôn kèm RETURNING '
  '— dòng vừa lưu trữ ⛔ không tự trả về được (khuôn 036b). Chốt quyền kiểm '
  'tường minh bên trong. ⛔ KHÔNG dùng SQL động: ba bảng là tập đóng.';


-- ════════════════════════════════════════════════════════════════════════════
-- 5. TỰ KIỂM — DỰNG DỮ LIỆU THẬT, THỬ, DỌN. HỎNG ⇒ QUAY LUI TOÀN BỘ.
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_style UUID; v_bom UUID; v_mr UUID; v_dem INT; v_loi TEXT;
BEGIN
  -- 5.1 Ba bảng CÓ đủ hai cột
  SELECT count(*) INTO v_dem FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name IN ('md_documents', 'style_bom', 'material_requests')
     AND column_name IN ('deleted_at', 'deleted_by');
  IF v_dem <> 6 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 5.1: thiếu cột lưu trữ (thấy %/6).', v_dem;
  END IF;

  -- 5.2 Chỉ mục mới phải là MỘT PHẦN
  SELECT count(*) INTO v_dem FROM pg_indexes
   WHERE schemaname = 'public' AND tablename = 'material_requests'
     AND indexdef ILIKE '%deleted_at IS NULL%';
  IF v_dem < 1 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 5.2: chỉ mục request_no ⛔ không phải MỘT PHẦN.';
  END IF;

  -- 5.3 Policy ẩn dòng đã lưu trữ, và CHỈ ở SELECT
  SELECT count(*) INTO v_dem FROM pg_policies
   WHERE schemaname = 'public' AND policyname LIKE '%_an_da_luu_tru'
     AND permissive = 'RESTRICTIVE' AND cmd = 'SELECT';
  IF v_dem <> 3 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 5.3: thiếu policy ẩn dòng đã lưu trữ (thấy %/3).', v_dem;
  END IF;

  -- 5.4 🔴 HAI SỐ PHIẾU TRÙNG NHAU: một cái đã lưu trữ ⇒ PHẢI lập lại được.
  --     Đây đúng thứ chỉ mục MỘT PHẦN sinh ra để giải.
  SELECT id INTO v_style FROM public.styles LIMIT 1;
  INSERT INTO public.material_requests
    (request_no, material_name, category, quantity, unit, needed_date, status)
  VALUES ('SELFTEST-052', 'Vải tự kiểm', 'FABRIC', 10, 'm', CURRENT_DATE + 10, 'DRAFT')
  RETURNING id INTO v_mr;

  UPDATE public.material_requests SET deleted_at = NOW() WHERE id = v_mr;
  BEGIN
    INSERT INTO public.material_requests
      (request_no, material_name, category, quantity, unit, needed_date, status)
    VALUES ('SELFTEST-052', 'Vải tự kiểm 2', 'FABRIC', 10, 'm', CURRENT_DATE + 10, 'DRAFT');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 5.4: ⛔ không lập lại được số phiếu đã lưu trữ — %', SQLERRM;
  END;
  DELETE FROM public.material_requests WHERE request_no = 'SELFTEST-052';

  -- 5.5 🔴 VẾ ĐỐI CHỨNG (K-3): hai phiếu CÙNG còn hiệu lực PHẢI bị chặn.
  --     Thiếu vế này thì một chỉ mục hỏng hoàn toàn cũng "xanh".
  INSERT INTO public.material_requests
    (request_no, material_name, category, quantity, unit, needed_date, status)
  VALUES ('SELFTEST-052B', 'Vải A', 'FABRIC', 10, 'm', CURRENT_DATE + 10, 'DRAFT');
  v_loi := NULL;
  BEGIN
    INSERT INTO public.material_requests
      (request_no, material_name, category, quantity, unit, needed_date, status)
    VALUES ('SELFTEST-052B', 'Vải B', 'FABRIC', 10, 'm', CURRENT_DATE + 10, 'DRAFT');
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE;
  END;
  IF v_loi IS NULL THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 5.5: hai phiếu CÙNG hiệu lực trùng số mà ⛔ không bị chặn.';
  END IF;
  DELETE FROM public.material_requests WHERE request_no = 'SELFTEST-052B';

  -- 5.6 BOM lưu trữ rồi khôi phục được
  INSERT INTO public.style_bom
    (style_id, item_name, category, unit, consumption_per_pcs, wastage_percent)
  VALUES (v_style, 'BOM tự kiểm 052', 'FABRIC', 'm', 1.5, 3) RETURNING id INTO v_bom;
  PERFORM public.mos_md_luu_tru('style_bom', v_bom);
  SELECT count(*) INTO v_dem FROM public.style_bom
   WHERE id = v_bom AND deleted_at IS NOT NULL;
  IF v_dem <> 1 THEN RAISE EXCEPTION '⛔ TỰ KIỂM 5.6: lưu trữ BOM ⛔ không ghi deleted_at.'; END IF;
  PERFORM public.mos_md_khoi_phuc('style_bom', v_bom);
  SELECT count(*) INTO v_dem FROM public.style_bom
   WHERE id = v_bom AND deleted_at IS NULL;
  IF v_dem <> 1 THEN RAISE EXCEPTION '⛔ TỰ KIỂM 5.6: khôi phục BOM ⛔ không xoá deleted_at.'; END IF;
  DELETE FROM public.style_bom WHERE id = v_bom;

  -- 5.7 Bảng ngoài danh sách ⇒ PHẢI bị từ chối, ⛔ không im lặng bỏ qua
  v_loi := NULL;
  BEGIN
    PERFORM public.mos_md_luu_tru('customers', gen_random_uuid());
  EXCEPTION WHEN OTHERS THEN v_loi := SQLERRM;
  END;
  IF v_loi IS NULL THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 5.7: RPC nhận bảng ngoài danh sách mà ⛔ không từ chối.';
  END IF;

  RAISE NOTICE '✅ TỰ KIỂM 052: 7/7 ĐẠT.';
END $$;

COMMIT;

-- ── BÁO CÁO KỲ VỌNG ⟷ THỰC TẾ ──────────────────────────────────────────────
SELECT 'ba bảng có đủ deleted_at + deleted_by' AS muc,
       (SELECT count(*)::text FROM information_schema.columns
         WHERE table_schema='public'
           AND table_name IN ('md_documents','style_bom','material_requests')
           AND column_name IN ('deleted_at','deleted_by')) AS thuc_te, '6' AS ky_vong
UNION ALL
SELECT 'policy ẩn dòng đã lưu trữ (RESTRICTIVE, chỉ SELECT)',
       (SELECT count(*)::text FROM pg_policies
         WHERE schemaname='public' AND policyname LIKE '%_an_da_luu_tru'
           AND permissive='RESTRICTIVE' AND cmd='SELECT'), '3'
UNION ALL
SELECT 'chỉ mục request_no là MỘT PHẦN',
       (SELECT count(*)::text FROM pg_indexes
         WHERE schemaname='public' AND tablename='material_requests'
           AND indexdef ILIKE '%deleted_at IS NULL%'), '1'
UNION ALL
SELECT 'ba RPC lưu trữ đã cấp cho authenticated',
       (SELECT count(*)::text FROM pg_proc p
         WHERE p.proname IN ('mos_md_luu_tru','mos_md_khoi_phuc','mos_md_ds_luu_tru')
           AND has_function_privilege('authenticated', p.oid, 'EXECUTE')), '3';

-- ⚠️ SAU KHI CHẠY:  node scripts/uat-md-vong-doi.mjs   → chờ 67 đạt · 0 hỏng
-- ============================================================================
