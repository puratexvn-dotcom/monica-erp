# EDD-04E · TU CHÍNH E
## NGUYÊN TẮC KHÔNG NHẬP TAY
### Hình thức hoá · Cơ chế cưỡng chế · Rà soát thiết kế đã có

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-04E · Tu chính xuyên suốt |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Nguồn thẩm quyền** | 🔴 **Board Additional Direction — ZERO MANUAL PRINCIPLE** · *"Đây sẽ là một trong những DNA của Monica ONE"* |
| **Board Decision Required** | **0** |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §1 · HÌNH THỨC HOÁ

## 1.1 Phát biểu

> ### 🔴 `P-ZEROMAN` · NGUYÊN TẮC KHÔNG NHẬP TAY
>
> Trước khi thiết kế bất kỳ trường dữ liệu nào, phải trả lời:
> **"Làm thế nào để người dùng KHÔNG phải nhập dữ liệu này?"**
>
> ```
> ① TỰ ĐỘNG LẤY   hệ thống đã biết, hoặc suy được
> ② QUÉT QR/MÃ VẠCH
> ③ CAMERA
> ④ AI VISION
> ⑤ OCR
> ⑥ IMPORT
> ⑦ VOICE
> ⑧ ── nhập tay ── chỉ khi bảy cách trên đều ⛔ không dùng được
> ```
>
> **Monica ONE giảm tối đa thao tác nhập liệu. ⛔ Không tăng thêm màn hình nhập liệu.**

## 1.2 🔴 Ranh giới bắt buộc — nguyên tắc này áp cho SỰ KIỆN, ⛔ không áp cho QUYẾT ĐỊNH

```
🟢 SỰ KIỆN / QUAN SÁT — "điều này ĐÃ xảy ra"
   sản lượng · số lượng nhận · thời gian dừng · số đo · mã cuộn · số lượng thùng
   ▶ 🔴 ÁP P-ZEROMAN TỐI ĐA — mục tiêu là KHÔNG NHẬP TAY

🔴 QUYẾT ĐỊNH / CAM KẾT — "tôi ĐỒNG Ý điều này"
   chấp nhận Assignment · duyệt giá · kết luận lô AQL · huỷ đơn · duyệt chi
   ▶ ⛔ ⛔ KHÔNG ÁP P-ZEROMAN
   ▶ Con người PHẢI hành động có chủ ý — DL-112 ma sát có chủ ý
```

> `DL-124` · **`P-ZEROMAN` áp cho SỰ KIỆN; `DL-112` *(ma sát có chủ ý)* áp cho QUYẾT ĐỊNH.**
>
> ⚠️ Ranh giới này bắt buộc phải nói rõ, nếu ⛔ không sẽ có người *"tối ưu"* việc chấp nhận một Assignment 8.804 USD thành một chạm tự động — và đó là **phá vỡ mô hình cam kết**, ⛔ không phải tuân thủ nguyên tắc.
>
> Nhất quán hoàn toàn với `DL-089` *(quan sát ghi ngoại tuyến · cam kết bắt buộc trực tuyến)*. **Ba nguyên tắc cùng vẽ một đường: sự kiện thì tự động và nhanh; cam kết thì có chủ ý và chậm.**

## 1.3 🔴 Bổ sung thứ tự ưu tiên cho trường TỰ SỰ

Thứ tự Joseph đưa ra **đúng cho dữ liệu CÓ CẤU TRÚC** *(số lượng · mã · ngày)*. Với trường **tự sự** *(mô tả sự cố · nhận xét mẫu · nguyên nhân lỗi)*, thứ tự khác:

| Loại dữ liệu | Thứ tự ưu tiên |
|---|---|
| **Có cấu trúc** *(số · mã · ngày · chọn từ danh sách)* | ① tự động → ② QR → ③ camera → ④ AI Vision → ⑤ OCR → ⑥ import → ⑦ voice → ⑧ tay |
| 🆕 **Tự sự** *(mô tả · nhận xét · nguyên nhân)* | 🔴 **① VOICE** → ② chọn mẫu câu có sẵn → ③ ảnh kèm chú thích ngắn → ④ gõ |

> `DL-125` · **Với trường tự sự, VOICE là lựa chọn đầu tiên, ⛔ không phải cuối cùng.**
> Gõ một đoạn mô tả sự cố trên điện thoại ở chuyền may là ~20–40 chạm. Giữ nút và nói là **một** thao tác — và giữ được ngữ điệu, mức khẩn cấp, chi tiết mà người ta ⛔ không buồn gõ. Đây chính là điều `EDD-04C §5.1` đã đo được ở tác vụ *"gửi yêu cầu"*.

## 1.4 🔴 Thu nhận ⛔ KHÔNG PHẢI là dữ liệu — mô hình đề xuất-xác nhận

Bậc ③–⑦ *(camera · AI Vision · OCR · import · voice)* **⛔ không tạo ra sự thật. Chúng tạo ra ĐỀ XUẤT.**

```
Nguồn thu nhận  ──▶  ĐỀ XUẤT (có độ tin cậy)  ──▶  người XÁC NHẬN  ──▶  DỮ LIỆU
       │                                                                    │
       └──────────── giữ NGUYÊN BẢN gốc, băm tại nguồn ────────────────────┘

ExtractedValue
├─ source_artifact_id   🔴 ảnh/tệp GỐC luôn giữ, ⛔ không xoá sau khi trích
├─ extracted_value · confidence · extraction_method · model_version
├─ 🔴 confirmed_value · confirmed_by · confirmed_at
└─ 🔴 was_corrected: bool   ← dữ liệu vàng để cải thiện độ chính xác
```

**Ba luật:**

| # | Luật | Vì sao |
|---|---|---|
| `ZM-1` | 🔴 **Trích xuất luôn giữ NGUYÊN BẢN** | `DL-091` — bằng chứng nằm ở ảnh gốc, ⛔ không ở con số trích ra |
| `ZM-2` | 🔴 **Độ tin cậy < ngưỡng ⇒ hiện nổi bật để người kiểm** — ⛔ không im lặng chấp nhận | Nhất quán `AI-3`: AI điền biểu mẫu, **người bấm lưu** |
| `ZM-3` | 🔴 **`was_corrected` là vòng phản hồi bắt buộc** | ⛔ Không có nó thì mô hình trích xuất ⛔ không bao giờ khá lên |

## 1.5 🔴 Bậc ① có một cạm bẫy phải nói rõ

**Tự động lấy dữ liệu là bậc cao nhất — và là bậc DUY NHẤT ⛔ không có người kiểm.**

```
Bậc ②–⑦: máy đề xuất → 🔴 NGƯỜI XÁC NHẬN → dữ liệu    ← có chốt chặn
Bậc ①:    máy suy ra  → dữ liệu                        ← ⛔ KHÔNG có chốt chặn
```

> `DL-126` · **Giá trị tự động suy ra mà đi vào TIỀN hoặc CAM KẾT phải có cổng xác nhận; suy ra để THAM CHIẾU hoặc HIỂN THỊ thì ⛔ không cần.**
>
> | Ví dụ | Cổng |
> |---|---|
> | Năng lực tuần-chuyền *(hiển thị)* | ⛔ không cần |
> | % hoàn thành *(hiển thị)* | ⛔ không cần |
> | 🔴 **Chi phí công suy từ `StandardTime` vào chiết tính** | ✅ **cần** — nó thành giá bán |
> | 🔴 **Sản lượng suy từ số bó đã quét** | ✅ **cần** — nó thành lương và thành công nợ nhà thầu |
> | 🔴 **Số lượng nhận suy từ packing list** | ✅ **cần** — nó thành nghĩa vụ với khách |
>
> Tự động hoá ⛔ không có chốt chặn là cách dữ liệu sai đi vào hệ thống **im lặng** — và im lặng là thứ tệ nhất, vì ⛔ không ai đi tìm.

## 1.6 Cơ chế cưỡng chế — `data_origin` là trường hạng nhất

```
🔴 MỌI trường dữ liệu nghiệp vụ mang:

data_origin: DERIVED | SCANNED | CAPTURED | AI_EXTRACTED
           | OCR | IMPORTED | VOICE | MANUAL
```

**Ba tác dụng:**

| # | Tác dụng | Chi tiết |
|---|---|---|
| 1 | 🔴 **Sức nặng bằng chứng** | `SCANNED` mạnh hơn `MANUAL`. *"Quét mã bó lúc 14:02"* ⟷ *"ai đó gõ 128"* — hai mức chứng cứ khác nhau. Cùng họ với `capture_source` *(`DL-110`)* |
| 2 | 🔴 **Chỉ số sản phẩm** | `manual_entry_ratio` = % trường `MANUAL` trên tổng trường đã ghi |
| 3 | **Chẩn đoán** | Trường nào bị gõ tay nhiều nhất ⇒ **danh sách việc phải tự động hoá tiếp** |

> `DL-127` · **`manual_entry_ratio` là chỉ số sản phẩm được giám sát, cùng hạng với `tap_count_p90`.**
> Mỗi bản phát hành phải **giảm** hoặc **giữ nguyên** tỷ lệ này. Tăng ⇒ có một màn hình nhập liệu mới đã lọt vào — đúng thứ Joseph cấm.
> Nguyên tắc ⛔ không đo được là nguyên tắc sẽ trôi — cùng lập luận `DL-111`.

---
---

# §2 · 🔴 RÀ SOÁT THIẾT KẾ ĐÃ CÓ

Board áp `P-ZEROMAN` *"từ EDD-05 trở đi"*. Nhưng EDD-01…04D đã thiết kế nhiều luồng nhập liệu. Tôi rà lại và **tìm ra chín chỗ vi phạm** — trong đó **một chỗ là lỗi thiết kế của chính tôi**.

## 2.1 🔴 `ZM-GAP-1` · BÁO CÁO NGÀY CỦA NHÀ THẦU — lỗi thiết kế của tôi

```
❌ TÔI ĐÃ THIẾT KẾ:
   EDD-04C màn hình chính: "🔴 CHƯA NỘP BÁO CÁO 03/08 → [ NHẬP NGAY ]"
   ▶ Nhà thầu đã nhập sản lượng theo GIỜ suốt cả ngày
   ▶ Rồi cuối ngày lại phải NHẬP LẠI báo cáo ngày
   ▶ 🔴 NHẬP HAI LẦN CÙNG MỘT DỮ LIỆU

✅ ĐÚNG:
   Báo cáo ngày = 🔴 TỰ ĐỘNG DỰNG từ StageThroughput đã ghi
   ▶ Nhà thầu chỉ XEM LẠI và XÁC NHẬN
   ▶ Sửa được nếu sai, nhưng mặc định ⛔ KHÔNG PHẢI NHẬP GÌ
   ▶ Nhập tay chỉ còn: phần tự sự (nhận xét trong ngày) → VOICE
```

> `DL-128` · **Báo cáo ngày là BẢN TỔNG HỢP TỰ ĐỘNG cần XÁC NHẬN, ⛔ không phải một biểu mẫu nhập liệu.**
> Nút đổi từ `[ NHẬP NGAY ]` thành `[ XEM VÀ XÁC NHẬN ]`. Đây là ca `P-ZEROMAN` rõ nhất trong toàn bộ thiết kế, và tôi đã bỏ lỡ nó.
>
> ⚠️ Xác nhận vẫn là **CAM KẾT** *(`DL-089`)* ⇒ cần trực tuyến, cần chủ ý. **Zero Manual bỏ việc NHẬP, ⛔ không bỏ việc XÁC NHẬN.**

## 2.2 Tám chỗ còn lại

| # | Chỗ | Hiện tại | 🔴 Thay bằng | Bậc |
|---|---|---|---|---|
| `ZM-GAP-2` | **Sản lượng theo giờ** | nút ± có đoán trước | 🔴 **Quét mã bó khi hoàn thành công đoạn** ⇒ sản lượng **tự cộng**. Nút ± chỉ còn là đường dự phòng | ② |
| `ZM-GAP-3` | **Xác nhận nhận NPL** | xác nhận thủ công | 🔴 **Quét mã vạch cuộn / mã QR phiếu giao** ⇒ số lượng tự điền, người xác nhận lệch | ② |
| `ZM-GAP-4` | **Dữ liệu cuộn vải** *(dài · khổ · dải màu)* | nhập tay khi nhận | ⚠️ **Mã vạch NCC nếu đọc được** → ⑤ **OCR nhãn cuộn** → ⑧ tay. Dài **đo thực** vẫn phải nhập *(⛔ không tự động được)* | ② → ⑤ |
| `ZM-GAP-5` | **Thời gian dừng chuyền** | nhập từ–đến | 🔴 **Nút Andon**: bấm bắt đầu / bấm kết thúc ⇒ thời lượng **suy ra**. Chỉ chọn **lý do** *(một chạm từ bảng mã)* | ① + ② |
| `ZM-GAP-6` | **Tech Pack · bảng thông số đo** | ⚠️ **chưa thiết kế nhập** | 🔴 **AI Vision + OCR** trích từ PDF/Excel khách gửi ⇒ đề xuất bảng điểm đo, người xác nhận. **Đây là gánh nhập liệu lớn nhất của MD** | ④ + ⑤ |
| `ZM-GAP-7` | **PO của khách** | ⚠️ chưa thiết kế nhập | 🔴 **OCR + AI trích** từ PDF/email ⇒ đề xuất khách · mã hàng · số lượng · size ratio · ngày giao, người xác nhận | ⑤ |
| `ZM-GAP-8` | **Chiết tính** | nhập tay từng dòng | 🔴 **Suy tự động**: NPL từ `BOM` × giá `SupplierMaterial` · công từ `StandardTime` × đơn giá phút. **Nhập tay chỉ còn: tỷ lệ lãi và chi phí bất thường** | ① |
| `ZM-GAP-9` | **Packing list** | ⚠️ chưa thiết kế | 🔴 **Suy từ thùng đã quét** ⇒ tự dựng. Người chỉ xác nhận | ① + ② |

## 2.3 Ba chỗ ⛔ KHÔNG tự động hoá được — nói thật

| Chỗ | Vì sao ⛔ không | Giảm được gì |
|---|---|---|
| 🔴 **Kết luận lô AQL** | **QUYẾT ĐỊNH** *(`DL-124`)* — người phải chịu trách nhiệm | Hệ thống tính sẵn Ac/Re và đề xuất; người **kết luận** |
| 🔴 **Chấp nhận Assignment** | **CAM KẾT** — ma sát có chủ ý `DL-112` | ⛔ Không giảm — và ⛔ **không nên** giảm |
| **Đo dài thực của cuộn vải** | Hành động vật lý, ⛔ không có nguồn dữ liệu nào khác | Nhập một số, bàn phím số lớn, so ngay với dài hoá đơn |

## 2.4 Tổng kết rà soát

| | Số |
|---|---|
| Chỗ vi phạm phát hiện | **9** |
| Trong đó **lỗi thiết kế của chính tôi** | **1** — `ZM-GAP-1` |
| Chỗ ⛔ không tự động hoá được, đã ghi rõ lý do | **3** |
| Bậc chủ đạo | ② **QR/mã vạch** — 5 chỗ · ① **tự động suy** — 3 chỗ |

> 🔴 **Bậc ② QR/mã vạch giải quyết được nhiều nhất.** Điều đó khớp với năng lực Monica đã có *(theo dõi tới bó × công đoạn × giờ)*: **hạ tầng dữ liệu đã sẵn, chỉ thiếu MÃ trên vật thể.**

---

# §3 · ⚠️ CẦN BOARD BIẾT — điều kiện vận hành của bậc ②

Năm trong chín chỗ dựa vào **quét mã**. Điều đó đòi một tiền đề vật lý mà Monica cần chuẩn bị:

| Vật thể | Mã | Ai in | Ghi chú |
|---|---|---|---|
| **Thẻ bó** | QR | Monica, tại tổ cắt | 🔴 **Quan trọng nhất** — mở khoá `ZM-GAP-2`. Thẻ bó đã tồn tại dạng giấy, chỉ thêm QR |
| **Cuộn vải** | mã vạch | ⚠️ **NCC nếu có** · ⛔ không thì Monica dán khi nhận | `DL-129` dưới |
| **Thùng** | QR | Monica, tại đóng gói | Mở khoá `ZM-GAP-9` |
| **Chuyền** | QR dán cố định | Monica, một lần | Chấm ca · mở màn hình chuyền |

> `DL-129` · **Đọc mã của NCC nếu nhận dạng được; ⛔ không thì in nhãn nội bộ ngay tại bước nhận.**
> Ép mọi NCC theo một chuẩn nhãn là ⛔ không khả thi. Ép Monica dán lại mọi cuộn là lãng phí. Làm cả hai: hệ thống học dần **khuôn mã của từng NCC** *(`SupplierBarcodeFormat` là dữ liệu chủ)*, cuộn nào ⛔ không đọc được thì in nhãn nội bộ.

**Chi phí:** một máy in nhãn ở tổ cắt · một ở kho · một ở đóng gói. Điện thoại đã có camera quét.
**Đổi lại:** năm luồng nhập liệu biến mất, và **chuỗi truy vết cuộn→bó→thùng khép kín** — thứ `EDD-02 §5.4` đòi mà chưa có cách thi hành.

---

# §4 · DECISION LOG — 6 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-124` | 🔴 **`P-ZEROMAN` áp cho SỰ KIỆN; ⛔ KHÔNG áp cho QUYẾT ĐỊNH/CAM KẾT** | ⛔ Không nói rõ thì có người *"tối ưu"* việc chấp nhận đơn 8.804 USD thành một chạm | 🔴 rất khó |
| `DL-125` | **Trường TỰ SỰ: VOICE là lựa chọn ĐẦU TIÊN**, ⛔ không phải cuối | Gõ mô tả sự cố trên điện thoại ở chuyền = 20–40 chạm; giữ nút và nói = 1 thao tác | ✅ |
| `DL-126` | 🔴 **Giá trị tự động suy ra đi vào TIỀN hoặc CAM KẾT phải có cổng xác nhận** | Bậc ① là bậc **duy nhất ⛔ không có người kiểm** — dữ liệu sai vào **im lặng** | ⚠️ |
| `DL-127` | **`data_origin` là trường hạng nhất · `manual_entry_ratio` là chỉ số giám sát** | Mỗi bản phát hành phải giảm hoặc giữ. Tăng ⇒ có màn hình nhập liệu mới lọt vào | ✅ |
| `DL-128` | 🔴 **Báo cáo ngày = bản tổng hợp TỰ ĐỘNG cần XÁC NHẬN**, ⛔ không phải biểu mẫu nhập | **Sửa lỗi thiết kế của chính tôi** ở EDD-04C — nhà thầu đang phải nhập hai lần cùng một dữ liệu | ✅ |
| `DL-129` | **Đọc mã NCC nếu nhận dạng được; ⛔ không thì in nhãn nội bộ khi nhận** | Ép NCC theo chuẩn ⛔ không khả thi; dán lại mọi cuộn là lãng phí | ✅ |

**Cộng dồn EDD-01 → 04E: 129 quyết định.**

🔴 **Ba nguyên tắc thiết kế xuyên suốt nay đã đủ bộ:**

| Nguyên tắc | Nội dung | Nguồn |
|---|---|---|
| `P-IRREV` | Dữ liệu đã tiết lộ ⛔ không thu hồi được ⇒ **phòng ngừa là cơ chế duy nhất** | `BDR-25` |
| `P-ZEROMAN` | ⛔ Không bắt người dùng nhập thứ hệ thống lấy được ⇒ **giảm màn hình nhập liệu** | Board Additional Direction |
| `P-COMMIT` | 🆕 Sự kiện thì tự động và nhanh; **cam kết thì có chủ ý và chậm** | `DL-089` · `DL-112` · `DL-124` — tôi đề nghị ghi nhận chính thức |

> ⚠️ **`P-COMMIT` tôi đề nghị ghi nhận thành nguyên tắc thứ ba.** Nó đã xuất hiện ba lần dưới ba dạng khác nhau *(ngoại tuyến · số chạm · nhập liệu)* và mỗi lần nó là thứ ngăn một tối ưu hoá sai. Đặt tên cho nó giúp lần sau ⛔ không phải suy lại.

---

# §5 · TÓM TẮT

## 5.1 Ba điểm đáng nhớ nhất

| # | Điểm |
|---|---|
| **1** | 🔴 **`P-ZEROMAN` áp cho SỰ KIỆN, ⛔ không áp cho QUYẾT ĐỊNH.** Ranh giới này bắt buộc — nếu ⛔ không, sẽ có người *"tối ưu"* việc chấp nhận một Assignment 8.804 USD thành một chạm tự động. Ba nguyên tắc *(ngoại tuyến · ba chạm · không nhập tay)* cùng vẽ **một đường duy nhất**: sự kiện thì tự động và nhanh, cam kết thì có chủ ý và chậm |
| **2** | 🔴 **Tôi tìm ra một lỗi thiết kế của chính mình.** EDD-04C bắt nhà thầu nhập sản lượng theo giờ suốt ngày, **rồi cuối ngày nhập lại báo cáo ngày** — nhập hai lần cùng một dữ liệu. Báo cáo ngày phải là **bản tổng hợp tự động cần xác nhận**. Đây là ca `P-ZEROMAN` rõ nhất trong toàn bộ thiết kế và tôi đã bỏ lỡ |
| **3** | 🔴 **Bậc ① *(tự động suy)* là bậc cao nhất VÀ là bậc duy nhất ⛔ không có người kiểm.** Bậc ②–⑦ đều có bước người xác nhận. Vì vậy giá trị suy ra đi vào **tiền** hoặc **cam kết** phải có cổng — tự động hoá ⛔ không chốt chặn là cách dữ liệu sai vào hệ thống **im lặng**, và im lặng là tệ nhất vì ⛔ không ai đi tìm |

## 5.2 Trạng thái

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

**Tiếp theo:** EDD-05 — Phase 11 Workspace · Work Inbox · Dashboard · Executive Center · Phase 12 Module Architecture, **thiết kế dưới cả ba nguyên tắc xuyên suốt**.

---

## THAM CHIẾU

- **Board Additional Direction** — ZERO MANUAL PRINCIPLE
- [EDD-04C](EDD-04C-SUBCONTRACT-PORTAL-RUNTIME.md) — `DL-112` ma sát có chủ ý · luật ba chạm · `DL-111` chỉ số giám sát
- [EDD-04A](EDD-04A-PARTNER-RUNTIME-MOBILE-FIRST.md) — `DL-089` quan sát ⟷ cam kết · `DL-091` băm tại nguồn · `DL-092` QR định danh mờ
- [EDD-04D](EDD-04D-IRREVOCABILITY-PRINCIPLE.md) — `P-IRREV`
- [EDD-02](EDD-02-MASTER-DATA-BUSINESS-OBJECT.md) §5.4 — chuỗi truy vết cuộn→bó→thùng
- [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) Điều 9 *(User First)* · Điều 12.5 · 31.7 *(AI ⛔ không thay người quyết)*
