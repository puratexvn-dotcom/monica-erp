# MONICA MANUFACTURING OPERATING SYSTEM (MOS) — CONSTITUTION

| | |
|---|---|
| **Version** | 1.0 |
| **Status** | Enterprise Architecture Standard |

> Đây là tài liệu quan trọng nhất của toàn bộ dự án.
>
> Claude Code phải đọc tài liệu này **trước khi sinh bất kỳ dòng code nào**.
>
> Nếu bất kỳ yêu cầu nào của người dùng mâu thuẫn với tài liệu này, phải **dừng lại và giải thích** thay vì tự ý sửa kiến trúc.

---

## I. TRIẾT LÝ HỆ THỐNG

**MONICA KHÔNG PHẢI ERP.**

MONICA là **Manufacturing Operating System (MOS)** + **Manufacturing Collaboration Platform**.

**Mục tiêu:** điều hành toàn bộ doanh nghiệp may mặc trên một nền tảng duy nhất.

- Không phải phần mềm quản lý.
- Không phải phần mềm kế toán.
- Không phải phần mềm kho.
- Không phải CRM.

Mà là **"Hệ điều hành"** cho toàn bộ doanh nghiệp.

Tất cả module đều chạy trên cùng một hệ thống. Không tồn tại dữ liệu cục bộ. Không tồn tại nhiều nguồn dữ liệu.

Chỉ có:

- **ONE DATABASE**
- **ONE WORKFLOW**
- **ONE SOURCE OF TRUTH**

---

## II. TRIẾT LÝ KINH DOANH

Monica không bán ERP. Monica bán:

- Transparency
- Realtime
- Collaboration
- Traceability
- Automation
- Decision Support

Buyer không cần gọi điện. QA không cần gửi Zalo. Warehouse không cần Excel. CEO không cần hỏi tiến độ.

**Mọi thứ phải có trên hệ thống.**

---

## III. KIẾN TRÚC TỔNG THỂ

```
CEO COMMAND CENTER
        ↓
MERCHANDISER COMMAND CENTER ⭐
        ↓
WAREHOUSE NPL
        ↓
CUTTING
        ↓
SEWING
        ↓
FINISHING
        ↓
QA
        ↓
FG WAREHOUSE
        ↓
ACCOUNTING
        ↓
SYSTEM
```

Ngoài ra:

- BUYER PORTAL
- SUBCON PORTAL
- HR

---

## IV. MERCHANDISER LÀ TRUNG TÂM DUY NHẤT

Merchandiser **không phải** bộ phận nhập PO. Đây là **CONTROL TOWER**.

MD quản lý:

- Buyer
- PO
- Style
- Costing
- Purchasing
- Material Planning
- Production Planning
- Shipment
- Payment Status
- Comment
- Approval
- Document
- Timeline
- Notification
- Risk
- AI

**Không module nào được phép tự tạo dữ liệu.**

---

## V. BUYER PORTAL

Khách hàng **KHÔNG PHẢI CRM**. Đây là **Buyer Portal**.

Buyer được cấp tài khoản. Buyer chỉ nhìn thấy **PO của chính mình**.

Buyer xem realtime:

- Production
- QA
- Shipment
- Invoice
- Comment
- Timeline
- Document
- Approval

Không dùng Email. Không dùng Excel. Không dùng Zalo.

---

## VI. PURCHASING

Không tạo module Purchasing riêng.

Purchasing **100%** là workflow **bên trong Merchandiser**.

---

## VII. KIẾN TRÚC PHẦN MỀM

Tuyệt đối **KHÔNG** để Business Logic trong UI.

Kiến trúc bắt buộc:

```
app/
modules/
core/
shared/
components/
```

Không để business logic trong `components`. `components` chỉ render UI.

---

## VIII. CORE ENGINE

Toàn bộ hệ thống phải được xây dựng trên các Engine dùng chung.

```
core/
  workflow/
  events/
  notification/
  permission/
  audit/
  ai/
  realtime/
  i18n/
  validation/
```

- Không module nào tự xây Notification.
- Không module nào tự xây Audit.
- Không module nào tự xây Permission.

---

## IX. EVENT DRIVEN

Không gọi trực tiếp giữa các module.

Ví dụ: Warehouse **không** gọi Buyer.

Warehouse chỉ phát `MaterialReceivedEvent`:

```
MaterialReceivedEvent
        ↓
Notification Engine
        ↓
Buyer → MD → CEO → Bell → Realtime → Timeline
```

---

## X. WORKFLOW ENGINE

Workflow không nằm trong module. Workflow nằm trong **Workflow Engine**.

Ví dụ, các luồng sau đều dùng chung:

- Approve Sample
- Approve Purchase
- Approve Shipment
- Approve QA

---

## XI. AUDIT

**100% Audit.**

Create · Update · Delete · Approve · Reject · Upload · Download · Comment · Login · Logout · Permission — đều lưu.

**Không exception.**

---

## XII. NOTIFICATION

Notification **không** nằm trong module.

Bell · Email · Push · Realtime · Buyer · CEO · QA · Warehouse — đều dùng chung.

---

## XIII. PERMISSION

**RBAC.**

CEO · Director · Merchandiser · Warehouse · QA · Cutting · Sewing · Finishing · Accounting · Buyer · Subcon · HR · Admin

**Không hardcode role.**

---

## XIV. AI ENGINE

AI không thay người. AI chỉ hỗ trợ.

AI có nhiệm vụ:

- Summary
- Risk
- Forecast
- Recommendation
- Today's Work
- Factory Analysis
- Buyer Analysis
- Material Analysis
- Capacity Analysis
- Shipment Analysis

---

## XV. REALTIME

Mọi thay đổi phải realtime.

- QA upload → Buyer thấy.
- Warehouse nhập → Buyer thấy.
- Production → CEO thấy.

**Không refresh.**

---

## XVI. UI / UX

Đây **KHÔNG** phải Dashboard. Đây là **Operating System**.

Thiết kế: Modern · Minimal · Professional · Enterprise · Actionable

Không màu mè. Không statistic vô nghĩa.

**Mỗi Widget phải giúp người dùng ra quyết định.**

---

## XVII. DESIGN SYSTEM

- 8pt Grid
- Pastel Semantic Color
- Typography Scale
- Consistent Radius
- Consistent Shadow
- Motion nhẹ
- Dark Mode
- Responsive
- WCAG AA

**Không tự ý tạo màu.**

---

## XVIII. SHARED COMPONENT

Component dùng chung **không biết nghiệp vụ**.

Ví dụ: Task Inbox · KPI Card · Alert Panel · Timeline · Drawer · Sheet · Table

Không được biết: PO · Warehouse · QA · Buyer

---

## XIX. ADAPTER

Mỗi module tự Adapter.

```
Warehouse → Warehouse Adapter → Shared Component
```

**Không sửa Shared Component.**

---

## XX. DATA

- Không Mock.
- Không Fake.
- `0` = `0`
- `NULL` = `-`
- Loading = Skeleton

---

## XXI. I18N

Giai đoạn 1: **100% Tiếng Việt**.

Nhưng mọi Label, mọi Message, mọi Validation, mọi Status đều phải dùng i18n.

**Không hardcode.**

Chuẩn bị: VN · EN · CN

---

## XXII. PERFORMANCE

Virtual Table · Lazy Load · Memo · Code Split · Suspense · Server Component · Streaming

**Không render dư.**

---

## XXIII. CLEAN CODE

SOLID · DRY · KISS · Composition · Feature Based · Type-safe · Production Ready

**Không duplicate.**

---

## XXIV. QUY TẮC TRƯỚC KHI VIẾT CODE

Claude Code **KHÔNG** được viết code ngay. Luôn làm theo thứ tự:

1. Phân tích nghiệp vụ.
2. Phân tích Data Flow.
3. Phân tích UX.
4. Đề xuất Architecture.
5. Đề xuất Folder Tree.
6. Đề xuất Component Tree.
7. Đánh giá rủi ro.
8. Xin xác nhận.
9. Mới bắt đầu code.

---

## XXV. QUY TẮC KIỂM THỬ

Sau khi code phải **chứng minh**.

Không được nói *"Tôi nghĩ đúng."*

Phải chứng minh bằng:

- Type Check
- Lint
- Build
- Snapshot
- Regression
- Accessibility
- Performance

**Không chứng minh coi như chưa hoàn thành.**

---

## XXVI. NGUYÊN TẮC CAO NHẤT

Mọi quyết định phải trả lời được:

1. Có giúp MD điều phối nhanh hơn không?
2. Có giúp Buyer minh bạch hơn không?
3. Có giảm Email/Zalo/Excel không?
4. Có giảm nhập liệu không?
5. Có giúp mở rộng lên **100.000 PO/năm** không?

**Nếu KHÔNG thì không được triển khai.**
