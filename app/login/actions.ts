'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';
import { isProtectedPath, isRole, ROLE_HOME } from '@/lib/rbac';
import { emailTuTenDangNhap } from '@/lib/dinh-danh';

export interface LoginState {
  error?: string;
}

/**
 * Chỉ nhận đường dẫn nội bộ làm nơi quay lại sau đăng nhập.
 *
 * Nếu nhận bừa giá trị ?next= thì kẻ tấn công gửi link
 * /login?next=https://trang-gia-mao... — đăng nhập xong người dùng bị đá
 * sang trang giả mạo mà vẫn tin là luồng của hệ thống (open redirect).
 * Vì vậy: bắt buộc bắt đầu bằng '/' và không được bắt đầu bằng '//'.
 */
function safeNext(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith('/') || next.startsWith('//')) return null;
  return isProtectedPath(next) ? next : null;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // 🔴 07/08/2026 — NGƯỜI DÙNG GÕ **TÊN TÀI KHOẢN**, ⛔ KHÔNG GÕ EMAIL.
  // Board: *"đổi tất cả thông tin đăng nhập thành md001, md002, kho001… ⛔
  // không cần @monica.vn"*. Supabase Auth vẫn định danh bằng email, nên phép
  // ghép nằm ở `lib/dinh-danh.ts` — **một chỗ duy nhất**, dùng chung với
  // script seed và bài kiểm.
  const nhapVao = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next') ? String(formData.get('next')) : null);

  if (!nhapVao || !password) {
    return { error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' };
  }

  const email = emailTuTenDangNhap(nhapVao);

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Cố ý KHÔNG nói rõ là sai tên đăng nhập hay sai mật khẩu: phân biệt hai
    // trường hợp giúp kẻ tấn công dò ra tài khoản nào có thật trong hệ thống.
    return { error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
  }

  const user = data.user;

  // Lần đầu đăng nhập -> đi thẳng sang đổi mật khẩu, bỏ qua mọi ?next=
  if (user.user_metadata?.force_password_change === true) {
    redirect('/update-password');
  }

  const role = isRole(user.app_metadata?.role) ? user.app_metadata.role : null;

  if (!role) {
    // Tài khoản có thật nhưng chưa gán vai trò: cho vào cũng không dùng được
    // gì, mà lại lọt qua chốt chặn. Đóng phiên luôn cho sạch.
    await supabase.auth.signOut();
    return {
      error: 'Tài khoản chưa được phân quyền phòng ban. Vui lòng liên hệ Quản trị hệ thống.',
    };
  }

  redirect(next ?? ROLE_HOME[role]);
}
