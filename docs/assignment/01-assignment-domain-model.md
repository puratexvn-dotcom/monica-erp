# 01 · ASSIGNMENT DOMAIN MODEL

## 1. Assignment là gì

> **Một phần việc mà Monica giao cho một Đối tác, trong một phạm vi xác định,
> trong một khoảng thời gian xác định.**

Đây là **một câu**, và mọi thứ còn lại của hệ thống phân quyền phải suy ra được
từ nó. Nếu một quy tắc quyền không diễn đạt được bằng câu này thì quy tắc đó
sai chỗ.

### Không phải là gì

| Assignment KHÔNG phải | Vì sao |
|---|---|
| một dòng trong `subcon_orders` | `subcon_orders` là **chứng từ nghiệp vụ** — nó có đơn giá, ngày xuất, ngày trả. Chứng từ được **sinh ra từ** Assignment, không phải ngược lại |
| một vai trò | vai trò nói *anh là ai*; Assignment nói *anh được giao gì* |
| một màn hình | màn hình là hệ quả của quyền, không phải nguồn |
| tài sản của Subcon Portal | Buyer, Supplier, Forwarder, Auditor đều dùng chung mô hình này |

## 2. Ngôn ngữ chung

| Thuật ngữ | Định nghĩa | Ví dụ |
|---|---|---|
| **Partner** | Pháp nhân bên ngoài Monica | Xưởng Minh Phát · Adidas Global |
| **Partner Account** | Một tài khoản đăng nhập thuộc về một Partner | `phat@minhphat.vn` |
| **Assignment** | Phần việc giao cho Partner | "Minh Phát may 5.000 áo của PO-M2601 từ 05/08 đến 20/08" |
| **Scope** | Ranh giới tài nguyên của Assignment | PO · chuyền · công đoạn · bó hàng |
| **Resource** | Một mẩu dữ liệu Assignment chạm tới | phiếu cắt, sản lượng giờ, phiếu kiểm |
| **Grant** | Bộ quyền suy ra từ Assignment | `hourly_log:WRITE` |
| **Daily Report** | Báo cáo ngày bắt buộc của một Assignment | sản lượng ngày 06/08 |

## 3. Thực thể

### 3.1 `assignments` — thực thể gốc

```
id                 UUID          khoá kỹ thuật
assignment_no      VARCHAR       khoá NGHIỆP VỤ, đọc được (Điều XXVIII.5)
                                 ví dụ: ASG-2026-0042

partner_id         UUID  →  partners(id)      BẮT BUỘC
order_id           UUID  →  orders(id)        BẮT BUỘC

-- ─── PHẠM VI: thu hẹp dần, mỗi cấp CÓ THỂ để trống ───────────────
factory_id         UUID  →  factories(id)     ⚠️ bảng CHƯA TỒN TẠI
line_id            UUID  →  sewing_lines(id)
operation_id       UUID  →  operations(id)    ⚠️ bảng CHƯA TỒN TẠI
-- bó hàng KHÔNG nằm ở đây, xem mục 3.2

assigned_qty       NUMERIC       khối lượng giao
uom                VARCHAR       đơn vị (pcs / m / kg)

start_date         DATE          BẮT BUỘC
end_date           DATE          BẮT BUỘC — xem bất biến I-4

status             VARCHAR       xem tài liệu 03
assigned_by        UUID  →  profiles(id)   ai giao
assigned_at        TIMESTAMPTZ
accepted_at        TIMESTAMPTZ   đối tác xác nhận nhận việc
closed_at          TIMESTAMPTZ
close_reason       TEXT

created_at · created_by · updated_at · updated_by   (Điều XXVIII.3)
deleted_at · deleted_by                              (xoá mềm)
```

**Vì sao phạm vi để trống được:** một Assignment có thể rộng ("Minh Phát may
toàn bộ PO-M2601") hoặc hẹp ("chuyền 5, công đoạn tra tay"). Ép mọi cấp phải
điền là buộc người dùng bịa ra dữ liệu họ không có — đúng lỗi `etd_date` của
migration 024.

**Quy tắc đọc phạm vi:** trống nghĩa là **toàn bộ cấp đó**, không phải "không
có". `line_id = NULL` là *mọi chuyền của PO này*, không phải *không chuyền nào*.

### 3.2 `assignment_bundles` — bảng nối

Một Assignment thường phủ **nhiều bó hàng**, và một bó có thể chuyển từ
Assignment này sang Assignment khác khi tái phân công. Nhét `bundle_id` vào
`assignments` sẽ nhân số dòng Assignment lên theo số bó.

```
assignment_id  UUID  →  assignments(id)
bundle_id      UUID  →  cut_bundles(id)
deleted_at · deleted_by                    (gỡ bó là xoá MỀM)

UNIQUE (bundle_id) WHERE deleted_at IS NULL
```

⚠️ **Chỉ mục duy nhất MỘT PHẦN**, đúng bài học của `shipment_cartons` ở
migration 024: một bó chỉ thuộc một Assignment *đang hiệu lực*, nhưng tái phân
công phải làm được. `UNIQUE` toàn phần sẽ khoá vĩnh viễn bó đã gỡ.

### 3.3 `assignment_daily_reports`

```
assignment_id  UUID  →  assignments(id)
report_date    DATE
target_qty · output_qty · defect_qty · rework_qty
downtime_minutes
issue_note · support_request · comment
submitted_by · submitted_at

UNIQUE (assignment_id, report_date)
```

⚠️ **KHÔNG lưu cột `is_missing`** — Điều XXVIII.1 cấm lưu dữ liệu tính được.
"Thiếu báo cáo" = *không có dòng nào* cho (assignment, ngày) trong khi
Assignment đang hiệu lực ngày đó. Tính bằng view, xem tài liệu 06.

## 4. Bất biến — vi phạm là hỏng miền

**I-1 · Assignment luôn thuộc đúng một Partner và đúng một PO.**
Không có Assignment "chung chung". Không có Assignment nhiều PO — hai PO là
hai Assignment.

**I-2 · Chỉ Monica tạo được Assignment.**
Đối tác không bao giờ là `assigned_by`. Đây chính là lỗ hổng P0 đã vá ở
migration 026, nay được nâng thành bất biến của miền.

**I-3 · Quyền của đối tác là HÀM của Assignment, không phải thuộc tính của họ.**
Không tồn tại "quyền của Minh Phát". Chỉ tồn tại "quyền suy từ Assignment
ASG-2026-0042".

**I-4 · Quyền có hạn dùng.**
`start_date` và `end_date` BẮT BUỘC. Assignment hết hạn hoặc đóng thì quyền
**tự mất** mà không ai phải thu hồi — trả lời câu hỏi bắt buộc số 4 của Điều
XXX.

**I-5 · Một bó hàng thuộc tối đa một Assignment đang hiệu lực.**
Nếu không, hai đối tác cùng khai sản lượng trên một bó và không ai biết bó đó
thật sự ở đâu.

**I-6 · Assignment không bao giờ bị xoá cứng.**
Xoá mềm. Assignment là gốc của mọi vết audit; xoá nó là xoá lịch sử ai đã làm
gì.

**I-7 · `assigned_qty` không được vượt khối lượng còn lại của PO.**
Tổng khối lượng giao trên các Assignment đang hiệu lực của một PO không được
vượt `orders.total_quantity`. Đây là ràng buộc **cảnh báo**, không phải chặn —
xuất dư 2–5% là bình thường trong may mặc (bài học `summariseShipping` của
Phase 6).

## 5. Ba mảnh chưa tồn tại

Điều XXX vẽ phân cấp `Factory → Building → Floor → Line → Operation`. Đo thực
tế: **chỉ có `sewing_lines`**.

| Cần | Trạng thái | Đề xuất |
|---|---|---|
| `factories` | không có | Tạo mới. Monica có nhiều xưởng, `warehouses` (1 dòng) không thay thế được |
| `buildings` · `floors` | không có | **Chưa tạo.** Điều XXIX: hôm nay không có nó thì hỏng chuyện gì? Không. Thêm khi có xưởng thật cần phân tầng |
| `operations` | không có | Tạo mới — không có nó thì không giao được "công đoạn tra tay", mà đó là ca dùng chính của thầu phụ chuyên môn |

**Đề xuất giai đoạn 1:** tạo `factories` và `operations`; **bỏ qua**
`buildings`/`floors`, để `assignments` không có hai cột đó. Thêm sau là một
`ALTER TABLE ADD COLUMN` — rẻ. Dựng sẵn hai bảng rỗng không ai dùng thì đắt mãi.

## 6. Vì sao KHÔNG mở rộng `subcon_orders`

Kiến trúc sư đã bác phương án này. Đo đạc ủng hộ quyết định đó:

- `subcon_orders.vendor_id` trỏ `subcontractors` (UUID), trong khi
  `financial_records.subcon_id` trỏ `subcons` (TEXT). Một bảng Assignment xây
  trên `subcon_orders` sẽ **chỉ phủ được một nửa số nhà thầu**.
- `subcon_orders` mang `unit_price` — dữ liệu **thương mại**. Assignment là dữ
  liệu **vận hành**. Trộn hai thứ nghĩa là mọi truy vấn quyền đều phải chạm vào
  bảng chứa giá, và mọi lần lộ Assignment là một lần lộ giá.
- Buyer, Supplier, Forwarder, Auditor không có "subcon order" nào cả.

`subcon_orders` sẽ **nhận thêm** `assignment_id` và trở thành chứng từ sinh ra
từ Assignment. Không đổi tên, không xoá — xem tài liệu 07.
