// ⚠️ BÍ DANH `napDong`, ⛔ KHÔNG để tên `dynamic`: tệp này đã có
// `export const dynamic = 'force-dynamic'` của Next, và hai thứ trùng tên thì
// hằng số CHE MẤT hàm — lỗi `String has no call signatures`, cái bẫy kinh điển
// của App Router.
import napDong from 'next/dynamic'

import {
  getSewingDashboardData,
  createHourlyProductionLog,
  createNeedleBreakLog,
} from './actions'
import MayShell from './may-shell'
import { getMayCommandCenter } from './_services/command-center.service'
import ActionForm from '@/components/forms/action-form'

// ============================================================================
// SEWING WORKSPACE — Blueprint tầng ⑤
//
// ⚠️ Bản trước cộng bằng ba lệnh reduce ngay trong thân component, và tự viết
// phép chia hiệu suất HAI LẦN — một cho tổng, một cho từng dòng. progressPercent
// đã có sẵn ở garment-math.ts.
//
// 🔑 Product Constitution §4.1: Workspace KHÔNG đọc trực tiếp Business Data.
// ============================================================================

export const dynamic = 'force-dynamic'

// 🔴 BIỂU ĐỒ TRƯỚC — Board 06/08/2026: *"luôn luôn ưu tiên trực quan"*.
// Nạp ĐỘNG: `recharts` ~100 kB, ⛔ không được vào gói tải lần đầu.
const HourlyChart = napDong(() => import('@/components/sewing/hourly-chart'), {
  ssr: false,
  loading: () => (
    <div className="h-56 rounded-xl border border-slate-200 bg-white" aria-hidden="true" />
  ),
})

export default async function SewingDashboardPage() {
  const cc = await getMayCommandCenter()

  // Phục vụ BẢNG và BIỂU MẪU — dữ liệu trình bày chi tiết, KHÔNG phải phán
  // đoán nghiệp vụ, nên chúng KHÔNG đi qua Command Center.
  const { lines, orders, hourlyLogs, needleLogs } = await getSewingDashboardData()

  return (
    <MayShell viec={cc.viec} kpi={cc.kpi} loi={cc.loi}>
      {/* GRID CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BẢNG NHẬT KÝ SẢN LƯỢNG HEATED (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          <div id="nhat-ky-may" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-24">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-base font-semibold text-slate-800">Báo Cáo Sản Lượng May Theo Giờ</h2>
              <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full">Realtime</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Khung Giờ / Chuyền</th>
                    <th className="px-4 py-3">PO / Mã Hàng</th>
                    <th className="px-4 py-3 text-center">Công Nhân</th>
                    <th className="px-4 py-3 text-right">Target / Đạt</th>
                    <th className="px-4 py-3 text-center">Tỷ Lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hourlyLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        Chưa có báo cáo sản lượng nào trong ca làm việc.
                      </td>
                    </tr>
                  ) : (
                    hourlyLogs.map((l) => {
                      const logEff = l.target_qty > 0 ? ((l.actual_qty / l.target_qty) * 100).toFixed(0) : '0'
                      const isPassed = Number(logEff) >= 90
                      return (
                        <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{l.time_slot}</div>
                            <div className="text-xs text-slate-500">{l.line_name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{l.po_number}</div>
                            <div className="text-xs text-slate-500">{l.style_code}</div>
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-slate-700">
                            {l.operator_count} người
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-bold text-slate-900">{l.actual_qty} / {l.target_qty} pcs</div>
                            {l.rework_qty > 0 && (
                              <div className="text-xs text-rose-500 font-medium">Sửa: {l.rework_qty} pcs</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 text-xs font-extrabold rounded-full ${
                              isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {logEff}%
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

          {/* NHẬT KÝ KIỂM SOÁT KIM GÃY — neo #kim-gay: việc AN TOÀN SẢN PHẨM
              dẫn thẳng tới đây, KHÔNG dẫn tới bảng sản lượng. */}
          <div id="kim-gay" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-24">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-semibold text-slate-800">Nhật Ký An Toàn Kim Gãy (Needle Safety Protocol)</h2>
            </div>
            <div className="p-4 space-y-3">
              {needleLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Không có sự cố gãy kim nào được ghi nhận.</p>
              ) : (
                needleLogs.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">
                        {n.line_name} - Máy: {n.machine_code} ({n.needle_type})
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Công nhân: <span className="font-medium text-slate-700">{n.operator_name}</span> | Lý do: {n.reason}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded">
                        Đã Tìm Đủ Mảnh
                      </span>
                      <div className="mt-1">
                        <a href={n.evidence_image_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                          Xem ảnh dán kim
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CỘT NHẬP BÁO CÁO (1 COL) */}
        <div className="space-y-6">
          
          {/* 🔴 BIỂU ĐỒ ĐỨNG TRƯỚC FORM. Tổ trưởng cần thấy *"chuyền đang tụt
              ở giờ nào"* trong MỘT CÁI LIẾC — rồi mới nhập giờ kế tiếp. Bảng
              nhật ký vẫn còn ở dưới, nhưng nó ⛔ không còn là thứ đầu tiên. */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 className="text-base font-semibold text-slate-900 mb-3">
              Sản lượng theo giờ hôm nay
            </h2>
            <HourlyChart rows={hourlyLogs} />
          </div>

          {/* FORM 1: NHẬP SẢN LƯỢNG GIỜ — neo #ghi-san-luong */}
          <div id="ghi-san-luong" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 scroll-mt-24">
            <h2 className="text-base font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Ghi Nhận Sản Lượng Giờ
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
                return await createHourlyProductionLog(formData)
              }}
              nutChu="Ghi nhận" className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Chọn Chuyền May <span className="text-red-500">*</span>
                </label>
                <select
                  name="line_id"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Chọn chuyền --</option>
                  {lines.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.line_name} (Mục tiêu: {l.target_pcs_per_hour}sp/h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Chọn Đơn Hàng PO <span className="text-red-500">*</span>
                </label>
                <select
                  name="order_id"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Chọn PO --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.po_number} ({o.style_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Khung Giờ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="time_slot"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="08:00 - 09:00">08:00 - 09:00</option>
                    <option value="09:00 - 10:00">09:00 - 10:00</option>
                    <option value="10:00 - 11:00">10:00 - 11:00</option>
                    <option value="11:00 - 12:00">11:00 - 12:00</option>
                    <option value="13:00 - 14:00">13:00 - 14:00</option>
                    <option value="14:00 - 15:00">14:00 - 15:00</option>
                    <option value="15:00 - 16:00">15:00 - 16:00</option>
                    <option value="16:00 - 17:00">16:00 - 17:00</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Số Công Nhân
                  </label>
                  <input
                    type="number"
                    name="operator_count"
                    defaultValue={25}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Target Giờ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="target_qty"
                    defaultValue={60}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Số May Đạt <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="actual_qty"
                    defaultValue={58}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Số Lượng Phải Sửa (Rework)
                </label>
                <input
                  type="number"
                  name="rework_qty"
                  defaultValue={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
              >
                Cập Nhật Sản Lượng Giờ
              </button>
            </ActionForm>
          </div>

          {/* FORM 2: BÁO CÁO GÃY KIM AN TOÀN */}
          <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-6 bg-rose-50/20">
            <h2 className="text-base font-semibold text-rose-900 mb-4 pb-3 border-b border-rose-100 flex items-center gap-2">
              <span>⚠️</span> Báo Cáo Sự Cố Gãy Kim
            </h2>
            <ActionForm
              action={async (_truoc, formData) => {
                'use server'
                return await createNeedleBreakLog(formData)
              }}
              nutChu="Ghi nhận" className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Chuyền May Xảy Ra Sự Cố <span className="text-red-500">*</span>
                </label>
                <select
                  name="line_id"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  <option value="">-- Chọn chuyền --</option>
                  {lines.map((l) => (
                    <option key={l.id} value={l.id}>{l.line_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Công Nhân <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="operator_name"
                    placeholder="VD: Nguyễn Văn A"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Mã Máy May <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="machine_code"
                    placeholder="VD: MAY-1-05"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Loại Kim
                  </label>
                  <input
                    type="text"
                    name="needle_type"
                    defaultValue="DBx1 Size 11"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Lý Do Gãy
                  </label>
                  <input
                    type="text"
                    name="reason"
                    placeholder="VD: Đâm trúng nút metal"
                    defaultValue="Vải dầy quá quy định"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Link Ảnh Bằng Chứng Dán Mảnh Kim <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="evidence_image_url"
                  placeholder="https://..."
                  defaultValue="https://images.unsplash.com/photo-1584992236310-6edddc08acff"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fragments_found"
                  name="fragments_found"
                  defaultChecked
                  required
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <label htmlFor="fragments_found" className="text-xs font-bold text-rose-900">
                  Xác nhận đã ghép đủ 100% các mảnh kim gãy
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
              >
                Gửi Báo Cáo & Yêu Cầu Đổi Kim
              </button>
            </ActionForm>
          </div>

        </div>
      </div>
    </MayShell>
  )
}