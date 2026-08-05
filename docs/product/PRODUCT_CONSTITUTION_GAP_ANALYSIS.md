# PRODUCT CONSTITUTION — GAP ANALYSIS

| Trường | Giá trị |
|---|---|
| **Đối chiếu** | `Product Constitution v1.0` ⟷ Hiến pháp v1.6 · Baseline · 18 ADR · BA-1 · UX-1 · mã đang chạy |
| **Ngày đo** | 05/08/2026 · nhánh `main` · sau `dbec0d9d` |
| **Kết quả ban đầu** | **14 khoảng lệch** — 3 🔴 · 7 🟠 · 4 🟢 |
| **Sau Board Rev 2** | **3 🔴 ĐÃ GỠ** · **2 🔴 MỚI** phát sinh · 6 🟠 còn · 5 🟢 |
| **Sau Rev 3 · KHOÁ** | ⊕ **G-18** *(Command Center — nợ TÔI tạo)* · ⊕ **G-19** *(dashboard ngõ cụt — nợ TÔI tạo)* |
| **Chỉ thị** | Board: *"⛔ **không sửa ngay**. Ghi thành danh sách."* — tài liệu này **⛔ không đề xuất sửa mã** |

---

# §-1 · BẢNG TRẠNG THÁI SAU BOARD REV 2 *(đọc trước)*

| # | Khoảng lệch | Trước | Sau Rev 2 |
|---|---|---|---|
| `G-3` | AI Network vượt RLS | 🔴🔴 | ✅ **GỠ** — **Context Passing**: `Reference` là **con trỏ**, ⛔ không phải dữ liệu; mỗi AI đọc bằng **quyền của chính người nó đại diện** ⇒ RLS chạy **đúng một lần, dưới đúng một chủ thể** |
| `G-9` | AI Memory = hồ sơ nhân viên | 🔴 | ✅ **GỠ** — bộ nhớ **cá nhân hoá cách hướng dẫn**; ⛔ không giám sát; ⛔ không cho quản lý truy cập trực tiếp |
| `G-2` | Tên Module ⛔ không ai hiểu | 🔴 | ✅ **QUYẾT** — giữ tên nghiệp vụ chuẩn; `Tagline` + `Business Value` gánh phần dễ hiểu. **Đã thi hành**: `UI-2`/`UI-3` hiện tagline tiếng Việt ở **mọi khổ màn** |
| `G-1` ① | `Home` bị xoá khỏi thanh dưới | 🔴 | ✅ **GỠ** — `Home` ⛔ không bị xoá, nó **đổi tên** thành `Monica` |
| `G-1` ② | Slot 3 đổi vai giữa hai màn | 🔴 | 🔴 **CÒN, và Rev 2 làm rõ hơn** ⇒ **`G-15`** |
| — | — | — | 🔴 **`G-15` MỚI** · 🟠 **`G-16` MỚI** — xem dưới |

## 🔴 `G-15` · Từ Workspace ⛔ KHÔNG còn nút về Launcher

```
Homepage    slot 3 = Monica  ⇒ đang Ở Launcher. Nút này ⛔ không đi đâu cả.
Workspace   slot 3 = Report  ⇒ ⛔ KHÔNG có nút nào về Launcher.
```

⚠️ **`Monica` chỉ có mặt ở nơi ⛔ không cần nó, và vắng ở nơi cần.** Va `EP-2`
và va §2 *(Homepage là **Entry Point**)*. Ba phương án `A`/`B`/`C` ở
[`Product Constitution §17.1`](MONICA_ONE_PRODUCT_CONSTITUTION.md) —
**khuyến nghị `C`** *(về Launcher qua logo thanh đầu)*: cách **duy nhất** giữ
được **cả ba** ràng buộc mà ⛔ không đảo gì.

## 🟠 `G-16` · Context Passing mở một kênh **⛔ chưa có luật**

Board đóng đường vòng **dữ liệu**. Ba chỗ còn hở, `ADR-027` phải chốt:

| # | Vấn đề |
|---|---|
| `AI-4` | **`Reference` tự nó là thông tin** — *"đơn #123 có lỗi QA"* để lộ **sự TỒN TẠI** của bản ghi, kể cả khi người nhận ⛔ đọc được nội dung. Rò **siêu dữ liệu** ⛔ khác rò dữ liệu, nhưng vẫn là rò |
| `AI-5` | **Ai được gửi `Reference` cho ai?** ⛔ Không có luật ⇒ mạng lưới thành **kênh nhắn tin ⛔ không ai rà** |
| `AI-6` | 🔴 **`Context` ⛔ KHÔNG được mang nội dung AI Memory.** Board cấm quản lý truy cập **trực tiếp**; ⛔ không có vế này thì `AI-CEO` hỏi `AI-nhân-viên` là **đường vòng gián tiếp**, và §13 hỏng ⛔ không phải bằng một quyết định mà bằng **một tính năng tiện tay** |

🔑 **`ADR-027` thu hẹp mạnh**: từ *"AI có phá RLS ⛔ không"* — đã trả lời **⛔
không** — xuống *"luật của kênh `Reference`"*. **Nhỏ hơn nhiều, và vẫn bắt
buộc.**

## 🟠 `G-17` · Ví dụ §12 ⛔ chưa chạy được — và lý do ⛔ không nằm ở AI

`MODULE_ACCESS.giamdoc = ['/giam-doc', '/orders', '/subcon']` ⇒ **`giamdoc` ⛔
không đọc được dữ liệu QA** ⇒ `AI CEO` cũng ⛔ không ⇒ *"báo cáo tổng hợp"* ở
cuối chuỗi §12 **⛔ dựng được**.

🔑 **⛔ Không phải khuyết tật của Context Passing** — kiến trúc đúng. Đây là
phát hiện **nghiệp vụ**: ma trận phân quyền hiện tại **⛔ không cho Giám đốc
thấy chất lượng**, và điều đó đúng **từ trước khi có AI**.

⇒ Mở rộng `MODULE_ACCESS` là **thay đổi Permission Model** ⇒ **Board + ADR**.
⛔ Không được làm âm thầm nhân danh *"để AI chạy được"*.

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
