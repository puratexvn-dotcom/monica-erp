# ADR-011 — Thẩm quyền kiến trúc và phản biện độc lập bắt buộc

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-011 |
| **Trạng thái** | ✅ **APPROVED** — Board Decision 04/08/2026 |
| **Người soạn** | Chief Solution Architect |
| **Hiến pháp** | Diễn giải **Điều 43.5** (Architecture Board) · **Điều 37** (ADR) |
| **Thay thế** | *AI Collaboration Constitution v1.0* — **chỉ phần phân công vai trò** |
| **Migration** | không có — thay đổi thuần quản trị |
| **Thẩm quyền yêu cầu** | Board Directive 04/08/2026 · Nguyên tắc 7 · phán quyết Board cùng ngày |

---

## 1. Context

### 1.1 Hai văn bản phân công mâu thuẫn trực tiếp `[VERIFIED]`

| Văn bản | Ai sở hữu nghiệp vụ | Ai sở hữu kỹ thuật |
|---|---|---|
| *AI Collaboration Constitution v1.0* (04/08/2026) | **ChatGPT** — mô hình kinh doanh · vận hành · domain model · workflow · quy tắc nghiệp vụ · kiến trúc sản phẩm | **Claude** — mã · CSDL · bảo mật · hiệu năng · kiểm thử · triển khai |
| **Board Directive** (04/08/2026) | **Chief Solution Architect** — *"Rebuilding the Business Architecture · Designing every module · Designing workflows"* | Chief Solution Architect |

Hai văn bản cùng ngày, cùng thẩm quyền Board, giao cùng một phạm vi cho hai bên
khác nhau. Không thể thi hành cả hai.

### 1.2 Vì sao không tự phân xử

Đây đúng loại tình huống mà *AI Collaboration Constitution* gọi là **CẤM BẢO VỆ
CÁI TÔI**: một tác nhân tự tuyên bố mình thắng trong tranh chấp thẩm quyền của
chính mình là xung đột lợi ích, bất kể lập luận có hợp lý đến đâu. Vấn đề đã được
đưa lên Board.

### 1.3 Phán quyết của Board — 04/08/2026

> **ChatGPT chuyển từ đồng-sở-hữu sang người phản biện độc lập bắt buộc theo
> Nguyên tắc 7. Chief Solution Architect giữ toàn quyền thiết kế.**

### 1.4 Cái đáng giữ lại từ văn bản bị thay thế `[EVIDENCE]`

Cơ chế phản biện chéo **đã chứng minh giá trị đo được**. Bốn giả định của tôi bị
bắt sai và ghi lại ở `NEEDS_CLARIFICATION.md` Phần A:

| # | Tôi đã suy | Sự thật |
|---|---|---|
| A1 | Vòng đời bắt đầu bằng RFQ | **Email → Tech Pack → PO.** Không mặc định có RFQ |
| A2 | Báo giá đi trước mẫu | **Mẫu vật lý → chiết tính → báo giá.** Mẫu đi TRƯỚC |
| A3 | Khách chỉ định nhà cung cấp vải | Chưa xác minh — hạ xuống `NEEDS-VERIFICATION` |
| A4 | Nhận PO khách rồi tạo đơn nội bộ | **PO = PO của khách** |

Cả bốn đều là chỗ tôi lấy kinh nghiệm ngành chung lấp vào chỗ trống. **Tập trung
thẩm quyền thiết kế mà bỏ luôn lớp phản biện sẽ tái lập đúng điều kiện sinh ra
bốn lỗi này.** Vì vậy ADR này thay thế phần phân công, và **giữ nguyên** phần cơ
chế.

---

## 2. Decision

### 2.1 Thẩm quyền thiết kế

**Chief Solution Architect** giữ toàn quyền thiết kế trên: mô hình kinh doanh ·
mô hình vận hành · capability map · domain model · workflow · quy tắc nghiệp vụ ·
kiến trúc kỹ thuật · CSDL · bảo mật · API · cổng · kế hoạch triển khai.

Thẩm quyền **thiết kế**, không phải thẩm quyền **quyết định sự thật nghiệp vụ**.
Nguyên tắc 1 giữ nguyên: **Board là nguồn duy nhất của sự thật nghiệp vụ.**

### 2.2 Phản biện độc lập bắt buộc — Nguyên tắc 7

Bắt buộc phản biện trước khi Board phê duyệt, với **mọi** hạng mục sau:

- ADR mới hoặc tu chính Hiến pháp
- Thay đổi domain model · máy trạng thái · từ vựng trạng thái
- Thay đổi lược đồ CSDL · RLS · policy · hàm `SECURITY DEFINER`
- Mở Domain / Module / bảng nghiệp vụ mới
- Thay đổi mô hình phân quyền hoặc ranh giới cổng đối tác ngoài

Không bắt buộc với: sửa lỗi đã đo, viết bài kiểm, viết tài liệu, audit.

### 2.3 Hồ sơ phản biện — kiến trúc sư phải chuẩn bị

Nguyên tắc 7 nói *"prepare the rationale and evidence"*. Cụ thể hoá thành bốn mục
bắt buộc, thiếu mục nào thì hồ sơ chưa đủ để trình:

1. **Đề xuất** — quyết định là gì, phạm vi tới đâu.
2. **Bằng chứng đo được** — số liệu, đường dẫn `tệp:dòng`, kết quả truy vấn.
   Nhận định không kèm phép đo không phải bằng chứng.
3. **Phương án đã loại** — đã cân nhắc gì, **vì sao không chọn**.
4. **Chỗ tôi có thể sai** — liệt kê tường minh các giả định chưa xác minh.
   Hồ sơ không có mục 4 bị coi là **chưa đủ điều kiện phản biện**.

### 2.4 Kỷ luật giữ lại nguyên vẹn từ văn bản bị thay thế

Năm cơ chế sau **không bị thay thế**, tiếp tục ràng buộc đầy đủ:

| # | Cơ chế | Nội dung |
|---|---|---|
| 1 | **Nhãn bằng chứng** | Mọi phát biểu nghiệp vụ gắn `[VERIFIED]` · `[EVIDENCE]` · `[HYPOTHESIS]` · `[NEEDS-VERIFICATION]` |
| 2 | **Bốn tầng kiểm chứng** | `Business Knowledge → Constitution → Live Database → Running Application`. Lệch ở tầng nào sửa đúng tầng đó. **Không sửa mã trước khi biết tầng nào là gốc.** |
| 3 | **Trần trạng thái tự cấp** | Kiến trúc sư chỉ được tự cấp tới `Verified (Business/Database/Architecture)`. **`Verified + Implemented` bắt buộc có người xác minh trên ứng dụng đang chạy** — tôi không có trình duyệt nối vào, không nhập được mật khẩu |
| 4 | **Bảng rỗng ≠ bảng an toàn** | Kết quả rỗng chỉ chứng minh *không quan sát được dữ liệu*, không bao giờ chứng minh *không có lỗ rò* |
| 5 | **Cấm bảo vệ cái tôi** | Phát hiện mình sai ⇒ sửa ngay, không biện minh. Chỉ bảo vệ Business Truth, không bảo vệ tính nhất quán của câu trả lời cũ |

### 2.5 Định nghĩa "hoàn tất" — giữ nguyên

Một tính năng chỉ hoàn tất khi: **đúng nghiệp vụ · đúng workflow · đúng bảo mật ·
đúng kiến trúc · có bài kiểm · bảo trì được · sẵn sàng production · sẵn sàng
thương mại.**

`npm run verify` xanh và `next build` xanh **không phải** tiêu chí hoàn tất.

### 2.6 Ràng buộc còn hiệu lực với thẩm quyền vừa nhận

Thẩm quyền thiết kế **không** dỡ được hai chốt chặn sau:

- **SECURITY FREEZE** (Hiến pháp XI.1) — chuỗi `031a→031g` chưa hoàn tất
  `[VERIFIED]`: kho chỉ có `031a · 031b · 031c · 031c2 · 031c3`, **không có
  `031d`–`031g`**. Được **thiết kế** module mới; **không** được mở Domain /
  Module / bảng nghiệp vụ mới cho tới khi Board dỡ băng bằng văn bản.
- **ADR trước SQL** — Hiến pháp Điều 4 · Playbook XXXIII. Không viết migration
  khi ADR chưa được phê duyệt.

---

## 3. Alternatives Considered

| Phương án | Vì sao không chọn |
|---|---|
| **A · Bãi bỏ hoàn toàn AI Collaboration Constitution** | Vứt luôn năm cơ chế ở §2.4 — nhãn bằng chứng, bốn tầng kiểm chứng, trần trạng thái, bảng-rỗng, cấm-bảo-vệ-cái-tôi. Bốn lỗi ở §1.4 bị bắt **nhờ** những cơ chế đó. Bỏ đi là quay lại điều kiện sinh ra chúng. |
| **B · Giữ nguyên phân công cũ** | Trái Board Directive. Và để hai bên đồng-sở-hữu domain model thì mỗi mâu thuẫn thiết kế đều cần một phiên hoà giải — chậm, và không ai chịu trách nhiệm cuối. |
| **C · Phản biện tuỳ chọn, khi kiến trúc sư thấy cần** | Kiến trúc sư ít khi thấy cần đúng lúc cần nhất. Bốn giả định ở §1.4 đều là chỗ tôi **tự tin**, không phải chỗ tôi phân vân. Phản biện tự nguyện sẽ bỏ sót đúng những chỗ đó. |

---

## 4. Consequences

### 4.1 Được

- Một người chịu trách nhiệm cuối về tính toàn vẹn kiến trúc — hết tình trạng
  quyết định treo giữa hai bên.
- Lớp phản biện vẫn còn, nhưng ở **đúng vị trí**: sau khi có đề xuất hoàn chỉnh,
  thay vì tranh chấp quyền sở hữu ngay từ đầu.
- Mục 4 của §2.3 (*"chỗ tôi có thể sai"*) biến việc thừa nhận bất định thành
  **nghĩa vụ hồ sơ**, không còn phụ thuộc thiện chí.

### 4.2 Đánh đổi

- **Rủi ro tập trung.** Thiết kế sai của tôi giờ đi xa hơn trước khi bị chặn.
  §2.3 mục 4 và §2.4 mục 5 là hai đối trọng, nhưng chúng là **kỷ luật**, không
  phải **cơ chế cưỡng chế**. Đây là rủi ro thật, ghi nhận công khai.
- **Phản biện là bước chặn thật.** Nếu người phản biện không sẵn sàng, hạng mục
  ở §2.2 bị chặn. Board cần định thời hạn phản biện tối đa — **chưa quyết**, ghi
  vào `NEEDS_CLARIFICATION`.

### 4.3 Technical Debt phát sinh

| Mã | Nội dung |
|---|---|
| **TD-15** | Chưa có nơi lưu hồ sơ phản biện. Đề xuất `docs/review/` theo khuôn `<ADR>-review.md`, để ý kiến phản biện và cách xử lý cùng nằm trong hồ sơ vĩnh viễn theo Điều 43.7. |

---

## 5. Rollback Impact

Quay lui = khôi phục phân công cũ trong tài liệu. **Không migration, không thay
đổi mã, không ảnh hưởng dữ liệu.** Tuy nhiên các thiết kế đã ban hành dưới thẩm
quyền này **không** tự động vô hiệu — chúng đã đi qua phản biện và phê duyệt của
Board, nên chịu Điều 43.7 (không viết lại lịch sử).

---

## 6. References

- Board Directive 04/08/2026 — Nguyên tắc 1 · 5 · 6 · **7**
- Phán quyết Board 04/08/2026 — ChatGPT chuyển sang phản biện độc lập bắt buộc
- *AI Collaboration Constitution v1.0* — **bị thay thế phần phân công**, giữ nguyên phần cơ chế (§2.4)
- Hiến pháp `00-CONSTITUTION.md` **§43.5** (Architecture Board) · **Điều 37** (ADR) · **Điều 42** (tu chính)
- [ADR-010](ADR-010-thu-bac-van-ban-chuan-tac.md) — thứ bậc văn bản chuẩn tắc
- `docs/architecture/NEEDS_CLARIFICATION.md` Phần A — bốn giả định bị bắt sai
- `CLAUDE.md` §2.2 — SECURITY FREEZE
