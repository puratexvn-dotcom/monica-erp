import { z } from 'zod';
import { ngayVN } from '@/lib/time';

// ============================================================================
// LƯỢC ĐỒ DÙNG CHUNG CHO PHÂN HỆ MERCHANDISER
//
// Khai báo một lần, dùng cho cả React Hook Form (client) và Server Action
// (server). Chỉ validate ở client thì ai gọi thẳng Server Action cũng bỏ qua
// được toàn bộ ràng buộc — Server Action là endpoint HTTP công khai.
// ============================================================================

/** Ngày hôm nay theo giờ Việt Nam. Vercel chạy UTC nên không quy đổi thì
 *  "hôm nay" nhảy sang ngày mới lúc 7 giờ sáng giờ Việt Nam. */
export function vnToday(): string {
  return ngayVN();
}

/** Chuỗi YYYY-MM-DD có phải ngày thật không (chặn 2026-02-31). */
function isRealDate(v: string): boolean {
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const dateField = (label: string) =>
  z
    .string()
    .min(1, `Vui lòng chọn ${label}`)
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), { message: `${label} không hợp lệ` })
    .refine(isRealDate, { message: `${label} không tồn tại` });

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} quá dài`).optional().or(z.literal(''));

/** Đường dẫn ảnh chứng từ trong bucket `evidences`. Luôn tuỳ chọn: mạng ở
 *  xưởng hay chập chờn, chặn cứng sẽ khiến không tạo nổi phiếu khi upload lỗi. */
const evidenceField = z.string().trim().max(500).optional().or(z.literal(''));

// ── 1. KHÁCH HÀNG ───────────────────────────────────────────────────────────
export const customerFormSchema = z.object({
  customer_code: z
    .string()
    .trim()
    .min(2, 'Mã khách hàng phải từ 2 ký tự')
    .max(50, 'Mã khách hàng quá dài')
    .regex(/^[A-Za-z0-9-]+$/, 'Mã chỉ gồm chữ, số và dấu gạch ngang')
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2, 'Vui lòng nhập tên khách hàng').max(255, 'Tên quá dài'),
  contact_person: optionalText(255, 'Người liên hệ'),
  phone: z
    .string()
    .trim()
    .max(50, 'Số điện thoại quá dài')
    .refine((v) => v === '' || /^[0-9+\s().-]{6,}$/.test(v), {
      message: 'Số điện thoại không hợp lệ',
    })
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .max(255)
    .refine((v) => v === '' || z.string().email().safeParse(v).success, {
      message: 'Email không đúng định dạng',
    })
    .optional()
    .or(z.literal('')),
  country: optionalText(100, 'Quốc gia'),
  address: optionalText(1000, 'Địa chỉ'),
  notes: optionalText(1000, 'Ghi chú'),
});
export type CustomerFormValues = z.infer<typeof customerFormSchema>;

// ── 2. ĐỀ NGHỊ MUA NPL ──────────────────────────────────────────────────────
export const MATERIAL_CATEGORIES = ['FABRIC', 'TRIM', 'ACCESSORY', 'PACKAGING', 'OTHER'] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const MATERIAL_CATEGORY_LABEL: Record<MaterialCategory, string> = {
  FABRIC: 'Vải chính',
  TRIM: 'Phụ liệu (chỉ, nhãn, khoá...)',
  ACCESSORY: 'Phụ kiện',
  PACKAGING: 'Vật tư đóng gói',
  OTHER: 'Khác',
};

export const materialRequestSchema = z.object({
  request_no: z
    .string()
    .trim()
    .min(3, 'Số phiếu phải từ 3 ký tự')
    .max(100, 'Số phiếu quá dài')
    .transform((v) => v.toUpperCase()),
  order_id: z.string().uuid('Vui lòng chọn đơn hàng').optional().or(z.literal('')),
  material_name: z.string().trim().min(2, 'Vui lòng nhập tên NPL').max(255, 'Tên NPL quá dài'),
  category: z.enum(MATERIAL_CATEGORIES),
  quantity: z
    .number({ error: 'Số lượng phải là số' })
    .positive('Số lượng phải lớn hơn 0')
    .max(9_999_999, 'Số lượng vượt ngưỡng')
    .refine((v) => Number.isFinite(v), { message: 'Số lượng không hợp lệ' })
    .refine((v) => Math.round(v * 100) === v * 100, {
      message: 'Chỉ được tối đa 2 chữ số thập phân',
    }),
  unit: z.string().trim().min(1, 'Vui lòng nhập đơn vị').max(20, 'Đơn vị quá dài'),
  needed_date: dateField('ngày cần hàng'),
  notes: optionalText(1000, 'Ghi chú'),
  evidence_path: evidenceField,
});
export type MaterialRequestValues = z.infer<typeof materialRequestSchema>;

// ── 3. LỆNH SẢN XUẤT ────────────────────────────────────────────────────────
export const productionOrderSchema = z
  .object({
    order_no: z
      .string()
      .trim()
      .min(3, 'Số lệnh phải từ 3 ký tự')
      .max(100, 'Số lệnh quá dài')
      .transform((v) => v.toUpperCase()),
    order_id: z.string().uuid('Vui lòng chọn đơn hàng cần sản xuất'),
    planned_qty: z
      .number({ error: 'Số lượng phải là số' })
      .int('Số lượng phải là số nguyên')
      .positive('Số lượng phải lớn hơn 0')
      .max(9_999_999, 'Số lượng vượt ngưỡng'),
    start_date: dateField('ngày bắt đầu'),
    due_date: dateField('ngày tới hạn'),
    notes: optionalText(1000, 'Ghi chú'),
    evidence_path: evidenceField,
  })
  // Kiểm ở đây thay vì chỉ dựa vào CHECK trong DB: lỗi từ DB trả về dạng tên
  // ràng buộc, người dùng đọc không hiểu gì.
  .refine((v) => v.due_date >= v.start_date, {
    message: 'Ngày tới hạn không được trước ngày bắt đầu',
    path: ['due_date'],
  });
export type ProductionOrderValues = z.infer<typeof productionOrderSchema>;

// ── 4. LỆNH GIAO HÀNG ───────────────────────────────────────────────────────
export const shipmentFormSchema = z.object({
  shipment_no: z
    .string()
    .trim()
    .min(3, 'Số lệnh giao phải từ 3 ký tự')
    .max(100, 'Số lệnh quá dài')
    .transform((v) => v.toUpperCase()),
  order_id: z.string().uuid('Vui lòng chọn đơn hàng cần giao'),
  container_no: optionalText(50, 'Số container'),
  seal_no: optionalText(50, 'Số seal'),
  vessel_name: optionalText(100, 'Tên tàu'),
  destination_port: optionalText(100, 'Cảng đến'),
  etd_date: dateField('ngày dự kiến rời cảng'),
  notes: optionalText(1000, 'Ghi chú'),
  evidence_path: evidenceField,
});
export type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;

// ── Kiểu dòng đọc về để hiển thị ────────────────────────────────────────────
export interface CustomerRow {
  id: string;
  customer_code: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  country: string | null;
  is_active: boolean;
}

export interface MaterialRequestRow {
  id: string;
  request_no: string;
  material_name: string;
  category: string;
  quantity: number;
  unit: string;
  needed_date: string | null;
  status: string;
  evidence_path: string | null;
  po_number: string | null;
}

export interface ProductionOrderRow {
  id: string;
  order_no: string;
  planned_qty: number;
  start_date: string | null;
  due_date: string | null;
  status: string;
  evidence_path: string | null;
  po_number: string | null;
}

export interface ShipmentRow {
  id: string;
  shipment_no: string;
  container_no: string | null;
  destination_port: string | null;
  etd_date: string | null;
  status: string;
  evidence_path: string | null;
  po_number: string | null;
}

export const MR_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã trình',
  APPROVED: 'Đã duyệt',
  ORDERED: 'Đã đặt mua',
  RECEIVED: 'Đã nhận',
  REJECTED: 'Bị từ chối',
};

export const PROD_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  RELEASED: 'Đã phát hành',
  IN_PROGRESS: 'Đang chạy',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};
