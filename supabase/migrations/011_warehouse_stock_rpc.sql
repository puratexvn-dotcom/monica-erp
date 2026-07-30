-- ============================================================================
-- MONICA GARMENT ERP — 011: GIAO DỊCH KHO NGUYÊN KHỐI
--
-- VẤN ĐỀ ĐANG CÓ (đã ghi trong app/(dashboard)/kho/wh-actions.ts):
-- Cộng/trừ tồn kho làm theo kiểu đọc-rồi-ghi qua HAI lượt gọi riêng biệt:
--       SELECT stock_qty ...        -- lượt 1
--       UPDATE stock_qty = <đã tính ở tầng ứng dụng>   -- lượt 2
-- Giữa hai lượt đó, một người khác cũng đọc được giá trị cũ. Hai phiếu nhập
-- 100m cùng lúc trên cùng mã vải => tồn chỉ tăng 100m thay vì 200m (lost update).
-- Với phiếu XUẤT còn nặng hơn: hai người cùng thấy "còn 50m" và cùng xuất 50m,
-- kết quả tồn âm — nhà máy tưởng còn vải mà thực tế đã hết.
--
-- CÁCH SỬA: dồn cả ba việc (kiểm tra tồn, ghi phiếu, cập nhật tồn) vào MỘT hàm
-- Postgres. SELECT ... FOR UPDATE khoá dòng vật tư nên hai giao dịch trên cùng
-- một mã buộc phải xếp hàng, và phép cộng làm ngay trong SQL
-- (stock_qty = stock_qty + n) chứ không tính ở tầng ứng dụng.
--
-- CÁCH CHẠY: dán toàn bộ vào Supabase Dashboard > SQL Editor > Run.
-- Chạy được nhiều lần (idempotent).
-- ============================================================================

-- ─── 1. CHẶN TỒN ÂM Ở TẦNG DỮ LIỆU ─────────────────────────────────────────
-- Hàng rào cuối cùng: kể cả khi tầng ứng dụng có lỗi logic thì Postgres vẫn
-- không cho tồn kho xuống dưới 0.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'materials_stock_qty_non_negative'
  ) THEN
    -- Đưa các dòng đang âm (nếu có) về 0 trước, nếu không ALTER sẽ thất bại
    UPDATE public.materials SET stock_qty = 0 WHERE stock_qty < 0;

    ALTER TABLE public.materials
      ADD CONSTRAINT materials_stock_qty_non_negative CHECK (stock_qty >= 0);
  END IF;
END $$;

-- ─── 2. HÀM GIAO DỊCH KHO ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.apply_stock_movement(
  p_material_id  UUID,
  p_type         TEXT,
  p_quantity     NUMERIC,
  p_order_id     UUID        DEFAULT NULL,
  p_reference_no TEXT        DEFAULT NULL,
  p_notes        TEXT        DEFAULT NULL,
  p_occurred_at  TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (transaction_id UUID, new_stock NUMERIC)
LANGUAGE plpgsql
-- SECURITY INVOKER (mặc định): hàm chạy với quyền của người gọi nên RLS vẫn
-- được áp dụng. TUYỆT ĐỐI không dùng SECURITY DEFINER ở đây — làm vậy là mở
-- một cửa sau cho phép ghi sổ kho bỏ qua mọi policy.
SET search_path = public
AS $$
DECLARE
  v_stock NUMERIC;
  v_tx_id UUID;
BEGIN
  IF p_type NOT IN ('IN', 'OUT') THEN
    RAISE EXCEPTION 'INVALID_TYPE' USING HINT = 'Loại giao dịch phải là IN hoặc OUT';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY' USING HINT = 'Số lượng phải lớn hơn 0';
  END IF;

  -- FOR UPDATE: khoá dòng vật tư tới hết giao dịch. Đây chính là chỗ chặn
  -- lost update — phiếu thứ hai phải đợi phiếu thứ nhất xong mới đọc được.
  SELECT stock_qty INTO v_stock
  FROM public.materials
  WHERE id = p_material_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'MATERIAL_NOT_FOUND' USING HINT = 'Không tìm thấy mã vật tư';
  END IF;

  IF p_type = 'OUT' AND v_stock < p_quantity THEN
    -- Nhúng số liệu vào thông báo để tầng ứng dụng hiện đúng con số cho người
    -- dùng, thay vì một câu "không đủ tồn" chung chung.
    RAISE EXCEPTION 'INSUFFICIENT_STOCK|%|%', v_stock, p_quantity;
  END IF;

  INSERT INTO public.warehouse_transactions
    (material_id, transaction_type, quantity, order_id, reference_no, notes, created_at)
  VALUES
    (p_material_id, p_type, p_quantity, p_order_id, p_reference_no, p_notes, p_occurred_at)
  RETURNING id INTO v_tx_id;

  -- Cộng/trừ NGAY TRONG SQL, không tính ở tầng ứng dụng
  UPDATE public.materials
  SET stock_qty = stock_qty + CASE WHEN p_type = 'IN' THEN p_quantity ELSE -p_quantity END,
      updated_at = NOW()
  WHERE id = p_material_id
  RETURNING stock_qty INTO v_stock;

  RETURN QUERY SELECT v_tx_id, v_stock;
END;
$$;

-- ─── 3. QUYỀN GỌI HÀM ───────────────────────────────────────────────────────
-- Thu hồi hết rồi chỉ cấp lại cho authenticated, khớp chính sách RLS ở
-- migration 010 (anon không được chạm vào schema public).
REVOKE ALL ON FUNCTION public.apply_stock_movement(UUID, TEXT, NUMERIC, UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_stock_movement(UUID, TEXT, NUMERIC, UUID, TEXT, TEXT, TIMESTAMPTZ) FROM anon;
GRANT EXECUTE ON FUNCTION public.apply_stock_movement(UUID, TEXT, NUMERIC, UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;

-- ─── 4. TỰ KIỂM TRA ─────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'apply_stock_movement'
  ) THEN
    RAISE EXCEPTION 'Không tạo được hàm apply_stock_movement';
  END IF;
  RAISE NOTICE 'OK: apply_stock_movement đã sẵn sàng, tồn kho đã có ràng buộc >= 0.';
END $$;
