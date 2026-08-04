# EDD-04F · TU CHÍNH F
## KIỂM SOÁT DỮ LIỆU RA
### Nguyên tắc quy trách nhiệm · Sáu kênh ra · Xuất dữ liệu · Đóng dấu chìm

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-04F · Tu chính của [EDD-04D](EDD-04D-IRREVOCABILITY-PRINCIPLE.md) |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Nguồn thẩm quyền** | `BDR-26` ✅ phương án B + 8 cơ chế · 🔴 **Board phát biểu triết lý kiểm soát** |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §1 · TRIẾT LÝ BOARD VỪA PHÁT BIỂU — hình thức hoá

Joseph:
> *"Mục tiêu ⛔ không phải là ngăn tuyệt đối việc sao chép dữ liệu. Mục tiêu là: giảm khả năng rò rỉ · tăng trách nhiệm · đảm bảo truy vết · đảm bảo bằng chứng."*

> ### 🔴 `P-ATTRIB` · NGUYÊN TẮC QUY TRÁCH NHIỆM
>
> **Ngăn ở chỗ ngăn được. Quy trách nhiệm ở chỗ ⛔ không ngăn được.**
>
> ```
> Ngăn được?   ─── CÓ ──▶ NGĂN         (phép chiếu · phân quyền · chặn vai)
>      │
>     KHÔNG
>      ▼
> Quy được trách nhiệm? ─ CÓ ──▶ QUY   (đóng dấu chìm · nhật ký · bằng chứng)
>      │
>     KHÔNG
>      ▼
> 🔴 GHI NHẬN LÀ RỦI RO CÒN LẠI — ⛔ KHÔNG dựng kiểm soát giả
> ```
>
> **Hệ luận quan trọng nhất:** một biện pháp **⛔ không ngăn được VÀ ⛔ không quy trách nhiệm được** thì phải **GỠ BỎ**, ⛔ không phải giữ lại cho yên tâm — vì nó tạo ra **sự tự tin sai**, và sự tự tin sai nguy hiểm hơn việc biết mình đang hở.

**Quan hệ với `P-IRREV`:** ⛔ không mâu thuẫn — chúng bổ trợ.
`P-IRREV` nói *"đã ra là ⛔ không lấy lại được"* ⇒ **dồn lực vào phòng ngừa**.
`P-ATTRIB` nói *"nhưng có chỗ ⛔ không phòng ngừa nổi"* ⇒ **ở đó chuyển sang quy trách nhiệm**.

---

# §2 · 🔴 SÁU KÊNH DỮ LIỆU RA — chặn một kênh là kiểm soát trình diễn

`BDR-26` nói về **Export**. Nhưng Export chỉ là **một** trong sáu đường dữ liệu rời khỏi hệ thống. Chặn một đường mà để hở năm đường là **kiểm soát trình diễn** — đúng thứ `P-ATTRIB` cấm.

| # | Kênh | Ngăn được? | Quy trách nhiệm được? | Cơ chế |
|---|---|---|---|---|
| **E1** | **Xuất tệp** *(Excel · CSV · PDF)* | ⚠️ một phần | ✅ | 8 cơ chế `BDR-26` — §3 |
| **E2** | **Báo cáo gửi định kỳ** *(email tự động)* | ✅ | ✅ | 🔴 **⛔ Không đính kèm dữ liệu `RESTRICTED` vào email** — link về Portal *(`DL-121`)* |
| **E3** | 🔴 **Truy cập API / công cụ BI** | ⚠️ | ⚠️ | 🔴 **Lỗ lớn nhất** — §7 `BDR-27` |
| **E4** | **In ấn** | ❌ | ✅ | Đóng dấu chìm khi in · ghi nhật ký như xuất tệp |
| **E5** | 🔴 **Chụp màn hình / chụp ảnh màn hình** | ⛔ **KHÔNG** | ✅ **có** | 🔴 **Đóng dấu chìm TRÊN MÀN HÌNH** — §5 |
| **E6** | **Sao chép — dán** | ⛔ **KHÔNG** | ⚠️ một phần | Ghi nhật ký khi sao chép khối lớn từ vùng `RESTRICTED` |

> `DL-130` · **Chính sách dữ liệu ra là MỘT chính sách áp cho SÁU kênh, ⛔ không phải sáu chính sách rời.**
> Cùng một hàm quyết định: *(chủ thể, phân loại dữ liệu, khối lượng, kênh)* → `CHO PHÉP | CHO PHÉP CÓ ĐÓNG DẤU | CẦN DUYỆT | CHẶN`.
>
> ⚠️ Nếu chỉ gắn cổng ở nút *"Xuất Excel"*, người dùng sẽ **in ra PDF**, **nối Power BI**, hoặc **chụp màn hình** — và Monica ONE mất **cả dữ liệu lẫn dấu vết**. Đó chính xác là lập luận tôi dùng để khuyến nghị phương án B ở `BDR-26`, và nó áp cho cả sáu kênh chứ ⛔ không riêng kênh E1.

---

# §3 · XUẤT TỆP — tám cơ chế `BDR-26`

```
ExportRequest
├─ ① 🔴 watermark_applied · watermark_method       ← §4
├─ ② user_identity      person · role · authority_basis
├─ ③ tenant_id · legal_entity_id
├─ ④ requested_at · generated_at · expires_at
├─ ⑤ 🔴 export_reason_code + reason_text           ← mã chuẩn + tự sự
├─ ⑥ approval_id?                                   ← khi cần, §3.2
├─ ⑦ 🔴 DownloadLog[]  mỗi lượt tải: ai · lúc nào · IP · thiết bị
├─ ⑧ audit_entry_id                                 ← ImmutableLog dòng AUDIT
│
├─ 🔴 CHI TIẾT NỘI DUNG — để tái dựng được khi kiểm toán
│    query_definition · row_count · column_list[]
│    🔴 max_disclosure_class  ← lớp cao nhất trong tệp
│    content_hash
└─ file_format · file_size
```

## 3.1 🔴 Lý do xuất — mã chuẩn, ⛔ không phải ô chữ tự do

```
❌ Ô tự do  →  sau 3 ngày ⛔ không ai đọc, sau 3 tháng ⛔ không phân tích được

✅ MÃ CHUẨN + tự sự bắt buộc:
   BOARD_REPORT       báo cáo trình Board / họp điều hành
   CUSTOMER_REQUEST   khách yêu cầu số liệu
   AUDIT_REQUEST      kiểm toán · thanh tra
   TAX_ACCOUNTING     đối chiếu MISA · quyết toán
   ANALYSIS           phân tích nội bộ
   MIGRATION          chuyển đổi hệ thống
   OTHER              🔴 bắt buộc mô tả ≥ 20 ký tự
```

> `DL-131` · **Mã lý do chuẩn hoá biến nhật ký xuất từ *"một danh sách"* thành *"một tập dữ liệu phân tích được"*.**
> Sau 6 tháng, Monica trả lời được: *lý do nào chiếm nhiều nhất · ai xuất nhiều nhất · lý do `OTHER` có tăng bất thường ⛔ không*. Ô tự do ⛔ không trả lời được câu nào.

## 3.2 Khi nào cần duyệt — `BDR-26` ghi *"Approval (khi cần)"*, tôi định nghĩa "khi cần"

| Điều kiện | Kết quả |
|---|---|
| Vai ⛔ không có quyền xuất | 🔴 **CHẶN HOÀN TOÀN** *(`BDR-26`)* |
| Mọi vai **ngoài** *(khách · nhà thầu · NCC)* | 🔴 **CHẶN HOÀN TOÀN, ⛔ không ngoại lệ** — chỉ tải chứng từ được cấp riêng |
| Không chứa `RESTRICTED` · dưới ngưỡng dòng | ✅ cho phép, đóng dấu chìm, ghi nhật ký |
| 🔴 **Chứa `RESTRICTED`** | ⚠️ **cảnh báo + gõ xác nhận + thông báo CEO/CFO** |
| 🔴 **Chứa `RESTRICTED` VÀ ≥ ngưỡng khối lượng** | 🔴 **CẦN DUYỆT** — người thứ hai |
| 🔴 **Tích luỹ 30 ngày vượt ngưỡng** | 🔴 **CẦN DUYỆT** — §4.2 |
| Lý do = `MIGRATION` | 🔴 **CẦN DUYỆT** — luôn luôn |

## 3.3 Vòng đời tệp đã xuất — ⛔ không giữ bản sao thứ hai

```
① Sinh tệp → lưu tạm, mã hoá
② 🔴 Link tải MỘT NGƯỜI, HẾT HẠN 24h, GIỚI HẠN SỐ LƯỢT
     ⛔ Chia sẻ link cho người khác ⇒ 403, ghi nhật ký như một sự cố
③ Hết hạn ⇒ 🔴 XOÁ TỆP, GIỮ MANIFEST
     (truy vấn · danh sách cột · số dòng · băm · lý do · người xuất)
```

> `DL-132` · **Xoá tệp, giữ manifest.**
> Giữ tệp nghĩa là tạo **bản sao thứ hai của dữ liệu `RESTRICTED`** nằm trong kho lưu trữ — mở thêm một bề mặt rò rỉ để phục vụ kiểm toán. Manifest trả lời được **mọi câu hỏi kiểm toán** *(ai xuất gì, bao nhiêu dòng, lúc nào, băm bao nhiêu)* mà ⛔ không giữ dữ liệu.
> Cùng lập luận `DL-075` *(nhật ký AI lưu tham chiếu, ⛔ không lưu bản sao)*.

---

# §4 · 🔴 ĐÓNG DẤU CHÌM — nói thật cái gì được, cái gì không

## 4.1 Hiệu lực theo định dạng — và một giới hạn ⛔ không che được

| Định dạng | Đóng dấu chìm | Độ bền | Đánh giá |
|---|---|---|---|
| **PDF** | chữ mờ chéo trang + siêu dữ liệu + dấu ẩn | ✅ khá bền — xoá được nhưng tốn công và để lại dấu | ✅ **dùng được** |
| **Excel** | dòng tiêu đề · chân trang mỗi sheet · thuộc tính tệp · ô ẩn | ⚠️ **xoá trong 10 giây** | ⚠️ **yếu** |
| 🔴 **CSV** | ⛔ **⛔ KHÔNG CÓ CÁCH NÀO** — CSV là văn bản thuần | ❌ | 🔴 **⛔ không có** |
| **Hình ảnh** | dấu chìm trực tiếp trên ảnh | ✅ bền | ✅ |

> ### 🔴 `DL-133` · Với dữ liệu dạng bảng, **BẰNG CHỨNG NẰM Ở NHẬT KÝ, ⛔ KHÔNG NẰM Ở TỆP**
>
> Tôi ⛔ **không** đề xuất *"đóng dấu chìm pháp y"* bằng cách xê dịch chữ số — kỹ thuật đó **làm sai lệch dữ liệu**, và dữ liệu tài chính sai lệch là ⛔ không chấp nhận được, kể cả ở chữ số ⛔ không đáng kể.
>
> ⇒ Với Excel và CSV, đóng dấu chìm là **răn đe**, ⛔ không phải **truy vết**. Truy vết thật đến từ **`DownloadLog` + `ExportManifest`**: *"tệp có băm `abc123` được xuất bởi Nguyễn Văn A lúc 14:02, chứa 4.820 dòng, cột này cột kia"*. Tệp rò ra ngoài **đối chiếu băm là biết nguồn**.
>
> ⚠️ Nếu Monica cần truy vết mạnh hơn cho dữ liệu bảng: **ưu tiên PDF cho báo cáo trình bày, chỉ cho Excel khi thật sự cần tính toán** — đó là cấu hình `L1`, ⛔ không phải hạn chế cứng.

## 4.2 🔴 Hai kiểu tấn công mà cổng xuất đơn lẻ ⛔ không chặn được

### `EX-ATK-1` · Tấn công tổ hợp

```
Người dùng ⛔ KHÔNG được xuất "biên lợi nhuận theo đơn".
Nhưng họ xuất:
   ① Doanh thu theo đơn      ← được phép
   ② Giá vốn theo đơn        ← được phép
   ▶ 🔴 Trừ hai bảng trong Excel = ĐÚNG BIÊN LỢI NHUẬN
```

> `DL-134` · **Đánh giá quyền xuất trên TỔ HỢP TRƯỜNG, ⛔ không trên từng trường.**
> Sổ đăng ký `SensitiveCombination` khai các tổ hợp mà **kết quả nhạy cảm hơn từng phần**: `{revenue, cost} → margin` · `{qty_issued, qty_returned} → wastage` · `{output, headcount} → efficiency`.
> Xuất chứa một tổ hợp ⇒ **áp mức phân loại của KẾT QUẢ**, ⛔ không phải của các trường thành phần.
>
> ⚠️ Đây là **tấn công tương quan** *(`SP-4`)* ở dạng nội bộ. Cùng một họ vấn đề, cùng một lời giải: **xét cái suy ra được, ⛔ không chỉ xét cái hiện ra**.

### `EX-ATK-2` · Rút nhỏ giọt

```
Ngưỡng cần duyệt: 5.000 dòng.
Người dùng xuất 400 dòng/ngày × 90 ngày = 36.000 dòng.
▶ 🔴 ⛔ Không lần nào chạm ngưỡng. Cả CSDL đã ra ngoài.
```

> `DL-135` · **Ngưỡng tính trên TÍCH LUỸ TRƯỢT 30 NGÀY theo người dùng, ⛔ không tính trên từng lượt.**
> Bổ sung: **phát hiện bất thường** — người dùng xuất gấp 3 lần mức trung bình 90 ngày của chính họ ⇒ `RiskSignal` gửi CEO/CFO, ⛔ không chặn.
> ⛔ Không chặn vì có thể có lý do chính đáng *(mùa kiểm toán)*. Nhưng phải **có người nhìn thấy** — đúng tinh thần `P-ATTRIB`.

---

# §5 · 🔴 ĐÓNG DẤU CHÌM TRÊN MÀN HÌNH — kênh `E5`

Chụp màn hình ⛔ **không ngăn được**. Theo `P-ATTRIB`, chuyển sang **quy trách nhiệm**:

```
╔═══════════════════════════════════════════════╗
║  CHIẾT TÍNH CST-114                           ║
║  ░░ Nguyễn Văn A · 04/08 14:02 · MONICA ░░    ║  ← dấu chìm mờ, chéo,
║  Giá chào     3,84 USD                        ║    lặp trên toàn màn hình
║  ░░ Nguyễn Văn A · 04/08 14:02 · MONICA ░░    ║
║  Biên LN      14,1%                           ║
╚═══════════════════════════════════════════════╝
```

| # | Luật |
|---|---|
| `SW-1` | 🔴 **Mọi màn hình hiện dữ liệu `RESTRICTED` đóng dấu chìm**: tên người · thời điểm · tenant |
| `SW-2` | **Đủ mờ để đọc được nội dung, đủ rõ để đọc được trong ảnh chụp** |
| `SW-3` | 🔴 **⛔ Không tắt được** — kể cả bởi quản trị viên tenant *(tầng L3)* |
| `SW-4` | Ảnh chụp bằng điện thoại **cũng dính dấu** — đó chính là mục đích |

> `DL-136` · **Đóng dấu chìm trên màn hình cho mọi khung nhìn `RESTRICTED`.**
> Chi phí gần bằng 0. Hiệu quả **răn đe** cao — người ta ⛔ không gửi ảnh có tên mình chéo giữa màn hình. Và nếu vẫn gửi thì **quy được trách nhiệm**.
> Đây là ca thuần khiết nhất của `P-ATTRIB`: ⛔ **không ngăn được, nhưng quy được — và vì thế đáng làm**.

---

# §6 · CÁI TÔI ĐỀ NGHỊ **⛔ KHÔNG** LÀM

Theo hệ luận `P-ATTRIB` — biện pháp ⛔ không ngăn được **và** ⛔ không quy trách nhiệm được thì phải **gỡ bỏ**:

| ⛔ Đề nghị KHÔNG làm | Vì sao |
|---|---|
| Chặn chuột phải · chặn `Ctrl+C` | ⛔ Không ngăn *(F12, xem nguồn)* · ⛔ không quy trách nhiệm · **gây bực bội và tạo tự tin sai** |
| Chặn `PrintScreen` | ⛔ Không ngăn *(điện thoại chụp màn hình)* · ⛔ không quy trách nhiệm |
| Tắt tải xuống bằng JavaScript | ⛔ Không ngăn *(API vẫn gọi được)* |
| Đóng dấu chìm pháp y bằng xê dịch chữ số | Quy được nhưng 🔴 **làm sai lệch dữ liệu tài chính** — cái giá quá đắt |

> `DL-137` · **Gỡ bỏ mọi kiểm soát ⛔ không ngăn được và ⛔ không quy trách nhiệm được.**
> Chúng tạo ra **sự tự tin sai** — người quản trị tin rằng dữ liệu được bảo vệ, nên ⛔ không đầu tư vào biện pháp thật. Biết mình đang hở **an toàn hơn** tưởng mình kín.

---

# §7 · DECISION LOG — 8 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-130` | 🔴 **MỘT chính sách dữ liệu ra cho SÁU kênh**, ⛔ không phải sáu chính sách rời | Chặn nút Xuất mà để hở In · API · chụp màn hình = kiểm soát trình diễn | ⚠️ |
| `DL-131` | **Mã lý do xuất chuẩn hoá** + tự sự bắt buộc | Biến nhật ký thành tập dữ liệu phân tích được | ✅ |
| `DL-132` | **Xoá tệp đã xuất, giữ manifest** | Giữ tệp = tạo bản sao `RESTRICTED` thứ hai. Manifest trả lời mọi câu hỏi kiểm toán | ✅ |
| `DL-133` | 🔴 **Với dữ liệu bảng, bằng chứng nằm ở NHẬT KÝ, ⛔ không ở tệp** · ⛔ không dùng đóng dấu pháp y xê dịch số | CSV ⛔ không đóng dấu được. Xê dịch số làm **sai lệch dữ liệu tài chính** | ⚠️ |
| `DL-134` | 🔴 **Đánh giá quyền xuất trên TỔ HỢP TRƯỜNG** — `SensitiveCombination` | `EX-ATK-1`: doanh thu + giá vốn = biên lợi nhuận | ⚠️ |
| `DL-135` | **Ngưỡng tính trên tích luỹ trượt 30 ngày** + phát hiện bất thường | `EX-ATK-2`: rút nhỏ giọt vượt mọi ngưỡng theo lượt | ✅ |
| `DL-136` | 🔴 **Đóng dấu chìm trên màn hình cho mọi khung nhìn `RESTRICTED`** · ⛔ không tắt được | Ca thuần khiết nhất của `P-ATTRIB` — ⛔ không ngăn được nhưng quy được | ✅ |
| `DL-137` | 🔴 **Gỡ bỏ kiểm soát ⛔ không ngăn được VÀ ⛔ không quy trách nhiệm được** | Chúng tạo **tự tin sai** — nguy hiểm hơn biết mình hở | ✅ |

**Cộng dồn EDD-01 → 04F: 137 quyết định.**

🔴 **Bốn nguyên tắc thiết kế xuyên suốt:**

| | Nguyên tắc | Nội dung |
|---|---|---|
| `P-IRREV` | Bất khả thu hồi | Đã tiết lộ là ⛔ không lấy lại ⇒ **dồn lực vào phòng ngừa** |
| `P-ATTRIB` | 🆕 **Quy trách nhiệm** | Ngăn ở chỗ ngăn được; **quy trách nhiệm ở chỗ ⛔ không ngăn được**; ⛔ **không dựng kiểm soát giả** |
| `P-ZEROMAN` | Không nhập tay | ⛔ Không bắt người dùng nhập thứ hệ thống lấy được |
| `P-COMMIT` | Sự kiện ⟷ cam kết | Sự kiện thì tự động và nhanh; cam kết thì có chủ ý và chậm |

---

# §8 · BOARD DECISION REQUIRED — 1

## `BDR-27` · TRUY CẬP API VÀ CÔNG CỤ BI — kênh `E3`

**Vấn đề.** `BDR-26` giải quyết xong việc **xuất tệp**. Nhưng khách hàng doanh nghiệp lớn **sẽ hỏi**: *"Tôi nối Power BI / Tableau vào Monica ONE được không?"* Đây là câu hỏi bán hàng thật, và nó là **kênh dữ liệu ra lớn nhất còn lại** — một kết nối BI kéo hàng trăm nghìn dòng, liên tục, ⛔ không có nút *"Xuất"* nào để gắn cổng.

| | **A · ⛔ KHÔNG mở truy cập dữ liệu trực tiếp** | **B · API có quản trị, cùng bộ kiểm soát** |
|---|---|---|
| **Cách làm** | Chỉ có xuất tệp có kiểm soát và báo cáo trong hệ thống. ⛔ Không kết nối BI | Cấp API riêng cho từng công cụ: **cùng phép chiếu · cùng phân loại · cùng ngưỡng tích luỹ · cùng nhật ký**. Mọi lượt gọi ghi như một lượt xuất |
| **Ưu** | 🔴 **Kiểm soát trọn vẹn** · bề mặt nhỏ · dễ chứng minh khi kiểm toán | ✅ Bán được cho doanh nghiệp lớn · họ **đã có** đội phân tích · giữ họ trong hệ sinh thái Monica ONE |
| **Nhược** | 🔴 **Mất phân khúc doanh nghiệp lớn.** Và họ sẽ **lách bằng cách xuất Excel hàng loạt** ⇒ ta mất kiểm soát theo đường khác | 🔴 **Kênh ra lớn nhất, khó giám sát nhất.** Một token BI bị lộ = rò rỉ liên tục ⛔ không ai thấy |
| **Với Monica** | ⛔ Không ảnh hưởng hôm nay | ⛔ Không ảnh hưởng hôm nay |
| **Với 100 khách** | 🔴 Doanh nghiệp > 1.000 CN thường **từ chối** hệ ⛔ không cho kết nối dữ liệu | ✅ |

> **Khuyến nghị: PHƯƠNG ÁN B**, với năm ràng buộc:
> ① 🔴 **API đọc từ PHÉP CHIẾU, ⛔ không bao giờ từ bảng gốc** — cùng cơ chế cổng đối tác *(`DL-057`)*
> ② **Token gắn với một người thật + một công cụ**, ⛔ không có token dùng chung
> ③ 🔴 **Token chứa `RESTRICTED` ⇒ hết hạn 90 ngày, phải gia hạn có duyệt**
> ④ **Áp cùng ngưỡng tích luỹ và phát hiện bất thường** *(`DL-135`)*
> ⑤ 🔴 **Mọi lượt gọi ghi vào cùng nhật ký với xuất tệp** — một sổ dữ liệu ra duy nhất
>
> Lý do: cùng lập luận đã dùng cho `BDR-26`. **Phương án A ⛔ không thật sự chặn — nó đẩy hành vi sang kênh khác khó quan sát hơn.** Doanh nghiệp lớn có đội phân tích sẽ xuất Excel hàng loạt mỗi tuần, và ta mất cả kiểm soát lẫn quan hệ.
>
> ⚠️ **Chỗ tôi có thể sai:** rủi ro *"một token BI bị lộ = rò rỉ liên tục"* là **thật và nghiêm trọng hơn** một tệp Excel bị gửi nhầm. Nếu Board đánh giá rủi ro này cao hơn giá trị thương mại, A đúng — và ta chấp nhận mất một phân khúc như một cái giá có chủ ý.

**🔲 Board chọn: A · B-với-5-ràng-buộc · B-khác**

---

# §9 · TÓM TẮT

## 9.1 Ba điểm đáng nhớ nhất

| # | Điểm |
|---|---|
| **1** | 🔴 **`BDR-26` giải quyết một trong SÁU kênh dữ liệu ra.** Chặn nút *"Xuất Excel"* mà để hở **in · API · chụp màn hình · sao chép** là kiểm soát trình diễn. Chính lập luận tôi dùng để khuyến nghị phương án B *(người ta sẽ tìm đường vòng)* áp cho cả sáu kênh — nên phải là **một chính sách, sáu kênh** |
| **2** | 🔴 **Với dữ liệu dạng bảng, đóng dấu chìm là RĂN ĐE, ⛔ không phải TRUY VẾT.** CSV ⛔ không có cách nào đóng dấu; Excel xoá dấu trong 10 giây. Truy vết thật đến từ **`DownloadLog` + băm manifest**. Tôi ⛔ **không** đề xuất đóng dấu pháp y bằng xê dịch chữ số — nó truy được nhưng **làm sai lệch dữ liệu tài chính**, cái giá quá đắt |
| **3** | 🔴 **Triết lý Board vừa phát biểu có một hệ luận mạnh: kiểm soát ⛔ không ngăn được VÀ ⛔ không quy trách nhiệm được thì phải GỠ BỎ.** Chặn chuột phải, chặn `PrintScreen` — chúng ⛔ không ngăn được ai, ⛔ không quy được trách nhiệm, và tạo ra **sự tự tin sai**. Biết mình đang hở **an toàn hơn** tưởng mình kín |

## 9.2 Trạng thái

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

**Tiếp theo:** EDD-05 — Phase 11 Workspace · Work Inbox · Dashboard · Executive Center · Phase 12 Module Architecture, dưới **bốn nguyên tắc xuyên suốt**.

---

## THAM CHIẾU

- **Board Decision `BDR-26`** ✅ — phương án B · 8 cơ chế · triết lý kiểm soát
- [EDD-04D](EDD-04D-IRREVOCABILITY-PRINCIPLE.md) — `P-IRREV` · `GAP-2` xuất dữ liệu · `DL-120`
- [EDD-03A](EDD-03A-PARTNER-PORTAL-ARCHITECTURE.md) — `SP-4` tấn công tương quan
- [EDD-03](EDD-03-DOCUMENT-INFORMATION-ARCHITECTURE.md) — `DL-057` phép chiếu · 6 lớp phân loại
- [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) Điều 8 *(Evidence First)* · Điều 40 *(Security)*
