# 09 · FOLDER TREE

## 1. Nguyên tắc đặt tệp

Theo đúng cấu trúc đã dùng suốt Phase 2–6, không phát minh khuôn mới:

```
lib/mos/            Domain thuần — không React, không Supabase
_services/          Nghiệp vụ + truy vấn, 'server-only'
_actions/           Server Action, cầu nối duy nhất cho client
components/         Giao diện — không tính toán nghiệp vụ
supabase/migrations/  SQL
```

## 2. Cây tệp

```
lib/mos/
├── assignment.ts                  Domain: trạng thái, chuyển đổi, thiếu báo cáo
├── partner.ts                     Domain: loại đối tác, tài nguyên, hành động
├── use-assignments.ts             Hook — phía Monica
├── use-my-assignments.ts          Hook — phía đối tác
└── use-assignment-realtime.ts     Kênh riêng lọc theo assignment_id

app/(dashboard)/assignments/                    ◄── MÀN HÌNH CỦA MONICA
├── page.tsx                       Danh sách + bộ lọc
├── assignments-client.tsx         Adapter (Điều XIX)
├── [assignmentId]/
│   └── page.tsx                   Chi tiết một Assignment
├── _services/
│   ├── guard.ts                   Chốt quyền, khuôn của /md và /kho
│   ├── assignment.service.ts      Đọc/ghi Assignment
│   ├── partner.service.ts         Đọc/ghi Partner
│   └── report-status.service.ts   REPORT MISSING
└── _actions/
    ├── assignment.client.ts
    └── partner.client.ts

app/(dashboard)/partner/                        ◄── CỔNG ĐỐI TÁC (CHUNG)
├── page.tsx                       Việc được giao của tôi
├── partner-client.tsx             Adapter
├── [assignmentId]/
│   └── page.tsx                   Chi tiết + form báo cáo ngày
├── _services/
│   ├── guard.ts
│   ├── partner-portal.service.ts
│   └── daily-report.service.ts
└── _actions/
    └── partner-portal.client.ts

components/mos/assignment/
├── assignment-card.tsx            Thẻ một Assignment
├── assignment-status-chip.tsx     Nhãn trạng thái
├── assignment-flow-bar.tsx        Thanh 8 bước (dùng lại khuôn FlowBar Phase 6)
├── scope-summary.tsx              "PO · chuyền · công đoạn"
├── daily-report-form.tsx          Form báo cáo ngày
├── report-missing-badge.tsx       Cảnh báo thiếu báo cáo
└── partner-picker.tsx             Chọn đối tác

lib/dictionaries/
└── assignment.ts                  Từ điển VN · EN · CN

supabase/migrations/
├── 027_partner_domain.sql
├── 028_factory_operation.sql
├── 029_assignment_core.sql
├── 030_assignment_functions.sql
├── 031_assignment_rls.sql         ◄ điểm không quay lại
└── 032_drop_transitional_rls.sql  gỡ 025 · 026
```

## 3. Vì sao **một** cổng đối tác chứ không phải bốn

Điều XXX vẽ Buyer Portal · Subcon Portal · Supplier Portal · Forwarder Portal ·
Auditor Portal. Nhưng cả năm đều trả lời cùng ba câu hỏi:

```
Tôi được giao việc gì?     →  danh sách Assignment
Việc này gồm những gì?     →  phạm vi + tài nguyên
Tôi phải báo cáo gì?       →  ma trận quyền quyết định form nào hiện ra
```

Dựng năm thư mục là năm lần lặp lại cùng một khung, năm chỗ để lệch nhau. Một
`/partner` đọc `partner_type` rồi vẽ đúng phần được phép — **ma trận quyền
quyết định giao diện**, không phải thư mục quyết định.

Đây là Điều XXIX: không dựng bốn tầng trừu tượng cho quy mô chưa tồn tại. Hôm
nay có **0 tài khoản Buyer**, **1 tài khoản Subcon**, 0 Supplier, 0 Forwarder.

Khi một loại đối tác thật sự cần màn hình khác hẳn, tách ra lúc đó — tách một
thư mục đã chạy dễ hơn hợp nhất năm thư mục đã lệch.

## 4. `/subcon` cũ đi về đâu

**Giữ nguyên, không xoá.** Nó thành màn hình **quản lý gia công phía Monica** —
đúng bản chất mà đo đạc cho thấy: nó lập đơn gia công, xuất bó, nhận bó về, tức
là việc của kho và merchandiser.

Vai trò `subcon` sẽ được chuyển khỏi `/subcon` sang `/partner` khi cổng mới
chạy. Lúc đó `MODULE_ACCESS.subcon` đổi từ `['/subcon']` thành `['/partner']`,
và `/subcon` chỉ còn nội bộ.

**Không xoá `/subcon`.** Nó có nghiệp vụ thật đang chạy, và Điều "nghiêm cấm
đập đi xây lại" áp dụng.

## 5. Ranh giới module

```
assignments/  ──đọc──►  orders · sewing_lines · cut_bundles · profiles · partners
              ──ghi──►  CHỈ bảng của chính nó

partner/      ──đọc──►  assignments · tài nguyên trong phạm vi
              ──ghi──►  assignment_daily_reports · hourly_production_logs
                        qa_audit_reports · subcon_receipt_logs

md/ kho/ qa/  KHÔNG import gì từ assignments/
```

Assignment Engine **không ghi vào bảng của phân hệ khác**. Nếu một ngày nó cần
sửa `orders`, đó là dấu hiệu ranh giới đã sai — không phải dấu hiệu cần thêm
quyền.

Ngược lại, `lib/mos/assignment.ts` là Domain thuần nên **bất kỳ phân hệ nào
cũng import được**, giống `po-flow.ts` đang được `/md` và Trung tâm Xuất hàng
dùng chung.

## 6. Số phân hệ không đổi

Ràng buộc bất di bất dịch: **12 phân hệ, 4 nút bottom nav**.

```
/assignments  →  KHÔNG phải phân hệ mới. Là màn hình bên trong /md
                 (merchandiser giao việc) — hoặc /kho tuỳ quyết định
                 nghiệp vụ. Không thêm nút nav.

/partner      →  THAY THẾ /subcon và /buyer trong nav của đối tác.
                 Đối tác chỉ thấy đúng một mục. Không tăng số phân hệ.
```

⚠️ Nếu Kiến trúc sư muốn `/assignments` là mục nav riêng cho nội bộ, đó là
**thay đổi ràng buộc 12 phân hệ** và cần quyết định tường minh. Tôi không tự
làm.

## 7. Bài kiểm

```
scratchpad/
├── verify-assignment-domain.mjs   Domain thuần, biên dịch TS rồi chạy thật
├── live-assignment.mjs            CSDL thật: tạo, chuyển trạng thái, dọn sạch
├── probe-assignment-rls.mjs       Hai đối tác, chứng minh không thấy chéo
├── probe-assignment-expiry.mjs    Hết hạn → quyền tắt
├── matrix-assignment.mjs          Mọi bảng × 14 vai trò, chống mất điện
└── probe-report-missing.mjs       5 ngày, báo 3, phải ra đúng 2
```

Sáu bộ, chạy cùng 18 bộ đang có. Mọi bộ đều phải **dọn sạch và chứng minh
không dư lượng** — và **khôi phục bằng giá trị đã chụp**, không bằng chuỗi
cứng (bài học `probe-026` đã làm hỏng tên một nhà thầu thật).
