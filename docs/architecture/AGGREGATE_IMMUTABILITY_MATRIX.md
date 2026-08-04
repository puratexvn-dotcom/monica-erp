# AGGREGATE IMMUTABILITY MATRIX — Monica ONE

| Trường | Giá trị |
|---|---|
| **Thẩm quyền** | **Board Decision `W.1`** — 05/08/2026 |
| **Phạm vi** | **toàn bộ Monica ONE** — không riêng Costing, Assignment hay Inspection |
| **Nguồn** | [ADR-019](../adr/ADR-019-vong-doi-chiet-tinh.md) Revision 2 · [`ADR-019-architecture-review.md`](../review/ADR-019-architecture-review.md) |
| **Nguyên tắc** | `P-MEASURE` — mọi ô có nhãn `[MEASURED]` · `[PROVEN]` · `[INFERRED]` · `[NO EVIDENCE]` |

> ## `W.1` — ranh giới Board đã chốt
>
> ```
> Workflow Engine  →  quyết định PHÉP CHUYỂN trạng thái
> Trigger/RLS      →  chỉ bảo vệ BẤT BIẾN của Aggregate sau khi đạt Final
> ```
>
> Trigger **không** quyết định workflow. Nó không liệt kê phép chuyển nào.

---

## 0. 🔑 LUẬT CHỌN CƠ CHẾ — `[PROVEN]`

Đây là đóng góp chính của tài liệu này: **không phải aggregate nào cũng cần
trigger.** Luật chọn suy ra trực tiếp từ định lý ba nhân chứng
*(`ADR-019-architecture-review.md` §2.3)*:

| Dạng bất biến | Cơ chế đủ | Vì sao |
|---|---|---|
| **`T` · Terminal** — trạng thái cuối, **không** còn phép chuyển nào đi ra | ✅ **RLS một mình** | Điều kiện chỉ cần dòng **CŨ**: `USING (status NOT IN (…))`. Không cần so `OLD`/`NEW` |
| **`L` · Locked-not-terminal** — nội dung đóng băng nhưng `status` **còn** đổi được | 🔴 **BẮT BUỘC trigger** | Điều kiện là *"cột X **không đổi**"* — so `OLD` với `NEW`. `[PROVEN]` RLS **không** biểu diễn được |
| **`O` · Open** — chưa có trạng thái nào đóng băng nội dung | — | không cần cơ chế nào |

🔑 **Hệ quả thực dụng:** phần lớn aggregate chỉ cần **RLS**. Trigger chỉ cần ở
những chỗ có trạng thái *"khoá nội dung nhưng chưa kết thúc"* — và đo được, số
đó **ít**.

---

## 1. MA TRẬN — 24 aggregate

Cột `Trạng thái` là **`[MEASURED]`** — trích từ ràng buộc `CHECK` trong lược đồ.
Cột `Final` là **`[INFERRED]`** trừ chỗ ghi khác, và **cần Board xác nhận**.

### 1.1 Nhóm `L` — 🔴 **BẮT BUỘC trigger**

| Aggregate | Trạng thái `[MEASURED]` | Final | Đổi được sau Final | Bất biến | RLS đủ? | Lý do |
|---|---|---|---|---|---|---|
| **`costings`** | `DRAFT` `SUBMITTED` `APPROVED` `REJECTED` `REVISE` `SUPERSEDED` | `SUPERSEDED` **`T`** · `APPROVED` **`L`** | `status` *(→`SUPERSEDED`)* · `approved_by` · `approved_at` | `quoted_price` · `target_price` · `margin_percent` · `quantity` · `order_type` · `currency` · `costing_id` của con | ⛔ **KHÔNG** cho `APPROVED` | `APPROVED` khoá nội dung nhưng **còn** chuyển sang `SUPERSEDED` — EDD-04 §8.4.2. Đúng dạng `L` |
| **`purchase_orders`** | `DRAFT` `SENT` `CONFIRMED` `PARTIAL` `RECEIVED` `CANCELLED` | `CANCELLED` `RECEIVED` **`T`** · `CONFIRMED` **`L`** | `status` · số lượng đã nhận | đơn giá · điều khoản · nhà cung cấp | ⛔ cho `CONFIRMED` | PO đã xác nhận là **cam kết pháp lý**; giá không đổi nhưng tiến độ nhận còn chạy |
| **`stock_counts`** | `OPEN` `COUNTING` `REVIEW` `POSTED` `CANCELLED` | `CANCELLED` **`T`** · `POSTED` **`L`** | `status` | số đếm · chênh lệch · `stock_count_items` | ⛔ cho `POSTED` | Kiểm kê đã ghi sổ ⇒ số liệu là bằng chứng kế toán *(Điều 8)* |

### 1.2 Nhóm `T` — ✅ **RLS một mình là đủ**

| Aggregate | Trạng thái `[MEASURED]` | Final `[INFERRED]` | Bất biến sau Final | Cần trigger? |
|---|---|---|---|---|
| `inquiries` | `NEW` `COSTING` `QUOTED` `WON` `LOST` `CANCELLED` | `WON` `LOST` `CANCELLED` | toàn bộ | ⛔ không |
| `subcon_orders` | `DRAFT` `ISSUED` `IN_PROGRESS` `PARTIAL_RECEIVED` `COMPLETED` `CLOSED` | `CLOSED` | toàn bộ | ⛔ không |
| `outbound_issues` | `REQUESTED` `ALLOCATED` `PICKING` `PICKED` `ISSUED` `CANCELLED` | `ISSUED` `CANCELLED` | toàn bộ | ⛔ không |
| `inbound_receipts` | `ARRIVED` `INSPECTING` `PUT_AWAY` `COMPLETED` `REJECTED` `CANCELLED` | `COMPLETED` `REJECTED` `CANCELLED` | toàn bộ | ⛔ không |
| `capa_logs` | `OPEN` `IN_PROGRESS` `VERIFYING` `CLOSED` `CANCELLED` | `CLOSED` `CANCELLED` | toàn bộ | ⛔ không |
| `production_orders` | `PENDING` `RELEASED` `IN_PROGRESS` `COMPLETED` `CANCELLED` | `COMPLETED` `CANCELLED` | toàn bộ | ⛔ không |
| `stock_reservations` | `ACTIVE` `ALLOCATED` `CONSUMED` `RELEASED` `EXPIRED` | `CONSUMED` `RELEASED` `EXPIRED` | toàn bộ | ⛔ không |
| `change_requests` | `PENDING` `APPROVED` `REJECTED` `APPLIED` | `APPLIED` `REJECTED` | toàn bộ | ⛔ không |
| `material_requests` | `DRAFT` `SUBMITTED` `APPROVED` `ORDERED` `RECEIVED` `REJECTED` | `RECEIVED` `REJECTED` | toàn bộ | ⛔ không |
| `styles` | `DEVELOPMENT` `APPROVED` `IN_PRODUCTION` `DISCONTINUED` | `DISCONTINUED` | toàn bộ | ⛔ không |
| `order_milestones` | `PENDING` `IN_PROGRESS` `DONE` `LATE` `SKIPPED` | `DONE` `SKIPPED` | toàn bộ | ⛔ không |
| `sample_submissions` *(cột `status`)* | `PENDING` `SENT` `APPROVED` `REJECTED` `APPROVED_WITH_COMMENT` | `APPROVED` `REJECTED` `APPROVED_WITH_COMMENT` | toàn bộ | ⛔ không |

### 1.3 🔴 Nhóm `[NO EVIDENCE]` — **9 aggregate KHÔNG có ràng buộc `CHECK`**

| Aggregate | Cột | Mặc định `[MEASURED]` | Tập trạng thái |
|---|---|---|---|
| `orders` | `status` | `APPROVED` | ⛔ **không có `CHECK`** |
| `assignments` | `status` | `DRAFT` | ⛔ |
| `cut_tickets` | `status` | `COMPLETED` | ⛔ |
| `cut_bundles` | `status` | `READY` | ⛔ |
| `fabric_rolls` | `status` | `IN_STOCK` | ⛔ |
| `shipments` | `status` | `DRAFT` | ⛔ |
| `cartons` | `status` | `PACKED` | ⛔ |
| `sewing_lines` | `status` | `ACTIVE` | ⛔ |
| `attendance_logs` | `status` | *(không đọc được)* | ⛔ |

🔴 **Không xác định được `Final` khi không biết tập trạng thái hợp lệ.** Chín
dòng này là **`TD-24`** *("8 bộ từ vựng trạng thái ⛔ không luật chuyển")* hiện
ra thành sự thật đo được — và con số thật là **9**, không phải 8.

⚠️ **`orders` là dòng đáng lo nhất:** nó có **22 bảng con**, 9 trong đó
`CASCADE`, và **không ràng buộc trạng thái nào**. Bất kỳ chuỗi ký tự nào cũng
ghi vào `orders.status` được.

---

## 2. ✅ Một bất thường đã được lý giải — lỗi của công cụ đo, không phải lược đồ

Bản nháp đầu của Matrix này báo `sample_submissions` có mặc định `PENDING` **nằm
ngoài** tập `CHECK` của `stage` — nghi là lỗi lược đồ.

Đọc lại lược đồ thật (`015:340-346`): bảng có **HAI cột khác nhau**.

| Cột | `CHECK` | Ý nghĩa |
|---|---|---|
| `stage` | `PROTO` `FIT` `SIZE_SET` `SMS` `PP` `TOP` `SHIPMENT` | **công đoạn mẫu** — không phải vòng đời |
| `status` | `PENDING` `SENT` `APPROVED` `REJECTED` `APPROVED_WITH_COMMENT` | **vòng đời duyệt mẫu** |

Phép trích của tôi ghép `CHECK` của `stage` với `DEFAULT` của `status`. **Công cụ
sai, lược đồ đúng.**

⇒ `sample_submissions` thuộc nhóm **`T`**, cột vòng đời là **`status`**, Final
`[INFERRED]` = `APPROVED` · `REJECTED` · `APPROVED_WITH_COMMENT`.

🔑 Ghi lại vì đây là lần thứ tư trong chặng này một **phép đo đúng kỹ thuật**
cho kết luận sai do **đo nhầm đối tượng** — cùng họ với sai lầm ② của `P-MEASURE`.
Bài học: `P-MEASURE` vế ② phải gồm cả *"đo đúng cột nào"*, không chỉ *"đo trên
trạng thái hệ thống nào"*.

---

## 3. Tổng kết — trả lời câu Board hỏi

| Câu hỏi | Trả lời | Nhãn |
|---|---|---|
| Bao nhiêu aggregate **cần trigger**? | **3** — `costings` · `purchase_orders` · `stock_counts` | `[INFERRED]` từ `Final` chưa xác nhận |
| Bao nhiêu **chỉ cần RLS**? | **12** | `[PROVEN]` luật chọn §0 |
| Bao nhiêu **chưa kết luận được**? | **9** — thiếu ràng buộc `CHECK` | `[MEASURED]` |
| Trigger là trường hợp riêng hay mẫu chung? | **Mẫu chung, nhưng HẸP** — 3/24, không phải 17/24 như Revision 2 ước lượng | `[PROVEN]` |

### 3.1 Đính chính Revision 2

ADR-019 Revision 2 viết *"mẫu chung cho ≥17 aggregate"*. Con số đó đếm **aggregate
có bảng con**, không phải aggregate **cần trigger**.

Sau khi áp luật chọn §0: **chỉ 3 cần trigger**, vì phần lớn trạng thái Final là
**terminal** — và terminal thì RLS làm được. **Phạm vi hẹp hơn nhiều so với tôi
ước lượng.**

---

## 4. Việc còn lại trước khi viết migration

| # | Việc | Ai | Nhãn hiện tại |
|---|---|---|---|
| `A1` | Xác nhận **Final** của 3 aggregate nhóm `L` | **Board / BKB** | `[INFERRED]` |
| `A2` | Xác nhận **Final** của 12 aggregate nhóm `T` | **Board / BKB** | `[INFERRED]` |
| `A3` | 🔴 Bổ sung ràng buộc `CHECK` cho **9 aggregate** — `TD-24` | CSA → ADR riêng | `[MEASURED]` là thiếu |
| `A4` | Lý giải bất thường `sample_submissions` §2 | CSA | `[NO EVIDENCE]` |

⚠️ **`A1` là chặn cứng cho migration `B-1`.** Hai `A2`/`A3` **không chặn** —
chúng mở rộng phạm vi áp dụng, và Board đã cho phép bắt đầu migration sau khi
Matrix xong. Tôi đề nghị: **làm `costings` trước theo `A1`**, mở rộng sau, thay
vì chờ trọn 24 dòng — vì `B-1` đang là lỗi `FAIL` chặn Sprint I-2.
