import { z } from 'zod';

// ============================================================================
// NỀN TẢNG DÙNG CHUNG CHO MỌI LƯỢC ĐỒ MERCHANDISER
//
// Khai báo MỘT LẦN, dùng cho cả React Hook Form (client) và Server Action
// (server). Nếu chỉ validate ở client thì bất kỳ ai gọi thẳng Server Action
// cũng bỏ qua được toàn bộ ràng buộc — Server Action là endpoint HTTP công
// khai, không phải hàm nội bộ.
//
// ─── QUY ƯỚC NHÃN TIẾNG VIỆT ─────────────────────────────────────────────
// Mỗi bộ giá trị enum đi kèm một bản đồ nhãn tiếng Việt đặt NGAY CẠNH nó
// trong cùng file. Tách nhãn sang file khác thì thêm giá trị mới rất dễ quên
// cập nhật nhãn, và lỗi đó không thể phát hiện lúc biên dịch.
// Kiểu Record<Enum, string> buộc TypeScript báo lỗi nếu thiếu bất kỳ nhãn nào.
// ============================================================================

// ─── Thời gian ──────────────────────────────────────────────────────────────

/** Hôm nay theo giờ Việt Nam. Vercel chạy UTC nên không quy đổi thì "hôm nay"
 *  sẽ nhảy sang ngày mới lúc 7 giờ sáng giờ Việt Nam. */
export function vnToday(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Cộng/trừ ngày trên chuỗi YYYY-MM-DD, trả về cùng định dạng */
export function addDays(isoDate: string, days: number): string {
  const t = Date.parse(`${isoDate}T00:00:00Z`);
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

/** Chuỗi YYYY-MM-DD có phải ngày CÓ THẬT không.
 *  Chặn 2026-02-31: đúng định dạng nhưng không tồn tại. */
function isRealDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Ô ngày bắt buộc */
export const dateField = (label: string) =>
  z
    .string()
    .min(1, `Vui lòng chọn ${label}`)
    .refine(isRealDate, { message: `${label} không hợp lệ hoặc không tồn tại` });

/** Ô ngày tuỳ chọn — chuỗi rỗng được chấp nhận */
export const optionalDate = (label: string) =>
  z
    .string()
    .refine((v) => v === '' || isRealDate(v), {
      message: `${label} không hợp lệ hoặc không tồn tại`,
    })
    .optional()
    .or(z.literal(''));

// ─── Chuỗi ──────────────────────────────────────────────────────────────────

export const requiredText = (label: string, min = 2, max = 255) =>
  z
    .string()
    .trim()
    .min(min, `${label} phải có ít nhất ${min} ký tự`)
    .max(max, `${label} quá dài (tối đa ${max} ký tự)`);

export const optionalText = (label: string, max = 255) =>
  z.string().trim().max(max, `${label} quá dài (tối đa ${max} ký tự)`).optional().or(z.literal(''));

/** Mã nghiệp vụ: chữ, số, gạch ngang, gạch dưới. Tự chuyển in hoa để
 *  "po-001" và "PO-001" không thành hai bản ghi khác nhau. */
export const businessCode = (label: string, max = 100) =>
  z
    .string()
    .trim()
    .min(2, `${label} phải có ít nhất 2 ký tự`)
    .max(max, `${label} quá dài (tối đa ${max} ký tự)`)
    .regex(/^[A-Za-z0-9_-]+$/, `${label} chỉ gồm chữ, số, gạch ngang và gạch dưới`)
    .transform((v) => v.toUpperCase());

export const uuidField = (label: string) => z.string().uuid(`Vui lòng chọn ${label}`);

/** Khoá ngoại tuỳ chọn: cho phép để trống, nhưng đã chọn thì phải là UUID */
export const optionalUuid = (label: string) =>
  z.string().uuid(`${label} không hợp lệ`).optional().or(z.literal(''));

// ─── Số ─────────────────────────────────────────────────────────────────────

/** Số lượng nguyên dương (pcs, thùng, người...) */
export const positiveInt = (label: string, max = 99_999_999) =>
  z
    .number({ error: `${label} phải là số` })
    .int(`${label} phải là số nguyên`)
    .positive(`${label} phải lớn hơn 0`)
    .max(max, `${label} vượt ngưỡng cho phép`);

/** Số thập phân dương, giới hạn số chữ số sau dấu phẩy.
 *  Định mức vải cần tới 5 số lẻ, còn tiền chỉ cần 2 — nên phải tham số hoá. */
export const positiveDecimal = (label: string, decimals = 2, max = 99_999_999) =>
  z
    .number({ error: `${label} phải là số` })
    .positive(`${label} phải lớn hơn 0`)
    .max(max, `${label} vượt ngưỡng cho phép`)
    .refine((v) => Number.isFinite(v), { message: `${label} không hợp lệ` })
    .refine((v) => Number(v.toFixed(decimals)) === v, {
      message: `${label} chỉ được tối đa ${decimals} chữ số thập phân`,
    });

/**
 * Số thập phân **cho phép bằng 0**.
 *
 * 🔴 **PHÁT HIỆN TRONG UAT 07/08/2026 — LỖI THẬT, ĐO ĐƯỢC.**
 * `customers.credit_limit` dùng `positiveDecimal`, mà `positiveDecimal` bác số
 * `0`. Trên CSDL đang chạy có **5/17 khách hàng mang `credit_limit = 0`** ⇒
 * năm hồ sơ đó **⛔ KHÔNG lưu được** từ hộp thoại Sửa: form đổ đúng giá trị
 * `0` từ CSDL, rồi chính lược đồ bác nó với câu *"Hạn mức công nợ phải lớn
 * hơn 0"*. Người dùng ⛔ không có cách nào thoát — sửa ô khác cũng ⛔ không lưu
 * được.
 *
 * 🔑 Và `0` ở đây là **một phát biểu nghiệp vụ THẬT**: *"khách này ⛔ không
 * được nợ đồng nào"* — khác hẳn `null` = *"⛔ chưa khai hạn mức"*. Bác nó là
 * bác một sự thật.
 *
 * ⚠️ Lỗi này **⛔ không lộ ra khi chỉ có form Tạo mới**: lúc tạo, người dùng
 * để trống ⇒ `undefined` ⇒ lược đồ cho qua. Nó chỉ hiện khi có đường **Sửa** —
 * và đó là đường `BUG-5` vừa mở.
 */
export const nonNegativeDecimal = (label: string, decimals = 2, max = 99_999_999) =>
  z
    .number({ error: `${label} phải là số` })
    .min(0, `${label} ⛔ không được là số âm`)
    .max(max, `${label} vượt ngưỡng cho phép`)
    .refine((v) => Number.isFinite(v), { message: `${label} không hợp lệ` })
    .refine((v) => Number(v.toFixed(decimals)) === v, {
      message: `${label} chỉ được tối đa ${decimals} chữ số thập phân`,
    });

/** Cho phép bằng 0 — dùng cho số lượng theo size (có size đặt 0 chiếc) */
export const nonNegativeInt = (label: string, max = 99_999_999) =>
  z
    .number({ error: `${label} phải là số` })
    .int(`${label} phải là số nguyên`)
    .min(0, `${label} không được âm`)
    .max(max, `${label} vượt ngưỡng cho phép`);

/** Phần trăm 0..100 */
export const percentField = (label: string) =>
  z
    .number({ error: `${label} phải là số` })
    .min(0, `${label} không được âm`)
    .max(100, `${label} không được vượt 100`);

// ─── Liên hệ ────────────────────────────────────────────────────────────────

export const optionalEmail = z
  .string()
  .trim()
  .max(255, 'Email quá dài')
  .refine((v) => v === '' || z.string().email().safeParse(v).success, {
    message: 'Email không đúng định dạng',
  })
  .optional()
  .or(z.literal(''));

export const optionalPhone = z
  .string()
  .trim()
  .max(50, 'Số điện thoại quá dài')
  .refine((v) => v === '' || /^[0-9+\s().-]{6,}$/.test(v), {
    message: 'Số điện thoại không hợp lệ',
  })
  .optional()
  .or(z.literal(''));

/** Đường dẫn tệp trong Supabase Storage.
 *  LUÔN tuỳ chọn: mạng ở xưởng chập chờn, chặn cứng sẽ khiến không lập nổi
 *  phiếu khi upload lỗi — mà phiếu là thứ nghiệp vụ cần trước, ảnh bổ sung sau. */
export const storagePath = z.string().trim().max(500).optional().or(z.literal(''));

// ─── Bộ giá trị dùng chung + nhãn tiếng Việt ────────────────────────────────

/** Hình thức gia công. CM/CMT/CMPT/CMPTH khác nhau ở phạm vi nhà máy lo:
 *  chỉ công may, hay lo thêm chỉ, phụ liệu, bao bì. */
export const ORDER_TYPES = ['FOB', 'CM', 'CMT', 'CMPT', 'CMPTH'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];
export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  FOB: 'FOB — Mua NPL & bán thành phẩm',
  CM: 'CM — Chỉ tính công may',
  CMT: 'CMT — Công may & cắt',
  CMPT: 'CMPT — Công may, cắt & phụ liệu',
  CMPTH: 'CMPTH — Trọn gói trừ vải chính',
};

export const INCOTERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] as const;
export type Incoterm = (typeof INCOTERMS)[number];
export const INCOTERM_LABEL: Record<Incoterm, string> = {
  EXW: 'EXW — Giao tại xưởng',
  FCA: 'FCA — Giao cho người vận chuyển',
  FOB: 'FOB — Giao lên tàu',
  CFR: 'CFR — Tiền hàng & cước',
  CIF: 'CIF — Tiền hàng, bảo hiểm & cước',
  DAP: 'DAP — Giao tại nơi đến',
  DDP: 'DDP — Giao đã nộp thuế',
};

export const CURRENCIES = ['USD', 'EUR', 'JPY', 'VND', 'CNY', 'KRW'] as const;
export type Currency = (typeof CURRENCIES)[number];
export const CURRENCY_LABEL: Record<Currency, string> = {
  USD: 'USD — Đô la Mỹ',
  EUR: 'EUR — Euro',
  JPY: 'JPY — Yên Nhật',
  VND: 'VND — Việt Nam Đồng',
  CNY: 'CNY — Nhân dân tệ',
  KRW: 'KRW — Won Hàn Quốc',
};

export const SHIP_MODES = ['SEA', 'AIR', 'ROAD', 'RAIL', 'EXPRESS'] as const;
export type ShipMode = (typeof SHIP_MODES)[number];
export const SHIP_MODE_LABEL: Record<ShipMode, string> = {
  SEA: 'Đường biển',
  AIR: 'Đường hàng không',
  ROAD: 'Đường bộ',
  RAIL: 'Đường sắt',
  EXPRESS: 'Chuyển phát nhanh',
};

export const MATERIAL_CATEGORIES = ['FABRIC', 'TRIM', 'ACCESSORY', 'PACKAGING', 'OTHER'] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];
export const MATERIAL_CATEGORY_LABEL: Record<MaterialCategory, string> = {
  FABRIC: 'Vải chính',
  TRIM: 'Phụ liệu (chỉ, nhãn, khoá...)',
  ACCESSORY: 'Phụ kiện',
  PACKAGING: 'Vật tư đóng gói',
  OTHER: 'Khác',
};

// ─── Kết quả trả về của Server Action ───────────────────────────────────────

export interface ActionResult<T = void> {
  ok: boolean;
  message: string;
  /** Lỗi theo TỪNG Ô để form tô đỏ đúng chỗ, thay vì một câu chung chung */
  fieldErrors?: Record<string, string>;
  data?: T;
}

/** Gom lỗi Zod theo tên ô. Chỉ giữ lỗi ĐẦU TIÊN của mỗi ô: hiện chồng nhiều
 *  lỗi trên cùng một ô làm người dùng rối, sửa xong lỗi này lại hiện lỗi kia. */
export function zodFieldErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !out[key]) out[key] = issue.message;
  }
  return out;
}
