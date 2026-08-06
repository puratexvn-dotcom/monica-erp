---
id: KO-RUL-005
type: Rule
title: ⛔ KHÔNG viết SQL trước khi ADR được phê duyệt
category: Engineering Rule · Constitutional Procedure · Migration
status: ADOPTED
source: docs/architecture/00-CONSTITUTION.md · docs/adr/README.md
approved_by: Board
date: 2026-08-02
tier: 1
mirrors: Hiến pháp Điều 4
related:
  - constrains: KO-PEN-001
---

# KO-RUL-005 — ⛔ không viết SQL trước khi ADR được duyệt

## Phát biểu

Thứ tự **⛔ không được đảo**, áp dụng từ migration `030` trở đi, **⛔ không ngoại lệ**:

```
Architecture Review → ADR (PHẢI DUYỆT XONG) → Migration Design → Impact Analysis
  → SQL Migration → Regression → Performance → Security → Snapshot → Commit
```

## Vì sao

ADR ghi **VÌ SAO** hệ thống phải đổi; SQL chỉ ghi **NHƯ THẾ NÀO** nó đã đổi. Viết
SQL trước ⇒ ADR biến thành bản tường thuật hợp thức hoá cho một việc đã rồi, và
phần *"Alternatives Considered"* trở thành hình thức.

## Hệ quả nếu vi phạm

⛔ **Đã vi phạm, và đang mở** — `KO-PEN-001`: **5 migration đang chạy SẢN XUẤT dưới
3 ADR chưa được phê duyệt**, ⛔ không ADR nào có phản biện độc lập. `GPR-001` xếp
đây là **thủ tục hiến định bị đảo ngược**, ⛔ không phải nợ kỹ thuật.

⚠️ Ba migration ấy **đúng về kỹ thuật** và đã thu hẹp bề mặt tấn công một cách đo
được. Đề nghị của CSA là **phê chuẩn hồi tố**, ⛔ **không** phải quay lui — bác
chúng làm hệ thống **kém an toàn hơn hôm nay**.

## Nguồn đầy đủ

> Toàn văn ở Hiến pháp `docs/architecture/00-CONSTITUTION.md` Điều 4; quy trình
> đầy đủ ở `docs/adr/README.md`. Lệch nhau ⇒ **NGUỒN THẮNG**.
