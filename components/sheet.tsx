'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

// ============================================================================
// SHEET — lớp trượt dùng chung cho Chat / Báo cáo / A.I
//
// Gom về một chỗ vì cả ba panel đều cần đúng bốn hành vi mà rất dễ làm thiếu:
//   1. Esc để đóng.
//   2. Khoá cuộn nền — không khoá thì trên điện thoại người dùng cuộn xuyên
//      lớp phủ xuống trang phía sau, rất khó hiểu.
//   3. Trả tiêu điểm về đúng nút vừa bấm khi đóng, để người dùng bàn phím
//      không bị mất dấu.
//   4. Bấm ra ngoài để đóng, nhưng bấm TRONG panel thì không (stopPropagation).
// ============================================================================

export default function Sheet({
  open,
  onClose,
  title,
  subtitle,
  side = 'right',
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** 'right' cho chat/AI (giống app nhắn tin), 'bottom' cho báo cáo trên mobile */
  side?: 'right' | 'bottom';
  children: ReactNode;
  footer?: ReactNode;
}) {
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocus.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      restoreFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const panelCls =
    side === 'right'
      ? 'h-full w-full max-w-md animate-in slide-in-from-right sm:max-w-lg'
      : 'max-h-[90vh] w-full animate-in slide-in-from-bottom sm:max-w-3xl sm:rounded-t-3xl';

  return (
    <div
      className={`fixed inset-0 z-[60] flex bg-slate-900/50 backdrop-blur-sm ${
        side === 'right' ? 'justify-end' : 'items-end justify-center'
      }`}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex flex-col bg-white shadow-2xl duration-200 ${panelCls}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && <div className="border-t border-slate-100 bg-white p-4">{footer}</div>}
      </div>
    </div>
  );
}
