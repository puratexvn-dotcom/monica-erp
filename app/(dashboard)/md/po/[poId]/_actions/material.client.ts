'use server';

import { getMaterialReadiness, getRollTrace } from '../_services/material.service';
import type { MaterialResult, RollTrace } from '../_services/material.service';

// ============================================================================
// CẦU NỐI CHO LÁT CẮT NGUYÊN PHỤ LIỆU
//
// Hai lời gọi TÁCH RỜI, cố ý: bảng định mức nạp khi mở tab, danh sách cuộn chỉ
// nạp khi người dùng bấm vào một mã vải có vấn đề. Gộp lại thì mọi lần mở tab
// đều kéo theo hàng trăm dòng cuộn mà phần lớn không ai xem.
// ============================================================================

export async function getMaterialReadinessClient(poId: string): Promise<MaterialResult> {
  return getMaterialReadiness(poId);
}

export async function getRollTraceClient(
  materialId: string,
): Promise<{ ok: true; rolls: RollTrace[] } | { ok: false; message: string }> {
  return getRollTrace(materialId);
}
