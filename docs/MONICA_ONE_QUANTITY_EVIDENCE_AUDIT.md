# MONICA ONE — BẢN ĐỒ BẰNG CHỨNG CHO SỐ LƯỢNG

| | |
|---|---|
| **Trạng thái** | ✅ **PHASE 1 — AUDIT XONG.** ⛔ **CHƯA viết một dòng mã nào.** |
| **Ngày** | 08/08/2026 |
| **Nguồn** | Board Directive *EVIDENCE-FIRST DATA STANDARD* 08/08/2026 |
| **Người soạn** | Chief Solution Architect |
| **Phương pháp** | Quét **lược đồ CSDL thật** *(56 migration)* + mã ứng dụng. ⛔ Không suy đoán từ trí nhớ. |

---

## 0. BỐN CON SỐ CỦA BẢN AUDIT NÀY

```
14  phân hệ đã quét
32  bảng mang dữ liệu SỐ LƯỢNG
 5  bảng CÓ cột bằng chứng          ← 16 %
27  bảng ⛔ KHÔNG có gì               ← 84 %
 7  KHUÔN bằng chứng KHÁC NHAU cho cùng một bài toán
 3  thành phần tải lên riêng rẽ
```

🔴 **Con số đáng lo nhất ⛔ không phải `27`.** Nó là **`7`** — bảy cách khác
nhau để giải cùng một bài toán, trong một kho ⛔ chưa từng có ai đứng ra hợp
nhất. Thêm cái thứ tám sẽ rẻ hơn hợp nhất bảy cái cũ, và đó chính là cách một
hệ thống trôi tới chỗ ⛔ không sửa nổi.

---

## 1. 🔴 HAI PHÁT HIỆN BẢO MẬT — PHẢI ĐỌC TRƯỚC KHI LÀM GÌ

### 1.1 P0 · **Kho bằng chứng đang CÔNG KHAI với cả internet**

`013_storage_evidences.sql` — đo trên tệp migration đang chạy:

```sql
INSERT INTO storage.buckets (id, name, public, ...) VALUES ('evidences', ..., true, ...);

CREATE POLICY "evidences_public_read" ON storage.objects
  FOR SELECT TO public          -- 🔴 `public` = KỂ CẢ NGƯỜI CHƯA ĐĂNG NHẬP
  USING (bucket_id = 'evidences');
```

Chính tệp đó tự khai: *"Bucket đặt `public = true` … nghĩa là **BẤT KỲ AI có
đường dẫn đều xem được**."*

🔴 Board §7 nói ngược lại: *"⛔ Không dùng public URL nếu làm lộ dữ liệu."*

⚠️ Nghĩa là **ngay lúc này**: ảnh sản lượng · packing list · biên bản lỗi · PO
của khách — ai có URL đều mở được, **⛔ không cần đăng nhập, ⛔ không qua RLS**.
Đường dẫn có dạng `po/<userId>/<ngày>/<uuid>.pdf`; `uuid` khó đoán, nhưng
*"khó đoán"* **⛔ không phải** *"được phân quyền"*.

⇒ **Mở rộng bằng chứng ra 27 bảng nữa TRƯỚC KHI vá chỗ này là nhân lỗ hổng lên
27 lần.** Đây là **điều kiện tiên quyết**, ⛔ không phải việc làm song song.

✅ **ĐÃ CHỨNG MINH BẰNG HÀNH VI 08/08/2026** — tải một tệp bằng phiên `md001`
rồi gọi URL bằng `fetch` trần *(⛔ không cookie, ⛔ không `apikey`)*:
**`HTTP 200`**. Kế hoạch xử lý:
[`MONICA_ONE_EVIDENCE_SECURITY_PLAN.md`](MONICA_ONE_EVIDENCE_SECURITY_PLAN.md).

> 🧾 **Khuôn dùng lại cho mọi phân hệ:** [`MONICA_ONE_EVIDENCE_DNA.md`](MONICA_ONE_EVIDENCE_DNA.md)
> — 27 điểm còn thiếu ở đây triển khai theo **đúng một** khuôn đó, ⛔ không mỗi
> phân hệ một kiểu.

🔑 **Và đo được một điều đổi hẳn mức khẩn:** kho hiện có **0 tệp**, CSDL có **0
tham chiếu**. Vá lúc này tốn **một migration**; vá khi có 5.000 tệp tốn thêm
một cuộc di trú và một khoảng hệ thống chạy nửa chừng.

### 1.3 🔴 P0-b · **PDF ⛔ KHÔNG tải lên được** — khuyết tật ĐANG CHẠY

Phát hiện khi đo kho lưu trữ:

```
PDF  → BỊ TỪ CHỐI: mime type application/pdf is not supported
PNG  → ĐƯỢC
```

`upload-action.ts` **có** `application/pdf` trong allowlist ứng dụng, nhưng
`allowed_mime_types` của **bucket** ⛔ chưa bao giờ cập nhật theo. Hai allowlist,
chỉ một cái được sửa.

🔴 **Khuyết tật của chính tôi, đã đẩy lên nhánh chạy thật.** Khối *"đính kèm
hình ảnh & tài liệu"* của form PO mời người dùng chọn PDF, và Supabase từ chối.

### 1.2 P1 · Người tải lên **tự xoá được** bằng chứng, ⛔ không vết

```sql
CREATE POLICY "evidences_authenticated_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'evidences' AND owner = auth.uid());
```

Người ghi nhận sản lượng **tự xoá được** ảnh chứng minh chính con số họ khai —
và ⛔ **không dòng `activity_log` nào** ghi việc đó.

🔑 Đây đúng họ khuyết tật với lỗ hổng `activity_log` vừa đóng bằng `056`: **kẻ
sửa dữ liệu tự xoá được dấu vết của mình.** Board §8 đòi `WHO · WHAT · WHEN ·
WHERE`; hiện ⛔ không có gì.

---

## 2. BẢN ĐỒ — 32 ĐIỂM SỐ LƯỢNG

> **Ưu tiên** theo Board §17: `P0` = ảnh hưởng PO/sản xuất/giao hàng/tài chính ·
> `P1` = QA/NPL/kho/BOM · `P2` = KPI và phụ trợ.

### 2.1 ✅ ĐÃ CÓ bằng chứng — **5/32**

| Module | Bảng | Số lượng | Nơi nhập | Bằng chứng | Ảnh | Tệp | Audit | Quyền | Thiếu gì |
|---|---|---|---|---|---|---|---|---|---|
| MD | `orders` | `total_quantity` | Order Master | `evidence_path` + `md_documents` | ✅ | ✅ | ✅ | MD | — *(mẫu tham chiếu)* |
| MD | `material_requests` | `quantity` | Phiếu NPL | `evidence_path` | ✅ | ⚠️ PDF | ⚠️ | MD | **1 tệp duy nhất**, ⛔ không xem lại được |
| MD | `production_orders` | `planned_qty` | Lệnh sản xuất | `evidence_path` | ✅ | ⚠️ PDF | ⚠️ | MD | như trên |
| Kho | `material_inspections` | `inspected_qty` | Kiểm NPL | `evidence_path` | ✅ | ⚠️ PDF | ⚠️ | kho | như trên |
| QA | `qa_defects` | `quantity` | Ghi lỗi | `image_url` | ✅ | ⛔ | ⛔ | qa | **⛔ chỉ ảnh**, ⛔ không tệp |

⚠️ Bốn dòng dưới cùng dùng **một cột `TEXT` = một tệp**. Đính tệp thứ hai là
**ghi đè tệp thứ nhất** — mất bằng chứng, ⛔ không cảnh báo.

### 2.2 🔴 P0 — ảnh hưởng PO · sản xuất · giao hàng · tài chính *(9 bảng)*

| Module | Bảng | Số lượng | Nơi nhập | Bằng chứng | Thiếu gì |
|---|---|---|---|---|---|
| MD | `order_size_breakdown` | `quantity` | PO 360° | ⛔ | 🔴 **Số lượng theo MÀU × SIZE — cơ sở để cắt, đóng thùng, kiểm AQL** |
| MD | `order_items` | `quantity` | PO | ⛔ | dòng hàng của đơn |
| Cắt | `cut_tickets` | `total_planned_pcs` · `total_actual_pcs` · `ply_count` | Tổ trưởng cắt | ⚠️ **`cut_attachments` (bảng riêng)** | có bảng đính kèm nhưng **⛔ không gắn với con số nào** |
| Cắt | `cut_bundles` | `quantity` | Bó hàng | ⛔ | |
| May | `hourly_production_logs` | `actual_qty` · `rework_qty` | Tổ trưởng may | ⛔ | 🔴 **sản lượng theo GIỜ — chỉ số điều hành chính** |
| May | `daily_production_logs` | `actual_qty` · `defect_qty` | Báo cáo ngày | ⛔ | 🔴 |
| Hoàn thành | `finishing_logs` | `ironing_qty` · `trimming_qty` · `final_qc_passed_qty` · `final_qc_defect_qty` | Tổ hoàn thành | ⛔ | 🔴 **số qua QC cuối — quyết định xuất hay ⛔ không** |
| Xuất hàng | `cartons` | `quantity_per_carton` · `net_weight_kg` · `gross_weight_kg` | Đóng thùng | ⛔ | 🔴 **packing list · cân thật** |
| Gia công ngoài | `assignment_daily_reports` | `output_qty` · `defect_qty` · `rework_qty` | Nhà thầu tự khai | ⛔ | 🔴 **NHÀ THẦU TỰ KHAI, ⛔ KHÔNG AI ĐỐI CHỨNG** |

🔴 **Dòng cuối là điểm nặng nhất của cả bản đồ.** Nhà thầu bên ngoài tự nhập
sản lượng và **⛔ không có bất kỳ bằng chứng nào** đi kèm. Đây là chỗ tiền chảy
ra ngoài dựa trên một con số ⛔ không ai kiểm được.

### 2.3 🟠 P1 — QA · NPL · kho · BOM *(11 bảng)*

| Module | Bảng | Số lượng | Bằng chứng | Thiếu gì |
|---|---|---|---|---|
| QA | `qa_audit_reports` | `inspected_qty` · `passed_qty` · `defect_qty` | ⛔ | 🔴 **kết quả AQL — cơ sở nhận/từ chối lô** |
| Kho | `inbound_receipt_items` | `declared_qty` · `received_qty` · `accepted_qty` · `rejected_qty` · `variance_qty` | ⛔ | 🔴 **lệch nhập kho ⛔ không có ảnh** |
| Kho | `outbound_issue_items` | `requested_qty` · `picked_qty` · `issued_qty` · `shortage_qty` | ⛔ | thiếu hàng khi xuất |
| Kho | `stock_adjustments` | `adjust_qty` | ⛔ | 🔴 **điều chỉnh tồn — luôn cần chứng cứ** |
| Kho | `stock_count_items` | `counted_qty` · `system_qty` · `variance_qty` | ⛔ | 🔴 **kiểm kê lệch** |
| Kho | `stock_movements` | `qty` | ⛔ | sổ di chuyển |
| Kho | `warehouse_transactions` | `quantity` | ⛔ | |
| Kho | `stock_levels` · `stock_reservations` · `materials` | tồn · giữ chỗ · tồn tối thiểu | ⛔ | ⚪ **DẪN XUẤT** — xem §3 |
| MD | `style_bom` | `consumption_per_pcs` · `net_consumption` | ⛔ | định mức NPL |
| Mua hàng | `purchase_order_items` | `ordered_qty` · `received_qty` · `outstanding_qty` | ⛔ | |

### 2.4 ⚪ P2 — phụ trợ và dẫn xuất *(7 bảng)*

`costings.quantity` · `costing_items.amount` · `inquiries.expected_qty` ·
`assignments.assigned_qty` · `sewing_lines.target_pcs_per_hour` ·
`wh_bins.capacity_qty` · `stock_reservations.reserved_qty`

---

## 3. ⚠️ MỘT PHÂN BIỆT QUAN TRỌNG — ⛔ KHÔNG PHẢI SỐ NÀO CŨNG CẦN BẰNG CHỨNG

🔑 **Số ĐO ĐƯỢC** cần bằng chứng. **Số TÍNH RA** thì ⛔ không — nó cần **công
thức đúng** và **nguồn đúng**.

| Loại | Ví dụ | Cần bằng chứng? |
|---|---|---|
| **Đo/đếm thật** | `actual_qty` · `counted_qty` · `received_qty` · `output_qty` | ✅ **CÓ** — ai đó đã đứng đếm |
| **Cam kết / kế hoạch** | `total_quantity` · `planned_qty` · `ordered_qty` | ✅ **CÓ** — chứng từ khách/hợp đồng |
| **Dẫn xuất** | `variance_qty` · `outstanding_qty` · `available_qty` · `net_consumption` | ⛔ **KHÔNG** — chúng là **hiệu của hai số khác**; đính bằng chứng vào đây là mời người dùng tin một con số ⛔ không ai nhập |

⚠️ Gắn ô tải lên vào một cột dẫn xuất là **sai kiến trúc**, ⛔ không phải thừa
tính năng: nó tạo ra bằng chứng cho một con số mà **CSDL tự tính**, và lần sau
công thức đổi thì bằng chứng đó nói dối.

⇒ **Sau khi trừ dẫn xuất: ~24 điểm thật sự cần bằng chứng, ⛔ không phải 32.**

---

## 4. 🔴 BẢY KHUÔN CHO CÙNG MỘT BÀI TOÁN

| Khuôn | Bảng | Chứa được | Vấn đề |
|---|---|---|---|
| `evidence_path TEXT` | `orders` · `material_requests` · `production_orders` · `material_inspections` · `inbound_receipts` · `capa_logs` · `shipments` | **1 tệp** | tệp thứ hai **ghi đè** tệp thứ nhất |
| `image_url TEXT` | `qa_defects` | 1 ảnh | ⛔ không nhận tệp |
| `evidence_image_url TEXT` | `needle_break_logs` | 1 ảnh | tên khác, việc giống |
| `attachment_url TEXT` | `sample_submissions` | 1 tệp | tên thứ tư cho cùng một thứ |
| `attachment_urls TEXT[]` | `communications` | nhiều | ⛔ không có tên tệp, ⛔ không loại, ⛔ không người tải |
| `defect_evidence_urls TEXT[]` | `subcon_receipt_logs` | nhiều | như trên |
| **`md_documents` (bảng riêng)** | MD | **nhiều, có metadata** | ✅ **khuôn ĐÚNG NHẤT** — nhưng chỉ MD dùng |
| *(+)* `cut_attachments` (bảng riêng) | Cắt | nhiều | khuôn thứ tám, **song song** với `md_documents` |

🔑 **`md_documents` đã là câu trả lời** — `entity_type · entity_id · doc_type ·
title · storage_path · file_size · mime_type · version · uploaded_by`. Nó có
đủ `WHO · WHAT · WHEN · WHERE` mà Board §8 đòi.

⇒ Vấn đề ⛔ **không phải thiếu thiết kế**. Vấn đề là **thiết kế đúng chỉ được
dùng ở một phân hệ**, còn bảy phân hệ khác mỗi nơi tự chế một kiểu.

---

## 5. BA THÀNH PHẦN GIAO DIỆN — cũng ⛔ không thống nhất

| Thành phần | Dùng ở | Nhận | Số tệp |
|---|---|---|---|
| `components/evidence-upload.tsx` | `md-forms` | ảnh + PDF | **1** |
| `components/quantity-input-with-evidence.tsx` | `to-truong-cat` | ảnh | 1 · **có gắn ô số lượng** |
| `app/(dashboard)/md/po-dinh-kem.tsx` | Order Master | ảnh + PDF | **nhiều** |

🔑 `quantity-input-with-evidence.tsx` là thứ **gần nhất với ý Board §10**: ô số
lượng **và** bằng chứng đứng cạnh nhau. Nhưng nó chỉ **một phân hệ dùng**, và
chỉ nhận **một ảnh**.

---

## 6. 🔴 NĂM ĐIỂM CẦN BOARD QUYẾT — ⛔ TÔI ⛔ KHÔNG TỰ ĐẶT LUẬT

Board §9 · §13 ghi rõ: ⛔ không tự đặt rule nghiệp vụ, ⛔ không tự đổi CSDL/RLS
khi chạm governance.

### Q1 · 🔴 Kho bằng chứng công khai — vá **TRƯỚC** hay **SONG SONG**?

Đề nghị: **TRƯỚC**. Mở rộng ra 24 điểm khi kho còn công khai là nhân lỗ hổng
lên 24 lần. Cần **ADR + migration** đổi bucket sang `private` + Signed URL.

### Q2 · Xoá bằng chứng — ai được, và có phải ghi vết?

Hiện: người tải **tự xoá được**, ⛔ không vết. Board §8 đòi truy vết.
Ba lựa chọn: ⛔ không cho xoá *(chỉ thay thế, giữ phiên bản)* · cho xoá + bắt
buộc ghi `activity_log` · cho xoá trong `N` phút đầu.

### Q3 · Chứng từ đã `COMPLETED`/`SHIPPED` — còn đính bằng chứng được ⛔ không?

`document-lock.ts` khoá **nội dung**. Bằng chứng ⛔ **chưa có quy định**.
🔑 Có lý do nghiệp vụ thật để **cho phép**: biên bản giao nhận thường về **sau**
khi đơn đóng. Nhưng đó là **quyết định nghiệp vụ**, ⛔ không phải kỹ thuật.

### Q4 · Nhà thầu ngoài tự khai sản lượng — bằng chứng **bắt buộc** hay tuỳ chọn?

`assignment_daily_reports` là chỗ **tiền chảy ra ngoài** dựa trên số nhà thầu
tự nhập. Bắt buộc ảnh sẽ chặn được khai khống — nhưng cũng chặn luôn việc khai
khi mạng xưởng hỏng.

### Q5 · Bằng chứng cho số **DẪN XUẤT** — có gắn ⛔ không?

Đề nghị **⛔ KHÔNG** *(§3)*. Cần Board xác nhận để ⛔ không ai *"bổ sung cho
đủ"* về sau.

---

## 7. ĐỀ XUẤT PATTERN — PHASE 2, ⛔ CHƯA THI HÀNH

> Chỉ là **đề xuất**. ⛔ Không migration, ⛔ không mã, cho tới khi Board duyệt
> Q1–Q5.

### 7.1 Mô hình dữ liệu — **mở rộng `md_documents`**, ⛔ không tạo bảng thứ chín

`md_documents` đã có đủ trường. Đề nghị:

1. **Đổi tên khái niệm** → *bảng bằng chứng dùng chung của MONICA ONE*
   *(⛔ không đổi tên bảng — đổi tên là gãy 4 service đang đọc nó)*.
2. Mở rộng `ENTITY_TYPES` cho các phân hệ khác.
3. Thêm **`field_name`** — để bằng chứng gắn vào **đúng CON SỐ**, ⛔ không chỉ
   vào bản ghi. Board §4: *"Evidence phải thuộc về đúng đối tượng."*
   > `PO-2601 → total_quantity → 3 ảnh` **khác** `PO-2601 → 3 ảnh`.

### 7.2 Thành phần dùng chung

```
<KhoiBangChung entity="ORDER" id={poId} field="total_quantity" />
   ├── nút Thêm ảnh · Thêm tệp   (ảnh + PDF, nhiều tệp)
   ├── danh sách đã đính kèm     (tên · loại · người · lúc)
   └── xem trước ảnh · mở tệp
```

Một thành phần. Ba thành phần cũ **⛔ không xoá** *(ràng buộc giao diện #2)* —
chúng ngừng được dùng ở mã mới, và gỡ dần theo một nợ có tên.

### 7.3 Thứ tự thi hành

```
Q1 (kho riêng tư)  →  pattern  →  MD làm mẫu  →  P0 (9 bảng)  →  P1  →  P2
```

Board §14: MD làm module tham chiếu — và MD **đã có sẵn** `md_documents` +
`po-dinh-kem`, nên nó là chỗ rẻ nhất để chứng minh pattern.

---

## 8. ⚠️ ĐIỀU BẢN AUDIT NÀY **⛔ CHƯA** LÀM ĐƯỢC

- ⛔ **Chưa** đối chiếu từng bảng với **màn hình thật** — bản đồ này dựng từ
  **lược đồ + mã**, nên một bảng có cột số lượng mà ⛔ không màn hình nào nhập
  vào sẽ vẫn xuất hiện ở đây. Cần một vòng đi qua giao diện để loại chúng.
- ⛔ **Chưa** đo **RLS của từng bảng** — Board §7 đòi kiểm `internal · external ·
  MD · manager · admin`. Việc đó thuộc Phase 2, sau khi biết pattern gắn vào đâu.
- ⛔ **Chưa** đếm **dung lượng** bằng chứng sẽ phát sinh. 24 điểm × nhiều tệp là
  một con số vận hành thật, và nó ⛔ chưa được ước lượng.
