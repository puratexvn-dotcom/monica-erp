# BUSINESS — MONICA ONE

Thư mục này chứa **đặc tả nghiệp vụ chính thức** của MONICA ONE.

## Mục lục

| Tài liệu | Trạng thái | Vai trò |
|---|---|---|
| [BUSINESS_KNOWLEDGE_BASE.md](BUSINESS_KNOWLEDGE_BASE.md) | ⏳ **v2.0 · DRAFT — chờ Board phê duyệt** | Đặc tả nghiệp vụ có thẩm quyền · bậc 0′ |

## Thẩm quyền

Khi được Board phê duyệt, `BUSINESS_KNOWLEDGE_BASE.md` giữ **bậc 0′** theo
[ADR-010](../adr/ADR-010-thu-bac-van-ban-chuan-tac.md) — tối cao về **sự thật
nghiệp vụ**, đứng dưới Quyết định của Board và trên Hiến pháp *về mặt nghiệp vụ*.

> **BKB tối cao về NGHIỆP VỤ** — *cái gì là thật.*
> **Hiến pháp tối cao về CHUẨN TẮC KIẾN TRÚC** — *phải xây thế nào.*

Mâu thuẫn thật giữa hai bên ⇒ **DỪNG**, đưa lên Board. Không tác nhân nào tự chọn
bên thắng. BKB **không** được dùng để lách chuẩn tắc kỹ thuật.

## 🧊 Thi hành đang đóng băng

Board Decision 04/08/2026:

- ❌ Không thi hành MD
- ❌ Không viết bài kiểm nghiệp vụ MD
- ❌ Không thiết kế lại module
- ❌ **Không Domain Modeling** cho tới khi BKB được phê duyệt

Mốc tiếp theo là **phê duyệt BKB**, không phải viết mã.

## Hệ mã định danh

| Tiền tố | Dùng cho |
|---|---|
| `BR-<MIỀN>-nnn` | Quy tắc nghiệp vụ — mỗi quy tắc có Chủ sở hữu · Nguồn bằng chứng · Tham chiếu Hiến pháp |
| `OQ-nnn` | Câu hỏi nghiệp vụ còn mở — giữ nguyên số của bộ phỏng vấn 31 câu |
| `CF-n` | Mâu thuẫn giữa các nguồn — giữ nguyên số `C1–C8` của `NEEDS_CLARIFICATION.md` |
| `VR-nnn` | Việc xác minh kỹ thuật *(chạy truy vấn · đăng nhập thật)* |
| `FD-nnn` | Quyết định Board cố ý hoãn |

Số **không tái sử dụng**. Giữ nguyên số của hai bộ cũ là cố ý — hàng chục trích
dẫn `C2`, `Q16`… đã nằm trong tài liệu khác.

## Ba nhãn phân loại

| Nhãn | Nghĩa | Thiết kế được? |
|---|---|---|
| ✅ `Verified` | Board đã phát biểu, hoặc đã đo được bằng chứng cứng | Có — sau khi Board duyệt |
| ❓ `Needs Clarification` | Chưa đủ rõ. **Không suy diễn câu trả lời** | Không |
| 🕐 `Future Decision` | Board cố ý hoãn | Không — nhưng phải chừa đường |

⚠️ Ba nhãn này phân loại **sự thật nghiệp vụ**, không phải tình trạng thi hành.
*Khoảng cách thi hành* là cột riêng, trục riêng.

## Nguồn đã hợp nhất

| Nguồn | Địa vị |
|---|---|
| Business DNA v1.0 | ⚠️ **không tồn tại dưới dạng tệp Board ký** — xem BKB §G.2 |
| [`../discovery/`](../discovery/) Phase 1 · Phase 2 | Bằng chứng — giữ nguyên, không bị thay thế |
| [`../discovery/MD_BUSINESS_INTERVIEW.md`](../discovery/MD_BUSINESS_INTERVIEW.md) | **Công cụ thi hành** để lấp Phần E |
| [`../architecture/NEEDS_CLARIFICATION.md`](../architecture/NEEDS_CLARIFICATION.md) | **Được BKB Phần E thay thế** — giữ lại làm hồ sơ |
| [`../architecture/CM_OPERATING_MODEL.md`](../architecture/CM_OPERATING_MODEL.md) | ⚠️ **§3 xây trên giả định đã bị bác** — không dùng làm nguồn thiết kế |
