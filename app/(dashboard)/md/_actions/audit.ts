'use server';

import { guard, logDbError } from '../_services/guard';

// ============================================================================
// GHI NHẬT KÝ THAO TÁC
//
// ─── VÌ SAO KHÔNG NÉM LỖI ───────────────────────────────────────────────────
// Nhật ký hỏng KHÔNG được làm hỏng nghiệp vụ. Nếu bảng activity_log bị khoá
// hay chưa tạo, việc tạo đơn hàng vẫn phải thành công — mất một dòng nhật ký
// còn hơn mất một đơn hàng. Lỗi ghi ra log máy chủ để còn sửa được.
//
// ─── VÌ SAO CHỈ GHI PHẦN THAY ĐỔI ───────────────────────────────────────────
// Chép nguyên bản ghi mỗi lần sửa một ô sẽ khiến nhật ký của vài trăm đơn
// phình rất nhanh, mà lúc tra lại vẫn phải tự so từng cột để tìm ra ô nào đổi.
// ============================================================================

export async function writeAudit(
  entityType: string,
  entityId: string | null,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'EXPORT',
  changes: Record<string, { from: unknown; to: unknown }> = {},
): Promise<void> {
  try {
    const g = await guard();
    if (!g.supabase) return;

    const { error } = await g.supabase.from('activity_log').insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      changes,
      actor_id: g.userId,
      actor_role: g.role,
    });
    if (error) logDbError('writeAudit', error);
  } catch (e) {
    logDbError('writeAudit', e);
  }
}
