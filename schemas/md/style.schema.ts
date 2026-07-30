import { z } from 'zod';

import {
  businessCode,
  requiredText,
  optionalText,
  optionalUuid,
  positiveDecimal,
  percentField,
  nonNegativeInt,
  storagePath,
  MATERIAL_CATEGORIES,
} from './common';

// ============================================================================
// MÃ HÀNG (STYLE MASTER) — TRUNG TÂM DỮ LIỆU CỦA TOÀN HỆ THỐNG
//
// Định mức NPL, SAM và bảng màu/size đều gắn vào MÃ HÀNG, không gắn vào PO.
// Nhu cầu NPL của một PO = style_bom × số lượng PO, TÍNH RA chứ không nhập
// lại — đây chính là nguyên tắc "không nhập dữ liệu hai lần".
// Một mã hàng dùng cho nhiều PO qua các mùa.
// ============================================================================

export const STYLE_STATUSES = ['DEVELOPMENT', 'APPROVED', 'IN_PRODUCTION', 'DISCONTINUED'] as const;
export type StyleStatus = (typeof STYLE_STATUSES)[number];
export const STYLE_STATUS_LABEL: Record<StyleStatus, string> = {
  DEVELOPMENT: 'Đang phát triển',
  APPROVED: 'Đã duyệt',
  IN_PRODUCTION: 'Đang sản xuất',
  DISCONTINUED: 'Ngừng sản xuất',
};

export const GENDERS = ['MEN', 'WOMEN', 'KIDS', 'UNISEX'] as const;
export type Gender = (typeof GENDERS)[number];
export const GENDER_LABEL: Record<Gender, string> = {
  MEN: 'Nam',
  WOMEN: 'Nữ',
  KIDS: 'Trẻ em',
  UNISEX: 'Unisex',
};

// ─── Mã hàng ────────────────────────────────────────────────────────────────
export const styleFormSchema = z.object({
  style_no: businessCode('Mã hàng'),
  style_name: requiredText('Tên mã hàng'),
  customer_id: optionalUuid('Khách hàng'),
  season_id: optionalUuid('Mùa vụ'),
  product_group: optionalText('Nhóm hàng', 100),
  gender: z.enum(GENDERS).optional().or(z.literal('')),
  hs_code: optionalText('Mã HS', 50),
  fabric_type: optionalText('Loại vải'),

  // Kỹ thuật
  // SAM tới 3 số lẻ: chênh 0,01 phút trên 100.000 sản phẩm là 1.000 phút công,
  // đủ để lệch cả một ca sản xuất.
  sam_minutes: positiveDecimal('Thời gian chuẩn (SAM)', 3, 9999).optional(),
  needle_type: optionalText('Loại kim', 100),
  machine_types: optionalText('Loại máy', 1000),
  marker_code: optionalText('Mã sơ đồ rập', 100),
  marker_length_m: positiveDecimal('Chiều dài sơ đồ', 3, 9999).optional(),
  marker_efficiency: percentField('Hiệu suất sơ đồ').optional(),
  tech_pack_url: storagePath,

  status: z.enum(STYLE_STATUSES).default('DEVELOPMENT'),
  notes: optionalText('Ghi chú', 2000),
});
export type StyleFormValues = z.infer<typeof styleFormSchema>;

// ─── Bảng màu ───────────────────────────────────────────────────────────────
export const colorwayFormSchema = z.object({
  style_id: z.string().uuid('Thiếu mã hàng'),
  color_code: businessCode('Mã màu', 50),
  color_name: requiredText('Tên màu'),
  pantone: optionalText('Mã Pantone', 50),
  // Chỉ để xem trước trên giao diện, KHÔNG phải màu chuẩn để sản xuất —
  // màu chuẩn luôn là mã Pantone, màn hình mỗi máy hiển thị một khác.
  hex_preview: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Mã màu xem trước phải dạng #RRGGBB')
    .optional()
    .or(z.literal('')),
});
export type ColorwayFormValues = z.infer<typeof colorwayFormSchema>;

// ─── Bảng size ──────────────────────────────────────────────────────────────
export const sizeFormSchema = z.object({
  style_id: z.string().uuid('Thiếu mã hàng'),
  size_code: requiredText('Mã size', 1, 20),
  // sort_order quyết định thứ tự hiển thị. Sắp theo bảng chữ cái sẽ ra
  // L, M, S — sai hoàn toàn so với thứ tự thật S < M < L.
  sort_order: nonNegativeInt('Thứ tự hiển thị', 999),
  size_group: optionalText('Nhóm size', 50),
});
export type SizeFormValues = z.infer<typeof sizeFormSchema>;

/** Nhập nhanh cả dải size: "S,M,L,XL" -> tự đánh số thứ tự theo đúng thứ tự gõ.
 *  Nhập từng size một cho một mã hàng 8 size là 8 lần mở hộp thoại. */
export const sizeRangeSchema = z.object({
  style_id: z.string().uuid('Thiếu mã hàng'),
  sizes: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập dải size')
    .refine((v) => v.split(',').filter((s) => s.trim()).length > 0, {
      message: 'Dải size không hợp lệ',
    })
    .refine((v) => {
      const arr = v.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
      return new Set(arr).size === arr.length;
    }, { message: 'Dải size có mã trùng nhau' }),
  size_group: optionalText('Nhóm size', 50),
});
export type SizeRangeValues = z.infer<typeof sizeRangeSchema>;

/** Tách "S, M, L" thành mảng đã chuẩn hoá, giữ nguyên thứ tự người dùng gõ */
export function parseSizeRange(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

// ─── Công đoạn & SAM ────────────────────────────────────────────────────────
export const operationFormSchema = z.object({
  style_id: z.string().uuid('Thiếu mã hàng'),
  seq_no: nonNegativeInt('Số thứ tự', 999),
  operation: requiredText('Tên công đoạn'),
  machine_type: optionalText('Loại máy', 100),
  sam_minutes: positiveDecimal('Thời gian chuẩn (SAM)', 3, 9999),
  notes: optionalText('Ghi chú', 500),
});
export type OperationFormValues = z.infer<typeof operationFormSchema>;

// ─── Định mức NPL (BOM của mã hàng) ─────────────────────────────────────────
export const styleBomFormSchema = z.object({
  style_id: z.string().uuid('Thiếu mã hàng'),
  // Để trống = áp cho MỌI màu. Chỉ chọn màu khi định mức khác nhau giữa các
  // màu (ví dụ vải phối, chỉ cùng tông).
  colorway_id: optionalUuid('Màu áp dụng'),
  material_id: optionalUuid('Mã vật tư trong kho'),
  item_name: requiredText('Tên nguyên phụ liệu'),
  category: z.enum(MATERIAL_CATEGORIES).default('FABRIC'),
  unit: requiredText('Đơn vị tính', 1, 20),
  // 5 số lẻ: định mức vải thường là 1,23456 m/sp; làm tròn sớm sẽ lệch hàng
  // trăm mét trên một đơn 100.000 sản phẩm.
  consumption_per_pcs: positiveDecimal('Định mức / sản phẩm', 5, 99999),
  wastage_percent: percentField('Tỷ lệ hao hụt').default(3),
  supplier: optionalText('Nhà cung cấp'),
  notes: optionalText('Ghi chú', 1000),
});
export type StyleBomFormValues = z.infer<typeof styleBomFormSchema>;

// ─── Kiểu dòng đọc về ───────────────────────────────────────────────────────

export interface StyleRow {
  id: string;
  style_no: string;
  style_name: string;
  product_group: string | null;
  gender: string | null;
  sam_minutes: number | null;
  status: string;
  customer_name: string | null;
  season_code: string | null;
  /** Đếm sẵn ở tầng truy vấn để bảng danh sách không phải gọi thêm lần nào */
  colorway_count: number;
  size_count: number;
  bom_count: number;
  order_count: number;
}

export interface ColorwayRow {
  id: string;
  color_code: string;
  color_name: string;
  pantone: string | null;
  hex_preview: string | null;
  is_active: boolean;
}

export interface SizeRow {
  id: string;
  size_code: string;
  sort_order: number;
  size_group: string | null;
}

export interface OperationRow {
  id: string;
  seq_no: number;
  operation: string;
  machine_type: string | null;
  sam_minutes: number;
}

export interface StyleBomRow {
  id: string;
  item_name: string;
  category: string;
  unit: string;
  consumption_per_pcs: number;
  wastage_percent: number;
  /** Cột SINH TỰ ĐỘNG trong SQL = định mức × (1 + hao hụt%). Chỉ đọc. */
  net_consumption: number;
  supplier: string | null;
  color_code: string | null;
}

/** Tổng SAM từ danh sách công đoạn — dùng để đối chiếu với SAM khai ở mã hàng.
 *  Lệch nhau nghĩa là bảng công đoạn chưa cập nhật hoặc SAM khai sai. */
export function sumOperationSam(rows: ReadonlyArray<{ sam_minutes: number }>): number {
  return Number(rows.reduce((s, r) => s + (r.sam_minutes || 0), 0).toFixed(3));
}
