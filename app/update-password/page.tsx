import { redirect } from 'next/navigation';
import { KeyRound, LogOut } from 'lucide-react';

import { createClient } from '@/utils/supabase/server';
import { isRole, ROLE_LABEL } from '@/lib/rbac';
import { AuthBackdrop, AuthLogo } from '@/components/auth/auth-backdrop';
import UpdatePasswordForm from './form';

export const dynamic = 'force-dynamic';

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware đã chặn từ trước, đây là lớp phòng thủ thứ hai phòng khi
  // matcher của middleware bị sửa sót về sau.
  if (!user) redirect('/login');

  const role = isRole(user.app_metadata?.role) ? user.app_metadata.role : null;
  const forced = user.user_metadata?.force_password_change === true;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-12">
      {/* Nền trang trí — dùng chung với `/login` (`UI-1.3`) */}
      <AuthBackdrop />

      <div className="relative w-full max-w-lg rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mb-8 text-center">
          <AuthLogo className="mb-7" />

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <KeyRound className="h-7 w-7" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {forced ? 'Bắt buộc đổi mật khẩu' : 'Đổi mật khẩu'}
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-slate-600">
            {forced
              ? 'Đây là lần đăng nhập đầu tiên của bạn. Vui lòng đặt mật khẩu riêng trước khi vào hệ thống — mật khẩu mặc định do quản trị cấp không còn an toàn sau khi đã được chuyển qua email hoặc tin nhắn.'
              : 'Đặt mật khẩu mới cho tài khoản của bạn.'}
          </p>

          {role && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600">
              {user.email}
              <span className="text-slate-300">·</span>
              <span className="font-bold text-slate-900">{ROLE_LABEL[role]}</span>
            </p>
          )}
        </div>

        <UpdatePasswordForm />

        <form action="/auth/signout" method="post" className="mt-6 text-center">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Đăng xuất và quay lại sau
          </button>
        </form>
      </div>
    </main>
  );
}
