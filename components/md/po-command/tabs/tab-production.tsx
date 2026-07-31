'use client';

import {
  AlertTriangle, CheckCircle2, CloudOff, Factory, Info, Layers, RefreshCw, TrendingDown,
} from 'lucide-react';

import { Card, ProgressBar, type Tone } from '@/components/ui';
import { ChartFrame, TargetVsActualBars } from '@/components/md/chart-kit';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import { useProductionTwin } from '@/lib/mos/use-production-twin';
import type { LineStat } from '@/app/(dashboard)/md/po/[poId]/_services/production.service';
import type { SummaryLine } from '@/app/(dashboard)/md/po/[poId]/_services/executive.service';

// ============================================================================
// LÁT CẮT 2 — BẢN SAO SỐ CỦA XƯỞNG MAY
//
// Trả lời ba câu: đơn đang nằm ở chuyền nào · chạy nhanh hay chậm so với kế
// hoạch · nghẽn ở đâu.
//
// ─── ĐIỀU VII: TỆP NÀY KHÔNG TÍNH GÌ ─────────────────────────────────────
// Hiệu suất, dở dang, chuỗi ngày hụt, dữ liệu biểu đồ — production.service.ts
// tính xong hết. Mảng `chart` trả về đã đúng hình dạng Recharts cần, nên ở đây
// không có một `.map` hay `.reduce` nào trên dữ liệu nghiệp vụ.
//
// ─── TÁI SỬ DỤNG, KHÔNG CÀI THÊM ─────────────────────────────────────────
// ChartFrame và TargetVsActualBars đều nằm ở components/md/chart-kit.tsx, dùng
// chung Recharts đã có trong dự án. Không thêm thư viện biểu đồ nào.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN');
const show = (v: number | null, d = 0): string =>
  v === null ? '—' : nf.format(Number(v.toFixed(d)));

/** Hiệu suất càng thấp càng nguy — màu phải nói đúng chiều đó. */
function effTone(pct: number | null): Tone {
  if (pct === null) return 'slate';
  if (pct >= 95) return 'emerald';
  if (pct >= 90) return 'indigo';
  if (pct >= 75) return 'amber';
  return 'rose';
}

const TONE_CARD: Record<Tone, string> = {
  emerald: 'border-emerald-200 bg-emerald-50',
  indigo: 'border-blue-200 bg-blue-50',
  amber: 'border-amber-300 bg-amber-50',
  rose: 'border-rose-300 bg-rose-50',
  slate: 'border-slate-200 bg-white',
};

function LineCard({ line }: { line: LineStat }) {
  const { t } = useLanguage();
  const tone = effTone(line.efficiency);
  return (
    <li className={`min-w-0 rounded-xl border p-3 ${TONE_CARD[tone]}`}>
      <div className="flex min-w-0 flex-wrap items-baseline gap-2">
        <span className="font-mono text-sm font-black text-slate-900">{line.lineCode}</span>
        {line.lineName && (
          <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">{line.lineName}</span>
        )}
        <span className="shrink-0 text-xl font-black tabular-nums text-slate-900">
          {show(line.efficiency, 1)}
          {line.efficiency !== null && <span className="text-xs">%</span>}
        </span>
      </div>

      {line.efficiency !== null && (
        <div className="mt-1.5">
          {/* Thanh chặn ở 100: chạy vượt kế hoạch 130% mà vẽ tràn khung thì
              thanh mất hết ý nghĩa so sánh giữa các chuyền. */}
          <ProgressBar pct={Math.min(line.efficiency, 100)} tone={tone} />
        </div>
      )}

      <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <dt className="font-semibold text-slate-500">{t('po_pr_target')}</dt>
          <dd className="font-bold tabular-nums text-slate-800">{nf.format(line.target)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">{t('po_pr_actual')}</dt>
          <dd className="font-bold tabular-nums text-slate-900">{nf.format(line.actual)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">{t('po_pr_rework')}</dt>
          <dd className={`font-bold tabular-nums ${line.rework > 0 ? 'text-amber-800' : 'text-slate-500'}`}>
            {nf.format(line.rework)}
          </dd>
        </div>
      </dl>

      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/70 pt-1.5 text-[10px] text-slate-500">
        <span className="tabular-nums">{nf.format(line.slots)} {t('po_pr_slots')}</span>
        {line.ratedPerHour !== null && (
          <span className="tabular-nums">
            {t('po_pr_rated')} {nf.format(line.ratedPerHour)}/h
          </span>
        )}
        {line.daysBelow > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-rose-700 px-1.5 py-0.5 font-bold text-white">
            <TrendingDown className="h-2.5 w-2.5" aria-hidden="true" />
            {t('po_pr_streak_badge').replace('{n}', String(line.daysBelow))}
          </span>
        )}
      </p>
    </li>
  );
}

const INSIGHT_UI = {
  DANGER: { cls: 'border-rose-200 bg-rose-50 text-rose-800', Icon: AlertTriangle },
  WARN: { cls: 'border-amber-200 bg-amber-50 text-amber-900', Icon: AlertTriangle },
  INFO: { cls: 'border-slate-200 bg-slate-50 text-slate-700', Icon: Info },
  GOOD: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
} as const;

function fill(tpl: string, values: string[]): string {
  return values.reduce((s, v, i) => s.replace(`{${i}}`, v), tpl);
}

function Insights({ lines }: { lines: SummaryLine[] }) {
  const { t } = useLanguage();
  return (
    <Card title={t('po_pr_insights')} icon={AlertTriangle}>
      <ul className="space-y-1.5">
        {lines.map((l, i) => {
          const ui = INSIGHT_UI[l.tone];
          return (
            <li
              key={i}
              className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[11px] font-semibold leading-relaxed ${ui.cls}`}
            >
              <ui.Icon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">{fill(t(l.key as DictionaryKey), l.values)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[10px] italic text-slate-400">{t('po_pr_eff_note')}</p>
    </Card>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-100" />)}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

export default function TabProduction({ poId, revision }: { poId: string; revision: number }) {
  const { t } = useLanguage();
  const { data, loading, refreshing, error, reload } = useProductionTwin(poId, revision);

  if (loading) return <Skeleton />;
  if (error !== null && data === null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
        <CloudOff className="h-8 w-8 text-rose-500" aria-hidden="true" />
        <p className="text-sm font-bold text-rose-800">{error}</p>
        <button
          type="button"
          onClick={reload}
          className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> {t('wh_retry')}
        </button>
      </div>
    );
  }
  if (!data) return <Skeleton />;

  return (
    <div className={`min-w-0 space-y-4 transition-opacity ${refreshing ? 'opacity-70' : ''}`}>
      {/* ─── Khu 1: chuyền + hàng dở dang ──────────────────────────────── */}
      <section className="min-w-0">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          {t('po_pr_lines')}
        </h3>
        {data.lines.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
            <Factory className="h-7 w-7" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">{t('po_pr_no_line')}</p>
            <p className="max-w-[24rem] px-4 text-xs">{t('po_pr_no_line_hint')}</p>
          </div>
        ) : (
          <ul className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.lines.map((l) => <LineCard key={l.lineId} line={l} />)}
          </ul>
        )}
      </section>

      <Card title={t('po_pr_wip')} icon={Layers}>
        <dl className="grid grid-cols-3 gap-3">
          <div>
            <dt className="text-[11px] font-semibold text-slate-500">{t('po_pr_wip_cut')}</dt>
            <dd className="text-xl font-black tabular-nums text-slate-800">{show(data.wip.cut)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-slate-500">{t('po_pr_wip_sewn')}</dt>
            <dd className="text-xl font-black tabular-nums text-emerald-700">{show(data.wip.sewn)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-slate-500">{t('po_pr_wip')}</dt>
            <dd className="text-xl font-black tabular-nums text-amber-800">{show(data.wip.wip)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[10px] italic text-slate-400">{t('po_pr_wip_formula')}</p>
        {/* Nói THẲNG giới hạn thay vì lấy dở dang toàn đơn gán cho từng chuyền */}
        {!data.perLineWip && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600">
            <Info className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            {t('po_pr_wip_perline')}
          </p>
        )}
      </Card>

      {/* ─── Khu 2: kế hoạch vs thực tế ────────────────────────────────── */}
      <ChartFrame
        title={t('po_pr_chart')}
        hint={t('po_pr_chart_hint')}
        isEmpty={data.chart.length === 0}
        emptyText={t('po_pr_chart_empty')}
        height={260}
      >
        <TargetVsActualBars
          data={data.chart}
          xKey="day"
          targetKey="target"
          actualKey="actual"
          targetName={t('po_pr_target')}
          actualName={t('po_pr_actual')}
        />
      </ChartFrame>

      {/* ─── Khu 3: nhận diện điểm nghẽn ───────────────────────────────── */}
      <Insights lines={data.insights} />

      {data.partial.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-900">
          <CloudOff className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('po_partial').replace('{list}', data.partial.join(', '))}
        </p>
      )}
    </div>
  );
}
