# ADR-023 — Board Knowledge System · Knowledge Object là đơn vị quản lý tri thức

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-023 |
| **Trạng thái** | ✅ **ĐÃ PHÊ DUYỆT** *(Board Directive 06/08/2026 · Status: APPROVED)* — soạn cùng ngày |
| **Người soạn** | Chief Solution Architect |
| **Thẩm quyền yêu cầu** | **Board Directive 06/08/2026** — *Architecture Board Review · Status: CHANGE REQUIRED* |
| **Hiến pháp** | Diễn giải **§43.3** *(thứ bậc)* · **§43.9** *(nguồn hiến định duy nhất)* — ⛔ **không tu chính** |
| **Phản biện độc lập** | 🔴 **⛔ KHÔNG CÓ — và Board đã duyệt mà ⛔ không có nó.** Xem §4.3 |
| **Migration** | ⛔ **không có** — thay đổi thuần quản trị tài liệu |
| **Thi hành ở** | `docs/knowledge/` · `scripts/build-knowledge-index.mjs` · `tests/governance/knowledge-objects.test.mjs` · `tests/run.mjs` · `package.json` |

---

## 1. Context

### 1.1 Chỉ thị của Board

Board rà soát 06/08/2026 chuẩn y hướng đi nhưng ra **một yêu cầu nâng cấp kiến
trúc**: Board Knowledge Base ⛔ **không** được thiết kế như một tài liệu chương
mục tuyến tính. Nó phải là một **Knowledge System**, trong đó mỗi mục tri thức là
một **Knowledge Object** có siêu dữ liệu, thuộc một trong **bảy loại**, mang **tám
trường bắt buộc**, và **nối với nhau bằng quan hệ** thay vì bằng thứ bậc tài liệu.
Markdown vẫn là định dạng lưu. Mục đích Board nêu: **quản trị sản phẩm dài hạn ·
rà soát Board nhanh · bảo tồn tri thức thiết chế**.

### 1.2 Bằng chứng đo được về vì sao tài liệu tuyến tính ⛔ không đủ `[VERIFIED]`

| Phép đo | Kết quả |
|---|---|
| Hệ đánh số đang cùng tồn tại trong kho | **12** — `DL` `BDR` `KD` `TD` `A` `B` `TC` `VR` `OQ` `SOD` `WZ` `ADR` |
| Bậc thẩm quyền *(ADR-010)* | **7** |
| Quyết định kiến trúc đã ghi | **149** `DL` |
| Board Decision đã ghi | **29** `BDR` |
| Khuyết tật đã biết **chưa sửa** | **13** `KD` |
| Mục quản trị còn chờ Board | **26** `GPR-001` |
| Tài liệu chỉ mục lớn nhất | `PROJECT_MEMORY.md` — **52 KB · 12 mục · 824 dòng** |
| Phép kiểm tự động trên **quan hệ** giữa các mục tri thức | 🔴 **0** |
| Số ADR có phản biện độc lập *(ADR-011 đòi hỏi)* | 🔴 **0** — `GPR-001` `A-2` |

Hai con số cuối là lý do thật của ADR này. Tri thức dự án hiện **⛔ không kiểm
được bằng máy ở bất kỳ chiều nào**: ⛔ không ai biết một mục trỏ tới tài liệu đã
bị đổi tên, ⛔ không ai biết một quyết định *"đã ban hành"* mà ⛔ không có người
ký, và ⛔ không ai truy được *"đổi `DL-057` thì gãy cái gì"* nếu ⛔ không đọc hết
**824 dòng** bằng mắt.

### 1.3 Một rủi ro mà chính chỉ thị tạo ra

Đọc phẳng chỉ thị sẽ dẫn tới việc chép nội dung của 12 hệ đánh số vào các
Knowledge Object. Làm vậy là dựng **bản thứ hai của mọi sự thật** — và kho **đã
trả giá cho đúng lỗi này rồi**: ADR-010 §1.2 ghi nhận hai văn bản cùng tự xưng
Hiến pháp đã khiến *"mọi phiên làm việc của mọi tác nhân khởi động bằng một tiền
đề sai, suốt hai ngày"*. Dự án cũng đã có một nguyên tắc cấm đúng việc này:
**`P-ZERODUP`**.

Vậy ADR này phải trả lời một câu mà chỉ thị chưa nói: **Knowledge Object đứng ở
bậc nào, và nó có được phép mâu thuẫn với nguồn ⛔ không?**

---

## 2. Decision

### 2.1 Dựng Knowledge System theo `docs/knowledge/SCHEMA.md`

Một đối tượng = **một tệp** `.md` mang YAML frontmatter, đặt tại
`docs/knowledge/objects/<loại>/KO-<TYPE>-<NNN>-<slug>.md`. Bảy loại đúng như
Board chỉ định: `Principle` `Decision` `Rule` `Reference` `Limitation`
`PendingDecision` `AdrReference`.

### 2.2 🔑 Knowledge Object là CHỈ MỤC — ⛔ không bao giờ là NGUỒN

> **Đối tượng mang siêu dữ liệu và quan hệ. Nó ⛔ KHÔNG mang toàn văn.**
> **Đối tượng ⟷ nguồn lệch nhau ⇒ NGUỒN THẮNG.**

Toàn bộ Knowledge System nằm ở **bậc 5 · Technical Documentation** của ADR-010.
Đây là **thiết kế**, ⛔ không phải nhượng bộ: một chỉ mục có quyền cao hơn thứ nó
chỉ mục là một bộ luật thứ tám trá hình.

Cưỡng chế bằng ba cơ chế, ⛔ không bằng lời khuyên:

| # | Cơ chế | Chặn |
|---|---|---|
| ① | Trường `tier` ghi bậc ADR-010 của **nguồn** | ⛔ không khai được nguồn ⇒ ⛔ không tạo được đối tượng |
| ② | Bất biến thức ⑥: `constrains`/`supersedes` ⇒ `tier` đích ≥ `tier` nguồn | 🔴 đối tượng **vượt quyền** nguồn |
| ③ | Bất biến thức ⑦: thân ≤ **60 dòng** + bắt buộc mục `## Nguồn đầy đủ` | 🔴 chép toàn văn ⇒ sinh bản thứ hai |

### 2.3 Tám trường Board chỉ định + hai trường lược đồ thêm

`id` `title` `category` `status` `source` `approved_by` `date` `related` — đúng
tám trường Board yêu cầu. Thêm **`type`** *(để máy phân biệt "đặt sai thư mục" với
"đánh sai tiền tố")* và **`tier`** *(để cưỡng chế §2.2)*. ⛔ Không thêm gì khác;
mỗi trường thêm là một trường sẽ mục ruỗng.

### 2.4 Số hiệu PHẢN CHIẾU, ⛔ không đặt lại

Đối tượng phản chiếu mục đã có số hiệu thì **giữ nguyên con số**: `KO-DEC-014` ↔
`BDR-14`, `KO-LIM-004` ↔ `KD-4`, `KO-ADR-023` ↔ `ADR-023`. Trường `mirrors` khai
tường minh. Đây là điều ngăn hệ thứ 13 trở thành hệ **cạnh tranh** thay vì hệ
**chỉ đường**.

### 2.5 Quan hệ là tập vị từ ĐÓNG, chỉ ghi chiều thuận

Chín vị từ ghi được *(SCHEMA §4.1)*; tám vị từ nghịch đảo **do máy sinh** ở
`INDEX.md`. Bắt người viết duy trì hai đầu của một quan hệ là bảo đảm chắc chắn
rằng có ngày chỉ một đầu được sửa.

### 2.6 Răng máy — chín bất biến thức

`tests/governance/knowledge-objects.test.mjs`, chạy trong `npm test` **và**
`npm run test:arch` *(⛔ không cần CSDL)*. Hỏng ⇒ ⛔ không commit được. Chi tiết ở
SCHEMA §5.

### 2.7 Phạm vi đợt này: bộ MẪU, ⛔ không phải bản chuyển đổi đầy đủ

**34 đối tượng** phủ đủ bảy loại, trong đó **5 Nguyên tắc là bộ ĐỦ**. Phần còn
lại — 23 `BDR` · 13 ADR · 9 `KD` · 22 mục `GPR-001` · **149 `DL`** — ghi rõ ở
`README.md` §5 và đề nghị Board giao **theo từng đợt**.

---

## 3. Alternatives Considered

| Phương án | Vì sao ⛔ không chọn |
|---|---|
| **A · Một tệp `BOARD_KNOWLEDGE_BASE.md` có chương mục** | Đây **chính là thứ Board bác**. Và nó ⛔ không kiểm được bằng máy: quan hệ nằm trong văn xuôi ⇒ ⛔ không truy vấn, ⛔ không phát hiện liên kết treo. |
| **B · Đối tượng mang TOÀN VĂN, thành nguồn mới** | Đọc phẳng chỉ thị sẽ ra phương án này. Nó sinh bản thứ hai của 149 `DL` + 29 `BDR`, vi phạm `P-ZERODUP`, và **tái lập đúng sự cố hai Hiến pháp** của ADR-010 §1.2. |
| **C · CSDL / JSON / công cụ ngoài** *(Notion · Confluence · bảng Postgres)* | Board chỉ định **Markdown vẫn là định dạng lưu**. Ngoài ra: mất `git blame`, mất phản biện qua diff, và SECURITY FREEZE *(`MOS §XI.1`)* cấm mở bảng nghiệp vụ mới. |
| **D · Nhiều đối tượng trong một tệp, phân tách bằng tiêu đề** | Rẻ hơn khi soạn, nhưng đối tượng mất đường dẫn ổn định và mất lịch sử riêng ⇒ nó ⛔ không còn là *"đơn vị quản lý chính"* như Board chỉ định. |
| **E · Chuyển đổi TOÀN BỘ 12 sổ đăng ký ngay đợt này** | ~230 đối tượng. Mỗi đối tượng cần phán đoán về `category` · `tier` · quan hệ. Làm một lượt ⇒ **quan hệ đoán mò ở quy mô lớn**, và ⛔ không ai rà nổi 230 đối tượng trong một lượt duyệt. |
| **F · Bỏ trường `tier`, tin vào kỷ luật** | ADR-010 §4.2 đã ghi một tiền lệ: kỷ luật trích dẫn **⛔ chưa có răng tự động** ⇒ thành nợ `TD-14`. ⛔ Không lặp lại. |

---

## 4. Consequences

### 4.1 Được

- **Rà soát Board nhanh** — `INDEX.md` mở đầu bằng bảng `PENDING_BOARD`, thay cho
  việc đọc 824 dòng `PROJECT_MEMORY` + 26 mục `GPR-001` bằng mắt.
- **Phân tích tác động ngược chiều** — `constrained_by` · `blocked_by` sinh tự
  động trả lời *"đổi cái này gãy cái gì"*, thứ hiện nay ⛔ không truy được.
- **Tri thức mất gốc bị bắt tại chỗ** — bất biến thức ④ đỏ ngay khi một tài liệu
  nguồn bị đổi tên. Hiện nay việc đó **im lặng**.
- **⛔ Không quyết định nào tự phong nữa** — bất biến thức ③.
- **Bảo tồn thiết chế** — `SUPERSEDED`/`REJECTED`/`CLOSED` giữ nguyên; `mirrors`
  giữ số hiệu cũ ⇒ trích dẫn lịch sử vẫn phân giải được.

### 4.2 Đánh đổi

- **Thêm một bước bảo trì**: sửa `objects/` ⇒ phải chạy `npm run knowledge`.
  Quên ⇒ phép kiểm ⑧ đỏ. Đây là ma sát **có chủ ý** *(`P-COMMIT`)*.
- **Bộ phân tích YAML tự viết**, ⛔ không dùng thư viện. Vì vậy khuôn `related`
  cố ý hẹp *(SCHEMA §4.3)*. Cái giá: cú pháp lệch ⇒ phép kiểm đỏ chứ ⛔ không tự
  sửa. Cái được: ⛔ không thêm phụ thuộc chỉ để đọc siêu dữ liệu tài liệu.
- **Bộ mẫu 31/230 đối tượng có thể bị đọc nhầm là "đã xong"**. Đối phó: `README.md`
  §5 ghi rõ từng sổ còn bao nhiêu mục.
- **Đối tượng có thể lệch nguồn** khi nguồn đổi mà đối tượng ⛔ không đổi. Máy bắt
  được *đường dẫn chết*, **⛔ không** bắt được *nội dung lệch*. Vì vậy §2.2 tuyên
  bố nguồn thắng — lệch thì đối tượng sai, ⛔ không phải nguồn sai.

### 4.3 🔴 Điều kiện thủ tục còn thiếu — **Board đã duyệt mà ⛔ KHÔNG có nó**

ADR này **⛔ chưa có phản biện độc lập** — ADR-011 §1.3 chỉ định ChatGPT. Đây là
mục `A-2` của `GPR-001`, và nó áp cho **toàn bộ** ADR trong kho, ⛔ không riêng
bản này. Tôi ghi ra thay vì im lặng, vì im lặng ở đúng chỗ này là cách thủ tục
hiến định bị đảo ngược lần trước.

> 🔴 **GHI NHẬN 06/08/2026.** Board phê duyệt ADR này **⛔ không kèm phản biện độc
> lập**. Board ở **bậc 0**, ADR-011 ở **bậc 2** ⇒ Board **có thẩm quyền** làm vậy.
> Nhưng bản chất của việc đó cần được gọi đúng tên, ⛔ không được để trôi:
>
> | | |
> |---|---|
> | **Đây là** | một **miễn trừ theo từng vụ** *(case-by-case waiver)* do bậc 0 ban |
> | **⛔ Đây KHÔNG phải** | bằng chứng rằng yêu cầu phản biện của ADR-011 đã được đáp ứng |
> | **⛔ Cũng KHÔNG phải** | tiền lệ bãi bỏ ADR-011 cho các ADR khác |
>
> `KO-PEN-002` *(0/18 ADR có phản biện)* **vẫn MỞ**, và nay **cộng thêm bản này**.
> Board cần chọn một cách minh thị: **① thi hành ADR-011** · **② tu chính ADR-011**
> · **③ khai rõ chế độ miễn trừ theo vụ**. Im lặng là mặc định chọn ③ mà ⛔ không
> ai ghi — và đó chính là cơ chế đã sinh ra `KO-PEN-001`.

### 4.4 Technical Debt phát sinh

| Mã | Nội dung |
|---|---|
| **TD-KS1** | ~199 mục tri thức **chưa** thành đối tượng — chủ yếu 149 `DL`. Cần Board giao theo đợt. |
| **TD-KS2** | ⛔ Chưa có phép kiểm *"đối tượng lệch nội dung so với nguồn"*. Máy chỉ bắt được đường dẫn chết. |
| **TD-KS3** | `PROJECT_MEMORY.md` và Knowledge System cùng ở bậc 5, cùng mô tả một số mục ⇒ phải đồng bộ **bằng tay**. Về lâu dài nên để `PROJECT_MEMORY` §5–§9 **trỏ vào** đối tượng thay vì lặp lại. |

---

## 5. Rollback Impact

Quay lui = **xoá thư mục `docs/knowledge/`**, xoá một script, xoá một tệp kiểm, gỡ
**một dòng** khỏi `tests/run.mjs` và **một dòng** khỏi `package.json`.

- ⛔ **Không migration · ⛔ không đụng lược đồ CSDL · ⛔ không đụng mã ứng dụng ·
  ⛔ không đụng RLS.**
- 🔑 **⛔ Không mất tri thức nào** — mọi nội dung trong đối tượng đều là con trỏ
  tới nguồn bậc 0–4 vẫn còn nguyên. Đây là hệ quả trực tiếp của §2.2, và là phép
  thử tôi tự đặt cho thiết kế: **một lớp quản trị mới ⛔ không được trở thành một
  điểm hỏng đơn lẻ mới.**

Chi phí quay lui gần bằng **không**.

---

## 6. References

- **Board Directive 06/08/2026** — *Architecture Board Review · CHANGE REQUIRED*
- [`docs/knowledge/README.md`](../knowledge/README.md) — hiến chương
- [`docs/knowledge/SCHEMA.md`](../knowledge/SCHEMA.md) — lược đồ chuẩn tắc · 9 bất biến thức
- [ADR-010](ADR-010-thu-bac-van-ban-chuan-tac.md) — thứ bậc 7 bậc · §1.2 sự cố hai Hiến pháp · §2.4 kỷ luật trích dẫn
- [ADR-011](ADR-011-tham-quyen-kien-truc.md) — phản biện độc lập bắt buộc *(§4.3 trên)*
- Hiến pháp [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) **§43.3 · §43.9** · Điều 42 *(tu chính)* · §37.5 *(⛔ không tái dùng số)*
- [`docs/PROJECT_MEMORY.md`](../PROJECT_MEMORY.md) §3 *(5 nguyên tắc)* · §5 *(149 `DL`)* · §6 *(29 `BDR`)* · §8 *(13 `KD`)*
- [`docs/audit/GOVERNANCE_PENDING_REPORT.md`](../audit/GOVERNANCE_PENDING_REPORT.md) `GPR-001` — 26 mục chờ · `A-2` ⛔ không có phản biện
- [`docs/architecture/NEEDS_CLARIFICATION.md`](../architecture/NEEDS_CLARIFICATION.md) — đường xử lý `conflicts_with`
