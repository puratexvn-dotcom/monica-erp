---
id: KO-PRN-003
type: Principle
title: P-ATTRIB — Ngăn ở chỗ ngăn được, quy trách nhiệm ở chỗ ⛔ không ngăn được
category: Design Principle · Accountability · Security
status: ADOPTED
source: docs/PROJECT_MEMORY.md · docs/enterprise-design/EDD-04F-DATA-EGRESS-CONTROL.md · docs/ARCHITECTURE_BASELINE.md
approved_by: Board
date: 2026-08-04
tier: 2'
mirrors: P-ATTRIB
related:
  - derives_from: KO-DEC-014
---

# KO-PRN-003 — `P-ATTRIB` · quy trách nhiệm

## Phát biểu

**Ngăn ở chỗ ngăn được; quy trách nhiệm ở chỗ ⛔ không ngăn được; và ⛔ TUYỆT ĐỐI
không dựng kiểm soát giả.**

Ba vế, vế thứ ba nặng nhất. Một nút *"⛔ không được chụp màn hình"* là **kiểm soát
giả** — nó ⛔ không ngăn được gì, nhưng nó làm người thiết kế tin rằng đã ngăn.

Đây là câu `G5` của Screen Design Gate.

## Vì sao

Có những kênh rò ⛔ **không** chặn được bằng kỹ thuật: chụp màn hình, đọc to qua
điện thoại, chép tay. Với chúng, cơ chế đúng là **dấu chìm · nhật ký · danh tính
gắn với từng lần xem** — để khi việc xảy ra thì **truy được ai**.

## Hệ quả nếu vi phạm

Kiểm soát giả **tệ hơn ⛔ không kiểm soát**: nó tạo cảm giác an toàn sai, nên ⛔
không ai xây cơ chế thật. Cặp đôi bắt buộc của nguyên tắc này là **Audit Log bất
biến** *(`KO-DEC-014`)* — ⛔ không có sổ ⛔ không sửa được thì ⛔ không quy được
trách nhiệm cho ai.

## Nguồn đầy đủ

> Toàn văn ở `docs/enterprise-design/EDD-04F-DATA-EGRESS-CONTROL.md`.
> Lệch nhau ⇒ **NGUỒN THẮNG**. *(Xem thêm ghi chú lệch số hiệu `BDR` ở
> `KO-PRN-002`.)*
