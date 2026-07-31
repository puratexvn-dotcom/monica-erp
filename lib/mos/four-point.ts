// ============================================================================
// CHẤM ĐIỂM VẢI 4-POINT — CÔNG THỨC THUẦN
//
// Không phụ thuộc React, không đọc cơ sở dữ liệu. Đặt ở lib/mos vì tổ QA và
// cổng khách hàng rồi cũng sẽ hiện lại đúng con số này (Điều XVIII: thứ dùng
// chung không được biết nghiệp vụ của riêng một phân hệ).
//
// ─── ⚠️ CÁI BẪY LỚN NHẤT CỦA CẢ MÀN HÌNH: ĐƠN VỊ ──────────────────────────
// Công thức ngành thường viết là:  tổng điểm × 3600 / (dài × rộng)
// Con số 3600 là 100 × 36, và nó CHỈ ĐÚNG khi dài tính bằng YARD, rộng tính
// bằng INCH. Hệ thống lưu tất cả bằng MÉT (fabric_rolls.current_length_m,
// width_m), nên thay thẳng số mét vào sẽ sai GẤP 43 LẦN — và sai theo hướng
// đánh trượt vải tốt, tức nhà máy trả về nhà cung cấp những cuộn dùng được.
//
//   Cuộn 100 m × 1,5 m, 11 điểm lỗi:
//     ĐÚNG : 100 × 1,5 × 1,19599 = 179,40 yd²  →  11 × 100 / 179,40 = 6,13  ĐẠT
//     SAI  : 11 × 3600 / (100 × 1,5)                              = 264,00  TRƯỢT
//
// Hai cách viết dưới đây HOÀN TOÀN TƯƠNG ĐƯƠNG khi đã quy đổi đúng đơn vị:
//     tổng × 100 / diện_tích(yd²)   ≡   tổng × 3600 / (dài_yd × rộng_inch)
//
// ─── VÌ SAO VẪN TÍNH Ở ĐÂY DÙ CƠ SỞ DỮ LIỆU ĐÃ TÍNH ───────────────────────
// Trigger ở migration 020 mới là NGUỒN SỰ THẬT — nó quyết định ĐẠT/TRƯỢT khi
// ghi. Hàm dưới đây chỉ để XEM TRƯỚC trong lúc người kiểm còn đang gõ, để họ
// thấy điểm nhảy theo từng lỗi vừa đếm thay vì phải bấm Lưu mới biết. Hai nơi
// dùng chung một hằng số và một công thức, nên không thể lệch nhau.
// ============================================================================

// ─── BA HẰNG SỐ SUY TỪ MỘT GỐC DUY NHẤT ────────────────────────────────────
// Yard quốc tế được ĐỊNH NGHĨA đúng bằng 0,9144 m — đây là con số pháp định,
// không phải số đo gần đúng. Mọi hằng số khác suy ra từ nó.
//
// ⚠️ Bản đầu tôi viết thẳng ba số đã làm tròn RIÊNG từng cái (1.0936132983 ·
// 39.3700787402 · 1.19599004630108). Chúng lệch nhau ở chữ số thứ mười, nên hai
// đường tính cùng một đại lượng ra hai kết quả khác nhau 1,94e-8. Không đủ để
// đổi kết luận ĐẠT/TRƯỢT của bất kỳ cuộn nào, nhưng một hệ thống có hai giá trị
// cho cùng một hằng số là mầm của những chênh lệch không ai giải thích nổi về
// sau. Suy từ một gốc thì không có chỗ cho việc đó.
const YARD_IN_METERS = 0.9144;

/** 1 m = 1,093613298337708 yd */
export const M_TO_YD = 1 / YARD_IN_METERS;

/** 1 m = 39,370078740157481 inch (1 inch = 1/36 yard) */
export const M_TO_INCH = 1 / (YARD_IN_METERS / 36);

/** 1 m² = 1,195990046301080 yd² */
export const SQM_TO_SQYD = 1 / (YARD_IN_METERS * YARD_IN_METERS);

/** Ngưỡng mặc định của nhà máy khi khách hàng chưa khai riêng: 20 điểm/100 yd² */
export const DEFAULT_ACCEPTANCE_LIMIT = 20;

/** Đơn vị người kiểm nhập vào. Lưu trữ luôn quy về MÉT. */
export const ENTRY_UOMS = ['METERS', 'YARDS'] as const;
export type EntryUom = (typeof ENTRY_UOMS)[number];

/** Số lỗi theo bốn nhóm chiều dài vết lỗi (hệ 4-Point của ngành dệt) */
export interface DefectCounts {
  /** Vết lỗi tới 3 inch — 1 điểm */
  p1: number;
  /** Trên 3 tới 6 inch — 2 điểm */
  p2: number;
  /** Trên 6 tới 9 inch — 3 điểm */
  p3: number;
  /** Trên 9 inch — 4 điểm */
  p4: number;
}

export type FourPointVerdict = 'PASSED' | 'FAILED' | 'PENDING';

export interface FourPointResult {
  /** Tổng điểm phạt có trọng số */
  totalPoints: number;
  /** Diện tích đã kiểm, quy ra yd². null khi chưa đủ kích thước để tính */
  areaSqYd: number | null;
  /** Điểm trên 100 yd². null khi chưa tính được — KHÔNG trả 0, vì 0 nghĩa là
   *  vải hoàn hảo còn null nghĩa là chưa biết. */
  pointsPer100SqYd: number | null;
  /** Ngưỡng đang áp dụng */
  limit: number;
  /** PENDING khi chưa đủ dữ liệu — tuyệt đối không đoán bừa là ĐẠT */
  verdict: FourPointVerdict;
  /** Cách viết theo yard/inch, để đối chiếu với phiếu giấy của nhà cung cấp */
  lengthYd: number | null;
  widthInch: number | null;
}

/** Quy đổi một số đo về mét, bất kể người dùng nhập bằng đơn vị nào. */
export function toMeters(value: number, uom: EntryUom): number {
  return uom === 'YARDS' ? value / M_TO_YD : value;
}

/** Quy đổi ngược từ mét ra đơn vị người dùng đang chọn (dùng để hiện lại). */
export function fromMeters(meters: number, uom: EntryUom): number {
  return uom === 'YARDS' ? meters * M_TO_YD : meters;
}

/** Tổng điểm phạt: nhóm 1 điểm ×1, nhóm 2 điểm ×2, nhóm 3 ×3, nhóm 4 ×4. */
export function totalPointsOf(d: DefectCounts): number {
  return d.p1 * 1 + d.p2 * 2 + d.p3 * 3 + d.p4 * 4;
}

/**
 * Chấm điểm một cuộn.
 *
 * @param lengthM  chiều dài đã kiểm, tính bằng MÉT
 * @param widthM   khổ vải, tính bằng MÉT
 */
export function scoreFourPoint(
  defects: DefectCounts,
  lengthM: number | null,
  widthM: number | null,
  limit: number = DEFAULT_ACCEPTANCE_LIMIT,
): FourPointResult {
  const totalPoints = totalPointsOf(defects);
  const usable = lengthM !== null && widthM !== null && lengthM > 0 && widthM > 0;

  if (!usable) {
    return {
      totalPoints,
      areaSqYd: null,
      pointsPer100SqYd: null,
      limit,
      verdict: 'PENDING',
      lengthYd: null,
      widthInch: null,
    };
  }

  const areaSqYd = lengthM * widthM * SQM_TO_SQYD;
  const pointsPer100SqYd = (totalPoints * 100) / areaSqYd;

  return {
    totalPoints,
    areaSqYd,
    pointsPer100SqYd,
    limit,
    verdict: pointsPer100SqYd <= limit ? 'PASSED' : 'FAILED',
    lengthYd: lengthM * M_TO_YD,
    widthInch: widthM * M_TO_INCH,
  };
}
