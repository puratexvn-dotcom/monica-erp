'use client';

import { useMemo, useState } from 'react';
import { Search, TriangleAlert, Maximize2, PackageSearch } from 'lucide-react';

import { Badge, inputCls } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { DataTable, tdCls, Metric, fmtDate, fmtNum, fmtMoney } from './tab-kit';
import Po360Sheet from './po-360-sheet';
import { PO_STATUS_LABEL, RISK_LEVEL_LABEL, ORDER_TYPE_LABEL, labelOf } from './labels';
import type { PoRow } from '@/schemas/md';

// ============================================================================
// BẢNG DANH SÁCH ĐƠN HÀNG — cửa vào của PO 360°
//
// Lọc và tìm kiếm làm NGAY TRÊN CLIENT vì service đã giới hạn 500 dòng: gọi
// lại máy chủ cho mỗi ký tự gõ vào ô tìm kiếm là lãng phí trên mạng xưởng.
// Khi vượt 500 PO thì phải chuyển sang lọc phía máy chủ — ghi lại đây để lần
// sau không phải đoán ngưỡng.
// ============================================================================

type Filter = 'all' | 'late' | 'risk';

export default function PoList({
  rows,
  error,
  onRefresh,
}: {
  rows: PoRow[];
  error: string | null;
  onRefresh: () => void | Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<{ id: string; po: string } | null>(null);

  const stats = useMemo(
    () => ({
      total: rows.length,
      late: rows.filter((r) => r.late_milestones > 0).length,
      risky: rows.filter((r) => r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL').length,
      qty: rows.reduce((s, r) => s + r.total_quantity, 0),
    }),
    [rows],
  );

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === 'late' && r.late_milestones === 0) return false;
      if (filter === 'risk' && r.risk_level !== 'HIGH' && r.risk_level !== 'CRITICAL') return false;
      if (!kw) return true;
      return [r.po_number, r.style_no, r.style_name, r.customer_name, r.factory_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw));
    });
  }, [rows, q, filter]);

  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  const FILTERS: Array<{ key: Filter; label: string; count: number }> = [
    { key: 'all', label: 'Tất cả', count: stats.total },
    { key: 'late', label: 'Trễ tiến độ', count: stats.late },
    { key: 'risk', label: 'Rủi ro cao', count: stats.risky },
  ];

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Tổng đơn hàng" value={fmtNum(stats.total)} />
        <Metric label="Tổng sản lượng" value={fmtNum(stats.qty)} sub="sản phẩm" />
        <Metric
          label="Trễ tiến độ"
          value={fmtNum(stats.late)}
          tone={stats.late > 0 ? 'rose' : 'emerald'}
          sub={stats.late > 0 ? 'cần xử lý ngay' : 'đúng lịch'}
        />
        <Metric
          label="Rủi ro cao"
          value={fmtNum(stats.risky)}
          tone={stats.risky > 0 ? 'amber' : 'emerald'}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm mã PO, mã hàng, khách hàng..."
            aria-label="Tìm đơn hàng"
            className={`${inputCls} pl-9`}
          />
        </div>

        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${
              filter === f.key
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
            }`}
          >
            {f.label}
            <span className="ml-1.5 tabular-nums opacity-70">{f.count}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <NoData
          title={rows.length === 0 ? 'Chưa có đơn hàng nào' : 'Không có đơn hàng khớp bộ lọc'}
          sub={rows.length === 0 ? 'Bấm Tạo PO để lập đơn đầu tiên.' : 'Thử xoá từ khoá hoặc đổi bộ lọc.'}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataTable
            head={['Mã PO', 'Mã hàng', 'Khách hàng', 'Số lượng', 'Ngày giao', 'Hình thức', 'Trạng thái', 'Cảnh báo', '']}
            minWidth={1080}
          >
            {shown.map((r) => (
              <tr key={r.id} className="transition hover:bg-slate-50/70">
                <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{r.po_number}</td>
                <td className={tdCls}>
                  {r.style_no ? (
                    <span className="block">
                      <span className="block font-medium text-slate-800">{r.style_no}</span>
                      <span className="block truncate text-xs text-slate-400">{r.style_name}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-600">Chưa gắn mã hàng</span>
                  )}
                </td>
                <td className={tdCls}>{r.customer_name}</td>
                <td className={`${tdCls} tabular-nums font-semibold`}>
                  {fmtNum(r.total_quantity)}
                  {r.unit_price && (
                    <span className="block text-xs font-normal text-slate-400">
                      {fmtMoney(r.unit_price, r.currency)}/sp
                    </span>
                  )}
                </td>
                <td className={tdCls}>{fmtDate(r.delivery_date)}</td>
                <td className={`${tdCls} text-xs text-slate-500`}>
                  {r.order_type ? labelOf(ORDER_TYPE_LABEL, r.order_type).split(' — ')[0] : '—'}
                </td>
                <td className={tdCls}>
                  <Badge tone="indigo">{labelOf(PO_STATUS_LABEL, r.status)}</Badge>
                </td>
                <td className={tdCls}>
                  <span className="flex flex-wrap gap-1.5">
                    {r.late_milestones > 0 && (
                      <Badge tone="rose" icon={TriangleAlert}>
                        Trễ {r.late_milestones} mốc
                      </Badge>
                    )}
                    {(r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL') && (
                      <Badge tone="amber">{RISK_LEVEL_LABEL[r.risk_level as 'HIGH' | 'CRITICAL']}</Badge>
                    )}
                    {r.late_milestones === 0 && !r.risk_level && (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </span>
                </td>
                <td className={tdCls}>
                  <button
                    type="button"
                    onClick={() => setOpen({ id: r.id, po: r.po_number })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Mở 360°
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      <Po360Sheet
        orderId={open?.id ?? null}
        poNumber={open?.po ?? null}
        onClose={() => setOpen(null)}
      />
    </>
  );
}

export { PackageSearch };
