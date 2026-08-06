# KNOWLEDGE OBJECT SCHEMA — lược đồ chuẩn tắc

| Trường | Giá trị |
|---|---|
| **Bậc ADR-010** | **5 · Technical Documentation** — xem [`README.md`](README.md) §2 để hiểu vì sao **bậc 5 là bậc ĐÚNG**, không phải bậc thấp |
| **Thẩm quyền** | Board Directive 06/08/2026 · [ADR-023](../adr/ADR-023-board-knowledge-system.md) |
| **Trạng thái** | ✅ **CÓ HIỆU LỰC** — ADR-023 đã được Board phê duyệt 06/08/2026 |
| **Răng cưỡng chế** | [`tests/governance/knowledge-objects.test.mjs`](../../tests/governance/knowledge-objects.test.mjs) — chạy trong `npm test` và `npm run test:arch` |

> **Tài liệu này là LƯỢC ĐỒ, không phải tri thức.** Nó nói *một Knowledge Object
> hợp lệ trông thế nào*. Tri thức nằm trong `objects/`, và **nguồn** của tri thức
> nằm ở bậc 0–4 — ⛔ không nằm ở đây.

---

## §1 · MỘT ĐỐI TƯỢNG = MỘT TỆP

```
docs/knowledge/objects/<loai>/KO-<TYPE>-<NNN>-<slug-khong-dau>.md
```

Đây ⛔ **không** phải quy ước thẩm mỹ. Board chỉ định *"Knowledge Object là đơn vị
quản lý chính"*. Một đối tượng chỉ **là** đơn vị quản lý khi nó có:

- một đường dẫn ổn định để trích dẫn,
- một lịch sử `git blame` của riêng nó,
- một khối siêu dữ liệu máy đọc được để kiểm.

Gom nhiều đối tượng vào một tệp làm mất cả ba. **⛔ Không gom.**

### 1.1 Bảy loại và thư mục tương ứng

| Loại (Board chỉ định) | `type` | Tiền tố `id` | Thư mục |
|---|---|---|---|
| Principle | `Principle` | `KO-PRN` | `objects/principle/` |
| Decision | `Decision` | `KO-DEC` | `objects/decision/` |
| Rule | `Rule` | `KO-RUL` | `objects/rule/` |
| Reference | `Reference` | `KO-REF` | `objects/reference/` |
| Limitation | `Limitation` | `KO-LIM` | `objects/limitation/` |
| Pending Decision | `PendingDecision` | `KO-PEN` | `objects/pending/` |
| ADR Reference | `AdrReference` | `KO-ADR` | `objects/adr/` |

### 1.2 🔑 Luật số hiệu PHẢN CHIẾU

Kho đã có **12 hệ đánh số** đang chạy (`DL-` `BDR-` `KD-` `TD-` `A-` `B-` `TC-`
`VR-` `OQ-` `SOD-` `WZ-` `ADR-`). Đặt thêm một hệ thứ 13 **không phản chiếu** hệ
cũ là cách chắc chắn nhất để sinh ra bản thứ hai của sự thật.

> **Đối tượng phản chiếu một mục đã có số hiệu ⇒ GIỮ NGUYÊN con số đó ở đoạn cuối.**

| Đối tượng | Phản chiếu | Khai ở `mirrors` |
|---|---|---|
| `KO-DEC-014` | `BDR-14` — Audit Log bất biến | `BDR-14` |
| `KO-LIM-004` | `KD-4` — `md-client.tsx` 886/900 dòng | `KD-4` |
| `KO-ADR-023` | `ADR-023` | `ADR-023` |

Đối tượng **không** phản chiếu mục nào thì đánh số tuần tự trong loại của nó và
để `mirrors: —`. **⛔ Không tái sử dụng số** đã cấp, kể cả khi đối tượng bị
`SUPERSEDED` (Hiến pháp §37.5).

---

## §2 · KHỐI SIÊU DỮ LIỆU — YAML frontmatter

Tệp **bắt buộc** mở đầu bằng `---` ở dòng 1.

```yaml
---
id: KO-DEC-014
type: Decision
title: Audit Log là bằng chứng pháp lý — BẤT BIẾN
category: Governance · Data Integrity
status: ADOPTED
source: docs/PROJECT_MEMORY.md · Board Decision 02/08/2026
approved_by: Board
date: 2026-08-02
tier: 0
mirrors: BDR-14
related:
  - grounds: KO-PRN-003
  - constrains: KO-RUL-003
---
```

### 2.1 Mười trường — tám do Board chỉ định, hai do lược đồ thêm

| Trường | Bắt buộc | Board chỉ định | Ràng buộc máy kiểm |
|---|---|---|---|
| `id` | ✅ | **ID** | khớp khuôn `KO-(PRN\|DEC\|RUL\|REF\|LIM\|PEN\|ADR)-\d{3}` · khớp tên tệp · **duy nhất toàn kho** |
| `title` | ✅ | **Title** | ⛔ không rỗng · tiếng Việt |
| `category` | ✅ | **Category** | ⛔ không rỗng · phân cách bằng ` · ` |
| `status` | ✅ | **Status** | ∈ enum §3 · **hợp lệ cho `type`** |
| `source` | ✅ | **Source** | mỗi phần tử là **đường dẫn tệp có thật trong kho** hoặc literal bắt đầu bằng `Board ` |
| `approved_by` | ✅ | **Approved By** | ∈ `Board` · `CSA` · `Chưa có` · liên kết §3.2 với `status` |
| `date` | ✅ | **Date** | ISO `YYYY-MM-DD` · nghĩa chính xác ở §2.2 |
| `related` | ✅ | **Related Objects** | vị từ ∈ §4 · đích **tồn tại** · ⛔ không tự trỏ · ⛔ không trùng cặp |
| `type` | ✅ | *(lược đồ thêm)* | ∈ 7 loại · **khớp tiền tố `id` và thư mục** |
| `tier` | ✅ | *(lược đồ thêm)* | ∈ `0` `0'` `1` `2` `2'` `3` `4` `5` `6` — **bậc ADR-010 của NGUỒN** |
| `mirrors` | ⬜ | — | số hiệu ở hệ cũ, hoặc `—` |

**Vì sao thêm `type`:** Board định nghĩa bảy loại. Loại nào đọc được bằng mắt qua
`id` thì cũng phải đọc được bằng máy qua một trường — nếu không, phép kiểm ⛔ không
phân biệt nổi *"đặt sai thư mục"* với *"đánh sai tiền tố"*.

**🔑 Vì sao thêm `tier` — đây là trường quan trọng nhất của lược đồ:**

> `tier` ⛔ **không** phải bậc của đối tượng. Nó là **bậc của NGUỒN mà đối tượng
> trỏ tới**. Bản thân mọi Knowledge Object đều nằm ở **bậc 5**.

Nó tồn tại để cưỡng chế **bất biến thức nền** ở §5: một đối tượng **⛔ không bao
giờ được vượt quyền nguồn của nó**. ⛔ Không có trường này, Knowledge System sẽ
trở thành bộ luật thứ tám sau vài tháng — đúng cái bệnh mà ADR-010 vừa chữa xong
cho *hai* bộ Hiến pháp.

### 2.2 🔒 `date` nghĩa là gì — và điều gì ⛔ TUYỆT ĐỐI không được làm với nó

> `date` = **ngày ghi nhận TRẠNG THÁI HIỆN TẠI của đối tượng**, ⛔ không phải
> ngày sự kiện nghiệp vụ.

| Tình huống | `date` ghi gì |
|---|---|
| Nguồn **có** ghi ngày ban hành *(vd ADR-010: Board 04/08/2026)* | **ngày của nguồn** — bắt buộc trùng |
| Nguồn **⛔ không** ghi ngày *(vd phần lớn `BDR`)* | ngày **ghi nhận vào Knowledge System** — **và thân đối tượng phải nói rõ điều đó** ở mục `## Nguồn đầy đủ` |

🔴 **⛔ TUYỆT ĐỐI không suy diễn một ngày mà nguồn ⛔ không ghi.** Một ngày bịa
trông y hệt một ngày thật, và nó sẽ được trích dẫn như thật. Đây là áp dụng trực
tiếp của quy tắc dự án *"`NULL` là phát biểu trung thực — migration ⛔ không được
suy diễn dữ liệu nghiệp vụ"* lên tài liệu quản trị.

⚠️ Phát hiện lúc gieo bộ mẫu: **sổ đăng ký 29 `BDR` ⛔ không ghi ngày ban hành cho
từng quyết định.** Vì vậy các đối tượng `KO-DEC-*` khai `date` là ngày ghi nhận,
kèm cảnh báo trong thân. Đây là **khuyết tật của nguồn** mà lược đồ này làm lộ
ra, ⛔ không phải khuyết tật của lược đồ.

---

## §3 · TRẠNG THÁI

| `status` | Nghĩa |
|---|---|
| `ADOPTED` | Đã ban hành · **có hiệu lực** |
| `PROPOSED` | Đã soạn · **chưa trình** Board |
| `UNDER_REVIEW` | Đang phản biện độc lập — ADR-011 §1.3 |
| `PENDING_BOARD` | 🔴 **Đã trình · chờ Board phán quyết** |
| `OPEN` | *(Limitation)* khuyết tật **còn mở**, chưa sửa |
| `ACCEPTED` | *(Limitation)* giới hạn **được chấp nhận có chủ ý** — có tên, có lý do |
| `CLOSED` | Đã đóng · giữ lại làm dấu vết |
| `SUPERSEDED` | Bị đối tượng khác thay thế — **⛔ không xoá** |
| `REJECTED` | Board đã bác |

### 3.1 Trạng thái hợp lệ theo loại

| Loại | Trạng thái được phép |
|---|---|
| Principle · Decision · Rule | `PROPOSED` `UNDER_REVIEW` `PENDING_BOARD` `ADOPTED` `SUPERSEDED` `REJECTED` |
| Reference | `ADOPTED` `SUPERSEDED` |
| Limitation | `OPEN` `ACCEPTED` `CLOSED` |
| Pending Decision | `PENDING_BOARD` `UNDER_REVIEW` `CLOSED` `REJECTED` |
| ADR Reference | `PROPOSED` `UNDER_REVIEW` `PENDING_BOARD` `ADOPTED` `SUPERSEDED` `REJECTED` |

### 3.2 🔒 Liên kết `status` ⟷ `approved_by` — hai răng chống tự phong

| Luật | Vì sao |
|---|---|
| `status: ADOPTED` ⇒ `approved_by` ⛔ **không được** là `Chưa có` | Một tri thức tự tuyên bố *"đã ban hành"* mà ⛔ không ai ký là cách quyết định nháp lẻn vào nền |
| `status: PENDING_BOARD` ⇒ `approved_by` **phải** là `Chưa có` | Ngược lại: một mục *"chờ Board"* mà đã ghi `approved_by: Board` là mâu thuẫn tự thân, và nó **che mất** một mục đang chờ |

Hai luật này là toàn bộ lý do trường `approved_by` đáng có mặt. ⛔ Không có
chúng, nó chỉ là một dòng chữ trang trí.

---

## §4 · QUAN HỆ — TẬP VỊ TỪ ĐÓNG

Board chỉ định: *"tri thức phải nối bằng quan hệ, ⛔ không dựa vào thứ bậc tài
liệu"*. Quan hệ chỉ dùng được khi nó là **tập đóng** — mỗi người viết tự nghĩ ra
một vị từ mới thì đồ thị ⛔ không truy vấn được.

### 4.1 Chín vị từ được phép ghi

| Vị từ | Đọc là | Dùng khi |
|---|---|---|
| `derives_from` | *bắt nguồn từ* | đối tượng là hệ quả của một tri thức cao hơn |
| `implements` | *thi hành* | Rule thi hành một Principle/Decision |
| `constrains` | *ràng buộc* | đối tượng giới hạn phạm vi của đối tượng khác |
| `depends_on` | *phụ thuộc* | ⛔ không có đối tượng kia thì đối tượng này vô nghĩa |
| `supersedes` | *thay thế* | đối tượng mới thay đối tượng cũ *(cũ ⇒ `SUPERSEDED`)* |
| `blocks` | *chặn* | mục còn mở đang chặn một việc khác |
| `evidenced_by` | *có bằng chứng ở* | trỏ tới phép kiểm · audit · phép đo |
| `conflicts_with` | 🔴 *mâu thuẫn với* | **đối xứng** · buộc ghi vào `NEEDS_CLARIFICATION.md` |
| `refines` | *làm mịn* | nói chi tiết hơn cùng một điều |

### 4.2 🔑 Chỉ ghi CHIỀU THUẬN — nghịch đảo do máy sinh

Một quan hệ có hai đầu, và **hai đầu phải sửa cùng lúc** thì mới không lệch. Bắt
người viết sửa hai tệp là bảo đảm chắc chắn rằng có ngày chỉ một tệp được sửa.

> **Chỉ ghi chiều thuận trong `related:`.** Bộ sinh chỉ mục dựng chiều nghịch và
> in ở [`INDEX.md`](INDEX.md). `grounds` · `implemented_by` · `constrained_by` ·
> `required_by` · `superseded_by` · `blocked_by` · `evidence_for` ·
> `refined_by` — ⛔ **không tệp nào được ghi tay tám vị từ này.**

### 4.3 Khuôn ghi — cố ý hẹp để phân tích được ⛔ không cần thư viện

```yaml
related:
  - derives_from: KO-PRN-002
  - evidenced_by: KO-REF-003
```

Đúng một cặp `- <vị từ>: <id>` mỗi dòng, thụt đúng hai dấu cách. Kho ⛔ **không có
thư viện YAML**, và thêm một phụ thuộc chỉ để đọc siêu dữ liệu tài liệu là cái
giá sai. Khuôn hẹp ⇒ bộ phân tích 20 dòng, ⛔ không mơ hồ.

Đối tượng ⛔ không có quan hệ nào ghi `related: []` — **nhưng** xem §5 luật ⑨: chỉ
`Reference` được phép mồ côi.

---

## §5 · CHÍN BẤT BIẾN THỨC MÁY CƯỠNG CHẾ

`tests/governance/knowledge-objects.test.mjs` kiểm mọi mục dưới đây. Hỏng một mục
⇒ `npm test` đỏ ⇒ ⛔ không commit được.

| # | Bất biến thức | Chặn được điều gì |
|---|---|---|
| ① | Tên tệp ⟷ `id` ⟷ `type` ⟷ thư mục **khớp cả bốn** | đối tượng lạc chỗ, ⛔ không ai tìm ra |
| ② | Đủ 10 trường · `id` duy nhất toàn kho | siêu dữ liệu khuyết ⇒ ⛔ không rà soát được |
| ③ | `status` hợp lệ **cho loại đó** · liên kết `approved_by` §3.2 | tri thức **tự phong** đã ban hành |
| ④ | Mọi đường dẫn trong `source` **tồn tại thật** | 🔴 trỏ tới tài liệu đã bị xoá/đổi tên — tri thức **mất gốc** |
| ⑤ | Mọi `related` trỏ tới đối tượng **có thật** · vị từ ∈ §4.1 | 🔴 **quan hệ treo** — đồ thị nói dối |
| ⑥ | 🔑 **`constrains` · `supersedes` ⇒ `tier` đích ≥ `tier` nguồn** | 🔴 **đối tượng vượt quyền nguồn** — xem dưới |
| ⑦ | Thân ≤ 60 dòng · có `## Phát biểu` và `## Nguồn đầy đủ` | 🔴 chép lại toàn văn nguồn ⇒ **sinh bản thứ hai của sự thật** |
| ⑧ | [`INDEX.md`](INDEX.md) **đồng bộ** với `objects/` | chỉ mục lỗi thời ⇒ Board rà soát trên bản cũ mà ⛔ không biết |
| ⑨ | ⛔ Không đối tượng nào **mồ côi** *(0 quan hệ)* — trừ `Reference` | tri thức rời rạc ⇒ đúng cái bệnh *"tài liệu tuyến tính"* Board vừa bác |

### 5.1 🔴 Bất biến thức ⑥ — bất biến thức duy nhất mang tính hiến định

Bậc nhỏ = quyền cao (ADR-010: `0` Board … `6` mã nguồn). Luật:

> **Một đối tượng ⛔ KHÔNG được `constrains` hay `supersedes` một đối tượng có
> `tier` cao quyền hơn chính nó.**

Nghĩa cụ thể: một đối tượng trỏ tới tài liệu bậc 5 **⛔ không thể** ràng buộc một
đối tượng trỏ tới Hiến pháp bậc 1. Nếu ai đó thật sự cần điều đó — thì đó ⛔
không phải việc của Knowledge System: đó là **tu chính Hiến pháp theo Điều 42**,
và phải đi qua Board.

⛔ Không có bất biến thức này, mọi lời cấm ở §2.1 chỉ là lời khuyên.

---

## §6 · THÂN ĐỐI TƯỢNG — bốn mục cố định

```markdown
# KO-XXX-NNN — <title>

## Phát biểu
<1–5 câu chuẩn tắc. Đây là thứ người đọc cần khi tra cứu vội.>

## Vì sao
<lý do · bằng chứng đo được, ⛔ không phải nhận định>

## Hệ quả nếu vi phạm
<điều gì hỏng · đã từng hỏng thế nào>

## Nguồn đầy đủ
> Toàn văn ở `<đường dẫn>`. Đối tượng này là **chỉ mục**, ⛔ không thay thế nguồn.
> Đối tượng ⟷ nguồn lệch nhau ⇒ **NGUỒN THẮNG**.
```

Trần **60 dòng** là răng của nguyên tắc `P-ZERODUP` áp lên chính tài liệu quản
trị: đối tượng nào cần hơn 60 dòng để nói thì nó ⛔ không phải một đối tượng — nó
là *nguồn*, và nguồn thuộc về bậc 0–4.

---

## §7 · VÒNG ĐỜI

```
soạn ⇒ PROPOSED ──trình──▶ PENDING_BOARD ──phản biện──▶ UNDER_REVIEW
                                  │                          │
                          Board bác │                          │ Board duyệt
                                  ▼                          ▼
                              REJECTED                     ADOPTED
                                                              │
                                              đối tượng mới thay thế
                                                              ▼
                                                         SUPERSEDED
```

- **⛔ Không xoá đối tượng.** `SUPERSEDED` · `REJECTED` · `CLOSED` đều **giữ lại** —
  lý do của một quyết định sai vẫn là thông tin có giá trị *(quy ước `docs/adr/README.md`)*.
- Đổi `status` **phải** đổi kèm `date` và `approved_by`.
- Thêm/sửa/xoá bất kỳ đối tượng nào ⇒ chạy `npm run knowledge` để dựng lại
  [`INDEX.md`](INDEX.md). Phép kiểm ⑧ bắt chỉ mục lỗi thời.
