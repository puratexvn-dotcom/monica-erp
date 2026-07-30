import { z } from 'zod';

import { uuidField, positiveInt, percentField, positiveDecimal, optionalDate } from './common';

// ============================================================================
// SINH TỰ ĐỘNG ĐỀ NGHỊ MUA NPL VÀ LỆNH SẢN XUẤT
//
// Hai việc này hiện đang được gõ tay, mà mọi con số cần thiết thì đã có sẵn:
// định mức nằm ở mã hàng, thời gian chuẩn nằm ở SAM. Gõ lại chỉ tạo thêm cơ
// hội sai — và sai định mức NPL thì hoặc thiếu vải giữa chuyền, hoặc ôm tồn
// kho chết vốn.
// ============================================================================

// ─── 1. ĐỀ NGHỊ MUA NPL SINH TỪ ĐỊNH MỨC ────────────────────────────────────

export const materialGenSchema = z.object({
  order_id: uuidField('đơn hàng'),
  /** Ngày cần NPL về kho. Bỏ trống thì lấy theo mốc T&A của đơn. */
  needed_date: optionalDate('Ngày cần hàng về'),
  /** Cộng thêm % dự phòng ngoài hao hụt đã tính trong định mức */
  buffer_percent: percentField('Dự phòng thêm').default(0),
});
export type MaterialGenValues = z.infer<typeof materialGenSchema>;

/** Một dòng nhu cầu NPL tính ra từ định mức mã hàng × số lượng đơn.
 *  Hàm thuần, không chạm cơ sở dữ liệu — nhờ vậy màn hình xem trước và hàm ghi
 *  xuống cơ sở dữ liệu dùng đúng một phép tính, không thể lệch nhau. */
export function computeMaterialNeeds(
  bom: ReadonlyArray<{
    item_name: string;
    category: string;
    unit: string;
    net_consumption: number;
    supplier: string | null;
  }>,
  orderQuantity: number,
  bufferPercent = 0,
): Array<{
  item_name: string;
  category: string;
  unit: string;
  net_consumption: number;
  quantity: number;
  supplier: string | null;
}> {
  const factor = orderQuantity * (1 + bufferPercent / 100);
  return bom.map((b) => ({
    item_name: b.item_name,
    category: b.category,
    unit: b.unit,
    net_consumption: Number(b.net_consumption),
    // Làm tròn LÊN 2 số lẻ: đặt thiếu vải thì phải chờ lô sau, còn thừa vài
    // phần trăm mét thì chỉ là tồn kho nhỏ.
    quantity: Math.ceil(Number(b.net_consumption) * factor * 100) / 100,
    supplier: b.supplier,
  }));
}

// ─── 2. LỆNH SẢN XUẤT SINH TỪ THỜI GIAN CHUẨN (SAM) ─────────────────────────

export const productionGenSchema = z.object({
  order_id: uuidField('đơn hàng'),
  workers: positiveInt('Số công nhân trên chuyền', 2000),
  hours_per_day: positiveDecimal('Số giờ làm mỗi ngày', 2, 24),
  efficiency_percent: percentField('Hiệu suất chuyền').default(75),
  /** Ngày phải xong. Bỏ trống thì lấy ngày xuất xưởng của đơn. */
  due_date: optionalDate('Ngày phải xong'),
});
export type ProductionGenValues = z.infer<typeof productionGenSchema>;

export interface ProductionPlan {
  /** Tổng phút chuẩn cần cho cả đơn = SAM × số lượng */
  totalStandardMinutes: number;
  /** Năng lực một ngày, đã trừ hiệu suất */
  dailyCapacityMinutes: number;
  /** Số ngày sản xuất, làm tròn lên */
  days: number;
  startDate: string;
  dueDate: string;
}

/**
 * Tính lịch sản xuất từ SAM.
 *
 * ⚠️ Đếm theo NGÀY LỊCH, không trừ chủ nhật hay ngày lễ: hệ thống chưa có bảng
 * lịch nghỉ của nhà máy, mà đoán bừa lịch nghỉ còn nguy hiểm hơn là nói rõ
 * cách đếm. Giao diện ghi thẳng điều này để người lập kế hoạch tự cộng thêm.
 */
export function computeProductionPlan(
  samMinutes: number,
  quantity: number,
  workers: number,
  hoursPerDay: number,
  efficiencyPercent: number,
  dueDate: string,
): ProductionPlan {
  const totalStandardMinutes = samMinutes * quantity;
  const dailyCapacityMinutes = workers * hoursPerDay * 60 * (efficiencyPercent / 100);
  const days = dailyCapacityMinutes > 0 ? Math.ceil(totalStandardMinutes / dailyCapacityMinutes) : 0;

  const start = new Date(`${dueDate}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - Math.max(0, days - 1));

  return {
    totalStandardMinutes: Number(totalStandardMinutes.toFixed(2)),
    dailyCapacityMinutes: Number(dailyCapacityMinutes.toFixed(2)),
    days,
    startDate: start.toISOString().slice(0, 10),
    dueDate,
  };
}
