'use server';

import { getExecutiveOverview } from '../_services/executive.service';
import type { ExecutiveResult } from '../_services/executive.service';

// ============================================================================
// CẦU NỐI CHO LÁT CẮT TỔNG QUAN ĐIỀU HÀNH
//
// Service có 'server-only' nên component client không import thẳng được. Quyền
// vẫn kiểm bên trong service qua guard() — Server Action là endpoint có thể bị
// gọi thẳng, không dựa vào middleware.
// ============================================================================

export async function getExecutiveOverviewClient(poId: string): Promise<ExecutiveResult> {
  return getExecutiveOverview(poId);
}
