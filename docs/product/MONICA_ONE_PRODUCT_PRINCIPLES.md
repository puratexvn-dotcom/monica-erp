# MONICA ONE — PRODUCT PRINCIPLES

| Trường | Giá trị |
|---|---|
| **Phiên bản** | **v1.0** — **33 nguyên tắc** · Rev 3 |
| **Dẫn xuất từ** | [`MONICA_ONE_PRODUCT_CONSTITUTION.md`](MONICA_ONE_PRODUCT_CONSTITUTION.md) |
| **Vai trò** | **Danh sách đối chiếu** — mỗi tính năng mới soi qua đây trước khi thiết kế |
| **Trạng thái** | ✅ **KHOÁ** cùng Product Constitution v1.0 — 05/08/2026 |

# §0 · 🔑 PHÉP THỬ BA GIẢM — CỔNG ĐỨNG TRƯỚC CẢ 28 NGUYÊN TẮC

> **Board, 05/08/2026:**
> *"Mọi tính năng mới phải giúp người dùng **giảm số lần phải suy nghĩ**, **giảm
> số lần phải hỏi người khác**, hoặc **giảm số lần phải nhập liệu**. Nếu một
> tính năng ⛔ không giảm được **ít nhất một** trong ba điều đó, phải **xem xét
> lại giá trị** của tính năng trước khi phát triển."*

```
                    ┌─────────────────────────────────┐
Ý tưởng tính năng ─►│  Giảm SUY NGHĨ?                 │
                    │  Giảm HỎI NGƯỜI KHÁC?           │─► ⛔ cả ba KHÔNG
                    │  Giảm NHẬP LIỆU?                │      ⇒ DỪNG, xét lại
                    └────────────┬────────────────────┘         giá trị
                                 │ ít nhất MỘT "có"
                                 ▼
                       28 nguyên tắc bên dưới
                                 │
                                 ▼
                          P-MEASURE · test · CI
```

## 0.1 Vì sao phép thử này mạnh hơn cả 28 nguyên tắc cộng lại

28 nguyên tắc trả lời *"tính năng này làm **ĐÚNG** ⛔ không?"*.
Ba Giảm trả lời *"tính năng này **CÓ ĐÁNG LÀM** ⛔ không?"*.

⚠️ **Câu thứ hai được hỏi ít hơn hẳn, và tốn kém hơn hẳn khi bỏ qua.** Một tính
năng sai nguyên tắc thì hỏng lúc rà soát. Một tính năng **⛔ không đáng làm**
thì **được duyệt, được xây, được kiểm, được giao** — rồi nằm đó, và **⛔ không
ai dám gỡ** vì nó *"đang chạy tốt"*.

## 0.2 Ba Giảm ánh xạ thẳng vào ba lời hứa của sản phẩm

| Giảm | Điều nó xoá | Khoản Product Constitution |
|---|---|---|
| **Suy nghĩ** | *"tôi phải làm gì bây giờ?"* | §4 · §15 ② — Workspace trả lời sẵn |
| **Hỏi người khác** | *"anh ơi cái này tới đâu rồi?"* | §13 — xoá văn hoá *"xin cho"* |
| **Nhập liệu** | *"nhớ nhiều · nhập nhiều · sợ sai"* | §7 — AI soạn, người xác nhận |

🔑 **Ba Giảm ⛔ không phải khẩu hiệu năng suất. Nó là §13 viết dưới dạng đo
được.**

## 0.3 ⚠️ Phép thử này **⛔ KHÔNG** biện minh cho việc bỏ bước

*"Bỏ màn hình xác nhận"* giảm được số lần bấm — và **vi phạm `P20`** *(người
xác nhận là người chịu trách nhiệm)*.

⇒ **Ba Giảm là cổng VÀO, ⛔ không phải giấy miễn trừ.** Qua được nó rồi vẫn
phải qua đủ 28 nguyên tắc và toàn bộ `P-MEASURE`.

---

> **Cách dùng:** trước khi viết dòng mã đầu tiên của một tính năng, đọc 28 dòng
> dưới đây và trả lời: *"tính năng này vi phạm điều nào ⛔ không?"*
> Vi phạm **một** điều ⇒ **dừng**, ⛔ không phải *"cân nhắc lại"*.
>
> ⚠️ Nguyên tắc **⛔ không** thay Hiến pháp và **⛔ không** thay ADR. Nó bắt
> **những thứ hai văn bản kia ⛔ không bắt được**: một tính năng có thể **đúng
> kiến trúc hoàn toàn** mà vẫn **sai sản phẩm**.

---

## I · LỐI VÀO *(P1–P5)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P1** | **Homepage LUÔN là Application Launcher.** ⛔ Không Dashboard · ⛔ không KPI · ⛔ không biểu đồ · ⛔ không số vận hành | thêm "một widget nhỏ" lên trang chủ |
| **P2** | **Launcher hiện ĐẦY ĐỦ Module với mọi người xem** — kể cả khách | ẩn Module theo quyền *"cho gọn"* |
| **P3** | **Quyền kiểm lúc MỞ, ⛔ không kiểm bằng cách vắng mặt** | một Module biến mất khỏi lưới |
| **P4** | **Luồng là `Homepage → Module → Login → Workspace`.** ⛔ Không bắt đăng nhập trước khi thấy sản phẩm | trang chủ chuyển hướng sang `/login` |
| **P5** | **Homepage là công cụ BÁN HÀNG.** Mọi thay đổi phải trả lời được: *khách · nhà đầu tư · ứng viên nhìn vào thấy gì?* | tối ưu chỉ cho người đã đăng nhập |

## II · NƠI LÀM VIỆC *(P6–P10)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P6** | **Workspace trả lời DUY NHẤT: *"hôm nay tôi cần làm gì?"*** | mở Workspace ra thấy trước tiên là biểu đồ |
| **P7** | 🔑 **VIỆC đứng TRƯỚC SỐ.** KPI ⛔ không bao giờ là khối đầu tiên | *"cho KPI lên trên cho đẹp"* |
| **P8** | **Work Item là PHÉP CHIẾU.** ⛔ Không nút *"đã xong"*, ⛔ không bảng việc | thêm cột `is_done` |
| **P9** | **Work Zone HỢP NHẤT việc của MỘT NGƯỜI qua MỌI Module** | bắt người dùng mở từng Module để tìm việc |
| **P10** | **Workspace ⛔ KHÔNG sở hữu dữ liệu** — nó chiếu trạng thái Domain | lưu số liệu tổng hợp vào bảng riêng |

## III · ĐIỀU HƯỚNG *(P11–P13)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P11** | **Bottom Navigation ĐÚNG 5 mục. ⛔ Không tăng, ⛔ không đổi vị trí** | thêm mục thứ sáu *"chỉ lần này thôi"* |
| **P12** | **Từ mọi màn hình phải về được Homepage** | Workspace ⛔ không có lối ra |
| **P13** | **Vị trí một Module trong lưới là TRÍ NHỚ CƠ BẮP** — sắp lại phải qua ADR | *"sắp lại cho hợp lý hơn"* |

## IV · NGÔN NGỮ SẢN PHẨM *(P14–P17)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P14** | **Người lao động phổ thông phải hiểu ngay.** ⛔ Không thuật ngữ kỹ thuật trên màn hình | nhãn `BOM`, `Aggregate`, `Sync` |
| **P15** | **Mỗi Module có Icon · Tên · Tagline · Business Value** — thiếu một là ⛔ chưa xong | thêm Module mà ⛔ không có câu giá trị |
| **P16** | **Tagline cho người VẬN HÀNH; Business Value cho người MUA.** Hai câu, hai khán giả, hai chỗ | dùng một câu cho cả hai |
| **P17** | **Màu là ĐỊNH DANH, ⛔ không phải trang trí.** Đổi màu Module = xoá thứ người dùng đã học | đổi màu *"cho hợp tông"* |

## V · BÁO CÁO VÀ NHẬP LIỆU *(P18–P21)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P18** | **⛔ KHÔNG nhập liệu trùng lặp.** Dữ liệu đã có ở đâu thì lấy từ đó | thêm màn hình nhập lại thứ hệ thống đã biết |
| **P19** | **AI chuẩn bị trước — người xác nhận sau** | bắt người dùng gõ từ trang giấy trắng |
| **P20** | 🔴 **Người XÁC NHẬN là người CHỊU TRÁCH NHIỆM, ⛔ không phải AI** | AI tự ghi dữ liệu nghiệp vụ |
| **P21** | **Báo cáo là MỘT cú bấm — ⛔ không Excel, ⛔ không Zalo** | *"xuất file rồi tự gửi"* |

## VI · TRAO ĐỔI *(P22–P24)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P22** | **Mọi hội thoại GẮN với một thực thể nghiệp vụ** | phòng chat tự do ⛔ không gắn đơn hàng |
| **P23** | **Chat thay thế Email · Zalo · WeChat** — ⛔ không cộng thêm vào chúng | tính năng chỉ dùng được nếu vẫn mở Zalo |
| **P24** | **Xoá là SOFT DELETE. Quản trị luôn khôi phục được. Audit ⛔ không mất** | `DELETE` thật trên tin nhắn |

## VII · AI *(P25–P27)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P25** | 🔴 **AI ⛔ KHÔNG BAO GIỜ thấy nhiều hơn người mà nó phục vụ** | AI trả lời câu hỏi mà người dùng ⛔ không có quyền hỏi |
| **P26** | **AI ưu tiên tri thức NỘI BỘ trước Internet** | trả lời bằng kiến thức chung khi công ty đã có SOP |
| **P27** | **AI Memory phục vụ NGƯỜI DÙNG, ⛔ không phục vụ người quản lý họ** | cấp trên đọc được bộ nhớ AI của cấp dưới |
| **P29** | 🔴 **AI trao đổi `Reference`, ⛔ KHÔNG trao đổi DỮ LIỆU.** Mỗi AI tự đọc bằng quyền của **chính người nó đại diện** | AI-A lấy dữ liệu **hộ** AI-B |
| **P30** | 🔴 **`Context` mang ngữ cảnh CÔNG VIỆC, ⛔ KHÔNG BAO GIỜ mang ngữ cảnh CON NGƯỜI** | AI-CEO hỏi AI-nhân-viên *"người này làm việc thế nào?"* |

## VIII · TRIẾT LÝ *(P28)*

| # | Nguyên tắc |
|---|---|
| **P28** | 🔑 **Phần mềm giúp người làm ĐÚNG, ⛔ không dùng để KIỂM SOÁT người.** Mọi người thấy **việc · tiến độ · trách nhiệm · trạng thái** mà **⛔ không cần hỏi ai** |

## IX · WORKSPACE — BA ĐIỀU BOARD BỔ SUNG *(Rev 3)* *(P31–P33)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P31** | **Người dùng thấy VIỆC trước khi thấy SỐ** | mở Workspace, thứ đầu tiên đập vào mắt là một con số |
| **P32** | **Workspace mở đầu bằng HÀNH ĐỘNG, ⛔ không bằng dashboard** | màn hình đầu tiên ⛔ không có gì bấm được |
| **P33** | 🔑 **MỌI dashboard phải dẫn tới một HÀNH ĐỘNG** | một KPI đỏ mà ⛔ không có đường đi tiếp |

### ⚠️ `P31` `P32` chồng lên `P6` `P7` — và đó là chủ ý

`P6` `P7` đã nói *"Workspace trả lời **hôm nay tôi cần làm gì**"* và *"**việc**
đứng trước **số**"*. Board nhắc lại ở `P31` `P32`.

🔑 **Tôi ⛔ không gộp chúng.** Một nguyên tắc được nhắc **hai lần** ⛔ không phải
thừa — nó là **thứ hay bị vi phạm nhất**, và bản nhắc lại là **phiếu bầu thứ
hai** cho cùng một điều. Gộp lại là **xoá mất tín hiệu đó**.

### 🔑 `P33` là điều **thật sự mới** — và mạnh nhất trong ba

`P6`…`P32` nói về **thứ tự**. `P33` nói về **ngõ cụt**:

```
KPI "Tỷ lệ lỗi 4,2%"  ⛔ không đường đi tiếp
  ⇒ người đọc BIẾT có vấn đề, và ⛔ KHÔNG BIẾT LÀM GÌ
  ⇒ họ phải ĐI HỎI người khác          ← đúng thứ §13 muốn xoá
```

⇒ **`P33` là `§13` áp cho từng con số**: một dashboard ⛔ không lối ra **⛔
không trung lập** — nó **tạo ra** một lần phải hỏi. ⇒ Nó cũng trượt **Phép thử
Ba Giảm** ở `§0`.

⚠️ **Đo được ngay ở QA Workspace vừa dựng:** KPI *"Tỷ lệ lỗi"* tô đỏ khi vượt
ngưỡng nhưng **⛔ không bấm được**. Việc *"vượt ngưỡng"* trong Work Inbox cũng
**⛔ chưa có `href`**. ⇒ **`G-19`** — nợ tôi tạo ra, sửa khi nối `/kho`.

---

# §2 · BỐN NGUYÊN TẮC ĐANG BỊ ĐE DOẠ NGAY LÚC NÀY

⚠️ Ghi ở đây vì chúng ⛔ **không** phải rủi ro tương lai — chúng đang mở:

| Nguyên tắc | Trạng thái sau Rev 2 | Còn lại gì |
|---|---|---|
| **P25** · **P29** | ✅ **Board đã gỡ** — Context Passing: mỗi AI đọc bằng quyền của **chính người nó đại diện** | 🟠 `ADR-027` thu hẹp còn **luật của kênh `Reference`** *(`AI-4` `AI-5` `AI-6`)* |
| **P27** · **P30** | ✅ **Board đã gỡ** — AI Memory ⛔ không phải hồ sơ nhân viên, ⛔ không cho quản lý truy cập **trực tiếp** | 🔴 phải chặn **truy cập GIÁN TIẾP** qua Context Passing — `P30` |
| **P14** | ✅ **Board đã quyết** — giữ tên nghiệp vụ chuẩn; `Tagline` + `Business Value` gánh phần dễ hiểu | ✅ **đã thi hành** — `UI-2`/`UI-3` hiện tagline tiếng Việt ở **mọi khổ màn** |
| **P11** | 🟠 **một nửa** — `Home` ⛔ không bị xoá mà **đổi tên** thành `Monica`; đúng 5 mục | 🔴 từ **Workspace ⛔ không còn nút về Launcher** — `Product Constitution §17.1` |
| **P12** | 🔴 **mới phát sinh** — `EP-2` *("từ mọi màn hình phải về được Homepage")* đang bị chính §6 làm hỏng | Board chọn phương án `A` / `B` / `C` ở `§17.1` |

---

# §3 · MỘT ĐIỀU NGUYÊN TẮC NÀY **⛔ KHÔNG** LÀM ĐƯỢC

⚠️ 28 dòng trên **⛔ không thay thế phép đo.**

*"Có đúng Product Constitution ⛔ không?"* là câu hỏi **thứ hai**. Câu **thứ
nhất** vẫn là *"⛔ có đo được ⛔ không?"* — `P-MEASURE`, bài kiểm, CI, bằng
chứng.

🔑 **Một tính năng đúng cả 28 nguyên tắc mà ⛔ không ai đo được thì vẫn ⛔ chưa
xong.** Ngược lại, một tính năng đo được đầy đủ mà vi phạm `P25` thì **⛔ không
được ra đời** — dù mọi bài kiểm đều xanh.

---

> **Trạng thái:** ⏳ chờ Board khoá. Đối chiếu hiện trạng:
> [`PRODUCT_CONSTITUTION_GAP_ANALYSIS.md`](PRODUCT_CONSTITUTION_GAP_ANALYSIS.md).
