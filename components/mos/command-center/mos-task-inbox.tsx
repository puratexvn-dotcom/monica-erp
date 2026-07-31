'use client';

import { memo, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import { Inbox } from 'lucide-react';

import { BIZ_TONE, ROW_HOVER } from '@/components/md/semantic-tone';
import {
  DEFAULT_URGENCY, urgencyText, urgencyTone,
  type MosTask, type UrgencyWording,
} from '@/lib/mos/command-center.contract';

// ============================================================================
// HỘP VIỆC — DÙNG CHUNG CHO MỌI PHÂN HỆ
//
// Khung này KHÔNG biết gì về nghiệp vụ: không có bảng tra "loại việc nào thì
// icon nào", không có chỗ nào nhắc tới PO hay phiếu nhập. Toàn bộ ý nghĩa do
// phân hệ gắn vào từng MosTask trước khi truyền xuống.
//
// Nhờ vậy thêm phân hệ thứ ba, thứ tư không phải sửa file này một dòng nào.
// ============================================================================

function MosTaskInbox({
  title,
  icon: Icon = Inbox,
  tasks,
  error,
  emptyTitle = 'Không có việc nào đang chờ',
  emptyHint,
  wording = DEFAULT_URGENCY,
  maxVisible = 8,
}: {
  title: string;
  icon?: ElementType;
  tasks: MosTask[];
  error?: string | null;
  emptyTitle?: string;
  emptyHint?: string;
  wording?: UrgencyWording;
  maxVisible?: number;
}) {
  const [showAll, setShowAll] = useState(false);

  // Sắp ở ĐÂY, một lần, thay vì bắt mỗi phân hệ tự sắp rồi mỗi nơi một kiểu.
  const sorted = useMemo(
    () => [...tasks].sort((a, b) => b.urgencyDays - a.urgencyDays),
    [tasks],
  );
  const urgent = useMemo(() => tasks.filter((t) => t.urgencyDays >= 3).length, [tasks]);
  const shown = showAll ? sorted : sorted.slice(0, maxVisible);

  return (
    <section aria-label={title} className="rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="text-sm font-bold tracking-tight text-slate-800">{title}</h2>
        <div className="ml-auto flex items-center gap-1.5">
          {urgent > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
              {urgent} gấp
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
            {tasks.length}
          </span>
        </div>
      </header>

      {error ? (
        <p role="alert" className="px-4 py-8 text-center text-sm font-semibold text-red-700">{error}</p>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
          <Inbox className="h-9 w-9 text-slate-200" strokeWidth={1.25} aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-600">{emptyTitle}</p>
          {emptyHint && <p className="max-w-xs text-xs text-slate-400">{emptyHint}</p>}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-50">
            {shown.map((t) => {
              const TaskIcon = t.icon;
              const clickable = Boolean(t.onOpen);
              return (
                <li key={t.id}>
                  <div
                    role={clickable ? 'button' : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={t.onOpen}
                    onKeyDown={(e) => {
                      if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        t.onOpen?.();
                      }
                    }}
                    className={`flex items-start gap-3 px-4 py-2.5 ${clickable ? ROW_HOVER : ''}`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${BIZ_TONE[t.domain].chip}`}
                      title={t.kindLabel}
                    >
                      <TaskIcon className="h-4 w-4" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{t.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                        {t.ref && <span className="font-mono font-bold text-slate-600">{t.ref}</span>}
                        <span className="truncate">{t.subtitle}</span>
                      </p>
                    </div>

                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${urgencyTone(t.urgencyDays)}`}>
                      {urgencyText(t.urgencyDays, wording)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {tasks.length > maxVisible && (
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

export default memo(MosTaskInbox);
