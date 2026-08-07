# MD_WORKSPACE_PRODUCT_REDUCTION

> **Product Audit — quyết định, ⛔ KHÔNG phải thống kê.**
>
> Board Directive 07/08/2026: *"Nếu đây là một Merchandiser làm việc 8 giờ mỗi
> ngày, họ thật sự cần nhìn thấy gì?"*
>
> ⛔ Không code · ⛔ không sửa UI · ⛔ không refactor.

| Trường | Giá trị |
|---|---|
| **Căn cứ đo** | [`MD_WORKSPACE_BLUEPRINT_CURRENT.md`](MD_WORKSPACE_BLUEPRINT_CURRENT.md) — commit `c4cb4c4c` |
| **Góc nhìn** | Merchandiser thực chiến, ⛔ không phải kỹ sư · designer |
| **Phép thử duy nhất** | *"Bỏ thành phần này đi, MD có **mất khả năng làm việc** ⛔ không?"* |

---

## 0. MỘT NGÀY CỦA MERCHANDISER — và Workspace có đi đúng ⛔ không

| Giờ | MD thật sự làm gì | Workspace hiện phục vụ bằng gì | Đạt? |
|---|---|---|---|
| **08:00** | *"Đêm qua có gì cháy? Đơn nào trễ thêm?"* | Cần xử lý ngay *(cột phải)* | ⚠️ **có nhưng ⛔ không phải thứ mắt chạm đầu tiên** |
| **08:05** | *"Hôm nay tôi phải chốt ba việc gì?"* | Hôm nay cần chốt *(cột trái, y=925)* | ⚠️ **phải cuộn**; và 4/5 dòng **lặp lại** khu vừa đọc |
| **09:00** | Gọi buyer · gửi mẫu · duyệt chiết tính | Action Center *(3/6 nút dùng)* | ✅ |
| **11:00** | *"NPL về chưa? Chuyền có chạy ⛔ không?"* | Đơn hàng đang ở đâu? · tab Vật tư | ✅ |
| **14:00** | Theo shipment · booking tàu | tab Giao hàng · Risk *(mở lịch tàu)* | ✅ |
| **17:00** | Chốt số, gửi giám đốc | Báo cáo ngày · Báo cáo hôm nay 3/4 | ⚠️ **hai khối, cùng bốn chỉ số** |

🔑 **Kết luận workflow:** Workspace **có đủ** cho cả sáu mốc. Vấn đề ⛔ không
phải **thiếu** — vấn đề là **08:00 và 08:05 bị làm chậm**, đúng hai mốc quyết
định cả ngày.

---

## 1. ATTENTION FLOW — mắt đi đâu trước

Đo trên ảnh chụp máy bàn 1500px, thứ tự theo **độ tương phản × diện tích ×
vị trí**:

```
① Action Center      6 thẻ XANH DƯƠNG, y=97, full ngang   ← mắt chạm ĐẦU TIÊN
② Cần xử lý ngay     khối ĐỎ, cột phải, y=267
③ 5 ô KPI            số to, cột trái, y=267
④ Biểu đồ Journey    cột giữa, y=326
⑤ Hôm nay cần chốt   cột trái, y=925                       ← phải CUỘN
```

### 🔴 Ba chỗ làm MD **phải dừng lại suy nghĩ**

1. **Mắt chạm *"Bắt đầu việc gì?"* trước *"Cái gì đang cháy?"***
   Lúc 08:00 MD ⛔ **chưa** muốn bắt đầu việc mới — họ muốn biết đêm qua hỏng
   gì. Sáu thẻ xanh dương to, đầy màu, chiếm cả chiều ngang đang **hút mắt
   khỏi khối đỏ**. Đây là **lỗi ưu tiên**, ⛔ không phải lỗi thẩm mỹ.

2. **Đọc xong Risk lại gặp *"Hôm nay cần chốt"* với 4/5 dòng y hệt**
   MD phải dừng lại tự hỏi *"cái này khác cái vừa đọc chỗ nào?"*. Đó là **thuế
   nhận thức trả cho một khối ⛔ không mang tin mới**.

3. **Hai khối cùng tên *"Tổng quan điều hành"*, khác bộ số**
   Một cái 5 ô, một cái 4 ô. MD ⛔ không có cách nào biết cái nào đúng. Đây là
   thứ **phá niềm tin vào toàn bộ màn hình**, ⛔ không chỉ vào hai khối đó.

### Chỗ làm phân tán
- **99 nút** trên một màn hình.
- **13 tab** bày phẳng, trong đó MD dùng hằng ngày đúng **5**.
- **2 khối `SẮP CÓ`** ở cuối — chiếm chỗ mà ⛔ không làm được gì.

---

## 2. PHÂN LOẠI TỪNG SECTION

| # | Section | Quyết định | Tại sao |
|---|---|---|---|
| 1 | **Action Center** | 🟢 **KEEP** | Đây là chỗ MD **bắt đầu mọi việc**. Bỏ đi thì mỗi ý định tốn thêm 2 cú bấm. ⚠️ Nhưng phải **xuống dưới Risk** — xem §1. |
| 2 | **Cần xử lý ngay** | 🟢 **KEEP** | Bỏ đi ⇒ MD ⛔ **không biết đơn nào cháy**. Mất khả năng làm việc ngay lập tức. |
| 3 | **Đơn hàng đang ở đâu?** | 🟢 **KEEP** | **DNA của MONICA ONE.** ⛔ Không ERP nào khác trả lời được câu này. Đây là thứ bán được. |
| 4 | **Hộp thư việc** | 🟢 **KEEP** | Nguồn duy nhất của *"còn việc gì nữa"*. 167 mốc T&A sống ở đây. |
| 5 | **Danh sách PO** | 🟢 **KEEP** | MD **tra** PO chứ ⛔ không đọc. Bỏ đi thì mất chỗ tìm. |
| 6 | **5 ô KPI** *(cột trái)* | 🟡 **MERGE** | Ô *"Cần để mắt 2"* và *"Trễ giao 6"* **cùng dẫn tới Risk** — chúng là **tiêu đề của Risk**, ⛔ không phải chỉ số riêng. Gộp còn **3 ô**: Đơn đang quản lý · Đúng tiến độ · Việc hôm nay. |
| 7 | **Hôm nay cần chốt** | 🟡 **MERGE** | 4/5 dòng **lấy từ Risk**. Gộp vào Risk thành *"3 việc gấp nhất + xem tất cả"*. Giữ riêng là bắt MD đọc hai lần. |
| 8 | **Đơn hàng đang chạy** *(ActionablePoList)* | 🔴 **REMOVE** | **Cùng 14 PO** với Journey và Danh sách PO. Thông tin riêng duy nhất của nó — *"15 mốc trễ"* — đã có ở Hộp thư việc. |
| 9 | **Hôm nay xưởng đã làm được** | 🟡 **MERGE** | Ba số *(985 sp · ⚪ · 2,7%)* **y hệt** Báo cáo ngày. Gộp vào *"Báo cáo hôm nay 3/4"* thành **một** khối chốt ca. |
| 10 | **Báo cáo hôm nay 3/4** | 🟢 **KEEP** | Đây là thứ **⛔ không khối nào khác nói**: *ai chưa gửi số*. MD dùng nó để gọi điện lúc 16:30. |
| 11 | **Báo cáo ngày** *(biểu đồ + 4 thẻ)* | 🟡 **MERGE** | Gộp với `#9` `#10`. Một khối *"Chốt ca"* duy nhất ở đáy. |
| 12 | **Hoạt động gần đây** *(cột trái)* | 🔴 **REMOVE** | MD ⛔ **không tra nhật ký mỗi ngày** — họ tra khi **nghi ngờ**, mà lúc đó họ vào tab Nhật ký. Bỏ đi: ⛔ **không mất khả năng làm việc**. |
| 13 | **Tổng quan điều hành** *(khối của khung, 4 ô)* | 🔴 **REMOVE** | **Trùng TÊN với `#6`, khác bộ số.** Đây ⛔ không phải thừa — đây là **nguy hiểm**: nó dạy MD rằng số trên màn hình ⛔ không đáng tin. |
| 14 | **Biểu đồ phân tích** *(3 biểu đồ + 2 tiêu đề rỗng)* | 🔵 **MOVE** | *"SL giao theo tháng"* · *"Số đơn theo tháng"* là câu hỏi của **giám đốc**, ⛔ không phải của MD lúc 09:00. Chuyển sang `/giam-doc` hoặc tab **Báo cáo**. |
| 15 | **Card "Đơn hàng (PO)"** *(chỉ còn dòng chỉ đường)* | 🔴 **REMOVE** | Nó ⛔ **không còn nội dung**. Một card chỉ để nói *"nội dung ở chỗ khác"* là **rác điều hướng**. |
| 16 | **Lịch & mốc sắp tới — `SẮP CÓ`** | 🔴 **REMOVE** | ⛔ Chưa có bảng dữ liệu. Giữ chỗ cho thứ **⛔ chưa tồn tại** là dạy người dùng bỏ qua khu vực đó. |
| 17 | **Hoạt động gần đây — `SẮP CÓ`** | 🔴 **REMOVE** | Như trên, **và còn trùng tên với `#12`**. |
| 18 | **Thanh 13 tab** | 🟡 **MERGE** | MD dùng hằng ngày **5 tab**: PO · Vật tư · Sản xuất · Giao hàng · Thảo luận. Tám tab còn lại *(Khách hàng · Báo giá · Chiết tính · Mã hàng · Tài liệu · Thay đổi · Rủi ro · Nhật ký)* là việc **theo chu kỳ**, ⛔ không phải hằng ngày ⇒ gộp vào **"Thêm ▾"**. |

**Tổng: KEEP 5 · MERGE 5 · MOVE 1 · REMOVE 6** *(⛔ không tính khối bao ngoài)*.

---

## 3. TRÙNG LẶP — QUYẾT ĐỊNH, ⛔ KHÔNG ĐẾM

### 3.1 Mã PO — hiện **7 lần**, giữ **3**

| Giữ | Vì sao |
|---|---|
| **Đơn hàng đang ở đâu?** | Trả lời *"đơn tới đâu"* — ⛔ không khối nào khác trả lời được |
| **Danh sách PO** | Trả lời *"tìm đơn X"* — chức năng **tra cứu** |
| **Hộp thư việc** | Trả lời *"đơn này còn việc gì"* — đơn vị là **VIỆC**, ⛔ không phải đơn |

| Xoá | Vì sao |
|---|---|
| Đơn hàng đang chạy | trùng hoàn toàn hai khu trên |
| Cần xử lý ngay *(khi gộp với Tiêu điểm)* | vẫn giữ khu, nhưng **thôi lặp** PO đã có ở Tiêu điểm |
| Tiêu điểm hôm nay *(gộp vào Risk)* | 4/5 dòng lặp |
| Card "Đơn hàng (PO)" | ⛔ không còn nội dung |

**7 → 3.** Mỗi lần còn lại trả lời **một câu hỏi khác nhau**.

### 3.2 Bốn chỉ số ngày — hiện **3 nơi**, giữ **1**

`Nội bộ 985 sp` · `Đạt KH ⚪` · `Gia công ⚪` · `Lỗi 2,7%` đang ở: *Hôm nay
xưởng đã làm được* · *Báo cáo hôm nay 3/4* · *Báo cáo ngày*.
⇒ Gộp thành **một khối "Chốt ca"** ở đáy, mang cả **số** lẫn **ai chưa gửi**.

### 3.3 Hai khối trùng TÊN — giữ **1**

*"Tổng quan điều hành"* ×2 và *"Hoạt động gần đây"* ×2.
⇒ Giữ bản **ở cột trái**, xoá bản của khung. ⚠️ Đây là mục **ưu tiên cao nhất**
trong toàn bộ tài liệu: trùng tên khác số **phá niềm tin vào cả màn hình**.

---

## 4. BUTTON — phân loại theo tần suất bấm thật

### 🔵 PRIMARY — MD bấm **mỗi ngày**
| Nút | Ghi chú |
|---|---|
| **+ Tạo PO** | hành động sinh giá trị chính. **Chỉ nên có MỘT chỗ** *(hiện 2)* |
| **Mở đơn hàng / Xử lý** trên từng dòng Risk | 08:00 bấm liên tục |
| **Mở** trên từng dòng Tiêu điểm | *(sau khi gộp: chỉ còn ở Risk)* |
| **5 tab hằng ngày** | PO · Vật tư · Sản xuất · Giao hàng · Thảo luận |

### 🟡 SECONDARY — bấm **vài lần/tuần**
`+ Khách hàng` · `+ Chiết tính` · `+ Yêu cầu NPL` · 3 lối đi trên KPI
*(sau khi gộp còn 3 ô)* · `Xem thêm` của các Box.

### ⚪ GẦN NHƯ ⛔ KHÔNG BAO GIỜ BẤM — đề xuất gộp hoặc xoá
| Nút | Quyết định | Vì sao |
|---|---|---|
| `+ Định mức` · `+ Tech Pack` | 🔵 **MOVE** | Việc **đầu vòng đời mã hàng**, làm 1 lần/style. ⛔ Không thuộc dải hằng ngày ⇒ đưa vào tab Mã hàng |
| `Tải lại` | 🔴 **REMOVE** | `F5` làm đúng việc đó, và người dùng đã quen `F5` |
| 8 tab ít dùng | 🟡 **MERGE** | vào **"Thêm ▾"** |
| `+ Tạo PO` *(bản thứ hai ở card PO)* | 🔴 **REMOVE** | card đó bị xoá luôn |
| `Nạp nhật ký` | 🔴 **REMOVE** | cùng khối *Hoạt động gần đây* bị xoá |

**Ước tính: 99 → ~34 nút** *(−66%)*.

---

## 5. CARD — cái nào biến mất mà MD **vẫn làm việc bình thường**

| Card | Bỏ được? | Kết luận |
|---|---|---|
| Cần xử lý ngay | ⛔ **KHÔNG** | mất là mù |
| Đơn hàng đang ở đâu? | ⛔ **KHÔNG** | mất là mất DNA sản phẩm |
| Hộp thư việc | ⛔ **KHÔNG** | mất là ⛔ không biết còn việc gì |
| Danh sách PO | ⛔ **KHÔNG** | mất chỗ tra |
| Action Center | ⛔ **KHÔNG** | mất là mỗi việc tốn thêm 2 bấm |
| Báo cáo hôm nay 3/4 | ⚠️ **khó** | mất thì 17:00 ⛔ không biết gọi ai |
| 3 ô KPI *(sau gộp)* | ✅ **được** | nhưng mất **cảm giác kiểm soát** — giữ vì lý do sản phẩm, ⛔ không vì chức năng |
| Hôm nay cần chốt | ✅ **được** | nội dung đã có ở Risk |
| Đơn hàng đang chạy | ✅ **được** | trùng hoàn toàn |
| Hôm nay xưởng đã làm được | ✅ **được** | trùng Báo cáo ngày |
| Hoạt động gần đây | ✅ **được** | ⛔ không ai mở hằng ngày |
| Tổng quan điều hành *(khung)* | ✅ **được** | và **nên** — nó gây hại |
| Biểu đồ phân tích | ✅ **được** | câu hỏi của giám đốc |
| 2 khối `SẮP CÓ` | ✅ **được** | ⛔ chưa tồn tại |
| Card "Đơn hàng (PO)" rỗng | ✅ **được** | ⛔ không còn nội dung |

**9/15 Card có thể biến mất mà MD vẫn làm việc bình thường.**

---

## 6. THANG RÚT GỌN

### Giữ **10 Section**
Risk *(đã gộp Tiêu điểm)* · Action Center · Journey · Danh sách PO · Hộp thư
việc · 3 ô KPI · Chốt ca *(gộp 3 khối báo cáo)* · 5 tab hằng ngày · **Thêm ▾**
· Search/Filter PO.
> Bỏ: Đơn hàng đang chạy · Hoạt động gần đây ×2 · Tổng quan điều hành *(khung)*
> · Biểu đồ phân tích · Lịch sắp tới · Card PO rỗng.

### Giữ **8 Section**
Risk · Action Center · Journey · Danh sách PO · Hộp thư việc · 3 ô KPI ·
Chốt ca · Tab.
> Bỏ thêm: Search tách riêng *(nhét vào Danh sách PO)* · **Thêm ▾** *(gộp vào
> tab)*.

### Giữ **6 Section**
Risk · Action Center · Journey · Danh sách PO · Hộp thư việc · Chốt ca.
> Bỏ thêm: **3 ô KPI** *(con số của chúng đã nằm trong Risk và Hộp thư)* ·
> **Tab** *(chuyển thành menu trong thanh trên)*.

### Giữ **5 Section** — bản tinh gọn nhất
```
① CẦN XỬ LÝ NGAY      ← 08:00 · cái gì đang cháy
② BẮT ĐẦU VIỆC GÌ     ← 09:00 · 4 nút
③ ĐƠN HÀNG ĐANG Ở ĐÂU ← 11:00 · DNA sản phẩm
④ HỘP THƯ VIỆC        ← cả ngày · còn việc gì
⑤ CHỐT CA             ← 17:00 · số + ai chưa gửi
```
> **Danh sách PO** nhập vào ③ dưới dạng bảng có tìm/lọc.
>
> 🔑 Năm khối này phủ **đủ sáu mốc** trong ngày ở §0. ⛔ Không mốc nào mất chỗ
> dựa. Đó là bằng chứng rằng năm là **đủ**, ⛔ không phải là **cắt cụt**.

---

## 7. ĐIỀU TÀI LIỆU NÀY ⛔ KHÔNG KHẲNG ĐỊNH

- ⛔ **Chưa hỏi MD thật.** Toàn bộ §0 dựng từ **quy trình ngành may** và dữ
  liệu trong CSDL, ⛔ không phải từ phỏng vấn người dùng. Một buổi ngồi cạnh MD
  thật có thể lật ngược vài dòng ở đây.
- ⛔ **Chưa đo thời gian thao tác.** *"Giảm 2 cú bấm"* là suy luận từ cấu trúc,
  ⛔ không phải số bấm giờ.
- ⛔ **Không** đề xuất bố cục V4 — đó là việc của bước sau.
- ⚠️ **`role="alert"` = 0 với 170 mục rủi ro** *(phát hiện ở Blueprint §6.8)*
  ⛔ **chưa** được xử lý ở tài liệu này. Nó là **khuyết tật tiếp cận**, ⛔ không
  phải chuyện rút gọn — nhưng nó phải vào V4.
