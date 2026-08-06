---
id: KO-PRN-005
type: Principle
title: P-ZERODUP — ⛔ Không bắt người dùng nhập thứ hệ thống ĐÃ CÓ
category: Design Principle · Data Model · Design Gate
status: ADOPTED
source: docs/PROJECT_MEMORY.md · docs/enterprise-design/EDD-04G-ZERO-DUPLICATE-AND-DESIGN-GATE.md · docs/ARCHITECTURE_BASELINE.md
approved_by: Board
date: 2026-08-04
tier: 2'
mirrors: P-ZERODUP
related: []
---

# KO-PRN-005 — `P-ZERODUP` · không nhập trùng

## Phát biểu

**⛔ Không bắt người dùng nhập thứ hệ thống ĐÃ CÓ.**

Đây là câu `G1` — **hỏi TRƯỚC mọi câu khác** *(`DL-140`)*. Trả lời *"dữ liệu này
đã tồn tại ở đâu chưa?"* là **KẾ THỪA** ⇒ dừng, ⛔ không hỏi `G2`.

🔴 **`duplicate_field_count > 0` ⇒ ⛔ KHÔNG DUYỆT THIẾT KẾ.**

## Vì sao

`DL-138`: nguyên tắc này nói về **công sức con người**, ⛔ **không** phải chuẩn
hoá cơ sở dữ liệu. Và nhập trùng ⛔ không phải phiền toái — nó là **chỉ điểm của
bốn khuyết tật kiến trúc**:

| | Khuyết tật | Dấu hiệu |
|---|---|---|
| `A1` | mô hình thiếu quan hệ | phải gõ mã để liên kết |
| `A2` | ranh giới Domain vẽ sai | phải chép qua |
| `A3` | thiếu read-model | phải tra rồi gõ |
| `A4` | workflow ⛔ không mang ngữ cảnh | mỗi bước bắt đầu từ trắng |

## Hệ quả nếu vi phạm

Thêm màn hình nhập liệu để né `P-ZERODUP` là **một trong ba điều cấm** của
`ARCHITECTURE_BASELINE` — vì nó **giấu** khuyết tật kiến trúc thay vì lộ ra.

🔑 Nguyên tắc này áp **cả lên tài liệu quản trị**: đó là lý do Knowledge Object
mang con trỏ chứ ⛔ không mang toàn văn *(ADR-023 §2.2)*.

## Nguồn đầy đủ

> Toàn văn ở `docs/enterprise-design/EDD-04G-ZERO-DUPLICATE-AND-DESIGN-GATE.md`.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
