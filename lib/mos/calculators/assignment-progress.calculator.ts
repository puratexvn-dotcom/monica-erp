import { currentReports, type AssignmentCore, type DailyReportCore } from '../domain/assignment';
import { daysBetween } from '../po-flow';

// ============================================================================
// TIẾN ĐỘ ASSIGNMENT — PURE CALCULATOR (Yêu cầu 7)
//
// ─── ĐIỀU XXVIII.1 · KHÔNG LƯU DỮ LIỆU TÍNH TOÁN ─────────────────────────
// Không cột nào trong 029 lưu `completion_percent`, `defect_rate` hay
// `delay_days`. Chúng lệch ngay lúc nửa đêm trôi qua mà không ai chạy lại.
//
// ⚠️ MỌI PHÉP CHIA Ở ĐÂY TRẢ `null` KHI MẪU SỐ BẰNG 0 HOẶC KHÔNG XÁC ĐỊNH.
// Trả `0` là nói dối: "tỉ lệ lỗi 0%" cho một Assignment chưa sản xuất dòng nào
// sẽ được đọc là "chạy hoàn hảo", và nó sẽ leo lên bảng xếp hạng đối tác.
// `null` buộc giao diện phải hiển thị "—", tức là thừa nhận chưa có dữ liệu.
// ============================================================================

export interface AssignmentProgress {
  /** Tổng sản lượng của các bản báo cáo ĐANG HIỆU LỰC. */
  outputQty: number;
  targetQty: number;
  defectQty: number;
  reworkQty: number;
  downtimeMinutes: number;

  /** Số ngày đã có báo cáo (đếm bản đang hiệu lực). */
  reportedDays: number;

  /** outputQty / assigned_qty. `null` khi chưa giao số lượng. */
  completionRate: number | null;
  /** outputQty / targetQty — làm được bao nhiêu so với chỉ tiêu đã đặt. */
  achievementRate: number | null;
  /** defectQty / outputQty. `null` khi chưa sản xuất. */
  defectRate: number | null;

  /** actual_start − planned_start. Dương = vào việc muộn. `null` khi thiếu một đầu. */
  startDelayDays: number | null;
  /** actual_finish − planned_finish. Dương = xong muộn hơn cam kết. */
  finishDelayDays: number | null;
}

interface ProgressInput extends DailyReportCore {
  rework_qty?: number | null;
  downtime_minutes?: number | null;
}

/** Chia an toàn: mẫu số 0 hoặc không xác định trả `null`, không trả 0. */
function ratio(numerator: number, denominator: number | null | undefined): number | null {
  if (denominator === null || denominator === undefined) return null;
  if (!Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

export function calcAssignmentProgress(
  assignment: Pick<
    AssignmentCore,
    'planned_start' | 'planned_finish' | 'actual_start' | 'actual_finish'
  > & { assigned_qty?: number | null },
  reports: readonly ProgressInput[],
): AssignmentProgress {
  // ⚠️ Cộng trên bản ĐANG HIỆU LỰC. Cộng cả bản đã bị đính chính là **đếm đôi
  // sản lượng dùng để thanh toán** — sai số tiền, và không có lỗi nào nổ ra.
  const live = currentReports(reports);

  let outputQty = 0;
  let targetQty = 0;
  let defectQty = 0;
  let reworkQty = 0;
  let downtimeMinutes = 0;

  for (const r of live) {
    outputQty += r.output_qty ?? 0;
    targetQty += r.target_qty ?? 0;
    defectQty += r.defect_qty ?? 0;
    reworkQty += r.rework_qty ?? 0;
    downtimeMinutes += r.downtime_minutes ?? 0;
  }

  return {
    outputQty,
    targetQty,
    defectQty,
    reworkQty,
    downtimeMinutes,
    reportedDays: live.length,

    completionRate: ratio(outputQty, assignment.assigned_qty),
    achievementRate: ratio(outputQty, targetQty),
    defectRate: ratio(defectQty, outputQty),

    // ⚠️ Số ÂM là hợp lệ và có ý nghĩa: vào việc sớm hơn kế hoạch. Kẹp về 0 sẽ
    // xoá mất thông tin đó, và đối tác chạy sớm trông y hệt đối tác đúng hạn.
    startDelayDays: daysBetween(assignment.planned_start, assignment.actual_start),
    finishDelayDays: daysBetween(assignment.planned_finish, assignment.actual_finish),
  };
}
