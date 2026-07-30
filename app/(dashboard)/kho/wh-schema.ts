import { z } from 'zod';

// ============================================================================
// LƯỢC ĐỒ KHO NGUYÊN PHỤ LIỆU
//
// Bảng thật:
//   materials              — danh mục NPL, tồn hiện tại (stock_qty, min_stock_qty)
//   warehouse_transactions — sổ xuất/nhập, tham chiếu material_id và order_id
//
// Dùng chung cho React Hook Form (client) và Server Action (server): khai báo
// một lần để hai phía không lệch luật. Chỉ chặn ở client là vô nghĩa vì Server
// Action là endpoint HTTP công khai.
// ============================================================================

// ⚠️ Các giá trị này phải KHỚP dữ liệu đang có trong bảng materials, không
// phải bộ mã lý tưởng. Đã dò DB thật: category đang dùng FABRIC / TRIMS /
// THREAD, unit đang dùng METERS / PCS / ROLLS. Nếu đặt enum khác đi thì cổng
// kiểm tra đơn vị ở createInbound sẽ chặn mọi lần nhập bổ sung cho mã cũ —
// người dùng không cộng thêm tồn cho vải đang có được.
export const MATERIAL_CATEGORIES = [
  'FABRIC', 'TRIMS', 'THREAD', 'ACCESSORY', 'PACKAGING', 'CHEMICAL',
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<MaterialCategory, string> = {
  FABRIC: 'Vải chính',
  TRIMS: 'Phụ liệu may',
  THREAD: 'Chỉ may',
  ACCESSORY: 'Phụ kiện',
  PACKAGING: 'Bao bì đóng gói',
  CHEMICAL: 'Hoá chất / Giặt',
};

export const UNITS = ['METERS', 'YARDS', 'KG', 'PCS', 'ROLLS', 'SET', 'CONE'] as const;
export type Unit = (typeof UNITS)[number];

export const UNIT_LABEL: Record<Unit, string> = {
  METERS: 'Mét (m)',
  YARDS: 'Yard (yd)',
  KG: 'Kilogram (kg)',
  PCS: 'Cái (pcs)',
  ROLLS: 'Cuộn (roll)',
  SET: 'Bộ (set)',
  CONE: 'Cuộn chỉ (cone)',
};

export const TX_TYPES = ['IN', 'OUT'] as const;
export type TxType = (typeof TX_TYPES)[number];

export const TX_LABEL: Record<TxType, string> = { IN: 'Nhập kho', OUT: 'Xuất kho' };

/** Hôm nay theo giờ Việt Nam. Máy chủ chạy UTC nên không dùng giờ máy chủ. */
export function vnToday(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Ngày có thật hay không.
 * Không dùng Date.parse: JavaScript tự cuộn ngày tràn nên '2027-02-31' lọt qua
 * thành 03/03. Phải dựng lại chuỗi rồi so ngược, và chặn Invalid Date trước vì
 * toISOString() ném RangeError.
 */
function isRealDate(v: string): boolean {
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === v;
}

// ── Form nhập kho ───────────────────────────────────────────────────────────
export const inboundFormSchema = z.object({
  material_code: z
    .string()
    .trim()
    .min(2, 'Vui lòng nhập mã vải / NPL')
    .max(100, 'Mã NPL quá dài')
    // Chuẩn hoá HOA: material_code là cột UNIQUE và phân biệt hoa/thường, để tự
    // do thì 'fb-001' và 'FB-001' thành hai mã khác nhau cho cùng một cuộn vải.
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z0-9][A-Z0-9._/-]*$/.test(v), {
      message: 'Mã NPL chỉ gồm chữ, số và các ký tự . _ / -',
    }),

  material_name: z
    .string()
    .trim()
    .min(2, 'Vui lòng nhập tên NPL')
    .max(255, 'Tên NPL quá dài'),

  category: z.enum(MATERIAL_CATEGORIES, { error: 'Vui lòng chọn loại NPL' }),

  unit: z.enum(UNITS, { error: 'Vui lòng chọn đơn vị tính' }),

  // Số lượng nhập: dương thật sự, không nhận 0 và không nhận số âm.
  // Cột DB là NUMERIC(12,2) nên cho phép 2 chữ số thập phân (vải tính theo mét lẻ).
  quantity: z
    .number({ error: 'Số lượng phải là số' })
    .positive('Số lượng phải lớn hơn 0')
    .max(9_999_999, 'Số lượng vượt ngưỡng cho phép')
    .refine((v) => Number.isFinite(v), { message: 'Số lượng không hợp lệ' })
    .refine((v) => Math.round(v * 100) === v * 100, {
      message: 'Số lượng chỉ được có tối đa 2 chữ số thập phân',
    }),

  received_date: z
    .string()
    .min(1, 'Vui lòng chọn ngày nhập')
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), { message: 'Ngày nhập không hợp lệ' })
    .refine(isRealDate, { message: 'Ngày nhập không tồn tại' })
    // Ngày nhập KHÔNG được ở tương lai: sổ kho ghi việc đã xảy ra, cho phép
    // ghi trước là mở đường cho tồn kho ảo.
    .refine((v) => v <= vnToday(), { message: 'Ngày nhập không được ở tương lai' }),

  /** PO tham chiếu — rỗng nghĩa là nhập kho chung, không gắn đơn nào */
  order_id: z
    .string()
    .uuid('Mã PO tham chiếu không hợp lệ')
    .optional()
    .or(z.literal('')),

  reference_no: z.string().trim().max(100, 'Số chứng từ quá dài').optional().or(z.literal('')),

  notes: z.string().trim().max(1000, 'Ghi chú quá dài').optional().or(z.literal('')),
});

export type InboundFormValues = z.infer<typeof inboundFormSchema>;

// ── Kiểu dữ liệu đọc về ─────────────────────────────────────────────────────
export interface MaterialRow {
  id: string;
  material_code: string;
  name: string;
  category: string;
  unit: string;
  stock_qty: number;
  min_stock_qty: number;
}

export interface TxRow {
  id: string;
  transaction_type: string;
  quantity: number;
  reference_no: string | null;
  notes: string | null;
  created_at: string;
  material_code: string;
  material_name: string;
  unit: string;
  po_number: string | null;
}

/** Lựa chọn PO cho ô tham chiếu trong form nhập kho */
export interface PoOption {
  id: string;
  po_number: string;
  style_code: string;
  customer_name: string;
}
