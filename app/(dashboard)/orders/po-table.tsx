'use client';

import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { Badge, thCls, tdCls, inputCls, type Tone } from '@/components/ui';
import { TableSkeleton, ErrorState, NoData } from '@/components/data-state';
import { PO_STATUSES, PO_STATUS_LABEL, type PoRow, type PoStatus } from './po-schema';

const nf = new Intl.NumberFormat('vi-VN');

const STATUS_TONE: Record<PoStatus, Tone> = {
  APPROVED: 'indigo',
  IN_PRODUCTION: 'amber',
  COMPLETED: 'emerald',
  SHIPPED: 'slate',
  CANCELLED: 'rose',
};

function statusLabel(raw: string): string {
  const key = raw.toUpperCase() as PoStatus;
  return PO_STATUS_LABEL[key] ?? raw;
}
function statusTone(raw: string): Tone {
  const key = raw.toUpperCase() as PoStatus;
  return STATUS_TONE[key] ?? 'slate';
}

/** dd/mm/yyyy — cột ngày trong ERP đọc theo định dạng Việt Nam */
function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const col = createColumnHelper<PoRow>();

export default function PoTable({
  rows,
  loading,
  error,
  onRefresh,
}: {
  rows: PoRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void | Promise<void>;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'delivery_date', desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(
    () => [
      col.accessor('po_number', {
        header: 'Mã PO',
        cell: (c) => <span className="font-mono font-semibold text-slate-800">{c.getValue()}</span>,
      }),
      col.accessor('customer_name', { header: 'Khách hàng' }),
      col.accessor('style_code', {
        header: 'Style',
        cell: (c) => <span className="font-mono text-slate-600">{c.getValue()}</span>,
      }),
      col.accessor('total_quantity', {
        header: 'Số lượng',
        cell: (c) => (
          <span className="tabular-nums font-semibold text-slate-800">{nf.format(c.getValue())}</span>
        ),
      }),
      col.accessor('delivery_date', {
        header: 'Ngày giao',
        cell: (c) => <span className="tabular-nums">{fmtDate(c.getValue())}</span>,
      }),
      col.accessor('status', {
        header: 'Trạng thái',
        // Lọc so khớp tuyệt đối, không dùng "chứa": COMPLETED sẽ dính cả khi
        // người dùng chọn riêng một trạng thái khác có chung tiền tố.
        filterFn: (row, id, value) =>
          !value || String(row.getValue(id)).toUpperCase() === String(value).toUpperCase(),
        cell: (c) => <Badge tone={statusTone(c.getValue())}>{statusLabel(c.getValue())}</Badge>,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (loading) return <TableSkeleton columns={6} rows={8} />;
  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  const statusFilter = (table.getColumn('status')?.getFilterValue() as string) ?? '';
  const total = table.getFilteredRowModel().rows.length;

  return (
    <div>
      {/* ── Thanh lọc ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3.5">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Tìm theo mã PO, khách hàng, style..."
            aria-label="Tìm đơn hàng"
            className={`${inputCls} pl-9`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value || undefined)}
          aria-label="Lọc theo trạng thái"
          className={`${inputCls} w-auto min-w-[160px]`}
        >
          <option value="">Tất cả trạng thái</option>
          {PO_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PO_STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        <span className="text-sm font-semibold text-slate-500">{nf.format(total)} đơn</span>
      </div>

      {rows.length === 0 ? (
        <NoData title="Chưa có đơn hàng nào" sub="Bấm “Tạo PO” để thêm đơn hàng đầu tiên." />
      ) : total === 0 ? (
        <NoData title="Không có đơn nào khớp bộ lọc" sub="Thử xoá từ khoá hoặc chọn lại trạng thái." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-slate-100">
                    {hg.headers.map((h) => {
                      const sorted = h.column.getIsSorted();
                      return (
                        <th key={h.id} className={thCls}>
                          <button
                            type="button"
                            onClick={h.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1.5 transition hover:text-slate-700"
                            aria-label={`Sắp xếp theo ${String(h.column.columnDef.header)}`}
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            <ArrowUpDown
                              className={`h-3.5 w-3.5 ${sorted ? 'text-indigo-500' : 'text-slate-300'}`}
                              aria-hidden="true"
                            />
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-50">
                {table.getRowModel().rows.map((r) => (
                  <tr key={r.id} className="transition hover:bg-slate-50/70">
                    {r.getVisibleCells().map((c) => (
                      <td key={c.id} className={tdCls}>
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Phân trang ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
            <span className="text-sm text-slate-500">
              Trang{' '}
              <span className="font-semibold text-slate-700">
                {table.getState().pagination.pageIndex + 1}
              </span>{' '}
              / {table.getPageCount()}
            </span>

            <div className="flex items-center gap-2">
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                aria-label="Số dòng mỗi trang"
                className={`${inputCls} w-auto`}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} dòng
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Trang trước"
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Trang sau"
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
