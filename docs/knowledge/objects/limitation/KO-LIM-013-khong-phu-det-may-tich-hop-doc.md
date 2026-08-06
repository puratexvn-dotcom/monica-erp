---
id: KO-LIM-013
type: Limitation
title: Kiến trúc ⛔ KHÔNG phủ mô hình dệt–may tích hợp dọc — giới hạn CÓ TÊN
category: Known Limitation · Scope · Domain
status: ACCEPTED
source: docs/PROJECT_MEMORY.md · docs/enterprise-design/EDD-04-WORKFLOW-RULE-PERMISSION.md
approved_by: Board
date: 2026-08-04
tier: 2'
mirrors: KD-13
related:
  - derives_from: KO-REF-002
---

# KO-LIM-013 — `KD-13` · ⛔ không phủ dệt–may tích hợp dọc

## Phát biểu

Kiến trúc hiện tại **⛔ KHÔNG phủ** mô hình doanh nghiệp **dệt–may tích hợp dọc**
*(tự dệt vải rồi tự may)*. Đây là **giới hạn CÓ TÊN** — `DL-079` — ⛔ **không**
phải thiếu sót bị bỏ quên.

Trạng thái `ACCEPTED`: Board chấp nhận **có chủ ý**.

## Vì sao chấp nhận

Monica ONE thiết kế cho **gia công may** *(CMT · FOB)*, nơi vải là **đầu vào mua
về**. Dệt tích hợp dọc kéo theo cả một chuỗi Domain khác — sợi, nhuộm, kiểm vải
tại nguồn — và **⛔ không** thể bổ sung bằng cách nới mô hình hiện có.

## Hệ quả nếu bỏ qua

🔑 Giá trị của đối tượng này nằm ở chỗ **giới hạn được PHÁT BIỂU**. Một giới hạn ⛔
không tên sẽ được phát hiện bởi **khách hàng đầu tiên cần nó**, giữa lúc triển
khai. Một giới hạn có tên là **quyết định bán hàng**, ⛔ không phải sự cố kỹ thuật.

⚠️ Ai đó cố nhét dệt vào bằng cách thêm bảng ⇒ **vi phạm SECURITY FREEZE** và mở
một Domain mới ⛔ không qua ADR.

## Nguồn đầy đủ

> `docs/PROJECT_MEMORY.md` §8 `KD-13` · luận cứ ở EDD-04 §11.3 · `DL-079`.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
