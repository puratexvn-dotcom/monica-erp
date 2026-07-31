# Warehouse Command Center

Trung tâm điều hành kho nguyên phụ liệu. Nguyên tắc vận hành: **đúng hàng · đúng lô · đúng chỗ — không để đứt chuyền**.

---

## 1. Ba khu vực của Command Center

Giống mọi phân hệ trong hệ thống, phần trên cùng chia ba khu vực:

- **Hộp việc cần làm** — phiếu chờ xử lý, xếp theo số ngày tồn đọng.
- **Chỉ số then chốt** — tồn kho, hàng chờ kiểm, hàng bị khoá.
- **Cảnh báo** — vật tư sắp thiếu so với nhu cầu của đơn hàng đang chạy.

## 2. Cách hệ thống hiểu "tồn kho"

Một mã vật tư ở một vị trí có bốn con số riêng biệt, không được cộng gộp:

- **Thực có** — số lượng đang nằm trong kho.
- **Đã giữ chỗ** — đã hứa cho đơn hàng cụ thể, chưa xuất.
- **Đang kiểm** — đã nhận nhưng chưa qua kiểm chất lượng.
- **Bị khoá** — không dùng được (sai tông màu, quá hạn, chờ xử lý khiếu nại).

**Khả dụng** là số duy nhất được phép hứa cho đơn mới, và nó do hệ thống tự tính:

> Khả dụng = Thực có − Đã giữ chỗ − Đang kiểm − Bị khoá (không xuống dưới 0)

Con số này **không nhập tay được**. Cơ sở dữ liệu tự tính lại mỗi khi một trong bốn số kia đổi, nên không có chuyện hai màn hình hiện hai kết quả khác nhau.

## 3. Định vị hàng

Mỗi vị trí trong kho định danh theo ba cấp: **Khu vực — Kệ — Ô**. Một cuộn vải luôn phải có đủ ba cấp mới coi là đã nhập kho. Ghi thiếu cấp nào thì tìm lại bằng mắt, mất hàng giờ.

Ngoài vị trí, mỗi cuộn còn mang **số lô** và **tông màu**. Hai cuộn cùng mã vải nhưng khác tông màu thì **không được thay thế cho nhau** — cắt trộn tông là lỗi không sửa được sau khi đã may.

## 4. Luồng nhập hàng

1. **Nhận hàng** — ghi nhận theo phiếu giao của nhà cung cấp.
2. **Kiểm chất lượng** — vải đưa vào kiểm; số lượng nằm ở cột *Đang kiểm*, chưa được hứa cho ai.
3. **Nhập kho** — đạt thì chuyển sang *Thực có* và gán vị trí Khu vực — Kệ — Ô.
4. **Giữ chỗ** — phân bổ cho đơn hàng, số lượng chuyển sang *Đã giữ chỗ*.
5. **Xuất cho sản xuất** — cấp cho tổ cắt theo phiếu cắt, trừ khỏi *Thực có*.

Mọi lần chuyển đều để lại một dòng trong **nhật ký di chuyển**. Không có thao tác nào sửa thẳng số tồn mà không đi qua nhật ký.

## 5. Truy vết ngược

Từ một thùng hàng thành phẩm có thể lần ngược về đúng cuộn vải đã dùng:

> Thùng hàng → Lô xuất → Phiếu cắt → Cuộn vải → Số lô → Nhà cung cấp

Khi khách khiếu nại một lô hàng, đây là chuỗi cần đi để xác định phạm vi ảnh hưởng.

## 6. Chat liên bộ phận

Nút **Chat** ở thanh dưới đáy mở khung trao đổi của kho.

- Gõ `@` rồi tên bộ phận để gọi đúng người — thiếu vật tư thì gọi `@md`, nghi ngờ chất lượng thì gọi `@qa`.
- Đánh dấu **cờ đỏ** cho việc chặn chuyền.
- Đính kèm ảnh để chứng minh tình trạng hàng ngay tại chỗ.
- Tin nhắn được lưu trữ, tải lại trang vẫn còn.

---

## Những điều cần nhớ

- Chỉ hứa hàng theo số **Khả dụng**, không bao giờ theo số **Thực có**.
- Không trộn tông màu, dù cùng mã vải.
- Không có dữ liệu mẫu. Màn hình trống nghĩa là chưa có dữ liệu thật.
