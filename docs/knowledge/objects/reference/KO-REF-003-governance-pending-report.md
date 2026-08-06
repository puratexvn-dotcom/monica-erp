---
id: KO-REF-003
type: Reference
title: GPR-001 — sổ theo dõi 26 mục quản trị còn chờ Board
category: Governance · Pending Register
status: ADOPTED
source: docs/audit/GOVERNANCE_PENDING_REPORT.md
approved_by: CSA
date: 2026-08-05
tier: 5
mirrors: GPR-001
related: []
---

# KO-REF-003 — `GPR-001` · sổ theo dõi mục quản trị còn chờ

## Phát biểu

`docs/audit/GOVERNANCE_PENDING_REPORT.md` **R1** — **26 mục quản trị** chưa xử,
chia năm nhóm `A`…`E`. §6 của nó là **sổ theo dõi dùng làm cổng kiểm**.

Đây là **hub** của mọi đối tượng loại `PendingDecision` trong Knowledge System:
mỗi `KO-PEN-*` đều `derives_from` đối tượng này.

## Vì sao

Board Decision 05/08/2026 tách Foundation làm hai: **Technical ✅ COMPLETE** ·
**Governance 🟠 PENDING**. Điều đó nghĩa là các mục quản trị **⛔ không chặn
Sprint** — nhưng chúng **⛔ không** vì thế mà biến mất. Chúng cần một nơi ⛔ không
để quên, và đây là nơi đó.

## Hệ quả nếu vi phạm

Nhóm `A` ghi **thủ tục hiến định bị đảo ngược**: 5 migration đang chạy **sản
xuất** dưới 3 ADR **chưa phê duyệt**, và **⛔ không ADR nào có phản biện độc lập**.
Mất dấu sổ này ⇒ mất dấu chính những việc đó — và chúng **chặn Cổng C**.

## Nguồn đầy đủ

> Toàn văn ở `docs/audit/GOVERNANCE_PENDING_REPORT.md`. Đối tượng này là **chỉ
> mục**, ⛔ không thay thế nguồn. Lệch nhau ⇒ **NGUỒN THẮNG**.
>
> ⚠️ Knowledge System mới gieo **4/26** mục thành đối tượng — xem `README.md` §5.
