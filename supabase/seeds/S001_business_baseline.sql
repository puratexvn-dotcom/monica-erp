-- ============================================================================
-- S001 · NỀN DỮ LIỆU NGHIỆP VỤ CHO KIỂM THỬ — Quyết định ⑧
--
-- "Enterprise ERP không bao giờ audit bảng 0 dòng. Tôi yêu cầu: Seeder.
--  Không phải fake. Seeder nghiệp vụ." — Kiến trúc sư trưởng
--
-- 65 / 113 quan hệ đang RỖNG. Mọi kết luận "⛔ chặn" trên bảng rỗng đều vô
-- nghĩa: không phân biệt được "RLS chặn" với "chẳng có gì để thấy".
--
-- ── ĐÂY LÀ MỘT CHUỖI NGHIỆP VỤ HOÀN CHỈNH, KHÔNG PHẢI DÒNG RÁC ─────────────
--
--   khách ZIBUYU (THẬT, đã có sẵn)
--        └── mã hàng RP6410-S
--             └── đơn hàng SEED-PO-0001         ← customer_id ĐƯỢC GÁN
--                  ├── chi tiết cỡ/màu (3 dòng)
--                  ├── phiếu cắt SEED-CT-01
--                  │    └── bó SEED-BD-01
--                  ├── phần việc SEED · MAY   → Xưởng Minh Phát (SC1)
--                  │    ├── gắn bó SEED-BD-01
--                  │    ├── báo cáo ngày (sổ cái)
--                  │    └── kiểm QA theo giờ
--                  ├── phần việc SEED · GIẶT  → Nhà Máy Giặt Củ Chi
--                  └── lô hàng SEED-SHIP-01   → giao nhận SEED-FWD-01
--
-- ── BỐN NGUYÊN TẮC CỦA TỆP NÀY ────────────────────────────────────────────
--
-- ① KHÔNG SỬA MỘT DÒNG THẬT NÀO. Không `UPDATE`, không `DELETE`. Chỉ `INSERT`
--    những dòng mang tiền tố `SEED-`. Ba đơn hàng thật, ba chuyền may thật,
--    năm đối tác thật — không đụng tới.
--
-- ② CHẠY LẠI BAO NHIÊU LẦN CŨNG RA MỘT KẾT QUẢ. Mọi `INSERT` đều có
--    `WHERE NOT EXISTS`. Không sinh bản sao.
--
-- ③ DÙNG KHÁCH HÀNG THẬT. Kiến trúc sư yêu cầu "Đo lại Buyer bằng Customer
--    thật. Không dùng dummy." → nối vào `KHZBY` / ZIBUYU đang có trong hệ
--    thống, không bịa khách mới.
--
-- ⑤ ⚠️ TỆP NÀY CÓ **PHẦN B** (bổ sung 02/08/2026) — kịch bản phân quyền:
--    Ownership · Cross Assignment · Soft Delete · Append-only · Orphan · Giá.
--    Phần B gieo ba bảng `subcon_*` đang rỗng, cộng một chuỗi đính chính sổ
--    cái. Chạy lại tệp này trên cơ sở dữ liệu đã có Phần A là AN TOÀN — mọi
--    câu đều có `WHERE NOT EXISTS`, nên nó chỉ thêm đúng phần còn thiếu.
--
-- ④ ⚠️ HAI DÒNG KHÔNG XOÁ ĐƯỢC. `assignment_daily_reports` là SỔ CÁI
--    CHỈ-GHI-THÊM: trigger chặn cả `UPDATE` lẫn `DELETE`, KHÔNG có ngoại lệ
--    cho `service_role` (đúng chỉ thị Migration 029). Hai dòng báo cáo ngày mà
--    tệp này ghi ra — một GỐC (Phần A) và một ĐÍNH CHÍNH (Phần B, Mục 15) —
--    sẽ NẰM LẠI VĨNH VIỄN. Gỡ chúng đòi một Maintenance Script như M001/M002.
--    Đây là chủ ý: sổ cái phải có một chuỗi cha→con thật thì logic "dòng hiện
--    hành = dòng không có con" mới kiểm được. Nhưng nó là CỬA MỘT CHIỀU và
--    tôi nói rõ trước khi Ngài chạy.
--
-- CHẠY: dán toàn bộ vào SQL Editor. Mục cuối in bảng đối chiếu.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 0. CHẶN TRƯỚC — thà không chạy còn hơn chạy nửa vời
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE customer_code = 'KHZBY') THEN
    RAISE EXCEPTION 'S001 DỪNG: không thấy khách hàng thật KHZBY (ZIBUYU). '
                    'Tệp này cố ý KHÔNG bịa khách hàng mới.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.partners
                  WHERE partner_code = 'SC1' AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'S001 DỪNG: không thấy đối tác sản xuất SC1.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.partners
                  WHERE partner_code = 'SUB-GIAT-02' AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'S001 DỪNG: không thấy đối tác dịch vụ SUB-GIAT-02.';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ĐỐI TÁC GIAO NHẬN — loại FORWARDER chưa từng có dòng nào
-- ────────────────────────────────────────────────────────────────────────────
-- `partners_bridge_single` cho phép FORWARDER để trống cả bốn cột cầu nối:
-- ba loại FORWARDER/INSPECTION/AUDITOR chưa có bảng chuyên biệt (027 dòng 74).
INSERT INTO public.partners (partner_code, partner_type, name, phone, email, country, is_active)
SELECT 'SEED-FWD-01', 'FORWARDER', 'Công ty Giao nhận Sao Việt',
       '028 3822 7788', 'ops@saovietlogistics.vn', 'VIETNAM', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.partners WHERE partner_code = 'SEED-FWD-01');

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ĐỊA ĐIỂM SẢN XUẤT — bảng rỗng từ khi 028 chạy
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO public.production_sites (site_code, name, site_type, owner_partner_id,
                                     address, country, is_active)
SELECT 'SEED-ST-01', 'Xưởng Minh Phát — Cơ sở Hóc Môn', 'SEWING', p.id,
       'Ấp 3, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP. Hồ Chí Minh', 'VIETNAM', TRUE
FROM public.partners p
WHERE p.partner_code = 'SC1' AND p.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.production_sites WHERE site_code = 'SEED-ST-01');

-- ⚠️ KHÔNG `UPDATE` ba chuyền may THẬT để gán `site_id`. Đó là NỢ CHUYỂN TIẾP
-- đã ghi nhận, phải xử bằng migration có ADR chứ không bằng tệp gieo dữ liệu.
-- Ở đây tạo một chuyền RIÊNG đã gắn địa điểm, để phần Line Map của 031b có
-- thứ thật mà đo.
INSERT INTO public.sewing_lines (line_code, line_name, target_pcs_per_hour, status, site_id)
SELECT 'SEED-LINE-01', 'Chuyền May Hóc Môn 01', 55, 'ACTIVE', s.id
FROM public.production_sites s
WHERE s.site_code = 'SEED-ST-01'
  AND NOT EXISTS (SELECT 1 FROM public.sewing_lines WHERE line_code = 'SEED-LINE-01');

-- ────────────────────────────────────────────────────────────────────────────
-- 3. MÃ HÀNG — `styles` rỗng, nên RLS Buyer trên styles chưa từng được đo
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO public.styles (style_no, style_name, customer_id, product_group,
                           gender, fabric_type, sam_minutes, status)
-- `status` chỉ nhận DEVELOPMENT / APPROVED / IN_PRODUCTION / DISCONTINUED
-- (015 dòng 19). Bản nháp đầu của tệp này ghi 'ACTIVE' và sẽ đổ ngay.
SELECT 'RP6410-S', 'Áo khoác gió RP6410', c.id, 'OUTERWEAR',
       'UNISEX', 'Polyester 75D taffeta', 28.5, 'IN_PRODUCTION'
FROM public.customers c
WHERE c.customer_code = 'KHZBY'
  AND NOT EXISTS (SELECT 1 FROM public.styles WHERE style_no = 'RP6410-S');

-- ────────────────────────────────────────────────────────────────────────────
-- 4. ĐƠN HÀNG — ⭐ ĐÂY LÀ MẤU CHỐT CỦA PHÉP ĐO BUYER
-- ────────────────────────────────────────────────────────────────────────────
-- Cả BA đơn hàng thật đều có `customer_id = NULL`. `mos_buyer_can_see_order()`
-- so `o.customer_id = mos_buyer_customer_id()`; NULL thì phép so luôn ra NULL,
-- nên Buyer KHÔNG BAO GIỜ thấy dòng nào — bất kể RLS viết đúng hay sai.
--
-- Đơn này gán `customer_id` tử tế, nên lần đầu tiên đường dẫn quyền của Buyer
-- có thể được kiểm chứng thật sự.
INSERT INTO public.orders (po_number, style_code, customer_name, customer_id, style_id,
                           total_quantity, delivery_date, status, order_type,
                           currency, order_date, incoterm)
SELECT 'SEED-PO-0001', 'RP6410-S', c.name, c.id, s.id,
       2400, CURRENT_DATE + 45, 'IN_PRODUCTION', 'FOB',
       'USD', CURRENT_DATE - 10, 'FOB'
FROM public.customers c
LEFT JOIN public.styles s ON s.style_no = 'RP6410-S'
WHERE c.customer_code = 'KHZBY'
  AND NOT EXISTS (SELECT 1 FROM public.orders WHERE po_number = 'SEED-PO-0001');

INSERT INTO public.order_items (order_id, color_code, size_code, quantity)
SELECT o.id, v.color_code, v.size_code, v.qty
FROM public.orders o
CROSS JOIN (VALUES ('NAVY', 'M', 900), ('NAVY', 'L', 900), ('BLACK', 'M', 600))
        AS v(color_code, size_code, qty)
WHERE o.po_number = 'SEED-PO-0001'
  AND NOT EXISTS (SELECT 1 FROM public.order_items oi
                   WHERE oi.order_id = o.id AND oi.color_code = v.color_code
                     AND oi.size_code = v.size_code);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. PHIẾU CẮT + BÓ BÁN THÀNH PHẨM
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO public.cut_tickets (ticket_no, order_id, marker_code, marker_length_m,
                                ply_count, total_planned_pcs, total_actual_pcs,
                                bom_allowance_m, total_fabric_used_m,
                                remnant_length_m, defect_length_m, status)
SELECT 'SEED-CT-01', o.id, 'MK-RP6410-A', 6.85,
       120, 1200, 1188,
       2.5, 828.4,
       12.6, 3.2, 'COMPLETED'
FROM public.orders o
WHERE o.po_number = 'SEED-PO-0001'
  AND NOT EXISTS (SELECT 1 FROM public.cut_tickets WHERE ticket_no = 'SEED-CT-01');

INSERT INTO public.cut_bundles (cut_ticket_id, bundle_code, color_code, size_code,
                                start_ply_no, end_ply_no, quantity, shade_lot,
                                current_stage, status)
SELECT t.id, 'SEED-BD-01', 'NAVY', 'M', 1, 60, 60, 'LOT-A1', 'SEWING', 'READY'
FROM public.cut_tickets t
WHERE t.ticket_no = 'SEED-CT-01'
  AND NOT EXISTS (SELECT 1 FROM public.cut_bundles WHERE bundle_code = 'SEED-BD-01');

-- ────────────────────────────────────────────────────────────────────────────
-- 6. HAI PHẦN VIỆC — một MAY (đối tác sản xuất), một GIẶT (đối tác dịch vụ)
-- ────────────────────────────────────────────────────────────────────────────
-- Hai loại đối tác khác nhau là CÓ CHỦ Ý: `partner_permissions` gieo quyền
-- riêng cho PRODUCTION_PARTNER và SERVICE_PARTNER, nhưng chưa bao giờ có phần
-- việc thật của loại thứ hai để đối chiếu.
--
-- `assignment_no` không ghi ở đây — cột có DEFAULT `next_assignment_no()`.
INSERT INTO public.assignments (partner_id, order_id, scope_level, site_id, line_id,
                                assigned_qty, uom, priority, planned_start,
                                planned_finish, status, request_id)
SELECT p.id, o.id, 'LINE', st.id, ln.id,
       1200, 'PCS', 'HIGH', CURRENT_DATE - 5,
       CURRENT_DATE + 20, 'IN_PROGRESS', gen_random_uuid()
FROM public.partners p
JOIN public.orders o           ON o.po_number  = 'SEED-PO-0001'
JOIN public.production_sites st ON st.site_code = 'SEED-ST-01'
JOIN public.sewing_lines ln    ON ln.line_code = 'SEED-LINE-01'
WHERE p.partner_code = 'SC1' AND p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.assignments a
     WHERE a.order_id = o.id AND a.partner_id = p.id AND a.deleted_at IS NULL);

INSERT INTO public.assignments (partner_id, order_id, scope_level,
                                assigned_qty, uom, priority, planned_start,
                                planned_finish, status, request_id)
SELECT p.id, o.id, 'ORDER',
-- ⚠️ 'ISSUED', KHÔNG phải 'ASSIGNED'. Chín trạng thái hợp lệ nằm ở 029 dòng
-- 133–135: DRAFT · ISSUED · ACCEPTED · REJECTED · IN_PROGRESS · SUSPENDED ·
-- COMPLETED · CLOSED · CANCELLED. Tên miền nghiệp vụ không suy đoán được.
       1200, 'PCS', 'NORMAL', CURRENT_DATE + 18,
       CURRENT_DATE + 25, 'ISSUED', gen_random_uuid()
FROM public.partners p
JOIN public.orders o ON o.po_number = 'SEED-PO-0001'
WHERE p.partner_code = 'SUB-GIAT-02' AND p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.assignments a
     WHERE a.order_id = o.id AND a.partner_id = p.id AND a.deleted_at IS NULL);

-- Gắn bó vào phần việc MAY.
INSERT INTO public.assignment_bundles (assignment_id, bundle_id)
SELECT a.id, b.id
FROM public.assignments a
JOIN public.partners p ON p.id = a.partner_id AND p.partner_code = 'SC1'
JOIN public.orders   o ON o.id = a.order_id   AND o.po_number = 'SEED-PO-0001'
CROSS JOIN public.cut_bundles b
WHERE b.bundle_code = 'SEED-BD-01' AND a.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.assignment_bundles ab
                   WHERE ab.assignment_id = a.id AND ab.bundle_id = b.id);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. ⚠️ SỔ CÁI — CỬA MỘT CHIỀU. ĐỌC LẠI ĐOẠN ④ Ở ĐẦU TỆP TRƯỚC KHI CHẠY.
-- ────────────────────────────────────────────────────────────────────────────
-- Dòng này KHÔNG sửa được, KHÔNG xoá được, kể cả bằng `service_role`.
INSERT INTO public.assignment_daily_reports (assignment_id, report_date,
                                             target_qty, output_qty, defect_qty,
                                             rework_qty, downtime_minutes,
                                             comment, submitted_at, request_id)
SELECT a.id, CURRENT_DATE - 1,
       60, 54, 3,
       2, 35,
       'Dữ liệu nền S001 — báo cáo ngày mẫu để bài kiểm sổ cái có thứ để đo.',
       now(), gen_random_uuid()
FROM public.assignments a
JOIN public.partners p ON p.id = a.partner_id AND p.partner_code = 'SC1'
JOIN public.orders   o ON o.id = a.order_id   AND o.po_number = 'SEED-PO-0001'
WHERE a.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.assignment_daily_reports r
     WHERE r.assignment_id = a.id AND r.report_date = CURRENT_DATE - 1);

-- ────────────────────────────────────────────────────────────────────────────
-- 8. KIỂM QA THEO GIỜ — gắn thẳng vào phần việc (Quyết định ④)
-- ────────────────────────────────────────────────────────────────────────────
-- "Subcon được: QA Inline · QA Audit của chính Assignment." Muốn khoanh theo
-- `assignment_id` thì trước hết phải CÓ dòng mang `assignment_id`.
INSERT INTO public.qa_audit_reports (order_id, assignment_id, line_id, line_name,
                                     time_slot, inspected_qty, passed_qty,
                                     defect_qty, notes)
SELECT o.id, a.id, ln.id, ln.line_name,
       '14:00-15:00', 40, 37,
       3, 'Dữ liệu nền S001 — lỗi chủ yếu: bỏ mũi đường tra tay.'
FROM public.assignments a
JOIN public.partners p     ON p.id = a.partner_id AND p.partner_code = 'SC1'
JOIN public.orders   o     ON o.id = a.order_id   AND o.po_number = 'SEED-PO-0001'
JOIN public.sewing_lines ln ON ln.line_code = 'SEED-LINE-01'
WHERE a.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.qa_audit_reports q
                   WHERE q.assignment_id = a.id AND q.time_slot = '14:00-15:00');

-- ────────────────────────────────────────────────────────────────────────────
-- 9. LÔ HÀNG — `shipments` rỗng, nên toàn bộ Trung tâm Xuất hàng (024) và hai
--    view `v_po_shipments`/`v_po_shipment_readiness` chưa từng được kiểm thật
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO public.shipments (shipment_no, order_id, assignment_id, forwarder,
                              booking_no, port_of_loading, destination_port,
                              incoterm, etd_date, eta_date, status, notes)
SELECT 'SEED-SHIP-01', o.id, a.id, 'Công ty Giao nhận Sao Việt',
       'BKG-SEED-77120', 'VNSGN', 'CNSHA',
       'FOB', CURRENT_DATE + 40, CURRENT_DATE + 52, 'BOOKED',
       'Dữ liệu nền S001.'
FROM public.orders o
LEFT JOIN public.assignments a
       ON a.order_id = o.id AND a.deleted_at IS NULL
      AND a.partner_id = (SELECT id FROM public.partners WHERE partner_code = 'SC1')
WHERE o.po_number = 'SEED-PO-0001'
  AND NOT EXISTS (SELECT 1 FROM public.shipments WHERE shipment_no = 'SEED-SHIP-01');

-- ════════════════════════════════════════════════════════════════════════════
-- PHẦN B · KỊCH BẢN PHÂN QUYỀN — bổ sung 02/08/2026
-- ════════════════════════════════════════════════════════════════════════════
--
-- Ba bảng `subcon_*` đang RỖNG, nên mọi kết luận về chúng đều vô nghĩa
-- (Hiến pháp V.1). Phần B gieo đủ **sáu kịch bản** để phép đo phân biệt được
-- đúng với sai:
--
--   ① Ownership        — dòng của MÌNH và dòng của NHÀ THẦU KHÁC
--   ② Cross Assignment — dòng nối tới phần việc của ĐỐI TÁC KHÁC
--   ③ Soft Delete      — dòng đã xoá mềm, phải VÔ HÌNH khi đọc
--   ④ Append-only      — chuỗi đính chính cha→con trên sổ cái
--   ⑤ Orphan          — dòng `assignment_id IS NULL` (dữ liệu có trước 029)
--   ⑥ Giá             — `unit_price` khác nhau giữa hai nhà thầu
--
-- ⚠️ VÌ SAO ⑤ QUAN TRỌNG NHẤT: dòng mồ côi không thuộc phần việc nào và sẽ
-- MÃI MÃI không thuộc. Policy khoanh theo `assignment_id` sẽ cho ra `NULL` với
-- chúng — tức KHÔNG cho qua. Đó là hành vi đúng, nhưng phải có dòng thật để
-- chứng minh, chứ không được suy luận.
--
-- ⚠️ VÌ SAO ⑥ QUAN TRỌNG: Điều XXX — nhà thầu **❌ không thấy giá của người
-- khác**. Hai đơn gia công có `unit_price` KHÁC NHAU thì phép đo mới bắt được
-- rò rỉ; nếu cùng giá thì thấy nhầm cũng không ai biết.

-- ────────────────────────────────────────────────────────────────────────────
-- 11. PHẦN VIỆC CHO NHÀ THẦU DỊCH VỤ THỨ HAI
-- ────────────────────────────────────────────────────────────────────────────
-- Có HAI nhà thầu dịch vụ cùng có phần việc thì mới kiểm được Ownership.
-- Một cái thì "thấy 0" và "thấy đúng của mình" trông giống hệt nhau.
INSERT INTO public.assignments (partner_id, order_id, scope_level,
                                assigned_qty, uom, priority, planned_start,
                                planned_finish, status, request_id)
SELECT p.id, o.id, 'ORDER',
       1200, 'PCS', 'NORMAL', CURRENT_DATE + 10,
       CURRENT_DATE + 16, 'IN_PROGRESS', gen_random_uuid()
FROM public.partners p
JOIN public.orders o ON o.po_number = 'SEED-PO-0001'
WHERE p.partner_code = 'SUB-IN-01' AND p.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.assignments a
                   WHERE a.order_id = o.id AND a.partner_id = p.id
                     AND a.deleted_at IS NULL);

-- ────────────────────────────────────────────────────────────────────────────
-- 12. ĐƠN GIA CÔNG — BỐN DÒNG, BỐN KỊCH BẢN
-- ────────────────────────────────────────────────────────────────────────────
-- `subcon_orders.vendor_id` trỏ `subcontractors`, nên CHỈ nhà thầu DỊCH VỤ mới
-- có đơn gia công. Xưởng may (PRODUCTION_PARTNER) không có — đó là sự thật của
-- mô hình, không phải thiếu sót của dữ liệu nền.
INSERT INTO public.subcon_orders (subcon_order_no, vendor_id, order_id,
                                  process_type, assignment_id,
                                  total_sent_qty, unit_price, issued_date)
-- ① thuộc SUB-GIAT-02 · giá 4500
SELECT 'SEED-SO-GIAT', s.id, o.id, 'GIAT', a.id, 600, 4500, now()
FROM public.subcontractors s
JOIN public.partners p  ON p.subcontractor_id = s.id AND p.partner_code = 'SUB-GIAT-02'
JOIN public.orders o    ON o.po_number = 'SEED-PO-0001'
JOIN public.assignments a ON a.partner_id = p.id AND a.order_id = o.id AND a.deleted_at IS NULL
WHERE NOT EXISTS (SELECT 1 FROM public.subcon_orders WHERE subcon_order_no = 'SEED-SO-GIAT');

INSERT INTO public.subcon_orders (subcon_order_no, vendor_id, order_id,
                                  process_type, assignment_id,
                                  total_sent_qty, unit_price, issued_date)
-- ② thuộc SUB-IN-01 · giá 7800 — KHÁC ① để bắt được rò rỉ giá
SELECT 'SEED-SO-IN', s.id, o.id, 'IN_THEU', a.id, 600, 7800, now()
FROM public.subcontractors s
JOIN public.partners p  ON p.subcontractor_id = s.id AND p.partner_code = 'SUB-IN-01'
JOIN public.orders o    ON o.po_number = 'SEED-PO-0001'
JOIN public.assignments a ON a.partner_id = p.id AND a.order_id = o.id AND a.deleted_at IS NULL
WHERE NOT EXISTS (SELECT 1 FROM public.subcon_orders WHERE subcon_order_no = 'SEED-SO-IN');

INSERT INTO public.subcon_orders (subcon_order_no, vendor_id, order_id,
                                  process_type, assignment_id,
                                  total_sent_qty, unit_price, issued_date)
-- ③ MỒ CÔI — `assignment_id` NULL, mô phỏng dữ liệu có trước migration 029
SELECT 'SEED-SO-ORPHAN', s.id, o.id, 'GIAT', NULL, 200, 4500, now()
FROM public.subcontractors s
JOIN public.partners p ON p.subcontractor_id = s.id AND p.partner_code = 'SUB-GIAT-02'
JOIN public.orders o   ON o.po_number = 'SEED-PO-0001'
WHERE NOT EXISTS (SELECT 1 FROM public.subcon_orders WHERE subcon_order_no = 'SEED-SO-ORPHAN');

INSERT INTO public.subcon_orders (subcon_order_no, vendor_id, order_id,
                                  process_type, assignment_id,
                                  total_sent_qty, unit_price, issued_date)
-- ④ CHÉO — nhà cung cấp là GIAT nhưng phần việc thuộc XƯỞNG MAY SC1.
-- Dòng này cố ý LỆCH giữa "chủ theo vendor" và "chủ theo assignment". Nó tồn
-- tại để trả lời một câu chưa ai trả lời: policy sẽ khoanh theo ĐƯỜNG NÀO?
-- Nếu hai đường cho kết quả khác nhau thì thiết kế còn mơ hồ, và phải chốt.
SELECT 'SEED-SO-CROSS', s.id, o.id, 'GIAT', a.id, 100, 4500, now()
FROM public.subcontractors s
JOIN public.partners g   ON g.subcontractor_id = s.id AND g.partner_code = 'SUB-GIAT-02'
JOIN public.orders o     ON o.po_number = 'SEED-PO-0001'
JOIN public.partners sc1 ON sc1.partner_code = 'SC1' AND sc1.deleted_at IS NULL
JOIN public.assignments a ON a.partner_id = sc1.id AND a.order_id = o.id AND a.deleted_at IS NULL
WHERE NOT EXISTS (SELECT 1 FROM public.subcon_orders WHERE subcon_order_no = 'SEED-SO-CROSS');

-- ────────────────────────────────────────────────────────────────────────────
-- 13. PHIẾU XUẤT / PHIẾU THU HỒI
-- ────────────────────────────────────────────────────────────────────────────
-- Mỗi bảng một dòng CÓ phần việc và một dòng MỒ CÔI.
INSERT INTO public.subcon_issue_logs (subcon_order_id, bundle_id, quantity_sent,
                                      assignment_id, sent_at, notes)
SELECT so.id, b.id, 60, so.assignment_id, now(),
       'Dữ liệu nền S001 phần B — phiếu xuất thuộc phần việc của SUB-GIAT-02.'
FROM public.subcon_orders so
CROSS JOIN public.cut_bundles b
WHERE so.subcon_order_no = 'SEED-SO-GIAT' AND b.bundle_code = 'SEED-BD-01'
  AND NOT EXISTS (SELECT 1 FROM public.subcon_issue_logs l
                   WHERE l.subcon_order_id = so.id AND l.bundle_id = b.id);

INSERT INTO public.subcon_issue_logs (subcon_order_id, bundle_id, quantity_sent,
                                      assignment_id, sent_at, notes)
SELECT so.id, b.id, 20, NULL, now(),
       'Dữ liệu nền S001 phần B — phiếu xuất MỒ CÔI, không thuộc phần việc nào.'
FROM public.subcon_orders so
CROSS JOIN public.cut_bundles b
WHERE so.subcon_order_no = 'SEED-SO-ORPHAN' AND b.bundle_code = 'SEED-BD-01'
  AND NOT EXISTS (SELECT 1 FROM public.subcon_issue_logs l
                   WHERE l.subcon_order_id = so.id AND l.bundle_id = b.id);

INSERT INTO public.subcon_receipt_logs (subcon_order_id, bundle_id, quantity_good,
                                        quantity_defect, is_chargeable,
                                        assignment_id, received_at, defect_reason)
SELECT so.id, b.id, 57, 3, TRUE, so.assignment_id, now(),
       'Dữ liệu nền S001 phần B — 3 chiếc loang màu sau giặt.'
FROM public.subcon_orders so
CROSS JOIN public.cut_bundles b
WHERE so.subcon_order_no = 'SEED-SO-GIAT' AND b.bundle_code = 'SEED-BD-01'
  AND NOT EXISTS (SELECT 1 FROM public.subcon_receipt_logs r
                   WHERE r.subcon_order_id = so.id AND r.bundle_id = b.id);

INSERT INTO public.subcon_receipt_logs (subcon_order_id, bundle_id, quantity_good,
                                        quantity_defect, is_chargeable,
                                        assignment_id, received_at, defect_reason)
SELECT so.id, b.id, 20, 0, FALSE, NULL, now(),
       'Dữ liệu nền S001 phần B — phiếu thu hồi MỒ CÔI.'
FROM public.subcon_orders so
CROSS JOIN public.cut_bundles b
WHERE so.subcon_order_no = 'SEED-SO-ORPHAN' AND b.bundle_code = 'SEED-BD-01'
  AND NOT EXISTS (SELECT 1 FROM public.subcon_receipt_logs r
                   WHERE r.subcon_order_id = so.id AND r.bundle_id = b.id);

-- ────────────────────────────────────────────────────────────────────────────
-- 14. XOÁ MỀM — DÒNG PHẢI VÔ HÌNH KHI ĐỌC, NHƯNG VẪN NẰM TRONG BẢNG
-- ────────────────────────────────────────────────────────────────────────────
-- ADR-005 Split Policy: SELECT lọc `deleted_at`, UPDATE thì không, DELETE cấm.
-- Không có dòng đã xoá mềm thì không đo được vế thứ nhất.
--
-- ⚠️ `assignment_commercial_terms` giữ GIÁ. Hai dòng dưới đây là điều khoản
-- của phần việc SC1: một CÒN HIỆU LỰC, một ĐÃ XOÁ MỀM.
INSERT INTO public.assignment_commercial_terms (assignment_id, unit_price, currency, uom)
SELECT a.id, 12500, 'VND', 'PCS'
FROM public.assignments a
JOIN public.partners p ON p.id = a.partner_id AND p.partner_code = 'SC1'
JOIN public.orders o   ON o.id = a.order_id AND o.po_number = 'SEED-PO-0001'
WHERE a.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.assignment_commercial_terms t
                   WHERE t.assignment_id = a.id AND t.deleted_at IS NULL);

-- Dòng thứ hai rồi xoá mềm ngay. Chỉ mục duy nhất một phần
-- `uq_act_assignment_active` chỉ cấm TRÙNG khi còn hiệu lực, nên phải xoá mềm
-- dòng này TRƯỚC khi nó va vào dòng trên — làm gọn trong một câu `WITH`.
WITH moi AS (
  INSERT INTO public.assignment_commercial_terms (assignment_id, unit_price, currency, uom)
  SELECT a.id, 9900, 'VND', 'PCS'
  FROM public.assignments a
  JOIN public.partners p ON p.id = a.partner_id AND p.partner_code = 'SUB-GIAT-02'
  JOIN public.orders o   ON o.id = a.order_id AND o.po_number = 'SEED-PO-0001'
  WHERE a.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.assignment_commercial_terms t
                     WHERE t.assignment_id = a.id)
  RETURNING id
)
UPDATE public.assignment_commercial_terms t
   SET deleted_at = now()
  FROM moi
 WHERE t.id = moi.id;

-- ────────────────────────────────────────────────────────────────────────────
-- 15. ⚠️ SỔ CÁI — CHUỖI ĐÍNH CHÍNH. CỬA MỘT CHIỀU, ĐỌC KỸ TRƯỚC KHI CHẠY.
-- ────────────────────────────────────────────────────────────────────────────
-- Sổ cái chỉ-ghi-thêm: sửa một báo cáo nghĩa là GHI THÊM một dòng con trỏ về
-- dòng cha qua `parent_report_id`. "Dòng hiện hành" = dòng KHÔNG có con.
--
-- Không có chuỗi cha→con thì logic ấy chưa từng được kiểm trên dữ liệu thật.
--
-- ⚠️ Dòng này KHÔNG XOÁ ĐƯỢC, KHÔNG SỬA ĐƯỢC — kể cả bằng `service_role`.
-- Sau khi chạy, sổ cái sẽ có 2 dòng và vĩnh viễn là 2.
INSERT INTO public.assignment_daily_reports (assignment_id, report_date,
                                             parent_report_id, correction_reason,
                                             target_qty, output_qty, defect_qty,
                                             rework_qty, downtime_minutes,
                                             comment, submitted_at, request_id)
SELECT r.assignment_id, r.report_date,
       r.id, 'Đếm lại cuối ca: sót 4 chiếc chưa vào sổ.',
       r.target_qty, 58, r.defect_qty,
       r.rework_qty, r.downtime_minutes,
       'Dữ liệu nền S001 phần B — dòng ĐÍNH CHÍNH. Dòng cha vẫn còn, và phải '
       || 'KHÔNG được coi là hiện hành nữa.',
       now(), gen_random_uuid()
FROM public.assignment_daily_reports r
WHERE r.parent_report_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.assignment_daily_reports c
                   WHERE c.parent_report_id = r.id);

-- ────────────────────────────────────────────────────────────────────────────
-- 10. ĐỐI CHIẾU
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ KHÔNG gieo `buyer_accounts` và `partner_accounts`: hai bảng đó nối vào
-- TÀI KHOẢN ĐĂNG NHẬP. Gieo sẵn nghĩa là để lại thông tin đăng nhập thường
-- trú trong cơ sở dữ liệu thật. Bài kiểm tự dựng tài khoản tạm rồi nối vào
-- dữ liệu nền này, và dọn sạch khi xong.
SELECT muc, ket_qua, ky_vong,
       CASE WHEN ket_qua = ky_vong THEN '✅' ELSE '⛔ LỆCH' END AS dat
FROM (VALUES
  ('Đối tác giao nhận',
   (SELECT COUNT(*)::TEXT FROM public.partners WHERE partner_type = 'FORWARDER'), '1'),
  ('Địa điểm sản xuất',
   (SELECT COUNT(*)::TEXT FROM public.production_sites WHERE site_code = 'SEED-ST-01'), '1'),
  ('Chuyền may có site_id',
   (SELECT COUNT(*)::TEXT FROM public.sewing_lines WHERE site_id IS NOT NULL), '1'),
  ('Mã hàng',
   (SELECT COUNT(*)::TEXT FROM public.styles WHERE style_no = 'RP6410-S'), '1'),
  ('⭐ Đơn hàng CÓ customer_id',
   (SELECT COUNT(*)::TEXT FROM public.orders WHERE customer_id IS NOT NULL), '1'),
  ('Chi tiết đơn hàng',
   (SELECT COUNT(*)::TEXT FROM public.order_items), '3'),
  ('Phiếu cắt nền',
   (SELECT COUNT(*)::TEXT FROM public.cut_tickets WHERE ticket_no = 'SEED-CT-01'), '1'),
  ('Bó nền',
   (SELECT COUNT(*)::TEXT FROM public.cut_bundles WHERE bundle_code = 'SEED-BD-01'), '1'),
  ('⭐ Phần việc',
   (SELECT COUNT(*)::TEXT FROM public.assignments WHERE deleted_at IS NULL), '3'),
  -- ── PHẦN B · kịch bản phân quyền ────────────────────────────────────────
  ('B · Đơn gia công (4 kịch bản)',
   (SELECT COUNT(*)::TEXT FROM public.subcon_orders), '4'),
  ('B · ...trong đó MỒ CÔI (assignment_id NULL)',
   (SELECT COUNT(*)::TEXT FROM public.subcon_orders WHERE assignment_id IS NULL), '1'),
  ('B · ...hai mức GIÁ khác nhau',
   (SELECT COUNT(DISTINCT unit_price)::TEXT FROM public.subcon_orders), '2'),
  ('B · Phiếu xuất (1 có việc + 1 mồ côi)',
   (SELECT COUNT(*)::TEXT FROM public.subcon_issue_logs), '2'),
  ('B · Phiếu thu hồi (1 có việc + 1 mồ côi)',
   (SELECT COUNT(*)::TEXT FROM public.subcon_receipt_logs), '2'),
  ('B · Điều khoản CÒN hiệu lực',
   (SELECT COUNT(*)::TEXT FROM public.assignment_commercial_terms
     WHERE deleted_at IS NULL), '1'),
  ('B · ⭐ Điều khoản ĐÃ XOÁ MỀM',
   (SELECT COUNT(*)::TEXT FROM public.assignment_commercial_terms
     WHERE deleted_at IS NOT NULL), '1'),
  ('B · ⚠️ Sổ cái sau đính chính (KHÔNG XOÁ ĐƯỢC)',
   (SELECT COUNT(*)::TEXT FROM public.assignment_daily_reports), '2'),
  ('B · ...dòng HIỆN HÀNH (không có con)',
   (SELECT COUNT(*)::TEXT FROM public.assignment_daily_reports r
     WHERE NOT EXISTS (SELECT 1 FROM public.assignment_daily_reports c
                        WHERE c.parent_report_id = r.id)), '1'),
  ('Phần việc gắn bó',
   (SELECT COUNT(*)::TEXT FROM public.assignment_bundles), '1'),
  ('⚠️ Sổ cái (KHÔNG XOÁ ĐƯỢC)',
   (SELECT COUNT(*)::TEXT FROM public.assignment_daily_reports), '1'),
  ('Kiểm QA gắn phần việc',
   (SELECT COUNT(*)::TEXT FROM public.qa_audit_reports WHERE assignment_id IS NOT NULL), '1'),
  ('Lô hàng',
   (SELECT COUNT(*)::TEXT FROM public.shipments), '1'),
  ('Ba đơn hàng THẬT còn nguyên',
   (SELECT COUNT(*)::TEXT FROM public.orders WHERE po_number <> 'SEED-PO-0001'), '3'),
  ('Ba chuyền may THẬT còn nguyên',
   (SELECT COUNT(*)::TEXT FROM public.sewing_lines WHERE line_code <> 'SEED-LINE-01'), '3'),
  ('Năm đối tác THẬT còn nguyên',
   (SELECT COUNT(*)::TEXT FROM public.partners WHERE partner_code NOT LIKE 'SEED-%'), '5')
) AS t(muc, ket_qua, ky_vong);

COMMIT;
