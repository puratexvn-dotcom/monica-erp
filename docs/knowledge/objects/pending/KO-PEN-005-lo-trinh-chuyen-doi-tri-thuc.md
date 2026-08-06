---
id: KO-PEN-005
type: PendingDecision
title: Lộ trình chuyển đổi ~196 mục tri thức còn lại thành Knowledge Object
category: Pending Board · Knowledge Governance · Roadmap
status: PENDING_BOARD
source: docs/knowledge/README.md · docs/adr/ADR-023-board-knowledge-system.md
approved_by: Chưa có
date: 2026-08-06
tier: 5
mirrors: TD-KS1
related:
  - derives_from: KO-ADR-023
---

# KO-PEN-005 — lộ trình chuyển đổi phần tri thức còn lại

## Phát biểu

ADR-023 đã được duyệt, nhưng **hai câu hỏi trong `KO-PEN-004` ⛔ chưa được trả
lời**. Đã gieo **38 / ~230** mục ⇒ **~192 mục còn lại**, gồm **149 `DL`**.

## Board cần quyết gì

| # | Câu hỏi | Đề nghị của CSA |
|---|---|---|
| ① | Chuyển đổi theo **đợt nào**? | `BDR` *(còn 23)* → `KD` *(9)* → `GPR-001` *(22)* → `ADR` *(13)* → **149 `DL` sau cùng** |
| ② | `PROJECT_MEMORY` §5–§9 **trỏ vào** đối tượng thay vì lặp lại? | 🟡 **có**, nhưng **sau** ①. Làm sớm ⇒ chỉ mục trỏ vào đối tượng ⛔ chưa tồn tại |
| ③ | Việc này có **ưu tiên** hơn công việc sản phẩm ⛔ không? | 🔴 **KHÔNG** — xem dưới |

## Vì sao đề nghị ③ là KHÔNG

Áp chính `KO-PRN-006` *(BOARD GOLDEN RULE)* lên chính việc này:

| Phần | Chuyển đổi 149 `DL` tạo ra gì |
|---|---|
| **Business Value** | ⚪ ⛔ gần bằng 0 — tri thức **đã tồn tại** và đã tra được |
| **User Value** | ⚪ **0** — ⛔ không người dùng cuối nào chạm tới `DL` |
| **Commercial Value** | ⚪ **0** |

🔑 Nó chỉ tạo giá trị **khi có người thật sự cần truy vết một quyết định** — nghĩa
là nên chuyển đổi **theo nhu cầu**, ⛔ không chuyển đổi hàng loạt. Chuyển ẩu 149
mục một lượt sẽ sinh **149 quan hệ đoán mò**, và quan hệ đoán mò **tệ hơn ⛔ không
có quan hệ**: nó trông như tri thức đã được kiểm.

## Hệ quả nếu bỏ qua

Bộ mẫu **38 đối tượng** dễ bị đọc nhầm là *"đã xong"*. `README.md` §5 và đối tượng
này là hai chỗ ghi rõ **⛔ CHƯA XONG, và còn bao nhiêu**.

## Nguồn đầy đủ

> Bảng phạm vi đầy đủ ở `docs/knowledge/README.md` §5; nợ `TD-KS1` · `TD-KS3` ở
> ADR-023 §4.4. Lệch nhau ⇒ **NGUỒN THẮNG**.
