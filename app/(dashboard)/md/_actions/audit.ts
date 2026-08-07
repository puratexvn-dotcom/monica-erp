import 'server-only';

import { createClient } from '@/utils/supabase/server';
import { isRole } from '@/lib/rbac';
import { logDbError } from '../_services/guard';
import { diffRecords } from '@/schemas/md';
import { KHOA_PHIEN_BAN, KHOA_ANH_CHUP, type HanhDongNhatKy } from '@/lib/mos/md/version-log';

// ============================================================================
// GHI NHẬT KÝ THAO TÁC — SỔ KIỂM TOÁN DÙNG CHUNG
//
// ─── 🔴 HAI LỖI NGHIÊM TRỌNG ĐÃ VÁ Ở ĐÂY · UAT 08/08/2026 ────────────────
//
// ① **`'use server'` BIẾN SỔ KIỂM TOÁN THÀNH ENDPOINT CÔNG KHAI.**
//    Tệp này từng mang `'use server'`, nên `writeAudit` và `writeVersion`
//    được Next.js đăng ký thành **Server Action gọi thẳng được qua HTTP** —
//    đo được: cả hai có mặt trong bảng 146 action của gói đã dựng.
//
//    🔴 Nghĩa là bất kỳ ai đăng nhập cũng **NGỤY TẠO được bản ghi kiểm toán**:
//    dựng một dòng `APPROVE` trên chứng từ mình ⛔ không có quyền duyệt, hoặc
//    một `__anh_chup` bịa cho một PO ⛔ chưa từng đổi. `041` đã làm sổ này
//    **chỉ-ghi-thêm**, nhưng chỉ-ghi-thêm mà **ai cũng ghi thêm được nội dung
//    tuỳ ý** thì nó ⛔ không còn là bằng chứng.
//
//    ⇒ `import 'server-only'`. Hàm vẫn gọi được từ mọi Server Action *(nhập
//    module bình thường)*, nhưng **⛔ không còn cửa HTTP nào** trỏ tới nó.
//
// ② **GUARD CỦA PHÂN HỆ `/md` LÀM MẤT VẾT CỦA MỌI VAI KHÁC.**
//    Hai hàm này từng gọi `guard()` của `md/_services` — hàm đó kiểm
//    `canAccess(role, '/md')`. `MODULE_ACCESS.giamdoc` **⛔ không có `/md`**.
//
//    🔴 Hậu quả đo được trong UAT vòng đời: Giám đốc **mở lại thành công** một
//    PO đã `COMPLETED` *(nghiệp vụ chạy đúng)*, nhưng `writeVersion` bên trong
//    **im lặng trả về** ⇒ **⛔ KHÔNG một dòng nhật ký nào được ghi**. Thao tác
//    thẩm quyền cao nhất của hệ thống là thao tác **duy nhất ⛔ không có vết**.
//
//    🔑 Sổ kiểm toán **⛔ không thuộc phân hệ nào**. Nó ghi vết cho *"ai đó đã
//    làm gì"* — câu hỏi ⛔ không phụ thuộc người đó vào được màn hình nào.
//    ⇒ Ở đây chỉ hỏi **"có đăng nhập ⛔ không"**, ⛔ không hỏi *"vào được `/md`
//    ⛔ không"*. Quyền làm nghiệp vụ vẫn do chính Server Action gọi tới kiểm —
//    đó là việc của nó, ⛔ không phải việc của sổ.
//
// ─── VÌ SAO ⛔ KHÔNG NÉM LỖI ─────────────────────────────────────────────
// Nhật ký hỏng ⛔ KHÔNG được làm hỏng nghiệp vụ: mất một dòng nhật ký còn hơn
// mất một đơn hàng. Lỗi ghi ra log máy chủ để còn sửa được.
//
// ⚠️ Đánh đổi đã biết: **hỏng im lặng**. Đúng cơ chế đã giấu lỗi ② suốt thời
// gian dài. Nay bài kiểm vòng đời canh chuyện này bằng cách **đọc lại sổ** sau
// mỗi thao tác thẩm quyền, ⛔ không tin vào việc hàm ⛔ không ném lỗi.
// ============================================================================

/** Người đang thao tác — CHỈ cần biết *ai*, ⛔ không cần biết họ vào được đâu. */
async function nguoiThaoTac(): Promise<{
  sb: Awaited<ReturnType<typeof createClient>>; userId: string; role: string | null;
} | null> {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const raw = user.app_metadata?.role;
    return { sb, userId: user.id, role: isRole(raw) ? raw : null };
  } catch (e) {
    logDbError('nhatKy:auth', e);
    return null;
  }
}

export async function writeAudit(
  entityType: string,
  entityId: string | null,
  action: HanhDongNhatKy,
  changes: Record<string, { from: unknown; to: unknown }> = {},
): Promise<void> {
  try {
    const g = await nguoiThaoTac();
    if (!g) return;

    const { error } = await g.sb.from('activity_log').insert({
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
// `015_md_order_lifecycle.sql` dòng 457 ghi thẳng vào lược đồ: *"Chỉ lưu phần
// THAY ĐỔI, ⛔ không lưu cả bản ghi."* Board nay yêu cầu **ngược lại**. Tôi thi
// hành, và ghi rõ **cái giá**: mỗi lượt sửa tốn thêm ~1–3 kB.
//
// ─── 🔑 VÌ SAO ⛔ KHÔNG DỰNG BẢNG `*_versions` RIÊNG ─────────────────────
// Bảng mới = migration = ADR + phê duyệt Board, và `SECURITY FREEZE` đang
// chặn. `activity_log` thì **đã có sẵn đúng ba thứ** một sổ phiên bản cần:
// chỉ-ghi-thêm *(`041`)* · `changes JSONB` · ai/vai/lúc nào.
//
// ⚠️ **NÓI THẲNG GIỚI HẠN:** đây là sổ phiên bản ở **tầng ứng dụng**. Ai ghi
// thẳng vào bảng bằng SQL Editor hay `service_role` sẽ **⛔ không** để lại
// phiên bản. Đầy đủ chỉ có được khi nó nằm trong trigger CSDL — `ADR-027`.
// ============================================================================

/**
 * Ghi **một phiên bản** của chứng từ: cả ảnh chụp TRƯỚC lẫn SAU.
 *
 * 🔑 Chỉ ảnh chụp mới trả lời được *"lúc 14:20 ngày 3/8, chứng từ này trông
 * như thế nào?"* — câu người ta hỏi khi tranh chấp với khách.
 *
 * @param truoc `null` khi là bản ghi MỚI.
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
    const g = await nguoiThaoTac();
    if (!g) return;

    // 🔴 **CHỈ ĐẾM DÒNG CÓ MANG PHIÊN BẢN** — sửa 08/08/2026 sau UAT vòng đời.
    //
    // ⚠️ Bản trước đếm **MỌI** dòng `activity_log` của chứng từ. Nhưng sổ này
    // dùng chung: `writeAudit` cũng ghi vào đây *(ví dụ `createChangeRequest`
    // ghi một dòng trên chính `ORDER` đó)*. Hậu quả đo được: chuỗi phiên bản
    // của một PO ra **1 → 2 → 4 → 5** — nhảy cóc.
    //
    // 🔑 Số phiên bản nhảy cóc ⛔ không mất dữ liệu, nhưng nó **phá niềm tin**:
    // người mở sổ thấy thiếu *"phiên bản 3"* sẽ đi tìm thứ ⛔ chưa bao giờ tồn
    // tại, rồi ngờ hệ thống giấu bớt lịch sử.
    //
    // ⚠️ `changes->__phien_ban` — lọc theo KHOÁ JSONB. Dòng kiểu cũ và dòng
    // `writeAudit` đều ⛔ không có khoá này nên tự động nằm ngoài phép đếm.
    const { count } = await g.sb
      .from('activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .not(`changes->${KHOA_PHIEN_BAN}`, 'is', null);

    const soCu = typeof count === 'number' ? count : 0;

    const changes: Record<string, { from: unknown; to: unknown }> = {
      ...diffRecords(truoc ?? {}, sau ?? {}),
      [KHOA_PHIEN_BAN]: { from: soCu, to: soCu + 1 },
      [KHOA_ANH_CHUP]: { from: truoc, to: sau },
    };

    const { error } = await g.sb.from('activity_log').insert({
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
