'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

import { useLanguage } from '@/lib/i18n';
import { TYPE } from '@/lib/design/typography';
import { STATUS } from '@/lib/design/tokens';

// ============================================================================
// TIÊU ĐỀ · CẢNH BÁO · LỐI VỀ CỦA THẺ ĐĂNG NHẬP — `UI-1.4`
//
// Cùng lý do với `intro.tsx`: `page.tsx` là Server Component nên ⛔ không gọi
// được `useLanguage()`. Phần chữ nằm ở đây.
//
// ─── ⚠️ MÃ LỖI ĐI QUA RANH GIỚI, ⛔ KHÔNG PHẢI CÂU CHỮ ──────────────────
// `page.tsx` đọc `?error=` rồi truyền **mã** *(`'config'` · `'unreachable'`)*
// xuống đây; câu chữ tra ở client. Trước bản này `page.tsx` tự dựng sẵn câu
// tiếng Việt — nghĩa là người dùng chọn tiếng Anh vẫn nhận thông báo lỗi tiếng
// Việt, đúng lúc họ cần hiểu nhất.
// ============================================================================

export type LoginErrorCode = 'config' | 'unreachable' | null;

export function LoginHeading() {
  const { t } = useLanguage();
  return (
    <div className="mb-7">
      <h2 className={`${TYPE.pageTitle} text-slate-900`}>{t('login.heading')}</h2>
      <p className={`${TYPE.bodySm} mt-2 text-slate-500`}>{t('login.headingHint')}</p>
    </div>
  );
}

export function LoginErrorNotice({ code }: { code: LoginErrorCode }) {
  const { t } = useLanguage();
  if (!code) return null;
  return (
    <p
      role="alert"
      className={`${TYPE.label} ${STATUS.warning.chip} mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3 ring-1`}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      {code === 'config' ? t('login.errorConfig') : t('login.errorUnreachable')}
    </p>
  );
}

export function LoginFooterLinks() {
  const { t } = useLanguage();
  return (
    <>
      {/* Cao 44px — ngưỡng vùng chạm tối thiểu. Có vòng focus riêng: đi bằng
          Tab tới đây vẫn thấy rõ mình đang ở đâu. */}
      <Link
        href="/"
        className={`${TYPE.label} mt-6 flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t('login.backToHome')}
      </Link>

      <p className={`${TYPE.caption} mt-6 border-t border-slate-200 pt-5 text-center text-slate-500`}>
        {t('login.contactAdmin')} —{' '}
        <a
          href="tel:0908779585"
          className="underline-offset-4 transition hover:underline"
        >
          0908 779 585
        </a>
      </p>
    </>
  );
}
