'use server';

import { getStyleDetail, listStyleOptions } from '../_services/style.service';
import type { StyleDetail } from '../_services/style.service';

// ============================================================================
// CẦU NỐI ĐỂ CLIENT GỌI ĐƯỢC service của Mã hàng.
// style.service.ts có 'server-only' nên client không import trực tiếp được —
// đó là chủ đích. Quyền vẫn kiểm bên trong service qua guard().
// ============================================================================

export async function getStyleDetailClient(styleId: string): Promise<StyleDetail> {
  return getStyleDetail(styleId);
}

export async function listStyleOptionsClient() {
  return listStyleOptions();
}
