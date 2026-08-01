import type { AssignmentFilterDTO, OverdueFilterDTO } from '../assignment.contract';
import { normalizeFilter } from './normalize';

// ============================================================================
// QUERY KEY FACTORY — ASSIGNMENT
//
// ─── VÌ SAO KHÔNG VIẾT KHOÁ THẲNG TRONG HOOK ─────────────────────────────
// Khoá truy vấn nối HAI đầu không nhìn thấy nhau: chỗ ĐỌC dữ liệu và chỗ LÀM
// MỚI sau khi ghi.
//
// Viết thẳng thì `['assignments', id]` ở hook đọc và `['assignment', id]` ở chỗ
// invalidate là hai khoá khác nhau — và **không có lỗi nào nổ ra**. Màn hình
// chỉ đơn giản hiện số cũ mãi mãi. Đây là lớp lỗi tệ nhất: im lặng tuyệt đối,
// và người dùng kết luận là hệ thống ghi hỏng.
//
// ─── PHÂN CẤP LÀ CẢ THIẾT KẾ ─────────────────────────────────────────────
//   invalidate(all)        → làm mới TẤT CẢ
//   invalidate(lists())    → chỉ danh sách, giữ nguyên chi tiết đang mở
//   invalidate(detail(id)) → đúng một phần việc
//
// Ba mức, ba nhu cầu thật. Không phân cấp thì mỗi lần sửa một phần việc phải
// nạp lại mọi thứ, và màn hình chớp trắng.
// ============================================================================

/** ⚠️ Số ÍT, và chỉ gõ MỘT LẦN trong toàn hệ thống. */
const ROOT = 'assignment' as const;

export const assignmentKeys = {
  all: [ROOT] as const,

  lists: () => [ROOT, 'list'] as const,
  list: (filter?: AssignmentFilterDTO) => [ROOT, 'list', normalizeFilter(filter)] as const,

  details: () => [ROOT, 'detail'] as const,
  detail: (assignmentId: string) => [ROOT, 'detail', assignmentId] as const,

  /** Lịch báo cáo từng ngày, đọc từ `v_assignment_report_status`. */
  calendar: (assignmentId: string) => [ROOT, 'calendar', assignmentId] as const,

  overdues: () => [ROOT, 'overdue'] as const,
  overdue: (filter?: OverdueFilterDTO) => [ROOT, 'overdue', normalizeFilter(filter)] as const,
} as const;

/**
 * Những khoá cần làm mới sau khi GHI thành công.
 *
 * ⚠️ Đặt ở đây chứ không rải trong từng mutation. Thêm một truy vấn mới mà quên
 * thêm vào danh sách invalidate là lỗi im lặng — màn hình hiện số cũ và không
 * ai biết. Một chỗ duy nhất thì đọc lại là thấy ngay còn thiếu gì.
 *
 * Truyền `assignmentId` khi biết phần việc nào vừa đổi; bỏ trống khi vừa LẬP
 * MỚI — phần việc đó chưa nằm trong ô đệm nào, và làm mới một id chưa ai mở chỉ
 * tạo ra một ô rỗng.
 */
export function assignmentInvalidationKeys(assignmentId?: string): readonly unknown[][] {
  const keys: unknown[][] = [[...assignmentKeys.lists()], [...assignmentKeys.overdues()]];
  if (assignmentId) {
    keys.push([...assignmentKeys.detail(assignmentId)]);
    keys.push([...assignmentKeys.calendar(assignmentId)]);
  }
  return keys;
}
