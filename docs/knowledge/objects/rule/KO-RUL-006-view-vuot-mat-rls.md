---
id: KO-RUL-006
type: Rule
title: VIEW mặc định VƯỢT MẶT RLS — A001 là bài kiểm hồi quy mọi vòng
category: Engineering Rule · Security · RLS
status: ADOPTED
source: docs/RLS_COVERAGE_MATRIX.md · docs/SECURITY_DEFINER_REGISTRY.md
approved_by: CSA
date: 2026-08-04
tier: 5
mirrors: —
related:
  - implements: KO-PRN-002
---

# KO-RUL-006 — VIEW vượt mặt RLS

## Phát biểu

⚠️ **VIEW trong Postgres mặc định chạy dưới quyền NGƯỜI TẠO, ⛔ không phải người
gọi** ⇒ nó **vượt mặt RLS**.

Vì vậy `supabase/audits/A001` *(view security)* là bài kiểm hồi quy **BẮT BUỘC MỌI
VÒNG** — ⛔ không phải chỉ khi có đụng tới view.

Đi kèm hai luật:

- Mỗi hàm `SECURITY DEFINER` **phải** được ghi vào `docs/SECURITY_DEFINER_REGISTRY.md`
  kèm lý do · ADR · bài kiểm hồi quy.
- **Quy tắc `K-3`**: policy ⛔ **không được** truy vấn bảng mà chính người gọi ⛔
  không đọc được — subquery trong policy vẫn chịu RLS dưới quyền người gọi, biến
  phép *khoanh vùng* thành phép **chặn phẳng**.

## Vì sao

`P-IRREV`: một view rò dữ liệu ⛔ không thu hồi được thứ đã lộ. Và view là chỗ rò
**im lặng nhất** — ⛔ không có lỗi, ⛔ không có log, chỉ có dữ liệu ⛔ không nên
thấy.

## Hệ quả nếu vi phạm

Mỗi hàm `SECURITY DEFINER` là **một lỗ khoét xuyên qua toàn bộ RLS**. ⛔ Không ghi
vào sổ ⇒ ⛔ không ai rà lại được, và lỗ đó tồn tại vĩnh viễn ⛔ không ai nhớ vì sao
nó có ở đó.

## Nguồn đầy đủ

> `docs/RLS_COVERAGE_MATRIX.md` cập nhật sau **mỗi** migration chạm RLS; sổ
> `SECURITY DEFINER` ở `docs/SECURITY_DEFINER_REGISTRY.md`. Lệch nhau ⇒ **NGUỒN THẮNG**.
