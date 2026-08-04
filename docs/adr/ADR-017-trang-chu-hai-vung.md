# ADR-017 — Trang chủ hai vùng: Launcher + Work Inbox

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-017 |
| **Trạng thái** | ✅ **APPROVED** — Board Decision 04/08/2026 |
| **Người soạn** | Chief Enterprise Architect |
| **Hiến pháp** | **Tu chính Điều 13** *(§13.3 · §13.5)* · liên quan §11 Smart Routing · Điều 42 |
| **Thay thế** | Mô hình trang chủ **một vùng** do [ADR-001](../architecture/adr/ADR-001-homepage-conceptual-model.md) *(Hiến pháp v1.1)* ấn định |
| **Migration** | ⛔ không có |
| **Thẩm quyền yêu cầu** | Board Decision 04/08/2026 · EDD-06 §2.4 |
| **Phát hiện bởi** | EDD-06 Architecture Consistency Audit · `C-3` |

---

## 1. Context

### 1.1 Mâu thuẫn đã được kiểm toán phát hiện `[VERIFIED]`

| Nguồn | Phát biểu |
|---|---|
| **Hiến pháp §13.3** *(ADR-001, v1.1)* | *"The Homepage serves as the unified entry point into the Business Operating System. It provides access to constitutional Business Workspaces, Global Services and Platform Services…"* — **một vùng: Launcher** |
| **EDD-05 §2.2** *(bậc 2′)* | Trang chủ có **HAI vùng**: ⓪ Công việc của tôi · ① Business Apps Launcher |

Board đã phê duyệt EDD-05. Nhưng vùng *"Công việc của tôi"* **⛔ không có chỗ hiến định** — Hiến pháp Điều 13 chỉ nói về Launcher.

### 1.2 Vì sao vùng Công việc ra đời

Chỉ thị Board *(04/08/2026)*:

> *"Khi người dùng đăng nhập, họ ⛔ không nên phải suy nghĩ mình phải vào Workspace nào trước. Trang đầu tiên nên là: **'Hôm nay tôi cần làm gì?'** Hệ thống tự tổng hợp toàn bộ công việc của người dùng từ tất cả các Domain mà họ có quyền truy cập."*

### 1.3 Bằng chứng đo được — Launcher một mình ⛔ không đủ

| Bằng chứng | Ý nghĩa |
|---|---|
| `[VERIFIED]` `MODULE_ACCESS` trong `lib/rbac.ts` — vai `md` cần **3 route**, `kho` cần **3 route**, `ketoanvattu` cần **2 route mang tên hai chức danh khác** | Người dùng thật làm việc **xuyên nhiều Workspace**. Launcher bắt họ **nhớ việc của mình nằm ở đâu** |
| EDD-05 §3.2 — Merchandiser có **10–20 việc/ngày** trải **5 Domain** | ⛔ Không ai mở lần lượt 5 Workspace mỗi sáng để tìm việc |
| EDD-05 §6 — 🔴 **⚪ *"Tôi đang chờ người khác"*** — mẫu nằm ở khách 11 ngày | Loại việc này **⛔ không thuộc Workspace nào** — nó là *khoảng trống giữa các Domain*, và Launcher ⛔ không có chỗ cho nó |

> 🔴 **Điểm quyết định:** Launcher trả lời *"tôi vào đâu"*. Nó ⛔ **không** trả lời *"hôm nay tôi phải làm gì"*. Hai câu hỏi khác nhau, và câu thứ hai là câu người dùng hỏi **mỗi sáng**.

---

## 2. Decision

### 2.1 Trang chủ có hai vùng hiến định

```
╔═══════════════════════════════════════════════════════════╗
║  ⓪ VÙNG CÔNG VIỆC · Work Inbox                            ║
║     động · cá nhân · đổi mỗi ngày                         ║
║     🔴 MẶC ĐỊNH MỞ khi đăng nhập                          ║
║     Trả lời: "hôm nay tôi cần làm gì?"                    ║
╠═══════════════════════════════════════════════════════════╣
║  ① VÙNG BUSINESS APPS · Launcher                          ║
║     ổn định · cấu trúc · học một lần rồi thuộc            ║
║     14 Workspace + 4 Global Service + 1 Platform Service   ║
║     Trả lời: "tôi vào đâu để làm việc chủ động?"          ║
╚═══════════════════════════════════════════════════════════╝
```

### 2.2 Tu chính §13.3

Đổi tên khoản: `13.3 Business Operating System Launcher` → 🔴 **`13.3 Homepage Structure`**

Nội dung mới:

> *"The Homepage serves as the unified entry point into the Business Operating System. It consists of **two constitutional zones**:*
>
> ***(a) The Work Zone*** *presents the work items requiring the user's attention across all Business Domains in which the user holds authorization. It is personal, dynamic, and shall be the default view upon sign-in.*
>
> ***(b) The Business Operating System Launcher*** *provides access to constitutional Business Workspaces, Global Services and Platform Services. It is structural, stable, and independent of daily operational state.*
>
> *Both zones are constitutional. Neither may be removed.*
>
> *The Homepage shall not be organized by organizational hierarchy, job titles or technical system modules."*

### 2.3 §13.5 giữ nguyên và được nhấn mạnh

Hiến pháp §13.5 *(Workspace Visibility)* đã đòi trang chủ **lọc theo quyền**. ADR này khẳng định lại:

> 🔴 **Launcher chỉ hiển thị Business App mà người dùng có quyền truy cập.**
> ⛔ **Không thẻ nào dẫn tới `/unauthorized`.** Thẻ ⛔ không bấm được là **lời nói dối của giao diện**.

⚠️ Đây là điều kiện thi hành, ⛔ không phải khuyến nghị. Nó trả `TD-05`.

### 2.4 Bản chất của Work Zone — ràng buộc kiến trúc

| # | Ràng buộc | Vì sao |
|---|---|---|
| `WZ-1` | 🔴 **Work Item là PHÉP CHIẾU, ⛔ không phải bảng ai đó tạo và đóng** | Việc **tự biến mất** khi trạng thái nghiệp vụ đổi. ⛔ Không có nút *"đã xong"*. ⛔ Không bao giờ có rác *(`DL-023`)* |
| `WZ-2` | **Luật sinh việc do từng Domain khai báo** — `WorkItemRule` là **dữ liệu chủ**, ⛔ không phải mã | Doanh nghiệp thêm luật riêng mà ⛔ không sửa mã |
| `WZ-3` | 🔴 **Work Zone ⛔ KHÔNG sở hữu dữ liệu** — nó chiếu trạng thái của các Domain | Cùng bản chất với Enterprise Control Center *(ADR-016)* |
| `WZ-4` | 🔴 **Mọi việc có ít nhất một nút HÀNH ĐỘNG** | Việc ⛔ không hành động được là tiếng ồn, và tiếng ồn dạy người dùng bỏ qua **mọi** việc |
| `WZ-5` | 🔴 **⛔ KHÔNG có nút thực hiện QUYẾT ĐỊNH trên Work Zone** | *"Hộp thư là nơi THẤY việc, ⛔ không phải nơi QUYẾT việc."* Nút mở màn hình quyết định có ma sát — `P-COMMIT` |
| `WZ-6` | **Việc mang nhãn Domain**, bấm là nhảy thẳng đúng ngữ cảnh | Người dùng **học được ranh giới Domain mà ⛔ không cần ai dạy** |

### 2.5 Quan hệ với Smart Routing *(Điều 11)*

Điều 11 quy định Smart Routing đưa người dùng tới *"màn hình khởi đầu phù hợp nhất"*. ADR này làm rõ:

```
1 Role         → vào thẳng Workspace chính của Role đó
n Role         → vào TRANG CHỦ, Work Zone mở sẵn
Đối tác ngoài  → vào thẳng Portal tương ứng — 🔴 ⛔ KHÔNG BAO GIỜ thấy Launcher nội bộ
```

---

## 3. Alternatives Considered

| Phương án | Vì sao ⛔ không chọn |
|---|---|
| **A · Giữ trang chủ một vùng Launcher** | Người dùng phải **nhớ việc của mình nằm ở Workspace nào**. Với Merchandiser 10–20 việc/ngày trải 5 Domain, đó là mở 5 Workspace mỗi sáng. Và loại việc ⚪ *"tôi đang chờ người khác"* — thứ chỉ ra lãng phí lớn nhất ngành may — **⛔ không có chỗ nào để hiện** |
| **B · Thay Launcher bằng Work Inbox** *(một vùng, chỉ việc)* | 🔴 Ba vấn đề: ① ⛔ Không phải việc gì cũng do hệ thống nghĩ ra — *"xem lại đơn Zara năm ngoái"* ⛔ không có work item nào dẫn tới · ② Người mới ⛔ không bao giờ thấy bản đồ hệ thống · ③ **Vi hiến** — Điều 13 định nghĩa trang chủ là Launcher |
| **C · Work Inbox thành một Global Service riêng** *(Điều 17)* | Global Service là năng lực **dùng chung xuyên Workspace** — Work Inbox ⛔ không phải thế, nó là **cửa vào**. Và đặt nó sau một lần bấm thì ⛔ không ai dùng — nó phải là thứ **thấy đầu tiên** |
| **D · Ba vùng** *(thêm vùng Dashboard)* | Dashboard trả lời *"mọi thứ đang đi thế nào"* — câu hỏi **tuần**, ⛔ không phải câu hỏi **sáng**. Đặt trên trang chủ làm loãng hai vùng còn lại. Dashboard thuộc Workspace và Enterprise Control Center |

---

## 4. Consequences

### 4.1 Được

- Người dùng ⛔ **không phải biết bản đồ Domain để bắt đầu ngày làm việc**
- Loại việc ⚪ *"tôi đang chờ người khác"* trở nên **nhìn thấy được** — thứ Excel và email ⛔ không bao giờ hiện ra
- Launcher giữ nguyên vai trò: bản đồ **ổn định**, học một lần rồi thuộc
- 🔴 **Ranh giới Domain được dạy một cách thụ động** — nhãn Domain trên mỗi việc *(`WZ-6`)*
- Thi hành §13.5 lọc theo quyền ⇒ trả `TD-05`

### 4.2 Đánh đổi

| # | Đánh đổi | Đối trọng |
|---|---|---|
| 1 | 🔴 **Work Zone chỉ tốt bằng luật sinh việc.** Luật kém ⇒ việc rác ⇒ người dùng bỏ qua ⇒ **hỏng vĩnh viễn** | `WZ-1` phép chiếu ⇒ ⛔ không có rác tồn đọng · `WZ-4` bắt buộc có hành động |
| 2 | **Phụ thuộc cứng vào tầng read-model `S7`** — ⛔ không có `S7` thì ⛔ không có Work Zone | Cùng phụ thuộc với Enterprise Control Center |
| 3 | Trang chủ dài hơn, cần cuộn trên điện thoại | Work Zone rút gọn 3 việc + *"xem tất cả"*; Launcher lọc theo quyền ⇒ thực tế 2–5 thẻ |

### 4.3 Technical Debt

⛔ Không phát sinh. `TD-05` *(trang chủ chưa lọc quyền)* nay là **điều kiện bắt buộc** của §2.3.

---

## 5. Rollback Impact

Quay lui = gỡ Work Zone; Work Inbox trở thành **một mục trong Launcher**.

| | |
|---|---|
| **Migration · dữ liệu** | ⛔ **không ảnh hưởng** — `WorkItem` là phép chiếu, ⛔ không có bảng |
| **Mã** | Gỡ một vùng khỏi trang chủ |
| **Hệ quả** | Người dùng quay lại phải nhớ việc nằm ở Workspace nào; loại việc ⚪ *"đang chờ"* mất chỗ hiển thị |

---

## 6. References

- **Board Decision 04/08/2026** — *"ADR-017 APPROVED. Home được thiết kế theo mô hình hai vùng. Launcher + Work Inbox. Đây là kiến trúc chính thức."*
- **Board Additional Direction 04/08/2026** — *"Trang đầu tiên nên là: 'Hôm nay tôi cần làm gì?'"*
- Hiến pháp [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) **Điều 13** *(§13.3 · §13.5)* · §11 Smart Routing · §17 Global Services · **Điều 42**
- [ADR-001](../architecture/adr/ADR-001-homepage-conceptual-model.md) — Homepage Conceptual Model *(bị ADR này tu chính, ⛔ không bị thay thế)*
- [EDD-05](../enterprise-design/EDD-05-PRODUCT-ARCHITECTURE.md) §2.2 trang chủ · §3 Work Inbox · §6 Persona Journey · §7 Work Inbox Matrix
- [EDD-06](../enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) §2.3 `C-3` · §2.4
- Decision Log `DL-023` *(Work Item là phép chiếu)* · `DL-024` *(hai vùng)* · `DL-112` *(ma sát có chủ ý)* · `DL-144` *(một engine, bảy cấu hình)* · `DL-145` *(ô đếm dashboard → WorkItemRule)*
- [`TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) `TD-05`
