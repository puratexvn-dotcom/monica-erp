'use client';

import {
  AlertTriangle, CheckCircle2, ClipboardList, CloudOff, EyeOff, Grid3x3,
  Info, RefreshCw, ShieldCheck, TrendingUp,
} from 'lucide-react';

import { Card } from '@/components/ui';
import VirtualList from '@/components/mos/virtual-list';
import { ChartFrame, ParetoSeries } from '@/components/md/chart-kit';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import { useQualityCenter } from '@/lib/mos/use-quality-center';
import type { CapaRow, QaLotRow, QualityKpi } from '@/app/(dashboard)/md/po/[poId]/_services/quality.service';
import type { SummaryLine } from '@/app/(dashboard)/md/po/[poId]/_services/executive.service';
import type { HeatMap } from '@/lib/mos/defect-position';
import type { AqlResult, CapaAgeing, CapaStatus, ParetoResult } from '@/lib/mos/quality';

// ============================================================================
// LÁT CẮT 4 — TRUNG TÂM CHẤT LƯỢNG
//
// Bốn khu vực: tỉ lệ đạt AQL · Pareto loại lỗi · bản đồ lỗi theo vị trí · bảng
// phiếu khắc phục.
//
// ─── ĐIỀU VII: TỆP NÀY KHÔNG TÍNH GÌ ─────────────────────────────────────
// Pareto, phần trăm cộng dồn, độ đậm từng ô, mức khẩn của phiếu CAPA — tất cả
// đã tính xong ở lib/mos/quality.ts và lib/mos/defect-position.ts. Ở đây chỉ
// chọn màu và đặt chữ. Bài học Phase 2: hai phép tính từng lọt vào component và
// phải gỡ ra.
//
// ─── VÌ SAO PHẢI NẠP TRỄ ─────────────────────────────────────────────────
// Tệp này kéo theo Recharts. Đo ở Phase 3: nhập khẩu thẳng làm gói tuyến đường
// phình từ 8,65 kB lên 133 kB. next/dynamic ở po-command-client.tsx giữ nó
// ngoài gói chính.
//
// ─── VÌ SAO Ô "KHÔNG ĐƯỢC XEM" KHÔNG PHẢI Ô TRỐNG ────────────────────────
// Buyer xem được tab này (họ có quyền biết lô hàng đạt hay không), nhưng policy
// `capa_internal_only` chặn bảng CAPA. Nếu vẽ ra khung trống "chưa có phiếu
// nào" thì khách hàng sẽ đọc thành "nhà máy không có gì phải khắc phục". Vì vậy
// có hẳn một khung riêng nói thẳng: mục này không hiển thị cho vai trò của bạn.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const show = (v: number | null, d = 1): string =>
  v === null ? '—' : nf.format(Number(v.toFixed(d)));

const ROW_H = 44;
const LIST_H = 320;

const AQL_CHIP: Record<AqlResult, string> = {
  PASS: 'bg-emerald-100 text-emerald-800',
  FAIL: 'bg-rose-100 text-rose-800',
  PENDING: 'bg-slate-100 text-slate-600',
};
const AQL_LABEL: Record<AqlResult, DictionaryKey> = {
  PASS: 'po_qc_lot_pass',
  FAIL: 'po_qc_lot_fail',
  PENDING: 'po_qc_lot_pending',
};

const AGEING_CHIP: Record<CapaAgeing, string> = {
  OVERDUE: 'border-rose-300 bg-rose-50 text-rose-800',
  DUE_SOON: 'border-amber-300 bg-amber-50 text-amber-900',
  ON_TRACK: 'border-slate-200 bg-white text-slate-700',
  DONE: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
};
const AGEING_LABEL: Record<CapaAgeing, DictionaryKey> = {
  OVERDUE: 'po_qc_ag_OVERDUE',
  DUE_SOON: 'po_qc_ag_DUE_SOON',
  ON_TRACK: 'po_qc_ag_ON_TRACK',
  DONE: 'po_qc_ag_DONE',
};
const CAPA_STATUS_LABEL: Record<CapaStatus, DictionaryKey> = {
  OPEN: 'po_qc_st_OPEN',
  IN_PROGRESS: 'po_qc_st_IN_PROGRESS',
  VERIFYING: 'po_qc_st_VERIFYING',
  CLOSED: 'po_qc_st_CLOSED',
  CANCELLED: 'po_qc_st_CANCELLED',
};

const INSIGHT_UI = {
  DANGER: { cls: 'border-rose-200 bg-rose-50 text-rose-800', Icon: AlertTriangle },
  WARN: { cls: 'border-amber-200 bg-amber-50 text-amber-900', Icon: AlertTriangle },
  INFO: { cls: 'border-slate-200 bg-slate-50 text-slate-700', Icon: Info },
  GOOD: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
} as const;

function fill(tpl: string, values: string[]): string {
  return values.reduce((s, v, i) => s.replace(`{${i}}`, v), tpl);
}

// ─── Khu vực 1: tỉ lệ đạt AQL ───────────────────────────────────────────────

function AqlPanel({ kpi }: { kpi: QualityKpi }) {
  const { t } = useLanguage();
  const cells: Array<{ n: number; key: DictionaryKey; cls: string }> = [
    { n: kpi.lotsPassed, key: 'po_qc_lot_pass', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { n: kpi.lotsFailed, key: 'po_qc_lot_fail', cls: 'bg-rose-50 text-rose-800 border-rose-300' },
    { n: kpi.lotsPending, key: 'po_qc_lot_pending', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  ];
  return (
    <Card title={t('po_qc_title')} icon={ShieldCheck}>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="shrink-0 text-center">
          <span className="block text-4xl font-black tabular-nums leading-none text-slate-900">
            {show(kpi.passRate, 0)}
            {kpi.passRate !== null && <span className="text-lg">%</span>}
          </span>
          <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {t('po_qc_kpi_pass')}
          </span>
        </div>
        <ul className="grid min-w-0 flex-1 grid-cols-3 gap-2">
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

      <ul className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
        {([
          { k: 'po_qc_kpi_dhu', v: show(kpi.dhu, 2) },
          { k: 'po_qc_kpi_checked', v: nf.format(kpi.checked) },
          { k: 'po_qc_kpi_defects', v: nf.format(kpi.defects) },
        ] as Array<{ k: DictionaryKey; v: string }>).map((x) => (
          <li key={x.k} className="min-w-0">
            <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {t(x.k)}
            </span>
            <span className="block text-base font-black tabular-nums text-slate-800">{x.v}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] italic text-slate-400">{t('po_qc_kpi_pass_hint')}</p>
    </Card>
  );
}

// ─── Khu vực 2: Pareto ──────────────────────────────────────────────────────

function ParetoPanel({ pareto }: { pareto: ParetoResult }) {
  const { t } = useLanguage();
  const qtyName = t('po_qc_pareto_qty');
  const cumName = t('po_qc_pareto_cum');
  // Cột gộp có nhãn rỗng từ service — service không biết ngôn ngữ, nên chữ
  // "Khác" chỉ được điền ở đây.
  const data = pareto.rows.map((r) => ({
    name: r.key === '__other__' ? t('po_qc_pareto_other') : r.label,
    qty: r.qty,
    cum: r.cumPct,
  }));

  return (
    <div className="min-w-0">
      <ChartFrame
        title={t('po_qc_pareto_title')}
        hint={t('po_qc_pareto_hint')}
        isEmpty={data.length === 0}
        emptyText={t('po_qc_pareto_empty')}
        height={280}
      >
        <ParetoSeries data={data} xKey="name" qtyKey="qty" cumKey="cum" qtyName={qtyName} cumName={cumName} />
      </ChartFrame>
      {pareto.merged > 0 && (
        <p className="mt-1.5 px-1 text-[10px] italic text-slate-400">
          {fill(t('po_qc_pareto_merged'), [String(pareto.merged)])}
        </p>
      )}
    </div>
  );
}

// ─── Khu vực 3: bản đồ lỗi theo vị trí ──────────────────────────────────────

/**
 * Thang màu năm bậc.
 *
 * Bậc đậm nhất dùng chữ TRẮNG trên nền rose-600 — đã đo tỉ lệ tương phản 4,70:1,
 * đạt WCAG AA. Bốn bậc còn lại dùng chữ sẫm trên nền nhạt.
 *
 * Ô có 0 lỗi cố ý dùng màu xám chứ không phải hồng nhạt nhất: "không có lỗi ở
 * đây" phải khác hẳn về chất với "có ít lỗi ở đây", không phải khác một bậc đậm.
 */
function heatClass(qty: number, intensity: number): string {
  if (qty === 0) return 'bg-slate-50 text-slate-300 border-slate-100';
  if (intensity <= 0.25) return 'bg-rose-50 text-rose-900 border-rose-100';
  if (intensity <= 0.5) return 'bg-rose-100 text-rose-900 border-rose-200';
  if (intensity <= 0.75) return 'bg-rose-300 text-rose-950 border-rose-400';
  return 'bg-rose-600 text-white border-rose-700';
}

function HeatPanel({ heat }: { heat: HeatMap }) {
  const { t } = useLanguage();
  const empty = heat.located === 0;

  return (
    <Card title={t('po_qc_heat_title')} icon={Grid3x3}>
      {empty ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center text-xs font-medium text-slate-400">
          {t('po_qc_heat_empty')}
        </p>
      ) : (
        <>
          <p className="mb-2 text-[11px] text-slate-400">
            {fill(t('po_qc_heat_hint'), [nf.format(heat.peak)])}
          </p>
          <div className="space-y-2">
            {heat.rows.map((row) => (
              <div key={row.zone} className="min-w-0">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {t(`po_qc_zone_${row.zone}` as DictionaryKey)}
                </span>
                {/* Cuộn ngang nằm trên chính hàng ô, không trên thân trang:
                    vùng "Phần dưới" có bảy ô, hẹp màn hình sẽ tràn. */}
                <div className="overflow-x-auto pb-0.5">
                  <ul className="flex min-w-max gap-1.5">
                    {row.cells.map((c) => (
                      <li
                        key={c.position}
                        className={`w-[5.5rem] shrink-0 rounded-lg border px-2 py-1.5 text-center ${heatClass(c.qty, c.intensity)}`}
                        title={`${t(`po_qc_pos_${c.position}` as DictionaryKey)}: ${nf.format(c.qty)}`}
                      >
                        <span className="block text-lg font-black tabular-nums leading-none">
                          {c.qty === 0 ? '—' : nf.format(c.qty)}
                        </span>
                        <span className="mt-1 block truncate text-[10px] font-semibold">
                          {t(`po_qc_pos_${c.position}` as DictionaryKey)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {heat.unlocated > 0 && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] font-semibold text-amber-900">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {fill(t('po_qc_heat_unlocated'), [nf.format(heat.unlocated)])}
        </p>
      )}
    </Card>
  );
}

// ─── Khu vực 4: phiếu khắc phục ─────────────────────────────────────────────

function CapaCard({ item }: { item: CapaRow }) {
  const { t } = useLanguage();
  return (
    <li className={`rounded-lg border px-3 py-2.5 ${AGEING_CHIP[item.ageing]}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] font-bold">{item.capaNo}</span>
        <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          {t(CAPA_STATUS_LABEL[item.status])}
        </span>
        <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          {t(AGEING_LABEL[item.ageing])}
        </span>
        <span className="ml-auto text-[11px] font-semibold tabular-nums">
          {t('po_qc_capa_due')}: {item.dueDate ?? '—'}
        </span>
      </div>

      <dl className="mt-2 space-y-1 text-[11px] leading-relaxed">
        <div className="flex gap-1.5">
          <dt className="shrink-0 font-bold opacity-70">{t('po_qc_capa_root')}:</dt>
          <dd className="min-w-0">{item.rootCause}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="shrink-0 font-bold opacity-70">{t('po_qc_capa_action')}:</dt>
          <dd className="min-w-0">{item.action}</dd>
        </div>
        {item.preventiveAction && (
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-bold opacity-70">{t('po_qc_capa_prevent')}:</dt>
            <dd className="min-w-0">{item.preventiveAction}</dd>
          </div>
        )}
        <div className="flex gap-1.5">
          <dt className="shrink-0 font-bold opacity-70">{t('po_qc_capa_pic')}:</dt>
          <dd className="min-w-0">{item.picName ?? '—'}</dd>
        </div>
      </dl>
    </li>
  );
}

function CapaPanel({
  items,
  summary,
  visible,
}: {
  items: CapaRow[];
  summary: { total: number; open: number; overdue: number; closeRate: number | null };
  visible: boolean;
}) {
  const { t } = useLanguage();

  // KHÔNG ĐƯỢC XEM khác hẳn KHÔNG CÓ. Xem ghi chú đầu tệp.
  if (!visible) {
    return (
      <Card title={t('po_qc_capa_title')} icon={ClipboardList}>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 py-8 text-center">
          <EyeOff className="h-7 w-7 text-slate-400" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-700">{t('po_qc_capa_hidden')}</p>
          <p className="max-w-[28rem] px-4 text-[11px] leading-relaxed text-slate-500">
            {t('po_qc_capa_hidden_hint')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title={t('po_qc_capa_title')} icon={ClipboardList}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] text-slate-400">{t('po_qc_capa_hint')}</p>
        {summary.total > 0 && (
          <p className="text-[11px] font-bold tabular-nums text-slate-600">
            {fill(t('po_qc_capa_count'), [
              String(summary.total), String(summary.open), String(summary.overdue),
            ])}
            {summary.closeRate !== null && (
              <span className="ml-2 text-slate-400">
                · {t('po_qc_capa_closerate')} {show(summary.closeRate, 0)}%
              </span>
            )}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-8 text-center text-xs font-medium text-slate-400">
          {t('po_qc_capa_empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <CapaCard key={c.id} item={c} />
          ))}
        </ul>
      )}
    </Card>
  );
}

// ─── Bảng phiếu kiểm ────────────────────────────────────────────────────────

function LotRow({ lot }: { lot: QaLotRow }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-[6rem_5.5rem_1fr_6rem_4.5rem_5rem_5rem_5.5rem] items-center gap-2 border-b border-slate-100 px-3 text-[11px] last:border-0">
      <span className="truncate tabular-nums text-slate-500">{lot.createdAt?.slice(0, 10) ?? '—'}</span>
      <span className="truncate text-slate-600">{lot.inspectionType ?? '—'}</span>
      <span className="min-w-0 truncate font-semibold text-slate-800" title={lot.defectLabel}>
        {lot.defectLabel}
        {/* Dòng cũ chưa gán mã chuẩn: đánh dấu chấm, vì chính những dòng này là
            lý do Pareto có thể còn phân mảnh. */}
        {lot.defectCode === null && (
          <span className="ml-1 text-amber-500" title={t('po_qc_uncoded')} aria-label={t('po_qc_uncoded')}>
            •
          </span>
        )}
      </span>
      <span className="truncate text-slate-600">
        {lot.defectLocation
          ? t(`po_qc_pos_${lot.defectLocation}` as DictionaryKey)
          : <span className="text-slate-300">{t('po_qc_loc_none')}</span>}
      </span>
      <span className="tabular-nums text-slate-800">{lot.qtyDefect ?? '—'}</span>
      <span className="tabular-nums text-slate-600">{lot.checkedQty ?? '—'}</span>
      <span className="tabular-nums text-slate-500">
        {lot.acNumber ?? '—'} / {lot.reNumber ?? '—'}
      </span>
      <span>
        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${AQL_CHIP[lot.aql]}`}>
          {t(AQL_LABEL[lot.aql])}
        </span>
      </span>
    </div>
  );
}

function LotTable({ lots }: { lots: QaLotRow[] }) {
  const { t } = useLanguage();
  const cols: DictionaryKey[] = [
    'po_qc_col_date', 'po_qc_col_type', 'po_qc_col_defect', 'po_qc_col_loc',
    'po_qc_col_qty', 'po_qc_col_checked', 'po_qc_col_acre', 'po_qc_col_result',
  ];
  return (
    <Card title={t('po_qc_table_title')} icon={TrendingUp}>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <div className="min-w-[46rem]">
          <div className="grid grid-cols-[6rem_5.5rem_1fr_6rem_4.5rem_5rem_5rem_5.5rem] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {cols.map((c) => (
              <span key={c} className="truncate">{t(c)}</span>
            ))}
          </div>
          <VirtualList
            items={lots}
            rowHeight={ROW_H}
            height={LIST_H}
            keyOf={(l) => l.id}
            renderRow={(l) => <LotRow lot={l} />}
          />
        </div>
      </div>
    </Card>
  );
}

// ─── Khung ──────────────────────────────────────────────────────────────────

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
      <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

export default function TabQuality({ poId, revision }: { poId: string; revision: number }) {
  const { t } = useLanguage();
  const { data, loading, refreshing, error, reload } = useQualityCenter(poId, revision);

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

  // ⚠️ HAI TRẠNG THÁI RỖNG KHÁC HẲN NHAU, KHÔNG ĐƯỢC GỘP.
  //
  // Không được xem: bảng có thể đầy dữ liệu, chỉ là vai trò này không đọc được.
  // Vẽ ra "chưa có phiếu kiểm nào" ở đây là nói dối khách hàng — và nói dối
  // theo hướng có lợi cho nhà máy, nên càng phải chặn.
  if (!data.qaVisible) {
    return (
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 py-12 text-center">
          <EyeOff className="h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-700">{t('po_qc_qa_hidden')}</p>
          <p className="max-w-[32rem] px-4 text-xs leading-relaxed text-slate-500">
            {t('po_qc_qa_hidden_hint')}
          </p>
        </div>
        <CapaPanel items={data.capa} summary={data.capaSummary} visible={data.capaVisible} />
      </div>
    );
  }

  // Đọc được nhưng chưa có phiếu nào: đây mới thật sự là "chưa kiểm". Nói thẳng
  // nguyên nhân một lần, thay vì để người dùng nhìn bốn khung trống rồi tự đoán.
  // Bảng CAPA vẫn hiện: phiếu khắc phục mở được từ xu hướng, không nhất thiết
  // phải có phiếu kiểm trước.
  if (data.kpi.lots === 0) {
    return (
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 py-12 text-center">
          <ClipboardList className="h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-700">{t('po_qc_empty')}</p>
          <p className="max-w-[32rem] px-4 text-xs leading-relaxed text-slate-500">
            {t('po_qc_empty_hint')}
          </p>
        </div>
        <CapaPanel items={data.capa} summary={data.capaSummary} visible={data.capaVisible} />
      </div>
    );
  }

  return (
    <div className={`min-w-0 space-y-4 transition-opacity ${refreshing ? 'opacity-70' : ''}`}>
      <AqlPanel kpi={data.kpi} />

      <Insights lines={data.insights} />

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <ParetoPanel pareto={data.pareto} />
        <HeatPanel heat={data.heat} />
      </div>

      <CapaPanel items={data.capa} summary={data.capaSummary} visible={data.capaVisible} />

      <LotTable lots={data.lots} />

      {data.partial.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-900">
          <CloudOff className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('po_partial').replace('{list}', data.partial.join(', '))}
        </p>
      )}
    </div>
  );
}
