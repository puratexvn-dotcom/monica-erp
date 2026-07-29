import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

// ============================================================================
// Ba trạng thái mà MỌI bảng dữ liệu đều phải xử lý: đang tải / lỗi / rỗng.
// Gom về một chỗ để các module không mỗi nơi vẽ một kiểu.
// ============================================================================

/** Khung xương bảng — số cột và số dòng khớp bảng thật để không giật layout */
export function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <div className="p-5" aria-busy="true" aria-label="Đang tải dữ liệu">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-4 animate-pulse rounded bg-slate-100"
                // Cột đầu hẹp (mã), cột thứ hai rộng (tên) — mô phỏng nhịp thật
                style={{ width: c === 1 ? '28%' : c === 0 ? '12%' : '15%' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-5 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="max-w-md text-sm font-semibold text-slate-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Thử lại
        </button>
      )}
    </div>
  );
}

export function NoData({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-slate-400">
      <Inbox className="h-8 w-8" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {sub && <p className="max-w-sm text-xs">{sub}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
