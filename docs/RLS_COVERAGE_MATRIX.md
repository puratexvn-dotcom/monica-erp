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

## 2. MA TRẬN ĐỌC (`SELECT`) — ĐO 01/08/2026, TRƯỚC KHI GIEO S001

Đo bằng phiên đăng nhập thật. `Subcon(+)` = đã có `partner_accounts` **và** một
phần việc đang hiệu lực. `Subcon(−)` = có vai nhưng chưa được giao gì.

| bảng | dòng | Super | Monica | Buyer | Subcon(−) | Subcon(+) | Suppl. | Forw. |
|---|---:|---|---|---|---|---|---|---|
| **`assignments`** | 0→ | ✅ | ✅ | ⛔ | ⛔ | ✅ **chỉ của mình** | ⚪ | ⚪ |
| `assignment_bundles` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `assignment_daily_reports` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `assignment_commercial_terms` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **`orders`** | 3 | ✅ | ✅ | ✅ *(theo `customer_id`)* | 🔴 **3/3** | 🔴 **3/3** | ⚪ | ⚪ |
| `order_items` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `customers` | 1 | ✅ | ✅ | ✅ **chỉ mình** | ⛔ | ⛔ | ⚪ | ⚪ |
| `styles` | 0 | ⚪ | ⚪ | ✅ *(đo bằng dữ liệu tạm)* | ⚪ | ⚪ | ⚪ | ⚪ |
| **`subcontractors`** | 2 | ✅ | ✅ | ⛔ | 🔴 **2/2** | 🔴 **2/2** | ⚪ | ⚪ |
| **`cut_bundles`** | 2 | ✅ | ✅ | · | 🔴 **2/2** | 🔴 **2/2** | ⚪ | ⚪ |
| **`cut_tickets`** | 1 | ✅ | ✅ | · | 🔴 **1/1** | 🔴 **1/1** | ⚪ | ⚪ |
| `cut_ticket_rolls` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **`sewing_lines`** | 3 | ✅ | ✅ | · | 🟡 **0/3** | 🟡 **0/3** | ⚪ | ⚪ |
| `hourly_production_logs` | 1 | ✅ | ✅ | · | 🔴 **1/1** | 🔴 **1/1** | ⚪ | ⚪ |
| `daily_production_logs` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `qa_audit_reports` | 2 | ✅ | ✅ | · | 🔴 **2/2** | 🔴 **2/2** | ⚪ | ⚪ |
| `qa_logs` | 10 | ✅ | ✅ | · | ⛔ | ⛔ | ⚪ | ⚪ |
| `qa_defects` | 3 | ✅ | ✅ | · | ⛔ | ⛔ | ⚪ | ⚪ |
| `capa_logs` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `shipments` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `shipment_cartons` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `inventory` | 7 | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⚪ | ⚪ |
| `stock_levels` | 4 | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⚪ | ⚪ |
| `stock_movements` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `financial_records` | 2 | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⚪ | ⚪ |
| `subcon_orders` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `profiles` | 13 | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⚪ | ⚪ |
| `partners` | 5 | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⚪ | ⚪ |
| `partner_accounts` | 0 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `partner_permissions` | 21 | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⚪ | ⚪ |

### Hai điều bảng trên nói to nhất

**① `assignments` là dòng DUY NHẤT có `Subcon(−)` khác `Subcon(+)`.**
Mọi dòng khác, hai cột giống hệt nhau — nghĩa là 29/30 bảng vẫn phân quyền
theo **VAI TRÒ**, không theo **TÀI NGUYÊN ĐƯỢC GIAO**. Đây chính là khoảng
cách mà Migration 031 phải lấp.

**② `sewing_lines` là ô `🟡` duy nhất — lỗ hổng NGƯỢC CHIỀU.**
Không phải "thấy quá nhiều" mà là "không thấy gì", trong khi Line Map là thứ
nhà thầu **bắt buộc** phải xem. *"Không được vì bảo mật mà biến Subcon thành
người mù."*

---

## 3. MA TRẬN GHI (`INSERT` / `UPDATE` / `DELETE`)

`DELETE` xử lý riêng: migration `029b` đã `REVOKE DELETE, TRUNCATE` khỏi
`authenticated` và `anon` trên 8 bảng nghiệp vụ. Với dữ liệu nghiệp vụ, đường
xoá đúng là **xoá mềm** (`deleted_at`), không phải `DELETE`.

| bảng | lệnh | Buyer | Subcon(+) | ghi chú |
|---|---|---|---|---|
| `orders` | `INSERT` | ⛔ *(đo lại, hợp lệ)* | 🔴 **CHO** | 🔴 nhà thầu tạo được đơn hàng |
| `orders` | `UPDATE` | ⛔ *(đo lại, hợp lệ)* | 🔴 **CHO** | 🔴 sửa được **số lượng · ngày giao · đơn giá** |
| `cut_bundles` | `INSERT`/`UPDATE` | · | 🔴 **CHO** | |
| `cut_tickets` | `INSERT`/`UPDATE` | · | 🔴 **CHO** | |
| `assignments` | mọi lệnh | ⛔ | ⛔ | `026` chỉ cho nhà thầu **từ chối**, không cho sửa |
| `assignment_daily_reports` | `INSERT` | ⛔ | ✅ **đúng ý đồ** | nhà thầu **có trách nhiệm ghi** |
| `assignment_daily_reports` | `UPDATE`/`DELETE` | ⛔ | ⛔ | sổ cái chỉ-ghi-thêm, **không ngoại lệ cho `service_role`** |
| mọi bảng khác | mọi lệnh | · | · | ⚠️ **đã huỷ kết luận cũ** — xem cảnh báo Mục 0 |

> 🔴 **Ba dòng đỏ đầu bảng là lỗ hổng bảo mật P0.** Chúng là lý do Migration
> `031a` (cấm ghi) phải chạy **trước** mọi chặng khác của 031.

---

## 4. VIEW — 11 VIEW EXPOSE QUA API

View thiếu `security_invoker = true` chạy bằng quyền **người sở hữu**
(`postgres`), tức **vượt mặt toàn bộ RLS**. Đó là cửa sau hoàn chỉnh.

Đo hành vi 01/08/2026 (so số dòng `service_role` với số dòng vai bị chặn):

| view | admin | buyer | subcon | kết luận |
|---|---:|---:|---:|---|
| `v_bin_path` | 3 | 0 | 0 | ✅ invoker bật, không rò |
| `v_material_roll_trace` | 2 | 0 | 0 | ✅ invoker bật, không rò |
| `v_shade_board` | 2 | 0 | 0 | ✅ invoker bật, không rò |
| `v_po_shipment_readiness` | 4 | **1** | **4** | ⛔ invoker bật *(buyer bị lọc)* nhưng **rò cho subcon** |
| `vw_cut_ticket_summary` | 1 | 0 | **1** | ⛔ invoker bật nhưng **rò cho subcon** |
| `v_assignment_report_status` | 0 | 0 | 0 | ⚪ view rỗng |
| `v_assignment_timeline` | 0 | 0 | 0 | ⚪ view rỗng |
| `v_inspection_score` | 0 | 0 | 0 | ⚪ view rỗng |
| `v_order_risk` | 0 | 0 | 0 | ⚪ view rỗng |
| `v_po_material_readiness` | 0 | 0 | 0 | ⚪ view rỗng |
| `v_po_shipments` | 0 | 0 | 0 | ⚪ view rỗng |

**Hai view rò không phải lỗi của view.** Chúng đọc `orders` / `cut_tickets`, mà
RLS của hai bảng đó đang cho nhà thầu xem tất. Thu hẹp bảng gốc ở `031d`/`031e`
sẽ tự bịt cả hai — **miễn là cờ `security_invoker` còn bật**.

**6/11 view rỗng ⇒ phép đo hành vi không thay được việc đọc cờ.** Chạy
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
| | *Chờ:* chạy `S001` → đo lại toàn bộ ô `⚪`; chạy `A001` → chốt Mục 4 | |
