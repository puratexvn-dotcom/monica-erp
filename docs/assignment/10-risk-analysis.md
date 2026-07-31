# 10 · RISK ANALYSIS

> ⚠️ **MỘT PHẦN TÀI LIỆU NÀY ĐÃ BỊ THAY THẾ** (ADR đã được duyệt 01/08/2026) bởi
> [ADR-001](ADR-001-site-and-operation.md) (01/08/2026):
> `factories` → **`production_sites`** · **KHÔNG** tạo bảng `operations`
> (dùng `style_operations` đã có) · **NULL không bao giờ nghĩa là "tất cả"** —
> phạm vi tuyên bố tường minh bằng `scope_level`.


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
việc giải phóng bó khi Assignment chuyển `CANCELLED` — nhưng đặt ở **tầng
service**, không ở trigger (Quyết định 5).

⚠️ **Đánh đổi phải nói rõ.** Ở service thì một lần đổi trạng thái thẳng trong
CSDL, hoặc một nhánh mã quên gọi, sẽ để bó **kẹt lại** ở Assignment đã huỷ —
và lỗi này im lặng. Bù bằng hai thứ: một mục hồi quy khẳng định *không tồn tại
`assignment_bundles` còn hiệu lực trỏ vào Assignment `CANCELLED`*, và một
truy vấn rà định kỳ. Trigger bắt được ca này chắc chắn hơn; Quyết định 5 đổi
độ chắc chắn đó lấy ranh giới kiến trúc sạch, và đó là lựa chọn có chủ đích.

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

## R12 · Trigger đã lên production vi phạm Quyết định 5 — TRUNG BÌNH / CHẮC CHẮN

**Rủi ro.** Migration 024 (đã chạy) có trigger `shipment_release_cartons`: khi
lô hàng chuyển `CANCELLED` thì tự xoá mềm mọi liên kết thùng. Theo Quyết định
5, đó là **tự động hoá nghiệp vụ**, thứ không được đặt trong trigger.

**Vì sao nó tồn tại.** Không có nó thì chỉ mục `uq_shipment_carton_active` sẽ
khoá vĩnh viễn những thùng của lô đã huỷ — đã kiểm chứng bằng chuỗi thao tác
thật ở Phase 6.

**Vì sao tôi KHÔNG tự gỡ.** Gỡ trigger mà chưa có service thay thế sẽ mở lại
đúng cái bẫy nó đang chặn, và lỗi đó im lặng — không ai biết cho tới lúc cần
xếp lại thùng.

**ĐÃ QUYẾT: phương án (c)**, thực hiện ở migration `026b_shipment_cancel_guard`.

Ba lối đã trình:

| | Việc | Đánh đổi |
|---|---|---|
| **a** | Giữ nguyên, ghi vào Hiến pháp như một ngoại lệ có tên | Ranh giới bị đục một lỗ, nhưng lỗ đó có hồ sơ |
| **b** | Chuyển sang service, gỡ trigger | Sạch kiến trúc; mất độ chắc chắn ở đường gọi thẳng CSDL |
| **c** | Giữ trigger nhưng đổi nó thành *từ chối* thay vì *tự làm*: chặn `→ CANCELLED` khi còn thùng chưa gỡ | Đúng tinh thần Quyết định 5 (trigger chỉ từ chối), nhưng bắt người dùng gỡ thùng thủ công trước khi huỷ |

An toàn để đổi: đã đo trước khi viết — `shipments` 0 dòng, `shipment_cartons`
0 dòng, và **không mã nguồn nào** chuyển lô hàng sang `CANCELLED`. Nên thay đổi
hành vi lúc này không gãy màn hình nào.

Hệ quả cho tầng ứng dụng: luồng huỷ lô hàng phải **gỡ thùng trước, huỷ sau**.
Làm ngược sẽ nhận mã lỗi `23001` kèm câu nói rõ còn bao nhiêu thùng — người
dùng biết phải làm gì, thay vì hệ thống âm thầm xoá liên kết thay họ.

---

## R11 · Phạm vi phình ra thành ERP đối tác — THẤP / TRUNG BÌNH

**Rủi ro.** Assignment là nền móng, nên mọi thứ đều "nên đi qua Assignment":
lịch làm việc, năng lực, giá gia công, hợp đồng, đánh giá đối tác…

**Cách chặn.** Điều XXIX. Mỗi đề xuất thêm bảng phải trả lời: *hôm nay không có
nó thì hỏng chuyện gì?* Sáu thứ đã bị loại bằng đúng câu hỏi đó:
`buildings` · `floors` · `forwarders` · `auditors` · `material_consumption` ·
bốn thư mục Portal riêng.

---

## Ba câu đã được Kiến trúc sư trả lời — 31/07/2026

**① `/assignments` thuộc `/md`.** Quyết định 2: Merchandiser là người điều phối
sản xuất. Kho chỉ thực hiện cấp phát vật tư **theo** Assignment. Route là
`app/(dashboard)/md/assignments/` — không phải phân hệ mới, không đụng ràng
buộc *12 phân hệ*.

**② Đối tác XEM ĐƯỢC giá của chính Assignment mình.** Quyết định 3. Đó là giá
trị hợp đồng giữa Monica và chính họ. Vẫn cấm tuyệt đối: Buyer Price · Internal
Cost · giá của Assignment khác.

*Hệ quả kéo theo — đã cập nhật tài liệu 01 và 04:* `unit_price` + `currency`
chuyển **lên chính bảng `assignments`**. Bản 1 lập luận ngược lại (giá là dữ
liệu thương mại, nên để ở `subcon_orders`), nhưng lập luận đó phục vụ một yêu
cầu khác. Khi đối tác **được phép** xem giá của mình, đặt giá ngay trên
Assignment cho ra phạm vi bảo vệ **hẹp hơn**: ai thấy Assignment thì thấy đúng
giá của Assignment ấy — cùng một cơ chế, không cần mở thêm đường đọc vào
`subcon_orders` (bảng chứa giá của **mọi** đối tác).

⚠️ **Rủi ro mới sinh ra từ quyết định này:** vì giá nằm trên `assignments`, một
lỗi ở `mos_assignment_covers()` sẽ lộ **giá**, không chỉ lộ sự tồn tại của phần
việc. Bài kiểm phạm vi (R4) vì thế phải khẳng định thẳng vào cột `unit_price`,
không chỉ đếm số dòng. Đã thêm thành bài kiểm bắt buộc số 2 ở tài liệu 07.

**③ Buyer KHÔNG dùng Assignment.** Quyết định 4. Buyer là Order Owner; quyền
của họ tiếp tục đi qua `mos_buyer_can_see_order()` của migration 018.

Assignment là Core Domain của **Manufacturing Execution**, không phải của
Customer Management (Quyết định 5). Sáu loại Đối tác Thực thi:
`PRODUCTION_PARTNER` · `SERVICE_PARTNER` · `SUPPLIER` · `FORWARDER` ·
`INSPECTION` · `AUDITOR`.

*Hệ quả tích cực:* phần phân quyền **đã chạy ổn định nhất** của hệ thống —
migration 018 và `/buyer` — hoàn toàn không bị động tới. Rủi ro R1 (vá lỗ hổng
thành mất điện) giảm đáng kể vì bề mặt thay đổi hẹp hơn hẳn.

*Hệ quả phải cài đặt:* bất biến **I-8** — chặn ở tầng CSDL không cho tạo
Assignment với partner loại `BUYER`. Không có nó, một Assignment tạo nhầm sẽ cấp
cho Buyer quyền GHI sản lượng, thứ Điều XXX mục 9 cấm tuyệt đối. Đây là loại lỗi
im lặng mà chỉ ràng buộc CSDL mới bắt được.

---

## Câu "12 phân hệ" — ĐÃ CÓ LỜI ĐÁP

**Quyết định 3 (tinh chỉnh):** đếm theo **Business Capability**, không đếm theo
Route. *External Collaboration* là **một** phân hệ; năm Portal là năm giao diện
thuộc phân hệ đó.

Số phân hệ không đổi, kể cả khi dựng thêm `/supplier`, `/forwarder`,
`/auditor`. Cách đếm này cũng giải thích vì sao `/md/po/[poId]` với tám lát cắt
không làm tăng số phân hệ.

---

## Không còn câu nào chờ quyết

Toàn bộ câu hỏi kiến trúc đã có lời đáp. Migration `026b` và `027` đã viết
xong, chờ chạy.
