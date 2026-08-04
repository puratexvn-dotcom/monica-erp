# ADR-018 — Thu hẹp `authenticated_only` trên 23 bảng Merchandising

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-018 |
| **Trạng thái** | 🔴 **MỞ LẠI 05/08/2026** — `042` đúng, nhưng migration `043` *(chưa qua ADR, đã chạy nhầm)* làm yếu nó. `044` chờ Board chạy |
| **Hồ sơ phản biện** | [`docs/review/ADR-018-review.md`](../review/ADR-018-review.md) — 🔴 treo: **0** · 🟠 treo: **1** (`B-2` → `TD-32`) |
| **Người soạn** | Chief Solution Architect |
| **Phản biện độc lập** | ⏳ chưa thực hiện — bắt buộc theo [ADR-011](ADR-011-tham-quyen-kien-truc.md) §2.2 *(thay đổi RLS · policy · mô hình phân quyền)* |
| **Hồ sơ phản biện** | [`docs/review/ADR-018-review.md`](../review/) — chưa lập |
| **Hiến pháp** | **Điều 4** *(ADR trước SQL)* · **Điều 8** *(Evidence First)* |
| **MOS** | **§XI.1** *(SECURITY FREEZE)* — `MONICA_CONSTITUTION.md`, bậc 4 |
| **Migration** | `042_narrow_md_grants.sql` — ✅ **ĐÃ CHẠY 05/08/2026**, đo lại đạt *(xem §10.3)* |
| **Phát hiện gốc** | `F-2` — [`docs/audit/VR-001-KET-QUA.md`](../audit/VR-001-KET-QUA.md) §2.1 |
| **Số ADR** | `012` · `013` · `014` là **số dành riêng, không tái sử dụng** (Hiến pháp §37.5) |

> ⛔ **KHÔNG viết và KHÔNG chạy migration `042` cho tới khi Board phê duyệt ADR
> này.** Board Directive 04/08/2026 mục 2, câu cuối.

---

## 1. Problem

23 bảng nghiệp vụ Merchandising đang chạy dưới **một** policy duy nhất, cấp bởi
hai vòng lặp `DO $$` ở `014_md_tables.sql:120` và `015_md_order_lifecycle.sql:504`:

```sql
CREATE POLICY "authenticated_only" ON public.<bảng>
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
GRANT ALL ON public.<bảng> TO authenticated;
```

Điều kiện phân quyền duy nhất là **"có đăng nhập hay không"**. Vai trò không xuất
hiện trong biểu thức. Hệ quả: **mọi người dùng nội bộ có đủ bốn quyền `SELECT`
`INSERT` `UPDATE` `DELETE` trên mọi dòng của cả 23 bảng** — trong đó có
`costings` *(cơ cấu giá thành và biên lợi nhuận)* và `style_bom` *(định mức
nguyên phụ liệu)*.

Đây **không** phải một chỗ quên. Nó là **mô hình phân quyền của giai đoạn dựng
khung**: lúc `014`/`015` chạy, hệ thống chỉ cần phân biệt *"đã đăng nhập"* với
*"chưa đăng nhập"*. Ba mươi migration sau, giả định đó không còn đúng, nhưng
chưa migration nào quay lại thu hẹp.

---

## 2. Current State

### 2.1 Ba lớp đang chồng lên nhau

| Lớp | Nguồn | Nội dung | Ai bị chặn |
|---|---|---|---|
| **Policy nền** | `014` · `015` | `authenticated_only` — `FOR ALL`, `USING (auth.uid() IS NOT NULL)` | chỉ `anon` |
| **Chặn buyer** | `018:307` | `buyer_denied` `AS RESTRICTIVE` — `USING (NOT mos_is_buyer())` | `buyer` |
| **Chặn nhà thầu** | `025:111` | `subcon_denied` `AS RESTRICTIVE` — `USING (NOT mos_is_subcon())` | `subcon` |

`RESTRICTIVE` nhân với `PERMISSIVE` bằng phép **VÀ**, nên hai lớp dưới thật sự
chặn được người ngoài. **Lớp trên không chặn ai trong 12 vai nội bộ.**

> ✅ **Người ngoài KHÔNG rò.** Audit Report từng khẳng định ngược lại; phát biểu
> đó đã được đính chính tại chỗ và ở `VR-001-KET-QUA.md` §1. ADR này **chỉ** xử
> lý phía **nội bộ** — nó không đụng `buyer_denied` và `subcon_denied`.

### 2.2 Phép đo — `[VERIFIED]` 04/08/2026, CSDL đang chạy

[`tests/security/md-internal-scope.test.mjs`](../../tests/security/md-internal-scope.test.mjs),
phiên đăng nhập thật vai `md`:

```
KIỂM PHÂN QUYỀN NỘI BỘ — authenticated_only: 0 đạt · 24 hỏng · 4 chưa đo được
```

| Phép đo | Kết quả |
|---|---|
| Gửi `DELETE` lên 23 bảng | ⛔ **23/23 lệnh chạy được** |
| Gửi `UPDATE` lên `activity_log` | 🔴 chạy được → **đã vá bằng `041`** *(F-1)* |
| Đọc theo vai trên 4 bảng nhạy cảm | ⚪ **chưa đo được** — bảng rỗng, Điều V.1 cấm kết luận |

### 2.3 Vì sao `GRANT` của các migration sau không cứu được

Supabase đặt sẵn:

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
```

Mọi bảng nhận đủ quyền **ngay lúc `CREATE TABLE`**. Câu `GRANT SELECT, INSERT,
UPDATE` viết sau là **phép cộng thêm**, không phải phép thu hẹp — `GRANT` không
bao giờ gỡ đi thứ gì. Đây đúng bài học `029b:11` đã ghi cho 8 bảng khác.

### 2.4 Hạ tầng sẵn có để thu hẹp

| Hàm | Nguồn | Đặc tính |
|---|---|---|
| `mos_current_role()` | `019:34` | `SECURITY DEFINER` · `STABLE` · đọc `app_metadata` trong JWT |
| `mos_is_external()` | `025:50` | `true` với `buyer` và `subcon` |
| `mos_is_buyer()` · `mos_is_subcon()` | `018` · `025` | |

🔑 **`mos_current_role()` không truy vấn bảng nào** — nó chỉ đọc claim trong
token. Đây là điều kiện bắt buộc để dùng được trong policy: quy tắc **K-3** nói
policy truy vấn bảng mà người gọi không đọc được sẽ biến *khoanh vùng* thành
*chặn phẳng*. Hàm này miễn nhiễm với bẫy đó.

14 vai trong [`lib/rbac.ts`](../../lib/rbac.ts): `superadmin` `giamdoc` `md` `qa`
`totruongmay` `totruongcat` `hoanthanh` `kho` `ketoan` `khotruong` `thukho`
`ketoanvattu` + hai vai ngoài `subcon` `buyer`.

---

## 3. Security Risk

### 3.1 Rủi ro đã hiện thực hoá được ngay hôm nay

| # | Kịch bản | Vai cần có | Hậu quả |
|---|---|---|---|
| **R-1** | Đọc `costings.margin_percent` của toàn bộ đơn hàng | bất kỳ vai nội bộ nào | Biên lợi nhuận từng khách rò ra ngoài phạm vi thương mại. Một người nghỉ việc mang theo cơ cấu giá của cả nhà máy |
| **R-2** | Đọc `style_bom` | bất kỳ vai nội bộ nào | Định mức nguyên phụ liệu là **bí mật kỹ thuật** — thứ đối thủ cần để chào giá thấp hơn |
| **R-3** | `UPDATE costings SET quoted_price = …` | bất kỳ vai nội bộ nào | Sửa giá chào **sau khi** đã duyệt. Bằng chứng phê duyệt (Hiến pháp Điều 8) mất giá trị |
| **R-4** | `DELETE FROM <22 bảng>` | bất kỳ vai nội bộ nào | Xoá cứng chứng từ. Xoá mềm trở thành quy ước lịch sự, không phải hàng rào |
| **R-5** | `TRUNCATE` | bất kỳ vai nội bộ nào | Một lệnh, sạch cả bảng, **bỏ qua trigger, bỏ qua RLS, không sinh dòng audit** |
| **R-6** | Gắn trigger lên bảng *(quyền `TRIGGER` nằm trong `GRANT ALL`)* | bất kỳ vai nội bộ nào | Đường can thiệp nội dung không đi qua policy nào |

### 3.2 Vì sao "bảng đang rỗng" không làm rủi ro nhỏ đi

23 bảng hiện 0 dòng. Điều đó khiến **rủi ro chưa hiện thực hoá**, nhưng không
làm nó nhỏ đi: Cổng C sẽ nạp ~700 bản ghi dữ liệu chủ, và mọi dòng nạp vào đều
rơi thẳng vào trạng thái mở này. **Sửa trước khi có dữ liệu rẻ hơn sửa sau** —
sau đó còn phải trả lời câu "ai đã đọc gì trong khoảng thời gian đó", mà
`activity_log` cho tới `041` vẫn sửa được nên câu đó **không** trả lời được.

### 3.3 Vi phạm văn bản chuẩn tắc

| Văn bản | Điều | Nội dung bị vi phạm |
|---|---|---|
| **Playbook** | Điều XXX | `Identity → Assignment → Resource Scope → Permission → Action`. Hiện tại chuỗi này rút gọn còn `Identity → Action` |
| **Hiến pháp** | **Điều 8** *(Evidence First)* | `R-3` sửa được giá **sau khi duyệt** ⇒ bằng chứng phê duyệt không còn chứng minh được điều gì |
| **EDD-04B** | `SOD-H*` | Chín chặn cứng phân tách nhiệm vụ — không chặn nào thi hành được khi mọi vai đều ghi được mọi bảng |
| **CLAUDE.md** | §2.5 | Xoá mềm bắt buộc · chứng từ đã Đóng/Duyệt không được `UPDATE` |

> ⚠️ **Trích dẫn `XI.1`.** `SECURITY FREEZE` nằm ở `MONICA_CONSTITUTION.md:255`
> — văn bản **bậc 4**, đánh số La Mã. Cách gọi đúng theo CLAUDE.md §0 là
> **`MOS §XI.1`**, không phải *"Hiến pháp XI.1"*. `00-CONSTITUTION.md` *(bậc 1,
> số Ả Rập)* **không có** điều XI.1.
>
> CLAUDE.md §2.2 hiện đang viết *"SECURITY FREEZE (Hiến pháp XI.1)"* — trích dẫn
> sai nguồn theo chính quy tắc mà CLAUDE.md §0 đặt ra. Ghi nhận ở đây, **không
> sửa trong ADR này** vì nằm ngoài phạm vi Board duyệt ⇒ `TD-28` §9.3.

---

## 4. Enterprise Best Practice

### 4.1 Hai tầng, không phải một

| Tầng | Cơ chế | Trả lời câu hỏi | Chi phí |
|---|---|---|---|
| **Privilege** | `GRANT` / `REVOKE` | *Hành động này có bao giờ hợp lệ không?* | Kiểm **một lần** cho cả câu lệnh |
| **Policy** | RLS `USING` / `WITH CHECK` | *Dòng nào được chạm?* | Đánh giá biểu thức **mỗi dòng** |

Thao tác **không bao giờ** hợp lệ phải chặn ở tầng Privilege. Dùng policy để
chặn `TRUNCATE` là dùng sai công cụ — policy **không** áp cho `TRUNCATE`. Đây
đúng lý lẽ `029b:34` đã viết và ADR này áp lại cho 22 bảng còn lại.

### 4.2 Chuẩn ngành

- **NIST SP 800-53 `AC-6` · ISO 27001 `A.9.4.1`** — least privilege: cấp đúng
  cái cần để làm việc, không cấp theo *"đã xác thực"*.
- **SAP `S_TABU_DIS` · Oracle EBS Data Security** — dữ liệu chi phí và biên lợi
  nhuận nằm trong lớp uỷ quyền riêng, **không** đi chung với dữ liệu vận hành.
  Đây là mặc định của mọi ERP thương mại, không phải yêu cầu đặc thù Monica.
- **Deny-by-default** — bảng mới phải đóng cho tới khi có người mở tường minh.
  Hai vòng lặp `018`/`025` *tưởng* làm điều này nhưng chúng duyệt `pg_tables`
  **tại thời điểm chạy**: chúng là **ảnh chụp**, không phải quy tắc thường trực.

### 4.3 Vì sao thiết kế dưới đây theo VAI chứ không theo ASSIGNMENT

Playbook Điều XXX đặt Assignment làm trục phân quyền, và ADR này lại chia theo
**vai**. Phải nói thẳng chỗ này thay vì để nó trôi qua:

- Điều XXX sinh ra cho **đối tác ngoài** — câu hỏi *"Monica đã giao việc gì cho
  người đó?"* chỉ có nghĩa khi tồn tại một `Assignment`. 23 bảng này là dữ liệu
  **nội bộ**; không có thực thể Assignment nào phủ chúng.
- Chuyển sang mô hình theo Assignment cho nội bộ đòi hỏi một khái niệm chưa tồn
  tại *(phân công merchandiser theo khách hàng / theo mùa)*. Đó là **mở rộng
  phạm vi**, và Board Directive mục 4 cấm.
- Phân tầng theo vai là **phép thu hẹp một chiều** so với hiện trạng: mọi thứ nó
  cấm đều đang được phép. Nó không khoá cửa nào mà mô hình Assignment sau này
  cần mở.

⇒ ADR này **không** tuyên bố đã thi hành Điều XXX cho nội bộ. Nó **giảm bề mặt
tấn công về mức tối thiểu khả thi trong phạm vi Board duyệt**, và ghi phần còn
lại thành nợ kiến trúc `TD-25` ở §9.3.

---

## 5. Impact Analysis

### 5.1 Phân tầng 22 bảng *(`activity_log` đã xử lý ở `041`)*

**T1 · Thương mại — mật (4 bảng)** — *sửa 05/08/2026 theo phán quyết `VR-004`
và `VR-005` của Board*

| Bảng | `SELECT` trên bảng gốc | `INSERT` · `UPDATE` |
|---|---|---|
| `costings` | `superadmin` `giamdoc` `md` | `superadmin` `md` |
| `costing_items` | `superadmin` `giamdoc` `md` | `superadmin` `md` |
| `inquiries` | `superadmin` `giamdoc` `md` | `superadmin` `md` |
| `style_bom` | `superadmin` `giamdoc` `md` **+ `kho` `khotruong` `thukho` `ketoanvattu`** *(chỉ đọc — `VR-004`)* | `superadmin` `md` |

`giamdoc` đọc mà không ghi — đúng vai người **duyệt**, và là điều kiện cần của
`SOD-H*`: người lập giá không được là người duyệt giá.

⚠️ **`ketoan` KHÔNG còn trong T1.** Bản nháp đầu cho `ketoan` đọc cả 4 bảng.
Phán quyết `VR-005` hẹp hơn thế — xem §5.1.1.

#### 5.1.1 🔴 `VR-005` là phân quyền theo CỘT — RLS không làm được

Board phán quyết: *"Accounting được phép xem Approved Cost, Contribution Margin,
Full Cost và giá đã được phê duyệt. Không được truy cập Cost Breakdown, Draft
Costing, AI Simulation hoặc dữ liệu thương lượng."*

Chiếu vào lược đồ thật (`015:111-137`):

| Cột `costings` | Phán quyết | Vì sao |
|---|---|---|
| `quoted_price` · `margin_percent` | ✅ cho | giá đã duyệt · Contribution Margin |
| `costing_no` `version` `currency` `quantity` `order_type` `customer_id` `style_id` `status` `approved_by` `approved_at` | ✅ cho | ngữ cảnh, không mang nội dung thương lượng |
| **`target_price`** | ⛔ cấm | giá mục tiêu khách đưa ra — **dữ liệu thương lượng** |
| **`notes`** · **`reject_reason`** | ⛔ cấm | lý do bác, trao đổi nội bộ — **dữ liệu thương lượng** |
| **`inquiry_id`** | ⛔ cấm | trỏ thẳng vào hồ sơ hỏi giá |
| Dòng `status <> 'APPROVED'` | ⛔ cấm | **Draft Costing** |
| Toàn bộ `costing_items` | ⛔ cấm | bảng này **CHÍNH LÀ** Cost Breakdown |
| Toàn bộ `inquiries` | ⛔ cấm | dữ liệu thương lượng |

**Vấn đề:** lọc `status = 'APPROVED'` là lọc **dòng** — RLS làm được. Nhưng
*"thấy `quoted_price`, không thấy `target_price`"* là lọc **cột**, và
**RLS không lọc cột.**

`GRANT SELECT (cột, cột)` có lọc cột, nhưng nó cấp theo **vai CSDL**. Mọi người
dùng Monica — `md`, `ketoan`, `kho` — đều đăng nhập dưới **cùng một vai
`authenticated`**; vai thật nằm trong claim JWT, không nằm ở tầng Postgres. Vì
vậy `GRANT` theo cột **không phân biệt được `ketoan` với `md`**.

⇒ Cách duy nhất thi hành đúng `VR-005`: **`ketoan` không chạm bảng gốc**, mà đọc
một **phép chiếu** chỉ chứa cột được phép:

```
ketoan  ⛔ costings (bảng gốc)  ⛔ costing_items  ⛔ inquiries
ketoan  ✅ v_costing_approved   ← chỉ 12 cột cho phép · chỉ status = 'APPROVED'
```

Đây **không phải phát minh mới**: nó đúng **Disclosure Projection** `DL-057`
(EDD-03) — *"vai không chạm bảng gốc, chỉ đọc read model"*. `DL-057` viết cho
vai NGOÀI; ADR này áp cùng khuôn cho một vai TRONG, vì yêu cầu có cùng hình dạng.

⚠️ **View mặc định vượt mặt RLS** (CLAUDE.md §3). `v_costing_approved` **cố ý**
để mặc định *(không `security_invoker`)* — nếu đặt `security_invoker = true` thì
view chạy dưới quyền `ketoan`, mà `ketoan` bị cấm bảng gốc, nên view trả rỗng và
phán quyết Board không thi hành được. Đánh đổi này **bắt buộc**, và kèm ba nghĩa vụ:

1. Ghi vào [`SECURITY_DEFINER_REGISTRY.md`](../SECURITY_DEFINER_REGISTRY.md) kèm lý do và ADR
2. `A001` *(view security)* chạy lại — nó tồn tại đúng để bắt loại view này
3. View **tự mang bộ lọc** `WHERE status = 'APPROVED'` và tự giới hạn cột — không
   dựa vào bất kỳ policy nào ở dưới

#### 5.1.2 `VR-004` — phần thi hành được và phần KHÔNG

Board: *"Warehouse được phép READ ONLY đối với Style BOM… Không được sửa,
export, copy hoặc truy cập các thông tin tài chính."*

| Yêu cầu | Thi hành ở đâu | Tình trạng |
|---|---|---|
| **READ ONLY** | `042` — policy `SELECT` cho 4 vai kho, ⛔ không `INSERT`/`UPDATE`/`DELETE` | ✅ làm được ngay |
| **Không truy cập thông tin tài chính** | — | ✅ **tự thoả**: `style_bom` **không có cột giá nào**. Toàn bộ 14 cột là định mức kỹ thuật *(`consumption_per_pcs` · `wastage_percent` · `net_consumption` · `supplier` …)* |
| **Không export, không copy** | Data Egress Control — EDD-04F `E1` `E6` | 🔴 **CHƯA CÓ.** Tầng này chưa được dựng |

🔴 **Phải nói thẳng:** `042` thi hành được *"chỉ đọc"* và *"không có dữ liệu tài
chính"*, nhưng **không** thi hành được *"không export, không copy"*. Ai đọc được
màn hình thì chụp được màn hình và chép được nội dung — EDD-04F `P-ATTRIB` đã
kết luận đúng điều đó, và giải pháp không phải ngăn tuyệt đối mà là **quy trách
nhiệm**: watermark, nhật ký tải, audit trail. Toàn bộ tầng đó nằm ở Cổng D, chưa
dựng. Ghi thành `TD-31`.

> ⚠️ Một chỗ tôi tự quyết, báo để Board bác nếu sai: cột **`supplier`** trong
> `style_bom` là **nguồn cung** — thông tin thương mại nhạy cảm, nhưng không phải
> *"thông tin tài chính"* theo nghĩa Board nêu, và kho **cần** nó để nhận hàng.
> Tôi giữ cột này cho kho. Muốn cắt thì phải chuyển `style_bom` sang phép chiếu
> như `costings`, và tôi cần Board nói rõ.

**T2 · Chứng từ vận hành (7 bảng)** — `SELECT`: mọi vai nội bộ

| Bảng | `INSERT` · `UPDATE` |
|---|---|
| `production_orders` · `order_milestones` · `order_size_breakdown` | `superadmin` `md` |
| `material_requests` | `superadmin` `md` `kho` `khotruong` `ketoanvattu` |
| `change_requests` · `risk_assessments` | `superadmin` `md` `giamdoc` |
| `sample_submissions` | `superadmin` `md` `qa` |

**T3 · Dữ liệu chủ & cộng tác (11 bảng)** — `SELECT`: mọi vai nội bộ

| Bảng | `INSERT` · `UPDATE` |
|---|---|
| `seasons` · `customers` · `customer_contacts` · `styles` · `style_colorways` · `style_sizes` · `style_operations` · `ta_templates` · `ta_template_items` | `superadmin` `md` |
| `md_documents` · `md_comments` | mọi vai nội bộ — **cố ý**: cộng tác đa bộ phận |

### 5.2 🔴 Bốn chỗ mã ứng dụng sẽ GÃY nếu thu hồi `DELETE` toàn bộ

`[VERIFIED]` — còn **4 lời gọi `.delete()` sống** trong mã ứng dụng:

| `tệp:dòng` | Bảng | Tính chất |
|---|---|---|
| `app/(dashboard)/md/_actions/commercial.actions.ts:270` | `costing_items` | xoá **dòng chi tiết** của chiết tính nháp. Bảng **không có `deleted_at`**, là con `ON DELETE CASCADE` của `costings` |
| `app/(dashboard)/md/_actions/po.actions.ts:161` | `order_size_breakdown` | **xoá-rồi-chèn-lại** — thay cả tập, có chụp ảnh trước |
| `app/(dashboard)/md/_actions/collaboration.actions.ts:60` | `md_documents` | xoá tài liệu đính kèm |
| `app/(dashboard)/md/_actions/style.actions.ts:211` | `style_*` *(tên bảng động)* | xoá dòng con của style |

Bốn chỗ này **đang chạy** và arch test cho qua vì luật `.delete()` dùng **ngưỡng
bằng hiện trạng** (`tests/architecture/arch.test.mjs:66`), không phải cấm tuyệt
đối. Thu hồi `DELETE` trên toàn bộ 22 bảng sẽ làm **bốn chức năng đang dùng được
gãy tại chỗ**, với lỗi `42501` mà người dùng không hiểu.

⇒ **Không** thu hồi `DELETE` toàn bộ trong lượt này. Xem §6.2.

### 5.3 Tác động lên mã ứng dụng khi thu hẹp POLICY

Toàn bộ 4 bảng T1 chỉ được đọc/ghi từ `app/(dashboard)/md/` — không phân hệ nào
khác chạm tới. Ba tầng phòng thủ đã chặn sẵn ở tầng trên: `MODULE_ACCESS` trong
`lib/rbac.ts` không cho `kho`/`qa`/`totruongmay` vào `/md`, và `guard.ts` của
phân hệ chặn lần nữa ở mỗi Server Action.

⇒ Thu hẹp policy T1 **hợp thức hoá ở tầng CSDL một ranh giới mà giao diện đã
tôn trọng sẵn**. Rủi ro gãy chức năng: **thấp**.

⚠️ **Một ngoại lệ phải xác minh trước khi chạy:** `style_bom` xuất hiện trong
`022_po_material_readiness.sql`. Nếu kho hoặc kế toán vật tư cần đọc định mức để
cấp phát nguyên phụ liệu, T1 sẽ **chặn nhầm** một quy trình thật. Ghi thành
`VR-004` ở §9.2 — **phải trả lời trước khi viết `042`**.

### 5.4 Tác động lên hiệu năng

`mos_current_role()` là `STABLE` và không truy vấn bảng ⇒ PostgreSQL đánh giá
**một lần cho mỗi câu lệnh**, không phải mỗi dòng. Chi phí gần bằng
`authenticated_only` hiện tại. `npm run bench` chạy trước và sau để có số thật —
đây là phép **đo**, không phải phép kiểm.

### 5.5 Không tác động

- ⛔ Không tạo bảng · không đổi cột · không đổi kiểu dữ liệu
- ⛔ Không đụng `buyer_denied` · `subcon_denied` · 6 bảng của chuỗi `031`
- ⛔ Không đổi Business Rule · không đổi vòng đời chứng từ
- ⛔ Không đụng `service_role` — ba đường hợp lệ giữ nguyên (`029b:61`)

---

## 6. Migration Strategy

### 6.1 `042_narrow_md_grants.sql` — hai lớp, một tệp

**Lớp A · Privilege**

```
REVOKE TRUNCATE, TRIGGER, REFERENCES  →  22 bảng, vai authenticated + anon
REVOKE DELETE                         →  16 bảng  (22 trừ 6 ở §6.2)
```

**Lớp B · Policy** — với mỗi bảng: `DROP POLICY "authenticated_only"` rồi tạo
cặp policy tách bạch, thay vì một policy `FOR ALL`:

```sql
CREATE POLICY "<bảng>_read"  ON public.<bảng> FOR SELECT TO authenticated
  USING (public.mos_current_role() = ANY (ARRAY[...]));
CREATE POLICY "<bảng>_write" ON public.<bảng> FOR INSERT TO authenticated
  WITH CHECK (public.mos_current_role() = ANY (ARRAY[...]));
CREATE POLICY "<bảng>_edit"  ON public.<bảng> FOR UPDATE TO authenticated
  USING (...) WITH CHECK (...);
```

Tách `FOR SELECT` / `FOR INSERT` / `FOR UPDATE` thay vì `FOR ALL` là **có chủ ý**:
`FOR ALL` khiến "đọc được" và "sửa được" dính làm một, và đó chính là cách
`authenticated_only` biến một quyết định thành bốn quyền.

### 6.2 Sáu bảng GIỮ `DELETE` — có thời hạn

`costing_items` · `order_size_breakdown` · `md_documents` · `style_colorways` ·
`style_sizes` · `style_operations`

Giữ vì §5.2: thu hồi ngay sẽ làm gãy mã đang chạy. **`TRUNCATE` vẫn thu hồi** —
không lời gọi hợp lệ nào cần nó.

Đây là **nợ có thời hạn**, không phải miễn trừ vĩnh viễn ⇒ `TD-25` §9.3.

### 6.3 Trình tự

| # | Bước | Ai | Điều kiện |
|---|---|---|---|
| 1 | Trả lời `VR-004` — kho có cần đọc `style_bom` không | Board / Joseph | — |
| 2 | Phản biện độc lập, lập `docs/review/ADR-018-review.md` | ChatGPT | ADR-011 §2.2 |
| 3 | Board phê duyệt ADR-018 | Board | ② |
| 4 | Cắt vòng khoá SECURITY FREEZE — **Cổng B `B2`** | Board | — |
| 5 | Viết `042` | CSA | ③ + ④ |
| 6 | Chạy `042` trên SQL Editor, chép khối kiểm tra về | Board | ⑤ |
| 7 | Bài kiểm nội bộ chuyển xanh phần `[F-2]`; `A001` + `A002` chạy lại | CSA xác minh | ⑥ |
| 8 | Cập nhật `RLS_COVERAGE_MATRIX.md` | CSA | ⑦ |

⚠️ Bước ④ là **điều kiện cứng**. Hiến pháp XI.1 đang đóng băng; ADR này thay đổi
mô hình phân quyền nên **không** thuộc phần *"vá lỗ hổng đã đo"* mà CLAUDE.md
§2.2 cho phép làm trong lúc đóng băng — khác `041`.

### 6.4 Không kết luận trên bảng rỗng

22 bảng đang 0 dòng. Sau khi `042` chạy, phần `SELECT` của bài kiểm vẫn ghi
`⚪ chưa đo được` cho tới Cổng C. **Không được ghi `✅`** — Điều V.1. Phần quyền
`DELETE`/`TRUNCATE` thì đo được ngay vì nó không cần dòng nào.

---

## 7. Rollback Strategy

### 7.1 Hoàn tác hoàn toàn

```sql
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[/* 22 bảng */] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_read"  ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_write" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_edit"  ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "authenticated_only" ON public.%I '
      'FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) '
      'WITH CHECK (auth.uid() IS NOT NULL)', t);
    EXECUTE format('GRANT ALL ON public.%I TO authenticated', t);
  END LOOP;
END $$;
```

### 7.2 Đặc tính rollback

| Tiêu chí | Đánh giá |
|---|---|
| **Mất dữ liệu** | **Không.** Không dòng nào bị đụng — chỉ đổi quyền và policy |
| **Thời gian** | Tức thời, một khối `DO $$` |
| **Cửa một chiều** | **Không có.** Khác hẳn migration đổi lược đồ |
| **Rủi ro khi hoàn tác** | Đưa hệ thống về đúng trạng thái `F-2` đang vi phạm. Chỉ làm khi có quyết định Board bằng văn bản |

### 7.3 Hoàn tác từng phần — cách nên dùng

Nếu chỉ một bảng chặn nhầm, **không** hoàn tác cả migration. Cấp thêm đúng vai
thiếu cho đúng bảng đó:

```sql
DROP POLICY "<bảng>_read" ON public.<bảng>;
CREATE POLICY "<bảng>_read" ON public.<bảng> FOR SELECT TO authenticated
  USING (public.mos_current_role() = ANY (ARRAY[... , '<vai bổ sung>']));
```

Cách này giữ nguyên phần đã siết đúng. Mỗi lần dùng phải ghi vào
`RLS_COVERAGE_MATRIX.md` kèm lý do — nếu không, ba tháng sau không ai biết vì
sao một bảng lại rộng hơn cùng tầng.

---

## 8. Alternatives Considered

| Phương án | Vì sao không chọn |
|---|---|
| **A · Chỉ `REVOKE`, giữ nguyên policy** | Đóng `R-4` `R-5` `R-6` nhưng để nguyên `R-1` `R-2` `R-3`. Thủ kho vẫn đọc và **sửa** được biên lợi nhuận. Vá phần dễ, bỏ phần đắt |
| **B · Chỉ thu hẹp policy, giữ `GRANT ALL`** | Policy **không** áp cho `TRUNCATE`. `R-5` sống nguyên — một lệnh sạch cả bảng, không dấu vết |
| **C · Chuyển thẳng sang phân quyền theo Assignment** | Đòi khái niệm *phân công merchandiser* chưa tồn tại ⇒ mở rộng phạm vi, trái Board Directive mục 4. Và nó chặn `F-2` lại sau một thiết kế nhiều tháng, trong khi `F-2` đang mở |
| **D · Bảng ánh xạ vai→bảng→quyền trong CSDL** | Policy sẽ phải `SELECT` bảng ánh xạ đó ⇒ rơi thẳng vào bẫy **K-3**: subquery trong policy vẫn chịu RLS dưới quyền người gọi. Đây là lỗi đã trả giá một lần ở `031c` |
| **E · Không làm gì, chờ Cổng C** | Cổng C **nạp ~700 bản ghi vào đúng trạng thái mở này**. Sửa sau còn phải trả lời "ai đã đọc gì" — câu hỏi không trả lời được |

---

## 9. Recommendation

### 9.1 Đề xuất

**Phê duyệt ADR-018** và cho viết `042` theo §6, với **hai điều kiện tiên quyết**:

1. `VR-004` được trả lời *(kho có cần đọc `style_bom` không)* — §5.3
2. Board cắt vòng khoá SECURITY FREEZE — Cổng B `B2`

### 9.2 Câu hỏi phải trả lời trước khi viết `042`

| Mã | Câu hỏi | Ai | Vì sao chặn |
|---|---|---|---|
| **`VR-004`** | Vai `kho` · `khotruong` · `thukho` · `ketoanvattu` có cần đọc `style_bom` để cấp phát nguyên phụ liệu không? | Joseph | Sai một chiều nào cũng hỏng: cấm nhầm thì chặn quy trình thật; cho nhầm thì rò định mức |
| **`VR-005`** | Vai `ketoan` có cần đọc `costings` không, hay chỉ cần giá đã duyệt? | Joseph | Quyết định `ketoan` nằm ở T1 hay ngoài T1 |

> ⚠️ **Vì sao đánh số từ `VR-004`.** Bản nháp đầu của ADR này dùng `VR-002` và
> `VR-003` — nhưng `BUSINESS_KNOWLEDGE_BASE.md:464-465` *(bậc 0′, **ADOPTED**)*
> đã dùng hai số đó cho hai rủi ro khác. **Số của văn bản bậc cao hơn giữ
> nguyên; số của tôi dời xuống.** Đây là lần thứ hai xảy ra va chạm kiểu này —
> lần đầu là `BDR-14`/`BDR-15`, ghi ở `PROJECT_MEMORY.md` §6.1.

### 9.3 Nợ kiến trúc phát sinh

| Mã | Nội dung |
|---|---|
| **`TD-25`** | Sáu bảng ở §6.2 còn giữ `DELETE`. Phải chuyển 4 lời gọi ở §5.2 sang xoá mềm hoặc RPC, rồi thu hồi nốt. Cần bổ sung `deleted_at` cho `costing_items` — **đổi lược đồ ⇒ ADR riêng** |
| **`TD-26`** | Phân quyền nội bộ theo **vai**, chưa theo **Assignment** (§4.3). Điều XXX chưa thi hành đủ cho nội bộ |
| **`TD-27`** | Luật `.delete()` của arch test dùng **ngưỡng bằng hiện trạng** (`arch.test.mjs:66`) nên không chặn lời gọi mới, chỉ chặn lời gọi thứ 5 trở đi. Nên đổi sang danh sách miễn trừ tường minh theo `tệp:dòng` |
| **`TD-28`** | `CLAUDE.md` §2.2 trích `SECURITY FREEZE` là *"Hiến pháp XI.1"* trong khi điều đó nằm ở `MONICA_CONSTITUTION.md` **bậc 4**. Trái quy tắc trích dẫn của chính CLAUDE.md §0 |
| **`TD-29`** | `BUSINESS_KNOWLEDGE_BASE.md:463` *(bậc 0′, **ADOPTED**)* còn chứa phát biểu `VR-001` đã bị bác bỏ. Đã gắn đính chính tại chỗ; bản BKB kế tiếp phải viết lại dòng đó |
| **`TD-32`** | 🟠 **Người lập chiết tính cũng là người duyệt.** `giamdoc` không có `/md` trong `MODULE_ACCESS` (`lib/rbac.ts:76`) và không có quyền ghi `costings` trong `042` ⇒ `md` tự duyệt chiết tính của chính mình. Trái **Board Working Principle v2.0** *("costing chỉ được duyệt bởi giám đốc sản xuất")* và tinh thần `SOD-H*`. **Không phải hồi quy do `042`** — trước đó mọi vai đều duyệt được, tệ hơn — nhưng `042` đóng băng nó vào tầng CSDL. Sửa = **thay đổi mô hình phân quyền** ⇒ ADR riêng + phản biện riêng. Nguồn: [`ADR-018-review.md`](../review/ADR-018-review.md) §B-2 |
| **`TD-31`** | `VR-004` cấm *"export, copy"* nhưng tầng **Data Egress Control** (EDD-04F `E1` `E6` · `P-ATTRIB`) **chưa dựng**. `042` chỉ thi hành được *"chỉ đọc"*. Watermark · nhật ký tải · audit trail nằm ở **Cổng D** |
| **`TD-30`** | 🔴 **Sổ nợ kỹ thuật đã vỡ thành ba nơi đánh số độc lập.** `TECHNICAL_DEBT.md` *(sổ chính)* dừng ở `TD-13`; `ADR-010` cấp `TD-13` `TD-14` với **nghĩa khác**; `ADR-011` cấp `TD-15`; `EDD-06` §9.2 cấp `TD-16`…`TD-24`. ⇒ **`TD-13` đang mang hai nghĩa**, và `TD-14`…`TD-24` chưa bao giờ vào sổ chính |

> ### 🔴 `TD-30` — vì sao khoản nợ này nguy hiểm hơn vẻ ngoài của nó
>
> Bản nháp đầu của ADR này cấp `TD-18`…`TD-22` cho năm khoản nợ mới. **Cả năm số
> đều đã bị chiếm** bởi `EDD-06` §9.2 — văn bản **bậc 2′ đã được Board phê
> duyệt**. Tôi phát hiện ra chỉ vì tình cờ tra ngược sổ nợ trước khi commit.
>
> Đây là **lần thứ ba** một va chạm số hiệu xảy ra trong dự án:
>
> | Lần | Va chạm | Cách xử |
> |---|---|---|
> | 1 | `BDR-14` · `BDR-15` — Board và tôi cùng cấp | Số Board giữ; số tôi dời thành `BDR-18` `BDR-19` |
> | 2 | `VR-002` · `VR-003` — BKB bậc 0′ và tôi cùng cấp | Số BKB giữ; số tôi dời thành `VR-004` `VR-005` *(§9.2)* |
> | 3 | `TD-18`…`TD-22` — EDD-06 bậc 2′ và tôi cùng cấp | Số EDD giữ; số tôi dời thành `TD-25`…`TD-29` |
>
> Ba lần, cùng một nguyên nhân: **không có sổ cấp số tập trung cho `TD`, `VR`,
> `BDR`.** Quy tắc thứ bậc ở CLAUDE.md §0 giải quyết được *xung đột nội dung*,
> nhưng không giải quyết *xung đột số hiệu* — hai văn bản khác bậc vẫn cấp trùng
> số vì không bên nào nhìn thấy bên kia.
>
> Lần thứ tư sẽ xảy ra, và có thể sẽ không được phát hiện trước khi commit.
> **Đề nghị Board cho lập sổ cấp số tập trung** — một tệp, mỗi mã một dòng, cấp
> số trước khi dùng. Không thuộc phạm vi ADR này; nêu để Board quyết riêng.

### 9.5 Quan hệ với `TD-16` của EDD-06

`EDD-06` §9.2 ghi `TD-16` = *"8 bảng MD ⛔ không có policy thu hẹp"*, xếp Sprint
**I-1**. Phát biểu đó mang **cùng lỗi** với Audit Report §M2 đã đính chính: tám
bảng ấy **có** policy — chúng chạy bằng `authenticated_only`, và người ngoài đã
bị `buyer_denied`/`subcon_denied` chặn.

⇒ **ADR này thay thế nội dung `TD-16`**, không phải thực hiện nó. Vấn đề thật
không phải *"thiếu policy"* mà là *"policy không phân biệt vai nội bộ"*, và phạm
vi không phải 8 bảng mà là **23**.

### 9.4 Chỗ tôi có thể sai — ADR-011 §2.3 mục 4

1. **Phân tầng T1/T2/T3 là suy luận của tôi từ tên bảng và mã ứng dụng, không
   phải từ phỏng vấn nghiệp vụ.** `VR-004` và `VR-005` là hai chỗ tôi biết mình
   không chắc; có thể còn chỗ tôi chưa biết là mình không chắc.
2. **Tôi chưa đo quyền ĐỌC theo vai** — 22 bảng rỗng. Toàn bộ phần `SELECT` của
   `R-1` `R-2` là **suy luận từ biểu thức policy**, không phải phép đo. Điều V.1
   áp cho tôi trước tiên.
3. **`style.actions.ts:211` dùng tên bảng động**, tôi suy ra tập bảng bị ảnh
   hưởng từ ngữ cảnh chứ chưa liệt kê hết mọi giá trị chạy qua đó.
4. **`ketoan` có thể cần rộng hơn T1 cho phép.** Ranh giới giữa kế toán quản trị
   và dữ liệu thương mại tôi chưa xác minh với người làm việc thật.
5. **Tôi chưa chạy `npm run bench`** trước/sau. Nhận định "chi phí gần bằng hiện
   tại" ở §5.4 là lý thuyết về `STABLE`, chưa có số.

---

## 10. Decision

### 10.1 Phán quyết Board — 05/08/2026

| Trường | Giá trị |
|---|---|
| **Phán quyết** | ✅ **PHÊ DUYỆT VỀ NGUYÊN TẮC** — *"Tiếp tục chuẩn bị Migration 042 theo đúng Architecture Freeze"* |
| **Ràng buộc kèm theo** | *"Không mở rộng phạm vi, không thay đổi Business Capability, Domain hoặc Architecture"* |
| **SECURITY FREEZE** | 🔴 **GIỮ NGUYÊN** — Board không cắt `B2` |
| **Ngày phản biện độc lập** | ⏳ **chưa thực hiện** — vẫn bắt buộc trước Sprint I-2 |
| **Ý kiến 🔴 còn treo** | *(chưa mở hồ sơ phản biện)* |

**`VR-004` — trả lời:**

> *"Warehouse được phép READ ONLY đối với Style BOM để phục vụ cấp phát nguyên
> phụ liệu. Không được sửa, export, copy hoặc truy cập các thông tin tài chính."*

⇒ Thi hành ở §5.1 *(4 vai kho có `SELECT` trên `style_bom`)* và §5.1.2. **Một
phần không thi hành được ở `042`** — *không export, không copy* cần tầng Data
Egress Control chưa dựng ⇒ `TD-31`.

**`VR-005` — trả lời:**

> *"Accounting được phép xem Approved Cost, Contribution Margin, Full Cost và giá
> đã được phê duyệt. Không được truy cập Cost Breakdown, Draft Costing, AI
> Simulation hoặc dữ liệu thương lượng."*

⇒ Thi hành ở §5.1.1. **Phán quyết này hẹp hơn bản nháp đầu của tôi** *(tôi cho
`ketoan` đọc cả 4 bảng T1)* và **là phân quyền theo CỘT**, nên nó buộc ADR phải
thêm một **phép chiếu** `v_costing_approved`.

### 10.2 ⚠️ Điểm phải trình lại Board trước khi chạy `042`

Board dặn *"không mở rộng phạm vi"*. Tôi đang thêm **một view mới** — cần nói rõ
để Board xác nhận đây không phải điều Board cấm:

| Câu hỏi | Trả lời của tôi |
|---|---|
| View mới có phải Business Capability mới không? | **Không.** Nó không tạo năng lực nghiệp vụ nào; nó là **lối đọc hẹp hơn** thay cho lối đọc rộng đang có |
| Có đụng Domain hay Architecture Baseline không? | **Không.** Không Domain mới, không bảng mới, không cột mới, không đụng 149 Decision Log |
| Vậy vì sao vẫn phải thêm? | Vì `VR-005` là phân quyền **theo cột**, mà RLS **chỉ lọc dòng**. Không có phép chiếu thì chỉ còn hai lựa chọn: cho `ketoan` thấy cả `target_price` *(trái phán quyết Board)*, hoặc cấm `ketoan` sạch `costings` *(cũng trái phán quyết Board)* |
| Rủi ro của nó | View mặc định **vượt mặt RLS**. Bù bằng ba nghĩa vụ ở §5.1.1, trong đó `A001` là bài kiểm bắt buộc |

🔴 **Nếu Board không muốn thêm view**, phương án thay thế duy nhất là **hoãn
phần `ketoan`**: `042` cấm `ketoan` toàn bộ T1, và `VR-005` để lại Sprint sau.
An toàn hơn, nhưng kế toán mất đường đọc giá đã duyệt. **Tôi cần Board chọn.**

> ✅ **Board đã chọn phương án A** — `042` chạy 05/08/2026 và phép chiếu
> `v_costing_approved` đã dựng trên CSDL thật. Câu hỏi ở §10.2 khép lại.

### 10.3 ✅ Kết quả chạy thật — 05/08/2026

`042` đã chạy trên CSDL đang chạy. Khối kiểm tra và bài kiểm phiên-đăng-nhập-thật
cho cùng một kết luận: **migration làm đúng thiết kế.**

| Phép đo | Trước `042` | Sau `042` | Kỳ vọng |
|---|---|---|---|
| Bài kiểm nội bộ | `0 đạt · 24 hỏng` | **`16 đạt · 8 hỏng`** → **`18 đạt · 6 hỏng`** *(sau `041`)* | — |
| Bảng còn `authenticated_only` | 22 | **0** | 0 ✅ |
| Bảng còn hở `TRUNCATE` | 22 | **0** | 0 ✅ |
| Bảng còn hở `DELETE` | 22 | **6** | 6 ✅ *(`TD-25`)* |
| `buyer_denied` · `subcon_denied` | nguyên | **nguyên** | không được đụng ✅ |
| `v_costing_approved` | — | **đã dựng** | 1 ✅ |
| Hàm dựng `mos_narrow_md_table` | — | **đã dọn** | 0 ✅ |

**8 mục còn hỏng — không mục nào ngoài dự tính:**

| Mục | Bảng | Vì sao |
|---|---|---|
| 6 × `[F-2]` | `costing_items` · `order_size_breakdown` · `md_documents` · `style_colorways` · `style_sizes` · `style_operations` | **6 ngoại lệ có chủ ý** của §6.2 — `TD-25`. Đúng thiết kế, không phải lỗi |
| ~~2 × `[F-1]`~~ | ~~`activity_log`~~ | ✅ **ĐÃ ĐÓNG** — `041` chạy 05/08/2026, đo lại còn `18 đạt · 6 hỏng` |

⇒ **Không còn mục hỏng nào ngoài 6 ngoại lệ đã ghi thành `TD-25`.** Mọi thứ
`042` đặt ra làm được đều đã làm được.

#### 10.3.1 ⚠️ Một dòng trong khối kiểm tra của `042` SAI — lỗi của tôi

Dòng `⭐ Policy _read mới (phải đủ 22)` trả **`33`**. Không phải hệ thống sai —
**phép đo sai**:

```sql
-- SAI: đếm mọi policy `*_read` của TOÀN schema
WHERE schemaname='public' AND policyname LIKE '%\_read'
```

Nó đếm cả `communications_read` (`019`) · `defect_catalog_read` (`023`) ·
`p031b_line_scoped_read` · `p031c_vendor_scoped_read` · `p031c3_so_scoped_read`
… — những policy `042` **không đụng tới**. Thiếu bộ lọc theo bảng.

**Truy vấn đúng** *(nên chạy để đóng phép đo này)*:

```sql
SELECT COUNT(*) AS policy_read_cua_042      -- kỳ vọng: 22
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%\_read'
  AND tablename IN (
    'costings','costing_items','inquiries','style_bom',
    'production_orders','material_requests','order_milestones',
    'change_requests','risk_assessments','sample_submissions',
    'order_size_breakdown','seasons','customers','customer_contacts',
    'styles','style_colorways','style_sizes','style_operations',
    'ta_templates','ta_template_items','md_documents','md_comments');
```

⚠️ Dù vậy, con số `33` **không để lại nghi ngờ nào về `042`**: dòng
*"Bảng CÒN policy `authenticated_only` = 0"* và bài kiểm 16/16 đã chứng minh
đúng điều cần chứng minh — bằng hai phép đo độc lập.

#### 10.3.2 🔴 Nghĩa vụ ② chưa hoàn thành

`SECURITY_DEFINER_REGISTRY.md` §2.4 buộc **chạy lại `A001`** ngay sau `042`, vì
`v_costing_approved` là view đầu tiên **không** `security_invoker` — nó phá bất
biến *"11/11 view invoker"* mà `A001` bản 2 đo được. **Chưa chạy.**

---

## 11. References

- [`docs/audit/VR-001-KET-QUA.md`](../audit/VR-001-KET-QUA.md) — phát hiện `F-2`, bằng chứng `[VERIFIED]`
- [`tests/security/md-internal-scope.test.mjs`](../../tests/security/md-internal-scope.test.mjs) — bài kiểm, hiện đỏ có chủ ý
- `supabase/migrations/014_md_tables.sql:120` · `015_md_order_lifecycle.sql:504` — vòng lặp `authenticated_only`
- `supabase/migrations/018_mos_foundation.sql:307` — `buyer_denied` *(không đụng tới)*
- `supabase/migrations/025_subcon_lockdown.sql:111` — `subcon_denied` *(không đụng tới)*
- `supabase/migrations/019_communications.sql:34` — `mos_current_role()`
- `supabase/migrations/029b_revoke_hard_delete.sql` — tiền lệ hai tầng Privilege/Policy
- `supabase/migrations/041_activity_log_immutable.sql` — vá `F-1`, cùng gốc phát hiện
- [ADR-011](ADR-011-tham-quyen-kien-truc.md) §2.2 · §2.3 — phản biện bắt buộc, bốn mục hồ sơ
- [`docs/ARCHITECTURE_BASELINE.md`](../ARCHITECTURE_BASELINE.md) §3.1 — Cổng B `B2`
- Playbook **Điều XXX** — phân quyền theo Assignment
- EDD-04B — `SOD-H01`…`SOD-H09`
- Hiến pháp **Điều 4** · **Điều 8** · **XI.1** · **§37.5**
- Board Directive 04/08/2026 mục 2 — chín mục bắt buộc của ADR này
