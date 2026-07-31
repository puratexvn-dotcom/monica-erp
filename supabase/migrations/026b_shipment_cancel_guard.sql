-- ============================================================================
-- MONICA MOS — 026b · TRIGGER CHỈ TỪ CHỐI, KHÔNG TỰ LÀM THAY
--
-- Sửa một vi phạm Điều XXX / Quyết định 5 đã lên production từ migration 024.
--
-- ─── VẤN ĐỀ ──────────────────────────────────────────────────────────────
-- Trigger `shipment_release_cartons` của 024 làm việc này: lô hàng chuyển sang
-- CANCELLED thì nó TỰ xoá mềm mọi liên kết thùng.
--
-- Đó là TỰ ĐỘNG HOÁ NGHIỆP VỤ. Quyết định 5 của Kiến trúc sư vạch rõ ranh giới:
--
--     Trigger chỉ được  VALIDATE · REJECT · AUDIT.
--     Trigger KHÔNG được thay người dùng quyết định.
--
-- ─── PHƯƠNG ÁN (c) ĐÃ ĐƯỢC CHỌN ──────────────────────────────────────────
-- Ba lối đã trình: (a) giữ nguyên như ngoại lệ có hồ sơ · (b) chuyển sang
-- service và gỡ trigger · (c) đổi trigger từ TỰ LÀM thành TỪ CHỐI.
--
-- Kiến trúc sư chọn (c). Nó giữ nguyên độ chắc chắn của tầng CSDL — mọi đường
-- vào đều bị chặn, kể cả gọi thẳng PostgREST — mà không vi phạm ranh giới.
--
-- Phương án (b) sẽ để cái bẫy mở lại: chỉ mục `uq_shipment_carton_active` khoá
-- vĩnh viễn thùng của lô đã huỷ, và lỗi đó IM LẶNG.
--
-- ─── AN TOÀN ĐỂ ĐỔI ──────────────────────────────────────────────────────
-- Đã đo trước khi viết:
--   shipments        0 dòng
--   shipment_cartons 0 dòng
--   KHÔNG mã nguồn nào chuyển shipment sang CANCELLED (đã rà toàn bộ app/ lib/)
-- Nên đổi hành vi lúc này không gãy màn hình nào.
--
-- ⚠️ Đánh số 026b để KHÔNG phá dãy 027–032 đã được phê duyệt cho Assignment.
-- Đây là bản vá thuộc dòng Phase 6, chạy trước khối Assignment.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. GỠ TRIGGER TỰ ĐỘNG
-- ════════════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS shipment_release_cartons_trg ON public.shipments;
DROP FUNCTION IF EXISTS public.shipment_release_cartons();

-- ════════════════════════════════════════════════════════════════════════════
-- 2. THAY BẰNG TRIGGER TỪ CHỐI
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.shipment_cancel_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
DECLARE v INT;
BEGIN
  IF NEW.status = 'CANCELLED' AND COALESCE(OLD.status, '') <> 'CANCELLED' THEN
    SELECT COUNT(*) INTO v
      FROM public.shipment_cartons sc
     WHERE sc.shipment_id = NEW.id AND sc.deleted_at IS NULL;

    IF v > 0 THEN
      RAISE EXCEPTION
        'Không huỷ được lô hàng %: còn % thùng chưa được gỡ. Hãy gỡ thùng khỏi lô trước khi huỷ.',
        NEW.shipment_no, v
        USING ERRCODE = 'restrict_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- BEFORE, không phải AFTER: từ chối phải xảy ra TRƯỚC khi dòng được ghi.
-- AFTER cũng chặn được (giao dịch cuộn lại), nhưng BEFORE nói đúng ý định hơn
-- và không tốn công ghi rồi lùi.
DROP TRIGGER IF EXISTS shipment_cancel_guard_trg ON public.shipments;
CREATE TRIGGER shipment_cancel_guard_trg BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.shipment_cancel_guard();

COMMENT ON FUNCTION public.shipment_cancel_guard() IS
  'Bất biến dữ liệu: lô hàng CANCELLED không được còn thùng đang hiệu lực. '
  'CHỈ từ chối — việc gỡ thùng do tầng ứng dụng điều phối (Quyết định 5).';

-- ─── HỆ QUẢ PHẢI GHI RÕ ──────────────────────────────────────────────────
-- Việc gỡ thùng nay là TRÁCH NHIỆM CỦA TẦNG ỨNG DỤNG. Luồng huỷ lô hàng phải:
--   1. xoá mềm mọi shipment_cartons của lô  (deleted_at, deleted_by)
--   2. rồi mới chuyển status sang CANCELLED
-- Làm ngược thứ tự sẽ bị trigger này từ chối — và đó chính là điều mong muốn:
-- người dùng nhận một thông báo rõ ràng thay vì một thao tác âm thầm xoá dữ
-- liệu liên kết mà họ không biết.
--
-- Mã lỗi `restrict_violation` (23001) để tầng ứng dụng dịch sang câu tiếng Việt
-- riêng, không lẫn với 23505 (trùng khoá) hay 42501 (RLS chặn).

-- ════════════════════════════════════════════════════════════════════════════
-- 3. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Trigger TỰ ĐỘNG đã bị gỡ' AS muc,
       (SELECT COUNT(*)::TEXT FROM pg_trigger
         WHERE tgname = 'shipment_release_cartons_trg') AS ket_qua,
       '0' AS ky_vong
UNION ALL
SELECT 'Hàm tự động đã bị gỡ',
       (SELECT COUNT(*)::TEXT FROM pg_proc
         WHERE proname = 'shipment_release_cartons'
           AND pronamespace = 'public'::regnamespace), '0'
UNION ALL
SELECT 'Trigger TỪ CHỐI đã có',
       (SELECT COUNT(*)::TEXT FROM pg_trigger
         WHERE tgname = 'shipment_cancel_guard_trg'), '1'
UNION ALL
SELECT 'Nó là BEFORE (bit 1 của tgtype)',
       (SELECT (tgtype & 2 = 2)::TEXT FROM pg_trigger
         WHERE tgname = 'shipment_cancel_guard_trg'), 'true'
UNION ALL
SELECT 'Hai trigger đóng dấu của 024 còn nguyên',
       (SELECT COUNT(*)::TEXT FROM pg_trigger WHERE tgname IN
         ('shipment_stamp_trg', 'shipment_carton_stamp_trg')), '2'
UNION ALL
SELECT 'Chỉ mục một phần chống trùng thùng còn nguyên',
       (SELECT COUNT(*)::TEXT FROM pg_indexes
         WHERE indexname = 'uq_shipment_carton_active'), '1';
