// ============================================================================
// SẴN SÀNG NGUYÊN PHỤ LIỆU — LOGIC THUẦN
//
// Không phụ thuộc React, không đọc cơ sở dữ liệu. Nhờ vậy luật "thế nào là Sẵn
// sàng" kiểm thử được bằng số mà không cần dựng Postgres.
//
// ─── TRONG NGÀNH MAY, NPL LÀ MÁU ─────────────────────────────────────────
// Thiếu một mét vải là cả chuyền đứng. Vì vậy luật ở đây nghiêng hẳn về phía
// BÁO ĐỘNG SỚM: nghi ngờ thì xếp xuống mức thấp hơn, không xếp lên.
// ============================================================================

/** Bốn mức, xếp từ xấu nhất tới tốt nhất khi cần so sánh */
export const READINESS_LEVELS = ['MISSING', 'PARTIAL', 'READY', 'UNKNOWN'] as const;
export type Readiness = (typeof READINESS_LEVELS)[number];

/**
 * Trạng thái tiếng Việt của bảng `bom` cũ.
 *
 * ⚠️ ĐÂY LÀ CHỖ ĐÃ CÓ MỘT LỖI THẬT. Mã Phase 1 của tôi so `npl_status` với
 * chuỗi 'READY', trong khi giá trị THẬT trong cơ sở dữ liệu là tiếng Việt:
 * "Đã về kho" · "Thiếu hụt" · "Đang về" · "Chưa đặt".
 * Không giá trị nào khớp, nên MỌI dòng đều bị đếm là thiếu và điểm rủi ro NPL
 * luôn nhảy lên 100. Lỗi chưa lộ ra vì các PO thật có 0 dòng định mức — nhưng
 * nó sẽ nổ ngay khi ai đó thêm một dòng.
 *
 * Bảng tra dưới đây giữ lại để đọc được dữ liệu cũ. Luồng mới đi qua
 * `style_bom` và tính trạng thái từ SỐ LƯỢNG THẬT, không từ chữ.
 */
const LEGACY_STATUS: Readonly<Record<string, Readiness>> = {
  'đã về kho': 'READY',
  'đủ': 'READY',
  'thiếu hụt': 'MISSING',
  'chưa đặt': 'MISSING',
  'đang về': 'PARTIAL',
  'đang đặt': 'PARTIAL',
};

/** Đọc trạng thái chữ của bảng cũ. Không nhận ra thì trả UNKNOWN, KHÔNG trả
 *  MISSING — báo động giả cũng làm mất niềm tin y như bỏ sót. */
export function readLegacyStatus(raw: string | null | undefined): Readiness {
  if (!raw) return 'UNKNOWN';
  return LEGACY_STATUS[raw.trim().toLowerCase()] ?? 'UNKNOWN';
}

/** Số liệu thô của một dòng định mức, đúng những gì view trả về */
export interface LineInput {
  /** Nhu cầu tính từ định mức × hao hụt × sản lượng. null = chưa tính được */
  required: number | null;
  /** Tồn KHẢ DỤNG (đã trừ giữ chỗ, chờ kiểm, bị khoá) */
  available: number;
  onHand: number;
  /** Đã giữ chỗ RIÊNG cho đơn này */
  reservedForPo: number;
  blocked: number;
  inInspection: number;
  rollsTotal: number;
  rollsFailed: number;
  rollsPending: number;
  inspectionsFailed: number;
}

export interface LineVerdict {
  status: Readiness;
  /** Phần trăm đã đáp ứng. null khi chưa biết nhu cầu */
  coverage: number | null;
  /** Còn thiếu bao nhiêu. null khi chưa biết nhu cầu */
  shortage: number | null;
  /** Có chuyện về chất lượng: cuộn bị khoá, cuộn trượt kiểm, hàng bị chặn */
  qaFlag: boolean;
}

/**
 * Chấm một dòng định mức.
 *
 * ─── VÌ SAO TÍNH TRÊN "ĐÃ GIỮ CHỖ + KHẢ DỤNG" ───────────────────────────
 * Hàng đã giữ chỗ cho CHÍNH đơn này thì với đơn này nó là hàng đã có. Nhưng
 * `available_qty` lại ĐÃ TRỪ phần giữ chỗ đó ra (xem cột sinh tự động ở
 * migration 017). Chỉ nhìn `available` sẽ báo thiếu đúng những đơn đã chuẩn bị
 * hàng đầy đủ nhất — sai ngược hoàn toàn.
 *
 * ─── VÌ SAO KHÔNG TÍNH HÀNG BỊ KHOÁ VÀ HÀNG CHỜ KIỂM ────────────────────
 * `available_qty` đã trừ sẵn hai phần đó. Hàng chưa qua kiểm mà đếm là có thì
 * đúng bằng việc hứa một thứ chưa chắc dùng được.
 */
export function judgeLine(i: LineInput): LineVerdict {
  const usable = i.available + i.reservedForPo;
  const qaFlag = i.rollsFailed > 0 || i.inspectionsFailed > 0 || i.blocked > 0;

  if (i.required === null || i.required <= 0) {
    return { status: 'UNKNOWN', coverage: null, shortage: null, qaFlag };
  }

  const coverage = (usable / i.required) * 100;
  const shortage = Math.max(i.required - usable, 0);

  // Đủ số nhưng có cuộn trượt kiểm thì KHÔNG được gọi là sẵn sàng: số mét đó
  // có thể không dùng được. Hạ xuống Một phần để người dùng phải nhìn vào.
  if (usable >= i.required) {
    return { status: qaFlag ? 'PARTIAL' : 'READY', coverage, shortage: 0, qaFlag };
  }
  if (usable > 0) return { status: 'PARTIAL', coverage, shortage, qaFlag };
  return { status: 'MISSING', coverage: 0, shortage, qaFlag };
}

export interface HealthSummary {
  total: number;
  ready: number;
  partial: number;
  missing: number;
  unknown: number;
  /** Phần trăm dòng sẵn sàng trên số dòng TÍNH ĐƯỢC. null khi không dòng nào
   *  tính được — chia cho 0 ra NaN rồi hiện thẳng ra màn hình. */
  readyPct: number | null;
  /** Có dòng nào đang chặn sản xuất không */
  blocking: boolean;
}

/**
 * Gộp toàn bộ định mức thành một con số sức khoẻ.
 *
 * Mẫu số là số dòng TÍNH ĐƯỢC, không phải tổng số dòng. Lấy tổng làm mẫu thì
 * một đơn có 8 dòng đủ và 2 dòng chưa có định mức sẽ hiện 80% — nghe như thiếu
 * hàng, trong khi thật ra là thiếu THÔNG TIN. Hai chuyện phải tách.
 */
export function summarise(verdicts: readonly LineVerdict[]): HealthSummary {
  const count = (s: Readiness) => verdicts.filter((v) => v.status === s).length;
  const ready = count('READY');
  const partial = count('PARTIAL');
  const missing = count('MISSING');
  const unknown = count('UNKNOWN');
  const known = ready + partial + missing;
  return {
    total: verdicts.length,
    ready, partial, missing, unknown,
    readyPct: known > 0 ? (ready / known) * 100 : null,
    blocking: missing > 0 || partial > 0,
  };
}
