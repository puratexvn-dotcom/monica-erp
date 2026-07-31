# 01 · ASSIGNMENT DOMAIN MODEL

> ⚠️ **MỘT PHẦN TÀI LIỆU NÀY ĐÃ BỊ THAY THẾ** bởi
> [ADR-001](ADR-001-site-and-operation.md) (01/08/2026):
> `factories` → **`production_sites`** · **KHÔNG** tạo bảng `operations`
> (dùng `style_operations` đã có) · **NULL không bao giờ nghĩa là "tất cả"** —
> phạm vi tuyên bố tường minh bằng `scope_level`.


> **Bản 3** — sửa theo Quyết định Kiến trúc (tinh chỉnh) ngày 31/07/2026.
> Thay đổi so với bản 2: **giá RỜI khỏi `assignments`**, sang bảng
> `assignment_commercial_terms` · bất biến I-8 bảo vệ ở **ba tầng** · trigger
> chỉ giữ bất biến dữ liệu, không chứa quy trình nghiệp vụ.

## 1. Assignment là gì

> **Một phần việc THỰC THI mà Monica giao cho một Đối tác Thực thi, trong một
> phạm vi xác định, trong một khoảng thời gian xác định.**

Assignment là Core Domain của **Manufacturing Execution** — không phải của
Customer Management.

⚠️ Câu định nghĩa **cố ý không có chữ "giá"**. Assignment là miền **vận hành**.
Điều khoản thương mại nằm ở một bảng riêng và Assignment chỉ *tham chiếu tới*
khi cần — xem mục 3.4.

### Không phải là gì

| Assignment KHÔNG phải | Vì sao |
|---|---|
| một dòng `subcon_orders` | đó là **chứng từ**; chứng từ sinh ra TỪ Assignment |
| một vai trò | vai trò nói *anh là ai*; Assignment nói *anh được giao gì* |
| đường vào của Buyer | Buyer **sở hữu** đơn hàng, không được "giao việc" — mục 7 |
| tài sản của một Portal | năm Portal dùng chung một Business Domain (Quyết định 6) |

## 2. Ngôn ngữ chung

| Thuật ngữ | Định nghĩa |
|---|---|
| **Partner** | Pháp nhân bên ngoài Monica |
| **Execution Partner** | Đối tác **thực thi** — loại duy nhất có Assignment |
| **Order Owner** | Buyer. Sở hữu đơn hàng, không có Assignment |
| **Partner Account** | Tài khoản đăng nhập thuộc về một Partner |
| **Assignment** | Phần việc thực thi được giao |
| **Scope** | Ranh giới tài nguyên: PO · xưởng · chuyền · công đoạn · bó |
| **Grant** | Bộ quyền suy ra từ Assignment |
| **Daily Report** | Báo cáo ngày bắt buộc của một Assignment |

### Sáu loại Đối tác Thực thi (Quyết định 4)

```
PRODUCTION_PARTNER   xưởng gia công trọn gói   ← subcons (SC1/SC2/SC3)
SERVICE_PARTNER      in · thêu · giặt          ← subcontractors
SUPPLIER             nhà cung cấp vật tư       ← suppliers
FORWARDER            hãng vận tải / giao nhận   (chưa có bảng)
INSPECTION           công ty giám định độc lập  (chưa có bảng)
AUDITOR              kiểm toán tuân thủ         (chưa có bảng)
```

Và một loại **không** có Assignment:

```
BUYER                Order Owner  ← customers
```

## 3. Thực thể

### 3.1 `assignments`

```
id                 UUID
assignment_no      VARCHAR UNIQUE     khoá nghiệp vụ  (ASG-2026-0042)

partner_id         UUID → partners(id)     BẮT BUỘC
order_id           UUID → orders(id)       BẮT BUỘC

-- ─── PHẠM VI: thu hẹp dần, trống = TOÀN BỘ cấp đó ────────────────
factory_id         UUID → factories(id)     ⚠️ bảng chưa tồn tại
line_id            UUID → sewing_lines(id)
operation_id       UUID → operations(id)    ⚠️ bảng chưa tồn tại

assigned_qty       NUMERIC
uom                VARCHAR

-- ⚠️ KHÔNG có unit_price, KHÔNG có currency. Xem mục 3.4.

start_date         DATE  BẮT BUỘC
end_date           DATE  BẮT BUỘC

status             VARCHAR   (tài liệu 03)
assigned_by · assigned_at · accepted_at · closed_at · close_reason
created_at · created_by · updated_at · updated_by · deleted_at · deleted_by
```

### 3.2 `assignment_bundles`

```
assignment_id · bundle_id · deleted_at · deleted_by
UNIQUE (bundle_id) WHERE deleted_at IS NULL
```

⚠️ Chỉ mục duy nhất **một phần** — bài học `shipment_cartons` (migration 024):
`UNIQUE` toàn phần sẽ khoá vĩnh viễn bó đã gỡ, và tái phân công là chuyện hằng
ngày.

⚠️ **Việc giải phóng bó khi huỷ Assignment nằm ở TẦNG SERVICE, không ở
trigger** — Quyết định 5: trigger chỉ giữ bất biến dữ liệu, không chứa quy
trình nghiệp vụ. "Huỷ thì gỡ bó" là quy trình, không phải bất biến.

Hệ quả phải chấp nhận và ghi rõ: nếu ai đó đổi trạng thái thẳng trong cơ sở dữ
liệu mà không qua service, bó sẽ **kẹt lại** ở Assignment đã huỷ. Bù lại bằng
một mục trong bài kiểm hồi quy: không được tồn tại `assignment_bundles` còn
hiệu lực trỏ vào Assignment `CANCELLED`.

### 3.3 `assignment_daily_reports`

```
assignment_id · report_date
target_qty · output_qty · defect_qty · rework_qty · downtime_minutes
issue_note · support_request · comment
submitted_by · submitted_at
UNIQUE (assignment_id, report_date)
```

⚠️ **Không** cột `is_missing`. Điều XXVIII.1 — "thiếu báo cáo" là *không có
dòng nào*, tính bằng view (tài liệu 06).

### 3.4 `assignment_commercial_terms` — điều khoản thương mại

> **Quyết định 2 (tinh chỉnh):** không đặt `unit_price` trực tiếp vào
> Assignment. Assignment là miền vận hành; thông tin thương mại nằm riêng và
> được *tham chiếu tới* khi cần.

```
id              UUID
assignment_id   UUID → assignments(id)   UNIQUE
contract_no     VARCHAR
unit_price      NUMERIC
currency        VARCHAR(3) CHECK IN (VND, USD, EUR, CNY, JPY, KRW)
payment_term    VARCHAR
note            TEXT
created_at · created_by · updated_at · updated_by
```

**Ba điều bảng này mua được:**

**① Truy vấn quyền không còn chạm bảng chứa giá.** RLS trên `assignments` là
đường đọc nóng nhất của toàn hệ thống. Ở bản 2, một lỗi phạm vi sẽ lộ **giá**;
nay nó chỉ lộ *sự tồn tại* của phần việc. Rủi ro giảm hẳn một bậc, và tôi đã
phải tự nêu rủi ro đó ở bản 2 — tinh chỉnh này xoá nó.

**② Hai vòng đời khác nhau được tách ra.** Phạm vi công việc đổi khi tái phân
công; giá đổi khi đàm phán lại. Nhét chung một bảng thì mỗi lần sửa giá là một
lần `updated_at` của Assignment nhảy, và lịch sử vận hành lẫn với lịch sử
thương mại.

**③ Phân quyền tách được.** Kế toán cần đọc giá mà không cần đọc phạm vi
chuyền. Đối tác cần đọc giá **của chính mình**. Hai policy trên hai bảng, thay
vì một policy phải phân biệt theo cột.

**`UNIQUE (assignment_id)` — một Assignment một bộ điều khoản.** Đàm phán lại
giá giữa chừng là chuyện có thật, nhưng phiên bản hoá điều khoản là **chưa
cần** (Điều XXIX): hôm nay có 0 Assignment. Khi cần, thêm `effective_from` và
bỏ ràng buộc `UNIQUE` — rẻ hơn nhiều so với dựng sẵn cơ chế phiên bản không ai
dùng.

**Đối tác đọc được điều khoản của CHÍNH mình** (Quyết định 3 bản trước, vẫn giữ
nguyên hiệu lực): RLS trên bảng này dùng `mos_assignment_covers('assignment',
assignment_id)`. Vẫn cấm tuyệt đối: Buyer Price · Internal Cost · điều khoản
của Assignment khác.

## 4. Bất biến

**I-1** · Assignment thuộc đúng một Partner và đúng một PO.

**I-2** · Chỉ Monica tạo được Assignment. Đối tác không bao giờ là
`assigned_by`. Đây là lỗ hổng P0 đã vá ở migration 026, nay là bất biến miền.

**I-3** · Quyền là **hàm của** Assignment, không phải thuộc tính của đối tác.
Không tồn tại "quyền của Minh Phát", chỉ tồn tại "quyền suy từ ASG-2026-0042".

**I-4** · Quyền có hạn dùng. Hết `end_date` hoặc `CLOSED` thì quyền **tự mất**,
không ai phải thu hồi.

**I-5** · Một bó thuộc tối đa một Assignment **đang hiệu lực**.

**I-6** · Không xoá cứng. Assignment là gốc của mọi vết audit.

**I-7** · Tổng `assigned_qty` đang hiệu lực của một PO **cảnh báo** khi vượt
`orders.total_quantity` — không chặn. Xuất dư 2–5% là bình thường (bài học
`summariseShipping`, Phase 6).

**I-8** · Partner có `partner_type = 'BUYER'` **không được** có Assignment.

Bảo vệ ở **ba tầng** (Quyết định 1 tinh chỉnh) — mỗi tầng bắt một loại đường
vào khác nhau:

| Tầng | Cài đặt | Bắt được gì |
|---|---|---|
| Domain | `isExecutionPartner()` trong `lib/mos/partner.ts` | lỗi lập trình, thấy ngay lúc biên dịch và kiểm thử |
| Service | Zod refine + kiểm tra trước khi ghi | dữ liệu vào từ biểu mẫu, cho được thông báo đọc hiểu |
| CSDL | trigger `BEFORE INSERT/UPDATE` | mọi đường còn lại — gọi thẳng PostgREST, script, tay |

⚠️ Trigger này **đúng phạm vi Quyết định 5**: nó giữ một *bất biến dữ liệu*
("không dòng `assignments` nào được trỏ tới partner loại BUYER"), không chứa
quy trình nghiệp vụ. Nó chỉ từ chối, không tự động làm gì thay người dùng.

## 5. Ba mảnh chưa tồn tại

| Cần | Trạng thái | Quyết định |
|---|---|---|
| `factories` | không có | **Tạo.** `warehouses` (1 dòng) không thay được |
| `operations` | không có | **Tạo, khởi tạo rỗng.** Nghiệp vụ tự khai công đoạn |
| `buildings` · `floors` | không có | **Không tạo.** Điều XXIX — hôm nay thiếu nó không hỏng gì |

Hệ quả phải nói rõ trên màn hình: tới khi nghiệp vụ khai công đoạn, mọi
Assignment có `operation_id = NULL`, tức phạm vi **mọi công đoạn**. Mặc định
này **rộng**, không hẹp — người giao việc phải thấy điều đó.

## 6. Vì sao KHÔNG mở rộng `subcon_orders`

Quyết định 1 giữ nguyên `subcons` và `subcontractors` là hai Domain riêng.
Đo đạc ủng hộ:

- `subcon_orders.vendor_id` → `subcontractors` (UUID), trong khi
  `financial_records.subcon_id` → `subcons` (TEXT). Assignment xây trên
  `subcon_orders` chỉ phủ được **một nửa** số đối tác thực thi.
- `subcon_orders` không có chỗ cho Supplier, Forwarder, Inspection, Auditor.
- Nó thiếu `accepted_at` — không có mốc *đối tác đã nhận việc chưa*, mà đó là
  mốc pháp lý khi hàng trễ.

`subcon_orders` **nhận thêm** `assignment_id` và trở thành chứng từ sinh ra từ
Assignment. Không đổi tên, không xoá.

## 7. Buyer đi đường khác — Quyết định 4

Buyer là **Order Owner**, không phải Execution Partner. Họ không "được giao
việc"; họ **đặt** việc.

```
Execution Partner:  identity → partner → ASSIGNMENT → resource scope
Buyer:              identity → partner → customer_id → ORDER scope
```

Đường của Buyer **đã tồn tại và đã chạy**: `mos_buyer_can_see_order()` của
migration 018, cùng `buyer_accounts`. Không đụng tới, không viết lại.

**Hệ quả thiết kế:**

- Ma trận quyền (tài liệu 04) **bỏ cột BUYER**.
- `mos_assignment_covers()` không bao giờ được gọi cho Buyer.
- `partner_accounts` phục vụ cả hai, nhưng Buyer chỉ dùng cầu nối
  `customer_id`, không dùng Assignment.
- Bất biến I-8 chặn ở **ba tầng** (mục 4). Không dựa vào giao diện — giao diện
  là hàng rào lịch sự, CSDL mới là hàng rào thật.

**Vì sao ràng buộc này đáng có ở CSDL:** nếu một ngày ai đó tạo nhầm Assignment
cho Buyer, Buyer sẽ đột nhiên có quyền GHI sản lượng — thứ Điều XXX mục 9 cấm
tuyệt đối. Đây đúng loại lỗi im lặng mà chỉ ràng buộc mới bắt được.
