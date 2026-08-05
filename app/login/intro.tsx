'use client';

import { ShieldCheck, Layers, FileCheck2 } from 'lucide-react';

import { useLanguage } from '@/lib/i18n';
import { TYPE } from '@/lib/design/typography';

// ============================================================================
// CỘT GIỚI THIỆU CỦA MÀN HÌNH ĐĂNG NHẬP — `UI-1.4`
//
// ─── VÌ SAO PHẢI TÁCH RA THÀNH COMPONENT PHÍA CLIENT ────────────────────
// `app/login/page.tsx` là **Server Component** *(nó đọc `searchParams`)*, mà
// ngôn ngữ do người dùng chọn và lưu ở `localStorage` — chỉ tồn tại phía trình
// duyệt. Server Component ⛔ **không** gọi được `useLanguage()`.
//
// ⇒ Phần **chữ** chuyển xuống đây. `page.tsx` giữ khung, nền, và việc đọc
// `searchParams`. Đúng khuôn `app/page.tsx` ⟷ `_home/home-content.tsx` đã dùng.
//
// ─── VÌ SAO BA TRỤ CỘT NÀY LẶP LẠI TRANG CHỦ ────────────────────────────
// Trang chủ *(Landing)* và `/login` cùng đứng **trước cánh cửa**, nên chúng
// phải kể **cùng một câu chuyện**. Câu chữ nằm ở `messages/`, ⛔ không chép tay
// hai nơi — sửa một lần, đổi cả hai.
//
// ⚠️ Khoá ở đây là `login.highlight*`; trang chủ dùng `landing.pillar*`. Hai bộ
// khoá **cố ý tách**: cùng nội dung hôm nay, nhưng hai màn hình có thể phân
// hoá về sau, và gộp khoá sẽ khoá chặt chúng vào nhau.
// ============================================================================

const TRU_COT = [
  { icon: Layers, key: 'login.highlightPlatform' },
  { icon: ShieldCheck, key: 'login.highlightWorkspace' },
  { icon: FileCheck2, key: 'login.highlightEvidence' },
] as const;

export default function LoginIntro() {
  const { t } = useLanguage();

  return (
    <>
      <p className={`${TYPE.overline} mb-4 text-slate-500`}>{t('login.eyebrow')}</p>
      <h1 className={`${TYPE.display} text-slate-900`}>{t('login.welcomeBack')}</h1>
      <p className={`${TYPE.bodyLg} mt-5 max-w-lg text-slate-600`}>{t('login.subtitle')}</p>

      <ul className="mt-10 space-y-3.5">
        {TRU_COT.map(({ icon: Icon, key }) => (
          <li key={key} className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-slate-500 shadow-sm backdrop-blur">
              <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
            </span>
            <span className={`${TYPE.label} pt-2.5 text-slate-700`}>{t(key)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
