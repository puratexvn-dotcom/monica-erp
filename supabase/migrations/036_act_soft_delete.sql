-- ============================================================================
-- MONICA MOS — 036 · XOÁ MỀM CHO ĐIỀU KHOẢN THƯƠNG MẠI
--
-- Thiết kế: docs/adr/ADR-005-udmd-i18n-and-soft-delete.md (ĐÃ PHÊ DUYỆT)
-- Giải: Hiến pháp Mục B.2 (vi phạm Điều VIII)
--
-- ─── NGÕ CỤT ĐANG CÓ ─────────────────────────────────────────────────────
--   `assignment_commercial_terms`  không có deleted_at / deleted_by
--   029b                           đã THU HỒI quyền DELETE khỏi mọi vai trò
--
-- Cộng lại: một dòng điều khoản thương mại **ghi sai đơn giá** không có đường
-- nào để gỡ. Không xoá cứng được, cũng không xoá mềm được.
--
-- Bảng hiện 0 dòng nên chưa ai vấp — sau Assignment thật đầu tiên thì đó là bế
-- tắc vận hành, và lúc đó sửa sẽ đắt hơn nhiều.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. HAI CỘT XOÁ MỀM
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.assignment_commercial_terms
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. ⚠️ CHỈ MỤC PHẢI ĐỔI CÙNG LÚC — KHÔNG ĐƯỢC TÁCH RỜI
-- ════════════════════════════════════════════════════════════════════════════
-- Chỉ mục hiện tại là DUY NHẤT TOÀN PHẦN:
--
--     CREATE UNIQUE INDEX uq_act_assignment ON ... (assignment_id);
--
-- Thêm `deleted_at` mà giữ nguyên nó thì ngõ cụt chỉ **ĐỔI CHỖ**: xoá mềm điều
-- khoản sai xong **vẫn không lập được điều khoản mới**, vì dòng đã xoá vẫn
-- chiếm chỗ trong chỉ mục.
--
-- Đúng bài học `uq_shipment_carton_active` của migration 024: soft-delete và
-- UNIQUE toàn phần không bao giờ sống chung được.
DROP INDEX IF EXISTS public.uq_act_assignment;

CREATE UNIQUE INDEX IF NOT EXISTS uq_act_assignment_active
  ON public.assignment_commercial_terms (assignment_id)
  WHERE deleted_at IS NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. SPLIT POLICY — CHỈ THỊ KIẾN TRÚC SƯ
-- ════════════════════════════════════════════════════════════════════════════
-- Tôi từng đề nghị lọc `deleted_at` ở tầng Service. Kiến trúc sư BÁC, và lý lẽ
-- đúng hơn: gỡ bộ lọc khỏi RLS là vi phạm **Defense-in-Depth** — tầng dưới cùng
-- không còn hàng rào nào, và mọi đường vào mới (một Server Action viết vội, một
-- lời gọi PostgREST thẳng) đều thành lỗ hổng.
--
-- Nhưng nỗi lo về ngõ cụt khôi phục là có thật. Split Policy giải cả hai:
--
--     SELECT  lọc deleted_at   → không ai ĐỌC được dòng đã xoá
--     UPDATE  KHÔNG lọc        → vẫn gỡ được deleted_at về NULL (khôi phục)
--     INSERT  như cũ
--     DELETE  không có policy  → bị chặn (cộng REVOKE của 029b)
--
-- ⚠️ `FOR ALL` là thứ PHẢI GỠ. Một policy `FOR ALL` mang `deleted_at IS NULL`
-- trong `USING` sẽ chặn luôn `UPDATE` trên dòng đã xoá — tức là tự bắn vào chân
-- mình đúng chỗ bài toán khôi phục.
DROP POLICY IF EXISTS "assignment_internal_only" ON public.assignment_commercial_terms;

-- ─── 3.1 ĐỌC — dòng đã xoá mềm biến mất ────────────────────────────────
CREATE POLICY "act_select_active" ON public.assignment_commercial_terms
  FOR SELECT TO authenticated
  USING (NOT public.mos_is_external() AND deleted_at IS NULL);

-- ─── 3.2 GHI MỚI ───────────────────────────────────────────────────────
-- ⚠️ `FOR INSERT` chỉ có `WITH CHECK`, KHÔNG có `USING` — Postgres không cho.
-- Viết nhầm `USING` ở đây là lỗi cú pháp, không phải một policy lỏng lẻo.
CREATE POLICY "act_insert_internal" ON public.assignment_commercial_terms
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.mos_is_external());

-- ─── 3.3 SỬA — CỐ Ý KHÔNG LỌC deleted_at ───────────────────────────────
-- Đây là mảnh giữ cho đường khôi phục còn sống. Người nội bộ `UPDATE ... SET
-- deleted_at = NULL` để gỡ một lần xoá nhầm; nếu policy này lọc `deleted_at IS
-- NULL` thì lệnh đó không bao giờ tìm thấy dòng cần sửa.
--
-- ⚠️ Hệ quả cần biết: sau khi xoá mềm, PostgREST `.update().select()` sẽ trả
-- MẢNG RỖNG — không phải lỗi. Lệnh ghi thành công, nhưng dòng vừa xoá không còn
-- đọc được qua policy SELECT. Service KHÔNG được hiểu mảng rỗng là thất bại.
CREATE POLICY "act_update_internal" ON public.assignment_commercial_terms
  FOR UPDATE TO authenticated
  USING (NOT public.mos_is_external())
  WITH CHECK (NOT public.mos_is_external());

-- ─── 3.4 XOÁ — KHÔNG có policy nào ─────────────────────────────────────
-- Không policy ⇒ không dòng nào khớp ⇒ `DELETE` không xoá được gì. Cộng với
-- `REVOKE DELETE` của 029b là hai lớp cho cùng một điều: **xoá cứng không tồn
-- tại** với người dùng.

COMMENT ON COLUMN public.assignment_commercial_terms.deleted_at IS
  'Xoá mềm — Hiến pháp Điều VIII. Dòng đã xoá bị policy act_select_active ẩn '
  'khỏi mọi truy vấn đọc, nhưng UPDATE vẫn chạm được để KHÔI PHỤC.';

-- ════════════════════════════════════════════════════════════════════════════
-- 4. HOÀN TÁC
-- ════════════════════════════════════════════════════════════════════════════
--   DROP POLICY act_select_active ON assignment_commercial_terms;
--   DROP POLICY act_insert_internal ON assignment_commercial_terms;
--   DROP POLICY act_update_internal ON assignment_commercial_terms;
--   CREATE POLICY "assignment_internal_only" ON assignment_commercial_terms
--     FOR ALL TO authenticated
--     USING (NOT mos_is_external()) WITH CHECK (NOT mos_is_external());
--   DROP INDEX uq_act_assignment_active;
--   CREATE UNIQUE INDEX uq_act_assignment ON assignment_commercial_terms (assignment_id);
--   ALTER TABLE assignment_commercial_terms DROP COLUMN deleted_at, DROP COLUMN deleted_by;
--
-- ⚠️ CHỈ hoàn tác được khi CHƯA có dòng nào bị xoá mềm. Đã có rồi thì khôi phục
-- chỉ mục toàn phần sẽ ném 23505 — phải quyết xử lý những dòng đó trước, và đó
-- là quyết định NGHIỆP VỤ chứ không phải thao tác kỹ thuật.
--
-- Bảng hiện 0 dòng nên hôm nay hoàn tác sạch.

-- ════════════════════════════════════════════════════════════════════════════
-- 5. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Hai cột xoá mềm' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema='public' AND table_name='assignment_commercial_terms'
           AND column_name IN ('deleted_at','deleted_by')) AS ket_qua,
       '2' AS ky_vong
UNION ALL
SELECT '⭐ Chỉ mục cũ TOÀN PHẦN đã gỡ (nếu còn là ngõ cụt)',
       (SELECT COUNT(*)::TEXT FROM pg_indexes
         WHERE schemaname='public' AND indexname='uq_act_assignment'), '0'
UNION ALL
SELECT '⭐ Chỉ mục mới là MỘT PHẦN (WHERE deleted_at IS NULL)',
       (SELECT COUNT(*)::TEXT FROM pg_indexes
         WHERE schemaname='public' AND indexname='uq_act_assignment_active'
           AND indexdef ILIKE '%deleted_at IS NULL%'), '1'
UNION ALL
SELECT 'Policy FOR ALL đã gỡ',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE tablename='assignment_commercial_terms' AND policyname='assignment_internal_only'), '0'
UNION ALL
SELECT 'Ba policy tách riêng',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE tablename='assignment_commercial_terms'
           AND policyname IN ('act_select_active','act_insert_internal','act_update_internal')), '3'
UNION ALL
SELECT '⭐ SELECT CÓ lọc deleted_at (ẩn dòng đã xoá)',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE tablename='assignment_commercial_terms' AND policyname='act_select_active'
           AND qual ILIKE '%deleted_at IS NULL%'), '1'
UNION ALL
SELECT '⭐ UPDATE KHÔNG lọc deleted_at (giữ đường khôi phục)',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE tablename='assignment_commercial_terms' AND policyname='act_update_internal'
           AND qual NOT ILIKE '%deleted_at%'), '1'
UNION ALL
SELECT 'KHÔNG policy nào cho DELETE',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE tablename='assignment_commercial_terms' AND cmd = 'DELETE'), '0'
UNION ALL
SELECT 'RLS vẫn bật + cưỡng chế',
       (SELECT COUNT(*)::TEXT FROM pg_class
         WHERE relname='assignment_commercial_terms'
           AND relrowsecurity AND relforcerowsecurity), '1'
UNION ALL
SELECT '029 · 029b · 035 còn nguyên',
       ((SELECT COUNT(*) FROM public.partners)::TEXT || ' đối tác / ' ||
        (SELECT COUNT(*) FROM public.defect_catalog)::TEXT || ' mã lỗi'),
       '5 đối tác / 20 mã lỗi';
