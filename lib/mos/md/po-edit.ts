// ============================================================================
// SỬA ĐƠN HÀNG — AI ĐƯỢC SỬA, VÀ SỬA ĐƯỢC GÌ
//
// Board 06/08/2026: *"PD và MD có thể **sửa được số lượng và tiến độ** của PO
// đó."*
//
// ⛔ Không React, ⛔ không CSDL — Cổng khách hàng và bảng tổng của Giám đốc rồi
// cũng phải áp đúng luật này.
//
// ✅ **Production Director = giám đốc = giám đốc sản xuất = vai `giamdoc`.**
// ⛔ Không có vai `productionDirector` riêng — Board xác nhận 06/08/2026.
// ============================================================================
import type { Role } from '@/lib/rbac';

/** Vai được sửa số lượng và tiến độ PO. */
export const VAI_SUA_PO: readonly Role[] = ['md', 'giamdoc', 'superadmin'];

export function duocSuaPo(role: Role | null): boolean {
  return role !== null && VAI_SUA_PO.includes(role);
}

/**
 * Trạng thái tiến độ của một PO.
 *
 * 🔴 **MỞ RỘNG 07/08/2026 · Board Decision `BUG-4`.** Bốn giá trị cũ *(`DRAFT`
 * `APPROVED` `IN_PRODUCTION` `COMPLETED`)* chép từ chú thích của migration
 * `002`, và chúng **thiếu hai** so với `PO_STATUSES` ở `schemas/md/order.schema.ts`
 * — nơi đã khai đủ sáu từ lâu.
 *
 * 🔑 Hậu quả đo được: Board ra luật *"SHIPPED: Khóa"*, nhưng `kiemSuaPo` **bác
 * mọi lượt đặt `SHIPPED`** ⇒ trạng thái ấy **⛔ không tới được từ màn hình MD**,
 * và một điều luật về trạng thái ⛔ không tồn tại là điều luật chết. Tương tự
 * `CANCELLED` — nó là **lối lưu trữ duy nhất** của PO *(`orders` ⛔ không có
 * `deleted_at`)*, mà cũng ⛔ không đặt được.
 *
 * ⚠️ `orders.status` là `VARCHAR(50)` **⛔ KHÔNG có ràng buộc `CHECK`** — đã
 * đối chiếu migration `002` dòng 17. Nên mở rộng ở đây ⛔ không cần migration,
 * ⛔ không đụng lược đồ. Nhưng cũng vì thế **CSDL ⛔ không chặn giúp** giá trị
 * rác: `kiemSuaPo` là hàng rào **duy nhất** đang có cho cột này.
 *
 * ⚠️ `SHIPPED` và `COMPLETED` là **CỬA MỘT CHIỀU** — `document-lock.ts` khoá
 * chúng lại ngay khi đặt xong. Chỉ Giám đốc mở lại được.
 */
export const PO_TIEN_DO = [
  'DRAFT', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'SHIPPED', 'CANCELLED',
] as const;
export type PoTienDo = (typeof PO_TIEN_DO)[number];

export const PO_TIEN_DO_LABEL: Record<PoTienDo, string> = {
  DRAFT: 'Nháp',
  APPROVED: 'Đã duyệt',
  IN_PRODUCTION: 'Đang sản xuất',
  COMPLETED: 'Hoàn thành 🔒',
  SHIPPED: 'Đã xuất hàng 🔒',
  CANCELLED: 'Đã huỷ 🔒',
};

export interface SuaPoInput {
  total_quantity: number;
  status: string;
  delivery_date: string;
}

export type KetQuaKiem = { ok: true } | { ok: false; vi: string; truong: keyof SuaPoInput };

/**
 * Kiểm dữ liệu sửa PO **trước khi** chạm CSDL.
 *
 * 🔑 Kiểm ở đây thay vì chỉ dựa vào ràng buộc `CHECK` của CSDL: lỗi từ CSDL trả
 * về dạng **tên ràng buộc**, người dùng đọc ⛔ không hiểu gì.
 *
 * ⚠️ Số lượng là thứ **đã cam kết với khách**. Sửa nó ⛔ không phải thao tác
 * bình thường — nó kéo theo định mức NPL, lệnh sản xuất, và lịch tàu. Vì vậy
 * hàm này **chặn số 0 và số âm**, và nơi gọi phải hỏi lại người dùng.
 */
export function kiemSuaPo(v: SuaPoInput): KetQuaKiem {
  if (!Number.isFinite(v.total_quantity) || v.total_quantity <= 0) {
    return { ok: false, vi: 'Số lượng phải lớn hơn 0.', truong: 'total_quantity' };
  }
  if (!Number.isInteger(v.total_quantity)) {
    return { ok: false, vi: 'Số lượng phải là số nguyên (không có sản phẩm nửa cái).', truong: 'total_quantity' };
  }
  if (v.total_quantity > 9_999_999) {
    return { ok: false, vi: 'Số lượng vượt ngưỡng cho phép.', truong: 'total_quantity' };
  }
  if (!(PO_TIEN_DO as readonly string[]).includes(v.status)) {
    return { ok: false, vi: `Trạng thái "${v.status}" không hợp lệ.`, truong: 'status' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.delivery_date)) {
    return { ok: false, vi: 'Ngày giao không hợp lệ.', truong: 'delivery_date' };
  }
  return { ok: true };
}

/**
 * Cảnh báo khi số lượng mới **thấp hơn số đã sản xuất/giao**.
 *
 * 🔴 Đây là chỗ dữ liệu trở nên vô nghĩa mà ⛔ không lỗi nào nổ ra: PO 5.000 cái
 * đã may xong 4.800, sửa xuống 3.000 thì tiến độ thành **160%** và mọi báo cáo
 * sản lượng đọc ra là dối. Hàm trả về câu cảnh báo để màn hình **hỏi lại**,
 * ⛔ không tự chặn — có trường hợp khách thật sự cắt đơn.
 */
export function canhBaoGiamSoLuong(moi: number, daLam: number): string | null {
  if (!Number.isFinite(daLam) || daLam <= 0) return null;
  if (moi >= daLam) return null;
  return `Số lượng mới (${moi.toLocaleString('vi-VN')}) THẤP HƠN số đã ghi nhận sản xuất `
    + `(${daLam.toLocaleString('vi-VN')}). Tiến độ sẽ vượt 100% và báo cáo sản lượng sẽ sai. `
    + 'Chỉ tiếp tục nếu khách thật sự cắt giảm đơn.';
}
