# SPRINT I-2 · PHASE 2 — BACKLOG

| Trường | Giá trị |
|---|---|
| **Sprint** | **I-2 · Lưới an toàn** — Phase 2 |
| **Tiền đề** | Phase 1 🔒 **ĐÃ KHOÁ** 05/08/2026 · commit `6ee3dd24` · `19ca85be` · `ec057bc3` |
| **Kế hoạch gốc** | [`SPRINT_I2_PHASE2_PLAN.md`](SPRINT_I2_PHASE2_PLAN.md) |
| **Trạng thái** | ⏳ **CHỜ BOARD MỞ** — ⛔ chưa viết một dòng mã nào |
| **Lập** | 2026-08-05 · Chief Solution Architect |

---

# §0 · ĐỌC BACKLOG NÀY THẾ NÀO

## 0.1 Quy ước sáu trường

| Trường | Nghĩa |
|---|---|
| **Priority** | `P0` chặn điều kiện ra · `P1` thuộc phạm vi cam kết · `P2` làm nếu còn chỗ |
| **Effort** | `S` ≤ nửa ngày · `M` ~1 ngày · `L` > 1 ngày hoặc rủi ro cao |
| **Dependency** | phải xong **trước** nó. `—` = ⛔ không phụ thuộc gì |
| **Deliverables** | tệp cụ thể, ⛔ không phải mô tả |
| **Verification** | **cách làm nó HỎNG**, ⛔ không phải cách làm nó xanh |
| **Exit Criteria** | điều kiện **đo được**, ⛔ không phải cảm nhận |

## 0.2 🔴 Hai cổng chặn TRƯỚC khi mở Phase 2

| # | Cổng | Ai | Vì sao chặn |
|---|---|---|---|
| `G-A` | 🔴 **Định nghĩa *"5 phép kiểm mới"*** — `GPR-001` `A-6` | **Board** | Cách hiểu `B` *(xanh **và** ⛔ không còn nợ)* làm **`B2-3` ⛔ không bao giờ đạt**, và I-2 ⛔ không ra được. Xem `R-1` |
| `G-B` | 🟠 **Kiểm CI Node 22** | CSA — 10 phút | Bump ở Phase 1 **chưa chạy thử**. Đỏ ⇒ `B2-5` phải đổi cách nạp `.ts` ⇒ đổi cả `B2-6` |

⚠️ **`G-B` là việc đầu tiên của Phase 2, ⛔ không phải việc song song.**

## 0.3 Bảng tổng — 8 hạng mục

| # | Hạng mục | Pri | Eff | Dep |
|---|---|---|---|---|
| `B2-0` | Kiểm CI Node 22 | **P0** | `S` | — |
| `B2-1` | ⑬ `.delete()` → danh sách miễn trừ | **P0** | `S` | `B2-0` |
| `B2-2` | ⑭ Cấm màn hình tự tính *(`G6`)* | **P0** | **`L`** | `B2-0` |
| `B2-3` | ⑮ Sổ `request_id` | **P0** | `M` | `B2-0` · **`G-A`** |
| `B2-4` | ⑯ Hồ sơ 6 cổng Screen Design Gate | **P0** | `M` | `B2-0` |
| `B2-5` | Bộ kiểm nghiệp vụ Warehouse | **P1** | **`L`** | `B2-0` |
| `B2-6` | Tách `md-client.tsx` — `TD-18` | **P1** | **`L`** | `B2-1`…`B2-5` |
| `B2-7` | Tài liệu · báo cáo · khoá Phase 2 | **P1** | `M` | tất cả |

**`B2-1`…`B2-4` là bốn phép kiểm khép `E-1` (1/5 → 5/5).** `B2-5` khép `E-2`.

---

# §1 · `B2-0` · KIỂM CI NODE 22

| | |
|---|---|
| **Priority** | 🔴 **P0** — cổng `G-B` |
| **Effort** | `S` — một lần đẩy nhánh thử |
| **Dependency** | — |

**Deliverables**
- Kết quả chạy CI thật trên Node 22 *(cả `kiem-tra-tinh` và `kiem-tra-song`)*
- Nếu đỏ: bản vá `.github/workflows/ci.yml` **hoặc** đổi cách nạp `.ts`

**Verification**
- ⛔ **Không suy diễn từ *"Next 14.2 khai hỗ trợ Node ≥ 18.17"***. `P-MEASURE`
  vế ①: **đo**, ⛔ không suy.
- Job `kiem-tra-tinh` phải **xanh**, và log phải cho thấy `Nghiệp vụ MD — công
  thức: 59 đạt`.

**Exit Criteria**
- ✅ CI xanh trên Node 22, **hoặc**
- ⛔ CI đỏ ⇒ **DỪNG Phase 2**, báo Board, xử `B2-0` trước mọi hạng mục khác.

> 🔑 Đây là hạng mục **duy nhất** có quyền dừng cả Phase 2. Đặt nó đầu tiên vì
> nếu Node 22 hỏng thì `B2-5` *(nạp `.ts`)* phải thiết kế lại từ đầu.

---

# §2 · `B2-1` · ⑬ `.delete()` → DANH SÁCH MIỄN TRỪ TƯỜNG MINH

| | |
|---|---|
| **Priority** | 🔴 **P0** — phép kiểm mới #2 |
| **Effort** | `S` — khuôn có sẵn từ ⑫ |
| **Dependency** | `B2-0` |
| **Nợ trả** | `TD-27` |

**Vấn đề đo được**: `arch.test.mjs:68` dùng `NGUONG_DELETE = 4`. Ngưỡng cho phép
**thêm** lời gọi mới miễn là **bớt** lời gọi cũ ⇒ ⛔ không phân biệt được *nợ cũ*
với *nợ mới*.

**Deliverables**
- `tests/architecture/delete-exemptions.json` — 4 vị trí đích danh, mỗi mục ghi
  `tệp` · `bảng đích` · `TD-25` · lý do
- `arch.test.mjs` mục ② đổi từ ngưỡng sang tra sổ

**Verification** — *cách làm nó hỏng*
| Tiêm | Chờ thấy |
|---|---|
| Thêm `.delete()` vào một tệp **⛔ không** có trong sổ | ⛔ **HỎNG**, chỉ nêu **đúng tệp mới** |
| Xoá một mục khỏi sổ mà lời gọi vẫn còn | ⛔ **HỎNG** |
| Đổi tên tệp trong sổ | ⛔ **HỎNG** *(mục chết)* |

**Exit Criteria**
- ⑬ chạy trong `test:arch`, **0 hỏng**
- Sổ có **đúng 4 mục**, mỗi mục có **bảng đích** và **lý do**
- Đã chứng minh **hỏng-trước, xanh-sau** — log ghi trong báo cáo
- ⛔ **Không** còn `NGUONG_DELETE` trong mã bài kiểm

⚠️ Neo theo `tệp + tên bảng`, ⛔ **không** theo số dòng — số dòng trôi khi tệp
bị sửa và sẽ sinh báo động giả *(`R-7`)*.

---

# §3 · `B2-2` · ⑭ CẤM MÀN HÌNH TỰ TÍNH — `G6`

| | |
|---|---|
| **Priority** | 🔴 **P0** — phép kiểm mới #3 |
| **Effort** | ~~`L`~~ → ✅ **`M`** — hạ sau spike `B2-2a` |
| **Dependency** | ~~`B2-0`~~ ✅ · **`B2-2a`** ✅ · 🟠 **`Đ-2` `Đ-3`** — Board duyệt thu hẹp ranh giới |
| **Nợ trả** | `M-2` · `G6` · Cổng D |

> ## 🔬 CẬP NHẬT SAU SPIKE `B2-2a` — 05/08/2026
>
> [`SPIKE-B2-2a-REPORT.md`](SPIKE-B2-2a-REPORT.md) · `[MEASURED]`
>
> 🔴 **Ranh giới §2.3 dưới đây SAI — 50% là nhiễu.** Số lượng đạt ngưỡng
> *(24 ≤ 40)*, nhưng **12/24 là dương tính giả**.
>
> | Mẫu | Bắt | Trúng | Chính xác | Phán quyết |
> |---|---|---|---|---|
> | `A` `.reduce(` | 16 | 11 | 69% | ✅ **GIỮ + thu hẹp** *(chỉ khi có cộng dồn)* ⇒ **100%** |
> | `B` `× 100` | 2 | **0** | 🔴 **0%** | 🔴 **BỎ** |
> | `C` `Math.round/min/max` | 14 | **1** | 🔴 **7%** | 🔴 **BỎ** |
>
> ⇒ **Sổ nợ dự kiến: 11 tệp · độ chính xác 100% · 0 dương tính giả.**
> ⇒ Bảng ranh giới bên dưới **giữ nguyên làm hồ sơ**, ⛔ không xoá — nhưng
> `B2-2b` thi hành theo **§2.1 của báo cáo spike**, ⛔ không theo bảng đó.

**Vì sao đắt hơn nó trông**: `TD-17` vừa là một ca thật của loại này. Nó bị bắt
vì **có người đọc mã**, ⛔ không phải vì có phép kiểm.

**Deliverables**
- `arch.test.mjs` mục ⑭
- `tests/architecture/screen-math-debt-baseline.json` — bánh cóc

**Ranh giới — hẹp có chủ ý**
| ⛔ Chặn | ✅ ⛔ Không chặn |
|---|---|
| `.reduce(` cộng dồn trên mảng dữ liệu | `.map` · `.filter` · `.length` — **render** |
| `/ 100` · `* 100` trên biến dữ liệu | hằng số bố cục · chỉ số mảng |
| `Math.round(` · `Math.min(` trên số nghiệp vụ | định dạng qua `fmtNum` · `fmtPct` |

**Verification**
| Tiêm | Chờ thấy |
|---|---|
| Thêm `.reduce((a, b) => a + b.qty, 0)` vào một component | ⛔ **HỎNG**, chỉ nêu tệp mới |
| Thêm `items.map(...)` vào cùng component | ✅ **⛔ không** hỏng — chứng minh ranh giới hẹp đúng |

🔴 **Phép đo bắt buộc TRƯỚC khi chốt**: chạy thử biểu thức, **đếm số tệp nợ**.

| Kết quả đo | Hành động |
|---|---|
| ≤ 40 tệp | ✅ chốt ranh giới, lập sổ nợ |
| > 40 tệp | 🔴 **THU HẸP ranh giới**, ⛔ **không** nới sổ nợ. Cân nhắc chỉ đo `*-client.tsx` trước, `components/` sau |

**Exit Criteria**
- ⑭ chạy, **0 hỏng**
- Sổ nợ **≤ 40 tệp**, kèm phép đo chứng minh con số đó
- Chứng minh **cả hai chiều**: `.reduce` bị bắt · `.map` ⛔ không bị bắt
- Ranh giới ghi thành **văn xuôi** trong khối ghi chú, ⛔ không chỉ là regex

> 🔑 **Quy tắc ⛔ không theo nổi thì người ta tắt nó đi** — bài học đã ghi ở
> chính mục ⑨ và ⑩. Thà chặn hẹp mà sống, còn hơn chặn rộng rồi bị gỡ.

---

# §4 · `B2-3` · ⑮ SỔ `request_id`

| | |
|---|---|
| **Priority** | 🔴 **P0** — phép kiểm mới #4 |
| **Effort** | `M` *(kỹ thuật)* · 🔴 **cao** *(quản trị)* |
| **Dependency** | `B2-0` · 🔴 **`G-A` — `GPR-001` `A-6`** |
| **Nợ trả** | `M-3` · ADR-003 |

**Hiện trạng đo được**: `029c` phủ **2/9** bảng. ADR-003 khai 7 bảng còn lại
thuộc migration **`033` — chưa viết**, và `033` nằm sau vòng khoá `B2` **chưa cắt**.

**Deliverables**
- `tests/architecture/document-tables.json` — ba ô:
  | Ô | Số dự kiến |
  |---|---|
  | `daCo` — có `request_id` + **chỉ mục duy nhất** | **2** |
  | `choMigration033` — ADR-003 đã khai · ⛔ **chỉ được ngắn đi** | **7** |
  | `mienTrong` — ⛔ không phải chứng từ lập-mới-được · **kèm lý do** | còn lại |
- `arch.test.mjs` mục ⑮

**Verification**
| Tiêm | Chờ thấy |
|---|---|
| Thêm bảng vào ô `daCo` mà migration ⛔ không có cột | ⛔ **HỎNG** |
| Thêm bảng vào `daCo` có cột nhưng **⛔ không có unique index** | ⛔ **HỎNG** — cột một mình ⛔ không chặn được gì |
| Chuyển một bảng từ `choMigration033` sang `daCo` khi chưa có `033` | ⛔ **HỎNG** |

**Exit Criteria**
- ⑮ chạy, **0 hỏng**
- Ô `choMigration033` có **đúng 7 bảng**, khớp ADR-003
- Mỗi mục `mienTrong` có **lý do**, ⛔ không có ô *"chưa biết"*
- 🔴 **`GPR-001` `C-4` được cập nhật**: ⑮ ⛔ **không trả được nợ**, nó chỉ **chặn
  nợ mới**

> 🔴 **`B2-3` ⛔ KHÔNG BAO GIỜ đạt "0 nợ" trong Phase 2.** Nếu `G-A` chốt cách
> hiểu `B` thì hạng mục này **⛔ không thể hoàn thành**, và Sprint I-2 bị chặn
> bởi một thứ nằm **ngoài** Sprint. **Đây là lý do `G-A` phải xong trước.**

---

# §5 · `B2-4` · ⑯ HỒ SƠ 6 CỔNG SCREEN DESIGN GATE

| | |
|---|---|
| **Priority** | 🔴 **P0** — phép kiểm mới #5 |
| **Effort** | `M` — phần lớn là **lập sổ**, ⛔ không phải viết mã |
| **Dependency** | `B2-0` |
| **Nguồn** | EDD-05 §1.1 |

🔴 **Giới hạn phải ghi thẳng vào tệp**: `G1`…`G5` là **câu hỏi thiết kế**, ⛔
**không** kiểm được bằng phân tích tĩnh. Một phép kiểm tự nhận *"đã kiểm 6 cổng"*
là **kiểm soát giả** — đúng thứ `G5` cấm.

⇒ ⑯ đo **thứ đo được**: mọi route trong `app/(dashboard)/` phải có mục trong sổ,
mỗi mục ghi phán quyết `G1`…`G6` kèm **ngày** và **người phán**.

**Deliverables**
- `tests/architecture/screen-gates.json`
- `arch.test.mjs` mục ⑯
- Khối ghi chú nói rõ: *"⑯ ⛔ **không** chứng minh màn hình đạt 6 cổng. Nó chứng
  minh ⛔ **không màn hình nào đi qua mà ⛔ không ai trả lời 6 câu hỏi**."*

**Verification**
| Tiêm | Chờ thấy |
|---|---|
| Tạo route giả `app/(dashboard)/thu-nghiem/page.tsx` ⛔ không có mục trong sổ | ⛔ **HỎNG** |
| Mục trong sổ thiếu **người phán** hoặc **ngày** | ⛔ **HỎNG** |
| Mục trỏ tới route ⛔ **không còn tồn tại** | ⛔ **HỎNG** *(mục chết)* |

**Exit Criteria**
- ⑯ chạy, **0 hỏng**
- **Mọi** route hiện có trong `app/(dashboard)/` có mục trong sổ
- Mỗi mục có `G1`…`G6` · **ngày** · **người phán**
- Khối ghi chú nêu rõ giới hạn `G1`–`G5`

⚠️ `R-3`: nếu mọi mục ghi *"đạt"* mà ⛔ không ai thật sự phán, sổ thành **nghi
thức rỗng**. Trường **người phán** là thứ duy nhất chống lại điều đó — ⛔ không
được để trống, ⛔ không được điền *"CSA"* hàng loạt.

---

# §6 · `B2-5` · BỘ KIỂM NGHIỆP VỤ WAREHOUSE

| | |
|---|---|
| **Priority** | **P1** — khép `E-2` |
| **Effort** | **`L`** — 921 dòng công thức, 0 bài kiểm |
| **Dependency** | `B2-0` |
| **Nợ trả** | `M-4` · `TD-22` |

**Phạm vi đo**
| Tệp | Dòng |
|---|---|
| `lib/mos/four-point.ts` | 142 |
| `lib/mos/quality.ts` | 232 |
| `lib/mos/po-health.ts` | 178 |
| `lib/mos/material-readiness.ts` | 138 |
| `lib/mos/shipment.ts` | 231 |

**Deliverables**
- `tests/business/warehouse-formulas.test.mjs`
- Đăng ký vào `tests/run.mjs` *(cùng cờ `--experimental-strip-types`)*

**Verification** — bốn phép đo **bắt buộc**
| # | Phép đo | Bắt gì |
|---|---|---|
| `W-1` | `readLegacyStatus` với **đúng 4 nhãn tiếng Việt thật** — *"Đã về kho"* · *"Thiếu hụt"* · *"Đang về"* · *"Chưa đặt"* | Lỗi này **đã từng xảy ra** *(`po-twin` so với `'READY'`)*, chỉ chưa nổ vì bảng rỗng |
| `W-2` | `scoreFourPoint` **đúng ngưỡng 20** — `19.9` đạt · `20.0` đạt · `20.1` rớt | Biên quyết định **nhận hay trả cuộn vải** |
| `W-3` | `paretoOf` khi **hai loại lỗi bằng nhau** | Thứ tự ⛔ không được phụ thuộc thứ tự đầu vào |
| `W-4` | `deriveHealth` khi **mọi đầu vào `null`** | Phải ra `null`/`UNKNOWN`, ⛔ **không** ra `0` — `0` đọc thành *"hoàn hảo"* |

Tiêm lỗi: đổi ngưỡng 4 điểm `20 → 25` ⇒ **`W-2` phải HỎNG**.

**Exit Criteria**
- Bộ kiểm chạy, **0 hỏng**, có đủ `W-1`…`W-4`
- ≥ **40 phép đo** *(MD có 59 cho 157 dòng; Warehouse 921 dòng)*
- Đã chứng minh **hỏng-trước, xanh-sau**
- 🔴 **Nếu phát hiện lỗi công thức thật** — xử theo `R-6`:
  | Loại lỗi | Xử |
  |---|---|
  | Sửa được ở **tầng mã** | ✅ sửa trong Phase 2 *(được phép trong freeze)* |
  | Cần **đổi lược đồ** | ⛔ **DỪNG**, ghi `TD`, trình Board |
  | ⛔ **Không** được | nới bài kiểm cho khớp mã sai |

---

# §7 · `B2-6` · TÁCH `md-client.tsx` — `TD-18`

| | |
|---|---|
| **Priority** | **P1** |
| **Effort** | 🔴 **`L`** — thao tác dễ gãy nhất Phase 2 |
| **Dependency** | 🔴 **`B2-1`…`B2-5` phải xong trước** |
| **Nợ trả** | `TD-18` · `KD-4` |

**Hiện trạng**: **886/900 dòng** — còn **14 dòng đệm**. 13 tab · 3 nhóm.

**Cách tách — theo trục NHÓM, ⛔ không theo trục tab**
```
md-client.tsx          state + bố cục + điều phối tab      (~300 dòng)
_tabs/thuong-mai.tsx   nhóm Thương mại
_tabs/trien-khai.tsx   nhóm Triển khai
_tabs/phoi-hop.tsx     nhóm Phối hợp
```
Tách theo tab ⇒ 13 tệp, và state chia sẻ phải xuyên **13** ranh giới. Nhóm đã là
ranh giới **có sẵn trong mã** *(`GROUPS`, `md-client.tsx:134`)*.

⚠️ **⛔ Không xoá logic cũ** — CLAUDE.md §6.2. Chỉ **dời** và **đổi đường dùng**.

**Deliverables**
- `app/(dashboard)/md/_tabs/*.tsx` · `md-client.tsx` rút gọn

**Verification**
- `typecheck` · `lint` sạch · `test:arch` mục ⑤ *(God Object)* xanh
- 🔴 **Nghi thức nghiệm thu** UI_UX_STANDARDS §8: đăng nhập **tài khoản seed
  thật**, mở **cả 13 tab**, kiểm ⛔ không lọt `undefined` · `[object Object]` ·
  `NaN` ra HTML

**Exit Criteria**
- `md-client.tsx` **< 600 dòng**, 13 tab còn **đủ và hoạt động**
- ⛔ Không tệp mới nào > 900 dòng
- 🔴 **`F-8` — nghi thức nghiệm thu ĐÃ CHẠY, bởi người có trình duyệt và mật khẩu**

> 🔴 **CSA ⛔ KHÔNG tự xác nhận được `F-8`** — ADR-011 §2.4 mục 3.
> **⛔ Không có người nghiệm thu ⇒ `B2-6` HOÃN sang Phase 3, ⛔ KHÔNG đánh dấu
> xong.** `B2-1`…`B2-5` vẫn đủ khép `E-1` và `E-2`.

⚠️ Ngưỡng `< 600 dòng` là **con số tôi đặt**, ⛔ không phải phép đo. Nếu nhóm
Thương mại một mình đã 400 dòng thì ngưỡng ép chia nhỏ hơn mức tự nhiên — và
**chia nhỏ hơn mức tự nhiên là một loại nợ khác**. Đo trước, chốt sau.

---

# §8 · `B2-7` · TÀI LIỆU · BÁO CÁO · KHOÁ PHASE 2

| | |
|---|---|
| **Priority** | **P1** |
| **Effort** | `M` |
| **Dependency** | tất cả |

**Deliverables**
| # | Tệp | Nội dung |
|---|---|---|
| `d-1` | `SPRINT_I2_PHASE2_REPORT.md` | 🆕 khuôn như Phase 1, kèm **log tiêm lỗi cả 5 phép kiểm** |
| `d-2` | `CHANGELOG.md` | mục Phase 2 · **bốn loại kết quả tách bạch** |
| `d-3` | `TECHNICAL_DEBT.md` | `TD-27` ✅ · `TD-18` ✅ *(hoặc hoãn)* · cập nhật `TD-03` |
| `d-4` | `PROJECT_MEMORY.md` | §8 `KD-4` · §12 số phép đo |
| `d-5` | `ARCHITECTURE_BASELINE.md` §0.4 | tiến độ I-2 → **5/5** |
| `d-6` | `GOVERNANCE_PENDING_REPORT.md` | 🔴 cập nhật `A-6` · `C-4` |
| `d-7` | `TECHNICAL_FOUNDATION_CERTIFICATE.md` | tu chính R2 nếu số đo đổi |

**Verification**
- `test:arch` mục ⑥ *(tài liệu bắt buộc)* xanh
- Mọi liên kết trong tài liệu mới trỏ tới tệp **có thật**

**Exit Criteria**
- 7 tài liệu cập nhật
- Báo cáo có mục **"chỗ tôi có thể sai"** — ADR-011 §2.3 mục 4
- Báo cáo tách bạch **4 loại**: đã hoàn thành · chưa nghiệm thu · technical debt
  · governance pending
- 🔒 Phase 2 khoá, commit, push

---

# §9 · ĐIỀU KIỆN HOÀN THÀNH PHASE 2

| # | Điều kiện | Đo bằng | Phụ thuộc |
|---|---|---|---|
| `F-1` | ⑬ ⑭ ⑮ ⑯ chạy trong `test:arch`, **0 hỏng** | `npm run test:arch` | `B2-1`…`B2-4` |
| `F-2` | **Cả 4 phép kiểm đã chứng minh HỎNG-TRƯỚC** | log trong báo cáo | `B2-1`…`B2-4` |
| `F-3` | Bộ kiểm Warehouse **0 hỏng**, đủ `W-1`…`W-4` | `npm test` | `B2-5` |
| `F-4` | `md-client.tsx` **< 600 dòng**, 13 tab đủ | `wc -l` + ⑤ | `B2-6` |
| `F-5` | ⛔ **Không hồi quy** — `md-internal-scope` hỏng **đúng 6** | `npm test` | tất cả |
| `F-6` | Mọi sổ nợ mới có **lý do từng mục** | đọc JSON | `B2-1`…`B2-4` |
| `F-7` | `TD-27` · `TD-18` đánh dấu **đã trả** | đọc sổ | `B2-7` |
| `F-8` | 🔴 **Nghi thức nghiệm thu 13 tab** | **người vận hành** | `B2-6` |

## 9.1 🔴 Ba mức hoàn thành — ⛔ không phải một

| Mức | Điều kiện | Ý nghĩa |
|---|---|---|
| **Tối thiểu** | `F-1` `F-2` `F-5` `F-6` | ✅ **`E-1` đạt** — `test:arch` 5/5 |
| **Cam kết** | + `F-3` `F-7` | ✅ **`E-1` và `E-2` đạt** ⇒ **Sprint I-2 ra được** |
| **Đầy đủ** | + `F-4` `F-8` | + `TD-18` trả xong |

> 🔑 **Mức "Cam kết" đủ để khép Sprint I-2.** `B2-6` là hạng mục có thể hoãn mà
> ⛔ không ảnh hưởng điều kiện ra — và nó **nên** hoãn nếu ⛔ không có người
> nghiệm thu, thay vì đánh dấu xong bằng niềm tin.

## 9.2 🔴 Sau Phase 2 vẫn CÒN NGUYÊN — ghi trước để ⛔ không ai nhầm

| # | Còn nguyên | Chặn |
|---|---|---|
| `TC-1` | 6 bảng còn `DELETE` cứng | Cổng C |
| `TC-2` | Engine mới phủ 2/88 aggregate | I-4 |
| `TC-3` | `saveSizeBreakdown` bù trừ | Cổng C |
| `TC-4` | `orders.status` ⛔ không ràng buộc `CHECK` | Cổng C |
| `TC-5` | Mã ⛔ không biểu diễn nổi lô đã huỷ | I-7 |
| `A-1`…`A-5` | 5 migration dưới ADR chưa duyệt · freeze chưa cắt | Cổng C |

> 🔴 **Phase 2 làm lưới an toàn DÀY HƠN, ⛔ không làm hệ thống ĐÚNG HƠN.**
> Xong I-2 ⛔ **không** phải là đường thông tới Cổng C. Năm Technical Condition
> và năm mục quản trị nhóm `A` đều cần **Board**, ⛔ không cần thêm mã.

---

# §10 · RỦI RO — THEO HẠNG MỤC

| # | Hạng mục | Rủi ro | KN | Giảm nhẹ |
|---|---|---|---|---|
| `R-1` | `B2-3` | 🔴 ⑮ ⛔ không trả được nợ — `033` bị chặn bởi `B2` | **gần chắc** | `G-A` chốt **trước**. ⑮ vẫn chặn nợ mới |
| `R-2` | `B2-2` | 🔴 ⑭ dương tính giả tràn lan ⇒ quy tắc bị tắt | **cao** | Đo **trước** khi chốt; > 40 tệp ⇒ **thu hẹp**, ⛔ không nới sổ |
| `R-3` | `B2-4` | 🟠 ⑯ thành nghi thức rỗng | trung bình | Bắt buộc **người phán** + **ngày** mỗi mục |
| `R-4` | `B2-6` | 🔴 Gãy giao diện mà ⛔ không ai đo được | trung bình | Tách theo **3 nhóm** ⛔ không **13 tab** · làm cuối · **sẵn sàng hoãn** |
| `R-5` | `B2-0` | 🟠 CI Node 22 đỏ | trung bình | **Kiểm đầu tiên** — có quyền dừng cả Phase 2 |
| `R-6` | `B2-5` | 🟠 Phát hiện lỗi công thức thật ⇒ phình phạm vi | **cao** | Quy ước xử **trước**: lỗi tầng mã ⇒ sửa · đổi lược đồ ⇒ **DỪNG** |
| `R-7` | `B2-1` | 🟡 Neo `tệp:dòng` trôi | cao | Khớp `tệp + bảng`, ⛔ không khớp dòng |
| `R-8` | tất cả | 🟡 `test:arch` chậm dần | thấp | Dùng lại **một** lượt `quet()` |
| `R-9` | — | 🔴 Xong I-2 vẫn ⛔ không đi tiếp được | **chắc chắn** | **Có chủ ý** — §9.2. Nhắc lại trong báo cáo |

---

# §11 · CHỖ TÔI CÓ THỂ SAI

1. **`Effort` là ước lượng, ⛔ không phải phép đo.** `B2-2` gắn `L` vì tôi ⛔
   **chưa chạy thử** biểu thức của ⑭. Nếu nó bắt 200 tệp thì thiết kế §3 sai và
   phải làm lại — khi đó ⑭ nên đo `*-client.tsx` trước, `components/` sau.
2. **Ngưỡng `< 600 dòng` ở `B2-6` là con số tôi đặt.** Đo phân bố dòng theo nhóm
   **trước** khi chốt.
3. **Tôi giả định `033` vẫn bị chặn.** Board có thể đã cắt `B2` mà tôi ⛔ chưa
   biết; khi đó `R-1` biến mất và `B2-3` trả được nợ ngay.
4. **`W-1`…`W-4` là bốn phép đo tôi chọn** vì chúng giống hình dạng lỗi đã xảy
   ra. Chúng ⛔ **không** phải bộ đủ — `paretoOf` và `summariseCapa` còn nhánh
   tôi chưa đọc hết.
5. **Thứ tự `B2-1` → `B2-4` là phán đoán.** Nếu `B2-2` sa lầy, ⛔ **không** để nó
   chặn ba mục kia — đổi thứ tự và ghi lý do, ⛔ đừng chờ.

---

## THAM CHIẾU

- [`SPRINT_I2_PHASE2_PLAN.md`](SPRINT_I2_PHASE2_PLAN.md) — kế hoạch gốc
- [`SPRINT_I2_PHASE1_REPORT.md`](SPRINT_I2_PHASE1_REPORT.md) 🔒 — dấu khoá Phase 1
- [`TFC-001`](../audit/TECHNICAL_FOUNDATION_CERTIFICATE.md) R1 §0.5 — `TC-4` · `TC-5`
- [`GPR-001`](../audit/GOVERNANCE_PENDING_REPORT.md) R1 §0.3 — `A-6` · `C-4`
- [EDD-05 §1.1](../enterprise-design/EDD-05-WORKSPACE-EXPERIENCE-MODULE.md) · [EDD-06 §7](../enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md)
- [ADR-003](../adr/ADR-003-request-id.md) · [`MUTATION_POLICY.md`](../MUTATION_POLICY.md)
- `tests/architecture/vocabulary-baseline.json` — khuôn sổ nợ

> **Trạng thái:** ⏳ **CHỜ BOARD MỞ SPRINT I-2 PHASE 2.**
> 🔴 Cần Board chốt **`G-A`** *(`GPR-001` `A-6`)* trước khi khởi động.
> ⛔ Chưa viết một dòng mã nào.
