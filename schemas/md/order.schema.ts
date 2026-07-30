import { z } from 'zod';

import {
  businessCode,
  requiredText,
  optionalText,
  optionalUuid,
  uuidField,
  dateField,
  optionalDate,
  positiveInt,
  nonNegativeInt,
  positiveDecimal,
  storagePath,
  ORDER_TYPES,
  INCOTERMS,
  CURRENCIES,
  SHIP_MODES,
} from './common';

// ============================================================================
// ĐƠN HÀNG (PO) — TRÁI TIM VẬN HÀNH
//
// PO tham chiếu MÃ HÀNG qua style_id. Mọi thông tin kỹ thuật (định mức, SAM,
// bảng màu/size) lấy từ mã hàng, PO chỉ giữ những gì RIÊNG của lần đặt này:
// số lượng, giá, ngày giao, xưởng sản xuất, điều kiện giao hàng.
// ============================================================================

export const PO_STATUSES = [
  'DRAFT', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'SHIPPED', 'CANCELLED',
] as const;
export type PoStatus = (typeof PO_STATUSES)[number];
export const PO_STATUS_LABEL: Record<PoStatus, string> = {
  DRAFT: 'Nháp',
  APPROVED: 'Đã duyệt',
  IN_PRODUCTION: 'Đang sản xuất',
  COMPLETED: 'Hoàn thành',
  SHIPPED: 'Đã xuất hàng',
  CANCELLED: 'Đã huỷ',
};

/** Trạng thái coi như PO đã đóng — dùng để đếm "PO đang chạy".
 *  So sánh sau khi viết hoa: dữ liệu cũ lẫn 'Approved' và 'APPROVED'. */
export const CLOSED_PO_STATUSES: ReadonlySet<string> = new Set([
  'COMPLETED', 'SHIPPED', 'CANCELLED', 'CLOSED',
]);

export function isPoRunning(status: string | null | undefined): boolean {
  return !CLOSED_PO_STATUSES.has(String(status ?? '').toUpperCase());
}

// ─── Form tạo/sửa PO ────────────────────────────────────────────────────────
export const poFormSchema = z
  .object({
    po_number: businessCode('Mã PO'),
    style_id: uuidField('mã hàng'),
    customer_id: optionalUuid('Khách hàng'),
    season_id: optionalUuid('Mùa vụ'),
    costing_id: optionalUuid('Bản chiết tính'),

    total_quantity: positiveInt('Số lượng'),
    order_type: z.enum(ORDER_TYPES).default('FOB'),
    incoterm: z.enum(INCOTERMS).optional().or(z.literal('')),
    currency: z.enum(CURRENCIES).default('USD'),
    // 4 số lẻ: đơn giá gia công thường là 2,4750 USD/sp, làm tròn 2 số sẽ lệch
    // hàng nghìn đô trên một đơn lớn.
    unit_price: positiveDecimal('Đơn giá', 4, 999_999).optional(),

    order_date: dateField('ngày đặt hàng'),
    delivery_date: dateField('ngày giao hàng'),
    // Ngày xuất xưởng: mốc nội bộ, luôn phải trước ngày giao cho khách vì còn
    // thời gian vận chuyển ra cảng và làm thủ tục.
    ex_factory_date: optionalDate('Ngày xuất xưởng'),

    factory_name: optionalText('Xưởng sản xuất'),
    subcontractor_id: optionalUuid('Xưởng gia công ngoài'),
    ship_mode: z.enum(SHIP_MODES).optional().or(z.literal('')),

    status: z.enum(PO_STATUSES).default('DRAFT'),
    notes: optionalText('Ghi chú', 2000),
    evidence_path: storagePath,
  })
  // Kiểm ở tầng lược đồ thay vì chỉ dựa vào CHECK của DB: lỗi từ DB trả về
  // dạng tên ràng buộc, người dùng đọc không hiểu gì.
  .refine((v) => v.delivery_date >= v.order_date, {
    message: 'Ngày giao hàng không được trước ngày đặt hàng',
    path: ['delivery_date'],
  })
  .refine((v) => !v.ex_factory_date || v.ex_factory_date <= v.delivery_date, {
    message: 'Ngày xuất xưởng phải trước hoặc bằng ngày giao hàng',
    path: ['ex_factory_date'],
  });
export type PoFormValues = z.infer<typeof poFormSchema>;

// ─── Số lượng theo MÀU × SIZE ───────────────────────────────────────────────
// Bắt buộc ở nhà máy may: cắt, đóng thùng và kiểm AQL đều làm theo từng cặp
// màu-size. Tổng số lượng PO không đủ để chạy sản xuất.
export const sizeBreakdownRowSchema = z.object({
  color_code: requiredText('Mã màu', 1, 50),
  size_code: requiredText('Mã size', 1, 20),
  // Cho phép 0: có cặp màu-size khách không đặt nhưng vẫn hiện trong bảng
  quantity: nonNegativeInt('Số lượng'),
});

export const sizeBreakdownSchema = z
  .object({
    order_id: uuidField('đơn hàng'),
    rows: z.array(sizeBreakdownRowSchema).min(1, 'Cần ít nhất một dòng số lượng'),
    /** Tổng số lượng khai ở PO — dùng để đối chiếu, không lưu lại */
    expected_total: nonNegativeInt('Tổng số lượng PO').optional(),
  })
  .refine(
    (v) => {
      const keys = v.rows.map((r) => `${r.color_code.toUpperCase()}|${r.size_code.toUpperCase()}`);
      return new Set(keys).size === keys.length;
    },
    { message: 'Có cặp màu-size bị trùng', path: ['rows'] },
  )
  // Tổng phải khớp PO. Lệch nghĩa là cắt thiếu hoặc thừa — sai sót này chỉ lộ
  // ra ở khâu đóng thùng, khi đã quá muộn để sửa.
  .refine(
    (v) =>
      v.expected_total === undefined ||
      v.rows.reduce((s, r) => s + r.quantity, 0) === v.expected_total,
    { message: 'Tổng số lượng theo màu-size không khớp số lượng PO', path: ['rows'] },
  );
export type SizeBreakdownValues = z.infer<typeof sizeBreakdownSchema>;

export function sumBreakdown(rows: ReadonlyArray<{ quantity: number }>): number {
  return rows.reduce((s, r) => s + (r.quantity || 0), 0);
}

// ─── Kiểu dòng đọc về ───────────────────────────────────────────────────────

export interface PoRow {
  id: string;
  po_number: string;
  style_no: string | null;
  style_name: string | null;
  customer_name: string;
  total_quantity: number;
  order_type: string | null;
  currency: string | null;
  unit_price: number | null;
  order_date: string | null;
  delivery_date: string;
  ex_factory_date: string | null;
  factory_name: string | null;
  status: string;
  /** Điểm rủi ro tổng hợp, lấy từ view v_order_risk. null = chưa chấm điểm. */
  risk_score: number | null;
  risk_level: string | null;
  /** Số mốc T&A đã trễ — hiện thành cảnh báo trên bảng danh sách */
  late_milestones: number;
}

export interface SizeBreakdownRow {
  id: string;
  color_code: string;
  size_code: string;
  quantity: number;
}

/** Dựng ma trận màu × size để hiển thị dạng bảng chéo.
 *  Trả về thứ tự màu và size THEO DỮ LIỆU đưa vào, không tự sắp lại —
 *  thứ tự size đúng phải lấy từ style_sizes.sort_order. */
export function buildSizeMatrix(rows: ReadonlyArray<SizeBreakdownRow>): {
  colors: string[];
  sizes: string[];
  cell: (color: string, size: string) => number;
  rowTotal: (color: string) => number;
  colTotal: (size: string) => number;
  grandTotal: number;
} {
  const colors: string[] = [];
  const sizes: string[] = [];
  const map = new Map<string, number>();

  for (const r of rows) {
    if (!colors.includes(r.color_code)) colors.push(r.color_code);
    if (!sizes.includes(r.size_code)) sizes.push(r.size_code);
    map.set(`${r.color_code}|${r.size_code}`, r.quantity);
  }

  const cell = (c: string, s: string) => map.get(`${c}|${s}`) ?? 0;

  return {
    colors,
    sizes,
    cell,
    rowTotal: (c) => sizes.reduce((s, sz) => s + cell(c, sz), 0),
    colTotal: (sz) => colors.reduce((s, c) => s + cell(c, sz), 0),
    grandTotal: rows.reduce((s, r) => s + r.quantity, 0),
  };
}
