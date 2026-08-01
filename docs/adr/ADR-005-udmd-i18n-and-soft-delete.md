# ADR-005 · ĐA NGÔN NGỮ CHO MASTER DATA NGƯỜI DÙNG KHAI · VÀ XOÁ MỀM CHO ĐIỀU KHOẢN THƯƠNG MẠI

| | |
|---|---|
| **Trạng thái** | ⏳ **CHỜ PHÊ DUYỆT** — chưa viết một dòng SQL nào |
| **Migration dự kiến** | `035_udmd_i18n.sql` · `036_act_soft_delete.sql` |
| **Giải quyết** | Hiến pháp Mục B.1 (vi phạm Điều IX) · Mục B.2 (vi phạm Điều VIII) |
| **Liên quan** | [ADR-002](ADR-002-assignment-domain.md) · [ADR-003](ADR-003-request-id.md) · Hiến pháp Điều IV · VIII · IX · XI |

---

## 1. Context

Hiến pháp vFinal ban hành **sau** khi Phase 029 commit. Rà soát mã đang chạy
phát hiện hai vi phạm, ghi ở Mục B của Hiến pháp.

### 1.1 — Điều IX · text đa ngôn ngữ trong Database

**Đo được:**

| Bảng | Cột | Dòng thật | Ghi chú |
|---|---|---|---|
| `defect_catalog` (023) | `name_vi` · `name_en` | **20** | **đủ cả hai ngôn ngữ, không dòng nào trống** |
| `contract_types` (029) | `name_vi` · `name_en` | **0** | nghiệp vụ chưa khai |

**Mã nguồn đang đọc hai cột đó:**

```
app/(dashboard)/md/po/[poId]/_services/quality.service.ts
    'aql_status, capa_note, created_at, defect_catalog(name_vi)'   ← nhúng PostgREST
    defectLabel: cat?.name_vi ?? r.defect_type ?? '—'
app/(dashboard)/md/assignments/_services/partner.service.ts
    .select('code, name_vi, name_en')
lib/mos/contracts/assignment.contract.ts
    ContractTypeDTO { nameVi, nameEn }
```

⚠️ `quality.service.ts` thuộc **Trung tâm Chất lượng — phân hệ ĐÃ NGHIỆM THU và
đang chạy thật**, có bài kiểm sống `live-023`. Đổi cột là làm gãy nó.

### 1.2 — Vì sao Điều IX không áp thẳng được

Điều IX viết cho **System Enum**: `status = 'APPROVED'` là hằng số của hệ thống,
lập trình viên biết trước toàn bộ tập giá trị, nên frontend dịch được trong
`lib/dictionaries/md.ts`.

`defect_catalog` và `contract_types` khác về bản chất: **nghiệp vụ tự khai qua
giao diện**. Ngày mai người vận hành thêm một mã lỗi mới, **frontend không thể
dịch một thứ chưa tồn tại lúc build**.

Đây là **User-Defined Master Data (UDMD)** — hạng dữ liệu thứ ba, không phải
System Enum, cũng không phải chứng từ.

### 1.3 — Điều VIII · ngõ cụt xoá

```
assignment_commercial_terms   không có deleted_at / deleted_by
029b                          đã THU HỒI quyền DELETE khỏi mọi vai trò
```

Cộng lại: một dòng điều khoản thương mại **ghi sai đơn giá** không có đường nào
để gỡ — không xoá cứng được, cũng không xoá mềm được. Bảng hiện **0 dòng** nên
chưa ai vấp; sau Assignment thật đầu tiên thì đó là bế tắc vận hành.

⚠️ **Còn một cái bẫy thứ hai chưa ai nêu.** Chỉ mục hiện tại:

```sql
CREATE UNIQUE INDEX uq_act_assignment
  ON assignment_commercial_terms (assignment_id);      -- ⚠️ TOÀN PHẦN
```

Thêm `deleted_at` mà **không sửa chỉ mục này** thì ngõ cụt chỉ đổi chỗ: xoá mềm
điều khoản sai xong **vẫn không lập được điều khoản mới**, vì dòng đã xoá vẫn
chiếm chỗ trong chỉ mục duy nhất. Đúng bài học `uq_shipment_carton_active` của
migration 024.

## 2. Decision

### 2.1 — UDMD dùng `JSONB`, một cột duy nhất

```sql
name_translations JSONB NOT NULL
-- {"vi": "Lỗi rách vải", "en": "Torn fabric", "cn": "布料破损"}
```

Áp dụng cho `defect_catalog` và `contract_types`, và cho **mọi UDMD về sau**.

### 2.2 — Khoá ngôn ngữ: chữ thường, khớp `Language` của ứng dụng

```
vi · en · cn
```

⚠️ **Một điểm không thuần khiết, ghi để quyết chứ không giấu:** `cn` là **mã
quốc gia**, ngôn ngữ đúng phải là `zh` (BCP-47). Nhưng `lib/i18n.tsx` đã dùng
`Language = 'VN' | 'EN' | 'CN'` trên toàn hệ thống.

Chọn `cn` để **không sinh ra một bảng ánh xạ thứ hai** giữa mã ngôn ngữ của giao
diện và mã trong CSDL — một bảng ánh xạ như thế là chỗ chắc chắn sẽ lệch (Điều
XXIX của Playbook). Đổi sang `zh` cho chuẩn là một quyết định riêng, đụng cả
`i18n.tsx`, ba khối từ điển và mọi nơi đọc `Language`.

**Chữ thường** vì JSON key phân biệt hoa thường, và `'VN'` viết hoa trong CSDL
sẽ mời gọi lỗi `translations['vn']` trả `undefined` mà không báo gì.

### 2.3 — Chuỗi dự phòng: KHÔNG BAO GIỜ hiện ô trống

```
ngôn ngữ phiên  →  vi  →  en  →  khoá đầu tiên có giá trị  →  chính `code`
```

⚠️ Chỉ *"fallback về en"* là **chưa đủ**, và đây là ca hỏng thật: người vận hành
khai một loại hợp đồng **chỉ bằng tiếng Việt**; một phiên `EN` tra `en` không
thấy → hiện **ô trống**. Người dùng kết luận danh mục hỏng.

Playbook Điều XX đã có luật cho đúng ca này: *"Tra nhãn không thấy thì **hiện mã
gốc**, không để trống — người vận hành còn biết mà báo lại."* Chuỗi trên kết
thúc ở `code` chính vì thế.

Đặt trong **một hàm thuần duy nhất** — `lib/mos/value-objects/translated-text.ts`
— để không có bản cài đặt thứ hai:

```ts
pickTranslation(t: TranslatedText, lang: Language, fallbackCode: string): string
```

### 2.4 — Ràng buộc: `{}` phải bị từ chối

```sql
name_translations JSONB NOT NULL
CONSTRAINT <bảng>_translations_shape CHECK (
  jsonb_typeof(name_translations) = 'object'
  AND EXISTS (
    SELECT 1 FROM jsonb_each_text(name_translations) AS e(k, v)
    WHERE LENGTH(TRIM(e.v)) > 0
  )
)
```

`NOT NULL` **một mình là không đủ**: `'{}'::jsonb` đi qua được `NOT NULL`, và
lúc đó chuỗi dự phòng rơi thẳng xuống `code` cho **mọi** ngôn ngữ. Ràng buộc đòi
**ít nhất một bản dịch không rỗng**.

### 2.5 — Xoá mềm cho `assignment_commercial_terms`

```sql
ALTER TABLE assignment_commercial_terms
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

DROP INDEX uq_act_assignment;
CREATE UNIQUE INDEX uq_act_assignment_active
  ON assignment_commercial_terms (assignment_id) WHERE deleted_at IS NULL;
```

⚠️ **Hai câu lệnh này KHÔNG được tách rời.** Thêm cột mà giữ chỉ mục toàn phần
là dời ngõ cụt chứ không mở nó.

### 2.6 — Lọc dòng đã xoá ở SERVICE, không ở RLS

Kiến trúc sư chỉ thị *"cập nhật RLS để ẩn các dòng có `deleted_at IS NOT NULL`"*.
Tôi **đề nghị làm khác**, và nêu lý do để Kiến trúc sư quyết:

Policy hiện tại là `FOR ALL ... USING (NOT mos_is_external())`. Thêm
`AND deleted_at IS NULL` vào `USING` của một policy `FOR ALL` sẽ chặn luôn
`UPDATE` trên dòng đã xoá — tức là **khôi phục một dòng xoá nhầm trở thành bất
khả thi**. Đó là ngõ cụt thứ ba, cùng họ với hai cái vừa mở.

Ba lý do nữa:

- **Nhất quán với `assignments`.** Bảng đó cũng xoá mềm, và RLS của nó **không**
  lọc `deleted_at`; service lọc bằng `.is('deleted_at', null)`. Hai bảng cùng
  họ mà hai cơ chế khác nhau là chỗ người sau đọc sai.
- **RLS trả lời "AI được thấy", không trả lời "CÁI GÌ còn hiệu lực".** Trộn hai
  câu hỏi vào một biểu thức làm cả hai khó đọc.
- Muốn ẩn ở tầng CSDL thì **view có `security_invoker`** là công cụ đúng, không
  phải policy.

Nếu Kiến trúc sư vẫn muốn ở RLS, cách an toàn là **tách policy**: `FOR SELECT`
có `deleted_at IS NULL`, `FOR UPDATE` thì không — giữ được đường khôi phục.

### 2.7 — Triển khai theo Expand → Migrate → Contract

⚠️ **KHÔNG đổi cột trong một migration.** `quality.service.ts` đang nhúng
`defect_catalog(name_vi)` và nó thuộc phân hệ đang chạy thật.

| Bước | Việc | Hệ thống ở trạng thái nào |
|---|---|---|
| **035a** EXPAND | thêm `name_translations`, **giữ nguyên** `name_vi`/`name_en`; backfill 20 dòng; CHECK; trigger giữ hai bên đồng bộ khi ghi | cả mã cũ và mã mới đều chạy |
| **035b** MIGRATE | sửa `quality.service.ts` · `partner.service.ts` · `ContractTypeDTO` sang đọc JSONB; nghiệm thu lại `live-023` | mã mới chạy, cột cũ còn đó làm lưới an toàn |
| **035c** CONTRACT | `DROP COLUMN name_vi, name_en`; gỡ trigger đồng bộ | hoàn tất |
| **036** | xoá mềm + chỉ mục một phần cho `assignment_commercial_terms` | độc lập, chạy lúc nào cũng được |

Backfill phải **đối chiếu số dòng trước và sau**: 20 vào, 20 ra, và mọi
`name_vi` cũ phải bằng `name_translations->>'vi'`. Không đối chiếu thì mất một
dòng cũng không ai biết.

## 3. Alternatives Considered

**① Bảng `<catalog>_i18n` rời** — **Bác** *(Kiến trúc sư đã bác, và tôi đồng ý)*.
Mỗi lần đọc danh mục là một `JOIN`; đọc danh mục lồng trong danh sách phiếu kiểm
là đường thẳng tới **N+1** — thứ Hiến pháp Điều X cấm. Với 20 dòng, một `JOIN`
là cái giá vô nghĩa.

**② Giữ `name_vi` · `name_en` cứng** — **Bác**. Thêm ngôn ngữ thứ tư là thêm cột
+ migration + sửa mọi `SELECT`. Vi phạm Điều XI (*Forward Compatible*). JSONB
thêm ngôn ngữ mà **không đụng lược đồ**.

**③ Một cột `name TEXT` + dịch ở frontend** — **Bác**. Đúng chữ Điều IX nhưng
sai bản chất: frontend không thể dịch thứ người dùng nhập ngày mai. Đây chính là
lý do UDMD phải là hạng dữ liệu riêng.

**④ `hstore`** — **Bác**. Chỉ nhận chuỗi phẳng, không lồng được, và Supabase/
PostgREST hỗ trợ `JSONB` tốt hơn hẳn. Không mua được gì so với `JSONB`.

**⑤ Đổi cả 3 bảng cùng một migration** — **Bác**. Xem 2.7: `quality.service.ts`
đang chạy thật. Bài học 029c — cột và mã đọc cột phải đi cùng nhau, từng bước một.

## 4. Consequences

### Lợi ích

- Thêm ngôn ngữ thứ tư **không cần migration**.
- UDMD trở thành một hạng dữ liệu **có tên gọi và có luật**, thay vì một ngoại lệ
  không ai giải thích được.
- `assignment_commercial_terms` thoát ngõ cụt — sửa được đơn giá ghi sai.
- Chuỗi dự phòng kết thúc ở `code` ⇒ **không màn hình nào hiện ô trống**.

### Đánh đổi

- `JSONB` **không có ràng buộc kiểu cho từng khoá**: gõ nhầm `"vn"` thay vì
  `"vi"` thì CSDL nhận, và nhãn im lặng rơi xuống dự phòng. Giảm thiểu: hằng số
  `SUPPORTED_LANGS` phía TypeScript + phép kiểm hợp đồng, **không** phải CHECK
  cứng danh sách khoá — CHECK cứng sẽ chặn việc thêm ngôn ngữ, đúng thứ thiết kế
  này sinh ra để tránh.
- Sắp xếp theo tên cần `ORDER BY name_translations->>'vi'`. Với 20 dòng không
  cần chỉ mục; **đo lại khi danh mục vượt vài trăm dòng**.
- Ba bước 035a/b/c thay vì một — chậm hơn, nhưng không có bước nào làm gãy phân
  hệ đang chạy.

### Nợ ghi nhận

| Nợ | Ghi chú |
|---|---|
| `cn` thay vì `zh` | không thuần BCP-47; đổi thì đụng `i18n.tsx` + 3 khối từ điển — quyết riêng |
| Danh mục khác chưa rà | chỉ mới rà `defect_catalog` và `contract_types`; các bảng danh mục khác cần rà trước khi tuyên bố tuân thủ Điều IX toàn phần |
| ADR-004 | vẫn chờ duyệt, vẫn chặn Portal đối tác ghi |

## 5. Rollback Impact

**035a** (EXPAND) — hoàn tác **sạch**: cột cũ còn nguyên và vẫn được trigger giữ
đồng bộ, nên gỡ `name_translations` không mất dữ liệu nào.

```sql
DROP TRIGGER <bảng>_sync_translations_trg ON <bảng>;
ALTER TABLE <bảng> DROP COLUMN name_translations;
```

**035b** (MIGRATE) — hoàn tác bằng cách trả mã về đọc `name_vi`. Không đụng dữ liệu.

**035c** (CONTRACT) — ⚠️ **KHÔNG hoàn tác được bằng một lệnh.** `name_vi` và
`name_en` đã biến mất; muốn quay lại phải dựng cột và backfill ngược từ
`name_translations`. Vẫn làm được vì dữ liệu còn đủ trong JSONB, nhưng là một
migration bù có chủ ý, không phải một dòng `ALTER`.

**036** — hoàn tác sạch:

```sql
DROP INDEX uq_act_assignment_active;
CREATE UNIQUE INDEX uq_act_assignment ON assignment_commercial_terms (assignment_id);
ALTER TABLE assignment_commercial_terms DROP COLUMN deleted_at, DROP COLUMN deleted_by;
```

⚠️ Chỉ hoàn tác được khi **chưa có dòng nào bị xoá mềm**. Đã có rồi thì khôi phục
chỉ mục toàn phần sẽ ném `23505` — phải xoá cứng những dòng đó trước, và đó là
một quyết định nghiệp vụ chứ không phải thao tác kỹ thuật.

## 6. References

**Hiến pháp:** Điều IV (ADR trước SQL) · **VIII** (xoá mềm · chứng từ điều
chỉnh) · **IX** (globalization) · X (chống N+1) · **XI** (forward compatible) ·
Mục B.1 · B.2 (nợ tuân thủ).

**Playbook:** Điều XX (*không tra được nhãn thì hiện mã gốc*) · XXI (i18n) ·
XXIX (chống phức tạp hoá).

**Migration:** [023](../../supabase/migrations/023_quality_center.sql)
(`defect_catalog`, 20 dòng) · [024](../../supabase/migrations/024_shipment_center.sql)
(bài học chỉ mục duy nhất **một phần**) ·
[029](../../supabase/migrations/029_assignment_domain.sql) (`contract_types`,
`uq_act_assignment`) · [029b](../../supabase/migrations/029b_revoke_hard_delete.sql)
(thu hồi DELETE — nửa còn lại của ngõ cụt) ·
[029c](../../supabase/migrations/029c_request_id.sql) (khuôn triển khai theo giai đoạn).

**Mã nguồn:** `quality.service.ts` (nhúng `defect_catalog(name_vi)` — điểm gãy
chính) · `partner.service.ts` · `assignment.contract.ts` · `lib/i18n.tsx`.

**ADR:** [ADR-002](ADR-002-assignment-domain.md) ·
[ADR-003](ADR-003-request-id.md) ·
[ADR-004](ADR-004-concurrency-control.md) *(chờ duyệt)*.
