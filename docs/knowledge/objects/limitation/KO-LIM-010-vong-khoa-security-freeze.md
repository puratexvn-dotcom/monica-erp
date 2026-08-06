---
id: KO-LIM-010
type: Limitation
title: Vòng khoá SECURITY FREEZE — migration 031d…031g chặn lẫn nhau
category: Known Defect · Security Freeze · Migration
status: OPEN
source: docs/PROJECT_MEMORY.md · docs/MIGRATION_INDEX.md
approved_by: CSA
date: 2026-08-05
tier: 5
mirrors: KD-10
related:
  - blocks: KO-PEN-003
---

# KO-LIM-010 — `KD-10` · vòng khoá SECURITY FREEZE

## Phát biểu

🔴 Chuỗi migration **`031d` → `031g`** chặn lẫn nhau. SECURITY FREEZE
*(`MOS §XI.1`)* chỉ được cắt khi chuỗi hoàn tất **và được xác nhận bằng văn bản** —
nhưng chuỗi ⛔ không chạy tiếp được khi freeze còn hiệu lực.

Trong lúc freeze còn: ⛔ **không mở Domain · Module · bảng nghiệp vụ mới**. Được
làm: vá lỗ hổng **đã đo**, viết bài kiểm/tài liệu/audit, sửa lỗi gãy vận hành.

## Vì sao chưa sửa

Cắt vòng khoá là **quyết định của Board**, ⛔ không phải của CSA — `KO-PEN-003`.
CSA tự cắt là tự cho mình thẩm quyền mà ADR-011 ⛔ không trao.

## Hệ quả nếu bỏ qua

Freeze *"mở trên giấy, bị vượt trên thực tế"* là mô tả của `GPR-001` `A-3`. Một
lệnh cấm **⛔ không ai cắt và ⛔ không ai tuân** thì tệ hơn ⛔ không có lệnh cấm:
nó dạy mọi người rằng lệnh cấm ở đây là hình thức.

## Nguồn đầy đủ

> `docs/PROJECT_MEMORY.md` §8 `KD-10` · `docs/MIGRATION_INDEX.md` §5 · `GPR-001` `A-3`.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
