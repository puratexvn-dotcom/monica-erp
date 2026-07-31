# 04 · ASSIGNMENT PERMISSION MATRIX

> **Bản 3** — sửa theo Quyết định Kiến trúc và các tinh chỉnh ngày 31/07/2026.
> **Bỏ cột BUYER** (QĐ 4) · giá chuyển sang bảng `assignment_commercial_terms`
> riêng thay vì nằm trên `assignments` · đổi tên loại đối tác.

## 1. Hai chuỗi quyết định, không phải một

### Đối tác thực thi — đi qua Assignment

```
Identity → Partner Account → Assignment → Resource Scope → Permission → Action
```

### Buyer — đi qua quyền sở hữu đơn hàng

```
Identity → Partner Account → customer_id → Order Scope → Permission → Action
```

Đường thứ hai **đã chạy từ migration 018** (`mos_buyer_can_see_order`). Không
viết lại, không nhập vào Assignment.

**Vai trò không xuất hiện ở mắt xích nào.** Vai trò chỉ quyết định vào được
màn hình nào — hàng rào khác, tầng khác.

## 2. Ma trận Đối tác Thực thi

`R` đọc · `W` tạo/sửa · `—` không quyền. Mọi ô đều **chỉ trong phạm vi
Assignment đang hiệu lực**.

| Tài nguyên | PRODUCTION | SERVICE | SUPPLIER | FORWARDER | INSPECTION | AUDITOR |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Đơn hàng (thông tin cơ bản) | R | R | R | R | R | R |
| Mã hàng · tài liệu kỹ thuật | R | R | — | — | R | R |
| Sơ đồ chuyền · công đoạn | R | R | — | — | R | R |
| Bó bán thành phẩm | R | R | — | — | R | R |
| Phiếu cắt | R | R | — | — | R | R |
| **Sản lượng theo giờ** | **W** | **W** | — | — | R | R |
| **Báo cáo ngày** | **W** | **W** | **W** | **W** | **W** | — |
| **Dừng máy / sự cố** | **W** | **W** | — | — | R | R |
| Kiểm giữa chuyền | **W** | **W** | — | — | R | R |
| Kết quả AQL | R | R | — | — | **W** | R |
| Phiếu khắc phục (CAPA) | R | R | — | — | R | R |
| Vật tư được cấp | R | R | R | — | — | — |
| **Tiêu hao vật tư** | **W** | **W** | — | — | — | — |
| Lô hàng xuất | — | — | — | **W** | — | — |
| Chứng từ vận tải | — | — | — | **W** | — | R |
| **Điều khoản thương mại của chính Assignment** | **R** | **R** | **R** | **R** | **R** | **R** |
| Tài liệu của chính mình | **W** | **W** | **W** | **W** | **W** | **W** |
| Bình luận / trao đổi | **W** | **W** | **W** | **W** | **W** | **W** |

### Buyer — bảng riêng, phạm vi theo ĐƠN HÀNG

⚠️ Ở trạng thái `ISSUED`, đối tác chỉ ghi được **hai** thứ: `→ ACCEPTED` hoặc
`→ REJECTED` (Nguyên tắc 8). Không sản lượng, không báo cáo, không tài liệu.
Mọi ô `W` trong bảng trên chỉ mở từ `ACCEPTED` trở đi — xem tài liệu 03 mục 6.

| Tài nguyên | BUYER |
|---|:---:|
| Đơn hàng của khách mình | R |
| Tiến độ tổng hợp | R |
| Kết quả AQL chính thức | R |
| Lô hàng · ETD/ETA | R |
| Chứng từ vận tải | R |
| Mẫu · yêu cầu thay đổi | **W** (duyệt) |
| Bình luận | **W** |
| **Sản lượng theo giờ** | **—** |
| **Bất kỳ tài nguyên nào cần Assignment** | **—** |

Buyer **không ghi một con số vận hành nào** — Điều XXX mục 9. Đây là khác biệt
căn bản với đối tác thực thi, và nay nó nằm ở hai bảng khác nhau chứ không phải
hai cột trong cùng một bảng.

## 3. Giá — ba ranh giới của Quyết định 3

```
✓ ĐƯỢC xem   assignment_commercial_terms  CỦA CHÍNH Assignment mình
              (giá hợp đồng giữa Monica và chính đối tác đó)

✗ CẤM        orders.unit_price             → giá bán cho Buyer
✗ CẤM        financial_records.*           → giá vốn, lợi nhuận, thanh toán
✗ CẤM        điều khoản của Assignment KHÁC
```

Ba ranh giới, ba cơ chế:

| Ranh giới | Chặn bằng |
|---|---|
| Buyer Price | `mos_is_external()` trên `orders` — đã có từ 018 |
| Internal Cost | `mos_is_external()` trên `financial_records` — đã có từ 025 |
| Điều khoản của Assignment khác | `mos_assignment_covers('assignment', …)` |

**Quyết định 2 (tinh chỉnh) làm ranh giới thứ ba rẻ hơn hẳn.** Giá nằm ở bảng
`assignment_commercial_terms` riêng, không nằm trên `assignments`. Hệ quả:

- RLS trên `assignments` — đường đọc **nóng nhất** — không còn chạm dữ liệu giá.
- Một lỗi phạm vi nay lộ *sự tồn tại* của phần việc, **không lộ giá**.
- Kế toán đọc được giá mà không cần quyền đọc phạm vi chuyền, và ngược lại.

Bản 2 của tài liệu này phải tự cảnh báo rằng lỗi phạm vi sẽ lộ giá. Tinh chỉnh
của Kiến trúc sư xoá hẳn cảnh báo đó — đây là thiết kế tốt hơn đề xuất của
tôi.

## 4. Bảy thứ không đối tác nào chạm tới

```
financial_records        giá vốn, lợi nhuận, thanh toán
orders.unit_price        giá bán cho Buyer
profiles                 nhân sự, lương
partners (toàn bảng)     danh sách đối tác khác
subcons · subcontractors · suppliers      registry đối thủ
system_logs · activity_log · wh_audit_log nhật ký nội bộ
settings · roles · user_roles             cấu hình hệ thống
```

Một policy `RESTRICTIVE` duy nhất dùng `mos_is_external()` — hàm đã có từ
migration 025, đã bao phủ buyer và subcon, chỉ cần mở rộng danh sách loại.

## 5. Cài đặt

### 5.1 Hàm nền

```sql
mos_partner_id()          đối tác của người gọi, NULL nếu nội bộ
mos_partner_type()        PRODUCTION_PARTNER / SERVICE_PARTNER / ...
mos_is_external()         đã có từ 025, mở rộng cho 7 loại
mos_assignment_covers(resource_type, resource_id)
mos_partner_can(resource_type, action)
mos_buyer_can_see_order(order_id)     ĐÃ CÓ từ 018 — không viết lại
```

⚠️ Mọi hàm `SECURITY DEFINER` + `STABLE`, đọc claim bằng
`current_setting('request.jwt.claims', true)` kèm chốt `NULLIF` — **đúng khuôn
`mos_is_buyer()` của 018**. Không dùng `auth.jwt()`: khuôn đang chạy mới là
khuôn đã chứng minh (bài học migration 025, khi bản đầu của tôi dùng
`auth.jwt()` và phải sửa).

### 5.2 Khuôn policy

```sql
USING (
  NOT public.mos_is_external()
  OR (
    -- đường Buyer: theo đơn hàng
    (public.mos_partner_type() = 'BUYER'
     AND public.mos_buyer_can_see_order(order_id))
    OR
    -- đường Đối tác thực thi: theo Assignment
    (public.mos_partner_type() <> 'BUYER'
     AND public.mos_partner_can('hourly_log', 'READ')
     AND public.mos_assignment_covers('order', order_id))
  )
)
```

`NOT mos_is_external()` đứng **đầu tiên**: 12/14 vai trò nội bộ thoát ngay,
không trả giá cho phép nối Assignment. Đây là khác biệt thật về hiệu năng, đã
chứng minh ở migration 025.

### 5.3 Ma trận nằm ở đâu — trong CSDL

Bảng `partner_permissions`:

```
partner_type · resource_type · can_read · can_write
```

Ba lý do:
- RLS phải đọc được — RLS không gọi được TypeScript.
- Sửa chính sách là `UPDATE` một dòng, không phải migration.
- Giao diện đọc **cùng bảng đó**, nên màn hình và CSDL không bao giờ nói hai
  điều khác nhau — đúng lỗi Phase 5, khi `po-rbac` cho buyer xem tab Chất lượng
  còn RLS chặn sạch, và người dùng thấy "chưa có phiếu kiểm nào".

Dữ liệu cấu hình, cùng loại `defect_catalog` (023) và `roles` (017).

## 6. Sáu câu hỏi bắt buộc — thiết kế trả lời thế nào

| # | Câu hỏi | Cơ chế |
|---|---|---|
| 1 | Thấy dữ liệu ngoài Assignment? | `mos_assignment_covers()` trong `USING` của mọi bảng vận hành |
| 2 | Cập nhật được dữ liệu Assignment của mình? | Ô `W` + trạng thái `ACCEPTED`/`IN_PROGRESS` |
| 3 | Sửa được Assignment khác? | Cùng hàm đó, áp trong `WITH CHECK` |
| 4 | Hết hạn thì quyền tự mất? | `[planned_start, planned_finish]` tính **trong hàm**, không lưu cột |
| 5 | Daily Report bắt buộc? | Điều kiện chuyển `→ COMPLETED` (tài liệu 03) |
| 6 | Giám đốc thấy ai chưa báo cáo? | `v_assignment_report_status` (tài liệu 06) |

## 7. Điều CỐ Ý không làm

**Không có quyền do người dùng tự cấp cho nhau.** Không "chia sẻ Assignment".
Quyền chảy một chiều từ Monica xuống.

**Không có Assignment cha–con.** Cần hẹp hơn thì tạo Assignment hẹp hơn.

**Không có Permission Engine chạy trong Node.** Quyền tính ở PostgreSQL, nơi dữ
liệu ở. Engine trong ứng dụng nghĩa là mọi chỗ quên gọi engine là một lỗ hổng —
và sẽ có chỗ quên. Điều XXIX.
