'use server';

import { getPo360 } from '../_services/po.service';
import type { Po360Data } from '../_services/po.service';

// ============================================================================
// CẦU NỐI ĐỂ CLIENT GỌI ĐƯỢC getPo360
//
// po.service.ts có 'server-only' nên client component KHÔNG import trực tiếp
// được — và đó là chủ đích, để tránh lỡ tay kéo truy vấn xuống trình duyệt.
// File này là Server Action mỏng, chỉ chuyển tiếp lời gọi.
//
// Quyền vẫn được kiểm bên trong getPo360 qua guard(): Server Action là endpoint
// HTTP công khai nên không thể coi là an toàn chỉ vì client "biết điều".
// ============================================================================

export async function getPo360Client(orderId: string): Promise<Po360Data> {
  return getPo360(orderId);
}
