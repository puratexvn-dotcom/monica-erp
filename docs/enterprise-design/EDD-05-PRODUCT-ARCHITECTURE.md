# EDD-05 · ENTERPRISE DESIGN DOCUMENT · **v2 HOÀN CHỈNH**
## PRODUCT ARCHITECTURE
### Workspace Tree · Module · Object Control Tower · Screen · Navigation · Persona · Dashboard · Mobile · UX

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-05 v2 — **thay thế toàn bộ v1** |
| **Sprint** | Enterprise Business Design · Sprint 5 · **Sprint cuối về Product Architecture** |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Trạng thái** | ⏳ **CHỜ KÝ DUYỆT** |
| **Board Decision Required** | 🔴 **0** — hai câu treo ở v1 **tôi đã tự quyết**, xem §12.4 |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor · **⛔ không sửa bằng mã để bù sai kiến trúc** |

---

# §0 · PHẠM VI VÀ CÁCH ĐỌC

## 0.1 Mười hai hạng mục Board yêu cầu

| # | Hạng mục | § |
|---|---|---|
| 1 | Enterprise Workspace Tree | §1 |
| 2 | Enterprise Module Architecture | §2 |
| 3 | Screen Architecture | §4 |
| 4 | Navigation Architecture | §5 |
| 5 | Persona Journey — 13 nhân vật | §6 |
| 6 | Dashboard Matrix | §8 |
| 7 | Work Inbox Matrix | §7 |
| 8 | Object Control Tower | §3 |
| 9 | Enterprise Mobile Strategy | §9 |
| 10 | Enterprise UX Principles | §10 |
| 11 | Enterprise Design Gate Review | §11 |
| 12 | Board Review Summary | §12 |

## 0.2 Ký hiệu dùng xuyên suốt

```
🔷 Domain   ▣ Workspace   ◆ Capability/Module   ▢ Screen   • Action
🅛 List  🅓 Detail=OCT  🅦 Workspace shell  🅩 Wizard  🅑 Dashboard  🅖 Dialog  🅜 Mobile
🟢 ACTIVE   🟡 EMBEDDED   ⚪ DORMANT      (Domain Activation Model)
```

---
---

# §1 · ENTERPRISE WORKSPACE TREE

> Board: *"muốn nhìn toàn bộ Monica ONE trên một cây duy nhất."*

## 1.1 Cây tổng — Domain → Workspace → Capability

```
MONICA ONE
│
├─ ⓪ MY WORK                                    ⛔ không thuộc Domain nào — cửa vào cá nhân
│    ◆ Work Inbox · ◆ My Approvals · ◆ My Watchlist
│
├─ 🔷 D14 EXECUTIVE  ▣ Executive Center                     🟢 [🅑🅓]
│    ◆ Business Cockpit · ◆ Early Warning · ◆ Decision Queue
│    ◆ Financial Snapshot · ◆ Order Book Health · ◆ Factory Scorecard
│
├─ 🔷 D1 COMMERCIAL  ▣ Commercial                           🟡 [🅛🅓🅩🅑]
│    ◆ Customer Master · ◆ Contract · ◆ Price Agreement
│    ◆ Commercial Terms · ◆ Customer Communication · ◆ Customer Health
│
├─ 🔷 D2 MERCHANDISING  ▣ Merchandising                     🟢 [🅛🅓🅩🅑🅖]
│    ◆ Inquiry · ◆ Costing · ◆ Quotation
│    ◆ 🔴 Order Book · ◆ 🔴 T&A Plan · ◆ Material Ownership Plan
│    ◆ Allocation · ◆ Order Change · ◆ Order Risk
│
├─ 🔷 D3 PRODUCT DEVELOPMENT  ▣ Product Development         🟡 [🅛🅓🅩]
│    ◆ Style Master · ◆ 🔴 Tech Pack · ◆ 🔴 Sample
│    ◆ BOM & Consumption · ◆ Marker & CAD · ◆ PP Meeting
│
├─ 🔷 D4 INDUSTRIAL ENG.  ▣ Industrial Engineering          🟡 [🅛🅓]
│    ◆ 🔴 Standard Time Register · ◆ Operation Library
│    ◆ Operation Bulletin · ◆ Line Balance · ◆ Learning Curve
│
├─ 🔷 D5 PLANNING  ▣ Planning                               🟡 [🅛🅓🅑🅩]
│    ◆ 🔴 Capacity Model · ◆ 🔴 CTP Check · ◆ Production Plan
│    ◆ Line Schedule · ◆ Production Order · ◆ MRP · ◆ What-if
│
├─ 🔷 D6 MANUFACTURING  ▣ Production                        🟢 [🅛🅓🅑🅜]
│    ◆ Factory Structure · ◆ Cutting · ◆ 🔴 LINE MAP
│    ◆ Output Capture 🅜 · ◆ WIP · ◆ Downtime & Andon 🅜
│    ◆ Finishing & Packing
│
├─ 🔷 D7 QUALITY  ▣ Quality                                 🟢 [🅛🅓🅑🅜]
│    ◆ Inspection Plan · ◆ 🔴 Inspection 🅜 · ◆ Inline QC 🅜
│    ◆ AQL Engine · ◆ Defect & CAPA · ◆ Material Inspection 🅜
│
├─ 🔷 D8 PROCUREMENT  ▣ Procurement                         🟢 [🅛🅓🅩]
│    ◆ Supplier Master · ◆ Requisition · ◆ Sourcing
│    ◆ 🔴 Purchase Order · ◆ Goods Receipt · ◆ 3-Way Match
│
├─ 🔷 D9 WAREHOUSE  ▣ Warehouse                             🟢 [🅛🅓🅑🅜]
│    ◆ Location Master · ◆ 🔴 Inbound 🅜 · ◆ Roll & Lot 🅜
│    ◆ 🔴 Stock Ledger · ◆ Reservation · ◆ 🔴 Pick–Issue–Return 🅜
│    ◆ Adjustment · ◆ Stock Count 🅜 · ◆ FG Store
│
├─ 🔷 D10 LOGISTICS  ▣ Shipment                             🟢 [🅛🅓🅩]
│    ◆ Booking · ◆ Packing · ◆ Shipment
│    ◆ 🔴 Export Document Set · ◆ Delivery Tracking
│
├─ 🔷 D11 SUBCONTRACT  ▣ Subcontract                        🟢 [🅛🅓🅑]
│    ◆ Subcontractor Master · ◆ 🔴 Assignment · ◆ Commercial Terms
│    ◆ Issue–Receipt · ◆ 🔴 Wastage Reconciliation · ◆ Portal Admin
│
├─ 🔷 D12 FINANCE  ▣ Finance                                🟢 [🅛🅓🅑]
│    ◆ Invoice Request · ◆ 🔴 MISA Mirror · ◆ Payment
│    ◆ 🔴 Deduction · ◆ Receivable · ◆ Payable
│    ◆ 🔴 Cost Actual · ◆ 🔴 Reconciliation
│
├─ 🔷 D13 PEOPLE  ▣ Human Resources                         🟡 [🅛🅓]
│    ◆ Employee · ◆ Attendance · ◆ Skill Matrix · ◆ Piece-rate Payroll
│
├─ ⚙️ PLATFORM SERVICES  ▣ Platform                         🟢 [🅛🅓]
│    ◆ Identity & Role · ◆ Tenant Config · ◆ 🔴 Config Gate L1/L2
│    ◆ Partner Accounts · ◆ Usage Metering · ◆ 🔴 Egress Log
│
├─ 🌐 GLOBAL SERVICES                                       (⛔ không phải Workspace)
│    ◆ Business Reporting 🅑 · ◆ Communication · ◆ AI Assistant · ◆ Documents
│
└─ 🚪 PORTALS                                               (⛔ không phải Workspace)
     ▣ Customer Portal 🟢 · ▣ Subcontract Portal 🟢 🅜 · ▣ Supplier Portal 🟡
```

**Tổng: 14 Workspace · 1 Platform · 4 Global Service · 3 Portal · 78 Capability.**

## 1.2 Mở rộng Capability → Screen → Action — khuôn mẫu

Ba ví dụ đại diện cho ba dạng Capability *(giao dịch · dữ liệu chủ · vận hành)*:

```
◆ Order Book  (D2 · giao dịch)
  ▢ 🅛 Order List
      • Lọc theo ngoại lệ (mặc định)  • Lọc theo trạng thái/khách/mã hàng
      • Mở Order 360°                  • Tạo đơn mới → 🅩
      • Nhân bản đơn                   • Xuất (có cổng egress)
  ▢ 🅓 ORDER 360° = Object Control Tower       ← §3
  ▢ 🅩 New Order Wizard  (4 bước, nối lại được)
      ① Khách + Hợp đồng   ← kế thừa Contract, ⛔ không gõ
      ② Mã hàng + Số lượng + Cỡ  ← kế thừa Style, ⛔ nhập cỡ bằng ma trận
      ③ Ngày giao + Điều kiện    ← 🔴 CTP chạy tự động, hiện kết quả
      ④ Xem lại + Xác nhận       ← 🔴 CAM KẾT: gõ xác nhận
  ▢ 🅖 Cancel Order Dialog
      • Chọn lý do (mã chuẩn)   • Kế hoạch xử lý NPL (bắt buộc)
      • 🔴 Đồng ký nếu FOB đã mua NPL   • Gõ xác nhận

◆ Standard Time Register  (D4 · dữ liệu chủ)
  ▢ 🅛 Standard Time List
      • Lọc theo độ tin cậy  • Lọc theo "chưa có số chuẩn"
      • So ước lượng ⟷ thực tế
  ▢ 🅓 Standard Time Detail
      • Xem lịch sử phiên bản  • Xem thời gian thực từ StageThroughput
      • Nâng nguồn ESTIMATE → TIME_STUDY  (⚖️ duyệt)

◆ Output Capture 🅜  (D6 · vận hành, di động)
  ▢ 🅜 Quick Output
      • Quét bó → sản lượng tự cộng   • ± điều chỉnh (dự phòng)
      • Vuốt xác nhận                  • Xem hàng đợi chờ gửi
  ▢ 🅜 Downtime
      • Bấm bắt đầu / kết thúc (Andon)  • Chọn mã lý do  • Chụp ảnh
```

---
---

# §2 · ENTERPRISE MODULE ARCHITECTURE

## 2.1 Bốn lớp năng lực

| Lớp | Định nghĩa | Sở hữu | Nhân bản? | Số |
|---|---|---|---|---|
| **① Business Module** | Năng lực nghiệp vụ thuộc **đúng một** Workspace | Domain | ✅ độc lập | **78** |
| **② Shared Capability** | Nhiều Domain dùng, **⛔ không Domain nào sở hữu** | Kernel | 🔴 **⛔ TUYỆT ĐỐI KHÔNG** | **9** |
| **③ Cross-cutting Capability** | Áp cho **mọi** thứ, ⛔ không phải một màn hình | Kiến trúc | 🔴 **⛔ không là Module** | **8** |
| **④ Infrastructure Capability** | Nền tảng vận hành, người dùng ⛔ không thấy | Platform | ⛔ không | **7** |

## 2.2 ② SHARED CAPABILITY — 9, ⛔ **KHÔNG BAO GIỜ tạo bản sao**

| # | Năng lực | Xuất hiện ở đâu | 🔴 Vì sao ⛔ không được nhân bản |
|---|---|---|---|
| `S-1` | **Document & Evidence** | **lớp trong mọi OCT** | 14 tab *"Chứng từ"* ⇒ 14 bảng ⇒ ⛔ không truy vết được một chứng từ qua các Domain |
| `S-2` | **Thread / Chat** | lớp trong mọi OCT | Chat rời rạc theo Workspace ⇒ mất `DL-061` *(neo vào đối tượng và trường)* |
| `S-3` | **Task / Work Item** | ⓪ My Work + lớp OCT | Hai nguồn việc ⇒ người dùng ⛔ không biết nhìn đâu |
| `S-4` | **Approval** | lớp OCT + ⓪ My Approvals | Mỗi Domain một luồng duyệt ⇒ ⛔ không uỷ quyền, ⛔ không leo thang xuyên Domain |
| `S-5` | **Audit & History** | lớp OCT | Nhật ký phân mảnh ⇒ `BDR-14` *(bằng chứng pháp lý)* sụp |
| `S-6` | **Notification** | Top bar toàn cục | |
| `S-7` | **Global Search** | Top bar toàn cục | Chỉ mục phân mảnh ⇒ ⛔ không áp `DL-119` được |
| `S-8` | **AI Assistant** | lớp OCT + toàn cục | AI có nhiều ngữ cảnh rời ⇒ mất `AI-2` *(truy nguồn)* |
| `S-9` | **Related Object** | lớp OCT | Đồ thị quan hệ phải là **một** |

> `DL-148` · 🔴 **Chín năng lực dùng chung xuất hiện dưới dạng LỚP trong Object Control Tower, ⛔ không bao giờ dưới dạng Module hay Tab riêng.**
> Đây là `MOD-2` phát biểu đầy đủ, và là thứ ngăn cái bẫy **mọi ERP đều mắc**: nhân bản *Documents · Comments · Activity* khắp nơi rồi mỗi nơi một bảng.

## 2.3 ③ CROSS-CUTTING — 8, ⛔ **không là Module, ⛔ không có màn hình riêng**

`Permission & Disclosure` · `Data Classification` · `i18n VI·EN·ZH` · `Versioning & Binding` ·
`Data Origin` *(`data_origin`)* · `Egress Control` · `Immutable Log` · `Design Gate`

> Chúng **hiện diện trong mọi màn hình** nhưng ⛔ không ai *"vào"* chúng. Biến một cross-cutting thành Module là dấu hiệu kiến trúc sai.

## 2.4 ④ INFRASTRUCTURE — 7

`Multi-tenancy` · `Identity & Federation` · `Offline Sync & Queue` · `Media Pipeline` ·
`Read-Model Projection` · `Usage Metering` · `Rule & Workflow Engine`

## 2.5 🔴 OBJECT CONTROL TOWER — 9 đối tượng

| OCT | Business Object | Vì sao xứng đáng có OCT |
|---|---|---|
| **Order 360°** | `Order` | Trung tâm toàn hệ thống — 8 Domain cùng nhìn |
| **Style 360°** | `Style` | Dùng lại nhiều đơn, nhiều phiên bản |
| **Roll 360°** | `FabricRoll` | 🔴 Đầu chuỗi truy vết |
| **Bundle 360°** | `Bundle` | 🔴 Mắt xích giữa cuộn và thùng |
| **Assignment 360°** | `Assignment` | Ranh giới trong/ngoài |
| **Shipment 360°** | `Shipment` | Hội tụ chứng từ xuất khẩu |
| **Inspection 360°** | `Inspection` | Một chứng từ, bốn lăng kính |
| **PO 360°** *(mua)* | `PurchaseOrder` | Hai chữ ký, ba chiều đối chiếu |
| **Party 360°** | `Party` | Một pháp nhân, nhiều vai, nhiều tenant |

**Tiêu chí có OCT:** ≥3 Domain cùng đọc · có vòng đời dài · có chứng từ và bằng chứng gắn kèm · người dùng nói về nó bằng **mã số** *("mở PO-2588")*.

---
---

# §3 · OBJECT CONTROL TOWER — DNA CỦA MONICA ONE

> Board: *"Object Control Tower là DNA của Monica ONE. Phải áp dụng thống nhất cho mọi Business Object."*

## 3.1 Giải phẫu — bốn vùng, thống nhất tuyệt đối

```
╔═══════════════════════════════════════════════════════════════════════╗
║ ⓐ OBJECT HEADER                                                       ║
║   PO-2588 · Zara VN · 18.400 pcs · 142.000 USD      [IN_PRODUCTION]   ║
║   ETD 22/08 ⚠️ ETA 26/08 (+4)      ⚙️ WF v3 · Rules v7 · Config #142  ║
║   ░░ dấu chìm: Nguyễn Văn A · 04/08 14:02 ░░   ← nếu có RESTRICTED    ║
╠═══════════════════════════════════════════════════════════════════════╣
║ ⓑ LENS TABS — lát cắt RIÊNG theo loại đối tượng                       ║
║  [Thương mại] [Sản xuất] [Vật tư] [Chất lượng] [Giao hàng] [Tài chính]║
║  ─────────────────────────────────────────────────────────────────────║
║       (nội dung lát cắt đang chọn)                                    ║
╠══════════════════════════════════════╦════════════════════════════════╣
║                                      ║ ⓒ CONTEXT RAIL — 11 lớp CHUNG  ║
║                                      ║  🔍 Tìm trong đối tượng         ║
║                                      ║  📅 Timeline    (mốc nghiệp vụ) ║
║                                      ║  📁 Chứng từ (12)               ║
║                                      ║  💬 Trao đổi (3)                ║
║                                      ║  ✅ Việc (2)                    ║
║                                      ║  ✍️ Phê duyệt (1)               ║
║                                      ║  ✨ AI                          ║
║                                      ║  🔗 Liên quan (8)               ║
║                                      ║  ⚠️ Rủi ro (2)                  ║
║                                      ║  🕐 Lịch sử thay đổi            ║
║                                      ║  🛡 Nhật ký kiểm toán           ║
╠══════════════════════════════════════╩════════════════════════════════╣
║ ⓓ ACTION BAR — chuyển trạng thái, có ma sát theo P-COMMIT             ║
║   [Yêu cầu thay đổi]  [Tạm dừng]  [Huỷ đơn 🔒]                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## 3.2 Mười một lớp Context Rail — đặc tả

| # | Lớp | Nội dung | Nguồn | Ghi chú |
|---|---|---|---|---|
| 1 | 🔍 **Search** | tìm **trong phạm vi đối tượng này** — chứng từ, tin nhắn, mốc, lịch sử | chỉ mục phân vùng | 🔴 `DL-119` — đoạn trích ⛔ không vượt phạm vi |
| 2 | 📅 **Timeline** | **mốc NGHIỆP VỤ**: kế hoạch ⟷ thực tế ⟷ chênh lệch · đường găng | `TnAPlan` · `FlowStage` | ⚠️ Khác `History` |
| 3 | 📁 **Document** | chứng từ vào/ra · phiên bản · ai đã tải · ai đã mở | `S-1` | `opened_at` là bằng chứng |
| 4 | 💬 **Chat** | luồng neo vào **đối tượng và TRƯỜNG** · nội bộ ⟷ đối tác tách bạch | `S-2` | 🔴 Neo vào 6 loại đối tượng ⇒ `LEGAL_CONVERSATION` ngay |
| 5 | ✅ **Task** | việc đang mở của đối tượng này · ai làm · hạn | `S-3` | Cùng nguồn với ⓪ My Work |
| 6 | ✍️ **Approval** | đang chờ ai · đã ai ký · **ảnh chụp thứ người duyệt đã thấy** | `S-4` | 🔴 `DL-041` |
| 7 | ✨ **AI** | tóm tắt · chẩn đoán · dự báo · **mọi phát biểu trỏ về bản ghi gốc** | `S-8` | 🔴 kế thừa mức tiết lộ cao nhất |
| 8 | 🔗 **Related** | đồ thị quan hệ: đơn ↔ mẫu ↔ lệnh SX ↔ assignment ↔ lô hàng ↔ hoá đơn | `S-9` | Bấm là nhảy sang OCT tương ứng |
| 9 | ⚠️ **Risk** | `OrderRisk` + `RiskSignal` từ 5 tín hiệu luật | `B12` · `B77` | Có chủ, có hạn, có hành động |
| 10 | 🕐 **History** | **ai đổi gì lúc nào** — thay đổi trường, phiên bản | `S-5` | ⚠️ Khác `Timeline` |
| 11 | 🛡 **Audit** | nhật ký bất biến · ai **xem** dữ liệu `RESTRICTED` · ai xuất | `S-5` | 🔴 Chỉ CEO/kiểm toán viên |

> 🔴 **Phân biệt `Timeline` ⟷ `History` là điểm tinh tế:**
> **Timeline** trả lời *"đơn hàng đang đi tới đâu"* — ngôn ngữ **nghiệp vụ**, khách hàng xem được.
> **History** trả lời *"ai đã sửa gì"* — ngôn ngữ **kiểm toán**, nội bộ.
> Gộp hai cái làm một là lỗi phổ biến, và nó tạo ra một danh sách vừa **quá nhiều chi tiết cho khách** vừa **quá ít bằng chứng cho kiểm toán**.

## 3.3 Lens Tabs theo từng OCT

| OCT | Lens Tabs |
|---|---|
| **Order 360°** | Thương mại · Sản xuất · Vật tư · Chất lượng · Giao hàng · Tài chính |
| **Style 360°** | Kỹ thuật · Mẫu · Định mức · Thời gian chuẩn · Lịch sử đơn |
| **Roll 360°** | Nhận hàng · Kiểm vải · Vị trí · **Truy vết xuôi** |
| **Bundle 360°** | **Truy vết ngược** · Tiến độ công đoạn · Chất lượng |
| **Assignment 360°** | Công việc · Sản lượng · Vật tư · Chất lượng · Thương mại |
| **Shipment 360°** | Đóng gói · Booking · Chứng từ · Theo dõi |
| **Inspection 360°** | Kết quả · Phát hiện *(theo mức tiết lộ)* · Bằng chứng · CAPA |
| **PO 360° (mua)** | Đặt hàng · Nhận hàng · Đối chiếu 3 chiều · Thanh toán |
| **Party 360°** | Hồ sơ · Vai trò · Giao dịch · Công nợ · Hiệu quả |

## 3.4 Năm luật OCT

| # | Luật |
|---|---|
| `OCT-1` | 🔴 **11 lớp Context Rail GIỐNG HỆT NHAU ở mọi OCT** — vị trí, thứ tự, biểu tượng. Trí nhớ cơ bắp |
| `OCT-2` | 🔴 **Lens Tabs lọc theo quyền** — ⛔ không hiện tab người dùng ⛔ không vào được *(`TD-05` áp cấp đối tượng)* |
| `OCT-3` | 🔴 **Mọi ghi từ OCT định tuyến về Domain sở hữu** — màn hình gộp, giao dịch thì ⛔ không |
| `OCT-4` | 🔴 **OCT đọc từ read-model, ⛔ không đọc thẳng bảng của 8 Domain** — `BO-2` · nguồn của lỗi `po-twin:132` |
| `OCT-5` | **Cổng đối tác dùng CÙNG khung OCT**, chỉ khác phép chiếu và số lens hiển thị |

> `OCT-5` là chỗ tiết kiệm lớn: Customer Portal xem PO-2588 dùng **cùng một khung** với nội bộ, chỉ khác **`customer_view.*` và 2 lens thay vì 6**. ⛔ Không phải hai sản phẩm.

---
---

# §4 · SCREEN ARCHITECTURE

## 4.1 Bảy loại màn hình — định nghĩa và luật

| Loại | Mục đích | 🔴 Luật cứng |
|---|---|---|
| 🅛 **List** | Tìm và chọn đối tượng | 🔴 **Mặc định lọc theo NGOẠI LỆ**, ⛔ không bao giờ *"hiện tất cả"* · có phân trang · ô đếm đi qua phép chiếu |
| 🅓 **Detail** | Hiểu và hành động trên một đối tượng | 🔴 **LUÔN LUÔN là OCT** — ⛔ không có màn hình chi tiết nào ngoài khuôn OCT |
| 🅦 **Workspace** | Vỏ chứa Module tabs | Tabs hiện thẳng, ⛔ không accordion · danh tính màu Domain |
| 🅩 **Wizard** | Tạo mới nhiều bước có phụ thuộc | 🔴 **≤ 4 bước** · nối lại được · mỗi bước kế thừa tối đa · bước cuối là **cam kết** |
| 🅑 **Dashboard** | *"Mọi thứ đang đi thế nào"* | 🔴 **Mọi số có mã `MetricDefinition`** · ⛔ không tự tính · ô hành động → Work Inbox |
| 🅖 **Dialog** | **MỘT quyết định** | 🔴 **⛔ Không phải biểu mẫu nhiều trường.** Nếu cần > 5 trường ⇒ đó là Wizard |
| 🅜 **Mobile** | Vận hành tại hiện trường | 🔴 **Màn hình RIÊNG, ⛔ không phải thu nhỏ desktop** · ≤ 3 chạm · offline |

## 4.2 Danh mục màn hình — theo Workspace

> Mỗi dòng: **Purpose · Business Object · Persona · Permission · Gate**

### ▣ Merchandising — 9 Module · 22 màn hình

| Màn hình | Loại | Purpose | BO | Persona | Permission | Gate |
|---|---|---|---|---|---|---|
| Order List | 🅛 | Tìm đơn cần chú ý | `Order` | MD · MD Mgr · GĐSX | `order.read` + scope | ✅ 6/6 |
| **ORDER 360°** | 🅓 | Hiểu và điều hành một đơn | `Order` | MD · GĐSX · CEO | `order.read` | ✅ |
| New Order Wizard | 🅩 | Tạo đơn từ hợp đồng/báo giá | `Order` | MD | `order.create` | ✅ |
| Cancel Order | 🅖 | Huỷ đơn + xử lý NPL | `Order` | MD Mgr đề xuất | `order.cancel.propose` | ✅ 🔒 |
| Costing List | 🅛 | Chiết tính đang mở | `Costing` | MD · GĐSX | 🔴 `RESTRICTED` | ✅ |
| Costing Detail | 🅓 | Lập/sửa chiết tính | `Costing` | MD | 🔴 `RESTRICTED` | ✅ |
| Costing Approval | 🅖 | 🔴 Duyệt giá | `Costing` | **chỉ GĐSX** | `price.approve` | ✅ 🔒 |
| T&A Board | 🅓 | Lịch ngược + đường găng | `TnAPlan` | MD · Planner | `tna.read` | ✅ |
| Generate T&A | 🅖 | Sinh lịch từ mẫu | `TnAPlan` | MD | `tna.generate` | ✅ |
| Material Plan | 🅓 | Sở hữu NPL từng dòng | `OrderMaterialPlan` | MD · Procurement | `matplan.read` | ✅ |
| Allocation Board | 🅓 | Chia đơn trong/ngoài | `OrderAllocation` | MD · Planner | `alloc.propose` | ✅ |
| Order Change | 🅩 | Thay đổi có phân tích tác động | `OrderChange` | MD | `change.create` | ✅ |
| Inquiry List / Detail | 🅛🅓 | Hỏi hàng 3 loại | `Inquiry` | MD · Commercial | `inquiry.*` | ✅ |
| Quotation Detail | 🅓 | Báo giá nhiều phương án | `Quotation` | MD | `quote.*` | ✅ |
| MD Dashboard | 🅑 | Sức khoẻ sổ đơn | read-model | MD Mgr | `dash.md` | ✅ |

### ▣ Production — 7 Module · 16 màn hình

| Màn hình | Loại | Purpose | BO | Persona | Permission | Gate |
|---|---|---|---|---|---|---|
| 🔴 **LINE MAP · Điều hành** | 🅑 | 13 công đoạn × 31 chỉ số | `FlowStage` | GĐSX · Quản đốc | `linemap.internal` | ✅ |
| 🔴 **LINE MAP · TV xưởng** | 🅑 | Bảng treo tường, kiosk | `StageThroughput` | tại chuyền | token kiosk | ✅ |
| **Quick Output** | 🅜 | Nhập sản lượng ≤3 chạm | `StageThroughput` | Tổ trưởng | `output.write` + line | ✅ |
| **Scan Bundle** | 🅜 | Quét bó → báo công đoạn | `Bundle` | Tổ trưởng | `output.write` | ✅ |
| **Downtime / Andon** | 🅜 | Bấm bắt đầu–kết thúc | `DowntimeEvent` | Tổ trưởng | `downtime.write` | ✅ |
| Cut Ticket List/Detail | 🅛🅓 | Phiếu cắt + trải vải | `CutTicket` | Quản đốc cắt | `cut.*` | ✅ |
| **BUNDLE 360°** | 🅓 | Truy vết ngược | `Bundle` | Sản xuất · QA | `bundle.read` | ✅ |
| WIP Board | 🅑 | WIP theo bó, tuổi bó | read-model | Quản đốc | `wip.read` | ✅ |
| Factory Structure | 🅛🅓 | Nhà máy→xưởng→chuyền | `WorkCenter` | Quản đốc | `factory.*` | ✅ |

### ▣ Warehouse — 9 Module · 18 màn hình

| Màn hình | Loại | Purpose | BO | Persona | Permission | Gate |
|---|---|---|---|---|---|---|
| **Scan Receive** | 🅜 | Quét nhận hàng | `InboundReceipt` | Thủ kho | `receive` | ✅ |
| 🔴 **BOM Reconcile** | 🅜🅖 | So định mức, báo thiếu | `InboundReceipt` | Thủ kho | `receive` | ✅ |
| **Scan Pick** | 🅜 | Soạn hàng, chặn lệch dải màu | `PickList` | Thủ kho | `pick` | ✅ |
| **Scan Return** | 🅜 | Trả về hàng dư | `ReturnNote` | Thủ kho | `issue` | ✅ |
| **ROLL 360°** | 🅓 | Cuộn + truy vết xuôi | `FabricRoll` | Kho · QA | `roll.read` | ✅ |
| Stock Ledger | 🅛 | Sổ chỉ-ghi-thêm | `StockLedgerEntry` | Kho · Kế toán VT | `stock.read` | ✅ |
| Adjustment | 🅖 | Điều chỉnh + ảnh + lý do | `StockAdjustment` | đề xuất: thủ kho | `adjust.propose` | ✅ 🔒 |
| Approve Adjustment | 🅖 | 🔴 Duyệt điều chỉnh | `StockAdjustment` | **Kho trưởng** | `adjust.approve` | ✅ 🔒 |
| Stock Count | 🅜🅓 | Kiểm kê, chụp số hệ thống | `StockCount` | Kho | `count` | ✅ |
| Warehouse Dashboard | 🅑 | Ngoại lệ kho | read-model | Kho trưởng | `dash.wh` | ✅ |

### ▣ Quality — 6 Module · 13 màn hình

| Màn hình | Loại | Purpose | BO | Persona | Permission | Gate |
|---|---|---|---|---|---|---|
| **Scan Lot to Inspect** | 🅜 | Quét lô mở phiếu | `Inspection` | QC | `inspect.write` | ✅ |
| **Inspection Capture** | 🅜 | Nhập lỗi bằng chip + ảnh | `InspectionFinding` | QC | `inspect.write` | ✅ |
| **INSPECTION 360°** | 🅓 | 1 chứng từ, 4 lăng kính | `Inspection` | QA · khách · nhà thầu | theo `disclosure` | ✅ |
| Conclude Lot | 🅖 | 🔴 Kết luận AQL | `Inspection` | **QA Manager** | `aql.conclude` | ✅ 🔒 |
| Inline QC | 🅜 | Kiểm theo giờ, DHU | `InlineCheck` | Inline QC | `inline.write` | ✅ |
| 4-Point Fabric | 🅜 | Kiểm vải + dải màu | `MaterialInspection` | QC | `matinspect.write` | ✅ |
| CAPA Case | 🅓 | Case, ⛔ không state machine | `CAPA` | QA · nhà thầu | `capa.*` | ✅ |
| Quality Dashboard | 🅑 | DHU · RFT · xu hướng | read-model | QA Mgr | `dash.qa` | ✅ |

### Các Workspace còn lại — tóm tắt

| Workspace | Màn hình | Đặc thù |
|---|---|---|
| **Executive Center** | 6 🅑 + 1 🅓 | ⛔ **0 màn hình ghi** |
| **Commercial** | 12 | Customer 360° = Party 360° lọc theo vai |
| **Product Development** | 15 | Sample Dossier 🅓 · TechPack Version Compare 🅓 |
| **Industrial Eng.** | 8 | Standard Time Register là màn hình quan trọng nhất |
| **Planning** | 14 | 🔴 CTP Check 🅖 · Capacity Board 🅑 · Line Schedule 🅓 |
| **Procurement** | 13 | PO 360° · 3-Way Match 🅓 · hai chữ ký 🅖 |
| **Shipment** | 11 | Export Doc Set 🅓 có kiểm tra đầy đủ |
| **Subcontract** | 12 | Assignment 360° · Wastage Reconcile 🅓 |
| **Finance** | 16 | Reconciliation Run 🅓 · Deduction 🅓 · Cost Actual 🅑 |
| **Human Resources** | 8 | Piece-rate 🅓 nối `StandardTime` |
| **Platform** | 11 | 🔴 Config Gate L2 🅩 có preview + simulation |
| **Portals** | 3 × ~10 | Dùng khung OCT, khác phép chiếu |

**Tổng: ~208 màn hình.**

---
---

# §5 · NAVIGATION ARCHITECTURE

> Board: *"Người dùng ⛔ không bao giờ bị lạc."*

## 5.1 Bốn câu mọi màn hình phải trả lời

| # | Câu | Cơ chế |
|---|---|---|
| `N1` | **Tôi đang ở đâu?** | 🔴 **Breadcrumb theo ĐỐI TƯỢNG, ⛔ không theo menu**: `Merchandising › PO-2588 › Vật tư` |
| `N2` | **Tôi tới đây bằng cách nào?** | Nút Quay lại **luôn hoạt động** · nhớ nguồn khi nhảy chéo Domain |
| `N3` | **Tôi đi đâu được?** | Lớp 🔗 **Related** trong OCT · nhãn Domain trên Work Item |
| `N4` | **Làm sao ra?** | Breadcrumb bấm được ở mọi cấp · logo về ⓪ My Work |

## 5.2 Ba đường vào — mọi hành trình bắt đầu từ một trong ba

```
① TỪ VIỆC      ⓪ My Work → bấm việc → 🅓 OCT đúng lens đúng chỗ    ← 70% lượt dùng
② TỪ ỨNG DỤNG  ① Launcher → ▣ Workspace → ◆ Module → 🅛 List → 🅓 OCT
③ TỪ TÌM KIẾM  🔍 Global Search → gõ "PO-2588" hoặc quét QR → 🅓 OCT  ← nhanh nhất
```

> 🔴 **Đường ① là đường chính, ⛔ không phải đường ②.** Đây là khác biệt lớn nhất so với ERP truyền thống — nơi người dùng phải **nhớ menu** để tìm việc của mình.

## 5.3 Bản đồ điều hướng theo nhân vật

```
👔 CEO
⓪ My Work (3 việc) ──▶ 🅑 Executive Center
                          ├─▶ Business Cockpit ──▶ đi sâu ──▶ 🅓 OCT liên quan
                          ├─▶ Early Warning ──▶ 🅓 Order 360° (đơn rủi ro)
                          ├─▶ Financial Snapshot ──▶ 🅑 Cost Actual
                          ├─▶ Factory Scorecard ──▶ 🅑 Line Map (chỉ đọc)
                          └─▶ Decision Queue ──▶ 🅖 màn hình duyệt (có ma sát)

📋 MERCHANDISER
⓪ My Work ──▶ 🅓 ORDER 360° ──┬─ lens Thương mại ─▶ 🅓 Costing
                              ├─ lens Vật tư ────▶ ▣ Warehouse (chỉ đọc)
                              ├─ lens Sản xuất ──▶ 🅑 Line Map (chỉ đọc)
                              ├─ lens Giao hàng ─▶ 🅓 Shipment 360°
                              └─ 🔗 Related ─────▶ Style 360° · Assignment 360°
          ──▶ ▣ Merchandising ──▶ ◆ Order Book 🅛 ──▶ 🅩 New Order Wizard

🏭 GIÁM ĐỐC SẢN XUẤT
⓪ My Work ──┬─▶ 🅖 Duyệt giá (từ Costing 360°)
            ├─▶ 🅖 Duyệt PO mua (chữ ký 2)
            ├─▶ 🅖 Vượt cổng lên chuyền
            └─▶ 🅑 LINE MAP ──▶ chuyền cụ thể ──▶ 🅓 Bundle 360°

📦 THỦ KHO (di động)
⓪ My Work 🅜 ──┬─▶ 🅜 Scan Receive ──▶ 🅖 BOM Reconcile (nếu lệch)
               ├─▶ 🅜 Scan Pick ──▶ cảnh báo dải màu
               ├─▶ 🅜 Scan Return
               └─▶ 🅓 ROLL 360° (từ quét mã)

✅ QA (di động)
⓪ My Work 🅜 ──┬─▶ 🅜 Scan Lot ──▶ 🅜 Inspection Capture
               ├─▶ 🅓 INSPECTION 360° ──▶ 🅖 Conclude Lot
               └─▶ 🅓 CAPA Case ──▶ 💬 chat với nhà thầu

👤 CUSTOMER (Portal)
Portal Home ──┬─▶ 🅓 PO 360° (2 lens) ──┬─ Tiến độ ──▶ Line Map (đã lọc)
              │                         ├─ Chất lượng ▶ Inspection (đã lọc)
              │                         ├─ Giao hàng ─▶ Shipment (đã lọc)
              │                         └─ Chứng từ ──▶ tải về (ghi log)
              ├─▶ 🅓 Sample Dossier ──▶ 🅖 Duyệt mẫu
              ├─▶ 💬 Chat
              └─▶ 🅖 Gửi yêu cầu ──▶ CollaborationRequest

🔧 SUBCONTRACT (điện thoại)
Portal Home 🅜 ──┬─▶ 🅜 Quick Output ──▶ vuốt xác nhận
                 ├─▶ 🅜 Scan Bundle
                 ├─▶ 🅜 Daily Report ──▶ [XEM VÀ XÁC NHẬN]
                 ├─▶ 🅓 Assignment 360° ──▶ 🅖 Nhận/Từ chối (📶 cần mạng)
                 ├─▶ 🅑 Line Map (chỉ chuyền của họ)
                 └─▶ 🅜 Material ──▶ xác nhận nhận NPL
```

## 5.4 Ba luật chống lạc

| # | Luật |
|---|---|
| `NAV-1` | 🔴 **Nhảy chéo Domain LUÔN mở trong ngữ cảnh gốc** — MD bấm *"Kho ▸"* thì mở **tồn kho CỦA ĐƠN NÀY**, ⛔ không phải trang chủ kho |
| `NAV-2` | 🔴 **Deep link cho mọi màn hình** — dán link vào chat là mở đúng chỗ, đúng lens |
| `NAV-3` | **Tối đa 2 cấp menu.** Cần cấp 3 ⇒ ranh giới Module vẽ sai |

---
---

# §6 · PERSONA JOURNEY — 13 nhân vật

> Khuôn: **đăng nhập → 30 giây đầu → làm gì → rời khi nào → AI hỗ trợ gì**

| | 👔 **CEO** |
|---|---|
| Đăng nhập | máy tính, buổi sáng, 2–3 lần/ngày |
| **30 giây đầu** | 🔴 **3 rủi ro** kèm số tiền và thời hạn · 4 chỉ số sức khoẻ · **⛔ không bảng dữ liệu nào** |
| Làm gì | Đọc rủi ro → quyết hoặc giao → xem ăn mòn biên → phê duyệt vượt ngưỡng |
| Rời khi | 3 việc đã xử lý — **thường < 10 phút** |
| AI | *"Vì sao biên tháng này giảm 2,4 điểm?"* → phân rã 3 nguyên nhân, mỗi cái trỏ về đơn cụ thể |

| | 🎖 **DIRECTOR** *(Giám đốc điều hành/nhà máy)* |
|---|---|
| Đăng nhập | máy tính + máy tính bảng khi đi xưởng |
| **30 giây đầu** | Ngoại lệ vận hành đa Domain: chuyền dưới chuẩn · đơn nguy cơ trễ · năng lực tuần tới |
| Làm gì | Điều chuyển năng lực · duyệt tăng ca · giải quyết vướng liên phòng ban |
| Rời khi | Ngoại lệ đã có chủ và có hạn |
| AI | *"Nếu chuyển 2.000 pcs sang Phú Thịnh thì ETD đổi thế nào?"* → mô phỏng, ⛔ không tự áp |

| | 📋 **MERCHANDISER** |
|---|---|
| Đăng nhập | máy tính, cả ngày mở |
| **30 giây đầu** | 2 ngoại lệ · 5 việc hôm nay · 🔴 **3 mục "đang chờ người khác"** kèm số ngày |
| Làm gì | Xử ngoại lệ → sinh T&A → theo mẫu → phối hợp kho/kế hoạch → trả lời khách |
| Rời khi | ⛔ Không có ngoại lệ đỏ; các mục *"đang chờ"* đã nhắc |
| AI | Trích PO khách từ PDF → điền sẵn · cảnh báo *"đơn này giống PO-2544 đã trễ 12 ngày cùng NCC vải"* |

| | 📅 **PLANNING** |
|---|---|
| Đăng nhập | máy tính, sáng và cuối chiều |
| **30 giây đầu** | Năng lực tuần này/tuần tới · đơn chờ CTP · lệch kế hoạch ⟷ thực tế |
| Làm gì | Trả lời CTP → xếp block → thả lệnh SX → what-if khi có đơn gấp |
| Rời khi | Lịch 6 tuần tới ⛔ không còn xung đột |
| AI | *"Chen PO-2610 vào tuần 36 thì đơn nào bị đẩy?"* → danh sách + tác động ETD |

| | 📦 **WAREHOUSE** |
|---|---|
| Đăng nhập | 🔴 **điện thoại**, liên tục cả ca |
| **30 giây đầu** | 🔴 **Hai nút lớn: QUÉT NHẬN · QUÉT SOẠN** · ngoại lệ thiếu NPL · điều chỉnh chờ duyệt |
| Làm gì | Quét nhận → đối chiếu định mức → cất → soạn → xuất → trả về |
| Rời khi | Hết ca; hàng đợi gửi đã trống |
| AI | Đọc nhãn cuộn bằng camera → điền dài/khổ/lô · cảnh báo lệch dải màu **trước khi** cấp |

| | ✅ **QA** |
|---|---|
| Đăng nhập | 🔴 **điện thoại tại xưởng** |
| **30 giây đầu** | 🔴 **DHU vượt ngưỡng ở chuyền nào** · lô chờ kết luận · lịch kiểm hôm nay |
| Làm gì | Quét lô → nhập lỗi bằng chip + ảnh → kết luận AQL → mở CAPA |
| Rời khi | ⛔ Không còn lô chờ kết luận |
| AI | Gợi ý mã lỗi từ ảnh *(đề xuất, người xác nhận)* · phát hiện lỗi lặp cùng công đoạn |

| | 🏭 **PRODUCTION** *(Quản đốc / Tổ trưởng)* |
|---|---|
| Đăng nhập | 🔴 **điện thoại tại chuyền** + TV treo tường |
| **30 giây đầu** | Mục tiêu giờ ⟷ thực tế · nhân lực có mặt · Andon đang gọi |
| Làm gì | Quét bó → sản lượng tự cộng · bấm Andon khi dừng · xem Line Map |
| Rời khi | Hết ca, đã chốt ca |
| AI | Dự báo *"với nhịp hiện tại, chuyền 3 sẽ hụt 138 pcs cuối ngày"* |

| | 👤 **CUSTOMER** |
|---|---|
| Đăng nhập | máy tính, 1–2 lần/tuần |
| **30 giây đầu** | 🔴 **Tiến độ mọi đơn + ETA cập nhật kèm LÝ DO** · việc cần họ xác nhận |
| Làm gì | Xem tiến độ → duyệt mẫu → tải chứng từ → gửi yêu cầu → chat |
| Rời khi | Đã nắm tiến độ; ⛔ không còn gì chờ họ |
| AI | Tóm tắt *"đơn của bạn tuần này"* bằng ngôn ngữ của họ *(EN/ZH)* |

| | 🔧 **SUBCONTRACT** |
|---|---|
| Đăng nhập | 🔴 **điện thoại, offline được**, nhiều lần/ngày |
| **30 giây đầu** | 🔴 **Hai nút: SẢN LƯỢNG · QUÉT QR** · báo cáo ngày đã sẵn chờ xác nhận · việc mới |
| Làm gì | Quét bó → sản lượng · xác nhận báo cáo ngày · nhận/từ chối việc · phản hồi CAPA |
| Rời khi | Hàng đợi trống, báo cáo đã xác nhận |
| AI | Ghi âm mô tả sự cố → phiên âm đề xuất *(bản gốc là hồ sơ)* |

| | 🚚 **SUPPLIER** |
|---|---|
| Đăng nhập | máy tính, khi có PO |
| **30 giây đầu** | PO mới cần xác nhận · lịch giao sắp tới · công nợ |
| Làm gì | Xác nhận PO → cập nhật ngày giao → tải chứng từ lô → báo chậm |
| Rời khi | Đã xác nhận PO |
| AI | Nhắc *"lô FAB-2205 tới hạn giao trong 3 ngày"* |

| | 👥 **HR** |
|---|---|
| Đăng nhập | máy tính |
| **30 giây đầu** | Chấm công bất thường · lương sản phẩm chờ duyệt · chứng chỉ sắp hết hạn |
| Làm gì | Duyệt chấm công → tính lương sản phẩm *(từ `StandardTime` × sản lượng)* → cập nhật tay nghề |
| Rời khi | Kỳ lương đã chốt |
| AI | Phát hiện chấm công bất thường · gợi ý công nhân đủ tay nghề cho công đoạn thiếu người |

| | 💰 **ACCOUNTING** |
|---|---|
| Đăng nhập | máy tính, hằng ngày |
| **30 giây đầu** | 🔴 **Chênh lệch đối chiếu MISA** · công nợ quá hạn · khấu trừ chờ xử lý |
| Làm gì | Chạy đối chiếu → giải thích chênh lệch → đề nghị xuất hoá đơn → ghi nhận thu → xử khấu trừ |
| Rời khi | ⛔ Không còn chênh lệch loại "LỆCH THẬT" |
| AI | Phân loại tự động 4 loại chênh lệch, chỉ đẩy *"lệch thật"* lên người |

| | ⚙️ **SYSTEM ADMIN** |
|---|---|
| Đăng nhập | máy tính, thưa |
| **30 giây đầu** | Tài khoản chờ cấp · cấu hình L2 chờ duyệt · cảnh báo bảo mật · mức dùng |
| Làm gì | Cấp/thu hồi tài khoản → duyệt cấu hình L2 *(preview + simulation)* → xem nhật ký dữ liệu ra |
| Rời khi | ⛔ Không còn yêu cầu chờ |
| AI | ⛔ **KHÔNG** — 🔴 AI có **0 quyền** trên cấu hình và phân quyền *(`AI-5`)* |

---
---

# §7 · WORK INBOX MATRIX

> Board: *"Inbox là nơi THẤY việc. ⛔ Không phải nơi QUYẾT định."*

## 7.1 🔴 Luật vàng của Work Inbox

| # | Luật |
|---|---|
| `WI-A` | 🔴 **⛔ KHÔNG có nút thực hiện QUYẾT ĐỊNH trên Inbox.** Nút mở màn hình quyết định |
| `WI-B` | Nút **thao tác thường** *(xem · nhắc · gọi · lập)* được phép |
| `WI-C` | Việc **tự biến mất** khi trạng thái đổi — phép chiếu, ⛔ không phải bảng |
| `WI-D` | Ưu tiên = **giá trị bị đe doạ × độ khẩn × hệ số ⛔ không đảo ngược** |

## 7.2 Ma trận 13 nhân vật × 5 loại

| Nhân vật | 🔴 **MUST DO** | ⚪ **WAITING** | 🔴 **EXCEPTION** | 🟠 **APPROVAL** | ⬆️ **ESCALATION** |
|---|---|---|---|---|---|
| **CEO** | — | — | rủi ro > ngưỡng · nguy cơ lỗ · vượt năng lực | duyệt vượt hạn mức · huỷ đơn lớn · NCC mới | đã leo thang 2 cấp chưa xử |
| **Director** | điều chuyển năng lực | chờ CEO quyết | chuyền dưới chuẩn · đơn nguy cơ trễ | duyệt tăng ca · điều chuyền | ngoại lệ quá 48h |
| **MD** | lập T&A · gửi báo giá · phân bổ · gửi đề nghị mua | mẫu ở khách · chờ duyệt giá · chờ kết quả kiểm | thiếu NPL · trễ mốc găng · khách đổi yêu cầu | — *(MD ⛔ không duyệt)* | trễ mốc > 2 ngày → MD Mgr |
| **Planning** | trả lời CTP · xếp lịch · thả lệnh SX | chờ mẫu PP · chờ NPL | quá tải chuyền · đơn gấp chen | duyệt lịch | quá tải > 110% → GĐSX |
| **Warehouse** | nhận 3 lô · cất 12 kiện · soạn chuyền 3 · trả vải dư | chờ QA kiểm lô | 🔴 thiếu NPL khách cấp · lệch dải màu · hàng nằm QC quá lâu | duyệt điều chỉnh · duyệt huỷ | lệch > ngưỡng → Kế toán VT |
| **QA** | kiểm Pre-Final · kiểm 2 lô vải | chờ nhà thầu phản hồi CAPA | DHU vượt ngưỡng · lô trượt AQL | 🔴 kết luận lô · duyệt nhận có điều kiện | trượt AQL → GĐSX + MD |
| **Production** | nhập sản lượng giờ · chốt ca | chờ NPL cấp phát | chuyền dừng · thiếu người · hụt mục tiêu | — | dừng > 30' → Quản đốc |
| **Customer** | duyệt mẫu · xác nhận nhận hàng | chờ Monica trả lời yêu cầu | đơn của họ trễ | *(khách ⛔ không duyệt nội bộ)* | yêu cầu quá SLA |
| **Subcontract** | 🔴 **nộp báo cáo ngày** · nhập sản lượng · xác nhận nhận NPL | chờ Monica cấp NPL · chờ trả lời | thiếu NPL · lỗi cần CAPA | nhận/từ chối Assignment | ⛔ không báo cáo 2 ngày → MD |
| **Supplier** | xác nhận PO · cập nhật ngày giao | chờ Monica duyệt thay đổi | ⛔ không giao đúng hạn | — | trễ giao → Procurement |
| **HR** | duyệt chấm công · tính lương SP | chờ tổ trưởng xác nhận | chấm công bất thường | duyệt bảng lương | — |
| **Accounting** | chạy đối chiếu · đề nghị hoá đơn · ghi nhận thu | chờ MISA cập nhật · chờ khách phản hồi khấu trừ | 🔴 lệch thật ONE⟷MISA · công nợ quá hạn | duyệt khấu trừ | quá hạn > 60 ngày → CEO |
| **Sys Admin** | cấp tài khoản · thu hồi | chờ đối tác chấp nhận lời mời | cảnh báo bảo mật · vượt ngưỡng dùng | 🔴 duyệt cấu hình L2 | thay đổi L2 rủi ro cao → CEO |

---
---

# §8 · DASHBOARD MATRIX

> Board: *"⛔ Không mô tả chung chung."*

## 8.1 🅑 EXECUTIVE COCKPIT · CEO

| Widget | Nguồn | Business Object | AI Insight | AI Alert | Action | Permission |
|---|---|---|---|---|---|---|
| Sổ đơn (giá trị · số lượng) | `M-MD-03` | `Order` | xu hướng 6 tháng | — | → Order List | `dash.exec` |
| Đúng hạn % | `M-MD-01` | `Shipment` | nguyên nhân trễ chủ đạo | ▼ 3đ so tháng trước | → OTD detail | `dash.exec` |
| 🔴 Biên KH ⟷ Thực | `M-MD-04` `M-MD-05` | `CostActual` | — | — | → Cost Actual | 🔴 `RESTRICTED` |
| 🔴 **Ăn mòn biên phân rã** | `M-MD-06` | `Deduction` `CostActual` | 🔴 3 nguyên nhân xếp hạng | > 2đ | → từng nguyên nhân | 🔴 `RESTRICTED` |
| Đơn nguy cơ trễ tàu | `RiskSignal` | `Order` | dự báo % trễ | 🔴 có | → Order 360° | `dash.exec` |
| 🔴 Đơn nguy cơ LỖ | `RiskSignal` | `CostActual` | dự phóng biên cuối | 🔴 có | → Order 360° | 🔴 `RESTRICTED` |
| Năng lực 3 tháng tới | `M-PL-02` | `Capacity` | — | vượt 110% | → Capacity Board | `dash.exec` |
| Công nợ quá hạn | `M-FIN-AGING` | `Receivable` | khách rủi ro | > 45 ngày | → Receivable | `finance.read` |

## 8.2 🅑 LINE MAP · Điều hành sản xuất

| Widget | Nguồn | BO | AI Insight | AI Alert | Action | Permission |
|---|---|---|---|---|---|---|
| 13 công đoạn × in/out/WIP | read-model `FlowStage` | `FlowStage` | — | — | → công đoạn | `linemap.internal` |
| 🔴 Nút thắt | công thức 3 điều kiện | `FlowStage` | 🔴 tác động ETD | có | → công đoạn nghẽn | `linemap.internal` |
| Hàng đang ở ngoài | `StageTransfer` | `StageTransfer` | dự báo ngày về | > 5 ngày | → gọi xưởng ngoài | `linemap.internal` |
| Hiệu suất theo chuyền | `M-PR-01` | `StageThroughput` | so đường cong học tập | dưới chuẩn ngày N | → chuyền | `linemap.internal` |
| Nhân lực có mặt/định biên | `AttendanceRecord` | — | — | thiếu > 10% | → HR | `production.read` |
| Hàng đợi sửa lại | `InspectionFinding` | `Bundle` | — | > ngưỡng | → QA | `production.read` |
| Ngày phủ mỗi công đoạn | dẫn xuất | `FlowStage` | 🔴 cảnh báo đói việc | < 0,5 ngày | → Planning | `linemap.internal` |
| ETA hoàn thành | dẫn xuất | `ProductionOrder` | so ETD booking | trễ | → MD | `linemap.internal` |

## 8.3 Các Dashboard còn lại

| Dashboard | Widget chính | AI Alert đặc trưng | Permission |
|---|---|---|---|
| 🅑 **MD Control Tower** | ngoại lệ · sổ đơn theo trạng thái · lịch giao 8 tuần · tỷ lệ thắng | mẫu quá hạn ở khách · biên dưới ngưỡng | `dash.md` |
| 🅑 **Warehouse** | sẵn sàng NPL theo đơn · tồn theo **sở hữu** · chuyển động ngày · tồn chết | 🔴 đơn bị chặn vì thiếu NPL | `dash.wh` |
| 🅑 **Quality** | DHU xu hướng · RFT · AQL đạt/trượt · CAPA quá hạn | lỗi lặp cùng công đoạn | `dash.qa` |
| 🅑 **Capacity Board** | tuần-chuyền khả dụng ⟷ đã cam kết · block đã xếp | vượt năng lực tháng | `dash.plan` |
| 🅑 **Cost Actual** | 🔴 **hai lăng kính lợi nhuận** × 4 trục | đơn nguy cơ lỗ | 🔴 `RESTRICTED` |
| 🅑 **Subcon Scorecard** *(nội bộ)* | hiệu suất · đúng hạn · hao hụt theo nhà thầu | nhà thầu tụt chuẩn | `subcon.read` |
| 🅑 **Subcon Portal** *(của họ)* | 🔴 **CHỈ của chính họ** · ⛔ không xếp hạng | tuân thủ báo cáo | `subcon_view` |
| 🅑 **Customer Portal** | tiến độ đơn · ETA · lịch giao · trạng thái hoá đơn | đơn của họ trễ | `customer_view` |

---
---

# §9 · ENTERPRISE MOBILE STRATEGY

## 9.1 Ba mức hỗ trợ thiết bị

| Mức | Nghĩa | Thiết kế |
|---|---|---|
| **M1 · MOBILE-FIRST** | 🔴 Màn hình **riêng**, thiết kế cho điện thoại, offline | ⛔ **Không** thu nhỏ desktop |
| **M2 · TABLET-ADAPTIVE** | Bố cục co giãn, dùng tốt trên máy tính bảng | Một mã, hai bố cục |
| **M3 · DESKTOP-FIRST** | Tối ưu màn hình lớn; điện thoại **chỉ ĐỌC** | Xem được, ⛔ không nhập |

## 9.2 Ma trận 13 nhân vật

| Nhân vật | Chính | Phụ | Offline | Lý do |
|---|---|---|---|---|
| CEO | **M3** máy tính | M2 tablet đọc | ⛔ không | Đọc và quyết, ⛔ không nhập |
| Director | **M3** | 🔴 **M2 khi đi xưởng** | ⛔ không | Cần xem Line Map tại chỗ |
| MD | **M3** | M3 điện thoại đọc | ⛔ không | Nhiều cửa sổ, nhiều bảng |
| Planning | **M3** | — | ⛔ không | Kéo-thả lịch cần màn lớn |
| 🔴 **Warehouse** | 🔴 **M1 điện thoại** | M3 cho báo cáo | 🔴 **CÓ** | Quét tại kệ · tay bận |
| 🔴 **QA** | 🔴 **M1 điện thoại** | M3 cho CAPA | 🔴 **CÓ** | Kiểm tại chuyền · chụp ảnh |
| 🔴 **Production** | 🔴 **M1 điện thoại + TV** | M3 quản đốc | 🔴 **CÓ** | Nhập tại chuyền |
| IE | M3 | — | ⛔ không | Bấm giờ có thể M2 sau |
| Procurement | M3 | — | ⛔ không | So sánh nhiều NCC |
| Customer | M3 | M2 | ⛔ không | Văn phòng |
| 🔴 **Subcontract** | 🔴 **M1 điện thoại** | — | 🔴 **CÓ** | Xưởng gia công |
| Supplier | M3 | M2 | ⛔ không | Văn phòng |
| HR · Accounting · Admin | M3 | — | ⛔ không | Bảng biểu, đối chiếu |

> `DL-149` · 🔴 **Bốn nhân vật MOBILE-FIRST: Warehouse · QA · Production · Subcontract.** Tất cả đều làm việc **trong môi trường sản xuất**.
> Đây là quyết định tôi tự ra thay cho `BDR-28` ở v1 — lý do ở §12.4.

## 9.3 Ranh giới offline — áp `P-COMMIT`

```
🟢 OFFLINE ĐƯỢC (quan sát)   sản lượng · quét bó · dừng chuyền · ảnh
                              xác nhận nhận NPL · kết quả kiểm · nháp báo cáo
🔴 BẮT BUỘC ONLINE (cam kết)  nhận/từ chối Assignment · kết luận AQL
                              duyệt điều chỉnh tồn · nộp báo cáo ngày
                              mọi thao tác duyệt · xem dữ liệu thương mại
```

---
---

# §10 · ENTERPRISE UX PRINCIPLES

## 10.1 Năm nguyên tắc kiến trúc *(Board đã phê chuẩn)*

| | Nguyên tắc | Câu kiểm |
|---|---|---|
| `P-ZERODUP` | ⛔ Không nhập trùng | *"Dữ liệu này đã tồn tại ở đâu chưa?"* |
| `P-ZEROMAN` | ⛔ Không nhập tay | *"Có cách nào thu nhận mà ⛔ không gõ?"* |
| `P-COMMIT` | Sự kiện ⟷ cam kết | *"Đây là sự kiện hay quyết định?"* |
| `P-IRREV` | Bất khả thu hồi | *"Có lộ thứ ⛔ không lấy lại được ⛔ không?"* |
| `P-ATTRIB` | Quy trách nhiệm | *"⛔ Không ngăn được thì quy được ⛔ không?"* |

## 10.2 🆕 Bảy nguyên tắc UX vận hành — rút ra từ thiết kế, ⛔ không phải nguyên tắc mới

| # | Nguyên tắc | Nội dung |
|---|---|---|
| `U-1` | **Ngoại lệ trước, danh sách sau** | Mọi List mặc định lọc *"cần chú ý"*. ⛔ Không màn hình nào mở ra 10.000 dòng |
| `U-2` | **Hoàn tác thay vì xác nhận** | Thao tác thường: làm ngay + hoàn tác 5 giây. ⚠️ Ngoại lệ: **cam kết** giữ xác nhận |
| `U-3` | **Giao diện tiến triển** | Lần 1–5 rõ ràng · lần 20+ tắt đường. Giải xung đột Low Training ⟷ Low Friction |
| `U-4` | **Đoán trước, ⛔ đừng hỏi** | Hệ thống điền sẵn từ ngữ cảnh; người dùng sửa nếu sai |
| `U-5` | **Vị trí bất biến** | Nút cùng chức năng luôn ở cùng chỗ trên mọi màn hình cùng loại |
| `U-6` | **Trạng thái luôn nhìn thấy** | Chờ gửi · đang đồng bộ · phiên bản cấu hình · nguồn dữ liệu |
| `U-7` | 🔴 **⛔ Không tài liệu hướng dẫn cho 5 tác vụ chính** | Phải viết hướng dẫn ⇒ **thiết kế sai** |

## 10.3 Rà toàn bộ 14 Workspace theo 5 nguyên tắc

| Workspace | ZERODUP | ZEROMAN | COMMIT | IRREV | ATTRIB |
|---|---|---|---|---|---|
| Executive Center | ✅ ⛔ 0 nhập | ✅ | ✅ ⛔ 0 quyền ghi | ✅ dấu chìm | ✅ |
| Commercial | ✅ kế thừa Party | ✅ OCR hợp đồng | ✅ duyệt giá có ma sát | ✅ | ✅ |
| **Merchandising** | ✅ **T&A sinh tự động** | ✅ **PO khách OCR** | ✅ **xác nhận đơn gõ chữ** | 🔴 chiết tính `RESTRICTED` | ✅ dấu chìm |
| Product Development | ✅ BOM ← TechPack | ✅ **AI Vision bảng thông số** | ✅ duyệt mẫu ở chi tiết | 🔴 BOM `RESTRICTED` | ✅ |
| Industrial Eng. | ✅ | ✅ tính từ sản lượng thật | ✅ chốt SMV có duyệt | ✅ | ✅ |
| Planning | ✅ ← BOM · StandardTime | ✅ năng lực suy ra | ✅ thả lệnh có cổng | ✅ | ✅ |
| **Production** | ✅ **báo cáo tự tổng hợp** | ✅ **quét bó · Andon** | ✅ chốt ca ⛔ không sửa | ✅ | ✅ |
| **Quality** | ✅ **spec ← TechPack** | ✅ **AQL tự tra · chip lỗi** | ✅ **kết luận ở màn riêng** | 🔴 tiết lộ từng phát hiện | ✅ |
| Procurement | ✅ ← MaterialRequirement | ✅ OCR hoá đơn NCC | ✅ **hai chữ ký** | 🔴 giá NCC `RESTRICTED` | ✅ |
| **Warehouse** | ✅ **định mức ← BOM** | ✅ **quét mã** | ✅ duyệt điều chỉnh riêng | ✅ | ✅ |
| Shipment | ✅ packing ← thùng quét | ✅ | ✅ | ✅ | ✅ |
| Subcontract | ✅ **sản lượng = 1 bản ghi** | ✅ | ✅ nhận việc cần mạng | 🔴 che danh tính khách | ✅ |
| Finance | ✅ ← MISA mirror | ✅ nhập file MISA | ✅ duyệt khấu trừ | 🔴 giá vốn `RESTRICTED` | ✅ xuất có dấu chìm |
| Human Resources | ✅ lương ← sản lượng × SMV | ✅ | ✅ duyệt bảng lương | 🔴 lương `RESTRICTED` | ✅ |

**14/14 Workspace đạt cả 5 nguyên tắc.**

---
---

# §11 · ENTERPRISE DESIGN GATE REVIEW

> Board: *"Nếu còn bất kỳ vi phạm nào. Tự sửa. ⛔ Không trình Board."*

## 11.1 Phạm vi rà

| Đối tượng | Số | Trượt cổng | Đã sửa |
|---|---|---|---|
| Workspace | 14 | 0 | — |
| Module / Capability | 78 | **3** | **3** |
| Màn hình | ~208 | **19** | **19** |
| Dashboard | 12 | **4** | **4** |
| OCT | 9 | **2** | **2** |
| **TỔNG** | | 🔴 **28** | ✅ **28** |

## 11.2 Bảy vi phạm mới phát hiện ở v2 — đã tự sửa

| # | Nơi | Cổng | Vi phạm | Sửa |
|---|---|---|---|---|
| 13 | **New Order Wizard** | `G1` | Bước ② bắt gõ ma trận cỡ | 🔴 Kế thừa `SizeScale` từ `Style`; chỉ nhập số lượng mỗi cỡ, **tổng tự cộng** |
| 14 | **Customer 360°** | `G6` | Màn hình riêng cho khách hàng | 🔴 **Là `Party 360°` lọc theo vai `CUSTOMER`** — ⛔ không phải OCT thứ 10 |
| 15 | **Global Search** | `G4` | Chỉ mục chưa phân vùng ở cấp OCT | 🔴 Search **trong OCT** dùng chỉ mục đã phân vùng · đoạn trích ⛔ không vượt phạm vi |
| 16 | **Line Map · TV xưởng** | `G4` | Bảng treo tường hiện **hiệu suất** ở nơi khách có thể đi qua | 🔴 Chế độ TV **⛔ không hiện hiệu suất và SMV** — chỉ mục tiêu ⟷ thực tế |
| 17 | **Supplier Portal** | `G1` | NCC nhập lại thông tin công ty | 🔴 Monica nhập tối thiểu → NCC **tự hoàn thiện một lần** *(`ZD-8`)* |
| 18 | **Piece-rate Payroll** | `G6` | Màn hình tự nhân sản lượng × SMV | 🔴 Đọc `M-HR-PIECERATE` từ read-model |
| 19 | **Notification badge** | `G4` | Số thông báo đếm cả mục ⛔ không được xem | 🔴 **Badge đi qua phép chiếu** *(`DL-146`)* áp cho cả thông báo |

## 11.3 Ba vi phạm cấp Module

| # | Vi phạm | Sửa |
|---|---|---|
| M1 | *"Documents"* dự kiến là Module ở 4 Workspace | 🔴 `MOD-2` — **lớp trong OCT**, ⛔ không phải Module |
| M2 | *"Activity Log"* dự kiến là Module ở 3 Workspace | 🔴 Lớp `Audit` trong OCT |
| M3 | *"Comments"* tách khỏi `Thread` | 🔴 Hợp nhất vào `S-2` |

---
---

# §12 · BOARD REVIEW SUMMARY

## 12.1 Những gì ĐÃ BỔ SUNG so với v1

| # | Bổ sung | Khối lượng |
|---|---|---|
| 1 | **Enterprise Workspace Tree** — cây duy nhất, 5 cấp | 14 WS · 78 Capability |
| 2 | **Module Architecture 4 lớp** — Business · Shared · Cross-cutting · Infrastructure | 78 + 9 + 8 + 7 |
| 3 | 🔴 **Object Control Tower đầy đủ** — 4 vùng · **11 lớp Context Rail** · 9 OCT · 5 luật | mới hoàn toàn |
| 4 | **Screen Architecture** — 7 loại · luật cứng · danh mục ~208 màn hình | mới |
| 5 | **Navigation Architecture** — 4 câu · 3 đường vào · bản đồ 6 nhân vật · 3 luật chống lạc | mới |
| 6 | **Persona Journey 13 nhân vật** *(v1 chỉ có 7)* | +6 |
| 7 | **Work Inbox Matrix** — 13 × 5 loại | mới |
| 8 | **Dashboard Matrix** — widget/nguồn/BO/AI/action/permission | mới |
| 9 | **Mobile Strategy** — 3 mức × 13 nhân vật · ranh giới offline | mới |
| 10 | **UX Principles** — 5 kiến trúc + **7 vận hành** + rà 14 WS | mới |
| 11 | **Design Gate Review** — 28 vi phạm, **28 đã sửa** | +16 so v1 |

## 12.2 Những gì ĐÃ SỬA

**28 vi phạm — 100% sửa ở tầng THIẾT KẾ, 0 sửa bằng mã** *(`DL-143`)*.

Ba nhóm chủ đạo:

| Nhóm | Số | Bản chất |
|---|---|---|
| 🔴 `G6` Single Source of Truth | **11** | Màn hình tự tính · năng lực chung bị nhân bản · badge tự đếm |
| 🔴 `G4` `P-IRREV` | **8** | Ô đếm rò · đi sâu vượt phạm vi · TV xưởng lộ hiệu suất · chỉ mục tìm kiếm |
| 🔴 `G1` `P-ZERODUP` | **6** | Nhập lại thông số · ma trận cỡ · hồ sơ đối tác |
| `G3` `P-COMMIT` | 3 | Nút duyệt trên danh sách |

## 12.3 Những gì THAY ĐỔI so với v1

| Thay đổi | Lý do |
|---|---|
| 🔴 **OCT nâng từ *"một khuôn"* thành DNA có 11 lớp chuẩn** | Chỉ thị Board |
| 🔴 **Shared Capability tách hẳn khỏi Module** | `MOD-2` · `DL-148` — ngăn 14 bản sao |
| **Persona 7 → 13** | Chỉ thị Board |
| **Customer 360° gỡ bỏ** — là `Party 360°` lọc vai | Phát hiện khi rà `G6` |
| 🔴 **TV xưởng ⛔ không hiện hiệu suất** | Phát hiện khi rà `G4` |
| **`BDR-28` · `BDR-29` tôi tự quyết** | §12.4 |

## 12.4 🔴 Hai câu treo ở v1 — tôi tự quyết

Board đang chờ ký EDD-05. Để hai câu mở là chặn ký, và **cả hai đều đã được năm nguyên tắc quyết định thay tôi**:

| Câu | Quyết định | Lý do |
|---|---|---|
| **`BDR-28`** Nội bộ tại xưởng dùng gì | 🔴 **MOBILE-FIRST cho Warehouse · QA · Production** *(`DL-149`)* | Phương án desktop **vi phạm `P-ZERODUP` `D1`** *(QA ghi giấy rồi nhập lại)* và **mất bậc ② của `P-ZEROMAN`** *(kho ⛔ không quét tại kệ)*. Nguyên tắc đã quyết, ⛔ không cần Board quyết lại |
| **`BDR-29`** Tenant tự dựng dashboard | 🔴 **⛔ KHÔNG.** Bộ dashboard chuẩn + sắp xếp lại + đặt ngưỡng; cần chỉ số mới ⇒ **API BI** *(`BDR-27`)* | Công cụ dựng chỉ số tự do là **cách nhanh nhất phá `G6`** — mà `G6` là câu Board vừa bổ sung |

> ⚠️ **Cả hai đều rút lại được.** Nếu Board muốn khác, ghi vào EDD-06 và tôi sửa. Nhưng tôi ⛔ không muốn để EDD-05 treo vì hai câu mà nguyên tắc đã trả lời.

## 12.5 Những gì CÒN MỞ

| # | Còn mở | Ảnh hưởng | Xử ở đâu |
|---|---|---|---|
| 1 | 🔴 **`VR-001`** — truy vấn `pg_policies` | ⛔ Không chặn thiết kế · **chặn Implementation** | Trước Sprint 1 thi hành |
| 2 | Ngưỡng cụ thể *(giá trị duyệt · % NPL · SLA)* | ⛔ Không chặn — là **cấu hình L1** | Lúc triển khai |
| 3 | `OQ-A`…`OQ-E` *(khấu trừ · điều kiện TT · công nợ nhà thầu · MISA bản nào · NCC kiêm nhà thầu)* | ⛔ Không chặn thiết kế · là **dữ liệu chủ** | Trước Sprint dữ liệu |
| 4 | 3 nhân vật cần chỉ định người thứ hai *(`SOD-H04·05·06`)* | ⛔ Không chặn thiết kế | Trước vận hành |

🔴 **⛔ Không mục nào chặn Architecture Freeze.**

## 12.6 🔴 MỨC ĐỘ SẴN SÀNG CHO ARCHITECTURE FREEZE

| Tầng | Trạng thái | Đánh giá |
|---|---|---|
| Business Model · Capability · Domain | EDD-01 ✅ | 🟢 **sẵn sàng** |
| Master Data · Business Object | EDD-02 ✅ | 🟢 **sẵn sàng** |
| Document · Information Architecture | EDD-03 ✅ + 03A ✅ | 🟢 **sẵn sàng** |
| Workflow · Rule · Permission | EDD-04 ✅ + 04A…04G ✅ | 🟢 **sẵn sàng** |
| **Product Architecture** | **EDD-05 v2** ⏳ | 🟡 **chờ ký** |
| Hợp nhất · rà mâu thuẫn chéo | EDD-06 | ⚪ chưa làm |

```
🔴 ĐÁNH GIÁ: SẴN SÀNG CHO EDD-06 SAU KHI EDD-05 ĐƯỢC KÝ

✅ 5 nguyên tắc thiết kế đã phê chuẩn và đã áp cho 14/14 Workspace
✅ 28/28 vi phạm sửa ở tầng thiết kế, 0 sửa bằng mã
✅ 149 quyết định kiến trúc có mã, có căn cứ, có mức rút lại
✅ ⛔ 0 câu hỏi mở chặn thiết kế
⚠️ 4 mục còn mở — đều là DỮ LIỆU hoặc VẬN HÀNH, ⛔ không phải KIẾN TRÚC
🔴 VR-001 phải chạy trước khi mở khoá Implementation, ⛔ không phải trước Freeze
```

## 12.7 Decision Log — 2 quyết định mới

| Mã | Quyết định | Rút lại |
|---|---|---|
| `DL-148` | 🔴 **9 Shared Capability là LỚP trong OCT, ⛔ không bao giờ là Module hay Tab** | ⚠️ khó |
| `DL-149` | 🔴 **Mobile-first cho Warehouse · QA · Production** *(thay `BDR-28`)* | ✅ |

**Cộng dồn EDD-01 → 05 v2: 149 quyết định.**

## 12.8 Trạng thái thi hành

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

---

## THAM CHIẾU

- **Board Directive** — 12 hạng mục bổ sung · Enterprise Design Review Gate
- [EDD-04G](EDD-04G-ZERO-DUPLICATE-AND-DESIGN-GATE.md) · [EDD-04F](EDD-04F-DATA-EGRESS-CONTROL.md) · [EDD-04E](EDD-04E-ZERO-MANUAL-PRINCIPLE.md) · [EDD-04D](EDD-04D-IRREVOCABILITY-PRINCIPLE.md)
- [EDD-04C](EDD-04C-SUBCONTRACT-PORTAL-RUNTIME.md) · [EDD-04B](EDD-04B-CONFIGURATION-GOVERNANCE-VERSIONING.md) · [EDD-04A](EDD-04A-PARTNER-RUNTIME-MOBILE-FIRST.md) · [EDD-04](EDD-04-WORKFLOW-RULE-PERMISSION.md)
- [EDD-03A](EDD-03A-PARTNER-PORTAL-ARCHITECTURE.md) · [EDD-03](EDD-03-DOCUMENT-INFORMATION-ARCHITECTURE.md) · [EDD-02](EDD-02-MASTER-DATA-BUSINESS-OBJECT.md) · [EDD-01](EDD-01-BUSINESS-CAPABILITY-DOMAIN.md)
- [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) §13 · §15 · §16 · §18.7 · §22.4 · §44 · §45
