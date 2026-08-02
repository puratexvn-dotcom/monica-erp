# ADR-008 · TỪ VỰNG VÒNG ĐỜI BÓ BÁN THÀNH PHẨM (`bundle_stage_enum`)

| | |
|---|---|
| **Trạng thái** | ✅ **ĐÃ PHÊ DUYỆT — Architecture Review Board, 02/08/2026** |
| **Quyết định** | **Phương án D — TÁCH TRỤC (Split Axes)** |
| **Ngày soạn** | 02/08/2026 |
| **Ngày sửa** | 02/08/2026 — nâng lên mức quyết định, trình Architecture Review Board |
| **Ngày duyệt** | 02/08/2026 |
| **Phát hiện bởi** | Gieo dữ liệu `S001` Phần B — `ERROR 22P02` |
| **Soạn** | Claude |
| **Người quyết** | Architecture Review Board |
| **Thi hành** | [`docs/analysis/031d-implementation-plan.md`](../analysis/031d-implementation-plan.md) |

> 🔒 **ADR NÀY ĐÃ ĐƯỢC PHÊ DUYỆT VÀ TỪ ĐÂY LÀ BẤT BIẾN** (Hiến pháp IV).
> Không sửa, không ghi đè. Quyết định thay thế phải viết ADR mới và đánh dấu bản
> này *Superseded by ADR-NNN*.

---

## ⚖️ PHÁN QUYẾT CỦA ARCHITECTURE REVIEW BOARD

**Duyệt Phương án D — Tách trục.** Kèm sáu quy tắc kiến trúc ràng buộc mọi thiết
kế về sau:

| # | Quy tắc | Ghi chú thi hành |
|---|---|---|
| **1** | `current_stage` biểu diễn **DUY NHẤT** công đoạn sản xuất vật lý | Enum giữ nguyên `CUT · SEWING · FINISHING · PACKED` |
| **2** | `status` biểu diễn **DUY NHẤT** tình trạng thực thi | Cột đã có tại `005:73` |
| **3** | **KHÔNG** đưa vào các giá trị công đoạn kiểu `CUT_PASSED`, `SEWING_READY` | Mã nguồn và trigger phải bỏ chúng |
| **4** | **KHÔNG** gỡ cột `status` trong ADR này | Giữ nguyên, không đụng |
| **5** | Ghi nhận **TD-02** và **TD-03** ở sổ riêng | → [`docs/TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) |
| **6** | Chuẩn bị thi hành `031d` trên nền kiến trúc đã duyệt | → [kế hoạch thi hành](../analysis/031d-implementation-plan.md) |

**Không được thêm thay đổi thiết kế nào ngoài phạm vi trên.**

### Ba câu hỏi mở ở §7 — đã được Board chốt

| Câu hỏi §7 | Phán quyết |
|---|---|
| ① `CUT_PASSED` có phải trạng thái nghiệp vụ thật? | **KHÔNG.** Quy tắc 3 loại bỏ nó. Không có cổng QC riêng cho khâu cắt |
| ② Bó ở xưởng ngoài thì `current_stage` giữ nguyên hay tiến lên? | **GIỮ NGUYÊN** — hệ quả trực tiếp của Quy tắc 1: đi gia công đổi **custody**, không đổi **công đoạn sản xuất vật lý** |
| ③ Cột `status` có được dùng thật không? | **CÓ, và giữ lại.** Quy tắc 2 + Quy tắc 4 định nghĩa lại nó là trục tình trạng thực thi. Việc nó chưa được `app/` đọc là **nợ tích hợp (TD-02)**, không phải cớ để gỡ |

### Ba trục sau phán quyết — chuẩn ràng buộc

```
current_stage   ENUM 4 giá trị    CÔNG ĐOẠN sản xuất vật lý      (Quy tắc 1)
status          VARCHAR           TÌNH TRẠNG thực thi            (Quy tắc 2, 4)
custody         trục MỚI          BÓ ĐANG Ở ĐÂU, thuộc đơn nào   (Phương án D)
```

Ba trục **trực giao**. Không trục nào được mang giá trị thuộc trục khác — đó
chính là nguyên nhân gốc mà ADR này sinh ra để dẹp (§3.2).

> ⚠️ **Bản này THAY ĐỔI KHUYẾN NGHỊ so với bản nháp ngày 02/08.** Bản nháp đề
> xuất **Phương án A** (mở rộng enum thành 7 giá trị). Rà soát sâu hơn phát hiện
> **hai sự thật mà bản nháp bỏ sót** (xem §2.4 và §2.5), và cả hai đều làm A trở
> thành phương án tệ hơn nó thoạt trông. Khuyến nghị mới: **Phương án D**.
>
> Bản nháp không bị xoá — nó nằm trong lịch sử git (`d21f0ad`..`97f94c4`). Lý do
> của một khuyến nghị bị thay vẫn là thông tin có giá trị.

---

## 0. TUYÊN BỐ NỀN TẢNG — GHI THEO QUYẾT ĐỊNH 02/08/2026

> **Assignment là Aggregate Root DUY NHẤT cho Permission, Scope và Ownership.**
> Nó là **Security Boundary duy nhất** của toàn bộ External Collaboration.
> — Kiến trúc sư trưởng

### Hệ quả bắt buộc

**① Mọi RLS của cộng tác bên ngoài phân quyền theo `assignment_id`.**
Không theo `vendor_id`, không theo `partner_id` rời rạc, không theo vai trò.

**② `vendor_id` chỉ là Business Attribute, KHÔNG phải ranh giới phân quyền.**
Nó mô tả *ai làm việc đó*, không quyết định *ai được nhìn thấy nó*.

**③ Bất biến I-11 · Commercial Ownership Integrity.**
`subcon_orders.vendor_id` **phải khớp** với `Assignment.partner_id`. Không khớp
thì **từ chối ở CẢ tầng Domain LẪN tầng CSDL**.

*(Ba điều trên đã được thi hành bằng migration `040` và `031c3`, nghiệm thu
02/08/2026 — 32/32 phép kiểm sống đạt. Chúng là **tiền đề** của ADR này, không
phải nội dung cần quyết ở đây.)*

---

## 1. CONTEXT — BỐI CẢNH

### 1.1 Vấn đề cần quyết

Ba giá trị trạng thái — `CUT_PASSED`, `SEWING_READY`, `OUTSIDE_PROCESSING` —
được **trigger CSDL và mã nguồn sử dụng từ migration `009`**, nhưng **chưa bao
giờ tồn tại** trong kiểu `bundle_stage_enum`.

Hệ quả: **toàn bộ luồng xuất–nhận hàng gia công chưa từng chạy được một lần
nào** kể từ khi nó được viết.

Đây **không phải lỗi kỹ thuật để vá nhanh.** Nó là câu hỏi về **từ vựng
Domain**: *vòng đời của một bó bán thành phẩm gồm những trạng thái nào, và
trạng thái đó nói về cái gì?* Hiến pháp Điều IV và Playbook XXXIII cấm viết SQL
trước khi câu hỏi này được chốt.

### 1.2 Vì sao nó chặn đường tới hết

```
ADR-008 chưa duyệt
      ↓
S001 Phần B không gieo được subcon_issue_logs · subcon_receipt_logs
      ↓
hai bảng rỗng ⇒ Hiến pháp V.1 CẤM kết luận về quyền trên chúng
      ↓
không viết được 031d (viết policy trên phỏng đoán = đúng sai lầm đã tạo ra
bản nháp 031 bị chạy nhầm)
      ↓
điều kiện gỡ SECURITY FREEZE số 1 và số 2 vĩnh viễn không đạt
```

Đây là **nút thắt đơn** của toàn bộ lộ trình còn lại. Không có đường vòng.

---

## 2. CURRENT PRODUCTION EVIDENCE — BẰNG CHỨNG TRÊN HỆ THỐNG ĐANG CHẠY

> Mọi số dưới đây **đo được**, không phải nhận định. Nguồn: bộ kiểm sống chạy
> 02/08/2026 trên CSDL thật, và đọc trực tiếp mã nguồn tại `97f94c4`.

### 2.1 Lỗi nguyên văn

```
ERROR: 22P02: invalid input value for enum bundle_stage_enum: "OUTSIDE_PROCESSING"
CONTEXT: PL/pgSQL function fn_process_subcon_issue() line 4
```

Giao dịch **rollback toàn phần** — CSDL không đổi một dòng. Đối chiếu sau lỗi:
`assignments` 2 · `subcon_*` 0/0/0 · sổ cái 1 · `cut_bundles` 3.

### 2.2 Từ vựng: định nghĩa ở một nơi, sử dụng ở nơi khác

| Nguồn | Từ vựng dùng | Có trong enum? |
|---|---|---|
| `007b:9` — **định nghĩa enum** | `CUT` · `SEWING` · `FINISHING` · `PACKED` | — *(đây là chuẩn)* |
| `009:84` — trigger xuất gia công | `OUTSIDE_PROCESSING` | ❌ **không** |
| `009:125` — trigger thu hồi | `SEWING_READY` | ❌ **không** |
| `subcon/actions.ts:45` — lọc bó chờ xuất | `CUT_PASSED` · `SEWING_READY` | ❌ **không** |
| `subcon/actions.ts:63` — lọc bó đang ở ngoài | `OUTSIDE_PROCESSING` | ❌ **không** |

### 2.3 Hệ quả đang sống, đã xác nhận

| Hệ quả | Trạng thái |
|---|---|
| `INSERT` vào `subcon_issue_logs` | **bất khả thi từ `009`** — trigger `AFTER INSERT` luôn ném `22P02` |
| `fn_process_subcon_receipt` | sẽ đổ cùng cách vì `SEWING_READY` |
| Màn hình `/subcon` | **luôn rỗng** — lọc theo ba giá trị không tồn tại |
| `subcon_issue_logs` · `subcon_receipt_logs` | **0 dòng**, xác nhận lại hôm nay |

> **Toàn bộ phân hệ `/subcon` chưa từng chạy.** Nó phải được đối xử như một
> phân hệ **mới**, không phải một phân hệ đang vận hành.

### 2.4 ⚠️ SỰ THẬT THỨ NHẤT BẢN NHÁP BỎ SÓT — cái bẫy ngõ cụt im lặng

Bản nháp khẳng định *(dòng 156)*: thêm giá trị **không** làm hỏng phép kiểm ở
`007b:126`. Điều đó **đúng** — nhưng nó soi nhầm dòng. Dòng nguy hiểm là
`007b:102`:

```sql
-- fn_auto_advance_bundle_stage (007b:96-106)
UPDATE public.cut_bundles
   SET current_stage = 'FINISHING'
 WHERE id = NEW.bundle_id AND current_stage IN ('CUT', 'SEWING');   -- ⚠️
```

Nếu duyệt **Phương án A**, chuỗi sự kiện thật sẽ là:

```
bó xuất đi gia công   → 009:84  đặt current_stage = 'OUTSIDE_PROCESSING'
bó thu hồi về         → 009:125 đặt current_stage = 'SEWING_READY'
Final QC đạt          → 007b:102 KHÔNG khớp ('SEWING_READY' ∉ CUT, SEWING)
                                  ⇒ bó KHÔNG BAO GIỜ lên 'FINISHING'
đóng thùng            → 007b:126 chặn vì stage NOT IN ('FINISHING','PACKED')
                                  ⇒ RAISE STRICT_PACKING_ERROR
```

**Mọi bó từng đi gia công sẽ không bao giờ đóng thùng được.** Không có ngoại lệ
nào nổ ra ở bước gây lỗi; nó chỉ lộ ra ở bước đóng thùng, cách đó nhiều ngày và
nhiều màn hình. Đây đúng loại lỗi tệ nhất: **im lặng, trễ, và ở xa nguyên nhân.**

Nghĩa là: **Phương án A KHÔNG phải "chỉ thêm 3 giá trị".** Nó bắt buộc phải sửa
thêm `fn_auto_advance_bundle_stage`. Bản nháp trình bày A như phương án
"giữ nguyên trigger và mã nguồn" — điều đó **không đúng**.

### 2.5 ⚠️ SỰ THẬT THỨ HAI BẢN NHÁP BỎ SÓT — lược đồ ĐÃ có hai trục

`cut_bundles` **đã có sẵn một cột trạng thái thứ hai**, từ migration `005`:

```sql
-- 005:73
status VARCHAR(50) DEFAULT 'READY',   -- READY, ISSUED_TO_SEWING, COMPLETED
```

Và `S001` gieo bó nền bằng **cả hai cột, mỗi cột một trục** (`S001:169`):

```sql
current_stage = 'SEWING'   -- công đoạn: đang ở khâu may
status        = 'READY'    -- tình trạng: sẵn sàng
```

Soi lại ba giá trị bịa ra dưới ánh sáng đó, **mỗi giá trị đều là phép nhồi một
trục thứ hai vào cột công đoạn**:

| Giá trị bịa ra | = công đoạn | × trục thứ hai bị nhồi vào |
|---|---|---|
| `CUT_PASSED` | `CUT` | **phán quyết chất lượng** (đã qua QC cắt) |
| `SEWING_READY` | `SEWING` | **tình trạng sẵn sàng** — *đã có cột `status` cho việc này* |
| `OUTSIDE_PROCESSING` | *(giữ nguyên công đoạn đang dở)* | **nơi giữ hàng / quyền coi giữ** (custody) |

Đây là bằng chứng mạnh nhất trong toàn bộ hồ sơ, và nó đổi hẳn bản chất câu
hỏi: **không phải "enum thiếu mấy giá trị", mà là "một cột đang bị bắt gánh ba
trục độc lập".**

### 2.6 Vì sao lỗi sống sót qua mọi vòng rà soát

Ba bảng `subcon_*` **rỗng**. Bảng rỗng thì không ai audit; không ai audit thì
không ai chạm vào lỗi khiến bảng rỗng.

**Bảng rỗng vì hỏng, và không bị phát hiện vì rỗng.** Vòng tròn khép kín.

Lỗi nằm im từ `009` tới `038c` — qua mọi lần rà bảo mật — và chỉ lộ ra đúng lúc
có người **cố gieo một dòng thật vào**. Đây là ca điển hình của **Hiến pháp
V.1**, và là lý do điều khoản đó tồn tại.

---

## 3. ROOT CAUSE — NGUYÊN NHÂN GỐC

### 3.1 Nguyên nhân bề mặt *(đúng, nhưng chưa đủ sâu)*

Hai migration nói hai thứ tiếng: `007b` định nghĩa enum bốn giá trị, `009` viết
trigger dùng ba giá trị khác, và **không có gì bắt hai bên phải khớp nhau**.
`009` không tham chiếu enum, PostgreSQL chỉ kiểm khi có dòng thật chạy qua — mà
chưa bao giờ có dòng nào.

### 3.2 Nguyên nhân gốc thật sự

> **Một cột được thiết kế cho MỘT trục, rồi bị yêu cầu gánh BA trục độc lập.**

`current_stage` trả lời *"bó đang ở công đoạn nào của quy trình"* — một trục
tuyến tính: `CUT → SEWING → FINISHING → PACKED`.

Nhưng nghiệp vụ gia công ngoài đặt thêm hai câu hỏi **trực giao** với trục đó:

- *"Bó đang nằm ở đâu — trong nhà máy hay ở xưởng ngoài?"* → **custody**
- *"Bó đã sẵn sàng đi tiếp chưa?"* → **status** *(đã có cột riêng!)*

Người viết `009` gặp đúng nhu cầu vận hành có thật — ghi chú `009:81` nói rõ:
*"Chặn Chuyền may quét nhầm"* — và giải quyết nó bằng cách **bịa thêm giá trị
cho cột sẵn có**, thay vì thêm một trục. Đó là con đường ít trở lực nhất, và nó
là gốc của mọi thứ đang hỏng.

### 3.3 Vì sao phân biệt này quan trọng, không phải chẻ chữ

Nếu chẩn đoán là *"enum thiếu giá trị"* thì lời giải là **thêm giá trị** — và
ta sẽ lặp lại chính lỗi này ở lần sau. Ngày mai có `WASHING_OFFSITE`,
`EMBROIDERY_OFFSITE`, `REWORK_AT_SUBCON`; mỗi cái lại là một giá trị enum mới,
và **`ALTER TYPE ... ADD VALUE` không hoàn tác được** — mỗi lần là một cửa một
chiều nữa.

Nếu chẩn đoán là *"một cột gánh ba trục"* thì lời giải là **tách trục**, và số
giá trị enum **ngừng tăng vĩnh viễn**.

---

## 4. ALTERNATIVES CONSIDERED — CÁC PHƯƠNG ÁN ĐÃ CÂN NHẮC

### Phương án A — Mở rộng enum thành 7 giá trị

Thêm `CUT_PASSED`, `SEWING_READY`, `OUTSIDE_PROCESSING` vào `bundle_stage_enum`.

- **Được:** từ vựng khớp ngay với trigger `009` và mã `/subcon` hiện có.
- **Mất:**
  - **3 thao tác một chiều** (`ADD VALUE` không có `DROP VALUE`).
  - **Bắt buộc vẫn phải sửa `fn_auto_advance_bundle_stage`** (§2.4) — nếu không
    là ngõ cụt im lặng. Lợi thế "không đụng trigger" **không tồn tại**.
  - Phải sửa thêm `hoan-thanh/page.tsx:102` (`IN ('SEWING','CUT')`), nếu không
    bó ở `SEWING_READY`/`CUT_PASSED` **biến mất khỏi màn hình Hoàn thành** — một
    module **đang chạy thật**.
  - Đóng đinh vĩnh viễn việc trộn ba trục vào một cột.
  - Số giá trị sẽ tiếp tục tăng theo mỗi loại dịch vụ thuê ngoài mới.

### Phương án B — Chỉ thêm `OUTSIDE_PROCESSING` (enum 5 giá trị)

Quy `CUT_PASSED` → `CUT` và `SEWING_READY` → `SEWING` trong trigger và mã nguồn.

- **Được:** chỉ **một** thao tác một chiều; enum gọn.
- **Mất:**
  - Vẫn trộn trục custody vào cột công đoạn — gốc bệnh còn nguyên.
  - **Mất thông tin công đoạn khi bó ra ngoài:** một bó đang dở khâu may, xuất
    đi giặt, thì `current_stage` bị ghi đè thành `OUTSIDE_PROCESSING` — hệ thống
    **quên mất nó đang ở khâu nào**. Lúc thu hồi, `009:125` đoán bừa là `SEWING`.
    Với bó xuất đi từ khâu `FINISHING` thì đó là **ghi lùi trạng thái**.
  - Vẫn phải sửa `fn_auto_advance_bundle_stage` (bó về sẽ mang `SEWING`, may mắn
    khớp — nhưng chỉ đúng ngẫu nhiên, không phải do thiết kế).

### Phương án C — Không đổi enum, viết lại `/subcon` theo 4 giá trị cũ

- **Được:** không đụng lược đồ; không thao tác một chiều nào.
- **Mất:** **bó đang ở xưởng ngoài không phân biệt được với bó đang trên chuyền.**
  Đây đúng là rủi ro vận hành mà `009:81` cố ngăn: chuyền may quét trúng một bó
  **không có mặt trong nhà máy**, ghi sản lượng cho hàng không tồn tại.
  → **Đánh đổi an toàn vận hành lấy sự gọn gàng của lược đồ. Khuyến nghị loại.**

### Phương án D — Tách trục *(khuyến nghị)*

Giữ `bundle_stage_enum` **nguyên bốn giá trị**. Bổ sung **một trục custody riêng**
trên `cut_bundles`:

```
current_stage   ENUM 4 giá trị   — công đoạn        (KHÔNG ĐỔI)
status          VARCHAR          — tình trạng       (ĐÃ CÓ, 005:73)
custody         cột MỚI          — bó đang ở đâu, thuộc đơn gia công nào
```

- **Được:**
  - **Không một thao tác một chiều nào.** Thêm cột **hoàn tác được** bằng
    `DROP COLUMN`; thêm giá trị enum thì không.
  - **Blast radius bằng không trên module đang chạy.** Enum không đổi ⇒
    `hoan-thanh` (`page.tsx:102`, `actions.ts:104`), `007b:102`, `007b:126` đều
    **chạy nguyên không sửa một chữ**.
  - **Giữ được công đoạn khi bó ra ngoài** — trả lời được *"bó này đang ở xưởng
    giặt, và nó đang dở khâu may"*, điều A và B đều không làm được.
  - Truy vấn *"những bó nào đang ở ngoài, thuộc đơn gia công nào"* thành một
    phép lọc thẳng trên `cut_bundles`, không cần join `subcon_issue_logs`.
  - Đúng Hiến pháp XI (Forward Compatible): thêm loại dịch vụ thuê ngoài mới
    **không cần migration nào nữa**.
  - `SEWING_READY` được diễn đạt bằng thứ đã có: `current_stage='SEWING'` +
    `status='READY'` — đúng như `S001:169` đang làm.
- **Mất:**
  - Phải sửa `fn_process_subcon_issue`, `fn_process_subcon_receipt` và
    `subcon/actions.ts` — nhưng **cả ba đều phải sửa dưới mọi phương án khác
    trừ A**, và chúng **chưa từng chạy** nên không có hành vi production nào để
    bảo toàn.
  - Cần một ràng buộc mới chặn "quét bó đang ở ngoài lên chuyền" — dưới A/B việc
    này miễn phí nhờ giá trị enum; dưới D phải viết tường minh.
  - Phạm vi ban đầu lớn hơn A khoảng một migration.

### Phương án E — Bỏ enum, chuyển sang bảng tra cứu (UDMD)

Theo tiền lệ **ADR-005**: vốn từ trở thành **dữ liệu**, thêm trạng thái không
cần migration, kèm `name_translations JSONB` cho nhãn tiếng Việt.

- **Được:** linh hoạt tối đa; thống nhất với hướng đã chọn cho `defect_catalog`
  và `contract_types`.
- **Mất:**
  - Mất kiểm kiểu ở tầng CSDL — enum sai thì `22P02` ngay, khoá ngoại tới bảng
    tra cứu thì sai chính tả vẫn lọt tới lúc chạy.
  - Migration lớn: đổi kiểu cột, chuyển 3 dòng, viết lại mọi truy vấn.
  - **Vòng đời công đoạn KHÔNG phải danh mục do nghiệp vụ tự khai.** ADR-005 áp
    dụng cho **User-Defined Master Data** — mã lỗi, loại hợp đồng, thứ người vận
    hành tạo ra ngày mai. `CUT → SEWING → FINISHING → PACKED` là **hằng số của
    quy trình sản xuất**, không phải danh mục mở.
  - → Vi phạm Playbook **XXIX** (chống phức tạp hoá): *"hôm nay KHÔNG có nó thì
    hỏng chuyện gì?"* — Không hỏng gì cả. **Khuyến nghị loại.**

---

## 5. TRADE-OFF ANALYSIS — PHÂN TÍCH ĐÁNH ĐỔI

### 5.1 Ma trận so sánh

| Tiêu chí | **A** (enum 7) | **B** (enum 5) | **C** (giữ 4) | **D** (tách trục) | **E** (UDMD) |
|---|---|---|---|---|---|
| Thao tác **một chiều** | 🔴 3 | 🟡 1 | 🟢 0 | 🟢 **0** | 🔴 đổi kiểu cột |
| Chặn được "quét nhầm bó ở ngoài" | 🟢 có | 🟢 có | 🔴 **không** | 🟢 có *(cần viết)* | 🟢 có |
| Giữ công đoạn khi bó ra ngoài | 🔴 không | 🔴 không | 🔴 không | 🟢 **có** | 🔴 không |
| Đụng module **đang chạy** (`/hoan-thanh`) | 🔴 **có** | 🟡 có | 🟢 không | 🟢 **không** | 🔴 có |
| Rủi ro **ngõ cụt im lặng** (§2.4) | 🔴 **cao** | 🟡 trung bình | 🟢 không | 🟢 **không** | 🟡 trung bình |
| Sửa đúng nguyên nhân gốc | 🔴 không | 🔴 không | 🔴 không | 🟢 **có** | 🟡 một phần |
| Enum phình theo dịch vụ mới | 🔴 có | 🔴 có | — | 🟢 **không** | 🟢 không |
| Kiểm kiểu ở tầng CSDL | 🟢 có | 🟢 có | 🟢 có | 🟢 **có** | 🔴 mất |
| Phạm vi thay đổi ban đầu | 🟡 vừa | 🟡 vừa | 🔴 lớn | 🟡 **vừa–lớn** | 🔴 rất lớn |
| Thời gian tới khi `031d` chạy được | 🟢 nhanh | 🟢 nhanh | 🔴 chậm | 🟡 **+1 migration** | 🔴 chậm nhất |

### 5.2 Ba đánh đổi quyết định

**① Một chiều đấu với hoàn tác được.** A trả giá bằng ba cửa một chiều để tiết
kiệm một migration. Hiến pháp XXVIII.4 và XI đặt khả năng tiến hoá lên trên tốc
độ. Khi hai phương án cùng giải quyết được vấn đề mà một cái hoàn tác được, còn
cái kia thì không, **gánh nặng chứng minh thuộc về cái không hoàn tác được** —
và ở đây nó không chứng minh được lợi thế nào còn đứng vững sau §2.4.

**② "Nhanh hơn" của A là ảo.** Lợi thế duy nhất của A là *"không phải sửa
trigger và mã nguồn"*. §2.4 cho thấy **điều đó sai**: A vẫn buộc phải sửa
`fn_auto_advance_bundle_stage`, và thêm cả `hoan-thanh/page.tsx` — một module
**đang chạy thật**. D thì không đụng `/hoan-thanh` một chữ nào. Sau khi trừ đi
phần việc A thực sự phải làm, khoảng cách phạm vi giữa A và D còn rất mỏng.

**③ Không có hành vi production nào để bảo toàn.** Lập luận mạnh nhất cho A
thường là *"đừng đụng thứ đang chạy"*. Ở đây `subcon_issue_logs` và
`subcon_receipt_logs` **có 0 dòng**, và `/subcon` **chưa từng chạy**. Ta không
di trú một hệ thống đang vận hành — ta đang **hoàn thành một hệ thống chưa bao
giờ hoàn thành**. Trong tình huống đó, chọn cách vá vốn từ để né việc viết lại
là **trả giá vĩnh viễn cho một khoản tiết kiệm không có thật**.

### 5.3 Điều phương án khuyến nghị KHÔNG giải quyết

Nói rõ để Board không kỳ vọng nhầm:

- **Không** trả lời `CUT_PASSED` có phải một phán quyết QC riêng hay không
  (§7 — câu hỏi mở ①).
- **Không** sửa việc `cut_bundles.status` là `VARCHAR` tự do không `CHECK` —
  vi phạm Playbook XXVIII.2 đã có từ `005`. Ghi nhận là **TD-02**, không mở rộng
  phạm vi ADR này.
- **Không** kiểm thử phân hệ `/subcon`. Nó chưa từng chạy, nên phải nghiệm thu
  như một phân hệ mới — một hạng mục riêng, sau khi ADR này được thi hành.

---

## 6. FINAL RECOMMENDATION — KHUYẾN NGHỊ

> ## ✅ Đề xuất Board duyệt **PHƯƠNG ÁN D — TÁCH TRỤC**

**Lý do rút gọn thành ba câu:**

1. Nó là phương án duy nhất **không có thao tác một chiều nào**, trong khi vấn
   đề nó giải quyết là vĩnh viễn.
2. Nó là phương án duy nhất **không đụng vào module đang chạy** (`/hoan-thanh`),
   vì `bundle_stage_enum` giữ nguyên bốn giá trị.
3. Nó sửa **nguyên nhân gốc** (một cột gánh ba trục) chứ không sửa triệu chứng,
   nên số giá trị enum ngừng tăng vĩnh viễn thay vì tăng theo mỗi loại dịch vụ
   thuê ngoài mới.

### 6.1 Phạm vi thi hành nếu được duyệt

**Không có SQL nào trong tài liệu này.** Đây là mô tả phạm vi để Board đánh giá
khối lượng, không phải thiết kế migration. Migration Design Review là bước sau.

| # | Hạng mục | Ghi chú |
|---|---|---|
| 1 | Migration `039` — thêm trục custody trên `cut_bundles` | cột mới + chỉ mục; **không** `ALTER TYPE` |
| 2 | Ràng buộc chặn ghi sản lượng cho bó đang ở ngoài | thay cho thứ A/B có miễn phí nhờ giá trị enum |
| 3 | Viết lại `fn_process_subcon_issue` · `fn_process_subcon_receipt` | đặt/gỡ custody thay vì ghi đè `current_stage` |
| 4 | Sửa `subcon/actions.ts:45,63` | lọc theo custody, không lọc theo giá trị enum không tồn tại |
| 5 | Nhãn tiếng Việt cho trạng thái custody | Playbook XXI · ràng buộc giao diện số 4 |
| 6 | Chạy lại `S001` → Phần B gieo trọn vẹn | mở khoá hai bảng đang rỗng |
| 7 | Nghiệm thu `/subcon` **như một phân hệ mới** | nó chưa từng chạy |
| 8 | Cập nhật `RLS_COVERAGE_MATRIX` · `DOMAIN_GLOSSARY` | thêm mục "custody" vào từ vựng |
| 9 | **Rồi mới** bắt đầu `031d` | đúng chu trình Hiến pháp XI.1 |

### 6.2 Điều kiện chấp nhận

- `S001` Phần B chạy trọn, `subcon_issue_logs` và `subcon_receipt_logs` **> 0 dòng**.
- Một bó **đi gia công rồi về** phải **đóng thùng được** — phép kiểm bịt đúng
  cái bẫy §2.4, và phải có trong bộ hồi quy vĩnh viễn.
- Bó đang ở ngoài **không ghi được sản lượng chuyền** — phép kiểm giữ đúng ý đồ
  gốc của `009:81`.
- `/hoan-thanh` **không đổi hành vi**: bộ kiểm hiện có vẫn xanh, không sửa một
  dòng nào của module đó.
- Mỗi phép kiểm phải có **ít nhất một vai chờ thấy > 0** (Playbook K-3).

---

## 7. CÂU HỎI CẦN BOARD CHỐT — ✅ ĐÃ ĐƯỢC CHỐT 02/08/2026

> **Cả ba câu đã có phán quyết** — xem bảng ở đầu tài liệu. Giữ nguyên văn câu
> hỏi bên dưới để người đọc sau thấy được **điều gì đã từng chưa biết**, và
> quyết định đã được đưa ra trên nền thông tin nào.

Ba câu này **quyết định thiết kế chi tiết**, và tôi **không tự trả lời**:

**① `CUT_PASSED` có phải một trạng thái nghiệp vụ thật không?**
Nếu *có* — "đã qua QC cắt, đủ điều kiện đi tiếp" là một phán quyết chất lượng
riêng — thì nó thuộc **trục thứ tư**, không phải công đoạn, và cần quyết xem
biểu diễn ở đâu. Nếu *không* — mã nguồn chỉ viết nhầm tên `CUT` — thì bỏ.
*Nghiêng về: không. `007b` chưa từng có nó, và không tài liệu nào mô tả một
cổng QC riêng cho khâu cắt.*

**② Khi bó ở xưởng ngoài, `current_stage` giữ nguyên công đoạn cũ hay tiến lên?**
Ví dụ: bó dở khâu may, xuất đi giặt. Lúc ở xưởng giặt, nó là `SEWING` (giữ
nguyên) hay một công đoạn khác? *Nghiêng về: giữ nguyên — custody đổi, công
đoạn không đổi. Đó chính là điều D làm được mà A/B không.*

**③ Cột `cut_bundles.status` (`READY · ISSUED_TO_SEWING · COMPLETED`) có đang
được nghiệp vụ dùng thật không?**
Nó tồn tại từ `005`, `S001` ghi `'READY'`, nhưng tôi **không tìm thấy nơi nào
trong `app/` đọc nó**. Nếu nó là cột chết thì nên gộp vào thiết kế D thay vì để
song song thêm một trục nữa. **Cần người hiểu vận hành xác nhận, không suy từ
mã nguồn được.**

---

## 8. ROLLBACK IMPACT — ẢNH HƯỞNG KHI QUAY LUI

### 8.1 Nếu duyệt D *(khuyến nghị)*

| Thành phần | Hoàn tác được? | Cách |
|---|---|---|
| Cột custody mới | 🟢 **có** | `DROP COLUMN` — sạch, không để lại type mồ côi |
| Chỉ mục | 🟢 có | `DROP INDEX` |
| Ràng buộc chặn quét nhầm | 🟢 có | `DROP TRIGGER` / `DROP CONSTRAINT` |
| `fn_process_subcon_*` viết lại | 🟢 có | `CREATE OR REPLACE` về bản cũ |
| `subcon/actions.ts` | 🟢 có | revert git |
| **`bundle_stage_enum`** | 🟢 **không đụng tới** | — |

**Quay lui D đưa hệ thống về đúng trạng thái hôm nay** — tức `/subcon` hỏng như
cũ. Mất mát: công sức, không phải dữ liệu. Không cần migration bù.

⚠️ Ngoại lệ duy nhất: dữ liệu custody đã ghi sẽ mất khi `DROP COLUMN`. Nhưng
lịch sử xuất–nhận vẫn còn nguyên ở `subcon_issue_logs`/`subcon_receipt_logs` —
custody chỉ là **trạng thái dẫn xuất hiện thời**, không phải nguồn sự thật.
*(Hiến pháp III: không lưu thứ tính được — cần Migration Design Review xem xét
liệu custody có nên là VIEW thay vì cột.)*

### 8.2 Nếu duyệt A hoặc B *(để đối chiếu)*

⚠️ **`ALTER TYPE ... ADD VALUE` KHÔNG hoàn tác được.** PostgreSQL không có
`DROP VALUE`. Gỡ một giá trị enum đòi **Expand → Migrate → Contract** đầy đủ:
tạo type mới, chuyển cột, đổi mọi hàm tham chiếu, xoá type cũ. Đó là quy mô
`035a/b/c` — ba migration cho một lần đổi ý.

Giảm nhẹ: thêm giá trị **không làm hỏng dữ liệu đang có** — 3 dòng `cut_bundles`
hiện tại giữ nguyên `current_stage='SEWING'` và `status='READY'` của chúng.

> *Đính chính bản nháp:* bản nháp ghi các bó "giữ nguyên `SEWING`/`READY`" như
> thể đó là hai giá trị của cùng một cột. Không phải — `SEWING` là
> `current_stage`, `READY` là `status`. **Chính sự nhầm lẫn đó là triệu chứng
> thu nhỏ của toàn bộ vấn đề trong ADR này.**

### 8.3 Nếu KHÔNG quyết gì

`/subcon` hỏng vĩnh viễn · hai bảng vĩnh viễn rỗng · `031d`→`031g` không viết
được · **SECURITY FREEZE không bao giờ gỡ được**. Đây là lựa chọn tệ nhất trong
mọi lựa chọn, kể cả so với phương án C mà tôi khuyến nghị loại.

---

## 9. FUTURE IMPACT — ẢNH HƯỞNG DÀI HẠN

### 9.1 Mở khoá ngay

```
ADR-008 duyệt → S001 Phần B trọn vẹn → 2 bảng hết rỗng → ĐO ĐƯỢC
              → 031d → 031e → 031f → 031g → A001/A002
              → matrix hết ⚪ → Kiến trúc sư xác nhận → GỠ SECURITY FREEZE
```

Đây là **điều kiện cần** của toàn bộ nhánh còn lại. Không có nó, sáu hạng mục
sau đứng im vô thời hạn.

### 9.2 Ảnh hưởng tới thiết kế về sau

**Nếu duyệt D**, ta thiết lập một tiền lệ có thể viện dẫn:

> **Khi một trạng thái mới không nằm trên trục của cột hiện có, thêm TRỤC —
> đừng thêm GIÁ TRỊ.**

Nó áp thẳng vào những thứ đã thấy trước ở lộ trình: giặt · in thêu · gia công
lại tại nhà thầu · hàng gửi kho ngoài · hàng đang trên đường vận chuyển. Dưới
A, **mỗi cái là một cửa một chiều nữa**. Dưới D, tất cả dùng chung một trục
custody và **không cần migration nào**.

Nó cũng khớp hướng Hiến pháp XI đã chọn ở ADR-005: một cột `JSONB` thay hai cột
cứng, để *"thêm ngôn ngữ thứ tư không cần migration"*. Cùng một tư duy, áp cho
trạng thái thay vì cho ngôn ngữ.

### 9.3 Nợ kỹ thuật ghi nhận

| ID | Nội dung | Trạng thái |
|---|---|---|
| **TD-02** *(mới)* | `cut_bundles.status` là `VARCHAR(50)` tự do cho một tập hữu hạn — vi phạm Playbook XXVIII.2, tồn tại từ `005` | ghi nhận, **ngoài phạm vi** ADR này |
| **TD-03** *(mới)* | Không có phép kiểm nào bắt "trigger dùng giá trị enum không tồn tại". Lỗi này sống 30 migration vì **không ai hỏi câu đó**. Nên có một mục trong `A002` hoặc `tests/architecture` đối chiếu mọi chuỗi gán `current_stage` với `pg_enum` | **đề nghị làm ngay sau**, độc lập với lựa chọn A/B/C/D |

> ✅ **Board Quy tắc 5 — đã thi hành.** Cả hai nợ được ghi vào sổ riêng
> [`docs/TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md), cùng **TD-01** kế thừa từ
> Enterprise Audit `d21f0ad`. Bảng trên giữ nguyên làm nơi phát hiện; sổ nợ mới
> là nơi theo dõi.

> **TD-03 là bài học đắt nhất của hồ sơ này.** Bất kể Board chọn phương án nào,
> thứ đã để lỗi sống sót 30 migration không phải sự bất cẩn — mà là **không tồn
> tại một phép thử chứng minh vốn từ trong mã khớp với vốn từ trong CSDL**.
> Chọn xong phương án mà không dựng phép thử đó thì lần sau vẫn vậy.

### 9.4 Rủi ro còn lại sau khi thi hành D

- `/subcon` **chưa từng chạy** ⇒ nghiệm thu nó sẽ lộ thêm lỗi khác. Phải dự
  trù, không được coi ADR này là "xong `/subcon`".
- Trục custody sẽ **giao với RLS** ở `031d`: bó đang ở xưởng ngoài thì nhà thầu
  đó thấy được — nhưng phạm vi vẫn phải quyết theo `assignment_id` (§0 ①), không
  theo custody. **Custody là thuộc tính vận hành, không phải ranh giới phân
  quyền** — đúng cùng bài học của I-11 với `vendor_id`.

---

## 10. REFERENCES

**Mã nguồn — đã đọc và đối chiếu tại `97f94c4`**

- `supabase/migrations/005_cutting_schema.sql:63-75` — `cut_bundles`, cột `status`
- `supabase/migrations/007b_architecture_refactor.sql:9` — định nghĩa enum
- `supabase/migrations/007b_architecture_refactor.sql:96-106` — `fn_auto_advance_bundle_stage` **(cái bẫy §2.4)**
- `supabase/migrations/007b_architecture_refactor.sql:115-136` — `fn_validate_carton_packing_stage`
- `supabase/migrations/009_subcontracting_schema.sql:78-102` — `fn_process_subcon_issue`
- `supabase/migrations/009_subcontracting_schema.sql:106-134` — `fn_process_subcon_receipt`
- `app/(dashboard)/subcon/actions.ts:45,63` — ba giá trị không tồn tại
- `app/(dashboard)/hoan-thanh/page.tsx:102` · `actions.ts:104` — module đang chạy
- `supabase/seeds/S001_business_baseline.sql:169` — hai trục, hai cột
- `supabase/seeds/S001_business_baseline.sql:387-428` — nơi lỗi lộ ra

**Quy phạm**

- Hiến pháp **III** — một Source of Truth · không lưu thứ tính được
- Hiến pháp **IV** — không viết SQL trước khi ADR được phê duyệt
- Hiến pháp **V.1** — không được audit bằng bảng rỗng *(ca điển hình)*
- Hiến pháp **XI** — Backward → Forward → Extensible
- Hiến pháp **XI.1** — SECURITY FREEZE, bốn điều kiện gỡ
- Playbook **XXI** — i18n, nhãn tiếng Việt
- Playbook **XXVIII.2** — không `VARCHAR` tự do cho tập hữu hạn
- Playbook **XXIX** — chống phức tạp hoá *(cơ sở loại phương án E)*
- Playbook **K-3** — mỗi kịch bản phải có ít nhất một vai chờ thấy > 0

**ADR liên quan**

- [ADR-001](../assignment/ADR-001-site-and-operation.md) — `cut_bundles.current_stage` trong mô hình tài nguyên
- [ADR-005](ADR-005-udmd-i18n-and-soft-delete.md) — tiền lệ "thêm trục thay vì thêm cột cứng"; cũng là cơ sở **loại** phương án E
- [ADR-006](ADR-006-permission-engine.md) — ⏳ **chờ phê duyệt**; `031d` phụ thuộc cả ADR này lẫn ADR đó
