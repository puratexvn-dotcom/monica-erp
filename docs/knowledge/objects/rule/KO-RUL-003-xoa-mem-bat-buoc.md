---
id: KO-RUL-003
type: Rule
title: Xoá mềm bắt buộc — và chỉ mục duy nhất MỘT PHẦN đi kèm
category: Engineering Rule · Mutation · Data Integrity
status: ADOPTED
source: docs/MUTATION_POLICY.md · docs/adr/ADR-005-udmd-i18n-and-soft-delete.md
approved_by: Board
date: 2026-08-03
tier: 3
mirrors: —
related:
  - implements: KO-PRN-002
  - derives_from: KO-DEC-014
  - evidenced_by: KO-REF-004
---

# KO-RUL-003 — xoá mềm bắt buộc

## Phát biểu

Mọi bảng nghiệp vụ dùng **`deleted_at` · `deleted_by`**. Bộ kiểm kiến trúc **cấm
`.delete()`** trong mã ứng dụng.

🔑 **Xoá mềm xung khắc với `UNIQUE`** ⇒ bắt buộc dùng **chỉ mục duy nhất MỘT
PHẦN**:

```sql
UNIQUE (...) WHERE deleted_at IS NULL
```

## Vì sao

Xoá cứng là **cửa một chiều**, và `P-IRREV` nói cửa một chiều chỉ được mở khi đó
là **thiết kế có chủ ý** — ⛔ không phải khi người dùng bấm nhầm nút.

Vế chỉ mục một phần ⛔ **không** phải chi tiết phụ: ⛔ không có nó, một mã đã xoá
vẫn chiếm chỗ và người dùng ⛔ không tạo lại được mã cũ.

## Hệ quả nếu vi phạm

Bẫy đã tốn giá: **PostgREST bọc mọi `PATCH` trong CTE có `RETURNING`** bất kể
header `Prefer` ⇒ policy `SELECT` bị áp lên **dòng MỚI**. Đó là lý do xoá mềm phải
đi qua **RPC** *(migration `036b`)*, ⛔ không đi thẳng bằng `PATCH`.

## Nguồn đầy đủ

> Toàn văn ở `docs/MUTATION_POLICY.md`; quyết định gốc ở ADR-005.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
