# ADR-027 — Lưu trữ mềm cho ba bảng MD · và khoá PO ở tầng CSDL

| | |
|---|---|
| **Trạng thái** | 🔴 **ĐỀ XUẤT — CHỜ BOARD.** ⛔ **CHƯA chạy một dòng SQL nào.** |
| **Ngày** | 07/08/2026 |
| **Người soạn** | Chief Solution Architect |
| **Nguồn nghiệp vụ** | Board Decision 07/08/2026 — `BUG-4` · `BUG-5` · *"Khóa theo Workflow"* |
| **Thay thế / bổ sung** | bổ sung [ADR-018](ADR-018-thu-hep-quyen-md.md) §9.3 `TD-25` · dùng lại engine của [ADR-019](ADR-019-aggregate-immutability.md) |
| **Phản biện độc lập** | ⛔ **CHƯA có** — ADR-011 §2.2 bắt buộc với thay đổi chạm RLS |

---

## 1. VÌ SAO CÓ TÀI LIỆU NÀY

Board Decision 07/08/2026 ra **hai điều khoản ⛔ không thi hành trọn vẹn được
bằng mã ứng dụng**:

> `BUG-5` — *"**⛔ Không Delete vật lý. Chỉ Archive.**"*
> *"Khóa theo Workflow"* — *"**PO đã sinh Production Order thì phải khóa.**"*

Bản vá 07/08/2026 đã thi hành **phần làm được ngay**:

| Điều khoản | Đã làm | ⛔ Còn thiếu |
|---|---|---|
| Update cho 8 chứng từ | ✅ `revisions.actions.ts` + `updatePo` | — |
| Khoá theo workflow | ✅ `lib/mos/md/document-lock.ts`, áp ở mọi Server Action | 🔴 **tầng CSDL** |
| Re-open chỉ Giám đốc | ✅ `reopenOrder` ở `/orders` | 🔴 **tầng CSDL** |
| Version History | ✅ ảnh chụp vào `activity_log` *(sổ chỉ-ghi-thêm, `041`)* | 🔴 **trigger CSDL** |
| Archive — Khách hàng · RFQ · Chiết tính · Mã hàng | ✅ dùng trạng thái **có thật** | — |
| Archive — **Tech Pack · BOM · Yêu cầu NPL** | ⛔ **KHÔNG** | 🔴 **thiếu cột** |

🔑 **Ba dòng 🔴 ⛔ không phải là việc chưa làm xong. Chúng là việc ⛔ KHÔNG
LÀM ĐƯỢC nếu ⛔ không đổi lược đồ** — và đổi lược đồ đang bị `SECURITY FREEZE`
*(`MOS §XI.1`)* chặn: *"⛔ Không migration mới nào được khởi tạo."*

---

## 2. ⛔ ĐIỀU ĐÃ BỊ BÁC — VÀ VÌ SAO

### 2.1 ⛔ Mượn một trạng thái sẵn có làm "đã lưu trữ"

`material_requests` **có** `REJECTED`. Ghi nó khi người dùng bấm *"Lưu trữ"* sẽ
làm bài kiểm xanh ngay hôm nay.

🔴 **BÁC.** *"Bị từ chối"* ⛔ **không** đồng nghĩa *"đã lưu trữ"*. Ghi nó là
**ghi một sự kiện nghiệp vụ ⛔ CHƯA TỪNG XẢY RA vào CSDL**, và mọi báo cáo
*"tỷ lệ yêu cầu NPL bị từ chối"* từ đó về sau đọc ra là **dối**. CLAUDE.md §2.5:
*"`NULL` là phát biểu trung thực"* — thiếu một chức năng còn trung thực hơn một
chức năng nói sai.

### 2.2 ⛔ Dựng "bia mộ" trong `activity_log` rồi lọc ở tầng đọc

Chạy được mà ⛔ không cần migration.

🔴 **BÁC.** Có **BA** chỗ đọc `md_documents` — `collaboration.service` ·
`po.service` · `po-twin.service`. Sót một chỗ ⇒ **hai màn hình cùng một hệ
thống trả lời khác nhau câu *"tài liệu này còn ⛔ không"***. Đó đúng loại lệch
kho mã này đã trả giá nhiều lần *(hai bảng đếm · hai bộ KPI)*. Một cột
`deleted_at` với **chỉ mục MỘT PHẦN** giải quyết dứt điểm; một mẹo ở tầng ứng
dụng thì ⛔ không.

### 2.3 ⛔ Nới ngưỡng bài kiểm cho qua

⛔ **BÁC** — `AC-1`. Xem §6.

---

## 3. ĐỀ XUẤT

### 3.1 Ba cột `deleted_at` / `deleted_by`

```
md_documents · style_bom · material_requests
  + deleted_at  TIMESTAMPTZ
  + deleted_by  UUID REFERENCES profiles(id)
```

Kèm **chỉ mục duy nhất MỘT PHẦN** ở các bảng có `UNIQUE` — xoá mềm xung khắc
`UNIQUE` *(CLAUDE.md §2.5)*:

```sql
CREATE UNIQUE INDEX ... ON material_requests (request_no) WHERE deleted_at IS NULL;
```

⚠️ Policy `SELECT` lọc `deleted_at IS NULL`; policy `UPDATE` **CỐ Ý ⛔ không
lọc** — giữ đường khôi phục. Đây là khuôn **đã chạy thật** ở `036_act_soft_delete`,
⛔ không phải thiết kế mới.

### 3.2 Đăng ký `orders` vào engine bất biến

⛔ **Không viết engine thứ hai.** `045`/`046` đã có sẵn và tự nói: *"Thêm
aggregate mới = thêm **một dòng dữ liệu**."*

```sql
INSERT INTO public.mos_aggregate_immutability
  (table_name, status_column, final_states, mutable_after_final, adr, note)
VALUES ('orders', 'status',
        ARRAY['COMPLETED','SHIPPED','CANCELLED'],
        ARRAY['status'],            -- chừa đúng đường Re-open
        'ADR-027', '…');
SELECT public.mos_attach_immutability_guard('orders');
```

🔑 `status` nằm trong `mutable_after_final` để `reopenOrder` còn chạy được —
đúng ranh giới `W.1`: **Workflow Engine** quyết phép chuyển, **engine bất biến**
giữ nội dung.

### 3.3 ⚠️ Phần engine hiện tại **⛔ KHÔNG** làm được

Engine `045` trả lời *"dòng này đã Final chưa"*. Nó **⛔ không** trả lời được
*"PO này đã sinh Production Order chưa"* — phép thử **cốt lõi** của chỉ thị
Board, vì nó cần đọc **bảng khác**.

⇒ Cần một trigger riêng trên `orders`, gọi hàm `SECURITY DEFINER` **⛔ không
tham số** rồi **so cột** *(quy tắc `K-3`)*. Hàm đó phải được ghi vào
[`SECURITY_DEFINER_REGISTRY.md`](../SECURITY_DEFINER_REGISTRY.md).

🔴 **Đây là phần cần phản biện độc lập kỹ nhất** — nó khoét một lỗ xuyên RLS.

---

## 4. TÍNH ĐẢO NGƯỢC *(§8.2 khối ②)*

| Phần | Mức | Ghi chú |
|---|---|---|
| Ba cột `deleted_at`/`deleted_by` | **ĐẢO ĐƯỢC** | `DROP COLUMN` — ⛔ chưa có dữ liệu nào ghi vào chúng lúc mới chạy |
| Chỉ mục một phần | **ĐẢO ĐƯỢC** | `DROP INDEX` |
| Policy `SELECT` lọc `deleted_at` | **ĐẢO ĐƯỢC** | khôi phục policy cũ |
| Dòng `orders` trong `mos_aggregate_immutability` | **ĐẢO ĐƯỢC** | `DELETE` một dòng + gỡ trigger |
| Trigger *"đã sinh lệnh sản xuất"* | **ĐẢO MỘT PHẦN** | gỡ được; ⛔ **không** hoàn lại các lượt `UPDATE` đã bị nó chặn |

---

## 5. PHÂN TÍCH TÁC ĐỘNG *(§8.2 khối ①)*

- **Ai mất quyền gì:** ⛔ không ai mất quyền đọc. Vai `md` mất quyền `UPDATE`
  lên `orders` đã `COMPLETED`/`SHIPPED`/`CANCELLED` — **đúng ý Board**.
- **Màn hình đổi hành vi:** `po-360-sheet` *(đã sẵn sàng — nó hỏi `docKhoaPo`)*;
  `document-center` *(nút Lưu trữ đang từ chối sẽ chạy được)*;
  `style-detail-sheet` · `md-flow-tables` *(mở được nút Lưu trữ)*.
- **Mã ứng dụng phải sửa theo:** gỡ ba lời từ chối ở `revisions.actions.ts`
  *(`archiveTechPack` · `archiveBom` · `archiveMaterialRequest`)* và điền
  `trangThaiLuuTru` trong `LUAT` của `document-lock.ts`.
- 🔑 **Bài kiểm đã cài sẵn lời nhắc:** `md-costing-operations.test.mjs` ⑨d
  khẳng định ba loại ấy **⛔ CHƯA lưu trữ được**. Nó sẽ **ĐỎ** đúng ngày
  migration chạy — buộc người sau quay lại mở khoá, ⛔ không quên.

---

## 6. 🔴 VÌ SAO ⛔ CHƯA CHẠY

| Rào | Trạng thái |
|---|---|
| `SECURITY FREEZE` *(`MOS §XI.1`)* | 🔴 **CÒN HIỆU LỰC** — `B2` chưa cắt *(`GPR-001` `A-3`)* |
| ADR phải duyệt TRƯỚC khi viết SQL *(Hiến pháp Điều 4 · CLAUDE.md §3)* | 🔴 **CHƯA duyệt** |
| Phản biện độc lập cho thay đổi chạm RLS *(ADR-011 §2.2)* | 🔴 **CHƯA có** |
| ⛔ Không có staging — `.env.local` trỏ **CSDL THẬT** *(§8.1)* | Người dùng tự chạy ở SQL Editor |

⚠️ **⛔ KHÔNG tự chạy, ⛔ KHÔNG tự sinh tệp trong `supabase/migrations/`.**
Bản nháp nằm ở `supabase/drafts/` — `arch.test` cấm để nháp trong `migrations/`,
và đó là hàng rào đúng.

---

## 7. HỆ QUẢ NẾU BOARD ⛔ KHÔNG DUYỆT

Ghi thẳng, ⛔ không giảm nhẹ:

1. **Tech Pack · BOM · Yêu cầu NPL ⛔ không lưu trữ được.** Nút bấm vào sẽ nhận
   câu từ chối kèm lý do — ⛔ không im lặng, nhưng cũng ⛔ không làm được việc.
2. **Xoá cứng tài liệu đã bị chặn** *(`deleteDocument` từ chối)*. Người dùng
   ⛔ không còn cách gỡ một tài liệu tải nhầm; lối thay thế là **Sửa** *(đổi tên
   · đổi loại · thay tệp kèm tăng phiên bản)*.
3. 🔴 **Khoá PO chỉ tồn tại ở tầng ứng dụng.** Ai gọi thẳng PostgREST hoặc chạy
   SQL bằng `service_role` vẫn sửa được đơn `COMPLETED`. CLAUDE.md §2.1 nói rõ:
   **hàng rào thật luôn nằm ở CSDL**. Bản vá hiện tại ⛔ **không** phải hàng rào
   — nó là chốt chặn giao diện + Server Action, và báo cáo đã ghi đúng như vậy.
4. **Version History ⛔ không đầy đủ.** Ghi thẳng vào bảng bằng SQL Editor sẽ
   **⛔ không** để lại phiên bản nào.
