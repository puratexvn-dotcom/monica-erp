'use client';

import { memo, useMemo, useState, useTransition } from 'react';
import { Search, Palette, Ruler, Layers, PackageSearch, Maximize2, Pencil, Archive } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, inputCls } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { DataTable, tdCls, Metric, fmtNum } from '../po/tab-kit';
import { STYLE_STATUS_LABEL, GENDER_LABEL, labelOf } from '../po/labels';
import StyleDetailSheet from './style-detail-sheet';
import type { StyleRow } from '@/schemas/md';

// ============================================================================
// BẢNG MÃ HÀNG — CỬA VÀO TRUNG TÂM DỮ LIỆU
//
// Bốn con số đếm (màu / size / định mức / PO) đọc sẵn từ service bằng cú pháp
// count của PostgREST, không gọi thêm truy vấn cho từng dòng.
//
// Con số PO ở đây chính là thứ cho thấy giá trị của Style Master: một mã hàng
// dùng cho nhiều PO, khai định mức một lần là mọi PO đó đều lấy theo.
// ============================================================================

function StyleList({
  rows,
  error,
  onRefresh,
  onSua,
  onLuuTru,
}: {
  rows: StyleRow[];
  error: string | null;
  onRefresh: () => void | Promise<void>;
  /** 🔴 `BUG-5` · Board 07/08/2026 — mở hộp thoại ở chế độ **Sửa**. */
  onSua?: (id: string) => void;
  /** 🔴 `BUG-5` — lưu trữ *(`status = DISCONTINUED`)*.
   *
   *  ⚠️ **NHẬN QUA PROP, ⛔ KHÔNG `import` thẳng Server Action** — bài kiểm
   *  kiến trúc ③ chặn `components/ → app/` ở 39 tệp *(`AD-01`)*. Cùng lý do đã
   *  ghi ở `customer-list.tsx`. */
  onLuuTru?: (id: string) => Promise<{ ok: boolean; message: string }>;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<StyleRow | null>(null);
  const [dangChay, batDau] = useTransition();

  /** 🔴 **LƯU TRỮ, ⛔ KHÔNG XOÁ** — Board: *"⛔ Không Delete vật lý. Chỉ
   *  Archive."* `styles` ⛔ không có `deleted_at`, nhưng **có** `DISCONTINUED`
   *  trong ràng buộc `CHECK` của migration `015` — một trạng thái nghiệp vụ
   *  **thật**, mang đúng nghĩa *"ngừng sản xuất"*.
   *
   *  ⚠️ Hỏi lại và **nói rõ số PO đang dùng mã này**: ngừng một mã hàng còn 12
   *  đơn đang chạy là quyết định khác hẳn ngừng một mã ⛔ chưa ai đặt. */
  const luuTru = (r: StyleRow) => {
    if (!onLuuTru) return;
    if (!window.confirm(
      `Ngừng sản xuất mã hàng "${r.style_no}"?\n\n`
      + `· Đang có ${r.order_count} đơn hàng dùng mã này — chúng GIỮ NGUYÊN.\n`
      + '· Bảng màu, size, công đoạn, định mức: GIỮ NGUYÊN — ⛔ không xoá gì.\n'
      + '· Đổi lại trạng thái bất cứ lúc nào bằng nút Sửa.',
    )) return;

    batDau(() => {
      void onLuuTru(r.id).then(async (res) => {
        if (!res.ok) { toast.error('Không lưu trữ được', { description: res.message }); return; }
        toast.success(res.message);
        await onRefresh();
      });
    });
  };

  const stats = useMemo(
    () => ({
      total: rows.length,
      inProduction: rows.filter((r) => r.status === 'IN_PRODUCTION').length,
      // Mã hàng chưa khai định mức là điểm nghẽn: không tính được nhu cầu NPL
      // cho bất kỳ PO nào dùng mã đó.
      noBom: rows.filter((r) => r.bom_count === 0).length,
      linkedOrders: rows.reduce((s, r) => s + r.order_count, 0),
    }),
    [rows],
  );

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.style_no, r.style_name, r.customer_name, r.product_group]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw)),
    );
  }, [rows, q]);

  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Tổng mã hàng" value={fmtNum(stats.total)} />
        <Metric label="Đang sản xuất" value={fmtNum(stats.inProduction)} tone="indigo" />
        <Metric
          label="Chưa khai định mức"
          value={fmtNum(stats.noBom)}
          tone={stats.noBom > 0 ? 'amber' : 'emerald'}
          sub={stats.noBom > 0 ? 'chưa tính được nhu cầu NPL' : 'đã khai đủ'}
        />
        <Metric label="Đơn hàng liên kết" value={fmtNum(stats.linkedOrders)} sub="PO dùng các mã này" />
      </div>

      <div className="relative mb-3 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm mã hàng, tên, khách hàng..."
          aria-label="Tìm mã hàng"
          className={`${inputCls} pl-9`}
        />
      </div>

      {shown.length === 0 ? (
        <NoData
          title={rows.length === 0 ? 'Chưa có mã hàng nào' : 'Không có mã hàng khớp từ khoá'}
          sub={
            rows.length === 0
              ? 'Mã hàng là trung tâm dữ liệu: khai định mức, SAM, bảng màu và size một lần, mọi PO dùng lại.'
              : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataTable
            head={['Mã hàng', 'Khách hàng', 'Nhóm / Giới tính', 'SAM', 'Màu', 'Size', 'Định mức', 'PO', 'Trạng thái', '']}
            minWidth={1120}
          >
            {shown.map((r) => (
              <tr key={r.id} className="transition hover:bg-slate-50/70">
                <td className={tdCls}>
                  <span className="block font-mono font-semibold text-slate-800">{r.style_no}</span>
                  <span className="block truncate text-xs text-slate-400">{r.style_name}</span>
                </td>
                <td className={tdCls}>{r.customer_name ?? '—'}</td>
                <td className={`${tdCls} text-xs text-slate-500`}>
                  {r.product_group ?? '—'}
                  {r.gender && <span className="block">{labelOf(GENDER_LABEL, r.gender)}</span>}
                </td>
                <td className={`${tdCls} tabular-nums`}>
                  {r.sam_minutes ? `${fmtNum(r.sam_minutes)}′` : '—'}
                </td>
                <td className={`${tdCls} tabular-nums`}>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <Palette className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {r.colorway_count}
                  </span>
                </td>
                <td className={`${tdCls} tabular-nums`}>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <Ruler className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {r.size_count}
                  </span>
                </td>
                <td className={`${tdCls} tabular-nums`}>
                  {r.bom_count === 0 ? (
                    <Badge tone="amber">Chưa khai</Badge>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Layers className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      {r.bom_count}
                    </span>
                  )}
                </td>
                <td className={`${tdCls} tabular-nums font-semibold text-blue-700`}>{r.order_count}</td>
                <td className={tdCls}>
                  <Badge
                    tone={
                      r.status === 'IN_PRODUCTION' ? 'indigo'
                      : r.status === 'APPROVED' ? 'emerald'
                      : r.status === 'DISCONTINUED' ? 'slate'
                      : 'amber'
                    }
                  >
                    {labelOf(STYLE_STATUS_LABEL, r.status)}
                  </Badge>
                </td>
                <td className={tdCls}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOpen(r)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Chi tiết
                    </button>

                    {/* 🔴 BUG-5 — trước bản này, sai `hs_code` hay sai SAM là
                        sai vĩnh viễn, mà SAM sai thì **mọi** lệnh sản xuất
                        sinh từ mã đó đều sai theo. */}
                    {onSua && (
                      <button
                        type="button"
                        onClick={() => onSua(r.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Sửa
                      </button>
                    )}

                    {onLuuTru && r.status !== 'DISCONTINUED' && (
                      <button
                        type="button"
                        onClick={() => luuTru(r)}
                        disabled={dangChay}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-amber-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                        Lưu trữ
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      <StyleDetailSheet style={open} onClose={() => setOpen(null)} onChanged={onRefresh} />
    </>
  );
}

export { PackageSearch };

// Bảng dữ liệu nặng: chỉ vẽ lại khi mảng dòng hoặc lỗi thật sự đổi.
// Trang cha giữ mười ba tab nên mỗi lần đổi tab là một lượt vẽ; không bọc
// memo thì bảng đang ẩn cũng bị dựng lại theo.
export default memo(StyleList);
