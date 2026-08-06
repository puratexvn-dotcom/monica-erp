# BOARD KNOWLEDGE SYSTEM — hiến chương

| Trường | Giá trị |
|---|---|
| **Thẩm quyền** | Board Directive **06/08/2026** — *"Do not design the Board Knowledge Base as a traditional document. Design it as a Knowledge System."* |
| **ADR** | [ADR-023](../adr/ADR-023-board-knowledge-system.md) — ✅ **ĐÃ PHÊ DUYỆT** *(Board, 06/08/2026)* · ⚠️ duyệt ⛔ không kèm phản biện độc lập, xem §4.3 |
| **Bậc ADR-010** | **5 · Technical Documentation** — 🔑 xem §2 |
| **Lược đồ** | [`SCHEMA.md`](SCHEMA.md) — chuẩn tắc, máy cưỡng chế |
| **Chỉ mục sinh tự động** | [`INDEX.md`](INDEX.md) — `npm run knowledge` |
| **Răng** | [`tests/governance/knowledge-objects.test.mjs`](../../tests/governance/knowledge-objects.test.mjs) |

---

## §1 · BOARD YÊU CẦU GÌ, VÀ ĐÃ ĐƯỢC ĐÁP THẾ NÀO

| Board chỉ định | Thi hành ở |
|---|---|
| ⛔ Không phải tài liệu chương mục tuyến tính | Một đối tượng = **một tệp** · ⛔ không có chương — `SCHEMA.md` §1 |
| Bảy loại đối tượng | `SCHEMA.md` §1.1 · bảy thư mục con `objects/` |
| Tám trường bắt buộc | `SCHEMA.md` §2.1 — cộng `type` · `tier` do lược đồ thêm, có lý do |
| Nối bằng **quan hệ**, ⛔ không bằng thứ bậc tài liệu | Tập vị từ đóng chín cái · `SCHEMA.md` §4 |
| Markdown vẫn là định dạng lưu | YAML frontmatter **trong** tệp `.md` · ⛔ không CSDL, ⛔ không JSON |
| Knowledge Object là **đơn vị quản lý chính** | Mọi phép kiểm, mọi chỉ mục, mọi trích dẫn đều lấy đối tượng làm đơn vị |
| Rà soát Board **nhanh** | `INDEX.md` mở đầu bằng bảng **PENDING_BOARD** — mở ra là thấy việc cần quyết |
| Bảo tồn tri thức thiết chế | `SUPERSEDED` · `REJECTED` · `CLOSED` **⛔ không bị xoá** · `mirrors` giữ số hiệu cũ |

---

## §2 · 🔑 ĐIỀU QUAN TRỌNG NHẤT: HỆ THỐNG NÀY LÀ CHỈ MỤC, ⛔ KHÔNG PHẢI NGUỒN

Đây là phán quyết kiến trúc trung tâm của thiết kế, và nó ⛔ **không** nằm trong
chỉ thị của Board — nó là thứ tôi bổ sung để chỉ thị của Board **không tự phá
mình** sau vài tháng.

### 2.1 Rủi ro thật, đã có tiền lệ đo được

Kho đang có **12 hệ đánh số** và **7 bậc thẩm quyền**. Một *"Knowledge System"*
chép nội dung của chúng vào đối tượng của mình sẽ tạo ra **bản thứ hai của mọi sự
thật**. Điều gì xảy ra tiếp theo thì ⛔ không cần đoán — nó **đã xảy ra rồi**:

> [ADR-010](../adr/ADR-010-thu-bac-van-ban-chuan-tac.md) §1.2 `[VERIFIED]`: hai
> văn bản cùng tự xưng Hiến pháp, ⛔ không văn bản nào nói cái nào thắng. Hệ quả
> đo được: **mọi phiên làm việc của mọi tác nhân khởi động bằng một tiền đề sai
> — suốt hai ngày.**

Và dự án có sẵn một nguyên tắc cấm đúng việc này: **`P-ZERODUP`** *(`KO-PRN-005`)*
— ⛔ không bắt ai nhập lại thứ hệ thống đã có. Nguyên tắc ấy áp lên màn hình nhập
liệu; ⛔ không có lý do gì nó ⛔ không áp lên tài liệu quản trị.

### 2.2 Phán quyết

> **Knowledge Object mang SIÊU DỮ LIỆU và QUAN HỆ. Nó ⛔ KHÔNG mang toàn văn.**
> **Đối tượng ⟷ nguồn lệch nhau ⇒ NGUỒN THẮNG, luôn luôn.**

Vì vậy Knowledge System nằm ở **bậc 5 · Technical Documentation**, và điều đó là
**đúng chứ ⛔ không phải khiêm tốn**: một chỉ mục ⛔ không được có quyền cao hơn
thứ nó chỉ mục. Trường `tier` của mỗi đối tượng ghi bậc của **nguồn**, và bất
biến thức ⑥ *(SCHEMA §5.1)* cấm bằng máy việc một đối tượng ràng buộc thứ cao
quyền hơn nguồn của nó.

Ba hệ quả trực tiếp:

1. Sửa `KO-DEC-014` **⛔ không** làm đổi `BDR-14`. Muốn đổi `BDR-14` ⇒ **Board**.
2. Đối tượng bị xoá ⇒ **⛔ không mất tri thức nào** — nguồn vẫn nguyên vẹn.
3. Knowledge System hỏng toàn bộ ⇒ dự án **⛔ không mất gì ngoài tốc độ tra cứu**.

Điểm 3 là phép thử tôi tự đặt cho thiết kế này: **một lớp quản trị mới ⛔ không
được trở thành một điểm hỏng đơn lẻ mới.**

---

## §3 · ĐỌC HỆ THỐNG NÀY THẾ NÀO

| Bạn cần | Đi tới |
|---|---|
| *"Board đang phải quyết gì?"* | [`INDEX.md`](INDEX.md) §1 — bảng `PENDING_BOARD` |
| *"Nguyên tắc nào chi phối màn hình tôi đang thiết kế?"* | `objects/principle/` — 5 đối tượng, đủ bộ |
| *"Điều này bắt nguồn từ đâu?"* | Trường `related: derives_from` · lần ngược tới `tier` nhỏ hơn |
| *"Đổi cái này thì gãy cái gì?"* | `INDEX.md` §4 — chiều nghịch `constrained_by` · `blocked_by` |
| *"Toàn văn ở đâu?"* | Trường `source` của đối tượng. **Luôn đọc nguồn trước khi hành động.** |

⚠️ **Đối tượng dùng để ĐIỀU HƯỚNG và RÀ SOÁT. ⛔ Không dùng để trích dẫn thay
nguồn.** Trích dẫn hợp lệ vẫn theo ADR-010 §2.4: `Hiến pháp Điều 43.3`,
`BDR-14`, `DL-057`. Viết `KO-DEC-014 nói rằng…` trong một ADR là **trích dẫn chỉ
mục thay vì trích dẫn luật** — ⛔ không hợp lệ.

---

## §4 · QUAN HỆ VỚI `PROJECT_MEMORY.md`

Hai tài liệu **⛔ không cạnh tranh nhau**, và đây là chỗ dễ hiểu nhầm nhất:

| | `PROJECT_MEMORY.md` | Knowledge System |
|---|---|---|
| Dạng | tự sự tuyến tính, cho **người** | đồ thị đối tượng, cho **người + máy** |
| Đơn vị | mục §1…§12 | **một đối tượng = một tệp** |
| Kiểm được bằng máy | ⛔ không | ✅ chín bất biến thức |
| Trả lời | *"tri thức nằm ở đâu"* | *"tri thức nào **nối** với tri thức nào"* |
| Bậc ADR-010 | 5 | 5 — **ngang nhau** |

`PROJECT_MEMORY.md` **⛔ không bị thay thế** *(ràng buộc dự án: ⛔ không xoá tài
liệu cũ)*. Knowledge System là **lớp cấu trúc hoá** đặt cạnh nó. Hai bên lệch
nhau ⇒ **nguồn gốc bậc 0–4 thắng cả hai**.

---

## §5 · PHẠM VI ĐÃ GIEO — và phần CHƯA làm

🔴 **Đọc mục này trước khi kết luận hệ thống đã đầy đủ.**

| Sổ đăng ký nguồn | Tổng mục | Đã thành đối tượng | Trạng thái |
|---|---|---|---|
| 5 Nguyên tắc thiết kế | 5 | **5** | ✅ **đủ bộ** |
| Board Decision `BDR` | 29 | 6 | 🟠 **còn 23** |
| ADR | 18 tài liệu · 17 số | 4 | 🟠 **còn 13** |
| Khuyết tật `KD` | 13 | 4 | 🟠 **còn 9** |
| Mục quản trị chờ `GPR-001` | 26 | 4 | 🟠 **còn 22** |
| Decision Log `DL` | 149 | 0 | 🔴 **chưa bắt đầu** |
| Quy tắc kỹ thuật *(Playbook · Hiến pháp)* | ~46 | 7 | 🔴 **mới lấy mẫu** |
| `BOARD GOLDEN RULE` *(Board Directive 06/08)* | 1 | **1** | ✅ **đủ bộ** — `KO-PRN-006` |
| *(Reference — con trỏ tài liệu, ⛔ không phải sổ đăng ký)* | — | 5 | — |

**Tổng đã gieo: 38 đối tượng / ~230 mục tri thức đã biết ⇒ còn ~192.**
Lộ trình chuyển đổi phần còn lại: [`KO-PEN-005`](objects/pending/KO-PEN-005-lo-trinh-chuyen-doi-tri-thuc.md)
— 🔴 **chờ Board**, và CSA đề nghị **⛔ không ưu tiên** hơn công việc sản phẩm.

> ⚠️ **Bộ đã gieo là bộ MẪU chứng minh lược đồ chạy được trên nội dung THẬT —
> ⛔ không phải bản chuyển đổi đầy đủ.** Chuyển nốt là việc cơ học nhưng ⛔ không
> tự động hoá được: mỗi đối tượng cần một phán đoán về `category`, `tier` và
> quan hệ. Đề nghị Board giao thành từng đợt theo sổ đăng ký, ⛔ **không** giao
> một lượt — chuyển ẩu 149 `DL` sẽ sinh ra 149 quan hệ đoán mò.

---

## §6 · BẢO TRÌ

```bash
npm run knowledge     # dựng lại INDEX.md sau MỌI thay đổi trong objects/
npm run test:arch     # chạy phép kiểm toàn vẹn — ⛔ không cần CSDL
```

- Thêm đối tượng ⇒ theo khuôn `SCHEMA.md` §6 · số hiệu theo §1.2 · chạy hai lệnh trên.
- Đổi `status` ⇒ đổi kèm `date` **và** `approved_by` *(SCHEMA §7)*.
- ⛔ **Không xoá.** Dùng `SUPERSEDED` · `REJECTED` · `CLOSED`.
- Phát hiện đối tượng lệch nguồn ⇒ **sửa đối tượng**, ⛔ không sửa nguồn.
- Phát hiện hai nguồn mâu thuẫn nhau ⇒ `conflicts_with` **và** ghi vào
  [`NEEDS_CLARIFICATION.md`](../architecture/NEEDS_CLARIFICATION.md). ⛔ **Không
  tác nhân nào được tự chọn bên thắng** *(ADR-010 §2.2 quy tắc 2)*.
