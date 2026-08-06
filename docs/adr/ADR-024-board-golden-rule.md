# ADR-024 — BOARD GOLDEN RULE · giá trị đứng trước sự tinh xảo kỹ thuật

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-024 |
| **Trạng thái** | ✅ **ĐÃ PHÊ DUYỆT** — **Board Directive 06/08/2026 · Status: APPROVED** |
| **Người soạn** | Chief Solution Architect *(ghi nhận quyết định của Board, ⛔ không đề xuất)* |
| **Thẩm quyền** | **Bậc 0 — Board.** ADR này ⛔ **không xin phê duyệt**; nó **ghi lại** một chỉ thị đã ban |
| **Hiến pháp** | ⚠️ Board gọi đây là *"constitutional review principle"* — xem **§2.4**, có một câu hỏi để Board trả lời |
| **Phản biện độc lập** | ⛔ **không có** — cùng chế độ miễn trừ như ADR-023 §4.3 |
| **Migration** | ⛔ **không có** — thuần quản trị |
| **Thi hành ở** | `docs/REPORT_STANDARD.md` · `CLAUDE.md` §9 · `docs/knowledge/objects/` · `tests/architecture/arch.test.mjs` mục ⑥ |

---

## 1. Context

### 1.1 Chỉ thị

Board Directive 06/08/2026 ban hành **BOARD GOLDEN RULE** làm nguyên tắc rà soát:

> **Engineering creates products. The Board creates value.**
>
> Mọi báo cáo triển khai **bắt buộc** mở đầu bằng *"Giá trị mới nào đã được tạo
> ra?"*. Chỉ **sau khi** trả lời câu đó, báo cáo mới được đánh giá **Architecture ·
> Engineering · Governance**. Báo cáo phải có bảy phần: Business Value · User
> Value · Commercial Value · Product Alignment · Architecture Impact · Engineering
> Quality · Governance Impact.
>
> **Board sẽ ưu tiên giá trị hơn sự tinh xảo kỹ thuật.** Một giải pháp xuất sắc về
> kỹ thuật nhưng ⛔ không cải thiện giá trị sản phẩm, trải nghiệm người dùng, khác
> biệt thương mại hay vận hành doanh nghiệp — ⛔ **không** được coi là ưu tiên.

### 1.2 Vì sao chỉ thị này đúng chỗ `[VERIFIED]`

Đây ⛔ **không** phải một yêu cầu hình thức. Kho đang có bằng chứng đo được rằng
báo cáo hiện tại mở đầu bằng **phương tiện**, ⛔ không phải **giá trị**:

| Phép đo trên kho | Kết quả |
|---|---|
| Quyết định kiến trúc đã ghi | **149** `DL` |
| Tài liệu Enterprise Design | **13** |
| Tổng mục tri thức quản trị đã biết | **~230** |
| Tài liệu trả lời *"tính năng này tạo giá trị gì cho ai"* theo khuôn bắt buộc | 🔴 **0** |
| Báo cáo Sprint / Audit mở đầu bằng **giá trị** | 🔴 **0** |
| `docs/product/PRODUCT_CONSTITUTION_GAP_ANALYSIS.md` | **14 khoảng lệch** giữa sản phẩm và nguyên tắc |

Nói cách khác: dự án có **bộ máy quản trị kiến trúc rất mạnh** và **⛔ không có
bộ máy quản trị giá trị nào**. Chỉ thị này lấp đúng chỗ trống đó.

---

## 2. Decision

### 2.1 Ghi nhận, ⛔ không đề xuất

Board ở **bậc 0**. ADR này **⛔ không có thẩm quyền chuẩn y hay bác** chỉ thị của
Board — nó ghi lại chỉ thị, đặt nó vào thứ bậc ADR-010, và mô tả cách thi hành.

### 2.2 Nơi lưu chuẩn tắc

| Thứ | Nơi | Bậc |
|---|---|---|
| **Nguyên tắc** *(giá trị trước kỹ thuật)* | `KO-PRN-006` — Knowledge Object loại `Principle` | nguồn **bậc 0** |
| **Chuẩn báo cáo bảy phần** | [`docs/REPORT_STANDARD.md`](../REPORT_STANDARD.md) | **bậc 3 · Engineering Standards** |
| **Quy tắc thi hành** | `KO-RUL-007` | nguồn **bậc 3** |
| **Điểm vào mỗi phiên** | `CLAUDE.md` §9 — tệp nạp đầu tiên | — |

### 2.3 🔑 Câu hỏi mở đầu đứng TRƯỚC, ⛔ không phải đứng cạnh

Thứ tự là **toàn bộ nội dung** của chỉ thị. Bảy phần mà xếp *"Architecture ·
Engineering · Governance"* lên đầu rồi thêm một mục *"Value"* ở cuối là **⛔ không
thi hành chỉ thị** — nó chỉ đổi nhãn. Vì vậy `REPORT_STANDARD.md` §2 quy định câu
hỏi giá trị là **mục đầu tiên của tài liệu**, và §3 khoá thứ tự bảy phần.

### 2.4 ⚠️ MỘT CÂU HỎI ĐỂ BOARD TRẢ LỜI — ⛔ tôi không tự quyết

Board gọi đây là ***"constitutional* review principle"**. Nhưng:

- Hiến pháp `00-CONSTITUTION.md` chỉ sửa được qua **tu chính theo Điều 42**.
- ⛔ Tôi **không** sửa Hiến pháp bằng mã hay bằng tay — Hiến pháp §43.7, và
  `ARCHITECTURE_BASELINE` khoá kiến trúc từ 04/08/2026.

Vậy nguyên tắc này đứng ở đâu?

| | Cách hiểu | Hệ quả |
|---|---|---|
| **A** | **Nguyên tắc rà soát của Board ở bậc 0** *(cách tôi đang thi hành)* | Có hiệu lực ngay, ⛔ không cần tu chính. Hiến pháp giữ nguyên |
| **B** | **Điều khoản mới của Hiến pháp** | Cần **tu chính theo Điều 42** ⇒ một ADR riêng · ⇒ đổi số hiệu Hiến pháp `v1.6` → `v1.7` |

🔴 **Tôi thi hành theo A** vì A **⛔ không đòi hỏi hành động nào tôi ⛔ không có
thẩm quyền làm**, và vì hiệu lực *"ngay lập tức"* mà Board yêu cầu đạt được đầy
đủ dưới A. **Nếu Board muốn B, xin ra chỉ thị** — tôi sẽ soạn bản tu chính Điều 42.

---

## 3. Alternatives Considered

| Phương án | Vì sao ⛔ không chọn |
|---|---|
| **A · Thêm mục "Value" vào cuối khuôn báo cáo cũ** | ⛔ Không thi hành chỉ thị — Board nói **"begin with"**. Đặt giá trị ở cuối là giữ nguyên thói quen mở đầu bằng phương tiện. |
| **B · Sửa thẳng `00-CONSTITUTION.md`** | Vi phạm Điều 42 *(tu chính)* và `ARCHITECTURE_BASELINE` *(kiến trúc đã khoá)*. Xem §2.4. |
| **C · Chỉ ghi vào `CLAUDE.md`** | `CLAUDE.md` là **điểm vào**, ⛔ không phải nơi lưu chuẩn tắc. Chuẩn nằm ở `CLAUDE.md` sẽ ⛔ không ai trích dẫn được theo ADR-010 §2.4. |
| **D · Viết phép kiểm quét mọi `*REPORT*.md`** | 🔴 Đánh hỏng **~10 báo cáo cũ hợp lệ** ra đời **trước** luật. Sửa lại chúng là **viết lại lịch sử** — §43.7 cấm. Xem `TD-GR1`. |
| **E · Chờ phản biện độc lập rồi mới thi hành** | Board nói **"effective immediately"**. Và `KO-PEN-002` cho thấy chờ phản biện ở kho này nghĩa là chờ **vô thời hạn** — ⛔ không có thời hạn tối đa *(`GPR-001` `A-4`)*. |

---

## 4. Consequences

### 4.1 Được

- **Board rà soát đúng thứ** — câu hỏi đầu tiên là câu Board quan tâm, ⛔ không
  phải câu kỹ sư muốn khoe.
- **Việc ⛔ không tạo giá trị bị lộ sớm** — bảy phần buộc phải trả lời *"ai được
  lợi"*. Một hạng mục ⛔ không trả lời nổi phần ② và ③ là hạng mục cần **xếp lại
  ưu tiên**, ⛔ không phải cần làm kỹ hơn.
- **Nối được `PRODUCT_CONSTITUTION_GAP_ANALYSIS`** — phần ④ *Product Alignment*
  buộc mỗi báo cáo tự soi vào **14 khoảng lệch** đã biết.

### 4.2 Đánh đổi

- **Báo cáo dài hơn.** Bảy phần cho một việc nhỏ là quá nặng — nhưng viết
  *"⛔ không có giá trị thương mại; đây là dọn nợ"* chỉ mất **một dòng**, và dòng
  đó **có giá trị thông tin thật**.
- 🔴 **Rủi ro thật: nống giá trị lên.** Bắt buộc khai giá trị tạo áp lực **bịa
  giá trị**. `REPORT_STANDARD.md` §2 và §4.3 chặn bằng lời; ⛔ **không có răng
  máy** cho việc này, và ⛔ không thể có — máy ⛔ không phân biệt được một tuyên bố
  giá trị thật với một tuyên bố nghe hay. **Board là bộ lọc duy nhất.**

### 4.3 ⛔ KHÔNG được suy ra từ chỉ thị này

> *"Board ưu tiên giá trị hơn tinh xảo kỹ thuật"* **⛔ KHÔNG** có nghĩa là:

| ⛔ Suy diễn sai | Vì sao sai |
|---|---|
| *"Được bỏ qua chuẩn kỹ thuật nếu có giá trị"* | `AC-1` cấm sửa mã bù sai kiến trúc; `DL-143` cấm dùng mã che khuyết tật kiến trúc |
| *"Được tắt bài kiểm để giao nhanh"* | **Một trong ba điều cấm** của `ARCHITECTURE_BASELINE` |
| *"RLS/bảo mật xuống ưu tiên vì ⛔ không bán được"* | 🔴 `P-IRREV`: dữ liệu lộ ⛔ không thu hồi được. **Đây là suy diễn nguy hiểm nhất** |
| *"Nợ kỹ thuật ⛔ không cần báo nữa"* | Phần ⑤ ⑥ ⑦ vẫn bắt buộc — chúng chỉ **đứng sau**, ⛔ không **biến mất** |

ADR-010 §2.2 quy tắc 3 đã lập sẵn khuôn cho chính loại suy diễn này: *"nghiệp vụ
nói **cái gì**, Hiến pháp nói **thế nào**"* — ⛔ không được lấy vế đầu để lách vế sau.

### 4.4 Technical Debt phát sinh

| Mã | Nội dung |
|---|---|
| **TD-GR1** | ⛔ Chưa có phép kiểm tự động cho bảy phần. Cưỡng chế hiện nay là **kỷ luật rà soát của Board**. Khả thi về sau: chỉ quét báo cáo có `report_standard: v1` ở frontmatter ⇒ ⛔ không đụng báo cáo cũ. |
| **TD-GR2** | ⛔ Chưa có định nghĩa đo được cho *"giá trị"* — ⛔ không có chỉ số, ⛔ không có đường cơ sở. Phần ③ vì vậy dễ thành văn xuôi. Cần Board cho **≥1 chỉ số thương mại** để neo. |
| **TD-GR3** | Báo cáo cũ *(~10 tệp)* ⛔ không theo chuẩn. **Có chủ ý** — ⛔ không viết lại lịch sử. |

---

## 5. Rollback Impact

Quay lui = xoá `docs/REPORT_STANDARD.md`, xoá hai Knowledge Object, gỡ **một mục**
khỏi `CLAUDE.md`, gỡ **một dòng** khỏi mục ⑥ của `arch.test.mjs`.

⛔ **Không migration · ⛔ không đụng lược đồ · ⛔ không đụng mã ứng dụng · ⛔ không
mất tri thức.** Chi phí quay lui gần bằng **không**.

---

## 6. References

- **Board Directive 06/08/2026** — *Status: APPROVED* · `BOARD GOLDEN RULE`
- [`docs/REPORT_STANDARD.md`](../REPORT_STANDARD.md) — chuẩn thi hành, bậc 3
- [ADR-023](ADR-023-board-knowledge-system.md) — Board Knowledge System · §4.3 chế độ miễn trừ phản biện
- [ADR-010](ADR-010-thu-bac-van-ban-chuan-tac.md) §2.2 — nghiệp vụ nói *cái gì*, Hiến pháp nói *thế nào*
- [ADR-011](ADR-011-tham-quyen-kien-truc.md) — `AC-1` ⛔ cấm sửa mã bù sai kiến trúc
- Hiến pháp [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) **Điều 42** *(tu chính)* · **§43.7** *(⛔ không viết lại lịch sử)*
- [`docs/product/PRODUCT_CONSTITUTION_GAP_ANALYSIS.md`](../product/PRODUCT_CONSTITUTION_GAP_ANALYSIS.md) — 14 khoảng lệch
- [`docs/UI_UX_STANDARDS.md`](../UI_UX_STANDARDS.md) §8 · `CLAUDE.md` §5 — nghi thức nghiệm thu, ⛔ **không** bị thay thế
