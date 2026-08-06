---
id: KO-DEC-006
type: Decision
title: Party Model — một Party, một Party Number, một Master Record; Role là thuộc tính
category: Board Decision · Master Data
status: ADOPTED
source: docs/PROJECT_MEMORY.md · Board Decision
approved_by: Board
date: 2026-08-06
tier: 0
mirrors: BDR-06
related: []
---

# KO-DEC-006 — `BDR-06` · Party Model

## Phát biểu

**Một Party · một Party Number · một Master Record. `Role` là THUỘC TÍNH, ⛔ không
phải thực thể riêng.**

Một pháp nhân vừa là nhà cung cấp vừa là nhà thầu ⇒ **vẫn là một Party**, mang hai
vai. ⛔ Không tạo hai hồ sơ.

## Vì sao

Tách theo vai sinh ra hồ sơ trùng cho cùng một pháp nhân, và mọi phép cộng công
nợ · sản lượng · đánh giá đều **chia đôi một cách im lặng**. Đây cũng là nền của
`OQ-E` *(NCC kiêm nhà thầu)* — câu hỏi đó chỉ trả lời được nếu Party là một.

## Hệ quả nếu vi phạm

Hai Party Number cho một pháp nhân ⇒ ⛔ không hợp nhất được nữa sau khi chứng từ đã
tham chiếu cả hai. Đây là **cửa một chiều**: gộp về sau đòi sửa dữ liệu lịch sử,
mà quy tắc dự án cấm `UPDATE` chứng từ đã Đóng.

## Nguồn đầy đủ

> Sổ đăng ký ở `docs/PROJECT_MEMORY.md` §6.2 dòng `06`. Lệch nhau ⇒ **NGUỒN THẮNG**.
>
> ⚠️ **Nguồn ⛔ KHÔNG ghi ngày Board ban hành cho từng `BDR`.** `date` ở đây là
> **ngày ghi nhận vào Knowledge System**, ⛔ không phải ngày Board quyết —
> `SCHEMA.md` §2.2. ⛔ Không suy diễn ngày mà nguồn ⛔ không ghi.
