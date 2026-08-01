// ============================================================================
// QUERY KEY REGISTRY — CỬA VÀO DUY NHẤT
//
// Mọi hook nhập khẩu từ đây. Không hook nào được tự khai một mảng khoá.
//
// ─── QUY ƯỚC CHO PHÂN HỆ MỚI ─────────────────────────────────────────────
// Buyer Portal · Subcon Portal · Sales · HR · CRM · AI — mỗi phân hệ một tệp
// `<miền>.keys.ts` trong thư mục này, và mỗi tệp theo đúng ba khuôn:
//
//     const ROOT = '<miền>' as const;          gốc gõ MỘT lần
//     xxxKeys = { all, lists(), list(f), details(), detail(id) }
//     xxxInvalidationKeys(id?)                 danh sách làm mới sau khi GHI
//
// Ba khuôn đó không phải hình thức. `all` là thứ cho phép làm mới cả miền bằng
// một dòng; `lists()`/`details()` là thứ cho phép làm mới danh sách mà KHÔNG
// đá vào chi tiết đang mở; `xxxInvalidationKeys` là thứ giữ cho việc "thêm một
// truy vấn mới rồi quên làm mới nó" không trở thành lỗi im lặng.
//
// ⚠️ Gốc của hai miền KHÔNG được trùng nhau. `invalidate(['partner'])` mà lỡ
// quét luôn khoá của Assignment thì mỗi lần sửa một đối tác sẽ nạp lại toàn bộ
// phần việc. Có bài kiểm hợp đồng đối chiếu tính duy nhất của các gốc.
// ============================================================================

export { STALE_TIME, GC_TIME, type StaleTier } from './cache-policy';
export { normalizeFilter } from './normalize';

export { assignmentKeys, assignmentInvalidationKeys } from './assignment.keys';
export {
  partnerKeys,
  partnerInvalidationKeys,
  type PartnerListFilter,
} from './partner.keys';
export { masterDataKeys, masterDataInvalidationKeys } from './master-data.keys';
export {
  shipmentKeys,
  shipmentInvalidationKeys,
  type ShipmentListFilter,
} from './shipment.keys';

/**
 * Toàn bộ gốc khoá đang dùng.
 *
 * Chỉ dùng cho bài kiểm hợp đồng — nó đối chiếu rằng không hai miền nào chung
 * gốc. Giữ danh sách ở đây để thêm một miền mới là buộc phải khai vào đây, và
 * bài kiểm sẽ bắt ngay nếu trùng.
 */
export const QUERY_ROOTS = ['assignment', 'partner', 'master-data', 'shipment'] as const;
