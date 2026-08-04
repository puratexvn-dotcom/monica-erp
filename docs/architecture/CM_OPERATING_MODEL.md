# MÔ HÌNH VẬN HÀNH NHÀ MÁY MAY GIA CÔNG
## Bản dựng lại độc lập · đối chiếu với MD hiện tại

> ## ⚠️ KHÔNG DÙNG TÀI LIỆU NÀY LÀM NGUỒN THIẾT KẾ — ghi 04/08/2026
>
> **Mục 1.3 và Mục 3 được xây trên bốn giả định đã bị Board bác bỏ:** vòng đời
> bắt đầu bằng RFQ · báo giá đi trước mẫu · khách chỉ định nhà cung cấp vải ·
> nhận PO khách rồi tạo đơn nội bộ. Xem
> [BKB Phụ lục H](../business/BUSINESS_KNOWLEDGE_BASE.md).
>
> **Nguồn thiết kế đúng là [`docs/business/BUSINESS_KNOWLEDGE_BASE.md`](../business/BUSINESS_KNOWLEDGE_BASE.md)**
> — Phần B thay thế Mục 1–3 của tài liệu này.
>
> Phần **vẫn còn giá trị**: Mục 9 *(phân tích khoảng cách, có bằng chứng đo được)*
> và Mục 11 *(những chỗ tôi có thể sai)*. Tệp giữ nguyên làm hồ sơ lịch sử theo
> Hiến pháp Điều 43.7 — **không xoá, không sửa nội dung bên dưới**.

| Trường | Giá trị |
|---|---|
| **Ngày** | 2026-08-04 |
| **Thẩm quyền** | AI Collaboration Constitution v1.0 · Nhiệm vụ đầu tiên |
| **Phạm vi** | Mô hình nghiệp vụ. **Không sửa một dòng mã nào.** |
| **Quy ước bằng chứng** | Điều 7 — mọi phát biểu gắn nhãn: `[VERIFIED]` `[EVIDENCE]` `[HYPOTHESIS]` `[NEEDS-VERIFICATION]` |

---

## 0. BA ĐIỂM TÔI PHẢN BIỆN TRƯỚC KHI BẮT ĐẦU

Điều 11 cấm đồng ý mù. Ba điểm dưới đây tôi thấy đề bài đặt chưa đúng.

### Phản biện A — Thứ tự ưu tiên nên đổi. Một truy vấn, làm trước mọi thứ.

Điều 12 đặt MD là ưu tiên hiện tại. Nhưng bản audit hôm qua để lại một câu hỏi
chưa trả lời: **bảng `costings` — chứa `target_price`, `quoted_price`,
`margin_percent` — dường như không có policy thu hẹp nào**, chỉ chạy bằng policy
nền `authenticated_only` từ migration `010`. `[EVIDENCE]` Quét 40 migration
không tìm thấy `CREATE POLICY ... ON costings`.

Nếu đúng, mọi tài khoản đã đăng nhập — gồm `buyer` (khách hàng) và `subcon`
(nhà thầu) — đọc được biên lợi nhuận của nhà máy. `[NEEDS-VERIFICATION]`

Điều 9 và Điều 10 nói rõ: không có gì hoàn tất nếu Security chưa đạt. Dựng lại
mô hình nghiệp vụ MD trong khi chưa biết giá có đang rò hay không là làm việc
lớn trên một nền chưa kiểm. **Đề nghị: chạy một truy vấn trước.**

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('costings','costing_items','style_bom');
```

Mất một phút. Kết quả quyết định việc này là "không có gì" hay "dừng mọi thứ lại".

### Phản biện B — Tiền đề "đừng mô hình hoá như Fashion PLM" phần lớn đã đúng rồi

Điều 4 cảnh báo đừng dựng MONICA ONE như Fashion PLM. Nhưng bằng chứng cho thấy
lược đồ **đã** mang tư duy gia công ở những chỗ quan trọng nhất:

| Bằng chứng | Ý nghĩa |
|---|---|
| `costings.order_type CHECK IN ('FOB','CM','CMT','CMPT','CMPTH')` `[VERIFIED]` | Mô hình biết bốn hình thức gia công — Fashion PLM không có khái niệm này |
| `sample_submissions.stage CHECK IN ('PROTO','FIT','SIZE_SET','SMS','PP','TOP','SHIPMENT')` `[VERIFIED]` | Đúng bảy chặng mẫu của nhà máy gia công, không phải vòng đời thiết kế |
| `orders.ex_factory_date` `[VERIFIED]` | Ngày xuất xưởng — khái niệm của nhà gia công, không phải của thương hiệu |
| `order_milestones` có `planned_date` · `actual_date` · `delay_days` sinh tự động · `is_critical` `[VERIFIED]` | Đây **chính là** bộ khung T&A |

**Kết luận phản biện:** vấn đề của MD **không phải** sai mô hình kinh doanh. Điều
8 bảo "mô hình sai thì đừng vá, hãy thiết kế lại" — nhưng ở đây mô hình phần lớn
đúng, chỉ **chưa được nối dây**. Thiết kế lại từ đầu sẽ vứt bỏ tài sản đang đúng.

Đó là một chẩn đoán rẻ hơn nhiều, và tôi đưa bằng chứng ở Mục 9.

### Phản biện C — Điều 5 áp dụng cho cái MỚI, không nên áp ngược lên cái đã có

Điều 5 cấm đảo thứ tự Business → … → Deployment. Đúng cho tính năng mới. Nhưng
MD đã tồn tại với 19.058 dòng và một lược đồ phần lớn hợp lý. Áp Điều 5 theo
nghĩa "dựng lại từ Business Model" sẽ thành một cuộc viết lại.

**Đề nghị diễn giải:** sản phẩm của bước này là **bản đồ đối chiếu** (mô hình
chuẩn ⟷ mã đang chạy), không phải lộ trình viết lại. Chỗ nào lệch thì sửa chỗ đó.

---

## 1. TARGET OPERATING MODEL

### 1.1 Nhà máy gia công kiếm tiền bằng gì

Đây là điểm khác biệt gốc rễ so với một thương hiệu thời trang, và nó quyết định
toàn bộ phần còn lại:

> **Thương hiệu bán sản phẩm. Nhà máy gia công bán NĂNG LỰC SẢN XUẤT theo thời
> gian, dưới hình thức các đơn hàng có ngày giao cố định.**

Hệ quả: đơn vị tài nguyên khan hiếm không phải hàng tồn kho, mà là **phút chuyền
may** (SAM-minute) trong một khung thời gian. Một đơn nhận về mà không đủ chỗ
trên chuyền đúng tuần đó là một đơn sẽ trễ, bất kể giá tốt đến đâu.

### 1.2 Bốn hình thức gia công quyết định dữ liệu nào quan trọng

| Hình thức | Ai mua NPL | Rủi ro của nhà máy | Giá gồm |
|---|---|---|---|
| **CMT** | Khách | Chỉ nhân công | Tiền công |
| **CM** | Khách (vải) · máy (phụ liệu) | Nhân công + phụ liệu | Công + phụ liệu |
| **FOB** | **Nhà máy** | Nhân công + toàn bộ NPL + vốn lưu động + tồn kho | Vải + phụ liệu + công + phí + lãi |
| **ODM** | Nhà máy | Trên + rủi ro thiết kế | Trên + phí phát triển |

⚠️ **Đây là điều quan trọng nhất trong toàn bộ tài liệu này.** Hình thức gia công
**phải rẽ nhánh quy trình**:

- **CMT/CM** — nhà máy **không** mua vải. Không có quy trình mua NPL, không có
  công nợ nhà cung cấp, không có rủi ro tồn kho. Nhưng **phải** có quy trình
  *nhận NPL của khách*, đối chiếu số lượng, và báo thiếu — vì thiếu vải của khách
  thì nhà máy dừng chuyền mà **không được** tự mua bù.
- **FOB** — nhà máy mua NPL, nên **ngày NPL về xưởng (in-house date)** trở thành
  mốc quan trọng nhất của cả đơn hàng. Trễ vải là trễ tàu.

### 1.3 Sự thật vận hành mà phần mềm hay bỏ sót

`[HYPOTHESIS — dựa trên thực tiễn ngành, cần người vận hành xác nhận]`

1. **Khách hàng thường CHỈ ĐỊNH nhà cung cấp vải** (nominated supplier). Nhà máy
   không được tự chọn, nhưng vẫn chịu trách nhiệm về tiến độ của nhà cung cấp đó.
2. **Một PO của khách thường tách thành nhiều đợt giao**, nhiều cảng đến, nhiều
   ngày. "Một PO = một lô hàng" là giả định sai.
3. **Mẫu bị từ chối là chuyện bình thường**, không phải ngoại lệ. Vòng lặp
   PP → sửa → gửi lại có thể ba bốn lượt, và mỗi lượt ăn vào lịch sản xuất.
4. **Tiền bị trừ sau khi giao** — trễ hàng, lỗi chất lượng, thiếu số. Doanh thu
   thực thu gần như không bao giờ bằng giá trị PO.
5. **Cân đối chuyền quan trọng hơn tổng công suất.** Nhà máy có thể còn dư giờ
   tổng mà vẫn không nhận thêm đơn, vì đơn đó cần một chuyền đang bận.

---

## 2. CAPABILITY MAP

| # | Năng lực | Có trong MD? | Bằng chứng |
|---|---|---|---|
| C1 | Quản lý khách hàng và liên hệ | ✅ | `customers`, `customer_contacts` `[VERIFIED]` |
| C2 | Tiếp nhận yêu cầu báo giá | ✅ | `inquiries` `NEW→COSTING→QUOTED→WON/LOST` `[VERIFIED]` |
| C3 | Chiết tính giá theo hình thức gia công | ✅ | `costings` + `costing_items` + `order_type` `[VERIFIED]` |
| C4 | Quản lý mã hàng của khách | ✅ | `styles` + `style_bom`/`sizes`/`colorways`/`operations` `[VERIFIED]` |
| C5 | Nhận và xác nhận PO | ✅ | `orders`, `order_items`, `order_size_breakdown` `[VERIFIED]` |
| C6 | **Quản lý chặng mẫu** | ⚠️ **có bảng, giao diện chỉ ở thế hệ cũ** | Mục 9.2 |
| C7 | **Lịch T&A** | ⚠️ **có bảng, giao diện chỉ ở thế hệ cũ, quy tắc chết** | Mục 9.1 |
| C8 | Mua và theo dõi NPL | ⚠️ | `material_requests` có; không có ngày NPL về xưởng |
| C9 | **Nhận NPL do khách cấp (CMT)** | ❌ | Không tìm thấy bảng nào `[VERIFIED]` |
| C10 | Hoạch định năng lực chuyền | ⚠️ | `production_orders` có; không thấy mô hình phút-chuyền |
| C11 | Theo dõi sản xuất | ↗ | Bàn giao phân hệ Production |
| C12 | Kiểm chất lượng | ↗ | Bàn giao phân hệ Quality |
| C13 | Đóng thùng và xuất hàng | ✅ | `shipments`, `shipment_cartons` `[VERIFIED]` |
| C14 | Chứng từ xuất khẩu | ⚠️ | `md_documents` chung chung, không có loại chứng từ |
| C15 | **Hoá đơn** | ❌ | Không có bảng `[VERIFIED]` |
| C16 | **Thanh toán và công nợ theo đơn** | ❌ | Không có bảng `[VERIFIED]` |
| C17 | **Khấu trừ / bồi thường** | ❌ | Không có bảng `[VERIFIED]` |
| C18 | Quản lý thay đổi | ✅ | `change_requests` `[VERIFIED]` |
| C19 | Quản lý rủi ro | ✅ | `risk_assessments` `[VERIFIED]` |
| C20 | Giao việc đối tác ngoài | ✅ | phân hệ `assignments` `[VERIFIED]` |

**Bốn năng lực thiếu hẳn: C9 · C15 · C16 · C17.** Ba trong bốn nằm ở khâu thu tiền.

---

## 3. VÒNG ĐỜI ĐƠN HÀNG CHUẨN

```
① HỎI HÀNG        khách gửi tech pack, số lượng, giá mục tiêu, ngày giao
② CHIẾT TÍNH      bóc BOM từ tech pack · định mức · hao hụt · SAM
                  → giá theo ĐÚNG hình thức (CMT: chỉ công · FOB: đủ NPL)
③ BÁO GIÁ         thương lượng, nhiều phiên bản
④ NHẬN PO         PO của khách → đơn nội bộ + xác nhận
⑤ LẬP LỊCH T&A    tính NGƯỢC từ ngày xuất xưởng ra mọi mốc
⑥ MẪU             PROTO → FIT → SIZE SET → SMS → PP → TOP
⑦ NPL             FOB: đặt mua → theo dõi → NPL về → kiểm 4 điểm
                  CMT: chờ khách cấp → nhận → đối chiếu → báo thiếu
⑧ HỌP TIỀN SX     chốt trước khi lên chuyền
⑨ SẢN XUẤT        cắt → may → hoàn thành
⑩ KIỂM HÀNG       trong chuyền · cuối chuyền · AQL · khách kiểm
⑪ ĐÓNG GÓI        theo packing list, mã thùng
⑫ ĐẶT TÀU         booking, chứng từ xuất khẩu
⑬ XUẤT XƯỞNG      ex-factory → lên tàu
⑭ HOÁ ĐƠN         invoice theo đợt giao
⑮ THU TIỀN        LC / TT, trừ khấu trừ
```

**MD hiện phủ ①–⑬. Đứt hoàn toàn ở ⑭ và ⑮.** `[VERIFIED]`

---

## 4. TRÁCH NHIỆM PHÒNG BAN

| Phòng | Sở hữu bước | Vai trò trong hệ thống |
|---|---|---|
| Merchandising | ①–⑥ ⑭ · điều phối toàn tuyến | `md` |
| Chiết tính | ② | *(chưa có vai trò riêng)* |
| Mua hàng | ⑦ FOB | *(chưa có vai trò riêng)* |
| Kế hoạch | ⑤ ⑧ | `[gap]` Planning là Beta |
| Kho NPL | ⑦ nhận, kiểm | `kho` `thukho` `khotruong` |
| Sản xuất | ⑨ | `totruongcat` `totruongmay` `hoanthanh` |
| Chất lượng | ⑩ | `qa` |
| Xuất hàng | ⑪–⑬ | *(dùng chung `kho`)* |
| Kế toán | ⑭ ⑮ | `ketoan` |
| Ban giám đốc | duyệt giá, duyệt ngoại lệ | `giamdoc` |

⚠️ `[VERIFIED]` Chỉ vai trò `md` và `superadmin` vào được `/md`
(`lib/rbac.ts:77`). Chiết tính, Mua hàng và Kế hoạch **không có vai trò riêng**,
nên hoặc họ dùng chung tài khoản `md`, hoặc họ không dùng hệ thống.

---

## 5. QUY TẮC NGHIỆP VỤ CỐT LÕI

| # | Quy tắc | Trạng thái trong MD |
|---|---|---|
| BR1 | Hình thức gia công quyết định có quy trình mua NPL hay không | ❌ **không rẽ nhánh** — Mục 9.3 |
| BR2 | T&A tính ngược từ ngày xuất xưởng | ⚠️ có mẫu theo `order_type`, `[VERIFIED]` `po.actions.ts:102` |
| BR3 | Không lên chuyền khi mẫu PP chưa duyệt | `[NEEDS-VERIFICATION]` không tìm thấy chốt chặn |
| BR4 | Không lên chuyền khi NPL chưa về đủ | `[NEEDS-VERIFICATION]` |
| BR5 | Trễ một mốc tới hạn ⇒ nâng mức khẩn cấp | ❌ **quy tắc có, không bao giờ chạy** — Mục 9.1 |
| BR6 | Giá chỉ hiện cho vai trò nội bộ | ⚠️ **cần xác minh** — Phản biện A |
| BR7 | Doanh thu thực = giá trị PO − khấu trừ | ❌ không có khái niệm khấu trừ |
| BR8 | Một PO có thể nhiều đợt giao, nhiều cảng | `[NEEDS-VERIFICATION]` |

---

## 6. DOMAIN MODEL — ĐỀ XUẤT so với HIỆN CÓ

```
Customer ─┬─ Inquiry ─── Costing ─── Quotation
          └─ Order ─┬─ OrderItem ─── SizeBreakdown
                    ├─ Style ─┬─ BOM ─ Colorway ─ Size ─ Operation
                    ├─ Milestone (T&A)          ✅ có bảng
                    ├─ SampleSubmission         ✅ có bảng
                    ├─ MaterialRequest          ✅ có bảng
                    ├─ MaterialReceipt (CMT)    ❌ THIẾU
                    ├─ ProductionOrder          ✅ có bảng
                    ├─ Shipment ─ Carton        ✅ có bảng
                    ├─ Invoice                  ❌ THIẾU
                    ├─ Payment                  ❌ THIẾU
                    └─ Chargeback               ❌ THIẾU
```

**Bốn thực thể thiếu.** Ba trong bốn ở khâu thu tiền.

---

## 7–8. WORKFLOW VÀ MÁY TRẠNG THÁI

`[VERIFIED]` MD hiện có **sáu bộ từ vựng trạng thái độc lập**, không bộ nào ánh
xạ sang bộ nào, và không có sơ đồ chuyển trạng thái nào được viết thành mã:

| Thực thể | Trạng thái |
|---|---|
| `orders` | `APPROVED · IN_PRODUCTION · COMPLETED · SHIPPED` *(mã dùng thêm 6 giá trị khác)* |
| `inquiries` | `NEW · COSTING · QUOTED · WON · LOST · CANCELLED` |
| `costings` | `DRAFT · SUBMITTED · APPROVED · REJECTED · REVISE · SUPERSEDED` |
| `material_requests` | `DRAFT · SUBMITTED · APPROVED · ORDERED · RECEIVED · REJECTED` |
| `production_orders` | `PENDING · RELEASED · IN_PROGRESS · COMPLETED · CANCELLED` |
| `sample_submissions` | `PENDING · SENT · APPROVED · REJECTED · APPROVED_WITH_COMMENT` |
| `order_milestones` | `PENDING · IN_PROGRESS · DONE · LATE · SKIPPED` |

Bảy, không phải sáu — tôi đếm sót ở bản audit trước.

---

## 9. GAP ANALYSIS — MD HIỆN TẠI vs MD LÝ TƯỞNG

### 9.1 🔴 Quy tắc leo thang khẩn cấp KHÔNG BAO GIỜ CHẠY ĐƯỢC `[VERIFIED]`

Đây là phát hiện quan trọng nhất của cả lượt này.

```
lib/mos/po-flow.ts:111
  if (risk === 'CRITICAL' || po.late_milestones > 0) return 'CRITICAL';

app/(dashboard)/md/po/[poId]/_services/po-twin.service.ts:132
  late_milestones: 0,          ← SỐ CỨNG
```

`po-twin.service.ts` **không hề truy vấn `order_milestones`**. Nó truyền hằng số
`0` vào bộ tính. Vì vậy mệnh đề `po.late_milestones > 0` **không bao giờ đúng**,
và PO Command Center **không bao giờ** nâng một đơn lên mức khẩn cấp vì trễ mốc.

Trong nhà máy gia công, trễ mốc T&A là **tín hiệu cảnh báo sớm quan trọng nhất** —
nó xuất hiện hàng tuần trước khi trễ tàu. Quy tắc để bắt nó có tồn tại trong mã,
và nó đang chết.

⚠️ Đây cũng là **dữ liệu giả**: một con số bịa được đưa vào một phép tính nghiệp
vụ. Nó vi phạm chính nguyên tắc "không bịa số" của dự án.

### 9.2 🔴 Hai màn hình PO có NĂNG LỰC KHÁC NHAU `[VERIFIED]`

| Năng lực | PO 360° *(thế hệ cũ)* | Command Center *(thế hệ mới)* |
|---|---|---|
| Lịch T&A | ✅ `tabs-planning.tsx:149-190` | ❌ không tham chiếu |
| Chặng mẫu | ✅ `tabs-planning.tsx:219-233` | ❌ chỉ đếm số lượt |
| Năm lát cắt vận hành | ❌ | ✅ |

Cả hai đều **mở được từ `md-client.tsx`** `[VERIFIED]`. Nghĩa là hôm nay người
dùng phải biết mở đúng màn hình mới thấy được thứ mình cần — và không có gì trên
giao diện nói cho họ biết điều đó.

⚠️ **Đính chính bản audit hôm qua.** Tôi từng ghi F22 *"`order_milestones` không
có màn hình"*. **Sai.** Nó có màn hình, trong thế hệ cũ. Vấn đề thật nghiêm trọng
hơn: chuyển sang thế hệ mới sẽ **mất** hai năng lực quan trọng nhất với nhà máy
gia công.

### 9.3 🟠 Hình thức gia công được lưu nhưng gần như không điều khiển gì `[VERIFIED]`

`order_type` xuất hiện ở 13 tệp, nhưng chỉ **một** chỗ dùng nó để rẽ nhánh:
`po.actions.ts:102` chọn mẫu T&A theo hình thức. Ngoài ra nó chỉ được lưu và
hiển thị.

Không có chỗ nào dùng nó để quyết định *có cần quy trình mua NPL hay không* —
tức khác biệt vận hành **lớn nhất** giữa CMT và FOB chưa được mã hoá.

### 9.4 🟠 Khâu thu tiền không tồn tại `[VERIFIED]`
Không `invoices`, không `payments`, không khấu trừ. Chuỗi giá trị dừng ở xuất hàng.

### 9.5 🟠 Không có luồng nhận NPL do khách cấp `[VERIFIED]`
Với đơn CMT — hình thức phổ biến nhất ở Việt Nam — đây là toàn bộ khâu đầu vào.

### 9.6 🟡 Tri thức ngành đang nằm ngoài sản phẩm `[VERIFIED]`
`lib/garment-math.ts` chứa công thức quy đổi vải, BOM, hao hụt, AQL, DHU, takt —
và **chỉ được gọi từ `md-legacy-client.tsx`, tệp không ai import**.

---

## 10. LỘ TRÌNH DỰNG LẠI

⚠️ Tôi cố ý **không** đề xuất viết lại. Bằng chứng cho thấy mô hình nghiệp vụ
phần lớn đúng; cái thiếu là **nối dây** và **bốn thực thể ở khâu thu tiền**.

| GĐ | Nội dung | Vì sao trước |
|---|---|---|
| **0** | Chạy truy vấn `pg_policies` ở Phản biện A | Một phút. Quyết định có phải dừng mọi thứ không |
| **1** | Sửa `late_milestones` — truy vấn thật thay hằng số 0 | Một quy tắc nghiệp vụ đang chết. Sửa xong là có cảnh báo sớm |
| **2** | Chốt MỘT màn hình PO; đưa T&A + mẫu vào thế hệ mới | Đang có hai sự thật song song |
| **3** | Rẽ nhánh quy trình theo `order_type`: CMT ≠ FOB | Khác biệt vận hành lớn nhất chưa được mã hoá |
| **4** | Thêm `material_receipts` cho đơn CMT | Khâu đầu vào của hình thức phổ biến nhất |
| **5** | Thêm `invoices` · `payments` · `chargebacks` | Khép chuỗi giá trị |
| **6** | Thống nhất bảy bộ từ vựng trạng thái | Cùng họ lỗi TD-03 |
| **7** | Nối lại `garment-math` | Tri thức ngành đã có sẵn, chỉ chưa dùng |

**Trước GĐ 1 cần bộ kiểm nghiệp vụ MD** (audit F3: hiện là 0 bài kiểm). Sửa
nghiệp vụ trên 19.058 dòng không có lưới an toàn là đi trong bóng tối.

---

## 11. NHỮNG CHỖ TÔI CÓ THỂ SAI — CẦN NGƯỜI VẬN HÀNH XÁC NHẬN

`[HYPOTHESIS]` Toàn bộ Mục 1.3 dựa trên hiểu biết ngành, không dựa trên quan sát
nhà máy của anh. Năm điểm cần người thật xác nhận:

1. Tỷ trọng CMT so với FOB trong đơn hàng thực tế của nhà máy?
2. Khách có chỉ định nhà cung cấp vải không, và ai chịu trách nhiệm khi họ trễ?
3. Một PO thường tách thành mấy đợt giao?
4. Khấu trừ sau giao hàng có phổ biến không, tính theo quy tắc nào?
5. Đơn vị hoạch định năng lực là phút-chuyền, hay số chuyền, hay số công nhân?

Nếu một trong năm điểm này khác với giả định của tôi, Mục 1 và Mục 5 phải sửa
trước khi đụng tới mã.
