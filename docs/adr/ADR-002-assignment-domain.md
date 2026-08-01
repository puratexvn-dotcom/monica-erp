# ADR-002 · ASSIGNMENT DOMAIN

| | |
|---|---|
| **Trạng thái** | Đã phê duyệt — *Approved with Required Changes*, 01/08/2026 |
| **Migration** | `029_assignment_domain.sql` + `029b_revoke_hard_delete.sql` |
| **Thay thế / bổ sung** | không |
| **Nợ thủ tục** | ⚠️ ADR này viết **sau** SQL. Chính sách ADR ban hành cùng lúc với quyết định phê duyệt 029, nên 029 là trường hợp chuyển tiếp duy nhất. Từ 030 trở đi: ADR trước, SQL sau. |

---

## 1. Context

MONICA MOS đang phân quyền cho đối tác bên ngoài bằng **vai trò** (`role = 'subcon'`).
Ba lỗ hổng thật đã đo được và vá ở 025/026:

- đối tác đọc được `financial_records`, `profiles`, bảng lương;
- đối tác **ghi** được `subcon_orders` — tức tự sửa đơn giá của chính mình;
- 7 view chạy dưới quyền chủ sở hữu, vượt mặt RLS (vá ở 024 Mục 7).

Cả ba đều cùng một gốc: **vai trò là thuộc tính của người, không phải của việc.**
Một khi đã là `subcon`, người đó thấy mọi thứ mà `subcon` được thấy — không có
chỗ nào trong lược đồ nói *"người này được làm việc này, trên đơn hàng này, từ
ngày này đến ngày này"*.

Điều XXX đặt ra nguyên tắc thay thế: **phân quyền theo Assignment, không theo
Role.** Nhưng ở thời điểm đó **Assignment chưa tồn tại như một thực thể** — nó
nằm rải trong `subcon_orders` (0 dòng), `cut_bundles`, `sewing_lines`, không có
trạng thái, không có mốc thời gian, không có người chịu trách nhiệm.

Bằng chứng đo được lúc thiết kế:

| Đo | Kết quả |
|---|---|
| `subcon_orders` | **0 dòng** — chưa từng chạy thật |
| `subcons` | không có cột loại hợp đồng |
| `subcontractors.service_type` | chỉ `GIAT`, `IN_THEU` — *loại dịch vụ*, không phải *loại hợp đồng* |
| `activity_log` | đã có đúng hình dạng cần, **0 dòng, chưa ai dùng** |
| `sewing_lines.site_id` | **cả 3 chuyền chưa gắn địa điểm** (nợ từ 028) |
| `md_documents.entity_type` | CHECK 7 giá trị của 016, **không có `ASSIGNMENT`** |

## 2. Decision

Dựng **Assignment làm Aggregate Root** của Manufacturing Execution — một thực
thể có vòng đời, có hai bên, có cửa sổ thời gian, và là **mẫu số** của mọi phép
phân quyền và mọi chỉ số đối tác.

**Phạm vi 029:**

| | |
|---|---|
| `contract_types` | master data, **khởi tạo 0 dòng** |
| `assignments` | gốc aggregate · 9 trạng thái · Business Number · `scope_level` tường minh |
| `assignment_bundles` | quan hệ, chỉ mục duy nhất **một phần** |
| `assignment_daily_reports` | **sổ cái bất biến** · `parent_report_id` |
| `assignment_commercial_terms` | giá **hai lớp**: quan hệ thương mại ⟂ cách tính |
| 6 cột `assignment_id` | thêm vào bảng đang chạy, **đều NULLABLE** |
| 2 view | `v_assignment_timeline` · `v_assignment_report_status`, `security_invoker` từ lần tạo |
| RLS | **chặn sạch người ngoài** — 030 mới nới |

**Năm quy tắc đóng đinh trong lược đồ, không để ở tầng ứng dụng:**

1. **NULL không bao giờ nghĩa là "tất cả".** Phạm vi rộng được *tuyên bố* bằng
   `scope_level='ORDER'`. `assignments_scope_shape` ép mỗi cấp có đúng cột của
   cấp đó — quên chọn chuyền thì **bị từ chối**, chứ không âm thầm nới quyền
   thành "mọi chuyền".
2. **Sổ cái chỉ ghi thêm.** Sản lượng ngày là căn cứ thanh toán. Sửa số ⇒ ghi
   bản đính chính trỏ về bản cũ. Trigger từ chối mọi `UPDATE`/`DELETE`, **kể cả
   `service_role`**.
3. **Kế hoạch và Thực tế tồn tại song song.** `planned_*` là thứ hai bên thoả
   thuận; `actual_*` là thứ đã xảy ra. Cửa sổ quyền dùng **kế hoạch** — lấy
   `actual_finish` nghĩa là để đối tác tự quyết khi nào quyền của mình hết.
4. **Trigger chỉ Validate · Reject · Audit.** I-8 từ chối partner `BUYER`; I-9
   từ chối ghi con vào cha đã đóng. Không trigger nào tự chuyển trạng thái, tự
   gỡ bó, hay tự sinh chứng từ.
5. **Không lưu thứ tính được.** `report_status` là view; `can_write`,
   `is_missing`, `delay_days` không tồn tại (Điều XXVIII.1).

## 3. Alternatives Considered

**① Mở rộng `subcon_orders` thay vì dựng bảng mới.** — *Bác.* `subcon_orders`
là **chứng từ thương mại** (đơn giá, số lượng, ngày giao). Assignment là **đơn
vị phân quyền và trách nhiệm**. Nhồi trạng thái, cửa sổ thời gian và chủ sở hữu
vào một bảng chứng từ sẽ khiến mỗi lần đổi luật phân quyền lại phải sửa bảng mà
kế toán đang đọc. Hai vòng đời khác nhau ⇒ hai bảng.

**② `enum` cho `contract_type`.** — *Bác.* Loại hợp đồng là danh mục nghiệp vụ,
nhà máy thêm bớt theo thực tế. `enum` bắt viết migration mỗi lần ký một kiểu hợp
đồng mới. Ngược lại `rate_method` (cách tính một đồng) hữu hạn và ổn định, nên
**vẫn giữ `CHECK`** — hai thứ trông giống nhau nhưng thay đổi với nhịp khác nhau.

**③ Seed `contract_types` với CMT/CM/FOB.** — *Bác.* Không có một mẩu bằng chứng
nào trong CSDL. Seed suy đoán tạo ra một sự thật giả mà sáu tháng sau không ai
phân biệt được với sự thật đo được. Khởi tạo rỗng, nghiệp vụ tự khai — giống
`production_sites` và `operations`.

**④ Bảng `assignment_events` riêng cho Timeline.** — *Bác.* `activity_log` đã có
đúng hình dạng cần và đang 0 dòng. Nhân bản là vi phạm Điều XXIX.

**⑤ Cột `superseded_at` trên sổ cái** (bản 4 của tôi). — *Bác bởi Kiến trúc sư,
và đúng.* Nó đòi một `UPDATE` lên chính sổ cái để đánh dấu bản cũ — tức là phá
tính bất biến bằng chính cơ chế bảo vệ tính bất biến. `parent_report_id` không
cần chạm dòng cũ: **bản đang hiệu lực là bản không có con.**

**⑥ Ngoại lệ `service_role` trong trigger sổ cái** (đề xuất của tôi). — *Bác bởi
Kiến trúc sư, và đúng.* Tôi lập luận rằng khoá dịch vụ vốn đã vượt mọi RLS nên
chặn nó không thêm an toàn. Lập luận đó **nhìn sai trục**: khác nhau không nằm ở
*quyền* mà ở **dấu vết**. Một ngoại lệ trong trigger là cửa không để lại dấu;
Migration / Maintenance Script / Recovery Procedure đều công khai và có rà soát.

**⑦ Mở rộng `md_documents.entity_type` trong cùng 029.** — *Hoãn.* Xem Mục 4.

## 4. Consequences

### Lợi ích

- Có **một chỗ duy nhất** trả lời *"ai được làm gì, ở đâu, khi nào"* — điều kiện
  tiên quyết để 030/031 thay phân quyền theo Role bằng phân quyền theo Assignment.
- Sản lượng dùng để thanh toán trở nên **không thể sửa lén**.
- `REPORT MISSING` có răng: `→ COMPLETED` bị chặn khi còn ngày `OVERDUE`.
- Business Number đọc được (`ASG-CC01-2026-00042`) cho vận hành và chứng từ.

### Đánh đổi

- **Bốn bảng và hai view mới** trước khi có một dòng dữ liệu nào. Chấp nhận vì
  031 là điểm không quay lại: bật RLS theo Assignment mà chưa có Assignment thì
  **mọi đối tác mất sạch quyền truy cập**.
- Sổ cái bất biến làm **kiểm thử đắt hơn**: bài kiểm phải dựng Assignment riêng
  và dọn bằng Maintenance Script gỡ-và-gắn-lại trigger.
- Đọc số liệu ngày phải luôn kèm `NOT EXISTS (... parent_report_id = r.id)`.
  Thiếu mệnh đề này thì **một ngày đã đính chính bị đếm đôi**.

### Technical Debt — ghi để không ai quên

| Nợ | Tan khi |
|---|---|
| **`assignments_scope_shape` là RÀNG BUỘC CHUYỂN TIẾP.** Cả 3 chuyền chưa gắn địa điểm (nợ 028), nên phạm vi `LINE` và `STYLE_OPERATION` **tạm thời chưa dùng được**. Phạm vi `ORDER` dùng được ngay. **Đây không phải lỗi** — ràng buộc đang làm đúng việc của nó là từ chối dữ liệu thiếu. | `sewing_lines.site_id` đủ cho cả 3 chuyền, rồi `SET NOT NULL` |
| **`md_documents.entity_type` chưa nhận `ASSIGNMENT`.** Tách khỏi 029 vì nó đổi ràng buộc trên **hai bảng dùng chung của /md**, và kéo theo: mã lỗi đổi `23514 → 23503`, mà `friendlyDbError` đang dịch `23503` thành *"Dữ liệu đang được tham chiếu ở nơi khác"* — câu **sai hẳn** cho ca này. | migration riêng, làm cùng lúc dựng màn hình Assignment |
| `Issues` và `Settlement` hoãn | có Assignment thật đóng sổ |
| RLS 029 chặn sạch người ngoài | 030 (Permission Engine) + 031 (RLS) |

### Khuyết tật đã phát hiện và sửa — quyền xoá cứng

Mục 11 của 029 ghi *"Không cấp DELETE ở đâu cả"*. **Câu đó sai.** Bài kiểm sống
với phiên đăng nhập thật (vai trò `md`) đã **xoá cứng được** một Assignment.

Nguyên nhân: Supabase đặt sẵn `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL
ON TABLES TO anon, authenticated, service_role`, nên mọi bảng mới nhận đủ quyền
ngay lúc `CREATE TABLE`. Câu `GRANT SELECT, INSERT, UPDATE` là phép **cộng thêm**,
không phải phép thu hẹp — `GRANT` không bao giờ thu hồi.

Đo được: cả **8 bảng** của 027 · 028 · 029 đều hở. Khoá ngoại `ON DELETE RESTRICT`
che phần lớn thiệt hại, nhưng một Assignment **chưa có con** thì biến mất sạch,
để lại `activity_log` trỏ vào một `entity_id` không còn tồn tại.

**Sửa ở `029b_revoke_hard_delete.sql`**: `REVOKE DELETE` và `REVOKE TRUNCATE` khỏi
`authenticated`/`anon` trên cả 8 bảng. `service_role` giữ nguyên — ba đường hợp lệ
(Migration · Maintenance Script · Recovery Procedure) đều đi bằng khoá đó.

⚠️ **Bài học mang sang 030/031:** mỗi migration tạo bảng phải **đo quyền thực tế
bằng phiên đăng nhập thật**, không được suy từ câu `GRANT` mình vừa viết.

### ⚠️ Ràng buộc thứ tự không được vi phạm

> Màn hình lập Assignment phía Monica **phải tồn tại trước 031**.

031 bật RLS theo Assignment. Nếu lúc đó chưa ai lập được Assignment nào thì
**toàn bộ đối tác mất quyền truy cập ngay lập tức**.

## 5. Rollback Impact

**Trước khi có Assignment thật — hoàn tác SẠCH.** Chưa mã nguồn nào đọc bốn bảng
này; sáu cột `assignment_id` đều rỗng; không có dữ liệu nào bị đổi nghĩa. Kịch
bản `DROP` đầy đủ nằm ở **Mục 12 của file SQL**. **Không cần migration bù.**

**Sau khi có Assignment thật — KHÔNG hoàn tác được sạch.** `DROP COLUMN
assignment_id` xoá vĩnh viễn liên kết đã gán trên 6 bảng đang chạy, và sổ cái
`assignment_daily_reports` có thể đã là căn cứ thanh toán. Lúc đó phải:
sao lưu → migration bù chuyển dữ liệu → mới được `DROP`.

**Sau 031 — hoàn tác là sự cố vận hành**, không phải thao tác kỹ thuật: gỡ
Assignment nghĩa là gỡ nền của phân quyền, và mọi đối tác mất quyền truy cập.

## 6. References

**Hiến pháp:** Điều XI (audit 100%) · XXI (i18n) · XXVII (thay đổi CSDL là quyết
định kiến trúc) · XXVIII.1 (không lưu thứ tính được) · XXVIII.2 (`CHECK` thay
`enum`) · XXIX (chống over-engineering) · XXX (Mô hình Đối tác Vận hành Bên
ngoài) · XXXI (kiểm thử phá huỷ dùng dữ liệu tạm) · XXXIII (chính sách ADR).

**Migration:** 016 (`md_documents` CHECK) · 018 (RLS buyer) · 023 (khuôn
`capa_logs`: lý do ≥ 10 ký tự) · 024 (bài học `etd_date DEFAULT`; vá 7 view;
chỉ mục duy nhất một phần) · 025 · 026 · 026b (trigger chỉ từ chối) ·
**027** (Partner Domain) · **028** (Production Site) · **029** ← ADR này ·
030 (Permission Engine) · 031 (RLS — điểm không quay lại) · 032 (dọn dẹp).

**ADR:** [ADR-001 — Địa điểm sản xuất & Công đoạn](../assignment/ADR-001-site-and-operation.md)

**Thiết kế:** [`docs/assignment/`](../assignment/) — 12 tài liệu, đặc biệt
[01 · Domain Model](../assignment/01-assignment-domain-model.md) (bản 5) ·
[03 · State Machine](../assignment/03-state-machine.md) ·
[06 · Data Flow](../assignment/06-data-flow.md) ·
[10 · Risk Analysis](../assignment/10-risk-analysis.md)
