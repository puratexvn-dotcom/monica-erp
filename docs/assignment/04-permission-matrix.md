# 04 · ASSIGNMENT PERMISSION MATRIX

## 1. Chuỗi quyết định

```
Identity          ai đang gọi                    auth.uid()
   ↓
Partner Account   tài khoản này thuộc đối tác nào  partner_accounts
   ↓
Assignment        đối tác đó được giao những gì    assignments (đang hiệu lực)
   ↓
Resource Scope    tài nguyên này có nằm trong đó   tài liệu 05
   ↓
Permission        loại đối tác này được làm gì     bảng dưới đây
   ↓
Action            cho phép hay từ chối
```

**Vai trò không xuất hiện ở bất kỳ mắt xích nào.** Vai trò chỉ quyết định *vào
được màn hình nào* — một hàng rào khác, ở tầng khác.

## 2. Ma trận theo loại đối tác

`R` đọc · `W` tạo/sửa · `—` không quyền. Mọi ô `R`/`W` đều **chỉ trong phạm vi
Assignment đang hiệu lực**.

| Tài nguyên | BUYER | SUBCON | SERVICE_VENDOR | SUPPLIER | FORWARDER | AUDITOR |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Đơn hàng (thông tin cơ bản) | R | R | R | R | R | R |
| Mã hàng · tài liệu kỹ thuật | R | R | R | — | — | R |
| Sơ đồ chuyền · công đoạn | — | R | R | — | — | R |
| Bó bán thành phẩm | — | R | R | — | — | R |
| Phiếu cắt | — | R | R | — | — | R |
| **Sản lượng theo giờ** | — | **W** | **W** | — | — | R |
| **Báo cáo ngày** | — | **W** | **W** | **W** | **W** | — |
| **Dừng máy / sự cố** | — | **W** | **W** | — | — | R |
| Kiểm giữa chuyền (QA inline) | — | **W** | **W** | — | — | R |
| Kết quả AQL | R | R | R | — | — | **W** |
| Phiếu khắc phục (CAPA) | — | R | R | — | — | R |
| Vật tư được cấp | — | R | R | R | — | — |
| **Tiêu hao vật tư** | — | **W** | **W** | — | — | — |
| Lô hàng xuất | R | — | — | — | **W** | — |
| Chứng từ (B/L, C/O, invoice) | R | — | — | — | **W** | — |
| Tài liệu của chính mình | R | **W** | **W** | **W** | **W** | **W** |
| Bình luận / trao đổi | **W** | **W** | **W** | **W** | **W** | **W** |
| Duyệt mẫu · duyệt thay đổi | **W** | — | — | — | — | — |

## 3. Bảy thứ KHÔNG đối tác nào chạm tới

Không có ô nào trong ma trận, không có Assignment nào mở được:

```
financial_records      giá bán, giá vốn, lợi nhuận, thanh toán
profiles               danh sách nhân sự, lương
partners (bảng)        danh sách đối tác khác
subcons · subcontractors · suppliers   registry đối thủ
system_logs · activity_log · wh_audit_log   nhật ký nội bộ
settings · roles · user_roles          cấu hình hệ thống
mọi bảng điều khiển quản trị và phân tích AI nội bộ
```

Cài đặt bằng một policy `RESTRICTIVE` duy nhất dùng `mos_is_external()` — hàm
đã có từ migration 025 và đã bao phủ cả `buyer` lẫn `subcon`.

## 4. Buyer khác Subcon ở đâu

Điều XXX mục 9 nói rõ, ma trận trên thể hiện đúng:

```
BUYER    →  R trên tiến độ · W trên DUYỆT và BÌNH LUẬN
            KHÔNG BAO GIỜ ghi sản lượng
SUBCON   →  W trên SẢN LƯỢNG · BÁO CÁO · QA · TIÊU HAO
            KHÔNG duyệt gì cả
```

Buyer không ghi một con số vận hành nào. Subcon **bắt buộc** ghi — không ghi
thì `REPORT MISSING` sáng lên trên bảng điều khiển của Giám đốc.

`AUDITOR` là loại thứ ba: chỉ đọc mọi thứ vận hành, nhưng có **W trên kết quả
AQL** — vì đó chính là việc của họ.

## 5. Cài đặt

### 5.1 Hàm nền

```sql
mos_partner_id()            -- đối tác của người gọi, NULL nếu là người nội bộ
mos_is_external()           -- đã có từ migration 025
mos_partner_type()          -- BUYER / SUBCON / ...
mos_assignment_covers(resource_type, resource_id)  -- xem tài liệu 05
mos_partner_can(resource_type, action)             -- tra ma trận mục 2
```

⚠️ Mọi hàm dùng `SECURITY DEFINER` + `STABLE`, đọc claim bằng
`current_setting('request.jwt.claims', true)` kèm chốt `NULLIF` — **đúng khuôn
`mos_is_buyer()` của migration 018**. Không dùng `auth.jwt()`: khuôn đang chạy
mới là khuôn đã chứng minh (bài học migration 025).

### 5.2 Khuôn policy

```sql
-- ĐỌC
USING (
  NOT public.mos_is_external()
  OR (public.mos_partner_can('hourly_log', 'READ')
      AND public.mos_assignment_covers('order', order_id))
)

-- GHI
WITH CHECK (
  NOT public.mos_is_external()
  OR (public.mos_partner_can('hourly_log', 'WRITE')
      AND public.mos_assignment_covers('order', order_id))
)
```

`NOT mos_is_external()` đứng **đầu tiên** là cố ý: người nội bộ thoát ngay ở
biểu thức đầu, không phải trả giá cho phép nối Assignment. Với 12 vai trò nội
bộ chiếm gần hết lưu lượng, đây là khác biệt thật về hiệu năng.

### 5.3 Ma trận nằm ở đâu

**Trong CSDL**, bảng `partner_permissions`:

```
partner_type · resource_type · can_read · can_write
```

Không viết cứng trong hàm SQL, vì:
- RLS phải đọc được nó — mà RLS không gọi được TypeScript.
- Sửa chính sách là `UPDATE` một dòng, không phải một migration.
- Tầng giao diện đọc cùng bảng đó, nên **màn hình và cơ sở dữ liệu không bao
  giờ nói hai điều khác nhau** — đúng lỗi đã mắc ở Phase 5, khi `po-rbac` cho
  buyer xem tab Chất lượng còn RLS thì chặn sạch.

Bảng này là **dữ liệu cấu hình**, cùng loại với `defect_catalog` của migration
023 và `roles` của 017.

## 6. Sáu câu hỏi bắt buộc — thiết kế trả lời thế nào

| # | Câu hỏi | Cơ chế |
|---|---|---|
| 1 | Thấy dữ liệu ngoài Assignment? | `mos_assignment_covers()` trong `USING` của **mọi** bảng vận hành |
| 2 | Cập nhật được dữ liệu Assignment của mình? | Ô `W` trong ma trận + trạng thái `ACCEPTED`/`IN_PROGRESS` |
| 3 | Sửa được Assignment khác? | Cùng `mos_assignment_covers()`, áp trong `WITH CHECK` |
| 4 | Hết hạn thì quyền tự mất? | Điều kiện `[start_date, end_date]` nằm **trong hàm**, không lưu cột |
| 5 | Daily Report bắt buộc? | Điều kiện chuyển `→ COMPLETED` (tài liệu 03 mục 7) |
| 6 | Giám đốc thấy ai chưa báo cáo? | View `v_assignment_report_status` (tài liệu 06) |

## 7. Điều thiết kế này CỐ Ý không làm

**Không có quyền theo từng dòng do người dùng tự cấp.** Không có "chia sẻ
Assignment này cho ai đó". Quyền chỉ chảy từ Monica xuống, một chiều.

**Không có kế thừa quyền.** Assignment cha–con không tồn tại. Cần hẹp hơn thì
tạo Assignment hẹp hơn.

**Không có Permission Engine chạy trong bộ nhớ ứng dụng.** Quyền tính ở
PostgreSQL, nơi dữ liệu ở. Một engine trong Node sẽ phải nạp Assignment về rồi
lọc — và mọi lỗ hổng sẽ nằm ở chỗ ai đó quên gọi engine. Điều XXIX: không dựng
tầng trừu tượng cho quy mô chưa tồn tại.
