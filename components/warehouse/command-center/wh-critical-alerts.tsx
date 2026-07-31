'use client';

import { memo } from 'react';
import { AlertOctagon, Clock, MapPinOff, PackageX, ShieldCheck, ShieldX, Snowflake } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { WhAlert, WhAlertKind } from '@/app/(dashboard)/kho/_services/command-center.service';
import { BIZ_TONE, ROW_HOVER, type BizDomain } from '@/components/md/semantic-tone';

// ============================================================================
// CỘT PHẢI — CẢNH BÁO RỦI RO
//
// ─── NGƯỠNG ĐẶT CAO, CÓ CHỦ ĐÍCH ───────────────────────────────────────────
// Thiếu hụt: chỉ khi CÓ SẴN tụt dưới mức tồn tối thiểu ĐÃ KHAI.
// Hàng về trễ: quá ngày dự kiến từ 3 ngày mà chưa nhận đủ.
// Rớt QA: cuộn có kết luận FAILED.
// Sai vị trí: còn tồn nhưng chưa gán ô kệ.
// Tồn đọng: không phát sinh biến động trong hơn 90 ngày (một mùa vụ ngành may).
//
// Cảnh báo mà cái gì cũng kêu thì thủ kho ngừng đọc, tới lúc đứt chuyền thật
// lại bỏ qua. Danh sách rỗng KHÔNG phải chỗ trống lãng phí — đó là tin tốt, và
// được nói thành lời để người đọc biết hệ thống có chạy.
// ============================================================================

const KIND_META: Record<WhAlertKind, { icon: LucideIcon; domain: BizDomain; label: string }> = {
  SHORTAGE: { icon: PackageX, domain: 'QUALITY', label: 'Thiếu hụt' },
  LATE_ARRIVAL: { icon: Clock, domain: 'PLANNING', label: 'Hàng về trễ' },
  QA_FAIL: { icon: ShieldX, domain: 'QUALITY', label: 'Rớt QA' },
  NO_LOCATION: { icon: MapPinOff, domain: 'SHIPPING', label: 'Sai vị trí' },
  SLOW_MOVING: { icon: Snowflake, domain: 'MATERIAL', label: 'Tồn đọng' },
};

function WhCriticalAlerts({
  alerts,
  error,
  onOpen,
}: {
  alerts: WhAlert[];
  error?: string | null;
  onOpen: (alert: WhAlert) => void;
}) {
  const has = alerts.length > 0;

  return (
    <section
      aria-label="Cảnh báo rủi ro"
      className={`rounded-2xl border ${has ? 'border-red-200' : 'border-slate-200'} bg-white`}
    >
      <header
        className={`flex flex-wrap items-center gap-2 border-b px-4 py-3 ${
          has ? 'border-red-100 bg-red-50/60' : 'border-slate-100'
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            has ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {has ? <AlertOctagon className="h-4 w-4" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
        </span>
        <h2 className="text-sm font-bold tracking-tight text-slate-800">Cảnh báo rủi ro</h2>
        {has && (
          <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
            {alerts.length}
          </span>
        )}
      </header>

      {error ? (
        <p role="alert" className="px-4 py-8 text-center text-sm font-semibold text-red-700">{error}</p>
      ) : !has ? (
        <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
          <ShieldCheck className="h-9 w-9 text-emerald-200" strokeWidth={1.25} aria-hidden="true" />
          <p className="text-sm font-semibold text-emerald-700">Kho đang an toàn</p>
          <p className="max-w-xs text-xs text-slate-400">
            Đang theo dõi: thiếu hụt dưới mức tối thiểu · hàng về trễ từ 3 ngày · cuộn rớt QA ·
            hàng chưa xếp vị trí · tồn đọng quá 90 ngày.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {alerts.map((a) => {
            const meta = KIND_META[a.kind];
            const Icon = meta.icon;
            return (
              <li key={a.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(a)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpen(a);
                    }
                  }}
                  className={`flex items-start gap-3 px-4 py-2.5 ${ROW_HOVER}`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${BIZ_TONE[meta.domain].chip}`}
                    title={meta.label}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{a.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{a.detail}</p>
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

export default memo(WhCriticalAlerts);
