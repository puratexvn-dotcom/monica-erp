-- ============================================================================
-- MONICA MOS — 036b · XOÁ MỀM QUA RPC
--
-- ⚠️ VÁ MỘT VA CHẠM THẬT GIỮA SPLIT POLICY VÀ PostgREST.
--
-- ─── ĐIỀU ĐÃ ĐO ĐƯỢC ─────────────────────────────────────────────────────
-- Sau khi 036 chạy, người dùng nội bộ KHÔNG xoá mềm được:
--
--     UPDATE ... SET rate       = 2.0    →  đi qua
--     UPDATE ... SET note       = 'x'    →  đi qua
--     UPDATE ... SET deleted_by = <uid>  →  đi qua
--     UPDATE ... SET deleted_at = NOW()  →  ✗ 42501
--         "new row violates row-level security policy"
--
--     cùng lệnh đó bằng service_role      →  đi qua  (vượt RLS)
--     Prefer: return=minimal              →  ✗ vẫn chặn
--
-- ─── NGUYÊN NHÂN ─────────────────────────────────────────────────────────
-- PostgREST bọc mọi `PATCH` trong một CTE có `RETURNING`, **bất kể** header
-- `Prefer`. Vì có `RETURNING`, PostgreSQL áp policy `SELECT` lên **DÒNG MỚI**.
--
-- Mà `act_select_active` đòi `deleted_at IS NULL`. Dòng vừa xoá mềm **theo định
-- nghĩa** không thoả điều kiện đó nữa ⇒ bị từ chối.
--
--     Split Policy đúng trong SQL thuần. Nó va chạm với PostgREST.
--
-- ⚠️ Đây KHÔNG phải lý do để gỡ bộ lọc khỏi RLS. Kiến trúc sư đã bác đề nghị đó
-- của tôi và bác đúng: gỡ đi là vi phạm Defense-in-Depth, tầng dưới cùng không
-- còn hàng rào nào.
--
-- ─── LỜI GIẢI ────────────────────────────────────────────────────────────
-- Xoá mềm đi qua một hàm `SECURITY DEFINER`. Hàm chạy dưới quyền chủ sở hữu nên
-- `RETURNING` không bị policy `SELECT` chặn, còn chốt quyền được kiểm TƯỜNG MINH
-- ngay dòng đầu.
--
-- Đổi lại còn được một thứ tốt hơn hẳn cách cũ: **xoá mềm trở thành một THAO TÁC
-- CÓ TÊN**, không phải một lần ghi cột thô. Muốn thêm audit hay điều kiện nghiệp
-- vụ sau này thì có đúng một chỗ để thêm.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. XOÁ MỀM
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.mos_soft_delete_commercial_term(p_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER                      -- ⚠️ chạy dưới quyền CHỦ SỞ HỮU
SET search_path = public, pg_temp
AS $$
DECLARE v_id UUID;
BEGIN
  -- ⚠️ `SECURITY DEFINER` VƯỢT RLS. Câu lệnh dưới đây là hàng rào DUY NHẤT còn
  -- lại, nên nó phải đứng ĐẦU TIÊN và không được có đường vòng nào.
  IF public.mos_is_external() THEN
    RAISE EXCEPTION 'Chỉ người nội bộ mới xoá được điều khoản thương mại.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.assignment_commercial_terms
     SET deleted_at = NOW(),
         deleted_by = auth.uid()
   WHERE id = p_id
     AND deleted_at IS NULL          -- xoá hai lần là không làm gì, không phải lỗi mới
   RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy điều khoản còn hiệu lực với mã này.'
      USING ERRCODE = 'no_data_found';
  END IF;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.mos_soft_delete_commercial_term(UUID) IS
  'Xoá mềm điều khoản thương mại. SECURITY DEFINER vì policy act_select_active '
  'lọc deleted_at, mà PostgREST luôn kèm RETURNING — dòng vừa xoá không tự trả '
  'về được. Chốt quyền kiểm tường minh bên trong.';

-- ════════════════════════════════════════════════════════════════════════════
-- 2. KHÔI PHỤC
-- ════════════════════════════════════════════════════════════════════════════
-- Chiều này KHÔNG bị policy chặn (dòng mới có `deleted_at IS NULL` nên thoả
-- `act_select_active`), nhưng vẫn để ở đây cho cân xứng: hai thao tác ngược
-- nhau mà đi hai đường khác nhau là chỗ người sau đọc nhầm.
CREATE OR REPLACE FUNCTION public.mos_restore_commercial_term(p_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_id UUID; v_asg UUID;
BEGIN
  IF public.mos_is_external() THEN
    RAISE EXCEPTION 'Chỉ người nội bộ mới khôi phục được điều khoản thương mại.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT assignment_id INTO v_asg
    FROM public.assignment_commercial_terms
   WHERE id = p_id AND deleted_at IS NOT NULL;

  IF v_asg IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy điều khoản đã xoá với mã này.'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- ⚠️ Nói TRƯỚC thay vì để `uq_act_assignment_active` ném 23505.
  -- `23505` là câu của cơ sở dữ liệu, không phải câu người vận hành hiểu được —
  -- và ở đây nguyên nhân rất cụ thể: phần việc đã có điều khoản khác thay thế.
  IF EXISTS (
    SELECT 1 FROM public.assignment_commercial_terms
     WHERE assignment_id = v_asg AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Không khôi phục được: phần việc này đã có một điều khoản khác đang hiệu lực. Hãy xoá điều khoản đó trước.'
      USING ERRCODE = 'unique_violation';
  END IF;

  UPDATE public.assignment_commercial_terms
     SET deleted_at = NULL, deleted_by = NULL
   WHERE id = p_id
   RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.mos_restore_commercial_term(UUID) IS
  'Khôi phục điều khoản đã xoá mềm. Báo trước khi phần việc đã có điều khoản '
  'khác đang hiệu lực, thay vì để chỉ mục một phần ném 23505 khó hiểu.';

-- ════════════════════════════════════════════════════════════════════════════
-- 3. CẤP QUYỀN — HẸP NHẤT CÓ THỂ
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ `SECURITY DEFINER` + `PUBLIC` là công thức của một lỗ hổng leo thang đặc
-- quyền. Thu hồi trước, rồi cấp lại đúng vai trò cần.
REVOKE ALL ON FUNCTION public.mos_soft_delete_commercial_term(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mos_restore_commercial_term(UUID)     FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.mos_soft_delete_commercial_term(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mos_restore_commercial_term(UUID)     TO authenticated;

-- `anon` KHÔNG được cấp. Khách vãng lai không có việc gì ở đây.

-- ════════════════════════════════════════════════════════════════════════════
-- 4. HOÀN TÁC
-- ════════════════════════════════════════════════════════════════════════════
--   DROP FUNCTION IF EXISTS public.mos_soft_delete_commercial_term(UUID);
--   DROP FUNCTION IF EXISTS public.mos_restore_commercial_term(UUID);
--
-- Hoàn tác SẠCH — không đụng dữ liệu, không đụng lược đồ. Nhưng gỡ xong thì
-- **xoá mềm không còn đường nào để thực hiện**, vì `UPDATE` thẳng vẫn bị policy
-- `SELECT` chặn. Hai thứ này đi cùng nhau.

-- ════════════════════════════════════════════════════════════════════════════
-- 5. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Hai hàm RPC' AS muc,
       (SELECT COUNT(*)::TEXT FROM pg_proc
         WHERE proname IN ('mos_soft_delete_commercial_term','mos_restore_commercial_term')) AS ket_qua,
       '2' AS ky_vong
UNION ALL
SELECT 'Cả hai đều SECURITY DEFINER',
       (SELECT COUNT(*)::TEXT FROM pg_proc
         WHERE proname IN ('mos_soft_delete_commercial_term','mos_restore_commercial_term')
           AND prosecdef), '2'
UNION ALL
SELECT '⚠️ Cả hai đều ghim search_path (chống chiếm quyền qua schema giả)',
       (SELECT COUNT(*)::TEXT FROM pg_proc
         WHERE proname IN ('mos_soft_delete_commercial_term','mos_restore_commercial_term')
           AND array_to_string(proconfig, ',') ILIKE '%search_path%'), '2'
UNION ALL
SELECT 'Split Policy của 036 còn nguyên',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE tablename='assignment_commercial_terms'
           AND policyname IN ('act_select_active','act_insert_internal','act_update_internal')), '3'
UNION ALL
SELECT 'SELECT vẫn lọc deleted_at (Defense-in-Depth giữ nguyên)',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE tablename='assignment_commercial_terms' AND policyname='act_select_active'
           AND qual ILIKE '%deleted_at IS NULL%'), '1'
UNION ALL
SELECT 'Chỉ mục một phần còn nguyên',
       (SELECT COUNT(*)::TEXT FROM pg_indexes
         WHERE indexname='uq_act_assignment_active'), '1';
