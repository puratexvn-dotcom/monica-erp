# ARCHITECTURE — MONICA ONE

Thư mục này chứa tài liệu kiến trúc cấp cao nhất của MONICA ONE.

## Mục lục

| # | Tài liệu | Trạng thái | Nội dung |
|---|---|---|---|
| 00 | [00-CONSTITUTION.md](00-CONSTITUTION.md) | 🟡 **Draft — bộ khung** | Hiến pháp MONICA ONE. Hiện mới có cấu trúc 12 chương, **chưa có điều khoản nào** |

## Quan hệ với các tài liệu quản trị đang có hiệu lực

⚠️ **`00-CONSTITUTION.md` CHƯA có hiệu lực.** Nó mới là bộ khung. Cho tới khi
Architecture Board phê duyệt nội dung, bộ luật đang thi hành vẫn là:

| Tài liệu | Vai trò | Ghi chú |
|---|---|---|
| [`../MONICA_CONSTITUTION.md`](../MONICA_CONSTITUTION.md) | **12 nguyên tắc đang có hiệu lực** | Được `tests/architecture/arch.test.mjs` mục ⑥ cưỡng chế phải tồn tại |
| [`../ENGINEERING_PLAYBOOK.md`](../ENGINEERING_PLAYBOOK.md) | 34 quy tắc kỹ thuật chi tiết | Thi hành 12 nguyên tắc trên |
| [`../DOMAIN_GLOSSARY.md`](../DOMAIN_GLOSSARY.md) | Từ vựng nghiệp vụ | Bổ sung, không ghi đè |
| [`../adr/`](../adr/) | Quyết định kiến trúc, **bất biến** | Bổ sung, không ghi đè |

## Quy ước đánh số

Tệp trong thư mục này đánh số hai chữ số theo thứ tự đọc (`00-`, `01-`, …),
cùng quy ước với [`../assignment/`](../assignment/). Số **không tái sử dụng**.
