import { z } from 'zod';

import {
  businessCode,
  requiredText,
  optionalText,
  optionalUuid,
  uuidField,
  dateField,
  optionalDate,
  optionalEmail,
  optionalPhone,
  positiveInt,
  nonNegativeInt,
  positiveDecimal,
  nonNegativeDecimal,
  percentField,
  ORDER_TYPES,
  INCOTERMS,
  CURRENCIES,
} from './common';

// ============================================================================
// KHÁCH HÀNG · YÊU CẦU BÁO GIÁ · CHIẾT TÍNH GIÁ
// Ba chặng đầu của vòng đời: CRM -> RFQ -> Costing -> (chốt) -> Mã hàng -> PO
// ============================================================================

// ─── 1. KHÁCH HÀNG ──────────────────────────────────────────────────────────
export const customerFormSchema = z.object({
  customer_code: businessCode('Mã khách hàng', 50),
  name: requiredText('Tên khách hàng'),
  brand: optionalText('Thương hiệu'),
  buyer_group: optionalText('Tập đoàn / Nhóm mua'),
  contact_person: optionalText('Người liên hệ chính'),
  phone: optionalPhone,
  email: optionalEmail,
  country: optionalText('Quốc gia', 100),
  address: optionalText('Địa chỉ', 1000),
  tax_code: optionalText('Mã số thuế', 50),
  currency: z.enum(CURRENCIES).default('USD'),
  incoterm: z.enum(INCOTERMS).default('FOB'),
  payment_term: optionalText('Điều khoản thanh toán', 100),
  // 🔴 `nonNegative`, ⛔ KHÔNG `positive` — lỗi thật tìm ra trong UAT
  // 07/08/2026: 5/17 khách hàng đang mang `credit_limit = 0` và ⛔ KHÔNG lưu
  // được từ hộp thoại Sửa. `0` = *"⛔ không cho nợ"*, một phát biểu nghiệp vụ
  // THẬT, khác `null` = *"⛔ chưa khai"*. Xem chú thích ở `nonNegativeDecimal`.
  credit_limit: nonNegativeDecimal('Hạn mức công nợ', 2, 999_999_999).optional(),

  // 🔴 **HỒ SƠ B2B NGÀNH MAY — Board Directive 08/08/2026.**
  //    *"Bổ sung chuẩn B2B garment: Buyer information · Commercial profile ·
  //    Payment profile · Credit rule · Product category · Market."*
  //
  // 🔑 Bốn nhóm đầu **ĐÃ CÓ** ô từ trước *(buyer_group · brand · contact_person
  // · currency · incoterm · payment_term · credit_limit)*. Bốn ô dưới đây là
  // phần **thật sự còn thiếu** — cột do migration `054` thêm.
  //
  // ⚠️ `credit_term_days` đi **CẶP** với `credit_limit`. *"Cho nợ 100.000 USD"*
  // ⛔ không nói **bao lâu**; thiếu số ngày thì kế toán ⛔ không tính nổi tuổi
  // nợ, và *"Credit rule"* mà Board hỏi mới có một nửa. Cùng luật ba trạng
  // thái: `0` = trả ngay (COD) · `undefined` = ⛔ chưa khai.
  credit_term_days: nonNegativeInt('Số ngày cho nợ').max(365, 'Số ngày cho nợ tối đa 365').optional(),
  product_categories: optionalText('Nhóm hàng', 500),
  market: optionalText('Thị trường', 200),
  buyer_since: optionalDate('Khách hàng từ'),

  notes: optionalText('Ghi chú', 2000),
});
export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const customerContactSchema = z.object({
  customer_id: uuidField('khách hàng'),
  full_name: requiredText('Họ tên'),
  job_title: optionalText('Chức danh'),
  department: optionalText('Bộ phận'),
  email: optionalEmail,
  phone: optionalPhone,
  is_primary: z.boolean().default(false),
  notes: optionalText('Ghi chú', 500),
});
export type CustomerContactValues = z.infer<typeof customerContactSchema>;

// ─── 2. YÊU CẦU BÁO GIÁ (RFQ) ───────────────────────────────────────────────
export const INQUIRY_STATUSES = ['NEW', 'COSTING', 'QUOTED', 'WON', 'LOST', 'CANCELLED'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  NEW: 'Mới nhận',
  COSTING: 'Đang chiết tính',
  QUOTED: 'Đã báo giá',
  WON: 'Đã chốt đơn',
  LOST: 'Không trúng',
  CANCELLED: 'Đã huỷ',
};

export const inquiryFormSchema = z
  .object({
    inquiry_no: businessCode('Số yêu cầu'),
    customer_id: uuidField('khách hàng'),
    season_id: optionalUuid('Mùa vụ'),
    product_name: requiredText('Tên sản phẩm'),
    description: optionalText('Mô tả', 2000),
    expected_qty: positiveInt('Số lượng dự kiến').optional(),
    target_price: positiveDecimal('Giá mục tiêu', 4, 999_999).optional(),
    currency: z.enum(CURRENCIES).default('USD'),
    order_type: z.enum(ORDER_TYPES).default('FOB'),
    received_date: dateField('ngày nhận yêu cầu'),
    due_date: optionalDate('Hạn chót báo giá'),
    status: z.enum(INQUIRY_STATUSES).default('NEW'),
    notes: optionalText('Ghi chú', 2000),
  })
  .refine((v) => !v.due_date || v.due_date >= v.received_date, {
    message: 'Hạn chót báo giá không được trước ngày nhận yêu cầu',
    path: ['due_date'],
  });
export type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

// ─── 3. CHIẾT TÍNH GIÁ ──────────────────────────────────────────────────────
export const COSTING_STATUSES = [
  'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISE', 'SUPERSEDED',
] as const;
export type CostingStatus = (typeof COSTING_STATUSES)[number];
export const COSTING_STATUS_LABEL: Record<CostingStatus, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã trình duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  REVISE: 'Yêu cầu làm lại',
  SUPERSEDED: 'Đã có bản mới thay thế',
};

export const COST_CATEGORIES = [
  'FABRIC', 'TRIM', 'CM', 'PRINT_EMB', 'WASH', 'PACKING',
  'FREIGHT', 'OVERHEAD', 'COMMISSION', 'OTHER',
] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number];
export const COST_CATEGORY_LABEL: Record<CostCategory, string> = {
  FABRIC: 'Vải chính',
  TRIM: 'Phụ liệu',
  CM: 'Giá gia công (CM)',
  PRINT_EMB: 'In / Thêu',
  WASH: 'Giặt / Wash',
  PACKING: 'Đóng gói',
  FREIGHT: 'Vận chuyển',
  OVERHEAD: 'Chi phí quản lý',
  COMMISSION: 'Hoa hồng',
  OTHER: 'Chi phí khác',
};

export const costingFormSchema = z.object({
  costing_no: businessCode('Số chiết tính'),
  // Phiên bản do máy chủ tự tăng khi làm lại, form không cho sửa tay —
  // để người dùng tự gõ số phiên bản là mở đường cho trùng và nhảy cóc.
  inquiry_id: optionalUuid('Yêu cầu báo giá'),
  style_id: optionalUuid('Mã hàng'),
  customer_id: optionalUuid('Khách hàng'),
  order_type: z.enum(ORDER_TYPES).default('FOB'),
  currency: z.enum(CURRENCIES).default('USD'),
  quantity: positiveInt('Số lượng chiết tính').optional(),
  target_price: positiveDecimal('Giá mục tiêu', 4, 999_999).optional(),
  quoted_price: positiveDecimal('Giá báo', 4, 999_999).optional(),
  notes: optionalText('Ghi chú', 2000),
});
export type CostingFormValues = z.infer<typeof costingFormSchema>;

export const costingItemSchema = z.object({
  costing_id: uuidField('bản chiết tính'),
  category: z.enum(COST_CATEGORIES),
  item_name: requiredText('Tên khoản mục'),
  unit: optionalText('Đơn vị', 20),
  consumption: positiveDecimal('Định mức', 4, 999_999).optional(),
  unit_price: positiveDecimal('Đơn giá', 4, 999_999).optional(),
  notes: optionalText('Ghi chú', 500),
});
export type CostingItemValues = z.infer<typeof costingItemSchema>;

// ─── Kiểu dòng đọc về ───────────────────────────────────────────────────────

export interface CustomerRow {
  id: string;
  customer_code: string;
  name: string;
  brand: string | null;
  country: string | null;
  currency: string | null;
  incoterm: string | null;
  is_active: boolean;
  /** KPI lưu sẵn trong bảng, tính lại theo lô. null = chưa từng tính. */
  kpi_on_time_rate: number | null;
  kpi_quality_rate: number | null;
  kpi_lifetime_value: number | null;
  order_count: number;
}

export interface InquiryRow {
  id: string;
  inquiry_no: string;
  customer_name: string;
  product_name: string;
  expected_qty: number | null;
  target_price: number | null;
  currency: string | null;
  order_type: string | null;
  received_date: string | null;
  due_date: string | null;
  status: string;
}

export interface CostingRow {
  id: string;
  costing_no: string;
  version: number;
  customer_name: string | null;
  style_no: string | null;
  order_type: string | null;
  currency: string | null;
  quantity: number | null;
  target_price: number | null;
  quoted_price: number | null;
  margin_percent: number | null;
  status: string;
  /** Lý do bị từ chối / yêu cầu làm lại. `null` khi chưa từng bị trả lại.
   *  🔑 Thiếu trường này thì MD thấy bản "Bị từ chối" mà ⛔ không biết sửa gì —
   *  vòng trình duyệt sẽ chạy vô tận. */
  reject_reason: string | null;
  created_at: string;
}

export interface CostingItemRow {
  id: string;
  category: string;
  item_name: string;
  unit: string | null;
  consumption: number | null;
  unit_price: number | null;
  /** Cột SINH TỰ ĐỘNG trong SQL = định mức × đơn giá. Chỉ đọc. */
  amount: number;
}

// ─── Tính toán dùng chung ───────────────────────────────────────────────────

/** Tổng giá thành trên một sản phẩm, gom theo nhóm chi phí.
 *  Đặt ở đây thay vì trong component để bảng chiết tính và báo cáo lợi nhuận
 *  luôn ra cùng một con số. */
export function summarizeCosting(items: ReadonlyArray<CostingItemRow>): {
  byCategory: Array<{ category: string; amount: number }>;
  total: number;
} {
  const map = new Map<string, number>();
  for (const it of items) {
    map.set(it.category, (map.get(it.category) ?? 0) + Number(it.amount || 0));
  }
  const byCategory = [...map.entries()].map(([category, amount]) => ({
    category,
    amount: Number(amount.toFixed(4)),
  }));
  return {
    byCategory,
    total: Number(byCategory.reduce((s, c) => s + c.amount, 0).toFixed(4)),
  };
}

/** Biên lợi nhuận % = (giá báo − giá thành) / giá báo × 100.
 *  Trả null khi chưa đủ dữ liệu — KHÔNG trả 0, vì "chưa tính được" và
 *  "lãi 0%" là hai chuyện khác hẳn nhau. */
export function calcMargin(quotedPrice: number | null, totalCost: number): number | null {
  if (!quotedPrice || quotedPrice <= 0) return null;
  return Number((((quotedPrice - totalCost) / quotedPrice) * 100).toFixed(2));
}

export { percentField };
