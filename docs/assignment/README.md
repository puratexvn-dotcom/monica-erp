# ASSIGNMENT CORE DOMAIN — HỒ SƠ THIẾT KẾ

> **Trạng thái: CHỜ PHÊ DUYỆT.** Chưa viết một dòng SQL nào, chưa tạo migration
> nào. Theo Điều XXVII và Quyết định 8 của Kiến trúc sư.

Assignment là **Core Domain** của MONICA MOS. Nó không thuộc Subcon, không
thuộc Buyer, không thuộc bất kỳ Portal nào — nó thuộc về chính hệ điều hành
sản xuất.

```
Partner Domain
      │
      ▼
Partner Account
      │
      ▼
  Assignment
      │
      ├── Buyer Portal
      ├── Subcon Portal
      ├── Supplier Portal
      ├── Forwarder Portal
      └── Auditor Portal
```

Assignment là **nguồn xác định duy nhất** của: Permission · Resource Scope ·
Reporting · Daily Report · REPORT MISSING · KPI · Notification · Timeline ·
Audit.

## Mười tài liệu

| # | Tài liệu | Trả lời câu hỏi |
|---|---|---|
| 01 | [Assignment Domain Model](01-assignment-domain-model.md) | Assignment *là* cái gì, bất biến nào không được vi phạm |
| 02 | [Partner Domain Model](02-partner-domain-model.md) | Ai là đối tác, và bốn bảng rời rạc hiện nay hợp nhất ra sao |
| 03 | [Assignment State Machine](03-state-machine.md) | Vòng đời, và quyền tắt đi lúc nào |
| 04 | [Permission Matrix](04-permission-matrix.md) | Loại đối tác nào được làm gì với tài nguyên nào |
| 05 | [Resource Model](05-resource-model.md) | "Tài nguyên nằm trong Assignment" nghĩa là gì, tính bằng cách nào |
| 06 | [Data Flow](06-data-flow.md) | Dữ liệu chảy từ đâu tới đâu, ai ghi ai đọc |
| 07 | [Migration Impact Analysis](07-migration-impact.md) | Đụng vào những gì đang chạy, cái gì sẽ gãy |
| 08 | [API Contract](08-api-contract.md) | Chữ ký hàm, hình dạng dữ liệu, mã lỗi |
| 09 | [Folder Tree](09-folder-tree.md) | Tệp nào nằm ở đâu, ranh giới module |
| 10 | [Risk Analysis](10-risk-analysis.md) | Cái gì có thể hỏng, và biết trước bằng cách nào |

## Nền tảng đo đạc

Mọi con số trong bộ tài liệu này **đo trên cơ sở dữ liệu đang chạy** ngày
31/07/2026, không suy từ tên bảng. Ba phát hiện định hình toàn bộ thiết kế:

**① Có HAI bảng nhà thầu song song, khoá khác kiểu dữ liệu.**

| Bảng | Khoá | Bản chất | Ai tham chiếu |
|---|---|---|---|
| `subcons` | `TEXT` (`SC1`) | Xưởng gia công trọn gói, có `capacity_per_day` | `prod_logs.subcon_id` · `financial_records.subcon_id` |
| `subcontractors` | `UUID` | Nhà cung cấp dịch vụ, có `service_type` (in, giặt) | `subcon_orders.vendor_id` · `orders.subcontractor_id` |

Chúng **không** trùng lặp — là hai loại đối tác khác nhau, cùng bị gọi là
"subcon". Partner Domain phải chứa được cả hai mà không phá cái nào.

**② Ba mảnh trong sơ đồ phân cấp của Điều XXX KHÔNG tồn tại.**
`Factory → Building → Floor → Line → Operation`: chỉ có `sewing_lines` (3
dòng). Không có bảng nhà máy, không có tầng/xưởng, **không có bảng công đoạn**.

**③ `daily_production_logs` đã tồn tại nhưng khoá theo `department_id`,
0 dòng, không mã nào dùng.** Phải khoá lại theo Assignment.

## Nợ đang gánh

Migration 025 và 026 là **kiến trúc chuyển tiếp** — chặn theo vai trò, thứ mà
Điều XXX mục 3 gọi thẳng là sai. Chúng tồn tại vì lỗ hổng P0 phải bịt ngay.
Assignment Engine ra đời là để thay chúng, không phải để đứng cạnh chúng.
