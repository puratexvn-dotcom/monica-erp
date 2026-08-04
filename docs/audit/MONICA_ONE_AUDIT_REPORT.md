# MONICA ONE — AUDIT REPORT
## Sprint 1 · Tổng kiểm tra toàn hệ thống

| Trường | Giá trị |
|---|---|
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Solution Architect |
| **Phạm vi** | Business Knowledge · Constitution · ADR · Discovery · Architecture · Source · Database · Migration · Documentation |
| **Phương pháp** | Đọc văn bản · đọc mã · đối chiếu lược đồ migration · chạy `npm run test:arch` |
| **Không sửa** | ✅ Không một dòng mã, một tệp migration nào bị thay đổi |
| **Thẩm quyền** | [ADR-011](../adr/ADR-011-tham-quyen-kien-truc.md) §2.1 · thiết kế; **không** quyết sự thật nghiệp vụ |

---

## ⚠️ 0. TRẦN KIỂM CHỨNG CỦA BẢN NÀY — ĐỌC TRƯỚC

[ADR-011 §2.4](../adr/ADR-011-tham-quyen-kien-truc.md) mục 3 giới hạn cái tôi được
tự cấp. Bản audit này tuân thủ trần đó:

| Tầng | Kiểm được? | Ghi chú |
|---|---|---|
| ① Business Knowledge | ✅ | đọc toàn bộ BKB v2.0 |
| ② Constitution | ✅ | 45 Điều · v1.5 ADOPTED |
| ③ Live Database | ❌ | **chỉ đọc được tệp migration**, không truy vấn được `pg_policies` |
| ④ Running Application | ❌ | không có phiên đăng nhập, không nhập được mật khẩu |

⚠️ **Mọi phát hiện về RLS/policy dưới đây là bằng chứng ở TẦNG MIGRATION.**
`CLAUDE.md` §3 nói rõ *"luôn đối chiếu với CSDL đang chạy, không tin nội dung file
migration"*. Chúng là **giả thuyết có căn cứ mạnh**, chưa phải kết luận.

⚠️ **Không mục nào trong bản này được gắn `Verified + Implemented`.**

---

## 1. TÓM TẮT ĐIỀU HÀNH

Monica ONE hôm nay là **một nền văn bản chuẩn tắc rất mạnh đặt trên một sản phẩm
được xây theo mô hình khác hẳn.**

Ba con số nói hết:

| Chỉ số | Giá trị | Nguồn |
|---|---|---|
| Quy tắc nghiệp vụ `Verified` **khớp** hệ thống | **6 / 36** (17%) | BKB §G.5 |
| Business Workspace hiến định **có route đúng nghĩa** | **5 / 11** | §3.1 bản này |
| Bảng nghiệp vụ MD **có policy thu hẹp** | **6 / 14** | §4.2 bản này |

**Phát hiện quan trọng nhất — chưa từng được ghi ở tài liệu nào:**

> 🔴 **Ứng dụng được tổ chức theo CHỨC DANH, Hiến pháp đòi tổ chức theo LĨNH VỰC
> NGHIỆP VỤ.** Đây không phải một lỗi; đây là **hai mô hình thông tin khác nhau**
> đang cùng sống trong một kho mã. Mọi thứ khác trong bản audit này là hệ quả
> của nó.

Trang chủ đã đúng Hiến pháp (16 Business App, 11 Workspace). **Nhưng phía sau mỗi
thẻ là một route theo chức danh.** Người dùng bấm `Commercial` và rơi vào cổng
khách hàng; bấm `Production` và rơi vào màn hình của tổ trưởng may.

---

## 2. NHỮNG ĐIỀU CHẮC CHẮN — ĐÃ ĐO ĐƯỢC

Xếp theo tầng bằng chứng, không xếp theo mức độ quan trọng.

### 2.1 Nền văn bản chuẩn tắc — hoàn chỉnh và nhất quán `[VERIFIED]`

| # | Sự thật | Bằng chứng |
|---|---|---|
| S1 | **Hiến pháp đầy đủ và đã ban hành** — 8 Phần · 45 Điều · Preamble · Glossary · References · `v1.5 ADOPTED` | `00-CONSTITUTION.md` Document Control |
| S2 | **Thứ bậc văn bản đã được ấn định 7 bậc** và không còn mâu thuẫn nội bộ | [ADR-010](../adr/ADR-010-thu-bac-van-ban-chuan-tac.md) · `CLAUDE.md` §0 |
| S3 | **Thẩm quyền kiến trúc đã được phân xử** — CSA giữ quyền thiết kế, phản biện độc lập bắt buộc | [ADR-011](../adr/ADR-011-tham-quyen-kien-truc.md) §1.3 |
| S4 | **BKB v2.0 đã hợp nhất mọi nguồn nghiệp vụ** — 60 quy tắc có mã, 36 câu hỏi mở, 8 mâu thuẫn, 3 việc xác minh | `BUSINESS_KNOWLEDGE_BASE.md` §G.5 |
| S5 | **Sổ nợ kỹ thuật có thật, có số hiệu, có chủ** — TD-01…TD-15 | `TECHNICAL_DEBT.md` |
| S6 | **Khoảng trống migration đã được giải thích** — `008` `031d–g` `032` `033` `039` đều có lý do ghi lại | `MIGRATION_INDEX.md` §5 |

> 💡 Đây là tài sản thật của dự án. Rất ít dự án ở giai đoạn này có được nó.
> **Sprint 1 không cần xây thêm văn bản nền — cần khép khoảng cách văn bản ⟷ sản phẩm.**

### 2.2 Sức khoẻ kỹ thuật — đo trực tiếp `[VERIFIED · 04/08/2026]`

```
npm run test:arch  →  43 đạt · 0 hỏng
```

| # | Sự thật | Bằng chứng |
|---|---|---|
| S7 | **Ba tầng phòng thủ tồn tại đủ** — `middleware.ts` ở gốc · `guard()` ở mọi service · RLS bật hàng loạt | `middleware.ts` · migration `010` |
| S8 | **`guard()` phủ 100% hàm export** của cả 6 service MD | `MD_PRODUCT_AUDIT.md` §0 mục 2 |
| S9 | **Vai trò đọc từ `app_metadata`**, không từ `user_metadata` | `lib/rbac.ts:7-18` |
| S10 | **`anon` bị chặn ở cả 9 bảng đã đo** — lớp ngoài cùng đúng | `MD_PRODUCT_AUDIT.md` §0B |
| S11 | **i18n ba ngôn ngữ đã cân bằng** — 142 khoá × 3, không thiếu, không thừa, không rỗng | `test:arch` mục ⑪ |
| S12 | **29 từ hiến định không bị dịch ở ngôn ngữ nào** | `test:arch` mục ⑪ |
| S13 | **Cơ chế bánh cóc nợ kỹ thuật đang chạy** — màu 108/108, chữ 113/114, không phình | `test:arch` mục ⑨⑩ |
| S14 | **Mô hình Assignment đã dựng đầy đủ** — `assignments` · `assignment_bundles` · `assignment_commercial_terms` · máy trạng thái có luật chuyển tường minh | `lib/mos/domain/assignment.ts:73-80` |

> ⚠️ `lib/mos/domain/assignment.ts` là **đối tượng DUY NHẤT trong toàn hệ thống có
> bảng phép chuyển trạng thái viết thành mã**. Bảy đối tượng còn lại chỉ có ràng
> buộc `CHECK` liệt kê *giá trị hợp lệ*, không có *phép chuyển hợp lệ*.
> Đây là khuôn mẫu đúng — nên nhân bản, không nên phát minh lại.

### 2.3 Kiểm kê lược đồ `[VERIFIED — tầng migration]`

**87 bảng** trong 48 tệp migration. Phân bố theo Business Domain hiến định:

| Domain hiến định | Bảng | Đánh giá |
|---|---|---|
| Commercial (Điều 19) | `customers` `customer_contacts` `inquiries` `buyer_accounts` | ⚠️ nằm rải trong MD, không có Workspace |
| Merchandising (Điều 20) | `orders` `order_items` `order_size_breakdown` `styles` `style_*` `costings` `costing_items` `sample_submissions` `md_documents` `md_comments` `change_requests` `risk_assessments` | ✅ đầy đủ nhất |
| Planning (Điều 21) | `production_orders` `order_milestones` `ta_templates` `ta_template_items` `sewing_lines` | ⚠️ có bảng, **không có Workspace, không có mô hình năng lực** |
| Production (Điều 22) | `cut_tickets` `cut_bundles` `daily_production_logs` `hourly_production_logs` `finishing_logs` `needle_break_logs` | ⚠️ đủ bảng, bị chia làm 4 route theo chức danh |
| Quality (Điều 23) | `qa_audit_reports` `qa_defects` `defect_catalog` `capa_logs` `material_inspections` | ⚠️ **không phân biệt QA nội bộ ⟷ QA khách** |
| Warehouse (Điều 24) | `warehouses` `wh_zones` `wh_racks` `wh_bins` `stock_levels` `stock_movements` `stock_reservations` `stock_counts` `stock_count_items` `stock_adjustments` `inbound_receipts` `outbound_issues` `material_lots` `fabric_rolls` `wh_audit_log` | ✅ **hạ tầng kho là phần trưởng thành thứ hai sau MD** |
| Shipment (Điều 25) | `shipments` `shipment_cartons` `cartons` | ⚠️ thiếu ETA · booking · container |
| Subcontract (Điều 26) | `subcontractors` `subcon_orders` `assignments` `assignment_*` `partners` `partner_accounts` `partner_permissions` | ✅ đầy đủ |
| **Finance (Điều 27)** | — | ❌ **KHÔNG CÓ BẢNG NÀO.** Không `invoices`, không `payments`, không `receivables` |
| HR (Điều 28) | `employees` `departments` `attendance_logs` | ⚠️ có bảng, **không có Workspace** |

---

## 3. NHỮNG ĐIỀU MÂU THUẪN

### 🔴 M1 — Ứng dụng tổ chức theo CHỨC DANH; Hiến pháp đòi theo LĨNH VỰC

**Đây là mâu thuẫn nghiêm trọng nhất, và nó chưa từng được ghi ở tài liệu nào.**

**Hiến pháp §16.2** `[VERIFIED]`:

> *"Business Workspaces shall be organized according to Business Domains rather
> than organizational hierarchy, departments or **job titles**."*

**Hiến pháp §22.4** `[VERIFIED]`:

> *"Cutting, Sewing, Finishing, Packing … **shall not become independent Business
> Workspaces**."*

**Mã đang chạy** `[VERIFIED]` — `find app -name page.tsx`:

| Route | Bản chất | Hiến pháp |
|---|---|---|
| `/giam-doc` | chức danh *Giám đốc* | Điều 18 Executive Center |
| `/md` | lĩnh vực | ✅ Điều 20 |
| `/qa` | lĩnh vực | ✅ Điều 23 |
| `/kho` | lĩnh vực | ✅ Điều 24 |
| `/xuat-hang` | lĩnh vực | ✅ Điều 25 |
| `/subcon` | lĩnh vực | ✅ Điều 26 |
| `/ke-toan` | **chức danh** *Kế toán* | Điều 27 Finance |
| **`/to-truong-cat`** | **chức danh** *Tổ trưởng Cắt* | ⛔ §22.4 cấm tường minh |
| **`/to-truong-may`** | **chức danh** *Tổ trưởng May* | ⛔ §22.4 |
| **`/to-truong-hoan-thanh`** | **chức danh** *Tổ trưởng Hoàn thành* | ⛔ §22.4 |
| **`/hoan-thanh`** | công đoạn | ⛔ §22.4 |
| `/orders` | lát cắt dữ liệu | không ánh xạ Điều nào |
| `/buyer` | cổng ngoài | không phải Workspace |
| `/admin` | nền tảng | Điều 34 |

**Bốn route riêng cho một Workspace hiến định duy nhất** (Production). §22.4 cấm
đúng điều này bằng câu chữ không thể diễn giải khác.

**Hệ quả đo được** — `app/home-modules.ts` đã đúng Hiến pháp nhưng nối sai đích:

| Thẻ trang chủ | Trỏ tới | Vấn đề |
|---|---|---|
| **`Commercial`** | `/buyer` | 🔴 `/buyer` là **CỔNG KHÁCH HÀNG**. `MODULE_ACCESS.buyer = ['/buyer']` — **không một vai trò nội bộ nào vào được** (`lib/rbac.ts:87`). Nhân viên kinh doanh bấm `Commercial` ⇒ **`/unauthorized`** |
| **`Production`** | `/to-truong-may` | 🔴 Cả Workspace Production quy về màn hình của **một** tổ trưởng. Tổ cắt và hoàn thành mất lối vào từ trang chủ |
| `Planning` | `null` | ⚠️ Beta — chưa có route |
| `Human Resources` | `null` | ⚠️ Beta — có 3 bảng CSDL, không có màn hình |
| 4 Global Service | `null` | ⚠️ Reporting · Communication · AI · Documents đều Beta |

> **Chỉ 5/11 Business Workspace hiến định có route đúng nghĩa lĩnh vực:**
> Merchandising · Quality · Warehouse · Shipment · Subcontract.

**Phân loại.** Đây **không** phải câu hỏi cho Board. Hiến pháp §16.2 và §22.4 đã
phát biểu dứt khoát, và `CLAUDE.md` §0 xếp mã ở **bậc 6 — thấp nhất**. Mã sai.
⇒ Cần **ADR-012 · Workspace Route Alignment**, không cần Business Confirmation.

---

### 🔴 M2 — Dữ liệu GIÁ và ĐỊNH MỨC có thể mở cho mọi tài khoản đã đăng nhập

> ## ⛔ ĐÍNH CHÍNH — 04/08/2026
>
> **Phần M2 dưới đây SAI ở vế "người ngoài".** Vai `buyer` và `subcon` **không**
> đọc được `costings` / `style_bom`: chúng bị chặn bởi hai policy `RESTRICTIVE`
> quét toàn bộ bảng — `buyer_denied` (`018_mos_foundation.sql:307`) và
> `subcon_denied` (`025_subcon_lockdown.sql:111`). Phép `grep` ở dưới tìm theo
> khuôn `CREATE POLICY ... ON <bảng>` nên không thấy lớp bảo vệ **không đặt theo
> từng bảng**, rồi kết luận trên chỗ không tìm thấy — đúng lỗi **Hiến pháp V.1**.
>
> **Vế "mọi tài khoản đã đăng nhập" thì ĐÚNG, và đúng nghiêm trọng hơn dự đoán:**
> `authenticated_only` là `FOR ALL` kèm `GRANT ALL`, nên mọi vai **nội bộ** có đủ
> `SELECT · INSERT · UPDATE · DELETE` trên 23 bảng — trong đó có `activity_log`,
> tức sổ kiểm toán **sửa và xoá được** (vi phạm **BDR-14** và quy tắc **K-1**).
>
> Phát hiện thay thế, bằng chứng và truy vấn `VR-001` bản đã sửa:
> **[`VR-001-KET-QUA.md`](VR-001-KET-QUA.md)**.
>
> Giữ nguyên phần sai bên dưới theo **Hiến pháp Điều 43.7** — không viết lại lịch
> sử. Đọc phần dưới như *tư liệu*, không như *kết luận còn hiệu lực*.

`[EVIDENCE — tầng migration]` Quét 48 tệp migration:

```
grep "POLICY ... ON costings|ON style_bom"  →  0 kết quả
```

`costings` khai `target_price` · `quoted_price` · `margin_percent`
(`015_md_order_lifecycle.sql:111-126`). Bảng dường như vẫn chạy bằng policy nền
`authenticated_only USING (auth.uid() IS NOT NULL)` từ migration `010`.

**`buyer` và `subcon` là tài khoản *đã xác thực*.**

Vi phạm `BR-ACC-002` — quy tắc Board xếp ⛔ **TUYỆT ĐỐI KHÔNG**.

⚠️ **Tám bảng MD đang 0 dòng** (`MD_PRODUCT_AUDIT.md` §0B) ⇒ đây là **rủi ro tiềm
ẩn**, không phải rò rỉ đang diễn ra. Nhưng **bảng rỗng không chứng minh policy
đúng** — nó chỉ chứng minh không quan sát được dữ liệu.

🔴 **`VR-001` là việc số 1 của Board.** Một truy vấn, một phút:

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('costings','costing_items','style_bom',
                    'change_requests','risk_assessments',
                    'production_orders','material_requests','order_milestones');
```

Kết quả quyết định đây là *"không có gì"* hay *"dừng mọi thứ"*.

---

### 🟠 M3 — Tám mâu thuẫn Board ⟷ mã đã ghi ở BKB, chưa mục nào được phán quyết

Giữ nguyên số hiệu `CF-1`…`CF-8` của BKB §E.1. Tôi **xác minh lại từng mục** trong
lượt audit này:

| Mã | Mâu thuẫn | Xác minh của tôi 04/08 | Mức |
|---|---|---|---|
| `CF-1` | Buyer = Customer ⟷ có hệ `buyer_accounts` | ✅ **đúng** — `buyer_accounts` trong lược đồ, vai `buyer` ở `rbac.ts:27,48,87` | 🔴 |
| `CF-2` | Cấm khách xem chiết tính ⟷ không có policy | ✅ **đúng** — xem M2 | 🔴 |
| `CF-3` | Không tạo PO nội bộ ⟷ có `production_orders` | ✅ **đúng** — bảng tồn tại, đang **0 dòng** | 🟠 |
| `CF-4` | Nhà thầu được xem đơn giá ⟷ `031c3` đã siết | ✅ **đúng** — cần đăng nhập thật để đo | 🟠 |
| `CF-5` | Hai tổ chức QA ⟷ mã chỉ có một | ✅ **đúng** — 5 bảng QA, **0 cột phân biệt nội bộ/khách** | 🟡 |
| `CF-6` | Line Map ở hai cổng ⟷ 0 kết quả toàn kho | ✅ **đúng** | 🟡 |
| `CF-7` | Bán sỉ · bán lẻ ⟷ mô hình chỉ nói gia công | ✅ **đúng** | 🟡 |
| `CF-8` | Mọi báo cáo khớp một số ⟷ nhiều nơi tự tính | ✅ **đúng** — `ceo-report.ts` · `home-metrics.ts` · service MD tính độc lập | 🟠 |

---

### 🟠 M4 — `BR-TNA-002` chết một nửa, không phải chết hẳn — **đính chính BKB**

BKB C.8 ghi quy tắc *"trễ mốc T&A ⇒ nâng mức khẩn cấp"* là **BROKEN**. Đo lại
`[VERIFIED]`:

| Đường | Mã | Trạng thái |
|---|---|---|
| Danh sách PO | `md/_services/po.service.ts:114` → `late_milestones: lateBy.get(r.id) ?? 0` | ✅ **tính đúng** |
| PO Command Center | `md/po/[poId]/_services/po-twin.service.ts:132` → `late_milestones: 0` | 🔴 **hằng số cứng** |

⇒ Quy tắc **chạy đúng ở màn hình danh sách, chết ở màn hình chi tiết một đơn** —
đúng nơi người ta mở ra để quyết định. Nghiêm trọng hơn "chết hẳn" ở một điểm:
hai màn hình cùng một đơn hàng **hiện hai mức khẩn cấp khác nhau**, và đó là vi
phạm trực tiếp `BR-RPT-001` *(mọi báo cáo đối soát ra cùng một con số)*.

**Đề nghị:** cập nhật BKB C.8 theo phát hiện này sau khi Board duyệt.

---

### 🟡 M5 — Ba chuỗi ADR song song, đụng số `ADR-001`

`[VERIFIED]`:

| Kho | Nội dung |
|---|---|
| `docs/adr/` | ADR-002 … ADR-011 *(10 bản)* |
| `docs/architecture/adr/` | **ADR-001** Homepage Conceptual Model |
| `docs/assignment/` | **ADR-001** Site and Operation |

**Hai ADR-001 khác nhau.** Hiến pháp §37.5 *(một quyết định một ADR)* và §37.7
*(truy vết)* không thi hành được khi một số hiệu trỏ tới hai văn bản.

⚠️ Đã ghi trong bộ nhớ dự án 03/08 là *"dời việc gộp tới sau bàn giao"* — nay
**đã tới sau bàn giao**. Đưa vào Sprint 2.

---

### 🟡 M6 — `CLAUDE.md` §6 còn ghi "12 phân hệ"; sản phẩm và Hiến pháp là **16**

`[VERIFIED]` `app/home-modules.ts:135` → `MODULES = 11 + 4 + 1 = 16`.
`CLAUDE.md` §6 mục 1 ghi *"Trang chủ luôn đủ 12 phân hệ"*. Đây là dấu vết trước
ADR-001 v1.1. **Sửa văn bản, không sửa mã.**

---

## 4. NHỮNG ĐIỀU THIẾU

### 4.1 Thiếu ở tầng nghiệp vụ — 5 năng lực Board bắt buộc mà hệ thống không có

Theo BKB §B.2, xác minh lại `[VERIFIED]`:

| # | Năng lực | Bằng chứng thiếu | Hệ quả |
|---|---|---|---|
| **N4** | **Quản lý hợp đồng** | không có bảng `contracts` | `BR-ORD-003` *(Contract → PO → Sản xuất)* không thi hành được |
| **N8** | **QA nội bộ ⟷ QA của khách** | 5 bảng QA, 0 cột phân biệt | `BR-ACC-002` không cưỡng chế được: **không biết báo cáo nào được cho khách xem** |
| **N10** | **Hoá đơn · công nợ** | không `invoices`, không `payments` | Vòng đời 14 bước **đứt ở bước ⑬⑭**. Không nối được giá chào tới tiền thực thu |
| **N14** | **Đối soát số liệu** | không có tầng tổng hợp dùng chung | `BR-RPT-001` — tiêu chí thành công của Board — không có cơ chế bảo đảm |
| — | **Line Map** | 0 kết quả toàn kho | Board bắt buộc ở **cả hai cổng**; **chưa ai định nghĩa được nó là gì** |

> **Hai trong năm nằm ở khâu thu tiền và chất lượng** — đúng hai chỗ khách hàng
> quan tâm nhất.

### 4.2 Thiếu ở tầng bảo mật — 8 bảng MD không có policy thu hẹp

`[EVIDENCE — tầng migration]`

| Bảng | Nội dung nhạy cảm | Policy thu hẹp |
|---|---|---|
| `costings` · `costing_items` | giá chào · giá mục tiêu · **biên lợi nhuận** | ❌ |
| `style_bom` | **định mức — bí mật kỹ thuật** | ❌ |
| `change_requests` · `risk_assessments` | | ❌ |
| `production_orders` · `material_requests` · `order_milestones` | | ❌ |
| `orders` · `order_items` | | ✅ `031b` |
| `customers` · `styles` · `md_documents` · `md_comments` | | ✅ `buyer_scope_*` |

**Nguyên nhân gốc:** `031b_open_scoped_read` chỉ thu hẹp 4 bảng. Các bảng MD thêm
ở `014`/`015` **chưa từng được rà lại**.

### 4.3 Thiếu ở tầng kiểm thử

| # | Thiếu | Bằng chứng |
|---|---|---|
| T1 | **Không một bài kiểm nghiệp vụ nào** cho MD (19.058 dòng) | `find tests -type f` → chỉ arch · security × 2 · regression |
| T2 | **Không bài kiểm nào chạm `costings` / `style_bom`** | ⇒ M2 sống sót 33 migration mà không ai thấy |
| T3 | **Không phép kiểm "vốn từ trong mã ⟷ vốn từ trong CSDL"** | TD-03, mở từ ADR-008 |
| T4 | **Không bài kiểm nào cho Warehouse** | 15 bảng kho, 0 bài kiểm nghiệp vụ |

### 4.4 Thiếu ở tầng chuẩn tắc

| # | Thiếu | Ai lấp |
|---|---|---|
| G1 | **BKB chưa được duyệt** — `Status: DRAFT`. Bậc 0′ chưa có hiệu lực | Board |
| G2 | **Hiến pháp không có Điều cho Sample Management** dù Board xếp là năng lực độc lập (`BR-SMP-003`) | Board — `FD-003` |
| G3 | **25/60 quy tắc chưa có Business Owner** | Board |
| G4 | **Chưa có `docs/review/`** để lưu hồ sơ phản biện | TD-15 · kiến trúc sư |
| G5 | **SECURITY FREEZE chưa có điều kiện dỡ bằng văn bản** — `031d`–`031g` chưa viết, mà `031d` lại bị chặn bởi *"bảng còn 0 dòng"* | Board — **vòng chờ khoá lẫn nhau, xem dưới** |

> ### 🔴 G5 là một VÒNG CHỜ KHOÁ LẪN NHAU — phải cắt trong Sprint 1
>
> `MIGRATION_INDEX.md` §5: `031d`–`031g` bị chặn bởi **"G4 — bảng còn 0 dòng"**.
> `CLAUDE.md` §2.2: SECURITY FREEZE giữ tới khi **`031a→031g` hoàn tất**.
>
> ⇒ *Không mở bảng mới vì đang freeze · không gỡ freeze vì bảng còn rỗng.*
> Vòng này đã đứng yên và sẽ đứng yên vô hạn nếu không có quyết định của Board.

---

## 5. ĐIỀU CẦN BOARD XÁC NHẬN

Chuyển thẳng sang **[BUSINESS CONFIRMATION #1](../business/BUSINESS_CONFIRMATION_1.md)** — 20 câu.

Kèm **hai việc không phải câu hỏi**:

| # | Việc | Chi phí | Mở khoá |
|---|---|---|---|
| 1 | 🔴 Chạy truy vấn `VR-001` §M2 trên Supabase SQL Editor | **1 phút** | `CF-2` — biết M2 là "không có gì" hay "dừng mọi thứ" |
| 2 | Xác nhận BKB §G.2 — bản Business DNA gốc còn giữ không | 1 lượt đọc | Toàn bộ Phần A · D của BKB |

---

## 6. ĐIỀU CÓ THỂ QUYẾT ĐỊNH NGAY — KHÔNG CẦN HỎI

Theo [ADR-011 §2.1](../adr/ADR-011-tham-quyen-kien-truc.md), tám mục sau **suy được
từ Hiến pháp hoặc từ bằng chứng đo được**, không cần sự thật nghiệp vụ mới.
Tôi quyết, ghi lại, và chịu trách nhiệm.

| # | Quyết định | Căn cứ | Sản phẩm |
|---|---|---|---|
| **D1** | **Route phải theo Business Domain, không theo chức danh.** 4 route Production gộp thành một Workspace; `/ke-toan` → Finance; `/giam-doc` → Executive Center | Hiến pháp §16.2 · §22.4 · §10.2 | **ADR-012** |
| **D2** | **`Commercial` trên trang chủ KHÔNG được trỏ `/buyer`.** Cổng khách hàng không phải Business Workspace | Hiến pháp §5.3 · §17.3 | ADR-012 |
| **D3** | **8 bảng MD phải có policy thu hẹp.** Kể cả khi `VR-001` trả về kết quả sạch — mặc-định-cấm là Điều 40.4 | Hiến pháp §40.3 · §40.4 | **ADR-013** |
| **D4** | **Mọi máy trạng thái phải có bảng phép chuyển viết thành mã**, theo khuôn `lib/mos/domain/assignment.ts:73-80` | Hiến pháp §39.4 · TD-03 | **ADR-014** |
| **D5** | **Gộp ba chuỗi ADR về một kho `docs/adr/`.** ADR-001 trùng số ⇒ cấp lại số cho một trong hai, giữ bản gốc làm hồ sơ | Hiến pháp §37.5 · §37.7 · §43.7 | việc tài liệu |
| **D6** | **Sửa `CLAUDE.md` §6 từ "12 phân hệ" thành "16 Business App"** | `home-modules.ts:135` · ADR-001 v1.1 | việc tài liệu |
| **D7** | **`po-twin.service.ts:132` là lỗi, không phải thiết kế.** Phải nhận `late_milestones` thật | M4 · Hiến pháp Điều 8 | sửa lỗi — **được phép trong freeze** |
| **D8** | **Dựng `docs/review/` cho hồ sơ phản biện** | ADR-011 TD-15 | việc tài liệu |

⚠️ **Không mục nào trong D1–D8 được thi hành trong Sprint 1.** Sprint 1 chỉ bàn
giao quyết định; thi hành thuộc Sprint 2 và cần ADR được duyệt trước.

---

## 7. ĐỀ NGHỊ CẮT VÒNG KHOÁ SECURITY FREEZE (G5)

Trình Board **một quyết định**, ba lựa chọn:

| Phương án | Nội dung | Đánh đổi |
|---|---|---|
| **A · Thay điều kiện dỡ băng** *(đề nghị)* | Freeze giữ nguyên với *mở Domain/bảng mới*, nhưng **dỡ cho việc SIẾT policy**. `031d`–`031g` được viết vì chúng **thu hẹp**, không mở rộng | Cần Board xác nhận bằng văn bản |
| B · Nạp dữ liệu nền rồi mới siết | Chạy `S001` để bảng hết rỗng, đo được thật, rồi viết `031d`–`031g` | Đưa dữ liệu vào bảng **đang hở** — làm rủi ro tiềm ẩn thành rủi ro thật |
| C · Giữ nguyên | Không làm gì | Vòng khoá đứng vô hạn; Sprint 2 không mở được |

**Khuyến nghị A.** Lý do: freeze sinh ra để chặn *mở rộng bề mặt tấn công*.
`031d`–`031g` làm điều ngược lại. Chặn một migration thu hẹp bằng một cơ chế
chống mở rộng là đọc sai mục đích của chính cơ chế đó.

`[Chỗ tôi có thể sai — ADR-011 §2.3 mục 4]` Tôi **chưa đọc** nội dung dự kiến của
`031d`–`031g` (chỉ có `analysis/031d-implementation-plan.md`). Nếu chúng có bất kỳ
câu `GRANT` hoặc `CREATE POLICY ... FOR ALL` nào mở thêm quyền, khuyến nghị A sai
và phải quay về B.

---

## 8. THAM CHIẾU

- [`docs/business/BUSINESS_KNOWLEDGE_BASE.md`](../business/BUSINESS_KNOWLEDGE_BASE.md) v2.0 — nguồn nghiệp vụ
- [`docs/architecture/00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) v1.5 — §16.2 · §22.4 · §37 · §40 · §43
- [`docs/adr/ADR-010`](../adr/ADR-010-thu-bac-van-ban-chuan-tac.md) · [`ADR-011`](../adr/ADR-011-tham-quyen-kien-truc.md)
- [`docs/audit/MD_PRODUCT_AUDIT.md`](MD_PRODUCT_AUDIT.md) — 38 phát hiện tầng MD
- [`docs/MIGRATION_INDEX.md`](../MIGRATION_INDEX.md) §5 — bảng khoảng trống
- [`docs/TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) — TD-01…TD-15
- [`BUSINESS_CONFIRMATION_1.md`](../business/BUSINESS_CONFIRMATION_1.md) — 20 câu cho Board
- [`SPRINT_2_PLAN.md`](../planning/SPRINT_2_PLAN.md) — kế hoạch tiếp theo
