# MODULE BLUEPRINT — khuôn dựng một Workspace

| Trường | Giá trị |
|---|---|
| **Thẩm quyền** | Board Directive *Execution Mode v2* — 05/08/2026 |
| **Nền** | `Product Constitution §4.1` — bốn tầng |
| **Trạng thái** | ✅ **HỢP NHẤT XONG** — Board duyệt Phương án ①, 05/08/2026 |

---

# §0 · 🔴 PHÁT HIỆN PHẢI ĐỌC TRƯỚC: **DỰ ÁN ĐANG CÓ HAI KHUNG**

Board giao *"chuẩn hoá thành Module Blueprint để các module còn lại chỉ cần ánh
xạ, ⛔ không sao chép logic"*. Đo trước khi viết, và kết quả **đổi hẳn việc phải
làm**:

| Khung | Thành phần | Đang dùng bởi |
|---|---|---|
| **A · `components/mos/command-center/`** | `mos-task-inbox` · `mos-kpi-grid` · `mos-alert-panel` | 🔵 **`/md` VÀ `/kho`** — hai phân hệ lớn nhất |
| **B · `components/workspace/`** | `WorkInbox` · `KpiStrip` · `QuickActions` · `BlockChoDuLieu` · `WorkspaceShell` | 🟢 `/qa` |

Và khung **A** **đã có sẵn lớp ánh xạ mỗi phân hệ**:
`components/md/command-center/md-feed.ts` · `components/warehouse/command-center/wh-feed.ts`.

## 0.1 ⚠️ Nghĩa là *Module Blueprint* **đã tồn tại** — tôi ⛔ không phát hiện ra nó

```
Khuôn khung A:  Command Center service → feed adapter → khối dùng chung
```

Đó **chính là** khuôn Board đang yêu cầu. Nó đã chạy trên **hai** phân hệ lớn
nhất **trước khi** tôi dựng khung B cho `/qa`.

🔴 **Đây là lỗi quy trình của tôi:** tôi dựng khung B mà **⛔ không đo trước xem
đã có khung nào chưa**. Nếu tôi nối `/kho` vào khung B ở lượt này, tôi sẽ đặt
**hai khung UI vào một phân hệ đã có một khung** — đúng thứ *"⛔ không sao chép
logic"* cấm, và đúng khuôn `TD-42` mà chính tôi vừa chặn.

⇒ **Tôi DỪNG việc nối `/kho`.** Ghi thành **`TD-44`**.

## 0.2 Hai khung ⛔ **không** trùng nhau hoàn toàn — và đó là lý do phải chọn có chủ ý

| | Khung A | Khung B |
|---|---|---|
| Hộp thư việc | ✅ `mos-task-inbox` | ✅ `WorkInbox` |
| KPI | ✅ `mos-kpi-grid` | ✅ `KpiStrip` — có **`P36`+`P38`** *(nguồn · khuyến nghị · nhãn hành động)* |
| Cảnh báo | ✅ `mos-alert-panel` | ⛔ **⛔ không có** |
| Việc làm nhanh | ⛔ **⛔ không có** | ✅ `QuickActions` |
| **Bố cục cả trang** | ⛔ **⛔ không có** — mỗi phân hệ tự dựng | ✅ `WorkspaceShell` — **thứ tự khối là luật** |
| Khối *"⛔ chưa có dữ liệu"* | ⛔ ⛔ không có | ✅ `BlockChoDuLieu` |
| Dải Dịch vụ toàn cục | ⛔ ⛔ không có | ✅ |

🔑 **Chúng bổ sung nhau nhiều hơn là trùng nhau.** A mạnh ở **ba khối dữ liệu**;
B mạnh ở **bố cục và thứ tự** — mà *thứ tự* chính là chỗ `P7`/`P31`/`P32` sống.

## 0.3 ⇒ Khuyến nghị: **hợp nhất một chiều**, ⛔ không chọn bên

```
GIỮ  khung A làm BA KHỐI DỮ LIỆU        (đã chạy trên 2 phân hệ lớn)
GIỮ  khung B làm BỐ CỤC + THỨ TỰ        (WorkspaceShell)
⇒    WorkspaceShell BỌC các khối của A, ⛔ không dựng khối song song
⇒    KpiItem của B nâng cấp thành hình dạng chung — nó đã mang `P36` `P38`
```

## 0.4 ✅ BOARD DUYỆT PHƯƠNG ÁN ① — 05/08/2026 · ĐÃ THI HÀNH

> - **`WorkspaceShell` = lớp TRẢI NGHIỆM** *(Experience Layer)* thống nhất.
> - **Command Center + Feed Adapter = lớp NGHIỆP VỤ** *(Business Logic Layer)*
>   thống nhất.
> - Mọi Workspace mới dùng **cùng** Blueprint này.
> - ⛔ **Không duy trì hai framework song song.**

**Đã làm ngay lượt này:**

| # | Việc | Trạng thái |
|---|---|---|
| ① | `WorkspaceShell` **bọc** `MosTaskInbox` · `MosKpiGrid` · `MosAlertPanel` | ✅ |
| ② | `MosKpi` thêm `recommendation` *(`P38`)*; ô KPI hiện nó | ✅ **cộng thêm**, ⛔ không đổi hành vi cũ ⇒ `/md` `/kho` ⛔ không bị ảnh hưởng |
| ③ | `components/qa/command-center/qa-feed.ts` — Feed Adapter đầu tiên theo Blueprint | ✅ |
| ④ | `WorkInbox` · `KpiStrip` **thôi được dựng ở đâu** | ✅ tệp giữ nguyên *(ràng buộc #2)*, ⛔ không xoá |
| ⑤ | Khối *"Cảnh báo"* từ ô chờ ⇒ **khối thật** | ✅ |

⚠️ **`TD-44` đóng.** Dự án còn **một** khung.

---

# §1 · KHUÔN DỰNG MỘT WORKSPACE — bốn tầng ⊕ Feed

```
① Business Data      bảng + RLS                      ⛔ KHÔNG ai ngoài tầng ② chạm
② Command Center     _services/command-center.ts     ĐỌC · GOM · PHÁN   [server]
③ Business Capability lib/mos/workspace/*-work-items  LUẬT thuần, kiểm ⛔ cần CSDL
④ Feed Adapter       components/<mod>/command-center  KHOÁ→CHỮ · icon · màu · hành động   [client]
⑤ Workspace          page.tsx + WorkspaceShell        CHỈ BÀY RA
```

🔑 **Vì sao phải có tầng ④, ⛔ không gộp vào ②:** `icon` là **component** và
`onGo` là **hàm** — cả hai ⛔ **không tuần tự hoá được** qua ranh giới Server →
Client. Máy chủ vì vậy chỉ trả **dữ liệu thuần mang KHOÁ i18n**; việc gắn icon,
tông màu, hành động và **dịch** thuộc về tầng ④, chạy ở client.

⇒ Nhờ vậy khối MOS **⛔ không biết phân hệ nào** — nó ⛔ không có bảng tra *"loại
việc nào thì icon nào"*. **Thêm phân hệ thứ mười ⛔ không phải sửa một dòng nào
của khung.**

## 1.1 Tầng ② — `Command Center` làm **đúng ba việc**

| | Việc | ⚠️ Cạm bẫy |
|---|---|---|
| **ĐỌC** | nơi **duy nhất** chạm dữ liệu của phân hệ | ⛔ **không nuốt lỗi thành mảng rỗng** — màn hình rỗng vì *"⛔ không có việc"* và vì *"⛔ không đọc được"* trông **y hệt nhau**, và chỉ một là tin tốt |
| **GOM** | gọi calculator **thuần** | ⛔ **không tự tính** — phép kiểm `⑭` |
| **PHÁN** | gắn ngưỡng · trạng thái · **lối đi tiếp** | ngưỡng là **luật nghiệp vụ** ⇒ khai **một chỗ**, ⛔ không rải trong JSX |

## 1.2 Tầng ③ — luật sinh việc là **DỮ LIỆU**

`WorkItemRule<T>` nhận **hình dạng hẹp** của phân hệ ⇒ engine `chieuViec()`
**⛔ không biết** phân hệ nào. Thêm luật = **thêm một mục vào mảng**, ⛔ không
sửa engine *(`WZ-2`)*.

| Luật | Nội dung |
|---|---|
| `WI-1` | xếp theo mức khẩn, **sort ổn định** — danh sách nhảy chỗ mỗi lần tải là thứ khiến người dùng **thôi tin nó** |
| `WI-2` | một luật sinh **tối đa một** việc — `id` động là chỗ trùng khoá React |
| **`P33`** | việc `CRITICAL`/`WARNING` **phải** có `href`; việc `INFO` **⛔ không được** có |

## 1.3 Tầng ④ — bốn phần của một KPI

`① BẰNG CHỨNG → ② PHÂN TÍCH → ③ KHUYẾN NGHỊ → ④ HÀNH ĐỘNG`
*(`nguonKey` → `trangThai` → `khuyenNghiKey` → `href` + `hanhDongKey`)*

⚠️ **Bốn phần là MỘT CÂU, ⛔ không phải bốn tính năng.** Bỏ vế nào câu cũng cụt.

---

# §2 · DANH SÁCH VIỆC KHI MỞ MỘT WORKSPACE MỚI

| # | Việc | Xong khi |
|---|---|---|
| 1 | Đo **đã có** Command Center / feed chưa | ⚠️ `/kho` · `/md` ĐÃ CÓ cả hai — ⛔ đừng dựng lại |
| 2 | `_services/command-center.service.ts` *(server)* | trả `{ viec, kpi, loi }` — dữ liệu thuần **mang khoá** |
| 3 | `lib/mos/workspace/<mod>-work-items.ts` | luật thuần + hằng ngưỡng + **neo điều hướng** |
| 4 | Calculator ở `lib/mos/calculators/` | **gọi lại `garment-math`**, ⛔ không viết công thức thứ hai |
| 5 | `components/<mod>/command-center/<mod>-feed.ts` *(client)* | trả `MosFeed` — gắn icon · tông · hành động · **dịch** |
| 6 | i18n **ba** ngôn ngữ | phép kiểm ⑰ chặn nếu thiếu |
| 7 | Bài kiểm thuần | **biên ngưỡng** · tập rỗng ⇒ `0` ⛔ không `NaN` · `P33` hai chiều |
| 8 | Tiêm lỗi có kiểm soát | *"hỏng trước, xanh sau"* |

---

> **Trạng thái:** ✅ Blueprint DUY NHẤT, đã thi hành ở `/qa`. Nhân rộng ⛔ không
> cần xin Board từng phân hệ — miễn ⛔ không đổi ADR · Security · Permission ·
> Database.
