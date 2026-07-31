import { z } from 'zod';

// ============================================================================
// NỀN CHUNG CHO LƯỢC ĐỒ KHO
//
// Mọi enum đặt CÙNG CHỖ với bảng nhãn tiếng Việt của nó. Tách hai thứ ra hai
// file là cách chắc chắn để một ngày nào đó thêm giá trị mới mà quên thêm nhãn,
// rồi giao diện hiện ra một mã tiếng Anh trần trụi giữa màn hình tiếng Việt.
// ============================================================================

// ─── Tiện ích ngày giờ ──────────────────────────────────────────────────────

/** Hôm nay theo giờ Việt Nam (UTC+7). Máy chủ chạy giờ UTC nên phải bù, không
 *  thì sau 17h chiều mọi so sánh "quá hạn" đều lệch một ngày. */
export function vnToday(): string {
  return new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
}

/** Số ngày từ `date` tới `today`. Dương = đã qua, âm = còn hạn. */
export function daysPast(date: string, today: string): number {
  return Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000);
}

// ─── Trường dùng lại ────────────────────────────────────────────────────────

export const requiredText = (label: string, min = 1, max = 255) =>
  z.string().trim().min(min, `${label} không được để trống`).max(max, `${label} quá dài`);

export const optionalText = (label: string, max = 255) =>
  z.string().trim().max(max, `${label} quá dài`).optional().or(z.literal(''));

export const uuidField = (label: string) => z.string().uuid(`Chưa chọn ${label}`);

export const optionalUuid = (label: string) =>
  z.string().uuid(`${label} không hợp lệ`).optional().or(z.literal(''));

export const dateField = (label: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `Chưa chọn ${label}`);

export const optionalDate = (label: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} không hợp lệ`).optional().or(z.literal(''));

/** Số lượng kho: 3 số lẻ. Vải tính tới mm, phụ liệu tính chiếc — ba số lẻ phủ
 *  được cả hai mà không sinh sai số cộng dồn như số thực nhị phân. */
export const qtyField = (label: string, max = 9_999_999) =>
  z.coerce
    .number({ error: `${label} phải là số` })
    .positive(`${label} phải lớn hơn 0`)
    .max(max, `${label} vượt quá giới hạn`)
    .refine((v) => Number.isFinite(v) && Math.round(v * 1000) === v * 1000, {
      message: `${label} tối đa 3 số lẻ`,
    });

/** Cho phép 0: đếm kiểm kê ra 0 là kết quả hợp lệ, thậm chí là kết quả quan
 *  trọng nhất — nó nghĩa là hàng đã biến mất khỏi ô kệ. */
export const nonNegQty = (label: string, max = 9_999_999) =>
  z.coerce
    .number({ error: `${label} phải là số` })
    .min(0, `${label} không được âm`)
    .max(max, `${label} vượt quá giới hạn`);

export const moneyField = (label: string) =>
  z.coerce.number({ error: `${label} phải là số` }).min(0, `${label} không được âm`);

// ─── Đơn vị tính ────────────────────────────────────────────────────────────

export const UOMS = ['METERS', 'YARDS', 'KG', 'PCS', 'ROLLS', 'BOX', 'SET', 'CONE'] as const;
export type Uom = (typeof UOMS)[number];
export const UOM_LABEL: Record<Uom, string> = {
  METERS: 'Mét',
  YARDS: 'Yard',
  KG: 'Kilôgam',
  PCS: 'Cái',
  ROLLS: 'Cuộn',
  BOX: 'Thùng',
  SET: 'Bộ',
  CONE: 'Cuộn chỉ',
};

// ─── Nhóm vật tư ────────────────────────────────────────────────────────────

export const MATERIAL_CATEGORIES = ['FABRIC', 'TRIMS', 'THREAD', 'PACKAGING', 'OTHER'] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];
export const MATERIAL_CATEGORY_LABEL: Record<MaterialCategory, string> = {
  FABRIC: 'Vải',
  TRIMS: 'Phụ liệu',
  THREAD: 'Chỉ may',
  PACKAGING: 'Bao bì đóng gói',
  OTHER: 'Khác',
};

/** Phân loại phụ liệu chi tiết. Khớp ràng buộc materials_sub_category_valid
 *  trong migration 017 — thêm giá trị ở đây phải sửa cả migration. */
export const SUB_CATEGORIES = [
  'ELASTIC', 'MAIN_LABEL', 'SIDE_LABEL', 'HANGTAG', 'BUTTON', 'HOOK', 'ZIPPER',
  'TAPE', 'CARTON', 'POLYBAG', 'THREAD', 'NEEDLE', 'INTERLINING', 'VELCRO', 'OTHER',
] as const;
export type SubCategory = (typeof SUB_CATEGORIES)[number];
export const SUB_CATEGORY_LABEL: Record<SubCategory, string> = {
  ELASTIC: 'Thun',
  MAIN_LABEL: 'Nhãn chính',
  SIDE_LABEL: 'Nhãn sườn',
  HANGTAG: 'Thẻ bài',
  BUTTON: 'Nút',
  HOOK: 'Móc',
  ZIPPER: 'Dây kéo',
  TAPE: 'Băng keo',
  CARTON: 'Thùng carton',
  POLYBAG: 'Bao nilon',
  THREAD: 'Chỉ',
  NEEDLE: 'Kim',
  INTERLINING: 'Keo dựng',
  VELCRO: 'Dán gai',
  OTHER: 'Phụ liệu khác',
};

// ─── Khu vực kho ────────────────────────────────────────────────────────────

export const ZONE_TYPES = ['GENERAL', 'FABRIC', 'ACCESSORY', 'QUARANTINE', 'STAGING', 'SCRAP'] as const;
export type ZoneType = (typeof ZONE_TYPES)[number];
export const ZONE_TYPE_LABEL: Record<ZoneType, string> = {
  GENERAL: 'Khu chung',
  FABRIC: 'Khu vải',
  ACCESSORY: 'Khu phụ liệu',
  QUARANTINE: 'Khu cách ly (chờ kiểm)',
  STAGING: 'Khu tập kết chờ xuất',
  SCRAP: 'Khu phế liệu',
};

// ─── Trạng thái QA ──────────────────────────────────────────────────────────

export const QA_STATUSES = ['PENDING', 'PASSED', 'FAILED', 'CONDITIONAL'] as const;
export type QaStatus = (typeof QA_STATUSES)[number];
export const QA_STATUS_LABEL: Record<QaStatus, string> = {
  PENDING: 'Chờ kiểm',
  PASSED: 'Đạt',
  FAILED: 'Không đạt',
  CONDITIONAL: 'Đạt có điều kiện',
};

// ─── Kết quả trả về của Server Action ───────────────────────────────────────

export interface ActionResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
  /** Lỗi gắn vào từng ô nhập, để form tô đỏ đúng chỗ */
  fieldErrors?: Record<string, string>;
}

/** Gom lỗi Zod về dạng { tên ô: câu lỗi }. Chỉ giữ lỗi ĐẦU TIÊN của mỗi ô —
 *  dội bốn câu lỗi vào một ô thì người dùng không biết sửa cái nào trước. */
export function zodFieldErrors(
  issues: ReadonlyArray<{ path: (string | number)[]; message: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? '_');
    if (!(key in out)) out[key] = i.message;
  }
  return out;
}

/** Tra nhãn tiếng Việt. Không thấy thì trả về MÃ GỐC chứ không để trống —
 *  người vận hành còn biết mà báo lại là thiếu nhãn. */
export function labelOf(map: Record<string, string>, code: string | null | undefined): string {
  if (!code) return '—';
  return map[code] ?? code;
}
