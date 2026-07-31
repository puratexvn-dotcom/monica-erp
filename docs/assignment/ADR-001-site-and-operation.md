# ADR-001 · ĐỊA ĐIỂM SẢN XUẤT & CÔNG ĐOẠN

**Ngày** 01/08/2026 · **Trạng thái** CHỜ XÁC NHẬN · **Bối cảnh** Migration 028

---

## Phần 0 · Một đính chính trước khi bàn

Ở tài liệu thiết kế tôi viết: *"`operations` — không có bảng công đoạn nào."*
**Sai.** Tôi dò đúng cái tên `operations` và sót bảng ngay bên cạnh.

```
style_operations   id · style_id · seq_no · operation · machine_type
                   sam_minutes · notes
                   0 dòng · ĐANG ĐƯỢC 4 tệp của /md dùng
                   (style.service.ts · style.actions.ts ·
                    style-detail-sheet.tsx · migration 015)
```

Và công đoạn còn xuất hiện ở dạng chữ tự do:

```
prod_logs.stage           "May thân" · "Tra tay" · "Vào lưng/khóa" · "Hoàn thiện"
subcon_orders.process_type  (0 dòng, chưa có giá trị thật)
cut_bundles.current_stage   enum CUT · SEWING · FINISHING · PACKED
```

Đây là lần thứ hai tôi mắc đúng lỗi này (lần đầu: `qa_defects` ở Phase 5). Nó
đổi hẳn kết luận của ADR — xem Quyết định 2.

---

## Phần 1 · PRODUCTION SITE

### Ý nghĩa nghiệp vụ

> **Một địa điểm vật lý nơi công việc sản xuất diễn ra.**

Bao gồm xưởng của chính Monica **và** xưởng của đối tác. Một Assignment giao
cho Xưởng Minh Phát thì công việc diễn ra **tại địa điểm của họ**, không phải
tại Monica.

### Thực trạng đo được — khái niệm này CHƯA TỒN TẠI

| Nơi | Tình trạng |
|---|---|
| `orders.factory_name` | chữ tự do, **cả 2 đơn thật đều NULL** |
| `warehouses` | 1 dòng "Kho chính" — là **kho**, không phải địa điểm sản xuất |
| `departments` | 11 dòng (SEW · CUT · FIN · SUBCON…) — **tổ chức**, không phải địa điểm |
| `sewing_lines` | 3 chuyền, **không có cột nào cho biết chúng ở đâu** |

Ba chuyền đang lơ lửng: hệ thống không biết chúng thuộc xưởng nào.

### Quyết định 1 — tên bảng là `production_sites`, không phải `factories`

Kiến trúc sư yêu cầu cân nhắc tên. Tôi **chọn đổi**, ba lý do:

**① "Factory" hàm ý xưởng của Monica.** Nhưng bảng này phải chứa cả xưởng của
Minh Phát, nhà máy giặt Củ Chi, xưởng in Tân Bình. Gọi chúng là "factories của
Monica" là sai về nghiệp vụ ngay từ tên gọi.

**② Chi phí đổi tên bằng KHÔNG.** `factories` chưa tồn tại. Không mã nguồn nào,
không migration nào, không dòng dữ liệu nào tham chiếu. Đây là lúc rẻ nhất để
chọn đúng tên.

**③ `orders.factory_name` không tạo ràng buộc nhất quán nào.** Nó là chữ tự do
và **cả hai đơn thật đều NULL** — không có dữ liệu để phải tôn trọng. Cột đó
giữ nguyên, không đụng.

### Cấu trúc

```
production_sites
  id · site_code (UNIQUE) · name
  site_type      IN (SEWING, CUTTING, FINISHING, WASHING, PRINTING, MIXED)
  owner_partner_id  → partners(id)   ⚠️ NULL = ĐỊA ĐIỂM CỦA MONICA
  address · country · is_active
  created_at · created_by · updated_at · updated_by · deleted_at · deleted_by
```

⚠️ `owner_partner_id IS NULL` ở đây **là ngữ nghĩa hợp lệ và tường minh**:
"không thuộc đối tác nào" = "của Monica". Đây không phải NULL kiểu "chưa xác
định" — có đúng hai khả năng và NULL biểu diễn một trong hai. Nếu về sau Monica
được mô hình hoá thành một `partners` row, cột này thành `NOT NULL` và ngữ
nghĩa còn rõ hơn.

`sewing_lines` nhận thêm `site_id` (nullable, vì 3 chuyền hiện có chưa biết
thuộc đâu — và **NULL ở đây đúng nghĩa "chưa xác định"**, nghiệp vụ phải gán).

### Quan hệ với Assignment

```
assignment.site_id → production_sites.id
```

Trả lời câu *"công việc này diễn ra ở đâu"*. Với đối tác sản xuất, đó là địa
điểm **của họ** — và điều đó làm cho `REPORT MISSING`, KPI theo địa điểm, và
việc phân biệt "chuyền nhà" với "chuyền thuê ngoài" trở nên đo được.

### Khả năng mở rộng

```
production_sites
      └── buildings   (chưa tạo)
              └── floors   (chưa tạo)
                      └── sewing_lines
```

`sewing_lines.site_id` trỏ thẳng lên `production_sites`. Khi có `buildings`,
thêm `building_id` và giữ `site_id` — không phải viết lại quan hệ.

### Vì sao CHƯA cần Building/Floor

Đo được: **3 chuyền · 1 kho · 11 phòng ban · 0 dữ liệu đa toà nhà ở bất kỳ đâu
trong lược đồ.**

Điều XXIX hỏi: *hôm nay không có nó thì hỏng chuyện gì?* Trả lời: không hỏng gì.
Không có màn hình nào cần biết chuyền 1 ở tầng mấy, không có báo cáo nào nhóm
theo toà nhà, không có đối tác nào có hai toà.

Hai bảng rỗng không ai dùng thì phải bảo trì mãi: mỗi truy vấn phải nối thêm,
mỗi form phải có thêm ô chọn, mỗi bài kiểm phải dựng thêm dữ liệu. Thêm sau là
một `ALTER TABLE ADD COLUMN` — rẻ.

---

## Phần 2 · OPERATION

### Ý nghĩa nghiệp vụ

> **Một bước trong quy trình sản xuất một mã hàng.**

"Tra tay", "May thân", "Vào lưng/khóa" — mỗi bước có thứ tự, loại máy, và định
mức thời gian (SAM).

### Quyết định 2 — KHÔNG tạo bảng `operations` mới

**Đây là đảo ngược so với thiết kế ban đầu**, do phát hiện ở Phần 0.

`style_operations` đã mô hình hoá đúng khái niệm này, và mô hình hoá **tốt
hơn** một danh mục toàn cục:

| | Danh mục toàn cục `operations` | `style_operations` (đã có) |
|---|---|---|
| Thứ tự công đoạn | không có | `seq_no` |
| Loại máy | không có | `machine_type` |
| Định mức thời gian | không có | `sam_minutes` |
| Ràng buộc với mã hàng | **không có** | `style_id` |

Dòng cuối là dòng quyết định. **Assignment luôn thuộc đúng một PO → một mã
hàng.** Nếu công đoạn lấy từ danh mục toàn cục, hệ thống sẽ cho phép giao "Tra
tay" cho một mã hàng không có công đoạn tra tay — và không gì chặn được.

```
assignment.style_operation_id → style_operations.id
```

Cộng một ràng buộc: công đoạn phải thuộc **đúng mã hàng của PO đó**. Kiểm ở
service; CSDL không tự kiểm được vì phải đi qua `orders.style_id`.

**Hệ quả:** migration 028 chỉ còn **một** bảng mới (`production_sites`) thay vì
hai. Không tạo thêm khái niệm trùng với thứ đang có.

### Ba loại "công đoạn" KHÔNG gộp làm một

| Khái niệm | Ở đâu | Dùng cho |
|---|---|---|
| Công đoạn may của mã hàng | `style_operations` | Assignment cho **PRODUCTION_PARTNER** |
| Dịch vụ ngoài (in · giặt · thêu) | `subcon_orders.process_type` | Assignment cho **SERVICE_PARTNER** — phạm vi theo **bó hàng**, không theo công đoạn |
| Giai đoạn dòng chảy | `cut_bundles.current_stage` enum | Theo dõi bó hàng đi tới đâu |

Gộp ba thứ này thành một bảng là làm hỏng cả ba: giai đoạn dòng chảy không có
SAM, dịch vụ ngoài không thuộc mã hàng nào, công đoạn may không phải trạng thái.

### Quyết định 3 — KHÔNG sinh dữ liệu mẫu

`style_operations` hiện **0 dòng**. Migration 028 **không** chèn dòng nào.
Nghiệp vụ tự khai công đoạn cho từng mã hàng, qua màn hình đã có sẵn ở `/md`.

`prod_logs.stage` có 4 giá trị chữ tự do thật ("May thân", "Tra tay", "Vào
lưng/khóa", "Hoàn thiện"). **Không** dùng chúng làm dữ liệu mẫu: chúng gắn với
một đơn hàng mồ côi, và chuẩn hoá chữ tự do thành danh mục là việc riêng, cần
nghiệp vụ xác nhận từng dòng — đúng bài học `defect_type` ở Phase 5.

---

## Phần 3 · `scope_level` — NULL KHÔNG BAO GIỜ NGHĨA LÀ "TẤT CẢ"

### Vấn đề trong thiết kế cũ của tôi

Tài liệu 01 viết: *"cột trống nghĩa là toàn bộ cấp đó"*. Kiến trúc sư bác, và
**bác đúng**. Hậu quả nếu giữ:

```
Người dùng lập Assignment, QUÊN chọn chuyền
   → line_id = NULL
   → hệ thống hiểu là "MỌI CHUYỀN"
   → đối tác được cấp quyền rộng hơn ý định, ÂM THẦM
```

Một lỗi nhập liệu biến thành một lỗ hổng phân quyền. Và `mos_assignment_covers`
sẽ đầy `(a.line_id IS NULL OR a.line_id = r.line_id)` — chính rủi ro R4 mà tôi
tự nêu.

### Thiết kế mới — tuyên bố phạm vi TƯỜNG MINH

```
assignments.scope_level  NOT NULL  IN (ORDER, SITE, LINE, OPERATION)
```

| `scope_level` | site_id | line_id | style_operation_id | Nghĩa |
|---|:---:|:---:|:---:|---|
| `ORDER` | NULL | NULL | NULL | toàn bộ PO |
| `SITE` | **có** | NULL | NULL | toàn bộ một địa điểm |
| `LINE` | **có** | **có** | NULL | toàn bộ một chuyền |
| `OPERATION` | **có** | **có** | **có** | đúng một công đoạn |

Ràng buộc `CHECK` ép đúng bảng trên: ở mỗi cấp, cột bắt buộc phải có giá trị và
cột dưới cấp phải NULL.

**NULL nay chỉ còn một nghĩa duy nhất: "không áp dụng ở cấp phạm vi này".** Nó
không thể có nghĩa "tất cả", vì "tất cả" đã được tuyên bố bằng `scope_level`.
Và nó không thể có nghĩa "chưa xác định", vì `CHECK` không cho ghi.

### Ba thứ thiết kế này mua được

**① Rủi ro R4 biến mất hoàn toàn.** Phép so khớp không còn một `IS NULL` nào:

```sql
CASE a.scope_level
  WHEN 'ORDER'     THEN TRUE
  WHEN 'SITE'      THEN a.site_id = r.site_id
  WHEN 'LINE'      THEN a.line_id = r.line_id
  WHEN 'OPERATION' THEN a.style_operation_id = r.style_operation_id
END
```

**② Quên nhập không còn nới quyền.** Quên chọn chuyền ở cấp `LINE` → `CHECK`
từ chối. Muốn phạm vi rộng thì phải **cố ý chọn** `ORDER`.

**③ Đọc ra ý định.** `scope_level = 'ORDER'` nói rõ *"cố ý giao toàn bộ PO"*.
Ba cột NULL không nói được điều đó.

---

## Tóm tắt cho Migration 028

| Việc | Quyết định |
|---|---|
| Bảng mới | **`production_sites`** — một bảng, không phải hai |
| Tên | `production_sites`, **không** `factories` |
| `operations` | **KHÔNG tạo** — dùng `style_operations` đã có |
| Dữ liệu mẫu | **Không sinh dòng nào**, kể cả `production_sites` |
| `sewing_lines` | thêm `site_id` nullable — NULL = *chưa gán*, nghiệp vụ phải gán |
| `orders.factory_name` | **không đụng** |
| `scope_level` | khai ở migration **029** cùng bảng `assignments` |

Migration 028 nhẹ hơn dự kiến: **một bảng mới, một cột thêm, không dữ liệu**.
