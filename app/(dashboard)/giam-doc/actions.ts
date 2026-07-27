'use server'

import { createClient } from '@/utils/supabase/server'

export type TimeRange = 'today' | 'week' | 'month' | 'all'

export interface DashboardMetrics {
  totalOrders: number
  totalOrderQty: number
  totalCutPcs: number
  totalSewnPcs: number
  wipPcs: number
  readyToShipPcs: number
  sewingOEE: string
  qaDefectRate: string
  totalQaInspected: number
  totalQaDefects: number
  activeNeedleAlerts: any[]
  qaAlertLines: any[]
  wipBottleneckPOs: any[]
}

/**
 * Xử lý hàm lấy ngày giờ theo Time Filter
 */
function getDateRange(range: TimeRange) {
  const now = new Date()
  let startDate = new Date(0) // Mặc định là từ trước tới nay ('all')

  if (range === 'today') {
    startDate = new Date(now.setHours(0, 0, 0, 0))
  } else if (range === 'week') {
    const firstDay = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) // Thứ 2 đầu tuần
    startDate = new Date(now.setDate(firstDay))
    startDate.setHours(0, 0, 0, 0)
  } else if (range === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  return startDate.toISOString()
}

/**
 * Lõi Server Action: Song song hóa Fetch Data (Parallel Fetching) & Tính toán KPI Phức tạp
 */
export async function getExecutiveDashboardData(range: TimeRange = 'month'): Promise<DashboardMetrics> {
  const supabase = await createClient()
  const startDateStr = getDateRange(range)

  // SỬ DỤNG PROMISE.ALL ĐỂ FETCH 5 BẢNG CÙNG LÚC (TỐI ƯU TỐC ĐỘ < 100ms)
  const [
    { data: orders },
    { data: cutTickets },
    { data: hourlyLogs },
    { data: qaReports },
    { data: needleLogs }
  ] = await Promise.all([
    supabase.from('orders').select('id, po_number, total_quantity, status'),
    supabase.from('cut_tickets').select('id, order_id, total_actual_pcs, created_at').gte('created_at', startDateStr),
    supabase.from('hourly_production_logs').select('id, order_id, target_qty, actual_qty, line_id, sewing_lines(line_name), created_at').gte('created_at', startDateStr),
    supabase.from('qa_audit_reports').select('id, line_name, inspected_qty, defect_qty, created_at').gte('created_at', startDateStr),
    supabase.from('needle_break_logs').select('id, line_id, operator_name, machine_code, fragments_found, created_at, sewing_lines(line_name)').gte('created_at', startDateStr)
  ])

  // 1. TỔNG HỢP TIẾN ĐỘ PO (PO FULFILLMENT)
  const totalOrders = orders?.length || 0
  const totalOrderQty = orders?.reduce((sum, o) => sum + o.total_quantity, 0) || 0

  // 2. TÍNH TOÁN WIP (WORK IN PROCESS - NÚT THẮT CỔ CHAI)
  const totalCutPcs = cutTickets?.reduce((sum, t) => sum + t.total_actual_pcs, 0) || 0
  const totalSewnPcs = hourlyLogs?.reduce((sum, l) => sum + l.actual_qty, 0) || 0
  const wipPcs = totalCutPcs - totalSewnPcs // Số lượng bán thành phẩm đã cắt nhưng chưa may xong

  // 3. TÍNH TOÁN HIỆU SUẤT MAY (OEE)
  const totalTargetQty = hourlyLogs?.reduce((sum, l) => sum + l.target_qty, 0) || 0
  const sewingOEE = totalTargetQty > 0 ? ((totalSewnPcs / totalTargetQty) * 100).toFixed(1) : '0.0'

  // 4. TÍNH TOÁN CHẤT LƯỢNG QA (QA HEALTH)
  const totalQaInspected = qaReports?.reduce((sum, r) => sum + r.inspected_qty, 0) || 0
  const totalQaDefects = qaReports?.reduce((sum, r) => sum + r.defect_qty, 0) || 0
  const qaDefectRate = totalQaInspected > 0 ? ((totalQaDefects / totalQaInspected) * 100).toFixed(1) : '0.0'

  // 5. CHỈ SỐ READY TO SHIP (Hàng chuẩn bị đóng thùng)
  const readyToShipPcs = Math.max(0, totalSewnPcs - totalQaDefects)

  // ==========================================
  // XỬ LÝ DỮ LIỆU DRILL-DOWN (KHOAN SÂU)
  // ==========================================

  // Drill-down A: Các PO có lượng WIP tồn đọng cao nhất
  const wipByPO: Record<string, { po_number: string; cut: number; sewn: number; wip: number }> = {}
  orders?.forEach(o => { wipByPO[o.id] = { po_number: o.po_number, cut: 0, sewn: 0, wip: 0 } })
  cutTickets?.forEach(t => { if (wipByPO[t.order_id]) wipByPO[t.order_id].cut += t.total_actual_pcs })
  hourlyLogs?.forEach(l => { if (wipByPO[l.order_id]) wipByPO[l.order_id].sewn += l.actual_qty })
  
  const wipBottleneckPOs = Object.values(wipByPO)
    .map(p => ({ ...p, wip: p.cut - p.sewn }))
    .filter(p => p.wip > 0)
    .sort((a, b) => b.wip - a.wip)
    .slice(0, 5) // Lấy top 5 PO nghẽn nhất

  // Drill-down B: Các Chuyền May có tỷ lệ lỗi QA > 3%
  const qaByLine: Record<string, { line_name: string; inspected: number; defects: number }> = {}
  qaReports?.forEach(r => {
    if (!qaByLine[r.line_name]) qaByLine[r.line_name] = { line_name: r.line_name, inspected: 0, defects: 0 }
    qaByLine[r.line_name].inspected += r.inspected_qty
    qaByLine[r.line_name].defects += r.defect_qty
  })

  const qaAlertLines = Object.values(qaByLine)
    .map(line => ({
      ...line,
      rate: line.inspected > 0 ? ((line.defects / line.inspected) * 100).toFixed(1) : '0.0'
    }))
    .filter(line => parseFloat(line.rate) > 3.0) // Chỉ lấy các chuyền vượt ngưỡng đỏ 3%
    .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))

  // Drill-down C: Danh sách gãy kim chưa tìm thấy mảnh (Rủi ro cực độ)
  const activeNeedleAlerts = needleLogs?.filter(n => !n.fragments_found).map(n => ({
    line_name: (Array.isArray(n.sewing_lines) ? n.sewing_lines[0]?.line_name : (n.sewing_lines as unknown as { line_name: string })?.line_name) || 'N/A',
    operator: n.operator_name,
    machine: n.machine_code,
    date: new Date(n.created_at).toLocaleString('vi-VN')
  })) || []

  return {
    totalOrders,
    totalOrderQty,
    totalCutPcs,
    totalSewnPcs,
    wipPcs,
    readyToShipPcs,
    sewingOEE,
    qaDefectRate,
    totalQaInspected,
    totalQaDefects,
    activeNeedleAlerts,
    qaAlertLines,
    wipBottleneckPOs
  }
}