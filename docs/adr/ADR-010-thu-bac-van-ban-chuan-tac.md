# ADR-010 — Thứ bậc văn bản chuẩn tắc · chấm dứt tình trạng hai Hiến pháp

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-010 |
| **Trạng thái** | ⏳ **Chờ Board phê duyệt** *(soạn 04/08/2026)* |
| **Người soạn** | Chief Solution Architect |
| **Hiến pháp** | Diễn giải **Điều 43.3 · 43.9** · không tu chính, không đổi câu chữ |
| **Thi hành ở** | `CLAUDE.md` · `docs/architecture/README.md` · `docs/MONICA_CONSTITUTION.md` (tiêu đề) |
| **Migration** | không có — thay đổi thuần quản trị |
| **Thẩm quyền yêu cầu** | Board Directive 04/08/2026 · Nguyên tắc 2 và 5 |

---

## 1. Context

### 1.1 Vì sao có quyết định này

Board Directive ngày 04/08/2026 đặt ra chuỗi truy vết bắt buộc:

```
Business Knowledge Base → Constitution → Architecture → Implementation
```

Chuỗi này chỉ chạy được nếu mỗi mắt xích trỏ tới **đúng một** văn bản. Hiện tại
mắt xích *Constitution* trỏ tới **hai** văn bản, và mỗi văn bản tự tuyên bố mình
tối cao.

### 1.2 Bằng chứng đo được `[VERIFIED]`

| Phép đo | Kết quả |
|---|---|
| Văn bản tự xưng là bộ luật tối cao | **2** |
| `docs/MONICA_CONSTITUTION.md` | *"THE SUPREME ARCHITECTURE LAW · vFinal"* · ban hành 01/08/2026 · 12 nguyên tắc · *"Không có ngoại lệ. Không thoả hiệp vì tốc độ."* |
| `docs/architecture/00-CONSTITUTION.md` | **v1.5 · ✅ ADOPTED** · hiệu lực 02/08/2026 · 8 Phần · 45 Điều · 5.899 dòng |
| Văn bản tuyên bố cái nào thắng | **không tồn tại** |
| `CLAUDE.md` mô tả `00-CONSTITUTION.md` là | *"BỘ KHUNG — 12 chương rỗng, chưa có điều khoản nào"* — **sai** |
| `docs/architecture/README.md` mô tả `00-CONSTITUTION.md` là | *"🟡 Draft — bộ khung … CHƯA có hiệu lực"* — **sai** |
| `tests/architecture/arch.test.mjs:126` cưỡng chế | `docs/MONICA_CONSTITUTION.md` **phải tồn tại** |

Hệ quả đo được: **mọi phiên làm việc của mọi tác nhân đều khởi động bằng một tiền
đề sai về bộ luật nào đang có hiệu lực.** `CLAUDE.md` là tệp được nạp đầu tiên,
và nó đang chỉ người đọc tới bộ luật cũ, kèm lời khẳng định rằng bộ luật mới còn
rỗng. Bộ luật mới đã đầy đủ và đã ban hành từ 02/08/2026 — tức tiền đề sai này đã
tồn tại **hai ngày**, xuyên suốt toàn bộ đợt audit và discovery vừa rồi.

### 1.3 Hiến pháp đã tự trả lời câu hỏi này rồi

Điều quan trọng: đây **không phải** khoảng trống hiến định. `00-CONSTITUTION.md`
đã tự giải quyết ở hai khoản `[VERIFIED]`:

> **§43.3 Constitutional Hierarchy** — thứ tự thẩm quyền sáu bậc:
> `1. Constitution · 2. Accepted ADR · 3. Engineering Standards · 4. Approved
> Playbooks · 5. Technical Documentation · 6. Source Code`

> **§43.9** — *"This Constitution shall remain the **single** constitutional
> source of architectural authority for MONICA ONE."*

Vậy ADR này **không tạo ra** thứ bậc mới. Nó chỉ **ghi nhận** thứ bậc đã hiến
định, và trả lời một câu mà §43.3 chưa nói rõ: *hai văn bản cũ nằm ở bậc nào.*

### 1.4 Một khoảng trống thật, do chỉ thị hôm nay tạo ra

Board Directive đặt **Business Knowledge Base ở TRÊN Constitution**. Nhưng §43.2
nói *"Where conflict exists, the Constitution shall prevail."* Hai câu này mâu
thuẫn nếu đọc phẳng.

Đây là khoảng trống **mới**, không phải lỗi của văn bản nào. Nó cần một phán
quyết, và mục 2.2 dưới đây là phán quyết tôi đề xuất.

---

## 2. Decision

### 2.1 Thứ bậc bảy bậc — bản hợp nhất

Tôi đề xuất Board chuẩn y thứ bậc sau. Bậc 1–6 là §43.3 nguyên văn; bậc 0 là bổ
sung do Board Directive 04/08/2026:

| Bậc | Thẩm quyền | Văn bản cụ thể trong kho |
|---|---|---|
| **0** | **Quyết định của Board** | biên bản chỉ thị · phán quyết trực tiếp |
| **0′** | **Business Knowledge Base** | `docs/business/BUSINESS_KNOWLEDGE_BASE.md` — *chỉ về SỰ THẬT NGHIỆP VỤ* |
| **1** | **Constitution** | `docs/architecture/00-CONSTITUTION.md` — **duy nhất** |
| **2** | **Accepted ADR** | `docs/adr/` · `docs/architecture/adr/` · `docs/assignment/ADR-001` |
| **3** | **Engineering Standards** | `docs/UI_UX_STANDARDS.md` · `docs/MUTATION_POLICY.md` · `docs/design/` |
| **4** | **Approved Playbooks** | `docs/MONICA_CONSTITUTION.md` · `docs/ENGINEERING_PLAYBOOK.md` |
| **5** | **Technical Documentation** | `docs/DOMAIN_GLOSSARY.md` · `RLS_COVERAGE_MATRIX` · `TECHNICAL_DEBT` · audit · discovery |
| **6** | **Source Code** | toàn bộ mã · lược đồ CSDL · migration |

### 2.2 Quan hệ giữa bậc 0′ và bậc 1 — phân theo LĨNH VỰC, không theo thứ tự

Đây là điểm cốt lõi của ADR này.

> **Business Knowledge Base tối cao về NGHIỆP VỤ — *cái gì là thật*.**
> **Hiến pháp tối cao về CHUẨN TẮC KIẾN TRÚC — *phải xây thế nào*.**

Ba quy tắc áp dụng:

1. **Hiến pháp im lặng về một chi tiết nghiệp vụ** ⇒ BKB điền vào. Đây **không**
   phải ghi đè; Hiến pháp chưa từng phát biểu nên không có gì để ghi đè.
2. **BKB và Hiến pháp mâu thuẫn thật** ⇒ **DỪNG.** Ghi vào
   `NEEDS_CLARIFICATION.md`. Board phán quyết, và nếu Hiến pháp phải đổi thì đổi
   qua tu chính theo Điều 42. **Không tác nhân nào được tự chọn bên thắng.**
3. **BKB không được dùng để lách chuẩn tắc kỹ thuật.** *"Khách cần xem nhanh"*
   không phải căn cứ để bỏ RLS. Nghiệp vụ nói **cái gì**, Hiến pháp nói **thế nào**.

### 2.3 Địa vị mới của hai văn bản cũ

`docs/MONICA_CONSTITUTION.md` và `docs/ENGINEERING_PLAYBOOK.md` **xuống bậc 4 ·
Approved Playbooks**. Cụ thể:

- **Không xoá, không sửa nội dung, không sửa đánh số La Mã.** Điều 43.7 cấm viết
  lại lịch sử; ràng buộc *"không xoá logic hay file cũ"* của dự án cũng vậy. Bài
  kiểm kiến trúc mục ⑥ tiếp tục cưỡng chế `MONICA_CONSTITUTION.md` phải tồn tại —
  **đúng như hiện nay**, ADR này không đụng tới bài kiểm.
- **Chỉ thêm một khối ghi chú ở đầu tệp** nói rõ địa vị bậc 4 và trỏ tới Hiến
  pháp bậc 1. Tiêu đề *"THE SUPREME ARCHITECTURE LAW"* giữ nguyên như dấu vết
  lịch sử, kèm chú thích rằng danh xưng đó đã được thay thế từ 02/08/2026.
- **34 quy tắc Playbook vẫn ràng buộc đầy đủ** ở bậc 4. Xuống bậc **không phải**
  mất hiệu lực — nó chỉ trả lời câu hỏi *"khi mâu thuẫn thì ai thắng"*. Trong đó
  **Playbook Điều XXX (phân quyền theo Assignment)** vẫn giữ nguyên mức ƯU TIÊN
  TỐI CAO đã được Hiến pháp v0.31 xác nhận là hợp hiến.

### 2.4 Quy ước trích dẫn — chấm dứt nhầm lẫn số La Mã

Ba bộ đánh số đang cùng tồn tại. Từ nay trích dẫn **bắt buộc** ghi nguồn:

| Viết | Nghĩa |
|---|---|
| `Hiến pháp Điều 43.3` | `00-CONSTITUTION.md` — số Ả Rập, bậc 1 |
| `Playbook Điều XXX` | `ENGINEERING_PLAYBOOK.md` — số La Mã, bậc 4 |
| `MOS Điều IX` | `MONICA_CONSTITUTION.md` — số La Mã, bậc 4 |
| `BKB §12` | `BUSINESS_KNOWLEDGE_BASE.md` — bậc 0′ |

Trích dẫn `Điều IX` trần, không nguồn, **là trích dẫn không hợp lệ**.

---

## 3. Alternatives Considered

| Phương án | Vì sao không chọn |
|---|---|
| **A · Gộp hai Hiến pháp làm một** | Điều 43.7 cấm viết lại lịch sử. Gộp 12 nguyên tắc vào 45 Điều là biên tập lại một văn bản Board đã ban hành nguyên văn qua 55 lượt. Chi phí cao, rủi ro mất câu chữ, và **không cần thiết** — §43.9 đã đủ để phân xử. |
| **B · Bãi bỏ `MONICA_CONSTITUTION.md`** | Vi phạm ràng buộc *"không xoá file cũ"*, **làm gãy `arch.test.mjs:126`**, và vứt bỏ 12 nguyên tắc vẫn đang đúng. Xoá một văn bản không làm nó hết được trích dẫn — chỉ làm nó hết kiểm chứng được. |
| **C · Để nguyên, ai đọc gì thì đọc** | Đây chính là hiện trạng, và hiện trạng đã sinh ra một tiền đề sai kéo dài hai ngày. Nguyên tắc 5 đòi mọi quyết định phải truy vết được; không thể truy vết về hai nguồn cùng lúc. |
| **D · Đặt BKB tối cao tuyệt đối, trên cả Hiến pháp** | Đọc phẳng chỉ thị sẽ ra phương án này. Nhưng nó cho phép một phát biểu nghiệp vụ vô hiệu hoá một chuẩn tắc bảo mật — ví dụ *"khách cần xem tiến độ ngay"* trở thành căn cứ bỏ RLS. Phân theo lĩnh vực (§2.2) giữ được ý định của chỉ thị mà không mở cửa đó. |

---

## 4. Consequences

### 4.1 Được

- Chuỗi truy vết của Nguyên tắc 2 chạy được: mỗi mắt xích đúng một văn bản.
- Mọi phiên làm việc khởi động bằng tiền đề đúng.
- Mâu thuẫn nghiệp vụ ⟷ kiến trúc có đường xử lý xác định, thay vì để tác nhân
  tự chọn bên — đúng tinh thần *"gặp khoảng trống thì GHI VÀO Needs Clarification,
  không tự suy diễn"*.

### 4.2 Đánh đổi

- Ba bộ đánh số vẫn tồn tại. §2.4 kiểm soát bằng kỷ luật trích dẫn, **chưa có
  răng tự động**. Đề xuất bổ sung một mục vào `arch.test.mjs` bắt trích dẫn
  `Điều [IVX]+` không kèm nguồn — ghi vào sổ nợ, **không** làm trong ADR này.
- `docs/architecture/adr/ADR-001` và `docs/adr/ADR-001` là **hai ADR khác nhau
  cùng số hiệu** `[VERIFIED]`. Đây là nợ quản trị đã biết, Board đã chốt
  03/08/2026 rằng số ADR phải duy nhất toàn cục. ADR này **không** giải quyết —
  ghi nhận để không bị quên.

### 4.3 Technical Debt phát sinh

| Mã | Nội dung |
|---|---|
| **TD-13** | Ba chuỗi ADR song song, có trùng số `ADR-001`. Cần một đợt gộp về `docs/adr/` với bảng ánh xạ số cũ → số mới. |
| **TD-14** | Chưa có phép kiểm tự động cho kỷ luật trích dẫn §2.4. |

---

## 5. Rollback Impact

Quay lui = gỡ khối ghi chú khỏi ba tệp `.md`. **Không migration, không thay đổi
lược đồ, không ảnh hưởng dữ liệu, không ảnh hưởng mã đang chạy.** Chi phí quay
lui gần bằng không — đây là lý do việc này nên làm trước mọi việc tốn kém hơn.

---

## 6. References

- Board Directive 04/08/2026 — Nguyên tắc 1 · 2 · 5 · 6
- Hiến pháp `00-CONSTITUTION.md` **§43.2 · §43.3 · §43.7 · §43.9** · Điều 42 (tu chính)
- `docs/MONICA_CONSTITUTION.md` — vFinal, 01/08/2026
- `docs/ENGINEERING_PLAYBOOK.md` — 34 quy tắc
- `tests/architecture/arch.test.mjs:123-132` — mục ⑥ tài liệu bắt buộc
- [ADR-011](ADR-011-tham-quyen-kien-truc.md) — thẩm quyền kiến trúc và phản biện độc lập
- `docs/architecture/NEEDS_CLARIFICATION.md` — đường xử lý mâu thuẫn ở §2.2 quy tắc 2
