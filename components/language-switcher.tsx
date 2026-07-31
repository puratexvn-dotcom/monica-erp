'use client';

import type { ElementType } from 'react';

import { FlagVN, FlagEN, FlagCN } from '@/components/flag-icons';
import { LANGUAGES, useLanguage, type Language } from '@/lib/i18n';

// ============================================================================
// BỘ CHỌN NGÔN NGỮ — VN · EN · CN
//
// Quốc kỳ vẽ bằng SVG nội tuyến chứ KHÔNG dùng emoji: Windows không có sẵn hình
// cờ trong phông hệ thống nên emoji rơi về hai chữ cái mã vùng. Xem chú thích
// đầy đủ ở components/flag-icons.tsx.
//
// ⚠️ PHẠM VI TÁC DỤNG HIỆN NAY: bộ chọn ĐANG thật sự đổi ngôn ngữ cho phần đã
// nối vào từ điển (lib/i18n.tsx) và ghi nhớ lựa chọn qua localStorage. Nhưng
// phần lớn giao diện còn viết thẳng tiếng Việt trong mã, nên bấm EN hay CN sẽ
// chưa thấy đổi nhiều — đúng chiến lược "biên giới mới" đã chốt. Tooltip nói rõ
// điều đó thay vì để người dùng bấm rồi tưởng nút hỏng.
// ============================================================================

const FLAG: Record<Language, ElementType> = {
  VN: FlagVN,
  EN: FlagEN,
  CN: FlagCN,
};

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Chọn ngôn ngữ"
      className={`flex shrink-0 items-center gap-0.5 rounded-xl border border-slate-200 bg-white/80 p-0.5 shadow-sm ${className}`}
    >
      {LANGUAGES.map((l) => {
        const Flag = FLAG[l.code];
        const on = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={on}
            title={`${l.title} — hiện mới áp dụng cho phần đã nối từ điển`}
            className={`flex touch-manipulation items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-[11px] font-bold leading-none transition sm:px-2 ${
              on
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Flag className="h-3.5 w-5" />
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
