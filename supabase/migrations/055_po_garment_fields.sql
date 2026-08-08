-- ============================================================================
-- MONICA ONE — 055 · SÁU TRƯỜNG MÀ MỘT PO GIA CÔNG MAY THẬT SỰ CẦN
--
-- 📐 Board 08/08/2026: *"trao toàn quyền thiết kế lại form tạo PO… **nếu thiếu
--    thì phải bổ sung**… đảm bảo MD tạo PO chuẩn chỉ phù hợp với **ngành gia
--    công may mặc chuyên nghiệp**."*
-- 📐 ADR-029 (kèm theo)
--
-- ⚠️ Chạy SAU `054`. Idempotent. ⛔ KHÔNG xoá dữ liệu. Hỏng phép tự kiểm nào
--    ⇒ `RAISE` ⇒ **toàn bộ giao dịch quay lui**.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ① 🔴 LỖI MẤT DỮ LIỆU ĐANG CHẠY — `notes`
-- ════════════════════════════════════════════════════════════════════════════
-- Biểu mẫu tạo PO **có ô "Ghi chú"**, lược đồ Zod **có trường `notes`**, nhưng
-- `orders` **⛔ KHÔNG CÓ CỘT `notes`** và `createPo` vì thế ⛔ không hề ghi nó.
--
-- 🔴 Nghĩa là: người dùng gõ *"khách yêu cầu in nhãn size riêng"*, bấm Lưu,
--    hệ thống báo **thành công**, và câu đó **biến mất ⛔ không dấu vết**.
--    ⛔ Không lỗi, ⛔ không cảnh báo, ⛔ không dòng nhật ký.
--
-- 🔑 Đây là loại lỗi tệ nhất trong nhóm mất dữ liệu: nó **trông như đã lưu**.
--    Người dùng tin là đã ghi chú, chuyền tin là ⛔ không có yêu cầu gì.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ② NĂM TRƯỜNG NGHIỆP VỤ CÒN THIẾU — vì sao TỪNG cái là bắt buộc
-- ════════════════════════════════════════════════════════════════════════════
--
-- `customer_po_no` — **SỐ PO CỦA KHÁCH**
--   Nhà máy có mã PO nội bộ *(`po_number`)*; khách có số PO của họ. Toàn bộ
--   **bộ chứng từ xuất khẩu** — Commercial Invoice · Packing List · B/L · và
--   nhất là **L/C** — tham chiếu **số của KHÁCH**, ⛔ không phải số nội bộ.
--   🔴 Thiếu nó thì tới lúc lập chứng từ, MD phải đi lục email tìm lại; và
--   ngân hàng từ chối bộ chứng từ ⛔ không khớp số PO trên L/C.
--
-- `port_of_loading` · `port_of_destination` — **CẢNG ĐI · CẢNG ĐẾN**
--   🔑 **`Incoterm` mà ⛔ không có cảng là một điều khoản ⛔ chưa hoàn chỉnh.**
--   `FOB` nghĩa là *"giao lên tàu tại cảng X"* — thiếu X thì ⛔ không xác định
--   được **điểm chuyển rủi ro** lẫn **ai trả cước tới đâu**. `FOB Hai Phong`
--   và `FOB Ho Chi Minh` chênh nhau hàng nghìn đô cước nội địa trên một
--   container.
--
-- `material_eta` — **NGÀY NPL PHẢI VỀ KHO**
--   Chuyền ⛔ không cắt được khi vải chưa về. Đây là mốc **MD cam kết NGƯỢC
--   lại** với bộ phận NPL, và là mốc **sớm nhất** trong cả đơn có thể làm trễ
--   mọi mốc sau. Hiện lịch T&A tự sinh có mốc NPL, nhưng ⛔ không có chỗ nào
--   ghi **ngày khách/nhà cung cấp đã hứa** — hai thứ khác nhau.
--
-- `qty_tolerance_percent` — **DUNG SAI SỐ LƯỢNG ±%**
--   Chuẩn ngành: giao `±3%` hoặc `±5%`, và **L/C ghi rõ**. ⛔ Không có nó thì
--   giao 4.950/5.000 bị đọc là **giao thiếu** — trong khi hợp đồng cho phép.
--   🔑 Đây là con số quyết định **đơn có bị phạt hay không**, và nó phải nằm
--   trên chứng từ chứ ⛔ không nằm trong trí nhớ của MD.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ③ IMPACT ANALYSIS
-- ════════════════════════════════════════════════════════════════════════════
-- BẢNG CHẠM     orders — thêm 6 cột. ⛔ KHÔNG đụng bảng nào khác.
-- AI MẤT QUYỀN  ⛔ KHÔNG AI. Thuần thêm cột, ⛔ không chạm policy nào.
-- MÀN HÌNH ĐỔI  form Tạo PO (thêm ô) · PO 360° (hiện thêm) — ⛔ không màn hình
--               nào MẤT chức năng.
-- RLS           ⛔ KHÔNG chạm. Cột mới thừa hưởng policy sẵn có của `orders`.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ④ TÍNH ĐẢO NGƯỢC — **ĐẢO ĐƯỢC HOÀN TOÀN**
-- ════════════════════════════════════════════════════════════════════════════
--   ALTER TABLE orders DROP COLUMN customer_po_no, port_of_loading,
--     port_of_destination, material_eta, qty_tolerance_percent, notes;
--   ⚠️ Đảo cột `notes` là **quay lại lỗi mất dữ liệu ở §①** — cần lý do.
-- ============================================================================

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_po_no        TEXT,
  ADD COLUMN IF NOT EXISTS port_of_loading       TEXT,
  ADD COLUMN IF NOT EXISTS port_of_destination   TEXT,
  ADD COLUMN IF NOT EXISTS material_eta          DATE,
  ADD COLUMN IF NOT EXISTS qty_tolerance_percent NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS notes                 TEXT;

COMMENT ON COLUMN public.orders.customer_po_no IS
  '055. Số PO do KHÁCH cấp — khác `po_number` (mã nội bộ nhà máy). Toàn bộ bộ '
  'chứng từ xuất khẩu và L/C tham chiếu số NÀY.';
COMMENT ON COLUMN public.orders.port_of_loading IS
  '055. Cảng xếp hàng. Incoterm mà ⛔ không có cảng là điều khoản ⛔ chưa hoàn '
  'chỉnh — nó ⛔ không xác định được điểm chuyển rủi ro.';
COMMENT ON COLUMN public.orders.port_of_destination IS
  '055. Cảng dỡ hàng / đích đến.';
COMMENT ON COLUMN public.orders.material_eta IS
  '055. Ngày nguyên phụ liệu PHẢI về kho. Mốc sớm nhất có thể làm trễ cả đơn — '
  'chuyền ⛔ không cắt được khi vải chưa về.';
COMMENT ON COLUMN public.orders.qty_tolerance_percent IS
  '055. Dung sai số lượng cho phép, tính bằng %. Chuẩn ngành ±3% hoặc ±5%, và '
  'L/C ghi rõ. NULL = ⛔ chưa thoả thuận, KHÁC 0 = giao đúng tuyệt đối.';
COMMENT ON COLUMN public.orders.notes IS
  '055. Yêu cầu đặc biệt của khách. 🔴 TRƯỚC 055, biểu mẫu CÓ ô này nhưng bảng '
  '⛔ KHÔNG có cột ⇒ chữ người dùng gõ vào bị vứt IM LẶNG.';

-- ⚠️ `CHECK` cho dung sai: `0` và `NULL` mang hai nghĩa khác nhau, y hệt
--    `credit_limit` và `credit_term_days` — cùng một nguyên tắc, cùng cách thi
--    hành, để ba ô này ⛔ không đọc theo ba luật khác nhau.
--      0    = giao ĐÚNG TUYỆT ĐỐI, ⛔ không dung sai
--      NULL = ⛔ chưa thoả thuận
--    Trần 10%: quá mức đó ⛔ không còn là dung sai, mà là đổi số lượng đơn.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_qty_tolerance_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_qty_tolerance_check
  CHECK (qty_tolerance_percent IS NULL
         OR (qty_tolerance_percent >= 0 AND qty_tolerance_percent <= 10));

-- ════════════════════════════════════════════════════════════════════════════
-- ⑤ TỰ KIỂM — HỎNG LÀ QUAY LUI TOÀN BỘ
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_dem INT; v_po UUID; v_style UUID; v_loi TEXT; v_ghi TEXT;
BEGIN
  SELECT count(*) INTO v_dem FROM information_schema.columns
   WHERE table_schema='public' AND table_name='orders'
     AND column_name IN ('customer_po_no','port_of_loading','port_of_destination',
                         'material_eta','qty_tolerance_percent','notes');
  IF v_dem <> 6 THEN RAISE EXCEPTION '⛔ TỰ KIỂM 5.1: thiếu cột (thấy %/6).', v_dem; END IF;

  SELECT id INTO v_style FROM public.styles LIMIT 1;

  -- 5.2 🔴 ĐO THẬT: ghi chú GHI VÀO ĐƯỢC và ĐỌC LẠI ĐÚNG.
  --     Đây là phép thử duy nhất chứng minh lỗi §① đã đóng — đọc lược đồ chỉ
  --     chứng minh CỘT có mặt, ⛔ không chứng minh dữ liệu tới được nó.
  INSERT INTO public.orders (po_number, style_code, customer_name, total_quantity,
                             delivery_date, style_id, customer_po_no, port_of_loading,
                             port_of_destination, material_eta, qty_tolerance_percent, notes)
  VALUES ('SELFTEST-055-' || substr(md5(random()::text),1,8), 'ZZ', 'Tự kiểm 055',
          10, CURRENT_DATE + 30, v_style, 'BUYER-PO-9911', 'Hai Phong', 'Hamburg',
          CURRENT_DATE + 5, 3, 'In nhãn size riêng theo mẫu khách gửi')
  RETURNING id, notes INTO v_po, v_ghi;
  IF v_ghi IS DISTINCT FROM 'In nhãn size riêng theo mẫu khách gửi' THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 5.2: ghi chú ⛔ KHÔNG lưu được (đọc ra "%").', v_ghi;
  END IF;

  -- 5.3 CẶP K-3 cho dung sai: 0 và NULL ĐƯỢC, âm và > 10 BỊ CHẶN.
  UPDATE public.orders SET qty_tolerance_percent = 0 WHERE id = v_po;
  UPDATE public.orders SET qty_tolerance_percent = NULL WHERE id = v_po;
  v_loi := NULL;
  BEGIN UPDATE public.orders SET qty_tolerance_percent = -1 WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE; END;
  IF v_loi IS NULL THEN RAISE EXCEPTION '⛔ TỰ KIỂM 5.3: dung sai ÂM ⛔ không bị chặn.'; END IF;
  v_loi := NULL;
  BEGIN UPDATE public.orders SET qty_tolerance_percent = 25 WHERE id = v_po;
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE; END;
  IF v_loi IS NULL THEN RAISE EXCEPTION '⛔ TỰ KIỂM 5.3b: dung sai 25%% ⛔ không bị chặn.'; END IF;

  DELETE FROM public.order_milestones WHERE order_id = v_po;
  DELETE FROM public.orders WHERE id = v_po;

  RAISE NOTICE '✅ TỰ KIỂM 055: 4/4 ĐẠT.';
END $$;

COMMIT;

-- ── BÁO CÁO KỲ VỌNG ⟷ THỰC TẾ ──────────────────────────────────────────────
SELECT 'cột nghiệp vụ may mới trên orders' AS muc,
       (SELECT count(*)::text FROM information_schema.columns
         WHERE table_schema='public' AND table_name='orders'
           AND column_name IN ('customer_po_no','port_of_loading','port_of_destination',
                               'material_eta','qty_tolerance_percent','notes')) AS thuc_te,
       '6' AS ky_vong
UNION ALL
SELECT 'ràng buộc dung sai',
       (SELECT count(*)::text FROM pg_constraint
         WHERE conname = 'orders_qty_tolerance_check'), '1';

-- ⚠️ SAU KHI CHẠY:  npm run build && node scripts/uat-md-form-dau-vao.mjs
-- ============================================================================
