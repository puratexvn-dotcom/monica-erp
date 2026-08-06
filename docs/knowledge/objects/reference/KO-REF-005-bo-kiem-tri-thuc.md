---
id: KO-REF-005
type: Reference
title: Bộ kiểm toàn vẹn Knowledge System — 9 bất biến thức
category: Governance · Automated Enforcement
status: ADOPTED
source: tests/governance/knowledge-objects.test.mjs · docs/knowledge/SCHEMA.md
approved_by: CSA
date: 2026-08-06
tier: 6
mirrors: —
related: []
---

# KO-REF-005 — Bộ kiểm toàn vẹn Knowledge System

## Phát biểu

`tests/governance/knowledge-objects.test.mjs` cưỡng chế **chín bất biến thức** của
`SCHEMA.md` §5 trên mọi đối tượng trong `docs/knowledge/objects/`. Chạy trong
`npm test` **và** `npm run test:arch` — ⛔ không cần CSDL.

Quan trọng nhất là **bất biến thức ⑥**: một đối tượng ⛔ **không được**
`constrains`/`supersedes` thứ có `tier` cao quyền hơn nguồn của chính nó.

## Vì sao

Toàn bộ tuyên bố *"Knowledge Object là chỉ mục, ⛔ không phải nguồn"* chỉ là văn
xuôi nếu ⛔ không có phép kiểm. Bài kiểm này là thứ biến tuyên bố đó thành **ràng
buộc**.

## Hệ quả nếu vi phạm

⛔ Không có nó, Knowledge System trở thành **bộ luật thứ tám** sau vài tháng — hệ
quả đã được đo một lần ở ADR-010 §1.2, khi hai văn bản cùng tự xưng Hiến pháp
khiến *mọi phiên làm việc khởi động bằng tiền đề sai suốt hai ngày*.

## Nguồn đầy đủ

> Lược đồ chuẩn tắc ở `docs/knowledge/SCHEMA.md` — **bài kiểm chỉ là răng, lược
> đồ mới là luật**. Hai bên lệch nhau ⇒ **SCHEMA THẮNG**, và bài kiểm phải sửa.
