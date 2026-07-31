// ============================================================================
// SỨC KHOẺ ĐƠN HÀNG — LOGIC THUẦN
//
// Không phụ thuộc React, không đọc cơ sở dữ liệu, không có ngày giờ ẩn.
//
// ─── VÌ SAO KHÔNG TỰ ĐẶT TRỌNG SỐ MỚI ────────────────────────────────────
// RISK_WEIGHTS, previewRiskScore và riskLevelOf ĐÃ CÓ trong schemas/md và đang
// được PO 360° cũ dùng; ngưỡng của chúng trùng khít view v_order_risk ở
// migration 015. Đặt bộ trọng số thứ hai ở đây nghĩa là hai màn hình chấm cùng
// một đơn ra hai điểm khác nhau. Dùng lại, không viết mới (luật #8).
//
// ─── ĐIỂM ĐÃ CHẤM vs ĐIỂM TÍNH TẠI CHỖ ───────────────────────────────────
// Bảng risk_assessments là nguồn CHÍNH THỨC. Nhưng nó hiện chưa có dòng nào,
// và một trung tâm điều hành hiện "—" ở ô quan trọng nhất thì vô dụng.
//
// Vì vậy: có bản ghi thì DÙNG BẢN GHI; chưa có thì TÍNH TẠI CHỖ từ dữ liệu
// thật (tồn NPL, tiến độ, lỗi chất lượng) và ĐÁNH DẤU RÕ nguồn gốc. Người dùng
// luôn biết mình đang nhìn điểm đã chốt hay điểm ước lượng.
//
// ⚠️ ĐÂY KHÔNG PHẢI SỐ GIẢ. Mọi thành phần đều suy từ dữ liệu có thật; thành
// phần nào thiếu dữ liệu thì trả null và bị LOẠI khỏi phép tính, chứ không
// thay bằng 0 hay một con số đoán.
// ============================================================================

import { RISK_WEIGHTS, riskLevelOf } from '@/schemas/md';

/** Thang điểm rủi ro: 0 = không rủi ro, 100 = nguy kịch. */
const MAX = 100;

export type HealthSource = 'ASSESSED' | 'DERIVED' | 'NONE';

export interface HealthInput {
  /** Số dòng NPL thiếu / tổng số dòng. null = chưa có định mức */
  bomLines: number | null;
  missingLines: number | null;
  /** Phần trăm đã may. null = chưa ai nhập sản lượng */
  sewnPct: number | null;
  /** Số ngày còn lại tới ngày giao. Âm = quá hạn. null = chưa có ngày giao */
  daysLeft: number | null;
  /** Tổng số ngày của đơn (từ ngày đặt tới ngày giao). null = thiếu một đầu */
  totalDays: number | null;
  /** Lỗi trên trăm sản phẩm. null = chưa kiểm cái nào */
  dhu: number | null;
}

export interface HealthPart {
  key: 'material' | 'schedule' | 'quality' | 'capacity';
  /** 0–100. null = KHÔNG ĐỦ DỮ LIỆU, bị loại khỏi phép tính */
  score: number | null;
  weight: number;
  /** Câu giải thích con số này từ đâu ra — để người dùng kiểm chứng được */
  because: string | null;
}

export interface Health {
  parts: HealthPart[];
  /** Tổng điểm sau khi chuẩn hoá trọng số theo các thành phần CÓ dữ liệu */
  total: number | null;
  level: string | null;
  source: HealthSource;
  /** Bao nhiêu trong bốn thành phần thực sự có dữ liệu */
  basis: number;
}

const clamp = (v: number) => Math.max(0, Math.min(MAX, v));

/**
 * Rủi ro nguyên phụ liệu = tỷ lệ dòng định mức chưa sẵn sàng.
 * Thiếu một nửa số NPL thì rủi ro 50 — quan hệ tuyến tính, dễ giải thích cho
 * người vận hành hơn bất kỳ đường cong nào.
 */
function materialScore(i: HealthInput): HealthPart {
  if (i.bomLines === null || i.bomLines === 0 || i.missingLines === null) {
    return { key: 'material', score: null, weight: RISK_WEIGHTS.material, because: null };
  }
  const pct = (i.missingLines / i.bomLines) * MAX;
  return {
    key: 'material',
    score: clamp(pct),
    weight: RISK_WEIGHTS.material,
    because: `${i.missingLines}/${i.bomLines}`,
  };
}

/**
 * Rủi ro tiến độ = khoảng CÁCH giữa tiến độ đáng lẽ phải đạt và tiến độ thật.
 *
 * Đã quá hạn thì 100 ngay, không cần tính gì thêm.
 * Chưa quá hạn: thời gian đã trôi bao nhiêu phần trăm thì sản lượng cũng phải
 * đạt chừng đó. Chạy trước kế hoạch thì rủi ro 0, không phải số âm.
 */
function scheduleScore(i: HealthInput): HealthPart {
  const w = RISK_WEIGHTS.schedule;
  if (i.daysLeft !== null && i.daysLeft < 0) {
    return { key: 'schedule', score: MAX, weight: w, because: `${Math.abs(i.daysLeft)}` };
  }
  if (i.daysLeft === null || i.totalDays === null || i.totalDays <= 0 || i.sewnPct === null) {
    return { key: 'schedule', score: null, weight: w, because: null };
  }
  const elapsedPct = clamp(((i.totalDays - i.daysLeft) / i.totalDays) * MAX);
  const gap = elapsedPct - i.sewnPct;
  return { key: 'schedule', score: clamp(gap), weight: w, because: `${Math.round(gap)}` };
}

/**
 * Rủi ro chất lượng từ DHU (lỗi trên trăm sản phẩm).
 * Mốc 10 DHU coi là nguy kịch — ngưỡng thông dụng của ngành may cho hàng dệt
 * kim. Dưới đó quy tuyến tính.
 */
export const DHU_CRITICAL = 10;

function qualityScore(i: HealthInput): HealthPart {
  const w = RISK_WEIGHTS.quality;
  if (i.dhu === null) return { key: 'quality', score: null, weight: w, because: null };
  return {
    key: 'quality',
    score: clamp((i.dhu / DHU_CRITICAL) * MAX),
    weight: w,
    because: i.dhu.toFixed(2),
  };
}

/**
 * Rủi ro năng lực xưởng = nhịp CÒN PHẢI chạy so với nhịp đã chạy được.
 *
 * Cần biết sản lượng theo ngày mới tính đúng được, mà thanh đầu chưa nạp tới
 * mức đó. Trả null thay vì đoán — Điều XX. Lát cắt Sản xuất ở giai đoạn sau sẽ
 * có dữ liệu nhịp ngày và bổ sung vào đây.
 */
function capacityScore(): HealthPart {
  return { key: 'capacity', score: null, weight: RISK_WEIGHTS.capacity, because: null };
}

/**
 * Tính điểm từ dữ liệu thật.
 *
 * Thành phần nào thiếu dữ liệu thì bị LOẠI, và trọng số của ba thành phần còn
 * lại được CHUẨN HOÁ lại cho tổng bằng 1. Nếu không chuẩn hoá, một đơn chỉ có
 * dữ liệu NPL sẽ ra tối đa 35 điểm và trông "an toàn" dù thiếu sạch nguyên
 * liệu — đúng kiểu sai lặng lẽ nguy hiểm nhất.
 */
export function deriveHealth(i: HealthInput): Health {
  const parts = [materialScore(i), scheduleScore(i), qualityScore(i), capacityScore()];
  const has = parts.filter((p) => p.score !== null);
  if (has.length === 0) {
    return { parts, total: null, level: null, source: 'NONE', basis: 0 };
  }
  const wSum = has.reduce((s, p) => s + p.weight, 0);
  const total = Number(
    (has.reduce((s, p) => s + (p.score as number) * p.weight, 0) / wSum).toFixed(2),
  );
  return { parts, total, level: riskLevelOf(total), source: 'DERIVED', basis: has.length };
}

/** Điểm ĐÃ CHẤM và lưu trong risk_assessments — luôn thắng điểm tính tại chỗ. */
export function assessedHealth(a: {
  materialScore: number | null;
  scheduleScore: number | null;
  qualityScore: number | null;
  capacityScore: number | null;
  totalScore: number | null;
  level: string | null;
}): Health | null {
  if (a.totalScore === null) return null;
  const parts: HealthPart[] = [
    { key: 'material', score: a.materialScore, weight: RISK_WEIGHTS.material, because: null },
    { key: 'schedule', score: a.scheduleScore, weight: RISK_WEIGHTS.schedule, because: null },
    { key: 'quality', score: a.qualityScore, weight: RISK_WEIGHTS.quality, because: null },
    { key: 'capacity', score: a.capacityScore, weight: RISK_WEIGHTS.capacity, because: null },
  ];
  return {
    parts,
    total: a.totalScore,
    level: a.level ?? riskLevelOf(a.totalScore),
    source: 'ASSESSED',
    basis: parts.filter((p) => p.score !== null).length,
  };
}
