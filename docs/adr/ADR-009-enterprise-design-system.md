# ADR-009 — Enterprise Design System · Business Visual Identity

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-009 |
| **Trạng thái** | ✅ **Đã phê duyệt** *(Architecture Board, 03/08/2026)* |
| **Hiến pháp** | Ban hành **PART VIII** · **Điều 44** — Hiến pháp lên `1.2` |
| **Thi hành ở** | [`lib/design/tokens.ts`](../../lib/design/tokens.ts) |
| **Migration** | không có — thay đổi thuần trình bày |

---

## 1. Context

### 1.1 Vì sao có quyết định này

Board phán quyết: *"Color is NOT decoration. Color is Information. Color is
Navigation. Color is Identity."* Người vận hành phải nhận ra một phân hệ, một
trạng thái, một thẻ **bằng màu trước khi kịp đọc chữ**.

### 1.2 Bằng chứng đo được

Trước quyết định này, mã màu **viết thẳng tại chỗ** rải khắp giao diện:

| Phép đo | Kết quả |
|---|---|
| Tệp `.tsx` chứa lớp màu viết thẳng | **106** |
| Chuỗi lớp màu trong riêng `app/home-modules.ts` | **64** |
| Nguồn màu tập trung | **không tồn tại** |
| Bảng màu biểu đồ chuẩn | **không tồn tại** — 3 tệp dùng Recharts, mỗi tệp tự chọn màu |
| Bảng màu trạng thái chuẩn | **không tồn tại** |

Hệ quả: màu của một phân hệ **trôi dần theo từng người sửa**. Không có nơi nào
trả lời được câu hỏi *"màu thật của Production là gì?"* — chỉ có mười mấy chỗ
cùng đoán.

### 1.3 Một cái bẫy build-xanh-màn-hình-hỏng đã được phát hiện khi thi hành

`tailwind.config.ts` chỉ quét `./pages`, `./components`, `./app`. Đặt hệ thẻ màu
vào `lib/` mà **không** mở rộng danh sách quét sẽ khiến Tailwind cắt sạch mọi lớp
màu khỏi CSS: **dev vẫn đủ màu** (còn cache lớp cũ), **production trắng trơn**, và
`npm run build` vẫn báo thành công.

Đây đúng loại lỗi mà Điều 44.6 sinh ra để chặn, và nó suýt xảy ra ngay trong lần
thi hành đầu tiên. `./lib/**/*` đã được thêm vào danh sách quét.

---

## 2. Decision

Ban hành **PART VIII — ENTERPRISE DESIGN SYSTEM**, **Điều 44 · Enterprise Visual
Identity**, gồm tám khoản: nguyên tắc · danh tính App · tính liên tục · màu ngữ
nghĩa · bảng màu biểu đồ · thẻ màu · khả năng tiếp cận · cưỡng chế.

Thi hành bằng **một** hệ thẻ màu duy nhất tại `lib/design/tokens.ts`:

| Nhóm | Nội dung |
|---|---|
| `MODULE_IDENTITY` | 16 Business App × 8 vai trò *(7 vai trò Board yêu cầu + vạch nhấn)* |
| `identityForPath()` | tra danh tính theo đường dẫn — cầu nối cho Điều 44.3 |
| `STATUS` | 10 trạng thái nghiệp vụ, 10 sắc riêng biệt |
| `CHART_PALETTE` · `chartColor()` | bảng màu biểu đồ, hai dải liền kề luôn khác hẳn sắc |
| `ELEV_*` · `GLASS` · `CANVAS` · `NOISE_URL` | mặt phẳng và độ cao |

**Mỗi danh tính mang cả lớp Tailwind lẫn mã hex.** Recharts vẽ bằng thuộc tính
SVG `fill`/`stroke`, nó không hiểu lớp CSS — thiếu hex thì biểu đồ của Production
không thể cùng màu với thẻ của Production.

---

## 3. Alternatives Considered

### Phương án A — Biến CSS trong `globals.css`

**Không chọn.** Biến CSS không đi qua trình kiểm kiểu. Gõ sai `--color-prodction`
sẽ im lặng ra màu rỗng, không ai biết cho tới khi nhìn màn hình. Hằng số
TypeScript thì sai một chữ là gãy lúc biên dịch.

### Phương án B — Mở rộng `theme.extend.colors` của Tailwind

**Không chọn.** Cấp được *bảng màu*, không cấp được *danh tính*. Vẫn phải nhớ
Production dùng sắc nào và tự ghép ở từng chỗ — tức vẫn là màu viết thẳng, chỉ
đổi tên. Và nó không giải quyết được phần hex cho biểu đồ.

### Phương án C — Thư viện thiết kế bên ngoài

**Không chọn.** Kéo theo phụ thuộc mới và một hệ thẻ màu **không** biết
"Merchandising" hay "AQL 2.5" là gì. Danh tính ở đây gắn với nghiệp vụ may, không
gắn với một bảng màu chung chung.

### Phương án D — Hằng số TypeScript có kiểu, một tệp duy nhất ✅

Kiểu `ModuleKey` khiến gõ sai tên App là **lỗi biên dịch**. Chuỗi lớp nguyên vẹn
nên Tailwind quét được. Kèm hex nên biểu đồ dùng chung được. Không thêm phụ thuộc.

---

## 4. Consequences

### Lợi ích

- **Một nguồn sự thật.** Sửa màu một App = sửa một dòng.
- **Danh tính chảy vào bên trong.** `identityForPath()` gắn vào
  `components/dashboard-topbar.tsx` — **một** chỗ sửa, cả 12 phân hệ lập tức
  mang đúng sắc ở đầu mọi màn hình nội bộ.
- **Sai tên bị bắt lúc biên dịch**, không phải lúc nhìn màn hình.
- **Độ tương phản được kiểm bằng phép đo.** Mọi cặp chữ/nền dùng sắc độ 600–700
  trên nền 50–100, đo được ≥ 4,5:1. Sắc độ 400 chỉ đạt ~2,5:1 và đã bị loại.

### Đánh đổi

- Màn hình cũ **chưa** chuyển hết sang thẻ màu — xem TD-07.
- Chưa có phép kiểm cưỡng chế Điều 44.6 — xem TD-08.

### Nợ kỹ thuật ghi nhận

| # | Nội dung | Trạng thái |
|---|---|---|
| **TD-07** | 106 tệp `.tsx` còn màu viết thẳng. Trang chủ và thanh đầu trang nội bộ đã chuyển; phần còn lại chưa. | 🟡 Mở |
| **TD-08** | Không có phép kiểm chặn màu viết thẳng trong màn hình nghiệp vụ. Điều 44.6 hiện chỉ được giữ bằng kỷ luật con người — mà kỷ luật con người là thứ đã tạo ra 106 tệp kia. | 🟡 Mở |
| **TD-09** | 3 tệp dùng Recharts chưa chuyển sang `CHART_PALETTE`. | 🟡 Mở |

---

## 5. Rollback Impact

Quay lui = xoá `lib/design/tokens.ts`, hoàn nguyên bốn tệp đã chuyển, gỡ PART VIII
khỏi Hiến pháp, gỡ `./lib/**/*` khỏi danh sách quét Tailwind.

**Không** migration, **không** đụng lược đồ, **không** đụng RLS, **không** đụng
phân quyền. Rủi ro quay lui nằm ở nhận diện thị giác, không nằm ở dữ liệu.

---

## 6. References

| Nguồn | Nội dung |
|---|---|
| [`architecture/00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) | PART VIII · Điều 44 · §44.1–§44.8 |
| [`UI_UX_STANDARDS.md`](../UI_UX_STANDARDS.md) | bố cục một phân hệ |
| [`TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) | sổ theo dõi TD-07 · TD-08 · TD-09 |
| `lib/design/tokens.ts` · `components/ui/status-chip.tsx` | nơi quyết định được thi hành |

---

## 7. ⚠️ Hai điểm cần Board xác nhận

1. **Board chỉ định "PART VII"**, nhưng PART VII đã là **GOVERNANCE** từ v1.0.
   Đánh số trùng sẽ tạo hai Phần cùng số hiệu trong một bản Hiến pháp. Đã ban
   hành thành **PART VIII**. Cần xác nhận.

2. **Số hiệu ADR.** Theo phán quyết quản trị ADR ngày 03/08/2026 — *một kho duy
   nhất, số hiệu duy nhất toàn cục, cấm chuỗi song song* — quyết định này lấy số
   **009** *(số cao nhất đang dùng là 008)* và đặt tại `docs/adr/`, tức kho chính
   thức. Nó **không** đi vào `docs/architecture/adr/`; chuỗi song song đó đang chờ
   gộp lại sau bàn giao.
