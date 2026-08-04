# EDD-04G · TU CHÍNH G
## NGUYÊN TẮC KHÔNG NHẬP TRÙNG · CỔNG KIỂM THIẾT KẾ NĂM NGUYÊN TẮC

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-04G · Tu chính xuyên suốt · **tiền đề bắt buộc của EDD-05** |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Nguồn thẩm quyền** | 🔴 **Board Additional Direction — `P-ZERODUP`** · chỉ thị *"mọi màn hình trong EDD-05 phải kiểm theo nguyên tắc này"* |
| **Board Decision Required** | **0** |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §1 · HÌNH THỨC HOÁ `P-ZERODUP`

## 1.1 Phát biểu

> ### 🔴 `P-ZERODUP` · NGUYÊN TẮC KHÔNG NHẬP TRÙNG
>
> **Một dữ liệu chỉ được TẠO một lần. Sau đó toàn hệ thống KẾ THỪA.**
>
> Nếu một dữ liệu đang được nhập lần thứ hai, câu hỏi đúng là:
> 🔴 **"Tại sao dữ liệu này chưa được kế thừa?"**
> ⛔ **Không** phải: *"Tạo thêm màn hình nhập."*
>
> **Nhập trùng là LỖI THIẾT KẾ, ⛔ không phải lỗi người dùng.**

## 1.2 🔴 Làm rõ bắt buộc — nếu ⛔ không, nguyên tắc này sẽ bị áp sai

Đọc chữ *"một dữ liệu chỉ được tạo một lần"* theo nghĩa **chuẩn hoá cơ sở dữ liệu** sẽ **phá vỡ nhiều quyết định đã duyệt**:

| Quyết định đã duyệt | Có lưu giá trị "trùng" ⛔ không? | Vì sao **đúng** |
|---|---|---|
| `DL-041` chụp biên LN vào bản ghi phê duyệt | ✅ có | Bằng chứng *"người duyệt đã thấy gì"* — Điều 8 |
| `DL-047` lưu số tiền ở cả 3 tiền tệ | ✅ có | Tỷ giá lúc đó là **sự kiện**, ⛔ không phải phép tính |
| `DL-097` bản ghi đánh giá lưu giá trị tham số | ✅ có | Tái hiện *"vì sao 12/07 qua cổng"* |
| Chứng từ pháp lý đóng băng địa chỉ, giá | ✅ có | Chứng từ ⛔ không đổi theo dữ liệu chủ |

> ### 🔴 `DL-138` · **`P-ZERODUP` nói về CÔNG SỨC CON NGƯỜI, ⛔ không nói về chuẩn hoá dữ liệu.**
>
> ```
> ❌ CẤM:  con người GÕ LẠI thứ đã tồn tại
> ✅ CHO:  hệ thống LƯU LẠI giá trị đó, có nguồn gốc, để phục vụ bằng chứng
> ```
>
> **Ba dạng lưu lại đều hợp lệ:**
>
> | Dạng | Nghĩa | Ví dụ |
> |---|---|---|
> | **Kế thừa** | hệ thống mang sang, người **xác nhận** | Order lấy giá từ Quotation đã duyệt |
> | **Ảnh chụp** | đóng băng giá trị + tham chiếu nguồn + phiên bản | `approval_snapshot` · địa chỉ trên hoá đơn |
> | **Chiếu** | tính lại từ nguồn, ⛔ không lưu | % hoàn thành · năng lực khả dụng |
>
> 🔴 **Cả ba đều ⛔ KHÔNG có bàn phím con người trong đó. Đó mới là điều `P-ZERODUP` đòi.**

## 1.3 `P-ZEROMAN` ⟷ `P-ZERODUP` — hai lỗi khác nhau, hai cách sửa khác nhau

```
P-ZEROMAN  ── dữ liệu CHƯA TỒN TẠI
              "làm sao THU NHẬN mà ⛔ không gõ?"
              ▶ Lỗi ở tầng: THU NHẬN
              ▶ Sửa bằng: QR · camera · AI Vision · OCR · voice
              ▶ Là lỗi TRẢI NGHIỆM

P-ZERODUP  ── dữ liệu ĐÃ TỒN TẠI ở nơi khác
              "tại sao chưa KẾ THỪA được?"
              ▶ Lỗi ở tầng: 🔴 MÔ HÌNH · RANH GIỚI · LUỒNG
              ▶ Sửa bằng: nối quan hệ · dựng read-model · mang ngữ cảnh qua bước
              ▶ 🔴 Là lỗi KIẾN TRÚC
```

> `DL-139` · 🔴 **Mỗi ca nhập trùng là một CHỈ ĐIỂM CHẨN ĐOÁN cho một khuyết tật kiến trúc.**
>
> Người dùng đang gõ lại một thứ đã có nghĩa là **đúng một trong bốn điều sau đang sai**:
>
> | # | Khuyết tật | Dấu hiệu |
> |---|---|---|
> | `A1` | **Mô hình thiếu quan hệ** — hai đối tượng ⛔ không nối được | phải gõ mã để liên kết |
> | `A2` | **Ranh giới Domain vẽ sai** — dữ liệu ở Domain ⛔ không đọc được | phải chép qua |
> | `A3` | **Thiếu read-model** — dữ liệu có nhưng ⛔ không truy vấn được ở ngữ cảnh này | phải tra rồi gõ |
> | `A4` | **Workflow ⛔ không mang ngữ cảnh sang bước sau** | mỗi bước bắt đầu lại từ trắng |
>
> ⇒ Vì vậy chỉ thị của Joseph *"đó là lỗi thiết kế"* đúng **theo nghĩa đen về mặt kỹ thuật**: sửa bằng cách thêm một màn hình tiện hơn là **chữa triệu chứng**; phải sửa một trong bốn khuyết tật trên.

## 1.4 Sáu dạng nhập trùng — phân loại để nhận diện

| # | Dạng | Nghĩa | Ví dụ trong ngành may |
|---|---|---|---|
| `D1` | **Trùng theo thời gian** | cùng dữ liệu, hai thời điểm | sản lượng theo giờ → **báo cáo ngày** |
| `D2` | **Trùng chéo Domain** | cùng sự kiện, hai Domain ghi | thông số TechPack *(D3)* → **QC gõ lại khi kiểm** *(D7)* |
| `D3` | 🔴 **Trùng chéo BÊN** | đối tác đã nhập, Monica nhập lại | nhà thầu báo sản lượng → **Monica gõ lại vào sổ sản xuất** |
| `D4` | **Trùng chéo chứng từ** | cùng trường trên nhiều chứng từ | địa chỉ trên PO · packing list · hoá đơn |
| `D5` | **Tính lại bằng tay** | người tự cộng rồi gõ kết quả | tổng số lượng · tổng tiền · % hoàn thành |
| `D6` | 🔴 **Trùng vòng lặp** | dữ liệu ra ngoài rồi quay về, nhập lại | NCC xác nhận ngày giao qua email → **Monica gõ vào PO** |

> 🔴 **`D3` và `D6` là hai dạng bị bỏ quên nhiều nhất**, và chúng là hai dạng **tốn công nhất** — vì chúng nhân đôi công sức giữa **hai tổ chức**, ⛔ không phải trong một tổ chức.

---
---

# §2 · CỔNG KIỂM THIẾT KẾ NĂM NGUYÊN TẮC

Joseph yêu cầu dùng các nguyên tắc như **danh mục kiểm rà từng màn hình**. Tôi hình thức hoá thành cổng bắt buộc.

## 2.1 Năm câu hỏi — 🔴 THỨ TỰ QUAN TRỌNG

```
┌─ Q1 · P-ZERODUP ────────────────────────────────────────────────┐
│  "Dữ liệu này ĐÃ TỒN TẠI ở đâu đó trong hệ thống chưa?"          │
│    CÓ  ▶ 🔴 KẾ THỪA. ⛔ DỪNG — ⛔ không hỏi Q2                    │
│    ⛔ CHƯA ▶ xuống Q2                                            │
├─ Q2 · P-ZEROMAN ────────────────────────────────────────────────┤
│  "Có cách nào THU NHẬN mà ⛔ không gõ?"                          │
│    ▶ thang 7 bậc — cấu trúc: ①→⑦ · tự sự: VOICE trước           │
├─ Q3 · P-COMMIT ─────────────────────────────────────────────────┤
│  "Đây là SỰ KIỆN hay QUYẾT ĐỊNH?"                                │
│    SỰ KIỆN   ▶ tự động tối đa · ≤ 3 chạm                         │
│    QUYẾT ĐỊNH ▶ 🔴 ma sát CÓ CHỦ Ý · ⛔ KHÔNG áp Q1 Q2           │
├─ Q4 · P-IRREV ──────────────────────────────────────────────────┤
│  "Màn hình này có làm lộ thứ ⛔ không thu hồi được ⛔ không?"      │
│    CÓ ▶ 8 cơ chế phòng ngừa · mặc định ⛔ không tồn tại          │
├─ Q5 · P-ATTRIB ─────────────────────────────────────────────────┤
│  "Chỗ ⛔ không ngăn được, có quy trách nhiệm được ⛔ không?"       │
│    ▶ dấu chìm màn hình · nhật ký · bằng chứng                    │
│    ⛔ không quy được ▶ GHI NHẬN RỦI RO CÒN LẠI, ⛔ không kiểm soát giả │
└─────────────────────────────────────────────────────────────────┘
```

> `DL-140` · 🔴 **Q1 phải hỏi TRƯỚC Q2.**
> Nếu hỏi Q2 trước, người thiết kế sẽ đi tìm cách **quét mã cho một thứ ⛔ không cần thu nhận** — tốn công dựng một cơ chế thu nhận thay vì **nối một quan hệ**.
> Đây là lý do `P-ZERODUP` là mảnh ghép Joseph bổ sung đúng: ⛔ không có nó, `P-ZEROMAN` sẽ **tối ưu hoá sai bài toán**.

## 2.2 Hồ sơ cổng kiểm — bắt buộc kèm mọi đặc tả màn hình

```
ScreenDesignGate
├─ screen_id · fields[]
├─ mỗi trường trả lời:
│    q1_exists_elsewhere: bool → nếu CÓ: source_object · inheritance_mode
│    q2_capture_tier: 1..8    → nếu 8 (nhập tay): 🔴 justification BẮT BUỘC
│    q3_nature: FACT | DECISION
│    q4_disclosure_class · irreversible: bool
│    q5_attribution_mechanism
├─ 🔴 manual_field_count · duplicate_field_count
└─ 🔴 ⛔ KHÔNG DUYỆT ĐƯỢC nếu duplicate_field_count > 0
      hoặc có trường bậc 8 mà ⛔ không có justification
```

| Chỉ số | Mục tiêu | Xử lý khi vi phạm |
|---|---|---|
| `duplicate_field_count` | 🔴 **= 0 tuyệt đối** | ⛔ **⛔ Không duyệt thiết kế** — phải sửa một trong 4 khuyết tật `DL-139` |
| `manual_field_count` | giảm dần mỗi bản phát hành | Cần giải trình từng trường |
| `tap_count_p90` | ≤ 3 với tác vụ tần suất cao | Đưa vào danh sách phải sửa |

---
---

# §3 · 🔴 RÀ SOÁT THIẾT KẾ ĐÃ CÓ THEO `P-ZERODUP`

Tôi rà lại EDD-01…04F và tìm **tám ca nhập trùng**, kèm khuyết tật kiến trúc tương ứng.

| # | Ca nhập trùng | Dạng | Khuyết tật | 🔴 Sửa bằng |
|---|---|---|---|---|
| `ZD-1` | **Báo cáo ngày nhà thầu** — đã nhập theo giờ, lại nhập tổng ngày | `D1` | `A4` workflow ⛔ không mang ngữ cảnh | ✅ **đã sửa** ở `DL-128` — nay phân loại lại đúng là vi phạm `P-ZERODUP`, ⛔ không phải `P-ZEROMAN` |
| `ZD-2` | 🔴 **Thông số đo khi kiểm hàng** — QC gõ lại thông số chuẩn từ TechPack | `D2` | `A3` thiếu read-model giữa D3 và D7 | `Inspection.Measurement` **kế thừa** `spec_value` từ `TechPackVersion`; QC **chỉ nhập số đo THỰC** — và số đo thực cũng có thể từ thiết bị đo |
| `ZD-3` | 🔴 **Sản lượng nhà thầu** — nhà thầu báo qua Portal, Monica gõ vào sổ sản xuất | `D3` | `A2` ranh giới trong/ngoài vẽ sai | 🔴 **Bản ghi nhà thầu nhập CHÍNH LÀ `StageThroughput`**, `data_origin = PARTNER_REPORTED`. ⛔ Không có bước chép. Đây là `DL-031` *(chuyền nhà thầu cũng là `WorkCenter`)* phát huy tác dụng |
| `ZD-4` | 🔴 **Ngày giao NCC xác nhận** — NCC xác nhận trên Portal, Monica gõ vào PO | `D6` | `A4` | `SupplierAcknowledgement` **cập nhật thẳng** `POLine.confirmed_delivery`, Monica chỉ **xác nhận chênh lệch** |
| `ZD-5` | **Kế hoạch kiểm** — gõ lại chặng kiểm từ yêu cầu của khách | `D2` | `A1` thiếu quan hệ | `InspectionPlan` **sinh từ** `CustomerRequirement (B05)`, sửa được nhưng ⛔ không nhập lại |
| `ZD-6` | **Đề nghị mua** — gõ lại vật tư và số lượng từ BOM | `D2` | `A4` | `PurchaseRequisition` **sinh tự động** từ `MaterialRequirement` ← `OrderMaterialPlan` ← `BOM`. Người chỉ điều chỉnh và gộp |
| `ZD-7` | **Bó** — gõ số bó, cỡ, số lượng | `D5` | `A4` | `Bundle` **sinh từ** `CutTicket` + tỷ lệ cỡ. ⛔ Không ai gõ một con số nào |
| `ZD-8` | 🔴 **Hồ sơ đối tác** — Monica nhập, rồi đối tác đăng nhập lại điền lần nữa | `D3` | `A2` | Monica nhập **tối thiểu** *(mã số thuế · tên · liên hệ)* để gửi lời mời; **đối tác tự hoàn thiện hồ sơ của họ MỘT LẦN**; Monica **đọc**, ⛔ không nhập lại |

## 3.1 Ba chỗ trông giống nhập trùng nhưng **⛔ không phải**

| Chỗ | Vì sao **⛔ không** vi phạm |
|---|---|
| Địa chỉ khách đóng băng trên hoá đơn | **Ảnh chụp** — chứng từ pháp lý ⛔ không đổi khi dữ liệu chủ đổi. ⛔ Không có bàn phím con người |
| Biên LN trong `approval_snapshot` | **Ảnh chụp bằng chứng** *(`DL-041`)* — hệ thống chụp, ⛔ không ai gõ |
| Số tiền ở ba tiền tệ | **Ảnh chụp tỷ giá tại thời điểm** *(`DL-047`)* |

## 3.2 Tổng kết rà soát

| | Số |
|---|---|
| Ca nhập trùng phát hiện | **8** |
| Đã sửa trước đó | **1** *(`ZD-1`)* |
| 🔴 Phát hiện mới trong lượt này | **7** |
| Khuyết tật kiến trúc chủ đạo | `A4` **workflow ⛔ không mang ngữ cảnh** — 4 ca · `A2` **ranh giới sai** — 2 ca |
| Dạng chiếm nhiều nhất | 🔴 `D3` **trùng chéo BÊN** — 3 ca |

> 🔴 **Ba trong tám ca là `D3` — Monica gõ lại thứ đối tác đã nhập.**
>
> Đây là phát hiện đáng chú ý nhất, và nó xác nhận chỉ thị **nền tảng cộng tác** của Joseph là đúng ở tầng kiến trúc: nếu đối tác và Monica **⛔ không dùng chung một mô hình dữ liệu**, thì mọi thứ đối tác nhập đều phải chép lại — và **công sức bị nhân đôi giữa hai tổ chức**, ⛔ không phải trong một tổ chức.
>
> `DL-031` *(chuyền nhà thầu cũng là `WorkCenter`)* và `DL-060` *(đề nghị đối tác là đầu vào, ⛔ không phải bản ghi)* là hai quyết định làm cho ba ca này **giải được**. ⛔ Không có chúng, ⛔ không có cách nào sửa ngoài việc gõ lại.

---

# §4 · DECISION LOG — 4 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-138` | 🔴 **`P-ZERODUP` nói về CÔNG SỨC CON NGƯỜI, ⛔ không nói về chuẩn hoá dữ liệu.** Kế thừa · ảnh chụp · chiếu — cả ba hợp lệ vì ⛔ không có bàn phím con người | ⛔ Không làm rõ thì nguyên tắc này sẽ phá vỡ `DL-041` · `DL-047` · `DL-097` và mọi chứng từ pháp lý | 🔴 rất khó |
| `DL-139` | 🔴 **Mỗi ca nhập trùng là CHỈ ĐIỂM CHẨN ĐOÁN của một trong bốn khuyết tật kiến trúc** `A1`…`A4` | Làm cho chỉ thị *"đó là lỗi thiết kế"* thi hành được: sửa khuyết tật, ⛔ không thêm màn hình tiện hơn | ⚠️ |
| `DL-140` | 🔴 **Cổng kiểm 5 câu hỏi, `Q1` trước `Q2`** · `duplicate_field_count > 0` ⇒ **⛔ không duyệt thiết kế** | Hỏi Q2 trước ⇒ đi dựng cơ chế thu nhận cho thứ chỉ cần **nối một quan hệ** | ⚠️ |
| `DL-141` | **`data_origin` bổ sung giá trị `INHERITED` và `PARTNER_REPORTED`** | Phân biệt được *kế thừa* với *tự động suy* và với *đối tác nhập* — cần cho `manual_entry_ratio` và cho sức nặng bằng chứng | ✅ |

**Cộng dồn EDD-01 → 04G: 141 quyết định.**

## 🔴 NĂM NGUYÊN TẮC THIẾT KẾ XUYÊN SUỐT — đủ bộ

| | Nguyên tắc | Nội dung | Nguồn |
|---|---|---|---|
| `P-COMMIT` | **Sự kiện ⟷ cam kết** | Sự kiện thì tự động và nhanh; cam kết thì có chủ ý và chậm | `DL-089` · `DL-112` · `DL-124` |
| `P-IRREV` | **Bất khả thu hồi** | Đã tiết lộ là ⛔ không lấy lại ⇒ dồn lực vào phòng ngừa | `BDR-25` |
| `P-ATTRIB` | **Quy trách nhiệm** | Ngăn ở chỗ ngăn được; quy trách nhiệm ở chỗ ⛔ không ngăn được; ⛔ không kiểm soát giả | `BDR-26` |
| `P-ZEROMAN` | **Không nhập tay** | ⛔ Không bắt người dùng nhập thứ hệ thống **thu nhận** được | Board Direction |
| `P-ZERODUP` | 🆕 **Không nhập trùng** | ⛔ Không bắt người dùng nhập thứ hệ thống **đã có** | 🔴 **Board Direction — Joseph** |

> **Năm nguyên tắc này ⛔ không rời rạc. Chúng khớp thành một hệ:**
>
> ```
> P-ZERODUP  ─┐
> P-ZEROMAN  ─┼─▶ giảm CÔNG SỨC  ──┐
> P-COMMIT   ─┘   (nhưng ⛔ KHÔNG   │
>                  giảm ở CAM KẾT)  ├─▶ TRẢI NGHIỆM VẬN HÀNH KHÁC BIỆT
> P-IRREV    ─┐                     │
> P-ATTRIB   ─┴─▶ giảm RỦI RO    ──┘
> ```
>
> Anh nói đúng: **hai nguyên tắc đầu làm cho hệ thống nhẹ; hai nguyên tắc sau làm cho nó an toàn; `P-COMMIT` là thứ giữ cho việc làm nhẹ ⛔ không đi quá xa thành nguy hiểm.**

---

# §5 · TÓM TẮT

## 5.1 Ba điểm đáng nhớ nhất

| # | Điểm |
|---|---|
| **1** | 🔴 **`P-ZERODUP` nói về CÔNG SỨC CON NGƯỜI, ⛔ không nói về chuẩn hoá dữ liệu.** Nếu ⛔ không làm rõ, một cách đọc hợp lý sẽ **phá vỡ** bản ghi phê duyệt, số tiền ba tiền tệ và mọi chứng từ pháp lý đóng băng giá trị. Ranh giới đúng: **cấm bàn phím con người lần thứ hai; ⛔ không cấm hệ thống lưu lại giá trị có nguồn gốc** |
| **2** | 🔴 **Mỗi ca nhập trùng là chỉ điểm chẩn đoán của một khuyết tật kiến trúc** — thiếu quan hệ · ranh giới sai · thiếu read-model · workflow ⛔ không mang ngữ cảnh. Điều này làm cho chỉ thị *"đó là lỗi thiết kế"* của Joseph **thi hành được**: có bốn chỗ để đi tìm, ⛔ không phải một lời than |
| **3** | 🔴 **Ba trong tám ca nhập trùng là `D3` — Monica gõ lại thứ đối tác đã nhập.** Đây là dạng tốn công nhất vì nó **nhân đôi công sức giữa HAI TỔ CHỨC**. Và nó chỉ giải được nhờ `DL-031` *(chuyền nhà thầu cũng là `WorkCenter`)* và `DL-060` *(đề nghị đối tác là đầu vào)* — hai quyết định đã có. ⛔ Không có chúng thì ⛔ không có cách nào ngoài gõ lại |

## 5.2 `Q1` trước `Q2` — vì sao thứ tự quan trọng

Nếu hỏi *"làm sao thu nhận mà ⛔ không gõ"* **trước** *"dữ liệu này đã có chưa"*, người thiết kế sẽ đi dựng một cơ chế quét mã cho thứ **chỉ cần nối một quan hệ**. Tốn công, và vẫn ⛔ không giải quyết gốc.

⇒ `P-ZERODUP` ⛔ không chỉ **bổ sung** `P-ZEROMAN` — nó **đứng trước** nó trong quy trình thiết kế.

## 5.3 Trạng thái

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

**Tiếp theo: EDD-05** — Phase 11 Workspace · Work Inbox · Dashboard · Executive Center · Phase 12 Module Architecture.
🔴 **Mọi màn hình sẽ mang hồ sơ `ScreenDesignGate` với đủ năm câu trả lời**, theo chỉ thị Joseph.

---

## THAM CHIẾU

- **Board Additional Direction** — `P-ZERODUP` · chỉ thị dùng nguyên tắc làm danh mục kiểm
- [EDD-04E](EDD-04E-ZERO-MANUAL-PRINCIPLE.md) — `P-ZEROMAN` · thang 7 bậc · `DL-128`
- [EDD-04F](EDD-04F-DATA-EGRESS-CONTROL.md) — `P-ATTRIB` · `DL-137`
- [EDD-04D](EDD-04D-IRREVOCABILITY-PRINCIPLE.md) — `P-IRREV` · 7 hệ luận
- [EDD-04C](EDD-04C-SUBCONTRACT-PORTAL-RUNTIME.md) — `DL-112` ma sát có chủ ý
- [EDD-02](EDD-02-MASTER-DATA-BUSINESS-OBJECT.md) — `DL-031` `WorkCenter` · [EDD-03](EDD-03-DOCUMENT-INFORMATION-ARCHITECTURE.md) — `DL-060` đề nghị đối tác
