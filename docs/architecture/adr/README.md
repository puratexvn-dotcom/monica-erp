# CONSTITUTIONAL ADR

> **Sổ quyết định của các bản SỬA ĐỔI HIẾN PHÁP.**
> Không phải sổ quyết định của Domain Model hay Migration.

---

## ⚠️ DỰ ÁN CÓ HAI CHUỖI ADR — ĐỌC KỸ TRƯỚC KHI ĐÁNH SỐ

Hai chuỗi này **đánh số độc lập**, nên `ADR-001` xuất hiện ở cả hai nơi và **không
phải là số trùng**. Tra cứu bao giờ cũng phải kèm thư mục.

| Chuỗi | Thư mục | Phạm vi | Sửa cái gì |
|---|---|---|---|
| **Constitutional ADR** | `docs/architecture/adr/` ← *bạn đang ở đây* | Sửa đổi [`00-CONSTITUTION.md`](../00-CONSTITUTION.md) | Điều khoản · Định nghĩa · Glossary |
| **Domain & Migration ADR** | [`docs/adr/`](../../adr/) | Domain Model · Lược đồ · RLS | Bảng · Cột · Policy · Migration |

Trích dẫn đúng cách: **`Constitutional ADR-001`** ≠ **`ADR-001`** ở
[`docs/assignment/ADR-001-site-and-operation.md`](../../assignment/ADR-001-site-and-operation.md)
(Địa điểm sản xuất & Công đoạn · migration `028`).

> **Việc tách chuỗi là quyết định của Architecture Board ngày 03/08/2026**, khi Board
> chỉ định tạo `ADR-001` tại thư mục này trong lúc số 001 của chuỗi kia đã dùng rồi.
> Hai chuỗi trả lời hai câu hỏi khác nhau nên tách là hợp lý — nhưng **quy ước
> "không tái sử dụng số" ở [`docs/adr/README.md`](../../adr/README.md) chỉ áp dụng
> TRONG một chuỗi**, không bắc qua hai chuỗi. Ghi ra đây để lần sau không ai tưởng
> có lỗi đánh số.

⚠️ Bài kiểm kiến trúc (`npm run test:arch`, mục ⑧) chỉ quét `docs/adr/` **không đệ
quy** — thư mục này nằm ngoài tầm quét của nó và **không** được nó bảo vệ.

---

## Mục lục

| # | Tiêu đề | Hiến pháp | Trạng thái |
|---|---|---|---|
| [ADR-001](ADR-001-homepage-conceptual-model.md) | Homepage Conceptual Model — **Business Operating System Launcher** | `1.0` → `1.1` | ✅ **ACCEPTED** *(Board, 03/08/2026)* |

---

## Chín mục bắt buộc

1. **Background** — bối cảnh · điều khoản hiện hành nói gì
2. **Problem** — mâu thuẫn hoặc khoảng trống, kèm **bằng chứng đo được**
3. **Decision** — phát biểu quy phạm được chọn
4. **Alternatives Considered** — đã cân nhắc gì · **vì sao không chọn**
5. **Consequences** — lợi ích · đánh đổi · nợ kỹ thuật
6. **Architecture Diagram** — trước và sau
7. **Rollback Impact** — quay lui phải làm gì
8. **Status**
9. **Revision History**

## Quy ước

- Đánh số liên tục **trong chuỗi này**, không tái sử dụng số.
- ADR **không bị xoá, không sửa lịch sử**. Quyết định bị thay thế thì viết ADR mới và
  đánh dấu ADR cũ *Superseded by ADR-NNN*.
- Mọi ADR được chấp thuận phải **ghi một dòng vào Revision History của Hiến pháp** và
  nâng số Version của Hiến pháp.
- Tên tệp: `ADR-NNN-<ten-ngan-khong-dau>.md`
