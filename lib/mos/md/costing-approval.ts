// ============================================================================
// AI ĐƯỢC DUYỆT CHIẾT TÍNH — LOGIC THUẦN
//
// Board 06/08/2026: *"MD làm costing để **báo cáo cho Production Director**…
// PD xem và **duyệt hoặc từ chối, hoặc yêu cầu báo lại kèm lý do**; sau đó
// thông báo kết quả ngược lại cho MD."*
//
// ⇒ MD **TRÌNH**. MD ⛔ **KHÔNG DUYỆT**. Trước bản này màn hình Chiết tính hiện
// nút *"Duyệt"* cho **mọi người**, và Server Action ⛔ không kiểm vai — tức MD
// tự duyệt được giá của chính mình. Đó là `SOD` bị thủng ở đúng chỗ đắt nhất:
// giá bán.
//
// ─── ✅ ĐÃ ĐƯỢC BOARD XÁC NHẬN 06/08/2026 ──────────────────────────────────
// **Production Director CHÍNH LÀ giám đốc / giám đốc sản xuất — vai `giamdoc`.**
//
// ⛔ **KHÔNG tạo vai `productionDirector` mới.**
//
// ⚠️ Bản trước của khối chú thích này ghi *"vai PD chưa tồn tại, cần Board mở
// vai mới"* — **SAI**. Vai đã có sẵn, chỉ mang tên khác. Nhầm lẫn sinh ra vì
// Trang chủ hiện **hai ô riêng** *(`CEO` ← module `executive`, `Production
// Director` ← module `planning`)*, nên trông như hai người; thực tế **cùng một
// người**: `giamdoc`.
//
// 🔑 Hệ quả: báo cáo tổng hợp của MD *"gửi CEO và Production Director"* là gửi
// tới **cùng một vai** ở tầng phân quyền, dù là hai lối vào trên Trang chủ.
// ============================================================================
import type { Role } from '@/lib/rbac';

/**
 * Vai được **duyệt · từ chối · yêu cầu làm lại** một bản chiết tính.
 *
 * ⚠️ ⛔ KHÔNG thêm `md` vào đây. Toàn bộ điểm của luồng này là **người làm giá
 * ⛔ không phải người duyệt giá**.
 */
export const VAI_DUYET_CHIET_TINH: readonly Role[] = ['giamdoc', 'superadmin'];

/** Vai được **lập và trình** một bản chiết tính. */
export const VAI_TRINH_CHIET_TINH: readonly Role[] = ['md', 'giamdoc', 'superadmin'];

export type HanhDongChietTinh = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISE';

/** Hành động đòi phải nêu lý do — người làm lại cần biết sửa gì. */
export const CAN_LY_DO: readonly HanhDongChietTinh[] = ['REJECTED', 'REVISE'];

export function duocDuyet(role: Role | null): boolean {
  return role !== null && VAI_DUYET_CHIET_TINH.includes(role);
}

export function duocTrinh(role: Role | null): boolean {
  return role !== null && VAI_TRINH_CHIET_TINH.includes(role);
}

/**
 * Vai này có được làm hành động này ⛔ không, và nếu ⛔ không thì **vì sao**.
 *
 * 🔑 Trả về câu giải thích chứ ⛔ không chỉ `false`: người dùng bị chặn mà ⛔
 * không biết lý do sẽ bấm lại lần nữa, rồi gọi hỗ trợ.
 */
export function kiemQuyen(
  role: Role | null,
  hanhDong: HanhDongChietTinh,
): { ok: true } | { ok: false; vi: string } {
  if (hanhDong === 'SUBMITTED') {
    return duocTrinh(role) ? { ok: true }
      : { ok: false, vi: 'Bạn không có quyền trình duyệt bản chiết tính.' };
  }
  return duocDuyet(role) ? { ok: true }
    : {
      ok: false,
      vi: 'Chỉ Giám đốc sản xuất mới được duyệt hoặc từ chối bản chiết tính. '
        + 'Merchandiser lập và trình; người duyệt là người khác.',
    };
}
