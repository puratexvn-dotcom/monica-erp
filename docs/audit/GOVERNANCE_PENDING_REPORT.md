# GOVERNANCE PENDING REPORT

| Trường | Giá trị |
|---|---|
| **Mã hồ sơ** | `GPR-001` |
| **Ngày lập** | 2026-08-05 |
| **Thẩm quyền** | **Board Decision 05/08/2026** — *"Nếu Governance còn thiếu, phát hành Governance Pending Report. Không chặn Sprint I-2 chỉ vì tài liệu, ADR hoặc certificate chưa hoàn tất."* |
| **Người lập** | Chief Solution Architect |
| **Hồ sơ song hành** | [`TECHNICAL_FOUNDATION_CERTIFICATE.md`](TECHNICAL_FOUNDATION_CERTIFICATE.md) — `TFC-001` ✅ ĐẠT |
| **Trạng thái** | 🟠 **GOVERNANCE PENDING** — 5 nhóm · 24 mục · ⛔ **0 mục chặn Sprint I-2** |

---

# §0 · TÀI LIỆU NÀY LÀ GÌ

Board đã quyết: **hồ sơ quản trị chưa xong ⛔ không chặn kỹ thuật.** Tôi thi
hành, và tôi đồng ý — với **một điều kiện**, chính là lý do tệp này tồn tại:

> **"⛔ Không chặn" ⛔ không có nghĩa là "⛔ không tồn tại".**
>
> Khoản nợ quản trị ⛔ không được chặn ai, nhưng nó **phải có tên, có chủ, có
> hạn, và có một chỗ ai cũng tra được**. Nếu không, sáu tháng nữa nó sẽ tái hiện
> thành câu hỏi ⛔ không ai trả lời được: *"vì sao CSDL đang ở trạng thái này?"*

Tệp này là **chỗ đó**. Nó ⛔ không xin phép, ⛔ không chặn gì. Nó **ghi sổ**.

---

# §1 · 🔴 NHÓM A — THỦ TỤC HIẾN ĐỊNH BỊ ĐẢO NGƯỢC

> Nhóm nghiêm trọng nhất. ⛔ Không chặn Sprint I-2 *(Board đã quyết)*, nhưng
> **để càng lâu càng khó gỡ** — vì mỗi migration mới lại chồng thêm một lớp lên
> hồ sơ chưa khép.

## `A-1` 🔴 Năm migration đang chạy sản xuất dưới ba ADR chưa phê duyệt

`[MEASURED]` — đọc trường **Trạng thái** của từng ADR:

| ADR | Trạng thái ghi trong tệp | Migration đã CHẠY |
|---|---|---|
| **ADR-018** | 🔴 *"MỞ LẠI 05/08/2026"* | `042` · `044` |
| **ADR-019** | ⏳ *"Chờ phản biện độc lập + Board phê duyệt"* — header còn ghi **"Migration ⛔ CHƯA VIẾT"** | `045` · `045b` |
| **ADR-020** | ⏳ *"Chờ phản biện + Board phê duyệt"* — header ghi **"`046` ⛔ chưa viết"**, §7 ghi **"⏳ CHƯA QUYẾT"** | `046` |

**Văn bản bị vượt:** Hiến pháp **Điều 4** · CLAUDE.md §3 *("không ngoại lệ")* ·
ADR-011 §2.2 · EDD-06 §10.

🔑 **Hệ thống đã tự phát hiện và tự ghi lại** — ADR-018 §12: *"SECURITY FREEZE
🔴 GIỮ NGUYÊN — Board không cắt `B2`"*; CHANGELOG:165: *"`042` chạy trước hai
điều kiện chính nó ghi ở đầu tệp"*. Trung thực đã có. **Cái thiếu là khép.**

| | |
|---|---|
| **Chủ** | **Board** |
| **Việc** | Phán quyết ba ADR: duyệt · duyệt-có-điều-kiện · hoặc bác **kèm lệnh quay lui trên CSDL thật** |
| **Hạn đề nghị** | trước **Cổng C** |
| **Nếu ⛔ không làm** | Hồ sơ ⛔ không chứng minh được vì sao CSDL đang ở trạng thái này. Rủi ro ⛔ không phải kỹ thuật — là **truy vết** |

> ⚠️ **Nói rõ để Board quyết trên sự thật:** `042`·`044`·`045`·`045b`·`046`
> **đều đúng về kỹ thuật** và đã thu hẹp bề mặt tấn công một cách đo được. Bác
> chúng sẽ làm hệ thống **kém an toàn hơn hôm nay**. Đề nghị của tôi là **phê
> chuẩn hồi tố**, ⛔ không phải quay lui.

## `A-2` 🔴 ⛔ Không có phản biện độc lập nào tồn tại

| Hạng mục | Hồ sơ | Người phản biện |
|---|---|---|
| ADR-018 | `ADR-018-review.md` | 🔴 tự khai **"KHÔNG CÓ"** — tự phản biện |
| ADR-019 | `ADR-019-architecture-review.md` | ⏳ tự khai **"chưa có"** |
| **ADR-020** | ⛔ **⛔ KHÔNG CÓ TỆP NÀO** | — |

ADR-011 §1.3 chỉ định **ChatGPT**. §1.2 nêu lý do: *"Một tác nhân tự tuyên bố
mình thắng trong tranh chấp thẩm quyền của chính mình là xung đột lợi ích, **bất
kể lập luận có hợp lý đến đâu**."*

🔴 **ADR-020 nặng nhất** — ADR duy nhất ⛔ không có cả tự phản biện, trong khi nó
mở trigger sang **bảng con của mọi aggregate**. *(Kỹ thuật thì `TC-2` của
`TFC-001` đã khoanh vùng rủi ro này và nó ⛔ không chặn I-2.)*

| **Chủ** | ChatGPT · Board điều phối | **Hạn** | trước Sprint I-4 |
|---|---|---|---|

## `A-3` 🔴 SECURITY FREEZE — mở trên giấy, bị vượt trên thực tế

`MOS §XI.1` còn hiệu lực. Cổng B `B2` *(cắt vòng khoá `031d`–`031g`)* **chưa
cắt**. Baseline §3.1 viết: *"⛔ Không cắt thì ⛔ không migration nào chạy được."*
**Năm migration đã chạy.**

| **Chủ** | **Board** | **Việc** | Cắt **hoặc** gia hạn — **bằng văn bản** |
|---|---|---|---|

> 🔑 Một luật ⛔ không ai tuân mà cũng ⛔ không ai gỡ sẽ làm **mọi luật còn lại
> mất trọng lượng**. Đây là rủi ro nghiêm trọng nhất của cả tệp này, và nó ⛔
> không đo được bằng bài kiểm nào.

## `A-4` 🔴 ⛔ Không có thời hạn phản biện tối đa — Cổng B `B5`

`A-2` và `A-4` **khoá lẫn nhau**: chưa có thời hạn ⇒ một người phản biện im lặng
chặn vô thời hạn; bỏ qua phản biện ⇒ `A-1` lặp lại — **và nó đã lặp 5 lần**.

| **Chủ** | **Board** | **Việc** | Định số ngày cụ thể + quy tắc mặc định khi hết hạn |
|---|---|---|---|

## `A-5` 🟠 Cổng B — 4/6 mục còn mở

`B1` ✅ · `B6` ✅ · **`B2`** 🔴 · **`B3`** 🟡 *(gộp 3 chuỗi ADR)* · **`B4`** 🔴
*(người thứ hai cho `SOD-H04`·`H05`·`H06` — **Joseph**)* · **`B5`** 🔴

---

# §2 · 🔴 NHÓM B — TÀI LIỆU CHUẨN TẮC LỆCH KHỎI HIỆN THỰC

> ⛔ Không chặn Sprint. **Nhưng `B-1`…`B-6` làm được ngay hôm nay, ⛔ không chờ
> ai, ⛔ không chạm mã, ⛔ không chạm CSDL.** Đây là nhóm rẻ nhất trong cả tệp.

| # | Tài liệu | Lệch gì | Chủ |
|---|---|---|---|
| `B-1` 🔴 | **`PROJECT_MEMORY.md`** | §2.3 ghi *"ADR — **11 bản**"*, **thiếu hẳn ADR-018·019·020** · §8 `KD-2` và §9 mục 1 còn ghi *"`VR-001` chưa chạy"* trong khi nó **đã chạy** và Baseline `B1` ✅ · §12 lệch Baseline *(13/14 EDD · ~208/~226 màn hình · 9/11 mục mở)* · §11.1 nhật ký dừng ở `1.0` | CSA |
| `B-2` 🔴 | **`ARCHITECTURE_BASELINE.md`** | ⛔ **0 lần nhắc** ADR-019 · ADR-020 · `044` · `045` · `045b` · `046`. Còn ghi *"ADR 15 tài liệu · 14 số hiệu"*; kho thật **18 tài liệu · 17 số hiệu** | CSA |
| `B-3` 🔴 | **`MIGRATION_INDEX.md`** | ⛔ **Không dòng nào** cho `040`·`041`·`042`·`044`·`045`·`045b`·`046`, và 🔴 **⛔ không dòng nào cho `043`** — số hiệu **đã tiêu thụ trên CSDL sản xuất** rồi thu hồi. Quy tắc §6.3 của chính tệp: *"khoảng trống ⛔ không có lý do là một khoản nợ tài liệu"* | CSA |
| `B-4` 🔴 | **`RLS_COVERAGE_MATRIX.md`** | nhật ký dừng ở `042`; ⛔ không ghi `044` *(policy)*, `045`/`046` *(tầng trigger — nay là **một phần bề mặt bảo vệ ghi**)*. CLAUDE.md §3 bắt buộc | CSA |
| `B-5` 🔴 | **`CHANGELOG.md`** · **`docs/adr/README.md`** | Changelog dừng ở `042` · mục lục ADR thiếu 019·020 và còn ghi `042` *"(chưa viết)"* | CSA |
| `B-6` 🔴 | **`CLAUDE.md`** | bảng thứ bậc ghi Hiến pháp **`v1.5`**, khối Freeze cùng tệp ghi **v1.6**, `00-CONSTITUTION.md:6` ghi **1.6** — **tệp khởi động của mọi phiên đang tự mâu thuẫn về văn bản bậc 1**. Kèm `TD-28` *(trích sai `MOS §XI.1` thành "Hiến pháp XI.1")* | CSA |
| `B-7` 🔴 | **`TECHNICAL_DEBT.md`** | tự khai `TD-30`: nợ vỡ **5 nơi cấp số**, `TD-13` mang **hai nghĩa**, `TD-25`…`TD-33` ⛔ không có trong sổ. **Đã va chạm số hiệu 3 lần** | CSA + Board |
| `B-8` 🟠 | **`docs/review/README.md`** | bảng *"Sổ hồ sơ"* ghi **"(chưa có)"** trong khi đã có **2 hồ sơ** — quy tắc `R-1` của chính tệp ⛔ không được thi hành | CSA |
| `B-9` 🟠 | **`SPRINT_2_PLAN.md`** 4.1 | đề xuất soạn *"ADR-014"* — **số dành riêng, ⛔ không tái sử dụng** *(Hiến pháp §37.5)* | CSA |
| `B-10` 🟠 | **`BKB.md:463`** | bậc 0′ **ADOPTED** còn chứa phát biểu `VR-001` **đã bị bác bỏ**; mới gắn đính chính tại chỗ ⇒ `TD-29` | Board |

> 🔑 **`B-1` là mục đắt nhất nếu ⛔ không trả.** `PROJECT_MEMORY` là **cửa vào
> duy nhất** *(Baseline §3.3 bước ①)*. Nó sai ⇒ **mọi phiên làm việc mới khởi
> động bằng tiền đề sai** — **đúng sự cố ADR-010 đã phải sửa một lần rồi**, và
> lần đó cái sai đã sống qua nhiều phiên trước khi bị bắt.

---

# §3 · 🟠 NHÓM C — SỔ ĐĂNG KÝ ⛔ CHƯA ĐẦY ĐỦ

| # | Nội dung | Chủ |
|---|---|---|
| `C-1` | Số hiệu `TD` cấp ở **5 nơi** — cần **một sổ cấp số tập trung** cho `TD` · `VR` · `BDR` | Board |
| `C-2` | Hai `ADR-001` khác nhau *(`architecture/adr/` và `assignment/`)* — `B3` · `TD-23` | CSA + Board |
| `C-3` | `012`·`013`·`014` là số **đặt chỗ ⛔ không tái sử dụng** — chưa được ghi vào một nơi cưỡng chế được *(arch test hiện chỉ bắt **trùng** số, ⛔ không bắt **tái dùng số đã đặt chỗ**)* | CSA |

---

# §4 · 🟡 NHÓM D — QUYẾT ĐỊNH NGHIỆP VỤ CÒN CHỜ

| # | Nội dung | Chặn |
|---|---|---|
| `D-1` | `OQ-A` khấu trừ · `OQ-B` điều kiện thanh toán · `OQ-C` công nợ nhà thầu · `OQ-D` MISA bản nào · `OQ-E` NCC kiêm nhà thầu | **Cổng C** |
| `D-2` | Ngưỡng cụ thể *(giá trị duyệt · % NPL · SLA)* | Cổng C |
| `D-3` | ADR-020 §6.3 — **`mutable_after_final` của bảng con để RỖNG**: chứng từ đã duyệt thì khoản mục **bất động hoàn toàn**. Nếu nghiệp vụ cần sửa ghi chú khoản mục thì giả định này **sai** | Board / BKB |
| `D-4` | Hệ quả Board Decision `A1` — **nội dung bản `SUPERSEDED` sửa được**. Đã ghi `⚪ chưa đo được`, Board đã biết | Board |

---

# §5 · 🟠 NHÓM E — HẠNG MỤC CẦN ADR RIÊNG

> Ghi ở đây để chúng ⛔ không bị làm lén qua đường sửa mã — `AC-1`.

| # | Hạng mục | Vì sao cần ADR |
|---|---|---|
| `E-1` | **`TC-1`** — thêm `deleted_at` cho `costing_items` | đổi **lược đồ** |
| `E-2` | **`TD-32`** — SoD người lập ≠ người duyệt chiết tính | đổi **mô hình phân quyền** |
| `E-3` | **`TC-3`** — RPC `SECURITY DEFINER` cho `saveSizeBreakdown` | thêm hàm `SECDEF` ⇒ `SECURITY_DEFINER_REGISTRY` |
| `E-4` | **State Transition Registry** *(`TD-03`/`TD-24`)* — 8 bộ từ vựng ⛔ không luật chuyển | đổi **domain model** ⚠️ `SPRINT_2_PLAN` gọi nó là *"ADR-014"* — **số đã đặt chỗ**, phải cấp số mới |

---

# §6 · SỔ THEO DÕI — DÙNG LÀM CỔNG KIỂM

| # | Mục | Chủ | Hạn đề nghị | Chặn cổng nào |
|---|---|---|---|---|
| `A-1` | Phán quyết ADR-018·019·020 | Board | trước Cổng C | *(⛔ không chặn I-2)* |
| `A-2` | Phản biện độc lập ADR-020 | ChatGPT | trước I-4 | cùng `TC-2` |
| `A-3` | Cắt/gia hạn SECURITY FREEZE | Board | trước Cổng C | mở Domain/Module mới |
| `A-4` | Thời hạn phản biện tối đa | Board | **ngay** | mở khoá `A-2` |
| `A-5` | `B4` — người thứ hai `SOD-H04·05·06` | Joseph | trước Cổng C | 3 chặn cứng SoD |
| `B-1`…`B-6` | Đồng bộ 6 tài liệu chuẩn tắc | CSA | **ngay — làm được hôm nay** | ⛔ không chặn gì |
| `B-7` | Gộp sổ nợ | CSA + Board | trước I-3 | ⛔ không chặn |
| `C-1`…`C-3` | Sổ cấp số | Board | trước I-3 | ⛔ không chặn |
| `D-1`…`D-2` | 5 `OQ` + ngưỡng | Board | **Cổng C** | 🔴 Cổng C |
| `D-3`·`D-4` | Giả định ADR-020 · hệ quả `A1` | Board | trước I-4 | ⛔ không chặn |
| `E-1`…`E-4` | Bốn ADR mới | CSA soạn · Board duyệt | theo cổng tương ứng | Cổng C · I-3 · I-4 |

**24 mục · ⛔ 0 mục chặn Sprint I-2 · 7 mục chặn Cổng C · 4 mục chặn Sprint I-4.**

---

# §7 · CHỖ TÔI CÓ THỂ SAI

1. **Tôi là người gây ra phần lớn nhóm A.** Tôi soạn cả ba ADR và viết cả năm
   migration. Bản báo cáo này ⛔ không độc lập, và một người phản biện thật có
   thể xếp nhóm A **nặng hơn** tôi đã xếp.
2. **Tôi đã kiến nghị `NOT COMPLETE` và Board bác.** Board đúng ở chỗ tôi sai:
   tôi đã **trộn hai loại rủi ro khác hẳn nhau** — kỹ thuật và quản trị — rồi để
   loại thứ hai chặn loại thứ nhất. `V-4` và `V-5` mà tôi xếp là *"gap"* hoá ra
   **chính là đề bài của Sprint I-2**; chặn Sprint vì chúng là chặn một Sprint
   bằng mục tiêu của chính nó.
3. **Hạn đề nghị ở §6 là phán đoán của tôi**, ⛔ không phải phép đo. Board đặt
   lại hạn thì hạn của Board thắng.
4. **Danh sách ⛔ có thể chưa đủ** — tôi rà theo tài liệu; khuyết tật ⛔ không
   được ghi ở đâu thì báo cáo này ⛔ không thấy. `B-7` *(sổ nợ vỡ 5 nơi)* làm rủi
   ro này cao hơn bình thường.

---

## THAM CHIẾU

- [`TECHNICAL_FOUNDATION_CERTIFICATE.md`](TECHNICAL_FOUNDATION_CERTIFICATE.md) — `TFC-001` ✅
- [`FOUNDATION_CLOSURE_REPORT.md`](FOUNDATION_CLOSURE_REPORT.md) Revision 2
- [ADR-011](../adr/ADR-011-tham-quyen-kien-truc.md) §1.2 · §1.3 · §2.2 · §4.2
- [`ARCHITECTURE_BASELINE.md`](../ARCHITECTURE_BASELINE.md) §3.1 Cổng B
- [EDD-06 §10](../enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md)

> **Trạng thái:** 🟠 **PENDING** — ⛔ không chặn Sprint I-2 *(Board Decision
> 05/08/2026)*. Cập nhật mỗi khi một mục đổi trạng thái.
