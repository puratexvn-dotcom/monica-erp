# `ADR-018` — Hồ sơ phản biện hậu kiểm

| Trường | Giá trị |
|---|---|
| **Hạng mục** | [ADR-018](../adr/ADR-018-thu-hep-authenticated-only.md) — Thu hẹp `authenticated_only` trên 23 bảng |
| **Loại theo ADR-011 §2.2** | thay đổi **RLS/policy** · thay đổi **mô hình phân quyền** — thuộc diện **bắt buộc** phản biện |
| **Kiến trúc sư trình** | Chief Solution Architect |
| **Người phản biện** | 🔴 **KHÔNG CÓ — xem cảnh báo dưới** |
| **Ngày trình** | 05/08/2026 |
| **Ngày phản biện** | 05/08/2026 *(tự phản biện)* |
| **Kết luận** | ⚠️ **Tiếp thu — phát hiện 1 lỗi 🔴 và 3 lỗi 🟠/🟡** |
| **Thẩm quyền** | Board Directive 05/08/2026 — *"Phương án A · phản biện hậu kiểm để hoàn tất hồ sơ quản trị"* |

---

## 🔴 CẢNH BÁO VỀ TÍNH ĐỘC LẬP — ĐỌC TRƯỚC

**Hồ sơ này KHÔNG thoả điều kiện độc lập của ADR-011.**

[ADR-011](../adr/ADR-011-tham-quyen-kien-truc.md) §1.3 chỉ định người phản biện là
**ChatGPT**, và §1.2 nêu đúng lý do:

> *"Một tác nhân tự tuyên bố mình thắng trong tranh chấp thẩm quyền của chính
> mình là xung đột lợi ích, **bất kể lập luận có hợp lý đến đâu**."*

Phần B dưới đây do **chính người soạn ADR-018 viết**. Nó là **tự phản biện đối
kháng**, không phải phản biện độc lập. Tôi ghi rõ điều này thay vì để cái tiêu đề
*"Independent Review"* làm hồ sơ trông đầy đủ hơn thực tế.

**Cái tự phản biện làm được:** đọc lại mã ứng dụng đối chiếu với policy vừa ban
hành, và tìm ra chỗ hai bên mâu thuẫn. Phần B tìm được **bốn** chỗ như vậy, một
trong đó là **hồi quy đang phá vỡ quy trình nghiệp vụ trên CSDL thật**.

**Cái nó KHÔNG làm được:** chất vấn những chỗ tôi *tự tin*. Bốn giả định bị bắt
sai ở ADR-011 §1.4 (`A1`–`A4`) đều là chỗ tôi tự tin, không phải chỗ tôi phân
vân — và không phép tự soi nào bắt được chúng. Cụ thể ở đây, tôi **không tự kiểm
chứng được**:

- Phân tầng T1/T2/T3 có khớp cách nhà máy vận hành thật không
- `giamdoc` chỉ đọc mà không ghi có đúng vai người duyệt trong thực tế không
- Danh sách 5 cột bị bỏ khỏi `v_costing_approved` có đúng ranh giới *"dữ liệu
  thương lượng"* mà kế toán hiểu không

⇒ Phần B để **trống một cột** cho ChatGPT. Board có thể đóng hồ sơ với hiện
trạng, nhưng khoảng trống đó là thật và tôi không lấp nó bằng chữ của mình.

---

## Phần A — Hồ sơ kiến trúc sư trình (ADR-011 §2.3)

### A.1 Đề xuất

Thay policy `authenticated_only` (`FOR ALL TO authenticated USING (auth.uid() IS
NOT NULL)` + `GRANT ALL`) trên 22 bảng Merchandising bằng hai tầng:

- **Privilege** — `REVOKE TRUNCATE, TRIGGER, REFERENCES` (22 bảng) · `REVOKE
  DELETE` (16 bảng)
- **Policy** — bộ ba `_read` / `_insert` / `_update` tách theo hành động, điều
  kiện qua `mos_current_role()`; phân ba tầng T1/T2/T3
- **Phép chiếu** `v_costing_approved` cho `ketoan` — thi hành `VR-005`

**Ngoài phạm vi:** `buyer_denied` · `subcon_denied` · chuỗi `031` ·
`service_role` · lược đồ · Business Rule.

### A.2 Bằng chứng đo được

| Phép đo | Trước | Sau | Nguồn |
|---|---|---|---|
| Bài kiểm phân quyền nội bộ | `0 đạt · 24 hỏng` | `18 đạt · 6 hỏng` | `md-internal-scope.test.mjs` |
| Ma trận đọc 14 vai × 5 đối tượng | ⚪ chưa đo được | **`90 đạt · 0 hỏng`** | `md-read-matrix.test.mjs` |
| Bảng còn `authenticated_only` | 22 | **0** | khối kiểm tra `042` |
| `A001` view security | ⛔ hỏng | **ĐẠT** | `A001` 05/08 |

### A.3 Phương án đã loại

Năm phương án, ghi ở ADR-018 §8 — chỉ `REVOKE`; chỉ policy; chuyển thẳng sang
Assignment; bảng ánh xạ vai trong CSDL *(rơi vào bẫy K-3)*; không làm gì.

### A.4 Chỗ tôi có thể sai

Sáu mục ở ADR-018 §9.4. **Mục 1 đã thành hiện thực** — xem `B-1` và `B-2`.

---

## Phần B — Ý kiến phản biện

> **R-3 của `docs/review/README.md`:** ghi cả ý kiến bị bác, kèm lý do bác.

| # | Ý kiến | Loại | Nguồn | Xử lý |
|---|---|---|---|---|
| ~~**B-1**~~ | ~~`042` phá vỡ luồng lập phiên bản chiết tính~~ | ~~🔴~~ | tự soi | ⛔ **BÁC — phép đo chứng minh tôi SAI** |
| **B-2** | `042` **đóng băng một vi phạm SoD** vào tầng CSDL: người lập chiết tính cũng là người duyệt | 🟠 cần trả lời | tự soi | ✅ tiếp thu — `TD-32`, cần ADR riêng |
| ~~**B-3**~~ | ~~Khoản mục trên chiết tính đã duyệt sửa được ⇒ margin lệch~~ | ~~🟡~~ | tự soi | ⛔ **BÁC — đã bị chặn sẵn** |
| **B-3′** | Đường chặn của `costing_items` trả **0 dòng, KHÔNG lỗi** — im lặng | 🟡 gợi ý | phép đo | ✅ tiếp thu — vá tầng mã |
| **B-4** | Khối kiểm tra `042` có một phép đếm sai | 🟡 gợi ý | tự soi | ✅ đã ghi ADR-018 §10.3.1 |
| **B-5** | *(để trống — chờ người phản biện độc lập)* | | ChatGPT | ⏳ |

> ## 🔴 ĐÍNH CHÍNH LẦN HAI — 05/08/2026, SAU KHI ĐO LẠI CÓ KIỂM SOÁT
>
> **Phần `B-1` dưới đây — cả bản gốc LẪN bản rút lại — đều dựng trên nền sai.**
> Sự thật chỉ lộ ra ở lần đo thứ ba, và nó nghiêm trọng hơn cả hai:
>
> | Giai đoạn | Tôi kết luận | Thực tế |
> |---|---|---|
> | ① | `042` chặn `APPROVED → SUPERSEDED` ⇒ 🔴 `B-1`, soạn `043` | **suy diễn, không đo** |
> | ② | Đo thấy phép chuyển chạy được ⇒ *"`B-1` do tôi bịa"*, xoá `043` | **`043` ĐÃ ĐƯỢC CHẠY lên CSDL** — tôi đo hệ thống đã bị chính bản vá của mình đổi, mà không biết |
> | ③ | Đo có kiểm soát | 🔴 **`043` đang mở một lỗ hổng toàn phần** |
>
> **Phép đo quyết định** — vai `md`, phiên thật, chiết tính `APPROVED`:
>
> ```
> approved_at = NULL   → UPDATE quoted_price → 42501, giá giữ 10   ✅
> approved_at ĐÃ ĐẶT   → UPDATE quoted_price → KHÔNG LỖI, giá 777  🔴
> ```
>
> `setCostingStatus` (`commercial.actions.ts:322`) đặt `approved_at` **cùng lúc**
> với `status='APPROVED'`. Nên **mọi chiết tính duyệt thật đều sửa giá được**.
> Lỗ hổng là **toàn phần**. Vi phạm Hiến pháp **Điều 8**.
>
> Và tác dụng phụ thứ hai của `043`: `costing_items` của chiết tính đã duyệt
> **biến mất khỏi giao diện** — đo được, `md` **và** `superadmin` đều thấy `0`
> khoản mục khi cha ở `APPROVED`/`SUPERSEDED`, vì `FOR ALL` áp lên cả `SELECT`.
>
> ⇒ **`044_restore_costing_lock.sql`** khôi phục nguyên văn policy của `042`.
> ⛔ Chưa chạy — chờ Board.
>
> ⚠️ **Hệ quả: `B-1` có thể là lỗi THẬT.** Sau khi `044` chạy, nếu
> `costing-lifecycle` báo đỏ đúng chỗ `APPROVED → SUPERSEDED` thì `B-1` được xác
> lập **bằng bằng chứng** — và khi đó mới soạn bản vá, **qua ADR, không vá thẳng**.
> Tôi **không** kết luận trước ở đây.

### ⛔ B-1 — bản rút lại *(giữ nguyên theo Điều 43.7 — đọc kèm đính chính trên)*

**Tôi đã kết luận `042` phá vỡ `reviseCosting` và soạn cả migration `043` để vá.
Phép đo trên CSDL thật bác bỏ cả hai.**

Lập luận sai của tôi: policy `costings_no_edit_after_approve` có `USING (status
NOT IN ('APPROVED','SUPERSEDED'))`, nên dòng `APPROVED` không `UPDATE` được, nên
phép chuyển `APPROVED → SUPERSEDED` bị chặn **âm thầm**.

Tôi **không đo**, chỉ đọc policy rồi suy ra. Khi đo thật:

```
gieo #1 status thật = APPROVED
md đổi status →  1 dòng  SUPERSEDED          ← CHẠY ĐƯỢC
md đổi giá    →  LỖI 42501 new row violates row-level security policy
                 "costings_no_edit_after_approve"
```

**Hai điều tôi khẳng định đều sai:**

| Tôi nói | Sự thật đo được |
|---|---|
| `APPROVED → SUPERSEDED` bị chặn | ✅ **chạy được** — `reviseCosting` KHÔNG hỏng |
| Nó hỏng **âm thầm** | ⛔ Sửa nội dung báo lỗi **42501, rất to** — không im lặng chút nào |

Mã lỗi `42501` kèm chữ *"**new row** violates"* là dấu vết của `WITH CHECK`, không
phải `USING`. Nghĩa là tôi hiểu sai cả cơ chế Postgres đang áp dụng, chứ không chỉ
sai kết luận.

⇒ **`042` đang hành xử đúng ý định:** cấm sửa **nội dung** chiết tính đã duyệt, cho
phép **chuyển trạng thái** sang `SUPERSEDED`. Đúng thứ Điều 8 đòi hỏi.

### 🔴 Và `043` của tôi sẽ LÀM YẾU ĐI hệ thống

Đây là phần nghiêm trọng nhất của bản rút lại. `043` tôi viết đặt:

```sql
WITH CHECK (status <> 'APPROVED' OR approved_at IS NOT NULL)
```

Chiết tính đã duyệt **luôn có `approved_at`** — `setCostingStatus` gán nó cùng lúc
với `status` (`commercial.actions.ts:322`). Nên vế đó **luôn đúng** với mọi dòng đã
duyệt ⇒ `042` đang chặn sửa giá, `043` sẽ **mở lại**.

**Tôi suýt gỡ một hàng rào đang chạy đúng, để vá một lỗi không tồn tại.**
`043` đã bị **xoá khỏi kho**, không phải sửa.

### ⛔ B-3 — cũng sai, cùng một họ

Tôi cho rằng khoản mục của chiết tính đã duyệt vẫn sửa được. Đo thật:

```
item trên DRAFT     → 1 dòng, giá 3
item trên APPROVED  → 0 dòng          ← đã bị chặn sẵn
giá THẬT sau cùng   → 3
```

Đã có thứ gì đó chặn. **Tôi chưa xác định được là thứ gì** — `pg_policies` không
đọc được qua PostgREST, và tôi **không đoán tiếp nữa** trong chính bản rút lại
một suy đoán. Xem câu hỏi mở ở Phần D.

### B-3′ 🟡 Điều còn lại có thật: đường chặn kia IM LẶNG

Phép đo để lộ một điều đáng giữ: `costing_items` bị chặn trả về **0 dòng, KHÔNG
lỗi**, trong khi `costings` bị chặn thì **ném 42501**. Hai bảng cạnh nhau, hai
kiểu báo hỏng khác nhau.

Đường im lặng là đường nguy hiểm: mã gọi không kiểm số dòng sẽ tưởng đã ghi xong.
`commercial.actions.ts:435` **đúng là loại mã đó** — nó gọi rồi bỏ qua kết quả.
Hôm nay `costings` may mắn không đi đường im lặng, nhưng bảng ngay cạnh thì có.

⇒ Vá tầng mã: kiểm **cả `error` lẫn số dòng khớp**. Giữ lại vì lý do này, **không
phải** vì `B-1`.

### B-2 🟠 `042` đóng băng một vi phạm phân tách nhiệm vụ

**Bằng chứng.** `042` cho `costings` quyền ghi vào `superadmin,md`. Còn
`lib/rbac.ts:76-77`:

```
giamdoc: ['/giam-doc', '/orders', '/subcon'],     ← KHÔNG có /md
md:      ['/md', ...],
```

`setCostingStatus` (`commercial.actions.ts:308`) — hàm đặt `status='APPROVED'` —
nằm trong `/md`. ⇒ **`giamdoc` không tới được nó, và cũng không có quyền `UPDATE`
`costings` ở tầng CSDL.**

Nghĩa là **người lập chiết tính cũng chính là người duyệt chiết tính**.

Điều này **trái Board Working Principle v2.0**: *"costing chỉ được duyệt bởi giám
đốc sản xuất"*, và trái tinh thần `SOD-H*` của EDD-04B.

⚠️ **Đây KHÔNG phải hồi quy do `042`.** Trước `042`, *mọi* vai đều duyệt được —
tệ hơn. Nhưng `042` **đóng băng** trạng thái sai này vào tầng CSDL và làm cho
cách sửa đúng *(giám đốc duyệt)* cần thêm một migration nữa.

Tôi đã viết ở ADR-018 §5.1 rằng *"`giamdoc` đọc mà không ghi — đúng vai người
duyệt"*. **Câu đó sai.** Người duyệt phải **ghi** được `status`, `approved_by`,
`approved_at`. Tôi nhầm *"không được sửa nội dung chiết tính"* với *"không được
ghi gì cả"*.

### B-3 🟡 Sửa khoản mục trên chiết tính đã duyệt ⇒ biên lợi nhuận lệch âm thầm

`addCostingItem` / `removeCostingItem` gọi `syncCostingMargin` (`:261`, `:273`),
hàm này `UPDATE costings SET margin_percent`. Trên chiết tính `APPROVED`, lệnh
`UPDATE` bị `costings_no_edit_after_approve` chặn, trong khi `costing_items` **vẫn
sửa được** — bảng đó không có ràng buộc theo trạng thái.

⇒ Khoản mục đổi, `margin_percent` đứng yên. Cùng họ với `B-1`: **thao tác thành
công một nửa, không ai được báo.**

### B-4 🟡 Phép đếm `Policy _read mới` thiếu bộ lọc bảng

Đã ghi và sửa ở ADR-018 §10.3.1. Không ảnh hưởng kết luận vì hai phép đo độc lập
khác đã chứng minh `042` đúng.

---

## Phần C — Kiến trúc sư trả lời

**C-1 · `B-1` — BÁC BỎ chính ý kiến của tôi.** `043` đã **xoá khỏi kho**, không
sửa. Không có gì cần vá.

Điều đáng nói không phải "tôi sai" mà là **tôi sai theo cách nào**: tôi đọc biểu
thức policy, suy ra hành vi, rồi viết một 🔴 vào hồ sơ quản trị — **không chạy một
lệnh nào để kiểm**. Đây đúng lỗi Hiến pháp **V.1** và mục 2 của ADR-011 §2.3
*("nhận định không kèm phép đo không phải bằng chứng")*, mắc trong chính văn bản
lẽ ra phải bắt loại lỗi đó.

Và nó **suýt gây hại thật**: `043` sẽ mở lại quyền sửa chiết tính đã duyệt. Nếu
Board chạy nó theo thói quen tin bản phản biện, `042` mất một hàng rào **đang chạy
đúng** — vá một lỗi không tồn tại bằng cách tạo một lỗ hổng có thật.

**C-2 · `B-2` — tiếp thu, KHÔNG sửa ở đây.** Cho `giamdoc` quyền ghi `costings`
là **thay đổi mô hình phân quyền** ⇒ ADR-011 §2.2 ⇒ cần ADR riêng và phản biện
riêng. Ghi `TD-32`, trình Board như hạng mục độc lập.

Ý kiến này **có bằng chứng đo được**, khác `B-1`: bài kiểm vòng đời cho thấy `md`
tự chuyển được `SUBMITTED → APPROVED`, còn `giamdoc` không có `/md` trong
`MODULE_ACCESS` (`lib/rbac.ts:76`) lẫn không có quyền ghi `costings` trong `042`.

**C-3 · `B-3` — BÁC BỎ.** Đã bị chặn sẵn. **C-3′ · `B-3′` — tiếp thu**, vá tầng
mã, không đụng CSDL.

**C-4 · `B-4` — đã xử lý** ở ADR-018 §10.3.1.

**C-5 · Về `B-5`:** tôi **không** điền thay người phản biện độc lập.

---

## Phần D — Trình Board

| Trường | Giá trị |
|---|---|
| **Ý kiến 🔴 còn treo** | **1** — lỗ hổng do `043` để lại đang MỞ trên CSDL. `044` soạn xong, ⛔ chưa chạy |
| **Ý kiến 🟠 còn treo** | **1** — `B-2`, chuyển thành `TD-32` + ADR riêng |
| **Thay đổi lên Implementation** | **Không đụng CSDL.** Chỉ vá tầng mã: `commercial.actions.ts` kiểm `error` **và** số dòng khớp |
| **Điều kiện `R-2`** | ⛔ **KHÔNG thoả** — còn 1 ý kiến 🔴 |
| **Bài kiểm mới** | `costing-lifecycle.test.mjs` — **`6 đạt · 1 hỏng`**, mục hỏng chính là lỗ hổng đang mở |
| **Ngày Board phê duyệt** | |

### Câu hỏi mở — cần Board chạy một truy vấn

`costing_items` của chiết tính đã duyệt bị chặn *(0 dòng)*, nhưng **tôi không xác
định được policy nào chặn**. `pg_policies` không đọc được qua PostgREST, và tôi
vừa rút lại một suy đoán nên **không đoán tiếp**:

```sql
SELECT tablename, policyname, permissive, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('costings','costing_items')
ORDER BY tablename, policyname;
```

Biết chính xác cái gì đang chặn mới trả lời được câu **hành vi này là thiết kế hay
tình cờ** — và chỉ thứ nhất mới đáng tin.

---

## Phụ lục

> **R-4:** hồ sơ đã phê duyệt thì không sửa. Thông tin mới ghi xuống đây.

**05/08/2026 — điều rút ra, và nó không phải điều tôi định viết.**

Bản nháp đầu của phụ lục này viết: *"`042` đi qua bốn cổng mà không cổng nào bắt
được `B-1`; cần bổ sung phép kiểm vòng đời."* Nghe rất thuyết phục.

**Nhưng `B-1` không tồn tại.** Bốn cổng không bỏ sót gì cả — chính bản phản biện
mới là thứ sinh ra một lỗi giả, rồi kèm theo một migration làm yếu hệ thống.

Bài học thật, đắt hơn:

| | |
|---|---|
| **Cái sai** | Đọc biểu thức policy → suy ra hành vi → ghi 🔴 vào hồ sơ quản trị. **Không chạy một lệnh nào.** |
| **Cái đúng lẽ ra phải làm** | Chạy đúng phép chuyển đó bằng phiên đăng nhập thật — **mất 30 giây**, và nó bác bỏ toàn bộ |
| **Vì sao nguy hiểm** | Suy diễn sai **kèm lý lẽ mạch lạc** đi xa hơn suy diễn sai vụng về. `043` có bình luận đầy đủ, có phần hoàn tác, có khối kiểm tra — trông y hệt một bản vá tử tế |

ADR-011 §4.2 đã cảnh báo đúng chỗ này: *"Thiết kế sai của tôi giờ đi xa hơn trước
khi bị chặn… §2.3 mục 4 và §2.4 mục 5 là hai đối trọng, nhưng chúng là **kỷ luật**,
không phải **cơ chế cưỡng chế**."* Lần này kỷ luật đủ — vì tôi chạy bài kiểm trước
khi trình. **Nó suýt không đủ.**

⇒ Đề xuất giữ lại, dù lý do đổi: **phép kiểm vòng đời** vào Cổng D. Không phải để
bắt lỗi `042` bỏ sót, mà để **mọi khẳng định về hành vi policy đều phải có một
phép chạy đứng sau** — kể cả khẳng định trong một bản phản biện.

`tests/security/costing-lifecycle.test.mjs` là bản đầu tiên: 7 phép chuyển, mỗi
phép cấm kèm một phép đối chứng.
