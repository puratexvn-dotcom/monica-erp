import { daysBetween, vnTodayISO } from '../po-flow';

// ============================================================================
// CỬA SỔ NGÀY — VALUE OBJECT
//
// `planned_start` và `planned_finish` không bao giờ đi một mình. Chúng cùng nhau
// trả lời ba câu hỏi khác nhau ở ba nơi khác nhau:
//
//   permission/   hôm nay có nằm trong cửa sổ không  → quyền ghi còn hay tắt
//   calculators/  những ngày nào phải có báo cáo     → thiếu báo cáo
//   policies/     đã đủ ngày để giao việc chưa       → điều kiện → ISSUED
//
// Ba nơi, một cách hiểu. Nếu mỗi nơi tự so ngày thì sẽ có ba cách xử lý múi giờ,
// và múi giờ Việt Nam đã cắn một lần rồi.
//
// ⚠️ Dùng lại `daysBetween`/`vnTodayISO` của po-flow.ts. Viết lại phép trừ ngày
// ở đây là tạo nguồn sự thật thứ hai.
// ============================================================================

export interface DateWindow {
  /** ISO `YYYY-MM-DD`. */
  start: string;
  end: string;
}

/**
 * Dựng cửa sổ từ hai cột có thể trống.
 *
 * Trả `null` khi thiếu một đầu — và đó là câu trả lời ĐÚNG, không phải lỗi:
 * một Assignment đang soạn `DRAFT` chưa có ngày, nên nó **không có cửa sổ**, chứ
 * không phải có một cửa sổ vô hạn. Mọi nơi gọi hàm này phải xử lý `null` một
 * cách tường minh.
 */
export function makeWindow(
  start: string | null | undefined,
  end: string | null | undefined,
): DateWindow | null {
  if (!start || !end) return null;
  const s = start.slice(0, 10);
  const e = end.slice(0, 10);
  // Ràng buộc `assignments_planned_order` của 029 đã chặn ở tầng CSDL, nhưng dữ
  // liệu vào đây có thể đến từ một biểu mẫu chưa lưu.
  if (daysBetween(s, e) === null) return null;
  return { start: s, end: e };
}

/** Ngày `day` có nằm trong cửa sổ không, hai đầu ĐỀU TÍNH. */
export function windowContains(w: DateWindow, day: string): boolean {
  const d = day.slice(0, 10);
  return d >= w.start && d <= w.end;
}

/**
 * Cửa sổ còn hiệu lực tính tới hôm nay không.
 *
 * ⚠️ Dùng `vnTodayISO()` chứ không dùng `new Date()`. Máy chủ chạy UTC; từ 0h
 * đến 7h sáng giờ Việt Nam, `new Date()` trả ngày HÔM QUA — đúng khung ca đêm
 * của xưởng, và quyền ghi sẽ tắt sớm một ngày.
 */
export function isWindowOpen(w: DateWindow, today: string = vnTodayISO()): boolean {
  return windowContains(w, today);
}

/** Số ngày của cửa sổ, hai đầu đều tính. Cửa sổ một ngày trả 1. */
export function windowLength(w: DateWindow): number {
  const n = daysBetween(w.start, w.end);
  return n === null ? 0 : n + 1;
}

/**
 * Trần số ngày sinh ra trong một lần liệt kê.
 *
 * Một Assignment dài hơn ba năm gần như chắc chắn là lỗi nhập liệu (gõ 2206 thay
 * vì 2026). Không có trần thì hàm dưới đây sinh vài trăm nghìn phần tử và làm
 * treo trình duyệt — người dùng thấy ứng dụng "hỏng", không thấy "ngày nhập
 * sai".
 */
export const MAX_WINDOW_DAYS = 1_100;

export interface EachDayResult {
  days: string[];
  /** true = đã cắt bớt vì vượt trần. Nơi gọi PHẢI báo ra, không được nuốt. */
  truncated: boolean;
}

/**
 * Liệt kê từng ngày trong cửa sổ, tính tới `until` là dừng.
 *
 * `until` mặc định là hôm nay: không sinh ngày tương lai rồi bảo là thiếu báo
 * cáo. Assignment chạy tới 20/08 thì ngày 15/08 chưa thể "trễ".
 *
 * Cắt bớt được BÁO RA qua `truncated` chứ không im lặng — một danh sách bị cắt
 * lặng lẽ sẽ được đọc là "đã phủ hết".
 */
export function eachDay(w: DateWindow, until: string = vnTodayISO()): EachDayResult {
  const last = until.slice(0, 10) < w.end ? until.slice(0, 10) : w.end;
  const total = daysBetween(w.start, last);
  if (total === null || total < 0) return { days: [], truncated: false };

  const truncated = total + 1 > MAX_WINDOW_DAYS;
  const count = truncated ? MAX_WINDOW_DAYS : total + 1;

  const days: string[] = [];
  const base = Date.parse(`${w.start}T00:00:00Z`);
  for (let i = 0; i < count; i += 1) {
    days.push(new Date(base + i * 86_400_000).toISOString().slice(0, 10));
  }
  return { days, truncated };
}
