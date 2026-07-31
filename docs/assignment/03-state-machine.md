# 03 · ASSIGNMENT STATE MACHINE

> **Bản 2** — thêm trạng thái **`REJECTED`** theo Nguyên tắc 8 (Quy trình
> Nhận việc bắt buộc: Accept **hoặc** Reject).

## 1. Chín trạng thái

```
                          ┌──── REJECTED ────┐
                          │        ▲         │ đàm phán lại
                          │        │ từ chối │
                          ▼        │         ▼
  DRAFT ──────► ISSUED ───┴────────┴──► ACCEPTED ──► IN_PROGRESS
    │              │                        │            │  ▲
    │              │                        │            │  │
    │              │                        │            ▼  │
    │              │                        │        SUSPENDED
    │              │                        │            │
    │              │                        ▼            │
    │              │                    COMPLETED ◄──────┘
    │              │                        │
    │              │                        ▼
    │              │                     CLOSED
    ▼              ▼                        │
  CANCELLED ◄──────┴────────────────────────┘
```

| Trạng thái | Nghĩa | Ai chuyển |
|---|---|---|
| `DRAFT` | Monica đang soạn, đối tác **chưa thấy** | Monica |
| `ISSUED` | Đã giao, chờ đối tác quyết định | Monica |
| `ACCEPTED` | Đối tác **đã nhận** việc | **Đối tác** |
| `REJECTED` | Đối tác **từ chối** — có lý do | **Đối tác** |
| `IN_PROGRESS` | Đang chạy, có báo cáo ngày | Service, khi nhận báo cáo đầu |
| `SUSPENDED` | Tạm dừng (hết vải, chờ duyệt mẫu) | Monica |
| `COMPLETED` | Đối tác báo xong, chờ nghiệm thu | **Đối tác** |
| `CLOSED` | Monica đã nghiệm thu, chốt sổ | Monica |
| `CANCELLED` | Huỷ trước khi xong | Monica |

## 2. Vì sao phải có `REJECTED` — Nguyên tắc 8

Giao việc là hành động **một phía**. Không có `REJECTED` thì đối tác chỉ còn hai
lựa chọn: nhận việc mình không làm nổi, hoặc im lặng.

Cả hai đều tệ, và **im lặng tệ hơn**: Assignment nằm ở `ISSUED` vô thời hạn,
không ai biết là đang chờ hay đã hỏng, và tới ngày `start_date` thì mới vỡ lẽ
không có ai làm.

`REJECTED` biến sự im lặng thành **một sự việc có mốc thời gian, có người, và
có lý do**:

```
rejected_at · rejected_by · reject_reason (≥ 10 ký tự)
```

`REJECTED → ISSUED` **cố ý cho phép**: từ chối vì giá, vì thời hạn, vì hết công
suất — Monica sửa điều khoản rồi giao lại. Lịch sử hai lần giao nằm nguyên trong
Timeline.

## 3. Vì sao `ACCEPTED` tách khỏi `ISSUED`

`accepted_at` là **mốc pháp lý**: khi hàng trễ, nó trả lời *"đối tác biết việc
này từ ngày nào"*. `subcon_orders` chỉ có `issued_date` — không có chỗ nào ghi
điều đó.

## 4. Vì sao có `SUSPENDED`

Tạm dừng vì hết vải **không phải** là huỷ. Gộp hai thứ làm hỏng cả hai con số:
tỉ lệ huỷ bị thổi phồng, và thời gian chờ vật tư biến mất khỏi sổ sách.

## 5. Vì sao `COMPLETED` khác `CLOSED`

`COMPLETED` là đối tác **nói** đã xong. `CLOSED` là Monica **xác nhận**.

Cùng nguyên lý `capa_logs` (023): phiếu khắc phục không đóng khi làm xong hành
động, mà đóng khi lần kiểm sau chứng minh lỗi đã hết. **Người làm không tự
nghiệm thu chính mình.**

## 6. Quyền theo trạng thái — trả lời câu hỏi 4 của Điều XXX

| Trạng thái | Đối tác ĐỌC | Đối tác GHI | Ghi chú |
|---|:---:|:---:|---|
| `DRAFT` | ✗ | ✗ | chưa giao thì chưa tồn tại với họ |
| `ISSUED` | ✓ | **chỉ Accept/Reject** | thấy để quyết định |
| `ACCEPTED` | ✓ | ✓ | bắt đầu ghi dữ liệu vận hành |
| `REJECTED` | ✓ | ✗ | thấy lý do mình đã ghi |
| `IN_PROGRESS` | ✓ | ✓ | |
| `SUSPENDED` | ✓ | ✗ | đọc để biết vì sao dừng |
| `COMPLETED` | ✓ | ✗ | đã báo xong thì không sửa số |
| `CLOSED` | ✓ | ✗ | chỉ đọc, vĩnh viễn |
| `CANCELLED` | ✗ | ✗ | biến mất khỏi cổng đối tác |

```
ghi dữ liệu vận hành  ⟺  status ∈ {ACCEPTED, IN_PROGRESS}
                          ∧ hôm_nay ∈ [start_date, end_date]
                          ∧ deleted_at IS NULL
```

⚠️ Ở `ISSUED`, đối tác ghi được **đúng hai thứ**: chuyển sang `ACCEPTED` hoặc
`REJECTED`. Không sản lượng, không báo cáo, không tài liệu.

⚠️ `hôm_nay` lấy theo **giờ Việt Nam** (`vnTodayISO()`). Máy chủ chạy UTC; từ 0h
đến 7h sáng nó trả ngày hôm qua — đúng khung ca đêm, và quyền sẽ tắt sớm một
ngày.

## 7. Chuyển trạng thái hợp lệ

```
DRAFT       → ISSUED · CANCELLED
ISSUED      → ACCEPTED · REJECTED · CANCELLED
ACCEPTED    → IN_PROGRESS · SUSPENDED · CANCELLED
REJECTED    → ISSUED · CANCELLED
IN_PROGRESS → SUSPENDED · COMPLETED · CANCELLED
SUSPENDED   → IN_PROGRESS · CANCELLED
COMPLETED   → CLOSED · IN_PROGRESS      (mở lại khi nghiệm thu không đạt)
CLOSED      → (hố hút)
CANCELLED   → (hố hút)
```

`CLOSED` và `CANCELLED` không có lối ra. Muốn làm tiếp thì tạo Assignment mới —
lịch sử vẫn còn nguyên.

## 8. Điều kiện chuyển trạng thái

| Chuyển | Bắt buộc |
|---|---|
| `→ ISSUED` | `partner_id` · `order_id` · `scope_level` · `assigned_qty` · `start_date` · `end_date` |
| `→ ACCEPTED` | người thực hiện là **tài khoản của chính Partner đó** |
| `→ REJECTED` | cùng điều kiện trên, cộng `reject_reason` ≥ 10 ký tự |
| `→ IN_PROGRESS` | **service** chuyển khi nhận báo cáo ngày đầu tiên |
| `→ SUSPENDED` | `suspend_reason` ≥ 10 ký tự |
| `→ COMPLETED` | **không còn ngày nào `OVERDUE`** trong `[start_date, min(end_date, hôm_nay)]` |
| `→ CLOSED` | `close_reason` ≥ 10 ký tự, người thực hiện là **Monica** |
| `→ CANCELLED` | `cancel_reason` ≥ 10 ký tự |

**Điều kiện của `→ COMPLETED` là điều kiện đắt nhất và quan trọng nhất.** Không
có nó, đối tác báo "xong" rồi biến mất, để lại chuỗi ngày trống không ai truy
được. Đây là cách `REPORT MISSING` có răng.

Ngưỡng ≥ 10 ký tự lặp khuôn `capa_logs.root_cause` (023) — lý do một chữ không
phải là lý do.

## 9. Chỗ đặt luật

| Luật | Đặt ở | Vì sao |
|---|---|---|
| Danh sách trạng thái | `CHECK` + hằng TypeScript, **khớp từng chữ** | có bài kiểm đối chiếu, như `SHIPMENT_FLOW` (Phase 6) |
| Chuyển trạng thái hợp lệ | `lib/mos/assignment.ts` (Domain thuần) | kiểm thử bằng Node, không cần Postgres |
| Điều kiện bắt buộc | **Service** | nơi duy nhất cho được thông báo người dùng đọc hiểu |
| Tự chuyển `→ IN_PROGRESS` | **Service** | Điều XXX mục 5 — đây là QUY TRÌNH |
| Gỡ bó khi huỷ | **Service** | cùng lý do |
| Bất biến dữ liệu (I-8 · I-9 · khoá ngoại · `CHECK`) | **CSDL** | chặn mọi đường vào, kể cả gọi thẳng PostgREST |
| Quyền theo trạng thái | **RLS** | hàng rào thật; giao diện chỉ lịch sự |

### Ranh giới trigger — Điều XXX mục 5

> Trigger được **VALIDATE · REJECT · AUDIT**. Trigger không được **thay người
> dùng quyết định**.

| Được | Không được |
|---|---|
| Từ chối Assignment cho partner `BUYER` (I-8) | Tự chuyển trạng thái |
| Từ chối ghi con vào Assignment đã đóng (I-9) | Tự gỡ bó khi huỷ |
| Đóng dấu `updated_at` · `updated_by` | Tự sinh chứng từ |
| Từ chối `CLOSED` khi thiếu `close_reason` | Tự tính lại KPI |

✅ Xung đột với migration 024 **đã xử lý** ở `026b`: trigger
`shipment_release_cartons` (tự gỡ thùng) đổi thành `shipment_cancel_guard`
(từ chối huỷ khi còn thùng). Kiểm chứng bằng `live-024`.

⚠️ **KHÔNG** lưu `can_write`, `report_status`, `is_missing`, `delay_days`.
Điều XXVIII.1 — chúng lệch ngay lúc nửa đêm trôi qua mà không ai chạy lại.
