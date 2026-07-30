'use client';

import { useEffect, useState } from 'react';

// ============================================================================
// TỰ ẨN THANH ĐIỀU HƯỚNG ĐỂ LẤY LẠI KHÔNG GIAN
//
// Hai tình huống ẩn, mỗi tình huống một cơ chế phát hiện riêng:
//
// ─── 1. BÀN PHÍM ẢO BẬT LÊN ────────────────────────────────────────────────
// Dùng visualViewport chứ KHÔNG dùng sự kiện focus. Lý do: focus vào ô nhập
// trên máy bàn không hề bật bàn phím nào, ẩn thanh lúc đó là ẩn vô cớ. Còn
// visualViewport.height co lại thì chắc chắn có thứ gì đó đang chiếm chỗ thật.
//
// Ngưỡng 25%: thanh địa chỉ của trình duyệt cũng làm vùng nhìn thấy co lại
// khoảng 8–12%, nếu để ngưỡng thấp thì chỉ cuộn nhẹ đã tưởng nhầm là bàn phím.
// Bàn phím ảo luôn chiếm trên 30% chiều cao màn hình điện thoại.
//
// ─── 2. CUỘN NHANH XUỐNG ───────────────────────────────────────────────────
// Ẩn khi cuộn XUỐNG, hiện lại khi cuộn LÊN — thói quen đã quen thuộc từ các
// ứng dụng đọc tin. Đòi hỏi vượt 12px mới đổi trạng thái: không có ngưỡng thì
// mỗi rung tay lại làm thanh nhấp nháy.
//
// Luôn hiện lại khi đã cuộn về sát đầu trang, để người dùng không bao giờ rơi
// vào cảnh mất thanh mà không biết làm sao gọi lại.
//
// ─── VÌ SAO GHI RA BIẾN CSS ────────────────────────────────────────────────
// Thanh ẩn đi thì khoảng trống nó để lại phải được các lớp trượt dùng ngay,
// nếu không sẽ có một dải trống 3,5rem ở đáy màn hình lúc đang gõ chat. Biến
// --nav-h trên thẻ <html> cho phép sheet và mọi thứ khác bám theo mà không cần
// truyền prop xuyên qua nhiều tầng.
// ============================================================================

/** Chiều cao thật của thanh (h-14). Đổi ở đây thì mọi nơi bám theo. */
export const NAV_HEIGHT_REM = 3.5;

const SCROLL_THRESHOLD = 12;
const KEYBOARD_RATIO = 0.75;

export interface NavVisibilityInput {
  /** Thanh có được vẽ ra ở trang này không (trang đăng nhập thì không) */
  rendered: boolean;
  /** Có cho phép tự ẩn không. Đang mở panel thì PHẢI tắt: người dùng cần
   *  thanh này để đóng panel, ẩn lúc đó là bẫy họ trong panel. */
  autoHide: boolean;
}

export function useNavVisibility({ rendered, autoHide }: NavVisibilityInput): boolean {
  const [scrolledVisible, setScrolledVisible] = useState(true);

  // Chỉ khi thanh ĐANG được vẽ và ĐANG cho phép tự ẩn thì trạng thái cuộn mới
  // có tiếng nói. Mở panel thì thanh luôn hiện, bất kể vừa cuộn kiểu gì.
  const visible = rendered && (!autoHide || scrolledVisible);
  const enabled = rendered && autoHide;

  // ── Bàn phím ảo ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const vv = window.visualViewport;
    if (!vv) return; // Trình duyệt cũ: bỏ qua, thanh cứ hiện như bình thường

    const onResize = () => {
      const shrunk = vv.height < window.innerHeight * KEYBOARD_RATIO;
      setScrolledVisible(!shrunk);
    };
    vv.addEventListener('resize', onResize);
    onResize();
    return () => vv.removeEventListener('resize', onResize);
  }, [enabled]);

  // ── Hướng cuộn ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    let last = window.scrollY;
    let ticking = false;

    const apply = () => {
      const y = window.scrollY;
      const delta = y - last;

      if (y < 40) {
        // Sát đầu trang thì luôn hiện — lối thoát chắc chắn cho người dùng
        setScrolledVisible(true);
        last = y;
      } else if (Math.abs(delta) > SCROLL_THRESHOLD) {
        setScrolledVisible(delta < 0);
        last = y;
      }
      ticking = false;
    };

    const onScroll = () => {
      // Gom mọi sự kiện cuộn trong một khung hình: sự kiện scroll bắn hàng chục
      // lần mỗi giây, gọi setState theo từng lần là nguồn gốc của giật khung.
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled]);

  // ── Ghi chiều cao hiện hành ra biến CSS ──────────────────────────────────
  useEffect(() => {
    const el = document.documentElement;
    // Biến này phản ánh phần chỗ mà thanh ĐANG THẬT SỰ chiếm. Trang đăng nhập
    // không vẽ thanh, hoặc thanh vừa trượt xuống ẩn đi, thì bằng 0 — nhờ vậy
    // lớp trượt lấy trọn phần đó thay vì chừa một dải trống ở đáy.
    el.style.setProperty('--nav-h', visible ? `${NAV_HEIGHT_REM}rem` : '0px');
    return () => {
      el.style.setProperty('--nav-h', '0px');
    };
  }, [visible]);

  return visible;
}
