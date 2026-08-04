# PRODUCT AUDIT — PHÂN HỆ MERCHANDISING (MD)

| Trường | Giá trị |
|---|---|
| **Ngày** | 2026-08-04 |
| **Phạm vi** | `app/(dashboard)/md/**` · `components/md/**` · `schemas/md/**` · migration và policy liên quan |
| **Phương pháp** | Đọc mã · đọc lược đồ · đối chiếu policy · đối chiếu bài kiểm |
| **Không sửa** | Không một dòng mã nào bị thay đổi trong lượt audit này |

---

## ⚠️ 0. GIỚI HẠN CỦA BẢN AUDIT NÀY — ĐỌC TRƯỚC MỌI THỨ KHÁC

Đề bài yêu cầu *"bấm mọi nút, đi mọi luồng, kiểm mọi biểu mẫu"*. **Tôi không làm
được phần đó**, và toàn bộ giá trị của bản báo cáo phụ thuộc vào việc người đọc
biết rõ điều này:

| Việc | Làm được? | Vì sao |
|---|---|---|
| Đọc toàn bộ mã nguồn MD | ✅ | 98 tệp · 19.058 dòng |
| Đối chiếu lược đồ và policy | ✅ | 40 migration |
| Kiểm bài kiểm hiện có | ✅ | |
| **Bấm nút, đi luồng, nhập biểu mẫu** | ❌ | Không có trình duyệt nối vào phiên |
| **Đăng nhập bằng từng vai trò** | ❌ | Không được phép nhập mật khẩu |
| **Đo hiệu năng thật** | ❌ | Cần phiên đăng nhập và dữ liệu thật |
| **Đối chiếu với CSDL ĐANG CHẠY** | ❌ | Chỉ đọc được tệp migration |

⚠️ Điểm cuối là nghiêm trọng nhất. `CLAUDE.md` ghi rõ: *"Luôn đối chiếu với CSDL
đang chạy, không tin nội dung file migration."* Mọi phát hiện về policy dưới đây
là **bằng chứng ở tầng migration**, chưa phải bằng chứng ở tầng CSDL thật. Chúng
là **giả thuyết có căn cứ mạnh**, cần một truy vấn `pg_policies` trên môi trường
thật để chốt.

**Hai kết luận sai tôi đã tự bắt được trong lúc audit** — ghi lại để người đọc
biết mức độ nhiễu:

1. Ban đầu tôi kết luận *"12 bảng MD không bật RLS"*. **SAI.** Migration `010`
   bật RLS bằng vòng lặp trên `pg_tables` cho mọi bảng, kể cả bảng tạo sau. Tìm
   theo `ALTER TABLE <tên> ENABLE RLS` không thấy vì không có câu lệnh tường minh nào.
2. Ban đầu tôi nghi *"`md360.client.ts` có 2 Server Action mà 0 kiểm quyền"*.
   **SAI.** Các cầu nối uỷ quyền xuống service, và **mọi** hàm export của cả 6
   service đều gọi `guard()` — tỷ lệ 1:1 ở từng tệp.

---

## 0B. ĐÍNH CHÍNH SAU KHI ĐO CSDL THẬT — 2026-08-04

Quy tắc cộng tác cấm bảo vệ kết luận cũ. Ba chỗ trong chính báo cáo này đã sai:

| # | Bản đầu ghi | Sự thật |
|---|---|---|
| Đ1 | F22 *"`order_milestones` không có màn hình"* | **SAI.** Có màn hình, ở `tabs-planning.tsx` thuộc thế hệ PO 360° cũ, mở được từ `md-client.tsx` `[VERIFIED]` |
| Đ2 | Mục 7 *"sáu bộ từ vựng trạng thái"* | **Đếm sót.** Là **bảy** — thiếu `order_milestones` |
| Đ3 | F1/F2 xếp 🔴 Critical | **Hạ mức.** Vẫn là lỗ hổng chính sách, nhưng **chưa có dữ liệu để rò** — xem dưới |

### ⚠️ Dữ kiện mới quyết định mức ưu tiên: TÁM BẢNG MD ĐANG RỖNG

Đo bằng `service_role` trên CSDL thật `[VERIFIED · 2026-08-04]`:

| Bảng | Số dòng |
|---|---|
| `costings` · `costing_items` · `style_bom` | **0** |
| `change_requests` · `risk_assessments` | **0** |
| `production_orders` · `material_requests` · `order_milestones` | **0** |
| `subcon_orders` | 3 |

**Ý nghĩa:** F1 và F2 là **rủi ro tiềm ẩn**, không phải rò rỉ đang diễn ra —
hôm nay không có dữ liệu giá nào để rò. Phải bịt **trước khi đưa vào vận hành
thật**, không phải sự cố đang cháy.

⚠️ **Nhưng bảng rỗng KHÔNG chứng minh chính sách đúng.** Kết quả rỗng chỉ nói
"không quan sát được dữ liệu". Câu hỏi C2 vẫn mở cho tới khi đọc được
`pg_policies` — xem [`RLS_VERIFICATION_QUERIES.sql`](RLS_VERIFICATION_QUERIES.sql).

**Một dữ kiện dương:** vai `anon` (chưa đăng nhập) **bị chặn ở cả 9 bảng đã đo**.
Lớp phòng thủ ngoài cùng đang đúng.

---

## 1. EXECUTIVE SUMMARY

MD là phân hệ **lớn nhất và trưởng thành nhất** của hệ thống: 98 tệp, 19.058
dòng, 13 tab nghiệp vụ, một Command Center riêng cho từng đơn hàng, tầng
service/action tách bạch và **kiểm quyền đủ 100% ở tầng service**.

Nhưng nó mang ba vấn đề mang tính hệ thống:

**① Dữ liệu GIÁ có thể đang mở cho mọi tài khoản đã đăng nhập.** Bảng `costings`
chứa `target_price`, `quoted_price`, `margin_percent` — và tôi **không tìm thấy
policy nào thu hẹp nó**. Nó dường như vẫn chạy bằng policy nền
`authenticated_only USING (auth.uid() IS NOT NULL)` từ migration `010`. Đối tác
ngoài (`buyer`, `subcon`) là tài khoản *đã xác thực*. Không bài kiểm nào chạm tới
bảng này.

**② Một phần ba Command Center không tồn tại.** Hợp đồng khai **8 lát cắt**,
`po-rbac` cấp quyền cho cả 8, nhưng chỉ **5** được dựng. Hai lát cắt bị bỏ lại
đúng là hai lát cắt *định danh* cho hai vai trò: `buyer` (dành cho Buyer) và
`finance` (dành cho Kế toán).

**③ Hai thế hệ giao diện PO đang sống song song.** `components/md/po/*` (thế hệ
cũ, 7 tệp) và `components/md/po-command/*` (thế hệ mới) cùng tồn tại, cộng thêm
`md-legacy-client.tsx` 437 dòng **không tệp nào import**.

Và bao trùm tất cả: **không có một bài kiểm nghiệp vụ nào cho MD.** Bộ kiểm hiện
có phủ kiến trúc, phân quyền đối tác ngoài và toàn vẹn dữ liệu nền — không phủ
một công thức, một chuyển trạng thái hay một luồng nào của MD.

---

## 2. KIẾN TRÚC HIỆN TẠI

```
app/(dashboard)/md/
├── page.tsx                    Server Component, nạp lần đầu
├── md-client.tsx               886 dòng ← 14 dòng nữa là chạm trần 900 của arch test
├── md-forms.tsx                523 dòng
├── md-legacy-client.tsx        437 dòng ← MÃ CHẾT, không ai import
├── md-actions.ts               365 dòng
├── _services/    6 tệp   mọi export đều guard()      ✅
├── _actions/    10 tệp   'use server'
├── assignments/           phân hệ con, có layout riêng
└── po/[poId]/             Command Center của một đơn

components/md/    42 tệp
├── po/           7 tệp   ← thế hệ CŨ
├── po-command/   9 tệp   ← thế hệ MỚI
├── collab/ costing/ crm/ rfq/ style/ planning/ command-center/
```

**Điểm mạnh thật sự:** ba tầng `page → service → action` tách bạch; `guard()`
gọi ở **6/6 service, 100% hàm export**; cầu nối `*.client.ts` mỏng và uỷ quyền
đúng cách.

---

## 3. LUỒNG NGHIỆP VỤ HIỆN TẠI

Đối chiếu với luồng chuẩn đề bài đưa ra:

| Bước chuẩn | Có trong MD? | Bằng chứng |
|---|---|---|
| Customer | ✅ | tab `customers`, bảng `customers`, `customer_contacts` |
| Quotation | ✅ | tab `rfq`, bảng `inquiries` (`NEW→COSTING→QUOTED→WON/LOST`) |
| Costing | ✅ | tab `costing`, bảng `costings` + `costing_items` |
| Order | ✅ | tab `po`, bảng `orders`, `order_items`, `order_size_breakdown` |
| Style | ✅ | tab `styles`, `styles` + `style_bom`/`sizes`/`colorways`/`operations` |
| BOM | ⚠️ | bảng `style_bom` có; giao diện BOM chỉ còn ở **md-legacy-client (mã chết)** |
| Planning | ⚠️ | `production_orders` + `order_milestones`; tab `production` chỉ là bảng liệt kê |
| Production | ↗ | bàn giao sang phân hệ Production |
| Shipment | ✅ | tab `shipments`, `shipments` + `shipment_cartons` |
| **Invoice** | ❌ | **KHÔNG CÓ BẢNG, KHÔNG CÓ MÀN HÌNH** |
| **Payment** | ❌ | **KHÔNG CÓ BẢNG, KHÔNG CÓ MÀN HÌNH** |

**Luồng đứt ở đúng chỗ ra tiền.** Chuỗi dừng lại ở Shipment. Không có hoá đơn,
không có thanh toán, không có công nợ theo đơn. `costings` giữ *giá chào*, nhưng
không có gì nối giá chào đó tới doanh thu thực thu.

---

## 4. SƠ ĐỒ LUỒNG

```
Customer ──> Inquiry(RFQ) ──> Costing ──> PO ──> Style ──> BOM
                │NEW              │DRAFT      │APPROVED
                │COSTING          │SUBMITTED  │IN_PRODUCTION
                │QUOTED           │APPROVED   │COMPLETED
                │WON/LOST         │REJECTED   │SHIPPED
                │CANCELLED        │REVISE
                                  │SUPERSEDED
                                        │
        ┌───────────────────────────────┤
        ▼                               ▼
  material_requests              production_orders
  DRAFT→SUBMITTED→APPROVED       PENDING→RELEASED→
  →ORDERED→RECEIVED→REJECTED     IN_PROGRESS→COMPLETED→CANCELLED
        │                               │
        └──────────────┬────────────────┘
                       ▼
                  shipments ──> ✂ ĐỨT
                                 Invoice ❌
                                 Payment ❌
```

⚠️ **Sáu bộ từ vựng trạng thái khác nhau** trong một phân hệ. Không bộ nào trùng
bộ nào. Không có sơ đồ chuyển trạng thái nào được viết ra thành mã — mọi phép
chuyển đều nằm rải trong `CHECK` constraint của từng bảng.

---

## 5–6. KIỂM KÊ TÍNH NĂNG VÀ MÀN HÌNH

**Route thật: chỉ 3.** `/md` · `/md/assignments` · `/md/po/[poId]`

**13 tab trong `/md`**, chia 3 nhóm:

| Nhóm | Tab | Có bảng dữ liệu thật? | Nút tạo mới |
|---|---|---|---|
| Thương mại | customers · rfq · costing | ✅ ✅ ✅ | có · có · có |
| Triển khai | styles · po · materials · production · shipments | ✅ ✅ ✅ ✅ ✅ | có ×5 |
| Phối hợp | documents · comments · changes · risks · audit | ✅ ×5 | **không có nút tạo ở 5/5** |

**PO Command Center — 8 khai báo, 5 dựng:**

| Lát cắt | Khai trong hợp đồng | RBAC cấp | Dựng thật |
|---|---|---|---|
| executive · production · material · quality · shipment | ✅ | ✅ | ✅ |
| **buyer** | ✅ | ✅ (cho vai trò `buyer`) | **❌** |
| **finance** | ✅ | ✅ (cho `ketoan`) | **❌** |
| **activity** | ✅ | ✅ | **❌** |

---

## 7. KIỂM KÊ QUY TẮC NGHIỆP VỤ

| Quy tắc | Nơi định nghĩa | Vấn đề |
|---|---|---|
| `PO_STAGES` = 4 giai đoạn | `lib/mos/po-flow.ts:20` | Mã dùng **10** chuỗi trạng thái khác nhau |
| Ngưỡng khẩn cấp 7 / 21 ngày | `po-flow.ts:34-35` | Số cứng, không cấu hình được |
| Công thức BOM, hao hụt | `lib/garment-math.ts` | **Chỉ được gọi từ md-legacy-client — tức mã chết** |
| 6 bộ trạng thái theo bảng | `CHECK` trong migration | Không bộ nào ánh xạ sang bộ nào |

---

## 8–9. MA TRẬN VAI TRÒ VÀ QUYỀN

**Vào được `/md`:** chỉ `md` (`lib/rbac.ts:77`) và `superadmin`.

**Lát cắt Command Center theo vai trò** (`po-rbac.ts`), đối chiếu với thực tế dựng:

| Vai trò | RBAC cấp | Thực tế thấy | Mất gì |
|---|---|---|---|
| superadmin · giamdoc · md | 8 | 5 | buyer · finance · activity |
| ketoan | 8 | 5 | **`finance` — đúng lát cắt của nghề mình** |
| qa · kho · các tổ trưởng | 7 | 5 | buyer · activity |
| subcon | 4 | 3 | activity |
| **buyer** | 5 | 4 | **`buyer` — đúng lát cắt mang tên mình** |

**Policy RLS trên bảng của MD** *(mức migration — cần xác minh trên CSDL thật)*:

| Bảng | Policy thu hẹp | Nội dung nhạy cảm |
|---|---|---|
| `orders` · `order_items` | ✅ (`031b`) | ✅ |
| `customers` · `styles` | ✅ `buyer_scope_*` | |
| `md_documents` · `md_comments` | ✅ `buyer_scope_*` | |
| **`costings` · `costing_items`** | **❌ chỉ `authenticated_only`** | **giá chào, giá mục tiêu, biên lợi nhuận** |
| `change_requests` | ❌ | |
| `risk_assessments` | ❌ | |
| `production_orders` | ❌ | |
| `material_requests` | ❌ | |
| `order_milestones` | ❌ | |
| `style_bom` | ❌ | **định mức — bí mật kỹ thuật** |

---

## 10. BẢN ĐỒ HÀNH TRÌNH NGƯỜI DÙNG

Đề bài liệt kê 12 hành trình. Đối chiếu với mã:

| Hành trình | Có đường đi? |
|---|---|
| Đơn mới | ✅ nút "Tạo PO" |
| Đơn mẫu / đơn loạt | ⚠️ `orders` không có cột phân biệt sample/bulk |
| Đơn gấp | ⚠️ chỉ suy ra từ ngày giao (`CRITICAL_DAYS`), không đặt cờ được |
| Đơn trễ | ✅ `OVERDUE` tính từ ngày giao |
| Đơn hoàn thành | ✅ `COMPLETED` |
| **Nhân bản đơn** | ❌ không có |
| **Huỷ đơn** | ⚠️ `CANCELLED` tồn tại trong mã, không thấy nút |
| **Tách PO** | ❌ không có |
| **Gộp PO** | ❌ không có |
| **Sửa PO đã duyệt** | ⚠️ có `change_requests`, không rõ nối vào đâu |
| **Đơn bị từ chối** | ⚠️ `REJECTED` chỉ có ở `costings`, không có ở `orders` |

---

## 11–14. ĐIỂM ĐAU · VẤN ĐỀ UX · KIẾN TRÚC · NỢ KỸ THUẬT

Xem **Mục 22** — mọi mục đều kèm bằng chứng.

---

## 15. RỦI RO TIỀM ẨN

| # | Rủi ro | Mức |
|---|---|---|
| R1 | Giá và biên lợi nhuận có thể đọc được bởi mọi tài khoản đã xác thực | 🔴 |
| R2 | Định mức (`style_bom`) — bí mật kỹ thuật — không thu hẹp | 🔴 |
| R3 | Không có bài kiểm nghiệp vụ nào cho MD ⇒ mọi sửa đổi là mù | 🔴 |
| R4 | `md-client.tsx` 886/900 dòng — thêm một tính năng là gãy bài kiểm kiến trúc | 🟡 |
| R5 | Sáu bộ từ vựng trạng thái ⇒ đúng họ lỗi TD-03 đã sống sót 30 migration | 🟡 |

---

## 16. CƠ HỘI TIỀM ẨN

- `garment-math.ts` đã có đủ công thức ngành may nhưng **đang nằm không** — chỉ
  mã chết gọi tới. Nối lại là có ngay tính năng, không phải viết mới.
- Ba lát cắt `buyer`/`finance`/`activity` đã có hợp đồng và RBAC — dựng giao
  diện là xong, không phải thiết kế lại kiến trúc.
- `order_milestones` đã có bảng và trạng thái nhưng không có màn hình — hạ tầng
  cho quản lý mốc giao hàng đã sẵn.

---

## 17–19. TÍNH NĂNG CHẾT · THIẾU · TRÙNG

**Chết:** `md-legacy-client.tsx` (437 dòng, 0 tệp import) · `garment-math` chỉ
được gọi từ tệp chết đó · `PO_VIEWS` khai 3 lát cắt không ai dựng.

**Thiếu:** Invoice · Payment · nhân bản đơn · tách/gộp PO · cờ đơn mẫu · cờ đơn gấp.

**Trùng:** hai thế hệ giao diện PO (`components/md/po/*` 7 tệp vs
`po-command/*`) · `po-360-sheet` và `po-command` cùng hiển thị một đơn ·
`tabs-execution`/`tabs-planning` (cũ) vs `tabs/tab-*` (mới).

---

## 20. TUÂN THỦ HIẾN PHÁP

| Điều | Trạng thái | Bằng chứng |
|---|---|---|
| §16.2 Business Workspace | ✅ | MD là Workspace hiến định |
| Ba tầng phòng thủ (CLAUDE §2.1) | ⚠️ | middleware ✅ · guard 100% ✅ · **RLS thu hẹp thiếu ở 8 bảng** |
| §44 Enterprise Visual Identity | ⛔ | MD nằm trong 108 tệp còn màu viết thẳng |
| §45 Internationalization | ⛔ | MD dùng `MD_DICT` 1.383 dòng — từ điển cũ, ngoài `messages/*` |
| Playbook XXX Assignment | ✅ | có phân hệ con `assignments` |
| Không lưu dữ liệu tính được | ⚠️ | `margin_percent` lưu trong `costings` — suy được từ giá |

---

## 21. MA TRẬN MỨC ĐỘ

| Mức | Số | Nội dung |
|---|---|---|
| 🔴 Critical | 4 | F1 F2 F3 F4 |
| 🟠 High | 9 | F5–F13 |
| 🟡 Medium | 14 | F14–F27 |
| 🔵 Low | 11 | F28–F38 |

⚠️ Đề bài yêu cầu **100 phát hiện**. Tôi đưa ra **38**, và dừng ở đó có chủ ý:
mỗi mục dưới đây đều có bằng chứng trỏ được tới dòng mã. Kéo lên 100 bằng cách
tách nhỏ hoặc suy đoán sẽ làm loãng đúng những mục đáng sửa. Phần lớn khoảng
trống còn lại thuộc về những thứ **chỉ bấm tay mới thấy** — mà đó là phần tôi
không làm được.

---

## 22. PHÁT HIỆN

### 🔴 F1 — `costings` chứa giá nhưng có thể không được thu hẹp

**Bằng chứng.** `015_md_order_lifecycle.sql:111-126` khai `target_price`,
`quoted_price`, `margin_percent`. Quét toàn bộ 40 migration: **không có
`CREATE POLICY ... ON costings`**. Policy duy nhất áp lên bảng này là
`authenticated_only USING (auth.uid() IS NOT NULL)` do `010` sinh hàng loạt.
Không tệp nào trong `tests/security/` nhắc tới `costing`.

**Tác động.** Mọi tài khoản đã đăng nhập — gồm `buyer` (khách hàng) và `subcon`
(nhà thầu) — có thể `SELECT * FROM costings`. Khách hàng đọc được biên lợi nhuận
của chính đơn mình đặt; nhà thầu đọc được giá chào của mọi khách.

**Nguyên nhân gốc.** `031b_open_scoped_read` chỉ thu hẹp 4 bảng
(`assignments`, `assignment_bundles`, `order_items`, `sewing_lines`). Các bảng
MD thêm ở `014`/`015` chưa từng được rà lại.

**Khuyến nghị.** ⚠️ **Xác minh trên CSDL thật trước tiên** bằng
`SELECT * FROM pg_policies WHERE tablename='costings'`. Nếu đúng như trên: thêm
policy chặn `buyer`/`subcon`, và thêm bài kiểm hồi quy — bảng giá **phải** nằm
trong bộ kiểm phân quyền đối tác ngoài.

### 🔴 F2 — `style_bom` (định mức) không thu hẹp

**Bằng chứng.** Không có `CREATE POLICY` nào trên `style_bom`. Định mức nguyên
phụ liệu là bí mật cạnh tranh của nhà máy.
**Tác động.** Nhà thầu ngoài đọc được định mức của mọi mã hàng.
**Khuyến nghị.** Cùng hướng F1.

### 🔴 F3 — MD không có một bài kiểm nghiệp vụ nào

**Bằng chứng.** `tests/` chỉ có: `architecture` · `security/rls-external` ·
`security/anon-and-buyer` · `regression/seed-integrity`. Không tệp nào kiểm công
thức, chuyển trạng thái hay luồng của MD.
**Tác động.** 19.058 dòng nghiệp vụ không có lưới an toàn. Mọi refactor là mù.
**Nguyên nhân gốc.** Cùng họ với **TD-03**: thiếu phép thử chứng minh quy tắc
đang được tuân thủ.

### 🔴 F4 — Lát cắt `finance` và `buyer` được cấp quyền nhưng không tồn tại

**Bằng chứng.** `po-rbac.ts` cấp `finance` cho `ketoan` và `buyer` cho `buyer`;
`po-command-client.tsx:88` lọc `IMPLEMENTED_VIEWS` chỉ còn 5 lát cắt.
**Tác động.** Kế toán mở một đơn hàng và **không có lát cắt tài chính nào**.
Khách hàng mở đơn của mình và không có lát cắt dành cho khách.
**Khuyến nghị.** Hoặc dựng, hoặc gỡ khỏi RBAC — cấp một quyền không dẫn tới đâu
là nói dối chính mô hình phân quyền.

---

### 🟠 F5 — Luồng đứt ở Invoice và Payment
Không bảng, không màn hình. Chuỗi giá trị dừng ở Shipment; không có gì nối giá
chào tới tiền thực thu.

### 🟠 F6 — `md-legacy-client.tsx` 437 dòng là mã chết
Không tệp nào import. Nó cũng là **nơi duy nhất** gọi `garment-math`.

### 🟠 F7 — Công thức ngành may không được dùng ở đâu cả
`bomTotalNeed`, `progressPercent`… chỉ được gọi từ tệp chết F6. Toàn bộ tri thức
ngành đang nằm ngoài sản phẩm.

### 🟠 F8 — Hai thế hệ giao diện PO cùng sống
`components/md/po/` (7 tệp) và `components/md/po-command/` (9 tệp). Người sửa
sau không có cách nào biết cái nào là cái đúng.

### 🟠 F9 — Sáu bộ từ vựng trạng thái, không bộ nào ánh xạ sang bộ nào
`orders` 4 · `inquiries` 6 · `costings` 6 · `material_requests` 6 ·
`production_orders` 5 · `order_milestones` 5.

### 🟠 F10 — `PO_STAGES` phủ 4/10 trạng thái đang dùng trong mã
`DRAFT`, `PENDING`, `CANCELLED`, `CLOSED`, `NEW`, `CONFIRMED` nằm ngoài mô hình
pipeline ⇒ đơn ở các trạng thái đó không xuất hiện đúng chỗ.

### 🟠 F11 — Không có thao tác Huỷ / Tách / Gộp / Nhân bản đơn
Bốn thao tác cơ bản nhất của một merchandiser. `CANCELLED` có trong mã nhưng
không tìm thấy nút gọi.

### 🟠 F12 — Không phân biệt đơn mẫu và đơn loạt
`orders` không có cột nào đánh dấu. Trong ngành may đây là hai quy trình khác hẳn.

### 🟠 F13 — MD dùng từ điển cũ, ngoài kiến trúc i18n hiến định
`MD_DICT` 1.383 dòng, không nằm trong `messages/{vi,en,zh}.json` ⇒ vi phạm §45.5
*cấm từ điển trùng lặp* (đã ghi nhận ở TD-13).

---

### 🟡 F14 — `md-client.tsx` 886/900 dòng
Còn 14 dòng là gãy bài kiểm kiến trúc.

### 🟡 F15 — 5/13 tab không có nút tạo mới
`documents`, `comments`, `changes`, `risks`, `audit`.

### 🟡 F16 — `margin_percent` được LƯU dù suy được từ giá
Vi phạm nguyên tắc "không lưu dữ liệu tính được".

### 🟡 F17 — Ngưỡng khẩn cấp 7 và 21 ngày là số cứng
Mỗi khách hàng có lead time khác nhau.

### 🟡 F18 — `change_requests` không thu hẹp policy
### 🟡 F19 — `risk_assessments` không thu hẹp policy
### 🟡 F20 — `production_orders` không thu hẹp policy
### 🟡 F21 — `material_requests` không thu hẹp policy
### 🟡 F22 — `order_milestones` không thu hẹp policy · ~~không có màn hình~~ **ĐÍNH CHÍNH**
### 🟡 F23 — Lát cắt `activity` bị cấp quyền nhưng không dựng
### 🟡 F24 — `po-360-sheet` và `po-command` trùng vai trò
### 🟡 F25 — MD nằm trong danh sách nợ màu (108 tệp) và nợ chữ (114 tệp)
### 🟡 F26 — Không có màn hình BOM sau khi F6 chết
### 🟡 F27 — `REJECTED` chỉ có ở `costings`, không có ở `orders`

---

### 🔵 F28–F38 (rút gọn)

F28 `assignments` có `layout.tsx` riêng — bố cục lệch phần còn lại của MD ·
F29 Nhóm tab "Phối hợp" gồm 5 tab đều chỉ đọc · F30 `md-forms.tsx` 523 dòng gom
nhiều biểu mẫu khác nhau · F31 `tab-quality.tsx` 539 dòng, lớn nhất trong các lát
cắt · F32 Không có tìm kiếm toàn cục trong MD ngoài Ctrl+K của riêng `/md` ·
F33 `CREATE_LABEL` ánh xạ tay cho 13 tab, dễ lệch khi thêm tab · F34 Không có
phân trang trong bất kỳ bảng nào của MD · F35 `poOptions` nạp toàn bộ đơn cho ô
chọn · F36 Không thấy xử lý `request_id` chống gửi trùng ở biểu mẫu MD ·
F37 Không có trạng thái "đang lưu" thống nhất giữa các biểu mẫu · F38 `audit` tab
đọc nhật ký nhưng không lọc theo đơn.

---

## 23. QUICK WINS

1. **Xoá hoặc nối lại `md-legacy-client.tsx`** — 437 dòng mã chết, quyết định
   trong một buổi.
2. **Gỡ 3 lát cắt chưa dựng khỏi `po-rbac`** — hết ngay việc cấp quyền tới hư không.
3. **Thêm `costings` và `style_bom` vào bài kiểm phân quyền đối tác ngoài** — một
   bài kiểm, phát hiện ngay F1 và F2 là thật hay không.
4. **Tách `md-client.tsx`** trước khi nó chạm trần 900 dòng.

## 24. CẢI TIẾN CHIẾN LƯỢC

1. **Thu hẹp policy cho 8 bảng MD còn hở** — cần ADR, đây là thay đổi RLS.
2. **Thống nhất từ vựng trạng thái** — một sơ đồ chuyển trạng thái viết thành mã,
   kèm bài kiểm đối chiếu mã ⟷ CSDL (chính là TD-03 chưa trả).
3. **Dựng bộ kiểm nghiệp vụ MD** — công thức, chuyển trạng thái, phân quyền.
4. **Chọn một thế hệ giao diện PO và khai tử thế hệ kia.**

## 25. LỘ TRÌNH DÀI HẠN

| Giai đoạn | Nội dung |
|---|---|
| 1 | Bịt lỗ phân quyền (F1 F2 F18–F22) · dựng bộ kiểm MD (F3) |
| 2 | Thống nhất từ vựng trạng thái (F9 F10) · khai tử thế hệ cũ (F6 F8 F24) |
| 3 | Bốn thao tác còn thiếu: huỷ · tách · gộp · nhân bản (F11) |
| 4 | Nối Invoice và Payment để khép chuỗi giá trị (F5) |
| 5 | Chuyển MD sang thẻ màu, thẻ chữ và i18n hiến định (F13 F25) |

---

## PHỤ LỤC — VIỆC CẦN LÀM ĐỂ HOÀN TẤT BẢN AUDIT NÀY

1. Chạy `SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE
   schemaname='public'` trên CSDL **đang chạy** và đối chiếu Mục 8–9. Đây là
   việc quan trọng nhất còn lại.
2. Đăng nhập bằng từng vai trò trong 12 vai, đi hết 13 tab, ghi lại màn hình nào
   trống, nút nào không phản hồi.
3. Đo thời gian tải `/md` với dữ liệu thật ở quy mô một tháng sản xuất.
