---
id: KO-REF-002
type: Reference
title: Business Knowledge Base — tối cao về sự thật nghiệp vụ
category: Business · Domain Truth
status: ADOPTED
source: docs/business/BUSINESS_KNOWLEDGE_BASE.md
approved_by: CSA
date: 2026-08-04
tier: 0'
mirrors: —
related: []
---

# KO-REF-002 — Business Knowledge Base · tối cao về sự thật nghiệp vụ

## Phát biểu

`docs/business/BUSINESS_KNOWLEDGE_BASE.md` — **bậc 0′**. Tối cao khi trả lời
*"cái gì là thật trong nghiệp vụ"*. Hiến pháp *(bậc 1)* tối cao khi trả lời
*"phải xây thế nào"*. **Phân theo LĨNH VỰC, ⛔ không theo thứ tự** — ADR-010 §2.2.

🔴 **Nguồn đang ở trạng thái `DRAFT`, chờ Board duyệt.** Vì vậy `approved_by` của
đối tượng này là **`CSA`** *(con trỏ do CSA duy trì)*, ⛔ **không** phải `Board`.

## Vì sao

Chuỗi truy vết Board Directive 04/08/2026 —
`Business Knowledge Base → Constitution → Architecture → Implementation` — chỉ
chạy được nếu mắt xích đầu trỏ tới **đúng một** văn bản.

## Hệ quả nếu vi phạm

Đọc phẳng *"BKB trên Hiến pháp"* ⇒ một phát biểu nghiệp vụ vô hiệu hoá được một
chuẩn tắc bảo mật. ADR-010 §3 phương án D đã bác đúng cách đọc này: *"khách cần
xem tiến độ ngay"* ⛔ **không** phải căn cứ bỏ RLS.

Mâu thuẫn **thật** giữa BKB và Hiến pháp ⇒ **DỪNG**, ghi vào
`docs/architecture/NEEDS_CLARIFICATION.md`, **Board phán quyết**. ⛔ Không tác
nhân nào được tự chọn bên thắng.

## Nguồn đầy đủ

> Toàn văn ở `docs/business/BUSINESS_KNOWLEDGE_BASE.md`. Đối tượng này là **chỉ
> mục**, ⛔ không thay thế nguồn. Lệch nhau ⇒ **NGUỒN THẮNG**.
