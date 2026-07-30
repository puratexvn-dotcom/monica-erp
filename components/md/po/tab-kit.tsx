'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';

import { Badge, thCls, tdCls, type Tone } from '@/components/ui';

// ============================================================================
// BỘ HIỂN THỊ DÙNG CHUNG CHO 10 TAB CỦA PO 360°
//
// Mười tab đều lặp đúng ba việc: báo lỗi, báo rỗng, và vẽ một bảng. Gom vào
// đây để mười file tab chỉ còn phần KHÁC NHAU là cột và dữ liệu.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
export const fmtNum = (n: number | null | undefined) => (n === null || n === undefined ? '—' : nf.format(n));

/** Ngày dạng dd/mm/yyyy. Trả "—" khi trống thay vì chuỗi rỗng, để ô bảng
 *  không bị hụt và người đọc biết là chưa có dữ liệu chứ không phải lỗi. */
export function fmtDate(v: string | null | undefined): string {
  if (!v) return '—';
  const [y, m, d] = v.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function fmtMoney(n: number | null | undefined, currency: string | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(n)} ${currency ?? ''}`.trim();
}

/** Khung một tab: xử lý sẵn lỗi và trạng thái rỗng.
 *  Lỗi và rỗng phải PHÂN BIỆT rõ — "không đọc được" mà hiện thành "chưa có dữ
 *  liệu" sẽ khiến người vận hành tưởng đơn hàng chưa phát sinh gì. */
export function TabSection({
  title,
  error,
  isEmpty,
  emptyTitle,
  emptyHint,
  action,
  children,
}: {
  title?: string;
  error?: string | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          {title && (
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">{title}</h3>
          )}
          {action}
        </div>
      )}

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 px-4 py-6 text-sm font-semibold text-rose-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center text-slate-400">
          <Inbox className="h-7 w-7" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-600">{emptyTitle ?? 'Chưa có dữ liệu'}</p>
          {emptyHint && <p className="max-w-sm text-xs">{emptyHint}</p>}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

/** Bảng cuộn ngang. min-w bắt buộc: không đặt thì trên điện thoại các cột bị
 *  bóp lại tới mức chữ xuống dòng từng ký tự. */
export function DataTable({
  head,
  minWidth = 640,
  children,
}: {
  head: ReadonlyArray<string>;
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-slate-100">
            {head.map((h) => (
              <th key={h} className={thCls}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">{children}</tbody>
      </table>
    </div>
  );
}

export { tdCls };

/** Ô chỉ số nhỏ dùng trong tab Tổng quan */
export function Metric({
  label,
  value,
  sub,
  tone = 'slate',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
}) {
  const ring: Record<Tone, string> = {
    indigo: 'border-blue-200 bg-blue-50/50',
    emerald: 'border-emerald-200 bg-emerald-50/50',
    rose: 'border-rose-200 bg-rose-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    slate: 'border-slate-200 bg-slate-50/50',
  };
  return (
    <div className={`rounded-xl border p-3 ${ring[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-extrabold tabular-nums tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

/** Nhãn trạng thái tiếng Việt. Tra không thấy thì hiện mã gốc thay vì để
 *  trống — người vận hành còn biết mà báo lại là thiếu nhãn. */
export function StatusBadge({
  code,
  labels,
  tone = 'indigo',
  icon,
}: {
  code: string | null | undefined;
  labels: Record<string, string>;
  tone?: Tone;
  icon?: React.ElementType;
}) {
  if (!code) return <span className="text-slate-400">—</span>;
  return (
    <Badge tone={tone} icon={icon}>
      {labels[code] ?? code}
    </Badge>
  );
}
