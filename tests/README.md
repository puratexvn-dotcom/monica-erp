# BỘ KIỂM THỬ — MONICA MOS

> **Trước 03/08/2026 thư mục này không tồn tại.** Toàn bộ bài kiểm bảo mật nằm
> trong một thư mục tạm trên máy một người. Chúng chứng minh 031a/031b/031c an
> toàn — và nếu thư mục ấy bị dọn, năng lực chứng minh biến mất cùng nó.
>
> Enterprise Architecture Audit xếp việc đó là **P0**: không phải vì bài kiểm
> sai, mà vì **không ai khác chạy lại được**.

---

## Chạy

```bash
npm test              # toàn bộ (bài cần CSDL tự bỏ qua nếu thiếu bí mật)
npm run test:arch     # chỉ kiến trúc — không cần CSDL, chạy được ở mọi nơi
npm run test:security # phân quyền, cần CSDL
npm run test:regression
npm run bench         # đo hiệu năng RLS (phép ĐO, không phải phép KIỂM)
npm run verify        # typecheck + lint + test
```

## Bố cục

| thư mục | nội dung | cần CSDL |
|---|---|---|
| `_lib/` | khung dùng chung: nạp biến môi trường, sổ điểm, phiên tạm | — |
| `architecture/` | guardrail `any` · cấm Hard-Delete · chiều phụ thuộc · múi giờ · God Object · tài liệu · kỷ luật migration/ADR | ❌ |
| `regression/` | **toàn vẹn dữ liệu nền** — chạy TRƯỚC bài bảo mật | ✅ |
| `security/` | phân quyền nhà thầu · Buyer · anon · bất biến I-11 | ✅ |
| `performance/` | chi phí RLS — **phép đo**, luôn thoát 0 | ✅ |
| `integration/` | *(chưa có — xem Technical Debt)* | ✅ |

---

## ⚠️ BỐN QUY TẮC MỌI BÀI KIỂM PHẢI THEO

Cả bốn đều sinh ra từ **sự cố có thật**, không phải từ sách vở.

### K-1 · Bảng chỉ-ghi-thêm kiểm bằng LƯỢC ĐỒ, không bằng ghi thử

Ghi một dòng vào sổ cái để kiểm trigger ⇒ **không xoá ra được**, kể cả bằng
`service_role`. Bài kiểm thất bại **chính vì** thứ nó kiểm đang chạy đúng.
Phải viết một Maintenance Script để dọn.

### K-2 · KHÔNG đo quyền GHI bằng cách GHI bừa

`INSERT {}` rồi đọc mã lỗi giả định ngầm rằng **mọi bảng đều có ràng buộc chặn
lại**. Bốn bảng có mọi cột nullable ⇒ lệnh **thành công**, sinh 8 dòng rác gồm
cả `financial_records`. Gửi bản ghi **hợp lệ và đầy đủ**, rồi dọn ngay nếu lọt.

### K-3 · Mỗi kịch bản phải có ÍT NHẤT MỘT vai CHỜ THẤY > 0

Bài kiểm chỉ gồm những vai **chờ 0** không phân biệt được *"khoanh đúng"* với
*"chặn hết"*. Lỗi `031c` — policy chặn phẳng thay vì khoanh vùng — **suýt lọt**
đúng vì lý do này; nó bị bắt chỉ nhờ có một vai chờ thấy 1.

Hệ quả: mỗi vế **phủ định** phải đi kèm một vế **khẳng định**.

### V.1 · Không kết luận trên bảng RỖNG

Trên bảng rỗng, *"RLS chặn đúng"* và *"chẳng có gì để thấy"* trông **giống hệt
nhau**. Ghi `⚪ chưa đo được`, **không** ghi `✅`.

> Quy tắc này đã phát hiện **hai** lỗi ẩn nhiều tháng trong đúng một ngày:
> `bundle_stage_enum` hỏng khiến `/subcon` chưa từng chạy, và `subcon_orders`
> rò rỉ giá giữa hai nhà thầu cạnh tranh.

---

## Dọn dẹp

Mọi bài kiểm dựng **tài khoản và dữ liệu dùng-một-lần**, rồi dọn trong `finally`.
Không bài nào được chạm dữ liệu nghiệp vụ thật, trừ khi có **chụp trước và khôi
phục theo bản chụp** (Điều XXXI mức ②).

Ba lần vi phạm có thật đã dạy điều này: `probe-026` ghi đè tên một nhà thầu ·
`probe-subcon-rls` để lại dòng rác trong `financial_records` · `live-028` **xoá
mất một đối tác**.

## Bỏ qua ≠ đạt

Bài cần CSDL mà thiếu bí mật kết nối sẽ in `⚪ BỎ QUA` và thoát 0. Đó là **chưa
đo được**, không phải đã đạt. `live-023` từng âm thầm nhảy qua một phép kiểm RLS
suốt nhiều lần chạy mà vẫn báo xanh — đó là lý do mọi lần bỏ qua ở đây đều phải
**nói thành lời**.
