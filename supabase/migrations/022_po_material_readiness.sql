-- ============================================================================
-- MONICA MOS — 022 · VIEW SẴN SÀNG NGUYÊN PHỤ LIỆU THEO PO
--
-- MỤC TIÊU DUY NHẤT: gộp SÁU nguồn thành MỘT lượt đi-về.
--
-- ─── VÌ SAO PHẢI CÓ VIEW NÀY — SỐ ĐO THẬT ────────────────────────────────
-- Đo trên chính cơ sở dữ liệu đang chạy:
--     một truy vấn RỖNG (select id limit 1)  : 200 ms (trung vị của 5 lần)
--     hai chặng, 5 truy vấn song song        : 723 ms
--     một truy vấn lồng 3 bảng               : 254 ms
--
-- Độ trễ ĐƯỜNG TRUYỀN mới là thứ ngốn thời gian, không phải Postgres — ở khối
-- lượng hiện tại thời gian tính toán gần bằng không. Mọi thiết kế cần từ hai
-- lượt đi-về trở lên đều vượt trần trước khi Postgres kịp làm gì.
--
-- ─── VIEW CHỈ GỘP SỐ, KHÔNG GIỮ LUẬT NGHIỆP VỤ ───────────────────────────
-- View trả về CON SỐ THÔ. Luật "thế nào là Sẵn sàng" nằm ở material.service.ts
-- — Điều VII, và để luật đó kiểm thử được mà không cần cơ sở dữ liệu.
--
-- ─── VÌ SAO ĐI QUA style_bom CHỨ KHÔNG PHẢI bom ──────────────────────────
-- Bảng `bom` KHÔNG có material_id, chỉ có item_name là chữ tự do — không nối
-- được với kho bằng khoá nào. Cả 10 dòng của nó lại thuộc một order_id không
-- tồn tại trong bảng orders.
-- Trong ngành may, định mức đi theo MÃ HÀNG; PO kế thừa lại. Đường đúng là
-- orders.style_id → style_bom → materials → kho.
--
-- ⚠️ KHÔNG xoá bảng `bom`. Người dùng đã đồng ý bỏ nó, nhưng DROP TABLE là
-- thao tác không lùi lại được. Migration này chỉ NGỪNG DÙNG nó; việc xoá hẳn
-- nên là một bước riêng, có chủ đích, sau khi chắc chắn không còn màn hình nào
-- đọc tới.
--
-- CHỈ THÊM MỚI. Không sửa bảng, không sửa policy đang chạy.
-- ============================================================================

-- ─── Chỉ mục cho các phép gộp bên dưới ─────────────────────────────────────
-- Ở quy mô 10.000 PO/năm, stock_reservations và material_inspections lớn dần
-- vô hạn. Không có chỉ mục thì mỗi lần mở tab là một lần quét toàn bảng.
CREATE INDEX IF NOT EXISTS idx_style_bom_style      ON public.style_bom (style_id);
CREATE INDEX IF NOT EXISTS idx_style_bom_material   ON public.style_bom (material_id);
CREATE INDEX IF NOT EXISTS idx_inspections_result   ON public.material_inspections (material_id, result);
CREATE INDEX IF NOT EXISTS idx_fabric_rolls_mat_qa  ON public.fabric_rolls (material_id, qa_status);

-- ─── VIEW ──────────────────────────────────────────────────────────────────
-- Một dòng cho mỗi (đơn hàng × dòng định mức).
--
-- Dùng LEFT JOIN LATERAL thay cho truy vấn con vô hướng lặp lại: mỗi bảng kho
-- chỉ bị quét MỘT lần cho mỗi vật tư, thay vì một lần cho mỗi cột cần lấy.
--
-- KHÔNG đặt SECURITY DEFINER: view chạy dưới quyền người gọi nên RLS của
-- fabric_rolls, stock_levels và stock_reservations vẫn có hiệu lực — buyer gọi
-- thẳng PostgREST cũng không đọc lọt đơn của khách khác.
CREATE OR REPLACE VIEW public.v_po_material_readiness AS
SELECT
  o.id                       AS order_id,
  o.total_quantity           AS order_qty,
  sb.id                      AS bom_id,
  sb.material_id,
  sb.item_name,
  sb.consumption_per_pcs,
  sb.wastage_percent,
  sb.unit,
  m.material_code,
  m.name                     AS material_name,

  -- Nhu cầu = định mức × (1 + hao hụt) × sản lượng đơn.
  -- Thiếu định mức hoặc thiếu sản lượng thì trả NULL, KHÔNG trả 0: 0 nghĩa là
  -- "không cần mét vải nào", khác hẳn "chưa biết cần bao nhiêu".
  CASE
    WHEN sb.consumption_per_pcs IS NULL OR o.total_quantity IS NULL THEN NULL
    ELSE ROUND(
      sb.consumption_per_pcs
      * (1 + COALESCE(sb.wastage_percent, 0) / 100.0)
      * o.total_quantity, 3)
  END                        AS required_qty,

  st.on_hand_qty,
  st.available_qty,
  st.reserved_qty            AS reserved_all,
  st.blocked_qty,
  st.in_inspection_qty,
  st.bins,

  res.reserved_for_po,
  res.reservation_lines,

  rl.rolls_total,
  rl.rolls_passed,
  rl.rolls_failed,
  rl.rolls_pending,
  rl.length_passed,

  ins.inspections_total,
  ins.inspections_passed,
  ins.inspections_failed

FROM public.orders o
JOIN public.style_bom sb ON sb.style_id = o.style_id
LEFT JOIN public.materials m ON m.id = sb.material_id

-- Tồn kho: cộng mọi ô kệ của cùng một vật tư
LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(s.on_hand_qty), 0)       AS on_hand_qty,
    COALESCE(SUM(s.available_qty), 0)     AS available_qty,
    COALESCE(SUM(s.reserved_qty), 0)      AS reserved_qty,
    COALESCE(SUM(s.blocked_qty), 0)       AS blocked_qty,
    COALESCE(SUM(s.in_inspection_qty), 0) AS in_inspection_qty,
    COUNT(*)                              AS bins
  FROM public.stock_levels s
  WHERE s.material_id = sb.material_id
) st ON TRUE

-- Giữ chỗ RIÊNG cho đơn này — khác hẳn tổng giữ chỗ của mọi đơn ở st.reserved_qty
LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(r.reserved_qty), 0) AS reserved_for_po,
    COUNT(*)                         AS reservation_lines
  FROM public.stock_reservations r
  WHERE r.material_id = sb.material_id
    AND r.order_id = o.id
    AND r.status IN ('ACTIVE', 'ALLOCATED')
) res ON TRUE

-- Cuộn vải theo trạng thái kiểm
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)                                                          AS rolls_total,
    COUNT(*) FILTER (WHERE f.qa_status IN ('PASSED', 'CONDITIONAL'))   AS rolls_passed,
    COUNT(*) FILTER (WHERE f.qa_status = 'FAILED')                     AS rolls_failed,
    COUNT(*) FILTER (WHERE f.qa_status = 'PENDING')                    AS rolls_pending,
    COALESCE(SUM(f.current_length_m) FILTER
      (WHERE f.qa_status IN ('PASSED', 'CONDITIONAL')), 0)             AS length_passed
  FROM public.fabric_rolls f
  WHERE f.material_id = sb.material_id
) rl ON TRUE

-- Phiếu kiểm chất lượng
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)                                       AS inspections_total,
    COUNT(*) FILTER (WHERE i.result = 'PASSED')    AS inspections_passed,
    COUNT(*) FILTER (WHERE i.result = 'FAILED')    AS inspections_failed
  FROM public.material_inspections i
  WHERE i.material_id = sb.material_id
) ins ON TRUE;

GRANT SELECT ON public.v_po_material_readiness TO authenticated;

-- ─── VIEW PHỤ: TRUY VẾT CUỘN ───────────────────────────────────────────────
-- Bấm vào một mã vải đang thiếu thì hiện ngay các cuộn của nó: đang giữ cho ai,
-- có bị khoá không. Tách riêng vì đây là dữ liệu MỞ THEO YÊU CẦU — nhét vào
-- view chính sẽ nhân số dòng lên theo số cuộn và kéo chậm cả bảng định mức.
CREATE OR REPLACE VIEW public.v_material_roll_trace AS
SELECT
  f.id            AS roll_id,
  f.roll_code,
  f.material_id,
  f.lot_id,
  ml.lot_no,
  COALESCE(NULLIF(TRIM(ml.shade_code), ''), NULLIF(TRIM(f.shade_lot), '')) AS shade_code,
  f.current_length_m,
  f.width_m,
  f.qa_status,
  f.four_point_score,
  f.bin_id,
  r.id            AS reservation_id,
  r.order_id      AS reserved_for_order,
  r.cut_ticket_id,
  r.status        AS reservation_status
FROM public.fabric_rolls f
LEFT JOIN public.material_lots ml ON ml.id = f.lot_id
LEFT JOIN public.stock_reservations r
       ON r.roll_id = f.id AND r.status IN ('ACTIVE', 'ALLOCATED');

GRANT SELECT ON public.v_material_roll_trace TO authenticated;

-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY
-- ============================================================================
SELECT 'View sẵn sàng NPL' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.views
         WHERE table_schema = 'public' AND table_name = 'v_po_material_readiness') AS ket_qua,
       '1' AS ky_vong
UNION ALL
SELECT 'View truy vết cuộn',
       (SELECT COUNT(*)::TEXT FROM information_schema.views
         WHERE table_schema = 'public' AND table_name = 'v_material_roll_trace'), '1'
UNION ALL
SELECT 'Bốn chỉ mục mới',
       (SELECT COUNT(*)::TEXT FROM pg_indexes WHERE schemaname = 'public'
         AND indexname IN ('idx_style_bom_style', 'idx_style_bom_material',
                           'idx_inspections_result', 'idx_fabric_rolls_mat_qa')), '4'
UNION ALL
SELECT 'View chạy dưới quyền NGƯỜI GỌI (RLS còn hiệu lực)',
       (SELECT COUNT(*)::TEXT FROM pg_views
         WHERE schemaname = 'public'
           AND viewname IN ('v_po_material_readiness', 'v_material_roll_trace')), '2'
UNION ALL
SELECT 'Bảng bom cũ VẪN CÒN (cố ý không xoá)',
       (SELECT COUNT(*)::TEXT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'bom'), '1';
