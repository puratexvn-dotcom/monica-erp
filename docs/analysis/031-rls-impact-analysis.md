# 031 · RLS IMPACT ANALYSIS

> **Trạng thái:** ⏳ chờ Chief Architect phê duyệt · **CHƯA VIẾT MỘT DÒNG SQL NÀO**
> **Thiết kế:** [ADR-006](../adr/ADR-006-permission-engine.md)
> **Nguyên tắc:** Resource-Based Authorization — *"Subcon chỉ nhìn thấy đúng
> những tài nguyên Monica giao cho họ, không hơn, không kém."*

Toàn bộ số liệu dưới đây **đo bằng phiên đăng nhập THẬT**, không đọc
`pg_policies` và không suy luận. Đo kết quả, không đo ý định.

---

# BƯỚC 0 · GHI NHẬN MỘT LỖI CỦA CHÍNH BÀI ĐO

Để đo quyền GHI mà không tạo dữ liệu, tôi gửi `INSERT {}` — thiếu mọi cột bắt
buộc — và đọc mã lỗi: `42501` là RLS chặn, `23xxx` là RLS cho qua rồi ràng buộc
chặn. Không dòng nào được tạo.

⚠️ **Kỹ thuật đó thất bại trên 4 bảng** có mọi cột nullable:
`financial_records` · `qa_logs` · `cut_ticket_rolls` · `shipment_cartons`.
`INSERT {}` **thành công**, và tôi tạo ra **8 dòng rác** — trong đó có
`financial_records` và `qa_logs`, hai bảng nghiệp vụ thật.

Đã dọn sạch, đối chiếu số dòng về đúng nguyên trạng
(`financial_records` 2 · `qa_logs` 10 · `cut_ticket_rolls` 0 · `shipment_cartons` 0).

**Quy tắc rút ra, cùng họ với quy tắc Kiến trúc sư vừa ban hành:**

> **Không đo quyền GHI bằng cách GHI.** Muốn biết ai ghi được thì đọc
> `pg_policies`, hoặc chạy trong một giao dịch có `ROLLBACK` — chứ không dựa vào
> việc ràng buộc sẽ chặn giúp.

---

# BƯỚC 1 + 2 · POLICY MAP — ĐO TỪ RLS THẬT

`Subcon(−)` = có vai trò `subcon`, **chưa** có `partner_account`
`Subcon(+)` = **đã** có `partner_account` và **có 1 phần việc** đang mở

Ô ghi `đọc / ghi` · `CHO` = RLS cho qua · `chặn` = 42501

| Bảng | tổng | Buyer | Subcon(−) | Subcon(+) | Monica | SuperAdm |
|---|---:|---|---|---|---|---|
| **orders** | 3 | 0/chặn | **3/CHO** | **3/CHO** | 3/CHO | 3/CHO |
| **subcontractors** | 2 | 0/chặn | **2**/chặn | **2**/chặn | 2/CHO | 2/CHO |
| **cut_bundles** | 2 | 0/chặn | **2/CHO** | **2/CHO** | 2/CHO | 2/CHO |
| **cut_tickets** | 1 | 0/chặn | **1/CHO** | **1/CHO** | 1/CHO | 1/CHO |
| cut_ticket_rolls | 0 | 0/chặn | 0/chặn | 0/chặn | 0/⚠️ | 0/⚠️ |
| **sewing_lines** | 3 | 0/chặn | **0**/chặn | **0**/chặn | 3/CHO | 3/CHO |
| **hourly_production_logs** | 1 | 0/chặn | **1/CHO** | **1/CHO** | 1/CHO | 1/CHO |
| daily_production_logs | 0 | 0/chặn | 0/chặn | 0/chặn | 0/CHO | 0/CHO |
| **qa_logs** | 10 | 0/chặn | **0**/chặn | **0**/chặn | 10/⚠️ | 10/⚠️ |
| **qa_audit_reports** | 2 | 0/chặn | **2/CHO** | **2/CHO** | 2/CHO | 2/CHO |
| qa_defects | 3 | 0/chặn | 0/chặn | 0/chặn | 3/CHO | 3/CHO |
| capa_logs | 0 | 0/chặn | 0/chặn | 0/chặn | 0/CHO | 0/CHO |
| shipments | 0 | 0/chặn | 0/chặn | 0/chặn | 0/CHO | 0/CHO |
| inventory | 7 | 0/chặn | 0/chặn | 0/chặn | 7/CHO | 7/CHO |
| stock_levels | 4 | 0/chặn | 0/chặn | 0/chặn | 4/CHO | 4/CHO |
| **assignments** | 1 | 0/chặn | **0**/chặn | **1**/chặn | 1/CHO | 1/CHO |
| assignment_bundles | 0 | 0/chặn | 0/chặn | 0/chặn | 0/CHO | 0/CHO |
| assignment_commercial_terms | 0 | 0/chặn | 0/chặn | 0/chặn | 0/CHO | 0/CHO |
| ⛔ financial_records | 2 | 0/chặn | 0/chặn | 0/chặn | 2/⚠️ | 2/⚠️ |
| ⛔ profiles | 18 | 0/chặn | 0/chặn | 0/chặn | 18/CHO | 18/CHO |
| ⛔ partners | 5 | 0/chặn | 0/chặn | 0/chặn | 5/CHO | 5/CHO |
| ⛔ partner_accounts | 1 | 0/chặn | 0/chặn | 0/chặn | 1/CHO | 1/CHO |
| ⛔ partner_permissions | 21 | 0/chặn | 0/chặn | 0/chặn | 21/CHO | 21/CHO |
| ⛔ subcon_orders | 0 | 0/chặn | 0/chặn | 0/chặn | 0/CHO | 0/CHO |

⚠️ Ô `⚠️` = `INSERT {}` tạo được dòng (bảng không có cột bắt buộc). Đã dọn.
⚠️ Hàng có **tổng = 0** **không kết luận được gì** về quyền đọc — RLS lọc dòng,
không ném lỗi.

## Phát hiện lớn nhất của cả bảng

> **Cột `Subcon(−)` và `Subcon(+)` GIỐNG HỆT NHAU ở mọi hàng, trừ `assignments`.**

Nghĩa là: **`assignments` là bảng DUY NHẤT đang phân quyền theo tài nguyên.**
Toàn bộ phần còn lại vẫn phân quyền theo **vai trò** — có vai `subcon` là thấy,
bất kể Monica đã giao gì. Đây chính là Vấn đề ① của ADR-006, đo được bằng số.

## Bốn nhóm cần xử lý

### 🔴 A · LỘ QUÁ NHIỀU — thấy toàn bộ bảng

| Bảng | Subcon thấy | Vi phạm |
|---|---|---|
| `orders` | **3/3** | thấy đơn hàng không có việc của mình |
| `subcontractors` | **2/2** | ⛔ **THẤY NHÀ THẦU KHÁC** — Điều XXX cấm tuyệt đối |
| `cut_bundles` | **2/2** | thấy bó không được giao |
| `cut_tickets` | **1/1** | thấy phiếu cắt không được giao |
| `hourly_production_logs` | **1/1** | thấy sản lượng của nơi khác |
| `qa_audit_reports` | **2/2** | thấy kết quả kiểm của nơi khác |

### 🔴 B · GHI QUÁ NHIỀU — nguy hiểm hơn A

| Bảng | Subcon ghi được | Đánh giá |
|---|---|---|
| **`orders`** | ✅ | ⛔ **NGHIÊM TRỌNG NHẤT.** Nhà thầu **sửa được đơn hàng** — số lượng, ngày giao, đơn giá. Không nghiệp vụ nào biện minh được. |
| `cut_bundles` · `cut_tickets` | ✅ | nhà thầu sửa được bó và phiếu cắt của **bất kỳ ai** |
| `hourly_production_logs` | ✅ | đúng ý đồ — nhưng **không giới hạn theo phần việc** |
| `qa_audit_reports` | ✅ | đúng ý đồ — nhưng **không giới hạn theo phần việc** |

⚠️ Nhóm B **chưa từng được nêu** trong ADR-006, vì ADR chỉ đo quyền ĐỌC. Đây là
phát hiện mới của Bước 1.

### 🟡 C · CHẶN QUÁ NHIỀU — Subcon đang bị làm "người mù"

Kiến trúc sư chốt Subcon **phải** xem được:

| Yêu cầu | Hiện trạng | |
|---|---|---|
| xem Assignment của họ | `assignments` 1/1 | ✅ |
| xem PO được giao | `orders` 3/3 | ⚠️ thấy quá nhiều, không phải quá ít |
| xem tiến độ | `hourly_production_logs` | ⚠️ như trên |
| **xem Line Map của chính họ** | `sewing_lines` **0/3** | 🔴 **KHÔNG THẤY GÌ** |
| xem Cut Ticket được giao | `cut_tickets` 1/1 | ⚠️ thấy quá nhiều |
| báo cáo sản lượng theo giờ | ghi được | ✅ |
| báo cáo Daily | ghi được (031 phần đã chạy) | ✅ |
| **báo cáo QA** | `qa_audit_reports` ✅ · `qa_logs` **0/10 chặn** | 🟡 **cần chốt nghĩa** |

⚠️ **`sewing_lines` là lỗ hổng ngược chiều**: Subcon phải thấy chuyền của chính
họ để biết việc đang chạy ở đâu, mà hiện thấy **0**.

⚠️ **"Báo cáo QA" chưa rõ nghĩa.** Hệ thống có **hai** bảng:
`qa_audit_reports` (kiểm nội bộ theo giờ — subcon ghi được) và `qa_logs` (phiếu
kiểm AQL — subcon không thấy). Chúng khác nhau về bản chất, đã ghi trong
[Glossary](../DOMAIN_GLOSSARY.md). **Cần Kiến trúc sư chốt subcon được chạm cái
nào.**

### ✅ D · ĐANG ĐÚNG — không được làm lỏng

`financial_records` · `profiles` · `partners` · `partner_accounts` ·
`partner_permissions` · `subcon_orders` · `inventory` · `stock_levels` ·
`qa_defects` · `capa_logs` — Subcon thấy **0** ở tất cả.

⚠️ Nhưng bốn bảng trong đó **đang rỗng** (`capa_logs`, `shipments`,
`stock_movements`, `subcon_orders`) nên **chưa chứng minh được gì**. Phải gieo
dữ liệu rồi đo lại trước khi tuyên bố an toàn.

## Về Buyer

Buyer thấy **0 ở mọi bảng trong tập này**, kể cả `orders`. Đúng như thiết kế
018 (`mos_buyer_can_see_order()` lọc theo `customer_id`), nhưng tài khoản kiểm
của tôi **không gắn với khách hàng nào**, nên con số 0 này **không chứng minh
Buyer Portal đang hoạt động đúng** — nó chỉ chứng minh fail-closed.

> ⚠️ Cần một bài đo riêng cho Buyer có gắn `customer_id` trước khi 031 đụng vào
> `orders`. Kiến trúc sư đánh giá *"Buyer đã hoàn thiện khá tốt"* — tôi **chưa
> đo được điều đó**, và không muốn ghi nhận một điều mình chưa chứng minh.

---

# BƯỚC 3 · MODULE IMPACT ANALYSIS

Đếm số vị trí truy vấn trong mã nguồn (`from('<bảng>')`):

| Bảng | Số vị trí | Module bị ảnh hưởng |
|---|---:|---|
| **`orders`** | **25** | `/md` · `/kho` · `/giam-doc` · `/hoan-thanh` · `/subcon` · `home-metrics` · `layout` · `ceo-report` · `notifications` |
| `cut_tickets` | 7 | `/kho` · `/md/po` · `/giam-doc` · `/hoan-thanh` · `/to-truong-cat` · `home-metrics` |
| `cut_bundles` | 7 | `/subcon` · `/hoan-thanh` · `/to-truong-cat` |
| `subcontractors` | 1 | `/subcon` |

## 🔴 `orders` là rủi ro lớn nhất của toàn bộ 031

25 vị trí, **9 module**, gồm cả `app/layout.tsx` và `home-metrics.ts` — tức
**trang chủ của MỌI vai trò**. Siết sai ở đây là làm hỏng màn hình đầu tiên mà
mọi người nhìn thấy.

⚠️ Và `orders` mang **hai hệ phân quyền cùng lúc**: `mos_buyer_can_see_order()`
của 018 cho Buyer, và policy Assignment sắp thêm cho Subcon. Policy mới phải
**HỢP** với đường cũ (`OR`), tuyệt đối không thay thế.

## View có thể chết

11 view đang expose qua API. Bốn view đọc các bảng sắp bị siết:

```
vw_cut_ticket_summary     ← cut_tickets
v_po_shipments            ← orders
v_po_shipment_readiness   ← orders
v_order_risk              ← orders
```

⚠️ View khai `security_invoker = true` sẽ **tự động** áp RLS của người gọi — tức
là chúng sẽ **thu hẹp theo**, đúng như mong muốn. Nhưng view **không** khai cờ
đó chạy dưới quyền chủ sở hữu và **vượt mặt RLS** — chúng sẽ trở thành **cửa
sau** cho đúng dữ liệu vừa bị siết.

> **Phải kiểm `security_invoker` của cả 11 view TRƯỚC khi chạy 031.** Bảy view
> của 017/020/022 từng rò rỉ thật vì thiếu cờ này (vá ở 024 Mục 7) — không được
> để tái diễn ở chiều ngược lại.

## JOIN có mất dữ liệu không

⚠️ **Có, và đây là hệ quả dễ bị bỏ qua nhất.** PostgREST nhúng
(`cut_bundles(cut_tickets(...))`) áp RLS lên **từng bảng trong chuỗi**. Siết
`cut_tickets` mà quên `cut_ticket_rolls` sẽ khiến một truy vấn nhúng trả về
`null` ở nhánh con — **không lỗi, chỉ là dữ liệu biến mất**.

Đây đúng là lớp lỗi mà `unwrap.ts` đang canh ở tầng ứng dụng: *"mảng rỗng vì
không có quyền"* trông y hệt *"mảng rỗng vì không có dữ liệu"*.

---

# BƯỚC 4 · PERFORMANCE REVIEW

Đo xen kẽ, 10 vòng, 20 phần việc gieo sẵn:

| Phép đo | trung vị | so nền |
|---|---:|---:|
| baseline · `orders` | 175 ms | — |
| `mos_partner_id()` — **không** tham số | 173 ms | 0,99× |
| `mos_can_read_assignment(id)` — **có** tham số | 175 ms | 1,00× |
| `assignments` 20 dòng, policy gọi hàm mỗi dòng | 223 ms | 1,27× |
| `cut_bundles` (chưa có policy lồng) | 226 ms | 1,29× |

## ⚠️ `STABLE` KHÔNG cứu được policy có tham số

Đây là kết luận quan trọng nhất của Bước 4, và nó là **suy luận về cơ chế**, không
phải suy luận về số:

```
mos_partner_id()             không tham số  →  PostgreSQL nhớ 1 lần / câu lệnh
mos_can_read_assignment(id)  tham số ĐỔI THEO DÒNG  →  gọi lại cho MỖI GIÁ TRỊ
```

`STABLE` cho phép bộ tối ưu bỏ qua lần gọi lặp **với cùng tham số**. Policy trên
`assignments` truyền `id` của **chính dòng đang xét**, nên mỗi dòng là một tham
số khác — **N dòng = N lần gọi**.

Mỗi lần gọi là một truy vấn con vào `assignments` + `partner_accounts`. Với 20
dòng thì chìm trong nhiễu mạng; với **5.000 phần việc** thì đó là 5.000 truy vấn
con cho một lần mở danh sách.

## Đề xuất giảm thiểu — cần Kiến trúc sư quyết

**① Viết policy dạng tập hợp thay vì dạng hàm-mỗi-dòng.**

```
-- thay:  mos_can_read_assignment(id)
-- bằng:  partner_id = mos_partner_id() AND status NOT IN ('DRAFT','CANCELLED')
```

`mos_partner_id()` **không tham số** ⇒ tính một lần, rồi so cột — bộ tối ưu dùng
được `idx_assignments_partner_scope` của 029. Đổi lại: luật bị **lặp lại** trong
policy thay vì nằm gọn một chỗ, và đó là chi phí thật về bảo trì.

**② `cut_bundles` là policy đắt nhất** — `EXISTS` lồng qua `assignment_bundles`,
chạy cho từng dòng. Chỉ mục `uq_assignment_bundle_active` (029) hỗ trợ được,
nhưng **phải xác nhận planner dùng nó** bằng `EXPLAIN ANALYZE` — điều tôi
**không làm được qua PostgREST**, cần Kiến trúc sư chạy giúp.

**③ Chỉ mục có thể cần thêm:**

```
partner_accounts (user_id) WHERE is_active     ← mos_partner_id() tra mỗi câu lệnh
orders           — cần chỉ mục hỗ trợ EXISTS trên assignments(order_id, partner_id)
```

⚠️ **Mọi con số ở trên nằm trong nhiễu mạng** (nền 175 ms, riêng vòng mạng
~180 ms). Chúng chứng minh **không có gì thảm hoạ**, **không** chứng minh policy
chịu được tải. Hiến pháp Điều X đặt trần CRUD < 300 ms — trần đó chỉ có nghĩa
khi đo trên vài nghìn dòng.

---

# BƯỚC 5 · ĐỀ XUẤT CHÍNH SÁCH

> ⏳ **Đề xuất — chưa viết SQL.** Chờ phê duyệt.

## 5.1 · Bốn hình dạng policy

| Hình dạng | Dùng cho | Biểu thức |
|---|---|---|
| **① trực tiếp** | bảng có `assignment_id` | `assignment_id` thuộc phần việc của tôi |
| **② qua quan hệ** | `cut_bundles` | `EXISTS` qua `assignment_bundles` |
| **③ qua đơn hàng** | `orders` · `cut_tickets` | có **bất kỳ** phần việc nào trên đơn đó |
| **④ qua cầu nối** | `subcontractors` | `partners.subcontractor_id` = hồ sơ của tôi |

## 5.2 · Bảng đề xuất

| Bảng | Đọc | Ghi | Ghi chú |
|---|---|---|---|
| `orders` | ③ **thu hẹp** | 🔴 **CẤM** | ghép `OR mos_buyer_can_see_order()` |
| `subcontractors` | ④ **thu hẹp** | cấm (đã) | chỉ hồ sơ của chính mình |
| `cut_bundles` | ② **thu hẹp** | 🔴 **CẤM** | |
| `cut_tickets` | ③ **thu hẹp** | 🔴 **CẤM** | |
| `sewing_lines` | 🟡 **MỞ** theo ③ | cấm | *Line Map của chính họ* |
| `hourly_production_logs` | ① thu hẹp | ① + cửa sổ | |
| `qa_audit_reports` | ① thu hẹp | ① + cửa sổ | |
| `qa_logs` | ⏳ **chờ chốt** | ⏳ | *"báo cáo QA"* là bảng nào? |

## 5.3 · Ba việc phải làm TRƯỚC khi viết SQL

```
☐ Kiểm security_invoker của cả 11 view — view thiếu cờ sẽ thành CỬA SAU
☐ Đo Buyer có gắn customer_id — chưa ai chứng minh Buyer Portal đang đúng
☐ Gieo dữ liệu vào 9 bảng đang rỗng rồi đo lại — "0 dòng" chưa chứng minh gì
```

## 5.4 · Thứ tự chạy đề xuất

```
031a  CẤM GHI    orders · cut_bundles · cut_tickets     ← rủi ro thấp, lợi ích cao nhất
031b  MỞ ĐỌC     sewing_lines                          ← sửa lỗ hổng ngược chiều
031c  THU HẸP    subcontractors                        ← 1 vị trí mã, dễ hoàn tác
031d  THU HẸP    cut_bundles · cut_tickets             ← 14 vị trí mã
031e  THU HẸP    orders                                ← 25 vị trí, 9 module
```

⚠️ **Chia năm bước là có chủ ý.** `031a` đóng lỗ hổng nghiêm trọng nhất (nhà
thầu sửa được đơn hàng) mà **gần như không rủi ro** — cấm ghi không làm gãy màn
hình đọc nào. `031e` đụng 9 module gồm cả trang chủ, nên phải đi **cuối cùng**,
sau khi bốn bước trước đã chứng minh khuôn policy đúng.

Gộp cả năm vào một migration là đặt phần rủi ro nhất và phần an toàn nhất vào
**cùng một lần hoàn tác**.

---

# TÓM TẮT CHO CHIEF ARCHITECT

**Ba điều quan trọng nhất tìm ra:**

1. 🔴 **Subcon GHI được vào `orders`** — sửa được số lượng, ngày giao, đơn giá
   của đơn hàng. ADR-006 không phát hiện vì chỉ đo quyền đọc.
2. 🔴 **`assignments` là bảng DUY NHẤT** đang phân quyền theo tài nguyên. Mọi
   bảng khác vẫn theo vai trò — `Subcon(−)` và `Subcon(+)` thấy y hệt nhau.
3. 🟡 **`sewing_lines` bị chặn hoàn toàn** với Subcon, trong khi Kiến trúc sư
   yêu cầu họ **phải** xem được Line Map của chính mình.

**Ba câu hỏi cần Kiến trúc sư trả lời trước khi tôi viết SQL:**

1. *"Báo cáo QA"* của Subcon là `qa_audit_reports` hay `qa_logs`, hay cả hai?
2. Chấp nhận **lặp lại luật** trong policy để đổi lấy hiệu năng (đề xuất ① của
   Bước 4), hay giữ hàm cho gọn và chấp nhận N lần gọi?
3. Duyệt thứ tự **031a → 031e**, hay muốn gộp?
