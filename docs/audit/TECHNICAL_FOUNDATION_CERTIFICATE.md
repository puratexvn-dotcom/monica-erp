# TECHNICAL FOUNDATION COMPLETION CERTIFICATE

| Trường | Giá trị |
|---|---|
| **Mã hồ sơ** | `TFC-001` |
| **Ngày phát hành** | 2026-08-05 |
| **Thẩm quyền** | **Board Decision 05/08/2026** — *"Tách Foundation thành Technical Foundation và Governance Foundation. Chỉ chặn Sprint khi còn tồn tại Technical Blocker."* |
| **Người phát hành** | Chief Solution Architect *([ADR-011](../adr/ADR-011-tham-quyen-kien-truc.md))* |
| **Hồ sơ nguồn** | [`FOUNDATION_CLOSURE_REPORT.md`](FOUNDATION_CLOSURE_REPORT.md) Revision 2 |
| **Hồ sơ song hành** | [`GOVERNANCE_PENDING_REPORT.md`](GOVERNANCE_PENDING_REPORT.md) — `GPR-001` |
| **Kết luận** | ✅ **TECHNICAL FOUNDATION COMPLETE** — 0 Technical Blocker |

---

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║          TECHNICAL FOUNDATION COMPLETION CERTIFICATE                     ║
║                        MONICA ONE                                        ║
║                                                                          ║
║              ✅   C Ó   H I Ệ U   L Ự C  ·  2026-08-05   ✅              ║
║                                                                          ║
║   Bối cảnh đo   mnxatxbadgrrolwpmxne · 2026-08-05T01:30Z                ║
║   Kho           54 migration · mới nhất 045 · 045b · 046                ║
║   Commit        4e69538d · nhánh main · cây làm việc sạch               ║
║                                                                          ║
║   ────────────────────────────────────────────────────────────────      ║
║   CỔNG KỸ THUẬT                                                          ║
║                                                                          ║
║    ✅  typecheck            sạch                                         ║
║    ✅  lint                 0 cảnh báo · 0 lỗi                           ║
║    ✅  test:arch            43 đạt · 0 hỏng                              ║
║    ✅  rls-external         người ngoài ⛔ không rò                       ║
║    ✅  md-read-matrix       90 đạt · 0 hỏng   (14 vai × 5 đối tượng)     ║
║    ✅  md-update-matrix     75 đạt · 0 hỏng                              ║
║    ✅  a001-runtime         23 đạt · 0 hỏng                              ║
║    ✅  costing-lifecycle    6 đạt · 0 hỏng · 2 ⚪ chưa đo được            ║
║    ✅  seed-integrity       đạt                                          ║
║    ✅  anon-and-buyer       đạt                                          ║
║    🟠  md-internal-scope    6 hỏng = 6 NGOẠI LỆ CÓ CHỦ Ý (TC-1)          ║
║                                                                          ║
║   ────────────────────────────────────────────────────────────────      ║
║   🔴 TECHNICAL BLOCKER CHO SPRINT I-2         ⛔  K H Ô N G   C Ó       ║
║   🟠 Technical Condition — chặn CỔNG SAU        3  (TC-1 · TC-2 · TC-3) ║
║                                                                          ║
║   ✅ SPRINT I-2 ĐƯỢC PHÉP KHỞI ĐỘNG.                                     ║
║                                                                          ║
║   Chief Solution Architect   ✅ ký · 2026-08-05                           ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

# §1 · ĐỊNH NGHĨA "TECHNICAL BLOCKER"

> Board ra luật *"chỉ chặn Sprint khi còn tồn tại Technical Blocker"*. Luật đó
> chỉ dùng được nếu **Technical Blocker có định nghĩa kiểm chứng được** — nếu
> không, mọi khoản nợ đều có thể bị gọi là blocker, hoặc ⛔ không cái nào bị gọi.

Một khuyết tật kỹ thuật là **Technical Blocker của Sprint `X`** khi thoả **ít
nhất một** trong ba:

| # | Điều kiện | Câu hỏi kiểm chứng |
|---|---|---|
| `TB-a` | **Làm công việc của Sprint `X` ⛔ không thực hiện được** | Gỡ khuyết tật này ra, Sprint `X` có làm được không? |
| `TB-b` | **Bị ĐÓNG BĂNG SÂU HƠN nếu Sprint `X` chạy** — làm tiếp khiến chi phí sửa tăng bậc | Sau Sprint `X`, sửa nó có đắt hơn hẳn không? |
| `TB-c` | **Là lỗ hổng ĐANG khai thác được trên hệ thống đang chạy**, ⛔ không có hàng rào nào khác | Hôm nay có ai làm được điều đó không? |

Khuyết tật **⛔ không** thoả điều nào ⇒ **Technical Condition** *(chặn một cổng
SAU, có tên, có chủ, có hạn)* hoặc **Technical Debt** *(có Sprint đích)*.

🔑 **Ba thứ ⛔ KHÔNG BAO GIỜ là Technical Blocker** — theo đúng Board Decision:
tài liệu chưa cập nhật · ADR chưa duyệt · certificate chưa phát hành.

---

# §2 · PHÂN LOẠI LẠI TOÀN BỘ PHÁT HIỆN

Mười sáu phát hiện kỹ thuật của `FCR-001` chạy qua ba câu hỏi `TB-a`/`TB-b`/`TB-c`:

| Phát hiện | `TB-a`? | `TB-b`? | `TB-c`? | Kết luận |
|---|---|---|---|---|
| `V-1` **`verify` đỏ** — 6 bảng còn `DELETE` | ⛔ không — viết bài kiểm ⛔ không cần quyền `DELETE` | ⛔ không | ⚠️ **có, nhưng bảng gần rỗng** | 🟠 **`TC-1`** — chặn **Cổng C** |
| `V-3` **Engine chưa kiểm trên aggregate thứ hai** | ⛔ không | ⛔ không — I-2 ⛔ không khai thêm aggregate | ⛔ không | 🟠 **`TC-2`** — chặn **I-4** |
| `TD-01` **`saveSizeBreakdown` bù trừ** | ⛔ không | ⛔ không | ⚠️ **cửa sổ hẹp, có bản vá bù trừ** | 🟠 **`TC-3`** — chặn **Cổng C** |
| `TD-17` **`late_milestones: 0`** | ⛔ không | ⛔ không | ⛔ không | ✅ **nằm TRONG phạm vi I-2** *(EDD-06 §7)* |
| `TD-18` `md-client.tsx` 886/900 | ⛔ không | ⚠️ nhẹ | ⛔ không | ✅ **trong phạm vi I-2** |
| `TD-19` `md-legacy-client` mã chết | ⛔ không | ⛔ không | ⛔ không | ⏳ TD — I-6 |
| `TD-25` 4 lời gọi `.delete()` | ⛔ không | ⛔ không | ⛔ không *(là nguyên nhân của `TC-1`)* | 🟠 gộp `TC-1` |
| `TD-26` quyền theo Vai ⛔ chưa theo Assignment | ⛔ không | ⛔ không | ⛔ không — RLS đang chặn đúng | ⏳ TD — I-3 |
| `TD-27` ngưỡng `.delete()` trong arch test | ⛔ không | ⛔ không | ⛔ không | ✅ **trong phạm vi I-2** |
| `TD-31` Data Egress Control | ⛔ không | ⛔ không | ⛔ không — đã là **giới hạn có tên** | ⏳ TD — Cổng D |
| `TD-32` SoD người lập = người duyệt | ⛔ không | ⛔ không | ⚠️ có, nhưng **trước `042` còn tệ hơn** | ⏳ TD — I-3 · cần ADR |
| `TD-33` bất biến ba tầng *(cháu)* | ⛔ không | ⛔ không | ⛔ không — `cut_bundles` chưa có vòng đời | ⏳ TD — I-4 |
| `V-4` MD ⛔ không có bài kiểm nghiệp vụ | ⛔ không | ⛔ không | ⛔ không | ✅ **CHÍNH LÀ điều kiện ra I-2** |
| `V-5` `TD-03` phép kiểm vốn từ | ⛔ không | ⛔ không | ⛔ không | ✅ **CHÍNH LÀ phạm vi I-2** |
| `V-7` Cổng D chưa dựng | ⛔ không | ⛔ không | ⛔ không | ⏳ Cổng D |
| `V-8` chưa đo hiệu năng trigger | ⛔ không | ⛔ không | ⛔ không | ⏳ TD — đo cùng `TC-2` |

## 2.1 Kết quả

```
🔴 Technical Blocker cho Sprint I-2  ⛔  K H Ô N G   C Ó
🟠 Technical Condition                  3   — TC-1 · TC-2 · TC-3
✅ Nằm TRONG phạm vi Sprint I-2         5   — TD-17 · TD-18 · TD-27 · V-4 · V-5
⏳ Technical Debt có Sprint đích        7
```

🔑 **Năm phát hiện nặng nhất của `FCR-001` hoá ra ⛔ không phải blocker — chúng
là ĐỀ BÀI của Sprint I-2.** `V-4` *(MD không có bài kiểm)* và `V-5` *(TD-03)* là
**điều kiện ra** của chính Sprint sắp khởi động. Chặn Sprint I-2 vì chúng là
**chặn một Sprint bằng chính mục tiêu của nó** — Board đúng khi bác.

---

# §3 · BA TECHNICAL CONDITION — CÓ TÊN · CÓ CHỦ · CÓ CỔNG

> ⛔ **Không** chặn Sprint I-2. **Có** chặn cổng ghi bên dưới. Ghi ở đây để
> chúng ⛔ không trôi mất giữa hai Sprint.

### `TC-1` 🟠 — 6 bảng còn quyền `DELETE` cứng

| | |
|---|---|
| **Đo được** | `md-internal-scope` hỏng **đúng 6 mục** = `costing_items` · `style_colorways` · `style_sizes` · `style_operations` · `order_size_breakdown` · `md_documents` |
| **Nguyên nhân** | 4 lời gọi `.delete()` còn sống trong mã ứng dụng |
| **Vì sao ⛔ không là blocker** | Sprint I-2 viết **bài kiểm**, ⛔ không nạp dữ liệu. 22/22 bảng khác đã thu hồi; `TRUNCATE` hở **0**; sổ kiểm toán bất biến |
| 🔴 **Chặn** | **Cổng C — nạp ~700 bản ghi dữ liệu chủ.** Sau lúc đó, xoá cứng là **mất dữ liệu thật** |
| **Cách trả** | 4 lời gọi → xoá mềm/RPC · thêm `deleted_at` cho `costing_items` ⇒ **đổi lược đồ ⇒ ADR riêng** |
| **Chủ** | CSA soạn · Board duyệt ADR |

### `TC-2` 🟠 — Tính generic của Engine là `[INFERRED]`

| | |
|---|---|
| **Đo được** | Engine phủ **2/88** aggregate. Ma trận: **24/88** có vòng đời · **≥17** có bảng con |
| **Vì sao ⛔ không là blocker** | Sprint I-2 ⛔ không khai thêm aggregate nào. Trên `costings`/`costing_items` engine `[MEASURED]` đúng, gồm cả phép phân biệt cascade |
| 🔴 **Chặn** | **Sprint I-4** — lúc khai `orders` và chuỗi vòng đời đơn hàng |
| **Cách trả** | Khai **một** aggregate dạng `L` có bảng con bằng metadata, chạy phép đo. ⚠️ **Phải sửa engine ⇒ luận điểm generic đã sai ⇒ quay lại ADR-019 §4** |
| **Chủ** | CSA |

### `TC-3` 🟠 — `saveSizeBreakdown` bù trừ thay cho giao dịch

| | |
|---|---|
| **Đo được** | `po.actions.ts:127` — xoá rồi ghi bằng **hai câu lệnh ⛔ không cùng giao dịch** |
| **Vì sao ⛔ không là blocker** | Có bản vá **chụp-và-khôi-phục**; hỏng cả hai thì **báo thẳng** thay vì im lặng. Bảng gần rỗng |
| 🔴 **Chặn** | **Cổng C** — cùng lý do `TC-1`: mất dữ liệu chỉ có nghĩa khi **có** dữ liệu |
| **Cách trả** | RPC `SECURITY DEFINER` làm cả xoá lẫn ghi trong **một** giao dịch, kèm 6 mục của `SECURITY_DEFINER_REGISTRY` |
| **Chủ** | CSA — cần migration |

> 🔑 **Cả `TC-1` và `TC-3` cùng chặn đúng một cổng: Cổng C.** Đó ⛔ không phải
> trùng hợp — cả hai đều là *"khuyết tật vô hại khi bảng rỗng"*. **Nạp dữ liệu
> chủ là thời điểm chúng đồng loạt trở thành thật.** Đề nghị Board xử **cùng một
> lượt**, ⛔ không tách.

---

# §4 · CĂN CỨ CHỨNG NHẬN — `[MEASURED]`

Toàn bộ số dưới đây **đo lại độc lập hôm nay**, ⛔ không chép từ hồ sơ cũ.

## 4.1 Cổng tĩnh

| Phép đo | Kết quả |
|---|---|
| `tsc --noEmit` | ✅ sạch — TypeScript strict, ⛔ 0 `any` |
| `next lint` | ✅ `No ESLint warnings or errors` |
| `npm run test:arch` | ✅ **43 đạt · 0 hỏng** — 11 nhóm luật |

## 4.2 Bề mặt bảo mật trên CSDL đang chạy

| Bất biến | Số | |
|---|---|---|
| `authenticated_only` còn lại | **0** / 22 | ✅ |
| `TRUNCATE` hở | **0** / 22 | ✅ |
| `DELETE` hở | **6** / 22 | 🟠 `TC-1` |
| `activity_log` — `UPDATE`/`DELETE`/`TRUNCATE` | **0** | ✅ BDR-14 thoả |
| View `anon` đọc được | **0** / 12 | ✅ ⭐ |
| Hàm `SECDEF` `anon` gọi được | **0** / 8 | ✅ |
| Hàm `SECDEF` thiếu `search_path` | **0** | ✅ |
| Vai nội bộ vẫn đọc được view · gọi được hàm | ✅ | ⭐ **⛔ không chặn phẳng** — `K-3` |

## 4.3 Phân quyền

| Ma trận | Kết quả |
|---|---|
| Đọc — 14 vai × 5 đối tượng, soi cả **cột** lẫn **dòng** | **90 đạt · 0 hỏng** |
| Ghi `UPDATE` — có vai `CHỜ THẤY > 0` mọi kịch bản | **75 đạt · 0 hỏng** |
| Người ngoài *(`buyer` · `subcon` · `anon`)* | ✅ ⛔ không rò |

## 4.4 Bất biến Aggregate

| Phép đo | |
|---|---|
| `DRAFT→SUBMITTED` · `SUBMITTED→APPROVED` · `APPROVED→SUPERSEDED` | ✅ chạy được — `B-1` đóng |
| Sửa giá chiết tính **đã duyệt** | ✅ bị chặn |
| Khoản mục bản **nháp** | ✅ vẫn sửa được |
| Khoản mục bản **đã duyệt** | ✅ bị khoá — **`B-3` đóng** |
| Engine ⛔ không `SECURITY DEFINER` | ✅ fail-closed |
| Phép phân biệt `ON DELETE CASCADE` | ✅ **`[MEASURED]`** — trigger `BEFORE DELETE` trên con **thấy** dòng cha đã biến mất |

---

# §5 · GIỚI HẠN CỦA CHỨNG NHẬN NÀY

> Ghi công khai. Chứng nhận có **biên**, và biên phải đọc được.

| # | Giới hạn |
|---|---|
| `L-1` | 🔴 **Chứng nhận PHẠM VI KỸ THUẬT.** Nó ⛔ **không** chứng nhận hồ sơ quản trị. Ba ADR chưa duyệt · 0 phản biện độc lập · SECURITY FREEZE chưa cắt — **⛔ không** được coi là đã giải quyết. Xem [`GPR-001`](GOVERNANCE_PENDING_REPORT.md) |
| `L-2` | **⛔ Không độc lập.** Người ký là người viết `042`…`046` và soạn ADR-018·019·020 |
| `L-3` | **⛔ Không đọc trực tiếp `pg_policies`** trong đợt này. Kết luận đến từ **hành vi đo được**. Hành vi đúng ⛔ không chứng minh biểu thức policy đúng — bài học `043` |
| `L-4` | **`npm run verify` vẫn ĐỎ.** Chứng nhận này ⛔ không làm nó xanh; nó **phân loại** màu đỏ đó là `TC-1` **có biên đo được**, ⛔ không phải "đã xong" |
| `L-5` | **2 mục `⚪ chưa đo được`** trong `costing-lifecycle` — hệ quả Board Decision `A1`, ⛔ không phải thiếu sót của bài kiểm |
| `L-6` | **Hiệu năng trigger `045`/`046` chưa đo** — `npm run bench` là phép **ĐO**, ⛔ không phải phép **KIỂM** |
| `L-7` | 🔴 **Chứng nhận HẾT HIỆU LỰC sau bất kỳ migration nào.** `P-MEASURE` vế ③ |

---

# §6 · HIỆU LỰC

| | |
|---|---|
| **Cho phép** | ✅ **Khởi động Sprint I-2** · viết bài kiểm · sửa lỗi đã đo · cập nhật tài liệu |
| **⛔ Không cho phép** | ⛔ Cổng C *(nạp dữ liệu chủ)* — chờ `TC-1` + `TC-3` · ⛔ khai thêm aggregate vào engine — chờ `TC-2` · ⛔ mở Domain/Module/bảng mới — SECURITY FREEZE còn hiệu lực |
| **Hết hiệu lực khi** | có migration mới chạy · `TC-1`/`TC-2`/`TC-3` đổi trạng thái · bộ kiểm đổi kết quả |
| **Phải cấp lại** | trước Cổng C và trước Sprint I-4 |

---

## THAM CHIẾU

- [`FOUNDATION_CLOSURE_REPORT.md`](FOUNDATION_CLOSURE_REPORT.md) Revision 2 — hồ sơ audit gốc
- [`GOVERNANCE_PENDING_REPORT.md`](GOVERNANCE_PENDING_REPORT.md) — `GPR-001`, phần còn thiếu
- [`ARCHITECTURE_BASELINE.md`](../ARCHITECTURE_BASELINE.md) §3.0 `P-MEASURE` · §3.2 lộ trình
- [EDD-06 §7](../enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) — nội dung Sprint I-2
- `tests/` 9 bài · `tests/_lib/harness.mjs`
