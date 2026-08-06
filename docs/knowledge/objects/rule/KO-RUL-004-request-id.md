---
id: KO-RUL-004
type: Rule
title: request_id + unique index trên mọi bảng chứng từ lập-mới-được
category: Engineering Rule · Idempotency · Mutation
status: ADOPTED
source: docs/adr/ADR-003-request-id.md · docs/MUTATION_POLICY.md
approved_by: Board
date: 2026-08-01
tier: 2
mirrors: ADR-003
related:
  - implements: KO-PRN-001
---

# KO-RUL-004 — `request_id` chống lập chứng từ hai lần

## Phát biểu

Mọi bảng chứng từ lập-mới-được **bắt buộc** có `request_id UUID` + **unique
index**.

- 🔑 Sinh khoá lúc **MỞ** biểu mẫu — ⛔ **không** phải lúc **BẤM**.
- Service phải bắt lỗi `23505` và **trả về dòng cũ với `ok: true`**.
- Xung đột ghi đè dùng mã tự đặt **`P0409`**, ⛔ **không** dùng `40001`.

## Vì sao

`retry: 0` ở tầng ứng dụng chỉ chặn **1 trong 4** đường gửi trùng. Ba đường còn
lại — **bấm hai lần · trình duyệt gửi lại · mở hai tab** — chỉ **CSDL** chặn được.

Sinh khoá lúc MỞ chứ ⛔ không lúc BẤM chính là `P-COMMIT` *(`KO-PRN-001`)* viết
thành mã: danh tính của **cam kết** phải có trước khi người dùng bấm.

## Hệ quả nếu vi phạm

Dùng `40001` thay `P0409` ⇒ thư viện client **tự retry** — mà retry ở đây là
**sai**: nó biến một xung đột cần người xử thành một lần ghi đè im lặng.

## Nguồn đầy đủ

> Toàn văn ở `docs/adr/ADR-003-request-id.md` *(bậc 2 · Accepted ADR)*.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
