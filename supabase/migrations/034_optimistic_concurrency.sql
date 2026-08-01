-- ============================================================================
-- MONICA MOS — 034 · OPTIMISTIC CONCURRENCY CONTROL
--
-- Thiết kế: docs/adr/ADR-004-concurrency-control.md (ĐÃ PHÊ DUYỆT)
--
-- ⚠️ ĐÂY LÀ CHIẾC CHÌA KHOÁ CUỐI CÙNG MỞ CỬA 031.
-- Cho tới khi tệp này chạy, Last-Write-Wins vẫn đang hiệu lực, và Portal đối
-- tác KHÔNG được mở quyền GHI.
--
-- ─── VÌ SAO ──────────────────────────────────────────────────────────────
-- Sau 031, `assignments` chuyển từ MỘT bên ghi sang HAI bên ghi:
--
--     MONICA                        ĐỐI TÁC
--     đổi planned_finish            → ACCEPTED
--     đổi assigned_qty              → REJECTED
--     → SUSPENDED / CANCELLED       → COMPLETED
--
-- ⚠️ Điểm nặng nhất KHÔNG phải mất dữ liệu, mà là LỖ HỔNG PHÂN QUYỀN:
-- `planned_start`/`planned_finish` **chính là cửa sổ quyền ghi** của đối tác
-- (`canWriteOperational`). Một lần ghi đè vô ý vào hai cột đó **thay đổi quyền
-- của một bên bên ngoài** — im lặng, và audit không phân biệt được với một lần
-- gia hạn có chủ ý.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. CỘT PHIÊN BẢN
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ `INTEGER` chứ KHÔNG dùng `updated_at` làm thẻ phiên bản. Ba lý do, cả ba
-- đều là ca hỏng thật:
--   ① hai lệnh trong cùng một micro-giây cho CÙNG một mốc thời gian — hiếm với
--      người gõ tay, KHÔNG hiếm với import hàng loạt và tác nhân tự động;
--   ② `TIMESTAMPTZ` đi qua JSON rồi quay về có thể MẤT ĐỘ CHÍNH XÁC, và một
--      chênh lệch một micro-giây biến thành XUNG ĐỘT GIẢ;
--   ③ đồng hồ có thể lùi. Số nguyên đơn điệu thì không.
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.assignment_commercial_terms
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- ⚠️ CỐ Ý KHÔNG thêm vào ba bảng còn lại của 029:
--
--   assignment_daily_reports   SỔ CÁI CHỈ GHI THÊM — trigger từ chối mọi UPDATE
--                              với mọi vai trò. Không có UPDATE thì KHÔNG CÓ
--                              XUNG ĐỘT GHI ĐÈ. Bảng chỉ-ghi-thêm MIỄN NHIỄM.
--   assignment_bundles         chỉ Monica ghi, và thao tác là GẮN/GỠ chứ không
--                              phải sửa nội dung.
--   contract_types             danh mục, một người quản trị.
--
-- Thêm `version` vào những bảng đó là bắt mọi lệnh ghi mang theo một con số
-- không ai đọc — Điều XXIX của Playbook.

-- ════════════════════════════════════════════════════════════════════════════
-- 2. TRIGGER — TĂNG PHIÊN BẢN, VÀ TỪ CHỐI GHI TRÊN DỮ LIỆU CŨ
-- ════════════════════════════════════════════════════════════════════════════
-- Hàm này làm HAI việc, và việc thứ hai là thứ thật sự có giá trị.
--
-- ─── ĐIỀU MỘT TRIGGER LÀM ĐƯỢC, VÀ ĐIỀU NÓ KHÔNG LÀM ĐƯỢC ────────────────
-- ⚠️ Trigger **KHÔNG THỂ** ép máy khách phải gửi phiên bản. plpgsql không biết
-- cột nào có mặt trong danh sách `SET` — nó chỉ thấy `NEW`, và cột không được
-- gửi thì `NEW` mang đúng giá trị cũ. Một lệnh `UPDATE` quên phiên bản trông y
-- hệt một lệnh gửi đúng phiên bản.
--
-- Nên có HAI đường phát hiện xung đột, bổ sung cho nhau:
--
--   ① Máy khách gửi `version` trong payload
--      → trigger so với `OLD.version`; lệch ⇒ TỪ CHỐI ngay tại đây.
--      Đây là đường ĐƠN GIẢN NHẤT cho tầng Service: chỉ cần thêm một trường
--      vào object, không phải dựng thêm mệnh đề `WHERE`.
--
--   ② Máy khách dùng `WHERE id = ? AND version = ?`
--      → 0 dòng bị ảnh hưởng ⇒ tầng Service tự nhận ra xung đột.
--
-- Cả hai đều hợp lệ. Bài kiểm hợp đồng canh cho tầng Service dùng ÍT NHẤT MỘT.
CREATE OR REPLACE FUNCTION public.mos_bump_version()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
  -- ① Máy khách gửi một phiên bản KHÁC bản đang có ⇒ nó đọc dữ liệu từ lúc
  --    trước, và ai đó đã ghi đè trong khoảng giữa.
  IF NEW.version IS DISTINCT FROM OLD.version THEN
    RAISE EXCEPTION
      'Bản ghi đã được người khác sửa (phiên bản % → %). Hãy tải lại rồi thao tác lại.',
      NEW.version, OLD.version
      USING ERRCODE = 'P0409';   -- xem Mục 3 về việc chọn mã này
  END IF;

  -- ② Mọi lệnh ghi đều đẩy phiên bản lên. Máy khách KHÔNG BAO GIỜ tự đặt số
  --    này — nhánh trên đã chặn mọi giá trị khác `OLD.version`.
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.mos_bump_version() IS
  'Optimistic Concurrency Control — ADR-004. Tăng version mỗi lần ghi, và từ '
  'chối khi máy khách gửi một phiên bản đã cũ. KHÔNG ép được máy khách phải '
  'gửi: plpgsql không biết cột nào có trong danh sách SET.';

DROP TRIGGER IF EXISTS assignments_version_trg ON public.assignments;
CREATE TRIGGER assignments_version_trg
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.mos_bump_version();

DROP TRIGGER IF EXISTS act_version_trg ON public.assignment_commercial_terms;
CREATE TRIGGER act_version_trg
  BEFORE UPDATE ON public.assignment_commercial_terms
  FOR EACH ROW EXECUTE FUNCTION public.mos_bump_version();

-- ⚠️ THỨ TỰ TRIGGER: PostgreSQL chạy trigger cùng loại theo THỨ TỰ TÊN.
--     act_stamp_trg  <  act_version_trg              (a-c-t-_-s < a-c-t-_-v)
--     assignments_stamp_trg  <  assignments_version_trg
-- Cả hai trigger đóng dấu đều chỉ chạm `updated_at`/`updated_by`, còn trigger
-- này chỉ chạm `version` — không giẫm chân nhau dù chạy theo thứ tự nào. Ghi ra
-- vì thứ tự trigger là thứ rất dễ trở thành lỗi khó tìm khi có bên thứ ba.

-- ════════════════════════════════════════════════════════════════════════════
-- 3. VỀ MÃ LỖI `P0409`
-- ════════════════════════════════════════════════════════════════════════════
-- Đây là mã TỰ ĐẶT, không phải mã chuẩn của PostgreSQL. Ghi rõ vì sao:
--
--   ✗ `40001 serialization_failure` — nghe hợp nhất, nhưng RẤT NHIỀU thư viện
--     và ORM coi 40001 là "thử lại được" và tự động chạy lại lệnh. Ở đây thử
--     lại là SAI: lệnh cũ mang dữ liệu đã cũ, chạy lại chỉ ghi đè lần nữa.
--     Mutation Policy đã chốt `retry: 0` cho mọi lệnh ghi.
--
--   ✗ `23001 restrict_violation` — đang dùng cho các trigger nghiệp vụ (I-8,
--     I-9, sổ cái). Dùng chung thì tầng Service không phân biệt được "vi phạm
--     luật nghiệp vụ" với "xung đột ghi đè" — hai thứ cần hai câu trả lời khác
--     nhau cho người dùng.
--
--   ✓ `P0409` — lớp `P0` là lớp lỗi của plpgsql; `P0409` chưa được dùng, và
--     con số gợi thẳng tới HTTP 409 Conflict. Không thư viện nào tự thử lại nó.
--
-- ⚠️ `friendlyDbError` PHẢI ánh xạ mã này thành câu người vận hành đọc hiểu,
-- kèm lối ra rõ ràng: *"bản ghi đã được người khác sửa — tải lại"*. Để lọt
-- thông điệp thô là để người dùng đọc một câu tiếng Anh có số hiệu.

-- ════════════════════════════════════════════════════════════════════════════
-- 4. HỢP ĐỒNG VỚI TẦNG SERVICE — SQL KHÔNG ÉP ĐƯỢC
-- ════════════════════════════════════════════════════════════════════════════
--   ① Mọi DTO đọc ra của hai bảng trên PHẢI mang `version`.
--   ② Mọi lệnh sửa PHẢI gửi lại `version` đã đọc — hoặc trong payload (đường ①
--      ở Mục 2), hoặc trong `WHERE` (đường ②).
--   ③ Bắt `P0409` và dịch thành câu người vận hành hiểu được.
--   ④ Giao diện phải cho **tải lại bằng một cú bấm** — báo xung đột mà không có
--      lối ra là đẩy người dùng vào ngõ cụt.
--
-- ⚠️ Quên bước ② là MẤT BẢO VỆ TRONG IM LẶNG: lệnh ghi vẫn thành công, version
-- vẫn tăng, và ghi đè vẫn xảy ra như trước. Phép kiểm hợp đồng canh đúng điều này.

-- ════════════════════════════════════════════════════════════════════════════
-- 5. HOÀN TÁC
-- ════════════════════════════════════════════════════════════════════════════
--   DROP TRIGGER IF EXISTS assignments_version_trg ON public.assignments;
--   DROP TRIGGER IF EXISTS act_version_trg ON public.assignment_commercial_terms;
--   DROP FUNCTION IF EXISTS public.mos_bump_version();
--   ALTER TABLE public.assignments              DROP COLUMN IF EXISTS version;
--   ALTER TABLE public.assignment_commercial_terms DROP COLUMN IF EXISTS version;
--
-- Hoàn tác SẠCH — cột chỉ thêm vào, không đổi nghĩa cột nào đang có.
--
-- ⚠️ Nhưng nếu hoàn tác SAU KHI 031 đã mở quyền ghi cho Portal đối tác thì đó
-- KHÔNG phải thao tác kỹ thuật mà là **HẠ CẤP BẢO MẬT**: hai bên lại ghi đè
-- nhau, và cửa sổ quyền lại đổi được trong im lặng. Hoàn tác chỉ hợp lệ khi
-- Portal còn đóng.

-- ════════════════════════════════════════════════════════════════════════════
-- 6. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Hai cột version' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema='public' AND column_name='version'
           AND table_name IN ('assignments','assignment_commercial_terms')) AS ket_qua,
       '2' AS ky_vong
UNION ALL
SELECT 'Cả hai NOT NULL, mặc định 1',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema='public' AND column_name='version'
           AND is_nullable='NO' AND column_default LIKE '%1%'
           AND table_name IN ('assignments','assignment_commercial_terms')), '2'
UNION ALL
SELECT 'Kiểu INTEGER (không phải timestamp)',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema='public' AND column_name='version'
           AND data_type='integer'
           AND table_name IN ('assignments','assignment_commercial_terms')), '2'
UNION ALL
SELECT 'Hàm mos_bump_version',
       (SELECT COUNT(*)::TEXT FROM pg_proc WHERE proname='mos_bump_version'), '1'
UNION ALL
SELECT 'Hai trigger BEFORE UPDATE',
       (SELECT COUNT(*)::TEXT FROM pg_trigger
         WHERE tgname IN ('assignments_version_trg','act_version_trg')), '2'
UNION ALL
SELECT '⚠️ CỐ Ý không đụng sổ cái (append-only ⇒ miễn nhiễm)',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema='public' AND column_name='version'
           AND table_name IN ('assignment_daily_reports','assignment_bundles','contract_types')), '0'
UNION ALL
SELECT 'Dữ liệu cũ nhận version = 1',
       (SELECT COALESCE(MIN(version)::TEXT, 'không có dòng nào') FROM public.assignments),
       'không có dòng nào'
UNION ALL
SELECT '029 · 035 · 036 còn nguyên',
       ((SELECT COUNT(*) FROM public.partners)::TEXT || ' đối tác / ' ||
        (SELECT COUNT(*) FROM public.defect_catalog)::TEXT || ' mã lỗi'),
       '5 đối tác / 20 mã lỗi';
