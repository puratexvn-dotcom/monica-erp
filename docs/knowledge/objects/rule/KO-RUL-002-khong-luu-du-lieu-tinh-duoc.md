---
id: KO-RUL-002
type: Rule
title: ⛔ Không lưu dữ liệu TÍNH ĐƯỢC vào cơ sở dữ liệu
category: Engineering Rule · Data Model · Single Source of Truth
status: ADOPTED
source: docs/MONICA_CONSTITUTION.md · docs/PROJECT_MEMORY.md
approved_by: Board
date: 2026-08-04
tier: 4
mirrors: —
related:
  - evidenced_by: KO-REF-004
---

# KO-RUL-002 — ⛔ không lưu dữ liệu tính được

## Phát biểu

**⛔ Không lưu `delay_days` · `completion_percent` · `risk_score` — hay bất cứ giá
trị nào DẪN XUẤT được từ dữ liệu khác.** Dùng **SQL View · Materialized View ·
Service**.

Đây là câu `G6` của Screen Design Gate: *"Một dữ liệu tồn tại nhiều nơi ⛔ không?"*

## Vì sao

Giá trị dẫn xuất **lưu lại** là một bản sao, và bản sao **lệch** ngay lần đầu ai
đó sửa dữ liệu gốc mà quên chạy lại phép tính. Từ lúc đó, hệ thống có **hai câu
trả lời** cho cùng một câu hỏi và ⛔ không cách nào biết câu nào đúng.

## Hệ quả nếu vi phạm

Đã xảy ra thật: `KD-3` — `po-twin.service.ts` trả **hằng số `0`** cho
`late_milestones`. Màn hình xanh, số liệu sai, và ⛔ không phép kiểm nào bắt được vì
`0` là một con số hợp lệ. Đã đóng 05/08 bằng cách dời luật đếm sang
`milestone-lateness.calculator.ts` để **hai màn hình gọi cùng một hàm**.

## Nguồn đầy đủ

> Toàn văn ở `docs/MONICA_CONSTITUTION.md` *(bậc 4 · vẫn ràng buộc đầy đủ)*.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
