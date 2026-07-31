# 07 · MIGRATION IMPACT ANALYSIS

> Không viết SQL trong tài liệu này. Đây là bản kê **cái gì bị đụng** và **cái
> gì sẽ gãy** — để phê duyệt trước khi có dòng lệnh nào.

## 1. Bảng mới — 8 bảng

| Bảng | Vì sao cần |
|---|---|
| `partners` | Sổ danh tính đối tác |
| `partner_accounts` | Tài khoản → đối tác (tổng quát hoá `buyer_accounts`) |
| `partner_permissions` | Ma trận quyền, đọc được từ RLS |
| `assignments` | Thực thể gốc |
| `assignment_bundles` | Bó hàng thuộc Assignment |
| `assignment_daily_reports` | Báo cáo ngày bắt buộc |
| `factories` | ⚠️ Không tồn tại. Phân cấp Điều XXX cần |
| `operations` | ⚠️ Không tồn tại. Không có thì không giao được công đoạn |

**Cố ý KHÔNG tạo:** `buildings`, `floors` (Điều XXIX — hôm nay không có thì
không hỏng gì), `forwarders`/`auditors` (vào thẳng `partners`),
`material_consumption` (để phase sau, khi luồng tiêu hao được thiết kế).

## 2. Bảng đang chạy bị đụng — chỉ THÊM cột, không sửa không xoá

| Bảng | Cột thêm | Đang có | Rủi ro |
|---|---|---:|---|
| `subcon_orders` | `assignment_id` (nullable) | 0 dòng | Không |
| `hourly_production_logs` | `assignment_id` (nullable) | 1 dòng | Không |
| `qa_audit_reports` | `assignment_id` (nullable) | 2 dòng | Không |
| `subcon_receipt_logs` | `assignment_id` (nullable) | 0 dòng | Không |
| `shipments` | `forwarder_partner_id` (nullable) | 0 dòng | Không |

**Mọi cột đều nullable.** Dữ liệu cũ không có Assignment và sẽ **mãi mãi**
không có — đó là sự thật lịch sử, không phải thiếu sót cần lấp. Ép `NOT NULL`
là buộc phải bịa Assignment ngược cho quá khứ.

⚠️ **Không** đổi tên cột nào. Không đổi kiểu cột nào. Không `DROP` gì.

## 3. Dữ liệu khởi tạo

| Việc | Số lượng | Rủi ro |
|---|---:|---|
| Sinh `partners` từ `subcons` | 3 | Khoá TEXT → cột cầu nối `subcon_id TEXT` |
| Sinh `partners` từ `subcontractors` | 2 | Không |
| Sinh `partners` từ `customers` | 0 | Bảng rỗng |
| Sinh `partners` từ `suppliers` | 0 | Bảng rỗng |
| Chuyển `buyer_accounts` → `partner_accounts` | 0 | Bảng rỗng |
| Nạp `partner_permissions` | ~90 dòng | Dữ liệu cấu hình, `ON CONFLICT DO NOTHING` |
| Sinh `factories` | 1 | Một xưởng mặc định, để `sewing_lines` có chỗ neo |
| Sinh `operations` | 0 | **Để trống.** Nghiệp vụ phải tự khai công đoạn |

Tổng cộng **5 dòng `partners`**. Đây là cuộc di trú nhỏ — vì các bảng đối tác
gần như rỗng. Làm bây giờ rẻ hơn nhiều so với làm sau.

## 4. Cái gì gãy

### 4.1 Không gãy gì ở phân hệ nội bộ

`/md`, `/kho`, `/qa`, `/ke-toan`, `/giam-doc` **không đổi một dòng**. Chúng
thoát ở `NOT mos_is_external()` trước khi chạm Assignment.

Đã có bằng chứng: ma trận 9 view × 14 vai trò sau migration 025 cho thấy
**12/12 vai trò nội bộ không đổi một dòng nào**. Cơ chế giống hệt.

### 4.2 `/subcon` — gãy có kiểm soát

| Hiện tại | Sau Assignment Engine |
|---|---|
| Đọc thẳng `subcon_orders` | Đọc Assignment, `subcon_orders` là chứng từ đính kèm |
| Thấy **mọi** đơn gia công | Chỉ thấy Assignment của mình |
| Thấy **mọi** nhà thầu | Chỉ thấy hồ sơ của chính mình |
| Thấy `unit_price` của mọi đơn | Chỉ thấy giá trên Assignment của mình |

Ba dòng cuối đang **vi phạm Điều XXX mục 10** ngay lúc này, và tồn tại vì
Kiến trúc sư quyết giữ Cổng Nhà thầu sống trong giai đoạn chuyển tiếp. Assignment
Engine đóng chúng lại — đây là **mục đích**, không phải tác dụng phụ.

### 4.3 Migration 025 và 026 sẽ được gỡ bỏ

Cả hai chặn theo vai trò — kiểu Điều XXX mục 3 gọi thẳng là sai. Khi
`mos_assignment_covers()` chạy, chúng thành thừa và **phải gỡ**, nếu không hai
hệ thống quyền chồng nhau và không ai đoán được kết quả.

⚠️ **Gỡ SAU, không gỡ cùng lúc.** Thứ tự: bật Assignment → chứng minh bằng bài
kiểm → mới gỡ 025/026. Gỡ trước là mở lại lỗ hổng P0 trong khoảng giữa.

## 5. Thứ tự triển khai

```
1. partners · partner_accounts · partner_permissions
   └─ chưa ai dùng, không rủi ro
2. factories · operations
   └─ bảng tham chiếu rỗng
3. assignments · assignment_bundles · assignment_daily_reports
   └─ vẫn chưa ai dùng
4. Hàm: mos_partner_id · mos_partner_type · mos_assignment_covers
   └─ chưa policy nào gọi, đo hiệu năng ở bước này
5. View v_assignment_report_status
   └─ security_invoker = true NGAY từ lần tạo
6. Domain → Service → Hook → Component (màn hình Monica lập Assignment)
   └─ Monica phải lập được Assignment TRƯỚC khi đối tác phụ thuộc vào nó
7. Policy RLS theo Assignment  ◄── ĐIỂM KHÔNG QUAY LẠI
8. Chứng minh bằng bài kiểm
9. Gỡ 025 · 026
```

**Bước 6 phải trước bước 7.** Bật RLS theo Assignment khi chưa ai lập được
Assignment nào nghĩa là mọi đối tác mất sạch quyền — đúng lỗi "vá rò rỉ thành
mất điện" đã lường trước ở migration 024.

## 6. Khả năng hoàn tác

| Bước | Hoàn tác được? |
|---|---|
| 1–5 (bảng, hàm, view mới) | **Có** — `DROP` cái vừa tạo, không ai dùng |
| 6 (màn hình) | **Có** — mã nguồn, `git revert` |
| 7 (policy RLS) | **Có** — `DROP POLICY`, quay về 025/026 |
| 9 (gỡ 025/026) | **Có** — chạy lại chính hai tệp đó, chúng idempotent |
| Cột `assignment_id` đã thêm | **Không mất dữ liệu** khi giữ; `DROP COLUMN` sẽ mất liên kết đã gán |

Điểm không quay lại thật sự là **bước 7**, vì từ đó dữ liệu vận hành bắt đầu
gắn `assignment_id`. Trước đó, mọi thứ tháo ra được.

## 7. Bài kiểm bắt buộc trước khi gỡ 025/026

| # | Phải chứng minh | Cách |
|---|---|---|
| 1 | Đối tác A không thấy dữ liệu của đối tác B | Dựng 2 partner, 2 assignment, đăng nhập thật |
| 2 | Hết `end_date` → quyền tắt | Lùi `end_date` về quá khứ, đọc lại |
| 3 | `CLOSED` → không ghi được | Đổi trạng thái, thử ghi |
| 4 | Nội bộ không mất quyền | Ma trận **mọi bảng × 14 vai trò** |
| 5 | Không tự tạo được Assignment | Lặp lại `probe-026` |
| 6 | `REPORT MISSING` đúng | Assignment 5 ngày, báo cáo 3 ngày, phải ra đúng 2 |
| 7 | Hiệu năng | Đọc bằng phiên đối tác < 2× đường cơ sở, **đo đan xen** |
| 8 | Không dư lượng | Snapshot toàn bộ bảng trước/sau |

Mục 4 và 7 là hai mục dễ bỏ sót nhất và cũng đắt nhất nếu sai.

## 8. Ước lượng

| Hạng mục | Migration | Ghi chú |
|---|---|---|
| Partner Domain | 027 | 3 bảng + di trú 5 dòng |
| Factory · Operation | 028 | 2 bảng tham chiếu |
| Assignment Core | 029 | 3 bảng + trigger + view |
| Hàm quyền | 030 | 5 hàm, chưa gắn policy |
| Policy RLS | 031 | ◄ điểm không quay lại |
| Gỡ chuyển tiếp | 032 | gỡ 025/026 |

Sáu migration. **Không gộp** — mỗi cái là một điểm dừng có thể kiểm chứng
riêng. Điều XXVIII.4 nói một tính năng là một migration hoàn chỉnh; ở đây
"tính năng" là từng lớp của nền móng, không phải cả nền móng.
