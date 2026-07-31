'use client';

import { memo } from 'react';
import { AlertOctagon, ShieldCheck } from 'lucide-react';

import { BIZ_TONE, ROW_HOVER } from '@/components/md/semantic-tone';
import type { MosAlert } from '@/lib/mos/command-center.contract';

// ============================================================================
// BẢNG CẢNH BÁO MỨC ĐỎ — DÙNG CHUNG CHO MỌI PHÂN HỆ
//
// ─── VÌ SAO DANH SÁCH RỖNG LẠI CÓ CHỮ ─────────────────────────────────────
// Rỗng KHÔNG phải chỗ trống lãng phí — đó là tin tốt. Nhưng một ô trắng trơn
// khiến người dùng nghi hệ thống chưa chạy. Vì vậy khung bắt buộc phân hệ
// truyền `watchingHint` nói rõ đang theo dõi những gì và ở ngưỡng nào.
//
// ─── NGƯỠNG NẰM Ở PHÂN HỆ, KHÔNG NẰM Ở ĐÂY ────────────────────────────────
// Khung không quyết định thế nào là "đỏ". Mỗi nghiệp vụ có ngưỡng riêng: kho
// coi NPL trễ 3 ngày là nguy cấp, còn Merchandiser coi mốc đường găng trễ 3
// ngày mới là nguy cấp. Khung chỉ vẽ những gì được đưa cho.
// ============================================================================

function MosAlertPanel({
  title,
  alerts,
  error,
  emptyTitle = 'Không có cảnh báo nào',
  watchingHint,
}: {
  title: string;
  alerts: MosAlert[];
  error?: string | null;
  emptyTitle?: string;
  /** Câu nói rõ đang theo dõi gì, ở ngưỡng nào. Bắt buộc để ô rỗng có nghĩa. */
  watchingHint: string;
}) {
  const has = alerts.length > 0;

  return (
    <section
      aria-label={title}
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
          {has ? (
            <AlertOctagon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <h2 className="text-sm font-bold tracking-tight text-slate-800">{title}</h2>
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
          <p className="text-sm font-semibold text-emerald-700">{emptyTitle}</p>
          <p className="max-w-xs text-xs text-slate-400">{watchingHint}</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {alerts.map((a) => {
            const Icon = a.icon;
            const clickable = Boolean(a.onOpen);
            return (
              <li key={a.id}>
                <div
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={a.onOpen}
                  onKeyDown={(e) => {
                    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      a.onOpen?.();
                    }
                  }}
                  className={`flex items-start gap-3 px-4 py-2.5 ${clickable ? ROW_HOVER : ''}`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${BIZ_TONE[a.domain].chip}`}
                    title={a.kindLabel}
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

export default memo(MosAlertPanel);
