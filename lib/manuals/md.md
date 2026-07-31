# Merchandiser Command Center

Bàn làm việc của bộ phận Merchandiser & Thu mua. Toàn bộ vòng đời một đơn hàng — từ lúc khách hỏi giá đến lúc container rời cảng — nằm trong màn hình này.

---

## 1. Ba khu vực của Command Center

Khi mở `/md`, phần trên cùng luôn là ba khu vực điều hành. Chúng trả lời ba câu hỏi khác nhau, đọc theo thứ tự từ trái sang:

- **Hộp việc cần làm** — việc đang chờ chính bạn xử lý, xếp theo số ngày trễ. Việc trễ lâu nhất nằm trên cùng.
- **Chỉ số then chốt** — số liệu tổng của bộ phận. Bấm vào một thẻ để nhảy thẳng tới tab chứa dữ liệu chi tiết của nó.
- **Cảnh báo** — điều bất thường cần biết ngay, kể cả khi chưa phải việc của bạn.

**Quy ước số liệu:** `0` nghĩa là thật sự bằng không. Dấu `—` nghĩa là chưa đọc được dữ liệu. Hai thứ này không bao giờ được hiểu lẫn nhau.

## 2. Mười ba tab nghiệp vụ

Các tab xếp theo ba nhóm, đúng trình tự công việc thực tế:

**Nhóm Thương mại** — giai đoạn trước khi có đơn:

- **Khách hàng** — hồ sơ khách, đầu mối liên hệ, điều khoản thanh toán.
- **Yêu cầu báo giá (RFQ)** — yêu cầu khách gửi sang, kèm hạn trả lời.
- **Chiết tính giá** — dựng giá FOB/CM từ định mức nguyên phụ liệu và thời gian may.

**Nhóm Triển khai** — giai đoạn có đơn thật:

- **Mã hàng** — thông số kỹ thuật, bảng size, ảnh mẫu.
- **Đơn hàng (PO)** — danh sách đơn, cửa vào hồ sơ PO 360°.
- **Vật tư** — nhu cầu nguyên phụ liệu và tình trạng đặt mua.
- **Sản xuất** — sản lượng theo chuyền, đối chiếu với kế hoạch.
- **Giao hàng** — lô xuất, chứng từ, ngày tàu chạy.

**Nhóm Phối hợp** — làm việc cùng bộ phận khác:

- **Tài liệu** — tệp đính kèm theo từng đơn.
- **Thảo luận** — trao đổi gắn với hồ sơ cụ thể.
- **Yêu cầu thay đổi** — khách đổi thiết kế, đổi số lượng, đổi ngày.
- **Rủi ro** — điểm rủi ro và biện pháp đối phó.
- **Nhật ký** — ai sửa gì, lúc nào. Không xoá được.

Biểu đồ nằm **bên dưới** các tab, không nằm trên. Lý do: khi mở màn hình, việc cần làm phải đập vào mắt trước, biểu đồ là thứ xem sau.

## 3. Luồng quản lý một đơn hàng

Trình tự chuẩn:

1. **Nhận RFQ** — tạo yêu cầu báo giá ở tab *Yêu cầu báo giá*, ghi rõ hạn trả lời khách.
2. **Chiết tính** — sang tab *Chiết tính giá*. Giá vốn dựng từ định mức nguyên phụ liệu (BOM) và thời gian may chuẩn (SAM); sửa một dòng định mức thì giá tự tính lại.
3. **Lập mã hàng** — chốt giá xong thì tạo mã hàng ở tab *Mã hàng*, kèm bảng size và thông số.
4. **Mở PO** — tạo đơn ở tab *Đơn hàng*, gắn với mã hàng và khách hàng đã có.
5. **Theo dõi** — mở **PO 360°** để bám tiến độ tới khi xuất hàng.

## 4. Hồ sơ PO 360°

Bấm một dòng ở tab *Đơn hàng* để mở bảng trượt PO 360°. Đây là toàn bộ những gì cần biết về một đơn hàng, chia mười thẻ:

- **Tổng quan** — đơn này đang ở đâu, có kịp không?
- **Lịch trình T&A** — mốc nào đã qua, mốc nào sắp tới hạn?
- **Mẫu duyệt** — khách đã duyệt mẫu chưa?
- **Cấu trúc NPL** — đơn này cần những vật tư gì, định mức bao nhiêu?
- **Trạng thái NPL** — vật tư đã về kho chưa, đủ chưa?
- **Tiến độ sản xuất** — chuyền may đã ra được bao nhiêu?
- **Chất lượng** — tỷ lệ lỗi, kết quả kiểm hàng.
- **Đóng gói & Xuất hàng** — đóng thùng tới đâu, chứng từ đủ chưa?
- **Rủi ro** — điểm nào có nguy cơ trễ hoặc lỗi?
- **Thảo luận & Tài liệu** — trao đổi và tệp gắn với đơn này.

Bảng trượt mở **đè lên** danh sách chứ không rời trang. Đóng lại là về đúng vị trí cũ trong danh sách, không mất bộ lọc đang đặt.

## 5. Tìm nhanh

Nhấn **Ctrl + K** (hoặc bấm ô tìm kiếm trên thanh đầu trang) để mở bảng lệnh. Gõ mã PO, mã hàng hoặc tên khách để nhảy thẳng tới hồ sơ. Gõ không dấu vẫn ra kết quả có dấu.

## 6. Chat liên bộ phận

Nút **Chat** ở thanh dưới đáy mở khung trao đổi của phân hệ đang đứng.

- Gõ `@` rồi tên bộ phận để gọi đúng người. Gõ không dấu vẫn gợi ý đúng.
- Đánh dấu **cờ đỏ** cho việc cần xử lý ngay; tin có cờ đỏ hiện viền đỏ nổi bật.
- Đính kèm ảnh bằng nút kẹp giấy. Ảnh tải lên ngay khi chọn, không đợi bấm gửi.
- Tin nhắn **được lưu trữ**: tải lại trang vẫn còn. Tin mới của người khác hiện ngay, không cần F5.

**Ai đọc được tin của bạn:** Ban giám đốc, Merchandiser và Quản trị hệ thống đọc được mọi hội thoại. Các bộ phận khác chỉ thấy tin do chính họ gửi và tin có `@` gọi tên bộ phận họ. Quyền này do máy chủ quyết định, không phải do giao diện che bớt.

**Khách hàng (Buyer) không bao giờ đọc được chat nội bộ.**

## 7. Trợ lý phân tích

Nút **A.I** ở thanh dưới đáy mở trợ lý.

Trợ lý hiện chạy theo **luật nghiệp vụ**, không phải mô hình ngôn ngữ. Nó đọc số liệu thật trong hệ thống và chỉ ra điều bất thường theo các quy tắc đã cài. Nó **không** đoán, không tự viết văn, và không bao giờ dựng ra số liệu không có trong cơ sở dữ liệu.

## 8. Báo cáo

Nút **Báo cáo** ở thanh dưới đáy mở bảng số liệu tổng hợp, có nút xuất thành ảnh dọc để gửi Zalo hoặc dán vào email. Ảnh xuất ra đúng bằng khung nhìn, không dư lề trắng.

---

## Những điều cần nhớ

- Không có dữ liệu mẫu trong hệ thống. Màn hình trống nghĩa là chưa có dữ liệu thật.
- Nhật ký không xoá được — mọi thao tác sửa đều để lại vết.
- Hội thoại không sửa và không xoá được. Đây là bằng chứng vận hành khi có tranh chấp với khách.
