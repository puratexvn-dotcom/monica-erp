# PRODUCT CONSTITUTION — GAP ANALYSIS

| Trường | Giá trị |
|---|---|
| **Đối chiếu** | `Product Constitution v1.0` ⟷ Hiến pháp v1.6 · Baseline · 18 ADR · BA-1 · UX-1 · mã đang chạy |
| **Ngày đo** | 05/08/2026 · nhánh `main` · sau `dbec0d9d` |
| **Kết quả** | **14 khoảng lệch** — 3 🔴 · 7 🟠 · 4 🟢 |
| **Chỉ thị** | Board: *"⛔ **không sửa ngay**. Ghi thành danh sách."* — tài liệu này **⛔ không đề xuất sửa mã** |

---

## §0 · Cách đọc

| Ký hiệu | Nghĩa |
|---|---|
| 🔴 | **Mâu thuẫn thật** — hai văn bản ⛔ không thể cùng đúng |
| 🟠 | **Chưa có** — Product Constitution đòi thứ ⛔ chưa tồn tại |
| 🟢 | **Đã khớp** — ghi lại để lần sau ⛔ không đo lại |

⚠️ **Đây là danh sách, ⛔ không phải kế hoạch.** ⛔ Không mục nào được động tới
cho tới khi Board khoá Product Constitution và cấp ADR tương ứng.

---

# 🔴 BA MÂU THUẪN THẬT

## `G-1` · Bottom Navigation — **5 mục nào?**

| Nguồn | Danh sách |
|---|---|
| **Hiến pháp §15.3** *(bậc 1, câu **định nghĩa**)* | Home · Business Communication · AI Assistant · Business Reporting · User Guidance |
| **Product Constitution §6** — Homepage | **Work** · Chat · **Monica** · AI · Guide |
| **Product Constitution §6** — Workspace | **Work** · Chat · **Report** · AI · Guide |

**Ba lệch, ⛔ không phải một:**

| # | Lệch | Hệ quả |
|---|---|---|
| ① | `Home` **bị thay** bằng `Work` | §15.4 khai nút `Home` là lối về Homepage. Bỏ nó ⇒ `EP-2` gãy: từ Workspace ⛔ không còn đường về Launcher, và Homepage thôi là *"Entry Point"* |
| ② | Slot 3 **đổi giữa hai màn**: `Monica` ⟷ `Report` | Chính §6 nói *"⛔ không thay đổi vị trí, người dùng ⛔ không phải học lại"*. **Khoản này tự mâu thuẫn với chính nó** |
| ③ | `Work` vào danh mục đóng của §15.3 | §15.3 dùng câu **định nghĩa** *("The constitutional capabilities **are**")* ⇒ thêm/bớt đều cần tu chính |

🔴 **Và nó lật một quyết định tôi vừa soạn:** `ADR-021 §2.3` đề nghị **THÊM**
`Work` thành năng lực **thứ SÁU**. Product Constitution nói **đúng NĂM**. ⇒
`ADR-021` phải sửa từ *"thêm"* sang ***"THAY"*** — và phải nói **thay cái gì**.

⇒ **`ADR-021` ⛔ KHÔNG được duyệt ở dạng hiện tại.**

## `G-2` · Tên Module — **hiến định tiếng Anh** ⟷ **công nhân hiểu ngay**

| Nguồn | Luật |
|---|---|
| **Hiến pháp §45.3** *(bậc 1)* | Tên Business App là **từ vựng hiến định**, **⛔ KHÔNG dịch** ở mọi ngôn ngữ. Phép kiểm ⑪ **cưỡng chế** |
| **Product Constitution §2** | *"**Người lao động phổ thông phải hiểu ngay. ⛔ Không dùng thuật ngữ kỹ thuật.**"* |

**Đo được trên mã đang chạy:** ô Launcher hiện `Merchandising` · `Subcontract` ·
`Commercial` · `Platform Services`.

🔴 **Một công nhân may ⛔ không biết `Subcontract` là gì.** Và chính Board, ở
danh sách ví dụ của §2, viết **tiếng Việt**: *Kho · Cắt · May · Hoàn thành ·
Xuất hàng · Kế toán*.

⚠️ Đây ⛔ **không** giải được bằng `tagline` — `tagline` nằm **dưới** tên, và mắt
đọc tên **trước**. Nếu tên là rào cản thì dòng dưới ⛔ không cứu được.

**Ba đường, cả ba đều đụng bậc 1:** ① tu chính §45.3 cho phép dịch tên · ② đổi
tên hiến định sang tiếng Việt · ③ giữ tên Anh + **thêm** tên gọi thường ngày.
⇒ **Board quyết, ⛔ không phải tôi.**

## `G-3` · 🔴🔴 **AI NETWORK LÀ MỘT ĐƯỜNG VÒNG QUA RLS**

> §12: *"AI QA phát hiện lỗi → **AI Merchandising biết ngay khách bị ảnh
> hưởng** → AI Kho kiểm tồn → **AI CEO nhận báo cáo tổng hợp**"*

**Đo trên `MODULE_ACCESS` đang chạy:** vai `qa` có **đúng một** quyền — `/qa`.
Nó **⛔ không** đọc được `orders`, `customers`, `stock_levels`.

```
Người QA          ⛔ KHÔNG đọc được đơn hàng của khách  ← RLS chặn
AI của người QA   → đẩy "lỗi này ảnh hưởng khách X" sang AI Merchandising
                  → và nhận lại bối cảnh khách hàng
```

🔴 **Nếu AI chạy dưới quyền người dùng, mạng lưới ⛔ không hoạt động được như
mô tả. Nếu AI chạy dưới quyền cao hơn, nó trở thành `SECURITY DEFINER` biết nói
— một lỗ khoét xuyên qua TOÀN BỘ RLS, và là lỗ khoét ⛔ không ghi vào
`SECURITY_DEFINER_REGISTRY` được vì nó ⛔ không phải một hàm SQL.**

⚠️ Ba câu hỏi **phải** trả lời trước **dòng mã AI đầu tiên**:

| # | Câu hỏi |
|---|---|
| `AI-1` | AI chạy dưới **quyền của ai** — người dùng, hay một chủ thể riêng? |
| `AI-2` | Khi AI-A gửi thông tin cho AI-B, **ai kiểm quyền**, và kiểm ở **bậc nào** trong 7 bậc? |
| `AI-3` | Việc AI-A **biết** một sự kiện có phải là *"đọc dữ liệu"* theo nghĩa RLS ⛔ không? |

⇒ **`ADR-027` *(đề nghị)* — AI Trust Boundary. Đây là ADR quan trọng nhất còn
lại của dự án.** Cùng lý do: `§11` đưa **chat và email** vào Knowledge Base dùng
chung — cùng một đường rò, khác cái tên.

---

# 🟠 BẢY THỨ ⛔ CHƯA CÓ

## `G-4` · Danh mục Module — nay có **NĂM** con số

| Nguồn | Số |
|---|---|
| `MODULE_IDENTITY` · `home-modules.ts` | **16** |
| Hiến pháp §15 · EDD-01 | **19** |
| `MODULE_ACCESS` | **13** đường dẫn |
| **Product Constitution §2** | liệt kê **11 +** *"…"* — và **tách** Cắt · May · Hoàn thành thành **ba** Module, thêm **Logistics** |

🔴 Mã gộp cả ba tổ sản xuất vào **một** Module `production`; Product
Constitution **tách ba**. Và **`Logistics` ⛔ không tồn tại ở đâu cả** — khớp
đúng `Q-10` *(`/xuat-hang` ⛔ không có đơn vị chủ quản)*.

⇒ `MC-4` nâng từ *"bốn nguồn, bốn con số"* thành **năm**. Mở Module mới còn bị
`SECURITY FREEZE` chặn.

## `G-5` · Workspace — **4/8 khối ⛔ chưa có**

| Khối §4 | Trạng thái |
|---|---|
| Today Tasks · KPI · Quick Actions | ✅ **đã chạy** — `dbec0d9d` |
| Recent Activity | 🟠 một phần *(`activity_log`)* — quyền đọc ⛔ chưa quyết |
| **Notifications** | 🟠 ⛔ không bảng |
| **AI Assistant · Chat · Reports** | 🟠 cả ba là **Module `COMING_SOON`** — mở là **mở Module mới** ⇒ `SECURITY FREEZE` |

## `G-6` · Báo cáo một chạm — **⛔ chưa có mắt xích nào**

§7 đòi: AI soạn → người xác nhận → cập nhật dữ liệu · Dashboard · **PDF** ·
**hình ảnh** · **chia sẻ**. Hiện có: **⛔ không AI · ⛔ không PDF · ⛔ không
chia sẻ.**

⚠️ *"Bấm Báo cáo ⇒ hệ thống **tự cập nhật dữ liệu**"* va **`AC-1`**: dữ liệu
nghiệp vụ chỉ đổi qua **hành động có chủ thể chịu trách nhiệm**. ⇒ AI soạn phải
là **bản nháp**; *"xác nhận"* mới là hành động ghi — và **người xác nhận là
người chịu trách nhiệm**, ⛔ không phải AI.

## `G-7` · Chat — *"xoá được"* nghĩa là gì

§8: *"Tin nhắn **thu hồi được · xoá được**; Quản trị **luôn khôi phục được**"*.

✅ **Khớp** — với điều kiện đọc *"xoá"* là **soft delete** *(`deleted_at`)*.
Xoá cứng bị **arch test cấm** và ⛔ không khôi phục được, nên *"Quản trị luôn
khôi phục được"* **tự nó loại trừ** xoá cứng.

⚠️ Cần nói **ra chữ** trong tài liệu — người đọc câu *"có thể xoá"* mà ⛔ không
biết luật dự án sẽ hiện thực bằng `DELETE`.

## `G-8` · Digital Signature — đã có `UP-4`

§8 đòi chữ ký số trong Chat. `BA-1 §14.2` đã ghi: chữ ký tham chiếu **sống** sẽ
làm **mọi chứng từ đã duyệt âm thầm đổi chữ ký**. ⇒ Phải **có phiên bản** và
**chụp vào chứng từ lúc duyệt**. `ADR-024` đã đề nghị.

## `G-9` · AI Memory — bộ nhớ dài hạn là **dữ liệu cá nhân**

§10 đòi AI học *"thói quen · lỗi thường gặp · tiến bộ"* của **từng người**.

⚠️ Đó là **hồ sơ hành vi nhân viên** — và nó va thẳng §13 *("⛔ không xây phần
mềm để **kiểm soát** nhân viên")*. Cùng một kho dữ liệu phục vụ được **cả hai**
mục đích; thứ quyết định là **ai đọc được nó**.

⇒ Câu hỏi Board: **quản lý trực tiếp có đọc được bộ nhớ AI của cấp dưới ⛔
không?** Trả lời *"có"* thì §13 hỏng.

## `G-10` · Product Constitution **⛔ chưa có bậc** trong thứ bậc

`ADR-010` ấn định **7 bậc**, ⛔ không bậc nào cho tệp này — và chính `ADR-010`
nói trích dẫn ⛔ không nguồn là **⛔ không hợp lệ**. ⇒ **`ADR-026`**, xem
`Product Constitution §0.3`.

---

# 🟢 BỐN THỨ ĐÃ KHỚP — ghi để ⛔ không đo lại

| # | Khoản | Bằng chứng |
|---|---|---|
| `G-11` | §3 luồng `Homepage → Module → Login → Workspace` | `bbec8b62` · `a2f7226c` — 10/10 Module READY là route được bảo vệ; `/` công khai |
| `G-12` | §2 *"Launcher luôn hiện đầy đủ Module"* | `UI-3` — 16 ô ở mọi phiên. ⚠️ vẫn cần `ADR-022` cho §13.5 |
| `G-13` | §4 *"Workspace trả lời **hôm nay tôi cần làm gì?**"* | `dbec0d9d` — `WorkInbox` đứng **trước** KPI, có chủ ý |
| `G-14` | §13 *"⛔ không văn hoá xin cho"* | Work Inbox là **phép chiếu** — việc tự hiện, tự mất, ⛔ không ai phải hỏi ai |

---

# §17 · BỐN ADR PHÁT SINH TỪ TÀI LIỆU NÀY

| ADR | Nội dung | Mức |
|---|---|---|
| **`ADR-026`** | Đặt Product Constitution vào thứ bậc *(`ADR-010`)* | 🔴 **làm trước — ⛔ không có nó, mọi trích dẫn vô hiệu** |
| **`ADR-027`** | **AI Trust Boundary** — `AI-1` `AI-2` `AI-3` | 🔴 **⛔ không viết dòng AI nào trước ADR này** |
| **`ADR-021`** *(sửa)* | `Work` **THAY**, ⛔ không **THÊM** — và thay cái gì | 🔴 chặn mã bottom nav |
| **`ADR-028`** | Tên Module: hiến định ⟷ dễ hiểu *(`G-2`)* | 🟠 Board quyết |

---

# §18 · KHUYẾN NGHỊ

```
╔═══════════════════════════════════════════════════════════════════════╗
║  ① `G-3` LÀ MỤC QUAN TRỌNG NHẤT TRONG CẢ TÀI LIỆU.                   ║
║     AI Network như mô tả là một ĐƯỜNG VÒNG QUA RLS. Người QA ⛔ không ║
║     đọc được đơn hàng; AI của họ thì có. Nếu AI chạy quyền cao hơn,   ║
║     nó là một SECURITY DEFINER BIẾT NÓI — và ⛔ không ghi vào Registry ║
║     được, vì nó ⛔ không phải một hàm SQL.                             ║
║                                                                       ║
║  ② `G-1` LẬT MỘT ADR TÔI VỪA SOẠN. ADR-021 đề nghị THÊM `Work` thành ║
║     năng lực thứ SÁU; Product Constitution nói ĐÚNG NĂM. ⇒ ADR-021    ║
║     ⛔ KHÔNG được duyệt ở dạng hiện tại. Tôi tự rút.                   ║
║                                                                       ║
║  ③ `G-2` LÀ CÂU HỎI SẢN PHẨM, ⛔ KHÔNG PHẢI CÂU HỎI KỸ THUẬT.        ║
║     Chính Board viết danh sách Module bằng TIẾNG VIỆT ở §2, trong khi ║
║     §45.3 cấm dịch tên. Một trong hai phải nhường — và người quyết là ║
║     người bán sản phẩm, ⛔ không phải người dựng màn hình.             ║
║                                                                       ║
║  ④ LÀM `ADR-026` TRƯỚC MỌI THỨ KHÁC. ⛔ Không có bậc trong thứ bậc,   ║
║     tài liệu này ⛔ không giải được xung đột nào — kể cả 14 mục ở đây. ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

> **Trạng thái:** ⏳ trình Board. ⛔ Không sửa một dòng mã nào theo tài liệu này.
