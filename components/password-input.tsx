'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

/**
 * Ô nhập mật khẩu có nút bật/tắt hiển thị.
 *
 * Vài chi tiết dễ bị bỏ sót nhưng quan trọng:
 *  • Nút dùng type="button" — nếu để mặc định là "submit" thì bấm con mắt sẽ
 *    gửi luôn cả form.
 *  • aria-pressed + aria-label đổi theo trạng thái để trình đọc màn hình
 *    thông báo đúng, thay vì đọc trơ một cái nút không rõ nghĩa.
 *  • tabIndex={-1} để phím Tab đi thẳng từ ô mật khẩu sang nút đăng nhập,
 *    không vướng vào con mắt giữa chừng.
 */
export default function PasswordInput({
  name,
  label,
  placeholder = '••••••••••',
  autoComplete = 'current-password',
  required = true,
  hint,
  defaultVisible = false,
}: {
  name: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  defaultVisible?: boolean;
}) {
  const [visible, setVisible] = useState(defaultVisible);
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>

        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-describedby={hint ? hintId : undefined}
          className="h-14 w-full rounded-xl border border-slate-200 bg-white/80 pl-12 pr-14 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {hint && (
        <p id={hintId} className="mt-2 text-sm text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}
