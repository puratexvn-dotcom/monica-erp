# ARCHITECTURE DECISION RECORDS

> **SQL mô tả hệ thống đã thay đổi NHƯ THẾ NÀO. ADR mô tả VÌ SAO nó phải thay đổi.**

Bắt buộc từ Migration 029 trở đi cho mọi thay đổi Domain Model hoặc Architecture
— Hiến pháp **Điều XXXIII**.

## Mục lục

| # | Tiêu đề | Migration | Trạng thái |
|---|---|---|---|
| [ADR-001](../assignment/ADR-001-site-and-operation.md) | Địa điểm sản xuất & Công đoạn | `028` | Đã phê duyệt |
| [ADR-002](ADR-002-assignment-domain.md) | Assignment Domain | `029` | Đã phê duyệt *(with Required Changes)* |
| [ADR-003](ADR-003-request-id.md) | Request ID — chuẩn nền tảng chống lập chứng từ hai lần | `029c` → `033` | Đã phê duyệt |
| [ADR-004](ADR-004-concurrency-control.md) | Concurrency Control — thay Last-Write-Wins | `034` | Đã phê duyệt · đã chạy |
| [ADR-005](ADR-005-udmd-i18n-and-soft-delete.md) | Đa ngôn ngữ cho UDMD (JSONB) · xoá mềm cho điều khoản thương mại | `035a/b/c` · `036` · `036b` | Đã phê duyệt · đã chạy |
| [ADR-006](ADR-006-permission-engine.md) | Permission Engine — phân quyền theo Assignment | `030` → `031` | ⏳ **Chờ phê duyệt** · **031 = điểm không quay lại** |
| [ADR-007](ADR-007-data-reconciliation.md) | Data Reconciliation — đối soát dữ liệu lịch sử | — | 🟡 **Chờ phê duyệt** |
| [ADR-008](ADR-008-bundle-stage-vocabulary.md) | Từ vựng vòng đời bó bán thành phẩm — **tách trục** | `039` → `031d` | ✅ **Đã phê duyệt** *(Board, 02/08/2026 · Phương án D)* |
| [ADR-009](ADR-009-enterprise-design-system.md) | Enterprise Design System — màu là thông tin, không phải trang trí | — *(Hiến pháp `1.2` · PART VIII · Điều 44)* | ✅ **Đã phê duyệt** *(Board, 03/08/2026)* |
| [ADR-010](ADR-010-thu-bac-van-ban-chuan-tac.md) | Thứ bậc văn bản chuẩn tắc — chấm dứt tình trạng hai Hiến pháp | — | ✅ **Đã phê duyệt** *(Board, 04/08/2026)* · ⚠️ **đã thi hành trước lên 3 tệp `.md`** — xem ghi chú dưới |
| [ADR-011](ADR-011-tham-quyen-kien-truc.md) | Thẩm quyền kiến trúc và phản biện độc lập bắt buộc | — | ✅ **Đã phê duyệt** *(Board, 04/08/2026)* |
| — | *`012` · `013` · `014` — **số dành riêng, chưa từng ban hành**. Chỉ được ĐỀ XUẤT ở Audit Report §6 rồi hấp thụ vào EDD. **Không tái sử dụng** (Hiến pháp §37.5)* | — | ⛔ **không tồn tại** |
| [ADR-015](ADR-015-muoi-bon-business-workspace.md) | Mười bốn Business Workspace — tu chính Hiến pháp §16.2 · Domain Activation Model | — | ✅ **Đã phê duyệt** *(Board, 04/08/2026)* → Hiến pháp `v1.6` |
| [ADR-016](ADR-016-executive-center-enterprise-control-center.md) | Executive Center là Enterprise Control Center — ngoại lệ hiến định duy nhất của §5.4 | — | ✅ **Đã phê duyệt** *(Board, 04/08/2026)* → §18.10 · §18.11 |
| [ADR-017](ADR-017-trang-chu-hai-vung.md) | Trang chủ hai vùng — Work Zone + Launcher, sáu ràng buộc `WZ-1`…`WZ-6` | — | ✅ **Đã phê duyệt** *(Board, 04/08/2026)* → §13.3 |
| [ADR-018](ADR-018-thu-hep-authenticated-only.md) | Thu hẹp `authenticated_only` trên 23 bảng Merchandising — phát hiện `F-2` | `042` *(chưa viết)* | ⏳ **Chờ phản biện + Board phê duyệt** · ⛔ **không viết SQL trước khi duyệt** |
| [ADR-023](ADR-023-board-knowledge-system.md) | **Board Knowledge System** — Knowledge Object là đơn vị quản lý tri thức · chỉ mục ⛔ không bao giờ là nguồn | — *(thuần quản trị tài liệu)* | ✅ **Đã phê duyệt** *(Board, 06/08/2026)* · ⚠️ duyệt **⛔ không kèm phản biện độc lập** — miễn trừ theo vụ, xem §4.3 |
| [ADR-024](ADR-024-board-golden-rule.md) | **BOARD GOLDEN RULE** — giá trị đứng trước sự tinh xảo kỹ thuật · chuẩn báo cáo bảy phần | — *(thuần quản trị)* | ✅ **Đã phê duyệt** *(Board Directive 06/08/2026)* · ⚠️ cùng chế độ miễn trừ phản biện |

⚠️ **ADR-010 đã được thi hành một phần trước khi phê duyệt**, theo chỉ thị trực
tiếp của Board ngày 04/08/2026 (*"dựng lại nền quản trị"*). Ba tệp bị chạm:
`CLAUDE.md` · `docs/architecture/README.md` · `docs/MONICA_CONSTITUTION.md` — chỉ
thêm khối ghi chú, **không migration, không đụng mã**. Lý do không chờ: hai tệp
đầu đang chứa một phát biểu **sai sự thật** về bộ luật nào có hiệu lực, và mỗi
phiên làm việc trôi qua là một phiên khởi động bằng tiền đề sai. Board bác ADR-010
⇒ quay lui bằng cách gỡ ba khối ghi chú.

⚠️ ADR-001 nằm ở [`docs/assignment/`](../assignment/) vì viết trước khi thư mục
này tồn tại. **Không di chuyển** — đường dẫn cũ đã nằm trong lịch sử git và trong
phần References của ADR-002. Từ ADR-002 trở đi, nơi lưu chính thức là `docs/adr/`.

## Tài liệu chuẩn đi kèm

| Tài liệu | Phạm vi |
|---|---|
| [Mutation Policy](../MUTATION_POLICY.md) | retry · optimistic update · xung đột · danh tính yêu cầu cho mọi CREATE/UPDATE/DELETE |
| [Domain Glossary](../DOMAIN_GLOSSARY.md) | từ vựng nghiệp vụ — bản chất, không phải cấu trúc bảng |
| [Technical Debt](../TECHNICAL_DEBT.md) | sổ nợ kỹ thuật — nơi **theo dõi**; ADR là nơi **phát hiện** |

## Sáu mục bắt buộc

1. **Context** — vì sao cần thay đổi · **bằng chứng đo được**, không phải nhận định
2. **Decision** — quyết định được chọn · phạm vi
3. **Alternatives Considered** — đã cân nhắc gì · **vì sao không chọn**
4. **Consequences** — lợi ích · đánh đổi · Technical Debt
5. **Rollback Impact** — quay lui ảnh hưởng gì · có cần Migration bù không
6. **References** — Hiến pháp · Migration · ADR liên quan

## Thứ tự chuẩn

```
Architecture Review → ADR → Migration Design Review → Impact Analysis
                       ↑
              phê duyệt xong ở đây
                                    → SQL Migration → Regression
                                    → Performance → Security → Snapshot → Commit
```

**Không viết SQL trước khi ADR được phê duyệt.**

## Quy ước

- Đánh số liên tục, **không tái sử dụng số**.
- ADR **không bị xoá, không sửa lịch sử**. Quyết định bị thay thế thì viết ADR
  mới và đánh dấu ADR cũ *Superseded by ADR-NNN* — lý do của một quyết định sai
  vẫn là thông tin có giá trị.
- Tên tệp: `ADR-NNN-<ten-ngan-khong-dau>.md`
