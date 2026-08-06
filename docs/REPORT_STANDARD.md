# CHUẨN BÁO CÁO — BOARD GOLDEN RULE

| Trường | Giá trị |
|---|---|
| **Bậc ADR-010** | **3 · Engineering Standards** |
| **Thẩm quyền** | **Board Directive 06/08/2026** — `BOARD GOLDEN RULE` · [ADR-024](adr/ADR-024-board-golden-rule.md) |
| **Trạng thái** | ✅ **CÓ HIỆU LỰC NGAY** *(effective immediately)* |
| **Đối tượng áp dụng** | **mọi báo cáo triển khai** — Sprint Report · Audit Report · Implementation Report · báo cáo kết thúc EPIC · trả lời Board |
| **Knowledge Object** | [`KO-PRN-006`](knowledge/objects/principle/KO-PRN-006-gia-tri-truoc-ky-thuat.md) · [`KO-RUL-007`](knowledge/objects/rule/KO-RUL-007-chuan-bao-cao-bay-phan.md) |

---

## §1 · NGUYÊN TẮC

> ### Engineering tạo ra SẢN PHẨM. Board tạo ra GIÁ TRỊ.

Board sẽ **ưu tiên giá trị hơn sự tinh xảo kỹ thuật**.

> 🔴 **Một giải pháp xuất sắc về kỹ thuật nhưng ⛔ KHÔNG cải thiện giá trị sản
> phẩm, trải nghiệm người dùng, khác biệt thương mại, hay vận hành doanh nghiệp
> — sẽ ⛔ KHÔNG được coi là ưu tiên.**

---

## §2 · 🔴 CÂU HỎI MỞ ĐẦU — BẮT BUỘC, ĐỨNG TRƯỚC MỌI THỨ

Mọi báo cáo triển khai **bắt buộc** mở đầu bằng đúng câu này:

```
GIÁ TRỊ MỚI NÀO ĐÃ ĐƯỢC TẠO RA?
```

⛔ **Không** mở đầu bằng: *"Đã hoàn thành N tệp"* · *"Bộ kiểm xanh"* ·
*"Kiến trúc đã sạch"* · *"Đã refactor xong"*. Đó là **phương tiện**, ⛔ không phải
giá trị — và đặt chúng lên đầu là mời Board rà soát nhầm thứ.

⛔ **Không** trả lời bằng cách mô tả lại việc đã làm. *"Đã dựng lược đồ 10 trường"*
là **việc**. Giá trị là **điều gì hôm nay làm được mà hôm qua ⛔ không làm được**.

🔑 **Trả lời trung thực khi ⛔ không có giá trị mới.** Một hạng mục dọn nợ kỹ
thuật thuần tuý nên nói thẳng *"⛔ chưa tạo giá trị mới cho người dùng; nó gỡ bỏ
điều đang chặn giá trị X"* — ⛔ **không** được nống một việc kỹ thuật thành một
lời hứa thương mại. Nống lên là cách nhanh nhất làm Board mất niềm tin vào **mọi**
báo cáo sau đó.

---

## §3 · BẢY PHẦN BẮT BUỘC — theo đúng thứ tự này

Thứ tự **⛔ không được đảo**: giá trị trước, kỹ thuật sau.

| # | Phần | Trả lời câu gì | Cấm |
|---|---|---|---|
| ① | **Business Value Created** | Vận hành doanh nghiệp đổi gì? Quyết định nào nhanh hơn / rẻ hơn / đỡ rủi ro hơn? | ⛔ cấm liệt kê tính năng |
| ② | **User Value Created** | **AI dùng?** Họ làm được gì mới, hay thôi ⛔ không phải làm gì nữa? | ⛔ cấm *"người dùng"* chung chung — nêu **vai cụ thể** |
| ③ | **Commercial Value Created** | Khác biệt bán được ⛔ không? Giữ chân? Mở thị trường? Giảm chi phí phục vụ? | ⛔ cấm hứa doanh thu ⛔ không cơ sở |
| ④ | **Product Alignment** | Khớp Product Constitution · Blueprint · 19 Business App ở chỗ nào? Lệch chỗ nào? | ⛔ cấm bỏ trống phần **lệch** |
| ⑤ | **Architecture Impact** | Chạm ranh giới nào? ADR nào? Bậc ADR-010 nào? Nợ kiến trúc phát sinh? | ⛔ cấm *"⛔ không ảnh hưởng"* ⛔ không kèm bằng chứng |
| ⑥ | **Engineering Quality** | Đo được gì? Bộ kiểm nào chạy? **Phần nào CHƯA kiểm được?** | 🔴 ⛔ cấm báo *"đã xong"* cho phần mới đúng về mặt mã |
| ⑦ | **Governance Impact** | ADR cần duyệt? Mục nào chờ Board? Hiến pháp/Freeze có chạm? | ⛔ cấm im lặng về mục đang chặn |

---

## §4 · BA LUẬT TRUNG THỰC — thừa hưởng từ nghi thức nghiệm thu

Chuẩn này **⛔ không thay thế** `UI_UX_STANDARDS` §8 và `CLAUDE.md` §5. Nó **thêm
một lớp trước**, và mang theo ba luật cũ ⛔ không đổi:

1. **Build sạch ⛔ CHƯA ĐỦ.** Phần ⑥ phải nêu rõ thứ **chưa kiểm được** — ⛔ không
   được để trống, ⛔ không được nói giảm.
2. **"⚪ Bỏ qua" ⛔ KHÁC "✅ đạt".** Bài kiểm thiếu bí mật CSDL thoát 0 nhưng ⛔
   **không** chứng minh được gì.
3. **Giá trị phải KIỂM CHỨNG ĐƯỢC hoặc được khai là PHỎNG ĐOÁN.** Ghi rõ cái nào
   đã đo, cái nào là giả định. Một con số bịa trông y hệt một con số thật.

---

## §5 · KHUÔN TỐI THIỂU

```markdown
# <Tên báo cáo>

## GIÁ TRỊ MỚI NÀO ĐÃ ĐƯỢC TẠO RA?
<2–5 câu. Điều gì hôm nay làm được mà hôm qua ⛔ không. Hoặc: ⛔ chưa có
 giá trị mới, và nó gỡ bỏ cái gì đang chặn.>

## ① Business Value Created
## ② User Value Created
## ③ Commercial Value Created
## ④ Product Alignment
## ⑤ Architecture Impact
## ⑥ Engineering Quality
     — nêu rõ PHẦN CHƯA KIỂM ĐƯỢC
## ⑦ Governance Impact
     — nêu rõ mục CHỜ BOARD
```

---

## §6 · ⚠️ HIỆU LỰC VỀ THỜI GIAN — và vì sao ⛔ không có răng máy

- Chuẩn này áp cho báo cáo lập **từ 06/08/2026** trở đi. Báo cáo cũ trong
  `docs/planning/` · `docs/audit/` **⛔ không** phải viết lại — chúng ra đời trước
  luật, và viết lại lịch sử là điều Hiến pháp §43.7 cấm.
- ⚠️ **⛔ CHƯA CÓ phép kiểm tự động** cưỡng chế bảy phần này. Một phép kiểm quét
  `docs/**/*REPORT*.md` sẽ **đánh hỏng ~10 báo cáo cũ hợp lệ**, còn một danh sách
  miễn trừ theo ngày thì sẽ mục ruỗng. Cưỡng chế hiện nay là **kỷ luật rà soát của
  Board**, ⛔ không phải máy — ghi nhận thẳng thắn ở ADR-024 §4.4 `TD-GR1`.
- Bộ kiểm kiến trúc **có** canh một thứ: **tệp này phải tồn tại** *(mục ⑥ tài liệu
  bắt buộc)*.
