import type { Tone } from '@/components/ui';
import type {
  AssignmentPriority,
  AssignmentStatus,
} from '@/lib/mos/domain/assignment';
import type { ReportStatus } from '@/lib/mos/calculators/report-status.calculator';

// ============================================================================
// MÀU CHO PHẦN VIỆC — TRA BẢNG, KHÔNG SUY TỪ CHỮ
//
// ─── VÌ SAO MỘT BẢNG TRA CHỨ KHÔNG PHẢI MỘT CHUỖI if ─────────────────────
// `Record<AssignmentStatus, Tone>` khiến trình biên dịch **bắt buộc** khai đủ
// chín trạng thái. Thêm một trạng thái vào Domain mà quên màu ở đây là **lỗi
// biên dịch**, chứ không phải một cái chip xám xuất hiện trên màn hình mà không
// ai để ý.
//
// ─── DÙNG `Tone` (thẩm mỹ), KHÔNG DÙNG `BIZ_TONE` (nghiệp vụ) ─────────────
// Chuẩn UI mục 2.1: `BIZ_TONE` trả lời *"nội dung này thuộc nghiệp vụ nào"* —
// nguyên phụ liệu, chất lượng, giao hàng… Còn ở đây câu hỏi là *"phần việc này
// đang ổn hay đang có vấn đề"*, tức là màu **trạng thái**. Trộn hai bảng thì
// một ngày đổi màu nhấn của hệ thống sẽ vô tình đổi luôn ý nghĩa nghiệp vụ.
//
// ⚠️ Mọi cặp màu dưới đây lấy từ `TONE_BADGE` đã ĐO tương phản WCAG AA
// (sắc độ 700 trên nền 50: 5,21–6,84:1). Không phát minh cặp màu mới ở đây —
// chuẩn UI mục 2.4 đòi đo trước khi chốt, và bảng đã đo sẵn thì dùng lại.
// ============================================================================

/**
 * Chín trạng thái → năm tông.
 *
 * Nguyên tắc gán, đọc từ trên xuống:
 *   xám    = chưa vào cuộc  (nháp, đã huỷ — không đòi hành động gì)
 *   xanh   = đang chạy đúng hướng
 *   hổ phách = đang chờ NGƯỜI KHÁC, hoặc đang dừng
 *   hồng   = có chuyện, cần người xử lý
 *   lục    = đã xong tốt đẹp
 */
export const STATUS_TONE: Record<AssignmentStatus, Tone> = {
  // Monica đang soạn — đối tác còn chưa thấy.
  DRAFT: 'slate',
  // Đã giao, đang chờ đối tác quyết định. Chờ người khác ⇒ hổ phách.
  ISSUED: 'amber',
  ACCEPTED: 'indigo',
  // Từ chối là một SỰ VIỆC cần Monica xử lý, không phải một trạng thái nghỉ.
  REJECTED: 'rose',
  IN_PROGRESS: 'indigo',
  SUSPENDED: 'amber',
  // Đối tác NÓI đã xong; Monica chưa xác nhận. Chưa phải màu hoàn thành.
  COMPLETED: 'emerald',
  CLOSED: 'emerald',
  CANCELLED: 'slate',
};

/**
 * ⚠️ `COMPLETED` và `CLOSED` cùng màu lục là CỐ Ý — cả hai đều là "đã xong" với
 * người nhìn lướt. Khác nhau nằm ở CHỮ ("Báo đã xong" ⟷ "Đã nghiệm thu") và ở
 * nút hành động, không nằm ở màu. Chuẩn UI: *"trạng thái luôn có icon + chữ,
 * không phân biệt bằng màu đơn thuần"*.
 */

export const PRIORITY_TONE: Record<AssignmentPriority, Tone> = {
  LOW: 'slate',
  // Bình thường KHÔNG được nhấn màu: nếu mọi dòng đều có màu thì không dòng nào
  // nổi bật, và độ ưu tiên mất hết tác dụng.
  NORMAL: 'slate',
  HIGH: 'amber',
  URGENT: 'rose',
};

/** Độ ưu tiên bình thường thì KHÔNG hiện chip — bớt nhiễu cho mắt. */
export function shouldShowPriority(p: AssignmentPriority): boolean {
  return p === 'HIGH' || p === 'URGENT';
}

export const REPORT_TONE: Record<ReportStatus, Tone> = {
  COMPLETE: 'emerald',
  // Có phiếu nhưng thiếu số — chưa đủ để yên tâm, chưa đến mức báo động.
  PARTIAL: 'amber',
  OVERDUE: 'rose',
  // ⚠️ "Chưa tới hạn" phải là XÁM, tuyệt đối không đỏ. Tô đỏ những ngày chưa
  // tới hạn thì bảng đỏ rực mỗi sáng và người ta ngừng nhìn bảng cảnh báo —
  // đúng lý do view tách bốn giá trị thay vì một cờ đúng/sai.
  NOT_STARTED: 'slate',
};
