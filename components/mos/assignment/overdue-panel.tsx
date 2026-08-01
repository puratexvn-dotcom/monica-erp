'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Card } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';
import type { OverdueSummaryDTO } from '@/lib/mos/contracts/assignment.contract';

// ============================================================================
// PHẦN VIỆC TRỄ BÁO CÁO
//
// ⚠️ Đây là cách `REPORT MISSING` **có răng**. Không có bảng này thì đối tác im
// lặng vài ngày cũng không ai biết, và tới `planned_finish` mới vỡ lẽ.
//
// ⚠️ `totalOverdue` lấy THẲNG từ máy chủ, component KHÔNG cộng lại. Cộng ở đây
// sẽ ra số khác khi danh sách bị cắt bớt, và hai con số cùng tên mà khác giá trị
// là thứ làm người vận hành mất niềm tin vào cả bảng điều khiển.
// ============================================================================

export interface OverduePanelProps {
  rows: OverdueSummaryDTO[];
  totalOverdue: number;
  isLoading: boolean;
  error: string | null;
  onOpen: (assignmentId: string) => void;
}

/** `2026-08-04 → 04/08/2026` — ngày trễ cần đủ năm, người ta sẽ đối chiếu sổ. */
function fullDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
}

export function OverduePanel({ rows, totalOverdue, isLoading, error, onOpen }: OverduePanelProps) {
  const { t } = useLanguage();

  return (
    <Card title={t('asg_overdue_title')} icon={AlertTriangle}>
      {/* ⚠️ Lỗi phải NÓI RA, không nuốt (chuẩn UI 4.7). Danh sách rỗng vì lỗi
          và danh sách rỗng vì không có gì trễ là HAI SỰ THẬT khác nhau — chỉ
          một trong hai được phép hiện thành "không có phần việc nào trễ". */}
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{t('asg_no_overdue')}</span>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-rose-700">
            {t('asg_overdue_days').replace('{0}', String(totalOverdue))}
          </p>

          {rows.map((r) => (
            <button
              key={r.assignmentId}
              type="button"
              onClick={() => onOpen(r.assignmentId)}
              // ≥44px vùng chạm + touch-manipulation (chuẩn UI 3.6)
              className="flex min-h-[44px] w-full touch-manipulation items-center gap-3 rounded-lg
                         border border-rose-200 bg-rose-50 px-3 py-2 text-left transition
                         hover:bg-rose-100 active:scale-[0.99]"
            >
              {/* Vạch màu dọc — mắt bắt được mức nghiêm trọng trước khi đọc chữ */}
              <span className="h-8 w-1 shrink-0 rounded-full bg-rose-500" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-xs font-semibold text-slate-800">
                  {r.assignmentNo}
                </span>
                <span className="block truncate text-xs text-slate-600">
                  {t('asg_overdue_since').replace('{0}', fullDate(r.oldestMissing))}
                </span>
              </span>
              <span className="shrink-0 rounded-md bg-rose-600 px-2 py-1 text-xs font-bold tabular-nums text-white">
                {r.overdueCount}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
