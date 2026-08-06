'use client';

// useFormState (KHÔNG phải useActionState): dự án chạy React 18 + Next 14.
// useActionState là API của React 19 — import vào chỉ nhận cảnh báo lúc build
// rồi chết ở runtime vì giá trị là undefined.
import { useFormState, useFormStatus } from 'react-dom';
import { AlertTriangle, ArrowRight, Loader2, Mail } from 'lucide-react';

import PasswordInput from '@/components/password-input';
import { useLanguage } from '@/lib/i18n';
import { loginAction, type LoginState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLanguage();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          {t('login.signingIn')}
        </>
      ) : (
        <>
          {t('login.signIn')}
          <ArrowRight
            className="h-5 w-5 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </>
      )}
    </button>
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState<LoginState, FormData>(loginAction, {});
  const { t } = useLanguage();

  return (
    <form action={formAction} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="login-email" className="mb-2 block text-sm font-bold text-slate-700">
          {t('login.email')}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            id="login-email"
            name="email"
            // 🔴 `type="text"`, ⛔ KHÔNG `type="email"`.
            // Trình duyệt tự chặn `md001` vì ⛔ không có `@` — người dùng bấm
            // Đăng nhập mà **⛔ không có gì xảy ra**, và ⛔ không thông điệp nào
            // của ta hiện ra để giải thích. Phép hợp lệ hoá nay nằm ở
            // `lib/dinh-danh.ts`, ⛔ không nằm ở trình duyệt.
            type="text"
            required
            // ⚠️ ⛔ KHÔNG viết hoa tự động trên điện thoại: `Md001` ⛔ không
            // phải tên tài khoản, và tổ trưởng nhập ở xưởng bằng điện thoại.
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
            autoFocus
            placeholder={t('login.emailPlaceholder')}
            className="h-14 w-full rounded-xl border border-slate-200 bg-white/80 pl-12 pr-4 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <PasswordInput name="password" label={t('login.password')} autoComplete="current-password" />

      <SubmitButton />
    </form>
  );
}
