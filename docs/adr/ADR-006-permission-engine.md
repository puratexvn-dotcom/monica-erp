# ADR-006 · PERMISSION ENGINE — PHÂN QUYỀN THEO ASSIGNMENT

| | |
|---|---|
| **Trạng thái** | ⏳ **CHỜ PHÊ DUYỆT** — chưa viết một dòng SQL nào |
| **Migration** | `030_permission_engine.sql` (định nghĩa) → `031_assignment_rls.sql` (thực thi) |
| **Thực thi** | Hiến pháp Điều II · **Playbook Điều XXX** (Đối tác Vận hành Bên ngoài) |
| **Liên quan** | [ADR-002](ADR-002-assignment-domain.md) · [ADR-004](ADR-004-concurrency-control.md) · [Glossary](../DOMAIN_GLOSSARY.md) |

---

## 1. Context

### 1.1 — Đo được: hôm nay có HAI vấn đề NGƯỢC CHIỀU nhau

Một phiên `subcon` **thật** (tài khoản tạm, đăng nhập thật) nhìn thấy:

| Bảng | Tổng | Subcon thấy | |
|---|---:|---:|---|
| `orders` | 3 | **3** | ⚠️ **thấy CẢ đơn hàng họ không có việc** |
| `cut_bundles` | 2 | **2** | ⚠️ thấy cả bó không thuộc họ |
| `cut_tickets` | 1 | **1** | ⚠️ |
| `subcontractors` | 2 | **2** | ⚠️ **THẤY NHÀ THẦU KHÁC** |
| `hourly_production_logs` | 1 | 0 | ⚠️ **không ghi được sản lượng của chính mình** |
| `qa_audit_reports` | 2 | 0 | ⚠️ |
| `financial_records` · `profiles` · `partners` | 2 · 14 · 5 | 0 | ✅ đã chặn ở 025 |

**Vấn đề ① — LỘ QUÁ NHIỀU.** Playbook Điều XXX cấm subcon thấy *"Other Subcon"*.
`subcontractors` có 2 dòng và subcon thấy **cả hai** — đây là **vi phạm đang
sống**, không phải rủi ro lý thuyết. Tương tự, họ thấy cả 3 đơn hàng dù chỉ làm
một phần của một đơn.

Gốc rễ: 025 mở theo **danh sách bảng cho phép**, tức phân quyền theo **VAI TRÒ**.
Đã là `subcon` thì thấy mọi thứ mà `subcon` được thấy.

**Vấn đề ② — CHẶN QUÁ NHIỀU.** Subcon **không ghi được sản lượng của chính họ**.
Playbook Điều XXX mục 6 nói rõ đối tác **bắt buộc phải GHI**: một cổng chỉ-đọc
nghĩa là ai đó bên Monica gõ hộ, và lúc đó con số không còn là lời khai của
người làm mà là lời kể lại của người thứ ba — **truy trách nhiệm sụp đổ ngay tại
đó**.

> Hai vấn đề ngược chiều, **một gốc rễ**: quyền gắn với NGƯỜI, không gắn với VIỆC.

### 1.2 — ⚠️ Một cái bẫy có thể làm 031 thành VÔ HIỆU

Migration 025 tạo policy `subcon_denied` **`AS RESTRICTIVE FOR ALL`** trên mọi
bảng ngoài danh sách cho phép.

**Policy RESTRICTIVE được `AND` với mọi policy permissive.** Nghĩa là:

```
031 thêm policy permissive "đối tác thấy việc của mình"
  AND  subcon_denied  (RESTRICTIVE, luôn FALSE với subcon)
  ────────────────────────────────────────────────────────
  = FALSE           ⇒ 031 KHÔNG MỞ ĐƯỢC GÌ CẢ
```

Đây là kiểu hỏng **im lặng nhất có thể**: migration chạy xanh, mọi ràng buộc đều
đúng, và cổng đối tác vẫn trắng trơn. Không lỗi nào nổ ra.

`hourly_production_logs` và `qa_audit_reports` **đang bị chặn bởi chính policy
này** — bằng chứng ở bảng đo trên: 1 và 2 dòng thật, subcon thấy 0.

### 1.3 — Đo được về hạ tầng

| Đo | Kết quả |
|---|---|
| `partner_accounts` | **0 dòng** · có `user_id` · `partner_id` · `is_active` |
| `assignment_id` trên bảng vận hành | ✅ có ở `hourly_production_logs` · `qa_audit_reports` · `subcon_receipt_logs` · `subcon_issue_logs` |
| `cut_bundles.assignment_id` | ❌ **không có** — nối qua bảng `assignment_bundles` |
| `material_consumption` | ❌ **BẢNG KHÔNG TỒN TẠI** — tài liệu 06 có nhắc, nhưng chưa ai dựng |
| Dòng cũ | `assignment_id = NULL` (có trước 029) |

⚠️ Dòng cuối quan trọng: dữ liệu lịch sử **không thuộc Assignment nào và sẽ mãi
mãi không thuộc**. Policy phải để người nội bộ vẫn thấy chúng, còn đối tác thì
không — chứ không phải "ẩn với tất cả".

## 2. Decision

### 2.1 — Hai chiều phân quyền TRỰC GIAO

Đây là ý tưởng trung tâm của cả thiết kế:

```
partner_permissions  →  ĐỘNG VÀO BẢNG NÀO       (thô, theo LOẠI đối tác)
Assignment           →  ĐỘNG VÀO DÒNG NÀO       (tinh, theo phạm vi + cửa sổ)
```

| | `partner_permissions` | Assignment |
|---|---|---|
| Trả lời | *"Forwarder có ghi sản lượng không?"* | *"Nhà thầu A thấy dòng nào?"* |
| Mức | bảng / hành động | từng dòng |
| Đổi khi | thêm loại đối tác mới | mỗi lần giao việc |
| Là | **master data** | **dữ liệu vận hành** |

⚠️ **`partner_permissions` KHÔNG phải cổng chính.** Cổng chính là Assignment.
Bảng này chỉ trả lời câu hỏi thô *"loại đối tác này về nguyên tắc chạm vào những
bảng nào"* — Forwarder ghi mốc vận chuyển chứ không ghi sản lượng may; Auditor
ghi kết quả giám định chứ không ghi tiêu hao vật tư.

Nhầm hai chiều này là quay lại **phân quyền theo vai trò** — đúng thứ Điều XXX
sinh ra để bỏ.

### 2.2 — Năm hàm phân giải

Tất cả đều **`STABLE`** và **`SECURITY DEFINER`**, và cả hai từ khoá đó đều bắt
buộc chứ không phải tuỳ chọn:

- **`SECURITY DEFINER`** — đối tác **không** được `SELECT` bảng
  `partner_accounts`. Không có nó thì hàm phân giải không đọc nổi thứ nó cần, và
  nếu `partner_accounts` cũng bật RLS thì thành **đệ quy vô hạn**.
- **`STABLE`** — RLS chạy policy **cho từng dòng**. Hàm `VOLATILE` sẽ tra bảng
  `partner_accounts` **một lần cho mỗi dòng**. `STABLE` cho phép PostgreSQL tính
  một lần cho cả câu lệnh.

| Hàm | Trả về | Việc |
|---|---|---|
| `mos_partner_id()` | `UUID` \| `NULL` | người gọi thuộc đối tác nào |
| `mos_is_partner()` | `BOOLEAN` | có phải đối tác ngoài đang hoạt động |
| `mos_can_read_assignment(uuid)` | `BOOLEAN` | thấy phần việc này không |
| `mos_can_write_assignment(uuid)` | `BOOLEAN` | ghi dữ liệu vận hành được không |
| `mos_partner_can(resource, action)` | `BOOLEAN` | tra `partner_permissions` |

**`mos_partner_id()` — ba điều kiện, thiếu một là `NULL`:**

```
partner_accounts.user_id = auth.uid()
  AND partner_accounts.is_active
  AND partners.is_active AND partners.deleted_at IS NULL
```

⚠️ **Phải kiểm CẢ BA.** Ngừng hợp tác với một nhà thầu thường được làm bằng cách
tắt `partners.is_active` — nếu hàm chỉ nhìn `partner_accounts` thì tài khoản của
họ **vẫn vào được**, và không ai phát hiện cho tới khi có sự cố.

⚠️ **`mos_partner_id()` đọc `partner_accounts`, TUYỆT ĐỐI KHÔNG đọc JWT.**
*"JWT không mang quyền. JWT chỉ mang Identity."* Claim trong token được ghi lúc
cấp tài khoản và **không đổi** khi quan hệ đối tác thay đổi — một đối tác đã
ngừng hợp tác vẫn cầm token cũ với claim cũ.

**`mos_can_write_assignment()` — ba điều kiện, y hệt bản TypeScript:**

```
status ∈ {ACCEPTED, IN_PROGRESS}
  ∧ hôm nay (giờ VN) ∈ [planned_start, planned_finish]
  ∧ deleted_at IS NULL
```

⚠️ Cửa sổ dùng **KẾ HOẠCH**, không dùng **THỰC TẾ**. Lấy `actual_finish` làm mốc
tắt quyền nghĩa là **đối tác tự quyết khi nào quyền của mình hết** — chỉ cần
chưa điền ngày hoàn thành thì quyền còn mãi.

### 2.3 — Nối dòng vào Assignment

| Bảng | Đường nối |
|---|---|
| `hourly_production_logs` · `qa_audit_reports` · `subcon_receipt_logs` · `subcon_issue_logs` · `assignment_daily_reports` | `assignment_id` trực tiếp |
| `cut_bundles` | qua `assignment_bundles` (bảng quan hệ) |
| `orders` | có **bất kỳ** Assignment nào của đối tác trên đơn đó |
| `assignment_commercial_terms` | qua `assignment_id` — **chỉ của chính mình** |

⚠️ Dòng cuối là ranh giới tiền: đối tác **được** xem đơn giá **của chính mình**
(điều kiện để đối soát), và **tuyệt đối không** thấy giá bán cho khách, giá thành
nội bộ, hay điều khoản của đối tác khác.

### 2.4 — Fail-closed, không fail-open

Mọi hàm trả `NULL`/`FALSE` khi không chắc. `mos_partner_id()` trả `NULL` ⇒ mọi
so sánh `partner_id = NULL` cho `NULL` ⇒ policy `FALSE` ⇒ **không thấy gì**.

⚠️ Bẫy đã gặp ở tầng TypeScript và sẽ lặp lại ở SQL: `NULL = NULL` trong SQL cho
`NULL` (không phải `TRUE`) — nên ở đây SQL an toàn hơn JS. Nhưng phải viết
`partner_id = mos_partner_id() AND mos_partner_id() IS NOT NULL` để **ý định rõ
ràng**, chứ không dựa vào một đặc tính dễ quên.

### 2.5 — 031 phải THAY THẾ `subcon_denied`, không phải chạy chồng lên

Trong **cùng một migration** (tức cùng một giao dịch):

1. Cài policy mới theo Assignment cho từng bảng
2. **Rồi mới** gỡ `subcon_denied` khỏi đúng những bảng đó

⚠️ Đảo thứ tự cũng an toàn vì cả hai nằm trong một giao dịch — không có khoảnh
khắc nào hở. Nhưng **để lại `subcon_denied`** thì 031 thành vô hiệu, và
**gỡ nó ở một migration RIÊNG (032)** thì giữa hai lần chạy hệ thống quay về đúng
tình trạng lộ dữ liệu của Vấn đề ①.

> **`subcon_denied` chỉ được gỡ ở đúng những bảng mà 031 đã cài policy thay thế.**
> Bảng nào chưa có policy Assignment thì `subcon_denied` **ở lại**.

### 2.6 — Buyer đi đường riêng, không qua Permission Engine

Buyer **không bao giờ có Assignment** (bất biến I-8, trigger của 029 từ chối).
Quyền của Buyer đi qua `mos_buyer_can_see_order()` của migration 018 — theo
**đơn hàng của khách**, không theo phần việc.

Permission Engine này phục vụ **Đối tác Thực thi**: Subcon · Supplier ·
Forwarder · Auditor.

## 3. Alternatives Considered

**① Giữ danh sách bảng cho phép của 025, chỉ siết thêm** — **Bác.** Nó phân
quyền theo **vai trò**. Không cách nào diễn đạt *"nhà thầu A thấy đơn hàng X
nhưng không thấy đơn hàng Y"* bằng một danh sách tên bảng. Vấn đề ① không giải
được, chỉ thu hẹp lại.

**② Đọc `partner_id` từ JWT `app_metadata`** — **Bác.** Nhanh hơn (không tra
bảng) nhưng claim **không đổi khi quan hệ đối tác thay đổi**. Ngừng hợp tác xong
đối tác vẫn vào được cho tới khi token hết hạn — và token Supabase sống hàng
giờ. Playbook Điều XXX: *"JWT chỉ mang Identity."*

**③ Cột `partner_id` phi chuẩn hoá trên mọi bảng vận hành** — **Bác.** Nhanh
nhất, nhưng nhân bản một sự thật ra chục bảng (Hiến pháp Điều III) và **lệch
ngay khi tái phân công**: chuyển bó sang nhà thầu khác thì mọi dòng lịch sử phải
cập nhật theo, và quên một bảng là một lỗ rò im lặng.

**④ Kiểm quyền ở tầng Service, không dùng RLS** — **Bác.** Playbook Điều XXX
mục 7.5: *"lọc ở client KHÔNG phải hàng rào bảo mật"*. Server Action là điểm vào
gọi thẳng được, và PostgREST còn gọi thẳng hơn. RLS là hàng rào duy nhất không
đi vòng được.

**⑤ Một hàm khổng lồ `mos_can(resource, row_id, action)`** — **Bác.** Gộp năm
câu hỏi khác nhau vào một chữ ký thì mỗi policy phải truyền tham số giả, và
không policy nào đọc lên hiểu ngay được. Năm hàm nhỏ, mỗi hàm một câu hỏi.

## 4. Consequences

### Lợi ích

- Vấn đề ① và ② đóng cùng lúc: đối tác thấy **đúng việc của mình**, và **ghi
  được** dữ liệu họ tạo ra.
- Thêm loại đối tác mới (Supplier · Forwarder · Auditor) chỉ cần thêm dòng vào
  `partner_permissions` — **không sửa policy nào**.
- Rút quyền tức thì: tắt `partner_accounts.is_active` hoặc `partners.is_active`
  là mất quyền ở **lần truy vấn kế tiếp**, không phải chờ token hết hạn.

### Đánh đổi — và cái đắt nhất là hiệu năng

⚠️ **RLS chạy policy cho TỪNG DÒNG.** Đây là rủi ro lớn nhất của thiết kế này.

| Việc | Ghi chú |
|---|---|
| `STABLE` + `SECURITY DEFINER` | bắt buộc, nếu không mỗi dòng là một lần tra bảng |
| Chỉ mục | `partner_accounts(user_id) WHERE is_active` · `assignments(partner_id, status)` đã có ở 029 |
| Đo thật | **bắt buộc đo lại ở 031 với dữ liệu thật**, đo **xen kẽ** với đường cơ sở |

⚠️ **Đo hôm nay KHÔNG chứng minh được gì**: `assignments` 0 dòng,
`hourly_production_logs` 1 dòng. Một policy sai kiến trúc vẫn chạy 2 ms trên
bảng rỗng. Hiến pháp Điều X đặt trần CRUD `< 300 ms` — con số đó chỉ có nghĩa khi
đo trên vài nghìn dòng.

### Đánh đổi khác

- Hai bản cài đặt của một bộ luật: `lib/mos/permission/assignment-permission.ts`
  và các hàm SQL. **Phải có phép kiểm đối chiếu** — cùng khuôn
  `SHIPMENT_FLOW` ⟷ `shipments_status_valid` và `pickTranslation` ⟷
  `mos_pick_translation`.
- `SECURITY DEFINER` là bề mặt tấn công: mỗi hàm phải ghim `search_path` và
  `REVOKE ALL FROM PUBLIC` trước khi cấp cho `authenticated` — bài học 036b.

### Nợ ghi nhận

| Nợ | Ghi chú |
|---|---|
| `partner_accounts` **0 dòng** | chưa đối tác nào có tài khoản. 031 mở quyền cho một tập RỖNG — an toàn, nhưng cũng nghĩa là **chưa kiểm được bằng dữ liệu thật** cho tới khi có tài khoản đầu tiên |
| `material_consumption` không tồn tại | tài liệu 06 nhắc tới; phải dựng hoặc gỡ khỏi tài liệu |
| `cut_bundles` không có `assignment_id` | nối qua bảng quan hệ — policy phức tạp hơn một bậc |
| Supplier · Forwarder · Auditor | hôm nay 0 đối tác loại này; `partner_permissions` khai trước là **suy đoán** (Playbook Điều XXIX) — chỉ khai loại đang có |

## 5. Rollback Impact

**030 (định nghĩa) — hoàn tác SẠCH.** Nó chỉ tạo một bảng master data và năm hàm;
**không policy nào tham chiếu tới chúng cho tới 031**. Gỡ ra không đổi hành vi
của bất kỳ ai.

```sql
DROP FUNCTION IF EXISTS mos_partner_id(), mos_is_partner(), ...;
DROP TABLE IF EXISTS partner_permissions;
```

**031 (thực thi) — ⚠️ ĐIỂM KHÔNG QUAY LẠI.**

Hoàn tác 031 nghĩa là dựng lại `subcon_denied` và danh sách cho phép của 025 —
tức **quay về đúng tình trạng lộ dữ liệu của Vấn đề ①**: subcon lại thấy nhà thầu
khác và mọi đơn hàng.

> Hoàn tác 031 không phải thao tác kỹ thuật. Nó là **quyết định chấp nhận một
> vi phạm Điều XXX đang sống**, và phải được ghi như vậy.

Nếu 031 hỏng, đường lui **đúng** là *siết chặt hơn* (chặn sạch đối tác như 029
Mục 11 đang làm), **không phải** nới về trạng thái 025.

## 6. Điều kiện tiên quyết trước khi chạy 031

```
☐  030 chạy xong, năm hàm có phép kiểm đối chiếu với bản TypeScript
☐  Màn hình lập Assignment phía Monica ĐANG CHẠY          ✅ (Phase 029)
☐  034 Optimistic Concurrency đã chạy                     ✅
☐  Ít nhất MỘT partner_account thật để kiểm bằng phiên thật
☐  Ma trận 14 vai trò × mọi bảng cổng, phiên đăng nhập THẬT
☐  Đo hiệu năng XEN KẼ trên dữ liệu có ý nghĩa
☐  Chứng minh hai đối tác KHÔNG thấy chéo nhau
☐  Chứng minh cửa sổ quyền TẮT khi hết hạn kế hoạch
```

⚠️ Dòng thứ tư là dòng dễ bỏ qua nhất: `partner_accounts` **đang 0 dòng**, nên
mọi phép kiểm hôm nay chỉ chứng minh *"đối tác không thấy gì"* — điều vốn đã
đúng từ 029. **Phải có một tài khoản đối tác thật** thì mới kiểm được rằng họ
thấy **đúng phần của mình**, chứ không phải thấy quá nhiều.

## 7. References

**Hiến pháp:** Điều II (Subcon là năng lực chính) · III (một nguồn sự thật) ·
IV (ADR trước SQL) · VII (đúng Domain trước tối ưu) · X (hiệu năng · N+1) ·
XII (cô lập sự cố).

**Playbook:** **Điều XXX** (Đối tác Vận hành Bên ngoài — nguồn của toàn bộ thiết
kế này) · XIII (Permission) · XXV (kiểm thử) · XXIX (chống phức tạp hoá).

**Migration:** [018](../../supabase/migrations/018_buyer_rls.sql)
(`mos_buyer_can_see_order` — Buyer đi đường riêng) ·
[025](../../supabase/migrations/025_subcon_lockdown.sql) (**`subcon_denied`
RESTRICTIVE — cái bẫy ở Mục 1.2**) · 026 · [027](../../supabase/migrations/027_partner_domain.sql)
(`partner_accounts`) · [029](../../supabase/migrations/029_assignment_domain.sql)
Mục 11 (chặn sạch người ngoài — tình trạng hiện tại) ·
[034](../../supabase/migrations/034_optimistic_concurrency.sql) ·
**030** ← ADR này · **031** ← điểm không quay lại.

**Mã nguồn:** `lib/mos/permission/assignment-permission.ts` — **bộ luật gốc mà
các hàm SQL phải phản chiếu từng chữ**.

**ADR:** [ADR-002](ADR-002-assignment-domain.md) ·
[ADR-004](ADR-004-concurrency-control.md) (phải xong trước 031 — ✅ đã xong).
