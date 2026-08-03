import { MUI_GIO } from '@/lib/time';

// ============================================================================
// ĐỊNH DẠNG THEO NGÔN NGỮ — Hiến pháp Điều 45.6 · Locale Formatting
//
// ═══ ⚠️ MÚI GIỜ KHÔNG ĐỔI THEO NGÔN NGỮ ════════════════════════════════
// Đổi ngôn ngữ là đổi CÁCH VIẾT, không phải đổi MÚI GIỜ. Nhà máy ở
// Asia/Ho_Chi_Minh; một lô hàng xuất lúc 14:00 giờ Việt Nam thì người xem bản
// tiếng Trung cũng phải thấy 14:00, không phải 15:00 giờ Bắc Kinh.
//
// Vì vậy mọi hàm dưới đây ép `timeZone: MUI_GIO` (xem `lib/time.ts` — nguồn sự
// thật duy nhất về giờ vận hành). Bỏ ràng buộc đó là mở đường cho hai người
// cùng nhìn một chứng từ mà đọc ra hai mốc thời gian khác nhau.
//
// ═══ VÌ SAO KHÔNG DÙNG `toLocaleDateString()` TRỰC TIẾP Ở MÀN HÌNH ═════
// Ba lý do: ① mỗi nơi gọi sẽ tự chọn tuỳ chọn khác nhau ⇒ cùng một ngày hiện
// ba kiểu; ② dễ quên `timeZone` ⇒ sai ngày quanh nửa đêm; ③ đổi quy ước hiển
// thị sẽ phải sửa hàng trăm chỗ. Gom về đây: một chỗ, một quy ước.
// ============================================================================

export type Language = 'VN' | 'EN' | 'CN';

/** Mã locale BCP-47 của từng ngôn ngữ hiến định. */
export const LOCALE: Record<Language, string> = {
  VN: 'vi-VN',
  EN: 'en-US',
  CN: 'zh-CN',
};

/**
 * Khuôn ngày theo yêu cầu Board:
 *   VN  dd/MM/yyyy   ·  EN  MMM dd, yyyy  ·  CN  yyyy/MM/dd
 *
 * Cố ý KHÔNG dùng `dateStyle` dựng sẵn: `dateStyle:'short'` của `en-US` cho ra
 * `8/3/26` — hai chữ số năm, và tháng/ngày dễ đọc ngược. Trong chứng từ xuất
 * hàng, đọc ngược ngày là sai một chuyến tàu.
 */
const DATE_OPTS: Record<Language, Intl.DateTimeFormatOptions> = {
  VN: { day: '2-digit', month: '2-digit', year: 'numeric' },
  EN: { month: 'short', day: '2-digit', year: 'numeric' },
  CN: { year: 'numeric', month: '2-digit', day: '2-digit' },
};

function toDate(v: string | number | Date | null | undefined): Date | null {
  if (v === null || v === undefined || v === '') return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Ngày theo quy ước của ngôn ngữ đang chọn.
 *
 * Trả `'—'` khi không có giá trị. ⚠️ KHÔNG trả chuỗi rỗng: ô trống trong bảng
 * đọc ra là "đang tải", còn dấu gạch đọc ra là "không có" — hai nghĩa khác hẳn.
 */
export function formatDate(v: string | number | Date | null | undefined, lang: Language): string {
  const d = toDate(v);
  if (!d) return '—';
  return new Intl.DateTimeFormat(LOCALE[lang], { ...DATE_OPTS[lang], timeZone: MUI_GIO }).format(d);
}

/** Ngày kèm giờ phút, 24 giờ ở cả ba ngôn ngữ (quy ước nhà máy). */
export function formatDateTime(v: string | number | Date | null | undefined, lang: Language): string {
  const d = toDate(v);
  if (!d) return '—';
  return new Intl.DateTimeFormat(LOCALE[lang], {
    ...DATE_OPTS[lang],
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: MUI_GIO,
  }).format(d);
}

/** Chỉ giờ phút, 24 giờ. */
export function formatTime(v: string | number | Date | null | undefined, lang: Language): string {
  const d = toDate(v);
  if (!d) return '—';
  return new Intl.DateTimeFormat(LOCALE[lang], {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: MUI_GIO,
  }).format(d);
}

/**
 * Số có phân tách hàng nghìn theo ngôn ngữ.
 *
 * ⚠️ Khác biệt thật, không phải tiểu tiết: `1.234,5` (VN) và `1,234.5` (EN) đảo
 * ngược vai trò dấu chấm và dấu phẩy. Ghép chuỗi bằng tay ở màn hình là cách
 * chắc chắn để một trong hai ngôn ngữ đọc sai hệ số nghìn.
 */
export function formatNumber(
  v: number | null | undefined,
  lang: Language,
  opts: Intl.NumberFormatOptions = {},
): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return new Intl.NumberFormat(LOCALE[lang], opts).format(v);
}

/**
 * Tiền tệ. ⚠️ Đơn vị tiền là THUỘC TÍNH CỦA CHỨNG TỪ, không phải của ngôn ngữ:
 * một PO tính bằng USD vẫn là USD khi xem ở bản tiếng Việt. Vì vậy `currency`
 * là tham số bắt buộc — không có mặc định để không ai vô tình đổi tiền tệ của
 * một chứng từ chỉ vì đổi ngôn ngữ giao diện.
 */
export function formatCurrency(
  v: number | null | undefined,
  currency: string,
  lang: Language,
): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency }).format(v);
}

/** Phần trăm. `v` là TỶ LỆ (0,975), không phải số phần trăm (97,5). */
export function formatPercent(
  v: number | null | undefined,
  lang: Language,
  digits = 1,
): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);
}
