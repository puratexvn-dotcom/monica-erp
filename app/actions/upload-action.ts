'use server';

import { createClient } from '@/utils/supabase/server';
import { isRole } from '@/lib/rbac';
import { ngayVN } from '@/lib/time';
import {
  MIME_BANG_CHUNG, GIOI_HAN_BYTE, DUOI_THEO_MIME, laMimeHopLe, loiSaiDinhDang,
  type MimeBangChung,
} from '@/lib/mos/evidence/mime';

// ============================================================================
// UPLOAD ẢNH BẰNG CHỨNG LÊN SUPABASE STORAGE
//
// Nhận File từ client qua FormData rồi đẩy lên bucket `evidences`
// (xem supabase/migrations/013_storage_evidences.sql).
//
// ─── VÌ SAO ĐI QUA SERVER ACTION MÀ KHÔNG UPLOAD TRỰC TIẾP ───────────────
// Client hoàn toàn có thể gọi supabase.storage.from(...).upload() từ trình
// duyệt. Nhưng đi qua đây được ba thứ mà client không tự làm được đáng tin:
//   1. Kiểm tra ĐĂNG NHẬP + VAI TRÒ trước khi cho ghi.
//   2. Ép lại kiểu MIME và kích thước ở phía máy chủ. Kiểm ở client chỉ để
//      phản hồi nhanh; ai cũng gọi thẳng API bỏ qua được.
//   3. Tự đặt tên tệp theo quy ước, không tin tên tệp do client gửi lên
//      (tên tệp là dữ liệu người dùng, có thể chứa ../ hoặc ký tự lạ).
//
// ─── GIỚI HẠN CẦN BIẾT ───────────────────────────────────────────────────
// Server Action của Next.js mặc định chỉ nhận body tối đa 1 MB. Ảnh điện thoại
// thường 2–5 MB nên PHẢI nâng serverActions.bodySizeLimit trong next.config.mjs
// — đã nâng lên 10mb. Không nâng thì upload lỗi "Body exceeded 1 MB limit" mà
// thông báo không nói gì về ảnh.
// ============================================================================

export interface UploadResult {
  ok: boolean;
  /** Đường dẫn công khai để nhúng vào <img>, chỉ có khi ok = true */
  url?: string;
  /** Đường dẫn trong bucket — lưu vào DB thì lưu cái này, không lưu URL đầy đủ */
  path?: string;
  message: string;
}

// 🔴 **ALLOWLIST NAY LẤY TỪ MỘT NGUỒN DUY NHẤT** — Board 08/08/2026 §1.
//
// ⚠️ Trước bản này, tệp NÀY tự giữ một allowlist, và `storage.buckets` giữ một
// cái khác. Ngày 06/08 Board yêu cầu nhận PDF; chỗ này được sửa, bucket thì ⛔
// không — nên PDF **chọn được trên màn hình rồi bị Supabase từ chối**.
// Lý do đầy đủ ở `lib/mos/evidence/mime.ts`.

/**
 * Đẩy một ảnh lên bucket `evidences`.
 *
 * @param formData phải chứa khoá 'file'; khoá 'folder' là tuỳ chọn để phân
 *                 nhóm theo phân hệ (vd 'cutting', 'sewing').
 */
export async function uploadEvidence(formData: FormData): Promise<UploadResult> {
  // ── 1. Xác thực ───────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' };
  }

  const role = user.app_metadata?.role;
  if (!isRole(role)) {
    return { ok: false, message: 'Tài khoản chưa được phân quyền nên không thể tải ảnh lên.' };
  }

  // ── 2. Kiểm tra tệp ───────────────────────────────────────────────────────
  const raw = formData.get('file');
  if (!(raw instanceof File) || raw.size === 0) {
    return { ok: false, message: 'Không nhận được tệp ảnh.' };
  }

  if (!laMimeHopLe(raw.type)) {
    return {
      ok: false,
      message: loiSaiDinhDang(raw.type),
    };
  }

  if (raw.size > GIOI_HAN_BYTE) {
    return {
      ok: false,
      message: `Tệp ${(raw.size / 1024 / 1024).toFixed(1)} MB vượt giới hạn ${GIOI_HAN_BYTE / 1024 / 1024} MB.`,
    };
  }

  // ── 3. Đặt tên tệp theo quy ước của máy chủ ──────────────────────────────
  // Cấu trúc: <folder>/<userId>/<ngayVN>/<uuid>.<ext>
  // Gắn userId vào đường dẫn để về sau siết policy theo chủ sở hữu được dễ,
  // và để truy ai đã tải ảnh nào mà không cần bảng phụ.
  const folderRaw = formData.get('folder');
  // Chỉ nhận chữ, số, gạch ngang — chặn ../ và mọi ký tự lạ trong đường dẫn
  const folder =
    typeof folderRaw === 'string' && /^[a-z0-9-]{1,32}$/.test(folderRaw) ? folderRaw : 'misc';

  const vnDate = ngayVN();
  const ext = DUOI_THEO_MIME[raw.type as MimeBangChung] ?? 'jpg';
  const path = `${folder}/${user.id}/${vnDate}/${crypto.randomUUID()}.${ext}`;

  // ── 4. Đẩy lên bucket ─────────────────────────────────────────────────────
  const { error: uploadError } = await supabase.storage.from('evidences').upload(path, raw, {
    contentType: raw.type,
    // upsert = false: tên đã là UUID nên không thể trùng; bật upsert chỉ tạo
    // nguy cơ ghi đè ảnh bằng chứng cũ.
    upsert: false,
  });

  if (uploadError) {
    console.error('[upload-action] Storage lỗi:', uploadError);

    const msg = uploadError.message.toLowerCase();
    if (msg.includes('bucket not found')) {
      return {
        ok: false,
        message:
          'Chưa có bucket "evidences" trên Supabase. Hãy chạy migration ' +
          'supabase/migrations/013_storage_evidences.sql rồi thử lại.',
      };
    }
    if (msg.includes('row-level security') || msg.includes('unauthorized')) {
      return {
        ok: false,
        message:
          'Bị chặn bởi RLS của Storage. Kiểm tra policy evidences_authenticated_insert ' +
          'trong migration 013 đã được tạo chưa.',
      };
    }
    return { ok: false, message: `Không tải được ảnh lên: ${uploadError.message}` };
  }

  // ── 5. Lấy đường dẫn công khai ────────────────────────────────────────────
  const {
    data: { publicUrl },
  } = supabase.storage.from('evidences').getPublicUrl(path);

  return {
    ok: true,
    url: publicUrl,
    path,
    message: `Đã tải ảnh lên (${(raw.size / 1024).toFixed(0)} KB).`,
  };
}
