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
-- ④ ⚠️ MỘT DÒNG KHÔNG XOÁ ĐƯỢC. `assignment_daily_reports` là SỔ CÁI
--    CHỈ-GHI-THÊM: trigger chặn cả `UPDATE` lẫn `DELETE`, KHÔNG có ngoại lệ
--    cho `service_role` (đúng chỉ thị Migration 029). Dòng báo cáo ngày mà
--    tệp này ghi ra sẽ NẰM LẠI VĨNH VIỄN. Gỡ nó đòi một Maintenance Script
--    như M001/M002. Đây là chủ ý — sổ cái phải có dữ liệu thì bài kiểm mới
--    có nghĩa — nhưng nó là CỬA MỘT CHIỀU và tôi nói rõ trước khi Ngài chạy.
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
   (SELECT COUNT(*)::TEXT FROM public.assignments WHERE deleted_at IS NULL), '2'),
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
