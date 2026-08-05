import 'server-only';

import { createClient } from '@/utils/supabase/server';
import { isRole, type Role } from '@/lib/rbac';

// ============================================================================
// PHIÊN ĐĂNG NHẬP — MỘT NGUỒN DUY NHẤT CHO TẦNG GIAO DIỆN · `UI-1.1`
//
// ─── VÌ SAO TỆP NÀY TỒN TẠI ──────────────────────────────────────────────
// Trước bản này, mỗi nơi cần biết *"ai đang đăng nhập"* tự gọi
// `supabase.auth.getUser()` rồi tự đọc `app_metadata.role`. Mỗi chỗ chép tay là
// một chỗ có thể chép sai — và **chép sai ở đây là leo thang đặc quyền**, ⛔
// không phải một lỗi hiển thị.
//
// ─── HAI QUY TẮC ⛔ KHÔNG ĐƯỢC PHÁ ───────────────────────────────────────
//
// ① **`getUser()`, ⛔ KHÔNG BAO GIỜ `getSession()`.**
//    `getSession()` chỉ đọc cookie, mà cookie giả mạo được. `getUser()` xác
//    thực token với máy chủ Supabase.
//
// ② **Vai đọc từ `app_metadata`, ⛔ KHÔNG BAO GIỜ `user_metadata`.**
//    `user_metadata` là chỗ **người dùng tự ghi đè được**. Dùng nó làm căn cứ
//    phân quyền là tự mở cửa cho leo thang đặc quyền.
//
// ⚠️ Hai quy tắc này lặp lại nguyên văn `middleware.ts`. Đó là **cố ý**: khi
// hai tầng cùng phán một câu, chúng phải phán **giống hệt nhau**.
//
// ─── TỆP NÀY ⛔ KHÔNG PHẢI HÀNG RÀO ──────────────────────────────────────
// Nó phục vụ **giao diện** — quyết định *bày cái gì ra màn hình*. Hàng rào
// thật vẫn là `middleware.ts` *(điều hướng)*, `guard.ts` *(mỗi Server Action)*
// và **RLS** *(CSDL)*. Đọc sai ở đây làm giao diện sai; nó ⛔ **không** mở được
// dữ liệu nào.
// ============================================================================

export interface SessionUser {
  id: string;
  email: string | null;
  /** `null` = tài khoản có thật nhưng **chưa được gán vai**. */
  role: Role | null;
  /** Còn cờ ép đổi mật khẩu lần đầu. */
  mustChangePassword: boolean;
}

/**
 * Người đang đăng nhập, hoặc `null`.
 *
 * ⚠️ **Lỗi mạng ⇒ trả `null`**, tức coi như **chưa đăng nhập** — cùng hướng an
 * toàn với `middleware.ts`. Ném lỗi ở đây sẽ làm cả trang chủ trả 500 mỗi lần
 * Supabase quá tải.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    const u = data.user;
    return {
      id: u.id,
      email: u.email ?? null,
      role: isRole(u.app_metadata?.role) ? u.app_metadata.role : null,
      mustChangePassword: u.user_metadata?.force_password_change === true,
    };
  } catch {
    // ⛔ Không ghi log ở đây: hàm này chạy trên MỌI lần dựng trang chủ, và một
    // sự cố Supabase kéo dài sẽ làm ngập nhật ký. `middleware.ts` đã ghi rồi.
    return null;
  }
}
