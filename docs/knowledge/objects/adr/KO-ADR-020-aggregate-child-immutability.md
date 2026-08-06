---
id: KO-ADR-020
type: AdrReference
title: ADR-020 — Aggregate Child Immutability
category: ADR · Domain Model · Immutability
status: PENDING_BOARD
source: docs/adr/ADR-020-aggregate-child-immutability.md
approved_by: Chưa có
date: 2026-08-05
tier: 2
mirrors: ADR-020
related:
  - depends_on: KO-PEN-002
---

# KO-ADR-020 — Aggregate Child Immutability

## Phát biểu

Dòng con của một Aggregate **⛔ không được sửa** sau khi Aggregate cha đã chốt.
Cưỡng chế bằng **trigger** ở migration `046` — **ĐÃ CHẠY trên sản xuất**.

🔴 **Trạng thái: chờ Board phê duyệt.** Migration đã chạy **trước** khi ADR được
duyệt.

## Vì sao đối tượng này quan trọng

Đây là **ADR duy nhất ⛔ không có hồ sơ phản biện nào** *(`PROJECT_MEMORY` §9 mục
`1‴`)*, và nó **chặn Sprint I-4**.

Nó cũng là một trong ba ADR tạo nên `KO-PEN-001` — thủ tục hiến định bị đảo ngược.

## Hệ quả nếu bỏ qua

Migration `046` dựng **bất biến** — một **cửa một chiều CÓ CHỦ Ý**, ⛔ không có
`_down.sql`, và đó là đúng *(CLAUDE.md §8.1)*. Nghĩa là: Board **bác** ADR này thì
việc quay lui ⛔ **không rẻ**, và phải viết migration bù có chủ đích.

⚠️ `V-8` ghi: **chi phí trigger `045`/`046` CHƯA TỪNG ĐƯỢC ĐO.** Ngân sách tham
chiếu `< 300ms` vì vậy ⛔ **chưa có cơ sở** trên đường ghi này.

## Nguồn đầy đủ

> Toàn văn ở `docs/adr/ADR-020-aggregate-child-immutability.md`.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
