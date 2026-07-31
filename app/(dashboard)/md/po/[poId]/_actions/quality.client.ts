'use server';

import { getQualityCenter } from '../_services/quality.service';
import type { QualityResult } from '../_services/quality.service';

// ============================================================================
// CẦU NỐI CHO LÁT CẮT CHẤT LƯỢNG
//
// Một lời gọi duy nhất: phiếu kiểm và phiếu khắc phục đã được service chạy song
// song bên trong. Tách ra hai Server Action sẽ thành hai vòng mạng từ trình
// duyệt — đúng thứ vừa tránh được ở tầng dưới.
// ============================================================================

export async function getQualityCenterClient(poId: string): Promise<QualityResult> {
  return getQualityCenter(poId);
}
