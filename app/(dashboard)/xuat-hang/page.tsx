import { getLogisticsData, scanInCartonToFG, createShipment } from './actions'
import ActionForm from '@/components/forms/action-form'

export const dynamic = 'force-dynamic'

interface FGCartonItem {
  id: string
  carton_code: string
  quantity_per_carton: number
  orders?: { po_number: string } | { po_number: string }[]
}

interface ShipmentItem {
  id: string
  shipment_no: string
  container_no: string
  status: string
  orders?: { po_number: string } | { po_number: string }[]
}

export default async function LogisticsWarehousePage() {
  const { pendingCount, fgCartons, shipments } = await getLogisticsData()

  const typedFGCartons = (fgCartons || []) as FGCartonItem[]
  const typedShipments = (shipments || []) as ShipmentItem[]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kho Thành Phẩm & Xuất Khẩu (Logistics)</h1>
        <p className="text-sm text-slate-500">Quét nhập kho thành phẩm từ xưởng và Lập kế hoạch đóng Container.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TAB 1: NHẬP KHO THÀNH PHẨM VÀ TỒN KHO */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6 bg-blue-50/20">
            <h2 className="font-semibold text-blue-900 mb-2 flex justify-between">
              <span>🔫 Quét Mã Nhập Kho Thành Phẩm (Scan-in)</span>
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded">Có {pendingCount} thùng đang kẹt ở xưởng</span>
            </h2>
            {/* 🔴 SỬA 07/08/2026 — HAI KHUYẾT TẬT CÙNG CHỖ NÀY.
                ① Bản trước bọc Server Action trong closure ⛔ KHÔNG đánh dấu
                   `'use server'` ⇒ React ⛔ không serialize được ⇒ **cả trang
                   500**. Tổ trưởng ⛔ KHÔNG NHẬP ĐƯỢC GÌ suốt thời gian đó, nên
                   `hourly_production_logs`/`finishing_logs` rỗng — báo cáo ngày
                   của MD tưởng *"chưa ai báo cáo"*, sự thật là *"⛔ không ai
                   báo cáo NỔI"*.
                ② Giá trị trả về `{ error }` **rơi vào hư không** ⇒ nhập sai thì
                   màn hình ⛔ KHÔNG HIỆN GÌ, y hệt lúc lưu thành công.
                ⇒ Nay dùng `ActionForm` *(`components/forms/action-form.tsx`)*:
                closure có `'use server'` bên trong, và kết quả được **hiện
                thành lời** ngay đầu biểu mẫu. */}
            <ActionForm
              action={async (_truoc, formData) => {
                'use server'
                return await scanInCartonToFG(formData)
              }}
              nutChu="Nhập Kho (IN_FG)" className="flex gap-2"
            >
              <input type="text" name="carton_code" placeholder="Quét Barcode Thùng (VD: CTN-PO-123...)" required autoFocus className="flex-1 px-4 py-2 border border-blue-300 rounded-lg font-mono text-sm shadow-inner" />
            </ActionForm>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50"><h2 className="font-semibold text-slate-800">Tồn Kho Sẵn Sàng Xuất (Available Inventory)</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="px-4 py-3">Mã Thùng</th><th className="px-4 py-3">PO</th><th className="px-4 py-3">Số lượng</th><th className="px-4 py-3 text-right">Trạng thái</th></tr></thead>
                <tbody>
                  {typedFGCartons.length === 0 ? <tr><td colSpan={4} className="p-4 text-center text-slate-400">Kho trống. Hãy quét nhập hàng từ xưởng.</td></tr> : 
                    typedFGCartons.map((c: FGCartonItem) => {
                      const poNum = Array.isArray(c.orders) ? c.orders[0]?.po_number : c.orders?.po_number
                      return (
                        <tr key={c.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{c.carton_code}</td>
                          <td className="px-4 py-3 text-slate-600">{poNum || 'N/A'}</td>
                          <td className="px-4 py-3 font-bold">{c.quantity_per_carton}</td>
                          <td className="px-4 py-3 text-right"><span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">IN_FG_WAREHOUSE</span></td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TAB 2: QUẢN LÝ CONTAINER */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
          <h2 className="font-semibold text-slate-900 mb-4 border-b pb-2">Lập Container Xuất Khẩu</h2>
          <ActionForm
              action={async (_truoc, formData) => {
                'use server'
                return await createShipment(formData)
              }}
              nutChu="Tạo Manifest" className="space-y-4 mb-6"
            >
            <div><label className="block text-xs font-bold mb-1">Mã PO</label><input type="text" name="po_number" required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-xs font-bold mb-1">Số Container</label><input type="text" name="container_no" placeholder="VD: TEMU-123" required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-xs font-bold mb-1">Cảng Đích</label><input type="text" name="destination_port" defaultValue="USLAX" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </ActionForm>

          <h3 className="font-semibold text-slate-800 text-sm mb-3">Danh sách Container</h3>
          <div className="space-y-2">
            {typedShipments.map((s: ShipmentItem) => {
              const poNum = Array.isArray(s.orders) ? s.orders[0]?.po_number : s.orders?.po_number
              return (
                <div key={s.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-xs">
                  <div className="font-bold text-slate-900">{s.shipment_no} <span className="text-blue-600 float-right">{s.status}</span></div>
                  <div className="text-slate-500 mt-1">Cont: {s.container_no} | PO: {poNum || 'N/A'}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}