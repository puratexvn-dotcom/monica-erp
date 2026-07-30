'use client';

import { memo, useMemo, useState } from 'react';
import {
  CalendarClock, ChevronRight, ClipboardList, Inbox, ListTodo, Package, Shirt,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { TodayTask, TaskKind } from '@/app/(dashboard)/md/_services/command-center.service';
import { BIZ_TONE, ROW_HOVER, type BizDomain } from '../semantic-tone';
import { fmtDate } from '../po/tab-kit';

// ============================================================================
// KHU 1 — HỘP VIỆC HÔM NAY
//
// ─── VÌ SAO ĐẶT ĐẦU TIÊN, THAY CHO CÁC THẺ CHỈ SỐ ──────────────────────────
// "Đang chạy 12 đơn" không nói cho Merchandiser biết sáng nay phải làm gì.
// "Giục vải chính PO-2602, trễ 4 ngày" thì có. Chỉ số tổng quan vẫn còn, chỉ
// là lùi xuống dưới — thứ mở màn hình ra phải thấy trước là VIỆC.
//
// ─── MỖI LOẠI VIỆC MỘT SẮC MÀU ─────────────────────────────────────────────
// Dùng đúng bảng màu nghiệp vụ dùng chung: xanh lá = NPL, tím = hàng mẫu,
// hổ phách = kế hoạch/T&A, đỏ = phải quyết ngay. Liếc là biết loại việc.
// ============================================================================

const KIND_META: Record<TaskKind, { icon: LucideIcon; domain: BizDomain; label: string }> = {
  MILESTONE: { icon: CalendarClock, domain: 'PLANNING', label: 'Tiến độ' },
  MATERIAL: { icon: Package, domain: 'MATERIAL', label: 'Nguyên phụ liệu' },
  SAMPLE: { icon: Shirt, domain: 'SAMPLE', label: 'Hàng mẫu' },
  CHANGE: { icon: ClipboardList, domain: 'QUALITY', label: 'Thay đổi' },
  COMMENT: { icon: ListTodo, domain: 'SHIPPING', label: 'Được giao' },
};

/** Câu mô tả mức khẩn, đọc là hiểu ngay — không bắt người dùng tự trừ ngày */
function urgency(t: TodayTask): { text: string; cls: string } {
  if (t.overdueDays > 0) {
    return {
      text: `Trễ ${t.overdueDays} ngày`,
      cls: t.overdueDays >= 3 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
    };
  }
  return { text: 'Tới hạn hôm nay', cls: 'bg-blue-100 text-blue-800' };
}

function TaskInbox({
  tasks,
  error,
  onOpenPo,
}: {
  tasks: TodayTask[];
  error?: string | null;
  /** Bấm vào việc gắn với một PO thì mở luôn PO 360° — không rời màn hình */
  onOpenPo: (orderId: string, poNumber: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const { overdue, dueToday } = useMemo(
    () => ({
      overdue: tasks.filter((t) => t.overdueDays > 0).length,
      dueToday: tasks.filter((t) => t.overdueDays === 0).length,
    }),
    [tasks],
  );

  // Mặc định chỉ 8 dòng: danh sách 60 việc cuộn dài lê thê thì cũng chẳng ai
  // đọc hết, mà lại đẩy hai khu bên dưới ra khỏi tầm nhìn.
  const shown = showAll ? tasks : tasks.slice(0, 8);

  return (
    <section aria-label="Việc cần làm hôm nay" className="rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
          <Inbox className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="text-sm font-bold tracking-tight text-slate-800">Việc cần làm hôm nay</h2>
        <div className="ml-auto flex items-center gap-1.5">
          {overdue > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
              {overdue} trễ
            </span>
          )}
          {dueToday > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
              {dueToday} tới hạn
            </span>
          )}
        </div>
      </header>

      {error ? (
        <p role="alert" className="px-4 py-8 text-center text-sm font-semibold text-red-700">{error}</p>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
          <Inbox className="h-9 w-9 text-slate-200" strokeWidth={1.25} aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-600">Không có việc nào tới hạn</p>
          <p className="max-w-xs text-xs text-slate-400">
            Việc ở đây gom tự động từ mốc T&A, mẫu chờ phản hồi, NPL quá hạn, thảo luận được giao
            và yêu cầu thay đổi chờ duyệt.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-50">
            {shown.map((t) => {
              const meta = KIND_META[t.kind];
              const Icon = meta.icon;
              const u = urgency(t);
              const clickable = Boolean(t.orderId && t.poNumber);
              return (
                <li key={t.id}>
                  <div
                    role={clickable ? 'button' : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={() => clickable && onOpenPo(t.orderId as string, t.poNumber as string)}
                    onKeyDown={(e) => {
                      if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onOpenPo(t.orderId as string, t.poNumber as string);
                      }
                    }}
                    className={`flex items-start gap-3 px-4 py-2.5 ${clickable ? ROW_HOVER : ''}`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${BIZ_TONE[meta.domain].chip}`}
                      title={meta.label}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{t.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                        {t.poNumber && (
                          <span className="font-mono font-bold text-slate-600">{t.poNumber}</span>
                        )}
                        <span className="truncate">{t.subtitle}</span>
                        {t.dueDate && <span className="tabular-nums">· {fmtDate(t.dueDate)}</span>}
                      </p>
                    </div>

                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${u.cls}`}>
                      {u.text}
                    </span>
                    {clickable && (
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {tasks.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-full touch-manipulation border-t border-slate-100 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50"
            >
              {showAll ? 'Thu gọn' : `Xem tất cả ${tasks.length} việc`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default memo(TaskInbox);
