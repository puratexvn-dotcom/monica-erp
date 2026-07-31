'use client';

import {
  AlertTriangle, CalendarClock, CheckCircle2, CloudOff, FileText, Info,
  Package, RefreshCw, Ship,
} from 'lucide-react';

import { Card } from '@/components/ui';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import { useShipmentCenter } from '@/lib/mos/use-shipment-center';
import { SHIPMENT_FLOW, type DelayLevel, delayLevelOf } from '@/lib/mos/shipment';
import type { ShipmentRow } from '@/app/(dashboard)/md/po/[poId]/_services/shipment.service';
import type { ShipSummary } from '@/lib/mos/shipment';
import type { SummaryLine } from '@/app/(dashboard)/md/po/[poId]/_services/executive.service';

// ============================================================================
// LÁT CẮT 5 — TRUNG TÂM XUẤT HÀNG
//
// Bốn khu vực: số lượng đóng gói / xuất · nhận định · dòng chảy từng lô hàng ·
// chứng từ và mốc thời gian.
//
// ─── ĐIỀU VII: TỆP NÀY KHÔNG TÍNH GÌ ─────────────────────────────────────
// Độ trễ, tỉ lệ, cảnh báo bất thường — tất cả đã tính xong ở lib/mos/shipment.ts.
// Ở đây chỉ chọn màu và đặt chữ.
//
// ─── VÌ SAO KHÔNG DÙNG VirtualList ───────────────────────────────────────
// Cuộn ảo cần chiều cao dòng CỐ ĐỊNH. Thẻ lô hàng cao thấp khác nhau tuỳ số
// cảnh báo và số chứng từ đã có. Vả lại một đơn hiếm khi quá mươi lô — dưới
// ngưỡng 40 thì chính VirtualList cũng vẽ thẳng. Dùng nó ở đây là trả giá mà
// không được gì.
//
// ─── VÌ SAO KHÔNG CÓ BIỂU ĐỒ ─────────────────────────────────────────────
// Bốn mốc thời gian của một lô hàng là bốn con số, không phải một chuỗi thời
// gian. Vẽ chúng thành biểu đồ sẽ tốn Recharts (133 kB) để trình bày thứ mà
// một hàng chữ nói rõ hơn.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const show = (v: number | null, d = 1): string =>
  v === null ? '—' : nf.format(Number(v.toFixed(d)));

const STATUS_CHIP: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  BOOKED: 'bg-sky-100 text-sky-800',
  LOADING: 'bg-amber-100 text-amber-900',
  DEPARTED: 'bg-blue-100 text-blue-800',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
  ARRIVED_PORT: 'bg-teal-100 text-teal-800',
  CUSTOM_CLEARANCE: 'bg-violet-100 text-violet-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-800',
};

const DELAY_CLS: Record<DelayLevel, string> = {
  LATE: 'text-rose-700',
  ON_TIME: 'text-emerald-700',
  EARLY: 'text-sky-700',
  UNKNOWN: 'text-slate-400',
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

// ─── Khu vực 1: số lượng ────────────────────────────────────────────────────

function SummaryPanel({ sum, daysToEtd }: { sum: ShipSummary; daysToEtd: number | null }) {
  const { t } = useLanguage();

  const etdText =
    daysToEtd === null ? t('po_sh_no_etd')
      : daysToEtd === 0 ? t('po_sh_etd_today')
      : daysToEtd > 0 ? fill(t('po_sh_etd_in'), [String(daysToEtd)])
      : fill(t('po_sh_etd_past'), [String(-daysToEtd)]);

  const cells: Array<{ n: string; key: DictionaryKey; sub: string; cls: string }> = [
    {
      n: nf.format(sum.packedQty), key: 'po_sh_packed',
      sub: fill(t('po_sh_cartons'), [nf.format(sum.packedCartons)]),
      cls: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      n: nf.format(sum.shippedQty), key: 'po_sh_shipped',
      sub: fill(t('po_sh_cartons'), [nf.format(sum.shippedCartons)]),
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      n: nf.format(sum.awaitingQty), key: 'po_sh_awaiting',
      sub: fill(t('po_sh_cartons'), [nf.format(sum.awaitingCartons)]),
      // Số âm nghĩa là dữ liệu mâu thuẫn — tô đỏ, không làm tròn về 0.
      cls: sum.awaitingQty < 0
        ? 'bg-rose-50 text-rose-800 border-rose-300'
        : sum.awaitingQty > 0
          ? 'bg-amber-50 text-amber-900 border-amber-300'
          : 'bg-slate-50 text-slate-500 border-slate-200',
    },
  ];

  return (
    <Card title={t('po_sh_title')} icon={Ship}>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="shrink-0 text-center">
          <span className="block text-4xl font-black tabular-nums leading-none text-slate-900">
            {show(sum.shippedPct, 0)}
            {sum.shippedPct !== null && <span className="text-lg">%</span>}
          </span>
          <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {t('po_sh_shipped')}
          </span>
          <span className="mt-0.5 block text-[10px] text-slate-400">
            {t('po_sh_ordered')} {sum.orderedQty === null ? '—' : nf.format(sum.orderedQty)}
          </span>
        </div>

        <ul className="grid min-w-0 flex-1 grid-cols-3 gap-2">
          {cells.map((c) => (
            <li key={c.key} className={`rounded-lg border px-2.5 py-2 ${c.cls}`}>
              <span className="block text-xl font-black tabular-nums leading-none">{c.n}</span>
              <span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-wide">
                {t(c.key)}
              </span>
              <span className="mt-0.5 block truncate text-[10px] opacity-70">{c.sub}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-600">
        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        {t('po_sh_etd_next')}: <span className="tabular-nums">{etdText}</span>
      </p>

      {sum.overPacked && (
        <p className="mt-1.5 text-[10px] italic text-slate-400">{t('po_sh_over_note')}</p>
      )}
    </Card>
  );
}

// ─── Khu vực 3: dòng chảy một lô hàng ───────────────────────────────────────

function FlowBar({ stageIndex }: { stageIndex: number | null }) {
  const { t } = useLanguage();
  // Lô đã huỷ không đứng ở bước nào — vẽ thanh tiến trình cho nó là nói rằng
  // nó vẫn đang đi.
  if (stageIndex === null) return null;
  return (
    <ol className="mt-2 flex min-w-0 gap-0.5" aria-label={t('po_sh_timeline')}>
      {SHIPMENT_FLOW.map((st, i) => (
        <li
          key={st}
          className={`h-1.5 min-w-0 flex-1 rounded-full ${i <= stageIndex ? 'bg-blue-500' : 'bg-slate-200'}`}
          title={t(`po_sh_st_${st}` as DictionaryKey)}
        />
      ))}
    </ol>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`truncate text-[11px] font-semibold text-slate-700 ${mono ? 'font-mono' : ''}`}>
        {value && value.trim() !== '' ? value : '—'}
      </dd>
    </div>
  );
}

function DelayCell({ label, days, hint }: { label: string; days: number | null; hint?: string }) {
  const { t } = useLanguage();
  const lvl = delayLevelOf(days);
  const text =
    days === null ? '—'
      : days > 0 ? fill(t('po_sh_delay_days'), [String(days)])
      : days < 0 ? fill(t('po_sh_early_days'), [String(-days)])
      : t('po_sh_ontime');
  return (
    <div className="min-w-0" title={hint}>
      <dt className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`truncate text-sm font-black tabular-nums ${DELAY_CLS[lvl]}`}>{text}</dd>
    </div>
  );
}

function ShipmentCard({ s }: { s: ShipmentRow }) {
  const { t } = useLanguage();
  const statusKey = s.status ? (`po_sh_st_${s.status}` as DictionaryKey) : 'po_sh_st_unknown';

  return (
    <li className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-bold text-slate-900">{s.shipmentNo}</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_CHIP[s.status ?? ''] ?? 'bg-slate-100 text-slate-500'}`}>
          {t(statusKey)}
        </span>
        {s.incoterm && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
            {s.incoterm}
          </span>
        )}
        <span className="ml-auto text-[11px] font-bold tabular-nums text-slate-600">
          {fill(t('po_sh_cartons'), [nf.format(s.cartons)])} · {nf.format(s.qty)}
        </span>
      </div>

      <FlowBar stageIndex={s.stageIndex} />

      {/* Chứng từ */}
      <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
        <Field label={t('po_sh_booking_no')} value={s.bookingNo} mono />
        <Field label={t('po_sh_bl_no')} value={s.blNo} mono />
        <Field label={t('po_sh_co_no')} value={s.coNo} mono />
        <Field label={t('po_sh_invoice_no')} value={s.invoiceNo} mono />
        <Field label={t('po_sh_container')} value={s.containerNo} mono />
        <Field label={t('po_sh_seal')} value={s.sealNo} mono />
        <Field label={t('po_sh_vessel')} value={s.vesselName} />
        <Field label={t('po_sh_forwarder')} value={s.forwarder} />
        <Field label={t('po_sh_pol')} value={s.portOfLoading} />
        <Field label={t('po_sh_pod')} value={s.destinationPort} />
      </dl>

      {/* Mốc thời gian */}
      <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-slate-100 pt-2.5 sm:grid-cols-4">
        <Field label={t('po_sh_booking_date')} value={s.bookingDate} />
        <Field label={t('po_sh_stuffing_date')} value={s.stuffingDate} />
        <Field label={t('po_sh_clearance_date')} value={s.customClearanceDate} />
        <Field label={t('po_sh_gate_out_date')} value={s.gateOutDate} />
        <Field label={t('po_sh_etd')} value={s.etdDate} />
        <Field label={t('po_sh_atd')} value={s.atdDate} />
        <Field label={t('po_sh_eta')} value={s.etaDate} />
        <Field label={t('po_sh_ata')} value={s.ataDate} />
      </dl>

      {/* Độ trễ — HAI số tách riêng, cố ý không gộp */}
      <dl className="mt-2.5 grid grid-cols-3 gap-x-3 border-t border-slate-100 pt-2.5">
        <DelayCell label={t('po_sh_delay_dep')} days={s.delays.departure} hint={t('po_sh_delay_split')} />
        <DelayCell label={t('po_sh_delay_arr')} days={s.delays.arrival} hint={t('po_sh_delay_split')} />
        <div className="min-w-0">
          <dt className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {t('po_sh_transit')}
          </dt>
          <dd className="truncate text-sm font-black tabular-nums text-slate-700">
            {s.delays.transit === null ? '—' : fill(t('po_sh_delay_days'), [String(s.delays.transit)])}
          </dd>
        </div>
      </dl>

      {s.flags.length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {s.flags.map((f) => (
            <li
              key={f}
              className="flex items-start gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold leading-relaxed text-amber-900"
            >
              <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
              {t(`po_sh_fl_${f}` as DictionaryKey)}
            </li>
          ))}
        </ul>
      )}

      {s.notes && (
        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-500">
          <FileText className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
          {s.notes}
        </p>
      )}
    </li>
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
    </div>
  );
}

export default function TabShipment({ poId, revision }: { poId: string; revision: number }) {
  const { t } = useLanguage();
  const { data, loading, refreshing, error, reload } = useShipmentCenter(poId, revision);

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
      <SummaryPanel sum={data.summary} daysToEtd={data.daysToEtd} />

      <Insights lines={data.insights} />

      <Card title={t('po_sh_list')} icon={Package}>
        {data.shipments.length === 0 ? (
          // Chưa lập lô hàng nào là chuyện khác hẳn "không xuất được": lô hàng
          // do phân hệ Xuất hàng lập, không phải do tab này.
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 py-10 text-center">
            <Ship className="h-7 w-7 text-slate-400" aria-hidden="true" />
            <p className="text-sm font-bold text-slate-700">{t('po_sh_empty')}</p>
            <p className="max-w-[30rem] px-4 text-[11px] leading-relaxed text-slate-500">
              {t('po_sh_empty_hint')}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2 text-[11px] text-slate-400">{t('po_sh_delay_split')}</p>
            <ul className="space-y-2">
              {data.shipments.map((s) => (
                <ShipmentCard key={s.shipmentId} s={s} />
              ))}
            </ul>
          </>
        )}
      </Card>

      {data.partial.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-900">
          <CloudOff className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('po_partial').replace('{list}', data.partial.join(', '))}
        </p>
      )}
    </div>
  );
}
