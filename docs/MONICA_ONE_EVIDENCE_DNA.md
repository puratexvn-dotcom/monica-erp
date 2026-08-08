# MONICA ONE — EVIDENCE DNA

> **Khuôn chung cho MỌI bằng chứng nghiệp vụ trong Monica ONE.**
> Đọc tệp này rồi triển khai được Evidence cho một phân hệ mới **⛔ không tạo
> khuôn riêng**.

| | |
|---|---|
| **Trạng thái** | ✅ **BAN HÀNH** — 08/08/2026 |
| **Nguồn** | Board Directive *EVIDENCE DNA PACKAGING* 08/08/2026 |
| **Nền tảng đã thi hành** | `ADR-031` · migration `057` · đo hành vi **13/13** |
| **Bậc văn bản** | **3 — Engineering Standards** *(ADR-010)*. Dưới Hiến pháp và ADR; **trên** mã nguồn |
| **Phản biện độc lập** | ⛔ **CHƯA có** — `ADR-011 §2.2` |

---

## 0. 🔑 ĐỌC TRƯỚC — TÀI LIỆU NÀY LÀ GÌ VÀ ⛔ KHÔNG LÀ GÌ

| | |
|---|---|
| ✅ **LÀ** | Khuôn *(pattern)* để **dùng lại**. Sáu quyết định đã chốt, có lý do, có phép đo. |
| ⛔ **KHÔNG LÀ** | Lời tuyên bố rằng Evidence **đã phủ** hệ thống. Nó **⛔ chưa**. |

🔴 **Đo 08/08/2026, nói thẳng:**

```
Hạ tầng bằng chứng ................ ✅ XONG   (kho · URL · quyền · bất biến)
Điểm sản lượng CÓ bằng chứng ...... 🔴 0 / 27
Vết kiểm toán cho tài liệu ........ 🔴 0 dòng
Gắn bằng chứng vào TỪNG TRƯỜNG .... 🔴 ⛔ CHƯA CÓ
```

🔑 **Có đường ống ⛔ không phải là có nước chảy.** Tài liệu này đóng gói *đường
ống*; §9 là lộ trình dẫn nước. Đọc nhầm hai thứ đó là hiểu sai toàn bộ.

---

## 1. PURPOSE — VÌ SAO MONICA ONE CẦN EVIDENCE-FIRST

### 1.1 Bài toán gốc: con số ⛔ không tự chứng minh được mình

Monica ONE là ERP **gia công may mặc**. Phần lớn con số quan trọng nhất
**⛔ không sinh ra từ máy** — chúng do **người ở xưởng gõ vào**:

```
Tổ cắt gõ    "cắt được 1.200 chiếc"
Chuyền may gõ "may xong 980 chiếc"
QA gõ        "lỗi 12 chiếc"
Kho gõ       "nhập 3.400 mét vải"
```

⚠️ Trong bốn con số đó, **⛔ không con số nào có thứ gì đứng sau nó** ngoài lời
người gõ. Mà hệ quả của chúng thì rất thật: thanh toán cho nhà thầu, công nợ với
buyer, quyết định giao hàng.

### 1.2 Vì sao *"tin nhau"* ⛔ không phải một mô hình dữ liệu

Nhà máy gia công vận hành với **bên thứ ba**: nhà thầu phụ, buyer, hãng vận
tải. Khi hai bên lệch số, câu hỏi ⛔ không phải *"ai trung thực hơn"* — mà là
**"có gì để đối chiếu ⛔"**.

| ⛔ Không có bằng chứng | ✅ Có bằng chứng |
|---|---|
| Tranh chấp giải quyết bằng **quyền lực** | giải quyết bằng **vật chứng** |
| Sửa số sau đó ⇒ ⛔ không ai biết | sửa số ⇒ **bằng chứng cũ vẫn nằm đó** |
| Audit của buyer ⇒ ⛔ không qua | audit ⇒ mở ra xem |

### 1.3 Ba tính chất bắt buộc — thiếu một là mất hết

| | Tính chất | Vì sao thiếu là hỏng |
|---|---|---|
| ① | **Gắn liền** — bằng chứng thuộc **đúng** bản ghi | Ảnh rời khỏi con số thì ⛔ không chứng minh gì |
| ② | **Bất biến** — ⛔ không sửa, ⛔ không xoá | Người ghi số **tự xoá được** bằng chứng ⇒ bằng chứng vô nghĩa |
| ③ | **Có kiểm soát** — chỉ người có quyền nghiệp vụ mới xem | Đây là tài sản thương mại của **bên thứ ba** nhà máy giữ hộ |

🔴 **② quan trọng nhất và hay bị bỏ nhất.** Đây **cùng một họ khuyết tật** với
lỗ hổng `activity_log` mà `056` vừa đóng:

> **Người tạo ra một con số ⛔ KHÔNG được có quyền xoá bằng chứng của chính con
> số đó.**

Đo được ngày 08/08/2026, trước `057`: `md001` **tự xoá được** tệp mình tải,
⛔ không một dòng vết. Đó ⛔ không phải lỗi lập trình — đó là **thiếu một
nguyên tắc**. Tài liệu này là nguyên tắc ấy, viết thành khuôn.

---

## 2. DATA PATTERN

### 2.1 Quan hệ — MỘT bảng đính kèm, gắn **đa hình** vào mọi thực thể

```
      ┌────────────┐   ┌────────────┐   ┌────────────┐
      │  orders    │   │  styles    │   │  costings  │   … 7 loại
      └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
            │                │                │
            └────────────────┼────────────────┘
                             │  (entity_type, entity_id)
                    ┌────────▼─────────┐
                    │  md_documents    │   ← MỘT bảng, ⛔ KHÔNG mỗi module một bảng
                    └────────┬─────────┘
                             │  storage_path
                    ┌────────▼─────────┐
                    │ storage.objects  │   bucket `evidences` · RIÊNG TƯ
                    └──────────────────┘
```

🔑 **Vì sao ĐA HÌNH chứ ⛔ không phải khoá ngoại cho từng bảng:**

| Đa hình *(`entity_type` + `entity_id`)* | Khoá ngoại riêng từng bảng |
|---|---|
| Thêm loại mới = **1 dòng** vào 2 hằng số | thêm loại mới = **1 migration + 1 cột** |
| **1** phép kiểm quyền dùng cho mọi loại | mỗi bảng một phép kiểm ⇒ chúng sẽ lệch nhau |
| ⚠️ Mất **toàn vẹn tham chiếu** ở tầng CSDL | có `FOREIGN KEY` thật |

⚠️ **Cái giá đã trả có ý thức:** `md_documents.entity_id` **⛔ không** có
`FOREIGN KEY`. Xoá mềm bản ghi cha ⇒ tài liệu **treo lại**. Đây là đánh đổi
**cố ý**, và nó chấp nhận được **chỉ vì** hệ thống ⛔ không xoá cứng gì cả
*(`051` · `052` · `053`)* — bản ghi cha luôn còn đó.

### 2.2 Lược đồ `md_documents` — **đo trên CSDL đang chạy**, ⛔ không chép từ migration

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `UUID` | |
| `entity_type` | `VARCHAR(30)` | `CHECK` — 7 giá trị, xem §2.3 |
| `entity_id` | `UUID` | ⛔ **⛔ không có `FK`** — có chủ ý, §2.1 |
| `doc_type` | `VARCHAR(30)` | `TECH_PACK · MARKER · PATTERN · PACKING_LIST · ARTWORK · CONTRACT · INVOICE · OTHER` |
| `title` | `VARCHAR(255)` | người dùng đọc |
| `storage_path` | `TEXT` | 🔑 **đường dẫn**, ⛔ **KHÔNG** URL đầy đủ |
| `file_size` · `mime_type` | | |
| `version` | `INTEGER` | mặc định `1` — §4.3 |
| `uploaded_by` | `UUID → profiles` | **AI** |
| `created_at` | `TIMESTAMPTZ` | **KHI NÀO** |
| `deleted_at` · `deleted_by` | | lưu trữ mềm — `052` |

🔴 **`storage_path`, ⛔ KHÔNG BAO GIỜ là URL.** Lý do đã thành sự thật:
`057` đổi bucket sang riêng tư, **mọi URL công khai chết**. Vì DB lưu *path*,
⛔ **không một dòng dữ liệu nào phải viết lại**. Lưu URL thì đó đã là một cuộc
di trú.

### 2.3 Bảy loại thực thể — khai ở **hai** nơi, và cả hai đều phải sửa

| Nơi | Vai trò |
|---|---|
| `md_documents_entity_type_check` *(CSDL)* | hàng rào thật |
| `lib/mos/evidence/access.ts` → `BANG_THEO_ENTITY` | ánh xạ loại ⟷ **bảng**, để **hỏi RLS** |

```
ORDER→orders · STYLE→styles · COSTING→costings · INQUIRY→inquiries
CUSTOMER→customers · SAMPLE→sample_submissions · MILESTONE→order_milestones
```

⚠️ Thêm loại mới ở `CHECK` mà **quên** `BANG_THEO_ENTITY` ⇒ bằng chứng loại đó
**⛔ không xem được**. 🔑 Đó là **hỏng ồn ào**, ⛔ không phải hở im lặng —
hướng sai an toàn hơn, và là lý do ánh xạ này ⛔ **không** có nhánh mặc định.

### 2.4 🔴 FIELD-LEVEL EVIDENCE — **⛔ CHƯA TỒN TẠI**

> Board hỏi mục này. Câu trả lời trung thực: **⛔ chưa có, và đây là khoảng
> trống lớn nhất còn lại.**

Hiện `md_documents` gắn vào **BẢN GHI**, ⛔ không gắn vào **TRƯỜNG**:

```
✅ làm được   "3 tài liệu này thuộc đơn hàng PO-2026-001"
🔴 ⛔ chưa    "ảnh này chứng minh cho ô `qty_cut = 1.200`"
```

Đo được: **⛔ không một bảng sản lượng nào** có cột bằng chứng.
`app/(dashboard)/to-truong-cat/evidence-panel.tsx` **tự khai điều đó** trên màn
hình — nó nhận `path` từ ô nhập rồi **⛔ không lưu đi đâu cả**.

**Khuôn đã chốt cho khi triển khai** *(§9 — ⛔ CHƯA làm)*:

```sql
ALTER TABLE public.md_documents
  ADD COLUMN IF NOT EXISTS field_name VARCHAR(60);   -- NULL = gắn cả bản ghi
```

🔑 **Vì sao thêm cột ở `md_documents` chứ ⛔ không thêm `evidence_path` vào từng
bảng sản lượng** — đúng câu hỏi này quyết định toàn bộ §8:

| `md_documents.field_name` | `<bảng>.evidence_path` |
|---|---|
| **1** tệp ⟶ **1** trường; **n** tệp ⟶ 1 trường ✅ | 1 cột chỉ giữ **1** tệp |
| ⛔ **Không** migration cho mỗi bảng mới | 27 điểm = **27 cột** ở ~15 bảng |
| Bất biến · lưu trữ mềm · quyền **kế thừa sẵn** | mỗi bảng phải tự dựng lại |
| Vết `uploaded_by` · `created_at` có sẵn | ⛔ không có |

⚠️ `field_name` là **chuỗi tự do** — ⛔ CSDL không kiểm nó khớp tên cột thật.
Ràng buộc phải nằm ở **hằng số TypeScript mỗi phân hệ**, và ở **phép đo**
*(§7)*. Nói rõ ra vì đây là điểm yếu, ⛔ không phải chỗ để im lặng.

---

## 3. STORAGE PATTERN

### 3.1 Ba luật, ⛔ không thương lượng

```
① Bucket RIÊNG TƯ          public = false
② ⛔ KHÔNG policy SELECT   ⇒ ⛔ không đường đọc trực tiếp nào
③ Chỉ vào bằng Signed URL  do Server Action phát, SAU KHI kiểm quyền
```

🔑 **② là điểm mấu chốt, và nó phản trực giác.** Ai cũng muốn thêm một policy
`SELECT TO authenticated` *"cho tiện"*. Làm thế là **vứt bỏ toàn bộ giá trị**:
bất kỳ ai đã đăng nhập sẽ đọc thẳng **mọi** tệp qua Storage API — kín hơn công
khai một chút, nhưng vẫn ⛔ **không hỏi** *"người này có quyền với ĐƠN HÀNG đó
⛔"*. `storage.objects` **⛔ không biết gì** về đơn hàng, nên phép kiểm nghiệp
vụ **⛔ không đặt được** ở đó.

### 3.2 Đường đọc — ba bước, ⛔ không rút gọn

`app/actions/evidence-url-action.ts` → `layUrlBangChung(entityType, entityId, storagePath)`

```
① Tệp có THUỘC bản ghi ⛔     tra `md_documents`  ⛔ KHÔNG tin path client gửi
② Người gọi ĐỌC ĐƯỢC cha ⛔    hỏi RLS  bằng PHIÊN CỦA CHÍNH HỌ
③ Ký URL 300 giây             bằng khoá NÂNG QUYỀN — CHỈ SAU KHI ①② cho qua
```

🔑 **Ranh giới ở ③ LÀ toàn bộ thiết kế:**

> **Phán quyết chạy dưới quyền NGƯỜI GỌI. Hành động chạy dưới quyền NÂNG CẤP.**

Đảo thứ tự — dùng khoá nâng quyền ở ① hoặc ② — là **vô hiệu hoá đúng phép kiểm
mà hàm này tồn tại để làm**.

### 3.3 🔴 VÌ SAO ③ PHẢI NÂNG QUYỀN — một khẳng định đã bị phép đo bác bỏ

`057`, `ADR-031` và kế hoạch **đều từng ghi**: *"`createSignedUrl` ⛔ không cần
policy `SELECT`."* **SAI.** Đo sau khi `057` chạy:

```
createSignedUrl('po/…') bằng phiên md001   →   "Object not found"
```

`createSignedUrl` **vẫn chịu RLS của vai gọi**. ⛔ Không policy `SELECT` ⇒
`authenticated` ⛔ không **thấy** đối tượng ⇒ ⛔ không ký được. Mọi nút *"Mở tài
liệu"* đứng im.

⚠️ **Và lược đồ vẫn ĐÚNG Y NHƯ THIẾT KẾ** — ⛔ không một bài kiểm lược đồ nào
bắt được. Chỉ **phép đo hành vi** mới thấy. Ghi lại ở đây vì người sau sẽ gặp
lại đúng cái bẫy này.

### 3.4 Vì sao ① tồn tại — chống `IDOR`

⛔ Không có ①, lệnh sau **chạy được**:

```
layUrlBangChung('ORDER', <đơn TÔI có quyền>, '<path tệp NGƯỜI KHÁC>')
```

Đúng người · đúng đơn · **sai tệp** — và ⛔ không phép kiểm quyền nào bắt được,
vì mọi thứ về *người* và *đơn* đều hợp lệ. 🔑 Lỗ hổng này ⛔ **không lộ ra** ở
bất kỳ bài kiểm nào chỉ đo *"đúng vai, đúng bản ghi"*.

### 3.5 Luật hết hạn — **300 giây**

| | |
|---|---|
| **Đủ** | mở một ảnh, tải một PDF — kể cả 3G ở xưởng |
| **Quá ngắn** | để dán vào email/Zalo rồi còn dùng được |

🔑 Con số này nhắm đúng **cách URL rò ra ngoài trong đời thật**: ⛔ không phải
tin tặc, mà là người dùng **chia sẻ lại một đường dẫn**.

⚠️ Nới `HAN_SIGNED_URL_GIAY` là **quyết định bảo mật**, ⛔ không phải tinh chỉnh
trải nghiệm. URL hết hạn ⇒ bấm xem lại ⇒ hệ thống xin URL mới. Sửa hằng số này
mà ⛔ không có ADR là vi phạm.

### 3.6 Đường ghi

`app/actions/upload-action.ts` → `uploadEvidence(formData)`

```
folder/<userId>/<ngàyVN>/<uuid>.<ext>
```

| Luật | Vì sao |
|---|---|
| Máy chủ **tự đặt tên**, ⛔ không tin tên client gửi | tên tệp là dữ liệu người dùng — chứa `../` được |
| Đuôi suy từ **MIME**, ⛔ không từ tên tệp | như trên |
| `folder` lọc bằng `/^[a-z0-9-]{1,32}$/` | chặn thoát thư mục |
| `upsert: false` | bật lên là **cho phép ghi đè bằng chứng cũ** |
| Kiểm MIME + kích thước **ở máy chủ** | kiểm ở client chỉ để phản hồi nhanh; ai cũng gọi thẳng API bỏ qua được |

⚠️ `next.config.mjs` phải giữ `serverActions.bodySizeLimit ≥ 10mb` — mặc định
của Next.js là **1 MB**, ảnh điện thoại 2–5 MB, và thông báo lỗi ⛔ không nói gì
về ảnh.

### 3.7 MỘT NGUỒN ALLOWLIST — và giới hạn thật của nó

`lib/mos/evidence/mime.ts` là **bản gốc**. Ứng dụng đọc thẳng; `057` **chép**
vào `storage.buckets.allowed_mime_types`.

⚠️ TypeScript ⛔ không ghi được vào `storage.buckets`; SQL ⛔ không đọc được
TypeScript. Nên *"một nguồn"* ở đây thi hành bằng **một PHÉP ĐO**:
`kiem-bang-chung.mjs §5.1` so hai bên và **HỎNG** nếu lệch.

🔑 Phép đo đó là **thứ duy nhất** khiến lời hứa thành sự thật. Hai tầng ⛔ không
tự đồng bộ được — điều làm được là **phát hiện ngay lúc chúng trôi ra xa nhau**.
Đúng khuyết tật đã làm PDF hỏng hai ngày mà ⛔ không phép kiểm nào thấy:

```
06/08  Board yêu cầu nhận PDF  →  sửa ứng dụng ✅  ·  quên bucket 🔴
08/08  đo                      →  PDF chọn được trên màn hình, Supabase từ chối
```

⚠️ **Word/Excel CỐ Ý ⛔ KHÔNG có mặt** — hai định dạng đó mang **macro chạy
được**, và tệp ở đây được nhà thầu/khách tải về mở trên máy của họ. Mở allowlist
cho chúng là **quyết định Board**, ⛔ không phải một dòng thêm vào mảng.

### 3.8 🔑 HAI HỒ SƠ ĐỊNH DẠNG — khác nhau **có chủ ý**

Đo được: ba bề mặt tải lên hiện dùng `accept` **khác nhau**. Đó ⛔ **không**
phải trôi dạt — đó là hai nhu cầu thật, và DNA đặt tên cho chúng:

| Hồ sơ | `accept` | Dùng ở | Vì sao |
|---|---|---|---|
| **ẢNH HIỆN TRƯỜNG** | `image/*` + `capture="environment"` | ô nhập sản lượng · nút chụp | Bằng chứng cho một con số ở xưởng **phải là ảnh**. Cho phép PDF ở đây là mời người dùng đính kèm thứ ⛔ không chứng minh gì |
| **TÀI LIỆU** | `ACCEPT_BANG_CHUNG` *(gồm PDF)* | đính kèm PO · Trung tâm tài liệu | Tech Pack · packing list · hợp đồng **là PDF** |

🔴 **NỢ `D-2`:** `mime.ts` hiện **⛔ chưa** xuất hằng số cho hồ sơ *ẢNH HIỆN
TRƯỜNG* — hai tệp giao diện đang **gõ tay `image/*`**. Đó là **đúng hành vi,
sai kiến trúc**: `image/*` rộng hơn allowlist *(nhận `gif` · `bmp` · `svg` →
người dùng chờ tải xong rồi mới bị máy chủ từ chối)*. Cách sửa ở §9.

---

## 4. PERMISSION PATTERN

### 4.1 Bảng quyền — thi hành ở tầng nào

| Hành động | Ai | Thi hành ở |
|---|---|---|
| **Upload** | `authenticated` **có vai hợp lệ** | policy `evidences_authenticated_insert` + `isRole()` ở Server Action |
| **View** | người **đọc được bản ghi cha** *(hỏi RLS)* | `layUrlBangChung` ①② — ⛔ **KHÔNG** có policy `SELECT` |
| **Replace** | 🔴 **⛔ KHÔNG AI** | ⛔ không policy `UPDATE`; `upsert: false` |
| **Archive** | người có quyền sửa bản ghi cha | `mos_luu_tru_md('md_documents', id)` → `deleted_at` |
| **Delete** *(vật lý)* | 🔴 **⛔ KHÔNG AI** | ⛔ không policy `DELETE`; `051` `REVOKE DELETE` |

### 4.2 🔑 **View** — hỏi RLS, ⛔ KHÔNG viết bộ luật quyền thứ hai

`layUrlBangChung` **⛔ không** tự phán quyết ai xem được gì. Nó **hỏi CSDL**:
đọc bản ghi cha **bằng phiên của người gọi**. Đọc được ⇒ được xem bằng chứng
của nó.

| Vì sao đây là thiết kế đúng, ⛔ không phải đường tắt |
|---|
| RLS **đã là** nguồn chân lý về *"ai thấy đơn nào"* — 57 migration dựng nên nó. Viết bộ luật quyền thứ hai ở tầng ứng dụng là dựng **hai nguồn sự thật**, và chúng sẽ lệch nhau đúng vào lúc ⛔ không ai để ý |
| Nhà thầu ngoài được khoanh vùng bằng **Assignment** *(Playbook Điều XXX)*, và RLS đã thi hành điều đó. Hỏi RLS là **tự động đúng luật ấy** — ⛔ không phải nhớ chép lại nó |

🔴 **Hệ quả cho phân hệ mới:** siết RLS của bảng cha là **tự động** siết bằng
chứng của nó. ⛔ **Không** phải viết thêm dòng quyền nào.

### 4.3 **Replace** — thay tệp = **tải tệp mới**, ⛔ không ghi đè

`md_documents.version` có sẵn. Bản mới ⇒ dòng mới, `version = version + 1`;
bản cũ **lưu trữ mềm**, ⛔ không xoá.

🔑 *"Sửa"* một bằng chứng chính là **huỷ giá trị làm bằng chứng của nó**. Cùng
nguyên tắc với *"chứng từ đã Đóng/Duyệt ⛔ không được `UPDATE`"* — lập chứng từ
điều chỉnh, ⛔ không sửa chứng từ cũ.

### 4.4 **Delete** — Phương án A, và **cái giá đã trả có ý thức**

> Board §4: *"Evidence là bằng chứng nghiệp vụ. ⛔ Không cho user tự xoá vật
> lý… cùng mindset với `activity_log` immutability."*

⇒ Bỏ một tệp = **lưu trữ mềm bản ghi** `md_documents`. Tệp vẫn nằm trong kho,
bản ghi biến khỏi danh sách, và **có vết**.

⚠️ **Cái giá:** tệp tải nhầm nằm lại **vĩnh viễn**. Đó là **cái giá của bất
biến**, giống hệt `056` — ⛔ **không phải** tác dụng phụ ngoài ý muốn. Ai muốn
đảo phải trả lời: *"vì sao lần này người ghi số ĐƯỢC xoá bằng chứng của mình?"*

### 4.5 ⚠️ GIỚI HẠN — nói thẳng, ⛔ không tô hồng

| Vai | Chặn được? |
|---|---|
| `anon` · khách vãng lai | ✅ |
| `authenticated` — **mọi vai nghiệp vụ** | ✅ ⛔ không đọc trực tiếp được |
| **`service_role`** | ⚠️ **VẪN đọc/xoá được** — mang `BYPASSRLS` |
| superuser | 🔴 ⛔ **KHÔNG** |

🔑 **Storage ⛔ KHÔNG đặt trigger được** như bảng thường, nên mẹo bất biến của
`056` *(trigger `P0403` + `REVOKE`)* ⛔ **không dùng lại được** ở đây. Phòng thủ
với `service_role` là **giữ khoá** — nó chỉ ở máy chủ và script chạy tay,
⛔ **không bao giờ** xuống trình duyệt.

⇒ Phát biểu trung thực: **kín với mọi đường ứng dụng và mọi người dùng cuối;
⛔ KHÔNG kín trước người cầm khoá `service_role` hay superuser.**

---

## 5. AUDIT PATTERN — WHO · WHAT · WHEN · WHERE

### 5.1 Có sẵn trong `md_documents`

| Câu hỏi | Cột |
|---|---|
| **WHO** | `uploaded_by` *(tải lên)* · `deleted_by` *(lưu trữ)* |
| **WHAT** | `doc_type` · `title` · `mime_type` · `file_size` · `version` |
| **WHEN** | `created_at` · `deleted_at` — `TIMESTAMPTZ`, UTC |
| **WHERE** | `entity_type` + `entity_id` *(gắn vào đâu)* · `storage_path` *(nằm ở đâu)* |

Cộng thêm ở tầng kho: `storage.objects.owner` = `auth.uid()`, và đường dẫn
`folder/<userId>/<ngàyVN>/…` **tự mang** người tải và ngày.

### 5.2 🔴 KHOẢNG TRỐNG ĐÃ ĐO — **0 dòng vết trong `activity_log`**

```
activity_log — các loại hành động đang có:  APPROVE · CREATE · DELETE · UPDATE
vết liên quan tài liệu/bằng chứng:          🔴 0
```

⇒ **Bốn cột trên trả lời được *trạng thái hiện tại*, ⛔ KHÔNG trả lời được
*lịch sử*.** Câu hỏi *"tệp này từng bị lưu trữ rồi khôi phục mấy lần ⛔"* hiện
**⛔ không trả lời được**.

⚠️ Đây ⛔ **không** phải lỗi của `057` — `057` lo **kho**. Đây là việc ⛔ chưa
làm, và nó nằm ở §9 `R-3`.

### 5.3 Khuôn khi triển khai — **⛔ CHƯA làm**

```
EVIDENCE_UPLOAD · EVIDENCE_ARCHIVE · EVIDENCE_RESTORE · EVIDENCE_VIEW
```

⚠️ **`EVIDENCE_VIEW` cần cân nhắc riêng, ⛔ đừng thêm theo quán tính.** Mỗi lần
mở một ảnh sinh một dòng ⇒ sổ kiểm toán **phình theo lượt xem**, và
`activity_log` là **bảng chỉ-ghi-thêm** *(`056`)* — ⛔ không dọn được. Nếu cần,
ghi **có tiết chế** *(một dòng mỗi người mỗi tệp mỗi ngày)*, ⛔ không ghi mỗi
lượt.

🔑 Nguyên tắc: **ghi vết cho việc THAY ĐỔI trạng thái bằng chứng**; việc *đọc*
chỉ ghi khi có yêu cầu tuân thủ cụ thể.

---

## 6. UX PATTERN

### 6.1 Bốn bề mặt đã có — và mỗi cái giải bài toán gì

| Tệp | Bài toán |
|---|---|
| `components/quantity-input-with-evidence.tsx` | **con số + bằng chứng là MỘT ô** |
| `components/evidence-upload.tsx` | bằng chứng đứng riêng *(sự cố, ghi chú)* |
| `app/(dashboard)/md/po-dinh-kem.tsx` | đính **nhiều** tài liệu lúc lập chứng từ |
| `components/md/collab/document-center.tsx` | **danh sách** · mở · sửa nhãn · lưu trữ |

### 6.2 🔑 QUANTITY — con số và bằng chứng **⛔ KHÔNG tách rời**

```
┌────────────────────────────────────────────┐
│ Số lượng cắt          [   1.200   ] chiếc  │
│ ┌────────────────┐ ┌────────────────┐      │
│ │ 📷 Chụp ảnh    │ │ 📁 Chọn tệp   │      │
│ └────────────────┘ └────────────────┘      │
│ ┌────┐                                     │
│ │ 🖼 │  ✅ Đã đính bằng chứng              │
│ └────┘                                     │
│ ⚠️ Chưa có ảnh — số này chưa có gì đứng sau│
└────────────────────────────────────────────┘
```

| Luật | Vì sao |
|---|---|
| Ô nhập và nút chụp **cùng một khối** | tách ra ⇒ người dùng gõ số rồi bỏ qua ảnh |
| `requireEvidence` **mặc định `true`** | mặc định phải là *"có bằng chứng"*; miễn trừ phải **khai ra** |
| Cảnh báo hiện **ngay khi gõ số mà ⛔ chưa có ảnh** | ⛔ không đợi tới lúc bấm Lưu |
| Xem trước bằng **blob cục bộ** | thấy ngay, ⛔ không chờ mạng · ⛔ không phụ thuộc Signed URL |

### 6.3 MOBILE — `<input capture>`, ⛔ **KHÔNG** `getUserMedia`

🔴 **Lý do quyết định, và nó là chặn cứng ⛔ không phải sở thích:**

```
getUserMedia  ⇒  đòi HTTPS.  Xưởng chạy LAN http://192.168.x.x
              ⇒  BỊ CHẶN THẲNG, ⛔ không có đường lùi.
```

`<input type="file" accept="image/*" capture="environment">` mở **thẳng app
camera của máy** — chạy trên `http`, ⛔ không xin quyền, ⛔ không thư viện.

| Luật mobile | Vì sao |
|---|---|
| `capture="environment"` | camera **sau** — người ta chụp bàn cắt, ⛔ không chụp mặt mình |
| `inputMode="decimal"` ở ô số | bàn phím số trên điện thoại |
| Vùng bấm **≥ 44 px** | ngón tay có găng, trong xưởng |
| **Hai** nút: *Chụp* và *Chọn tệp* | tổ trưởng chụp tại chỗ; văn phòng đính tệp có sẵn |

### 6.4 EVIDENCE LIST + PREVIEW

| Luật | Vì sao |
|---|---|
| Mở tệp = **gọi `layUrlBangChung`**, ⛔ **KHÔNG** `<a href>` tĩnh | URL công khai **đã chết** từ `057`; và URL có hạn ⛔ không nhúng sẵn được |
| Có trạng thái **đang mở** *(spinner)* | ký URL là một vòng gọi mạng |
| Thất bại ⇒ **câu tiếng Việt**, ⛔ không mã lỗi | *"Bạn ⛔ không có quyền xem bản ghi chứa tệp này."* |
| URL hết hạn ⇒ **bấm lại là có URL mới** | ⛔ không bắt người dùng tải lại trang |
| Nút *"Gỡ"* = **lưu trữ**, ⛔ không xoá | và nhãn phải nói đúng điều nó làm |

🔴 **⛔ KHÔNG lưu Signed URL vào state lâu dài · ⛔ không nhúng vào HTML tĩnh ·
⛔ không ghi vào CSDL.** Nó sống 300 giây. Xin **khi cần**.

### 6.5 Ngôn ngữ giao diện

Mọi nhãn **tiếng Việt**, qua `lib/i18n`. Ba câu chuẩn:

```
✅  "Đã đính bằng chứng"
⚠️  "Chưa có ảnh — số này chưa có gì đứng sau"
⛔  "Định dạng ⛔ không hỗ trợ (…). Chỉ nhận ảnh JPG, PNG, WEBP, HEIC và tài
     liệu PDF. Tệp Word/Excel xin xuất sang PDF trước khi tải lên."
```

🔑 Câu thứ ba **nói người dùng phải làm gì tiếp** — đó là khác biệt giữa một
thông báo lỗi và một lối thoát.

---

## 7. TESTING PATTERN — danh mục **dùng lại cho mọi phân hệ**

### 7.1 🔑 Luật nền — một phép kiểm chỉ có nghĩa nếu nó **từng hỏng**

> **Bộ kiểm chưa bao giờ đỏ ⛔ không chứng minh được gì.**

Đo thật của nền tảng này:

```
TRƯỚC `057`   3 đạt · 6 hỏng      SAU `057`   13 đạt · 0 hỏng
```

Sáu phép hỏng **đúng bằng** sáu khuyết tật đã biết. **Đó** là thứ khiến `13/13`
có nghĩa — bài kiểm đã chứng minh nó **phân biệt được** trạng thái hở với kín.

### 7.2 Danh mục 13 phép — chép sang phân hệ mới, đổi tên thực thể

| # | Phép đo | Kỳ vọng |
|---|---|---|
| **① TẢI LÊN** ||
| 1.1–1.3 | tải PNG · JPG · **PDF** | ✅ được |
| 1.4 | tải `.txt` *(ngoài allowlist)* | 🔴 **bị từ chối** |
| **② KHO RIÊNG TƯ** ||
| 2.1 | `storage.buckets.public` | `false` |
| 2.2 | `fetch` **trần** vào URL công khai | 🔴 **bị chặn** |
| **③ SIGNED URL + QUYỀN** ||
| 3.1 | chủ sở hữu xin URL | ✅ được |
| 3.2 | hạn URL | **300 giây** |
| 3.3 | mở URL | ✅ ra đúng tệp |
| 3.4 | **tệp ⛔ không thuộc bản ghi** *(IDOR)* | 🔴 **từ chối** |
| 3.5 | **vai ⛔ không có quyền** với bản ghi | 🔴 **từ chối** |
| **④ XOÁ** ||
| 4.1 | người tải lên tự xoá tệp | 🔴 **⛔ không xoá được** |
| **⑤ MỘT NGUỒN** ||
| 5.1 | allowlist KHO ⟷ `mime.ts` | **khớp tuyệt đối** |

### 7.3 🔴 BỐN CÁI BẪY — cả bốn đã **thật sự xảy ra** ở nền tảng này

| Bẫy | Đã xảy ra thế nào | Cách tránh |
|---|---|---|
| 🔴 **ĐẠT GIẢ** | `3.4`/`3.5` khẳng định `ok === false` và nhận `false` **chỉ vì Server Action ⛔ không tới được** — ⛔ không phải vì phép cấm có tác dụng | **`K-3`**: mỗi phép **cấm** phải đi kèm phép **cho-qua** chờ thấy `> 0`. Chốt `r1.ok === true &&` trước khi tính |
| **Tree-shake** | `layUrlBangChung` ⛔ **không UI nào import** ⇒ Next.js **loại khỏi registry** ⇒ mọi lời gọi trả `⛔ không tìm được action id` | Server Action phải được **giao diện thật** gọi. ⛔ Không có ⇒ nó ⛔ không tồn tại lúc chạy |
| **Xác minh sai vai** | `4.1` kiểm bằng `list()` của **người dùng** — sau `057` họ ⛔ không liệt kê được, nên *"0 tệp"* bị đọc thành *"đã xoá xong"* | Xác minh hậu quả bằng vai **nhìn thấy được** *(`service_role`)*, ⛔ không bằng vai vừa bị chặn |
| **Middleware chặn trước** | `3.5` gọi ở `/md`; `qa001` bị chặn khỏi `/md` ⇒ hỏng vì **lý do sai**, che mất điều cần đo | Gọi ở đường **mọi vai tới được** *(`/`)* |

### 7.4 Chạy

```bash
node scripts/kiem-bang-chung.mjs      # 13 phép đo hành vi — CẦN máy chủ chạy
npm run verify                        # typecheck + lint + toàn bộ bộ kiểm
node tests/architecture/arch.test.mjs # ratchet kiến trúc
```

⚠️ Bài kiểm **ghi thật vào kho** rồi dọn bằng `service_role` trong `finally`
*(người dùng ⛔ không xoá được — chính bài kiểm vừa chứng minh điều đó)*. Bản
ghi `md_documents` được **lưu trữ mềm**, ⛔ không xoá cứng.

---

## 8. REPLICATION RULE — 🔴 LUẬT QUAN TRỌNG NHẤT CỦA TÀI LIỆU NÀY

### 8.1 Luật

> ## ⛔ KHÔNG tạo `POEvidence` · `ProductionEvidence` · `QAEvidence` · `WarehouseEvidence` · `ShipmentEvidence` · `NPLEvidence`.
>
> **Cùng một bài toán ⇒ MỘT khuôn.**

| ✅ Dùng lại | ⛔ ⛔ KHÔNG tạo mới |
|---|---|
| `md_documents` | bảng `*_evidence` riêng |
| bucket `evidences` | bucket riêng từng phân hệ |
| `layUrlBangChung` | hàm phát URL riêng |
| `uploadEvidence` | Server Action tải lên riêng |
| `lib/mos/evidence/mime.ts` | allowlist riêng |
| `HAN_SIGNED_URL_GIAY` | hạn URL riêng |
| `QuantityInputWithEvidence` | ô nhập kèm ảnh riêng |

### 8.2 Vì sao — **⛔ không phải vì gọn, mà vì AN TOÀN**

🔑 Mỗi khuôn mới là **một bề mặt tấn công mới phải tự đi lại toàn bộ chặng
đường này**:

```
Khuôn mới phải TỰ dựng lại:  bucket riêng tư · ⛔ không policy SELECT
                             chống IDOR · hỏi RLS · hạn URL · chặn xoá
                             chặn ghi đè · một nguồn allowlist · 13 phép đo
```

⚠️ Và **⛔ không ai làm đủ chín thứ đó lần thứ hai.** Bằng chứng: nền tảng này
mất **hai ngày và ba khuyết tật đã đo** mới đủ — trong đó `P0` là **tệp thương
mại của buyer đọc được bằng `fetch` trần**.

🔴 Nói theo lối `P-IRREV`: **khuôn thứ hai làm sai thì dữ liệu lộ, và dữ liệu lộ
⛔ không thu hồi được.**

### 8.3 Sáu phân hệ — **⛔ không cái nào cần khuôn mới**

| Phân hệ | Bằng chứng gì | Dùng khuôn |
|---|---|---|
| **PO** | Tech Pack · PO khách · artwork | `md_documents` `entity_type='ORDER'` — ✅ **đang chạy** |
| **Production** | ảnh sản lượng cắt · may · hoàn thành | `field_name` + `QuantityInputWithEvidence` |
| **QA** | ảnh lỗi · phiếu AQL | `field_name` + ảnh hiện trường |
| **Warehouse** | ảnh nhập/xuất · phiếu cân | `field_name` + ảnh hiện trường |
| **Shipment** | packing list · B/L · ảnh niêm phong | `md_documents` — hồ sơ **TÀI LIỆU** |
| **NPL** | ảnh vải · chứng chỉ · báo cáo kiểm | cả hai hồ sơ |

### 8.4 Bốn bước triển khai cho một phân hệ mới

```
① Loại thực thể mới ⛔?   → thêm vào `md_documents_entity_type_check`
                             VÀ `BANG_THEO_ENTITY`.  ⚠️ CẢ HAI.
② Gắn vào TRƯỜNG ⛔?      → dùng `field_name` (§2.4).  ⛔ KHÔNG thêm cột
                             `evidence_path` vào bảng nghiệp vụ.
③ Giao diện               → chọn HỒ SƠ (§3.8): ẢNH HIỆN TRƯỜNG hay TÀI LIỆU.
                             Dùng lại component có sẵn.
④ Kiểm                    → chép 13 phép ở §7.2, đổi tên thực thể.
                             ⛔ CHƯA đỏ trước khi vá thì ⛔ CHƯA có nghĩa.
```

### 8.5 ⚠️ Khi nào **được** lệch khuôn

Chỉ khi bài toán **thật sự khác** — ví dụ bằng chứng cần **ký số**, hoặc phải
lưu ở hạ tầng do buyer chỉ định. Lúc đó: **`ADR` trước, mã sau** *(Hiến pháp
Điều 4)*.

🔑 *"Phân hệ của tôi đặc thù"* ⛔ **không** phải lý do. Sáu phân hệ ở §8.3 đều
tưởng mình đặc thù, và cả sáu đều vừa một khuôn.

---

## 9. MIGRATION STRATEGY — 🟠 **LỘ TRÌNH**, ⛔ CHƯA TRIỂN KHAI

> Board §9: *"Chưa triển khai 27 điểm. Chỉ xác định roadmap."*

### 9.1 Điểm xuất phát — đo, ⛔ không ước

```
Điểm sản lượng đã kiểm kê ......... 32   (`MONICA_ONE_QUANTITY_EVIDENCE_AUDIT.md`)
Trong đó là số ĐO ĐƯỢC ............ ~24  (số dẫn xuất ⛔ không cần bằng chứng)
Đang CÓ bằng chứng ................ 🔴 0
Bảng có cột bằng chứng ............ 🔴 0
```

### 9.2 Bốn khoản nợ — theo thứ tự **chặn nhau**

| Mã | Nợ | Chặn cái gì | Ước lượng |
|---|---|---|---|
| **`R-1`** | `md_documents.field_name` | 🔴 **chặn toàn bộ** 24 điểm | 1 migration |
| **`R-2`** | Hồ sơ *ẢNH HIỆN TRƯỜNG* trong `mime.ts` + 2 tệp giao diện dùng nó *(`D-2` §3.8)* | chất lượng, ⛔ không chặn | ⛔ không migration |
| **`R-3`** | 4 loại hành động `EVIDENCE_*` trong `activity_log` *(§5.3)* | truy vết lịch sử | 1 migration |
| **`R-4`** | `uploadEvidence` vẫn trả `getPublicUrl` — **URL đã chết** từ `057` *(`D-1`)* | gây hiểu nhầm; ⛔ chưa hỏng vì giao diện chỉ dùng nó làm cờ *"đã xong"* | ⛔ không migration |

### 9.3 Bốn giai đoạn

```
GĐ 0  ⛔ CHƯA MỞ   Board duyệt lộ trình này + gỡ SECURITY FREEZE cho `R-1`
GĐ 1               `R-1` `R-2` `R-4`  → hạ tầng đủ để gắn theo TRƯỜNG
GĐ 2               3 điểm THÍ ĐIỂM: cắt · may · nhập kho NPL
                   ⚠️ CHẠY THẬT Ở XƯỞNG rồi mới nhân rộng
GĐ 3               21 điểm còn lại + `R-3`
```

🔑 **Vì sao GĐ 2 tồn tại và ⛔ không được bỏ:** rào cản thật ⛔ không phải kỹ
thuật mà là **thao tác** — tổ trưởng có chịu chụp ảnh mỗi lần gõ số ⛔, sóng ở
xưởng có tải nổi ảnh 3 MB ⛔, `requireEvidence = true` có khiến họ **bỏ ⛔ không
ghi sản lượng** ⛔.

⚠️ Ba câu đó ⛔ **không trả lời được bằng suy luận**. Bật cho 24 điểm cùng lúc
rồi mới phát hiện là **hỏng vận hành toàn nhà máy**, ⛔ không phải hỏng một
tính năng.

### 9.4 ⚠️ Điều kiện tiên quyết — 🔴 **CÒN HIỆU LỰC**

| | |
|---|---|
| **SECURITY FREEZE** *(`MOS §XI.1`)* | 🔴 `B2` ⛔ chưa cắt ⇒ **⛔ không migration mới nào được khởi tạo**. `R-1` và `R-3` **bị chặn** |
| **Nạp dữ liệu khối lượng lớn** | 🔴 chính là **Cổng C** — `TC-1` · `TC-3` · `TC-4` |

⇒ **GĐ 1 ⛔ KHÔNG được bắt đầu** cho tới khi Board gỡ hoặc miễn trừ tường minh.

### 9.5 ⛔ Điều lộ trình này **KHÔNG** hứa

| ⛔ Không hứa | Vì sao |
|---|---|
| Bằng chứng **đúng** *(ảnh đúng lô hàng đó)* | hệ thống kiểm được **có ảnh**, ⛔ không kiểm được **ảnh chụp cái gì** |
| Chặn được `service_role` / superuser | §4.5 — storage ⛔ không đặt trigger được |
| Tệp cũ phải chuyển | ⛔ **không có** — kho rỗng lúc vá *(0 tệp · 0 tham chiếu)*. ⛔ Không URL nào từng rò |

🔑 Dòng đầu là giới hạn **thật** và ⛔ không công nghệ nào trong tầm với xoá
được. Evidence-First biến *"tin lời"* thành *"có cái để đối chiếu"* — nó
⛔ **không** biến thành *"chắc chắn đúng"*. Nói rõ để ⛔ không ai bán nó như thế.

---

## 10. THAM CHIẾU

| Loại | Đường dẫn |
|---|---|
| **Quyết định** | `docs/adr/ADR-031-kho-bang-chung-rieng-tu.md` |
| **Kế hoạch** *(đã `IMPLEMENTED`)* | `docs/MONICA_ONE_EVIDENCE_SECURITY_PLAN.md` |
| **Kiểm kê 32 điểm** | `docs/MONICA_ONE_QUANTITY_EVIDENCE_AUDIT.md` |
| **Migration** | `supabase/migrations/057_evidence_private_bucket.sql` · `051` · `052` · `053` |
| **Nguồn allowlist** | `lib/mos/evidence/mime.ts` |
| **Hằng số truy cập** | `lib/mos/evidence/access.ts` |
| **Phát URL** | `app/actions/evidence-url-action.ts` |
| **Tải lên** | `app/actions/upload-action.ts` |
| **Phép đo** | `scripts/kiem-bang-chung.mjs` |
| **Giao diện** | `components/quantity-input-with-evidence.tsx` · `components/evidence-upload.tsx` · `app/(dashboard)/md/po-dinh-kem.tsx` · `components/md/collab/document-center.tsx` |

---

## 📌 MỘT TRANG — nếu chỉ nhớ được ngần này

```
① MỘT bảng đính kèm      md_documents (entity_type, entity_id)  — ⛔ KHÔNG bảng riêng
② Lưu PATH, ⛔ KHÔNG URL  URL chết khi bucket đổi; path thì ⛔ không
③ Bucket RIÊNG TƯ         ⛔ KHÔNG policy SELECT.  Signed URL 300 giây.
④ Kiểm rồi mới ký         ① tệp thuộc bản ghi ⛔  ② hỏi RLS bằng phiên NGƯỜI GỌI
                          ③ ký bằng khoá nâng quyền — CHỈ SAU KHI ①② cho qua
⑤ ⛔ KHÔNG AI xoá/sửa     bỏ = lưu trữ mềm.  Thay = tải bản mới, version + 1.
⑥ MỘT allowlist           lib/mos/evidence/mime.ts + MỘT PHÉP ĐO canh nó
⑦ Mobile = <input capture>  getUserMedia đòi HTTPS; xưởng chạy LAN http
⑧ Phép cấm phải có phép cho-qua đi kèm  (K-3) — ⛔ không thì ⛔ không phân biệt
                                        được "chặn đúng" với "gãy toàn bộ"
```

> 🔑 **Và điều cuối, quan trọng hơn tám dòng trên:**
> Tài liệu này đóng gói **đường ống**. Hiện có **0 / 27** điểm sản lượng thật
> sự chảy nước qua nó. ⛔ Đừng đọc `13/13` thành *"Monica ONE đã có
> Evidence-First"*.
