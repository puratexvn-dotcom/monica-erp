---
id: KO-RUL-001
type: Rule
title: Phân quyền theo ASSIGNMENT, ⛔ không theo ROLE
category: Engineering Rule · Permission · ƯU TIÊN TỐI CAO
status: ADOPTED
source: docs/ENGINEERING_PLAYBOOK.md · docs/adr/ADR-006-permission-engine.md
approved_by: Board
date: 2026-08-04
tier: 4
mirrors: Playbook Điều XXX
related:
  - derives_from: KO-DEC-006
---

# KO-RUL-001 — phân quyền theo Assignment *(Playbook Điều XXX)*

## Phát biểu

```
Identity → Assignment → Resource Scope → Permission → Action
```

Vai trò chỉ là **nhóm quyền mặc định**. Quyền thật trả lời *"Monica đã GIAO VIỆC
gì cho người đó?"* — ⛔ **không** phải *"người đó LÀ AI."*

- ⛔ **Cấm hard-code `subcon_id`** hoặc so chuỗi `'subcon'` trong logic nghiệp vụ.
- ⛔ **Cấm truy vấn thẳng theo `subcon_id`** mà bỏ qua Assignment.
- `Actor.partnerId` phân giải từ bảng `partner_accounts` *(có `is_active`)*,
  ⛔ **không** lấy từ claim trong JWT.

## Vì sao

Claim trong JWT **⛔ không đổi khi quan hệ đối tác chấm dứt**. Một token còn hạn
vẫn mang `partner_id` cũ — nghĩa là quyền vẫn còn sau khi quan hệ đã hết.

Nhà thầu **bắt buộc GHI** *(sản lượng, sự cố, Daily Report)*, ⛔ không phải người
chỉ đọc. Buyer thì ngược lại: Đọc · Duyệt · Bình luận · Tải về.

## Hệ quả nếu vi phạm

Hard-code vai ⇒ mọi nhà thầu mới đòi sửa mã, và mọi nhà thầu cũ ⛔ không tự mất
quyền. Đây là **ƯU TIÊN TỐI CAO** của Playbook, và Hiến pháp v0.31 đã xác nhận nó
hợp hiến.

⚠️ Quy tắc này **⛔ không** ghi đè `KO-DEC-021`: Assignment vẫn phải đi qua **9
quy tắc chặn cứng SoD**.

## Nguồn đầy đủ

> Toàn văn ở `docs/ENGINEERING_PLAYBOOK.md` Điều XXX; bộ luật thuần ở
> `lib/mos/permission/`. Lệch nhau ⇒ **NGUỒN THẮNG**.
