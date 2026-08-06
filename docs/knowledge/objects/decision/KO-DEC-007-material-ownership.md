---
id: KO-DEC-007
type: Decision
title: Material Ownership — ⛔ không hard-code, theo Contract · OrderType · Business Rule
category: Board Decision · Master Data · Material
status: ADOPTED
source: docs/PROJECT_MEMORY.md · Board Decision
approved_by: Board
date: 2026-08-06
tier: 0
mirrors: BDR-07
related:
  - depends_on: KO-DEC-006
---

# KO-DEC-007 — `BDR-07` · Material Ownership

## Phát biểu

**Quyền sở hữu nguyên phụ liệu ⛔ KHÔNG được hard-code.** Nó được xác định theo
**Contract · OrderType · Business Rule** — ⛔ không theo hằng số trong mã, ⛔ không
theo tên bảng, ⛔ không theo vai trò người đăng nhập.

## Vì sao

Cùng một cuộn vải có thể thuộc khách *(CMT)*, thuộc Monica *(FOB)*, hoặc thuộc nhà
thầu — **tuỳ hợp đồng**, ⛔ không tuỳ loại vật tư. Viết cứng một trong ba ⇒ hình
thái kinh doanh thứ hai ⛔ không vào nổi hệ thống.

## Hệ quả nếu vi phạm

Hard-code sở hữu là biến một **điều khoản thương mại** thành một **hằng số kỹ
thuật**. Khi hợp đồng đổi, mã phải đổi — và đó chính là *"sửa mã để bù sai kiến
trúc"* mà `DL-143` cấm.

Quyết định này **phụ thuộc `KO-DEC-006`**: ⛔ không có Party Model một-hồ-sơ thì ⛔
không có chỗ neo *"ai sở hữu"* một cách nhất quán.

## Nguồn đầy đủ

> Sổ đăng ký ở `docs/PROJECT_MEMORY.md` §6.2 dòng `07`. Lệch nhau ⇒ **NGUỒN THẮNG**.
>
> ⚠️ `date` là **ngày ghi nhận vào Knowledge System** — nguồn ⛔ không ghi ngày
> Board ban hành *(`SCHEMA.md` §2.2)*.
