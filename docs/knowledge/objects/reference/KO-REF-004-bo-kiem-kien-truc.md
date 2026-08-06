---
id: KO-REF-004
type: Reference
title: Bộ kiểm kiến trúc — răng máy của các quy tắc kỹ thuật
category: Engineering · Automated Enforcement
status: ADOPTED
source: tests/architecture/arch.test.mjs
approved_by: CSA
date: 2026-08-05
tier: 6
mirrors: —
related: []
---

# KO-REF-004 — Bộ kiểm kiến trúc · răng máy của các quy tắc

## Phát biểu

`tests/architecture/arch.test.mjs` — chạy bằng `npm run test:arch`, **⛔ không cần
CSDL**, nên chạy được ở mọi nơi kể cả CI ⛔ không bí mật.

Đây là đích của mọi quan hệ `evidenced_by` trỏ tới cưỡng chế kỹ thuật: `any` ·
`.delete()` · `lib|components` import từ `app/` · số ma thuật múi giờ · tệp logic
**> 900 dòng** · tài liệu bắt buộc · khuôn tên migration · số hiệu ADR trùng.

## Vì sao

Một quy tắc ⛔ không có phép kiểm là một **lời khuyên**. ADR-010 §4.2 đã ghi đúng
tiền lệ này: kỷ luật trích dẫn ⛔ không có răng tự động ⇒ thành nợ `TD-14`.

## Hệ quả nếu vi phạm

Tắt hoặc nới một mục kiểm để mã đi qua là **một trong ba điều cấm** của
`ARCHITECTURE_BASELINE`: ⛔ sửa mã bù sai kiến trúc · ⛔ thêm màn hình nhập liệu
để né `P-ZERODUP` · ⛔ tắt bài kiểm để cho mã đi qua.

## Nguồn đầy đủ

> Mã ở `tests/architecture/arch.test.mjs` — **bậc 6**, bậc thấp nhất. Mã ⛔ **không
> bao giờ** là nguồn chân lý; nó là **bằng chứng** rằng nguồn đang được tuân thủ.
