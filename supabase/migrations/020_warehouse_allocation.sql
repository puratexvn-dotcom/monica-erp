-- ============================================================================
-- MONICA MOS — 020 · CHẤM ĐIỂM 4-POINT & PHÂN BỔ THEO TÔNG MÀU
--
-- Thi hành bốn quyết định đã chốt:
--   1. Chặn bằng CƠ SỞ DỮ LIỆU, không chặn bằng giao diện.
--   2. Cho chọn đơn vị nhập (mét / yard), lưu trữ theo ĐƠN VỊ GỐC là mét.
--   3. Ngưỡng 4-Point theo TỪNG KHÁCH HÀNG, không cố định toàn nhà máy.
--   4. Cuộn kiểm TRƯỢT bị khoá ngay; gỡ khoá phải có quyền riêng + để lại vết.
--
-- ─── AN TOÀN KHI CHẠY ─────────────────────────────────────────────────────
-- CHỈ THÊM MỚI: cột mới, hàm mới, trigger mới, view mới. Không xoá cột, không
-- sửa policy đang chạy của 11 vai trò nội bộ. Idempotent, chạy lại vẫn an toàn.
--
-- ⚠️ NHẮC LẠI BÀI HỌC CỦA 018: vòng lặp gắn policy `buyer_denied` chỉ chạy trên
-- danh sách bảng TẠI THỜI ĐIỂM ĐÓ. Migration này không tạo bảng mới nên không
-- phát sinh lỗ hổng đó; nhưng VIEW mới bên dưới thì có — view không thừa hưởng
-- RLS của bảng gốc nếu nó là SECURITY DEFINER. Vì vậy view dưới đây để nguyên
-- SECURITY INVOKER (mặc định) để RLS của fabric_rolls/stock_levels vẫn áp dụng.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. NGƯỠNG 4-POINT THEO TỪNG KHÁCH HÀNG  (quyết định #3)
-- ════════════════════════════════════════════════════════════════════════════
-- Mỗi khách có tiêu chuẩn riêng: hàng thời trang nhanh thường chấp nhận 20–28
-- điểm/100 yd², hàng cao cấp siết xuống 15. Ghi vào hồ sơ khách thay vì bắt
-- nhân viên nhớ, vì nhớ nhầm một lần là cả lô vải bị xử sai.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS four_point_limit NUMERIC(8,2);

COMMENT ON COLUMN public.customers.four_point_limit IS
  'Ngưỡng điểm 4-Point trên 100 yd² của riêng khách này. NULL = dùng mức mặc định 20 của nhà máy.';

-- ════════════════════════════════════════════════════════════════════════════
-- 2. PHIẾU KIỂM: ĐƠN VỊ NHẬP & KÍCH THƯỚC  (quyết định #2)
-- ════════════════════════════════════════════════════════════════════════════
-- Lưu KÍCH THƯỚC THẬT theo mét (đơn vị gốc), kèm đơn vị người dùng đã nhập.
-- Giữ lại `entry_uom` không phải để tính toán mà để HIỆN LẠI đúng cách người
-- kiểm đã ghi — mở phiếu cũ ra thấy con số khác lúc mình nhập là mất niềm tin
-- vào cả hệ thống, dù phép quy đổi hoàn toàn đúng.
ALTER TABLE public.material_inspections
  ADD COLUMN IF NOT EXISTS customer_id        UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS inspected_length_m NUMERIC(12,3),
  ADD COLUMN IF NOT EXISTS inspected_width_m  NUMERIC(8,3),
  ADD COLUMN IF NOT EXISTS entry_uom          VARCHAR(10) NOT NULL DEFAULT 'METERS';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='material_inspections_entry_uom_valid') THEN
    ALTER TABLE public.material_inspections ADD CONSTRAINT material_inspections_entry_uom_valid
      CHECK (entry_uom IN ('METERS','YARDS'));
  END IF;
END $$;

-- ─── CÔNG THỨC 4-POINT NẰM Ở CƠ SỞ DỮ LIỆU ─────────────────────────────────
-- Điểm/100 yd² = tổng điểm × 100 / diện tích(yd²)
-- Diện tích(yd²) = dài(m) × rộng(m) × 1,19599004630108
--
-- ⚠️ ĐÂY LÀ CHỖ DỄ SAI NHẤT CỦA CẢ MÀN HÌNH.
-- Công thức ngành thường viết là: tổng × 3600 / (dài × rộng). Con số 3600 là
-- 100 × 36, và nó CHỈ ĐÚNG khi dài tính bằng YARD, rộng tính bằng INCH.
-- Bảng fabric_rolls của hệ thống lưu tất cả bằng MÉT. Thay thẳng số mét vào
-- công thức 3600 sẽ cho kết quả sai GẤP 43 LẦN, và sai theo hướng đánh trượt
-- vải tốt — nhà máy sẽ trả về nhà cung cấp những cuộn hoàn toàn dùng được.
--
--   Cuộn 100 m × 1,5 m, 11 điểm lỗi:
--     ĐÚNG : 100 × 1,5 × 1,19599 = 179,40 yd²  →  11 × 100 / 179,40 = 6,13  ĐẠT
--     SAI  : 11 × 3600 / (100 × 1,5)                              = 264,00  TRƯỢT
--
-- Đặt phép quy đổi ở trigger chứ không ở mã nguồn: phiếu kiểm, báo cáo giám đốc
-- và cổng khách hàng đọc cùng một con số, không thể có ba kết quả.
CREATE OR REPLACE FUNCTION public.wh_inspection_prepare()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit NUMERIC(8,2);
BEGIN
  -- Diện tích tự tính từ kích thước; chỉ ghi đè khi có đủ dài và rộng, để các
  -- luồng cũ chỉ nhập thẳng diện tích vẫn chạy nguyên vẹn.
  IF NEW.inspected_length_m IS NOT NULL AND NEW.inspected_width_m IS NOT NULL
     AND NEW.inspected_length_m > 0 AND NEW.inspected_width_m > 0 THEN
    NEW.inspected_area_sqyd :=
      ROUND(NEW.inspected_length_m * NEW.inspected_width_m * 1.19599004630108, 3);
  END IF;

  -- Ngưỡng lấy theo khách hàng, thiếu thì về mức mặc định 20 của nhà máy
  IF NEW.customer_id IS NOT NULL THEN
    SELECT c.four_point_limit INTO v_limit FROM public.customers c WHERE c.id = NEW.customer_id;
    IF v_limit IS NOT NULL AND v_limit > 0 THEN
      NEW.acceptance_limit := v_limit;
    END IF;
  END IF;

  -- Kết luận ĐẠT/TRƯỢT do máy chủ quyết định, không nhận từ trình duyệt.
  -- Chưa đủ dữ liệu để tính thì để PENDING chứ KHÔNG đoán bừa là ĐẠT.
  IF COALESCE(NEW.inspected_area_sqyd, 0) > 0 THEN
    NEW.result := CASE
      WHEN NEW.total_points * 100.0 / NEW.inspected_area_sqyd <= NEW.acceptance_limit
      THEN 'PASSED' ELSE 'FAILED' END;
  ELSE
    NEW.result := 'PENDING';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wh_inspection_prepare_trg ON public.material_inspections;
CREATE TRIGGER wh_inspection_prepare_trg
  BEFORE INSERT OR UPDATE ON public.material_inspections
  FOR EACH ROW EXECUTE FUNCTION public.wh_inspection_prepare();

-- ════════════════════════════════════════════════════════════════════════════
-- 3. TRƯỢT LÀ KHOÁ NGAY  (quyết định #4)
-- ════════════════════════════════════════════════════════════════════════════
-- Cuộn kiểm trượt phải rời khỏi phần CÓ SẴN ngay lập tức, nếu không luồng phân
-- bổ vẫn bốc trúng nó. Chuyển sang blocked_qty chứ không trừ on_hand: hàng vẫn
-- nằm trong kho, chỉ là không được dùng — hai chuyện hoàn toàn khác nhau khi
-- đối chiếu kiểm kê.
CREATE OR REPLACE FUNCTION public.wh_inspection_apply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_score NUMERIC(8,2);
  v_roll  RECORD;
BEGIN
  IF NEW.roll_id IS NULL THEN RETURN NEW; END IF;

  v_score := CASE WHEN COALESCE(NEW.inspected_area_sqyd,0) > 0
                  THEN ROUND(NEW.total_points * 100.0 / NEW.inspected_area_sqyd, 2)
                  ELSE NULL END;

  SELECT * INTO v_roll FROM public.fabric_rolls WHERE id = NEW.roll_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  UPDATE public.fabric_rolls
     SET four_point_score = v_score,
         qa_status        = NEW.result,
         updated_at       = NOW()
   WHERE id = NEW.roll_id;

  -- TRƯỢT -> đẩy chiều dài còn lại của cuộn vào phần bị khoá
  IF NEW.result = 'FAILED' THEN
    UPDATE public.stock_levels sl
       SET blocked_qty = sl.blocked_qty + COALESCE(v_roll.current_length_m, 0),
           updated_at  = NOW()
     WHERE sl.material_id = v_roll.material_id
       AND COALESCE(sl.lot_id, '00000000-0000-0000-0000-000000000000'::uuid)
           = COALESCE(v_roll.lot_id, '00000000-0000-0000-0000-000000000000'::uuid)
       AND COALESCE(sl.bin_id, '00000000-0000-0000-0000-000000000000'::uuid)
           = COALESCE(v_roll.bin_id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  INSERT INTO public.wh_audit_log (entity_type, entity_id, action, changes, reason, actor_id, actor_role)
  VALUES ('fabric_roll', NEW.roll_id, 'UPDATE',
          jsonb_build_object('qa_status', NEW.result, 'four_point_score', v_score,
                             'inspection_no', NEW.inspection_no,
                             'acceptance_limit', NEW.acceptance_limit),
          CASE WHEN NEW.result = 'FAILED' THEN 'Kiểm 4-Point TRƯỢT — khoá cuộn tự động' ELSE NULL END,
          auth.uid(), public.mos_current_role());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wh_inspection_apply_trg ON public.material_inspections;
CREATE TRIGGER wh_inspection_apply_trg
  AFTER INSERT OR UPDATE ON public.material_inspections
  FOR EACH ROW EXECUTE FUNCTION public.wh_inspection_apply();

-- ─── GỠ KHOÁ: QUYỀN RIÊNG + BẮT BUỘC CÓ LÝ DO ──────────────────────────────
-- Không cho UPDATE thẳng vào fabric_rolls để gỡ: đi qua hàm này thì KHÔNG CÓ
-- ĐƯỜNG NÀO gỡ khoá mà không để lại vết, kể cả gọi trực tiếp PostgREST.
-- Trạng thái sau khi gỡ là CONDITIONAL (dùng có điều kiện), KHÔNG phải PASSED:
-- cuộn này đã trượt thật, ghi đè thành ĐẠT là xoá mất sự thật.
CREATE OR REPLACE FUNCTION public.wh_unblock_roll(p_roll_id UUID, p_reason TEXT)
RETURNS TABLE (roll_id UUID, new_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT := public.mos_current_role();
  v_roll RECORD;
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('khotruong', 'giamdoc', 'superadmin') THEN
    RAISE EXCEPTION 'Chỉ Tổ trưởng Kho, Giám đốc hoặc Quản trị hệ thống được gỡ khoá cuộn vải.'
      USING ERRCODE = '42501';
  END IF;
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Phải ghi lý do gỡ khoá, tối thiểu 10 ký tự.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_roll FROM public.fabric_rolls WHERE id = p_roll_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy cuộn vải.' USING ERRCODE = 'P0002';
  END IF;
  IF v_roll.qa_status <> 'FAILED' THEN
    RAISE EXCEPTION 'Cuộn này không ở trạng thái TRƯỢT nên không có gì để gỡ.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.fabric_rolls SET qa_status = 'CONDITIONAL', updated_at = NOW() WHERE id = p_roll_id;

  UPDATE public.stock_levels sl
     SET blocked_qty = GREATEST(sl.blocked_qty - COALESCE(v_roll.current_length_m, 0), 0),
         updated_at  = NOW()
   WHERE sl.material_id = v_roll.material_id
     AND COALESCE(sl.lot_id, '00000000-0000-0000-0000-000000000000'::uuid)
         = COALESCE(v_roll.lot_id, '00000000-0000-0000-0000-000000000000'::uuid)
     AND COALESCE(sl.bin_id, '00000000-0000-0000-0000-000000000000'::uuid)
         = COALESCE(v_roll.bin_id, '00000000-0000-0000-0000-000000000000'::uuid);

  INSERT INTO public.wh_audit_log (entity_type, entity_id, action, changes, reason, actor_id, actor_role)
  VALUES ('fabric_roll', p_roll_id, 'APPROVE',
          jsonb_build_object('qa_status', jsonb_build_object('from','FAILED','to','CONDITIONAL'),
                             'unblocked_qty', v_roll.current_length_m),
          p_reason, auth.uid(), v_role);

  RETURN QUERY SELECT p_roll_id, 'CONDITIONAL'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wh_unblock_roll(UUID, TEXT) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. GIỮ CHỖ Ở MỨC CUỘN  (quyết định #1)
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.stock_reservations
  ADD COLUMN IF NOT EXISTS roll_id UUID REFERENCES public.fabric_rolls(id) ON DELETE SET NULL;

-- Một cuộn KHÔNG được hứa cho hai nơi. Chỉ tính các phiếu còn hiệu lực; phiếu
-- đã trả lại hoặc đã dùng xong thì cuộn được hứa lại bình thường.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_roll_once
  ON public.stock_reservations (roll_id)
  WHERE roll_id IS NOT NULL AND status IN ('ACTIVE', 'ALLOCATED');

CREATE INDEX IF NOT EXISTS idx_reservations_cut_ticket
  ON public.stock_reservations (cut_ticket_id) WHERE cut_ticket_id IS NOT NULL;

-- ─── BA LUẬT CHẶN, THI HÀNH Ở CƠ SỞ DỮ LIỆU ────────────────────────────────
CREATE OR REPLACE FUNCTION public.wh_reservation_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_roll      RECORD;
  v_available NUMERIC(14,3);
  v_other     TEXT;
BEGIN
  IF NEW.status NOT IN ('ACTIVE', 'ALLOCATED') THEN RETURN NEW; END IF;

  IF NEW.roll_id IS NOT NULL THEN
    SELECT * INTO v_roll FROM public.fabric_rolls WHERE id = NEW.roll_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Không tìm thấy cuộn vải.' USING ERRCODE = 'P0002';
    END IF;

    -- LUẬT 1: chưa kiểm hoặc kiểm trượt thì không được đưa lên bàn cắt.
    -- Đây là lỗi không sửa được sau khi đã cắt, nên chặn ở đây chứ không cảnh báo.
    IF v_roll.qa_status NOT IN ('PASSED', 'CONDITIONAL') THEN
      RAISE EXCEPTION 'Cuộn % chưa đạt kiểm chất lượng (%). Không được phân bổ.',
        v_roll.roll_code, v_roll.qa_status USING ERRCODE = '23514';
    END IF;

    -- LUẬT 2: một lệnh cắt không nhận cuộn từ hai tông màu khác nhau.
    -- Chính là cái sai mà cả màn hình này sinh ra để chặn.
    IF NEW.cut_ticket_id IS NOT NULL THEN
      SELECT DISTINCT COALESCE(ml.shade_code, fr.shade_lot) INTO v_other
        FROM public.stock_reservations r
        JOIN public.fabric_rolls fr ON fr.id = r.roll_id
        LEFT JOIN public.material_lots ml ON ml.id = fr.lot_id
       WHERE r.cut_ticket_id = NEW.cut_ticket_id
         AND r.status IN ('ACTIVE', 'ALLOCATED')
         AND r.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
         AND COALESCE(ml.shade_code, fr.shade_lot) IS DISTINCT FROM
             (SELECT COALESCE(ml2.shade_code, v_roll.shade_lot)
                FROM (SELECT 1) x LEFT JOIN public.material_lots ml2 ON ml2.id = v_roll.lot_id)
       LIMIT 1;
      IF v_other IS NOT NULL THEN
        RAISE EXCEPTION 'Lệnh cắt này đã có cuộn tông "%". Không được trộn tông màu trên cùng một bàn cắt.',
          v_other USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;

  -- LUẬT 3: không hứa quá số CÓ SẴN. Không có luật này thì hai người cùng hứa
  -- một lô cho hai đơn, và "sổ sách còn hàng mà xuống kho không có gì để lấy".
  SELECT COALESCE(SUM(sl.available_qty), 0) INTO v_available
    FROM public.stock_levels sl
   WHERE sl.material_id = NEW.material_id
     AND (NEW.lot_id IS NULL OR sl.lot_id = NEW.lot_id);
  IF TG_OP = 'INSERT' AND NEW.reserved_qty > v_available THEN
    RAISE EXCEPTION 'Chỉ còn % khả dụng, không giữ chỗ được %.', v_available, NEW.reserved_qty
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wh_reservation_guard_trg ON public.stock_reservations;
CREATE TRIGGER wh_reservation_guard_trg
  BEFORE INSERT OR UPDATE ON public.stock_reservations
  FOR EACH ROW EXECUTE FUNCTION public.wh_reservation_guard();

-- ─── ĐỒNG BỘ SỐ GIỮ CHỖ VỀ BẢNG TỒN  (lỗ hổng của 017) ─────────────────────
-- 017 tạo cột reserved_qty và cột sinh available_qty, nhưng KHÔNG có gì đồng bộ
-- reserved_qty với bảng stock_reservations. Nghĩa là tạo phiếu giữ chỗ 500 m
-- xong, bảng tồn vẫn báo khả dụng đủ 500 m đó. Đây là lỗi im lặng nguy hiểm
-- nhất của cả phân hệ kho.
--
-- Cách phân bổ: cuộn nào có ô kệ thì trừ đúng ô đó. Phiếu giữ chỗ ở mức lô
-- (không gắn cuộn) thì rải LẦN LƯỢT theo thứ tự ô kệ, lấp đầy tới đâu hay tới
-- đó — cách này xác định (chạy lại luôn cho cùng kết quả) và BẢO TOÀN TỔNG,
-- không làm rơi mất phần dư như cách gán bừa vào một ô.
CREATE OR REPLACE FUNCTION public.wh_sync_reserved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mat  UUID := COALESCE(NEW.material_id, OLD.material_id);
  v_rest NUMERIC(14,3);
  r      RECORD;
  v_take NUMERIC(14,3);
BEGIN
  -- Xoá sạch rồi tính lại cho toàn bộ vật tư này: cộng/trừ theo delta sẽ trôi
  -- dần sau vài chục thao tác, tính lại thì không bao giờ lệch.
  UPDATE public.stock_levels SET reserved_qty = 0 WHERE material_id = v_mat;

  -- Bước 1: phiếu gắn CUỘN — trừ đúng ô kệ đang chứa cuộn đó
  UPDATE public.stock_levels sl
     SET reserved_qty = sl.reserved_qty + sub.qty, updated_at = NOW()
    FROM (
      SELECT fr.material_id, fr.lot_id, fr.bin_id, SUM(r.reserved_qty) AS qty
        FROM public.stock_reservations r
        JOIN public.fabric_rolls fr ON fr.id = r.roll_id
       WHERE r.material_id = v_mat AND r.status IN ('ACTIVE','ALLOCATED')
       GROUP BY fr.material_id, fr.lot_id, fr.bin_id
    ) sub
   WHERE sl.material_id = sub.material_id
     AND COALESCE(sl.lot_id,'00000000-0000-0000-0000-000000000000'::uuid)
         = COALESCE(sub.lot_id,'00000000-0000-0000-0000-000000000000'::uuid)
     AND COALESCE(sl.bin_id,'00000000-0000-0000-0000-000000000000'::uuid)
         = COALESCE(sub.bin_id,'00000000-0000-0000-0000-000000000000'::uuid);

  -- Bước 2: phiếu KHÔNG gắn cuộn — rải lần lượt theo ô kệ
  SELECT COALESCE(SUM(r.reserved_qty),0) INTO v_rest
    FROM public.stock_reservations r
   WHERE r.material_id = v_mat AND r.roll_id IS NULL AND r.status IN ('ACTIVE','ALLOCATED');

  IF v_rest > 0 THEN
    FOR r IN SELECT id, on_hand_qty, reserved_qty FROM public.stock_levels
              WHERE material_id = v_mat ORDER BY bin_id NULLS LAST, id
    LOOP
      EXIT WHEN v_rest <= 0;
      v_take := LEAST(v_rest, GREATEST(r.on_hand_qty - r.reserved_qty, 0));
      IF v_take > 0 THEN
        UPDATE public.stock_levels SET reserved_qty = reserved_qty + v_take, updated_at = NOW()
         WHERE id = r.id;
        v_rest := v_rest - v_take;
      END IF;
    END LOOP;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS wh_sync_reserved_trg ON public.stock_reservations;
CREATE TRIGGER wh_sync_reserved_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_reservations
  FOR EACH ROW EXECUTE FUNCTION public.wh_sync_reserved();

-- ════════════════════════════════════════════════════════════════════════════
-- 5. BẢNG TÔNG MÀU
-- ════════════════════════════════════════════════════════════════════════════
-- Tông màu hiện nằm ở HAI CHỖ: material_lots.shade_code (mới) và
-- fabric_rolls.shade_lot (cũ, dữ liệu đang chạy nằm ở đây). View gộp lại, ưu
-- tiên bảng mới. Cuộn chưa gán tông KHÔNG bị dồn vào một nhóm chung mà giữ
-- NULL để giao diện hiện rõ "chưa gán tông" — dồn lại là giấu mất rủi ro.
--
-- Không đặt SECURITY DEFINER: view chạy dưới quyền người gọi nên RLS của
-- fabric_rolls và stock_levels vẫn có hiệu lực.
CREATE OR REPLACE VIEW public.v_shade_board AS
SELECT
  fr.id                AS roll_id,
  fr.roll_code,
  fr.material_id,
  m.material_code,
  m.material_name,
  fr.lot_id,
  ml.lot_no,
  COALESCE(ml.shade_code, fr.shade_lot) AS shade_code,
  fr.bin_id,
  fr.current_length_m,
  fr.width_m,
  fr.qa_status,
  fr.four_point_score,
  fr.relaxation_status,
  fr.status            AS roll_status,
  res.id               AS reservation_id,
  res.cut_ticket_id,
  res.order_id,
  res.status           AS reservation_status
FROM public.fabric_rolls fr
LEFT JOIN public.materials m     ON m.id  = fr.material_id
LEFT JOIN public.material_lots ml ON ml.id = fr.lot_id
LEFT JOIN public.stock_reservations res
       ON res.roll_id = fr.id AND res.status IN ('ACTIVE','ALLOCATED');

GRANT SELECT ON public.v_shade_board TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. REALTIME  (Điều XV của Hiến pháp)
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['material_inspections','stock_reservations','fabric_rolls','stock_levels'] LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 7. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Cột ngưỡng theo khách hàng' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name='customers' AND column_name='four_point_limit') AS ket_qua, '1' AS ky_vong
UNION ALL
SELECT 'Cột kích thước + đơn vị nhập trên phiếu kiểm',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name='material_inspections'
           AND column_name IN ('customer_id','inspected_length_m','inspected_width_m','entry_uom')), '4'
UNION ALL
SELECT 'Cột roll_id trên phiếu giữ chỗ',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name='stock_reservations' AND column_name='roll_id'), '1'
UNION ALL
SELECT 'Chỉ mục chặn một cuộn hứa hai nơi',
       (SELECT COUNT(*)::TEXT FROM pg_indexes
         WHERE indexname='idx_reservations_roll_once'), '1'
UNION ALL
SELECT 'Số trigger mới',
       (SELECT COUNT(*)::TEXT FROM pg_trigger
         WHERE tgname IN ('wh_inspection_prepare_trg','wh_inspection_apply_trg',
                          'wh_reservation_guard_trg','wh_sync_reserved_trg')), '4'
UNION ALL
SELECT 'Hàm gỡ khoá cuộn',
       (SELECT COUNT(*)::TEXT FROM pg_proc WHERE proname='wh_unblock_roll'), '1'
UNION ALL
SELECT 'View bảng tông màu',
       (SELECT COUNT(*)::TEXT FROM information_schema.views
         WHERE table_schema='public' AND table_name='v_shade_board'), '1'
UNION ALL
SELECT 'Bốn bảng đã vào realtime',
       (SELECT COUNT(*)::TEXT FROM pg_publication_tables
         WHERE pubname='supabase_realtime'
           AND tablename IN ('material_inspections','stock_reservations','fabric_rolls','stock_levels')), '4'
UNION ALL
SELECT 'Phép quy đổi: 100m x 1,5m = 179,4 yd² (KHÔNG phải 150)',
       ROUND(100 * 1.5 * 1.19599004630108, 1)::TEXT, '179.4';
