---
id: KO-PRN-006
type: Principle
title: BOARD GOLDEN RULE — Engineering tạo sản phẩm, Board tạo GIÁ TRỊ
category: Design Principle · Board Review · Product Value
status: ADOPTED
source: docs/REPORT_STANDARD.md · docs/adr/ADR-024-board-golden-rule.md · Board Directive 06/08/2026
approved_by: Board
date: 2026-08-06
tier: 0
mirrors: P-VALUE
related: []
---

# KO-PRN-006 — `P-VALUE` · giá trị đứng trước sự tinh xảo kỹ thuật

## Phát biểu

> **Engineering tạo ra SẢN PHẨM. Board tạo ra GIÁ TRỊ.**

Mọi báo cáo triển khai **bắt buộc mở đầu** bằng: ***"Giá trị mới nào đã được tạo
ra?"*** — và **chỉ SAU ĐÓ** mới đánh giá **Architecture · Engineering ·
Governance**.

🔴 **Một giải pháp xuất sắc về kỹ thuật nhưng ⛔ KHÔNG cải thiện giá trị sản phẩm,
trải nghiệm người dùng, khác biệt thương mại hay vận hành doanh nghiệp — ⛔ KHÔNG
được coi là ưu tiên.**

## Vì sao

`[VERIFIED]` trên kho tại 06/08/2026: **149** quyết định kiến trúc · **13** tài
liệu Enterprise Design · **~230** mục tri thức quản trị — và **0** tài liệu trả
lời *"việc này tạo giá trị gì, cho ai"* theo một khuôn bắt buộc.

Dự án có bộ máy **quản trị kiến trúc** rất mạnh và **⛔ không có** bộ máy **quản
trị giá trị** nào. Nguyên tắc này lấp đúng chỗ trống đó.

## Hệ quả nếu vi phạm

⚠️ **Suy diễn nguy hiểm nhất cần chặn ngay:** *"ưu tiên giá trị"* ⛔ **KHÔNG** có
nghĩa được hạ ưu tiên RLS · bảo mật · bất biến sổ kiểm toán vì chúng *"⛔ không bán
được"*. `P-IRREV` *(`KO-PRN-002`)* vẫn đứng: dữ liệu lộ ⛔ không thu hồi được.

Khuôn xử đã có sẵn ở ADR-010 §2.2 quy tắc 3 — **nghiệp vụ nói *cái gì*, chuẩn tắc
nói *thế nào*; ⛔ không lấy vế đầu để lách vế sau.** Bốn suy diễn sai bị bác tường
minh ở ADR-024 §4.3.

## Nguồn đầy đủ

> Chỉ thị gốc: **Board Directive 06/08/2026 · Status: APPROVED**. Chuẩn thi hành ở
> `docs/REPORT_STANDARD.md`; ghi nhận quyết định ở `docs/adr/ADR-024-board-golden-rule.md`.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
>
> ⚠️ Board **⛔ chưa cấp số hiệu `BDR`** cho quyết định này. Sổ đăng ký
> `PROJECT_MEMORY` §6 hiện dừng ở **`BDR-29`**. ⛔ Tôi **không tự đặt `BDR-30`** —
> số hiệu Board Decision do **Board** cấp *(`SCHEMA.md` §2.2: ⛔ không suy diễn thứ
> nguồn ⛔ không ghi)*.
