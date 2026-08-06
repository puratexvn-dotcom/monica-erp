---
id: KO-PRN-004
type: Principle
title: P-ZEROMAN — ⛔ Không bắt người dùng nhập thứ hệ thống thu nhận được
category: Design Principle · Data Capture
status: ADOPTED
source: docs/PROJECT_MEMORY.md · docs/enterprise-design/EDD-04E-ZERO-MANUAL-PRINCIPLE.md · docs/ARCHITECTURE_BASELINE.md
approved_by: Board
date: 2026-08-04
tier: 2'
mirrors: P-ZEROMAN
related:
  - depends_on: KO-PRN-005
---

# KO-PRN-004 — `P-ZEROMAN` · không nhập tay

## Phát biểu

**⛔ Không bắt người dùng gõ thứ mà hệ thống THU NHẬN được.** Thang 7 bậc, ưu tiên
từ trên xuống:

```
Cấu trúc:  ① tự động → ② QR/mã vạch → ③ camera → ④ AI Vision
           → ⑤ OCR → ⑥ import → ⑦ voice → ⑧ nhập tay
Tự sự:     ① VOICE → ② mẫu câu → ③ ảnh + chú thích → ④ gõ      (DL-125)
```

Đây là câu `G2` của Screen Design Gate — **và nó phải hỏi SAU `G1`** *(`DL-140`)*.

## Vì sao

Người ở xưởng gõ máy trong điều kiện tay bẩn, đeo găng, thiếu sáng, đứng. Mỗi
trường bắt gõ tay là một **nguồn sai số** và một lý do để ⛔ không dùng hệ thống.

## Hệ quả nếu vi phạm

Dữ liệu vào chậm và sai ⇒ **mọi báo cáo dựng trên nó đều sai mà vẫn trông đúng**.
Và vì `G1` phải hỏi trước, một màn hình *"đã tối ưu nhập tay"* vẫn có thể vi phạm
`P-ZERODUP` — tối ưu cách gõ một thứ **lẽ ra ⛔ không cần gõ**.

## Nguồn đầy đủ

> Toàn văn + thang 7 bậc ở `docs/enterprise-design/EDD-04E-ZERO-MANUAL-PRINCIPLE.md`.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
