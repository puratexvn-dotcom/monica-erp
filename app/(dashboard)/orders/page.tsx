import { getOrders, createOrder } from './actions'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const orders = await getOrders()

  // Tính toán nhanh số liệu thống kê
  const totalOrders = orders.length
  const totalQuantity = orders.reduce((sum, o) => sum + o.total_quantity, 0)
  const inProduction = orders.filter((o) => o.status === 'IN_PRODUCTION').length

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản Lý Đơn Hàng (PO Master)
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi tiến độ đơn hàng gia công, mã hàng và kế hoạch xuất khẩu.
          </p>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tổng Số Đơn Hàng (PO)
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalOrders}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tổng Sản Lượng Đặt Hàng
          </p>
          <p className="text-2xl font-extrabold text-blue-600 mt-2">
            {totalQuantity.toLocaleString()} <span className="text-sm font-normal text-slate-500">sp</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Đang Sản Xuất Trên Chuyền
          </p>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">{inProduction} <span className="text-sm font-normal text-slate-500">PO</span></p>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TABLE SECTION (2 COLS) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-base font-semibold text-slate-800">Danh Sách PO Hiện Có</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Mã PO</th>
                  <th className="px-6 py-3">Mã Hàng (Style)</th>
                  <th className="px-6 py-3">Khách Hàng</th>
                  <th className="px-6 py-3 text-right">Số Lượng</th>
                  <th className="px-6 py-3">Ngày Giao</th>
                  <th className="px-6 py-3">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Chưa có đơn hàng nào trong hệ thống.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{order.po_number}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{order.style_code}</td>
                      <td className="px-6 py-4">{order.customer_name}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        {order.total_quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{order.delivery_date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'IN_PRODUCTION'
                              ? 'bg-amber-100 text-amber-800'
                              : order.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {order.status === 'IN_PRODUCTION'
                            ? 'Đang sản xuất'
                            : order.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE FORM SECTION (1 COL) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
          <h2 className="text-base font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">
            Tạo Đơn Hàng Mới (PO)
          </h2>
          <form action={async (formData) => { await createOrder(formData) }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Mã PO <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="po_number"
                required
                placeholder="VD: PO-2026-M01"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Mã Hàng / Style <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="style_code"
                required
                placeholder="VD: JACKET-W26"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Tên Khách Hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customer_name"
                required
                placeholder="VD: Nike / Adidas"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Số Lượng Đặt (Cái) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="total_quantity"
                required
                min="1"
                placeholder="VD: 5000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Ngày Giao Hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="delivery_date"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
            >
              Lưu & Khởi Tạo PO
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}