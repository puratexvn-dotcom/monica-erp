'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, Plus, RefreshCw } from 'lucide-react';

import { Card, btnPrimary, btnGhost } from '@/components/ui';
import { AssignmentTable } from '@/components/mos/assignment/assignment-table';
import { OverduePanel } from '@/components/mos/assignment/overdue-panel';
import { AssignmentForm } from '@/components/mos/assignment/assignment-form';
import { AssignmentDetailPanel } from '@/components/mos/assignment/assignment-detail-panel';
import { TransitionDialog } from '@/components/mos/assignment/transition-dialog';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import { useAssignments, useOverdueReporting } from '@/lib/mos/hooks/use-assignments';
import { useAssignment } from '@/lib/mos/hooks/use-assignment';
import { useTransitionAssignment } from '@/lib/mos/hooks/use-assignment-mutations';
import type { AssignmentStatus } from '@/lib/mos/domain/assignment';

// ============================================================================
// MÀN HÌNH PHẦN VIỆC — ADAPTER (Điều XIX)
//
// Giữ state bố cục và nối hook với component. KHÔNG chứa nghiệp vụ: mọi phán
// quyết đã xong ở `policies/` và `permission/`, mọi con số đã tính ở
// `calculators/` trước khi dữ liệu rời máy chủ.
//
// ─── BỐ CỤC THEO CHUẨN UI MỤC 1 ──────────────────────────────────────────
//   thanh hành động  →  cảnh báo (thiếu báo cáo)  →  bảng dữ liệu
// Nghiệp vụ trước, biểu đồ sau — màn hình này chưa có biểu đồ, và cố ý chưa có:
// chưa một phần việc nào chạy thật thì mọi biểu đồ đều là ô trống.
// ============================================================================

export default function AssignmentsClient() {
  const { t } = useLanguage();

  const [formOpen, setFormOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [target, setTarget] = useState<AssignmentStatus | null>(null);

  const list = useAssignments();
  const overdue = useOverdueReporting();
  const detail = useAssignment(openId);
  const transition = useTransitionAssignment();

  // ⚠️ `useCallback` là BẮT BUỘC ở đây, không phải tối ưu tuỳ chọn.
  // `AssignmentTable` bọc `React.memo`; nếu `onOpen` là hàm mới mỗi lần render
  // thì `memo` so sánh thấy prop khác và vẽ lại toàn bảng — tức là chỉ tốn thêm
  // một phép so sánh mà không tiết kiệm gì (chuẩn UI mục 5.1).
  const openDetail = useCallback((id: string) => setOpenId(id), []);

  const activeNo = detail.data?.assignmentNo ?? '';
  const actions = useMemo(() => detail.data?.allowedTransitions ?? [], [detail.data]);

  async function runTransition(reason: string | null) {
    // ⚠️ Phải có CẢ `detail.data` — phiên bản lấy từ chính bản ghi vừa đọc, không
    // phải từ một biến đếm nào khác. Đó là cả điểm của OCC: gửi lại đúng thứ đã
    // đọc, để cơ sở dữ liệu biết mình đang nhìn dữ liệu của lúc nào.
    if (!openId || !target || !detail.data) return;
    const res = await transition.run({
      assignmentId: openId,
      to: target,
      version: detail.data.version,
      reason,
    });
    if (res.ok) setTarget(null);
  }

  return (
    <div className="space-y-4">
      {/* ─── THANH HÀNH ĐỘNG ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {/* ⚠️ Đường QUAY LẠI. Trước bản vá này màn hình không có lối ra nào về
              bàn làm việc — vào rồi chỉ thoát được bằng nút back của trình duyệt.
              Dùng đúng kiểu nút của `po-header.tsx` để hai màn hình con của /md
              hành xử giống nhau. */}
          <Link
            href="/md"
            aria-label="Quay lại Bàn làm việc Merchandiser"
            className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className={`${btnPrimary} min-h-[44px] touch-manipulation`}
          >
            <Plus className="h-4 w-4" />
            {t('asg_new')}
          </button>
        </div>

        <button
          type="button"
          onClick={() => { list.refetch(); overdue.refetch(); }}
          className={`${btnGhost} min-h-[44px] touch-manipulation`}
        >
          {/* Quay khi ĐANG LÀM MỚI, không quay khi tải lần đầu — lần đầu đã có
              khung xám của bảng rồi, quay thêm là hai tín hiệu cho một việc. */}
          <RefreshCw className={`h-4 w-4 ${list.isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ─── CẢNH BÁO TRƯỚC, DANH SÁCH SAU ───────────────────────────── */}
      <OverduePanel
        rows={overdue.rows}
        totalOverdue={overdue.totalOverdue}
        isLoading={overdue.isLoading}
        error={overdue.error}
        onOpen={openDetail}
      />

      <Card title={t('asg_title')} icon={ClipboardList}>
        {/* ⚠️ Lỗi phải NÓI RA (chuẩn UI 4.7). Bảng rỗng vì lỗi quyền và bảng
            rỗng vì chưa có phần việc nào là HAI sự thật khác nhau — hiện cả hai
            thành "chưa có phần việc nào" là nói một câu sai với người dùng. */}
        {list.error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {list.error}
          </div>
        ) : list.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : (
          <AssignmentTable rows={list.rows} onOpen={openDetail} />
        )}
      </Card>

      {/* ─── CHI TIẾT: NÚT HÀNH ĐỘNG ─────────────────────────────────── */}
      {openId && detail.data && (
        <Card title={detail.data.assignmentNo} icon={ClipboardList}>
          <div className="space-y-3">
            {/* Cảnh báo phần: đọc được bản chính nhưng một truy vấn phụ hỏng.
                PHẢI hiện — `progress` đang tính trên dữ liệu thiếu, tức là những
                con số đó SAI. */}
            {detail.warning && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {detail.warning}
              </div>
            )}

            <AssignmentDetailPanel a={detail.data} />

            <div className="flex flex-wrap gap-2">
              {/* ⚠️ Nút dựng TỪ `allowedTransitions` của máy chủ, KHÔNG tự suy
                  từ `status`. Suy ở giao diện là dựng bản cài đặt thứ hai của
                  luật chuyển trạng thái, và nó sẽ lệch. */}
              {actions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTarget(s)}
                  className={`${btnGhost} min-h-[44px] touch-manipulation`}
                >
                  {t(`asg_act_${s}` as DictionaryKey)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className={`${btnGhost} min-h-[44px] touch-manipulation`}
              >
                {t('asg_cancel_btn')}
              </button>
            </div>
          </div>
        </Card>
      )}

      <AssignmentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(id) => { setFormOpen(false); setOpenId(id); }}
      />

      <TransitionDialog
        open={target !== null}
        target={target}
        assignmentNo={activeNo}
        isRunning={transition.isRunning}
        error={transition.error}
        onConfirm={(reason) => void runTransition(reason)}
        onClose={() => setTarget(null)}
      />
    </div>
  );
}
