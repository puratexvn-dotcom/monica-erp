# ADR-019 — Architecture Review

| Trường | Giá trị |
|---|---|
| **Hạng mục** | [ADR-019](../adr/ADR-019-vong-doi-chiet-tinh.md) — Vòng đời chiết tính |
| **Thẩm quyền** | Board Directive 05/08/2026 — *"ADR-019 REVIEW FIRST"* |
| **Phạm vi** | ⛔ **Không viết migration · không sửa mã · không sửa policy · không viết trigger** |
| **Người soạn** | Chief Solution Architect |
| **Phản biện độc lập** | ⏳ **chưa có** — ADR-011 §1.3 chỉ định ChatGPT |

## Quy ước mức độ tự tin

| Nhãn | Nghĩa |
|---|---|
| **`[MEASURED]`** | Có phép đo trên CSDL thật, phiên đăng nhập thật, kèm bối cảnh |
| **`[PROVEN]`** | Chứng minh hình thức từ tiền đề đã `[MEASURED]` — không phụ thuộc quan sát thêm |
| **`[INFERRED]`** | Suy luận có căn cứ, **chưa đo**. Không được dùng làm cơ sở quyết định cuối |
| **`[NO EVIDENCE]`** | Chưa có bằng chứng. Ghi ra để không bị lấp bằng lập luận |

---

## 1. Nhiệm vụ Board giao — trả lời thẳng

> *"PostgreSQL `USING` không đủ biểu diễn quy tắc «cho phép chuyển `APPROVED →
> SUPERSEDED` nhưng cấm sửa nội dung đã `APPROVED`»."*

**Trả lời: kết luận đó ĐÚNG MỘT PHẦN, và bản ADR-019 của tôi đã phát biểu nó
QUÁ MẠNH.**

| Phát biểu | Mức |
|---|---|
| Không cặp `(USING, WITH CHECK)` **thuần theo dòng** nào biểu diễn được quy tắc | **`[PROVEN]`** — §2 |
| ⇒ *"RLS không làm được, phải dùng trigger"* | ⛔ **`[NO EVIDENCE]`** — §3 chỉ ra một lối RLS mà tôi **chưa loại trừ được** |

ADR-019 §4.1 viết *"Phương án C là phương án duy nhất đủ diễn đạt"*. **Câu đó
vượt quá bằng chứng.** Đính chính tại đây.

---

## 2. `[PROVEN]` — Chứng minh bất khả thi cho vị từ THUẦN THEO DÒNG

### 2.1 Tiền đề — đều `[MEASURED]`

**Bối cảnh đo:** CSDL `mnxatxbadgrrolwpmxne` · migration nền `041`+`042`+`044` ·
vai `md`, phiên thật · dòng gieo dùng-một-lần.

| # | Tiền đề | Bằng chứng |
|---|---|---|
| **T1** | `USING` đánh giá trên **dòng CŨ** | `APPROVED → SUPERSEDED` ⇒ **0 dòng, không lỗi** — dấu hiệu lọc dòng |
| **T2** | `WITH CHECK` đánh giá trên **dòng MỚI** | `SUBMITTED → APPROVED` ⇒ **`42501` "new row violates"** |
| **T3** | Bỏ trống `WITH CHECK` ⇒ lấy nguyên `USING` | Hai dấu hiệu KHÁC NHAU cùng phát sinh từ **một** policy chỉ có `USING` |

T3 là chỗ đắt nhất: **hai kiểu hỏng khác nhau từ một biểu thức** là bằng chứng
trực tiếp rằng biểu thức đó đang được dùng ở **cả hai** vị trí.

### 2.2 Định lý

> Gọi `U` là vị từ trên dòng cũ, `C` là vị từ trên dòng mới, **cả hai là hàm
> thuần của đúng một dòng**. Không tồn tại cặp `(U, C)` nào thi hành được quy
> tắc `R`:
> - `R` **cho phép**: `OLD.status='APPROVED'` ∧ `NEW.status='SUPERSEDED'` ∧ `NEW.price = OLD.price`
> - `R` **cấm**: `OLD.status='APPROVED'` ∧ `NEW.status='SUPERSEDED'` ∧ `NEW.price ≠ OLD.price`

### 2.3 Chứng minh — ba nhân chứng

Đặt `X = (APPROVED, 10)` · `Y = (APPROVED, 99)`. PostgreSQL cho phép một `UPDATE`
khi và chỉ khi `U(OLD) ∧ C(NEW)`.

| Lệnh | Từ | Thành | `R` đòi | Suy ra |
|---|---|---|---|---|
| `S1` | `X` | `(SUPERSEDED, 10)` | ✅ cho phép | `U(X)=⊤` **và** `C(SUPERSEDED,10)=⊤` |
| `S2` | `Y` | `(SUPERSEDED, 99)` | ✅ cho phép | `U(Y)=⊤` **và** `C(SUPERSEDED,99)=⊤` |
| `S3` | `Y` | `(SUPERSEDED, 10)` | ⛔ **cấm** | `U(Y) ∧ C(SUPERSEDED,10) = ⊥` |

Từ `S2`: `U(Y) = ⊤`. Từ `S1`: `C(SUPERSEDED,10) = ⊤`.
⇒ `U(Y) ∧ C(SUPERSEDED,10) = ⊤ ∧ ⊤ = ⊤`.

**Mâu thuẫn với `S3`.** ∎

Chứng minh này **không phụ thuộc độ phức tạp của `U` và `C`** — chỉ phụ thuộc
việc mỗi vị từ nhìn thấy **đúng một dòng**. `S1` và `S3` có dòng mới **giống hệt
nhau**; `S2` và `S3` có dòng cũ **giống hệt nhau**. Không thông tin nào còn lại
để phân biệt.

---

## 3. `[NO EVIDENCE]` — Lối thoát tôi CHƯA loại trừ được

Định lý §2 giả định `U` và `C` là **hàm thuần của một dòng**. RLS **không** bắt
buộc điều đó: biểu thức policy được phép chứa **truy vấn con**.

```sql
-- KHÔNG PHẢI ĐỀ XUẤT — đây là phản ví dụ tôi chưa bác bỏ được
WITH CHECK (
  status = 'SUPERSEDED'
  AND quoted_price = (SELECT c.quoted_price FROM public.costings c
                       WHERE c.id = costings.id)
)
```

Trong cùng một câu `UPDATE`, ảnh MVCC mà truy vấn con nhìn thấy là ảnh **trước
khi sửa**. Nếu điều đó đúng, truy vấn con **đọc được `OLD.quoted_price`** — và
tiền đề của định lý sụp.

### 3.1 Vì sao tôi không kết luận

| Câu hỏi | Trạng thái |
|---|---|
| Truy vấn con trong `WITH CHECK` có thấy ảnh trước-sửa không? | **`[NO EVIDENCE]`** — cần dựng policy để đo, mà Board cấm |
| Có chịu bẫy **K-3** không? | **`[INFERRED]` — không.** `costings` đọc được bởi chính vai đang ghi *(đo ở ma trận đọc: `md` thấy 1/1)*. Khác `031c` |
| Chi phí mỗi dòng? | **`[NO EVIDENCE]`** |
| Có đúng khi hai lệnh chạy đồng thời? | **`[NO EVIDENCE]`** — nghi ngờ có tranh chấp, chưa đo |

⚠️ **Đây là chỗ ADR-019 sai.** Tôi đã viết *"phương án duy nhất"* khi **chưa loại
trừ được phương án này**. Đúng loại lỗi tôi vừa mắc hai lần với `B-1`.

---

## 4. So sánh ba phương án

### Phương án A · Giữ nguyên RLS, viết lại policy

**Có biểu diễn được yêu cầu không?** — Nếu chỉ dùng vị từ thuần theo dòng:
**KHÔNG** `[PROVEN]` §2. Nếu dùng truy vấn con: **chưa biết** `[NO EVIDENCE]` §3.

| Tiêu chí | Đánh giá |
|---|---|
| **Security** | 🟢 Không thêm bề mặt tấn công. Không thêm hàm `SECURITY DEFINER`. `[INFERRED]` |
| **Correctness** | 🔴 Bản thuần dòng **chứng minh được là sai** `[PROVEN]`. Bản truy vấn con **chưa đo** |
| **Auditability** | 🟡 Policy đọc được qua `pg_policies` — nhưng đúng truy vấn đó tôi **chưa chạy được lần nào** trong cả chặng này |
| **Simplicity** | 🔴 `WITH CHECK` tự truy vấn lại chính bảng nó đang bảo vệ là cấu trúc **rất khó đọc**; sáu tháng sau không ai dám sửa |
| **Maintainability** | 🔴 Mỗi cột cần bảo vệ là một mệnh đề `=` nữa. `costings` có **19 cột** |
| **Performance** | 🔴 Một truy vấn con **mỗi dòng mỗi lệnh** `[INFERRED]` |

### Phương án B · RLS + Trigger *(phân vai)*

| Lớp | Chịu trách nhiệm | Cơ sở |
|---|---|---|
| **RLS** | **AI** được đụng bảng — theo vai | `042` `costings_read/_insert/_update`, đã `[MEASURED]` đạt ở ma trận ghi `75/75` |
| **Trigger** | **CÁI GÌ** được đổi trên một dòng — so `OLD`/`NEW` | mới |

**Có chồng chéo không? — KHÔNG** `[PROVEN]`: hai lớp trả lời hai câu hỏi tách
rời. RLS **không thể** trả lời câu thứ hai (§2); trigger **không nên** trả lời
câu thứ nhất — nó chạy sau khi dòng đã lọt qua RLS, nên nếu cầm luôn phân quyền
theo vai thì phân quyền sẽ **rời khỏi** `pg_policies`, tức rời khỏi chỗ `A001`
và ma trận đọc/ghi đang soi.

⚠️ Cần gỡ `costings_no_edit_after_approve` — policy đang gây `FAIL`. Đây là
**thay đổi mô hình phân quyền** ⇒ ADR-011 §2.2.

| Tiêu chí | Đánh giá |
|---|---|
| **Security** | 🟢 RLS giữ nguyên vai trò. Trigger **không** `SECURITY DEFINER` ⇒ không khoét lỗ mới `[INFERRED]` |
| **Correctness** | 🟢 Trigger thấy **cả** `OLD` và `NEW` ⇒ biểu diễn được `R` `[PROVEN]` là đủ diễn đạt |
| **Auditability** | 🟡 Luật nằm ở **hai nơi** — `pg_policies` và `pg_trigger`. Ai chỉ soi một nơi sẽ thấy nửa bức tranh |
| **Simplicity** | 🟢 Mỗi lớp một câu hỏi, đọc được rời nhau |
| **Maintainability** | 🟢 Thêm cột cần bảo vệ = thêm một dòng `IF OLD.x IS DISTINCT FROM NEW.x` |
| **Performance** | 🟡 Một lời gọi hàm mỗi dòng — rẻ hơn truy vấn con, **chưa đo** `[NO EVIDENCE]` |

### Phương án C · Trigger hoàn toàn, bỏ RLS

**Có bỏ RLS được không? — KHÔNG.** `[PROVEN]` từ tiền đề `[MEASURED]`:

RLS còn phải chặn **`SELECT`**. Trigger `BEFORE UPDATE` **không chạy khi `SELECT`**.
Bỏ RLS ⇒ `costings_read` biến mất ⇒ **11 vai đang bị chặn đọc sẽ đọc được cơ cấu
giá thành** — ma trận đọc `90/90` sập ngay, và `VR-005` bị vi phạm.

| Tiêu chí | Đánh giá |
|---|---|
| **Security** | 🔴 **Mất toàn bộ phân quyền đọc.** Loại thẳng |
| **Correctness** | 🔴 Không phủ `SELECT` |
| **Auditability** | 🔴 Phân quyền rời khỏi `pg_policies` ⇒ `A001`, ma trận đọc, `RLS_COVERAGE_MATRIX` đều mù |
| **Simplicity** | 🟢 một nơi duy nhất — ưu điểm **duy nhất**, và không đủ |
| **Maintainability** | 🔴 Viết lại bằng tay thứ RLS làm sẵn |
| **Performance** | 🟡 không đo, không cần đo |

---

## 5. Option Comparison Matrix

| Tiêu chí | **A** · RLS thuần | **B** · RLS + Trigger | **C** · Trigger hoàn toàn |
|---|---|---|---|
| Security | 🟢 | 🟢 | 🔴 mất phân quyền đọc |
| Correctness | 🔴 `[PROVEN]` sai *(bản thuần dòng)* | 🟢 | 🔴 không phủ `SELECT` |
| Auditability | 🟡 | 🟡 luật ở hai nơi | 🔴 |
| Simplicity | 🔴 | 🟢 | 🟢 |
| Maintainability | 🔴 19 cột | 🟢 | 🔴 |
| Performance | 🔴 truy vấn con/dòng | 🟡 chưa đo | 🟡 |
| **Kết luận** | ⛔ loại *(trừ khi §3 được đo và thắng)* | ✅ **khuyến nghị** | ⛔ **loại thẳng** |

---

## 6. Nếu chọn Trigger — năm chứng minh Board yêu cầu

| # | Yêu cầu | Mức | Cơ sở |
|---|---|---|---|
| 1 | **Không phá Audit Log** | **`[MEASURED]`** | `041` thu hồi `UPDATE`/`DELETE`/`TRUNCATE` trên `activity_log` với `authenticated`; `INSERT` giữ nguyên. Trigger trên `costings` **không chạm** `activity_log`. `writeAudit` ghi từ tầng ứng dụng bằng `INSERT` — không bị trigger nào chặn. `md-internal-scope` đo `activity_log` bất biến: **đạt** |
| 2 | **Không phá Permission Model** | **`[MEASURED]`** một phần | Phương án B **giữ nguyên** `costings_read/_insert/_update` của `042` — đã đo `90/90` đọc và `75/75` ghi. Trigger chạy **sau** RLS, chỉ thu hẹp thêm. ⚠️ Phần **chưa đo**: việc **gỡ** `costings_no_edit_after_approve` có làm lệch ma trận ghi không `[NO EVIDENCE]` |
| 3 | **Không phá Decision Log** | **`[INFERRED]`** | Decision Log là tài liệu, không phải đối tượng CSDL. Trigger không tạo/xoá quyết định nào. Nhưng nó **thêm** một quyết định phải ghi ⇒ `DL` mới khi Board duyệt |
| 4 | **Không phá Architecture Constitution** | **`[INFERRED]`** | Hiến pháp Điều 8 *(Evidence First)* — trigger **củng cố**, không mâu thuẫn. Hàm SQL phải mang tiền tố `mos_*` (CLAUDE.md §3) ⇒ `mos_guard_costing_lifecycle`. **Không** `SECURITY DEFINER` ⇒ không phải ghi `SECURITY_DEFINER_REGISTRY` |
| 5 | **Không side-effect với Workflow Engine** | **`[NO EVIDENCE]`** | 🔴 Tôi **chưa đọc** Workflow Engine đủ để khẳng định. EDD-04 định bốn workflow archetype nhưng **chưa có** engine chạy trên CSDL. Nếu về sau engine đổi trạng thái bằng `service_role`, trigger **vẫn chặn** — trigger không phân biệt vai trừ khi viết tường minh. **Đây là rủi ro thật, chưa đo** |

### 6.1 Tiền lệ đã chạy trong hệ thống — `[MEASURED]`

Trigger so `OLD`/`NEW` **không phải cấu trúc mới** ở dự án này:

| Trigger | Bảng | Việc |
|---|---|---|
| `adr_append_only_trg` → `ledger_append_only()` | `assignment_daily_reports` | chặn `UPDATE`/`DELETE` sổ cái |
| `assignments_partner_type_trg` | `assignments` | chặn theo loại đối tác |
| `ab_child_guard_trg` · `adr_child_guard_trg` | bảng con | chặn ghi vào cha đã đóng — **cùng hình dạng với `I-3`** |

`rls-external.test.mjs` mục G **đã đo** `ledger_append_only` chạy đúng **cùng
lúc** với RLS: `33 đạt · 0 hỏng`. ⇒ Việc trigger và RLS cùng tồn tại là điều đã
được đo trong chính hệ thống này, không phải giả định.

---

## 7. Risk Matrix

| # | Rủi ro | Khả năng | Hậu quả | Mức | Giảm bằng |
|---|---|---|---|---|---|
| `R1` | Gỡ `costings_no_edit_after_approve` mở lại quyền sửa **trước khi** trigger có hiệu lực | Trung bình | 🔴 lặp lại đúng lỗ hổng `043` | 🔴 | Một migration **duy nhất**: gỡ policy và tạo trigger **trong cùng giao dịch** |
| `R2` | Trigger chặn cả `service_role` ⇒ migration/recovery về sau bị khoá | Cao | 🟠 | Chừa đường theo đúng ba đường hợp lệ của `029b:61`, ghi tường minh |
| `R3` | Workflow Engine tương lai xung đột | **Chưa biết** | 🟠 | `[NO EVIDENCE]` — phải đọc EDD-04 trước khi viết SQL |
| `R4` | Luật nằm hai nơi ⇒ người soi `pg_policies` thấy nửa bức tranh | Cao | 🟡 | `RLS_COVERAGE_MATRIX` thêm cột *"trigger nào phủ"*; `A001` thêm mục liệt kê trigger |
| `R5` | `I-3` rộng hơn `costing_items` — mọi bảng con của chứng từ có trạng thái | **Chưa biết** | 🟠 | `[NO EVIDENCE]` — phải quét trước, không vá từng bảng |
| `R6` | Phương án §3 *(truy vấn con)* thật ra khả thi và rẻ hơn ⇒ chọn B là chọn thừa | Thấp | 🟡 | Đo §3 trước khi viết SQL — **một phép đo, mất vài phút** |

---

## 8. Khuyến nghị cuối cùng

**Chọn Phương án B — nhưng KHÔNG được viết SQL cho tới khi ba phép đo dưới đây
xong.** Đây là điều kiện, không phải gợi ý: chính chỗ *"chưa đo mà kết luận"* đã
gây ra `043`.

| # | Phép đo bắt buộc trước khi viết migration | Trả lời |
|---|---|---|
| **M1** | Truy vấn con trong `WITH CHECK` có đọc được ảnh trước-sửa không? | loại hay giữ **Phương án A** — §3 |
| **M2** | Gỡ `costings_no_edit_after_approve` có làm lệch ma trận ghi `75/75` không? | rủi ro `R1` |
| **M3** | Quét mọi bảng con của chứng từ có trạng thái | phạm vi thật của `I-3` — `R5` |

Cộng thêm **một việc đọc**: EDD-04 Workflow Engine, để đóng `R3` — hiện là
`[NO EVIDENCE]` và tôi **không** được phép biến nó thành `[INFERRED]` bằng lập luận.

### 8.1 Đính chính ADR-019

ADR-019 §4.1 phải sửa: *"Phương án C là phương án duy nhất đủ diễn đạt"* → đúng
phát biểu được chứng minh là **"không cặp `(USING, WITH CHECK)` thuần theo dòng
nào đủ diễn đạt"**. Phương án truy vấn con **chưa bị loại**.

---

## 9. Bảng mức độ tự tin — mọi kết luận trong tài liệu này

| Kết luận | Mức |
|---|---|
| `042` chặn `SUBMITTED → APPROVED` và `APPROVED → SUPERSEDED` | **`[MEASURED]`** |
| Bỏ trống `WITH CHECK` ⇒ lấy nguyên `USING` | **`[MEASURED]`** — hai dấu hiệu lỗi khác nhau |
| Không cặp vị từ **thuần theo dòng** nào biểu diễn được `R` | **`[PROVEN]`** — §2.3 |
| Phương án C *(bỏ RLS)* loại vì không phủ `SELECT` | **`[PROVEN]`** từ tiền đề `[MEASURED]` |
| Trigger và RLS cùng tồn tại được trong hệ thống này | **`[MEASURED]`** — `ledger_append_only`, `rls-external` mục G |
| Trigger không phá Audit Log | **`[MEASURED]`** |
| Trigger không phá Permission Model | **`[MEASURED]`** một phần · phần gỡ policy `[NO EVIDENCE]` |
| Trigger không phá Constitution / Decision Log | **`[INFERRED]`** |
| Trigger không xung đột Workflow Engine | 🔴 **`[NO EVIDENCE]`** |
| Truy vấn con trong `WITH CHECK` khả thi hay không | 🔴 **`[NO EVIDENCE]`** |
| Chi phí hiệu năng của cả A lẫn B | 🔴 **`[NO EVIDENCE]`** |

**Ba dòng 🔴 là ba chỗ tài liệu này KHÔNG kết luận.** Chúng phải được đo trước
khi Board phê duyệt ADR-019, không phải sau.
