---
id: KO-DEC-013
type: Decision
title: Sở hữu dữ liệu — tách ≥4 loại Customer · Monica · Legal Record · AI Generated
category: Board Decision · Data Ownership · Egress
status: ADOPTED
source: docs/PROJECT_MEMORY.md · docs/enterprise-design/EDD-03-DOCUMENT-INFORMATION-ARCHITECTURE.md
approved_by: Board
date: 2026-08-06
tier: 0
mirrors: BDR-13
related:
  - depends_on: KO-DEC-006
---

# KO-DEC-013 — `BDR-13` · sở hữu dữ liệu

## Phát biểu

Dữ liệu phải tách **ít nhất bốn loại sở hữu**:

| Loại | Ai sở hữu | Hệ quả khi chấm dứt quan hệ |
|---|---|---|
| **Customer Data** | khách hàng | trả về / xoá theo hợp đồng |
| **Monica Data** | Monica ONE | giữ |
| **Legal Record** | ⛔ **không ai xoá được** | giữ vĩnh viễn — bằng chứng pháp lý |
| **AI Generated** | Monica ONE | giữ, gắn nguồn sinh |

## Vì sao

Câu hỏi *"khách rời đi thì dữ liệu nào đi theo"* ⛔ không trả lời được nếu mọi
dòng dữ liệu đều cùng một hạng. Và `Legal Record` **⛔ không được** nằm cùng hạng
với `Customer Data` — nếu ⛔ không, một yêu cầu xoá hợp lệ sẽ cuốn theo bằng chứng
pháp lý.

## Hệ quả nếu vi phạm

Trộn bốn loại vào một ⇒ **⛔ không có thao tác xoá nào an toàn**, và **⛔ không có
thao tác giữ nào hợp lệ**. Cả hai chiều đều sai cùng lúc.

## Nguồn đầy đủ

> Sổ đăng ký ở `docs/PROJECT_MEMORY.md` §6.2 dòng `13`; luận cứ ở EDD-03.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
>
> ⚠️ `date` là **ngày ghi nhận vào Knowledge System** *(`SCHEMA.md` §2.2)*.
