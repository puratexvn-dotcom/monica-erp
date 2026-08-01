# RLS COVERAGE MATRIX

> **Tài liệu sống.** Cập nhật sau mỗi migration chạm tới RLS.
> Ban hành theo quyết định của Kiến trúc sư trưởng, 01/08/2026.
>
> *"6 tháng nữa. 300 bảng. Không ai nhớ."*

---

## 0. CÁCH ĐỌC — VÀ MỘT LỜI CẢNH BÁO

| ký hiệu | nghĩa |
|---|---|
| `✅` | vai này **được phép**, và đã **đo bằng phiên đăng nhập thật** |
| `⛔` | vai này **bị chặn**, và đã đo — bảng **có dữ liệu** nên số 0 là kết luận thật |
| `🔴` | vai này thấy/ghi được thứ **KHÔNG được phép** — lỗ hổng đang mở |
| `🟡` | đúng luật hiện tại nhưng **sai ý đồ nghiệp vụ** — cần sửa |
| `⚪` | **CHƯA ĐO ĐƯỢC** — bảng rỗng, hoặc chưa có vai để đăng nhập |
| `·` | chưa đo |

### ⚠️ `⚪` KHÔNG PHẢI `⛔`

Điều V.1 Hiến pháp: trên bảng rỗng, "RLS chặn đúng" và "chẳng có gì để thấy"
trông **giống hệt nhau**. Ô nào là `⚪` thì tài liệu này **không khẳng định gì cả**.

Tại thời điểm lập bảng, **65 / 113 quan hệ đang rỗng**. Đó là lý do
[`supabase/seeds/S001_business_baseline.sql`](../supabase/seeds/S001_business_baseline.sql)
tồn tại, và là lý do phần lớn ma trận này còn `⚪`.

### ⚠️ CỘT GHI PHẦN LỚN CÒN TRỐNG — CÓ LÝ DO

Bài đo quyền GHI ngày 01/08/2026 dùng kỹ thuật *gửi `INSERT` rỗng rồi đọc mã
lỗi*. Kỹ thuật đó **đã bị cấm** (Playbook K-2): nó giả định mọi bảng đều có
ràng buộc chặn lại, và trên 4 bảng toàn cột nullable nó **tạo ra 8 dòng rác**.

Vì vậy **mọi kết luận GHI thu được bằng kỹ thuật đó đã bị huỷ bỏ**, trừ những
ô được đo lại bằng cách gửi một bản ghi **hợp lệ, đầy đủ** rồi dọn ngay.
Thà để trống còn hơn ghi một con số không đáng tin.

---

## 1. SÁU VAI — VAI NÀO CÓ THẬT, VAI NÀO CÒN TRÊN GIẤY

| vai | tồn tại? | đường xác định danh tính | ghi chú |
|---|---|---|---|
| **SuperAdmin** | ✅ có | `app_metadata.role = 'superadmin'` | |
| **Monica** (nội bộ) | ✅ có | `app_metadata.role` ∈ md/qa/cutting/… | nhiều vai con |
| **Buyer** | ✅ có | `buyer_accounts.user_id` → `customer_id` | ⚠️ bảng nối đang **0 dòng** |
| **Subcon** | ✅ có | `partner_accounts.user_id` → `partner_id` | ⚠️ bảng nối đang **0 dòng** |
| **Supplier** | 🚧 chưa | `partners.partner_type = 'SUPPLIER'` | có loại đối tác, **chưa có RLS, chưa có cổng** |
| **Forwarder** | 🚧 chưa | `partners.partner_type = 'FORWARDER'` | 027 định nghĩa loại; **0 dòng**, chưa có RLS |

> **Không được suy ra "Supplier bị chặn" từ việc Supplier không thấy gì.**
> Họ không thấy gì vì **chưa ai đăng nhập được bằng vai đó**. Đó là `⚪`.

**JWT chỉ mang Danh tính, không mang Quyền.** Quyền tra từ `partner_accounts`
+ `partner_permissions` tại thời điểm truy vấn, qua `mos_partner_can()`.

---

## 2. MA TRẬN ĐỌC (`SELECT`) — ĐO 01/08/2026 **SAU KHI GIEO S001**

Đo bằng phiên đăng nhập thật, mọi bảng chính **đã có dữ liệu** nên số 0 giờ mới
là kết luận (Điều V.1). Ba cột nhà thầu là chủ ý:

| cột | nghĩa |
|---|---|
| `Sub(−)` | có vai `subcon`, **không** có `partner_accounts` |
| `Sub SC2` | **có** tài khoản đối tác, **không** được giao phần việc nào |
| `Sub SC1` | **có** tài khoản đối tác **và** một phần việc đang hiệu lực |

Ba cột đó khác nhau ở đâu thì **ở đó mới có phân quyền theo tài nguyên**.

| bảng | dòng | anon | Buyer | Sub(−) | Sub SC2 | Sub SC1 | Monica | Super |
|---|---:|---|---|---|---|---|---|---|
| **`orders`** | 4 | ⛔ | ✅ **1** | 🔴 **4** | 🔴 **4** | 🔴 **4** | ✅ 4 | ✅ 4 |
| `order_items` | 3 | ⛔ | 🟡 **0** | ⛔ | ⛔ | ⛔ | ✅ 3 | ✅ 3 |
| `customers` | 1 | ⛔ | ✅ **1** | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `styles` | 1 | ⛔ | ✅ **1** | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| **`assignments`** | 2 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ **1 — chỉ của mình** | ✅ 2 | ✅ 2 |
| `assignment_bundles` | 1 | ⛔ | ⛔ | ⛔ | ⛔ | 🟡 **0** | ✅ | ✅ |
| `assignment_daily_reports` | 1 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ **1 — của mình** | ✅ | ✅ |
| `assignment_commercial_terms` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **`subcontractors`** | 2 | ⛔ | ⛔ | 🔴 **2** | 🔴 **2** | 🔴 **2** | ✅ | ✅ |
| **`cut_tickets`** | 2 | ⛔ | ⛔ | 🔴 **2** | 🔴 **2** | 🔴 **2** | ✅ | ✅ |
| **`cut_bundles`** | 3 | ⛔ | ⛔ | 🔴 **3** | 🔴 **3** | 🔴 **3** | ✅ | ✅ |
| **`sewing_lines`** | 4 | ⛔ | ⛔ | 🟡 **0** | 🟡 **0** | 🟡 **0** | ✅ | ✅ |
| `production_sites` | 1 | ⛔ | ⛔ | 🟡 **0** | 🟡 **0** | 🟡 **0** | ✅ | ✅ |
| `hourly_production_logs` | 1 | ⛔ | ⛔ | 🔴 **1** | 🔴 **1** | 🔴 **1** | ✅ | ✅ |
| **`qa_audit_reports`** | 3 | ⛔ | ✅ **1** | 🔴 **3** | 🔴 **3** | 🔴 **3** | ✅ | ✅ |
| `qa_logs` | 10 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `qa_defects` | 3 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `shipments` | 1 | ⛔ | ✅ **1** | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `inventory` | 7 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `stock_levels` | 4 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `financial_records` | 2 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `profiles` | 19 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `partners` | 6 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `partner_accounts` | 2 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `partner_permissions` | 21 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |

> `anon` bị chặn ở **cả 25 bảng** — chưa đăng nhập thì không đọc được gì.

### Bốn điều bảng trên nói to nhất

**① `assignments` + `assignment_daily_reports` là HAI dòng DUY NHẤT có
`Sub SC1` khác `Sub SC2`.** Đúng 2/25 bảng phân quyền theo **tài nguyên**.
23 bảng còn lại vẫn theo **vai trò** — `Sub(−)`, kẻ **chưa có tài khoản đối
tác nào**, vẫn thấy đủ 4 đơn hàng và 3 bó. Đây là khoảng cách 031 phải lấp.

**② Ba ô `🟡` là lỗ hổng NGƯỢC CHIỀU — nhà thầu bị mù.**
`sewing_lines` 0/4 · `production_sites` 0/1 · `assignment_bundles` 0/1.
Nhà thầu **không xem được Line Map, không xem được địa điểm của chính mình,
không xem được bó thuộc phần việc của chính mình** — trong khi đó là những thứ
họ bắt buộc phải thấy để làm việc. *"Không được vì bảo mật mà biến Subcon
thành người mù."*

**③ Buyer không thấy `order_items` của chính đơn mình (0/3).**
Thấy đơn nhưng không thấy chi tiết cỡ/màu. Cần Kiến trúc sư xác nhận đây là
chủ ý hay thiếu sót.

**④ Buyer đo đúng ở mọi chỗ còn lại** — `orders` 1/4, `customers` 1/1,
`styles` 1/1, `shipments` 1/1, `qa_audit_reports` 1/3. Xem Mục 2.1.

### 2.1 ⚠️ Vì sao Buyer thấy `orders` 1/4 chứ không phải 1/1

Ba đơn còn lại có `customer_id IS NULL` (dữ liệu lịch sử). Buyer **không** thấy
chúng — nhưng đó là vì `NULL = <giá trị>` cho ra `NULL`, **không** vì RLS nhận
ra chúng thuộc khách khác. Kết quả đúng, lý do thì là **fail-closed**.

Chiến lược xử lý: **ADR-007 · Data Reconciliation**. Nguyên tắc gốc đã lên
Hiến pháp **III.1**: *Migration không được tự suy diễn dữ liệu nghiệp vụ.*

---

## 3. MA TRẬN GHI (`INSERT` / `UPDATE` / `DELETE`)

`DELETE` xử lý riêng: migration `029b` đã `REVOKE DELETE, TRUNCATE` khỏi
`authenticated` và `anon` trên 8 bảng nghiệp vụ. Với dữ liệu nghiệp vụ, đường
xoá đúng là **xoá mềm** (`deleted_at`), không phải `DELETE`.

Đo 01/08/2026 sau khi gieo S001, bằng **bản ghi hợp lệ và đầy đủ** (K-2), dọn
ngay nếu lọt. `UPDATE` chỉ chạm dòng `SEED-*`, có chụp giá trị trước và khôi
phục theo bản chụp — **không chạm một dòng thật nào**.

| bảng · lệnh | Buyer | Sub SC2 *(không có phần việc)* | Sub SC1 *(có phần việc)* |
|---|---|---|---|
| **`orders` · `INSERT`** | ⛔ | 🔴 **TẠO ĐƯỢC** | 🔴 **TẠO ĐƯỢC** |
| **`orders` · `UPDATE total_quantity`** | ⛔ | 🔴 **SỬA ĐƯỢC** | 🔴 **SỬA ĐƯỢC** |
| **`cut_tickets` · `INSERT`** | ⛔ | 🔴 **TẠO ĐƯỢC** | 🔴 **TẠO ĐƯỢC** |
| **`cut_bundles` · `INSERT`** | ⛔ | 🔴 **TẠO ĐƯỢC** | 🔴 **TẠO ĐƯỢC** |
| **`cut_bundles` · `UPDATE quantity`** | ⛔ | 🔴 **SỬA ĐƯỢC** | 🔴 **SỬA ĐƯỢC** |
| **`qa_audit_reports` · `INSERT`** | ⛔ | 🔴 **TẠO ĐƯỢC** | 🔴 **TẠO ĐƯỢC** |
| **`qa_audit_reports` · `UPDATE defect_qty`** | ⛔ | 🔴 **SỬA ĐƯỢC** | 🔴 **SỬA ĐƯỢC** |
| `styles` · `INSERT` | ⛔ | ⛔ | ⛔ |
| `subcontractors` · `INSERT` | ⛔ | ⛔ | ⛔ |
| `sewing_lines` · `INSERT` / `UPDATE` | ⛔ | ⛔ | ⛔ |
| `shipments` · `INSERT` / `UPDATE status` | ⛔ | ⛔ | ⛔ |
| `assignments` · `INSERT` / `UPDATE priority` | ⛔ | ⛔ | ⛔ |
| `assignment_daily_reports` · `INSERT` | ⛔ | — | ✅ **đúng ý đồ** — nhà thầu **có trách nhiệm ghi** |
| `assignment_daily_reports` · `UPDATE`/`DELETE` | ⛔ | ⛔ | ⛔ sổ cái chỉ-ghi-thêm, **không ngoại lệ cho `service_role`** |

### 🔴 14 LỖ HỔNG GHI — VÀ HAI ĐIỀU LÀM NÓ NẶNG HƠN DỰ TÍNH

**① `Sub SC2` GHI ĐƯỢC Y HỆT `Sub SC1`.**
Một nhà thầu **không được giao bất kỳ phần việc nào** vẫn sửa được số lượng
đơn hàng. Quyền ghi hiện **hoàn toàn theo VAI TRÒ**, không dính dáng gì tới
tài nguyên được giao.

**② `qa_audit_reports` — nhà thầu SỬA ĐƯỢC KẾT QUẢ KIỂM HÀNG.**
Đây là phát hiện mới, **không** có trong bản phân tích trước (bản đó chỉ soi
`orders`/`cut_*`). Nhà thầu tự hạ `defect_qty` của chính mình xuống 0 là **xoá
dấu vết lỗi chất lượng**. Về hậu quả nghiệp vụ, cái này ngang hoặc nặng hơn
việc sửa `orders`: sửa đơn hàng thì Merchandiser còn đối chiếu ra, sửa kết quả
kiểm thì **không còn gì để đối chiếu**.

> Cả 14 lỗ hổng đều là lý do `031a` (cấm ghi) phải chạy **trước** mọi chặng
> khác của 031.

**Đã kiểm chặn đúng:** `styles`, `subcontractors`, `sewing_lines`, `shipments`,
`assignments` — nhà thầu không tạo, không sửa. Migration `026` giữ đúng lời
hứa: nhà thầu chỉ **từ chối** được phần việc, không sửa được nó.

---

## 4. VIEW — 11 VIEW EXPOSE QUA API

View thiếu `security_invoker = true` chạy bằng quyền **người sở hữu**
(`postgres`), tức **vượt mặt toàn bộ RLS**. Đó là cửa sau hoàn chỉnh.

Đo hành vi **sau khi gieo S001** (so số dòng `service_role` với vai bị chặn):

| view | admin | buyer | Sub SC1 | anon | kết luận |
|---|---:|---:|---:|---|---|
| **`v_assignment_report_status`** | 6 | 0 | **6** | ⛔ | ⛔ **rò cho nhà thầu** |
| **`v_po_shipment_readiness`** | 6 | 1 | **6** | ⛔ | ⛔ **rò cho nhà thầu** |
| **`vw_cut_ticket_summary`** | 4 | 0 | **4** | ⛔ | ⛔ **rò cho nhà thầu** |
| `v_assignment_timeline` | 2 | 0 | **1** | ⛔ | ✅ **khoanh đúng theo phần việc** |
| `v_bin_path` | 3 | 0 | 0 | ⛔ | ✅ |
| `v_material_roll_trace` | 2 | 0 | 0 | ⛔ | ✅ |
| `v_shade_board` | 2 | 0 | 0 | ⛔ | ✅ |
| `v_po_shipments` | 1 | 1 | 0 | ⛔ | ✅ *(xem cảnh báo dưới)* |
| `v_inspection_score` | 0 | 0 | 0 | ⛔ | ⚪ vẫn rỗng |
| `v_order_risk` | 0 | 0 | 0 | ⛔ | ⚪ vẫn rỗng |
| `v_po_material_readiness` | 0 | 0 | 0 | ⛔ | ⚪ vẫn rỗng |

**⭐ `v_assignment_timeline` là bằng chứng mẫu mực:** admin 2, nhà thầu **1** —
view khoanh đúng theo phần việc được giao. Đây là hình mẫu 031 cần nhân rộng.

**Ba view rò không phải lỗi của view.** Chúng đọc `orders` / `cut_tickets` /
`assignments`, mà RLS bảng gốc đang cho nhà thầu xem tất. Thu hẹp bảng gốc ở
`031d`/`031e` sẽ tự bịt — **miễn là cờ `security_invoker` còn bật**.

> ### ⚠️ MỘT KẾT LUẬN SAI CỦA CHÍNH BÀI ĐO — `v_po_shipments`
>
> Luật xét tự động của tôi là *"vai bị chặn thấy **bằng** admin ⇒ rò"*. Với
> `v_po_shipments` (admin 1, buyer 1) nó tô đỏ và báo **"rò cho buyer"**.
>
> **Sai.** Dòng duy nhất của view đó là lô hàng `SEED-SHIP-01`, thuộc đơn
> `SEED-PO-0001`, mà đơn đó **chính là của khách hàng buyer đang đăng nhập**.
> Buyer thấy 1/1 vì cả tập dữ liệu **vốn là của họ**.
>
> Bài học: `thấy = tổng` **không đồng nghĩa** với rò khi tổng nhỏ. Phải hỏi
> *"dòng đó có đúng là của họ không"*, chứ không phải *"họ thấy mấy dòng"*.
> Đây đúng là cái bẫy Điều V.1 nói tới, ở dạng khác: **tập dữ liệu quá nhỏ
> thì phép đếm không phân biệt được đúng với sai.**

**3/11 view vẫn rỗng ⇒ phép đo hành vi không thay được việc đọc cờ.** Chạy
[`supabase/audits/A001_view_security.sql`](../supabase/audits/A001_view_security.sql)
— tệp chỉ-đọc, ném lỗi nếu có view hở.

⚠️ Migration `024` Mục 7 bật cờ bằng một **danh sách viết cứng 7 tên**, và bỏ
qua trong im lặng thứ không tìm thấy. Danh sách viết cứng **không tự lớn lên
theo lược đồ** — nên A001 liệt kê **động**.

---

## 5. LUẬT BẢO TRÌ TÀI LIỆU NÀY

1. Migration nào **thêm bảng** → thêm dòng, để `⚪`, **không** để trống.
2. Migration nào **đổi policy** → đo lại **cả hàng**, không chỉ ô vừa sửa.
3. Migration nào **thêm view** → thêm vào Mục 4 **và** chạy lại A001.
4. Ô `⚪` chỉ được đổi thành `⛔` khi bảng **đã có dữ liệu**. Điều V.1.
5. Vai mới (Supplier, Forwarder) mở cổng → **đo lại toàn bộ cột**, không suy luận.

### Nhật ký

| ngày | việc | ai |
|---|---|---|
| 01/08/2026 | Lập bảng. Đo 30 bảng × 5 vai + 11 view. Buyer đo bằng khách hàng thật (21/21 đạt). | Claude |
| 01/08/2026 | `S001` đã chạy (16/16 đối chiếu đạt). **Đo lại toàn bộ:** 25 bảng × 7 vai · 15 phép GHI · 11 view. Phát hiện **14 lỗ hổng GHI**, trong đó `qa_audit_reports` là **mới**. Ghi nhận một kết luận sai của chính bài đo (`v_po_shipments`). | Claude |
| | *Còn chờ:* kết quả `A001` để chốt cờ `security_invoker` của 3 view vẫn rỗng | |
