---
id: KO-DEC-021
type: Decision
title: Phân tách nhiệm vụ (SoD) — Hybrid, cảnh báo + chặn cứng
category: Board Decision · Permission · Segregation of Duties
status: ADOPTED
source: docs/PROJECT_MEMORY.md · docs/enterprise-design/EDD-04-WORKFLOW-RULE-PERMISSION.md
approved_by: Board
date: 2026-08-06
tier: 0
mirrors: BDR-21
related:
  - implements: KO-PRN-003
  - constrains: KO-RUL-001
---

# KO-DEC-021 — `BDR-21` · phân tách nhiệm vụ

## Phát biểu

Mô hình **Hybrid**: phần lớn xung đột nhiệm vụ xử bằng **cảnh báo**, nhưng có
**chặn cứng** — **3 do Board chỉ định**, CSA bổ sung 6 ⇒ tổng **9 quy tắc chặn
cứng** *(`PROJECT_MEMORY` §7.3)*.

Chặn cứng ⛔ **không** cấu hình tắt được ở tầng L1 hay L2.

## Vì sao

Chặn cứng tất cả ⇒ nhà máy nhỏ ⛔ không đủ người để vận hành. Cảnh báo tất cả ⇒ SoD
chỉ là trang trí. Ranh giới nằm ở chỗ **hậu quả có thu hồi được ⛔ không** —
`P-IRREV`.

## Hệ quả nếu vi phạm

`SOD-06` là ví dụ đang mở: **Giám đốc sản xuất duyệt cả giá bán lẫn giá mua** —
hiện ở **mức cảnh báo**, ghi ở `KD-12`. Đây là rủi ro **có tên, có chủ**, ⛔ không
phải rủi ro bị bỏ sót.

🔑 Quyết định này **ràng buộc** `KO-RUL-001`: quyền phân theo Assignment vẫn phải
đi qua 9 chặn cứng — Assignment ⛔ **không** ghi đè SoD.

## Nguồn đầy đủ

> Sổ đăng ký ở `docs/PROJECT_MEMORY.md` §6.2 dòng `21`; 9 quy tắc ở §7.3; luận cứ
> ở EDD-04. Lệch nhau ⇒ **NGUỒN THẮNG**.
>
> ⚠️ `date` là **ngày ghi nhận vào Knowledge System** *(`SCHEMA.md` §2.2)*.
