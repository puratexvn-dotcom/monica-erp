---
id: KO-PRN-002
type: Principle
title: P-IRREV — Dữ liệu đã tiết lộ ⛔ không lấy lại được, phòng ngừa là cơ chế duy nhất
category: Design Principle · Data Egress · Security
status: ADOPTED
source: docs/PROJECT_MEMORY.md · docs/enterprise-design/EDD-04D-IRREVOCABILITY-PRINCIPLE.md · docs/ARCHITECTURE_BASELINE.md
approved_by: Board
date: 2026-08-04
tier: 2'
mirrors: P-IRREV
related: []
---

# KO-PRN-002 — `P-IRREV` · bất khả thu hồi

## Phát biểu

**Dữ liệu đã tiết lộ ⛔ KHÔNG lấy lại được ⇒ phòng ngừa là cơ chế DUY NHẤT.**

⛔ Không có *"thu hồi quyền xem"*, ⛔ không có *"gỡ chia sẻ"*, ⛔ không có *"xoá
bản đã tải"*. Một khi dữ liệu ra khỏi biên, mọi thao tác sau đó chỉ là **quy trách
nhiệm** *(`KO-PRN-003`)*, ⛔ không phải khắc phục.

Đây là câu `G4` của Screen Design Gate: *"Có lộ thứ ⛔ không thu hồi được ⛔ không?"*

## Vì sao

Quyết định `BDR` về xuất dữ liệu `RESTRICTED` chốt **8 cơ chế phòng ngừa**, và vai
⛔ không có quyền thì **chặn hoàn toàn** — ⛔ không phải *"cho xem rồi ghi log"*.
Nguyên tắc này là lý do `DL-057` **PHÉP CHIẾU TIẾT LỘ** tồn tại: vai ngoài ⛔ không
bao giờ chạm bảng gốc.

## Hệ quả nếu vi phạm

Mọi kiểm soát *"cho phép trước, siết sau"* đều là **kiểm soát giả**. Quay lui một
lần tiết lộ chỉ khôi phục được **cấu hình**, ⛔ không khôi phục được **bí mật** —
`DL-117`.

## Nguồn đầy đủ

> Toàn văn ở `docs/enterprise-design/EDD-04D-IRREVOCABILITY-PRINCIPLE.md`.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
>
> ⚠️ **Lệch số hiệu ở nguồn `[VERIFIED]`:** `PROJECT_MEMORY` §3 ghi `P-IRREV` bắt
> nguồn từ **`BDR-25`**, nhưng sổ đăng ký §6.2 ghi `BDR-25` là *"Trách nhiệm cấu
> hình L2"* — mục khớp nội dung là **`BDR-26`**. Đối tượng này **⛔ không tự chọn
> bên**: nó trỏ tới EDD-04D và ghi nhận chỗ lệch để Board đính chính.
