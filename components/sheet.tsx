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
  size = 'panel',
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** 'right' cho chat/AI (giống app nhắn tin), 'bottom' cho báo cáo trên mobile */
  side?: 'right' | 'bottom';
  /**
   * 'panel' — tấm trượt hẹp bên phải, hợp với thứ liếc nhanh rồi đóng.
   * 'full'  — TỪ md TRỞ LÊN chiếm trọn bề ngang. Dành cho Chat và Trợ lý A.I:
   *   trên màn 1920px mà nhét hội thoại vào một cột 512px thì mỗi dòng chỉ vừa
   *   dăm chữ, phải cuộn liên tục dù màn hình còn trống hai phần ba.
   *   Điện thoại KHÔNG đổi gì: ở đó tấm trượt vốn đã chiếm trọn màn hình.
   */
  size?: 'panel' | 'full';
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

  // ─── VÌ SAO LỚP PHỦ BÁM BIẾN --nav-h ────────────────────────────────────
  // Thanh điều hướng đứng ở z-[100], tức NẰM TRÊN lớp phủ này. Nếu lớp phủ
  // trải hết xuống đáy thì phần dưới cùng của panel chui xuống dưới thanh đó —
  // ô nhập tin nhắn bị che đúng nửa dưới.
  //
  // Nhưng thanh có thể TỰ ẨN (cuộn xuống, hoặc bàn phím ảo bật lên). Chừa cứng
  // 4rem thì lúc thanh đã trượt đi vẫn còn một dải trống vô nghĩa ở đáy. Biến
  // --nav-h do lib/use-nav-visibility.ts ghi ra luôn bằng phần chỗ thanh ĐANG
  // THẬT SỰ chiếm, nên panel co giãn khớp từng thời điểm.
  //
  // ─── VÌ SAO 100dvh CHỨ KHÔNG 100vh ───────────────────────────────────────
  // Trên trình duyệt di động, 100vh tính theo màn hình khi thanh địa chỉ ĐÃ
  // thu lại, nên lúc thanh còn hiện thì panel cao hơn vùng nhìn thấy và ô nhập
  // bị đẩy khỏi màn hình. dvh bám theo chiều cao thực tế tại từng thời điểm.
  const panelCls =
    size === 'full'
      ? 'h-full w-full animate-in slide-in-from-right md:max-w-none'
      : side === 'right'
        ? 'h-full w-full max-w-md animate-in slide-in-from-right sm:max-w-lg'
        : 'max-h-full w-full animate-in slide-in-from-bottom sm:max-w-3xl sm:rounded-t-3xl';

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[60] flex overflow-hidden transition-[bottom,height] duration-200 ${
        // Toàn màn thì panel che kín, lớp phủ không còn chỗ nào lộ ra — vẽ nền
        // mờ chỉ tốn một lớp tô thừa. Đổi lại, ở chế độ này KHÔNG bấm ra ngoài
        // để đóng được nữa, nên nút X ở đầu panel là lối thoát duy nhất và
        // phím Esc vẫn hoạt động.
        size === 'full' ? 'bg-transparent' : 'bg-slate-900/50 backdrop-blur-sm'
      } ${side === 'right' ? 'justify-end' : 'items-end justify-center'}`}
      style={{
        bottom: 'var(--nav-h, 3.5rem)',
        height: 'calc(100dvh - var(--nav-h, 3.5rem))',
        maxHeight: 'calc(100dvh - var(--nav-h, 3.5rem))',
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex min-w-0 flex-col overflow-hidden bg-white shadow-2xl duration-200 ${panelCls}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold uppercase tracking-wide text-slate-800">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}
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

        {/* overflow-x-hidden: nội dung panel không được đẩy rộng ra ngoài viền.
            Bảng nào cần cuộn ngang thì tự bọc div overflow-x-auto của nó. */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-slate-100 bg-white p-3 sm:p-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
