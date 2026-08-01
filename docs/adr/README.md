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
| [ADR-004](ADR-004-concurrency-control.md) | Concurrency Control — thay Last-Write-Wins | `034` | ⏳ **Chờ phê duyệt** · **chặn Portal đối tác ghi** |

⚠️ ADR-001 nằm ở [`docs/assignment/`](../assignment/) vì viết trước khi thư mục
này tồn tại. **Không di chuyển** — đường dẫn cũ đã nằm trong lịch sử git và trong
phần References của ADR-002. Từ ADR-002 trở đi, nơi lưu chính thức là `docs/adr/`.

## Tài liệu chuẩn đi kèm

| Tài liệu | Phạm vi |
|---|---|
| [Mutation Policy](../MUTATION_POLICY.md) | retry · optimistic update · xung đột · danh tính yêu cầu cho mọi CREATE/UPDATE/DELETE |

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
