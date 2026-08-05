# CHANGELOG — Monica ONE

> Ban hành theo **Board Directive 04/08/2026** mục 6: mỗi Sprint bàn giao đủ
> *Source Code · Migration · Test · Documentation · Commit · Decision Log ·
> Changelog*.
>
> Tài liệu này ghi **cái gì đã đổi và vì sao**. Nó **không** thay thế
> [`docs/PROJECT_MEMORY.md`](docs/PROJECT_MEMORY.md) *(tri thức nằm ở đâu)* hay
> [`docs/ARCHITECTURE_BASELINE.md`](docs/ARCHITECTURE_BASELINE.md) *(kiến trúc
> đã khoá cái gì)*.
>
> Quy ước: `🔴` bảo mật · `✨` tính năng · `🐛` sửa lỗi · `📄` tài liệu ·
> `🧪` kiểm thử · `🗄️` migration. Migration nào **chưa được Board chạy** đều ghi
> rõ `⏳ chờ chạy` — *"đã viết" khác "đã có hiệu lực"*.

---

## Sprint I-2 · Phase 2 — 05/08/2026 · 🔵 **ĐANG CHẠY**

### ⑬ `B2-1` · `.delete()` — ngưỡng đếm → **danh sách miễn trừ tường minh** — ✅ **HOÀN TẤT**

Trả **`TD-27`**. Phép kiểm mới **thứ hai** của Sprint I-2 ⇒ điều kiện ra `E-1`
đi từ **1/5 lên 2/5**.

**Vấn đề:** `arch.test.mjs` dùng `NGUONG_DELETE = 4`. Ngưỡng đếm cho phép
**thêm** lời gọi mới miễn là **bớt** lời gọi cũ — nó ⛔ không phân biệt được *nợ
cũ* với *nợ mới*, nên chỉ chặn được lời gọi **thứ năm**.

**Giải pháp:** sổ `delete-exemptions.json` khai **đích danh 4 vị trí**, mỗi mục
ghi `tệp` · `hàm` · **`bảng đích`** · `soLuong` · mã nợ · **lý do**. Năm phép
kiểm con:

| # | Bắt gì |
|---|---|
| ① | `.delete()` ở tệp **⛔ không có trong sổ** ⇒ nợ MỚI |
| ② | Mục trong sổ mà tệp **⛔ không còn** `.delete()` ⇒ mục **chết**, phải gỡ *(bánh cóc)* |
| ③ | **`soLuong`** — thêm lời gọi **thứ hai** vào tệp đã miễn trừ. ⚠️ Miễn trừ theo TỆP mà ⛔ không đếm thì tệp có tên trong sổ thành **chỗ trú an toàn** cho mọi lời gọi mới |
| ④ | **Bảng đích** đo được ⟷ khai báo — bắt lúc lời gọi đổi sang bảng khác |
| ⑤ | Mục thiếu **lý do** hoặc **mã nợ** ⇒ mục đã bị lách |

🔑 Neo theo **`tệp` + `bảng`**, ⛔ không theo số dòng — số dòng trôi mỗi lần tệp
bị sửa và sinh báo động giả *(`R-7`)*.

**Phép đo:** `test:arch` **51 → 56 đạt · 0 hỏng**. **Bốn lần tiêm lỗi, mỗi lần
đỏ đúng chỗ**, khôi phục xanh lại:

```
tiêm .delete() ở tệp chưa đăng ký  ⛔ chưa đăng ký: …/tiem-thu.ts
đổi tệp trong sổ thành tệp không có ⛔ mục chết + ⛔ nợ mới  (bắt CẢ HAI)
thêm .delete() thứ hai vào tệp cũ   ⛔ collaboration.actions.ts (2 > 1)
đổi bảng đích trong sổ              ⛔ đo được `costing_items`, sổ khai [bang_khac]
```

### 🔴 `TD-35` — sổ miễn trừ lộ ra một lỗi CHƯA AI THẤY

Lập sổ bắt khai **bảng đích**, và chính chỗ đó lộ ra: `deleteStyleChild` nhận
**tên bảng động** và giao diện gọi được cả bốn — kể cả **`style_bom`**.

Nhưng `style_bom` ⛔ **không** nằm trong 6 ngoại lệ giữ `DELETE` của ADR-018
§6.2 ⇒ `042` **đã thu hồi quyền**. Người dùng bấm *"Xoá"* ở tab định mức nguyên
phụ liệu sẽ nhận **lỗi phân quyền**, ⛔ không phải thông báo nghiệp vụ.

| Phát biểu | Nhãn |
|---|---|
| Giao diện gọi được `deleteStyleChild('style_bom', …)` | **`[MEASURED]`** |
| `style_bom` ⛔ không thuộc 6 ngoại lệ `TD-25` | **`[MEASURED]`** |
| Lời gọi đó **thất bại trên CSDL thật** | 🔴 **`[INFERRED]`** — bảng rỗng, ⛔ chưa đo được |

**Vì sao nó lọt qua mọi lớp:** TypeScript thấy `'style_bom'` **nằm trong** kiểu
union nên hợp lệ · bài kiểm phân quyền ghi `⚪ chưa đo được` vì bảng rỗng ·
ngưỡng `.delete()` cũ chỉ **đếm**, ⛔ không nhìn **bảng đích** · ⛔ chưa ai nhập
định mức thật.

⇒ **Sổ miễn trừ là lớp ĐẦU TIÊN nhìn thấy nó** — đúng giá trị `TD-27` hứa.
⛔ **Chưa sửa** *(Board: "⛔ không sửa ngoài hạng mục đang thực hiện")*. Đề nghị
lối ① — bỏ `'style_bom'` khỏi union kiểu và khỏi `TABLE_OF`.

### 🔬 `B2-2a` · SPIKE đo phép kiểm ⑭ — ✅ **HOÀN TẤT**

Hạng mục **đầu tiên** của Phase 2. Loại **spike**: chỉ đo, ⛔ không viết bài
kiểm, ⛔ không sửa mã sản phẩm.

🔴 **PHÁT HIỆN: ranh giới ⑭ trong kế hoạch SAI — 50% là nhiễu.**

Đếm thì **đạt** *(24/95 tệp ≤ ngưỡng 40)*. Nhưng soi từng chỗ khớp thì
**12/24 là dương tính giả**:

| Mẫu §2.3 | Bắt | Trúng thật | Độ chính xác | Phán quyết |
|---|---|---|---|---|
| `A` `.reduce(` | 16 | 11 | 69% | ✅ **giữ + thu hẹp** ⇒ **100%** |
| `B` `× 100` `÷ 100` | 2 | **0** | 🔴 **0%** | 🔴 **bỏ** |
| `C` `Math.round/min/max` | 14 | **1** | 🔴 **7%** | 🔴 **bỏ** |

`Math.min`/`Math.max` trong `components/` gần như **luôn** là *kẹp giá trị để
vẽ* — cửa sổ cuộn, bề rộng thanh, thang biểu đồ, kẹp con trỏ bàn phím.
`Math.round` gần như luôn là **định dạng**, thứ chính kế hoạch đã khai là ⛔
không chặn. `× 100` chỉ bắt được **văn bản giải thích công thức**.

> 🔑 **Một phép kiểm sai một nửa số lần ⛔ không sống nổi ba tháng** — nó sẽ bị
> nới sổ nợ rồi bị gỡ. Đúng kịch bản `R-2`, và đúng bài học đã ghi ở mục ⑨ ⑩:
> *"quy tắc ⛔ không thể tuân thủ thì người ta tắt nó đi"*.

**Sau thu hẹp: 11 tệp · độ chính xác 100% · 0 dương tính giả.** Nặng nhất:
`tabs-execution.tsx` một mình tính **sáu** chỉ số nghiệp vụ, và `costing-list.tsx`
tính **biên lợi nhuận trung bình** — chỉ số **tiền**.

### 🔴 Lỗi trong chính phép đo — bắt được và ghi lại

Mẫu thu hẹp bản đầu `/\.reduce\s*\([^)]*=>\s*[^)]*\+/` trả **0 tệp**, vì
`[^)]*` **⛔ không vượt qua dấu `)` của tham số `(s, r)`**. Thực tế là **11**.
Tin con số đó ⇒ kết luận *"⛔ không tệp nào cộng dồn"* — **ngược hoàn toàn**.

> Cùng họ với lỗi ⑫ ở Phase 1 *(`Map` khoá theo tên, hằng số thứ hai ghi đè im
> lặng)*. **Hai lần liên tiếp, phép kiểm tự giấu mất đúng thứ nó sinh ra để
> bắt.** Mẫu regex viết vội ⛔ không tự báo là mình sai — nó chỉ trả một con số
> trông hợp lý.

**Ảnh hưởng hệ thống: ⛔ KHÔNG CÓ.** ⛔ Không đụng mã, bài kiểm, migration.
`test:arch` **51 đạt · 0 hỏng** · nghiệp vụ MD **59 đạt · 0 hỏng** · độ phủ CI
**9/10** — cả ba ⛔ không đổi. Script đo nằm ở scratchpad, ⛔ không vào kho.

**Backlog cập nhật:** `B2-2b` `Effort` **`L` → `M`** · ranh giới **3 mẫu → 1
mẫu** · `R-2` từ *"cao, ⛔ chưa đo"* xuống *"đã đo, đã có cách xử"*.

🔴 **Chờ Board:** `Đ-2` duyệt thu hẹp ranh giới · `Đ-3` chọn lối xử
`cut-ticket-basket.tsx` *(chỗ trúng thật duy nhất của mẫu `C` bị bỏ)*.

---

## Chuẩn bị Sprint I-2 Phase 2 — 05/08/2026 · ✅ **HAI CỔNG GỠ BỎ**

### ✅ `G-B` · CI trên Node 22 — **PASS**

Đo trên **CI thật** *(GitHub Actions API, kho public)*, ⛔ không mô phỏng cục bộ —
máy phát triển chạy Node 24 nên chạy lại ở đó ⛔ không chứng minh gì về Node 22
trên `ubuntu-latest`.

| Pipeline | Kết quả | Node 20 *(đối chứng)* |
|---|---|---|
| `kiem-tra-tinh` | ✅ **4/4 lượt · 0 job hỏng** · ~46s | ~52s |
| `kiem-tra-song` | ✅ **4/4 lượt · 0 job hỏng** · ~28s | ~30s |

**Node 22 nhanh hơn ~12% dù làm NHIỀU việc hơn** — nó chạy thêm 59 phép đo
nghiệp vụ MD mà Node 20 chưa từng chạy. ⛔ Không hồi quy.

⚠️ **Log CI cần quyền admin** *(`403`)* nên tôi ⛔ không đọc được dòng `59 đạt`
theo nghĩa đen. Kết luận *"bài kiểm nghiệp vụ đã chạy và đạt"* là **`[PROVEN]`**
từ 5 tiền đề đã đo, ⛔ **không** phải `[MEASURED]` trực tiếp — nếu Node < 22.6
thì cờ bị từ chối ⇒ spawn thoát ≠ 0 ⇒ `run.mjs` báo HỎNG ⇒ bước phải đỏ.

### 🔴 `CI-1` · CI ⛔ CHỈ CHẠY 5/10 BÀI KIỂM — phát hiện ngoài phạm vi `G-B`

Phát hiện khi đọc `ci.yml` để kiểm Node 22. **⛔ Không phải lỗi Node 22** — nó
**có sẵn từ trước Sprint I-1**.

`ci.yml` ⛔ **không** gọi `npm test`; nó gọi ba script hẹp hơn. Năm bài **chưa
từng chạy tự động**: `md-internal-scope` · `md-read-matrix` · `md-update-matrix`
· `costing-lifecycle` · `a001-runtime` — **188 phép đo bảo mật của Sprint I-1**.

> 🔴 **Hệ quả nặng nhất: CI xanh ⛔ KHÔNG chứng minh `npm test` xanh.** Bốn lượt
> `success` hoàn toàn tương thích với việc `npm run verify` đang **ĐỎ** — và nó
> **đang đỏ thật**. Hai câu chuyện khác nhau, cùng một màu xanh.
>
> Đây **đúng vấn đề `ci.yml` được sinh ra để giải** *(khối ghi chú đầu tệp:
> "toàn bộ bằng chứng an toàn của RLS nằm trong một thư mục tạm trên máy một
> người… ⛔ không ai khác chạy lại được")* — và nó đã âm thầm quay lại.

**Board duyệt phương án `B`.** Độ phủ **`5/10` → `9/10`**:

| Bài kiểm | Trước | Sau |
|---|---|---|
| `arch` · `md-formulas` · `seed-integrity` · `rls-external` · `anon-and-buyer` | ✅ | ✅ |
| **`md-read-matrix`** *(90 phép đo)* | ⛔ | ✅ **THÊM** |
| **`md-update-matrix`** *(75 phép đo)* | ⛔ | ✅ **THÊM** |
| **`costing-lifecycle`** *(`B-1` · `B-3`)* | ⛔ | ✅ **THÊM** |
| **`a001-runtime`** *(23 phép đo)* | ⛔ | ✅ **THÊM** |
| `md-internal-scope` | ⛔ | ⛔ **CỐ Ý CHƯA** — xem dưới |

**Ba quyết định thiết kế, ghi lại để khỏi tranh cãi sau:**

1. **Mỗi bài một bước riêng.** Gộp cả 6 vào một bước thì GitHub chỉ hiện **một**
   dấu đỏ, phải mở log mới biết bài nào hỏng. Đắt hơn vài dòng YAML, rẻ hơn một
   lần lần mò log.
2. **Bí mật khai một lần ở cấp job.** Trước đây mỗi bước tự khai lại ba biến;
   thêm bài thứ sáu là chép tay lần thứ sáu, và quên một biến thì bài đó **tự
   tuyên bố BỎ QUA rồi thoát 0** — GitHub vẫn hiện dấu xanh.
3. 🔴 **`md-internal-scope` ⛔ KHÔNG vào CI, và ⛔ KHÔNG chạy ở chế độ "cảnh báo
   không chặn".** Nó đang hỏng **đúng 6 mục** `TC-1`. Đưa vào ⇒ CI đỏ **vô thời
   hạn**, mà đèn đỏ vô thời hạn dạy cả đội đọc lướt qua màu đỏ — đúng cách `F-1`
   sống sót 20 migration. Cho chạy kiểu *"cảnh báo"* ⇒ tạo tiền lệ **bài kiểm
   được phép đỏ**, trái `AC-3`. ⇒ Nó vào CI **cùng lượt** với việc trả `TC-1`.

**✅ Nghiệm thu trên CI thật — lượt #49 `c45e92a4`:** cả hai job `SUCCESS`; bốn
bước mới hiện **riêng** trên giao diện. `kiem-tra-song` **28s → 34s**.

> 🔑 **+188 phép đo bảo mật tự động, chỉ tốn thêm ~6 giây.** Đó là lý do `CI-1`
> đáng làm ngay thay vì xếp vào nợ: chi phí gần bằng không, còn thứ nó che
> khuất thì ⛔ không đo được.

### 🟠 `CI-2` — rủi ro mới, ⛔ chưa xử

`concurrency.cancel-in-progress` huỷ lượt đang chạy khi có push mới. Bài kiểm
dọn dữ liệu tạm trong `finally`, mà tiến trình bị huỷ thì `finally` **⛔ không
chạy** ⇒ còn lại **tài khoản và dòng gieo mồ côi** trên CSDL thật. Rủi ro **có
sẵn** với 2 bài; nay **6 bài** nên lớn gấp ba. Ba lối xử ghi ở `GPR-001` §0.4 —
**Board quyết**, ⛔ không chặn Phase 2.

### ✅ `G-A` — Board chốt **cách hiểu `A`**

Một *"phép kiểm mới"* hoàn thành khi ① **đã xây dựng** ② **chạy được**
③ **PASS theo tiêu chí Sprint**. ⛔ **Không** đòi xử xong Technical Debt hoặc
Governance Pending cùng lúc. Ghi vào [Baseline §0.6](docs/ARCHITECTURE_BASELINE.md);
khép `GPR-001` `A-6`.

⇒ Phép kiểm ⑮ *(`request_id`)* **hoàn thành được** dù 7 bảng còn nợ chờ `033` —
`033` bị chặn bởi `B2`, một thứ nằm **ngoài** Sprint.

---

## Sprint I-2 · Lưới an toàn — Phase 1 — 05/08/2026 · 🔒 **ĐÃ KHOÁ**

> 🔒 **KHOÁ 05/08/2026** — Board Directive mục 5. Commit `6ee3dd24` · `19ca85be`,
> đã push. ⛔ **Phase 1 đóng: sửa tiếp là hạng mục Phase 2, ⛔ không sửa ở đây.**
> Dấu khoá đầy đủ: [`SPRINT_I2_PHASE1_REPORT.md`](docs/planning/SPRINT_I2_PHASE1_REPORT.md).
>
> **Bốn loại kết quả, ⛔ đọc lẫn nhau là sai:**
>
> | Loại | Nội dung |
> |---|---|
> | ✅ **Đã hoàn thành** | `P1-1` `P1-2` `P1-3` · `test:arch` 43 → **51** · phép đo tĩnh 43 → **110** |
> | ⚠️ **Chưa nghiệm thu** | truy vấn `order_milestones` **chưa chạy trên CSDL thật** · CI Node 22 **chưa chạy thử** |
> | ⏳ **Technical Debt** | `TC-1`…**`TC-5`** · `TD-18` · `TD-27` · `VT-1`…`VT-8` |
> | 🟠 **Governance Pending** | **26 mục** — `GPR-001`. ⛔ Không chặn Sprint; **`A-6` chặn ĐIỀU KIỆN RA của I-2** |

**Thẩm quyền khởi động:** Board Decision 05/08/2026 — tách Foundation thành
**Technical** và **Governance**; chỉ Technical Blocker mới chặn Sprint. Chứng
nhận [`TFC-001`](docs/audit/TECHNICAL_FOUNDATION_CERTIFICATE.md): **0 Technical
Blocker**. Chi tiết: [`SPRINT_I2_PHASE1_REPORT.md`](docs/planning/SPRINT_I2_PHASE1_REPORT.md).

### 🐛 Sửa lỗi

- **`TD-17` · `KD-3` — hai màn hình cùng một PO cho hai mức khẩn cấp khác nhau.**
  `po-twin.service.ts:132` truyền `late_milestones: 0` *(hằng số)*, trong khi
  `po.service.ts` đếm thật ⇒ bảng danh sách hiện `CRITICAL`, trang PO 360° hiện
  `NORMAL`. Lỗi **im lặng**: không ngoại lệ, không cảnh báo.
  - Sửa **tận gốc**, ⛔ không vá riêng màn hình thứ hai: luật đếm rút thành hàm
    thuần `lib/mos/calculators/milestone-lateness.calculator.ts`, **cả hai
    service gọi cùng một hàm** nên ⛔ không lệch lại được. `AC-1`.
  - Đọc hỏng ⇒ `'mốc tiến độ'` vào danh sách `partial` ⇒ giao diện thừa nhận
    *"chưa đọc được"* thay vì trưng một con số bịa.

### 🧪 Kiểm thử — **+67 phép đo tĩnh**

- **`arch.test.mjs` mục ⑫ · phép kiểm VỐN TỪ TRẠNG THÁI — trả `TD-03`.** Đối
  chiếu `CHECK (cột IN …)` trích từ 54 migration với `export const … as const`
  trong `lib/` và `schemas/`. **36 bộ đã ánh xạ và đang khớp**; lệch ⇒ hỏng ngay.
  - Sổ `tests/architecture/vocabulary-baseline.json` — mọi vốn từ phải nằm ở
    **đúng một ô**; bộ mới không thuộc ô nào ⇒ **HỎNG**. Danh sách **tường minh**,
    ⛔ không phải ngưỡng đếm *(khác `TD-27`)*.
  - **Đã chứng minh có răng:** tiêm `'BLOCKED'` vào `MILESTONE_STATUSES` ⇒ đỏ
    đúng chỗ; khôi phục ⇒ xanh. *Hỏng trước, xanh sau.*
- **`tests/business/md-formulas.test.mjs` — bộ kiểm nghiệp vụ MD ĐẦU TIÊN của dự
  án. 59 đạt · 0 hỏng.** 9 bài kiểm cũ đều đo *phân quyền*; chưa bài nào hỏi
  *"con số in ra có ĐÚNG không"* trên 19.058 dòng mã MD.
  - Nạp thẳng `.ts` để đo **đúng mã đang chạy**, ⛔ không đo bản chép sang `.mjs`.

### 🔴 Bảy chỗ lệch vốn từ `[MEASURED]`

| | |
|---|---|
| `VT-1` 🔴 | **`orders.status` KHÔNG có ràng buộc `CHECK` nào** — vốn từ chỉ sống trong một dòng chú thích (`002:17`) liệt kê **4** giá trị, mã khai **6**. Bảng trung tâm của cả hệ thống |
| `VT-2` 🔴 | **`shipments.status` có 9, mã khai 8 — thiếu `CANCELLED`**, trong khi `026b` tồn tại đúng để canh phép huỷ. Mã ⛔ không biểu diễn nổi một lô đã huỷ |
| `VT-3` 🟠 | `wh_audit_log.action` lệch **cả hai chiều** |
| `VT-4` 🟠 | `INCOTERMS` **trùng tên** — 11 giá trị *(shipment)* ⟷ 7 *(MD)* |
| `VT-5` 🟠 | `MATERIAL_CATEGORIES` **trùng tên** — `TRIM` ⟷ `TRIMS`, khác đúng một chữ |
| `VT-6`·`VT-7` 🟡 | `qa_logs.aql_status` · `materials.uom` ⛔ không ràng buộc |
| `VT-8` 🟠 | **17 vốn từ CSDL chưa có đại diện trong mã** |

> 🔑 `VT-4` và `VT-5` **suýt lọt**: bản đầu của phép kiểm dùng `Map` khoá theo
> tên nên hằng số thứ hai **ghi đè im lặng** hằng số thứ nhất — phép kiểm tự
> giấu mất đúng loại khuyết tật nó sinh ra để bắt.

### 🔧 Hạ tầng

- **CI Node `20` → `22`** — bộ kiểm nghiệp vụ cần `--experimental-strip-types`
  (Node ≥ 22.6). Khép luôn một khoảng lệch có sẵn: máy phát triển chạy Node 24,
  CI chạy Node 20. ⚠️ **Chưa chạy thử trên CI** — tôi ⛔ không có CI để đo.

### 📊 Đo lại sau Phase 1

| Cổng | Trước | Sau |
|---|---|---|
| `typecheck` · `lint` | ✅ sạch | ✅ sạch |
| `test:arch` | 43 đạt · 0 hỏng | **51 đạt · 0 hỏng** |
| Bài kiểm nghiệp vụ MD | ⛔ **không có** | **59 đạt · 0 hỏng** |
| `npm test` *(10 bài)* | 8/9 đạt | **9/10 đạt** |
| `md-internal-scope` | 18 đạt · 6 hỏng | **18 đạt · 6 hỏng — ⛔ không hồi quy** |

> ⚠️ **`npm run verify` vẫn ĐỎ**, và đỏ đúng bằng **6 ngoại lệ có chủ ý** của
> `TD-25` ⇒ `TC-1` trong `TFC-001`. ⛔ Không nới ngưỡng để lấy màu xanh.

### ✅ Đánh dấu hoàn thành

**Sprint I-2 · Phase 1 — HOÀN TẤT 05/08/2026.** Board phê duyệt cùng ngày.
Commit `6ee3dd24`. Ba hạng mục `P1-1` `P1-2` `P1-3` đều đóng, đo lại toàn bộ
sau thay đổi, ⛔ không hồi quy.

Tài liệu cập nhật theo cùng lượt: `PROJECT_MEMORY` **v1.1** *(khép `B-1` của
`GPR-001` — 5 nhóm mâu thuẫn với nguồn)* · `ARCHITECTURE_BASELINE` **tu chính
R1** *(§1 Certificate Board đã ký giữ nguyên văn — Điều 43.7)*.

### ⚠️ Chưa nghiệm thu được

- **Câu truy vấn `order_milestones` mới thêm chưa từng chạy trên CSDL thật.**
  CLAUDE.md §5 bước 3–4 đòi đăng nhập bằng tài khoản seed và đối chiếu câu select
  với CSDL đang chạy — **ngoài thẩm quyền CSA** *(ADR-011 §2.4 mục 3)*.
- Điều kiện ra I-2 *"`test:arch` có đủ **5** phép kiểm mới"*: đang **1/5**.

---

## Sprint I-1 · An toàn — 04–05/08/2026 · ✅ **HOÀN TẤT**

**Điều kiện ra của Sprint (Baseline §3.2):** `pg_policies` trên CSDL thật cho
thấy nhóm bảng MD đã thu hẹp.

**Đạt tới đâu:** phần **chẩn đoán** khép trọn vẹn — lỗ hổng đã đo `[VERIFIED]`,
đã vá `F-1`, đã soạn ADR cho `F-2`. Phần **thi hành trên CSDL** chưa đạt và
**không thể đạt trong Sprint này**: nó cần Board chạy `041`, cắt vòng khoá
`B2`, và phê duyệt ADR-018. Cả ba đều ngoài thẩm quyền CSA.

> ⚠️ **Không ghi `✅` cho phần chưa đo được.** Điều kiện ra nguyên văn nói *"trên
> CSDL thật"*; chừng nào `041` và `042` chưa chạy thì câu đó chưa đúng. Sprint
> đóng vì **đã làm hết phần làm được**, không phải vì đã đạt đích.

### 🔴 Bảo mật

- **`VR-001` đo xong** bằng phiên đăng nhập thật trên CSDL đang chạy, thay vì
  bằng truy vấn tay. Khép **Cổng B mục `B1`**.
  → [`docs/audit/VR-001-KET-QUA.md`](docs/audit/VR-001-KET-QUA.md)
- **`F-1` `[VERIFIED]` — sổ kiểm toán không bất biến.** Mọi vai nội bộ `UPDATE`
  và `DELETE` được `activity_log`. Vi phạm **BDR-14** và quy tắc **K-1**.
  Người sửa dữ liệu tự xoá được dấu vết của chính mình.
- **`F-2` `[VERIFIED]` — 23 bảng không phân tách nội bộ.** `014`/`015` cấp
  `authenticated_only` = `FOR ALL` + `GRANT ALL`; vai trò không xuất hiện trong
  biểu thức policy. Vi phạm **Playbook Điều XXX** và nhóm `SOD-H*`.
  → chờ **ADR-018**.

### 🗄️ Migration

- **`041_activity_log_immutable.sql`** ⏳ **chờ Board chạy** — vá `F-1`. Thu hồi
  `UPDATE` · `DELETE` · `TRUNCATE` của `authenticated` và `anon` trên
  `activity_log`. `INSERT`/`SELECT` giữ nguyên; `service_role` giữ nguyên.
  Không đụng policy, không đụng bảng khác, không đổi lược đồ.
  - `TRUNCATE` được thu hồi cùng lượt dù Board chỉ nêu `UPDATE`/`DELETE`: nó
    bỏ qua trigger, bỏ qua RLS, không sinh dòng audit nào — để lại nó thì mục
    tiêu *bất biến* không đạt được. Tiền lệ: `029b:56`.

### 🧪 Kiểm thử

- **`tests/security/md-internal-scope.test.mjs`** — bài kiểm phân quyền **nội
  bộ** đầu tiên của dự án. Đã vào `npm test`.
  - Đo quyền GHI bằng lệnh nhắm vào **khoá không tồn tại** ⇒ chạy được trên bảng
    rỗng, và **không tạo dòng nào** — không phải mở cửa một chiều của sổ cái
    (quy tắc **K-1**).
  - Kết quả lần đầu: **0 đạt · 24 hỏng · 4 chưa đo được**. Đỏ **có chủ ý**.
  - Nhãn `[F-1]` / `[F-2]` để đọc được tiến độ sau khi `041` chạy.

### 📐 Quyết định kiến trúc

- **[ADR-018](docs/adr/ADR-018-thu-hep-authenticated-only.md)** ⏳ **chờ phản
  biện + Board phê duyệt** — thu hẹp `authenticated_only` trên 23 bảng. Đủ chín
  mục Board yêu cầu. **ADR đầu tiên sau khi đóng băng** ⇒ đi qua Architecture
  Change Procedure, không thuộc baseline. Migration `042` ⛔ chưa viết.
- Hai câu hỏi chặn trước khi viết `042`: **`VR-004`** *(kho có cần đọc
  `style_bom` không)* · **`VR-005`** *(`ketoan` có cần đọc `costings` không)*.

### 🔢 Kỷ luật số hiệu — ba va chạm trong một dự án

| Lần | Va chạm | Xử lý |
|---|---|---|
| 1 | `BDR-14` · `BDR-15` — Board và CSA cùng cấp | số Board giữ · số CSA → `BDR-18` `BDR-19` |
| 2 | `VR-002` · `VR-003` — BKB *(bậc 0′)* và CSA | số BKB giữ · số CSA → `VR-004` `VR-005` |
| 3 | `TD-18`…`TD-22` — EDD-06 *(bậc 2′)* và CSA | số EDD giữ · số CSA → `TD-25`…`TD-29` |

Nguyên nhân chung: **không có sổ cấp số tập trung.** Thứ bậc văn bản giải quyết
xung đột *nội dung*, không giải quyết xung đột *số hiệu*. Ghi thành `TD-30`,
**đề nghị Board quyết riêng**.

### 🗄️ Migration `042` — soạn xong, ⛔ **chưa chạy**

Board phê duyệt ADR-018 **về nguyên tắc** 05/08/2026 và giữ nguyên SECURITY
FREEZE ⇒ `042` được **soạn**, không được **chạy**.

- **Tầng Privilege** — `REVOKE TRUNCATE, TRIGGER, REFERENCES` trên 22 bảng;
  `REVOKE DELETE` trên 16 bảng. Sáu bảng giữ `DELETE` có thời hạn (`TD-25`).
- **Tầng Policy** — thay `authenticated_only` bằng bộ ba tách theo hành động
  `_read` / `_insert` / `_update`, điều kiện qua `mos_current_role()`.
- **`costings_no_edit_after_approve`** — policy `RESTRICTIVE` chặn sửa chứng từ
  đã duyệt *(Hiến pháp Điều 8 · rủi ro `R-3`)*. Cố ý **không** có `WITH CHECK`,
  nếu không sẽ chặn luôn phép chuyển hợp lệ `SUBMITTED → APPROVED`.

### ⚖️ Hai phán quyết Board — và chỗ chúng đụng giới hạn kỹ thuật

**`VR-004` · Warehouse READ ONLY trên `style_bom`** — thi hành đủ:
`SELECT` cho 4 vai kho, không `INSERT`/`UPDATE`/`DELETE`. Yêu cầu *"không truy
cập thông tin tài chính"* **tự thoả** — `style_bom` không có cột giá nào.
🔴 Yêu cầu *"không export, không copy"* **KHÔNG thi hành được ở `042`** — cần
tầng Data Egress Control (EDD-04F) chưa dựng ⇒ `TD-31`.

**`VR-005` · Accounting xem giá đã duyệt, không xem Cost Breakdown** — đây là
phân quyền theo **CỘT**, mà **RLS chỉ lọc DÒNG**, và `GRANT SELECT (cột)` cấp
theo **vai CSDL** trong khi mọi người dùng Monica đều là `authenticated`.
⇒ Buộc phải dùng **phép chiếu** `v_costing_approved` — đúng khuôn Disclosure
Projection `DL-057`. View **cố ý không `security_invoker`**; đã đăng ký ở
[`SECURITY_DEFINER_REGISTRY.md`](docs/SECURITY_DEFINER_REGISTRY.md) §2.4 kèm ba
nghĩa vụ. Đây là chỗ **đầu tiên** phá bất biến *"11/11 view invoker"* của `A001`.

⚠️ **Cần Board xác nhận** view mới không thuộc phần *"không mở rộng phạm vi"* —
ADR-018 §10.2 nêu cả phương án thay thế *(hoãn phần `ketoan`)*.

### 📄 Tài liệu

- `docs/audit/MONICA_ONE_AUDIT_REPORT.md` — **khối đính chính §M2**. Phát biểu
  *"buyer và subcon đọc được `costings`/`style_bom`"* là **SAI**: hai vai này bị
  chặn bởi `buyer_denied` (`018`) và `subcon_denied` (`025`). Nguyên nhân: tìm
  theo khuôn `CREATE POLICY ... ON <bảng>` rồi kết luận trên chỗ không tìm thấy
  — đúng lỗi **Hiến pháp V.1**. Giữ nguyên phần sai theo **Điều 43.7**.
- `docs/review/` + `_TEMPLATE-review.md` — nơi lưu hồ sơ phản biện độc lập.
  Khép **`TD-15`** và **Cổng B mục `B6`**.
- `docs/RLS_COVERAGE_MATRIX.md` — thêm nhật ký 04/08 và bảng `F-2`.
- `docs/ARCHITECTURE_BASELINE.md` — Cổng B: `B1` ✅ · `B6` ✅ · `B3` 🟡 *(kèm lý
  do chưa làm)*.
- `CHANGELOG.md` — tệp này.

### ⏳ Còn treo

| # | Việc | Ai |
|---|---|---|
| — | 🔴 **Chạy `041`** trên SQL Editor, chép khối kiểm tra về hồ sơ | **Board** |
| — | 🔴 **Phê duyệt ADR-018** *(sau phản biện độc lập)* + trả lời `VR-004` · `VR-005` | **Board** |
| `B2` | 🔴 Cắt vòng khoá SECURITY FREEZE — **không cắt thì `042` không chạy được** | **Board** |
| `TD-30` | Lập sổ cấp số tập trung cho `TD` · `VR` · `BDR` | Board quyết |
| `B3` | Gộp ba chuỗi ADR *(chạm `00-CONSTITUTION.md:75` ⇒ không tự làm)* | CSA → Board |
| `B4` | Người thứ hai cho `SOD-H04` · `H05` · `H06` | Joseph |
| `B5` | Thời hạn phản biện tối đa | Board |

> ⚠️ **`npm run verify` vẫn ĐỎ — nhưng chỉ còn 6 mục, và cả 6 là ngoại lệ có chủ
> ý (`TD-25`).** Nó chỉ xanh hết sau khi 4 lời gọi `.delete()` trong mã ứng dụng
> được chuyển sang xoá mềm và 6 bảng kia bị thu hồi nốt — cần một ADR riêng vì
> `costing_items` phải thêm cột `deleted_at`.

---

## Kết quả thi hành trên CSDL thật — 05/08/2026

| Migration | Chạy | Kết quả đo độc lập |
|---|---|---|
| **`042`** | ✅ 05/08 | `authenticated_only` **22 → 0** · `TRUNCATE` hở **22 → 0** · `DELETE` hở **22 → 6** · `buyer_denied`/`subcon_denied` nguyên vẹn · `v_costing_approved` dựng · hàm dựng tự dọn |
| **`041`** | ✅ 05/08 | `activity_log` hết `UPDATE`/`DELETE`/`TRUNCATE`; `INSERT`/`SELECT` còn nguyên nên sổ cái **vẫn ghi nhận được**; `service_role` giữ nguyên |

**Bài kiểm phân quyền nội bộ:** `0 đạt · 24 hỏng` → `16 đạt · 8 hỏng` → **`18 đạt · 6 hỏng`**.

✅ **`F-1` đóng** *(BDR-14 thoả — sổ kiểm toán nay bất biến)* ·
✅ **`F-2` đóng** *(trừ 6 ngoại lệ `TD-25`)*.

### ⚠️ Ghi nhận để hồ sơ đúng

- **`042` chạy trước hai điều kiện chính nó ghi ở đầu tệp** — Board chưa cắt
  `B2`, ADR-018 chưa qua phản biện độc lập. Đó là quyền của Board; hệ quả là
  **phản biện nay thành hậu kiểm**, và nếu nó phát hiện vấn đề thì phải quay lui
  trên CSDL thật chứ không phải sửa trên giấy.
- **Một dòng khối kiểm tra của `042` sai — lỗi của CSA.** Phép đếm
  `Policy _read mới` thiếu bộ lọc theo bảng ⇒ trả `33` thay vì `22`. Truy vấn
  đúng ở ADR-018 §10.3.1. Không ảnh hưởng kết luận: hai phép đo độc lập khác đã
  chứng minh `042` đúng.
- ✅ **`A001` đã chạy lại — ĐẠT.** Nghĩa vụ ② khép. `0/12` view chưa đăng ký ·
  **`0` view cho `anon` đọc** · `0/20` hàm `SECDEF` `anon` gọi được · `0` hàm
  thiếu `search_path`. `A001` được sửa để phân biệt view **chưa đăng ký** với
  **ngoại lệ có ADR** — bằng danh sách **đích danh**, không phải ngưỡng.
- ✅ **Ma trận đọc `VR-004`/`VR-005` — `90 đạt · 0 hỏng`.** 14 vai × 5 đối
  tượng, có dữ liệu gieo tạm nên số 0 là kết luận thật. Soi cả mức **cột**
  *(5 cột thương lượng không tồn tại trong phép chiếu)* và mức **dòng**
  *(`DRAFT` không lộ, `APPROVED` vẫn thấy)*.
- ⚠️ **Tồn đọng có sẵn, không do `042`:** 3 vai còn cấp quyền mặc định cho
  `anon` *(`supabase_admin` tạo bảng · hàm · sequence)*. Đã ghi từ trước ở
  `SECURITY_DEFINER_REGISTRY` §6 và `038c` — ta không đủ quyền đổi mặc định của
  `supabase_admin`. Đối tượng do `postgres` tạo *(mọi thứ migration dựng)* đều
  sạch.
