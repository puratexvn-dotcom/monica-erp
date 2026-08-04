# ADR-019 — Vòng đời chiết tính: `042` chặn cả phép duyệt

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-019 |
| **Trạng thái** | ⏳ **Chờ phản biện độc lập + Board phê duyệt** |
| **Người soạn** | Chief Solution Architect |
| **Thẩm quyền** | Board Directive 05/08/2026 mục 5 — *"Nếu sau 044 `B-1` vẫn tồn tại… lập ADR mới, phản biện, trình Board, sau đó mới thiết kế bản vá"* |
| **Hiến pháp** | **Điều 4** *(ADR trước SQL)* · **Điều 8** *(Evidence First)* |
| **Nguồn** | [`ADR-018-review.md`](../review/ADR-018-review.md) §B-1 · [ADR-018](ADR-018-thu-hep-authenticated-only.md) §10.3 |
| **Migration** | ⛔ **CHƯA VIẾT** — không viết SQL khi ADR chưa duyệt |
| **Nguyên tắc** | `P-MEASURE` — mọi kết luận dưới đây có phép đo đứng sau |

---

## 1. Problem

`042` ban hành policy chặn sửa chiết tính đã duyệt *(Hiến pháp Điều 8)*. Nó đạt
mục tiêu đó, nhưng **đồng thời làm chết vòng đời chứng từ**: không duyệt được
chiết tính, và không chuyển được chiết tính đã duyệt sang `SUPERSEDED`.

---

## 2. Current State — `[VERIFIED]` 05/08/2026

**Bối cảnh đo:** CSDL `mnxatxbadgrrolwpmxne` · migration nền `041` + `042` +
`044` *(`044` đã khôi phục nguyên văn policy của `042`)* · vai `md`, phiên đăng
nhập thật · dòng gieo dùng-một-lần.

| Phép chuyển | Kết quả | Dấu hiệu |
|---|---|---|
| `DRAFT → SUBMITTED` | ✅ chạy được | — |
| **`SUBMITTED → APPROVED`** | 🔴 **LỖI `42501`** | *"new row violates"* ⇒ **`WITH CHECK`** |
| **`APPROVED → SUPERSEDED`** | 🔴 **0 dòng, im lặng** | dòng bị lọc ⇒ **`USING`** |
| `SUBMITTED → REJECTED` | ✅ chạy được | — |
| `REVISE → SUBMITTED` | ✅ chạy được | — |

### 2.1 Nguyên nhân — chứng minh bằng hai dấu hiệu KHÁC NHAU

```sql
CREATE POLICY "costings_no_edit_after_approve" ON public.costings
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (status NOT IN ('APPROVED','SUPERSEDED'));   -- KHÔNG có WITH CHECK
```

PostgreSQL: **`WITH CHECK` bị bỏ trống thì lấy nguyên biểu thức `USING`.** Bỏ
trống **không** có nghĩa là "không có `WITH CHECK`".

⇒ Policy thực thi thành hai luật cùng lúc:

| Vế | Áp lên | Chặn |
|---|---|---|
| `USING` | dòng **CŨ** | không được **đụng** dòng đã `APPROVED`/`SUPERSEDED` ⇒ `APPROVED → SUPERSEDED` |
| `WITH CHECK` *(sao chép)* | dòng **MỚI** | không được **trở thành** `APPROVED`/`SUPERSEDED` ⇒ `SUBMITTED → APPROVED` |

Hai dấu hiệu lỗi khác nhau — `42501` với vế sau, `0 dòng` với vế trước — là
**bằng chứng trực tiếp** rằng cả hai vế đang hoạt động. Một giả thuyết khác
không giải thích được vì sao hai phép chuyển hỏng theo hai kiểu.

### 2.2 Bình luận trong `042` sai về ngữ nghĩa PostgreSQL

`042` Mục 3 viết:

> *"⚠️ CỐ Ý KHÔNG có `WITH CHECK`. Có `WITH CHECK` cùng biểu thức sẽ chặn luôn
> phép chuyển hợp lệ `SUBMITTED → APPROVED`… `USING` một mình cho đúng ngữ nghĩa
> cần."*

Câu **"`USING` một mình"** mô tả một thứ **không tồn tại**. Tôi lo đúng hậu quả
— `SUBMITTED → APPROVED` bị chặn — rồi chọn đúng cách gây ra nó.

---

## 3. Impact

| # | Ảnh hưởng | Mức |
|---|---|---|
| **I-1** | **Không duyệt được chiết tính.** `setCostingStatus` (`commercial.actions.ts:308`) trả lỗi `42501` cho người dùng | 🔴 |
| **I-2** | **`reviseCosting` hỏng một nửa** (`:435`): bản mới tạo được, bản cũ không chuyển `SUPERSEDED` ⇒ hai bản cùng hiệu lực. Đã vá tầng mã để **báo lỗi thay vì im lặng**, nhưng gốc vẫn nguyên | 🔴 |
| **I-3** | `costing_items` của chiết tính đã duyệt **sửa được**, trong khi `margin_percent` của bảng cha bị khoá ⇒ số liệu lệch *(`B-3`)* | 🟡 |

⚠️ **Chưa ai gặp `I-1`/`I-2` trên môi trường thật** vì `costings` đang 0 dòng.
Đây là **rủi ro chưa hiện thực hoá**, không phải sự cố đang diễn ra — nhưng nó
sẽ nổ ngay ngày đầu tiên có dữ liệu, tức Cổng C.

---

## 4. Alternatives Considered

| Phương án | Đánh giá |
|---|---|
| **A · `USING (status <> 'SUPERSEDED')` + `WITH CHECK` theo `approved_at`** | ⛔ **ĐÃ THỬ, ĐÃ HỎNG.** Chính là `043`. `approved_at` luôn có trên dòng đã duyệt ⇒ mở lại quyền sửa giá. **Không đề xuất lại** |
| **B · Bỏ hẳn policy, chặn ở tầng ứng dụng** | ⛔ Ai có token đều gọi thẳng PostgREST. Đúng lỗi tầng mà `042` sinh ra để sửa |
| **C · Trigger `BEFORE UPDATE` so `OLD`/`NEW`** | 🟢 Trigger thấy **cả hai** dòng, nên phân biệt được *"đổi trạng thái"* với *"sửa nội dung"* — thứ RLS **không** làm được vì `WITH CHECK` không nhìn thấy `OLD` |
| **D · Tách cột trạng thái khỏi cột nội dung ở tầng lược đồ** | ⛔ Đổi lược đồ, ảnh hưởng mọi nơi đọc `costings`. Quá tay cho vấn đề này |

### 4.1 Vì sao RLS một mình không giải được

Yêu cầu nghiệp vụ là *"trên dòng đã duyệt, được đổi `status` sang `SUPERSEDED`,
**không** được đổi `quoted_price`"*. Đó là điều kiện **so sánh `OLD` với `NEW`**.

`WITH CHECK` chỉ nhìn thấy `NEW`. Không có biểu thức RLS nào phân biệt được hai
lệnh cùng cho ra một dòng `SUPERSEDED` mà một lệnh có sửa giá kèm theo.

⇒ **Phương án C là phương án duy nhất đủ diễn đạt.** Đây là kết luận về **giới
hạn của công cụ**, không phải sở thích thiết kế.

> ## ⛔ ĐÍNH CHÍNH — 05/08/2026, Architecture Review
>
> **Câu in đậm ngay trên là PHÁT BIỂU QUÁ MẠNH so với bằng chứng.**
>
> Cái chứng minh được `[PROVEN]` là: *không cặp `(USING, WITH CHECK)` **thuần
> theo dòng** nào biểu diễn được quy tắc* — xem
> [`ADR-019-architecture-review.md`](../review/ADR-019-architecture-review.md) §2.3,
> chứng minh ba nhân chứng.
>
> Nhưng RLS **không bắt buộc** vị từ phải thuần theo dòng: biểu thức policy được
> phép chứa **truy vấn con**, và một truy vấn con đọc ảnh MVCC trước-sửa thì
> **thấy được `OLD`** — làm sụp tiền đề của định lý.
>
> Tôi **chưa đo được** lối đó *(cần dựng policy, Board đang cấm)* ⇒ nó là
> **`[NO EVIDENCE]`**, **không phải đã bị loại**.
>
> ⚠️ Đây đúng loại lỗi tôi đã mắc hai lần với `B-1`: kết luận vượt quá phép đo.
> Lần này bắt được **trước** khi có ai viết SQL.
>
> Phát biểu đúng: **Phương án B *(RLS + Trigger)* là phương án đủ diễn đạt và đã
> có tiền lệ đo được trong hệ thống; Phương án A chưa bị loại và cần một phép đo
> (`M1`) để kết luận.**

---

## 5. Recommendation

**Phương án C**, và **giữ nguyên** policy `042` làm lớp ngoài:

- `042` chặn `UPDATE` với vai không có quyền — **không đụng tới**
- Trigger mới `mos_guard_costing_lifecycle()` phụ trách *dòng nào đổi được gì*:
  - `status` cũ ∈ {`APPROVED`} → chỉ cho `status` mới = `SUPERSEDED`, **mọi cột
    khác phải giữ nguyên**
  - `status` cũ = `SUPERSEDED` → **bất động hoàn toàn**
  - còn lại → tự do
- `costing_items` khoá theo trạng thái cha bằng trigger cùng lối *(`I-3`)*

⚠️ Cần thay policy `costings_no_edit_after_approve` bằng phiên bản **chỉ chặn
theo vai**, để trigger cầm phần trạng thái. Đây là **thay đổi mô hình phân
quyền** ⇒ ADR-011 §2.2 ⇒ **bắt buộc phản biện độc lập trước khi viết SQL**.

### 5.1 Điều kiện nghiệm thu

Migration chỉ được coi là đạt khi `tests/security/costing-lifecycle.test.mjs`
báo **`7 đạt · 0 hỏng`**, đo trên CSDL sau khi chạy, kèm khối `BỐI CẢNH ĐO` ghi
đúng migration nền.

---

## 6. Chỗ tôi có thể sai — ADR-011 §2.3 mục 4

1. **Tôi chưa dựng thử trigger.** Phương án C là lập luận về giới hạn của RLS,
   **chưa phải phép đo**. Nó phải được chứng minh bằng một bản chạy thật trước
   khi Board duyệt — đúng nguyên tắc `P-MEASURE` mà chính tôi vừa vi phạm.
2. **Danh sách phép chuyển hợp lệ là suy ra từ mã ứng dụng**, không từ phỏng vấn
   nghiệp vụ. `REJECTED → ?` và `REVISE → ?` tôi chưa xác minh với người dùng thật.
3. **`SUPERSEDED` bất động hoàn toàn** là giả định của tôi. Nếu nghiệp vụ cần
   khôi phục một bản đã bị thay thế, giả định này sai.
4. **`I-3` có thể còn rộng hơn `costing_items`** — mọi bảng con của một chứng từ
   có trạng thái đều mang cùng hình dạng lỗi. Tôi mới đo một bảng.

---

## 7. Decision

> ⏳ **CHƯA QUYẾT.**

| Trường | Giá trị |
|---|---|
| **Ngày phản biện độc lập** | |
| **Ý kiến 🔴 còn treo** | |
| **Ngày Board phê duyệt** | |
| **Phán quyết** | ⏳ chờ · ✅ duyệt · ⚠️ duyệt có điều kiện · ⛔ bác |

---

## 8. References

- `tests/security/costing-lifecycle.test.mjs` — **`4 đạt · 3 hỏng`** 05/08/2026
- [`docs/review/ADR-018-review.md`](../review/ADR-018-review.md) §B-1 — chỗ `B-1` bị rút lại nhầm rồi xác lập lại
- `supabase/migrations/042_narrow_md_grants.sql` Mục 3 — policy và bình luận sai
- `supabase/migrations/044_restore_costing_lock.sql` — khôi phục nguyên văn `042`
- [`ARCHITECTURE_BASELINE.md`](../ARCHITECTURE_BASELINE.md) §3.0 — `P-MEASURE`
- `app/(dashboard)/md/_actions/commercial.actions.ts:308` · `:435`
- PostgreSQL — `CREATE POLICY`: *"If `WITH CHECK` is not specified… the `USING` expression will be used both to determine which rows are visible and which new rows will be allowed to be added."*

---
---

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
