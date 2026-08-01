import { normalizeFilter } from './normalize';

// ============================================================================
// QUERY KEY FACTORY — SHIPMENT
//
// ⚠️ ĐỌC KỸ TRƯỚC KHI DÙNG: HÔM NAY FACTORY NÀY CHƯA CÓ NGƯỜI DÙNG.
//
// Trung tâm Xuất hàng (Phase 6) đang chạy bằng hook TỰ VIẾT —
// `lib/mos/use-shipment-center.ts`, dùng `useState`/`useEffect`, không có
// React Query. Quyết định Kiến trúc sư: React Query **chỉ dùng cho
// /md/assignments**, sáu hook cũ GIỮ NGUYÊN.
//
// Vậy tệp này để làm gì? Để khi Trung tâm Xuất hàng chuyển sang React Query
// thì khoá đã có sẵn một hình dạng ĐÚNG QUY ƯỚC, thay vì ai đó gõ vội
// `['shipments', poId]` và tạo ra đúng lớp lỗi mà cả thư mục này sinh ra để
// chặn.
//
// ─── VÀ VÌ SAO NÓ KHÔNG PHẢI ĐỒ BỊA ──────────────────────────────────────
// Mọi khoá dưới đây soi theo BỀ MẶT THẬT của service đang chạy:
//     getShipmentCenter(poId) → ShipmentCenter { rows, summary }
// Không phát minh truy vấn chưa tồn tại. Khi có truy vấn mới, thêm khoá mới —
// cùng lúc, không phòng xa.
// ============================================================================

const ROOT = 'shipment' as const;

export interface ShipmentListFilter {
  orderId?: string;
  status?: string[];
  forwarder?: string;
}

export const shipmentKeys = {
  all: [ROOT] as const,

  /**
   * Toàn bộ lát cắt Xuất hàng của MỘT đơn hàng — tương ứng
   * `getShipmentCenter(poId)`, hàm DUY NHẤT đang chạy thật hôm nay.
   */
  center: (poId: string) => [ROOT, 'center', poId] as const,

  lists: () => [ROOT, 'list'] as const,
  list: (filter?: ShipmentListFilter) => [ROOT, 'list', normalizeFilter(filter)] as const,

  details: () => [ROOT, 'detail'] as const,
  detail: (shipmentId: string) => [ROOT, 'detail', shipmentId] as const,
} as const;

/**
 * ⚠️ Lô hàng gắn với ĐƠN HÀNG, nên sửa một lô phải làm mới cả lát cắt của đơn
 * đó — không chỉ riêng lô. Bỏ sót `center(poId)` thì bảng tổng hợp số thùng và
 * số lượng đứng yên trong khi dòng chi tiết đã đổi, và hai con số trên cùng một
 * màn hình mâu thuẫn nhau.
 */
export function shipmentInvalidationKeys(
  poId?: string,
  shipmentId?: string,
): readonly unknown[][] {
  const keys: unknown[][] = [[...shipmentKeys.lists()]];
  if (poId) keys.push([...shipmentKeys.center(poId)]);
  if (shipmentId) keys.push([...shipmentKeys.detail(shipmentId)]);
  return keys;
}
