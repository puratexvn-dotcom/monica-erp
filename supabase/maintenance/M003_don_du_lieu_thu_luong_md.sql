-- ============================================================================
-- MONICA MOS — MAINTENANCE SCRIPT M003
-- DỌN DỮ LIỆU THỬ SINH RA KHI ĐI HẾT LUỒNG NGHIỆP VỤ MD   (07/08/2026)
--
-- ⚠️ KHÔNG PHẢI MIGRATION. ⛔ Không chạy tự động. Phải có phê duyệt mỗi lần chạy.
--
-- ─── VÌ SAO CÓ TỆP NÀY ───────────────────────────────────────────────────
-- Board yêu cầu *"đăng nhập bằng tài khoản MD thật, đi hết toàn bộ quy trình
-- nghiệp vụ"*. ⛔ Không có staging — `.env.local` trỏ **một** CSDL và đó là
-- **CSDL THẬT**. Nên phép đi luồng đó **⛔ bắt buộc phải ghi thật**, và nó để
-- lại **13 dòng** mang tiền tố `WF0`.
--
-- 🔑 Chúng ⛔ không vô hại. Bàn làm việc MD đọc *"17 tổng PO còn chạy"* và
-- *"TRỄ GIAO 6"* — ba trong số đó là rác của phép thử. Một chỉ số điều hành
-- lẫn dữ liệu thử là chỉ số **⛔ không dùng được**, và ⛔ không ai nhìn con số
-- mà biết được điều đó.
--
-- ─── VÌ SAO LÀ SQL CHỨ ⛔ KHÔNG PHẢI SCRIPT ──────────────────────────────
-- `CLAUDE.md` §3: *"Người dùng tự chạy migration trên Supabase SQL Editor."*
-- Xoá cứng là thao tác **⛔ không đảo được**; nó phải đi qua mắt người, ⛔
-- không đi qua một lời gọi `service_role` lặng lẽ trong phiên làm việc.
--
-- ─── TÍNH ĐẢO NGƯỢC ──────────────────────────────────────────────────────
-- **MỘT CHIỀU.** Xoá xong ⛔ không khôi phục được. Chấp nhận được **vì và chỉ
-- vì** 13 dòng này do bộ thử tự sinh trong ngày 07/08/2026, ⛔ không mang
-- nghiệp vụ nào — Mục 1 in ra để mắt người xác nhận điều đó **trước** khi Mục 2
-- chạy.
--
-- ⚠️ CHẠY MỤC 1 TRƯỚC. Đọc kết quả. Chỉ khi đúng 13 dòng và **toàn bộ** đều
-- mang tiền tố `WF0` mới chạy Mục 2.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. XEM TRƯỚC — ⛔ KHÔNG XOÁ GÌ
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'shipments'         AS bang, shipment_no  AS ma, created_at FROM shipments         WHERE shipment_no  ILIKE 'WF0%'
UNION ALL SELECT 'production_orders', order_no,    created_at FROM production_orders WHERE order_no      ILIKE 'WF0%'
UNION ALL SELECT 'material_requests', request_no,  created_at FROM material_requests WHERE request_no    ILIKE 'WF0%'
UNION ALL SELECT 'orders',            po_number,   created_at FROM orders            WHERE po_number     ILIKE 'WF0%'
UNION ALL SELECT 'costings',          costing_no,  created_at FROM costings          WHERE costing_no    ILIKE 'WF0%'
UNION ALL SELECT 'styles',            style_no,    created_at FROM styles            WHERE style_no      ILIKE 'WF0%'
UNION ALL SELECT 'inquiries',         inquiry_no,  created_at FROM inquiries         WHERE inquiry_no    ILIKE 'WF0%'
UNION ALL SELECT 'customers',         customer_code, created_at FROM customers       WHERE customer_code ILIKE 'WF0%'
ORDER BY bang, ma;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. DỌN — chạy SAU KHI đã đọc Mục 1
--
-- Thứ tự theo KHOÁ NGOẠI: con trước, cha sau. Đảo thứ tự ⇒ `23503`.
-- ════════════════════════════════════════════════════════════════════════════
BEGIN;

-- Mốc tiến độ treo vào đơn — phải đi TRƯỚC đơn.
DELETE FROM order_milestones
 WHERE order_id IN (SELECT id FROM orders WHERE po_number ILIKE 'WF0%');

DELETE FROM shipments         WHERE shipment_no  ILIKE 'WF0%';
DELETE FROM production_orders WHERE order_no     ILIKE 'WF0%';
DELETE FROM material_requests WHERE request_no   ILIKE 'WF0%';
DELETE FROM orders            WHERE po_number    ILIKE 'WF0%';
DELETE FROM costings          WHERE costing_no   ILIKE 'WF0%';
DELETE FROM styles            WHERE style_no     ILIKE 'WF0%';
DELETE FROM inquiries         WHERE inquiry_no   ILIKE 'WF0%';
DELETE FROM customers         WHERE customer_code ILIKE 'WF0%';

-- ── KHỐI TỰ KIỂM ────────────────────────────────────────────────────────────
-- In kỳ vọng ⟷ thực tế. Còn sót dòng nào ⇒ dòng đó có ràng buộc chưa gỡ, và
-- ⛔ KHÔNG được xử lý bằng cách tắt ràng buộc.
DO $$
DECLARE con INT;
BEGIN
  SELECT (SELECT count(*) FROM shipments         WHERE shipment_no   ILIKE 'WF0%')
       + (SELECT count(*) FROM production_orders WHERE order_no      ILIKE 'WF0%')
       + (SELECT count(*) FROM material_requests WHERE request_no    ILIKE 'WF0%')
       + (SELECT count(*) FROM orders            WHERE po_number     ILIKE 'WF0%')
       + (SELECT count(*) FROM costings          WHERE costing_no    ILIKE 'WF0%')
       + (SELECT count(*) FROM styles            WHERE style_no      ILIKE 'WF0%')
       + (SELECT count(*) FROM inquiries         WHERE inquiry_no    ILIKE 'WF0%')
       + (SELECT count(*) FROM customers         WHERE customer_code ILIKE 'WF0%')
    INTO con;
  RAISE NOTICE 'Dòng WF0 còn lại — kỳ vọng 0, thực tế %', con;
  IF con <> 0 THEN
    RAISE EXCEPTION 'Còn % dòng thử chưa dọn được — DỪNG, ⛔ không COMMIT', con;
  END IF;
END $$;

COMMIT;
