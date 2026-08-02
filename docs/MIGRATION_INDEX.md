# MIGRATION INDEX — GIẢI THÍCH CÁC KHOẢNG TRỐNG SỐ HIỆU

> **Tài liệu sống.** Cập nhật mỗi khi thêm migration hoặc mỗi khi một số hiệu
> được đặt chỗ / bỏ qua.
>
> Lập 02/08/2026 sau một lượt điều tra lịch sử: ba số hiệu `008`, `032`, `033`
> vắng mặt trong `supabase/migrations/`, và **không tài liệu nào giải thích vì
> sao**. Người đọc sau gặp khoảng trống trong dãy số sẽ phải tự đoán — mà đoán
> sai ở đây nghĩa là **tưởng có migration bị mất**.

---

## 0. PHƯƠNG PHÁP ĐIỀU TRA — ĐỂ NGƯỜI SAU KIỂM CHỨNG ĐƯỢC

Không suy từ tên tệp hay trí nhớ. Quét **mọi cây tệp của mọi commit** trong kho:

```bash
git rev-list --all | while read c; do git ls-tree -r --name-only "$c"; done \
  | sort -u | grep -E "(^|/)(008|032|033)"
```

Kết quả: **rỗng**. Cộng thêm một lượt theo đường dẫn:

```bash
git log --all --oneline --name-status -- 'supabase/migrations/008*' \
  'supabase/migrations/032*' 'supabase/migrations/033*'
```

Kết quả: **rỗng**.

> **Kết luận đo được: không tệp nào mang ba số hiệu này từng tồn tại trong bất
> kỳ commit nào. Không có gì bị xoá.**

Hai lệnh trên là **phép kiểm lặp lại được** — chạy lại bất cứ lúc nào để xác
minh, thay vì phải tin tài liệu này.

---

## 1. TRẢ LỜI TRỰC TIẾP BA SỐ HIỆU ĐƯỢC HỎI

### `008` — ⚪ CHƯA TỪNG TỒN TẠI · KHÔNG CÓ LÝ DO ĐƯỢC GHI LẠI

| Câu hỏi | Trả lời |
|---|---|
| Có từng tồn tại? | **Không.** Không commit nào chứa tệp `008*` |
| Bị xoá khi nào, commit nào? | **Không áp dụng** — chưa từng tồn tại để mà xoá |
| Reserved / intentionally skipped? | **Skipped** — nhưng **không có tài liệu nào ghi lý do** |
| Còn là planned migration? | **Không.** Không tài liệu, ADR, hay ghi chú nào đặt chỗ cho `008` |

**Sự kiện quan sát được, theo đúng thứ tự thời gian** *(cùng ngày 27/07/2026)*:

| Giờ | Commit | Tệp thêm vào |
|---|---|---|
| 21:55 | `fa403c3` | `007_packing_shipping_schema.sql` |
| **22:08** | `2aae166` | **`007b_architecture_refactor.sql`** |
| 23:26 | `33f3c7a` | `009_subcontracting_schema.sql` |

Migration kế tiếp sau `007` nhận **hậu tố `b`** thay vì số tiếp theo, rồi tệp
sau đó nhảy thẳng tới `009`. Số `008` không bao giờ được dùng.

> ⚠️ **Vì sao lại thế thì KHÔNG có nơi nào ghi.** Tôi ghi lại sự kiện quan sát
> được, và **cố ý không suy diễn** ý định của người viết. Đây là một khoảng
> trống trong hồ sơ, không phải một quyết định đã được ghi.

**Trạng thái đề nghị:** `008` là **số chết** — không đặt chỗ, không dùng lại.
Tái sử dụng nó bây giờ sẽ khiến mọi tham chiếu lịch sử tới "khoảng trống 008"
trở nên khó hiểu, đổi lấy đúng một con số.

---

### `032` — 🔵 RESERVED · PLANNED, ĐANG BỊ CHẶN

| Câu hỏi | Trả lời |
|---|---|
| Có từng tồn tại? | **Không.** Không commit nào chứa tệp `032*` |
| Bị xoá khi nào? | **Không áp dụng** |
| Reserved / intentionally skipped? | **RESERVED** — đặt chỗ có chủ ý, tài liệu hoá dày |
| Còn là planned migration? | **Có** — xem lý do chưa tạo bên dưới |

**Nội dung đã được phê duyệt:** *Cleanup — gỡ `025` và `026`.*

**Bằng chứng đặt chỗ** *(6 nguồn độc lập)*:

| Nguồn | Nguyên văn |
|---|---|
| `docs/assignment/07-migration-impact.md:141` | `9. Gỡ 025 · 026 → 032` |
| `docs/assignment/07-migration-impact.md:195` | `032 · Cleanup — gỡ 025 · 026 · sau khi 10 bài kiểm xanh` |
| `docs/assignment/09-folder-tree.md:84` | `032_cleanup.sql — Cleanup — gỡ 025 · 026` |
| `docs/assignment/10-risk-analysis.md:61` | *"Migration 032 gỡ 025/026, chạy **sau** khi Assignment đã được…"* |
| [`ADR-002:195`](adr/ADR-002-assignment-domain.md) | *"030 (Permission Engine) · 031 (RLS — điểm không quay lại) · **032 (dọn dẹp)**"* |
| [`ADR-006:185`](adr/ADR-006-permission-engine.md) | *"**gỡ nó ở một migration RIÊNG (032)** thì giữa hai lần chạy hệ thống quay về đúng…"* |

Dãy `027–032` còn được bảo vệ tường minh trong chính mã migration:

- `026b:32` — *"Đánh số **026b** để KHÔNG phá dãy **027–032** đã được phê duyệt cho Assignment."*
- `027:272` — *"Đây là điểm dừng an toàn tuyệt đối của cả chuỗi **027–032**."*

**Lý do chưa tạo:** `032` gỡ hàng rào cũ (`025`, `026`). Gỡ hàng rào cũ **trước
khi** hàng rào mới được chứng minh đầy đủ là tự mở lại đúng những lỗ hổng mà
`025`/`026` đang cầm máu. Chuỗi `031` chưa xong — mới tới `031c3`, còn
`031d`→`031g` — nên `032` **bị chặn theo thiết kế**, không phải bị quên.

> `ADR-006:185` nói rõ vì sao phải là **một migration riêng**: gộp việc gỡ vào
> cùng migration dựng hàng rào mới thì giữa hai lần chạy hệ thống **không quay
> về được trạng thái an toàn nào cả**.

---

### `033` — 🔵 RESERVED · PLANNED, CHIA GIAI ĐOẠN CÓ CHỦ Ý

| Câu hỏi | Trả lời |
|---|---|
| Có từng tồn tại? | **Không.** Không commit nào chứa tệp `033*` |
| Bị xoá khi nào? | **Không áp dụng** |
| Reserved / intentionally skipped? | **RESERVED** |
| Còn là planned migration? | **Có** — giai đoạn 2 của `request_id` |

**Nội dung đã được phê duyệt:** mở rộng cột `request_id` sang **bảy bảng chứng
từ còn lại**.

**Bằng chứng đặt chỗ:**

| Nguồn | Nội dung |
|---|---|
| `029c_request_id.sql:19` | `033 → shipments · orders · qa_logs · capa_logs · subcon_orders · subcon_receipt_logs · financial_records` |
| Playbook **XXXIV.6** | bảng giai đoạn: `029c` ✅ · **`033` ⏳** |
| [`ADR-003:216`](adr/ADR-003-request-id.md) | *"Giai đoạn 033 chạm vào bảy phân hệ đang chạy, mỗi phân hệ cần nghiệm thu riêng."* |
| [`ADR-003:227`](adr/ADR-003-request-id.md) | *"Rà bảy bảng còn lại, mỗi bảng một lượt nghiệm thu → 033"* |
| [`ADR-003:248`](adr/ADR-003-request-id.md) | *"Giai đoạn 033 — hoàn tác từng miền một."* |
| `docs/adr/README.md:14` | ADR-003 · Migration `029c` → `033` · Đã phê duyệt |

**Lý do chưa tạo** — nguyên văn Playbook XXXIV.6:

> ⚠️ Chia giai đoạn là **yêu cầu về tính đúng đắn**, không phải để đỡ việc: cột
> và nhánh bắt `23505` **phải đi cùng nhau**. Thêm cột vào một bảng mà service
> chưa biết bắt lỗi là **làm hỏng một phân hệ đang chạy**.

Nói cách khác: `033` không thể là một migration SQL đơn độc. Mỗi bảng trong bảy
bảng cần **cột + nhánh bắt `23505` trong service + biểu mẫu sinh khoá lúc MỞ +
bài kiểm gửi hai lần** — bảy lượt nghiệm thu riêng. Nó chờ **năng lực nghiệm
thu**, không chờ ai viết SQL.

---

## 2. HAI KHOẢNG TRỐNG KHÁC — KHÔNG ĐƯỢC HỎI, NHƯNG PHẢI GHI

Rà dãy số phát hiện thêm hai chỗ. Ghi ở đây để lần sau không ai phải điều tra lại.

### `035b` — 🟢 ĐÃ CHẠY, NHƯNG **KHÔNG PHẢI SQL**

**Đây là khoảng trống dễ gây hiểu lầm nhất trong toàn bộ dãy số**, vì tài liệu
khẳng định nó *đã chạy* trong khi không có tệp `.sql` nào mang tên đó.

Giải thích, có bằng chứng: `035` triển khai **Expand → Migrate → Contract**, và
bước **MIGRATE là một thay đổi MÃ NGUỒN**, không phải SQL.

| Bước | Dạng | Tệp |
|---|---|---|
| `035a` EXPAND | SQL | `035a_udmd_i18n_expand.sql` ✅ |
| **`035b` MIGRATE** | **TypeScript** | *(không có tệp `.sql` — đúng thiết kế)* |
| `035c` CONTRACT | SQL | `035c_udmd_i18n_contract.sql` ✅ |

[`ADR-005:190`](adr/ADR-005-udmd-i18n-and-soft-delete.md) mô tả `035b` chính xác:

> **035b** MIGRATE — *sửa `quality.service.ts` · `partner.service.ts` ·
> `ContractTypeDTO` sang đọc JSONB; nghiệm thu lại `live-023`*

Và `035c:12-13` xác nhận nó đã hoàn thành trước khi `035c` chạy:

```
✅ 035b chạy xong: quality.service · partner.service · DTO đọc JSONB
✅ live-023 toàn đạt sau 035b
```

> **`035b` KHÔNG phải khoảng trống.** Nó là một bước được đánh số trong chuỗi
> migration mà sản phẩm bàn giao là **mã TypeScript**. Đừng tạo tệp `035b*.sql`.

### `039` — 🔵 RESERVED · vừa được phê duyệt

| | |
|---|---|
| Trạng thái | **RESERVED**, chưa tạo |
| Nội dung | Migration **custody** cho `cut_bundles` |
| Thẩm quyền | [ADR-008](adr/ADR-008-bundle-stage-vocabulary.md) — Board duyệt 02/08/2026, Phương án D |
| Lý do chưa tạo | Đã qua ADR; bước kế tiếp theo Playbook XXXIII là **Migration Design Review**, chưa tới bước viết SQL |
| Kế hoạch | [`analysis/031d-implementation-plan.md`](analysis/031d-implementation-plan.md) §3 bước ① |

⚠️ `040` đã chạy **trước** `039`. Điều đó **đúng và không phải lỗi**: `040`
(bất biến I-11) là bản vá bảo mật khẩn, còn `039` sinh ra sau đó từ một quyết
định kiến trúc khác. **Số hiệu migration là thứ tự cấp phát, không phải thứ tự
chạy** — xem §4.

---

## 3. DÃY `031` — MỘT MIGRATION BỊ CHIA THÀNH BẢY

`031` **không tồn tại dưới dạng một tệp**, và đó là hệ quả của một sự cố thật.

| Số | Trạng thái | Nội dung |
|---|---|---|
| `031` *(nguyên khối)* | ⛔ **bỏ** | bản nháp `supabase/drafts/031_assignment_rls.INCOMPLETE.sql` — **đã bị chạy nhầm** trên CSDL thật |
| `031a` | ✅ đã chạy | chặn ghi cho vai ngoài |
| `031b` | ✅ đã chạy | mở quyền đọc theo phạm vi |
| `031c` | ✅ đã chạy | thu hẹp `subcontractors` |
| `031c2` | ✅ đã chạy | vá cầu nối vendor *(sửa lỗi chặn phẳng của `031c`)* |
| `031c3` | ✅ đã chạy | thu hẹp `subcon_orders` — chặn rò rỉ giá |
| `031d` | 🔵 **reserved** | `subcon_issue_logs` · `subcon_receipt_logs` — **chặn bởi G4: hai bảng còn 0 dòng** |
| `031e` · `031f` · `031g` | 🔵 **reserved** | phạm vi chưa chốt |

Bản nháp nguyên khối gỡ `subcon_denied` khỏi `qa_audit_reports` rồi **không
dựng lại đủ** — nguồn gốc trực tiếp của lỗ hổng sửa được kết quả QA, và nó
**tồn tại nhiều ngày mà không ai biết**. Đó là lý do Hiến pháp XI.1 bắt buộc
**mỗi chặng một vòng Regression riêng**.

Chi tiết `031d`: [`analysis/031d-implementation-plan.md`](analysis/031d-implementation-plan.md).

---

## 4. QUY ƯỚC ĐÁNH SỐ

### 4.1 Khuôn tên

```
<3 chữ số><hậu tố?>_<ten_khong_dau>.sql
```

Được canh bởi `tests/architecture/arch.test.mjs` mục ⑦ với biểu thức
`^\d{3}[a-z]?\d?_[a-z0-9_]+\.sql$`. Tệp sai khuôn làm hỏng bộ kiểm kiến trúc.

### 4.2 Hậu tố chữ cái — vì sao tồn tại

Hậu tố dùng khi một migration **đã chạy** cần được bổ sung mà **không được
sửa** *(Playbook XXVIII.4 — migration đã chạy là bất biến)*:

| Nhóm | Ý nghĩa |
|---|---|
| `007b` | refactor nối tiếp `007` |
| `026b` | chốt chặn huỷ lô hàng — đánh số `b` **để không phá dãy 027–032 đã duyệt** |
| `029b` · `029c` | thu hồi quyền xoá cứng · `request_id` giai đoạn 1 |
| `031a`…`031c3` | bảy chặng của `031`; `c2`/`c3` là vá nối tiếp của `031c` |
| `035a` · `035c` | Expand · Contract *(`035b` là mã nguồn — §2)* |
| `036b` | RPC xoá mềm, tách khỏi `036` |
| `038b` · `038c` | siết quyền mặc định · quyền của `supabase_admin` |

### 4.3 ⚠️ Số hiệu là thứ tự CẤP PHÁT, không phải thứ tự CHẠY

Ba trường hợp đã xảy ra, đều **đúng**:

| Trường hợp | Thực tế |
|---|---|
| `040` chạy **trước** `039` | `039` được cấp phát sau, từ ADR-008 |
| `031c3` phải chạy **sau** `040` | ghi tường minh ở đầu `031c3`, có chốt chặn `RAISE EXCEPTION` |
| `034` được cấp trước `035`–`038` nhưng chặn `031` | Hiến pháp B.3 |

> **Không bao giờ suy thứ tự chạy từ số hiệu.** Thứ tự thật nằm ở **khối
> `0. CHẶN TRƯỚC`** đầu mỗi tệp migration — nơi duy nhất nói sự thật, vì nó
> `RAISE EXCEPTION` khi tiền đề chưa có.

---

## 5. BẢNG TỔNG HỢP KHOẢNG TRỐNG

| Số | Từng tồn tại? | Bị xoá? | Phân loại | Chặn bởi |
|---|---|---|---|---|
| `008` | ❌ **không** | — | ⚪ **skipped — không có lý do được ghi** | — *(số chết)* |
| `032` | ❌ **không** | — | 🔵 **reserved · planned** | chuỗi `031` chưa xong |
| `033` | ❌ **không** | — | 🔵 **reserved · planned** | 7 lượt nghiệm thu từng bảng |
| `035b` | ❌ không có `.sql` | — | 🟢 **đã hoàn thành — sản phẩm là mã TypeScript** | — |
| `039` | ❌ **không** | — | 🔵 **reserved** *(ADR-008 duyệt)* | Migration Design Review |
| `031` | ❌ không *(bản nháp ở `drafts/`)* | — | ⛔ **bỏ — chia thành `031a`…`031g`** | — |
| `031d`–`031g` | ❌ **không** | — | 🔵 **reserved · planned** | G4 — bảng còn 0 dòng |

**Không một số hiệu nào bị xoá khỏi kho mã.** Toàn bộ khoảng trống là *chưa
từng tạo*, và mọi khoảng trống trừ `008` đều có lý do được ghi lại.

---

## 6. QUY TẮC CẬP NHẬT

1. Thêm migration mới → thêm dòng vào §5 nếu nó **lấp** một khoảng trống.
2. Đặt chỗ một số hiệu → ghi ngay vào §5 kèm **nguồn thẩm quyền** (ADR hoặc
   quyết định), **trước** khi viết SQL.
3. Số hiệu bị bỏ → ghi `⚪ skipped` kèm lý do. **Khoảng trống không có lý do là
   một khoản nợ tài liệu** — đúng thứ đã buộc phải điều tra để lập tài liệu này.
4. **Không tái sử dụng số hiệu đã bỏ.** Cùng quy ước với ADR *(Điều XXXIII)*.

## 7. THAM CHIẾU

- [`MONICA_CONSTITUTION.md`](MONICA_CONSTITUTION.md) — IV · XI.1 · B.3
- [`ENGINEERING_PLAYBOOK.md`](ENGINEERING_PLAYBOOK.md) — XXVIII *(năm quy tắc vàng)* · XXXIII · XXXIV
- [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md) — sổ nợ kỹ thuật
- [`adr/README.md`](adr/README.md) — mục lục ADR
- [`analysis/031d-implementation-plan.md`](analysis/031d-implementation-plan.md) — chặng kế tiếp
- `tests/architecture/arch.test.mjs` mục ⑦ — kỷ luật đánh số, tự động canh
