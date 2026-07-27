import { getCutTickets, getOptionsForCutting, createCutTicket } from './actions'

export const dynamic = 'force-dynamic'

export default async function CuttingDashboardPage() {
  const tickets = await getCutTickets()
  const { orders, rolls } = await getOptionsForCutting()

  // Thống kê metrics
  const totalActualPcs = tickets.reduce((sum, t) => sum + t.total_actual_pcs, 0)
  const totalFabricUsed = tickets.reduce((sum, t) => sum + Number(t.total_fabric_used_m), 0)
  const totalRemnants = tickets.reduce((sum, t) => sum + Number(t.remnant_length_m), 0)
  const totalDefects = tickets.reduce((sum, t) => sum + Number(t.defect_length_m), 0)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Quản Lý Bàn Cắt & Phối Kiện (Cutting & Bundle Management)
        </h1>
        <p className="text-sm text-slate-500">
          Theo dõi tiến độ bàn cắt, kiểm soát hao hụt vải đầu tấm và phát hành mã vạch Phối kiện (Bundles).
        </p>
      </div>

      {/* METRICS METERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Tổng Bán Thành Phẩm Cắt</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {totalActualPcs.toLocaleString()} <span className="text-sm font-normal text-slate-500">pcs</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Tổng Vải Đã Trải</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-2">
            {totalFabricUsed.toLocaleString()} <span className="text-sm font-normal text-slate-500">m</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Vải Đầu Tấm Thu Hồi</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {totalRemnants.toLocaleString()} <span className="text-sm font-normal text-slate-500">m</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Vải Lỗi Cắt Bỏ</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-2">
            {totalDefects.toLocaleString()} <span className="text-sm font-normal text-slate-500">m</span>
          </p>
        </div>
      </div>

      {/* GRID CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BẢNG NHẬT KÝ BÀN CẮT & PHỐI KIỆN (2 COLS) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-base font-semibold text-slate-800">Nhật Ký Phiếu Cắt & Thẻ Phối Kiện (Bundles)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Mã Phiếu / Sơ Đồ</th>
                  <th className="px-4 py-3">PO / Mã Hàng</th>
                  <th className="px-4 py-3 text-center">Số Lớp / Sản Lượng</th>
                  <th className="px-4 py-3 text-right">Vải Trải / Đầu Tấm</th>
                  <th className="px-4 py-3">Mã Vạch Bó Hàng (Bundles)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Chưa có phiếu bàn cắt nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{t.ticket_no}</div>
                        <div className="text-xs text-slate-500">{t.marker_code} ({t.marker_length_m}m)</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800">{t.po_number}</div>
                        <div className="text-xs text-slate-500">{t.style_code}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="font-bold text-slate-900">{t.total_actual_pcs} pcs</div>
                        <div className="text-xs text-slate-500">{t.ply_count} lá vải</div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-semibold text-blue-600">{t.total_fabric_used_m}m</div>
                        <div className="text-xs text-emerald-600">Đầu tấm: {t.remnant_length_m}m</div>
                      </td>
                      <td className="px-4 py-4">
                        {t.cut_bundles && t.cut_bundles.length > 0 ? (
                          <div className="space-y-1.5">
                            {t.cut_bundles.map((b) => (
                              <div key={b.id} className="flex items-center gap-2">
                                <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-800 font-bold">
                                  {b.bundle_code}
                                </span>
                                <span className="text-xs text-slate-500">
                                  ({b.size_code} - {b.quantity}sp - {b.shade_lot})
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Chưa tạo bó</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FORM NHẬP BÀN CẮT MỚI (1 COL) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
          <h2 className="text-base font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">
            Lập Phiếu Bàn Cắt
          </h2>
          <form action={createCutTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Đơn Hàng PO <span className="text-red-500">*</span>
              </label>
              <select
                name="order_id"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn đơn hàng --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.po_number} ({o.style_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Chọn Cuộn Vải Trải (Truy nguồn gốc)
              </label>
              <select
                name="roll_id"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn cuộn vải --</option>
                {rolls.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roll_code} ({r.shade_lot} - Còn: {r.current_length_m}m)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Mã Sơ Đồ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="marker_code"
                  defaultValue="MARKER-JK-S-M-L"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Dài Sơ Đồ (m) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="marker_length_m"
                  defaultValue={6.5}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Số Lá Vải Trải <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="ply_count"
                  defaultValue={10}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Sản Lượng Cắt (Pcs) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="total_actual_pcs"
                  defaultValue={50}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Màu Sắc
                </label>
                <input
                  type="text"
                  name="color_code"
                  defaultValue="BLACK"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Size Bán Thành Phẩm
                </label>
                <input
                  type="text"
                  name="size_code"
                  defaultValue="M"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Tổng Vải Đã Trải (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="total_fabric_used_m"
                  defaultValue={85}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Định Mức BOM (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="bom_allowance_m"
                  defaultValue={70}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Vải Đầu Tấm Dư (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="remnant_length_m"
                  defaultValue={15}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Vải Lỗi Cắt Bỏ (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="defect_length_m"
                  defaultValue={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Ghi Chú Bàn Cắt
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Ghi chú về chất lượng vải xả..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
            >
              Lập Phiếu & Sinh Mã Vạch Bundles
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}