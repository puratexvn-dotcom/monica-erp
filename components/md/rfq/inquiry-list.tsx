'use client';

import { useMemo, useState, useTransition } from 'react';
import { Search, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, inputCls } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { DataTable, tdCls, Metric, fmtDate, fmtNum, fmtMoney } from '../po/tab-kit';
import {
  INQUIRY_STATUSES, INQUIRY_STATUS_LABEL, ORDER_TYPE_LABEL, labelOf, vnToday,
} from '../po/labels';
import { setInquiryStatus } from '@/app/(dashboard)/md/_actions/commercial.actions';
import type { InquiryRow } from '@/schemas/md';

// ============================================================================
// BẢNG YÊU CẦU BÁO GIÁ
//
// Cột "Hạn báo giá" tự bôi đỏ khi quá hạn mà chưa chuyển sang Đã báo giá /
// Đã chốt / Không trúng. Trễ hạn báo giá là mất đơn — phải nhìn thấy ngay khi
// mở bảng, không phải tự nhẩm ngày trong đầu.
// ============================================================================

const CLOSED = new Set(['QUOTED', 'WON', 'LOST', 'CANCELLED']);

function toneOf(status: string) {
  if (status === 'WON') return 'emerald' as const;
  if (status === 'LOST' || status === 'CANCELLED') return 'rose' as const;
  if (status === 'QUOTED') return 'indigo' as const;
  return 'amber' as const;
}

export default function InquiryList({
  rows,
  error,
  onRefresh,
}: {
  rows: InquiryRow[];
  error: string | null;
  onRefresh: () => void | Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [pending, startTransition] = useTransition();
  const today = vnToday();

  const isOverdue = (r: InquiryRow) =>
    Boolean(r.due_date) && r.due_date! < today && !CLOSED.has(r.status);

  const stats = useMemo(
    () => ({
      total: rows.length,
      open: rows.filter((r) => !CLOSED.has(r.status)).length,
      won: rows.filter((r) => r.status === 'WON').length,
      overdue: rows.filter(isOverdue).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, today],
  );

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.inquiry_no, r.customer_name, r.product_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw)),
    );
  }, [rows, q]);

  const change = (id: string, status: string) => {
    startTransition(async () => {
      const res = await setInquiryStatus(id, status);
      if (res.ok) {
        toast.success('Đã cập nhật', { description: res.message });
        await onRefresh();
      } else {
        toast.error('Không cập nhật được', { description: res.message });
      }
    });
  };

  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  // Tỷ lệ thắng chỉ tính trên các yêu cầu ĐÃ CÓ KẾT QUẢ. Chia cho tổng số kể
  // cả những cái còn đang chờ sẽ luôn ra một con số thấp giả tạo.
  const decided = rows.filter((r) => r.status === 'WON' || r.status === 'LOST').length;
  const winRate = decided > 0 ? (stats.won / decided) * 100 : null;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Tổng yêu cầu" value={fmtNum(stats.total)} />
        <Metric label="Đang mở" value={fmtNum(stats.open)} tone="indigo" sub="chưa có kết quả" />
        <Metric
          label="Quá hạn báo giá"
          value={fmtNum(stats.overdue)}
          tone={stats.overdue > 0 ? 'rose' : 'emerald'}
          sub={stats.overdue > 0 ? 'cần báo giá ngay' : 'không có cái nào trễ'}
        />
        <Metric
          label="Tỷ lệ thắng"
          value={winRate === null ? '—' : `${winRate.toFixed(1)}%`}
          sub={winRate === null ? 'chưa yêu cầu nào có kết quả' : `trên ${decided} yêu cầu đã có kết quả`}
          tone="emerald"
        />
      </div>

      <div className="relative mb-3 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm số yêu cầu, khách hàng, sản phẩm..."
          aria-label="Tìm yêu cầu báo giá"
          className={`${inputCls} pl-9`}
        />
      </div>

      {shown.length === 0 ? (
        <NoData
          title={rows.length === 0 ? 'Chưa có yêu cầu báo giá nào' : 'Không có yêu cầu khớp từ khoá'}
          sub={
            rows.length === 0
              ? 'Yêu cầu báo giá là chặng đầu: nhận yêu cầu → chiết tính giá → báo giá → chốt đơn.'
              : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataTable
            head={['Số yêu cầu', 'Khách hàng', 'Sản phẩm', 'Hình thức', 'SL dự kiến', 'Giá mục tiêu', 'Ngày nhận', 'Hạn báo giá', 'Trạng thái']}
            minWidth={1180}
          >
            {shown.map((r) => {
              const late = isOverdue(r);
              return (
                <tr key={r.id} className="transition hover:bg-slate-50/70">
                  <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{r.inquiry_no}</td>
                  <td className={tdCls}>{r.customer_name}</td>
                  <td className={tdCls}>{r.product_name}</td>
                  <td className={`${tdCls} text-xs`}>{labelOf(ORDER_TYPE_LABEL, r.order_type)}</td>
                  <td className={`${tdCls} tabular-nums`}>{fmtNum(r.expected_qty)}</td>
                  <td className={`${tdCls} tabular-nums`}>{fmtMoney(r.target_price, r.currency)}</td>
                  <td className={tdCls}>{fmtDate(r.received_date)}</td>
                  <td className={tdCls}>
                    {late ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                        {fmtDate(r.due_date)}
                      </span>
                    ) : (
                      fmtDate(r.due_date)
                    )}
                  </td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <Badge tone={toneOf(r.status)}>{labelOf(INQUIRY_STATUS_LABEL, r.status)}</Badge>
                      <select
                        aria-label={`Đổi trạng thái ${r.inquiry_no}`}
                        value={r.status}
                        disabled={pending}
                        onChange={(e) => change(r.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs font-semibold text-slate-600"
                      >
                        {INQUIRY_STATUSES.map((s) => (
                          <option key={s} value={s}>{INQUIRY_STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </div>
      )}
    </>
  );
}
