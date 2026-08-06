---
id: KO-LIM-001
type: Limitation
title: Hai ADR-001 khác nhau cùng số hiệu
category: Known Defect · ADR Governance
status: OPEN
source: docs/PROJECT_MEMORY.md · docs/adr/README.md
approved_by: CSA
date: 2026-08-05
tier: 5
mirrors: KD-1
related:
  - derives_from: KO-ADR-010
---

# KO-LIM-001 — `KD-1` · hai `ADR-001` khác nhau

## Phát biểu

Kho có **hai tài liệu khác nhau cùng mang số `ADR-001`** `[VERIFIED]`:

| Đường dẫn | Nội dung |
|---|---|
| `docs/architecture/adr/ADR-001-…` | Homepage Conceptual Model |
| `docs/assignment/ADR-001-site-and-operation.md` | Địa điểm sản xuất & Công đoạn |

Board đã chốt **03/08/2026**: số ADR phải **duy nhất toàn cục**. Kho **chưa tuân
thủ**. Đây là mục **`B3`** của Cổng B và nợ **`TD-13`**.

## Vì sao chưa sửa

Gộp kho đòi **bảng ánh xạ số cũ → số mới**, và mọi trích dẫn `ADR-001` trong lịch
sử git · trong phần References của ADR-002 sẽ trỏ sai sau khi gộp. Việc này đã
được **dời tới sau bàn giao** một cách có chủ ý.

## Hệ quả nếu bỏ qua

Trích dẫn `ADR-001` trần **⛔ không phân giải được** — đúng loại lỗi mà ADR-010
§2.4 vừa chữa cho *"Điều IX"*. Bộ kiểm kiến trúc mục ⑧ chỉ bắt trùng số **trong**
`docs/adr/`, nên hai bản này **lọt qua**.

## Nguồn đầy đủ

> `docs/PROJECT_MEMORY.md` §8 `KD-1` · `docs/adr/README.md` ghi chú cuối trang.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
