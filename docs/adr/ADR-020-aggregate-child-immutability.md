# ADR-020 — Aggregate Child Immutability Engine

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-020 |
| **Trạng thái** | ⏳ Chờ phản biện độc lập + Board phê duyệt |
| **Thẩm quyền** | Board Decision 05/08/2026 — *"Mở ADR-020 · Engine phải hỗ trợ aggregate root và child table bằng metadata"* |
| **Mở rộng** | [ADR-019](ADR-019-vong-doi-chiet-tinh.md) · `045` · `045b` |
| **Hiến pháp** | **Điều 4** *(ADR trước SQL)* · **Điều 8** |
| **Migration** | `046_child_immutability.sql` — ⛔ **chưa viết** |

---

## 1. Problem — `[MEASURED]`

`045` khoá được **aggregate root**. Nó **không** khoá **bảng con**.

**Bối cảnh đo:** CSDL `mnxatxbadgrrolwpmxne` · nền `041`+`042`+`044`+`045` · vai
`md`, phiên thật.

```
✅ costings đã APPROVED  → sửa quoted_price  → BỊ CHẶN (23514)
⛔ costing_items của nó  → sửa unit_price    → SỬA ĐƯỢC, giá thành 88
```

⇒ Khoản mục đổi, **tổng tiền của chứng từ đã duyệt đổi theo**, trong khi bản
thân dòng cha bất động. **Bằng chứng phê duyệt *(Điều 8)* mất giá trị bằng một
đường vòng.**

Board xác nhận: **khoảng trống kiến trúc của Engine**, ⛔ không phải lỗi riêng
của `costings`, và ⛔ không được vá riêng bảng nào.

### 1.1 Phạm vi thật — `[MEASURED]`

`AGGREGATE_IMMUTABILITY_MATRIX` §1: **≥17 aggregate có bảng con**, `orders` có
**22 con** *(9 `CASCADE`)*. Vá riêng một bảng là giải 1/17 và tạo tiền lệ cho 16
bản chép tay lệch nhau.

---

## 2. Decision

Mở rộng **metadata**, ⛔ **không** viết engine thứ hai.

### 2.1 Hai cột mới trên `mos_aggregate_immutability`

```
parent_table  TEXT   bảng cha; NULL ⇒ dòng này là ROOT (hành vi 045, không đổi)
parent_fk     TEXT   cột khoá ngoại trỏ vào cha
```

Một dòng khai báo **hoặc** root **hoặc** con — phân biệt bằng `parent_table IS NULL`.

Ví dụ, thêm `costing_items` = **một `INSERT`**:

```sql
INSERT INTO public.mos_aggregate_immutability
  (table_name, parent_table, parent_fk, mutable_after_final, final_states)
VALUES ('costing_items', 'costings', 'costing_id', ARRAY[]::TEXT[], ARRAY['-']);
```

⛔ Không sửa hàm · ⛔ không thêm trigger mới cho từng bảng.

### 2.2 Engine đọc trạng thái Final **của cha**

Dòng con không có vòng đời riêng. Engine tra `parent_table` → đọc
`status_column` và `final_states` **của cha** → đọc trạng thái dòng cha qua
`parent_fk`.

### 2.3 Ba hành động, ⛔ không phải một

Root chỉ cần chặn `UPDATE`. Con cần **cả ba**:

| Hành động trên con | Vì sao phải chặn |
|---|---|
| `UPDATE` | sửa đơn giá khoản mục ⇒ đổi tổng tiền chứng từ đã duyệt |
| **`INSERT`** | **thêm** khoản mục vào chiết tính đã duyệt ⇒ cùng hậu quả |
| **`DELETE`** | **bớt** khoản mục ⇒ cùng hậu quả |

🔑 `045` chỉ gắn `BEFORE UPDATE`. Chặn `UPDATE` mà quên `INSERT`/`DELETE` là
khoá cửa sổ và mở cửa chính — đúng lỗi `TRUNCATE` ở `041`.

---

## 3. Hai quyết định an ninh phải nói rõ

### 3.1 🔴 Fail-closed khi không đọc được dòng cha

Engine phải đọc dòng cha để biết nó đã Final chưa. Nếu hàm chạy dưới quyền
người gọi *(`SECURITY INVOKER`)* và RLS che dòng cha ⇒ truy vấn trả **0 dòng**.

Hai lối xử, và lối sai rất hấp dẫn:

| | Hành vi | Đánh giá |
|---|---|---|
| **Fail-open** | không thấy cha ⇒ **cho qua** | ⛔ **Bất kỳ ai không đọc được cha đều sửa được con.** Biến RLS thành đường vòng, ⛔ không phải hàng rào |
| **Fail-closed** | không thấy cha ⇒ **CHẶN** | ✅ **Chọn.** Không đọc được cha thì không có tư cách sửa con |

⇒ **Không** dùng `SECURITY DEFINER`. Giữ `SECURITY INVOKER` + fail-closed: bề
mặt tấn công không rộng thêm, và `SECURITY_DEFINER_REGISTRY` không dài thêm.

### 3.2 🔴 Ngoại lệ `ON DELETE CASCADE`

`costing_items.costing_id` khai `ON DELETE CASCADE`. Khi cha bị xoá, Postgres
tự phát `DELETE` lên con — và trigger sẽ **chặn**, làm hỏng cả lệnh xoá cha.

Phân biệt bằng một phép đo tại chỗ: **dòng cha còn tồn tại hay không.**

```
DELETE trên con  +  dòng cha KHÔNG còn   ⇒ đang cascade  ⇒ CHO QUA
DELETE trên con  +  dòng cha CÒN, đã Final ⇒ xoá trực tiếp ⇒ CHẶN
```

⚠️ **Đây là chỗ tôi có thể sai** — xem §6 mục 2.

---

## 4. Alternatives Considered

| Phương án | Vì sao không chọn |
|---|---|
| **A · Trigger riêng cho `costing_items`** | ⛔ Board cấm tường minh. Và `M3` đo được ≥17 aggregate cùng hình dạng |
| **B · Suy quan hệ cha–con từ khoá ngoại trong `pg_constraint`** | Tự động nhưng **đoán ý đồ**: không phải FK nào cũng là quan hệ *"con thuộc chứng từ"* — `customer_id` cũng là FK. Đoán sai ⇒ khoá nhầm bảng. Khai báo tường minh **đắt hơn một dòng, rẻ hơn một sự cố** |
| **C · Chặn ở tầng ứng dụng** | ⛔ Ai có token đều gọi thẳng PostgREST. Đúng lỗi tầng `042` sinh ra để sửa |
| **D · Cột `is_locked` trên bảng con, đồng bộ bằng trigger** | Lưu dữ liệu **tính toán được** — trái CLAUDE.md §2.5. Và tạo bài toán đồng bộ mới |

---

## 5. Impact

| | |
|---|---|
| **Lược đồ** | thêm **2 cột** vào bảng metadata. ⛔ Không đụng bảng nghiệp vụ nào |
| **Hàm** | mở rộng **một** hàm sẵn có. ⛔ Không tạo hàm thứ hai |
| **`costings`** | ⛔ không đổi — dòng root giữ `parent_table = NULL` |
| **Hiệu năng** | thêm **một** `SELECT` theo khoá chính mỗi dòng con bị ghi. Chỉ chạy khi bảng **có khai báo** |
| **Aggregate khác** | ⛔ không ảnh hưởng cho tới khi được khai báo tường minh |

---

## 6. Chỗ tôi có thể sai — ADR-011 §2.3 mục 4

1. **Chưa dựng thử.** Toàn bộ §2–§3 là **thiết kế**, `[NO EVIDENCE]`. Phải đo
   sau khi `046` chạy — đúng `P-MEASURE`, và đúng chỗ tôi đã vi phạm ba lần.
2. 🔴 **Phép phân biệt cascade ở §3.2 chưa được đo.** Tôi giả định trigger
   `BEFORE DELETE` trên con **nhìn thấy dòng cha đã biến mất** trong lúc cascade.
   Nếu Postgres xoá con **trước** cha thì phép phân biệt **sai hoàn toàn**, và
   mọi lệnh xoá cha sẽ bị chặn. **Phải đo trước khi Board duyệt.**
3. **`mutable_after_final` của con** tôi để rỗng — nghĩa là con của chứng từ đã
   duyệt **bất động hoàn toàn**. Nếu nghiệp vụ cần sửa ghi chú trên khoản mục,
   giả định này sai. Board/`BKB` trả lời.
4. **Con của con** *(cháu)* không được phủ. `costing_items` không có bảng con,
   nhưng `orders → cut_tickets → cut_bundles` thì có. Thiết kế này **chỉ một
   tầng**. Ghi thành `TD-33`.

---

## 7. Decision Record

> ⏳ **CHƯA QUYẾT.**

| Trường | Giá trị |
|---|---|
| **Phép đo bắt buộc trước khi duyệt** | §6 mục 2 — hành vi cascade |
| **Ngày phản biện độc lập** | |
| **Ngày Board phê duyệt** | |

---

## 8. References

- [ADR-019](ADR-019-vong-doi-chiet-tinh.md) Revision 2 · Board Decision `W.1` · `A1`
- [`AGGREGATE_IMMUTABILITY_MATRIX.md`](../architecture/AGGREGATE_IMMUTABILITY_MATRIX.md) §1 — `M3`, ≥17 aggregate có bảng con
- `supabase/migrations/045_aggregate_immutability_engine.sql` · `045b_a1_final_states.sql`
- `tests/security/costing-lifecycle.test.mjs` mục `C` — phép đo `B-3`
- Hiến pháp **Điều 8** · CLAUDE.md §2.5
