'use server';

import { getPoTwinHeader } from '../_services/po-twin.service';
import type { PoTwinResult } from '@/lib/mos/po-twin.contract';

// ============================================================================
// CẦU NỐI CHO PO DIGITAL TWIN
//
// Service có 'server-only' nên component client không import thẳng được — đó là
// chủ đích, để mã truy vấn cơ sở dữ liệu không bao giờ lọt xuống trình duyệt.
// Quyền vẫn được kiểm bên trong service qua guard(), không dựa vào middleware:
// Server Action là endpoint có thể bị gọi thẳng.
// ============================================================================

export async function getPoTwinHeaderClient(poId: string): Promise<PoTwinResult> {
  return getPoTwinHeader(poId);
}
