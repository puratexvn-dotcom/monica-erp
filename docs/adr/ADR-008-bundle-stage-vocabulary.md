# ADR-008 · TỪ VỰNG VÒNG ĐỜI BÓ BÁN THÀNH PHẨM (`bundle_stage_enum`)

| | |
|---|---|
| **Trạng thái** | 🔴 **CHỜ PHÊ DUYỆT — CHẶN `S001` Phần B và toàn bộ phân hệ `/subcon`** |
| **Ngày** | 02/08/2026 |
| **Phát hiện bởi** | Gieo dữ liệu `S001` Phần B — `ERROR 22P02` |
| **Soạn** | Claude |

---

## 1. CONTEXT — BỐI CẢNH

### 1.1 Sự việc

Chạy `S001` Phần B đổ ngay tại `subcon_issue_logs`:

```
ERROR: 22P02: invalid input value for enum bundle_stage_enum: "OUTSIDE_PROCESSING"
CONTEXT: PL/pgSQL function fn_process_subcon_issue() line 4
```

Giao dịch **rollback toàn phần** — cơ sở dữ liệu không đổi một dòng nào. Đã đối
chiếu lại: `assignments` 2 · `subcon_*` 0/0/0 · sổ cái 1 · `cut_bundles` 3.

### 1.2 Gốc rễ: hai migration nói hai thứ tiếng khác nhau

| nguồn | từ vựng |
|---|---|
| `007b` dòng 9 — **định nghĩa enum** | `CUT` · `SEWING` · `FINISHING` · `PACKED` |
| `009` dòng 84 — trigger xuất gia công | `OUTSIDE_PROCESSING` ❌ |
| `009` dòng 125 — trigger thu hồi | `SEWING_READY` ❌ |
| `app/(dashboard)/subcon/actions.ts:45` | `CUT_PASSED` ❌ · `SEWING_READY` ❌ |
| `app/(dashboard)/subcon/actions.ts:63` | `OUTSIDE_PROCESSING` ❌ |

**Ba giá trị được dùng ở khắp nơi mà cơ sở dữ liệu chưa từng có.**

### 1.3 Hệ quả đang sống

- **`INSERT` vào `subcon_issue_logs` là bất khả thi kể từ migration `009`.**
  Trigger `AFTER INSERT` luôn ném `22P02`.
- `fn_process_subcon_receipt` cũng sẽ đổ vì `SEWING_READY`.
- Màn hình `/subcon` lọc theo `CUT_PASSED`/`SEWING_READY`/`OUTSIDE_PROCESSING`
  ⇒ **luôn trả về rỗng**.

> **Toàn bộ luồng xuất–nhận hàng gia công chưa từng chạy được.**

### 1.4 ⚠️ Vì sao không ai phát hiện — và đây mới là điều đáng lo nhất

Ba bảng `subcon_*` **rỗng**. Bảng rỗng thì không ai audit; không ai audit thì
không ai chạm vào lỗi khiến bảng rỗng.

**Bảng rỗng vì hỏng, và không bị phát hiện vì rỗng.** Vòng tròn khép kín.

Đây là bằng chứng mạnh nhất cho **Hiến pháp V.1** — *không được audit bằng bảng
rỗng*. Lỗi này nằm im từ migration `009` tới `038c`, qua mọi lần rà bảo mật, và
chỉ lộ ra đúng lúc có người **cố gieo một dòng thật vào**.

---

## 2. QUYẾT ĐỊNH CẦN CHIẾN LƯỢC SƯ CHỐT

Đây là **từ vựng Domain**, không phải lỗi kỹ thuật để tôi tự vá. Hiến pháp IV:
*không viết SQL trước khi ADR được xác nhận.*

### Câu hỏi ① — `CUT_PASSED` có khác `CUT` không?

| | |
|---|---|
| **Nếu KHÁC** | `CUT` = vừa cắt xong · `CUT_PASSED` = đã qua QC cắt, đủ điều kiện đi tiếp |
| **Nếu GIỐNG** | mã nguồn dùng nhầm tên, sửa mã nguồn thành `CUT` |

### Câu hỏi ② — `SEWING_READY` có khác `SEWING` không?

| | |
|---|---|
| **Nếu KHÁC** | `SEWING_READY` = đang chờ vào chuyền · `SEWING` = đang trên chuyền |
| **Nếu GIỐNG** | trigger thu hồi nên trả về `SEWING` |

### Câu hỏi ③ — `OUTSIDE_PROCESSING` có cần không?

Tôi cho là **có, và bắt buộc**. Ghi chú của `009` dòng 81 nói rõ mục đích:
*"Chặn Chuyền may quét nhầm"*. Không có trạng thái riêng cho bó đang ở ngoài
nhà máy thì chuyền may quét trúng một bó **không có mặt ở đó**.

---

## 3. PHƯƠNG ÁN

| | nội dung | được | mất |
|---|---|---|---|
| **A** | Thêm cả 3 giá trị vào enum | Giữ nguyên trigger và mã nguồn; từ vựng giàu, mô tả đúng thực tế xưởng | Enum 7 giá trị; phải bổ sung nhãn tiếng Việt cho 3 trạng thái mới |
| **B** | Chỉ thêm `OUTSIDE_PROCESSING`; sửa mã nguồn + trigger dùng `CUT`/`SEWING` | Enum gọn 5 giá trị | Mất khả năng phân biệt "chờ vào chuyền" với "đang trên chuyền" — một phân biệt có thật ở xưởng |
| **C** | Không đổi enum; viết lại toàn bộ `/subcon` theo 4 giá trị cũ | Không đụng lược đồ | Bó đang ở ngoài nhà máy **không phân biệt được** với bó đang trên chuyền. Chuyền may quét nhầm — đúng thứ `009` cố ngăn |

### Đề xuất của tôi: **A**

`009` được viết bởi người **đã nghĩ kỹ về luồng gia công** — ghi chú của họ nêu
đúng một rủi ro vận hành có thật. Cái sai không phải ý đồ, mà là **enum chưa
bao giờ được cập nhật theo**. Sửa enum cho khớp ý đồ rẻ hơn và trung thực hơn
là bóp ý đồ cho vừa enum.

**Phương án C tôi khuyến nghị loại**: nó đánh đổi an toàn vận hành lấy sự gọn
gàng của lược đồ.

### ⚠️ Chi tiết kỹ thuật đã kiểm

- **Không nơi nào so sánh THỨ TỰ** `current_stage` (đã rà toàn bộ `*.ts`,
  `*.tsx`, `*.sql` — chỉ có `=`, `IN`, `NOT IN`). Nên vị trí chèn giá trị mới
  **không ảnh hưởng hành vi**. Vẫn nên chèn đúng vị trí logic cho người đọc sau.
- `ALTER TYPE ... ADD VALUE` **không dùng được ngay trong cùng giao dịch** đã
  thêm nó. Nên migration sửa enum phải **đứng riêng**, không gói chung với
  `S001`.
- `007b` dòng 126 dùng `NOT IN ('FINISHING','PACKED')` — thêm giá trị **không**
  làm hỏng phép kiểm đó.

---

## 4. CONSEQUENCES

### Nếu duyệt A

1. Migration `039` — `ALTER TYPE ADD VALUE` cho 3 giá trị *(đứng riêng)*.
2. Bổ sung **nhãn tiếng Việt** cho 3 trạng thái mới — giao diện phải tiếng Việt.
3. Chạy lại `S001` → Phần B gieo trọn vẹn.
4. Chạy `live-suite` → mới đủ điều kiện bắt đầu `031d`.
5. **Kiểm thử lại phân hệ `/subcon`** — nó chưa từng chạy, nên phải coi như
   một phân hệ mới, không phải một phân hệ đang chạy.

### Rủi ro nếu KHÔNG làm gì

`/subcon` vẫn hỏng, ba bảng vẫn rỗng, và `031d`/`031e` sẽ viết policy cho
những bảng **chưa ai chứng minh được là hoạt động**.

---

## 5. ROLLBACK IMPACT

⚠️ **`ALTER TYPE ... ADD VALUE` KHÔNG hoàn tác được.** PostgreSQL không có
`DROP VALUE`. Gỡ một giá trị enum đòi tạo type mới, chuyển cột, xoá type cũ —
một migration `Expand → Migrate → Contract` đầy đủ.

Nên đây là **quyết định gần như một chiều**, và là lý do nó cần ADR chứ không
phải một dòng SQL vá nhanh.

Giảm nhẹ: thêm giá trị vào enum **không làm hỏng dữ liệu đang có** — 3 dòng
`cut_bundles` hiện tại giữ nguyên `SEWING`/`READY` của chúng.

---

## 6. REFERENCES

- `supabase/migrations/007b_architecture_refactor.sql` dòng 9 — định nghĩa enum
- `supabase/migrations/009_subcontracting_schema.sql` dòng 84, 125 — hai trigger
- `app/(dashboard)/subcon/actions.ts` dòng 45, 63 — ba giá trị trong mã nguồn
- `supabase/seeds/S001_business_baseline.sql` Phần B Mục 13 — nơi lỗi lộ ra
- Hiến pháp **V.1** — không được audit bằng bảng rỗng *(ca điển hình)*
- Hiến pháp **IV** — không viết SQL trước khi ADR được xác nhận
