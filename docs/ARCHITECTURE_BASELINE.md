# MONICA ONE · ARCHITECTURE BASELINE
## Architecture Freeze Certificate · Baseline Closure · Implementation Ready

| Trường | Giá trị |
|---|---|
| **Mã baseline** | `MONICA-ONE-BASELINE-2026-08-04` |
| **Ngày phát hành** | 2026-08-04 |
| **Người phát hành** | Chief Enterprise Architect *(thẩm quyền [ADR-011](adr/ADR-011-tham-quyen-kien-truc.md) ✅ APPROVED)* |
| **Phê chuẩn** | Architecture Board — Board Decision 04/08/2026 |
| **Trạng thái** | 🔒 **ARCHITECTURE FROZEN · IMPLEMENTATION READY** |
| **Chỉ mục** | [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md) |
| **Tu chính** | **R1 · 2026-08-05** — xem khối ngay dưới |

---

# §0 · TU CHÍNH R1 — 2026-08-05

> ⚠️ **§1 Freeze Certificate bên dưới GIỮ NGUYÊN VĂN.** Board đã ký nó ngày
> 04/08; Hiến pháp Điều 43.7 cấm viết lại lịch sử. Khối này **thêm vào**.

## 0.1 Board Decision 05/08/2026 — Foundation tách làm hai

```
Technical Foundation    ✅ COMPLETE   TFC-001 · 0 Technical Blocker
Governance Foundation   🟠 PENDING    GPR-001 · 24 mục · 0 mục chặn Sprint I-2

⛔ Tài liệu · ADR · certificate chưa hoàn tất KHÔNG chặn Sprint.
   Chỉ TECHNICAL BLOCKER mới chặn.
```

Định nghĩa **Technical Blocker** *(`TFC-001` §1)*: `TB-a` làm Sprint ⛔ không
thực hiện được · `TB-b` bị đóng băng sâu hơn nếu Sprint chạy · `TB-c` lỗ hổng
**đang** khai thác được, ⛔ không hàng rào nào khác.

- ✅ [`TECHNICAL_FOUNDATION_CERTIFICATE.md`](audit/TECHNICAL_FOUNDATION_CERTIFICATE.md)
- 🟠 [`GOVERNANCE_PENDING_REPORT.md`](audit/GOVERNANCE_PENDING_REPORT.md)
- 📄 [`FOUNDATION_CLOSURE_REPORT.md`](audit/FOUNDATION_CLOSURE_REPORT.md) Revision 2

## 0.2 Bổ sung vào Baseline — thứ §1 và §6 ⛔ chưa biết

| Hạng mục | Baseline gốc | **Nay** |
|---|---|---|
| **ADR** | 15 tài liệu · 14 số hiệu | **18 tài liệu · 17 số hiệu** — thêm **ADR-018 · 019 · 020** *(cả ba ⏳ **chưa duyệt**)* |
| **Migration đã chạy** | tới `040` | **`041` `042` `044` `045` `045b` `046`** · `043` **đã chạy rồi thu hồi** |
| **Khuyết tật đã biết** | 13 | **11** — `KD-2` · `KD-3` đóng 05/08 |
| **Mục còn mở** | 11 | **11** — `VR-001` đóng, +3 mục Board *(ADR · freeze · phản biện)* |
| **Phép đo tĩnh** | 43 | **110** — 51 kiến trúc + 59 nghiệp vụ MD |

🔴 **Năm migration đang chạy sản xuất dưới ba ADR chưa phê duyệt, ⛔ không ADR
nào có phản biện độc lập.** Hiến pháp **Điều 4** · ADR-011 §2.2. Theo dõi ở
`GPR-001` §1 nhóm `A`; **chặn Cổng C**, ⛔ **không** chặn Sprint I-2.

## 0.3 Ba Technical Condition — chặn cổng SAU, ⛔ không chặn I-2

| # | Nội dung | Chặn |
|---|---|---|
| `TC-1` | 6 bảng MD còn quyền `DELETE` cứng *(`TD-25`)* — 4 lời gọi `.delete()` còn sống | 🔴 **Cổng C** |
| `TC-2` | Tính **generic** của Aggregate Immutability Engine là `[INFERRED]` — mới phủ **2/88** aggregate | 🔴 **Sprint I-4** |
| `TC-3` | `saveSizeBreakdown` bù trừ thay cho giao dịch *(`TD-01`)* | 🔴 **Cổng C** |

> 🔑 `TC-1` và `TC-3` cùng chặn **Cổng C** — cả hai là *"khuyết tật vô hại khi
> bảng rỗng"*. **Nạp dữ liệu chủ là thời điểm chúng đồng loạt trở thành thật.**

## 0.4 Tiến độ Sprint I-2

| Điều kiện ra *(§3.2)* | Trạng thái |
|---|---|
| `test:arch` có đủ **5 phép kiểm mới** | 🟠 **3/5** — ⑫ *(vốn từ, `TD-03`)* · ⑬ *(miễn trừ xoá cứng, `TD-27`)* · ⑭ *(màn hình tự tính, `G6`)* |
| **MD có bài kiểm nghiệp vụ** | ✅ **ĐẠT** — 59 phép đo |

**Phase 1 🔒 ĐÃ KHOÁ 05/08/2026** — [`SPRINT_I2_PHASE1_REPORT.md`](planning/SPRINT_I2_PHASE1_REPORT.md).
**Phase 2 ⏳ chờ Board mở** — [`SPRINT_I2_PHASE2_PLAN.md`](planning/SPRINT_I2_PHASE2_PLAN.md) ·
[`SPRINT_I2_PHASE2_BACKLOG.md`](planning/SPRINT_I2_PHASE2_BACKLOG.md).

## 0.5 🔴 Technical Condition: 3 → 5

Phép kiểm ⑫ *(Phase 1)* lộ ra **hai chỗ lệch có sẵn từ migration `002` và `024`**
— ⛔ không phải khuyết tật mới, chỉ là **nay nhìn thấy được**:

| # | Nội dung | Chặn |
|---|---|---|
| **`TC-4`** | `orders.status` ⛔ **không có ràng buộc `CHECK`** — vốn từ chỉ sống trong một dòng chú thích liệt kê 4 giá trị, mã khai 6 | 🔴 **Cổng C** |
| **`TC-5`** | Mã ⛔ **không biểu diễn nổi một lô hàng đã huỷ** — `SHIPMENT_FLOW` thiếu `CANCELLED` | 🔴 **Sprint I-7** |

⇒ **`TC-1` · `TC-3` · `TC-4` cùng chặn Cổng C**, cùng một lý do: *khuyết tật vô
hại khi bảng rỗng*. Nạp dữ liệu chủ là lúc cả ba đồng loạt trở thành thật.

## 0.6 ✅ ĐỊNH NGHĨA *"5 PHÉP KIỂM MỚI"* — Board chốt 05/08/2026

> **Board Decision 05/08/2026 — cách hiểu `A`.** Khép `GPR-001` `A-6`.

Một *"phép kiểm mới"* của điều kiện ra §3.2 được coi là **HOÀN THÀNH** khi thoả
**cả ba**:

```
① ĐÃ ĐƯỢC XÂY DỰNG
② CHẠY ĐƯỢC
③ PASS theo tiêu chí của Sprint
```

🔑 **⛔ KHÔNG đòi phải xử xong toàn bộ Technical Debt hoặc Governance Pending
cùng lúc.** Sổ nợ **có tên, có chủ, có hạn** ⛔ không làm một phép kiểm mất tư
cách hoàn thành — đó chính là **cơ chế bánh cóc** mà ⑨ ⑩ ⑫ đã dùng.

**Hệ quả trực tiếp:** phép kiểm ⑮ *(`request_id`)* **hoàn thành được** dù 7 bảng
còn nợ chờ migration `033` — vì `033` bị chặn bởi vòng khoá `B2`, một thứ nằm
**ngoài** Sprint. Cách hiểu `B` sẽ khiến Sprint I-2 ⛔ không ra được vì lý do
⛔ không thuộc về nó.

⚠️ **Ghi ở đây để lần sau ⛔ không phải hỏi lại** — §3.2 đọc kèm khoản này.

---

# §1 · ARCHITECTURE FREEZE CERTIFICATE

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                 ARCHITECTURE FREEZE CERTIFICATE                           ║
║                          MONICA ONE                                       ║
║                                                                           ║
║              🔒  C Ó   H I Ệ U   L Ự C  ·  2026-08-04  🔒                 ║
║                                                                           ║
║  Baseline ID        MONICA-ONE-BASELINE-2026-08-04                        ║
║  Constitution       v1.6 ADOPTED · 45 Điều · 8 Phần                       ║
║  Business Knowledge v2.0 ADOPTED · 60 quy tắc nghiệp vụ                   ║
║  ADR                15 tài liệu · 14 số hiệu · tất cả APPROVED            ║
║                     (012–014 đặt chỗ, chưa ban hành — không tái sử dụng)  ║
║  Enterprise Design  EDD-01 … EDD-06 · 14 tài liệu                         ║
║  Decision Log       DL-001 … DL-149 · 149 quyết định                      ║
║  Board Decision     BDR-01 … BDR-29 · 29 quyết định                       ║
║  Design Principles  P-COMMIT · P-IRREV · P-ATTRIB · P-ZEROMAN · P-ZERODUP ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║  ĐIỀU KIỆN CỔNG A — HOÀN TẤT                                              ║
║                                                                           ║
║   ✅ A1  ADR-015  14 Business Workspace              APPROVED             ║
║   ✅ A2  ADR-016  Enterprise Control Center          APPROVED             ║
║   ✅ A3  ADR-017  Trang chủ hai vùng                 APPROVED             ║
║   ✅ A4  BKB v2.0                                    ADOPTED              ║
║   ✅ A5  ADR-011  Thẩm quyền kiến trúc               APPROVED             ║
║   ✅ A6  Board ký chứng nhận                         04/08/2026           ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║  KẾT QUẢ KIỂM TOÁN NHẤT QUÁN  ·  ~2.100 cặp đối chiếu                     ║
║                                                                           ║
║   🟢 Nhất quán nội bộ            149 quyết định · 0 xung đột              ║
║   🟢 Nhất quán với Hiến pháp     3 mâu thuẫn → 3 ADR → đã giải            ║
║   🟢 ⛔ Không Capability lặp      93 L2                                    ║
║   🟢 ⛔ Không Business Object lặp 88 aggregate · mỗi cái 1 chủ             ║
║   🟢 ⛔ Không Module chồng chéo   78 Module · MOD-1 cưỡng chế              ║
║   🟢 ⛔ Không Workflow mâu thuẫn  4 nguyên mẫu · guard là RuleRef          ║
║   🟢 ⛔ Không Permission mâu thuẫn 6 scope × 6 disclosure × 5 category     ║
║   🟢 ⛔ Không Domain sai ranh giới nguyên tắc thì-của-động-từ              ║
║   🟢 ⛔ Không tài liệu lỗi thời   5 tài liệu đã gắn nhãn thay thế          ║
║   🟢 8 lỗi tài liệu              đã sửa · 5 errata ban hành               ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  🔒 KIẾN TRÚC ĐƯỢC KHOÁ.                                                  ║
║                                                                           ║
║  Từ thời điểm này, mọi thay đổi kiến trúc phải đi qua                     ║
║  ARCHITECTURE CHANGE PROCEDURE — EDD-06 §10.                              ║
║                                                                           ║
║  ⛔ KHÔNG được thay đổi kiến trúc trực tiếp bằng mã.                       ║
║  ⛔ Phát hiện vấn đề khi lập trình ⇒ CẬP NHẬT TÀI LIỆU TRƯỚC.              ║
║                                                                           ║
║  Chief Enterprise Architect   ✅ ký · 2026-08-04                           ║
║  Architecture Board           ✅ ký · 2026-08-04                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

# §2 · BASELINE CLOSURE

## 2.1 Thành phần Baseline — đóng ở đây

| Tầng | Nội dung | Số | Trạng thái |
|---|---|---|---|
| **0** | Board Decision | 29 | 🔒 khoá |
| **0′** | Business Knowledge Base v2.0 | 60 quy tắc `BR-*` | 🔒 khoá |
| **1** | Constitution v1.6 | 45 Điều · 8 Phần | 🔒 khoá |
| **2** | ADR | **15 tài liệu · 14 số hiệu** | 🔒 khoá |
| **2′** | Enterprise Design | 14 tài liệu · 149 `DL` | 🔒 khoá |
| **—** | Design Principles | 5 | 🔒 khoá |

## 2.2 Nội dung kiến trúc đã khoá

| Hạng mục | Số | Ghi chú |
|---|---|---|
| **Business Domain** | **14** *(+4 DORMANT)* | ADR-015 |
| **Shared Kernel** | 9 | ⛔ không là Workspace |
| **Business Capability L2** | 93 | EDD-01 §2 |
| **Business Object** | ~88 | mỗi cái đúng **một** Domain sở hữu |
| **Master Data** | ~65 | 4 tầng T0–T3 |
| **Loại chứng từ** | 76 | 24 chứng từ VÀO |
| **Object Control Tower** | 9 | 11 lớp Context Rail thống nhất |
| **Module** | 78 | + 9 Shared · 8 Cross-cutting · 7 Infrastructure |
| **Màn hình** | ~226 | 196 nội bộ + 30 cổng đối tác |
| **Workflow nguyên mẫu** | 4 | Lifecycle · Approval · Orchestration · Case |
| **Loại quy tắc** | 7 | một sổ đăng ký, bảy bộ đánh giá |
| **Chiều phạm vi quyền** | 6 | Tenant là lớp ngoài cùng |
| **Lớp tiết lộ** | 6 | mặc định `INTERNAL_ONLY` |
| **Loại dữ liệu** | 5 | Customer · Partner · Monica · Legal · AI |
| **Quy tắc chặn cứng SoD** | 9 | `SOD-H01`…`SOD-H09` |
| **Portal độc lập** | 3 | Customer · Subcontract · Supplier |

## 2.3 🔒 KHOÁ ⟷ 🔓 MỞ

| 🔒 **KHOÁ — cần ADR + Board Decision** | 🔓 **MỞ — cấu hình được** |
|---|---|
| 14 Business Domain + ranh giới sở hữu | Domain nào `ACTIVE`/`EMBEDDED`/`DORMANT` |
| 9 Shared Kernel | Ngưỡng · giá trị · % · SLA |
| 88 Business Object + aggregate boundary | Mẫu lịch T&A · chặng kiểm · `ProcessRoute` |
| Tập trạng thái + **phép chuyển hợp lệ** | Ai giữ Role nào |
| 6 lớp tiết lộ · 6 chiều phạm vi · 5 loại dữ liệu | Luật sinh việc Work Inbox |
| 9 `SOD-H*` chặn cứng | Nhãn hiển thị · ngôn ngữ · lịch nhà máy |
| 5 nguyên tắc + cổng kiểm 6 câu | Bố cục dashboard · ngưỡng KPI |
| 3 Portal + phép chiếu tiết lộ | Mức tiết lộ *(qua cổng L2 có 8 cơ chế)* |
| 4 nguyên mẫu Workflow · 7 loại Rule | Nội dung Workflow · Rule cụ thể |
| OCT 11 lớp Context Rail | Lens Tabs của từng OCT |
| **19 quyết định chịu lực** *(Project Memory §5.1)* | 82 quyết định dễ rút |

---

# §3 · IMPLEMENTATION READY

## 3.0 🔑 NGUYÊN TẮC KIỂM CHỨNG — `P-MEASURE`

> **Ban hành:** Board Directive 05/08/2026 mục 6. Ràng buộc **mọi** thay đổi
> chạm Security · RLS · Permission · Policy · Database.

```
① Đo trước, kết luận sau.
   Suy diễn từ biểu thức policy KHÔNG phải bằng chứng.

② Mọi phép đo phải ghi rõ: trạng thái hệ thống · phiên bản migration ·
   dữ liệu kiểm thử · điều kiện đo.

③ Kết luận CHỈ có giá trị với ĐÚNG trạng thái đã được đo.
```

### Vì sao vế ② và ③ tồn tại — sự cố 05/08/2026

Vế ① một mình **không đủ**, và đây là bằng chứng:

| | Hành động | Kết quả |
|---|---|---|
| ① | Đọc biểu thức policy `042`, **suy diễn** ra hành vi, ghi lỗi 🔴 `B-1`, soạn `043` | lỗi **không có thật** |
| ② | `043` được chạy. **Đo thật** — thấy phép chuyển chạy được ⇒ rút lại `B-1`, xoá `043` | phép đo **đúng kỹ thuật**, nhưng đo một CSDL **đã bị chính bản vá của mình đổi** |
| ③ | Đo có kiểm soát trạng thái | `043` **đang mở lỗ hổng toàn phần** |

Sai lầm ② là sai lầm đắt nhất, và nó **đi lọt qua vế ①**: phép đo hoàn toàn
đúng. Cái sai là **không biết mình đang đo cái gì**.

### Thi hành bằng cơ chế, không bằng lời nhắc

`tests/_lib/harness.mjs` cung cấp:

| Hàm | Việc |
|---|---|
| `boiCanh()` | in **BỐI CẢNH ĐO** trước phép đo đầu: CSDL nào · thời điểm · **migration trong KHO** · số dòng từng bảng |
| `dauVan()` | ghi **dấu vân hành vi** — CSDL thật đang làm gì, đối chiếu được với kho |
| `ketThuc()` | in nhắc ở cuối: *"Kết luận trên CHỈ có giá trị với trạng thái đã ghi ở khối BỐI CẢNH ĐO"* |

🔑 **`boiCanh()` in migration trong KHO, không phải trong CSDL** — có chủ ý. Hai
thứ đó lệch nhau được, và ngày 05/08 chúng **đã** lệch. Đặt cạnh `dauVan()`, sự
lệch hiện ra trong một cái liếc: kho ghi `044` là tệp mới nhất, dấu vân báo
*"CSDL đang mang `043`"*.

---

## 3.1 🔴 Ba cổng còn lại — Cổng B, C, D

**Freeze đã có hiệu lực. Nhưng ba việc phải xong TRƯỚC dòng mã đầu tiên.**

### Cổng B — trước Implementation

| # | Hạng mục | Ai | Vì sao chặn |
|---|---|---|---|
| **B1** | ✅ **XONG 04/08/2026 — [`VR-001-KET-QUA.md`](audit/VR-001-KET-QUA.md)** | CSA | Đo bằng phiên đăng nhập thật, không bằng truy vấn tay. **Kết quả khác giả thuyết ban đầu:** người ngoài KHÔNG rò *(đính chính ở §1 tài liệu đó)*; nhưng **23 bảng cho mọi vai nội bộ xoá cứng**, và **`activity_log` sửa được** — vi phạm BDR-14 |
| **B2** | 🔴 **Cắt vòng khoá SECURITY FREEZE** | Board | `031d`–`031g` bị chặn vì *"bảng còn 0 dòng"*; freeze giữ tới khi `031a→031g` xong. **⛔ Không cắt thì ⛔ không migration nào chạy được.** *(Ngoại lệ: vá F-1 không cần cắt băng — xem `VR-001-KET-QUA.md` §6.1)* |
| **B3** | 🟡 Gộp hai `ADR-001` — cấp lại số cho một bản | CSA | Hiến pháp §37.5 · §37.7. **Chưa làm — xem §3.1.1 bên dưới** |
| **B4** | Chỉ định người thứ hai cho `SOD-H04` · `H05` · `H06` | Joseph | Ba chặn cứng cần `CompensatingApprover` |
| **B5** | Định **thời hạn phản biện tối đa** | Board | ADR-011 §4.2 |
| **B6** | ✅ **XONG 04/08/2026** — [`docs/review/`](review/README.md) + khuôn mẫu | CSA | TD-15 khép lại |

#### 3.1.1 Vì sao `B3` chưa làm

`B3` viết là *"gộp hai `ADR-001`"*, nhưng **TD-13** (ADR-010 §175) mô tả một việc
rộng hơn: **ba** chuỗi ADR song song cần gộp về `docs/adr/` **kèm bảng ánh xạ số
cũ → số mới**. Đó không phải một phép đổi tên tệp.

Và có một ràng buộc cụ thể: `00-CONSTITUTION.md:75` — dòng Revision History của
**Hiến pháp v1.1** — trích dẫn thẳng *"ADR-001 — Homepage Conceptual Model"*. Cấp
lại số cho ADR đó là **sửa một trích dẫn trong lịch sử tu chính Hiến pháp**, tức
đụng văn bản **bậc 1**. Hiến pháp Điều 43.7 cấm viết lại lịch sử.

Tôi **không** tự làm việc này. Đề xuất trình Board bảng ánh xạ ba chuỗi kèm cách
xử lý dòng `:75` *(giữ nguyên trích dẫn cũ + thêm chú thích số mới)*, rồi mới thi
hành. `B3` là **quản trị tài liệu, không chặn mã nguồn** — có thể chạy song song
với Implementation.

### Cổng C — dữ liệu chủ, trước Sprint nghiệp vụ

`OQ-A` khấu trừ · `OQ-B` điều kiện thanh toán · `OQ-C` công nợ nhà thầu · `OQ-D` MISA bản nào · `OQ-E` NCC kiêm nhà thầu · ngưỡng cụ thể · bộ dữ liệu chủ khởi tạo T0/T1 *(~700 bản ghi)*

### Cổng D — hạ tầng kỹ thuật

Bộ kiểm phép chiếu · bài kiểm rò chéo tenant/đối tác/**tương quan** · phép kiểm vốn từ trạng thái · phép kiểm cấm màn hình tự tính · phép kiểm `duplicate_field_count = 0` · máy in nhãn *(3 vị trí)* · neo băm Audit Log ra ngoài

## 3.2 Lộ trình Implementation — 11 Sprint

| Sprint | Tên | Điều kiện ra |
|---|---|---|
| **I-0** | 🔴 **Phê chuẩn** | Cổng B hoàn tất |
| **I-1** | 🔴 **An toàn** | `pg_policies` trên CSDL thật cho thấy 8 bảng đã thu hẹp |
| **I-2** | **Lưới an toàn** — 🔵 **ĐANG CHẠY · Phase 1 ✅ xong** | `test:arch` có đủ 5 phép kiểm mới *(**1/5**)* · MD có bài kiểm nghiệp vụ *(**✅ đạt**)* |
| **I-3** | **Nền tảng** | Bài kiểm rò chéo tenant + chéo đối tác xanh |
| **I-4** | **Vòng đời đơn hàng** | Một đơn **huỷ được trọn vẹn** có bằng chứng |
| **I-5** | **Ranh giới Workspace** | ⛔ **0 route mang tên chức danh** |
| **I-6** | **Object Control Tower** | Hai màn hình cùng đối tượng ra **cùng** con số |
| **I-7** | **Order-to-Cash** | Một đơn đi trọn tới `CLOSED` |
| **I-8** | **Hoạch định** | Trả lời *"nhận nổi đơn này ⛔ không"* **bằng số** |
| **I-9** | **Cổng đối tác** | `SP-3` · `SP-4` xanh |
| **I-10** | **Xưởng** | Truy vết cuộn→thùng ⛔ không đứt |

## 3.3 Bàn giao cho đội phát triển hoặc AI khác

```
① Đọc  docs/PROJECT_MEMORY.md          §10 lộ trình nhập môn — 5 tài liệu, ~3 giờ
② Đọc  docs/PROJECT_MEMORY.md          §8  khuyết tật đã biết — 13 mục
③ Đọc  docs/PROJECT_MEMORY.md          §3  năm nguyên tắc + cổng kiểm 6 câu
④ Đọc  EDD-06 §10                      Architecture Change Procedure
⑤ Đọc  CLAUDE.md                       quy ước kho mã · bẫy đã tốn giá
⑥ Trước mỗi màn hình: chạy đủ 6 cổng   EDD-05 §1.1
⑦ Trước mỗi dòng mã: kiểm 19 quyết định chịu lực  PROJECT_MEMORY §5.1
```

🔴 **⛔ Không cần thiết kế lại bất cứ thứ gì.** Baseline này đủ để triển khai.

---

# §4 · BA ĐIỀU CẤM SAU FREEZE

| # | ⛔ Cấm | Vì sao |
|---|---|---|
| `AC-1` | 🔴 **Sửa mã để bù cho sai kiến trúc** | `DL-143` — vá **chạy được** nhưng để khuyết tật sống dưới một lớp mã, nổi lên ở màn hình thứ hai |
| `AC-2` | 🔴 **Thêm màn hình nhập liệu để né `P-ZERODUP`** | `DL-139` — nhập trùng là **chỉ điểm** của 1 trong 4 khuyết tật kiến trúc; phải sửa khuyết tật |
| `AC-3` | 🔴 **Tắt bài kiểm để cho mã đi qua** | Bài kiểm phép chiếu là **nghĩa vụ pháp lý** của `BDR-25`, ⛔ không chỉ nghĩa vụ kỹ thuật |

**Bốn loại thay đổi và thẩm quyền:** `T1` cấu hình *(tenant admin)* · `T2` thiết kế nhỏ *(CSA)* · `T3` thiết kế lớn *(Board + ADR)* · `T4` nền tảng *(Board + tu chính Hiến pháp — ⛔ không uỷ quyền được)*. Chi tiết EDD-06 §10.

---

# §5 · GIỚI HẠN CÓ TÊN

> Ghi công khai — ⛔ **không phải lỗ hổng im lặng.**

| # | Giới hạn | Quyết định |
|---|---|---|
| `KL-1` | 🔴 **⛔ Không phủ doanh nghiệp DỆT–MAY TÍCH HỢP DỌC** *(~5% thị trường)* — sản xuất vải là biến đổi theo **công thức**, ⛔ không phải lắp ráp theo **BOM** | `DL-079` — `D15` DORMANT |
| `KL-2` | Đóng dấu chìm dữ liệu bảng là **răn đe**, ⛔ không phải **truy vết**. CSV ⛔ không đóng dấu được | `DL-133` |
| `KL-3` | 🔴 **⛔ Không có giải pháp TRONG CSDL chống được quản trị viên CSDL** | `DL-073` — neo băm ra ngoài **bắt buộc** |
| `KL-4` | Chụp màn hình · sao chép–dán ⛔ **không ngăn được** | `P-ATTRIB` — dấu chìm màn hình |
| `KL-5` | Bậc ① *(tự động suy)* ⛔ không có người kiểm | `DL-126` — vào tiền/cam kết phải có cổng |
| `KL-6` | 🔴 **Tấn công tương quan ⛔ không chặn được bằng lọc dòng** | `DL-063` + `SP-4` |
| `KL-7` | Học máy cần 6–12 tháng dữ liệu — v1 chỉ có 5 tín hiệu bằng luật | `DL-043` |
| `KL-8` | Nếu xưởng dùng chung tài khoản dù ta cấp riêng, `BDR-23` chỉ tạo **ảo giác bằng chứng** | rủi ro còn lại, chưa đo |

---

# §6 · CHỈ SỐ BASELINE

| Chỉ số | Số |
|---|---|
| Tài liệu Enterprise Design | **14** |
| Quyết định kiến trúc `DL` | **149** — 19 chịu lực · 48 khó rút · 82 dễ rút |
| Board Decision `BDR` | **29** |
| ADR | **15 tài liệu · 14 số hiệu** — `012`–`014` đặt chỗ, ⛔ chưa ban hành |
| Điều Hiến pháp | **45** *(v1.6)* |
| Quy tắc nghiệp vụ `BR` | **60** |
| Nguyên tắc thiết kế | **5** |
| Business Domain | **14** *(+4 DORMANT)* |
| Business Object | **~88** |
| Master Data | **~65** |
| Màn hình | **~226** |
| Khuyết tật đã biết chưa sửa | **13** |
| Khoản nợ kỹ thuật | **22** |
| Giới hạn có tên | **8** |
| Mục còn mở | **11** — ⛔ 0 chặn Freeze · 6 chặn Implementation |

---

## THAM CHIẾU

- 🧠 **[`PROJECT_MEMORY.md`](PROJECT_MEMORY.md)** — chỉ mục duy nhất, cửa vào cho mọi AI và lập trình viên
- [`architecture/00-CONSTITUTION.md`](architecture/00-CONSTITUTION.md) **v1.6**
- [`business/BUSINESS_KNOWLEDGE_BASE.md`](business/BUSINESS_KNOWLEDGE_BASE.md) **v2.0 ADOPTED**
- [`adr/`](adr/) — 15 tài liệu ADR trong baseline · [ADR-015](adr/ADR-015-muoi-bon-business-workspace.md) · [ADR-016](adr/ADR-016-executive-center-enterprise-control-center.md) · [ADR-017](adr/ADR-017-trang-chu-hai-vung.md)
- [ADR-018](adr/ADR-018-thu-hep-authenticated-only.md) — ⏳ **ADR đầu tiên SAU đóng băng.** Không thuộc baseline; đi qua Architecture Change Procedure (EDD-06 §10). Chờ phản biện độc lập + Board phê duyệt. Migration `042` ⛔ chưa viết
  > ⚠️ **`ADR-012` · `ADR-013` · `ADR-014` được đề xuất ở [Audit Report](audit/MONICA_ONE_AUDIT_REPORT.md) §6 nhưng CHƯA BAO GIỜ ban hành** — nội dung của chúng đã được EDD-01…EDD-05 hấp thụ. Ba số hiệu này **đặt chỗ, ⛔ không tái sử dụng** *(Hiến pháp §37.5)*.
- [`enterprise-design/EDD-06`](enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) — kiểm toán · §10 Architecture Change Procedure
- [`../CLAUDE.md`](../CLAUDE.md) — quy ước kho mã
