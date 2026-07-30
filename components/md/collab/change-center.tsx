'use client';

import { useMemo, useState, useTransition } from 'react';
import { ArrowRight, Check, Plus, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, inputCls } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { DataTable, tdCls, Metric, fmtDate, fmtNum } from '../po/tab-kit';
import { CHANGE_TYPE_LABEL, CHANGE_STATUS_LABEL, labelOf } from '../po/labels';
import { decideChangeRequest } from '@/app/(dashboard)/md/_actions/collaboration.actions';
import ChangeRequestDialog from './change-request-dialog';
import type { ChangeCenterRow } from '@/app/(dashboard)/md/_services/collaboration.service';
import type { PoRow } from '@/schemas/md';

// ============================================================================
// TRUNG TÂM YÊU CẦU THAY ĐỔI
//
// Khách đổi số lượng, đổi màu, dời ngày giao là chuyện xảy ra hằng tuần. Thứ
// hay mất là BẰNG CHỨNG: ban đầu đã chốt cái gì, ai đồng ý đổi, đổi lúc nào.
// Khi phát sinh chi phí do đổi phút chót, đây là căn cứ duy nhất để đòi khách.
//
// ⚠️ Duyệt CHỈ đổi trạng thái của yêu cầu, KHÔNG tự ghi giá trị mới vào đơn
// hàng. Giá trị mới là ô văn bản tự do do người dùng gõ; tự động áp vào số
// lượng thật sẽ có ngày ghi nhầm "5000 (chờ khách xác nhận)" thành số lượng.
// ============================================================================

function toneOf(s: string) {
  if (s === 'APPROVED') return 'emerald' as const;
  if (s === 'APPLIED') return 'indigo' as const;
  if (s === 'REJECTED') return 'rose' as const;
  return 'amber' as const;
}

export default function ChangeCenter({
  rows,
  error,
  pos,
  onRefresh,
}: {
  rows: ChangeCenterRow[];
  error: string | null;
  pos: ReadonlyArray<PoRow>;
  onRefresh: () => void | Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((r) => r.status === 'PENDING').length,
      approved: rows.filter((r) => r.status === 'APPROVED').length,
      applied: rows.filter((r) => r.status === 'APPLIED').length,
    }),
    [rows],
  );

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.request_no, r.po_number, r.old_value, r.new_value, r.reason]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw)),
    );
  }, [rows, q]);

  const decide = (id: string, decision: 'APPROVED' | 'REJECTED' | 'APPLIED') => {
    startTransition(async () => {
      const res = await decideChangeRequest(id, decision);
      if (res.ok) {
        toast.success('Đã cập nhật', { description: res.message });
        await onRefresh();
      } else {
        toast.error('Không cập nhật được', { description: res.message });
      }
    });
  };

  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Tổng yêu cầu" value={fmtNum(stats.total)} />
        <Metric
          label="Chờ duyệt"
          value={fmtNum(stats.pending)}
          tone={stats.pending > 0 ? 'amber' : 'emerald'}
          sub={stats.pending > 0 ? 'cần quyết định' : 'không tồn đọng'}
        />
        <Metric label="Đã duyệt" value={fmtNum(stats.approved)} tone="emerald" sub="chưa áp vào đơn" />
        <Metric label="Đã áp dụng" value={fmtNum(stats.applied)} tone="indigo" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm số yêu cầu, mã PO, nội dung..."
            aria-label="Tìm yêu cầu thay đổi"
            className={`${inputCls} pl-9`}
          />
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Tạo yêu cầu thay đổi
        </button>
      </div>

      {shown.length === 0 ? (
        <NoData
          title={rows.length === 0 ? 'Chưa có yêu cầu thay đổi nào' : 'Không có yêu cầu khớp từ khoá'}
          sub={
            rows.length === 0
              ? 'Mỗi lần khách đổi số lượng, màu, size hay ngày giao, hãy ghi lại ở đây kèm giá trị cũ — đó là bằng chứng khi phát sinh chi phí.'
              : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataTable
            head={['Số yêu cầu', 'Mã PO', 'Loại thay đổi', 'Cũ → Mới', 'Lý do', 'Người gửi', 'Ngày gửi', 'Trạng thái', '']}
            minWidth={1280}
          >
            {shown.map((r) => (
              <tr key={r.id} className="transition hover:bg-slate-50/70">
                <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{r.request_no}</td>
                <td className={`${tdCls} font-mono text-xs`}>{r.po_number ?? '—'}</td>
                <td className={`${tdCls} text-xs`}>{labelOf(CHANGE_TYPE_LABEL, r.change_type)}</td>
                <td className={`${tdCls} whitespace-normal`}>
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 line-through">
                      {r.old_value ?? '—'}
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-800">
                      {r.new_value ?? '—'}
                    </span>
                  </span>
                </td>
                <td className={`${tdCls} max-w-xs truncate text-xs text-slate-500`} title={r.reason ?? ''}>
                  {r.reason ?? '—'}
                </td>
                <td className={`${tdCls} text-xs`}>{r.requested_by_name ?? '—'}</td>
                <td className={tdCls}>{fmtDate(r.created_at)}</td>
                <td className={tdCls}>
                  <Badge tone={toneOf(r.status)}>{labelOf(CHANGE_STATUS_LABEL, r.status)}</Badge>
                </td>
                <td className={tdCls}>
                  {r.status === 'PENDING' ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => decide(r.id, 'APPROVED')}
                        aria-label={`Duyệt ${r.request_no}`}
                        className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => decide(r.id, 'REJECTED')}
                        aria-label={`Từ chối ${r.request_no}`}
                        className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : r.status === 'APPROVED' ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => decide(r.id, 'APPLIED')}
                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                    >
                      Đã áp vào PO
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {r.approved_by_name ? `bởi ${r.approved_by_name}` : ''}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      <ChangeRequestDialog
        open={dialogOpen}
        pos={pos}
        onClose={() => setDialogOpen(false)}
        onCreated={onRefresh}
      />
    </>
  );
}
