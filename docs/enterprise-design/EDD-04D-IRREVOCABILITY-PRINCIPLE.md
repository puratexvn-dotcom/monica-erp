# EDD-04D · TU CHÍNH D
## NGUYÊN TẮC BẤT KHẢ THU HỒI
### Tám cơ chế phòng ngừa · Chuỗi bằng chứng trách nhiệm · Rà soát toàn bộ thiết kế

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-04D · Tu chính của [EDD-04B](EDD-04B-CONFIGURATION-GOVERNANCE-VERSIONING.md) |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Nguồn thẩm quyền** | `BDR-25` ✅ · 🔴 **Board nâng *"Dữ liệu đã tiết lộ ra ngoài là không thể thu hồi"* thành nguyên tắc thiết kế XUYÊN SUỐT** |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §0 · QUYẾT ĐỊNH ĐÃ HẤP THỤ

| Nội dung | Thi hành ở |
|---|---|
| Tenant chịu trách nhiệm cấu hình thuộc phạm vi mình | §3 |
| 🔴 **Monica ONE có trách nhiệm cung cấp ĐẦY ĐỦ 8 cơ chế phòng ngừa** | §2 |
| 🔴 **Cấu hình có khả năng rò `RESTRICTED` hoặc đổi mô hình bảo mật ⛔ KHÔNG được áp trực tiếp** — bắt buộc Preview · Validation · Approval · Audit | §4 |
| 🔴 **Nguyên tắc xuyên suốt: dữ liệu đã tiết lộ ⛔ không thu hồi được** | §1 · §5 |

> ### ⚠️ Board sửa đề xuất của tôi, và sửa đúng
>
> Tôi đề xuất bốn thay đổi rủi ro cao **phải qua Monica ONE duyệt**. Board thay bằng: **phải qua bốn cổng Preview · Validation · Approval · Audit** — nhưng ⛔ **không** đòi nhà cung cấp duyệt.
>
> Đây là mô hình trách nhiệm sạch hơn: **Monica ONE có nghĩa vụ CUNG CẤP CƠ CHẾ; tenant có nghĩa vụ DÙNG NÓ.** Đề xuất của tôi biến Monica ONE thành cổ chai cho 100 tenant, và tệ hơn — nó **chuyển trách nhiệm về phía nhà cung cấp**, làm tenant mất động lực thận trọng.

---
---

# §1 · NGUYÊN TẮC BẤT KHẢ THU HỒI

## 1.1 Phát biểu

> ### 🔴 `P-IRREV` · NGUYÊN TẮC BẤT KHẢ THU HỒI
>
> **Dữ liệu đã tiết lộ ra ngoài ranh giới của nó là KHÔNG THỂ THU HỒI.**
>
> ⛔ Xoá bản ghi ⛔ không thu hồi được điều người khác đã đọc.
> ⛔ Rút quyền ⛔ không thu hồi được tệp người khác đã tải.
> ⛔ Quay lui cấu hình ⛔ không thu hồi được thông tin đã hiện ra màn hình.
>
> ⇒ Với mọi luồng dữ liệu ra ngoài, **PHÒNG NGỪA là cơ chế duy nhất tồn tại. Phát hiện và khắc phục ⛔ không phải phương án dự phòng — chúng ⛔ không tồn tại.**

## 1.2 Sáu hệ luận — cái này mới là thứ dùng được

| # | Hệ luận | Nghĩa thi hành |
|---|---|---|
| `C1` | **Phòng ngừa > Phát hiện > Khắc phục** — và với tiết lộ, **khắc phục = 0** | Đầu tư vào cổng chặn trước, ⛔ không đầu tư vào cảnh báo sau |
| `C2` | 🔴 **Mặc định phải là KHÔNG TỒN TẠI, ⛔ không phải BỊ ẨN** | `DL-057` phép chiếu · `DL-064` *"che ⛔ không đủ, phải ⛔ không tồn tại"* |
| `C3` | **Mọi lần tiết lộ là một HÀNH VI có chủ ý, có người, có dấu vết** | ⛔ Không có tiết lộ nào xảy ra do quên cấu hình |
| `C4` | 🔴 **Bất đối xứng cổng chặn:** MỞ tiết lộ cần nhiều cổng hơn ĐÓNG tiết lộ | Đóng nhầm ⇒ khách phàn nàn. Mở nhầm ⇒ ⛔ không sửa được |
| `C5` | **Kiểm PHÉP CHIẾU, ⛔ không kiểm BỘ LỌC** | Chứng minh *"chứa đúng N trường"* là hữu hạn; chứng minh *"⛔ không lọt gì"* là vô hạn |
| `C6` | 🔴 **Phản hồi phải ĐỒNG NHẤT:** *"⛔ không tồn tại"* và *"⛔ không được xem"* phải ⛔ không phân biệt được | `DL-084`. Sự khác biệt của phản hồi **chính là** một kênh tiết lộ |
| `C7` | 🔴 **Quay lui khôi phục CẤU HÌNH, ⛔ không khôi phục BÍ MẬT** | §2.8 — hệ luận quan trọng nhất về mặt thực tế |

---
---

# §2 · TÁM CƠ CHẾ PHÒNG NGỪA — thi hành `BDR-25`

> 🔴 **Tám cơ chế này ⛔ không phải tám tính năng an toàn — chúng là ĐIỀU KIỆN để mô hình trách nhiệm của Board đứng vững.** Thiếu một cái, Monica ONE ⛔ không chứng minh được đã cung cấp đầy đủ.

## 2.1 ① PERMISSION VALIDATION — người này có được đổi thứ này không?

```
Kiểm TRƯỚC khi cho mở màn hình cấu hình, ⛔ không phải lúc bấm lưu:
├─ Capability: config.write:<level>          L1 · L2 · L3
├─ 🔴 Riêng L2 cần thêm: PartnerBoundaryAuthority
├─ Scope: chỉ cấu hình của tenant mình
├─ SoD: người đề xuất ≠ người duyệt (SOD-H01)
└─ ⛔ L3: TỪ CHỐI với mọi danh tính tenant · ⛔ TỪ CHỐI với ai_agent (AI-5)
```

⚠️ **Kiểm lúc mở, ⛔ không phải lúc lưu.** Cho người ta điền xong 20 trường rồi mới báo *"bạn ⛔ không có quyền"* là thiết kế tệ — và nó **đã tiết lộ cấu trúc cấu hình** cho người ⛔ không được biết.

## 2.2 ② IMPACT ANALYSIS — cái gì sẽ đổi, và **AI SẼ THẤY THÊM GÌ**

```
ConfigurationImpact  (tính TRƯỚC khi áp, ⛔ không phải sau)
├─ affected_objects        bao nhiêu đơn/assignment/lô bị ảnh hưởng
├─ 🔴 newly_disclosed_fields[]   ← TRỌNG TÂM: trường nào NAY hiện ra ngoài
├─ 🔴 newly_disclosed_to[]       ← những BÊN NÀO nay thấy được
├─ 🔴 disclosure_class_crossed   ← có vượt sang RESTRICTED không
├─ running_instances       thể hiện đang chạy có bị ảnh hưởng không (⛔ KHÔNG — DL-068)
├─ reverse_dependencies    workflow/rule/work-item nào phụ thuộc cấu hình này
└─ irreversibility_score   🔴 mở tiết lộ = KHÔNG ĐẢO NGƯỢC ĐƯỢC
```

**Ví dụ hiển thị:**

```
⚠️ PHÂN TÍCH TÁC ĐỘNG

Thay đổi: mở trường "đơn giá bán cho khách" cho cổng nhà thầu

🔴 3 trường mới hiện ra ngoài:  order_line.unit_price · order.currency · order.incoterm
🔴 12 nhà thầu sẽ thấy được
🔴 VƯỢT sang lớp RESTRICTED
🔴 KHÔNG ĐẢO NGƯỢC ĐƯỢC — dữ liệu hiện ra ⛔ không thu hồi lại được

⇒ Nhà thầu sẽ biết Monica bán cho khách bao nhiêu, trong khi họ nhận gia công 1,42 USD/pc.
```

> `DL-113` · **Phân tích tác động phải trả lời *"AI SẼ THẤY THÊM GÌ"*, ⛔ không chỉ *"cái gì đổi"*.**
> Một danh sách trường thay đổi ⛔ không cho người quản trị biết hậu quả. Một câu *"12 nhà thầu sẽ biết giá bán của bạn"* thì có.

## 2.3 ③ SECURITY WARNING — cảnh báo phải NÓI ĐƯỢC HẬU QUẢ

```
❌ VÔ DỤNG:  "Thay đổi này có thể ảnh hưởng bảo mật. Tiếp tục?"
✅ DÙNG ĐƯỢC:
   🔴 CẢNH BÁO BẢO MẬT — KHÔNG ĐẢO NGƯỢC ĐƯỢC

   Sau khi áp dụng, 12 nhà thầu sẽ thấy giá bán của bạn cho khách hàng.
   Họ có thể dùng thông tin này để đàm phán lại đơn giá gia công.

   ⛔ Quay lui KHÔNG xoá được điều họ đã đọc.

   Gõ "TÔI HIỂU" để tiếp tục:  [__________]
```

> `DL-114` · **Cảnh báo phải nêu HẬU QUẢ NGHIỆP VỤ CỤ THỂ, ⛔ không phải rủi ro trừu tượng** — và cảnh báo cho thay đổi ⛔ không đảo ngược được **bắt buộc gõ xác nhận**, ⛔ không phải một nút bấm.
> Lý do: nút bấm là phản xạ. Gõ chữ là hành vi có ý thức — và **nó là bằng chứng người đó đã đọc** *(§3)*.

## 2.4 ④ PREVIEW — nhìn bằng con mắt đối tác

```
🔴 XEM TRƯỚC BẰNG MẮT ĐỐI TÁC  (bắt buộc với mọi thay đổi L2)

┌─ Bạn đang xem như: Xưởng Phú Thịnh ──────────────┐
│  [ TRƯỚC ]              │  [ SAU ]                │
│  ASG-0148 · 6.200 pcs   │  ASG-0148 · 6.200 pcs   │
│  Đơn giá GC: 1,42 USD   │  Đơn giá GC: 1,42 USD   │
│                         │  🔴 Giá bán: 3,84 USD   │ ← MỚI HIỆN
└──────────────────────────────────────────────────┘
   ⛔ KHÔNG BẤM TIẾP ĐƯỢC nếu chưa cuộn hết danh sách trường mới
```

**Ba luật xem trước:**

| # | Luật |
|---|---|
| `PV-1` | 🔴 **So sánh TRƯỚC ⟷ SAU**, ⛔ không chỉ hiện kết quả sau |
| `PV-2` | 🔴 **Trường mới hiện ra được ĐÁNH DẤU ĐỎ** và đếm rõ |
| `PV-3` | 🔴 **Bắt buộc cuộn hết** danh sách trường mới trước khi bấm tiếp được |

## 2.5 ⑤ SIMULATION — chạy trên dữ liệu lịch sử thật

Kế thừa `DL-098`. Với cấu hình tiết lộ, mô phỏng trả lời:

```
Nếu áp dụng thay đổi này 90 ngày trước:
├─ 3.847 lượt truy cập của đối tác sẽ trả về thêm dữ liệu
├─ 12 nhà thầu × trung bình 6 đơn = 🔴 72 quan hệ giá bị lộ
├─ Giá trị đơn hàng liên quan: 2,1 triệu USD
└─ 🔴 Đối tác rủi ro nhất: xưởng Phú Thịnh — cũng làm cho 2 tenant khác
```

> `DL-115` · **Mô phỏng cấu hình tiết lộ chạy trên NHẬT KÝ TRUY CẬP THẬT**, ⛔ không phải dữ liệu giả — để con số *"72 quan hệ giá bị lộ"* là **thực tế đã từng xảy ra**, ⛔ không phải giả định.
> ⚠️ Mô phỏng chạy sandbox, ⛔ **không có đường nối tự động sang áp dụng** *(`DL-098`)*.

## 2.6 ⑥ APPROVAL WORKFLOW

```
Thay đổi L1  ─▶ người đề xuất + test case đạt ─▶ ÁP
Thay đổi L2  ─▶ người đề xuất
                ─▶ 🔴 người duyệt KHÁC, có PartnerBoundaryAuthority
                ─▶ bài kiểm phép chiếu đạt
                ─▶ ÁP có ngày hiệu lực
Thay đổi L2 RỦI RO CAO (§4)
             ─▶ đề xuất → preview bắt buộc → simulation bắt buộc
                → gõ xác nhận → 🔴 HAI người duyệt
                → 🔴 ĐỘ TRỄ 24 GIỜ trước khi có hiệu lực
                → ÁP
Thay đổi L3  ─▶ ⛔ TENANT KHÔNG LÀM ĐƯỢC · chỉ Monica ONE qua ADR
```

> `DL-116` · 🔴 **Độ trễ 24 giờ bắt buộc với thay đổi tiết lộ rủi ro cao.**
> Đây là cơ chế phòng ngừa **duy nhất còn tác dụng sau khi người ta đã bấm duyệt**: nó tạo ra một cửa sổ để ai đó nhận ra sai lầm **trước khi dữ liệu ra ngoài**. Sau khi có hiệu lực thì ⛔ không còn gì cứu được *(`C7`)*.
> Trong 24 giờ đó: thông báo cho CEO của tenant · huỷ được bằng một thao tác · hiện đếm ngược ở màn hình quản trị.

## 2.7 ⑦ AUDIT TRAIL

Ghi vào `ImmutableLog` dòng `AUDIT` *(`BDR-14`)*. Nội dung ở §3 — **đây là phần làm cho mô hình trách nhiệm đứng vững**.

## 2.8 ⑧ ROLLBACK — và giới hạn của nó phải nói thật

```
✅ Quay lui KHÔI PHỤC ĐƯỢC:
   · giá trị cấu hình
   · nội dung phép chiếu (trường lại biến mất khỏi cổng)
   · hành vi workflow/rule cho thể hiện MỚI

⛔ Quay lui KHÔNG KHÔI PHỤC ĐƯỢC:
   🔴 · điều đối tác ĐÃ ĐỌC trên màn hình
   🔴 · tệp đối tác ĐÃ TẢI VỀ
   🔴 · ảnh chụp màn hình đối tác ĐÃ LƯU
   🔴 · thông tin đối tác ĐÃ CHUYỂN CHO NGƯỜI KHÁC
```

> ### 🔴 `DL-117` · **Quay lui khôi phục CẤU HÌNH, ⛔ không khôi phục BÍ MẬT** — hệ luận `C7`
>
> Hệ quả thiết kế **quan trọng nhất** của toàn bộ tu chính này:
>
> **Với thay đổi tiết lộ, giá trị của Rollback gần bằng KHÔNG.** Toàn bộ giá trị nằm ở **năm cơ chế TRƯỚC khi áp** *(validation · impact · warning · preview · simulation)* và ở **độ trễ 24 giờ**.
>
> ⚠️ Vì vậy giao diện ⛔ **KHÔNG BAO GIỜ được nói *"đừng lo, có thể quay lui"*** với thay đổi tiết lộ. Câu đó **sai về mặt sự thật** và nó khiến người quản trị bấm duyệt dễ dãi hơn.
>
> Thay vào đó, màn hình phải nói: 🔴 **"Quay lui sẽ ẩn lại trường này, nhưng ⛔ KHÔNG xoá được điều 12 nhà thầu đã đọc trong thời gian nó mở."**

---
---

# §3 · CHUỖI BẰNG CHỨNG TRÁCH NHIỆM

## 3.1 🔴 Mô hình trách nhiệm chỉ đứng vững khi có bằng chứng

Board phát biểu: *"Nếu hệ thống đã thực hiện đầy đủ các cơ chế trên và Tenant vẫn chủ động áp dụng cấu hình dẫn đến lộ dữ liệu thì trách nhiệm thuộc Tenant."*

> **Mệnh đề này chỉ thi hành được nếu Monica ONE CHỨNG MINH ĐƯỢC đã cung cấp đầy đủ tám cơ chế — với thay đổi cụ thể đó, với con người cụ thể đó, vào thời điểm cụ thể đó.**
>
> ⇒ Tám cơ chế ⛔ **không chỉ là tính năng an toàn. Chúng là CHUỖI BẰNG CHỨNG.**

## 3.2 Bản ghi bắt buộc

```
ConfigurationChangeRecord   (bất biến · chuỗi băm · dòng AUDIT)
├─ tenant_id · level · config_key · before · after · effective_from
│
├─ 🔴 BẰNG CHỨNG ĐÃ CUNG CẤP CƠ CHẾ ─────────────────────────────
│   ① permission_validated_at · validated_capability
│   ② impact_analysis_id · 🔴 impact_snapshot  ← ĐÚNG bản đã hiện ra
│   ③ warning_shown_at · 🔴 warning_text_hash · warning_severity
│   ④ preview_viewed_at · preview_by · 🔴 preview_fields_scrolled: bool
│   ⑤ simulation_id · simulation_result_snapshot
│   ⑥ proposed_by · approved_by[] · 🔴 typed_confirmation: "TÔI HIỂU"
│   ⑦ (bản ghi này)
│   ⑧ rollback_available: bool · 🔴 rollback_limitation_acknowledged: bool
│
├─ 🔴 delay_window_start · delay_window_end   ← 24h với rủi ro cao
├─ cancelled_during_delay: bool
└─ prev_entry_hash · entry_hash
```

> `DL-118` · **Mọi cơ chế phòng ngừa phải để lại BẰNG CHỨNG ĐÃ ĐƯỢC HIỂN THỊ, ⛔ không chỉ bằng chứng đã được cấu hình.**
>
> Khác biệt quyết định: *"hệ thống có tính năng cảnh báo"* ⟷ 🔴 *"cảnh báo với nội dung chính xác này đã hiện cho anh Nguyễn Văn A lúc 14:02 và anh ấy gõ TÔI HIỂU lúc 14:03"*.
>
> Chỉ mệnh đề thứ hai mới chuyển được trách nhiệm. `warning_text_hash` và `preview_fields_scrolled` là hai trường nhỏ mang toàn bộ sức nặng pháp lý của `BDR-25`.

## 3.3 Cái Monica ONE **⛔ không** chuyển được trách nhiệm

Trung thực: mô hình này ⛔ **không** miễn trừ Monica ONE trong ba trường hợp:

| Trường hợp | Trách nhiệm |
|---|---|
| Cơ chế **có nhưng hỏng** *(phân tích tác động sai, xem trước hiện thiếu trường)* | 🔴 **Monica ONE** |
| Cấu hình **tầng L3** gây rò | 🔴 **Monica ONE** — tenant ⛔ không đụng được |
| Lỗi trong **phép chiếu tiết lộ** | 🔴 **Monica ONE** |
| Tenant được cảnh báo đầy đủ, vẫn áp | ✅ **Tenant** — đúng `BDR-25` |

⇒ **Bài kiểm phép chiếu `DP-3` và bài kiểm phân tích tác động trở thành nghĩa vụ pháp lý, ⛔ không chỉ nghĩa vụ kỹ thuật.**

---
---

# §4 · PHÂN LOẠI CẤU HÌNH RỦI RO CAO

## 4.1 Tiêu chí — thay cho danh sách tuỳ hứng

> 🔴 **Một thay đổi cấu hình là RỦI RO CAO khi nó làm dữ liệu ĐI TỪ TRONG RA NGOÀI một ranh giới tin cậy, và hậu quả ⛔ không đảo ngược được.**

```
if (thêm trường vào phép chiếu ngoài)     → RỦI RO CAO
if (vượt sang lớp RESTRICTED)             → 🔴 RỦI RO CAO NHẤT
if (đổi CustomerIdentityDisclosure lên)   → RỦI RO CAO
if (đổi mô hình bảo mật/SoD/scope)        → 🔴 L3 — TENANT ⛔ KHÔNG LÀM ĐƯỢC
if (bỏ trường khỏi phép chiếu ngoài)      → thường  ← C4 bất đối xứng
if (đổi ngưỡng/SLA/nhãn nội bộ)           → thường
```

## 4.2 Danh sách rủi ro cao — bắt buộc 4 cổng + 24h

| # | Thay đổi | Hậu quả nếu sai |
|---|---|---|
| `HR-1` | 🔴 Mở **bất kỳ trường lớp `RESTRICTED`** cho bất kỳ cổng nào | Lộ chiết tính · biên LN · giá vốn · lương |
| `HR-2` | 🔴 Đổi `CustomerIdentityDisclosure`: `HIDDEN → PARTIAL/DISCLOSED` | Nhà thầu tiếp cận khách trực tiếp ⇒ **Monica bị loại khỏi chuỗi** |
| `HR-3` | 🔴 Thêm trường mới vào **bất kỳ phép chiếu đối tác nào** | Tuỳ trường |
| `HR-4` | 🔴 Mở **bằng chứng nội bộ** cho khách ngoài luồng `DisputeCase` | Tự tố cáo mình |
| `HR-5` | 🔴 Bật **`RAW_COORDINATES`** trong hồ sơ thu nhận bằng chứng | Tạo dấu vết vị trí người lao động |
| `HR-6` | 🔴 Bật **`benchmark_consent`** | Dữ liệu vận hành vào tập tổng hợp liên doanh nghiệp |
| `HR-7` | 🔴 Mở **KPI so sánh/xếp hạng** cho cổng nhà thầu | Lộ cấu trúc mạng lưới nhà thầu |
| `HR-8` | 🔴 Đổi `language_of_record` của hợp đồng đang hiệu lực | Đổi bản có giá trị pháp lý |
| `HR-9` | 🔴 **Tắt bất kỳ bài kiểm phép chiếu nào** | ⛔ **KHÔNG CHO PHÉP — nâng lên L3** |

⚠️ `HR-9` tôi **nâng lên L3** *(tenant ⛔ không làm được)*: tắt bài kiểm an toàn ⛔ không phải một cấu hình nghiệp vụ — nó là **vô hiệu hoá chính cơ chế phòng ngừa mà `BDR-25` bắt Monica ONE phải cung cấp**. Cho phép tắt là tự phá vỡ mô hình trách nhiệm.

---
---

# §5 · 🔴 RÀ SOÁT TOÀN BỘ THIẾT KẾ THEO `P-IRREV`

Board nâng nguyên tắc lên tầm xuyên suốt ⇒ tôi rà lại **112 quyết định** để tìm chỗ chưa áp.

## 5.1 Chín chỗ đã áp đúng — xác nhận

| Quyết định | Áp `P-IRREV` thế nào |
|---|---|
| `DL-057` phép chiếu tiết lộ | `C2` · `C5` — vai ngoài ⛔ không chạm bảng gốc |
| `DL-064` *"che ⛔ không đủ, phải ⛔ không tồn tại"* | `C2` |
| `DL-020` mặc định `INTERNAL_ONLY` | `C2` · `C3` |
| `DL-063` che danh tính khách mặc định | `C2` · `C4` |
| `DL-084` luồng lời mời, phản hồi đồng nhất | `C6` |
| `DL-092` QR chỉ định danh mờ | `C1` — thẻ bó rời khỏi nhà máy ⛔ không thu hồi |
| `DL-105` phán quyết vùng thay toạ độ | `C1` — ⛔ không tạo dữ liệu để về sau bị đòi |
| `DL-075` nhật ký AI tham chiếu ⛔ không bản sao | `C2` |
| `DL-072` AI kế thừa mức tiết lộ cao nhất | `C2` |

## 5.2 🔴 NĂM CHỖ CHƯA ÁP — phát hiện mới, đóng ngay

### `GAP-1` · CHỈ MỤC TÌM KIẾM — kênh rò kinh điển

```
🔴 Vấn đề: chỉ mục tìm kiếm chứa NỘI DUNG của bản ghi.
   Nếu chỉ mục ⛔ không phân vùng theo phân loại, một truy vấn có thể
   trả về ĐOẠN TRÍCH từ bản ghi mà người tìm ⛔ không được xem —
   ngay cả khi bấm vào thì bị chặn.

Ví dụ: nhân viên kho gõ "biên lợi nhuận" → kết quả hiện
       "CST-114 … margin 12,4% …"  ← 🔴 ĐÃ RÒ, dù bấm vào bị chặn
```

> `DL-119` · 🔴 **Chỉ mục tìm kiếm phân vùng theo `disclosure_class` và theo 6 chiều phạm vi. Đoạn trích ⛔ KHÔNG BAO GIỜ hiện nội dung ngoài phạm vi người tìm.**
> Vai ngoài tìm kiếm trên **chỉ mục riêng dựng từ phép chiếu**, ⛔ không phải chỉ mục nội bộ có bộ lọc. Cùng lập luận `DL-057`.

### `GAP-2` · XUẤT DỮ LIỆU — ra khỏi hệ thống là ra khỏi mọi kiểm soát

```
🔴 Vấn đề: một tệp Excel xuất ra ⛔ KHÔNG CÓ mô hình phân quyền.
   Xuất xong là gửi được cho bất kỳ ai, mãi mãi.
   Đây là ca thuần khiết nhất của P-IRREV, và tôi CHƯA thiết kế nó.
```

> `DL-120` · **Xuất dữ liệu là một HÀNH VI TIẾT LỘ, phải qua cổng như mọi tiết lộ khác.**
> ├─ Mọi lượt xuất ghi Audit Log: ai · trường gì · bao nhiêu dòng · lý do
> ├─ Tệp xuất **đóng dấu chìm**: người xuất · thời điểm · tenant
> ├─ Xuất chứa trường `RESTRICTED` ⇒ 🔴 **cảnh báo + gõ xác nhận**
> └─ Vai ngoài: ⛔ **⛔ KHÔNG có năng lực xuất hàng loạt** — chỉ tải chứng từ được cấp
>
> ⚠️ **Xuất `RESTRICTED` có nên chặn hẳn ⛔ không → `BDR-26`** *(§6)*

### `GAP-3` · NỘI DUNG THÔNG BÁO — rò trên màn hình khoá

```
🔴 Vấn đề: thông báo đẩy hiện trên MÀN HÌNH KHOÁ, ai cầm điện thoại cũng thấy.
   Email đi qua hạ tầng Monica ⛔ không kiểm soát.

   "PO-2588 Zara: biên lợi nhuận 12,4% dưới ngưỡng"
        ▲ đã rò tên khách + biên lợi nhuận, ⛔ chưa cần đăng nhập
```

> `DL-121` · **Nội dung thông báo mang `disclosure_class` riêng, luôn THẤP HƠN HOẶC BẰNG nội dung nó trỏ tới.**
> ├─ Thông báo trỏ tới dữ liệu `RESTRICTED` ⇒ 🔴 **chỉ được nói *"Có việc cần bạn xử lý"***
> ├─ ⛔ **Không bao giờ đưa số liệu, tên khách, giá vào tiêu đề thông báo hay dòng chủ đề email**
> └─ Email ra ngoài: **liên kết về Portal**, ⛔ không nhúng nội dung *(đã có ở EDD-02, nay nâng thành luật chung)*

### `GAP-4` · THÔNG BÁO LỖI PHÂN BIỆT — `C6` chưa áp toàn hệ thống

```
🔴 Vấn đề: DL-084 áp C6 cho luồng thêm đối tác. Nhưng nó là vấn đề TOÀN HỆ THỐNG.

❌ "Chiết tính CST-114 — bạn ⛔ không có quyền xem"   → xác nhận CST-114 TỒN TẠI
✅ "⛔ Không tìm thấy"                                  → ⛔ không phân biệt được
```

> `DL-122` · 🔴 **Toàn hệ thống: *"⛔ không tồn tại"* và *"⛔ không được xem"* trả về PHẢN HỒI ĐỒNG NHẤT** — cùng mã lỗi, cùng câu chữ, **cùng thời gian phản hồi**.
> ⚠️ Kể cả **thời gian phản hồi** — kiểm quyền nhanh hơn kiểm tồn tại là một kênh rò qua độ trễ.
> Nhật ký nội bộ vẫn ghi phân biệt rõ, cho điều tra.

### `GAP-5` · KẾT QUẢ MÔ PHỎNG — kế thừa mức tiết lộ

```
🔴 Vấn đề: DL-098 cho phép mô phỏng trên dữ liệu lịch sử THẬT.
   Một quản trị viên ⛔ không có quyền RESTRICTED chạy mô phỏng
   "nếu hạ ngưỡng biên LN" → kết quả CHỨA phân bố biên lợi nhuận.
   ⛔ Chưa có luật nào chặn.
```

> `DL-123` · **Kết quả mô phỏng kế thừa mức tiết lộ CAO NHẤT của dữ liệu nó đọc** — cùng luật với AI *(`DL-072`)*.
> Người ⛔ không có quyền `RESTRICTED` chạy mô phỏng chạm dữ liệu `RESTRICTED` ⇒ **chỉ thấy kết quả tổng hợp ⛔ không suy ra được số gốc**, hoặc bị chặn hẳn.

## 5.3 Tổng kết rà soát

| | Số |
|---|---|
| Quyết định đã rà | **112** |
| Đã áp `P-IRREV` đúng | **9 chỗ trọng yếu** — xác nhận |
| 🔴 **Khoảng trống phát hiện** | **5** |
| Đã đóng trong tu chính này | **5** — `DL-119` … `DL-123` |

> 🔴 **Bốn trong năm khoảng trống *(tìm kiếm · xuất dữ liệu · thông báo · thông báo lỗi)* là các kênh rò ⛔ KHÔNG lộ ra khi kiểm phân quyền bảng thông thường.** Chúng rò qua **chỉ mục · tệp · tiêu đề · sự khác biệt của phản hồi** — bốn thứ nằm ngoài mô hình quyền cấp bảng.
>
> Đây là giá trị thật của việc Board nâng `P-IRREV` thành nguyên tắc xuyên suốt: **nó buộc rà những chỗ mô hình quyền ⛔ không nhìn tới.**

---

# §6 · DECISION LOG — 11 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-113` | **Phân tích tác động trả lời *"AI SẼ THẤY THÊM GÌ"*** | Danh sách trường ⛔ không cho biết hậu quả | ✅ |
| `DL-114` | **Cảnh báo nêu hậu quả nghiệp vụ cụ thể + gõ xác nhận** với thay đổi ⛔ không đảo ngược | Nút bấm là phản xạ; gõ chữ là hành vi có ý thức **và là bằng chứng** | ✅ |
| `DL-115` | **Mô phỏng cấu hình chạy trên nhật ký truy cập THẬT** | Con số phải là thực tế đã xảy ra | ✅ |
| `DL-116` | 🔴 **Độ trễ 24 giờ với thay đổi tiết lộ rủi ro cao** | Cơ chế **duy nhất** còn tác dụng sau khi đã bấm duyệt | ⚠️ |
| `DL-117` | 🔴 **Quay lui khôi phục CẤU HÌNH, ⛔ không khôi phục BÍ MẬT** · ⛔ giao diện KHÔNG được nói *"có thể quay lui"* | Câu đó **sai sự thật** và khiến người ta duyệt dễ dãi | 🔴 rất khó |
| `DL-118` | 🔴 **Cơ chế phòng ngừa để lại bằng chứng ĐÃ HIỂN THỊ, ⛔ không chỉ đã cấu hình** | Chỉ mệnh đề *"cảnh báo này đã hiện cho người này lúc này"* mới chuyển được trách nhiệm | 🔴 rất khó |
| `DL-119` | 🔴 **Chỉ mục tìm kiếm phân vùng theo phân loại; vai ngoài dùng chỉ mục riêng** | `GAP-1` — đoạn trích rò dù bấm vào bị chặn | ⚠️ |
| `DL-120` | 🔴 **Xuất dữ liệu là HÀNH VI TIẾT LỘ** — audit · đóng dấu chìm · cảnh báo · vai ngoài ⛔ không xuất hàng loạt | `GAP-2` — ca thuần khiết nhất của `P-IRREV` | ⚠️ |
| `DL-121` | 🔴 **Nội dung thông báo có `disclosure_class` riêng** — ⛔ không đưa số liệu/tên khách vào tiêu đề | `GAP-3` — màn hình khoá ⛔ không cần đăng nhập | ✅ |
| `DL-122` | 🔴 **Toàn hệ thống: phản hồi đồng nhất** giữa *"⛔ không tồn tại"* và *"⛔ không được xem"* — kể cả **thời gian phản hồi** | `GAP-4` — `C6` áp toàn cục | ⚠️ |
| `DL-123` | **Kết quả mô phỏng kế thừa mức tiết lộ cao nhất** | `GAP-5` — cùng luật `DL-072` | ✅ |

**Cộng dồn EDD-01 → 04D: 123 quyết định.**
🔴 **`P-IRREV` được ghi nhận là NGUYÊN TẮC THIẾT KẾ XUYÊN SUỐT**, đứng ngang hàng với ranh giới bất-biến ⟷ cấu-hình-được của EDD-01 §1.3.1.

---

# §7 · BOARD DECISION REQUIRED — 1

## `BDR-26` · XUẤT DỮ LIỆU `RESTRICTED` — chặn hay cho phép có kiểm soát?

**Vấn đề.** `GAP-2` phơi ra ca thuần khiết nhất của `P-IRREV`: **một tệp Excel xuất ra ⛔ không có mô hình phân quyền.** Nhưng CEO, CFO và Cost Controller **sẽ muốn** đưa số liệu biên lợi nhuận vào Excel để phân tích và họp — đó là công việc hằng ngày của họ.

| | **A · CHẶN HẲN xuất dữ liệu `RESTRICTED`** | **B · Cho phép có kiểm soát** |
|---|---|---|
| **Cách làm** | Chiết tính · biên LN · giá vốn · lương **⛔ không xuất được** dưới mọi hình thức. Muốn phân tích thì làm trong hệ thống | Xuất được nhưng: cảnh báo + gõ xác nhận · đóng dấu chìm *(người xuất · thời điểm)* · ghi Audit Log · giới hạn số dòng · thông báo CEO |
| **Ưu** | 🔴 **Áp `P-IRREV` triệt để** — bí mật thương mại nhạy cảm nhất ⛔ không rời hệ thống · ⛔ không có tệp nào để rò | Người dùng làm được việc · công cụ phân tích tự do · đóng dấu chìm **truy được nguồn rò** |
| **Nhược** | 🔴 **Rất khó chịu** — CEO ⛔ không đưa số vào slide họp được. Và **người dùng sẽ tìm đường vòng**: chụp màn hình, gõ tay sang Excel ⇒ mất luôn dấu vết | 🔴 Một tệp ra ngoài là **vĩnh viễn**. Đóng dấu chìm chỉ **truy được sau khi đã rò**, ⛔ không ngăn được |
| **Với Monica** | Monica nhỏ, họp trực tiếp — ⛔ khả thi nhưng gây khó cho kế toán | Thực tế hơn |
| **Với 100 khách** | 🔴 Tập đoàn lớn **⛔ sẽ không chấp nhận** — họ có quy trình phân tích riêng | ✅ Bán được |

> **Khuyến nghị: PHƯƠNG ÁN B**, với bốn ràng buộc — nhưng tôi trình vì đây là **áp dụng trực tiếp nguyên tắc Board vừa nâng lên tầm xuyên suốt**, và tôi ⛔ không nên tự quyết một ngoại lệ cho chính nguyên tắc đó.
>
> ① **Đóng dấu chìm bắt buộc** — mọi trang, mọi sheet: người xuất · thời điểm · tenant *(⇒ tệp rò ra truy được về một người)*
> ② **Gõ xác nhận + ghi lý do**
> ③ **Thông báo CEO/CFO của tenant** ngay khi có lượt xuất `RESTRICTED`
> ④ 🔴 **Vai ngoài: chặn hẳn, ⛔ không có ngoại lệ**
>
> Lý do nghiêng về B: **phương án A ⛔ không thật sự chặn được — nó chỉ đẩy hành vi ra ngoài tầm quan sát.** Người ta sẽ chụp màn hình. Khi đó Monica ONE mất **cả dữ liệu lẫn dấu vết**, tức là **tệ hơn** phương án B trên cả hai mặt.
>
> ⚠️ **Chỗ tôi có thể sai:** nếu Board coi biên lợi nhuận và giá vốn là bí mật ở mức mà **⛔ không ai được cầm ra khỏi hệ thống dù có dấu vết**, thì A đúng — và ta chấp nhận sự bất tiện như một cái giá có chủ ý.

**🔲 Board chọn: A · B-với-4-ràng-buộc · B-khác**

---

# §8 · TÓM TẮT

## 8.1 Đã bàn giao

| § | Nội dung |
|---|---|
| **1** | 🔴 **`P-IRREV`** — phát biểu + **7 hệ luận thi hành được** |
| **2** | **Tám cơ chế phòng ngừa** thiết kế đầy đủ + độ trễ 24h + giới hạn thật của Rollback |
| **3** | 🔴 **Chuỗi bằng chứng trách nhiệm** — và ba chỗ Monica ONE ⛔ không chuyển được trách nhiệm |
| **4** | Tiêu chí + **9 loại cấu hình rủi ro cao**; `HR-9` nâng lên L3 |
| **5** | 🔴 **Rà soát 112 quyết định — phát hiện và đóng 5 khoảng trống** |

**Quyết định tự ra:** 11 *(cộng dồn 123)* · **Cần Board quyết:** 1

## 8.2 Ba điểm đáng nhớ nhất

| # | Điểm |
|---|---|
| **1** | 🔴 **Với thay đổi tiết lộ, Rollback gần như VÔ GIÁ TRỊ.** Toàn bộ giá trị nằm ở năm cổng TRƯỚC khi áp và độ trễ 24 giờ. Vì vậy giao diện ⛔ **KHÔNG BAO GIỜ được nói *"đừng lo, có thể quay lui"*** — câu đó **sai về sự thật** và nó khiến người quản trị bấm duyệt dễ dãi hơn |
| **2** | 🔴 **Tám cơ chế ⛔ không phải tính năng an toàn — chúng là CHUỖI BẰNG CHỨNG.** Mô hình trách nhiệm của `BDR-25` chỉ đứng vững nếu Monica ONE chứng minh được *"cảnh báo với nội dung CHÍNH XÁC NÀY đã hiện cho anh A lúc 14:02, và anh ấy gõ TÔI HIỂU lúc 14:03"*. `warning_text_hash` và `preview_fields_scrolled` là hai trường nhỏ mang toàn bộ sức nặng pháp lý |
| **3** | 🔴 **Bốn trong năm khoảng trống phát hiện được — tìm kiếm · xuất dữ liệu · thông báo · thông báo lỗi — là kênh rò KHÔNG lộ ra khi kiểm phân quyền bảng.** Chúng rò qua **chỉ mục · tệp · tiêu đề · sự khác biệt của phản hồi**. Đây chính là giá trị của việc Board nâng `P-IRREV` thành nguyên tắc xuyên suốt: **nó buộc rà những chỗ mô hình quyền ⛔ không nhìn tới** |

## 8.3 Trạng thái

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

**Tiếp theo:** EDD-05 — Phase 11 Workspace · Work Inbox · Dashboard · Executive Center · Phase 12 Module Architecture.

---

## THAM CHIẾU

- **Board Decision `BDR-25`** ✅ — 8 cơ chế phòng ngừa · nguyên tắc bất khả thu hồi
- [EDD-04B](EDD-04B-CONFIGURATION-GOVERNANCE-VERSIONING.md) — ba tầng cấu hình L1·L2·L3
- [EDD-03](EDD-03-DOCUMENT-INFORMATION-ARCHITECTURE.md) — `DL-057` phép chiếu · 6 lớp phân loại
- [EDD-03A](EDD-03A-PARTNER-PORTAL-ARCHITECTURE.md) — `DL-063` · `DL-064` · `SP-1`…`SP-4`
- [EDD-04](EDD-04-WORKFLOW-RULE-PERMISSION.md) — `BDR-14` Audit Log bất biến · `DL-073` neo băm ra ngoài
- [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) Điều 40 *(Security · Default Deny · Defense in Depth)*
