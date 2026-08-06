---
id: KO-PRN-001
type: Principle
title: P-COMMIT — Sự kiện thì nhanh, cam kết thì có chủ ý và chậm
category: Design Principle · Workflow
status: ADOPTED
source: docs/PROJECT_MEMORY.md · docs/enterprise-design/EDD-04A-PARTNER-RUNTIME-MOBILE-FIRST.md · docs/ARCHITECTURE_BASELINE.md
approved_by: Board
date: 2026-08-04
tier: 2'
mirrors: P-COMMIT
related: []
---

# KO-PRN-001 — `P-COMMIT` · sự kiện ⟷ cam kết

## Phát biểu

**Sự kiện thì tự động và nhanh; cam kết thì có chủ ý và chậm.**

Ghi nhận một sự kiện *(quét mã, chụp ảnh, đóng bó)* phải ⛔ không ma sát. Đưa ra
một **cam kết** *(duyệt, chốt, đóng chứng từ, tiết lộ dữ liệu)* phải **có ma sát
cố ý** — xác nhận, người thứ hai, bước ⛔ không thể bấm nhầm.

Đây là câu `G3` của **Screen Design Gate**: *"Sự kiện hay quyết định?"*

## Vì sao

Cội nguồn: `DL-089` · `DL-112` · `DL-124`. Hai loại hành động này có **chi phí sai
khác nhau hàng bậc**. Quét nhầm một mã ⇒ quét lại. Duyệt nhầm một chiết tính ⇒
chứng từ đã Đóng, và quy tắc dự án cấm `UPDATE` — phải lập **chứng từ Điều chỉnh**.

## Hệ quả nếu vi phạm

Thiết kế đối xử với cam kết như sự kiện sinh ra **hai lỗi cùng lúc**: người dùng
bấm nhầm ở chỗ đắt nhất, và hệ thống ⛔ không có dấu vết *"người này đã cân nhắc"*.
Đây cũng là nền của `request_id` *(`KO-RUL-004`)* — khoá sinh lúc **MỞ** biểu mẫu,
⛔ không phải lúc **BẤM**.

## Nguồn đầy đủ

> Phát biểu gốc ở `docs/PROJECT_MEMORY.md` §3; luận cứ đầy đủ ở EDD-04A · EDD-04E.
> Đối tượng này là **chỉ mục**, ⛔ không thay thế nguồn. Lệch nhau ⇒ **NGUỒN THẮNG**.
