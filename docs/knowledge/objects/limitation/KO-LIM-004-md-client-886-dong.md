---
id: KO-LIM-004
type: Limitation
title: md-client.tsx 886/900 dòng — còn 14 dòng nữa là gãy bộ kiểm kiến trúc
category: Known Defect · Maintainability
status: OPEN
source: docs/PROJECT_MEMORY.md · docs/TECHNICAL_DEBT.md
approved_by: CSA
date: 2026-08-05
tier: 6
mirrors: KD-4
related:
  - evidenced_by: KO-REF-004
---

# KO-LIM-004 — `KD-4` · `md-client.tsx` 886/900 dòng

## Phát biểu

`md-client.tsx` đang ở **886 dòng**. Ngưỡng cứng của bộ kiểm kiến trúc là **900**.
**Còn 14 dòng.** Nợ `TD-39`.

## Vì sao chưa sửa

Tách tệp này ⛔ **không phải phép dời thuần**: nó giữ state và bố cục của **13
tab** Merchandising. Cắt sai chỗ ⇒ đổi hành vi màn hình mà bộ kiểm ⛔ không bắt
được, vì ⛔ không có bài kiểm nghiệp vụ nào phủ luồng MD *(`KD-11` mới phủ được
phần **công thức**)*.

🔴 **Chờ Board** — đây là quyết định kiến trúc, ⛔ không phải refactor tuỳ ý.

## Hệ quả nếu bỏ qua

Ngày ai đó thêm **một tính năng nhỏ** vào MD, `npm run verify` **đỏ** — và người
đó sẽ đứng trước lựa chọn sai: **nới ngưỡng** để đi tiếp. Nới ngưỡng là *"tắt bài
kiểm để cho mã đi qua"* — **một trong ba điều cấm** của `ARCHITECTURE_BASELINE`.

## Nguồn đầy đủ

> `docs/PROJECT_MEMORY.md` §8 `KD-4` · sổ nợ `docs/TECHNICAL_DEBT.md` `TD-39`.
> Ngưỡng 900 dòng cưỡng chế ở `tests/architecture/arch.test.mjs` mục ⑤.
> Lệch nhau ⇒ **NGUỒN THẮNG**.
