# KẾ HOẠCH THI HÀNH `031d` — TRÊN NỀN ADR-008 ĐÃ PHÊ DUYỆT

| | |
|---|---|
| **Nguồn thẩm quyền** | [ADR-008](../adr/ADR-008-bundle-stage-vocabulary.md) — duyệt 02/08/2026, **Phương án D · Tách trục** |
| **Chỉ thị** | Architecture Review Board **Quy tắc 6** |
| **Trạng thái** | 📋 Kế hoạch — **chưa được phép viết SQL** *(xem §2)* |
| **Bước kế tiếp trong quy trình** | Migration Design Review |

> ⚠️ **TÀI LIỆU NÀY KHÔNG CHỨA SQL, VÀ ĐÓ LÀ CÓ CHỦ Ý.**
>
> Board yêu cầu *"Follow the approved ADR exactly"*. ADR-008 §6.1 xếp `031d` ở
> **bước 9 trên 9** — sau migration custody, sau viết lại trigger, sau gieo lại
> `S001`, sau nghiệm thu `/subcon`. Viết SQL của `031d` lúc này là **đi ngược
> chính ADR vừa duyệt**, và vi phạm Hiến pháp V.1.
>
> `031c3` Mục 5 đã nói thẳng về đúng hai bảng này:
> *"Cả hai bảng đã có cột `assignment_id`, nên khuôn policy sẽ giống hệt tệp
> này. **Nhưng viết trước khi đo được là đúng thứ sai lầm đã tạo ra bản nháp
> `031`.**"*
>
> Tài liệu này chuẩn bị **mọi thứ tới sát ranh giới đó** và dừng lại đúng chỗ.

---

## 1. PHẠM VI `031d`

Khoanh quyền cho **hai bảng cuối cùng của cụm cộng tác bên ngoài**:

| Bảng | Dòng hiện tại | Policy hiện có | Ghi chú |
|---|---|---|---|
| `subcon_issue_logs` | **0** | chỉ `buyer_denied` | phiếu xuất hàng đi gia công |
| `subcon_receipt_logs` | **0** | `buyer_denied` + **di sản bản nháp `031`** | phiếu thu hồi hàng về |

Cả hai đã có `assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL`
từ `029:488-491` — **nullable có chủ ý**, dữ liệu cũ không thuộc Assignment nào
và sẽ mãi mãi không thuộc.

### 1.1 ⚠️ Việc bắt buộc phải làm trước tiên — di sản bản nháp `031`

`031c` Mục 4 dòng 163 và 169 ghi rõ:

> `subcon_receipt_logs` 0 dòng — **có `partner_read`/`partner_write` của bản
> nháp `031`** […] đáng soi trước: nó mang policy do bản nháp `031` để lại,
> **cùng nguồn gốc với lỗ hổng `qa_audit_reports`**.

Bản nháp `031_assignment_rls.INCOMPLETE.sql` **đã bị chạy nhầm** trên CSDL thật.
Nó gỡ hàng rào rồi không dựng lại đủ — và sự cố `qa_audit_reports` sinh ra từ
đó **đã tồn tại nhiều ngày mà không ai biết** (Hiến pháp XI.1).

> **`031d` phải mở đầu bằng việc kiểm kê policy thật trên hai bảng này, không
> phải bằng việc thêm policy mới.** Thêm hàng rào lên trên một hàng rào hỏng thì
> cái hỏng vẫn ở đó.

---

## 2. ĐIỀU KIỆN CHẶN — KHÔNG ĐƯỢC VIẾT MỘT DÒNG SQL NÀO CỦA `031d` CHO TỚI KHI ĐỦ

| # | Điều kiện | Vì sao | Trạng thái |
|---|---|---|---|
| G1 | ADR-008 được duyệt | Hiến pháp IV | ✅ **đạt** 02/08/2026 |
| G2 | Migration custody *(`039`)* đã chạy | không có nó thì `S001` Phần B vẫn đổ | ⛔ chưa |
| G3 | `fn_process_subcon_issue` · `fn_process_subcon_receipt` đã viết lại | chúng đang ghi giá trị enum không tồn tại | ⛔ chưa |
| G4 | `S001` Phần B gieo trọn — **cả hai bảng > 0 dòng** | Hiến pháp **V.1**: bảng rỗng thì *"RLS chặn đúng"* và *"chẳng có gì để thấy"* **giống hệt nhau** | ⛔ chưa |
| G5 | `/subcon` nghiệm thu **như một phân hệ mới** | nó chưa từng chạy | ⛔ chưa |
| G6 | Kiểm kê policy di sản trên `subcon_receipt_logs` | §1.1 | ⛔ chưa |

**G4 là điều kiện không thương lượng.** Nó là toàn bộ lý do `031d` chưa tồn tại.

---

## 3. THỨ TỰ THI HÀNH — TỪ HÔM NAY TỚI `031d`

```
① 039 · migration custody          ← ADR-008 Phương án D, bước 1
      ↓  (không ALTER TYPE — enum giữ nguyên 4 giá trị, Board Quy tắc 1)
② ràng buộc chặn ghi sản lượng cho bó đang ở ngoài
      ↓
③ viết lại fn_process_subcon_issue · fn_process_subcon_receipt
      ↓
④ sửa subcon/actions.ts:45,63 — bỏ CUT_PASSED · SEWING_READY (Board Quy tắc 3)
      ↓
⑤ nhãn tiếng Việt cho trạng thái custody          (Playbook XXI)
      ↓
⑥ chạy lại S001 → Phần B trọn vẹn → G4 ĐẠT
      ↓
⑦ nghiệm thu /subcon như phân hệ mới
      ↓
⑧ ĐO quyền thật trên hai bảng bằng phiên đăng nhập thật   ← chưa từng làm được
      ↓
⑨ 031d · viết policy TRÊN SỐ ĐO, không trên phỏng đoán
      ↓
⑩ Regression riêng cho 031d       (Hiến pháp XI.1 — không bỏ vòng nào)
```

⚠️ Bước ⑧ **không phải thủ tục**. Nó là lần đầu tiên trong lịch sử dự án hai
bảng này có dòng để đo. Kết quả của nó **quyết định nội dung** của `031d`, nên
`031d` không thể được viết trước nó.

---

## 4. THIẾT KẾ `031d` — MỨC NGUYÊN TẮC

> Ghi ở mức **nguyên tắc**, không phải mức câu lệnh. Chi tiết thuộc Migration
> Design Review, sau khi bước ⑧ có số.

### 4.1 Trục phân quyền — đã bị ràng buộc sẵn, không có lựa chọn

ADR-008 §0 ① và bất biến **I-11**:

> **`assignment_id` là ranh giới phân quyền DUY NHẤT.**

Ba thứ **KHÔNG** được dùng làm ranh giới, dù đều nằm sẵn trên bảng:

| Cột | Vì sao không |
|---|---|
| `subcon_order_id` | dẫn tới `vendor_id` — đã bị I-11 loại làm ranh giới |
| **`custody`** *(trục mới của ADR-008)* | **thuộc tính vận hành, không phải ranh giới phân quyền** — ADR-008 §9.4 cảnh báo đúng bài học `vendor_id` |
| `created_by` / `received_by` | danh tính người, không phải phạm vi việc |

⚠️ **Cạm bẫy đáng gọi tên:** custody vừa được tạo ra, và nó *trông* rất giống một
ranh giới hợp lý — *"bó đang ở chỗ nhà thầu nào thì nhà thầu đó thấy"*. Dùng nó
là lặp lại **nguyên xi** lỗi `vendor_id` mà `040` và `031c3` vừa mất một ngày để
dẹp. Ghi ở đây để người thi hành không phải tự phát hiện lại.

### 4.2 Quyền ĐỌC — theo khuôn `p031c3_so_scoped_read`

Khuôn đã được kiểm chứng ở `031c3` và đạt 32/32 phép kiểm sống:

- `RESTRICTIVE` cho `SELECT`, áp lên `authenticated`.
- Ngắn mạch cho nội bộ và Buyer trước, để không trả giá tra cứu.
- Với vai ngoài: đối chiếu `assignment_id` của dòng với phần việc mà chính họ
  được giao, kèm đủ bốn điều kiện chép từ `mos_can_read_assignment`
  *(`deleted_at IS NULL` · `mos_partner_id()` khác NULL · `partner_id` khớp ·
  `status` không thuộc `DRAFT`/`CANCELLED`)*.
- Dòng **mồ côi** (`assignment_id IS NULL`) rơi ra ngoài ⇒ vai ngoài không thấy.
  **Hành vi đúng và có chủ ý** — dòng không thuộc phần việc nào thì không thuộc
  về nhà thầu nào.
- **Chỉ THÊM `RESTRICTIVE`, không gỡ policy nào.** Thêm `RESTRICTIVE` là siết,
  không bao giờ là nới — đó là thứ giữ cho không lặp lại sự cố `qa_audit_reports`.

⚠️ **Phụ thuộc ngầm phải ghi vào tệp migration** *(Playbook K-3)*: policy có truy
vấn con vào `assignments`, mà **truy vấn con trong policy vẫn chịu RLS dưới quyền
người gọi**. Nó chỉ chạy đúng vì nhà thầu đọc được phần việc của mình (`asg_read`).
Siết `assignments` chặt hơn sẽ làm hai bảng này tối đi **mà không ai đụng tới
chúng** — cùng loại phụ thuộc với `p031b_line_scoped_read` và `p031c3_so_scoped_read`.

### 4.3 Quyền GHI — **khác hẳn `subcon_orders`, đây là điểm dễ làm sai nhất**

`031a` và `026` **cố ý KHÔNG chặn ghi** hai bảng này. Đó không phải sơ suất:

| Nguồn | Nguyên văn |
|---|---|
| `026:27` | *"KHÔNG chặn ghi `subcon_issue_logs`/`subcon_receipt_logs`: đó là dữ liệu phát sinh"* |
| `031a:124` | *"đối tác GHI LÀ ĐÚNG Ý ĐỒ (họ có TRÁCH NHIỆM báo cáo sản lượng theo giờ). Không đụng vào chúng"* |
| `030:92,96` | `partner_permissions` cấp **WRITE** trên `subcon_receipt_logs` cho **cả** `PRODUCTION_PARTNER` **lẫn** `SERVICE_PARTNER` |

Đây là thi hành trực tiếp **Playbook Điều XXX mục 6 và mục 9**:

> Nhà thầu **bắt buộc** cập nhật […] **Cấm thiết kế họ như người chỉ đọc.**

> **`031d` KHÔNG được sao chép khuôn chặn-ghi của `031c3`.** `subcon_orders` là
> chứng từ thương mại của Monica — nhà thầu không được lập. Hai bảng này là
> **dữ liệu phát sinh của chính nhà thầu** — họ **phải** ghi được.

Việc của `031d` với quyền GHI là **khoanh**, không phải **chặn**: nhà thầu ghi
được, nhưng **chỉ trong phần việc của mình**, và không ghi được vào phần việc
của người khác.

### 4.4 Bất đối xứng giữa hai bảng — cần chốt ở Migration Design Review

| Bảng | Ai ghi trong thực tế | `partner_permissions` |
|---|---|---|
| `subcon_issue_logs` | **Monica** xuất hàng đi | *(không có mục WRITE)* |
| `subcon_receipt_logs` | **nhà thầu** khai hàng về | WRITE cho cả hai loại đối tác |

Bất đối xứng này **có vẻ** đúng nghiệp vụ — Monica giao hàng, nhà thầu khai
nhận. Nhưng nó **chưa từng được đo**, vì cả hai bảng chưa từng có dòng nào.

**Bước ⑧ phải trả lời dứt điểm câu này trước khi `031d` được viết.** Nếu nhà
thầu cũng cần ghi `subcon_issue_logs` *(ví dụ: xác nhận đã nhận đủ hàng)* thì
thiết kế quyền GHI khác hẳn.

---

## 5. KẾ HOẠCH KIỂM THỬ

Tuân thủ bốn quy tắc ở [`tests/README.md`](../../tests/README.md).

### 5.1 Bắt buộc — mỗi kịch bản có ít nhất một vai CHỜ THẤY > 0 *(K-3)*

Bài kiểm chỉ gồm những vai chờ-0 **không phân biệt được** *"khoanh đúng"* với
*"chặn phẳng"*. Lỗi `031c` suýt lọt đúng vì lý do này.

| Vai | Chờ thấy | Vai trò trong phép đo |
|---|---|---|
| Nhà thầu **A** có phần việc | **> 0** | ⭐ vế **khẳng định** — bắt lỗi chặn phẳng |
| Nhà thầu **B** có phần việc khác | **> 0** *(chỉ của mình)* | ⭐ bắt **rò rỉ chéo** |
| Nhà thầu **C** không có phần việc | 0 | vế phủ định |
| Buyer | 0 | `buyer_denied` còn nguyên |
| Nội bộ Monica | **đủ** | không siết quá tay |
| `anon` | 0 | — |

### 5.2 Phép kiểm bắt buộc

| # | Nội dung | Loại |
|---|---|---|
| 1 | A thấy phiếu của **chính mình** | ⭐ khẳng định |
| 2 | A **không** thấy phiếu của B | ⭐ rò rỉ chéo |
| 3 | Dòng **mồ côi** vô hình với mọi vai ngoài | phủ định |
| 4 | A **GHI ĐƯỢC** phiếu thu hồi trong phần việc của mình | ⭐ **Điều XXX mục 6** |
| 5 | A **KHÔNG** ghi được vào phần việc của B | khoanh, không chặn |
| 6 | Phần việc kết thúc ⇒ quyền **tự mất** | Điều XXX câu hỏi 4 |
| 7 | Di sản `partner_read`/`partner_write` của bản nháp `031` đã xử | §1.1 |
| 8 | `031a`/`031b`/`031c`/`031c3` **còn nguyên** | không hồi quy |

⚠️ Phép kiểm 8 phải **so khớp đúng tên policy**, không đếm theo tiền tố — bài
học `97f94c4`: `LIKE 'p031c_%'` đếm nhầm cả `p031c3_so_scoped_read` vì `_` là ký
tự đại diện. **Không lặp lại.**

### 5.3 Quy tắc thao tác

- **K-2** — không đo quyền GHI bằng `INSERT {}`. Gửi bản ghi **hợp lệ và đầy
  đủ**, dọn ngay nếu lọt. Lưu ý `subcon_receipt_logs` có
  `chk_defect_requires_evidence`: có hàng lỗi thì **bắt buộc** kèm ảnh bằng chứng.
- **K-1** — kiểm cấu hình bằng cách đọc cấu hình (`pg_policies`), không bằng ghi thử.
- Tài khoản và dữ liệu **dùng-một-lần**, dọn trong `finally`.
- ⚠️ `INSERT` vào hai bảng này **kích hoạt trigger** cập nhật `subcon_orders` và
  `cut_bundles`. Bài kiểm phải **chụp trước và khôi phục theo bản chụp**, hoặc
  chạy trong giao dịch kết thúc bằng `ROLLBACK` — nếu không nó tự làm bẩn dữ
  liệu nền của chính mình.

---

## 6. RỦI RO

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| R1 | Dùng **custody** làm ranh giới phân quyền | §4.1 — ghi cảnh báo vào chính tệp migration, không chỉ ở đây |
| R2 | Sao chép khuôn **chặn ghi** của `031c3` ⇒ nhà thầu thành người chỉ đọc, vi phạm Điều XXX | §4.3 — phép kiểm 4 là vế khẳng định bắt buộc |
| R3 | Di sản bản nháp `031` bị bỏ qua | §1.1 — kiểm kê **trước**, thêm policy **sau** |
| R4 | Siết `assignments` về sau làm hai bảng tối đi | §4.2 — ghi phụ thuộc ngầm vào tệp migration; đo lại sau **mọi** thay đổi trên `assignments` |
| R5 | Bước ⑧ lộ ra nghiệp vụ khác giả định ở §4.4 | kế hoạch này là **kế hoạch**, không phải cam kết. Số đo thắng giấy tờ |
| R6 | Bị thúc viết `031d` sớm để gỡ freeze nhanh | G4 không thương lượng. Gỡ freeze bằng policy chưa đo được là **giả vờ an toàn** |

---

## 7. VIỆC KẾ TIẾP NGAY

> **Migration Design Review cho `039` — migration custody.**

Đó là bước ① của §3, và là **thứ duy nhất** hiện không bị chặn bởi điều kiện nào.
Mọi thứ khác trong tài liệu này chờ nó.

Theo thứ tự chuẩn Playbook XXXIII, `039` đã qua Architecture Review và ADR
*(ADR-008, duyệt)*, nên bước kế tiếp là **Migration Design Review → Impact
Analysis → SQL**.

---

## 8. THAM CHIẾU

**Quyết định**
- [ADR-008](../adr/ADR-008-bundle-stage-vocabulary.md) — Phương án D, sáu quy tắc Board
- [ADR-006](../adr/ADR-006-permission-engine.md) — ⏳ **chờ phê duyệt**; `031d` phụ thuộc cả hai

**Lược đồ — đã đọc và đối chiếu tại `97f94c4`**
- `supabase/migrations/009_subcontracting_schema.sql:39-70` — hai bảng
- `supabase/migrations/029_assignment_domain.sql:488-491` — thêm `assignment_id`
- `supabase/migrations/030_permission_engine.sql:92,96` — WRITE cho đối tác
- `supabase/migrations/026_subcon_no_assignment_write.sql:27` — cố ý không chặn ghi
- `supabase/migrations/031a_block_external_write.sql:124` — cố ý không đụng
- `supabase/migrations/031c_narrow_subcontractors.sql:159-171` — cố ý chưa làm + di sản bản nháp
- `supabase/migrations/031c3_narrow_subcon_orders.sql:93-111` — khuôn policy mẫu
- `supabase/drafts/031_assignment_rls.INCOMPLETE.sql` — bản nháp đã bị chạy nhầm

**Quy phạm**
- Hiến pháp **V.1** — không kết luận trên bảng rỗng *(cơ sở của G4)*
- Hiến pháp **XI.1** — SECURITY FREEZE, không bỏ vòng Regression nào
- Playbook **XXX** mục 6 · 9 · 14 — nhà thầu có trách nhiệm GHI
- Playbook **K-2**, **K-3** — quy tắc đo
