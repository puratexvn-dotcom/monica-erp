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

---
---

# §8 · REVISION 2 — BOARD DIRECTIVE 05/08/2026

> ⚠️ **§0–§7 GIỮ NGUYÊN VĂN** *(Điều 43.7)*. Revision 2 **thêm vào**.

## 8.1 Board đã cung cấp — hai khoảng trống của Rev 1 được lấp

| # | Rev 1 ghi | Rev 2 |
|---|---|---|
| 1 | 🔴 Organization Structure — **cần Joseph** | ✅ **Board cấp dữ liệu khởi đầu** — §8.2 |
| 2 | 🔴 Department Catalog — **cần Joseph** | ✅ **dẫn xuất từ §8.2** — §8.3 |
| 6 | 🔴 *"Workspace cho từng phòng ban"* — phải đọc lại | ✅ **Board xác nhận `Department ⛔ ≠ Workspace`** |
| — | — | 🆕 **Module Catalog** — §8.5 |
| — | — | 🆕 **User Profile & Settings** — §8.7 |

## 8.2 ORGANIZATION STRUCTURE — thiết kế MỞ RỘNG ĐƯỢC

### 8.2.1 Dữ liệu khởi đầu Board cấp

```
CEO
├── Giám đốc Sản xuất
│     ├── Merchandising · QA · Warehouse
│     └── Cutting · Sewing · Production Planning
├── Trưởng phòng Kinh doanh
│     └── Sales · Sales Admin · Customer Service
├── Kế toán
├── Nhân sự
├── IT
└── Administration
```

### 8.2.2 🔑 Nguyên tắc: sơ đồ tổ chức là **DỮ LIỆU**, ⛔ không phải mã

Board dặn *"thiết kế theo hướng mở rộng, ⛔ không hard-code vào kiến trúc"*.
Đây là cách thi hành điều đó.

| # | Nguyên tắc | Vì sao |
|---|---|---|
| `O-1` | **Cây tổ chức lưu thành DỮ LIỆU, tự tham chiếu** — `Unit(id, parentId, name, kind)` | Thêm một phòng = **thêm một dòng**, ⛔ không phải một lần deploy |
| `O-2` | **⛔ KHÔNG giới hạn số tầng.** Hôm nay 3, ngày mai có thể 5 *(Tổ → Chuyền → Xưởng)* | Nhà máy thứ hai sẽ thêm một tầng |
| `O-3` | **`kind` phân biệt**: `COMPANY` · `DIVISION` · `DEPARTMENT` · `TEAM` · `LINE` | Cùng một cây, nhiều loại nút — ⛔ không cần bảng thứ hai |
| `O-4` | 🔴 **⛔ KHÔNG bao giờ suy quyền từ cây tổ chức** | Quyền đi từ **Assignment** *(Playbook Điều XXX)*. Suy từ cây là buộc phần bền vào phần hay đổi |
| `O-5` | **Có `hieuLucTu` / `hieuLucDen`** | Tái cơ cấu ⛔ không được xoá lịch sử — chứng từ cũ phải tra được phòng ban **lúc đó** |

⚠️ `O-5` là điều dễ bỏ sót nhất. ⛔ Không có nó, một lần tái cơ cấu sẽ khiến mọi
báo cáo lịch sử **kể sai** ai đã làm gì.

### 8.2.3 Ba câu hỏi ⛔ dữ liệu khởi đầu chưa trả lời

| # | Câu hỏi | Vì sao quan trọng |
|---|---|---|
| `OQ-1` | **Cutting · Sewing** là phòng ban, hay **tổ sản xuất** dưới một xưởng? | Quyết định `kind` và số tầng |
| `OQ-2` | **Kế toán · Nhân sự · IT · Administration** báo cáo thẳng CEO, hay qua một Giám đốc Hành chính? | Ảnh hưởng RACI cột `A` |
| `OQ-3` | **Bao nhiêu nhà máy / địa điểm?** | Nếu > 1, cây cần thêm tầng `SITE` **ngay từ đầu** |

## 8.3 DEPARTMENT CATALOG — dẫn xuất

| # | Department | Thuộc | Workspace phục vụ *(nhiều–nhiều)* |
|---|---|---|---|
| 1 | Merchandising | GĐ Sản xuất | `D2` Merchandising · `D1` Commercial · `D3` Product Dev |
| 2 | QA | GĐ Sản xuất | `D7` Quality |
| 3 | Warehouse | GĐ Sản xuất | `D9` Warehouse · `D8` Procurement |
| 4 | Cutting | GĐ Sản xuất | `D6` Manufacturing |
| 5 | Sewing | GĐ Sản xuất | `D6` Manufacturing |
| 6 | Production Planning | GĐ Sản xuất | `D5` Planning · `D4` Industrial Engineering |
| 7 | Sales | TP Kinh doanh | `D1` Commercial |
| 8 | Sales Admin | TP Kinh doanh | `D1` Commercial · `D2` Merchandising |
| 9 | Customer Service | TP Kinh doanh | `D1` Commercial |
| 10 | Kế toán | CEO | `D12` Finance |
| 11 | Nhân sự | CEO | `D13` People |
| 12 | IT | CEO | *(Platform Services)* |
| 13 | Administration | CEO | *(Platform Services)* |

🔑 **Bảng cột 4 chứng minh `Department ⛔ ≠ Workspace`:** `Cutting` và `Sewing`
là **hai phòng ban** dùng **chung một** Workspace `D6`; `Merchandising` là **một
phòng ban** dùng **ba** Workspace.

⚠️ **`D10` Logistics · `D11` Subcontract ⛔ chưa có phòng ban nào nhận.** Hoặc
Monica ⛔ chưa có bộ phận đó, hoặc nó nằm trong một phòng ở trên. **`OQ-4`** —
cần Joseph.

## 8.4 🔴 KHOẢNG CÁCH ĐO ĐƯỢC: 13 phòng ban ⟷ 14 vai đăng nhập

| Phòng ban *(§8.3)* | Vai trong `lib/rbac.ts` |
|---|---|
| Merchandising | `md` |
| QA | `qa` |
| Warehouse | `kho` · `khotruong` · `thukho` · `ketoanvattu` |
| Cutting | `totruongcat` |
| Sewing | `totruongmay` |
| Production Planning | ⛔ **KHÔNG CÓ VAI** |
| Sales · Sales Admin · Customer Service | ⛔ **KHÔNG CÓ VAI** |
| Kế toán | `ketoan` |
| Nhân sự | ⛔ **KHÔNG CÓ VAI** |
| IT · Administration | `superadmin` |
| — | `giamdoc` · `hoanthanh` · `subcon` · `buyer` |

**⇒ Sáu phòng ban ⛔ không có vai nào để đăng nhập:** Production Planning ·
Sales · Sales Admin · Customer Service · Nhân sự · *(và `hoanthanh` là một vai
⛔ không ánh xạ vào phòng ban nào ở §8.2)*.

🔑 Đây là **phát hiện mới của Rev 2**, và nó giải thích `UI-F4`: Homepage khai
19 App nhưng chỉ 10 App có route — vì **gần một nửa doanh nghiệp chưa có vai
trong hệ thống**.

⇒ Ghi thành **`BA-1`**: khoảng cách tổ chức ⟷ phân quyền. Trình Board.

## 8.5 🆕 MODULE CATALOG — lớp trung gian

### 8.5.1 Vì sao nó là lớp trung gian đúng chỗ

```
Business Architecture  (Department · Capability)
          ▼
   ┌──────────────┐
   │ MODULE       │ ← MỘT nơi khai: ai vào, vào đâu, thấy gì
   │ CATALOG      │
   └──────────────┘
          ▼
Permission → Navigation → Workspace → Software Architecture
```

🔑 Ngày nay bốn thứ ấy khai ở **bốn nơi rời nhau**: `home-modules.ts` *(nhãn)* ·
`rbac.ts` *(quyền)* · cây thư mục `app/` *(route)* · `screen-gates.json` *(hồ
sơ)*. **Module Catalog gộp chúng về một sổ.**

### 8.5.2 Sổ — trạng thái hiện tại `[MEASURED]`

| Module | Department | Workspace | Vai chính | Vai phụ | Route | Nhóm |
|---|---|---|---|---|---|---|
| Executive Center | *(CEO)* | `D14` | `giamdoc` | `superadmin` | `/giam-doc` 🔴 | Điều hành |
| Commercial | Sales | `D1` | ⛔ **thiếu** | `buyer` | `/buyer` 🔴 | Thương mại |
| Merchandising | Merchandising | `D2` | `md` | `giamdoc` | `/md` | Thương mại |
| Planning | Production Planning | `D5` | ⛔ **thiếu** | — | ⛔ **chưa có** | Sản xuất |
| Production | Sewing | `D6` | `totruongmay` | `totruongcat` | `/to-truong-may` 🔴 | Sản xuất |
| Quality | QA | `D7` | `qa` | — | `/qa` | Sản xuất |
| Warehouse | Warehouse | `D9` | `kho` | `khotruong` `thukho` `ketoanvattu` | `/kho` | Cung ứng |
| Shipment | Warehouse | `D10` | `kho` | `khotruong` | `/xuat-hang` | Cung ứng |
| Subcontract | ⛔ **thiếu** | `D11` | `subcon` | 6 vai nội bộ 🔴 | `/subcon` 🔴 | Cung ứng |
| Finance | Kế toán | `D12` | `ketoan` | `ketoanvattu` | `/ke-toan` | Tài chính |
| Human Resources | Nhân sự | `D13` | ⛔ **thiếu** | — | ⛔ **chưa có** | Con người |
| Business Reporting | *(toàn cục)* | — | mọi vai | — | ⛔ **chưa có** | Dịch vụ |
| Business Communication | *(toàn cục)* | — | mọi vai | — | ⛔ **chưa có** | Dịch vụ |
| AI Assistant | *(toàn cục)* | — | mọi vai | — | ⛔ **chưa có** | Dịch vụ |
| Documents | *(toàn cục)* | — | mọi vai | — | ⛔ **chưa có** | Dịch vụ |
| Platform Services | IT | — | `superadmin` | — | `/admin` | Nền tảng |

🔴 = khuyết tật đã ghi: route mang tên chức danh *(`NV-1`)* · `/subcon` chung
người trong lẫn ngoài *(`KD-6`)*.

### 8.5.3 Ba khoảng trống sổ này lộ ra

| # | Khoảng trống |
|---|---|
| `MC-1` | **4 Module ⛔ không có vai chính** — Commercial · Planning · HR · *(và Subcontract ⛔ không có phòng ban)* |
| `MC-2` | **6 Module ⛔ chưa có route** — khớp đúng 6 thẻ `COMING_SOON` ở `home-modules.ts` |
| `MC-3` | **Nhóm điều hướng ⛔ chưa tồn tại trong mã** — cột cuối là **đề xuất**, ⛔ chưa thi hành |

## 8.6 NAVIGATION GROUP — chuẩn bị cho 19 → 30 Module

| Nhóm | Module |
|---|---|
| **Điều hành** | Executive Center |
| **Thương mại** | Commercial · Merchandising |
| **Sản xuất** | Planning · Production · Quality |
| **Cung ứng** | Warehouse · Shipment · Subcontract · *(Procurement)* |
| **Tài chính** | Finance |
| **Con người** | Human Resources |
| **Dịch vụ** | Reporting · Communication · AI · Documents |
| **Nền tảng** | Platform Services |

⚠️ **⛔ Chưa dựng nhóm lên màn hình hôm nay.** Hiến pháp §13.3 cấm tổ chức
Homepage theo **sơ đồ tổ chức**; nhóm ở đây theo **miền năng lực** nên ⛔ không
vi phạm — nhưng ở 16 ô, một lưới phẳng vẫn đọc tốt hơn. **Bật nhóm khi vượt ~20
ô.**

## 8.7 🆕 USER PROFILE & SETTINGS — nền tảng dùng chung

| Mục | Ghi chú kiến trúc |
|---|---|
| Avatar | ⛔ Chưa có bảng lưu — cần **migration** ⇒ **DỪNG** |
| **Đổi mật khẩu** | ✅ **ĐÃ CÓ** — `/update-password`, dùng lại được |
| Thông tin cá nhân | Đọc từ `profiles`; sửa gì được thì **Board quyết** |
| **Ngôn ngữ** | ✅ **ĐÃ CÓ** — `lib/i18n`, đang lưu `localStorage` |
| Thông báo | ⛔ Chưa có Domain sở hữu |
| **Thiết bị đăng nhập** | 🔴 Cần Supabase session API |
| **Đăng xuất** | ✅ **ĐÃ CÓ** — `/auth/signout` |

### 8.7.1 Ba quyết định kiến trúc cần Board

| # | Câu hỏi | Vì sao |
|---|---|---|
| `UP-1` | **Ngôn ngữ lưu ở `localStorage` hay hồ sơ người dùng?** | Hôm nay đổi máy là mất. Lưu vào hồ sơ ⇒ **cần migration** |
| `UP-2` | **Người dùng tự sửa được gì?** | Họ tên là **dữ liệu nhân sự**. Cho tự sửa ⇒ hồ sơ nhân sự ⛔ không còn tin được |
| `UP-3` | **Avatar lưu ở đâu** — Supabase Storage? | Cần migration + policy ⇒ SECURITY FREEZE |

🔴 **Bốn trong bảy mục cần migration** ⇒ User Profile ⛔ **không** khởi động
được cho tới khi Board cắt `B2`.

## 8.8 CẬP NHẬT §7 — cần Board / Joseph

| # | Cần gì | Ai | Trạng thái |
|---|---|---|---|
| `Q-1` | Sơ đồ tổ chức | Joseph | ✅ **ĐÃ CẤP** — còn `OQ-1`…`OQ-4` |
| `Q-2` | Ai giữ vai nào | Joseph | 🔴 còn thiếu |
| `Q-3` | `Department ⛔ ≠ Workspace` | Board | ✅ **XÁC NHẬN** |
| `Q-4` | `SOD-H04·05·06` | Joseph | 🔴 còn thiếu |
| `Q-5` | `TD-32` ai duyệt chiết tính | Board | 🔴 còn thiếu |
| 🆕 `Q-6` | **6 phòng ban ⛔ không có vai đăng nhập** *(§8.4)* | Board | 🔴 **mới** |
| 🆕 `Q-7` | `OQ-1`…`OQ-4` — tầng tổ chức · Logistics/Subcontract thuộc phòng nào | Joseph | 🔴 **mới** |
| 🆕 `Q-8` | `UP-1`…`UP-3` — User Profile | Board | 🔴 **mới** |

---

> **Trạng thái:** ⏳ trình Board. ⛔ Chưa viết một dòng mã nào.

---
---

# §9 · REVISION 3 — ROLE ARCHITECTURE *(tách khỏi Organization)*

## 9.1 🔴 Vấn đề gốc: dự án đang trộn **hai trục độc lập** vào một

Board yêu cầu *"tách biệt Role Architecture với Organization"*. Đây ⛔ không phải
việc dọn tài liệu — nó sửa một **lỗi mô hình** đang có thật trong mã.

| Trục | Trả lời câu hỏi | Thay đổi khi | Nguồn hiện tại |
|---|---|---|---|
| **ORGANIZATION** | *"Người này **NGỒI ĐÂU** trong doanh nghiệp?"* | tái cơ cấu · điều chuyển | ⛔ **chưa tồn tại** |
| **ROLE** | *"Người này **LÀM ĐƯỢC GÌ** trong hệ thống?"* | đổi việc · thăng chức | `lib/rbac.ts` |

⚠️ **Hai trục thay đổi với tần suất khác nhau và vì lý do khác nhau.** Buộc
chúng vào nhau ⇒ mỗi lần tái cơ cấu phòng ban là một lần **phân quyền tự đổi
theo** — thứ ⛔ không ai yêu cầu và ⛔ không ai rà.

🔑 **Playbook Điều XXX đã ra luật đúng cho việc này:** quyền đi qua
**Assignment**, ⛔ không qua chức danh. Assignment chính là **điểm giao** của hai
trục — và là nơi **DUY NHẤT** chúng được phép gặp nhau.

## 9.2 Chuỗi năm bậc

```
   ROLE ──────► CAPABILITY ──────► WORKSPACE ──────► PERMISSION ──────► ACTION
"tôi là ai"   "tôi làm được gì"   "làm ở đâu"    "trên dữ liệu nào"   "thao tác"
     │                                                    ▲
     │  ⛔ KHÔNG suy quyền                                 │ SCOPE
     ▼                                                    │
 DEPARTMENT ◄──── ORGANIZATION ────► ASSIGNMENT ──────────┘
"tôi ngồi đâu"    (cây đơn vị)      "Monica giao gì cho tôi"
```

| Bậc | Định nghĩa | Ví dụ | Nơi khai |
|---|---|---|---|
| **Role** | nhóm năng lực **mặc định** — ⛔ không phải quyền | `md` | `lib/rbac.ts` |
| **Department** | đơn vị tổ chức người đó thuộc về | Merchandising | ⛔ chưa có |
| **Capability** | năng lực nghiệp vụ, **⛔ không gắn màn hình** | *Quản lý đơn hàng* | 🔴 **⛔ chưa có** |
| **Workspace** | bề mặt vận hành của một Domain | `/md` | cây `app/` |
| **Permission** | phán quyết trên **một tài nguyên cụ thể** | *sửa PO #123* | `lib/mos/permission/` |

### 9.2.1 Năm luật của Role Architecture

| # | Luật | Hậu quả nếu vi phạm |
|---|---|---|
| `RA-1` | **Role ⛔ KHÔNG suy từ Department** | Kế toán trưởng và kế toán viên **cùng phòng, khác quyền** — suy từ phòng ban ⇒ ⛔ không phân biệt nổi |
| `RA-2` | **Department ⛔ KHÔNG suy từ Role** | Một người **kiêm nhiệm** được. Ép 1-1 ⇒ ⛔ không mô tả nổi thực tế nhà máy |
| `RA-3` | **Permission ⛔ KHÔNG suy từ Role** | Role cho *"vào được `/md`"*; nó **⛔ không** cho *"sửa PO của khách hàng X"* — cái đó là **Assignment** |
| `RA-4` | **Capability là tầng ĐỆM giữa Role và Workspace** | ⛔ Không có nó, mỗi lần tách/gộp màn hình là một lần sửa `MODULE_ACCESS` ⇒ **quyền đổi vì lý do kỹ thuật** |
| `RA-5` | **Có Actor ⛔ KHÔNG nằm trên cây tổ chức** | `subcon` · `buyer` — xem §9.4 |

⚠️ **`RA-4` là bậc dự án đang thiếu, và nó tốn tiền thật.** Hiện `MODULE_ACCESS`
ánh xạ **Role → đường dẫn URL**:

```ts
md: ['/md', '/orders', '/subcon']
```

⇒ **Quyền đang được khai bằng ĐƯỜNG DẪN.** Đổi cấu trúc thư mục = đổi phân
quyền. Đó là để **quyết định kỹ thuật điều khiển quyết định nghiệp vụ** — đúng
thứ thứ bậc bậc-6 *("mã ⛔ không bao giờ là nguồn chân lý")* cấm.

⇒ Ghi **`TD-40`**: `MODULE_ACCESS` nên là `Role → Capability`, và
`Capability → Route` khai riêng. ⛔ **Không sửa ở EPIC này** — là thay đổi
Permission Model ⇒ **cần ADR riêng**.

## 9.3 Bằng chứng đo được: `Department ⟷ Workspace` là **nhiều–nhiều**

Board đã chốt `Department ⛔ ≠ Workspace` ở Rev 2. Rev 3 bổ sung **số đo** lấy
thẳng từ `MODULE_ACCESS`, ⛔ không phải lập luận thiết kế:

| Chiều | Số đo | Kết luận |
|---|---|---|
| `md` → `/md` `/orders` `/subcon` | **1 vai ⇒ 3 Workspace** | một phòng dùng **nhiều** Workspace |
| `kho` → `/kho` `/xuat-hang` `/subcon` | **1 vai ⇒ 3 Workspace** | như trên |
| `/subcon` ⇐ `md` `kho` `totruongmay` `giamdoc` | **1 Workspace ⇐ 4 vai** | một Workspace phục vụ **nhiều** phòng |

⇒ Ràng buộc 1-1 sẽ **phá vỡ mã đang chạy hôm nay**, ⛔ không phải rủi ro tương lai.

## 9.4 Ánh xạ Vai ⟷ Phòng ban *(bảng tra — ⛔ KHÔNG phải ràng buộc)*

| Vai | Phòng ban | Workspace chính | Ghi chú |
|---|---|---|---|
| `superadmin` | IT | `*` | ⚠️ **⛔ không phải vai nghiệp vụ** — cấm dùng chạy việc hằng ngày |
| `giamdoc` | Ban Giám đốc | `/giam-doc` | + `/orders` `/subcon` |
| `md` | Merchandising | `/md` | + `/orders` `/subcon` |
| `qa` | QA/QC | `/qa` | |
| `totruongcat` | Sản xuất — Cắt | `/to-truong-cat` | |
| `totruongmay` | Sản xuất — May | `/to-truong-may` | + `/subcon` |
| `hoanthanh` | Sản xuất — Hoàn thành | `/hoan-thanh` | 🔴 **⛔ không khớp phòng ban nào ở §8.3** |
| `kho` | Kho | `/kho` | + `/xuat-hang` `/subcon`; 3 vai kho chung route, phân biệt ở `WH_PERMISSIONS` |
| `ketoan` | Kế toán | `/ke-toan` | |
| `subcon` | ⚠️ **NGOÀI tổ chức** | `/subcon` | đối tác — ⛔ không có ô nào trên cây đơn vị |
| `buyer` | ⚠️ **NGOÀI tổ chức** | `/buyer` | như trên |

🔴 **`RA-5` là bằng chứng mạnh nhất cho việc tách trục.** `subcon` và `buyer` là
**người thật, đăng nhập thật, có quyền thật — và ⛔ KHÔNG có ô nào trên sơ đồ tổ
chức Monica.** Bất kỳ mô hình nào bắt *"quyền phải suy từ vị trí trong tổ chức"*
đều **⛔ không biểu diễn nổi hai vai này**.

⇒ `Actor.partnerId` phân giải từ `partner_accounts` *(có `is_active`)* —
⛔ **không** từ claim JWT. Claim ⛔ không đổi khi quan hệ đối tác chấm dứt.

---

# §10 · MODULE IDENTITY STANDARD

## 10.1 Chín trường bắt buộc cho **mỗi** Module

| # | Trường | Nguồn chân lý | Trạng thái |
|---|---|---|---|
| 1 | `key` | `ModuleKey` — `lib/design/tokens.ts` | ✅ có |
| 2 | `name` | `home-modules.ts` — ⛔ **KHÔNG dịch** *(§45.3)* | ✅ có |
| 3 | `icon` | `home-modules.ts` — `lucide-react` | ✅ có |
| 4 | `identity` *(màu)* | `MODULE_IDENTITY` — 16 dải | ✅ có |
| 5 | `tagline` | 3–5 từ, khuôn `A • B • C` | 🔴 **thiếu** |
| 6 | `businessValue` | một câu: Module này giúp doanh nghiệp việc gì | 🔴 **thiếu** |
| 7 | `status` | `'READY' \| 'COMING_SOON'` | ✅ có *(UI-1.2)* |
| 8 | `route` | union phân biệt — `COMING_SOON` ⛔ **không có** trường này | ✅ có |
| 9 | `capability` | xem `RA-4` | 🔴 **thiếu** |

## 10.2 Bảng nhận diện 16 Module *(màu đọc thẳng từ `MODULE_IDENTITY`)*

| `key` | Sắc nhận diện | `chart` | Phòng ban | Trạng thái |
|---|---|---|---|---|
| `executive` | indigo | `#6366f1` | Ban Giám đốc | ✅ READY |
| `commercial` | orange | `#f97316` | Kinh doanh | ✅ READY |
| `merchandising` | red | `#ef4444` | Merchandising | ✅ READY |
| `planning` | teal | `#14b8a6` | Kế hoạch SX | 🟠 COMING SOON |
| `production` | blue | `#3b82f6` | Sản xuất | ✅ READY |
| `quality` | emerald | `#10b981` | QA/QC | ✅ READY |
| `warehouse` | green | `#22c55e` | Kho | ✅ READY |
| `shipment` | cyan | `#06b6d4` | Xuất hàng | ✅ READY |
| `subcontract` | purple | `#a855f7` | Gia công ngoài | ✅ READY |
| `finance` | amber | `#f59e0b` | Kế toán | ✅ READY |
| `humanResources` | rose | `#f43f5e` | Nhân sự | 🟠 COMING SOON |
| `reporting` | slate | `#64748b` | *(toàn cục)* | 🟠 COMING SOON |
| `communication` | sky | `#0ea5e9` | *(toàn cục)* | 🟠 COMING SOON |
| `ai` | violet→fuchsia | `#d946ef` | *(toàn cục)* | 🟠 COMING SOON |
| `documents` | stone | `#78716c` | *(toàn cục)* | 🟠 COMING SOON |
| `platform` | violet | `#8b5cf6` | IT | ✅ READY |

⚠️ **`TD-41` — `ai` và `platform` trùng `primary: text-violet-600`.** Chú thích
trong mã nói *"sắc nhận diện là fuchsia — ⛔ KHÔNG dùng lại purple của
Subcontract"*, và điều đó **đúng** cho `secondary` · `badge` · `chart`. Nhưng
**`primary` thì trùng.** Ở ô Launcher — nơi thường chỉ hiện **một** màu — hai App
này **⛔ không phân biệt được bằng mắt**.

Đây đúng thứ `tokens.ts` gọi là *"định danh vĩnh viễn … muốn đổi phải qua ADR
(Điều 44.6)"* ⇒ **trình Board, ⛔ không tự sửa.**

## 10.3 Ba luật của Module Identity

| # | Luật | Vì sao |
|---|---|---|
| `MI-a` | **Màu là ĐỊNH DANH, ⛔ không phải trang trí** | người dùng học *"xanh lá = Kho"* bằng mắt trong vài ngày; đổi màu = **xoá thứ họ đã học** |
| `MI-b` | **`tagline` nói NGHIỆP VỤ · `businessValue` nói GIÁ TRỊ** | *"Nhập • Xuất • Tồn"* cho người vận hành; *"Biết chính xác còn bao nhiêu vải trước khi cắt"* cho Sales và Investor |
| `MI-c` | **`COMING_SOON` ⛔ KHÔNG được có `route`** | ép bằng **union phân biệt**, ⛔ không bằng `href: null`. Đã thi hành ở `UI-1.2` |

🔑 **`MI-b` là mắt xích Homepage đang thiếu.** Sáu khán giả ở `UX-1 §10` *(Sales
· Demo · Investor · Customer · Recruitment · Onboarding)* **⛔ không đọc được
`tagline` vận hành** — họ cần `businessValue`. **Một Module, hai câu, hai khán
giả.**

## 10.4 🔴 `MC-4` — bốn nguồn, bốn con số

| Nguồn | Số Module |
|---|---|
| `MODULE_IDENTITY` | **16** dải màu |
| `home-modules.ts` | **16** thẻ — 10 READY · 6 COMING_SOON |
| Hiến pháp §15 · EDD-01 | **19** Business App |
| `MODULE_ACCESS` | **13** đường dẫn phân biệt |

⇒ ⛔ **Không** nguồn nào trong bốn là sổ cái chính thức. `Module Catalog` §8.5
phải trở thành nguồn đó — và khi ấy **16 / 19 / 13** phải do **Board** hoà giải,
⛔ không để mã tự chọn.

---

# §11 · TỔNG HỢP BA-1 Rev 3

## 11.1 Vấn đề phát hiện *(mới ở Rev 3)*

| # | Vấn đề | Mức |
|---|---|---|
| `TD-40` | `MODULE_ACCESS` khai quyền bằng **đường dẫn URL** ⇒ đổi thư mục = đổi phân quyền | 🔴 cao |
| `MC-4` | Bốn nguồn khai Module cho **bốn con số**: 16 / 16 / 19 / 13 | 🔴 cao |
| `RA-4` | Thiếu tầng **Capability** giữa Role và Workspace | 🔴 cao |
| `TD-41` | `ai` ⟷ `platform` trùng `primary` violet ⇒ ⛔ không phân biệt ở ô Launcher | 🟠 vừa |
| `MI-b` | Thiếu `tagline` **và** `businessValue` — Homepage ⛔ không nói được với 6 khán giả | 🟠 vừa |

## 11.2 Giả định bị bác bỏ *(Rev 3)*

| Giả định | Ai nêu | Phán quyết |
|---|---|---|
| *"Phương án D mâu thuẫn Hiến pháp"* | **tôi**, Rev 2 | 🔴 **BÁC** — §13.1 nói **nguyên văn** Homepage **là** Launcher, **⛔ không phải** dashboard |
| *"Cần sửa §13.3 vì 'neither may be removed'"* | **tôi**, Rev 2 | 🔴 **BÁC LÝ DO** — khoản ràng buộc thật là *"default view upon sign-in"*. **Kết luận đúng, lý do sai** |
| *"Cần 3 tu chính: §13.3 + §13.5 + §15.3"* | **tôi**, Rev 2 | 🟠 **THU HẸP** — §13.3 + §15.3 là **một gói**; §13.5 quyết **riêng** |
| *"Role ⇒ Department là 1-1"* | ngầm định trong mã | 🔴 **BÁC** — đo được **nhiều–nhiều**; `subcon`/`buyer` **⛔ không có phòng ban** |

## 11.3 Tác động tới ADR · Baseline

| Văn bản | Tác động |
|---|---|
| **ADR-017** | 🔴 nguồn của mâu thuẫn §13.1 ⟷ §13.3 |
| **`ADR-021`** *(đề nghị)* | 🔴 tu chính §13.3 + §15.3 — **BẮT BUỘC trước khi viết mã** |
| **`ADR-022`** *(đề nghị, RIÊNG)* | 🟠 tu chính §13.5 — chỉ khi Board chốt *"hiện toàn bộ Module"* |
| **`ADR-023`** *(đề nghị, SAU)* | 🟠 tầng Capability — gỡ `TD-40`. ⛔ **Không** thuộc EPIC này |
| **ADR-015** | ✅ ⛔ không đụng — `Department ⛔ ≠ Workspace` nay có **bằng chứng đo được** |
| **`ARCHITECTURE_BASELINE`** | 🟠 cập nhật sau khi Board duyệt |
| **`SECURITY FREEZE`** | ⚠️ User Profile 4/7 mục cần migration ⇒ **⛔ chưa mở được** |

## 11.4 Khuyến nghị cuối cùng

```
╔═══════════════════════════════════════════════════════════════════════╗
║  ① CHỐT ADR-021 TRƯỚC mọi dòng mã Homepage.                          ║
║     Nó ⛔ không "bẻ luật theo ý Board" — nó SỬA mâu thuẫn mà ADR-017   ║
║     đã đưa vào Hiến pháp. Đây là điều kiện dừng Board đã TỰ ĐẶT.      ║
║                                                                       ║
║  ② TÁCH TRỤC: Organization ⟂ Role, gặp nhau DUY NHẤT ở Assignment.    ║
║     `subcon` và `buyer` là bằng chứng ⛔ không bác được: người thật,   ║
║     quyền thật, ⛔ KHÔNG có ô nào trên sơ đồ tổ chức.                  ║
║                                                                       ║
║  ③ BỔ SUNG `tagline` + `businessValue` cho 16 Module.                 ║
║     Rẻ nhất, tác động rộng nhất — thứ DUY NHẤT ở Rev 3 phục vụ được   ║
║     CẢ SÁU khán giả Board nêu, ⛔ không migration, ⛔ không đổi         ║
║     Security, ⛔ không đổi Permission.                                 ║
║                                                                       ║
║  ④ ⛔ CHƯA sửa `MODULE_ACCESS` (TD-40) — là thay đổi Permission Model ║
║     ⇒ cần ADR riêng ⇒ ⛔ không nằm trong EPIC tài liệu này.            ║
║                                                                       ║
║  ⑤ HOÀ GIẢI 16 / 19 / 13 (MC-4). Ba con số đang cùng tồn tại và       ║
║     ⛔ KHÔNG con số nào có thẩm quyền. Đây là việc của Board.          ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

> **Trạng thái Rev 3:** ⏳ trình Board. ⛔ Chưa viết một dòng Production Code nào.
