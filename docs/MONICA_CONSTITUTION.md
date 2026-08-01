# MONICA MOS CONSTITUTION
## THE SUPREME ARCHITECTURE LAW · VERSION vFinal (Enterprise Grade)

> Ban hành 01/08/2026 · thay thế bản 1.0 gồm 34 điều.
> Bản cũ **không bị xoá** — toàn văn ở [ENGINEERING_PLAYBOOK.md](ENGINEERING_PLAYBOOK.md).
>
> Claude Code phải đọc tài liệu này **trước khi sinh bất kỳ dòng code nào**.
> Nếu bất kỳ yêu cầu nào mâu thuẫn với tài liệu này, phải **dừng lại và giải
> thích** thay vì tự ý sửa kiến trúc.

Tài liệu này là bộ luật tối cao của MONICA MOS. Toàn bộ thiết kế Domain,
Database, Service, API, UI và RLS **đều phải tuân thủ tuyệt đối** 12 nguyên tắc
dưới đây.

**Không có ngoại lệ. Không thoả hiệp vì tốc độ.**

---

## I. DOMAIN FIRST CONSTITUTION

MONICA MOS là một **Manufacturing Operating System (MOS)**, KHÔNG PHẢI CRUD ERP.

- Mọi thay đổi phải đi theo luồng:
  `Business Requirement → Domain Model → Architecture Review → ADR → Migration → Code → UI → Testing`
- **TUYỆT ĐỐI KHÔNG** viết SQL/UI khi Domain chưa chốt.
- **TUYỆT ĐỐI KHÔNG** đặt Business Logic trong UI.
- Nếu Domain chưa rõ, **BẮT BUỘC phải dừng lại và hỏi.** Không được tự suy đoán
  nghiệp vụ.

## II. MANUFACTURING FIRST CONSTITUTION

Hệ thống được thiết kế cho mô hình **Hybrid Manufacturing**:

- Mặc định Monica có chuyền may nội bộ (là chuẩn mực đo lường năng lực).
- Nhưng **Subcontractors (Subcons) mới là năng lực sản xuất chính.** Mọi Domain
  phải ưu tiên khả năng điều phối đa nhà thầu. **Cấm** thiết kế theo tư duy nhà
  máy đơn lẻ.
- `PO` là cam kết thương mại. **`Assignment` (Giao việc) là đơn vị điều phối và
  thực thi cốt lõi.** Mọi phân hệ (QA, Production, Shipment, Settlement) phải
  liên kết với Assignment.

## III. SOURCE OF TRUTH CONSTITUTION

Mỗi Business Capability chỉ có **MỘT Source of Truth (Nguồn Sự thật Độc tôn)**.

- Ví dụ: `PO` → Đơn hàng · `Assignment` → Công việc · `Production Report` → Sản lượng.
- **TUYỆT ĐỐI KHÔNG** lưu trùng lặp một sự thật ở nhiều bảng.
- **Không lưu dữ liệu có thể tính toán được.** Nếu cần tổng hợp, **BẮT BUỘC**
  dùng SQL View, Materialized View hoặc Service.

### III.1 — MIGRATION KHÔNG ĐƯỢC TỰ SUY DIỄN DỮ LIỆU NGHIỆP VỤ *(ban hành 01/08/2026)*

> **Migration không được tự suy diễn dữ liệu nghiệp vụ. Khi không chắc chắn,
> giữ `NULL` còn tốt hơn ghi sai dữ liệu.** — Kiến trúc sư trưởng

`NULL` là một **phát biểu trung thực**: "chưa ai xác định". Một giá trị đoán mò
là một **phát biểu sai** — và tệ hơn `NULL` ở chỗ nó **không còn phân biệt được
với sự thật**. Sau đó không ai biết dòng nào do người xác nhận, dòng nào do một
câu `UPDATE ... WHERE` suy ra.

**Ca điển hình đã gặp:** ba đơn hàng lịch sử có `orders.customer_id IS NULL`
trong khi `customer_name` là chuỗi tự do (`'ZIBUYU'`, `'Adidas Global'`).
Khớp chuỗi rồi gán `customer_id` **nghe rất hợp lý** — và đó chính là chỗ nguy
hiểm: `'ZIBUYU'` khớp được, nhưng `'Adidas Global'` và `'Uniqlo Casual'` không
có khách hàng tương ứng, và không ai biết chúng là khách thật hay tên nháp.
Migration mà đoán thì gắn dữ liệu tài chính vào sai pháp nhân.

**Ba hệ quả bắt buộc:**

1. Migration chỉ được **thêm cột / đổi kiểu / thêm ràng buộc**. Việc **điền
   nội dung nghiệp vụ** cho dòng lịch sử là của **con người**, qua giao diện,
   **có Audit Trail**.
2. Dữ liệu chưa xác định thì **giữ `NULL`**, và phần mềm phải **chạy đúng** khi
   gặp `NULL` — không sập, không im lặng hiển thị sai.
3. Ràng buộc `NOT NULL` cho dữ liệu **mới** không được áp ngược lên dữ liệu
   **cũ**. Dùng ràng buộc theo mốc thời gian, không dùng lệnh vá hàng loạt.

Chiến lược đối soát chi tiết: **ADR-007 · Data Reconciliation**.

## IV. ARCHITECTURE DECISION RECORD (ADR)

Mọi thay đổi Domain/Architecture **BẮT BUỘC** phải có ADR, gồm 6 phần:
**Context · Decision · Alternatives · Consequences · Rollback Impact · References**.

- **ADR là BẤT BIẾN.** Không bao giờ được sửa hay ghi đè ADR cũ. Quyết định thay
  đổi phải viết **ADR mới**.
- Không viết SQL trước khi ADR được xác nhận.

## V. TESTING CONSTITUTION

Tuyệt đối không một bài kiểm thử nào được phép dùng lệnh `UPDATE`, `DELETE`,
`INSERT` trực tiếp lên **dữ liệu nghiệp vụ thật**.

- Kiểm thử phá huỷ **BẮT BUỘC** phải tạo dữ liệu tạm → Test → Rollback/Xoá.
- Snapshot chỉ là **lớp phòng vệ cuối cùng**, không phải chiến lược kiểm thử.

### V.1 — KHÔNG ĐƯỢC AUDIT BẰNG BẢNG RỖNG *(bổ sung 01/08/2026)*

> **Audit chỉ có giá trị khi có dữ liệu thật, hoặc có seed chuẩn. Không được
> kết luận `PASS` chỉ vì `0 dòng`.** — Kiến trúc sư trưởng

Trên một bảng rỗng, hai câu trả lời hoàn toàn khác nhau trông giống hệt nhau:

| thấy | có thể nghĩa là | hoặc nghĩa là |
|---|---|---|
| `0 dòng` | ✅ RLS đang chặn đúng | ⛔ chẳng có gì để mà thấy |

Bài đo không phân biệt được hai thứ đó thì **không đo được gì**. Ghi `⚪ không
kết luận được`, không được ghi `✅`.

Ba lần đã dính đúng lỗi này:

| Lần | Đã báo | Sự thật |
|---|---|---|
| Ma trận bảo mật v1 | "nhà thầu bị chặn 5/5 bảng" | cả 5 bảng đều rỗng — chưa đo gì |
| Buyer, Bước 1 của 031 | "Buyer thấy 0 ở mọi bảng" | tài khoản chưa nối `buyer_accounts` |
| Soi 11 view | — | 6/11 view rỗng, phép đo hành vi vô hiệu |

**Hệ quả bắt buộc:** trước mỗi đợt Audit, chạy dữ liệu nền
[`supabase/seeds/S001_business_baseline.sql`](../supabase/seeds/S001_business_baseline.sql).
Bảng nào vẫn rỗng sau khi gieo thì phải được **liệt kê tên trong báo cáo**,
kèm chữ "chưa đo được" — không được im lặng cho qua.

### V.2 — HỎI CÂU VỀ CẤU HÌNH BẰNG CÁCH ĐỌC CẤU HÌNH *(bổ sung 01/08/2026)*

Chi tiết ở [Điều XXXI phụ lục A](ENGINEERING_PLAYBOOK.md) của Playbook. Tóm tắt:

- **K-1** · Bảng chỉ-ghi-thêm kiểm bằng **lược đồ** (`pg_trigger`), không bằng
  ghi thử — ghi thử rồi không xoá được là **cửa một chiều**.
- **K-2** · Không đo quyền **GHI** bằng cách **GHI**. Đọc `pg_policies`, hoặc
  chạy trong giao dịch kết thúc bằng `ROLLBACK`.

## VI. ENGINEERING CONSTITUTION

Mọi Migration chỉ được Commit khi vượt qua bộ kiểm duyệt **12 bước**:

```
ADR → Architecture Review → Migration Design → Impact Analysis
    → Regression → Performance → Security → Snapshot
    → Live Verification → Rollback Strategy
    → Constitution Compliance → Final Self Review
```

## VII. ARCHITECT RESPONSIBILITY

Thứ tự ưu tiên tối thượng của mọi dòng code:

1. **Tính đúng của Domain**
2. **Tính toàn vẹn dữ liệu**
3. **Khả năng mở rộng**
4. **Khả năng bảo trì dài hạn**

**TUYỆT ĐỐI KHÔNG** tối ưu số dòng code hay tốc độ thực thi nếu điều đó làm sai
lệch bản chất Domain.

## VIII. BUSINESS EVENT & AUDIT CONSTITUTION

Lịch sử hệ thống là **mạch máu** để vận hành Traceability, Timeline, AI và
Analytics.

- **Event Stream:** hệ thống ưu tiên lưu trữ luồng sự kiện
  (`Assignment Created` → `Bundle Issued` → `QA Failed`). Không chỉ lưu log để
  đối phó kiểm toán.
- **Soft Delete: TUYỆT ĐỐI KHÔNG** dùng Hard-Delete (`DELETE`) với dữ liệu
  nghiệp vụ. Bắt buộc dùng `deleted_at`, `deleted_by`.
- **Bất biến chứng từ:** các chứng từ đã *Đóng/Duyệt* **không được phép**
  `UPDATE`. Nếu sai, phải tạo **chứng từ Điều chỉnh** (Adjustment / Debit /
  Credit Note).

## IX. GLOBALIZATION CONSTITUTION

Chuẩn hoá dữ liệu cho nền tảng đa quốc gia:

- **Ngôn ngữ:** Database **CHỈ** lưu Business Code (`APPROVED`, `IN_TRANSIT`).
  Frontend chịu trách nhiệm dịch thuật. **Không lưu text đa ngôn ngữ trong DB.**
- **Thời gian:** Database lưu chuẩn `TIMESTAMPTZ` (UTC). Việc convert múi giờ
  chỉ diễn ra ở Frontend.
- **Tiền tệ & Đơn vị:** mọi con số phải có **Đơn vị** (`100 PCS`, `50 KG`) và
  **Tiền tệ** (`USD`, `VND`). **KHÔNG BAO GIỜ** lưu con số trần trụi.
- **Định dạng số:** Database chỉ lưu số Decimal. Việc format hiển thị
  (`1,000.50` hay `1.000,50`) thuộc về Frontend.

## X. PERFORMANCE & RESILIENCE CONSTITUTION

- **Chống N+1:** nghiêm cấm thiết kế ORM/API sinh ra lỗi N+1 Query.
- **Performance Budget:** SLA hiệu năng định nghĩa theo Business Capability —
  CRUD `< 300ms` · Dashboard `< 1s` · Analytics `< 3s` · tính toán nặng phải
  chạy Background Async.
- **Graceful Degradation:** hệ thống phải suy thoái nhẹ. Dịch vụ gọi thời tiết
  chết thì Shipment vẫn phải chạy bình thường.

## XI. EVOLUTION CONSTITUTION

Không một thiết kế nào được khoá cứng tương lai. Mọi Domain Model đều phải có
khả năng tiến hoá.

- Ưu tiên: `Backward Compatible` → `Forward Compatible` → `Extensible`.
- Mọi **Breaking Change** **BẮT BUỘC** phải có: ADR + Migration Plan +
  Rollback Plan.

## XII. BUSINESS CONTINUITY CONSTITUTION (FAILURE ISOLATION)

Hệ thống thiết kế theo tư duy **Modular Monolith**. Sự cố phải được cô lập.

- Nếu một Module sập, **TOÀN HỆ THỐNG KHÔNG ĐƯỢC SẬP THEO.**
- Module QA lỗi/down → Warehouse vẫn nhập kho bình thường, Shipment vẫn xuất
  hàng bình thường.
- Giao tiếp giữa các module phải **an toàn và lỏng lẻo** (loosely coupled).

---

# ĐIỀU KHOẢN THI HÀNH

## A. Thứ bậc tài liệu

| Tài liệu | Vai trò | Khi mâu thuẫn |
|---|---|---|
| **MONICA_CONSTITUTION.md** *(tệp này)* | 12 nguyên tắc tối cao | **luôn thắng** |
| [ENGINEERING_PLAYBOOK.md](ENGINEERING_PLAYBOOK.md) | 34 quy tắc kỹ thuật chi tiết | phải sửa theo Hiến pháp |
| [DOMAIN_GLOSSARY.md](DOMAIN_GLOSSARY.md) | từ vựng nghiệp vụ | bổ sung, không ghi đè |
| [docs/adr/](adr/) | quyết định kiến trúc, **bất biến** | bổ sung, không ghi đè |

⚠️ **Hai tài liệu cùng dùng số La Mã I–XII.** Khi trích dẫn **phải nói rõ nguồn**:

```
"Hiến pháp Điều IX"   → Globalization
"Playbook Điều IX"    → Event Driven
```

## B. Nợ tuân thủ đã ghi nhận — điều khoản chuyển tiếp

Hiến pháp vFinal ban hành **sau** khi Phase 029 đã commit (`89e45fb`). Rà soát
mã đang chạy phát hiện **hai vi phạm thật**. Ghi ở đây để không ai tưởng hệ
thống đã tuân thủ toàn phần.

### B.1 — ✅ ĐÃ ĐÓNG · Điều IX · text đa ngôn ngữ trong Database

```
contract_types.name_vi · name_en     (migration 029)
defect_catalog.name_vi · name_en     (migration 023)
```

Điều IX nói rõ: *"Database CHỈ lưu Business Code. Không lưu text đa ngôn ngữ
trong DB."* Hai bảng trên lưu **cả bản dịch**.

⚠️ Cả hai là **danh mục do nghiệp vụ tự khai qua giao diện** — **User-Defined
Master Data (UDMD)**, một hạng dữ liệu riêng, không phải System Enum. Frontend
**không thể** dịch một mã lỗi mà người vận hành sẽ tạo ra ngày mai.

→ **Đã giải** — [ADR-005](adr/ADR-005-udmd-i18n-and-soft-delete.md), migration
`035a` → `035b` → `035c`:

- Một cột **`name_translations JSONB`** thay hai cột cứng. Thêm ngôn ngữ thứ tư
  **không cần migration** (Điều XI · Forward Compatible).
- Triển khai **Expand → Migrate → Contract**, vì `quality.service.ts` thuộc phân
  hệ đang chạy thật — cột và mã đọc cột phải đi cùng nhau.
- Chuỗi dự phòng `phiên → vi → en → khoá đầu có chữ → chính code` **không bao
  giờ trả ô trống** (Playbook Điều XX).
- Trigger **chuẩn hoá** gỡ khoá rỗng, vì PostgreSQL cấm subquery trong `CHECK`.

**Nghiệm thu:** 20/20 mã lỗi di trú không lệch một dòng · `live-023` toàn đạt.

### B.2 — ✅ ĐÃ ĐÓNG · Điều VIII · không có đường xoá mềm

```
assignment_commercial_terms          thiếu deleted_at / deleted_by
```

Migration 029b đã **thu hồi quyền `DELETE`** khỏi mọi vai trò. Cộng lại: một
dòng điều khoản thương mại ghi sai **không có đường nào để gỡ** — không xoá cứng
được, cũng không xoá mềm được.

→ **Đã giải** — migration `036` + `036b`:

- `deleted_at` · `deleted_by`, kèm **chỉ mục duy nhất MỘT PHẦN**
  (`WHERE deleted_at IS NULL`). Giữ chỉ mục toàn phần thì ngõ cụt chỉ **đổi
  chỗ**: xoá mềm xong vẫn không lập được điều khoản mới.
- **Split Policy** giữ Defense-in-Depth: `SELECT` lọc `deleted_at` · `UPDATE`
  **không** lọc (giữ đường khôi phục) · `DELETE` không policy.
- ⚠️ **Split Policy va chạm với PostgREST.** PostgREST bọc mọi `PATCH` trong CTE
  có `RETURNING` **bất kể header `Prefer`**, nên policy `SELECT` được áp lên
  **dòng MỚI** — mà dòng vừa xoá mềm theo định nghĩa không còn thoả
  `deleted_at IS NULL`. Đo được: chỉ `deleted_at` bị chặn; `rate`, `note`,
  `deleted_by` đều đi qua.
- → Xoá mềm và khôi phục đi qua hàm **`SECURITY DEFINER`** (`036b`). Đổi lại
  được một thứ tốt hơn: xoá mềm thành **thao tác có tên**, không phải một lần
  ghi cột thô.

**Nghiệm thu:** `live-035c-036` 23/23, kể cả phép thử *"`UPDATE` thẳng
`deleted_at` VẪN bị chặn"* — canh cho Defense-in-Depth không bị gỡ về sau.

✅ **KHÔNG phải vi phạm** — hai bảng sau cố ý không có `deleted_at`:

- `assignment_daily_reports` — sổ cái **chỉ ghi thêm**; sửa bằng bản đính chính
  qua `parent_report_id`. Đây chính là *"chứng từ Điều chỉnh"* mà Điều VIII đòi,
  và nó **mạnh hơn** xoá mềm.
- `contract_types` — danh mục tra cứu, dùng `is_active` để ngừng sử dụng.

### B.3 — Cần theo dõi, chưa kết luận

| Mục | Trạng thái |
|---|---|
| **Điều IX · đơn vị đo** | `assignment_daily_reports.output_qty` không có cột đơn vị riêng, kế thừa `uom` của Assignment cha. Trong phạm vi một aggregate là chấp nhận được — nhưng cần chốt. |
| **Điều X · Performance Budget** | Đo được: mọi truy vấn **177–228 ms**, trong ngưỡng CRUD < 300 ms. Nhưng riêng vòng mạng tới Supabase đã ~180 ms — biên còn lại rất mỏng, và bảng hiện gần như rỗng. |
| **Điều XI · ADR-004** | ✅ đã phê duyệt · ⏳ migration `034`. **Chặn `031`** cho tới khi xong. |
| `DOMAIN_GLOSSARY.md` | ✅ đã dựng — phạm vi ba trụ cột. Mở rộng sang Kho · Kế toán · Cắt · Hoàn thành khi tới lượt. |

> **B.1 và B.2 ĐÃ ĐÓNG** — ADR-005 phê duyệt 01/08/2026; migration 035a·b·c ·
> 036 · 036b đã chạy và nghiệm thu.
>
> ⚠️ **Còn lại một chốt chặn:** [ADR-004](adr/ADR-004-concurrency-control.md)
> (đã phê duyệt) — migration `034` **phải chạy trước `031`**. Cho tới lúc đó,
> Last-Write-Wins vẫn đang hiệu lực và **Portal đối tác KHÔNG được mở quyền
> GHI**.

---

*Bất kỳ quy tắc kỹ thuật chi tiết nào khác được quy định tại*
*[DOMAIN_GLOSSARY.md](DOMAIN_GLOSSARY.md) và* [*ENGINEERING_PLAYBOOK.md*](ENGINEERING_PLAYBOOK.md)*.*
