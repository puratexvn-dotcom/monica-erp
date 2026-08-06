import { getExecutiveDashboardData, TimeRange } from './actions'
import Link from 'next/link'

// 🔴 CÙNG MỘT BÁO CÁO NGÀY VỚI MD — Board 06/08/2026: *"tự tổng hợp thành một
// báo cáo trực quan **gửi cho CEO và Production Director**"*.
//
// 🔑 Gọi ĐÚNG hàm `tongHopNgay` mà MD gọi. Hai màn hình vì vậy ⛔ **không thể**
// ra hai con số khác nhau — điều sẽ xảy ra ngay lần đầu nếu mỗi bên tự tính.
//
// ⚠️ Đây là *"gửi"* theo lối KÉO: giám đốc mở trang là thấy. Đẩy thật (chuông
// kêu) cần bảng `notifications` — Database Schema, thẩm quyền Board.
import { napNguonDigest } from '../md/_services/daily-digest.service'
import { tongHopNgay } from '@/lib/mos/md/daily-digest'
import DailyDigestCard from '@/components/md/dashboard/daily-digest-card'

export const dynamic = 'force-dynamic'

export default async function ExecutiveDashboardPage({
  searchParams,
}: {
  searchParams: { range?: string }
}) {
  const currentRange = (searchParams.range as TimeRange) || 'month'
  const [metrics, nguon] = await Promise.all([
    getExecutiveDashboardData(currentRange),
    napNguonDigest(),
  ])
  const baoCaoNgay = tongHopNgay(nguon)

  // Helpers cho styling Time Filter
  const getTabClass = (range: string) =>
    currentRange === range
      ? 'bg-blue-600 text-white shadow-sm'
      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER & GLOBAL TIME FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Giám Đốc (Executive Command Center)
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi dòng tiền, nút thắt cổ chai sản xuất và kiểm soát rủi ro toàn nhà máy.
          </p>
        </div>
        
        {/* BỘ LỌC THỜI GIAN TOÀN CỤC */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
          <Link href="?range=today" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${getTabClass('today')}`}>
            Hôm nay
          </Link>
          <Link href="?range=week" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${getTabClass('week')}`}>
            Tuần này
          </Link>
          <Link href="?range=month" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${getTabClass('month')}`}>
            Tháng này
          </Link>
          <Link href="?range=all" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${getTabClass('all')}`}>
            Toàn thời gian
          </Link>
        </div>
      </div>

      {/* 🔴 BÁO CÁO NGÀY CỦA MD — cùng một hàm tổng hợp, cùng một con số.
          Đặt NGAY DƯỚI tiêu đề: giám đốc mở trang là thấy hôm nay xưởng thế
          nào, trước cả các chỉ số tài chính. */}
      <DailyDigestCard bc={baoCaoNgay} />

      {/* TOP METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: WIP (Điểm nghẽn Dòng tiền) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">📦</div>
          <p className="text-xs font-semibold uppercase text-slate-500">Bán Thành Phẩm WIP</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">
            {metrics.wipPcs.toLocaleString()} <span className="text-base font-normal text-slate-500">pcs</span>
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            (Cắt: {metrics.totalCutPcs.toLocaleString()} - May: {metrics.totalSewnPcs.toLocaleString()})
          </p>
        </div>

        {/* KPI 2: HIỆU SUẤT MAY OEE */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">⚡</div>
          <p className="text-xs font-semibold uppercase text-slate-500">Hiệu Suất Chuyền (OEE)</p>
          <p className={`text-3xl font-extrabold mt-2 ${Number(metrics.sewingOEE) >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {metrics.sewingOEE}%
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">Tổng đạt: {metrics.totalSewnPcs.toLocaleString()} pcs</p>
        </div>

        {/* KPI 3: CHẤT LƯỢNG TOÀN NHÀ MÁY */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">🔍</div>
          <p className="text-xs font-semibold uppercase text-slate-500">Tỷ Lệ Lỗi Hệ Thống</p>
          <p className={`text-3xl font-extrabold mt-2 ${parseFloat(metrics.qaDefectRate) > 3 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {metrics.qaDefectRate}%
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">Lỗi: {metrics.totalQaDefects} / Kiểm: {metrics.totalQaInspected}</p>
        </div>

        {/* KPI 4: HÀNG CHỜ XUẤT */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">🚢</div>
          <p className="text-xs font-semibold uppercase text-slate-500">Hàng Chờ Đóng Thùng</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">
            {metrics.readyToShipPcs.toLocaleString()} <span className="text-base font-normal text-slate-500">pcs</span>
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">Sẵn sàng xuất khẩu / Packing</p>
        </div>
      </div>

      {/* DRILL-DOWN SECTIONS (KHOAN SÂU DỮ LIỆU) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* DRILL-DOWN 1: BOTTLENECK WIP */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">🔥 Top 5 PO Nghẽn WIP Cao Nhất</h2>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Mã PO</th>
                    <th className="px-5 py-3 text-right">Tồn WIP (pcs)</th>
                    <th className="px-5 py-3 w-1/3">Tiến trình (May / Cắt)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.wipBottleneckPOs.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-6 text-center text-slate-400">Dòng chuyền trơn tru, không tồn đọng WIP.</td></tr>
                  ) : (
                    metrics.wipBottleneckPOs.map((po, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-900">{po.po_number}</td>
                        <td className="px-5 py-3 text-right font-bold text-amber-600">{po.wip.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-amber-500 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(100, (po.sewn / (po.cut || 1)) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">{po.sewn} / {po.cut}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DRILL-DOWN 2: CẢNH BÁO CHẤT LƯỢNG & AN TOÀN */}
        <div className="space-y-6">
          
          {/* Cảnh Báo QA > 3% */}
          <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-rose-100 bg-rose-50/30 flex items-center justify-between">
              <h2 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                Cảnh Báo Chuyền Lỗi &gt; 3%
              </h2>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <tbody className="divide-y divide-slate-100">
                    {metrics.qaAlertLines.length === 0 ? (
                      <tr><td className="px-5 py-4 text-center text-sm text-emerald-600 font-medium">Tất cả các chuyền đạt chuẩn chất lượng.</td></tr>
                    ) : (
                      metrics.qaAlertLines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="px-5 py-3 font-semibold text-slate-900">{line.line_name}</td>
                          <td className="px-5 py-3 text-slate-500 text-xs">Lỗi: {line.defects}/{line.inspected}</td>
                          <td className="px-5 py-3 text-right font-bold text-rose-600">{line.rate}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Cảnh Báo An Toàn Kim Gãy Chưa Thu Hồi */}
          {metrics.activeNeedleAlerts.length > 0 && (
            <div className="bg-rose-600 rounded-xl border border-rose-700 shadow-lg overflow-hidden text-white">
              <div className="px-5 py-3 border-b border-rose-500 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  ⚠️ Cảnh Báo An Toàn Kim Gãy
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-rose-100 mb-2">Phát hiện sự cố gãy kim chưa tìm đủ mảnh vỡ, nguy cơ sót kim trong thành phẩm!</p>
                {metrics.activeNeedleAlerts.map((n, idx) => (
                  <div key={idx} className="bg-rose-800/50 p-3 rounded-lg border border-rose-500/50 text-xs">
                    <div className="font-bold mb-1">{n.line_name} - Máy {n.machine}</div>
                    <div className="text-rose-200">Công nhân: {n.operator} | {n.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}