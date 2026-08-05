# MONICA ONE · PROJECT MEMORY
## Lớp tri thức nền — nguồn tham chiếu chính cho mọi AI, mọi lập trình viên, mọi Sprint

| Trường | Giá trị |
|---|---|
| **Mã** | `PROJECT_MEMORY` |
| **Ngày lập** | 2026-08-04 |
| **Người lập** | Chief Enterprise Architect |
| **Bản chất** | 🔴 **CHỈ MỤC VÀ LIÊN KẾT — ⛔ KHÔNG chứa tri thức mới** |
| **Nguồn** | Constitution v1.5 · 11 ADR · BKB v2.0 · 13 tài liệu EDD · 149 Decision Log · 29 Board Decision |
| **Cập nhật** | Sau mỗi Sprint được Board phê duyệt — xem §11 |

> # 🔒 ARCHITECTURE FROZEN · 2026-08-04
>
> **[`ARCHITECTURE_BASELINE.md`](ARCHITECTURE_BASELINE.md)** — Freeze Certificate đã ký.
> Baseline `MONICA-ONE-BASELINE-2026-08-04` · Constitution **v1.6** · BKB **v2.0 ADOPTED** ·
> **15 tài liệu ADR · 14 số hiệu** · 14 EDD · 149 Decision Log · 29 Board Decision.
>
> ✅ **ADR-018** *(Thu hẹp `authenticated_only` — 23 bảng)* — **ADR đầu tiên sau
> khi đóng băng**, đi qua Architecture Change Procedure, **không** thuộc baseline.
> **ĐÃ ĐÓNG 05/08/2026**: Board phê duyệt · `041` + `042` đã chạy · `F-1` và
> `F-2` khép · ma trận đọc `90/90` · `A001` đạt · phản biện hậu kiểm xong
> *(🔴 treo 0 · 🟠 treo 1 ⇒ `TD-32`)*.
>
> ## 🔑 `P-MEASURE` — nguyên tắc kiểm chứng, sinh từ sự cố 05/08/2026
>
> Toàn văn ở [`ARCHITECTURE_BASELINE.md`](ARCHITECTURE_BASELINE.md) §3.0.
>
> ```
> ① Đo trước, kết luận sau — suy diễn từ biểu thức policy KHÔNG phải bằng chứng
> ② Mọi phép đo ghi rõ: trạng thái hệ thống · phiên bản migration · dữ liệu · điều kiện
> ③ Kết luận CHỈ có giá trị với ĐÚNG trạng thái đã được đo
> ```
>
> **Ba sai lầm liên tiếp trên cùng một vấn đề, cùng một ngày:**
>
> | | | |
> |---|---|---|
> | ① | Suy diễn từ biểu thức policy ⇒ ghi lỗi 🔴 `B-1`, soạn `043` | lỗi **không có thật** |
> | ② | `043` được chạy. **Đo thật** ⇒ rút lại `B-1`, xoá tệp | đo **đúng kỹ thuật**, nhưng đo CSDL **đã bị chính bản vá của mình đổi** |
> | ③ | Đo có kiểm soát trạng thái | `043` **đang mở lỗ hổng toàn phần** |
>
> 🔴 **Sai lầm ② là sai lầm đắt nhất, và nó đi lọt qua vế ①.** Phép đo hoàn toàn
> đúng. Cái sai là **không biết mình đang đo cái gì**. Đó là lý do vế ② và ③ tồn
> tại — và lý do `harness.mjs` có `boiCanh()` + `dauVan()`: biến nguyên tắc
> thành **cơ chế**, không phải lời nhắc.
>
> Hồ sơ đầy đủ: [`review/ADR-018-review.md`](review/ADR-018-review.md) §B-1 và
> Phụ lục · `supabase/migrations/044_restore_costing_lock.sql`.
>
> 🔴 **Mọi thay đổi kiến trúc từ nay đi qua [Architecture Change Procedure](enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) — EDD-06 §10.**
> ⛔ **Không được thay đổi kiến trúc trực tiếp bằng mã.** Phát hiện vấn đề khi lập trình
> ⇒ **cập nhật tài liệu trước**, sau đó mới sửa Implementation.
>
> 🟡 **Implementation còn chờ Cổng B** — `VR-001` · cắt vòng khoá SECURITY FREEZE ·
> 4 mục quản trị. Xem `ARCHITECTURE_BASELINE.md` §3.1.

---

# §0 · ĐỌC TÀI LIỆU NÀY THẾ NÀO

## 0.1 Tài liệu này **KHÔNG** phải cái gì

| ⛔ **KHÔNG** phải | ✅ **LÀ** |
|---|---|
| Nguồn chân lý mới | **Chỉ mục** trỏ tới nguồn chân lý |
| Bản tóm tắt thay thế tài liệu gốc | **Bản đồ** để tìm tài liệu gốc |
| Nơi ghi quyết định mới | **Sổ đăng ký** quyết định đã có |

🔴 **Khi Project Memory và tài liệu gốc mâu thuẫn: TÀI LIỆU GỐC THẮNG.** Mâu thuẫn là lỗi của Project Memory, phải sửa ngay tại đây.

## 0.2 Ba đường vào theo mục đích

| Bạn cần | Đọc theo thứ tự |
|---|---|
| 🆕 **Mới tham gia dự án** | §10 Lộ trình nhập môn — 5 tài liệu, ~3 giờ |
| 🔍 **Tra một quyết định cụ thể** | §5 Chỉ mục Decision Log · §6 Board Decision |
| 🏗 **Sắp thiết kế hoặc viết mã** | §3 Năm nguyên tắc → §4 Bản đồ Domain → §8 Khuyết tật đã biết |

---
---

# §1 · THỨ BẬC VĂN BẢN CHUẨN TẮC

> Nguồn: [ADR-010](adr/ADR-010-thu-bac-van-ban-chuan-tac.md) · Hiến pháp §5.12 · §43.3
> 🔴 **Bậc trên luôn thắng bậc dưới.**

| Bậc | Văn bản | Vai trò |
|---|---|---|
| **0** | **Quyết định của Board** | Nguồn duy nhất của **sự thật nghiệp vụ** |
| **0′** | [`business/BUSINESS_KNOWLEDGE_BASE.md`](business/BUSINESS_KNOWLEDGE_BASE.md) | Đặc tả nghiệp vụ — ✅ **v2.0 ADOPTED** *(04/08/2026)* |
| **1** | [`architecture/00-CONSTITUTION.md`](architecture/00-CONSTITUTION.md) | **Hiến pháp duy nhất** — 45 Điều · ✅ **`v1.6 ADOPTED`** |
| **2** | [`adr/`](adr/) | Quyết định kiến trúc — **17 bản, bất biến, ⛔ không sửa** |
| **2′** | 🆕 [`enterprise-design/`](enterprise-design/) | **Enterprise Design** — 13 tài liệu EDD · 149 Decision Log |
| **3** | [`UI_UX_STANDARDS.md`](UI_UX_STANDARDS.md) · [`MUTATION_POLICY.md`](MUTATION_POLICY.md) | Engineering Standards |
| **4** | [`MONICA_CONSTITUTION.md`](MONICA_CONSTITUTION.md) · [`ENGINEERING_PLAYBOOK.md`](ENGINEERING_PLAYBOOK.md) | Approved Playbooks |
| **5** | [`DOMAIN_GLOSSARY.md`](DOMAIN_GLOSSARY.md) · audit · discovery | Technical Documentation |
| **6** | mã nguồn · lược đồ CSDL | 🔴 **thấp nhất — mã ⛔ không bao giờ là nguồn chân lý** |

## 1.1 ⚠️ Ba bộ đánh số cùng tồn tại — trích dẫn phải nói rõ nguồn

| Viết | Nghĩa |
|---|---|
| `Hiến pháp Điều 43.3` | `00-CONSTITUTION.md` — số Ả Rập, bậc 1 |
| `Playbook Điều XXX` | `ENGINEERING_PLAYBOOK.md` — số La Mã, bậc 4 |
| `MOS Điều IX` | `MONICA_CONSTITUTION.md` — số La Mã, bậc 4 |
| `BKB §12` | `BUSINESS_KNOWLEDGE_BASE.md` — bậc 0′ |
| 🆕 `DL-057` | Decision Log — bậc 2′ |
| 🆕 `BDR-25` | Board Decision — **bậc 0** |

🔴 **`Điều IX` trần, ⛔ không nguồn, là trích dẫn KHÔNG HỢP LỆ.**

## 1.2 Nghiệp vụ ⟷ Hiến pháp phân theo LĨNH VỰC

**BKB** tối cao về *cái gì là thật*. **Hiến pháp** tối cao về *phải xây thế nào*.
Mâu thuẫn thật ⇒ 🔴 **DỪNG**, ghi `NEEDS_CLARIFICATION`, Board phán quyết. ⛔ Không tự chọn bên thắng.

---
---

# §2 · SỔ ĐĂNG KÝ TÀI LIỆU

## 2.1 Enterprise Design — 13 tài liệu

| Mã | Tài liệu | Phase | DL | Trạng thái |
|---|---|---|---|---|
| **EDD-01** | [Business · Capability · Domain](enterprise-design/EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) | 1·2·3 | 001–030 | ✅ **APPROVED** |
| **EDD-02** | [Master Data · Business Object](enterprise-design/EDD-02-MASTER-DATA-BUSINESS-OBJECT.md) | 4·5 | 031–043 | ✅ **APPROVED** |
| **EDD-03** | [Document · Information Architecture](enterprise-design/EDD-03-DOCUMENT-INFORMATION-ARCHITECTURE.md) | 6·7 | 044–061 | ✅ **APPROVED** |
| **EDD-03A** | [Partner Portal Architecture](enterprise-design/EDD-03A-PARTNER-PORTAL-ARCHITECTURE.md) | 11* | 062–066 | ✅ **APPROVED** |
| **EDD-04** | [Workflow · Rule · Permission](enterprise-design/EDD-04-WORKFLOW-RULE-PERMISSION.md) | 8·9·10 | 067–082 | ✅ **APPROVED** |
| **EDD-04A** | [Partner Runtime · Mobile First](enterprise-design/EDD-04A-PARTNER-RUNTIME-MOBILE-FIRST.md) | — | 083–093 | ✅ **APPROVED** |
| **EDD-04B** | [Configuration Governance · Versioning](enterprise-design/EDD-04B-CONFIGURATION-GOVERNANCE-VERSIONING.md) | — | 094–099 | ✅ **APPROVED** |
| **EDD-04C** | [Subcontract Portal Runtime](enterprise-design/EDD-04C-SUBCONTRACT-PORTAL-RUNTIME.md) | — | 100–112 | ✅ **APPROVED** |
| **EDD-04D** | [Irrevocability Principle](enterprise-design/EDD-04D-IRREVOCABILITY-PRINCIPLE.md) | — | 113–123 | ✅ **APPROVED** |
| **EDD-04E** | [Zero Manual Principle](enterprise-design/EDD-04E-ZERO-MANUAL-PRINCIPLE.md) | — | 124–129 | ✅ **APPROVED** |
| **EDD-04F** | [Data Egress Control](enterprise-design/EDD-04F-DATA-EGRESS-CONTROL.md) | — | 130–137 | ✅ **APPROVED** |
| **EDD-04G** | [Zero Duplicate · Design Gate](enterprise-design/EDD-04G-ZERO-DUPLICATE-AND-DESIGN-GATE.md) | — | 138–141 | ✅ **APPROVED** |
| **EDD-05** | [Product Architecture](enterprise-design/EDD-05-PRODUCT-ARCHITECTURE.md) **v2** | 11·12 | 142–149 | ✅ **APPROVED** |
| **EDD-06** | [Architecture Freeze Package](enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) | — | — | 🟡 **FREEZE CÓ ĐIỀU KIỆN** |

> 🔴 **EDD-06 §2.7 chứa 5 ERRATA sửa lỗi trong tài liệu đã phê duyệt. ERRATA THẮNG BẢN GỐC:**
> `E-1` `BDR-03` mở sổ chiết tính **chưa bao giờ được trả lời** — mặc định `INTERNAL_ONLY` cứng ·
> `E-2` DORMANT là **4** Domain *(thêm `D15 Textile`)* · `E-3` **~226** màn hình, không phải ~208 ·
> `E-4` `Capability` ⟷ `Module` là **hai bản đồ khác nhau** *(93 ⟷ 78)* · `E-5` `DL-104` là mở rộng của CSA.
>
> ✅ **Freeze CÓ HIỆU LỰC 04/08/2026.** Cổng A khép: `ADR-015` · `ADR-016` ·
> `ADR-017` đã ban hành và Board phê duyệt · BKB `ADOPTED` · ADR-011 `APPROVED` ·
> Hiến pháp lên `v1.6`.
>
> 🟡 **Cổng B còn 4/6:** `B1` ✅ *(`VR-001` đo xong)* · `B6` ✅ *(`docs/review/`)* ·
> **`B2` 🔴 Board phải cắt vòng khoá SECURITY FREEZE** · `B3` · `B4` · `B5`.

`*` EDD-03A kéo Phase 11 về sớm theo chỉ thị Board.

## 2.2 🔴 Tài liệu ĐÃ BỊ THAY THẾ — ⛔ không dùng làm nguồn thiết kế

| Tài liệu | Bị thay bởi | Giữ lại vì |
|---|---|---|
| [`architecture/TARGET_ARCHITECTURE.md`](architecture/TARGET_ARCHITECTURE.md) §1 Domain | **EDD-01 Phase 3** | Hồ sơ lịch sử — Hiến pháp §43.7 |
| `TARGET_ARCHITECTURE.md` §7 *"một nền tảng Portal, ba cấu hình"* | 🔴 **EDD-03A `DL-062`** | như trên |
| **EDD-05 v1** | **EDD-05 v2** | như trên |
| [`architecture/NEEDS_CLARIFICATION.md`](architecture/NEEDS_CLARIFICATION.md) | **BKB Phần E** | Số hiệu `C1–C8` giữ nguyên |
| [`architecture/CM_OPERATING_MODEL.md`](architecture/CM_OPERATING_MODEL.md) §1.3 · §3 | **BKB Phần B** | Xây trên 4 giả định sai `H1`–`H4` |

## 2.3 ADR — **18 tài liệu · 17 số hiệu**

| ADR | Nội dung | Vị trí | Trạng thái |
|---|---|---|---|
| **001** ⚠️ | Homepage Conceptual Model | `architecture/adr/` | ✅ |
| **001** ⚠️ | Site and Operation | `assignment/` | ✅ |
| 002 | Assignment Domain | `adr/` | ✅ |
| 003 | Request ID | `adr/` | ✅ |
| 004 | Concurrency Control | `adr/` | ✅ |
| 005 | UDMD i18n & Soft Delete | `adr/` | ✅ |
| 006 | Permission Engine | `adr/` | ✅ |
| 007 | Data Reconciliation | `adr/` | ✅ |
| 008 | Bundle Stage Vocabulary | `adr/` | ✅ |
| 009 | Enterprise Design System | `adr/` | ✅ |
| 010 | Thứ bậc văn bản chuẩn tắc | `adr/` | ✅ |
| **011** | **Thẩm quyền kiến trúc · phản biện độc lập** | `adr/` | ✅ **APPROVED 04/08** |
| **015** 🆕 | **14 Business Workspace** | `adr/` | ✅ **APPROVED 04/08** |
| **016** 🆕 | **Enterprise Control Center** | `adr/` | ✅ **APPROVED 04/08** |
| **017** 🆕 | **Trang chủ hai vùng** | `adr/` | ✅ **APPROVED 04/08** |
| **018** 🆕 | **Thu hẹp `authenticated_only` — 23 bảng MD** | `adr/` | 🔴 **MỞ LẠI 05/08** · migration `042`·`044` **ĐÃ CHẠY** |
| **019** 🆕 | **Vòng đời chiết tính — `042` chặn cả phép duyệt** | `adr/` | ⏳ **chờ duyệt** · migration `045`·`045b` **ĐÃ CHẠY** |
| **020** 🆕 | **Aggregate Child Immutability** | `adr/` | ⏳ **chờ duyệt** · migration `046` **ĐÃ CHẠY** |

🔴 **⚠️ KHUYẾT TẬT ĐÃ BIẾT: hai ADR-001 khác nhau.** Xem §8 `KD-1` — nay là mục **B3** của Cổng B.

> 🔴 **ĐỌC KỸ BA DÒNG CUỐI BẢNG.** Năm migration đang chạy **sản xuất** dưới ba
> ADR **chưa được Board phê duyệt**, và **⛔ không ADR nào có phản biện độc lập**
> *(ADR-011 §1.3 chỉ định ChatGPT)*. Đây là **thủ tục hiến định bị đảo ngược**,
> ⛔ không phải khoản nợ kỹ thuật — Hiến pháp **Điều 4** · CLAUDE.md §3.
>
> **Board Decision 05/08/2026: việc này ⛔ KHÔNG chặn Sprint I-2.** Nó được theo
> dõi ở [`GOVERNANCE_PENDING_REPORT.md`](audit/GOVERNANCE_PENDING_REPORT.md)
> `GPR-001` §1 nhóm `A`, và **chặn Cổng C**.
>
> ⚠️ Ba migration ấy **đúng về kỹ thuật** và đã thu hẹp bề mặt tấn công một cách
> đo được. Bác chúng ⇒ hệ thống **kém an toàn hơn** hôm nay. Đề nghị của CSA là
> **phê chuẩn hồi tố**, ⛔ không phải quay lui.

## 2.4 Tài liệu nghiệp vụ và audit

| Tài liệu | Vai trò | Trạng thái |
|---|---|---|
| [`business/BUSINESS_KNOWLEDGE_BASE.md`](business/BUSINESS_KNOWLEDGE_BASE.md) v2.0 | 60 quy tắc `BR-*` · 36 `OQ` · 8 `CF` · 3 `VR` | ⏳ **DRAFT** |
| [`business/BUSINESS_CONFIRMATION_1.md`](business/BUSINESS_CONFIRMATION_1.md) | 20 câu | ✅ đã trả lời phần lớn |
| [`business/BUSINESS_CONFIRMATION_2.md`](business/BUSINESS_CONFIRMATION_2.md) | 18 câu | ✅ đã trả lời phần lớn |
| [`audit/MONICA_ONE_AUDIT_REPORT.md`](audit/MONICA_ONE_AUDIT_REPORT.md) | Hiện trạng đo được | ✅ |
| [`audit/MD_PRODUCT_AUDIT.md`](audit/MD_PRODUCT_AUDIT.md) | 38 phát hiện tầng MD | ✅ |
| [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md) | TD-01…TD-15 | ✅ |
| [`MIGRATION_INDEX.md`](MIGRATION_INDEX.md) | Khoảng trống số hiệu migration | ✅ |

---
---

# §3 · NĂM NGUYÊN TẮC THIẾT KẾ DOANH NGHIỆP

> 🔴 **Board phê chuẩn chính thức.** Mọi thiết kế phải qua cả năm.

| | Nguyên tắc | Phát biểu | Nguồn |
|---|---|---|---|
| `P-COMMIT` | **Sự kiện ⟷ cam kết** | Sự kiện thì tự động và nhanh; **cam kết thì có chủ ý và chậm** | `DL-089` `DL-112` `DL-124` |
| `P-IRREV` | **Bất khả thu hồi** | Dữ liệu đã tiết lộ ⛔ **không lấy lại được** ⇒ **phòng ngừa là cơ chế duy nhất** | `BDR-25` · EDD-04D |
| `P-ATTRIB` | **Quy trách nhiệm** | Ngăn ở chỗ ngăn được; quy trách nhiệm ở chỗ ⛔ không ngăn được; ⛔ **không dựng kiểm soát giả** | `BDR-26` · EDD-04F |
| `P-ZEROMAN` | **Không nhập tay** | ⛔ Không bắt người dùng nhập thứ hệ thống **thu nhận** được — thang 7 bậc | EDD-04E |
| `P-ZERODUP` | **Không nhập trùng** | ⛔ Không bắt người dùng nhập thứ hệ thống **đã có** | EDD-04G |

## 3.1 Sáu câu Screen Design Gate

```
G1  P-ZERODUP    Dữ liệu này đã tồn tại ở đâu chưa?     → KẾ THỪA. Dừng, ⛔ không hỏi G2
G2  P-ZEROMAN    Có cách nào thu nhận mà ⛔ không gõ?     → thang 7 bậc
G3  P-COMMIT     Sự kiện hay quyết định?                → cam kết cần ma sát
G4  P-IRREV      Có lộ thứ ⛔ không thu hồi được?         → 8 cơ chế phòng ngừa
G5  P-ATTRIB     ⛔ Không ngăn được thì quy được?         → dấu chìm · nhật ký
G6  SSoT         Một dữ liệu tồn tại nhiều nơi?         → MetricDefinition · read-model
```

🔴 **`G1` phải hỏi TRƯỚC `G2`** *(`DL-140`)* · 🔴 **`duplicate_field_count > 0` ⇒ ⛔ không duyệt thiết kế.**

## 3.2 Thang 7 bậc `P-ZEROMAN`

```
Cấu trúc:  ① tự động → ② QR/mã vạch → ③ camera → ④ AI Vision
           → ⑤ OCR → ⑥ import → ⑦ voice → ⑧ nhập tay
Tự sự:     🔴 ① VOICE → ② mẫu câu → ③ ảnh + chú thích → ④ gõ   (DL-125)
```

## 3.3 Bốn khuyết tật kiến trúc mà nhập trùng chỉ điểm

| | Khuyết tật | Dấu hiệu |
|---|---|---|
| `A1` | Mô hình thiếu quan hệ | phải gõ mã để liên kết |
| `A2` | Ranh giới Domain vẽ sai | phải chép qua |
| `A3` | Thiếu read-model | phải tra rồi gõ |
| `A4` | Workflow ⛔ không mang ngữ cảnh | mỗi bước bắt đầu từ trắng |

---
---

# §4 · BẢN ĐỒ DOMAIN — TRA NHANH

## 4.1 Mười bốn Business Domain

| # | Domain | Sở hữu dữ liệu gốc | Activation Monica |
|---|---|---|---|
| **D1** | Commercial | `Customer` `Contract` `PriceAgreement` `PaymentTerm` | 🟡 EMBEDDED |
| **D2** | Merchandising | **`Order`** `Costing` `Quotation` `TnAPlan` `OrderMaterialPlan` `OrderAllocation` `OrderChange` | 🟢 ACTIVE |
| **D3** | Product Development | `Style` `TechPack` `Sample` `BOM` `Marker` `PPMeeting` | 🟡 EMBEDDED |
| **D4** | Industrial Engineering | **`StandardTime`** `Operation` `OperationBulletin` `LineLayout` | 🟡 EMBEDDED |
| **D5** | Planning | `Capacity` `CapacityBooking` `ProductionOrder` `LineSchedule` `MaterialRequirement` | 🟡 EMBEDDED |
| **D6** | Manufacturing | `WorkCenter` `CutTicket` `Bundle` `StageThroughput` `StageTransfer` `DowntimeEvent` | 🟢 ACTIVE |
| **D7** | Quality | `InspectionPlan` **`Inspection`** `Defect` `CAPA` `MaterialInspection` | 🟢 ACTIVE |
| **D8** | Procurement | `Supplier` `PurchaseRequisition` `PurchaseOrder` `MatchResult` | 🟢 ACTIVE |
| **D9** | Warehouse | `Location` **`StockLedger`** `MaterialLot` `FabricRoll` `Reservation` `StockCount` | 🟢 ACTIVE |
| **D10** | Logistics | `Booking` `Shipment` `PackingList` `ExportDocument` `Carton` | 🟢 ACTIVE |
| **D11** | Subcontract | `Subcontractor` **`Assignment`** `AssignmentTerm` `PartnerAccount` | 🟢 ACTIVE |
| **D12** | Finance | `InvoiceRequest` `ExternalInvoiceMirror` `Payment` **`Deduction`** `Receivable` `Payable` `CostActual` | 🟢 ACTIVE |
| **D13** | People | `Employee` `Attendance` `SkillMatrix` `PieceRateEarning` | 🟡 EMBEDDED |
| **D14** | Executive Center | ⛔ **KHÔNG sở hữu gì** — Workspace ⛔ không có Domain | 🟢 ACTIVE |

⏳ **DORMANT:** Compliance & Social Audit · Maintenance & Asset · Wholesale & Retail · **D15 Textile Manufacturing** *(giới hạn đã ghi — `DL-079`)*

## 4.2 Chín Shared Kernel

`S1` Party & Organization · `S2` Identity·Role·Assignment · `S3` Item & Product Master ·
`S4` Document & Evidence · `S5` Workflow & Approval · `S6` Communication & Notification ·
`S7` Reporting & Reconciliation · `S8` Calendar·Numbering·Localization · `S9` Audit Trail & Event Log

## 4.3 Nguyên tắc THÌ CỦA ĐỘNG TỪ — giải mọi tranh chấp sở hữu

```
D2 Merchandising  · TƯƠNG LAI ĐÃ HỨA   Order            "ta đã hứa gì?"
D5 Planning       · TƯƠNG LAI DỰ ĐỊNH  ProductionOrder  "định làm khi nào?"
D6 Manufacturing  · QUÁ KHỨ ĐÃ XẢY RA  StageThroughput  "thực tế đã xảy ra gì?"
D9 Warehouse      · HIỆN TẠI ĐANG GIỮ  StockLedger      "bây giờ có gì, của ai?"
```

Phép thử: *con số này là **lời hứa**, **ý định**, **sự kiện**, hay **hiện trạng**?* — `DL-008`

## 4.4 Chín Object Control Tower

`Order 360°` · `Style 360°` · `Roll 360°` · `Bundle 360°` · `Assignment 360°` ·
`Shipment 360°` · `Inspection 360°` · `PO 360°` · `Party 360°`

**11 lớp Context Rail thống nhất:** Search · Timeline · Document · Chat · Task · Approval · AI · Related · Risk · History · Audit — `DL-148`

---
---

# §5 · CHỈ MỤC DECISION LOG — 149 QUYẾT ĐỊNH

> **Rút lại:** ✅ dễ · ⚠️ khó · 🔴 rất khó *(đổi = cascade lớn)*
> Tra toàn văn: xem cột **Nguồn**.

## 5.1 🔴 MƯỜI CHÍN QUYẾT ĐỊNH CHỊU LỰC — đổi là cascade toàn hệ

| Mã | Quyết định | Nguồn |
|---|---|---|
| `DL-010` | 1 `Order` : N `Shipment` | EDD-01 |
| `DL-011` | 1 `Style` : N `Order` | EDD-01 |
| `DL-012` | `SalesOrder` bán lẻ tách hẳn `Order` gia công | EDD-01 |
| `DL-022` | Ranh giới **bất biến ⟷ cấu hình được** | EDD-01 |
| `DL-033` | BOM khai ở cấp `Style`, hệ số theo `Size` | EDD-02 |
| `DL-051` | **Chứng từ là DỮ LIỆU, ⛔ không phải TỆP** | EDD-03 |
| `DL-056` | `TenantScope` là lớp ngoài cùng | EDD-03 |
| `DL-057` | 🔴 **PHÉP CHIẾU TIẾT LỘ** — vai ngoài ⛔ không chạm bảng gốc | EDD-03 |
| `DL-058` | 4 hình thái triển khai = 4 **cấu hình**, ⛔ không phải 4 kiến trúc | EDD-03 |
| `DL-062` | **Ba Portal = ba Business Capability độc lập** | EDD-03A |
| `DL-070` | ⛔ **KHÔNG BAO GIỜ thực thi mã tự do của người dùng** | EDD-04 |
| `DL-083` | Danh tính dùng chung, hồ sơ cô lập | EDD-04A |
| `DL-088` | **Mobile-first là quyết định TẦNG DỮ LIỆU** | EDD-04A |
| `DL-094` | Ba tầng cấu hình L1·L2·L3 | EDD-04B |
| `DL-099` | AI có **0 quyền** trên Workflow·Rule·Permission·Config | EDD-04B |
| `DL-101` | Hàng đợi ghi độc lập với phiên đăng nhập | EDD-04C |
| `DL-102` | Liên kết **XÁC THỰC**, ⛔ không phân quyền | EDD-04C |
| `DL-117` | **Quay lui khôi phục CẤU HÌNH, ⛔ không khôi phục BÍ MẬT** | EDD-04D |
| `DL-138` | `P-ZERODUP` nói về **công sức con người**, ⛔ không phải chuẩn hoá | EDD-04G |
| `DL-143` | ⛔ **Cấm sửa bằng mã để bù sai kiến trúc** | EDD-05 |

## 5.2 Chỉ mục theo chủ đề

### A · DOMAIN · RANH GIỚI · KIẾN TRÚC NỀN — `DL-001`…`DL-030` *(EDD-01)*

| Mã | Nội dung | Rút |
|---|---|---|
| 001 | Phép thử 5 câu xác định Domain | ✅ |
| 002 | 14 Domain = 13 Domain + 1 Workspace-⛔không-Domain | ✅ |
| 003 | **Domain Activation Model** — ACTIVE/EMBEDDED/DORMANT | ⚠️ |
| 004 | 9 Domain bắt buộc · 5 bật-tắt | ✅ |
| 005 | Sample là **Module** ⊂ D3, ⛔ không phải Domain | ✅ |
| 006 | Costing là **Module** ⊂ D2 | ✅ |
| 007 | `Efficiency` là **MetricDefinition** ⊂ S7, ⛔ không là cột | ⚠️ |
| 008 | **Nguyên tắc THÌ CỦA ĐỘNG TỪ** | ✅ |
| 009 | Kernel `Party` | ⚠️ |
| **010** | **1 Order : N Shipment** | 🔴 |
| **011** | **1 Style : N Order** | 🔴 |
| **012** | **`SalesOrder` tách `Order`** | 🔴 |
| 013 | `ProductionOrder` tham chiếu nhiều `OrderLine` từ nhiều `Order` | ⚠️ |
| 014 | `Customer`·`Contract` thuộc D1; MD giữ Role cả hai Domain | ✅ |
| 015 | Đơn vị năng lực = **TUẦN-CHUYỀN** | ✅ |
| 016 | **Sổ Thời gian chuẩn** thay IE đầy đủ ở GĐ1 | ✅ |
| 017 | Mốc gốc T&A do mẫu khai, mặc định **ETD** | ✅ |
| 018 | Kế hoạch kiểm cấu hình theo khách, mặc định INLINE+FINAL | ✅ |
| 019 | Xử lý lô trượt AQL — 4 hướng, ai quyết cái nào | ✅ |
| 020 | **Mặc định tiết lộ = `INTERNAL_ONLY`** | ⚠️ |
| 021 | **Mức tiết lộ nằm ở TỪNG PHÁT HIỆN** | ⚠️ |
| **022** | **Ranh giới bất biến ⟷ cấu hình được** | 🔴 |
| 023 | **Work Item là PHÉP CHIẾU**, ⛔ không phải bảng | ⚠️ |
| 024 | Trang chủ có **hai vùng** — Công việc + Business Apps | ✅ |
| 025 | Monica ONE ⛔ **không xây sổ cái, ⛔ không phát hành hoá đơn** | ⚠️ |
| 026 | `Deduction` là aggregate **bắt buộc** | ✅ |
| 027 | `ownership` ở **cấp DÒNG** NPL | ✅ |
| 028 | Tích hợp MISA GĐ1 dùng **FILE** | ✅ |
| 029 | Dải màu · kiểm vải 4 điểm mặc định, tắt được | ✅ |
| 030 | **Bốn kiểu công đoạn** BUFFER/FLOW/BATCH/GATE | ⚠️ |

### B · MASTER DATA · BUSINESS OBJECT — `DL-031`…`DL-043` *(EDD-02)*

| Mã | Nội dung | Rút |
|---|---|---|
| **031** | 🔴 **Chuyền nhà thầu CŨNG là `WorkCenter`** | ⚠️ |
| 032 | **Dịch NHÃN của MÃ, ⛔ không dịch NỘI DUNG hồ sơ** | ✅ |
| **033** | **BOM khai ở cấp `Style`**, hệ số theo `Size` | 🔴 |
| 034 | `UOMConversion` gắn vào `Material`, ⛔ không toàn cục | ⚠️ |
| 035 | `FactoryCalendar` gắn `Site`, ⛔ không gắn `Tenant` | ✅ |
| 036 | **`ProcessRoute` là DỮ LIỆU CHỦ** — có `leaves_factory` | ⚠️ |
| 037 | Thêm trạng thái `SETTLED` giữa `INVOICED` và `CLOSED` | ✅ |
| 038 | **Cổng 1–2 MỀM · cổng 3–4 CỨNG** | ✅ |
| 039 | `StandardTime`: 4 Domain đọc, **0 Domain sao chép** | ⚠️ |
| 040 | PO mua **hai chữ ký = hai CÂU HỎI** *(MD kỹ thuật · GĐSX thương mại)* | ✅ |
| 041 | `margin_percent` ⛔ không lưu, **NHƯNG chụp vào `approval_snapshot`** | ✅ |
| 042 | Huỷ đơn: GĐSX quyết + **đồng ký** khi vượt ngưỡng/đã mua NPL/có Assignment | ✅ |
| 043 | **5 tín hiệu rủi ro bằng LUẬT trước, học máy sau** | ✅ |

### C · DOCUMENT · INFORMATION — `DL-044`…`DL-061` *(EDD-03)*

| Mã | Nội dung | Rút |
|---|---|---|
| 044 | IP Ownership là dữ liệu chủ **có luật đi kèm** | ✅ |
| 045 | `Facet` = nhóm thuộc tính có điều kiện của **cùng bản ghi gốc** | ⚠️ |
| 046 | Sở hữu vật tư là **phép tra luật `M67`** | ✅ |
| 047 | Lưu số tiền ở **cả ba tiền tệ** tại thời điểm ghi sổ | ⚠️ |
| 048 | Bốn loại tỷ giá — có `CONTRACT_FIXED` | ✅ |
| 049 | Ngày lấy tỷ giá khai **theo loại chứng từ** | ✅ |
| 050 | **Tách chênh lệch tỷ giá thành dòng riêng** trong `CostActual` | ⚠️ |
| **051** | 🔴 **Chứng từ là DỮ LIỆU, ⛔ không phải TỆP** | 🔴 |
| 052 | **Chứng từ VÀO ⛔ KHÔNG BAO GIỜ sửa được** | ⚠️ |
| 053 | Thời hạn lưu trữ là dữ liệu chủ · `hold_on_dispute` | ✅ |
| 054 | **Bộ chứng từ có kiểm tra đầy đủ và CHẶN** bước sau | ✅ |
| 055 | **`RESTRICTED` là lớp phân loại RIÊNG** | ⚠️ |
| **056** | **`TenantScope` là lớp NGOÀI CÙNG** | 🔴 |
| **057** | 🔴 **PHÉP CHIẾU TIẾT LỘ** | 🔴 |
| **058** | **4 hình thái triển khai = 4 cấu hình** | 🔴 |
| 059 | **Chấm dứt quan hệ ⛔ KHÔNG kích hoạt tiêu huỷ** | ✅ |
| 060 | 🔴 **Đề nghị đối tác ⛔ KHÔNG BAO GIỜ là bản ghi nghiệp vụ** | ⚠️ |
| 061 | **Trò chuyện gắn vào ĐỐI TƯỢNG và TRƯỜNG** | ⚠️ |

### D · PORTAL ĐỐI TÁC — `DL-062`…`DL-066` *(EDD-03A)*

| Mã | Nội dung | Rút |
|---|---|---|
| **062** | 🔴 **Ba Portal = ba Business Capability độc lập, chung Partner Foundation** | 🔴 |
| 063 | **Che danh tính khách là MẶC ĐỊNH** | ✅ |
| 064 | **Với cổng đối tác, "che" ⛔ không đủ — phải "KHÔNG TỒN TẠI"** | ⚠️ |
| 065 | Nhà thầu thấy KPI **của chính mình**, ⛔ không thấy thứ hạng | ✅ |
| 066 | **Subcontract Portal là hệ TRỌNG YẾU VẬN HÀNH** | ⚠️ |

### E · WORKFLOW · RULE · PERMISSION — `DL-067`…`DL-082` *(EDD-04)*

| Mã | Nội dung | Rút |
|---|---|---|
| 067 | **Guard luôn là `RuleRef`**, ⛔ không phải biểu thức tại chỗ | ⚠️ |
| 068 | Thể hiện **gắn chặt phiên bản** lúc khởi tạo | ⚠️ |
| 069 | **MỘT sổ đăng ký, BẢY bộ đánh giá** quy tắc | ✅ |
| **070** | ⛔ **KHÔNG BAO GIỜ thực thi mã tự do do người dùng nhập** | 🔴 |
| 071 | Phát hiện quy tắc mâu thuẫn **lúc ĐỊNH NGHĨA** | ✅ |
| 072 | **Dữ liệu AI kế thừa mức tiết lộ cao nhất** | ⚠️ |
| 073 | **Neo băm ra NGOÀI CSDL là BẮT BUỘC** | ⚠️ |
| 074 | Thread neo 6 loại đối tượng ⇒ `LEGAL_CONVERSATION` **ngay** | ✅ |
| 075 | **Nhật ký AI lưu THAM CHIẾU + BĂM, ⛔ không lưu nội dung** | ⚠️ |
| 076 | **Kiểm SoD lúc CẤP Role**, ⛔ không phải lúc dùng | ✅ |
| 077 | **Có quyền khẩn cấp, nhưng ỒN ÀO** | ✅ |
| 078 | **Huỷ hiệu lực phiên NGAY** khi phạm vi đổi | ✅ |
| 079 | ⛔ **Không nhét sản xuất vải vào BOM/ProcessRoute** — `D15` DORMANT | ⚠️ |
| 080 | `M69` LanguagePolicy · `M70` DataCategory · `M71` Benchmark | ✅ |
| 081 | Benchmark **tách vật lý** · ngưỡng ≥7 doanh nghiệp | ✅ |
| 082 | **`PARTNER_DATA` là loại dữ liệu thứ năm** | ✅ |

**+ 9 quy tắc chặn cứng SoD:** `SOD-H01`…`SOD-H09` — §7.3

### F · PARTNER RUNTIME · MOBILE — `DL-083`…`DL-112` *(EDD-04A · 04C)*

| Mã | Nội dung | Rút |
|---|---|---|
| **083** | **Danh tính dùng chung, hồ sơ cô lập** | 🔴 |
| 084 | **Luồng LỜI MỜI, ⛔ không phải TÌM KIẾM** — phản hồi đồng nhất | ⚠️ |
| 085 | **MFA bắt buộc** với identity làm cho ≥2 tenant | ✅ |
| 086 | Đo cả 6 chỉ số từ v1, ⛔ không tính tiền | ✅ |
| 087 | **Đo tổng hợp, ⛔ KHÔNG giám sát cá nhân** nhân viên đối tác | ⚠️ |
| **088** | 🔴 **Mobile-first là quyết định TẦNG DỮ LIỆU** | 🔴 |
| 089 | 🔴 **QUAN SÁT ghi ngoại tuyến · CAM KẾT bắt buộc trực tuyến** | ⚠️ |
| 090 | **Xung đột sản lượng giải bằng CHỨNG TỪ ĐIỀU CHỈNH** | ⚠️ |
| 091 | **Băm media tại lúc THU NHẬN** | ⚠️ |
| 092 | **QR/mã vạch chỉ chứa định danh mờ** | ✅ |
| 093 | **PWA**, ⛔ không phải ứng dụng gốc | ✅ |
| 100 | **Ba tầng xác thực** ánh xạ 1-1 với ba mức hệ quả | ⚠️ |
| **101** | 🔴 **Hàng đợi ghi ĐỘC LẬP với phiên đăng nhập** | 🔴 |
| **102** | 🔴 **Liên kết XÁC THỰC, ⛔ không phân quyền** | 🔴 |
| 103 | "One Audit Trail" = một dòng dõi cho **một người trong một tenant** | ⚠️ |
| 104 | Chỉ số thứ bảy: **`AuthMessage`** | ✅ |
| 105 | **Lưu PHÁN QUYẾT VÙNG, ⛔ không lưu toạ độ** | ⚠️ |
| 106 | Tiêu chí Low Training: **≤ 90 giây, ⛔ không hướng dẫn** | ✅ |
| 107 | **Tải lên hai pha** — nén để vận hành, gốc để làm bằng chứng | ⚠️ |
| 108 | Đồng bộ nền **thứ tự theo aggregate, song song giữa aggregate** | ✅ |
| 109 | **Bộ đệm ĐỌC có hạn; hàng đợi GHI vô hạn** | ⚠️ |
| 110 | Cho phép thư viện, **ghi rõ `capture_source` + chênh lệch thời gian** | ✅ |
| 111 | Chỉ số `tap_count_p90` · `prediction_accuracy` | ✅ |
| 112 | **Luật ba chạm áp cho tần suất cao; CAM KẾT giữ ma sát** | ✅ |

### G · CẤU HÌNH · PHIÊN BẢN — `DL-094`…`DL-099` *(EDD-04B)*

| Mã | Nội dung | Rút |
|---|---|---|
| **094** | **Ba tầng cấu hình L1·L2·L3** | 🔴 |
| 095 | **Phát hiện lệch chuẩn** — thấy độ lệch, ⛔ không thấy dữ liệu | ✅ |
| 096 | **Chặn cứng đòi MỘT NGƯỜI THỨ HAI, ⛔ không đòi MỘT CHỨC DANH** | ⚠️ |
| 097 | **Gắn kết cho vòng đời · bản ghi đánh giá cho từng quyết định** | ⚠️ |
| 098 | **Mô phỏng sandbox, ⛔ KHÔNG có đường nối sang áp dụng** | ✅ |
| **099** | 🔴 **AI có 0 quyền — cưỡng chế bằng QUYỀN, ⛔ không bằng prompt** | 🔴 |

### H · TIẾT LỘ · DỮ LIỆU RA — `DL-113`…`DL-137` *(EDD-04D · 04F)*

| Mã | Nội dung | Rút |
|---|---|---|
| 113 | Phân tích tác động trả lời **"AI SẼ THẤY THÊM GÌ"** | ✅ |
| 114 | Cảnh báo nêu **hậu quả nghiệp vụ cụ thể** + gõ xác nhận | ✅ |
| 115 | Mô phỏng cấu hình chạy trên **nhật ký truy cập thật** | ✅ |
| 116 | **Độ trễ 24 giờ** với thay đổi tiết lộ rủi ro cao | ⚠️ |
| **117** | 🔴 **Quay lui khôi phục CẤU HÌNH, ⛔ không khôi phục BÍ MẬT** | 🔴 |
| **118** | **Cơ chế phòng ngừa để lại bằng chứng ĐÃ HIỂN THỊ** | 🔴 |
| 119 | **Chỉ mục tìm kiếm phân vùng theo phân loại** | ⚠️ |
| 120 | **Xuất dữ liệu là HÀNH VI TIẾT LỘ** | ⚠️ |
| 121 | **Nội dung thông báo có `disclosure_class` riêng** | ✅ |
| 122 | **Phản hồi đồng nhất** — kể cả thời gian phản hồi | ⚠️ |
| 123 | Kết quả mô phỏng kế thừa mức tiết lộ cao nhất | ✅ |
| 130 | **MỘT chính sách dữ liệu ra cho SÁU kênh** | ⚠️ |
| 131 | Mã lý do xuất chuẩn hoá | ✅ |
| 132 | **Xoá tệp đã xuất, giữ manifest** | ✅ |
| 133 | **Dữ liệu bảng: bằng chứng ở NHẬT KÝ, ⛔ không ở tệp** | ⚠️ |
| 134 | **Đánh giá quyền xuất trên TỔ HỢP TRƯỜNG** | ⚠️ |
| 135 | Ngưỡng tính trên **tích luỹ trượt 30 ngày** | ✅ |
| 136 | **Đóng dấu chìm TRÊN MÀN HÌNH** cho mọi khung `RESTRICTED` | ✅ |
| 137 | **Gỡ bỏ kiểm soát ⛔ không ngăn được VÀ ⛔ không quy được** | ✅ |

### I · NGUYÊN TẮC · CỔNG KIỂM — `DL-124`…`DL-141` *(EDD-04E · 04G)*

| Mã | Nội dung | Rút |
|---|---|---|
| 124 | 🔴 **`P-ZEROMAN` áp cho SỰ KIỆN, ⛔ KHÔNG cho QUYẾT ĐỊNH** | 🔴 |
| 125 | **Trường tự sự: VOICE là lựa chọn ĐẦU TIÊN** | ✅ |
| 126 | **Giá trị suy ra đi vào TIỀN hoặc CAM KẾT phải có cổng** | ⚠️ |
| 127 | **`data_origin` hạng nhất · `manual_entry_ratio` giám sát** | ✅ |
| 128 | **Báo cáo ngày = tổng hợp TỰ ĐỘNG cần XÁC NHẬN** | ✅ |
| 129 | Đọc mã NCC nếu nhận dạng được; ⛔ không thì in nhãn nội bộ | ✅ |
| **138** | 🔴 **`P-ZERODUP` nói về CÔNG SỨC CON NGƯỜI** | 🔴 |
| 139 | **Nhập trùng là chỉ điểm của 1 trong 4 khuyết tật `A1`…`A4`** | ⚠️ |
| 140 | **Cổng 5 câu, `Q1` trước `Q2`** · duplicate > 0 ⇒ ⛔ không duyệt | ⚠️ |
| 141 | `data_origin` thêm `INHERITED` · `PARTNER_REPORTED` | ✅ |

### J · PRODUCT ARCHITECTURE — `DL-142`…`DL-149` *(EDD-05)*

| Mã | Nội dung | Rút |
|---|---|---|
| 142 | API BI là kênh `E3` trong **một sổ dữ liệu ra duy nhất** | ✅ |
| **143** | 🔴 ⛔ **Cấm sửa bằng mã để bù sai kiến trúc** | 🔴 |
| 144 | **Một engine `WorkItemRule`, bảy cấu hình hiển thị** | ✅ |
| 145 | Ô đếm *"cần chú ý"* trên dashboard ⇒ nguồn `WorkItemRule` | ✅ |
| 146 | **Ô ĐẾM cũng đi qua phép chiếu** — badge cũng là kênh rò | ⚠️ |
| 147 | **Năng lực chung là LỚP NGỮ CẢNH, ⛔ không phải Module** | ⚠️ |
| 148 | **9 Shared Capability là LỚP trong OCT** | ⚠️ |
| 149 | **Mobile-first cho Warehouse · QA · Production** | ✅ |

---
---

# §6 · SỔ ĐĂNG KÝ BOARD DECISION — 29

## 6.1 ⚠️ Giải quyết trùng số hiệu

| Sự việc | Xử lý |
|---|---|
| Board đánh số `BDR-14` *(Audit Log)* · `BDR-15` *(Legal Conversation)* | ✅ **giữ nguyên** — thuộc Board |
| Tôi đã dùng `BDR-14` · `BDR-15` ở EDD-03A | 🔄 **đổi thành `BDR-18` · `BDR-19`** |
| `BDR-18` · `BDR-19` được Board duyệt **hai lần** dưới hai số | ✅ Cùng nội dung, ⛔ không mâu thuẫn |

## 6.2 Toàn bộ 29 quyết định

| # | Nội dung | Kết quả | Nguồn trình |
|---|---|---|---|
| 01 | Mô hình đa thuê bao | ✅ **lược đồ dùng chung · hỗ trợ Single/Multi/Dedicated/Cloud/On-prem** | EDD-02 |
| 02 | Sở hữu IP của `Style` | ✅ **là Master Data, ≥4 giá trị** *(Customer/Monica/Joint/Licensed)* | EDD-02 |
| 03 | Mở sổ chiết tính FOB | ✅ **Customer Portal bắt buộc v1**, ⛔ không DORMANT | EDD-02 |
| 04 | Độ sâu Customer Portal | ✅ **Collaboration: Read·Comment·Chat·Request** · ⛔ không Update/Delete/Approve | EDD-02 |
| 05 | Cơ sở đo lợi nhuận | ✅ **Hai tầng** — Contribution Margin + Full Cost | EDD-02 |
| 06 | Party Model | ✅ **Một Party · một Party Number · một Master Record · Role là thuộc tính** | Board |
| 07 | Material Ownership | ✅ **⛔ không hard-code** — theo Contract/OrderType/Business Rule | Board |
| 08 | Multi-currency | ✅ **CSA tự thiết kế** — 3 tầng TC/FC/GC | Board |
| 09 | QA Evidence | ✅ **chia sẻ theo Permission · ⛔ không sửa/xoá sau xác nhận** | EDD-03 |
| 10 | Ngôn ngữ chứng từ | ✅ **theo hợp đồng** · mặc định VN→vi · quốc tế→en · TQ→zh | EDD-03 |
| 11 | Đối sánh ngành ẩn danh | ✅ **Product Capability chiến lược · thiết kế ngay · TẮT mặc định** | EDD-03 |
| 12 | Minh bạch hiệu suất nhà thầu | ✅ **KPI của chính họ** · ⛔ không thấy nhà máy/PO/khách khác | EDD-03 |
| 13 | Sở hữu dữ liệu | ✅ **tách ≥4 loại**: Customer · Monica · Legal Record · AI Generated | EDD-03 |
| 14 | Audit Log | ✅ **BẤT BIẾN — bằng chứng pháp lý** | Board |
| 15 | Legal Conversation | ✅ **PO·QA·Approval·Change·Commercial ⇒ lưu đầy đủ, ⛔ không sửa** | Board |
| 16 | Notification History | ✅ **lưu toàn bộ** — tra cứu · audit · truy vết · phân tích | Board |
| 17 | AI Decision History | ✅ **Prompt·Context·Recommendation·Approver·Decision** | Board |
| 18 | Nhà thầu đa tenant | ✅ **Một Identity · một Party Number · Tenant Context** | EDD-03A |
| 19 | Chi phí Partner Portal | ✅ **Monica chịu · đo 6 chỉ số** *(+`AuthMessage` = 7)* | EDD-03A |
| 20 | Thẩm quyền cấu hình | ✅ **Ba tầng**: L1 Customer · L2 Partner · L3 Core | EDD-04 |
| 21 | Phân tách nhiệm vụ | ✅ **Hybrid** — cảnh báo + **3 chặn cứng của Board** *(+6 do CSA bổ sung = 9)* | EDD-04 |
| 22 | Nhật ký AI ⟷ dữ liệu mật | ✅ **lớp độc lập · ⛔ không lưu dữ liệu mật** | EDD-04 |
| 23 | Tài khoản đối tác | ✅ **One Person·One Identity·One Audit Trail · OTP ưu tiên · hỗ trợ SSO** | EDD-04A |
| 24 | GPS trong bằng chứng | ✅ **chỉ Evidence, ⛔ không Tracking · mặc định TẮT** | EDD-04A |
| 25 | Trách nhiệm cấu hình L2 | ✅ **Tenant chịu, Monica ONE cung cấp đủ 8 cơ chế phòng ngừa** | EDD-04B |
| 26 | Xuất dữ liệu `RESTRICTED` | ✅ **cho phép có kiểm soát** — 8 cơ chế · vai ⛔ không quyền: **chặn hoàn toàn** | EDD-04D |
| 27 | API cho công cụ BI | ✅ **mở, đọc từ Projection · cùng Egress Audit Log** | EDD-04F |
| 28 | Thiết bị nội bộ tại xưởng | 🟡 **CSA tự quyết** — mobile-first cho Warehouse·QA·Production | EDD-05 |
| 29 | Tenant tự dựng dashboard | 🟡 **CSA tự quyết** — ⛔ không; dùng API BI | EDD-05 |

🔴 **`BDR-28` · `BDR-29` Board có thể phủ quyết ở EDD-06.**

---
---

# §7 · SỔ ĐĂNG KÝ QUY TẮC VÀ CƠ CHẾ

## 7.1 Bốn kênh dữ liệu ra và sáu kênh tiết lộ

```
E1 Xuất tệp  ·  E2 Báo cáo email  ·  E3 API/BI  ·  E4 In ấn
E5 Chụp màn hình (⛔ không ngăn được → dấu chìm)  ·  E6 Sao chép-dán
🔴 MỘT chính sách, MỘT nhật ký, MỘT ngưỡng tích luỹ — DL-130 · DL-142
```

## 7.2 Sáu lớp phân loại tiết lộ

`PUBLIC_TO_PARTIES` · `INTERNAL_ONLY` · `CUSTOMER_SCOPED` · `SUBCON_SCOPED` · `SUPPLIER_SCOPED` · 🔴 `RESTRICTED`

## 7.3 Chín quy tắc chặn cứng SoD

| Mã | Chặn cứng | Nguồn |
|---|---|---|
| `SOD-H01` | Người **tạo/trình** ⟷ người **duyệt** | Board |
| `SOD-H02` | Người **kiểm** lô ⟷ người **kết luận** lô | Board |
| `SOD-H03` | Người **đề xuất** điều chỉnh tồn ⟷ người **duyệt** | Board |
| `SOD-H04` | Đề xuất **huỷ/phế liệu** ⟷ duyệt ⟷ tiêu huỷ | CSA |
| `SOD-H05` | Sửa **TK ngân hàng NCC** ⟷ duyệt thanh toán | CSA |
| `SOD-H06` | Tạo **NCC mới** ⟷ duyệt PO đầu tiên | CSA |
| `SOD-H07` | Ghi **sản lượng** ⟷ duyệt **lương sản phẩm** | CSA |
| `SOD-H08` | Cấp **NPL cho nhà thầu** ⟷ chấp nhận **đối soát hao hụt** | CSA |
| `SOD-H09` | Phụ trách **công nợ** ⟷ duyệt **khấu trừ/xoá nợ** | CSA |

🔴 **Tiêu chí:** chặn cứng khi **hành vi và việc che giấu xảy ra trong cùng một giao dịch**.
🔴 **Chặn cứng đòi MỘT NGƯỜI THỨ HAI, ⛔ không đòi MỘT CHỨC DANH** — `CompensatingApprover` *(`DL-096`)*.

## 7.4 Sáu chiều phạm vi phân quyền

`TenantScope` *(ngoài cùng)* · `OrgScope` · `FactoryScope` · `WarehouseScope` · `PartyScope` · `AssignmentScope`

```
Được truy cập = Capability ∩ DataCategory ∩ Disclosure ∩ Scope(6) ∩ StateGuard ∩ SoD
```

## 7.5 Năm loại dữ liệu *(`BDR-13`)*

`CUSTOMER_DATA` · `PARTNER_DATA` · `MONICA_DATA` · `LEGAL_RECORD` · `AI_GENERATED`
Mỗi loại có: Owner · Permission · Retention · Audit · Backup.

## 7.6 Bốn nguyên mẫu Workflow

`LIFECYCLE` *(máy trạng thái)* · `APPROVAL` *(định tuyến người)* · `ORCHESTRATION` *(chuỗi dài)* · `CASE` *(⛔ không có đường đi định trước)*

## 7.7 Bảy loại quy tắc

`R1` Dẫn xuất · `R2` Kiểm tra · `R3` Cổng · `R4` Định tuyến · `R5` Tín hiệu · `R6` Tính toán · `R7` Phân quyền

## 7.8 Năm tín hiệu rủi ro bằng luật *(`DL-043`)*

Nguy cơ trễ tàu *(sớm 2–4 tuần)* · **Nguy cơ LỖ** · Vượt chi phí NPL · Nguy cơ chuyền đứng · Khách rủi ro thanh toán

---
---

# §8 · SỔ ĐĂNG KÝ KHUYẾT TẬT ĐÃ BIẾT

> 🔴 **Đọc mục này trước khi viết mã.** Đây là những chỗ đã biết là sai và **chưa sửa**.

| Mã | Khuyết tật | Bằng chứng | Trạng thái |
|---|---|---|---|
| `KD-1` | **Hai `ADR-001` khác nhau** — `architecture/adr/` và `assignment/` | `ls` | ⏳ chờ gộp kho ADR |
| `KD-2` | ~~8 bảng MD ⛔ không có policy thu hẹp~~ | `VR-001` + `042` | ✅ **ĐÓNG 05/08** — `042` đã chạy, `authenticated_only` **22 → 0**. Còn **6 bảng** giữ `DELETE` là ngoại lệ có chủ ý `TD-25` ⇒ `TC-1` |
| `KD-3` | ~~`po-twin.service.ts:132` hằng số `0` cho `late_milestones`~~ | đo mã | ✅ **ĐÓNG 05/08** — Sprint I-2 Phase 1. Luật đếm dời sang `milestone-lateness.calculator.ts`, **hai màn hình gọi cùng một hàm** |
| `KD-4` | **`md-client.tsx` 886/900 dòng** — 14 dòng nữa gãy arch test | đo mã | ⏳ **Phase 2** |
| `KD-5` | **`md-legacy-client.tsx` 437 dòng mã chết** — nơi **DUY NHẤT** gọi `garment-math` | 0 tệp import | ⚠️ nối lại trước khi xoá |
| `KD-6` | **`/subcon` phục vụ 7 vai trò** gồm cả nhà thầu ngoài | `rbac.ts` | ⏳ |
| `KD-7` | **`CLAUDE.md` §6 ghi "12 phân hệ"** — thực tế 16, đích 19 | `home-modules.ts:135` | ⏳ |
| `KD-8` | **`CLAUDE.md` §6 ghi bottom nav 4 nút** — Hiến pháp §15 khai **5** | Hiến pháp | ⏳ |
| `KD-9` | **8 bộ từ vựng trạng thái ⛔ không có luật chuyển** *(trừ `assignment.ts`)* | TD-03 | 🟠 **ĐO ĐƯỢC 05/08** — `arch.test.mjs` ⑫ nay canh **36 bộ**; **7 chỗ lệch thật** ghi ở `vocabulary-baseline.json`. *Luật chuyển* vẫn chưa có ⇒ còn mở |
| `KD-10` | 🔴 **Vòng khoá SECURITY FREEZE** — `031d`–`031g` chặn nhau | `MIGRATION_INDEX` §5 | ⏳ chờ Board cắt |
| `KD-11` | ~~MD ⛔ không có một bài kiểm nghiệp vụ nào~~ — 19.058 dòng | `find tests` | 🟠 **MỞ HẠNG MỤC 05/08** — `tests/business/md-formulas.test.mjs`, **59 đạt · 0 hỏng**. Phủ **công thức**; ⛔ chưa phủ Warehouse và luồng nghiệp vụ ⇒ Phase 2 |
| `KD-12` | **`SOD-06`** GĐSX duyệt cả giá bán lẫn giá mua | `BDR-21` | ⚠️ mức cảnh báo |
| `KD-13` | 🔴 **Kiến trúc ⛔ KHÔNG phủ dệt–may tích hợp dọc** | EDD-04 §11.3 | ✅ **giới hạn có tên** — `DL-079` |

---
---

# §9 · MỤC CÒN MỞ

| # | Nội dung | Chặn gì | Ai xử |
|---|---|---|---|
| 1 | ~~`VR-001` — truy vấn `pg_policies`~~ | ✅ **XONG 04/08** — [`VR-001-KET-QUA.md`](audit/VR-001-KET-QUA.md). Khép Cổng B `B1` | — |
| 1′ | 🔴 **Phán quyết ADR-018 · 019 · 020** — 5 migration đang chạy dưới ADR chưa duyệt | 🔴 **chặn Cổng C**, ⛔ **không** chặn Sprint I-2 *(Board 05/08)* | **Board** |
| 1″ | 🔴 **Cắt hoặc gia hạn SECURITY FREEZE** bằng văn bản — Cổng B `B2` | 🔴 chặn mở Domain/Module mới | **Board** |
| 1‴ | 🔴 **Phản biện độc lập ADR-020** — ADR duy nhất ⛔ không có hồ sơ nào | 🔴 chặn Sprint I-4 | ChatGPT |
| 2 | `OQ-A` khấu trừ có tồn tại ⛔ không | dữ liệu chủ | Board |
| 3 | `OQ-B` điều kiện thanh toán thực dùng | dữ liệu chủ | Board |
| 4 | `OQ-C` công nợ nhà thầu tính theo gì | dữ liệu chủ | Board |
| 5 | `OQ-D` MISA bản nào *(desktop/AMIS)* | tích hợp | Board |
| 6 | `OQ-E` NCC kiêm nhà thầu | ưu tiên `Party` | Board |
| 7 | Ngưỡng cụ thể *(giá trị duyệt · % NPL · SLA)* | cấu hình L1 | lúc triển khai |
| 8 | Chỉ định người thứ hai cho `SOD-H04`·`H05`·`H06` | vận hành | Joseph |
| 9 | Thời hạn phản biện tối đa | ADR-011 §4.2 | Board |

🔴 **⛔ Không mục nào chặn Architecture Freeze.**

> 🔑 **Board Decision 05/08/2026 — Foundation tách làm hai.**
> **Technical Foundation ✅ COMPLETE** *(0 Technical Blocker —
> [`TFC-001`](audit/TECHNICAL_FOUNDATION_CERTIFICATE.md) **R1**)* ·
> **Governance 🟠 PENDING** *(**26** mục —
> [`GPR-001`](audit/GOVERNANCE_PENDING_REPORT.md) **R1**)*.
> **⛔ Tài liệu · ADR · certificate chưa xong ⛔ KHÔNG chặn Sprint.** Chỉ
> **Technical Blocker** mới chặn. Sổ đầy đủ ở `GPR-001` §6.
>
> 🔒 **Sprint I-2 Phase 1 ĐÃ KHOÁ 05/08/2026** — commit `6ee3dd24` · `19ca85be`.
> **Phase 2 ⏳ chờ Board mở**:
> [kế hoạch](planning/SPRINT_I2_PHASE2_PLAN.md) ·
> [backlog](planning/SPRINT_I2_PHASE2_BACKLOG.md).
>
> ✅ **`A-6` ĐÃ TRẢ 05/08/2026 — Board chốt cách hiểu `A`.** Một *"phép kiểm
> mới"* hoàn thành khi ① **đã xây dựng** ② **chạy được** ③ **PASS theo tiêu chí
> Sprint**. ⛔ **Không** đòi xử xong Technical Debt / Governance cùng lúc — sổ
> nợ **có tên, có chủ, có hạn** ⛔ không làm phép kiểm mất tư cách hoàn thành.
> Ghi ở [Baseline §0.6](ARCHITECTURE_BASELINE.md).
>
> ✅ **`CI-1` ĐÃ TRẢ 05/08/2026 — độ phủ CI `5/10` → `9/10`.** Trước đó **188
> phép đo bảo mật** của Sprint I-1 **chưa từng chạy tự động**, và **CI xanh ⛔
> KHÔNG chứng minh `npm test` xanh**. `md-internal-scope` **cố ý chưa vào CI** —
> nó đang đỏ 6 mục `TC-1`; vào CI cùng lượt với việc trả `TC-1` *(Board Decision,
> phương án B)*.
>
> 🔴 **Technical Condition: 3 → 5.** `TC-4` *(`orders.status` ⛔ không ràng buộc
> `CHECK`)* và `TC-5` *(mã ⛔ không biểu diễn nổi lô đã huỷ)* là chỗ lệch **có
> sẵn** từ `002` và `024` — phép kiểm ⑫ chỉ làm chúng **nhìn thấy được**.

---
---

# §10 · LỘ TRÌNH NHẬP MÔN

## 10.1 Người mới — 5 tài liệu, ~3 giờ

| # | Đọc | Thời gian | Để hiểu |
|---|---|---|---|
| 1 | **PROJECT_MEMORY** *(tài liệu này)* §1–§4 | 20′ | Bản đồ tổng thể |
| 2 | [`CLAUDE.md`](../CLAUDE.md) | 20′ | Quy ước làm việc · bẫy đã tốn giá |
| 3 | [EDD-01](enterprise-design/EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) | 60′ | Monica là doanh nghiệp thế nào · 14 Domain |
| 4 | §3 tài liệu này + [EDD-04G](enterprise-design/EDD-04G-ZERO-DUPLICATE-AND-DESIGN-GATE.md) | 30′ | **5 nguyên tắc + cổng kiểm 6 câu** |
| 5 | §8 tài liệu này | 15′ | Khuyết tật đã biết — ⛔ **đừng lặp lại** |

## 10.2 Trước khi thiết kế một màn hình

```
① §3.1  chạy đủ 6 câu Screen Design Gate
② §4    xác định Domain sở hữu · ai được O/W/R/F/D
③ §7.2  xác định lớp tiết lộ của mọi trường
④ §5    tra Decision Log xem đã có quyết định liên quan chưa
⑤ EDD-05 §3  áp khuôn Object Control Tower nếu là màn hình chi tiết
```

## 10.3 Trước khi viết mã

```
① §8    đọc khuyết tật đã biết
② CLAUDE.md §2.1  ba tầng phòng thủ · §2.5 nguyên tắc dữ liệu
③ §5.1  kiểm 19 quyết định chịu lực — mã của bạn có phá cái nào ⛔ không
④ 🔴 DL-143  ⛔ CẤM sửa bằng mã để bù sai kiến trúc
```

## 10.4 Khi mâu thuẫn

```
① §1     tra thứ bậc — bậc trên thắng
② Nghiệp vụ ⟷ Hiến pháp mâu thuẫn thật ⇒ 🔴 DỪNG, ghi NEEDS_CLARIFICATION
③ Project Memory ⟷ tài liệu gốc mâu thuẫn ⇒ TÀI LIỆU GỐC THẮNG, sửa §này
```

---
---

# §11 · QUY TẮC BẢO TRÌ PROJECT MEMORY

| # | Quy tắc |
|---|---|
| `PM-1` | 🔴 **⛔ KHÔNG tạo tri thức mới ở đây.** Quyết định mới ghi ở EDD hoặc ADR, rồi **lập chỉ mục** về đây |
| `PM-2` | **Cập nhật sau mỗi Sprint được Board phê duyệt** — ⛔ không cập nhật theo bản nháp |
| `PM-3` | **Mọi mục có liên kết về nguồn.** Mục ⛔ không có nguồn là mục phải xoá |
| `PM-4` | 🔴 **Mâu thuẫn với nguồn ⇒ sửa Project Memory**, ⛔ không sửa nguồn |
| `PM-5` | **Tài liệu bị thay thế ⛔ không xoá** — chuyển §2.2, ghi rõ bị thay bởi gì *(Hiến pháp §43.7)* |
| `PM-6` | **Số hiệu ⛔ không tái sử dụng** — `DL` · `BDR` · `ADR` · `TD` chỉ tăng |
| `PM-7` | **Khuyết tật đã sửa chuyển từ §8 sang mục lịch sử**, ⛔ không xoá |

## 11.1 Nhật ký phiên bản

| Ngày | Phiên bản | Thay đổi |
|---|---|---|
| 2026-08-04 | 1.0 | Lập lần đầu — chỉ mục 13 EDD · 149 DL · 29 BDR · 11 ADR · 13 khuyết tật |
| **2026-08-05** | **1.1** | **Đồng bộ với nguồn theo `PM-4`** — khép `B-1` của [`GPR-001`](audit/GOVERNANCE_PENDING_REPORT.md) §2. ① §2.3 `11 bản` → **18 tài liệu · 17 số hiệu**, bổ sung ADR-018·019·020 kèm cảnh báo 5 migration chạy dưới ADR chưa duyệt. ② §8 đóng `KD-2` *(042 đã chạy)* và `KD-3` *(TD-17 đã vá)*; hạ mức `KD-9` · `KD-11`. ③ §9 gỡ `VR-001` *(đã chạy 04/08 — mâu thuẫn với Baseline `B1` ✅ đã tồn tại từ 04/08)*, thêm 3 mục Board. ④ §12 số liệu khớp lại Baseline. ⑤ Ghi nhận **Board Decision 05/08 tách Foundation** và **Sprint I-2 Phase 1**. |

---

# §12 · THỐNG KÊ

| Chỉ số | Số |
|---|---|
| **Tài liệu Enterprise Design** | **14** *(khớp Baseline §6)* |
| **ADR** | **18 tài liệu · 17 số hiệu** — `012`–`014` đặt chỗ · `001` trùng ⇒ `B3` |
| **Quyết định kiến trúc `DL`** | **149** |
| — trong đó **chịu lực** 🔴 | **19** |
| **Board Decision `BDR`** | **29** *(27 Board quyết · 2 CSA tự quyết)* |
| **Nguyên tắc thiết kế doanh nghiệp** | **5** |
| **Business Domain** | **14** *(+ 4 DORMANT)* |
| **Shared Kernel** | **9** |
| **Object Control Tower** | **9** |
| **Business Object** | **~88** |
| **Master Data** | **~65** |
| **Loại chứng từ** | **76** |
| **Business Capability L2** | **93** |
| **Module / Capability** | **78** |
| **Màn hình** | **~226** *(196 nội bộ + 30 cổng đối tác — khớp Baseline §2.2)* |
| **Quy tắc chặn cứng SoD** | **9** |
| **Khuyết tật đã biết chưa sửa** | **11** *(13 − `KD-2` − `KD-3` đã đóng 05/08)* |
| **Mục còn mở** | **11** *(⛔ 0 chặn Freeze · ⛔ 0 chặn Sprint I-2)* |
| **Khoản nợ quản trị** | **28** — [`GPR-001`](audit/GOVERNANCE_PENDING_REPORT.md) R1 *(4 đã trả · 3 mới)* |
| **Độ phủ CI** | **9/10** bài kiểm *(`md-internal-scope` chờ `TC-1`)* |
| **Technical Condition** | **5** — `TC-1`…`TC-5`; 3 chặn **Cổng C** |
| **Phép đo tĩnh** *(⛔ không cần CSDL)* | **206** — 61 kiến trúc + 59 nghiệp vụ MD + 86 nghiệp vụ Kho |

---

## THAM CHIẾU GỐC

- [`architecture/00-CONSTITUTION.md`](architecture/00-CONSTITUTION.md) — Hiến pháp v1.5 · 45 Điều
- [`adr/`](adr/) — 11 ADR · [`adr/ADR-010`](adr/ADR-010-thu-bac-van-ban-chuan-tac.md) thứ bậc · [`adr/ADR-011`](adr/ADR-011-tham-quyen-kien-truc.md) thẩm quyền
- [`business/BUSINESS_KNOWLEDGE_BASE.md`](business/BUSINESS_KNOWLEDGE_BASE.md) — 60 quy tắc nghiệp vụ
- [`enterprise-design/`](enterprise-design/) — 13 tài liệu EDD
- [`../CLAUDE.md`](../CLAUDE.md) — quy ước làm việc với kho mã
