# EPIC UX-1 · PRODUCT EXPERIENCE ARCHITECTURE

| Trường | Giá trị |
|---|---|
| **EPIC** | **UX-1 · Product Experience Architecture** |
| **Thẩm quyền** | Board Directive BA-1 & UX-1 *(Revised)* — 05/08/2026 |
| **Vai trò** | Chief Solution Architect — **phản biện**, ⛔ không bảo vệ thiết kế hiện tại |
| **Ràng buộc** | ⛔ **Không viết Production Code** |
| **Kết luận Rev 1** | ~~Khuyến nghị Phương án C~~ — **Board BÁC 05/08/2026** |
| **Kết luận có hiệu lực** | ✅ **Phương án D** *(Board Directive Rev 2)* — xem **§7** |

---

# §7 · REVISION 2 — BOARD DIRECTIVE 05/08/2026

> ⚠️ **§0–§6 GIỮ NGUYÊN VĂN.** Hiến pháp Điều 43.7 cấm viết lại lịch sử.
> Revision 2 **thêm vào**, ⛔ không sửa.

## 7.1 Board bác gì — và tôi tiếp thu

| # | Đề xuất Rev 1 của tôi | Phán quyết Board |
|---|---|---|
| `R1-a` | **Hai bề mặt** — Showcase *(khách)* ⟷ Launcher *(nhân viên)* | 🔴 **BÁC.** MONICA ONE chỉ có **MỘT** Homepage |
| `R1-b` | Homepage **lọc theo quyền** *(§13.5)* | 🔴 **BÁC.** Launcher **⛔ không đồng nghĩa** Permission — hiện **toàn bộ**, kiểm quyền **lúc MỞ** |
| `R1-c` | Work Zone ở lại Homepage dạng **dải gọn** *(lối ①)* | 🔴 **BÁC.** Homepage **⛔ không hiển thị Dashboard** |
| `R1-d` | `Department ⛔ ≠ Workspace` | ✅ **DUYỆT** — giữ nguyên nguyên tắc |

**Tôi tiếp thu `R1-a` và `R1-b`.** Lập luận của Board đúng ở chỗ tôi bỏ sót:
**hai bề mặt là hai thứ phải nuôi**, và bề mặt ít người xem sẽ **chết dần**.
Một Homepage duy nhất ⛔ không bao giờ lệch khỏi chính nó.

## 7.2 ✅ PHƯƠNG ÁN D — kiến trúc có hiệu lực

```
┌─────────────────────────────────────────────────────────────┐
│  HOMEPAGE  —  MỘT bản duy nhất cho MỌI người                │
│  Lưới App · Icon · Tên Module · một dòng mô tả              │
│  Hiện ĐỦ mọi Module — ⛔ KHÔNG lọc, ⛔ KHÔNG ẩn              │
│  ⛔ KHÔNG Dashboard · ⛔ KHÔNG KPI · ⛔ KHÔNG biểu đồ        │
└───────────────────────────┬─────────────────────────────────┘
                            │ bấm một Module
                            ▼
              ┌──────────────────────────┐
              │  đã đăng nhập?           │
              └──────┬────────────┬──────┘
                  ⛔ chưa         ✅ rồi
                     ▼            │
              ┌────────────┐      │
              │   LOGIN    │──────┤
              └────────────┘      ▼
                          ┌───────────────────┐
                          │  có quyền Module? │
                          └────┬─────────┬────┘
                            ✅ có     ⛔ không
                               ▼         ▼
                        ┌───────────┐ ┌──────────────┐
                        │ WORKSPACE │ │ UNAUTHORIZED │
                        │ việc·KPI· │ │  403         │
                        │ biểu đồ·  │ └──────────────┘
                        │ thông báo │
                        └───────────┘
```

## 7.3 🔴 HAI ĐIỀU KHOẢN BẬC 1 PHẢI TU CHÍNH TRƯỚC KHI VIẾT MÃ

> Board đã quyết **hai lần**; tôi thi hành. Nhưng phương án D ⛔ **không thi hành
> được bằng mã** cho tới khi hai điều khoản dưới đây được tu chính — vì mã sẽ
> **mâu thuẫn trực tiếp** với văn bản bậc 1 đang có hiệu lực.
>
> ⚠️ Đây là **thủ tục**, ⛔ không phải phản đối. Đúng trình tự EDD-06 §10:
> **cập nhật tài liệu → ADR → rồi mới mã**. Tài liệu này là bước một.

| # | Điều khoản | Nguyên văn | Phương án D |
|---|---|---|---|
| `TC-A` | **§13.3** | *"two **constitutional** zones: (a) Work Zone … **default view upon sign-in** … Both zones are constitutional. **Neither may be removed**"* | Homepage ⛔ **không** còn Work Zone |
| `TC-B` | **§13.5** | *"The Homepage shall display **only** the … Services that the authenticated user **is authorized to access**. Users shall **not be distracted by inaccessible** … Workspaces"* | Homepage hiện **toàn bộ**, kể cả thứ ⛔ không có quyền |

⇒ **Cần một ADR tu chính §13.3 và §13.5.** ⛔ Tôi không tự soạn — ADR mới là
điều kiện dừng Board đã đặt.

## 7.4 🔑 `TC-A` có một lời giải KHÔNG mất năng lực

**Điều §13.3 thật sự bảo vệ ⛔ không phải vị trí, mà là NĂNG LỰC:**

> *"work items requiring the user's attention **across ALL Business Domains** in
> which the user holds authorization"*

⚠️ **Dời Work Zone vào Workspace làm mất chính năng lực đó.** Một Merchandiser
có `/md` + `/orders` + `/subcon` sẽ có **ba danh sách việc rời nhau**, và ⛔
**không nơi nào** trả lời *"tổng cộng hôm nay tôi phải làm gì"*.

Người dùng ⛔ không quên việc ở Workspace họ mở. Họ quên việc ở Workspace họ
**⛔ không mở hôm nay** — và đó đúng là việc bị trễ.

### Lời giải: **Work Zone là NĂNG LỰC TOÀN CỤC, ⛔ không phải vùng của Homepage**

🔑 **Board đã tự thiết kế sẵn lối vào cho nó** — nút **`Work`** đứng **đầu tiên**
trong bottom nav *(cả Homepage lẫn trong Module)*.

```
Homepage       Work · Chat · Monica · AI · Guide
Trong Module   Work · Chat · Report · AI · Guide
               └──► MỘT Work Zone hợp nhất, mở được từ MỌI màn hình
```

| | Homepage sạch | Work Zone hợp nhất |
|---|---|---|
| Phương án D nguyên bản | ✅ | 🔴 mất — vỡ thành N danh sách |
| **D + `Work` toàn cục** | ✅ | ✅ **giữ** |

⇒ Tu chính §13.3 khi đó **nhỏ và có nguyên tắc**: *Work Zone là **năng lực toàn
cục** mở được từ mọi màn hình, thay vì một **vùng** nhúng trong Homepage.*
Homepage sạch đúng ý Board; năng lực hiến định ⛔ không mất.

**Đề nghị:** ADR tu chính §13.3 theo hướng này, ⛔ không theo hướng xoá.

## 7.5 Đánh giá khách quan mô hình *"hiện toàn bộ, kiểm quyền lúc mở"*

Board yêu cầu đánh giá khách quan. Đây là đánh giá.

### Ưu điểm — thật, và tôi đã đánh giá thấp ở Rev 1

| # | Ưu điểm |
|---|---|
| `A-1` | **Quy mô sản phẩm thấy được ngay** — 19 ô nói *"đây là hệ điều hành"*, 3 ô nói *"đây là một công cụ nội bộ"* |
| `A-2` | **Bán hàng và demo ⛔ không cần dựng bản riêng** — bản khách thấy **đúng** bản nhân viên dùng. ⛔ Không có *"bản demo"* để lệch |
| `A-3` | **Nhân viên mới hiểu doanh nghiệp trong vài giây** — thấy cả tổ chức, ⛔ không chỉ góc của mình |
| `A-4` | **⛔ Không có hai bề mặt để trôi khỏi nhau** — điểm mạnh nhất, và là chỗ Rev 1 của tôi yếu |
| `A-5` | **Thêm Module = thêm một ô.** ⛔ Không phải cập nhật hai nơi |

### Nhược điểm — cũng thật, và phải giảm nhẹ

| # | Nhược điểm | Mức | Giảm nhẹ đề nghị |
|---|---|---|---|
| `N-1` | **Đường cụt lặp lại**: bấm → login → `403`. Thủ kho bấm QA đi **ba bước** để nhận một lời từ chối | 🔴 | **Làm nổi bật** Module có quyền · mờ phần còn lại. ⛔ **Không ẩn** — Board cấm ẩn, và làm mờ ⛔ không phải ẩn |
| `N-2` | **`403` thành màn hình lưu lượng cao** | 🟠 | Trang 403 phải nói **liên hệ ai**. *(Đã nối i18n ở `UI-1.4`; cần bổ sung lối liên hệ)* |
| `N-3` | **`UI-F1` ⛔ không đóng** — khách vẫn đọc được bản đồ vận hành | 🟠 | **Rủi ro được CHẤP NHẬN CÓ CHỦ Ý**, đánh đổi lấy giá trị bán hàng. Ghi vào `GPR` như **giới hạn có tên**, ⛔ không phải lỗ hổng im lặng |
| `N-4` | **Route lộ tên chức danh** — `/giam-doc` · `/to-truong-may` trên thanh địa chỉ, nay khách cũng thấy | 🟠 | Sprint **I-5** — `N-1` của BA-1 §6.3 |
| `N-5` | **19 → 30 ô thành bức tường** | 🟡 | Nhóm theo Navigation Group *(Module Catalog §8.6)* khi vượt ~20 |

### 🔑 Điểm mấu chốt về `N-1`

**Làm mờ ⛔ KHÔNG phải ẩn.** Board cấm *ẩn* Module; Board ⛔ **không** cấm phân
biệt thị giác. Chỉ thị Rev 1 của Board thậm chí đã nói: *"làm nổi bật các module
được cấp quyền"*.

⇒ Hiện **toàn bộ** + **nổi bật thứ mở được** thoả **cả hai**: khách thấy trọn hệ
sinh thái, nhân viên tìm ra bộ phận của mình **⛔ không phải đọc 19 ô**.

⚠️ Điều này ⛔ **không** làm `TC-B` biến mất — §13.5 nói *"display **only**"*,
và làm mờ vẫn là **display**. Tu chính vẫn cần.

## 7.6 Trade-off của Homepage dạng Launcher — bảng cuối

| Chiều | Được | Mất |
|---|---|---|
| **Bán hàng · Demo** | 🟢 **rất mạnh** | — |
| **Onboarding** | 🟢 mạnh | — |
| **Người dùng hằng ngày** | — | 🟠 một cú bấm mỗi sáng · rủi ro đường cụt |
| **Bảo trì** | 🟢 **một bề mặt** | — |
| **Bảo mật** | — | 🟠 `UI-F1` chấp nhận có chủ ý |
| **Mở rộng** | 🟢 tới ~20 ô | 🟡 quá 20 cần nhóm |
| **Hiến pháp** | — | 🔴 **cần tu chính §13.3 · §13.5** |

## 7.7 Đề xuất cuối cùng của Chief Solution Architect

```
✅ CHẤP NHẬN Phương án D — Homepage DUY NHẤT, hiện toàn bộ Module

Kèm BA điều kiện, ⛔ không phải phản đối mà là để D đứng vững:

 ① ADR tu chính §13.3 + §13.5   ⇒ BẮT BUỘC trước khi viết mã
 ② Work Zone thành NĂNG LỰC TOÀN CỤC sau nút `Work`
    ⇒ giữ danh sách việc HỢP NHẤT xuyên Domain — thứ §13.3 thật sự bảo vệ
 ③ Hiện toàn bộ + LÀM NỔI BẬT thứ có quyền
    ⇒ Board cấm ẨN, ⛔ không cấm phân biệt. Giảm `N-1` mà ⛔ không mất `A-1`

⚠️ `UI-F1` chuyển từ "lỗ hổng phải đóng" sang "GIỚI HẠN CÓ TÊN, Board chấp nhận
   để đổi lấy giá trị bán hàng". Ghi vào GPR-001 — ⛔ không im lặng.
```

---
---

# §8 · REVISION 3 — KIỂM CHỨNG LẠI CHÍNH LUẬN ĐIỂM CỦA TÔI

> Board yêu cầu: *"Chỉ đề xuất sửa Constitution nếu **chứng minh được** điều
> khoản hiện tại ⛔ không còn đáp ứng."*
>
> Tôi đọc lại **toàn bộ Điều 13 và Điều 15**, ⛔ không chỉ hai khoản tôi đã trích
> ở Rev 2. Kết quả **đổi hẳn kết luận** — và nó đổi theo hướng **có lợi cho
> Board**.

## 8.1 🔴 PHÁT HIỆN: §13.1 ⟷ §13.3 MÂU THUẪN **NỘI TẠI**

Rev 2 tôi trích §13.3 rồi kết luận *"phương án D va chạm Hiến pháp"*. **Tôi đã
⛔ không đọc §13.1.** Đây là nguyên văn:

> ### §13.1 Constitutional Principle
> *"Its **sole purpose** is to direct users to the appropriate Business
> Workspace, Global Service or Platform Service quickly, clearly and
> confidently.*
> ***The Homepage is not a dashboard.***
> ***The Homepage is not a reporting center.***
> ***The Homepage is not an analytics portal.***
> ***The Homepage is a Business Operating System Launcher."***

⇒ **Phương án D của Board ⛔ KHÔNG mâu thuẫn Hiến pháp. Nó LÀ §13.1, gần như
nguyên văn.**

Và §13.3(a) khai một **Work Zone** *"personal, dynamic … presents the work items
requiring the user's attention"* — đó chính là định nghĩa của một **dashboard cá
nhân**, thứ §13.1 nói **ba lần** rằng Homepage ⛔ không phải.

| | Nguồn | Ban hành | Nói gì |
|---|---|---|---|
| **§13.1** | Hiến pháp **v1.0** — 02/08/2026 | gốc | Homepage **là Launcher**, **⛔ không phải dashboard** |
| **§13.3** | **ADR-017** → v1.6 — 04/08/2026 | tu chính sau | Homepage **gồm hai vùng**, một vùng **là dashboard cá nhân** |

🔑 **`ADR-017` đã đưa mâu thuẫn vào Hiến pháp**, và ⛔ không ai phát hiện — kể cả
tôi, khi thi hành nó ở `UI-1.5`.

## 8.2 Trả lời thẳng câu hỏi Board

> *"Chuyển Work Zone vào nút `Work` có thực sự cần sửa Constitution, hay chỉ là
> thay đổi kiến trúc UI?"*

**Trả lời: CẦN sửa — nhưng ⛔ không phải để bẻ Hiến pháp theo ý Board, mà để
SỬA MỘT MÂU THUẪN ĐÃ CÓ SẴN.** Và phạm vi sửa **nhỏ hơn** tôi nói ở Rev 2.

Ba khoản, xét từng khoản một:

| Khoản | Nguyên văn ràng buộc | Phương án D | Phán quyết |
|---|---|---|---|
| **§13.1** | *"Homepage **is** a Business Operating System Launcher … **is not a dashboard**"* | Homepage = Launcher, ⛔ không dashboard | ✅ **KHỚP — ⛔ không cần sửa** |
| **§13.3** | *"consists of **two** constitutional zones … Work Zone … **shall be the default view upon sign-in** … Neither may be removed"* | Homepage 1 vùng; đăng nhập vào **Workspace** | 🔴 **CẦN SỬA** |
| **§15.3** | *"The constitutional capabilities **are**: Home · Business Communication · AI Assistant · Business Reporting · User Guidance"* | thêm **`Work`** vào thanh dưới | 🟠 **CẦN SỬA — bổ sung danh mục** |

### 8.2.1 Vì sao §13.3 **⛔ không** né được bằng lập luận UI

Tôi đã thử ba lối lách, và **cả ba đều thất bại**:

| # | Lối lách | Vì sao thất bại |
|---|---|---|
| ① | *"Nút `Work` nằm trên Homepage ⇒ vùng đó vẫn 'có mặt'"* | **Một cái nút ⛔ không phải một vùng.** *"Zone"* trong ngôn ngữ bố cục là một **miền của trang**, ⛔ không phải một lối vào |
| ② | *"'Neither may be **removed**' nghĩa là ⛔ không xoá khỏi SẢN PHẨM, ⛔ không phải khỏi Homepage"* | Câu trước đó định nghĩa chúng là *"zones **of the Homepage**"*. Nhưng đây **thật sự mơ hồ** — ⛔ không kết luận được bằng câu này |
| ③ | *"⛔ Không đổi hành vi đăng nhập"* | 🔴 **Chết ở đây.** §13.3(a): *"**shall be the default view upon sign-in**"*. Phương án D đưa người dùng vào **Workspace** sau đăng nhập. Vế này **tường minh, hành vi, ⛔ không mơ hồ** |

🔑 **Khoản ràng buộc thật là *"default view upon sign-in"*, ⛔ không phải *"neither
may be removed"*.** Rev 2 tôi neo vào câu sai — câu mơ hồ — thay vì câu quyết
định. **Kết luận đúng, lý do sai.** Board đã đúng khi bắt tôi chứng minh lại.

⚠️ Và điều này quan trọng: **vế ③ vỡ dù Work Zone ở ĐÂU.** Ngay cả khi giữ
nguyên Work Zone trên Homepage, phương án D vẫn đưa người dùng vào Workspace sau
đăng nhập. ⇒ **§13.3 phải sửa bất kể vị trí Work Zone.** Câu hỏi *"bottom nav
hay Homepage"* ⛔ **không** phải cái quyết định.

### 8.2.2 §15.3 — sửa nhỏ, bổ sung

§15.1 nói thanh dưới là *"the platform's most frequently used **global
capabilities**"* và *"**is not a Workspace launcher**"*.

**Work Zone ⛔ không phải Workspace** — nó là phép chiếu **xuyên mọi Domain**.
⇒ Đặt nó vào thanh dưới **đúng tinh thần §15.1**.

Nhưng §15.3 liệt kê **năm** năng lực bằng câu *"The constitutional capabilities
**are**"* — một câu **định nghĩa**, ⇒ danh mục **đóng**. Thêm `Work` là **bổ
sung danh mục**, cần tu chính, nhưng là loại tu chính **cộng thêm**, ⛔ không
phải loại lật ngược.

## 8.3 ⇒ ĐỀ NGHỊ SỬA ĐỔI — thu hẹp so với Rev 2

| Rev 2 tôi nói | **Rev 3 sau khi chứng minh** |
|---|---|
| Sửa **§13.3 + §13.5** | Sửa **§13.3 + §15.3**, ⛔ **không** sửa §13.5 nữa — xem 8.3.1 |
| Lý do: *"neither may be removed"* | Lý do: ***"default view upon sign-in"*** — vế tường minh |
| Khung: Board đổi Hiến pháp | Khung: **sửa mâu thuẫn `ADR-017` đưa vào** |

### 8.3.1 🔴 §13.5 — tôi rút lại một phần

Rev 2 tôi ghi §13.5 là `TC-B` phải tu chính. Đọc lại nguyên văn:

> *"The Homepage shall display **only** the … Services that the authenticated
> user is authorized to access. Users shall **not be distracted by
> inaccessible** or unrelated Workspaces or Services."*

Vế này **vẫn mâu thuẫn** với *"hiện toàn bộ Module"* — tôi **⛔ không rút lại**
điều đó. Nhưng nó **⛔ không liên quan** tới câu hỏi Board đặt ra ở lượt này
*(Work Zone ⟷ bottom nav)*. Đó là **hai tu chính độc lập**:

| Tu chính | Vì | Ai hưởng lợi |
|---|---|---|
| **A** · §13.3 + §15.3 | Work Zone ra khỏi Homepage, vào thanh dưới | sửa mâu thuẫn §13.1 |
| **B** · §13.5 | Homepage hiện **toàn bộ** Module | bán hàng · demo · onboarding |

⇒ Board có thể duyệt **A** mà ⛔ chưa quyết **B**, hoặc ngược lại. **⛔ Không
gói chung.**

---

# §9 · HOMEPAGE INFORMATION ARCHITECTURE — Rev 3

## 9.1 Ba tầng, ba câu hỏi, ba nơi

```
┌───────────────────────────────────────────────────────────────┐
│ HOMEPAGE            "MONICA ONE là gì · doanh nghiệp có gì"   │
│ Brand + Application Launcher                                  │
│ ⛔ KHÔNG dashboard · KHÔNG KPI · KHÔNG biểu đồ · KHÔNG số      │
└───────────────────────────────────────────────────────────────┘
        │ bấm Module                    ┌──────────────────────┐
        ▼                                │ WORK  (thanh dưới)  │
┌──────────────────┐                     │ "tổng hôm nay tôi   │
│  LOGIN nếu cần   │                     │  phải làm gì"       │
└────────┬─────────┘                     │ xuyên MỌI Domain    │
         ▼                               └──────────┬───────────┘
┌───────────────────────────────────────────────────┴───────────┐
│ WORKSPACE           "làm việc đó ở đâu"                       │
│ Dashboard · KPI · Task · Chart · Thông báo — theo QUYỀN       │
└───────────────────────────────────────────────────────────────┘
```

## 9.2 Cấu trúc thông tin Homepage — bốn tầng, ⛔ không hơn

| # | Tầng | Nội dung | ⛔ Không được có |
|---|---|---|---|
| 1 | **Thanh đầu** | Lời Chúa · logo · chọn ngôn ngữ · *(đã đăng nhập: avatar)* | thông báo · số liệu |
| 2 | **Brand** | wordmark · một dòng nói MONICA ONE là gì | KPI · lời chào theo buổi |
| 3 | **Launcher** | lưới App — icon · tên · **một dòng mô tả** | biểu đồ · số · trạng thái vận hành |
| 4 | **Chân + thanh dưới** | thương hiệu · `Work · Chat · Monica · AI · Guide` | — |

🔑 **Tầng 3 là trái tim.** Board mô tả đúng: *icon · tên · một dòng mô tả*. Đó
cũng chính là mô hình *"màn hình điện thoại"* — thứ **⛔ không cần dạy**.

## 9.3 Một dòng mô tả — quy tắc viết

Board cho ví dụ: *"📦 Kho — Quản lý nhập • xuất • tồn"*. Rút ra chuẩn:

| Quy tắc | Vì sao |
|---|---|
| **3–5 từ, cách nhau bằng `•`** | quét mắt, ⛔ không đọc |
| **Danh từ nghiệp vụ, ⛔ không động từ marketing** | *"Nhập • Xuất • Tồn"* ⛔ không phải *"Tối ưu hoá chuỗi cung ứng"* |
| **⛔ Không viết tắt nội bộ** | khách và nhân viên mới ⛔ không giải mã được |
| **Đi qua i18n** | Điều 45 — 3 ngôn ngữ |
| **Tên Module ⛔ KHÔNG dịch** | §45.3 — từ vựng hiến định |

⚠️ **Bản `shortKey` hiện có ⛔ không dùng lại được nguyên si** — nó viết cho ô
điện thoại 80px, tối ưu cho **ngắn**, ⛔ không cho **hiểu**. Cần một lớp mô tả
**thứ ba**: `tagline` — 3–5 từ, dạng `A • B • C`.

---

# §10 · SÁU GÓC NHÌN NGOÀI BẢO MẬT VÀ UX

Board yêu cầu đánh giá Homepage dưới sáu góc nhìn. Đây là phần tôi thiếu ở Rev 1
và là lý do khuyến nghị Rev 1 của tôi hẹp.

| Góc nhìn | Điều họ hỏi | Homepage-Launcher trả lời thế nào | Mức |
|---|---|---|---|
| **Sales** | *"Sản phẩm này lớn cỡ nào?"* | 19 ô nói **"hệ điều hành"**; 3 ô nói *"một công cụ nội bộ"*. Câu trả lời nằm ở **một khung nhìn**, ⛔ không cần lời | 🟢 **rất mạnh** |
| **Demo** | *"Cho tôi xem 5 phút"* | Bản khách thấy **đúng** bản nhân viên dùng. ⛔ Không có *"bản demo"* để lệch, ⛔ không có dữ liệu giả để lộ | 🟢 **rất mạnh** |
| **Investor** | *"Đây là sản phẩm hay một dự án nội bộ?"* | Lưới có **nhóm năng lực** + nhãn *"Sắp có"* cho thấy **lộ trình**, ⛔ không chỉ hiện trạng. Đây là thứ nhà đầu tư mua | 🟢 **mạnh** |
| **Customer** *(buyer)* | *"Nhà máy này quản lý được không?"* | Thấy QA · Warehouse · Shipment · Subcontract tồn tại **như năng lực có tên** ⇒ tín hiệu **trưởng thành vận hành** | 🟢 **mạnh** |
| **Recruitment** | *"Vào đây tôi làm việc với cái gì?"* | Ứng viên thấy **hệ thống thật**, ⛔ không phải lời hứa. Tuyển IT/vận hành đều dùng được | 🟡 **trung bình** |
| **Onboarding** | *"Bộ phận tôi ở đâu?"* | Thấy **toàn tổ chức** rồi tự định vị. Nhưng 19 ô ⇒ người mới phải **quét cả lưới** | 🟡 **trung bình — cần làm nổi bật** |

## 10.1 🔑 Hai góc nhìn yếu nhất chỉ vào **cùng một** biện pháp

**Recruitment** và **Onboarding** đều yếu vì cùng một lý do: **19 ô ngang hàng
⇒ ⛔ không có điểm neo.**

⇒ Biện pháp: **làm nổi bật Module người dùng có quyền** *(và với khách: nổi bật
nhóm năng lực)*. Đây **đúng thứ Board đã nói ở Directive Rev 1** — *"làm nổi bật
các module được cấp quyền"* — và nó **⛔ không phải ẩn**.

🔑 **Một biện pháp, sửa được cả hai góc nhìn yếu nhất, ⛔ không mất gì ở bốn góc
mạnh.** Đây là khuyến nghị có tỷ lệ lợi/hại tốt nhất trong cả tài liệu.

## 10.2 Điều sáu góc nhìn **⛔ không** nói tới

⚠️ **⛔ Không góc nào trong sáu góc là "người dùng hằng ngày".** Sales · Demo ·
Investor · Customer · Recruitment · Onboarding đều là **người xem một lần**.

Người vận hành mở hệ thống **250 lần mỗi năm**. Với họ, Launcher là **một cú bấm
thừa mỗi sáng**.

⇒ **Đó chính là lý do nút `Work` ở thanh dưới quan trọng**: nó cho người dùng
hằng ngày một đường tắt **⛔ không làm hỏng** Homepage của sáu góc nhìn kia.

**Homepage phục vụ người xem một lần. Thanh dưới phục vụ người dùng mỗi ngày.**
Hai khán giả, hai bề mặt — nhưng lần này là **hai bề mặt ĐÚNG CHỖ**, ⛔ không
phải hai Homepage như đề xuất đã bị bác ở Rev 1.

---

# §11 · TRADE-OFF · TÁC ĐỘNG ADR · KHUYẾN NGHỊ

## 11.1 Tác động tới ADR và Baseline

| Văn bản | Tác động |
|---|---|
| **ADR-017** | 🔴 **PHẢI SỬA** — nó đưa §13.3 vào và **tạo mâu thuẫn với §13.1**. Cần một ADR mới *(đề nghị `ADR-021`)* **thay thế** phần §13.3 |
| **Hiến pháp §13.3** | 🔴 tu chính — Work Zone thành **năng lực toàn cục**, bỏ *"default view upon sign-in"* |
| **Hiến pháp §15.3** | 🟠 tu chính — bổ sung `Work` vào danh mục năng lực |
| **Hiến pháp §13.5** | 🟠 tu chính **RIÊNG** — nếu Board chốt *"hiện toàn bộ Module"* |
| **Hiến pháp §13.1** | ✅ **⛔ KHÔNG đụng** — phương án D chính là §13.1 |
| **ADR-015** | ✅ **⛔ KHÔNG đụng** — `Department ⛔ ≠ Workspace` đã xác nhận |
| **`ARCHITECTURE_BASELINE`** | 🟠 ghi nhận ADR mới sau khi Board duyệt |
| **`screen-gates.json`** | 🟠 mục `/` phải đánh giá lại — `G4` đổi khi Homepage hiện toàn bộ |

## 11.2 Trade-off — bảng cuối cùng

| Chiều | Homepage-Launcher *(D)* | Cái phải trả |
|---|---|---|
| Sales · Demo · Investor · Customer | 🟢 **rất mạnh** | — |
| Recruitment · Onboarding | 🟡 trung bình | ⇒ **làm nổi bật** thứ có quyền |
| Người dùng hằng ngày | 🟠 một cú bấm thừa | ⇒ nút **`Work`** thanh dưới |
| Bảo trì | 🟢 **một bề mặt** | — |
| Bảo mật | 🟠 `UI-F1` — giới hạn **có tên** | Board chấp nhận có chủ ý |
| Hiến pháp | — | 🔴 **2 tu chính** *(+1 nếu chốt §13.5)* |

## 11.3 Khuyến nghị cuối cùng

```
╔═══════════════════════════════════════════════════════════════════════╗
║  KHUYẾN NGHỊ Rev 3 — Chief Solution Architect                         ║
║                                                                       ║
║  ✅ PHƯƠNG ÁN D ĐÚNG, VÀ ĐÚNG HƠN TÔI TƯỞNG.                          ║
║     §13.1 nói nguyên văn: "The Homepage IS a Business Operating       ║
║     System Launcher … is NOT a dashboard."                            ║
║     Board ⛔ không đề xuất đổi Hiến pháp — Board đang KHÔI PHỤC nó.    ║
║                                                                       ║
║  🔴 VẤN ĐỀ THẬT: ADR-017 đưa §13.3 vào và tạo mâu thuẫn với §13.1.    ║
║     ⇒ Cần ADR-021 SỬA MÂU THUẪN, ⛔ không phải "bẻ luật theo ý Board". ║
║                                                                       ║
║  Ba việc, xếp theo thứ tự:                                            ║
║   ① ADR-021 · tu chính §13.3 + §15.3   ⇒ Work Zone thành năng lực     ║
║      toàn cục sau nút `Work`. BẮT BUỘC trước khi viết mã.             ║
║   ② Làm nổi bật Module có quyền        ⇒ sửa cả Recruitment lẫn       ║
║      Onboarding, ⛔ không mất gì ở 4 góc nhìn mạnh                     ║
║   ③ §13.5 quyết RIÊNG                  ⇒ ⛔ không gói chung với ①      ║
║                                                                       ║
║  ⚠️ Tôi rút lại cách diễn đạt ở Rev 2: khoản ràng buộc thật là        ║
║     "default view upon sign-in", ⛔ không phải "neither may be removed".║
║     Kết luận cũ ĐÚNG, lý do SAI. Board đã đúng khi bắt chứng minh lại. ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---
---

# §12 · REVISION 4 — ĐỊNH NGHĨA HOMEPAGE ĐẦY ĐỦ

## 12.1 Ba vai trò **đồng thời**, ⛔ không phải ba chế độ

Board chốt: Homepage là **Product Identity** · **BOS Launcher** · **Entry Point**.

⚠️ **Đây ⛔ KHÔNG mâu thuẫn với quyết định "một Homepage duy nhất" ở Rev 2.** Ba
vai trò này ⛔ không phải ba **phiên bản** — chúng là ba **việc mà cùng một trang
làm cùng lúc**, cho ba khán giả khác nhau.

| Vai trò | Trả lời | Khán giả | Chiếm chỗ nào trên trang |
|---|---|---|---|
| **Product Identity** | *"MONICA ONE là gì"* | Sales · Demo · Investor · Recruitment | **tầng 2** — khối thương hiệu |
| **BOS Launcher** | *"doanh nghiệp có những gì · tôi bắt đầu ở đâu"* | nhân viên · onboarding · customer | **tầng 3** — lưới App |
| **Entry Point** | *"mọi đường đều về được đây"* | **tất cả** | **toàn trang** + nút `Home` §15.4 |

🔑 **Ba vai ⛔ không tranh nhau vì chúng nằm ở ba tầng khác nhau của trang** —
trừ **một chỗ**, và đó là trade-off thật duy nhất: xem 12.4.

## 12.2 🔴 TÔI PHẢI SỬA LẠI MỘT CÂU CỦA CHÍNH MÌNH Ở Rev 3

Rev 3 tôi kết luận: ***"§13.1 ✅ ⛔ KHÔNG đụng — phương án D chính là §13.1."***

**Câu đó ⛔ không còn đúng sau chỉ thị Rev 4.** Nguyên văn §13.1:

> *"Its **sole purpose** is to direct users to the appropriate Business
> Workspace, Global Service or Platform Service quickly, clearly and
> confidently."*

**`sole purpose`** — *mục đích **duy nhất***. Board vừa giao cho Homepage **một
mục đích thứ hai**: thể hiện thương hiệu MONICA ONE.

### 12.2.1 Nhưng đây là xung đột **MỀM**, ⛔ không cùng hạng với §13.3

Tôi xét hai cách đọc, và ⛔ không giấu cách đọc bất lợi cho mình:

| | Cách đọc | Kết luận |
|---|---|---|
| **A** *(mềm)* | Thương hiệu là **CÁCH** Homepage dẫn hướng — *trình bày*, ⛔ không phải *mục đích*. §13.1 loại trừ **dashboard · reporting · analytics**; thương hiệu ⛔ không thuộc ba thứ đó | ⇒ **⛔ không cần tu chính** |
| **B** *(chặt)* | `sole` là từ **tuyệt đối**. Thêm bất kỳ mục đích nào cũng phá nó | ⇒ **cần tu chính** |

**Cách đọc A đứng vững.** ⇒ Đây **⛔ KHÔNG phải blocker**, khác hẳn §13.3 *(nơi
`"shall be the default view upon sign-in"` là vế **hành vi, tường minh, ⛔ không
cách đọc nào cứu được**)*.

### 12.2.2 🔑 Nhưng có một vấn đề THẬT, và nó khác vấn đề tôi vừa nêu

```
Product Identity là vai trò DUY NHẤT trong ba vai
⛔ KHÔNG có một câu nào trong Hiến pháp bảo vệ.
```

- **Launcher** → §13.1 bảo vệ *("The Homepage **is** a … Launcher")*
- **Entry Point** → §13.1 + §15.4 bảo vệ *("primary entry point" · nút `Home`)*
- **Product Identity** → 🔴 **⛔ không điều khoản nào**

⚠️ Và §13.2 nói *"shall **minimize cognitive effort** and **eliminate
unnecessary** decision-making"*. Một kỹ sư tương lai hoàn toàn có thể **xoá khối
thương hiệu** và trích §13.2 làm căn cứ — thương hiệu, xét chặt, ⛔ không phải
*decision-making*.

⇒ **Rủi ro thật ⛔ không phải "vi hiến". Rủi ro thật là "⛔ không được bảo vệ".**
Board đặt Product Identity ngang hàng hai vai kia; Hiến pháp thì ⛔ không.

⇒ **`TC-C`:** thêm **một câu** vào §13.1 công nhận Product Identity. **Gộp vào
`ADR-021`**, ⛔ **không** mở ADR riêng — nó quá nhỏ để tốn một ADR, và `ADR-021`
đằng nào cũng đang sửa Điều 13.

## 12.3 Cấu trúc thông tin Homepage — Rev 4

| Tầng | Vai trò phục vụ | Nội dung | ⛔ KHÔNG được có |
|---|---|---|---|
| **1 · Thanh đầu** | Entry Point | Lời Chúa · logo · ngôn ngữ · *(đã đăng nhập: avatar)* | thông báo · số liệu |
| **2 · Brand** | **Product Identity** | wordmark · **một dòng** MONICA ONE là gì | KPI · lời chào theo buổi · ảnh nền nặng |
| **3 · Launcher** | **BOS Launcher** | lưới App — icon · tên · **một dòng mô tả** | biểu đồ · số · trạng thái vận hành |
| **4 · Chân + thanh dưới** | Entry Point | thương hiệu · `Work · Chat · Monica · AI · Guide` | — |

⚠️ **Tầng 2 là tầng mới của Rev 4** — Rev 3 tôi đã có nó nhưng ⛔ không gọi tên
vai trò, nên nó ⛔ không có gì bảo vệ. Nay nó có tên.

## 12.4 🔴 TRADE-OFF THẬT DUY NHẤT: tầng 2 ⟷ tầng 3 tranh **màn hình đầu**

Ba vai ⛔ không tranh nhau về **chức năng**. Chúng tranh nhau **đúng một thứ:
khoảng màn hình phía trên nếp gấp.**

```
Khối Brand cao thêm 200px
  ⇒ hàng ô App đầu tiên bị đẩy xuống dưới nếp gấp
  ⇒ người vận hành phải CUỘN mỗi sáng — 250 lần/năm
  ⇒ để phục vụ một khán giả CHỈ XEM MỘT LẦN.
```

Đây chính là câu ở `§10.2`: **Homepage phục vụ người xem một lần, thanh dưới
phục vụ người dùng mỗi ngày.** Nhưng khối Brand nằm **trên** Homepage ⇒ nó **thu
phí người dùng hằng ngày** để trả cho người xem một lần.

### 12.4.1 ⇒ Quy tắc nghiệm thu **đo được** *(⛔ không phải ý kiến thẩm mỹ)*

| # | Quy tắc | Cách đo |
|---|---|---|
| `HP-1` | **Hàng ô App ĐẦU TIÊN phải thấy được ⛔ KHÔNG cần cuộn** | 1366×768 *(laptop)* **và** 390×844 *(điện thoại)* |
| `HP-2` | Khối Brand là **một dòng**, ⛔ **không** phải hero | ⛔ không ảnh nền toàn màn · ⛔ không khối cao > 25% viewport |
| `HP-3` | Thương hiệu **⛔ không** cần chỗ để được nhận ra | wordmark ở thanh đầu **đã là** Product Identity |

🔑 **`HP-3` là lối thoát của trade-off.** Product Identity ⛔ không đòi **diện
tích** — nó đòi **sự hiện diện**. Một wordmark sắc nét ở tầng 1 cộng một dòng ở
tầng 2 nói được *"đây là một sản phẩm"* mà **⛔ không lấy mất hàng ô đầu tiên**.

⇒ Cả ba khán giả được phục vụ, và **⛔ không ai trả giá bằng cú cuộn mỗi sáng**.

## 12.5 `Entry Point` — ba hệ quả bắt buộc

| # | Hệ quả | Vì sao |
|---|---|---|
| `EP-1` | Homepage phải **có nghĩa** ở **cả hai** trạng thái — khách **và** đã đăng nhập | nó là điểm vào của **toàn hệ thống**, ⛔ không riêng của nhân viên |
| `EP-2` | Nút `Home` §15.4 **luôn** về đây, từ **mọi** Workspace | ⛔ Không có nó, Homepage là *"trang đăng nhập"*, ⛔ không phải *"điểm vào"* |
| `EP-3` | 403 phải có **đường về Homepage**, ⛔ không chỉ về `ROLE_HOME` | khách bấm nhầm App ⇒ ⛔ không có `ROLE_HOME` để về |

⚠️ **`EP-3` là khuyết tật sẽ xuất hiện ngay khi Phương án D chạy.** Hôm nay
`/unauthorized` đưa người dùng về `ROLE_HOME[role]`, và khi ⛔ chưa có vai thì về
`/`. Điều đó **đúng hôm nay** — nhưng khi Homepage hiện **toàn bộ** Module, số
lượt vào 403 sẽ tăng mạnh *(`N-2` §7.5)*, và **màn 403 trở thành một phần của
luồng duyệt bình thường**, ⛔ không còn là ngoại lệ. Nó cần được thiết kế như
vậy — ⛔ **không** phải sửa mã bây giờ.

---

# §13 · TỔNG HỢP UX-1 Rev 4

## 13.1 Vấn đề phát hiện

| # | Vấn đề | Mức |
|---|---|---|
| `TC-C` | **Product Identity ⛔ KHÔNG có điều khoản nào bảo vệ** — §13.2 còn có thể bị trích để xoá nó | 🟠 vừa |
| `HP-1` | Khối Brand có thể **đẩy hàng ô đầu tiên xuống dưới nếp gấp** ⇒ thu phí người dùng hằng ngày | 🟠 vừa |
| `EP-3` | 403 sẽ thành **màn hình lưu lượng cao** và cần đường về Homepage cho **khách** | 🟠 vừa |

## 13.2 Giả định bị bác bỏ *(Rev 4)*

| Giả định | Ai nêu | Phán quyết |
|---|---|---|
| *"§13.1 ✅ ⛔ không đụng"* | **tôi**, Rev 3 | 🟠 **SỬA** — `sole purpose` va chạm **mềm** với Product Identity. ⛔ Không phải blocker, nhưng **phải ghi** |
| *"Homepage = Launcher"* *(đủ)* | **tôi**, Rev 3 | 🟠 **THIẾU** — Launcher là **một trong ba** vai, ⛔ không phải toàn bộ |
| *"Ba vai trò ⇒ ba chế độ"* | rủi ro hiểu nhầm | 🔴 **BÁC TRƯỚC** — ba vai **đồng thời** trên **một** trang. Rev 2 đã bác *"hai bề mặt"*; ⛔ đừng để nó quay lại dưới tên khác |

## 13.3 Tác động ADR *(gộp Rev 4)*

| ADR | Nội dung |
|---|---|
| **`ADR-021`** | §13.3 *(Work Zone)* + §15.3 *(nút `Work`)* + **§13.1 `sole purpose`** ← gộp `TC-C` vào đây |
| **`ADR-022`** | §13.5 — quyết **riêng** |
| **`ADR-023`** | Capability Layer — Board **đã đồng ý hướng** |
| **`ADR-024`** | Signature versioning — `BA-1 §14.2` |

## 13.4 Khuyến nghị cuối cùng — UX-1 Rev 4

```
╔═══════════════════════════════════════════════════════════════════════╗
║  ① BA VAI, MỘT TRANG, BA TẦNG. Product Identity · Launcher · Entry    ║
║     Point ⛔ không tranh nhau về chức năng — chúng tranh nhau ĐÚNG     ║
║     MỘT thứ: khoảng màn hình trên nếp gấp.                            ║
║                                                                       ║
║  ② `HP-1` LÀ ĐIỀU KIỆN NGHIỆM THU, ⛔ KHÔNG phải ý kiến thẩm mỹ.      ║
║     Hàng ô App đầu tiên phải thấy được ⛔ không cuộn, ở 1366×768 VÀ    ║
║     390×844. Đo được ⇒ tranh luận về thẩm mỹ kết thúc bằng phép đo.   ║
║                                                                       ║
║  ③ GỘP `TC-C` VÀO ADR-021, ⛔ KHÔNG mở ADR riêng.                     ║
║     Product Identity ⛔ không vi hiến — nó ⛔ KHÔNG ĐƯỢC BẢO VỆ. Một   ║
║     câu trong §13.1 là đủ, và ADR-021 đằng nào cũng đang sửa Điều 13. ║
║                                                                       ║
║  ④ `HP-3` LÀ LỐI THOÁT: thương hiệu đòi SỰ HIỆN DIỆN, ⛔ không đòi    ║
║     DIỆN TÍCH. Wordmark ở thanh đầu + một dòng ở tầng 2 phục vụ đủ    ║
║     cả ba khán giả mà ⛔ không ai trả giá bằng cú cuộn mỗi sáng.       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

> **Trạng thái Rev 4:** ⏳ trình Board. ⛔ Chưa viết một dòng Production Code nào.

---
---

# §14 · REVISION 5 — LAUNCHER IDENTITY STANDARD

> `BA-1 §20` khai **Module Identity là DỮ LIỆU** *(10 trường)*.
> §14 này khai **cách dựng nó thành PIXEL** — hợp đồng hiển thị của ô Launcher.

## 14.1 Một ô Launcher — bảy trường Board yêu cầu, đặt vào đâu

```
┌──────────────────────────────────┐
│  ┌────┐                          │  ① Icon    — 24px, `lucide-react`
│  │ 📦 │  ← ② Color: nền `soft`   │  ② Color   — MODULE_IDENTITY
│  └────┘                          │  ③ Name    — ⛔ KHÔNG dịch (§45.3)
│                                  │  ⑥ Tagline — 3–5 từ, `A • B • C`
│  Kho                       ③     │  ④ Dept    — chỉ khi Board bật nhóm
│  Nhập • Xuất • Tồn         ⑥     │  ⑦ State   — quyết ĐỘ ĐẬM của cả ô
│                                  │
│                     [Sắp có] ⑦   │  ⑤ Business Value — ⛔ KHÔNG ở đây
└──────────────────────────────────┘     → tooltip / trang giới thiệu
```

⚠️ **⑤ `Business Value` cố ý ⛔ KHÔNG in trên ô.** Một câu đầy đủ trên **16 ô**
biến lưới thành **một bức tường chữ** — đúng thứ `N-5` §7.5 cảnh báo. Nó phục vụ
Sales · Investor, mà hai khán giả đó **đọc**, ⛔ không **quét**. ⇒ đặt ở tooltip
và trang giới thiệu; ô Launcher giữ `tagline`.

🔑 **Hai câu, hai khán giả, hai chỗ** — `MI-b` của `BA-1 §10.3`.

## 14.2 `Permission State` quyết định **duy nhất một thứ**: độ đậm

| State | Ô | Nhãn | Con trỏ | Bấm |
|---|---|---|---|---|
| `AUTHORIZED` | **đủ màu** — `soft` + `primary` | — | `pointer` | → Workspace |
| `UNAUTHORIZED` | **làm mờ** — độ mờ giảm, giữ nguyên **màu nhận diện** | — | `pointer` | → 403 |
| `COMING_SOON` | xám trung tính | **"Sắp có"** | `not-allowed` | ⛔ ⛔ không bấm |
| `ANONYMOUS` | **đủ màu** — như `AUTHORIZED` | — | `pointer` | → `/login` |

### 14.2.1 🔴 Ba luật ⛔ không được vi phạm

| # | Luật | Vì sao |
|---|---|---|
| `LI-1` | **`UNAUTHORIZED` LÀM MỜ, ⛔ KHÔNG ẨN, và ⛔ KHÔNG đổi màu nhận diện** | Board cấm ẩn. Đổi ô Kho thành xám = **phá `MI-a`** — người dùng học *"xanh lá = Kho"*, ⛔ không học *"xám = ⛔ không quyền"* |
| `LI-2` | **`ANONYMOUS` ⛔ KHÔNG được làm mờ** | với khách, hệ thống **⛔ không biết** họ sẽ có quyền gì ⇒ làm mờ là **nói dối**, và nó giết đúng giá trị bán hàng Board mua bằng Phương án D |
| `LI-3` | **Độ mờ ⛔ KHÔNG được xuống dưới ngưỡng đọc được** | *"làm mờ"* là **giảm nhấn**, ⛔ không phải *"ẩn bằng cách khác"*. Ô mờ tới mức ⛔ không đọc nổi = **ẩn trá hình** ⇒ vi phạm chỉ thị Board |

⚠️ **`LI-3` cần một con số, ⛔ không phải một tính từ.** Đề nghị: chữ trên ô mờ
vẫn phải đạt **tương phản ≥ 4,5:1** — cùng ngưỡng `MODULE_IDENTITY` đang tuân
*(chú thích `finance` trong `tokens.ts`)*. ⇒ *"làm mờ"* trở thành thứ **đo
được**, ⛔ không phải thứ tranh luận.

## 14.3 🔑 Vì sao tính `Permission State` ở client là **an toàn**

```
Permission State nằm ở BẬC ③ của Permission Architecture.
Bậc ①–④ = TRẢI NGHIỆM.  Bậc ⑤–⑦ = AN NINH.        ← PA-1
```

⇒ Ô Launcher **⛔ chưa bao giờ** là hàng rào, kể cả trước quyết định của Board.
Hàng rào là `guard.ts` *(⑤)*, `guard()` trong Server Action *(⑥)*, và **RLS**
*(⑦)*. ⇒ `Permission State` sai **⛔ không tạo ra lỗ hổng** — nó chỉ tạo ra một
**cú bấm hụt**.

🔑 **Đây là `PA-2` nhìn từ phía giao diện**, và nó biến quyết định *"Launcher ⛔ ≠
Permission"* của Board từ chỗ trông như **nới lỏng bảo mật** thành **một phát
biểu đúng về kiến trúc**.

## 14.4 `Department` — trường ⛔ **chưa** bật

Trường ④ `Department` có trong chuẩn nhưng **⛔ chưa hiển thị ở Phase 1**:

| | |
|---|---|
| **Vì sao có** | `Module Catalog` cần nó · `Business Owner` §19 cần nó · nhóm điều hướng sẽ cần nó |
| **Vì sao ⛔ chưa hiện** | 16 ô **⛔ chưa cần nhóm**. `NV-2` đặt ngưỡng **~20 ô**; thêm nhãn phòng ban lúc này là **thêm chữ mà ⛔ không thêm nghĩa** |
| **Bật khi nào** | khi lưới vượt ~20 ô, hoặc khi Board bật **Navigation Groups** *(`BA-1 §8.6`)* |

⚠️ Và `Department` trên ô Launcher sẽ **va vào Hiến pháp §13.3**: *"The Homepage
shall **not** be organized by organizational hierarchy, job titles or technical
system modules."* ⇒ Nếu bật, phải nhóm theo **năng lực**, ⛔ **không** theo phòng
ban — đúng `BA-1 §8.6`. Ghi ở đây để ⛔ không ai bật nhầm.

---

# §15 · TỔNG HỢP UX-1 Rev 5

## 15.1 Vấn đề phát hiện

| # | Vấn đề | Mức |
|---|---|---|
| `LI-3` | *"Làm mờ"* ⛔ không có ngưỡng ⇒ dễ trượt thành **ẩn trá hình** | 🟠 vừa |
| `LI-1` | Làm mờ bằng cách **đổi sang xám** sẽ phá `MI-a` *(màu = định danh)* | 🟠 vừa |
| §14.4 | `Department` trên ô Launcher **va §13.3** *(⛔ không tổ chức theo phòng ban)* | 🟠 ghi trước |

## 15.2 Giả định bị bác bỏ

| Giả định | Phán quyết |
|---|---|
| *"Bảy trường Board nêu đều in trên ô"* | 🔴 **BÁC** — `Business Value` in trên **16 ô** biến lưới thành **bức tường chữ** *(`N-5`)*. Nó thuộc tooltip |
| *"`UNAUTHORIZED` và `ANONYMOUS` hiển thị như nhau"* | 🔴 **BÁC** — với khách, làm mờ là **nói dối**: hệ thống ⛔ không biết họ sẽ có quyền gì |
| *"Làm mờ = đổi sang xám"* | 🔴 **BÁC** — phá màu định danh `MI-a` |

## 15.3 Khuyến nghị cuối cùng — UX-1 Rev 5

```
╔═══════════════════════════════════════════════════════════════════════╗
║  ① `LI-3` PHẢI CÓ MỘT CON SỐ: chữ trên ô mờ vẫn ≥ 4,5:1.             ║
║     ⛔ Không có ngưỡng, "làm mờ" sẽ trượt dần thành "ẩn trá hình" —    ║
║     và khi đó chỉ thị "⛔ KHÔNG ẨN MODULE" của Board bị vi phạm mà     ║
║     ⛔ không ai chỉ ra được lúc nào.                                   ║
║                                                                       ║
║  ② LÀM MỜ BẰNG ĐỘ MỜ, ⛔ KHÔNG bằng cách đổi màu.                     ║
║     Màu là ĐỊNH DANH (`MI-a`). Ô Kho phải luôn là màu Kho, kể cả khi  ║
║     người xem ⛔ không có quyền vào.                                   ║
║                                                                       ║
║  ③ `ANONYMOUS` HIỂN THỊ NHƯ `AUTHORIZED`.                            ║
║     Làm mờ với khách là nói dối — và nó giết đúng giá trị bán hàng    ║
║     mà Board mua bằng Phương án D.                                    ║
║                                                                       ║
║  ④ `Business Value` VÀO TOOLTIP, ⛔ KHÔNG lên ô.                      ║
║     Hai câu, hai khán giả, hai chỗ. Người vận hành QUÉT `tagline`;    ║
║     Sales và Investor ĐỌC `businessValue`.                            ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

> **Trạng thái Rev 5:** ⏳ trình Board. ⛔ Chưa viết một dòng Production Code nào.

---
---

# §16 · REVISION 6 — HỆ QUẢ CỦA QUYẾT ĐỊNH NGUỒN CHÂN LÝ

> Board cho phép cập nhật UX-1 *"nếu cần"*. Quyết định ở `BA-1 §22` *(hợp nhất
> bất đối xứng)* chạm vào **đúng một** chỗ của UX-1. Tôi ghi **một mục**, ⛔ không
> viết thêm cho đủ số.

## 16.1 `Permission State` sẽ đọc một claim **có thể CŨ** — và điều đó **⛔ không sao**

`BA-1 §22.3` chốt: bậc ②③④ đọc **claim đã chiếu**, ⛔ không đọc CSDL sống.
`Permission State` *(§14.2)* nằm ở **bậc ③**.

⇒ Một người vừa **bị thu hồi quyền** có thể vẫn thấy ô hiện `AUTHORIZED` **cho
tới khi token làm mới**.

| | |
|---|---|
| **Hậu quả tối đa** | họ **bấm vào**, và bậc ⑤⑥⑦ **chặn lại** ⇒ ra màn **403** |
| **Có phải lỗ hổng ⛔ không?** | 🔴 **⛔ KHÔNG** — `PA-1`: bậc ③ **⛔ chưa bao giờ** là hàng rào |
| **⇒ §14 có phải sửa ⛔ không?** | ✅ **⛔ KHÔNG. Giữ nguyên.** |

🔑 Đây là **cùng một lập luận** đã dùng cho quyết định *"Launcher ⛔ ≠
Permission"* của Board: ô Launcher sai ⇒ **một cú bấm hụt**, ⛔ không phải một lỗ
hổng. Nay nó áp thêm cho **claim cũ** — cùng bậc, cùng kết luận.

## 16.2 ⚠️ Nhưng nó làm `EP-3` **nặng thêm**

`EP-3` §12.5 đã ghi: *"403 sẽ thành màn hình lưu lượng cao"*. Nay có **nguồn thứ
hai** đổ vào cùng màn hình đó:

```
Nguồn 1 · Phương án D  → khách/nhân viên bấm Module ⛔ không có quyền   (đã biết)
Nguồn 2 · claim cũ     → người VỪA BỊ THU HỒI quyền vẫn thấy ô sáng   (MỚI)
```

⚠️ **Nguồn 2 gây bối rối hơn nguồn 1.** Người dùng ở nguồn 1 **⛔ chưa từng** có
quyền — họ hiểu ngay. Người ở nguồn 2 **vừa mới hôm qua còn vào được** ⇒ với họ,
403 trông như **lỗi hệ thống**, ⛔ không phải như một quyết định phân quyền.

⇒ **`EP-4`:** màn 403 phải nói được *"quyền của bạn **vừa thay đổi** — hãy đăng
nhập lại"*, ⛔ không chỉ *"bạn ⛔ không có quyền"*. Phân biệt được hai nguồn bằng
cách so **claim** với **quyền thật** tại thời điểm bị chặn.

⛔ **Không sửa mã bây giờ** — ghi để khi `ADR-023` bước `B3` chạy thì `EP-4` đã
nằm sẵn trong yêu cầu, ⛔ không phải phát hiện lại sau khi người dùng kêu.

---

> **Trạng thái Rev 6:** ⏳ trình Board. ⛔ Chưa viết một dòng Production Code nào.
> **⛔ Không thay đổi nào khác ở UX-1** — §14 giữ nguyên.

---

# §0 · BỐN ĐIỂM VA CHẠM VỚI HIẾN PHÁP — ĐỌC TRƯỚC

> Board yêu cầu phản biện thẳng. Đây là phần thẳng nhất.
>
> ⚠️ Tôi ⛔ **không** kết luận Board sai. Tôi chỉ ra rằng **bốn** điểm trong chỉ
> thị mâu thuẫn với **văn bản bậc 1 đang có hiệu lực**, nên chúng ⛔ không thi
> hành được bằng một chỉ thị — chúng cần **ADR + tu chính Hiến pháp** *(§37)*.

## `VC-1` 🔴 *"Homepage ⛔ KHÔNG PHẢI Work Zone"* ⟷ Hiến pháp §13.3

Chỉ thị viết: *"Homepage ⛔ không phải Work Zone… Work Zone chỉ hiện sau khi
người dùng chọn Module và đăng nhập."*

**§13.3 nguyên văn** *(ADR-017 → v1.6)*:

> *"It consists of **two constitutional zones**: **(a) The Work Zone** … and
> **shall be the default view upon sign-in**. **(b)** The Business Operating
> System Launcher …
> **Both zones are constitutional. Neither may be removed.**"*

⇒ Hiến pháp đặt Work Zone **TRÊN Homepage**, và là **khung nhìn mặc định khi
đăng nhập**. Chỉ thị dời nó **ra khỏi** Homepage.

🔑 **Đây ⛔ không phải tôi tự giả định** — Board nói đúng rằng *"Homepage sau
đăng nhập phải trở thành Work Zone"* là một giả định kỹ thuật. Nhưng nó ⛔
**không phải giả định của tôi**: nó là **§13.3**, do chính Board ban hành qua
ADR-017 ngày 04/08/2026. `UI-1.5` thi hành điều khoản đó.

⇒ Muốn đổi thì **tu chính §13.3**. Tôi ⛔ không tự làm.

## `VC-2` 🔴 *"Chọn Department"* ⟷ Hiến pháp §13.3 câu cuối

**§13.3 nguyên văn**:

> *"The Homepage **shall not be organized by organizational hierarchy, job
> titles or technical system modules**."*

Luồng trong chỉ thị: *"Homepage → chọn **Department** / Module"*, và BA-1 yêu
cầu *"Workspace Definition cho **từng phòng ban**"*.

⇒ Tổ chức Homepage theo **phòng ban** là đúng thứ §13.3 **cấm tường minh**.

**Và nó đảo ngược ADR-015.** 14 Business Workspace được duyệt là **miền năng
lực**, ⛔ không phải sơ đồ tổ chức — xem §1.2 dưới đây. Đây là điểm sâu nhất của
cả tài liệu.

## `VC-3` 🟠 Bottom Navigation ⟷ Hiến pháp §15.3 · §15.4

**§15.3 nguyên văn**: năm năng lực hiến định là **Home · Business Communication
· AI Assistant · Business Reporting · User Guidance**, và
*"The Bottom Navigation shall contain **only platform-wide capabilities**."*

| Vị trí | Chỉ thị Board | §15.3 | Nhận xét |
|---|---|---|---|
| 1 | `Work` | `Home` | §15.4: *"Home shall **always** return users to the constitutional Homepage"* |
| 2 | `Chat` | Business Communication | ✅ khớp |
| 3 | **`Monica`** *(Website/Brand)* | AI Assistant | 🔴 Website/thương hiệu ⛔ **không phải** *platform-wide capability* |
| 4 | `AI` | Business Reporting | lệch vị trí |
| 5 | `Guide` | User Guidance | ✅ khớp |

⇒ Bản Homepage của chỉ thị **thay `Business Reporting` bằng một liên kết
thương hiệu**. Đó là chỗ va chạm thật: §15.3 nói bottom nav chỉ chứa **năng lực
nền tảng**, và một trang giới thiệu công ty ⛔ không phải năng lực.

⚠️ Ý *"Homepage ⛔ không cần nút Home"* thì **hợp lý** — đứng ở nhà mà có nút về
nhà là thừa. Nhưng cách giải quyết đúng là **tu chính §15.4**, ⛔ không phải
lặng lẽ đổi.

## `VC-4` 🟢 Showcase cho khách ⟷ §13.5 — **⛔ KHÔNG va chạm**

**§13.5 nguyên văn**:

> *"The Homepage shall display only the … Services that **the authenticated
> user is authorized to access**."*

🔑 Điều khoản này ràng buộc **người ĐÃ xác thực**. Nó **im lặng** về khách chưa
đăng nhập. ⇒ Showcase cho khách **⛔ không vi phạm §13.5** — đó là **khoảng
trống**, ⛔ không phải mâu thuẫn.

⚠️ Nhưng nó **mở lại `UI-F1`** như một rủi ro **cạnh tranh**, ⛔ không phải rủi
ro hiến định. Xem §3.

---

# §1 · BA KHÁI NIỆM — VÀ MỘT KHÁI NIỆM THỨ TƯ BỊ THIẾU

## 1.1 Ba khái niệm Board nêu — tôi đồng ý hoàn toàn

| | Là gì | Phục vụ ai | Trả lời câu hỏi |
|---|---|---|---|
| **Homepage** | Application Launcher | mọi người | *"Doanh nghiệp này có những gì?"* |
| **Work Zone** | Dashboard cá nhân | người đã đăng nhập | *"Hôm nay tôi phải làm gì?"* |
| **Workspace** | Nơi thao tác nghiệp vụ | người có quyền | *"Làm việc đó thế nào?"* |

Ba câu hỏi **khác nhau**, ba nhịp **khác nhau**. Việc Board tách bạch chúng là
**đúng**, và nó sửa một chỗ nhập nhằng có thật trong `UI-1.5`.

## 1.2 🔴 Khái niệm thứ tư bị thiếu: **DEPARTMENT ⛔ KHÔNG PHẢI WORKSPACE**

Đây là điểm quan trọng nhất tôi có thể đóng góp cho BA-1.

| | **Department** | **Business Workspace** |
|---|---|---|
| Là gì | đơn vị **tổ chức** — ai báo cáo cho ai | miền **năng lực** — việc gì được làm |
| Đổi khi nào | tái cơ cấu · tuyển người · sáp nhập | mô hình kinh doanh đổi |
| Tần suất đổi | **vài lần mỗi năm** | **vài năm một lần** |
| Nguồn | sơ đồ tổ chức | ADR-015 · EDD-01 |

**Ánh xạ giữa chúng là NHIỀU–NHIỀU, ⛔ không phải một–một:**

```
Phòng Kế hoạch  ──┬─► Planning        (D5)
                  └─► Merchandising   (D2)   ← lập kế hoạch NPL cho đơn

Phòng Kho       ──┬─► Warehouse       (D9)
                  └─► Procurement     (D8)   ← nhận hàng, đối chiếu PO

Merchandising   ──┬─► Merchandising   (D2)
   (phòng)        ├─► Commercial      (D1)   ← chào giá
                  └─► Product Dev     (D3)   ← theo mẫu
```

🔑 **Vì sao điều này quan trọng hơn nó trông:**

Nếu Workspace = phòng ban, thì **mỗi lần tái cơ cấu là một lần đổi kiến trúc phần
mềm**. Gộp hai phòng ⇒ phải gộp hai Workspace ⇒ phải dời dữ liệu, dời quyền,
dời màn hình. Doanh nghiệp may tái cơ cấu **thường xuyên hơn** đổi mô hình kinh
doanh rất nhiều.

Nếu Workspace = miền năng lực, tái cơ cấu chỉ đổi **bảng ánh xạ** `Department →
Workspace`. **⛔ Không một dòng mã nào phải sửa.**

⇒ Đó chính là lý do §13.3 cấm tổ chức Homepage theo sơ đồ tổ chức, và là lý do
ADR-015 chọn 14 **miền năng lực**.

⚠️ **Hệ quả cho BA-1:** yêu cầu *"Workspace Definition cho từng phòng ban"*
phải đọc lại thành **hai danh mục + một bảng ánh xạ**. Chi tiết ở
[`EPIC-BA-1`](EPIC-BA-1-ENTERPRISE-BUSINESS-ARCHITECTURE.md).

---

# §2 · SO SÁNH PHƯƠNG ÁN

## 2.1 Phương án A — Homepage **chỉ có** Work Zone

| Tiêu chí | Đánh giá |
|---|---|
| **Ưu điểm** | Đường ngắn nhất tới việc. Người dùng hằng ngày mở máy là thấy ngay việc của mình. Tải nhận thức thấp nhất |
| **Nhược điểm** | ⛔ **Không có bề mặt sản phẩm nào.** Người mới ⛔ không biết hệ thống có gì. Thêm Module mới ⇒ ⛔ không ai thấy |
| **Khả năng bán hàng** | 🔴 **Gần bằng 0** — ⛔ không có gì để trình bày |
| **Khả năng demo** | 🔴 **Gần bằng 0** — demo một hộp thư đến ⛔ không bán được hệ điều hành |
| **Khả năng mở rộng** | 🔴 **Kém** — 19 App mà ⛔ không có nơi bày |
| **Onboarding** | 🔴 **Kém** — nhân viên mới ⛔ không thấy bức tranh tổng thể |
| **Trải nghiệm** | 🟢 tốt cho người thạo · 🔴 kém cho mọi người còn lại |
| 🔴 **Hiến pháp** | **VI PHẠM §13.3** — bỏ Launcher là *"removing a constitutional zone"* |

⇒ **Phương án A bị loại**, ⛔ không phải vì UX mà vì nó **xoá một vùng hiến định**.

## 2.2 Phương án B — Homepage là Application Launcher đầy đủ

| Tiêu chí | Đánh giá |
|---|---|
| **Ưu điểm** | Bề mặt sản phẩm mạnh. Mô hình *"màn hình điện thoại"* ai cũng hiểu ⛔ không cần dạy. Thêm App = thêm một ô. Onboarding tốt |
| **Nhược điểm** | ⛔ **Không trả lời được *"hôm nay tôi làm gì"***. Người dùng hằng ngày phải trả **một cú bấm mỗi sáng** cho thứ họ ⛔ không cần |
| **Rủi ro** | ① Bày cho khách ⇒ lộ cấu trúc vận hành *(`UI-F1`)* · ② 19 ô thành **bức tường ô vuông** · ③ route mang tên chức danh *(`/giam-doc`, `/to-truong-may`)* **lộ sơ đồ tổ chức** ngay trên thanh địa chỉ |
| **Trade-off** | **Khám phá ⟷ tức thời.** B chọn khám phá |
| **Mở rộng** | 🟢 **Tốt nhất** — mô hình lưới chịu được 19 → 30 App |
| **Demo** | 🟢 **Tốt nhất** |
| **Bán hàng** | 🟢 **Tốt nhất** |
| **Đào tạo** | 🟢 **Tốt** — bức tranh tổng thể có sẵn |
| 🟠 **Hiến pháp** | **VI PHẠM §13.3** nếu bỏ Work Zone khỏi Homepage *(`VC-1`)* |

## 2.3 🔑 Điều cả A lẫn B đều bỏ sót

Cả hai phương án đều giả định **Homepage là MỘT bề mặt**. Nhưng nó đang phục vụ
**hai khán giả có lợi ích ngược nhau**:

| Khán giả | Muốn gì | Tần suất |
|---|---|---|
| **Khách / người mua** | thấy **toàn bộ năng lực**, kể cả thứ chưa mở | **một lần** |
| **Nhân viên vận hành** | vào **đúng việc của mình** nhanh nhất | **mỗi ngày** |

⇒ Tối ưu cho một bên là làm hỏng bên kia. **Đó là lý do tranh luận A ⟷ B ⛔
không có lời giải**: câu hỏi bị đặt sai.

---

# §3 · 🔑 PHƯƠNG ÁN C — KHUYẾN NGHỊ

## 3.1 Nội dung

> **Homepage là Application Launcher *(Board đúng)*, nhưng nó có HAI BỀ MẶT
> KHÁC NHAU, ⛔ không phải một bề mặt bật/tắt tính năng.**

```
┌── KHÁCH CHƯA ĐĂNG NHẬP ────────┐   ┌── ĐÃ ĐĂNG NHẬP ────────────────┐
│  SHOWCASE                      │   │  LAUNCHER                       │
│  • 19 năng lực SẢN PHẨM        │   │  • App được cấp quyền — nổi bật │
│  • nội dung ĐƯỢC BIÊN SOẠN     │   │  • App khác — mờ, "Coming Soon" │
│  • ⛔ không liên kết vào app    │   │  • lối tắt sang Work Zone       │
│  • giống nhau với MỌI khách    │   │  • §13.5 lọc theo quyền         │
└────────────────────────────────┘   └─────────────────────────────────┘
```

## 3.2 🔴 Vì sao Showcase phải là bề mặt RIÊNG, ⛔ không phải Launcher-bị-khoá

Đây là chỗ tôi khác đề xuất cuối của Board, và là đóng góp chính của tài liệu này.

Đề xuất của Board: *"khách thấy toàn bộ module như một showcase, nhưng ⛔ không
cho truy cập dữ liệu"*. Nếu thi hành bằng cách **dựng chính Launcher rồi khoá
liên kết**, ba vấn đề xuất hiện:

| # | Vấn đề | Vì sao |
|---|---|---|
| ① | **Lộ cấu hình của CHÍNH tenant này** | Launcher phản ánh những gì **doanh nghiệp này** đã triển khai. Đối thủ đọc được **Monica đang chạy gì**, ⛔ không phải *"MONICA ONE có thể làm gì"* |
| ② | **Lộ tên route** | `/giam-doc` · `/to-truong-may` · `/ke-toan` — **tên chức danh trên thanh địa chỉ**. Đây cũng đúng thứ Sprint **I-5** phải xoá |
| ③ | 🔴 **Bề mặt bán hàng TỰ TRÔI** | Thêm một Module ⇒ nó **tự xuất hiện** trước khách mà ⛔ **không ai quyết định**. Một bề mặt bán hàng ⛔ không được thay đổi vì một lần deploy |

⇒ **Showcase là tài sản MARKETING, Launcher là công cụ VẬN HÀNH.** Chúng tình
cờ trông giống nhau hôm nay; chúng ⛔ **không** cùng vòng đời, ⛔ không cùng chủ,
⛔ không cùng lý do thay đổi.

🔑 **Và Showcase riêng thì BÁN TỐT HƠN:** nó bày được **cả 19 năng lực đích**
*(gồm 6 thứ chưa mở)* + nói bằng ngôn ngữ khách hàng, thay vì 16 ô phản ánh
trạng thái triển khai hiện tại. **Bản brochure luôn thắng ảnh chụp màn hình.**

## 3.3 Work Zone đặt ở đâu — ba lối, và vì sao tôi chọn ①

| # | Lối | Hiến pháp | Đánh giá |
|---|---|---|---|
| **①** ⭐ | **Homepage = Launcher nổi bật + một dải Work Zone gọn** *(việc quá hạn · chờ duyệt · đếm số)*, bấm vào mở Work Zone đầy đủ | ✅ **§13.3 thoả** — hai vùng đều còn | Giữ cả hai khán giả. Người vận hành thấy việc **ngay dòng đầu**; khách thấy Launcher |
| ② | Work Zone **dời hẳn** vào sau khi chọn Module | 🔴 **vi phạm §13.3** | Cần tu chính Hiến pháp |
| ③ | Homepage **chỉ** Launcher, Work Zone là App thứ 20 | 🔴 **vi phạm §13.3** | Cần tu chính |

⇒ **Lối ① đạt được điều Board muốn mà ⛔ không phải tu chính Hiến pháp**:
Homepage **là** Launcher *(Board đúng)*, Work Zone **có mặt** nhưng **⛔ không
chiếm chỗ** *(§13.3 thoả)*.

⚠️ Nếu Board vẫn muốn lối ② — dời hẳn Work Zone — thì đó là **quyết định hợp lệ**,
nhưng phải đi qua **ADR + tu chính §13.3**. Tôi ⛔ không thi hành bằng chỉ thị.

## 3.4 Trade-off của C — nói rõ, ⛔ không giấu

| Cái mất | Mức |
|---|---|
| **Hai bề mặt phải bảo trì** — Showcase và Launcher | 🟠 thật. Giảm nhẹ: Showcase là **nội dung tĩnh**, đổi vài lần mỗi năm |
| **Showcase có thể lệch thực tế** — quảng cáo App chưa có | 🟠 chính là điều **cần** cho bán hàng, miễn nhãn *"Coming Soon"* trung thực |
| **Người vận hành vẫn thấy Launcher mỗi sáng** | 🟢 nhẹ — dải Work Zone ở dòng đầu trả lời ngay *"hôm nay làm gì"* |

---

# §4 · BOTTOM NAVIGATION — PHẢN BIỆN

## 4.1 Ý đúng của Board

*"Homepage ⛔ không cần nút Home"* — **đúng**. Đứng ở nhà mà có nút về nhà là
một ô lãng phí trong năm ô hiếm hoi.

## 4.2 Chỗ tôi ⛔ không đồng ý: đưa **`Monica` (Website/Brand)** vào bottom nav

| # | Lý do |
|---|---|
| ① | **§15.3 nói bottom nav chỉ chứa *platform-wide capabilities*.** Một trang web giới thiệu ⛔ không phải năng lực — nó là **nội dung** |
| ② | **Nó đưa người dùng RA KHỎI hệ điều hành.** Bốn ô kia đưa người dùng đi sâu vào công việc; ô thứ năm đá họ sang trang tiếp thị |
| ③ | **Nó lấy chỗ của `Business Reporting`** — một năng lực hiến định *(§15.7)*, và là thứ **giám đốc dùng hằng ngày** |
| ④ | Khách cần liên kết thương hiệu; **nhân viên thì ⛔ không**. Mà bottom nav là thanh của **nhân viên** |

**Đề nghị:** logo/wordmark **ở thanh ĐẦU trang** đã là lối vào thương hiệu — nó
đang có sẵn. Bottom nav giữ đúng năm năng lực §15.3.

Nếu Board vẫn muốn `Monica` ở bottom nav ⇒ **tu chính §15.3**, vì điều khoản đó
nói *"only platform-wide capabilities"*.

---

# §5 · KHUYẾN NGHỊ CUỐI CÙNG

```
╔════════════════════════════════════════════════════════════════════════╗
║  KHUYẾN NGHỊ — Chief Solution Architect                                ║
║                                                                        ║
║  ✅ Phương án C   Homepage = Application Launcher, HAI BỀ MẶT          ║
║                   • Khách    → SHOWCASE riêng, nội dung biên soạn      ║
║                   • Đăng nhập → LAUNCHER lọc quyền + dải Work Zone     ║
║                                                                        ║
║  ⛔ Loại A        xoá Launcher ⇒ vi phạm §13.3, và ⛔ bán được gì       ║
║  🟠 B chưa đủ     đúng hướng, nhưng bỏ Work Zone ⇒ vi phạm §13.3       ║
║                                                                        ║
║  🔴 CẦN BOARD QUYẾT — 4 điểm, ⛔ không thi hành bằng chỉ thị:          ║
║     VC-1  dời Work Zone khỏi Homepage        ⇒ tu chính §13.3          ║
║     VC-2  tổ chức Homepage theo Department   ⇒ tu chính §13.3 + ADR-015║
║     VC-3  `Monica` vào bottom nav            ⇒ tu chính §15.3          ║
║     VC-4  showcase cho khách                 ✅ KHÔNG cần — §13.5 im lặng║
╚════════════════════════════════════════════════════════════════════════╝
```

## 5.1 Vì sao tôi khuyến nghị C chứ ⛔ không phải B nguyên bản

Board hỏi tôi phản biện, nên tôi nói thẳng: **B đúng về hướng, sai về một chi
tiết đắt tiền.**

Hướng đúng: Homepage **là** Launcher, ⛔ không phải Dashboard. Điều đó phục vụ
bán hàng, demo, onboarding — và tôi đã **đánh giá thấp** ba thứ đó khi làm
`UI-1.5`. `UI-F1` tôi phát hiện là thật, nhưng cách tôi đóng nó — **giấu sạch
bản đồ khỏi khách** — đã hy sinh một tài sản bán hàng mà tôi ⛔ không có thẩm
quyền hy sinh. **Đó là sai của tôi, và Board sửa đúng.**

Chi tiết sai của B: dùng **cùng một bề mặt** cho hai khán giả có lợi ích ngược
nhau, và **bỏ Work Zone** khỏi một điều khoản hiến định nói *"neither may be
removed"*.

C giữ **toàn bộ** giá trị bán hàng của B, đóng `UI-F1` **⛔ không mất gì**, và
⛔ **không cần tu chính Hiến pháp**.

---

## THAM CHIẾU

- Hiến pháp **§13.3** · **§13.5** · **§15.3** · **§15.4** — bậc 1
- **ADR-015** *(14 Business Workspace)* · **ADR-017** *(trang chủ hai vùng)*
- [`EPIC-BA-1`](EPIC-BA-1-ENTERPRISE-BUSINESS-ARCHITECTURE.md) — Department ⟷ Workspace
- [`EPIC-UI-1-EXECUTIVE-SUMMARY.md`](EPIC-UI-1-EXECUTIVE-SUMMARY.md) — `UI-F1`

> **Trạng thái:** ⏳ trình Board. ⛔ Chưa viết một dòng Production Code nào.
