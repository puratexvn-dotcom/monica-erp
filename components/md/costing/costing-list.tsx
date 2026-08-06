'use client';

import { memo, useMemo, useState } from 'react';
import { Maximize2, Search } from 'lucide-react';

import { Badge, inputCls } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { DataTable, tdCls, Metric, fmtDate, fmtNum, fmtMoney } from '../po/tab-kit';
import { COSTING_STATUS_LABEL, ORDER_TYPE_LABEL, labelOf } from '../po/labels';
import CostingDetailSheet from './costing-detail-sheet';
import type { Role } from '@/lib/rbac';
import { xepHopThu } from '@/lib/mos/md/costing-inbox';
import type { CostingRow } from '@/schemas/md';

// ============================================================================
// BẢNG CHIẾT TÍNH GIÁ ĐA PHIÊN BẢN
//
// Mặc định chỉ hiện PHIÊN BẢN MỚI NHẤT của mỗi số chiết tính. Đổ hết mọi phiên
// bản ra một bảng thì cùng một số sẽ xuất hiện năm lần với năm mức giá khác
// nhau — nhìn vào không biết cái nào đang có hiệu lực. Bản cũ vẫn xem được đầy
// đủ trong phần Lịch sử phiên bản ở màn hình chi tiết, hoặc bật ô "xem mọi
// phiên bản" ngay tại đây.
// ============================================================================

function toneOfStatus(s: string) {
  if (s === 'APPROVED') return 'emerald' as const;
  if (s === 'REJECTED') return 'rose' as const;
  if (s === 'SUPERSEDED') return 'slate' as const;
  return 'amber' as const;
}

function CostingList({
  role,
  rows,
  error,
  onRefresh,
}: {
  /** Vai người đang xem — chỉ để ẨN nút, ⛔ không phải hàng rào. */
  role: Role | null;
  rows: CostingRow[];
  error: string | null;
  onRefresh: () => void | Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<CostingRow | null>(null);

  const latest = useMemo(() => {
    const best = new Map<string, CostingRow>();
    for (const r of rows) {
      const cur = best.get(r.costing_no);
      if (!cur || r.version > cur.version) best.set(r.costing_no, r);
    }
    return [...best.values()];
  }, [rows]);

  const base = showAll ? rows : latest;

  const stats = useMemo(() => {
    const approved = latest.filter((r) => r.status === 'APPROVED');
    const withMargin = latest.filter((r) => r.margin_percent !== null);
    const avgMargin =
      withMargin.length > 0
        ? withMargin.reduce((s, r) => s + (r.margin_percent as number), 0) / withMargin.length
        : null;
    return {
      total: latest.length,
      versions: rows.length,
      approved: approved.length,
      // Biên lợi nhuận âm nghĩa là báo giá thấp hơn giá thành — càng nhiều đơn
      // như vậy thì càng làm càng lỗ, phải nhìn thấy ngay
      negative: withMargin.filter((r) => (r.margin_percent as number) < 0).length,
      avgMargin,
    };
  }, [latest, rows]);

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return base;
    return base.filter((r) =>
      [r.costing_no, r.customer_name, r.style_no]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw)),
    );
  }, [base, q]);

  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  // 🔴 HỘP THƯ DUYỆT GIÁ — Board 06/08/2026. Trả lời câu *"có bản nào đang chờ
  // TÔI làm gì ⛔ không"* ngay từ `costings.status`, ⛔ không cần bảng thông báo.
  // Cùng một bản `SUBMITTED` mang ý nghĩa NGƯỢC NHAU với hai vai — xem
  // `lib/mos/md/costing-inbox.ts`.
  const hopThu = xepHopThu(rows, role);

  return (
    <>
      {hopThu.tomTat && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-bold text-amber-900">🔔 {hopThu.tomTat}</p>
          <ul className="mt-2 space-y-1">
            {hopThu.canXuLy.map((m) => (
              <li key={m.ban.id} className="text-xs text-amber-900">
                <button
                  type="button"
                  onClick={() => setOpen(rows.find((r) => r.id === m.ban.id) ?? null)}
                  className="font-bold underline"
                >
                  {m.ban.costing_no}
                </button>
                {m.ban.customer_name ? ` · ${m.ban.customer_name}` : ''} — {m.viec}
                {/* Lý do trả lại phải hiện NGAY, ⛔ không bắt mở chi tiết mới
                    thấy: ⛔ không biết sửa gì thì vòng trình duyệt chạy vô tận. */}
                {m.lyDo && <span className="block pl-3 italic">↳ {m.lyDo}</span>}
              </li>
            ))}
          </ul>
          {hopThu.dangCho.length > 0 && (
            <p className="mt-2 text-xs text-amber-800">
              Ngoài ra {hopThu.dangCho.length} bản đang chờ phía bên kia xử lý.
            </p>
          )}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Số chiết tính" value={fmtNum(stats.total)} sub={`${stats.versions} phiên bản`} />
        <Metric label="Đã duyệt" value={fmtNum(stats.approved)} tone="emerald" />
        <Metric
          label="Biên lợi nhuận trung bình"
          value={stats.avgMargin === null ? '—' : `${stats.avgMargin.toFixed(1)}%`}
          sub={stats.avgMargin === null ? 'chưa bản nào tính được' : 'bản mới nhất mỗi số'}
        />
        <Metric
          label="Bản đang lỗ"
          value={fmtNum(stats.negative)}
          tone={stats.negative > 0 ? 'rose' : 'emerald'}
          sub={stats.negative > 0 ? 'giá báo thấp hơn giá thành' : 'không bản nào âm'}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm số chiết tính, khách hàng, mã hàng..."
            aria-label="Tìm bản chiết tính"
            className={`${inputCls} pl-9`}
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Xem mọi phiên bản
        </label>
      </div>

      {shown.length === 0 ? (
        <NoData
          title={rows.length === 0 ? 'Chưa có bản chiết tính nào' : 'Không có bản nào khớp từ khoá'}
          sub={
            rows.length === 0
              ? 'Chiết tính giá là căn cứ để báo giá và để đối chiếu khi tranh chấp. Mỗi lần đổi giá nên tạo một phiên bản mới thay vì sửa đè.'
              : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataTable
            head={['Số chiết tính', 'Khách hàng', 'Mã hàng', 'Hình thức', 'Số lượng', 'Giá mục tiêu', 'Giá báo', 'Biên LN', 'Trạng thái', 'Ngày tạo', '']}
            minWidth={1320}
          >
            {shown.map((c) => (
              <tr key={c.id} className="transition hover:bg-slate-50/70">
                <td className={tdCls}>
                  <span className="font-mono font-semibold text-slate-800">{c.costing_no}</span>
                  <span className="ml-1.5 rounded bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-500">
                    v{c.version}
                  </span>
                </td>
                <td className={tdCls}>{c.customer_name ?? '—'}</td>
                <td className={`${tdCls} font-mono text-xs`}>{c.style_no ?? '—'}</td>
                <td className={`${tdCls} text-xs`}>{labelOf(ORDER_TYPE_LABEL, c.order_type)}</td>
                <td className={`${tdCls} tabular-nums`}>{fmtNum(c.quantity)}</td>
                <td className={`${tdCls} tabular-nums`}>{fmtMoney(c.target_price, c.currency)}</td>
                <td className={`${tdCls} tabular-nums font-semibold`}>{fmtMoney(c.quoted_price, c.currency)}</td>
                <td className={`${tdCls} tabular-nums`}>
                  {c.margin_percent === null ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <Badge tone={c.margin_percent >= 15 ? 'emerald' : c.margin_percent >= 5 ? 'amber' : 'rose'}>
                      {fmtNum(c.margin_percent)}%
                    </Badge>
                  )}
                </td>
                <td className={tdCls}>
                  <Badge tone={toneOfStatus(c.status)}>{labelOf(COSTING_STATUS_LABEL, c.status)}</Badge>
                </td>
                <td className={tdCls}>{fmtDate(c.created_at)}</td>
                <td className={tdCls}>
                  <button
                    type="button"
                    onClick={() => setOpen(c)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      <CostingDetailSheet role={role} costing={open} onClose={() => setOpen(null)} onChanged={onRefresh} />
    </>
  );
}

// Bảng dữ liệu nặng: chỉ vẽ lại khi mảng dòng hoặc lỗi thật sự đổi.
// Trang cha giữ mười ba tab nên mỗi lần đổi tab là một lượt vẽ; không bọc
// memo thì bảng đang ẩn cũng bị dựng lại theo.
export default memo(CostingList);
