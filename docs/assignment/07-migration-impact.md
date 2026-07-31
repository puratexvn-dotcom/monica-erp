# 07 · MIGRATION IMPACT ANALYSIS

> **Bản 2** — sửa theo Quyết định Kiến trúc ngày 31/07/2026.
> Không viết SQL. Đây là bản kê **cái gì bị đụng** và **cái gì sẽ gãy**.

## 1. Bảng mới — 8 bảng

| Bảng | Vì sao cần | Rủi ro |
|---|---|---|
| `partners` | Lớp trừu tượng danh tính (Quyết định 1) | Thấp — bảng mới |
| `partner_accounts` | Tài khoản → đối tác, tổng quát hoá `buyer_accounts` | Thấp |
| `partner_permissions` | Ma trận quyền, RLS đọc được | Thấp |
| `assignments` | Thực thể gốc, **mang `unit_price`** (Quyết định 3) | Trung bình — chứa giá |
| `assignment_bundles` | Bó thuộc Assignment | Thấp |
| `assignment_daily_reports` | Báo cáo ngày bắt buộc | Thấp |
| `factories` | ⚠️ Không tồn tại, phân cấp Điều XXX cần | Thấp |
| `operations` | ⚠️ Không tồn tại, không có thì không giao được công đoạn | Thấp |

**Cố ý KHÔNG tạo:** `buildings` · `floors` · `forwarders` · `auditors` ·
`inspection_companies` · `material_consumption`. Ba loại đối tác cuối vào thẳng
`partners`; ba thứ đầu chưa cần (Điều XXIX).

## 2. Bảng đang chạy bị đụng — chỉ THÊM cột

| Bảng | Cột thêm | Đang có | Rủi ro |
|---|---|---:|---|
| `subcon_orders` | `assignment_id` nullable | 0 dòng | Không |
| `hourly_production_logs` | `assignment_id` nullable | 1 dòng | Không |
| `qa_audit_reports` | `assignment_id` nullable | 2 dòng | Không |
| `subcon_receipt_logs` | `assignment_id` nullable | 0 dòng | Không |
| `shipments` | `forwarder_partner_id` nullable | 0 dòng | Không |

**Mọi cột nullable.** Dữ liệu cũ không có Assignment và sẽ **mãi mãi** không
có — đó là sự thật lịch sử, không phải thiếu sót cần lấp. Ép `NOT NULL` là buộc
bịa Assignment ngược cho quá khứ, đúng lỗi `etd_date DEFAULT CURRENT_DATE` của
migration 024.

⚠️ Không đổi tên cột nào. Không đổi kiểu cột nào. Không `DROP` gì.

## 3. Quyết định 1 — KHÔNG ép đổi cấu trúc cũ

`subcons` (TEXT) và `subcontractors` (UUID) **giữ nguyên hoàn toàn**. `partners`
là lớp trừu tượng phía trên, nối xuống bằng bốn cột cầu nối có khoá ngoại thật,
mỗi cột đúng kiểu bảng đích.

Hệ quả tích cực: **`prod_logs` (140 dòng) và `financial_records` (2 dòng) không
bị đụng một dòng nào.** Đây là hai bảng có dữ liệu thật nhiều nhất trong vùng
ảnh hưởng.

## 4. Dữ liệu khởi tạo

| Việc | Số lượng |
|---|---:|
| `partners` từ `subcons` → `PRODUCTION_PARTNER` | 3 |
| `partners` từ `subcontractors` → `SERVICE_PARTNER` | 2 |
| `partners` từ `customers` → `BUYER` | 0 |
| `partners` từ `suppliers` → `SUPPLIER` | 0 |
| `buyer_accounts` → `partner_accounts` | 0 |
| `partner_permissions` | ~100 dòng cấu hình |
| `factories` | 1 (xưởng mặc định, để `sewing_lines` có chỗ neo) |
| `operations` | **0 — để trống**, nghiệp vụ tự khai |

Tổng **5 dòng `partners`**. Cuộc di trú nhỏ, vì bảng đối tác gần như rỗng — làm
bây giờ rẻ hơn nhiều so với làm sau.

## 5. Cái gì gãy

### 5.1 Không gãy gì ở phân hệ nội bộ

`/md` · `/kho` · `/qa` · `/ke-toan` · `/giam-doc` **không đổi một dòng**. Thoát
ở `NOT mos_is_external()` trước khi chạm Assignment.

Bằng chứng: ma trận 9 view × 14 vai trò sau migration 025 cho thấy **12/12 vai
trò nội bộ không đổi một dòng nào**. Cơ chế giống hệt.

### 5.2 Buyer KHÔNG bị đụng — Quyết định 4

Đây là thay đổi lớn nhất so với bản 1. Buyer đi đường
`mos_buyer_can_see_order()` của migration 018, **không qua Assignment**.

```
Migration 018      giữ nguyên hoàn toàn
buyer_accounts     giữ nguyên; partner_accounts chạy song song
/buyer             không sửa một dòng nào trong giai đoạn này
```

Rủi ro giảm đáng kể: phần đã chạy ổn định nhất của hệ thống phân quyền không bị
động tới.

⚠️ Một việc **phải** làm: bất biến I-8 — chặn ở CSDL không cho tạo Assignment
với partner loại `BUYER`. Không có nó, một Assignment tạo nhầm sẽ cấp cho Buyer
quyền GHI sản lượng, thứ Điều XXX mục 9 cấm tuyệt đối.

### 5.3 `/subcon` — gãy có kiểm soát, đúng mục đích

| Hiện tại | Sau Assignment Engine |
|---|---|
| Đọc thẳng `subcon_orders` | Đọc Assignment; `subcon_orders` là chứng từ đính kèm |
| Thấy **mọi** đơn gia công | Chỉ Assignment của mình |
| Thấy **mọi** nhà thầu | Chỉ hồ sơ của chính mình |
| Thấy `unit_price` **mọi** đơn | Chỉ giá trên Assignment của mình (Quyết định 3) |

Ba dòng cuối đang vi phạm Điều XXX mục 10 **ngay lúc này**, và tồn tại vì Kiến
trúc sư quyết giữ cổng sống trong giai đoạn chuyển tiếp. Assignment Engine đóng
chúng lại — đây là **mục đích**, không phải tác dụng phụ.

### 5.4 Migration 025 và 026 sẽ được gỡ

Cả hai chặn theo vai trò — kiểu Điều XXX mục 3 gọi thẳng là sai. Khi
`mos_assignment_covers()` chạy, chúng thành thừa và **phải gỡ**, nếu không hai
hệ thống quyền chồng nhau và không ai đoán được kết quả.

⚠️ **Gỡ SAU, không gỡ cùng lúc.** Bật Assignment → chứng minh bằng bài kiểm →
mới gỡ. Gỡ trước là mở lại lỗ hổng P0 trong khoảng giữa.

## 6. Thứ tự triển khai

```
1. partners · partner_accounts · partner_permissions      027
   └─ chưa ai dùng, không rủi ro
2. factories · operations                                 028
   └─ bảng tham chiếu, operations để rỗng
3. assignments · assignment_bundles · daily_reports       029
   └─ vẫn chưa ai dùng. Bất biến I-8 cài ở đây
4. Hàm quyền — chưa gắn policy nào                        030
   └─ ĐO HIỆU NĂNG Ở BƯỚC NÀY, trước khi có gì phụ thuộc
5. View v_assignment_report_status                        030
   └─ security_invoker = true NGAY từ lần tạo
6. Màn hình Monica lập Assignment (/md/assignments)       — mã nguồn
   └─ Domain → Service → Hook → Component
7. Policy RLS theo Assignment                             031  ◄ KHÔNG QUAY LẠI
8. Chứng minh bằng 8 bài kiểm
9. Gỡ 025 · 026                                           032
```

**Bước 6 phải trước bước 7.** Bật RLS khi chưa ai lập được Assignment nào nghĩa
là mọi đối tác mất sạch quyền — đúng rủi ro "vá lỗ hổng thành mất điện" đã
lường trước ở migration 024 và suýt xảy ra ở 025.

**Bước 4 là chỗ đo hiệu năng.** Đo khi hàm đã có nhưng chưa policy nào gọi —
lúc đó đo được chi phí thuần của hàm, không lẫn với chi phí truy vấn.

## 7. Khả năng hoàn tác

| Bước | Hoàn tác |
|---|---|
| 1–5 (bảng, hàm, view mới) | **Có** — `DROP` cái vừa tạo, chưa ai dùng |
| 6 (màn hình) | **Có** — `git revert` |
| 7 (policy RLS) | **Có** — `DROP POLICY`, quay về 025/026 |
| 9 (gỡ 025/026) | **Có** — chạy lại chính hai tệp đó, chúng idempotent |
| Cột `assignment_id` đã thêm | Giữ thì không mất gì; `DROP COLUMN` mất liên kết đã gán |

Điểm không quay lại thật sự là **bước 7** — từ đó dữ liệu vận hành bắt đầu gắn
`assignment_id`. Trước đó mọi thứ tháo ra được.

## 8. Tám bài kiểm bắt buộc trước khi gỡ 025/026

| # | Phải chứng minh | Chống rủi ro |
|---|---|---|
| 1 | Đối tác A không thấy dữ liệu của B | R4 |
| 2 | Đối tác A không thấy **giá** của B | R4 + Quyết định 3 |
| 3 | Hết `end_date` → quyền tắt | I-4 |
| 4 | `CLOSED` → không ghi được | tài liệu 03 |
| 5 | **Buyer không đi qua Assignment**, và không tạo được Assignment cho Buyer | I-8 · Quyết định 4 |
| 6 | Nội bộ không mất quyền — mọi bảng × 14 vai trò | R1 |
| 7 | Không tự tạo được Assignment | lặp lại `probe-026` |
| 8 | `REPORT MISSING` đúng: 5 ngày, báo 3, ra đúng 2 | R9 |
| 9 | Hiệu năng < 2× đường cơ sở, **đo đan xen** | R2 |
| 10 | Không dư lượng — snapshot trước/sau | R10 |

Mục 2 là mục **mới** so với bản 1 — hệ quả trực tiếp của Quyết định 3. Vì giá
nằm ngay trên `assignments`, một lỗi phạm vi sẽ lộ **giá** chứ không chỉ lộ sự
tồn tại của phần việc. Bài kiểm phải khẳng định thẳng vào cột `unit_price`,
không chỉ đếm số dòng.

Mục 6 và 9 là hai mục dễ bỏ sót nhất và đắt nhất nếu sai.

## 9. Sáu migration

| # | Nội dung | Điểm dừng kiểm chứng được |
|---|---|---|
| 027 | Partner Domain | 5 dòng `partners`, chưa ai dùng |
| 028 | Factory · Operation | 2 bảng tham chiếu |
| 029 | Assignment Core + I-8 | 3 bảng, trigger, chưa RLS |
| 030 | Hàm quyền + view | đo hiệu năng tại đây |
| 031 | Policy RLS | ◄ điểm không quay lại |
| 032 | Gỡ 025 · 026 | sau khi 10 bài kiểm xanh |

**Không gộp.** Điều XXVIII.4 nói một tính năng là một migration hoàn chỉnh; ở
đây "tính năng" là từng lớp của nền móng, không phải cả nền móng. Gộp lại thì
không có chỗ nào dừng để đo.
