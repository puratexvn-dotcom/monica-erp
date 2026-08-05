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
| [TD-07](#td-07) | 106 tệp `.tsx` còn màu viết thẳng, chưa qua thẻ màu | 🟡 | mở | ADR-009 §4 |
| [TD-08](#td-08) | Không có phép kiểm chặn màu viết thẳng — Điều 44.6 chưa có răng | 🟢 | **đã trả** | ADR-009 §4 |
| [TD-09](#td-09) | 3 tệp Recharts chưa dùng `CHART_PALETTE` | 🟡 | mở | ADR-009 §4 |
| [TD-10](#td-10) | Hệ thẻ chữ — GĐ1 xong, GĐ2 chờ tệp phông, GĐ3 chờ nền móng | 🟡 | **GĐ1 đã trả** | Quyết nghị Board 03/08/2026 |
| [TD-11](#td-11) | Chưa có hệ biểu tượng — cỡ và độ dày nét đặt tuỳ chỗ | 🟡 | mở | Quyết nghị Board 03/08/2026 |
| [TD-12](#td-12) | Chưa có hệ chuyển động — thời lượng và đường cong tuỳ chỗ | 🟡 | mở | Quyết nghị Board 03/08/2026 |
| [TD-13](#td-13) | i18n — chuỗi viết thẳng còn ở phần lớn màn hình | 🟡 | mở | Chỉ thị i18n 03/08/2026 |
| [TD-34](#td-34) | `cut-ticket-basket.tsx` tự tính chỉ số — **ngoại lệ CÓ CHỦ Ý** của phép kiểm ⑭ | 🟡 | mở | Board Decision `Đ-3` · 05/08/2026 |
| [TD-35](#td-35) | ~~`deleteStyleChild` còn chào lối xoá `style_bom`~~ | 🟢 | ✅ **ĐÃ TRẢ 05/08** | Board `Đ-3′` · lối ① |

### 🔴 SỔ NÀY KHÔNG CÒN ĐẦY ĐỦ — `TD-30`

`[VERIFIED]` 05/08/2026. Sổ nợ đã **vỡ thành ba nơi đánh số độc lập**, và
`TD-13` đang mang **hai nghĩa khác nhau**:

| Nơi cấp số | Dải | Có trong sổ này? |
|---|---|---|
| **`TECHNICAL_DEBT.md`** *(sổ chính)* | `TD-01`…`TD-13` | ✅ |
| [`adr/ADR-010`](adr/ADR-010-thu-bac-van-ban-chuan-tac.md) §175 | `TD-13` *(ba chuỗi ADR song song — **trùng nghĩa**)* · `TD-14` | ⛔ |
| [`adr/ADR-011`](adr/ADR-011-tham-quyen-kien-truc.md) §4.3 | `TD-15` *(đã trả — `docs/review/`)* | ⛔ |
| [`enterprise-design/EDD-06`](enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) §9.2 | `TD-16`…`TD-24` | ⛔ |
| [`adr/ADR-018`](adr/ADR-018-thu-hep-authenticated-only.md) §9.3 | `TD-25`…`TD-30` | ⛔ |

⚠️ **Trước khi cấp một số `TD` mới, phải tra cả năm nơi trên.** Bản nháp đầu của
ADR-018 cấp `TD-18`…`TD-22` và **cả năm số đều đã bị EDD-06 chiếm** — phát hiện
được chỉ nhờ tra ngược trước lúc commit.

⇒ Cần một đợt gộp về sổ này kèm bảng ánh xạ, **và** một sổ cấp số tập trung cho
`TD` · `VR` · `BDR`. Đề nghị đã nêu ở ADR-018 §9.3 `TD-30`; **Board quyết riêng**,
không thuộc phạm vi ADR-018.

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

<a id="td-07"></a>
## TD-07 · 106 TỆP CÒN MÀU VIẾT THẲNG

| | |
|---|---|
| **Mức** | 🟡 mở — lệch Hiến pháp, chưa gây sự cố |
| **Phát hiện** | ADR-009 §1.2 |
| **Nơi** | 106 tệp `.tsx` trong `app/` và `components/` |
| **Vi phạm** | Hiến pháp **§44.6** *(Design Tokens)* |

### Nội dung

Điều 44.6 đòi mọi màu phải lấy từ hệ thẻ màu. Hiện đã chuyển: trang chủ
(`app/page.tsx`, `app/home-modules.ts`, `app/_home/app-card.tsx`) và thanh đầu
trang nội bộ (`components/dashboard-topbar.tsx` — điểm đòn bẩy lớn nhất, vì nó
cấp danh tính màu cho **mọi** màn hình bên trong cùng lúc).

Phần còn lại — bảng, biểu mẫu, hộp thoại, Kanban, dòng thời gian của 12 phân hệ —
vẫn viết màu thẳng tại chỗ.

### Vì sao chưa trả hết

Chuyển 106 tệp trong một lượt là thay đổi diện rộng **không có phép kiểm nào
bảo vệ**: mỗi tệp chạm vào là một cơ hội đổi nhầm sắc mà build vẫn xanh. Thứ tự
đúng là **dựng phép kiểm trước** (TD-08), rồi chuyển từng phân hệ một, mỗi phân
hệ một commit, có chỗ để soi lại.

### Cách trả

Chuyển theo phân hệ, ưu tiên nơi người dùng nhìn nhiều nhất: `/md` → `/kho` →
`/qa` → `/to-truong-may` → phần còn lại.

---

<a id="td-08"></a>
## TD-08 · KHÔNG CÓ PHÉP KIỂM CHẶN MÀU VIẾT THẲNG

| | |
|---|---|
| **Mức** | 🟢 **đã trả** — 03/08/2026 |
| **Phát hiện** | ADR-009 §4 |
| **Đã trả ở** | [`tests/architecture/arch.test.mjs`](../tests/architecture/arch.test.mjs) mục ⑨ · [`color-debt-baseline.json`](../tests/architecture/color-debt-baseline.json) |
| **Vi phạm** | Hiến pháp **§44.6 · §44.8** |

### ✅ ĐÃ TRẢ — cách thi hành

Mục ⑨ của bài kiểm kiến trúc quét `app/` và `components/`, chặn mọi lớp màu định
danh viết thẳng. Chạy **không cần CSDL**, nên nó nằm ở tầng `kiem-tra-tinh` của CI
và gác mọi push.

**Cơ chế bánh cóc, không phải cổng chặn.** 108 tệp đang nợ được đóng băng vào
`color-debt-baseline.json`. Tệp MỚI vi phạm ⇒ HỎNG. Danh sách chỉ được ngắn đi —
đó chính là TD-07 tự thu hẹp.

**Đã chứng minh phép kiểm có răng thật**, không phải chỉ chạy xanh: gieo thử
`bg-emerald-200` vào một tệp sạch ⇒ bài kiểm HỎNG và gọi đúng tên tệp; hoàn nguyên
⇒ xanh lại. Một phép kiểm chưa bao giờ thấy đỏ là một phép kiểm chưa được chứng
minh.

### ⚠️ Hai quyết định thiết kế của phép kiểm, ghi lại để khỏi tranh cãi sau

**① Phải bỏ chú thích trước khi quét.** `app/home-modules.ts` có dòng chú thích
giải thích chính quy tắc này *("không viết thẳng `bg-blue-50`")*. Quét cả chú
thích thì tệp **sạch nhất** lại bị báo vi phạm — phép kiểm trừng phạt đúng người
đã ghi lại quy tắc. Lỗi này đã bắt được lúc dựng: bỏ chú thích làm số vi phạm từ
109 xuống 108.

**② Sắc trung tính KHÔNG bị chặn** — `slate` `gray` `zinc` `neutral` `white`
`black`. Chúng là màu khung nền dùng khắp nơi, không phải màu định danh. Chặn cả
chúng sẽ khiến quy tắc **không thể tuân thủ**, và quy tắc không thể tuân thủ thì
người ta tắt nó đi. ⚠️ Đánh đổi đã biết: `slate` vừa là màu khung vừa là màu định
danh của Business Reporting, nên vi phạm bằng `slate` sẽ **lọt lưới**. Chấp nhận
có ý thức — bắt hụt một sắc còn hơn có một phép kiểm bị vô hiệu hoá.

### Nội dung

Không có phép kiểm nào chặn một lớp màu viết thẳng lọt vào màn hình nghiệp vụ.
Điều 44.6 hiện chỉ được giữ bằng **kỷ luật con người** — mà kỷ luật con người
chính là thứ đã sinh ra 106 tệp của TD-07.

### Vì sao đây là khoản đáng trả trước

Cùng một họ bài học với **TD-03**: thứ để lỗi sống sót không phải sự bất cẩn, mà
là **thiếu một phép thử chứng minh quy tắc đang được tuân thủ**. Ban hành Điều 44
mà không dựng phép kiểm thì sáu tháng nữa sẽ có TD-07 thứ hai, chỉ khác tên.

### Cách trả

Một mục trong `arch.test.mjs` quét `app/**` và `components/**` tìm lớp màu
Tailwind viết thẳng *(`bg-|text-|ring-|border-` + tên sắc + bậc số)*, cho phép
danh sách miễn trừ hẹp: `lib/design/tokens.ts`, các sắc trung tính
`slate|white|black|transparent`, và những tệp đã ghi nhận trong TD-07 cho tới khi
chúng được chuyển xong.

⚠️ Phép kiểm phải chạy **không cần CSDL**, để nó nằm ở tầng `kiem-tra-tinh` của CI.

### Vì sao chưa trả

Board đã chỉ thị hoãn việc mở rộng bài kiểm kiến trúc cho tới sau bàn giao khách
hàng. Ghi nhận ở đây để không rơi mất.

---

<a id="td-09"></a>
## TD-09 · BIỂU ĐỒ CHƯA DÙNG BẢNG MÀU HIẾN ĐỊNH

| | |
|---|---|
| **Mức** | 🟡 mở |
| **Phát hiện** | ADR-009 §1.2 |
| **Nơi** | 3 tệp dùng `recharts` |
| **Vi phạm** | Hiến pháp **§44.5** *(Chart Palette)* |

### Nội dung

Điều 44.5 cấm bảng màu mặc định của thư viện và màu tuỳ tiện. `CHART_PALETTE` và
`chartColor()` đã có trong thẻ màu nhưng ba tệp biểu đồ chưa gọi tới.

### Cách trả

Thay mọi mã màu trong `<Bar>`, `<Line>`, `<Cell>`, `<Pie>` bằng `chartColor(i)`,
hoặc bằng `MODULE_IDENTITY[key].chart` khi biểu đồ thuộc về một phân hệ cụ thể —
biểu đồ của Production phải cùng sắc với thẻ của Production.

---

<a id="td-10"></a>
## TD-10 · ENTERPRISE TYPOGRAPHY TOKEN SYSTEM

| | |
|---|---|
| **Mức** | 🟡 **Giai đoạn 1 đã trả** — 03/08/2026 |
| **Phát hiện** | Quyết nghị Architecture Board, 03/08/2026 |
| **Nơi** | toàn bộ `app/` và `components/` |
| **Đã trả ở** | [`lib/design/typography.ts`](../lib/design/typography.ts) · [Đặc tả chữ](design/TYPOGRAPHY_SPECIFICATION.md) · `arch.test.mjs` mục ⑩ |
| **Liên quan** | [TD-07](#td-07) *(màu viết thẳng)* · [TD-08](#td-08) *(phép kiểm màu)* |

### ✅ GIAI ĐOẠN 1 ĐÃ TRẢ

| Việc | Kết quả |
|---|---|
| Hệ thẻ chữ | 8 nhóm: họ chữ · độ đậm · cỡ · giãn dòng · giãn chữ · chữ số · thang đáp ứng · khả năng tiếp cận |
| Thẻ vai trò | 16 thẻ `TYPE.*` — cửa vào duy nhất của mã ứng dụng |
| Thang cỡ | **10 bậc** thay cho 12 cỡ tuỳ ý + 11 bậc Tailwind chạy song song |
| Độ đậm | **4 bậc** thay cho 9 |
| Đặc tả | [`docs/design/TYPOGRAPHY_SPECIFICATION.md`](design/TYPOGRAPHY_SPECIFICATION.md) |
| Cưỡng chế | `arch.test.mjs` mục ⑩ — bánh cóc, 115 tệp đóng băng |

**Đã chứng minh phép kiểm có răng:** tệp mới chứa `text-2xl font-black
bg-emerald-200` làm **cả** mục ⑨ lẫn ⑩ HỎNG, gọi đúng tên tệp; xoá tệp ⇒ xanh lại.

**Cỡ đã loại bỏ khỏi thang:** `9` `9,5` `10` `10,5` `12,5` `15` `17` `26` `38` px.
Riêng `9px` và `9,5px` bị loại vì lý do khả năng tiếp cận, không phải vì thẩm mỹ.

### Nội dung

`ADR-009` đã dựng hệ thẻ **MÀU**. Chưa có hệ thẻ **CHỮ**. Chữ hiện được đặt cỡ
tại chỗ, mỗi màn hình một kiểu.

### Bằng chứng đo được

| Phép đo | Kết quả |
|---|---|
| Lần dùng cỡ chữ tuỳ ý `text-[..px]` | **298** |
| Số cỡ tuỳ ý khác nhau | **12** — `9px` `9.5px` `10px` `10.5px` `11px` `12px` `12.5px` `13px` `15px` `17px` `26px` `38px` |
| Bậc chữ Tailwind cũng đang dùng song song | **11** bậc |
| Biến thể `tracking-[...]` tuỳ ý | **7** |
| Khai báo `font-family` / `next/font` | **2** — hệ thống chưa nạp một bộ chữ nào của riêng mình |

Tức là **hai hệ đo song song** — bậc Tailwind và pixel tuỳ ý — cùng tồn tại, và
`12,5px` với `13px` nằm cạnh nhau trên cùng một thẻ mà không ai giải thích được
vì sao phải khác nhau nửa pixel.

### Vì sao nó nặng hơn nó trông

**Thang chữ là thứ dựng nên thứ bậc.** Màu nói *"cái này thuộc về đâu"*; chữ nói
*"cái nào quan trọng hơn cái nào"*. Có thẻ màu mà không có thẻ chữ thì mới xong
một nửa việc: mỗi màn hình vẫn tự chế thứ bậc riêng, và người dùng phải học lại
cách đọc ở từng phân hệ.

Thêm nữa, bộ chữ hiện là **ngăn xếp mặc định của hệ điều hành**. Cùng một trang
hiển thị bằng ba bộ chữ khác nhau trên Windows, macOS và Android — mọi giá trị
`tracking` và cỡ chữ đã cân ở đây chỉ đúng với **một** trong ba.

### Cách trả

1. `lib/design/typography.ts` — một thang chữ hữu hạn, đặt tên theo VAI TRÒ chứ
   không theo cỡ: `display` · `title` · `subtitle` · `body` · `label` · `caption`
   · `metric`. Mỗi vai trò gói sẵn cỡ + độ đậm + giãn dòng + giãn chữ.
2. **Bộ chữ đã được Board chốt ngày 03/08/2026: `Inter Variable`, tự lưu trữ qua
   `next/font/local`.**

   ⚠️ **Đang bị chặn — thiếu tệp phông.** Bản đang chạy nạp `Inter` qua
   `next/font/google` *(xem `app/layout.tsx:2`)*, tức **bộ chữ đã đúng**, chỉ chưa
   **tự lưu trữ**. `next/font/local` bắt buộc phải có tệp `.woff2` nằm trong kho
   mã; kho hiện **không có tệp phông nào** — `public/` chỉ chứa `MONICA.png`.

   Tôi **không tự tải tệp nhị phân về kho**. Cần một người đặt
   `InterVariable.woff2` *(và bản `Italic` nếu muốn)* vào `public/fonts/` hoặc
   `app/fonts/`; sau đó phần mã đổi sang `next/font/local` chỉ là vài dòng.

   **Vì sao tự lưu trữ mà không dùng `next/font/google`:** `next/font/google` tải
   phông lúc **build**, tức bản dựng phụ thuộc vào một máy chủ ngoài. Máy chủ đó
   hỏng hoặc bị chặn ở mạng nhà máy thì bản dựng hỏng theo. Tự lưu trữ cắt hẳn
   phụ thuộc đó.
3. Chuyển dần, cùng nhịp với TD-07, sau khi phép kiểm của TD-08 đã dựng.

### Vì sao chưa trả

Board chỉ thị **dừng làm lại giao diện theo từng trang**; mốc tiếp theo là hoàn
thiện Design System. TD-10 nằm ĐÚNG trong mốc đó, nên nó phải được làm **cùng**
hệ thẻ chữ chứ không phải rải rác từng màn hình như trước.

---

<a id="td-11"></a>
## TD-11 · ENTERPRISE ICONOGRAPHY SYSTEM

| | |
|---|---|
| **Mức** | 🟡 mở |
| **Phát hiện** | Quyết nghị Architecture Board, 03/08/2026 |
| **Nơi** | 105 tệp dùng `lucide-react` |
| **Vi phạm** | Hiến pháp **§44.1** *(nhận diện nhất quán)* — chưa có điều khoản riêng |

### Bằng chứng đo được

| Phép đo | Kết quả |
|---|---|
| Tệp dùng `lucide-react` | **105** |
| Cỡ icon khác nhau | **22** biến thể |
| Độ dày nét khác nhau | **8** — `1` `1.25` `1.5` `1.6` `1.8` `1.9` `2` `2.5` |

### Vì sao nó là nợ

Độ dày nét là thứ mắt đọc ra "cùng một bộ" hay "nhặt từ nhiều nơi". Tám độ dày
trên cùng một sản phẩm khiến biểu tượng trông như lấy từ ba thư viện khác nhau,
kể cả khi tất cả đều từ `lucide`.

Cỡ cũng vậy: 22 biến thể nghĩa là không có thang cỡ. Icon 18px cạnh icon 20px
trong cùng một hàng đọc ra là lệch, không đọc ra là chủ ý.

### Cách trả

`lib/design/icons.ts` — thang cỡ hữu hạn theo VAI TRÒ *(`nav` · `action` ·
`inline` · `feature` · `hero`)*, mỗi vai trò chốt cứng cỡ **và** độ dày. Chuyển
dần theo cùng nhịp TD-07.

⚠️ Cần chốt **một** độ dày chuẩn cho toàn hệ thống, ngoại lệ phải có lý do viết ra.

---

<a id="td-12"></a>
## TD-12 · ENTERPRISE MOTION SYSTEM

| | |
|---|---|
| **Mức** | 🟡 mở |
| **Phát hiện** | Quyết nghị Architecture Board, 03/08/2026 |
| **Nơi** | toàn bộ `app/` và `components/` |
| **Vi phạm** | Hiến pháp **§44.1** — chưa có điều khoản riêng |

### Bằng chứng đo được

| Phép đo | Kết quả |
|---|---|
| Thời lượng khác nhau | **4** — `75ms` `200ms` `300ms` `700ms` |
| Đường cong | **1** — chỉ `ease-out`, phần còn lại dùng mặc định của trình duyệt |
| Hoạt ảnh dựng sẵn | `animate-in` · `animate-ping` · `animate-pulse` · `animate-spin` |

### Vì sao nó là nợ

Chuyển động chưa loạn như màu và chữ, nhưng nó **chưa có ngữ nghĩa**. Hiện thời
lượng được chọn theo cảm giác từng chỗ, không theo loại hành vi.

Một hệ chuyển động doanh nghiệp cần gắn thời lượng với Ý NGHĨA:
phản hồi tức thì *(~75ms)* · chuyển trạng thái *(~200ms)* · phần tử vào/ra
*(~300ms)* · chuyển cảnh lớn *(~500ms)*. Thiếu ánh xạ đó thì mỗi màn hình lại
dạy người dùng một nhịp khác nhau.

⚠️ Phải kèm `prefers-reduced-motion`: hiện **không có** khai báo nào tôn trọng
thiết lập giảm chuyển động của hệ điều hành. Đây là vấn đề **khả năng tiếp cận**,
không phải vấn đề thẩm mỹ — người bị rối loạn tiền đình có thể chóng mặt thật.

### Cách trả

`lib/design/motion.ts` — thời lượng và đường cong đặt tên theo vai trò, kèm biến
thể tôn trọng `prefers-reduced-motion`.

---

<a id="td-13"></a>
## TD-13 · i18n — CHUỖI VIẾT THẲNG CÒN Ở PHẦN LỚN MÀN HÌNH

| | |
|---|---|
| **Mức** | 🟡 mở — **kiến trúc đã xong, phủ sóng chưa xong** |
| **Phát hiện** | Chỉ thị Enterprise Internationalization, 03/08/2026 |
| **Vi phạm** | Hiến pháp **§45.4 · §45.5** |

### Đã xong

| Việc | Trạng thái |
|---|---|
| Nguồn dịch chính thức `messages/{vi,en,zh}.json` | ✅ 124 khoá × 3 ngôn ngữ |
| Runtime: `t()` có tham số thay thế, locale, định dạng ngày/số/tiền/phần trăm | ✅ |
| Từ vựng hiến định (`lib/constitutional-terms.ts`) | ✅ 29 từ |
| Cưỡng chế: bài kiểm mục ⑪ — khoá khớp nhau, không rỗng, từ hiến định không bị dịch | ✅ |
| Trang chủ + thẻ Business App | ✅ đã localize |

### Chưa xong

Phần lớn màn hình nội bộ vẫn viết chuỗi thẳng trong JSX. Ngoài ra còn **hai từ
điển cũ** — `MD_DICT` và `WAREHOUSE_DICT`, tổng **1.756 dòng** — đang được 28 tệp
gọi tới.

⚠️ Hai từ điển đó **cố ý chưa gỡ**. Xoá ngay là làm gãy 28 màn hình trong một
lần sửa, đúng lúc Board vừa cấm làm lại giao diện theo từng trang. Chúng được
trộn vào như **lớp tương thích**, và khoá của `messages/*.json` đứng sau nên
**thắng** khi trùng tên — nguồn hiến định luôn thắng nguồn cũ.

### Vì sao chưa trả hết

Cùng lý do với TD-07: chuyển hàng trăm chuỗi trong một lượt là thay đổi diện
rộng **không có phép kiểm nào bảo vệ từng chuỗi một**. Bài kiểm mục ⑪ bảo vệ
được *bộ khoá*, nhưng chưa bảo vệ được *chuỗi viết thẳng trong JSX* — thứ đó cần
một bánh cóc riêng, cùng họ với mục ⑨ và ⑩.

### Cách trả

1. Dựng bánh cóc thứ ba: quét chuỗi chữ cái trong JSX của `app/` và
   `components/`, đóng băng hiện trạng, chặn tệp mới.
2. Chuyển theo phân hệ, gộp dần `MD_DICT` và `WAREHOUSE_DICT` vào
   `messages/*.json`, mỗi phân hệ một commit.

⚠️ Bánh cóc chuỗi JSX **khó hơn** hai cái trước: phải phân biệt được chữ hiển
thị với tên lớp CSS, khoá đối tượng, đường dẫn và mã kỹ thuật. Làm ẩu sẽ ra một
phép kiểm đầy báo động giả — mà phép kiểm báo động giả thì người ta tắt đi.

---

<a id="td-34"></a>
## TD-34 · `cut-ticket-basket.tsx` — NGOẠI LỆ CÓ CHỦ Ý CỦA PHÉP KIỂM ⑭

| | |
|---|---|
| **Mức** | 🟡 mở — **ngoại lệ đã đăng ký**, ⛔ không phải chỗ quên |
| **Thẩm quyền** | **Board Decision `Đ-3`** — 05/08/2026 |
| **Phát hiện** | Spike [`B2-2a`](planning/SPIKE-B2-2a-REPORT.md) §2.2 |
| **Nơi** | [`components/warehouse/allocation/cut-ticket-basket.tsx:50,55`](../components/warehouse/allocation/cut-ticket-basket.tsx) |
| **Vi phạm** | EDD-05 §1.1 **`G6`** *(Single Source of Truth)* · Hiến pháp Điều V · VII |

### Nội dung

Component tính **hai chỉ số nghiệp vụ** ngay trong tầng hiển thị:

```ts
const short = tk.neededM === null ? null : Math.max(tk.neededM - tk.matchedM, 0);   // THIẾU bao nhiêu mét
? Math.min(Math.round((tk.matchedM / tk.neededM) * 100), 100)                        // TỶ LỆ PHỦ %
```

Đúng hình dạng `G6` cấm: một màn hình **tự cộng một con số**. Nếu màn hình khác
tính *"thiếu bao nhiêu mét"* theo cách hơi khác, hai màn hình ra hai con số và
⛔ **không có gì báo** — đúng khuyết tật `TD-17` vừa xảy ra ở `po-twin`.

### 🔴 Vì sao ĐĂNG KÝ NGOẠI LỆ thay vì mở rộng phép kiểm ⑭

Spike `B2-2a` đo được: mẫu `Math.round/min/max` — mẫu duy nhất bắt được chỗ này
— có **độ chính xác 7%** *(1 trúng / 14 tệp)*. 13 tệp còn lại là **toán bố cục**:
cửa sổ cuộn · bề rộng thanh · thang biểu đồ · kẹp con trỏ bàn phím.

> **Board Decision `Đ-3`:** *"⛔ Không mở rộng Rule ⑭ chỉ vì `cut-ticket-basket.tsx`.
> Ưu tiên Precision cao, False Positive gần bằng 0. ⛔ Không làm giảm chất lượng
> của Rule ⑭."*

🔑 **Một phép kiểm hẹp mà SỐNG ĐƯỢC có giá trị hơn một phép kiểm rộng bị TẮT.**
Thêm mẫu `C` để bắt đúng tệp này ⇒ kéo độ chính xác của cả ⑭ từ **100% xuống
50%** ⇒ nó sẽ bị nới sổ nợ rồi bị gỡ trong vài tháng, và khi đó ta mất **cả 11
chỗ** ⑭ đang canh, ⛔ không phải chỉ mất một chỗ.

### Vì sao đây là NỢ chứ ⛔ không phải quyết định đóng

Ngoại lệ này **⛔ không tự hết hạn**. Nó nằm ngoài tầm phép kiểm, nên chỉ có
người đọc mã mới phát hiện được nếu nó lan rộng — đúng cơ chế đã để `TD-17` sống
sót.

### Cách trả

| # | Lối | Ghi chú |
|---|---|---|
| ① | Dời hai phép tính vào **service/calculator thuần**, component chỉ nhận số đã tính | Cùng khuôn `milestone-lateness.calculator.ts` của `TD-17` |
| ② | Sau khi ① xong, cân nhắc thêm mẫu hẹp *"chia hai biến dữ liệu rồi × 100"* vào ⑭ | ⚠️ phải **đo nhiễu trước** — spike `B2-2a` chưa đo mẫu này |

### Vì sao chưa trả

Board `Đ-3` chỉ thị **⛔ không mở rộng phạm vi Sprint I-2 Phase 2**. Dời phép
tính là **sửa mã sản phẩm** ở phân hệ Kho — ngoài Backlog đã duyệt.

### Sprint đích

**I-6** *(Object Control Tower)* — cùng lượt với việc dựng `MetricDefinition` và
read-model, vì đó là chỗ *"hai màn hình cùng đối tượng ra cùng con số"* được
giải một cách hệ thống thay vì vá từng chỗ.

---

<a id="td-35"></a>
## TD-35 · `deleteStyleChild` CÒN CHÀO LỐI XOÁ `style_bom` — QUYỀN ĐÃ BỊ THU HỒI

| | |
|---|---|
| **Mức** | 🟢 **✅ ĐÃ TRẢ 05/08/2026** — Board phê duyệt **lối ①** |
| **Phát hiện** | Sprint I-2 Phase 2 · `B2-1` — **lúc lập sổ miễn trừ xoá cứng** |
| **Đã trả** | Sprint I-2 Phase 2 · sau `B2-1` — xem §*Đã trả thế nào* cuối mục |
| **Nơi** | [`style.actions.ts:205-211`](../app/(dashboard)/md/_actions/style.actions.ts) · [`style-detail-sheet.tsx:32,97`](../components/md/style/style-detail-sheet.tsx) |
| **Vi phạm** | ⛔ Không vi phạm điều nào — đây là **hệ quả chưa được dọn** của ADR-018 |

### Nội dung

`deleteStyleChild` nhận **tên bảng động**:

```ts
table: 'style_colorways' | 'style_sizes' | 'style_operations' | 'style_bom'
const { error } = await g.supabase.from(table).delete().eq('id', id);
```

Giao diện gọi được cả **bốn**: `style-detail-sheet.tsx:32` khai
`TABLE_OF.bom = 'style_bom'`, và `:97` gọi `deleteStyleChild(TABLE_OF[sec], id)`.

**Nhưng `style_bom` ⛔ KHÔNG nằm trong 6 ngoại lệ giữ quyền `DELETE`** của
ADR-018 §6.2 — sáu bảng đó là `costing_items` · `style_colorways` ·
`style_sizes` · `style_operations` · `order_size_breakdown` · `md_documents`.

⇒ `042` **đã thu hồi** `DELETE` trên `style_bom`. Người dùng bấm *"Xoá"* ở tab
định mức nguyên phụ liệu sẽ nhận **lỗi phân quyền**, ⛔ không phải thông báo
nghiệp vụ.

### Nhãn mức độ tin cậy

| Phát biểu | Nhãn |
|---|---|
| Giao diện gọi được `deleteStyleChild('style_bom', …)` | **`[MEASURED]`** — đọc mã |
| `style_bom` ⛔ không nằm trong 6 ngoại lệ `TD-25` | **`[MEASURED]`** — ADR-018 §6.2 |
| Lời gọi đó **thất bại trên CSDL thật** | 🔴 **`[INFERRED]`** — suy từ thiết kế policy |

⚠️ **⛔ CHƯA ĐO ĐƯỢC** vì `style_bom` đang **rỗng** — `md-internal-scope` ghi
`⚪ chưa đo được · bảng rỗng · chờ Cổng C`. Đúng quy tắc `V.1`: ⛔ **không kết
luận trên bảng rỗng**.

### Vì sao nó lọt qua mọi lớp

| Lớp | Vì sao ⛔ không bắt được |
|---|---|
| TypeScript | `'style_bom'` **nằm trong** kiểu union — hợp lệ về kiểu |
| Bài kiểm phân quyền | `style_bom` rỗng ⇒ `⚪ chưa đo được` |
| Ngưỡng `.delete()` cũ | chỉ **đếm** 4, ⛔ không nhìn **bảng đích** |
| Người dùng | ⛔ chưa ai nhập định mức thật *(Cổng C chưa mở)* |

🔑 **Sổ miễn trừ mới của ⑬ là lớp đầu tiên nhìn thấy nó** — vì nó bắt khai
**bảng đích**, ⛔ không chỉ đếm lời gọi. Đây đúng giá trị mà `TD-27` hứa.

### Cách trả

| # | Lối | Đánh giá |
|---|---|---|
| ① | Bỏ `'style_bom'` khỏi union kiểu + bỏ `bom` khỏi `TABLE_OF` | ✅ rẻ · đúng hướng ADR-018 · **giao diện thôi chào một nút ⛔ không dùng được** |
| ② | Cấp lại `DELETE` cho `style_bom` | ⛔ **⛔ không** — đi ngược ADR-018 đã chạy |
| ③ | Chuyển sang xoá mềm | ✅ đúng đích, nhưng cần `deleted_at` ⇒ **ADR riêng** — gộp vào `TC-1` |

⇒ Đề nghị **①** ngay *(sửa lỗi đã đo, được phép trong freeze)*, **③** khi trả `TC-1`.

### ✅ ĐÃ TRẢ THẾ NÀO — 05/08/2026, lối ①

Board phê duyệt **lối ①** ngay sau báo cáo `B2-1`.

| Tệp | Thay đổi |
|---|---|
| `style.actions.ts:205` | `'style_bom'` **gỡ khỏi kiểu union** của tham số `table` |
| `style-detail-sheet.tsx` | 🆕 `type SectionXoaDuoc = Exclude<Section, 'bom'>` · `TABLE_OF` mất khoá `bom` · `remove()` nhận `SectionXoaDuoc` |
| `style-detail-sheet.tsx:337` | Nút `<DeleteBtn>` ở hàng định mức → **ô trống có `title` giải thích** |
| `delete-exemptions.json` | `bang` của `style.actions.ts`: **4 → 3** bảng |

🔑 **Trình biên dịch là thứ cưỡng chế, ⛔ không phải trí nhớ.** Ngay sau khi gỡ
`'style_bom'` khỏi kiểu, `tsc` báo đúng một lỗi:

```
style-detail-sheet.tsx(337,86): error TS2345:
  Argument of type '"bom"' is not assignable to parameter of type 'SectionXoaDuoc'.
```

Đó **chính là chỗ hỏng**, và nó tự lộ ra ⛔ không cần ai đi tìm. Khai
`Exclude<Section, 'bom'>` thay vì gõ tay ba khoá ⇒ **Section mới thêm về sau sẽ
⛔ không tự lọt vào danh sách xoá được** — trình biên dịch bắt phải quyết định.

**Vì sao ⛔ không để nút rồi bắt lỗi cho đẹp:** một nút bấm vào là báo lỗi phân
quyền **tệ hơn ⛔ không có nút** — nó hứa một việc hệ thống ⛔ không làm được.

**⛔ Không đụng:** kiến trúc · mô hình phân quyền · policy · migration. Đây là
**gỡ một lối gọi mà CSDL đã cấm**, ⛔ không phải đổi quyền.

### Còn lại gì

Xoá mềm cho `style_bom` vẫn là đích cuối — cần cột `deleted_at` ⇒ **ADR riêng**,
gộp vào lượt trả `TC-1`. `TD-35` đóng phần *"giao diện chào việc ⛔ không làm
được"*; nó ⛔ **không** đóng phần *"⛔ không xoá được dòng định mức sai"*.

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
- [`adr/ADR-009-enterprise-design-system.md`](adr/ADR-009-enterprise-design-system.md) — nguồn TD-07, TD-08, TD-09
- Commit `d21f0ad` — nguồn TD-01
