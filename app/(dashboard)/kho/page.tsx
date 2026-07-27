import {
  getMaterials,
  getWarehouseTransactions,
  getOrdersForWarehouse,
  createWarehouseTransaction,
} from './actions'

export const dynamic = 'force-dynamic'

export default async function WarehousePage() {
  const materials = await getMaterials()
  const transactions = await getWarehouseTransactions()
  const orders = await getOrdersForWarehouse()

  // Thống kê nhanh
  const totalItems = materials.length
  const lowStockItems = materials.filter((m) => m.stock_qty <= m.min_stock_qty).length

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Quản Lý Kho Nguyên Phụ Liệu (Warehouse Management)
        </h1>
        <p className="text-sm text-slate-500">
          Theo dõi tồn kho realtime, lập phiếu Nhập vải/NPL và Xuất cấp phát cho sản xuất.
        </p>
      </div>

      {/* METRICS METERS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Tổng Danh Mục Vật Tư</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalItems} <span className="text-sm font-normal text-slate-500">mã</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Cảnh Báo Chạm Ngưỡng Tồn</p>
          <p className={`text-2xl font-extrabold mt-2 ${lowStockItems > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {lowStockItems} <span className="text-sm font-normal text-slate-500">mã cần nhập thêm</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Trạng Thái Kho</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-2">Đang Hoạt Động</p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BẢNG TỒN KHO VẬT TƯ (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-semibold text-slate-800">Danh Mục Tồn Kho Realtime</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Mã & Tên Vật Tư</th>
                    <th className="px-4 py-3">Phân Loại</th>
                    <th className="px-4 py-3 text-right">Tồn Hiện Tại</th>
                    <th className="px-4 py-3 text-right">Mức Tối Thiểu</th>
                    <th className="px-4 py-3 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map((m) => {
                    const isLow = m.stock_qty <= m.min_stock_qty
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{m.material_code}</div>
                          <div className="text-xs text-slate-500">{m.name}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-xs text-slate-600 uppercase">{m.category}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {Number(m.stock_qty).toLocaleString()} <span className="text-xs font-normal text-slate-500">{m.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {Number(m.min_stock_qty).toLocaleString()} {m.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                              Sắp Hết
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                              An Toàn
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* NHẬT KÝ GIAO DỊCH GẦN ĐÂY */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-semibold text-slate-800">Lịch Sử Nhập / Xuất Kho Gần Đây</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Vật Tư</th>
                    <th className="px-4 py-3 text-right">Số Lượng</th>
                    <th className="px-4 py-3">Số Phiếu / Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Chưa có giao dịch kho nào.</td></tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          {t.transaction_type === 'IN' ? (
                            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded">NHẬP</span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 rounded">XUẤT</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{t.material_code}</div>
                          <div className="text-xs text-slate-500">{t.material_name}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {t.transaction_type === 'IN' ? '+' : '-'}{Number(t.quantity).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <div>{t.reference_no || 'N/A'}</div>
                          <div className="text-slate-400">{t.notes}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FORM LẬP PHIẾU NHẬP/XUẤT (1 COL) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
          <h2 className="text-base font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">
            Lập Phiếu Nhập / Xuất Kho
          </h2>
          <form action={createWarehouseTransaction} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Loại Giao Dịch <span className="text-red-500">*</span>
              </label>
              <select
                name="transaction_type"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="IN">NHẬP KHO (Nhận hàng từ nhà cung cấp)</option>
                <option value="OUT">XUẤT KHO (Cấp phát cho Cắt / May)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Chọn Vật Tư <span className="text-red-500">*</span>
              </label>
              <select
                name="material_id"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn vật tư --</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.material_code} - {m.name} (Tồn: {m.stock_qty} {m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Số Lượng Nhập / Xuất <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="quantity"
                required
                placeholder="VD: 500"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Gắn Với Mã Đơn Hàng PO (Nếu có)
              </label>
              <select
                name="order_id"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Không chọn PO --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.po_number} ({o.style_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Số Phiếu / Số Hóa Đơn (Reference No)
              </label>
              <input
                type="text"
                name="reference_no"
                placeholder="VD: PNK-2026-001 hoặc PXK-CAT-02"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Ghi Chú Giao Dịch
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="VD: Xuất vải cho Bàn Cắt số 1..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
            >
              Thực Hiện Giao Dịch Kho
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}