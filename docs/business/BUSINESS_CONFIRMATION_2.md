# BUSINESS CONFIRMATION #2
## Câu hỏi phát sinh từ bản Target Enterprise Architecture

| Trường | Giá trị |
|---|---|
| **Ngày** | 2026-08-04 |
| **Người hỏi** | Chief Solution Architect |
| **Số câu** | **18** |
| **Thời gian ước tính** | ~60 phút |
| **Quan hệ với BC#1** | 🔴 **BỔ SUNG, KHÔNG THAY THẾ.** [BC#1](BUSINESS_CONFIRMATION_1.md) vẫn phải trả lời |
| **Nguồn** | [TARGET_ARCHITECTURE.md](../architecture/TARGET_ARCHITECTURE.md) + 3 tài liệu Domain |

---

## VÌ SAO CÓ BỘ THỨ HAI

BC#1 hỏi về **nghiệp vụ hiện tại**: Monica đang làm gì.
BC#2 hỏi về **phạm vi kiến trúc**: Monica **có** những năng lực nào để mô hình hoá.

Ba nhóm câu:

| Nhóm | Nội dung | Nếu trả lời "không có" |
|---|---|---|
| **A** | Ranh giới quản trị — Domain, Workspace, thứ bậc văn bản | ⇒ tôi đơn giản hoá kiến trúc |
| **B** | Năng lực nhà máy — IE · SMV · hải quan · thiết bị xưởng | ⇒ **bỏ hẳn 1–2 Domain**, tiết kiệm hàng tháng công |
| **C** | Mô hình dữ liệu khó sửa về sau | ⇒ quyết muộn = di trú dữ liệu |

⚠️ **Câu trả lời "KHÔNG CÓ" ở đây là câu trả lời TỐT.** Nó cắt bớt phạm vi, và
cắt phạm vi sớm rẻ hơn xây rồi bỏ.

---

# NHÓM A — RANH GIỚI QUẢN TRỊ

### `BC2-Q1` · Executive Center là Workspace nhưng **không sở hữu dữ liệu nào**. Board có chấp nhận ghi nó là ngoại lệ hiến định không?

Hiến pháp §5.4 nói *"mỗi Workspace đại diện một Business Domain"*. Executive
Center chỉ **đọc** read-model của các Domain khác — nó không có bảng gốc, không có
thao tác ghi nghiệp vụ.

| | |
|---|---|
| **Hai lựa chọn** | ⓐ Tu chính Điều 18 ghi rõ *"Workspace không có Domain"* · ⓑ Tách hẳn hai khái niệm Workspace ⟷ Domain trong §5.4 |
| **Đề nghị của tôi** | **ⓐ** — thay đổi nhỏ hơn, không đụng cấu trúc Hiến pháp |
| **Chặn** | Cách đánh số Domain và cách viết ADR-012 |

---

### `BC2-Q2` · 🔴 **Bán sỉ · bán lẻ online có dùng CHUNG thực thể `Order` với đơn gia công không?**

| | |
|---|---|
| **Chặn** | `FD-001` · `OQ-008` |
| **Vì sao đây là câu khó sửa nhất bộ này** | Đơn gia công có: khách doanh nghiệp · TechPack · lịch T&A · phân bổ chuyền · shipment container. Đơn bán lẻ có: người mua cá nhân · sản phẩm có sẵn · thanh toán ngay · giao đơn lẻ. **Ép chung một bảng ⇒ 40% cột luôn NULL.** Tách sau ⇒ **di trú dữ liệu thật** |
| **Ba lựa chọn** | ⓐ Chung `Order`, phân biệt bằng `order_channel` · ⓑ Tách hẳn `ManufacturingOrder` ⟷ `SalesOrder` · ⓒ Ngoài phạm vi hoàn toàn, không chừa đường |
| **Đề nghị** | **ⓑ** nếu chắc chắn sẽ làm; **ⓒ** nếu chưa chắc. **ⓐ là lựa chọn tệ nhất** — nó trì hoãn quyết định mà vẫn phải trả giá |

---

### `BC2-Q3` · 🔴 **`Customer` · `Contract` thuộc Commercial hay thuộc MD?**

| | |
|---|---|
| **Mâu thuẫn** | **BKB §B.5** *(bậc 0′)* ghi *"Thuộc MD: khách hàng · … · hợp đồng · … · mẫu"*. **Hiến pháp Điều 19** *(bậc 1)* giao Customer · Contract · Price cho **Commercial** |
| **Vì sao không tự quyết** | `CLAUDE.md` §0 bắt DỪNG khi Nghiệp vụ ⟷ Hiến pháp mâu thuẫn thật |
| **Lời giải tôi đề nghị** | **Cả hai đều đúng, vì nói về hai trục khác nhau.** Domain boundary là ranh giới **kỹ thuật**; ai ngồi làm là **tổ chức**. Merchandiser của Monica được cấp Role trong **cả Commercial lẫn Merchandising**. Domain vẫn tách; con người vẫn là một |
| **Board cần** | Xác nhận hoặc bác lời giải này |

---

### `BC2-Q4` · Trang chủ tăng từ **16 lên 19 thẻ** *(thêm Product Development · Industrial Engineering · Procurement)*. Board chấp nhận không?

| | |
|---|---|
| **Đánh đổi** | 19 thẻ là nhiều cho một màn hình điện thoại 4 cột *(5 hàng)*. **Nhưng gộp lại sẽ tái lập chính vấn đề ranh giới đang sửa** |
| **Ba lựa chọn** | ⓐ 19 thẻ, lọc theo quyền *(trả luôn TD-05)* — thực tế mỗi người chỉ thấy 2–5 thẻ · ⓑ Giữ 16, ba Domain mới là **tab bên trong** Workspace có sẵn · ⓒ Nhóm thẻ theo cụm |
| **Đề nghị** | **ⓐ** — §13.5 đã đòi lọc theo quyền rồi. Lọc xong thì 19 hay 25 không còn là vấn đề |

---

### `BC2-Q5` · Board có muốn mở thêm **Compliance & Social Audit** *(BSCI · WRAP · SEDEX · CoC của khách)* không?

| | |
|---|---|
| **Vì sao hỏi** | Khách lớn ngày càng đòi. Nếu Monica đang phải làm bằng Excel, đây là năng lực có giá trị nhanh |
| **Nếu "chưa"** | Tôi chỉ **chừa đường**: `Document` phải gắn được vào `Factory` và `Party`, không chỉ vào `Order`. Chi phí gần bằng 0 nếu làm ngay, rất đắt nếu làm sau |

---

# NHÓM B — NĂNG LỰC NHÀ MÁY

> **Đây là nhóm quyết định phạm vi lớn nhất.** Mỗi câu "không có" ở đây cắt bớt
> hàng tháng công.

### `BC2-Q6` · 🔴 **Monica có bộ phận IE (Industrial Engineering) không? Có ĐO SMV bằng bấm giờ không?**

| | |
|---|---|
| **Nếu CÓ** | D4 là Core Domain. SMV thành nguồn chân lý duy nhất cho **giá · năng lực · hiệu suất · lương sản phẩm** |
| **Nếu KHÔNG** *(báo giá theo kinh nghiệm)* | 🔴 **Bỏ hẳn Domain D4.** Mô hình năng lực phải dùng đơn vị thô hơn *(chuyền × ngày)*, mất khả năng so sánh mã hàng khó ⟷ dễ. Toàn bộ Phần A của [Manufacturing](../architecture/domains/MANUFACTURING_ARCHITECTURE.md) bỏ đi |
| **Chặn** | D4 tồn tại hay không · cách mô hình hoá D5 · công thức KPI hiệu suất |

---

### `BC2-Q7` · Hiệu suất chuyền khi chạy **mã hàng mới** — ngày đầu đạt bao nhiêu %, mấy ngày lên chuẩn?

| | |
|---|---|
| **Vì sao hỏi** | Đây là **learning curve**. Bỏ qua nó ⇒ năng lực bị tính vống 20–35% ở tuần đầu mỗi mã hàng. Với nhà máy chạy nhiều mã ngắn, sai số này **thường trực** |
| **Cần** | Một con số ước lượng cũng đủ: *"ngày 1 khoảng 50%, khoảng 1 tuần lên 85%"* |
| **Nếu Monica chạy ÍT mã, SỐ LƯỢNG LỚN** | Ảnh hưởng nhỏ hơn nhiều ⇒ đơn giản hoá mô hình |

---

### `BC2-Q8` · 🔴 **Monica có NHẬP KHẨU TRỰC TIẾP nguyên phụ liệu theo loại hình gia công không (tờ khai E31/E21)?**

| | |
|---|---|
| **Nếu CÓ** | Cần toàn bộ module **Bonded Reconciliation** — đối soát nhập ⟷ xuất, cảnh báo hạn thanh khoản. Đây là **khác biệt cạnh tranh số 4** của Monica *(không hệ ERP quốc tế nào có)*, và là **nghĩa vụ pháp lý** |
| **Nếu KHÔNG** *(khách tự nhập rồi giao tận kho)* | 🔴 **Bỏ hẳn §6.6 của [Warehouse](../architecture/domains/WAREHOUSE_ARCHITECTURE.md)** — tiết kiệm đáng kể |
| **Chặn** | `BondedDeclaration` · cột `bonded_declaration_id` rải trong mô hình kho |

---

### `BC2-Q9` · Kho có **quản lý dải màu (shade band / shade group)** của vải không? Đã từng bị khách trả hàng vì lệch màu chưa?

| | |
|---|---|
| **Vì sao hỏi** | Đây là **luật `F1`** trong thiết kế kho: cấm trộn dải màu trong một mã hàng. Nó buộc thuật toán cấp phát phải là *"FIFO **+ ràng buộc dải màu**"*, không phải FIFO thuần |
| **Nếu quản tới cấp LÔ NHUỘM thay vì cấp CUỘN** | Mô hình đơn giản hơn nhiều |
| **Nếu KHÔNG quản** | Bỏ `shade_code` / `shade_group` — nhưng ⚠️ tôi khuyến nghị **vẫn giữ**, vì đây là lỗi tốn kém nhất ngành may và không hệ ERP tổng quát nào chặn |

---

### `BC2-Q10` · Kiểm vải nhập dùng chuẩn nào — **4-point**, 10-point, hay không kiểm theo chuẩn?

| | |
|---|---|
| **Chặn** | Mô hình `MaterialInspection` của D7 · quyết định nhận/trả lô vải |

---

### `BC2-Q11` · 🔴 **Xưởng may có điện thoại / máy tính bảng dùng được không? Có wifi phủ chuyền không?**

| | |
|---|---|
| **Vì sao đây là câu kiến trúc, không phải câu IT** | Nếu công nhân/tổ trưởng ghi tay rồi cuối ngày nhập lại, thì **mọi cảnh báo thời gian thực đều vô nghĩa** — và không nên xây |
| **Nếu CÓ** | Thiết kế **ưu tiên điện thoại, chạy được OFFLINE**, đồng bộ khi có mạng *(bắt buộc `request_id` chống trùng)* |
| **Nếu KHÔNG** | Thiết kế theo lô: nhập cuối ca, chấp nhận độ trễ, bỏ Andon và cảnh báo theo giờ |

---

### `BC2-Q12` · Ghi sản lượng chi tiết tới đâu — **theo bó × công đoạn**, theo chuyền × giờ, hay chỉ tổng theo chuyền × ngày?

| | |
|---|---|
| **Chặn** | 🔴 **Toàn bộ chuỗi truy vết.** Nếu chỉ ghi tổng theo ngày, mắt xích `Bundle → Garment → Carton` **đứt**, và câu *"thùng hàng này làm từ cuộn vải nào"* **không trả lời được** |
| **Vì sao quan trọng** | Truy vết là thứ dùng khi khách khiếu nại — đúng lúc cần nhất |

---

### `BC2-Q13` · Monica **tự mua nguyên phụ liệu** cho bao nhiêu % đơn hàng?

| | |
|---|---|
| **Chặn** | Domain **Procurement** *(D8)* nằm ở P2 hay P3 |
| **Nếu gần như toàn bộ là CMT khách cấp NPL** | D8 thu nhỏ còn mua phụ liệu lặt vặt ⇒ **hạ xuống P3** |
| **Nếu FOB chiếm tỷ trọng lớn** | D8 là Domain thật, cần Supplier Master · PO mua · **đối chiếu 3 chiều** · công nợ phải trả |

---

### `BC2-Q14` · Có nhà cung cấp nào **đồng thời là nhà thầu phụ** không? *(vừa bán vải vừa nhận may gia công)*

| | |
|---|---|
| **Chặn** | Kernel **`Party`** *(S1)* — có đáng dựng không |
| **Vì sao hỏi** | Hôm nay `suppliers` và `subcontractors` là **hai bảng rời**. Nếu cùng một pháp nhân xuất hiện ở cả hai, họ có **hai mã, hai sổ công nợ, không đối soát được** — lỗi mô hình cổ điển |
| **Nếu KHÔNG BAO GIỜ trùng** | Kernel `Party` là kỹ thuật thừa, bỏ |

---

# NHÓM C — MÔ HÌNH DỮ LIỆU KHÓ SỬA VỀ SAU

### `BC2-Q15` · 🔴 **Khách hàng có duyệt mẫu / duyệt TechPack / duyệt xuất hàng TRONG hệ thống không, hay qua email?**

| | |
|---|---|
| **Chặn** | Toàn bộ phạm vi **Customer Portal** |
| **Nếu duyệt trong hệ thống** | Portal có quyền GHI *(duyệt · từ chối · bình luận)*, cần luồng duyệt, cần thông báo, cần bằng chứng chữ ký số |
| **Nếu qua email** | Portal thu hẹp còn **chỉ đọc** — nhỏ hơn nhiều. Nhưng mất Điều 8 *Evidence First* ở đúng chỗ tranh chấp hay xảy ra nhất |

---

### `BC2-Q16` · Vải/phụ liệu **dư sau khi cắt** có được trả về kho không, hay để lại chuyền?

| | |
|---|---|
| **Chặn** | `WH-R11` · KPI `M-WH-04` **Tỷ lệ hao hụt thật** |
| **Vì sao quan trọng** | Nếu phần dư **không** quay lại sổ, hệ thống báo tiêu thụ 100% định mức trong khi thực tế còn hàng ⇒ **hao hụt thật không bao giờ đo được**, và hao hụt là con số quyết định giá vốn CMT *(vải chiếm 60–70%)* |

---

### `BC2-Q17` · Một **`Style`** có được dùng lại cho **nhiều PO / nhiều mùa** không, hay mỗi PO một style mới?

| | |
|---|---|
| **Chặn** | Quan hệ `Style ↔ Order` là **1-nhiều** hay **1-1** |
| **Vì sao quan trọng** | Nếu 1-1, `Style` không đáng là aggregate riêng và **Domain D3 Product Development thu nhỏ đáng kể**. Nếu 1-nhiều, `Style` phải có phiên bản và vòng đời độc lập với đơn hàng |

---

### `BC2-Q18` · **Nhà thầu phụ có ghi sản lượng chi tiết như chuyền nội bộ không, hay chỉ báo tổng theo ngày?**

| | |
|---|---|
| **Chặn** | `PR-R07` — *"nhà thầu ghi qua CÙNG một mô hình với chuyền nội bộ"* |
| **Vì sao quan trọng** | Nếu họ chỉ báo tổng, **số liệu nội bộ và số liệu thuê ngoài không so sánh được** ⇒ không có bức tranh sản xuất thống nhất, và `BR-RPT-001` không đạt được ở phần sản xuất |
| **Liên quan** | `BR-ACC-006` — Board đã nói nhà thầu **BẮT BUỘC GHI**. Câu này hỏi **ghi tới mức chi tiết nào** |

---

## ⭐ NĂM CÂU CẮT PHẠM VI NHIỀU NHẤT

Nếu Board chỉ trả lời năm câu, chọn năm câu này — mỗi câu "không" cắt bớt **hàng
tuần tới hàng tháng** công việc:

| Ưu tiên | Câu | Nếu "không có" thì bỏ được gì |
|---|---|---|
| 1 | **`BC2-Q6`** IE · SMV | 🔴 **Bỏ hẳn Domain D4** |
| 2 | **`BC2-Q8`** Nhập khẩu gia công | 🔴 **Bỏ hẳn module Bonded** |
| 3 | **`BC2-Q13`** Tự mua NPL | 🔴 **Hạ Domain D8 xuống P3** |
| 4 | **`BC2-Q11`** Thiết bị xưởng | 🔴 **Bỏ toàn bộ thời-gian-thực ở D6** |
| 5 | **`BC2-Q2`** Bán lẻ dùng chung `Order` | 🔴 **Tránh một cuộc di trú dữ liệu** |

---

## THAM CHIẾU

- [TARGET_ARCHITECTURE.md](../architecture/TARGET_ARCHITECTURE.md) — §1.2 · §4 · §11 · Phụ lục *"chỗ tôi có thể sai"*
- [MERCHANDISING_ARCHITECTURE.md](../architecture/domains/MERCHANDISING_ARCHITECTURE.md) §3.3 · §18
- [WAREHOUSE_ARCHITECTURE.md](../architecture/domains/WAREHOUSE_ARCHITECTURE.md) §2 · §6.6 · §15
- [MANUFACTURING_ARCHITECTURE.md](../architecture/domains/MANUFACTURING_ARCHITECTURE.md) §A · §E
- [BUSINESS_CONFIRMATION_1.md](BUSINESS_CONFIRMATION_1.md) — 🔴 **vẫn phải trả lời, bộ này không thay thế**
