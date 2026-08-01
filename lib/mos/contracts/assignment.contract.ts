import type {
  AssignmentPriority,
  AssignmentStatus,
  ScopeLevel,
} from '../domain/assignment';
import type { AssignmentProgress } from '../calculators/assignment-progress.calculator';
import type { TranslatedText } from '../value-objects/translated-text';
import type { ReportStatus, ReportStatusResult } from '../calculators/report-status.calculator';

// ============================================================================
// ASSIGNMENT — SERVICE CONTRACT (DTO)
//
// ─── ĐÂY LÀ RANH GIỚI ────────────────────────────────────────────────────
// Hook và Component chỉ được nhìn thấy những kiểu trong tệp này. Chúng KHÔNG
// bao giờ chạm vào hình dạng dòng cơ sở dữ liệu.
//
// Vì sao ranh giới đó đáng có:
//
//   ① ĐỔI CỘT KHÔNG ĐƯỢC GÃY MÀN HÌNH. Đổi `assigned_qty` thành
//      `planned_qty` ở lược đồ chỉ được sửa MỘT chỗ ánh xạ trong service, chứ
//      không phải bảy tệp giao diện.
//
//   ② TÊN CỘT KHÔNG PHẢI NGÔN NGỮ NGHIỆP VỤ. `parent_report_id` là cơ chế sổ
//      cái; thứ màn hình cần biết là *"phiếu này có phải bản đính chính
//      không"*. DTO dịch cơ chế thành ý nghĩa.
//
//   ③ RÒ RỈ CỘT LÀ RÒ RỈ DỮ LIỆU. Trả nguyên dòng nghĩa là mọi cột đều lên
//      trình duyệt, kể cả cột mà vai trò đó không được thấy. Một DTO tường minh
//      buộc phải NGHĨ về từng trường được ra ngoài.
//
// ⚠️ MỌI TRƯỜNG Ở ĐÂY LÀ camelCase. Không một `snake_case` nào được lọt qua —
// có bài kiểm hợp đồng quét đúng điều đó. Thấy `report_date` trong tệp này
// nghĩa là một dòng cơ sở dữ liệu đã lọt ra ngoài mà không ai dịch.
//
// ⚠️ MỌI SỐ ĐỀU `number | null` — Điều XX: 0 là 0, không đọc được là "—".
// Một phần việc sản lượng 0 khác hẳn một phần việc chưa ai báo cáo.
// ============================================================================

// ── PHONG BÌ ────────────────────────────────────────────────────────────────
//
// Ba hình dạng trả về, dùng chung cho mọi service của phân hệ. Đồng nhất ở đây
// để hook không phải phân nhánh theo từng lời gọi.
//
// ⚠️ `error` là KHOÁ i18n hoặc câu đã dịch sẵn từ `friendlyDbError`, KHÔNG bao
// giờ là thông điệp Postgres thô. Component chỉ hiển thị, không đoán.

export interface ListResult<T> {
  rows: T[];
  error: string | null;
}

export interface ItemResult<T> {
  data: T | null;
  error: string | null;
}

export interface MutationResult {
  ok: boolean;
  id: string | null;
  error: string | null;
}

// ── PHẦN VIỆC · TÓM TẮT ─────────────────────────────────────────────────────

export interface AssignmentSummaryDTO {
  id: string;
  /** Số nghiệp vụ đọc được: `ASG-CC01-2026-00042`. Đây là thứ người ta gọi qua điện thoại. */
  assignmentNo: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  scopeLevel: ScopeLevel;

  partnerId: string;
  partnerCode: string | null;
  partnerName: string | null;

  orderId: string;
  poNumber: string | null;
  styleCode: string | null;
  customerName: string | null;

  /** Đã ghép sẵn `"12 · Tra cổ"`. Màn hình không phải nối chuỗi. */
  siteName: string | null;
  lineName: string | null;
  operationName: string | null;

  assignedQty: number | null;
  uom: string | null;
  ownerName: string | null;

  plannedStart: string | null;
  plannedFinish: string | null;
  actualStart: string | null;
  actualFinish: string | null;
}

// ── BÁO CÁO NGÀY ────────────────────────────────────────────────────────────

/**
 * Một phiếu báo cáo ngày, đã dịch khỏi cơ chế sổ cái.
 *
 * ⚠️ KHÔNG có `parentReportId` trần. Màn hình cần biết *"đây có phải bản đính
 * chính không"* và *"nó sửa phiếu nào"* — hai câu hỏi nghiệp vụ. Còn `NOT EXISTS
 * (... parent_report_id = r.id)` là cơ chế, và cơ chế ở lại trong service.
 */
export interface DailyReportDTO {
  id: string;
  reportDate: string;

  /** true = bản đính chính. false = bản gốc của ngày đó. */
  isCorrection: boolean;
  /** Phiếu bị bản này thay thế. `null` khi là bản gốc. */
  correctsReportId: string | null;
  correctionReason: string | null;
  /** false = đã có bản đính chính mới hơn thay thế phiếu này. */
  isCurrent: boolean;

  targetQty: number | null;
  outputQty: number | null;
  defectQty: number | null;
  reworkQty: number | null;
  downtimeMinutes: number | null;

  issueNote: string | null;
  supportRequest: string | null;
  submittedAt: string;
}

/** Trạng thái báo cáo của MỘT ngày. */
export interface ReportDayDTO {
  date: string;
  status: ReportStatus;
}

// ── GIÁ TRỊ TÍNH ĐƯỢC ───────────────────────────────────────────────────────
//
// ⚠️ CỐ Ý dùng lại kiểu đầu ra của `calculators/` thay vì khai một `interface`
// song song y hệt.
//
// Hai kiểu giống nhau từng chữ sẽ LỆCH NHAU — thêm một trường vào calculator mà
// quên thêm vào DTO thì trình biên dịch im lặng, và màn hình mất một con số mà
// không ai biết. Một lớp ánh xạ đồng nhất `x => x` cũng không mua được gì.
//
// Ranh giới vẫn được tôn trọng: đây là **giá trị tính được**, không phải dòng
// cơ sở dữ liệu. Thứ bị cấm rò rỉ là hình dạng lược đồ, không phải kết quả của
// một hàm thuần.

export type ProgressDTO = AssignmentProgress;
export type ReportingDTO = ReportStatusResult;

// ── PHẦN VIỆC · CHI TIẾT ────────────────────────────────────────────────────

export interface AssignmentDetailDTO extends AssignmentSummaryDTO {
  progress: ProgressDTO;
  reporting: ReportingDTO;
  /** Toàn bộ sổ cái, kể cả bản đã bị thay thế — lịch sử là một phần của sự thật. */
  reports: DailyReportDTO[];
  /**
   * Đích đến mà NGƯỜI ĐANG ĐĂNG NHẬP được phép chọn, đã lọc qua policy.
   *
   * ⚠️ Màn hình dựng nút từ mảng này, KHÔNG tự suy từ `status`. Suy ở giao diện
   * là dựng bản cài đặt thứ hai của luật chuyển trạng thái, và nó sẽ lệch.
   */
  allowedTransitions: AssignmentStatus[];
}

// ── ĐỐI TÁC · DANH MỤC ──────────────────────────────────────────────────────

export interface PartnerOptionDTO {
  id: string;
  partnerCode: string | null;
  name: string | null;
  partnerType: string | null;
  country: string | null;
}

export interface ContractTypeDTO {
  code: string;
  /**
   * **Cả bản đồ dịch**, không phải một chuỗi đã chốt sẵn.
   *
   * ⚠️ Hiến pháp Điều IX: *"Frontend chịu trách nhiệm dịch thuật."* Máy chủ
   * KHÔNG biết người dùng đang xem tiếng gì — `Language` là trạng thái của
   * trình duyệt. Chốt sẵn một chuỗi ở service nghĩa là mọi phiên đều nhận cùng
   * một tiếng, bất kể họ chọn gì.
   *
   * Tầng vẽ gọi `pickTranslation(name, lang, code)`. Hàm đó **không bao giờ**
   * trả chuỗi rỗng — cùng lắm là chính `code`.
   */
  name: TranslatedText;
}

// ── THIẾU BÁO CÁO ───────────────────────────────────────────────────────────

export interface OverdueSummaryDTO {
  assignmentId: string;
  assignmentNo: string;
  partnerId: string;
  orderId: string;
  overdueCount: number;
  /** Ngày trễ xa nhất — thứ cần giục trước. */
  oldestMissing: string | null;
}

export interface OverdueListDTO {
  rows: OverdueSummaryDTO[];
  /** Tổng số ngày trễ trên toàn bộ phần việc đang mở. */
  totalOverdue: number;
  error: string | null;
}

// ── DỮ LIỆU NỀN CHO Ô CHỌN PHẠM VI ──────────────────────────────────────────

export interface OrderOptionDTO {
  id: string;
  poNumber: string | null;
  styleCode: string | null;
  customerName: string | null;
  deliveryDate: string | null;
}

export interface SiteOptionDTO {
  id: string;
  siteCode: string | null;
  name: string | null;
}

export interface LineOptionDTO {
  id: string;
  lineCode: string | null;
  lineName: string | null;
  /** Luôn có giá trị — chuyền chưa gắn địa điểm đã bị service lọc bỏ. */
  siteId: string;
}

export interface ScopeOptionsDTO {
  orders: OrderOptionDTO[];
  sites: SiteOptionDTO[];
  /** CHỈ chuyền đã gắn địa điểm — chuyền chưa gắn không dùng được cho cấp LINE. */
  lines: LineOptionDTO[];
  /**
   * Số thô để `policies/scope-availability.policy.ts` phán quyết cấp nào dùng
   * được.
   *
   * ⚠️ Service trả SỐ, không trả phán quyết. Đặt kết luận vào đây thì luật nằm
   * ở tầng không kiểm thử được bằng Node, và sớm muộn có bản thứ hai ở giao diện.
   */
  inventory: {
    siteCount: number;
    linesWithSiteCount: number;
  };
}

// ── ĐẦU VÀO ─────────────────────────────────────────────────────────────────
//
// ⚠️ Đầu vào cũng là một phần hợp đồng. Nếu hook tự dựng một object tuỳ ý rồi
// đẩy thẳng vào service thì không ai biết trường nào là bắt buộc cho tới lúc
// cơ sở dữ liệu từ chối.

export interface AssignmentFilterDTO {
  orderId?: string;
  partnerId?: string;
  status?: AssignmentStatus[];
  /** Mặc định ẩn phần việc đã chốt sổ và đã huỷ. */
  includeTerminal?: boolean;
}

export interface OverdueFilterDTO {
  orderId?: string;
  partnerId?: string;
}

export interface CreateAssignmentDTO {
  /**
   * **Business Mutation ID** — khoá chống lập chứng từ hai lần.
   *
   * ⚠️ BẮT BUỘC, không tuỳ chọn. Để tuỳ chọn thì một biểu mẫu quên truyền vẫn
   * biên dịch sạch, và mất bảo vệ trong im lặng.
   *
   * Sinh bằng `crypto.randomUUID()` lúc **MỞ BIỂU MẪU**, giữ nguyên qua mọi lần
   * gửi lại, chỉ sinh mới sau khi lập thành công.
   *
   * ⚠️ KHÔNG phải HTTP Request ID · Trace ID · Correlation ID — ba thứ đó ĐỔI
   * mỗi lượt gọi. Phép thử: *bấm Gửi hai lần thì hai lần đó phải cùng giá trị.*
   * Chi tiết: ADR-003 Mục 2.4.
   */
  requestId: string;

  partnerId: string;
  orderId: string;
  scopeLevel: string;
  siteId?: string | null;
  lineId?: string | null;
  styleOperationId?: string | null;
  assignedQty?: number | null;
  uom?: string | null;
  ownerUserId?: string | null;
  priority?: string | null;
  plannedStart?: string | null;
  plannedFinish?: string | null;
}

export interface TransitionAssignmentDTO {
  assignmentId: string;
  to: string;
  /** Bắt buộc ≥ 10 ký tự với REJECTED · SUSPENDED · CLOSED · CANCELLED. */
  reason?: string | null;
}
