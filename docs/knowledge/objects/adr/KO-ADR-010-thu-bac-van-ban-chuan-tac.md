---
id: KO-ADR-010
type: AdrReference
title: ADR-010 — Thứ bậc văn bản chuẩn tắc, chấm dứt tình trạng hai Hiến pháp
category: ADR · Governance · Document Hierarchy
status: ADOPTED
source: docs/adr/ADR-010-thu-bac-van-ban-chuan-tac.md
approved_by: Board
date: 2026-08-04
tier: 2
mirrors: ADR-010
related:
  - derives_from: KO-REF-001
---

# KO-ADR-010 — thứ bậc văn bản chuẩn tắc

## Phát biểu

Thứ bậc **bảy bậc**, bậc trên luôn thắng bậc dưới:

```
0  Board  ·  0′ Business Knowledge Base  ·  1 Hiến pháp  ·  2 ADR
2′ Enterprise Design  ·  3 Engineering Standards  ·  4 Approved Playbooks
5  Technical Documentation  ·  6 Mã nguồn
```

- **Bậc 0′ ⟷ bậc 1 phân theo LĨNH VỰC, ⛔ không theo thứ tự.** BKB tối cao về *cái
  gì là thật*; Hiến pháp tối cao về *phải xây thế nào*.
- Trích dẫn **bắt buộc ghi nguồn**: `Hiến pháp Điều 43.3` · `Playbook Điều XXX` ·
  `MOS Điều IX` · `BKB §12`. `Điều IX` trần là trích dẫn **⛔ không hợp lệ**.

## Vì sao đối tượng này quan trọng

🔑 **Đây là ADR mà toàn bộ Knowledge System đứng lên.** Trường `tier` của mọi đối
tượng lấy thang bậc từ đây, và **bất biến thức ⑥** *(⛔ không được vượt quyền
nguồn)* chỉ có nghĩa vì thang bậc này tồn tại.

## Hệ quả nếu bỏ qua

`[VERIFIED]` — hai văn bản cùng tự xưng Hiến pháp đã khiến **mọi phiên làm việc
của mọi tác nhân khởi động bằng một tiền đề sai, suốt hai ngày**.

## Nguồn đầy đủ

> Toàn văn ở `docs/adr/ADR-010-thu-bac-van-ban-chuan-tac.md`.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
