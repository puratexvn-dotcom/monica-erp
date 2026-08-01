// ============================================================================
// ASSIGNMENT — DOMAIN THUẦN
//
// Tệp này là TỪ VỰNG và HÌNH DẠNG của Assignment. Không hơn.
//
// ─── BỐN THỨ TỆP NÀY KHÔNG ĐƯỢC CHỨA ────────────────────────────────────
//   ✗ React · Next.js · Supabase          → Domain thuần, chạy được bằng Node
//   ✗ Phép tính nghiệp vụ                 → calculators/   (Yêu cầu 7)
//   ✗ Phán quyết "được phép hay không"    → policies/
//   ✗ Phán quyết "ai được làm"            → permission/
//
// Ranh giới đó không phải để cho đẹp. Nó là điều kiện để `SCOPE_SHAPE` và
// `ALLOWED_TRANSITIONS` dưới đây có **đúng một** bản cài đặt: giao diện,
// service và bài kiểm đều nhập khẩu từ đây, nên không tồn tại phiên bản thứ hai
// để lệch.
//
// ⚠️ MỌI HẰNG SỐ TRONG TỆP NÀY PHẢI KHỚP TỪNG CHỮ với ràng buộc CHECK của
// `supabase/migrations/029_assignment_domain.sql`. Lệch một giá trị thì giao
// diện cho người dùng chọn một thứ mà cơ sở dữ liệu từ chối ghi — và lỗi hiện
// ra lúc bấm Lưu, sau khi đã gõ xong cả biểu mẫu. Có bài kiểm đối chiếu hai
// bên: `scratchpad/verify-assignment-domain.mjs`.
// ============================================================================

// ── TRẠNG THÁI ──────────────────────────────────────────────────────────────
//
// Khớp `assignments_status_valid` (029 Mục 3).
//
// KHÔNG dựng mảng `ASSIGNMENT_FLOW` kiểu `SHIPMENT_FLOW` của Phase 6: dòng chảy
// lô hàng là một ĐƯỜNG THẲNG nên chỉ số mảng vẽ được thanh tiến trình. Vòng đời
// Assignment có nhánh (`REJECTED → ISSUED`) và vòng lặp (`COMPLETED →
// IN_PROGRESS` khi nghiệm thu không đạt) — ép nó thành một mảng có thứ tự sẽ
// sinh ra một chỉ số vô nghĩa mà ai đó sẽ đem đi so sánh.
export const ASSIGNMENT_STATUSES = [
  'DRAFT',
  'ISSUED',
  'ACCEPTED',
  'REJECTED',
  'IN_PROGRESS',
  'SUSPENDED',
  'COMPLETED',
  'CLOSED',
  'CANCELLED',
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export function isAssignmentStatus(v: string | null | undefined): v is AssignmentStatus {
  return typeof v === 'string' && (ASSIGNMENT_STATUSES as readonly string[]).includes(v);
}

/**
 * Trạng thái cuối — không có lối ra.
 *
 * Muốn làm tiếp thì lập Assignment mới; lịch sử cũ giữ nguyên. Trigger `I-9`
 * của 029 cũng chặn ghi con vào ba trạng thái này, nên giao diện và cơ sở dữ
 * liệu nói cùng một câu.
 */
export const TERMINAL_STATUSES: readonly AssignmentStatus[] = ['CLOSED', 'CANCELLED'];

export function isTerminal(status: AssignmentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

// ── ĐỒ THỊ CHUYỂN TRẠNG THÁI ────────────────────────────────────────────────
//
// Đây là DỮ LIỆU, không phải phán quyết. Câu hỏi *"có được chuyển không"* cần
// biết thêm người thực hiện là ai và các trường bắt buộc đã đủ chưa — việc đó
// thuộc `policies/assignment-transition.policy.ts`.
//
// Tách như vậy để đồ thị này vẽ được sơ đồ trạng thái trên giao diện quản trị
// mà không kéo theo cả bộ luật phân quyền.
export const ALLOWED_TRANSITIONS: Readonly<Record<AssignmentStatus, readonly AssignmentStatus[]>> = {
  DRAFT: ['ISSUED', 'CANCELLED'],
  ISSUED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'SUSPENDED', 'CANCELLED'],
  // Từ chối vì giá, vì thời hạn, vì hết công suất — Monica sửa điều khoản rồi
  // giao lại. Hai lần giao nằm nguyên trong Timeline.
  REJECTED: ['ISSUED', 'CANCELLED'],
  IN_PROGRESS: ['SUSPENDED', 'COMPLETED', 'CANCELLED'],
  SUSPENDED: ['IN_PROGRESS', 'CANCELLED'],
  // Mở lại khi nghiệm thu không đạt. Người làm không tự nghiệm thu chính mình.
  COMPLETED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
  CANCELLED: [],
};

/** Đích đến hợp lệ, thuần đồ thị. Chưa xét người thực hiện, chưa xét trường bắt buộc. */
export function nextStatuses(from: AssignmentStatus): readonly AssignmentStatus[] {
  return ALLOWED_TRANSITIONS[from];
}

// ── PHẠM VI ─────────────────────────────────────────────────────────────────
//
// Khớp `assignments_scope_level_valid` và `assignments_scope_shape` (029 Mục 3).
//
// Thứ tự mảng LÀ thứ tự từ rộng tới hẹp, và `SCOPE_SHAPE` dưới đây phụ thuộc
// vào thứ tự đó.
export const SCOPE_LEVELS = ['ORDER', 'SITE', 'LINE', 'STYLE_OPERATION'] as const;

export type ScopeLevel = (typeof SCOPE_LEVELS)[number];

export function isScopeLevel(v: string | null | undefined): v is ScopeLevel {
  return typeof v === 'string' && (SCOPE_LEVELS as readonly string[]).includes(v);
}

/** Ba cột định vị phạm vi, xếp từ rộng tới hẹp. */
export const SCOPE_FIELDS = ['site_id', 'line_id', 'style_operation_id'] as const;

export type ScopeField = (typeof SCOPE_FIELDS)[number];

/**
 * Mỗi cấp phạm vi đòi ĐÚNG những cột nào.
 *
 * ⚠️ NULL KHÔNG BAO GIỜ NGHĨA LÀ "TẤT CẢ". Phạm vi rộng được **tuyên bố** bằng
 * `scope_level = 'ORDER'`, không suy ra từ cột trống. Đây là bản sao phía
 * TypeScript của ràng buộc `assignments_scope_shape` — mục đích là báo lỗi ngay
 * trên biểu mẫu thay vì để cơ sở dữ liệu ném `23514` sau khi bấm Lưu.
 *
 * Cột nào không có tên trong danh sách của cấp đó thì **bắt buộc phải trống**.
 * Quên chọn chuyền ở cấp `LINE` bị từ chối — chứ không âm thầm nới quyền thành
 * "mọi chuyền".
 */
export const SCOPE_SHAPE: Readonly<Record<ScopeLevel, readonly ScopeField[]>> = {
  ORDER: [],
  SITE: ['site_id'],
  LINE: ['site_id', 'line_id'],
  STYLE_OPERATION: ['site_id', 'line_id', 'style_operation_id'],
};

// ── ĐỘ ƯU TIÊN ──────────────────────────────────────────────────────────────
//
// Khớp `assignments_priority_valid`. Thứ tự mảng là thứ tự tăng dần độ gấp.
export const ASSIGNMENT_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

export type AssignmentPriority = (typeof ASSIGNMENT_PRIORITIES)[number];

export function isAssignmentPriority(v: string | null | undefined): v is AssignmentPriority {
  return typeof v === 'string' && (ASSIGNMENT_PRIORITIES as readonly string[]).includes(v);
}

// ── ĐIỀU KHOẢN THƯƠNG MẠI ───────────────────────────────────────────────────
//
// Giá có HAI LỚP, và hai lớp đó thay đổi với nhịp khác nhau:
//
//   Lớp 1 · quan hệ thương mại  →  bảng `contract_types`, MASTER DATA
//           nhà máy thêm bớt theo thực tế kinh doanh, nên KHÔNG có hằng số ở
//           đây. Khởi tạo 0 dòng vì không đo được bằng chứng nào (ADR-002).
//
//   Lớp 2 · cách tính một đồng  →  hằng số dưới đây
//           hữu hạn và ổn định, nên là `CHECK` chứ không phải bảng (Điều
//           XXVIII.2).
export const RATE_METHODS = [
  'PER_UNIT',
  'PER_OPERATION',
  'PER_SAM_MINUTE',
  'PER_KG',
  'LUMP_SUM',
] as const;

export type RateMethod = (typeof RATE_METHODS)[number];

export function isRateMethod(v: string | null | undefined): v is RateMethod {
  return typeof v === 'string' && (RATE_METHODS as readonly string[]).includes(v);
}

export const ASSIGNMENT_CURRENCIES = ['VND', 'USD', 'EUR', 'CNY', 'JPY', 'KRW'] as const;

export type AssignmentCurrency = (typeof ASSIGNMENT_CURRENCIES)[number];

export function isAssignmentCurrency(v: string | null | undefined): v is AssignmentCurrency {
  return typeof v === 'string' && (ASSIGNMENT_CURRENCIES as readonly string[]).includes(v);
}

/**
 * `rate_method` tuyên bố cột nào có hiệu lực — cùng khuôn `scope_level`.
 *
 * Bản sao phía TypeScript của `act_rate_shape` (029 Mục 5). NULL ở đây **không**
 * dùng để đoán phương thức: `rate` trống nghĩa là THIẾU DỮ LIỆU.
 */
export function rateFieldFor(method: RateMethod): 'rate' | 'lump_sum' {
  return method === 'LUMP_SUM' ? 'lump_sum' : 'rate';
}

// ── LÝ DO PHẢI LÀ LÝ DO ─────────────────────────────────────────────────────

/**
 * Ngưỡng tối thiểu cho mọi trường lý do.
 *
 * Lặp đúng khuôn `capa_logs.root_cause` của migration 023, và khớp bốn ràng
 * buộc `assignments_*_needs_reason` của 029. Một chữ "ok" hay "x" không phải là
 * lý do — sáu tháng sau không ai giải thích được vì sao phần việc đó bị huỷ.
 */
export const MIN_REASON_LENGTH = 10;

/** Bốn trạng thái đòi lý do, và tên cột chứa lý do đó. Khớp 029 Mục 3. */
export const REASON_FIELD: Readonly<Partial<Record<AssignmentStatus, string>>> = {
  REJECTED: 'reject_reason',
  SUSPENDED: 'suspend_reason',
  CLOSED: 'close_reason',
  CANCELLED: 'cancel_reason',
};

/** Kiểm bề mặt: có đủ dài sau khi cắt khoảng trắng không. Không phán quyết gì thêm. */
export function isValidReason(v: string | null | undefined): boolean {
  return typeof v === 'string' && v.trim().length >= MIN_REASON_LENGTH;
}

// ── QUYỀN ĐỌC / GHI THEO TRẠNG THÁI ─────────────────────────────────────────
//
// Bảng này trả lời câu hỏi 4 của Điều XXX, và là DỮ LIỆU chứ không phải phán
// quyết: nó nói *"ở trạng thái này, đối tác về nguyên tắc đọc/ghi được gì"*.
// Phán quyết đầy đủ còn cần cửa sổ thời gian và danh tính — thuộc `permission/`.
//
// ⚠️ Ở `ISSUED`, đối tác ghi được ĐÚNG HAI THỨ: chuyển sang `ACCEPTED` hoặc
// `REJECTED`. Không sản lượng, không báo cáo, không tài liệu. Đó là lý do cột
// `write` có ba giá trị chứ không phải hai.
export type PartnerWriteScope = 'NONE' | 'DECIDE_ONLY' | 'OPERATIONAL';

export interface PartnerStatusAccess {
  /** Đối tác có thấy Assignment này trong cổng của họ không. */
  read: boolean;
  write: PartnerWriteScope;
}

export const PARTNER_ACCESS_BY_STATUS: Readonly<Record<AssignmentStatus, PartnerStatusAccess>> = {
  // Chưa giao thì chưa tồn tại với họ.
  DRAFT: { read: false, write: 'NONE' },
  ISSUED: { read: true, write: 'DECIDE_ONLY' },
  ACCEPTED: { read: true, write: 'OPERATIONAL' },
  // Thấy lý do chính mình đã ghi.
  REJECTED: { read: true, write: 'NONE' },
  IN_PROGRESS: { read: true, write: 'OPERATIONAL' },
  // Đọc để biết vì sao dừng, nhưng không ghi được — dừng là quyết định của Monica.
  SUSPENDED: { read: true, write: 'NONE' },
  // Đã báo xong thì không sửa số. Muốn sửa thì Monica mở lại về IN_PROGRESS.
  COMPLETED: { read: true, write: 'NONE' },
  CLOSED: { read: true, write: 'NONE' },
  // Biến mất khỏi cổng đối tác.
  CANCELLED: { read: false, write: 'NONE' },
};

/**
 * Hai trạng thái duy nhất cho phép ghi dữ liệu vận hành.
 *
 * Đây MỚI CHỈ là một trong ba điều kiện. Đủ bộ ba nằm ở
 * `permission/assignment-permission.ts`:
 *
 *   trạng thái ∈ {ACCEPTED, IN_PROGRESS}  ∧  hôm nay trong cửa sổ kế hoạch
 *                                         ∧  chưa xoá mềm
 */
export const OPERATIONAL_WRITE_STATUSES: readonly AssignmentStatus[] = ['ACCEPTED', 'IN_PROGRESS'];

// ── HÌNH DẠNG BẢN GHI ───────────────────────────────────────────────────────
//
// Chỉ những cột mà tầng Domain thật sự cần để suy luận. KHÔNG chép nguyên si
// 30 cột của bảng: một `interface` phình theo lược đồ sẽ buộc mọi bài kiểm phải
// dựng đủ 30 trường chỉ để thử một luật, và rồi bài kiểm sẽ dùng `as any` để
// đi tắt — thứ Điều XXV cấm.
export interface AssignmentCore {
  id: string;
  assignment_no: string;
  partner_id: string;
  order_id: string;

  scope_level: ScopeLevel;
  site_id: string | null;
  line_id: string | null;
  style_operation_id: string | null;

  status: AssignmentStatus;
  priority: AssignmentPriority;

  /**
   * ⚠️ CỐ Ý cho phép null — khớp 029, nơi hai cột này là nullable.
   *
   * Lúc soạn `DRAFT` chưa biết ngày. Ép bắt buộc ở đây sẽ đẩy người dùng điền
   * ngày giả để đi tiếp, đúng lỗi `etd_date DEFAULT CURRENT_DATE` của 024.
   * Điều kiện "đủ hai ngày mới được `→ ISSUED`" nằm ở `policies/`.
   */
  planned_start: string | null;
  planned_finish: string | null;
  actual_start: string | null;
  actual_finish: string | null;

  owner_user_id: string | null;
  deleted_at: string | null;
}

/** Một dòng của sổ cái báo cáo ngày. */
export interface DailyReportCore {
  id: string;
  assignment_id: string;
  report_date: string;
  /** null = bản GỐC của ngày đó · có giá trị = bản ĐÍNH CHÍNH của bản cha. */
  parent_report_id: string | null;
  target_qty: number | null;
  output_qty: number | null;
  defect_qty: number | null;
}

// ── SỔ CÁI: BẢN NÀO ĐANG HIỆU LỰC ───────────────────────────────────────────

/**
 * Lọc ra những bản báo cáo ĐANG HIỆU LỰC: bản **không có con**.
 *
 * ⚠️ Đây là mảnh logic dễ quên nhất của toàn bộ thiết kế sổ cái, và quên nó thì
 * **một ngày đã đính chính bị đếm hai lần** — sản lượng thanh toán sai mà không
 * có lỗi nào nổ ra. View `v_assignment_report_status` làm đúng việc này bằng
 * `NOT EXISTS`; hàm dưới đây là bản đối ứng cho dữ liệu đã nằm trong bộ nhớ.
 *
 * Chuỗi đính chính luôn TUYẾN TÍNH — chỉ mục `uq_adr_linear_chain` của 029 chặn
 * hai bản cùng trỏ về một cha, nên "bản không có con" luôn là duy nhất cho mỗi
 * ngày.
 */
export function currentReports<T extends { id: string; parent_report_id: string | null }>(
  reports: readonly T[],
): T[] {
  const superseded = new Set<string>();
  for (const r of reports) {
    if (r.parent_report_id) superseded.add(r.parent_report_id);
  }
  return reports.filter((r) => !superseded.has(r.id));
}

// ── BUSINESS NUMBER ─────────────────────────────────────────────────────────
//
// Khuôn: ASG-<địa điểm>-<năm>-<số thứ tự 5 chữ số>
//        ASG-GEN-2026-00001    chưa gắn địa điểm
//        ASG-CC01-2026-00042   địa điểm Củ Chi 01
//
// ⚠️ Ở đây CHỈ ĐỌC, không sinh. Số được sinh bởi `next_assignment_no()` trong
// cơ sở dữ liệu (029 Mục 2) vì `nextval` là thứ duy nhất bảo đảm hai người bấm
// "Giao việc" cùng lúc không nhận cùng một số. Viết một hàm sinh ở TypeScript
// là dựng nguồn sự thật thứ hai, và nó sẽ sinh trùng.

export interface AssignmentNoParts {
  siteCode: string;
  year: number;
  sequence: number;
}

const ASSIGNMENT_NO_RE = /^ASG-([A-Z0-9]+)-(\d{4})-(\d{5,})$/;

/** Tách Business Number để lọc và sắp xếp. Trả null nếu không đúng khuôn. */
export function parseAssignmentNo(no: string | null | undefined): AssignmentNoParts | null {
  if (typeof no !== 'string') return null;
  const m = ASSIGNMENT_NO_RE.exec(no.trim().toUpperCase());
  if (!m) return null;
  return { siteCode: m[1], year: Number(m[2]), sequence: Number(m[3]) };
}
