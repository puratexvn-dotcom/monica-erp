'use client';

import { LANGUAGES, useLanguage } from '@/lib/i18n';

// ============================================================================
// BỘ CHỌN NGÔN NGỮ — VN · EN · CN
//
// ⚠️ NÓI THẲNG VỀ PHẠM VI TÁC DỤNG HIỆN NAY
// Bộ chọn này ĐANG THẬT SỰ đổi ngôn ngữ cho những phần đã nối vào từ điển
// (lib/i18n.tsx) và ghi nhớ lựa chọn qua localStorage. Nhưng phần lớn giao diện
// hiện còn viết thẳng tiếng Việt trong mã, nên bấm EN hay CN sẽ chưa thấy đổi
// nhiều — đúng như chiến lược "biên giới mới" đã chốt: mã MỚI đi qua từ điển,
// mã cũ giữ nguyên để không phải đập đi xây lại.
//
// Đặt nút ở đây từ bây giờ là có chủ ý: nó cho người dùng thấy hướng đi và cho
// mã mới một chỗ để cắm vào. Nhưng nếu bấm mà tưởng cả hệ thống sẽ đổi thì đó
// là kỳ vọng sai — vì vậy nút có tooltip nói rõ trạng thái.
// ============================================================================

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Chọn ngôn ngữ"
      className={`flex shrink-0 items-center gap-0.5 rounded-xl border border-slate-200 bg-white/80 p-0.5 shadow-sm ${className}`}
    >
      {LANGUAGES.map((l) => {
        const on = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={on}
            title={`${l.title} — hiện mới áp dụng cho phần đã nối từ điển`}
            className={`flex touch-manipulation items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-bold leading-none transition sm:px-2 sm:py-1.5 ${
              on
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {/* Emoji quốc kỳ: không cần tải thêm tệp ảnh nào, và tự đổi theo
                phông hệ điều hành. Windows không vẽ được cờ dạng emoji nên ở đó
                sẽ hiện hai chữ cái mã vùng — vẫn đọc được, không vỡ layout. */}
            <span aria-hidden="true" className="text-sm leading-none">{l.flag}</span>
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
