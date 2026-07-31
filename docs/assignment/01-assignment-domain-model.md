# 01 · ASSIGNMENT DOMAIN MODEL

> **Bản 4** — Assignment là **Aggregate Root** của Manufacturing Execution.
> Sửa theo mười nguyên tắc Kiến trúc ngày 01/08/2026.
>
> Thay đổi so với bản 3: Aggregate Root · trạng thái **REJECTED** ·
> Daily Report là **Business Event** · Commercial Terms hỗ trợ **nhiều phương
> thức tính giá** · Timeline là thành phần **mặc định** · `assignment_bundles`
> là **quan hệ, không phải phạm vi**.
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

start_date         DATE  BẮT BUỘC
end_date           DATE  BẮT BUỘC

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

```
assignment_id · report_date
target_qty · output_qty · defect_qty · rework_qty · downtime_minutes
issue_note · support_request · comment
submitted_by · submitted_at
revision_of  UUID → assignment_daily_reports(id)    ⚠️ sửa = SỰ KIỆN MỚI
superseded_at · superseded_by
UNIQUE (assignment_id, report_date) WHERE superseded_at IS NULL
```

**Sự kiện thì không sửa tại chỗ.** Báo sai sản lượng ngày 06/08 thì ghi một bản
**đính chính** trỏ về bản cũ qua `revision_of`, và bản cũ bị đánh dấu
`superseded_at`. Lịch sử giữ nguyên cả hai.

Vì sao đáng làm: sản lượng ngày là căn cứ **thanh toán**. Cho phép sửa đè lên
nghĩa là cho phép viết lại quá khứ mà không ai biết — cùng lý lẽ đã dùng cho
`capa_logs` (023) và cho việc giữ cả `etd_date` lẫn `atd_date` (024).

⚠️ Chỉ mục duy nhất **có điều kiện** `WHERE superseded_at IS NULL`: một ngày chỉ
có một bản **đang hiệu lực**, nhưng nhiều bản trong lịch sử.

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

```
assignment_id  UUID UNIQUE → assignments(id)
contract_no    VARCHAR

pricing_method VARCHAR NOT NULL
               IN (PER_UNIT, PER_OPERATION, PER_SAM_MINUTE, PER_KG, LUMP_SUM)
rate           NUMERIC        đơn giá theo phương thức trên
lump_sum       NUMERIC        chỉ dùng cho LUMP_SUM
currency       VARCHAR(3) NOT NULL
               IN (VND, USD, EUR, CNY, JPY, KRW)
payment_term   VARCHAR
note           TEXT
```

| Phương thức | `rate` là gì | Dùng khi |
|---|---|---|
| `PER_UNIT` | đồng / sản phẩm | gia công trọn gói (CM) |
| `PER_OPERATION` | đồng / sản phẩm / công đoạn | giao đúng một công đoạn |
| `PER_SAM_MINUTE` | đồng / phút định mức | trả theo `style_operations.sam_minutes` |
| `PER_KG` | đồng / kg | giặt · nhuộm |
| `LUMP_SUM` | *(không dùng)* | khoán trọn gói |

**`pricing_method` tuyên bố tường minh cột nào có hiệu lực** — cùng khuôn
`scope_level`. `CHECK` ép: `LUMP_SUM` thì `lump_sum` bắt buộc và `rate` phải
NULL; bốn phương thức còn lại thì ngược lại.

Không dùng NULL để đoán phương thức. `rate` NULL không có nghĩa "khoán" — nó có
nghĩa dữ liệu thiếu, và `CHECK` sẽ chặn.

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

⚠️ `WITH (security_invoker = true)` **ngay từ lần tạo** — bảy view của
017/020/022 đã rò rỉ thật vì thiếu dòng đó.

## 4. Bất biến

**I-1** · Assignment thuộc đúng một Partner và đúng một PO.

**I-2** · **Chỉ Monica tạo được Assignment.** Đối tác không bao giờ là
`assigned_by`. Lỗ hổng P0 đã vá ở 026, nay là bất biến miền.

**I-3** · Quyền là **hàm của** Assignment, không phải thuộc tính của đối tác.

**I-4** · Quyền có hạn dùng. Hết `end_date` hoặc `CLOSED` thì quyền **tự mất**.

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
mới trỏ `revision_of`, không `UPDATE` đè lên bản cũ.

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
