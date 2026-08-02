# SỔ NỢ KỸ THUẬT — MONICA MOS

> **Tài liệu sống.** Lập theo **Quy tắc 5** của Architecture Review Board,
> phán quyết ADR-008 ngày 02/08/2026.
>
> *"Ghi nhận TD-02 và TD-03 ở sổ riêng."* — Architecture Review Board

---

## 0. VÌ SAO SỔ NÀY TỒN TẠI

Trước 02/08/2026, nợ kỹ thuật của dự án được ghi **rải rác trong message commit
và trong thân ADR**. Hệ quả đo được: `TD-01` được ghi ngày 03/08 trong commit
`d21f0ad` và **không xuất hiện ở bất kỳ tài liệu nào** — muốn biết nó là gì phải
đọc lại lịch sử git.

Nợ không nằm ở một chỗ cố định thì **không ai rà được**, và cái không rà được
thì không bao giờ được trả. Sổ này là chỗ cố định đó.

### Nguyên tắc ghi

1. **Một nợ, một mã, không tái sử dụng số.** Cùng quy ước với ADR.
2. Mỗi mục phải trả lời được: **hôm nay không trả thì hỏng chuyện gì?**
   Không trả lời được thì đó không phải nợ — đó là sở thích.
3. Nợ **đã trả** không bị xoá, chỉ đổi trạng thái. Lý do một khoản nợ từng tồn
   tại vẫn là thông tin có giá trị *(cùng tinh thần Điều XXXIII với ADR)*.
4. Ghi **nơi phát hiện** bằng đường dẫn và số dòng, để người sau kiểm chứng được
   thay vì phải tin.

### Bảng trạng thái

| Ký hiệu | Nghĩa |
|---|---|
| 🔴 | đang mở · có rủi ro mất dữ liệu hoặc rủi ro bảo mật |
| 🟡 | đang mở · rủi ro vận hành hoặc bảo trì |
| 🟢 | đã trả |
| ⚪ | đã ghi nhận, **cố ý chưa xử** — kèm lý do |

---

## 1. TỔNG QUAN

| Mã | Tiêu đề | Mức | Trạng thái | Nguồn |
|---|---|---|---|---|
| [TD-01](#td-01) | `saveSizeBreakdown` — bù trừ thay cho giao dịch thật | 🔴 | mở | Enterprise Audit `d21f0ad` |
| [TD-02](#td-02) | `cut_bundles.status` — `VARCHAR` tự do cho tập hữu hạn | 🟡 | mở | ADR-008 §5.3 · Board Quy tắc 5 |
| [TD-03](#td-03) | Không có phép kiểm "vốn từ trong mã ⟷ vốn từ trong CSDL" | 🔴 | mở | ADR-008 §9.3 · Board Quy tắc 5 |
| [TD-04](#td-04) | `components/sidebar.tsx` — mười lối vào không gắn ở layout nào | 🟡 | mở | Constitutional ADR-001 §5 |
| [TD-05](#td-05) | Trang chủ hiện đủ 16 thẻ cho mọi người — §13.5 đòi lọc theo quyền | 🟡 | mở | Constitutional ADR-001 §5 |
| [TD-06](#td-06) | Nhãn 16 phân hệ chưa đi qua `lib/i18n` | 🟡 | mở | Constitutional ADR-001 §5 |

---

<a id="td-01"></a>
## TD-01 · `saveSizeBreakdown` — BÙ TRỪ THAY CHO GIAO DỊCH THẬT

| | |
|---|---|
| **Mức** | 🔴 mở — rủi ro **mất dữ liệu** |
| **Phát hiện** | Enterprise Audit, commit `d21f0ad` (P0-1) |
| **Nơi** | [`app/(dashboard)/md/_actions/po.actions.ts:127`](../app/(dashboard)/md/_actions/po.actions.ts) |
| **Vi phạm** | Hiến pháp III *(toàn vẹn dữ liệu)* |

### Nội dung

`saveSizeBreakdown` xoá **toàn bộ** bảng cỡ/màu của một đơn rồi ghi lại, bằng
**hai câu lệnh không cùng giao dịch**. Câu ghi hỏng là mất sạch, vĩnh viễn.

Bản vá hiện tại **chụp trước và khôi phục theo bản chụp** nếu câu ghi hỏng; nếu
cả hai cùng hỏng thì báo thẳng là dữ liệu đã mất thay vì im lặng.

### Vì sao vẫn là nợ

Bản vá là **phương án bù trừ, không phải giao dịch**. Nó thu hẹp cửa sổ mất dữ
liệu chứ không đóng được. Cửa sổ còn lại: tiến trình chết giữa hai câu lệnh,
mạng đứt trước khi khôi phục kịp chạy.

### Cách trả

Một **RPC `SECURITY DEFINER`** làm cả xoá lẫn ghi trong **một giao dịch** duy
nhất. Kèm sáu mục bắt buộc của
[`SECURITY_DEFINER_REGISTRY.md`](SECURITY_DEFINER_REGISTRY.md).

### Vì sao chưa trả

Cần một migration, mà bản vá lúc đó **phải có tác dụng ngay**, không chờ ai chạy
SQL. Quyết định đúng ở thời điểm đó; nay là nợ phải trả.

---

<a id="td-02"></a>
## TD-02 · `cut_bundles.status` — `VARCHAR` TỰ DO CHO TẬP HỮU HẠN

| | |
|---|---|
| **Mức** | 🟡 mở — rủi ro toàn vẹn dữ liệu, chưa gây sự cố |
| **Phát hiện** | ADR-008 §5.3, ghi nhận theo Board Quy tắc 5 |
| **Nơi** | [`supabase/migrations/005_cutting_schema.sql:73`](../supabase/migrations/005_cutting_schema.sql) |
| **Vi phạm** | Playbook **XXVIII.2** — không `VARCHAR` tự do cho tập giá trị hữu hạn |

### Nội dung

```sql
status VARCHAR(50) DEFAULT 'READY',   -- READY, ISSUED_TO_SEWING, COMPLETED
```

Tập giá trị hữu hạn và ổn định, nhưng **chỉ được ghi trong một chú thích**.
Không `CHECK`, không bảng tham chiếu. Sai chính tả lọt thẳng vào CSDL.

### Vì sao nó nặng hơn nó trông

Phán quyết ADR-008 **Quy tắc 2** vừa nâng cột này lên thành **một trong ba trục
chuẩn** của vòng đời bó bán thành phẩm. Một trục chuẩn mà không có ràng buộc là
một trục **có thể mang bất cứ giá trị nào** — đúng loại mơ hồ mà chính ADR-008
sinh ra để dẹp ở cột `current_stage`.

### Nợ tích hợp đi kèm

Tôi **không tìm thấy nơi nào trong `app/` đọc cột này**. Board đã chốt *giữ lại
và định nghĩa nó là trục tình trạng thực thi* (Quy tắc 2 + 4), nên khoảng trống
giữa "cột có ý nghĩa chuẩn" và "không mã nào dùng" là một phần của khoản nợ này.

### Cách trả

Thêm `CHECK` hoặc bảng tham chiếu cho tập giá trị, sau khi **người hiểu vận
hành** xác nhận tập đó gồm đúng những gì. Cần ADR nếu tập giá trị thay đổi so
với chú thích ở `005`.

### Vì sao chưa trả

Board chỉ thị rõ: *"Do NOT remove status in this ADR"* và *"Do not introduce
additional design changes."* Siết ràng buộc cho cột này **nằm ngoài phạm vi**
ADR-008. Phải là một quyết định riêng.

---

<a id="td-03"></a>
## TD-03 · KHÔNG CÓ PHÉP KIỂM "VỐN TỪ TRONG MÃ ⟷ VỐN TỪ TRONG CSDL"

| | |
|---|---|
| **Mức** | 🔴 mở — **đây là thứ đã để lỗi sống sót 30 migration** |
| **Phát hiện** | ADR-008 §9.3, ghi nhận theo Board Quy tắc 5 |
| **Nơi** | thiếu ở `tests/architecture/` và `supabase/audits/A002` |
| **Vi phạm** | Hiến pháp **V** *(chứng minh, không phỏng đoán)* |

### Nội dung

Không tồn tại phép kiểm nào đối chiếu **chuỗi trạng thái viết trong trigger và
mã nguồn** với **giá trị thật trong `pg_enum`**.

### Bằng chứng nó cần thiết

Ba giá trị — `OUTSIDE_PROCESSING`, `SEWING_READY`, `CUT_PASSED` — được dùng ở
**năm chỗ** kể từ migration `009`, và **không giá trị nào tồn tại**:

| Nơi | Giá trị |
|---|---|
| `009:84` | `OUTSIDE_PROCESSING` |
| `009:125` | `SEWING_READY` |
| `subcon/actions.ts:45` | `CUT_PASSED` · `SEWING_READY` |
| `subcon/actions.ts:63` | `OUTSIDE_PROCESSING` |

Lỗi sống từ `009` tới `038c` — **qua mọi vòng rà bảo mật** — và chỉ lộ ra khi có
người cố gieo một dòng thật vào.

### Vì sao đây là khoản nợ đắt nhất trong sổ

> Thứ đã để lỗi sống sót 30 migration **không phải sự bất cẩn**. `009` được viết
> bởi người đã nghĩ kỹ về luồng gia công. Thứ thiếu là **một phép thử chứng minh
> vốn từ trong mã khớp với vốn từ trong CSDL.**

Đây cùng một họ với bài học của Hiến pháp **V.3**: điều thiếu suốt bốn năm
migration không phải sự cẩn thận, mà là *"một phép thử chứng minh cửa đã đóng"*.

**Chọn xong phương án mà không dựng phép thử này thì lần sau vẫn vậy** — chỉ
khác tên enum.

### Cách trả

Một mục trong `tests/architecture/arch.test.mjs` *(hoặc `A002`)* quét mọi chuỗi
gán cho cột kiểu enum trong `supabase/migrations/**` và `app/**`, đối chiếu với
`pg_enum`. Bản chạy được không cần CSDL: đọc định nghĩa `CREATE TYPE` từ chính
tệp migration.

⚠️ Phép kiểm phải bắt được **cả hai chiều**: giá trị dùng-mà-không-có, và giá
trị có-mà-không-ai-dùng *(dấu hiệu vốn từ chết)*.

### Ưu tiên

**Làm ngay sau khi ADR-008 được thi hành**, độc lập với mọi lựa chọn kiến trúc —
nó bảo vệ mọi enum trong hệ thống, không riêng `bundle_stage_enum`.

---

<a id="td-04"></a>
## TD-04 · `components/sidebar.tsx` — MƯỜI LỐI VÀO KHÔNG GẮN Ở LAYOUT NÀO

| | |
|---|---|
| **Mức** | 🟡 mở — **mã chết đang giả dạng lối vào** |
| **Phát hiện** | Constitutional ADR-001 §2, ghi nhận theo §5 |
| **Nơi** | [`components/sidebar.tsx:23`](../components/sidebar.tsx) — `NAV_ITEMS` |
| **Vi phạm** | Playbook **XX** *(không mock, không giả)* |

### Nội dung

`Sidebar` khai mười mục điều hướng, có lọc quyền bằng `canAccess`, có trạng thái
thu gọn, có drawer cho điện thoại. Nó **không được gắn ở bất kỳ layout nào**.

Tìm toàn kho được đúng một tham chiếu, và tham chiếu đó **không dựng thanh bên**:

```
app/(dashboard)/admin/page.tsx:23    import { NAV_ITEMS } from '@/components/sidebar';
```

### Vì sao nó là nợ chứ không phải file cũ vô hại

Nó **làm sai lệch phép đếm lối vào**. Khi cân nhắc gỡ thẻ Platform Services khỏi
trang chủ, `grep '/admin'` cho ra dòng `sidebar.tsx:33` — trông như `/admin` còn
đường vào khác. Không có. Nếu tin vào dòng đó mà gỡ thẻ, Quản trị hệ thống mất
sạch đường vào phân hệ quản trị. Đây chính là bằng chứng §2 của ADR-001.

### Cách trả

Hoặc gắn `Sidebar` vào layout `(dashboard)` cho nó thành lối vào thật, hoặc tách
`NAV_ITEMS` sang một module dữ liệu thuần và đánh dấu rõ phần còn lại là chưa
gắn. **Không xoá** — Ràng buộc giao diện số 2 cấm xoá logic cũ.

### Vì sao chưa trả

Gắn thanh bên vào layout là một thay đổi kiến trúc điều hướng, chạm mọi trang
trong `(dashboard)`. Nằm ngoài phạm vi ADR-001, vốn chỉ định nghĩa lại Trang chủ.

---

<a id="td-05"></a>
## TD-05 · TRANG CHỦ HIỆN ĐỦ 16 THẺ CHO MỌI NGƯỜI

| | |
|---|---|
| **Mức** | 🟡 mở — lệch Hiến pháp, **không** phải lỗ hổng bảo mật |
| **Phát hiện** | Constitutional ADR-001 §5 |
| **Nơi** | [`app/page.tsx`](../app/page.tsx) · [`app/home-modules.ts`](../app/home-modules.ts) |
| **Vi phạm** | Hiến pháp **§13.5** *(Workspace Visibility)* |

### Nội dung

§13.5 sau sửa đổi đòi:

> The Homepage shall display only the Business Workspaces, Global Services and
> Platform Services that the authenticated user is authorized to access.

`MODULES` là hằng số tĩnh, dựng đủ 16 thẻ cho mọi phiên, kể cả phiên chưa đăng
nhập. §13.3 còn đòi lọc theo cả **Assignment** và **Operational Context** nữa.

### Vì sao đây KHÔNG phải lỗ hổng bảo mật

Ba tầng phòng thủ vẫn nguyên: `middleware.ts` chặn điều hướng theo `PROTECTED_
PREFIXES`, `_services/guard.ts` chặn từng hàm, RLS chặn ở CSDL. Bấm vào thẻ
không được phép thì bị chặn đúng như trước — **không rò dữ liệu nào**.

Cái sai là ở **trải nghiệm**: trang chủ mời người dùng bấm vào thứ chắc chắn bị
từ chối, đúng thứ CLAUDE.md §2.1 nói hai tầng đầu sinh ra để tránh.

### Cách trả

Đọc vai trò ở Server Component của `app/page.tsx` qua `supabase.auth.getUser()`
*(không phải `getSession()`)*, lọc `MODULES` theo `MODULE_ACCESS` trong
[`lib/rbac.ts`](../lib/rbac.ts) — nguồn chân lý duy nhất, không dựng bảng tra thứ hai.

Lọc theo **Assignment** phải đợi `lib/mos/permission/` nối vào tầng trang chủ.

### Vì sao chưa trả

`app/page.tsx` hiện là trang công khai không đọc phiên. Cho nó đọc phiên là đổi
mô hình nạp dữ liệu của trang chủ — cần quyết định riêng, và chạm vào SECURITY
FREEZE đang có hiệu lực.

---

<a id="td-06"></a>
## TD-06 · NHÃN 16 PHÂN HỆ CHƯA ĐI QUA `lib/i18n`

| | |
|---|---|
| **Mức** | 🟡 mở — rủi ro bảo trì |
| **Phát hiện** | Constitutional ADR-001 §5 |
| **Nơi** | [`app/home-modules.ts`](../app/home-modules.ts) — `name` · `desc` của cả 16 mục |
| **Vi phạm** | Hiến pháp **Điều IX** *(Globalization)* · CLAUDE.md §2.4 |

### Nội dung

Bộ chọn ngôn ngữ VN · EN · CN chạy đúng, nhưng tên và mô tả 16 phân hệ là chuỗi
cứng trong `home-modules.ts`. Đổi ngôn ngữ thì lưới trang chủ không đổi theo.

Cùng tình trạng: chữ trên trang đăng nhập và ba dòng giá trị cốt lõi ở cột trái.

### Vì sao chưa trả

Tên 16 phân hệ là **tên hiến định do Board chỉ định**, viết bằng tiếng Anh trong
cả ba ngôn ngữ. Dịch chúng cần Board xác nhận bản dịch chính thức cho từng thứ
tiếng — không phải việc kỹ thuật quyết được. Phần mô tả thì dịch được ngay.

---

## 2. QUY TẮC CẬP NHẬT

- Nợ mới phát hiện trong một ADR: ghi ở ADR đó *(nơi phát hiện)* **và** thêm mục
  ở đây *(nơi theo dõi)*. Hai chỗ, hai mục đích, không phải trùng lặp.
- Nợ đã trả: đổi 🔴/🟡 → 🟢, ghi commit đã trả, **không xoá mục**.
- Sổ này **không** thay thế `RLS_COVERAGE_MATRIX.md` *(độ phủ phân quyền)* hay
  `SECURITY_DEFINER_REGISTRY.md` *(sổ hàm vượt RLS)*. Ba tài liệu, ba câu hỏi
  khác nhau.

## 3. THAM CHIẾU

- [`MONICA_CONSTITUTION.md`](MONICA_CONSTITUTION.md) — Điều III · V · V.3
- [`ENGINEERING_PLAYBOOK.md`](ENGINEERING_PLAYBOOK.md) — XXVIII.2 · XXIX
- [`adr/ADR-008-bundle-stage-vocabulary.md`](adr/ADR-008-bundle-stage-vocabulary.md) — nguồn TD-02, TD-03
- [`architecture/adr/ADR-001-homepage-conceptual-model.md`](architecture/adr/ADR-001-homepage-conceptual-model.md) — nguồn TD-04, TD-05, TD-06
- Commit `d21f0ad` — nguồn TD-01
