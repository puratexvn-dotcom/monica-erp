import {
  getSubconDashboardData,
  createSubconOrder,
  issueBundleToSubcon,
  receiveBundleFromSubcon,
} from './actions'

export const dynamic = 'force-dynamic'

export default async function SubconManagementPage() {
  const { vendors, subconOrders, availableBundles, processingBundles } =
    await getSubconDashboardData()

  // Helper an toàn bóc tách PO Number từ quan hệ lồng nhau Supabase (cut_tickets -> orders)
  const getPoNumber = (cutTicketsRelation: any) => {
    if (!cutTicketsRelation) return 'N/A'
    const ticket = Array.isArray(cutTicketsRelation) ? cutTicketsRelation[0] : cutTicketsRelation
    if (!ticket || !ticket.orders) return 'N/A'
    const order = Array.isArray(ticket.orders) ? ticket.orders[0] : ticket.orders
    return order?.po_number || 'N/A'
  }

  // Helper lấy thông tin Vendor
  const getVendorInfo = (relation: any) => {
    if (!relation) return { name: 'N/A', code: 'N/A' }
    const v = Array.isArray(relation) ? relation[0] : relation
    return {
      name: v?.vendor_name || 'N/A',
      code: v?.vendor_code || 'N/A',
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER TỔNG QUAN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản Lý Gia Công Ngoài (Subcontracting Control)
          </h1>
          <p className="text-sm text-slate-500">
            Kiểm soát luồng hàng In/Thêu/Giặt/CMT gửi xưởng ngoài, chặn hao hụt và chụp bằng chứng hàng lỗi đền bù.
          </p>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Đơn Gia Công Đang Chạy</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">
            {subconOrders.filter((o) => o.status !== 'CLOSED').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Tổng cộng {subconOrders.length} đơn hệ thống</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Bó Hàng Tại Xưởng Ngoài</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">
            {processingBundles.length} <span className="text-sm font-normal text-slate-500">Bó</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Đang chờ kiểm hàng thu hồi</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Bó Hàng Sẵn Sàng Xuất Đi</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">
            {availableBundles.length} <span className="text-sm font-normal text-slate-500">Bó</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Đã qua khâu Cắt / May</p>
        </div>
      </div>

      {/* FORM KHU VỰC TẠO ĐƠN & THAO TÁC XUẤT/NHẬP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM 1: KHỞI TẠO ĐƠN GIA CÔNG */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            1. Tạo Đơn Gia Công Mới
          </h2>
          <form
            action={async (formData) => {
              await createSubconOrder(formData)
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nhà Thầu Gia Công</label>
              <select
                name="vendor_id"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn Nhà Thầu --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name} ({v.service_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mã Đơn Hàng (PO ID)</label>
              <input
                type="text"
                name="order_id"
                required
                placeholder="Dán UUID Đơn hàng PO..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Loại Công Đoạn</label>
              <select
                name="process_type"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="IN_THEU">In / Thêu vi tính</option>
                <option value="GIAT">Giặt công nghiệp (Washing)</option>
                <option value="MAY_GIA_CONG">May gia công ngoài (CMT)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Đơn Giá / SP (VNĐ)</label>
                <input
                  type="number"
                  name="unit_price"
                  defaultValue="0"
                  min="0"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày Hẹn Trả</label>
                <input
                  type="date"
                  name="expected_return_date"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-lg transition-colors shadow-sm"
            >
              + Phát Hành Đơn SCO
            </button>
          </form>
        </div>

        {/* FORM 2: XUẤT BÓ HÀNG ĐI GIA CÔNG */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            2. Xuất Bó Hàng Đi Xưởng
          </h2>
          <form
            action={async (formData) => {
              await issueBundleToSubcon(formData)
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Đơn Gia Công (SCO)</label>
              <select
                name="subcon_order_id"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Chọn Đơn Gia Công --</option>
                {subconOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.subcon_order_no} - {getVendorInfo(o.subcontractors).name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Chọn Bó Hàng (Bundle)</label>
              <select
                name="bundle_id"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Chọn Bó Hàng Sẵn Sàng --</option>
                {availableBundles.map((b) => (
                  <option key={b.id} value={b.id}>
                    Mã Bó: {b.bundle_code} ({b.quantity} pcs) - PO: {getPoNumber(b.cut_tickets)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Số Lượng Xuất (Pcs)</label>
              <input
                type="number"
                name="quantity_sent"
                required
                min="1"
                placeholder="Nhập số lượng xuất..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi Chú Giao Hàng</label>
              <input
                type="text"
                name="notes"
                placeholder="Số xe, tên tài xế giao..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm py-2.5 rounded-lg transition-colors shadow-sm"
            >
              📤 Quét Xuất Đi Gia Công
            </button>
          </form>
        </div>

        {/* FORM 3: THU HỒI BÓ HÀNG & QC HÌNH ẢNH LỖI */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-rose-900 uppercase tracking-wide border-b border-rose-100 pb-2">
            3. Thu Hồi Kho & QC Bằng Chứng
          </h2>
          <form
            action={async (formData) => {
              await receiveBundleFromSubcon(formData)
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Đơn Gia Công (SCO)</label>
              <select
                name="subcon_order_id"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Chọn Đơn Gia Công --</option>
                {subconOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.subcon_order_no} - {getVendorInfo(o.subcontractors).name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bó Hàng Thu Hồi</label>
              <select
                name="bundle_id"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Chọn Bó Hàng Cần Thu Hồi --</option>
                {processingBundles.map((b) => (
                  <option key={b.id} value={b.id}>
                    Mã Bó: {b.bundle_code} ({b.quantity} pcs) - PO: {getPoNumber(b.cut_tickets)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-emerald-700 mb-1">SL Đạt (Pcs)</label>
                <input
                  type="number"
                  name="quantity_good"
                  defaultValue="0"
                  min="0"
                  className="w-full text-sm border border-emerald-300 rounded-lg p-2.5 bg-emerald-50/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-rose-700 mb-1">SL Lỗi/Hỏng (Pcs)</label>
                <input
                  type="number"
                  name="quantity_defect"
                  defaultValue="0"
                  min="0"
                  className="w-full text-sm border border-rose-300 rounded-lg p-2.5 bg-rose-50/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                URL Ảnh Bằng Chứng (Bắt buộc nếu có Lỗi)
              </label>
              <input
                type="text"
                name="defect_evidence_urls"
                placeholder="https://.../evidence1.jpg, https://..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Phân tách nhiều URL ảnh bằng dấu phẩy</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Lý Do Hàng Lỗi</label>
              <input
                type="text"
                name="defect_reason"
                placeholder="Bóng In bong tróc, Thêu đứt chỉ..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="is_chargeable"
                name="is_chargeable"
                defaultChecked
                className="h-4 w-4 text-rose-600 rounded border-slate-300"
              />
              <label htmlFor="is_chargeable" className="text-xs font-semibold text-rose-800">
                Gán cờ Đền bù Vendor (Chargeable)
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2.5 rounded-lg transition-colors shadow-sm"
            >
              📥 Nhập Thu Hồi & Khấu Trừ
            </button>
          </form>
        </div>
      </div>

      {/* DANH SÁCH ĐƠN GIA CÔNG DƯỚI DẠNG BẢNG GIÁM SÁT */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">📋 Danh Sách Đơn Gia Công Đang Theo Dõi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Mã Đơn SCO</th>
                <th className="px-5 py-3">Nhà Thầu / Xưởng</th>
                <th className="px-5 py-3">Công Đoạn</th>
                <th className="px-5 py-3 text-right">SL Xuất</th>
                <th className="px-5 py-3 text-right">SL Đạt</th>
                <th className="px-5 py-3 text-right">SL Lỗi</th>
                <th className="px-5 py-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subconOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                    Chưa có đơn gia công nào được khởi tạo.
                  </td>
                </tr>
              ) : (
                subconOrders.map((o) => {
                  const vendor = getVendorInfo(o.subcontractors)
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">{o.subcon_order_no}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {vendor.name} <span className="text-xs text-slate-400">({vendor.code})</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                          {o.process_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-slate-700">
                        {(o.total_sent_qty || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-600">
                        {(o.total_received_qty || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-rose-600">
                        {(o.total_defect_qty || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            o.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'IN_PROGRESS' || o.status === 'PARTIAL_RECEIVED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}