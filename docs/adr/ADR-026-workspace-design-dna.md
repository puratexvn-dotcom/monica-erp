# ADR-026 — Đóng băng MD Workspace và ban hành Design DNA cho toàn hệ

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-026 |
| **Trạng thái** | ✅ **ĐÃ PHÊ DUYỆT** — Board Directive 07/08/2026 *(MD v1.0 Final Polish · Freeze Candidate)* |
| **Người soạn** | Chief Solution Architect |
| **Thẩm quyền** | **Bậc 2 — ADR.** Ràng buộc mọi Workspace dựng mới hoặc dựng lại |
| **Phản biện độc lập** | ⛔ **chưa có** — Board uỷ quyền tự chạy trong phiên 07/08; ghi ở §5 để rà sau |
| **Migration** | ⛔ **không có** — thuần UX/quản trị |
| **Thi hành ở** | [`docs/WORKSPACE_DESIGN_DNA.md`](../WORKSPACE_DESIGN_DNA.md) · `tests/architecture/arch.test.mjs` mục ⑥ |

---

## 1. Context

### 1.1 Chỉ thị

> *"Sau khi hoàn thành và được Board duyệt, **đóng băng (Freeze)** cấu trúc MD
> Workspace và lấy đây làm **chuẩn thiết kế (Design DNA)** để tất cả Workspace
> còn lại của MONICA ONE (QA, Kho, Kế toán, HR, CRM...) kế thừa, thay vì mỗi
> module có một phong cách riêng. Điều này sẽ tạo trải nghiệm thống nhất và
> giúp người dùng **học một lần, sử dụng được toàn hệ thống**."*

### 1.2 Vì sao cần đóng băng `[VERIFIED]`

Kho đang có bằng chứng đo được rằng **mỗi phân hệ đi một đường**:

| Phép đo trên kho, 07/08/2026 | Kết quả |
|---|---|
| Workspace có Command Center ở đầu | **1 / 13** *(chỉ `/md`)* |
| Workspace có biểu đồ | 5 / 13 |
| Workspace có **0 biểu đồ** | `/ke-toan` `/kho` `/orders` `/admin` `/buyer` `/to-truong-hoan-thanh` |
| Phân hệ dùng `types/erp.ts` **⛔ không khớp CSDL** | `/ke-toan` `/buyer` *(đã vá)* |
| Phân hệ **chết hoàn toàn** khi rà | `/subcon` *(enum, đã vá)* |
| Trang nhập liệu **500** khi rà | 5 phân hệ *(đã vá)* |

🔑 ⛔ Không phải mỗi phân hệ **cố tình** khác nhau — chúng khác nhau vì **⛔ không
có chuẩn nào để giống**. Mỗi vòng phát triển lại phát minh lại một bố cục.

---

## 2. Decision

### 2.1 Đóng băng cấu trúc `/md`

**Tám tầng** của `/md` tại commit `4871d61b` là **cấu trúc chuẩn**:

```
Command Center → Quick Actions → Risk Center → Business Flow
→ Today's Focus → Data → Task → Report
```

⚠️ *"Đóng băng"* ở đây nghĩa là **cấu trúc và thứ tự**, ⛔ **không** phải từng
pixel. Phân hệ khác **được phép** khác về: tên khối · số ô KPI · loại biểu đồ ·
nội dung nghiệp vụ. Chúng **⛔ không được phép** khác về **thứ tự tám tầng** và
**mười luật `DNA-1…10`**.

### 2.2 🔑 Vì sao khoá THỨ TỰ mà ⛔ không khoá GIAO DIỆN

Khoá pixel sẽ chết ngay lần đầu một phân hệ có nhu cầu thật khác đi *(tổ trưởng
đứng ở chuyền cầm điện thoại ⟷ kế toán ngồi bàn hai màn hình)*, và một chuẩn
⛔ không thể tuân thủ thì **người ta tắt nó đi**.

Thứ tự thì khác: nó mã hoá **trình tự câu hỏi trong đầu người dùng**, và trình
tự đó **giống nhau ở mọi vai** — *tôi đang ở đâu → tôi làm gì → cái gì đang
cháy*. Đó chính là thứ khiến *"học một lần, dùng cả hệ thống"* thành sự thật.

### 2.3 Ba món nợ khai tường minh

`DNA-X1` *(tiêu điểm theo giờ)* · `DNA-X2` *(AI Today)* · `DNA-X3` *(đếm việc đã
hoàn thành)* — **⛔ chưa làm được vì thiếu DỮ LIỆU, ⛔ không phải thiếu công**.

⚠️ Ghi vào chuẩn, ⛔ **không** giấu. Một Workspace sau đọc chuẩn mà ⛔ không thấy
ba mục này sẽ tưởng chúng bị bỏ quên và tự dựng bản bịa của riêng nó.

---

## 3. Alternatives Considered

| Phương án | ⛔ Bị loại vì |
|---|---|
| **⛔ Không đóng băng, để mỗi phân hệ tự do** | Chính là tình trạng đo được ở §1.2 |
| **Khoá cả pixel bằng một bộ component dùng chung duy nhất** | Chết ở lần đầu có nhu cầu thật khác đi; và chuẩn ⛔ không tuân thủ được thì bị tắt |
| **Đóng băng khi MD mới 98%** | Nhân một khuôn có **tầng ⑤ rỗng** ra 12 Workspace là nhân cái rỗng. Đã dựng `sinhLichTaChoDonCu()` để tầng ⑤ sống trước *(0 → 210 mốc, việc hôm nay 0 → 167)* |
| **Viết chuẩn ⛔ không nêu món nợ** | Workspace sau sẽ tự bịa bản của riêng nó cho ba mục còn thiếu |

---

## 4. Consequences

### 4.1 Được
- Người dùng **học một lần** cho cả 13 Workspace
- Mỗi vòng dựng Workspace mới có **bảng đối chiếu 8 câu** thay vì tranh luận lại
- Ba món nợ nằm **trong tài liệu**, ⛔ không nằm trong trí nhớ ai

### 4.2 Đánh đổi
- Workspace nào đang có bố cục khác sẽ **phải dựng lại** — chi phí có thật
- Chuẩn khoá thứ tự nên một nhu cầu thật sự cần thứ tự khác sẽ phải **sửa ADR
  này**, ⛔ không được lặng lẽ làm khác

### 4.3 Rủi ro
- 🔴 **⛔ CHƯA CÓ PHÉP KIỂM TỰ ĐỘNG** cho tám tầng và mười luật. Bộ kiểm chỉ canh
  `WORKSPACE_DESIGN_DNA.md` **tồn tại** — đúng tình trạng `TD-GR1` của
  `REPORT_STANDARD.md`. Cưỡng chế còn lại là **kỷ luật rà soát**. Nợ: `TD-DNA1`.

---

## 5. ⚠️ Điều ADR này ⛔ KHÔNG khẳng định

- ⛔ **Chưa có phản biện độc lập.** ADR-011 §2.2 vẫn đòi rà chéo ⇒ **để mở**.
- ⛔ **Không** khẳng định `/md` đã hoàn hảo — nó khẳng định `/md` là **bản tốt
  nhất đang có** và là **điểm xuất phát chung**, ⛔ không phải điểm kết thúc.
- ⛔ **Không** nói gì về thứ tự tám tầng trên **màn hình điện thoại** — hiện xếp
  dọc theo đúng thứ tự đó, nhưng ⛔ **chưa đo được** với người dùng thật ở xưởng.
