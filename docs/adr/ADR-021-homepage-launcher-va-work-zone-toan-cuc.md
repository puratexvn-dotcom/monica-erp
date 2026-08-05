# ADR-021 — Homepage là Launcher · Work Zone là năng lực toàn cục

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-021 |
| **Trạng thái** | ⏳ Chờ phản biện độc lập + Board phê duyệt |
| **Thẩm quyền** | Board Directive *"Close BA-1 & UX-1"* — 05/08/2026 |
| **Tu chính** | Hiến pháp **§13.1** · **§13.3** · **§15.3** |
| **Quan hệ** | Tu chính [ADR-017](ADR-017-trang-chu-hai-vung.md) §2.1 §2.2 — ⛔ **không** thay thế toàn bộ |
| **Nguồn** | [`EPIC-UX-1`](../planning/EPIC-UX-1-PRODUCT-EXPERIENCE-ARCHITECTURE.md) §8 §12 · [`EPIC-BA-1`](../planning/EPIC-BA-1-ENTERPRISE-BUSINESS-ARCHITECTURE.md) §13.2 |
| **Migration** | ⛔ **KHÔNG** — ⛔ không chạm CSDL |

---

## 1. Problem — `[MEASURED]`

### 1.1 Hiến pháp mâu thuẫn với **chính nó**

**Bối cảnh đo:** đọc `docs/architecture/00-CONSTITUTION.md` **v1.6**, ngày
05/08/2026, toàn văn Điều 13 và Điều 15.

> **§13.1** *(v1.0 — bản gốc)*
> *"Its **sole purpose** is to direct users to the appropriate Business
> Workspace, Global Service or Platform Service…*
> ***The Homepage is not a dashboard.***
> ***The Homepage is a Business Operating System Launcher."***

> **§13.3** *(do **ADR-017** đưa vào — v1.6, 04/08/2026)*
> *"It consists of **two constitutional zones**: **(a) The Work Zone** presents
> the work items requiring the user's attention… It is **personal, dynamic**,
> and **shall be the default view upon sign-in**… **Neither may be removed.**"*

Một *"Work Zone cá nhân, động, hiện việc cần chú ý"* **là một dashboard cá
nhân** — thứ §13.1 phủ nhận **ba lần**.

🔑 **`ADR-017` đã đưa mâu thuẫn vào Hiến pháp và ⛔ không ai phát hiện** — kể cả
tác giả ADR này, khi thi hành nó ở `UI-1.5` *(`app/_home/work-zone.tsx`)*.

⇒ ADR này **⛔ không** đổi Hiến pháp theo ý ai. Nó **sửa một mâu thuẫn nội tại**.

### 1.2 Khoản ràng buộc thật là *"default view upon sign-in"* — `[MEASURED]`

Ba lối lách đã được thử, **cả ba hỏng**:

| # | Lối lách | Vì sao hỏng |
|---|---|---|
| ① | *"Nút `Work` nằm trên Homepage ⇒ vùng vẫn có mặt"* | **một cái nút ⛔ không phải một vùng**. *"Zone"* là **miền của bố cục** |
| ② | *"`removed` = xoá khỏi sản phẩm, ⛔ không phải khỏi Homepage"* | câu trước định nghĩa chúng là *"zones **of the Homepage**"* — nhưng vế này **thật sự mơ hồ**, ⛔ không kết luận được |
| ③ | *"⛔ Không đổi hành vi đăng nhập"* | 🔴 **hỏng dứt khoát.** *"shall be the **default view upon sign-in**"* là vế **hành vi, tường minh** |

⚠️ **Vế ③ vỡ dù Work Zone đặt ở đâu.** ⇒ Câu hỏi *"bottom nav hay Homepage"*
**⛔ không** phải cái quyết định phải tu chính hay ⛔ không.

### 1.3 §15.3 ⛔ không có chỗ cho `Work` — `[MEASURED]`

§15.3 liệt kê **năm** năng lực bằng câu **định nghĩa** *("The constitutional
capabilities **are**: Home · Business Communication · AI Assistant · Business
Reporting · User Guidance")* ⇒ **danh mục đóng**. `Work` ⛔ không có trong đó.

§15.1 nói thanh dưới dành cho *"**global capabilities**"* và *"**is not a
Workspace launcher**"*. **Work Zone ⛔ không phải Workspace** — nó là phép chiếu
**xuyên mọi Domain** ⇒ đặt vào thanh dưới **đúng tinh thần §15.1**, chỉ thiếu
**tên trong danh mục**.

---

## 2. Decision

### 2.1 Tu chính §13.1 — công nhận Product Identity

Bỏ từ **`sole`**. Nội dung mới:

> *"The Homepage is the primary entry point of MONICA ONE. It serves **three
> constitutional roles**: it expresses the **Product Identity** of MONICA ONE;
> it operates as the **Business Operating System Launcher**; and it is the
> **Entry Point** of the entire system.*
> *The Homepage is not a dashboard. The Homepage is not a reporting center.
> The Homepage is not an analytics portal."*

**Vì sao cần:** Product Identity là vai **duy nhất** trong ba vai ⛔ **không có
điều khoản nào bảo vệ**. §13.2 *("eliminate unnecessary decision-making")* hoàn
toàn có thể bị trích để **xoá khối thương hiệu**. Rủi ro ⛔ không phải *"vi
hiến"* — rủi ro là ***"⛔ không được bảo vệ"***.

### 2.2 Tu chính §13.3 — Homepage một vùng · Work Zone thành **năng lực toàn cục**

> **§13.3 Homepage Structure**
> *"The Homepage consists of the **Business Operating System Launcher**, which
> provides access to constitutional Business Workspaces, Global Services and
> Platform Services. It is structural, stable, and independent of daily
> operational state.*
>
> *The **Work Zone** is a **constitutional global capability**, reachable from
> the Bottom Navigation on every screen. It presents the work items requiring
> the user's attention **across all Business Domains** in which the user holds
> authorization. It owns no business data; it **projects** the state of the
> Business Domains.*
>
> *The Work Zone **may not be removed**, and **may not be reduced to
> per-Workspace lists**.*
>
> *The Homepage shall not be organized by organizational hierarchy, job titles
> or technical system modules."*

🔑 **Vế cấm mới thay đúng vế cấm cũ.** ADR-017 bảo vệ Work Zone bằng cách khoá
**VỊ TRÍ** của nó. ADR này bảo vệ nó bằng cách khoá **NĂNG LỰC** — và đó mới là
thứ §13.3 thật sự bảo vệ.

⚠️ **Vế *"⛔ may not be reduced to per-Workspace lists"* là bảo vệ mạnh hơn bản
cũ**, ⛔ không yếu hơn: nó chặn đúng cách năng lực này chết thật — bị chia nhỏ
vào từng Workspace rồi biến mất.

### 2.3 Tu chính §15.3 — bổ sung `Work`

> *"The constitutional capabilities are: **Work** · Home · Business
> Communication · AI Assistant · Business Reporting · User Guidance."*

**Sáu năng lực.** `Work` đứng đầu — nó là thứ người vận hành mở **mỗi ngày**.

### 2.4 🔑 Định nghĩa `Work Inbox` ⟷ `Work Zone`

```
Workspace /md   → Work Inbox của Merchandising  ─┐
Workspace /kho  → Work Inbox của Kho             ├─► WORK ZONE = HỢP của mọi
Workspace /qa   → Work Inbox của QA             ─┘   Work Inbox mà người dùng
                                                      có quyền
```

| | Định nghĩa |
|---|---|
| **Work Inbox** | việc chờ tôi **trong MỘT Domain** — thuộc Workspace |
| **Work Zone** | **HỢP** của mọi Work Inbox tôi có quyền — **xuyên MỌI Domain** |

⇒ Work Zone **⛔ không phải một màn hình thứ tám**; nó là **phép chiếu**. Đây
đúng nguyên văn ADR-017 `WZ-3` *("Work Zone ⛔ KHÔNG sở hữu dữ liệu")* ⇒ **chỗ
đặt nó là quyết định ĐIỀU HƯỚNG, ⛔ không phải quyết định DỮ LIỆU.**

---

## 3. Điều ADR-017 **GIỮ NGUYÊN** — ⛔ không bị ADR này chạm tới

| ADR-017 | Trạng thái |
|---|---|
| `WZ-1` Work Item là **phép chiếu**, ⛔ không phải bảng ai đó đóng | ✅ **giữ nguyên** |
| `WZ-2` `WorkItemRule` là **dữ liệu chủ**, ⛔ không phải mã | ✅ **giữ nguyên** |
| `WZ-3` Work Zone **⛔ không sở hữu dữ liệu** | ✅ **giữ nguyên — và là CƠ SỞ của §2.4** |
| §2.1 hai vùng trên Homepage | 🔴 **tu chính** — §2.2 |
| §2.2 nội dung §13.3 | 🔴 **tu chính** — §2.2 |
| §2.3 tái khẳng định §13.5 | ⚠️ **⛔ KHÔNG thuộc ADR này** — xem **ADR-022** |

🔑 **ADR này tu chính *chỗ đặt*, ⛔ không tu chính *bản chất*.** Ba ràng buộc
kiến trúc quan trọng nhất của ADR-017 sống nguyên vẹn.

---

## 4. Alternatives Considered

| # | Phương án | Vì sao **⛔ không** chọn |
|---|---|---|
| ① | **Giữ hai vùng** *(nguyên trạng ADR-017)* | ⛔ Không giải quyết mâu thuẫn §13.1. Homepage tiếp tục vừa **là** vừa **⛔ không phải** dashboard |
| ② | **Xoá hẳn Work Zone** | 🔴 Mất năng lực *"across **all** Business Domains"* — Merchandiser có `/md`+`/orders`+`/subcon` sẽ có **ba danh sách rời nhau** và ⛔ không nơi nào trả lời *"tổng cộng hôm nay tôi phải làm gì"* |
| ③ | **Work Zone chỉ nằm trong từng Workspace** | 🔴 Cùng hậu quả ②. Người dùng ⛔ không quên việc ở Workspace họ **mở** — họ quên việc ở Workspace họ **⛔ không mở**, và đó đúng là việc bị trễ. §2.2 **cấm tường minh** phương án này |
| ④ | **Sửa §13.1 cho khớp §13.3** *(công nhận Homepage là dashboard)* | 🔴 Đảo ngược nguyên tắc gốc v1.0 để hợp thức hoá một tu chính v1.6. **Sửa sai bằng cách mở rộng cái sai** |

---

## 5. Impact

| Hạng mục | Tác động |
|---|---|
| **Hiến pháp** | §13.1 · §13.3 · §15.3 — ⇒ **v1.7** |
| **ADR-017** | tu chính §2.1 §2.2; `WZ-1`…`WZ-3` **giữ nguyên** |
| **`app/_home/work-zone.tsx`** | **DI CHUYỂN**, ⛔ **KHÔNG XOÁ** *(Ràng buộc giao diện #2)* |
| **Bottom nav** | 5 nút → **6 nút** |
| **`screen-gates.json`** | mục `/` đánh giá lại; thêm mục cho route Work Zone |
| **CSDL · RLS · Migration** | ✅ **⛔ KHÔNG chạm** |
| **Permission Model** | ✅ **⛔ KHÔNG chạm** |

---

## 6. Chỗ tôi có thể sai — ADR-011 §2.3 mục 4

| # | Rủi ro | Mức |
|---|---|---|
| ① | **Sáu nút trên màn hình điện thoại 390px là chật.** §15 ⛔ không đặt trần số nút, nhưng sáu mục có nhãn tiếng Việt ở 390px là **⛔ chưa đo**. Có thể phải rút nhãn hoặc đổi cách trình bày | 🟠 vừa |
| ② | 🔴 **Work Zone sau một nút sẽ được mở ÍT HƠN một vùng hiện sẵn.** Đây là **cái giá thật** của quyết định này, và tôi ⛔ không có số đo để nói nó nhỏ. Nó chỉ được bù bằng việc `Work` đứng **đầu tiên** trong thanh dưới, có mặt trên **mọi màn hình** | 🔴 **cao** |
| ③ | *"Product Identity"* đưa vào §13.1 có thể bị hiểu thành **giấy phép làm trang tiếp thị**. `HP-1` `HP-2` `HP-3` *(UX-1 §12.4.1)* là hàng rào — nhưng chúng nằm ở **bậc 2′**, ⛔ không phải bậc 1 | 🟠 vừa |

---

## 7. Decision Record

| | |
|---|---|
| **Đề xuất** | Chief Solution Architect — 05/08/2026 |
| **Phản biện độc lập** | ⏳ **chưa thực hiện** — bắt buộc theo ADR-011 §2.2 |
| **Board phê duyệt** | ⏳ **chưa** |
| **Hiệu lực** | ⛔ **chưa** — ⛔ **không dòng mã nào được viết trước khi mục này chuyển ✅** |

---

## 8. References

- Hiến pháp §13.1 · §13.2 · §13.3 · §15.1 · §15.3 · §15.4
- [ADR-017](ADR-017-trang-chu-hai-vung.md) — nguồn của §13.3
- [ADR-015](ADR-015-muoi-bon-business-workspace.md) · [ADR-016](ADR-016-executive-center-enterprise-control-center.md)
- [`EPIC-UX-1`](../planning/EPIC-UX-1-PRODUCT-EXPERIENCE-ARCHITECTURE.md) §8 §9 §12
- [`EPIC-BA-1`](../planning/EPIC-BA-1-ENTERPRISE-BUSINESS-ARCHITECTURE.md) §13.2
- [ADR-022](ADR-022-homepage-hien-toan-bo-module.md) — §13.5, quyết **riêng**
