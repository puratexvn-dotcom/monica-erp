'use client';

// Xem ghi chú ở app/login/form.tsx: React 18 dùng useFormState, không phải
// useActionState của React 19.
import { useFormState, useFormStatus } from 'react-dom';
import { AlertTriangle, Check, Loader2, ShieldCheck } from 'lucide-react';

import PasswordInput from '@/components/password-input';
import { updatePasswordAction, type UpdatePasswordState } from './actions';

const RULES = [
  'Tối thiểu 10 ký tự',
  'Có chữ thường và chữ HOA',
  'Có ít nhất một chữ số',
  'Có ít nhất một ký tự đặc biệt (@, #, !...)',
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-indigo-600 text-base font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Đang cập nhật...
        </>
      ) : (
        <>
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          Đặt mật khẩu mới
        </>
      )}
    </button>
  );
}

export default function UpdatePasswordForm() {
  const [state, formAction] = useFormState<UpdatePasswordState, FormData>(
    updatePasswordAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <PasswordInput
        name="password"
        label="Mật khẩu mới"
        autoComplete="new-password"
        placeholder="Nhập mật khẩu mới"
      />

      <PasswordInput
        name="confirm"
        label="Nhập lại mật khẩu mới"
        autoComplete="new-password"
        placeholder="Nhập lại để xác nhận"
      />

      <ul className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
        {RULES.map((r) => (
          <li key={r} className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Check className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            {r}
          </li>
        ))}
      </ul>

      <SubmitButton />
    </form>
  );
}
