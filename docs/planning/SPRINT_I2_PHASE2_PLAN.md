# SPRINT I-2 · PHASE 2 — KẾ HOẠCH

| Trường | Giá trị |
|---|---|
| **Sprint** | **I-2 · Lưới an toàn** — Baseline §3.2 · EDD-06 §7 |
| **Phase** | **2** — khép điều kiện ra của Sprint |
| **Tiền đề** | Phase 1 ✅ hoàn tất · commit `6ee3dd24` · `19ca85be` · đã push |
| **Thẩm quyền** | Board Decision 05/08/2026 — *chỉ Technical Blocker mới chặn Sprint* |
| **Trạng thái** | ⏳ **KẾ HOẠCH — chưa viết mã** |
| **Lập** | 2026-08-05 · Chief Solution Architect |

---

# §1 · MỤC TIÊU

## 1.1 Một câu

> **Đưa `test:arch` từ 1/5 lên 5/5 phép kiểm mới, và mở rộng bộ kiểm nghiệp vụ
> từ MD sang Warehouse — để Sprint I-2 đạt đủ điều kiện ra.**

## 1.2 Mục tiêu thật đằng sau con số

Điều kiện ra ghi *"5 phép kiểm mới"*, nhưng **con số ⛔ không phải mục tiêu**.
Mục tiêu là **bốn loại khuyết tật hiện ⛔ không có gì canh**:

| # | Loại khuyết tật | Hôm nay ai canh? | Bằng chứng nó có thật |
|---|---|---|---|
| `M-1` | **Xoá cứng mới lọt vào mã** | ngưỡng đếm `≤ 4` — ⛔ **không** chặn lời gọi mới, chỉ chặn lời gọi **thứ 5** | `TD-27` |
| `M-2` | **Màn hình TỰ TÍNH một chỉ số** | ⛔ **KHÔNG AI** | `G6` · `CF-8` · `BR-RPT-001` — và `TD-17` vừa là một ca thật |
| `M-3` | **Chứng từ lập được hai lần** | `request_id` mới phủ **2/9** bảng | ADR-003 · Playbook XXXIV |
| `M-4` | **Công thức Warehouse sai** | ⛔ **KHÔNG AI** — 921 dòng công thức thuần, 0 bài kiểm | `four-point` · `quality` · `po-health` · `material-readiness` · `shipment` |

🔑 **`M-2` là loại đắt nhất, và Phase 1 vừa cho một bằng chứng sống.** `TD-17`
đúng là hình dạng đó: hai màn hình cùng một đơn hàng, hai con số. Nó bị bắt vì
**có người đọc mã**, ⛔ không phải vì có phép kiểm. Lần sau ⛔ không chắc có ai đọc.

## 1.3 ⛔ KHÔNG phải mục tiêu Phase 2

- ⛔ **Không** trả hết nợ vốn từ *(7 chỗ lệch `VT-1`…`VT-8`)* — cần migration + ADR.
- ⛔ **Không** trả `TC-1` · `TC-2` · `TC-3` — chặn **Cổng C** và **I-4**, ⛔ không chặn I-2.
- ⛔ **Không** đụng nhóm quản trị `GPR-001` — Board xử.
- ⛔ **Không** mở Domain/Module/bảng mới — SECURITY FREEZE còn hiệu lực.

---

# §2 · PHẠM VI

## 2.1 Sáu hạng mục

| # | Hạng mục | Nợ trả | Loại | Phụ thuộc |
|---|---|---|---|---|
| `P2-1` | Phép kiểm ⑬ — `.delete()` theo **danh sách miễn trừ `tệp:dòng`** | `TD-27` | bài kiểm | ⛔ không |
| `P2-2` | Phép kiểm ⑭ — **cấm màn hình tự tính** *(`G6`)* | `M-2` · Cổng D | bài kiểm | ⛔ không |
| `P2-3` | Phép kiểm ⑮ — **sổ `request_id`** cho bảng chứng từ | ADR-003 · `M-3` | bài kiểm | ⚠️ **migration `033`** — xem `R-1` |
| `P2-4` | Phép kiểm ⑯ — **hồ sơ 6 cổng Screen Design Gate** | EDD-05 §1.1 | bài kiểm | ⛔ không |
| `P2-5` | **Bộ kiểm nghiệp vụ Warehouse** | `M-4` · `TD-22` | bài kiểm | ⛔ không |
| `P2-6` | Tách `md-client.tsx` **886/900 dòng** | `TD-18` · `KD-4` | tái cấu trúc | ⚠️ **nghiệm thu** — xem `R-4` |

## 2.2 Thứ tự thi hành — và vì sao đúng thứ tự này

```
P2-1 ─► P2-2 ─► P2-4          bài kiểm TĨNH, ⛔ không chạm mã sản phẩm
  │                            (rẻ nhất, rủi ro thấp nhất, làm trước)
  └─► P2-5                     bài kiểm nghiệp vụ, hàm thuần

P2-3                           ⚠️ làm SAU CÙNG trong nhóm bài kiểm —
                               nó sẽ đỏ và phải nằm ở sổ nợ, cần quyết định

P2-6                           ⚠️ CUỐI CÙNG — chạm màn hình đang chạy hàng ngày.
                               Làm sau khi lưới an toàn đã dựng xong, ⛔ không trước.
```

🔑 **`P2-6` cố ý xếp cuối.** Tách một tệp 886 dòng đang phục vụ 13 tab là thao
tác dễ gãy nhất Phase 2. Dựng lưới an toàn **trước**, rồi mới trèo — ⛔ không
ngược lại. Đó đúng là tên của Sprint này.

## 2.3 Chi tiết từng hạng mục

### `P2-1` · ⑬ `.delete()` — ngưỡng → danh sách tường minh

**Hiện trạng** *(`arch.test.mjs:68`)*: `NGUONG_DELETE = 4`. Ngưỡng cho phép
**thêm** lời gọi mới miễn là **bớt** lời gọi cũ — nó ⛔ không phân biệt được
*"nợ cũ"* với *"nợ mới"*.

**Đích**: sổ `delete-exemptions.json` liệt kê **đích danh 4 vị trí**:

```
app/(dashboard)/md/_actions/collaboration.actions.ts:60   md_documents
app/(dashboard)/md/_actions/commercial.actions.ts:270     costing_items
app/(dashboard)/md/_actions/po.actions.ts:161             order_size_breakdown
app/(dashboard)/md/_actions/style.actions.ts:211          style_colorways·sizes·operations
```

Mỗi mục kèm **bảng đích** và **`TD-25`**. Lời gọi ở vị trí khác ⇒ **HỎNG**, kể
cả khi tổng vẫn là 4. Khớp trực tiếp với `TC-1`: khi 4 lời gọi này được chuyển
sang xoá mềm, sổ rỗng và `TC-1` đóng.

⚠️ **Neo theo `tệp:dòng` sẽ trôi khi tệp bị sửa.** Giảm nhẹ bằng cách khớp
`tệp + tên bảng`, ⛔ không khớp số dòng — số dòng chỉ để người đọc tra.

### `P2-2` · ⑭ Cấm màn hình tự tính — `G6`

**Nguồn**: EDD-05 §1.1 `G6` *"Single Source of Truth — màn hình **TỰ TÍNH** một
chỉ số"*. Hiến pháp Điều V · VII. CLAUDE.md §2.3 *"`components/` render UI,
KHÔNG chứa business logic"*.

**Ranh giới — hẹp có chủ ý**. Chặn trong `components/` và `*-client.tsx`:

| ⛔ Chặn | ✅ ⛔ Không chặn |
|---|---|
| `.reduce(` cộng dồn trên mảng dữ liệu | `.map` · `.filter` · `.length` — đó là **render**, ⛔ không phải phép tính |
| `/ 100` · `* 100` trên biến dữ liệu *(quy phần trăm)* | hằng số bố cục · chỉ số mảng |
| `Math.round(` · `Math.min(` trên số nghiệp vụ | định dạng qua `fmtNum` · `fmtPct` |

🔑 **Chặn rộng hơn thế là quy tắc ⛔ không ai theo nổi, và quy tắc ⛔ không theo
nổi thì người ta tắt nó đi** — bài học đã ghi ở mục ⑨ và ⑩ của chính
`arch.test.mjs`.

**Cơ chế**: bánh cóc + `screen-math-debt-baseline.json`, giống ⑨ ⑩ ⑫.

### `P2-3` · ⑮ Sổ `request_id`

**Nguồn**: ADR-003 *(đã phê duyệt)* · Playbook XXXIV · CLAUDE.md §2.5.

**Hiện trạng đo được**: `029c` phủ **2** bảng *(`assignments` ·
`assignment_daily_reports`)*. ADR-003 khai **7 bảng nữa** thuộc migration `033`
— **`033` chưa viết**, và nó nằm sau vòng khoá `031`.

**Đích**: sổ `document-tables.json` khai bảng nào là *"chứng từ lập-mới-được"*.
Bảng trong sổ phải có `request_id` **+ chỉ mục duy nhất** trong migration.

| Ô | Nội dung | Số dự kiến |
|---|---|---|
| `daCo` | đã có `request_id` + unique index | **2** |
| `choMigration033` | ADR-003 đã khai, chờ `033` — **⛔ chỉ được ngắn đi** | **7** |
| `mienTrong` | ⛔ không phải chứng từ lập-mới-được — **kèm lý do** | phần còn lại |

⚠️ **Phép kiểm này ⛔ KHÔNG tự trả được nợ.** Nó **đo** và **chặn nợ mới**. Trả
nợ cần `033` ⇒ cần cắt freeze `B2` ⇒ **Board**. Xem `R-1`.

### `P2-4` · ⑯ Hồ sơ 6 cổng Screen Design Gate

**Nguồn**: EDD-05 §1.1 — *"Mọi màn hình mang hồ sơ này. **⛔ Không có hồ sơ ⇒ ⛔
không được thiết kế tiếp**."*

🔴 **Nói thẳng một giới hạn:** `G1`…`G5` là **câu hỏi thiết kế**, ⛔ **không**
kiểm được bằng phân tích tĩnh. Một phép kiểm tự nhận *"đã kiểm 6 cổng"* sẽ là
**kiểm soát giả** — đúng thứ `G5` cấm.

⇒ Phép kiểm ⑯ đo **thứ đo được**: **mọi route trong `app/(dashboard)/` phải có
mục trong sổ `screen-gates.json`**, mỗi mục ghi phán quyết `G1`…`G6` kèm **ngày
và người phán**. Route mới ⛔ không có hồ sơ ⇒ **HỎNG**.

> Nó ⛔ **không** chứng minh màn hình đạt 6 cổng. Nó chứng minh **⛔ không màn
> hình nào đi qua mà ⛔ không ai trả lời 6 câu hỏi**. Đó là thứ thật sự đo được,
> và ghi đúng như vậy trong tệp.

`G6` là ngoại lệ — nó **có** phần cơ giới hoá được, và phần đó nằm ở ⑭.

### `P2-5` · Bộ kiểm nghiệp vụ Warehouse

**921 dòng công thức thuần, 0 bài kiểm.** Cùng hình dạng với MD trước Phase 1.

| Tệp | Dòng | Đo gì |
|---|---|---|
| `lib/mos/four-point.ts` | 142 | **Hệ 4 điểm** — quy đổi m/yd/inch, `totalPointsOf`, `scoreFourPoint`, ngưỡng chấp nhận 20 điểm/100 yd² |
| `lib/mos/quality.ts` | 232 | `readAqlStatus` · `judgeAql` · `dhuOf` · **`paretoOf`** *(quy tắc 80/20)* · `capaAgeingOf` · `summariseCapa` |
| `lib/mos/po-health.ts` | 178 | 4 điểm thành phần + `deriveHealth` — **kẹp `clamp` 0…MAX** |
| `lib/mos/material-readiness.ts` | 138 | `readLegacyStatus` *(nhãn tiếng Việt dữ liệu cũ)* · `judgeLine` · `summarise` |
| `lib/mos/shipment.ts` | 231 | `SHIPMENT_FLOW` · `DELAY_LEVELS` · 7 cờ bất thường |

**Bốn phép đo bắt buộc phải có** *(⛔ không chỉ đo đường thuận)*:

| # | Phép đo | Bắt gì |
|---|---|---|
| `W-1` | `readLegacyStatus` với **đúng 4 nhãn tiếng Việt thật** — *"Đã về kho"* · *"Thiếu hụt"* · *"Đang về"* · *"Chưa đặt"* | Lỗi này **đã từng xảy ra** *(`po-twin` so với `'READY'`)* và chỉ chưa nổ vì bảng rỗng |
| `W-2` | `scoreFourPoint` ở **đúng ngưỡng 20** — 19.9 đạt · 20.0 đạt · 20.1 rớt | Biên quyết định **nhận hay trả cuộn vải** |
| `W-3` | `paretoOf` khi **hai loại lỗi bằng nhau** | Thứ tự ⛔ không được phụ thuộc thứ tự đầu vào |
| `W-4` | `deriveHealth` khi **mọi đầu vào là `null`** | Phải ra `null`/`UNKNOWN`, ⛔ **không** ra `0` — `0` đọc thành *"hoàn hảo"* |

🔑 `W-4` là cùng một họ với ghi chú đã có trong `assignment-progress.calculator.ts`:
*"Trả `0` là nói dối"*.

### `P2-6` · Tách `md-client.tsx` — `TD-18`

**886/900 dòng — còn 14 dòng đệm.** 13 tab · 3 nhóm · nạp dữ liệu theo tab.

**Cách tách đề xuất — theo trục NHÓM, ⛔ không theo trục tab:**

```
md-client.tsx              giữ state + bố cục + điều phối tab   (~300 dòng)
_tabs/thuong-mai.tsx       nhóm Thương mại
_tabs/trien-khai.tsx       nhóm Triển khai
_tabs/phoi-hop.tsx         nhóm Phối hợp
```

Tách theo tab ⇒ 13 tệp, mỗi tệp một mẩu, và state chia sẻ giữa các tab sẽ phải
xuyên qua 13 ranh giới. Nhóm đã là ranh giới **có sẵn trong mã** (`GROUPS`).

⚠️ **⛔ Không xoá logic cũ** — CLAUDE.md §6.2. Chỉ **dời** và **đổi đường dùng**.

---

# §3 · DELIVERABLES

## 3.1 Mã và bài kiểm

| # | Tệp | Loại |
|---|---|---|
| `D-1` | `tests/architecture/arch.test.mjs` mục ⑬ ⑭ ⑮ ⑯ | sửa |
| `D-2` | `tests/architecture/delete-exemptions.json` | 🆕 sổ |
| `D-3` | `tests/architecture/screen-math-debt-baseline.json` | 🆕 sổ |
| `D-4` | `tests/architecture/document-tables.json` | 🆕 sổ |
| `D-5` | `tests/architecture/screen-gates.json` | 🆕 sổ |
| `D-6` | `tests/business/warehouse-formulas.test.mjs` | 🆕 bài kiểm |
| `D-7` | `app/(dashboard)/md/_tabs/*.tsx` · `md-client.tsx` | 🆕 + sửa |

## 3.2 Tài liệu

| # | Tài liệu | Nội dung |
|---|---|---|
| `D-8` | `SPRINT_I2_PHASE2_REPORT.md` | 🆕 báo cáo thi hành, khuôn như Phase 1 |
| `D-9` | `CHANGELOG.md` | mục Phase 2 |
| `D-10` | `TECHNICAL_DEBT.md` | `TD-27` ✅ trả · `TD-18` ✅ trả · cập nhật `TD-03` |
| `D-11` | `PROJECT_MEMORY.md` | §8 `KD-4` đóng · §12 số phép đo |
| `D-12` | `ARCHITECTURE_BASELINE.md` §0.4 | tiến độ I-2 → **5/5** |
| `D-13` | `GOVERNANCE_PENDING_REPORT.md` | 🔴 **thêm mục**: `033` bị chặn ⇒ `request_id` ⛔ không trả được |

🔑 `D-13` ⛔ **không được bỏ.** Phase 2 sẽ **phát hiện** một khoản nợ ⛔ không tự
trả được, và **`GPR-001` là nơi nó phải nằm** — ⛔ không phải trong đầu người viết.

---

# §4 · KIỂM THỬ

## 4.1 Mỗi phép kiểm mới phải HỎNG TRƯỚC, XANH SAU

> Bắt buộc. Phase 1 đã áp cho ⑫ *(tiêm `'BLOCKED'`)*. **Phép kiểm chưa từng đỏ
> là phép kiểm chưa chứng minh được gì.**

| Phép kiểm | Cách tiêm lỗi có kiểm soát | Chờ thấy |
|---|---|---|
| ⑬ | Thêm `.delete()` ở tệp **⛔ không** có trong sổ | ⛔ HỎNG · chỉ đúng tệp mới |
| ⑭ | Thêm `.reduce((a,b)=>a+b.qty,0)` vào một component | ⛔ HỎNG · chỉ đúng tệp mới |
| ⑮ | Thêm một bảng vào `document-tables.json` ô `daCo` mà migration ⛔ không có cột | ⛔ HỎNG |
| ⑯ | Tạo route giả ⛔ không có mục trong `screen-gates.json` | ⛔ HỎNG |
| `P2-5` | Đổi ngưỡng 4 điểm từ 20 → 25 | ⛔ HỎNG ở `W-2` |

**Sau mỗi lần tiêm: khôi phục và xác nhận xanh lại.** Ghi cả hai chiều vào báo cáo.

## 4.2 Chống hồi quy

| Phép đo | Ngưỡng |
|---|---|
| `npm run typecheck` · `npm run lint` | sạch |
| `test:arch` | **≥ 51 đạt · 0 hỏng** — ⛔ không mục cũ nào đỏ thêm |
| `tests/business/md-formulas` | **59 đạt · 0 hỏng** — ⛔ không đổi |
| `npm test` *(11 bài)* | **10/11** — `md-internal-scope` vẫn hỏng đúng **6** mục `TC-1` |

🔴 **`md-internal-scope` hỏng ≠ 6 mục ⇒ DỪNG.** Nhiều hơn là hồi quy bảo mật; ít
hơn nghĩa là ai đó đã đụng vào quyền mà ⛔ không qua ADR.

## 4.3 `P2-6` — kiểm thử ⛔ không tự làm được

Tách `md-client.tsx` ⇒ **bắt buộc nghi thức nghiệm thu** UI_UX_STANDARDS §8:
đăng nhập bằng tài khoản seed thật, mở **cả 13 tab**, kiểm ⛔ không lọt
`undefined` · `[object Object]` · `NaN` ra HTML.

⚠️ **CSA ⛔ KHÔNG tự xác nhận được** — ADR-011 §2.4 mục 3. Cần người có trình
duyệt và mật khẩu. **`P2-6` ⛔ không được đánh dấu hoàn tất trước bước này.**

---

# §5 · ĐIỀU KIỆN HOÀN THÀNH

## 5.1 Điều kiện ra của Sprint I-2 — nguồn: Baseline §3.2

| # | Điều kiện | Hôm nay | Đích Phase 2 |
|---|---|---|---|
| `E-1` | `test:arch` có đủ **5 phép kiểm mới** | 🟠 **1/5** | ✅ **5/5** |
| `E-2` | **MD có bài kiểm nghiệp vụ** | ✅ đạt | ✅ giữ + mở rộng Warehouse |

## 5.2 Định nghĩa hoàn tất Phase 2 — 8 điều kiện

| # | Điều kiện | Đo bằng |
|---|---|---|
| `F-1` | ⑬ ⑭ ⑮ ⑯ chạy trong `test:arch`, **0 hỏng** | `npm run test:arch` |
| `F-2` | **Cả 4 phép kiểm đã được chứng minh HỎNG TRƯỚC** | log tiêm lỗi ghi trong báo cáo |
| `F-3` | Bộ kiểm Warehouse chạy, **0 hỏng**, có đủ `W-1`…`W-4` | `npm test` |
| `F-4` | `md-client.tsx` **< 600 dòng**, 13 tab còn đủ | `wc -l` + `test:arch` mục ⑤ |
| `F-5` | ⛔ **Không hồi quy** — `md-internal-scope` hỏng **đúng 6** mục | `npm test` |
| `F-6` | Mọi sổ nợ mới có **lý do từng mục**, ⛔ không có ô *"chưa biết"* | đọc JSON |
| `F-7` | `TD-27` · `TD-18` đánh dấu **đã trả** trong `TECHNICAL_DEBT.md` | đọc sổ |
| `F-8` | 🔴 **Nghi thức nghiệm thu `P2-6`** — 13 tab, phiên đăng nhập thật | **người vận hành** |

⚠️ **`F-8` CSA ⛔ không tự xác nhận được.** Nếu ⛔ không có người nghiệm thu,
`P2-6` phải **hoãn sang Phase 3** thay vì đánh dấu xong — `F-1`…`F-7` vẫn đủ để
khép `E-1` và `E-2`.

## 5.3 🔴 Một câu hỏi Board phải trả lời TRƯỚC khi chốt `E-1`

> **"5 phép kiểm mới" nghĩa là 5 phép kiểm CHẠY và XANH, hay 5 phép kiểm chạy
> xanh VÀ ⛔ KHÔNG CÒN NỢ trong sổ?**

| Cách hiểu | Hệ quả |
|---|---|
| **A · chạy và xanh** *(đề nghị)* | ✅ Phase 2 đạt `E-1`. Sổ nợ là **cơ chế bánh cóc**, đúng khuôn ⑨ ⑩ ⑫ đã dùng |
| **B · xanh và ⛔ không nợ** | ⛔ **I-2 ⛔ KHÔNG RA ĐƯỢC.** ⑮ cần `033`, `033` cần cắt freeze `B2`, `B2` là việc của Board. Sprint bị chặn bởi một thứ ngoài Sprint |

**Đề nghị chọn `A`**, và ghi cách hiểu vào Baseline §3.2 để lần sau ⛔ không phải
hỏi lại.

---

# §6 · RỦI RO

| # | Rủi ro | Khả năng | Nếu xảy ra | Giảm nhẹ |
|---|---|---|---|---|
| `R-1` | 🔴 **⑮ `request_id` ⛔ không trả được trong Phase 2** — cần `033`, mà `033` bị chặn bởi SECURITY FREEZE `B2` chưa cắt | **cao — gần như chắc chắn** | Nếu Board hiểu `E-1` theo cách `B` thì I-2 ⛔ không ra được | §5.3 — hỏi Board **trước**, ⛔ không sau. ⑮ vẫn có giá trị: nó **chặn nợ mới** ngay cả khi ⛔ không trả được nợ cũ |
| `R-2` | 🔴 **⑭ dương tính giả tràn lan** — mọi `.reduce` trong `components/` bị bắt, kể cả phép đếm render | **cao** | Quy tắc ⛔ không theo nổi ⇒ bị tắt ⇒ mất luôn `G6` | Ranh giới **hẹp** §2.3. Chạy thử **trước** khi chốt; nợ > 40 tệp ⇒ **thu hẹp lại**, ⛔ không nới sổ nợ |
| `R-3` | 🟠 **⑯ thành nghi thức rỗng** — sổ `screen-gates.json` điền cho có, mọi mục ghi *"đạt"* | trung bình | **Kiểm soát giả** — đúng thứ `G5` cấm | Bắt buộc **ngày + người phán** mỗi mục; mục ⛔ không có người phán ⇒ HỎNG. Ghi rõ trong tệp: *"⛔ không chứng minh màn hình đạt 6 cổng"* |
| `R-4` | 🔴 **`P2-6` gãy giao diện mà ⛔ không ai đo được** — 13 tab, màn hình dùng hàng ngày, CSA ⛔ không nghiệm thu được | trung bình | Hồi quy lọt lên sản xuất | Tách theo **nhóm** *(3 ranh giới)* ⛔ không theo tab *(13)*. Làm **cuối cùng**. ⛔ Không đánh dấu xong khi thiếu `F-8`. **Sẵn sàng hoãn sang Phase 3** |
| `R-5` | 🟠 **CI Node 22 đỏ** — bump ở Phase 1 **chưa chạy thử** | trung bình | Phase 2 mở đầu bằng sửa CI | Kiểm **ngay đầu Phase 2**, trước mọi việc khác. Quay lại Node 20 ⇒ bộ kiểm nghiệp vụ ⛔ không chạy được trên CI ⇒ phải chọn lại cách nạp `.ts` |
| `R-6` | 🟠 **Bộ kiểm Warehouse phát hiện lỗi công thức THẬT** | **trung bình–cao** — MD đã cho một ca *(`readLegacyStatus`)* | Phạm vi phình | Quy ước **trước**: lỗi sửa được ở tầng mã ⇒ sửa trong Phase 2 *(được phép trong freeze)*. Lỗi cần đổi lược đồ ⇒ **DỪNG**, ghi `TD`, trình Board. ⛔ Không tự nới bài kiểm cho khớp mã sai |
| `R-7` | 🟡 **⑬ neo `tệp:dòng` trôi** khi tệp bị sửa | cao | Báo động giả | Khớp `tệp + tên bảng`; số dòng chỉ để tra |
| `R-8` | 🟡 **`test:arch` chạy chậm** — 4 mục mới đều quét toàn bộ cây | thấp | Vòng phản hồi dài ra | Dùng lại **một** lượt `quet()` sẵn có, ⛔ không quét lại từng mục |
| `R-9` | 🔴 **Phase 2 ⛔ không đụng tới `TC-1` `TC-2` `TC-3`** — chúng vẫn chặn Cổng C và I-4 | chắc chắn | Xong I-2 vẫn ⛔ không đi tiếp được | **Có chủ ý**, đã ghi §1.3. Nhắc lại trong báo cáo Phase 2 để ⛔ không ai tưởng I-2 xong là đường thông |

## 6.1 Rủi ro lớn nhất, nói riêng

> `R-1` và §5.3 là **cùng một rủi ro nhìn từ hai phía**, và nó ⛔ **không phải
> rủi ro kỹ thuật**.

Phép kiểm ⑮ sẽ chạy đúng, xanh đúng, và **ghi rõ 7 bảng còn nợ**. Câu hỏi duy
nhất là *"nợ có tên có được tính là đạt ⛔ không"*. Cả bốn cơ chế bánh cóc đang
chạy — ⑨ màu, ⑩ chữ, ⑫ vốn từ, và nay ⑬ ⑭ — đều **đã** trả lời *"có"*.

⇒ Đề nghị Board chốt `A` **trước khi Phase 2 bắt đầu**, ⛔ không phải lúc nghiệm thu.

---

# §7 · ƯỚC LƯỢNG VÀ THỨ TỰ

| Hạng mục | Rủi ro | Ghi chú |
|---|---|---|
| `R-5` kiểm CI | thấp | **làm trước tiên** — nó có thể đổi cả cách làm `P2-5` |
| `P2-1` ⑬ | thấp | khuôn có sẵn từ ⑫ |
| `P2-2` ⑭ | **cao** | cần chạy thử ranh giới **trước** khi chốt |
| `P2-4` ⑯ | trung bình | phần lớn là lập sổ, ⛔ không phải viết mã |
| `P2-5` Warehouse | trung bình | có thể phát hiện lỗi thật ⇒ `R-6` |
| `P2-3` ⑮ | thấp *(kỹ thuật)* · **cao** *(quản trị)* | chờ §5.3 |
| `P2-6` `TD-18` | **cao** | cuối cùng · có thể hoãn Phase 3 |

---

# §8 · CHỖ TÔI CÓ THỂ SAI

1. **`R-2` có thể nặng hơn tôi ước.** Tôi ⛔ chưa chạy thử biểu thức của ⑭ trên
   `components/`. Nếu nó bắt 200 tệp thì thiết kế §2.3 sai và phải làm lại —
   ⑭ khi đó nên đo **`*-client.tsx`** trước, `components/` sau.
2. **Ngưỡng `< 600 dòng` ở `F-4` là con số tôi đặt**, ⛔ không phải phép đo. Nếu
   nhóm Thương mại một mình đã 400 dòng thì ngưỡng đó ép chia nhỏ hơn mức tự
   nhiên — và chia nhỏ hơn mức tự nhiên là một loại nợ khác.
3. **Tôi giả định `033` vẫn bị chặn.** Board có thể đã cắt `B2` mà tôi ⛔ chưa
   biết; khi đó `R-1` biến mất và `P2-3` trả được nợ ngay.
4. **`W-1`…`W-4` là bốn phép đo tôi chọn** vì chúng giống hình dạng lỗi đã xảy
   ra. Chúng ⛔ **không** phải bộ đủ. `paretoOf` và `summariseCapa` còn nhiều
   nhánh mà tôi chưa đọc hết.
5. 🔴 **Phase 2 làm lưới an toàn dày hơn, ⛔ không làm hệ thống đúng hơn.** ⛔
   Không hạng mục nào ở đây sửa `VT-1` *(`orders.status` ⛔ không ràng buộc)* hay
   `VT-2` *(mã ⛔ không biểu diễn nổi lô đã huỷ)* — hai chỗ lệch **nặng nhất**
   Phase 1 đo được. Chúng cần migration + ADR, tức cần Board. **Nếu Board chỉ
   đọc điều kiện ra, Sprint I-2 sẽ "đạt" mà hai lỗ hổng đó vẫn nguyên.**

---

## THAM CHIẾU

- [`SPRINT_I2_PHASE1_REPORT.md`](SPRINT_I2_PHASE1_REPORT.md) — Phase 1
- [`TECHNICAL_FOUNDATION_CERTIFICATE.md`](../audit/TECHNICAL_FOUNDATION_CERTIFICATE.md) `TFC-001` §3 — `TC-1`·`TC-2`·`TC-3`
- [`GOVERNANCE_PENDING_REPORT.md`](../audit/GOVERNANCE_PENDING_REPORT.md) `GPR-001`
- [EDD-05 §1.1](../enterprise-design/EDD-05-WORKSPACE-EXPERIENCE-MODULE.md) — 6 cổng · [EDD-06 §7](../enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md)
- [ADR-003](../adr/ADR-003-request-id.md) · [`MUTATION_POLICY.md`](../MUTATION_POLICY.md)
- [`ARCHITECTURE_BASELINE.md`](../ARCHITECTURE_BASELINE.md) §0.4 · §3.2
- `tests/architecture/vocabulary-baseline.json` — khuôn sổ nợ của ⑫

> **Trạng thái:** ⏳ **KẾ HOẠCH — trình Board.** ⛔ Chưa viết một dòng mã nào.
> 🔴 Cần Board trả lời **§5.3** trước khi khởi động.
