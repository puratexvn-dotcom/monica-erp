import {
  ALLOWED_TRANSITIONS,
  REASON_FIELD,
  SCOPE_FIELDS,
  SCOPE_SHAPE,
  isValidReason,
  type AssignmentCore,
  type AssignmentStatus,
} from '../domain/assignment';
import { makeWindow } from '../value-objects/date-window';

// ============================================================================
// CHUYỂN TRẠNG THÁI — POLICY
//
// `domain/assignment.ts` giữ ĐỒ THỊ (dữ liệu: đi từ đâu tới đâu được).
// Tệp này giữ PHÁN QUYẾT (có đủ điều kiện để đi hay không).
//
// Tách như vậy vì hai thứ đó đổi vì hai lý do khác nhau: đồ thị đổi khi nghiệp
// vụ thêm một trạng thái; điều kiện đổi khi nghiệp vụ siết một quy trình.
//
// ─── HÀM Ở ĐÂY TRẢ KHOÁ i18n, KHÔNG TRẢ CÂU CHỮ ──────────────────────────
// Điều XXI. Tầng Domain không biết ngôn ngữ; giao diện dịch. Trả sẵn câu tiếng
// Việt ở đây nghĩa là bản tiếng Anh và tiếng Trung sẽ không bao giờ có.
// ============================================================================

export interface TransitionVerdict {
  ok: boolean;
  /** Khoá i18n giải thích vì sao KHÔNG được. Rỗng khi `ok`. */
  code: string;
  /** Cột đang thiếu, để giao diện tô đỏ đúng ô. */
  field?: string;
}

const OK: TransitionVerdict = { ok: true, code: '' };

function deny(code: string, field?: string): TransitionVerdict {
  return { ok: false, code, field };
}

/** Bảy trường bắt buộc trước khi giao việc. Khớp tài liệu 03 Mục 8. */
export const ISSUE_REQUIRED_FIELDS = [
  'partner_id',
  'order_id',
  'scope_level',
  'assigned_qty',
  'planned_start',
  'planned_finish',
  'owner_user_id',
] as const;

export type IssueField = (typeof ISSUE_REQUIRED_FIELDS)[number];

export interface TransitionInput
  extends Pick<
    AssignmentCore,
    | 'status'
    | 'scope_level'
    | 'site_id'
    | 'line_id'
    | 'style_operation_id'
    | 'partner_id'
    | 'order_id'
    | 'planned_start'
    | 'planned_finish'
    | 'owner_user_id'
    | 'deleted_at'
  > {
  assigned_qty?: number | null;
}

/**
 * Phạm vi đã khai đủ và đúng hình dạng chưa.
 *
 * Bản đối ứng của ràng buộc `assignments_scope_shape` (029 Mục 3), chạy trên
 * biểu mẫu để báo lỗi NGAY thay vì để cơ sở dữ liệu ném `23514` sau khi người
 * dùng đã gõ xong tất cả.
 *
 * ⚠️ Kiểm CẢ HAI CHIỀU: thiếu cột bắt buộc **và** thừa cột không thuộc cấp.
 * Chiều thứ hai quan trọng hơn — một Assignment cấp `ORDER` mà còn sót
 * `line_id` từ lần chọn trước sẽ được cơ sở dữ liệu từ chối, nhưng nếu chỉ kiểm
 * chiều thiếu thì giao diện báo "hợp lệ" rồi mới hỏng lúc lưu.
 */
export function checkScopeShape(a: Pick<TransitionInput, 'scope_level' | 'site_id' | 'line_id' | 'style_operation_id'>): TransitionVerdict {
  const required = SCOPE_SHAPE[a.scope_level];
  if (!required) return deny('assignment_err_scope_level_invalid', 'scope_level');

  for (const field of SCOPE_FIELDS) {
    const filled = a[field] !== null && a[field] !== undefined && a[field] !== '';
    const mustFill = required.includes(field);

    if (mustFill && !filled) return deny('assignment_err_scope_missing', field);
    // NULL KHÔNG BAO GIỜ nghĩa là "tất cả" — nhưng một giá trị thừa cũng không
    // được phép nới phạm vi một cách âm thầm.
    if (!mustFill && filled) return deny('assignment_err_scope_extra', field);
  }

  return OK;
}

export interface CompletionContext {
  /** Số ngày còn `OVERDUE`, lấy từ `calculators/report-status.calculator.ts`. */
  overdueCount: number;
}

/**
 * Có được chuyển từ `from` sang `to` không.
 *
 * `reason` là nội dung ô lý do người dùng vừa gõ — bốn đích đến đòi nó.
 * `ctx` chỉ cần khi đích là `COMPLETED`.
 */
export function canTransition(
  a: TransitionInput,
  to: AssignmentStatus,
  reason?: string | null,
  ctx?: CompletionContext,
): TransitionVerdict {
  if (a.deleted_at) return deny('assignment_err_deleted');

  const allowed = ALLOWED_TRANSITIONS[a.status];
  if (!allowed) return deny('assignment_err_status_invalid', 'status');
  if (!allowed.includes(to)) {
    // `CLOSED` và `CANCELLED` không có lối ra — thông báo riêng, vì "không
    // chuyển được" và "đã chốt sổ, hãy lập phần việc mới" là hai câu khác nhau.
    return deny(allowed.length === 0 ? 'assignment_err_terminal' : 'assignment_err_transition');
  }

  // ── Đích đòi lý do ──────────────────────────────────────────────────────
  const reasonField = REASON_FIELD[to];
  if (reasonField && !isValidReason(reason)) {
    return deny('assignment_err_reason_too_short', reasonField);
  }

  // ── → ISSUED: đủ bảy trường, và phạm vi đúng hình dạng ──────────────────
  if (to === 'ISSUED') {
    const scope = checkScopeShape(a);
    if (!scope.ok) return scope;

    // ⚠️ Bản đồ tường minh, KHÔNG ép kiểu `Record<string, unknown>`.
    // Kiểu `Record<IssueField, unknown>` khiến trình biên dịch **bắt buộc** hai
    // danh sách khớp nhau: thêm một trường vào `ISSUE_REQUIRED_FIELDS` mà quên
    // khai giá trị ở đây là lỗi biên dịch, chứ không phải một trường im lặng
    // không bao giờ được kiểm. Điều XXV — không đi tắt bằng ép kiểu.
    const values: Record<IssueField, unknown> = {
      partner_id: a.partner_id,
      order_id: a.order_id,
      scope_level: a.scope_level,
      assigned_qty: a.assigned_qty,
      planned_start: a.planned_start,
      planned_finish: a.planned_finish,
      owner_user_id: a.owner_user_id,
    };

    for (const field of ISSUE_REQUIRED_FIELDS) {
      const v = values[field];
      if (v === null || v === undefined || v === '') {
        return deny('assignment_err_issue_missing', field);
      }
    }

    // Hai ngày nullable ở cơ sở dữ liệu nhưng bắt buộc ở đây — CSDL giữ bất
    // biến dữ liệu (thứ tự ngày), tầng này giữ quy trình.
    if (!makeWindow(a.planned_start, a.planned_finish)) {
      return deny('assignment_err_window_invalid', 'planned_finish');
    }
  }

  // ── → COMPLETED: điều kiện đắt nhất và quan trọng nhất ──────────────────
  //
  // Không có nó, đối tác báo "xong" rồi biến mất, để lại một chuỗi ngày trống
  // không ai truy được. Đây là cách `REPORT MISSING` có răng.
  if (to === 'COMPLETED') {
    if (!ctx) return deny('assignment_err_completion_unchecked');
    if (ctx.overdueCount > 0) return deny('assignment_err_reports_missing');
  }

  return OK;
}
