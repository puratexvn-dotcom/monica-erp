'use client';

import { memo, useMemo, useState } from 'react';
import { ClipboardCheck, Inbox, PackageCheck, ScanLine, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { WhTask, WhTaskKind } from '@/app/(dashboard)/kho/_services/command-center.service';
import { BIZ_TONE, ROW_HOVER, type BizDomain } from '@/components/md/semantic-tone';

// ============================================================================
// CỘT TRÁI — NHIỆM VỤ HÔM NAY
//
// Gom từ nghiệp vụ có thật: phiếu nhập chờ nhận, lô chờ kiểm, lệnh chờ soạn,
// phiếu kiểm kê còn mở. KHÔNG có bảng "todo" nào phía sau.
//
// Sắp theo SỐ NGÀY TỒN chứ không theo ngày tạo: một phiếu nằm ở khâu kiểm bốn
// ngày là bốn ngày chuyền may có thể đang chờ vải.
// ============================================================================

const KIND_META: Record<WhTaskKind, { icon: LucideIcon; domain: BizDomain; label: string }> = {
  RECEIVE: { icon: Truck, domain: 'SHIPPING', label: 'Nhận hàng' },
  INSPECT: { icon: ClipboardCheck, domain: 'QUALITY', label: 'Kiểm QA' },
  PICK: { icon: PackageCheck, domain: 'MATERIAL', label: 'Soạn hàng' },
  COUNT: { icon: ScanLine, domain: 'PLANNING', label: 'Kiểm kê' },
};

/** Mức khẩn nói bằng lời, không bắt người dùng tự trừ ngày trong đầu */
function urgency(ageDays: number): { text: string; cls: string } {
  if (ageDays >= 3) return { text: `Tồn ${ageDays} ngày`, cls: 'bg-red-100 text-red-800' };
  if (ageDays >= 1) return { text: `Tồn ${ageDays} ngày`, cls: 'bg-amber-100 text-amber-800' };
  return { text: 'Hôm nay', cls: 'bg-blue-100 text-blue-800' };
}

function WhTaskInbox({
  tasks,
  error,
  onOpen,
}: {
  tasks: WhTask[];
  error?: string | null;
  onOpen: (task: WhTask) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const counts = useMemo(
    () => ({
      urgent: tasks.filter((t) => t.ageDays >= 3).length,
      total: tasks.length,
    }),
    [tasks],
  );

  const shown = showAll ? tasks : tasks.slice(0, 8);

  return (
    <section aria-label="Nhiệm vụ hôm nay" className="rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
          <Inbox className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="text-sm font-bold tracking-tight text-slate-800">Nhiệm vụ hôm nay</h2>
        <div className="ml-auto flex items-center gap-1.5">
          {counts.urgent > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
              {counts.urgent} tồn lâu
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
            {counts.total}
          </span>
        </div>
      </header>

      {error ? (
        <p role="alert" className="px-4 py-8 text-center text-sm font-semibold text-red-700">{error}</p>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
          <Inbox className="h-9 w-9 text-slate-200" strokeWidth={1.25} aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-600">Không có nhiệm vụ nào đang chờ</p>
          <p className="max-w-xs text-xs text-slate-400">
            Việc ở đây gom tự động từ phiếu nhập chờ nhận, lô chờ kiểm QA, lệnh xuất chờ soạn hàng
            và phiếu kiểm kê còn mở.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-50">
            {shown.map((t) => {
              const meta = KIND_META[t.kind];
              const Icon = meta.icon;
              const u = urgency(t.ageDays);
              return (
                <li key={t.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(t)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpen(t);
                      }
                    }}
                    className={`flex items-start gap-3 px-4 py-2.5 ${ROW_HOVER}`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${BIZ_TONE[meta.domain].chip}`}
                      title={meta.label}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{t.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">{t.subtitle}</p>
                    </div>

                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${u.cls}`}>
                      {u.text}
                    </span>
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
              {showAll ? 'Thu gọn' : `Xem tất cả ${tasks.length} nhiệm vụ`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default memo(WhTaskInbox);
