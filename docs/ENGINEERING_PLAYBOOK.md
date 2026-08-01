# MONICA MOS — ENGINEERING PLAYBOOK

> **Thứ bậc:** [`MONICA_CONSTITUTION.md`](MONICA_CONSTITUTION.md) là **luật tối
> cao** (12 nguyên tắc). Tài liệu này là **quy tắc kỹ thuật chi tiết** thi hành
> 12 nguyên tắc đó.
>
> Khi hai tài liệu mâu thuẫn, **Hiến pháp thắng** — và mâu thuẫn đó phải được
> sửa ở đây, không phải được bỏ qua.

## Vì sao tài liệu này tồn tại

34 điều dưới đây từng **là** Hiến pháp. Ngày 01/08/2026 Kiến trúc sư ban hành
bản **vFinal** gồm 12 nguyên tắc tối cao, và tuyên bố *"bất kỳ quy tắc kỹ thuật
chi tiết nào khác sẽ được quy định tại DOMAIN_GLOSSARY.md và
ENGINEERING_PLAYBOOK.md"*.

⚠️ **KHÔNG một điều nào bị xoá.** Toàn bộ 34 điều nằm nguyên văn phía dưới,
không sửa một chữ. Phần lớn chúng sinh ra từ **một sự cố có thật** — xoá đi là
xoá luôn lý do, và người sau sẽ phá bỏ quy tắc ngay lần đầu thấy bất tiện.

⚠️ **Đánh số ở đây ĐỘC LẬP với Hiến pháp.** Cả hai đều dùng số La Mã I–XII, nên
khi trích dẫn phải nói rõ nguồn:

```
"Hiến pháp Điều IX"   → Globalization (12 nguyên tắc)
"Playbook Điều IX"    → Event Driven  (quy tắc chi tiết)
```

⚠️ **Chú thích trong mã nguồn:** 62 chỗ trong `app/`, `lib/`, `components/`,
`supabase/` đang trích dẫn `Điều <số>`. Tất cả đều viết TRƯỚC ngày ban hành
Hiến pháp vFinal, nên **đều trỏ về Playbook**.

Bảy chỗ rơi vào khoảng I–XII — tức trùng số với Hiến pháp mới — đã được sửa
thành `Playbook Điều <số>` để không ai đọc nhầm. 55 chỗ còn lại từ XIII trở lên
**không thể nhầm** (Hiến pháp chỉ có 12 điều) nên giữ nguyên, tránh khuấy động
một phase vừa commit mà không đổi được gì về độ an toàn.

## Bản đồ: điều chi tiết → nguyên tắc tối cao

| Playbook | Nội dung | Thi hành Hiến pháp |
|---|---|---|
| **I** | TRIẾT LÝ HỆ THỐNG | I · II |
| **II** | TRIẾT LÝ KINH DOANH | II |
| **III** | KIẾN TRÚC TỔNG THỂ | XII |
| **IV** | MERCHANDISER LÀ TRUNG TÂM DUY NHẤT | II |
| **V** | BUYER PORTAL | II |
| **VI** | PURCHASING | II |
| **VII** | KIẾN TRÚC PHẦN MỀM | XII |
| **VIII** | CORE ENGINE | III |
| **IX** | EVENT DRIVEN | VIII |
| **X** | WORKFLOW ENGINE | I |
| **XI** | AUDIT | VIII |
| **XII** | NOTIFICATION | XII |
| **XIII** | PERMISSION | II |
| **XIV** | AI ENGINE | VIII |
| **XV** | REALTIME | X |
| **XVI** | UI / UX | I |
| **XVII** | DESIGN SYSTEM | I |
| **XVIII** | SHARED COMPONENT | XII |
| **XIX** | ADAPTER | I · XII |
| **XX** | DATA | III · IX |
| **XXI** | I18N | IX |
| **XXII** | PERFORMANCE | X |
| **XXIII** | CLEAN CODE | VII |
| **XXIV** | QUY TẮC TRƯỚC KHI VIẾT CODE | I |
| **XXV** | QUY TẮC KIỂM THỬ | V |
| **XXVI** | NGUYÊN TẮC CAO NHẤT | VII |
| **XXVII** | THAY ĐỔI CƠ SỞ DỮ LIỆU LÀ QUYẾT ĐỊNH KIẾN TRÚC | IV |
| **XXVIII** | NĂM QUY TẮC VÀNG THIẾT KẾ MIGRATION | III · IV · XI |
| **XXIX** | ĐIỂM CÂN BẰNG THỰC DỤNG — CHỐNG PHỨC TẠP HOÁ | VII |
| **XXX** | ĐỐI TÁC VẬN HÀNH BÊN NGOÀI | II |
| **XXXI** | HIẾN PHÁP KIỂM THỬ | V |
| **XXXII** | DANH MỤC NGHIỆM THU TRƯỚC KHI HỢP NHẤT | VI |
| **XXXIII** | ARCHITECTURE DECISION RECORD (ADR) | IV |
| **XXXIV** | REQUEST ID — CHỐNG LẬP CHỨNG TỪ HAI LẦN | VIII · XI |

---

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

---

## XXXI. HIẾN PHÁP KIỂM THỬ

> **Mọi bài kiểm thử phá huỷ PHẢI dùng dữ liệu tạm. TUYỆT ĐỐI không `UPDATE`
> hay `DELETE` trực tiếp lên dữ liệu nghiệp vụ thật.**

### Ba mức, áp dụng theo thứ tự

**① Tạo dữ liệu dùng-một-lần rồi thử trên nó.** Ràng buộc có hay không, thứ mất
đi cũng chỉ là dữ liệu thử.

**② Nếu buộc phải chạm dòng thật: chụp giá trị TRƯỚC, khôi phục theo BẢN CHỤP.**
Không bao giờ khôi phục bằng chuỗi viết cứng.

**③ Có một mục kiểm đối chiếu lại chính bản chụp** ở cuối bài, cộng ảnh chụp
toàn bộ bảng trước/sau.

### Vì sao điều khoản này tồn tại

Ba lần vi phạm thật, tất cả đều do chính bài kiểm gây ra:

| Lần | Hậu quả |
|---|---|
| `probe-026` | ghi đè tên `SUB-GIAT-02` bằng chuỗi cứng — mất tên thật của một nhà thầu |
| `probe-subcon-rls` | để lại một dòng rác trong `financial_records` |
| `live-028` | **xoá mất đối tác `SC1`** vì thử `DELETE` lên dòng thật khi ràng buộc `RESTRICT` chưa tồn tại |

Lần thứ ba cho thấy mức ② chưa đủ: bản chụp chỉ cứu được thứ mình nhớ chụp.
Mức ① không phụ thuộc trí nhớ.

**Một bài kiểm tự làm bẩn cơ sở dữ liệu thì tệ hơn không có bài kiểm** — nó vừa
không chứng minh được gì, vừa để lại thiệt hại.

### Phụ lục XXXI-A — hai quy tắc bổ sung, ban hành 01/08/2026

> *Văn bản Điều XXXI ở trên giữ nguyên vẹn. Phần này là bổ sung, không sửa đổi.*

Hai quy tắc dưới đây sinh ra từ hai sự cố có thật trong cùng một ngày, và cùng
một gốc: **dùng thao tác GHI để trả lời một câu hỏi về CẤU HÌNH.**

**K-1 · Bảng chỉ-ghi-thêm kiểm bằng LƯỢC ĐỒ, không bằng GHI THỬ.**

> *"Append-only tables must be verified by schema inspection, never by
> destructive test writes."* — Chief Architect

Sự cố: để xác nhận trigger chặn `UPDATE`/`DELETE` trên sổ cái đã được gắn lại,
tôi ghi một dòng sổ cái rồi thử xoá. Lệnh xoá bị chặn — **đúng như thiết kế** —
nên dòng đó kẹt lại vĩnh viễn, và phải viết Maintenance Script `M002` để dọn.
Trớ trêu: bài kiểm thất bại **chính vì** thứ nó kiểm đang hoạt động đúng.

Phép kiểm đúng là đọc `pg_trigger`. `M001` đã chứng minh y hệt như vậy trước đó.

**K-2 · KHÔNG đo quyền GHI bằng cách GHI.**

Sự cố: để đo ai ghi được bảng nào, tôi gửi `INSERT {}` — thiếu mọi cột bắt buộc
— rồi đọc mã lỗi (`42501` = RLS chặn · `23xxx` = RLS cho qua, ràng buộc chặn).
Kỹ thuật này dựa vào giả định ngầm: **mọi bảng đều có ràng buộc chặn lại.**

Bốn bảng có mọi cột nullable. Ở đó `INSERT {}` **thành công** — sinh 8 dòng rác,
gồm cả `financial_records` và `qa_logs`. Đã dọn, số dòng đối chiếu về nguyên
trạng, nhưng thiệt hại là có thật.

Phép kiểm đúng: đọc `pg_policies`, hoặc chạy trong giao dịch kết thúc bằng
`ROLLBACK`.

⚠️ **Điểm chung của cả hai:** tôi hỏi một câu về **cấu hình** (trigger còn
không · policy cho ai ghi) bằng một thao tác lên **dữ liệu**. Câu hỏi về cấu
hình phải hỏi cấu hình.

---

## XXXII. DANH MỤC NGHIỆM THU TRƯỚC KHI HỢP NHẤT

Mọi migration, trước khi commit, phải tự kiểm đủ **mười hai** mục:

```
☐  ADR                      quyết định kiến trúc đã được ghi và duyệt
☐  Architecture Review      tự soi lại theo Hiến pháp
☐  Regression               toàn bộ bộ kiểm thử cũ vẫn xanh
☐  Performance              đo ĐAN XEN với đường cơ sở, không đo cụm
☐  Security                 ma trận vai trò, phiên đăng nhập THẬT
☐  Snapshot                 ảnh chụp toàn bộ bảng, không dư lượng
☐  Live Verification        kiểm trên CSDL đang chạy, không chỉ trên giấy
☐  No Fake Data             không sinh dữ liệu mẫu để lấp chỗ trống
☐  No Silent Semantic Change  không đổi ngữ nghĩa dữ liệu một cách âm thầm
☐  Rollback Strategy        ghi rõ hoàn tác được gì, KHÔNG hoàn tác được gì
☐  Constitution Compliance  đối chiếu từng điều khoản liên quan
☐  Final Self Review        đọc lại toàn bộ như người ngoài
```

**Chỉ khi TOÀN BỘ đều đạt mới được commit.** Một mục chưa đạt là dừng lại và
báo cáo, không phải ghi chú "sẽ làm sau".

---

# XXXIII. ARCHITECTURE DECISION RECORD (ADR)

> Ban hành cùng lúc với phê duyệt Migration 029. Áp dụng **từ 029 trở đi**.

## 1. Khi nào bắt buộc

Mọi Migration làm thay đổi **Domain Model** hoặc **Architecture** đều **BẮT BUỘC**
có một ADR.

ADR **không phải tài liệu hành chính.** Nó ghi lại **lý do** của quyết định kiến
trúc, để cả con người và AI hiểu được bối cảnh khi đọc lại sau này.

> **SQL mô tả HỆ THỐNG ĐÃ THAY ĐỔI NHƯ THẾ NÀO.**
> **ADR mô tả VÌ SAO HỆ THỐNG PHẢI THAY ĐỔI.**

Nếu chỉ còn SQL mà không còn ADR, thì sau vài năm cả con người và AI đều khó
hiểu được ý đồ kiến trúc ban đầu.

## 2. Sáu mục tối thiểu

Mỗi ADR dài khoảng **1–2 trang**, gồm:

| Mục | Nội dung |
|---|---|
| **1. Context** | Vì sao cần thay đổi · vấn đề hiện tại · **bằng chứng hoặc dữ liệu thực tế** |
| **2. Decision** | Quyết định được chọn · phạm vi áp dụng |
| **3. Alternatives Considered** | Những phương án đã cân nhắc · **vì sao không chọn** |
| **4. Consequences** | Lợi ích · đánh đổi · Technical Debt (nếu có) |
| **5. Rollback Impact** | Quay lui ảnh hưởng gì · có cần Migration bù không |
| **6. References** | Hiến pháp · Migration · ADR liên quan |

Mục **Context** phải mang **số liệu đo được**, không phải nhận định. "Bảng này ít
dùng" là nhận định; "bảng này 0 dòng" là bằng chứng.

Mục **Alternatives** là mục dễ bỏ nhất và **có giá trị nhất**: nó là thứ duy nhất
trả lời được câu hỏi *"sao không làm cách kia?"* mà người đọc sau chắc chắn sẽ hỏi.

## 3. Thứ tự chuẩn — không được đảo

```
Architecture Review
      ↓
    ADR                    ← phải PHÊ DUYỆT xong ở đây
      ↓
Migration Design Review
      ↓
Impact Analysis
      ↓
SQL Migration              ← chỉ được bắt đầu sau khi ADR duyệt
      ↓
Regression → Performance → Security → Snapshot → Commit
```

> **KHÔNG viết SQL trước khi ADR được phê duyệt.**

## 4. Definition of Done

ADR là **tài liệu chính thức của MONICA MOS** và là **một phần của Definition of
Done** đối với mọi Migration thay đổi Domain. Migration không có ADR là Migration
**chưa xong**, dù SQL đã chạy và mọi bài kiểm đã xanh.

## 5. Nơi lưu

```
docs/adr/README.md                        mục lục
docs/adr/ADR-NNN-<ten-ngan>.md            đánh số liên tục, không tái sử dụng số
```

ADR **không bao giờ bị xoá hay sửa lịch sử.** Một quyết định bị thay thế thì viết
ADR mới và đánh dấu ADR cũ là *Superseded by ADR-NNN* — vì lý do của một quyết
định sai vẫn là thông tin có giá trị.

## 6. Nợ chuyển tiếp đã ghi nhận

⚠️ **ADR-002 (Migration 029) được viết SAU SQL.** Chính sách này ban hành cùng
lúc với quyết định phê duyệt 029, nên 029 là **trường hợp chuyển tiếp duy nhất**.
Từ **030 trở đi** không có ngoại lệ.

---

# XXXIV. REQUEST ID — CHỐNG LẬP CHỨNG TỪ HAI LẦN

> Ban hành cùng migration 029c. Thiết kế đầy đủ: [ADR-003](adr/ADR-003-request-id.md).

## 1. Luật

> **Mọi bảng chứng từ nghiệp vụ CÓ THỂ LẬP MỚI đều phải có cột `request_id UUID`
> kèm chỉ mục duy nhất toàn phần. Không có ngoại lệ.**
> **Bảng chứng từ mới thiếu nó là bảng CHƯA HOÀN THÀNH.**

Áp dụng cho: PO · Assignment · Shipment · Settlement · QA Approval ·
Supplier Receipt · Payment — và mọi chứng từ của Buyer Portal, Subcon Portal,
Sales, HR, CRM, AI về sau.

## 2. Vì sao

Số nghiệp vụ sinh từ dãy số cơ sở dữ liệu. **Hai lần `INSERT` = hai chứng từ
thật, không thu hồi được, và KHÔNG ngoại lệ nào nổ ra.** Đây là lỗi im lặng
tuyệt đối: hệ thống chỉ đơn giản có hai phần việc giống hệt nhau.

`retry: 0` ở tầng ứng dụng chỉ chặn được **một** trong bốn đường gửi trùng.
Ba đường còn lại — bấm hai lần, trình duyệt gửi lại, hai tab — chỉ cơ sở dữ
liệu chặn được.

⚠️ Với **tác nhân AI**, thử lại là **hành vi bình thường của nó**, không phải
tai nạn. Khi Monica có tự động hoá, `request_id` chuyển từ lưới an toàn thành
**điều kiện hoạt động**.

## 3. Bốn thứ KHÔNG được nhầm lẫn

```
request_id  ≠  HTTP Request ID  ≠  Trace ID  ≠  Correlation ID
```

| | `request_id` | HTTP Request ID | Trace ID | Correlation ID |
|---|---|---|---|---|
| Định danh | **ý định lập chứng từ** | một lượt HTTP | chuỗi lời gọi | tiến trình |
| Ai sinh | trình duyệt, lúc **mở biểu mẫu** | hạ tầng | tầng truy vết | phía khởi tạo |
| **Gửi lại** | ⭐ **GIỮ NGUYÊN** | **ĐỔI** | **ĐỔI** | giữ nguyên |
| Sống ở đâu | **cột CSDL, vĩnh viễn** | nhật ký | hệ truy vết | nhật ký |

> **Phép thử một câu:** *bấm Gửi hai lần thì hai lần đó có cùng giá trị này
> không?* Không → **đã điền nhầm**, và bảo vệ đã mất trong im lặng.

## 4. Definition of Done

```
CREATE TABLE chứng từ mới  →  BẮT BUỘC gọi mos_add_request_id()
Create*DTO mới             →  BẮT BUỘC có trường requestId (không tuỳ chọn)
Service tạo mới            →  BẮT BUỘC bắt 23505 và TRẢ VỀ DÒNG CŨ với ok:true
Biểu mẫu mới               →  BẮT BUỘC sinh khoá lúc MỞ, không lúc BẤM
Bài kiểm sống              →  gửi HAI LẦN cùng khoá ⇒ đúng MỘT dòng
```

⚠️ Để `23505` nổi lên là **phản tác dụng**: người dùng thấy *"Mã này đã tồn
tại"* cho một thao tác **đã thành công**, tưởng là hỏng, rồi bấm lại với khoá
mới — tạo ra đúng bản trùng mà cả cơ chế sinh ra để chặn.

## 5. Thứ nó KHÔNG giải quyết

- **Hai người khác nhau** cùng lập một chứng từ giống nhau — hai khoá khác nhau,
  hợp lệ về kỹ thuật. Đó là bài toán *khoá nghiệp vụ*.
- **Ghi đè đồng thời** — bài toán *xung đột*, xem
  [ADR-004](adr/ADR-004-concurrency-control.md).
- **Thao tác lặp có chủ ý** — biểu mẫu sinh khoá mới sau mỗi lần thành công,
  nên việc này vẫn chạy bình thường, đúng như phải thế.

## 6. Triển khai theo giai đoạn — KHÔNG Big Bang

| Giai đoạn | Bảng |
|---|---|
| **029c** ✅ | `assignments` · `assignment_daily_reports` |
| **033** ⏳ | `shipments` · `orders` · `qa_logs` · `capa_logs` · `subcon_orders` · `subcon_receipt_logs` · `financial_records` |

⚠️ Chia giai đoạn là **yêu cầu về tính đúng đắn**, không phải để đỡ việc: cột và
nhánh bắt `23505` phải đi cùng nhau. Thêm cột vào một bảng mà service chưa biết
bắt lỗi là làm hỏng một phân hệ đang chạy.
