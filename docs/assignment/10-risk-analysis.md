# 10 · RISK ANALYSIS

Xếp theo **thiệt hại × khả năng xảy ra**, không theo thứ tự thiết kế.

---

## R1 · Vá lỗ hổng thành mất điện — CAO / CAO

**Rủi ro.** Bật RLS theo Assignment khi chưa ai lập Assignment nào → mọi đối
tác mất sạch quyền, cổng trắng xoá.

**Vì sao gần như chắc xảy ra.** Đã suýt xảy ra hai lần: khi bật
`security_invoker` ở migration 024, và khi khoá `subcon` ở 025. Cả hai lần
thoát nhờ **đo trước** bằng tài khoản tạm của từng vai trò.

**Cách chặn.**
- Thứ tự triển khai bắt buộc: **màn hình lập Assignment (bước 6) TRƯỚC policy
  RLS (bước 7)**.
- Bài kiểm `matrix-assignment.mjs`: mọi bảng × 14 vai trò, chạy **trước và
  sau**. Vai trò nội bộ phải thấy y hệt admin.
- Policy mở bằng `NOT mos_is_external()` — 12/14 vai trò thoát ngay ở biểu
  thức đầu.

---

## R2 · Hiệu năng RLS trên đường đọc nóng — CAO / TRUNG BÌNH

**Rủi ro.** `mos_assignment_covers()` chạy trên **từng dòng** của mọi bảng vận
hành. `prod_logs` đã có 140 dòng với 2 PO; ở 100.000 PO/năm con số này là hàng
triệu.

**Cách chặn.** Ba lớp ở tài liệu 05 mục 6: thoát sớm cho người nội bộ · hàm
`STABLE` gọi một lần mỗi câu lệnh · chỉ mục một phần
`(partner_id, order_id, status) WHERE deleted_at IS NULL`.

**Ngưỡng chấp nhận.** Đọc bằng phiên đối tác **< 2× đường cơ sở đo đan xen**.
Đường cơ sở Phase 6: 275 ms.

⚠️ **Phải đo ĐAN XEN.** Đo xong đường cơ sở rồi mới đo cái cần đo sẽ cho chênh
lệch vô nghĩa — ở `live-024` từng ra **âm 636 ms**, và mục kiểm "đạt" vì lý do
sai.

---

## R3 · Hai hệ thống quyền chồng nhau — CAO / TRUNG BÌNH

**Rủi ro.** Giai đoạn 025/026 (chặn theo vai trò) và Assignment RLS cùng chạy.
Kết quả là giao của hai tập, và không ai đoán được.

**Ví dụ cụ thể.** 025 chặn `subcon` đọc `materials`. Assignment cho phép đọc
"vật tư được cấp". Đối tác sẽ **không** thấy vật tư của chính mình — và lỗi
này im lặng, không báo gì.

**Cách chặn.** Migration 032 gỡ 025/026, chạy **sau** khi Assignment đã được
chứng minh. Trong khoảng giữa, mọi bài kiểm phải chạy với **cả hai** lớp bật.

---

## R4 · `NULL` trong phạm vi bị hiểu ngược — CAO / TRUNG BÌNH

**Rủi ro.** `line_id = NULL` nghĩa là *mọi chuyền*. Viết
`a.line_id = r.line_id` thay vì `(a.line_id IS NULL OR a.line_id = r.line_id)`
sẽ làm mọi Assignment phạm vi rộng **không khớp gì cả** — vì `NULL = x` cho ra
`NULL`, không phải `TRUE`.

**Vì sao nguy hiểm.** Không có lỗi, không có cảnh báo. Đối tác chỉ đơn giản
không thấy dữ liệu, và sẽ báo là "hệ thống chậm cập nhật".

**Cách chặn.** Bài kiểm riêng cho **bốn tổ hợp phạm vi**: rộng nhất
(chỉ PO) · có chuyền · có công đoạn · đầy đủ. Mỗi tổ hợp phải khớp đúng tập tài
nguyên mong đợi, và **phải có dữ liệu thật** — so hai mảng rỗng là khẳng định
rỗng, bẫy đã mắc nhiều lần.

---

## R5 · Khoá TEXT của `subcons` — TRUNG BÌNH / CAO

**Rủi ro.** `subcons.id` là `TEXT` (`SC1`), `subcontractors.id` là `UUID`.
`partners` phải mang cả hai kiểu. Một cột `partner_id UUID` không trỏ được vào
`subcons`.

**Cách chặn.** Bốn cột cầu nối riêng, mỗi cột đúng kiểu của bảng đích, cộng một
`CHECK` bảo đảm đúng một cột có giá trị (tài liệu 02 mục 3.1).

**Cái KHÔNG làm.** Không đổi `subcons.id` sang UUID. `prod_logs` (140 dòng) và
`financial_records` (2 dòng) đang trỏ vào nó. Một cột TEXT xấu rẻ hơn nhiều so
với một cuộc di trú khoá hỏng.

---

## R6 · `factories` và `operations` không tồn tại — TRUNG BÌNH / CHẮC CHẮN

**Rủi ro.** Điều XXX yêu cầu phạm vi tới `operation_id`, nhưng **không có bảng
công đoạn nào**. Không có nó thì không giao được "tra tay ở chuyền 5" — mà đó
chính là ca dùng chính của thầu phụ chuyên môn (in, giặt, thêu).

**Cách chặn.** Migration 028 tạo `factories` và `operations`. `operations` khởi
tạo **rỗng** — nghiệp vụ tự khai công đoạn, hệ thống không bịa.

**Hệ quả phải chấp nhận.** Tới khi nghiệp vụ khai công đoạn, mọi Assignment sẽ
có `operation_id = NULL`, tức phạm vi *mọi công đoạn*. Đây là mặc định **rộng**
— phải nói rõ trên màn hình, nếu không người giao việc tưởng mình đã giao hẹp.

---

## R7 · Đối tác bị khoá vĩnh viễn khỏi bó hàng — TRUNG BÌNH / TRUNG BÌNH

**Rủi ro.** `UNIQUE (bundle_id)` trên `assignment_bundles` khiến bó đã gỡ không
bao giờ gán lại được.

**Vì sao chắc chắn gặp.** Đã gặp nguyên văn ở `shipment_cartons` (Phase 6): huỷ
lô hàng xong thì thùng bị khoá vĩnh viễn, phải thêm trigger giải phóng.

**Cách chặn.** Chỉ mục duy nhất **một phần** `WHERE deleted_at IS NULL`, cộng
trigger giải phóng bó khi Assignment chuyển `CANCELLED` — sao chép nguyên
`shipment_release_cartons` của migration 024, thứ đã kiểm chứng chạy đúng.

---

## R8 · View mới lại vượt mặt RLS — TRUNG BÌNH / THẤP

**Rủi ro.** `v_assignment_report_status` quên `security_invoker = true` → chạy
dưới quyền chủ sở hữu, và mọi đối tác đọc được lịch báo cáo của mọi đối tác
khác.

**Vì sao vẫn liệt kê dù đã biết.** Bảy view của 017/020/022 đã rò rỉ **thật** vì
đúng lỗi này, và tôi từng viết một chú thích khẳng định sai rằng chúng an toàn.
Biết một lần không bảo đảm nhớ lần sau.

**Cách chặn.** Bài kiểm quét **mọi view** trong lược đồ, đếm số view thiếu cờ,
kỳ vọng **bằng 0**. Đã có sẵn trong truy vấn đối chiếu của migration 024.

---

## R9 · Cảnh báo giả làm mù bảng điều khiển — TRUNG BÌNH / TRUNG BÌNH

**Rủi ro.** `REPORT MISSING` sáng đèn cho ngày Chủ nhật, ngày lễ, ngày
Assignment đang `SUSPENDED`, hoặc ngày tương lai. Vài chục cảnh báo giả và
không ai nhìn bảng nữa.

**Cách chặn.** `LEAST(end_date, hôm_nay)` chặn ngày tương lai · `SUSPENDED`
không nằm trong danh sách trạng thái bị đòi báo cáo · múi giờ Việt Nam tường
minh.

⚠️ **Ngày nghỉ chưa xử lý.** Hệ thống không có bảng lịch làm việc. Xưởng may
thường chạy cả thứ Bảy. Đề xuất: giai đoạn 1 **đòi báo cáo mọi ngày trong
khoảng**, và ghi rõ trên màn hình. Bảng lịch làm việc là việc riêng, không nhét
vào Assignment Engine.

---

## R10 · Bài kiểm tự làm bẩn cơ sở dữ liệu — THẤP / CAO

**Rủi ro.** Bài kiểm tạo Assignment, đổi trạng thái, ghi báo cáo — rồi khôi
phục sai.

**Đã xảy ra.** `probe-026` khôi phục tên nhà thầu bằng **chuỗi cứng** và biến
"Nhà Máy Giặt Công Nghiệp Củ Chi" thành "Xưởng In Lưới Tân Bình" trên dữ liệu
thật.

**Cách chặn.** Quyết định 6 của Kiến trúc sư, nay là quy tắc: **chụp giá trị
trước khi sửa, khôi phục theo bản chụp, và có một mục kiểm đối chiếu lại chính
bản chụp đó.** Cộng `snapshot` toàn bộ bảng trước/sau mỗi lượt chạy.

---

## R11 · Phạm vi phình ra thành ERP đối tác — THẤP / TRUNG BÌNH

**Rủi ro.** Assignment là nền móng, nên mọi thứ đều "nên đi qua Assignment":
lịch làm việc, năng lực, giá gia công, hợp đồng, đánh giá đối tác…

**Cách chặn.** Điều XXIX. Mỗi đề xuất thêm bảng phải trả lời: *hôm nay không có
nó thì hỏng chuyện gì?* Sáu thứ đã bị loại bằng đúng câu hỏi đó:
`buildings` · `floors` · `forwarders` · `auditors` · `material_consumption` ·
bốn thư mục Portal riêng.

---

## Ba điều tôi chưa chắc và cần Kiến trúc sư quyết

**① `/assignments` nằm trong `/md` hay `/kho`?** Merchandiser giao việc, nhưng
kho xuất bó đi. Cả hai đều có lý. Ảnh hưởng tới ràng buộc *12 phân hệ*.

**② Đối tác có được xem `unit_price` trên Assignment của chính họ không?** Điều
XXX mục 10 cấm "Internal Cost", nhưng giá gia công **của chính họ** là thứ họ
đã ký hợp đồng. Tôi nghiêng về **có**, nhưng đây là quyết định thương mại.

**③ Buyer có Assignment không?** Buyer không "được giao việc" — họ **sở hữu**
đơn hàng. Có thể quyền của Buyer nên đi qua `partners.customer_id` như migration
018 đang làm, chứ không qua Assignment. Nếu vậy thì Assignment chỉ dành cho
SUBCON · SERVICE_VENDOR · SUPPLIER · FORWARDER · AUDITOR, và tài liệu 04 phải
sửa cột BUYER.

Câu ③ là câu quan trọng nhất trong ba — nó quyết định Assignment có thật sự là
nền móng của **toàn bộ** External Collaboration Platform, hay chỉ của phần đối
tác vận hành.
