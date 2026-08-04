# BUSINESS CONFIRMATION #1
## MONICA ONE · Sprint 1 · Bộ câu hỏi gom một lần cho Board

| Trường | Giá trị |
|---|---|
| **Ngày** | 2026-08-04 |
| **Người hỏi** | Chief Solution Architect |
| **Người trả lời** | Board |
| **Số câu** | **20** |
| **Thời gian ước tính** | ~90 phút, trả lời một lượt |
| **Nguồn** | [BKB Phần E](BUSINESS_KNOWLEDGE_BASE.md) *(36 `OQ` · 8 `CF`)* · [Audit Report](../audit/MONICA_ONE_AUDIT_REPORT.md) |

---

## CÁCH DÙNG TÀI LIỆU NÀY

**Trả lời một lượt. Không cần đẹp. Gạch đầu dòng là đủ.**

Ba nguyên tắc tôi tự ràng buộc khi soạn bộ này:

1. **Chỉ hỏi cái không suy được.** 36 câu `OQ` trong BKB đã lọc xuống **20** —
   16 câu còn lại **suy ra được** từ 20 câu này, hoặc là câu hỏi giao diện /
   cấu hình, thêm sau vẫn kịp. Cột *Suy tiếp được gì* ghi rõ.
2. **Không hỏi cái Hiến pháp đã trả lời.** Tám quyết định kiến trúc đã được chốt
   ở [Audit Report §6](../audit/MONICA_ONE_AUDIT_REPORT.md) — chúng **không** nằm
   trong bộ này.
3. **Mỗi câu ghi rõ nó chặn cái gì.** Câu nào không chặn được gì thì tôi đã bỏ.

⚠️ **Câu nào Board chưa biết thì ghi thẳng "chưa biết".** Đó là câu trả lời hợp
lệ và hữu ích hơn một câu đoán — nó cho tôi biết phải chừa đường thay vì xây cứng.

---

## 🔴 VIỆC SỐ 0 — KHÔNG PHẢI CÂU HỎI, LÀ MỘT TRUY VẤN

**Chạy trước khi trả lời 20 câu.** Một phút. Kết quả quyết định Sprint 2 là *"xây
tiếp"* hay *"dừng lại bịt lỗ"*.

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('costings','costing_items','style_bom',
                    'change_requests','risk_assessments',
                    'production_orders','material_requests','order_milestones');
```

**Dán nguyên kết quả vào phần trả lời.** Kể cả khi nó trả về 0 dòng — **0 dòng
chính là câu trả lời tệ nhất**, nghĩa là 8 bảng này đang chạy bằng policy nền
`authenticated_only`, tức mọi tài khoản đã đăng nhập *(gồm khách hàng và nhà
thầu)* đọc được **giá chào · biên lợi nhuận · định mức**.

---

# A. TÀI CHÍNH VÀ KẾT THÚC VÒNG ĐỜI

> Đây là nhóm chặn nhiều nhất. Hệ thống hiện **không có một bảng tài chính nào** —
> không `invoices`, không `payments`. Vòng đời 14 bước của Board đứt ở bước ⑬⑭.

### A1 · Monica **phát hành** hoá đơn, hay chỉ **gửi dữ liệu** sang phần mềm kế toán?

Công ty đang dùng phần mềm kế toán nào (MISA · Fast · Bravo · Excel · khác)?

| | |
|---|---|
| **Chặn** | `BR-FIN-001` · `OQ-001` — có xây `invoices` + `payments` hay không |
| **Vì sao quan trọng** | Đây là **hai bảng lớn**. Quyết sai hướng là xây thừa cả một phân hệ, hoặc thiếu hẳn khâu ra tiền |
| **Suy tiếp được gì** | `OQ-035` *(đơn kết thúc ở bước nào)* · `FD-002` *(tích hợp ngoài)* |

---

### A2 · **Điều kiện thanh toán** thường dùng là gì — LC · TT trước · TT sau N ngày?

Có bao nhiêu kiểu? Ghi theo khách hay theo từng đơn?

| | |
|---|---|
| **Chặn** | `BR-FIN-004` · `OQ-018` — không có điều kiện thanh toán thì **không tính được ngày phải thu**, tức không có công nợ |

---

### A3 · Khách có **trừ tiền** vì trễ · lỗi · thiếu số không? Quy tắc cố định hay thương lượng từng vụ?

| | |
|---|---|
| **Chặn** | `BR-FIN-003` · `OQ-017` |
| **Vì sao quan trọng** | Không mô hình hoá khấu trừ thì **doanh thu hệ thống luôn cao hơn thực thu** — và mọi báo cáo tài chính sai một cách có hệ thống |

---

### A4 · **Công nợ nhà thầu** tính theo sản lượng · theo mốc · hay khoán trọn gói? Có giữ lại % bảo đảm không?

| | |
|---|---|
| **Chặn** | `BR-FIN-005` · `OQ-019` |
| **Vì sao quan trọng** | `BR-ACC-003` **bắt buộc** cho nhà thầu xem *"đơn giá · thành tiền · công nợ của chính họ"*. Không có công thức thì không dựng được con số Board đã hứa cho họ |

---

### A5 · Đơn hàng **kết thúc** ở bước nào — xuất hàng · xuất hoá đơn · hay thu đủ tiền?

| | |
|---|---|
| **Chặn** | `BR-LFC-003` · `OQ-035` |
| **Vì sao quan trọng** | Đây là định nghĩa `COMPLETED`. Mọi KPI *"bao nhiêu đơn xong"* phụ thuộc câu này |

---

### A6 · Ai được **huỷ** một đơn đã xác nhận? Điều kiện gì? **NPL đã mua xử lý ra sao?**

| | |
|---|---|
| **Chặn** | `BR-LFC-002` · `OQ-004` |
| **Vì sao quan trọng** | 🔴 `[VERIFIED]` **Hôm nay không một thao tác nào trong hệ thống đặt được `CANCELLED` lên một đơn hàng.** Đơn vào là không bao giờ ra được. Đây là **lối thoát duy nhất** của vòng đời và nó đang không tồn tại |

---

# B. VÀO ĐƠN · CHIẾT TÍNH · HỢP ĐỒNG

> Board đã đảo ngược hai giả định của tôi: vào đơn **không** qua RFQ, và mẫu đi
> **trước** chiết tính. Nhóm này chốt nốt phần còn lại.

### B7 · Khách quen có phải tạo bản **hỏi hàng** trước không, hay nhập thẳng PO?

Tỷ lệ đại khái: bao nhiêu % đơn đi qua hỏi hàng?

| | |
|---|---|
| **Chặn** | `BR-ORD-001` · `OQ-010` |
| **Vì sao quan trọng** | ⚠️ MD hiện lấy tab **"Yêu cầu báo giá"** làm **cửa vào duy nhất**. Nếu phần lớn đơn không qua đó, cửa vào của cả phân hệ đang đặt sai chỗ |

---

### B8 · Có ký **hợp đồng** riêng trước PO không? Một hợp đồng nhiều PO, hay 1-1?

| | |
|---|---|
| **Chặn** | `BR-ORD-003` · `OQ-009` — có xây bảng `contracts` hay không |
| **Hiện trạng** | ❌ Không có bảng hợp đồng nào trong 87 bảng |

---

### B9 · Có bao giờ **báo giá khi chưa có mẫu vật lý** không? Trường hợp nào?

| | |
|---|---|
| **Chặn** | `BR-CST-001` · `OQ-011` |
| **Vì sao quan trọng** | Quyết định thứ tự *mẫu → chiết tính* là **ràng buộc cứng** hay **mặc định mềm được phép vượt** |

---

### B10 · Merchandiser **tự quyết giá** không? Ngưỡng nào phải trình duyệt — giá trị đơn · biên lợi nhuận · hay theo khách hàng?

Ai duyệt?

| | |
|---|---|
| **Chặn** | `BR-CST-003` · `OQ-002` |
| **Hiện trạng** | ❌ **Không có bước duyệt giá nào** trong toàn hệ thống |
| **Suy tiếp được gì** | Một phần `OQ-003` *(ai nhận/từ chối đơn)* · `NEEDS_CLARIFICATION Q7` *(có cần vai trò riêng cho Chiết tính không)* |

---

### B11 · Ai và ở **bước nào** chốt **sở hữu NPL**? Có đơn **hỗn hợp** (khách cấp một phần, Monica mua phần còn lại) không?

| | |
|---|---|
| **Chặn** | `BR-MAT-001` · `BR-CST-004` · `OQ-016` |
| **Vì sao quan trọng** | Đây là **khác biệt vận hành lớn nhất giữa CMT và FOB**. Hiện `order_type` xuất hiện ở 13 tệp nhưng **rẽ nhánh đúng 1 chỗ** (`po.actions.ts:102`). Nếu có đơn hỗn hợp thì một cột `order_type` **không đủ** — phải mô hình hoá theo từng dòng NPL |

---

# C. ĐƠN HÀNG · GIAO HÀNG

### C12 · Một PO giao **mấy đợt, mấy cảng**?

| | |
|---|---|
| **Chặn** | `BR-SHP-002` · `OQ-012` |
| **Vì sao quan trọng** | ⚠️ Quyết định `shipments ↔ orders` là **1-1 hay 1-nhiều**. Đây là loại quyết định **rất khó sửa về sau** — chọn sai là di trú dữ liệu |

---

### C13 · Có **tách** một PO thành nhiều lô sản xuất, hoặc **gộp** nhiều PO thành một lô không?

| | |
|---|---|
| **Chặn** | `BR-ORD-005` · `OQ-013` · liên quan `CF-3` *(`production_orders` là gì)* |
| **Hiện trạng** | ❌ Không có thao tác tách/gộp. Bảng `production_orders` tồn tại nhưng **0 dòng** |

---

### C14 · **Đơn may mẫu** có được ghi nhận như một đơn hàng không, hay là việc khác hẳn?

| | |
|---|---|
| **Chặn** | `BR-ORD-006` · `OQ-014` |
| **Hiện trạng** | ❌ `orders` không có cột phân biệt đơn mẫu / đơn loạt. Trong ngành may đây là **hai quy trình khác hẳn** |

---

# D. CHẤT LƯỢNG

> 🔴 Nhóm này chứa một **rủi ro rò rỉ đang mở**: `BR-ACC-002` cấm khách xem QA nội
> bộ, nhưng hệ thống **không phân biệt được** QA nội bộ với QA của khách. Nghĩa là
> hoặc khách đang xem nhầm, hoặc cổng chưa mở. **Chưa ai đo.**

### D15 · **QA nội bộ** và **QA của khách** là hai loại chứng từ khác nhau, hay cùng một loại chỉ khác người ký?

| | |
|---|---|
| **Chặn** | `BR-QUA-001` · `CF-5` · `OQ-025` |
| **Hiện trạng** | ❌ `[VERIFIED]` 5 bảng QA, grep `customer_qa` · `buyer_qa` = **0 kết quả** |
| **Vì sao quan trọng** | Không phân biệt được thì **không viết được policy cho cổng khách** — và quy tắc Board xếp ⛔ TUYỆT ĐỐI KHÔNG sẽ không cưỡng chế được |

---

### D16 · Chặng kiểm nào **luôn làm**, chặng nào **tuỳ khách** — Inline · Pre-Final · Final · Packing?

| | |
|---|---|
| **Chặn** | `BR-QUA-002` · `OQ-026` |
| **Hiện trạng** | ❌ grep bốn chặng = **0 kết quả** trong toàn kho |
| **Suy tiếp được gì** | `OQ-027` *(lô trượt AQL xử lý ra sao)* — suy được phần lớn từ đây |

---

# E. KẾ HOẠCH VÀ SẢN XUẤT

### E17 · **Đơn vị hoạch định năng lực** là gì — phút chuyền (SAM) · số chuyền · hay số công nhân?

| | |
|---|---|
| **Chặn** | `BR-PRD-006` · `OQ-021` |
| **Vì sao quan trọng** | ❌ **Toàn bộ Workspace Planning không thiết kế được** trước câu này. Hiện không có mô hình năng lực nào trong 87 bảng |
| **Suy tiếp được gì** | `OQ-007` *(hai đơn tranh một chuyền, ưu tiên theo gì)* · `OQ-024` *(chọn xưởng theo gì)* |

---

### E18 · Lịch T&A lùi ngược từ **ngày xuất xưởng** hay **ngày tàu chạy**?

Mốc nào là mốc không được trễ?

| | |
|---|---|
| **Chặn** | `BR-TNA-001` · `OQ-022` |
| **Vì sao quan trọng** | Lùi sai gốc thì **toàn bộ mốc trung gian sai theo**, và cảnh báo sớm báo sai ngày |

---

### E19 · Bắt buộc **mẫu PP đã duyệt + NPL về đủ** mới được lên chuyền? Ai được phép cho lên khi còn thiếu?

| | |
|---|---|
| **Chặn** | `BR-PRD-004` · `OQ-023` · `CF-3` |
| **Vì sao quan trọng** | Quyết định `production_orders.RELEASED` là một **cổng kiểm soát có điều kiện** hay chỉ là một **nhãn trạng thái** |

---

# F. CỔNG ĐỐI TÁC VÀ ĐỐI SOÁT

### F20 · Hai câu gộp một — chúng phụ thuộc nhau nên tách ra vô nghĩa

**(a)** **Line Map là gì?** Sơ đồ bố trí chuyền · bảng phân công công đoạn · hay
tiến độ theo từng chuyền?

**(b)** Nhà thầu có được biết **tên khách hàng cuối** không? Khách có được biết
đơn của mình **may ở xưởng nào** không?

| | |
|---|---|
| **Chặn** | `CF-6` · `OQ-030` · `BR-ACC-004` · `OQ-031` · `OQ-020` |
| **Hiện trạng** | ❌ `line_map` — **0 kết quả** trong toàn kho mã, dù Board bắt buộc năng lực này ở **cả hai cổng** |
| **Vì sao gộp** | Line Map hiện ở cả hai cổng ⇒ **nội dung của nó quyết định luôn ranh giới bảo mật của hai cổng**. Không định nghĩa được nó thì không viết được policy RLS cho `buyer` lẫn `subcon` mà không đoán |

---

## ⭐ NẾU BOARD CHỈ TRẢ LỜI ĐƯỢC NĂM CÂU

| Ưu tiên | Câu | Mở khoá |
|---|---|---|
| 1 | 🔴 **Việc số 0** — truy vấn `pg_policies` | Quyết định Sprint 2 là *xây tiếp* hay *dừng bịt lỗ* |
| 2 | **A1** | Có xây `invoices` · `payments` không — hai bảng lớn nhất còn thiếu |
| 3 | **A6** | Lối thoát duy nhất của vòng đời đơn hàng |
| 4 | **B11** | Khác biệt vận hành lớn nhất CMT ⟷ FOB |
| 5 | **E17** | Toàn bộ Workspace Planning |

---

## PHỤ LỤC — 16 CÂU ĐÃ LỌC BỎ VÀ LÝ DO

Giữ lại để Board kiểm chứng bộ lọc, và để không ai tưởng bị bỏ sót.
Nguyên tắc lọc: *bỏ câu đó đi mà kiến trúc không đổi ⇒ không hỏi bây giờ.*

| `OQ` bị lọc | Nội dung | Lý do |
|---|---|---|
| `OQ-003` | Ai nhận / từ chối đơn | Suy phần lớn từ **B10** *(ai duyệt giá)* |
| `OQ-005` | Con số nào bắt buộc phải khớp | ⚠️ **Hoãn có điều kiện** — xem ghi chú dưới |
| `OQ-006` | "Vấn đề nóng" là gì | Định nghĩa chỉ số. Cần cho Executive Center, **chưa cần** cho MD/Warehouse của Sprint 2 |
| `OQ-007` | Hai đơn tranh một chuyền | Suy từ **E17** |
| `OQ-008` | Bán sỉ · bán lẻ online | `FD-001` — Board đã xếp là nghiệp vụ **phụ**, hoãn hợp lệ |
| `OQ-015` | Tech Pack có phiên bản không | Suy được: Điều 8 *Evidence First* đã đòi giữ bản cũ. Tôi **quyết định làm có phiên bản** |
| `OQ-020` | Nhà thầu A xem giá nhà thầu B | Gộp vào **F20(b)** |
| `OQ-024` | Chọn xưởng theo gì | Suy từ **E17** |
| `OQ-027` | Lô trượt AQL xử lý ra sao | Suy phần lớn từ **D16** |
| `OQ-028` | Kho đối chiếu định mức NPL khách | Suy từ **B11** *(sở hữu NPL)* |
| `OQ-029` | NPL về trễ ai được báo | Suy từ **E18** *(mốc T&A)* + **E19** |
| `OQ-031` | Nhà thầu biết tên khách cuối | Gộp vào **F20(b)** |
| `OQ-032` | `assignments` thuộc MD hay Subcontract | **Câu hỏi kiến trúc, không phải nghiệp vụ** — tôi quyết theo Hiến pháp Điều 26 |
| `OQ-033` | Ai sở hữu `production_orders` | Suy từ **C13** + **E19** |
| `OQ-034` | Có cần xoá mềm cho khách hàng | **Đã có câu trả lời**: `CLAUDE.md` §2.5 bắt buộc xoá mềm toàn hệ thống |
| `OQ-036` | Phép chuyển trạng thái nào hợp lệ | **Quyết định kiến trúc** — Audit Report §6 D4, theo khuôn `assignment.ts` |

> ### ⚠️ Ghi chú về `OQ-005` — câu tôi hoãn mà không chắc hoãn đúng
>
> `OQ-005` *("con số nào mà hai phòng báo lệch là không chấp nhận được")* chặn
> `BR-RPT-001` — **tiêu chí thành công Board đặt cao nhất** (`A4.2`).
>
> Tôi hoãn nó vì nó chỉ trả lời được **sau khi** biết Sprint 2 xây những con số
> nào — tức sau A1 · E17. Hỏi bây giờ sẽ nhận một danh sách chung chung.
>
> `[Chỗ tôi có thể sai — ADR-011 §2.3 mục 4]` Nếu Board thấy đã có sẵn danh sách
> con số cụ thể trong đầu, **trả lời luôn** — nó tiết kiệm một vòng.

---

## THAM CHIẾU

- [`BUSINESS_KNOWLEDGE_BASE.md`](BUSINESS_KNOWLEDGE_BASE.md) Phần E — sổ đăng ký 36 `OQ` · 8 `CF`
- [`MONICA_ONE_AUDIT_REPORT.md`](../audit/MONICA_ONE_AUDIT_REPORT.md) — bằng chứng của từng câu
- [`ADR-011`](../adr/ADR-011-tham-quyen-kien-truc.md) §2.3 — nghĩa vụ ghi *"chỗ tôi có thể sai"*
