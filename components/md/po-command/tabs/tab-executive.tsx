'use client';

import {
  Activity, AlertTriangle, Boxes, CalendarClock, CheckCircle2, CloudOff, Gauge,
  Info, MessageSquare, RefreshCw, Sparkles, TrendingUp,
} from 'lucide-react';

import { Badge, Card, ProgressBar, type Tone } from '@/components/ui';
import { countdownLabel } from '@/components/md/po/po-pipeline';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import { useExecutiveOverview } from '@/lib/mos/use-executive-overview';
import { ROLE_LABEL, isRole } from '@/lib/rbac';
import type { SummaryLine, ActivityItem, ExecutiveOverview } from '@/app/(dashboard)/md/po/[poId]/_services/executive.service';
import type { Health, HealthPart } from '@/lib/mos/po-health';

// ============================================================================
// LÁT CẮT 1 — TỔNG QUAN ĐIỀU HÀNH
//
// Bảng đồng hồ cho cấp điều hành: KHÔNG nhập liệu, chỉ đọc và ra quyết định.
//
// ─── ĐIỀU VII: TỆP NÀY KHÔNG TÍNH GÌ CẢ ──────────────────────────────────
// Không một phép cộng, không một phép chia. Mọi con số do executive.service.ts
// tính xong; ở đây chỉ chọn màu, chọn biểu tượng và đặt chữ vào chỗ.
//
// ─── ĐIỀU XX: KHUNG XÁM CHỈ Ở LẦN ĐẦU ────────────────────────────────────
// Realtime nảy vài lần mỗi phút. Nếu mỗi lần lại xoá trắng rồi vẽ lại thì màn
// hình nhấp nháy liên tục. Hook phân biệt `loading` (chưa có gì) với
// `refreshing` (đang nạp lại nhưng đã có số cũ) — khung xám chỉ cho cái đầu.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN');
const dtf = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});

/** Số hoặc gạch ngang. 0 là 0; không đọc được là "—". */
const show = (v: number | null, digits = 0): string =>
  v === null ? '—' : nf.format(Number(v.toFixed(digits)));

// ─── Khu vực 1: thẻ chỉ số ──────────────────────────────────────────────────

// Tương phản đã đo trên đúng các cặp dùng thật (WCAG 2.1, ngưỡng AA 4,5:1):
//   blue-700/blue-50 6,16 · emerald-700/emerald-50 5,21
//   amber-900/amber-50 8,71 · rose-800/rose-50 7,52 · slate-700/white 10,4
const KPI_TONE: Record<Tone, string> = {
  slate: 'border-slate-200 bg-white text-slate-700',
  indigo: 'border-blue-200 bg-blue-50 text-blue-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-300 bg-amber-50 text-amber-900',
  rose: 'border-rose-300 bg-rose-50 text-rose-800',
};

function Kpi({
  icon: Icon, label, value, unit, sub, tone = 'slate',
}: {
  icon: typeof Gauge; label: string; value: string; unit?: string;
  sub?: string; tone?: Tone;
}) {
  return (
    <div className={`min-w-0 rounded-xl border p-3 ${KPI_TONE[tone]}`}>
      <span className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wide">{label}</span>
      </span>
      <span className="mt-1.5 block text-2xl font-black tabular-nums leading-none">
        {value}
        {unit && <span className="ml-1 text-xs font-bold">{unit}</span>}
      </span>
      {sub && <span className="mt-1 block truncate text-[11px] opacity-80">{sub}</span>}
    </div>
  );
}

// ─── Khu vực 2: sức khoẻ ────────────────────────────────────────────────────

const PART_LABEL: Record<HealthPart['key'], DictionaryKey> = {
  material: 'po_health_material',
  schedule: 'po_health_schedule',
  quality: 'po_health_quality',
  capacity: 'po_health_capacity',
};

/** Điểm CÀNG CAO càng nguy hiểm — ngược chiều trực giác thông thường, nên màu
 *  phải nói rõ điều đó: xanh ở dưới thấp, đỏ ở trên cao. */
function scoreTone(score: number | null): Tone {
  if (score === null) return 'slate';
  if (score >= 70) return 'rose';
  if (score >= 45) return 'amber';
  if (score >= 20) return 'indigo';
  return 'emerald';
}

const RING_TONE: Record<Tone, string> = {
  emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  indigo: 'text-blue-700 bg-blue-50 border-blue-200',
  amber: 'text-amber-900 bg-amber-50 border-amber-300',
  rose: 'text-rose-800 bg-rose-50 border-rose-300',
  slate: 'text-slate-500 bg-slate-50 border-slate-200',
};

function HealthWidget({ health }: { health: Health }) {
  const { t } = useLanguage();
  const tone = scoreTone(health.total);
  const ring = RING_TONE[tone];

  return (
    <Card title={t('po_health')} icon={Gauge}>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <div className={`shrink-0 rounded-xl border px-5 py-3 text-center ${ring}`}>
          <span className="block text-4xl font-black tabular-nums leading-none">
            {show(health.total, 0)}
          </span>
          <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide">
            {health.level ?? '—'}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {health.parts.map((p) => (
            <div key={p.key} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[11px] font-semibold text-slate-600">
                  {t(PART_LABEL[p.key])}
                  <span className="ml-1 tabular-nums text-slate-400">
                    ×{p.weight.toFixed(2)}
                  </span>
                </span>
                <span
                  className="shrink-0 text-xs font-black tabular-nums text-slate-800"
                  title={p.score === null ? t('po_health_nodata') : undefined}
                >
                  {show(p.score, 0)}
                </span>
              </div>
              {/* Thành phần thiếu dữ liệu KHÔNG vẽ thanh 0% — thanh rỗng trông
                  y hệt "rủi ro bằng không", trong khi sự thật là chưa biết. */}
              {p.score === null ? (
                <div className="mt-1 h-1.5 rounded-full border border-dashed border-slate-300" />
              ) : (
                <div className="mt-1">
                  <ProgressBar pct={p.score} tone={scoreTone(p.score)} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-500">
        <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
        {health.source === 'ASSESSED'
          ? t('po_health_assessed')
          : health.source === 'DERIVED'
            ? `${t('po_health_derived')} · ${t('po_health_basis').replace('{n}', String(health.basis))}`
            : t('po_health_none')}
      </p>
    </Card>
  );
}

// ─── Khu vực 3: tóm tắt + hoạt động ─────────────────────────────────────────

const TONE_UI = {
  DANGER: { cls: 'border-rose-200 bg-rose-50 text-rose-800', Icon: AlertTriangle },
  WARN: { cls: 'border-amber-200 bg-amber-50 text-amber-900', Icon: AlertTriangle },
  INFO: { cls: 'border-slate-200 bg-slate-50 text-slate-700', Icon: Info },
  GOOD: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
} as const;

/** Thay {0}, {1}... bằng số thật. Câu nằm ở từ điển nên ba ngôn ngữ đặt con số
 *  vào đúng vị trí ngữ pháp của mình. */
function fill(tpl: string, values: string[]): string {
  return values.reduce((s, v, i) => s.replace(`{${i}}`, v), tpl);
}

function SummaryPanel({ lines }: { lines: SummaryLine[] }) {
  const { t } = useLanguage();
  return (
    <Card title={t('po_summary')} icon={Sparkles}>
      <ul className="space-y-1.5">
        {lines.map((l, i) => {
          const ui = TONE_UI[l.tone];
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
      <p className="mt-2 text-[10px] italic text-slate-400">{t('po_summary_rule')}</p>
    </Card>
  );
}

function ActivityPanel({ items, error }: { items: ActivityItem[]; error: string | null }) {
  const { t } = useLanguage();
  return (
    <Card title={t('po_activity')} icon={Activity}>
      {error && (
        <p className="mb-2 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-semibold text-rose-800">
          <CloudOff className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {items.length === 0 && !error ? (
        <div className="flex flex-col items-center gap-1.5 py-8 text-center text-slate-400">
          <MessageSquare className="h-6 w-6" aria-hidden="true" />
          <p className="text-xs font-medium text-slate-600">{t('po_activity_empty')}</p>
          <p className="max-w-[18rem] text-[11px]">{t('po_activity_empty_hint')}</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {items.map((a) => (
            <li key={a.id} className="flex min-w-0 gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] leading-relaxed text-slate-700">
                  <strong className="font-bold text-slate-900">
                    {a.actor && isRole(a.actor) ? ROLE_LABEL[a.actor] : (a.actor ?? '—')}
                  </strong>{' '}
                  {t(a.key as DictionaryKey)}
                  {a.detail && <span className="text-slate-500"> — {a.detail}</span>}
                </span>
                <span className="block text-[10px] tabular-nums text-slate-400">
                  {dtf.format(new Date(a.at))}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ─── Khung xám lần đầu ──────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function TabExecutive({
  poId,
  revision,
  initial,
}: {
  poId: string;
  revision: number;
  /** Nạp sẵn ở máy chủ — nội dung hiện ngay lượt vẽ đầu, không khung xám */
  initial: ExecutiveOverview | null;
}) {
  const { t } = useLanguage();
  const { data, loading, refreshing, error, reload } = useExecutiveOverview(poId, revision, initial);

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

  // Không một phép tính nào ở đây — service đã tính xong tất cả.
  const h = data.head;
  const pending = data.buyerPending;
  const matReady = data.materialReadyPct;

  return (
    <div className={`min-w-0 space-y-4 transition-opacity ${refreshing ? 'opacity-70' : ''}`}>
      {/* ─── Khu vực 1: chỉ số cốt lõi ─────────────────────────────────── */}
      <section className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi
          icon={TrendingUp}
          label={t('po_kpi_progress')}
          value={show(h.progress.sewnPct, 1)}
          unit={h.progress.sewnPct === null ? undefined : '%'}
          tone={h.progress.sewnPct === null ? 'slate' : h.progress.sewnPct >= 100 ? 'emerald' : 'indigo'}
        />
        <Kpi
          icon={CheckCircle2}
          label={t('po_kpi_output')}
          value={show(h.progress.sewnOk)}
          sub={`${t('po_kpi_of')} ${nf.format(h.identity.totalQuantity)}`}
        />
        <Kpi
          icon={CalendarClock}
          label={t('po_kpi_deadline')}
          value={countdownLabel(h.daysLeft, t)}
          tone={
            h.urgency === 'OVERDUE' ? 'rose'
            : h.urgency === 'CRITICAL' ? 'amber'
            : h.urgency === 'WARNING' ? 'indigo' : 'emerald'
          }
        />
        <Kpi
          icon={Boxes}
          label={t('po_kpi_material')}
          value={show(matReady, 0)}
          unit={matReady === null ? undefined : '%'}
          sub={
            h.material.bomLines === null
              ? undefined
              : `${nf.format(h.material.readyLines ?? 0)}/${nf.format(h.material.bomLines)}`
          }
          tone={matReady === null ? 'slate' : matReady >= 100 ? 'emerald' : 'amber'}
        />
        <Kpi
          icon={MessageSquare}
          label={t('po_kpi_buyer')}
          value={pending === 0 ? t('po_buyer_ok') : t('po_buyer_wait').replace('{n}', String(pending))}
          tone={pending === 0 ? 'emerald' : 'amber'}
        />
      </section>

      {/* ─── Khu vực 2: sức khoẻ ───────────────────────────────────────── */}
      <HealthWidget health={data.health} />

      {/* ─── Khu vực 3: tóm tắt + hoạt động ────────────────────────────── */}
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <SummaryPanel lines={data.summary} />
        <ActivityPanel items={data.activity} error={data.activityError} />
      </div>

      {data.partial.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-900">
          <CloudOff className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('po_partial').replace('{list}', data.partial.join(', '))}
        </p>
      )}

      <div className="flex justify-end">
        <Badge tone="slate">{h.identity.poNumber}</Badge>
      </div>
    </div>
  );
}
