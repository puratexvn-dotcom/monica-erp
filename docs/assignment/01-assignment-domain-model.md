# 01 · ASSIGNMENT DOMAIN MODEL

> **Bản 5** — Assignment là **Aggregate Root** của Manufacturing Execution.
>
> Thay đổi so với bản 4, theo sáu tinh chỉnh ngày 01/08/2026:
> Daily Report theo **mô hình SỔ CÁI** (`parent_report_id`, không bao giờ
> `UPDATE`) · giá tách **HAI LỚP** (loại hợp đồng ≠ cách tính đơn giá) ·
> thêm `owner_user_id` · **planned/actual** thay cho một cặp ngày · `priority` ·
> Timeline là **Business View**, giao diện không đọc thẳng `activity_log`.
>
> Quyết định địa điểm & công đoạn: [ADR-001](ADR-001-site-and-operation.md).

---

## 1. Assignment là gì

> **Một phần việc THỰC THI mà Monica giao cho một Đối tác Thực thi, trong một
> phạm vi xác định, trong một khoảng thời gian xác định.**

Assignment là **Aggregate Root** của Manufacturing Execution — không phải của
Customer Management.

### Aggregate Root nghĩa là gì ở đây

| Luật | Hệ quả cụ thể |
|---|---|
| Bốn thực thể con **chỉ tồn tại qua** Assignment | không bảng nào ngoài aggregate được khai khoá ngoại trỏ thẳng vào `assignment_bundles` hay `assignment_daily_reports` |
| Bất biến kiểm ở **gốc** | không thêm báo cáo ngày vào Assignment đã `CLOSED`; không gắn bó vào Assignment đã `CANCELLED` |
| Vòng đời con theo cha | Assignment xoá mềm thì con **không còn hiệu lực**, dù dòng vẫn nằm đó |
| Một giao dịch, một aggregate | không sửa hai Assignment trong cùng một thao tác |

Ranh giới aggregate:

```
                    ┌─────────────────────────────┐
                    │      ASSIGNMENT (root)      │
                    ├─────────────────────────────┤
                    │ assignment_bundles          │  quan hệ (Mục 4)
                    │ assignment_daily_reports    │  sự kiện nghiệp vụ (Mục 3)
                    │ assignment_commercial_terms │  điều khoản
                    └─────────────────────────────┘
                                 │ tham chiếu RA NGOÀI (chỉ đọc)
                    ┌────────────┼────────────┬──────────────┐
                    ▼            ▼            ▼              ▼
                 orders      partners   production_sites  style_operations
```

### Không phải là gì

| KHÔNG phải | Vì sao |
|---|---|
| một dòng `subcon_orders` | đó là **chứng từ**; chứng từ sinh ra TỪ Assignment |
| một vai trò | vai trò nói *anh là ai*; Assignment nói *anh được giao gì* |
| đường vào của Buyer | Buyer **sở hữu** đơn hàng — mục 8 |

## 2. Ngôn ngữ chung

| Thuật ngữ | Định nghĩa |
|---|---|
| **Execution Partner** | Đối tác thực thi — loại duy nhất có Assignment |
| **Order Owner** | Buyer. Sở hữu đơn hàng, không có Assignment |
| **Assignment** | Aggregate Root — phần việc thực thi được giao |
| **Scope** | Ranh giới **tài nguyên**: PO · địa điểm · chuyền · công đoạn |
| **Bundle Link** | **Quan hệ** — bó nào thuộc phần việc này. KHÔNG phải phạm vi |
| **Business Event** | Sự việc đã xảy ra trên Assignment: nhận việc · báo cáo ngày · đổi trạng thái |
| **Timeline** | Dòng thời gian mọi Business Event của một Assignment |

Sáu loại Đối tác Thực thi: `PRODUCTION_PARTNER` · `SERVICE_PARTNER` ·
`SUPPLIER` · `FORWARDER` · `INSPECTION` · `AUDITOR`.
`BUYER` **không** có Assignment.

## 3. Thực thể

### 3.1 `assignments` — gốc aggregate

```
id                 UUID
assignment_no      VARCHAR UNIQUE     ⚠️ KHOÁ NGHIỆP VỤ, bắt buộc (Mục 6)
                                      ASG-2026-0042 — người vận hành đọc và gọi
                                      tên được, UUID thì không

partner_id         UUID → partners(id)          BẮT BUỘC
order_id           UUID → orders(id)            BẮT BUỘC

-- ─── PHẠM VI: TUYÊN BỐ TƯỜNG MINH, không suy từ NULL ─────────────
scope_level        VARCHAR NOT NULL
                   IN (ORDER, SITE, LINE, STYLE_OPERATION)
site_id            UUID → production_sites(id)
line_id            UUID → sewing_lines(id)
style_operation_id UUID → style_operations(id)

assigned_qty       NUMERIC
uom                VARCHAR

owner_user_id      UUID → profiles(id)    người của Monica CHỊU TRÁCH NHIỆM
priority           VARCHAR NOT NULL DEFAULT 'NORMAL'
                   IN (LOW, NORMAL, HIGH, URGENT)

-- ─── KẾ HOẠCH và THỰC TẾ, giữ CẢ HAI ─────────────────────────────
planned_start      DATE  nullable ở CSDL · BẮT BUỘC khi → ISSUED
planned_finish     DATE  nullable ở CSDL · BẮT BUỘC khi → ISSUED
actual_start       DATE                   NULL = chưa bắt đầu
actual_finish      DATE                   NULL = chưa xong

status             VARCHAR NOT NULL   (tài liệu 03 — CHÍN trạng thái)

-- ─── VẾT DẤU ĐẦY ĐỦ CỦA NĂM SỰ KIỆN (Mục 7) ──────────────────────
created_at · created_by         ai soạn
assigned_at · assigned_by       ai giao   (→ ISSUED)
accepted_at · accepted_by       ai nhận   (→ ACCEPTED)
rejected_at · rejected_by · reject_reason      (→ REJECTED, Mục 8)
closed_at · closed_by · close_reason           (→ CLOSED)
cancelled_at · cancelled_by · cancel_reason    (→ CANCELLED)
updated_at · updated_by
deleted_at · deleted_by
```

#### `planned_*` và `actual_*` — vì sao phải giữ cả hai

Bản 4 chỉ có `start_date`/`end_date`. Tinh chỉnh của Kiến trúc sư lộ ra rằng
**một cặp ngày là không đủ**, và đây đúng là bài học `etd_date` của migration
024:

> Chỉ giữ một cặp thì lần cập nhật đầu tiên biến **kế hoạch** thành **thực tế**,
> và xoá mất bằng chứng. Không còn gì để trả lời *"đối tác bắt đầu trễ mấy
> ngày"* — mà đó là con số quyết định trách nhiệm khi hàng chậm.

Hai loại trễ, tách riêng như `atd−etd` và `ata−eta` ở Trung tâm Xuất hàng:

```
actual_start  − planned_start    trễ KHỞI ĐỘNG   → đối tác vào việc muộn
actual_finish − planned_finish   trễ HOÀN THÀNH  → làm chậm hơn cam kết
```

⚠️ **Cửa sổ quyền dùng `planned_*`, không dùng `actual_*`.** Khoảng hiệu lực là
thứ HAI BÊN đã thoả thuận; `actual_*` là thứ đã xảy ra. Lấy `actual_finish` làm
mốc tắt quyền nghĩa là đối tác tự quyết định khi nào quyền của mình hết.

#### Hai ngày kế hoạch nullable ở CSDL, bắt buộc ở Service

Lúc soạn `DRAFT` chưa biết ngày. Ép `NOT NULL` nghĩa là không lưu nháp được, và
người dùng sẽ điền ngày giả để đi tiếp — đúng lỗi `etd_date DEFAULT CURRENT_DATE`
của migration 024.

CSDL giữ **BẤT BIẾN DỮ LIỆU**, Service giữ **QUY TRÌNH**:

```
CSDL     assignments_planned_order   finish >= start  (khoan dung với NULL)
         assignments_actual_order    finish >= start  (khoan dung với NULL)
Service  → ISSUED đòi đủ cả hai ngày, kèm thông báo người dùng đọc hiểu
```

Khoan dung với **TRỐNG**, nghiêm khắc với **NGƯỢC**: `finish < start` không phải
dữ liệu chưa xong — nó là dữ liệu **sai**, và nó làm mọi phép tính trễ hạn ra số
âm. Mục 9 của tài liệu 03 đặt điều kiện chuyển trạng thái ở Service; ràng buộc
thứ tự ngày là bất biến dữ liệu nên nằm ở CSDL.

⚠️ **KHÔNG ràng buộc `actual_start ≥ planned_start`.** Bắt đầu sớm hơn kế hoạch
là chuyện tốt, không phải lỗi dữ liệu. Bất thường được **báo** ở tầng Domain,
không bị **chặn** ở Postgres — đúng lý lẽ đã dùng cho bốn mốc ETD/ATD/ETA/ATA.

#### `owner_user_id` khác `assigned_by`

| Cột | Trả lời |
|---|---|
| `assigned_by` | **ai bấm nút giao** — một sự kiện, xảy ra một lần |
| `owner_user_id` | **ai đang chịu trách nhiệm** — một vai trò, đổi người được |

Merchandiser lập Assignment rồi nghỉ thai sản; người khác tiếp quản. `assigned_by`
phải giữ nguyên (lịch sử), `owner_user_id` phải đổi (hiện tại). Một cột không
làm được cả hai.

NULL ở đây đúng nghĩa **"chưa phân công người phụ trách"** — hợp lệ ở `DRAFT`,
nhưng service chặn `→ ISSUED` khi còn trống.

⚠️ **Năm cặp mốc/người riêng biệt, không gộp.** Gộp thành `changed_at`/
`changed_by` sẽ mất câu trả lời cho *"ai giao việc này"* ngay lần đổi trạng thái
kế tiếp. Đây là dữ liệu **pháp lý** khi hàng trễ, không phải tiện ích.

Chúng **không thay thế** Timeline (mục 3.5): cột là *trạng thái hiện tại*,
Timeline là *lịch sử*. Một Assignment mở lại từ `COMPLETED` về `IN_PROGRESS`
sẽ mất dấu nếu chỉ nhìn cột.

#### `scope_level` — bốn cấp, cột nào có giá trị là do cấp quyết định

| `scope_level` | site_id | line_id | style_operation_id |
|---|:---:|:---:|:---:|
| `ORDER` | NULL | NULL | NULL |
| `SITE` | **có** | NULL | NULL |
| `LINE` | **có** | **có** | NULL |
| `STYLE_OPERATION` | **có** | **có** | **có** |

`CHECK` ép đúng bảng trên. **NULL chỉ có nghĩa "không áp dụng ở cấp này"** — nó
không thể nghĩa "tất cả" (đã tuyên bố bằng `scope_level`), cũng không thể nghĩa
"chưa xác định" (`CHECK` không cho ghi).

### 3.2 `assignment_bundles` — QUAN HỆ, không phải phạm vi

> **Nguyên tắc 4 của Kiến trúc sư.** Điều này giải quyết dứt điểm mâu thuẫn tôi
> đã gắn cờ ở [ADR-001 Phần 5](ADR-001-site-and-operation.md).

```
assignment_id · bundle_id · deleted_at · deleted_by · created_at · created_by
UNIQUE (bundle_id) WHERE deleted_at IS NULL
```

**Phạm vi** trả lời *"quyền chạm tới đâu"* → `scope_level`.
**Quan hệ** trả lời *"làm trên những bó nào"* → bảng này.

Hai câu hỏi khác nhau, hai cơ chế. Vì vậy `scope_level` **không bao giờ** có
giá trị `BUNDLE`, và mâu thuẫn tôi lo trước đây không tồn tại.

⚠️ Chỉ mục duy nhất **một phần** — bài học `shipment_cartons` (024). Việc gỡ bó
khi huỷ Assignment nằm ở **tầng service**, không ở trigger (Điều XXX mục 5).

### 3.3 `assignment_daily_reports` — SỰ KIỆN NGHIỆP VỤ

> **Nguyên tắc 3.** Báo cáo ngày không phải "một dòng dữ liệu" — nó là một
> **sự việc đã xảy ra**.

> **Mô hình SỔ CÁI** — Tinh chỉnh 1. Bảng này **chỉ được THÊM**. Không một
> lệnh `UPDATE` nào, kể cả để đánh dấu "đã bị thay thế".

```
id                UUID
assignment_id · report_date
parent_report_id  UUID → assignment_daily_reports(id)
                  NULL = bản GỐC của ngày đó
                  có   = bản ĐÍNH CHÍNH của bản cha
correction_reason TEXT     bắt buộc khi parent_report_id có giá trị

target_qty · output_qty · defect_qty · rework_qty · downtime_minutes
issue_note · support_request · comment
submitted_by · submitted_at

UNIQUE (assignment_id, report_date) WHERE parent_report_id IS NULL
UNIQUE (parent_report_id)           WHERE parent_report_id IS NOT NULL
```

**Bản 4 dùng `revision_of` + `superseded_at`. Sai ở chỗ:** đánh dấu
`superseded_at` trên bản cũ **là một lệnh `UPDATE` lên sổ cái**. Một sổ cái mà
có thể sửa dòng cũ thì không còn là sổ cái.

Mô hình mới không đụng một dòng nào đã ghi:

```
06/08  bản gốc      output=800   parent=NULL
06/08  đính chính   output=850   parent=<bản gốc>   lý do: "đếm sót 1 xe hàng"
       ↑ bản ĐANG HIỆU LỰC là bản KHÔNG CÓ CON
```

**Hai chỉ mục duy nhất, mỗi cái chặn một kiểu hỏng:**

| Chỉ mục | Chặn |
|---|---|
| `(assignment_id, report_date) WHERE parent IS NULL` | hai bản gốc cho cùng một ngày |
| `(parent_report_id) WHERE parent IS NOT NULL` | hai bản đính chính **rẽ nhánh** từ cùng một cha |

Cái thứ hai quan trọng không kém: nếu một bản cha có hai con, câu hỏi *"bản nào
đang hiệu lực"* không còn câu trả lời. Chuỗi phải **tuyến tính**.

**Bản đang hiệu lực** = bản không có con:

```sql
WHERE NOT EXISTS (SELECT 1 FROM assignment_daily_reports c
                   WHERE c.parent_report_id = r.id)
```

⚠️ Trigger `BEFORE UPDATE` **từ chối mọi lệnh sửa** trên bảng này — đúng phạm vi
Điều XXX mục 5 (trigger được REJECT, không được thay người dùng quyết định).

Vì sao đáng làm: sản lượng ngày là căn cứ **thanh toán**. Cho sửa đè lên nghĩa
là cho viết lại quá khứ mà không ai biết.

#### Trạng thái hoàn thành — TÍNH, không lưu (Mục 9)

| Trạng thái | Điều kiện |
|---|---|
| `NOT_STARTED` | chưa có bản nào, và **hôm nay** là ngày đó |
| `PARTIAL` | có bản nhưng thiếu `output_qty` hoặc `target_qty` |
| `COMPLETE` | có bản, đủ số bắt buộc |
| `OVERDUE` | chưa có bản, và ngày đó **đã qua** |

⚠️ **Không cột `report_status`.** Điều XXVIII.1 — nó sẽ lệch đúng lúc nửa đêm
trôi qua mà không ai chạy lại phép tính. Tính ở Domain và ở view.

`NOT_STARTED` khác `OVERDUE` là khác biệt quan trọng nhất: một cái là *chưa tới
hạn*, một cái là *đã trễ*. Gộp lại thì bảng điều khiển của Giám đốc đỏ rực mỗi
sáng và không ai nhìn nữa.

### 3.4 `assignment_commercial_terms` — NĂM PHƯƠNG THỨC TÍNH GIÁ

> **Nguyên tắc 5.** Tách khỏi Assignment vì Assignment là miền **vận hành**;
> và RLS trên `assignments` là đường đọc nóng nhất, không được chạm dữ liệu giá.

> **HAI LỚP, KHÔNG PHẢI MỘT** — Tinh chỉnh 3.

Bản 4 nhét cả hai khái niệm vào một enum `pricing_method`. Sai: **loại hợp đồng**
và **cách tính đơn giá** là hai chiều độc lập.

```
contract_type   "quan hệ thương mại là gì"      CMT · CM · FOB · SERVICE · CONSIGNMENT
rate_method     "một đồng được tính thế nào"    PER_UNIT · PER_OPERATION ·
                                                PER_SAM_MINUTE · PER_KG · LUMP_SUM
```

Chúng tổ hợp tự do: một hợp đồng `CMT` có thể tính `PER_UNIT` **hoặc**
`PER_SAM_MINUTE`; một hợp đồng `SERVICE` (giặt) thường tính `PER_KG` nhưng cũng
có thể `LUMP_SUM`. Gộp thành một enum thì phải liệt kê **tích Descartes** —
25 giá trị cho 10 khái niệm, và mỗi lần thêm một loại hợp đồng là thêm năm giá
trị.

```
assignment_id  UUID UNIQUE → assignments(id)
contract_no    VARCHAR

contract_type  VARCHAR NOT NULL
               IN (CMT, CM, FOB, SERVICE, CONSIGNMENT)
rate_method    VARCHAR NOT NULL
               IN (PER_UNIT, PER_OPERATION, PER_SAM_MINUTE, PER_KG, LUMP_SUM)

rate           NUMERIC      đơn giá theo rate_method
lump_sum       NUMERIC      CHỈ dùng khi rate_method = LUMP_SUM
currency       VARCHAR(3) NOT NULL IN (VND, USD, EUR, CNY, JPY, KRW)
payment_term   VARCHAR
note           TEXT
```

| `contract_type` | Nghĩa |
|---|---|
| `CMT` | Cut–Make–Trim: Monica cấp toàn bộ nguyên phụ liệu |
| `CM` | Cut–Make: không bao gồm phụ liệu |
| `FOB` | đối tác tự lo nguyên liệu, giao thành phẩm |
| `SERVICE` | dịch vụ đơn lẻ — in · thêu · giặt |
| `CONSIGNMENT` | gia công trên hàng ký gửi |

| `rate_method` | `rate` là gì |
|---|---|
| `PER_UNIT` | đồng / sản phẩm |
| `PER_OPERATION` | đồng / sản phẩm / công đoạn |
| `PER_SAM_MINUTE` | đồng / phút định mức (`style_operations.sam_minutes`) |
| `PER_KG` | đồng / kg |
| `LUMP_SUM` | *(không dùng — xem `lump_sum`)* |

`CHECK` ép: `LUMP_SUM` thì `lump_sum` bắt buộc và `rate` phải NULL; bốn cách còn
lại thì ngược lại. **Không dùng NULL để đoán phương thức** — `rate` NULL nghĩa
là dữ liệu thiếu, và `CHECK` chặn.

⚠️ **Năm loại hợp đồng suy từ nghiệp vụ ngành may, KHÔNG đo được từ dữ liệu**
(`subcon_orders` 0 dòng, chỉ có một cột `unit_price` không nói loại hợp đồng).
Nếu nhà máy thực tế chỉ dùng hai hoặc ba loại, **cắt bớt ngay bây giờ rẻ hơn**
mang năm giá trị mà ba cái không ai chọn.

### 3.5 Timeline — VIEW, không phải bảng (Mục 10)

> Timeline là **thành phần mặc định** của Domain: mọi Assignment đều có, không
> phải tính năng bật thêm.

**Không tạo bảng mới.** Đo được: `activity_log` đã tồn tại với đúng hình dạng
cần — `entity_type · entity_id · action · changes (jsonb) · actor_id ·
actor_role · created_at` — và đang **0 dòng, chưa ai dùng**.

```
v_assignment_timeline  =  hợp của ba nguồn
   ① activity_log            đổi trạng thái  (entity_type='assignment')
   ② assignment_daily_reports  báo cáo ngày, kể cả bản đính chính
   ③ assignment_bundles        gắn bó · gỡ bó  (created_at · deleted_at)
```

Ba nguồn, một view, **không nhân bản dữ liệu**. Điều XXVIII.1: Timeline là dữ
liệu tính được từ sự kiện gốc, nên nó là view chứ không phải bảng.

#### ⚠️ Giao diện KHÔNG BAO GIỜ đọc thẳng `activity_log` — Tinh chỉnh 2

> `activity_log` là **nguồn**. `v_assignment_timeline` là **hợp đồng**.

Hình dạng chuẩn hoá mà view cam kết, và là thứ duy nhất giao diện được thấy:

```
assignment_id · occurred_at · event_type · actor_id · actor_role
title_key      khoá i18n — giao diện dịch, view không biết ngôn ngữ
payload jsonb  số liệu kèm theo, đã chuẩn hoá
```

Ba lý do lớp trung gian này đáng có:

**① `activity_log` là bảng DÙNG CHUNG.** Hôm nay 0 dòng, nhưng khi các phân hệ
khác bắt đầu ghi vào, `changes` jsonb sẽ mang mười hình dạng khác nhau. Giao
diện đọc thẳng nghĩa là giao diện phải biết cả mười.

**② Ba nguồn có ba hình dạng khác nhau.** Báo cáo ngày không có `action`; liên
kết bó không có `actor_role`. View là nơi duy nhất nên biết điều đó.

**③ Đổi nguồn không được gãy giao diện.** Nếu mai này Timeline lấy thêm nguồn
thứ tư — phiếu kiểm QA chẳng hạn — chỉ view đổi, không màn hình nào phải sửa.

`title_key` chứ không phải câu chữ: Điều XXI, view không biết ngôn ngữ.

⚠️ `WITH (security_invoker = true)` **ngay từ lần tạo** — bảy view của
017/020/022 đã rò rỉ thật vì thiếu dòng đó.

### 3.6 Mười thành phần của Aggregate — cái nào ở 029, cái nào sau

Kiến trúc sư vẽ Assignment có mười thành phần con. Bảng dưới đây nói rõ **cái
nào là bảng mới, cái nào chỉ là một cột thêm vào bảng đã có, và cái nào chưa
làm** — để không ai tưởng 029 phủ hết, và cũng không ai quên thứ đã hoãn.

| Thành phần | Cách hiện thực | Ở đâu |
|---|---|---|
| **Commercial Terms** | bảng mới `assignment_commercial_terms` | **029** |
| **Bundle Allocation** | bảng mới `assignment_bundles` | **029** |
| **Daily Reports** | bảng mới `assignment_daily_reports` (sổ cái) | **029** |
| **Timeline** | view `v_assignment_timeline` | **029** |
| **Material Issue** | cột `assignment_id` trên `subcon_issue_logs` (đã có bảng) | **029** |
| **QA Reports** | cột `assignment_id` trên `qa_audit_reports` (đã có bảng) | **029** |
| **Attachments** | dùng lại `md_documents` — nhưng `entity_type` chưa nhận `ASSIGNMENT` | ⏸ **hoãn** — xem dưới |
| **Shipment** | cột `assignment_id` trên `shipments` (đã có bảng) | **029** |
| **Issues** | ⏸ **hoãn** — xem dưới | sau |
| **Settlement** | ⏸ **hoãn** — xem dưới | sau |

**Vì sao hoãn `Issues`.** `assignment_daily_reports` đã có `issue_note` và
`support_request`. Một bảng `assignment_issues` riêng chỉ đáng có khi sự cố cần
**vòng đời riêng** — mở, giao người, theo dõi, đóng — tức là gần giống
`capa_logs` đã có ở migration 023. Dựng trước khi biết nó khác `capa_logs` chỗ
nào là đoán mò (Điều XXIX).

**Vì sao hoãn `Attachments`.** Đo được: `md_documents` **và** `md_comments`
cùng mang ràng buộc của migration 016 —
`CHECK (entity_type IN ('STYLE','ORDER','COSTING','INQUIRY','CUSTOMER','SAMPLE','MILESTONE'))`
— không có `ASSIGNMENT`. Quyết định 6 ưu tiên chuyển sang Master Data thay vì
nới CHECK cứng, nhưng việc đó đổi ràng buộc trên **hai bảng dùng chung của /md**
và kéo theo một hệ quả có thật: mã lỗi đổi từ 23514 sang 23503, mà
`friendlyDbError` đang dịch 23503 thành *"Dữ liệu đang được tham chiếu ở nơi
khác"* — một câu sai hẳn cho ca này.

Đính kèm tài liệu **không chặn** Assignment Domain: chưa có màn hình nào để tải
tệp lên cho tới sau bước 031. Gộp một cuộc đổi ràng buộc trên hai bảng dùng
chung vào 029 là trộn hai rủi ro không liên quan — tách thành migration riêng,
làm cùng lúc dựng màn hình Assignment.

**Vì sao hoãn `Settlement`.** Quyết toán cần cả sản lượng đã nghiệm thu **lẫn**
điều khoản thương mại **lẫn** dữ liệu thanh toán ở `financial_records` — ba
nguồn mà hai trong ba chưa chạy thật (0 dòng và 2 dòng mồ côi). Thiết kế quyết
toán trước khi có một Assignment nào đóng sổ là thiết kế trên giả định.

⚠️ **Sáu cột `assignment_id` thêm vào bảng đã có đều NULLABLE.** Dữ liệu cũ
không thuộc Assignment nào và sẽ **mãi mãi** không thuộc — đó là sự thật lịch
sử, không phải thiếu sót cần lấp. Ép `NOT NULL` là buộc bịa Assignment ngược cho
quá khứ, đúng lỗi `etd_date DEFAULT CURRENT_DATE` của migration 024.

## 4. Bất biến

**I-1** · Assignment thuộc đúng một Partner và đúng một PO.

**I-2** · **Chỉ Monica tạo được Assignment.** Đối tác không bao giờ là
`assigned_by`. Lỗ hổng P0 đã vá ở 026, nay là bất biến miền.

**I-3** · Quyền là **hàm của** Assignment, không phải thuộc tính của đối tác.

**I-4** · Quyền có hạn dùng. Hết `planned_finish` hoặc `CLOSED` thì quyền **tự mất**.

**I-5** · Một bó thuộc tối đa một Assignment **đang hiệu lực**.

**I-6** · Không xoá cứng — Assignment là gốc của mọi vết audit.

**I-7** · Tổng `assigned_qty` vượt `orders.total_quantity` thì **cảnh báo**,
không chặn. Xuất dư 2–5% là bình thường.

**I-8** · Partner loại `BUYER` **không được** có Assignment.
Bảo vệ **ba tầng**: Domain (`isExecutionPartner`) · Service (Zod) · CSDL
(trigger `BEFORE`, chỉ từ chối — đúng phạm vi Điều XXX mục 5).

**I-9** *(mới)* · **Con không sống ngoài cha.** Không thêm báo cáo ngày, không
gắn bó, không sửa điều khoản trên Assignment đã `CLOSED` · `CANCELLED` ·
`REJECTED` hoặc đã xoá mềm. Kiểm ở service **và** ở CSDL.

**I-10** *(mới)* · **Sự kiện không viết lại được.** Sửa báo cáo ngày là ghi bản
mới trỏ `parent_report_id`, không `UPDATE` đè lên bản cũ.

## 5. Buyer đi đường khác

```
Execution Partner:  identity → partner → ASSIGNMENT      → resource scope
Buyer:              identity → partner → customer_id     → order scope
```

Đường của Buyer **đã chạy từ migration 018** (`mos_buyer_can_see_order` +
`buyer_accounts`). Không đụng, không viết lại.

## 6. Vì sao KHÔNG mở rộng `subcon_orders`

- `subcon_orders.vendor_id` → `subcontractors` (UUID), còn
  `financial_records.subcon_id` → `subcons` (TEXT). Assignment xây trên đó chỉ
  phủ được **một nửa** số đối tác thực thi.
- Không có chỗ cho Supplier · Forwarder · Inspection · Auditor.
- Thiếu `accepted_at` — không có mốc *đối tác đã nhận việc chưa*, mà đó là mốc
  pháp lý khi hàng trễ.
- Không có chỗ cho `REJECTED`.

`subcon_orders` **nhận thêm** `assignment_id` và trở thành chứng từ sinh ra từ
Assignment. Không đổi tên, không xoá.
