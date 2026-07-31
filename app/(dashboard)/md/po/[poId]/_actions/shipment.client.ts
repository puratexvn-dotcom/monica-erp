'use server';

import { getShipmentCenter } from '../_services/shipment.service';
import type { ShipmentResult } from '../_services/shipment.service';

// ============================================================================
// CẦU NỐI CHO LÁT CẮT XUẤT HÀNG
//
// Một lời gọi duy nhất: hai view đã được service chạy song song bên trong. Tách
// thành hai Server Action sẽ thành hai vòng mạng từ trình duyệt — đúng thứ vừa
// tránh được ở tầng dưới.
// ============================================================================

export async function getShipmentCenterClient(poId: string): Promise<ShipmentResult> {
  return getShipmentCenter(poId);
}
