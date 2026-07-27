// ============================================================================
// MONICA GARMENT ERP — Thư viện công thức nghiệp vụ ngành may
// MỌI MODULE PHẢI GỌI CHUNG CÁC HÀM NÀY — không copy công thức rải rác.
// Không làm tròn trong phép tính trung gian; chỉ làm tròn khi hiển thị.
// ============================================================================

export const YARD_IN_METERS = 0.9144;

// ─── 1. QUY ĐỔI VẢI (Kg ↔ Mét ↔ Yard) ───────────────────────────────────────
/** Mét = (Kg × 1000) / (GSM × Khổ vải (m)) */
export function kgToMeters(kg: number, gsm: number, widthM: number): number {
  if (gsm <= 0 || widthM <= 0) return 0;
  return (kg * 1000) / (gsm * widthM);
}
/** Kg = (Mét × GSM × Khổ (m)) / 1000 */
export function metersToKg(m: number, gsm: number, widthM: number): number {
  return (m * gsm * widthM) / 1000;
}
export function metersToYards(m: number): number {
  return m / YARD_IN_METERS;
}
export function yardsToMeters(yd: number): number {
  return yd * YARD_IN_METERS;
}

// ─── 2. ĐỊNH MỨC BOM ─────────────────────────────────────────────────────────
/** Nhu cầu tổng = Mục tiêu PO × Định mức/SP × (1 + Hao hụt %) */
export function bomTotalNeed(targetQty: number, normPerPcs: number, wastagePercent: number): number {
  return targetQty * normPerPcs * (1 + wastagePercent / 100);
}

// ─── 3. HAO HỤT BÀN CẮT ─────────────────────────────────────────────────────
/** Hao hụt % = (Vải xả cây − Vải trên sơ đồ) / Vải xả cây × 100 */
export function cuttingWastePercent(totalIssuedM: number, onMarkerM: number): number {
  if (totalIssuedM <= 0) return 0;
  return ((totalIssuedM - onMarkerM) / totalIssuedM) * 100;
}
/** Số BTP dự kiến = Số bàn × Số lá × Tổng SP trên 1 sơ đồ */
export function expectedCutPieces(tableCount: number, plyCount: number, ratio: Record<string, number>): number {
  const perMarker = Object.values(ratio).reduce((s, v) => s + (Number(v) || 0), 0);
  return tableCount * plyCount * perMarker;
}

// ─── 4. AQL 2.5 — ISO 2859-1, Mức kiểm II, phương án đơn, kiểm thường ───────
// ⚠️ KHÔNG so sánh "tỷ lệ lỗi % > 2.5" — phải tra bảng chọn mẫu chuẩn dưới đây.
export interface AqlPlan {
  sampleSize: number;
  ac: number; // Acceptance number — số lỗi Major tối đa cho phép
  re: number; // Rejection number — chạm mức này là RỚT lô
}
export const AQL_25_TABLE: Array<{ min: number; max: number; n: number; ac: number; re: number }> = [
  { min: 91,    max: 150,    n: 20,  ac: 1,  re: 2 },
  { min: 151,   max: 280,    n: 32,  ac: 2,  re: 3 },
  { min: 281,   max: 500,    n: 50,  ac: 3,  re: 4 },
  { min: 501,   max: 1200,   n: 80,  ac: 5,  re: 6 },
  { min: 1201,  max: 3200,   n: 125, ac: 7,  re: 8 },
  { min: 3201,  max: 10000,  n: 200, ac: 10, re: 11 },
  { min: 10001, max: 35000,  n: 315, ac: 14, re: 15 },
];
/** Tra bảng AQL 2.5 theo cỡ lô. Lô < 91 SP → trả null (kiểm 100%). */
export function aqlLookup(lotSize: number): AqlPlan | null {
  if (lotSize < 91) return null;
  const row = AQL_25_TABLE.find((r) => lotSize >= r.min && lotSize <= r.max)
    ?? AQL_25_TABLE[AQL_25_TABLE.length - 1];
  return { sampleSize: row.n, ac: row.ac, re: row.re };
}
/** Kết luận lô: Critical ≥ 1 là RỚT ngay; Major so với Ac/Re. */
export function aqlJudge(criticalDefects: number, majorDefects: number, plan: AqlPlan): 'Pass' | 'Fail' {
  if (criticalDefects >= 1) return 'Fail';
  return majorDefects <= plan.ac ? 'Pass' : 'Fail';
}

// ─── 5. CHỈ SỐ CHẤT LƯỢNG HẰNG NGÀY ─────────────────────────────────────────
/** Tỷ lệ lỗi % = Lỗi / Tổng kiểm × 100 (ngưỡng cảnh báo mặc định 3%) */
export function defectRatePercent(defectQty: number, checkedQty: number): number {
  if (checkedQty <= 0) return 0;
  return (defectQty / checkedQty) * 100;
}
/** DHU = Tổng số lỗi / Số SP kiểm × 100 (1 SP có thể nhiều lỗi) */
export function dhu(totalDefects: number, checkedQty: number): number {
  if (checkedQty <= 0) return 0;
  return (totalDefects / checkedQty) * 100;
}
/** RFT % = SP đạt ngay lần đầu / Tổng kiểm × 100 */
export function rftPercent(passedFirstTime: number, checkedQty: number): number {
  if (checkedQty <= 0) return 0;
  return (passedFirstTime / checkedQty) * 100;
}

// ─── 6. NĂNG SUẤT CHUYỀN MAY ────────────────────────────────────────────────
/** Takt time (phút/SP) = Thời gian khả dụng (phút) / Mục tiêu ngày */
export function taktTimeMinutes(availableMinutes: number, targetQty: number): number {
  if (targetQty <= 0) return 0;
  return availableMinutes / targetQty;
}
/** Hiệu suất chuyền % = (Sản lượng × SAM) / (Số CN × Giờ làm × 60) × 100 */
export function lineEfficiencyPercent(outputQty: number, samMinutes: number, workerCount: number, workHours: number): number {
  const capacityMin = workerCount * workHours * 60;
  if (capacityMin <= 0) return 0;
  return ((outputQty * samMinutes) / capacityMin) * 100;
}

// ─── 7. QUYẾT TOÁN CÔNG NỢ SUBCON ───────────────────────────────────────────
// Giá trị nghiệm thu = SL đạt QA × Đơn giá CMT
// (−) Đền bù NPL hỏng vượt định mức / phạt trễ  (−) Đối trừ tạm ứng
export interface SettlementResult {
  gross: number;        // nghiệm thu
  afterPenalty: number; // sau phạt/đền bù
  net: number;          // còn phải thanh toán kỳ này
}
export function settleSubcon(qaPassedQty: number, unitPriceCmt: number, penalty = 0, advance = 0): SettlementResult {
  const gross = qaPassedQty * unitPriceCmt;
  const afterPenalty = gross - penalty;
  return { gross, afterPenalty, net: afterPenalty - advance };
}

// ─── 8. TỒN KHO AN TOÀN ─────────────────────────────────────────────────────
/** Cảnh báo khi Tồn hiện tại < Nhu cầu còn lại × Hệ số an toàn (mặc định 1.05) */
export function isBelowSafetyStock(currentQty: number, requiredQty: number, factor = 1.05): boolean {
  return currentQty < requiredQty * factor;
}

// ─── 9. TIẾN ĐỘ ─────────────────────────────────────────────────────────────
export function progressPercent(done: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min((done / target) * 100, 999);
}
/** PO trễ bao nhiêu ngày so với ngày xuất xưởng kế hoạch (dương = trễ) */
export function daysLate(xfactoryDate: string, now: Date = new Date()): number {
  const d = new Date(xfactoryDate);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((now.getTime() - d.getTime()) / 86400000);
}

// ─── 10. ĐỊNH DẠNG HIỂN THỊ (vi-VN) ─────────────────────────────────────────
export const fmtNum = (n: number): string =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0));
export const fmtNum1 = (n: number): string =>
  new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(Number(n) || 0);
export const fmtNum2 = (n: number): string =>
  new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(n) || 0);
export const fmtVND = (n: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0));
export const fmtPct = (n: number, digits = 1): string =>
  `${(Number(n) || 0).toFixed(digits).replace('.', ',')}%`;
export const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
export const fmtDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
};
