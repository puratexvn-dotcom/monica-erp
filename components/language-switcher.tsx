'use client';

import { useEffect, useRef, useState, type ElementType } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { FlagVN, FlagEN, FlagCN } from '@/components/flag-icons';
import { LANGUAGES, useLanguage, type Language } from '@/lib/i18n';

// ============================================================================
// BỘ CHỌN NGÔN NGỮ — **MỘT DROPDOWN**, ⛔ KHÔNG CÒN BA NÚT NẰM CẠNH NHAU
//
// 📐 Board Directive *GLOBAL SEARCH + LANGUAGE MENU* 08/08/2026 §9:
//   > *"Language selector hiện tại `VN | EN | CN` phải chuyển thành **một
//   > dropdown duy nhất**… Ngôn ngữ hiện tại phải được **highlight**. ⛔ Không
//   > hiển thị cả 4 ngôn ngữ cùng lúc trên Header. Dropdown phải **đóng khi
//   > click ra ngoài**. **Esc** cũng đóng."*
//
// 🔑 Lý do thật của thay đổi này ⛔ không phải thẩm mỹ: ba nút cạnh nhau chiếm
// chỗ **tuyến tính theo số ngôn ngữ**. Thêm ngôn ngữ thứ tư là thanh đầu trang
// hết chỗ ở khổ điện thoại — và chỗ đó đang thuộc về **Lời Chúa**.
//
// ═══ ⚠️ TIẾNG HÀN — VÌ SAO ⛔ CHƯA CÓ TRONG DANH SÁCH NÀY ════════════════
// Board §9 yêu cầu *"Bổ sung Korean"*. Tôi **⛔ chưa thi hành**, và đây là lý
// do — ⛔ không phải bỏ sót:
//
//   🔴 `Hiến pháp Điều 45.2` khai **đúng BA ngôn ngữ chính thức**, *"all three
//      hold equal constitutional status"*. Thêm ngôn ngữ thứ tư là **sửa Hiến
//      pháp** — bậc 1 trong thứ bậc văn bản. CLAUDE.md §0: *"Yêu cầu mâu thuẫn
//      với Hiến pháp ⇒ DỪNG · GIẢI THÍCH · ⛔ KHÔNG thi hành · xin ADR trước."*
//
//   🔴 `Điều 45.4`: *"⛔ No screen shall present more than one language at a
//      time."* Bày lá cờ Hàn mà ⛔ không có tệp `messages/ko.json` thì bấm vào
//      sẽ ra một màn hình **tiếng Việt lẫn tiếng Anh dưới nhãn tiếng Hàn** —
//      vi phạm thẳng khoản đó, và tệ hơn một nút ⛔ chưa có.
//
//   ⇒ Việc cần làm là **thật**, ⛔ không phải một dòng trong mảng dưới đây:
//      thêm `messages/ko.json` *(đủ bộ khoá)* · nhánh `KR` cho `MD_DICT` và
//      `WAREHOUSE_DICT` · sửa `Điều 45.2`. Đã ghi thành **ADR-028** trình
//      Board. Duyệt xong là mảng này thêm đúng một dòng.
//
// ⚠️ Quốc kỳ vẽ bằng SVG nội tuyến chứ ⛔ KHÔNG dùng emoji: Windows ⛔ không có
// hình cờ trong phông hệ thống nên emoji rơi về hai chữ cái mã vùng.
// ============================================================================

const FLAG: Record<Language, ElementType> = {
  VN: FlagVN,
  EN: FlagEN,
  CN: FlagCN,
};

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const [mo, setMo] = useState(false);
  const boc = useRef<HTMLDivElement>(null);

  const hienTai = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const FlagNow = FLAG[hienTai.code];

  // Bấm ra ngoài ⇒ đóng — Board §9.
  useEffect(() => {
    if (!mo) return;
    const f = (e: MouseEvent) => {
      if (boc.current && !boc.current.contains(e.target as Node)) setMo(false);
    };
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, [mo]);

  // `Esc` ⇒ đóng — Board §9 + §15 *(keyboard accessible)*.
  // ⚠️ Chỉ gắn **khi đang mở**: một trình nghe `Escape` thường trực trên mọi
  // trang là thứ sẽ nuốt phím Esc của hộp thoại khác mà ⛔ không ai truy ra.
  useEffect(() => {
    if (!mo) return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setMo(false); };
    document.addEventListener('keydown', f);
    return () => document.removeEventListener('keydown', f);
  }, [mo]);

  return (
    <div ref={boc} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={mo}
        aria-label={`Ngôn ngữ: ${hienTai.title}`}
        title={`${hienTai.title} — hiện mới áp dụng cho phần đã nối từ điển`}
        className="flex h-11 touch-manipulation items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <FlagNow className="h-3.5 w-5" />
        <span>{hienTai.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${mo ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {mo && (
        <ul
          role="listbox"
          aria-label="Chọn ngôn ngữ"
          className="absolute right-0 z-50 mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        >
          {LANGUAGES.map((l) => {
            const Flag = FLAG[l.code];
            const on = lang === l.code;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => { setLang(l.code); setMo(false); }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition ${
                    on ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Flag className="h-3.5 w-5 shrink-0" />
                  <span className="flex-1">{l.title}</span>
                  {/* Ngôn ngữ đang dùng đánh dấu bằng **dấu ✓ VÀ nền**, ⛔
                      không chỉ bằng màu — Hiến pháp §44: trạng thái luôn phải
                      có icon + chữ, ⛔ không phân biệt bằng màu đơn thuần. */}
                  {on && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
