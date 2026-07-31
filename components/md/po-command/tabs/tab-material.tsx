'use client';

import {
  AlertTriangle, Boxes, CheckCircle2, ChevronRight, CloudOff, Info, Layers,
  Loader2, PackageX, RefreshCw, ShieldAlert, X,
} from 'lucide-react';

import { Card, ProgressBar, type Tone } from '@/components/ui';
import VirtualList from '@/components/mos/virtual-list';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import { useMaterialReadiness } from '@/lib/mos/use-material-readiness';
import type { MaterialLine, RollTrace } from '@/app/(dashboard)/md/po/[poId]/_services/material.service';
import type { SummaryLine } from '@/app/(dashboard)/md/po/[poId]/_services/executive.service';
import type { Readiness } from '@/lib/mos/material-readiness';

// ============================================================================
// LÁT CẮT 3 — SẴN SÀNG NGUYÊN PHỤ LIỆU
//
// Trong ngành may, NPL là máu. Tab này không phải để xem định mức, mà để biết
// CHÍNH XÁC dòng nào đang chặn chuyền.
//
// ─── ĐIỀU VII: TỆP NÀY KHÔNG TÍNH GÌ ─────────────────────────────────────
// Nhu cầu, mức đáp ứng, còn thiếu bao nhiêu, trạng thái từng dòng — view
// (migration 022) gộp số, material-readiness.ts chấm luật, service ráp lại.
// Ở đây chỉ chọn màu và đặt chữ.
//
// ─── ĐIỀU XXII: BẢNG CUỘN ẢO ─────────────────────────────────────────────
// Một mã hàng phức tạp có thể có hàng trăm dòng phụ liệu. VirtualList chỉ vẽ
// phần đang nhìn thấy — nhưng DƯỚI 40 dòng thì nó vẽ thẳng, vì với bảng ngắn
// chi phí cuộn ảo lớn hơn chi phí vẽ mà lại mất Ctrl+F của trình duyệt.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const show = (v: number | null, d = 2): string =>
  v === null ? '—' : nf.format(Number(v.toFixed(d)));

const ROW_H = 56;
const LIST_H = 460;

const STATUS_TONE: Record<Readiness, Tone> = {
  READY: 'emerald',
  PARTIAL: 'amber',
  MISSING: 'rose',
  UNKNOWN: 'slate',
};
const STATUS_LABEL: Record<Readiness, DictionaryKey> = {
  READY: 'po_mt_ready',
  PARTIAL: 'po_mt_partial',
  MISSING: 'po_mt_missing_st',
  UNKNOWN: 'po_mt_unknown_st',
};
const STATUS_CHIP: Record<Readiness, string> = {
  READY: 'bg-emerald-100 text-emerald-800',
  PARTIAL: 'bg-amber-100 text-amber-900',
  MISSING: 'bg-rose-100 text-rose-800',
  UNKNOWN: 'bg-slate-100 text-slate-600',
};

// ─── Khu vực 1: sức khoẻ ────────────────────────────────────────────────────

function HealthBar({
  health,
}: {
  health: { ready: number; partial: number; missing: number; unknown: number; readyPct: number | null; blocking: boolean };
}) {
  const { t } = useLanguage();
  const cells: Array<{ n: number; key: DictionaryKey; cls: string }> = [
    { n: health.ready, key: 'po_mt_ready', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { n: health.partial, key: 'po_mt_partial', cls: 'bg-amber-50 text-amber-900 border-amber-300' },
    { n: health.missing, key: 'po_mt_missing_st', cls: 'bg-rose-50 text-rose-800 border-rose-300' },
    { n: health.unknown, key: 'po_mt_unknown_st', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  ];
  return (
    <Card title={t('po_mt_health')} icon={Boxes}>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="shrink-0 text-center">
          <span className="block text-4xl font-black tabular-nums leading-none text-slate-900">
            {show(health.readyPct, 0)}
            {health.readyPct !== null && <span className="text-lg">%</span>}
          </span>
          <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {t('po_mt_ready_pct')}
          </span>
        </div>
        <ul className="grid min-w-0 flex-1 grid-cols-2 gap-2 lg:grid-cols-4">
          {cells.map((c) => (
            <li key={c.key} className={`rounded-lg border px-2.5 py-2 ${c.cls}`}>
              <span className="block text-xl font-black tabular-nums leading-none">{c.n}</span>
              <span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-wide">
                {t(c.key)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {health.blocking && (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-2 text-[11px] font-bold text-rose-800">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('po_mt_blocking')}
        </p>
      )}
      <p className="mt-2 text-[10px] italic text-slate-400">{t('po_mt_usable_note')}</p>
    </Card>
  );
}

// ─── Khu vực 2: một dòng định mức ───────────────────────────────────────────

function Row({
  line,
  onOpen,
  open,
}: {
  line: MaterialLine;
  onOpen: () => void;
  open: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div
      className={`flex min-w-0 items-center gap-3 border-b border-slate-100 px-3 py-2 transition ${
        open ? 'bg-blue-50' : 'hover:bg-slate-50'
      }`}
      style={{ height: ROW_H }}
    >
      <span className="min-w-0 flex-[2]">
        <span className="block truncate text-xs font-bold text-slate-800">{line.itemName}</span>
        <span className="block truncate text-[10px] text-slate-400">
          {line.materialCode ?? '—'}
          {line.consumptionPerPcs !== null && (
            <> · {nf.format(line.consumptionPerPcs)} {line.unit ?? ''}/sp</>
          )}
        </span>
      </span>

      <span className="hidden w-20 shrink-0 text-right tabular-nums sm:block">
        <span className="block text-xs font-bold text-slate-800">{show(line.required)}</span>
        <span className="block text-[10px] text-slate-400">{t('po_mt_required')}</span>
      </span>
      <span className="hidden w-20 shrink-0 text-right tabular-nums md:block">
        <span className="block text-xs text-slate-700">{show(line.available)}</span>
        <span className="block text-[10px] text-slate-400">{t('po_mt_available')}</span>
      </span>
      <span className="hidden w-20 shrink-0 text-right tabular-nums lg:block">
        <span className="block text-xs text-emerald-700">{show(line.reservedForPo)}</span>
        <span className="block text-[10px] text-slate-400">{t('po_mt_reserved')}</span>
      </span>
      <span className="hidden w-16 shrink-0 text-right tabular-nums lg:block">
        <span className="block text-xs text-slate-700">
          {line.rollsTotal === 0 ? '—' : `${line.rollsPassed}/${line.rollsTotal}`}
        </span>
        <span className="block text-[10px] text-slate-400">{t('po_mt_qa_passed')}</span>
      </span>

      <span className="w-24 shrink-0">
        <span className={`block rounded-md px-1.5 py-0.5 text-center text-[10px] font-black uppercase ${STATUS_CHIP[line.status]}`}>
          {t(STATUS_LABEL[line.status])}
        </span>
        {line.coverage !== null && (
          <span className="mt-1 block">
            <ProgressBar pct={Math.min(line.coverage, 100)} tone={STATUS_TONE[line.status]} />
          </span>
        )}
      </span>

      {line.qaFlag && (
        <AlertTriangle
          className="h-3.5 w-3.5 shrink-0 text-amber-600"
          aria-label={t('po_mt_qa_warn')}
        />
      )}

      <button
        type="button"
        onClick={onOpen}
        disabled={!line.materialId}
        title={t('po_mt_rolls_open')}
        className="flex h-8 shrink-0 touch-manipulation items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-30"
      >
        <Layers className="h-3 w-3" aria-hidden="true" />
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Khu vực 3: truy vết cuộn ───────────────────────────────────────────────

function RollPanel({
  poId,
  rolls,
  title,
  loading,
  error,
  onClose,
}: {
  poId: string;
  rolls: RollTrace[];
  title: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Card
      title={t('po_mt_rolls').replace('{0}', title)}
      icon={Layers}
      action={
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 transition hover:border-blue-300"
        >
          <X className="h-3 w-3" aria-hidden="true" /> {t('po_mt_rolls_close')}
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        </div>
      ) : error ? (
        <p className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-semibold text-rose-800">
          <CloudOff className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : rolls.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">{t('po_mt_rolls_empty')}</p>
      ) : (
        <>
          <p className="mb-2 text-[11px] text-slate-500">
            {t('po_mt_rolls_count').replace('{n}', String(rolls.length))}
          </p>
          <ul className="space-y-1.5">
            {rolls.map((r) => {
              // Giữ cho CHÍNH đơn này khác hẳn giữ cho đơn khác — đây là thông
              // tin quyết định có đi đòi hàng hay không.
              const mine = r.reservedForOrder === poId;
              const taken = r.reservedForOrder !== null && !mine;
              return (
                <li
                  key={r.rollId}
                  className={`flex min-w-0 flex-wrap items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] ${
                    r.qaStatus === 'FAILED' ? 'border-rose-300 bg-rose-50'
                    : mine ? 'border-emerald-300 bg-emerald-50'
                    : taken ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="font-mono font-bold text-slate-800">{r.rollCode}</span>
                  <span className="tabular-nums text-slate-600">{show(r.lengthM, 1)} m</span>
                  {r.shadeCode && <span className="text-purple-700">{r.shadeCode}</span>}
                  {r.lotNo && <span className="text-slate-400">{r.lotNo}</span>}
                  {r.score !== null && (
                    <span className="tabular-nums text-slate-500">{nf.format(r.score)} {t('wh_point_unit')}</span>
                  )}
                  <span className="ml-auto font-bold text-slate-600">
                    {mine ? t('po_mt_roll_reserved_here')
                      : taken ? t('po_mt_roll_reserved_other')
                      : t('po_mt_roll_free')}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}

// ─── Nhận định ──────────────────────────────────────────────────────────────

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
  if (lines.length === 0) return null;
  return (
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
  );
}

function Skeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-36 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

export default function TabMaterial({ poId, revision }: { poId: string; revision: number }) {
  const { t } = useLanguage();
  const {
    data, loading, refreshing, error, reload,
    trace, traceLoading, traceError, openTrace, closeTrace,
  } = useMaterialReadiness(poId, revision);

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

  // Trạng thái rỗng NÓI RÕ NGUYÊN NHÂN: chưa gắn mã hàng và mã hàng chưa có
  // định mức là hai việc của hai người khác nhau.
  if (data.emptyReason !== null) {
    const isStyle = data.emptyReason === 'NO_STYLE';
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 py-14 text-center">
        <PackageX className="h-8 w-8 text-amber-500" aria-hidden="true" />
        <p className="text-sm font-bold text-amber-900">
          {t(isStyle ? 'po_mt_empty_style' : 'po_mt_empty_bom')}
        </p>
        <p className="max-w-[30rem] px-4 text-xs leading-relaxed text-amber-800">
          {t(isStyle ? 'po_mt_empty_style_hint' : 'po_mt_empty_bom_hint')}
        </p>
      </div>
    );
  }

  const traceLine = trace ? data.lines.find((l) => l.materialId === trace.materialId) : null;

  return (
    <div className={`min-w-0 space-y-4 transition-opacity ${refreshing ? 'opacity-70' : ''}`}>
      <HealthBar health={data.health} />

      <Insights lines={data.insights} />

      <Card title={t('po_mt_matrix')} icon={Layers}>
        <p className="mb-2 text-[11px] text-slate-400">{t('po_mt_flow_hint')}</p>
        {/* overflow-x-auto trên chính khung bảng: thân trang không bao giờ được
            cuộn ngang (chuẩn UI_UX_STANDARDS). */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <div className="min-w-[44rem]">
            <VirtualList
              items={data.lines}
              rowHeight={ROW_H}
              height={LIST_H}
              keyOf={(l) => l.bomId}
              renderRow={(l) => (
                <Row
                  line={l}
                  open={trace?.materialId === l.materialId}
                  onOpen={() => l.materialId && openTrace(l.materialId)}
                />
              )}
            />
          </div>
        </div>
      </Card>

      {(trace || traceLoading || traceError) && (
        <RollPanel
          poId={poId}
          rolls={trace?.rolls ?? []}
          title={traceLine?.itemName ?? traceLine?.materialCode ?? '—'}
          loading={traceLoading}
          error={traceError}
          onClose={closeTrace}
        />
      )}

      {data.partial.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-900">
          <CloudOff className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('po_partial').replace('{list}', data.partial.join(', '))}
        </p>
      )}
    </div>
  );
}
