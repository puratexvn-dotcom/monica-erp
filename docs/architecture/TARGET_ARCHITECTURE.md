> # ⛔ TÀI LIỆU NÀY ĐÃ BỊ THAY THẾ — KHÔNG DÙNG LÀM NGUỒN THIẾT KẾ
>
> | Phần | Bị thay bởi |
> |---|---|
> | §1 Domain Architecture | 🔴 **[EDD-01 Phase 3](../enterprise-design/EDD-01-BUSINESS-CAPABILITY-DOMAIN.md)** |
> | §2 Module Architecture | 🔴 **[EDD-05 §2 · §7](../enterprise-design/EDD-05-PRODUCT-ARCHITECTURE.md)** |
> | §3 Role Architecture | 🔴 **[EDD-04 Phase 10](../enterprise-design/EDD-04-WORKFLOW-RULE-PERMISSION.md)** |
> | §7 *"một nền tảng Portal, ba cấu hình"* | 🔴 **[EDD-03A `DL-062`](../enterprise-design/EDD-03A-PARTNER-PORTAL-ARCHITECTURE.md)** — ba Portal **độc lập** |
> | §9 Navigation | 🔴 **[EDD-05 §5](../enterprise-design/EDD-05-PRODUCT-ARCHITECTURE.md)** |
>
> **Giữ lại làm hồ sơ lịch sử** theo Hiến pháp §43.7 — không viết lại lịch sử.
> Chỉ mục hiện hành: **[`docs/PROJECT_MEMORY.md`](../PROJECT_MEMORY.md)**.
> Ghi nhận: EDD-06 §2.6 `M-7`.

---

# MONICA ONE — TARGET ENTERPRISE ARCHITECTURE
## Bản thiết kế kiến trúc ERP hoàn chỉnh · không bị giới hạn bởi mã hiện tại

| Trường | Giá trị |
|---|---|
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Solution Architect / Chief Enterprise Architect |
| **Trạng thái** | ⏳ **ĐỀ XUẤT — chờ phản biện độc lập rồi trình Board** ([ADR-011 §2.2](../adr/ADR-011-tham-quyen-kien-truc.md)) |
| **Phạm vi** | Domain · Module · Role · Workspace · Portal · Navigation · Benchmark · Lộ trình |
| **Tài liệu con** | [Merchandising](domains/MERCHANDISING_ARCHITECTURE.md) · [Warehouse](domains/WAREHOUSE_ARCHITECTURE.md) · [Manufacturing](domains/MANUFACTURING_ARCHITECTURE.md) |
| **Câu hỏi phát sinh** | [BUSINESS CONFIRMATION #2](../business/BUSINESS_CONFIRMATION_2.md) — 18 câu |
| **Ràng buộc** | Thiết kế **không** thi hành trong lúc SECURITY FREEZE. Đây là bản vẽ, không phải lệnh xây |

---

# PHẦN 0 — PHÁN QUYẾT CỦA MỘT CTO

> **Câu hỏi:** *"Nếu anh là CTO một tập đoàn may doanh thu >100 triệu USD/năm, anh
> phê duyệt triển khai hay bắt buộc thiết kế lại?"*

## 0.1 Trả lời thẳng

**Tôi KHÔNG phê duyệt triển khai. Tôi cũng KHÔNG phê duyệt viết lại từ đầu.**

Tôi phê duyệt **thiết kế lại có mục tiêu: 5 tầng phải làm lại, 5 tầng phải giữ.**

Viết lại từ đầu là câu trả lời của người chưa đọc kỹ. Thứ khó nhất trong ERP sản
xuất — **mô hình phân quyền chạy tới tận CSDL** — dự án này đã làm, và làm đúng.
Vứt đi để gõ lại 87 bảng là đốt 155 commit để mua lại đúng những lỗi đã trả giá.

## 0.2 Vì sao KHÔNG triển khai được — sáu lý do, mỗi lý do tự nó đủ

| # | Lý do | Vì sao nó là **chặn triển khai**, không phải **việc tồn đọng** |
|---|---|---|
| **B1** | **Không có xương sống tài chính.** Không `invoices`, không `payments`, không công nợ | Tập đoàn 100 triệu USD không thể chạy ERP không xuất được hoá đơn. Vòng đời Board định nghĩa **đứt ở bước ⑬⑭** — đúng chỗ ra tiền |
| **B2** | **Đơn hàng vào là không bao giờ ra được.** `[VERIFIED]` không thao tác nào đặt được `CANCELLED` | Một hệ thống không huỷ được đơn sẽ tích luỹ đơn ma vô hạn. Sau 12 tháng mọi báo cáo tồn đọng đều sai |
| **B3** | **Giá vốn · biên lợi nhuận · định mức có thể đọc được bởi khách và nhà thầu** *(chờ `VR-001`)* | Đây là **rủi ro thương mại tồn vong**, không phải lỗi bảo mật. Một khách nhìn thấy biên lợi nhuận là mất khách đó vĩnh viễn và mất cả vị thế đàm phán với các khách còn lại |
| **B4** | **Thông tin tổ chức theo CHỨC DANH** — 4 route riêng cho Production | Không sống sót được **tái cơ cấu** hay **nhà máy thứ hai**. Hiến pháp §22.5 đòi kiến trúc không đổi khi mở rộng quy mô — hiện tại mở nhà máy 2 phải nhân đôi route |
| **B5** | **Không có mô hình năng lực sản xuất** | Nhà máy gia công bán **phút chuyền**. ERP không trả lời được *"tôi có nhận nổi đơn này không"* thì không phải ERP nhà máy — nó là sổ ghi chép có màu |
| **B6** | **19.058 dòng nghiệp vụ MD, 0 bài kiểm nghiệp vụ** | Mỗi thay đổi là một canh bạc. Ở quy mô 100 triệu USD, rủi ro thay đổi mù là rủi ro vận hành, không phải rủi ro kỹ thuật |

## 0.3 Vì sao KHÔNG viết lại — năm thứ phải giữ nguyên

| # | Tài sản | Vì sao nó đắt hơn vẻ ngoài |
|---|---|---|
| **K1** | **Ba tầng phòng thủ, hàng rào thật ở RLS CSDL** | 90% dự án ERP dừng ở kiểm quyền tầng ứng dụng. Đi tới RLS + `SECURITY DEFINER` registry + audit `A001`/`A002` là công sức 6–9 tháng không nhìn thấy được |
| **K2** | **Bộ luật phân quyền thuần** `lib/mos/permission/` — nhận DỮ LIỆU, trả PHÁN QUYẾT, không biết Supabase | Đây là thứ duy nhất trong kho mã **kiểm thử được không cần CSDL**, và là nền cho mọi cổng đối tác về sau |
| **K3** | **Mô hình Assignment đã dựng đủ** — kèm **bảng phép chuyển trạng thái viết thành mã** (`lib/mos/domain/assignment.ts:73-80`) | Đối tượng **duy nhất** trong hệ thống làm đúng. Đây là khuôn mẫu, không phải một tệp |
| **K4** | **Chiều sâu mô hình kho** — 15 bảng, cây vị trí 4 cấp, sổ chuyển động, lô, cuộn | Kho là phân hệ tốn công mô hình hoá nhất. Phần này đã đúng hướng |
| **K5** | **Quản trị chuẩn tắc** — Hiến pháp 45 Điều · ADR · nhãn bằng chứng · sổ nợ kỹ thuật · bánh cóc arch test | Thứ này **không mua được bằng tiền và không viết lại được bằng tốc độ**. Nó là lý do bản audit hôm qua tìm ra được vấn đề thay vì đoán |

## 0.4 Năm tầng phải thiết kế lại — và vì sao

| # | Tầng | Vì sao **thiết kế lại**, không phải **vá** |
|---|---|---|
| **R1** | **Domain Model & ranh giới sở hữu dữ liệu** | Hiện không có ranh giới. `customers` nằm trong MD, `assignments` không rõ thuộc ai, `production_orders` không ai sở hữu vòng đời. Vá từng chỗ sẽ đẻ ra 87 quyết định rời rạc thay vì 1 mô hình |
| **R2** | **Information Architecture: Workspace theo LĨNH VỰC** | Đổi route là hệ quả. Cái phải thiết kế lại là **ánh xạ Domain → Workspace → Role → Assignment**, vì hiện tại bốn thứ này bị ép thành một |
| **R3** | **Xương sống Order-to-Cash** | Costing → Order → Shipment → **Invoice → Payment → Debt**. Không phải "thêm 2 bảng" — phải thiết kế lại điểm nối giá: giá chào, giá hợp đồng, giá xuất hoá đơn, khấu trừ, giá thực thu là **năm con số khác nhau** và hiện tại chỉ tồn tại con số đầu |
| **R4** | **Quản trị máy trạng thái** | 8 bộ từ vựng, 0 bộ có luật chuyển *(trừ Assignment)*. Đây là lỗi **hệ thống**, phải giải bằng **một sổ đăng ký + một phép kiểm**, không giải bằng cách sửa 8 chỗ |
| **R5** | **Tầng đối soát số liệu duy nhất** | `BR-RPT-001` là tiêu chí thành công cao nhất của Board. Hiện `ceo-report.ts` · `home-metrics.ts` · service MD tự tính độc lập. Không vá được — phải có **một tầng read-model** |

## 0.5 Điều tôi nói với Board nếu chỉ được nói một câu

> **Monica ONE có nền quản trị của một sản phẩm nghiêm túc và mô hình dữ liệu của
> một dự án nội bộ.** Khoảng cách đó khép được trong 2–3 sprint nếu sửa đúng năm
> tầng trên. Nếu không sửa, mỗi tính năng mới sẽ làm khoảng cách rộng thêm — vì
> tính năng mới nào cũng phải chọn một trong hai mô hình, và mỗi lần chọn là một
> mâu thuẫn mới.

---

# PHẦN 1 — DOMAIN ARCHITECTURE

## 1.1 Nguyên tắc phân định — trước khi liệt kê

Bốn khái niệm hiện đang bị trộn làm một trong dự án. Tách chúng ra là việc đầu tiên:

| Khái niệm | Định nghĩa | Ví dụ |
|---|---|---|
| **Business Domain** *(Bounded Context)* | Ranh giới **sở hữu dữ liệu và ngôn ngữ**. Bên trong một Domain, mỗi từ có đúng một nghĩa | Merchandising sở hữu `Order` |
| **Workspace** | Ranh giới **trải nghiệm**. Nơi một người vào để làm việc | Workspace Merchandising |
| **Role** | Người đó **là ai** trong tổ chức | `Merchandiser` |
| **Assignment** | Monica đã **giao việc gì** cho người đó | *"Xưởng A được giao 12.000 chiếc của PO-2601"* |

> ### ⚖️ Một tuyên bố kiến trúc phải nói rõ
>
> **Domain ≠ Workspace.** Hiến pháp §5.4 đang ràng buộc 1:1 (*"Each Workspace
> represents one Business Domain"*). Bản thiết kế này **tôn trọng ràng buộc đó**:
> mỗi Domain dưới đây ánh xạ đúng một Workspace.
>
> ⚠️ **Nhưng có một ngoại lệ không tránh được: Executive Center.** Nó **không sở
> hữu một bảng dữ liệu nào** — nó là người tiêu thụ read-model của mọi Domain
> khác. Gọi nó là Business Domain là sai về kỹ thuật.
>
> **Đề nghị:** giữ nguyên §5.4, và ghi nhận Executive Center là **Workspace
> không có Domain** — một ngoại lệ hiến định có tên, tốt hơn một mâu thuẫn im lặng.
> Cần một tu chính nhỏ Điều 18 theo Hiến pháp Điều 42. → `BC2-Q1`

## 1.2 Vì sao 14 Domain, không phải 11

Hiến pháp §16.2 khai **11 Business Workspace**. Nhà máy may gia công quy mô 100
triệu USD thiếu **ba năng lực** không nhét được vào 11 cái đang có:

| Domain đề nghị thêm | Vì sao **không** nhét vào Domain có sẵn |
|---|---|
| **Product Development** | Board đã tự phát biểu Sample Management là **năng lực nghiệp vụ ĐỘC LẬP** (`BR-SMP-003`), và Hiến pháp PART IV **không có Điều nào cho nó** — chính BKB ghi đây là khoảng trống hiến định `FD-003`. Style · TechPack · Sample · BOM · Consumption có **vòng đời riêng, người sở hữu riêng, tần suất thay đổi riêng** so với Order. Nhét vào Merchandising sẽ tái lập đúng cái đang sai: một Domain sở hữu quá nhiều thứ không liên quan |
| **Procurement** | Vai `md` hôm nay tên là *"Merchandiser & **Thu Mua**"* — một người làm cả hai. Ở quy mô 100 triệu USD với đơn FOB, mua NPL là **hàng chục triệu USD đi qua nhà cung cấp**, cần Supplier Master · PO mua · nhận hàng · đối chiếu 3 chiều · công nợ phải trả. Để chung với Merchandising là để **người bán và người mua chung một cái ví** |
| **Industrial Engineering** | **SMV/SAM là đơn vị tiền tệ của nhà máy may.** Nó là đầu vào của Costing *(giá)*, của Planning *(năng lực)*, của Production *(hiệu suất)* và của HR *(lương sản phẩm)*. Không có chủ sở hữu thì bốn nơi tự đặt một con số khác nhau — và đó chính là `CF-8` ở dạng nghiêm trọng nhất |

⚠️ **Cả ba đều cần ADR** theo Hiến pháp §16.2 *(“Additional Business Workspaces
may only be introduced through an approved ADR”)*. → **ADR-015**.

## 1.3 Bản đồ 14 Business Domain

### 🔴 CORE — nơi Monica thắng hoặc thua đối thủ

Đặc điểm chung: **không mua được ngoài thị trường**, phải tự xây, phải xây tốt hơn
đối thủ.

| # | Domain | Câu hỏi nghiệp vụ nó trả lời | Sở hữu dữ liệu gốc | Hiến pháp |
|---|---|---|---|---|
| **D1** | **Commercial** | *Khách này là ai, ta cam kết gì với họ, họ trả tiền thế nào?* | `Customer` · `Contract` · `PriceAgreement` · `PaymentTerm` · `CustomerScorecard` | Điều 19 ✅ |
| **D2** | **Merchandising** | *Đơn này đang ở đâu, có kịp không, ai phải làm gì tiếp?* | `Inquiry` · `Costing` · `Quotation` · **`Order`** · `TnAPlan` · `OrderChange` · `OrderMaterialPlan` | Điều 20 ✅ |
| **D3** | **Product Development** | *Sản phẩm này may thế nào, tốn bao nhiêu vật tư?* | `Style` · `TechPack` · `Sample` · `BOM` · `Consumption` · `SizeSpec` · `Colorway` | ⚠️ **thiếu** — ADR-015 |
| **D4** | **Industrial Engineering** | *May cái này mất bao nhiêu phút, chuyền bố trí ra sao?* | `Operation` · `OperationBulletin` · `SMV` · `LineLayout` · `LineBalance` · `Allowance` | ⚠️ **thiếu** — ADR-015 |
| **D5** | **Planning** | *Ta có nhận nổi đơn này không, cho chạy chuyền nào, ngày nào?* | `Capacity` · `ProductionPlan` · `ProductionOrder` · `LineSchedule` · `MaterialRequirement` | Điều 21 ✅ |
| **D6** | **Production** | *Hôm nay ra bao nhiêu, hỏng bao nhiêu, tắc ở đâu?* | `CutTicket` · `Bundle` · `WorkInProgress` · `OutputLog` · `Downtime` | Điều 22 ✅ |
| **D7** | **Quality** | *Hàng này đạt chưa, lỗi gì, ai chịu trách nhiệm?* | `InspectionPlan` · `Inspection` *(nội bộ ⟷ khách)* · `Defect` · `AQLResult` · `CAPA` | Điều 23 ✅ |

### 🟠 SUPPORTING — bắt buộc phải có, nhưng không tạo lợi thế cạnh tranh

| # | Domain | Câu hỏi nghiệp vụ | Sở hữu dữ liệu gốc | Hiến pháp |
|---|---|---|---|---|
| **D8** | **Procurement** | *Mua của ai, giá nào, hàng về chưa, nợ bao nhiêu?* | `Supplier` · `PurchaseRequisition` · `PurchaseOrder` · `SupplierPrice` · `GoodsReceipt` | ⚠️ **thiếu** — ADR-015 |
| **D9** | **Warehouse** | *Hàng gì, ở đâu, bao nhiêu, của ai, dùng cho đơn nào?* | `Location` · `StockLedger` · `MaterialLot` · `FabricRoll` · `Reservation` · `Inbound/Outbound` · `StockCount` | Điều 24 ✅ |
| **D10** | **Shipment** | *Hàng đi chuyến nào, chứng từ đủ chưa, tới chưa?* | `Booking` · `Shipment` · `PackingList` · `ExportDocument` · `Carton` | Điều 25 ✅ |
| **D11** | **Subcontract** | *Giao xưởng nào, họ làm tới đâu, nợ họ bao nhiêu?* | `Subcontractor` · **`Assignment`** · `AssignmentCommercialTerm` · `PartnerAccount` · `DailyReport` | Điều 26 ✅ |
| **D12** | **Finance** | *Đã xuất bao nhiêu, thu được bao nhiêu, còn nợ bao nhiêu, lãi thật bao nhiêu?* | `Invoice` · `Payment` · `Receivable` · `Payable` · `Deduction` · `CostActual` | Điều 27 ✅ ❌ *chưa có bảng nào* |
| **D13** | **Human Resources** | *Ai làm việc gì, năng suất bao nhiêu, lương thế nào?* | `Employee` · `Position` · `Attendance` · `SkillMatrix` · `PieceRateEarning` | Điều 28 ✅ |

### 🔵 OVERSIGHT — không sở hữu dữ liệu, chỉ đọc

| # | Domain | Bản chất |
|---|---|---|
| **D14** | **Executive Center** | **Workspace không có Domain.** Người tiêu thụ read-model. Không có bảng gốc, không có thao tác ghi nghiệp vụ. Xem §1.1 |

### ⚪ SHARED KERNEL — dùng bởi mọi Domain, không thuộc Domain nào

**Không phải Workspace. Không xuất hiện trên trang chủ.** Đây là hạ tầng nghiệp vụ.

| # | Kernel | Nội dung | Vì sao phải Shared |
|---|---|---|---|
| **S1** | **Party & Organization** | `Party` → `Customer` · `Supplier` · `Subcontractor` · `Factory` · `Employee` | ⚠️ **Một nhà cung cấp CÓ THỂ đồng thời là nhà thầu phụ.** Hôm nay `suppliers` và `subcontractors` là hai bảng rời ⇒ cùng một pháp nhân có hai mã, hai công nợ, không đối soát được. Đây là lỗi mô hình cổ điển và Monica đang mắc |
| **S2** | **Identity · Role · Assignment · Authorization** | `Role` · `Permission` · `Assignment` · `ResourceScope` · `PartnerAccount` | Đã có `lib/mos/permission/` — **giữ nguyên, nâng cấp** |
| **S3** | **Item & Product Master** | `Material` · `UOM` + quy đổi · `SizeScale` · `ColorMaster` · `Currency` · `FxRate` | `Style` thuộc D3, nhưng `Material` và `UOM` thì mọi Domain đọc |
| **S4** | **Document & Evidence** | `Document` có **phiên bản** · `Attachment` · `EvidenceLink` · lưu trữ | Hiến pháp Điều 8 + Điều 33. Tech Pack có phiên bản là yêu cầu của Điều 8, không phải tuỳ chọn |
| **S5** | **Workflow & Approval Engine** | `ApprovalPolicy` · `ApprovalRequest` · `Delegation` · `EscalationRule` | 🔴 Hôm nay **không tồn tại**. Không có nó thì mỗi Domain tự viết một luồng duyệt riêng — và luồng duyệt là thứ thay đổi thường xuyên nhất trong đời một ERP |
| **S6** | **Business Communication & Notification** | `Thread` gắn ngữ cảnh · `Notification` · `Subscription` · kênh ngoài | Hiến pháp Điều 30 |
| **S7** | **Reporting & Reconciliation Layer** | `ReadModel` · `MetricDefinition` · `ReconciliationRule` | 🔴 **Đây là lời giải của `BR-RPT-001`.** Xem §1.5 |
| **S8** | **Numbering · Calendar · Localization** | `DocumentSeries` · `FactoryCalendar` · `Shift` · `Holiday` · `Locale` | Lịch nhà máy quyết định mọi phép tính ngày của T&A và năng lực. Hôm nay không có |
| **S9** | **Audit Trail & Event Log** | `DomainEvent` chỉ-ghi-thêm · `AuditLog` · `ChangeHistory` | Hiến pháp Điều 8 · Điều 39.7 |

### ⏳ PHÁT TRIỂN SAU — chừa đường, không xây bây giờ

| Domain | Vì sao hoãn | Phải chừa đường gì ngay |
|---|---|---|
| **Compliance & Social Audit** *(BSCI · WRAP · SEDEX · CoC khách hàng)* | Chưa có yêu cầu Board | `Document` phải gắn được vào `Factory` và `Party`, không chỉ vào `Order` |
| **Maintenance & Asset** *(máy may, bảo trì)* | Chưa có yêu cầu Board | `Machine` phải là thực thể có mã ngay từ D6, kể cả khi chưa có lịch bảo trì |
| **Sustainability & Traceability** *(nguồn gốc sợi, carbon)* | Buyer lớn bắt đầu đòi, Monica chưa | Sổ truy vết cuộn → thùng phải **không đứt** — thiết kế ở D9 ngay |
| **Wholesale & Retail** | `FD-001` — Board xếp nghiệp vụ **phụ** | ⚠️ **Quyết định khó nhất phải làm SỚM:** dùng chung `Order` hay tách? → `BC2-Q2` |

## 1.4 Bản đồ phụ thuộc — chiều mũi tên là chiều được phép gọi

```
                    ┌──────────────────────────────────────┐
                    │   D14 EXECUTIVE CENTER (chỉ đọc)     │
                    └──────────────▲───────────────────────┘
                                   │ đọc read-model
                    ┌──────────────┴───────────────────────┐
                    │   S7 REPORTING & RECONCILIATION      │
                    └──────────────▲───────────────────────┘
                                   │ tiêu thụ Domain Event
   ┌───────────┐   ┌───────────┐   │   ┌───────────┐   ┌───────────┐
   │ D1        │──▶│ D2        │◀──┼──▶│ D5        │──▶│ D6        │
   │Commercial │   │Merchandis.│   │   │ Planning  │   │Production │
   └───────────┘   └─┬───┬───┬─┘   │   └─────┬─────┘   └─────┬─────┘
                     │   │   │     │         │               │
              ┌──────┘   │   └─────┼─────┐   │               │
              ▼          ▼         │     ▼   ▼               ▼
        ┌───────────┐ ┌──────────┐ │ ┌───────────┐    ┌───────────┐
        │ D3 Product│ │ D8 Procu-│ │ │ D11 Sub-  │    │ D7        │
        │ Developm. │ │ rement   │ │ │ contract  │    │ Quality   │
        └─────┬─────┘ └────┬─────┘ │ └───────────┘    └───────────┘
              │            │       │
              ▼            ▼       │         ┌───────────┐
        ┌───────────┐  ┌──────────┐│         │ D10       │
        │ D4 Indus- │  │ D9 Ware- ││────────▶│ Shipment  │
        │ trial Eng.│  │ house    ││         └─────┬─────┘
        └───────────┘  └──────────┘│               │
                                   │               ▼
        ┌───────────┐              │         ┌───────────┐
        │ D13 HR    │──────────────┘         │ D12       │
        └───────────┘                        │ Finance   │
                                             └───────────┘

  SHARED KERNEL  S1…S9  —  mọi Domain đọc, không Domain nào sở hữu
```

**Ba luật phụ thuộc, cưỡng chế bằng arch test:**

1. **Không Domain nào import bảng gốc của Domain khác.** Đọc qua **read-model** hoặc **contract**, không đọc thẳng bảng.
2. **Shared Kernel không được import Domain nào.** Vi phạm luật này là biến kernel thành Domain thứ 15 trá hình.
3. **Executive Center không có quyền GHI nghiệp vụ nào.** Điều 18.7 đã nói; phải có phép kiểm.

## 1.5 Tầng đối soát S7 — lời giải cho tiêu chí thành công của Board

`BR-RPT-001` *(“mọi báo cáo phải đối soát ra cùng một con số”)* là **ràng buộc kiến
trúc**, không phải KPI. Nó chỉ có một lời giải:

```
Domain (ghi)  ──emit──▶  Domain Event  ──▶  Read Model  ──▶  MỌI báo cáo
                                              ▲
                                              │
                                    MetricDefinition
                              (một công thức, một chỗ, có mã số)
```

**Ba quy tắc bắt buộc:**

| # | Quy tắc | Cưỡng chế bằng |
|---|---|---|
| 1 | **Mọi chỉ số hiển thị phải có `MetricDefinition` mang mã số.** Không có mã ⇒ không được lên màn hình | phép kiểm arch test |
| 2 | **Không màn hình nào tự tính chỉ số.** Chúng đọc read-model | phép kiểm: cấm phép tính tổng hợp trong `components/` |
| 3 | **Read-model có `as_of` và `source_event_id`** — mọi con số truy ngược được về sự kiện gốc | Hiến pháp Điều 8 |

> ⚠️ Đây là chỗ ba tệp `ceo-report.ts` · `home-metrics.ts` · service MD phải hợp
> nhất. **Không phải refactor — là thay tầng.**

---

# PHẦN 2 — MODULE ARCHITECTURE

> Quy ước: **Aggregate** = ranh giới giao dịch và nhất quán. Một giao dịch chỉ
> được sửa **một** aggregate. Liên kết giữa aggregate bằng **ID**, không bằng con
> trỏ đối tượng. Đây là luật, không phải gợi ý — nó là thứ giữ cho hệ thống mở
> rộng được sang nhà máy thứ hai mà không phải viết lại.

## D1 · COMMERCIAL

| Module | Submodule | Aggregate Root | Business Object bên trong | Feature chính |
|---|---|---|---|---|
| **Customer Master** | Hồ sơ · Liên hệ · Phân loại | `Customer` | `CustomerContact` · `CustomerAddress` · `CustomerClassification` *(Trading · Brand · Buying Office · Importer · Retail)* | Hồ sơ 360° · lịch sử đơn · xoá mềm · gộp trùng |
| **Contract** | Hợp đồng khung · Phụ lục | `Contract` | `ContractLine` · `ContractAmendment` · `Incoterm` | Hợp đồng → nhiều PO · cảnh báo hết hạn · gắn chứng từ |
| **Price Management** | Bảng giá · Hiệu lực · Phê duyệt | `PriceAgreement` | `PriceLine` · `PriceValidity` · `PriceApproval` | Giá theo khách/style/mùa · **ngưỡng duyệt theo biên LN** · lịch sử giá |
| **Payment Terms** | Điều kiện thanh toán | `PaymentTerm` | `LCTerm` · `TTTerm` · `CreditLimit` | LC · TT trước · TT sau N ngày · hạn mức tín dụng |
| **Customer Performance** | Chấm điểm khách | `CustomerScorecard` | `OTDRecord` · `ClaimRecord` · `PaymentBehaviour` | Khách nào lãi thật · khách nào hay khấu trừ · khách nào trả chậm |

## D2 · MERCHANDISING — chi tiết đầy đủ ở [tài liệu riêng](domains/MERCHANDISING_ARCHITECTURE.md)

| Module | Aggregate Root | Feature chính |
|---|---|---|
| Inquiry & Order Intake | `Inquiry` | Vào đơn từ Email/TechPack **hoặc** hỏi hàng — hai cửa vào ngang hàng |
| Costing | `Costing` *(có phiên bản)* | Chiết tính vật tư + công + chi phí + biên LN · so sánh phiên bản · what-if |
| Quotation | `Quotation` | Báo giá nhiều phương án · theo dõi phản hồi · chuyển thành đơn |
| **Order Book** | **`Order`** | Trung tâm toàn hệ thống · máy trạng thái có luật chuyển · huỷ · tách · gộp · nhân bản |
| T&A / Critical Path | `TnAPlan` | Lùi lịch từ mốc gốc theo mẫu · đường găng · leo thang khi trễ |
| Material Ownership Plan | `OrderMaterialPlan` | **Sở hữu NPL theo TỪNG DÒNG** — giải bài toán đơn hỗn hợp |
| Allocation | `OrderAllocation` | Chia đơn cho nội bộ / nhà thầu / cả hai |
| Change Management | `OrderChange` | Đổi số lượng · màu · ngày · giá — có luồng duyệt và phân tích tác động |
| Order Control Tower | *(read-model)* | Bảng điều hành theo **ngoại lệ**, không theo danh sách |

## D3 · PRODUCT DEVELOPMENT

| Module | Aggregate Root | Business Object | Feature chính |
|---|---|---|---|
| Style Master | `Style` | `StyleVersion` · `Colorway` · `SizeScale` · `StyleAttribute` | Mã hàng dùng lại nhiều PO · vòng đời `DEVELOPMENT→APPROVED→IN_PRODUCTION→DISCONTINUED` |
| Tech Pack | `TechPack` | **`TechPackVersion`** · `Measurement` · `Artwork` · `TrimCard` · `Construction` | 🔴 **Có phiên bản, giữ bản cũ** — Hiến pháp Điều 8, dùng khi tranh chấp |
| Sample | `Sample` | `SampleSubmission` · `SampleComment` · `SampleEvidence` | 7 chặng `PROTO·FIT·SIZE_SET·SMS·PP·TOP·SHIPMENT` · vòng gửi–phản hồi · ảnh bằng chứng |
| BOM & Consumption | `BOM` | `BOMLine` · `ConsumptionRule` · `WastageRule` · `MarkerEfficiency` | Định mức theo size/màu · hao hụt theo công đoạn · **bí mật kỹ thuật — phân loại Restricted** |
| PP Meeting | `PPMeeting` | `PPChecklist` · `PPMinute` · `PPAttendee` | Biên bản họp tiền sản xuất · điều kiện lên chuyền |

## D4 · INDUSTRIAL ENGINEERING

| Module | Aggregate Root | Business Object | Feature chính |
|---|---|---|---|
| Operation Library | `Operation` | `OperationCode` · `MachineType` · `SkillLevel` | Thư viện công đoạn dùng chung mọi style |
| Time Study & SMV | `SMVStudy` | `TimeObservation` · `Allowance` *(PF&D)* · `RatingFactor` | 🔴 **SMV là nguồn chân lý duy nhất** cho Costing · Planning · lương sản phẩm |
| Operation Bulletin | `OperationBulletin` | `OBLine` · `Sequence` · `TargetOutput` | Bảng công đoạn cho từng style |
| Line Layout & Balance | `LineLayout` | `Workstation` · `Assignment` · `BottleneckAnalysis` | Cân bằng chuyền · hiệu suất lý thuyết · tìm nút thắt |
| Learning Curve | `LearningCurve` | `EfficiencyRamp` | Hiệu suất tăng theo ngày sản xuất — **quyết định độ chính xác của mọi cam kết ngày giao** |

## D5 · PLANNING

| Module | Aggregate Root | Business Object | Feature chính |
|---|---|---|---|
| Capacity Model | `Capacity` | `CapacityCalendar` · `LineCapacity` · `EfficiencyFactor` | 🔴 **Năng lực = số chuyền × phút làm việc × hiệu suất.** Nền của mọi lời hứa |
| Order Confirmation Check | *(dịch vụ)* | `CapacityCheckResult` | **CTP — Capable To Promise**: nhận đơn này có kịp không |
| Master Production Plan | `ProductionPlan` | `PlanVersion` · `PlanLine` | Kế hoạch tuần/tháng · phiên bản · so sánh |
| Line Scheduling | `LineSchedule` | `ScheduleBlock` · `Changeover` | Xếp block theo chuyền · thời gian chuyển mã · kéo-thả |
| Production Order | `ProductionOrder` | `POLine` · `ReleaseGate` | **Lệnh sản xuất — KHÔNG phải PO nội bộ** *(giải `CF-3`)*. Có cổng thả có điều kiện |
| Material Requirement | `MaterialRequirement` | `RequirementLine` · `ShortageAlert` | MRP theo BOM × số lượng − tồn − đã đặt |
| What-if & Rescheduling | *(dịch vụ)* | `ScenarioResult` | Đơn gấp chen vào thì đơn nào trễ |

## D6 · PRODUCTION — chi tiết ở [tài liệu riêng](domains/MANUFACTURING_ARCHITECTURE.md)

| Module | Aggregate Root | Feature chính |
|---|---|---|
| Factory Structure | `Factory` → `Workshop` → `Section` → `Line` → `Workstation` | Cây tổ chức sản xuất, **không phải cây chức danh** |
| Cutting | `CutTicket` | Sơ đồ · trải vải · phiếu cắt · bó · truy vết cuộn→bó |
| Sewing | `SewingRun` | Sản lượng theo giờ · WIP theo bó · hiệu suất chuyền |
| Finishing & Packing | `FinishingRun` · `PackingRun` | Ủi · gấp · đóng thùng · nhãn |
| Shop-floor Data Capture | `OutputLog` | Nhập tay · quét mã · máy đếm |
| Downtime & Andon | `DowntimeEvent` | Lý do dừng · thời gian · leo thang |

## D7 · QUALITY

| Module | Aggregate Root | Business Object | Feature chính |
|---|---|---|---|
| Inspection Plan | `InspectionPlan` | `InspectionStage` · `AQLLevel` · `CustomerRequirement` | 🔴 **Chặng nào bắt buộc, chặng nào tuỳ khách** — theo yêu cầu từng khách |
| **Internal QA** | `Inspection` *(type=`INTERNAL`)* | `DefectRecord` · `Measurement` · `Evidence` | 🔴 **Khách KHÔNG được xem** — `BR-ACC-002` |
| **Customer/3rd-party QA** | `Inspection` *(type=`CUSTOMER`)* | `CustomerInspector` · `InspectionReport` | 🔴 **Khách ĐƯỢC xem** — `BR-ACC-001` |
| Inline QC | `InlineCheck` | `HourlyCheck` · `DHU` | Kiểm trong chuyền · DHU · RFT |
| AQL Engine | *(dịch vụ thuần)* | `AQLResult` | ISO 2859-1 — đã có `lib/garment-math.ts`, **đang nằm không** |
| Defect Management | `Defect` | `DefectCatalog` · `Rework` · `Reject` | Phân loại lỗi chuẩn · sửa lại · loại bỏ |
| CAPA | `CAPA` | `RootCause` · `Action` · `Verification` | Hành động khắc phục phòng ngừa |
| Material Inspection | `MaterialInspection` | `FabricInspection` *(4-point)* · `ShadeBand` | 🔴 **Kiểm vải 4 điểm và phân dải màu** — không có thì không dám cắt |

## D8 · PROCUREMENT

| Module | Aggregate Root | Business Object | Feature chính |
|---|---|---|---|
| Supplier Master | `Supplier` *(là một `Party`)* | `SupplierContact` · `SupplierCapability` · `SupplierScorecard` | ⚠️ Một pháp nhân có thể vừa là supplier vừa là subcontractor — **cùng một `Party`** |
| Sourcing & RFQ out | `SourcingRequest` | `SupplierQuote` · `Comparison` | So sánh chào giá · **giá NPL là bí mật, không lộ sang cổng nào** |
| Purchase Order | `PurchaseOrder` | `POLine` · `DeliverySchedule` · `POAmendment` | PO mua NPL · theo dõi ngày về · nhắc nhà cung cấp |
| Goods Receipt & 3-way match | `GoodsReceipt` | `ReceiptLine` · `MatchResult` | Đối chiếu **PO ⟷ phiếu nhập ⟷ hoá đơn NCC** |
| Nominated Supplier | `NominatedSupplier` | | Khách chỉ định nhà cung cấp — ⚠️ `H3` chưa xác minh → `BC2-Q7` |
| Supplier Debt | *(chuyển D12)* | | Công nợ phải trả thuộc Finance, Procurement chỉ tạo nghĩa vụ |

## D9 · WAREHOUSE — chi tiết ở [tài liệu riêng](domains/WAREHOUSE_ARCHITECTURE.md)

| Module | Aggregate Root | Feature chính |
|---|---|---|
| Location Master | `Warehouse`→`Zone`→`Rack`→`Bin` | Cây vị trí 4 cấp — **đã có** |
| Inbound | `InboundReceipt` | Nhận NPL mua · **nhận NPL khách cấp** · nhận hàng gia công về |
| Fabric & Roll | `FabricRoll` | Cuộn · dài thực ⟷ dài hoá đơn · khổ · **dải màu** |
| Lot & Batch | `MaterialLot` | Lô · hạn dùng · nguồn gốc |
| Stock Ledger | `StockLedgerEntry` | **Sổ chỉ-ghi-thêm** — nguồn chân lý của tồn |
| Reservation & Allocation | `Reservation` | Giữ chỗ theo đơn — **hàng của đơn A không dùng cho đơn B** |
| Outbound | `IssueNote` · `PickList` | Soạn · cấp phát cho chuyền · trả về |
| Transfer · Adjustment · Return | `TransferOrder` · `Adjustment` · `ReturnNote` | Chuyển kho · điều chỉnh có duyệt · trả lại |
| Stock Take | `StockCount` | Kiểm kê định kỳ và kiểm kê xoay vòng |
| **Bonded Material** | `BondedDeclaration` | 🔴 **NPL nhập gia công phải đối soát với xuất** — nghiệp vụ hải quan Việt Nam |
| FG Warehouse | `FGStock` · `Carton` | Thành phẩm · thùng · mã vạch |

## D10 · SHIPMENT

| Module | Aggregate Root | Business Object | Feature chính |
|---|---|---|---|
| Booking | `Booking` | `Carrier` · `Vessel` · `ETD/ETA` · `Container` | Đặt chỗ hãng tàu · theo dõi lịch |
| Packing | `PackingList` | `Carton` · `CartonContent` · `ShippingMark` | Ratio pack · solid pack · assort |
| Shipment | `Shipment` | `ShipmentLine` · `Milestone` | **Một PO ↔ mấy shipment** — chờ `OQ-012` |
| Export Document | `ExportDocument` | `CommercialInvoice` · `PackingList` · `CO` · `BL` · `CustomsDeclaration` | Bộ chứng từ — thiếu một tờ là hàng nằm cảng |
| Delivery Tracking | *(read-model)* | | Theo dõi tới cảng đích |

## D11 · SUBCONTRACT

| Module | Aggregate Root | Feature chính |
|---|---|---|
| Subcontractor Master | `Subcontractor` *(là một `Party`)* | Hồ sơ năng lực · chuyền · lịch sử chất lượng · **tiêu chí chọn xưởng** |
| Assignment | **`Assignment`** | ✅ **Đã có và làm đúng** — giữ nguyên, mở rộng |
| Commercial Terms | `AssignmentCommercialTerm` | Đơn giá gia công · điều kiện thanh toán · giữ lại % |
| Outbound/Inbound Subcon | `SubconIssue` · `SubconReceipt` | Giao NPL cho xưởng · nhận thành phẩm về · **đối soát hao hụt** |
| Partner Portal Admin | `PartnerAccount` | Cấp/thu hồi tài khoản · phạm vi xem |
| Subcon Performance | `SubconScorecard` | Đúng hạn · chất lượng · hao hụt |

## D12 · FINANCE

> ❌ **Toàn bộ Domain này hôm nay KHÔNG CÓ MỘT BẢNG NÀO.** Đây là khối xây mới lớn nhất.

| Module | Aggregate Root | Business Object | Feature chính |
|---|---|---|---|
| Sales Invoice | `Invoice` | `InvoiceLine` · `InvoiceDocument` | Xuất hoá đơn theo shipment · **hoặc gửi dữ liệu sang phần mềm kế toán** → `OQ-001` |
| Receivable | `Receivable` | `AgingBucket` · `DunningRecord` | Công nợ phải thu · tuổi nợ · nhắc nợ |
| Payment | `Payment` | `PaymentAllocation` | Ghi nhận thu · đối chiếu với hoá đơn |
| **Deduction / Claim** | `Deduction` | `DeductionReason` · `Negotiation` | 🔴 **Khấu trừ trễ · lỗi · thiếu số.** Không có nó thì doanh thu hệ thống **luôn cao hơn thực tế** |
| Payable | `Payable` | `SupplierInvoice` · `SubconPayable` | Nợ nhà cung cấp và nợ nhà thầu |
| **Cost Actual & Margin** | `CostActual` | `MaterialCost` · `LabourCost` · `Overhead` | 🔴 **Biên LN kế hoạch ⟷ biên LN thực.** Đây là con số CEO thật sự cần |
| FX & Currency | *(kernel S3)* | | Đơn USD, chi phí VND — chênh lệch tỷ giá là lãi/lỗ thật |

## D13 · HUMAN RESOURCES

| Module | Aggregate Root | Feature chính |
|---|---|---|
| Employee Master | `Employee` *(là một `Party`)* | Hồ sơ · hợp đồng lao động · phòng ban |
| Attendance | `AttendanceRecord` | Chấm công · ca · tăng ca |
| Skill Matrix | `SkillMatrix` | Công nhân này may được công đoạn nào — **đầu vào của cân bằng chuyền** |
| Piece-rate Payroll | `PieceRateEarning` | Lương sản phẩm = sản lượng × SMV × đơn giá phút — **nối thẳng D4 và D6** |
| Training | `TrainingRecord` | Đào tạo · chứng chỉ |

## D14 · EXECUTIVE CENTER

| Module | Nguồn dữ liệu | Feature chính |
|---|---|---|
| Business Cockpit | S7 read-model | 🔴 **Theo NGOẠI LỆ, không theo bảng số** — `BR-EXE-002` |
| Exception Inbox | S7 + S5 | Việc cần giám đốc can thiệp **trong ngày** — chờ định nghĩa `OQ-006` |
| Approval Queue | S5 | Mọi thứ chờ chữ ký của giám đốc, một chỗ |
| Financial Snapshot | D12 read-model | Doanh thu · biên LN thực · công nợ · dòng tiền |
| Order Book Health | D2 read-model | Đúng hạn · rủi ro trễ · đơn treo |

---

# PHẦN 3 — ROLE ARCHITECTURE

## 3.1 Bốn khái niệm phải tách — nguồn gốc của phần lớn lỗi phân quyền

```
Identity ──▶ Role ──▶ Permission ──┐
                                   ├──▶ Business Action được phép
Assignment ──▶ Resource Scope ─────┘
```

| Khái niệm | Trả lời | Ví dụ |
|---|---|---|
| **Role** | *Anh là ai* | `MERCHANDISER` |
| **Permission** | *Anh được làm gì* | `order.confirm` |
| **Assignment** | *Anh được giao cái gì* | các đơn của khách X |
| **Resource Scope** | *Phạm vi dữ liệu suy ra từ Assignment* | `order_id IN (…)` |
| **Data Ownership** | *Anh là NGƯỜI GIỮ SỔ của aggregate nào* | Merchandiser giữ sổ `Order` |

> ### ⚖️ Ba luật cưỡng chế
>
> 1. **Role KHÔNG cấp phạm vi dữ liệu.** Role cấp *khả năng*; Assignment cấp *phạm vi*.
> 2. **Một người giữ nhiều Role.** Ở Monica hôm nay một người là *Merchandiser + Thu mua*. Mô hình phải cho phép, **không** đẻ ra vai lai `md_thumua`.
> 3. **Data Ownership là DUY NHẤT.** Mỗi aggregate có đúng **một** Role giữ sổ. Hai chủ sở hữu = không ai chịu trách nhiệm.

## 3.2 Sổ đăng ký vai trò — mô tả theo NGHIỆP VỤ, không theo màn hình

### Nhóm điều hành

| Role | Responsibility | Permission *(nhóm)* | Data Ownership | Decision Authority |
|---|---|---|---|---|
| **CEO** | Kết quả kinh doanh toàn tập đoàn | `read:*` · `approve:strategic` | — *(không giữ sổ nào)* | Duyệt đơn vượt hạn mức · duyệt khách mới rủi ro cao · **quyết huỷ đơn lớn** · duyệt đầu tư |
| **Director** *(Giám đốc điều hành/nhà máy)* | Vận hành đúng hạn, đúng chất lượng, đúng chi phí | `read:*` · `approve:operational` · `override:gate` | `Factory` | Cho lên chuyền khi thiếu điều kiện · điều chuyển năng lực giữa chuyền · duyệt tăng ca |

### Nhóm thương mại

| Role | Responsibility | Permission | Data Ownership | Decision Authority |
|---|---|---|---|---|
| **Commercial Manager** | Quan hệ khách, hợp đồng, giá | `customer:*` · `contract:*` · `price:approve` | `Customer` · `Contract` · `PriceAgreement` | **Duyệt giá dưới ngưỡng** · ký hợp đồng khung · cấp hạn mức tín dụng |
| **Merchandiser** | Đơn hàng đi từ cam kết tới giao xong | `order:*` · `costing:*` · `tna:*` · `allocation:propose` | **`Order`** · `Costing` · `TnAPlan` | Xác nhận đơn · lập chiết tính · chốt lịch T&A · **đề xuất** phân bổ |
| **Merchandising Manager** | Toàn bộ sổ đơn hàng | `order:*` · `order:cancel` · `allocation:approve` | Order Book | **Duyệt huỷ đơn** · duyệt thay đổi đơn · **chốt** phân bổ sản xuất |

### Nhóm phát triển sản phẩm

| Role | Responsibility | Permission | Data Ownership | Decision Authority |
|---|---|---|---|---|
| **Product Developer** | Style · TechPack · mẫu đạt duyệt | `style:*` · `techpack:*` · `sample:*` | `Style` · `TechPack` · `Sample` | Chốt phiên bản TechPack · gửi mẫu |
| **Pattern/CAD** | Rập, sơ đồ, hiệu suất sơ đồ | `marker:*` · `bom:consumption` | `Marker` | Chốt hiệu suất sơ đồ *(ảnh hưởng thẳng giá vốn)* |
| **IE Engineer** | SMV · bảng công đoạn · cân bằng chuyền | `operation:*` · `smv:*` · `linebalance:*` | **`SMV`** · `OperationBulletin` | 🔴 **Chốt SMV** — con số này quyết định giá, năng lực và lương |

### Nhóm kế hoạch & sản xuất

| Role | Responsibility | Permission | Data Ownership | Decision Authority |
|---|---|---|---|---|
| **Planner** | Năng lực và lịch chạy | `capacity:*` · `plan:*` · `productionorder:*` | `ProductionPlan` · `Capacity` | 🔴 **Trả lời CTP: nhận nổi đơn này không** · xếp chuyền · thứ tự ưu tiên |
| **Production Manager** | Sản lượng và tiến độ nhà máy | `production:*` · `line:*` | `SewingRun` | Điều chuyền · điều người · dừng chuyền |
| **Line Supervisor** *(Tổ trưởng May/Cắt/Hoàn thành)* | Sản lượng và chất lượng của **chuyền mình** | `output:write` · `downtime:write` — **phạm vi = chuyền được giao** | `OutputLog` của chuyền | Phân công công nhân trong chuyền · báo sự cố |
| **Cutting Manager** | Cắt đúng, đủ, truy vết được | `cutticket:*` · `bundle:*` | `CutTicket` | Duyệt sơ đồ · quyết trải vải |

### Nhóm chất lượng

| Role | Responsibility | Permission | Data Ownership | Decision Authority |
|---|---|---|---|---|
| **QA Manager** | Chuẩn chất lượng và kết luận lô | `inspection:*` · `capa:*` · `aql:decide` | `InspectionPlan` · `Inspection` | 🔴 **Kết luận đạt/không đạt AQL** · quyết kiểm lại 100% |
| **QC Inspector** | Thực hiện kiểm, ghi lỗi, chụp bằng chứng | `inspection:write` — **phạm vi = lô được giao** | `DefectRecord` | Ghi nhận lỗi *(không kết luận lô)* |
| **Inline QC** | Kiểm trong chuyền theo giờ | `inlinecheck:write` | `InlineCheck` | Dừng công đoạn lỗi hàng loạt |

### Nhóm cung ứng & kho

| Role | Responsibility | Permission | Data Ownership | Decision Authority |
|---|---|---|---|---|
| **Procurement Officer** | Mua đúng, đủ, kịp | `supplier:read` · `po:*` | `PurchaseOrder` | Chọn nhà cung cấp dưới ngưỡng · chốt ngày về |
| **Procurement Manager** | Chi phí NPL và quan hệ NCC | `supplier:*` · `po:approve` | `Supplier` | **Duyệt PO mua trên ngưỡng** · phê duyệt NCC mới |
| **Warehouse Manager** *(Thủ kho trưởng)* | Toàn vẹn tồn kho | `stock:*` · `adjust:approve` | `StockLedger` | 🔴 **Duyệt điều chỉnh tồn** · chốt kiểm kê |
| **Storekeeper** *(Thủ kho)* | Nhận · cất · soạn · cấp phát | `receive` · `putaway` · `pick` · `issue` · `transfer` · `count` | — | Không có quyền quyết định — **cố ý** |
| **Material Controller** *(Kế toán vật tư)* | Đối soát vật tư và định giá | `stock:read` · `count` · `valuate` | `StockValuation` | Chốt giá trị tồn · phát hiện lệch |

### Nhóm hậu cần & tài chính

| Role | Responsibility | Permission | Data Ownership | Decision Authority |
|---|---|---|---|---|
| **Logistics/Export Officer** | Booking, chứng từ, giao đúng hạn | `booking:*` · `shipment:*` · `exportdoc:*` | `Shipment` · `ExportDocument` | Chọn hãng tàu · chốt bộ chứng từ |
| **Accountant** | Hoá đơn, thu chi, công nợ | `invoice:*` · `payment:*` · `receivable:*` | `Invoice` · `Payment` | Xuất hoá đơn · ghi nhận thu · **đề xuất** xử lý khấu trừ |
| **Chief Accountant / CFO** | Kết quả tài chính và rủi ro | `finance:*` · `deduction:approve` · `writeoff:approve` | `CostActual` | **Duyệt khấu trừ** · duyệt xoá nợ · duyệt hạn mức |
| **Cost Controller** | Giá vốn thật ⟷ giá vốn kế hoạch | `cost:*` · `margin:read` | `CostActual` | Cảnh báo đơn lỗ |

### Nhóm nhân sự & nền tảng

| Role | Responsibility | Permission | Data Ownership | Decision Authority |
|---|---|---|---|---|
| **HR Manager** | Nhân sự và lương sản phẩm | `employee:*` · `payroll:*` | `Employee` · `PieceRateEarning` | Duyệt bảng lương · điều chuyển nhân sự |
| **IT / System Admin** | Tài khoản, cấu hình, vận hành nền tảng | `platform:*` — ⛔ **KHÔNG có quyền nghiệp vụ** | `UserAccount` · `SystemConfig` | 🔴 **Không quyết định nghiệp vụ nào.** Tách bạch quản trị và nghiệp vụ là Điều 40.5 |

### Nhóm bên ngoài — vai trò cổng

| Role | Responsibility | Permission | Data Ownership | Decision Authority |
|---|---|---|---|---|
| **Customer** *(Buyer)* | Theo dõi và **duyệt** những gì thuộc về mình | `read` phạm vi đơn của mình · `sample:approve` · `comment:write` · `document:download` | — | 🔴 **Duyệt mẫu · duyệt TechPack · duyệt xuất hàng.** Khách **có** quyền quyết định — chỉ không có quyền ghi dữ liệu vận hành |
| **Subcontractor** | 🔴 **GHI** sản lượng, sự cố, báo cáo ngày | `output:write` · `incident:write` · `dailyreport:write` — **phạm vi = Assignment** | `DailyReport` của chính họ | Báo sự cố · xác nhận nhận NPL · **chấp nhận/từ chối Assignment** |
| **Supplier** | Xác nhận PO, cập nhật ngày giao | `po:read` phạm vi của mình · `deliveryconfirm:write` | — | Xác nhận ngày giao |

## 3.3 Ma trận quyền quyết định — ai được ký cái gì

> Đây là bảng **chưa lấp được** vì `OQ-002` · `OQ-003` · `OQ-004` chưa có trả lời.
> Ghi ra khuôn để Board điền, **không suy diễn**.

| Quyết định | Người đề xuất | Người duyệt | Ngưỡng |
|---|---|---|---|
| Báo giá cho khách | Merchandiser | ⚠️ **CHƯA CHỈ ĐỊNH** | ❓ `OQ-002` |
| Nhận / từ chối đơn | Merchandiser | ⚠️ **CHƯA CHỈ ĐỊNH** | ❓ `OQ-003` |
| **Huỷ đơn đã xác nhận** | Merchandiser | ⚠️ **CHƯA CHỈ ĐỊNH** | ❓ `OQ-004` |
| Cho lên chuyền khi thiếu điều kiện | Planner | ⚠️ **CHƯA CHỈ ĐỊNH** | ❓ `OQ-023` |
| Kết luận lô trượt AQL | QC Inspector | QA Manager | ❓ `OQ-027` |
| Điều chỉnh tồn kho | Storekeeper | Warehouse Manager | ✅ đã rõ |
| Duyệt khấu trừ của khách | Accountant | ⚠️ **CHƯA CHỈ ĐỊNH** | ❓ `OQ-017` |
| Chọn nhà thầu cho đơn | Merchandiser | ⚠️ **CHƯA CHỈ ĐỊNH** | ❓ `OQ-024` |

---

# PHẦN 4 — WORKSPACE ARCHITECTURE

## 4.1 Nguyên tắc

> **Workspace là cái bàn làm việc, không phải cái ghế ngồi.**
> Đặt tên theo **việc phải làm**, không theo **người ngồi làm**.

## 4.2 Workspace NÊN TỒN TẠI — 14

| # | Workspace | Domain | Ai vào | Trạng thái hôm nay |
|---|---|---|---|---|
| 1 | **Executive Center** | D14 | CEO · Director | ⚠️ `/giam-doc` — **đặt tên theo chức danh**, đổi tên |
| 2 | **Commercial** | D1 | Commercial Manager · Merchandiser | 🔴 **trỏ nhầm `/buyer`** |
| 3 | **Merchandising** | D2 | Merchandiser · MD Manager | ✅ `/md` |
| 4 | **Product Development** | D3 | Product Developer · Pattern/CAD | ⚠️ nằm rải trong MD |
| 5 | **Industrial Engineering** | D4 | IE Engineer | ❌ **không tồn tại** |
| 6 | **Planning** | D5 | Planner | ❌ Beta, không route |
| 7 | **Production** | D6 | Production Manager · Line Supervisor · Cutting | 🔴 **bị chẻ làm 4 route** |
| 8 | **Quality** | D7 | QA Manager · QC · Inline | ✅ `/qa` |
| 9 | **Procurement** | D8 | Procurement Officer/Manager | ❌ **không tồn tại** |
| 10 | **Warehouse** | D9 | WH Manager · Storekeeper · Material Controller | ✅ `/kho` |
| 11 | **Shipment** | D10 | Logistics Officer | ✅ `/xuat-hang` |
| 12 | **Subcontract** | D11 | Subcon Coordinator | ✅ `/subcon` |
| 13 | **Finance** | D12 | Accountant · CFO · Cost Controller | ⚠️ `/ke-toan` — đặt tên theo chức danh |
| 14 | **Human Resources** | D13 | HR Manager | ❌ Beta, không route |

## 4.3 Workspace NÊN GỘP

| Gộp gì | Thành | Vì sao |
|---|---|---|
| 🔴 `/to-truong-cat` + `/to-truong-may` + `/to-truong-hoan-thanh` + `/hoan-thanh` | **Production** | Hiến pháp §22.4 cấm tường minh. Bốn màn hình **giữ nguyên** — chúng trở thành **lát cắt theo vai trò** bên trong một Workspace. Người dùng không mất gì; kiến trúc thì hết chẻ |
| `/orders` | **Merchandising** | `/orders` là một *lát cắt dữ liệu*, không phải một Domain. Nó không ánh xạ Điều nào của Hiến pháp |
| `suppliers` + `subcontractors` *(bảng)* | **`Party`** kernel S1 | Cùng một pháp nhân đang có hai mã, hai công nợ, không đối soát được |

## 4.4 Workspace NÊN BỎ khỏi danh sách Workspace

| Bỏ gì | Vì sao **không phải** Workspace | Đi đâu |
|---|---|---|
| `/buyer` | **Cổng đối tác ngoài**, không phải Business Workspace. Hiến pháp §5.3 định nghĩa Workspace là nơi *"users perform operational activities belonging to a specific business domain"* — khách hàng không vận hành nghiệp vụ của Monica | → **Portal** (Phần 8) |
| `/subcon` *(phần dành cho nhà thầu)* | như trên — ⚠️ **nhưng `/subcon` hiện đang gánh HAI vai**: cổng nhà thầu **và** bàn làm việc của điều phối viên nội bộ | Tách đôi: **Workspace Subcontract** *(nội bộ)* + **Subcontract Portal** *(ngoài)* |
| `/admin` | Platform Service, Hiến pháp Điều 34 — đã phân loại đúng | giữ nguyên phân loại |

> 🔴 **`/subcon` gánh hai vai là lỗi kiến trúc nghiêm trọng đang tồn tại.**
> `MODULE_ACCESS` cho **7 vai trò** cùng vào `/subcon`: `giamdoc` · `md` ·
> `totruongmay` · `kho` · `khotruong` · `subcon` · `superadmin`. Nghĩa là **nhà
> thầu bên ngoài và sáu vai nội bộ đang dùng chung một không gian**. Ranh giới
> trong/ngoài không được dựng bằng route, chỉ được dựng bằng RLS — mà RLS là thứ
> `VR-002` chưa đo được.

## 4.5 Workspace NÊN TÁCH

| Tách gì | Thành | Vì sao |
|---|---|---|
| **Merchandising** hiện tại | **Commercial** + **Merchandising** + **Product Development** | 13 tab hôm nay gồm ba nhóm việc của ba nghề khác nhau: quan hệ khách *(Commercial)*, chạy đơn *(MD)*, phát triển mẫu *(PD)*. Một Workspace 13 tab là dấu hiệu ranh giới Domain chưa được vẽ |
| **`/kho`** | **Warehouse** *(NPL)* + **FG Store** *(thành phẩm)* — ⚠️ **cân nhắc, chưa quyết** | Hai kho khác nhau về đơn vị, vòng quay và người dùng. **Nhưng** tách sớm sẽ nhân đôi mô hình vị trí. **Đề nghị: KHÔNG tách Workspace, tách bằng `WarehouseType`** |
| **`/subcon`** | Workspace nội bộ + Portal ngoài | Xem §4.4 |

## 4.6 Bảng ánh xạ chuyển đổi — route cũ → Workspace mới

**Không xoá một tệp nào.** Đây là bảng đổi đường dùng.

| Route hôm nay | Workspace đích | Cách chuyển |
|---|---|---|
| `/giam-doc` | Executive Center | đổi tên đường dẫn, giữ màn hình |
| `/md` | Merchandising | tách bớt tab sang Commercial và PD |
| `/orders` | Merchandising | trở thành một lát cắt của Order Book |
| `/qa` | Quality | giữ nguyên |
| `/kho` | Warehouse | giữ nguyên |
| `/xuat-hang` | Shipment | giữ nguyên |
| `/ke-toan` | Finance | đổi tên, mở rộng |
| `/to-truong-may` | Production › lát cắt **Sewing** | giữ tệp, gắn vào Workspace Production |
| `/to-truong-cat` | Production › lát cắt **Cutting** | như trên |
| `/to-truong-hoan-thanh` · `/hoan-thanh` | Production › lát cắt **Finishing** | như trên |
| `/subcon` | tách: Workspace Subcontract + Subcontract Portal | tách theo vai trò trong/ngoài |
| `/buyer` | **Customer Portal** *(không phải Workspace)* | đổi phân loại |
| `/admin` | Platform Services | giữ nguyên |
| — | **+ Product Development · Industrial Engineering · Planning · Procurement · HR** | xây mới |

---

# PHẦN 8 — PORTAL ARCHITECTURE

> *(Phần 5 · 6 · 7 nằm ở ba tài liệu con — xem đầu trang.)*

## 8.1 Nguyên tắc phân định Portal ⟷ Workspace

| | Workspace | Portal |
|---|---|---|
| Ai dùng | người **của** Monica | người **ngoài** Monica |
| Phạm vi dữ liệu | theo Role + Assignment | **luôn luôn** theo Assignment/quan hệ, **không bao giờ** theo Role đơn thuần |
| Mặc định | cho phép trong Domain | **mặc định CẤM**, mở từng thứ một |
| Hàng rào | RLS + guard | RLS + guard + **bài kiểm hồi quy bắt buộc mỗi vòng** |

> 🔴 **Luật cứng:** thêm bất kỳ trường nào vào một Portal đều phải kèm **một bài
> kiểm chứng minh vai ngoài KHÔNG thấy trường không được phép**, và bài kiểm đó
> phải có ít nhất một vai **chờ thấy > 0** *(quy tắc K-3)*.

## 8.2 CUSTOMER PORTAL

| | Nội dung |
|---|---|
| **Ai** | `Customer` — ánh xạ qua `PartnerAccount` *(không qua claim JWT)* |
| **Phạm vi** | Chỉ đơn hàng của **chính khách đó**, qua quan hệ `Order.customer_id` |

**✅ ĐƯỢC XEM**

PO của mình · tiến độ đơn *(mốc, % hoàn thành)* · lịch giao · **Line Map** *(chờ định nghĩa)* ·
**báo cáo QA của khách / bên thứ ba** · mẫu và trạng thái duyệt mẫu · TechPack phiên bản đã chốt ·
chứng từ xuất hàng · packing list · hoá đơn của mình · công nợ của mình · dòng thời gian đơn hàng · bình luận trong luồng chung.

**⛔ TUYỆT ĐỐI KHÔNG**

🔴 **Chiết tính · giá vốn · biên lợi nhuận** · 🔴 **QA nội bộ** · 🔴 **Định mức BOM** ·
thông tin nhà thầu *(tên xưởng nào may — chờ `OQ-031`)* · đơn của khách khác ·
giá mua NPL · bình luận nội bộ · năng lực và lịch chuyền · dữ liệu nhân sự · sự cố sản xuất nội bộ.

**✏️ ĐƯỢC SỬA / GHI**

Duyệt mẫu *(`APPROVED` · `REJECTED` · `APPROVED_WITH_COMMENT`)* · duyệt TechPack ·
duyệt xuất hàng · bình luận · tải lên tài liệu của khách · xác nhận nhận hàng.

**⛔ KHÔNG ĐƯỢC SỬA**

Bất kỳ dữ liệu vận hành nào: số lượng · ngày giao · sản lượng · tồn kho · trạng thái đơn.
*Khách yêu cầu đổi ⇒ tạo `OrderChange`, Monica duyệt.*

## 8.3 SUBCONTRACT PORTAL

| | Nội dung |
|---|---|
| **Ai** | `Subcontractor` qua `PartnerAccount` |
| **Phạm vi** | 🔴 **Theo `Assignment`, không theo `subcon_id`** — Playbook Điều XXX |

**✅ ĐƯỢC XEM**

Assignment được giao · số lượng · ngày giao của phần việc mình ·
TechPack/thông số **ở mức đủ để may** · NPL đã nhận · **Line Map** ·
sản lượng mình đã báo · **đơn giá gia công · thành tiền · công nợ CỦA CHÍNH HỌ** ·
kết quả QA phần việc của mình · hướng dẫn kỹ thuật.

**⛔ KHÔNG**

Xưởng khác · Assignment khác · 🔴 **tên khách hàng cuối** *(chờ `OQ-031`)* ·
**giá bán cho khách** · **đơn giá của nhà thầu khác** *(chờ `OQ-020`)* ·
chiết tính · định mức đầy đủ · dữ liệu nhân sự Monica.

**✏️ 🔴 BẮT BUỘC GHI — nhà thầu KHÔNG phải người chỉ đọc**

Báo cáo ngày *(Daily Report)* · sản lượng theo công đoạn · sự cố và lý do dừng ·
xác nhận nhận NPL · báo hao hụt · **chấp nhận hoặc từ chối Assignment** ·
tải ảnh bằng chứng · đề nghị lùi lịch.

**⛔ KHÔNG ĐƯỢC SỬA**

🔴 **Tự tạo Assignment** *(migration `026` đã chặn — giữ nguyên)* ·
tự đặt đơn giá · sửa số lượng được giao · sửa sản lượng đã chốt · xoá bản ghi đã gửi.

## 8.4 SUPPLIER PORTAL

| | Nội dung |
|---|---|
| **Ai** | `Supplier` qua `PartnerAccount` |
| **Trạng thái** | ❌ chưa tồn tại — xây sau D8 |

**✅ XEM:** PO mua gửi cho mình · lịch giao · kết quả kiểm vải/phụ liệu của lô mình giao · công nợ Monica nợ mình.
**⛔ KHÔNG:** NCC khác · giá NCC khác · khách hàng cuối · BOM đầy đủ · đơn hàng.
**✏️ GHI:** xác nhận PO · cập nhật ngày giao dự kiến · tải chứng từ lô hàng · báo chậm giao.
**⛔ KHÔNG SỬA:** giá đã chốt · số lượng PO · kết quả kiểm hàng.

## 8.5 INTERNAL PORTAL *(bàn làm việc chung của nhân viên Monica)*

Không phải một Workspace — là **lớp vỏ** bọc quanh mọi Workspace: Trang chủ ·
Top Header · Bottom Nav · Global Search · Notification · AI Assistant · User Guidance.

**Xem:** đúng những Workspace mà Role của mình được cấp *(§13.5 — lọc theo quyền, hiện đang là TD-05)*.
**Không xem:** Workspace không được cấp — và **không hiện thẻ dẫn tới `/unauthorized`**.

## 8.6 EXECUTIVE PORTAL

Không phải Portal ngoài — là **Workspace D14** cho CEO/Director.

**Xem:** mọi thứ, ở mức **tổng hợp và ngoại lệ**.
**⛔ Không:** 🔴 **không có quyền GHI nghiệp vụ nào** — Hiến pháp §18.7. Giám đốc muốn đổi một con số phải đi qua đúng luồng của Domain sở hữu nó.
**✏️ Ghi:** chỉ **quyết định** — phê duyệt, chỉ đạo, giao việc. Quyết định là bản ghi riêng, không phải sửa dữ liệu vận hành.

## 8.7 Bảng bất đối xứng — điểm tinh tế nhất của toàn mô hình

| Dữ liệu | Customer | Subcontractor | Supplier | Nội bộ |
|---|---|---|---|---|
| PO / Assignment của mình | ✅ | ✅ | ✅ | ✅ |
| **Đơn giá của chính mình** | ✅ | ✅ | ✅ | ✅ |
| Đơn giá của bên thứ ba | ❌ | ❌ | ❌ | ✅ |
| **Giá vốn · biên lợi nhuận** | ❌ | ❌ | ❌ | ✅ *(hạn chế)* |
| **Chiết tính** | ❌ | ❌ | ❌ | ✅ *(hạn chế)* |
| **Định mức BOM** | ❌ *(chỉ bản khách duyệt)* | ⚠️ *(phần cần để may)* | ❌ | ✅ |
| QA nội bộ | ❌ | ⚠️ *(phần của mình)* | ❌ | ✅ |
| QA của khách | ✅ | ❌ | ❌ | ✅ |
| Tên khách hàng cuối | — | ❓ `OQ-031` | ❌ | ✅ |
| Danh tính nhà thầu | ❓ `OQ-031` | ❌ | ❌ | ✅ |

> **Nguyên tắc rút ra: "giá của tôi" luôn được xem; "giá của người khác" và "giá
> vốn của Monica" thuộc hai lớp bí mật hoàn toàn khác nhau.** Ba lớp bí mật, không
> phải hai — đây là chỗ mô hình phân quyền hai mức *(trong/ngoài)* sẽ hỏng.

---

# PHẦN 9 — NAVIGATION ARCHITECTURE

## 9.1 Bốn tầng điều hướng

```
① Business Operating System Launcher  (trang chủ — 14 Workspace + 4 Global Service + 1 Platform)
        │
        ▼
② Workspace Shell                     (Top Header · Bottom Nav · danh tính màu của Workspace)
        │
        ▼
③ Business Capability Tabs            (Module bên trong Workspace — hiện thẳng, KHÔNG accordion)
        │
        ▼
④ Object Control Tower                (Command Center của MỘT đối tượng — PO 360°, Style 360°, Roll 360°)
```

## 9.2 Trang chủ — 19 thẻ, phân loại là dữ liệu chứ không phải bố cục

| Nhóm | Số | Mục |
|---|---|---|
| **Business Workspace** | **14** | Executive Center · Commercial · Merchandising · Product Development · Industrial Engineering · Planning · Production · Quality · Procurement · Warehouse · Shipment · Subcontract · Finance · Human Resources |
| **Global Service** | **4** | Business Reporting · Business Communication · AI Assistant · Documents |
| **Platform Service** | **1** | Platform Services |

⚠️ **Từ 16 lên 19** — cần cập nhật ADR-001 và Hiến pháp §16.2. Ba thẻ thêm là ba
Workspace mới ở §1.2.

⚠️ **TD-05 phải trả cùng lúc**: §13.5 đòi trang chủ **lọc theo quyền**. Hôm nay
hiện đủ 16 thẻ cho mọi người ⇒ nhân viên kho nhìn thấy thẻ Finance và bấm vào
`/unauthorized`. **Thẻ không bấm được là lời nói dối của giao diện.**

## 9.3 Bottom Navigation — 5 nút, cố định mọi nơi

Hiến pháp §15.3–§15.8 khai **năm** năng lực toàn cục:
**Home · Business Communication · AI Assistant · Business Reporting · User Guidance**.

⚠️ `CLAUDE.md` §6 ghi *"bottom nav luôn đủ 4 nút"* — **lệch một nút so với Hiến
pháp**. Sửa văn bản `CLAUDE.md`, không sửa Hiến pháp.

## 9.4 Bên trong một Workspace — khuôn bố cục bắt buộc

```
┌─ Top Header (sticky) ─ danh tính màu Workspace · Search · Notification · User
├─ Workspace Title + Business Capability Tabs        ← Module, hiện thẳng
├─ Command Center / KPI ─ theo NGOẠI LỆ, không phải bảng số
├─ Bảng dữ liệu ─ mỗi bảng một vùng overflow-x riêng
├─ Biểu đồ ─ LUÔN đặt cuối
└─ Bottom Nav (5 nút)
```

## 9.5 Ba luật điều hướng — cưỡng chế bằng phép kiểm

| # | Luật | Vì sao |
|---|---|---|
| **N1** | **Không route nào mang tên chức danh.** Cấm `/to-truong-*`, `/giam-doc`, `/ke-toan` | Hiến pháp §16.2 · §22.4. Phép kiểm: quét danh sách route đối chiếu từ điển chức danh |
| **N2** | **Mỗi Workspace một `MODULE_IDENTITY` màu vĩnh viễn**, chảy tiếp vào mọi màn hình bên trong | Hiến pháp §44.2 · §44.3 |
| **N3** | **Trang chủ chỉ hiện thẻ người dùng vào được.** Không thẻ nào dẫn tới `/unauthorized` | Hiến pháp §13.5 · TD-05 |

## 9.6 Smart Routing sau đăng nhập

Hiến pháp §11 · §5.7. Thay `ROLE_HOME` cứng bằng luật:

```
1 Role  →  vào thẳng Workspace chính của Role đó
n Role  →  vào Business Operating System Launcher, đánh dấu Workspace hay dùng
Đối tác ngoài  →  vào thẳng Portal tương ứng, KHÔNG bao giờ thấy Launcher nội bộ
```

---

# PHẦN 10 — INDUSTRY BENCHMARK

## 10.1 Bảng so sánh — theo cái Monica thật sự cần

| Hệ thống | Mạnh nhất ở | Yếu với nhà máy CMT | Học gì | **Không** học gì |
|---|---|---|---|---|
| **SAP S/4HANA Fashion (FMS)** | Kỷ luật chứng từ · sổ vật tư · đa công ty · ATP/segmentation | Mô hình thiên **thương hiệu bán hàng**, không phải xưởng bán năng lực. Chi phí và đội ngũ triển khai ngoài tầm | **Nguyên tắc chứng từ**: mọi thay đổi là một chứng từ mới, không sửa đè. **Material Ledger**: giá vốn truy ngược được. Mô hình tổ chức nhiều cấp | Độ phức tạp cấu hình · tuỳ biến bằng ngôn ngữ riêng · mô hình mùa vụ/collection |
| **CGS BlueCherry** | PLM + ERP + shop floor **trong một** · ma trận style/màu/size chín muồi | Giao diện thế hệ cũ · thiên brand & wholesale Mỹ | **Ma trận Style × Color × Size** như một thực thể bậc nhất — Monica đang thiếu đúng cái này. Nối PLM↔ERP không đứt | Kiến trúc khối liền · UX cũ |
| **Infor M3 Fashion** | Mô hình item theo thuộc tính · đa site · đa đơn vị đo | Nặng, chậm triển khai | **Item matrix theo thuộc tính** và **quy đổi đơn vị đo** — vải có mét, yard, kg, cuộn cùng lúc | Trọng lượng nền tảng |
| **FastReact / Coats Digital** | 🔴 **Chuẩn vàng về HOẠCH ĐỊNH** — capacity block planning · critical path · what-if · order sequencing | Là giải pháp điểm, không phải ERP; không có tài chính, kho | 🔴 **Nhiều nhất trong danh sách này.** Mô hình block năng lực · đường găng T&A · what-if khi chen đơn gấp. Đây đúng là `OQ-021` đang chặn | Việc nó đứng một mình — Monica phải **tích hợp**, không mua thêm ốc đảo |
| **Microsoft Dynamics 365** | Nền tảng mở rộng · công cụ báo cáo · hệ sinh thái | Sản xuất **chung**, không hiểu bó–chuyền–SAM | Mô hình **mở rộng không đụng lõi** · phân tách read-model | Cố nhét quy trình may vào sản xuất rời rạc |
| **Oracle NetSuite** | Triển khai nhanh · tài chính mạnh · một CSDL | Xưởng may gần như không có | 🔴 **"One version of the truth"** — đúng thứ `BR-RPT-001` đòi. Cách họ dựng saved search/dataset dùng chung | Mô hình tài chính nặng cho một xưởng gia công |
| **ERPNext** | Mô hình DocType · sinh module nhanh · mã nguồn mở | BOM/Work Order **chung chung** — không có bó, chuyền, SAM, cuộn, dải màu | **Sinh giàn giáo module bằng metadata** · quy ước đặt tên nhất quán | Mô hình sản xuất chung của nó · phân quyền không đủ cấp cổng đối tác |
| **Odoo** | Tốc độ ra tính năng · UX gọn · rẻ | Sản xuất may **không đủ sâu**; phân quyền không chịu nổi cổng ngoài | **Tốc độ và sự gọn gàng của giao diện** | 🔴 **Mô hình phân quyền.** Đưa nhà thầu ngoài vào Odoo là mở cửa kho dữ liệu |

## 10.2 Ba điều Monica NÊN học — xếp theo giá trị

| # | Học từ | Nội dung | Vì sao đáng nhất |
|---|---|---|---|
| **1** | **FastReact** | **Mô hình năng lực theo block + đường găng + what-if** | Đây là năng lực Monica **thiếu hoàn toàn** và là thứ quyết định *"có nhận đơn này không"*. Không có nó, mọi cam kết ngày giao là phỏng đoán |
| **2** | **NetSuite** | **Một nguồn sự thật cho mọi báo cáo** | Chính là `BR-RPT-001`, tiêu chí thành công Board xếp cao nhất |
| **3** | **SAP** | **Nguyên tắc chứng từ: không sửa đè, lập chứng từ điều chỉnh** | `CLAUDE.md` §2.5 đã có nguyên tắc này. SAP chứng minh nó chịu được quy mô 30 năm |

## 10.3 Ba điều Monica TUYỆT ĐỐI KHÔNG nên học

| # | Đừng học | Vì sao |
|---|---|---|
| **1** | **Mô hình lấy THƯƠNG HIỆU làm trung tâm** *(SAP FMS · BlueCherry · Infor)* | Cả ba mô hình hoá *mùa · bộ sưu tập · SKU bán lẻ · kênh phân phối*. Monica bán **phút chuyền theo thời gian**. Mượn mô hình của họ là mượn một bộ xương sai loài — và `BR-IDN-002` đã cấm tường minh |
| **2** | **Cấu hình thay cho thiết kế** | SAP/Dynamics giải mọi khác biệt bằng bảng cấu hình. Với một sản phẩm một công ty, nó tạo ra ma trận tổ hợp không ai kiểm thử nổi. **Monica nên viết cứng nghiệp vụ Monica, cấu hình chỉ những thứ thật sự đổi theo khách** |
| **3** | **Phân quyền theo nhóm người dùng phẳng** *(Odoo · ERPNext)* | Monica có **đối tác ngoài GHI dữ liệu**. Mô hình nhóm phẳng không diễn đạt nổi *"nhà thầu A thấy đơn giá của mình nhưng không thấy của B, và không thấy tên khách"*. Đây là chỗ Monica **đã đi đúng** — đừng lùi lại |

## 10.4 Monica ONE nên KHÁC BIỆT ở đâu — sáu điểm

| # | Khác biệt | Vì sao không ai làm được |
|---|---|---|
| **1** | 🔴 **Nhà máy gia công là công dân hạng nhất**, không phải phần mở rộng của một ERP thương hiệu | Mọi hệ thống lớn đều bắt đầu từ người bán sản phẩm. Monica bắt đầu từ **người bán năng lực** — mô hình dữ liệu khác từ gốc |
| **2** | 🔴 **Đối tác ngoài GHI dữ liệu, phân quyền theo Assignment tới tận CSDL** | Đây là **lợi thế cạnh tranh đã có sẵn** trong mã. Không hệ nào trong bảng trên làm được ở mức RLS |
| **3** | 🔴 **Evidence First — bằng chứng gắn vào mọi giao dịch** | Tranh chấp trong ngành may được xử bằng **ảnh và chứng từ**. Hệ thống nào giữ được chuỗi bằng chứng thì thắng cuộc đàm phán khấu trừ |
| **4** | 🔴 **Đối soát NPL gia công theo hải quan Việt Nam** *(nhập E31/E21 ⟷ xuất)* | Không hệ quốc tế nào làm. Với nhà máy CMT Việt Nam, đây là nghiệp vụ **bắt buộc theo luật** và đang phải làm bằng Excel |
| **5** | **Ba ngôn ngữ ngang hàng, tiếng Việt là ngôn ngữ vận hành thật** | Công nhân và tổ trưởng dùng tiếng Việt; khách dùng Anh/Trung. Các hệ trên đều là bản dịch của một sản phẩm tiếng Anh |
| **6** | **Quản trị bằng Hiến pháp + ADR** | Không phải tính năng, nhưng nó là lý do Monica sẽ **không trôi** sau 5 năm — thứ mà mọi ERP tuỳ biến đều mắc |

---

# PHẦN 11 — FINAL RECOMMENDATION

## 11.1 GIỮ NGUYÊN — không đụng vào

| Module hiện tại | Vì sao giữ |
|---|---|
| `lib/mos/permission/` · `lib/mos/domain/assignment.ts` | Đúng mô hình, thuần, kiểm thử được. **Khuôn mẫu cho mọi Domain khác** |
| `middleware.ts` + `_services/guard.ts` + RLS | Ba tầng phòng thủ đã đúng cấu trúc |
| Cây vị trí kho + sổ chuyển động *(15 bảng)* | Nền tảng kho đã đủ sâu |
| `lib/garment-math.ts` | Tri thức ngành đã viết đúng — **chỉ đang không ai gọi**. Nối lại là có ngay tính năng |
| `lib/i18n` + `messages/{vi,en,zh}` + phép kiểm | Kiến trúc i18n đã đúng và đã có răng |
| Hiến pháp · ADR · nhãn bằng chứng · arch test | Tài sản quản trị |
| `assignments` · `partners` · `partner_accounts` | Mô hình đối tác đúng |

## 11.2 GỘP

| Gộp | Thành | Ưu tiên |
|---|---|---|
| 4 route Production | **Workspace Production** với 4 lát cắt vai trò | 🔴 P0 |
| `suppliers` + `subcontractors` | **`Party`** kernel S1 | 🟠 P1 |
| `/orders` | Merchandising › Order Book | 🟡 P2 |
| `components/md/po/*` + `po-command/*` | **một** thế hệ giao diện PO | 🟡 P2 |
| `ceo-report.ts` + `home-metrics.ts` + service MD | **tầng read-model S7** | 🔴 P0 |

## 11.3 BỎ

| Bỏ | Vì sao | Cách bỏ |
|---|---|---|
| `md-legacy-client.tsx` *(437 dòng)* | Mã chết, 0 tệp import — **nhưng là nơi DUY NHẤT gọi `garment-math`** | ⚠️ **Nối `garment-math` vào sản phẩm TRƯỚC**, rồi mới bỏ. Bỏ trước là mất tri thức ngành |
| 3 lát cắt PO cấp quyền mà không dựng *(`buyer` · `finance` · `activity`)* | Cấp quyền tới hư không là nói dối mô hình phân quyền | Hoặc dựng, hoặc gỡ khỏi RBAC. **Không để nguyên** |
| `ROLE_HOME` cứng | Thay bằng Smart Routing theo luật | §9.6 |
| Phân loại `/buyer` và `/subcon` là Workspace | Chúng là Portal | đổi phân loại, không xoá mã |

⚠️ **Không bỏ một màn hình nghiệp vụ nào.** `CLAUDE.md` §6 mục 2 — chỉ thêm hoặc
đổi đường dùng.

## 11.4 XÂY MỚI — xếp theo mức độ ưu tiên

### 🔴 P0 — không có thì không triển khai được

| # | Xây gì | Vì sao P0 | Chặn bởi |
|---|---|---|---|
| **1** | **Bịt 8 bảng MD hở** *(`costings` · `style_bom` · …)* | Rủi ro thương mại tồn vong | `VR-001` · SECURITY FREEZE |
| **2** | **`Order` có luật chuyển trạng thái + huỷ đơn** | Vòng đời không có lối ra | `OQ-004` |
| **3** | **Domain Finance: `Invoice` · `Payment` · `Deduction` · `Receivable`** | Xương sống Order-to-Cash đứt | `OQ-001` `OQ-017` `OQ-018` |
| **4** | **Mô hình năng lực + CTP** *(D5)* | Không trả lời được *"nhận nổi đơn không"* | `OQ-021` |
| **5** | **Tầng read-model S7** | `BR-RPT-001` — tiêu chí thành công cao nhất | `OQ-005` |
| **6** | **Bộ kiểm nghiệp vụ MD + Warehouse** | 19k dòng không có lưới an toàn | — *(làm được ngay)* |

### 🟠 P1 — không có thì không mở rộng được

| # | Xây gì | Vì sao |
|---|---|---|
| 7 | **Sổ đăng ký máy trạng thái + phép kiểm mã⟷CSDL** | TD-03 · 8 bộ từ vựng rời rạc |
| 8 | **Workspace Production hợp nhất** | Hiến pháp §22.4 · §22.5 |
| 9 | **Kernel `Party` S1** | Supplier ⟷ Subcontractor trùng pháp nhân |
| 10 | **Workflow & Approval Engine S5** | Mọi luồng duyệt hiện phải viết tay từng Domain |
| 11 | **Domain Product Development** *(Style · TechPack có phiên bản · Sample · BOM)* | `BR-SMP-003` · Hiến pháp Điều 8 |
| 12 | **Phân biệt QA nội bộ ⟷ QA khách** | `BR-ACC-002` không cưỡng chế được nếu thiếu |
| 13 | **Workspace Commercial** *(Customer · Contract · Price · PaymentTerm)* | Điều 19 · `BR-ORD-003` |

### 🟡 P2 — làm cho hệ thống trở thành sản phẩm thật

| # | Xây gì |
|---|---|
| 14 | **Domain Industrial Engineering** — SMV là nguồn chân lý của giá, năng lực và lương |
| 15 | **Domain Procurement** — Supplier · PO mua · đối chiếu 3 chiều |
| 16 | **Đối soát NPL gia công theo hải quan** — khác biệt số 4 ở §10.4 |
| 17 | **Supplier Portal** |
| 18 | **Truy vết cuộn → bó → chuyền → thùng → lô hàng** không đứt |
| 19 | **Domain HR** — chấm công · ma trận tay nghề · lương sản phẩm |
| 20 | **Executive Center theo ngoại lệ** *(chờ `OQ-006`)* |

### 🔵 P3 — sau khi nền móng xong

Compliance & Social Audit · Maintenance & Asset · Sustainability Traceability ·
AI Assistant có ngữ cảnh nghiệp vụ · Bán sỉ · bán lẻ *(`FD-001`)*.

## 11.5 Lộ trình đề nghị — theo mốc, không theo tháng

| Mốc | Nội dung | Điều kiện ra |
|---|---|---|
| **M0 · An toàn** | P0 mục 1 + 6 | 8 bảng đã bịt, xác minh trên CSDL thật; bộ kiểm nghiệp vụ chạy |
| **M1 · Xương sống** | P0 mục 2 + 3 + 5 | Một đơn đi trọn: xác nhận → sản xuất → xuất → hoá đơn → thu tiền → đóng |
| **M2 · Hoạch định** | P0 mục 4 + P1 mục 7 + 8 | Trả lời được *"nhận đơn này có kịp không"* bằng số |
| **M3 · Ranh giới** | P1 mục 9–13 | 14 Workspace đúng Domain, không route nào mang tên chức danh |
| **M4 · Chiều sâu ngành** | P2 | Truy vết không đứt · SMV là nguồn duy nhất · đối soát hải quan |

## 11.6 Điều kiện tiên quyết — không có thì mọi mốc trên vô nghĩa

| # | Điều kiện | Ai làm |
|---|---|---|
| 1 | 🔴 **Chạy `VR-001`** | Board — 1 phút |
| 2 | 🔴 **Trả lời [BUSINESS CONFIRMATION #1](../business/BUSINESS_CONFIRMATION_1.md)** *(20 câu)* | Board |
| 3 | 🔴 **Trả lời [BUSINESS CONFIRMATION #2](../business/BUSINESS_CONFIRMATION_2.md)** *(18 câu)* | Board |
| 4 | **Cắt vòng khoá SECURITY FREEZE** | Board |
| 5 | **Duyệt ADR-012 → ADR-016** | Board sau phản biện |
| 6 | **Định thời hạn phản biện tối đa** | Board — ADR-011 §4.2 ghi *"chưa quyết"* |

---

# PHỤ LỤC — CHỖ TÔI CÓ THỂ SAI

> Bắt buộc theo [ADR-011 §2.3 mục 4](../adr/ADR-011-tham-quyen-kien-truc.md).
> Hồ sơ không có mục này **chưa đủ điều kiện phản biện**.

| # | Giả định chưa xác minh | Nếu sai thì hỏng cái gì |
|---|---|---|
| **U1** | Tôi giả định Monica **có** bộ phận IE và **có** đo SMV | Nếu Monica báo giá theo kinh nghiệm chứ không theo SMV, thì D4 là Domain thừa và toàn bộ mô hình năng lực §D5 phải đổi cách tiếp cận |
| **U2** | Tôi giả định Monica **tự mua NPL** cho đơn FOB với khối lượng đáng kể | Nếu gần như toàn bộ là CMT khách cấp NPL, Domain Procurement xuống P3 |
| **U3** | Tôi giả định **đối soát NPL gia công theo hải quan** là nghiệp vụ Monica đang phải làm | Nếu Monica không nhập khẩu trực tiếp mà đi qua khách, khác biệt số 4 §10.4 biến mất |
| **U4** | Tôi giả định `production_orders` là **lệnh sản xuất**, không phải PO nội bộ | `CF-3` chưa được Board phán quyết. Sai thì D5 phải mô hình lại |
| **U5** | Tôi giả định **một pháp nhân có thể vừa là supplier vừa là subcontractor** ở Monica | Nếu không bao giờ trùng, kernel `Party` là kỹ thuật thừa |
| **U6** | Tôi giả định khách hàng **có** quyền duyệt mẫu và duyệt xuất hàng trong hệ thống | Nếu duyệt qua email ngoài hệ thống, Customer Portal thu hẹp còn chỉ-đọc |
| **U7** | Tôi **chưa đọc** nội dung dự kiến `031d`–`031g` | Khuyến nghị cắt vòng khoá freeze *(Audit §7 phương án A)* có thể sai |
| **U8** | Tôi giả định Board muốn giữ ràng buộc **Workspace 1:1 Domain** của §5.4 | Nếu Board cho phép tách hai khái niệm, số Workspace giảm còn ~11 và Domain vẫn 14 |
| **U9** | Ba Domain mới **làm phình trang chủ từ 16 lên 19 thẻ** | Nếu Board thấy 19 thẻ là quá nhiều, phải gộp — và gộp sẽ tái lập chính vấn đề ranh giới đang sửa |

---

## THAM CHIẾU

- [`00-CONSTITUTION.md`](00-CONSTITUTION.md) v1.5 — §5.3 · §5.4 · §11 · §13 · §15 · §16.2 · §18.7 · §22.4 · §22.5 · §37.5 · §40 · §42 · §44
- [`BUSINESS_KNOWLEDGE_BASE.md`](../business/BUSINESS_KNOWLEDGE_BASE.md) v2.0 — 60 quy tắc · Phần D ranh giới truy cập
- [`MONICA_ONE_AUDIT_REPORT.md`](../audit/MONICA_ONE_AUDIT_REPORT.md) — bằng chứng hiện trạng
- [`ADR-011`](../adr/ADR-011-tham-quyen-kien-truc.md) §2.3 — nghĩa vụ hồ sơ phản biện
- [`ENGINEERING_PLAYBOOK.md`](../ENGINEERING_PLAYBOOK.md) Điều XXX — phân quyền theo Assignment
- Tài liệu con: [Merchandising](domains/MERCHANDISING_ARCHITECTURE.md) · [Warehouse](domains/WAREHOUSE_ARCHITECTURE.md) · [Manufacturing](domains/MANUFACTURING_ARCHITECTURE.md)
