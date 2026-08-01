import {
  OPERATIONAL_WRITE_STATUSES,
  PARTNER_ACCESS_BY_STATUS,
  type AssignmentCore,
} from '../domain/assignment';
import { isWindowOpen, makeWindow } from '../value-objects/date-window';
import { vnTodayISO } from '../po-flow';

// ============================================================================
// PERMISSION ENGINE — BỘ LUẬT THUẦN
//
// Điều XXX: **phân quyền theo ASSIGNMENT, không theo ROLE.**
//
// Vai trò là thuộc tính của NGƯỜI. Assignment là thuộc tính của VIỆC. Một khi
// đã mang vai `subcon`, người đó thấy mọi thứ mà `subcon` được thấy — không có
// chỗ nào nói *"người này được làm việc này, trên đơn hàng này, tới ngày này"*.
// Đó chính là gốc của ba lỗ hổng thật đã vá ở 025/026.
//
// ─── BA THỨ TỆP NÀY KHÔNG BIẾT, VÀ CỐ Ý KHÔNG BIẾT ───────────────────────
//   ✗ Supabase        → nó nhận DỮ LIỆU, trả PHÁN QUYẾT
//   ✗ JWT             → "JWT không mang quyền. JWT chỉ mang Identity."
//   ✗ Bảng nào, cột nào → đó là việc của RLS ở migration 031
//
// ⚠️ `Actor.partnerId` PHẢI được phân giải từ bảng `partner_accounts`, TUYỆT ĐỐI
// KHÔNG lấy từ `app_metadata` của JWT. Claim trong JWT do lúc cấp tài khoản ghi
// vào và không đổi khi quan hệ đối tác thay đổi — một đối tác đã ngừng hợp tác
// vẫn cầm token cũ với claim cũ. `partner_accounts` là nguồn sự thật, và nó có
// cột `is_active`.
//
// ⚠️ KHÔNG hardcode `subcon_id`, không so sánh chuỗi `'subcon'` ở bất kỳ đâu
// trong tệp này — Điều XXX. Phán quyết chỉ dựa trên: người này thuộc đối tác
// nào, và Assignment này giao cho đối tác nào.
//
// Migration 030 sẽ dựng 5 hàm SQL phản chiếu ĐÚNG bộ luật dưới đây. Chúng là
// TẦNG THỰC THI THỨ HAI, không phải bản cài đặt thứ hai — hai bên có bài kiểm
// đối chiếu, giống `SHIPMENT_FLOW` ⟷ `shipments_status_valid`.
// ============================================================================

export type ActorKind = 'INTERNAL' | 'PARTNER';

export interface Actor {
  kind: ActorKind;
  userId: string;
  /**
   * Bắt buộc khi `kind === 'PARTNER'`, phân giải từ `partner_accounts`.
   *
   * Người nội bộ KHÔNG có `partnerId`, và đó không phải thiếu sót: họ không
   * thuộc đối tác nào, nên mọi phép so `partnerId === assignment.partner_id`
   * đều phải trả false cho họ — quyền của họ đến từ đường khác.
   */
  partnerId?: string | null;
}

export interface PermissionVerdict {
  ok: boolean;
  /** Khoá i18n. Rỗng khi `ok`. Điều XXI — tầng này không biết ngôn ngữ. */
  code: string;
}

const OK: PermissionVerdict = { ok: true, code: '' };

function deny(code: string): PermissionVerdict {
  return { ok: false, code };
}

/**
 * Người này có phải chủ nhân của Assignment này không.
 *
 * ⚠️ So sánh tường minh với `null`/rỗng. Nếu cả `actor.partnerId` và
 * `assignment.partner_id` cùng `null` thì `a === b` trả **true** — và một tài
 * khoản đối tác chưa gắn hồ sơ sẽ thấy mọi Assignment mồ côi. Lớp lỗi này im
 * lặng tuyệt đối cho tới lúc có dữ liệu bẩn.
 */
function isOwningPartner(actor: Actor, assignment: Pick<AssignmentCore, 'partner_id'>): boolean {
  if (actor.kind !== 'PARTNER') return false;
  if (!actor.partnerId || !assignment.partner_id) return false;
  return actor.partnerId === assignment.partner_id;
}

// ── ĐỌC ─────────────────────────────────────────────────────────────────────

/**
 * Đối tác chỉ thấy Assignment CỦA CHÍNH MÌNH, và chỉ ở những trạng thái mà
 * `PARTNER_ACCESS_BY_STATUS` cho phép.
 *
 * `DRAFT` ẩn vì Monica đang soạn — cho thấy bản nháp nghĩa là đối tác đọc được
 * đơn giá dự kiến trước khi đàm phán xong. `CANCELLED` ẩn vì nó đã biến mất
 * khỏi công việc của họ.
 */
export function canReadAssignment(
  actor: Actor,
  assignment: Pick<AssignmentCore, 'partner_id' | 'status' | 'deleted_at'>,
): PermissionVerdict {
  if (assignment.deleted_at) return deny('assignment_err_deleted');
  if (actor.kind === 'INTERNAL') return OK;
  if (!isOwningPartner(actor, assignment)) return deny('assignment_err_not_yours');

  const access = PARTNER_ACCESS_BY_STATUS[assignment.status];
  if (!access?.read) return deny('assignment_err_not_visible_yet');
  return OK;
}

// ── GHI DỮ LIỆU VẬN HÀNH ────────────────────────────────────────────────────

/**
 * Ba điều kiện, phải đủ CẢ BA:
 *
 * ```
 *   trạng thái ∈ {ACCEPTED, IN_PROGRESS}
 * ∧ hôm nay nằm trong [planned_start, planned_finish]
 * ∧ chưa xoá mềm
 * ```
 *
 * ⚠️ Cửa sổ dùng **KẾ HOẠCH**, không dùng **THỰC TẾ**. Lấy `actual_finish` làm
 * mốc tắt quyền nghĩa là **đối tác tự quyết định khi nào quyền của mình hết** —
 * chỉ cần chưa điền ngày hoàn thành thì quyền còn mãi. `planned_*` là khoảng
 * hai bên đã thoả thuận, và chỉ Monica sửa được.
 *
 * ⚠️ `today` truyền vào được để bài kiểm cố định thời gian. Mặc định là
 * `vnTodayISO()` — giờ Việt Nam, không phải UTC của máy chủ.
 */
export function canWriteOperational(
  actor: Actor,
  assignment: Pick<
    AssignmentCore,
    'partner_id' | 'status' | 'planned_start' | 'planned_finish' | 'deleted_at'
  >,
  today: string = vnTodayISO(),
): PermissionVerdict {
  const read = canReadAssignment(actor, assignment);
  if (!read.ok) return read;

  if (!OPERATIONAL_WRITE_STATUSES.includes(assignment.status)) {
    return deny('assignment_err_write_status');
  }

  const window = makeWindow(assignment.planned_start, assignment.planned_finish);
  if (!window) return deny('assignment_err_no_window');
  if (!isWindowOpen(window, today)) return deny('assignment_err_window_closed');

  return OK;
}

// ── NHẬN / TỪ CHỐI VIỆC ─────────────────────────────────────────────────────

/**
 * Ở `ISSUED`, đối tác ghi được ĐÚNG HAI THỨ: `ACCEPTED` hoặc `REJECTED`.
 * Không sản lượng, không báo cáo, không tài liệu.
 *
 * Và quyết định đó là của **chính đối tác** — Monica không được tự nhận thay.
 * Nếu Monica bấm hộ thì `accepted_at` mất hết giá trị pháp lý: nó phải trả lời
 * được câu *"đối tác biết việc này từ ngày nào"* khi hàng trễ.
 */
export function canDecideAssignment(
  actor: Actor,
  assignment: Pick<AssignmentCore, 'partner_id' | 'status' | 'deleted_at'>,
): PermissionVerdict {
  if (assignment.deleted_at) return deny('assignment_err_deleted');
  if (!isOwningPartner(actor, assignment)) return deny('assignment_err_not_yours');
  if (PARTNER_ACCESS_BY_STATUS[assignment.status]?.write !== 'DECIDE_ONLY') {
    return deny('assignment_err_decide_status');
  }
  return OK;
}

// ── QUẢN TRỊ ASSIGNMENT ─────────────────────────────────────────────────────

/**
 * Lập, sửa, giao, tạm dừng, nghiệm thu, huỷ — **chỉ Monica**.
 *
 * Đối tác không bao giờ chạm vào thứ xác định QUYỀN và TIỀN. Đó là cả thiết kế:
 * nếu đối tác sửa được `planned_finish` thì họ tự gia hạn quyền ghi của mình;
 * nếu sửa được `scope_level` thì họ tự nới phạm vi.
 */
export function canManageAssignment(actor: Actor): PermissionVerdict {
  return actor.kind === 'INTERNAL' ? OK : deny('assignment_err_internal_only');
}

// ── ĐIỀU KHOẢN THƯƠNG MẠI ───────────────────────────────────────────────────

/**
 * Đối tác **được** xem đơn giá của chính mình — Quyết định Kiến trúc 31/07.
 *
 * Đây không phải nhân nhượng mà là điều kiện để đối soát: người làm phải biết
 * mình được trả bao nhiêu cho mỗi đơn vị, nếu không thì mọi tranh chấp thanh
 * toán đều thành lời nói suông.
 *
 * ⚠️ Ranh giới nằm ở chữ **CỦA CHÍNH MÌNH**. Điều XXX cấm tuyệt đối đối tác
 * thấy: giá bán cho khách, giá thành nội bộ, điều khoản của đối tác khác, sổ
 * sách tài chính. Hàm này chỉ mở đúng một dòng `assignment_commercial_terms`
 * gắn với Assignment của họ — nó KHÔNG mở `financial_records`, và cũng không
 * phải là chỗ để mở.
 */
export function canReadCommercialTerms(
  actor: Actor,
  assignment: Pick<AssignmentCore, 'partner_id' | 'status' | 'deleted_at'>,
): PermissionVerdict {
  if (actor.kind === 'INTERNAL') return OK;
  // Cùng điều kiện với đọc Assignment: chưa giao thì chưa thấy giá.
  return canReadAssignment(actor, assignment);
}

// ── SỔ CÁI ──────────────────────────────────────────────────────────────────

/**
 * Sửa số liệu ngày ⇒ ghi một bản ĐÍNH CHÍNH, không sửa đè.
 *
 * Điều kiện y hệt ghi mới, vì bản đính chính **là** một dòng ghi mới. Trigger
 * `adr_append_only_trg` của 029 chặn mọi `UPDATE`/`DELETE` với mọi vai trò, nên
 * không có đường nào khác — hàm này chỉ nói trước điều đó cho giao diện, để
 * người dùng thấy nút bị khoá thay vì nhận lỗi sau khi gõ xong.
 */
export function canCorrectDailyReport(
  actor: Actor,
  assignment: Pick<
    AssignmentCore,
    'partner_id' | 'status' | 'planned_start' | 'planned_finish' | 'deleted_at'
  >,
  today: string = vnTodayISO(),
): PermissionVerdict {
  return canWriteOperational(actor, assignment, today);
}
