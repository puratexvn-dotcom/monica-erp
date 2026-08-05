# MONICA ONE — PRODUCT CONSTITUTION

| Trường | Giá trị |
|---|---|
| **Phiên bản** | **v1.0** |
| **Ban hành** | Board — 05/08/2026 |
| **Trạng thái** | ⏳ **CHỜ BOARD KHOÁ** — xem `§0.3` |
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

# §6 · BOTTOM NAVIGATION — **ĐÚNG 5 MỤC**

| Ở Homepage | Trong Workspace / Module |
|---|---|
| Work · Chat · **Monica** · AI · Guide | Work · Chat · **Report** · AI · Guide |

> **Luôn chỉ có 5 mục. ⛔ Không tăng thêm. ⛔ Không thay đổi vị trí.
> Người dùng ⛔ không phải học lại.**

⚠️ Xem `G-1` và `G-14` ở Gap Analysis — khoản này va chạm Hiến pháp §15.3 và có
một thuật ngữ *(`Monica`)* ⛔ chưa được định nghĩa.

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

# §10 · AI MEMORY

> Mỗi AI Assistant có **bộ nhớ dài hạn riêng của người dùng**. ⛔ Không chỉ nhớ
> hội thoại — mà **học** từ: lịch sử thao tác · lịch sử báo cáo · lỗi thường
> gặp · cách xử lý · KPI · thói quen · tiến bộ.
>
> Mục tiêu: **AI ngày càng hiểu người dùng**, ⛔ không phải ngày càng nhiều dữ
> liệu.

---

# §11 · ENTERPRISE KNOWLEDGE BASE

> Một **bộ não doanh nghiệp thống nhất**: SOP · Work Instruction · CAPA · tiêu
> chuẩn khách hàng · quy trình · chính sách · email · chat · tài liệu đào tạo ·
> video · biểu mẫu · quyết định · kinh nghiệm.
>
> **AI luôn ưu tiên tri thức NỘI BỘ trước kiến thức Internet.**

---

# §12 · AI NETWORK

```
AI QA phát hiện lỗi → AI Merchandising biết khách bị ảnh hưởng
                    → AI Kho kiểm tồn → AI Sản xuất đề xuất kế hoạch
                    → AI CEO nhận báo cáo tổng hợp
```

> Đây là **mạng lưới AI**, ⛔ không phải nhiều chatbot độc lập.

🔴 Xem `G-8` — khoản này là **rủi ro an ninh lớn nhất của toàn tài liệu**.

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
