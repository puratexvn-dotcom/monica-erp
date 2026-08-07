'use client';

import { memo, useMemo, useState, useTransition } from 'react';
import { Maximize2, Search, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';

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

// 🔴 BUG-5 · Board 07/08/2026 — lớp nút thao tác dòng. Gom một hằng để ba nút
// **cùng cỡ, cùng dáng**: ba nút lệch nhau trên một dòng đọc thành ba mức quan
// trọng khác nhau, trong khi chúng ngang hàng.
const nutDong =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 '
  + 'text-xs font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50';

function CustomerList({
  rows,
  error,
  onRefresh,
  onSua,
  onDoiHieuLuc,
}: {
  rows: CustomerRow[];
  error: string | null;
  onRefresh: () => void | Promise<void>;
  /** 🔴 `BUG-5`. Trang cha giữ ô nhớ hộp thoại, nên danh sách chỉ **báo ý
   *  định**, ⛔ không tự dựng hộp thoại thứ hai. */
  onSua?: (id: string) => void;
  /**
   * 🔴 `BUG-5` — Lưu trữ ⟷ Mở lại.
   *
   * ⚠️ **NHẬN QUA PROP, ⛔ KHÔNG `import` thẳng Server Action.** Bài kiểm kiến
   * trúc ③ chặn `components/ → app/` ở **39 tệp** *(`AD-01`, bánh cóc chặn nợ
   * mới)*, và tệp này ⛔ chưa nằm trong số đó. Nhập thẳng sẽ **nới sổ nợ** —
   * tức trả nợ bằng cách xoá sổ nợ.
   *
   * 🔑 Truyền hàm xuống cũng **đúng hướng phụ thuộc hơn**: bảng dữ liệu ⛔
   * không cần biết ghi vào bảng nào, nó chỉ cần biết *"đổi hiệu lực dòng này"*.
   */
  onDoiHieuLuc?: (id: string, dangHieuLuc: boolean) => Promise<{ ok: boolean; message: string }>;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<CustomerRow | null>(null);
  const [dangChay, batDau] = useTransition();

  /** Lưu trữ ⟷ mở lại. ⚠️ Hỏi lại TRƯỚC khi lưu trữ: nó gỡ khách hàng khỏi mọi
   *  ô chọn, và người dùng ⛔ không thấy hậu quả đó từ dòng bảng. */
  const doiHieuLuc = (c: CustomerRow) => {
    if (!onDoiHieuLuc) return;
    if (c.is_active && !window.confirm(
      `Ngưng giao dịch với "${c.name}"?\n\n`
      + '· Hồ sơ, đơn hàng cũ, công nợ: GIỮ NGUYÊN — ⛔ không xoá gì.\n'
      + '· Khách hàng này sẽ thôi hiện ở ô chọn khi lập báo giá / PO mới.\n'
      + '· Mở lại được bất cứ lúc nào.',
    )) return;

    batDau(() => {
      void onDoiHieuLuc(c.id, c.is_active).then(async (r) => {
        if (!r.ok) { toast.error('Không đổi được hiệu lực', { description: r.message }); return; }
        toast.success(r.message);
        await onRefresh();
      });
    });
  };

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
                  <span className="block font-mono font-semibold text-slate-800">
                    {c.customer_code}
                    {/* ⚠️ Dòng đã lưu trữ vẫn NẰM TRONG bảng — ẩn nó đi thì
                        người dùng tưởng đã bị xoá, rồi tạo lại một khách hàng
                        trùng. Đánh dấu, ⛔ không giấu. */}
                    {!c.is_active && <Badge tone="amber"> Đã lưu trữ</Badge>}
                  </span>
                  <span className="block truncate text-xs text-slate-400">{c.name}</span>
                </td>
                <td className={tdCls}>{c.brand ?? '—'}</td>
                <td className={tdCls}>{c.country ?? '—'}</td>
                <td className={`${tdCls} text-xs`}>{labelOf(CURRENCY_LABEL, c.currency)}</td>
                <td className={`${tdCls} text-xs`}>{labelOf(INCOTERM_LABEL, c.incoterm)}</td>
                <td className={`${tdCls} tabular-nums font-semibold text-blue-700`}>{c.order_count}</td>
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
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOpen(c)}
                      className={`${nutDong} text-blue-600 hover:border-blue-300 hover:bg-blue-50`}
                    >
                      <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Hồ sơ 360°
                    </button>

                    {/* 🔴 BUG-5 — trước bản này, gõ sai tên khách hàng là **sai
                        vĩnh viễn**: toàn phân hệ MD ⛔ không có một hàm sửa nào
                        ngoài `updatePo`. */}
                    {onSua && (
                      <button
                        type="button"
                        onClick={() => onSua(c.id)}
                        className={`${nutDong} text-slate-600 hover:border-slate-300 hover:bg-slate-50`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Sửa
                      </button>
                    )}

                    {/* 🔴 **LƯU TRỮ, ⛔ KHÔNG XOÁ** — Board: *"⛔ Không Delete
                        vật lý. Chỉ Archive."* `customers` ⛔ không có
                        `deleted_at`, nhưng **có** `is_active` từ migration
                        `014` — hạ cờ là *"ngưng giao dịch"*, đúng nghĩa lưu
                        trữ, và mọi đơn cũ GIỮ NGUYÊN. */}
                    <button
                      type="button"
                      onClick={() => doiHieuLuc(c)}
                      disabled={dangChay || !onDoiHieuLuc}
                      className={
                        c.is_active
                          ? `${nutDong} text-amber-700 hover:border-amber-300 hover:bg-amber-50`
                          : `${nutDong} text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50`
                      }
                    >
                      {c.is_active
                        ? <><Archive className="h-3.5 w-3.5" aria-hidden="true" /> Lưu trữ</>
                        : <><ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" /> Mở lại</>}
                    </button>
                  </div>
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

// Bảng dữ liệu nặng: chỉ vẽ lại khi mảng dòng hoặc lỗi thật sự đổi.
// Trang cha giữ mười ba tab nên mỗi lần đổi tab là một lượt vẽ; không bọc
// memo thì bảng đang ẩn cũng bị dựng lại theo.
export default memo(CustomerList);
