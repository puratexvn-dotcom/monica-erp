'use client';

import { useMemo } from 'react';
import {
  CalendarClock, CheckCircle2, ChevronRight, Factory, Flame, Ship, TriangleAlert, X,
} from 'lucide-react';

import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import {
  bucketByStage, daysUntil, laneByUrgency, vnTodayISO,
  type FlowInput, type PoStage, type Urgency,
} from '@/lib/mos/po-flow';

// ============================================================================
// DÒNG CHẢY ĐƠN HÀNG — TRUNG TÂM ĐIỀU HÀNH PO
//
// Bảng danh sách trả lời "có những đơn nào". Khối này trả lời câu khác hẳn:
// "hôm nay tôi phải chạm vào đơn nào trước".
//
// ─── HAI TẦNG, ĐỌC TỪ TRÊN XUỐNG ─────────────────────────────────────────
//   Tầng 1 — GIAI ĐOẠN: đơn đang nằm ở khâu nào, mỗi cột kèm số đơn cần gấp.
//   Tầng 2 — MỨC KHẨN : đơn nào phải chạm vào trước, bất kể đang ở khâu nào.
//
// Hai tầng cắt cùng một tập dữ liệu theo hai trục khác nhau, nên tổng của
// chúng bằng nhau. Đó là chủ đích: người dùng đối chiếu chéo được.
//
// ─── VÌ SAO MỨC KHẨN KHÔNG SUY TỪ TRẠNG THÁI ─────────────────────────────
// Một đơn "đang sản xuất" còn 30 ngày và một đơn "đang sản xuất" còn 2 ngày có
// trạng thái giống hệt nhau nhưng khẩn cấp khác hẳn. Trạng thái nói đơn ở đâu;
// đếm ngược mới nói phải làm gì trước. Xem lib/mos/po-flow.ts.
//
// ─── ĐIỀU XX ─────────────────────────────────────────────────────────────
// Cột và làn LUÔN hiện đủ kể cả khi bằng 0 — cột biến mất khiến người dùng
// tưởng giai đoạn đó không tồn tại, chứ không phải đang trống.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN');

const STAGE_UI: Record<PoStage, { Icon: typeof Factory; tone: string; bar: string }> = {
  APPROVED: { Icon: CheckCircle2, tone: 'border-blue-200 bg-blue-50 text-blue-700', bar: 'bg-blue-500' },
  IN_PRODUCTION: { Icon: Factory, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-600' },
  COMPLETED: { Icon: CheckCircle2, tone: 'border-purple-200 bg-purple-50 text-purple-700', bar: 'bg-purple-500' },
  SHIPPED: { Icon: Ship, tone: 'border-slate-200 bg-slate-50 text-slate-600', bar: 'bg-slate-400' },
};

// Tương phản đã đo trên đúng các cặp dùng thật (WCAG 2.1, chữ 14px đậm →
// ngưỡng AA là 4,5:1):
//   rose-800/rose-50 7,52 · amber-900/amber-50 8,71
//   blue-700/blue-50 6,16 · emerald-700/emerald-50 5,21 · slate-600/slate-50 6,98
const URGENCY_UI: Record<Urgency, { Icon: typeof Flame; card: string; num: string }> = {
  OVERDUE: { Icon: Flame, card: 'border-rose-300 bg-rose-50 hover:border-rose-400', num: 'text-rose-800' },
  CRITICAL: { Icon: TriangleAlert, card: 'border-amber-300 bg-amber-50 hover:border-amber-400', num: 'text-amber-900' },
  WARNING: { Icon: CalendarClock, card: 'border-blue-200 bg-blue-50 hover:border-blue-300', num: 'text-blue-700' },
  NORMAL: { Icon: CheckCircle2, card: 'border-emerald-200 bg-emerald-50 hover:border-emerald-300', num: 'text-emerald-700' },
};

/** Câu đếm ngược. Thay {n} bằng số ngày — giữ chuỗi trong từ điển để ba ngôn
 *  ngữ đặt con số ở đúng vị trí ngữ pháp của mình. */
export function countdownLabel(
  daysLeft: number | null,
  t: (k: DictionaryKey) => string,
): string {
  if (daysLeft === null) return t('md_no_date');
  if (daysLeft === 0) return t('md_days_today');
  if (daysLeft < 0) return t('md_days_over').replace('{n}', String(Math.abs(daysLeft)));
  return t('md_days_left').replace('{n}', String(daysLeft));
}

export type FlowFilter = { kind: 'stage'; value: PoStage } | { kind: 'urgency'; value: Urgency } | null;

export default function PoPipeline<T extends FlowInput>({
  rows,
  filter,
  onFilter,
}: {
  rows: readonly T[];
  filter: FlowFilter;
  onFilter: (next: FlowFilter) => void;
}) {
  const { t } = useLanguage();

  // Chốt "hôm nay" MỘT LẦN cho cả khối. Gọi vnTodayISO() rải rác thì một lượt
  // vẽ ngay lúc nửa đêm có thể dùng hai ngày khác nhau cho hai phép đếm.
  const today = useMemo(() => vnTodayISO(), []);
  const stages = useMemo(() => bucketByStage(rows, today), [rows, today]);
  const lanes = useMemo(() => laneByUrgency(rows, today), [rows, today]);

  const inFlow = stages.reduce((s, b) => s + b.count, 0);
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  if (inFlow === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
        <Factory className="h-7 w-7" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-600">{t('md_flow_empty')}</p>
        <p className="max-w-[22rem] px-4 text-xs">{t('md_flow_empty_hint')}</p>
      </div>
    );
  }

  const isOn = (kind: 'stage' | 'urgency', value: string) =>
    filter !== null && filter.kind === kind && filter.value === value;

  return (
    <div className="mb-4 min-w-0 space-y-4">
      {/* ─── Tầng 1: giai đoạn ─────────────────────────────────────────── */}
      <section className="min-w-0">
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {t('md_flow_title')}
          </h3>
          <span className="text-[11px] text-slate-500">{t('md_flow_hint')}</span>
          {filter !== null && (
            <button
              type="button"
              onClick={() => onFilter(null)}
              className="ml-auto flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              {t('md_clear_filter')}
            </button>
          )}
        </div>

        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {stages.map((b) => {
            const ui = STAGE_UI[b.stage];
            const on = isOn('stage', b.stage);
            return (
              <li key={b.stage} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onFilter(on ? null : { kind: 'stage', value: b.stage })}
                  aria-pressed={on}
                  className={`w-full min-w-0 rounded-xl border p-3 text-left transition active:scale-[0.98] ${ui.tone} ${
                    on ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:shadow-sm'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ui.Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wide">
                      {t(`md_stage_${b.stage}` as DictionaryKey)}
                    </span>
                  </span>

                  <span className="mt-1 block text-2xl font-black tabular-nums leading-none">
                    {nf.format(b.count)}
                    <span className="ml-1 text-[11px] font-bold">{t('md_po_count')}</span>
                  </span>

                  <span className="mt-0.5 block text-[11px] tabular-nums opacity-80">
                    {nf.format(b.quantity)} {t('md_pcs')}
                  </span>

                  {/* Thanh tỷ lệ so với cột đông nhất — nhìn ra ngay chỗ đơn ứ lại */}
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/70">
                    <span
                      className={`block h-full rounded-full ${ui.bar}`}
                      style={{ width: `${Math.round((b.count / maxCount) * 100)}%` }}
                    />
                  </span>

                  {b.hot > 0 && (
                    <span className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-rose-700">
                      <Flame className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {nf.format(b.hot)} {t('md_hot')}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ─── Tầng 2: mức khẩn ──────────────────────────────────────────── */}
      <section className="min-w-0">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          {t('md_lane_title')}
        </h3>
        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {lanes.map((l) => {
            const ui = URGENCY_UI[l.urgency];
            const on = isOn('urgency', l.urgency);
            return (
              <li key={l.urgency} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onFilter(on ? null : { kind: 'urgency', value: l.urgency })}
                  aria-pressed={on}
                  title={t(`md_urg_${l.urgency}_hint` as DictionaryKey)}
                  className={`flex w-full min-w-0 items-center gap-2 rounded-xl border p-3 text-left transition active:scale-[0.98] ${ui.card} ${
                    on ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                  }`}
                >
                  <ui.Icon className={`h-4 w-4 shrink-0 ${ui.num}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      {t(`md_urg_${l.urgency}` as DictionaryKey)}
                    </span>
                    <span className="block text-[11px] tabular-nums text-slate-600">
                      {nf.format(l.quantity)} {t('md_pcs')}
                    </span>
                  </span>
                  <span className={`shrink-0 text-xl font-black tabular-nums ${ui.num}`}>
                    {nf.format(l.count)}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/** Ô đếm ngược dùng trong bảng danh sách — cùng một nguồn logic với dòng chảy. */
export function Countdown({ deliveryDate }: { deliveryDate: string | null }) {
  const { t } = useLanguage();
  const left = daysUntil(deliveryDate);
  const tone =
    left === null ? 'text-slate-400'
    : left < 0 ? 'text-rose-700'
    : left <= 7 ? 'text-amber-800'
    : left <= 21 ? 'text-blue-700'
    : 'text-slate-600';
  return <span className={`text-[11px] font-bold tabular-nums ${tone}`}>{countdownLabel(left, t)}</span>;
}
