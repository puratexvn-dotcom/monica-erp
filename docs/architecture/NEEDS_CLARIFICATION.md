# NEEDS CLARIFICATION — MONICA ONE

> ## 📦 ĐÃ ĐƯỢC THAY THẾ — 04/08/2026
>
> Sổ đăng ký câu hỏi còn mở nay nằm ở
> **[`docs/business/BUSINESS_KNOWLEDGE_BASE.md` Phần E](../business/BUSINESS_KNOWLEDGE_BASE.md)**,
> theo Board Decision 04/08/2026.
>
> **Số hiệu được giữ nguyên** để mọi trích dẫn cũ vẫn tra được:
> `C1–C8` → `CF-1`–`CF-8` · `Q1–Q7` → xem bảng ánh xạ ở BKB §G.3.
>
> Tệp này **giữ lại làm hồ sơ lịch sử** (Hiến pháp Điều 43.7 — không viết lại
> lịch sử). **Không thêm mục mới vào đây** — thêm vào BKB Phần E.
>
> ⚠️ Nội dung dưới đây **chưa được cập nhật** sau khi hợp nhất; chỗ nào lệch thì
> **BKB thắng**.

> Lập theo **AI Collaboration Constitution v1.0**: phát hiện khoảng trống thì
> **không được tự suy diễn**, phải đưa vào đây để Board quyết.

| Trường | Giá trị |
|---|---|
| **Ngày** | 2026-08-04 |
| **Nguồn đối chiếu** | Business Knowledge Base v1.0 (`VERIFIED`) ⟷ mã đang chạy |
| **Trạng thái** | ⏳ Chờ Board — **không được thi hành mục nào ở đây** |

---

## PHẦN A — NHỮNG CHỖ TÔI ĐÃ SUY SAI

Knowledge Base sửa lại bốn giả định của tôi trong
[`CM_OPERATING_MODEL.md`](CM_OPERATING_MODEL.md). Ghi ra để tài liệu đó không
tiếp tục được dùng như thể còn đúng.

| # | Tôi đã suy | Sự thật (KB) | Ảnh hưởng |
|---|---|---|---|
| A1 | Vòng đời bắt đầu bằng **RFQ / hỏi hàng** | **Email → Tech Pack → PO.** Không mặc định có RFQ (§3) | Mục 3 của CM_OPERATING_MODEL sai ở bước ① |
| A2 | **Báo giá đi trước mẫu**; mẫu ở bước ⑥ | **Mẫu vật lý → chiết tính → (may mẫu) → báo giá** (§4) | Sai thứ tự hai bước cốt lõi |
| A3 | Khách **chỉ định nhà cung cấp vải** (nominated supplier) | KB **không nhắc tới**. Chỉ nói sở hữu NPL quyết định theo từng đơn (§6) | Giả định của tôi chưa được xác minh — hạ xuống `NEEDS-VERIFICATION` |
| A4 | Nhận PO khách rồi **tạo đơn nội bộ** | **PO = PO của khách.** Không tạo mô hình PO nội bộ trừ khi có yêu cầu (§5) | Xem C3 bên dưới |

⚠️ Bài học: bốn mục trên đều là chỗ tôi lấy kinh nghiệm ngành chung lấp vào chỗ
trống. Đó chính xác là hành vi mà quy tắc mới cấm.

---

## PHẦN B — MÂU THUẪN GIỮA KNOWLEDGE BASE VÀ MÃ ĐANG CHẠY

### 🔴 C1 — KB nói "không có thực thể Buyer riêng", nhưng mã có cả một hệ Buyer

**KB §2:** *"Buyer = Customer. There is no separate Buyer entity."*

**Mã đang chạy** `[VERIFIED]`:
- bảng `buyer_accounts` — xuất hiện ở **4 migration**
- vai trò `buyer` trong `lib/rbac.ts` — **5 lần**
- lát cắt `buyer` trong `lib/mos/po-twin.contract.ts`
- policy `buyer_scope_customers`, `buyer_scope_styles`, `buyer_scope_documents`,
  `buyer_scope_comments`

**Câu hỏi cho Board:** `buyer_accounts` là *thực thể nghiệp vụ song song với
Customer* (mâu thuẫn KB), hay chỉ là *bảng ánh xạ tài khoản đăng nhập → khách
hàng* để cấp quyền cổng khách (không mâu thuẫn)?

⚠️ **Không tự sửa.** Nếu là mâu thuẫn thật thì đây là thay đổi domain model, cần
ADR. Nếu chỉ là bảng ánh xạ thì nên đổi tên khái niệm trong tài liệu để hết hiểu lầm.

---

### 🔴 C2 — KB cấm khách xem chiết tính và biên lợi nhuận; mã có thể đang cho xem

**KB §12:** khách hàng *"must never access: Internal costing. Internal margin."*

**Mã đang chạy** `[EVIDENCE]`: quét 40 migration **không tìm thấy**
`CREATE POLICY ... ON costings`. Bảng chứa `target_price`, `quoted_price`,
`margin_percent` dường như vẫn chạy bằng policy nền
`authenticated_only USING (auth.uid() IS NOT NULL)` từ migration `010`. Không bài
kiểm nào chạm tới bảng này.

Trước đây tôi xếp mục này là *rủi ro bảo mật cần xác minh*. **KB nâng nó lên
thành quy tắc nghiệp vụ bị vi phạm** — nếu đúng.

**Việc cần làm — một truy vấn, một phút:**
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('costings','costing_items','style_bom');
```

⚠️ Đây là mục **duy nhất** trong tài liệu này tôi đề nghị làm **trước** mọi việc
khác. Kết quả quyết định đây là "không có gì" hay "dừng mọi thứ lại".

---

### 🟠 C3 — `production_orders` có phải "PO nội bộ" mà KB §5 bảo đừng tạo không?

**Mã** `[VERIFIED]` `014_md_tables.sql:66`: bảng `production_orders` có
`order_no UNIQUE`, tham chiếu `orders(id)`, có `planned_qty`, `start_date`,
`due_date`.

**Câu hỏi:** đây là *lệnh sản xuất* (một PO khách tách ra nhiều lệnh cho nhiều
chuyền / nhiều nhà máy — hợp với KB §8), hay là *PO nội bộ* mà KB §5 bảo đừng tạo?

**Nhận định của tôi** `[HYPOTHESIS]`: là lệnh sản xuất, **không** mâu thuẫn KB, vì
KB §8 nói một PO có thể chia cho nhiều nhà máy — mà muốn chia thì phải có thực
thể để chia. Nhưng tôi **không tự kết luận**.

---

### 🟠 C4 — Nhà thầu ĐƯỢC xem đơn giá, nhưng trước đây bị coi là rò rỉ giá

**KB §13:** nhà thầu được xem *"Unit Price. Amount. Debt Balance."* của chính họ.

**Lịch sử dự án** `[EVIDENCE]`: commit `3f0ef36` ghi *"subcon_orders RÒ RỈ GIÁ"*
là lỗi, và migration `031c3` đã thu hẹp `subcon_orders` theo `assignment_id`.

**Câu hỏi:** `031c3` thu hẹp đúng mức (nhà thầu chỉ thấy giá của phần việc **của
mình**), hay đã siết quá tay khiến họ **không thấy cả đơn giá của chính mình** —
tức mất một năng lực KB yêu cầu phải có?

⚠️ Cần kiểm bằng phiên đăng nhập thật của một tài khoản `subcon`.

---

### 🟡 C5 — Hai tổ chức QA: mã chỉ có một

**KB §9:** có **QA nội bộ** và **QA của khách**; chặng kiểm Inline · Pre-Final ·
Final · Packing, tuỳ yêu cầu từng khách.

**Mã** `[VERIFIED]`: quét migration không tìm thấy `inline`, `pre_final`,
`packing_inspection`, `customer_qa` hay `buyer_qa`. KB §12 cũng nói khách **không**
được xem *QA nội bộ* — nghĩa là phải phân biệt được hai loại báo cáo QA.

**Câu hỏi:** hệ thống hiện có phân biệt báo cáo QA nội bộ với báo cáo QA của khách
không? Nếu không, khách đang xem báo cáo nào?

---

### 🟡 C6 — "Line Map" xuất hiện ở cả hai cổng nhưng không tồn tại trong mã

**KB §12 và §13:** cả khách hàng lẫn nhà thầu đều được xem **Line Map**.

**Mã** `[VERIFIED]`: `line_map` — **0** kết quả trong migration, **0** trong mã ứng
dụng.

**Câu hỏi:** Line Map là gì trong nghiệp vụ — sơ đồ bố trí chuyền, hay bảng phân
công công đoạn theo chuyền, hay tiến độ theo chuyền? Chưa rõ định nghĩa thì chưa
thiết kế được.

---

### 🟡 C7 — Nghiệp vụ phụ (bán sỉ, bán lẻ online) chưa có chỗ nào trong mô hình

**KB §1** liệt kê bán sỉ và bán lẻ online là nghiệp vụ phụ. Toàn bộ mô hình vận
hành tôi dựng, và toàn bộ MD hiện tại, chỉ nói về gia công.

**Câu hỏi:** hai mảng này nằm ngoài phạm vi giai đoạn hiện tại, hay cần chỗ trong
domain model ngay từ bây giờ?

---

### 🟡 C8 — Tiêu chí "mọi báo cáo khớp cùng một con số" chưa có cơ chế bảo đảm

**KB §15:** *"All reports reconcile with identical numbers."*

**Mã** `[EVIDENCE]`: hiện có `app/actions/ceo-report.ts`, `components/report/`,
`home-metrics.ts`, cùng các service của MD — nhiều nơi tự tính số. Không có tầng
tổng hợp dùng chung.

⚠️ Đây là tiêu chí **thành công**, không phải tính năng. Nó đòi một quyết định
kiến trúc: mọi con số phải sinh từ một nguồn (View / hàm SQL / service duy nhất).
Cần ADR.

---

## PHẦN C — KHOẢNG TRỐNG KB CHƯA NÓI, TÔI KHÔNG TỰ ĐIỀN

| # | Câu hỏi | Vì sao cần |
|---|---|---|
| Q1 | Một PO có tách thành **nhiều đợt giao, nhiều cảng đến** không? | Quyết định `shipments` là 1-1 hay 1-nhiều với `orders` |
| Q2 | **Khấu trừ sau giao hàng** (trễ, lỗi, thiếu) có phổ biến không, tính theo quy tắc nào? | KB §11 có công nợ nhưng không nói khấu trừ. Ảnh hưởng doanh thu thực thu |
| Q3 | Đơn vị hoạch định năng lực là **phút-chuyền, số chuyền, hay số công nhân**? | Quyết định mô hình Planning |
| Q4 | Với đơn **khách cấp NPL**: nhà máy có phải đối chiếu và báo thiếu trong hệ thống không? | KB §6 nói sở hữu NPL theo đơn, nhưng không nói quy trình nhận |
| Q5 | **Đơn mẫu** và **đơn sản xuất loạt** có phải hai loại đơn khác nhau không? | `orders` hiện không có cột phân biệt |
| Q6 | Ai duyệt giá trước khi báo cho khách — MD, hay Giám đốc? | Chưa có luồng duyệt giá trong mã |
| Q7 | Phòng **Chiết tính · Mua hàng · Kế hoạch** có cần vai trò đăng nhập riêng không? | Hiện chỉ `md` và `superadmin` vào được `/md` `[VERIFIED]` |

---

## PHẦN D — NHỮNG PHÁT HIỆN KỸ THUẬT KHÔNG ĐỔI SAU KHI CÓ KB

Ba mục này thuộc phần việc của tôi (mã · CSDL · bảo mật), KB không mâu thuẫn:

1. 🔴 **`late_milestones` là số cứng `0`** (`po-twin.service.ts:132`) khiến quy tắc
   leo thang khẩn cấp ở `po-flow.ts:111` **không bao giờ chạy**. `[VERIFIED]`
2. 🔴 **Hai màn hình PO có năng lực khác nhau** — PO 360° có T&A và mẫu, Command
   Center không có. `[VERIFIED]`
3. 🔴 **MD không có bài kiểm nghiệp vụ nào.** `[VERIFIED]`

⚠️ KB §7 nói *"Sample Management là năng lực nghiệp vụ độc lập"* — điều đó làm
mục 2 nặng hơn: chuyển sang Command Center sẽ **mất** một năng lực mà KB xếp
hạng độc lập.

---

## ĐỀ NGHỊ THỨ TỰ XỬ LÝ

1. **C2** — một truy vấn SQL. Làm trước mọi thứ.
2. **C1 · C3 · C4** — ba câu hỏi domain model, quyết được trong một buổi.
3. **Phần D mục 1** — sửa một hằng số, khôi phục một quy tắc nghiệp vụ đang chết.
4. **C5 · C6 · Q1–Q7** — làm rõ trước khi thiết kế MD giai đoạn tiếp theo.

**Không thi hành mục nào cho tới khi Board trả lời.**
