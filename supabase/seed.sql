-- ============================================================================
-- MONICA GARMENT ERP — Seed dữ liệu demo lên DB THẬT
-- Chạy SAU khi đã chạy schema.sql (SQL Editor → paste toàn bộ → Run)
-- Sau khi seed xong, app sẽ hiển thị dữ liệu thật (badge "Dữ liệu demo" biến mất)
-- ============================================================================

-- ── XƯỞNG & CHUYỀN ──────────────────────────────────────────────────────────
insert into subcons (id, name, contact, phone, capacity_per_day) values
  ('SC1', 'Xưởng Minh Phát', 'A. Phát', '0903 111 222', 900),
  ('SC2', 'Xưởng An Khang',  'C. Khang', '0913 333 444', 1200),
  ('SC3', 'Xưởng Đại Lộc',   'A. Lộc',  '0938 555 666', 700)
on conflict (id) do nothing;

insert into sewing_lines (id, name, worker_count, sam_default) values
  ('L1', 'Chuyền 1', 28, 12),
  ('L2', 'Chuyền 2', 30, 15),
  ('L3', 'Chuyền 3', 26, 10)
on conflict (id) do nothing;

-- ── 10 TÀI KHOẢN (⚠️ demo — production dùng Supabase Auth) ─────────────────
insert into users (username, password, role, name, avatar, subcon_id, buyer_brand, active) values
  ('superadmin',  'monicasa',    'superadmin',  'Trần Quản Trị',   'QT', null,  null,        true),
  ('giamdoc',     'monicagd',    'giamdoc',     'Nguyễn Giám Đốc', 'GĐ', null,  null,        true),
  ('md',          'monicamd',    'md',          'Lê Thu Hà (MD)',  'HA', null,  null,        true),
  ('qa',          'monicaqa',    'qa',          'Phạm Kiểm Hàng',  'QA', null,  null,        true),
  ('totruongmay', 'monicattm',   'totruongmay', 'Vũ Tổ May',       'TM', null,  null,        true),
  ('totruongcat', 'monicattc',   'totruongcat', 'Đỗ Tổ Cắt',       'TC', null,  null,        true),
  ('kho',         'monicakho',   'kho',         'Bùi Thủ Kho',     'KH', null,  null,        true),
  ('ketoan',      'monicakt',    'ketoan',      'Hoàng Kế Toán',   'KT', null,  null,        true),
  ('subcon',      'monicasub',   'subcon',      'Xưởng Minh Phát', 'MP', 'SC1', null,        true),
  ('buyer',       'monicabuyer', 'buyer',       'NORDIC EU Buyer', 'ND', null,  'NORDIC EU', true)
on conflict (username) do nothing;

-- ── 6 PO (uuid cố định để tham chiếu FK) ────────────────────────────────────
insert into orders (id, po_code, brand, product_name, target_qty, size_breakdown, unit_price_cmt, unit_price_fob, status, etd_date, xfactory_date, subcon_id, line_id, created_at) values
  ('a0000000-0000-0000-0000-000000000001', 'PO-M2601', 'MONICA',    'Áo Polo Nam Piqué',      2000, '{"S":300,"M":700,"L":700,"XL":300}',  32000, 185000, 'Đang may',   current_date + 12, current_date + 6,  null,  'L1', now() - interval '18 days'),
  ('a0000000-0000-0000-0000-000000000002', 'PO-M2602', 'NORDIC EU', 'Quần Jogger Nỉ Da Cá',   3500, '{"S":500,"M":1200,"L":1200,"XL":600}', 38000, 230000, 'Đang may',   current_date + 2,  current_date - 4,  'SC1', null, now() - interval '35 days'),
  ('a0000000-0000-0000-0000-000000000003', 'PO-M2603', 'SAKURA JP', 'Váy Sơ Mi Lụa',          1200, '{"S":300,"M":500,"L":400}',            45000, 320000, 'Chờ QA',     current_date + 9,  current_date + 4,  null,  'L2', now() - interval '28 days'),
  ('a0000000-0000-0000-0000-000000000004', 'PO-M2604', 'NORDIC EU', 'Áo Khoác Gió 2 Lớp',     5000, '{"S":800,"M":1700,"L":1700,"XL":800}', 52000, 410000, 'Đang cắt',   current_date + 30, current_date + 24, 'SC2', null, now() - interval '10 days'),
  ('a0000000-0000-0000-0000-000000000005', 'PO-M2605', 'URBAN VN',  'Áo Thun Cotton Compact',  800, '{"M":300,"L":300,"XL":200}',           21000, 125000, 'Đã xuất',    current_date - 3,  current_date - 5,  null,  'L3', now() - interval '45 days'),
  ('a0000000-0000-0000-0000-000000000006', 'PO-M2606', 'MONICA',    'Đầm Maxi Voan Hoa',      1500, '{"S":400,"M":600,"L":500}',            48000, 350000, 'Mới',        current_date + 45, current_date + 38, null,  null, now() - interval '2 days')
on conflict (id) do nothing;

-- ── BOM ─────────────────────────────────────────────────────────────────────
insert into bom (order_id, item_name, category, unit, norm_per_pcs, wastage_percent, npl_status) values
  ('a0000000-0000-0000-0000-000000000001', 'Vải Piqué CD 235GSM - Navy',   'Vải',   'm',    0.85, 3,   'Đã về kho'),
  ('a0000000-0000-0000-0000-000000000001', 'Chỉ Poly 40/2 - Navy',          'Chỉ',   'cuộn', 0.04, 2,   'Đã về kho'),
  ('a0000000-0000-0000-0000-000000000001', 'Cúc 4 lỗ 15L',                  'Cúc',   'cái',  3,    1.5, 'Đã về kho'),
  ('a0000000-0000-0000-0000-000000000001', 'Nhãn chính + nhãn giặt MONICA', 'Nhãn',  'bộ',   1,    1,   'Đã về kho'),
  ('a0000000-0000-0000-0000-000000000002', 'Vải Nỉ Da Cá 320GSM - Xám',    'Vải',   'm',    1.2,  5,   'Thiếu hụt'),
  ('a0000000-0000-0000-0000-000000000002', 'Dây luồn lưng + Khoen',         'Khóa',  'bộ',   1,    2,   'Đã về kho'),
  ('a0000000-0000-0000-0000-000000000003', 'Vải Lụa Habutai - Kem',         'Vải',   'm',    1.6,  4,   'Đã về kho'),
  ('a0000000-0000-0000-0000-000000000004', 'Vải Gió Poly 75D Tráng PU',     'Vải',   'm',    2.1,  4,   'Đang về'),
  ('a0000000-0000-0000-0000-000000000004', 'Khóa Nylon #5 - Đen',           'Khóa',  'cái',  1,    2,   'Đã về kho'),
  ('a0000000-0000-0000-0000-000000000006', 'Vải Voan Hoa Nhí',              'Vải',   'm',    2.4,  5,   'Chưa đặt');

-- ── KHO ─────────────────────────────────────────────────────────────────────
insert into inventory (item_name, type, qty_kg, qty_m, gsm, width_m, color_code, dye_lot, shade, roll_count, safety_stock, order_id) values
  ('Vải Piqué CD 235GSM - Navy',   'NPL', 720, 1802.5, 235, 1.7, 'NV-19', 'DL-2415', 'A', 32,  400,  'a0000000-0000-0000-0000-000000000001'),
  ('Vải Nỉ Da Cá 320GSM - Xám',    'NPL', 310, 605.5,  320, 1.6, 'GR-07', 'DL-2398', 'B', 14,  1500, 'a0000000-0000-0000-0000-000000000002'),
  ('Vải Gió Poly 75D Tráng PU',    'NPL', 980, 8909,   110, 1.5, 'BK-01', 'DL-2422', 'A', 58,  6000, 'a0000000-0000-0000-0000-000000000004'),
  ('Vải Lụa Habutai - Kem',        'NPL', 130, 1911.7, 68,  1.4, 'CR-02', 'DL-2401', 'A', 21,  500,  'a0000000-0000-0000-0000-000000000003'),
  ('Khóa Nylon #5 - Đen',          'NPL', 0,   0,      0,   0,   'BK',    '',        '',  5600, 5100, 'a0000000-0000-0000-0000-000000000004'),
  ('TP: Áo Thun Cotton (PO-M2605)', 'Thành phẩm', 0, 0, 0, 0, '', '', '', 800, 0, 'a0000000-0000-0000-0000-000000000005'),
  ('TP: Váy Sơ Mi Lụa (PO-M2603)',  'Thành phẩm', 0, 0, 0, 0, '', '', '', 460, 0, 'a0000000-0000-0000-0000-000000000003');

-- ── NHẬT KÝ CẮT + BÓ HÀNG ──────────────────────────────────────────────────
insert into cutting_logs (id, order_id, marker_name, table_count, ply_count, size_ratio, cut_qty, fabric_used_m, marker_length_m, waste_percent, created_at) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'SD-Polo-A',   6, 60, '{"S":1,"M":2,"L":2,"XL":1}', 2140, 920,  895.4,  2.67, now() - interval '9 days'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'SD-Jacket-A', 8, 45, '{"S":1,"M":2,"L":2,"XL":1}', 2160, 2100, 2013.9, 4.10, now() - interval '2 days');

insert into bundles (order_id, cutting_log_id, bundle_no, size, qty, status) values
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'PO-M2601-S-01',  'S',  30, 'Đã giao chuyền'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'PO-M2601-M-01',  'M',  30, 'Đã giao chuyền'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'PO-M2601-M-02',  'M',  30, 'Đã giao chuyền'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'PO-M2601-L-01',  'L',  30, 'Đã giao chuyền'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'PO-M2601-XL-01', 'XL', 30, 'Đã cắt'),
  ('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'PO-M2604-M-01',  'M',  45, 'Đã cắt');

-- ── PROD LOGS: 7 ngày × 8 khung giờ ────────────────────────────────────────
-- Chuyền 1 may PO-M2601 (lỗi ~1,2%)
insert into prod_logs (order_id, subcon_id, line_id, stage, qty_ok, qty_defect, hour_slot, created_at)
select 'a0000000-0000-0000-0000-000000000001', null, 'L1',
       (array['May thân','Tra tay','Vào lưng/khóa','Hoàn thiện'])[1 + (floor(random()*4))::int],
       22 + (random()*12)::int,
       (random()*1.4)::int,
       lpad(h::text, 2, '0') || 'h',
       (current_date - d) + make_interval(hours => h)
from generate_series(0, 6) d, unnest(array[8,9,10,11,13,14,15,16]) h;

-- Xưởng Minh Phát (SC1) may PO-M2602 — tỷ lệ lỗi ~4,3% ⚠️ (kích hoạt cảnh báo đỏ)
insert into prod_logs (order_id, subcon_id, line_id, stage, qty_ok, qty_defect, hour_slot, created_at)
select 'a0000000-0000-0000-0000-000000000002', 'SC1', null,
       (array['May thân','Tra tay','Vào lưng/khóa','Hoàn thiện'])[1 + (floor(random()*4))::int],
       36 + (random()*14)::int,
       1 + (random()*2.4)::int,
       lpad(h::text, 2, '0') || 'h',
       (current_date - d) + make_interval(hours => h)
from generate_series(0, 6) d, unnest(array[8,9,10,11,13,14,15,16]) h;

-- Chuyền 2 may PO-M2603
insert into prod_logs (order_id, subcon_id, line_id, stage, qty_ok, qty_defect, hour_slot, created_at)
select 'a0000000-0000-0000-0000-000000000003', null, 'L2',
       (array['May thân','Tra tay','Hoàn thiện'])[1 + (floor(random()*3))::int],
       12 + (random()*8)::int,
       (random()*1.2)::int,
       lpad(h::text, 2, '0') || 'h',
       (current_date - d) + make_interval(hours => h)
from generate_series(0, 6) d, unnest(array[8,10,14,16]) h;

-- ── QA LOGS ─────────────────────────────────────────────────────────────────
insert into qa_logs (order_id, inspection_type, lot_size, sample_size, ac_number, re_number, defect_type, defect_class, qty_defect, checked_qty, aql_status, capa_note, created_at) values
  ('a0000000-0000-0000-0000-000000000003', 'Endline', 1200, 80,  5, 6, 'Nhăn mũi may + Loang màu', 'Major', 6, 80,  'Fail', 'Tái chế toàn lô, chỉnh chân vịt máy 2 kim, tách cuộn khác shade', now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000003', 'Endline', 460,  50,  3, 4, 'Đứt chỉ diễu',              'Major', 2, 50,  'Pass', '', now() - interval '3 days'),
  ('a0000000-0000-0000-0000-000000000005', 'Endline', 800,  80,  5, 6, 'Chỉ thừa',                  'Minor', 3, 80,  'Pass', '', now() - interval '6 days'),
  ('a0000000-0000-0000-0000-000000000002', 'Endline', 1800, 125, 7, 8, 'Lệch sọc lưng',             'Major', 7, 125, 'Pass', 'Yêu cầu xưởng kiểm 100% trước khi giao đợt 2', now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000001', 'Inline', 0, 0, 0, 0, 'Bỏ mũi',                  'Major', 14, 240, 'Pending', 'Thay kim DBx1 #11, kiểm tra độ căng chỉ', now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000001', 'Inline', 0, 0, 0, 0, 'Đứt chỉ',                 'Major', 9,  240, 'Pending', '', now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000002', 'Inline', 0, 0, 0, 0, 'Loang màu (khác shade)',  'Major', 7,  180, 'Pending', 'Tách cuộn lô DL-2398 shade B khỏi bàn cắt', now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000001', 'Inline', 0, 0, 0, 0, 'Nhăn mũi may',            'Minor', 5,  240, 'Pending', '', now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000002', 'Inline', 0, 0, 0, 0, 'Khóa/dây kéo hỏng',       'Major', 3,  180, 'Pending', '', now()),
  ('a0000000-0000-0000-0000-000000000001', 'Inline', 0, 0, 0, 0, 'Dơ dầu máy',              'Minor', 2,  240, 'Pending', 'Vệ sinh ổ máy đầu giờ', now());

-- ── SAMPLES ─────────────────────────────────────────────────────────────────
insert into samples (order_id, stage, status, buyer_comment, sent_date) values
  ('a0000000-0000-0000-0000-000000000001', 'Proto', 'Approved', 'OK form',                        now() - interval '30 days'),
  ('a0000000-0000-0000-0000-000000000001', 'Fit',   'Approved', 'Nới vòng ngực +1cm đã chỉnh',    now() - interval '24 days'),
  ('a0000000-0000-0000-0000-000000000001', 'SMS',   'Approved', '',                               now() - interval '18 days'),
  ('a0000000-0000-0000-0000-000000000001', 'PP',    'Đã gửi',   '',                               now() - interval '3 days'),
  ('a0000000-0000-0000-0000-000000000002', 'PP',    'Approved', 'Approved: đổi dây luồn tròn',    now() - interval '20 days'),
  ('a0000000-0000-0000-0000-000000000002', 'TOP',   'Đang làm', '',                               null),
  ('a0000000-0000-0000-0000-000000000006', 'Proto', 'Đang làm', '',                               null);

-- ── CÔNG NỢ ─────────────────────────────────────────────────────────────────
insert into financial_records (order_id, subcon_id, qa_passed_qty, unit_price, penalty_amount, penalty_note, advance_pay, total_pay, status) values
  ('a0000000-0000-0000-0000-000000000002', 'SC1', 1800, 38000, 4500000, 'Đền bù 120m vải nỉ hỏng vượt định mức hao hụt 5%', 20000000, 1800*38000 - 4500000 - 20000000, 'Chờ đối soát'),
  ('a0000000-0000-0000-0000-000000000004', 'SC2', 0,    52000, 0,       '',                                                  15000000, -15000000,                        'Chờ đối soát');

-- ── PHÊ DUYỆT / SHIPMENT / THÔNG BÁO / FEEDBACK / LOG ───────────────────────
insert into approvals (type, requester, order_id, content, qty, status, reason, created_at) values
  ('Cấp bù NPL',       'Xưởng Minh Phát', 'a0000000-0000-0000-0000-000000000002', 'Xin cấp bù 120m Vải Nỉ Da Cá 320GSM (lỗi loang màu lô DL-2398 shade B)', 120, 'Chờ duyệt', '', now() - interval '1 day'),
  ('Hợp đồng Subcon',  'Lê Thu Hà (MD)',  null, 'Ký hợp đồng gia công với Xưởng Đại Lộc — 700 SP/ngày, CMT 35.000đ', 0, 'Chờ duyệt', '', now() - interval '2 days'),
  ('Xuất vượt định mức', 'Bùi Thủ Kho',   'a0000000-0000-0000-0000-000000000001', 'Xuất thêm 40m Vải Piqué bù bàn cắt lại size M', 40, 'Đã duyệt', 'Trong giới hạn 3% cho phép', now() - interval '5 days');

insert into shipments (order_id, carton_count, qty, gw_kg, nw_kg, etd, status) values
  ('a0000000-0000-0000-0000-000000000005', 34, 800, 428, 396, current_date - 3, 'Đã xuất'),
  ('a0000000-0000-0000-0000-000000000003', 19, 460, 232, 214, current_date + 9, 'Chuẩn bị');

insert into notifications (severity, message, roles, read, created_at) values
  ('critical', '⚠ PO-M2602 (Quần Jogger Nỉ) TRỄ 4 ngày so với ngày xuất xưởng kế hoạch', '["giamdoc","md","superadmin"]', false, now()),
  ('critical', 'Xưởng Minh Phát có tỷ lệ lỗi 4,3% — vượt ngưỡng 3%',                      '["giamdoc","qa","superadmin"]', false, now()),
  ('critical', 'Lô Endline PO-M2603 RỚT AQL 2.5 (6 Major / Ac=5) — yêu cầu tái chế',      '["giamdoc","md","qa","superadmin"]', false, now() - interval '1 day'),
  ('warning',  'Vải Nỉ Da Cá 320GSM dưới mức tồn an toàn (605m / cần 1.500m)',            '["kho","md","giamdoc","superadmin"]', false, now() - interval '1 day'),
  ('info',     'Mẫu PP của PO-M2601 đã gửi buyer, chờ approve',                            '["md","giamdoc","superadmin"]', true, now() - interval '3 days');

insert into feedbacks (order_id, buyer_user, rating, content, created_at) values
  ('a0000000-0000-0000-0000-000000000005', 'NORDIC EU Buyer', 4, 'On-time delivery, packing tốt. Cần cải thiện độ đồng đều màu giữa các lô.', now() - interval '2 days');

insert into system_logs ("user", action, detail, created_at) values
  ('giamdoc', 'DUYỆT',     'Duyệt xuất vượt định mức 40m Piqué (PO-M2601)', now() - interval '5 days'),
  ('qa',      'AQL_FAIL',  'Rớt lô Endline PO-M2603 (6 Major/Ac 5)',        now() - interval '1 day'),
  ('kho',     'NHẬP KHO',  'Nhập 58 cuộn Vải Gió Poly 75D (DL-2422, A)',    now() - interval '4 days'),
  ('md',      'TẠO PO',    'Tạo PO-M2606 Đầm Maxi Voan Hoa (1.500 SP)',     now() - interval '2 days');
