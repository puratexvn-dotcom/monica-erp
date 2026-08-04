# ARCHITECTURE — MONICA ONE

Thư mục này chứa tài liệu kiến trúc cấp cao nhất của MONICA ONE.

## Mục lục

| # | Tài liệu | Trạng thái | Nội dung |
|---|---|---|---|
| 00 | [00-CONSTITUTION.md](00-CONSTITUTION.md) | ✅ **v1.5 · ADOPTED** *(hiệu lực 02/08/2026)* | **Hiến pháp duy nhất** — 8 Phần · 45 Điều · Preamble · Appendix |
| — | [CM_OPERATING_MODEL.md](CM_OPERATING_MODEL.md) | ⚠️ **Một phần đã lỗi thời** | Mô hình vận hành nhà máy gia công. §3 mâu thuẫn với BKB §3–§5 — xem `NEEDS_CLARIFICATION` Phần A |
| — | [NEEDS_CLARIFICATION.md](NEEDS_CLARIFICATION.md) | 📦 **Đã được thay thế** *(04/08/2026)* | Sổ câu hỏi mở nay ở [BKB Phần E](../business/BUSINESS_KNOWLEDGE_BASE.md). Giữ làm hồ sơ — **không thêm mục mới vào đây** |
| — | [adr/](adr/) | — | ⚠️ Chuỗi ADR song song — xem cảnh báo bên dưới |

## Thứ bậc thẩm quyền

⚠️ **Ghi chú cũ ở tệp này từng nói `00-CONSTITUTION.md` là "bộ khung chưa có hiệu
lực". Ghi chú đó SAI.** Hiến pháp đã ban hành đầy đủ từ 02/08/2026 và đã qua 5 tu
chính. Đã sửa 04/08/2026 theo
[ADR-010](../adr/ADR-010-thu-bac-van-ban-chuan-tac.md).

Thứ bậc bảy bậc — bậc trên thắng bậc dưới, theo Hiến pháp §43.3 và ADR-010:

| Bậc | Thẩm quyền | Văn bản |
|---|---|---|
| **0** | Quyết định của Board | biên bản chỉ thị |
| **0′** | Business Knowledge Base | [`../business/BUSINESS_KNOWLEDGE_BASE.md`](../business/BUSINESS_KNOWLEDGE_BASE.md) — ⏳ DRAFT |
| **1** | **Constitution** | [`00-CONSTITUTION.md`](00-CONSTITUTION.md) — **duy nhất** (§43.9) |
| **2** | Accepted ADR | [`../adr/`](../adr/) |
| **3** | Engineering Standards | [`../UI_UX_STANDARDS.md`](../UI_UX_STANDARDS.md) · [`../MUTATION_POLICY.md`](../MUTATION_POLICY.md) · [`../design/`](../design/) |
| **4** | Approved Playbooks | [`../MONICA_CONSTITUTION.md`](../MONICA_CONSTITUTION.md) · [`../ENGINEERING_PLAYBOOK.md`](../ENGINEERING_PLAYBOOK.md) |
| **5** | Technical Documentation | [`../DOMAIN_GLOSSARY.md`](../DOMAIN_GLOSSARY.md) · [`../RLS_COVERAGE_MATRIX.md`](../RLS_COVERAGE_MATRIX.md) · [`../audit/`](../audit/) · [`../discovery/`](../discovery/) |
| **6** | Source Code | mã · lược đồ CSDL · migration |

**`MONICA_CONSTITUTION.md` xuống bậc 4 — không bị xoá, không bị sửa nội dung.**
12 nguyên tắc và 34 quy tắc Playbook **vẫn ràng buộc đầy đủ**; xuống bậc chỉ trả
lời câu hỏi *"khi mâu thuẫn thì ai thắng"*. Bài kiểm kiến trúc mục ⑥ tiếp tục
cưỡng chế tệp đó phải tồn tại.

## Quan hệ Nghiệp vụ ⟷ Hiến pháp

Phân theo **lĩnh vực**, không theo thứ tự:

- **BKB tối cao về NGHIỆP VỤ** — *cái gì là thật*.
- **Hiến pháp tối cao về CHUẨN TẮC KIẾN TRÚC** — *phải xây thế nào*.
- Hiến pháp im lặng về một chi tiết nghiệp vụ ⇒ BKB điền vào (không phải ghi đè).
- Mâu thuẫn thật ⇒ **DỪNG**, ghi vào [`NEEDS_CLARIFICATION.md`](NEEDS_CLARIFICATION.md),
  Board phán quyết qua tu chính theo Điều 42. **Không tác nhân nào tự chọn bên thắng.**
- BKB **không** được dùng để lách chuẩn tắc kỹ thuật. *"Khách cần xem nhanh"*
  không phải căn cứ bỏ RLS.

## ⚠️ Chuỗi ADR song song — nợ quản trị đã biết

`[VERIFIED]` Hiện có **ba** nơi chứa ADR, và **`ADR-001` bị trùng số**:

| Đường dẫn | Nội dung |
|---|---|
| [`../adr/`](../adr/) | **kho chính thức** — ADR-002 … ADR-011 |
| [`adr/ADR-001-homepage-conceptual-model.md`](adr/) | ADR-001 *(Homepage)* |
| [`../assignment/ADR-001-site-and-operation.md`](../assignment/) | ADR-001 *(Site & Operation)* — **trùng số** |

Board đã chốt 03/08/2026: **số ADR duy nhất toàn cục, cấm chuỗi song song.** Kho
chưa tuân thủ; việc gộp được theo dõi ở `TD-13`. **ADR mới luôn đặt ở
[`../adr/`](../adr/).**

## Quy ước đánh số

Tệp trong thư mục này đánh số hai chữ số theo thứ tự đọc (`00-`, `01-`, …), cùng
quy ước với [`../assignment/`](../assignment/). Số **không tái sử dụng**.
