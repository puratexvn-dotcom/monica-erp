# EPIC UI-1 · AUTHENTICATION UI — EXECUTIVE SUMMARY

| Trường | Giá trị |
|---|---|
| **EPIC** | **UI-1 · Authentication UI + Homepage Shell** |
| **Trạng thái** | ✅ **HOÀN THÀNH** — Board phê duyệt 05/08/2026 |
| **Commit** | `2d85cc53` · `5bf4ed55` · `ae8091ba` · `e5be48db` |
| **CI** | **#62 · #63 · #64 · #65 — SUCCESS** |
| **Chi tiết kỹ thuật** | [`EPIC-UI-1-ARCHITECTURE-REPORT.md`](EPIC-UI-1-ARCHITECTURE-REPORT.md) |
| **Ràng buộc đã giữ** | ⛔ 0 migration · 0 ADR · 0 dòng `middleware.ts` · 0 dòng `lib/rbac.ts` |

---

# §1 · BUSINESS OUTCOME

## 1.1 Trước ⟷ Sau

| | **TRƯỚC** | **SAU** |
|---|---|---|
| **Khách chưa đăng nhập thấy gì** | 🔴 **Trọn bản đồ 16 phân hệ** của doanh nghiệp — Kế toán · Kho · Chiết tính · Nhà thầu… | ✅ **Trang giới thiệu**. ⛔ Không một tên phân hệ nào |
| **Người đã đăng nhập thấy gì** | Cả 16 thẻ, **kể cả thứ họ ⛔ không có quyền vào** | ✅ **Đúng những App được cấp quyền** |
| **Bấm vào App chưa mở** | Thẻ mờ, ⛔ không phản hồi, ⛔ không giải thích | ✅ Nhãn **"Sắp có"** · khoá đúng cách · trình đọc màn hình **nghe được** |
| **Màn hình sau khi đăng nhập** | Nhảy thẳng vào Workspace | ✅ **Work Zone** — lời chào + nơi dành cho việc của bạn |
| **Người dùng tiếng Anh / tiếng Trung** | 🔴 Màn hình đăng nhập **toàn tiếng Việt**, kể cả thông báo lỗi | ✅ **Đủ ba ngôn ngữ**, kể cả lỗi hạ tầng |

## 1.2 Giá trị cho người dùng cuối

| # | Giá trị | Ai được lợi |
|---|---|---|
| `B-1` | **⛔ Không còn phải đoán "App nào là của tôi".** Trang chủ chỉ bày thứ bấm vào được | Mọi vai — nhất là **14 vai vận hành** chỉ dùng 1–3 phân hệ |
| `B-2` | **Biết hệ thống sẽ có gì.** Nhãn *"Sắp có"* giữ lời hứa hiện diện thay vì ẩn đi | Ban điều hành · người dùng mới |
| `B-3` | **Đăng nhập bằng tiếng của mình.** Kể cả lúc hỏng — thông báo lỗi cũng dịch | Khách hàng · đối tác nước ngoài |
| `B-4` | **Người khiếm thị dùng được lưới App.** Thẻ chưa mở là `<button disabled>` có `aria-disabled`, ⛔ không phải một `<div>` mờ — trình đọc màn hình **nói ra rằng nó bị khoá** | Người dùng trợ năng |
| `B-5` | **Trang chủ có chỗ cho công việc.** Work Zone giai đoạn 1 là khung + trạng thái rỗng **trung thực** | Mọi vai, khi Work Inbox có dữ liệu thật |

## 1.3 🔴 Giá trị lớn nhất ⛔ không nhìn thấy được

> **Cấu trúc vận hành của doanh nghiệp thôi nằm công khai trên internet.**

Trước `UI-1`, bất kỳ ai gõ đúng địa chỉ đều đọc được Monica ONE có những bộ phận
nào, tổ chức ra sao, và đang vận hành bằng những phân hệ gì.

⚠️ **Đó ⛔ KHÔNG phải rò dữ liệu** — mọi liên kết đều bị `middleware` chặn, và
`RLS` chặn tầng dưới. Nhưng nó là **thông tin cạnh tranh**: đối thủ đọc được
bản đồ tổ chức mà ⛔ không cần đăng nhập một giây nào.

---

# §2 · ROI — BỐN CHIỀU

## 2.1 Technical ROI

| Chỉ số | Trước | **Sau** |
|---|---|---|
| Phép đo tĩnh *(⛔ không cần CSDL)* | 287 | ✅ **349** *(+62)* |
| Bộ kiểm nghiệp vụ | 2 | ✅ **3** |
| Route có hồ sơ 6 cổng | 0/16 | ✅ **3/21** |
| Phạm vi phép kiểm ⑯ | chỉ `(dashboard)` | ✅ **toàn bộ `app/`** |
| Tệp mới | — | 7 |

**Đòn bẩy:** một hàm thuần ~30 dòng *(`visibleModules`)* mang theo **62 phép
đo**, và nó **⛔ không cần CSDL** nên chạy trong CI mỗi lần push.

## 2.2 Business ROI

| # | Kết quả |
|---|---|
| Ba nghĩa vụ **hiến định** thi hành xong: §13.3 *(hai vùng)* · §13.5 *(lọc quyền)* · Điều 45 *(ba ngôn ngữ)* | ⛔ Không còn là nợ trên giấy |
| **⛔ 0 gián đoạn vận hành** — ⛔ không migration, ⛔ không đổi luồng đăng nhập, ⛔ không ai phải học lại thao tác | |
| **Sẵn sàng cho đối tác nước ngoài** — cửa vào đã đủ ba ngôn ngữ | Điều kiện của cổng Customer/Supplier về sau |
| **`ADR-017` đóng phần giao diện** — Work Zone tồn tại, chờ dữ liệu | |

## 2.3 Security ROI

| # | Kết quả | Mức |
|---|---|---|
| `S-1` | **Bản đồ vận hành thôi công khai** *(`UI-F1`)* | 🔴 → ✅ |
| `S-2` | **⛔ KHÔNG có bộ luật phân quyền thứ hai.** `visibleModules` **gọi `canAccess()`** của `rbac` — cùng hàm `middleware` dùng để **chặn** | phòng ngừa |
| `S-3` | **Bề mặt xác thực vào tầm phép kiểm ⑯** — `/login` · `/update-password` · `/` trước đây **⛔ không phép kiểm nào phủ** | 🔴 → ✅ |
| `S-4` | **Phán quyết bảo mật được GHI LẠI**: `G4` của `/login` ghi rõ *"⛔ không phân biệt sai email với sai mật khẩu"* và *"`safeNext` chặn open-redirect"* — trước đây chỉ nằm trong chú thích mã | truy vết |
| `S-5` | **⛔ 0 dòng thay đổi** ở `middleware.ts` · `lib/rbac.ts` · `loginAction` | rủi ro hồi quy = 0 |

🔑 **`S-2` là giá trị bền nhất.** Nếu bộ lọc tự viết phép so tiền tố riêng, ngày
nó lệch khỏi `canAccess`, giao diện sẽ **mời người dùng bấm vào đúng thứ hàng
rào chắc chắn từ chối** — và ⛔ không ai biết cho tới khi có người thử.

## 2.4 Maintainability ROI

| Chỉ số | Trước | **Sau** |
|---|---|---|
| Sổ nợ **chữ** | 114 tệp | ✅ **112** |
| Sổ nợ **màu** | 108 tệp | ✅ **107** |
| `href: null` + ép kiểu `as string` | có | ✅ **⛔ không còn** — union phân biệt |
| Nguồn phiên cho tầng UI | mỗi nơi tự gọi `getUser()` | ✅ **một** `getSessionUser()` |
| Nền + logo màn xác thực | chép tay 2 nơi | ✅ **một** `AuthBackdrop` · `AuthLogo` |

🔑 **Đây là EPIC đầu tiên làm sổ nợ NGẮN ĐI** thay vì dài ra. Mọi lần bánh cóc
bắt được *(5 lần)* đều sửa **bằng thẻ**, ⛔ không bằng cách thêm tệp vào sổ.

🔑 **`href: null` bị xoá khỏi mô hình dữ liệu** kéo theo `mod.href as string` —
một phép ép kiểu **tắt máy kiểm** đúng chỗ nguy hiểm nhất. Nay trình biên dịch
⛔ **không cho** ai đặt liên kết vào một App chưa có route.

---

# §3 · ĐIỀU CHƯA ĐÓNG

| # | Nội dung |
|---|---|
| 🔴 **`F-8`** | **⛔ Chưa nghiệm thu bằng mắt.** Bốn màn hình đổi cấu trúc, và trang chủ **đổi hành vi thấy được**. `typecheck` · `lint` · CI **⛔ không thấy được lỗi dựng hình**. Cần người chạy nghi thức UI_UX_STANDARDS §8 |
| 🟠 `TD-38` | **18/21 màn hình** chưa qua cổng thiết kế 6 câu |
| 🟡 — | `app/unauthorized/page.tsx` chưa nối i18n |
| 🟠 `UI-F4` | 16/19 thẻ · 6 thẻ *"Sắp có"* — mở 3 Workspace còn thiếu bị **SECURITY FREEZE** cấm |

---

# §4 · GIẢ ĐỊNH BỊ BÁC BỎ

| Giả định | Sự thật đo được |
|---|---|
| `UI-1.3` *"ba trang là ba bản chép tay"* | `login` **hai cột** · `update-password` thẻ giữa · `unauthorized` **2 khớp**. Gộp layout sẽ **ép `login` vào khuôn ⛔ không phải của nó** ⇒ tách **component** |
| *"5 thẻ `href: null`"* | **6** — lỗi số học trong báo cáo kiến trúc của tôi |
| ⑯ phủ mọi màn hình | Chỉ quét `(dashboard)/`, **bỏ trọn bề mặt xác thực** |

---

## THAM CHIẾU

- [`EPIC-UI-1-ARCHITECTURE-REPORT.md`](EPIC-UI-1-ARCHITECTURE-REPORT.md) — khảo sát · phụ thuộc · backlog
- ADR-017 · Hiến pháp §13.3 · §13.5 · Điều 45 · EDD-05 §1.1
- `tests/business/capability.test.mjs` · `tests/architecture/screen-gates.json`
