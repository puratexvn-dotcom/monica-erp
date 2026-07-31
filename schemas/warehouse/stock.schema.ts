import { z } from 'zod';

import {
  uuidField, optionalUuid, optionalText, optionalDate,
  qtyField, nonNegQty, requiredText, UOMS,
} from './common';

// ============================================================================
// TỒN KHO · GIỮ CHỖ · ĐIỀU CHỈNH
//
// ─── BA CON SỐ, KHÔNG PHẢI MỘT ─────────────────────────────────────────────
// Tồn thực tế (on_hand) là số hàng ĐANG NẰM trong kho.
// Giữ chỗ (reserved) là phần đã có chủ nhưng CHƯA đi khỏi kho.
// Có sẵn (available) là phần thật sự lấy được ngay.
// Gộp ba thứ này thành một con số là nguồn gốc của cảnh "sổ sách còn hàng mà
// xuống kho không có gì để lấy".
// ============================================================================

export const PO_LINE_UOMS = UOMS;

// ─── Kiểu dòng đọc về ───────────────────────────────────────────────────────

export interface StockRow {
  id: string;
  material_id: string;
  material_code: string;
  material_name: string;
  category: string;
  sub_category: string | null;
  color_code: string | null;
  size_code: string | null;
  uom: string;

  lot_no: string | null;
  supplier_name: string | null;
  /** Đường dẫn vị trí dạng "WH-MAIN · A · R01 · B01". null = chưa xếp chỗ. */
  bin_path: string | null;
  zone_type: string | null;

  on_hand_qty: number;
  reserved_qty: number;
  in_inspection_qty: number;
  blocked_qty: number;
  /** Cột SINH TỰ ĐỘNG trong SQL. Chỉ đọc, tuyệt đối không tính lại ở giao diện. */
  available_qty: number;

  /** Đơn giá để định giá tồn. null = CHƯA KHAI, khác hẳn 0. */
  unit_price: number | null;
  currency: string | null;
  /** Giá trị tồn = tồn thực tế × đơn giá. null khi chưa có đơn giá. */
  stock_value: number | null;

  qa_status: string | null;
  min_stock_qty: number | null;
  last_counted_at: string | null;
}

export interface RollRow {
  id: string;
  roll_code: string;
  material_id: string;
  material_code: string | null;
  material_name: string | null;
  lot_no: string | null;
  shade_lot: string | null;
  initial_length_m: number;
  current_length_m: number;
  width_m: number | null;
  gsm: number | null;
  weight_kg: number | null;
  four_point_score: number | null;
  qa_status: string;
  relaxation_status: string;
  bin_path: string | null;
  barcode: string | null;
  status: string;
}

// ─── Giữ chỗ ────────────────────────────────────────────────────────────────

export const reservationSchema = z
  .object({
    material_id: uuidField('vật tư'),
    lot_id: optionalUuid('Lô'),
    order_id: uuidField('đơn hàng'),
    cut_ticket_id: optionalUuid('Phiếu cắt'),
    reserved_qty: qtyField('Số lượng giữ chỗ'),
    uom: z.enum(UOMS, { error: 'Chưa chọn đơn vị tính' }),
    needed_date: optionalDate('Ngày cần hàng'),
    /** Phần có sẵn tại thời điểm mở form — chỉ để đối chiếu, KHÔNG lưu xuống DB */
    available_hint: nonNegQty('Số có sẵn').optional(),
  })
  // Giữ chỗ vượt quá phần có sẵn là hứa suông với chuyền may. Chặn ngay ở form
  // thay vì để người dùng bấm Lưu rồi nhận về một lỗi ràng buộc khó hiểu.
  .refine((v) => v.available_hint === undefined || v.reserved_qty <= v.available_hint, {
    message: 'Số giữ chỗ vượt quá số đang có sẵn trong kho',
    path: ['reserved_qty'],
  });
export type ReservationValues = z.infer<typeof reservationSchema>;

export const RESERVATION_STATUSES = ['ACTIVE', 'ALLOCATED', 'CONSUMED', 'RELEASED', 'EXPIRED'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  ACTIVE: 'Đang giữ chỗ',
  ALLOCATED: 'Đã phân bổ',
  CONSUMED: 'Đã xuất dùng',
  RELEASED: 'Đã trả lại',
  EXPIRED: 'Hết hiệu lực',
};

// ─── Điều chỉnh tồn ─────────────────────────────────────────────────────────

export const ADJUST_REASONS = [
  'COUNT_VARIANCE', 'DAMAGE', 'LOSS', 'FOUND', 'EXPIRY', 'RECLASSIFY', 'OTHER',
] as const;
export type AdjustReason = (typeof ADJUST_REASONS)[number];
export const ADJUST_REASON_LABEL: Record<AdjustReason, string> = {
  COUNT_VARIANCE: 'Chênh lệch kiểm kê',
  DAMAGE: 'Hư hỏng',
  LOSS: 'Mất mát',
  FOUND: 'Tìm thấy lại',
  EXPIRY: 'Hết hạn sử dụng',
  RECLASSIFY: 'Phân loại lại',
  OTHER: 'Lý do khác',
};

export const adjustmentSchema = z.object({
  material_id: uuidField('vật tư'),
  lot_id: optionalUuid('Lô'),
  bin_id: optionalUuid('Vị trí'),
  uom: z.enum(UOMS, { error: 'Chưa chọn đơn vị tính' }),
  // Dương là tăng, âm là giảm. KHÔNG cho 0: một phiếu không đổi gì chỉ làm
  // nhiễu vệt kiểm toán.
  adjust_qty: z.coerce
    .number({ error: 'Số điều chỉnh phải là số' })
    .refine((v) => v !== 0, 'Số điều chỉnh phải khác 0')
    .refine((v) => Math.abs(v) <= 9_999_999, 'Số điều chỉnh vượt quá giới hạn'),
  reason_code: z.enum(ADJUST_REASONS, { error: 'Chưa chọn lý do' }),
  // BẮT BUỘC nêu lý do bằng lời: điều chỉnh tồn là thao tác dễ bị lạm dụng nhất
  // trong kho, không có giải thích thì kiểm toán không kết luận được gì.
  reason_note: requiredText('Diễn giải lý do', 5, 2000),
});
export type AdjustmentValues = z.infer<typeof adjustmentSchema>;

// ─── Biến động kho ──────────────────────────────────────────────────────────

export const MOVEMENT_TYPES = [
  'RECEIPT', 'INSPECTION_HOLD', 'INSPECTION_RELEASE', 'PUT_AWAY',
  'RESERVE', 'UNRESERVE', 'ALLOCATE', 'PICK', 'ISSUE',
  'RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUST', 'SCRAP', 'COUNT',
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];
export const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  RECEIPT: 'Nhận hàng',
  INSPECTION_HOLD: 'Giữ chờ kiểm',
  INSPECTION_RELEASE: 'Giải phóng sau kiểm',
  PUT_AWAY: 'Cất vào vị trí',
  RESERVE: 'Giữ chỗ',
  UNRESERVE: 'Bỏ giữ chỗ',
  ALLOCATE: 'Phân bổ',
  PICK: 'Soạn hàng',
  ISSUE: 'Xuất kho',
  RETURN: 'Nhập lại',
  TRANSFER_OUT: 'Chuyển đi',
  TRANSFER_IN: 'Chuyển đến',
  ADJUST: 'Điều chỉnh',
  SCRAP: 'Huỷ / phế liệu',
  COUNT: 'Kiểm kê',
};

export interface MovementRow {
  id: number;
  movement_type: string;
  material_code: string | null;
  material_name: string | null;
  lot_no: string | null;
  roll_code: string | null;
  from_path: string | null;
  to_path: string | null;
  /** Dương là vào kho, âm là ra khỏi kho */
  qty: number;
  uom: string;
  note: string | null;
  actor_name: string | null;
  actor_role: string | null;
  created_at: string;
}

// ─── Tính toán dùng chung ───────────────────────────────────────────────────

/**
 * Giá trị tồn kho. Trả `null` khi CHƯA CÓ đơn giá — không trả 0.
 * Trong kế toán vật tư, "chưa định giá" và "trị giá bằng không" là hai kết luận
 * hoàn toàn khác nhau, và cái sau thì gần như không bao giờ đúng.
 */
export function stockValue(qty: number, unitPrice: number | null | undefined): number | null {
  if (unitPrice === null || unitPrice === undefined) return null;
  return Number((qty * unitPrice).toFixed(2));
}

/** Dưới mức tồn tối thiểu thì phải cảnh báo. Chưa khai mức tối thiểu thì KHÔNG
 *  cảnh báo — cảnh báo dựa trên một ngưỡng chưa ai đặt ra là cảnh báo giả. */
export function isBelowMin(available: number, minQty: number | null | undefined): boolean {
  if (minQty === null || minQty === undefined || minQty <= 0) return false;
  return available < minQty;
}

/** Tổng giá trị của một danh sách tồn kho, BỎ QUA dòng chưa có đơn giá.
 *  Trả kèm số dòng bị bỏ qua để giao diện nói rõ con số này còn thiếu bao nhiêu. */
export function summarizeStockValue(
  rows: ReadonlyArray<{ stock_value: number | null }>,
): { total: number | null; pricedCount: number; unpricedCount: number } {
  const priced = rows.filter((r) => r.stock_value !== null);
  return {
    total: priced.length === 0 ? null : Number(priced.reduce((s, r) => s + (r.stock_value ?? 0), 0).toFixed(2)),
    pricedCount: priced.length,
    unpricedCount: rows.length - priced.length,
  };
}

export { optionalText };
