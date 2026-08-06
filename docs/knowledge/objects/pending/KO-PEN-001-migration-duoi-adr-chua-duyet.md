---
id: KO-PEN-001
type: PendingDecision
title: 5 migration đang chạy SẢN XUẤT dưới 3 ADR chưa phê duyệt
category: Pending Board · Constitutional Procedure
status: PENDING_BOARD
source: docs/audit/GOVERNANCE_PENDING_REPORT.md · docs/PROJECT_MEMORY.md
approved_by: Chưa có
date: 2026-08-05
tier: 5
mirrors: GPR-001 A-1
related:
  - derives_from: KO-REF-003
  - depends_on: KO-ADR-020
---

# KO-PEN-001 — `A-1` · migration chạy dưới ADR chưa duyệt

## Phát biểu

🔴 **Năm migration đang chạy trên CSDL SẢN XUẤT dưới ba ADR chưa được Board phê
duyệt** — ADR-018 · ADR-019 · ADR-020. Migration `042` · `044` · `045` · `045b` ·
`046` **ĐÃ CHẠY**.

`GPR-001` xếp đây là **thủ tục hiến định bị đảo ngược**, ⛔ **không** phải nợ kỹ
thuật. Nó **chặn Cổng C**, và Board 05/08/2026 chốt là nó **⛔ không chặn Sprint I-2**.

## Board cần quyết gì

Chọn **một** trong hai, bằng văn bản:

| | Phương án | Hệ quả |
|---|---|---|
| **A** | **Phê chuẩn hồi tố** ba ADR *(đề nghị của CSA)* | thủ tục được khép, hệ thống giữ nguyên mức an toàn hiện tại |
| **B** | **Bác** | phải viết migration quay lui ⇒ 🔴 **hệ thống kém an toàn hơn hôm nay** |

⚠️ Ba migration ấy **đúng về kỹ thuật** và đã thu hẹp bề mặt tấn công một cách
**đo được** *(`authenticated_only` **22 → 0**)*.

## Vì sao chưa quyết được

Cả ba ADR **⛔ không có phản biện độc lập** — `KO-PEN-002`. ADR-011 §2.2 xếp RLS
vào diện **bắt buộc phản biện**.

## Nguồn đầy đủ

> `docs/audit/GOVERNANCE_PENDING_REPORT.md` §1 nhóm `A`, mục `A-1`.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
