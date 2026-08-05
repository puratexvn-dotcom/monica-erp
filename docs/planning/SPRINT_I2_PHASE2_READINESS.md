# SPRINT I-2 · PHASE 2 READY

| Trường | Giá trị |
|---|---|
| **Mã hồ sơ** | `RDY-001` |
| **Phát hành** | ✅ **2026-08-05** — Board Directive 05/08/2026 mục 4 |
| **Tu chính** | **R1 · 2026-08-05** — sau Board Decision `G-A` + `CI-1`. Xem §0 |
| **Ngày** | 2026-08-05 |
| **Thẩm quyền** | Board Directive 05/08/2026 — *bước chuẩn bị Sprint I-2 Phase 2* |
| **Phạm vi** | ① Kiểm `G-B` *(CI trên Node 22)* · ② Rà soát Backlog · ③ Đề xuất thứ tự |
| **Ràng buộc** | ⛔ **Không sửa mã ứng dụng** — Board chưa phê duyệt |
| **Kết luận `G-B`** | ✅ **PASS** — 4 lượt chạy liên tiếp, 8/8 job xanh |

---

# §0 · TU CHÍNH R1 — BOARD ĐÃ QUYẾT

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║            S P R I N T   I - 2   ·   P H A S E   2   R E A D Y          ║
║                                                                          ║
║                    ✅   P H Á T   H À N H  ·  2026-08-05                 ║
║                                                                          ║
║   ────────────────────────────────────────────────────────────────      ║
║   HAI CỔNG — CẢ HAI ĐÃ GỠ                                                ║
║                                                                          ║
║    ✅ G-A   Định nghĩa "5 phép kiểm mới"     Board chốt cách hiểu A     ║
║    ✅ G-B   CI ổn định trên Node 22          4/4 lượt · 8/8 job xanh    ║
║                                                                          ║
║   ────────────────────────────────────────────────────────────────      ║
║   CI-1 — ĐÃ THI HÀNH (phương án B)                                      ║
║                                                                          ║
║    Độ phủ CI      5/10  ──►  9/10                                       ║
║    Thêm           md-read-matrix · md-update-matrix                     ║
║                   costing-lifecycle · a001-runtime                      ║
║    Cố ý chưa      md-internal-scope  ← vào cùng lượt với TC-1           ║
║                                                                          ║
║   ────────────────────────────────────────────────────────────────      ║
║   ⛔ 0 Technical Blocker   ·   ⛔ 0 cổng chặn                             ║
║                                                                          ║
║   🔴 CHƯA MỞ PHASE 2 — chờ Board phê duyệt cuối cùng.                    ║
║   ⛔ Chưa viết một dòng mã sản phẩm nào.                                 ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

## 0.1 `G-A` ✅ — Board chốt **cách hiểu `A`**

Một *"phép kiểm mới"* hoàn thành khi thoả **cả ba**: ① **đã được xây dựng**
② **chạy được** ③ **PASS theo tiêu chí Sprint**. ⛔ **Không** đòi xử xong toàn bộ
Technical Debt hoặc Governance Pending cùng lúc.

⇒ **`O-3` của §2.3 khép.** `B2-3` *(⑮ `request_id`)* **hoàn thành được** dù 7
bảng còn nợ chờ `033`. Ghi vào [Baseline §0.6](../ARCHITECTURE_BASELINE.md);
`GPR-001` `A-6` đóng.

## 0.2 `CI-1` ✅ — đã thi hành phương án `B`

| | Trước | **Sau** |
|---|---|---|
| Độ phủ | **5/10** | ✅ **9/10** |
| Phép đo bảo mật chạy tự động | 2 bài | **6 bài** |
| `md-internal-scope` | ⛔ | ⛔ **cố ý** — chờ `TC-1` |

**Bốn bài bổ sung — chạy lại 05/08 trước khi push:**

| Bài | Kết quả | Mã thoát |
|---|---|---|
| `md-read-matrix` | **90 đạt · 0 hỏng** | `0` |
| `md-update-matrix` | **75 đạt · 0 hỏng** | `0` |
| `costing-lifecycle` | **6 đạt · 0 hỏng · 2 ⚪ chưa đo được** | `0` |
| `a001-runtime` | **23 đạt · 0 hỏng** | `0` |

🔑 **Chạy lại TRƯỚC khi push, ⛔ không phải sau.** Đẩy một CI đỏ là điều tệ nhất
có thể làm ngay lúc vừa mở rộng độ phủ — nó sẽ dạy đúng bài học ngược lại.

### ✅ Nghiệm thu trên CI THẬT — lượt **#49** `c45e92a4` · `[MEASURED]`

```
JOB  Kiểm tra tĩnh    SUCCESS  45s
JOB  Kiểm tra sống    SUCCESS  34s
     ✅ Toàn vẹn dữ liệu nền
     ✅ Phân quyền người dùng bên ngoài
     ✅ Ma trận đọc VR-004 · VR-005        ← MỚI
     ✅ Ma trận ghi (UPDATE)               ← MỚI
     ✅ Vòng đời chiết tính                ← MỚI
     ✅ A001 runtime — bề mặt phơi ra      ← MỚI
```

| | Trước `CI-1` | **Sau `CI-1`** |
|---|---|---|
| `kiem-tra-song` | ~28s · 2 bài bảo mật | **34s · 6 bài bảo mật** |
| Phép đo bảo mật tự động | ~40 | **~228** |

🔑 **+188 phép đo bảo mật, chỉ tốn thêm ~6 giây.** Đây là lý do `CI-1` đáng làm
ngay thay vì xếp vào nợ: chi phí gần bằng không, còn cái nó che khuất thì
⛔ không đo được.

⇒ **Bốn bước mới hiện RIÊNG trên giao diện GitHub** — đúng quyết định thiết kế
①: hỏng bài nào đọc được ngay, ⛔ không phải mở log.

## 0.3 🟠 `CI-2` — rủi ro mới, ⛔ chưa xử

`concurrency.cancel-in-progress` huỷ lượt đang chạy khi có push mới. Bài kiểm
dọn dữ liệu tạm trong `finally`, mà tiến trình bị huỷ thì `finally` **⛔ không
chạy** ⇒ còn lại **tài khoản và dòng gieo mồ côi** trên CSDL thật.

Rủi ro **có sẵn** với 2 bài; nay **6 bài** nên lớn **gấp ba**. Ba lối xử ghi ở
`GPR-001` §0.4 — **Board quyết**, ⛔ không chặn Phase 2.

## 0.4 Thứ tự triển khai — ⛔ KHÔNG ĐỔI sau quyết định

`G-A` chốt `A` ⇒ `B2-3` ⛔ không còn nguy cơ *"⛔ không bao giờ hoàn thành"*.
Nhưng thứ tự ở §3.1 **giữ nguyên**, vì hai lý do còn nguyên giá trị:

| Lý do | Còn đúng? |
|---|---|
| `B2-2a` spike trước — `R-2` chưa đo | ✅ **còn nguyên** |
| `B2-5` vào giữa — `R-6` cần chỗ xoay | ✅ **còn nguyên** |
| `B2-3` xếp cuối nhóm phép kiểm | 🟡 **lý do đổi** — ⛔ không còn vì rủi ro quản trị, mà vì nó là mục **⛔ không đóng được nợ**, nên để sau các mục có kết quả dứt điểm |

⇒ **Thứ tự ⓪→⑧ ở §3.1 giữ nguyên**, chỉ đổi lý do của bước ⑥.

---

# PHẦN ① · KIỂM `G-B` — CI TRÊN NODE 22

## 1.1 Bối cảnh đo — `P-MEASURE` vế ②

```
Nguồn        GitHub Actions API — kho puratexvn-dotcom/monica-erp (public)
Thời điểm    2026-08-05
Phạm vi      48 lượt chạy trong lịch sử · phân tích 11 lượt gần nhất
Node 22 từ   lượt #45 (19ca85be) — lượt đầu tiên sau khi bump
Node 20 tới  lượt #44 (4e69538d) — làm mốc đối chứng
```

🔑 **Đây là phép đo trên CI THẬT, ⛔ không phải mô phỏng cục bộ.** Máy phát
triển chạy Node 24; chạy lại ở đây ⛔ **không** chứng minh được gì về Node 22
trên `ubuntu-latest`.

## 1.2 Kết quả từng pipeline — `[MEASURED]`

### `kiem-tra-tinh` · Kiểm tra tĩnh — ✅ **PASS**

| Lượt | Commit | Kết luận | Thời lượng |
|---|---|---|---|
| **#48** | `85bfc7b8` | ✅ **success** | 49s |
| **#47** | `ec057bc3` | ✅ **success** | 44s |
| **#46** | `f31b37a1` | ✅ **success** | 41s |
| **#45** | `19ca85be` | ✅ **success** | 50s |

Từng bước của lượt #48 — **⛔ không bước nào đỏ, ⛔ không bước nào bị bỏ qua**:

```
✅ Set up job          ✅ checkout@v4        ✅ setup-node@v4
✅ Cài phụ thuộc  (npm ci)
✅ Kiểm kiểu      (tsc --noEmit)
✅ Lint           (next lint)
✅ Kiểm kiến trúc (npm run test:arch)   ← chứa bài kiểm nghiệp vụ MD
```

### `kiem-tra-song` · Kiểm tra sống — ✅ **PASS**

| Lượt | Commit | Kết luận | Thời lượng |
|---|---|---|---|
| **#48** | `85bfc7b8` | ✅ **success** | 31s |
| **#47** | `ec057bc3` | ✅ **success** | 25s |
| **#46** | `f31b37a1` | ✅ **success** | 27s |
| **#45** | `19ca85be` | ✅ **success** | 30s |

```
✅ Set up job   ✅ checkout@v4   ✅ setup-node@v4   ✅ npm ci
✅ Toàn vẹn dữ liệu nền              (npm run test:regression)
✅ Phân quyền người dùng bên ngoài   (npm run test:security)
```

## 1.3 Đối chứng Node 20 ⟷ Node 22 — ⛔ không hồi quy

| | Node 20 *(#38–#44)* | **Node 22** *(#45–#48)* |
|---|---|---|
| Lượt chạy | 7 | **4** |
| Job hỏng | 0 | **0** |
| `kiem-tra-tinh` | 48–55s · TB **~52s** | 41–50s · TB **~46s** |
| `kiem-tra-song` | 25–34s · TB **~30s** | 25–31s · TB **~28s** |

🔑 **Node 22 NHANH HƠN ~12% trên job tĩnh dù làm NHIỀU VIỆC HƠN** — nó chạy
thêm bài kiểm nghiệp vụ MD *(59 phép đo)* mà Node 20 chưa từng chạy.

## 1.4 Bài kiểm nghiệp vụ **có thật sự chạy** — `[PROVEN]`

⚠️ **Log CI cần quyền admin** *(`HTTP 403 · "Must have admin rights"`)* nên tôi
⛔ **không đọc được** dòng `59 đạt`. ⛔ Không giấu chỗ này.

Nhưng kết luận vẫn **chứng minh được** từ tiền đề đã đo:

| # | Tiền đề | Nhãn |
|---|---|---|
| ① | `tests/run.mjs:24` xếp `business/md-formulas.test.mjs` với `canDb = false` ⇒ nó **⛔ không bị bỏ qua** ở chế độ `--arch-only` | `[MEASURED]` |
| ② | Bộ chạy spawn nó bằng `node --experimental-strip-types` | `[MEASURED]` |
| ③ | Node < 22.6 **từ chối cờ lạ** và thoát khác 0 | `[MEASURED]` — hành vi Node |
| ④ | `run.mjs:56` ghi `HỎNG` khi `r.status !== 0`, và `:68` thoát `1` nếu có bài hỏng | `[MEASURED]` |
| ⑤ | Bước *"Kiểm kiến trúc"* **thoát 0** ở cả 4 lượt | `[MEASURED]` |

⇒ **`[PROVEN]`**: cờ được chấp nhận *(⇒ Node ≥ 22.6)* **và** bài kiểm nghiệp vụ
chạy **và** nó **đạt**. Nếu bất kỳ vế nào sai, bước đã phải đỏ.

**Còn lại chưa biết** — ghi ra thay vì lấp bằng lập luận:
- Phiên bản vá cụ thể *(`22.x`)* mà `setup-node` phân giải
- Con số `59 đạt` **theo nghĩa đen** trong log

⇒ Đóng được bằng **một lệnh của người có quyền admin**, xem §1.6.

## 1.5 🔴 PHÁT HIỆN NGOÀI PHẠM VI `G-B` — NHƯNG QUAN TRỌNG HƠN

> Trong lúc đọc `ci.yml` để kiểm Node 22, tôi phát hiện một thứ ⛔ không ai hỏi
> tới. Nó **⛔ không phải lỗi Node 22**, và nó **có sẵn từ trước Sprint I-1**.

### `CI-1` 🔴 **CI ⛔ KHÔNG chạy 5 trong 10 bài kiểm**

`ci.yml` ⛔ **không** gọi `npm test`. Nó gọi ba script hẹp hơn:

| Bước CI | Script | Bài kiểm thật sự chạy |
|---|---|---|
| Kiểm kiến trúc | `test:arch` | `arch` · **`business/md-formulas`** |
| Toàn vẹn dữ liệu nền | `test:regression` | `seed-integrity` |
| Phân quyền người ngoài | `test:security` | `rls-external` · `anon-and-buyer` |

**⇒ CI phủ 5/10. Năm bài ⛔ KHÔNG BAO GIỜ chạy trên CI:**

| Bài kiểm | Sinh ra ở | Đo gì |
|---|---|---|
| `md-internal-scope` | Sprint I-1 | 🔴 phân quyền **nội bộ** — **đang ĐỎ 6 mục** *(`TC-1`)* |
| `md-read-matrix` | Sprint I-1 | ma trận đọc `VR-004`·`VR-005` — 90 phép đo |
| `md-update-matrix` | Sprint I-1 | ma trận ghi — 75 phép đo |
| `costing-lifecycle` | Sprint I-1 | vòng đời chứng từ · `B-1` · `B-3` |
| `a001-runtime` | Sprint I-1 | bề mặt phơi ra — 23 phép đo |

### Vì sao đây là phát hiện nặng

1. 🔴 **CI xanh ⛔ KHÔNG chứng minh `npm test` xanh.** Bốn lượt `success` ở §1.2
   hoàn toàn tương thích với việc `npm run verify` đang **ĐỎ** — và nó **đang
   đỏ thật**. Hai câu chuyện khác nhau, cùng một màu xanh.
2. 🔴 **188 phép đo bảo mật viết trong Sprint I-1 chưa từng chạy tự động.**
   Chúng chỉ chạy khi có người gõ tay `npm test` trên máy mình. Đó **đúng vấn
   đề `ci.yml` được sinh ra để giải** — xem khối ghi chú đầu tệp đó:
   *"toàn bộ bằng chứng an toàn của RLS nằm trong một thư mục tạm trên máy một
   người… ⛔ không ai khác chạy lại được."*
3. Hồi quy bảo mật ở 5 vùng đó ⇒ **CI vẫn xanh**.

### Cách khắc phục — ⛔ CHƯA THI HÀNH, cần Board

| Phương án | Nội dung | Hệ quả |
|---|---|---|
| **A** | `kiem-tra-song` đổi sang `npm test` | ⛔ **CI ĐỎ NGAY** — `md-internal-scope` hỏng 6 mục `TC-1`. Trung thực, nhưng biến CI thành đèn đỏ vô thời hạn |
| **B** ⭐ | Thêm **4 bài xanh** *(`md-read-matrix` · `md-update-matrix` · `costing-lifecycle` · `a001-runtime`)* vào CI ngay; `md-internal-scope` **thêm sau** khi `TC-1` được trả | ✅ CI xanh · phủ **9/10** · ⛔ không đèn đỏ vô thời hạn |
| **C** | Thêm cả 5, cho `md-internal-scope` chạy ở chế độ *"cảnh báo, ⛔ không chặn"* | ⚠️ Tạo tiền lệ *"bài kiểm được phép đỏ"* — trái `AC-3` |

🔑 **Đề nghị `B`.** Nó khép 4/5 khoảng trống **ngay**, ⛔ không tạo đèn đỏ vô
thời hạn, và ⛔ không cần tắt bài kiểm nào — `AC-3` được tôn trọng. Bài thứ năm
vào CI **cùng lượt** với việc trả `TC-1`.

⚠️ **`CI-1` ⛔ không chặn Phase 2.** Nó là khoản nợ hạ tầng có tên, đề nghị ghi
vào `GPR-001`.

## 1.6 Hai việc cần người có quyền admin

| # | Việc | Lệnh |
|---|---|---|
| ① | Đọc log để xác nhận `59 đạt` **theo nghĩa đen** và phiên bản Node cụ thể | `gh run view 30969879074 --log \| grep -E "Node|59 đạt"` |
| ② | Quyết `CI-1` — đề nghị phương án `B` | Board |

> Gõ `! gh run view 30969879074 --log-failed` trong phiên này để kết quả rơi
> thẳng vào hội thoại.

## 1.7 Kết luận `G-B`

```
╔════════════════════════════════════════════════════════════════════════╗
║  G-B  ·  CI TRÊN NODE 22          ✅  P A S S                          ║
║                                                                        ║
║   kiem-tra-tinh    ✅ PASS   4/4 lượt · 0 job hỏng · ~46s              ║
║   kiem-tra-song    ✅ PASS   4/4 lượt · 0 job hỏng · ~28s              ║
║                                                                        ║
║   Hồi quy so với Node 20    ⛔ KHÔNG — nhanh hơn ~12% dù làm nhiều hơn  ║
║   Bài kiểm nghiệp vụ MD     [PROVEN] đã chạy và đạt                    ║
║                                                                        ║
║   ⇒ Cổng G-B GỠ BỎ. B2-0 khép.                                        ║
║   ⚠️ Phát hiện kèm: CI-1 — CI phủ 5/10 bài kiểm. Cần Board quyết.      ║
╚════════════════════════════════════════════════════════════════════════╝
```

---

# PHẦN ② · RÀ SOÁT BACKLOG

## 2.1 Thay đổi sau khi `G-B` xong

| Hạng mục | Trước | **Nay** |
|---|---|---|
| `B2-0` | P0 · cổng chặn | ✅ **XONG** — `G-B` PASS |
| `B2-1`…`B2-5` | `Dependency: B2-0` | ✅ **giải phóng** — ⛔ không còn phụ thuộc |
| `B2-3` | `Dependency: G-A` | 🔴 **CÒN NGUYÊN** — Board chưa trả lời `A-6` |
| — | — | 🆕 `CI-1` → đề nghị `GPR-001` |

## 2.2 Ma trận bốn tiêu chí — `[MEASURED]` ở cột Effort, phán đoán ở ba cột kia

| # | Hạng mục | Priority | Dependency | Risk | Value |
|---|---|---|---|---|---|
| `B2-1` | ⑬ `.delete()` | **P0** | — | 🟢 **thấp** | 🟡 **trung** — trả `TD-27`, **đo được `TC-1`** |
| `B2-2` | ⑭ màn hình tự tính | **P0** | — | 🔴 **CAO** | 🟢 **CAO** — bắt đúng lớp lỗi `TD-17` |
| `B2-3` | ⑮ `request_id` | **P0** | 🔴 **`G-A`** | 🟢 thấp *(kỹ thuật)* · 🔴 cao *(quản trị)* | 🟡 **trung** — chỉ chặn nợ mới |
| `B2-4` | ⑯ hồ sơ 6 cổng | **P0** | — | 🟡 trung *(nghi thức rỗng)* | 🟡 **trung nay · cao về sau** |
| `B2-5` | Warehouse | **P1** | — | 🟡 trung *(có thể lộ lỗi thật)* | 🟢 **CAO** — 921 dòng, 0 bài kiểm |
| `B2-6` | tách `md-client` | **P1** | tất cả | 🔴 **CAO** | 🟡 **trung** — phòng trần 900 dòng |
| `B2-7` | tài liệu · khoá | **P1** | tất cả | 🟢 thấp | — |

## 2.3 Ba quan sát đổi thứ tự

### `O-1` 🔴 `B2-2` vừa **giá trị cao nhất** vừa **rủi ro cao nhất**

Thói quen là *"làm mục rẻ trước"*. Ở đây thói quen đó **sai**: nếu ⑭ hoá ra
⛔ không khả thi *(`R-2` — bắt 200 tệp)*, ta sẽ biết điều đó **ở cuối Sprint**,
sau khi đã tiêu hết thời gian cho ba mục kia.

⇒ **Tách một SPIKE ĐO riêng, làm TRƯỚC TIÊN.** Chỉ chạy biểu thức và **đếm tệp**
— ⛔ không viết bài kiểm, ⛔ không commit gì. Kết quả **đổi kế hoạch**:

| Đếm được | Hành động |
|---|---|
| ≤ 40 tệp | ✅ ⑭ giữ nguyên phạm vi, `Effort` hạ từ `L` xuống `M` |
| 40–100 | 🟠 thu hẹp: chỉ `*-client.tsx`, `components/` sang Phase 3 |
| > 100 | 🔴 **thiết kế lại** — báo Board, ⑭ có thể ⛔ không vào được Phase 2 |

Đây đúng `P-MEASURE` vế ①: **đo trước, quyết sau.** Chi phí ~30 phút; nó bảo
hiểm cho hạng mục đắt nhất Sprint.

### `O-2` `B2-5` là **giá trị cao nhất mà ⛔ không chặn điều kiện ra**

Điều kiện ra `E-2` — *"MD có bài kiểm nghiệp vụ"* — **đã đạt ở Phase 1**.
Warehouse thuộc **nội dung** Sprint *(EDD-06 §7)*, ⛔ **không** thuộc điều kiện ra.

Nhưng nó có **rủi ro `R-6` cao**: khả năng lộ lỗi công thức thật là **trung
bình–cao**, và MD đã cho một tiền lệ *(`readLegacyStatus` so với `'READY'`)*.
Lộ lỗi ở **cuối** Sprint ⇒ ⛔ không còn chỗ xoay.

⇒ **Đặt `B2-5` vào GIỮA, ⛔ không phải cuối.** Đủ sớm để xử lỗi phát sinh, đủ
muộn để ⛔ không chặn bốn mục `P0`.

### `O-3` 🔴 `G-A` là **điều kiện tiên quyết của cả Sprint**, ⛔ không phải của riêng `B2-3`

Backlog gốc ghi `G-A` là `Dependency` của `B2-3`. **Đọc lại thì chưa đủ mạnh:**

> Nếu Board chốt cách hiểu **`B`** *(xanh **và** ⛔ không còn nợ)*, thì `B2-3`
> **⛔ không bao giờ hoàn thành được** ⇒ `E-1` ⛔ không đạt ⇒ **cả Sprint I-2 ⛔
> không ra được** — kể cả khi `B2-1` `B2-2` `B2-4` `B2-5` đều xong hoàn hảo.

⇒ `G-A` ⛔ **không** phải phụ thuộc của một hạng mục. Nó quyết định **Sprint có
ra được hay không**, và phải trả lời **trước khi tiêu công sức**, ⛔ không phải
lúc nghiệm thu.

---

# PHẦN ③ · ĐỀ XUẤT THỨ TỰ TRIỂN KHAI

## 3.1 Thứ tự đề xuất

```
  ⓪  G-A          🔴 BOARD trả lời — TIÊN QUYẾT, ⛔ không phải hạng mục
      ────────────────────────────────────────────────────────────
  ①  B2-2a        SPIKE đo ⑭ — chỉ đếm tệp, ⛔ không viết mã
  ②  B2-1         ⑬ `.delete()` → danh sách miễn trừ
  ③  B2-2b        ⑭ cấm màn hình tự tính  (phạm vi do ① quyết)
  ④  B2-5         bộ kiểm nghiệp vụ Warehouse
  ⑤  B2-4         ⑯ hồ sơ 6 cổng Screen Design Gate
  ⑥  B2-3         ⑮ sổ `request_id`
  ⑦  B2-6         tách `md-client.tsx`      ← có thể HOÃN sang Phase 3
  ⑧  B2-7         tài liệu · báo cáo · khoá Phase 2
```

## 3.2 Lý do từng bước

| Bước | Vì sao ở ĐÂY, ⛔ không ở chỗ khác |
|---|---|
| **⓪ `G-A`** | 🔴 Quyết định **Sprint có ra được hay không** *(`O-3`)*. ⛔ Không phải việc của CSA. Rẻ nhất, ảnh hưởng lớn nhất ⇒ đứng trước mọi thứ |
| **① `B2-2a`** | Bảo hiểm cho hạng mục đắt nhất. ~30 phút, ⛔ không tạo tệp nào. **Kết quả đổi kế hoạch**, nên phải biết **trước** khi cam kết công sức. `P-MEASURE` vế ① |
| **② `B2-1`** | **Rẻ nhất · rủi ro thấp nhất · khuôn đã có từ ⑫.** Cho một *"phép kiểm mới"* vào sổ ngay, nâng `E-1` từ 1/5 lên 2/5. Và nó **đo được `TC-1`**: khi 4 lời gọi `.delete()` được chuyển sang xoá mềm, sổ rỗng ⇒ `TC-1` đóng. Thắng sớm, ⛔ không phải thắng dễ |
| **③ `B2-2b`** | Làm **ngay sau** spike lúc dữ liệu đo còn nóng. Giá trị cao nhất trong bốn phép kiểm — nó bắt **đúng lớp lỗi `TD-17`**, lớp mà Phase 1 vừa chứng minh là có thật và **chỉ bị bắt vì có người đọc mã** |
| **④ `B2-5`** | Đặt giữa vì `R-6`: khả năng lộ lỗi công thức thật **trung bình–cao**. Cần chỗ xoay nếu phải trình Board. Đặt cuối ⇒ lỗi lộ ra lúc ⛔ không còn thời gian |
| **⑤ `B2-4`** | Phần lớn là **lập sổ**, rủi ro kỹ thuật thấp. Đặt sau các mục rủi ro cao để nó thành **vùng đệm**: nếu ③ hoặc ④ tràn giờ, ⑯ vẫn kịp vì nó ⛔ không phụ thuộc gì |
| **⑥ `B2-3`** | **Cuối trong bốn phép kiểm** vì nó là mục duy nhất **có thể ⛔ không hoàn thành được** *(phụ thuộc `G-A`)*. Làm sớm ⇒ nếu Board chốt `B` thì công sức bỏ đi. Làm muộn ⇒ Sprint đã có 3–4 phép kiểm chắc chắn trong tay |
| **⑦ `B2-6`** | Đúng lý do Sprint mang tên *"Lưới an toàn"*: **dựng lưới xong rồi mới trèo.** Phụ thuộc mọi mục trước. Và nó là mục duy nhất **hoãn được mà ⛔ không ảnh hưởng điều kiện ra** — `F-8` cần người nghiệm thu mà CSA ⛔ không thay được |
| **⑧ `B2-7`** | Tài liệu chốt sau cùng, khi số liệu đã đứng yên |

## 3.3 Thứ tự này khác Backlog gốc ở ba chỗ

| # | Backlog gốc | **Đề xuất** | Vì sao đổi |
|---|---|---|---|
| 1 | `B2-2` là một hạng mục `L` | **Tách `B2-2a` spike + `B2-2b` thi hành** | Rủi ro `R-2` **cao** và ⛔ chưa đo. Đo trước 30 phút rẻ hơn phát hiện ở cuối Sprint |
| 2 | `B2-3` ở vị trí 4 *(theo số hiệu)* | **Xuống vị trí 6** | Nó là mục **duy nhất có thể ⛔ không hoàn thành được**. Xếp cuối trong nhóm phép kiểm để rủi ro quản trị ⛔ không chặn ba mục kia |
| 3 | `B2-5` ở vị trí 5 | **Lên vị trí 4** | `R-6` cần chỗ xoay. Và nó là mục **giá trị cao nhất** ⛔ không chặn điều kiện ra ⇒ đáng được thời gian tốt, ⛔ không phải thời gian thừa |

## 3.4 Ba mốc kiểm — dừng và báo Board

| Mốc | Sau bước | Điều kiện đi tiếp |
|---|---|---|
| `MS-1` | ① | Spike đếm **> 100 tệp** ⇒ 🔴 **DỪNG**, ⑭ thiết kế lại |
| `MS-2` | ③ | `E-1` đạt **3/5** · `test:arch` **0 hỏng** |
| `MS-3` | ⑥ | `E-1` đạt **5/5** ⇒ **mức *Cam kết*** — Sprint I-2 **ra được**, kể cả khi ⑦ hoãn |

🔑 **`MS-3` là điểm Sprint I-2 có thể đóng.** Bước ⑦ nằm **sau** nó có chủ ý:
`B2-6` là mục *"làm nếu còn chỗ"*, ⛔ không phải mục *"phải làm"*.

## 3.5 Nếu chỉ làm được một nửa

Thứ tự trên chịu được cắt ngang. Cắt sau bước ⑥ ⇒ **`E-1` 5/5, Sprint đóng
được**. Cắt sau ⑤ ⇒ 4/5, thiếu đúng mục phụ thuộc Board. Cắt sau ③ ⇒ 3/5.

⇒ **Mỗi bước đều để lại một hệ thống tốt hơn bước trước** — ⛔ không bước nào để
lại trạng thái dở dang ⛔ không dùng được.

---

# §4 · CHỖ TÔI CÓ THỂ SAI

1. 🔴 **Tôi ⛔ không đọc được log CI.** `§1.4` là `[PROVEN]` từ tiền đề đã đo,
   ⛔ **không** phải `[MEASURED]` trực tiếp. Lập luận đúng ⇒ kết luận đúng; nhưng
   nếu `run.mjs` có nhánh nào tôi đọc sót thì cả chuỗi sụp. **Một lệnh `gh` của
   người có quyền admin đóng được chỗ này** — §1.6.
2. **`CI-1` tôi phát hiện khi đọc `ci.yml`, ⛔ không phải khi tìm nó.** Nghĩa là
   ⛔ **có thể còn chỗ khác tương tự mà tôi chưa đọc tới.** Chưa ai rà soát toàn
   diện hạ tầng CI.
3. **Cột `Risk` và `Value` ở §2.2 là phán đoán, ⛔ không phải phép đo.** Chỉ
   `Effort` có căn cứ *(số dòng, khuôn có sẵn)*. Board xếp khác thì thứ tự đổi.
4. **Ngưỡng `40 / 100 tệp` ở `O-1` do tôi đặt.** Nó dựa trên nợ màu *(108 tệp)*
   và nợ chữ *(113 tệp)* — hai sổ đó **vẫn chưa trả nổi** sau nhiều tháng. Nếu
   Board thấy 100 tệp là chấp nhận được thì ngưỡng của tôi quá chặt.
5. **Tôi đề nghị phương án `B` cho `CI-1` vì nó giữ CI xanh.** Nhưng có một lập
   luận ngược đáng cân nhắc: phương án `A` *(chạy `npm test`, CI đỏ ngay)* làm
   **`TC-1` đau ngay lập tức**, và cái đau đó có thể là thứ duy nhất khiến nó
   được trả. Tôi chọn `B` vì `AC-3` và vì đèn đỏ vô thời hạn dạy người ta đọc
   lướt qua màu đỏ — nhưng **đây là phán đoán về con người, ⛔ không phải về hệ
   thống**, và Board có thể thấy khác.

---

## THAM CHIẾU

- [`SPRINT_I2_PHASE2_BACKLOG.md`](SPRINT_I2_PHASE2_BACKLOG.md) · [`SPRINT_I2_PHASE2_PLAN.md`](SPRINT_I2_PHASE2_PLAN.md)
- [`SPRINT_I2_PHASE1_REPORT.md`](SPRINT_I2_PHASE1_REPORT.md) 🔒
- [`GPR-001`](../audit/GOVERNANCE_PENDING_REPORT.md) `A-6` — cổng `G-A`
- [`TFC-001`](../audit/TECHNICAL_FOUNDATION_CERTIFICATE.md) R1 — `TC-1`…`TC-5`
- `.github/workflows/ci.yml` · `tests/run.mjs` · `package.json`
- GitHub Actions API — lượt #38…#48

> **Trạng thái:** ✅ **PHASE 2 READY — phát hành 05/08/2026.**
> ✅ `G-A` chốt cách hiểu `A` · ✅ `G-B` PASS · ✅ `CI-1` thi hành xong *(5/10 → 9/10)*.
> ⛔ **0 Technical Blocker · 0 cổng chặn.**
> 🟠 Còn `CI-2` — rủi ro có tên, ⛔ không chặn.
> 🔴 **CHƯA MỞ PHASE 2** — chờ Board phê duyệt cuối cùng trước khi viết mã.
