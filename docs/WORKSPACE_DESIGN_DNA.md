# WORKSPACE DESIGN DNA — chuẩn thiết kế của mọi Workspace MONICA ONE

| Trường | Giá trị |
|---|---|
| **Trạng thái** | ✅ **ĐÃ BAN HÀNH** — Board Directive 07/08/2026 *(MD v1.0 Final Polish · Freeze)* |
| **Thứ bậc** | **Bậc 3 — Engineering Standard** *(cùng bậc `UI_UX_STANDARDS.md`)*, theo [ADR-010](adr/ADR-010-thu-bac-van-ban-chuan-tac.md) |
| **Bản mẫu tham chiếu** | `/md` — **Merchandising Workspace**, đóng băng 07/08/2026 |
| **ADR** | [ADR-026](adr/ADR-026-workspace-design-dna.md) |
| **Áp cho** | QA · Kho · Kế toán · Ba tổ trưởng · Giám đốc · Nhân sự · CRM · và mọi Workspace sau này |

---

## 0. Câu hỏi mà mọi Workspace phải trả lời

> ### ***"What should I do now?"***
>
> ⛔ **KHÔNG** phải *"What data do I have?"*

Board Directive 07/08/2026:

> *"MD ⛔ không mở hệ thống để xem Dashboard. MD mở hệ thống để: biết hôm nay
> phải làm gì · biết đơn nào nguy hiểm · biết đơn đang ở đâu · hành động ngay ·
> báo cáo ngay."*

🔑 **Đây là phép thử cuối cùng.** Một khối ⛔ không giúp trả lời câu trên thì nó
⛔ không thuộc về Workspace — dù nó đẹp, dù nó đúng, dù nó tốn công dựng.

---

## 1. TÁM TẦNG — thứ tự là toàn bộ nội dung của chuẩn

```
① Command Center      →  tôi đang đứng ở đâu
② Quick Actions       →  tôi bắt đầu việc gì
③ Risk Center         →  cái gì đang cháy
④ Business Flow       →  đối tượng của tôi đang ở đâu
⑤ Today's Focus       →  hôm nay tôi phải chốt gì
⑥ Data                →  chi tiết, khi tôi cần tra
⑦ Task                →  hộp thư việc đầy đủ
⑧ Report              →  bằng chứng để báo cáo lên
```

⚠️ **Xếp `Data` lên trên là ⛔ KHÔNG thi hành chuẩn này** — kể cả khi đã có đủ
tám khối. Thứ tự **là** chuẩn; đảo thứ tự là đảo sản phẩm.

### Vì sao đúng thứ tự đó

| Tầng | Câu người dùng hỏi ở phút thứ nhất | ⛔ Nếu đặt sai chỗ |
|---|---|---|
| ① | *"Tình hình chung thế nào?"* | Đặt sau Data ⇒ phải cuộn qua 14 dòng mới biết mình có ổn ⛔ không |
| ② | *"Tôi bắt đầu việc gì?"* | Giấu trong menu ⇒ mỗi ý định tốn hai cú bấm |
| ③ | *"Có gì đang cháy ⛔ không?"* | ERP thường **giấu rủi ro**; MONICA ONE làm ngược lại |
| ④ | *"Đơn/lô/phiếu của tôi đang ở đâu?"* | Đây là **chữ ký sản phẩm** — ⛔ không ERP nào khác có |
| ⑤ | *"Hôm nay chốt cái gì?"* | Sau ④ vì vừa thấy *"ở đâu"* thì câu kế là *"vậy làm gì"* |
| ⑥ | *"Chi tiết dòng nào?"* | Người dùng **tìm · lọc · mở**, ⛔ không đọc từ trên xuống |
| ⑦ | *"Còn việc gì nữa ⛔ không?"* | Bản đầy đủ; phần khẩn đã rút lên ⑤ |
| ⑧ | *"Tôi báo cáo lên bằng gì?"* | Cuối cùng — nó là **bằng chứng**, ⛔ không phải điểm khởi hành |

---

## 2. MƯỜI LUẬT BẤT DI BẤT DỊCH

### `DNA-1` · ⛔ Không KPI nào được kết thúc ở KPI

Mỗi ô chỉ số **bấm được** và có **lối đi viết thành CHỮ** *(“Xử lý ngay →”)*.

🔑 Con trỏ đổi hình khi rê chuột là **⛔ không đủ**: điện thoại ⛔ không có con
trỏ, và người dùng máy bàn cũng phải rê tới mới biết. Lối đi phải **đọc được**,
⛔ không phải **mò ra**.

⛔ Ô ⛔ không có nơi để tới thì **⛔ không được bọc `<button>`** — con trỏ đổi
thành bàn tay rồi bấm ⛔ không xảy ra gì là **lời hứa suông của giao diện**.

### `DNA-2` · Quick Actions là **Launcher**, ⛔ không phải **toolbar**

Ô dọc · biểu tượng lớn *(`h-12`)* · khoảng cách rộng — **cùng hình dạng với
Trang chủ Business App**.

🔑 Cùng hình dạng cho cùng ý nghĩa *"đây là nơi bắt đầu một việc"*: người dùng
**học một lần, dùng được cả hệ thống**. Đó là toàn bộ lý do có tài liệu này.

### `DNA-3` · Risk ⟷ Task là **hai thứ khác nhau**, và phải **bổ nhau**

```
Risk  =  hệ thống PHÁT HIỆN     (trễ mốc · thiếu NPL · chờ buyer)
Task  =  việc TÔI phải làm       (gọi buyer · gửi costing · duyệt PO)
```

⚠️ **⛔ Không trùng lặp.** Tiêu điểm ⑤ lấy **tối đa 3** dòng từ Risk, phần còn
lại nhường cho **việc làm ngoài hệ thống**. Hai danh sách báo động cạnh nhau ⛔
không làm người ta cảnh giác gấp đôi — nó làm người ta **thôi tin cả hai**.

### `DNA-4` · Mỗi cảnh báo **dẫn tới hành động**

Đích khai **tại nguồn dữ liệu** *(trường `dich`)*, ⛔ **KHÔNG** để màn hình bóc
chuỗi tiêu đề mà đoán. Bóc chuỗi thì đổi một chữ là gãy điều hướng — mà ⛔ không
phép kiểm nào bắt được, vì cả hai vẫn là `string` hợp lệ.

### `DNA-5` · `V.1` áp cho **cả số tính ra được**

*"⚪ chưa đo được"* ⛔ **KHÁC** *"0"*. Và khi một con số **tính ra được nhưng dễ
bị hiểu sai**, màn hình phải **nói trước điều đó**.

> Ví dụ đã gặp: P&L cho margin `14,0%` ở **mọi đơn** vì cả ba chi phí đều là %
> doanh thu. Kế toán rất dễ đọc thành *"các đơn lãi như nhau"*, trong khi sự
> thật là *"ta ⛔ chưa đo được đơn nào khác đơn nào"*.

### `DNA-6` · Data **cuộn trong khung của nó**

Bảng dữ liệu bọc `max-h-*` + `overflow-y-auto`. Bảng dài bao nhiêu cũng ⛔ không
được đẩy Report ra khỏi tầm mắt.

### `DNA-7` · Report ⛔ **không được lặp** khối phía trên

Khối nào đã lên ① ③ ⑤ thì Report **⛔ không bày lại**. Bản dưới thường **⛔ không
bấm được** — tức **bản kém hơn đứng sau bản tốt hơn**, và người đọc mất niềm tin
vào cả hai.

### `DNA-8` · Cảm giác **điều hành**, ⛔ không phải **bị kiểm tra**

Ô *"đúng tiến độ"* đứng **trước** ô rủi ro. Mở máy thấy hai ô đỏ trước tiên là
bắt đầu ngày bằng cảm giác bị soi.

Có khối **"hôm nay đã xong tới đâu"** — nhưng ⛔ **KHÔNG bịa mẫu số**. Thanh tiến
độ bịa **còn tệ hơn ⛔ không có thanh nào**: nó tạo cảm giác tiến bộ giả.
⇒ Đo một thứ **có thật và người dùng thật sự đuổi mỗi ngày**.

### `DNA-9` · Phép tính ở `lib/`, màn hình **CHỈ VẼ**

Cùng con số sẽ xuất hiện ở Workspace khác, ở báo cáo ngày, ở bàn giám đốc. Mỗi
nơi tự tính là mỗi nơi có cơ hội tính khác đi — và tới lúc hai màn hình lệch
nhau thì ⛔ không ai biết bên nào sai.

Bánh cóc kiến trúc **cưỡng chế** luật này *(“màn hình MỚI ⛔ không tự tính”)*.

### `DNA-10` · Biểu đồ nặng **nạp ĐỘNG**

`recharts` ~100 kB ⇒ `next/dynamic` + `ssr:false`.
⚠️ Bí danh `napDong` khi tệp có `export const dynamic` — trùng tên thì hằng số
**che mất hàm**, bẫy kinh điển của App Router.

---

## 3. Bảng đối chiếu — dùng khi dựng Workspace mới

| # | Câu hỏi tự kiểm | Đạt khi |
|---|---|---|
| 1 | Mở lên có biết ngay **hôm nay làm gì** ⛔? | ⑤ có nội dung thật, ⛔ không rỗng |
| 2 | Có biết **cái gì đang nguy hiểm** ⛔? | ③ nằm trên, mỗi dòng có nút |
| 3 | Có biết **đối tượng đang ở đâu** ⛔? | ④ tồn tại và ⛔ không bị đẩy xuống |
| 4 | **Một cú bấm** là hành động được ⛔? | ② + `DNA-1` |
| 5 | Có phải **tìm chức năng** ⛔? | ⛔ Không — mọi việc thường dùng ở ② |
| 6 | Có **widget thừa** ⛔? | ⛔ Không khối nào ⛔ không phục vụ hành động |
| 7 | **Hierarchy** rõ ⛔? | Đúng thứ tự tám tầng |
| 8 | Có **cảm giác điều hành** ⛔? | `DNA-8` |

⚠️ **Tám câu này ⛔ CHƯA CÓ PHÉP KIỂM TỰ ĐỘNG.** Cưỡng chế hiện nay là **kỷ luật
rà soát** — cùng tình trạng với `TD-GR1` của `REPORT_STANDARD.md`. Ghi ra đây để
⛔ không ai tưởng bộ kiểm đang canh giúp.

---

## 4. Những gì bản mẫu `/md` **⛔ CHƯA** giải quyết

Ghi thẳng để Workspace sau ⛔ không kế thừa nhầm một lỗ hổng thành một chuẩn.

| Mã | ⛔ Chưa có | Vì sao chưa |
|---|---|---|
| `DNA-X1` | **Tiêu điểm theo GIỜ** *(“08:30 gọi buyer · 14:00 booking tàu”)* | ⛔ Không bảng nào lưu **giờ** của một việc — chỉ có ngày. Bịa giờ là bịa lịch làm việc của người dùng |
| `DNA-X2` | **AI Today** *(gợi ý do máy đề xuất)* | Cần một tầng suy luận **chưa tồn tại**. Viết vài câu `if` rồi gắn nhãn *"AI"* là **nói dối về năng lực sản phẩm** |
| `DNA-X3` | **Đếm việc ĐÃ HOÀN THÀNH** *(“6/9”)* | ⛔ Không bảng nào ghi *"việc này đã xong"*. Hiện đo **số nguồn báo cáo đã gom** — có thật, nhưng ⛔ không phải cùng một thứ |

🔑 Ba mục trên là **món nợ đã khai**, ⛔ không phải mục bị bỏ quên. Chúng cần
**dữ liệu mới** hoặc **năng lực mới** — tức cần Board quyết, ⛔ không phải cần
thêm một vòng UX.
