# ADR-025 — Vòng đời Bó hàng qua gia công ngoài · và đơn vị của Định mức vải

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-025 |
| **Trạng thái** | ✅ **ĐÃ PHÊ DUYỆT** — **Board Directive 07/08/2026**: *"đồng ý để Claude sửa migration … duyệt tất cả để bạn sửa"* |
| **Người soạn** | Chief Solution Architect |
| **Thẩm quyền** | **Bậc 2 — ADR.** Ràng buộc mọi migration chạm `bundle_stage_enum` và `cut_tickets.bom_allowance_m` |
| **Phản biện độc lập** | ⛔ **chưa có** — Board uỷ quyền tự chạy trong phiên 07/08; ghi rõ ở §5 để rà sau |
| **Migration** | `047_bundle_lifecycle_and_bom_unit.sql` |
| **Đóng khuyết tật** | `G-6` · `G-8` · `G-12` *(`docs/PHIEN_TU_CHAY_2026-08-07.md`)* |

---

## 1. Context

### 1.1 Ba khuyết tật cùng gốc: **lược đồ ⟷ mã nói hai thứ khác nhau**

| Mã | Sự thật đo được |
|---|---|
| `G-12` | `bundle_stage_enum` *(migration `007b`)* có **bốn** giá trị `CUT · SEWING · FINISHING · PACKED`. Trigger của `009` gán `OUTSIDE_PROCESSING` và `SEWING_READY`; mã `/subcon` hỏi thêm `CUT_PASSED`. **⛔ Không giá trị nào trong ba tồn tại.** |
| `G-6` | `cut_tickets.bom_allowance_m` mang **hai đơn vị**: `SEED-CT-01 = 2,5` cho 1.188 sp *(mét/sp)* ⟷ `PK-2026-001 = 70` cho 50 sp *(giống tổng mét)* |
| `G-8` | `financial_records.order_id` trỏ tới UUID **⛔ không tồn tại** trong `orders` — ⛔ không ràng buộc khoá ngoại nào chặn |

### 1.2 Hậu quả `[VERIFIED]`

- `/subcon` **chết hoàn toàn**: `invalid input value for enum bundle_stage_enum: "CUT_PASSED"`, digest `2418174174`. Toàn bộ luồng **xuất – nhận gia công ⛔ chưa từng chạy được** kể từ `009`.
- Cờ *"vượt định mức"* trong `duLieuCatHomNay` **bật cho MỌI phiếu** — vì so `828,4 m` với `2,5 m`.
- Bảng công nợ subcon hiện *"⛔ không rõ đơn"*: ⛔ không truy được về PO nào.

### 1.3 🔑 Vì sao ⛔ không ai phát hiện

`supabase/seeds/S001` §cuối đã chép đúng lời giải:

> *"hai bảng RỖNG. Bảng rỗng thì ⛔ không ai audit; ⛔ không ai audit thì ⛔ không ai chạm vào lỗi khiến bảng rỗng."*

---

## 2. Decision

### 2.1 🔑 Thêm **MỘT** giá trị enum, ⛔ không phải ba

Ba giá trị mã đang hỏi ⛔ **không ngang giá nhau về nghiệp vụ**:

| Giá trị mã hỏi | Phán quyết | Lý do |
|---|---|---|
| `OUTSIDE_PROCESSING` | ✅ **THÊM** | Trạng thái **có thật và ⛔ không thay thế được**: bó hàng đang **nằm vật lý ở xưởng ngoài**. Chính trigger `009` ghi rõ mục đích — *"chặn chuyền may quét nhầm"*. Gộp nó vào `CUT` hay `SEWING` là **mất luôn phép chặn đó** |
| `SEWING_READY` | ⛔ **⛔ KHÔNG thêm** | Trùng nghĩa với `CUT`: *"đã cắt xong, chờ khâu sau"* **chính là** sẵn sàng cho chuyền may |
| `CUT_PASSED` | ⛔ **⛔ KHÔNG thêm** | Cũng trùng `CUT`; nó ⛔ chưa từng xuất hiện trong lược đồ, chỉ có trong **một câu truy vấn** của `/subcon` |

🔑 **Enum là từ vựng nghiệp vụ, ⛔ không phải chỗ chứa mọi chuỗi mã từng gõ nhầm.** Thêm hai giá trị trùng nghĩa là hợp thức hoá việc *"cùng một trạng thái có ba tên"* — và đó chính là cơ chế đẻ ra khuyết tật này.

⇒ Migration thêm `OUTSIDE_PROCESSING`; trigger `fn_process_subcon_receipt` sửa `SEWING_READY` → `CUT`; mã `/subcon` sửa `['CUT_PASSED','SEWING_READY']` → `['CUT']`.

**Vòng đời sau ADR này:**

```
CUT ──xuất gia công──▶ OUTSIDE_PROCESSING ──thu hồi──▶ CUT ──▶ SEWING ──▶ FINISHING ──▶ PACKED
```

### 2.2 `bom_allowance_m` = **mét trên MỘT sản phẩm**

Đây là nghĩa chuẩn của *"định mức vải"* trong ngành may: khách và nhà máy chốt định mức **theo sản phẩm**, ⛔ không theo lô — vì lô đổi số lượng liên tục còn định mức thì ⛔ không.

⇒ Phép so đúng là:

```
vượt định mức  ⟺  total_fabric_used_m  >  bom_allowance_m × total_planned_pcs
```

Dòng `PK-2026-001` *(70 m cho 50 sp)* là **dữ liệu nhập sai đơn vị**, ⛔ không phải cách dùng thứ hai ⇒ sửa thành `1,4`.
Migration thêm `COMMENT ON COLUMN` để đơn vị nằm **trong lược đồ**, ⛔ không nằm trong trí nhớ.

⚠️ ⛔ **KHÔNG** thêm `CHECK` chặn giá trị lớn: một sản phẩm áo khoác dài có thể thật sự cần > 5 m. Ngưỡng hợp lệ là **quyết định nghiệp vụ theo chủng loại**, ⛔ chưa có ⇒ ⛔ không bịa.

### 2.3 `financial_records.order_id` — dọn rồi mới khoá

⛔ **Không** thêm khoá ngoại trước khi dọn: ràng buộc sẽ **thất bại ngay** trên hai dòng mồ côi và **cả migration bị lùi**.
⇒ Thứ tự bắt buộc: ① trỏ lại đúng PO thật · ② `NOT VALID` FK · ③ `VALIDATE`.

`ON DELETE RESTRICT`, ⛔ **không** `CASCADE`: xoá một đơn hàng ⛔ **không được** âm thầm xoá **sổ công nợ** của nhà thầu. Tiền phải chặn việc xoá, ⛔ không im lặng biến mất.

---

## 3. Alternatives Considered

| Phương án | ⛔ Bị loại vì |
|---|---|
| **Thêm cả ba giá trị enum** | Hợp thức hoá *"một trạng thái ba tên"* — đúng cơ chế sinh ra `G-12` |
| **⛔ Không đụng enum, sửa trigger dùng `SEWING`** | Mất phép chặn *"chuyền may quét nhầm bó đang ở xưởng ngoài"* — mất hàng thật |
| **Đổi tên cột thành `bom_allowance_m_per_pc`** | Đổi tên cột đang dùng là **cửa một chiều** chạm nhiều màn hình; `COMMENT` đạt cùng mục đích với rủi ro gần bằng 0 |
| **`ON DELETE CASCADE` cho công nợ** | Xoá đơn hàng làm **bốc hơi sổ nợ nhà thầu** |
| **Xoá hai dòng `financial_records` mồ côi** | Mất **dữ liệu công nợ duy nhất** đang có; trỏ lại đúng PO giữ được nó |

---

## 4. Consequences

### 4.1 Được
- Luồng **xuất – nhận gia công chạy được lần đầu tiên** kể từ `009`
- Cảnh báo *"vượt định mức"* hết bật-mọi-dòng ⇒ trở lại **có nghĩa**
- Công nợ subcon truy được về PO; CSDL **chặn** việc tạo mới dòng mồ côi

### 4.2 Đánh đổi
- `ALTER TYPE … ADD VALUE` là **MỘT CHIỀU**: PostgreSQL ⛔ không cho xoá giá trị enum. Chấp nhận có ý thức — xem §5 khối ②.
- Bất kỳ mã nào còn gõ `SEWING_READY`/`CUT_PASSED` sẽ **lỗi to**, ⛔ không lỗi thầm. Đó là **chủ ý**.

### 4.3 Rủi ro
- ⚠️ ⛔ **Chưa đo** chi phí FK mới trên `financial_records` — bảng đang 2 dòng, `npm run bench` sẽ ⛔ không nói gì có ý nghĩa cho tới khi có dữ liệu thật.

---

## 5. ⚠️ Điều ADR này ⛔ KHÔNG khẳng định

- ⛔ **Chưa có phản biện độc lập.** Board uỷ quyền tự chạy trong phiên 07/08; ADR-011 §2.2 vẫn đòi rà chéo cho thay đổi lược đồ ⇒ **để mở**, rà ở vòng sau.
- ⛔ **Chưa nói gì về ngưỡng hao hụt vải** (`G-7`) — vẫn chờ Board.
- ⛔ **Chưa nói gì về `unit_price` của `orders`** (`G-9`) — ai nhập, có bắt buộc khi duyệt PO ⛔ không, vẫn chờ Board.
