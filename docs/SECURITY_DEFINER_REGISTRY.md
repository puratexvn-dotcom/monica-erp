# SỔ ĐĂNG KÝ HÀM `SECURITY DEFINER`

> **Mọi `SECURITY DEFINER` function phải có tài liệu, lý do tồn tại, ADR liên
> quan và bài kiểm thử hồi quy trước khi được merge.**
> — Kiến trúc sư trưởng, 02/08/2026

---

## 0. VÌ SAO SỔ NÀY TỒN TẠI

`SECURITY DEFINER` khiến hàm chạy dưới quyền **người tạo** (`postgres`) thay vì
người gọi. Người tạo **vượt mặt toàn bộ RLS**. Mỗi hàm loại này là **một lỗ
khoét có chủ ý xuyên qua hàng rào phân quyền**.

Lỗ khoét có chủ ý thì chấp nhận được. Lỗ khoét **không ai nhớ vì sao có** thì
không.

### Sự cố sinh ra quy định này

02/08/2026 — A001 Mục 3 phát hiện **13/14 hàm `SECURITY DEFINER` gọi được bởi
người CHƯA ĐĂNG NHẬP**, trong đó hai hàm **ghi dữ liệu**:

```
mos_soft_delete_commercial_term(uuid) → P0002 (lỗi NGHIỆP VỤ, không phải 42501)
mos_restore_commercial_term(uuid)     → P0002
```

`P0002` do chính thân hàm ném ra ⇒ **cổng quyền đã cho qua, hàm đã thực thi**.
Truyền UUID có thật thì nó **xoá thật** — bởi một người không hề đăng nhập.
`assignment_commercial_terms` là bảng giữ **giá**.

Đáng chú ý: **cả bốn migration liên quan đều đã viết `REVOKE`** (018, 025, 030,
036b). Không ai quên. Chúng chỉ **revoke sai đích hoặc bị nạp lại**. Nghĩa là
ý thức bảo mật không đủ — phải có **sổ và bài kiểm**.

---

## 1. SÁU MỤC BẮT BUỘC TRƯỚC KHI MERGE

Một hàm `SECURITY DEFINER` mới chỉ được merge khi đủ **cả sáu**:

| # | mục | vì sao |
|---|---|---|
| 1 | **Lý do tồn tại** | vì sao **buộc** phải vượt RLS. Không trả lời được ⇒ dùng `SECURITY INVOKER`. |
| 2 | **ADR liên quan** | Hiến pháp IV — thay đổi kiến trúc phải có ADR duyệt trước |
| 3 | **`SET search_path`** | không ghim thì kẻ tấn công đổi `search_path` để hàm gọi nhầm đối tượng của họ |
| 4 | **`REVOKE ALL FROM PUBLIC, anon`** | `GRANT` chỉ cộng thêm — phải `REVOKE` đúng người được cấp |
| 5 | **`GRANT` tường minh** | ghi rõ vai nào được gọi. Không dựa vào mặc định. |
| 6 | **Bài kiểm hồi quy** | phải có phép thử chứng minh **người không được phép thì bị từ chối** |

> Mục 6 khác Mục 4: Mục 4 là *đã viết lệnh đóng*, Mục 6 là *đã chứng minh cửa
> đóng thật*. Sự cố 038 xảy ra vì có Mục 4 mà **thiếu Mục 6** trong bốn năm
> migration liền.

---

## 2. SỔ ĐĂNG KÝ — 19 HÀM HIỆN CÓ

Trạng thái đo ngày 02/08/2026, **sau** migration 038.
`anon`: ✅ = bị từ chối `42501` (đo bằng phiên `anon` thật, 14/14).

### 2.1 Bộ máy phân quyền — `mos_*`

| hàm | migration | lý do buộc phải `SECURITY DEFINER` | ADR | `anon` |
|---|---|---|---|---|
| `mos_is_buyer()` | 018 | đọc `request.jwt.claims`; policy gọi nó nên phải chạy được cho mọi vai | — | ✅ |
| `mos_is_subcon()` | 025 | như trên | — | ✅ |
| `mos_is_external()` | 025 | như trên; **031a phụ thuộc trực tiếp** | ADR-006 | ✅ |
| `mos_current_role()` | 019 | như trên | — | ✅ |
| `mos_buyer_customer_id()` | 018 | đọc `buyer_accounts` — bảng mà **buyer bị chặn đọc**. Đây chính là lỗ khoét có chủ ý. | — | ✅ |
| `mos_buyer_can_see_order()` | 018 | đọc `orders` bỏ qua RLS để **quyết định** RLS. Gọi trong policy nên không thể chịu RLS, sẽ đệ quy vô tận. | — | ✅ |
| `mos_partner_id()` | 030 | đọc `partner_accounts` + `partners` — cả hai đều chặn đối tác | ADR-006 | ✅ |
| `mos_is_partner()` | 030 | như trên | ADR-006 | ✅ |
| `mos_partner_can()` | 030 | đọc `partner_permissions` — bảng đối tác bị chặn | ADR-006 | ✅ |
| `mos_can_read_assignment()` | 030 | ghép `assignments` + quyền; nền của phân quyền theo tài nguyên | ADR-006 | ✅ |
| `mos_can_write_assignment()` | 030 | như trên, cho đường ghi | ADR-006 | ✅ |
| `mos_partner_subcontractor_id()` | **031c2** | bắc cầu `partner_accounts → partners → subcontractor_id`. **`partners` đóng với chính đối tác**, nên policy truy vấn thẳng vào đó luôn ra rỗng — xem Playbook **K-3**. | ADR-006 | ✅ |

> **Vì sao cả nhóm này buộc phải `SECURITY DEFINER`:** chúng được gọi **bên
> trong policy RLS**. Nếu chúng chịu RLS thì việc đánh giá policy sẽ lại cần
> đánh giá policy — đệ quy vô tận. Đây là lý do chính đáng, và là lý do duy
> nhất được chấp nhận cho nhóm này.

### 2.2 Ghi dữ liệu — ⚠️ NHÓM NGUY HIỂM NHẤT

| hàm | migration | lý do | ADR | `anon` |
|---|---|---|---|---|
| `mos_soft_delete_commercial_term(uuid)` | 036b | `assignment_commercial_terms` cấm `DELETE` ở tầng GRANT (029b); xoá mềm phải đi qua RPC có kiểm soát | ADR-005 | ✅ |
| `mos_restore_commercial_term(uuid)` | 036b | đường hoàn tác của trên | ADR-005 | ✅ |
| `wh_unblock_roll(uuid, text)` | 020 | gỡ khoá cây vải + ghi `wh_audit_log` | — | ✅ *(đã đóng từ trước)* |

> ⚠️ Đây là ba hàm **ghi được dữ liệu mà người gọi vốn không được ghi**. Bất kỳ
> hàm mới nào rơi vào nhóm này phải được Kiến trúc sư duyệt riêng, không chỉ
> duyệt theo ADR của phân hệ.

### 2.3 Hàm trigger — không gọi trực tiếp

| hàm | migration | ghi chú |
|---|---|---|
| `handle_new_user()` | 001 | tạo `profiles` khi có tài khoản mới |
| `wh_inspection_prepare()` · `wh_inspection_apply()` | 020 | kiểm vải 4 điểm |
| `wh_reservation_guard()` · `wh_sync_reserved()` | 020 | giữ chỗ tồn kho |

> PostgreSQL **không kiểm quyền `EXECUTE`** khi gọi hàm qua trigger, nên nhóm
> này không cần grant nào. 038 vẫn thu hồi cho sạch — thu hồi thừa thì vô hại,
> để sót thì không.

---

## 3. HAI LỚP BẢO VỆ ĐANG CHẠY

| lớp | tệp | vai trò |
|---|---|---|
| **Đóng cửa** | `038_revoke_anon_execute.sql` | thu hồi trên 19 hàm đang có |
| **Đổi ổ khoá** | `038b_default_privileges_hardening.sql` | hàm tạo sau không tự cấp cho `anon` |
| **Canh cửa** | `A001_view_security.sql` Mục 3 | **bắt buộc chạy mỗi vòng phát triển** |

⚠️ Cả ba đều cần thiết, không cái nào thay được cái nào:

- Chỉ **038** → hàm mới vẫn hở.
- Chỉ **038b** → 19 hàm cũ vẫn hở.
- Thiếu **A001** → hàm do vai khác tạo (extension) vẫn lọt, vì
  `ALTER DEFAULT PRIVILEGES` chỉ áp cho đối tượng do **một vai cụ thể** tạo ra.

---

## 4. KHI THÊM MỘT HÀM MỚI

```sql
CREATE OR REPLACE FUNCTION public.ten_ham(...)
RETURNS ... LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp        -- Mục 3
AS $$ ... $$;

REVOKE ALL ON FUNCTION public.ten_ham(...) FROM PUBLIC;   -- Mục 4
REVOKE ALL ON FUNCTION public.ten_ham(...) FROM anon;     -- ⚠️ CẢ HAI DÒNG
GRANT EXECUTE ON FUNCTION public.ten_ham(...) TO authenticated;  -- Mục 5
```

Rồi: thêm một dòng vào Mục 2 của sổ này, và **một phép thử `anon` phải bị từ
chối** vào bài kiểm hồi quy của migration đó.

> ⚠️ **Phải có CẢ HAI dòng `REVOKE`.** `FROM PUBLIC` không xoá grant thẳng cho
> `anon`; `FROM anon` không xoá quyền thừa kế qua `PUBLIC`. Đúng hai nửa này bị
> tách rời ở 018/025 (chỉ `anon`) và 030/036b (chỉ `PUBLIC`) — nên **cả bốn
> migration đều hở**.

---

## 5. NHẬT KÝ

| ngày | việc |
|---|---|
| 02/08/2026 | Lập sổ. A001 phát hiện 13/14 hàm `anon` gọi được, 2 hàm ghi. `038` chạy → đo lại **0/14**. `031a` hồi quy lại **35/35** — không vai nội bộ nào bị vạ lây. |
| 02/08/2026 | `038b` chạy. A001 bản 2 xác nhận: **19/19 hàm `anon` bị chặn · 19/19 ghim `search_path` · 11/11 view `invoker` · 0 view cho `anon` đọc.** |

## 6. RỦI RO CÒN LẠI — CHƯA ĐÓNG ĐƯỢC

A001 bản 2 Mục 4 cho thấy `038b` mới đóng **một nửa**:

| vai tạo | loại | mặc định cho `anon` | |
|---|---|---|---|
| `postgres` | hàm · bảng · sequence | không có | ✅ đã đóng bởi 038b |
| **`supabase_admin`** | **hàm** | `anon=X` | ⛔ |
| **`supabase_admin`** | **bảng** | `anon=arwdDxtm` | ⛔ **toàn quyền** |

`ALTER DEFAULT PRIVILEGES` chỉ áp cho đối tượng do **một vai cụ thể** tạo.
`038b` chạy dưới `postgres` nên chỉ đổi mặc định của `postgres`.

⚠️ Dòng **bảng** đáng lo hơn dòng hàm: `arwdDxtm` là **toàn quyền**, cấp cho
người **chưa đăng nhập**, trên mọi bảng do vai ấy tạo trong `public`.

**Mức độ thật hiện nay: thấp** — 102/102 bảng đã bật RLS, và đo bằng phiên
`anon` thật cho thấy bị chặn ở cả 25 bảng đã kiểm. Nhưng đây là **rủi ro của
tương lai**: một bảng mới do hạ tầng tạo ra mà quên bật RLS sẽ hở ngay.

`038c` **thử** đóng, và sẽ **báo thẳng** nếu `postgres` không đủ quyền — đó là
kết quả hợp lệ, không phải lỗi cần giấu. Khi đó lớp phòng vệ còn lại là
**A001 chạy mỗi vòng** (Hiến pháp V.4).
