# SỔ PHIÊN TỰ CHẠY — đêm 06→07/08/2026

> **Uỷ quyền:** Board 07/08/2026 — *"tự lên lịch thực hiện liên tiếp mà không
> hỏi lại xuyên suốt 5 tiếng; nếu có gì cần hỏi thì gác lại ghi nhớ thực hiện
> sau và tự chuyển qua nhiệm vụ khác."*
>
> Sổ này ghi **đúng những gì đã xảy ra**, gồm cả cái sai và cái chưa làm được.
> ⛔ Không tô hồng. Board đọc lúc 05:00.

---

## 1. VIỆC ĐÃ XONG — theo thứ tự thời gian

| # | Việc | Chứng cứ | Commit |
|---|---|---|---|
| ① | Hành trình đơn: 6 cột chấm → **1 thanh tiến trình** | 14 hàng × 6 đoạn, phiên `md001` | `6c89a38c` |
| ② | **Biểu đồ phân bố đơn theo chặng**, đặt trước bảng | đỉnh "Vật tư" = 14 đơn, tô màu cảnh báo | `6c89a38c` |
| ③ | Cắt **84 KB** từ điển khỏi layout dùng chung | `app-build-manifest.json` trước/sau | `6c89a38c` |
| ④ | Trả lại `(dashboard)/dictionaries.tsx` *(vi phạm ràng buộc ②)* | — | `f6a3…` |
| ⑤ | 🔴 **Sửa 5 trang nhập liệu của xưởng đang 500** | 5 tài khoản seed, 13 trang quét sạch | `4f4859b0` |
| ⑥ | Thêm hai ô **Cắt chỉ · Ủi** vào biểu mẫu hoàn thành | phễu hết vẽ cảnh vô lý | `4f4859b0` |

### 🔴 Phát hiện lớn nhất của phiên

**Cửa nhập liệu của toàn bộ xưởng đã đóng — và ⛔ không ai biết.**

Tám `<form action={…}>` ở `/hoan-thanh` `/to-truong-may` `/to-truong-cat`
`/qa` `/xuat-hang` bọc Server Action trong closure ⛔ không đánh dấu
`'use server'` ⇒ **cả trang 500**.

⚠️ **Bốn cổng kiểm đều XANH khi lỗi này còn sống**: `typecheck` sạch ·
`lint` sạch · kiến trúc `84/84` · `next build` thành công. Chỉ có **mở
trang bằng phiên đăng nhập thật** mới thấy — đúng như nghi thức nghiệm
thu §5 đã dặn, và tôi đã bỏ qua nó ở những vòng trước.

🔑 Nó cũng **giải một câu đố cũ**: báo cáo ngày của MD luôn hiện *"⚪ chưa
ai báo cáo"*. Tôi từng đổ cho *"đọc nhầm bảng"*. Nguồn đọc đúng rồi —
bảng rỗng vì **⛔ không ai ghi NỔI**.

---

## 2. 🔴 GÁC LẠI — CẦN BOARD QUYẾT

Những việc dưới đây tôi **⛔ KHÔNG tự làm** vì chúng chạm vào thẩm quyền
Board *(Business Value · Schema · Phân quyền · Hướng kiến trúc)*.

| Mã | Câu hỏi | Vì sao ⛔ không tự quyết |
|---|---|---|
| `G-1` | `kho001@monica.vn` ⛔ không đăng nhập được bằng cả hai mật khẩu quy ước. Đặt lại, hay tài khoản đã bị thu hồi có chủ đích? | Chạm **phân quyền** |
| `G-2` | Bảng `daily_production_logs` ⛔ **không có màn hình nào ghi** và ⛔ không ai đọc. Xoá khỏi lược đồ, hay dựng màn hình cho nó? | Chạm **Schema** |
| `G-3` | Phễu hoàn thành ⛔ không phân biệt được *"ghi 0"* với *"chưa ai ghi"* khi đã có bản ghi khác trong ngày. Có cần cột `NULL`-able riêng? | Chạm **Schema** |
| `G-4` | Ngưỡng AQL 2.5 — phần mềm ⛔ **chưa** ra phán quyết Đạt/⛔ Không đạt ở màn hình kiểm hàng | **Quyết định nghiệp vụ** |
| `G-5` | Bản ghi `finishing_logs` tôi tạo khi kiểm chứng *(SEED-BD-01, 1 đạt/0 lỗi)* **còn nằm trong CSDL** — sổ ghi-thêm `K-1`, ứng dụng ⛔ không xoá được | Cần Board cho phép chạy `M00x` dọn |
| `G-6` | 🔴 `cut_tickets.bom_allowance_m` đang mang **hai đơn vị khác nhau**: `SEED-CT-01 = 2,5` *(mét trên MỘT sp, cho 1.188 sp)* ⟷ `PK-2026-001 = 70` *(giống tổng mét, cho 50 sp)*. Hệ quả: cờ *"vượt định mức"* trong `duLieuCatHomNay` **bật cho MỌI phiếu** | **Ý nghĩa nghiệp vụ của cột** |
| `G-8` | 🔴 `financial_records.order_id` trỏ tới UUID **⛔ không tồn tại trong `orders`** *(`a0000000-…-0002` · `…-0004`)* ⇒ bảng công nợ subcon ⛔ **không truy được về PO nào**. Sửa dữ liệu, hay thêm ràng buộc khoá ngoại? | Chạm **Schema + dữ liệu thật** |
| `G-9` | 🔴 **0/14 đơn hàng có `unit_price`** ⇒ ⛔ không tính được doanh thu · lãi/lỗ · margin cho bất kỳ đơn nào. Ai nhập giá, nhập ở đâu, và có cần bắt buộc khi duyệt PO? | **Quyết định nghiệp vụ** |
| `G-10` | `types/erp.ts` khai `Order` với **năm cột ⛔ không tồn tại**. Sửa hẳn tệp kiểu *(chạm nhiều màn hình)* hay bỏ dần? | Chạm **hướng kiến trúc** |
| `G-11` | 🔴 Cổng khách hàng nối buyer ⟷ khách bằng **claim JWT `buyer_brand`**, trong khi Playbook Điều XXX buộc phân giải từ `partner_accounts` *(có `is_active`)* — claim ⛔ không đổi khi quan hệ đối tác chấm dứt | **Mô hình phân quyền** |
| `G-7` | ⛔ **Chưa có ngưỡng hao hụt vải** nào được Board phê duyệt ⇒ biểu đồ hao hụt cố ý **⛔ không tô màu phán quyết** | **Quyết định nghiệp vụ** |

---

## 3. ⚠️ ĐÃ LÀM MÀ BOARD CẦN BIẾT

- **Đổi mật khẩu 4 tài khoản seed** — `ht001` `may001` `cat001` `qa001` còn
  cờ `force_password_change`; đã đặt `Monica12345@` theo đúng quy ước Board
  đưa, để soi được trang. ⛔ Không đổi mật khẩu tài khoản nào khác.
- **Ghi 1 bản ghi thật** vào `finishing_logs` — xem `G-5`.

---

## 4. HÀNG ĐỢI CÒN LẠI — tự chạy tiếp, ⛔ không cần hỏi

| Ưu tiên | Việc | Vì sao |
|---|---|---|
| 🔴 cao | Biểu mẫu xưởng **nuốt lỗi**: action trả `{error}` mà màn hình ⛔ không hiện gì — tổ trưởng tưởng đã lưu | Mất dữ liệu **âm thầm** |
| 🔴 cao | `/giam-doc` `/ke-toan` `/kho` `/subcon` `/orders` — **0 biểu đồ** | Trái chỉ thị *"luôn ưu tiên trực quan"* |
| ✅ xong | `/to-truong-cat` — hai biểu đồ *(kế hoạch⟷thực cắt · hao hụt %)* | Đủ ba tổ |
| 🟡 vừa | Báo cáo ngày gửi CEO · Production Director | Board đã yêu cầu tường minh |
