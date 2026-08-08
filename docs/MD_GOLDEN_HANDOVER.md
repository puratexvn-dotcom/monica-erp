# MD GOLDEN HANDOVER — Hồ sơ bàn giao phân hệ Merchandising

| | |
|---|---|
| **Trạng thái** | ✅ **READY FOR HANDOVER** |
| **Ngày chốt** | 08/08/2026 |
| **Phạm vi** | `/md` — Merchandiser Command Center, cùng phần trang chủ mà MD đi qua |
| **Nguồn thẩm quyền** | Board Decision *MD GOLDEN HANDOVER* 08/08/2026 |
| **Người soạn** | Chief Solution Architect |

> ⚠️ **Tài liệu này là BIÊN BẢN, ⛔ không phải quảng cáo.** Nó ghi cả thứ đã
> làm được lẫn thứ ⛔ **chưa** đo được. Mục **③** dài là **có chủ ý**: một hồ sơ
> bàn giao giấu nợ đi thì người nhận sẽ phát hiện ra nợ vào lúc tệ nhất.

---

## ① MD ĐÃ LÀM ĐƯỢC GÌ?

### 1.1 Một Merchandiser đi hết vòng đời đơn hàng **⛔ không rời màn hình**

```
Khách hàng → RFQ → Chiết tính → (Giám đốc duyệt giá) → Mã hàng → Tech Pack
→ BOM → Yêu cầu NPL → PO → Lệnh sản xuất → QA → Lô hàng → Hoàn thành
→ (Giám đốc mở lại) → Hoàn thành
```

Toàn bộ chuỗi trên **đã chạy được bằng phiên đăng nhập thật** — xem `scripts/uat-md-vong-doi.mjs`,
**72 phép thử, 0 hỏng**.

### 1.2 Hai biểu mẫu đầu vào theo chuẩn nghiệp vụ may

| | |
|---|---|
| **Order Master** *(`po-master-dialog.tsx`)* | Năm nhóm `Ⓐ Nhận diện · Ⓑ Sản phẩm · Ⓒ Thương mại · Ⓓ Sản xuất · Ⓔ Quy trình`. Chọn bản chiết tính ⇒ **tự điền đơn giá và đồng tiền**. Buyer · Brand · Điều khoản thanh toán **ĐỌC** từ hồ sơ khách; Tên sản phẩm · Nhóm hàng **ĐỌC** từ mã hàng — ⛔ không chép sang `orders` *(`P-ZERODUP`)*. |
| **Hồ sơ khách hàng B2B** *(`customer-form-dialog.tsx`)* | Năm nhóm phủ đủ sáu mục chuẩn B2B. Quy tắc tín dụng đi **CẶP**: hạn mức + số ngày cho nợ. |

### 1.3 Luật chứng từ — thi hành ở **ba tầng**, ⛔ không chỉ ở giao diện

| Điều khoản | Ứng dụng | CSDL |
|---|---|---|
| Đơn mới ⛔ **không** được ra đời ở trạng thái *Đã duyệt* | ô chọn chỉ có `Nháp · Chờ duyệt`; `createPo` **và** `createOrder` cùng từ chối | `orders.status DEFAULT 'DRAFT'` *(`054`)* |
| Khoá theo **workflow**, ⛔ không theo trạng thái đơn thuần | `lib/mos/md/document-lock.ts` | trigger `049`/`050` — PO đã sinh lệnh sản xuất thì **⛔ không sửa trực tiếp** |
| `COMPLETED` · `SHIPPED` khoá tuyệt đối | `phanQuyetSuaPo()` | engine bất biến `045`/`046` |
| Mở lại chỉ Giám đốc / Super Admin | `reopenOrder` ở `/orders` | `mutable_after_final = ['status','updated_at']` |
| ⛔ **Không xoá vật lý — chỉ lưu trữ** | `revisions.actions.ts` | `REVOKE DELETE` 6 bảng *(`051`·`052`·`053`)* — **`TD-25` ĐÓNG** |
| MD trình giá, **Giám đốc duyệt** *(SoD)* | `/giam-doc/hop-thu-duyet-gia` | policy `RESTRICTIVE` `049` — đo bằng `kiem-sod-costing.mjs` **9/0** |

🔑 **Tầng CSDL là hàng rào thật.** Hai tầng trên chỉ để giao diện ⛔ không mời
người dùng bấm vào thứ chắc chắn bị từ chối.

### 1.4 Vết và phiên bản

Mọi chứng từ **ghi nhật ký** *(`activity_log`, sổ chỉ-ghi-thêm — `041`)* và
**chụp ảnh nguyên dòng** kèm số phiên bản. Lượt **tạo** nay cũng là **phiên bản
1** — trước bản này chỉ lượt *sửa* mới đánh số, nên **giá trị lúc lập ⛔ không
được lưu ở đâu cả**.

### 1.5 Giao diện

Business Launcher 10 ô, mỗi ô một sắc định danh, có số + một dòng nói số ấy đếm
gì. Action Center 6 thẻ chính *(6 sắc riêng)* + 3 thẻ phụ. Global Search ở trang
chủ đọc thẳng **Business App Registry** — thêm module mới thì Search **tự** tìm
thấy, ⛔ không phải sửa tay.

---

## ② MD ĐÃ KIỂM THỬ NHỮNG GÌ?

### 2.1 Đo bằng **phiên đăng nhập thật**, qua **đúng endpoint trình duyệt gọi**

| Bài | Kết quả | Đo cái gì |
|---|---|---|
| `scripts/uat-md-vong-doi.mjs` | **72 đạt · 0 hỏng** | trọn vòng đời đơn hàng, 4 tài khoản `md001 · md002 · gd001 · qa001` |
| `scripts/uat-md-form-dau-vao.mjs` | **38 đạt · 0 hỏng** | Create Customer · Create PO · Workflow · Permission · Audit · Version |
| `scripts/kiem-sod-costing.mjs` | **9 đạt · 0 hỏng** | Separation of Duties ở **tầng CSDL** |
| `npm run verify` | **⛔ không bài nào hỏng** | typecheck · lint · toàn bộ bộ kiểm |
| `tests/architecture/arch.test.mjs` | **85 đạt · 0 hỏng** | 18 nhóm ràng buộc kiến trúc |

### 2.2 Đo bằng **trình duyệt thật** *(Chrome headless qua CDP, phiên `md001`)*

| Phép đo | Kết quả |
|---|---|
| **Tràn ngang** — đo bằng DOM ở `1440 · 768 · 390`, cả `/md` lẫn `/` | **0 chỗ tràn** |
| **F5 · Ctrl+F5** — so chữ ký cây DOM qua ba lượt nạp | **giống hệt** ở cả 3 khổ, cả 2 trang |
| **Tương phản WCAG AA** — chồng alpha đúng như trình duyệt | **toàn bộ dải màu MỚI đạt**; xem §3.1 |
| Ảnh chụp Desktop · Tablet · Mobile, Search mở, dropdown ngôn ngữ mở | đã chụp và **đã soi bằng mắt** |

🔑 **Vì sao phải đo trong trình duyệt:** `next build` xanh **⛔ không chứng minh
giao diện hiện ra**. Tailwind cắt mất lớp màu ghép chuỗi ⇒ màn hình ra **trắng
trơn** mà bộ dựng ⛔ không báo gì. Bốn lỗi giao diện thật của vòng này **⛔
không lỗi nào** bị `tsc`/`lint`/`build` bắt được — tất cả đều lộ ra từ **ảnh
chụp**.

### 2.3 Công cụ để lại cho người sau

| Tệp | Dùng để |
|---|---|
| `scripts/chup-man-hinh-md.mjs` | chụp mọi trang ở 3 khổ, **đo tràn ngang**, đo F5/Ctrl+F5, chụp trạng thái *đang mở* |
| `scripts/kiem-tuong-phan.mjs` | đo tương phản WCAG trên **màu đã dựng thật** |

⚠️ Cả hai ⛔ **không** thêm phụ thuộc nào — nói chuyện thẳng với Chrome đã cài
qua CDP, dùng `WebSocket` có sẵn của Node.

---

## ③ CÒN GIỚI HẠN / NỢ GÌ?

> Board đã **ghi nhận và cho phép bàn giao** với các mục dưới đây. Chúng ⛔
> **không** chặn `READY`, nhưng người nhận phải biết chúng tồn tại.

### 3.1 🟠 78 chỗ tương phản dưới WCAG AA — **nợ SẴN CÓ, ngoài dải màu mới**

Đo được: `text-slate-400` trên nền trắng cho **2.56** *(ngưỡng `4.5`)*,
`text-slate-300` cho **1.48**. Rải trong bảng biểu và vài nhãn `amber-600`.

⚠️ **⛔ Không phải màu do vòng này thêm vào** — dải màu định danh mới đã được
nâng tới đạt chuẩn *(`mo` → `-600` · `chu` → `-700` · biểu tượng sắc sáng →
`-700`)*. Board quyết **⛔ không sửa trong vòng MD Golden Release**; ghi thành
backlog riêng.

🔑 Lý do kỹ thuật đứng sau quyết định đó: quét greyscale toàn kho là **sửa hàng
loạt ⛔ không ai rà nổi**, và làm nó trong lúc chốt bàn giao là đúng cách sinh
ra một hồi quy ⛔ không ai truy được nguồn.

### 3.2 🔴 Tiếng Hàn — **⛔ CHƯA thi hành**, và đây là quyết định

`Hiến pháp Điều 45.2` khai **đúng ba** ngôn ngữ chính thức. Board giữ
[ADR-028](adr/ADR-028-ngon-ngu-chinh-thuc-thu-tu-tieng-han.md) ở trạng thái
**ĐỀ XUẤT — CHỜ BOARD**, và chỉ thị:

> *"⛔ Không thêm `ko.json`. ⛔ Không sửa Hiến pháp. ⛔ Không thêm cờ Hàn vào hệ
> thống thật."*

✅ **Đã xác nhận trong mã**: `Language = 'VN' | 'EN' | 'CN'` · `LANGUAGES` ba
mục · ⛔ không có `messages/ko.json` · ⛔ không có `FlagKR`.

⚠️ Chuỗi `'KR'` **có** xuất hiện đúng một chỗ — danh sách gợi ý **thị trường
xuất khẩu** ở form khách hàng. Đó là **thị trường**, ⛔ không phải ngôn ngữ, và
nó phải ở lại.

### 3.3 🔴 `049`–`054` **⛔ không có phản biện độc lập**

`ADR-011 §2.2` bắt buộc phản biện của bên thứ hai với mọi thay đổi chạm RLS.
Sáu migration của vòng này ⛔ không qua bước đó — ghi rõ ở
[ADR-027 §8](adr/ADR-027-luu-tru-mem-va-khoa-po-o-tang-csdl.md).

**Cái giá đã trả, đo được:** `049` khoá nhầm quyền thực thi ⇒ **mọi lệnh sửa
đơn hàng đổ `42501`**, CSDL hỏng cho tới khi `050` chạy. Khối tự kiểm trong
migration **⛔ không bắt được** vì nó chạy dưới quyền chủ sở hữu — nơi `42501`
⛔ không bao giờ xảy ra.

⇒ **Bài học đã ghi vào DNA**: tự kiểm trong migration đo được *cấu trúc*, ⛔
không đo được *phân quyền*. Phân quyền phải đo bằng **phiên đăng nhập thật**.

### 3.4 🟠 `SECURITY FREEZE` vẫn còn hiệu lực

`MOS §XI.1`. Sáu migration trên được khởi tạo **trong thời gian đóng băng**,
theo lệnh miệng của Board, ghi lại ở `ADR-027 §0`. ⛔ **Không có** ngoại lệ nào
được cấp bằng văn bản.

### 3.5 🟡 Nợ kỹ thuật còn mở, ⛔ không thuộc phạm vi vòng này

| Mã | Nội dung |
|---|---|
| `TD-13` | `MD_DICT` · `WAREHOUSE_DICT` là **lớp tương thích** cạnh `messages/*.json` |
| `TD-39` | `md-client.tsx` sát trần 900 dòng, chờ tách |
| `TD-42` | 4 bảng RBAC trong `001` được nuôi mà **⛔ không điều khiển gì** |
| `TD-GR1` · `TD-DNA1` | ⛔ chưa có phép kiểm tự động cho *bảy phần báo cáo* và *tám tầng Workspace* |

### 3.6 ⚪ Thứ **⛔ chưa đo được** — nói thẳng

- ⛔ **Chưa** thử trên **thiết bị thật**. Mọi kết luận responsive đến từ Chrome
  giả lập khổ màn hình, ⛔ không phải từ ngón tay trên kính.
- ⛔ **Chưa** thử bàn phím vật lý ngoài `Ctrl+K` · `Esc` · `↑↓` · `Enter`.
- Phép đo tương phản **⛔ không xét** chữ đè trên **dải chuyển sắc** *(tiêu đề
  trắng trên dải màu thẻ Action Center)* — phần đó chỉ soi được bằng mắt.
- Ngân sách hiệu năng `300ms` mỗi truy vấn là **tham chiếu, ⛔ chưa có cơ sở
  đo** *(`V-8`)*. Chi phí trigger `045`/`046` **chưa từng đo**.

---

## ④ MD ĐÃ ĐỦ CHUẨN LÀM **GOLDEN TEMPLATE** CHƯA?

### ✅ **RỒI — với ba điều kiện nói rõ ở §4.3.**

### 4.1 Khuôn nên nhân bản

| Khuôn | Ở đâu | Vì sao đáng chép |
|---|---|---|
| **Ba tầng phòng thủ** | `middleware` → `_services/guard.ts` → RLS | tầng dưới ⛔ không bao giờ tin tầng trên |
| **Luật thuần tách khỏi hạ tầng** | `lib/mos/md/*.ts` | ⛔ không biết Supabase/React ⇒ kiểm được ⛔ không cần CSDL, và Cổng khách hàng dùng lại đúng luật ấy |
| **Cấu trúc phân hệ** | `page.tsx` · `<module>-client.tsx` · `_services/` · `_actions/` | `service` CHỈ ĐỌC · `actions` GHI + `revalidatePath` |
| **Cập nhật một phần** | `chiGhiODaDoi()` | chỉ ghi ô ĐÃ đổi ⇒ ⛔ không đè `null` lên dữ liệu cũ |
| **Ảnh chụp phiên bản** | `writeVersion()` ở **cả lượt tạo lẫn lượt sửa** | thiếu lượt tạo thì giá trị gốc mất vĩnh viễn |
| **Lưu trữ mềm qua RPC** | `052`/`053` | PostgREST bọc `PATCH` trong CTE có `RETURNING` ⇒ policy `SELECT` áp lên **dòng MỚI** |
| **Đặt hành động ở module VAI có quyền với tới** | `reopenOrder` ở `/orders`, `duyetChietTinh` ở `/giam-doc` | ⛔ không đặt ở module **sở hữu dữ liệu** — nếu không, người có thẩm quyền ⛔ không mở nổi màn hình |
| **Bảng màu định danh** | `SAC_O` ở `components/ui.tsx` | chuỗi lớp viết **NGUYÊN** — ghép chuỗi ⇒ Tailwind cắt ⇒ giao diện trắng trơn mà build vẫn xanh |
| **Nghiệm thu thị giác** | hai script ở §2.3 | build xanh ⛔ không chứng minh giao diện hiện ra |
| **`0 ≠ NULL`** | `nonNegativeDecimal` · `credit_term_days` | `0` là *"đã quyết, bằng không"*; `NULL` là *"⛔ chưa ai quyết"* |

### 4.2 Khuôn **⛔ KHÔNG** nên chép

- **Trần 900 dòng của `md-client.tsx`** — nó là **nợ** *(`TD-39`)*, ⛔ không
  phải mẫu. Phân hệ mới nên tách từ đầu.
- **13 tab** — Board đã bác kiến trúc đó; V5 chỉ giữ Command Center + Launcher
  + Action Center.
- **`MD_DICT`** — lớp tương thích `TD-13`. Phân hệ mới dùng `messages/*.json`.

### 4.3 Ba điều kiện kèm theo

1. 🔴 **Phân hệ mới ⛔ KHÔNG được chép migration `049`–`054` mà ⛔ không có
   phản biện độc lập.** §3.3 ghi rõ cái giá.
2. 🔴 **`SECURITY FREEZE` vẫn còn** *(§3.4)* — nhân bản phân hệ mới có nghĩa là
   **mở Domain/bảng nghiệp vụ mới**, việc `MOS §XI.1` đang cấm. **Cần Board gỡ
   đóng băng bằng văn bản trước.**
3. 🟠 Chép khuôn thì **chép cả bộ kiểm**: một phân hệ mang khuôn MD mà ⛔ không
   có UAT phiên-thật của riêng nó là một phân hệ **trông giống** MD chứ ⛔
   không **đúng** như MD.

---

## FINAL STATUS

```
MD UI ................ PASS      Workflow ............. PASS
Business Launcher .... PASS      Permission ........... PASS
Action Center ........ PASS      Audit ................ PASS
Global Search ........ PASS      Version History ...... PASS
PO ................... PASS      Archive .............. PASS
Customer ............. PASS      Locking .............. PASS
Costing .............. PASS      UAT .................. PASS  (38 · 72 · 9)
Tech Pack ............ PASS      Responsive ........... PASS  (1440 · 768 · 390)
BOM .................. PASS      F5 / Ctrl+F5 ......... PASS
NPL .................. PASS      Build · Typecheck · Lint · Architecture ... PASS
```

# ✅ MD GOLDEN MODULE = READY FOR HANDOVER

⚠️ Chữ `READY` ở trên có nghĩa: **mọi điều kiện cốt lõi đã đo và đạt**. Nó ⛔
**không** có nghĩa *"⛔ không còn nợ nào"* — nợ nằm ở **§3**, đã được Board ghi
nhận, và người nhận có trách nhiệm đọc mục đó trước khi nhân bản.
