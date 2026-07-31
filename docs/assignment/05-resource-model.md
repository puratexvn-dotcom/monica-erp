# 05 · ASSIGNMENT RESOURCE MODEL

## 1. Câu hỏi duy nhất

> **"Tài nguyên X có nằm trong Assignment đang hiệu lực nào của đối tác này
> không?"**

Toàn bộ tài liệu này là cách trả lời câu đó cho nhanh và đúng.

⚠️ **Chỉ áp dụng cho Đối tác Thực thi.** Buyer không đi qua Assignment
(Quyết định 4) — quyền của họ hỏi một câu khác: *"đơn hàng này có thuộc khách
hàng của họ không?"*, trả lời bằng `mos_buyer_can_see_order()` đã có từ
migration 018. Hai câu hỏi, hai hàm, không trộn.

## 2. Bốn cách một tài nguyên gắn vào Assignment

| Cách | Nghĩa | Tài nguyên |
|---|---|---|
| **A · trực tiếp** | Bảng có `assignment_id` | báo cáo ngày, tiêu hao vật tư, tài liệu |
| **B · qua đơn hàng** | Bảng có `order_id` | phiếu cắt, lô hàng, phiếu kiểm AQL |
| **C · qua bó hàng** | Bảng có `bundle_id` | sản lượng theo giờ, phiếu xuất/nhập gia công |
| **D · qua chuyền** | Bảng có `line_id` | kiểm giữa chuyền, dừng máy |

Bốn cách vì dữ liệu hiện có gắn theo bốn kiểu khác nhau — đo được, không chọn
được. `hourly_production_logs` có `line_id` + `order_id` + `bundle_id`;
`cut_tickets` chỉ có `order_id`; `cut_bundles` chỉ có `cutting_log_id`.

## 3. Hàm phân giải

```sql
mos_assignment_covers(resource_type TEXT, resource_id UUID) RETURNS BOOLEAN
```

Trả `TRUE` khi tồn tại một Assignment thoả **tất cả**:

```
partner_id  =  mos_partner_id()
status      ∈  {ISSUED, ACCEPTED, IN_PROGRESS, SUSPENDED, COMPLETED, CLOSED}
deleted_at  IS NULL
và tài nguyên rơi vào phạm vi của Assignment đó
```

⚠️ Danh sách trạng thái ở đây là danh sách **ĐỌC** (tài liệu 03 mục 5), rộng
hơn danh sách GHI. `DRAFT` và `CANCELLED` không có mặt — Assignment nháp chưa
tồn tại với đối tác, Assignment huỷ đã biến mất khỏi cổng của họ.

Quyền GHI thêm hai điều kiện nữa: `status ∈ {ACCEPTED, IN_PROGRESS}` và
`hôm_nay ∈ [start_date, end_date]`.

## 4. Phạm vi thu hẹp dần

Assignment mô tả phạm vi bằng bốn cột, **cột trống nghĩa là toàn bộ cấp đó**:

```
order_id      luôn có
factory_id    trống → mọi xưởng của PO
line_id       trống → mọi chuyền
operation_id  trống → mọi công đoạn
```

Ví dụ trên cùng PO-M2601:

```
ASG-001  order=M2601, line=NULL         →  Minh Phát may toàn bộ PO
ASG-002  order=M2601, line=L5, op=OP-12 →  chỉ công đoạn tra tay ở chuyền 5
```

**Bẫy phải tránh:** `line_id = NULL` KHÔNG được dịch thành `line_id IS NULL`
trong mệnh đề so khớp. Phải là:

```sql
(a.line_id IS NULL OR a.line_id = r.line_id)
```

Viết nhầm thành `a.line_id = r.line_id` sẽ làm Assignment phạm vi rộng **không
khớp gì cả** — vì `NULL = bất_kỳ` cho ra `NULL`, không phải `TRUE`. Đây là lỗi
im lặng: không báo gì, chỉ là đối tác đột nhiên không thấy dữ liệu nào.

## 5. Bảng ánh xạ

| Bảng | Cách | Khoá dùng để nối |
|---|---|---|
| `assignment_daily_reports` | A | `assignment_id` |
| `assignment_documents` | A | `assignment_id` |
| `material_consumption` *(chưa có)* | A | `assignment_id` |
| `orders` | B | `id` |
| `cut_tickets` | B | `order_id` |
| `qa_logs` | B | `order_id` |
| `shipments` | B | `order_id` |
| `capa_logs` | B | `order_id` |
| `cut_bundles` | C | qua `assignment_bundles` |
| `hourly_production_logs` | C rồi B | `bundle_id`, rơi về `order_id` khi trống |
| `subcon_issue_logs` · `subcon_receipt_logs` | C | `bundle_id` |
| `qa_audit_reports` | D rồi B | `line_id`, rơi về `order_id` |
| `sewing_lines` | D | `id` |

**`hourly_production_logs` phải rơi về `order_id` khi `bundle_id` trống.** Đo
được: bảng có 1 dòng, và `bundle_id` cho phép NULL. Nếu chỉ nối qua bó thì mọi
dòng sản lượng không gắn bó sẽ vô hình với chính người đã ghi ra nó.

## 6. Hiệu năng — rủi ro lớn nhất của toàn bộ thiết kế

Mỗi lần đọc một bảng vận hành sẽ gọi `mos_assignment_covers()` **trên từng
dòng**. Với 100.000 PO/năm, đây là chỗ hệ thống chết trước tiên.

### 6.1 Ba lớp phòng thủ

**Lớp 1 · Người nội bộ thoát ngay.**
`NOT mos_is_external()` đứng đầu biểu thức, đánh giá xong là xong. Không chạm
Assignment. Phủ 12/14 vai trò.

**Lớp 2 · Nhớ đối tác trong một truy vấn.**
`mos_partner_id()` khai `STABLE` để PostgreSQL gọi **một lần cho cả câu lệnh**,
không phải mỗi dòng một lần.

**Lớp 3 · Chỉ mục phủ.**
```sql
CREATE INDEX idx_assign_partner_active
  ON assignments (partner_id, order_id, status)
  WHERE deleted_at IS NULL;
```
Chỉ mục **một phần** — Assignment đã xoá mềm không bao giờ được hỏi tới, đánh
chỉ mục cho chúng là trả phí cho dữ liệu chết. Cùng khuôn với
`idx_capa_due_open` (023) và `uq_shipment_carton_active` (024).

### 6.2 Điều KHÔNG làm

**Không dựng bảng phẳng `partner_visible_orders`.** Nó là dữ liệu tính được —
Điều XXVIII.1 cấm. Và nó sẽ lệch đúng vào ngày Assignment hết hạn, theo hướng
nguy hiểm nhất: cho xem thứ lẽ ra đã khoá.

**Không nạp Assignment về Node rồi lọc.** Mọi chỗ quên gọi bộ lọc là một lỗ
hổng, và sẽ có chỗ quên.

### 6.3 Ngưỡng phải đo trước khi duyệt migration

Đường cơ sở đã đo ở Phase 6: truy vấn trần **275 ms** (chủ yếu là độ trễ đường
truyền), hai view song song **409 ms**.

Ngưỡng cho Assignment: đọc `hourly_production_logs` bằng phiên đối tác **không
được vượt 2× đường cơ sở đo cùng lúc**. Phải đo **đan xen** — đo xong cái này
mới đo cái kia sẽ cho ra chênh lệch vô nghĩa, đúng lỗi đã mắc ở `live-024`.

## 7. Tài nguyên đi ra ngoài mọi Assignment

Ba loại, và không loại nào được mặc định lọt:

**① Dữ liệu tham chiếu** — `defect_catalog`, `roles`, `settings`. Đối tác
không cần. Chặn bằng `mos_is_external()`, không đụng Assignment.

**② Dữ liệu của chính đối tác** — hồ sơ công ty, tài khoản của họ. Không thuộc
Assignment nào cả. Quy chiếu bằng `partner_id = mos_partner_id()`.

**③ Dữ liệu của Buyer** — mọi thứ Buyer đọc. Không đi qua Assignment mà đi
qua `partners.customer_id`, đúng khuôn `mos_buyer_can_see_order()` đã có từ
migration 018. Đây không phải ngoại lệ — đây là **con đường chính thức của
Buyer** theo Quyết định 4.

Ba đường vào khác nhau, khai tường minh. Cái nguy hiểm không phải là ba đường,
mà là một đường thứ tư không ai khai mà vẫn đi được.
