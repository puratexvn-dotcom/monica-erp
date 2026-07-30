'use client';

import { memo, useMemo, useState, useTransition } from 'react';
import { AtSign, CheckCircle2, ListTodo, MessageSquare, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, inputCls } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { Metric, fmtDate, fmtNum } from '../po/tab-kit';
import {
  ENTITY_TYPE_LABEL, TASK_STATUS_LABEL, TASK_STATUSES, ROLE_LABEL_SAFE, labelOf, vnToday,
} from '../po/labels';
import { setTaskStatus } from '@/app/(dashboard)/md/_actions/collaboration.actions';
import type { CommentCenterRow } from '@/app/(dashboard)/md/_services/collaboration.service';

// ============================================================================
// TRUNG TÂM THẢO LUẬN
//
// ─── VÌ SAO TAG THEO VAI TRÒ, KHÔNG TAG THEO TỪNG NGƯỜI ────────────────────
// Nhân sự ở xưởng thay đổi liên tục, còn vai trò thì ổn định. "@kho" luôn tới
// đúng người đang trực kho hôm đó, kể cả khi người cũ đã nghỉ.
//
// ─── VÌ SAO CÓ CỜ "VIỆC CẦN LÀM" ───────────────────────────────────────────
// Một bình luận "vải về trễ 3 ngày" chỉ là thông tin. Đánh dấu thành việc và
// giao cho một bộ phận thì mới có người chịu trách nhiệm đóng nó lại.
// ============================================================================

function CommentCenter({
  rows,
  error,
  onRefresh,
}: {
  rows: CommentCenterRow[];
  error: string | null;
  onRefresh: () => void | Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [onlyTasks, setOnlyTasks] = useState(false);
  const [pending, startTransition] = useTransition();
  const today = vnToday();

  const stats = useMemo(() => {
    const tasks = rows.filter((r) => r.is_task);
    return {
      total: rows.length,
      tasks: tasks.length,
      open: tasks.filter((t) => t.task_status === 'OPEN' || t.task_status === 'DOING').length,
      overdue: tasks.filter(
        (t) => t.due_date && t.due_date < today && t.task_status !== 'DONE' && t.task_status !== 'CANCELLED',
      ).length,
    };
  }, [rows, today]);

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (onlyTasks && !r.is_task) return false;
      if (!kw) return true;
      return [r.body, r.author_name, r.assigned_role, ...r.mentions]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw));
    });
  }, [rows, q, onlyTasks]);

  const change = (id: string, status: 'OPEN' | 'DOING' | 'DONE' | 'CANCELLED') => {
    startTransition(async () => {
      const res = await setTaskStatus(id, status);
      if (res.ok) {
        toast.success('Đã cập nhật', { description: res.message });
        await onRefresh();
      } else {
        toast.error('Không cập nhật được', { description: res.message });
      }
    });
  };

  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Tổng thảo luận" value={fmtNum(stats.total)} />
        <Metric label="Đánh dấu là việc" value={fmtNum(stats.tasks)} tone="indigo" />
        <Metric label="Việc chưa xong" value={fmtNum(stats.open)} tone={stats.open > 0 ? 'amber' : 'emerald'} />
        <Metric
          label="Việc quá hạn"
          value={fmtNum(stats.overdue)}
          tone={stats.overdue > 0 ? 'rose' : 'emerald'}
          sub={stats.overdue > 0 ? 'cần xử lý ngay' : 'không có việc nào trễ'}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm nội dung, người viết, bộ phận..."
            aria-label="Tìm thảo luận"
            className={`${inputCls} pl-9`}
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={onlyTasks}
            onChange={(e) => setOnlyTasks(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Chỉ xem việc cần làm
        </label>
      </div>

      {shown.length === 0 ? (
        <NoData
          title={rows.length === 0 ? 'Chưa có thảo luận nào' : 'Không có thảo luận khớp bộ lọc'}
          sub={
            rows.length === 0
              ? 'Thảo luận được viết trong tab Thảo luận của từng đơn hàng. Gõ @kho, @qa... để nhắc đúng bộ phận.'
              : undefined
          }
        />
      ) : (
        <ul className="space-y-2">
          {shown.map((c) => {
            const overdue =
              c.is_task && c.due_date && c.due_date < today && c.task_status !== 'DONE' && c.task_status !== 'CANCELLED';
            return (
              <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                    {c.is_task ? (
                      <ListTodo className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    )}
                    {c.author_name ?? 'Không rõ người viết'}
                  </span>
                  <Badge tone="slate">{labelOf(ENTITY_TYPE_LABEL, c.entity_type)}</Badge>
                  <span className="text-slate-400">{fmtDate(c.created_at)}</span>
                  {c.is_task && c.assigned_role && (
                    <Badge tone="indigo">Giao: {ROLE_LABEL_SAFE(c.assigned_role)}</Badge>
                  )}
                  {c.is_task && c.due_date && (
                    <span className={overdue ? 'font-bold text-rose-700' : 'text-slate-500'}>
                      Hạn {fmtDate(c.due_date)}
                    </span>
                  )}
                </div>

                <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {c.mentions.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                      <AtSign className="h-3 w-3" aria-hidden="true" />
                      {c.mentions.map((m) => ROLE_LABEL_SAFE(m)).join(', ')}
                    </span>
                  )}

                  {c.is_task && (
                    <>
                      <Badge
                        tone={
                          c.task_status === 'DONE' ? 'emerald'
                          : c.task_status === 'CANCELLED' ? 'slate'
                          : overdue ? 'rose' : 'amber'
                        }
                        icon={c.task_status === 'DONE' ? CheckCircle2 : undefined}
                      >
                        {labelOf(TASK_STATUS_LABEL, c.task_status)}
                      </Badge>
                      <select
                        aria-label="Đổi trạng thái việc"
                        value={c.task_status ?? 'OPEN'}
                        disabled={pending}
                        onChange={(e) => change(c.id, e.target.value as 'OPEN' | 'DOING' | 'DONE' | 'CANCELLED')}
                        className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs font-semibold text-slate-600"
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

// Bảng dữ liệu nặng: chỉ vẽ lại khi mảng dòng hoặc lỗi thật sự đổi.
// Trang cha giữ mười ba tab nên mỗi lần đổi tab là một lượt vẽ; không bọc
// memo thì bảng đang ẩn cũng bị dựng lại theo.
export default memo(CommentCenter);
