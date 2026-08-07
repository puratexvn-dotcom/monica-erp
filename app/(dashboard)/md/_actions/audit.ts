'use server';

import { guard, logDbError } from '../_services/guard';
import { diffRecords } from '@/schemas/md';
// ⚠️ Hằng nằm ở `lib/`, ⛔ không ở tệp này: Next.js chỉ cho export **hàm
// async** từ một tệp `'use server'`. Xem khối chú thích đầu `version-log.ts`.
import { KHOA_PHIEN_BAN, KHOA_ANH_CHUP, type HanhDongNhatKy } from '@/lib/mos/md/version-log';

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
  action: HanhDongNhatKy,
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

// ============================================================================
// 🔴 VERSION HISTORY — **BOARD DECISION 07/08/2026**, mục *"Bổ sung thêm ①"*
//
//   > *"Các chứng từ phải lưu Version. **⛔ Không overwrite dữ liệu.**"*
//
// ─── ⚠️ ĐIỀU KHOẢN NÀY LẬT NGƯỢC MỘT QUYẾT ĐỊNH THIẾT KẾ ĐANG CÓ ──────────
// `015_md_order_lifecycle.sql` dòng 457 ghi thẳng vào lược đồ:
//
//   > *"Chỉ lưu phần THAY ĐỔI, ⛔ không lưu cả bản ghi: nhật ký của 500 chuyền
//   > sẽ phình rất nhanh nếu chép nguyên dòng mỗi lần sửa một ô."*
//
// Board nay yêu cầu **ngược lại**. Tôi thi hành, và ghi rõ **cái giá** thay vì
// im lặng: mỗi lượt sửa nay tốn thêm ~1–3 kB. Với ~50 lượt sửa/ngày là ~50 MB
// sau bốn năm — chấp nhận được, nhưng nó **⛔ không miễn phí** và Board phải
// biết mình đã mua gì.
//
// ─── 🔑 VÌ SAO ⛔ KHÔNG DỰNG BẢNG `*_versions` RIÊNG ─────────────────────
// Bảng mới = **migration** = ADR + phê duyệt Board, và `SECURITY FREEZE`
// *(`MOS §XI.1`)* đang chặn: *"⛔ Không migration mới nào được khởi tạo."*
//
// `activity_log` thì **đã có sẵn đúng ba thứ** một sổ phiên bản cần:
//   ① `041_activity_log_immutable.sql` — CHỈ-GHI-THÊM, ⛔ không `UPDATE`,
//      ⛔ không `DELETE`, `TRUNCATE` đã thu hồi. Bản ghi phiên bản mà sửa được
//      thì nó ⛔ không phải bằng chứng.
//   ② `changes JSONB` — chứa được nguyên ảnh chụp, ⛔ không cần đổi lược đồ.
//   ③ `actor_id` · `actor_role` · `created_at` — ai, vai gì, lúc nào.
//
// ⇒ Dùng nó là **⛔ không đụng lược đồ** mà vẫn có phiên bản **thật**, tra được
// ngay hôm nay chứ ⛔ không chờ Board chạy SQL.
//
// ⚠️ **NÓI THẲNG GIỚI HẠN:** đây là **sổ phiên bản ở tầng ứng dụng**. Ai đó ghi
// thẳng vào bảng qua SQL Editor hay `service_role` sẽ **⛔ không** để lại
// phiên bản. Sổ phiên bản ⛔ **không thể** đầy đủ chừng nào nó ⛔ chưa nằm
// trong trigger CSDL — đề xuất ở `ADR-027`, ⛔ CHƯA chạy.
// ============================================================================

/**
 * Ghi **một phiên bản** của chứng từ.
 *
 * 🔑 Ghi **cả ảnh chụp TRƯỚC lẫn SAU**, ⛔ không chỉ phần khác nhau. Chỉ có ảnh
 * chụp mới trả lời được câu *"lúc 14:20 ngày 3 tháng 8, chứng từ này trông như
 * thế nào?"* — mà đó đúng là câu người ta hỏi khi có tranh chấp với khách.
 * Phần khác nhau vẫn được ghi song song vì nó là thứ đọc nhanh được.
 *
 * @param truoc `null` khi là bản ghi MỚI *(⛔ chưa từng có phiên bản nào)*.
 * @param sau   `null` khi chứng từ bị LƯU TRỮ và ⛔ không còn bản mới.
 */
export async function writeVersion(
  entityType: string,
  entityId: string,
  action: HanhDongNhatKy,
  truoc: Record<string, unknown> | null,
  sau: Record<string, unknown> | null,
): Promise<void> {
  try {
    const g = await guard();
    if (!g.supabase) return;

    // ⚠️ ĐẾM ở đây thay vì nuôi một cột `version` trên bảng nghiệp vụ: cột ấy
    // phải `UPDATE` mỗi lượt sửa, và hai người sửa cùng lúc sẽ nhận **cùng một
    // số phiên bản**. Đếm trên sổ chỉ-ghi-thêm thì số ⛔ không bao giờ trùng
    // theo cách làm mất bản ghi — cùng lắm là hai dòng cùng số, và cả hai vẫn
    // còn nguyên ảnh chụp.
    const { count } = await g.supabase
      .from('activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    const soCu = typeof count === 'number' ? count : 0;

    const changes: Record<string, { from: unknown; to: unknown }> = {
      ...diffRecords(truoc ?? {}, sau ?? {}),
      [KHOA_PHIEN_BAN]: { from: soCu, to: soCu + 1 },
      [KHOA_ANH_CHUP]: { from: truoc, to: sau },
    };

    const { error } = await g.supabase.from('activity_log').insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      changes,
      actor_id: g.userId,
      actor_role: g.role,
    });
    if (error) logDbError('writeVersion', error);
  } catch (e) {
    logDbError('writeVersion', e);
  }
}
