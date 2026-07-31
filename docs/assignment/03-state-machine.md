# 03 · ASSIGNMENT STATE MACHINE

## 1. Bảy trạng thái

```
                    ┌──────────────────────────────────────┐
                    │                                      │
  DRAFT ──────► ISSUED ──────► ACCEPTED ──────► IN_PROGRESS │
    │              │               │                 │      │
    │              │               │                 ▼      │
    │              │               │            COMPLETED   │
    │              │               │                 │      │
    │              │               │                 ▼      │
    │              │               │              CLOSED    │
    │              ▼               ▼                        │
    └──────────► CANCELLED ◄───────┴────────────────────────┘
                                          SUSPENDED ◄─┐
                                              │       │
                                              └───────┘
                                        (từ / về IN_PROGRESS)
```

| Trạng thái | Nghĩa | Ai chuyển |
|---|---|---|
| `DRAFT` | Monica đang soạn, đối tác **chưa thấy** | Monica |
| `ISSUED` | Đã giao, chờ đối tác xác nhận | Monica |
| `ACCEPTED` | Đối tác đã nhận việc | **Đối tác** |
| `IN_PROGRESS` | Đang chạy, có báo cáo ngày | Service, khi nhận báo cáo đầu |
| `SUSPENDED` | Tạm dừng (hết vải, chờ duyệt mẫu) | Monica |
| `COMPLETED` | Đối tác báo xong, chờ Monica nghiệm thu | **Đối tác** |
| `CLOSED` | Monica đã nghiệm thu, chốt sổ | Monica |
| `CANCELLED` | Huỷ trước khi xong | Monica |

## 2. Vì sao có `ACCEPTED` tách khỏi `ISSUED`

Giao việc là hành động **một phía**. Nếu không có bước xác nhận thì khi hàng
trễ, không ai chứng minh được đối tác đã biết việc từ ngày nào. `accepted_at` là
mốc pháp lý, không phải trang trí.

Đây cũng là điểm khác căn bản so với `subcon_orders`: chứng từ đó chỉ có
`issued_date`, không có chỗ nào ghi *đối tác đã nhận chưa*.

## 3. Vì sao có `SUSPENDED`

Assignment tạm dừng vì hết vải **không phải** là Assignment bị huỷ. Gộp hai
thứ sẽ làm hỏng cả hai con số: tỉ lệ huỷ bị thổi phồng, và thời gian chờ vật tư
biến mất khỏi sổ sách.

Trong `SUSPENDED`, quyền **đọc còn, ghi tắt** — xem mục 5.

## 4. Vì sao `COMPLETED` khác `CLOSED`

`COMPLETED` là đối tác **nói** đã xong. `CLOSED` là Monica **xác nhận** đã xong.

Trùng lặp với bài học của `capa_logs` ở migration 023: phiếu khắc phục không
đóng khi làm xong hành động, mà đóng khi lần kiểm sau chứng minh lỗi đã hết.
Cùng một nguyên lý — **người làm không tự nghiệm thu chính mình**.

## 5. Quyền theo trạng thái — trả lời câu hỏi số 4 của Điều XXX

| Trạng thái | Đối tác ĐỌC | Đối tác GHI | Ghi chú |
|---|:---:|:---:|---|
| `DRAFT` | ✗ | ✗ | Chưa giao thì chưa tồn tại với họ |
| `ISSUED` | ✓ | ✗ | Thấy để quyết định nhận hay không |
| `ACCEPTED` | ✓ | ✓ | Bắt đầu ghi được |
| `IN_PROGRESS` | ✓ | ✓ | |
| `SUSPENDED` | ✓ | ✗ | Đọc để biết vì sao dừng |
| `COMPLETED` | ✓ | ✗ | Đã báo xong thì không sửa số nữa |
| `CLOSED` | ✓ | ✗ | Chỉ đọc, vĩnh viễn |
| `CANCELLED` | ✗ | ✗ | Biến mất khỏi cổng đối tác |

**Quyền GHI chỉ mở ở đúng hai trạng thái.** Ngoài ra, còn một điều kiện thời
gian độc lập:

```
ghi được  ⟺  status ∈ {ACCEPTED, IN_PROGRESS}
              ∧  hôm_nay  ∈  [start_date, end_date]
              ∧  deleted_at IS NULL
```

Assignment hết hạn thì quyền **tự mất** mà không ai phải thu hồi. Đây là bất
biến I-4, và là câu trả lời cho câu hỏi bắt buộc số 4.

⚠️ `hôm_nay` phải lấy theo **giờ Việt Nam**, dùng `vnTodayISO()` của
`lib/mos/po-flow.ts`. Máy chủ chạy giờ UTC; từ 0h đến 7h sáng nó trả về ngày
hôm qua — đúng khung ca đêm của xưởng, và Assignment sẽ tắt quyền sớm một ngày.

## 6. Chuyển trạng thái hợp lệ

```
DRAFT       → ISSUED · CANCELLED
ISSUED      → ACCEPTED · CANCELLED
ACCEPTED    → IN_PROGRESS · SUSPENDED · CANCELLED
IN_PROGRESS → SUSPENDED · COMPLETED · CANCELLED
SUSPENDED   → IN_PROGRESS · CANCELLED
COMPLETED   → CLOSED · IN_PROGRESS      (mở lại khi nghiệm thu không đạt)
CLOSED      → (không đi đâu)
CANCELLED   → (không đi đâu)
```

**`COMPLETED → IN_PROGRESS` cố ý cho phép.** Nghiệm thu không đạt thì phải làm
lại; ép đối tác mở Assignment mới sẽ làm đứt lịch sử sản lượng của cùng một
phần việc.

`CLOSED` và `CANCELLED` là **hố hút** — không lối ra. Muốn làm tiếp thì tạo
Assignment mới, và lịch sử vẫn còn nguyên.

## 7. Điều kiện chuyển trạng thái

| Chuyển | Bắt buộc phải có |
|---|---|
| `→ ISSUED` | `partner_id`, `order_id`, `assigned_qty`, `start_date`, `end_date` |
| `→ ACCEPTED` | người thực hiện là **tài khoản của chính Partner đó** |
| `→ IN_PROGRESS` | **service** chuyển khi nhận báo cáo ngày đầu tiên — xem mục 8 |
| `→ SUSPENDED` | `suspend_reason` ≥ 10 ký tự |
| `→ COMPLETED` | không còn ngày nào thiếu báo cáo trong `[start_date, min(end_date, hôm_nay)]` |
| `→ CLOSED` | `close_reason` ≥ 10 ký tự, và người thực hiện là **Monica** |
| `→ CANCELLED` | `close_reason` ≥ 10 ký tự |

**Điều kiện của `→ COMPLETED` là điều kiện đắt nhất và cũng quan trọng nhất.**
Không có nó, đối tác báo "xong" rồi biến mất, để lại một chuỗi ngày trống mà
không ai truy được. Đây là cách `REPORT MISSING` có răng, thay vì chỉ là một
nhãn đỏ trên bảng điều khiển.

Ngưỡng ≥ 10 ký tự lặp lại khuôn của `capa_logs.root_cause` ở migration 023 —
lý do một chữ không phải là lý do.

## 8. Chỗ đặt luật

| Luật | Đặt ở | Vì sao |
|---|---|---|
| Danh sách trạng thái | `CHECK` + hằng TypeScript, **khớp từng chữ** | Bài kiểm đối chiếu hai bên, như `SHIPMENT_FLOW` của Phase 6 |
| Chuyển trạng thái hợp lệ | `lib/mos/assignment.ts` (Domain thuần) | Kiểm thử bằng Node, không cần dựng Postgres |
| Điều kiện bắt buộc | **Service** | Nơi duy nhất cho được thông báo người dùng đọc hiểu |
| Tự chuyển `→ IN_PROGRESS` | **Service** | Quyết định 5 — đây là QUY TRÌNH, không phải bất biến |
| Giải phóng bó khi huỷ | **Service** | Cùng lý do |
| Bất biến dữ liệu (I-8, khoá ngoại, `CHECK`) | **CSDL** | Chặn mọi đường vào, kể cả gọi thẳng PostgREST |
| Quyền theo trạng thái | **RLS** | Hàng rào thật. Giao diện chỉ là hàng rào lịch sự |

### Quyết định 5 — ranh giới của trigger

> **Trigger chỉ bảo vệ bất biến dữ liệu. Không đặt quy trình nghiệp vụ hay tự
> động hoá nghiệp vụ trong trigger.**

| Được đặt trong trigger | Không được |
|---|---|
| Từ chối Assignment cho partner `BUYER` (I-8) | Tự chuyển trạng thái |
| Đóng dấu `updated_at`, `updated_by` | Tự gỡ bó khi huỷ |
| Từ chối `CLOSED` khi thiếu `close_reason` | Tự sinh chứng từ |

Ranh giới đơn giản: trigger được **từ chối** và được **đóng dấu**. Trigger
không được **thay người dùng quyết định**.

✅ **Xung đột với migration 024 — ĐÃ XỬ LÝ.** Trigger
`shipment_release_cartons` tự xoá mềm liên kết thùng khi huỷ lô hàng: đó là tự
động hoá nghiệp vụ, vi phạm Quyết định 5.

Kiến trúc sư chọn **phương án (c)**, thực hiện ở migration `026b`: trigger đổi
từ *TỰ LÀM* thành *TỪ CHỐI* — nó chặn `→ CANCELLED` khi còn thùng chưa gỡ, và
tầng ứng dụng phải gỡ thùng trước.

Cách này giữ nguyên độ chắc chắn của CSDL (chặn cả khi gọi thẳng PostgREST) mà
không vi phạm ranh giới. Phương án chuyển hẳn sang service sẽ mở lại cái bẫy
`UNIQUE` khoá vĩnh viễn thùng — và lỗi đó im lặng.

⚠️ **KHÔNG** lưu cột `can_write`. Điều XXVIII.1 cấm lưu dữ liệu tính được — nó
sẽ lệch ngay ngày Assignment hết hạn mà không ai chạy lại phép tính.
