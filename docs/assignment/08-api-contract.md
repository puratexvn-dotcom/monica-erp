# 08 · API CONTRACT

Mọi chữ ký dưới đây là **TypeScript nghiêm ngặt**, không `any`. Kiểu trả về
theo khuôn đã dùng suốt Phase 2–6: `{ ok: true; data } | { ok: false; message }`.

## 1. Tầng Domain — thuần, không CSDL, không React

`lib/mos/assignment.ts`

```ts
export const ASSIGNMENT_STATUSES = [
  'DRAFT', 'ISSUED', 'ACCEPTED', 'IN_PROGRESS',
  'SUSPENDED', 'COMPLETED', 'CLOSED', 'CANCELLED',
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

/** Chuyển trạng thái có hợp lệ không. Bảng chuyển ở tài liệu 03 mục 6. */
export function canTransition(from: AssignmentStatus, to: AssignmentStatus): boolean;

/** Đối tác GHI được không — trạng thái VÀ thời hạn, cả hai. */
export function canPartnerWrite(
  a: { status: AssignmentStatus; startDate: string | null; endDate: string | null },
  today?: string,          // mặc định vnTodayISO()
): boolean;

/** Đối tác ĐỌC được không — danh sách trạng thái rộng hơn, KHÔNG xét thời hạn. */
export function canPartnerRead(status: AssignmentStatus): boolean;

/** Những ngày trong khoảng hiệu lực CHƯA có báo cáo. */
export function missingReportDays(
  a: { startDate: string; endDate: string; status: AssignmentStatus },
  reported: readonly string[],
  today?: string,
): string[];

/** Vì sao chưa chuyển sang COMPLETED được. Mảng rỗng = chuyển được. */
export function blockersForComplete(
  a: { startDate: string; endDate: string; status: AssignmentStatus },
  reported: readonly string[],
  today?: string,
): Array<{ key: string; values: string[] }>;
```

⚠️ `canPartnerWrite` nhận `today` để **kiểm thử được**. Không có tham số đó thì
mọi bài kiểm về hết hạn phải chờ tới ngày mai. Cùng khuôn `daysUntil()` và
`capaAgeingOf()` của các phase trước.

⚠️ Trả về `{ key, values }` chứ không trả câu chữ — Domain không biết ngôn ngữ.
Giao diện dịch. Cùng khuôn `SummaryLine`.

`lib/mos/partner.ts`

```ts
export const PARTNER_TYPES = [
  'BUYER',                              // Order Owner — KHÔNG có Assignment
  'PRODUCTION_PARTNER', 'SERVICE_PARTNER', 'SUPPLIER',
  'FORWARDER', 'INSPECTION', 'AUDITOR', // sáu loại Đối tác Thực thi
] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

/** Sáu loại đi qua Assignment. Buyer KHÔNG nằm trong đây (Quyết định 4). */
export const EXECUTION_PARTNER_TYPES = PARTNER_TYPES.filter(
  (t) => t !== 'BUYER',
) as readonly Exclude<PartnerType, 'BUYER'>[];

export function isExecutionPartner(t: PartnerType): boolean;

export const RESOURCE_TYPES = [
  'order', 'style', 'line', 'operation', 'bundle', 'cut_ticket',
  'hourly_log', 'daily_report', 'downtime', 'qa_inline', 'aql',
  'capa', 'material', 'consumption', 'shipment', 'document', 'comment',
  'commercial_terms',   // điều khoản thương mại của CHÍNH Assignment mình
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type PartnerAction = 'READ' | 'WRITE';
```

⚠️ Ba danh sách này phải **khớp từng chữ** với `CHECK` trong CSDL. Có bài kiểm
đối chiếu hai bên — cùng khuôn `SHIPMENT_FLOW` (Phase 6) và `DEFECT_POSITIONS`
(Phase 5), cả hai đều đã bắt được lệch thật.

## 2. Tầng Service — phía Monica

`app/(dashboard)/md/assignments/_services/assignment.service.ts` (Quyết định 2)

```ts
export interface AssignmentRow {
  id: string;
  assignmentNo: string;
  partnerId: string;
  partnerName: string;
  partnerType: PartnerType;
  orderId: string;
  poNumber: string | null;
  factoryId: string | null;
  lineId: string | null;
  lineName: string | null;
  operationId: string | null;
  operationName: string | null;
  assignedQty: number | null;
  uom: string | null;
  startDate: string;
  endDate: string;
  status: AssignmentStatus;
  assignedBy: string | null;
  acceptedAt: string | null;
  closedAt: string | null;
  bundleCount: number;
  /** Số ngày thiếu báo cáo tính tới hôm nay. null = chưa tới hạn báo cáo. */
  missingReports: number | null;
}

export type AssignmentResult =
  | { ok: true; data: AssignmentRow[] }
  | { ok: false; message: string };

export async function listAssignments(filter: {
  orderId?: string; partnerId?: string; status?: AssignmentStatus[];
}): Promise<AssignmentResult>;

export async function createAssignment(input: unknown): Promise<ActionResult>;
export async function transitionAssignment(
  id: string, to: AssignmentStatus, reason?: string,
): Promise<ActionResult>;
export async function attachBundles(id: string, bundleIds: string[]): Promise<ActionResult>;
export async function detachBundle(id: string, bundleId: string): Promise<ActionResult>;
```

`input: unknown` rồi `safeParse` bằng Zod — khuôn đã dùng ở `md-actions.ts`.
Server Action là điểm cuối gọi thẳng được, không tin dữ liệu vào.

## 3. Tầng Service — phía đối tác

`app/(dashboard)/_partner-core/partner-portal.service.ts` — DÙNG CHUNG cho cả năm Portal (Quyết định 6)

```ts
export interface MyAssignment {
  id: string; assignmentNo: string;
  poNumber: string | null; styleCode: string | null;
  lineName: string | null; operationName: string | null;
  assignedQty: number | null; uom: string | null;
  /** Điều khoản thương mại của CHÍNH Assignment này. `null` khi Monica chưa
   *  lập, hoặc khi vai trò gọi không được đọc — service phân biệt hai ca bằng
   *  cờ `termsVisible`, KHÔNG trả `null` chung cho cả hai (bài học Phase 5). */
  commercialTerms: { unitPrice: number | null; currency: string | null;
                     contractNo: string | null } | null;
  termsVisible: boolean;
  startDate: string; endDate: string;
  status: AssignmentStatus;
  /** Đối tác GHI được không — service tính, giao diện chỉ đọc cờ. */
  canWrite: boolean;
  /** Ngày thiếu báo cáo, chính đối tác cũng phải thấy. */
  missingDays: string[];
  daysLeft: number | null;
}

export async function getMyAssignments(): Promise<
  { ok: true; data: MyAssignment[] } | { ok: false; message: string }>;

export async function acceptAssignment(id: string): Promise<ActionResult>;
export async function submitDailyReport(input: unknown): Promise<ActionResult>;
export async function markCompleted(id: string): Promise<ActionResult>;
```

⚠️ `getMyAssignments()` **không nhận `partnerId`**. Đối tác lấy từ phiên đăng
nhập, không lấy từ tham số — nếu nhận tham số thì ai cũng truyền được id của
đối tác khác, và hàng rào chỉ còn là RLS. Điều XXX mục 14: cấm truy vấn thẳng
theo `subcon_id` bỏ qua Assignment.

⚠️ `canWrite` và `missingDays` do **service** tính, giao diện chỉ hiển thị.
Bài học Phase 2: hai phép tính từng lọt vào component và phải gỡ ra.

## 4. Hook

```ts
// lib/mos/use-assignments.ts        (Monica)
export function useAssignments(filter, revision?): {
  data: AssignmentRow[] | null;
  loading: boolean; refreshing: boolean;      // TÁCH, không gộp
  error: string | null;
  reload: () => void;
};

// lib/mos/use-my-assignments.ts     (đối tác)
export function useMyAssignments(revision?): { … };
```

`loading` (chưa có gì) tách khỏi `refreshing` (đã có số cũ) — gộp thì mỗi lần
realtime báo đổi, cả màn hình chớp về khung xám. Khuôn của cả năm hook trước.

## 5. Mã lỗi và thông báo

| Mã | Nghĩa | Câu hiển thị |
|---|---|---|
| `42501` | RLS chặn | "Bạn không được giao phần việc này." |
| `23505` trên `assignment_no` | trùng số | "Số phiếu này đã tồn tại." |
| `23505` trên `assignment_bundles` | bó đã thuộc Assignment khác | "Bó {0} đang thuộc phần việc {1}." |
| `23514` `assignments_status_valid` | trạng thái lạ | "Trạng thái không hợp lệ." |
| `ASG_BAD_TRANSITION` | chuyển sai luồng | "Không chuyển được từ {0} sang {1}." |
| `ASG_REPORT_MISSING` | còn ngày thiếu báo cáo | "Còn {0} ngày chưa báo cáo, chưa thể báo hoàn thành." |
| `ASG_EXPIRED` | ngoài khoảng hiệu lực | "Phần việc đã hết hạn ngày {0}." |

Bốn mã cuối do tầng ứng dụng sinh; ba mã đầu do PostgreSQL. Cả bảy đều đi qua
i18n — Điều XXI. Không câu nào viết cứng trong component.

## 6. Realtime

Thêm vào `WATCHED` của `lib/mos/use-po-realtime.ts`:

```ts
{ table: 'assignments',              key: 'order_id' },
{ table: 'assignment_daily_reports', key: '???' },   // ⚠️ xem dưới
```

⚠️ `assignment_daily_reports` **không có `order_id`**. Lọc sai cột thì kênh im
lặng hoàn toàn — không lỗi, không sự kiện, nhìn y hệt "chưa ai sửa gì". Đây
đúng cái bẫy đã mắc với `communications` và `md_documents` ở Phase 1, và đã
tránh được với `shipment_cartons` ở Phase 6.

Cách xử lý: **không** đưa `assignment_daily_reports` vào kênh theo PO. Cổng đối
tác dùng kênh riêng lọc theo `assignment_id`. Một báo cáo ngày luôn kèm một lần
sửa `assignments.status`, nên kênh theo PO vẫn nhận được tín hiệu.

## 7. Điều API này CỐ Ý không có

**Không có `deleteAssignment()`.** Chỉ có `transitionAssignment(id, 'CANCELLED')`.
Bất biến I-6.

**Không có `setPartnerPermission()`.** Ma trận là dữ liệu cấu hình, sửa bằng
migration hoặc màn hình quản trị — không phải bằng API nghiệp vụ.

**Không có `assignPermissionToUser()`.** Quyền không gán cho người, quyền suy
từ Assignment. Có hàm này nghĩa là đã bỏ toàn bộ mô hình.
