import {
  getSubconDashboardData,
  createSubconOrder,
  issueBundleToSubcon,
  receiveBundleFromSubcon,
} from './actions'
import { SubmitButton } from './submit-button'

// 🔴 BIỂU ĐỒ TRƯỚC BẢNG — Board 06/08/2026. Nạp ĐỘNG: `recharts` ~100 kB.
// ⚠️ BÍ DANH `napDong`: tệp có `export const dynamic = 'force-dynamic'`, trùng
// tên thì hằng số CHE MẤT hàm — bẫy kinh điển của App Router.
import napDong from 'next/dynamic'

const SubconChart = napDong(() => import('@/components/subcon/subcon-chart'), {
  ssr: false,
  loading: () => <div className="h-64 rounded-xl border border-slate-200 bg-white" aria-hidden="true" />,
})

export const dynamic = 'force-dynamic'

/* ============================================================================
 * TYPES — Mô tả tối thiểu shape dữ liệu trả về từ getSubconDashboardData().
 * Chỉ phục vụ type-safety phía UI. KHÔNG thay đổi query Supabase / DB schema.
 * Quan hệ lồng nhau (subcontractors, cut_tickets) để `unknown` và được narrow
 * an toàn trong helper — thay cho `any` trước đây.
 * ==========================================================================*/
interface VendorRow {
  id: string
  vendor_name: string | null
  vendor_code?: string | null
  service_type: string | null
}

interface SubconOrderRow {
  id: string
  subcon_order_no: string | null
  process_type: string | null
  status: string | null
  total_sent_qty: number | null
  total_received_qty: number | null
  total_defect_qty: number | null
  subcontractors: unknown
}

interface BundleRow {
  id: string
  bundle_code: string | null
  quantity: number | null
  cut_tickets: unknown
}

/* ============================================================================
 * PRESENTATION HELPERS (thuần hiển thị — không đụng business logic)
 * ==========================================================================*/

/** Format số theo locale cố định vi-VN — tránh lệch format giữa các môi trường server */
const fmtNumber = (n: number | null | undefined) => (n ?? 0).toLocaleString('vi-VN')

/** Nhãn hiển thị thân thiện cho công đoạn (fallback về mã gốc nếu có giá trị mới) */
const PROCESS_LABELS: Record<string, string> = {
  IN_THEU: 'In / Thêu',
  GIAT: 'Giặt CN',
  MAY_GIA_CONG: 'May CMT',
}

/** Map style badge trạng thái — thêm status mới chỉ cần thêm 1 dòng */
const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200',
  PARTIAL_RECEIVED: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200',
  CLOSED: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
}
const DEFAULT_BADGE = 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'

export default async function SubconManagementPage() {
  // Destructure với default an toàn: nếu 1 mảng bị undefined/null do dữ liệu
  // trả về thiếu field, trang vẫn render thay vì crash (.map of undefined).
  // Lỗi throw thật sự từ Supabase sẽ được app/subcon/error.tsx bắt lại.
  const {
    vendors = [] as VendorRow[],
    subconOrders = [] as SubconOrderRow[],
    availableBundles = [] as BundleRow[],
    processingBundles = [] as BundleRow[],
    loiBoHang = null as string | null,
    loiThuHoi = null as string | null,
  } = (await getSubconDashboardData()) ?? {}

  // Helper an toàn bóc tách PO Number từ quan hệ lồng nhau Supabase (cut_tickets -> orders)
  // GIỮ NGUYÊN logic gốc — chỉ thay `any` bằng `unknown` + narrowing
  const getPoNumber = (cutTicketsRelation: unknown): string => {
    if (!cutTicketsRelation) return 'N/A'
    const ticket = (
      Array.isArray(cutTicketsRelation) ? cutTicketsRelation[0] : cutTicketsRelation
    ) as { orders?: unknown } | undefined
    if (!ticket || !ticket.orders) return 'N/A'
    const order = (Array.isArray(ticket.orders) ? ticket.orders[0] : ticket.orders) as
      | { po_number?: string | null }
      | undefined
    return order?.po_number || 'N/A'
  }

  // Helper lấy thông tin Vendor — GIỮ NGUYÊN logic gốc, đã bỏ `any`
  const getVendorInfo = (relation: unknown): { name: string; code: string } => {
    if (!relation) return { name: 'N/A', code: 'N/A' }
    const v = (Array.isArray(relation) ? relation[0] : relation) as
      | { vendor_name?: string | null; vendor_code?: string | null }
      | undefined
    return {
      name: v?.vendor_name || 'N/A',
      code: v?.vendor_code || 'N/A',
    }
  }

  const runningOrders = subconOrders.filter((o) => o.status !== 'CLOSED').length

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER TỔNG QUAN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-600 text-white shadow-md shadow-blue-600/20">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Quản Lý Gia Công Ngoài (Subcontracting Control)
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Kiểm soát luồng hàng In/Thêu/Giặt/CMT gửi xưởng ngoài, chặn hao hụt và chụp bằng chứng hàng lỗi đền bù.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Dữ liệu thời gian thực
        </span>
      </div>

      {/* 🔴 NÓI THẲNG PHẦN ĐANG HỎNG — ⛔ KHÔNG im lặng hiện danh sách rỗng.
          Danh sách rỗng đọc thành *"⛔ không có bó hàng nào ở ngoài"*, một
          phát biểu **sai** về hàng đã gửi đi mà chưa nhận về. */}
      {(loiBoHang || loiThuHoi) && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          ⛔ <strong>Luồng xuất – nhận bó hàng đang bị chặn ở tầng cơ sở dữ liệu.</strong>
          <br />
          <span className="text-xs">
            Enum <code>bundle_stage_enum</code> chỉ có bốn giá trị{' '}
            <code>CUT · SEWING · FINISHING · PACKED</code>, trong khi mã đang hỏi{' '}
            <code>CUT_PASSED</code> · <code>SEWING_READY</code> · <code>OUTSIDE_PROCESSING</code>.
            Khuyết tật đã ghi ở <code>supabase/seeds/S001</code>. Sửa cần <strong>migration + ADR</strong>{' '}
            ⇒ đang chờ Board. Danh sách bó hàng bên dưới vì vậy <strong>trống ⛔ không phải vì hết hàng</strong>.
          </span>
        </div>
      )}

      {/* 🔴 BIỂU ĐỒ HÀNG CÒN Ở XƯỞNG NGOÀI — đặt TRƯỚC thẻ số và bảng.
          Câu quan trọng nhất của gia công ngoài ⛔ không phải *"đã gửi bao
          nhiêu"* mà là *"hàng của tôi còn nằm ngoài bao nhiêu"* — hàng đã trả
          tiền vải, đã trả công cắt, và đang nằm ngoài tầm tay. */}
      <div className="mb-5">
        <SubconChart don={subconOrders} />
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Đơn Gia Công Đang Chạy</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-extrabold text-blue-600 mt-2 tabular-nums">{runningOrders}</p>
          <p className="text-xs text-slate-500 mt-1">Tổng cộng {subconOrders.length} đơn hệ thống</p>
        </div>

        <div className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bó Hàng Tại Xưởng Ngoài</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 mt-2 tabular-nums">
            {processingBundles.length} <span className="text-sm font-normal text-slate-500">Bó</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Đang chờ kiểm hàng thu hồi</p>
        </div>

        <div className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bó Hàng Sẵn Sàng Xuất Đi</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2 tabular-nums">
            {availableBundles.length} <span className="text-sm font-normal text-slate-500">Bó</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Đã qua khâu Cắt / May</p>
        </div>
      </div>

      {/* FORM KHU VỰC TẠO ĐƠN & THAO TÁC XUẤT/NHẬP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORM 1: KHỞI TẠO ĐƠN GIA CÔNG */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-200">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">1</span>
            Tạo Đơn Gia Công Mới
          </h2>
          <form
            action={async (formData: FormData) => {
              'use server'
              // 'use server' là BẮT BUỘC với inline action trong Server Component —
              // thiếu directive này Next.js sẽ báo lỗi runtime khi submit form.
              await createSubconOrder(formData)
            }}
            className="space-y-3"
          >
            <div>
              <label htmlFor="sco-vendor" className="block text-xs font-semibold text-slate-600 mb-1">
                Nhà Thầu Gia Công <span className="text-rose-500">*</span>
              </label>
              <select
                id="sco-vendor"
                name="vendor_id"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                <option value="">
                  {vendors.length === 0 ? '-- Chưa có nhà thầu trong hệ thống --' : '-- Chọn Nhà Thầu --'}
                </option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name} ({v.service_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sco-order-id" className="block text-xs font-semibold text-slate-600 mb-1">
                Mã Đơn Hàng (PO ID) <span className="text-rose-500">*</span>
              </label>
              <input
                id="sco-order-id"
                type="text"
                name="order_id"
                required
                placeholder="Dán UUID Đơn hàng PO..."
                pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                title="Giá trị phải là UUID hợp lệ (vd: 123e4567-e89b-12d3-a456-426614174000)"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors [&:not(:placeholder-shown):invalid]:border-rose-400 [&:not(:placeholder-shown):invalid]:ring-rose-200"
              />
            </div>

            <div>
              <label htmlFor="sco-process" className="block text-xs font-semibold text-slate-600 mb-1">
                Loại Công Đoạn <span className="text-rose-500">*</span>
              </label>
              <select
                id="sco-process"
                name="process_type"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                <option value="IN_THEU">In / Thêu vi tính</option>
                <option value="GIAT">Giặt công nghiệp (Washing)</option>
                <option value="MAY_GIA_CONG">May gia công ngoài (CMT)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="sco-price" className="block text-xs font-semibold text-slate-600 mb-1">Đơn Giá / SP (VNĐ)</label>
                <input
                  id="sco-price"
                  type="number"
                  name="unit_price"
                  defaultValue="0"
                  min="0"
                  step="any"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="sco-return-date" className="block text-xs font-semibold text-slate-600 mb-1">Ngày Hẹn Trả</label>
                <input
                  id="sco-return-date"
                  type="date"
                  name="expected_return_date"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <SubmitButton
              pendingText="Đang phát hành đơn..."
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm py-2.5 rounded-lg transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              + Phát Hành Đơn SCO
            </SubmitButton>
          </form>
        </div>

        {/* FORM 2: XUẤT BÓ HÀNG ĐI GIA CÔNG */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-200">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold shrink-0">2</span>
            Xuất Bó Hàng Đi Xưởng
          </h2>
          <form
            action={async (formData: FormData) => {
              'use server'
              await issueBundleToSubcon(formData)
            }}
            className="space-y-3"
          >
            <div>
              <label htmlFor="issue-sco" className="block text-xs font-semibold text-slate-600 mb-1">
                Đơn Gia Công (SCO) <span className="text-rose-500">*</span>
              </label>
              <select
                id="issue-sco"
                name="subcon_order_id"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
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
              <label htmlFor="issue-bundle" className="block text-xs font-semibold text-slate-600 mb-1">
                Chọn Bó Hàng (Bundle) <span className="text-rose-500">*</span>
              </label>
              <select
                id="issue-bundle"
                name="bundle_id"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              >
                <option value="">
                  {availableBundles.length === 0 ? '-- Không còn bó hàng sẵn sàng --' : '-- Chọn Bó Hàng Sẵn Sàng --'}
                </option>
                {availableBundles.map((b) => (
                  <option key={b.id} value={b.id}>
                    Mã Bó: {b.bundle_code} ({b.quantity} pcs) - PO: {getPoNumber(b.cut_tickets)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="issue-qty" className="block text-xs font-semibold text-slate-600 mb-1">
                Số Lượng Xuất (Pcs) <span className="text-rose-500">*</span>
              </label>
              <input
                id="issue-qty"
                type="number"
                name="quantity_sent"
                required
                min="1"
                step="1"
                placeholder="Nhập số lượng xuất..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="issue-notes" className="block text-xs font-semibold text-slate-600 mb-1">Ghi Chú Giao Hàng</label>
              <input
                id="issue-notes"
                type="text"
                name="notes"
                maxLength={500}
                placeholder="Số xe, tên tài xế giao..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              />
            </div>

            <SubmitButton
              pendingText="Đang ghi nhận xuất kho..."
              className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-medium text-sm py-2.5 rounded-lg transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              📤 Quét Xuất Đi Gia Công
            </SubmitButton>
          </form>
        </div>

        {/* FORM 3: THU HỒI BÓ HÀNG & QC HÌNH ẢNH LỖI */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-200">
          <h2 className="flex items-center gap-2 text-sm font-bold text-rose-900 uppercase tracking-wide border-b border-rose-100 pb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-bold shrink-0">3</span>
            Thu Hồi Kho & QC Bằng Chứng
          </h2>
          <form
            action={async (formData: FormData) => {
              'use server'
              await receiveBundleFromSubcon(formData)
            }}
            className="space-y-3"
          >
            <div>
              <label htmlFor="receive-sco" className="block text-xs font-semibold text-slate-600 mb-1">
                Đơn Gia Công (SCO) <span className="text-rose-500">*</span>
              </label>
              <select
                id="receive-sco"
                name="subcon_order_id"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
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
              <label htmlFor="receive-bundle" className="block text-xs font-semibold text-slate-600 mb-1">
                Bó Hàng Thu Hồi <span className="text-rose-500">*</span>
              </label>
              <select
                id="receive-bundle"
                name="bundle_id"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              >
                <option value="">
                  {processingBundles.length === 0 ? '-- Không có bó hàng ngoài xưởng --' : '-- Chọn Bó Hàng Cần Thu Hồi --'}
                </option>
                {processingBundles.map((b) => (
                  <option key={b.id} value={b.id}>
                    Mã Bó: {b.bundle_code} ({b.quantity} pcs) - PO: {getPoNumber(b.cut_tickets)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="receive-good" className="block text-xs font-semibold text-emerald-700 mb-1">SL Đạt (Pcs)</label>
                <input
                  id="receive-good"
                  type="number"
                  name="quantity_good"
                  defaultValue="0"
                  min="0"
                  step="1"
                  className="w-full text-sm border border-emerald-300 rounded-lg p-2.5 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="receive-defect" className="block text-xs font-semibold text-rose-700 mb-1">SL Lỗi/Hỏng (Pcs)</label>
                <input
                  id="receive-defect"
                  type="number"
                  name="quantity_defect"
                  defaultValue="0"
                  min="0"
                  step="1"
                  className="w-full text-sm border border-rose-300 rounded-lg p-2.5 bg-rose-50/30 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="receive-evidence" className="block text-xs font-semibold text-slate-600 mb-1">
                URL Ảnh Bằng Chứng (Bắt buộc nếu có Lỗi)
              </label>
              <input
                id="receive-evidence"
                type="text"
                name="defect_evidence_urls"
                placeholder="https://.../evidence1.jpg, https://..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-colors"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Phân tách nhiều URL ảnh bằng dấu phẩy</p>
            </div>

            <div>
              <label htmlFor="receive-reason" className="block text-xs font-semibold text-slate-600 mb-1">Lý Do Hàng Lỗi</label>
              <input
                id="receive-reason"
                type="text"
                name="defect_reason"
                maxLength={500}
                placeholder="Bóng In bong tróc, Thêu đứt chỉ..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-colors"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="is_chargeable"
                name="is_chargeable"
                defaultChecked
                className="h-4 w-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
              />
              <label htmlFor="is_chargeable" className="text-xs font-semibold text-rose-800 cursor-pointer select-none">
                Gán cờ Đền bù Vendor (Chargeable)
              </label>
            </div>

            <SubmitButton
              pendingText="Đang nhập kho & khấu trừ..."
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm py-2.5 rounded-lg transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              📥 Nhập Thu Hồi & Khấu Trừ
            </SubmitButton>
          </form>
        </div>
      </div>

      {/* DANH SÁCH ĐƠN GIA CÔNG DƯỚI DẠNG BẢNG GIÁM SÁT */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">📋 Danh Sách Đơn Gia Công Đang Theo Dõi</h2>
          <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">
            {subconOrders.length} đơn
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
              <tr>
                <th scope="col" className="px-5 py-3">Mã Đơn SCO</th>
                <th scope="col" className="px-5 py-3">Nhà Thầu / Xưởng</th>
                <th scope="col" className="px-5 py-3">Công Đoạn</th>
                <th scope="col" className="px-5 py-3 text-right">SL Xuất</th>
                <th scope="col" className="px-5 py-3 text-right">SL Đạt</th>
                <th scope="col" className="px-5 py-3 text-right">SL Lỗi</th>
                <th scope="col" className="px-5 py-3">Tiến Độ Thu Hồi</th>
                <th scope="col" className="px-5 py-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subconOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                      <p className="text-sm">Chưa có đơn gia công nào được khởi tạo.</p>
                      <p className="text-xs">Sử dụng Form số 1 phía trên để phát hành đơn SCO đầu tiên.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                subconOrders.map((o) => {
                  const vendor = getVendorInfo(o.subcontractors)
                  const sent = o.total_sent_qty ?? 0
                  const received = o.total_received_qty ?? 0
                  const progressPct = sent > 0 ? Math.min(100, Math.round((received / sent) * 100)) : 0
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">{o.subcon_order_no}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {vendor.name} <span className="text-xs text-slate-400">({vendor.code})</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold ring-1 ring-inset ring-blue-100">
                          {PROCESS_LABELS[o.process_type ?? ''] ?? o.process_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-slate-700 tabular-nums">
                        {fmtNumber(o.total_sent_qty)}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-600 tabular-nums">
                        {fmtNumber(o.total_received_qty)}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-rose-600 tabular-nums">
                        {fmtNumber(o.total_defect_qty)}
                      </td>
                      <td className="px-5 py-3 min-w-[130px]">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                progressPct >= 100 ? 'bg-emerald-500' : progressPct > 0 ? 'bg-amber-500' : 'bg-slate-200'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 tabular-nums w-8 text-right">
                            {progressPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            STATUS_BADGE[o.status ?? ''] ?? DEFAULT_BADGE
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
