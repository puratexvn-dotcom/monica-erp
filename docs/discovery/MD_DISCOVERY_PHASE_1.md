# MD DISCOVERY — PHASE 1
## Khám phá sự thật nghiệp vụ của phân hệ Merchandising đang chạy

| Trường | Giá trị |
|---|---|
| **Ngày** | 2026-08-04 |
| **Mục đích** | Trả lời *"hệ thống hiện tại THỰC SỰ làm gì"* — không phải tìm lỗi, không phải đề xuất sửa |
| **Trạng thái thi hành** | 🧊 **ĐÓNG BĂNG** — không sửa mã, không sửa lược đồ, không migration |
| **Mô hình kiểm chứng** | Bốn tầng: Business Knowledge → Constitution → Live Database → Running Application |

---

## ⚠️ 0. TẦNG NÀO ĐÃ KIỂM ĐƯỢC, TẦNG NÀO CHƯA

| Tầng | Kiểm được? | Ghi chú |
|---|---|---|
| ① Business Knowledge | ✅ | Knowledge Base v1.0 |
| ② Constitution | ✅ | Hiến pháp v1.5 · 45 Điều |
| ③ Live Database | ⚠️ **MỘT PHẦN** | Đếm được số dòng và đo được hành vi đọc. **KHÔNG đọc được `pg_policies`** — PostgREST chỉ phơi bày schema `public` |
| ④ Running Application | ❌ **KHÔNG** | Không có trình duyệt nối vào phiên; không được nhập mật khẩu |

**Hệ quả bắt buộc:** không mục nào trong tài liệu này được gắn
`Verified + Implemented`. Trần cao nhất tôi được cấp là
`Verified (Business)` · `Verified (Database)` · `Verified (Architecture)`.

⚠️ **Nguyên tắc áp dụng xuyên suốt:** *bảng rỗng ≠ bảng an toàn*. Kết quả rỗng
chỉ chứng minh "không quan sát được dữ liệu", không bao giờ chứng minh
"không có lỗ rò".

---

## 1. EXECUTIVE SUMMARY — MD LÀ GÌ TRONG MONICA ONE

`Verified (Architecture)`

MD là **phân hệ lớn nhất** của hệ thống: **98 tệp · 19.058 dòng**, chiếm phần
lớn khối lượng nghiệp vụ đang có.

Về mặt chức năng, MD hiện là **trung tâm điều phối thương mại và triển khai
đơn hàng** — nó nắm toàn bộ chuỗi từ *khách hàng* tới *xuất hàng*, và bàn giao
sang các phân hệ khác ở khâu sản xuất và chất lượng.

Cấu trúc thật: **chỉ 3 route**.

| Route | Vai trò |
|---|---|
| `/md` | Command Center — 13 tab, chia 3 nhóm |
| `/md/po/[poId]` | Digital Twin của một đơn hàng — 5 lát cắt |
| `/md/assignments` | Giao việc cho đối tác ngoài |

**Ba đặc điểm quan trọng nhất phát hiện được:**

1. **MD gần như chỉ biết TẠO, không biết XOÁ hay HUỶ.** Trong 50 Server Action,
   chỉ có **3** thao tác xoá — và cả ba đều là xoá *dòng con*
   (`deleteCostingItem`, `deleteDocument`, `deleteStyleChild`). **Không có thao
   tác nào huỷ đơn, xoá đơn, xoá khách hàng hay xoá mã hàng.** `Verified (Architecture)`

2. **Dữ liệu nghiệp vụ gần như trống rỗng.** Đo trên CSDL thật: 8 bảng cốt lõi
   của MD đều **0 dòng**. MD **chưa được đưa vào vận hành thật**. `Verified (Database)`

3. **Hai thế hệ giao diện đơn hàng cùng sống**, và **năng lực của chúng khác
   nhau** — không phải bản mới thay bản cũ. `Verified (Architecture)`

---

## 2. TRÁCH NHIỆM NGHIỆP VỤ

### 2.1 THUỘC về MD `Verified (Architecture)`

| Trách nhiệm | Bằng chứng |
|---|---|
| Quản lý khách hàng và liên hệ | `createCustomer` · `createCustomerFull` · `addContact` |
| Tiếp nhận yêu cầu / hỏi hàng | `createInquiry` · `setInquiryStatus` |
| Chiết tính giá | `createCosting` · `addCostingItem` · `reviseCosting` · `setCostingStatus` |
| Quản lý mã hàng của khách | `createStyle` · `addStyleBom` · `addColorway` · `addSizeRange` · `addOperation` |
| Tiếp nhận và lập đơn hàng | `createPo` · `saveSizeBreakdown` |
| Theo dõi mẫu | `saveSample` |
| Lịch mốc T&A | `completeMilestone` |
| Đề nghị mua NPL | `createMaterialRequest` · `generateMaterialRequests` |
| Lệnh sản xuất | `createProductionOrder` · `generateProductionOrder` |
| Lệnh giao hàng | `createShipmentOrder` |
| Quản lý thay đổi | `createChangeRequest` · `decideChangeRequest` |
| Quản lý rủi ro | `saveRisk` |
| Tài liệu và thảo luận | `saveDocument` · `postComment` · `postCommentAnywhere` |
| Nhật ký kiểm toán | `writeAudit` |
| **Giao việc đối tác ngoài** | phân hệ con `assignments` — 8 hàm nghiệp vụ |

### 2.2 KHÔNG thuộc về MD `Verified (Architecture)`

| Không thuộc | Bàn giao cho |
|---|---|
| Thực thi sản xuất (cắt · may · hoàn thành) | Production |
| Kiểm chất lượng thực tế | Quality |
| Nhập xuất tồn kho | Warehouse |
| Kế toán, công nợ | Finance |
| Quản trị người dùng | Platform Services |

### 2.3 ⚠️ Ranh giới chưa rõ

`Needs Clarification`

- **`assignments` nằm trong MD** (`/md/assignments`) nhưng bản chất là giao việc
  sản xuất ra ngoài. Nó thuộc MD hay thuộc Subcontract?
- **`generateProductionOrder` nằm ở MD** — MD tạo lệnh sản xuất, nhưng thực thi
  lại ở phân hệ khác. Ai sở hữu vòng đời của `production_orders`?

---

## 3. BẢN ĐỒ NĂNG LỰC NGHIỆP VỤ

Ký hiệu: **KB** = Knowledge Base v1.0 · **HP** = Hiến pháp v1.5

| # | Năng lực | Hiện có | Thiếu | Tầm quan trọng | KB | HP |
|---|---|---|---|---|---|---|
| C1 | Quản lý khách hàng | ✅ đủ CRUD-tạo | không xoá được | Cao | §2 | §16.2 |
| C2 | Tiếp nhận hỏi hàng | ✅ `inquiries` | KB nói **không mặc định có RFQ** — MD lại lấy RFQ làm cửa vào chính | Trung bình | §3 | — |
| C3 | Chiết tính giá | ✅ có phiên bản (`reviseCosting`) | không thấy luồng **duyệt giá** theo vai trò | **Rất cao** | §4 | — |
| C4 | Quản lý mã hàng | ✅ BOM · màu · cỡ · công đoạn | giao diện BOM chỉ còn ở tệp chết | Cao | §3 | — |
| C5 | Tiếp nhận PO | ✅ | **không huỷ · không tách · không gộp · không nhân bản** | **Rất cao** | §5 | — |
| C6 | Quản lý mẫu | ⚠️ có `saveSample`, 7 chặng đúng chuẩn | giao diện **chỉ ở thế hệ cũ** | **Rất cao** — KB xếp là **năng lực độc lập** | §7 | — |
| C7 | Lịch T&A | ⚠️ có bảng + `completeMilestone` | giao diện **chỉ ở thế hệ cũ**; quy tắc cảnh báo **chết** | **Rất cao** | — | — |
| C8 | Mua NPL | ⚠️ `material_requests` | không có ngày NPL về xưởng | Cao | §6 | — |
| C9 | **Nhận NPL do khách cấp** | ❌ | toàn bộ | **Rất cao** cho CMT | §6 | — |
| C10 | Hoạch định năng lực | ⚠️ `production_orders` | không thấy mô hình phút-chuyền | Cao | §8 | — |
| C11 | Giao việc đối tác | ✅ `assignments` đầy đủ | — | Cao | §8 §13 | Playbook XXX |
| C12 | Xuất hàng | ✅ `shipments` · `shipment_cartons` | không thấy booking · container · ETA | Cao | §10 | — |
| C13 | **QA hai tổ chức** | ❌ | không phân biệt QA nội bộ với QA khách | **Rất cao** | §9 §12 | — |
| C14 | **Line Map** | ❌ | **0 kết quả trong toàn bộ mã và CSDL** | ? chưa rõ nghĩa | §12 §13 | — |
| C15 | **Hoá đơn** | ❌ | toàn bộ | **Rất cao** | §11 | — |
| C16 | **Thanh toán / công nợ** | ❌ | toàn bộ | **Rất cao** | §11 | — |
| C17 | Quản lý thay đổi | ✅ có quyết định | — | Trung bình | — | — |
| C18 | Quản lý rủi ro | ✅ | — | Trung bình | — | — |
| C19 | Tài liệu · thảo luận | ✅ | không phân loại chứng từ xuất khẩu | Trung bình | §12 | §33 |
| C20 | Nhật ký kiểm toán | ✅ `writeAudit` | — | Cao | — | §8 |

**Thiếu hẳn: C9 · C13 · C14 · C15 · C16.** Ba trong năm nằm ở khâu thu tiền và
chất lượng — hai chỗ khách hàng quan tâm nhất.

---

## 4. KHÁM PHÁ THỰC THỂ

`Verified (Database)` — đọc từ migration `014` và `015`

| Thực thể | Bảng | Số dòng thật |
|---|---|---|
| Khách hàng | `customers` · `customer_contacts` | *(chưa đo)* |
| Hỏi hàng | `inquiries` | *(chưa đo)* |
| Chiết tính | `costings` · `costing_items` | **0 · 0** |
| Mã hàng | `styles` · `style_bom` · `style_colorways` · `style_sizes` · `style_operations` | `style_bom` = **0** |
| Đơn hàng | `orders` · `order_items` · `order_size_breakdown` | *(chưa đo)* |
| Mốc T&A | `order_milestones` | **0** |
| Mẫu | `sample_submissions` | *(chưa đo)* |
| Đề nghị NPL | `material_requests` | **0** |
| Lệnh sản xuất | `production_orders` | **0** |
| Giao hàng | `shipments` · `shipment_cartons` | *(chưa đo)* |
| Thay đổi | `change_requests` | **0** |
| Rủi ro | `risk_assessments` | **0** |
| Tài liệu · thảo luận | `md_documents` · `md_comments` | *(chưa đo)* |
| Giao việc | `assignments` · `assignment_bundles` | *(chưa đo)* |
| Giao thầu | `subcon_orders` | **3** |

### ⚠️ Thực thể KB yêu cầu nhưng KHÔNG TỒN TẠI

`Verified (Database)`

| Thực thể | KB | Hệ quả |
|---|---|---|
| **Hoá đơn** | §11 | Không phát hành được hoá đơn |
| **Thanh toán** | §11 | Không theo dõi được công nợ |
| **Khấu trừ** | *(KB chưa nói)* | `Needs Clarification` |
| **Nhận NPL của khách** | §6 | Đơn CMT không có khâu đầu vào |
| **QA của khách** | §9 | Không tách được với QA nội bộ |
| **Line Map** | §12 §13 | Chưa rõ định nghĩa |
| **Hợp đồng** | §5 | KB nói Contract → PO; không thấy bảng hợp đồng |

---

## 5. KHÁM PHÁ VÒNG ĐỜI

| Thực thể | Sinh ra | Chủ sở hữu | Duyệt | Hoàn tất | Xoá |
|---|---|---|---|---|---|
| Khách hàng | `createCustomer` | MD | — | — | ❌ **không có** |
| Hỏi hàng | `createInquiry` | MD | `setInquiryStatus` | WON / LOST | ❌ |
| Chiết tính | `createCosting` | MD | `setCostingStatus` | APPROVED | dòng con: ✅ · bản ghi: ❌ |
| Mã hàng | `createStyle` | MD | — | — | dòng con: ✅ · bản ghi: ❌ |
| Đơn hàng | `createPo` | MD | *(không thấy bước duyệt)* | SHIPPED | ❌ **không huỷ được** |
| Mốc T&A | *(sinh theo mẫu)* | MD | — | `completeMilestone` | ❌ |
| Mẫu | `saveSample` | MD | trạng thái do khách quyết | APPROVED | ❌ |
| Thay đổi | `createChangeRequest` | MD | `decideChangeRequest` | — | ❌ |
| Giao việc | `createAssignment` | MD | `transitionAssignment` | — | ❌ |

### ⚠️ Phát hiện lớn nhất của Mục 5

`Verified (Architecture)`

> **Không thực thể nghiệp vụ CHÍNH nào của MD có thể huỷ hoặc xoá.**

Điều này **có thể là chủ ý** — Hiến pháp quy định xoá mềm và cấm `.delete()` ở
tầng ứng dụng. Nhưng:

- Không tìm thấy hàm xoá mềm nào cho `orders` · `customers` · `styles`
- Trạng thái `CANCELLED` **có tồn tại** trong mã nhưng không có thao tác nào đặt nó

`Needs Clarification`: nhà máy huỷ một đơn hàng bằng cách nào?

---

## 6. KHÁM PHÁ QUY TRÌNH

### 6.1 Quy trình HIỆN CÓ `Verified (Architecture)`

```
Khách hàng → Hỏi hàng → Chiết tính → (duyệt) → PO → Mã hàng + BOM
                                                  ↓
                        ┌─────────────────────────┼──────────────┐
                        ▼                         ▼              ▼
                  Đề nghị NPL              Lệnh sản xuất      Mẫu
                        │                         │              │
                        └──────────┬──────────────┘              │
                                   ▼                             │
                            Giao việc đối tác                    │
                                   ▼                             │
                              Lệnh giao hàng ←──────────────────┘
                                   ▼
                                ✂ ĐỨT
```

### 6.2 Quy trình KB yêu cầu mà MD KHÔNG CÓ

| Quy trình | KB | Trạng thái |
|---|---|---|
| Email → Tech Pack → PO *(không qua RFQ)* | §3 | ❌ MD bắt buộc đi qua hỏi hàng |
| Mẫu vật lý → chiết tính | §4 | ❌ MD chiết tính không cần mẫu trước |
| Hợp đồng → PO | §5 | ❌ không có bảng hợp đồng |
| Nhận NPL của khách | §6 | ❌ |
| Một PO chia nhiều nhà máy | §8 | ⚠️ có `assignments`, chưa rõ có tách PO được không |
| Hoá đơn → thanh toán | §11 | ❌ |

### 6.3 Quy trình BỊ CHẶN

`Verified (Architecture)`

**Quy tắc leo thang khẩn cấp không bao giờ chạy được.**

```
lib/mos/po-flow.ts:111
  if (risk === 'CRITICAL' || po.late_milestones > 0) return 'CRITICAL';

po-twin.service.ts:132
  late_milestones: 0,          ← HẰNG SỐ, không truy vấn order_milestones
```

Điều kiện `late_milestones > 0` **không bao giờ đúng** trong PO Command Center.

---

## 7. KIỂM KÊ MÀN HÌNH

### 7.1 `/md` — 13 tab `Verified (Architecture)`

| Nhóm | Tab | Bảng dữ liệu | Nút tạo mới | Trạng thái |
|---|---|---|---|---|
| Thương mại | Khách hàng | ✅ | Thêm khách hàng | Implemented |
| Thương mại | Yêu cầu báo giá | ✅ | Nhận yêu cầu báo giá | Implemented |
| Thương mại | Chiết tính giá | ✅ | Tạo bản chiết tính | Implemented |
| Triển khai | Mã hàng | ✅ | Tạo mã hàng | Implemented |
| Triển khai | Đơn hàng (PO) | ✅ | Tạo PO | Implemented |
| Triển khai | Vật tư | ✅ | Tạo thủ công · Sinh từ định mức | Implemented |
| Triển khai | Sản xuất | ✅ | Tạo thủ công · Sinh từ SAM | Implemented |
| Triển khai | Giao hàng | ✅ | Tạo lệnh giao hàng | Implemented |
| Phối hợp | Tài liệu | ✅ | ❌ không có | Implemented, chỉ đọc |
| Phối hợp | Thảo luận | ✅ | ❌ | Implemented, chỉ đọc |
| Phối hợp | Yêu cầu thay đổi | ✅ | nút riêng bên trong | Implemented |
| Phối hợp | Rủi ro | ✅ | ❌ | Implemented, chỉ đọc |
| Phối hợp | Nhật ký | ✅ | ❌ | Implemented, chỉ đọc |

### 7.2 Hộp thoại và phiếu trượt `Verified (Architecture)`

| Tệp | Loại |
|---|---|
| `crm/customer-form-dialog` · `crm/contact-form-dialog` | Biểu mẫu |
| `crm/customer-360-sheet` | Phiếu chi tiết |
| `rfq/inquiry-form-dialog` | Biểu mẫu |
| `costing/costing-form-dialog` · `costing/costing-detail-sheet` | Biểu mẫu + chi tiết |
| `style/style-form-dialog` · `style/style-detail-sheet` | Biểu mẫu + chi tiết |
| `collab/change-request-dialog` | Biểu mẫu |
| `planning/auto-generate-dialogs` | Sinh tự động |
| `po/po-360-sheet` | Phiếu chi tiết đơn — **thế hệ cũ** |

### 7.3 `/md/po/[poId]` — Command Center

| Lát cắt | Khai báo | RBAC cấp | Dựng thật |
|---|---|---|---|
| executive · material · production · quality · shipment | ✅ | ✅ | ✅ Implemented |
| **buyer** | ✅ | ✅ cho vai `buyer` | ❌ **Dead** |
| **finance** | ✅ | ✅ cho `ketoan` | ❌ **Dead** |
| **activity** | ✅ | ✅ | ❌ **Dead** |

### 7.4 ⚠️ HAI MÀN HÌNH ĐƠN HÀNG, NĂNG LỰC KHÁC NHAU

`Verified (Architecture)` — phát hiện quan trọng nhất của Mục 7

| Năng lực | PO 360° *(cũ)* | Command Center *(mới)* |
|---|---|---|
| Lịch T&A | ✅ `tabs-planning.tsx:149` | ❌ không tham chiếu |
| Theo dõi mẫu | ✅ `tabs-planning.tsx:219` | ❌ chỉ đếm số lượt |
| Năm lát cắt vận hành | ❌ | ✅ |

**Cả hai đều mở được từ `md-client.tsx`.** Người dùng phải biết mở đúng màn hình
mới thấy thứ mình cần, và giao diện không nói cho họ biết điều đó.

### 7.5 Mã chết / thừa

| Tệp | Trạng thái | Bằng chứng |
|---|---|---|
| `md-legacy-client.tsx` (437 dòng) | **Dead** | 0 tệp import |
| `lib/garment-math.ts` | **Unused** | chỉ được gọi từ tệp chết ở trên |
| `components/md/po/*` (7 tệp) | **Legacy** | thế hệ cũ, vẫn chạy |

### 7.6 Tải lên · tải về · xuất báo cáo

`Needs Clarification` — chỉ tìm thấy dấu vết ở phân hệ con `assignments`. Không
tìm thấy chức năng xuất Excel/PDF nào trong 13 tab của `/md`.

---

## 8. KHÁM PHÁ PHÂN QUYỀN

### 8.1 Vào được `/md` `Verified (Architecture)`

`lib/rbac.ts:77` — **chỉ `md` và `superadmin`**.

⚠️ KB §14 nói CEO có bảng điều khiển riêng; các phòng Chiết tính · Mua hàng ·
Kế hoạch **không có vai trò đăng nhập riêng**. `Needs Clarification`

### 8.2 Lát cắt Command Center theo vai `Verified (Architecture)`

| Vai | RBAC cấp | Thực thấy | Mất |
|---|---|---|---|
| superadmin · giamdoc · md · ketoan | 8 | 5 | buyer · finance · activity |
| qa · kho · tổ trưởng | 7 | 5 | buyer · activity |
| subcon | 4 | 3 | activity |
| buyer | 5 | 4 | **buyer** |

### 8.3 Phân quyền ở tầng CSDL

`Verified (Database)` — đo hành vi thật ngày 2026-08-04

| Vai | Kết quả |
|---|---|
| **anon** | ✅ **BỊ CHẶN** ở cả 9 bảng đã đo |
| **buyer** *(mới, chưa gắn khách hàng)* | `subcon_orders` **0/3** ✅ · 8 bảng còn lại ⚪ **chưa đo được (rỗng)** |
| **subcon** *(mới, chưa gắn assignment)* | `subcon_orders` **0/3** ✅ · 8 bảng còn lại ⚪ **chưa đo được (rỗng)** |

⚠️ **KHÔNG kết luận được** về `costings` · `style_bom` và 6 bảng khác: chúng
**rỗng**, nên con số 0 không mang thông tin. Cần đọc `pg_policies` —
xem [`RLS_VERIFICATION_QUERIES.sql`](../audit/RLS_VERIFICATION_QUERIES.sql).

### 8.4 Phân quyền ở tầng ứng dụng `Verified (Architecture)`

**6/6 service của MD gọi `guard()` ở 100% hàm export.** Các cầu nối `*.client.ts`
không tự kiểm quyền nhưng uỷ quyền xuống service — đúng kiến trúc.

---

## 9. QUY TẮC NGHIỆP VỤ — ĐỐI CHIẾU

| # | Quy tắc | Nguồn | Trong mã | Phán quyết |
|---|---|---|---|---|
| BR1 | Hình thức gia công quyết định có mua NPL hay không | KB §6 | `order_type` chỉ rẽ nhánh **1 chỗ** (chọn mẫu T&A) | ⚠️ **Conflict** |
| BR2 | PO = PO của khách, không tạo PO nội bộ | KB §5 | có `production_orders` | `Needs Clarification` |
| BR3 | Buyer = Customer, không có thực thể Buyer riêng | KB §2 | có `buyer_accounts` ở 4 migration | ⚠️ **Conflict** |
| BR4 | Khách không được xem chiết tính, biên lợi nhuận | KB §12 | không tìm thấy policy thu hẹp `costings` | `Needs Clarification` |
| BR5 | Nhà thầu xem được đơn giá của **chính mình** | KB §13 | subcon mới thấy 0/3 `subcon_orders` | `Needs Clarification` |
| BR6 | Hai tổ chức QA | KB §9 | không tìm thấy khái niệm | ❌ **Missing** |
| BR7 | Mọi báo cáo khớp cùng một con số | KB §15 | nhiều nơi tự tính độc lập | ❌ **Missing** |
| BR8 | Trễ mốc ⇒ nâng mức khẩn cấp | mã | **hằng số 0 ⇒ không bao giờ chạy** | ⚠️ **Broken** |
| BR9 | Vào đơn: Email → Tech Pack → PO | KB §3 | MD đi qua hỏi hàng | ⚠️ **Conflict** |
| BR10 | Mẫu vật lý trước chiết tính | KB §4 | chiết tính không cần mẫu | ⚠️ **Conflict** |

---

## 10. PHÂN TÍCH KHOẢNG CÁCH

| Nhóm | Mục |
|---|---|
| **Đúng** | Ba tầng phòng thủ · `guard()` 100% · 13 tab có dữ liệu thật · `assignments` đầy đủ · chặng mẫu đúng chuẩn ngành · `order_milestones` có `delay_days` sinh tự động |
| **Một phần** | C6 mẫu · C7 T&A *(giao diện chỉ ở thế hệ cũ)* · C8 NPL · C10 hoạch định · C12 xuất hàng |
| **Thiếu** | C9 nhận NPL khách · C13 QA hai tổ chức · C14 Line Map · C15 hoá đơn · C16 thanh toán · huỷ/tách/gộp/nhân bản PO · bảng hợp đồng |
| **Mâu thuẫn** | BR1 · BR3 · BR9 · BR10 |
| **Cần làm rõ** | BR2 · BR4 · BR5 · vòng đời huỷ đơn · ranh giới `assignments` · chủ sở hữu `production_orders` |

---

## 11. RỦI RO

| # | Rủi ro | Loại | Bằng chứng | Mức |
|---|---|---|---|---|
| R1 | `costings` có thể không thu hẹp — KB §12 cấm khách xem biên lợi nhuận | Bảo mật | không tìm thấy `CREATE POLICY ... ON costings` | 🔴 *(tiềm ẩn — bảng đang rỗng)* |
| R2 | `style_bom` không thu hẹp — bí mật kỹ thuật | Bảo mật | như trên | 🔴 *(tiềm ẩn)* |
| R3 | MD không có **một bài kiểm nghiệp vụ nào** | Bảo trì | `tests/` chỉ có kiến trúc · phân quyền ngoài · toàn vẹn nền | 🔴 |
| R4 | Quy tắc cảnh báo trễ mốc chết | Vận hành | `po-twin.service.ts:132` | 🔴 |
| R5 | Hai màn hình đơn hàng khác năng lực | Nhất quán | Mục 7.4 | 🟠 |
| R6 | **Bảy** bộ từ vựng trạng thái, không bộ nào ánh xạ nhau | Nhất quán dữ liệu | Mục 4 | 🟠 |
| R7 | Không huỷ được đơn hàng | Vận hành | Mục 5 | 🟠 |
| R8 | `md-client.tsx` 886/900 dòng | Bảo trì | sát trần bài kiểm kiến trúc | 🟡 |
| R9 | Không phân trang ở bất kỳ bảng nào | Quy mô | Mục 7 | 🟡 |
| R10 | Số liệu tính rải rác nhiều nơi | Nhất quán | KB §15 | 🟠 |

---

## 12. MA TRẬN SỰ THẬT NGHIỆP VỤ

| Năng lực | Quy tắc | KB | HP | CSDL | Thi hành | Trạng thái | Bằng chứng |
|---|---|---|---|---|---|---|---|
| Khách hàng | Buyer = Customer | §2 | §16.2 | có `buyer_accounts` | có vai `buyer` | ⚠️ Conflict | 4 migration |
| Chiết tính | Khách không xem biên LN | §12 | §44.7 | policy **chưa đọc được** | không rõ | `Needs Clarification` | không tìm thấy policy |
| Chiết tính | Theo hình thức gia công | §6 | — | `order_type` có | rẽ nhánh 1 chỗ | ⚠️ Conflict | `po.actions.ts:102` |
| Vào đơn | Email → Tech Pack → PO | §3 | — | `inquiries` | qua hỏi hàng | ⚠️ Conflict | tab `rfq` |
| Mẫu | Mẫu trước chiết tính | §4 | — | `sample_submissions` | không ràng buộc | ⚠️ Conflict | không thấy chốt chặn |
| Mẫu | Năng lực độc lập | §7 | — | 7 chặng đúng chuẩn | UI **chỉ ở thế hệ cũ** | ⚠️ Partial | `tabs-planning.tsx:219` |
| T&A | Cảnh báo trễ mốc | — | — | `delay_days` tự sinh | **hằng số 0** | ⚠️ Broken | `po-twin.service.ts:132` |
| NPL | Sở hữu theo từng đơn | §6 | — | không có bảng nhận NPL | ❌ | ❌ Missing | — |
| Sản xuất | 1 PO nhiều nhà máy | §8 | — | `assignments` | ✅ | `Verified (Database)` | `029` |
| QA | Hai tổ chức | §9 | — | không có khái niệm | ❌ | ❌ Missing | grep 0 kết quả |
| Xuất hàng | ETA · booking · container | §10 | — | `shipments` | thiếu trường | ⚠️ Partial | `015` |
| Tài chính | Hoá đơn · công nợ | §11 | — | **không có bảng** | ❌ | ❌ Missing | — |
| Cổng khách | Không xem nhà thầu, đơn khách khác | §12 | — | `buyer_scope_*` có | không rõ | `Needs Clarification` | 4 policy |
| Cổng nhà thầu | Xem giá của chính mình | §13 | — | `031c3` thu hẹp | subcon mới thấy 0/3 | `Needs Clarification` | đo 2026-08-04 |
| Line Map | Cả hai cổng đều xem | §12 §13 | — | **0 kết quả** | ❌ | ❌ Missing | grep toàn kho |
| Báo cáo | Khớp cùng một con số | §15 | — | — | tính rải rác | ❌ Missing | Mục 11 R10 |

---

## 13. DANH SÁCH CẦN LÀM RÕ — BỔ SUNG SAU PHASE 1

Ngoài danh sách đã có ở [`NEEDS_CLARIFICATION.md`](../architecture/NEEDS_CLARIFICATION.md):

| # | Câu hỏi |
|---|---|
| Q8 | Nhà máy **huỷ một đơn hàng** bằng cách nào? Không có thao tác nào đặt `CANCELLED` |
| Q9 | `assignments` thuộc MD hay thuộc Subcontract? |
| Q10 | Ai sở hữu vòng đời `production_orders` — MD tạo, phân hệ khác thực thi |
| Q11 | Có cần **xoá mềm** cho khách hàng · mã hàng · đơn hàng không? |
| Q12 | KB §3 nói không mặc định có RFQ — vậy tab "Yêu cầu báo giá" có phải cửa vào bắt buộc? |
| Q13 | KB §5 nói có **Hợp đồng** trước PO — không có bảng hợp đồng. Cần không? |
| Q14 | MD có cần xuất Excel / PDF không? Hiện không tìm thấy |
| Q15 | Bảng nào cần phân trang trước khi dữ liệu thật đổ vào? |

---

## 14. KẾT LUẬN PHASE 1

**MD hiện tại là một bộ khung thương mại–triển khai tương đối đầy đủ ở phần
TẠO LẬP, nhưng còn ba khoảng trống có hệ thống:**

1. **Không kết thúc được vòng đời** — không huỷ, không xoá, không hoá đơn,
   không thanh toán.
2. **Hai thế hệ giao diện chồng nhau** với năng lực khác nhau, trong đó hai
   năng lực quan trọng nhất với nhà máy gia công (T&A và mẫu) chỉ nằm ở thế hệ cũ.
3. **Chưa được vận hành thật** — 8 bảng cốt lõi đang rỗng.

⚠️ **Điểm cuối vừa là rủi ro vừa là cơ hội.** Rủi ro: mọi kết luận về phân quyền
đều chưa đo được. Cơ hội: sửa nền móng bây giờ **chưa phải di trú một dòng dữ
liệu nào**.

**Không mục nào trong tài liệu này đạt `Verified + Implemented`** — tầng thứ tư
(Running Application) chưa ai kiểm.
