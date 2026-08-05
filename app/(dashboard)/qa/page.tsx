import { getQAReports, getOrdersForSelect, createQAReport } from './actions'
import QaShell from './qa-shell'
import { getQaCommandCenter } from './_services/command-center.service'

// ============================================================================
// QA WORKSPACE — MÀN HÌNH MẪU CỦA KHUNG WORKSPACE
//
// ═══ ⚠️ PHÉP TÍNH ĐÃ RỜI KHỎI MÀN HÌNH ═════════════════════════════════
// Bản trước cộng bằng bốn lệnh `.reduce` ngay trong thân component, và tự viết
// `(loi/kiem)*100` — trong khi `defectRatePercent` **đã có sẵn** ở
// `lib/garment-math.ts` từ lâu. Tức công thức ngành may có **hai bản** trong
// cùng một kho, và bản ở màn hình thì ⛔ không ai kiểm được.
//
// Nay: `kpiQA()` cộng, `viecCuaQA()` chiếu việc. Cả hai là **hàm thuần**, kiểm
// được ⛔ không cần CSDL, ⛔ không cần React. Màn hình chỉ còn **bày ra**.
//
// 🔑 Đây cũng là điều phép kiểm `⑭` đòi: màn hình ⛔ **không tự tính số nghiệp
//    vụ**.
//
// ⚠️ Biểu mẫu ghi phiếu và bảng nhật ký **giữ nguyên**, dựng ở Server
// Component rồi truyền vào khung qua `children` — nhờ vậy `createQAReport`
// vẫn là Server Action gắn thẳng vào `<form action={…}>`.
// ============================================================================

export const dynamic = 'force-dynamic'

export default async function QADashboardPage() {
  // 🔑 `G-18` — MÀN HÌNH ⛔ KHÔNG CÒN TỰ TÍNH GÌ.
  //
  // Trước bản này `page.tsx` gọi `getQAReports()` rồi tự gọi calculator: phép
  // tính đã ra khỏi màn hình, nhưng **phần ĐỌC thì ⛔ chưa** — màn hình vẫn
  // biết bảng nào tồn tại và tự quyết ngưỡng nào tô đỏ.
  //
  // Nay đúng bốn tầng *(`Product Constitution §4.1`)*:
  //   Workspace ← Business Capability ← **Command Center** ← Business Data
  const cc = await getQaCommandCenter()

  // ⚠️ Hai lời gọi dưới đây phục vụ **BẢNG và BIỂU MẪU**, ⛔ không phục vụ KPI
  // hay hộp thư việc. Chúng là dữ liệu **trình bày chi tiết**, ⛔ không phải
  // phán đoán nghiệp vụ — nên chúng ⛔ không đi qua Command Center.
  const reports = await getQAReports()
  const orders = await getOrdersForSelect()

  return (
    <QaShell viec={cc.viec} kpi={cc.kpi} loi={cc.loi}>
      {/* GRID CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LIST QA REPORTS (2 COLS)
            `id="nhat-ky"` — neo của `G-19`: mọi KPI và mọi việc *"vượt ngưỡng"*
            đều dẫn về đây, tức về **bằng chứng gốc** (`P36`). */}
        <div id="nhat-ky" className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-24">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-base font-semibold text-slate-800">Nhật Ký Kiểm Hàng Theo Giờ</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Khung Giờ / Chuyền</th>
                  <th className="px-4 py-3">Mã PO / Style</th>
                  <th className="px-4 py-3 text-center">Kiểm</th>
                  <th className="px-4 py-3 text-center">Đạt</th>
                  <th className="px-4 py-3 text-center">Lỗi</th>
                  <th className="px-4 py-3">Chi Tiết Lỗi & Bằng Chứng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Chưa có báo cáo QA nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{report.time_slot}</div>
                        <div className="text-xs text-slate-500">{report.line_name}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-800">{report.po_number}</div>
                        <div className="text-xs text-slate-500">{report.style_code}</div>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-slate-900">{report.inspected_qty}</td>
                      <td className="px-4 py-4 text-center font-semibold text-emerald-600">{report.passed_qty}</td>
                      <td className="px-4 py-4 text-center font-semibold text-rose-600">{report.defect_qty}</td>
                      <td className="px-4 py-4">
                        {report.qa_defects && report.qa_defects.length > 0 ? (
                          <div className="space-y-1">
                            {report.qa_defects.map((d) => (
                              <div key={d.id} className="flex items-center gap-2 text-xs">
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-medium">
                                  {d.defect_type} ({d.quantity})
                                </span>
                                {d.image_url && (
                                  <a href={d.image_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">
                                    [Xem ảnh]
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">Không phát hiện lỗi</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FORM THÊM QA REPORT (1 COL)
            id="ghi-phieu" — neo của G-19: việc "chưa ghi phiếu nào hôm nay" dẫn
            THẲNG tới đây, tức tới nơi LÀM CHO VIỆC ĐÓ BIẾN MẤT. */}
        <div id="ghi-phieu" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit scroll-mt-24">
          <h2 className="text-base font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">
            Nhập Báo Cáo QA Mới
          </h2>
          <form action={async (formData) => { await createQAReport(formData) }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Chọn Đơn Hàng PO <span className="text-red-500">*</span>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Chuyền May <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="line_name"
                  defaultValue="Chuyền 1"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                  <option value="13:00 - 14:00">13:00 - 14:00</option>
                  <option value="14:00 - 15:00">14:00 - 15:00</option>
                  <option value="15:00 - 16:00">15:00 - 16:00</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Số Lượng Kiểm <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="inspected_qty"
                  defaultValue={50}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Số Lượng Lỗi
                </label>
                <input
                  type="number"
                  name="defect_qty"
                  defaultValue={0}
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Loại Lỗi Chi Tiết (Nếu có)
              </label>
              <select
                name="defect_type"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Không có lỗi --</option>
                <option value="Bỏ mũi">Bỏ mũi (Skipped Stitch)</option>
                <option value="Sụp mí">Sụp mí (Off-seam)</option>
                <option value="Dơ vải">Dơ vải / Dầu máy (Oil Stain)</option>
                <option value="Lệch vai">Lệch vai / Nhăn đường may</option>
                <option value="Khác">Lỗi khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Link Ảnh Chụp Bằng Chứng
              </label>
              <input
                type="url"
                name="image_url"
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Ghi Chú QA
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Ghi chú vị trí lỗi..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
            >
              Gửi Báo Cáo QA
            </button>
          </form>
        </div>
      </div>
    </QaShell>
  )
}