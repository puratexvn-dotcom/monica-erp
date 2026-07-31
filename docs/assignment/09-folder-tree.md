# 09 · FOLDER TREE

> ⚠️ **MỘT PHẦN TÀI LIỆU NÀY ĐÃ BỊ THAY THẾ** (ADR đã được duyệt 01/08/2026) bởi
> [ADR-001](ADR-001-site-and-operation.md) (01/08/2026):
> `factories` → **`production_sites`** · **KHÔNG** tạo bảng `operations`
> (dùng `style_operations` đã có) · **NULL không bao giờ nghĩa là "tất cả"** —
> phạm vi tuyên bố tường minh bằng `scope_level`.


> **Bản 2** — sửa theo Quyết định Kiến trúc ngày 31/07/2026.
> **Bản 1 đề xuất một cổng `/partner` chung. Kiến trúc sư đã bác.**
> Quyết định 6: một Business Domain, **năm Portal giao diện riêng**.

## 1. Nguyên tắc

Theo đúng cấu trúc đã dùng suốt Phase 2–6, không phát minh khuôn mới:

```
lib/mos/              Domain thuần — không React, không Supabase
_services/            Nghiệp vụ + truy vấn, 'server-only'
_actions/             Server Action — cầu nối duy nhất cho client
components/           Giao diện — không tính toán nghiệp vụ
supabase/migrations/  SQL
```

Cộng thêm nguyên tắc của Quyết định 6:

> **Business Domain dùng chung. Giao diện tách riêng.**

## 2. Cây tệp

```
lib/mos/
├── assignment.ts                  Domain: trạng thái, chuyển đổi, thiếu báo cáo
├── partner.ts                     Domain: loại đối tác, tài nguyên, hành động
├── use-assignments.ts             Hook — phía Monica
├── use-my-assignments.ts          Hook — dùng CHUNG cho mọi Portal
└── use-assignment-realtime.ts     Kênh lọc theo assignment_id

app/(dashboard)/md/assignments/                 ◄── QUYẾT ĐỊNH 2
├── page.tsx                       Danh sách + bộ lọc
├── assignments-client.tsx         Adapter (Điều XIX)
├── [assignmentId]/page.tsx        Chi tiết
├── _services/
│   ├── assignment.service.ts
│   ├── partner.service.ts
│   └── report-status.service.ts
└── _actions/
    ├── assignment.client.ts
    └── partner.client.ts

app/(dashboard)/_partner-core/                  ◄── DÙNG CHUNG CHO 5 PORTAL
├── guard.ts                       Chốt quyền đối tác
├── partner-portal.service.ts      getMyAssignments · acceptAssignment
├── daily-report.service.ts        submitDailyReport
└── portal.client.ts               Server Action dùng chung

app/(dashboard)/subcon/            ◄── Portal Đối tác Sản xuất (ĐÃ CÓ)
app/(dashboard)/buyer/             ◄── Portal Khách hàng (ĐÃ CÓ)
app/(dashboard)/supplier/          ◄── Portal Nhà cung cấp   (mới)
app/(dashboard)/forwarder/         ◄── Portal Giao nhận      (mới)
app/(dashboard)/auditor/           ◄── Portal Giám định      (mới)
   mỗi thư mục:
   ├── page.tsx                    Giao diện CHUYÊN BIỆT của loại đó
   └── *-client.tsx                Adapter — gọi _partner-core

components/mos/assignment/
├── assignment-card.tsx            Thẻ Assignment
├── assignment-status-chip.tsx     Nhãn trạng thái
├── assignment-flow-bar.tsx        Thanh 8 bước (khuôn FlowBar, Phase 6)
├── scope-summary.tsx              "PO · chuyền · công đoạn"
├── daily-report-form.tsx          Form báo cáo ngày
├── report-missing-badge.tsx       Cảnh báo thiếu báo cáo
└── partner-picker.tsx             Chọn đối tác

lib/dictionaries/assignment.ts     Từ điển VN · EN · CN

supabase/migrations/
├── 027_partner_domain.sql         Partner Domain
├── 028_factory_operation.sql      Factory + Operation
├── 029_assignment_domain.sql      Assignment Domain (4 bảng, I-8)
├── 030_permission_engine.sql      Permission Engine (ma trận + 5 hàm + view)
├── 031_assignment_rls.sql         RLS            ◄ điểm không quay lại
└── 032_cleanup.sql                Cleanup — gỡ 025 · 026
```

⚠️ **Quyền được ĐỊNH NGHĨA ở 030, chỉ THỰC THI ở 031** (Quyết định 4 tinh
chỉnh). Bản trước để bảng `partner_permissions` trong 027 — sai về khái niệm:
ma trận quyền thuộc Permission Engine, không thuộc sổ danh tính đối tác.

## 3. Vì sao `_partner-core` chứ không nhân bản năm lần

Quyết định 6 nói *"mỗi Portal chỉ là một giao diện chuyên biệt trên cùng một
Business Domain"*. Câu đó vạch ranh giới rất rõ:

```
KHÁC NHAU  →  page.tsx · component · từ ngữ · bố cục
DÙNG CHUNG →  service · domain · hook · phân quyền
```

Nếu năm Portal mỗi cái có `partner-portal.service.ts` riêng, thì có **năm bản
cài đặt của cùng một luật quyền**, và chúng sẽ lệch nhau. Lỗi Phase 5 đã cho
thấy chuyện gì xảy ra khi hai tầng nói hai điều khác nhau — người dùng nhận
được một câu sai sự thật.

`_partner-core` đặt tên có gạch dưới đầu để Next.js **không** biến nó thành
route. Cùng quy ước với `_services` và `_actions` đang dùng.

## 4. Giao diện năm Portal khác nhau ở đâu

| Portal | Màn hình chính | Ghi cái gì |
|---|---|---|
| **Subcon** *(Production)* | Việc được giao · sản lượng theo giờ · bó hàng | sản lượng · lỗi · tiêu hao · báo cáo ngày |
| **Service** | Bó hàng nhận / trả · tiến độ dịch vụ | nhận · trả · lỗi · báo cáo ngày |
| **Supplier** | Vật tư phải giao · lịch giao | tiến độ giao · báo cáo ngày |
| **Forwarder** | Lô hàng · chứng từ · mốc ETD/ATD/ETA/ATA | mốc thời gian · chứng từ |
| **Auditor / Inspection** | Lô cần giám định · kết quả AQL | kết quả AQL · ảnh · biên bản |
| **Buyer** | Tiến độ đơn · mẫu · thay đổi · lô hàng | duyệt · bình luận |

Sáu bố cục thật sự khác nhau. Đây là lý do Quyết định 6 đúng còn đề xuất "một
cổng chung" của tôi sai: tôi tối ưu cho việc **không lặp khung**, nhưng cái phải
tránh lặp là **luật**, không phải màn hình.

## 5. `/subcon` hiện tại đi về đâu

**Giữ nguyên, không xoá.** Đo được: nó lập đơn gia công, xuất bó, nhận bó về —
đó là việc của **Monica**, không phải của nhà thầu.

Lộ trình:

```
Bước 1  /subcon giữ nguyên, đã mở cho md · kho · khotruong · totruongmay · giamdoc
        (migration 026 + thay đổi MODULE_ACCESS)

Bước 2  Dựng /subcon/portal — giao diện cho ĐỐI TÁC, đọc Assignment

Bước 3  MODULE_ACCESS.subcon: ['/subcon'] → ['/subcon/portal']
        /subcon còn lại thuần nội bộ
```

Không xoá gì. Nghiệp vụ đang chạy thật, và "nghiêm cấm đập đi xây lại".

## 6. Ranh giới module

```
md/assignments/   ──đọc──►  orders · sewing_lines · cut_bundles · profiles · partners
                  ──ghi──►  CHỈ bảng của chính nó

_partner-core/    ──đọc──►  assignments · tài nguyên trong phạm vi
                  ──ghi──►  assignment_daily_reports · hourly_production_logs
                            qa_audit_reports · subcon_receipt_logs

kho/ qa/ ke-toan/  KHÔNG import gì từ md/assignments/
```

Assignment Engine **không ghi vào bảng của phân hệ khác**. Nếu một ngày nó cần
sửa `orders`, đó là dấu hiệu ranh giới sai — không phải dấu hiệu cần thêm quyền.

Ngược lại `lib/mos/assignment.ts` là Domain thuần nên **mọi phân hệ import
được**, giống `po-flow.ts` đang được `/md` và Trung tâm Xuất hàng dùng chung.

## 7. Ràng buộc 12 phân hệ — ĐÃ ĐƯỢC ĐỊNH NGHĨA

> **Quyết định 3 (tinh chỉnh):** "12 phân hệ" đếm theo **Business Capability**,
> không đếm theo Route.

**External Collaboration là MỘT phân hệ.** Năm Portal — Buyer · Subcon ·
Supplier · Forwarder · Auditor — đều là *giao diện* thuộc cùng phân hệ đó.

```
Business Capability          Route
─────────────────────        ─────────────────────────────────────
External Collaboration  ──►  /buyer · /subcon · /supplier
        (1 phân hệ)          /forwarder · /auditor
                             + _partner-core (dùng chung)

Merchandiser            ──►  /md · /md/assignments · /md/po/[id]
        (1 phân hệ)
```

Cách đếm này giải thích luôn vì sao `/md/po/[poId]` với tám lát cắt không làm
tăng số phân hệ: nó là **một** năng lực nghiệp vụ, nhiều màn hình.

Số phân hệ **không đổi**. Ba route mới khi tới lượt cũng không đổi.

Và ba Portal đó **chưa cần dựng** — hôm nay có 0 Supplier, 0 Forwarder,
0 Inspection, 0 Auditor (Điều XXIX).

## 8. Bài kiểm

```
scratchpad/
├── verify-assignment-domain.mjs   Domain thuần, biên dịch TS rồi chạy thật
├── live-assignment.mjs            CSDL thật: tạo · chuyển trạng thái · dọn sạch
├── probe-assignment-rls.mjs       Hai đối tác, chứng minh không thấy chéo
├── probe-commercial-terms.mjs     Điều khoản: thấy của mình, KHÔNG của người khác
├── probe-trigger-boundary.mjs     Trigger KHÔNG chứa quy trình (Quyết định 5)
├── probe-assignment-expiry.mjs    Hết hạn → quyền tắt
├── probe-buyer-no-assignment.mjs  Buyer KHÔNG đi qua Assignment (bất biến I-8)
├── matrix-assignment.mjs          Mọi bảng × 14 vai trò — chống mất điện
└── probe-report-missing.mjs       5 ngày, báo 3, phải ra đúng 2
```

Tám bộ, chạy cùng 18 bộ hiện có. Mọi bộ phải dọn sạch và **khôi phục bằng giá
trị đã chụp**, không bằng chuỗi cứng — `probe-026` từng làm hỏng tên một nhà
thầu thật vì lỗi đó.
