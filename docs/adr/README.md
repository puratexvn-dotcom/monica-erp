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
