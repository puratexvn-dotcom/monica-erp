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

---

## XXVII. THAY ĐỔI CƠ SỞ DỮ LIỆU LÀ QUYẾT ĐỊNH KIẾN TRÚC

Mọi thay đổi **Schema, Migration, RLS, Permission, Policy** hoặc **dữ liệu
nghiệp vụ** đều là QUYẾT ĐỊNH KIẾN TRÚC. Claude **KHÔNG ĐƯỢC TỰ Ý THỰC HIỆN**.

Claude chỉ được làm ba việc, đúng thứ tự:

1. **Phân tích tác động** — đo trên cơ sở dữ liệu đang chạy, không suy từ tên
   bảng hay từ trí nhớ.
2. **Đề xuất phương án** — kèm cái được, cái mất, và cái sẽ gãy.
3. **Chờ phê duyệt** — rồi mới viết.

Điều này áp dụng cả khi thay đổi là *siết chặt* và có vẻ an toàn: nới hay siết
đều làm lệch hành vi của hệ thống đang chạy.

⚠️ Điều khoản này KHÔNG dừng lại ở lúc viết migration. Nếu trong lúc thực thi
một hạng mục ĐÃ ĐƯỢC DUYỆT mà phát hiện phải đổi thêm schema ngoài phần đã
duyệt, phải **dừng lại và hỏi**, không được tự nới phạm vi.

---

## XXVIII. NĂM QUY TẮC VÀNG THIẾT KẾ MIGRATION

Áp dụng từ **migration 024** trở đi.

### 1. Không lưu dữ liệu tính toán

Tuyệt đối không tạo cột lưu `delay_days`, `completion_percent`, `risk_score`…
Mọi chỉ số dẫn xuất phải tính tại chỗ từ dữ liệu gốc, hoặc qua SQL View.

*Vì sao:* số đã lưu sẽ lệch với dữ liệu gốc ngay lần đầu ai đó sửa dữ liệu gốc
mà quên chạy lại phép tính — và không có cách nào biết số nào đúng.

### 2. Không để VARCHAR tự do cho tập giá trị hữu hạn

Trạng thái và danh mục hữu hạn (`status`, `incoterm`, `currency`, `country`)
phải có `CHECK` hoặc bảng tham chiếu.

*Ranh giới:* "hữu hạn" nghĩa là đếm được và ổn định. Tên cảng, tên forwarder,
tên tàu KHÔNG thuộc loại này — ràng buộc chúng là tạo ra một danh mục phải bảo
trì suốt đời để đổi lấy con số không.

### 3. Vết dấu vận hành đầy đủ

Mọi bảng nghiệp vụ mới BẮT BUỘC có `created_at`, `created_by`, `updated_at`,
`updated_by`. Bảng có thao tác xoá nghiệp vụ BẮT BUỘC dùng xoá mềm
(`deleted_at`, `deleted_by`) — không `DELETE` cứng.

⚠️ Xoá mềm và ràng buộc `UNIQUE` **xung khắc nhau**: dòng đã xoá mềm vẫn chiếm
chỗ trong chỉ mục duy nhất. Phải dùng **chỉ mục duy nhất một phần**
(`UNIQUE ... WHERE deleted_at IS NULL`), nếu không thao tác huỷ sẽ khoá vĩnh
viễn cái vừa huỷ.

### 4. Idempotent và không phá vỡ chuỗi đang chạy

Chạy lại phải an toàn. Không `DROP` dữ liệu, không phá View/Function đang chạy.

*Ranh giới:* `DROP DEFAULT` và `DROP NOT NULL` KHÔNG thuộc phạm vi cấm — chúng
nới lỏng ràng buộc, không xoá một byte nào và không đổi kiểu cột, nên View phụ
thuộc vẫn chạy.

### 5. Giữ bản sắc khoá nghiệp vụ

Luôn duy trì khoá nghiệp vụ đọc được (`po_number`, `shipment_no`, `carton_code`,
`style_code`) bên cạnh `id` kỹ thuật, để đối soát và truy vết.

---

## XXIX. ĐIỂM CÂN BẰNG THỰC DỤNG — CHỐNG PHỨC TẠP HOÁ

Không tách bảng danh mục nhỏ lẻ không cần thiết. Không dựng thêm tầng trừu
tượng hay framework cho quy mô **chưa tồn tại**.

Mục tiêu tối thượng: **dữ liệu đúng · ràng buộc đúng · modular monolith sạch**.

Mọi đề xuất thêm bảng, thêm tầng, thêm khuôn mẫu phải trả lời được: hôm nay
KHÔNG có nó thì hỏng chuyện gì?


---

# XXX. ĐỐI TÁC VẬN HÀNH BÊN NGOÀI

> **MỨC ƯU TIÊN: TỐI CAO.** Điều này áp dụng cho MỌI phân hệ hiện tại và tương
> lai. Phát hiện bất kỳ thiết kế nào vi phạm — dù đã chạy trên production —
> phải **DỪNG LẠI VÀ BÁO CÁO** trước khi đi tiếp.

## 1. Triết lý

MONICA MOS **không** phân quyền theo màn hình.
MONICA MOS **không** phân quyền chỉ theo vai trò.

```
Identity → Assignment → Resource Scope → Permission → Action
```

Vai trò chỉ là **nhóm quyền mặc định**. Quyền thật luôn được quyết bởi:

> **"Monica đã giao việc gì cho người đó."**

Chứ không phải *"người đó là ai."*

## 2. Nhà thầu phụ là gì

Nhà thầu phụ **không** phải nhân viên. **Không** phải khách hàng. **Không**
phải nhà cung cấp.

Họ là **ĐỐI TÁC VẬN HÀNH BÊN NGOÀI** — trực tiếp tham gia sản xuất, với hai
trách nhiệm: **theo dõi tiến độ** và **báo cáo tiến độ**.

Cấm thiết kế họ như người chỉ đọc. Cũng cấm thiết kế họ như nhân viên nội bộ.

## 3. Hai kiểu phân quyền SAI

```
Role == subcon  →  cho xem tất cả      ✗ SAI
Role == subcon  →  khoá tất cả          ✗ SAI
```

Đúng: **mỗi mẩu dữ liệu phải trả lời được** *"Monica có giao cái này cho nhà
thầu đó không?"* — Không thì **DENY**. Có thì **ALLOW theo phạm vi**.

## 4. Mô hình phân công

Nhà thầu chỉ tồn tại khi có **Assignment**:

```
PO → Factory → Building → Floor → Line → Operation → Bundle → Quantity
   → Subcon → Assignment
```

Đây mới là nguồn xác định quyền. **Không dùng vai trò.**

## 5. Phạm vi tài nguyên

Nhà thầu chỉ chạm được PO · Line · Operation · Bundle · Material · Cut Ticket ·
Hourly Production · QA · Shipment · Document **nằm trong Assignment của chính
họ**. Ngoài Assignment: tuyệt đối không.

Không thấy PO khác · nhà máy khác · chuyền khác · khách hàng khác · lô hàng
khác · vật tư khác.

## 6. Họ có TRÁCH NHIỆM GHI, không chỉ đọc

Nhà thầu **bắt buộc** cập nhật, theo Assignment: sản lượng theo giờ · trạng
thái chuyền · trạng thái máy · dừng máy · kiểm giữa chuyền · AQL · lỗi · ảnh ·
video · tiêu hao vật tư · tiến độ sản xuất · tiến độ xuất hàng.

## 7. Báo cáo ngày là BẮT BUỘC

Mỗi Assignment phải có **Daily Report**: ngày · kế hoạch · sản lượng · lỗi ·
tái chế · dừng máy · sự cố · yêu cầu hỗ trợ · ghi chú.

Chưa gửi thì Assignment phải hiện **`REPORT MISSING`** trên bảng điều khiển —
Giám đốc, Merchandiser và QA đều nhìn thấy.

## 8. Bộ máy phân quyền

Quyền **không** dựa trên màn hình, mà dựa trên:

```
Principal → Assignment → Resource → Action
```

Ví dụ: `Subcon A → Assignment 102 → PO24001 → Line 5 → Hourly Log → WRITE`,
nhưng `PO24002 → DENY`.

## 9. Khách hàng khác nhà thầu

| | Được làm |
|---|---|
| **Buyer** | Đọc · Duyệt · Bình luận · Tải về |
| **Subcon** | Đọc · Tạo · Sửa · Tải lên · **Báo cáo** · Bình luận |

Khách hàng **không** ghi sản lượng. Nhà thầu **bắt buộc** ghi sản lượng.

## 10. Nhà thầu TUYỆT ĐỐI không được xem

Hồ sơ tài chính · giá bán cho khách · giá vốn nội bộ · lợi nhuận · nhà thầu
khác · nhà máy khác · danh sách nhân sự · lương · ghi chú chiến lược · bảng
điều khiển quản trị · bảng điều khiển Giám đốc · phân tích AI nội bộ.

## 11. Nhà thầu ĐƯỢC xem

PO được giao · sơ đồ chuyền · công đoạn · bó bán thành phẩm · phiếu cắt · vật
tư được cấp · QA **của chính họ** · lô hàng **của chính họ** · tài liệu **của
chính họ** · tiến độ ngày · dòng thời gian sản xuất.

## 12. JWT chỉ mang DANH TÍNH, không mang QUYỀN

```
Identity → Assignment → Permission Engine → Resource Scope
```

**Cấm viết cứng `subcon_id` trong bất kỳ logic nghiệp vụ nào.**

## 13. API

Mọi endpoint của nhà thầu phải xác định đủ: danh tính hiện tại → Assignment →
quyền → tài nguyên → hành động.

**Cấm truy vấn thẳng theo `subcon_id` mà bỏ qua Assignment.**

## 14. Sáu câu hỏi bắt buộc trước khi hợp nhất

Mọi tính năng đụng tới nhà thầu, phải tự trả lời:

1. Nhà thầu có nhìn thấy dữ liệu **ngoài** Assignment không?
2. Nhà thầu có **cập nhật được** dữ liệu trong Assignment của họ không?
3. Nhà thầu có sửa được dữ liệu của Assignment **khác** không?
4. Assignment kết thúc thì quyền có **tự mất** không?
5. Báo cáo ngày có **bắt buộc** không?
6. Giám đốc có thấy Assignment nào **chưa báo cáo** không?

Bất kỳ câu nào chưa đạt: **KHÔNG ĐƯỢC HỢP NHẤT.**

## 15. Nguyên tắc bất biến

Nhà thầu không phải người dùng nội bộ, cũng không phải khách hàng. Monica chỉ
giao cho họ **một phần công việc**. Vì vậy họ **chỉ thấy những gì Monica giao**,
nhưng **chịu trách nhiệm cập nhật đầy đủ mọi dữ liệu phát sinh** trong phần
việc đó.

Mọi thiết kế UI, API, CSDL, RLS, RBAC, Service, Hook và logic nghiệp vụ đều
phải tuân thủ tuyệt đối.

---

### ⚠️ GHI NHẬN NỢ KIẾN TRÚC — TÌNH TRẠNG NGÀY 31/07/2026

Migration **025** hiện đang cài đặt đúng kiểu **`Role == subcon → khoá theo
danh sách bảng`** — chính là kiểu SAI thứ hai ở mục 3.

Nó được chấp nhận như một **biện pháp cầm máu**: trước đó nhà thầu đọc được
`financial_records`, `profiles`, `prod_logs` và cả danh sách nhà thầu khác, và
**ghi được** vào `financial_records`. Bịt lỗ trước, làm đúng sau.

Phần còn thiếu để đạt Điều XXX:

- **Chưa có bảng `assignments`** — không có gì nối người dùng → nhà thầu → PO.
- **Chưa có Permission Engine** — quyền vẫn suy từ vai trò trong JWT.
- **Chưa có Daily Report** và cảnh báo `REPORT MISSING`.
- **Nhà thầu vẫn đọc được TOÀN BỘ bảng `orders`** (cố ý mở để module /subcon
  chạy) — vi phạm mục 5 và mục 6.
- **Nhà thầu chưa GHI được gì** — trái mục 6 và mục 9, họ đang bị thiết kế như
  người chỉ đọc.

Nợ này phải trả trong phase xây dựng Cổng Đối tác. Không được coi 025 là xong.
