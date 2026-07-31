# 02 · PARTNER DOMAIN MODEL

## 1. Thực trạng đo được

Monica hiện có **bốn bảng đối tác rời rạc**, không bảng nào biết bảng nào:

| Bảng | Dòng | Khoá | Đặc thù | Ai tham chiếu |
|---|---:|---|---|---|
| `customers` | 0 | UUID | `brand`, `buyer_group`, `currency`, `incoterm`, `payment_term`, `credit_limit`, `four_point_limit` | `orders.customer_id` · `buyer_accounts` |
| `subcons` | 3 | **TEXT** `SC1` | `capacity_per_day` | `prod_logs` · `financial_records` |
| `subcontractors` | 2 | UUID | `vendor_code`, `service_type` | `subcon_orders` · `orders.subcontractor_id` |
| `suppliers` | 0 | UUID | `kpi_on_time_rate`, `kpi_quality_rate` | — |

Và **không có bảng nào** cho Forwarder — `shipments.forwarder` là VARCHAR tự do
(thêm ở migration 024).

### Hai bảng cùng tên gọi "subcon", hai bản chất

Đây là điểm dễ kết luận sai nhất. Chúng **không phải trùng lặp**:

```
subcons         → xưởng gia công TRỌN GÓI. Có capacity_per_day (900/1200/700).
                  Nhận cả PO về may. Được trả tiền theo financial_records.

subcontractors  → nhà cung cấp DỊCH VỤ. Có service_type (IN_THEU, GIAT).
                  Nhận bó hàng đi in/giặt rồi trả về.
```

Gộp chúng thành một bảng sẽ **mất `capacity_per_day`** hoặc **mất
`service_type`**, và làm gãy bốn cột khoá ngoại đang chạy.

## 2. Nguyên tắc thiết kế

> **Hợp nhất DANH TÍNH, giữ nguyên ĐẶC THÙ.**

Partner Domain trả lời đúng một câu hỏi: *"pháp nhân bên ngoài này là ai, và
tài khoản nào thuộc về họ?"* Nó **không** cố nuốt mọi thuộc tính nghiệp vụ của
bốn bảng trên.

## 3. Hai bảng mới

### 3.1 `partners` — sổ danh tính đối tác

```
id            UUID
partner_code  VARCHAR  UNIQUE      khoá nghiệp vụ (Điều XXVIII.5)
partner_type  VARCHAR  CHECK IN (BUYER,
                                 PRODUCTION_PARTNER, SERVICE_PARTNER,
                                 SUPPLIER, FORWARDER, INSPECTION, AUDITOR)
name          VARCHAR
tax_code · phone · email · address · country
is_active     BOOLEAN

-- ─── CẦU NỐI VỀ BẢNG CHUYÊN BIỆT, đúng MỘT cột có giá trị ─────────
customer_id       UUID  →  customers(id)
subcon_id         TEXT  →  subcons(id)              ⚠️ khoá TEXT, cố ý
subcontractor_id  UUID  →  subcontractors(id)
supplier_id       UUID  →  suppliers(id)

created_at · created_by · updated_at · updated_by · deleted_at · deleted_by
```

**Vì sao bốn cột cầu nối chứ không phải một cột `legacy_id` đa hình:** cột đa
hình không khai được khoá ngoại, nên cơ sở dữ liệu không bảo vệ được tính toàn
vẹn — trỏ vào một khách hàng đã xoá cũng không ai chặn. Bốn cột có khoá ngoại
thật, và một ràng buộc `CHECK` bảo đảm **đúng một cột** có giá trị, khớp với
`partner_type`.

**Vì sao `subcon_id` để kiểu TEXT:** vì `subcons.id` là TEXT. Ép nó thành UUID
là phải viết lại `prod_logs` và `financial_records` — hai bảng đang có dữ liệu
thật. Một cột TEXT xấu hơn nhiều so với một cuộc di trú dữ liệu hỏng.

### 3.2 `partner_accounts` — tài khoản thuộc về đối tác

Tổng quát hoá `buyer_accounts` (hiện có, 0 dòng).

```
id          UUID
user_id     UUID  →  profiles(id)
partner_id  UUID  →  partners(id)
is_active   BOOLEAN
note        TEXT
created_at · created_by · updated_at · updated_by

UNIQUE (user_id) WHERE is_active         -- một tài khoản thuộc MỘT đối tác
```

**Vì sao một tài khoản chỉ thuộc một đối tác:** nếu một người vừa là nhân viên
của Minh Phát vừa của An Khang, thì mọi truy vấn quyền phải hỏi "trong ngữ cảnh
nào?" — và không có ngữ cảnh nào để hỏi. Trường hợp đó cần **hai tài khoản**.

## 4. Quan hệ

```
profiles ──1:1── partner_accounts ──N:1── partners
                                             │
                                    ┌────────┼────────┬──────────┐
                                    ▼        ▼        ▼          ▼
                               customers  subcons  subcontr.  suppliers
                                                (bảng chuyên biệt, giữ nguyên)

partners ──1:N── assignments ──N:1── orders
```

## 5. Vòng đời di trú — KHÔNG phá gì

**Giai đoạn 1 · Thêm, không sửa.** Tạo `partners` + `partner_accounts`. Sinh
một dòng `partners` cho mỗi dòng của bốn bảng cũ (3 + 2 + 0 + 0 = **5 dòng**).
Bốn bảng cũ **không đổi một cột nào** — Quyết định 1: Partner Domain chỉ là lớp
trừu tượng, không ép đổi cấu trúc hiện có khi chưa có nhu cầu.

**Giai đoạn 2 · Chạy song song.** Mã mới đọc `partners`. Mã cũ (`/subcon`,
`/ke-toan`, `/md`) tiếp tục đọc bảng cũ. Hai bên cùng đúng vì `partners` chỉ là
lớp danh tính, không giữ dữ liệu nghiệp vụ.

**Giai đoạn 3 · Chuyển dần.** Khi một màn hình được viết lại theo Assignment,
nó chuyển sang `partners`. Không có "ngày cắt băng" nào cả.

**Giai đoạn 4 · Chưa lên lịch.** Có thể không bao giờ gộp bốn bảng cũ. Điều
XXIX: hôm nay không gộp thì hỏng chuyện gì? Không hỏng gì.

## 6. Forwarder · Inspection · Auditor

Chưa có bảng, và **chưa cần**. Cả ba vào thẳng `partners` với
`partner_type = FORWARDER / INSPECTION / AUDITOR`, bốn cột cầu nối để trống.
Khi nào họ cần thuộc tính riêng (mã hãng tàu, số chứng chỉ giám định) thì mới
sinh bảng chuyên biệt — Điều XXIX. Hôm nay có **0 đối tác** thuộc cả ba loại.

⚠️ **Inspection khác Auditor.** Công ty giám định làm AQL cho lô hàng; kiểm
toán viên đánh giá tuân thủ nhà máy. Hai việc, hai bộ quyền (tài liệu 04).

`shipments.forwarder` (VARCHAR tự do) sẽ nhận thêm `forwarder_partner_id` khi
Forwarder Portal khởi động — **không** xoá cột chữ, vì dữ liệu cũ nằm ở đó.

## 7. Quan hệ với `roles`

`partner_type` **không thay thế** vai trò. Chúng trả lời hai câu khác nhau:

```
role          →  người này thuộc nhóm quyền mặc định nào  (buyer / subcon / md)
partner_type  →  pháp nhân này là loại đối tác gì         (BUYER / SUBCON / ...)
```

Vai trò vẫn quyết định *vào được màn hình nào*. Assignment quyết định *thấy
được dòng dữ liệu nào*. Hai hàng rào, hai tầng, không thay nhau — đúng như
`po-rbac.ts` và RLS đang phối hợp ở phân hệ `/md`.

## 8. Buyer dùng Partner Domain nhưng KHÔNG dùng Assignment

Quyết định 4. Buyer là **Order Owner**, không phải Execution Partner.

```
Execution Partner  →  partner_accounts → partners → ASSIGNMENT → tài nguyên
Buyer              →  partner_accounts → partners → customer_id → ĐƠN HÀNG
```

Đường thứ hai **đã chạy từ migration 018** (`mos_buyer_can_see_order` +
`buyer_accounts`). Partner Domain bọc lên trên nhưng không thay đổi nó.

`partners.customer_id` chính là cầu nối giữ cho đường cũ tiếp tục hoạt động
trong khi lớp trừu tượng mới lớn dần.
