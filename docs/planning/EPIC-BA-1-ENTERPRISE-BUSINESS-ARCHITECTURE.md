# EPIC BA-1 · ENTERPRISE BUSINESS ARCHITECTURE

| Trường | Giá trị |
|---|---|
| **EPIC** | **BA-1 · Enterprise Business Architecture** |
| **Thẩm quyền** | Board Directive BA-1 & UX-1 *(Revised)* — 05/08/2026 |
| **Ràng buộc** | ⛔ **Không viết mã** — chỉ tài liệu kiến trúc |
| **Trạng thái** | ✅ **APPROVED BASELINE** — Board phê duyệt **Rev 6**, 05/08/2026 |
| **Phiên bản khoá** | **Rev 6** · `BA-1-BASELINE-2026-08-05` |
| **Hiệu lực** | 🔒 **ĐÓNG — ⛔ không mở rộng thêm.** Thay đổi phải qua **ADR mới** |

> 🔒 **TÀI LIỆU ĐÃ KHOÁ · 05/08/2026**
>
> Board Directive *"Close BA-1 & UX-1"* phê duyệt **Rev 6** là **nền Enterprise
> Architecture chính thức**. Từ đây:
>
> - ⛔ **Không mở rộng** BA-1 bằng cách sửa tài liệu này.
> - Mọi thay đổi kiến trúc đi qua **ADR mới**, ⛔ không qua tu chính tại chỗ.
> - §1…§26 là **bản đọc**, ⛔ không phải bản làm việc.
>
> **Câu hỏi ⛔ chưa trả lời khi khoá:** `Q-9`…`Q-17` *(§16.1 · §21.1 · §25.4)*.
> Khoá tài liệu ⛔ **không** đóng các câu hỏi đó — chúng chuyển sang Board và
> `GPR-001`.

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

---
---

# §12 · REVISION 4 — ENTERPRISE ORGANIZATION *(dữ liệu thật Board cung cấp)*

## 12.1 Sơ đồ tổ chức Monica

```
CEO
├── Director Production
│   ├── Merchandising
│   ├── Planning
│   ├── QA
│   ├── Warehouse
│   ├── Cutting
│   └── Sewing
├── Director Business
│   ├── Sales
│   ├── Sales Admin
│   └── Customer Service
├── Finance
├── HR
├── IT
└── Administration
```

**16 đơn vị · 3 tầng.** Board ghi rõ *"sơ đồ chỉ là ví dụ khởi đầu"* ⇒ mô hình
lưu **dữ liệu**, ⛔ không lưu **hình dạng** *(`O-1`…`O-5`, §8.2)*.

## 12.2 🔴 Đối chiếu 16 đơn vị ⟷ 14 vai — kết quả đo

| Đơn vị | Vai khớp | |
|---|---|---|
| CEO | `giamdoc` | ⚠️ dùng chung |
| Director Production | `giamdoc` | ⚠️ dùng chung |
| Director Business | `giamdoc` | ⚠️ dùng chung |
| Merchandising | `md` | ✅ |
| **Planning** | — | 🔴 **⛔ không có vai** |
| QA | `qa` | ✅ |
| Warehouse | `kho` · `khotruong` · `thukho` | ✅ **3 vai / 1 đơn vị** |
| Cutting | `totruongcat` | ✅ |
| Sewing | `totruongmay` | ✅ |
| **Sales** | — | 🔴 **⛔ không có vai** |
| **Sales Admin** | — | 🔴 **⛔ không có vai** |
| **Customer Service** | — | 🔴 **⛔ không có vai** |
| Finance | `ketoan` · `ketoanvattu` | ✅ 2 vai |
| **HR** | — | 🔴 **⛔ không có vai** |
| IT | `superadmin` | ⚠️ vai **quản trị**, ⛔ không phải vai nghiệp vụ |
| **Administration** | — | 🔴 **⛔ không có vai** |

**⇒ 6/16 đơn vị ⛔ KHÔNG có vai đăng nhập nào.** *(Rev 3 tôi đo 6 trên danh mục
cũ; đo lại trên cây thật của Board vẫn ra **6** — con số ổn định.)*

### 12.2.1 🔴 Ba vai ⛔ không có đơn vị trên cây

| Vai | Nhãn | Phán quyết |
|---|---|---|
| `hoanthanh` | Tổ Hoàn Thành | 🔴 **THIẾU TRONG CÂY.** Cây có `Cutting` và `Sewing` nhưng **⛔ không có `Finishing`** — trong khi vai, route `/hoan-thanh`, `/to-truong-hoan-thanh` **đều đang chạy**. ⇒ **`Q-9`: cây Board thiếu một tổ sản xuất, hay tổ Hoàn thành nằm dưới `Sewing`?** |
| `subcon` | Xưởng gia công | ✅ **ĐÚNG khi ở ngoài** — `RA-5` |
| `buyer` | Khách hàng | ✅ **ĐÚNG khi ở ngoài** — `RA-5` |

### 12.2.2 🔴 Hai Workspace ⛔ không có đơn vị chủ quản

| Workspace | Module | Đơn vị nào sở hữu? |
|---|---|---|
| `/xuat-hang` | `shipment` cyan | 🔴 **⛔ không có trên cây.** Kho? hay một đơn vị Logistics riêng? ⇒ **`Q-10`** |
| `/subcon` *(phía Monica)* | `subcontract` purple | 🔴 **⛔ không có trên cây.** 4 vai nội bộ dùng nó nhưng ⛔ không đơn vị nào **chịu trách nhiệm** ⇒ **`Q-11`** |

⚠️ **`giamdoc` phủ ba vị trí điều hành khác nhau.** Hôm nay hệ thống **⛔ không
phân biệt được CEO với Director Production**. Theo `RA-1` điều này **hợp lệ**
*(Role ⛔ không suy từ Department)*, nhưng nó có nghĩa: mọi phân quyền tinh hơn ở
tầng điều hành **phải đi qua Assignment**, ⛔ không qua vai. ⇒ **`Q-12`**

## 12.3 ⚠️ Một câu hỏi thiết kế Board nên biết

Cây đặt **Merchandising dưới Director Production**. Trong ngành may, Merchandiser
là **cầu nối khách hàng ⟷ nhà máy** — họ nhận đơn, chốt giá, theo tiến độ giao.
Đặt dưới Sản xuất là **một lựa chọn tổ chức hợp lệ** *(nhiều nhà máy làm vậy để
Merchandiser bám sát năng lực chuyền)*, nhưng nó kéo theo hệ quả: **`Sales` và
`Merchandising` nằm ở hai nhánh khác nhau**, trong khi cả hai cùng chạm vòng đời
đơn hàng.

⛔ **Tôi ⛔ không đề nghị đổi cây** — đó là quyết định của Board. Tôi ghi nhận để
`RACI` §5 **⛔ không** giả định Merchandising và Sales cùng một chuỗi báo cáo.

---

# §13 · WORKSPACE DEFINITION

> **Workspace ⛔ KHÔNG phải Module.** Module là *"năng lực gì tồn tại"*;
> Workspace là *"tôi làm việc ở đâu mỗi ngày"*.

## 13.1 Bảy khối của một Workspace — và trạng thái dữ liệu **đo được**

| # | Khối | Trả lời | Dữ liệu hôm nay | Cần migration? |
|---|---|---|---|---|
| 1 | **Today Tasks** | *"hôm nay tôi phải làm gì"* | ⛔ **⛔ không bảng nào** | 🔴 **CÓ** |
| 2 | **Work Inbox** | *"việc gì đang chờ tôi"* | ⛔ **⛔ không bảng nào** | 🔴 **CÓ** |
| 3 | **KPIs** | *"bộ phận tôi đang chạy thế nào"* | ✅ **dẫn xuất được** từ bảng nghiệp vụ | ✅ **KHÔNG** |
| 4 | **Calendar** | *"mốc nào sắp tới"* | ⛔ **⛔ không bảng nào** | 🔴 **CÓ** |
| 5 | **Alerts** | *"có gì bất thường"* | ⛔ **⛔ không bảng nào** | 🔴 **CÓ** |
| 6 | **Quick Actions** | *"việc tôi làm nhiều nhất"* | ✅ **⛔ không cần dữ liệu** — route + quyền | ✅ **KHÔNG** |
| 7 | **Recent Activity** | *"tôi vừa làm gì"* | 🟠 **một phần** — `041_activity_log_immutable` | 🟠 quyền đọc |

### 13.1.1 🔴 PHÁT HIỆN QUAN TRỌNG NHẤT CỦA Rev 4

```
2/7 khối dựng được NGAY.
1/7 khối dựng được một phần.
4/7 khối CẦN MIGRATION ⇒ chặn bởi SECURITY FREEZE (MOS §XI.1).
```

⚠️ **Board tuyên bố sẽ dùng BA-1 + UX-1 làm nền để "triển khai toàn bộ Workspace
và các Module nghiệp vụ tiếp theo".** Nhưng `SECURITY FREEZE` **còn hiệu lực**
*(`B2` chưa cắt — `GPR-001` `A-3`)*, và nó cấm **mở bảng nghiệp vụ mới**.

⇒ **Đây là một va chạm về TRÌNH TỰ, ⛔ không phải về thiết kế.** Board có hai
đường, và phải chọn **trước** khi mở EPIC Workspace:

| | Đường | Hệ quả |
|---|---|---|
| **①** | **Cắt `B2`, gỡ freeze** | mở được cả 7 khối · nhưng phải đóng `TC-1`…`TC-5` trước |
| **②** | **Giữ freeze, làm Workspace Phase 1 = khối 3 + 6 + 7** | ⛔ không migration · Workspace có **KPI + Quick Actions + Recent Activity** ngay · 4 khối còn lại sang Phase 2 |

🔑 **Tôi khuyến nghị ②.** Lý do: khối **6 (Quick Actions)** và **3 (KPIs)** là hai
khối người dùng chạm **nhiều nhất mỗi ngày**, và cả hai **⛔ không cần một dòng
SQL mới**. Làm chúng trước cho ra một Workspace **dùng được thật**, trong khi
`TC-1`…`TC-5` được xử lý song song.

## 13.2 🔑 Work Inbox ⟷ Work Zone — quan hệ chuẩn

Đây là mảnh ghép làm §13.3 Hiến pháp **có lời giải sạch**:

```
Workspace /md      → Work Inbox của Merchandising
Workspace /kho     → Work Inbox của Kho          ─┐
Workspace /qa      → Work Inbox của QA            ├─► WORK ZONE
                                                  │   (nút `Work`, thanh dưới)
                                                 ─┘   = HỢP của mọi Work Inbox
                                                       mà người dùng có quyền
```

| | Định nghĩa |
|---|---|
| **Work Inbox** | việc chờ tôi **trong MỘT Domain** — thuộc Workspace |
| **Work Zone** | **HỢP** của mọi Work Inbox tôi có quyền — **xuyên MỌI Domain** |

⇒ Work Zone **⛔ không phải màn hình thứ 8**; nó là **phép chiếu** của khối 2 qua
mọi Workspace. Đúng nguyên văn §13.3: *"It owns no business data; it **projects
the state** of the Business Domains."*

🔑 **Điều này chứng minh thêm cho `ADR-021`:** năng lực §13.3 bảo vệ **được giữ
trọn vẹn** khi Work Zone rời Homepage — vì nó vốn **⛔ không sở hữu dữ liệu**,
nó chỉ hợp nhất. Chỗ đặt nó là quyết định **điều hướng**, ⛔ không phải quyết
định **dữ liệu**.

## 13.3 Ba luật của Workspace

| # | Luật | Vì sao |
|---|---|---|
| `WS-1` | **KPI ⛔ KHÔNG được lưu** | *"⛔ Không lưu dữ liệu tính toán được"*. KPI là **View / Service**, ⛔ không phải cột |
| `WS-2` | **Workspace ⛔ KHÔNG sở hữu dữ liệu** | nó **chiếu** trạng thái Domain. Sở hữu ⇒ hai nguồn chân lý cho cùng một sự thật |
| `WS-3` | **Quick Actions phải qua đúng `guard.ts` của Module** | lối tắt là **lối tắt điều hướng**, ⛔ **không** phải lối tắt phân quyền |

---

# §14 · USER PROFILE ARCHITECTURE

## 14.1 Mười trường — trạng thái **đo được**

| # | Trường | Nguồn chân lý | Hôm nay | Migration |
|---|---|---|---|---|
| 1 | **Avatar** | hồ sơ + Storage | ⛔ **⛔ không có** | 🔴 CÓ + Storage |
| 2 | **Password** | Supabase Auth | ✅ `/update-password` · `force_password_change` | ✅ KHÔNG |
| 3 | **Language** | hồ sơ | 🟠 **có `lib/i18n`, ⛔ KHÔNG lưu vào hồ sơ** — đổi máy là mất | 🟠 CÓ *(để lưu)* |
| 4 | **Theme** | hồ sơ | ⛔ **⛔ không tồn tại** | 🔴 CÓ — ⚠️ xem 14.3 |
| 5 | **Notification** | hồ sơ + bảng thông báo | ⛔ **⛔ không có** | 🔴 CÓ |
| 6 | **Signature** | hồ sơ + Storage | ⛔ **⛔ không có** | 🔴 CÓ — ⚠️ xem 14.2 |
| 7 | **Contact** | hồ sơ | ⛔ **⛔ không có** | 🔴 CÓ |
| 8 | **Department** | **Organization** §12 | ⛔ **⛔ không có** | 🔴 CÓ |
| 9 | **Role** | `app_metadata.role` | ✅ có — **CHỈ ĐỌC** | ✅ KHÔNG |
| 10 | **Manager** | **Organization** §12 | ⛔ **⛔ không có** | 🔴 CÓ |

**⇒ 2/10 đã có · 1/10 một phần · 7/10 cần migration.** ⇒ cùng bị `SECURITY
FREEZE` chặn như §13.

⚠️ **Trường 9 `Role` phải là CHỈ ĐỌC trên màn hình hồ sơ.** Vai đọc từ
`app_metadata` — vùng **người dùng ⛔ không sửa được**. Đặt nó vào một biểu mẫu
"chỉnh sửa hồ sơ" là mở đường cho **tự leo thang đặc quyền**; đó đúng lý do
`user_metadata` bị cấm dùng cho vai.

## 14.2 🔴 `Signature` — ⛔ KHÔNG phải một tệp ảnh trong hồ sơ

Chữ ký đặt lên **chứng từ đã duyệt** là **chứng cứ**, ⛔ không phải tuỳ chọn giao
diện.

```
Nếu chữ ký được THAM CHIẾU SỐNG từ hồ sơ:
   người dùng đổi ảnh chữ ký hôm nay
   ⇒ MỌI chứng từ đã duyệt từ trước ÂM THẦM đổi chữ ký theo.
```

Điều đó vi phạm trực tiếp *"Chứng từ đã Đóng/Duyệt ⛔ không được `UPDATE`"* và
phá đúng thứ `045`/`046` vừa dựng lên *(Aggregate Immutability)*.

⇒ **`UP-4`:** chữ ký phải **có phiên bản** và được **chụp ảnh vào chứng từ tại
thời điểm duyệt**, ⛔ không tham chiếu sống. Cần ADR — ⛔ **không** giải quyết
bằng một cột `signature_url`.

## 14.3 ⚠️ `Theme` ⛔ KHÔNG phải một công tắc

`MODULE_IDENTITY` là **16 dải màu** dựng cho **nền sáng** *(`bg-*-50` ·
`text-*-600`)*, và độ tương phản đã được cân cho nền sáng — chú thích của
`finance` ghi rõ *"amber ở 600 trên nền 50 chưa qua ngưỡng 4,5:1"*.

⇒ Thêm nền tối = **dựng hệ màu THỨ HAI cho cả 16 App**, cộng việc cân lại tương
phản từng dải. Nó cũng chạm **`bánh cóc màu`** *(106 khoản nợ đang khoá)*.

⇒ **`UP-5`:** `Theme` là **một EPIC thiết kế**, ⛔ không phải một trường hồ sơ.
Khuyến nghị **tách khỏi User Profile Phase 1**.

---

# §15 · PERMISSION ARCHITECTURE — BẢY BẬC

## 15.1 Chuỗi đầy đủ, và **đường ranh giới an ninh**

```
  ① Business Capability   "năng lực nghiệp vụ nào tồn tại"      ⛔ CHƯA CÓ
  ② Workspace             "vào được vùng làm việc nào"          MODULE_ACCESS
  ③ Module                "thấy App nào trên Homepage"          home-modules.ts
  ④ Screen                "mở được màn hình nào"                screen-gates.json
╔═══════════════════════ ĐƯỜNG RANH GIỚI AN NINH ═══════════════════════╗
  ⑤ Action                "bấm được nút nào"                    guard.ts · WH_PERMISSIONS
  ⑥ API                   "gọi được Server Action nào"          guard() trong mỗi action
  ⑦ Database Permission   "đọc/ghi được DÒNG nào"               RLS  ← HÀNG RÀO THẬT
╚═══════════════════════════════════════════════════════════════════════╝
```

| Bậc | Ai thi hành | Bỏ qua được ⛔ không? | Vai trò thật |
|---|---|---|---|
| ① | *(chưa có)* | — | **khai báo** |
| ② | `middleware.ts` — Edge | ✅ **có** — sửa URL | trải nghiệm |
| ③ | `visibleModules()` — client | ✅ **có** — nó là **hiển thị** | trải nghiệm |
| ④ | kiểm tĩnh ⑯ | ✅ **có** — kiểm lúc **build** | kỷ luật |
| ⑤ | `guard.ts` — server | 🔴 **⛔ không** | **an ninh** |
| ⑥ | `guard()` trong Server Action | 🔴 **⛔ không** | **an ninh** |
| ⑦ | **RLS trong Postgres** | 🔴 **⛔ KHÔNG — kể cả khi ①…⑥ hỏng hết** | **hàng rào thật** |

## 15.2 🔑 Ba phát biểu **phải** đi kèm mô hình này

| # | Phát biểu | Vì sao bắt buộc |
|---|---|---|
| `PA-1` | **Bậc ①–④ là TRẢI NGHIỆM. Bậc ⑤–⑦ là AN NINH.** | ⛔ Không nói rõ ⇒ sẽ có người "chặn ở bậc ③" rồi tưởng đã xong. Đó đúng cách một lỗ hổng ra đời |
| `PA-2` | **Quyết định "Launcher ⛔ ≠ Permission" của Board CHÍNH LÀ việc rút bậc ③ ra khỏi an ninh** | Nó ⛔ không nới lỏng gì — bậc ③ **chưa bao giờ** là hàng rào. Board chỉ **gọi đúng tên** nó |
| `PA-3` | **Bảy bậc = bảy nơi để lệch nhau.** | ⇒ Bậc ① phải là **nơi khai DUY NHẤT**, sáu bậc còn lại **dẫn xuất hoặc đối chiếu** với nó. ⛔ Không có điều đó, mô hình 7 bậc chỉ thêm **sổ sách**, ⛔ không thêm **an toàn** |

🔑 **`PA-2` đáng ghi vào ADR.** Nó biến một quyết định trông như *"nới lỏng bảo
mật"* thành **một phát biểu đúng về kiến trúc**: bậc ③ là hiển thị, và hiển thị
**chưa bao giờ** là hàng rào. `UI-F1` vì thế ⛔ **không** phải lỗ hổng mới —
nó là **thứ luôn đúng, nay được nói ra**.

## 15.3 Trạng thái đo được của từng bậc

| Bậc | Độ phủ hôm nay | Thiếu gì |
|---|---|---|
| ① Capability | 🔴 **0%** | ⛔ chưa tồn tại — `RA-4` · `TD-40` |
| ② Workspace | ✅ 14/14 vai | ⚠️ khai bằng **URL**, ⛔ không bằng năng lực |
| ③ Module | ✅ 16/16 | *(theo Board: nay là **hiển thị**)* |
| ④ Screen | 🟠 **4/21** màn hình có hồ sơ 6 cổng | `TD-38` |
| ⑤ Action | ✅ mỗi Module một `guard.ts` | ⚠️ `WH_PERMISSIONS` là nơi **duy nhất** phân biệt 3 vai Kho |
| ⑥ API | ✅ `guard()` trong Server Action | — |
| ⑦ Database | 🟠 xem `RLS_COVERAGE_MATRIX` | `A001` phải chạy **mọi vòng** — VIEW vượt mặt RLS |

⇒ **Bậc ① và bậc ④ là hai chỗ yếu nhất**, và cả hai đã có tên trong sổ nợ
*(`TD-40` · `TD-38`)*.

---

# §16 · TỔNG HỢP Rev 4

## 16.1 Vấn đề phát hiện

| # | Vấn đề | Mức |
|---|---|---|
| `WS-freeze` | **4/7 khối Workspace + 7/10 trường Profile cần migration** ⇒ chặn bởi `SECURITY FREEZE` | 🔴 **cao — va chạm trình tự** |
| `UP-4` | **`Signature` tham chiếu sống sẽ đổi ngược chữ ký trên chứng từ ĐÃ DUYỆT** | 🔴 cao |
| `Q-9` | Cây tổ chức **thiếu tổ Hoàn thành** — vai và route đang chạy | 🔴 cao |
| `Q-10` `Q-11` | `/xuat-hang` và `/subcon` **⛔ không có đơn vị chủ quản** | 🟠 vừa |
| `Q-12` | `giamdoc` phủ **3 vị trí điều hành** — hệ thống ⛔ không phân biệt CEO ⟷ Director | 🟠 vừa |
| `UP-5` | `Theme` = **hệ màu thứ hai cho 16 App**, ⛔ không phải một trường | 🟠 vừa |
| 6/16 | **6 đơn vị ⛔ không có vai đăng nhập** *(số đo ổn định qua 2 lần đo)* | 🟠 vừa |

## 16.2 Tác động ADR · Baseline *(cập nhật Rev 4)*

| Văn bản | Tác động |
|---|---|
| **`ADR-021`** | 🔴 §13.3 + §15.3 — **và nay thêm §13.1** *(xem `UX-1 §12`)* |
| **`ADR-023`** | 🟠 Capability Layer — Board **đã đồng ý hướng**; ⛔ chưa mở |
| **`ADR-024`** *(mới, đề nghị)* | 🔴 **Signature versioning** — `UP-4`. ⛔ Không giải bằng một cột |
| **`SECURITY FREEZE`** | 🔴 **quyết định trình tự bắt buộc** — xem `13.1.1` |
| **`RLS_COVERAGE_MATRIX`** | 🟠 bậc ⑦ phải soi lại khi Workspace mở |

## 16.3 Khuyến nghị cuối cùng — Rev 4

```
╔═══════════════════════════════════════════════════════════════════════╗
║  ① QUYẾT TRÌNH TỰ TRƯỚC, ⛔ KHÔNG quyết thiết kế trước.               ║
║     Board định dùng BA-1+UX-1 làm nền cho "toàn bộ Workspace", nhưng  ║
║     4/7 khối Workspace và 7/10 trường Profile CẦN MIGRATION — và      ║
║     SECURITY FREEZE đang chặn. Chọn ① cắt B2, hoặc ② làm Phase 1     ║
║     bằng ba khối ⛔ KHÔNG cần SQL. Tôi khuyến nghị ②.                  ║
║                                                                       ║
║  ② GHI `PA-1` VÀ `PA-2` VÀO ADR.                                     ║
║     Bậc ①–④ là trải nghiệm; ⑤–⑦ là an ninh. ⛔ Không viết ra, sẽ có   ║
║     người chặn ở bậc ③ rồi tưởng đã xong — đó đúng cách một lỗ hổng   ║
║     ra đời. Và nó chứng minh "Launcher ⛔ ≠ Permission" là phát biểu   ║
║     ĐÚNG, ⛔ không phải nới lỏng.                                      ║
║                                                                       ║
║  ③ TÁCH `Signature` VÀ `Theme` KHỎI User Profile Phase 1.            ║
║     Signature là CHỨNG CỨ (cần ADR-024). Theme là một hệ màu thứ hai ║
║     cho 16 App. Cả hai ⛔ không phải "một trường trong hồ sơ".         ║
║                                                                       ║
║  ④ TRẢ LỜI Q-9 TRƯỚC KHI DỰNG CÂY ĐƠN VỊ.                            ║
║     Tổ Hoàn thành đang CHẠY THẬT mà ⛔ không có ô trên sơ đồ. Dựng     ║
║     cây thiếu nó ⇒ dữ liệu tổ chức sai ngay từ hàng đầu tiên.         ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

> **Trạng thái Rev 4:** ⏳ trình Board. ⛔ Chưa viết một dòng Production Code nào.

---
---

# §17 · REVISION 5 — 🔴 ĐÍNH CHÍNH REV 4 TRƯỚC ĐÃ

> Để dựng Business Object Layer tôi phải liệt kê **bảng thật**. Phép đo đó lật
> lại **ba phát biểu của chính tôi ở Rev 4**. Board sắp khoá hai tài liệu này
> làm nền Enterprise Architecture ⇒ đính chính phải đứng **trước** phần mới.

## 17.1 Nguyên nhân sai: tôi tìm **sai tên bảng**

Rev 4 tôi tìm `notification|calendar|user_profile|signature|avatar`, ⛔ không thấy
gì, rồi kết luận *"⛔ không có bảng nào"*. Bảng thật tên **`profiles`**, ⛔ không
phải `user_profile`. **Một chữ, và nó làm hỏng ba kết luận.**

⚠️ Đây đúng thứ `P-MEASURE` cảnh báo: **một phép đo âm tính chỉ chứng minh
được điều đã hỏi**, ⛔ không chứng minh được điều ⛔ chưa hỏi. Lần này tôi hỏi sai
câu.

## 17.2 Ba đính chính

| # | Rev 4 nói | **Sự thật đo được** |
|---|---|---|
| ① | *"Organization Structure ⛔ **chưa tồn tại**"* | 🔴 **SAI.** `departments(id, code, name, **parent_id → chính nó**)` **ĐÃ CÓ** từ `001_core_schema.sql` — đúng **cây tự tham chiếu** tôi đề xuất ở `O-1` |
| ② | *"`Department` trong Profile **cần migration**"* | 🔴 **SAI.** `profiles(id → auth.users, employee_code, full_name, **department_id**, is_active)` **ĐÃ CÓ** |
| ③ | *"**7/10** trường Profile cần migration"* | 🟠 **SAI SỐ.** Đúng là **6/10** — xem 17.4 |

## 17.3 🔴 PHÁT HIỆN LỚN NHẤT REV 5: **HAI MÔ HÌNH PHÂN QUYỀN CÙNG TỒN TẠI**

`001_core_schema.sql` đã dựng **một mô hình phân quyền hoàn chỉnh trong CSDL**:

```sql
roles(id, code, name, description)
permissions(id, code, module)        -- module: 'WAREHOUSE' · 'SEWING' · 'QA'
role_permissions(role_id, permission_id)   -- N:N
user_roles(user_id, role_id)               -- N:N
```

Và **`lib/rbac.ts` ⛔ không biết chúng tồn tại.**

| | **Mô hình A** — `lib/rbac.ts` | **Mô hình B** — CSDL `001` |
|---|---|---|
| Vai lưu ở | `app_metadata.role` — **một chuỗi** | bảng `user_roles` — **N:N** |
| Một người có | 🔴 **ĐÚNG MỘT** vai | ✅ **NHIỀU** vai |
| Vai là | **mã cứng** — union 14 giá trị | **dữ liệu** — thêm được ⛔ không cần deploy |
| Quyền khai bằng | **tiền tố URL** | **mã quyền + `module`** |
| Ai thi hành | middleware · `guard.ts` | 🔴 **⛔ KHÔNG AI** |

### 17.3.1 Bằng chứng Mô hình B ⛔ **không** phải hàng rào

```
Chuỗi `user_roles` | `role_permissions` xuất hiện trong migrations:
   → CHỈ `001_core_schema.sql`.
   → ⛔ KHÔNG một policy RLS nào ở BẤT KỲ migration nào tham chiếu chúng.
```

⇒ **`TD-42` · MÔ HÌNH PHÂN QUYỀN MA.** Bốn bảng trông **đầy thẩm quyền**, nằm
trong lược đồ lõi, và **⛔ không điều khiển gì cả**.

⚠️ **Đây là loại khuyết tật nguy hiểm nhất trong tài liệu này.** Một người sau
sẽ mở `role_permissions`, thêm một dòng, và **tin rằng phân quyền vừa thay đổi**.
⛔ **Không có gì thay đổi.** Hàng rào thật vẫn là RLS ở bậc ⑦ và `guard.ts` ở
bậc ⑤ — cả hai đều ⛔ **không đọc** bốn bảng đó.

### 17.3.2 🔑 Hệ quả cho `ADR-023` — **rẻ hơn Board tưởng**

Board duyệt hướng *"Capability Layer"*. **Nó ⛔ không phải xây mới.**
`permissions(code, **module**)` đã là **đúng hình dạng** của tầng Capability —
gom quyền theo **năng lực** *(`WAREHOUSE` · `SEWING` · `QA`)*, ⛔ không theo
đường dẫn.

⇒ `ADR-023` đổi từ *"xây một tầng mới"* thành ***"quyết số phận một tầng đã có
mà ⛔ không ai nối dây"*** — và đó là câu hỏi **rẻ hơn nhiều**.

### 17.3.3 ⚠️ Mô hình A ⛔ **không** biểu diễn được kiêm nhiệm

`app_metadata.role` là **một chuỗi** ⇒ một người **đúng một vai**. Nhưng:

- `RA-2` §9.2.1 nói người **kiêm nhiệm được** — thực tế nhà máy;
- `Q-12` §12.2 ghi `giamdoc` phủ **ba** vị trí điều hành.

⇒ **Mô hình A ⛔ KHÔNG có chỗ để biểu diễn hai điều đó.** Mô hình B thì có
*(`user_roles` là N:N)*. Đây là **lý do kiến trúc**, ⛔ không phải sở thích, để
Board ⛔ không xoá bốn bảng đó đi. ⇒ **`Q-14`**

## 17.4 Bảng User Profile — **đo lại**

| # | Trường | Trạng thái thật | Migration |
|---|---|---|---|
| 2 | Password | ✅ Supabase Auth | ✅ KHÔNG |
| 9 | Role | ✅ `app_metadata.role` — **chỉ đọc** | ✅ KHÔNG |
| 8 | **Department** | ✅ **`profiles.department_id` ĐÃ CÓ** ← *đính chính* | ✅ **KHÔNG** — chỉ cần **nối dây** |
| 3 | Language | 🟠 có `lib/i18n`, ⛔ không lưu vào `profiles` | 🟠 thêm **cột** |
| 1 | Avatar | ⛔ ⛔ không có | 🔴 CÓ + Storage |
| 4 | Theme | ⛔ ⛔ không có | 🔴 CÓ — `UP-5` |
| 5 | Notification | ⛔ ⛔ không có | 🔴 CÓ |
| 6 | Signature | ⛔ ⛔ không có | 🔴 CÓ — `UP-4` |
| 7 | Contact | ⛔ ⛔ không có trên `profiles` | 🔴 CÓ |
| 10 | Manager | ⛔ ⛔ không có `manager_id` | 🔴 CÓ |

**⇒ 3 đã có · 1 một phần · 6 cần migration** *(Rev 4 ghi 7 — sai 1)*.

## 17.5 ⚠️ `departments` **ĐÃ CÓ CẤU TRÚC** — nhưng ⛔ chưa kết luận được về DỮ LIỆU

`S001_business_baseline.sql` gieo **17 bảng nghiệp vụ** *(orders · styles ·
cut_tickets · assignments · shipments…)* và **⛔ KHÔNG gieo `departments`,
`profiles`, `employees`**.

⇒ Theo **`V.1`** *(⛔ không kết luận trên bảng rỗng)*: tôi khẳng định **cấu trúc
tồn tại**, và ⛔ **không** khẳng định gì về **nội dung**. Cây 16 đơn vị Board cung
cấp ở §12.1 **có chỗ để chứa**, nhưng **⛔ chưa đo được là đã có ai trong đó
chưa**. ⇒ **`Q-15`**

## 17.6 ⚠️ `employees` ⟷ `profiles` là **hai loại người khác nhau**

| Bảng | Là ai | Có tài khoản? |
|---|---|---|
| `profiles` | người **đăng nhập hệ thống** | ✅ khoá ngoại tới `auth.users` |
| `employees` | **công nhân xưởng** — thợ may, thợ trải vải | ⛔ **KHÔNG** |

🔑 **Điều này ⛔ không phải trùng lặp — nó đúng.** Hàng nghìn công nhân có **sản
lượng, chấm công, lỗi** ghi vào hệ thống mà **⛔ không bao giờ đăng nhập**. Bất
kỳ đề xuất nào *"gộp hai bảng cho gọn"* sẽ ép cấp tài khoản cho toàn xưởng.
⇒ Ghi vào tài liệu để ⛔ không ai gộp.

---

# §18 · BUSINESS OBJECT LAYER

## 18.1 Chuỗi đầy đủ — Role **⛔ không** còn ở trung tâm

```
Business Object → Business Process → Capability → Workspace → Role ⊕ Assignment → Permission
   "cái gì tồn tại"   "chảy thế nào"  "làm được gì"  "làm ở đâu"    "tôi là ai"      "được gì
                                                                   + được giao gì"   trên DÒNG này"
```

⚠️ **Tôi bổ sung `⊕ Assignment` vào chuỗi Board đưa ra.** Lý do — và đây là góp ý
⛔ không phải phản đối:

> Chuỗi `… → Workspace → Role → Permission` vẫn để **Role là tiếng nói cuối cùng**
> về quyền. Playbook **Điều XXX** cấm đúng điều đó: *"Vai trò chỉ là nhóm quyền
> **mặc định**"*. ⛔ Không có `Assignment` trong chuỗi, ta **tái lập chính lỗi
> Board đang muốn tránh**, chỉ lùi nó xuống một bậc.

⇒ **Role cho MẶC ĐỊNH. Assignment cho PHẠM VI. Permission là giao của hai.**

## 18.2 Hai mô hình **⛔ không** cạnh tranh — chúng **vuông góc**

| | Chuỗi Business Object *(§18)* | Chuỗi 7 bậc *(§15)* |
|---|---|---|
| Trả lời | *"cái gì **tồn tại** và ai chịu trách nhiệm"* | *"**chặn** ở đâu"* |
| Loại | **bản thể** | **thực thi** |
| Gặp nhau ở | 🔑 **Business Object *chính là* thứ bậc ⑦ (RLS) bảo vệ** | |

🔑 **RLS ⛔ không bảo vệ "vai" hay "màn hình" — nó bảo vệ DÒNG của một Business
Object.** Đó là chỗ hai mô hình khớp vào nhau, và là lý do cả hai đều cần thiết.

## 18.3 Danh mục Business Object — dựng từ **85 bảng thật**

| Business Process | Business Object *(gốc tổng hợp)* | Bảng thật |
|---|---|---|
| **Tiếp nhận nhu cầu** | `Inquiry` · `Customer` | `inquiries` · `customers` · `customer_contacts` |
| **Phát triển mẫu** | `Style` · `Sample` | `styles` · `style_bom` · `style_colorways` · `style_sizes` · `style_operations` · `sample_submissions` |
| **Định giá** | `Costing` | `costings` · `costing_items` |
| **Chốt đơn** | `Order` | `orders` · `order_items` · `order_size_breakdown` · `order_milestones` |
| **Mua nguyên phụ liệu** | `PurchaseOrder` · `Supplier` | `purchase_orders` · `purchase_order_items` · `suppliers` |
| **Nhập kho** | `InboundReceipt` · `Material` | `inbound_receipts` · `inbound_receipt_items` · `materials` · `material_lots` · `material_inspections` · `fabric_rolls` |
| **Quản lý tồn** | `Stock` · `WarehouseTopology` | `stock_levels` · `stock_movements` · `stock_adjustments` · `stock_counts` · `stock_reservations` · `warehouses` · `wh_zones` · `wh_racks` · `wh_bins` |
| **Xuất kho SX** | `OutboundIssue` · `MaterialRequest` | `outbound_issues` · `outbound_issue_items` · `material_requests` |
| **Cắt** | `CutTicket` | `cut_tickets` · `cut_bundles` · `cut_ticket_rolls` · `cut_attachments` |
| **May** | `ProductionOrder` | `production_orders` · `daily_production_logs` · `hourly_production_logs` · `sewing_lines` · `needle_break_logs` |
| **Hoàn thành** | `FinishingLog` | `finishing_logs` |
| **Kiểm chất lượng** | `QaAuditReport` · `DefectCatalog` | `qa_audit_reports` · `qa_defects` · `defect_catalog` · `capa_logs` |
| **Gia công ngoài** | `SubconOrder` · `Subcontractor` | `subcon_orders` · `subcon_issue_logs` · `subcon_receipt_logs` · `subcontractors` |
| **Đóng gói · Giao** | `Shipment` · `Carton` | `shipments` · `shipment_cartons` · `cartons` |
| **Giao việc** *(xuyên suốt)* | `Assignment` | `assignments` · `assignment_bundles` · `assignment_daily_reports` · `assignment_commercial_terms` |
| **Đối tác** *(xuyên suốt)* | `Partner` | `partners` · `partner_accounts` · `partner_permissions` · `buyer_accounts` |
| **Nhân sự xưởng** | `Employee` · `Attendance` | `employees` · `attendance_logs` |
| **Tổ chức · Người dùng** | `Organization` · `UserProfile` | `departments` · `profiles` · `roles` · `user_roles` · `permissions` · `role_permissions` |
| **Kiểm toán** *(nền tảng)* | `ActivityLog` | `activity_log` · `wh_audit_log` · `mos_aggregate_immutability` |
| **Quản trị thay đổi** | `ChangeRequest` · `RiskAssessment` | `change_requests` · `risk_assessments` |
| **Trao đổi · Hồ sơ** | `Communication` · `Attachment` | `communications` · `attachments` · `md_comments` · `md_documents` |

**≈ 26 Business Object trên 21 Business Process.**

## 18.4 Bốn luật của Business Object Layer

| # | Luật | Vì sao |
|---|---|---|
| `BO-1` | **Mỗi Business Object có ĐÚNG MỘT Business Process sở hữu** *(process **tạo ra** nó)*; process khác chỉ **ĐỌC** | hai process cùng ghi ⇒ hai nguồn chân lý cho **cùng một sự thật** |
| `BO-2` | **Business Object là thứ RLS bảo vệ** | nối §18 với §15 bậc ⑦ — xem 18.2 |
| `BO-3` | 🔑 **Định nghĩa một Business Object ⛔ KHÔNG được nhắc tới VAI TRÒ** | phải nhắc tới vai để định nghĩa một đối tượng ⇒ **đối tượng đó ⛔ chưa được định nghĩa xong**. Đây là **phép thử** giữ Role khỏi trung tâm |
| `BO-4` | **`Permission = Role ⊕ Assignment`**, ⛔ không phải `Role` một mình | Điều XXX — xem 18.1 |

### 18.4.1 🔑 `BO-3` là phép thử, và nó **bắt được lỗi thật ngay hôm nay**

Áp `BO-3` vào `MODULE_ACCESS`:

```
/subcon  ⇐ md · kho · totruongmay · giamdoc
```

Hôm nay `/subcon` được định nghĩa bằng câu *"bốn vai này vào được"*. Theo `BO-3`
đó là **định nghĩa chưa xong**. Định nghĩa đúng là: *`SubconOrder` là Business
Object của Business Process **Gia công ngoài***; bốn vai kia chỉ là **hệ quả**
của việc process đó chạm vào bốn Capability.

⇒ Đảo chiều này chính là điều Board yêu cầu ở mục ①, và `TD-40` là **cùng một
vấn đề nhìn từ tầng thực thi**.

---

# §19 · MODULE OWNERSHIP

## 19.1 `Business Owner` là gì — và ⛔ **không** phải gì

> **Business Owner = người quyết định LUẬT NGHIỆP VỤ của Module và THỨ TỰ ƯU
> TIÊN phát triển nó.**

| ⛔ **KHÔNG** phải | Vì sao |
|---|---|
| ⛔ người quản lý trực tiếp | Board đã nói rõ. Sở hữu đi theo **năng lực**, ⛔ không theo sơ đồ báo cáo |
| ⛔ người dùng Module nhiều nhất | Thủ kho dùng `/kho` mỗi ngày nhưng ⛔ không quyết luật nhập xuất |
| ⛔ người có quyền cao nhất trong Module | 🔴 xem `MO-1` |
| ⛔ chủ sở hữu kỹ thuật | IT sở hữu **cách chạy**; Business Owner sở hữu **chạy cái gì** |

## 19.2 Bốn luật

| # | Luật | Vì sao |
|---|---|---|
| `MO-1` | 🔴 **Ownership là TRÁCH NHIỆM, ⛔ KHÔNG phải ĐẶC QUYỀN. Cấm suy quyền từ ownership** | ⛔ Không có luật này, *"chủ Module"* sẽ dần thành *"tài khoản vượt mọi RLS trong Module"* — đúng một `superadmin` thứ hai, mọc lên **mười sáu lần** |
| `MO-2` | **Owner gắn vào Business Process; Module KẾ THỪA** | Module **tách/gộp được**; Business Process bền hơn. Gắn thẳng vào Module ⇒ mỗi lần tách Module là một lần tranh chấp sở hữu |
| `MO-3` | **Mỗi Module ĐÚNG MỘT Owner** | hai chủ = ⛔ không chủ nào |
| `MO-4` | **Khai bằng ĐƠN VỊ TỔ CHỨC trước, con người sau** | người nghỉ việc; đơn vị bền hơn. Đơn vị là **mặc định**, người là **chỉ định** |

## 19.3 Bảng sở hữu 16 Module

| Module | Business Process sở hữu | **Business Owner** *(đơn vị)* |
|---|---|---|
| `executive` | Điều hành | **CEO** |
| `commercial` | Tiếp nhận nhu cầu · Chốt đơn | **Director Business** |
| `merchandising` | Phát triển mẫu · Định giá | **Merchandising** |
| `planning` | Hoạch định năng lực | **Planning** |
| `production` | Cắt · May · Hoàn thành | **Director Production** |
| `quality` | Kiểm chất lượng | **QA** |
| `warehouse` | Nhập · Tồn · Xuất | **Warehouse** |
| `shipment` | Đóng gói · Giao | 🔴 **⛔ KHÔNG CÓ** — `Q-10` |
| `subcontract` | Gia công ngoài | 🔴 **⛔ KHÔNG CÓ** — `Q-11` |
| `finance` | Định giá · Công nợ | **Finance** |
| `humanResources` | Nhân sự xưởng | **HR** |
| `reporting` | *(toàn cục)* | **CEO** — ⚠️ `Q-16` |
| `communication` | *(toàn cục)* | **Administration** — ⚠️ `Q-16` |
| `ai` | *(toàn cục)* | **IT** — ⚠️ `Q-16` |
| `documents` | *(toàn cục)* | **Administration** — ⚠️ `Q-16` |
| `platform` | Nền tảng | **IT** |

### 19.3.1 🔴 Hai Module **đang chạy thật** mà ⛔ không ai chịu trách nhiệm

`shipment` và `subcontract` ⛔ **không có đơn vị nào trên cây tổ chức** *(`Q-10`
`Q-11`, §12.2.2)*. Rev 4 tôi ghi đó là *"thiếu ô trên sơ đồ"*. **Ownership cho
thấy nó nặng hơn thế:**

```
/xuat-hang và /subcon đang CHẠY THẬT, có dữ liệu THẬT, có 4 vai dùng.
Và ⛔ KHÔNG AI quyết định luật nghiệp vụ của chúng.
```

⇒ Khi hai Module này cần đổi quy tắc, **⛔ không có ai để hỏi** — quyết định sẽ
rơi vào tay người **viết mã**, tức bậc 6 của thứ bậc văn bản. ⇒ **`Q-10` `Q-11`
nâng từ 🟠 lên 🔴.**

### 19.3.2 ⚠️ `Q-16` — bốn Global Service khó gán chủ

`reporting` · `communication` · `ai` · `documents` phục vụ **mọi** phòng ban ⇒
⛔ không phòng nào tự nhiên là chủ. Bốn gán ở trên là **đề xuất**, ⛔ không phải
kết luận. Board cần chốt.

---

# §20 · MODULE IDENTITY STANDARD *(hợp nhất — 10 trường)*

## 20.1 Bảy trường Board yêu cầu ⊕ ba trường Rev 3

| # | Trường | Nguồn | Trạng thái |
|---|---|---|---|
| 1 | **Icon** | `home-modules.ts` — `lucide-react` | ✅ có |
| 2 | **Color** | `MODULE_IDENTITY` — 16 dải | ✅ có · ⚠️ `TD-41` |
| 3 | **Module Name** | `home-modules.ts` — ⛔ **KHÔNG dịch** *(§45.3)* | ✅ có |
| 4 | **Department** | `Module Catalog` §8.5 ⊕ **Owner** §19.3 | 🟠 tài liệu có, mã ⛔ chưa |
| 5 | **Business Value** | một câu — cho Sales · Investor | 🔴 **thiếu** |
| 6 | **Tagline** | 3–5 từ, `A • B • C` — cho người vận hành | 🔴 **thiếu** |
| 7 | **Permission State** | **tính lúc dựng trang** — xem 20.2 | 🔴 **thiếu** |
| 8 | `key` | `ModuleKey` | ✅ có |
| 9 | `route` | union phân biệt — `COMING_SOON` ⛔ không có trường này | ✅ có |
| 10 | `capability` | `permissions.module` — §17.3.2 | 🟠 **CSDL có, ⛔ chưa nối** |

## 20.2 `Permission State` — bốn giá trị

| Giá trị | Khi nào | Hiện thế nào | Bấm thì sao |
|---|---|---|---|
| `AUTHORIZED` | đã đăng nhập **và** có quyền | **nổi bật** — đủ màu | mở Workspace |
| `UNAUTHORIZED` | đã đăng nhập, ⛔ không quyền | **làm mờ** — ⛔ **KHÔNG ẨN** | → 403 *(`EP-3`)* |
| `COMING_SOON` | ⛔ chưa có route | nhãn *"Sắp có"* · ⛔ không bấm được | — |
| `ANONYMOUS` | ⛔ chưa đăng nhập | bình thường, ⛔ không phân biệt | → `/login` |

⚠️ **`ANONYMOUS` ⛔ KHÔNG được suy thành `UNAUTHORIZED`.** Với khách, hệ thống
**⛔ không biết** họ sẽ có quyền gì ⇒ làm mờ là **nói dối**. Mọi ô hiện như nhau.

🔑 **`Permission State` nằm ở bậc ③ — TRẢI NGHIỆM, ⛔ không phải AN NINH
*(`PA-1`)*.** Vì vậy tính nó ở client là **an toàn**: nó ⛔ **chưa bao giờ** là
hàng rào. Hàng rào là bậc ⑤ ⑥ ⑦. Đây chính là `PA-2` — và `Permission State` là
**cơ chế thực thi** quyết định *"hiện toàn bộ + làm nổi bật"* của Board:
**làm mờ ⛔ ≠ ẩn.**

---

# §21 · TỔNG HỢP Rev 5

## 21.1 Vấn đề phát hiện

| # | Vấn đề | Mức |
|---|---|---|
| `TD-42` | 🔴 **Mô hình phân quyền MA** — 4 bảng RBAC trong `001`, ⛔ **không policy RLS nào** dùng. Người sau sẽ sửa chúng và **tin rằng quyền đã đổi** | 🔴 **cao** |
| `Q-10` `Q-11` | **`shipment` · `subcontract` chạy thật, ⛔ KHÔNG AI sở hữu** — nâng từ 🟠 | 🔴 **cao** |
| `Q-14` | Mô hình A *(một vai/người)* **⛔ không biểu diễn được kiêm nhiệm**; Mô hình B thì có | 🟠 vừa |
| `Q-15` | `departments` **có cấu trúc**, ⛔ **chưa đo được dữ liệu** *(`V.1`)* | 🟠 vừa |
| `Q-16` | 4 Global Service ⛔ không có chủ tự nhiên | 🟠 vừa |
| — | `employees` ⟷ `profiles` là **hai loại người** — ghi để ⛔ không ai gộp | 🟢 ghi nhận |

## 21.2 Giả định bị bác bỏ *(Rev 5 — cả ba đều của tôi)*

| Giả định | Phán quyết |
|---|---|
| *"Organization Structure ⛔ chưa tồn tại"* | 🔴 **SAI** — `departments.parent_id` đã có từ `001` |
| *"`Department` trong Profile cần migration"* | 🔴 **SAI** — `profiles.department_id` đã có |
| *"7/10 trường Profile cần migration"* | 🟠 **SAI SỐ** — đúng là **6/10** |
| *"Capability Layer phải xây mới"* | 🟠 **SAI** — `permissions(code, module)` đã đúng hình dạng, chỉ **⛔ chưa nối dây** |

**Nguyên nhân chung: tôi tìm sai tên bảng** *(`user_profile` ⟷ `profiles`)*.
Một phép đo âm tính chỉ chứng minh được **điều đã hỏi**.

## 21.3 Tác động ADR

| ADR | Cập nhật sau Rev 5 |
|---|---|
| **`ADR-023`** | 🔑 **rẻ hơn nhiều** — ⛔ không "xây tầng Capability" mà **"quyết số phận tầng đã có"**. Kèm `TD-42` |
| **`ADR-021`** | ⛔ không đổi — §13.3 + §15.3 + §13.1 |
| **`ADR-022`** | ⛔ không đổi — §13.5, quyết riêng |
| **`ADR-024`** | ⛔ không đổi — Signature versioning |
| **`ADR-025`** *(mới, đề nghị)* | 🟠 **Module Ownership** — `MO-1` là điều khoản an ninh, ⛔ không chỉ là quản trị |

## 21.4 Khuyến nghị cuối cùng — Rev 5

```
╔═══════════════════════════════════════════════════════════════════════╗
║  ① XỬ LÝ `TD-42` TRƯỚC KHI KHOÁ BA-1.                                ║
║     Bốn bảng RBAC trông đầy thẩm quyền và ⛔ không điều khiển gì. Một  ║
║     tài liệu nền Enterprise Architecture ⛔ KHÔNG được để lại một mô   ║
║     hình phân quyền ma — người sau sẽ sửa nó và tin là quyền đã đổi.  ║
║     Ba đường: nối dây · xoá bỏ · hoặc GHI RÕ "⛔ chưa dùng" ngay       ║
║     trong lược đồ. Đường thứ ba rẻ nhất và phải làm NGAY.             ║
║                                                                       ║
║  ② `MO-1` PHẢI VÀO ADR, ⛔ KHÔNG chỉ vào tài liệu.                    ║
║     "Ownership là trách nhiệm, ⛔ không phải đặc quyền." ⛔ Không có   ║
║     câu này, "chủ Module" sẽ dần thành superadmin thứ hai — mọc lên   ║
║     MƯỜI SÁU lần.                                                     ║
║                                                                       ║
║  ③ `BO-3` LÀ PHÉP THỬ, ⛔ KHÔNG phải khẩu hiệu.                       ║
║     "Định nghĩa Business Object ⛔ không được nhắc tới vai trò." Áp    ║
║     vào /subcon là thấy ngay định nghĩa hiện tại ⛔ chưa xong. Đây là  ║
║     công cụ giữ Role khỏi trung tâm mà Board yêu cầu ở mục ①.         ║
║                                                                       ║
║  ④ TRẢ LỜI `Q-10` `Q-11` — nay là 🔴, ⛔ không còn 🟠.                 ║
║     Hai Module đang chạy thật mà ⛔ KHÔNG AI quyết luật nghiệp vụ.     ║
║     Quyết định sẽ rơi vào tay người viết mã — bậc 6 của thứ bậc.      ║
║                                                                       ║
║  ⑤ `Permission = Role ⊕ Assignment`, ⛔ không phải Role một mình.     ║
║     Chuỗi Board đưa ra vẫn để Role nói tiếng cuối cùng về quyền.      ║
║     Thêm Assignment giữ đúng Điều XXX và hoàn tất ý định của Board.   ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

> **Trạng thái Rev 5:** ⏳ trình Board. ⛔ Chưa viết một dòng Production Code nào.

---
---

# §22 · REVISION 6 — NGUỒN CHÂN LÝ DUY NHẤT CHO PHÂN QUYỀN

## 22.1 🔴 Câu hỏi Board đặt ra có một tiền đề cần sửa trước

> *"Permission lấy từ Application Model, Database Model, hay mô hình hợp nhất?"*

⚠️ **Cả hai mô hình A và B đều ⛔ KHÔNG phải nguồn chân lý hôm nay.**

```
lib/rbac.ts  ─── đọc ──► app_metadata.role  ◄── đọc ─── policy RLS
                          (claim trong JWT)
                                 ▲
                     nguồn chân lý THẬT SỰ hôm nay

roles · permissions · role_permissions · user_roles
                     ⛔ KHÔNG AI ĐỌC          ← TD-42
```

| | Vai trò thật |
|---|---|
| **`app_metadata.role`** | 🔑 **nguồn chân lý de facto** — cả tầng ứng dụng lẫn RLS đều đọc **chính nó** |
| **Mô hình A** *(`lib/rbac.ts`)* | **bảng tra** *(vai → tiền tố route)*, ⛔ **không** phải nguồn |
| **Mô hình B** *(4 bảng CSDL)* | **bản sao thứ ba, ⛔ không dẫn xuất từ đâu và ⛔ không ai đọc** |

⇒ Trả lời chính xác: **hệ thống ⛔ không có hai mô hình song song — nó có MỘT
claim làm nguồn, MỘT bảng tra tĩnh, và MỘT lược đồ mồ côi.**

## 22.2 Ba phương án — đánh giá

### ① Application Model làm chuẩn *(giữ `rbac.ts`, xoá 4 bảng)*

| ✅ | 🔴 |
|---|---|
| đơn giản nhất · ⛔ không lệch · chạy được Edge | **đổi phân quyền = phải DEPLOY** |
| | **⛔ không biểu diễn được kiêm nhiệm** *(`Q-14`)* |
| | **RLS ⛔ không đọc được file `.ts`** ⇒ bậc ⑦ vẫn phải dựa vào claim ⇒ *"nguồn duy nhất"* **⛔ không đạt được** |

### ② Database Model làm chuẩn *(nạp 4 bảng, mọi tầng đọc CSDL)*

| ✅ | 🔴 |
|---|---|
| quyền là **DỮ LIỆU** — đổi ⛔ không cần deploy | 🔴 **`middleware.ts` chạy Edge — ⛔ KHÔNG được truy vấn CSDL mỗi lần điều hướng** |
| `user_roles` N:N ⇒ **kiêm nhiệm được** | 🔴 **Quy tắc `K-3`**: policy truy vấn `user_roles` sẽ **chịu RLS trên chính `user_roles`** ⇒ biến *khoanh vùng* thành *chặn phẳng* |
| `permissions.module` = **tầng Capability sẵn có** | ⇒ bắt buộc bắc cầu bằng `SECURITY DEFINER` ⇒ **một lỗ khoét mới** phải ghi vào Registry |

### ③ Hợp nhất **BẤT ĐỐI XỨNG** — 🔑 **KHUYẾN NGHỊ**

```
NGUỒN CHÂN LÝ DUY NHẤT = MÔ HÌNH CSDL (B)

Bậc ②③④  TRẢI NGHIỆM  ──► đọc CLAIM đã chiếu vào app_metadata
                            (nhanh · Edge-safe · CHẤP NHẬN được CŨ)

Bậc ⑤⑥⑦  AN NINH      ──► đọc THẲNG CSDL
                            (thu hồi có hiệu lực NGAY)
```

## 22.3 🔑 Vì sao đường ranh giới rơi đúng chỗ đó — nó ⛔ **không** phải lựa chọn mới

`PA-1` *(Rev 4, Board đã duyệt)* đã vạch sẵn: **bậc ①–④ là TRẢI NGHIỆM, bậc ⑤–⑦
là AN NINH.**

Và đó **chính xác** là đường phân định *"chỗ nào chịu được dữ liệu cũ"*:

| | Bậc ②③④ | Bậc ⑤⑥⑦ |
|---|---|---|
| Sai thì sao? | **một cú bấm hụt** | 🔴 **một lỗ hổng** |
| Chịu được claim cũ? | ✅ **có** | 🔴 **⛔ KHÔNG** |

🔑 **Kiến trúc ⛔ không phải do tôi chọn — nó rơi ra từ một nguyên tắc Board đã
duyệt.** Đó là dấu hiệu `PA-1` là nguyên tắc đúng.

## 22.4 ⚠️ Cái bẫy phải nói rõ: **claim là ẢNH CHỤP, ⛔ không phải sự thật sống**

Dự án **đã trả giá cho bài học này rồi**, và nó nằm ngay trong `CLAUDE.md`:

> *"`Actor.partnerId` phải phân giải từ bảng `partner_accounts` (có `is_active`),
> **⛔ không** lấy từ claim trong JWT — **claim ⛔ không đổi khi quan hệ đối tác
> chấm dứt**."*

⇒ **`SSoT-1`:** claim được phép dùng cho bậc ②③④. **Cấm** dùng claim cho bất kỳ
phán quyết nào mà **thu hồi phải có hiệu lực ngay**. Đó là toàn bộ bậc ⑤⑥⑦.

⇒ **`SSoT-2`:** mọi phán quyết ở bậc ⑦ phải kiểm **trạng thái sống** *(`is_active`
· `deleted_at`)*, ⛔ không chỉ kiểm vai.

## 22.5 Lộ trình — bốn bước, ⛔ **không** làm một lần

| # | Bước | Rủi ro | Điều kiện |
|---|---|---|---|
| **B0** | 🔴 **DÁN NHÃN `TD-42` NGAY** — ghi `-- ⛔ CHƯA NỐI DÂY` vào 4 bảng | ⛔ **không** | ⛔ không cần ADR · **làm được hôm nay** |
| **B1** | Nạp dữ liệu 4 bảng cho **khớp** `MODULE_ACCESS` hiện hành | thấp — **⛔ chưa ai đọc** | `ADR-023` |
| **B2** | Bậc ⑤⑥ đọc CSDL qua `SECURITY DEFINER` *(bắc cầu `K-3`)* | 🔴 **cao** | `ADR-023` + Registry + hồi quy |
| **B3** | Chiếu claim từ CSDL; `rbac.ts` còn lại **kiểu + bảng tra** | vừa | sau B2 |

⚠️ **`B0` là việc rẻ nhất và cấp nhất trong toàn bộ Rev 6.** Nó ⛔ không sửa kiến
trúc — nó chỉ **ngăn người sau hiểu nhầm**. Bốn bảng đó sẽ nằm đó **hàng tháng**
trước khi `ADR-023` xong.

---

# §23 · BUSINESS DOMAIN LAYER — TÁM TẦNG

## 23.1 Chuỗi đầy đủ

```
① Business Domain    "lĩnh vực nào của doanh nghiệp"      14 Domain
② Business Object    "cái gì tồn tại · RLS bảo vệ cái gì" ≈26 · §18.3
③ Business Process   "nó chảy thế nào"                    21 · §18.3
④ Capability         "làm được việc gì"                   permissions.module
⑤ Workspace          "làm ở đâu"                          cây app/
⑥ Role               "tôi là ai"          → MẶC ĐỊNH      lib/rbac.ts · roles
⑦ Assignment         "được giao cái gì"   → PHẠM VI       assignments
⑧ Permission         "được gì trên DÒNG này"              phán quyết lúc chạy
```

## 23.2 Vai trò và quan hệ từng tầng

| Tầng | Trả lời | Quan hệ | Đổi khi |
|---|---|---|---|
| ① **Domain** | *lĩnh vực* | `1 : N` Object | đổi **mô hình kinh doanh** — gần như ⛔ không |
| ② **Object** | *danh từ nghiệp vụ* | **1 : 1** Process sở hữu *(`BO-1`)* · `1 : N` process đọc | thêm nghiệp vụ mới |
| ③ **Process** | *động từ nghiệp vụ* | `1 : N` Capability | đổi **quy trình** |
| ④ **Capability** | *năng lực* | `N : M` Workspace | tách/gộp năng lực |
| ⑤ **Workspace** | *bề mặt* | `N : M` Capability | **quyết định sản phẩm** |
| ⑥ **Role** | *nhóm quyền mặc định* | `N : M` Capability · `N : M` người | **tuyển · thăng chức** |
| ⑦ **Assignment** | *phạm vi tài nguyên* | `N : M` Object instance | **hằng ngày** |
| ⑧ **Permission** | *phán quyết* | hàm của ⑥ ⊕ ⑦ ⊕ instance | **mỗi request** |

## 23.3 🔑 Chuỗi chạy từ **BỀN NHẤT** tới **BIẾN ĐỘNG NHẤT** — và đó là quy tắc thiết kế

```
①────────②────────③────────④────────⑤────────⑥────────⑦────────⑧
BỀN                                                          BIẾN ĐỘNG
gần như ⛔ không đổi                                    đổi mỗi request

         ĐƯỢC PHÉP LÀ MÃ           │        BẮT BUỘC LÀ DỮ LIỆU
         ①②③④⑤                     │        ⑥⑦⑧
```

⇒ **`BD-1`:** tầng ①–⑤ được phép khai bằng **mã/cấu hình** — chúng đổi theo
**mô hình kinh doanh**, và mỗi lần đổi **xứng đáng** một lần deploy.
Tầng ⑥–⑧ **bắt buộc là dữ liệu** — chúng đổi theo **con người**, và ⛔ không ai
deploy để cho một nhân viên mới vào làm.

### 23.3.1 🔴 Hôm nay tầng ⑥ đang **sai phía** của đường kẻ

```
lib/rbac.ts:  export type Role = 'superadmin' | 'giamdoc' | ... (14 giá trị)
```

**Vai đang là MÃ.** ⇒ Thêm một vai = sửa union + `MODULE_ACCESS` + `ROLE_LABEL`
+ `ROLE_HOME` + **deploy**. Với 6 phòng ban ⛔ chưa có vai *(§12.2)*, đó là **sáu
lần deploy** cho một việc lẽ ra là **sáu dòng `INSERT`**.

🔑 **`TD-40` · `Q-14` · `TD-42` là BA TRIỆU CHỨNG của CÙNG MỘT bệnh: tầng ⑥ nằm
sai phía của `BD-1`.** Và `§22` phương án ③ chính là thuốc.

### 23.3.2 `BD-2` — mỗi tầng chỉ được biết tầng **liền kề**

Tầng ⑧ ⛔ **không** được hỏi *"người này thuộc Domain nào"*. Nó hỏi Assignment.
⛔ Không có luật này, mọi tầng sẽ nói chuyện thẳng với mọi tầng và mô hình 8 tầng
trở thành **8 cái tên cho một mớ dây**.

---

# §24 · MODULE OWNER — HAI LOẠI CHỦ

## 24.1 Định nghĩa

| | **Business Owner** | **Technical Owner** |
|---|---|---|
| Sở hữu | **CHẠY CÁI GÌ** — luật nghiệp vụ | **CHẠY THẾ NÀO** — hiện thực |
| Quyết | quy tắc · trạng thái hợp lệ · thứ tự ưu tiên | lược đồ · chỉ mục · policy · hiệu năng |
| Là | **đơn vị tổ chức** *(§19.3)* | **IT** |
| Trả lời | *"chứng từ này được sửa sau khi duyệt ⛔ không?"* | *"chặn bằng trigger hay bằng policy?"* |
| ⛔ **KHÔNG** quyết | cách hiện thực | **luật nghiệp vụ** |

🔑 **Ranh giới sắc gọn:** Business Owner nói ***"⛔ không được sửa sau khi
duyệt"***. Technical Owner chọn `045` Aggregate Immutability Engine. **Đảo
chiều là hỏng**: IT tự đặt luật nghiệp vụ ⇒ bậc 6 leo lên bậc 0.

## 24.2 Phạm vi quyết định

| Việc | Business Owner | Technical Owner | Board |
|---|---|---|---|
| Thêm trạng thái vào vòng đời chứng từ | ✅ **quyết** | tư vấn | — |
| Đổi `final_states` của một aggregate | đề xuất | tư vấn | 🔴 **quyết** *(ADR)* |
| Thêm cột / chỉ mục | tư vấn | ✅ **quyết** | ADR nếu chạm RLS |
| Đổi policy RLS | 🔴 **⛔ KHÔNG** | đề xuất | 🔴 **quyết** *(ADR)* |
| Thứ tự ưu tiên phát triển Module | ✅ **quyết** | — | — |
| Cấp quyền cho một người | 🔴 **⛔ KHÔNG** — xem `MO-5` | 🔴 **⛔ KHÔNG** | qua **Assignment** |

## 24.3 🔴 `MO-5` — MODULE OWNER ⛔ KHÔNG CÓ QUYỀN VƯỢT RLS

```
╔═══════════════════════════════════════════════════════════════════════╗
║  Ownership ⛔ KHÔNG được xuất hiện trong BẤT KỲ policy RLS nào.        ║
║  ⛔ KHÔNG cột `owner_id` nào được dùng làm điều kiện cấp quyền.        ║
║  Chủ Module đọc được đúng những dòng mà Assignment của họ cho phép —  ║
║  ⛔ KHÔNG hơn một dòng nào.                                            ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**Vì sao luật này bắt buộc:** ⛔ không có nó, `owner` sẽ dần thành một cột được
mượn trong policy *("chủ Module thì xem hết Module của mình chứ?")*. Đó là
**`superadmin` thứ hai, và nó mọc lên MƯỜI SÁU lần** — mỗi Module một cái.

### 24.3.1 Chủ Module cần **THẤY**, ⛔ không cần **VÀO**

Nhu cầu thật của Business Owner là **báo cáo tổng hợp**, ⛔ không phải đọc từng
dòng. Đó là một **Capability** *(`reporting`)* cấp qua Assignment — **ghi nhật
ký được, thu hồi được, rà soát được**. Ownership thì ⛔ **không** có ba tính chất
đó.

⇒ **`MO-6`:** Owner cần đọc dữ liệu thật ⇒ cấp bằng **Assignment tường minh**,
⛔ **không** bằng hệ quả của ownership.

### 24.3.2 `MO-5` **kiểm được bằng máy**

⇒ Đề nghị `ADR-025` kèm một phép kiểm tĩnh: **⛔ không policy RLS nào được nhắc
tới cột ownership**. Rẻ, chạy ⛔ không cần CSDL, và biến `MO-5` từ **lời hứa**
thành **hàng rào** — đúng tinh thần *"luật là dữ liệu"* đã trả cổ tức ở `045b`.

---

# §25 · ARCHITECTURE DECISION ROADMAP

## 25.1 Bảng lộ trình

| ADR | Mục tiêu | Phụ thuộc | Chặn cái gì | Trạng thái | Khi nào |
|---|---|---|---|---|---|
| **`ADR-021`** | Tu chính §13.3 *(Work Zone)* · §15.3 *(nút `Work`)* · §13.1 *(`sole purpose`)* | ⛔ **⛔ không** | 🔴 **toàn bộ mã Homepage + Work Zone** | 📝 đề nghị | 🥇 **NGAY — cổng vào của mọi việc UI** |
| **`ADR-022`** | Tu chính §13.5 — Homepage hiện **toàn bộ** Module | ⛔ không *(nhưng cùng chạm Điều 13 ⇒ nên đi cùng `021`)* | 🔴 cách dựng lưới Launcher | 📝 đề nghị · ⚠️ **Board ⛔ chưa nhắc ở Rev 6** | 🥈 cùng `021` |
| **`ADR-025`** | Module Ownership · **`MO-1`** · **`MO-5`** | `Q-10` `Q-11` `Q-16` | quản trị — ⛔ **không** chặn mã | 📝 đề nghị | 🥉 **rẻ, làm sớm** |
| **`ADR-023`** | 🔑 **Nguồn chân lý phân quyền** *(§22 ③)* + Capability Layer + `TD-42` | `SECURITY FREEZE` · `TC-1…TC-5` | 🔴 Workspace · vai mới · kiêm nhiệm | 📝 đề nghị · **lớn nhất** | 4️⃣ sau khi gỡ freeze |
| **`ADR-024`** | Signature versioning *(`UP-4`)* | ⛔ không | User Profile **Phase 2** | 📝 đề nghị | 5️⃣ cùng Profile P2 |

## 25.2 Đồ thị phụ thuộc

```
ADR-021 ──┬──► mã Homepage · Work Zone
ADR-022 ──┘

ADR-025 ──► (quản trị — ⛔ không chặn mã)   ⚠️ nhưng Q-10 Q-11 phải trả lời trước

SECURITY FREEZE ──► ADR-023 ──┬──► vai mới ⛔ không cần deploy
   (B2 · TC-1…TC-5)           ├──► kiêm nhiệm (Q-14)
                              └──► Workspace 4/7 khối

ADR-024 ──► User Profile Phase 2
```

🔑 **`ADR-021` ⛔ không phụ thuộc gì và chặn nhiều nhất ⇒ làm trước.**
🔴 **`ADR-023` phụ thuộc `SECURITY FREEZE` ⇒ ⛔ không khởi động được cho tới khi
Board cắt `B2`.**

## 25.3 ⚠️ Ba việc ⛔ **không** cần ADR — làm được ngay

| # | Việc | Vì sao ⛔ không cần ADR |
|---|---|---|
| **`B0`** | 🔴 Dán nhãn `-- ⛔ CHƯA NỐI DÂY` vào 4 bảng `TD-42` | **chú thích**, ⛔ không đổi hành vi |
| — | Bổ sung `tagline` + `businessValue` cho 16 Module | dữ liệu hiển thị · ⛔ không chạm quyền · ⛔ không chạm CSDL |
| — | Trả lời `Q-9`…`Q-16` | quyết định **nghiệp vụ**, thuộc Board *(bậc 0)* |

## 25.4 ⚠️ Hai ghi chú quản trị

| # | |
|---|---|
| ① | **`ADR-022` ⛔ không có trong danh sách Board nêu ở Rev 6.** Tôi giữ nó trong bảng vì §13.5 *(`"shall display **only**"`)* **vẫn mâu thuẫn** với *"hiện toàn bộ Module"*. ⇒ **`Q-17`: Board bỏ, hay gộp vào `ADR-021`?** ⛔ Không tự quyết |
| ② | **Số ADR phải được cấp tập trung.** `ADR-021`…`025` ở đây là **đề nghị**, ⛔ chưa cấp số. `GPR-001` `A-1` đang ghi **5 migration nằm dưới 3 ADR ⛔ chưa duyệt** — ⛔ đừng thêm một lớp số trùng lên trên đó |

---

# §26 · TỔNG HỢP Rev 6

## 26.1 Quyết định đề nghị

| # | Nội dung |
|---|---|
| **①** | **Nguồn chân lý = Mô hình CSDL**, hợp nhất **bất đối xứng**: bậc ②③④ đọc **claim**, bậc ⑤⑥⑦ đọc **CSDL** |
| **②** | Đường ranh giới **⛔ không phải lựa chọn mới** — nó là `PA-1`, Board đã duyệt |
| **③** | `BD-1`: tầng ①–⑤ **được phép là mã**; tầng ⑥–⑧ **bắt buộc là dữ liệu** |
| **④** | `MO-5`: ownership **⛔ KHÔNG BAO GIỜ** xuất hiện trong policy RLS — **kiểm được bằng máy** |
| **⑤** | `ADR-021` làm trước; `ADR-023` chờ gỡ freeze; **`B0` làm ngay, ⛔ không cần ADR** |

## 26.2 Vấn đề phát hiện *(Rev 6)*

| # | Vấn đề | Mức |
|---|---|---|
| `BD-1` | 🔴 **Tầng ⑥ `Role` đang là MÃ CỨNG — sai phía đường kẻ.** `TD-40` · `Q-14` · `TD-42` là **ba triệu chứng của một bệnh** | 🔴 cao |
| `SSoT-1` | Claim là **ảnh chụp** — dự án **đã trả giá** cho bài học này ở `partner_accounts` | 🔴 cao |
| `K-3` | Phương án ② *(CSDL thuần)* **⛔ không khả thi trực tiếp** — policy đọc `user_roles` sẽ tự chặn mình | 🟠 vừa |
| `Q-17` | `ADR-022` ⛔ không có trong danh sách Board — bỏ hay gộp? | 🟠 vừa |
| `B0` | 4 bảng `TD-42` sẽ nằm **hàng tháng** trước khi `ADR-023` xong | 🔴 **cấp** |

## 26.3 Khuyến nghị cuối cùng — Rev 6

```
╔═══════════════════════════════════════════════════════════════════════╗
║  ① LÀM `B0` HÔM NAY. Dán `-- ⛔ CHƯA NỐI DÂY` vào 4 bảng TD-42.       ║
║     ⛔ Không cần ADR · ⛔ không đổi hành vi · ngăn được đúng cái hiểu   ║
║     nhầm nguy hiểm nhất trong lược đồ. Bốn bảng đó sẽ còn nằm đó      ║
║     HÀNG THÁNG trước khi ADR-023 xong.                                ║
║                                                                       ║
║  ② CHỌN HỢP NHẤT BẤT ĐỐI XỨNG (§22 ③).                               ║
║     ⛔ Không phải vì nó dung hoà, mà vì đường ranh giới của nó TRÙNG   ║
║     KHÍT với PA-1 — nguyên tắc Board đã duyệt ở Rev 4. Chỗ nào sai    ║
║     chỉ gây "bấm hụt" thì chịu được claim cũ; chỗ nào sai gây lỗ      ║
║     hổng thì phải đọc CSDL sống.                                      ║
║                                                                       ║
║  ③ GHI `BD-1` VÀO ADR-023.                                           ║
║     "Tầng ①–⑤ được phép là mã; ⑥–⑧ bắt buộc là dữ liệu." Một câu     ║
║     này giải thích được CẢ BA khuyết tật TD-40, Q-14, TD-42 — và      ║
║     ngăn khuyết tật thứ tư cùng loại.                                 ║
║                                                                       ║
║  ④ `MO-5` PHẢI CÓ PHÉP KIỂM, ⛔ KHÔNG chỉ có câu chữ.                 ║
║     "⛔ Không policy RLS nào nhắc tới cột ownership" — rẻ, chạy ⛔ cần  ║
║     CSDL, và biến MO-5 từ LỜI HỨA thành HÀNG RÀO.                     ║
║                                                                       ║
║  ⑤ ADR-021 TRƯỚC. Nó ⛔ không phụ thuộc gì và chặn nhiều nhất.        ║
║     ADR-023 lớn nhất nhưng bị SECURITY FREEZE chặn ⇒ ⛔ không phải     ║
║     việc làm trước, dù nó quan trọng nhất.                            ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

> **Trạng thái Rev 6:** ⏳ trình Board. ⛔ Chưa viết một dòng Production Code nào.
