# MODULE BLUEPRINT — khuôn dựng một Workspace

| Trường | Giá trị |
|---|---|
| **Thẩm quyền** | Board Directive *Execution Mode v2* — 05/08/2026 |
| **Nền** | `Product Constitution §4.1` — bốn tầng |
| **Trạng thái** | 🟠 **BẢN NHÁP CÓ CHẶN** — xem `§0`, phải giải quyết trước khi nhân rộng |

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

⚠️ Việc này chạm `/md` và `/kho` — **hai phân hệ lớn nhất, đang chạy thật**.
Đó là **quyết định kiến trúc**, ⛔ không phải dọn dẹp ⇒ **trình Board**.

---

# §1 · KHUÔN DỰNG MỘT WORKSPACE — bốn tầng

```
① Business Data      bảng + RLS                      ⛔ KHÔNG ai ngoài tầng ② chạm
② Command Center     _services/command-center.ts     ĐỌC · GOM · PHÁN
③ Business Capability lib/mos/workspace/*-work-items  LUẬT thuần, kiểm ⛔ cần CSDL
④ Workspace          page.tsx + shell                CHỈ BÀY RA
```

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
| 1 | Đo **đã có** Command Center / feed chưa | ⚠️ **`/kho` và `/md` ĐÃ CÓ** — ⛔ đừng dựng lại |
| 2 | `_services/command-center.service.ts` | trả `{ viec, kpi, loi }` |
| 3 | `lib/mos/workspace/<mod>-work-items.ts` | luật thuần + hằng ngưỡng + **neo điều hướng** |
| 4 | Calculator ở `lib/mos/calculators/` | **gọi lại `garment-math`**, ⛔ không viết công thức thứ hai |
| 5 | i18n **ba** ngôn ngữ | phép kiểm ⑰ chặn nếu thiếu |
| 6 | Bài kiểm thuần | **biên ngưỡng** · tập rỗng ⇒ `0` ⛔ không `NaN` · `P33` hai chiều |
| 7 | Tiêm lỗi có kiểm soát | *"hỏng trước, xanh sau"* |

---

> **Trạng thái:** 🟠 chờ Board quyết `§0.3` — hợp nhất hai khung. ⛔ Không nhân
> rộng sang phân hệ nào trước khi có quyết định đó.
