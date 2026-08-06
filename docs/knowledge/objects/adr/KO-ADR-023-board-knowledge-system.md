---
id: KO-ADR-023
type: AdrReference
title: ADR-023 — Board Knowledge System, Knowledge Object là đơn vị quản lý tri thức
category: ADR · Governance · Knowledge Architecture
status: ADOPTED
source: docs/adr/ADR-023-board-knowledge-system.md · docs/knowledge/SCHEMA.md
approved_by: Board
date: 2026-08-06
tier: 2
mirrors: ADR-023
related:
  - derives_from: KO-ADR-010
  - implements: KO-PRN-005
  - evidenced_by: KO-REF-005
---

# KO-ADR-023 — Board Knowledge System

## Phát biểu

Tri thức dự án được quản lý bằng **Knowledge Object**: một đối tượng = **một
tệp** Markdown, mang **10 trường** siêu dữ liệu, thuộc **7 loại**, nối nhau bằng
**9 vị từ quan hệ** — theo Board Directive 06/08/2026.

🔑 Phán quyết trung tâm: **đối tượng là CHỈ MỤC, ⛔ không bao giờ là NGUỒN. Đối
tượng ⟷ nguồn lệch nhau ⇒ NGUỒN THẮNG.**

## Vì sao đối tượng này quan trọng

Nó **thi hành `P-ZERODUP`** *(`KO-PRN-005`)* lên chính tài liệu quản trị: chép nội
dung của 12 hệ đánh số vào đối tượng sẽ tạo **bản thứ hai của mọi sự thật** — đúng
sự cố mà `KO-ADR-010` vừa chữa xong cho hai bộ Hiến pháp.

Đây cũng là đối tượng **tự mô tả**: nó nằm trong chính hệ thống mà nó dựng nên, và
chịu đúng chín bất biến thức mà nó đặt ra.

## Hệ quả nếu bỏ qua

⛔ Không có phán quyết *"chỉ mục ⛔ không phải nguồn"*, Knowledge System trở thành
**bộ luật thứ tám** — có siêu dữ liệu đẹp, ⛔ không thẩm quyền hợp lệ, và mâu thuẫn
im lặng với nguồn thật.

## Nguồn đầy đủ

> Toàn văn ở `docs/adr/ADR-023-board-knowledge-system.md`; lược đồ chuẩn tắc ở
> `docs/knowledge/SCHEMA.md`. Lệch nhau ⇒ **NGUỒN THẮNG**.
>
> ✅ **ĐÃ PHÊ DUYỆT — Board Directive 06/08/2026 · Status: APPROVED.**
>
> 🔴 **Duyệt mà ⛔ KHÔNG có phản biện độc lập.** Board ở bậc 0 nên **có thẩm
> quyền** làm vậy, nhưng đây là **miễn trừ theo vụ**, ⛔ **không** phải bằng chứng
> ADR-011 đã được đáp ứng, ⛔ **không** phải tiền lệ cho ADR khác — ADR-023 §4.3.
> `KO-PEN-002` vẫn **MỞ**, nay **cộng thêm bản này và `KO-ADR-024`**.
