'use server';

import { getProductionTwin } from '../_services/production.service';
import type { ProductionResult } from '../_services/production.service';

// ============================================================================
// CẦU NỐI CHO LÁT CẮT SẢN XUẤT
//
// Service có 'server-only'. Quyền kiểm bên trong service qua guard() — Server
// Action là endpoint có thể bị gọi thẳng, không dựa vào middleware.
// ============================================================================

export async function getProductionTwinClient(poId: string): Promise<ProductionResult> {
  return getProductionTwin(poId);
}
