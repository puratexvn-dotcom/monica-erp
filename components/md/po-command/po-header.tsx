'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, CalendarClock, Factory, Shirt, Wifi, WifiOff } from 'lucide-react';

import { Badge } from '@/components/ui';
import { countdownLabel } from '@/components/md/po/po-pipeline';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import type { PoTwinHeader } from '@/lib/mos/po-twin.contract';
import type { Urgency } from '@/lib/mos/po-flow';

// ============================================================================
// THANH ĐẦU CỦA PO DIGITAL TWIN
//
// Trả lời BỐN câu trong một cái nhìn: đơn nào · của ai · còn bao lâu · nguy
// hiểm cỡ nào. Bốn thứ đó dính theo khi cuộn (sticky) vì người dùng sẽ ở trong
// trang này hàng chục phút và không được lạc mất mình đang xem đơn nào.
//
// ─── ĐIỀU VII: KHÔNG MỘT PHÉP TÍNH NÀO Ở ĐÂY ─────────────────────────────
// Điểm rủi ro, số ngày còn lại, mức khẩn — đều do tầng service và
// lib/mos/po-flow.ts tính sẵn. Component chỉ chọn màu và vẽ.
//
// ─── VÌ SAO HIỆN TRẠNG THÁI KẾT NỐI REALTIME ─────────────────────────────
// Trang này tự cập nhật. Nếu websocket rớt mà không báo, người dùng sẽ nhìn một
// con số cũ và tin rằng đó là số mới nhất — tệ hơn hẳn việc không có realtime.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN');

/** Tương phản đã đo (WCAG 2.1, chữ đậm, ngưỡng AA 4,5:1):
 *  rose-800/rose-50 7,52 · amber-900/amber-50 8,71 · blue-700/blue-50 6,16
 *  emerald-700/emerald-50 5,21 */
const URGENCY_TONE: Record<Urgency, string> = {
  OVERDUE: 'border-rose-300 bg-rose-50 text-rose-800',
  CRITICAL: 'border-amber-300 bg-amber-50 text-amber-900',
  WARNING: 'border-blue-200 bg-blue-50 text-blue-700',
  NORMAL: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

/** Mức rủi ro do view v_order_risk quy đổi. Không tự chấm lại ở đây. */
function riskTone(level: string | null): string {
  switch ((level ?? '').toUpperCase()) {
    case 'CRITICAL': return 'bg-rose-700 text-white';
    case 'HIGH': return 'bg-amber-600 text-white';
    case 'MEDIUM': return 'bg-blue-600 text-white';
    case 'LOW': return 'bg-emerald-700 text-white';
    default: return 'bg-slate-400 text-white';
  }
}

export default function PoHeader({
  head,
  live,
  action,
}: {
  head: PoTwinHeader;
  live: boolean;
  action?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const id = head.identity;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto min-w-0 max-w-[110rem] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-start gap-3">
          <Link
            href="/md"
            aria-label={t('po_back')}
            className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 truncate font-mono text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                {id.poNumber}
              </h1>
              {head.stage && (
                <Badge tone="indigo">{t(`md_stage_${head.stage}` as DictionaryKey)}</Badge>
              )}
              <span
                className={`rounded-lg px-2 py-0.5 text-[11px] font-black tabular-nums ${riskTone(head.risk.level)}`}
                title={t('po_risk_score')}
              >
                {/* Điều XX: chưa chấm điểm thì "—", KHÔNG phải 0 (0 nghĩa là
                    đã chấm và không có rủi ro nào) */}
                {head.risk.totalScore === null ? '—' : nf.format(head.risk.totalScore)}
                <span className="ml-1 font-bold opacity-80">{head.risk.level ?? t('po_risk_none')}</span>
              </span>
            </div>

            <dl className="mt-1 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                <dt className="sr-only">{t('po_customer')}</dt>
                <dd className="truncate font-semibold text-slate-800">{id.customerName}</dd>
              </div>
              <div className="flex items-center gap-1">
                <Shirt className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                <dt className="sr-only">{t('po_style')}</dt>
                <dd className="truncate">{id.styleNo ?? '—'}</dd>
              </div>
              <div className="flex items-center gap-1">
                <dt className="sr-only">{t('po_quantity')}</dt>
                <dd className="tabular-nums font-semibold text-slate-800">
                  {nf.format(id.totalQuantity)} <span className="font-normal">{t('md_pcs')}</span>
                </dd>
              </div>
              {id.factoryName && (
                <div className="flex items-center gap-1">
                  <Factory className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                  <dt className="sr-only">{t('po_factory')}</dt>
                  <dd className="truncate">{id.factoryName}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ${URGENCY_TONE[head.urgency]}`}
            >
              <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {countdownLabel(head.daysLeft, t)}
            </span>

            <span
              className={`flex items-center gap-1 text-[10px] font-bold ${live ? 'text-emerald-600' : 'text-slate-400'}`}
              title={live ? t('po_live_on') : t('po_live_off')}
            >
              {live ? <Wifi className="h-3 w-3" aria-hidden="true" /> : <WifiOff className="h-3 w-3" aria-hidden="true" />}
              <span className="hidden sm:inline">{live ? t('po_live_on') : t('po_live_off')}</span>
            </span>

            {action}
          </div>
        </div>
      </div>
    </header>
  );
}
