# EPIC BA-1 · ENTERPRISE BUSINESS ARCHITECTURE

| Trường | Giá trị |
|---|---|
| **EPIC** | **BA-1 · Enterprise Business Architecture** |
| **Thẩm quyền** | Board Directive BA-1 & UX-1 *(Revised)* — 05/08/2026 |
| **Ràng buộc** | ⛔ **Không viết mã** — chỉ tài liệu kiến trúc |
| **Trạng thái** | 🟠 **KHUNG + DANH MỤC DẪN XUẤT ĐƯỢC** · 🔴 **4 danh mục cần Board/Joseph cung cấp** |

---

# §0 · TÔI LÀM ĐƯỢC GÌ, VÀ ⛔ KHÔNG LÀM ĐƯỢC GÌ

> Board yêu cầu 8 hạng mục. Tôi **dẫn xuất được 4** từ văn bản đã duyệt và mã
> đang chạy. **4 hạng mục còn lại là SỰ THẬT NGHIỆP VỤ** — tôi ⛔ **không** bịa.

| # | Hạng mục | Trạng thái |
|---|---|---|
| 1 | **Organization Structure** | 🔴 **CẦN JOSEPH** — sơ đồ tổ chức thật của Monica |
| 2 | **Department Catalog** | 🔴 **CẦN JOSEPH** — tên phòng ban thật, số người, ai phụ trách |
| 3 | **Role Catalog** | ✅ **DẪN XUẤT ĐƯỢC** — 14 vai trong `lib/rbac.ts` · §2 |
| 4 | **Business Capability Map** | ✅ **ĐÃ CÓ** — EDD-01, 93 năng lực L2 · 14 Domain · §3 |
| 5 | **Responsibility Matrix (RACI)** | 🟠 **KHUNG + MẪU** — điền đủ cần §1 và §2 · §5 |
| 6 | **Workspace Definition** | 🔴 **PHẢI ĐỌC LẠI ĐỀ BÀI** — xem §1 |
| 7 | **Permission Matrix** | ✅ **DẪN XUẤT ĐƯỢC** — `MODULE_ACCESS` · §4 |
| 8 | **Navigation Strategy** | ✅ **§6** — kèm 3 khuyết tật đã đo |

🔑 **Vì sao ⛔ không bịa 1 và 2:** sơ đồ tổ chức là **sự thật của doanh nghiệp**,
⛔ không phải suy luận kiến trúc. Bịa ra một sơ đồ hợp lý rồi xây RACI trên đó
sẽ tạo một tài liệu **trông đầy đủ** mà ⛔ **không mô tả Monica**. Đó đúng thứ
`P-MEASURE` cấm, và đúng cách `TD-38` đã bị xử — ghi *"chưa có"* thay vì điền bừa.

---

# §1 · 🔴 ĐỌC LẠI ĐỀ BÀI: *"Workspace Definition cho từng phòng ban"*

## 1.1 Vấn đề

Yêu cầu này ngầm định **Workspace = Phòng ban**. Ba văn bản bậc 1–2 nói ngược lại:

| Văn bản | Nguyên văn |
|---|---|
| **Hiến pháp §13.3** | *"The Homepage **shall not be organized by organizational hierarchy, job titles** or technical system modules."* |
| **ADR-015** | 14 Business Workspace = **miền năng lực**, ⛔ không phải đơn vị tổ chức |
| **EDD-01** | Domain phân theo nguyên tắc **"thì của động từ"**, ⛔ không theo sơ đồ tổ chức |

## 1.2 Vì sao tách bạch này đắt giá

| | **Department** | **Business Workspace** |
|---|---|---|
| Trả lời | *ai báo cáo cho ai* | *việc gì được làm ở đâu* |
| Đổi vì | tái cơ cấu · tuyển · sáp nhập | mô hình kinh doanh đổi |
| Tần suất | **vài lần / năm** | **vài năm / lần** |
| Nguồn | Joseph | ADR-015 |

**Nếu Workspace = Phòng ban:** mỗi lần tái cơ cấu là **một lần đổi kiến trúc phần
mềm** — gộp hai phòng ⇒ gộp hai Workspace ⇒ dời dữ liệu, dời quyền, dời màn hình.

**Nếu Workspace = miền năng lực:** tái cơ cấu chỉ đổi **một bảng ánh xạ**. ⛔
Không một dòng mã nào phải sửa.

⚠️ Doanh nghiệp may **tái cơ cấu thường xuyên hơn hẳn** đổi mô hình kinh doanh.
Buộc chúng vào nhau là **buộc phần bền vào phần hay đổi**.

## 1.3 Đề nghị đọc lại

> Thay *"Workspace Definition cho từng phòng ban"*
> bằng **hai danh mục độc lập + một bảng ánh xạ nhiều–nhiều**.

```
Department Catalog          Mapping                Workspace Catalog
(Joseph cung cấp)      Department → Workspace       (ADR-015, đã duyệt)
   Phòng Kế hoạch  ──────────┬──────────────────►  D5  Planning
                             └──────────────────►  D2  Merchandising
   Phòng Kho       ──────────┬──────────────────►  D9  Warehouse
                             └──────────────────►  D8  Procurement
```

**Bảng ánh xạ là thứ DUY NHẤT đổi khi tái cơ cấu.**

---

# §2 · ROLE CATALOG — dẫn xuất từ `lib/rbac.ts` `[MEASURED]`

| # | Mã vai | Nhãn | Nhà mặc định | Vào được |
|---|---|---|---|---|
| 1 | `superadmin` | Super Admin | `/admin` | **tất cả** |
| 2 | `giamdoc` | Giám đốc | `/giam-doc` | `/giam-doc` `/orders` `/subcon` |
| 3 | `md` | Merchandiser & Thu Mua | `/md` | `/md` `/orders` `/subcon` |
| 4 | `qa` | QA / QC | `/qa` | `/qa` |
| 5 | `totruongmay` | Tổ trưởng May | `/to-truong-may` | `/to-truong-may` `/subcon` |
| 6 | `totruongcat` | Tổ trưởng Cắt | `/to-truong-cat` | `/to-truong-cat` |
| 7 | `hoanthanh` | Tổ Hoàn Thành | `/hoan-thanh` | `/hoan-thanh` `/to-truong-hoan-thanh` |
| 8 | `kho` | Quản lý Kho | `/kho` | `/kho` `/xuat-hang` `/subcon` |
| 9 | `khotruong` | Tổ trưởng Kho | `/kho` | `/kho` `/xuat-hang` `/subcon` |
| 10 | `thukho` | Thủ kho | `/kho` | `/kho` |
| 11 | `ketoan` | Kế toán | `/ke-toan` | `/ke-toan` |
| 12 | `ketoanvattu` | Kế toán vật tư | `/kho` | `/kho` `/ke-toan` |
| 13 | `subcon` | Xưởng gia công | `/subcon` | `/subcon` |
| 14 | `buyer` | Khách hàng (Buyer) | `/buyer` | `/buyer` |

## 2.1 🔴 Bốn khuyết tật đo được trong danh mục vai

| # | Khuyết tật | Bằng chứng |
|---|---|---|
| `RC-1` | **12 vai nội bộ mang tên CHỨC DANH, ⛔ không phải năng lực** — `totruongmay` · `thukho` · `ketoanvattu`. Tái cơ cấu ⇒ đổi mã vai | `lib/rbac.ts` |
| `RC-2` | **Bốn vai cùng trỏ `/kho`** — `kho` · `khotruong` · `thukho` · `ketoanvattu`. Chúng khác nhau ở **quyền thao tác** *(`WH_PERMISSIONS`)*, ⛔ không ở lối vào | `ROLE_HOME` |
| `RC-3` | **`/subcon` phục vụ 7 vai**, gồm cả **nhà thầu ngoài** — người trong và người ngoài chung một route | `KD-6` |
| `RC-4` | **Phân quyền theo VAI, ⛔ chưa theo ASSIGNMENT** — Playbook Điều XXX *(ưu tiên tối cao)* đòi `Identity → Assignment → Scope → Permission`; hiện là `Identity → Role → Action` | `TD-26` |

⚠️ `RC-1` là lý do Sprint **I-5** đặt điều kiện ra *"⛔ 0 route mang tên chức danh"*.

---

# §3 · BUSINESS CAPABILITY MAP — đã có, ⛔ không dựng lại

**14 Business Domain** *(ADR-015)* · **93 năng lực L2** *(EDD-01 §2)* · **~88
Business Object**, mỗi cái **đúng một** Domain sở hữu.

| Domain | Sở hữu dữ liệu gốc | Kích hoạt |
|---|---|---|
| `D1` Commercial | Customer · Contract · PriceAgreement | 🟡 EMBEDDED |
| `D2` Merchandising | **Order** · Costing · TnAPlan | 🟢 ACTIVE |
| `D3` Product Development | Style · TechPack · Sample · BOM | 🟡 EMBEDDED |
| `D4` Industrial Engineering | **StandardTime** · Operation | 🟡 EMBEDDED |
| `D5` Planning | Capacity · ProductionOrder · LineSchedule | 🟡 EMBEDDED |
| `D6` Manufacturing | CutTicket · Bundle · StageThroughput | 🟢 ACTIVE |
| `D7` Quality | **Inspection** · Defect · CAPA | 🟢 ACTIVE |
| `D8` Procurement | Supplier · PurchaseOrder | 🟢 ACTIVE |
| `D9` Warehouse | **StockLedger** · FabricRoll · Reservation | 🟢 ACTIVE |
| `D10` Logistics | Booking · Shipment · PackingList | 🟢 ACTIVE |
| `D11` Subcontract | **Assignment** · Subcontractor | 🟢 ACTIVE |
| `D12` Finance | **Deduction** · Payment · CostActual | 🟢 ACTIVE |
| `D13` People | Employee · Attendance · SkillMatrix | 🟡 EMBEDDED |
| `D14` Executive Center | ⛔ **KHÔNG sở hữu gì** *(ngoại lệ §5.4)* | 🟢 ACTIVE |

⇒ **BA-1 ⛔ không cần dựng lại bản đồ này.** Việc còn thiếu là **nối nó với sơ
đồ tổ chức** — tức bảng ánh xạ ở §1.3.

---

# §4 · PERMISSION MATRIX — hiện trạng và đích

## 4.1 Hiện trạng `[MEASURED]`

**Ba tầng đang chạy:**

```
middleware.ts     chốt điều hướng — canAccess(role, path)
guard.ts          chốt mỗi Server Action, mỗi phân hệ một bản
RLS               HÀNG RÀO THẬT — policy trên CSDL
```

**Đo được:** `authenticated_only` **22 → 0** bảng · `TRUNCATE` hở **0** ·
`DELETE` hở **6** *(`TC-1`)* · ma trận đọc **90/90** · ma trận ghi **75/75**.

## 4.2 🔴 Khoảng cách giữa hiện trạng và Playbook Điều XXX

| | Hiện tại | Đích *(Điều XXX)* |
|---|---|---|
| Chuỗi phán quyền | `Identity → Role → Action` | `Identity → Assignment → Resource Scope → Permission → Action` |
| Phạm vi | **route** | **tài nguyên** |
| Câu hỏi trả lời | *"anh là ai"* | *"Monica giao việc gì cho anh"* |

⇒ Đây là `TD-26`, và nó là **thay đổi mô hình phân quyền** ⇒ cần **ADR riêng**.
BA-1 ⛔ không giải được bằng tài liệu.

---

# §5 · RACI — KHUNG, ⛔ CHƯA ĐIỀN

## 5.1 Vì sao ⛔ chưa điền

RACI cần **§1 (Department)** và **§2 (ai giữ vai nào)**. Cả hai đang thiếu sự
thật nghiệp vụ. Điền bừa sẽ tạo một ma trận **trông đầy đủ** mà ⛔ không ai theo.

## 5.2 Khuôn đề nghị — theo **Business Object**, ⛔ không theo màn hình

| Business Object | R *(làm)* | A *(chịu trách nhiệm)* | C *(hỏi ý)* | I *(báo cho)* |
|---|---|---|---|---|
| `Order` | ? | ? | ? | ? |
| `Costing` | ? | 🔴 **`TD-32`** — hiện `md` **tự duyệt chiết tính của chính mình** | ? | ? |
| `Assignment` | ? | ? | ? | ? |
| `StockLedger` | ? | ? | ? | ? |
| `Inspection` | ? | ? | ? | ? |
| `Deduction` | ? | ? | ? | ? |

🔑 **Vì sao theo Business Object:** màn hình đổi, đối tượng thì ⛔ không. RACI
theo màn hình phải viết lại mỗi lần đổi giao diện; RACI theo `Order` đứng vững
qua mọi lần dựng lại UI.

⚠️ **Ô `A` của `Costing` đã có một câu trả lời SAI đo được** — `TD-32`. RACI sẽ
lộ thêm những chỗ như vậy; đó chính là giá trị của nó.

## 5.3 Ràng buộc bắt buộc: **9 quy tắc `SOD-H*`**

RACI **⛔ không được** vi phạm 9 chặn cứng phân tách nhiệm vụ *(EDD-04B)*. Ba
trong số đó **chưa có người thứ hai** — Cổng B mục `B4`, chờ Joseph chỉ định.

---

# §6 · NAVIGATION STRATEGY

## 6.1 Bốn tầng

```
① HOMEPAGE      Application Launcher  →  "doanh nghiệp có gì"   (UX-1 §3)
② WORK ZONE     Dashboard cá nhân     →  "hôm nay tôi làm gì"
③ WORKSPACE     miền năng lực         →  "làm việc đó ở đâu"
④ OBJECT        OCT 360°              →  "một đối tượng cụ thể"
```

## 6.2 Ba khuyết tật điều hướng đo được

| # | Khuyết tật | Hệ quả |
|---|---|---|
| `NV-1` | **Route mang tên chức danh** — `/giam-doc` · `/to-truong-may` · `/ke-toan` | Sơ đồ tổ chức nằm trên **thanh địa chỉ**. Tái cơ cấu ⇒ đổi URL ⇒ hỏng mọi liên kết đã lưu. Sprint **I-5** |
| `NV-2` | **Bốn vai chung `/kho`** | Điều hướng ⛔ không phân biệt được **Thủ kho** với **Kế toán vật tư**; khác biệt nằm ở nút bấm, ⛔ không ở đường đi |
| `NV-3` | **`/subcon` chung cho người trong lẫn người ngoài** | `KD-6`. Cổng đối tác **phải** tách khỏi route nội bộ — Sprint **I-9** |

## 6.3 Nguyên tắc đề nghị

| # | Nguyên tắc |
|---|---|
| `N-1` | **Route theo NĂNG LỰC, ⛔ không theo chức danh** — `/merchandising` thay `/md`; `/production` thay `/to-truong-may` |
| `N-2` | **Người ngoài ⛔ không bao giờ chung route với người trong** — cổng đối tác có tiền tố riêng |
| `N-3` | **Một đối tượng, một URL chuẩn tắc** — `/order/{id}` mở được từ mọi Workspace, ⛔ không nhân bản màn hình |
| `N-4` | **Bottom nav ⛔ không đổi giữa các Workspace** — §15.3 |

⚠️ `N-1` và `N-2` là **thay đổi Permission Model** ⇒ cần **ADR**, thuộc I-5 · I-9.

---

# §7 · CẦN BOARD / JOSEPH

| # | Cần gì | Ai | Chặn gì |
|---|---|---|---|
| `Q-1` | **Sơ đồ tổ chức thật** — phòng ban, ai phụ trách, bao nhiêu người | **Joseph** | §1 · §5 |
| `Q-2` | **Ai đang giữ vai nào** — ánh xạ người ⟷ 14 vai | **Joseph** | §5 RACI |
| `Q-3` | **Xác nhận `Department ⛔ ≠ Workspace`** — chấp nhận hai danh mục + ánh xạ? | **Board** | toàn bộ BA-1 |
| `Q-4` | **`SOD-H04` · `H05` · `H06`** — người thứ hai *(Cổng B `B4`)* | **Joseph** | §5.3 |
| `Q-5` | **`TD-32`** — ai được duyệt chiết tính, nếu ⛔ không phải `md`? | **Board** | §5.2 |

---

## THAM CHIẾU

- **ADR-015** *(14 Workspace)* · **ADR-017** · Hiến pháp **§13.3** · **§16.2**
- **EDD-01** *(93 năng lực L2)* · **EDD-04B** *(`SOD-H*`)* · Playbook **Điều XXX**
- `lib/rbac.ts` · `TD-26` · `TD-32` · `KD-6` · `TC-1`
- [`EPIC-UX-1`](EPIC-UX-1-PRODUCT-EXPERIENCE-ARCHITECTURE.md) §1.2 — Department ⟷ Workspace

> **Trạng thái:** ⏳ trình Board. ⛔ Chưa viết một dòng mã nào.
