# ADR-004 · CONCURRENCY CONTROL

| | |
|---|---|
| **Trạng thái** | ⏳ **CHỜ PHÊ DUYỆT** — chưa viết SQL |
| **Migration dự kiến** | `034_optimistic_concurrency.sql` — **trước** khi Portal đối tác được phép GHI |
| **Chặn cái gì** | Buyer Portal và Subcon Portal **không được mở quyền ghi** cho tới khi ADR này triển khai xong |
| **Liên quan** | [ADR-002](ADR-002-assignment-domain.md) · [ADR-003](ADR-003-request-id.md) · [Mutation Policy](../MUTATION_POLICY.md) · Điều XXX |

---

## 1. Context

**Đo được — hệ thống hiện là Last-Write-Wins, không có ngoại lệ nào:**

| Đo | Kết quả |
|---|---|
| Cột `version` / `row_version` / `etag` trong toàn bộ lược đồ | **không có bảng nào** |
| Hình dạng mọi lệnh sửa | `UPDATE ... SET ... WHERE id = ?` |
| Cơ chế phát hiện ghi đè | **không có** |
| Bảng ghi từ nhiều phía hôm nay | **chưa có** — mọi lệnh ghi đều từ người nội bộ |

Hôm nay điều đó **chấp nhận được**, và lý do rất cụ thể: mỗi Assignment có đúng
một `owner_user_id` chịu trách nhiệm, và toàn bộ người ghi đều ngồi trong Monica.
Hai người sửa cùng một dòng cùng lúc là chuyện hiếm, và khi xảy ra thì hai người
đó ngồi cách nhau vài mét.

**Sau migration 031 thì không còn đúng nữa.** Đó là điểm mà `assignments` chuyển
từ *"một bên ghi"* sang *"hai bên ghi"*:

```
MONICA                          ĐỐI TÁC (cổng riêng)
──────                          ────────────────────
đổi planned_finish              → ACCEPTED
đổi assigned_qty                → REJECTED  (kèm lý do)
→ SUSPENDED                     → COMPLETED
→ CANCELLED
```

**Ba kịch bản mất dữ liệu, cả ba đều im lặng:**

**① Ghi đè trường.** Merchandiser mở phần việc lúc 9:00 và sửa `planned_finish`.
Đối tác mở lúc 9:01, bấm *Nhận việc*. Nếu lệnh của đối tác gửi cả bản ghi thì
`planned_finish` quay về giá trị 9:00 — Merchandiser tưởng đã gia hạn, đối tác
tưởng hạn cũ, và **không ai nhận được cảnh báo nào**.

**② Chuyển trạng thái trên dữ liệu cũ.** Monica huỷ phần việc lúc 9:00. Đối tác
đang mở màn hình từ 8:55, thấy `ISSUED`, bấm *Nhận việc*. `canTransition` chạy
trên bản ghi máy chủ đọc lại nên vẫn chặn được — **nhưng chỉ vì service đọc lại
trước khi ghi**. Bất kỳ đường ghi nào không đọc lại đều thủng.

**③ Mất lý do.** Hai người cùng bấm `→ SUSPENDED` với hai lý do khác nhau. Chỉ
một lý do sống sót, và không có gì ghi lại rằng đã từng có lý do thứ hai.

⚠️ **Điều XXX làm kịch bản ① nặng hơn hẳn.** `planned_start`/`planned_finish` là
**cửa sổ quyền ghi** của đối tác (`canWriteOperational`). Một lần ghi đè vô ý
vào hai cột đó **thay đổi quyền của một bên bên ngoài** — im lặng, không audit
nào phân biệt được với một lần gia hạn có chủ ý.

### Vì sao sổ cái KHÔNG nằm trong phạm vi này

`assignment_daily_reports` là **append-only**: trigger từ chối mọi `UPDATE` và
`DELETE` với mọi vai trò. Hai người cùng ghi thì thành hai dòng, và
`uq_adr_original_per_day` chặn hai bản gốc cùng ngày.

> **Bảng chỉ-ghi-thêm miễn nhiễm với xung đột ghi đè.**

Đó không phải tình cờ mà là một lý lẽ nữa ủng hộ thiết kế sổ cái của ADR-002 —
và cũng là gợi ý cho những bảng chứng từ tương lai.

## 2. Decision

**Optimistic Concurrency Control trở thành BẮT BUỘC trước khi bất kỳ Portal đối
tác nào được mở quyền ghi.**

Last-Write-Wins được **chấp nhận như nợ kỹ thuật tạm thời**, có hạn chót rõ ràng:
nó chấm dứt tại migration `034`, và `034` phải chạy **trước** khi mở ghi cho
Buyer Portal hoặc Subcon Portal.

### 2.1 Hai lớp, làm theo thứ tự

**Lớp 1 — So-sánh-rồi-đổi trên `status`** *(rẻ, làm được ngay)*

```sql
UPDATE assignments
   SET status = 'ACCEPTED', accepted_at = NOW(), accepted_by = ?
 WHERE id = ? AND status = 'ISSUED';     -- ⭐ trạng thái NGUỒN nằm trong WHERE
-- 0 dòng bị ảnh hưởng ⇒ ai đó đã đổi trạng thái trước ⇒ báo xung đột
```

Không cần cột mới, không cần migration. Nó biến máy trạng thái thành một phép
**compare-and-swap nguyên tử**, và giải trọn vẹn kịch bản ②.

⚠️ Nhưng nó **KHÔNG** giải kịch bản ① và ③: hai lệnh cùng đổi `planned_finish`
mà không đổi `status` vẫn ghi đè nhau như cũ.

**Lớp 2 — Cột `version`** *(mới là giải pháp thật)*

```sql
ALTER TABLE assignments ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
-- trigger BEFORE UPDATE:  NEW.version := OLD.version + 1

UPDATE assignments SET ... , version = version + 1
 WHERE id = ? AND version = ?;           -- phiên bản máy khách đã đọc
-- 0 dòng ⇒ 409 "bản ghi đã được người khác sửa, hãy tải lại"
```

`version` đi ra ngoài qua DTO, quay về qua mọi lệnh sửa. Máy khách không diễn
giải nó — chỉ mang đi rồi mang về.

### 2.2 Vì sao `version INTEGER` chứ không phải `updated_at`

`updated_at` đã có sẵn và trông như dùng được. Nhưng:

- **hai lệnh trong cùng một micro-giây** cho cùng một mốc thời gian — hiếm,
  nhưng import hàng loạt và tác nhân tự động thì không hiếm;
- `TIMESTAMPTZ` đi qua JSON rồi quay về **có thể mất độ chính xác**, và một
  chênh lệch một micro-giây biến thành xung đột giả;
- đồng hồ có thể lùi. Số nguyên đơn điệu thì không.

Một `INTEGER` do trigger tăng là thứ **không thể mơ hồ**.

### 2.3 Phạm vi

| Bảng | Cần OCC | Vì sao |
|---|---|---|
| `assignments` | ✅ **bắt buộc** | hai phía cùng ghi sau 031; chứa cửa sổ quyền |
| `assignment_commercial_terms` | ✅ | đơn giá — ghi đè im lặng là sai tiền |
| `orders` · `shipments` | ✅ *(rà sau)* | nhiều vai trò nội bộ cùng sửa |
| `assignment_daily_reports` | ❌ | append-only, miễn nhiễm |
| `assignment_bundles` | ❌ | chỉ Monica ghi, và thao tác là thêm/gỡ chứ không sửa |
| danh mục nền | ❌ | một steward, xung đột gần như không xảy ra |

## 3. Alternatives Considered

**① Giữ Last-Write-Wins vĩnh viễn** — **Bác.** Chấp nhận được khi một bên ghi;
sau 031 nó nghĩa là **đối tác bên ngoài có thể ghi đè quyết định của Monica mà
không ai biết**, kể cả cửa sổ quyền của chính họ. Đó là lỗ hổng phân quyền được
nguỵ trang thành lỗi dữ liệu.

**② Khoá bi quan** *(`SELECT ... FOR UPDATE`, hoặc khoá bản ghi khi mở màn hình)*
— **Bác.** Người dùng mở một phần việc rồi đi ăn trưa; bản ghi khoá suốt hai
tiếng. Trên Portal đối tác còn tệ hơn — một đối tác giữ khoá thì Monica không
thao tác được. Khoá bi quan chỉ hợp khi tranh chấp **cao và ngắn**; ở đây nó
thấp và dài, đúng ca mà lạc quan thắng.

**③ Gộp theo từng trường** *(chỉ ghi đè trường thực sự thay đổi)* — **Bác.** Nó
làm cho hai lệnh ghi *"thành công"* nhưng để lại một bản ghi mà **không bên nào
định tạo ra**: hạn của Monica cộng với trạng thái của đối tác. Trong nghiệp vụ
có chứng từ, một bản ghi lai không ai chịu trách nhiệm còn tệ hơn một lỗi xung
đột thẳng thắn.

**④ Event sourcing cho aggregate Assignment** — **Bác.** Giải đúng bài toán,
nhưng viết lại toàn bộ tầng ghi để tránh một lớp xung đột mà **một cột số nguyên
xử lý xong**. Điều XXIX. Sổ cái báo cáo ngày đã áp dụng nguyên lý append-only ở
đúng chỗ nó đáng giá.

**⑤ Chỉ làm Lớp 1 (CAS trên `status`)** — **Bác làm giải pháp cuối**, nhưng
**nhận làm bước đầu**. Nó giải kịch bản ② với chi phí gần bằng không, và có thể
làm ngay trong service hiện tại. Nó **không** giải ① và ③, nên không đủ để mở
quyền ghi cho Portal.

## 4. Consequences

### Lợi ích

- Ghi đè im lặng trở thành **lỗi nhìn thấy được**, thay vì mất dữ liệu.
- Cửa sổ quyền của đối tác không thể bị đổi ngoài ý muốn — hệ quả bảo mật trực
  tiếp của Điều XXX.
- `version` cho giao diện một cơ sở thật để nói *"bản ghi đã đổi, hãy tải lại"*.

### Đánh đổi

- Mọi lệnh sửa phải mang `version` theo. Quên là **mất bảo vệ trong im lặng** —
  cần phép kiểm hợp đồng canh: mọi `Update*DTO` phải có `version`.
- Người dùng sẽ gặp lỗi xung đột thật. Giao diện phải xử lý **tử tế**: nói rõ ai
  đã sửa, sửa gì, và cho tải lại bằng một cú bấm — không chỉ ném một câu lỗi.
- Thêm một trigger trên mỗi bảng có OCC.

### Nợ trong lúc chờ

⚠️ Cho tới khi `034` chạy, **Last-Write-Wins vẫn đang hiệu lực**. Điều đó chấp
nhận được **chỉ vì** không có đường ghi nào từ bên ngoài: 029 Mục 11 chặn sạch
người ngoài, và 031 là chỗ mở. Hai việc đó **không được đảo thứ tự**.

## 5. Rollback Impact

**Lớp 1** — chỉ là một mệnh đề `WHERE`; hoàn tác bằng cách bỏ nó đi. Không có
thay đổi lược đồ, không có dữ liệu nào bị ảnh hưởng.

**Lớp 2** —

```sql
DROP TRIGGER IF EXISTS assignments_version_trg ON public.assignments;
ALTER TABLE public.assignments DROP COLUMN IF EXISTS version;
```

Cột chỉ thêm vào; gỡ ra là quay lại Last-Write-Wins. **Không cần migration bù.**

⚠️ Nhưng nếu gỡ **sau khi** Portal đối tác đã mở ghi thì đó không phải thao tác
kỹ thuật mà là **hạ cấp bảo mật**: hai bên lại ghi đè nhau, và cửa sổ quyền lại
đổi được trong im lặng. Hoàn tác Lớp 2 chỉ hợp lệ khi Portal còn đóng.

## 6. References

**Hiến pháp:** Điều XXVII · XXIX · XXX (mục 4 — quyền theo trạng thái và cửa sổ
thời gian) · XXXII · XXXIII.

**Migration:** [029](../../supabase/migrations/029_assignment_domain.sql) Mục 11
(chặn sạch người ngoài — thứ đang giữ cho nợ này an toàn) · **031** (RLS — điểm
mở quyền ghi, và là hạn chót) · **034** ← ADR này.

**Tài liệu:** [Mutation Policy](../MUTATION_POLICY.md) Mục 4 — nơi ghi nhận nợ
này lần đầu.

**ADR:** [ADR-002](ADR-002-assignment-domain.md) (sổ cái append-only — vì sao nó
miễn nhiễm) · [ADR-003](ADR-003-request-id.md) (`request_id` chống **lập hai
lần**; ADR này chống **ghi đè**, hai bài toán khác nhau).
