import { daysBetween, vnTodayISO } from './po-flow';

// ============================================================================
// LOGIC XUẤT HÀNG — Điều XVIII (tầng Domain thuần)
//
// Không gọi Supabase, không dựng JSX. Chạy thử được bằng một tệp Node.
//
// ─── ĐIỀU XXVIII.1 · KHÔNG LƯU DỮ LIỆU TÍNH TOÁN ─────────────────────────
// Không cột nào trong CSDL lưu `delay_days`, `completion_percent` hay
// `eta_difference`. View chỉ trả SỐ THÔ; mọi tỉ lệ và độ trễ tính ở đây.
//
// ⚠️ Dùng lại `daysBetween` của po-flow.ts. Viết lại phép trừ ngày ở đây là
// tạo nguồn sự thật thứ hai — và múi giờ Việt Nam đã cắn một lần rồi.
// ============================================================================

// ── TRẠNG THÁI ──────────────────────────────────────────────────────────────
//
// ⚠️ Danh sách này phải KHỚP TỪNG CHỮ với ràng buộc `shipments_status_valid`
// trong migration 024. Lệch một giá trị thì giao diện cho chọn một trạng thái
// mà cơ sở dữ liệu từ chối ghi. Có bài kiểm đối chiếu hai bên.
//
// Thứ tự mảng LÀ thứ tự dòng chảy nghiệp vụ, dùng luôn để vẽ thanh tiến trình.
export const SHIPMENT_FLOW = [
  'DRAFT', 'BOOKED', 'LOADING', 'DEPARTED',
  'IN_TRANSIT', 'ARRIVED_PORT', 'CUSTOM_CLEARANCE', 'DELIVERED',
] as const;

export type ShipmentStage = (typeof SHIPMENT_FLOW)[number];
export type ShipmentStatus = ShipmentStage | 'CANCELLED';

export const SHIPMENT_STATUSES: readonly ShipmentStatus[] = [...SHIPMENT_FLOW, 'CANCELLED'];

export function isShipmentStatus(v: string | null | undefined): v is ShipmentStatus {
  return typeof v === 'string' && (SHIPMENT_STATUSES as readonly string[]).includes(v);
}

/**
 * Vị trí trong dòng chảy, 0-based. `CANCELLED` trả null — lô đã huỷ KHÔNG đứng
 * ở bước nào cả, và vẽ nó lên thanh tiến trình sẽ làm sai mọi phép đếm.
 */
export function stageIndexOf(status: string | null | undefined): number | null {
  if (!isShipmentStatus(status) || status === 'CANCELLED') return null;
  return SHIPMENT_FLOW.indexOf(status);
}

// ── INCOTERMS 2020 ──────────────────────────────────────────────────────────
//
// Đủ 11 điều kiện chính thức của ICC. KHÔNG dựng bảng danh mục cho 11 giá trị
// cố định từ 2020 (Điều XXIX) — nhưng cũng KHÔNG viết cứng rải rác: mọi nơi
// cần đến đều nhập khẩu từ đây, đúng tinh thần "chuẩn bị khả năng tái sử dụng"
// của chỉ thị Mục V.
export const INCOTERMS = [
  // Dùng cho mọi phương thức vận tải
  'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP',
  // Chỉ dùng cho đường biển và đường thuỷ nội địa
  'FAS', 'FOB', 'CFR', 'CIF',
] as const;

export type Incoterm = (typeof INCOTERMS)[number];

export function isIncoterm(v: string | null | undefined): v is Incoterm {
  return typeof v === 'string' && (INCOTERMS as readonly string[]).includes(v);
}

// ── ĐỘ TRỄ ──────────────────────────────────────────────────────────────────

export interface Delays {
  /** Thực tế rời cảng trễ so với kế hoạch, ngày. Âm = chạy sớm. */
  departure: number | null;
  /** Thực tế đến cảng trễ so với dự kiến, ngày. */
  arrival: number | null;
  /** Số ngày hành trình thực tế (ATD → ATA) */
  transit: number | null;
  /** Số ngày hành trình theo kế hoạch (ETD → ETA) */
  transitPlanned: number | null;
}

/**
 * ⚠️ HAI LOẠI TRỄ, TUYỆT ĐỐI KHÔNG GỘP LÀM MỘT SỐ.
 *
 *   `atd − etd` = trễ KHỞI HÀNH → lỗi khâu booking / đóng hàng của nhà máy.
 *   `ata − eta` = trễ HÀNH TRÌNH → lỗi hãng tàu hoặc forwarder.
 *
 * Gộp thành một chữ "trễ" là xoá đúng thông tin mà chỉ số này sinh ra để trả
 * lời: AI gây ra. Một lô rời cảng đúng hạn rồi kẹt ba tuần ngoài biển và một lô
 * đóng hàng chậm ba tuần là hai câu chuyện khác hẳn nhau, với hai người chịu
 * trách nhiệm khác nhau.
 *
 * Thiếu mốc thì trả null, KHÔNG trả 0 — Điều XX. "Chưa có ATD" khác hẳn "rời
 * cảng đúng hạn".
 */
export function delaysOf(s: {
  etdDate: string | null;
  atdDate: string | null;
  etaDate: string | null;
  ataDate: string | null;
}): Delays {
  return {
    departure: daysBetween(s.etdDate, s.atdDate),
    arrival: daysBetween(s.etaDate, s.ataDate),
    transit: daysBetween(s.atdDate, s.ataDate),
    transitPlanned: daysBetween(s.etdDate, s.etaDate),
  };
}

export const DELAY_LEVELS = ['LATE', 'ON_TIME', 'EARLY', 'UNKNOWN'] as const;
export type DelayLevel = (typeof DELAY_LEVELS)[number];

/** Trễ từ ngần này ngày trở lên mới coi là trễ đáng báo động */
export const DELAY_ALERT_DAYS = 1;

export function delayLevelOf(days: number | null): DelayLevel {
  if (days === null) return 'UNKNOWN';
  if (days >= DELAY_ALERT_DAYS) return 'LATE';
  if (days < 0) return 'EARLY';
  return 'ON_TIME';
}

// ── CẢNH BÁO BẤT THƯỜNG ─────────────────────────────────────────────────────

export const SHIPMENT_FLAGS = [
  'ATD_BEFORE_ETD_FAR', 'ATA_BEFORE_ATD', 'DEPARTED_NO_ATD',
  'DELIVERED_NO_ATA', 'IN_TRANSIT_NO_ETA', 'NO_ETD', 'NO_DOCS',
] as const;
export type ShipmentFlag = (typeof SHIPMENT_FLAGS)[number];

/**
 * Bất thường của một lô hàng.
 *
 * ─── VÌ SAO Ở ĐÂY CHỨ KHÔNG PHẢI RÀNG BUỘC CHECK TRONG CSDL ──────────────
 * Migration 024 CỐ Ý không ràng buộc thứ tự ngày. Tàu chạy sớm hơn kế hoạch là
 * bình thường, và thứ tự nhập liệu không theo thứ tự thời gian — ATA thường
 * biết trước khi ai đó quay lại điền ATD. Một CHECK sẽ TỪ CHỐI dữ liệu hợp lệ
 * đúng lúc người ta cần ghi nhất.
 *
 * Vậy nên bất thường được BÁO, không bị CHẶN. Người dùng nhìn thấy và tự quyết.
 */
export function flagsOf(s: {
  status: string | null;
  etdDate: string | null;
  atdDate: string | null;
  etaDate: string | null;
  ataDate: string | null;
  blNo: string | null;
  coNo: string | null;
}): ShipmentFlag[] {
  const out: ShipmentFlag[] = [];
  const st = isShipmentStatus(s.status) ? s.status : null;
  if (st === 'CANCELLED') return out;      // lô đã huỷ thì không cảnh báo gì

  const idx = stageIndexOf(st);
  const departed = idx !== null && idx >= SHIPMENT_FLOW.indexOf('DEPARTED');

  if (!s.etdDate) out.push('NO_ETD');

  // Rời cảng sớm hơn kế hoạch quá một tuần thường là gõ nhầm năm hoặc tháng,
  // không phải tàu chạy sớm thật.
  const dep = daysBetween(s.etdDate, s.atdDate);
  if (dep !== null && dep < -7) out.push('ATD_BEFORE_ETD_FAR');

  const tr = daysBetween(s.atdDate, s.ataDate);
  if (tr !== null && tr < 0) out.push('ATA_BEFORE_ATD');

  if (departed && !s.atdDate) out.push('DEPARTED_NO_ATD');
  if (st === 'DELIVERED' && !s.ataDate) out.push('DELIVERED_NO_ATA');
  if (st === 'IN_TRANSIT' && !s.etaDate) out.push('IN_TRANSIT_NO_ETA');

  // Đã rời cảng mà chưa có vận đơn hoặc C/O là rủi ro thanh toán thật: thiếu
  // chứng từ thì ngân hàng không giải ngân L/C.
  if (departed && (!s.blNo || !s.coNo)) out.push('NO_DOCS');

  return out;
}

// ── TỔNG HỢP THEO ĐƠN ───────────────────────────────────────────────────────

export interface ShipSummary {
  orderedQty: number | null;
  packedQty: number;
  shippedQty: number;
  packedCartons: number;
  shippedCartons: number;
  /** Đã đóng gói nhưng CHƯA xếp lên lô nào. Đây là việc phải làm hôm nay. */
  awaitingQty: number;
  awaitingCartons: number;
  /** % đã đóng gói trên số đặt. null khi chưa biết số đặt. KHÔNG kẹp ở 100. */
  packedPct: number | null;
  /** % đã xuất trên số đặt. null khi chưa biết số đặt. KHÔNG kẹp ở 100. */
  shippedPct: number | null;
  /** true khi đóng gói vượt số đặt — chuyện thường, nhưng phải nói ra */
  overPacked: boolean;
}

/**
 * ⚠️ KHÔNG KẸP TỈ LỆ Ở 100%.
 *
 * Xuất dư 2–5% là chuyện bình thường trong may mặc (bù hao hụt, hàng dự phòng).
 * Kẹp lại sẽ giấu mất trường hợp đóng gói vượt THẬT — mà đó lại chính là lúc
 * cần biết, vì hàng dư phải có người duyệt và có chỗ trong hoá đơn.
 */
export function summariseShipping(v: {
  orderedQty: number | null;
  packedQty: number;
  shippedQty: number;
  packedCartons: number;
  shippedCartons: number;
}): ShipSummary {
  const pct = (part: number): number | null =>
    v.orderedQty !== null && v.orderedQty > 0
      ? Math.round((part / v.orderedQty) * 1000) / 10
      : null;

  return {
    ...v,
    // Không dùng Math.max(0, ...): số âm ở đây nghĩa là dữ liệu mâu thuẫn
    // (xuất nhiều hơn đóng gói), và che nó đi thì không ai phát hiện.
    awaitingQty: v.packedQty - v.shippedQty,
    awaitingCartons: v.packedCartons - v.shippedCartons,
    packedPct: pct(v.packedQty),
    shippedPct: pct(v.shippedQty),
    overPacked: v.orderedQty !== null && v.orderedQty > 0 && v.packedQty > v.orderedQty,
  };
}

/**
 * Còn bao nhiêu ngày tới ngày tàu chạy gần nhất.
 * null khi chưa có lô nào hoặc chưa lô nào có ETD.
 */
export function daysToFirstEtd(firstEtd: string | null, today: string = vnTodayISO()): number | null {
  return daysBetween(today, firstEtd);
}
