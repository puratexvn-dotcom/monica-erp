# ADR-003 · REQUEST ID — CHUẨN NỀN TẢNG CHỐNG LẬP CHỨNG TỪ HAI LẦN

| | |
|---|---|
| **Trạng thái** | ⏳ **CHỜ PHÊ DUYỆT** — chưa viết một dòng SQL nào |
| **Bản** | 2 — nâng từ *"idempotency cho Assignment"* lên **chuẩn toàn nền tảng** theo Architect Addendum |
| **Migration dự kiến** | `029c_request_id.sql` (Assignment) → `033_request_id_rollout.sql` (các miền còn lại) |
| **Điều khoản đề xuất** | Điều XXXIV |
| **Liên quan** | [ADR-002](ADR-002-assignment-domain.md) · [Mutation Policy](../MUTATION_POLICY.md) · Điều XXXIII |

---

## 1. Context

`assignments.assignment_no` mang `DEFAULT public.next_assignment_no()`, và hàm đó
gọi `nextval` trên một **dãy số thật** (029 Mục 2). Hệ quả trực tiếp:

> **Hai lần `INSERT` = hai số nghiệp vụ thật, không thể thu hồi.**

`nextval` cố ý không quay lui khi giao dịch huỷ — đó là thứ giữ cho hai người bấm
"Giao việc" cùng lúc không nhận cùng một số. Nhưng nó cũng có nghĩa là mọi lần
gửi trùng đều để lại một **chứng từ ma** mà kế toán và đối tác đều nhìn thấy.

**Đo được — hôm nay hệ thống KHÔNG có cơ chế nào:**

| Đo | Kết quả |
|---|---|
| Chuỗi `idempot` trong toàn bộ mã nguồn và SQL | **0 kết quả** ngoài chú thích *"migration chạy lại được"* — khái niệm khác hẳn |
| Bảng có cột chống gửi trùng | **không có bảng nào** |
| Dãy số sinh chứng từ | `assignment_no_seq` — dãy số đầu tiên của hệ thống |

**Bốn đường dẫn tới gửi trùng, và `retry: 0` chỉ chặn được một:**

| Đường | `retry: 0` chặn được? |
|---|---|
| React Query tự thử lại khi mạng chập | ✅ đã chặn ở `providers.tsx` |
| Người dùng bấm nút hai lần (mạng xưởng chậm, chưa thấy phản hồi) | ❌ |
| Trình duyệt gửi lại sau khi mất kết nối giữa chừng | ❌ |
| Hai tab, hoặc bấm Back rồi Gửi lại | ❌ |

Ba đường sau đều **rất thật** trong xưởng: máy tính bảng dùng chung, Wi-Fi chập
chờn, và người vận hành có thói quen bấm lại khi màn hình chưa đổi.

⚠️ Nguy hiểm nhất là **lỗi im lặng**: không ngoại lệ nào được ném ra. Hệ thống
chỉ đơn giản có hai phần việc `ASG-GEN-2026-00041` và `ASG-GEN-2026-00042` giống
hệt nhau, giao cho cùng một đối tác. Đối tác báo sản lượng vào **một** trong hai,
cái còn lại nằm im trong danh sách "thiếu báo cáo" cho tới khi ai đó điều tra.

**Và vấn đề này không thuộc riêng Assignment.** Mọi chứng từ có thể lập đều đi
cùng một đường: PO · Shipment · Settlement · QA Approval · Supplier Receipt ·
Payment. Giải riêng cho Assignment là giải một phần bảy bài toán, và sáu phần
còn lại sẽ được giải sáu kiểu khác nhau.

## 2. Decision

**`request_id UUID` trở thành BẤT BIẾN NỀN TẢNG của MONICA MOS.**

Mọi bảng chứng từ nghiệp vụ **có thể lập mới** đều mang cột `request_id` kèm chỉ
mục duy nhất toàn phần. Không có ngoại lệ, và không có bảng chứng từ nào được
tạo mới mà thiếu nó.

### 2.1 Khuôn chuẩn — một hàm, dùng cho mọi bảng

```sql
CREATE OR REPLACE FUNCTION public.mos_add_request_id(p_table TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS request_id UUID', p_table);
  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_%s_request_id ON public.%I (request_id) '
    'WHERE request_id IS NOT NULL', p_table, p_table);
END $$;
```

Một hàm chứ không phải bảy đoạn `ALTER` chép tay: bảy đoạn chép tay sẽ có bảy
cách đặt tên chỉ mục, và đến bảng thứ tư sẽ có người quên mệnh đề `WHERE`.

### 2.2 Ba mảnh, cả ba đều bắt buộc

**① Cơ sở dữ liệu — nơi DUY NHẤT có bảo đảm thật**

⚠️ Chỉ mục **KHÔNG** kèm `WHERE deleted_at IS NULL`, khác mọi chỉ mục duy nhất
khác của 029. Đây không phải sơ suất mà là khác biệt về bản chất: các chỉ mục kia
canh **danh tính nghiệp vụ** (một bó chỉ thuộc một phần việc *đang hiệu lực*), còn
cái này canh **một LƯỢT YÊU CẦU**. Một yêu cầu đã xử lý thì vĩnh viễn đã xử lý —
xoá mềm bản ghi không làm cho lần gửi đó chưa từng xảy ra.

`NULL` được phép và không xung đột (Postgres coi mỗi `NULL` là khác nhau trong
chỉ mục duy nhất): dữ liệu cũ và các lệnh tạo từ phía máy chủ đều để trống.

**② Service — gửi trùng trả về THÀNH CÔNG, không phải lỗi**

```
INSERT → 23505 trên uq_<bảng>_request_id
       → đọc lại dòng đã có theo cùng request_id
       → trả { ok: true, id: <dòng cũ> }
```

⚠️ Mảnh dễ làm sai nhất. Nếu để `23505` nổi lên thì người dùng nhận *"Mã này đã
tồn tại"* cho một thao tác **thực chất đã thành công** — họ sẽ tưởng là hỏng và
bấm lại với khoá mới, tạo ra đúng bản trùng mà cả thiết kế này sinh ra để chặn.

**③ Client — khoá sinh theo PHIÊN BIỂU MẪU, không theo lần bấm**

```
mở biểu mẫu   → crypto.randomUUID()
bấm Gửi       → gửi kèm khoá đó
gửi lại       → CÙNG khoá  ⇒ máy chủ trả về chính bản ghi cũ
thành công    → sinh khoá mới cho lần lập tiếp theo
```

Sinh khoá lúc **mở biểu mẫu** chứ không phải lúc bấm — sinh lúc bấm thì mỗi lần
bấm là một khoá mới, và cột này thành đồ trang trí.

### 2.3 Lộ trình triển khai — theo GIAI ĐOẠN, và đó là bắt buộc

| Giai đoạn | Bảng | Vì sao ở giai đoạn này |
|---|---|---|
| **029c** *(ngay)* | `assignments` · `assignment_daily_reports` | **0 dòng** — thêm cột lúc bảng trống là rẻ nhất, và màn hình lập phần việc sắp dựng |
| **033** *(sau)* | `shipments` · `subcon_orders` · `qa_logs` · `capa_logs` · `subcon_receipt_logs` · `financial_records` · `orders` | có dữ liệu thật và có mã nguồn đang chạy |
| *chưa tồn tại* | `settlements` | phải có cột **ngay từ `CREATE TABLE`** |

⚠️ **Chia giai đoạn KHÔNG phải để đỡ việc.** Thêm cột vào `orders` mà chưa sửa
service của nó để bắt `23505` sẽ khiến người dùng nhận một lỗi khoá trùng thô
ngay giữa luồng nhập đơn hàng — tức là **làm hỏng một phân hệ đang chạy để phòng
một lỗi chưa xảy ra**. Cột và cách xử lý lỗi phải đi cùng nhau, từng miền một.

### 2.4 `request_id` LÀ GÌ — và nó KHÔNG phải ba thứ trông rất giống

> Mục này do Kiến trúc sư yêu cầu ghi tường minh. Nó tồn tại vì bốn khái niệm
> dưới đây đều là UUID, đều đi kèm một lượt gọi, và **rất dễ điền nhầm cái nọ
> vào chỗ cái kia** — điền nhầm thì không có lỗi nào nổ ra, chỉ có lớp bảo vệ
> biến mất trong im lặng.

```
request_id  ≠  HTTP Request ID  ≠  Trace ID  ≠  Correlation ID
```

| | **Business Mutation ID**<br>(`request_id` — CỘT NÀY) | **HTTP Request ID** | **Trace ID** | **Correlation ID** |
|---|---|---|---|---|
| **Định danh cái gì** | một **Ý ĐỊNH lập chứng từ** | một lượt HTTP | một chuỗi lời gọi xuyên dịch vụ | một tiến trình nghiệp vụ |
| **Ai sinh** | trình duyệt, lúc **MỞ BIỂU MẪU** | máy chủ / hạ tầng, mỗi lượt gọi | tầng truy vết, ở lượt gọi đầu | phía khởi tạo tiến trình |
| **Gửi lại thì sao** | ⭐ **GIỮ NGUYÊN** | **ĐỔI** | **ĐỔI** | giữ nguyên |
| **Sống ở đâu** | **một cột trong CSDL, vĩnh viễn** | nhật ký (log) | hệ thống truy vết | nhật ký / hàng đợi |
| **Mục đích** | **chống lập hai lần** | gỡ lỗi một lượt gọi | dựng lại đường đi | nối các bước rời rạc |
| **Số lượng** | 1 cho mỗi chứng từ định lập | 1 cho mỗi lượt gọi | 1 cho mỗi chuỗi | 1 cho mỗi tiến trình |

**⭐ Dòng "Gửi lại thì sao" là toàn bộ sự khác biệt.**

`request_id` có giá trị **chỉ vì nó KHÔNG đổi khi gửi lại**. Đó chính xác là
thứ ba loại ID kia không bảo đảm — và với `HTTP Request ID` cùng `Trace ID` thì
việc đổi mỗi lượt là **đúng chức năng của chúng**.

> **Phép thử một câu để biết đã điền nhầm:**
> *"Nếu người dùng bấm Gửi hai lần, hai lần đó có cùng giá trị này không?"*
> Không → **đã điền nhầm**, và bảo vệ đã mất.

**Ba lớp giảm thiểu, làm cùng migration:**

- `COMMENT ON COLUMN` ghi nguyên văn: *"Business Mutation ID — khoá chống lập
  hai lần, sinh theo PHIÊN BIỂU MẪU. KHÔNG phải HTTP Request ID, KHÔNG phải
  Trace ID, KHÔNG phải Correlation ID. Gửi lại phải GIỮ NGUYÊN giá trị."*
- tên chỉ mục `uq_<bảng>_request_id` — chữ `uq` nói rõ đây là ràng buộc duy
  nhất, không phải cột ghi nhật ký;
- phép kiểm hợp đồng: mọi `Create*DTO` phải có `requestId`; và bài kiểm sống bắn
  **hai lần cùng khoá** để chứng minh chỉ sinh một dòng — nếu ai đó thay bằng
  một ID đổi-mỗi-lượt, bài kiểm này đỏ ngay.

**Về cái tên:** giữ `request_id` theo Addendum mục 4. Không xung đột với từ khoá
PostgreSQL, PostgREST hay Supabase — đã kiểm. Rủi ro duy nhất là ngữ nghĩa, và
bảng trên chính là cách trả rủi ro đó.

## 3. Alternatives Considered

**① Bảng `idempotency_records` dùng chung** *(key, operation, result, created_at)*
— **Bác.** Nó lưu **kết quả đã tuần tự hoá**, và kết quả đó mục theo thời gian:
đổi hình dạng DTO là những bản ghi cũ trả về hình dạng cũ. Nó cũng cần công việc
dọn rác riêng, và bản thân việc ghi vào đó lại phải nguyên tử với `INSERT` chính
— tức thêm một bài toán giao dịch để giải bài toán mà **một chỉ mục duy nhất
giải xong trong một dòng**. Điều XXIX.

**② Khoá tự nhiên** *(partner + order + scope + planned_start)* — **Bác.** Hai
phần việc giống hệt nhau **là hợp lệ**: hai ca sản xuất, hai đợt hàng, hoặc giao
lại sau khi đối tác từ chối. Chặn theo khoá tự nhiên là cấm một nghiệp vụ có
thật để tránh một tai nạn.

**③ Chỉ khoá nút ở giao diện** — **Bác.** Không phải bảo đảm mà là phép lịch sự:
hai tab, nút Back, và trình duyệt gửi lại đều đi vòng qua nó. Vẫn nên làm, nhưng
**không được tính là đã giải quyết**.

**④ Làm cho cả 8 bảng trong một migration** — **Bác.** Xem 2.3: cột và cách xử
lý `23505` phải đi cùng nhau. Một migration thêm cột cho `orders` mà service
chưa biết bắt lỗi là làm hỏng phân hệ đang chạy.

**⑤ Đợi tới khi có Portal đối tác** — **Bác.** Màn hình lập phần việc dựng ngay
bây giờ; thêm cột sau khi đã có chứng từ thật thì phải xử lý cả dữ liệu cũ. Thêm
lúc bảng còn **0 dòng** là rẻ nhất.

## 4. Consequences

### Lợi ích

- Gửi trùng trở thành **bất khả thi ở tầng cơ sở dữ liệu**, không phụ thuộc vào
  giao diện cư xử đúng.
- Người dùng bấm lại vẫn nhận **thành công** và thấy đúng chứng từ đầu tiên —
  không có thông báo lỗi khó hiểu.
- Một khuôn duy nhất cho cả bảy loại chứng từ, thay vì bảy cách giải khác nhau.

### Đánh đổi

- Mọi lệnh lập chứng từ về sau **phải** nhận và truyền khoá. Quên là lặng lẽ mất
  bảo vệ — nên cần phép kiểm hợp đồng canh.
- Cột nằm lại vĩnh viễn trên mỗi dòng (16 byte). Không đáng kể.
- Service phức tạp thêm một nhánh (bắt `23505` rồi đọc lại) — mảnh dễ làm sai
  nhất, và phải có bài kiểm sống bắn thật hai lần liên tiếp.
- Giai đoạn 033 chạm vào bảy phân hệ đang chạy, mỗi phân hệ cần nghiệm thu riêng.

### Việc kéo theo — ghi để không ai quên

| Việc | Khi nào |
|---|---|
| Điều XXXIV: *mọi bảng chứng từ nghiệp vụ phải có `request_id`* | cùng 029c |
| [Mutation Policy](../MUTATION_POLICY.md) — đã soạn, chờ duyệt cùng ADR này | cùng 029c |
| `CreateAssignmentDTO` thêm `requestId: string` (**bắt buộc**, không tuỳ chọn) | cùng 029c |
| Phép kiểm hợp đồng: mọi `Create*DTO` đều có `requestId` | cùng 029c |
| Bài kiểm sống: gửi **hai lần cùng khoá** ⇒ đúng **một** dòng, cùng số nghiệp vụ | cùng 029c |
| Rà bảy bảng còn lại, mỗi bảng một lượt nghiệm thu | 033 |

## 5. Rollback Impact

**Giai đoạn 029c — hoàn tác sạch tuyệt đối.**

```sql
DROP INDEX IF EXISTS public.uq_assignments_request_id;
DROP INDEX IF EXISTS public.uq_assignment_daily_reports_request_id;
ALTER TABLE public.assignments             DROP COLUMN IF EXISTS request_id;
ALTER TABLE public.assignment_daily_reports DROP COLUMN IF EXISTS request_id;
DROP FUNCTION IF EXISTS public.mos_add_request_id(TEXT);
```

Cột chỉ thêm vào, không đổi nghĩa cột nào đang có, và cả hai bảng hiện **0 dòng**
nên không có dữ liệu nào mất. **Không cần migration bù.**

⚠️ Sau khi có chứng từ thật, gỡ cột sẽ **mất khả năng nhận diện lần gửi đã xử
lý** — những lần gửi lại về sau tạo bản trùng trở lại. Dữ liệu không mất, nhưng
lớp bảo vệ thì mất.

**Giai đoạn 033 — hoàn tác từng miền một.** Vì mỗi miền đi kèm một thay đổi ở
service, gỡ cột mà quên gỡ mã bắt `23505` sẽ để lại một nhánh xử lý lỗi chết.
Hoàn tác phải đi theo cặp *(cột, service)*, đúng chiều ngược với lúc triển khai.

## 6. Future Impact — `request_id` trở thành bất biến nền tảng

> Đây là mục Kiến trúc sư yêu cầu bổ sung (Addendum mục 5).

### 6.1 Từ một cột thành một luật

Sau ADR này, `request_id` không còn là *"giải pháp cho Assignment"* mà là **một
trong những bất biến định nghĩa MONICA MOS** — ngang hàng với *"NULL không bao
giờ nghĩa là tất cả"* và *"sổ cái chỉ ghi thêm"*.

Luật phát biểu ngắn gọn:

> **Mọi bảng chứng từ nghiệp vụ có thể lập mới đều phải có `request_id`.
> Không có ngoại lệ. Bảng mới thiếu nó là bảng chưa hoàn thành.**

### 6.2 Điều đó ràng buộc gì ở mỗi phân hệ tương lai

| Phân hệ | Chứng từ sẽ lập | Điều bắt buộc |
|---|---|---|
| **Buyer Portal** | duyệt mẫu · yêu cầu thay đổi | duyệt hai lần = hai phê duyệt trong sổ audit, và không ai biết cái nào là thật |
| **Subcon Portal** | báo cáo ngày · phiếu nhận hàng | ⚠️ **nặng nhất** — báo cáo ngày là **căn cứ thanh toán**; gửi trùng là **trả tiền hai lần** |
| **Sales** | báo giá · hợp đồng | số hợp đồng sinh từ dãy số, y hệt `assignment_no` |
| **HR** | bảng lương · quyết định | chi lương hai lần |
| **CRM** | cơ hội · hoạt động | ít nghiêm trọng, nhưng làm bẩn số liệu chuyển đổi |
| **AI** | đề xuất · lệnh tự động | ⚠️ tác nhân tự động **thử lại theo thiết kế** — đây là nơi gửi trùng xảy ra **thường xuyên nhất**, không phải hiếm |

⚠️ Dòng cuối đáng đọc kỹ. Con người bấm hai lần là tai nạn; **tác nhân AI thử
lại là hành vi bình thường của nó**. Khi Monica có tự động hoá, `request_id`
chuyển từ "lưới an toàn" thành "điều kiện hoạt động".

### 6.3 Nó đổi cách viết code từ đây trở đi

```
CREATE TABLE chứng từ mới   →  BẮT BUỘC gọi mos_add_request_id()
Create*DTO mới              →  BẮT BUỘC có trường requestId
Service tạo mới             →  BẮT BUỘC bắt 23505 và trả về dòng cũ
Biểu mẫu mới                →  BẮT BUỘC sinh khoá lúc MỞ, không lúc BẤM
```

Bốn dòng đó thuộc **Definition of Done**, không phải khuyến nghị. Chúng vào
[Mutation Policy](../MUTATION_POLICY.md) và vào checklist nghiệm thu của Điều
XXXII.

### 6.4 Thứ nó KHÔNG giải quyết — để không ai yên tâm nhầm

`request_id` chống **gửi trùng cùng một yêu cầu**. Nó **không** chống:

- **hai người dùng khác nhau** cùng lập một phần việc cho cùng một đơn — hai
  khoá khác nhau, hai chứng từ hợp lệ về mặt kỹ thuật. Đó là bài toán **khoá
  nghiệp vụ**, cần cảnh báo trùng lặp ở tầng Service, không phải cột này;
- **ghi đè đồng thời** khi hai người sửa cùng một bản ghi — đó là bài toán
  **xung đột**, và Mutation Policy giải bằng kiểm soát phiên bản;
- **thao tác lặp có chủ ý** — người dùng thật sự muốn lập hai phần việc giống
  nhau. Biểu mẫu sinh khoá mới sau mỗi lần thành công, nên việc này vẫn chạy
  bình thường, đúng như phải thế.

## 7. References

**Hiến pháp:** Điều XXVII (thay đổi CSDL là quyết định kiến trúc) · XXIX (chống
over-engineering) · XXXII (checklist nghiệm thu) · XXXIII (chính sách ADR) ·
**XXXIV** *(đề xuất — Request ID)*.

**Migration:** [029](../../supabase/migrations/029_assignment_domain.sql) Mục 2
(dãy số nghiệp vụ — gốc của vấn đề) · 029b (thu hồi xoá cứng) · **029c** ← ADR
này · 033 (triển khai các miền còn lại).

**Tài liệu:** [Mutation Policy](../MUTATION_POLICY.md) — retry · optimistic
update · xử lý xung đột · danh tính yêu cầu, cho mọi CREATE / UPDATE / DELETE.

**Mã nguồn:** `providers.tsx` (`retry: 0` — chặn được **một** trong bốn đường) ·
`use-assignment-mutations.ts` · `assignment.service.ts` (`createAssignment`).

**ADR:** [ADR-002](ADR-002-assignment-domain.md) — Assignment Domain.
