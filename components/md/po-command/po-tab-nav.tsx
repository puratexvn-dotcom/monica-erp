'use client';

import { useEffect } from 'react';
import {
  Activity, Boxes, Factory, LayoutDashboard, MessageSquare, Ship, ShieldCheck, Wallet,
} from 'lucide-react';

import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import { PO_VIEWS, type PoView } from '@/lib/mos/po-twin.contract';

// ============================================================================
// THANH TÁM LÁT CẮT
//
// ─── VÌ SAO ĐỌC "LÁT CẮT" CHỨ KHÔNG "TAB" ────────────────────────────────
// Luật #4 của bản phê duyệt: tab chỉ là cách bày, không phải miền nghiệp vụ.
// Tên biến giữ đúng chữ `view` để người đọc mã sau này không nhầm chúng là
// ranh giới nghiệp vụ mà đi tách service theo tab.
//
// ─── PHÍM TẮT 1–8 ────────────────────────────────────────────────────────
// Merchandiser ở trong màn hình này hàng chục phút mỗi lần. Chuyển lát cắt bằng
// một phím nhanh hơn hẳn đưa tay ra chuột. CHỈ bắt phím khi con trỏ KHÔNG nằm
// trong ô nhập — nếu không, gõ số 3 vào ô số lượng sẽ nhảy sang tab khác.
//
// ─── LÁT CẮT NÀO HIỆN RA LÀ DO RBAC ──────────────────────────────────────
// Component KHÔNG biết vai trò nào được xem gì; nó chỉ nhận danh sách đã lọc.
// Chính sách nằm ở _services/po-rbac.ts (Điều XIII: không hardcode role).
// ============================================================================

const ICON: Record<PoView, typeof LayoutDashboard> = {
  executive: LayoutDashboard,
  production: Factory,
  material: Boxes,
  quality: ShieldCheck,
  buyer: MessageSquare,
  shipment: Ship,
  activity: Activity,
  finance: Wallet,
};

/** Mỗi lát cắt một sắc — cùng hệ pastel với thanh tab của /md và /kho, để
 *  người dùng không phải học một bảng màu thứ hai. */
const TONE: Record<PoView, { on: string; off: string }> = {
  executive: { on: 'bg-blue-600 text-white shadow-sm', off: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  production: { on: 'bg-emerald-700 text-white shadow-sm', off: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  material: { on: 'bg-emerald-700 text-white shadow-sm', off: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  quality: { on: 'bg-rose-700 text-white shadow-sm', off: 'bg-rose-50 text-rose-800 hover:bg-rose-100' },
  buyer: { on: 'bg-purple-600 text-white shadow-sm', off: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  shipment: { on: 'bg-blue-600 text-white shadow-sm', off: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  activity: { on: 'bg-slate-700 text-white shadow-sm', off: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
  finance: { on: 'bg-amber-600 text-white shadow-sm', off: 'bg-amber-50 text-amber-900 hover:bg-amber-100' },
};

export default function PoTabNav({
  views,
  active,
  onChange,
}: {
  /** Đã lọc theo quyền — component không tự quyết định ai xem được gì */
  views: readonly PoView[];
  active: PoView;
  onChange: (v: PoView) => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement;
      // Đang gõ trong ô nhập thì phím số là DỮ LIỆU, không phải lệnh.
      if (el instanceof HTMLElement) {
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return;
      }
      const idx = Number(e.key) - 1;
      if (!Number.isInteger(idx) || idx < 0 || idx >= views.length) return;
      e.preventDefault();
      onChange(views[idx]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [views, onChange]);

  return (
    <nav
      aria-label={t('po_views')}
      className="sticky top-[4.5rem] z-10 border-b border-slate-200 bg-white/95 backdrop-blur"
    >
      {/* overflow-x-auto trên CHÍNH thanh: tám lát cắt không vừa màn 360px, và
          thân trang tuyệt đối không được cuộn ngang (chuẩn UI_UX_STANDARDS). */}
      <div
        role="tablist"
        className="mx-auto flex max-w-[110rem] gap-1.5 overflow-x-auto px-4 py-2 sm:px-6"
      >
        {PO_VIEWS.filter((v) => views.includes(v)).map((v) => {
          const on = v === active;
          const Icon = ICON[v];
          const pos = views.indexOf(v) + 1;
          return (
            <button
              key={v}
              role="tab"
              aria-selected={on}
              onClick={() => onChange(v)}
              title={`${t(`po_view_${v}` as DictionaryKey)} · ${pos}`}
              className={`flex shrink-0 touch-manipulation select-none items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition active:scale-95 ${
                on ? TONE[v].on : TONE[v].off
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">{t(`po_view_${v}` as DictionaryKey)}</span>
              <kbd
                className={`hidden rounded px-1 font-sans text-[10px] font-black lg:inline ${
                  on ? 'bg-white/25' : 'bg-white/70 text-slate-500'
                }`}
              >
                {pos}
              </kbd>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
