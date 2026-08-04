# Hồ sơ phản biện độc lập

> Khép lại **TD-15** — [ADR-011](../adr/ADR-011-tham-quyen-kien-truc.md) §4.3.
> Khép lại **B6** — [`ARCHITECTURE_BASELINE.md`](../ARCHITECTURE_BASELINE.md) §3.1.

[ADR-011](../adr/ADR-011-tham-quyen-kien-truc.md) §2.2 bắt buộc phản biện độc lập
**trước** khi Board phê duyệt, nhưng không chỉ định nơi lưu. Thiếu nơi lưu thì ý
kiến phản biện sống trong lịch sử hội thoại — và **biến mất cùng nó**. Đó đúng là
sự cố đã xảy ra một lần với bộ bài kiểm bảo mật, được ghi ở đầu
[`tests/_lib/harness.mjs`](../../tests/_lib/harness.mjs).

Thư mục này là nơi lưu vĩnh viễn.

---

## Quy tắc

| # | Quy tắc |
|---|---|
| **R-1** | Một tệp cho một hạng mục, đặt tên `<mã-hạng-mục>-review.md` — ví dụ `ADR-018-review.md`. |
| **R-2** | Hồ sơ đi kèm **phải đủ bốn mục** của ADR-011 §2.3. Thiếu mục 4 (*"chỗ tôi có thể sai"*) ⇒ **chưa đủ điều kiện phản biện**, không phải "phản biện xong". |
| **R-3** | Ghi **cả ý kiến bị bác**, kèm lý do bác. Hồ sơ chỉ chứa ý kiến được tiếp thu là hồ sơ đã bị viết lại — trái Hiến pháp Điều 43.7. |
| **R-4** | Không sửa hồ sơ sau khi Board phê duyệt hạng mục. Có thông tin mới ⇒ **thêm mục Phụ lục**, không sửa phần cũ. |
| **R-5** | Hạng mục **không** thuộc §2.2 (sửa lỗi đã đo · bài kiểm · tài liệu · audit) **không cần** hồ sơ ở đây. |

---

## Hạng mục bắt buộc có hồ sơ — ADR-011 §2.2

- ADR mới hoặc tu chính Hiến pháp
- Thay đổi domain model · máy trạng thái · từ vựng trạng thái
- Thay đổi lược đồ CSDL · RLS · policy · hàm `SECURITY DEFINER`
- Mở Domain / Module / bảng nghiệp vụ mới
- Thay đổi mô hình phân quyền hoặc ranh giới cổng đối tác ngoài

---

## Khuôn mẫu

Chép [`_TEMPLATE-review.md`](_TEMPLATE-review.md) rồi điền.

---

## Sổ hồ sơ

| Hạng mục | Người phản biện | Ngày | Kết luận |
|---|---|---|---|
| *(chưa có)* | | | |

> ⏳ **Chưa quyết:** thời hạn phản biện tối đa — ADR-011 §4.2 · Cổng B mục `B5`.
> Chưa có thời hạn thì một người phản biện im lặng **chặn vô thời hạn** mọi hạng
> mục ở §2.2. Đây là rủi ro vận hành thật, không phải hình thức.
