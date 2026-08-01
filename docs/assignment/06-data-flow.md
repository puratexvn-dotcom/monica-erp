# 06 · DATA FLOW

## 1. Vòng đời một Assignment, từ đầu đến cuối

```
MONICA (md · kho · giamdoc)              ĐỐI TÁC (cổng riêng)
──────────────────────────               ─────────────────────

1. Lập Assignment
   assignments  status=DRAFT
        │
2. Giao việc
   status=ISSUED  ──────────────────────►  3. Thấy việc mới
        │                                     (thông báo)
        │                                          │
        │                                  4a. NHẬN việc
        │  ◄──────────────────────────────     status=ACCEPTED
        │                                      accepted_at · accepted_by
        │                                          │
        │                                  4b. hoặc TỪ CHỐI (Nguyên tắc 8)
        │  ◄──────────────────────────────     status=REJECTED
        │                                      reject_reason ≥ 10 ký tự
        │  ────── sửa điều khoản, giao lại ──►   quay về ISSUED
        │
5. Sinh chứng từ                                   │
   subcon_orders.assignment_id                     │
   (đơn giá do Monica đặt)                         │
        │                                          │
        │                                  6. Báo cáo NGÀY ĐẦU
        │  ◄──────────────────────────────    assignment_daily_reports
        │                                     status → IN_PROGRESS (tự động)
        │                                          │
        │                                  7. Ghi dữ liệu vận hành
        │                                     hourly_production_logs
        │                                     qa_audit_reports
        │                                     material_consumption
        │                                     subcon_receipt_logs
        │                                          │
8. Theo dõi REPORT MISSING                         │
   v_assignment_report_status                      │
        │                                          │
        │                                  9. Báo xong
        │  ◄──────────────────────────────    status=COMPLETED
        │                                     (chặn nếu còn ngày thiếu báo cáo)
        │
10. Nghiệm thu
    status=CLOSED  ─────────────────────►  11. Quyền GHI tắt
    close_reason                              (chỉ còn đọc, vĩnh viễn)
```

⚠️ Sơ đồ trên là của **Đối tác Thực thi**. Buyer không có luồng này — họ
không nhận việc, không báo cáo ngày, không có Assignment (Quyết định 4). Luồng
của Buyer là duyệt mẫu, duyệt thay đổi, và đọc tiến độ theo đơn hàng của mình,
đi qua `mos_buyer_can_see_order()` của migration 018.

## 2. Ai ghi cái gì

| Bảng | Monica | Đối tác |
|---|:---:|:---:|
| `partners` · `partner_accounts` | ✓ | — |
| `assignments` | ✓ | chỉ `→ ACCEPTED` và `→ COMPLETED` |
| `assignment_bundles` | ✓ | — |
| `subcon_orders` (đơn giá) | ✓ | — |
| `assignment_daily_reports` | — | ✓ |
| `hourly_production_logs` | ✓ | ✓ |
| `qa_audit_reports` | ✓ | ✓ |
| `material_consumption` | — | ✓ |
| `subcon_issue_logs` | ✓ | — |
| `subcon_receipt_logs` | — | ✓ |

**Hai cột này là cả thiết kế.** Đối tác **không** chạm vào thứ xác định quyền
và tiền (Assignment, đơn giá). Đối tác **bắt buộc** chạm vào thứ họ tạo ra
(sản lượng, lỗi, tiêu hao) — Điều XXX mục 6.

`subcon_issue_logs` (xuất hàng đi gia công) là hành động của **kho Monica**;
`subcon_receipt_logs` (nhận hàng về) do **đối tác** khai rồi kho đối soát. Hai
chiều, hai người ghi — không ai tự khai cả hai đầu.

## 3. REPORT MISSING — tính, không lưu

```sql
CREATE VIEW v_assignment_report_status
WITH (security_invoker = true) AS
SELECT
  a.id                AS assignment_id,
  a.assignment_no,
  a.partner_id,
  a.order_id,
  d.day::DATE         AS report_date,
  CASE
    WHEN r.id IS NOT NULL AND r.output_qty IS NOT NULL
                          AND r.target_qty IS NOT NULL  THEN 'COMPLETE'
    WHEN r.id IS NOT NULL                               THEN 'PARTIAL'
    WHEN d.day::DATE < (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE
                                                        THEN 'OVERDUE'
    ELSE 'NOT_STARTED'
  END                 AS report_status
FROM assignments a
-- Sinh từng NGÀY trong khoảng hiệu lực, tới hôm nay là dừng
CROSS JOIN LATERAL generate_series(
  a.planned_start,
  LEAST(a.planned_finish, (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE),
  INTERVAL '1 day'
) AS d(day)
-- Bản ĐANG HIỆU LỰC là bản KHÔNG CÓ CON
LEFT JOIN assignment_daily_reports r
       ON r.assignment_id = a.id AND r.report_date = d.day::DATE
      AND NOT EXISTS (SELECT 1 FROM assignment_daily_reports c
                       WHERE c.parent_report_id = r.id)
WHERE a.deleted_at IS NULL
  AND a.status IN ('ACCEPTED', 'IN_PROGRESS', 'COMPLETED');
```

Bốn quyết định trong hai chục dòng đó:

**① `security_invoker = true` ngay từ lần tạo.** View mặc định chạy dưới quyền
chủ sở hữu và **vượt mặt RLS** — bảy view của 017/020/022 đã rò rỉ thật vì
thiếu dòng này, phải vá ở Mục 7 của migration 024. Không lặp lại.

**② Múi giờ Việt Nam tường minh.** Máy chủ chạy UTC. Không đổi múi thì từ 0h
đến 7h sáng, ngày hôm qua sẽ chưa bị tính là thiếu báo cáo — đúng khung ca đêm
của xưởng.

**③ `LEAST(planned_finish, hôm_nay)`.** Không sinh ra ngày tương lai rồi bảo là
thiếu. Assignment chạy tới 20/08 thì ngày 15/08 chưa thể "thiếu báo cáo".

**④ `SUSPENDED` không có trong danh sách.** Tạm dừng vì hết vải thì không thể
đòi báo cáo sản lượng. Đưa nó vào là sinh ra hàng loạt cảnh báo giả — và cảnh
báo giả làm người ta ngừng nhìn bảng cảnh báo.

**Không có cột nào được lưu.** Điều XXVIII.1.

**Bốn giá trị chứ không phải một cờ đúng/sai.** `NOT_STARTED` khác `OVERDUE`
— *"chưa tới hạn"* khác *"đã trễ"*. Gộp lại thì bảng điều khiển đỏ rực mỗi
sáng và không ai nhìn nữa. `PARTIAL` tách riêng vì một phiếu thiếu sản lượng
không phải phiếu đã nộp.

**`NOT EXISTS` là cách đọc sổ cái.** Bản đang hiệu lực của một ngày là bản
**không có bản đính chính nào trỏ về**. Thiếu mệnh đề này thì một ngày đã đính
chính sẽ trả hai dòng — và con số sản lượng bị đếm đôi.

## 4. Chảy vào bảng điều khiển

```
v_assignment_report_status
        │
        ├──► Giám đốc   "N assignment chưa báo cáo hôm nay"
        ├──► MD         theo từng PO
        ├──► QA         chuyền nào im lặng
        └──► Cổng đối tác  "bạn còn thiếu báo cáo ngày 06/08"
```

Hiển thị cho **chính đối tác** cũng quan trọng như hiển thị cho Giám đốc. Một
cảnh báo mà chỉ người bị phạt không nhìn thấy thì nó là cái bẫy, không phải
công cụ.

## 5. Chảy vào KPI

Assignment là mẫu số của mọi chỉ số đối tác:

```
Tỉ lệ đúng hạn   =  Assignment CLOSED đúng planned_finish  /  tổng CLOSED
Tỉ lệ báo cáo    =  ngày có báo cáo  /  tổng ngày hiệu lực
Hiệu suất        =  Σ output_qty  /  Σ target_qty
Tỉ lệ lỗi        =  Σ defect_qty  /  Σ output_qty
```

Cả bốn **tính tại chỗ**, không lưu. `customers.kpi_on_time_rate` và
`suppliers.kpi_on_time_rate` hiện có là cột lưu sẵn — vi phạm Điều XXVIII.1,
nhưng **không đụng tới trong phạm vi này**: chúng thuộc miền khác và hiện đang
0 dòng. Ghi ở đây để không ai tưởng đã rà.

## 6. Chảy vào thông báo

| Sự kiện | Ai nhận |
|---|---|
| `→ ISSUED` | mọi tài khoản của Partner |
| Không nhận việc sau 24h | Monica (người `assigned_by`) |
| Thiếu báo cáo ngày | Partner lúc 20h · Monica lúc 8h hôm sau |
| `→ SUSPENDED` | Partner |
| `→ COMPLETED` | Monica |
| Sắp tới `planned_finish` (còn 3 ngày) | cả hai |

Dùng lại `notifications` (5 dòng, đã có). **Không** dựng hệ thống thông báo
mới — Điều XXIX.

## 7. Chảy vào audit và Timeline

Mọi chuyển trạng thái ghi vào `activity_log` với `entity_type = 'assignment'`.
Điều XI: 100% audit, không ngoại lệ.

**Timeline là thành phần MẶC ĐỊNH của Domain** (Nguyên tắc 10), và nó là một
**view hợp ba nguồn**, không phải bảng mới:

```
v_assignment_timeline
   ① activity_log              đổi trạng thái
   ② assignment_daily_reports  báo cáo ngày, kể cả bản đính chính
   ③ assignment_bundles        gắn bó · gỡ bó
```

Đo được: `activity_log` đã tồn tại với đúng hình dạng cần — `entity_type` ·
`entity_id` · `action` · `changes` (jsonb) · `actor_id` · `actor_role` ·
`created_at` — và đang **0 dòng, chưa ai dùng**. Dựng một bảng
`assignment_events` riêng là nhân bản thứ đã có (Điều XXIX).

Ba cột `assigned_by` / `accepted_at` / `closed_at` **không thay thế** audit
log — chúng là *trạng thái hiện tại*, log là *lịch sử*. Một Assignment bị mở
lại từ `COMPLETED` về `IN_PROGRESS` sẽ mất dấu nếu chỉ nhìn cột.

## 8. Ranh giới với thứ đang chạy

```
Assignment Engine  ─────►  đọc:  orders · sewing_lines · cut_bundles · profiles
                   ─────►  ghi:  chỉ bảng của chính nó

/md · /kho · /qa    KHÔNG đổi. Chúng là người dùng nội bộ, thoát ở
                    `NOT mos_is_external()` trước khi chạm Assignment.

/subcon             chuyển dần: đọc Assignment thay vì đọc thẳng subcon_orders.
                    Chuyển từng màn hình, không có ngày cắt băng.
```

Assignment Engine **không** ghi vào bảng nào của phân hệ khác. Nó chỉ đọc. Đây
là ranh giới module của modular monolith — thứ giữ cho nó không biến thành một
lớp thần thánh đụng vào mọi nơi.
