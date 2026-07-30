'use client';

import { useMemo, useState } from 'react';
import { Maximize2, Search } from 'lucide-react';

import { Badge, inputCls } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { DataTable, tdCls, Metric, fmtNum } from '../po/tab-kit';
import { CURRENCY_LABEL, INCOTERM_LABEL, labelOf } from '../po/labels';
import Customer360Sheet from './customer-360-sheet';
import type { CustomerRow } from '@/schemas/md';

// ============================================================================
// DANH SÁCH KHÁCH HÀNG — CỬA VÀO HỒ SƠ 360°
//
// Cột "Đúng hạn" và "Đạt chất lượng" đọc từ KPI lưu sẵn trong bảng, không tính
// tại chỗ: tính lại từ toàn bộ lịch sử đơn mỗi lần mở trang sẽ quét hàng nghìn
// dòng chỉ để hiện hai con số. Chưa từng tính thì hiện "—", không hiện 0.
// ============================================================================

export default function CustomerList({
  rows,
  error,
  onRefresh,
}: {
  rows: CustomerRow[];
  error: string | null;
  onRefresh: () => void | Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<CustomerRow | null>(null);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.is_active).length,
      withOrders: rows.filter((r) => r.order_count > 0).length,
      orders: rows.reduce((s, r) => s + r.order_count, 0),
    }),
    [rows],
  );

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.customer_code, r.name, r.brand, r.country]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw)),
    );
  }, [rows, q]);

  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Tổng khách hàng" value={fmtNum(stats.total)} />
        <Metric label="Đang giao dịch" value={fmtNum(stats.active)} tone="emerald" />
        <Metric label="Đã từng đặt hàng" value={fmtNum(stats.withOrders)} tone="indigo" />
        <Metric label="Tổng số đơn" value={fmtNum(stats.orders)} sub="cộng từ mọi khách hàng" />
      </div>

      <div className="relative mb-3 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm mã, tên, thương hiệu, quốc gia..."
          aria-label="Tìm khách hàng"
          className={`${inputCls} pl-9`}
        />
      </div>

      {shown.length === 0 ? (
        <NoData
          title={rows.length === 0 ? 'Chưa có khách hàng nào' : 'Không có khách hàng khớp từ khoá'}
          sub={
            rows.length === 0
              ? 'Khách hàng là gốc của mọi yêu cầu báo giá và đơn hàng. Thêm khách trước khi tạo PO.'
              : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataTable
            head={['Mã / Tên', 'Thương hiệu', 'Quốc gia', 'Đồng tiền', 'Điều kiện giao', 'Số đơn', 'Đúng hạn', 'Đạt CL', '']}
            minWidth={1080}
          >
            {shown.map((c) => (
              <tr key={c.id} className="transition hover:bg-slate-50/70">
                <td className={tdCls}>
                  <span className="block font-mono font-semibold text-slate-800">{c.customer_code}</span>
                  <span className="block truncate text-xs text-slate-400">{c.name}</span>
                </td>
                <td className={tdCls}>{c.brand ?? '—'}</td>
                <td className={tdCls}>{c.country ?? '—'}</td>
                <td className={`${tdCls} text-xs`}>{labelOf(CURRENCY_LABEL, c.currency)}</td>
                <td className={`${tdCls} text-xs`}>{labelOf(INCOTERM_LABEL, c.incoterm)}</td>
                <td className={`${tdCls} tabular-nums font-semibold text-indigo-700`}>{c.order_count}</td>
                <td className={`${tdCls} tabular-nums`}>
                  {c.kpi_on_time_rate === null ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <Badge tone={c.kpi_on_time_rate >= 95 ? 'emerald' : c.kpi_on_time_rate >= 85 ? 'amber' : 'rose'}>
                      {fmtNum(c.kpi_on_time_rate)}%
                    </Badge>
                  )}
                </td>
                <td className={`${tdCls} tabular-nums`}>
                  {c.kpi_quality_rate === null ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <Badge tone={c.kpi_quality_rate >= 97 ? 'emerald' : 'amber'}>
                      {fmtNum(c.kpi_quality_rate)}%
                    </Badge>
                  )}
                </td>
                <td className={tdCls}>
                  <button
                    type="button"
                    onClick={() => setOpen(c)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Hồ sơ 360°
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      <Customer360Sheet customer={open} onClose={() => setOpen(null)} onChanged={onRefresh} />
    </>
  );
}
