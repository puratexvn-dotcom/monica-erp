import { PO_VIEWS, type PoView } from '@/lib/mos/po-twin.contract';
import type { Role } from '@/lib/rbac';

// ============================================================================
// PHÂN QUYỀN THEO LÁT CẮT — Điều XIII
//
// `canAccess` trong lib/rbac.ts chặn theo ROUTE. Ở đây chặn mịn hơn một cấp:
// cùng vào được /md/po/[id] nhưng không phải ai cũng xem được tab Tài chính.
//
// ─── VÌ SAO KHÔNG HARDCODE VAI TRÒ TRONG COMPONENT ───────────────────────
// Điều XIII: "Không hardcode role". Component chỉ hỏi `viewsFor(role)` và vẽ
// đúng chừng đó tab. Đổi chính sách phân quyền là sửa MỘT bảng ở đây, không
// phải đi lùng `role === 'giamdoc'` rải rác trong tám tệp.
//
// ─── VÌ SAO KHÔNG DÙNG DANH SÁCH CẤM ─────────────────────────────────────
// Khai theo kiểu CHO PHÉP: thêm một tab mới thì mặc định KHÔNG ai thấy cho tới
// khi khai tường minh. Khai theo kiểu cấm thì tab mới lọt cho mọi vai trò —
// sai sót phải nghiêng về phía khoá lại.
//
// ⚠️ Đây là hàng rào GIAO DIỆN. Hàng rào thật vẫn là RLS trong Postgres: buyer
// dù gọi thẳng PostgREST cũng chỉ thấy đơn của chính khách mình (migration 018).
// ============================================================================

const ALL: readonly PoView[] = PO_VIEWS;

/** Lát cắt không đụng tới tiền bạc — mở cho hầu hết vai trò nội bộ */
const OPERATIONAL: readonly PoView[] = [
  'executive', 'production', 'material', 'quality', 'buyer', 'shipment', 'activity',
];

const VIEW_ACCESS: Record<Role, readonly PoView[]> = {
  // Toàn quyền
  superadmin: ALL,
  giamdoc: ALL,
  md: ALL,
  ketoan: ALL,

  // Vận hành — không xem giá vốn, lợi nhuận, công nợ
  qa: OPERATIONAL,
  kho: OPERATIONAL,
  khotruong: OPERATIONAL,
  thukho: OPERATIONAL,
  ketoanvattu: OPERATIONAL,
  totruongmay: OPERATIONAL,
  totruongcat: OPERATIONAL,
  hoanthanh: OPERATIONAL,
  subcon: ['executive', 'production', 'quality', 'activity'],

  // Khách hàng — xem tiến độ đơn CỦA MÌNH, không xem giá thành nhà máy,
  // không xem nhật ký thao tác nội bộ.
  buyer: ['executive', 'production', 'quality', 'buyer', 'shipment'],
};

export function viewsFor(role: Role | null | undefined): readonly PoView[] {
  if (!role) return [];
  return VIEW_ACCESS[role] ?? [];
}

export function canViewSlice(role: Role | null | undefined, view: PoView): boolean {
  return viewsFor(role).includes(view);
}

/** Lát cắt mở đầu cho một vai trò. Luôn có thật trong danh sách của họ, nên
 *  không bao giờ mở ra một tab mà chính người đó không được xem. */
export function defaultViewFor(role: Role | null | undefined): PoView | null {
  return viewsFor(role)[0] ?? null;
}

// ── DỮ LIỆU CHẤT LƯỢNG NỘI BỘ ───────────────────────────────────────────────
//
// Tab Chất lượng vẫn nằm trong danh sách của buyer, nhưng HAI nguồn dữ liệu của
// nó đều là dữ liệu nội bộ nhà máy:
//
//   capa_logs — nguyên nhân gốc: tay nghề công nhân nào, máy nào hỏng, tổ
//               trưởng nào bỏ sót. Chuyện quản trị nhà máy.
//   qa_logs   — phiếu kiểm từng lô của QC nội bộ: loại lỗi, vị trí, chuyền nào.
//
// ⚠️ ĐÃ ĐO TRÊN CSDL ĐANG CHẠY bằng phiên đăng nhập buyer thật: migration 018
// cho buyer xem `qa_audit_reports` (biên bản kiểm hàng chính thức, thứ khách
// hàng có quyền nhận) nhưng `qa_logs` rơi vào danh sách chặn chung — buyer đọc
// ra ĐÚNG KHÔNG DÒNG NÀO.
//
// Nếu giao diện cứ thế vẽ ra thì khách hàng sẽ đọc thành "đơn này chưa kiểm
// lần nào", trong khi sự thật là bốn lô đã kiểm và hai lô trượt. Vì vậy hai
// hàm dưới đây tồn tại: để màn hình nói THẲNG là mục này không hiển thị cho vai
// trò của họ, thay vì vẽ một khung rỗng nói dối.
//
// Nhà thầu phụ cũng không được: một phiếu của chuyền mình có thể chỉ đích danh
// lỗi của họ, nhưng cũng có thể chỉ đích danh lỗi của chuyền khác.
//
// ⚠️ Đây chỉ là hàng rào giao diện. Hàng rào thật nằm ở Postgres: policy
// `capa_internal_only` (migration 023) và `buyer_denied` (migration 018).
//
// Tách làm HAI hàm dù hôm nay dùng chung một danh sách: mức nhạy cảm của hai
// nguồn khác nhau, và khi chính sách đổi thì chỉ một trong hai phải đổi.
const FACTORY_INTERNAL: readonly Role[] = [
  'superadmin', 'giamdoc', 'md', 'ketoan',
  'qa', 'kho', 'khotruong', 'thukho', 'ketoanvattu',
  'totruongmay', 'totruongcat', 'hoanthanh',
];

export function canViewCapa(role: Role | null | undefined): boolean {
  return !!role && FACTORY_INTERNAL.includes(role);
}

/** Phiếu kiểm từng lô của QC nội bộ (bảng qa_logs) */
export function canViewQaDetail(role: Role | null | undefined): boolean {
  return !!role && FACTORY_INTERNAL.includes(role);
}
