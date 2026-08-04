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
