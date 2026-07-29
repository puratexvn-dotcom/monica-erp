'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';
import { isRole, ROLE_HOME } from '@/lib/rbac';

export interface UpdatePasswordState {
  error?: string;
}

/** Yêu cầu tối thiểu — trả về thông báo cụ thể thay vì một câu chung chung,
 *  để người dùng biết chính xác còn thiếu gì.
 *
 *  KHÔNG export: file này có 'use server', mà mọi export trong file server
 *  action bắt buộc phải là hàm async — export hàm đồng bộ sẽ chết lúc build. */
function validatePassword(pw: string): string | null {
  if (pw.length < 10) return 'Mật khẩu phải dài tối thiểu 10 ký tự.';
  if (!/[a-z]/.test(pw)) return 'Mật khẩu phải có ít nhất một chữ thường.';
  if (!/[A-Z]/.test(pw)) return 'Mật khẩu phải có ít nhất một chữ HOA.';
  if (!/[0-9]/.test(pw)) return 'Mật khẩu phải có ít nhất một chữ số.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Mật khẩu phải có ít nhất một ký tự đặc biệt (@, #, !...).';
  return null;
}

/** Chặn đặt lại đúng mật khẩu mặc định — nếu không thì bước ép đổi mật khẩu
 *  chỉ là hình thức. So sánh không phân biệt hoa thường. */
const FORBIDDEN = ['monica@2026', 'monica123'];

export async function updatePasswordAction(
  _prev: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!password || !confirm) return { error: 'Vui lòng nhập đầy đủ hai ô mật khẩu.' };
  if (password !== confirm) return { error: 'Hai lần nhập mật khẩu không khớp.' };

  const weak = validatePassword(password);
  if (weak) return { error: weak };

  if (FORBIDDEN.includes(password.toLowerCase())) {
    return { error: 'Không được đặt lại đúng mật khẩu mặc định. Vui lòng chọn mật khẩu khác.' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Một lời gọi làm hai việc: đổi mật khẩu VÀ hạ cờ bắt buộc đổi.
  // Gộp lại để không có trạng thái nửa vời — nếu tách đôi, đổi mật khẩu xong
  // mà hạ cờ lỗi thì người dùng bị kẹt vòng lặp ép đổi mãi không thoát.
  const { error } = await supabase.auth.updateUser({
    password,
    data: { force_password_change: false, password_changed_at: new Date().toISOString() },
  });

  if (error) {
    // Supabase từ chối nếu mật khẩu mới trùng mật khẩu cũ
    if (error.message.toLowerCase().includes('should be different')) {
      return { error: 'Mật khẩu mới phải khác mật khẩu hiện tại.' };
    }
    return { error: `Không đổi được mật khẩu: ${error.message}` };
  }

  const role = isRole(user.app_metadata?.role) ? user.app_metadata.role : null;
  redirect(role ? ROLE_HOME[role] : '/');
}
