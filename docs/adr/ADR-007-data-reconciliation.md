# ADR-007 · DATA RECONCILIATION — ĐỐI SOÁT DỮ LIỆU LỊCH SỬ

| | |
|---|---|
| **Trạng thái** | 🟡 CHỜ PHÊ DUYỆT |
| **Ngày** | 01/08/2026 |
| **Quyết định bởi** | Kiến trúc sư trưởng |
| **Soạn** | Claude |
| **Liên quan** | Hiến pháp III.1 · ADR-006 (Permission Engine) · Migration 031 |

---

## 1. CONTEXT — BỐI CẢNH

### 1.1 Sự việc đo được

Khi kiểm chứng Buyer Portal bằng khách hàng thật (01/08/2026), phát hiện:

```
orders: 3 dòng lịch sử · customer_id IS NULL  →  3/3
```

`mos_buyer_can_see_order()` so `o.customer_id = mos_buyer_customer_id()`.
Trong SQL, `NULL = <bất kỳ>` cho ra `NULL`, không phải `TRUE`. Hệ quả:

> **Buyer Portal hôm nay không thể trả về một dòng nào — bất kể RLS đúng hay sai.**

Điều này **không phải lỗi phân quyền**. Đo bằng dữ liệu có `customer_id` hợp lệ
cho kết quả **21/21 đạt**: thấy đúng đơn của mình, không lọt đơn khác, chặn
sạch 10 bảng cấm, không ghi được. **Cơ chế đúng. Dữ liệu thiếu.**

### 1.2 Vì sao cám dỗ "vá bằng migration" là bẫy

`orders.customer_name` là `VARCHAR` tự do, không phải khoá ngoại:

| `po_number` | `customer_name` | có khách tương ứng? |
|---|---|---|
| `PO20260707732662` | `ZIBUYU` | ✅ có (`KHZBY`) |
| `PO-M2601` | `Adidas Global` | ❌ không |
| `PO-M2602` | `Uniqlo Casual` | ❌ không |

Một câu `UPDATE ... WHERE customer_name = c.name` sẽ **khớp đúng 1/3** và im
lặng bỏ lại 2 dòng. Tệ hơn: không ai biết `'Adidas Global'` là khách hàng thật
chưa nhập, hay chỉ là **tên nháp trong dữ liệu dựng thử**. Migration đoán sai
ở đây nghĩa là **gắn dữ liệu đơn hàng và tài chính vào sai pháp nhân**.

---

## 2. DECISION — QUYẾT ĐỊNH

### 2.1 Nguyên tắc gốc *(đã nâng lên Hiến pháp III.1)*

> **Migration không được tự suy diễn dữ liệu nghiệp vụ.
> Khi không chắc chắn, giữ `NULL` còn tốt hơn ghi sai dữ liệu.**

### 2.2 Bốn điều khoản thi hành

**① Dữ liệu lịch sử chưa xác định → GIỮ `NULL`.**
Không migration nào được suy ra `customer_id` từ `customer_name`, từ thứ tự
thời gian, hay từ bất kỳ phép đoán nào. `NULL` là phát biểu trung thực
"chưa ai xác định"; giá trị đoán là phát biểu sai **không phân biệt được với
sự thật**.

**② Buyer Portal CHỈ hiển thị PO đã liên kết đúng `customer_id`.**
Đây là hành vi **fail-closed** và là hành vi **đúng**: khách hàng không bao giờ
được thấy một đơn mà hệ thống chưa chắc là của họ. Đơn chưa đối soát thì vô
hình với Buyer — không phải lỗi, mà là an toàn.

**③ Màn hình *Customer Mapping* trong System Administration.**
Người liên kết là **con người** (Quản trị hoặc Merchandiser), không phải câu lệnh.

| yêu cầu | nội dung |
|---|---|
| Ai được dùng | `superadmin`, `md` |
| Thao tác | chọn PO chưa liên kết → chọn Customer → xác nhận |
| Hiển thị | `po_number` · `customer_name` (chuỗi cũ) · ngày tạo · người tạo |
| ⚠️ Gợi ý | được **gợi ý** khách khớp tên, nhưng **KHÔNG tự chọn sẵn**. Người dùng phải chủ động bấm. |
| Audit Trail | **BẮT BUỘC** — ai · lúc nào · PO nào · từ giá trị nào sang giá trị nào |
| Gỡ liên kết | được, và cũng ghi Audit Trail |

**④ Từ ngày vận hành chính thức: PO mới BẮT BUỘC có `customer_id`.**

⚠️ **Không dùng `ALTER COLUMN ... SET NOT NULL`.** Lệnh đó áp ngược lên dữ liệu
cũ và sẽ **đổ ngay** vì 3 dòng lịch sử đang `NULL` — hoặc tệ hơn, ép người ta
vá bừa cho lệnh chạy được, đúng thứ điều khoản ① cấm.

Dùng ràng buộc **theo mốc thời gian**:

```sql
ALTER TABLE public.orders
  ADD CONSTRAINT orders_customer_required_after_golive
  CHECK (created_at < '<NGÀY_GO_LIVE>'::timestamptz OR customer_id IS NOT NULL)
  NOT VALID;                    -- NOT VALID: không quét lại dòng cũ
```

`NOT VALID` khiến ràng buộc áp cho **mọi dòng mới và mọi lần sửa**, nhưng
**không** kiểm lại quá khứ. Dữ liệu lịch sử vẫn `NULL` một cách hợp lệ.

> `<NGÀY_GO_LIVE>` do Kiến trúc sư ấn định. Chưa có ngày thì **chưa viết
> migration này** — đúng tinh thần "không chắc thì đừng ghi".

---

## 3. ALTERNATIVES — PHƯƠNG ÁN ĐÃ CÂN NHẮC VÀ LOẠI

| phương án | vì sao loại |
|---|---|
| **Migration khớp `customer_name` rồi gán** | Vi phạm III.1. Khớp 1/3, im lặng bỏ 2. Sai thì không phát hiện được. |
| **Tạo khách "Chưa xác định" rồi trỏ hết vào** | Biến `NULL` trung thực thành một giá trị **trông như đã xác định**. Mất luôn khả năng lọc ra việc còn tồn. |
| **Cho Buyer thấy cả đơn `customer_id IS NULL`** | Rò dữ liệu khách này sang khách khác. Không bao giờ. |
| **Chặn toàn hệ thống tới khi đối soát xong** | Ba đơn lịch sử không đáng để dừng vận hành. Fail-closed đã đủ an toàn. |
| **`SET NOT NULL` ngay** | Đổ vì dòng cũ, và tạo áp lực vá bừa. |

---

## 4. CONSEQUENCES — HỆ QUẢ

### 4.1 Được

- Không dòng nào bị gán sai chủ. Sai sót do người thì **có tên và có dấu vết**.
- Buyer Portal an toàn ngay cả khi đối soát chưa xong.
- Số đơn chưa liên kết trở thành **chỉ số công việc đếm được**, không phải nợ ẩn.

### 4.2 Mất / phải chấp nhận

- Buyer **chưa thấy gì** cho tới khi có người đối soát. Phải nói rõ với nghiệp vụ.
- Phải xây thêm một màn hình.
- Mọi truy vấn `orders` phải chịu được `customer_id IS NULL` — **không được
  `INNER JOIN customers`**, nếu không đơn lịch sử sẽ **biến mất khỏi màn hình
  nội bộ**. Đây là rủi ro dễ mắc nhất của quyết định này.

  ✅ **Đã kiểm, hiện chưa vướng:** không có `!inner` nào trong toàn bộ mã
  nguồn (`*.ts`, `*.tsx`). PostgREST mặc định nhúng kiểu **trái**, nên
  `customers ( name )` trả `null` chứ không loại dòng. Bốn vị trí đang nhúng
  `customers` — `style.service.ts:51` và `commercial.service.ts:130,142,205,260`
  — đều an toàn.

  ⚠️ Đây là trạng thái **hôm nay**, không phải bảo đảm. Thêm một chữ `!inner`
  là đủ làm đơn lịch sử biến mất **trong im lặng**. Xem việc số 1 ở dưới.

### 4.3 Việc phải làm

| # | việc | phụ thuộc |
|---|---|---|
| 1 | ✅ **xong** — đã rà, không có `!inner` nào. Cần thêm **một mục kiểm hồi quy** cấm `!inner` trên `customers`, vì đây là thứ hỏng trong im lặng | — |
| 2 | Màn hình Customer Mapping + Audit Trail | — |
| 3 | Chỉ số "PO chưa liên kết khách" trên Dashboard quản trị | sau (2) |
| 4 | Ràng buộc theo mốc `go-live` | **chờ Kiến trúc sư ấn định ngày** |

---

## 5. ROLLBACK IMPACT — ẢNH HƯỞNG KHI QUAY LUI

Quyết định này **không viết gì vào dữ liệu**, nên rollback rẻ:

- Điều ①②③: chỉ là chính sách + một màn hình. Gỡ màn hình là xong.
- Điều ④: `ALTER TABLE ... DROP CONSTRAINT orders_customer_required_after_golive;`
- **Không có dữ liệu nào cần hoàn nguyên** — vì cố ý không ghi gì cả. Đó cũng
  chính là lý do phương án này an toàn hơn mọi phương án vá dữ liệu.

---

## 6. REFERENCES

- Hiến pháp **III.1** — Migration không được tự suy diễn dữ liệu nghiệp vụ
- Hiến pháp **V.1** — Không được Audit bằng bảng rỗng
- Hiến pháp **VIII** — Business Event & Audit *(yêu cầu Audit Trail của điều ③)*
- `docs/analysis/031-rls-impact-analysis.md` — nơi phát hiện `customer_id IS NULL`
- `docs/RLS_COVERAGE_MATRIX.md` Mục 2 — kết quả đo Buyer 21/21
- `supabase/migrations/018_mos_foundation.sql` dòng 141–153 — `mos_buyer_can_see_order()`
- `supabase/seeds/S001_business_baseline.sql` — đơn `SEED-PO-0001` có `customer_id` hợp lệ
