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
| ~~`mos_po_dang_san_xuat(UUID)`~~ | ~~049~~ | 🔴 **ĐÃ GỠ ở `050`.** Bản `049` tách phép thử thành hàm cầu CÓ THAM SỐ rồi `REVOKE EXECUTE` — nhưng trigger `SECURITY INVOKER` chạy dưới quyền **NGƯỜI GỌI**, nên `md` mất quyền gọi ⇒ **mọi lệnh sửa đơn đổ `42501`**. `050` gộp phép thử vào chính hàm trigger. | ADR-027 | — |
| `mos_guard_po_content_lock()` | **050** | Khoá NỘI DUNG đơn đã sinh lệnh sản xuất. `SECURITY DEFINER` vì quy tắc `K-3`: phải nhìn thấy `production_orders` bất kể RLS người gọi. 🔑 **⛔ KHÔNG cần `REVOKE`** — hàm trả `trigger`, Postgres **cấm gọi trực tiếp**, nên nó ⛔ không phải bề mặt phơi ra và ⛔ không có kênh dò như hàm có tham số. | ADR-027 | ⛔ ⛔ không gọi được |
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

### 2.4 ⚠️ VIEW CHẠY DƯỚI QUYỀN CHỦ HÀM — ⏳ ĐỀ XUẤT, CHƯA CHẠY

`A001` bản 2 (02/08/2026) đo được **11/11 view đều `security_invoker`**. Đó là
bất biến tốt, và mục này ghi nhận **chỗ đầu tiên phá nó** — kèm lý do, để không
ai ba tháng sau tưởng là sơ suất.

| view | migration | vì sao buộc phải chạy dưới quyền chủ hàm | ADR | trạng thái |
|---|---|---|---|---|
| `v_costing_approved` | **`042`** ⏳ *chưa chạy* | Phán quyết Board **`VR-005`** (05/08/2026) cho kế toán xem *giá đã duyệt · Contribution Margin* nhưng **cấm** *Cost Breakdown · Draft Costing · dữ liệu thương lượng*. Đó là phân quyền theo **CỘT**; **RLS chỉ lọc DÒNG**, và `GRANT SELECT (cột)` cấp theo **vai CSDL** — mà mọi người dùng Monica đều là `authenticated`, nên nó không phân biệt được `ketoan` với `md`. ⇒ `ketoan` bị cấm bảng gốc `costings` và đọc phép chiếu này. Đặt `security_invoker = true` ⇒ view chạy dưới quyền `ketoan` ⇒ bị `costings_read` chặn ⇒ **trả rỗng**, phán quyết Board không thi hành được | **ADR-018** §5.1.1 | ⏳ |

**Ba nghĩa vụ bù lại — ADR-018 §5.1.1:**

| # | Nghĩa vụ | Tình trạng |
|---|---|---|
| ① | Ghi vào sổ này kèm lý do và ADR | ✅ chính là mục này |
| ② | Chạy lại **`A001`** *(view security)* sau khi `042` chạy | ✅ **05/08/2026 — ĐẠT** *(xem dưới)* |
| ③ | View **tự mang** bộ lọc `status = 'APPROVED'` + tự giới hạn danh sách vai, không dựa vào policy nào ở dưới | ✅ đã viết vào `042` Mục 4 |

🔴 **Cột trong view này là quyết định TIẾT LỘ, không phải chi tiết kỹ thuật.**
Năm cột bị bỏ có chủ ý — `target_price` · `notes` · `reject_reason` ·
`inquiry_id` · `created_by`. **Không thêm cột nếu chưa có phán quyết Board.**

#### `A001` sau `042` — chạy 05/08/2026, **ĐẠT**

| Phép đo | Kết quả | |
|---|---|---|
| View thiếu `security_invoker` — **CHƯA ĐĂNG KÝ** | **0 / 12** | ✅ |
| View chạy quyền chủ hàm — **ĐÃ ĐĂNG KÝ** | `v_costing_approved` | ⚠️ đúng dự kiến |
| **View cho `anon` đọc** | **0** | ✅ ⭐ |
| Hàm `SECDEF` mà `anon` gọi được | **0 / 20** | ✅ |
| Hàm `SECDEF` chưa ghim `search_path` | **0** | ✅ |

⭐ **Dòng đáng giá nhất là `View cho anon đọc = 0`.** Một view chạy quyền chủ
hàm *mà `anon` đọc được* là lỗ hổng nặng nhất `A001` có thể gặp — nó vượt mặt
RLS **và** không cần đăng nhập. `v_costing_approved` được che hai lớp: `REVOKE
ALL … FROM anon` viết thẳng trong `042`, và quyền mặc định của vai `postgres`
*(vai chủ khi chạy SQL Editor)* vốn không cấp gì cho `anon`.

⚠️ **Rủi ro Mục 4 vẫn còn — 3 vai cấp mặc định cho `anon`** *(`supabase_admin`
tạo bảng · hàm · sequence)*. Đây là **tồn đọng có sẵn**, đã ghi ở §6 và ở
`038c`: `ALTER DEFAULT PRIVILEGES` chỉ áp cho đối tượng do **một vai cụ thể**
tạo, và ta không đủ quyền đổi mặc định của `supabase_admin`. **Không phải do
`042` sinh ra.** Đối tượng do `postgres` tạo — tức mọi thứ migration dựng lên —
đều sạch, A001 xác nhận bằng ba dòng `postgres tạo … ✅`.

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
| 05/08/2026 | ✅ **`A001` chạy lại sau `042` — ĐẠT.** `0/12` view chưa đăng ký · `0` view cho `anon` đọc · `0/20` hàm `anon` gọi được · `0` hàm thiếu `search_path`. Nghĩa vụ ② khép. `A001` được sửa để phân biệt **view chưa đăng ký** *(⛔)* với **ngoại lệ có ADR** *(⚠️, in tên)* — bằng danh sách **đích danh**, không phải ngưỡng, nên view thứ hai sinh do sơ suất vẫn ném lỗi như cũ | Claude |
| 05/08/2026 | ⏳ **`042` đề xuất view `v_costing_approved` KHÔNG `security_invoker`** — chỗ đầu tiên phá bất biến *"11/11 view invoker"*. Buộc phải vậy vì phán quyết Board `VR-005` là phân quyền theo **cột**, thứ RLS không làm được. Đăng ký ở §2.4 kèm ba nghĩa vụ. **`A001` phải chạy lại ngay sau `042`.** |
| 08/08/2026 | 🔴 **`049` thêm `mos_po_dang_san_xuat(UUID)`** — hàm `SECURITY DEFINER` **CÓ THAM SỐ** đầu tiên của sổ này. Vì có tham số nên nó là **kênh dò**: ai gọi được sẽ biết *"đơn X đã vào sản xuất chưa"* với quyền chủ sở hữu. ⇒ `REVOKE ALL ... FROM PUBLIC, anon, authenticated` ngay trong cùng migration — **chỉ trigger gọi nó**. Cột `anon` của hàm này là **⛔ ĐÃ THU HỒI**, ⛔ không phải ✅. |
| 08/08/2026 | 🔴 **`050` GỠ hàm đó đi.** Giả định *"chỉ trigger gọi nó"* **SAI**: hàm trigger `SECURITY INVOKER` chạy dưới quyền NGƯỜI GỌI. `REVOKE` đúng, nhưng để hàm cần quyền ấy nằm trên đường chạy của người dùng thường là sai ⇒ `42501` cho mọi lệnh sửa đơn, hỏng 11 phép thử UAT. 🔑 **BÀI HỌC:** hàm trả `trigger` là chỗ ĐÚNG để đặt `SECURITY DEFINER` — ⛔ không gọi trực tiếp được nên ⛔ không cần thu hồi quyền, và bớt được một bề mặt. |

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
