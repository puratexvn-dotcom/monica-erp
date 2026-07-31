'use client';

import { memo, useMemo, useState } from 'react';
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel,
  useReactTable, type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Maximize2, PackageX, Search, TriangleAlert } from 'lucide-react';

import { inputCls } from '@/components/ui';
import { ROW_HOVER } from '@/components/md/semantic-tone';
import {
  MATERIAL_CATEGORY_LABEL, SUB_CATEGORY_LABEL, UOM_LABEL, ZONE_TYPE_LABEL,
  isBelowMin, labelOf, type StockRow,
} from '@/schemas/warehouse';

// ============================================================================
// BẢNG TỒN KHO CHÍNH (§7)
//
// ─── 20% TRÊN BẢNG, 80% TRONG DÒNG MỞ RỘNG ────────────────────────────────
// Đề bài có 12 cột. Nhét cả 12 lên bảng thì trên màn 1366px mỗi cột còn 90px,
// tên vật tư tiếng Việt bị cắt cụt và không ai đọc nổi. Bảng chỉ giữ những cột
// dùng để RA QUYẾT ĐỊNH: mã, tên, vị trí, ba con số tồn, trạng thái. Màu, size,
// lô, nhà cung cấp, đơn giá nằm trong dòng mở rộng — bấm mũi tên là thấy, không
// phải rời màn hình.
//
// ─── BA CON SỐ TỒN LUÔN ĐI CÙNG NHAU ──────────────────────────────────────
// Tồn thực tế · Giữ chỗ · Có sẵn. Hiện riêng "tồn thực tế" là mời người ta cấp
// phát nhầm phần hàng đã có chủ.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
const nfMoney = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const num = (n: number | null | undefined) => (n === null || n === undefined ? '—' : nf.format(n));

const th = 'px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap';
const td = 'px-3 py-2 text-sm text-slate-700 whitespace-nowrap';

function StockTable({
  rows,
  error,
  onOpenMaterial,
}: {
  rows: StockRow[];
  error: string | null;
  onOpenMaterial: (row: StockRow) => void;
}) {
  const [q, setQ] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const columns = useMemo<ColumnDef<StockRow>[]>(
    () => [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((s) => ({ ...s, [row.original.id]: !s[row.original.id] }));
            }}
            aria-label={expanded[row.original.id] ? 'Thu gọn chi tiết' : 'Xem chi tiết'}
            className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
          >
            {expanded[row.original.id] ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        ),
      },
      {
        accessorKey: 'material_code',
        header: 'Mã vật tư',
        cell: ({ row }) => (
          <span className="block font-mono text-xs font-bold text-slate-800">{row.original.material_code}</span>
        ),
      },
      {
        accessorKey: 'material_name',
        header: 'Tên vật tư',
        cell: ({ row }) => (
          <span className="block max-w-[16rem] truncate" title={row.original.material_name}>
            {row.original.material_name}
            <span className="ml-1.5 text-[10px] text-slate-400">
              {labelOf(MATERIAL_CATEGORY_LABEL, row.original.category)}
            </span>
          </span>
        ),
      },
      {
        accessorKey: 'bin_path',
        header: 'Vị trí kho',
        cell: ({ row }) =>
          row.original.bin_path ? (
            <span className="font-mono text-[11px] text-slate-600">{row.original.bin_path}</span>
          ) : (
            // Chưa xếp chỗ là vấn đề thật: thủ kho sẽ không tìm ra khi cần lấy.
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
              <TriangleAlert className="h-3 w-3" aria-hidden="true" /> Chưa xếp chỗ
            </span>
          ),
      },
      {
        accessorKey: 'on_hand_qty',
        header: 'Tồn thực tế',
        cell: ({ row }) => <span className="tabular-nums">{num(row.original.on_hand_qty)}</span>,
      },
      {
        accessorKey: 'reserved_qty',
        header: 'Giữ chỗ',
        cell: ({ row }) => (
          <span className={`tabular-nums ${row.original.reserved_qty > 0 ? 'font-semibold text-purple-800' : 'text-slate-400'}`}>
            {num(row.original.reserved_qty)}
          </span>
        ),
      },
      {
        accessorKey: 'available_qty',
        header: 'Có sẵn',
        cell: ({ row }) => {
          const low = isBelowMin(row.original.available_qty, row.original.min_stock_qty);
          return (
            <span
              className={`inline-flex items-center gap-1 tabular-nums font-bold ${low ? 'text-red-800' : 'text-emerald-800'}`}
              title={low ? `Dưới mức tối thiểu ${num(row.original.min_stock_qty)}` : undefined}
            >
              {low && <PackageX className="h-3.5 w-3.5" aria-hidden="true" />}
              {num(row.original.available_qty)}
              <span className="text-[10px] font-medium text-slate-400">
                {labelOf(UOM_LABEL, row.original.uom)}
              </span>
            </span>
          );
        },
      },
      {
        id: 'action',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMaterial(row.original);
            }}
            className="inline-flex touch-manipulation items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            <Maximize2 className="h-3 w-3" aria-hidden="true" />
            360°
          </button>
        ),
      },
    ],
    [expanded, onOpenMaterial],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter: q },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQ,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Lọc trên mã, tên, vị trí và lô — bốn thứ thủ kho thật sự gõ để tìm hàng
    globalFilterFn: (row, _col, value) => {
      const kw = String(value).toLowerCase();
      const r = row.original;
      return [r.material_code, r.material_name, r.bin_path, r.lot_no, r.supplier_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw));
    },
  });

  if (error) {
    return (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm font-semibold text-red-700">
        {error}
      </p>
    );
  }

  return (
    <>
      <div className="relative mb-3 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm mã, tên, vị trí, lô, nhà cung cấp..."
          aria-label="Tìm trong bảng tồn kho"
          className={`${inputCls} min-w-0 pl-9 text-base sm:text-sm`}
        />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center">
          <PackageX className="h-9 w-9 text-slate-200" strokeWidth={1.25} aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-600">Chưa có dòng tồn kho nào</p>
          <p className="max-w-sm text-xs text-slate-400">
            Tồn kho sinh ra khi nhận hàng vào kho. Mỗi dòng là một tổ hợp vật tư × lô × ô kệ.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          {/* Bảng cuộn trong lòng nó, KHÔNG làm cuộn cả trang */}
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 940 }}>
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-slate-100">
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className={`${th} ${h.column.getCanSort() ? 'cursor-pointer select-none hover:text-blue-600' : ''}`}
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? ''}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-50">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className={ROW_HOVER}>
                    {row.getVisibleCells().map((c) => (
                      <td key={c.id} className={td}>
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dòng mở rộng nằm NGOÀI bảng: nhét <tr> lồng vào giữa các hàng sẽ
              làm lệch số cột và vỡ layout khi cuộn ngang. */}
          {table.getRowModel().rows
            .filter((r) => expanded[r.original.id])
            .map((r) => {
              const s = r.original;
              return (
                <div key={`x-${s.id}`} className="border-t border-blue-100 bg-blue-50/40 px-4 py-3">
                  <p className="mb-2 font-mono text-xs font-bold text-blue-800">
                    {s.material_code} — chi tiết
                  </p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                    {[
                      ['Phân loại', s.sub_category ? labelOf(SUB_CATEGORY_LABEL, s.sub_category) : '—'],
                      ['Màu sắc', s.color_code ?? '—'],
                      ['Kích cỡ', s.size_code ?? '—'],
                      ['Lô', s.lot_no ?? '—'],
                      ['Nhà cung cấp', s.supplier_name ?? '—'],
                      ['Khu vực', s.zone_type ? labelOf(ZONE_TYPE_LABEL, s.zone_type) : '—'],
                      ['Chờ kiểm', num(s.in_inspection_qty)],
                      ['Bị khoá', num(s.blocked_qty)],
                      ['Đơn giá', s.unit_price === null ? '—' : `${nfMoney.format(s.unit_price)} ${s.currency ?? ''}`],
                      ['Giá trị tồn', s.stock_value === null ? '—' : `${nfMoney.format(s.stock_value)} ${s.currency ?? ''}`],
                      ['Tồn tối thiểu', num(s.min_stock_qty)],
                      ['Kiểm kê lần cuối', s.last_counted_at ? s.last_counted_at.slice(0, 10).split('-').reverse().join('/') : '—'],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{k}</dt>
                        <dd className="mt-0.5 truncate text-xs font-medium text-slate-800">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
        </div>
      )}
    </>
  );
}

export default memo(StockTable);
