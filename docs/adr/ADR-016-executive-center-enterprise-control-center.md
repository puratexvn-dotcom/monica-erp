# ADR-016 — Executive Center là Enterprise Control Center, không thuộc Business Domain nào

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-016 |
| **Trạng thái** | ✅ **APPROVED** — Board Decision 04/08/2026 |
| **Người soạn** | Chief Enterprise Architect |
| **Hiến pháp** | **Tu chính §5.4** · **Điều 18** · liên quan §18.7 · Điều 42 |
| **Thay thế** | Ràng buộc tuyệt đối *"mỗi Workspace đại diện một Business Domain"* ở §5.4 |
| **Migration** | ⛔ không có |
| **Thẩm quyền yêu cầu** | Board Decision 04/08/2026 · EDD-06 §2.4 |
| **Phát hiện bởi** | EDD-06 Architecture Consistency Audit · `C-2` |

---

## 1. Context

### 1.1 Mâu thuẫn đã được kiểm toán phát hiện `[VERIFIED]`

| Nguồn | Phát biểu |
|---|---|
| **Hiến pháp §5.4** | *"Each Workspace represents one Business Domain."* — ràng buộc **1:1 tuyệt đối** |
| **Hiến pháp §16.2** | Executive Center nằm trong danh sách Business Workspace |
| **EDD-01 §1.1** | Executive Center **⛔ KHÔNG sở hữu một bảng dữ liệu gốc nào** |

Ba phát biểu này ⛔ **không thể cùng đúng**. Nếu Executive Center là Workspace, và mỗi Workspace đại diện một Domain, thì Executive Center phải có một Domain — nhưng nó ⛔ không sở hữu dữ liệu, ⛔ không có aggregate, ⛔ không có ngôn ngữ riêng.

### 1.2 Bằng chứng đo được — Executive Center trượt phép thử của chính kiến trúc

EDD-01 §1.3 chấm Executive Center theo phép thử 5 câu *(`DL-001`)*:

| Phép thử | Kết quả | Ghi chú |
|---|---|---|
| T1 · Ngôn ngữ riêng | ❌ | Mượn ngôn ngữ của mọi Domain khác |
| T2 · Sở hữu dữ liệu | ❌ | 🔴 **⛔ Không sở hữu gì** |
| T3 · Nhịp thay đổi | ❌ | Theo nhịp của các Domain nó đọc |
| T4 · Người chịu trách nhiệm | ✅ | CEO / Director |
| T5 · Sai độc lập | ❌ | Sai chỉ khi Domain nguồn sai |

🔴 **1/5 điểm.** Theo luật chấm *(≥4 = Domain · 3 = Module · ≤2 = Feature)*, Executive Center **là Feature**, ⛔ không phải Domain.

> ⚠️ **Kiến trúc sư đã ghi nhận điều này công khai từ EDD-01** và giữ Executive Center trong danh sách **vì Hiến pháp Điều 18 đã ban hành nó là Workspace** — Hiến pháp ở bậc 1, phép thử ở bậc 2′. Đó là quyết định đúng về thứ bậc, và nó để lại một mâu thuẫn chưa được hiến định hoá.

### 1.3 Vì sao ⛔ không đơn giản gỡ Executive Center khỏi danh sách Workspace

Executive Center **là một nơi người dùng vào**. CEO đăng nhập và cần một chỗ để nhìn toàn cảnh. Gỡ nó khỏi danh sách Workspace nghĩa là **⛔ không có chỗ hiến định nào cho nó** — tệ hơn tình trạng hiện tại.

⇒ Lời giải đúng ⛔ không phải *gỡ bỏ* mà là **đặt tên đúng cho bản chất của nó**.

---

## 2. Decision

### 2.1 Executive Center là **Enterprise Control Center**

Board đặt tên chính thức: 🔴 **Enterprise Control Center**.

```
Enterprise Control Center

  · LÀ một Business Workspace theo nghĩa TRẢI NGHIỆM
      — người dùng vào đó, nó có vỏ, có điều hướng, có danh tính màu

  · ⛔ KHÔNG thuộc bất kỳ Business Domain nào
      — ⛔ không sở hữu aggregate · ⛔ không có ngôn ngữ riêng · ⛔ không có nhịp riêng

  · LÀ NGƯỜI TIÊU THỤ read-model của mọi Domain khác
      — mọi con số nó hiển thị đều thuộc về một Domain khác
```

### 2.2 Tu chính §5.4 — một ngoại lệ **có tên**

Bổ sung vào §5.4:

> *"Ngoại lệ hiến định duy nhất: **Enterprise Control Center** là Business Workspace ⛔ không có Business Domain tương ứng. Nó ⛔ không sở hữu dữ liệu nghiệp vụ; nó tiêu thụ read-model của các Business Domain khác. ⛔ Không Workspace nào khác được viện dẫn ngoại lệ này nếu ⛔ không có ADR riêng."*

> 🔴 **Câu cuối là câu quan trọng nhất.** Một ngoại lệ ⛔ không được trở thành một cánh cửa. **Chỗ trống có tên tốt hơn một chỗ trống im lặng** — cùng tinh thần với Điều 45 `Reserved` mà Board đã lập tiền lệ ở Hiến pháp v1.4.

### 2.3 Tu chính Điều 18 — bổ sung §18.10 · §18.11

**§18.10 · No Data Ownership**

> *"Enterprise Control Center ⛔ không sở hữu bất kỳ Business Object nào. Mọi thông tin hiển thị trong Enterprise Control Center có nguồn từ một Business Domain khác và phải truy vết được về Business Object gốc của Domain đó."*

**§18.11 · No Operational Write Authority**

> *"Enterprise Control Center ⛔ không có quyền ghi dữ liệu nghiệp vụ. Mọi hành động điều hành phát sinh từ Enterprise Control Center phải đi qua workflow của Business Domain sở hữu dữ liệu tương ứng. Quyết định điều hành được ghi nhận như một bản ghi riêng và ⛔ không sửa trực tiếp dữ liệu vận hành."*

⚠️ §18.11 ⛔ **không phải quy định mới** — nó là §18.7 *(Constitutional Boundaries)* phát biểu ở dạng tường minh và thi hành được.

### 2.4 Hệ quả thi hành

| Hạng mục | Ràng buộc |
|---|---|
| **Dữ liệu** | 🔴 **0 bảng gốc.** Đọc từ read-model `S7` |
| **Quyền** | 🔴 **0 năng lực ghi nghiệp vụ.** Kiểm được bằng một truy vấn quyền |
| **Màn hình** | Chỉ 🅑 Dashboard và 🅓 chỉ-đọc. ⛔ **0 màn hình ghi** — EDD-05 §4.2 |
| **Hành động** | Mọi nút → Work Inbox → workflow của Domain sở hữu |
| **Chỉ số** | Mọi con số có `MetricDefinition` mang mã, truy về sự kiện gốc *(`RM-1`…`RM-3`)* |
| **Tiết lộ** | Phần lớn nội dung là `RESTRICTED` ⇒ 🔴 **đóng dấu chìm màn hình** *(`DL-136`)* |

### 2.5 Vì sao ngoại lệ này an toàn

| # | Lý do |
|---|---|
| 1 | **Nó thu HẸP quyền, ⛔ không mở rộng** — Enterprise Control Center có **ít** quyền hơn mọi Workspace khác |
| 2 | **Nó làm cho một sự thật đã tồn tại trở nên nhìn thấy được** — Executive Center vốn ⛔ đã không sở hữu gì; ADR chỉ ghi nhận |
| 3 | **Nó có rào chặn tường minh** — §5.4 cấm Workspace khác viện dẫn nếu ⛔ không có ADR riêng |

---

## 3. Alternatives Considered

| Phương án | Vì sao ⛔ không chọn |
|---|---|
| **A · Gán cho Executive Center một Domain giả** *("Executive Domain")* | 🔴 **Nói dối mô hình.** Domain giả sẽ đòi aggregate giả, và sớm muộn có người ghi dữ liệu vào đó — đúng thứ §18.7 cấm. Và nó phá phép thử `DL-001` cho mọi Domain về sau |
| **B · Gỡ Executive Center khỏi danh sách Workspace**, coi là Global Service | Global Service *(§17)* là năng lực **dùng chung xuyên Workspace** — Executive Center ⛔ không phải thế, nó là **một nơi để vào**. Và gỡ đi thì CEO ⛔ không có chỗ hiến định nào |
| **C · Tách hẳn khái niệm Workspace ⟷ Domain thành 1:n** | Thay đổi sâu §5.4 · §16.2 · Điều 10 · Điều 16. Giải quyết **một** ngoại lệ bằng cách **phá bỏ một ràng buộc đang đúng cho 13 Workspace còn lại**. Chi phí ⛔ không tương xứng |
| **D · Để nguyên mâu thuẫn, ghi vào Technical Debt** | 🔴 Mâu thuẫn ở tầng Hiến pháp ⛔ **không phải nợ kỹ thuật** — nó là **nợ chuẩn tắc**, và nó làm mọi tranh chấp về §5.4 về sau ⛔ không giải được |

---

## 4. Consequences

### 4.1 Được

- Hiến pháp §5.4 ⛔ không còn tự mâu thuẫn với §16.2
- Bản chất *"người tiêu thụ read-model"* của Executive Center được hiến định hoá ⇒ **ngăn được việc ai đó thêm một bảng vào Executive Center**
- §18.11 biến §18.7 từ nguyên tắc thành **ràng buộc kiểm được bằng truy vấn quyền**
- Tên **Enterprise Control Center** mô tả đúng chức năng, thay cho một tên gợi ý sai về sở hữu

### 4.2 Đánh đổi

| # | Đánh đổi |
|---|---|
| 1 | Hiến pháp có **một ngoại lệ** ở một ràng buộc vốn tuyệt đối. Giảm rủi ro bằng câu cấm viện dẫn ở §5.4 |
| 2 | **Enterprise Control Center phụ thuộc hoàn toàn vào tầng read-model `S7`.** ⛔ Không có `S7`, nó ⛔ không có gì để hiển thị — điều này biến `S7` thành phụ thuộc cứng |

### 4.3 Technical Debt phát sinh

⛔ Không có.

---

## 5. Rollback Impact

Quay lui = xoá hai khoản §18.10 · §18.11 và câu ngoại lệ ở §5.4.

| | |
|---|---|
| **Migration · dữ liệu · mã** | ⛔ **không ảnh hưởng** |
| **Hệ quả** | Mâu thuẫn `C-2` quay lại: Hiến pháp §5.4 tự mâu thuẫn với §16.2 |

⚠️ Quay lui ⛔ **không** làm Executive Center sở hữu dữ liệu — nó chỉ làm mất **lời ghi nhận** rằng nó ⛔ không sở hữu.

---

## 6. References

- **Board Decision 04/08/2026** — *"ADR-016 APPROVED. Executive Center là Enterprise Control Center. ⛔ Không thuộc bất kỳ Business Domain nào."*
- Hiến pháp [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) **§5.4** · **Điều 18** *(§18.1 · §18.7)* · §16.2 · §17 · **Điều 42** · Điều 45 *(tiền lệ chỗ-trống-có-tên)*
- [EDD-01](../enterprise-design/EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) §1.1 · §1.3 — chấm 1/5 phép thử
- [EDD-05](../enterprise-design/EDD-05-PRODUCT-ARCHITECTURE.md) §4.2 · §6 — ⛔ 0 màn hình ghi
- [EDD-06](../enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) §2.3 `C-2` · §2.4
- Decision Log `DL-001` *(phép thử)* · `DL-002` *(14 = 13 + 1)* · `DL-007` *(Efficiency là MetricDefinition)* · `DL-136` *(dấu chìm màn hình)*
- [ADR-015](ADR-015-muoi-bon-business-workspace.md) — 14 Business Workspace
