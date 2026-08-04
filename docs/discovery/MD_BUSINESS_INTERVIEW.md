# PHỎNG VẤN NGHIỆP VỤ — MD
## Bộ câu hỏi khai thác tri thức từ Board và người vận hành

| Trường | Giá trị |
|---|---|
| **Ngày** | 2026-08-04 |
| **Mục đích** | Lấy phần tri thức nghiệp vụ **không** nằm trong kho mã |
| **Trạng thái** | 🧊 Không thi hành · không thiết kế · chỉ hỏi |
| **Nguyên tắc lọc** | *Bỏ một câu đi mà kiến trúc không đổi ⇒ xoá câu đó* |

---

## 0. CÁCH DÙNG TÀI LIỆU NÀY

### 0.1 Bộ lọc đã áp dụng

Phase 1 và Phase 2 tích lại **48 câu hỏi**. Tôi đã cắt xuống **31**.

**17 câu bị loại** vì trả lời cách nào kiến trúc cũng không đổi — ví dụ *"CEO cần
xem theo ngày hay tuần"* (chuyện giao diện), *"chứng từ đánh số theo quy tắc gì"*
(cấu hình), *"bằng chứng lưu bao lâu"* (chính sách, thêm sau được).

Mỗi câu còn lại đều kèm dòng **"Nếu không có câu trả lời"** — nói rõ cái gì
không thiết kế được. Đó là cách kiểm tra bộ lọc còn đúng hay không.

### 0.2 Chia theo BUỔI, không theo chủ đề

Để tiết kiệm thời gian Board: mỗi buổi **một người trả lời**, họ chỉ đọc phần của
mình.

| Buổi | Người trả lời | Câu | Ước lượng | Mức chặn |
|---|---|---|---|---|
| **1** | CEO / Ban giám đốc | 8 | ~45 phút | 🔴 P0 — chặn nhiều nhất |
| **2** | Merchandiser trưởng | 8 | ~45 phút | 🔴 P0 |
| **3** | Kế toán | 4 | ~25 phút | 🔴 P0 |
| **4** | Kế hoạch + Quản đốc | 4 | ~30 phút | 🟠 P1 |
| **5** | QA trưởng | 3 | ~20 phút | 🟠 P1 |
| **6** | Kho | 2 | ~15 phút | 🟠 P1 |
| **7** | CEO + MD *(chốt cổng đối tác)* | 2 | ~20 phút | 🟡 P2 |

**Buổi 1 và 3 nên làm trước.** Hai buổi đó quyết định có phải xây thêm ba bảng
lớn hay không.

### 0.3 Cách trả lời

Trả lời **ngắn** là đủ. Không cần viết quy trình. Mỗi câu có sẵn **ví dụ đáp án**
— chọn cái gần đúng nhất rồi sửa lại cũng được.

---

# BUỔI 1 · CEO / BAN GIÁM ĐỐC 🔴 P0

---

## Q1 · Phần mềm kế toán — xây hay nối?

**Mục tiêu nghiệp vụ** Xác định MONICA có phải là nơi phát hành hoá đơn hay chỉ là nơi cung cấp dữ liệu.

**Vì sao cần** KB §11 nói *"Monica phát hành hoá đơn, theo dõi công nợ phải thu và phải trả"*. Nhưng nếu công ty đã có phần mềm kế toán, thì xây hoá đơn trong MONICA là **xây trùng** — và trùng thì hai bên số liệu sẽ lệch nhau, phá thẳng tiêu chí KB §15 *"mọi báo cáo khớp cùng một con số"*.

**Câu hỏi** Công ty đang dùng phần mềm kế toán nào? MONICA nên **phát hành** hoá đơn, hay chỉ **gửi dữ liệu** sang phần mềm đó?

**Ví dụ đáp án**
- *"Dùng MISA. MONICA chỉ cần đẩy dữ liệu sang, hoá đơn do MISA xuất."*
- *"Chưa có gì, làm Excel. MONICA phát hành luôn."*
- *"Có phần mềm nhưng không dùng cho gia công, chỉ dùng cho thuế."*

**Tác động nghiệp vụ** Quyết định MONICA có phải là hệ thống ghi nhận doanh thu hay không.

| Ảnh hưởng | Chi tiết |
|---|---|
| Phân hệ | Finance · MD |
| Thực thể CSDL | `invoices` · `payments` — **xây mới hay không xây** |
| Quy trình | Bước ⑬–⑮ của vòng đời đơn hàng |
| Hiến pháp | §11 *(KB)* · §45.7 dữ liệu nghiệp vụ không dịch |

> **Nếu không có câu trả lời:** không thiết kế được khâu thu tiền — khoảng trống lớn nhất hiện nay.

---

## Q2 · Ngưỡng duyệt giá

**Mục tiêu nghiệp vụ** Biết có cần cơ chế phê duyệt hay không, và phê duyệt theo cái gì.

**Vì sao cần** Hiện MD **không có bước duyệt giá nào**. Nếu thực tế có duyệt, đây là quy tắc nghiệp vụ đang thiếu hoàn toàn.

**Câu hỏi** Merchandiser có được tự quyết giá báo cho khách không? Nếu không, ngưỡng nào phải xin duyệt — theo **giá trị đơn**, theo **biên lợi nhuận**, hay theo **khách hàng**?

**Ví dụ đáp án**
- *"MD tự quyết. Chỉ báo lại giám đốc, không cần duyệt trước."*
- *"Biên dưới 12% phải trình giám đốc."*
- *"Đơn trên 50.000 USD phải duyệt bất kể biên bao nhiêu."*
- *"Khách mới phải duyệt, khách quen thì không."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Phân hệ | MD · Executive Center |
| Thực thể | `costings.status` — có cần thêm `approved_by` · `approval_threshold` |
| Quy trình | Chiết tính → báo giá |
| Hiến pháp | Playbook XXX phân quyền theo Assignment |

> **Nếu không có câu trả lời:** không biết có cần dựng cơ chế duyệt hay không. Dựng thừa thì thêm ma sát; thiếu thì mất kiểm soát giá.

---

## Q3 · Ai quyết nhận hay từ chối đơn

**Câu hỏi** Khi khách hỏi hàng, ai quyết định nhận đơn? Tiêu chí là gì — còn chỗ trên chuyền, giá đủ tốt, hay khách quan trọng?

**Ví dụ đáp án**
- *"Giám đốc quyết, dựa vào lịch chuyền còn trống."*
- *"MD tự nhận nếu giá đạt biên tối thiểu."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Phân hệ | MD · Planning |
| Thực thể | `inquiries.status` — `WON`/`LOST` do ai đặt |
| Quy trình | Hỏi hàng → nhận đơn |

> **Nếu không có câu trả lời:** không biết `inquiries` cần bước duyệt hay chỉ cần ghi nhận.

---

## Q4 · Huỷ đơn hàng

**Vì sao cần** Đây là khoảng trống lớn nhất phát hiện được: **hệ thống không có thao tác nào huỷ đơn**. Trạng thái `CANCELLED` tồn tại trong mã nhưng không gì đặt được nó.

**Câu hỏi** Khi khách huỷ đơn đã xác nhận: ai được phép huỷ trong hệ thống, và **NPL đã mua thì xử lý ra sao**?

**Ví dụ đáp án**
- *"Chỉ giám đốc huỷ được. NPL đã mua thì tính vào tồn kho, đòi khách bồi thường."*
- *"MD huỷ được nếu chưa cắt vải. Cắt rồi thì phải trình."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Phân hệ | MD · Warehouse · Finance |
| Thực thể | `orders.status` · **có thể cần** `order_cancellations` |
| Quy trình | Toàn bộ vòng đời — đây là lối thoát duy nhất |
| Hiến pháp | Xoá mềm bắt buộc · chứng từ đã đóng không được `UPDATE` |

> **Nếu không có câu trả lời:** đơn hàng vào hệ thống là **không bao giờ ra được**. Đây là lỗ hổng vòng đời nghiêm trọng nhất.

---

## Q5 · Con số nào bắt buộc phải khớp

**Vì sao cần** KB §15 đặt *"mọi báo cáo đối soát ra cùng một con số"* làm **tiêu chí thành công**. Nhưng chưa ai nói **con số nào**. Đây là ràng buộc kiến trúc, không phải một chỉ số.

**Câu hỏi** Con số nào mà hai phòng khác nhau báo lệch là **không chấp nhận được**?

**Ví dụ đáp án**
- *"Sản lượng ngày. Kho, chuyền và MD phải cùng một số."*
- *"Số lượng đã xuất. Kế toán xuất hoá đơn theo số này."*
- *"Công nợ nhà thầu."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Phân hệ | **Toàn hệ thống** |
| Thực thể | quyết định cần View / hàm SQL tổng hợp dùng chung nào |
| Hiến pháp | §15 KB · nguyên tắc Single Source of Truth |

> **Nếu không có câu trả lời:** không biết phải hợp nhất phép tính nào. Hiện mỗi phân hệ tự tính — chắc chắn sẽ lệch.

---

## Q6 · "Vấn đề nóng" là gì

**Vì sao cần** KB §14 nói CEO cần thấy *"vấn đề nóng"* và *"việc ưu tiên"*. Không định nghĩa được thì không dựng được bảng điều hành, và cũng không biết khi nào hệ thống phải cảnh báo.

**Câu hỏi** Việc gì khiến giám đốc phải can thiệp ngay trong ngày?

**Ví dụ đáp án**
- *"Đơn sắp tới hạn mà sản lượng chưa đạt 70%."*
- *"NPL chưa về mà còn 5 ngày là lên chuyền."*
- *"Mẫu PP bị khách từ chối lần thứ ba."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Phân hệ | Executive Center · MD |
| Thực thể | quyết định quy tắc cảnh báo — liên quan `order_milestones` · `risk_assessments` |
| Quy trình | Cảnh báo sớm |

> **Nếu không có câu trả lời:** bảng điều hành CEO sẽ chỉ là bảng số, đúng thứ KB §14 cấm.

---

## Q7 · Ưu tiên khi hai đơn tranh một chuyền

**Câu hỏi** Hai đơn cùng cần một chuyền trong cùng tuần thì ưu tiên theo gì?

**Ví dụ đáp án**
- *"Theo ngày giao, đơn nào gấp hơn thì trước."*
- *"Theo khách — khách lớn ưu tiên."*
- *"Giám đốc quyết từng trường hợp."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Phân hệ | Planning · MD |
| Thực thể | `production_orders` — có cần trường ưu tiên |
| Quy trình | Hoạch định năng lực |

> **Nếu không có câu trả lời:** không dựng được logic xếp lịch; phải làm tay mãi.

---

## Q8 · Bán sỉ và bán lẻ online

**Vì sao cần** KB §1 xếp hai mảng này là **nghiệp vụ phụ**, nhưng toàn bộ mô hình hiện tại chỉ nói về gia công. Nếu chúng dùng chung `orders` thì mô hình đơn hàng phải khác hẳn.

**Câu hỏi** Hai mảng này có đi qua MD không, hay là hệ thống riêng?

**Ví dụ đáp án**
- *"Chưa làm, để sau."*
- *"Có làm nhưng ít, ghi Excel riêng."*
- *"Dùng chung khách hàng nhưng đơn thì khác loại."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Phân hệ | MD |
| Thực thể | `orders` — có cần phân loại đơn |
| Hiến pháp | KB §1 |

> **Nếu không có câu trả lời:** rủi ro thiết kế mô hình đơn hàng chỉ hợp gia công rồi phải sửa lại.

---

# BUỔI 2 · MERCHANDISER TRƯỞNG 🔴 P0

---

## Q9 · Hợp đồng có phải một chứng từ riêng?

**Vì sao cần** KB §5 nói `Contract → PO → Production`. Hệ thống **không có bảng hợp đồng**. Cần biết đây là thực thể thật hay chỉ là cách nói.

**Câu hỏi** Có ký hợp đồng riêng trước khi nhận PO không? Một hợp đồng dùng cho nhiều PO hay mỗi PO một hợp đồng?

**Ví dụ đáp án**
- *"Có hợp đồng khung theo năm, PO thì rời từng đơn."*
- *"Không có hợp đồng riêng, PO của khách là đủ."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | **`contracts` — xây mới hay không** |
| Quy trình | Bước ⑥ vòng đời |

> **Nếu không có câu trả lời:** không biết có thiếu một thực thể gốc hay không.

---

## Q10 · Vào đơn có bắt buộc qua "Yêu cầu báo giá" không?

**Vì sao cần** ⚠️ **Mâu thuẫn đã phát hiện.** KB §3 nói đơn bắt đầu bằng *Email → Tech Pack → PO*, **không mặc định có RFQ**. Nhưng MD hiện lấy tab "Yêu cầu báo giá" làm cửa vào chính.

**Câu hỏi** Đơn từ khách quen — có phải tạo bản hỏi hàng trước không, hay nhập thẳng PO?

**Ví dụ đáp án**
- *"Khách quen gửi PO thẳng, không qua báo giá."*
- *"Luôn phải có bản chiết tính trước, kể cả khách quen."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `inquiries` bắt buộc hay tuỳ chọn |
| Quy trình | Cửa vào của toàn hệ thống |
| Hiến pháp | KB §3 |

> **Nếu không có câu trả lời:** không biết `inquiries` là bước bắt buộc hay đường tắt.

---

## Q11 · Mẫu có bắt buộc trước chiết tính không?

**Vì sao cần** ⚠️ **Mâu thuẫn đã phát hiện.** KB §4 nói *mẫu vật lý → chiết tính*. Hệ thống hiện không ràng buộc thứ tự này.

**Câu hỏi** Có bao giờ báo giá mà chưa có mẫu vật lý không? Nếu có thì trường hợp nào?

**Ví dụ đáp án**
- *"Có. Mã đơn giản thì chỉ cần tech pack là chiết tính được."*
- *"Không. Luôn phải có mẫu mới tính được định mức vải."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `costings` có cần tham chiếu `sample_submissions` |
| Quy trình | Bước ②→③ |
| Hiến pháp | KB §4 |

> **Nếu không có câu trả lời:** không biết có nên đặt chốt chặn hay không.

---

## Q12 · Một PO giao mấy đợt, mấy nơi?

**Vì sao cần** Quyết định quan hệ giữa đơn hàng và lô hàng là **1-1** hay **1-nhiều**. Đây là quyết định lược đồ khó sửa về sau.

**Câu hỏi** Một PO của khách thường giao một lần hay nhiều đợt? Có giao về nhiều cảng khác nhau không?

**Ví dụ đáp án**
- *"Một PO giao một lần, một cảng."*
- *"Thường tách 2–3 đợt theo màu, cùng một cảng."*
- *"Có khách yêu cầu giao 5 nước khác nhau."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `shipments` ↔ `orders` · có cần `delivery_schedules` |
| Quy trình | Xuất hàng |

> **Nếu không có câu trả lời:** rủi ro dựng mô hình 1-1 rồi phải di trú dữ liệu.

---

## Q13 · Tách và gộp PO

**Câu hỏi** Có bao giờ **tách một PO** thành nhiều đơn sản xuất, hoặc **gộp nhiều PO** thành một lô sản xuất không?

**Ví dụ đáp án**
- *"Có tách khi chia cho nhiều xưởng."*
- *"Có gộp khi cùng một mã hàng, nhiều PO nhỏ."*
- *"Không bao giờ."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | quan hệ `orders` ↔ `production_orders` ↔ `assignments` |
| Quy trình | Phân bổ sản xuất |
| Hiến pháp | KB §8 |

> **Nếu không có câu trả lời:** không biết `production_orders` là 1-1 hay nhiều-nhiều với đơn.

---

## Q14 · Đơn mẫu và đơn loạt

**Câu hỏi** Đơn may mẫu có được ghi nhận như một đơn hàng không, hay chỉ là công việc nội bộ?

**Ví dụ đáp án**
- *"Đơn mẫu có tính tiền, ghi như đơn hàng nhỏ."*
- *"Mẫu miễn phí, không lập đơn."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `orders` có cần phân loại |
| Quy trình | Phát triển mẫu |
| Hiến pháp | KB §7 |

> **Nếu không có câu trả lời:** không biết mẫu và đơn loạt có dùng chung mô hình không.

---

## Q15 · Tech Pack có phiên bản không?

**Câu hỏi** Khách sửa Tech Pack giữa chừng có xảy ra không? Nếu có thì cần giữ bản cũ để đối chiếu không?

**Ví dụ đáp án**
- *"Thường xuyên. Phải giữ bản cũ để cãi khi có tranh chấp."*
- *"Hiếm. Sửa thì thay tệp mới, không cần giữ."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `styles.tech_pack_url` — một cột hay một bảng phiên bản |
| Hiến pháp | Điều 8 Evidence First |

> **Nếu không có câu trả lời:** rủi ro mất bằng chứng khi tranh chấp với khách.

---

## Q16 · Ai chốt sở hữu NPL cho từng đơn?

**Vì sao cần** KB §6 nói sở hữu NPL quyết định **theo từng đơn** — khách cấp, MONICA mua, hoặc hỗn hợp. Hiện `order_type` chỉ được lưu và hiển thị, **không rẽ nhánh quy trình**.

**Câu hỏi** Ai và ở bước nào chốt việc này? Có đơn nào **hỗn hợp** không — ví dụ khách cấp vải, nhà máy mua phụ liệu?

**Ví dụ đáp án**
- *"Chốt lúc báo giá, ghi trong hợp đồng. Hỗn hợp rất phổ biến: khách cấp vải chính, mình mua chỉ và nhãn."*
- *"CMT thì khách cấp hết, FOB thì mình mua hết. Không có hỗn hợp."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `orders.order_type` — đủ hay cần bảng chi tiết theo từng loại NPL |
| Quy trình | Mua NPL · nhận NPL của khách |
| Hiến pháp | KB §6 |

> **Nếu không có câu trả lời:** không rẽ nhánh được quy trình CMT và FOB — khác biệt vận hành lớn nhất giữa hai hình thức.

---

# BUỔI 3 · KẾ TOÁN 🔴 P0

---

## Q17 · Khấu trừ sau giao hàng

**Vì sao cần** KB §11 có công nợ nhưng **không nhắc khấu trừ**. Nếu có khấu trừ thì doanh thu thực thu ≠ giá trị PO, và mô hình tài chính phải phản ánh được.

**Câu hỏi** Khách có trừ tiền vì giao trễ, hàng lỗi hay thiếu số không? Trừ theo quy tắc cố định hay thương lượng từng lần?

**Ví dụ đáp án**
- *"Có. Trễ một tuần trừ 3%, ghi trong hợp đồng."*
- *"Có nhưng thương lượng, không có quy tắc."*
- *"Không, khách không trừ."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | **`chargebacks` — xây hay không** |
| Quy trình | Thu tiền |
| Hiến pháp | KB §11 §15 |

> **Nếu không có câu trả lời:** doanh thu trong hệ thống sẽ luôn cao hơn thực tế.

---

## Q18 · Điều kiện thanh toán

**Câu hỏi** Khách thường thanh toán bằng hình thức nào — LC, TT trả trước, TT trả sau bao nhiêu ngày?

**Ví dụ đáp án**
- *"TT 30% đặt cọc, 70% sau khi giao."*
- *"LC at sight."*
- *"TT 60 ngày sau ngày xuất."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `payments` — cần trường điều kiện, ngày đáo hạn |
| Quy trình | Thu tiền |

> **Nếu không có câu trả lời:** không tính được ngày phải thu, không cảnh báo được nợ quá hạn.

---

## Q19 · Công nợ nhà thầu tính theo gì?

**Vì sao cần** KB §13 nói nhà thầu xem được **công nợ của chính họ**. Cần biết con số đó từ đâu ra.

**Câu hỏi** Trả tiền nhà thầu theo **sản lượng đã nhận**, theo **mốc**, hay theo **hợp đồng khoán**? Có giữ lại phần trăm chờ nghiệm thu không?

**Ví dụ đáp án**
- *"Theo sản lượng đạt, thanh toán hàng tháng, giữ 5% tới khi xuất hàng."*
- *"Khoán trọn gói theo đơn."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `subcon_orders` · công nợ phải trả |
| Quy trình | Cổng nhà thầu |
| Hiến pháp | KB §13 |

> **Nếu không có câu trả lời:** không dựng được số công nợ mà KB bắt buộc phải cho nhà thầu xem.

---

## Q20 · Đơn giá nhà thầu — ai được xem?

**Vì sao cần** ⚠️ Đây là chỗ tôi phát hiện **nghịch lý chưa giải được**. KB §13 nói nhà thầu **được** xem đơn giá của mình. Nhưng lịch sử dự án ghi *"subcon_orders rò rỉ giá"* là lỗi, và migration `031c3` đã siết lại.

**Câu hỏi** Nhà thầu A có được xem đơn giá mà nhà máy trả cho nhà thầu B không? *(giả định: không)* — và họ có xem được **giá bán cho khách** không? *(giả định: không)*

**Ví dụ đáp án**
- *"Chỉ xem giá của chính mình. Không xem nhà thầu khác, không xem giá khách."*
- *"Cùng một cụm công ty thì xem được của nhau."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | policy RLS trên `subcon_orders` |
| Hiến pháp | KB §13 · §12 |

> **Nếu không có câu trả lời:** không biết `031c3` siết đúng mức hay siết quá tay.

---

# BUỔI 4 · KẾ HOẠCH + QUẢN ĐỐC 🟠 P1

---

## Q21 · Đơn vị hoạch định năng lực

**Vì sao cần** Quyết định toàn bộ mô hình Planning. Ba lựa chọn dẫn tới ba lược đồ khác nhau.

**Câu hỏi** Khi nhận thêm một đơn, dựa vào gì để biết còn làm được không — **phút chuyền**, **số chuyền trống**, hay **số công nhân**?

**Ví dụ đáp án**
- *"Theo SAM. Mỗi chuyền 30 người, ngày 8 tiếng, tính ra bao nhiêu phút."*
- *"Theo số chuyền. Có 12 chuyền, mỗi chuyền một mã."*
- *"Ước bằng kinh nghiệm, không tính."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Phân hệ | Planning · Production |
| Thực thể | mô hình năng lực — chưa tồn tại |
| Quy trình | Hoạch định |

> **Nếu không có câu trả lời:** Planning (đang là Beta) không thiết kế được.

---

## Q22 · Lịch T&A lập ngược từ đâu?

**Vì sao cần** Hệ thống đã có `order_milestones` với mẫu theo `order_type`. Cần biết mốc gốc là gì.

**Câu hỏi** Lịch lùi tính từ **ngày xuất xưởng** hay **ngày tàu chạy**? Bao nhiêu mốc là quan trọng?

**Ví dụ đáp án**
- *"Từ ngày tàu chạy lùi lại. Quan trọng nhất: NPL về, lên chuyền, xuống chuyền, kiểm cuối."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `order_milestones` · mẫu T&A |
| Quy trình | Lập lịch |

> **Nếu không có câu trả lời:** mẫu T&A hiện có không kiểm chứng được là đúng hay sai.

---

## Q23 · Điều kiện lên chuyền

**Câu hỏi** Có bắt buộc mẫu PP được duyệt và NPL về đủ mới cho lên chuyền không? Ai được phép cho lên khi chưa đủ?

**Ví dụ đáp án**
- *"Bắt buộc đủ cả hai. Thiếu thì giám đốc mới cho lệnh."*
- *"NPL về 80% là cho lên, vừa làm vừa chờ."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `production_orders.status` — `RELEASED` cần điều kiện gì |
| Quy trình | Bước ⑧ họp tiền sản xuất |

> **Nếu không có câu trả lời:** không biết `RELEASED` có phải là cổng kiểm soát hay chỉ là nhãn.

---

## Q24 · Tiêu chí chọn nhà thầu

**Câu hỏi** Khi thuê ngoài, chọn xưởng theo gì — giá, năng lực còn trống, chất lượng, hay quan hệ?

**Ví dụ đáp án**
- *"Theo năng lực còn trống trước, giá sau."*
- *"Có danh sách xưởng ruột, ưu tiên họ."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `assignments` · hồ sơ năng lực đối tác |
| Quy trình | Phân bổ sản xuất |
| Hiến pháp | KB §8 |

> **Nếu không có câu trả lời:** không biết có cần lưu hồ sơ năng lực nhà thầu hay không.

---

# BUỔI 5 · QA TRƯỞNG 🟠 P1

---

## Q25 · Hai tổ chức QA phân biệt thế nào?

**Vì sao cần** ⚠️ KB §9 nói có **QA nội bộ** và **QA của khách**. KB §12 cấm khách xem *QA nội bộ*. Hệ thống hiện **không phân biệt hai loại** — nghĩa là hoặc khách đang xem nhầm, hoặc chưa ai mở cổng.

**Câu hỏi** Báo cáo QA nội bộ và báo cáo QA của khách là **hai loại chứng từ khác nhau**, hay cùng một loại chỉ khác người ký?

**Ví dụ đáp án**
- *"Khác hẳn. Nội bộ kiểm hàng ngày, khách kiểm cuối một lần, mẫu biểu khác nhau."*
- *"Cùng biểu mẫu, chỉ khác ai kiểm."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `qa_audit_reports` — thêm cột phân loại hay tách bảng |
| Quy trình | Kiểm chất lượng · cổng khách |
| Hiến pháp | KB §9 §12 |

> **Nếu không có câu trả lời:** không mở được cổng QA cho khách mà không rò báo cáo nội bộ.

---

## Q26 · Chặng kiểm nào bắt buộc?

**Câu hỏi** KB nêu bốn chặng: Inline · Pre-Final · Final · Packing. Chặng nào **luôn làm**, chặng nào **tuỳ khách**?

**Ví dụ đáp án**
- *"Inline và Final luôn làm. Pre-Final chỉ khách lớn yêu cầu."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | cấu hình chặng kiểm theo khách |
| Quy trình | Kiểm chất lượng |

> **Nếu không có câu trả lời:** không biết chặng kiểm là cố định hay cấu hình được theo khách.

---

## Q27 · Hàng trượt kiểm cuối

**Câu hỏi** Lô hàng trượt AQL thì làm gì — kiểm lại 100%, thương lượng giảm giá, hay huỷ? Ai quyết?

**Ví dụ đáp án**
- *"Kiểm lại 100%, sửa hàng lỗi rồi kiểm lại. Giám đốc quyết nếu không kịp tàu."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | trạng thái lô hàng · liên kết `chargebacks` |
| Quy trình | Ngoại lệ chất lượng |

> **Nếu không có câu trả lời:** không mô hình hoá được ngoại lệ tốn kém nhất trong sản xuất.

---

# BUỔI 6 · KHO 🟠 P1

---

## Q28 · Nhận NPL do khách cấp

**Vì sao cần** Với đơn CMT — hình thức phổ biến nhất ở Việt Nam — đây là **toàn bộ khâu đầu vào**, và hệ thống hiện **không có gì**.

**Câu hỏi** Khi khách gửi vải tới, kho có phải đối chiếu với định mức và **báo thiếu** cho khách không? Thiếu thì ai chịu?

**Ví dụ đáp án**
- *"Có. Đếm và kiểm 4 điểm, thiếu thì báo khách gửi bù, mình không mua bù."*
- *"Nhận theo phiếu khách gửi, không đối chiếu."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | **`material_receipts` — xây mới** |
| Quy trình | Bước ⑦ với đơn CMT |
| Hiến pháp | KB §6 |

> **Nếu không có câu trả lời:** đơn CMT không có khâu đầu vào trong hệ thống.

---

## Q29 · NPL về trễ

**Câu hỏi** NPL về trễ thì ai được báo, và ai quyết định lùi lịch sản xuất?

**Ví dụ đáp án**
- *"Kho báo MD, MD báo khách và lùi lịch. Trễ quá thì giám đốc quyết."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | `order_milestones` · quy tắc cảnh báo |
| Quy trình | Ngoại lệ NPL |

> **Nếu không có câu trả lời:** không dựng được cảnh báo sớm cho nguyên nhân trễ hàng phổ biến nhất.

---

# BUỔI 7 · CEO + MD · CHỐT CỔNG ĐỐI TÁC 🟡 P2

---

## Q30 · Line Map là gì?

**Vì sao cần** ⚠️ Xuất hiện ở **cả hai cổng** trong KB (§12 và §13) nhưng **không tồn tại** trong toàn bộ mã và CSDL — 0 kết quả. Không định nghĩa được thì không thiết kế được.

**Câu hỏi** Line Map là sơ đồ bố trí chuyền, bảng phân công công đoạn, hay tiến độ theo chuyền? Khách xem nó để làm gì?

**Ví dụ đáp án**
- *"Sơ đồ chuyền đang may đơn của khách, có ảnh chụp, khách xem để yên tâm."*
- *"Bảng phân công công đoạn theo từng vị trí trên chuyền."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | **chưa xác định được** |
| Quy trình | Cổng khách · cổng nhà thầu |
| Hiến pháp | KB §12 §13 |

> **Nếu không có câu trả lời:** một năng lực KB bắt buộc mà không ai biết nó là gì.

---

## Q31 · Nhà thầu và khách có biết về nhau không?

**Vì sao cần** Quyết định hình dạng policy RLS ở cả hai cổng. KB cấm hai chiều nhưng chưa nói cấm tới mức nào.

**Câu hỏi**
- Nhà thầu có được biết **tên khách hàng cuối** của đơn họ đang may không?
- Khách có được biết **đơn của mình đang may ở xưởng nào** không?

**Ví dụ đáp án**
- *"Nhà thầu không biết khách. Khách cũng không biết xưởng nào — đó là bí mật kinh doanh."*
- *"Khách lớn có quyền biết và còn tới kiểm xưởng."*

| Ảnh hưởng | Chi tiết |
|---|---|
| Thực thể | policy RLS trên `orders` · `assignments` · `subcon_orders` |
| Hiến pháp | KB §12 §13 |

> **Nếu không có câu trả lời:** không viết được policy cho hai cổng mà không đoán.

---

## PHỤ LỤC · 17 CÂU ĐÃ LOẠI VÀ LÝ DO

Ghi lại để Board kiểm chứng bộ lọc, và để không ai tưởng bị bỏ sót.

| Câu bị loại | Lý do loại |
|---|---|
| CEO xem theo ngày / tuần / tháng | Giao diện, không đổi lược đồ |
| "Sai sót sản xuất" đo bằng gì | Định nghĩa chỉ số, thêm sau được |
| Chứng từ đánh số theo quy tắc nào | Cấu hình |
| Bằng chứng lưu bao lâu | Chính sách, không đổi mô hình |
| Ai được xoá bằng chứng | Suy được từ Q4 huỷ đơn |
| Có cần xuất Excel / PDF | Tính năng, không đổi kiến trúc |
| Bảng nào cần phân trang | Kỹ thuật, tôi tự quyết được |
| Tỷ trọng CMT / FOB | Thú vị nhưng không đổi lược đồ — Q16 mới đổi |
| Mã hàng dùng lại cho nhiều PO không | Suy được từ lược đồ hiện có |
| Đơn lưu trữ bao lâu | Chính sách |
| Có tích hợp máy chấm công | Ngoài phạm vi MD |
| Có tích hợp hãng tàu | Q1 đã bao quát phần tích hợp quan trọng |
| Nhà thầu báo cáo qua Zalo hay MONICA | Hành vi, không đổi lược đồ |
| Trạng thái nào quay lui được | Suy được từ Q4 |
| `SKIPPED` ai được phép bỏ mốc | Chi tiết phân quyền, sau Q22 |
| Mẫu bị từ chối bao nhiêu lần thì báo | Ngưỡng cảnh báo, sau Q6 |
| KPI báo cho khách | Sau khi có Q5 |

---

## TỔNG KẾT

**31 câu · 7 buổi · ước tính 3 giờ 20 phút của Board.**

**Bốn câu chặn nhiều nhất — nếu chỉ trả lời được bốn câu, hãy chọn:**

| Câu | Quyết định điều gì |
|---|---|
| **Q1** phần mềm kế toán | Có xây `invoices` · `payments` hay không |
| **Q4** huỷ đơn | Lối thoát duy nhất của vòng đời đơn hàng |
| **Q5** con số phải khớp | Tiêu chí thành công quan trọng nhất của KB |
| **Q16** sở hữu NPL | Khác biệt vận hành lớn nhất giữa CMT và FOB |

Mỗi câu trả lời sẽ được ghi thẳng vào Business Knowledge Base kèm trạng thái
`Verified`, và các mục liên quan trong `NEEDS_CLARIFICATION.md` sẽ được đóng lại.
