'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// ====================================================================
// 1. LẤY DỮ LIỆU TỔNG QUAN PHÂN HỆ GIA CÔNG NGOÀI
// ====================================================================
export async function getSubconDashboardData() {
  const supabase = await createClient()

  // 1. Lấy danh sách Nhà thầu gia công
  const { data: vendors, error: vendorErr } = await supabase
    .from('subcontractors')
    .select('*')
    .eq('is_active', true)
    .order('vendor_name', { ascending: true })

  if (vendorErr) throw new Error(`Lỗi lấy danh sách Nhà thầu: ${vendorErr.message}`)

  // 2. Lấy danh sách Đơn gia công đang hoạt động
  const { data: subconOrders, error: orderErr } = await supabase
    .from('subcon_orders')
    .select(`
      *,
      subcontractors ( vendor_name, vendor_code, service_type ),
      orders ( po_number )
    `)
    .order('created_at', { ascending: false })

  if (orderErr) throw new Error(`Lỗi lấy danh sách Đơn gia công: ${orderErr.message}`)

  // 3. Lấy danh sách Bó hàng (Bundles) sẵn sàng đi gia công (Đang ở khâu Cắt hoặc May)
  const { data: availableBundles, error: bundleErr } = await supabase
    .from('cut_bundles')
    .select(`
      id,
      bundle_code,
      quantity,
      current_stage,
      cut_tickets (
        orders ( po_number )
      )
    `)
    .in('current_stage', ['CUT_PASSED', 'SEWING_READY'])
    .gt('quantity', 0)
    .limit(100)

  // 🔴 SỬA 07/08/2026 — ⛔ KHÔNG ĐỂ MỘT KHUYẾT TẬT ENUM GIẾT CẢ PHÂN HỆ.
  //
  // Câu truy vấn trên lọc `current_stage IN ('CUT_PASSED','SEWING_READY')`.
  // Enum `bundle_stage_enum` *(migration `007b`)* chỉ có **bốn** giá trị:
  // `CUT · SEWING · FINISHING · PACKED`. PostgreSQL trả lỗi:
  //
  //     invalid input value for enum bundle_stage_enum: "CUT_PASSED"
  //
  // `throw` ở đây làm **toàn bộ `/subcon` rơi vào `error.tsx`** — mất luôn
  // danh sách nhà thầu, bảng đơn gia công, và mọi thứ khác vốn ⛔ không liên
  // quan gì tới bó hàng. Đo được: `/subcon` hiện *"Không thể tải dữ liệu"*,
  // mã lỗi `2418174174`, **0 biểu mẫu**.
  //
  // ⚠️ Khuyết tật gốc ĐÃ ĐƯỢC GHI NHẬN ở `supabase/seeds/S001` §cuối: migration
  // `009` viết trigger gán `OUTSIDE_PROCESSING` và `SEWING_READY` — hai giá trị
  // **chưa từng tồn tại**. Toàn bộ luồng xuất–nhận gia công **chưa từng chạy
  // được**, và ⛔ không ai phát hiện vì hai bảng liên quan **rỗng**.
  //
  // 🔴 Sửa enum là **migration ⇒ cần ADR ⇒ thẩm quyền Board**. ⛔ KHÔNG tự làm.
  // Việc làm được ngay: **cô lập** phần hỏng, trả về rỗng kèm lời khai, để
  // phần còn lại của phân hệ sống.
  const loiBoHang = bundleErr ? `${bundleErr.message}` : null

  // 4. Lấy danh sách Bó hàng đang ở xưởng ngoài (Cần thu hồi)
  const { data: processingBundles, error: procErr } = await supabase
    .from('cut_bundles')
    .select(`
      id,
      bundle_code,
      quantity,
      current_stage,
      cut_tickets (
        orders ( po_number )
      )
    `)
    .eq('current_stage', 'OUTSIDE_PROCESSING')

  // Cùng lý do trên: `OUTSIDE_PROCESSING` cũng ⛔ không có trong enum.
  const loiThuHoi = procErr ? `${procErr.message}` : null

  return {
    vendors: vendors || [],
    subconOrders: subconOrders || [],
    availableBundles: availableBundles || [],
    processingBundles: processingBundles || [],
    // ⚠️ Trả lời khai ra ngoài để màn hình **nói thẳng cái đang hỏng**, ⛔
    // không im lặng hiện danh sách rỗng — danh sách rỗng đọc thành *"⛔ không
    // có bó hàng nào"*, một phát biểu **sai** về hàng đang nằm ngoài xưởng.
    loiBoHang,
    loiThuHoi,
  }
}

// ====================================================================
// 2. KHỞI TẠO ĐƠN GIA CÔNG MỚI (SUBCON ORDER)
// ====================================================================
export async function createSubconOrder(formData: FormData) {
  const supabase = await createClient()

  const vendor_id = formData.get('vendor_id') as string
  const order_id = formData.get('order_id') as string
  const process_type = formData.get('process_type') as string
  const unit_price = parseFloat((formData.get('unit_price') as string) || '0')
  const expected_return_date = formData.get('expected_return_date') as string

  if (!vendor_id || !order_id || !process_type) {
    return { error: 'Vui lòng điền đầy đủ: Nhà thầu, Đơn hàng PO và Loại công đoạn gia công.' }
  }

  // Tạo mã Đơn gia công tự động: SCO-YYYYMMDD-XXXX
  const subcon_order_no = `SCO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`

  const { error } = await supabase.from('subcon_orders').insert({
    subcon_order_no,
    vendor_id,
    order_id,
    process_type,
    unit_price,
    expected_return_date: expected_return_date ? new Date(expected_return_date).toISOString() : null,
    status: 'ISSUED',
    issued_date: new Date().toISOString(),
  })

  // Điều XXX mục 4: Assignment phải do Monica tạo, nhà thầu không tự giao việc
  // cho mình. Migration 026 chặn ở tầng CSDL; ở đây chỉ dịch mã lỗi 42501 sang
  // câu người dùng hiểu, thay vì ném nguyên văn "new row violates row-level
  // security policy" ra màn hình.
  if (error?.code === '42501') {
    return {
      error:
        'Nhà thầu không được tự tạo Đơn gia công. Đơn gia công do Monica lập và ' +
        'giao xuống; nhà thầu chỉ cập nhật dữ liệu phát sinh trên đơn đã có.',
    }
  }
  if (error) return { error: `Không thể tạo Đơn gia công: ${error.message}` }

  revalidatePath('/subcon')
  return { success: true }
}

// ====================================================================
// 3. XUẤT BÓ HÀNG ĐI GIA CÔNG (OUTBOUND LOG)
// Trigger DB fn_process_subcon_issue sẽ tự đổi stage sang OUTSIDE_PROCESSING
// ====================================================================
export async function issueBundleToSubcon(formData: FormData) {
  const supabase = await createClient()

  const subcon_order_id = formData.get('subcon_order_id') as string
  const bundle_id = formData.get('bundle_id') as string
  const quantity_sent = parseInt((formData.get('quantity_sent') as string) || '0', 10)
  const notes = formData.get('notes') as string

  if (!subcon_order_id || !bundle_id || quantity_sent <= 0) {
    return { error: 'Thông tin xuất hàng không hợp lệ hoặc Số lượng xuất phải > 0.' }
  }

  const { data: userData } = await supabase.auth.getUser()

  const { error } = await supabase.from('subcon_issue_logs').insert({
    subcon_order_id,
    bundle_id,
    quantity_sent,
    notes,
    created_by: userData.user?.id,
  })

  if (error) return { error: `Lỗi xuất hàng đi gia công: ${error.message}` }

  revalidatePath('/subcon')
  revalidatePath('/giam-doc')
  return { success: true }
}

// ====================================================================
// 4. THU HỒI BÓ HÀNG VỀ NHÀ MÁY (INBOUND LOG & QC BẰNG CHỨNG LỖI)
// Trigger DB fn_process_subcon_receipt sẽ tự trừ Bundle Shrinkage & chuyển stage về SEWING_READY
// ====================================================================
export async function receiveBundleFromSubcon(formData: FormData) {
  const supabase = await createClient()

  const subcon_order_id = formData.get('subcon_order_id') as string
  const bundle_id = formData.get('bundle_id') as string
  const quantity_good = parseInt((formData.get('quantity_good') as string) || '0', 10)
  const quantity_defect = parseInt((formData.get('quantity_defect') as string) || '0', 10)
  const is_chargeable = formData.get('is_chargeable') === 'on'
  const defect_reason = formData.get('defect_reason') as string
  const rawEvidenceUrls = formData.get('defect_evidence_urls') as string

  // Parse mảng URL ảnh bằng chứng (phân tách bởi dấu phẩy nếu có)
  const defect_evidence_urls = rawEvidenceUrls
    ? rawEvidenceUrls.split(',').map((url) => url.trim()).filter((url) => url.length > 0)
    : []

  // RÀNG BUỘC NGHIỆP VỤ PHÍA SERVER
  if (!subcon_order_id || !bundle_id) {
    return { error: 'Vui lòng chọn Đơn gia công và Bó hàng cần thu hồi.' }
  }

  if (quantity_good < 0 || quantity_defect < 0) {
    return { error: 'Số lượng sản phẩm không được là số âm.' }
  }

  if (quantity_good === 0 && quantity_defect === 0) {
    return { error: 'Tổng số lượng thu hồi (Đạt + Lỗi) phải lớn hơn 0.' }
  }

  // Bắt buộc chụp ảnh nếu phát sinh hàng lỗi (Bảo vệ quy tắc Check Constraint DB)
  if (quantity_defect > 0 && defect_evidence_urls.length === 0) {
    return {
      error: '⚠️ LỖI NGHIỆP VỤ BẮT BUỘC: Phát hiện có hàng lỗi/hỏng! Bạn BẮT BUỘC phải tải lên ít nhất 1 ảnh bằng chứng để quy trách nhiệm đền bù cho Vendor.',
    }
  }

  const { data: userData } = await supabase.auth.getUser()

  const { error } = await supabase.from('subcon_receipt_logs').insert({
    subcon_order_id,
    bundle_id,
    quantity_good,
    quantity_defect,
    is_chargeable,
    defect_reason: quantity_defect > 0 ? defect_reason : null,
    defect_evidence_urls,
    received_by: userData.user?.id,
  })

  if (error) {
    // Bắt lỗi vi phạm Check Constraint từ Database
    if (error.message.includes('chk_defect_requires_evidence')) {
      return { error: '⚠️ DATABASE REJECT: Hàng hỏng/lỗi bắt buộc phải đính kèm ảnh bằng chứng trong hệ thống!' }
    }
    return { error: `Không thể nhập kho thu hồi: ${error.message}` }
  }

  revalidatePath('/subcon')
  revalidatePath('/giam-doc')
  revalidatePath('/to-truong-may')
  return { success: true }
}