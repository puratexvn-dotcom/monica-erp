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
import { ArrowDownToLine, ArrowUpDown, ArrowUpFromLine, ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { Badge, thCls, tdCls, inputCls } from '@/components/ui';
import { ErrorState, NoData } from '@/components/data-state';
import { TX_LABEL, type TxRow, type TxType } from './wh-schema';

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const col = createColumnHelper<TxRow>();

export default function TxTable({
  rows,
  error,
  onRefresh,
}: {
  rows: TxRow[];
  error: string | null;
  onRefresh: () => void | Promise<void>;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(
    () => [
      col.accessor('created_at', {
        header: 'Thời gian',
        cell: (c) => <span className="tabular-nums text-slate-500">{fmtDateTime(c.getValue())}</span>,
      }),
      col.accessor('transaction_type', {
        header: 'Loại',
        filterFn: (row, id, value) =>
          !value || String(row.getValue(id)).toUpperCase() === String(value).toUpperCase(),
        cell: (c) => {
          const isIn = c.getValue().toUpperCase() === 'IN';
          return (
            <Badge tone={isIn ? 'emerald' : 'amber'} icon={isIn ? ArrowDownToLine : ArrowUpFromLine}>
              {TX_LABEL[c.getValue().toUpperCase() as TxType] ?? c.getValue()}
            </Badge>
          );
        },
      }),
      col.accessor('material_code', {
        header: 'Mã NPL',
        cell: (c) => <span className="font-mono font-semibold text-slate-800">{c.getValue()}</span>,
      }),
      col.accessor('material_name', { header: 'Tên NPL' }),
      col.accessor('quantity', {
        header: 'Số lượng',
        cell: (c) => {
          const r = c.row.original;
          const isIn = r.transaction_type.toUpperCase() === 'IN';
          return (
            <span className={`tabular-nums font-semibold ${isIn ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isIn ? '+' : '−'}
              {nf.format(c.getValue())} <span className="font-normal text-slate-400">{r.unit}</span>
            </span>
          );
        },
      }),
      col.accessor((r) => r.po_number ?? '', {
        id: 'po_number',
        header: 'PO tham chiếu',
        cell: (c) =>
          c.getValue() ? (
            <span className="font-mono text-slate-600">{c.getValue()}</span>
          ) : (
            <span className="text-slate-300">—</span>
          ),
      }),
      col.accessor((r) => r.reference_no ?? '', {
        id: 'reference_no',
        header: 'Chứng từ',
        cell: (c) => c.getValue() || <span className="text-slate-300">—</span>,
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

  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  const typeFilter = (table.getColumn('transaction_type')?.getFilterValue() as string) ?? '';
  const total = table.getFilteredRowModel().rows.length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Tìm theo mã NPL, tên, PO, chứng từ..."
            aria-label="Tìm giao dịch kho"
            className={`${inputCls} pl-9`}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => table.getColumn('transaction_type')?.setFilterValue(e.target.value || undefined)}
          aria-label="Lọc theo loại giao dịch"
          className={`${inputCls} w-auto min-w-[150px]`}
        >
          <option value="">Nhập và Xuất</option>
          <option value="IN">Chỉ Nhập kho</option>
          <option value="OUT">Chỉ Xuất kho</option>
        </select>

        <span className="text-sm font-semibold text-slate-500">{nf.format(total)} phiếu</span>
      </div>

      {rows.length === 0 ? (
        <NoData title="Chưa có giao dịch kho nào" sub="Bấm “Nhập kho” để lập phiếu nhập đầu tiên." />
      ) : total === 0 ? (
        <NoData title="Không có phiếu nào khớp bộ lọc" sub="Thử xoá từ khoá hoặc đổi loại giao dịch." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-slate-100">
                    {hg.headers.map((h) => (
                      <th key={h.id} className={thCls}>
                        <button
                          type="button"
                          onClick={h.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 transition hover:text-slate-700"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          <ArrowUpDown
                            className={`h-3.5 w-3.5 ${h.column.getIsSorted() ? 'text-blue-500' : 'text-slate-300'}`}
                            aria-hidden="true"
                          />
                        </button>
                      </th>
                    ))}
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
            <span className="text-sm text-slate-500">
              Trang <span className="font-semibold text-slate-700">{table.getState().pagination.pageIndex + 1}</span> /{' '}
              {table.getPageCount()}
            </span>
            <div className="flex items-center gap-2">
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                aria-label="Số dòng mỗi trang"
                className={`${inputCls} w-auto`}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} dòng</option>
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
