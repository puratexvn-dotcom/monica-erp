# ADR-019 · REVISION 2 — sau bốn phép đo

| Trường | Giá trị |
|---|---|
| **Thay thế** | [ADR-019 Revision 1](ADR-019-vong-doi-chiet-tinh.md) — **giữ nguyên, không xoá** *(Điều 43.7)* |
| **Thẩm quyền** | Board Directive 05/08/2026 — *"ADR-019 COMPLETION"* |
| **Phạm vi** | ⛔ Không migration · không trigger · không sửa policy. **Chỉ đo.** |
| **Trạng thái** | ⏳ Chờ Board — 🔴 **khuyến nghị ĐÃ ĐỔI so với Revision 1** |

> 🔴 **Kết luận lớn nhất: thiết kế trigger ở Revision 1 XUNG ĐỘT với EDD-04.**
> Phát hiện bằng đọc văn bản chuẩn tắc kèm trích dẫn nguyên văn — xem `W`.

---

## `M1` · Truy vấn con trong `WITH CHECK` có đọc được `OLD` không?

### 🔴 `[NO EVIDENCE]` — không đo được, và đây là lý do

Phép đo đòi `CREATE POLICY` trên một bảng thử: **DDL**. Môi trường của tôi không
có đường chạy DDL nào — `.env.local` chỉ có `SUPABASE_URL` · `ANON_KEY` ·
`SERVICE_ROLE_KEY`; không `DATABASE_URL`, không gói `pg`, không `psql`, không RPC
chạy SQL. `SERVICE_ROLE_KEY` chỉ mở PostgREST — tầng **dữ liệu**, không thi hành
được lệnh tầng **lược đồ**.

Tôi cũng đã tìm **thí nghiệm tự nhiên**: quét 51 migration, **không policy nào**
có truy vấn con trong `WITH CHECK` trỏ về chính bảng nó bảo vệ. Không có sẵn thứ
để đo.

⚠️ Board yêu cầu *"không trả lời bằng lập luận, không trả lời bằng tài liệu"*.
Vậy câu trả lời đúng là **chưa có bằng chứng** — không phải một đoạn suy diễn
nghe hợp lý.

### `[PROVEN]` — `M1` KHÔNG ảnh hưởng quyết định kiến trúc

Board cho phép đóng khoảng trống theo hai cách: đo được, **hoặc** chứng minh nó
không ảnh hưởng quyết định. Đây là cách thứ hai.

`M1` chỉ quyết định **Phương án A còn sống hay không**. Nhưng `W` loại Phương án
A vì một lý do **khác hẳn**: một `WITH CHECK` chứa truy vấn con để liệt kê phép
chuyển trạng thái vi phạm `WF-1` **y hệt** một trigger làm việc đó. Câu trả lời
của `M1` là gì cũng không cứu được A.

### Dụng cụ đo đã dựng sẵn

Bảng tạm hai cột `(status, price)` · bật RLS · policy `FOR UPDATE` với
`WITH CHECK (price = (SELECT t.price FROM t_tam t WHERE t.id = t_tam.id))` · hai
lệnh thử: một đổi `status` giữ `price`, một đổi cả hai. Lệnh đầu qua **và** lệnh
sau bị chặn ⇒ truy vấn con **thấy** ảnh trước-sửa.

---

## `M2` · Gỡ `costings_no_edit_after_approve` có làm lệch ma trận ghi không?

### ✅ `[PROVEN]` từ tiền đề `[MEASURED]` — **KHÔNG lệch**

Board đề nghị dựng môi trường thử rồi gỡ policy. Tôi **không gỡ được** (DDL), và
**không cần**: đo **miền tác dụng** cho câu trả lời chặt hơn.

**Bối cảnh đo:** CSDL `mnxatxbadgrrolwpmxne` · nền `041`+`042`+`044` · vai `md`,
phiên đăng nhập thật · 6 dòng gieo dùng-một-lần, mỗi dòng một trạng thái.

| trạng thái | `md` sửa `quoted_price` | policy có tác dụng? |
|---|---|---|
| `DRAFT` | sửa được | **KHÔNG — trơ** |
| `SUBMITTED` | sửa được | **KHÔNG — trơ** |
| **`APPROVED`** | **BỊ CHẶN** *(0 dòng)* | **CÓ** |
| `REJECTED` | sửa được | **KHÔNG — trơ** |
| `REVISE` | sửa được | **KHÔNG — trơ** |
| **`SUPERSEDED`** | **BỊ CHẶN** *(0 dòng)* | **CÓ** |

**Miền tác dụng đo được = `{APPROVED, SUPERSEDED}`.**

`md-update-matrix` gieo `costings` ở **`DRAFT`** — có ghi chú lý do ngay trong
tệp kiểm. Trên `DRAFT`, policy **trơ**.

⇒ Gỡ một policy đang trơ **không thể** đổi kết quả của 75 phép đo không chạm
miền tác dụng của nó. **`[PROVEN]`**, không phải `[INFERRED]`.

### ⚠️ Hệ quả ngược, quan trọng hơn câu trả lời

Điều này **không** có nghĩa gỡ policy là an toàn. Nó có nghĩa **ma trận ghi
`75/75` MÙ với việc gỡ policy**.

⇒ `R1` *(gỡ policy trước khi trigger có hiệu lực)* **không được** dùng ma trận
ghi làm cổng nghiệm thu. Cổng đúng là `costing-lifecycle`, bài duy nhất chạm
`APPROVED`. **`[PROVEN]`**

---

## `M3` · Lifecycle Matrix — trường hợp riêng hay mẫu chung?

### ✅ `[MEASURED]` — **MẪU CHUNG. 24/88 bảng có vòng đời.**

Quét toàn bộ lược đồ: 88 `CREATE TABLE` trong 51 migration. `⚠️` = `ON DELETE CASCADE`.

| Aggregate | Cột | Bảng con |
|---|---|---|
| **`orders`** | `status` | **22 con** — `order_items ⚠️` · `qa_audit_reports ⚠️` · `order_milestones ⚠️` · `sample_submissions ⚠️` · `change_requests ⚠️` · `risk_assessments ⚠️` · `capa_logs ⚠️` · `order_size_breakdown ⚠️` · `stock_reservations ⚠️` … |
| `styles` | `status` | `style_colorways ⚠️` · `style_sizes ⚠️` · `style_operations ⚠️` · `style_bom ⚠️` · `sample_submissions ⚠️` · `change_requests` |
| `cut_tickets` | `status` | `cut_ticket_rolls ⚠️` · `cut_bundles ⚠️` · `cut_attachments ⚠️` · `stock_reservations` · `outbound_issues` |
| `assignments` | `status` | `assignment_bundles` · `assignment_commercial_terms` · `assignment_daily_reports` |
| `purchase_orders` | `status` | `purchase_order_items ⚠️` · `material_lots` · `inbound_receipts` |
| `cut_bundles` | `status` | `finishing_logs ⚠️` · `subcon_issue_logs` · `subcon_receipt_logs` · `assignment_bundles` |
| `fabric_rolls` | `status` | `cut_ticket_rolls` · `material_inspections` · `outbound_issue_items` · `stock_movements` |
| `stock_counts` | `status` | `stock_count_items ⚠️` · `stock_adjustments` |
| `subcon_orders` | `status` | `subcon_issue_logs ⚠️` · `subcon_receipt_logs ⚠️` |
| `shipments` · `outbound_issues` · `inbound_receipts` · `cartons` · `sewing_lines` · `stock_reservations` · `inquiries` | `status` | 1–2 con mỗi bảng |
| **`costings`** | `status` | **`costing_items ⚠️`** ← hạng mục của ADR này |
| `attendance_logs` · `capa_logs` · `change_requests` · `material_requests` · `order_milestones` · `production_orders` | `status` | — |
| `sample_submissions` | **`stage`** | — |

### Kết luận

**`costings` là 1 trong ≥17 aggregate có bảng con.** Quy tắc *"cha đã chốt ⇒ con
bất động"* là **mẫu kiến trúc chung**, không phải trường hợp riêng.

Vá riêng `costings` bằng một trigger viết tay là giải **1/17**, và tạo tiền lệ
cho 16 bản chép tay lệch nhau.

⚠️ `[NO EVIDENCE]` — **bao nhiêu trong 17 aggregate CẦN quy tắc đó** là câu hỏi
**nghiệp vụ**, không suy ra được từ lược đồ. Hệ thống đã có `ab_child_guard_trg`
và `adr_child_guard_trg` *(chặn ghi vào cha đã đóng)* ⇒ ít nhất **2/17** đã được
xác nhận là cần. Xem `N2`.

---

## `W` · Workflow · Rule · Permission Engine — 🔴 XUNG ĐỘT

### 🔴 `[MEASURED]` từ EDD-04 — thiết kế Revision 1 vi phạm **ba** luật

| Luật | Nguyên văn EDD-04 | Revision 1 |
|---|---|---|
| **`WF-1`** | *"Workflow là **DỮ LIỆU**, ⛔ không phải mã. ⛔ Không `if/else` nghiệp vụ trong mã ứng dụng"* | trigger liệt kê phép chuyển = `if/else` nghiệp vụ ⛔ |
| **`WF-2`** | *"Guard là **THAM CHIẾU** tới Rule Engine, ⛔ không phải biểu thức viết tại chỗ"* | trigger là biểu thức viết tại chỗ ⛔ |
| **`DL-067`** | *"Guard ⛔ **không bao giờ** là biểu thức viết trong định nghĩa workflow — luôn là `RuleRef`"* | ⛔ |

**EDD-04 §8.5** phân ranh giới dứt khoát:

```
WORKFLOW trả lời:  KHI NÀO · AI · THEO THỨ TỰ NÀO
RULE trả lời:      CÓ ĐƯỢC KHÔNG · GIÁ TRỊ BAO NHIÊU · VÌ SAO
```

Bảng cùng mục xếp **"Trạng thái và phép chuyển"** thuộc **Workflow** — không
thuộc tầng dữ liệu.

**EDD-04 §8.4.2 đã định nghĩa sẵn `COSTING_APPROVAL`:**

```
Merchandiser trình
      ▼
🔴 SoD check: người trình ≠ người duyệt          ← WF sod_check
      ▼
GĐSX duyệt  ── SLA 24h ──
      ▼
APPROVED ─▶ Costing khoá · sinh Quotation được
REJECTED ─▶ về DRAFT kèm lý do bắt buộc
```

⇒ Máy trạng thái chiết tính **đã tồn tại trong kiến trúc đã được phê duyệt**.
Một trigger liệt kê phép chuyển là **bản sao thứ hai** — và hai bản sẽ lệch
nhau, đúng điều `DL-067` viết ra để chặn.

> 🔑 Mục này cũng xác nhận **`TD-32`** bằng văn bản chuẩn tắc: *"SoD check: người
> trình ≠ người duyệt"* và *"**GĐSX** duyệt"*. Việc `md` tự duyệt chiết tính
> không phải chỗ chưa thiết kế — nó là chỗ **triển khai chưa theo thiết kế**.

### `W.1` — Ranh giới thật: **BẤT BIẾN** ≠ **PHÉP CHUYỂN**

Đây là chỗ Revision 1 lẫn lộn, và là đóng góp chính của Revision 2:

| Phát biểu | Thuộc về | Bằng chứng |
|---|---|---|
| *"Chiết tính đã duyệt thì **nội dung bất động**"* | **Bất biến dữ liệu** — tầng CSDL | Hiến pháp **Điều 8** · EDD-04 §8.4.2 *"Costing **khoá**"* · tiền lệ `ledger_append_only` |
| *"`APPROVED` chuyển được sang `SUPERSEDED`, không về `DRAFT`"* | **Máy trạng thái** — Workflow Engine | EDD-04 §8.5 · §8.4.2 · `WF-1` · `WF-2` |

`ledger_append_only` là tiền lệ **`[MEASURED]`** cho vế trên: nó thi hành một
**bất biến** *(sổ cái chỉ-ghi-thêm)*, **không liệt kê phép chuyển nào**. Và
`rls-external` mục G đo nó chạy đúng cùng RLS — `33 đạt · 0 hỏng`.

⇒ Trigger **được phép tồn tại**, nhưng **chỉ để giữ bất biến**, ⛔ không để cầm
máy trạng thái.

### `W.2` — Permission Engine: **không xung đột** `[MEASURED]`

EDD-04 §10.6: *"Phân tách nhiệm vụ — kiểm lúc **CẤP**, ⛔ không phải lúc **DÙNG**"*.
Trigger giữ bất biến không cấp/thu quyền của ai. Phương án B giữ nguyên
`costings_read/_insert/_update` của `042` — đã đo `90/90` đọc, `75/75` ghi.

### `W.3` — Rule Engine: `[NO EVIDENCE]`, **và không ảnh hưởng quyết định**

Rule Engine **chưa tồn tại trên CSDL** — EDD-04 định nghĩa mô hình, chưa
migration nào dựng. Không đo được xung đột với thứ chưa chạy.

⇒ `[PROVEN]` không ảnh hưởng quyết định **nếu** theo `W.1`: bất biến *"nội dung
đã duyệt bất động"* là **Điều 8**, văn bản **bậc 1** — không phải quy tắc nghiệp
vụ cấu hình được, nên nó **không thuộc** Rule Engine dù engine đó có ra đời hay
không.

⚠️ Nếu trigger liệt kê phép chuyển thì kết luận này **sai**. Đó chính là lý do
`W.1` là ràng buộc bắt buộc, không phải khuyến nghị.

---

## Khuyến nghị Revision 2 — ĐỔI so với Revision 1

| | Revision 1 | **Revision 2** |
|---|---|---|
| Trigger làm gì | liệt kê phép chuyển hợp lệ | **chỉ giữ bất biến**: trên dòng `APPROVED`, mọi cột **trừ `status`** phải giữ nguyên |
| Ai quyết định phép chuyển | trigger | **Workflow Engine** — `COSTING_APPROVAL`, EDD-04 §8.4.2 |
| Phạm vi | `costings` | **mẫu chung** cho ≥17 aggregate |

**Hệ quả đo được:** thiết kế mới **tự sửa `B-1`**. Trigger không cấm `status`
đổi ⇒ `SUBMITTED → APPROVED` và `APPROVED → SUPERSEDED` đều chạy được — hai mục
đang `FAIL` ở `costing-lifecycle`.

### Việc phải làm trước khi viết SQL

| # | Việc | Ai |
|---|---|---|
| `N1` | Board xác nhận ranh giới `W.1` — bất biến ở CSDL, phép chuyển ở Workflow Engine | **Board** |
| `N2` | 🔴 Trong ≥17 aggregate có bảng con, những cái nào cần *"cha khoá"* | **Board** — câu hỏi nghiệp vụ |
| `N3` | Nếu `N1` duyệt: thiết kế **một** hàm trigger dùng chung, ⛔ không 17 bản chép tay | CSA |
| `N4` | Phản biện độc lập — ADR-011 §2.2 | ChatGPT |

---

## Bảng nhãn — mọi kết luận của Revision 2

| Kết luận | Nhãn |
|---|---|
| Miền tác dụng policy = `{APPROVED, SUPERSEDED}` | **`[MEASURED]`** |
| Gỡ policy không đổi ma trận ghi `75/75` | **`[PROVEN]`** |
| Ma trận ghi **mù** với việc gỡ policy ⇒ không dùng làm cổng cho `R1` | **`[PROVEN]`** |
| 24/88 bảng có vòng đời · ≥17 có bảng con | **`[MEASURED]`** |
| Trigger liệt kê phép chuyển vi phạm `WF-1` · `WF-2` · `DL-067` | **`[MEASURED]`** |
| `COSTING_APPROVAL` đã có trong kiến trúc đã duyệt; `TD-32` được xác nhận | **`[MEASURED]`** |
| Trigger giữ **bất biến** hợp lệ — tiền lệ `ledger_append_only` | **`[MEASURED]`** |
| Không xung đột Permission Engine | **`[MEASURED]`** |
| Truy vấn con trong `WITH CHECK` đọc được `OLD`? | 🔴 **`[NO EVIDENCE]`** · `[PROVEN]` **không ảnh hưởng quyết định** |
| Xung đột Rule Engine? | 🔴 **`[NO EVIDENCE]`** · `[PROVEN]` **không ảnh hưởng** nếu theo `W.1` |
| Trong ≥17 aggregate, cái nào cần *"cha khoá"*? | 🔴 **`[NO EVIDENCE]`** · **CÓ ảnh hưởng** ⇒ `N2` |
| Chi phí hiệu năng của trigger | 🔴 **`[NO EVIDENCE]`** · không ảnh hưởng lựa chọn A/B/C |

**Bốn khoảng trống: ba được chứng minh là không ảnh hưởng quyết định kiến trúc;
một (`N2`) CÓ ảnh hưởng và cần Board trả lời.** Tôi không lấp `N2` bằng lập
luận — nó là câu hỏi nghiệp vụ, không phải câu hỏi kỹ thuật.
