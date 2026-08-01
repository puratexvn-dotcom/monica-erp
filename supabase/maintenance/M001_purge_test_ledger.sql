-- ============================================================================
-- MONICA MOS — MAINTENANCE SCRIPT M001
-- DỌN DƯ LƯỢNG KIỂM THỬ TRONG SỔ CÁI
--
-- ⚠️ ĐÂY KHÔNG PHẢI MIGRATION. Không đánh số theo dãy migration, không chạy tự
-- động, và phải có phê duyệt trước mỗi lần chạy.
--
-- ─── VÌ SAO CẦN MỘT TỆP RIÊNG ────────────────────────────────────────────
-- ADR-002 Quyết định 2 (REVISED): sổ cái `assignment_daily_reports` chỉ-ghi-thêm
-- với MỌI vai trò, **kể cả `service_role`**. Trigger `adr_append_only_trg` từ
-- chối mọi `UPDATE`/`DELETE`.
--
-- Kiến trúc sư đã bác đề nghị chừa một cửa cho khoá quản trị, và bác đúng:
--
--     "Khác nhau không nằm ở QUYỀN. Nó nằm ở DẤU VẾT."
--
-- Migration · Maintenance Script · Recovery Procedure đều là hành động **có chủ
-- ý, có rà soát, có lưu vết** — chúng gỡ trigger một cách công khai rồi gắn lại.
-- Một ngoại lệ trong trigger thì không để lại dấu gì.
--
-- Tệp này LÀ con đường đó, được viết ra thay vì được ứng biến.
--
-- ─── DƯ LƯỢNG CẦN DỌN ────────────────────────────────────────────────────
-- Bản nháp `031_assignment_rls.DRAFT.sql` được chạy sớm hơn dự kiến. Bài kiểm
-- chẩn đoán chạy sau đó đã chứng minh policy `adr_write_partner` đang sống —
-- bằng cách GHI THẬT một dòng sổ cái. Dòng đó không xoá được bằng đường thường.
--
--     assignment_daily_reports   1 dòng   report_date 2026-08-01, output 90
--     assignments                1 dòng   ASG-GEN-2026-00147, IN_PROGRESS
--
-- ⚠️ Cả hai đều là DỮ LIỆU KIỂM THỬ, không phải nghiệp vụ. Không đối tác thật
-- nào có tài khoản (`partner_accounts` = 0 dòng), và phần việc này được lập bởi
-- một tài khoản tạm đã bị xoá.
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. XÁC NHẬN TRƯỚC KHI XOÁ — không xoá mù
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Chốt an toàn: TỪ CHỐI CHẠY nếu số dòng khác kỳ vọng. Nếu ai đó đã lập một
-- phần việc THẬT trong lúc chờ, tệp này phải dừng lại chứ không được xoá nó.
DO $$
DECLARE v_asg INTEGER; v_dr INTEGER; v_acct INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_asg  FROM public.assignments;
  SELECT COUNT(*) INTO v_dr   FROM public.assignment_daily_reports;
  SELECT COUNT(*) INTO v_acct FROM public.partner_accounts;

  IF v_asg <> 1 OR v_dr <> 1 THEN
    RAISE EXCEPTION
      'DỪNG LẠI: chờ đúng 1 phần việc và 1 dòng sổ cái, thấy % và %. '
      'Có thể đã có dữ liệu THẬT — hãy rà bằng tay trước khi chạy tệp này.',
      v_asg, v_dr
      USING ERRCODE = 'data_exception';
  END IF;

  IF v_acct > 0 THEN
    RAISE EXCEPTION
      'DỪNG LẠI: có % tài khoản đối tác. Dữ liệu có thể đã là thật.', v_acct
      USING ERRCODE = 'data_exception';
  END IF;

  -- Phần việc phải là dòng do bài kiểm lập: người tạo đã bị xoá (created_by NULL
  -- vì ON DELETE SET NULL) và chưa từng được giao chính thức.
  IF NOT EXISTS (
    SELECT 1 FROM public.assignments
     WHERE assignment_no = 'ASG-GEN-2026-00147' AND created_by IS NULL
  ) THEN
    RAISE EXCEPTION
      'DỪNG LẠI: phần việc không khớp dấu vết của bài kiểm (ASG-GEN-2026-00147, '
      'created_by NULL). KHÔNG xoá.'
      USING ERRCODE = 'data_exception';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. GỠ TRIGGER — CÔNG KHAI, TRONG MỘT GIAO DỊCH
-- ════════════════════════════════════════════════════════════════════════════
-- Đây là điểm khác biệt giữa tệp này và một ngoại lệ giấu trong trigger: việc
-- gỡ nằm trong git, có người duyệt, và tự gắn lại ở Mục 4.
DROP TRIGGER IF EXISTS adr_append_only_trg ON public.assignment_daily_reports;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. XOÁ
-- ════════════════════════════════════════════════════════════════════════════
DELETE FROM public.assignment_daily_reports
 WHERE assignment_id IN (
   SELECT id FROM public.assignments WHERE assignment_no = 'ASG-GEN-2026-00147');

DELETE FROM public.assignments WHERE assignment_no = 'ASG-GEN-2026-00147';

-- ════════════════════════════════════════════════════════════════════════════
-- 4. GẮN LẠI TRIGGER — BẮT BUỘC, TRONG CÙNG GIAO DỊCH
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Nằm trong cùng `BEGIN…COMMIT` với Mục 2 nên KHÔNG có khoảnh khắc nào sổ cái
-- mất bảo vệ. Nếu bất kỳ bước nào ở trên hỏng, giao dịch cuộn lại và trigger
-- chưa từng bị gỡ.
CREATE TRIGGER adr_append_only_trg
  BEFORE UPDATE OR DELETE ON public.assignment_daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.ledger_append_only();

-- ════════════════════════════════════════════════════════════════════════════
-- 5. KIỂM TRA
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_trg INTEGER; v_dr INTEGER; v_asg INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_trg FROM pg_trigger WHERE tgname = 'adr_append_only_trg';
  SELECT COUNT(*) INTO v_dr  FROM public.assignment_daily_reports;
  SELECT COUNT(*) INTO v_asg FROM public.assignments;

  IF v_trg <> 1 THEN
    RAISE EXCEPTION 'TRIGGER CHƯA GẮN LẠI — TUYỆT ĐỐI KHÔNG COMMIT.';
  END IF;
  RAISE NOTICE 'Đã dọn. Sổ cái % dòng · phần việc % dòng · trigger đã gắn lại.', v_dr, v_asg;
END $$;

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Sổ cái' AS muc, (SELECT COUNT(*)::TEXT FROM public.assignment_daily_reports) AS ket_qua, '0' AS ky_vong
UNION ALL
SELECT 'Phần việc', (SELECT COUNT(*)::TEXT FROM public.assignments), '0'
UNION ALL
SELECT '⭐ Trigger append-only ĐÃ GẮN LẠI',
       (SELECT COUNT(*)::TEXT FROM pg_trigger WHERE tgname = 'adr_append_only_trg'), '1'
UNION ALL
SELECT 'Dữ liệu nghiệp vụ còn nguyên',
       ((SELECT COUNT(*) FROM public.partners)::TEXT || ' đối tác / ' ||
        (SELECT COUNT(*) FROM public.orders)::TEXT || ' đơn hàng / ' ||
        (SELECT COUNT(*) FROM public.defect_catalog)::TEXT || ' mã lỗi'),
       '5 đối tác / 3 đơn hàng / 20 mã lỗi';
