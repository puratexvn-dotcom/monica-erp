# KNOWLEDGE INDEX — chỉ mục sinh tự động

> 🤖 **TỆP NÀY DO MÁY SINH — ⛔ ĐỪNG SỬA TAY.**
> Sinh lại bằng `npm run knowledge`. Sửa tay sẽ bị phép kiểm ⑧ của
> [`tests/governance/knowledge-objects.test.mjs`](../../tests/governance/knowledge-objects.test.mjs) bắt.
>
> Chỉ mục này ⛔ **không** phải nguồn tri thức. Nguồn nằm ở trường `source`
> của từng đối tượng, bậc 0–4 — `README.md` §2.

---

## §1 · 🔴 BOARD CẦN QUYẾT GÌ

🔴 **5 mục đang chờ Board phán quyết.**

| ID | Tiêu đề | Loại | Từ ngày | Bị chặn bởi |
|---|---|---|---|---|
| [`KO-ADR-020`](objects/adr/KO-ADR-020-aggregate-child-immutability.md) | ADR-020 — Aggregate Child Immutability | ADR Reference | 2026-08-05 | — |
| [`KO-PEN-001`](objects/pending/KO-PEN-001-migration-duoi-adr-chua-duyet.md) | 5 migration đang chạy SẢN XUẤT dưới 3 ADR chưa phê duyệt | Pending Decision | 2026-08-05 | — |
| [`KO-PEN-002`](objects/pending/KO-PEN-002-khong-co-phan-bien-doc-lap.md) | ⛔ KHÔNG có phản biện độc lập nào tồn tại — 0/18 ADR | Pending Decision | 2026-08-05 | — |
| [`KO-PEN-003`](objects/pending/KO-PEN-003-cat-hoac-gia-han-security-freeze.md) | Cắt hoặc gia hạn SECURITY FREEZE bằng văn bản — Cổng B mục B2 | Pending Decision | 2026-08-05 | `KO-LIM-010` |
| [`KO-PEN-005`](objects/pending/KO-PEN-005-lo-trinh-chuyen-doi-tri-thuc.md) | Lộ trình chuyển đổi ~196 mục tri thức còn lại thành Knowledge Object | Pending Decision | 2026-08-06 | — |

## §2 · THỐNG KÊ

**Tổng: 38 đối tượng.**

| Loại | Số lượng | Trạng thái |
|---|---|---|
| Principle `KO-PRN` | 6 | ADOPTED ×6 |
| Decision `KO-DEC` | 6 | ADOPTED ×6 |
| Rule `KO-RUL` | 7 | ADOPTED ×7 |
| Reference `KO-REF` | 5 | ADOPTED ×5 |
| Limitation `KO-LIM` | 4 | OPEN ×3 · ACCEPTED ×1 |
| Pending Decision `KO-PEN` | 5 | PENDING_BOARD ×4 · CLOSED ×1 |
| ADR Reference `KO-ADR` | 5 | ADOPTED ×4 · PENDING_BOARD ×1 |

## §3 · SỔ ĐĂNG KÝ

| ID | Tiêu đề | Category | Status | Approved By | Date | Bậc | Phản chiếu |
|---|---|---|---|---|---|---|---|
| [`KO-ADR-010`](objects/adr/KO-ADR-010-thu-bac-van-ban-chuan-tac.md) | ADR-010 — Thứ bậc văn bản chuẩn tắc, chấm dứt tình trạng hai Hiến pháp | ADR · Governance · Document Hierarchy | ADOPTED | Board | 2026-08-04 | 2 | ADR-010 |
| [`KO-ADR-011`](objects/adr/KO-ADR-011-tham-quyen-kien-truc.md) | ADR-011 — Thẩm quyền kiến trúc và phản biện độc lập bắt buộc | ADR · Governance · Review Authority | ADOPTED | Board | 2026-08-04 | 2 | ADR-011 |
| [`KO-ADR-020`](objects/adr/KO-ADR-020-aggregate-child-immutability.md) | ADR-020 — Aggregate Child Immutability | ADR · Domain Model · Immutability | PENDING_BOARD | Chưa có | 2026-08-05 | 2 | ADR-020 |
| [`KO-ADR-023`](objects/adr/KO-ADR-023-board-knowledge-system.md) | ADR-023 — Board Knowledge System, Knowledge Object là đơn vị quản lý tri thức | ADR · Governance · Knowledge Architecture | ADOPTED | Board | 2026-08-06 | 2 | ADR-023 |
| [`KO-ADR-024`](objects/adr/KO-ADR-024-board-golden-rule.md) | ADR-024 — BOARD GOLDEN RULE, ghi nhận chỉ thị bậc 0 | ADR · Governance · Product Value | ADOPTED | Board | 2026-08-06 | 2 | ADR-024 |
| [`KO-DEC-006`](objects/decision/KO-DEC-006-party-model.md) | Party Model — một Party, một Party Number, một Master Record; Role là thuộc tính | Board Decision · Master Data | ADOPTED | Board | 2026-08-06 | 0 | BDR-06 |
| [`KO-DEC-007`](objects/decision/KO-DEC-007-material-ownership.md) | Material Ownership — ⛔ không hard-code, theo Contract · OrderType · Business Rule | Board Decision · Master Data · Material | ADOPTED | Board | 2026-08-06 | 0 | BDR-07 |
| [`KO-DEC-013`](objects/decision/KO-DEC-013-so-huu-du-lieu.md) | Sở hữu dữ liệu — tách ≥4 loại Customer · Monica · Legal Record · AI Generated | Board Decision · Data Ownership · Egress | ADOPTED | Board | 2026-08-06 | 0 | BDR-13 |
| [`KO-DEC-014`](objects/decision/KO-DEC-014-audit-log-bat-bien.md) | Audit Log là BẤT BIẾN — bằng chứng pháp lý | Board Decision · Audit · Data Integrity | ADOPTED | Board | 2026-08-06 | 0 | BDR-14 |
| [`KO-DEC-015`](objects/decision/KO-DEC-015-legal-conversation.md) | Legal Conversation — PO · QA · Approval · Change · Commercial lưu đầy đủ, ⛔ không sửa | Board Decision · Audit · Communication | ADOPTED | Board | 2026-08-06 | 0 | BDR-15 |
| [`KO-DEC-021`](objects/decision/KO-DEC-021-phan-tach-nhiem-vu.md) | Phân tách nhiệm vụ (SoD) — Hybrid, cảnh báo + chặn cứng | Board Decision · Permission · Segregation of Duties | ADOPTED | Board | 2026-08-06 | 0 | BDR-21 |
| [`KO-LIM-001`](objects/limitation/KO-LIM-001-hai-adr-001.md) | Hai ADR-001 khác nhau cùng số hiệu | Known Defect · ADR Governance | OPEN | CSA | 2026-08-05 | 5 | KD-1 |
| [`KO-LIM-004`](objects/limitation/KO-LIM-004-md-client-886-dong.md) | md-client.tsx 886/900 dòng — còn 14 dòng nữa là gãy bộ kiểm kiến trúc | Known Defect · Maintainability | OPEN | CSA | 2026-08-05 | 6 | KD-4 |
| [`KO-LIM-010`](objects/limitation/KO-LIM-010-vong-khoa-security-freeze.md) | Vòng khoá SECURITY FREEZE — migration 031d…031g chặn lẫn nhau | Known Defect · Security Freeze · Migration | OPEN | CSA | 2026-08-05 | 5 | KD-10 |
| [`KO-LIM-013`](objects/limitation/KO-LIM-013-khong-phu-det-may-tich-hop-doc.md) | Kiến trúc ⛔ KHÔNG phủ mô hình dệt–may tích hợp dọc — giới hạn CÓ TÊN | Known Limitation · Scope · Domain | ACCEPTED | Board | 2026-08-04 | 2' | KD-13 |
| [`KO-PEN-001`](objects/pending/KO-PEN-001-migration-duoi-adr-chua-duyet.md) | 5 migration đang chạy SẢN XUẤT dưới 3 ADR chưa phê duyệt | Pending Board · Constitutional Procedure | PENDING_BOARD | Chưa có | 2026-08-05 | 5 | GPR-001 A-1 |
| [`KO-PEN-002`](objects/pending/KO-PEN-002-khong-co-phan-bien-doc-lap.md) | ⛔ KHÔNG có phản biện độc lập nào tồn tại — 0/18 ADR | Pending Board · Constitutional Procedure · Review | PENDING_BOARD | Chưa có | 2026-08-05 | 5 | GPR-001 A-2 |
| [`KO-PEN-003`](objects/pending/KO-PEN-003-cat-hoac-gia-han-security-freeze.md) | Cắt hoặc gia hạn SECURITY FREEZE bằng văn bản — Cổng B mục B2 | Pending Board · Security Freeze | PENDING_BOARD | Chưa có | 2026-08-05 | 5 | GPR-001 A-3 |
| [`KO-PEN-004`](objects/pending/KO-PEN-004-phe-duyet-adr-023.md) | Phê duyệt ADR-023 — Board Knowledge System | Pending Board · Knowledge Governance | CLOSED | Board | 2026-08-06 | 2 | ADR-023 |
| [`KO-PEN-005`](objects/pending/KO-PEN-005-lo-trinh-chuyen-doi-tri-thuc.md) | Lộ trình chuyển đổi ~196 mục tri thức còn lại thành Knowledge Object | Pending Board · Knowledge Governance · Roadmap | PENDING_BOARD | Chưa có | 2026-08-06 | 5 | TD-KS1 |
| [`KO-PRN-001`](objects/principle/KO-PRN-001-su-kien-va-cam-ket.md) | P-COMMIT — Sự kiện thì nhanh, cam kết thì có chủ ý và chậm | Design Principle · Workflow | ADOPTED | Board | 2026-08-04 | 2' | P-COMMIT |
| [`KO-PRN-002`](objects/principle/KO-PRN-002-bat-kha-thu-hoi.md) | P-IRREV — Dữ liệu đã tiết lộ ⛔ không lấy lại được, phòng ngừa là cơ chế duy nhất | Design Principle · Data Egress · Security | ADOPTED | Board | 2026-08-04 | 2' | P-IRREV |
| [`KO-PRN-003`](objects/principle/KO-PRN-003-quy-trach-nhiem.md) | P-ATTRIB — Ngăn ở chỗ ngăn được, quy trách nhiệm ở chỗ ⛔ không ngăn được | Design Principle · Accountability · Security | ADOPTED | Board | 2026-08-04 | 2' | P-ATTRIB |
| [`KO-PRN-004`](objects/principle/KO-PRN-004-khong-nhap-tay.md) | P-ZEROMAN — ⛔ Không bắt người dùng nhập thứ hệ thống thu nhận được | Design Principle · Data Capture | ADOPTED | Board | 2026-08-04 | 2' | P-ZEROMAN |
| [`KO-PRN-005`](objects/principle/KO-PRN-005-khong-nhap-trung.md) | P-ZERODUP — ⛔ Không bắt người dùng nhập thứ hệ thống ĐÃ CÓ | Design Principle · Data Model · Design Gate | ADOPTED | Board | 2026-08-04 | 2' | P-ZERODUP |
| [`KO-PRN-006`](objects/principle/KO-PRN-006-gia-tri-truoc-ky-thuat.md) | BOARD GOLDEN RULE — Engineering tạo sản phẩm, Board tạo GIÁ TRỊ | Design Principle · Board Review · Product Value | ADOPTED | Board | 2026-08-06 | 0 | P-VALUE |
| [`KO-REF-001`](objects/reference/KO-REF-001-hien-phap-monica-one.md) | Hiến pháp MONICA ONE — nguồn hiến định duy nhất | Governance · Constitution | ADOPTED | Board | 2026-08-02 | 1 | — |
| [`KO-REF-002`](objects/reference/KO-REF-002-business-knowledge-base.md) | Business Knowledge Base — tối cao về sự thật nghiệp vụ | Business · Domain Truth | ADOPTED | CSA | 2026-08-04 | 0' | — |
| [`KO-REF-003`](objects/reference/KO-REF-003-governance-pending-report.md) | GPR-001 — sổ theo dõi 26 mục quản trị còn chờ Board | Governance · Pending Register | ADOPTED | CSA | 2026-08-05 | 5 | GPR-001 |
| [`KO-REF-004`](objects/reference/KO-REF-004-bo-kiem-kien-truc.md) | Bộ kiểm kiến trúc — răng máy của các quy tắc kỹ thuật | Engineering · Automated Enforcement | ADOPTED | CSA | 2026-08-05 | 6 | — |
| [`KO-REF-005`](objects/reference/KO-REF-005-bo-kiem-tri-thuc.md) | Bộ kiểm toàn vẹn Knowledge System — 9 bất biến thức | Governance · Automated Enforcement | ADOPTED | CSA | 2026-08-06 | 6 | — |
| [`KO-RUL-001`](objects/rule/KO-RUL-001-phan-quyen-theo-assignment.md) | Phân quyền theo ASSIGNMENT, ⛔ không theo ROLE | Engineering Rule · Permission · ƯU TIÊN TỐI CAO | ADOPTED | Board | 2026-08-04 | 4 | Playbook Điều XXX |
| [`KO-RUL-002`](objects/rule/KO-RUL-002-khong-luu-du-lieu-tinh-duoc.md) | ⛔ Không lưu dữ liệu TÍNH ĐƯỢC vào cơ sở dữ liệu | Engineering Rule · Data Model · Single Source of Truth | ADOPTED | Board | 2026-08-04 | 4 | — |
| [`KO-RUL-003`](objects/rule/KO-RUL-003-xoa-mem-bat-buoc.md) | Xoá mềm bắt buộc — và chỉ mục duy nhất MỘT PHẦN đi kèm | Engineering Rule · Mutation · Data Integrity | ADOPTED | Board | 2026-08-03 | 3 | — |
| [`KO-RUL-004`](objects/rule/KO-RUL-004-request-id.md) | request_id + unique index trên mọi bảng chứng từ lập-mới-được | Engineering Rule · Idempotency · Mutation | ADOPTED | Board | 2026-08-01 | 2 | ADR-003 |
| [`KO-RUL-005`](objects/rule/KO-RUL-005-adr-truoc-sql.md) | ⛔ KHÔNG viết SQL trước khi ADR được phê duyệt | Engineering Rule · Constitutional Procedure · Migration | ADOPTED | Board | 2026-08-02 | 1 | Hiến pháp Điều 4 |
| [`KO-RUL-006`](objects/rule/KO-RUL-006-view-vuot-mat-rls.md) | VIEW mặc định VƯỢT MẶT RLS — A001 là bài kiểm hồi quy mọi vòng | Engineering Rule · Security · RLS | ADOPTED | CSA | 2026-08-04 | 5 | — |
| [`KO-RUL-007`](objects/rule/KO-RUL-007-chuan-bao-cao-bay-phan.md) | Chuẩn báo cáo bảy phần — câu hỏi giá trị đứng ĐẦU TIÊN | Engineering Rule · Reporting · Board Review | ADOPTED | Board | 2026-08-06 | 3 | — |

## §4 · ĐỒ THỊ QUAN HỆ

> Dòng **thuận** ghi trong tệp đối tượng. Dòng *nghịch* ⛔ **không** ghi ở đâu cả —
> máy dựng từ chiều thuận mỗi lần sinh chỉ mục *(SCHEMA §4.2)*.

### `KO-ADR-010` — ADR-010 — Thứ bậc văn bản chuẩn tắc, chấm dứt tình trạng hai Hiến pháp

- **derives_from** → `KO-REF-001`
- *grounds* ← `KO-ADR-023`
- *grounds* ← `KO-LIM-001`

### `KO-ADR-011` — ADR-011 — Thẩm quyền kiến trúc và phản biện độc lập bắt buộc

- **derives_from** → `KO-REF-001`
- *grounds* ← `KO-PEN-002`

### `KO-ADR-020` — ADR-020 — Aggregate Child Immutability

- **depends_on** → `KO-PEN-002`
- *required_by* ← `KO-PEN-001`

### `KO-ADR-023` — ADR-023 — Board Knowledge System, Knowledge Object là đơn vị quản lý tri thức

- **derives_from** → `KO-ADR-010`
- **implements** → `KO-PRN-005`
- **evidenced_by** → `KO-REF-005`
- *required_by* ← `KO-PEN-004`
- *grounds* ← `KO-PEN-005`

### `KO-ADR-024` — ADR-024 — BOARD GOLDEN RULE, ghi nhận chỉ thị bậc 0

- **implements** → `KO-PRN-006`
- *grounds* ← `KO-RUL-007`

### `KO-DEC-006` — Party Model — một Party, một Party Number, một Master Record; Role là thuộc tính

- *required_by* ← `KO-DEC-007`
- *required_by* ← `KO-DEC-013`
- *grounds* ← `KO-RUL-001`

### `KO-DEC-007` — Material Ownership — ⛔ không hard-code, theo Contract · OrderType · Business Rule

- **depends_on** → `KO-DEC-006`

### `KO-DEC-013` — Sở hữu dữ liệu — tách ≥4 loại Customer · Monica · Legal Record · AI Generated

- **depends_on** → `KO-DEC-006`

### `KO-DEC-014` — Audit Log là BẤT BIẾN — bằng chứng pháp lý

- *refined_by* ← `KO-DEC-015`
- *grounds* ← `KO-PRN-003`
- *grounds* ← `KO-RUL-003`

### `KO-DEC-015` — Legal Conversation — PO · QA · Approval · Change · Commercial lưu đầy đủ, ⛔ không sửa

- **refines** → `KO-DEC-014`

### `KO-DEC-021` — Phân tách nhiệm vụ (SoD) — Hybrid, cảnh báo + chặn cứng

- **implements** → `KO-PRN-003`
- **constrains** → `KO-RUL-001`

### `KO-LIM-001` — Hai ADR-001 khác nhau cùng số hiệu

- **derives_from** → `KO-ADR-010`

### `KO-LIM-004` — md-client.tsx 886/900 dòng — còn 14 dòng nữa là gãy bộ kiểm kiến trúc

- **evidenced_by** → `KO-REF-004`

### `KO-LIM-010` — Vòng khoá SECURITY FREEZE — migration 031d…031g chặn lẫn nhau

- **blocks** → `KO-PEN-003`

### `KO-LIM-013` — Kiến trúc ⛔ KHÔNG phủ mô hình dệt–may tích hợp dọc — giới hạn CÓ TÊN

- **derives_from** → `KO-REF-002`

### `KO-PEN-001` — 5 migration đang chạy SẢN XUẤT dưới 3 ADR chưa phê duyệt

- **derives_from** → `KO-REF-003`
- **depends_on** → `KO-ADR-020`
- *constrained_by* ← `KO-RUL-005`

### `KO-PEN-002` — ⛔ KHÔNG có phản biện độc lập nào tồn tại — 0/18 ADR

- **derives_from** → `KO-REF-003`
- **derives_from** → `KO-ADR-011`
- **blocks** → `KO-PEN-004`
- *required_by* ← `KO-ADR-020`

### `KO-PEN-003` — Cắt hoặc gia hạn SECURITY FREEZE bằng văn bản — Cổng B mục B2

- **derives_from** → `KO-REF-003`
- *blocked_by* ← `KO-LIM-010`

### `KO-PEN-004` — Phê duyệt ADR-023 — Board Knowledge System

- **depends_on** → `KO-ADR-023`
- *blocked_by* ← `KO-PEN-002`

### `KO-PEN-005` — Lộ trình chuyển đổi ~196 mục tri thức còn lại thành Knowledge Object

- **derives_from** → `KO-ADR-023`

### `KO-PRN-001` — P-COMMIT — Sự kiện thì nhanh, cam kết thì có chủ ý và chậm

- *implemented_by* ← `KO-RUL-004`

### `KO-PRN-002` — P-IRREV — Dữ liệu đã tiết lộ ⛔ không lấy lại được, phòng ngừa là cơ chế duy nhất

- *implemented_by* ← `KO-RUL-003`
- *implemented_by* ← `KO-RUL-006`

### `KO-PRN-003` — P-ATTRIB — Ngăn ở chỗ ngăn được, quy trách nhiệm ở chỗ ⛔ không ngăn được

- **derives_from** → `KO-DEC-014`
- *implemented_by* ← `KO-DEC-021`

### `KO-PRN-004` — P-ZEROMAN — ⛔ Không bắt người dùng nhập thứ hệ thống thu nhận được

- **depends_on** → `KO-PRN-005`

### `KO-PRN-005` — P-ZERODUP — ⛔ Không bắt người dùng nhập thứ hệ thống ĐÃ CÓ

- *implemented_by* ← `KO-ADR-023`
- *required_by* ← `KO-PRN-004`

### `KO-PRN-006` — BOARD GOLDEN RULE — Engineering tạo sản phẩm, Board tạo GIÁ TRỊ

- *implemented_by* ← `KO-ADR-024`
- *implemented_by* ← `KO-RUL-007`

### `KO-REF-001` — Hiến pháp MONICA ONE — nguồn hiến định duy nhất

- *grounds* ← `KO-ADR-010`
- *grounds* ← `KO-ADR-011`

### `KO-REF-002` — Business Knowledge Base — tối cao về sự thật nghiệp vụ

- *grounds* ← `KO-LIM-013`

### `KO-REF-003` — GPR-001 — sổ theo dõi 26 mục quản trị còn chờ Board

- *grounds* ← `KO-PEN-001`
- *grounds* ← `KO-PEN-002`
- *grounds* ← `KO-PEN-003`

### `KO-REF-004` — Bộ kiểm kiến trúc — răng máy của các quy tắc kỹ thuật

- *evidence_for* ← `KO-LIM-004`
- *evidence_for* ← `KO-RUL-002`
- *evidence_for* ← `KO-RUL-003`
- *evidence_for* ← `KO-RUL-007`

### `KO-REF-005` — Bộ kiểm toàn vẹn Knowledge System — 9 bất biến thức

- *evidence_for* ← `KO-ADR-023`

### `KO-RUL-001` — Phân quyền theo ASSIGNMENT, ⛔ không theo ROLE

- **derives_from** → `KO-DEC-006`
- *constrained_by* ← `KO-DEC-021`

### `KO-RUL-002` — ⛔ Không lưu dữ liệu TÍNH ĐƯỢC vào cơ sở dữ liệu

- **evidenced_by** → `KO-REF-004`

### `KO-RUL-003` — Xoá mềm bắt buộc — và chỉ mục duy nhất MỘT PHẦN đi kèm

- **implements** → `KO-PRN-002`
- **derives_from** → `KO-DEC-014`
- **evidenced_by** → `KO-REF-004`

### `KO-RUL-004` — request_id + unique index trên mọi bảng chứng từ lập-mới-được

- **implements** → `KO-PRN-001`

### `KO-RUL-005` — ⛔ KHÔNG viết SQL trước khi ADR được phê duyệt

- **constrains** → `KO-PEN-001`

### `KO-RUL-006` — VIEW mặc định VƯỢT MẶT RLS — A001 là bài kiểm hồi quy mọi vòng

- **implements** → `KO-PRN-002`

### `KO-RUL-007` — Chuẩn báo cáo bảy phần — câu hỏi giá trị đứng ĐẦU TIÊN

- **implements** → `KO-PRN-006`
- **derives_from** → `KO-ADR-024`
- **evidenced_by** → `KO-REF-004`

---

*Sinh bởi `scripts/build-knowledge-index.mjs`. ⛔ Đừng sửa tay.*
