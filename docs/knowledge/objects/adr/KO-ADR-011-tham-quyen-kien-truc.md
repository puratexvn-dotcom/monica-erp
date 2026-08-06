---
id: KO-ADR-011
type: AdrReference
title: ADR-011 — Thẩm quyền kiến trúc và phản biện độc lập bắt buộc
category: ADR · Governance · Review Authority
status: ADOPTED
source: docs/adr/ADR-011-tham-quyen-kien-truc.md
approved_by: Board
date: 2026-08-04
tier: 2
mirrors: ADR-011
related:
  - derives_from: KO-REF-001
---

# KO-ADR-011 — thẩm quyền kiến trúc · phản biện độc lập

## Phát biểu

- **Chief Solution Architect** giữ toàn quyền thiết kế kiến trúc.
- **Phản biện độc lập là BẮT BUỘC** — §1.3 chỉ định ChatGPT.
- §2.2 xếp **RLS** vào diện **bắt buộc phản biện độc lập**.
- `AC-1`: ⛔ **cấm sửa mã để bù** cho một thiết kế sai.

## Vì sao đối tượng này quan trọng

Nó là thứ biến *"CSA quyết"* thành *"CSA quyết **và có người soi**"*. ⛔ Không có
vế thứ hai, thẩm quyền kiến trúc là quyền lực ⛔ không đối trọng.

## Hệ quả nếu bỏ qua

🔴 **Đang bị bỏ qua** — `KO-PEN-002`: **0/18 ADR có hồ sơ phản biện**. Và §4.2 để
trống **thời hạn phản biện tối đa** *(`GPR-001` `A-4`)*, nên một ADR có thể *"đang
chờ phản biện"* vô hạn trong lúc migration của nó đã chạy sản xuất.

Chính ADR-023 *(Knowledge System)* cũng **⛔ chưa có phản biện** — ghi tường minh
ở `KO-PEN-004`.

## Nguồn đầy đủ

> Toàn văn ở `docs/adr/ADR-011-tham-quyen-kien-truc.md`.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
