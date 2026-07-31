# 01 · ASSIGNMENT DOMAIN MODEL

> **Bản 2** — sửa theo Quyết định Kiến trúc ngày 31/07/2026.
> Thay đổi lớn: Buyer **không** dùng Assignment · Assignment mang `unit_price` ·
> đổi tên loại đối tác theo thuật ngữ chính thức.

## 1. Assignment là gì

> **Một phần việc THỰC THI mà Monica giao cho một Đối tác Thực thi, trong một
> phạm vi xác định, trong một khoảng thời gian xác định, ở một mức giá xác
> định.**

Assignment là Core Domain của **Manufacturing Execution** — không phải của
Customer Management (Quyết định 5).

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

-- ─── GIÁ HỢP ĐỒNG  (Quyết định 3) ────────────────────────────────
unit_price         NUMERIC
currency           VARCHAR(3)  CHECK IN (VND, USD, EUR, CNY, JPY, KRW)

start_date         DATE  BẮT BUỘC
end_date           DATE  BẮT BUỘC

status             VARCHAR   (tài liệu 03)
assigned_by · assigned_at · accepted_at · closed_at · close_reason
created_at · created_by · updated_at · updated_by · deleted_at · deleted_by
```

#### Vì sao `unit_price` nằm TRÊN Assignment

**Bản 1 của tài liệu này lập luận ngược lại** — rằng giá là dữ liệu thương mại,
nên để ở `subcon_orders`, tránh cho mọi truy vấn quyền phải chạm bảng chứa giá.

Quyết định 3 đổi yêu cầu: đối tác **được** xem giá của chính Assignment mình.
Khi đó lập luận cũ mất chỗ đứng — nếu giá nằm ở `subcon_orders` thì phải mở
thêm một đường đọc vào bảng đó, và bảng đó chứa giá của **mọi** đối tác. Đặt
giá ngay trên Assignment cho ra phạm vi bảo vệ **hẹp hơn**: ai thấy Assignment
thì thấy giá của đúng Assignment ấy, không hơn.

Ba ranh giới Quyết định 3 vạch ra, ánh xạ thẳng vào dữ liệu:

| Cấm xem | Nằm ở | Chặn bằng |
|---|---|---|
| Buyer Price | `orders.unit_price` · `customers` | `mos_is_external()` |
| Internal Cost | `financial_records` | `mos_is_external()` |
| Giá của Assignment **khác** | `assignments.unit_price` | `mos_assignment_covers()` |

`currency` bắt buộc đi kèm — một con số giá không có đơn vị tiền là một con số
sai đang chờ ngày lộ ra. Ràng buộc `CHECK` sáu đồng tiền theo Điều XXVIII.2.

### 3.2 `assignment_bundles`

```
assignment_id · bundle_id · deleted_at · deleted_by
UNIQUE (bundle_id) WHERE deleted_at IS NULL
```

⚠️ Chỉ mục duy nhất **một phần** — bài học `shipment_cartons` (migration 024):
`UNIQUE` toàn phần sẽ khoá vĩnh viễn bó đã gỡ, và tái phân công là chuyện hằng
ngày. Kèm trigger giải phóng bó khi Assignment chuyển `CANCELLED`, sao chép
nguyên `shipment_release_cartons` đã kiểm chứng.

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

**I-8** *(mới)* · Partner có `partner_type = 'BUYER'` **không được** có
Assignment. Ràng buộc ở tầng CSDL, không chỉ ở tầng ứng dụng — xem mục 7.

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
- Bất biến I-8 chặn ở CSDL: `CHECK` hoặc trigger từ chối Assignment có
  `partner_id` trỏ tới partner loại `BUYER`. Không dựa vào giao diện — giao
  diện là hàng rào lịch sự, CSDL mới là hàng rào thật.

**Vì sao ràng buộc này đáng có ở CSDL:** nếu một ngày ai đó tạo nhầm Assignment
cho Buyer, Buyer sẽ đột nhiên có quyền GHI sản lượng — thứ Điều XXX mục 9 cấm
tuyệt đối. Đây đúng loại lỗi im lặng mà chỉ ràng buộc mới bắt được.
