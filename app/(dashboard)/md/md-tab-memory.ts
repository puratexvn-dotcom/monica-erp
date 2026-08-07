import type { TabKey } from './md-tabs';

// ============================================================================
// TAB ĐANG MỞ — SỐNG SÓT QUA LẦN REACT DỰNG LẠI COMPONENT
//
// 🔴 UAT `BUG-2` · 07/08/2026 — phát hiện bằng phiên `md001` thật.
//
// ─── TRIỆU CHỨNG ─────────────────────────────────────────────────────────
// Tạo xong **bất kỳ** chứng từ nào *(khách hàng · báo giá · chiết tính · mã
// hàng · NPL …)*, người dùng bị ném về Command Center và ⛔ không thấy thứ vừa
// lưu. Với một công cụ vận hành, ⛔ không xác nhận được việc mình vừa làm là
// khuyết tật chặn nghiệm thu — người dùng sẽ lập lại chứng từ lần hai.
//
// ─── BA PHÉP ĐO TÁCH BẠCH NGUYÊN NHÂN ────────────────────────────────────
//   ① bấm *"Tải lại"* (thuần client)      ⇒ tab **GIỮ NGUYÊN**
//   ② tạo qua Server Action               ⇒ tab **MẤT**
//   ③ đánh dấu `<main>.__dau` ⇒ **MẤT**; đánh dấu `window` ⇒ **CÒN**;
//      `performance` chỉ ghi **1** lượt điều hướng
// ⇒ ⛔ không phải tải lại trang, ⛔ không phải ai đó gọi `setTab('po')`.
// `revalidatePath('/md')` trong Server Action làm router **thay cả nhánh
// layout**, React **dựng lại** `MdClient`, và `useState` về mặc định.
//
// ─── 🔑 VÌ SAO BIẾN TẦM MODULE, ⛔ KHÔNG PHẢI `sessionStorage`/URL ───────
// Nó có **đúng** ngữ nghĩa cần:
//   · sống qua lần **dựng lại**      *(module vẫn nằm trong bộ nhớ)*
//   · chết khi **tải lại trang thật** *(module nạp lại)*
// nên phiên mới vẫn mở đúng Command Center như thiết kế. `sessionStorage`
// sống dai hơn mức cần; tham số URL thì kéo theo một lượt điều hướng — mà
// điều hướng lại chính là thứ đang gây ra lỗi này.
//
// ⚠️ ĐÁNH ĐỔI ĐÃ BIẾT, ⛔ không giấu: đi sang phân hệ khác rồi quay lại `/md`
// trong **cùng phiên** sẽ về tab đang dở thay vì Command Center. Với công cụ
// vận hành, *"tiếp tục chỗ đang làm"* là hành vi đúng — nhưng đây là **hệ
// quả**, ⛔ không phải chủ đích, nên ghi ra đây.
//
// ⚠️ ĐÂY LÀ BẢN VÁ **TRIỆU CHỨNG**. Gốc rễ: `revalidatePath` trên một route đã
// `force-dynamic` *(⛔ không có gì được cache)* ⛔ không mang lại lợi ích nào mà
// vẫn trả giá bằng một lần dựng lại toàn nhánh — kèm mất **mọi** state khác
// *(dữ liệu tab đã nạp · ô tìm · vị trí cuộn)*. Gỡ nó khỏi ~20 Server Action là
// thay đổi rộng, chạm cả bộ nhớ đệm router phía client, nên **trình Board** chứ
// ⛔ không tự quyết trong một lượt vá UAT.
// ============================================================================

let tabDangMo: TabKey = 'po';

export function nhoTab(t: TabKey): void {
  tabDangMo = t;
}

export function tabDaNho(): TabKey {
  return tabDangMo;
}
