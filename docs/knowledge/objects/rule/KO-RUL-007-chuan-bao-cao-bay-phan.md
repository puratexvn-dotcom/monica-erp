---
id: KO-RUL-007
type: Rule
title: Chuẩn báo cáo bảy phần — câu hỏi giá trị đứng ĐẦU TIÊN
category: Engineering Rule · Reporting · Board Review
status: ADOPTED
source: docs/REPORT_STANDARD.md
approved_by: Board
date: 2026-08-06
tier: 3
mirrors: —
related:
  - implements: KO-PRN-006
  - derives_from: KO-ADR-024
  - evidenced_by: KO-REF-004
---

# KO-RUL-007 — chuẩn báo cáo bảy phần

## Phát biểu

Mọi báo cáo triển khai lập **từ 06/08/2026** mở đầu bằng đúng câu **"GIÁ TRỊ MỚI
NÀO ĐÃ ĐƯỢC TẠO RA?"**, rồi **bảy phần theo đúng thứ tự**:

```
① Business Value   ② User Value   ③ Commercial Value   ④ Product Alignment
⑤ Architecture Impact   ⑥ Engineering Quality   ⑦ Governance Impact
```

🔑 **Thứ tự là toàn bộ nội dung của quy tắc.** Xếp Architecture lên đầu rồi thêm
một mục *"Value"* ở cuối là **⛔ không thi hành** — đó chỉ là đổi nhãn.

## Vì sao

Board nói **"begin with"**. Câu hỏi mở đầu quyết định thứ người rà soát nhìn thấy
trước, và vì thế quyết định thứ được ưu tiên.

Hai mục có răng riêng, thừa hưởng từ nghi thức nghiệm thu: phần ⑥ **bắt buộc nêu
phần CHƯA kiểm được**, phần ⑦ **bắt buộc nêu mục đang chờ Board**.

## Hệ quả nếu vi phạm

⚠️ **⛔ CHƯA CÓ phép kiểm tự động** — và đó là lựa chọn có lý do, ⛔ không phải
thiếu sót. Quét mọi `*REPORT*.md` sẽ đánh hỏng **~10 báo cáo hợp lệ** ra đời
**trước** luật, mà sửa chúng là **viết lại lịch sử** *(Hiến pháp §43.7)*. Ghi ở
nợ `TD-GR1`.

Răng duy nhất hiện có: bộ kiểm kiến trúc mục ⑥ canh **`docs/REPORT_STANDARD.md`
phải tồn tại**. Cưỡng chế phần còn lại là **kỷ luật rà soát của Board** — và
`TD-GR2` ghi nhận rằng *"giá trị"* hiện **⛔ chưa có định nghĩa đo được**.

## Nguồn đầy đủ

> Toàn văn ở `docs/REPORT_STANDARD.md` *(bậc 3 · Engineering Standards)*; quyết
> định ở `docs/adr/ADR-024-board-golden-rule.md`. Lệch nhau ⇒ **NGUỒN THẮNG**.
