'use client';

import { memo } from 'react';
import { ChevronRight } from 'lucide-react';

import { EmptyState, thCls, tdCls } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';
import type { AssignmentSummaryDTO } from '@/lib/mos/contracts/assignment.contract';

import { AssignmentPriorityChip, AssignmentStatusChip } from './assignment-chips';
import { ScopeSummary } from './scope-summary';

// ============================================================================
// BẢNG PHẦN VIỆC
//
// ⚠️ `React.memo` kèm prop ỔN ĐỊNH (chuẩn UI mục 5.1). `onOpen` phải được dựng
// bằng `useCallback` ở phía gọi, nếu không mỗi lần cha render lại là một hàm
// mới, `memo` so sánh thấy khác, và cả bảng vẽ lại — tức là `memo` chỉ tốn thêm
// một phép so sánh mà không tiết kiệm gì.
//
// ⚠️ Bảng có `overflow-x-auto` RIÊNG và `min-w` cho `<table>` (chuẩn UI 3.4):
// bảng cuộn trong lòng nó, không kéo cả trang cuộn ngang.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

/**
 * ⚠️ `—` và `0` là hai chuyện khác hẳn nhau (chuẩn UI mục 4.1).
 * `0` = đã đọc được và đúng bằng không. `—` = chưa có / không đọc được.
 * Hiện `0` cho một ô chưa nhập số lượng là nói dối bằng số.
 */
const num = (v: number | null) => (v === null ? '—' : nf.format(v));
const txt = (v: string | null) => (v === null || v === '' ? '—' : v);

/** `2026-08-01 → 01/08` — bảng đã chật, năm hiếm khi cần cho việc đang chạy. */
function shortDate(iso: string | null): string {
  if (!iso) return '—';
  const [, m, d] = iso.slice(0, 10).split('-');
  return m && d ? `${d}/${m}` : '—';
}

export interface AssignmentTableProps {
  rows: AssignmentSummaryDTO[];
  onOpen: (assignmentId: string) => void;
}

function AssignmentTableBase({ rows, onOpen }: AssignmentTableProps) {
  const { t } = useLanguage();

  if (rows.length === 0) {
    return <EmptyState title={t('asg_empty')} sub={t('asg_empty_sub')} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse">
        <thead className="border-b border-slate-100 bg-slate-50/60">
          <tr>
            <th className={thCls}>{t('asg_col_no')}</th>
            <th className={thCls}>{t('asg_col_partner')}</th>
            <th className={thCls}>{t('asg_col_po')}</th>
            <th className={thCls}>{t('asg_col_scope')}</th>
            <th className={`${thCls} text-right`}>{t('asg_col_qty')}</th>
            <th className={thCls}>{t('asg_col_plan')}</th>
            <th className={thCls}>{t('asg_col_owner')}</th>
            <th className={thCls}>{t('asg_col_status')}</th>
            <th className={thCls} aria-hidden />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((a) => (
            <tr
              key={a.id}
              onClick={() => onOpen(a.id)}
              className="cursor-pointer transition hover:bg-blue-50/40"
            >
              <td className={`${tdCls} font-mono text-xs font-semibold text-slate-800`}>
                {a.assignmentNo}
              </td>

              <td className={tdCls}>
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-800">{txt(a.partnerName)}</div>
                  {a.partnerCode && (
                    <div className="truncate text-xs text-slate-500">{a.partnerCode}</div>
                  )}
                </div>
              </td>

              <td className={tdCls}>
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-800">{txt(a.poNumber)}</div>
                  {a.styleCode && (
                    <div className="truncate text-xs text-slate-500">{a.styleCode}</div>
                  )}
                </div>
              </td>

              {/* Ô rộng nhất — cho phép xuống dòng thay vì cắt cụt phạm vi. */}
              <td className="px-4 py-3 text-sm text-slate-700">
                <ScopeSummary a={a} />
              </td>

              <td className={`${tdCls} text-right tabular-nums`}>
                {num(a.assignedQty)}
                {a.uom && <span className="ml-1 text-xs text-slate-400">{a.uom}</span>}
              </td>

              <td className={`${tdCls} tabular-nums text-slate-600`}>
                {shortDate(a.plannedStart)} – {shortDate(a.plannedFinish)}
              </td>

              <td className={tdCls}>{txt(a.ownerName)}</td>

              <td className={tdCls}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <AssignmentStatusChip status={a.status} />
                  <AssignmentPriorityChip priority={a.priority} />
                </div>
              </td>

              <td className={tdCls}>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const AssignmentTable = memo(AssignmentTableBase);
