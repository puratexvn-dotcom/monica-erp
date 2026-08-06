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
| ⑦ | 🔴 Biểu mẫu xưởng **hết nuốt lỗi** — 8 chỗ / 5 phân hệ | *"⛔ Chưa ghi được. Vui lòng chọn Mã vạch Phối kiện!"* | `a22b76ae` |
| ⑧ | 🔴 Báo cáo ngày của **Production Director đang rỗng vĩnh viễn** *(mượn nhầm guard MD)* | `/md` hiện "1 sp" ⟷ `/giam-doc` hiện "⚪" | `0281e6c0` |
| ⑨ | 🔴 **Lệch múi giờ 7 tiếng** trong báo cáo ngày + mốc `/giam-doc` theo giờ máy chủ | bản ghi 00:55 giờ VN ⛔ không lọt báo cáo | `0281e6c0` |
| ⑩ | Hai **biểu đồ điều hành** cho bàn giám đốc | nút thắt WIP · lỗi theo chuyền có đường ngưỡng | `0281e6c0` |
| ⑪ | Hai **biểu đồ tổ cắt** | kế hoạch⟷thực cắt · hao hụt % | `492db30b` |
| ⑫ | 🔴 **P&L kế toán bịa `0 ₫ · margin 0,0%`** cho 14 đơn thật | nay PO thật + ô ⚪ + băng "14/14 chưa có đơn giá" | `3318f232` |
| ⑬ | 🔴 **Cổng khách hàng đề tên nhãn bên thứ ba** & hứa "DHU 0,0%" | nay "Customer Portal" + "⚪ chưa kiểm lô nào" | `a84a0bb1` |
| ⑭ | 🔴 **`/subcon` chết hoàn toàn** *(enum)* — cô lập + biểu đồ hàng còn ở ngoài | 0 form → 3 form · 1 biểu đồ · 1.400 sp | `ba502c18` |

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
| `G-12` | 🔴 **`/subcon` chết hoàn toàn từ trước**: enum `bundle_stage_enum` chỉ có `CUT·SEWING·FINISHING·PACKED`, mã hỏi `CUT_PASSED`·`SEWING_READY`·`OUTSIDE_PROCESSING`. Đã cô lập để trang sống, nhưng **luồng xuất–nhận gia công vẫn ⛔ không chạy được** — sửa cần **migration + ADR** | **Migration + ADR** |
| `G-7` | ⛔ **Chưa có ngưỡng hao hụt vải** nào được Board phê duyệt ⇒ biểu đồ hao hụt cố ý **⛔ không tô màu phán quyết** | **Quyết định nghiệp vụ** |

---

## 3. ⚠️ ĐÃ LÀM MÀ BOARD CẦN BIẾT

- **Đổi mật khẩu 4 tài khoản seed** — `ht001` `may001` `cat001` `qa001` còn
  cờ `force_password_change`; đã đặt `Monica12345@` theo đúng quy ước Board
  đưa, để soi được trang. ⛔ Không đổi mật khẩu tài khoản nào khác.
- **Ghi 1 bản ghi thật** vào `finishing_logs` — xem `G-5`.

---

## 4. QUÉT NGHIỆM THU CUỐI PHIÊN — 9 vai · 15 lượt mở · **0 vấn đề**

Mỗi vai **đăng nhập thật** *(⛔ không dùng service key, ⛔ không giả phiên)*
rồi mở đủ trang của vai đó:

```
admin001  /admin                 ✅  0 bđ · 0 form   sạch
gd001     /giam-doc              ✅  3 bđ · 0 form   sạch
gd001     /orders /subcon        ✅  1 bđ · 3 form   sạch
md001     /md                    ✅  4 bđ · 0 form   sạch
md001     /orders /subcon        ✅  1 bđ · 3 form   sạch
kt001     /ke-toan               ✅  0 bđ · 0 form   sạch
qa001     /qa                    ✅  0 bđ · 1 form   sạch
cat001    /to-truong-cat         ✅  2 bđ · 1 form   sạch
may001    /to-truong-may         ✅  1 bđ · 2 form   sạch
ht001     /hoan-thanh            ✅  1 bđ · 1 form   sạch
ht001     /to-truong-hoan-thanh  ✅  0 bđ · 0 form   sạch
kh001     /buyer                 ✅  0 bđ · 0 form   sạch
```

*"sạch"* = ⛔ không lọt `undefined` · `NaN` · `[object Object]` · `Infinity`.

⚠️ **Phép quét vòng đầu đã CHO ĐIỂM SAI.** Nó ghi `/subcon` là *"ok"* vì chỉ
dò chuỗi của trang lỗi **chung**, trong khi phân hệ đó có `error.tsx` **riêng**.
Cái để lộ ra sự thật là **đếm nội dung đáng lẽ phải có**: trang có ba biểu mẫu
mà quét ra **0**. Đã sửa phép quét.

🔑 Bài học của cả phiên: *"⛔ không thấy chữ lỗi"* ⛔ **KHÁC** *"trang chạy"*.

---

## 5. HÀNG ĐỢI CÒN LẠI

| Ưu tiên | Việc | Vì sao |
|---|---|---|
| 🟡 vừa | `/ke-toan` `/kho` `/orders` `/admin` `/to-truong-hoan-thanh` `/buyer` — **0 biểu đồ** | `/ke-toan` mọi ô đang ⚪ *(`G-9`)* nên vẽ ⛔ không có gì; số còn lại chưa rà |
| 🟡 vừa | Đẩy báo cáo ngày *(chuông kêu)* cho CEO · PD | Hiện là *"gửi"* theo lối KÉO: mở trang mới thấy. Đẩy thật cần bảng `notifications` ⇒ **Schema, thẩm quyền Board** |
| 🟡 vừa | `md-legacy-client.tsx` cũng đọc năm cột ⛔ không tồn tại | ⛔ Chưa gắn route nên ⛔ chưa hại ai — dọn cùng `G-10` |
