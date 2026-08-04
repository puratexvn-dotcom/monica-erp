# MD DISCOVERY — PHASE 2
## Khám phá NGHIỆP VỤ · lấy doanh nghiệp làm trung tâm, không lấy mã nguồn

| Trường | Giá trị |
|---|---|
| **Ngày** | 2026-08-04 |
| **Mục tiêu chất lượng** | Một CTO mới đọc xong hiểu được MONICA ONE mà không mở VSCode |
| **Trạng thái thi hành** | 🧊 ĐÓNG BĂNG |
| **Nguồn sự thật** | Knowledge Base v1.0 · Hiến pháp v1.5 · ràng buộc `CHECK` trong CSDL |

---

## ⚠️ 0. MỘT XUNG ĐỘT TRONG CHÍNH ĐỀ BÀI — PHẢI NÓI TRƯỚC

Board yêu cầu hai điều đồng thời:

> *"Hãy khám phá nghiệp vụ, đừng đọc thêm mã."*
> *"Mọi thứ phải dựa trên bằng chứng. Không được suy diễn."*

**Hai yêu cầu này xung khắc nhau ở phần lớn nội dung được đặt hàng.** Lý do:

| Loại tri thức | Sống ở đâu | Tôi tiếp cận được? |
|---|---|---|
| Năng lực · ranh giới · đối tượng nghiệp vụ | Knowledge Base | ✅ |
| Máy trạng thái · vòng đời | Ràng buộc `CHECK` trong CSDL — **đây là quyết định nghiệp vụ đã được mã hoá** | ✅ |
| Quy tắc truy cập | KB §12 §13 | ✅ |
| **Ngoại lệ nghiệp vụ** | Đầu người vận hành · biên bản xử lý sự cố | ❌ |
| **Ma trận quyết định** | Quy chế phê duyệt của công ty | ❌ |
| **KPI** | Ban giám đốc | ❌ |
| **Tích hợp** | Hợp đồng với khách · hệ thống của khách | ❌ |

Bốn mục cuối **không nằm trong kho mã, không nằm trong CSDL, không nằm trong
Knowledge Base**. Chúng nằm trong nhà máy.

**Nếu tôi viết chúng ra, tôi đang suy diễn** — đúng thứ Điều 7 và Working Rule
cấm, và đúng thứ đã làm tôi sai bốn lần ở Phase trước *(RFQ · mẫu trước chiết
tính · nhà cung cấp chỉ định · PO nội bộ)*.

### Cách tôi xử lý

Mỗi mục dưới đây chia làm hai phần:

- **A · ĐÃ BIẾT** — có bằng chứng, gắn nhãn nguồn
- **B · CẦN HỎI** — bộ câu hỏi có cấu trúc để Board hoặc người vận hành trả lời

Một bộ câu hỏi đúng chỗ có giá trị hơn một danh mục bịa. Danh mục ngoại lệ bịa
sẽ **dẫn sai** một CTO mới — nguy hiểm hơn là để trống.

---

## 1. SỨ MỆNH

### A · ĐÃ BIẾT `Verified (Business)` — KB §1

MONICA ONE là **Enterprise Business Operating System cho doanh nghiệp may gia
công**, không phải Fashion ERP / PLM / Retail ERP / Ecommerce.

| Nghiệp vụ | Hình thức |
|---|---|
| **Chính** | Gia công theo hợp đồng — CMT · FOB · OEM · ODM |
| **Phụ** | Bán sỉ · bán lẻ online |

**Vai trò của MD trong sứ mệnh đó:** MD là nơi **vòng đời đơn hàng của khách**
bắt đầu và được điều phối. KB §1 nói sản phẩm khởi đầu từ *Customer Order
Lifecycle*, không phải *Fashion Product Lifecycle* — nghĩa là MD là **cửa vào của
toàn bộ hệ thống**, không phải một phân hệ ngang hàng.

### B · CẦN HỎI

| # | Câu hỏi |
|---|---|
| M1 | Bán sỉ và bán lẻ online có đi qua MD không, hay là kênh riêng? |
| M2 | Tỷ trọng doanh thu giữa CMT · FOB · OEM · ODM? Quyết định năng lực nào ưu tiên |

---

## 2. RANH GIỚI NGHIỆP VỤ

### A · ĐÃ BIẾT `Verified (Business)`

**Bên trong MD** — KB §2–§8: khách hàng · vào đơn · chiết tính · hợp đồng ·
sở hữu NPL · mẫu · phân bổ sản xuất.

**Bên ngoài MD** — KB §9–§11: chất lượng · xuất hàng · tài chính.

**Ranh giới truy cập — đây là ranh giới cứng nhất KB đặt ra:**

| Cổng | ĐƯỢC xem | TUYỆT ĐỐI KHÔNG |
|---|---|---|
| **Khách hàng** (§12) | PO · giao hàng · báo cáo QA · Line Map · tài liệu · dòng thời gian · hoá đơn | thông tin nhà thầu · đơn khách khác · **chiết tính nội bộ** · **biên lợi nhuận** · QA nội bộ · bình luận nội bộ |
| **Nhà thầu** (§13) | PO được giao · tiến độ · báo cáo ngày · Line Map · sản lượng · **đơn giá · thành tiền · công nợ của chính họ** | nhà máy khác · PO khác · thông tin khách hàng |

⚠️ **Ranh giới này là bất đối xứng và đó là điểm tinh tế nhất của mô hình:**
nhà thầu **được** xem giá *của chính họ*, khách hàng **không được** xem giá vốn
*của nhà máy*. Hai vế đều là "giá" nhưng thuộc hai lớp bí mật khác nhau.

### B · CẦN HỎI

| # | Câu hỏi |
|---|---|
| B1 | Nhà thầu có được xem **tên khách hàng cuối** của đơn họ làm không? KB §13 nói "không xem thông tin khách hàng" — vậy họ biết đang may cho ai? |
| B2 | Khách hàng có được xem **nhà máy nào đang sản xuất đơn của họ** không? KB §12 cấm xem "thông tin nhà thầu" |
| B3 | Khi một PO chia cho nhiều nhà thầu, mỗi bên thấy phần của mình — họ có biết còn bên khác không? |

---

## 3. BẢN ĐỒ NĂNG LỰC

### A · ĐÃ BIẾT

| # | Năng lực | Nguồn | Mức bắt buộc |
|---|---|---|---|
| N1 | Quản lý khách hàng | KB §2 | Bắt buộc |
| N2 | Tiếp nhận đơn qua Email + Tech Pack | KB §3 | Bắt buộc |
| N3 | Chiết tính sau khi có mẫu vật lý | KB §4 | Bắt buộc |
| N4 | Quản lý hợp đồng | KB §5 | Bắt buộc |
| N5 | Xác định sở hữu NPL **theo từng đơn** | KB §6 | Bắt buộc |
| N6 | Phát triển mẫu + họp tiền sản xuất | KB §7 | **Năng lực độc lập** |
| N7 | Phân bổ sản xuất nội bộ / thuê ngoài / cả hai | KB §8 | Bắt buộc |
| N8 | QA nội bộ **và** QA của khách | KB §9 | Bắt buộc |
| N9 | Theo dõi xuất hàng | KB §10 | Theo yêu cầu khách |
| N10 | Hoá đơn · công nợ phải thu · phải trả | KB §11 | Bắt buộc |
| N11 | Cổng khách hàng | KB §12 | Bắt buộc |
| N12 | Cổng nhà thầu | KB §13 | Bắt buộc |
| N13 | Bảng điều hành cho CEO | KB §14 | Bắt buộc |
| N14 | Đối soát số liệu toàn hệ thống | KB §15 | **Tiêu chí thành công** |

### B · CẦN HỎI

| # | Câu hỏi |
|---|---|
| N-Q1 | **Line Map** là gì? Xuất hiện ở cả hai cổng (§12 §13) nhưng chưa có định nghĩa. Sơ đồ bố trí chuyền? Phân công công đoạn? Tiến độ theo chuyền? |
| N-Q2 | Năng lực nào **bắt buộc phải có trước khi bán được sản phẩm**, năng lực nào để sau? |
| N-Q3 | Có năng lực nào KB chưa liệt kê mà nhà máy đang làm bằng Excel không? |

---

## 4. QUYỀN SỞ HỮU NGHIỆP VỤ

### A · ĐÃ BIẾT

`Verified (Business)` — KB §14: CEO đăng nhập như mọi người, bảng điều khiển cá
nhân hoá, tập trung vào **sản xuất · doanh thu · chi phí · tiến độ · vấn đề nóng
· việc ưu tiên**, KHÔNG phải bảng dữ liệu thô.

### B · CẦN HỎI — **đây là mục trống nhiều nhất**

KB không nói ai sở hữu quyết định nào. Bảy câu hỏi phải trả lời trước khi thiết
kế bất kỳ luồng phê duyệt nào:

| # | Câu hỏi |
|---|---|
| O1 | **Ai duyệt giá** trước khi báo cho khách? Merchandiser tự quyết hay phải qua Giám đốc? Có ngưỡng giá trị không? |
| O2 | **Ai duyệt biên lợi nhuận tối thiểu**? Dưới mức nào thì phải xin ý kiến? |
| O3 | **Ai quyết định nhận hay từ chối một đơn hàng**? |
| O4 | **Ai duyệt cho lên chuyền** khi mẫu PP chưa được khách duyệt? |
| O5 | **Ai quyết định chọn nhà thầu** cho một đơn? |
| O6 | **Ai duyệt huỷ đơn**, và điều kiện là gì? |
| O7 | Các phòng **Chiết tính · Mua hàng · Kế hoạch** có phải là phòng riêng không, hay Merchandiser kiêm hết? |

---

## 5. ĐỐI TƯỢNG NGHIỆP VỤ

### A · ĐÃ BIẾT

| Đối tượng | Nguồn | Ghi chú |
|---|---|---|
| Khách hàng | KB §2 | **Buyer = Customer**, không có thực thể Buyer riêng |
| Tech Pack | KB §3 | Tài liệu kỹ thuật do khách cấp |
| Hợp đồng | KB §5 | Đứng **trước** PO |
| Purchase Order | KB §5 | **PO = PO của khách** |
| Mẫu | KB §7 | 7 chặng: PROTO · FIT · SIZE_SET · SMS · PP · TOP · SHIPMENT `Verified (Database)` |
| Chiết tính | KB §4 | Có phiên bản, có trạng thái |
| NPL | KB §6 | Sở hữu theo từng đơn |
| Nhà thầu | KB §8 §13 | |
| Báo cáo QA | KB §9 | **Hai loại**: nội bộ và của khách |
| Lô hàng | KB §10 | ETA · booking · container · chứng từ |
| Hoá đơn | KB §11 | |
| Công nợ | KB §11 | Phải thu · phải trả · nợ khách · nợ nhà thầu |
| Line Map | KB §12 §13 | ⚠️ chưa có định nghĩa |

### B · CẦN HỎI

| # | Câu hỏi |
|---|---|
| E1 | **Tech Pack** là một đối tượng có vòng đời riêng (có phiên bản, có duyệt) hay chỉ là tệp đính kèm? |
| E2 | **Hợp đồng** là đối tượng nghiệp vụ riêng hay chỉ là điều khoản trên PO? |
| E3 | Một **mã hàng (style)** dùng lại được cho nhiều PO, hay mỗi PO một mã riêng? |
| E4 | **Đơn mẫu** và **đơn sản xuất loạt** là hai đối tượng khác nhau hay cùng một đối tượng khác trạng thái? |

---

## 6. VÒNG ĐỜI NGHIỆP VỤ

### A · ĐÃ BIẾT `Verified (Business)` — thứ tự do KB quy định

```
①  Email + Tech Pack từ khách          KB §3  ⚠️ KHÔNG mặc định qua RFQ
②  Mẫu vật lý / thông tin kỹ thuật đủ  KB §4
③  Chiết tính                          KB §4  ⚠️ SAU mẫu, không trước
④  (tuỳ chọn) may mẫu
⑤  Báo giá                             KB §4
⑥  Hợp đồng                            KB §5
⑦  Purchase Order của khách            KB §5
⑧  Xác định sở hữu NPL cho đơn này     KB §6
⑨  Phát triển mẫu + họp tiền sản xuất  KB §7
⑩  Phân bổ sản xuất (trong/ngoài/cả hai) KB §8
⑪  Kiểm chất lượng — nội bộ và/hoặc khách KB §9
⑫  Xuất hàng                            KB §10
⑬  Hoá đơn                              KB §11
⑭  Thu tiền · công nợ                   KB §11
```

⚠️ **Hai điểm KB đảo ngược so với hiểu biết thông thường**, và cả hai đều là chỗ
tôi từng suy sai:
- Vào đơn **không** bắt buộc qua RFQ
- Mẫu đi **trước** chiết tính, không phải sau báo giá

### B · CẦN HỎI

| # | Câu hỏi |
|---|---|
| L1 | Bước nào **bắt buộc**, bước nào **bỏ qua được**? Ví dụ khách quen có cần hợp đồng mới cho mỗi đơn? |
| L2 | Đơn **kết thúc** khi nào — xuất hàng, xuất hoá đơn, hay thu đủ tiền? |
| L3 | Đơn **lưu trữ** sau bao lâu? Có bao giờ xoá không? |
| L4 | Một đơn **quay lui** được không — đã vào sản xuất rồi khách đổi ý thì sao? |

---

## 7. DANH MỤC QUY TRÌNH

### A · ĐÃ BIẾT

| Quy trình | Nguồn | Đã rõ tới đâu |
|---|---|---|
| Vào đơn | KB §3 | Rõ điểm bắt đầu, chưa rõ điều kiện chấp nhận |
| Chiết tính → báo giá | KB §4 | Rõ thứ tự, chưa rõ ai duyệt |
| Ký hợp đồng → nhận PO | KB §5 | Rõ thứ tự |
| Xác định sở hữu NPL | KB §6 | Rõ có ba trường hợp, chưa rõ ai quyết |
| Phát triển mẫu | KB §7 | Rõ là năng lực độc lập, có PP Meeting |
| Phân bổ sản xuất | KB §8 | Rõ ba khả năng, chưa rõ tiêu chí chọn |
| Kiểm chất lượng | KB §9 | Rõ hai tổ chức, bốn chặng, **tuỳ khách** |
| Xuất hàng | KB §10 | **Tuỳ yêu cầu khách** |
| Hoá đơn → thu tiền | KB §11 | Rõ có, chưa rõ quy trình |

### B · CẦN HỎI

| # | Câu hỏi |
|---|---|
| W1 | Quy trình **thay đổi đơn hàng** sau khi đã xác nhận: khách đổi số lượng / màu / ngày giao thì đi đường nào? |
| W2 | Quy trình **tách PO** thành nhiều đợt giao — có không, ai quyết? |
| W3 | Quy trình **xử lý mẫu bị từ chối nhiều lần** — bao nhiêu lượt thì báo lên? |
| W4 | Quy trình **NPL về trễ** — ai được biết, ai quyết định lùi lịch? |
| W5 | Quy trình **khách kiểm hàng trượt AQL** — làm lại, giảm giá, hay huỷ? |

---

## 8. MÁY TRẠNG THÁI

### A · ĐÃ BIẾT `Verified (Database)`

Ràng buộc `CHECK` trong CSDL **là quyết định nghiệp vụ đã được mã hoá** — đây là
bằng chứng thật, không phải suy diễn:

| Đối tượng | Trạng thái |
|---|---|
| Hỏi hàng | `NEW → COSTING → QUOTED → WON \| LOST \| CANCELLED` |
| Chiết tính | `DRAFT → SUBMITTED → APPROVED \| REJECTED \| REVISE \| SUPERSEDED` |
| Mã hàng | `DEVELOPMENT → APPROVED → IN_PRODUCTION → DISCONTINUED` |
| Mẫu | `PENDING → SENT → APPROVED \| REJECTED \| APPROVED_WITH_COMMENT` |
| Mốc T&A | `PENDING → IN_PROGRESS → DONE \| LATE \| SKIPPED` |
| Đề nghị NPL | `DRAFT → SUBMITTED → APPROVED → ORDERED → RECEIVED \| REJECTED` |
| Lệnh sản xuất | `PENDING → RELEASED → IN_PROGRESS → COMPLETED \| CANCELLED` |
| Yêu cầu thay đổi | `PENDING → APPROVED \| REJECTED → APPLIED` |

⚠️ **Tám bộ trạng thái độc lập, không bộ nào ánh xạ sang bộ nào.** Không có nơi
nào định nghĩa *phép chuyển nào hợp lệ* — chỉ định nghĩa *giá trị nào hợp lệ*.

### B · CẦN HỎI

| # | Câu hỏi |
|---|---|
| S1 | **Đơn hàng** có máy trạng thái nghiệp vụ nào? Mã dùng 10 chuỗi khác nhau nhưng CSDL không ràng buộc |
| S2 | Chuyển trạng thái nào **cần phê duyệt**, chuyển nào tự động? |
| S3 | Trạng thái nào **quay lui được**? `SUPERSEDED` của chiết tính gợi ý có, cần xác nhận |
| S4 | `SKIPPED` của mốc T&A — ai được phép bỏ qua một mốc, và có cần lý do không? |

---

## 9. MA TRẬN QUYẾT ĐỊNH

### A · ĐÃ BIẾT

Chỉ **một** quyết định được KB quy định rõ — quyết định về **quyền xem**:

| Quyết định | Khách hàng | Nhà thầu | Nội bộ |
|---|---|---|---|
| Xem PO của mình | ✅ | ✅ phần được giao | ✅ |
| Xem đơn giá của mình | ✅ | ✅ | ✅ |
| Xem **giá vốn / biên lợi nhuận** | ❌ | ❌ | ✅ |
| Xem QA nội bộ | ❌ | — | ✅ |
| Xem nhà thầu khác | ❌ | ❌ | ✅ |
| Xem khách khác | ❌ | ❌ | ✅ |

### B · CẦN HỎI — **mục trống nhất của tài liệu**

Mọi quyết định *vận hành* đều chưa có nguồn. Không suy diễn.

| # | Quyết định | Cần biết |
|---|---|---|
| D1 | Nhận hay từ chối đơn | Tiêu chí? Ai quyết? |
| D2 | Giá bán | Ngưỡng nào phải xin duyệt? Biên tối thiểu bao nhiêu? |
| D3 | Làm trong hay thuê ngoài | Tiêu chí phân bổ? |
| D4 | Chọn nhà thầu nào | Theo giá, năng lực, chất lượng, hay lịch sử? |
| D5 | Cho lên chuyền khi thiếu điều kiện | Ai được phép phá quy tắc, ghi nhận thế nào? |
| D6 | Chấp nhận hàng trượt AQL | Ai quyết, hệ quả tài chính? |
| D7 | Huỷ đơn | Điều kiện, ai duyệt, xử lý NPL đã mua? |
| D8 | Ưu tiên khi hai đơn tranh cùng một chuyền | Theo ngày giao, giá trị, hay khách? |

---

## 10. DANH MỤC NGOẠI LỆ

### A · ĐÃ BIẾT

**Không có.** Knowledge Base v1.0 không mô tả một ngoại lệ nghiệp vụ nào.

⚠️ Tôi **cố ý không viết** danh mục này. Ngoại lệ là thứ chỉ người vận hành biết,
và một danh mục ngoại lệ bịa sẽ dẫn sai người đọc nghiêm trọng hơn là để trống.

### B · CẦN HỎI — khung câu hỏi để Board điền

| # | Tình huống | Cần biết |
|---|---|---|
| X1 | NPL về trễ | Ai được báo, lùi lịch thế nào, ai chịu chi phí? |
| X2 | Mẫu bị từ chối quá số lần | Ngưỡng bao nhiêu, leo thang cho ai? |
| X3 | Khách đổi số lượng sau khi đã cắt | Xử lý vải đã cắt, tính lại giá thế nào? |
| X4 | Khách huỷ đơn giữa chừng | Ai chịu NPL đã mua, có phạt không? |
| X5 | Nhà thầu không giao đúng hạn | Chuyển đơn, phạt, hay chấp nhận trễ? |
| X6 | Hàng trượt kiểm cuối | Làm lại, giảm giá, hay huỷ lô? |
| X7 | Tàu trễ / hết chỗ | Ai quyết đổi lịch tàu, chi phí phát sinh về đâu? |
| X8 | Khách không thanh toán đúng hạn | Ngưỡng nào dừng sản xuất đơn tiếp theo? |
| X9 | Thiếu số lượng khi đóng thùng | Giao thiếu, chờ bù, hay huỷ phần thiếu? |
| X10 | Khấu trừ sau giao hàng | Quy tắc tính, ai xác nhận? |

---

## 11. DANH MỤC BẰNG CHỨNG

### A · ĐÃ BIẾT

**Hiến pháp Điều 8 — Evidence First** `Verified (Business)`: mọi hoạt động quan
trọng phải có bằng chứng kèm theo và phải truy vết được.

**Nơi lưu bằng chứng hiện có** `Verified (Database)`:

| Bảng / cột | Dùng cho |
|---|---|
| `attachments` · `cut_attachments` | Tệp đính kèm chung, đính kèm lệnh cắt |
| `md_documents` | Tài liệu của MD |
| `sample_submissions.attachment_url` | Ảnh / tệp mẫu |
| `styles.tech_pack_url` | Tech Pack của khách |
| `evidence_path` · `storage_path` | Đường dẫn tệp trong kho lưu trữ |

### B · CẦN HỎI

| # | Câu hỏi |
|---|---|
| V1 | Hành động nào **bắt buộc** phải có bằng chứng mới được ghi nhận? |
| V2 | Bằng chứng nào khách hàng được xem, bằng chứng nào chỉ nội bộ? KB §12 cấm khách xem "QA nội bộ" |
| V3 | Bằng chứng lưu bao lâu? Có yêu cầu pháp lý hay yêu cầu của khách không? |
| V4 | Ai được **xoá** bằng chứng? Hiến pháp có `deleteDocument` — điều kiện là gì? |

---

## 12. DANH MỤC CHỨNG TỪ

### A · ĐÃ BIẾT

KB §10 nêu **Shipping Documents** nhưng không liệt kê loại. `md_documents` hiện
**không phân loại chứng từ** `Verified (Database)`.

### B · CẦN HỎI

| # | Câu hỏi |
|---|---|
| C1 | Bộ chứng từ xuất khẩu gồm những loại nào? *(hoá đơn thương mại · phiếu đóng gói · vận đơn · C/O · …)* |
| C2 | Chứng từ nào **do MONICA phát hành**, chứng từ nào **nhận từ bên thứ ba**? |
| C3 | Chứng từ nào khách được tải về từ cổng? |
| C4 | Có cần đánh số chứng từ theo quy tắc riêng không? |
| C5 | Tech Pack có phiên bản không — khách sửa Tech Pack giữa chừng thì sao? |

---

## 13. DANH MỤC KPI

### A · ĐÃ BIẾT

**KB §14** — CEO quan tâm: sản xuất · doanh thu · chi phí · tiến độ đơn hàng ·
vấn đề nóng · việc ưu tiên. **Không phải bảng dữ liệu thô.**

**KB §15 — tiêu chí thành công**, và đây là điều quan trọng nhất mục này:

> ① Sai sót sản xuất **giảm**
> ② **Mọi báo cáo đối soát ra cùng một con số**
> ③ Nhất quán quan trọng hơn đẹp mắt

⚠️ ② là một **ràng buộc kiến trúc**, không phải một KPI. Nó nói: không được có
hai nơi cùng tính một con số theo hai cách.

### B · CẦN HỎI

| # | Câu hỏi |
|---|---|
| K1 | "Sai sót sản xuất" đo bằng gì — tỷ lệ lỗi, số lần làm lại, hay chi phí khắc phục? |
| K2 | Con số nào là **con số phải khớp**? Sản lượng? Doanh thu? Tồn kho? |
| K3 | CEO cần thấy chỉ số theo **ngày · tuần · tháng**? |
| K4 | "Vấn đề nóng" định nghĩa thế nào — ai quyết một việc là nóng? |
| K5 | Có KPI nào phải báo cho **khách hàng** không (giao đúng hạn, tỷ lệ đạt AQL)? |

---

## 14. DANH MỤC TÍCH HỢP

### A · ĐÃ BIẾT

**Không có.** Knowledge Base không nhắc tới một tích hợp bên ngoài nào.

`Verified (Architecture)`: hệ thống hiện chỉ phụ thuộc Supabase (xác thực + CSDL
+ lưu trữ tệp). Không tìm thấy tích hợp bên thứ ba nào trong MD.

### B · CẦN HỎI

| # | Câu hỏi |
|---|---|
| I1 | Khách hàng có hệ thống riêng cần nối vào không *(cổng đặt hàng, EDI)*? |
| I2 | Có cần nối với **hãng tàu / forwarder** để lấy trạng thái lô hàng? |
| I3 | Có cần nối với **phần mềm kế toán** đang dùng? |
| I4 | Có cần nối với **máy chấm công / máy quét mã** ở xưởng? |
| I5 | Nhà thầu báo cáo qua MONICA hay qua Zalo/Excel rồi nhập lại? |

---

## 15. MA TRẬN KHOẢNG CÁCH

`Verified` ở cột KB · `Verified (Database)` hoặc `Verified (Architecture)` ở cột
thi hành · **không mục nào đạt `Verified + Implemented`** vì tầng Running
Application chưa ai kiểm.

| Năng lực | KB yêu cầu | Thi hành hiện tại | Khoảng cách |
|---|---|---|---|
| N1 Khách hàng | Buyer = Customer | có `buyer_accounts` riêng | ⚠️ **Mâu thuẫn** |
| N2 Vào đơn | Email → Tech Pack → PO | đi qua tab Yêu cầu báo giá | ⚠️ **Mâu thuẫn** |
| N3 Chiết tính | **sau** mẫu vật lý | không ràng buộc thứ tự | ⚠️ **Mâu thuẫn** |
| N4 Hợp đồng | Contract → PO | **không có bảng hợp đồng** | ❌ **Thiếu** |
| N5 Sở hữu NPL | theo từng đơn | `order_type` rẽ nhánh 1 chỗ | ⚠️ **Một phần** |
| N6 Mẫu | năng lực **độc lập** | có 7 chặng; UI chỉ ở thế hệ cũ | ⚠️ **Một phần** |
| N7 Phân bổ sản xuất | trong / ngoài / cả hai | `assignments` đầy đủ | ✅ **Khớp** |
| N8 QA hai tổ chức | nội bộ + khách | **không phân biệt** | ❌ **Thiếu** |
| N9 Xuất hàng | ETA · booking · container | `shipments` thiếu trường | ⚠️ **Một phần** |
| N10 Hoá đơn · công nợ | đầy đủ | **không có bảng** | ❌ **Thiếu** |
| N11 Cổng khách | 7 mục xem · 6 mục cấm | `buyer_scope_*` có; `costings` **chưa xác minh** | ⏳ **Cần xác minh** |
| N12 Cổng nhà thầu | xem giá của mình | `031c3` thu hẹp; **chưa đo được** | ⏳ **Cần xác minh** |
| N13 CEO dashboard | cá nhân hoá, không bảng thô | có `/giam-doc` | ⏳ chưa đánh giá |
| N14 Đối soát số liệu | **một con số duy nhất** | tính rải rác nhiều nơi | ❌ **Thiếu** |
| Line Map | cả hai cổng | **0 kết quả toàn kho** | ❌ **Thiếu + chưa rõ nghĩa** |

---

## 16. TỔNG KẾT — ĐIỀU MỘT CTO MỚI CẦN BIẾT

**MONICA ONE là hệ điều hành nghiệp vụ cho nhà máy may gia công.** MD là cửa vào:
nơi đơn hàng của khách sinh ra và được điều phối tới mọi phân hệ khác.

**Ba điều đã chắc chắn:**
1. Ranh giới truy cập là **bất đối xứng và cố ý** — nhà thầu xem được giá của
   chính họ, khách hàng không xem được giá vốn của nhà máy.
2. Tám máy trạng thái đã được mã hoá trong CSDL, nhưng **không có nơi nào định
   nghĩa phép chuyển hợp lệ** — chỉ định nghĩa giá trị hợp lệ.
3. Ba năng lực bắt buộc theo KB **chưa tồn tại**: QA hai tổ chức · hoá đơn và
   công nợ · Line Map.

**Ba điều chưa ai biết, và không được đoán:**
1. **Ai quyết định cái gì** — toàn bộ Mục 9 còn trống.
2. **Nhà máy xử lý sự cố ra sao** — toàn bộ Mục 10 còn trống.
3. **Con số nào là con số phải khớp** — tiêu chí thành công quan trọng nhất của
   KB (§15) chưa có định nghĩa vận hành.

⚠️ **Phase 2 không thể hoàn tất bằng cách đọc thêm.** Ba mục trên chỉ có người
vận hành nhà máy trả lời được. Tôi đã dựng sẵn **48 câu hỏi có cấu trúc** trong
tài liệu này; trả lời xong chúng thì Phase 2 mới thực sự đóng lại.
