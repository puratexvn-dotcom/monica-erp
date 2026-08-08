# ADR-029 — Sáu trường mà một PO gia công may thật sự cần

| | |
|---|---|
| **Trạng thái** | 🔴 **ĐỀ XUẤT — CHỜ BOARD.** Migration `055` **⛔ CHƯA chạy**. |
| **Ngày** | 08/08/2026 |
| **Người soạn** | Chief Solution Architect |
| **Nguồn nghiệp vụ** | Board 08/08/2026 — *"trao toàn quyền thiết kế lại form tạo PO… **nếu thiếu thì phải bổ sung**… chuẩn chỉ phù hợp với ngành gia công may mặc chuyên nghiệp"* |
| **Migration thi hành** | `055_po_garment_fields.sql` |
| **Phản biện độc lập** | ⛔ **CHƯA có** |

---

## 0. 🔴 MỘT LỖI MẤT DỮ LIỆU ĐANG CHẠY — phát hiện khi đo, ⛔ không khi đọc mã

Biểu mẫu tạo PO **có ô "Ghi chú"**. Lược đồ Zod **có trường `notes`**. Nhưng đo
`orders` trên CSDL thật: **⛔ KHÔNG CÓ CỘT `notes`**, và `createPo` vì thế ⛔
không hề ghi nó.

> Người dùng gõ *"khách yêu cầu in nhãn size riêng"* → bấm Lưu → hệ thống báo
> **thành công** → câu đó **biến mất ⛔ không dấu vết**.

🔑 Đây là loại lỗi tệ nhất trong nhóm mất dữ liệu: **nó trông như đã lưu**.
Người nhập tin là đã ghi chú; chuyền tin là ⛔ không có yêu cầu gì. Cả hai đều
tin đúng thứ mình thấy, và ⛔ không ai sai — trừ phần mềm.

⚠️ Lỗi này **⛔ không bị `tsc` · `lint` · `build` · bài kiểm nào bắt được**, vì
mọi tầng đều hợp lệ; chỗ đứt nằm ở **khoảng giữa lược đồ ứng dụng và lược đồ
CSDL** — nơi ⛔ không phép kiểm nào của kho này đang canh.

---

## 1. NĂM TRƯỜNG NGHIỆP VỤ CÒN THIẾU

### 1.1 `customer_po_no` — **Số PO của khách**

Nhà máy có mã nội bộ *(`po_number`)*; khách có số của họ. Toàn bộ **Commercial
Invoice · Packing List · Bill of Lading**, và nhất là **L/C**, tham chiếu **số
của KHÁCH**.

🔴 Thiếu nó: tới lúc lập chứng từ, MD phải lục email tìm lại; và ngân hàng
**từ chối** bộ chứng từ ⛔ không khớp số PO ghi trên L/C. Đó là tiền bị treo,
⛔ không phải phiền phức hành chính.

### 1.2 `port_of_loading` · `port_of_destination` — **Cảng đi · Cảng đến**

🔑 **`Incoterm` mà ⛔ không có cảng là một điều khoản ⛔ CHƯA HOÀN CHỈNH.**
`FOB` nghĩa là *"giao lên tàu tại cảng X"* — thiếu X thì ⛔ không xác định được
**điểm chuyển rủi ro** lẫn **ai trả cước tới đâu**.

⚠️ `FOB Hai Phong` và `FOB Ho Chi Minh` chênh nhau **hàng nghìn đô cước nội
địa** trên một container. Hệ thống hiện lưu `incoterm` mà ⛔ không lưu cảng —
tức lưu một nửa điều khoản.

### 1.3 `material_eta` — **Ngày NPL phải về kho**

Chuyền **⛔ không cắt được khi vải chưa về**. Đây là mốc **sớm nhất** trong cả
đơn có thể làm trễ mọi mốc sau, và là mốc MD **cam kết ngược lại** với bộ phận
vật tư.

⚠️ Lịch T&A tự sinh **có** mốc NPL, nhưng đó là mốc **hệ thống tính ra**;
`material_eta` là ngày **nhà cung cấp đã hứa**. Hai thứ khác nhau, và khoảng
lệch giữa chúng chính là **rủi ro** cần nhìn thấy.

### 1.4 `qty_tolerance_percent` — **Dung sai ±%**

Chuẩn ngành `±3%` / `±5%`, và **L/C ghi rõ**.

🔴 ⛔ Không có nó thì giao **4.950/5.000** bị đọc là **giao thiếu** — trong khi
hợp đồng cho phép. Tranh chấp này ⛔ không giải được bằng trí nhớ của MD.

⚠️ Cùng **luật ba trạng thái** với `credit_limit` và `credit_term_days`:
`0` = giao đúng tuyệt đối · `NULL` = ⛔ chưa thoả thuận. Ba ô này ⛔ không được
đọc theo ba luật khác nhau.

---

## 2. ⚠️ MỘT NHÃN SAI BẢN CHẤT DỮ LIỆU — sửa, ⛔ không thêm cột

Ô *"Xưởng gia công ngoài (Subcon)"* mà tôi thêm ở vòng trước **ngụ ý nơi MAY**
đơn hàng. Đo bảng `subcontractors` trên CSDL thật:

```
SUB-GIAT-02  Nhà Máy Giặt Công Nghiệp Củ Chi   service_type = GIAT
SUB-IN-01    Xưởng In Lưới Tân Bình            service_type = IN_THEU
```

⇒ Đây là **nhà cung cấp DỊCH VỤ** *(giặt · in · thêu)*, ⛔ **không** phải xưởng
may. `partner.service.ts` đã ghi đúng điều này từ trước, và tôi ⛔ không đọc.

🔑 **Một ô chọn mang nhãn sai còn tệ hơn một ô ⛔ chưa có**: MD chọn *"Xưởng In
Lưới Tân Bình"* để khai nơi may, và từ đó mọi báo cáo năng lực chuyền đọc ra
một xưởng in đang may 5.000 áo.

⇒ Nhãn đổi thành **"Dịch vụ thuê ngoài — giặt · in · thêu"**. ⛔ Không đổi cột,
⛔ không migration cho phần này.

---

## 3. ⛔ ĐIỀU ĐÃ BỊ BÁC

### 3.1 ⛔ Đưa bảng **màu × size** vào biểu mẫu tạo

Board đã chốt từ *MD Final Input Experience*: nó thuộc **PO 360°**. Nhét một
bảng vào hộp thoại tạo là dựng lại đúng cái popup dài đã bị bác.

### 3.2 ⛔ Thêm cột `contract_no` · `lc_no` · `hs_code`

Chúng **có thật** trong nghiệp vụ, nhưng thuộc **bộ chứng từ xuất khẩu** —
một miền riêng, ⛔ chưa có màn hình nào sở hữu. Thêm cột vào `orders` lúc này
là dựng chỗ chứa cho một nghiệp vụ **⛔ chưa ai vận hành**, và cột rỗng vĩnh
viễn là nợ chứ ⛔ không phải năng lực.

---

## 4. TÍNH ĐẢO NGƯỢC — **ĐẢO ĐƯỢC HOÀN TOÀN**

```sql
ALTER TABLE orders DROP COLUMN customer_po_no, port_of_loading,
  port_of_destination, material_eta, qty_tolerance_percent, notes;
```

⚠️ Đảo cột `notes` là **quay lại đúng lỗi mất dữ liệu ở §0** — cần lý do nghiệp
vụ, ⛔ không phải một lượt dọn dẹp.

---

## 5. PHÂN TÍCH TÁC ĐỘNG

| | |
|---|---|
| **Bảng chạm** | `orders` — thêm 6 cột. ⛔ KHÔNG bảng nào khác. |
| **Ai mất quyền gì** | ⛔ **KHÔNG AI.** Thuần thêm cột, ⛔ không chạm policy. |
| **RLS** | ⛔ **KHÔNG chạm.** Cột mới thừa hưởng policy sẵn có của `orders`. |
| **Màn hình đổi** | form Tạo PO *(thêm ô)* · PO 360° *(hiện thêm)*. ⛔ Không màn hình nào **mất** chức năng. |

🔴 **`055` là migration ⛔ KHÔNG chạm RLS đầu tiên của loạt này** — nên nó ⛔
không rơi vào diện bắt buộc phản biện của `ADR-011 §2.2`. Nhưng nó vẫn **⛔ chưa
được phản biện**, và tôi ghi lại điều đó thay vì im lặng.

---

## 6. ⚠️ TRẠNG THÁI THI HÀNH — đọc kỹ

Mã ứng dụng **ĐÃ sửa xong** và `createPo` **đang ghi sáu cột này**.

🔴 ⇒ **Cho tới khi `055` chạy, chức năng tạo PO sẽ ĐỔ LỖI** *(`column
orders.customer_po_no does not exist`)*.

🔑 Tôi cố ý ⛔ **không** viết mã phòng hờ kiểu *"có cột thì ghi, ⛔ không có thì
bỏ qua"*. Một nhánh như vậy sẽ khiến sáu trường nghiệp vụ **im lặng biến mất**
trên môi trường ⛔ chưa chạy migration — tức tái tạo **đúng lỗi §0** mà tài liệu
này sinh ra để đóng.

⇒ **Hỏng ồn ào** tốt hơn **mất dữ liệu im lặng**.
