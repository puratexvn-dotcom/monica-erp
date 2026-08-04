-- ============================================================================
-- MONICA ONE — 045b · ÁP ĐÚNG BOARD DECISION `A1`
--
-- 📐 Board Decision `A1` — 05/08/2026:
--    *"`final_states = { APPROVED }`. `SUPERSEDED` không thuộc `final_states`."*
--
-- ⛔ CHƯA CHẠY. Cần Board chạy trên SQL Editor.
--
-- ─── VÌ SAO CÓ TỆP NÀY ───────────────────────────────────────────────────
--
-- `045` được chạy từ bản commit `74da7393` — bản CSA soạn TRƯỚC khi Board phán
-- quyết `A1`, còn mang `final_states = {APPROVED, SUPERSEDED}`. Bản đã sửa theo
-- `A1` nằm ở commit `f0da1e9d`.
--
-- Đo được trên CSDL đang chạy, không suy diễn:
--
--     SELECT final_states FROM public.mos_aggregate_immutability
--      WHERE table_name = 'costings';
--     →  {"APPROVED","SUPERSEDED"}          ⛔ trái `A1`
--
--     vai `md`, chiết tính `SUPERSEDED`:
--       đổi `status`        → không lỗi
--       đổi `quoted_price`  → LỖI 23514     ⛔ trigger đang khoá, trái `A1`
--
-- ─── 🔑 ĐIỀU TỆP NÀY CHỨNG MINH ──────────────────────────────────────────
--
-- Sửa một phán quyết Board tốn **một lệnh `UPDATE` trên một bảng dữ liệu**.
--
--   ⛔ Không sửa hàm `mos_guard_aggregate_immutability()`
--   ⛔ Không sửa trigger
--   ⛔ Không sửa kiến trúc
--   ⛔ Không viết lại `045`
--
-- Và quan trọng hơn: **sai lệch tìm ra được bằng một câu `SELECT`.** Nếu luật
-- nằm trong thân hàm PL/pgSQL, phải đọc mã hàm trên CSDL rồi so với kho mới
-- biết — đúng chỗ đã làm tôi kết luận sai ba lần với `B-1`.
--
-- Luật là **dữ liệu** ⇒ luật **đo được**. Đó là `WF-1` của EDD-04, và đây là
-- lần đầu nó trả cổ tức.
--
-- ─── VÌ SAO KHÔNG SỬA THẲNG QUA PostgREST ────────────────────────────────
--
-- `service_role` sửa được bảng này. Nhưng `045` Mục 1 đã ghi: *"Sửa nó là đổi
-- luật bất biến ⇒ phải đi qua migration, để lại dấu vết."* Sửa thẳng là tự phá
-- quy tắc mình vừa đặt, và tạo đúng loại lệch kho-⟷-CSDL mà `043` đã gây ra.
-- ============================================================================

BEGIN;

UPDATE public.mos_aggregate_immutability
   SET final_states = ARRAY['APPROVED'],
       note = 'Board Decision A1 · 05/08/2026. SUPERSEDED CỐ Ý không nằm trong '
              'final_states — transition sang SUPERSEDED thuộc Workflow Engine '
              '(W.1). Áp bằng 045b sau khi 045 chạy nhầm bản tiền-A1.',
       updated_at = NOW()
 WHERE table_name = 'costings';

-- Không đúng một dòng thì dừng — hoặc khai báo biến mất, hoặc có bản sao.
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM public.mos_aggregate_immutability
   WHERE table_name = 'costings' AND final_states = ARRAY['APPROVED'];
  IF n <> 1 THEN
    RAISE EXCEPTION '045b DỪNG: chờ đúng 1 khai báo costings với final_states '
      '= {APPROVED}, đếm được %.', n;
  END IF;
END $$;

COMMIT;

-- ─── HỆ QUẢ CÓ CHỦ Ý, ĐÃ BÁO TRƯỚC ──────────────────────────────────────────
-- Sau `045b`, chiết tính `SUPERSEDED` **sửa nội dung được** — không còn lớp nào
-- chặn. Đây là hệ quả trực tiếp của `A1`, đã ghi ở
-- `docs/architecture/AGGREGATE_IMMUTABILITY_MATRIX.md` §0.1 và được đo mỗi vòng
-- ở `tests/security/costing-lifecycle.test.mjs` mục `D`.
--
-- Board xem số thật rồi quyết: mở rộng `final_states`, hay giao hẳn cho Workflow
-- Engine. Cả hai đường đều tốn **một mảng**, không tốn một dòng mã.

-- ─── HOÀN TÁC ───────────────────────────────────────────────────────────────
--   UPDATE public.mos_aggregate_immutability
--      SET final_states = ARRAY['APPROVED','SUPERSEDED']
--    WHERE table_name = 'costings';

-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY
-- ============================================================================
SELECT 'final_states của costings' AS muc,
       (SELECT array_to_string(final_states, ',')
          FROM public.mos_aggregate_immutability
         WHERE table_name = 'costings') AS ket_qua,
       'APPROVED' AS ky_vong
UNION ALL
SELECT 'mutable_after_final GIỮ NGUYÊN',
       (SELECT array_to_string(mutable_after_final, ',')
          FROM public.mos_aggregate_immutability
         WHERE table_name = 'costings'),
       'status,approved_by,approved_at'
UNION ALL
SELECT '⭐ Hàm engine KHÔNG bị đụng tới',
       (SELECT COUNT(*)::TEXT FROM pg_proc
         WHERE proname = 'mos_guard_aggregate_immutability'), '1'
UNION ALL
SELECT '⭐ Trigger KHÔNG bị đụng tới',
       (SELECT COUNT(*)::TEXT FROM pg_trigger
         WHERE tgname = 'mos_immutability_trg'), '1';
