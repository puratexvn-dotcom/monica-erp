import { getFinishingAndPackingData, createFinishingLog, createCarton } from './actions'
import Link from 'next/link'

import HoanThanhShell from './hoan-thanh-shell'
import { getHoanThanhCommandCenter } from './_services/command-center.service'

export const dynamic = 'force-dynamic'

// ============================================================================
// FINISHING WORKSPACE — Blueprint tầng ① *(khung)*
//
// ═══ 🔴 ĐÂY LÀ PHÉP BỌC, ⛔ KHÔNG PHẢI PHÉP VIẾT LẠI ═══════════════════
// Toàn bộ bảng WIP, hai biểu mẫu và danh sách thùng **giữ nguyên từng dòng**.
// Cái thêm vào là **lớp trải nghiệm** đứng TRƯỚC chúng: hộp thư việc → KPI →
// việc làm nhanh, rồi mới tới dữ liệu.
//
// 🔑 Vì sao thứ tự đó là **luật**, ⛔ không phải thẩm mỹ: bản cũ mở ra bằng
// **bốn ô số** *(đã cắt chỉ · đã ủi · QC đạt · QC lỗi)*. Bốn con số đó nói
// **chuyện gì đã xảy ra**, và ⛔ **không** con số nào trả lời *"giờ tôi phải
// làm gì"*. Tổ trưởng đọc xong vẫn phải tự suy ra — mà suy sai thì hàng đứng.
//
// ⚠️ `Promise.all` ⛔ KHÔNG dùng ở đây dù có hai lời gọi: cả hai cùng đi qua
// `getFinishingAndPackingData()`, nên gọi song song là **đọc CSDL hai lần** cho
// cùng một tập dữ liệu. Command Center chạy trước và trang dùng lại kết quả của
// lời gọi thứ hai — chi phí thật là **hai lượt đi–về**, và đó là cái giá của
// việc ⛔ không đổi chữ ký `actions.ts` ở lượt này. Ghi ra đây để người sau
// **biết mà gộp**, ⛔ không phải để giấu.
// ============================================================================

interface BundleItem {
  id: string
  bundle_code: string
  color_code: string
  size_code: string
  quantity: number
  current_stage: string
  po_number: string
  po_total_qty: number
  trimming_qty: number
  ironing_qty: number
  final_qc_passed_qty: number
  final_qc_defect_qty: number
}

interface CartonItem {
  id: string
  carton_code: string
  quantity_per_carton: number
  orders?: { po_number: string } | { po_number: string }[]
}

export default async function FinishingDepartmentPage({ searchParams }: { searchParams: { tab?: string } }) {
  const activeTab = searchParams.tab || 'finishing'

  // ⚠️ Command Center chạy TRƯỚC — nó là thứ trả lời *"hôm nay cần làm gì"*, và
  // nếu nó hỏng thì băng lỗi phải hiện ra **trước** mọi bảng số liệu.
  const { viec, kpi, loi } = await getHoanThanhCommandCenter()

  const { bundles, cartons, packedQtyByPO } = await getFinishingAndPackingData()

  const typedBundles = (bundles || []) as BundleItem[]
  const typedCartons = (cartons || []) as CartonItem[]

  const eligibleBundles = typedBundles.filter((b: BundleItem) => b.current_stage === 'FINISHING')

  return (
    <HoanThanhShell viec={viec} kpi={kpi} loi={loi}>
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tổ Hoàn Thành & Đóng Thùng</h2>
          <p className="text-sm text-slate-500">Quản lý Cắt chỉ, Ủi, Final QC và niêm phong Thùng Carton.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <Link href="?tab=finishing" className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'finishing' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>1. Kiểm Soát Bán Thành Phẩm</Link>
          <Link href="?tab=packing" className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'packing' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>2. Đóng Thùng (Packing)</Link>
        </div>
      </div>

      {/* ⚠️ BỐN Ô SỐ CŨ ĐÃ RỜI CHỖ NÀY — ⛔ KHÔNG BỊ XOÁ, ĐƯỢC NÂNG CẤP.
          *"Đã cắt chỉ · Đã ủi · QC đạt · QC lỗi"* nay là **KPI của Command
          Center** ở ngay trên, và ở đó mỗi con số mang thêm **ba thứ mà bốn ô
          cũ ⛔ không có**: nguồn gốc *(`P36`)*, phán quyết theo ngưỡng, và
          **lối đi tiếp** *(`P33`)*.

          🔑 Giữ cả hai chỗ là bắt người đọc **đọc cùng một con số hai lần** rồi
          tự hỏi cái nào mới đúng — và tới lúc hai chỗ lệch nhau *(chúng sẽ
          lệch, vì một bên qua calculator còn một bên `.reduce` tại chỗ)* thì
          ⛔ không ai biết bên nào sai.

          🔑 Và một con số **hoàn toàn mới** xuất hiện cùng lượt này: **tỷ lệ
          lỗi Final QC**. Bản cũ chỉ hiện *"QC lỗi = N sp"* — một số tuyệt đối
          ⛔ không phán quyết được điều gì khi ⛔ không có mẫu số. */}

      {activeTab === 'finishing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* `scroll-mt-24` — chừa chỗ cho thanh đầu trang dính. Thiếu nó thì
              cú bấm từ KPI đưa người dùng tới đúng khối **bị thanh che mất**. */}
          <div id="wip-hoan-thanh" className="lg:col-span-2 scroll-mt-24 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h2 className="text-base font-semibold text-slate-800">Tiến Độ Bán Thành Phẩm (WIP)</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="px-4 py-3">Mã Bundle / PO</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">QC Đạt / Tổng</th></tr></thead>
                <tbody>
                  {typedBundles.map((b: BundleItem) => (
                    <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3"><div className="font-bold text-slate-900">{b.bundle_code}</div><div className="text-xs text-slate-500">{b.po_number}</div></td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${b.current_stage === 'FINISHING' ? 'bg-emerald-100 text-emerald-800' : b.current_stage === 'PACKED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{b.current_stage}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{b.final_qc_passed_qty} / {b.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div id="ghi-qc" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4 border-b pb-2">Cập Nhật QC & Kích Hoạt</h2>
            <form action={async (formData) => { await createFinishingLog(formData) }} className="space-y-4">
              <select name="bundle_id" required className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-mono">
                <option value="">-- Chọn Bundle Đang Xử Lý --</option>
                {typedBundles.filter((b: BundleItem) => b.current_stage === 'SEWING' || b.current_stage === 'CUT').map((b: BundleItem) => (
                  <option key={b.id} value={b.id}>{b.bundle_code} (SL: {b.quantity})</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-emerald-600 mb-1">QC Đạt (Passed)</label><input type="number" name="final_qc_passed_qty" required className="w-full px-3 py-2 border rounded-lg text-sm bg-emerald-50" /></div>
                <div><label className="block text-xs font-bold text-rose-600 mb-1">QC Lỗi (Defect)</label><input type="number" name="final_qc_defect_qty" defaultValue={0} className="w-full px-3 py-2 border rounded-lg text-sm bg-rose-50" /></div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-medium py-2 rounded-lg text-sm">Ghi Nhận & Chuyển Đóng Thùng</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'packing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div id="dong-thung" className="scroll-mt-24 bg-white rounded-xl border border-blue-200 shadow-sm p-6 h-fit bg-blue-50/30">
            <h2 className="font-semibold text-blue-900 mb-4 border-b border-blue-100 pb-2">In Mã Vạch & Đóng Thùng</h2>
            <form action={async (formData) => { await createCarton(formData) }} className="space-y-4">
              <select name="bundle_id" required className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white font-mono">
                <option value="">-- Chọn Bundle đã qua Final QC --</option>
                {eligibleBundles.map((b: BundleItem) => {
                  const packedSoFar = packedQtyByPO[b.po_number] || 0
                  const isOverpacked = packedSoFar >= b.po_total_qty
                  return (
                    <option key={b.id} value={b.id} className={isOverpacked ? 'text-rose-600' : ''}>
                      {b.bundle_code} {isOverpacked ? '(⚠️ CẢNH BÁO PO ĐÃ ĐÓNG ĐỦ)' : ''}
                    </option>
                  )
                })}
              </select>
              <div><label className="block text-xs font-bold text-slate-600 mb-1">Số lượng / Thùng</label><input type="number" name="quantity_per_carton" defaultValue={24} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm">Sinh Mã Thùng (PACKED)</button>
            </form>
          </div>
          <div id="thung-tai-xuong" className="lg:col-span-2 scroll-mt-24 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50"><h2 className="font-semibold text-slate-800">Danh Sách Thùng Tại Xưởng (Chờ Nhập Kho FG)</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="px-4 py-3">Mã Vạch Thùng</th><th className="px-4 py-3">PO</th><th className="px-4 py-3 text-center">SL</th><th className="px-4 py-3">Trạng thái</th></tr></thead>
                <tbody>
                  {typedCartons.map((c: CartonItem) => {
                    const poNum = Array.isArray(c.orders) ? c.orders[0]?.po_number : c.orders?.po_number
                    return (
                      <tr key={c.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-mono font-bold">{c.carton_code}</td>
                        <td className="px-4 py-3">{poNum || 'N/A'}</td>
                        <td className="px-4 py-3 text-center font-bold">{c.quantity_per_carton}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">PACKED</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
    </HoanThanhShell>
  )
}