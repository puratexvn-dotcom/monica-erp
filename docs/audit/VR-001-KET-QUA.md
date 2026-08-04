# VR-001 — Kết quả rà soát policy trên nhóm bảng Merchandising

| Trường | Giá trị |
|---|---|
| **Mã** | `VR-001` |
| **Cổng** | Gate B · mục `B1` — [`ARCHITECTURE_BASELINE.md`](../ARCHITECTURE_BASELINE.md) §3.1 |
| **Sprint** | I-1 · *An toàn* |
| **Người soạn** | Chief Solution Architect |
| **Ngày** | 04/08/2026 |
| **Nguồn bằng chứng** | ① `supabase/migrations/*.sql` ② **phiên đăng nhập thật trên CSDL đang chạy** |
| **Trạng thái** | 🔴 **`[VERIFIED]` — F-1 và F-2 XÁC NHẬN TRÊN CSDL THẬT** |

> ✅ **`VR-001` ĐÃ TRẢ LỜI XONG.** Cổng B mục `B1` khép lại.
>
> Tôi soạn tài liệu này từ mã nguồn migration, rồi chạy
> [`tests/security/md-internal-scope.test.mjs`](../../tests/security/md-internal-scope.test.mjs)
> — bài kiểm tìm thấy bí mật kết nối trong `.env.local` và **đo thẳng trên CSDL
> đang chạy bằng phiên đăng nhập vai `md`**. Kết quả ở §3.1.
>
> Vì vậy CLAUDE.md §3 (*"luôn đối chiếu với CSDL đang chạy"*) đã được thoả mãn:
> đây là **phép đo**, không phải suy luận từ tệp migration. Truy vấn ở §4 giờ là
> **phép đối chứng tuỳ chọn**, không còn là điều kiện chặn.

---

## 1. Đính chính một phát hiện sai của chính tôi

Audit Report ghi:

> *"Không tìm thấy `CREATE POLICY … ON costings` / `ON style_bom` trong 48
> migration ⇒ hai bảng chiết tính giá đang để ngỏ cho vai ngoài."*

**Phát biểu đó SAI.** Vai ngoài **không** đọc được hai bảng này.

Tôi tìm theo khuôn `CREATE POLICY ... ON <tên bảng>`, không thấy, rồi kết luận
trên chỗ không tìm thấy. Nhưng lớp bảo vệ ở đây **không** đặt theo từng bảng —
nó là hai policy `RESTRICTIVE` quét **toàn bộ** bảng trong `public`:

| Migration | Policy | Nội dung | Danh sách cho phép |
|---|---|---|---|
| `018_mos_foundation.sql:307` | `buyer_denied` | `AS RESTRICTIVE FOR ALL … USING (NOT public.mos_is_buyer())` | 15 bảng |
| `025_subcon_lockdown.sql:111` | `subcon_denied` | `AS RESTRICTIVE FOR ALL … USING (NOT public.mos_is_subcon())` | 7 bảng |

`costings`, `costing_items`, `style_bom` **không** nằm trong hai danh sách đó ⇒
cả hai policy `RESTRICTIVE` đều áp lên chúng ⇒ buyer và nhà thầu bị chặn. Migration
`018` còn ghi rõ chủ ý ngay tại chỗ (`018:266`):

> *"⚠️ CÓ CHỦ Ý: KHÔNG mở cho buyer các bảng chiết tính giá (costings,
> costing_items), định mức (style_bom)…"*

Đây đúng lỗi mà **Hiến pháp V.1** gọi tên — *không kết luận trên phép đo rỗng* —
và tôi mắc nó trong chính tài liệu đi kiểm tra người khác có mắc nó không.
Ghi nhận theo ADR-011 §2.4 mục 5 (**cấm bảo vệ cái tôi**).

### 1.1 Một giả thuyết phái sinh cũng đã bị bác bỏ

Hai vòng lặp `018`/`025` duyệt `pg_tables` **tại thời điểm migration chạy**. Bình
luận trong `018:283` khẳng định *"bảng mới thêm sau này mà quên khoanh vùng thì
mặc định là CẤM"* — điều đó **không đúng về mặt cơ chế**: vòng lặp là một **ảnh
chụp**, không phải một quy tắc thường trực. Bảng sinh sau `025` nằm ngoài cả hai.

Tôi đã liệt kê **9 bảng** sinh sau `025` và kiểm từng bảng:

| Bảng | Migration | Policy riêng | Kết luận |
|---|---|---|---|
| `partners`, `partner_accounts` | `027` | `*_internal_only` | ✅ có |
| `production_sites` | `028` | `production_sites_internal_only` | ✅ có |
| `assignments`, `assignment_bundles` | `029` | `assignment_internal_only` + `031b` | ✅ có |
| `assignment_daily_reports`, `contract_types` | `029` | `assignment_internal_only` | ✅ có |
| `assignment_commercial_terms` | `029` → `036` | `act_select_active` … | ✅ có |
| `partner_permissions` | `030` | `pp_internal_only` | ✅ có |

**Không bảng nào lọt.** Giả thuyết bị bác bỏ. Ghi lại vì phép đo âm tính vẫn là
phép đo — lần sau không phải làm lại.

---

## 2. Lỗ hổng thật — nằm ở phía NỘI BỘ, và chưa ai đo

Vòng lặp trong `014_md_tables.sql:120` và `015_md_order_lifecycle.sql:504` cấp cho
**23 bảng** đúng một policy:

```sql
CREATE POLICY "authenticated_only" ON public.<bảng>
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
GRANT ALL ON public.<bảng> TO authenticated;
```

Ba chi tiết cùng lúc:

1. **`FOR ALL`** — áp cho cả `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
2. **`GRANT ALL`** — không thu hồi hành động nào ở tầng quyền.
3. **`USING (auth.uid() IS NOT NULL)`** — điều kiện duy nhất là *"có đăng nhập"*.
   **Vai trò không xuất hiện trong biểu thức.**

Hệ quả: mọi người dùng **nội bộ** — thủ kho, tổ trưởng may, tổ trưởng hoàn thành —
có đủ bốn quyền trên **mọi dòng** của 23 bảng.

### 2.1 Hai phát hiện xếp hạng

| Mã | Phát hiện | Vi phạm | Mức |
|---|---|---|---|
| **F-1** | `activity_log` chịu `FOR ALL` + `GRANT ALL`, và **không** có trong danh sách `REVOKE` của `029b_revoke_hard_delete.sql:43`. Mọi người dùng nội bộ `UPDATE` và `DELETE` được sổ kiểm toán. | **BDR-14** (Audit Log bất biến) · quy tắc **K-1** (sổ cái chỉ-ghi-thêm) | 🔴 |
| **F-2** | 23 bảng không phân tách nội bộ. Thủ kho đọc — và sửa — được `costings`, `costing_items`, `style_bom`: cơ cấu giá thành và biên lợi nhuận toàn bộ đơn hàng. | **Playbook Điều XXX** (phân quyền theo Assignment) · nhóm `SOD-H*` (EDD-04B) · nguyên tắc đặc quyền tối thiểu | 🔴 |

**F-1 nghiêm trọng hơn F-2.** F-2 là người không phận sự nhìn thấy dữ liệu.
F-1 là người sửa dữ liệu **tự xoá được dấu vết của chính mình** — nó vô hiệu hoá
năng lực điều tra *mọi* sự cố khác, kể cả sự cố sinh ra từ F-2.

### 2.2 Một hệ quả nữa: chốt chặn xoá cứng đang đặt sai tầng

Arch test chặn `.delete()` trong **mã ứng dụng**. Nhưng bất kỳ ai có token hợp lệ
đều gọi thẳng PostgREST được, **không đi qua mã ứng dụng lần nào**. `GRANT ALL`
còn nguyên nghĩa là lệnh `DELETE` vẫn chạy được ở tầng dưới.

Chính migration `029b:34` đã viết ra lý lẽ đúng:

> *"RLS policy lọc DÒNG NÀO được chạm. `REVOKE` gỡ hẳn CẢ HÀNH ĐỘNG."*

Lý lẽ đó được áp cho 8 bảng của `027`/`028`/`029`, và **chưa bao giờ** được áp cho
23 bảng của `014`/`015`.

---

## 3. Bài kiểm đã viết — hỏng trước, xanh sau

[`tests/security/md-internal-scope.test.mjs`](../../tests/security/md-internal-scope.test.mjs)
đo cả F-1 và F-2 bằng **phiên đăng nhập thật**, và đã ghi vào `npm test`.

Hai điểm thiết kế đáng nêu:

- **Chạy được khi bảng còn rỗng.** Phép đo quyền ĐỌC cần có dòng (V.1) nên phần
  đó ghi `⚪ chưa đo được` tới khi có dữ liệu nền (Cổng C). Nhưng phép đo quyền
  GHI **không cần dòng nào**: gửi `UPDATE`/`DELETE` nhắm vào khoá không tồn tại —
  bị `REVOKE` thì Postgres ném `42501` *trước khi* tìm dòng; được phép thì lệnh
  khớp 0 dòng, **không tác dụng phụ**. Vậy F-1 và F-2 đo được **ngay hôm nay**.
- **Không mở cửa một chiều.** K-1 cấm ghi thử vào sổ cái. Bài kiểm không tạo dòng
  nào trong `activity_log`, nên không bao giờ phải xoá dòng nào ra.

Bài kiểm **phải hỏng** ở lần chạy đầu. Nó mô tả trạng thái đích, không mô tả
trạng thái hiện tại.

### 3.1 Kết quả lần chạy đầu — 04/08/2026, CSDL đang chạy

```
KIỂM PHÂN QUYỀN NỘI BỘ — authenticated_only: 0 đạt · 24 hỏng · 4 chưa đo được
```

| Phép đo | Số bảng | Kết quả |
|---|---|---|
| Vai `md` (nội bộ) gửi `DELETE` | **23/23** | ⛔ **lệnh chạy được** — không bảng nào bị `REVOKE` |
| Vai `md` gửi `UPDATE` lên `activity_log` | 1/1 | 🔴 **lệnh chạy được** — sổ kiểm toán KHÔNG bất biến |
| Đọc theo vai trên 4 bảng nhạy cảm | 4 | ⚪ **chưa đo được** — bảng rỗng, chờ Cổng C (đúng V.1) |

**F-1 và F-2 chuyển từ `[EVIDENCE]` sang `[VERIFIED]`.** Đây không còn là điều
đọc được trong tệp migration — đây là điều một tài khoản nội bộ thật vừa làm được
trên cơ sở dữ liệu thật.

Ba chú ý về cách đọc con số này:

1. **Không dòng dữ liệu nào bị đụng tới.** Mọi lệnh nhắm vào khoá không tồn tại
   nên khớp 0 dòng. `activity_log` không nhận thêm và không mất đi dòng nào.
2. **`0 đạt` là kết quả đúng.** Bài kiểm mô tả trạng thái đích; hiện chưa có
   migration nào tạo ra trạng thái đó.
3. **4 mục `⚪ chưa đo được` KHÔNG phải 4 mục đạt.** Chúng là phần F-2 về quyền
   ĐỌC, chỉ đo được khi có dữ liệu nền. Ghi rõ ở đây để không ai đọc nhầm.

---

## 4. Truy vấn đối chứng — tuỳ chọn

§3.1 đã đo bằng phiên đăng nhập thật, nên `VR-001` **không còn chặn** việc gì.
Truy vấn dưới đây chỉ để nhìn thấy nguyên nhân ở tầng lược đồ — hữu ích khi soạn
migration vá, và để Board tự mắt xác nhận thay vì tin bài kiểm của tôi:

```sql
-- VR-001 · dán nguyên khối vào Supabase SQL Editor
SELECT
  c.relname                                             AS bang,
  c.relrowsecurity                                      AS rls_bat,
  string_agg(DISTINCT p.polname, ', ' ORDER BY p.polname) AS policy,
  -- 'a' = ALL, tức FOR ALL: một policy phủ cả 4 hành động
  string_agg(DISTINCT p.polcmd::text, '')               AS hanh_dong,
  has_table_privilege('authenticated', c.oid, 'DELETE') AS authenticated_xoa_duoc,
  has_table_privilege('authenticated', c.oid, 'UPDATE') AS authenticated_sua_duoc
FROM pg_class c
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relname IN (
    'costings','costing_items','inquiries','style_bom','activity_log',
    'change_requests','risk_assessments','order_milestones',
    'production_orders','material_requests','seasons','customer_contacts',
    'styles','style_colorways','style_sizes','style_operations',
    'order_size_breakdown','ta_templates','ta_template_items',
    'sample_submissions','md_documents','md_comments','customers')
GROUP BY c.relname, c.relrowsecurity, c.oid
ORDER BY authenticated_xoa_duoc DESC, c.relname;
```

**Cách đọc kết quả — hai cột duy nhất cần nhìn:**

| Quan sát | Nghĩa |
|---|---|
| `authenticated_xoa_duoc = true` | ⛔ **F-1/F-2 xác nhận** — mọi người dùng nội bộ xoá cứng được bảng đó |
| `activity_log` có `authenticated_sua_duoc = true` | 🔴 **F-1 xác nhận** — sổ kiểm toán không bất biến |
| `policy` chỉ có `authenticated_only`, `hanh_dong = 'a'` | ⛔ **F-2 xác nhận** — không phân tách nội bộ |
| `rls_bat = false` ở bất kỳ dòng nào | 🔴 nghiêm trọng hơn mọi thứ trên đây — báo ngay |

Chép nguyên bảng kết quả về đây. Tôi **không** viết migration vá trước khi thấy
số thật: `VR-001` tồn tại đúng vì mã nguồn migration không được coi là bằng chứng
về trạng thái CSDL.

---

## 5. Chỗ tôi có thể sai

Bắt buộc theo ADR-011 §2.3 mục 4.

1. **`mos_is_external()` có thể đã phủ nhiều hơn tôi nghĩ.** Nếu hàm này trả
   `true` cho một tập vai rộng hơn buyer + subcon, một phần F-2 có thể đã được
   che. Tôi đọc định nghĩa hàm ở `025:50` nhưng chưa chạy nó.
2. **Có thể có policy tạo bằng tay** trên Supabase Dashboard, không nằm trong
   migration nào. Đây chính là lý do §4 tồn tại.
3. **`FORCE ROW LEVEL SECURITY`** được bật ở cả hai vòng lặp. Nó ảnh hưởng chủ sở
   hữu bảng, **không** ảnh hưởng `service_role` (vai này có `BYPASSRLS`). Tôi tin
   điều đó không đổi kết luận, nhưng chưa đo.
4. **Tôi chưa đo `SELECT` theo vai** vì 23 bảng đang rỗng. F-2 phần đọc hiện là
   suy luận từ biểu thức policy, **không** phải phép đo. Bài kiểm §3 sẽ đo thật
   khi có dữ liệu nền.

---

## 6. Đề xuất trình tự xử lý

Không viết SQL trước khi có ADR (Hiến pháp Điều 4 · Playbook XXXIII), và
SECURITY FREEZE vẫn ràng buộc. Trình tự đúng:

| # | Việc | Ai | Chặn bởi |
|---|---|---|---|
| ~~1~~ | ~~Chạy `VR-001`, chép kết quả về~~ | ~~Board~~ | ✅ **xong** — §3.1 |
| 2 | Soạn ADR thu hẹp `authenticated_only` *(số hiệu tiếp theo: **ADR-018** — `012`–`014` đã ghi nhận là số dành riêng, không tái sử dụng)* | CSA | — **làm được ngay** |
| 3 | Phản biện độc lập theo ADR-011 §2.2 | ChatGPT | ② |
| 4 | Board phê duyệt ADR | Board | ③ |
| 5 | Viết migration `041` | CSA | ④ + cắt băng `B2` |
| 6 | Board chạy migration; bài kiểm §3 chuyển xanh | Board chạy · CSA xác minh | ⑤ |

### 6.1 Vì sao nên tách F-1 chạy trước

Vá F-1 chỉ cần một lệnh:

```sql
REVOKE UPDATE, DELETE ON public.activity_log FROM authenticated;
```

Không tạo bảng, không tạo Domain, không đụng mô hình phân quyền, không đụng
policy nào. Nó là **vá lỗ hổng đã đo** — thuộc đúng phần CLAUDE.md §2.2 cho phép
làm **trong lúc SECURITY FREEZE còn hiệu lực**. Nó **không** cần Board cắt băng
`B2`.

F-2 thì ngược lại: thu hẹp `authenticated_only` trên 23 bảng là **thay đổi mô
hình phân quyền**, rơi thẳng vào ADR-011 §2.2 ⇒ bắt buộc ADR + phản biện độc lập,
và phải chờ `B2`.

Buộc F-1 chờ F-2 nghĩa là để sổ kiểm toán ở trạng thái sửa-được thêm nhiều tuần
nữa, trong khi cái giá để vá nó là một dòng SQL. **Đề nghị Board cho tách.**

---

## 7. References

- [`ARCHITECTURE_BASELINE.md`](../ARCHITECTURE_BASELINE.md) §3.1 — Cổng B mục `B1`
- [`MONICA_ONE_AUDIT_REPORT.md`](MONICA_ONE_AUDIT_REPORT.md) — **§ chứa phát biểu bị đính chính ở §1**
- [ADR-011](../adr/ADR-011-tham-quyen-kien-truc.md) §2.3 · §2.4 — hồ sơ phản biện · cấm bảo vệ cái tôi
- `supabase/migrations/014_md_tables.sql:120` · `015_md_order_lifecycle.sql:504` — vòng lặp `authenticated_only`
- `supabase/migrations/018_mos_foundation.sql:307` — `buyer_denied`
- `supabase/migrations/025_subcon_lockdown.sql:111` — `subcon_denied`
- `supabase/migrations/029b_revoke_hard_delete.sql:43` — danh sách `REVOKE`, **thiếu `activity_log`**
- `tests/README.md` — quy tắc **K-1** · **K-3** · **V.1**
- BDR-14 — Audit Log bất biến (Board, 04/08/2026)
