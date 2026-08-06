'use server'

import { createClient } from '@/utils/supabase/server'
import { ngayVN, khungNgayVN } from '@/lib/time'

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
  // Ba danh sách drill-down. Kiểu viết ra tường minh thay vì `any[]`: đây là
  // HỢP ĐỒNG với màn hình giám đốc, nên đọc kiểu phải biết được màn hình hiện
  // cột nào mà không cần mở phần tính toán ở dưới.
  activeNeedleAlerts: { line_name: string; operator: string; machine: string; date: string }[]
  qaAlertLines: { line_name: string; inspected: number; defects: number; rate: string }[]
  /** TẤT CẢ chuyền có biên bản kiểm — cho biểu đồ. Xem chú thích ở nơi tính. */
  qaAllLines: { line_name: string; inspected: number; defects: number; rate: string }[]
  wipBottleneckPOs: { po_number: string; cut: number; sewn: number; wip: number }[]
}

/**
 * Xử lý hàm lấy ngày giờ theo Time Filter
 */
function getDateRange(range: TimeRange) {
  // 🔴 SỬA 07/08/2026 — MỐC PHẢI THEO GIỜ NHÀ MÁY, ⛔ KHÔNG THEO GIỜ MÁY CHỦ.
  //
  // Bản trước dùng `now.setHours(0, 0, 0, 0)` — đó là **nửa đêm theo múi giờ
  // của tiến trình Node**. Trên Vercel tiến trình chạy **UTC**, nên *"hôm nay"*
  // của giám đốc bắt đầu lúc **07:00 sáng giờ Việt Nam**: toàn bộ ca sáng sớm
  // rơi ra ngoài, còn ca đêm hôm trước thì lọt vào.
  //
  // ⚠️ `setHours` còn **sửa luôn `now` tại chỗ** *(nó là hàm đột biến)*, nên
  // nhánh `week` bên dưới đọc phải một `now` đã bị dịch — một lỗi thứ hai nằm
  // chồng lên lỗi thứ nhất.
  //
  // 🔑 Nay mọi mốc đi qua `khungNgayVN()` ở `lib/time.ts` — nguồn sự thật duy
  // nhất cho giờ Việt Nam.
  if (range === 'all') return new Date(0).toISOString()

  const homNay = ngayVN()

  if (range === 'today') return khungNgayVN(homNay).dau

  if (range === 'month') return khungNgayVN(`${homNay.slice(0, 7)}-01`).dau

  // `week` — lùi về thứ Hai của tuần hiện tại, tính theo NGÀY VIỆT NAM.
  // Dựng mốc ở 12:00Z để phép cộng trừ ngày ⛔ không bao giờ nhảy sang ngày
  // khác vì lệch múi giờ.
  const giua = new Date(`${homNay}T12:00:00Z`)
  const thu = giua.getUTCDay()                       // 0 = Chủ nhật
  const luiVe = thu === 0 ? 6 : thu - 1
  giua.setUTCDate(giua.getUTCDate() - luiVe)
  return khungNgayVN(giua.toISOString().slice(0, 10)).dau
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

  // 🔴 SỬA 07/08/2026 — TÁCH "TẤT CẢ CHUYỀN" KHỎI "CHUYỀN VƯỢT NGƯỠNG".
  //
  // Trước đó chỉ có `qaAlertLines` (đã lọc `> 3%`), và biểu đồ *"chuyền nào
  // vượt ngưỡng"* ăn thẳng danh sách đó ⇒ **mọi cột luôn đỏ**, đường ngưỡng
  // 3% ⛔ không bao giờ cắt qua cột nào, và ⛔ không ai biết đường đó có vẽ
  // đúng chỗ hay không.
  //
  // 🔑 Một biểu đồ mà **kết luận đã nằm sẵn trong dữ liệu đầu vào** ⛔ không
  // chứng minh được gì. Đường ngưỡng chỉ có nghĩa khi có cột nằm **dưới** nó.
  const qaAllLines = Object.values(qaByLine)
    .map(line => ({
      ...line,
      rate: line.inspected > 0 ? ((line.defects / line.inspected) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))

  // Bảng cảnh báo bên dưới VẪN chỉ liệt kê chuyền vượt ngưỡng — đó là **danh
  // sách việc phải xử lý**, khác mục đích với biểu đồ **toàn cảnh**.
  const qaAlertLines = qaAllLines.filter(line => parseFloat(line.rate) > 3.0)

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
    qaAllLines,
    wipBottleneckPOs
  }
}