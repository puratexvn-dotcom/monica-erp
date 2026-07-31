'use client';

import { CheckCircle2, Palette, Scissors, TriangleAlert } from 'lucide-react';

import { useLanguage } from '@/lib/i18n';
import type { CutTicket } from '@/schemas/warehouse/allocation.schema';

// ============================================================================
// GIỎ LỆNH CẮT — CỘT PHẢI
//
// Trả lời đúng một câu hỏi: LỆNH NÀY CÒN THIẾU BAO NHIÊU VẢI.
//
// ─── VÌ SAO HIỆN CÔNG THỨC RA MÀN HÌNH ───────────────────────────────────
// Con số "cần 1.240 m" không tự nó đáng tin. Hiện kèm "dài sơ đồ × số lá + hao
// hụt" thì thủ kho đối chiếu được với phiếu của tổ cắt và phát hiện ngay khi
// tổ cắt nhập nhầm số lá — thứ mà nếu để lọt sẽ thành thiếu vải giữa ca.
//
// ─── ĐIỀU XX ─────────────────────────────────────────────────────────────
// Thiếu dữ liệu để tính nhu cầu thì hiện "—" chứ KHÔNG hiện 0. Hiện 0 sẽ khiến
// người đọc tưởng lệnh đã đủ vải và bỏ qua nó.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

export default function CutTicketBasket({
  tickets,
  selectedId,
  onSelect,
}: {
  tickets: CutTicket[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useLanguage();

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
        <Scissors className="h-7 w-7" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-600">{t('wh_al_no_ticket')}</p>
        <p className="max-w-[18rem] px-4 text-xs">{t('wh_al_no_ticket_hint')}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tickets.map((tk) => {
        const on = tk.id === selectedId;
        const short = tk.neededM === null ? null : Math.max(tk.neededM - tk.matchedM, 0);
        const enough = short !== null && short === 0 && tk.matchedM > 0;
        // Tỷ lệ chỉ vẽ được khi biết nhu cầu; không biết thì để thanh trống thay
        // vì vẽ đầy 100% và gây hiểu nhầm là đã xong.
        const pct = tk.neededM && tk.neededM > 0
          ? Math.min(Math.round((tk.matchedM / tk.neededM) * 100), 100)
          : null;

        return (
          <li key={tk.id}>
            <button
              type="button"
              onClick={() => onSelect(tk.id)}
              aria-pressed={on}
              className={`w-full min-w-0 rounded-xl border p-3 text-left transition ${
                on
                  ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-300'
                  : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-mono text-xs font-bold text-slate-800">
                  {tk.ticketNo}
                </span>
                {tk.shadeInUse && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                    <Palette className="h-3 w-3" aria-hidden="true" />
                    {tk.shadeInUse}
                  </span>
                )}
                {enough && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    {t('wh_al_enough')}
                  </span>
                )}
              </div>

              {tk.markerCode && (
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{tk.markerCode}</p>
              )}

              <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <dt className="font-semibold text-slate-500">{t('wh_al_need')}</dt>
                  <dd className="font-black tabular-nums text-slate-800">
                    {tk.neededM === null ? '—' : `${nf.format(tk.neededM)} m`}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">{t('wh_al_matched')}</dt>
                  <dd className="font-black tabular-nums text-emerald-700">
                    {nf.format(tk.matchedM)} m
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">{t('wh_al_short')}</dt>
                  <dd
                    className={`font-black tabular-nums ${
                      short === null ? 'text-slate-400' : short > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {short === null ? '—' : `${nf.format(short)} m`}
                  </dd>
                </div>
              </dl>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                {pct !== null && (
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>

              {tk.neededM === null && (
                <p className="mt-1.5 flex items-start gap-1 text-[10px] font-semibold leading-relaxed text-amber-800">
                  <TriangleAlert className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
                  {t('wh_al_need_formula')}
                </p>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
