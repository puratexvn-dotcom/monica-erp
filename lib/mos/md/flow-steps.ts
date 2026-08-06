// ============================================================================
// DÒNG CHẢY — BƯỚC KẾ TIẾP CỦA MỘT CHỨNG TỪ (LOGIC THUẦN)
//
// ⛔ Không React, ⛔ không CSDL. Tách khỏi `_actions/flow.actions.ts` vì tệp
// `'use server'` **chỉ được export hàm async** — và vì luật chuyển bước là thứ
// Cổng khách hàng lẫn Workspace Kho rồi cũng cần đọc.
//
// 🔑 **Trả về ĐÚNG MỘT bước**, ⛔ không phải cả danh sách trạng thái. Bàn làm
// việc cần *"bấm để đi tiếp"*; một hộp chọn chín mục bắt người dùng tự nhớ thứ
// tự nghiệp vụ — mà thứ tự đó chính là thứ phần mềm phải nhớ hộ.
//
// ⚠️ Mọi mã trạng thái chép từ ràng buộc `CHECK` của migration đang chạy và từ
// bảng nhãn ở `md-schema.ts`. ⛔ Không tự nghĩ ra mã mới.
// ============================================================================

/** Trạng thái coi là ĐÓNG. Chứng từ đã đóng muốn sửa thì lập chứng từ điều
 *  chỉnh — quy tắc dự án cấm `UPDATE` chứng từ đã Đóng/Duyệt. */
export const TRANG_THAI_DONG = new Set([
  'RECEIVED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'DELIVERED',
]);

export type BuocKeTiep = { status: string; nhan: string } | null;

function tra(map: Record<string, BuocKeTiep>, status: string): BuocKeTiep {
  if (TRANG_THAI_DONG.has(status)) return null;
  return map[status] ?? null;
}

export function buocKeTiepNPL(status: string): BuocKeTiep {
  return tra({
    DRAFT: { status: 'SUBMITTED', nhan: 'Trình duyệt' },
    SUBMITTED: { status: 'APPROVED', nhan: 'Duyệt' },
    APPROVED: { status: 'ORDERED', nhan: 'Đã đặt mua' },
    ORDERED: { status: 'RECEIVED', nhan: 'Đã nhận hàng' },
  }, status);
}

export function buocKeTiepSanXuat(status: string): BuocKeTiep {
  return tra({
    PENDING: { status: 'RELEASED', nhan: 'Phát hành lệnh' },
    RELEASED: { status: 'IN_PROGRESS', nhan: 'Bắt đầu chạy' },
    IN_PROGRESS: { status: 'COMPLETED', nhan: 'Hoàn thành' },
  }, status);
}

export function buocKeTiepGiaoHang(status: string): BuocKeTiep {
  return tra({
    DRAFT: { status: 'BOOKED', nhan: 'Đã đặt chỗ' },
    BOOKED: { status: 'LOADING', nhan: 'Bắt đầu đóng hàng' },
    LOADING: { status: 'DEPARTED', nhan: 'Đã rời cảng' },
    DEPARTED: { status: 'IN_TRANSIT', nhan: 'Đang trên đường' },
    IN_TRANSIT: { status: 'ARRIVED_PORT', nhan: 'Đã tới cảng' },
    ARRIVED_PORT: { status: 'CUSTOM_CLEARANCE', nhan: 'Đang thông quan' },
    CUSTOM_CLEARANCE: { status: 'DELIVERED', nhan: 'Đã giao' },
  }, status);
}
