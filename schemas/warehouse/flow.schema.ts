import { z } from 'zod';

import {
  uuidField, optionalUuid, optionalText, requiredText,
  dateField, optionalDate, qtyField, nonNegQty, UOMS,
} from './common';

// ============================================================================
// LUỒNG NHẬP · KIỂM QA · LUỒNG XUẤT
//
// Mỗi luồng là một chuỗi bước KHÔNG ĐƯỢC NHẢY CÓC. Trạng thái lưu ở DB, còn
// định nghĩa "bước nào tiếp theo bước nào" đặt ở đây để giao diện và Server
// Action dùng chung — hai nơi tự suy luận riêng là sớm muộn cũng lệch.
// ============================================================================

// ─── LUỒNG NHẬP (§11) ───────────────────────────────────────────────────────

export const INBOUND_STATUSES = [
  'ARRIVED', 'INSPECTING', 'PUT_AWAY', 'COMPLETED', 'REJECTED', 'CANCELLED',
] as const;
export type InboundStatus = (typeof INBOUND_STATUSES)[number];
export const INBOUND_STATUS_LABEL: Record<InboundStatus, string> = {
  ARRIVED: 'Hàng đã về',
  INSPECTING: 'Đang kiểm hàng',
  PUT_AWAY: 'Đang cất kho',
  COMPLETED: 'Hoàn tất',
  REJECTED: 'Từ chối nhận',
  CANCELLED: 'Đã huỷ',
};

/** Bốn bước hiện trên thanh tiến độ. REJECTED và CANCELLED là nhánh cụt, không
 *  nằm trên thanh — vẽ chúng vào sẽ khiến người dùng tưởng đó là bước phải qua. */
export const INBOUND_STEPS: ReadonlyArray<{ status: InboundStatus; label: string; hint: string }> = [
  { status: 'ARRIVED', label: 'Hàng về', hint: 'Đối chiếu chứng từ, đếm số kiện' },
  { status: 'INSPECTING', label: 'Kiểm QA', hint: 'Chấm điểm 4 point, đo co rút' },
  { status: 'PUT_AWAY', label: 'Cất kho', hint: 'Xếp vào ô kệ đã chỉ định' },
  { status: 'COMPLETED', label: 'Có sẵn', hint: 'Đã sẵn sàng cấp phát' },
];

/** Bước hiện tại đang ở chỉ số nào. Nhánh cụt trả -1 để giao diện biết mà vẽ
 *  thanh tiến độ ở trạng thái dừng thay vì tô xanh tới cuối. */
export function inboundStepIndex(status: string): number {
  return INBOUND_STEPS.findIndex((s) => s.status === status);
}

export const inboundReceiptSchema = z.object({
  receipt_no: requiredText('Số phiếu nhập', 1, 50),
  po_id: optionalUuid('Đơn mua'),
  supplier_id: optionalUuid('Nhà cung cấp'),
  warehouse_id: optionalUuid('Kho'),
  received_date: dateField('ngày nhận hàng'),
  invoice_no: optionalText('Số hoá đơn', 100),
  packing_list_no: optionalText('Số packing list', 100),
  notes: optionalText('Ghi chú', 2000),
});
export type InboundReceiptValues = z.infer<typeof inboundReceiptSchema>;

export const inboundItemSchema = z
  .object({
    receipt_id: uuidField('phiếu nhập'),
    material_id: uuidField('vật tư'),
    lot_id: optionalUuid('Lô'),
    bin_id: optionalUuid('Vị trí cất'),
    uom: z.enum(UOMS, { error: 'Chưa chọn đơn vị tính' }),
    declared_qty: qtyField('Số lượng theo chứng từ'),
    received_qty: nonNegQty('Số lượng đếm thực tế'),
    rejected_qty: nonNegQty('Số lượng loại bỏ'),
  })
  // Loại nhiều hơn số đếm được là vô lý về mặt vật lý
  .refine((v) => v.rejected_qty <= v.received_qty, {
    message: 'Số loại bỏ không thể lớn hơn số đếm thực tế',
    path: ['rejected_qty'],
  });
export type InboundItemValues = z.infer<typeof inboundItemSchema>;

export interface InboundRow {
  id: string;
  receipt_no: string;
  supplier_name: string | null;
  po_no: string | null;
  received_date: string;
  status: string;
  item_count: number;
  /** Số ngày đã nằm ở khâu hiện tại — dùng để đẩy lên cảnh báo khi ứ quá lâu */
  ageDays: number;
}

// ─── KIỂM QA 4 POINT (§15) ──────────────────────────────────────────────────

export const INSPECTION_RESULTS = ['PENDING', 'PASSED', 'FAILED', 'CONDITIONAL'] as const;
export type InspectionResult = (typeof INSPECTION_RESULTS)[number];
export const INSPECTION_RESULT_LABEL: Record<InspectionResult, string> = {
  PENDING: 'Chờ kết luận',
  PASSED: 'Đạt',
  FAILED: 'Không đạt',
  CONDITIONAL: 'Đạt có điều kiện',
};

export const SHADE_VARIATIONS = ['OK', 'SLIGHT', 'SEVERE'] as const;
export type ShadeVariation = (typeof SHADE_VARIATIONS)[number];
export const SHADE_VARIATION_LABEL: Record<ShadeVariation, string> = {
  OK: 'Đồng đều',
  SLIGHT: 'Loang nhẹ',
  SEVERE: 'Loang nặng',
};

/** Trọng số hệ 4 điểm theo chiều dài vết lỗi. Đây là chuẩn ngành, KHÔNG tự đặt:
 *  ≤3 inch = 1 điểm · 3–6 = 2 · 6–9 = 3 · trên 9 inch = 4 điểm. */
export const FOUR_POINT_WEIGHTS = { p1: 1, p2: 2, p3: 3, p4: 4 } as const;

export const FOUR_POINT_BANDS: ReadonlyArray<{ key: 'points_1' | 'points_2' | 'points_3' | 'points_4'; label: string; weight: number }> = [
  { key: 'points_1', label: 'Lỗi ≤ 3 inch', weight: 1 },
  { key: 'points_2', label: 'Lỗi 3 – 6 inch', weight: 2 },
  { key: 'points_3', label: 'Lỗi 6 – 9 inch', weight: 3 },
  { key: 'points_4', label: 'Lỗi > 9 inch', weight: 4 },
];

export const inspectionSchema = z.object({
  inspection_no: requiredText('Số phiếu kiểm', 1, 50),
  receipt_item_id: optionalUuid('Dòng phiếu nhập'),
  material_id: uuidField('vật tư'),
  lot_id: optionalUuid('Lô'),
  roll_id: optionalUuid('Cuộn'),
  inspected_qty: qtyField('Số lượng kiểm'),
  uom: z.enum(UOMS, { error: 'Chưa chọn đơn vị tính' }),

  points_1: z.coerce.number().int('Phải là số nguyên').min(0, 'Không được âm').default(0),
  points_2: z.coerce.number().int('Phải là số nguyên').min(0, 'Không được âm').default(0),
  points_3: z.coerce.number().int('Phải là số nguyên').min(0, 'Không được âm').default(0),
  points_4: z.coerce.number().int('Phải là số nguyên').min(0, 'Không được âm').default(0),

  inspected_area_sqyd: z.coerce.number().positive('Diện tích kiểm phải lớn hơn 0').optional(),
  acceptance_limit: z.coerce.number().positive('Ngưỡng chấp nhận phải lớn hơn 0').default(20),

  shade_variation: z.enum(SHADE_VARIATIONS).optional().or(z.literal('')),
  shrinkage_pct: z.coerce.number().min(0, 'Không được âm').max(100, 'Không quá 100%').optional(),
  color_fastness: z.coerce.number().int().min(1, 'Từ 1 đến 5').max(5, 'Từ 1 đến 5').optional(),
  yarn_defect_note: optionalText('Ghi chú lỗi sợi', 2000),

  result: z.enum(INSPECTION_RESULTS).default('PENDING'),
  reject_reason: optionalText('Lý do từ chối', 2000),
});
export type InspectionValues = z.infer<typeof inspectionSchema>;

/** Tổng điểm phạt. Dùng ĐÚNG trọng số mà cột sinh tự động trong SQL đang dùng,
 *  nên số xem trước trên form và số lưu xuống DB không thể lệch. */
export function totalPoints(p: { points_1: number; points_2: number; points_3: number; points_4: number }): number {
  return p.points_1 * 1 + p.points_2 * 2 + p.points_3 * 3 + p.points_4 * 4;
}

/**
 * Điểm quy về 100 yard vuông và kết luận đạt hay không.
 * Trả `null` khi chưa khai diện tích kiểm — không đoán, không lấy mặc định.
 * Một tấm vải 10 yard và một lô 1000 yard cùng 20 điểm là hai câu chuyện khác hẳn.
 */
export function pointsPer100SqYd(total: number, areaSqYd: number | null | undefined): number | null {
  if (!areaSqYd || areaSqYd <= 0) return null;
  return Number(((total * 100) / areaSqYd).toFixed(2));
}

export function withinLimit(score: number | null, limit: number): boolean | null {
  if (score === null) return null;
  return score <= limit;
}

// ─── LUỒNG XUẤT (§12) ───────────────────────────────────────────────────────

export const OUTBOUND_STATUSES = [
  'REQUESTED', 'ALLOCATED', 'PICKING', 'PICKED', 'ISSUED', 'CANCELLED',
] as const;
export type OutboundStatus = (typeof OUTBOUND_STATUSES)[number];
export const OUTBOUND_STATUS_LABEL: Record<OutboundStatus, string> = {
  REQUESTED: 'Chờ phân bổ',
  ALLOCATED: 'Đã phân bổ',
  PICKING: 'Đang soạn hàng',
  PICKED: 'Đã soạn xong',
  ISSUED: 'Đã xuất kho',
  CANCELLED: 'Đã huỷ',
};

export const OUTBOUND_STEPS: ReadonlyArray<{ status: OutboundStatus; label: string; hint: string }> = [
  { status: 'REQUESTED', label: 'Yêu cầu', hint: 'Lệnh sản xuất gửi xuống kho' },
  { status: 'ALLOCATED', label: 'Phân bổ', hint: 'Gán lô và cuộn cụ thể' },
  { status: 'PICKING', label: 'Soạn hàng', hint: 'Lấy hàng theo danh sách ô kệ' },
  { status: 'PICKED', label: 'Quét mã', hint: 'Đối chiếu mã vạch từng cuộn' },
  { status: 'ISSUED', label: 'Xuất kho', hint: 'Bàn giao cho tổ cắt / tổ may' },
];

export function outboundStepIndex(status: string): number {
  return OUTBOUND_STEPS.findIndex((s) => s.status === status);
}

export const ISSUE_TYPES = ['PRODUCTION', 'SAMPLE', 'REPLACEMENT', 'SUBCON', 'SCRAP', 'OTHER'] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];
export const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  PRODUCTION: 'Cấp cho sản xuất',
  SAMPLE: 'Cấp làm mẫu',
  REPLACEMENT: 'Cấp bù hàng lỗi',
  SUBCON: 'Chuyển xưởng gia công',
  SCRAP: 'Xuất huỷ / phế liệu',
  OTHER: 'Mục đích khác',
};

export const outboundIssueSchema = z.object({
  issue_no: requiredText('Số lệnh xuất', 1, 50),
  order_id: optionalUuid('Đơn hàng'),
  cut_ticket_id: optionalUuid('Phiếu cắt'),
  warehouse_id: optionalUuid('Kho'),
  issue_to_dept: optionalText('Bộ phận nhận', 20),
  issue_date: dateField('ngày xuất'),
  issue_type: z.enum(ISSUE_TYPES).default('PRODUCTION'),
  notes: optionalText('Ghi chú', 2000),
});
export type OutboundIssueValues = z.infer<typeof outboundIssueSchema>;

export interface OutboundRow {
  id: string;
  issue_no: string;
  po_number: string | null;
  issue_to_dept: string | null;
  issue_date: string;
  status: string;
  issue_type: string;
  item_count: number;
  /** Tổng số còn thiếu so với yêu cầu, cộng từ cột sinh tự động shortage_qty */
  shortage_qty: number;
  ageDays: number;
}

// ─── KIỂM KÊ ────────────────────────────────────────────────────────────────

export const COUNT_STATUSES = ['OPEN', 'COUNTING', 'REVIEW', 'POSTED', 'CANCELLED'] as const;
export type CountStatus = (typeof COUNT_STATUSES)[number];
export const COUNT_STATUS_LABEL: Record<CountStatus, string> = {
  OPEN: 'Mới mở',
  COUNTING: 'Đang đếm',
  REVIEW: 'Chờ đối chiếu',
  POSTED: 'Đã chốt sổ',
  CANCELLED: 'Đã huỷ',
};

export const COUNT_TYPES = ['CYCLE', 'FULL', 'SPOT'] as const;
export type CountType = (typeof COUNT_TYPES)[number];
export const COUNT_TYPE_LABEL: Record<CountType, string> = {
  CYCLE: 'Kiểm kê định kỳ',
  FULL: 'Kiểm kê toàn kho',
  SPOT: 'Kiểm tra đột xuất',
};

export const stockCountSchema = z.object({
  count_no: requiredText('Số phiếu kiểm kê', 1, 50),
  warehouse_id: optionalUuid('Kho'),
  zone_id: optionalUuid('Khu vực'),
  count_date: dateField('ngày kiểm kê'),
  count_type: z.enum(COUNT_TYPES).default('CYCLE'),
  notes: optionalText('Ghi chú', 2000),
});
export type StockCountValues = z.infer<typeof stockCountSchema>;

/**
 * Độ chính xác tồn kho (§21) = tỷ lệ dòng đếm KHỚP sổ sách.
 * Trả `null` khi chưa đếm dòng nào — 100% của không có gì là con số vô nghĩa,
 * mà lại là con số dễ đem đi khoe nhất.
 */
export function countAccuracy(
  items: ReadonlyArray<{ counted_qty: number | null; variance_qty: number }>,
): number | null {
  const counted = items.filter((i) => i.counted_qty !== null);
  if (counted.length === 0) return null;
  const exact = counted.filter((i) => Math.abs(i.variance_qty) < 0.001).length;
  return Number(((exact / counted.length) * 100).toFixed(2));
}

export { optionalDate };
