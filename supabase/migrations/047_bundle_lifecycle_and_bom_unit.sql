-- ============================================================================
-- 047 — VÒNG ĐỜI BÓ HÀNG QUA GIA CÔNG NGOÀI · ĐƠN VỊ ĐỊNH MỨC VẢI · KHOÁ NGOẠI CÔNG NỢ
--
-- ADR:      ADR-025-vong-doi-bo-hang-va-dinh-muc-vai.md  (✅ ĐÃ PHÊ DUYỆT)
-- Board:    Directive 07/08/2026 — "đồng ý để Claude sửa migration … duyệt tất cả"
-- Đóng:     G-6 · G-8 · G-12  (docs/PHIEN_TU_CHAY_2026-08-07.md)
--
-- ⚠️ CHẠY BẰNG TAY trên Supabase SQL Editor. ⛔ KHÔNG có RPC nào chạy DDL từ
--    mã nguồn — xem CLAUDE.md §3.
-- ============================================================================


-- ============================================================================
-- ① IMPACT ANALYSIS
-- ============================================================================
--
-- BẢNG / KIỂU BỊ CHẠM
--   public.bundle_stage_enum       + giá trị 'OUTSIDE_PROCESSING'
--   public.cut_bundles             ⛔ không đổi cấu trúc; trigger ghi vào nó đổi hành vi
--   public.subcon_issue_logs       ⛔ không đổi; trigger AFTER INSERT nay chạy được
--   public.subcon_receipt_logs     ⛔ không đổi; trigger AFTER INSERT nay chạy được
--   public.cut_tickets             + COMMENT ON COLUMN bom_allowance_m; SỬA 1 DÒNG dữ liệu
--   public.financial_records       SỬA 2 DÒNG order_id; + khoá ngoại
--   fn_process_subcon_issue()      CREATE OR REPLACE — 'OUTSIDE_PROCESSING' nay hợp lệ
--   fn_process_subcon_receipt()    CREATE OR REPLACE — 'SEWING_READY' → 'CUT'
--
-- AI MẤT QUYỀN GÌ
--   ⛔ KHÔNG AI. Migration này ⛔ không đụng RLS, policy, GRANT hay vai trò.
--
-- MÀN HÌNH NÀO ĐỔI HÀNH VI
--   /subcon        Xuất – thu hồi bó hàng CHẠY ĐƯỢC LẦN ĐẦU kể từ 009.
--                  Băng đỏ "luồng đang bị chặn" sẽ TỰ TẮT vì câu truy vấn hết lỗi.
--   /to-truong-cat Cảnh báo "vượt định mức" hết bật-mọi-dòng.
--   /ke-toan       Bảng công nợ hiện ĐÚNG mã PO thay cho "⛔ không rõ đơn".
--
-- ⚠️ MÃ NGUỒN PHẢI SỬA KÈM (đã sửa trong cùng commit — ⛔ đừng chạy lệch nhau):
--   app/(dashboard)/subcon/actions.ts   ['CUT_PASSED','SEWING_READY'] → ['CUT']
--   lib/mos/calculators/cat-kpi.calculator.ts  so định mức × số sản phẩm


-- ============================================================================
-- ② TÍNH ĐẢO NGƯỢC
-- ============================================================================
--
--   ĐẢO MỘT PHẦN.
--
--   ĐẢO ĐƯỢC:
--     · COMMENT ON COLUMN          — đặt lại chuỗi cũ (vốn ⛔ không có)
--     · Khoá ngoại fk_financial_records_order  — DROP CONSTRAINT
--     · Hai dòng financial_records — ghi lại UUID cũ, chép sẵn ở §④ để lùi
--     · Dòng PK-2026-001           — ghi lại 70
--     · Hai hàm trigger            — CREATE OR REPLACE về bản của 009
--
--   🔴 MỘT CHIỀU — ⛔ KHÔNG lùi được:
--     · ALTER TYPE bundle_stage_enum ADD VALUE 'OUTSIDE_PROCESSING'
--
--   LÝ DO THIẾT KẾ: PostgreSQL ⛔ **không hỗ trợ** xoá một giá trị khỏi ENUM.
--   Lùi thật sự đòi: tạo enum mới → đổi kiểu cột → xoá enum cũ → dựng lại mọi
--   ràng buộc và chỉ mục phụ thuộc. Đó là **viết lại lược đồ**, ⛔ không phải
--   "lùi", và làm vậy trên CSDL đang chạy nguy hiểm hơn nhiều so với việc để
--   lại một giá trị enum thừa.
--
--   ⇒ Chấp nhận có ý thức. Giá trị này mô tả một trạng thái **có thật** của
--   hàng hoá (bó hàng nằm ở xưởng ngoài), nên khả năng phải gỡ là rất thấp.


-- ============================================================================
-- ③ THI HÀNH
-- ============================================================================

-- ─── 3.1 · ENUM: THÊM ĐÚNG MỘT GIÁ TRỊ ──────────────────────────────────────
--
-- ADR-025 §2.1: chỉ 'OUTSIDE_PROCESSING' mang nghĩa nghiệp vụ ⛔ không thay thế
-- được (bó hàng nằm VẬT LÝ ở xưởng ngoài — trigger 009 ghi rõ mục đích "chặn
-- chuyền may quét nhầm"). 'SEWING_READY' và 'CUT_PASSED' trùng nghĩa với 'CUT'
-- ⇒ ⛔ KHÔNG thêm. Enum là từ vựng nghiệp vụ, ⛔ không phải chỗ chứa mọi chuỗi
-- đã từng gõ nhầm.
--
-- ⚠️ IF NOT EXISTS ⇒ idempotent, chạy lại lần hai ⛔ không lỗi.
ALTER TYPE public.bundle_stage_enum ADD VALUE IF NOT EXISTS 'OUTSIDE_PROCESSING';


-- ─── 3.2 · TRIGGER XUẤT GIA CÔNG ────────────────────────────────────────────
--
-- Thân hàm giữ NGUYÊN logic của 009; chỉ nay giá trị enum mới hợp lệ nên nó
-- chạy được. Chép lại đầy đủ thay vì sửa tại chỗ để tệp này tự đọc hiểu được.
CREATE OR REPLACE FUNCTION public.fn_process_subcon_issue()
RETURNS TRIGGER AS $$
BEGIN
  -- Chặn chuyền may quét nhầm bó đang nằm ở xưởng ngoài.
  UPDATE public.cut_bundles
  SET current_stage = 'OUTSIDE_PROCESSING',
      updated_at    = NOW()
  WHERE id = NEW.bundle_id;

  UPDATE public.subcon_orders
  SET total_sent_qty = total_sent_qty + NEW.quantity_sent,
      status         = 'IN_PROGRESS',
      updated_at     = NOW()
  WHERE id = NEW.subcon_order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── 3.3 · TRIGGER THU HỒI ──────────────────────────────────────────────────
--
-- 🔴 ĐỔI DUY NHẤT: 'SEWING_READY' → 'CUT'.
-- ADR-025 §2.1: "đã cắt xong, chờ khâu sau" CHÍNH LÀ sẵn sàng cho chuyền may.
-- Hai tên cho một trạng thái là cơ chế đẻ ra chính khuyết tật này.
CREATE OR REPLACE FUNCTION public.fn_process_subcon_receipt()
RETURNS TRIGGER AS $$
DECLARE
  v_current_bundle_qty INT;
BEGIN
  SELECT quantity INTO v_current_bundle_qty
  FROM public.cut_bundles
  WHERE id = NEW.bundle_id FOR UPDATE;

  IF v_current_bundle_qty IS NULL THEN
    RAISE EXCEPTION 'SUBCON_ERROR: Bundle ID % không tồn tại.', NEW.bundle_id;
  END IF;

  -- Khấu trừ đúng phần hỏng do xưởng ngoài gây ra, rồi trả bó về hàng chờ may.
  UPDATE public.cut_bundles
  SET quantity      = GREATEST(0, quantity - NEW.quantity_defect),
      current_stage = 'CUT',
      updated_at    = NOW()
  WHERE id = NEW.bundle_id;

  -- ⚠️ CHÉP NGUYÊN phần cập nhật `status` của 009 — kể cả nhánh CASE.
  -- Viết lại hàm mà làm rơi mất nó thì đơn gia công ⛔ không bao giờ chuyển
  -- sang COMPLETED, và ⛔ không ai nhận ra vì bảng vốn đã rỗng từ đầu.
  UPDATE public.subcon_orders
  SET total_received_qty = total_received_qty + NEW.quantity_good,
      total_defect_qty   = total_defect_qty + NEW.quantity_defect,
      status = CASE
        WHEN (total_received_qty + NEW.quantity_good + total_defect_qty + NEW.quantity_defect) >= total_sent_qty
          THEN 'COMPLETED'
        ELSE 'PARTIAL_RECEIVED'
      END,
      updated_at         = NOW()
  WHERE id = NEW.subcon_order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── 3.4 · ĐƠN VỊ CỦA ĐỊNH MỨC VẢI ──────────────────────────────────────────
--
-- ADR-025 §2.2: 'định mức vải' trong ngành may là MÉT TRÊN MỘT SẢN PHẨM —
-- khách và nhà máy chốt theo sản phẩm, ⛔ không theo lô, vì lô đổi số lượng
-- liên tục còn định mức thì ⛔ không.
--
-- Đơn vị nay nằm TRONG LƯỢC ĐỒ, ⛔ không nằm trong trí nhớ người viết mã.
COMMENT ON COLUMN public.cut_tickets.bom_allowance_m IS
  'Định mức vải theo MÉT TRÊN MỘT SẢN PHẨM (m/pc), ⛔ KHÔNG phải tổng mét của phiếu. '
  'Phép so vượt định mức: total_fabric_used_m > bom_allowance_m * total_planned_pcs. '
  'Xem ADR-025 §2.2.';

-- Sửa dòng nhập sai đơn vị: PK-2026-001 khai 70 m cho 50 sp ⇒ đó là TỔNG mét,
-- ⛔ không phải m/sp. 70 / 50 = 1,4 m/sp.
-- ⚠️ Có WHERE bom_allowance_m = 70 ⇒ chạy lại lần hai ⛔ không sửa tiếp lần nữa.
UPDATE public.cut_tickets
SET bom_allowance_m = 1.4
WHERE ticket_no = 'PK-2026-001'
  AND bom_allowance_m = 70;


-- ─── 3.5 · CÔNG NỢ SUBCON: DỌN MỒ CÔI RỒI MỚI KHOÁ ─────────────────────────
--
-- ADR-025 §2.3. Thứ tự BẮT BUỘC: trỏ lại → NOT VALID → VALIDATE.
-- Thêm khoá ngoại trước khi dọn thì ràng buộc thất bại ngay trên hai dòng mồ
-- côi và CẢ MIGRATION BỊ LÙI.
--
-- Hai dòng đang trỏ tới UUID ⛔ không tồn tại trong `orders`:
--   fce07362… → a0000000-0000-0000-0000-000000000002   (Xưởng Minh Phát, SC1)
--   47c25c93… → a0000000-0000-0000-0000-000000000004   (Xưởng An Khang,  SC2)
--
-- ⚠️ Trỏ lại theo `po_number`, ⛔ KHÔNG nhúng UUID cứng — UUID khác nhau giữa
-- các môi trường, `po_number` thì ⛔ không.
UPDATE public.financial_records f
SET order_id = o.id
FROM public.orders o
WHERE o.po_number = 'PO-M2601'
  AND f.subcon_id = 'SC1'
  AND NOT EXISTS (SELECT 1 FROM public.orders x WHERE x.id = f.order_id);

UPDATE public.financial_records f
SET order_id = o.id
FROM public.orders o
WHERE o.po_number = 'PO-M2602'
  AND f.subcon_id = 'SC2'
  AND NOT EXISTS (SELECT 1 FROM public.orders x WHERE x.id = f.order_id);

-- 🔴 ON DELETE RESTRICT, ⛔ KHÔNG CASCADE.
-- Xoá một đơn hàng ⛔ KHÔNG ĐƯỢC âm thầm xoá SỔ CÔNG NỢ của nhà thầu. Tiền
-- phải CHẶN việc xoá, ⛔ không im lặng biến mất cùng nó.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_financial_records_order'
  ) THEN
    ALTER TABLE public.financial_records
      ADD CONSTRAINT fk_financial_records_order
      FOREIGN KEY (order_id) REFERENCES public.orders(id)
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END $$;

-- VALIDATE tách riêng: nó quét toàn bảng, và tách ra thì lỗi (nếu còn dòng mồ
-- côi nào khác) chỉ ra ĐÚNG bước này thay vì làm hỏng cả migration.
ALTER TABLE public.financial_records
  VALIDATE CONSTRAINT fk_financial_records_order;


-- ============================================================================
-- ④ KHỐI TỰ KIỂM — kỳ vọng ⟷ thực tế
-- ============================================================================
SELECT
  'enum có OUTSIDE_PROCESSING'                       AS phep_do,
  'CÓ'                                               AS ky_vong,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'bundle_stage_enum' AND e.enumlabel = 'OUTSIDE_PROCESSING'
  ) THEN 'CÓ' ELSE '⛔ KHÔNG' END                    AS thuc_te
UNION ALL
SELECT
  'enum ⛔ KHÔNG có SEWING_READY',
  'ĐÚNG',
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'bundle_stage_enum' AND e.enumlabel = 'SEWING_READY'
  ) THEN 'ĐÚNG' ELSE '⛔ SAI — có giá trị thừa' END
UNION ALL
SELECT
  'trigger thu hồi ⛔ hết dùng SEWING_READY',
  'ĐÚNG',
  CASE WHEN position('SEWING_READY' in pg_get_functiondef(
         'public.fn_process_subcon_receipt()'::regprocedure)) = 0
       THEN 'ĐÚNG' ELSE '⛔ SAI — hàm chưa được thay' END
UNION ALL
SELECT
  'financial_records mồ côi',
  '0 dòng',
  (SELECT count(*)::text || ' dòng' FROM public.financial_records f
   WHERE NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = f.order_id))
UNION ALL
SELECT
  'khoá ngoại công nợ đã VALIDATE',
  'ĐÚNG',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_financial_records_order' AND convalidated
  ) THEN 'ĐÚNG' ELSE '⛔ SAI' END
UNION ALL
SELECT
  'PK-2026-001 định mức (m/sp)',
  '1.4',
  COALESCE((SELECT bom_allowance_m::text FROM public.cut_tickets
            WHERE ticket_no = 'PK-2026-001'), '⛔ không có phiếu')
UNION ALL
SELECT
  'COMMENT đơn vị bom_allowance_m',
  'CÓ',
  CASE WHEN col_description('public.cut_tickets'::regclass,
         (SELECT attnum FROM pg_attribute
          WHERE attrelid = 'public.cut_tickets'::regclass
            AND attname = 'bom_allowance_m')) IS NOT NULL
       THEN 'CÓ' ELSE '⛔ KHÔNG' END;

-- ============================================================================
-- ⑤ ĐỂ LÙI HAI DÒNG CÔNG NỢ (nếu cần) — chép sẵn giá trị cũ
--
--   UPDATE public.financial_records SET order_id = 'a0000000-0000-0000-0000-000000000002'
--    WHERE id = 'fce07362-b4cd-4c50-84a9-ebeed5f3fd32';
--   UPDATE public.financial_records SET order_id = 'a0000000-0000-0000-0000-000000000004'
--    WHERE id = '47c25c93-4892-4e82-a896-0ae24350da33';
--   -- ⚠️ phải DROP CONSTRAINT fk_financial_records_order TRƯỚC, ⛔ không thì FK chặn.
-- ============================================================================
