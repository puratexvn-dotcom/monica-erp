-- ============================================================================
-- MONICA MOS — MAINTENANCE SCRIPT M002
-- DỌN MỘT PHẦN VIỆC KIỂM THỬ VÀ SỔ CÁI CỦA NÓ   (bản DÙNG LẠI ĐƯỢC)
--
-- ⚠️ KHÔNG PHẢI MIGRATION. Không chạy tự động. Phải có phê duyệt mỗi lần chạy.
--
-- ─── VÌ SAO CÓ TỆP THỨ HAI ───────────────────────────────────────────────
-- M001 dọn xong dư lượng của bản nháp 031. Ngay sau đó, TÔI TẠO RA DƯ LƯỢNG
-- MỚI: để xác nhận trigger `adr_append_only_trg` đã được gắn lại, tôi ghi một
-- dòng sổ cái rồi thử xoá. Lệnh xoá bị chặn — đúng như mong đợi — nên dòng đó
-- **kẹt lại vĩnh viễn**.
--
-- ⚠️ Phép kiểm đó là THỪA. M001 đã có sẵn khối xác nhận đọc `pg_trigger` và
-- từ chối `COMMIT` nếu trigger chưa gắn lại. Tôi kiểm lại một điều đã được
-- chứng minh, và trả giá bằng đúng thứ mà cả quy trình sinh ra để tránh.
--
-- Bài học ghi vào đây thay vì ghi trong đầu: **với bảng chỉ-ghi-thêm, mọi phép
-- kiểm phải hỏi lược đồ, KHÔNG được hỏi bằng cách ghi thử.**
--
-- ─── VÌ SAO TỆP NÀY DÙNG LẠI ĐƯỢC, CÒN M001 THÌ KHÔNG ────────────────────
-- M001 viết cứng một số hiệu. Tệp này nhận số hiệu ở Mục 1 — vì lớp dư lượng
-- này sẽ còn xuất hiện, và mỗi lần lại viết một tệp mới là cách chắc chắn để
-- lần thứ ba ai đó ứng biến bằng cách gỡ trigger rồi quên gắn lại.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. KHAI SỐ HIỆU CẦN DỌN  ← SỬA Ở ĐÂY, KHÔNG SỬA CHỖ NÀO KHÁC
-- ════════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TEMP TABLE _purge_target ON COMMIT DROP AS
SELECT 'ASG-GEN-2026-00148'::TEXT AS assignment_no;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. BỐN CHỐT AN TOÀN — không xoá mù
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_no TEXT; v_id UUID; v_status TEXT; v_by UUID; v_acct INTEGER;
BEGIN
  SELECT assignment_no INTO v_no FROM _purge_target;

  SELECT id, status, created_by INTO v_id, v_status, v_by
    FROM public.assignments WHERE assignment_no = v_no;

  -- ① Phải tồn tại
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'DỪNG LẠI: không tìm thấy phần việc %. Có thể đã dọn rồi.', v_no
      USING ERRCODE = 'no_data_found';
  END IF;

  -- ② Phải là dấu vết của bài kiểm: người tạo đã bị xoá (ON DELETE SET NULL)
  IF v_by IS NOT NULL THEN
    RAISE EXCEPTION
      'DỪNG LẠI: phần việc % có created_by — nhiều khả năng do NGƯỜI THẬT lập. KHÔNG xoá.', v_no
      USING ERRCODE = 'data_exception';
  END IF;

  -- ③ Chưa từng đi vào vận hành thật
  IF v_status NOT IN ('DRAFT', 'IN_PROGRESS') THEN
    RAISE EXCEPTION
      'DỪNG LẠI: phần việc % đang ở trạng thái % — đã đi xa hơn dữ liệu thử.', v_no, v_status
      USING ERRCODE = 'data_exception';
  END IF;

  -- ④ Chưa đối tác thật nào có tài khoản ⇒ chưa thể có sổ cái thật
  SELECT COUNT(*) INTO v_acct FROM public.partner_accounts WHERE is_active;
  IF v_acct > 0 THEN
    RAISE EXCEPTION
      'DỪNG LẠI: có % tài khoản đối tác đang hoạt động. Sổ cái có thể là dữ liệu THẬT.', v_acct
      USING ERRCODE = 'data_exception';
  END IF;

  RAISE NOTICE 'Bốn chốt an toàn đã qua. Chuẩn bị dọn % (%).', v_no, v_status;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. GỠ TRIGGER — CÔNG KHAI
-- ════════════════════════════════════════════════════════════════════════════
-- Đây là điều phân biệt tệp này với một ngoại lệ giấu trong trigger: việc gỡ
-- nằm trong git, có người duyệt, và tự gắn lại ở Mục 5 trong cùng giao dịch.
DROP TRIGGER IF EXISTS adr_append_only_trg ON public.assignment_daily_reports;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. XOÁ
-- ════════════════════════════════════════════════════════════════════════════
DELETE FROM public.assignment_daily_reports
 WHERE assignment_id IN (
   SELECT a.id FROM public.assignments a
     JOIN _purge_target t ON t.assignment_no = a.assignment_no);

DELETE FROM public.assignment_commercial_terms
 WHERE assignment_id IN (
   SELECT a.id FROM public.assignments a
     JOIN _purge_target t ON t.assignment_no = a.assignment_no);

DELETE FROM public.assignment_bundles
 WHERE assignment_id IN (
   SELECT a.id FROM public.assignments a
     JOIN _purge_target t ON t.assignment_no = a.assignment_no);

DELETE FROM public.assignments a
 USING _purge_target t
 WHERE a.assignment_no = t.assignment_no;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. GẮN LẠI TRIGGER — BẮT BUỘC, CÙNG GIAO DỊCH
-- ════════════════════════════════════════════════════════════════════════════
CREATE TRIGGER adr_append_only_trg
  BEFORE UPDATE OR DELETE ON public.assignment_daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.ledger_append_only();

-- ════════════════════════════════════════════════════════════════════════════
-- 6. TỪ CHỐI COMMIT NẾU TRIGGER CHƯA VỀ CHỖ
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Đây là phép kiểm ĐÚNG cho một bảng chỉ-ghi-thêm: **hỏi lược đồ**, không
-- hỏi bằng cách ghi thử. Đúng chỗ tôi đã làm sai và sinh ra tệp này.
DO $$
DECLARE v_trg INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_trg FROM pg_trigger
   WHERE tgname = 'adr_append_only_trg' AND NOT tgisinternal;
  IF v_trg <> 1 THEN
    RAISE EXCEPTION 'TRIGGER CHƯA GẮN LẠI (thấy %) — TUYỆT ĐỐI KHÔNG COMMIT.', v_trg;
  END IF;
  RAISE NOTICE 'Trigger append-only đã về chỗ.';
END $$;

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- 7. SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Phần việc' AS muc, (SELECT COUNT(*)::TEXT FROM public.assignments) AS ket_qua, '0' AS ky_vong
UNION ALL
SELECT 'Sổ cái', (SELECT COUNT(*)::TEXT FROM public.assignment_daily_reports), '0'
UNION ALL
SELECT '⭐ Trigger append-only đã gắn lại',
       (SELECT COUNT(*)::TEXT FROM pg_trigger
         WHERE tgname = 'adr_append_only_trg' AND NOT tgisinternal), '1'
UNION ALL
SELECT 'Dữ liệu nghiệp vụ còn nguyên',
       ((SELECT COUNT(*) FROM public.partners)::TEXT || ' đối tác / ' ||
        (SELECT COUNT(*) FROM public.orders)::TEXT || ' đơn hàng / ' ||
        (SELECT COUNT(*) FROM public.defect_catalog)::TEXT || ' mã lỗi'),
       '5 đối tác / 3 đơn hàng / 20 mã lỗi';
