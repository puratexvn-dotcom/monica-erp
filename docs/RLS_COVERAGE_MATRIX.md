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
| **`subcontractors`** | 2 | ⛔ | ⛔ | ~~🔴 2~~ ✅ **0** | ~~🔴 2~~ ✅ **0** | ~~🔴 2~~ ✅ **0** *(SC1 không có cầu nối)* · **1** với `SERVICE_PARTNER` | ✅ | ✅ |
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

> ## 🔴 02/08/2026 — `subcon_orders` RÒ RỈ GIÁ GIỮA HAI NHÀ THẦU CẠNH TRANH
>
> Phát hiện ngay khi `S001` Phần B gieo dữ liệu vào bảng vốn **rỗng**.
>
> | vai | thấy | |
> |---|---|---|
> | `SUB-GIAT-02` | **4/4** — cả đơn của IN-01, cả đơn mồ côi | 🔴 |
> | `SUB-IN-01` | **4/4** — cả đơn của GIAT | 🔴 |
> | `SC1` *(xưởng may)* | **4/4** — dù không có hồ sơ nhà thầu-dịch-vụ nào | 🔴 |
> | Buyer | 0/4 | ✅ |
> | Monica | 4/4 | ✅ |
>
> **Hệ quả nghiêm trọng nhất: `unit_price`.** GIAT đọc được đơn giá **7800**
> của IN-01, và ngược lại. Hai nhà thầu **cạnh tranh cùng một công đoạn** đọc
> được giá của nhau — Điều XXX: *"❌ không thấy giá của người khác"*.
>
> **Nguyên nhân:** `subcon_orders` nằm trong **danh sách cho phép của 025** nên
> không có `subcon_denied`; và `026` chỉ thêm ba policy RESTRICTIVE cho **GHI**
> (`subcon_no_insert/update/delete_assignment`). **Quyền ĐỌC chưa từng bị
> thu hẹp.**
>
> ⚠️ **Và nó vô hình cho tới hôm nay vì bảng rỗng** — cùng một vòng tròn với
> sự cố `bundle_stage_enum`. Đây là lần thứ hai trong một ngày.
>
> → Cần một chặng riêng trước `031d`. Chưa viết SQL, chờ phê duyệt.

> ## ✅ 02/08/2026 — `031b` ĐÃ CHẠY. NHÀ THẦU HẾT MÙ, BUYER THẤY CHI TIẾT ĐƠN.
>
> Hồi quy `live-031b`: **20 đạt · 0 hỏng**.
>
> | | trước | sau |
> |---|---|---|
> | `sewing_lines` · nhà thầu **có** phần việc | 0/4 🟡 | **1/4** ✅ đúng chuyền được giao |
> | `sewing_lines` · nhà thầu **không** phần việc | 0/4 | **0/4** ✅ |
> | `assignment_bundles` · nhà thầu | 0/1 🟡 | **1/1** ✅ |
> | `order_items` · Buyer | 0/3 🟡 | **3/3** ✅ chỉ đọc |
>
> **`sewing_lines` là bảng thứ ba trong hệ thống phân quyền theo TÀI NGUYÊN**
> (sau `assignments` và `assignment_daily_reports`) — SC1 thấy 1, SC2 thấy 0.
>
> Mở đọc **không** mở nhầm ghi: nhà thầu không sửa được chính chuyền họ nhìn
> thấy; Buyer không sửa được số lượng đặt hàng. `production_sites` **không**
> được mở — chỉ thị nói rõ *"Không phải Site"*.
>
> ### ⚠️ Một phép kiểm của `031b` báo ⛔ — và nó sai, không phải 031b sai
>
> Mục *"mọi bảng còn policy tên `buyer_scope%`/`buyer_denied`"* trả về **12**
> thay vì 0. Đã **quét 113 quan hệ bằng phiên Buyer thật** trước khi kết luận:
> **không một bảng nào ngoài phạm vi bị lộ**.
>
> 12 bảng đó sinh ra ở migration 019–030, tức **sau khi 018 chạy**. Vòng lặp
> của 018 là **ảnh chụp một thời điểm** — đúng cùng khuyết tật với danh sách
> viết cứng của 024 và 025. Chúng được canh bằng `*_internal_only`
> (`NOT mos_is_external()`), tên khác quy ước nhưng **chặn chặt hơn**.
>
> → Quy ước đặt tên của 018 Mục 7d **đã lỗi thời**. Bất biến thật là mục
> *"Bảng KHÔNG có hàng rào nào biết tới người ngoài = 0"* của **A002**.

> ## ✅ 02/08/2026 — `031a` ĐÃ CHẠY. CẢ 14 LỖ HỔNG GHI ĐÃ ĐÓNG.
>
> Hồi quy `live-031a`: **35 đạt · 0 hỏng**. Bảng dưới đây giữ lại **nguyên
> trạng trước khi vá** để làm bằng chứng lịch sử.
>
> | | sau 031a |
> |---|---|
> | Nhà thầu `INSERT`/`UPDATE`/`DELETE` 4 bảng lõi | ⛔ chặn — 12/12 phép thử |
> | Buyer `INSERT`/`UPDATE` 4 bảng lõi | ⛔ chặn — 8/8 |
> | **Người nội bộ (Monica)** | ✅ **không bị vạ lây** — 8/8 vẫn ghi được |
> | Nhà thầu **vẫn đọc** 4 bảng | ✅ bằng đúng `service_role` |
> | Nhà thầu **vẫn ghi** sản lượng theo giờ | ✅ |
>
> Gốc của lỗ hổng: xem `supabase/migrations/031a_block_external_write.sql`.

### 🔴 14 LỖ HỔNG GHI *(nguyên trạng trước 031a)* — HAI ĐIỀU LÀM NÓ NẶNG HƠN DỰ TÍNH

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
| 02/08/2026 | `A001` chạy — Kiến trúc sư xác nhận. `031a` chạy — đối chiếu **8/8**. Hồi quy `live-031a` **35/35**. **14/14 lỗ hổng GHI đã đóng, người nội bộ không bị vạ lây.** Viết `A002 · Policy Coverage`. | Claude |
| 02/08/2026 | **A001 phát hiện `anon` gọi được 13/14 hàm `SECURITY DEFINER`, gồm 2 hàm GHI.** `038` + `038b` chạy → **0/14**. `038c` không đủ quyền đổi mặc định của `supabase_admin` — rủi ro tồn đọng, đã ghi ở `SECURITY_DEFINER_REGISTRY.md` Mục 6. | Claude |
| 02/08/2026 | A001 + A002 gộp **một tập kết quả**: trước đó SQL Editor chỉ hiện `SELECT` cuối, nên Mục 1–3 chưa từng tới mắt ai. Sửa **ba kết luận sai** của chính hai bài kiểm. | Claude |
| 02/08/2026 | **`031b` chạy · hồi quy 20/20.** Nhà thầu hết mù; Buyer thấy `order_items` 3/3. Quét 113 quan hệ bằng phiên Buyer thật: **0 rò rỉ**. | Claude |
| 02/08/2026 | **`031c` + `031c2` chạy · hồi quy 13/13.** Nhà thầu hết thấy nhà thầu khác. Bản `031c` đầu **chặn phẳng thay vì khoanh vùng** — policy truy vấn `partners`, bảng mà chính đối tác không đọc được. Vá bằng hàm bắc cầu `SECURITY DEFINER`. → **Playbook K-3**. | Claude |
| | *Còn chờ:* mở rộng `S001` cho 3 bảng `subcon_*` đang rỗng → rồi `031d` | |
| 04/08/2026 | **`VR-001` đo xong bằng phiên đăng nhập thật** — [`audit/VR-001-KET-QUA.md`](audit/VR-001-KET-QUA.md). Đính chính một kết luận sai của Audit Report: người NGOÀI **không** rò `costings`/`style_bom` (đã có `buyer_denied` 018 + `subcon_denied` 025). Lỗ hổng thật ở phía **NỘI BỘ**: 23 bảng của `014`/`015` chạy bằng `authenticated_only` = `FOR ALL` + `GRANT ALL`. | Claude |
| 04/08/2026 | **`041` — Security Hotfix `F-1`.** Thu hồi `UPDATE`/`DELETE`/`TRUNCATE` của `authenticated` + `anon` trên `activity_log`. Sổ kiểm toán trước đó **sửa và xoá được bởi mọi vai nội bộ** — vi phạm BDR-14 và K-1. ⏳ *Board chưa chạy — chờ chép kết quả khối kiểm tra về đây.* | Claude |

### 🔴 F-2 — 22 bảng còn hở, chờ ADR-018

`[VERIFIED 04/08/2026]` Vai `md` **xoá cứng được** cả 23 bảng dưới đây; `041`
mới đóng bảng đầu tiên. Cột `GHI` để `🔴` cho tới khi migration của ADR-018 chạy.

| bảng | nguồn policy | authenticated `DELETE` | ghi chú |
|---|---|---|---|
| `activity_log` | `015` | 🔴 → *chờ `041`* | **sổ kiểm toán** · BDR-14 |
| `costings` · `costing_items` | `015` | 🔴 | **giá thành · biên lợi nhuận** |
| `style_bom` | `015` | 🔴 | **định mức — bí mật kỹ thuật** |
| `inquiries` | `015` | 🔴 | dữ liệu thương mại |
| `customers` · `production_orders` · `material_requests` | `014` | 🔴 | |
| 15 bảng MD còn lại *(xem `VR-001-KET-QUA.md` §4)* | `015` | 🔴 | |

⚠️ **Cột ĐỌC của 23 bảng này là `⚪`, không phải `⛔`** — bảng đang rỗng, Điều
V.1 cấm kết luận. Suy luận từ biểu thức policy nói rằng thủ kho đọc được
`costings`, nhưng **suy luận không phải phép đo**. Đo lại sau Cổng C.

> ### 🔑 K-3 — bài học đắt nhất của chặng 031c
>
> **Truy vấn con bên trong một RLS policy vẫn chịu RLS**, đánh giá dưới quyền
> người gọi. Policy bắc cầu qua `partners` (đóng với đối tác) ⇒ `EXISTS` luôn
> sai ⇒ **chặn phẳng đội lốt khoanh vùng**.
>
> Và bài kiểm **suýt không bắt được**: nếu chỉ dùng `PRODUCTION_PARTNER` (vốn
> chờ 0) thì chặn-phẳng cũng ra 0 và vẫn xanh. Nó bị bắt **chỉ vì** có một vai
> **chờ thấy > 0**.
>
> ⚠️ **`031b` đang phụ thuộc ngầm vào policy đọc của `assignments`.** Chặng nào
> siết `assignments` chặt hơn sẽ làm Line Map tối đi mà không ai đụng tới
> `sewing_lines`. Phải đo lại `sewing_lines` sau **mọi** thay đổi trên
> `assignments`.

> ⚠️ **Một lỗi của chính bài hồi quy, ghi lại để không lặp:** bản đầu của
> `live-031a` viết cứng số dòng chờ (`orders = 4`…), trong khi chính nó vừa
> tạo 4 dòng tạm cho phép thử `DELETE` → báo **5 lỗi GIẢ**. Sửa bằng cách dọn
> dòng tạm ngay sau mỗi phép thử, và đối chiếu với **số dòng `service_role`
> thấy** thay vì hằng số. Đây là lần thứ hai số viết cứng gây báo động giả
> (lần đầu: `live-024` với "2 đơn hàng").
