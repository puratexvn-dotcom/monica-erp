# EDD-02 · ENTERPRISE DESIGN DOCUMENT
## Phase 4 · Enterprise Master Data  ·  Phase 5 · Enterprise Business Object

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-02 |
| **Sprint** | Enterprise Business Design · Sprint 2 |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Trạng thái** | ⏳ **CHỜ PHÊ DUYỆT** |
| **Nguyên tắc làm việc** | **Board Working Principle v2.0** — tự nghiên cứu · tự quyết · tối đa **5** quyết định trình Board |
| **Tiền đề** | [EDD-01](EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) — 14 Domain · 9 Kernel · 91 năng lực |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §0 · PHẠM VI VÀ NGUYÊN TẮC

## 0.1 Quyết định Joseph vừa ban hành — ghi nhận và tác động

| Quyết định | Mã cũ | Tác động lên EDD-02 |
|---|---|---|
| **Huỷ đơn: GĐSX quyết định cuối cùng** | `BDR-02` ✅ | Vòng đời `Order` khép kín — §5.3.1. Tôi **bổ sung cơ chế đồng phê duyệt**, xem `DL-042` |
| **Costing: chỉ GĐSX duyệt cuối** | ✅ | `Costing` lifecycle §5.3.2 |
| **PO mua: GĐSX + MD cùng duyệt, quy trình do tôi đề xuất** | `BDR-03` ✅ | **Hai chữ ký, hai câu hỏi khác nhau** — §5.3.7 |
| **Procurement là Domain chính thức** | ✅ | D8 = 🟢 ACTIVE ngay từ v1 |
| **Quy trình sản xuất KHÔNG cố định — phải cấu hình được** | 🆕 | 🔴 **`ProcessRoute` trở thành Master Data**, không phải mã. §4.6.5 |
| **AI là Capability, không phải tính năng** | 🆕 | 🆕 **Nhóm Business Object thứ 14: Risk & Intelligence** — §5.2.14 |
| **Lợi nhuận theo đơn · khách · nhà máy · nhà thầu** | 🆕 | `CostActual` phải có **4 trục phân bổ** — §5.3.9 · `BDR-05` |
| **Customer Portal là lợi thế cạnh tranh** | 🆕 | Mọi Business Object phải mang **lớp tiết lộ** — §5.1 luật A6 |
| **Đa ngôn ngữ VI·EN·ZH từ đầu** | 🆕 | 🔴 Luật **nhãn dịch được, hồ sơ không dịch** — §4.4 |
| **Nhiều nhà máy · nhiều quốc gia** | 🆕 | Mô hình tổ chức bốn cấp — §4.3 |

## 0.2 Những gì tôi **không hỏi** Board trong sprint này

Theo Working Principle v2.0, tôi tự quyết và ghi vào Decision Log những vấn đề sau — chúng có **chuẩn chung** hoặc **suy được**:

đơn vị đo và quy đổi · mã quốc gia ISO · mã tiền tệ ISO · Incoterm 2020 · bảng AQL ISO 2859-1 · cấu trúc mã hàng · quy tắc đánh số chứng từ · phân loại lỗi may mặc · lý do dừng chuyền · cấu trúc BOM · mô hình lô/cuộn · vòng đời chứng từ · quy tắc xoá mềm · quy tắc phiên bản · mô hình lịch nhà máy · chuẩn kiểm vải 4 điểm · 7 chặng mẫu · mô hình duyệt nhiều cấp · chuẩn ngày hiệu lực dữ liệu chủ.

---
---

# PHASE 4 · ENTERPRISE MASTER DATA

> **Dữ liệu chủ là thứ tồn tại LÂU HƠN mọi giao dịch.**
> Sai một aggregate ⇒ sửa một quy trình. Sai một thực thể dữ liệu chủ ⇒ **di trú toàn hệ thống**.
> Đây là lý do Phase 4 là phase có chi phí sai cao nhất trong toàn bộ Enterprise Design.

## 4.1 Bốn tầng dữ liệu chủ

Chuẩn ngành phân dữ liệu chủ theo **ai sở hữu định nghĩa** — vì đó là thứ quyết định ai được sửa và nó nhân bản thế nào cho 100 doanh nghiệp.

| Tầng | Nghĩa | Ai định nghĩa | Nhân bản cho tenant mới | Ví dụ |
|---|---|---|---|---|
| **T0 · GLOBAL** | Chuẩn quốc tế, **giống nhau ở mọi doanh nghiệp** | Monica ONE cung cấp sẵn | ✅ dùng chung, không sao chép | Country · Currency · UOM · Incoterm · Language · AQLPlan · TimeZone |
| **T1 · INDUSTRY** | Chuẩn **ngành may**, doanh nghiệp có thể mở rộng | Monica ONE cung cấp bộ khởi tạo | ✅ sao chép lúc khởi tạo, sửa được | DefectCode · DowntimeReason · OperationLibrary · SizeScale · InspectionStage · ProcessRouteTemplate |
| **T2 · ENTERPRISE** | Riêng từng doanh nghiệp | Doanh nghiệp | ❌ tự nhập | Party · Factory · Line · Material · Employee · Calendar · PaymentTerm |
| **T3 · PRODUCT** | Riêng từng sản phẩm, **thay đổi nhanh nhất** | Doanh nghiệp + khách | ❌ tự nhập | Style · Colorway · TechPack · BOM · StandardTime |

> ### 🔬 Vì sao tách T0/T1 khỏi T2 — đây là quyết định thương mại hoá
>
> Một nhà máy mới bật Monica ONE nhận ngay **~2.000 bản ghi dữ liệu chủ có sẵn**: mã lỗi may mặc chuẩn, thư viện công đoạn, bảng AQL, quy trình sản xuất mẫu, thang cỡ. Họ **chạy được trong ngày đầu** thay vì nhập ba tháng.
>
> Đây là điều **ERPNext làm đúng** *(bộ dữ liệu khởi tạo theo ngành)* và **SAP làm sai** *(mọi thứ phải cấu hình từ đầu, cần đội tư vấn)*.
>
> ⚠️ Ràng buộc: T0 và T1 **không được** doanh nghiệp sửa vào bản gốc — họ **thêm bản ghi của mình**, hoặc **vô hiệu hoá** bản chuẩn. Sửa bản gốc thì bản nâng cấp sau sẽ đè mất.

## 4.2 Bảy luật quản trị dữ liệu chủ

| # | Luật | Vì sao |
|---|---|---|
| **MD-1** | **Mỗi thực thể dữ liệu chủ có đúng MỘT Domain sở hữu** và đúng một Role được tạo/sửa | Hai chủ = không ai chịu trách nhiệm dữ liệu đúng |
| **MD-2** | 🔴 **Mã nghiệp vụ (`code`) là BẤT BIẾN sau khi phát hành.** Đổi tên hiển thị được, đổi mã thì không | Mã đã đi vào chứng từ, hợp đồng, nhãn thùng. Đổi mã là viết lại lịch sử |
| **MD-3** | **Vòng đời chuẩn:** `DRAFT → ACTIVE → BLOCKED → OBSOLETE`. ⛔ Không xoá cứng | `BLOCKED` = ngừng dùng cho giao dịch mới, dữ liệu cũ vẫn đọc được |
| **MD-4** | **Ngày hiệu lực** cho mọi thứ thay đổi theo thời gian: giá · tỷ giá · định mức · thời gian chuẩn · điều khoản | Chứng từ cũ phải đọc được bằng giá trị **lúc đó**, không phải giá trị hôm nay |
| **MD-5** | **Chống trùng bắt buộc** ở `Party` · `Material` · `Style` | Cùng một nhà cung cấp nhập hai lần ⇒ hai sổ công nợ, không đối soát được |
| **MD-6** | **Dữ liệu chủ mới cần duyệt** khi nó tạo ra nghĩa vụ tài chính *(Party · Material · PaymentTerm)*; không cần duyệt khi chỉ là phân loại | Cân bằng kiểm soát và tốc độ |
| **MD-7** | 🔴 **Mọi thực thể mang `tenant_id`**, kể cả khi hôm nay chỉ có một tenant | Thêm sau = di trú toàn bộ. Xem `BDR-01` |

## 4.3 🆕 Mô hình tổ chức — nhiều nhà máy, nhiều quốc gia

Joseph yêu cầu hỗ trợ doanh nghiệp nhiều nhà máy, nhiều quốc gia. Đây là chỗ **SAP làm đúng nhất trong tất cả các hệ** và đáng học tinh thần: tách **pháp nhân** khỏi **địa điểm** khỏi **đơn vị vận hành**.

```
Tenant                     doanh nghiệp thuê bao Monica ONE
  └── LegalEntity          🔴 PHÁP NHÂN — có mã số thuế, có sổ sách, có tiền tệ báo cáo
        └── Site           🔴 ĐỊA ĐIỂM — nhà máy, kho ngoài, văn phòng · có quốc gia, múi giờ, lịch
              ├── Workshop         xưởng
              │     └── Section    CUTTING·SEWING·FINISHING·PACKING·PRINTING·EMBROIDERY
              │           └── WorkCenter    ← 🔴 ĐƠN VỊ NĂNG LỰC
              │                 └── Line / Workstation
              └── Warehouse
                    └── Zone → Rack → Bin
```

| Khái niệm | Vì sao phải tách | Nếu gộp thì hỏng gì |
|---|---|---|
| **LegalEntity ⟷ Site** | Một pháp nhân có nhiều nhà máy; một nhà máy có thể phục vụ hai pháp nhân *(gia công nội bộ)* | Không xuất được báo cáo tài chính theo pháp nhân · không đối chiếu MISA theo mã số thuế |
| **Site ⟷ WorkCenter** | Năng lực đo ở **WorkCenter**, không ở nhà máy | Không hoạch định được |
| 🔴 **WorkCenter là khái niệm trung tâm** | Nó là **đơn vị đo năng lực, đơn vị xếp lịch, đơn vị báo sản lượng** — và nó **có thể là chuyền nội bộ HOẶC chuyền của nhà thầu** | Nội bộ và thuê ngoài phải mô hình hoá hai lần |

> ### 🔴 `DL-031` · **Chuyền của nhà thầu CŨNG là `WorkCenter`**
>
> Một `WorkCenter` có `ownership: INTERNAL | SUBCONTRACTED` và `operated_by_party_id`.
>
> **Hệ quả:** Line Map, năng lực, sản lượng, hiệu suất **dùng cùng một mô hình** cho chuyền trong nhà và chuyền xưởng ngoài. Đây là điều **không hệ ERP nào trong bảng benchmark làm được** — chúng coi gia công ngoài là *mua dịch vụ*, nên mất dấu ngay khi hàng rời nhà máy.
>
> Phạm vi dữ liệu vẫn tách tuyệt đối bằng `Assignment` — nhà thầu chỉ thấy `WorkCenter` của chính họ.

**Đa quốc gia — bốn thứ phải theo `Site`, không theo `Tenant`:**
lịch nghỉ lễ · múi giờ · ngôn ngữ mặc định · đơn vị đo mặc định *(yard ở Mỹ, mét ở châu Á)*.

## 4.4 🔴 Đa ngôn ngữ trong dữ liệu chủ — giải mâu thuẫn với Hiến pháp §45.7

Hiến pháp §45.7 cấm **dịch dữ liệu nghiệp vụ** — *"dịch dữ liệu là làm sai lệch hồ sơ"*. Nhưng một buyer Trung Quốc cần thấy màu *"Navy"* là *"藏青"*. Hai điều này **không mâu thuẫn** nếu phân biệt đúng:

| Loại | Dịch? | Lý do | Ví dụ |
|---|---|---|---|
| 🟢 **NHÃN của MÃ PHÂN LOẠI** | ✅ **dịch** | Nó là **nhãn hiển thị của một mã**, không phải nội dung hồ sơ. Mã mới là sự thật | `ColourMaster.code='NVY'` → `{vi:'Xanh navy', en:'Navy', zh:'藏青'}` · `DefectCode` · `Operation` · `Size` · `DowntimeReason` |
| 🔴 **NỘI DUNG HỒ SƠ** | ⛔ **KHÔNG BAO GIỜ** | Đây là bản ghi nghiệp vụ. Dịch = làm sai lệch hồ sơ | Tên khách hàng · số PO · ghi chú của người kiểm · nội dung hợp đồng · bình luận · mô tả lỗi tự do |
| 🟡 **Trợ dịch khi hiển thị** | ⚠️ **hỗ trợ, không lưu** | Bản gốc **luôn hiện**; bản dịch AI hiện kèm, **ghi rõ "bản dịch tự động"**, ⛔ **không lưu, không dùng làm hồ sơ** | Ghi chú người kiểm hiển thị cho buyer Trung Quốc |
| ⛔ **TỪ VỰNG HIẾN ĐỊNH** | ⛔ **KHÔNG BAO GIỜ** | Hiến pháp §45.3 — bản sắc sản phẩm | `Merchandising` · `Work Inbox` · `Line Map` |

> `DL-032` · **Luật một câu: DỊCH NHÃN CỦA MÃ, KHÔNG DỊCH NỘI DUNG CỦA HỒ SƠ.**
> Cưỡng chế: mọi bảng dữ liệu chủ T0/T1/T2 có cột `label_i18n JSONB`; ⛔ **không bảng giao dịch nào được có cột đó.** Phép kiểm kiến trúc bắt được.

## 4.5 SỔ ĐĂNG KÝ DỮ LIỆU CHỦ — 58 thực thể

> Ký hiệu: **T** tầng · **D** Domain sở hữu · 🔤 có nhãn đa ngôn ngữ · 📅 có ngày hiệu lực · ⚖️ cần duyệt khi tạo

### G1 · ĐỐI TÁC & TỔ CHỨC — 14

| # | Thực thể | T | D | Nội dung chính | Ghi chú |
|---|---|---|---|---|---|
| M01 | 🔴 **`Party`** | T2 | S1 | `party_code` · `legal_name` · `trade_name` · `tax_id` · `country` · `status` | ⚖️ **Gốc chung của mọi đối tác.** Chống trùng theo `tax_id` |
| M02 | 🔴 **`PartyRole`** | T2 | S1 | `party_id` · `role: CUSTOMER\|SUPPLIER\|SUBCONTRACTOR\|CARRIER\|INSPECTION_BODY\|SERVICE_PROVIDER` · 📅 | **Một pháp nhân, nhiều vai.** Xưởng in vừa là `SUBCONTRACTOR` vừa là `SUPPLIER` |
| M03 | `Person` | T2 | S1 | `full_name` · `contact` · `party_id?` | Người thuộc một Party |
| M04 | `PartyContact` | T2 | S1 | vai trò liên hệ · email · điện thoại · ngôn ngữ ưu tiên | Ngôn ngữ ưu tiên dùng cho Portal và email |
| M05 | `PartyAddress` | T2 | S1 | loại *(trụ sở·giao hàng·hoá đơn)* · quốc gia · cảng gần nhất | |
| M06 | `PartyBankAccount` | T2 | S1 | ngân hàng · số TK · tiền tệ · SWIFT | ⚖️ nhạy cảm — quyền hẹp |
| M07 | 🔴 **`Tenant`** | T2 | S1 | `tenant_code` · gói dịch vụ · `domain_activation` · ngôn ngữ mặc định | Xem `BDR-01` |
| M08 | 🔴 **`LegalEntity`** | T2 | S1 | pháp nhân · mã số thuế · tiền tệ báo cáo · **mã đối chiếu MISA** | Nối sang D12 |
| M09 | 🔴 **`Site`** | T2 | S1 | nhà máy/kho/văn phòng · quốc gia · múi giờ · lịch · ngôn ngữ | Đơn vị **quốc tế hoá** |
| M10 | `Workshop` | T2 | D6 | xưởng thuộc Site | |
| M11 | `Section` | T1 | D6 | 🔤 `CUTTING·SEWING·FINISHING·PACKING·PRINTING·EMBROIDERY·FUSING·QC·WAREHOUSE` | Bộ chuẩn ngành |
| M12 | 🔴 **`WorkCenter`** | T2 | D6 | `ownership: INTERNAL\|SUBCONTRACTED` · `operated_by_party_id` · số trạm · định biên · hệ số hiệu suất · 📅 | 🔴 **Đơn vị năng lực · xếp lịch · báo sản lượng** — `DL-031` |
| M13 | `Workstation` | T2 | D6 | trạm trong WorkCenter · loại máy | |
| M14 | `Department` / `Position` | T2 | D13 | phòng ban · chức danh | ⚠️ **chỉ để tổ chức nhân sự — ⛔ KHÔNG dùng để phân quyền** |

### G2 · KHO & VỊ TRÍ — 5

| # | Thực thể | T | D | Nội dung chính |
|---|---|---|---|---|
| M15 | `Warehouse` | T2 | D9 | `type: RM\|FG\|WIP\|QUARANTINE` · thuộc Site |
| M16 | `Zone` | T2 | D9 | 🔤 `RECEIVING·STORAGE·PICKING·STAGING·QC_HOLD` |
| M17 | `Rack` | T2 | D9 | kệ |
| M18 | 🔴 **`Bin`** | T2 | D9 | ô chứa — **đơn vị tồn kho nhỏ nhất** · sức chứa · cho phép trộn · loại |
| M19 | `StorageCondition` | T1 | D9 | 🔤 nhiệt độ · độ ẩm · tránh sáng |

### G3 · SẢN PHẨM — 13

| # | Thực thể | T | D | Nội dung chính | Ghi chú |
|---|---|---|---|---|---|
| M20 | `Brand` | T2 | D1 | thương hiệu của khách | Một khách nhiều thương hiệu |
| M21 | `Season` | T2 | D1 | 🔤 mùa/năm | |
| M22 | `ProductCategory` | T1 | D3 | 🔤 áo sơ mi · quần · jacket · đồ thể thao… | Bộ chuẩn ngành, mở rộng được |
| M23 | 🔴 **`Style`** | T3 | D3 | `style_code` · khách · thương hiệu · mùa · loại · vòng đời `DEVELOPMENT→APPROVED→IN_PRODUCTION→DISCONTINUED` | ⚖️ **Dùng lại nhiều đơn** *(`DL-011`)*. Sở hữu IP → `BDR-02` |
| M24 | `StyleVersion` | T3 | D3 | phiên bản · lý do đổi · 📅 | Không sửa đè |
| M25 | 🔴 **`ColourMaster`** | T2 | D3 | 🔤 `code` · nhãn 3 ngôn ngữ · mã Pantone · nhóm màu | Mã là sự thật, nhãn dịch được |
| M26 | 🔴 **`Colorway`** | T3 | D3 | tổ hợp màu của một Style · màu từng bộ phận | |
| M27 | 🔴 **`SizeScale`** | T1 | D3 | 🔤 bộ cỡ *(S-M-L · 36-38-40 · Kids)* · thứ tự · quy đổi vùng | 🔴 **Cỡ có THỨ TỰ** — sắp chữ cái sẽ ra `L·M·S`, sai |
| M28 | `Size` | T1 | D3 | 🔤 cỡ trong bộ · số thứ tự | |
| M29 | `FitBlock` | T3 | D3 | rập gốc dùng lại | |
| M30 | 🔴 **`MeasurementPoint`** | T1 | D3 | 🔤 điểm đo chuẩn *(vòng ngực · dài áo · dài tay…)* | Nền của bảng thông số và duyệt mẫu số hoá |
| M31 | 🔴 **`OperationLibrary`** | T1 | D4 | 🔤 công đoạn chuẩn · loại máy · bậc tay nghề · bộ phận | Bộ khởi tạo ~300 công đoạn ngành may |
| M32 | `MachineType` | T1 | D4 | 🔤 `SNLS·DNLS·OVERLOCK·FLATLOCK·BARTACK·BUTTONHOLE·PRESS·MANUAL` | |
| M33 | `Machine` | T2 | D6 | máy cụ thể · WorkCenter · trạng thái | ⏳ chừa đường cho Maintenance |

### G4 · VẬT TƯ — 8

| # | Thực thể | T | D | Nội dung chính | Ghi chú |
|---|---|---|---|---|---|
| M34 | `MaterialCategory` | T1 | S3 | 🔤 `FABRIC·TRIM·PACKAGING·CONSUMABLE·CHEMICAL` | |
| M35 | 🔴 **`Material`** | T2 | S3 | `material_code` · loại · đơn vị gốc · thuộc tính · vòng đời | ⚖️ Chống trùng bắt buộc |
| M36 | 🔴 **`MaterialAttribute`** | T1 | S3 | 🔤 vải: thành phần · gsm · khổ · kiểu dệt · độ co · trim: kích cỡ · chất liệu | **Thuộc tính theo loại**, không phải cột cứng |
| M37 | 🔴 **`UOM`** | T0 | S3 | mét · yard · kg · cuộn · cái · tá · thùng · cuộn chỉ | Chuẩn quốc tế |
| M38 | 🔴 **`UOMConversion`** | T2 | S3 | quy đổi **theo vật tư** *(kg↔mét phụ thuộc gsm và khổ)* · 📅 | 🔴 **Không phải quy đổi toàn cục.** Vải khác nhau quy đổi khác nhau |
| M39 | 🔴 **`ShadeGroup`** | T2 | D9 | nhóm dải màu theo lô nhuộm | 🔴 Nền của luật cấm trộn dải màu — `DL-029` |
| M40 | `SupplierMaterial` | T2 | D8 | mã của NCC · giá · MOQ · thời gian giao · 📅 | Nền của so sánh giá |
| M41 | `MaterialSubstitute` | T2 | D8 | vật tư thay thế được | Dùng khi thiếu hàng |

### G5 · THƯƠNG MẠI & HẬU CẦN — 9

| # | Thực thể | T | D | Nội dung chính |
|---|---|---|---|---|
| M42 | `Country` | T0 | S3 | ISO 3166 · 🔤 |
| M43 | `Currency` | T0 | S3 | ISO 4217 · số lẻ |
| M44 | 🔴 **`FxRate`** | T2 | D12 | cặp tiền tệ · tỷ giá · nguồn · 📅 **theo NGÀY** |
| M45 | `Incoterm` | T0 | D1 | Incoterms 2020 · 🔤 · điểm chuyển rủi ro |
| M46 | 🔴 **`PaymentTerm`** | T2 | D1 | 🔤 `LC·TT_ADVANCE·TT_NET_N·DP·DA` · số ngày · % đặt cọc · % giữ lại |
| M47 | `PriceList` | T2 | D1 | giá theo khách/style/mùa · 📅 · ⚖️ **GĐSX duyệt** |
| M48 | `Port` | T0 | D10 | UN/LOCODE · 🔤 · quốc gia |
| M49 | `Carrier` | T2 | D10 | hãng tàu/forwarder — **là một `Party`** |
| M50 | `ServiceLevel` | T1 | D10 | 🔤 `SEA_FCL·SEA_LCL·AIR·EXPRESS·TRUCK` |

### G6 · THAM CHIẾU VẬN HÀNH — 9

| # | Thực thể | T | D | Nội dung chính | Ghi chú |
|---|---|---|---|---|---|
| M51 | 🔴 **`FactoryCalendar`** | T2 | S8 | ngày làm việc · ca · giờ/ca · nghỉ lễ **theo quốc gia** | 🔴 Nền của **mọi** phép tính ngày T&A và năng lực |
| M52 | `Shift` | T2 | S8 | ca · giờ bắt đầu/kết thúc · hệ số |
| M53 | 🔴 **`DefectCode`** | T1 | D7 | 🔤 mã lỗi · nhóm · mức nặng/nhẹ/tới hạn · công đoạn gây ra | Bộ khởi tạo ~150 lỗi ngành may |
| M54 | 🔴 **`DowntimeReason`** | T1 | D6 | 🔤 `MACHINE·MATERIAL·QUALITY·POWER·ABSENT·CHANGEOVER·MEETING·OTHER` | ⛔ **Bảng mã, không ghi tự do** |
| M55 | 🔴 **`AQLPlan`** | T0 | D7 | ISO 2859-1 — cỡ lô · mức kiểm · cỡ mẫu · Ac/Re | Chuẩn quốc tế, cung cấp sẵn |
| M56 | `InspectionStage` | T1 | D7 | 🔤 `MATERIAL·INLINE·PRE_FINAL·FINAL·PACKING·LOADING` | |
| M57 | 🔴 **`ReasonCode`** | T1 | mọi | 🔤 lý do **huỷ đơn · thua báo giá · từ chối mẫu · khấu trừ · điều chỉnh tồn** | 🔴 **Lý do chuẩn hoá là dữ liệu phân tích.** Ô tự do sau 6 tháng có 400 cách viết |
| M58 | 🔴 **`ProcessRoute`** | T1/T3 | D6 | 🔴 **Quy trình sản xuất cấu hình được** — xem §4.6.5 | Joseph: *"không hard-code"* |
| M59 | `DocumentType` · `NumberSeries` | T1 | S8 | 🔤 loại chứng từ · quy tắc đánh số · reset theo năm/site | |

### G7 · NỀN TẢNG — 6

| # | Thực thể | T | D | Nội dung chính |
|---|---|---|---|---|
| M60 | `Role` · `Capability` | T1 | S2 | vai trò chuẩn ngành + năng lực `verb:object` |
| M61 | 🔴 **`ApprovalPolicy`** | T2 | S5 | đối tượng · điều kiện · người duyệt · ngưỡng · **uỷ quyền** · leo thang |
| M62 | 🔴 **`WorkItemRule`** | T1 | S7 | luật sinh việc theo Domain — **dữ liệu, không phải mã** |
| M63 | 🔴 **`MetricDefinition`** | T1 | S7 | mã chỉ số · công thức · đơn vị · ngưỡng · nguồn |
| M64 | `DisclosureClass` | T1 | S2 | 🔤 `INTERNAL_ONLY·CUSTOMER·SUBCON·SUPPLIER·ALL_PARTIES` |
| M65 | `Language` · `Locale` | T0 | S8 | VI·EN·ZH · định dạng ngày/số/tiền |

**Tổng: 65 thực thể dữ liệu chủ.**

## 4.6 Sáu quyết định thiết kế dữ liệu chủ cần giải thích

### 4.6.1 `Party` — vì sao một gốc chung

```
Party (pháp nhân duy nhất, chống trùng theo tax_id)
  ├── PartyRole: CUSTOMER      → hồ sơ khách, hợp đồng, giá bán
  ├── PartyRole: SUBCONTRACTOR → assignment, đơn giá gia công, công nợ phải trả
  └── PartyRole: SUPPLIER      → PO mua, giá mua, công nợ phải trả
```

📚 **Thực tế ngành:** xưởng in thêu vừa **bán dịch vụ in** *(supplier)* vừa **nhận may gia công** *(subcontractor)*. Nhà cung cấp vải lớn thường có xưởng may. Với 100 tenant, tình huống này **chắc chắn xảy ra**.

| Không có `Party` | Có `Party` |
|---|---|
| Hai mã, hai sổ công nợ | Một pháp nhân, một sổ công nợ hợp nhất |
| ⛔ Không bù trừ được *(ta nợ họ 50k, họ nợ ta 30k)* | ✅ Bù trừ được |
| Không biết tổng mức phụ thuộc vào một đối tác | Biết |

### 4.6.2 Ma trận `Style × Colorway × Size` — chỗ mọi ERP tổng quát hỏng

📚 **BlueCherry và Infor M3 làm đúng chỗ này**; Odoo và ERPNext làm sai *(coi mỗi tổ hợp là một sản phẩm riêng)*.

```
Style (1)  ──▶  Colorway (n)  ──▶  Size (n)   =  đơn vị bán/sản xuất nhỏ nhất
   │
   ├── BOM khác nhau theo Colorway   ← vải màu khác, chỉ màu khác
   └── Định mức khác nhau theo Size  ← cỡ XL tốn nhiều vải hơn S
```

`DL-033` · **Định mức BOM khai ở cấp `Style`, có hệ số theo `Size` và ghi đè theo `Colorway`.**
Khai ở cấp tổ hợp *(Odoo/ERPNext)* ⇒ một style 6 màu × 5 cỡ = **30 BOM phải bảo trì**. Một thay đổi kỹ thuật ⇒ sửa 30 chỗ.

### 4.6.3 Quy đổi đơn vị đo — theo vật tư, không toàn cục

```
Vải A: 180 gsm, khổ 150cm  →  1 kg = 3,70 m
Vải B: 240 gsm, khổ 145cm  →  1 kg = 2,87 m
```

`DL-034` · **`UOMConversion` gắn vào `Material`, không phải bảng quy đổi toàn cục.** Đây là chỗ ERP tổng quát sai nhất với ngành dệt may — vải mua theo **kg**, dùng theo **mét**, kiểm theo **yard**, tồn theo **cuộn**, và bốn con số đó chỉ quy đổi được khi biết gsm và khổ của **chính cuộn đó**.

### 4.6.4 `FactoryCalendar` — thứ mọi phép tính ngày phụ thuộc

Không có lịch nhà máy thì: T&A tính ngày sai · năng lực tính sai · ETA sai · công nợ tính sai ngày.

`DL-035` · **Lịch gắn vào `Site`, không gắn vào `Tenant`** — nhà máy Việt Nam nghỉ Tết, nhà máy Bangladesh nghỉ Eid. Doanh nghiệp nhiều quốc gia **bắt buộc** phải tách.

### 4.6.5 🔴 `ProcessRoute` — trả lời chỉ thị *"quy trình sản xuất không cố định"*

Joseph: *"Tùy từng sản phẩm. Tùy từng khách hàng. Tùy từng công nghệ. Không được hard-code."*

```
ProcessRoute (T1 mẫu chuẩn · T3 riêng cho style)
├─ route_code · scope: TEMPLATE | STYLE_SPECIFIC
├─ RouteStep[]  ← THỨ TỰ CÔNG ĐOẠN LÀ DỮ LIỆU
│    sequence · section (M11) · is_mandatory
│    execution: INTERNAL | SUBCONTRACTED | OPTIONAL_EITHER
│    work_center_id?           ← để trống = quyết lúc lập kế hoạch
│    standard_time_ref         ← nối M31 OperationLibrary
│    qc_gate: NONE | INLINE | STAGE_END | BLOCKING
│    yield_expected_pct        ← hao hụt dự kiến của bước
│    ⚠️ leaves_factory: bool   ← 🔴 IN·THÊU rời khỏi nhà máy
└─ RouteBranch[]  ← rẽ nhánh có điều kiện
     condition: "colorway.requires_print = true"
     → chèn bước PRINTING
```

**Bốn mẫu chuẩn cung cấp sẵn (T1):**

| Mẫu | Chuỗi |
|---|---|
| `BASIC_WOVEN` | Kho → Cắt → May → QC → Hoàn thành → Ủi → Gấp → Đóng gói → TP → Xuất |
| `PRINTED_KNIT` | Kho → Cắt → **In** → May → QC → Hoàn thành → Ủi → Gấp → Đóng gói → TP → Xuất |
| `EMBROIDERED` | Kho → Cắt → **Thêu** → May → … |
| `FULL_DECORATION` | Kho → Cắt → **In** → **Thêu** → **Ép** → May → … |

> `DL-036` · **Quy trình sản xuất là DỮ LIỆU CHỦ, không phải mã.** Doanh nghiệp thêm công đoạn *(giặt · nhuộm · wash · laser)* mà **không sửa một dòng mã nào**.
>
> 📚 Đây là điều **Dynamics 365 và Infor làm đúng** *(routing là dữ liệu)* và **Odoo làm nửa vời** *(routing có nhưng không rẽ nhánh theo thuộc tính sản phẩm)*.
>
> 🔴 **Trường `leaves_factory` là thứ không hệ nào có** — và nó là thứ cho phép Line Map theo dõi *"1.800 chi tiết đang ở xưởng in 6 ngày"*.

### 4.6.6 Dữ liệu chủ khởi tạo — lợi thế triển khai

| Bộ | Số bản ghi | Giá trị |
|---|---|---|
| Thư viện công đoạn may | ~300 | Nhà máy mới có ngay bảng công đoạn |
| Mã lỗi may mặc | ~150 | QA chạy được ngày đầu |
| Bảng AQL ISO 2859-1 | đầy đủ | Không ai phải nhập bảng chuẩn |
| Điểm đo chuẩn theo loại sản phẩm | ~120 | Bảng thông số dùng được ngay |
| Mẫu quy trình sản xuất | 4 | Chạy được ngay |
| Lý do dừng chuyền · lý do huỷ · lý do thua | ~60 | Phân tích có ý nghĩa từ ngày đầu |
| Incoterm · Country · Currency · UOM · Port | đầy đủ | — |

> 🔴 **Đây là năng lực thương mại hoá bị đánh giá thấp nhất.** Chi phí triển khai ERP phần lớn nằm ở **nhập dữ liệu chủ**. Nhà máy mới bật Monica ONE chạy được trong **ngày đầu**, không phải ba tháng. Đây là điều **ERPNext làm đúng** và **SAP làm sai**.

---
---

# PHASE 5 · ENTERPRISE BUSINESS OBJECT

## 5.1 Tám luật thiết kế Aggregate

| # | Luật | Vì sao |
|---|---|---|
| **A1** | **Một giao dịch chỉ sửa MỘT aggregate.** Liên kết giữa aggregate bằng **ID**, không bằng con trỏ | Giữ nhất quán và cho phép mở rộng sang nhiều nhà máy |
| **A2** | **Mỗi aggregate có đúng MỘT Domain sở hữu và MỘT Role giữ sổ** | Hai chủ = không ai chịu trách nhiệm |
| **A3** | 🔴 **Mọi aggregate có máy trạng thái với BẢNG PHÉP CHUYỂN viết thành mã** | 8 bộ từ vựng không luật chuyển đã sống sót 33 migration |
| **A4** | 🔴 **Chứng từ đã chốt ⛔ không `UPDATE`** — sai thì lập chứng từ điều chỉnh | Nguyên tắc chứng từ, học từ SAP |
| **A5** | **Trường dẫn xuất ⛔ không lưu** — trừ khi được chụp làm **bằng chứng tại điểm phê duyệt** | `DL-041` |
| **A6** | 🔴 **Mọi aggregate khai `disclosure_class`**; mặc định `INTERNAL_ONLY` | Customer Portal là lợi thế cạnh tranh ⇒ mọi object phải biết ai được xem |
| **A7** | **Aggregate lập-mới-được có `request_id UUID UNIQUE`**, sinh lúc **MỞ** biểu mẫu | Chống gửi trùng ở tầng CSDL |
| **A8** | **Xoá mềm bắt buộc**; `UNIQUE` phải là chỉ mục **một phần** | |

## 5.2 SỔ ĐĂNG KÝ BUSINESS OBJECT — 63 aggregate

> **O** = Role giữ sổ · **⚡** = có máy trạng thái · **📄** = sinh chứng từ · **👁** = hiện trên cổng đối tác

### 5.2.1 D1 · COMMERCIAL — 5

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B01 | **`Inquiry`** ⚡👁 | Ghi nhận **ý định** của khách trước khi thành cam kết | `NEW→QUALIFYING→COSTING→QUOTED→WON\|LOST\|CANCELLED` | Merchandiser | 🔴 **KHÔNG bắt buộc** — `Order` tạo được không cần `inquiry_id`. `purpose: QUOTE\|SAMPLE\|CAPACITY` |
| B02 | **`Quotation`** ⚡📄👁 | Chào giá chính thức, có hiệu lực | `DRAFT→PENDING_APPROVAL→ISSUED→ACCEPTED\|REJECTED\|EXPIRED\|SUPERSEDED` | Merchandiser | ⚖️ **GĐSX duyệt.** Có `valid_until` + cảnh báo. Nhiều phương án theo số lượng |
| B03 | **`Contract`** ⚡📄👁 | Khung pháp lý trước PO | `DRAFT→SIGNED→ACTIVE→EXPIRED\|TERMINATED` | Commercial | 1 Contract : N Order. Phụ lục không sửa đè |
| B04 | **`PriceAgreement`** ⚡ | Giá đã thoả thuận, có hiệu lực theo thời gian | `DRAFT→APPROVED→ACTIVE→EXPIRED` | Commercial | ⚖️ GĐSX duyệt · 📅 |
| B05 | `CustomerRequirement` | Yêu cầu riêng từng khách *(chặng kiểm · nhãn · đóng gói · chứng từ)* | `ACTIVE→OBSOLETE` | Commercial | 🔴 Nguồn của `InspectionPlan` và bộ chứng từ |

### 5.2.2 D2 · MERCHANDISING — 7

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B06 | 🔴 **`Order`** ⚡📄👁 | **Nguồn chân lý duy nhất của cam kết với khách** | §5.3.1 | Merchandiser | Trung tâm toàn hệ thống |
| B07 | **`Costing`** ⚡ | Chi phí và giá — **bí mật tuyệt đối** | §5.3.2 | Merchandiser | ⛔ `disclosure: INTERNAL_ONLY` cứng · ⚖️ **chỉ GĐSX duyệt** |
| B08 | **`TnAPlan`** ⚡👁 | Lịch ngược và đường găng | `DRAFT→ACTIVE→COMPLETED\|ABANDONED` | Merchandiser | Mốc có **đồ thị phụ thuộc**; `is_critical` **tính, không lưu** |
| B09 | 🔴 **`OrderMaterialPlan`** ⚡ | Sở hữu NPL **theo từng dòng** — giải bài toán FOB/CMT | `DRAFT→CONFIRMED→PROCURING→READY\|SHORT` | Merchandiser | Mặc định từ `order_type`, ghi đè từng dòng — `DL-027` |
| B10 | **`OrderAllocation`** ⚡ | Chia đơn cho nội bộ/thuê ngoài | `DRAFT→PROPOSED→CONFIRMED→EXECUTING→CLOSED` | Merchandiser | `Σ allocation = Σ order qty` |
| B11 | **`OrderChange`** ⚡📄👁 | Thay đổi có kiểm soát sau xác nhận | `DRAFT→IMPACT_ANALYSED→PENDING_APPROVAL→APPROVED→APPLIED\|REJECTED` | Merchandiser | 🔴 **Bắt buộc có phân tích tác động** trước khi trình duyệt |
| B12 | **`OrderRisk`** ⚡ | Rủi ro đã nhận diện của một đơn | `IDENTIFIED→MITIGATING→CLOSED\|MATERIALISED` | Merchandiser | Nguồn cho AI §6 |

### 5.2.3 D3 · PRODUCT DEVELOPMENT — 6

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B13 | **`StyleDevelopment`** ⚡ | Đưa một mã hàng từ ý tưởng tới sẵn sàng sản xuất | `BRIEF→DESIGNING→SAMPLING→APPROVED→RELEASED` | Product Developer | Khác `Style` *(dữ liệu chủ M23)* |
| B14 | 🔴 **`TechPack`** ⚡📄👁 | Đặc tả kỹ thuật — **có phiên bản, giữ bản cũ** | `DRAFT→ISSUED→REVISED→SUPERSEDED\|OBSOLETE` | Product Developer | 🔴 **⛔ Không sửa đè.** Hiến pháp Điều 8 — dùng khi tranh chấp |
| B15 | 🔴 **`Sample`** ⚡📄👁 | Hồ sơ mẫu **số hoá toàn bộ**, mẫu vật lý vẫn gửi | §5.3.3 | Product Developer | 7 chặng · 3 tầng duyệt · đồng hồ đếm ngày ở khách |
| B16 | **`BOM`** ⚡ | Định mức — **bí mật kỹ thuật** | `DRAFT→APPROVED→REVISED→SUPERSEDED` | Product Developer | ⛔ `INTERNAL_ONLY` + phần cần may cho nhà thầu · hệ số theo cỡ |
| B17 | **`Marker`** ⚡ | Sơ đồ và hiệu suất sơ đồ | `DRAFT→APPROVED→SUPERSEDED` | Pattern/CAD | 🔴 Hiệu suất sơ đồ ảnh hưởng **thẳng** giá vốn |
| B18 | **`PPMeeting`** ⚡📄👁 | Họp tiền sản xuất — cổng vào sản xuất | `SCHEDULED→HELD→ACTIONS_CLOSED` | Product Developer | Đầu vào của cổng lên chuyền |

### 5.2.4 D4 · INDUSTRIAL ENGINEERING — 4

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B19 | 🔴 **`StandardTime`** ⚡ | **Con số nền của giá · năng lực · hiệu suất · lương** | §5.3.4 | StandardTimeKeeper | 🔴 **Nguồn duy nhất.** 4 Domain đọc, ⛔ 0 Domain sao chép |
| B20 | **`TimeStudy`** ⚡ | Phép đo bấm giờ có bằng chứng | `DRAFT→OBSERVED→CALCULATED→APPROVED\|REJECTED` | TimeStudyAnalyst | ⏳ DORMANT tới khi Monica có IE |
| B21 | **`OperationBulletin`** ⚡ | Bảng công đoạn của một style | `DRAFT→APPROVED→SUPERSEDED` | MethodEngineer | `total_smv` **tính, không lưu** |
| B22 | **`LineLayout`** ⚡ | Bố trí và cân bằng một chuyền | `DRAFT→ACTIVE→SUPERSEDED` | MethodEngineer | Nút thắt **tính, không lưu** |

### 5.2.5 D5 · PLANNING — 6

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B23 | 🔴 **`CapacityBooking`** ⚡ | Giữ chỗ năng lực lúc xác nhận đơn — **tầng 1** | `TENTATIVE→CONFIRMED→CONSUMED\|RELEASED` | CapacityPlanner | Đơn vị **tuần-WorkCenter** — `DL-015` |
| B24 | 🔴 **`CapacityCheck`** | Trả lời *"nhận nổi không"* — **CTP** | *(dịch vụ, không lưu trạng thái)* | CapacityPlanner | `FEASIBLE\|WITH_OT\|SUBCON\|NOT_FEASIBLE` |
| B25 | **`ProductionPlan`** ⚡ | Kế hoạch tuần/tháng, có phiên bản | `DRAFT→PUBLISHED→SUPERSEDED` | CapacityPlanner | So sánh phiên bản |
| B26 | **`LineSchedule`** ⚡ | Xếp block ngày-WorkCenter — **tầng 2** | `DRAFT→CONFIRMED→EXECUTING→CLOSED` | LineScheduler | `Σ block ≤ năng lực hiệu dụng` |
| B27 | 🔴 **`ProductionOrder`** ⚡📄 | **Lệnh sản xuất** — ⛔ không phải PO nội bộ | §5.3.5 | LineScheduler | Tham chiếu **nhiều** OrderLine từ **nhiều** Order — `DL-013` |
| B28 | **`MaterialRequirement`** ⚡ | MRP: cần − có − đang về = thiếu | `CALCULATED→ISSUED→FULFILLED\|SHORT` | CapacityPlanner | Sinh `PurchaseRequisition` |

### 5.2.6 D6 · MANUFACTURING — 7

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B29 | 🔴 **`ProductionFlow`** | Thể hiện `ProcessRoute` cho **một** lệnh sản xuất | `PLANNED→RUNNING→COMPLETED` | Production Manager | Nền của **Line Map** |
| B30 | **`FlowStage`** ⚡👁 | Một công đoạn trong dòng chảy | `NOT_STARTED→RUNNING→COMPLETED\|SKIPPED` | Section Head | 4 kiểu `BUFFER\|FLOW\|BATCH\|GATE` — `DL-030` |
| B31 | **`CutTicket`** ⚡📄 | Phiếu cắt và trải vải | `DRAFT→RELEASED→SPREADING→CUT→BUNDLED→CLOSED` | Cutting Manager | 🔴 Ghi `roll_id` — **mắt xích truy vết** |
| B32 | 🔴 **`Bundle`** ⚡👁 | **Đơn vị WIP nhỏ nhất — trái tim truy vết** | `CREATED→ISSUED→IN_PROGRESS→COMPLETED\|SCRAPPED` | Section Head | 🔴 Mang `roll_id` kế thừa từ CutTicket |
| B33 | **`StageThroughput`** | Sản lượng **giờ × công đoạn × bó** | *(chỉ ghi thêm)* | Line Supervisor | ✅ **Monica đã có dữ liệu này** · ⛔ số đã chốt ca không sửa |
| B34 | 🔴 **`StageTransfer`** ⚡ | **Hàng di chuyển giữa công đoạn** | `SENT→IN_TRANSIT→RECEIVED\|DISCREPANCY` | Section Head | 🔴 **Trả lời "1.800 chi tiết đang ở đâu"** — bảng 90% hệ thống bỏ quên |
| B35 | **`DowntimeEvent`** ⚡ | Dừng chuyền có lý do chuẩn | `OPEN→RESOLVED` | Line Supervisor | ⛔ Mã chuẩn, không ghi tự do |

### 5.2.7 D7 · QUALITY — 6

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B36 | **`InspectionPlan`** ⚡ | Chặng kiểm nào, mức AQL nào, **theo yêu cầu từng khách** | `DRAFT→ACTIVE→SUPERSEDED` | QA Manager | Sinh từ `CustomerRequirement` |
| B37 | 🔴 **`Inspection`** ⚡📄👁 | **MỘT chứng từ kiểm — mọi bên dùng chung** | §5.3.6 | QA Manager | 🔴 Tiết lộ ở **từng phát hiện** — `DL-021` |
| B38 | **`InspectionFinding`** | Một phát hiện, có mức tiết lộ riêng | *(con của B37)* | QC Inspector | Mặc định `INTERNAL_ONLY` |
| B39 | **`MaterialInspection`** ⚡ | Kiểm vải 4 điểm · phân dải màu | `PENDING→INSPECTING→PASSED\|CONDITIONAL\|REJECTED` | QC Inspector | 🔴 Gán `shade_group` — nền của luật cấm trộn |
| B40 | **`CAPA`** ⚡👁 | Khắc phục và phòng ngừa | `OPEN→ROOT_CAUSE→ACTION→VERIFYING→CLOSED` | QA Manager | Nhà thầu **phản hồi được** trên cổng |
| B41 | **`ExternalInspectionReport`** 📄👁 | Báo cáo bên thứ ba *(SGS·Intertek·BV)* | `RECEIVED→LINKED` | QA Manager | ⛔ **Chỉ đính kèm, không nhập nội dung** — sửa là giả mạo chứng từ |

### 5.2.8 D8 · PROCUREMENT — 6

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B42 | **`PurchaseRequisition`** ⚡ | Nhu cầu mua — **gộp nhiều đơn** | `DRAFT→SUBMITTED→APPROVED→SOURCED→CLOSED\|REJECTED` | MaterialRequester | 🔴 Gộp cùng vật tư nhiều đơn ⇒ chênh giá khối lượng |
| B43 | **`SourcingRequest`** ⚡ | So sánh chào giá NCC | `OPEN→QUOTES_RECEIVED→EVALUATED→AWARDED\|CANCELLED` | ProcurementOfficer | ⛔ Giá NCC `INTERNAL_ONLY` tuyệt đối |
| B44 | 🔴 **`PurchaseOrder`** ⚡📄👁 | Cam kết mua với NCC | §5.3.7 | ProcurementOfficer | 🔴 **Hai chữ ký: MD (kỹ thuật) + GĐSX (thương mại)** |
| B45 | **`SupplierAcknowledgement`** ⚡👁 | NCC xác nhận PO và ngày giao | `PENDING→ACKNOWLEDGED→REVISED` | *(NCC ghi)* | Supplier Portal |
| B46 | **`GoodsReceipt`** ⚡📄 | Xác nhận nhận hàng | `DRAFT→POSTED` | GoodsReceiver | 🔴 **Người nhận ≠ người mua** |
| B47 | **`ThreeWayMatch`** ⚡ | PO ⟷ nhập ⟷ hoá đơn NCC | `PENDING→MATCHED\|EXCEPTION→RESOLVED` | InvoiceMatcher | Chốt kiểm soát chi phí |

### 5.2.9 D9 · WAREHOUSE — 9

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B48 | **`InboundReceipt`** ⚡📄 | Nhận NPL mua **và NPL khách cấp** | `EXPECTED→RECEIVING→INSPECTING→PUTAWAY→CLOSED` | Storekeeper | 🔴 **Đối chiếu định mức, báo thiếu/thừa** — khâu đầu vào 70% đơn CMT |
| B49 | 🔴 **`StockLedgerEntry`** | **Nguồn chân lý duy nhất của tồn kho** | *(chỉ ghi thêm)* | Storekeeper | 🔴 ⛔ **Không `UPDATE`, không `DELETE`** — kể cả `service_role` |
| B50 | **`MaterialLot`** ⚡ | Lô vật tư có nguồn gốc và sở hữu | `RECEIVED→AVAILABLE→CONSUMED\|REJECTED` | Storekeeper | 🔴 Mang `ownership` + `owner_party_id` |
| B51 | 🔴 **`FabricRoll`** ⚡ | Cuộn vải — **đơn vị truy vết** | `RECEIVED→INSPECTING→AVAILABLE→RESERVED→ISSUED→PARTIAL→CONSUMED` | Storekeeper | 🔴 **dài hoá đơn ⟷ dài thực** · `shade_group` · khổ |
| B52 | **`Reservation`** ⚡ | Giữ chỗ theo đơn | `ACTIVE→PARTIALLY_CONSUMED→CONSUMED\|RELEASED\|EXPIRED` | Storekeeper | 🔴 Hàng khách A ⛔ không giữ cho đơn khách B |
| B53 | **`PickList`** ⚡📄 | Soạn hàng theo FIFO + **ràng buộc dải màu** | `CREATED→PICKING→PICKED→ISSUED` | Storekeeper | ⛔ Loại cuộn lệch dải màu |
| B54 | **`IssueNote`** / **`ReturnNote`** ⚡📄 | Cấp phát và **trả về hàng dư** | `DRAFT→POSTED` | Storekeeper | 🔴 **Không trả về ⇒ hao hụt thật không đo được** |
| B55 | **`StockAdjustment`** ⚡📄 | Điều chỉnh tồn có kiểm soát | `DRAFT→PENDING_APPROVAL→APPROVED→POSTED\|REJECTED` | Storekeeper | 🔴 ⚖️ **Bắt buộc duyệt + lý do + ảnh** |
| B56 | **`StockCount`** ⚡📄 | Kiểm kê | `PLANNED→COUNTING→VARIANCE_REVIEW→APPROVED→POSTED` | WH Manager | Chụp số hệ thống lúc **bắt đầu** đếm |

### 5.2.10 D10 · LOGISTICS — 5

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B57 | **`Booking`** ⚡👁 | Đặt chỗ hãng tàu | `REQUESTED→CONFIRMED→AMENDED→CANCELLED\|USED` | Logistics Officer | Cảnh báo hạn booking |
| B58 | **`PackingList`** ⚡📄👁 | Danh sách đóng gói | `DRAFT→FINAL→SUPERSEDED` | Logistics Officer | `SOLID\|RATIO\|ASSORT` |
| B59 | **`Carton`** | Thùng hàng — **mắt xích cuối truy vết** | `PACKED→SEALED→SHIPPED` | Packing Head | Nối ngược về `Bundle` → `Roll` |
| B60 | **`Shipment`** ⚡📄👁 | Lô hàng thực tế | `PLANNED→READY→LOADED→DEPARTED→IN_TRANSIT→ARRIVED→DELIVERED` | Logistics Officer | **1 Order : N Shipment** — `DL-010` |
| B61 | **`ExportDocumentSet`** ⚡📄👁 | Bộ chứng từ xuất khẩu | `PREPARING→COMPLETE→SUBMITTED` | Logistics Officer | 🔴 **Cảnh báo thiếu tờ nào** — thiếu một tờ là hàng nằm cảng |

### 5.2.11 D11 · SUBCONTRACT — 4

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B62 | 🔴 **`Assignment`** ⚡📄👁 | **Giao việc — nền của mọi phân quyền đối tác** | `DRAFT→ISSUED→ACCEPTED\|REJECTED→IN_PROGRESS→SUSPENDED→COMPLETED→CLOSED\|CANCELLED` | Subcon Coordinator | ✅ **Đã có luật chuyển đúng** — khuôn mẫu cho mọi object khác |
| B63 | **`SubconIssue`/`SubconReceipt`** ⚡📄 | Giao NPL / nhận thành phẩm | `DRAFT→POSTED` | Storekeeper | 🔴 **Chuyển quyền GIỮ HỘ, không chuyển sở hữu** |
| B64 | **`SubconDailyReport`** ⚡👁 | Báo cáo ngày — **nhà thầu BẮT BUỘC ghi** | `DRAFT→SUBMITTED→ACCEPTED\|QUERIED` | *(Nhà thầu ghi)* | `BR-ACC-006` |
| B65 | **`WastageReconciliation`** ⚡ | Đối soát hao hụt gia công | `OPEN→RECONCILED→DISPUTED→SETTLED` | Subcon Coordinator | NPL cấp ⟷ thành phẩm nhận ⟷ định mức |

### 5.2.12 D12 · FINANCE — 8

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc then chốt |
|---|---|---|---|---|---|
| B66 | **`InvoiceRequest`** ⚡📄👁 | Đề nghị MISA xuất hoá đơn | `DRAFT→SENT_TO_MISA→INVOICED\|REJECTED` | Accountant | ⛔ Monica ONE **không** phát hành hoá đơn |
| B67 | 🔴 **`ExternalInvoiceMirror`** | Bản sao hoá đơn MISA | `MIRRORED→RECONCILED\|DISCREPANT` | Accountant | Nền của đối chiếu |
| B68 | **`Payment`** ⚡👁 | Ghi nhận thu | `RECEIVED→ALLOCATED→CLOSED` | Accountant | Đối chiếu với hoá đơn |
| B69 | 🔴 **`Deduction`** ⚡📄👁 | **Khấu trừ — giải thích chênh lệch MISA** | `CLAIMED→UNDER_REVIEW→ACCEPTED\|DISPUTED→SETTLED` | Accountant | ⚖️ Kế toán trưởng duyệt · lý do chuẩn hoá |
| B70 | **`Receivable`** ⚡👁 | Công nợ **theo đơn** | `OPEN→PARTIALLY_PAID→PAID\|WRITTEN_OFF` | Accountant | Tuổi nợ · nhắc nợ |
| B71 | **`Payable`** ⚡👁 | Nợ NCC và nhà thầu | `OPEN→PARTIALLY_PAID→PAID` | Accountant | Sau đối chiếu 3 chiều |
| B72 | 🔴 **`CostActual`** | **Giá vốn thật · biên thật · 4 trục lợi nhuận** | §5.3.9 | Cost Controller | 🔴 `BDR-05` — cơ sở phân bổ |
| B73 | 🔴 **`ReconciliationRun`** ⚡ | Đối chiếu Monica ONE ⟷ MISA | `RUNNING→COMPLETED→EXCEPTIONS_OPEN→CLOSED` | Accountant | 4 loại chênh lệch |

### 5.2.13 D13 · PEOPLE — 3

| # | Object | Sứ mệnh | Vòng đời | O |
|---|---|---|---|---|
| B74 | `AttendanceRecord` | Chấm công, ca, tăng ca | `RECORDED→APPROVED→LOCKED` | HR Manager |
| B75 | 🔴 **`PieceRateEarning`** | Lương sản phẩm = sản lượng × thời gian chuẩn × đơn giá phút | `CALCULATED→APPROVED→PAID` | HR Manager | 🔴 **Người tiêu thụ thứ tư của `StandardTime`** |
| B76 | `SkillAssessment` | Ma trận tay nghề | `ASSESSED→CERTIFIED→EXPIRED` | HR Manager |

### 5.2.14 🆕 RISK & INTELLIGENCE — 4 *(Joseph: AI là Capability)*

| # | Object | Sứ mệnh | Vòng đời | O | Quy tắc |
|---|---|---|---|---|---|
| B77 | 🔴 **`RiskSignal`** ⚡ | **Tín hiệu rủi ro có bằng chứng** | `DETECTED→ACKNOWLEDGED→MITIGATING→RESOLVED\|MATERIALISED` | tuỳ loại | 🔴 **Mọi tín hiệu trỏ được về bản ghi gốc** — không nguồn = không hiện |
| B78 | **`Prediction`** | Dự báo có khoảng tin cậy | `GENERATED→SUPERSEDED` | S7 | 🔴 **Luôn kèm độ tin cậy và cơ sở.** Dự báo không nói mình có thể sai là dự báo nguy hiểm |
| B79 | **`AnomalyDetection`** | Phát hiện bất thường so với chuẩn | `DETECTED→REVIEWED→TRUE_POSITIVE\|FALSE_POSITIVE` | S7 | 🔴 **Vòng phản hồi bắt buộc** — không có thì mô hình không cải thiện |
| B80 | **`RecommendedAction`** | Đề xuất phương án xử lý | `PROPOSED→ACCEPTED\|REJECTED\|MODIFIED` | S7 | ⛔ **AI đề xuất, người quyết** — Hiến pháp §12.5 |

### 5.2.15 SHARED KERNEL — 8

| # | Object | Sứ mệnh | O |
|---|---|---|---|
| B81 | **`Document`** ⚡📄👁 | Chứng từ **có phiên bản** + bằng chứng | S4 |
| B82 | 🔴 **`ApprovalRequest`** ⚡ | Yêu cầu duyệt + **uỷ quyền có thời hạn** + leo thang | S5 |
| B83 | 🔴 **`WorkItem`** | **Phép chiếu**, ⛔ không phải bảng ai đó tạo/đóng | S7 |
| B84 | **`DomainEvent`** | Sự kiện nghiệp vụ chỉ-ghi-thêm | S9 |
| B85 | **`Notification`** | Thông báo **có hành động** | S6 |
| B86 | **`Thread`** ⚡👁 | Luồng trao đổi theo ngữ cảnh | S6 |
| B87 | **`AuditEntry`** | Ai · lúc nào · **thấy gì** | S9 |
| B88 | **`ReadModel`** | Phép chiếu đọc — nguồn của mọi báo cáo | S7 |

## 5.3 THIẾT KẾ SÂU — 9 aggregate then chốt

### 5.3.1 🔴 `Order` — trung tâm toàn hệ thống

**Sứ mệnh:** nguồn chân lý duy nhất của **cam kết Monica đã hứa với khách**. Mọi Domain khác **đọc**; ⛔ chỉ D2 **ghi**.

```typescript
ORDER_TRANSITIONS = {
  DRAFT:               ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:           ['PLANNED', 'ON_HOLD', 'CANCELLED'],
  PLANNED:             ['IN_PRODUCTION', 'ON_HOLD', 'CANCELLED'],
  IN_PRODUCTION:       ['PRODUCTION_COMPLETE', 'ON_HOLD', 'CANCELLED'],
  PRODUCTION_COMPLETE: ['SHIPPED', 'ON_HOLD'],
  SHIPPED:             ['INVOICED'],
  INVOICED:            ['SETTLED'],
  SETTLED:             ['CLOSED'],
  ON_HOLD:             ['CONFIRMED','PLANNED','IN_PRODUCTION','CANCELLED'],
  CLOSED:    [],   CANCELLED: [],
}
```

> `DL-037` · **Thêm trạng thái `SETTLED` giữa `INVOICED` và `CLOSED`.**
> Joseph xác nhận chuỗi kết ở **Payment**. Nhưng *"đã thu tiền"* và *"đơn đóng sổ"* là hai sự kiện: thu tiền xong vẫn có thể còn khấu trừ đang tranh chấp. `SETTLED` = tiền đã về; `CLOSED` = **không còn nghĩa vụ nào hai bên**.

**Bốn cổng kiểm soát:**

| Cổng | Chuyển | Điều kiện | Vượt được? |
|---|---|---|---|
| **1** | `DRAFT→CONFIRMED` | chứng từ PO khách · giá đã duyệt · ngày giao · `OrderMaterialPlan` quyết · **CTP trả lời** | ⚠️ mềm — cảnh báo + ghi người bỏ qua |
| **2** | `CONFIRMED→PLANNED` | T&A sinh · phân bổ xong · MRP tính | ⚠️ mềm |
| **3** | `PLANNED→IN_PRODUCTION` | **PP duyệt** + **NPL sẵn sàng ≥ ngưỡng** | 🔴 **cứng — GĐSX vượt, bắt buộc lý do** |
| **4** | `PRODUCTION_COMPLETE→SHIPPED` | QA Final **đạt** · packing list · booking · **bộ chứng từ đủ** | 🔴 **cứng** |

> `DL-038` · **Cổng 1–2 MỀM, cổng 3–4 CỨNG.** Cổng sớm thì dữ liệu chưa chắc, chặn cứng sẽ khiến người dùng tìm đường vòng và **cổng thành trang trí**. Cổng muộn thì hậu quả tốn tiền và không đảo ngược được.

**🔴 Huỷ đơn — Joseph đã quyết GĐSX là người quyết định cuối cùng. Tôi bổ sung cơ chế đồng phê duyệt:**

```
CancelOrder(order_id, reason_code, material_disposition)
  ├─ GĐSX quyết định                                    ✅ Joseph đã chốt
  ├─ 🆕 ĐỒNG KÝ khi thoả một trong ba:
  │     ① giá trị đơn > ngưỡng                → CEO đồng ký
  │     ② đã mua NPL (FOB)                    → 🔴 Kế toán trưởng đồng ký
  │     ③ đã có Assignment đang chạy          → Subcon Coordinator xác nhận xử lý
  ├─ BẮT BUỘC: kế hoạch xử lý NPL
  │     RETURN_TO_SUPPLIER | CHARGE_TO_CUSTOMER | STOCK_FOR_REUSE | SCRAP
  ├─ BẮT BUỘC: xử lý Assignment · Reservation · CapacityBooking
  └─ Sinh Deduction/Claim nếu có · emit OrderCancelled
```

> `DL-042` · **Vì sao đề xuất đồng ký ở điều kiện ②:** với đơn FOB, NPL đã mua là **62% giá trị đơn, tiền đã ra khỏi công ty**. Huỷ đơn khi đó **không phải quyết định vận hành — là một bút toán xoá sổ tài sản**. Người quyết vận hành *(GĐSX)* và người chịu trách nhiệm con số *(Kế toán trưởng)* nên cùng ký. Đây là chuẩn kiểm soát nội bộ, không phải nghi ngờ ai.
>
> ⚠️ Với đơn CMT *(70%)* — NPL của khách, Monica không mất tiền NPL — **GĐSX quyết một mình là đủ**. Cơ chế chỉ kích hoạt ở 30% đơn có rủi ro tài chính thật.

### 5.3.2 `Costing` — bí mật tuyệt đối

```
Costing ── version · supersedes_id ── ⛔ disclosure: INTERNAL_ONLY (CỨNG, không đổi được)
├─ CostingLine[]  category: MATERIAL|TRIM|LABOUR|OVERHEAD|LOGISTICS|FINANCE
│    source_ref → BOM line (D3) hoặc StandardTime (D4)   ← 🔴 TRUY VẾT
│    manual_override + lý do                              ← số gõ tay phải đánh dấu
├─ fx_rate_at_quote                                       ← 🔴 chênh tỷ giá là lãi/lỗ thật
├─ 🔴 margin_percent  = TÍNH, KHÔNG LƯU
└─ CostingApproval → ⚖️ CHỈ GĐSX
     🔴 approval_snapshot  ← CHỤP LẠI đúng thứ người duyệt đã nhìn thấy
```

> `DL-041` · **`margin_percent` không lưu trên `Costing`, NHƯNG chụp vào `approval_snapshot`.**
> Đây là chỗ tôi **sửa lại chính mình**: bản trình trước tôi ghi *"không lưu"* — nhưng thế thì **mất bằng chứng phê duyệt**, vi phạm Hiến pháp Điều 8. Dữ liệu vận hành **không lưu**; bằng chứng **có lưu**. Hai thứ khác nhau và tôi đã trộn chúng.

**Ba cơ chế đi kèm quyền duyệt tập trung ở GĐSX:**

| # | Cơ chế | Giải vấn đề |
|---|---|---|
| 1 | Màn hình duyệt hiện **giá lần trước cùng khách/cùng loại + biên so ngưỡng** | Duyệt có ngữ cảnh |
| 2 | 🔴 **Uỷ quyền có thời hạn** | Một người duyệt duy nhất = **một điểm chết**. GĐSX nghỉ ⇒ mọi báo giá đứng |
| 3 | Báo cáo tháng: mọi lần duyệt dưới ngưỡng biên | Không chặn ai, chỉ làm cho nhìn thấy được |

### 5.3.3 `Sample` — số hoá hồ sơ, không số hoá phán quyết

**Ba tầng duyệt:**

| Tầng | Đối tượng | Mẫu vật lý? | Duyệt trên Portal |
|---|---|---|---|
| 🟢 **A** | artwork · vị trí in · nội dung nhãn · **bảng thông số đo** · cách đóng gói | ❌ | ✅ **hiệu lực đầy đủ** |
| 🟡 **B** | **fit · PP · TOP** | ✅ | ✅ **ghi nhận** phán quyết đã có trên vật lý + chữ ký |
| 🔴 **C** | **dải màu · tay vải · lab dip** | ✅ luôn | ⚠️ chỉ ghi kết quả; hệ thống quản **logistics và thời gian** |

> 🔴 **Tầng A là chiến thắng bị bỏ quên.** Bảng thông số đo — so số đo thực với thông số khách — **không cần chạm vào vải**. Nó là một bảng số, hôm nay đi qua email và Excel. Số hoá nó: **giá trị lớn, rủi ro bằng 0**.

**Năm năng lực có ngay dù mẫu vẫn gửi vật lý:** đồng hồ đếm ngày mẫu nằm ở khách · ảnh **có thước đo** + bảng thông số · phả hệ phiên bản · bình luận gắn **điểm đo** · đếm số vòng lặp và **chi phí mẫu**.

⚠️ **Giá trị pháp lý của chữ ký điện tử** phụ thuộc hợp đồng với từng khách và luật nước họ — hệ thống cung cấp **bản ghi kiểm toán được**; hiệu lực pháp lý là điều khoản hợp đồng, cần pháp chế xác nhận với từng buyer.

### 5.3.4 🔴 `StandardTime` — con số nền

```
StandardTime
├─ style_id · operation_id? · effective_from 📅
├─ standard_minutes
├─ source: ESTIMATE | BENCHMARK_SIMILAR | TIME_STUDY
├─ confidence: LOW | MEDIUM | HIGH
├─ estimated_by · approved_by
└─ 🔴 actual_minutes  ← TÍNH từ StageThroughput (Monica ĐÃ CÓ dữ liệu bó × công đoạn × giờ)
```

| Người tiêu thụ | Dùng làm gì |
|---|---|
| D2 `Costing` | chi phí công |
| D5 `CapacityBooking` | đổi ra tuần-WorkCenter |
| D6 `StageThroughput` | mục tiêu giờ · hiệu suất |
| D13 `PieceRateEarning` | lương sản phẩm |

> `DL-039` · **Bốn Domain ĐỌC, ⛔ 0 Domain sao chép.** Vi phạm luật `DEP-3` *(cấm lưu trường dẫn xuất qua ranh giới Domain)*.
>
> 🔴 **Cột `actual_minutes` biến sổ này thành cỗ máy tự học.** Sau 10–20 đơn, Monica có bảng thời gian chuẩn của **chính mình** — chính xác hơn mọi bảng SMV mua ngoài, **không cần thuê một kỹ sư IE nào**. Khi Monica tuyển IE, họ đổi `source` từ `ESTIMATE` sang `TIME_STUDY`; ⛔ **không một người tiêu thụ nào phải sửa gì**.

### 5.3.5 `ProductionOrder` — giải cả tách lẫn gộp

```
ProductionOrder
├─ production_order_no · process_route_id → M58
├─ 🔴 OrderLineRef[]  ← THAM CHIẾU NHIỀU dòng từ NHIỀU Order
│     order_id · order_line_id · qty_allocated
├─ work_center_id · planned_start/end
├─ 🔴 ReleaseGate
│     pp_approved (D3) · material_readiness_pct (D9) · bulletin_approved (D4)
│     override_by · override_reason         ← GĐSX
└─ status: PENDING → RELEASED → IN_PROGRESS → COMPLETED | CANCELLED
```

`DL-013` giải **cả hai** bài toán bằng một cấu trúc: **tách** = một Order sinh nhiều ProductionOrder; **gộp** = một ProductionOrder tham chiếu OrderLine từ nhiều Order *(hai PO cùng style gộp một lệnh cắt — thực tiễn thật, tiết kiệm vải)*.

⛔ **`ProductionOrder` là LỆNH SẢN XUẤT, không mang ngữ nghĩa thương mại** — giải `CF-3`.

### 5.3.6 🔴 `Inspection` — mô hình QA tối ưu

📚 **Nghiên cứu thực tiễn:**

| Nguồn | Cách làm | Đánh giá |
|---|---|---|
| **Nhà máy VN phổ biến** | Sổ QA nội bộ riêng + báo cáo cho khách làm riêng bằng Excel | 🔴 **Hai bộ dữ liệu ⇒ hai con số ⇒ không đối soát được** |
| **Buyer quốc tế** *(Inditex·H&M·Uniqlo)* | Áp mẫu báo cáo riêng, dùng nền tảng riêng | Nhà máy phải nhập lại lần thứ ba |
| **Bên thứ ba** *(SGS·Intertek·BV)* | Báo cáo độc lập, không sửa được | ✅ đúng — giữ nguyên làm tài liệu đính kèm |
| 🟢 **Chuẩn tốt nhất** *(nhà máy tier-1)* | **Một sự kiện kiểm, nhiều lăng kính** | ✅ **Monica ONE chọn hướng này** |

```
Inspection (MỘT aggregate — mọi bên dùng chung)
├─ inspection_type → M56 · aql_plan → M55
├─ performed_by_party: MONICA | CUSTOMER | THIRD_PARTY | SUBCONTRACTOR
├─ order_id · assignment_id? · work_center_id? · lot_id?
├─ InspectionFinding[]   ← 🔴 MỖI PHÁT HIỆN CÓ MỨC TIẾT LỘ RIÊNG
│    defect_code → M53 · severity · qty · vị trí · ảnh
│    disclosure: INTERNAL_ONLY | CUSTOMER | SUBCON | ALL_PARTIES
├─ Measurement[]   ← disclosure riêng
└─ Conclusion: PASS | FAIL | CONDITIONAL
```

**Một lần kiểm Final chứa cả bốn loại:**

| Phát hiện | Tiết lộ | Vì sao |
|---|---|---|
| *"Vòng ngực lệch +1,5cm / 6 trong 32"* | `CUSTOMER` | Khách có quyền biết |
| *"Trạm tra tay — công nhân mới, lỗi lặp"* | 🔴 `INTERNAL_ONLY` | Vấn đề nội bộ. Khách biết = mất vị thế đàm phán |
| *"Nhà thầu B: đường may không đều 12 pcs"* | `SUBCON` **chỉ B** | B phải biết để sửa; ⛔ C không được biết |
| *"Kết luận: ĐẠT AQL 2.5"* | `ALL_PARTIES` | Kết luận là chung |

**Ba cơ chế cưỡng chế:**

| # | Cơ chế |
|---|---|
| `QA-1` | 🔴 **Mặc định `INTERNAL_ONLY`.** Chia sẻ là hành động có chủ ý, có người, có dấu thời gian |
| `QA-2` | 🔴 **"Ghi chú nội bộ" và "nội dung chia sẻ" là HAI Ô TÁCH BIỆT trên màn hình** — ⛔ không phải một ô có cờ. Không dựa vào kỷ luật người nhập |
| `QA-3` | **Mỗi mức tiết lộ có bài kiểm hồi quy riêng**, mỗi bài ≥ 1 vai **chờ thấy > 0** |

> ⚠️ **Rủi ro phải nêu:** tiết lộ cấp trường **khó kiểm hơn** cấp chứng từ. Hai chứng từ tách rời thì lỗi là *"cho xem nhầm file"* — dễ thấy. Một chứng từ nhiều mức thì lỗi là *"lộ một dòng trong 40 dòng"* — **có thể không ai phát hiện nhiều tháng**. Vì vậy `QA-3` **không phải khuyến nghị, là điều kiện**.

### 5.3.7 `PurchaseOrder` — hai chữ ký, hai câu hỏi khác nhau

Joseph: *"GĐSX và MD cùng tham gia phê duyệt theo quy trình anh đề xuất."*

```
PurchaseRequisition (MD lập — "cần gì")
        ▼
PurchaseOrder DRAFT
        ├── ✍️ CHỮ KÝ 1 · MD  — CÂU HỎI KỸ THUẬT
        │     "Đúng vật tư? Đúng thông số TechPack? Đúng số lượng theo BOM?
        │      Kịp ngày lên chuyền?"
        ├── ✍️ CHỮ KÝ 2 · GĐSX — CÂU HỎI THƯƠNG MẠI
        │     "Giá hợp lý so lần trước? NCC đáng tin? Điều khoản chấp nhận được?"
        ▼
    ISSUED → ACKNOWLEDGED → PARTIALLY_RECEIVED → RECEIVED → CLOSED | CANCELLED
```

> `DL-040` · **Hai chữ ký này KHÔNG phải hai cấp duyệt — là hai CÂU HỎI khác nhau.**
>
> Duyệt hai cấp *(cấp dưới ký rồi cấp trên ký lại cùng một thứ)* là hình thức và làm chậm. **Hai câu hỏi khác nhau** thì mỗi người trả lời đúng chuyên môn của mình, và **không ai ký hộ ai**.
>
> Đây cũng là cách thoả yêu cầu của Joseph mà **vẫn giữ phân tách nhiệm vụ**: MD *(người cần hàng)* ⛔ không tự chốt giá; GĐSX *(người chốt giá)* ⛔ không tự xác định nhu cầu.
>
> 🔴 **Với PO vượt ngưỡng giá trị lớn, tôi đề nghị chữ ký thứ ba: CEO hoặc Kế toán trưởng** — vì hôm nay GĐSX vừa duyệt **giá bán** vừa duyệt **giá mua**, và không ai đối trọng. Ngưỡng do Joseph đặt.

### 5.3.8 🔴 `WorkItem` — phép chiếu, không phải bảng

```
❌ SAI:  ai đó TẠO dòng việc → ai đó ĐÓNG → dòng ở lại khi quên đóng → RÁC
✅ ĐÚNG: Domain KHAI BÁO luật → S7 chiếu trạng thái ra việc → việc BIẾN MẤT khi trạng thái đổi
```

```
WorkItemRule (M62 — DỮ LIỆU CHỦ, không phải mã)
  id · domain · condition · recipient(Role ∩ Assignment)
  kind: ACTION_REQUIRED | AWAITING_MY_APPROVAL | MY_EXCEPTION
        | DUE_SOON | ⚪ I_AM_WAITING
  due_rule · target_url · priority_formula
```

**Ưu tiên = `Giá trị bị đe doạ × Độ khẩn × Hệ số không đảo ngược`**
*(lỡ tàu = 3,0 · trễ mốc nội bộ = 1,0 — lỡ tàu không lấy lại được)*

> 🔴 **Loại `I_AM_WAITING` là loại mọi hệ thống bỏ quên và là loại có giá trị cao nhất ở ngành may.** *"Mẫu gửi khách 11 ngày chưa phản hồi"* — merchandiser không quên, họ **không có cách nào biết** trừ khi lục email.

### 5.3.9 🔴 `CostActual` — bốn trục lợi nhuận Joseph yêu cầu

```
CostActual (một bản ghi cho mỗi Order)
├─ Chi phí trực tiếp — QUY ĐƯỢC THẲNG, không cần phân bổ
│    NPL thực (FOB) · phí gia công ngoài · phí in/thêu
│    logistics thực · khấu trừ · chênh tỷ giá
├─ Chi phí nhân công — quy được qua StandardTime × sản lượng thật
├─ 🔴 Chi phí chung — CẦN CƠ SỞ PHÂN BỔ  → BDR-05
└─ Bốn trục xem lợi nhuận:
     theo ĐƠN HÀNG · theo KHÁCH · theo NHÀ MÁY (Site) · theo NHÀ THẦU
```

> 🔴 **Chỉ một câu hỏi phải hỏi Board: chi phí chung phân bổ theo cơ sở nào?** Đây không phải câu hỏi kỹ thuật — nó **thay đổi kết luận đơn nào lãi, khách nào lãi**. Xem `BDR-05`.

## 5.4 Bản đồ quan hệ — xương sống nghiệp vụ

```
Party ──▶ Customer ──▶ Contract ──▶ Inquiry? ──▶ Quotation ──▶ ORDER ◀── điểm hội tụ
                                        │                          │
   Style ──▶ TechPack ──▶ Sample ──▶ Costing ────────────────────┘
     │           │                                                 │
     └──▶ BOM ───┴──▶ OrderMaterialPlan ──┬──▶ PurchaseRequisition ──▶ PurchaseOrder ──▶ GoodsReceipt
                                          └──▶ InboundReceipt (khách cấp)         │
                                                        │                          ▼
   StandardTime ──▶ CapacityBooking ──▶ ProductionOrder  └──▶ MaterialLot ──▶ FabricRoll
        │                                     │                                    │
        │                              ProductionFlow ──▶ FlowStage[]              │
        │                                     │                                    ▼
        └──────────────────────────────▶ CutTicket ◀────────────────────── PickList/IssueNote
                                              │
                                          BUNDLE ──▶ StageThroughput ──▶ StageTransfer
                                              │           │                    │
                                    Assignment│      Inspection           (in/thêu ra ngoài)
                                              ▼           │
                                          Carton ◀────────┘
                                              │
                                     PackingList ──▶ Shipment ──▶ ExportDocumentSet
                                                          │
                                          InvoiceRequest ──┴──▶ [MISA] ──▶ ExternalInvoiceMirror
                                                                              │
                                                          Payment ──▶ Deduction ──▶ Receivable
                                                                              │
                                                                       ReconciliationRun
                                                                              │
                                                                        CostActual (4 trục)
```

🔴 **Chuỗi truy vết không đứt:** `FabricRoll → CutTicket → Bundle → StageThroughput → Carton → Shipment → Customer` — hai chiều, dùng khi thu hồi *(xuôi)* và khi khách khiếu nại *(ngược)*.

---
---

# §6 · AI LÀ CAPABILITY — thiết kế

Joseph: *"CEO biết rủi ro trước khi sự cố xảy ra."*

## 6.1 Bốn tầng — không phải một tính năng

| Tầng | Năng lực | Nguồn dữ liệu | Cần gì | Khi nào |
|---|---|---|---|---|
| **1 · MÔ TẢ** | *"Đơn này đang tắc ở đâu?"* · tóm tắt lịch sử · trả lời hỏi đáp | read-model S7 | có ngay | **v1** |
| **2 · CHẨN ĐOÁN** | *"Vì sao chuyền 3 chậm?"* — phân tích nguyên nhân từ downtime · DHU · nhân lực | D6 · D7 | mã lý do chuẩn | **v1** |
| **3 · DỰ BÁO** | 🔴 **cảnh báo trễ tiến độ · nguy cơ vượt chi phí · NGUY CƠ LỖ** | lịch sử 6–12 tháng | 🔴 **dữ liệu tích luỹ** | **v2** |
| **4 · ĐỀ XUẤT** | *"Chuyển 2.000 pcs sang xưởng Phú Thịnh để kịp tàu"* | tầng 3 + năng lực + chi phí | tầng 3 chín | **v3** |

## 6.2 🔴 Năm tín hiệu rủi ro — **làm được NGAY, không cần học máy**

Đây là điểm quan trọng nhất mục này: **phần lớn giá trị "AI cảnh báo sớm" đạt được bằng LUẬT, không cần mô hình.**

| Tín hiệu | Công thức | Cảnh báo trước |
|---|---|---|
| 🔴 **Nguy cơ trễ tàu** | `ETA dự phóng từ Line Map > ETD booking − đệm` | **2–4 tuần** |
| 🔴 **Nguy cơ LỖ** | `chi phí thực luỹ kế + chi phí còn lại dự phóng > doanh thu đơn` | **giữa chừng sản xuất** |
| 🔴 **Vượt chi phí NPL** | `tiêu thụ thực > định mức × (1 + hao hụt cho phép)` | **ngay khi cắt** |
| 🔴 **Nguy cơ chuyền đứng** | `days_of_cover công đoạn kế < 0,5 ngày` | **1–2 ngày** |
| 🔴 **Khách rủi ro thanh toán** | `công nợ quá hạn > 0 AND đơn đang chạy > 0` | **liên tục** |

> `DL-043` · **Xây năm tín hiệu LUẬT trước, mô hình học máy sau.**
> Lý do: luật **giải thích được** *(CEO thấy vì sao)*, **kiểm thử được**, **chạy được từ ngày đầu**, và **không cần dữ liệu lịch sử**. Mô hình học máy cần 6–12 tháng dữ liệu — mà Monica ONE chưa chạy thì chưa có dữ liệu đó.
>
> 📚 Đây là chỗ nhiều dự án ERP đốt tiền: xây AI trước khi có dữ liệu, rồi mô hình dự báo bằng số ngẫu nhiên.

## 6.3 Bốn luật cứng của AI

| # | Luật | Nguồn |
|---|---|---|
| `AI-1` | 🔴 **AI đọc qua CÙNG lớp phân quyền với người đang hỏi.** ⛔ Không có đường tắt `service_role` | AI ⛔ không được là kênh vượt RLS |
| `AI-2` | 🔴 **Mọi phát biểu trỏ được về bản ghi gốc.** Không nguồn = không hiện | Hiến pháp Điều 8 |
| `AI-3` | 🔴 **AI ⛔ không ghi vào bảng nghiệp vụ.** Nó điền biểu mẫu; **người bấm lưu** | Hiến pháp §12.5 · §31.7 |
| `AI-4` | **Mọi dự báo kèm độ tin cậy và cơ sở** | Dự báo không nói mình có thể sai là dự báo nguy hiểm |

---

# §7 · DNA CỦA MONICA ONE

## 7.1 Xác nhận 13 năng lực Joseph nêu

Work Inbox · Executive Center · Line Map · Planning · QA · AI · Customer Portal · Subcontract Portal · Realtime Dashboard · Realtime Collaboration · Chat · Notification · Analytics — **tất cả đã có chỗ trong EDD-01 và EDD-02.**

## 7.2 🆕 Sáu năng lực DNA tôi đề xuất bổ sung

Tiêu chí: **cộng dồn theo thời gian** *(giá trị tăng, không giảm)* + **đối thủ không sao chép được trong 12 tháng**.

| # | Năng lực | Vì sao là DNA | Cộng dồn? | Sao chép được? |
|---|---|---|---|---|
| **DNA-1** | 🔴 **Đồ thị bằng chứng** — mọi giao dịch gắn ảnh/chứng từ, truy ngược được | Tranh chấp ngành may xử bằng **ảnh và chứng từ**. Nhà máy có 3 năm bằng chứng có vị thế đàm phán khấu trừ mà đối thủ không có | ✅ **giá trị tăng theo tuổi dữ liệu** | ❌ **không mua được** |
| **DNA-2** | 🔴 **Chi phí phục vụ theo khách** — khách nào **thật sự** lãi sau khấu trừ, chi phí mẫu, làm lại, giao gấp | 📚 **Phần lớn nhà máy gia công không biết khách nào lỗ.** Họ chỉ biết doanh thu. Biết được điều này đổi cả chiến lược thương mại | ✅ | ❌ đòi mô hình chi phí đầy đủ |
| **DNA-3** | 🔴 **Sổ thời gian chuẩn tự học** — hệ thống học thời gian thật của chính nhà máy từ dữ liệu của nó | Không nhà máy nào có bảng SMV đúng với **chính mình**. Monica có sẵn dữ liệu để làm | ✅ **chính xác dần** | ❌ cần dữ liệu bó × công đoạn |
| **DNA-4** | 🔴 **Trả lời cam kết tức thì (CTP)** — buyer hỏi *"nhận nổi không"*, trả lời trong 30 giây kèm ngày | 📚 Nhà máy khác trả lời sau 2–3 ngày họp nội bộ. **Đây là công cụ BÁN HÀNG, không phải công cụ kế hoạch** | ⚠️ | ❌ cần mô hình năng lực + thời gian chuẩn |
| **DNA-5** | 🔴 **Điều hành liền mạch trong-ngoài** — chuyền nội bộ và xưởng ngoài **cùng một mô hình** | ⛔ Không hệ nào trong 8 hệ benchmark làm được. Chúng mất dấu hàng ngay khi rời nhà máy | ✅ | ❌ **đòi viết lại mô hình bảo mật** |
| **DNA-6** | **Trí tuệ khấu trừ** — mọi khấu trừ có lý do chuẩn hoá + bằng chứng phản biện | Sau 2 năm, Monica biết khách nào khấu trừ nhiều nhất vì lý do gì, và **có bằng chứng để đàm phán lại** | ✅ | ❌ |

## 7.3 ⛔ Ba thứ KHÔNG phải DNA — nói rõ để không đầu tư nhầm

| Không phải DNA | Vì sao |
|---|---|
| Giao diện đẹp | Sao chép trong 6 tháng |
| Nhiều tính năng | Sao chép được, và **nhiều tính năng làm sản phẩm khó dùng hơn** |
| **"Có AI"** | 🔴 **Ai cũng có.** Khác biệt không nằm ở *có AI* — nằm ở **AI có dữ liệu gì để nhìn**. Đó là DNA-1 và DNA-3 |

---

# §8 · DECISION LOG — 13 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-031` | **Chuyền nhà thầu CŨNG là `WorkCenter`** — nội bộ và thuê ngoài cùng mô hình | Nền của DNA-5 và Line Map liền mạch | ⚠️ khó |
| `DL-032` | **Dịch NHÃN của MÃ, ⛔ không dịch NỘI DUNG của HỒ SƠ** | Giải mâu thuẫn Hiến pháp §45.7 với nhu cầu buyer TQ | ✅ |
| `DL-033` | **BOM khai ở cấp `Style`**, hệ số theo `Size`, ghi đè theo `Colorway` | Khai cấp tổ hợp ⇒ 30 BOM cho 1 style | 🔴 rất khó |
| `DL-034` | **Quy đổi đơn vị đo gắn vào `Material`**, không phải bảng toàn cục | kg↔mét phụ thuộc gsm và khổ của **chính vật tư đó** | ⚠️ khó |
| `DL-035` | **`FactoryCalendar` gắn vào `Site`**, không gắn `Tenant` | Đa quốc gia: VN nghỉ Tết, Bangladesh nghỉ Eid | ✅ |
| `DL-036` | 🔴 **`ProcessRoute` là DỮ LIỆU CHỦ, không phải mã** — có `leaves_factory` | Joseph: *"không hard-code"*. Trường `leaves_factory` là thứ không hệ nào có | ⚠️ khó |
| `DL-037` | **Thêm trạng thái `SETTLED`** giữa `INVOICED` và `CLOSED` | Thu tiền xong ≠ hết nghĩa vụ *(còn khấu trừ tranh chấp)* | ✅ |
| `DL-038` | **Cổng 1–2 MỀM · cổng 3–4 CỨNG** | Cổng sớm chặn cứng ⇒ người dùng đi đường vòng ⇒ cổng thành trang trí | ✅ |
| `DL-039` | **`StandardTime`: 4 Domain đọc, ⛔ 0 Domain sao chép** | Một con số 4 người dùng, 0 chủ ⇒ thành 4 con số | ⚠️ khó |
| `DL-040` | **PO mua hai chữ ký = hai CÂU HỎI khác nhau** *(MD kỹ thuật · GĐSX thương mại)* | Thoả yêu cầu Joseph mà vẫn giữ phân tách nhiệm vụ | ✅ |
| `DL-041` | **`margin_percent` ⛔ không lưu, NHƯNG chụp vào `approval_snapshot`** | **Sửa lại chính mình** — bản trước làm mất bằng chứng phê duyệt | ✅ |
| `DL-042` | **Huỷ đơn: GĐSX quyết; đồng ký khi ① vượt ngưỡng · ② đã mua NPL · ③ có Assignment chạy** | Huỷ đơn FOB đã mua NPL là **bút toán xoá sổ tài sản**, không phải quyết định vận hành | ✅ |
| `DL-043` | **Xây 5 tín hiệu rủi ro bằng LUẬT trước, học máy sau** | Luật giải thích được, kiểm thử được, chạy ngày đầu. Học máy cần 6–12 tháng dữ liệu chưa có | ✅ |

**Cộng dồn EDD-01 + EDD-02: 43 quyết định.**

---

# §9 · BOARD DECISION REQUIRED — 5

---

## `BDR-01` · MÔ HÌNH ĐA THUÊ BAO *(Multi-tenancy)*

**Vấn đề.** Joseph yêu cầu thương mại hoá cho nhiều doanh nghiệp, nhiều quốc gia. Cách cô lập dữ liệu giữa các doanh nghiệp là **quyết định nền tảng CSDL** — chọn sai thì di trú là viết lại.

| | **Phương án A · Lược đồ dùng chung** *(một CSDL, `tenant_id` mọi bảng, RLS cô lập)* | **Phương án B · Lược đồ riêng từng khách** |
|---|---|---|
| **Ưu điểm** | Chi phí hạ tầng thấp nhất · **một lần nâng cấp cho mọi khách** · vận hành đơn giản · báo cáo tổng hợp toàn nền tảng được | Cô lập mạnh · dễ đáp ứng yêu cầu **lưu trú dữ liệu theo quốc gia** · khách lớn dễ chấp nhận · sao lưu/phục hồi riêng từng khách |
| **Nhược điểm** | 🔴 **Một lỗi RLS làm lộ dữ liệu chéo doanh nghiệp** · khách lớn có thể từ chối · khó đáp ứng lưu trú dữ liệu | Chi phí vận hành cao · **nâng cấp phải chạy N lần** · di trú lược đồ phức tạp · khó thống kê toàn nền tảng |
| **Với Monica hôm nay** | Không khác biệt — chỉ một tenant | Không khác biệt |
| **Với khách thứ 100** | Rẻ, nhanh, nhưng **rủi ro tập trung** | Đắt hơn ~30–40%, nhưng bán được cho khách khó tính |

> **Khuyến nghị của tôi: PHƯƠNG ÁN A**, với ba điều kiện bắt buộc:
> ① Mọi bảng mang `tenant_id` **ngay từ bảng đầu tiên**, kể cả khi chỉ có Monica · ② RLS cô lập tenant là **lớp ngoài cùng**, kiểm bởi bài kiểm hồi quy mỗi vòng · ③ **Chừa đường tách sang B** cho khách lớn về sau *(tách một tenant ra CSDL riêng mà không đổi mã)*.
>
> Lý do: Monica ONE ✅ **đã có nền RLS trưởng thành** — đây là tài sản sẵn có, không phải rủi ro mới. Và phương án B ở giai đoạn này là **trả tiền trước cho một khách hàng chưa tồn tại**.

**🔲 Board chọn: A · B · A-với-điều-kiện-khác**

---

## `BDR-02` · SỞ HỮU THIẾT KẾ — `Style` thuộc về ai?

**Vấn đề.** Trong gia công, khách gửi thiết kế. Nhưng Monica bỏ công phát triển mẫu, làm rập, xây định mức. **`Style` là tài sản của Monica hay của khách?** Câu này quyết định: Monica **có được dùng lại** một style cho khách khác không, và ai giữ IP.

| | **Phương án A · `Style` thuộc KHÁCH** | **Phương án B · `Style` thuộc MONICA, gắn nguồn gốc khách** |
|---|---|---|
| **Mô hình** | `Style` bắt buộc có `customer_id`; ⛔ không dùng cho khách khác | `Style` thuộc Monica, có `originating_customer_id` + `ip_class: CUSTOMER_OWNED \| SHARED \| MONICA_OWNED` |
| **Ưu điểm** | An toàn pháp lý tuyệt đối · buyer yên tâm · đơn giản | **Monica tích luỹ thư viện sản phẩm** · dùng lại rập/định mức/thời gian chuẩn cho sản phẩm tương tự · **chiết tính nhanh hơn nhiều** |
| **Nhược điểm** | 🔴 Monica **không tích luỹ được tri thức sản phẩm** — mỗi khách bắt đầu từ 0. Chiết tính luôn chậm | Cần kỷ luật phân loại IP · 🔴 **rủi ro pháp lý nếu phân loại sai** |
| **Với Monica** | An toàn, chậm | Cần thêm một trường + kỷ luật, đổi lại **tài sản tích luỹ** |
| **Với 100 khách** | Sản phẩm nhạt — chỉ là công cụ ghi chép | 🔴 **Thư viện sản phẩm là DNA thứ bảy** — nhà máy dùng lâu càng báo giá nhanh |

> **Khuyến nghị: PHƯƠNG ÁN B**, với `ip_class` mặc định = `CUSTOMER_OWNED` *(an toàn trước)*, và chỉ nâng lên `SHARED`/`MONICA_OWNED` khi **có căn cứ hợp đồng**.
>
> ⚠️ **Chỗ tôi có thể sai:** tôi không biết hợp đồng gia công của Monica quy định IP thế nào. Nếu hợp đồng ghi rõ mọi thiết kế thuộc buyer thì A là bắt buộc và B là rủi ro pháp lý.

**🔲 Board chọn: A · B**

---

## `BDR-03` · CHIẾT TÍNH MỞ SỔ *(Open-book costing)* cho đơn FOB

**Vấn đề.** 📚 Một số buyer FOB yêu cầu **mở sổ chiết tính** — xem giá vải Monica mua, xem phí gia công, chỉ thoả thuận % lãi. Đây là thực tiễn phổ biến với buyer lớn. Nhưng `BR-ACC-002` của Board ghi ⛔ **TUYỆT ĐỐI KHÔNG cho khách xem chiết tính**.

| | **Phương án A · ⛔ Không bao giờ mở sổ** *(theo `BR-ACC-002`)* | **Phương án B · Mở sổ CÓ KIỂM SOÁT theo từng khách** |
|---|---|---|
| **Mô hình** | `Costing.disclosure = INTERNAL_ONLY` **cứng, không đổi được** | Thêm `open_book_agreement` ở cấp `Contract`; chia sẻ **chỉ những dòng đã thoả thuận**, còn giá vốn thật vẫn ẩn |
| **Ưu điểm** | Đơn giản · an toàn tuyệt đối · ⛔ không thể rò | Bán được cho buyer lớn đòi mở sổ · **minh bạch là lợi thế đàm phán với buyer tin cậy** |
| **Nhược điểm** | 🔴 **Mất cơ hội với buyer FOB lớn** — họ sẽ chọn nhà máy chấp nhận mở sổ | 🔴 Thêm một bề mặt rò rỉ · cần bài kiểm riêng · sai một dòng là lộ biên lãi |
| **Với Monica** | Hôm nay đúng — Monica chưa có buyer đòi mở sổ *(theo tôi biết)* | Chuẩn bị cho FOB lớn hơn |
| **Với 100 khách** | 🔴 **Một số nhà máy FOB sẽ không mua được sản phẩm** | Bán được cả hai nhóm |

> **Khuyến nghị: PHƯƠNG ÁN B, nhưng ⚪ DORMANT ở v1.**
> Mô hình hoá `open_book_agreement` ngay *(chi phí ~0)*, ⛔ **không dựng giao diện, không mở cổng** cho tới khi có buyer thật yêu cầu. Bật sau = một cấu hình, không phải một cuộc di trú.
>
> ⚠️ Nếu Board chọn A tuyệt đối, tôi ⛔ **không** thêm trường — vì một trường tồn tại là một trường có thể bị mở nhầm.

**🔲 Board chọn: A · B-dormant · B-active**

---

## `BDR-04` · ĐỘ SÂU CỦA CUSTOMER PORTAL

**Vấn đề.** Joseph: *"Customer Portal phải đủ giá trị để khách muốn tiếp tục làm việc với Monica."* Nhưng cho khách **ghi dữ liệu** vào hệ thống Monica có hệ quả quy trình lớn.

| | **Phương án A · Khách CHỈ ĐỌC + duyệt** | **Phương án B · Khách CỘNG TÁC** |
|---|---|---|
| **Khách làm được** | Xem tiến độ · duyệt mẫu · duyệt TechPack · bình luận · tải chứng từ | Tất cả của A **cộng**: 🔴 **tạo Inquiry** · 🔴 **gửi yêu cầu thay đổi đơn** · tải TechPack bản mới · đặt lịch kiểm · xác nhận nhận hàng |
| **Ưu điểm** | Bề mặt rò rỉ nhỏ · dễ kiểm · triển khai nhanh | 🔴 **Khách "sống" trong hệ thống Monica** ⇒ chi phí chuyển đổi sang nhà cung cấp khác **rất cao**. Đây đúng là điều Joseph muốn · giảm email qua lại · mọi thay đổi có vết |
| **Nhược điểm** | Portal chỉ là *"chỗ xem"* — 🔴 **không tạo được sự gắn kết**. Khách vẫn làm việc qua email | Bề mặt rò rỉ lớn hơn · mỗi thao tác ghi cần luồng duyệt phía Monica · khách nhập sai dữ liệu · cần đào tạo khách |
| **Với Monica** | An toàn, ít giá trị chiến lược | Cần kỷ luật nhưng đúng mục tiêu Joseph nêu |
| **Với 100 khách** | Portal thành tính năng ai cũng có | 🔴 **Portal thành DNA thật sự** |

> **Khuyến nghị: PHƯƠNG ÁN B, triển khai theo ba đợt.**
> **Đợt 1** *(v1)*: đọc + duyệt mẫu/TechPack + bình luận + tải chứng từ.
> **Đợt 2**: khách **tạo Inquiry** và **gửi yêu cầu thay đổi** — cả hai vào **hàng đợi duyệt của Monica**, ⛔ không ghi thẳng vào `Order`.
> **Đợt 3**: đặt lịch kiểm · xác nhận nhận hàng · tải TechPack.
>
> 🔴 **Luật cứng bất kể đợt nào: mọi thao tác ghi của khách tạo ra một ĐỀ NGHỊ, ⛔ không bao giờ sửa thẳng dữ liệu vận hành của Monica.**

**🔲 Board chọn: A · B-ba-đợt · B-toàn-bộ-v1**

---

## `BDR-05` · CƠ SỞ ĐO LỢI NHUẬN THEO ĐƠN HÀNG

**Vấn đề.** Joseph yêu cầu lợi nhuận theo **đơn · khách · nhà máy · nhà thầu**. Chi phí trực tiếp quy được thẳng. Nhưng **chi phí chung** *(quản lý, điện nước, khấu hao, lương gián tiếp)* phải phân bổ — và **cách phân bổ thay đổi kết luận đơn nào lãi**.

| | **Phương án A · Lãi trên biến phí** *(Contribution Margin)* | **Phương án B · Giá thành toàn bộ** *(Full Absorption)* |
|---|---|---|
| **Cách tính** | `Doanh thu − chi phí trực tiếp` · ⛔ **không phân bổ chi phí chung** vào đơn | `Doanh thu − chi phí trực tiếp − chi phí chung phân bổ` *(theo phút chuyền tiêu thụ)* |
| **Trả lời câu** | *"Đơn này đóng góp bao nhiêu để trang trải chi phí cố định?"* | *"Đơn này lãi hay lỗ thật?"* |
| **Ưu điểm** | 🔴 **Không tranh cãi** — mọi con số quy được thẳng · quyết định nhận/từ chối đơn **đúng về kinh tế** · dễ hiểu | Khớp với kế toán · trả lời được *"đơn này lỗ"* · so sánh khách với nhau công bằng hơn |
| **Nhược điểm** | ⛔ Không nói được đơn nào *"lỗ"* · CEO có thể tưởng mọi đơn đều lãi | 🔴 **Cơ sở phân bổ luôn tranh cãi** · đơn dài ngày bị gánh nhiều chi phí chung một cách máy móc · 🔴 **dẫn tới quyết định SAI**: từ chối đơn biên thấp trong khi chuyền đang trống |
| **Với Monica** | 70% CMT — biến phí chiếm phần lớn ⇒ A **rất gần sự thật** | Cần cơ sở phân bổ mà Monica **chưa có** |
| **Với 100 khách** | Nhân bản được — ⛔ không cần cấu hình | Mỗi doanh nghiệp một cơ sở phân bổ ⇒ **cấu hình phức tạp** |

> **Khuyến nghị: HAI TẦNG — A là chính, B là phụ.**
> **Tầng 1 · Lãi trên biến phí** — con số **chính thức** dùng để quyết định nhận đơn, so sánh khách, đánh giá nhà thầu. Không tranh cãi.
> **Tầng 2 · Giá thành toàn bộ** — hiển thị **kèm ghi rõ cơ sở phân bổ**, dùng cho phân tích chiến lược.
> 🔴 **Cơ sở phân bổ đề nghị: PHÚT CHUYỀN TIÊU THỤ** — vì đó là tài nguyên khan hiếm thật của nhà máy *(§Phase 1)*. Phân bổ theo doanh thu sẽ làm đơn FOB gánh oan chi phí xưởng.
>
> ⚠️ Đây là quyết định **thay đổi kết luận khách nào lãi** — không phải quyết định kỹ thuật.

**🔲 Board chọn: A · B · hai-tầng**

---

# §10 · SPRINT SUMMARY

## 10.1 Đã bàn giao

| Phase | Nội dung | Khối lượng |
|---|---|---|
| **4** | Enterprise Master Data | 4 tầng · 7 luật quản trị · mô hình tổ chức 4 cấp đa quốc gia · luật đa ngôn ngữ · **65 thực thể** · 6 quyết định thiết kế · bộ dữ liệu khởi tạo ~700 bản ghi |
| **5** | Enterprise Business Object | 8 luật aggregate · **88 Business Object** *(63 nghiệp vụ + 4 AI + 8 kernel + 13 con)* · **9 thiết kế sâu** · bản đồ quan hệ · chuỗi truy vết |
| **+** | AI Capability | 4 tầng · **5 tín hiệu rủi ro làm được ngay bằng luật** · 4 luật cứng |
| **+** | DNA | Xác nhận 13 · **đề xuất thêm 6** · nêu rõ 3 thứ **không** phải DNA |

**Quyết định tự ra:** 13 *(cộng dồn 43)* · **Cần Board quyết:** 5 · **Câu hỏi mở:** 0

## 10.2 Ba phát hiện đáng nhớ nhất

| # | Phát hiện |
|---|---|
| **1** | 🔴 **`WorkCenter` là khái niệm trung tâm, và chuyền nhà thầu cũng là `WorkCenter`.** Một quyết định mô hình hoá làm cho năng lực · sản lượng · hiệu suất · Line Map **liền mạch giữa trong nhà và ngoài nhà** — thứ không hệ ERP nào trong 8 hệ benchmark làm được |
| **2** | 🔴 **Phần lớn giá trị "AI cảnh báo sớm" đạt được bằng LUẬT, không cần học máy.** Năm tín hiệu — trễ tàu · nguy cơ lỗ · vượt định mức · chuyền sắp đứng · khách rủi ro thanh toán — chạy được từ ngày đầu, giải thích được, kiểm thử được |
| **3** | 🔴 **Bộ dữ liệu chủ khởi tạo là năng lực thương mại hoá bị đánh giá thấp nhất.** ~700 bản ghi chuẩn ngành *(công đoạn · mã lỗi · AQL · điểm đo · quy trình mẫu)* làm nhà máy mới chạy được **trong ngày đầu** thay vì ba tháng |

## 10.3 Lộ trình còn lại

| Sprint | Deliverable | Phase | Nội dung |
|---|---|---|---|
| ✅ 1 | EDD-01 | 1·2·3 | Business · Capability · Domain |
| ✅ 2 | **EDD-02** | 4·5 | **Master Data · Business Object** |
| 3 | EDD-03 | 6·7 | Document Architecture · Information Architecture |
| 4 | EDD-04 | 8·9·10 | Workflow Engine · Rule Engine · Permission |
| 5 | EDD-05 | 11·12 | Workspace · Portal · Module Architecture |
| 6 | EDD-06 | — | Hợp nhất · rà mâu thuẫn · hồ sơ Board ký |
| → | | | 🔓 **Board ký ⇒ mở khoá Implementation** |

## 10.4 Trạng thái thi hành

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

---

## THAM CHIẾU

- **Board Working Principle v2.0** — 04/08/2026
- [EDD-01](EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) — 14 Domain · 9 Kernel · 91 năng lực · 30 quyết định
- [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) v1.5 — Điều 8 · 12 · 19 · 24 · 31 · 39 · 40 · 45
- [`BUSINESS_KNOWLEDGE_BASE.md`](../business/BUSINESS_KNOWLEDGE_BASE.md) v2.0
- [`ADR-011`](../adr/ADR-011-tham-quyen-kien-truc.md) §2.3 — nghĩa vụ ghi *"chỗ tôi có thể sai"*
- Chuẩn ngành tham chiếu: ISO 2859-1 *(AQL)* · Incoterms 2020 · ISO 3166 · ISO 4217 · UN/LOCODE · 4-Point Fabric Inspection *(ASTM D5430)*
