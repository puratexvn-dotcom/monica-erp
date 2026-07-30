'use client';

import { memo, useState } from 'react';
import { Factory, Maximize2, TriangleAlert } from 'lucide-react';

import type { ActionablePo } from '@/app/(dashboard)/md/_services/command-center.service';
import { ROW_HOVER } from '../semantic-tone';
import { fmtDate, fmtNum } from '../po/tab-kit';

// ============================================================================
// KHU 2 — ĐƠN HÀNG ĐANG CHẠY, HÀNH ĐỘNG ĐƯỢC NGAY
//
// ─── VÌ SAO SẮP THEO SỐ NGÀY CÒN LẠI ───────────────────────────────────────
// Bảng PO thường sắp theo mã hoặc ngày tạo — hai tiêu chí không nói lên mức
// khẩn. Ở đây đơn nào sát ngày giao nhất nằm trên cùng, vì đó là đơn có ít
// thời gian sửa sai nhất.
//
// ─── THANH TIẾN ĐỘ SO VỚI THỜI GIAN, KHÔNG CHỈ SỐ LƯỢNG ────────────────────
// May được 60% mà còn 30 ngày là bình thường; may được 60% mà còn 3 ngày là
// báo động. Vì vậy cạnh phần trăm luôn có số ngày còn lại, và ô đổi màu khi
// hai con số lệch nhau.
// ============================================================================

/** Màu thanh tiến độ theo TƯƠNG QUAN tiến độ với thời gian còn lại */
function barTone(pct: number, daysLeft: number): string {
  if (pct >= 100) return 'bg-emerald-500';
  if (daysLeft < 0) return 'bg-red-500';
  // Còn dưới 7 ngày mà chưa may quá 80% là khó kịp
  if (daysLeft <= 7 && pct < 80) return 'bg-red-500';
  if (daysLeft <= 14 && pct < 50) return 'bg-amber-500';
  return 'bg-blue-500';
}

function daysLabel(d: number): { text: string; cls: string } {
  if (d < 0) return { text: `Quá ${Math.abs(d)} ngày`, cls: 'bg-red-100 text-red-800' };
  if (d === 0) return { text: 'Giao hôm nay', cls: 'bg-red-100 text-red-800' };
  if (d <= 7) return { text: `Còn ${d} ngày`, cls: 'bg-amber-100 text-amber-800' };
  return { text: `Còn ${d} ngày`, cls: 'bg-slate-100 text-slate-600' };
}

function ActionablePoList({
  pos,
  error,
  onOpenPo,
}: {
  pos: ActionablePo[];
  error?: string | null;
  onOpenPo: (orderId: string, poNumber: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? pos : pos.slice(0, 6);

  return (
    <section aria-label="Đơn hàng đang chạy" className="rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
          <Factory className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="text-sm font-bold tracking-tight text-slate-800">Đơn hàng đang chạy</h2>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
          {pos.length} đơn
        </span>
      </header>

      {error ? (
        <p role="alert" className="px-4 py-8 text-center text-sm font-semibold text-red-700">{error}</p>
      ) : pos.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
          <Factory className="h-9 w-9 text-slate-200" strokeWidth={1.25} aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-600">Chưa có đơn nào đang chạy</p>
          <p className="max-w-xs text-xs text-slate-400">
            Đơn xuất hiện ở đây khi trạng thái chưa phải Hoàn thành, Đã xuất hàng hay Đã huỷ.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-50">
            {shown.map((p) => {
              const d = daysLabel(p.daysLeft);
              return (
                <li key={p.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenPo(p.id, p.po_number)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenPo(p.id, p.po_number);
                      }
                    }}
                    className={`px-4 py-3 ${ROW_HOVER}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2">
                          <span className="font-mono text-sm font-bold text-slate-800">{p.po_number}</span>
                          {p.style_no && (
                            <span className="font-mono text-[11px] text-slate-400">{p.style_no}</span>
                          )}
                          {p.lateMilestones > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
                              <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                              {p.lateMilestones} mốc trễ
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {p.customer_name} · giao {fmtDate(p.delivery_date)}
                        </p>
                      </div>

                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${d.cls}`}>
                        {d.text}
                      </span>
                      <Maximize2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true" />
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barTone(p.pct, p.daysLeft)}`}
                          style={{ width: `${Math.max(2, p.pct)}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-600">
                        {p.pct.toFixed(0)}%
                      </span>
                      <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                        {fmtNum(p.sewn)}/{fmtNum(p.total_quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {pos.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-full touch-manipulation border-t border-slate-100 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50"
            >
              {showAll ? 'Thu gọn' : `Xem tất cả ${pos.length} đơn`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default memo(ActionablePoList);
