# `B2-2a` · SPIKE ĐO PHÉP KIỂM ⑭ — BÁO CÁO

| Trường | Giá trị |
|---|---|
| **Hạng mục** | `B2-2a` — hạng mục **đầu tiên** của Sprint I-2 Phase 2 |
| **Thẩm quyền** | Board Review 05/08/2026 — **APPROVED**, mở Phase 2 theo thứ tự `RDY-001` |
| **Loại** | 🔬 **SPIKE — chỉ đo, ⛔ không viết bài kiểm, ⛔ không sửa mã sản phẩm** |
| **Ngày** | 2026-08-05 |
| **Kết luận** | 🟠 **RANH GIỚI TRONG KẾ HOẠCH SAI — 50% là nhiễu.** Đề nghị thu hẹp |
| **Bucket** | ✅ **≤ 40 tệp** ⇒ `B2-2b` giữ phạm vi · `Effort` **`L` → `M`** |

---

# §1 · VẤN ĐỀ PHÁT HIỆN

## 1.1 Nhiệm vụ của spike

Kế hoạch §2.3 khai ranh giới cho ⑭ *(cấm màn hình tự tính — `G6`)*, và `R-2`
ghi rủi ro **cao**: *"dương tính giả tràn lan ⇒ quy tắc ⛔ không theo nổi ⇒ bị
tắt ⇒ mất luôn `G6`"*. Spike đo trước để ⛔ không phát hiện điều đó ở cuối Sprint.

Ngưỡng quyết định của kế hoạch:

| Đếm được | Hành động |
|---|---|
| ≤ 40 tệp | giữ nguyên phạm vi · `Effort` `L` → `M` |
| 40–100 | thu hẹp: chỉ `*-client.tsx` |
| > 100 | thiết kế lại · báo Board |

## 1.2 🔴 PHÁT HIỆN CHÍNH — đếm thì ĐẠT, nhưng ranh giới thì SAI

**Số lượng ⛔ không phải vấn đề. Độ chính xác mới là vấn đề.**

Ranh giới §2.3 bắt **24/95 tệp** — dưới ngưỡng 40, nên *"đạt"* theo chữ. Nhưng
soi từng chỗ khớp thì **12 trong 24 là dương tính giả** — tỷ lệ nhiễu **50%**.

| Mẫu §2.3 | Tệp bắt | **Trúng thật** | **Nhiễu** | Độ chính xác |
|---|---|---|---|---|
| **A** · `.reduce(` | 16 | 11 | 5 | 69% |
| **B** · `× 100` / `÷ 100` | 2 | **0** | 2 | 🔴 **0%** |
| **C** · `Math.round/min/max` | 14 | **1** | 13 | 🔴 **7%** |
| **Hợp** *(A ∪ B ∪ C)* | **24** | **12** | **12** | **50%** |

> 🔑 **Một phép kiểm sai một nửa số lần ⛔ không sống nổi ba tháng.** Nó sẽ bị
> gắn `eslint-disable`, bị nới sổ nợ, rồi bị gỡ — đúng kịch bản `R-2`, và đúng
> bài học đã ghi ở chính mục ⑨ · ⑩ của `arch.test.mjs`:
> *"quy tắc ⛔ không thể tuân thủ thì người ta tắt nó đi"*.

## 1.3 Nhiễu đến từ đâu — bằng chứng đích danh

### Mẫu `C` · `Math.round/min/max` — **13/14 là toán BỐ CỤC**

```
virtual-list.tsx:63        Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN)   ← cửa sổ cuộn
ui.tsx:107                 Math.max(0, Math.min(pct, 100))                             ← kẹp bề rộng thanh
ui.tsx:114                 {Math.round(pct)}%                                          ← ĐỊNH DẠNG hiển thị
ui.tsx:218                 Math.max(...data.map(d => d.value), 1)                      ← thang biểu đồ
command-palette.tsx:152    Math.min(c + 1, items.length - 1)                           ← kẹp con trỏ bàn phím
actionable-po.tsx:123      width: `${Math.max(2, p.pct)}%`                             ← bề rộng tối thiểu
po-pipeline.tsx:88         Math.max(...stages.map(s => s.count), 1)                    ← thang biểu đồ
ceo-report.tsx:311         v >= 1000 ? `${Math.round(v / 1000)}k`                       ← ĐỊNH DẠNG trục
risk-center.tsx:127        <ProgressBar pct={Math.min(100, r.total_score)} />           ← kẹp để vẽ
```

⇒ `Math.min`/`Math.max` trong `components/` gần như **luôn** là *kẹp giá trị để
vẽ*, ⛔ không phải *tính chỉ số*. `Math.round` gần như luôn là **định dạng** —
thứ kế hoạch §2.3 đã tự khai là ✅ ⛔ không chặn.

**Ngoại lệ duy nhất — và nó TRÚNG THẬT:**
```
cut-ticket-basket.tsx:50   Math.max(tk.neededM - tk.matchedM, 0)                    ← THIẾU bao nhiêu mét
cut-ticket-basket.tsx:55   Math.min(Math.round((tk.matchedM / tk.neededM) * 100), 100)  ← TỶ LỆ PHỦ %
```

### Mẫu `B` · `× 100` — **2/2 là hiển thị HẰNG SỐ**

```
risk-center.tsx:142-145   nguyên phụ liệu {RISK_WEIGHTS.material * 100}% · tiến độ {…}
tabs-execution.tsx:252    (trọng số {(p.weight * 100).toFixed(0)}%)
```
Đây là **văn bản giải thích công thức**, ⛔ không phải phép tính nghiệp vụ.

### Mẫu `A` · `.reduce(` — nhiễu là **nội suy chuỗi i18n**

```
tab-executive.tsx:170   values.reduce((s, v, i) => s.replace(`{${i}}`, v), tpl)
```
Cùng khuôn ở `tab-material` · `tab-production` · `tab-quality` · `tab-shipment` —
**5 tệp**, ⛔ không cộng dồn gì cả.

## 1.4 🔴 LỖI TRONG CHÍNH PHÉP ĐO — bắt được và ghi lại

Bản đầu của spike có mẫu thu hẹp `A′` để tách *"reduce có cộng dồn"*:

```js
/\.reduce\s*\([^)]*=>\s*[^)]*\+/     // ⛔ SAI — khớp 0 tệp
```

`[^)]*` **⛔ không vượt qua được dấu `)` của tham số** `(s, r)`, nên nó trả **0**
trong khi thực tế có 11. Nếu tin con số đó, tôi đã kết luận *"⛔ không tệp nào
cộng dồn"* — **ngược hoàn toàn sự thật**.

Bản đúng khai tường minh cặp ngoặc tham số:
```js
/\.reduce\s*\(\s*\([^)]*\)\s*=>\s*[^,;]*\+/      // ✅ khớp 11 tệp
```

> 🔑 Cùng họ với lỗi đã bắt ở Phase 1 — mục ⑫ dùng `Map` khoá theo tên nên hằng
> số thứ hai **ghi đè im lặng**. **Hai lần liên tiếp, phép kiểm tự giấu mất đúng
> thứ nó sinh ra để bắt.** Ghi lại vì đây ⛔ không phải trùng hợp: mẫu regex viết
> vội **⛔ không tự báo là mình sai** — nó chỉ trả một con số trông hợp lý.

---

# §2 · GIẢI PHÁP ĐỀ NGHỊ

> ⚠️ **⛔ CHƯA ÁP DỤNG GÌ.** Spike ⛔ không viết bài kiểm, ⛔ không sửa mã. Mục
> này là **đầu vào quyết định** cho `B2-2b`, chờ Board review.

## 2.1 Thu hẹp ranh giới — bỏ `B`, bỏ `C`, tinh chỉnh `A`

| Mẫu | Kế hoạch §2.3 | **Đề nghị** | Vì sao |
|---|---|---|---|
| `A` `.reduce(` | giữ | ✅ **GIỮ, thu hẹp** — chỉ khi có **cộng dồn** `(…) => … +` | 11/11 trúng · **100%** |
| `B` `× 100` `÷ 100` | giữ | 🔴 **BỎ** | **0/2** — chỉ bắt văn bản giải thích |
| `C` `Math.round/min/max` | giữ | 🔴 **BỎ** | **1/14** — 93% là toán bố cục |

**Kết quả sau thu hẹp:**

```
Tệp trong phạm vi        95
Tệp nợ                   11        (24 → 11)
Độ chính xác             100%      (50% → 100%)
Dương tính giả           0         (12 → 0)
```

## 2.2 Cái mất khi bỏ `C` — nói rõ, ⛔ không giấu

Bỏ `C` ⇒ **mất `cut-ticket-basket.tsx`**, chỗ trúng thật duy nhất của mẫu đó:
nó tính *thiếu bao nhiêu mét vải* và *tỷ lệ phủ %* ngay trong component.

Ba lối xử, ⛔ **chưa chọn** — thuộc `B2-2b`:

| | Nội dung | Đánh giá |
|---|---|---|
| ① | Chấp nhận sót · ghi vào sổ nợ ⑭ kèm lý do | rẻ nhất · trung thực · **⛔ không** có răng ở chỗ đó |
| ② | Thêm mẫu hẹp *"chia hai biến dữ liệu rồi × 100"* | bắt được nó, nhưng **⛔ chưa đo nhiễu** |
| ③ | Ghi thành `TD` riêng, sửa cùng lượt với `TC-1` | dời việc, ⛔ không giải |

⇒ Đề nghị **①** cho `B2-2b`: giữ phép kiểm **100% chính xác** rồi mở rộng sau,
hơn là mở rộng ngay và tụt xuống 50%. **Một phép kiểm hẹp mà sống được có giá
trị hơn một phép kiểm rộng bị tắt.**

## 2.3 Bucket — theo đúng ngưỡng kế hoạch

**11 tệp ≤ 40** ⇒ **bucket ①**: `B2-2b` giữ nguyên phạm vi *(`components/` +
`*-client.tsx`)*, `Effort` hạ từ **`L`** xuống **`M`**.

---

# §3 · PHÉP ĐO CHỨNG MINH

## 3.1 Bối cảnh đo — `P-MEASURE` vế ②

```
Kho          D:/monicagarmenterp/monica-erp @ cc41b024
Phạm vi      components/**  (88 tệp)  +  app/**/*-client.tsx  (7 tệp)  =  95
Tiền xử lý   BỎ CHÚ THÍCH trước khi quét — cùng bài học mục ⑨: quét cả chú
             thích thì tệp GHI LẠI quy tắc lại bị báo vi phạm
Công cụ      script dùng-một-lần trong scratchpad — ⛔ KHÔNG commit vào kho
```

## 3.2 Số đo

| Phép đo | Kết quả |
|---|---|
| Tệp trong phạm vi | **95** |
| Ranh giới §2.3 bắt | **24** |
| — trúng thật | **12** |
| — dương tính giả | **12** *(50%)* |
| Ranh giới đề nghị bắt | **11** |
| — trúng thật | **11** *(100%)* |

## 3.3 Mười một tệp nợ — sau thu hẹp

| Tệp | Tính gì trong component |
|---|---|
| `components/md/po/tabs-execution.tsx` | 🔴 **6 chỉ số**: `sewn` · `inspected` · `passed` · `defects` · `packedPcs` · `grossKg` |
| `components/md/costing/costing-list.tsx` | 🔴 **biên lợi nhuận trung bình** — chỉ số **tiền** |
| `components/md/collab/risk-center.tsx` | điểm rủi ro trung bình |
| `components/md/crm/customer-360-sheet.tsx` | tổng SL + tổng giá trị đơn |
| `components/md/po/tabs-planning.tsx` | sản lượng đã may |
| `components/md/po/po-pipeline.tsx` | tổng đơn đang chạy |
| `components/md/po/po-list.tsx` | tổng số lượng |
| `components/md/crm/customer-list.tsx` | tổng số đơn |
| `components/md/style/style-list.tsx` | tổng đơn gắn mã hàng |
| `app/(dashboard)/orders/orders-client.tsx` | tổng số lượng |
| `app/(dashboard)/md/md-legacy-client.tsx` | tổng mục tiêu theo cỡ |

> 🔑 **`tabs-execution.tsx` một mình tính SÁU chỉ số nghiệp vụ.** Đây đúng hình
> dạng `TD-17`: nếu một màn hình khác cộng cùng dữ liệu theo cách hơi khác, hai
> màn hình cho hai con số — và ⛔ **không** có gì báo.

## 3.4 Điều spike này ⛔ KHÔNG chứng minh

| # | ⛔ Không chứng minh |
|---|---|
| ① | **11 tệp kia ĐANG cho số sai.** Nó chứng minh chúng **tự tính**, ⛔ không chứng minh **tính sai**. `G6` cấm *nguồn thứ hai*, ⛔ không cấm *phép cộng* |
| ② | Ranh giới đề nghị **⛔ không bỏ sót chỗ nào khác** — nó chỉ 100% **chính xác**, ⛔ chưa đo **độ phủ** |
| ③ | Mẫu ② ở §2.2 *(chia hai biến rồi × 100)* có nhiễu bao nhiêu — **⛔ chưa đo** |

---

# §4 · ẢNH HƯỞNG TỚI HỆ THỐNG

## 4.1 Thay đổi trạng thái hệ thống — **⛔ KHÔNG CÓ**

| | |
|---|---|
| Mã sản phẩm | ⛔ **⛔ không đụng** |
| Bài kiểm | ⛔ **⛔ không thêm** |
| Migration · CSDL · policy | ⛔ **⛔ không đụng** |
| `npm run test:arch` | **51 đạt · 0 hỏng** — ⛔ không đổi |
| Bài kiểm nghiệp vụ MD | **59 đạt · 0 hỏng** — ⛔ không đổi |
| Độ phủ CI | **9/10** — ⛔ không đổi |

⇒ **Spike ⛔ không có bề mặt rủi ro.** Script đo nằm ở scratchpad, ⛔ không vào kho.

## 4.2 Ảnh hưởng tới Backlog

| Hạng mục | Trước | **Sau spike** |
|---|---|---|
| `B2-2b` `Effort` | `L` | ✅ **`M`** |
| `B2-2b` ranh giới | 3 mẫu `A` `B` `C` | 🟠 **1 mẫu** — `A` thu hẹp |
| `B2-2b` sổ nợ dự kiến | ⛔ chưa biết | **11 tệp** |
| `R-2` *(dương tính giả)* | 🔴 **cao · ⛔ chưa đo** | 🟢 **đã đo · đã có cách xử** |

## 4.3 Ảnh hưởng tới nợ đã biết

⛔ **Không trả khoản nợ nào.** Spike **phát hiện thêm**: 11 tệp tự tính chỉ số —
⛔ chưa có mã `TD`, đề nghị `B2-2b` lập sổ nợ ⑭ và ghi vào `TECHNICAL_DEBT`.

---

# §5 · CHỖ TÔI CÓ THỂ SAI

1. **Phán quyết *"trúng thật / nhiễu"* là do TÔI đọc từng dòng**, ⛔ không phải
   phép đo tự động. Một người khác có thể xếp `four-point-defect-grid.tsx:54`
   *(`Math.max(0, Math.round(next) || 0)` khi nhập liệu)* là **trúng** chứ ⛔
   không phải nhiễu — tôi xếp nhiễu vì nó **chuẩn hoá đầu vào**, ⛔ không tính
   chỉ số.
2. **Tôi ⛔ không đo độ PHỦ**, chỉ đo độ CHÍNH XÁC. Ranh giới đề nghị có thể sót
   nhiều chỗ tự tính mà cả ba mẫu đều ⛔ không thấy — ví dụ vòng `for` cộng dồn,
   hoặc `useMemo` gọi hàm cộng. **Đây là điểm mù đã biết**, ghi ở §3.4 ②.
3. **Ngưỡng 40/100 của kế hoạch hoá ra ⛔ không phải thứ đáng đo.** Con số
   *(24)* đạt ngưỡng, nhưng **độ chính xác** mới là thứ quyết định phép kiểm
   sống hay chết. Nếu spike chỉ đếm rồi báo *"24 ≤ 40, đi tiếp"* thì `B2-2b` đã
   dựng một phép kiểm nhiễu 50%. **Ngưỡng trong kế hoạch của chính tôi đã đặt
   sai câu hỏi.**
4. **Đề nghị bỏ mẫu `C` làm mất một chỗ trúng thật.** Tôi chọn giữ độ chính xác
   100%; Board có thể ưu tiên độ phủ và chọn lối ② ở §2.2.

---

# §6 · ĐỀ NGHỊ BOARD

| # | Nội dung | Cần quyết? |
|---|---|---|
| `Đ-1` | ✅ Xác nhận `B2-2a` **HOÀN TẤT** — bucket ①, `Effort` `L` → `M` | xác nhận |
| `Đ-2` | 🟠 **Duyệt thu hẹp ranh giới ⑭**: giữ `A` *(có cộng dồn)*, **bỏ `B` và `C`** | 🔴 **CẦN** |
| `Đ-3` | 🟠 Với `cut-ticket-basket.tsx` — chọn lối **①** *(chấp nhận sót, ghi sổ nợ)* | 🔴 **CẦN** |
| `Đ-4` | Cho phép `B2-2b` lập sổ nợ ⑭ **11 tệp** và ghi vào `TECHNICAL_DEBT` | xác nhận |

> `Đ-2` là **thu hẹp**, ⛔ không phải mở rộng phạm vi — đúng lối mà kế hoạch §2.3
> đã dự liệu *("> 40 tệp ⇒ THU HẸP ranh giới, ⛔ không nới sổ nợ")*. Ở đây lý do
> thu hẹp là **độ chính xác**, ⛔ không phải số lượng.

---

## THAM CHIẾU

- [`SPRINT_I2_PHASE2_BACKLOG.md`](SPRINT_I2_PHASE2_BACKLOG.md) §3 `B2-2` · [`SPRINT_I2_PHASE2_PLAN.md`](SPRINT_I2_PHASE2_PLAN.md) §2.3 · `R-2`
- [`SPRINT_I2_PHASE2_READINESS.md`](SPRINT_I2_PHASE2_READINESS.md) `RDY-001` §3.1 — thứ tự ⓪→⑧
- EDD-05 §1.1 `G6` · Hiến pháp Điều V · VII · CLAUDE.md §2.3
- `tests/architecture/arch.test.mjs` mục ⑨ ⑩ ⑫ — khuôn bánh cóc + bài học *"bỏ chú thích trước khi quét"*

> **Trạng thái:** ✅ **`B2-2a` HOÀN TẤT** — chờ Board review trước khi sang `B2-1`.
> ⛔ Chưa viết bài kiểm · ⛔ chưa sửa mã sản phẩm.
