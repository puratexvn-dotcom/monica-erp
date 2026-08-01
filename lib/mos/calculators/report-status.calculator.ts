import {
  currentReports,
  type AssignmentCore,
  type AssignmentStatus,
  type DailyReportCore,
} from '../domain/assignment';
import { eachDay, makeWindow } from '../value-objects/date-window';
import { vnTodayISO } from '../po-flow';

// ============================================================================
// TRẠNG THÁI BÁO CÁO NGÀY — PURE CALCULATOR (Yêu cầu 7)
//
// ⚠️ TỆP NÀY LÀ BẢN ĐỐI ỨNG CỦA VIEW `v_assignment_report_status` (029 Mục 10a).
// Hai bên PHẢI cho cùng một kết quả trên cùng một dữ liệu. Có bài kiểm đối chiếu.
//
// Vậy vì sao cần cả hai?
//
//   VIEW         trả lời cho bảng điều khiển và cổng đối tác — hàng nghìn dòng,
//                lọc và đếm ngay trong cơ sở dữ liệu, không kéo về máy khách.
//   CALCULATOR   trả lời cho MỘT Assignment đang mở trên màn hình, nơi dữ liệu
//                đã nằm sẵn trong bộ nhớ. Gọi lại cơ sở dữ liệu chỉ để biết
//                "ngày 06/08 đã báo chưa" là một vòng mạng thừa.
//
// Đây KHÔNG phải nhân bản logic một cách tuỳ tiện: nó là cùng một luật, hai
// điểm thực thi, và có bài kiểm giữ hai bên khớp nhau — cùng khuôn đã dùng cho
// `SHIPMENT_FLOW` ⟷ `shipments_status_valid` ở Phase 6.
// ============================================================================

/**
 * Bốn giá trị, không phải một cờ đúng/sai.
 *
 * `NOT_STARTED` khác `OVERDUE` — *"chưa tới hạn"* khác *"đã trễ"*. Gộp lại thì
 * bảng điều khiển đỏ rực mỗi sáng và không ai nhìn nữa.
 *
 * `PARTIAL` tách riêng vì một phiếu thiếu sản lượng **không phải** phiếu đã nộp:
 * đối tác mở biểu mẫu, gõ mỗi ghi chú rồi lưu, và con số vẫn trống.
 */
export const REPORT_STATUSES = ['COMPLETE', 'PARTIAL', 'OVERDUE', 'NOT_STARTED'] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Ba trạng thái Assignment mà việc đòi báo cáo ngày là hợp lý. Khớp mệnh đề `WHERE` của view. */
export const REPORTING_STATUSES: readonly AssignmentStatus[] = [
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
];

export interface DayReportStatus {
  date: string;
  status: ReportStatus;
}

export interface ReportStatusResult {
  days: DayReportStatus[];
  /** Số ngày đã trễ. Đây là con số duy nhất mà nút "Báo xong" quan tâm. */
  overdueCount: number;
  missingDates: string[];
  /** true = cửa sổ dài bất thường và danh sách đã bị cắt. PHẢI hiển thị, không được nuốt. */
  truncated: boolean;
}

const EMPTY: ReportStatusResult = { days: [], overdueCount: 0, missingDates: [], truncated: false };

/**
 * Tính trạng thái báo cáo từng ngày của MỘT Assignment.
 *
 * Trả rỗng — chứ không ném lỗi — trong ba trường hợp, và cả ba đều là câu trả
 * lời đúng chứ không phải né tránh:
 *   ① Assignment chưa/không còn ở giai đoạn phải báo cáo (`DRAFT`, `SUSPENDED`…)
 *   ② chưa có cửa sổ kế hoạch (đang soạn `DRAFT`)
 *   ③ đã xoá mềm
 *
 * ⚠️ `SUSPENDED` cố ý KHÔNG nằm trong `REPORTING_STATUSES`: tạm dừng vì hết vải
 * thì không thể đòi báo cáo sản lượng. Cảnh báo giả làm người ta ngừng nhìn bảng
 * cảnh báo.
 */
export function calcReportStatus(
  assignment: Pick<
    AssignmentCore,
    'status' | 'planned_start' | 'planned_finish' | 'deleted_at'
  >,
  reports: readonly DailyReportCore[],
  today: string = vnTodayISO(),
): ReportStatusResult {
  if (assignment.deleted_at) return EMPTY;
  if (!REPORTING_STATUSES.includes(assignment.status)) return EMPTY;

  const window = makeWindow(assignment.planned_start, assignment.planned_finish);
  if (!window) return EMPTY;

  // ⚠️ CHỈ đọc bản ĐANG HIỆU LỰC. Bỏ bước này thì một ngày đã đính chính xuất
  // hiện hai lần trong `byDate` — và bản cũ có thể ghi đè bản mới tuỳ thứ tự
  // mảng, khiến màn hình báo "thiếu" cho một ngày đã được sửa xong.
  const byDate = new Map<string, DailyReportCore>();
  for (const r of currentReports(reports)) {
    byDate.set(r.report_date.slice(0, 10), r);
  }

  const { days: dates, truncated } = eachDay(window, today);
  const days: DayReportStatus[] = [];
  const missingDates: string[] = [];
  let overdueCount = 0;

  for (const date of dates) {
    const r = byDate.get(date);
    let status: ReportStatus;

    if (r) {
      // Có phiếu, nhưng đủ số hay chưa lại là chuyện khác.
      status = r.output_qty !== null && r.target_qty !== null ? 'COMPLETE' : 'PARTIAL';
    } else if (date < today) {
      status = 'OVERDUE';
      overdueCount += 1;
      missingDates.push(date);
    } else {
      // Hôm nay chưa hết thì chưa thể gọi là trễ.
      status = 'NOT_STARTED';
    }

    days.push({ date, status });
  }

  return { days, overdueCount, missingDates, truncated };
}
