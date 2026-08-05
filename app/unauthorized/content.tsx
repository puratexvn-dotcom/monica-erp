'use client';

import Link from 'next/link';
import { ArrowLeft, LogOut } from 'lucide-react';

import { useLanguage } from '@/lib/i18n';
import { TYPE } from '@/lib/design/typography';
import { STATUS } from '@/lib/design/tokens';

// ============================================================================
// NỘI DUNG TRANG 403 — `UI-1.4` *(phần dư)*
//
// Cùng lý do với `login/intro.tsx`: `page.tsx` là Server Component *(nó đọc
// `searchParams` và phiên)* nên ⛔ không gọi được `useLanguage()`.
//
// ─── ⚠️ NHÃN VAI TRÒ ⛔ KHÔNG DỊCH Ở ĐÂY ────────────────────────────────
// `ROLE_LABEL[role]` do **server** tra và truyền xuống dạng chuỗi. Đó là **tên
// chức danh trong hồ sơ nhân sự** — dịch nó sẽ làm người dùng ⛔ không đối chiếu
// được với quyết định phân quyền mà Quản trị hệ thống đã cấp.
//
// Hiến pháp Điều 45 cấm **dịch dữ liệu nghiệp vụ**; đây đúng là trường hợp đó.
// ============================================================================

export default function ForbiddenContent({
  from,
  home,
  roleLabel,
}: {
  /** Đường dẫn người dùng vừa cố mở. */
  from?: string;
  /** `ROLE_HOME[role]` — nơi đưa họ về. */
  home: string;
  /** Nhãn vai đã tra sẵn ở server. `null` khi ⛔ chưa gán vai. */
  roleLabel: string | null;
}) {
  const { t } = useLanguage();

  return (
    <>
      <p className={`${TYPE.overline} ${STATUS.critical.text} mb-2`}>{t('forbidden.eyebrow')}</p>
      <h1 className={`${TYPE.pageTitle} text-slate-900`}>{t('forbidden.title')}</h1>

      <p className={`${TYPE.bodyLg} mt-4 text-slate-600`}>
        {from ? (
          <>
            {t('forbidden.pathLabel')}{' '}
            {/* `<code>` giữ nguyên đường dẫn — nó là DỮ LIỆU, ⛔ không phải câu chữ. */}
            <code className={`${TYPE.code ?? ''} rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800`}>
              {from}
            </code>{' '}
            {t('forbidden.bodyWithPath')}
          </>
        ) : (
          t('forbidden.bodyNoPath')
        )}{' '}
        {t('forbidden.contact')}
      </p>

      {roleLabel && (
        <p
          className={`${TYPE.label} mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-600`}
        >
          {t('forbidden.signedInAs')}
          <span className="text-slate-900">{roleLabel}</span>
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={home}
          className={`${TYPE.label} inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2`}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          {t('forbidden.backToMine')}
        </Link>

        {/* ⚠️ `<form method="post">` — ⛔ KHÔNG phải `<Link>`. Đăng xuất là một
            thao tác ĐỔI TRẠNG THÁI; đặt nó sau một `GET` thì trình duyệt hoặc
            trình quét liên kết có thể tự gọi và đá người dùng ra ngoài. */}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className={`${TYPE.label} inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2`}
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            {t('nav.signOut')}
          </button>
        </form>
      </div>
    </>
  );
}
