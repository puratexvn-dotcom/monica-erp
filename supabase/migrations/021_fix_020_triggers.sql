-- ============================================================================
-- MONICA MOS — 021 · VÁ HAI LỖI CỦA MIGRATION 020
--
-- 020 chạy thành công về mặt cú pháp nhưng SAI VỀ HÀNH VI. Hai lỗi dưới đây do
-- kiểm thử thực nghiệm trên cơ sở dữ liệu thật phát hiện, không phải do đọc lại
-- mã mà thấy.
--
-- Vá bằng CREATE OR REPLACE nên chỉ thay thân hàm; trigger, bảng, chỉ mục và
-- dữ liệu đang có giữ nguyên. Không cần chạy lại 020.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- LỖI 1 — MỌI CUỘN ĐỀU BỊ ĐÁNH TRƯỢT
-- ════════════════════════════════════════════════════════════════════════════
-- `total_points` là cột GENERATED ALWAYS. PostgreSQL tính cột sinh tự động
-- SAU KHI trigger BEFORE chạy xong, nên trong `wh_inspection_prepare` giá trị
-- NEW.total_points còn là NULL.
--
-- Hệ quả: NULL * 100 / diện_tích  →  NULL
--         NULL <= ngưỡng          →  NULL  (không phải TRUE, cũng không FALSE)
--         CASE WHEN NULL          →  rơi xuống nhánh ELSE  →  'FAILED'
--
-- Tức MỌI phiếu kiểm đều kết luận TRƯỢT, kể cả vải hoàn hảo không một vết lỗi.
--
-- ⚠️ VÌ SAO SUÝT LỌT: hai trong ba ca thử đầu tiên vốn dĩ phải trượt, nên
-- chúng vẫn "đúng" và che mất lỗi. Chỉ ca có vải ĐẠT mới lộ ra. Bài học: ca
-- kiểm thử phải phủ cả nhánh THÀNH CÔNG, không chỉ nhánh thất bại.
--
-- Sửa: tự cộng điểm từ bốn cột gốc — đó là những cột NGƯỜI DÙNG NHẬP nên chúng
-- đã có giá trị ngay trong trigger BEFORE. Công thức trọng số giữ y hệt định
-- nghĩa của cột sinh ở migration 017, nên hai nơi không thể lệch nhau.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.wh_inspection_prepare()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit  NUMERIC(8,2);
  v_total  INTEGER;
BEGIN
  -- Cộng tay từ bốn cột gốc. KHÔNG đọc NEW.total_points: cột sinh tự động chưa
  -- được tính ở thời điểm trigger BEFORE chạy.
  v_total := COALESCE(NEW.points_1,0) * 1
           + COALESCE(NEW.points_2,0) * 2
           + COALESCE(NEW.points_3,0) * 3
           + COALESCE(NEW.points_4,0) * 4;

  IF NEW.inspected_length_m IS NOT NULL AND NEW.inspected_width_m IS NOT NULL
     AND NEW.inspected_length_m > 0 AND NEW.inspected_width_m > 0 THEN
    NEW.inspected_area_sqyd :=
      ROUND(NEW.inspected_length_m * NEW.inspected_width_m * 1.19599004630108, 3);
  END IF;

  IF NEW.customer_id IS NOT NULL THEN
    SELECT c.four_point_limit INTO v_limit FROM public.customers c WHERE c.id = NEW.customer_id;
    IF v_limit IS NOT NULL AND v_limit > 0 THEN
      NEW.acceptance_limit := v_limit;
    END IF;
  END IF;

  IF COALESCE(NEW.inspected_area_sqyd, 0) > 0 THEN
    NEW.result := CASE
      WHEN v_total * 100.0 / NEW.inspected_area_sqyd <= NEW.acceptance_limit
      THEN 'PASSED' ELSE 'FAILED' END;
  ELSE
    NEW.result := 'PENDING';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- LỖI 2 — KHÔNG GIỮ CHỖ ĐƯỢC CUỘN NÀO
-- ════════════════════════════════════════════════════════════════════════════
-- `record "r" is not assigned yet`
--
-- Trong `wh_sync_reserved` tôi khai một biến RECORD tên `r` cho vòng lặp, rồi ở
-- một câu lệnh khác lại dùng CHÍNH CHỮ `r` làm bí danh bảng:
--
--     DECLARE r RECORD;
--     ...
--     SELECT SUM(r.reserved_qty) FROM public.stock_reservations r
--
-- plpgsql ưu tiên BIẾN hơn bí danh bảng, nên `r.reserved_qty` bị hiểu là trường
-- của biến record chưa gán, và cả trigger văng lỗi. Vì đây là trigger AFTER
-- INSERT nên MỌI phiếu giữ chỗ đều bị chặn — tức toàn bộ luồng phân bổ đứng.
--
-- Sửa: đặt tên biến không đụng bất kỳ bí danh nào (`v_bin_row`).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.wh_sync_reserved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mat     UUID := COALESCE(NEW.material_id, OLD.material_id);
  v_rest    NUMERIC(14,3);
  v_bin_row RECORD;          -- KHÔNG đặt tên `r`: trùng bí danh bảng bên dưới
  v_take    NUMERIC(14,3);
BEGIN
  UPDATE public.stock_levels SET reserved_qty = 0 WHERE material_id = v_mat;

  -- Bước 1: phiếu gắn CUỘN — trừ đúng ô kệ đang chứa cuộn đó
  UPDATE public.stock_levels sl
     SET reserved_qty = sl.reserved_qty + sub.qty, updated_at = NOW()
    FROM (
      SELECT fr.material_id, fr.lot_id, fr.bin_id, SUM(res.reserved_qty) AS qty
        FROM public.stock_reservations res
        JOIN public.fabric_rolls fr ON fr.id = res.roll_id
       WHERE res.material_id = v_mat AND res.status IN ('ACTIVE','ALLOCATED')
       GROUP BY fr.material_id, fr.lot_id, fr.bin_id
    ) sub
   WHERE sl.material_id = sub.material_id
     AND COALESCE(sl.lot_id,'00000000-0000-0000-0000-000000000000'::uuid)
         = COALESCE(sub.lot_id,'00000000-0000-0000-0000-000000000000'::uuid)
     AND COALESCE(sl.bin_id,'00000000-0000-0000-0000-000000000000'::uuid)
         = COALESCE(sub.bin_id,'00000000-0000-0000-0000-000000000000'::uuid);

  -- Bước 2: phiếu KHÔNG gắn cuộn — rải lần lượt theo ô kệ
  SELECT COALESCE(SUM(res.reserved_qty),0) INTO v_rest
    FROM public.stock_reservations res
   WHERE res.material_id = v_mat AND res.roll_id IS NULL
     AND res.status IN ('ACTIVE','ALLOCATED');

  IF v_rest > 0 THEN
    FOR v_bin_row IN
      SELECT id, on_hand_qty, reserved_qty FROM public.stock_levels
       WHERE material_id = v_mat ORDER BY bin_id NULLS LAST, id
    LOOP
      EXIT WHEN v_rest <= 0;
      v_take := LEAST(v_rest, GREATEST(v_bin_row.on_hand_qty - v_bin_row.reserved_qty, 0));
      IF v_take > 0 THEN
        UPDATE public.stock_levels SET reserved_qty = reserved_qty + v_take, updated_at = NOW()
         WHERE id = v_bin_row.id;
        v_rest := v_rest - v_take;
      END IF;
    END LOOP;
  END IF;

  RETURN NULL;
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- SỬA LẠI CÁC PHIẾU ĐÃ GHI SAI
-- ════════════════════════════════════════════════════════════════════════════
-- Mọi phiếu kiểm ghi trong lúc lỗi 1 còn sống đều mang kết luận TRƯỢT, kể cả
-- những cuộn thật ra ĐẠT. Tính lại đúng một lần cho tất cả.
--
-- Chạm vào material_inspections sẽ kích hoạt lại cả hai trigger, nên cuộn nào
-- đổi kết luận cũng được cập nhật qa_status và số bị khoá theo. Đó là chủ đích:
-- sửa số liệu mà không sửa trạng thái kho là để lại một cái sai lặng lẽ hơn.
UPDATE public.material_inspections
   SET updated_at = NOW()
 WHERE inspected_area_sqyd IS NOT NULL AND inspected_area_sqyd > 0;

-- ════════════════════════════════════════════════════════════════════════════
-- KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Hàm chấm điểm không còn đọc cột sinh tự động' AS muc,
       (SELECT (prosrc NOT LIKE '%NEW.total_points%')::TEXT FROM pg_proc
         WHERE proname = 'wh_inspection_prepare') AS ket_qua, 'true' AS ky_vong
UNION ALL
SELECT 'Hàm đồng bộ giữ chỗ không còn biến trùng bí danh',
       (SELECT (prosrc LIKE '%v_bin_row%' AND prosrc NOT LIKE '%  r  RECORD%')::TEXT
          FROM pg_proc WHERE proname = 'wh_sync_reserved'), 'true'
UNION ALL
SELECT 'Số phiếu kiểm còn kết luận SAI so với điểm thực tế',
       (SELECT COUNT(*)::TEXT FROM public.material_inspections
         WHERE inspected_area_sqyd > 0
           AND result <> CASE WHEN total_points * 100.0 / inspected_area_sqyd <= acceptance_limit
                              THEN 'PASSED' ELSE 'FAILED' END), '0';
