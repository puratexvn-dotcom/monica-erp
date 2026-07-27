import { getFinishingAndPackingData, createFinishingLog, createCarton } from './actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FinishingDepartmentPage({ searchParams }: { searchParams: { tab?: string } }) {
  const activeTab = searchParams.tab || 'finishing'
  const { bundles, cartons, packedQtyByPO } = await getFinishingAndPackingData()

  const eligibleBundles = bundles.filter(b => b.current_stage === 'FINISHING')

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tổ Hoàn Thành & Đóng Thùng</h1>
          <p className="text-sm text-slate-500">Quản lý Cắt chỉ, Ủi, Final QC và niêm phong Thùng Carton.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <Link href="?tab=finishing" className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'finishing' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>1. Kiểm Soát Bán Thành Phẩm</Link>
          <Link href="?tab=packing" className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'packing' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>2. Đóng Thùng (Packing)</Link>
        </div>
      </div>

      {activeTab === 'finishing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* BẢNG TIẾN ĐỘ */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h2 className="text-base font-semibold text-slate-800">Tiến Độ Bán Thành Phẩm (WIP)</h2></div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="px-4 py-3">Mã Bundle / PO</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">QC Đạt / Tổng</th></tr></thead>
              <tbody>
                {bundles.map(b => (
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
          {/* FORM NHẬP QC */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4 border-b pb-2">Cập Nhật QC & Kích Hoạt</h2>
            <form action={createFinishingLog} className="space-y-4">
              <select name="bundle_id" required className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-mono">
                <option value="">-- Chọn Bundle Đang Xử Lý --</option>
                {bundles.filter(b => b.current_stage === 'SEWING' || b.current_stage === 'CUT').map(b => (
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
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6 h-fit bg-blue-50/30">
            <h2 className="font-semibold text-blue-900 mb-4 border-b border-blue-100 pb-2">In Mã Vạch & Đóng Thùng</h2>
            <form action={createCarton} className="space-y-4">
              <select name="bundle_id" required className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white font-mono">
                <option value="">-- Chọn Bundle đã qua Final QC --</option>
                {eligibleBundles.map(b => {
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
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50"><h2 className="font-semibold text-slate-800">Danh Sách Thùng Tại Xưởng (Chờ Nhập Kho FG)</h2></div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="px-4 py-3">Mã Vạch Thùng</th><th className="px-4 py-3">PO</th><th className="px-4 py-3 text-center">SL</th><th className="px-4 py-3">Trạng thái</th></tr></thead>
              <tbody>
                {cartons.map(c => (
                  <tr key={c.id} className="border-t border-slate-100"><td className="px-4 py-3 font-mono font-bold">{c.carton_code}</td><td className="px-4 py-3">{c.orders?.po_number}</td><td className="px-4 py-3 text-center font-bold">{c.quantity_per_carton}</td><td className="px-4 py-3"><span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">PACKED</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}