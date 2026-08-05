# MONICA ONE — PRODUCT CONSTITUTION

| Trường | Giá trị |
|---|---|
| **Phiên bản** | **v1.0 · Rev 2** |
| **Ban hành** | Board — 05/08/2026 · **Rev 2** cùng ngày |
| **Trạng thái** | ⏳ **CHỜ BOARD KHOÁ** — xem `§0.3` · `§17` |
| **Vai trò** | Tài liệu **cấp cao nhất của SẢN PHẨM** |
| **⛔ KHÔNG thay thế** | Hiến pháp *(`00-CONSTITUTION.md`)* · ADR · BA-1 · UX-1 |
| **Đối chiếu** | [`PRODUCT_CONSTITUTION_GAP_ANALYSIS.md`](PRODUCT_CONSTITUTION_GAP_ANALYSIS.md) — **14 khoảng lệch** |
| **Nguyên tắc dẫn xuất** | [`MONICA_ONE_PRODUCT_PRINCIPLES.md`](MONICA_ONE_PRODUCT_PRINCIPLES.md) — 28 điều |

---

# §0 · TÀI LIỆU NÀY LÀ GÌ — VÀ ⛔ KHÔNG PHẢI GÌ

## 0.1 Nó trả lời **một** câu hỏi

| Tài liệu | Trả lời |
|---|---|
| **Product Constitution** *(tệp này)* | 🔑 **VÌ SAO MONICA ONE TỒN TẠI** |
| Hiến pháp `00-CONSTITUTION.md` | **PHẢI XÂY THẾ NÀO** |
| `BUSINESS_KNOWLEDGE_BASE.md` | **CÁI GÌ LÀ THẬT** trong nghiệp vụ may |
| ADR | **VÌ SAO ĐÃ CHỌN THẾ NÀY** |
| BA-1 · UX-1 | **AI LÀM GÌ · Ở ĐÂU** |

⇒ Nó ⛔ **không** cạnh tranh với tài liệu nào. Nó là **thứ các tài liệu kia phục
vụ**.

## 0.2 Từ khi Board khoá — mọi thiết kế trả **HAI** câu hỏi

```
❌ CŨ:  "Có đúng Architecture ⛔ không?"
✅ MỚI: "Có đúng Architecture ⛔ không?"  VÀ  "Có đúng Product Constitution ⛔ không?"
```

⚠️ Đúng Architecture mà **sai Product Constitution** ⇒ ta xây được một thứ **chạy
tốt và ⛔ không ai cần**. Đó là cách phần lớn ERP ngành may đã chết.

## 0.3 🔴 MỘT VIỆC PHẢI LÀM TRƯỚC KHI TÀI LIỆU NÀY CÓ HIỆU LỰC TRÍCH DẪN

**`ADR-010` ấn định thứ bậc bảy bậc, và ⛔ KHÔNG có bậc nào cho tệp này.**

`ADR-010` cũng ra luật: *"`Điều IX` trần, ⛔ không nguồn, là trích dẫn **⛔
không hợp lệ**"* — nghĩa là câu *"theo Product Constitution §6"* hiện **⛔ chưa
phải một trích dẫn hợp lệ** trong dự án này.

⇒ **`ADR-026` *(đề nghị)*: đặt Product Constitution vào thứ bậc.** Đề xuất
**bậc `0″`** — ngang hàng `BKB`, dưới Board Decision, **trên** Hiến pháp về
**lĩnh vực SẢN PHẨM**, và **⛔ không** đụng thẩm quyền của Hiến pháp về **lĩnh
vực KỸ THUẬT**.

⚠️ **⛔ Không có bước này, mọi xung đột tương lai ⛔ không có luật giải.** Đó
đúng loại lỗ hổng quản trị mà `ADR-010` sinh ra để bịt.

---

# §1 · SỨ MỆNH

> MONICA ONE **⛔ không** được xây để trở thành một ERP tốt hơn.
> MONICA ONE được xây để trở thành **Operating System của doanh nghiệp sản
> xuất**.
>
> ERP **quản lý dữ liệu**. MONICA ONE giúp doanh nghiệp **vận hành**.
>
> Người dùng **⛔ không** *"vào ERP"*. Người dùng **"đi làm"**.

---

# §2 · HOMEPAGE

> Homepage **⛔ không** phải Dashboard · **⛔ không** phải Work Zone ·
> **⛔ không** phải Reporting · **⛔ không** phải Analytics.
>
> Homepage chỉ có **một** nhiệm vụ: **giúp người dùng nhìn thấy ngay doanh
> nghiệp của chính họ.**
>
> Homepage là **Application Launcher** — giống màn hình điện thoại. Một lần
> nhìn là biết *"tôi thuộc bộ phận nào"*.
>
> **Launcher luôn hiển thị ĐẦY ĐỦ các Module** — Merchandising · Kho · Cắt ·
> May · QA · Hoàn thành · Xuất hàng · Logistics · Kế toán · Nhân sự · Kinh
> doanh…
>
> Mỗi Module phải có: **Icon · Tên · Tagline · Business Value**.
>
> 🔑 **Người lao động phổ thông phải hiểu ngay. ⛔ Không dùng thuật ngữ kỹ
> thuật.**
>
> Homepage còn phục vụ **Demo · Sales · Investor · Recruitment · Customer
> Presentation**. Đây là **công cụ bán hàng**, ⛔ không chỉ là giao diện.

---

# §3 · LUỒNG NGƯỜI DÙNG

```
Homepage → Chọn Module → Login (nếu ⛔ chưa xác thực) → Workspace
```

> **⛔ Không** login trước. **⛔ Không** Dashboard trước Homepage.

---

# §4 · WORKSPACE

> Workspace là **nơi làm việc**, ⛔ không phải Homepage.
> Nó trả lời **duy nhất một câu**: ***"Hôm nay tôi cần làm gì?"***
>
> Gồm: **Today Tasks · KPI · Quick Actions · Recent Activity · Notifications ·
> AI Assistant · Chat · Reports**.

---

# §5 · WORK ZONE

> Work Zone **⛔ không** phải Dashboard của Module.
> Work Zone là **tập hợp toàn bộ công việc hôm nay của MỘT NGƯỜI**.
>
> Một nhân viên làm việc trên nhiều Module ⇒ Work Zone phải **hợp nhất** mọi
> việc đó. **⛔ Không** để người dùng phải mở từng Module để tìm việc.

---

# §6 · BOTTOM NAVIGATION — **ĐÚNG 5 MỤC** *(Rev 2)*

| Vị trí | Ở Homepage | Trong Workspace / Module |
|---|---|---|
| 1 | **Work** | **Work** |
| 2 | **Chat** | **Chat** |
| 3 | **Monica** | **Report** |
| 4 | **AI** | **AI** |
| 5 | **Guide** | **Guide** |

> **Luôn chỉ có 5 mục. ⛔ Không thêm mục thứ sáu. ⛔ Không có `Home`.**
> **`Monica` CHÍNH LÀ Application Launcher.**

🔑 **Board đã giải `G-1` ①:** `Home` ⛔ **không bị xoá** — nó được **đổi tên**
thành `Monica`. Lối về Launcher vẫn là một năng lực hiến định, chỉ mang tên
thương hiệu.

🔴 **`G-1` ② vẫn còn, và Rev 2 làm nó rõ hơn — xem `§17.1`.**

---

# §17 · MỘT ĐIỂM CÒN MỞ SAU REV 2

## 17.1 🔴 Từ Workspace ⛔ KHÔNG còn nút về Launcher

Đọc đúng bảng §6 ở trên:

```
Ở Homepage    slot 3 = Monica  ⇒ đang Ở Launcher rồi. Nút này ⛔ không đi đâu cả.
Trong Workspace slot 3 = Report ⇒ ⛔ KHÔNG có nút nào về Launcher.
```

⚠️ **`Monica` chỉ xuất hiện ở nơi ⛔ không cần nó, và vắng mặt ở nơi cần.**

Điều này va `EP-2` *(UX-1 §12.5)*: *"nút về Homepage phải có ở **mọi**
Workspace, nếu ⛔ không Homepage thôi là **điểm vào** và chỉ còn là **trang đăng
nhập**"* — và va cả §2 của chính tài liệu này *(Homepage là **Entry Point** của
toàn hệ thống)*.

**Hai cách đọc, Board chọn một:**

| | Cách đọc | Hệ quả |
|---|---|---|
| **A** | **Hai danh sách bị đảo** — đúng phải là: Homepage có `Report`, Workspace có `Monica` | ⇒ `Monica` đưa người dùng **về Launcher** từ mọi Workspace ✅ · nhưng `Report` trên Homepage thì báo cáo **cái gì**, khi Homepage ⛔ không có ngữ cảnh nghiệp vụ? |
| **B** | **`Monica` có mặt ở CẢ HAI**, và `Report` là mục **thứ sáu** trong Workspace | ⇒ vi phạm *"đúng 5 mục"* 🔴 |
| **C** | **Slot 3 đổi theo ngữ cảnh** như bảng hiện tại, và lối về Launcher đi qua **logo trên thanh đầu**, ⛔ không qua thanh dưới | ⇒ giữ đúng 5 mục · giữ `EP-2` · nhưng phải **ghi ra chữ**, vì hiện ⛔ không văn bản nào nói vậy |

⇒ **Tôi khuyến nghị `C`** — nó là cách duy nhất giữ **cả ba** ràng buộc *(đúng
5 mục · slot ⛔ không đổi vai · luôn về được Launcher)* mà ⛔ không phải đảo gì.
Logo thương hiệu là lối về trang chủ ở **mọi sản phẩm web**; người dùng ⛔ không
phải học nó.

⚠️ **⛔ Không tự chọn.** Ghi vào đây, chờ Board.

## 17.2 ⚠️ `AI CEO nhận báo cáo tổng hợp` — ⛔ chưa chạy được, và ⛔ không phải vì AI

`§12` Rev 2 chốt: **mỗi AI đọc bằng quyền của người nó đại diện**. Đúng và sạch.
Nhưng áp vào ví dụ của chính `§12`:

```
MODULE_ACCESS.giamdoc = ['/giam-doc', '/orders', '/subcon']
```

⇒ **`giamdoc` ⛔ KHÔNG có quyền đọc dữ liệu QA.** Nên `AI CEO` — đọc bằng quyền
`giamdoc` — cũng **⛔ không đọc được**, và *"báo cáo tổng hợp"* ở cuối chuỗi
**⛔ không dựng được**.

🔑 **Đây ⛔ KHÔNG phải khuyết tật của Context Passing.** Kiến trúc đúng. Vấn đề
là **ma trận phân quyền hiện tại ⛔ không cho Giám đốc thấy chất lượng** — một
phát hiện **nghiệp vụ**, ⛔ không phải kỹ thuật, và nó đã tồn tại **từ trước khi
có AI**.

⇒ Mở rộng `MODULE_ACCESS` là **thay đổi Permission Model** ⇒ **cần Board + ADR**.
⛔ Không được làm âm thầm nhân danh *"để AI chạy được"*.

---

# §7 · BÁO CÁO

> Người lao động phổ thông **⛔ không ghét báo cáo**. Họ ghét: **nhớ nhiều ·
> nhập nhiều · sợ sai · nhiều bước**.
>
> 🔑 **AI chuẩn bị trước. Người dùng xác nhận sau.**
> *"Tôi đã chuẩn bị báo cáo. Bạn chỉ cần kiểm tra."*
>
> Bấm **"Báo cáo"** ⇒ hệ thống tự: cập nhật dữ liệu · Dashboard · PDF · hình
> ảnh · chia sẻ.
>
> **⛔ Không cần xuất Excel. ⛔ Không cần gửi Zalo.**

---

# §8 · CHAT

> Chat **⛔ không** phải Messenger · Zalo · Email. Chat là **trung tâm cộng
> tác**.
>
> Mọi hội thoại **gắn với** một thực thể nghiệp vụ: Đơn hàng · PO · Nhà cung
> cấp · Khách hàng · Công đoạn · Công việc · CAPA · Ticket · Báo cáo.
>
> Phải có: File · Timeline · Reminder · Mention · Approval · Digital Signature ·
> Task · Work Zone · Workspace.
>
> Tin nhắn **thu hồi được · xoá được**; **Quản trị luôn khôi phục được** —
> phục vụ **Audit**.

---

# §9 · AI ASSISTANT

> AI **⛔ không** phải Chatbot. AI là **người đồng hành**. **Mỗi người dùng một
> AI Assistant.**
>
> AI hiểu: Vai trò · Workspace · KPI · SOP · Quy trình · Lịch sử · Đơn hàng ·
> Deadline · Hồ sơ · Tài liệu · Lỗi thường gặp.
>
> Bốn vai: **Coach · Copilot · Domain Expert · Process Guardian**.
>
> 🔑 **AI làm phần lớn công việc. Con người xác nhận phần còn lại.**

---

# §10 · AI MEMORY *(Rev 2)*

> Mỗi AI Assistant có **bộ nhớ dài hạn riêng của người dùng**. ⛔ Không chỉ nhớ
> hội thoại — mà **học** từ: lịch sử thao tác · lịch sử báo cáo · lỗi thường
> gặp · cách xử lý · KPI · thói quen · tiến bộ.
>
> Mục tiêu: **AI ngày càng hiểu người dùng**, ⛔ không phải ngày càng nhiều dữ
> liệu.

## 10.1 🔴 AI Memory **⛔ KHÔNG PHẢI HỒ SƠ NHÂN VIÊN** *(Board, Rev 2)*

> AI Memory là **bộ nhớ cá nhân của AI Assistant** — để **cá nhân hoá cách
> hướng dẫn, giải thích và hỗ trợ**.
>
> - ⛔ **KHÔNG** dùng để **giám sát** nhân viên.
> - ⛔ **KHÔNG** cho quản lý hoặc CEO **truy cập trực tiếp**.

## 10.2 ⚠️ Và ⛔ không được truy cập **GIÁN TIẾP** qua Context Passing

Board cấm truy cập **trực tiếp**. Nhưng `§12` vừa mở một kênh **giữa các AI** —
và nếu ⛔ không chặn, kênh đó là đường vòng:

```
AI CEO  ──"cho tôi bối cảnh về người này"──►  AI của nhân viên
        ◄──── tóm tắt thói quen · lỗi thường gặp · tiến bộ ────
```

⇒ **⛔ Không một byte nào của AI Memory được đi qua Context Passing.**

🔑 Ranh giới sắc gọn: Context Passing mang **ngữ cảnh CÔNG VIỆC** *(đơn hàng
nào · lỗi gì · mốc nào)*. Nó **⛔ KHÔNG BAO GIỜ** mang **ngữ cảnh CON NGƯỜI**
*(ai hay sai chỗ nào · ai tiến bộ ra sao)*.

⚠️ ⛔ Không có ranh giới này, `§13` *("⛔ không xây phần mềm để kiểm soát nhân
viên")* hỏng **⛔ không phải bằng một quyết định**, mà bằng **một tính năng
tiện tay**.

---

# §11 · ENTERPRISE KNOWLEDGE BASE

> Một **bộ não doanh nghiệp thống nhất**: SOP · Work Instruction · CAPA · tiêu
> chuẩn khách hàng · quy trình · chính sách · email · chat · tài liệu đào tạo ·
> video · biểu mẫu · quyết định · kinh nghiệm.
>
> **AI luôn ưu tiên tri thức NỘI BỘ trước kiến thức Internet.**

---

# §12 · AI NETWORK — **CONTEXT PASSING ARCHITECTURE** *(Rev 2)*

```
AI QA phát hiện lỗi → AI Merchandising biết khách bị ảnh hưởng
                    → AI Kho kiểm tồn → AI Sản xuất đề xuất kế hoạch
                    → AI CEO nhận báo cáo tổng hợp
```

> Đây là **mạng lưới AI**, ⛔ không phải nhiều chatbot độc lập.

## 12.1 🔴 KIẾN TRÚC CHÍNH THỨC *(Board, Rev 2)*

> - AI **chỉ trao đổi `Context` · `Intent` · `Reference`.**
> - **Mỗi AI tự đọc dữ liệu bằng CHÍNH QUYỀN của người dùng mà nó đại diện.**
> - ⛔ **Không AI nào được đọc dữ liệu THAY AI khác.**
> - ⛔ **Không tạo đường vòng vượt RLS.**

## 12.2 ✅ Vì sao lời giải này **thật sự** đóng lỗ

```
❌ Mô hình chia sẻ quyền:  AI-QA đọc `orders` HỘ AI-MD
                           ⇒ AI trở thành SECURITY DEFINER BIẾT NÓI
                           ⇒ lỗ khoét xuyên RLS, ⛔ không ghi Registry được

✅ Context Passing:        AI-QA gửi THAM CHIẾU "lỗi ở đơn #123"
                           AI-MD tự đọc #123 BẰNG QUYỀN của người dùng MD
                           ⇒ RLS chạy ĐÚNG MỘT LẦN, dưới ĐÚNG một chủ thể
```

🔑 **Điểm then chốt: `Reference` là một CON TRỎ, ⛔ không phải DỮ LIỆU.** Người
⛔ không có quyền cầm con trỏ đó thì **đọc ⛔ không ra gì** — RLS vẫn là hàng
rào, và nó ⛔ **không bị hỏi vòng qua ai cả**.

⇒ Nó cũng khớp **`PA-1`**: AI nằm ở tầng **trải nghiệm**; hàng rào vẫn ở bậc
⑤⑥⑦, **⛔ không dời đi đâu**.

## 12.3 ⚠️ Ba điều `ADR-027` vẫn phải chốt

Kiến trúc đúng ⛔ **không** tự nó thành hiện thực đúng. Ba chỗ còn hở:

| # | Vấn đề | Vì sao quan trọng |
|---|---|---|
| `AI-4` | **Bản thân `Reference` là thông tin.** *"Đơn #123 có lỗi QA"* để lộ **sự TỒN TẠI** của một bản ghi, kể cả khi người nhận ⛔ không đọc được nội dung | Rò **siêu dữ liệu** ⛔ khác rò **dữ liệu**, nhưng vẫn là rò |
| `AI-5` | **Ai được gửi `Reference` cho ai?** ⛔ Không có luật, mạng lưới thành **kênh nhắn tin ⛔ không ai rà** | Chính là chỗ `MO-5` cảnh báo: một cột được mượn dần |
| `AI-6` | **`Context` ⛔ KHÔNG được mang nội dung AI Memory** — xem `§10.2` | ⛔ Không có vế này, `§13` hỏng bằng một tính năng tiện tay |

⇒ **`ADR-027` thu hẹp**: từ *"AI có phá RLS ⛔ không"* — Board đã trả lời **⛔
không** — xuống *"luật của kênh `Reference`"*. **Nhỏ hơn nhiều, và vẫn bắt
buộc.**

## 12.4 ⚠️ Ví dụ ở đầu §12 ⛔ chưa chạy được — lý do ⛔ không nằm ở AI

Xem **`§17.2`**: `giamdoc` hiện ⛔ **không có quyền đọc dữ liệu QA**, nên
`AI CEO` cũng ⛔ không. Đó là chuyện của **ma trận phân quyền**, ⛔ không phải
của AI — và nó đã đúng như vậy **từ trước khi có AI**.

---

# §13 · TRIẾT LÝ QUẢN TRỊ

> **⛔ Không** xây phần mềm để **kiểm soát** nhân viên.
> Xây phần mềm để giúp nhân viên **làm đúng**.
>
> **⛔ Không tạo văn hoá "xin cho".** Mọi người nhìn thấy **việc cần làm · tiến
> độ · trách nhiệm · trạng thái** mà **⛔ không cần hỏi nhau**.

---

# §14 · KHÁCH HÀNG

> Mọi người đều phải có cảm giác: ***"Đây đúng là công ty của tôi."***
>
> ⛔ Không chỉ CEO — mà cả **Công nhân · Tổ trưởng · QA · KCS · Kho · MD ·
> Sales · Kế toán · Nhân sự · Giám đốc**.

---

# §15 · GIÁ TRỊ KHÁC BIỆT

> Ba điều phần lớn ERP ngành may **⛔ chưa làm tốt**:
>
> ① Người dùng **nhìn thấy ngay doanh nghiệp của mình**.
> ② Người dùng **nhìn thấy ngay việc cần làm**.
> ③ Người dùng **luôn có AI đồng hành** trong công việc.

---

# §16 · TẦM NHÌN

> **⛔ Không** hướng tới ERP tốt nhất. Hướng tới **Business Operating System
> đầu tiên**, nơi:
>
> - mọi nhân viên đều có **AI Assistant riêng**;
> - mọi công việc đều **được hướng dẫn**;
> - mọi báo cáo **gần như tự động**;
> - mọi trao đổi **gắn với ngữ cảnh nghiệp vụ**;
> - mọi bên liên quan **nhìn thấy trạng thái theo thời gian thực**;
> - doanh nghiệp vận hành **minh bạch, chủ động**, ⛔ không phụ thuộc văn hoá
>   *"xin–cho"*.

---

> **Trạng thái:** ⏳ trình Board khoá. Đối chiếu hiện trạng ở
> [`PRODUCT_CONSTITUTION_GAP_ANALYSIS.md`](PRODUCT_CONSTITUTION_GAP_ANALYSIS.md).
