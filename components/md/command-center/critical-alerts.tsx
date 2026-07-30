'use client';

import { memo } from 'react';
import { AlertOctagon, CalendarClock, Package, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { CriticalAlert, AlertKind } from '@/app/(dashboard)/md/_services/command-center.service';
import { BIZ_TONE, ROW_HOVER, type BizDomain } from '../semantic-tone';

// ============================================================================
// KHU 3 — CẢNH BÁO MỨC ĐỎ (LEVEL 1)
//
// ─── VÌ SAO CHỈ MỨC ĐỎ ─────────────────────────────────────────────────────
// Cảnh báo mà cái gì cũng kêu thì người vận hành ngừng đọc, tới lúc có chuyện
// thật lại bỏ qua. Ngưỡng đặt trong command-center.service.ts cố ý cao: mốc
// đường găng trễ từ 3 ngày, mốc thường từ 7 ngày, NPL trễ từ 3 ngày, tỷ lệ lỗi
// từ 5% và chỉ khi đã kiểm ít nhất 50 sản phẩm, đơn ở mức Nguy kịch.
//
// Danh sách rỗng KHÔNG phải là chỗ trống lãng phí — đó là tin tốt, và được nói
// thành lời hẳn hoi để người đọc yên tâm là hệ thống có chạy.
// ============================================================================

const KIND_META: Record<AlertKind, { icon: LucideIcon; domain: BizDomain; label: string }> = {
  SCHEDULE: { icon: CalendarClock, domain: 'PLANNING', label: 'Tiến độ' },
  MATERIAL: { icon: Package, domain: 'MATERIAL', label: 'Nguyên phụ liệu' },
  QUALITY: { icon: ShieldAlert, domain: 'QUALITY', label: 'Chất lượng' },
  RISK: { icon: AlertOctagon, domain: 'QUALITY', label: 'Rủi ro' },
};

function CriticalAlerts({
  alerts,
  error,
  onOpenPo,
}: {
  alerts: CriticalAlert[];
  error?: string | null;
  onOpenPo: (orderId: string, poNumber: string) => void;
}) {
  return (
    <section
      aria-label="Cảnh báo nguy cấp"
      className={`rounded-2xl border ${alerts.length > 0 ? 'border-red-200' : 'border-slate-200'} bg-white`}
    >
      <header
        className={`flex flex-wrap items-center gap-2 border-b px-4 py-3 ${
          alerts.length > 0 ? 'border-red-100 bg-red-50/60' : 'border-slate-100'
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            alerts.length > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {alerts.length > 0 ? (
            <AlertOctagon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <h2 className="text-sm font-bold tracking-tight text-slate-800">Cảnh báo nguy cấp</h2>
        {alerts.length > 0 && (
          <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
            {alerts.length}
          </span>
        )}
      </header>

      {error ? (
        <p role="alert" className="px-4 py-8 text-center text-sm font-semibold text-red-700">{error}</p>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
          <ShieldCheck className="h-9 w-9 text-emerald-200" strokeWidth={1.25} aria-hidden="true" />
          <p className="text-sm font-semibold text-emerald-700">Không có cảnh báo đỏ nào</p>
          <p className="max-w-xs text-xs text-slate-400">
            Hệ thống đang theo dõi: mốc đường găng trễ từ 3 ngày, NPL trễ từ 3 ngày, tỷ lệ lỗi từ 5%,
            và đơn ở mức Nguy kịch.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {alerts.map((a) => {
            const meta = KIND_META[a.kind];
            const Icon = meta.icon;
            const clickable = Boolean(a.orderId && a.poNumber);
            return (
              <li key={a.id}>
                <div
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={() => clickable && onOpenPo(a.orderId as string, a.poNumber as string)}
                  onKeyDown={(e) => {
                    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onOpenPo(a.orderId as string, a.poNumber as string);
                    }
                  }}
                  className={`flex items-start gap-3 px-4 py-2.5 ${clickable ? ROW_HOVER : ''}`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${BIZ_TONE[meta.domain].chip}`}
                    title={meta.label}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{a.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                      {a.poNumber && (
                        <span className="font-mono font-bold text-slate-600">{a.poNumber}</span>
                      )}
                      <span className="truncate">{a.detail}</span>
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-red-800">
                    {a.metric}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default memo(CriticalAlerts);
