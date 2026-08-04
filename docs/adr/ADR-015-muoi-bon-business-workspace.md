# ADR-015 — Mười bốn Business Workspace hiến định

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-015 |
| **Trạng thái** | ✅ **APPROVED** — Board Decision 04/08/2026 |
| **Người soạn** | Chief Enterprise Architect |
| **Hiến pháp** | **Tu chính §16.2** · §1.3 · §5.3 · Điều 20 · Điều 42 *(thủ tục tu chính)* |
| **Thay thế** | Danh sách 11 Business Workspace ở §16.2 *(Hiến pháp v1.0–v1.5)* |
| **Migration** | ⛔ không có — thay đổi thuần chuẩn tắc |
| **Thẩm quyền yêu cầu** | Board Decision 04/08/2026 · phê duyệt EDD-01 · EDD-06 §2.4 |
| **Phát hiện bởi** | EDD-06 Architecture Consistency Audit · `C-1` |

---

## 1. Context

### 1.1 Mâu thuẫn đã được kiểm toán phát hiện `[VERIFIED]`

| Nguồn | Phát biểu |
|---|---|
| **Hiến pháp §16.2** *(bậc 1)* | *"The constitutional Business Workspaces are:"* — liệt kê **11** · *"Additional Business Workspaces may only be introduced through an approved Architecture Decision Record (ADR)."* |
| **EDD-01 Phase 3** *(bậc 2′)* | **14** Business Domain / 14 Workspace |

Board đã phê duyệt EDD-01 và EDD-05. Nhưng **phê duyệt một tài liệu bậc 2′ ⛔ không tu chính được Hiến pháp bậc 1** — Hiến pháp Điều 42 đòi tu chính qua ADR, và chính §16.2 đòi *"an approved ADR"*.

⇒ Ba Workspace đang vận hành **⛔ không có cơ sở hiến định**. ADR này lấp đúng khoảng trống thủ tục đó.

### 1.2 Ba Workspace bổ sung và căn cứ của từng cái

| Workspace | Căn cứ nghiệp vụ | Căn cứ kiến trúc |
|---|---|---|
| **Product Development** | 🔴 **Board đã tự phát biểu Sample Management là *"năng lực nghiệp vụ ĐỘC LẬP"*** — BKB `BR-SMP-003`. Và BKB `FD-003` ghi rõ: *"Hiến pháp PART IV ⛔ không có Điều nào cho nó"* | EDD-01 §1.3 — đạt **5/5** phép thử Domain `DL-001` |
| **Industrial Engineering** | 🔴 **SMV có BỐN người tiêu thụ và KHÔNG người nào tự nhiên sở hữu**: Costing *(giá)* · Capacity *(nhận nổi ⛔ không)* · Efficiency *(đạt bao nhiêu)* · Piece-rate *(trả bao nhiêu)*. Một con số 4 người dùng, 0 chủ **sẽ thành 4 con số** | EDD-01 §1.3 · `DL-039` |
| **Procurement** | 🔴 **Board Decision EDD-02 Review:** *"Procurement KHÔNG còn là Domain chờ tương lai. Tôi quyết định tạo Procurement ngay từ phiên bản đầu tiên."* Và: FOB ~30% doanh thu đi qua mua NPL | EDD-01 §1.3 · vai `md` hôm nay tên là *"Merchandiser & **Thu Mua**"* — người bán và người mua **chung một cái ví** |

### 1.3 Phép thử đã dùng để xác định Domain

Tiêu chí do EDD-01 §1.2 đặt ra và Board phê duyệt *(`DL-001`)* — **≥4/5 = Domain**:

| # | Phép thử | Câu hỏi |
|---|---|---|
| T1 | **Ngôn ngữ riêng** | Có từ nào mang nghĩa khác chỗ khác ⛔ không? |
| T2 | **Sở hữu dữ liệu** | Có aggregate nào **chỉ nó được ghi** ⛔ không? |
| T3 | **Nhịp thay đổi** | Đổi theo nhịp khác hàng xóm ⛔ không? |
| T4 | **Người chịu trách nhiệm** | Có **một** người chịu trách nhiệm kết quả ⛔ không? |
| T5 | **Sai độc lập** | Nó **sai một mình** được ⛔ không? |

⚠️ **T4 áp cho VAI TRÒ, ⛔ không áp cho CON NGƯỜI.** Một Domain có Role được định nghĩa nhưng hôm nay do người khác kiêm nhiệm thì **vẫn đạt T4** — cơ chế `Domain Activation Model` *(`DL-003`)* xử lý phần tổ chức.

---

## 2. Decision

### 2.1 Danh sách 14 Business Workspace hiến định

Hiến pháp §16.2 từ nay khai **mười bốn** Business Workspace:

```
🔴 CORE — nơi doanh nghiệp thắng hoặc thua đối thủ
  1. Commercial
  2. Merchandising
  3. Product Development          🆕
  4. Industrial Engineering       🆕
  5. Planning
  6. Production
  7. Quality

🟠 SUPPORTING — bắt buộc phải đúng, ⛔ không tạo lợi thế cạnh tranh
  8. Procurement                  🆕
  9. Warehouse
 10. Shipment
 11. Subcontract
 12. Finance
 13. Human Resources

🔵 OVERSIGHT
 14. Executive Center             (xem ADR-016)
```

### 2.2 Hai Workspace được làm rõ ranh giới

| Workspace | Điều chỉnh | Vì sao |
|---|---|---|
| **Merchandising** *(Điều 20)* | **Sample Management chuyển sang Product Development** | `BR-SMP-003` — Board xếp là năng lực độc lập. Sample có vòng đời riêng, chủ sở hữu riêng, nhịp thay đổi riêng so với Order |
| **Merchandising** | `Style` · `TechPack` · `BOM` chuyển sang Product Development | Cùng lập luận. `Style` dùng lại nhiều đơn *(`DL-011`)*, ⛔ không thuộc vòng đời một đơn |

⚠️ **Costing GIỮ NGUYÊN trong Merchandising** — nó đạt 3/5 phép thử, là **Module ⛔ không phải Domain** *(`DL-006`)*.

### 2.3 Domain Activation Model — điều kiện để 14 Workspace ⛔ không làm ngợp doanh nghiệp nhỏ

Mỗi Workspace mang một trong ba trạng thái *(`DL-003`)*:

| Trạng thái | Aggregate | Role | Hiển thị |
|---|---|---|---|
| 🟢 `ACTIVE` | có dữ liệu | người chuyên trách | hiện trên trang chủ |
| 🟡 `EMBEDDED` | **có dữ liệu** | **do người Domain khác kiêm** | ẩn — việc hiện trong Workspace người kiêm, **mang nhãn Domain thật** |
| ⚪ `DORMANT` | lược đồ đặt chỗ, 0 dòng | chưa có | ẩn |

**Chín Workspace bắt buộc · năm bật-tắt được** *(`DL-004`)*:

| Bắt buộc luôn | Bật/tắt theo doanh nghiệp |
|---|---|
| Commercial · Merchandising · Product Development · Planning · Production · Quality · Warehouse · Shipment · Finance · Executive Center | **Industrial Engineering** · **Procurement** · **Subcontract** · **Human Resources** |

> 🔴 **Đây là điều làm cho 14 Workspace ⛔ không mâu thuẫn với mục tiêu *"đơn giản nhưng đủ mạnh"*.** Nhà máy CMT thuần 150 công nhân bật **9 Workspace**, trong đó 5 ở trạng thái `EMBEDDED` — họ thấy một hệ thống gọn. Tập đoàn 4 nhà máy FOB bật **14**, tất cả `ACTIVE`.
> **Cùng một bộ mã nguồn. Khác nhau ở bảng cấu hình `domain_activation`.**

### 2.4 Trạng thái tại Monica Garment

| Workspace | Activation | Ai giữ Role hôm nay |
|---|---|---|
| Merchandising · Production · Quality · Warehouse · Shipment · Subcontract · Finance · Procurement · Executive Center | 🟢 ACTIVE | có người chuyên trách |
| Commercial | 🟡 EMBEDDED | Merchandiser |
| **Product Development** | 🟡 EMBEDDED | Merchandiser |
| **Industrial Engineering** | 🟡 EMBEDDED | Merchandiser *(người chiết tính)* |
| Planning | 🟡 EMBEDDED | Giám đốc sản xuất |
| Human Resources | 🟡 EMBEDDED | Kế toán |

### 2.5 Hệ quả với trang chủ

Trang chủ hiển thị **19 Business App**: 14 Workspace · 4 Global Service · 1 Platform Service.
🔴 **Lọc theo quyền** — Hiến pháp §13.5 · trả `TD-05`. ⛔ Không thẻ nào dẫn tới `/unauthorized`.

---

## 3. Alternatives Considered

| Phương án | Vì sao ⛔ không chọn |
|---|---|
| **A · Giữ 11 Workspace** | Trượt phép thử **T1** ở ba chỗ. Bằng chứng đo được: `/md` hôm nay có **13 tab** nói **ba ngôn ngữ** *(khách hàng · sản phẩm · đơn hàng)*, tệp chính **886/900 dòng** — chạm trần kỹ thuật vì ranh giới sai. Giữ 11 = chấp nhận Merchandising vĩnh viễn là Domain 3-ngôn-ngữ, và **mỗi tính năng MD về sau đều phải chọn nói ngôn ngữ nào** |
| **B · 16 Workspace** *(thêm Compliance · Maintenance)* | Cả hai **đạt tiêu chuẩn kỹ thuật** nhưng **Board chưa yêu cầu**. ⛔ Không tự mở Domain chỉ vì mô hình đẹp. Giữ ⚪ DORMANT, chừa đường: `Document` gắn được vào `Factory` và `Party`, `Machine` là thực thể có mã |
| **C · Ba năng lực mới là Module trong Workspace có sẵn** | Product Development trượt **T3** *(đổi theo mã hàng, ⛔ không theo đơn)*. Industrial Engineering trượt **T2** *(SMV cần chủ sở hữu duy nhất)*. Procurement trượt **T5** — và Board đã bác tường minh |
| **D · Tách Domain khỏi Workspace 1:n** | Đòi tu chính §5.4 sâu hơn nhiều. ADR-016 chỉ mở **một ngoại lệ có tên** thay vì phá bỏ ràng buộc 1:1 |

---

## 4. Consequences

### 4.1 Được

- Ranh giới ngôn ngữ sạch — mỗi Domain một bộ từ vựng *(T1)*
- `Style` dùng lại được nhiều đơn mà ⛔ không kẹt trong vòng đời một đơn
- **SMV có đúng một chủ sở hữu** ⇒ giá · năng lực · hiệu suất · lương đọc **cùng một con số**
- Người bán và người mua ⛔ không còn chung một ví
- Thương mại hoá: cùng một bộ mã phục vụ nhà máy 150 người và tập đoàn 3.000 người

### 4.2 Đánh đổi

| # | Đánh đổi | Ghi nhận |
|---|---|---|
| 1 | **Trang chủ từ 16 lên 19 thẻ** | Giảm bằng lọc theo quyền §13.5 — thực tế mỗi người thấy 2–5 thẻ |
| 2 | 🔴 **Ba Workspace `EMBEDDED` ⛔ không có chủ thật** — rủi ro bị bỏ rơi | Đối trọng: việc của chúng **hiện trong hộp thư người kiêm nhiệm, mang nhãn Domain thật** — người kiêm học được ranh giới trước khi có phòng riêng |
| 3 | **Chi phí trước mắt ~10–15%** cho aggregate và Role của Domain chưa ai ngồi | Đổi lại: tách sau tốn **1 thao tác quản trị + 1 dòng cấu hình**, ⛔ không phải di trú dữ liệu |

### 4.3 Technical Debt phát sinh

⛔ Không có. `TD-05` *(trang chủ chưa lọc quyền)* đã tồn tại từ trước, nay trở thành **điều kiện bắt buộc** của ADR này.

---

## 5. Rollback Impact

Quay lui = ba Workspace về trạng thái 🟡 `EMBEDDED` trong Merchandising và một cờ cấu hình.

| | |
|---|---|
| **Migration** | ⛔ không — aggregate đã tách từ đầu *(`DL-003` cơ chế 1)* |
| **Dữ liệu** | ⛔ không mất |
| **Mã** | ⛔ không đổi — chỉ đổi `domain_activation` |
| **Thiết kế đã ban hành** | ⛔ **không tự động vô hiệu** — Hiến pháp §43.7 |

⚠️ Nhưng quay lui **⛔ không giải được** ba vấn đề ở §1.2: SMV vẫn ⛔ không có chủ, người bán vẫn chung ví với người mua, Merchandising vẫn nói ba ngôn ngữ.

---

## 6. References

- **Board Decision 04/08/2026** — *"ADR-015 APPROVED. 14 Business Workspace trở thành kiến trúc chính thức của Monica ONE."*
- Hiến pháp [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) **§16.2** · §1.3 · §5.3 · §13.5 · Điều 20 · **Điều 42**
- [EDD-01](../enterprise-design/EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) Phase 3 — phép thử 5 câu · bản đồ 14 Domain
- [EDD-06](../enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) §2.3 `C-1` · §2.4 nội dung tu chính
- [BKB](../business/BUSINESS_KNOWLEDGE_BASE.md) `BR-SMP-003` · `FD-003` · `BR-CST-004`
- Decision Log `DL-001` *(phép thử)* · `DL-003` *(Activation Model)* · `DL-004` *(9 bắt buộc / 5 bật-tắt)* · `DL-006` *(Costing là Module)* · `DL-011` *(Style dùng lại)* · `DL-039` *(SMV một chủ)*
- [ADR-010](ADR-010-thu-bac-van-ban-chuan-tac.md) — thứ bậc văn bản · [ADR-011](ADR-011-tham-quyen-kien-truc.md) — thẩm quyền thiết kế
