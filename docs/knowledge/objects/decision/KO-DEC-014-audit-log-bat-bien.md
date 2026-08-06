---
id: KO-DEC-014
type: Decision
title: Audit Log là BẤT BIẾN — bằng chứng pháp lý
category: Board Decision · Audit · Data Integrity
status: ADOPTED
source: docs/PROJECT_MEMORY.md · Board Decision
approved_by: Board
date: 2026-08-06
tier: 0
mirrors: BDR-14
related: []
---

# KO-DEC-014 — `BDR-14` · Audit Log bất biến

## Phát biểu

**Audit Log là BẤT BIẾN. Nó là bằng chứng pháp lý.**

⛔ Không `UPDATE` · ⛔ không `DELETE` · ⛔ không `TRUNCATE` — **kể cả bằng
`service_role`**. Bất biến được cưỡng chế ở **tầng lược đồ** *(trigger)*, ⛔ không
phải ở tầng ứng dụng.

## Vì sao

Sổ kiểm toán sửa được thì nó ⛔ không còn là bằng chứng — nó chỉ là một bảng dữ
liệu. Và giá trị của nó nằm đúng ở chỗ **⛔ không ai, kể cả quản trị hệ thống, thay
đổi được**.

Migration `041` thu hồi quyền `TRUNCATE` trên sổ kiểm toán; `045` · `046` dựng bất
biến bằng trigger. Cả ba là **cửa một chiều CÓ CHỦ Ý** — vì vậy chúng ⛔ **không
có** tệp `_down.sql`, và điều đó là đúng *(CLAUDE.md §8.1)*.

## Hệ quả nếu vi phạm

Quy tắc kiểm thử `K-1` sinh ra từ đây: **bảng chỉ-ghi-thêm phải kiểm bằng LƯỢC ĐỒ**
*(`pg_trigger`)*, ⛔ không bằng ghi thử. Ghi vào sổ cái là **cửa một chiều** — bài
kiểm nào ghi thử vào đó là bài kiểm **⛔ không dọn được sau lưng mình**.

⛔ Không có sổ bất biến thì `P-ATTRIB` *(`KO-PRN-003`)* sụp: ⛔ không quy được
trách nhiệm cho ai.

## Nguồn đầy đủ

> Sổ đăng ký ở `docs/PROJECT_MEMORY.md` §6.2 dòng `14` — Board quyết trực tiếp.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
>
> ⚠️ `date` là **ngày ghi nhận vào Knowledge System** *(`SCHEMA.md` §2.2)*.
