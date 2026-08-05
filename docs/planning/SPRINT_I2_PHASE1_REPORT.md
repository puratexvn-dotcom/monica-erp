# SPRINT I-2 · PHASE 1 — BÁO CÁO THI HÀNH

| Trường | Giá trị |
|---|---|
| **Sprint** | **I-2 · Lưới an toàn** — Baseline §3.2 · EDD-06 §7 |
| **Phase** | **1** — hạng mục ⛔ không phụ thuộc Board, ⛔ không phụ thuộc CSDL |
| **Thẩm quyền khởi động** | **Board Decision 05/08/2026** — *"Không chặn Sprint I-2 chỉ vì tài liệu, ADR hoặc certificate chưa hoàn tất"* |
| **Điều kiện tiền đề** | [`TFC-001`](../audit/TECHNICAL_FOUNDATION_CERTIFICATE.md) ✅ — **0 Technical Blocker** |
| **Ngày** | 2026-08-05 |
| **Trạng thái** | ✅ **PHASE 1 HOÀN TẤT — Board phê duyệt 05/08/2026** |
| **Commit** | `6ee3dd24` — 13 tệp · +2001 / −14 |

---

## §1 · PHẠM VI PHASE 1 — VÀ VÌ SAO ĐÚNG BẰNG NÀY

EDD-06 §7 định nghĩa nội dung Sprint I-2:

> *"Bộ kiểm nghiệp vụ MD + Warehouse · phép kiểm vốn từ (`TD-03`) · sửa
> `po-twin:132` · phép kiểm 6 cổng"* — điều kiện ra: *"`test:arch` có đủ 5 phép
> kiểm mới"*.

Phase 1 lấy **ba hạng mục ⛔ không phụ thuộc gì bên ngoài** — ⛔ không cần Board
phán quyết, ⛔ không cần migration, ⛔ không cần CSDL:

| # | Hạng mục | Nợ trả | Nguồn |
|---|---|---|---|
| `P1-1` | Sửa `po-twin.service.ts:132` | `TD-17` · `KD-3` | EDD-06 §7 · SPRINT_2_PLAN 4.4 |
| `P1-2` | Phép kiểm **vốn từ trạng thái** | `TD-03` · `KD-9` · `TD-24` | SPRINT_2_PLAN 4.2 |
| `P1-3` | **Bộ kiểm nghiệp vụ MD** đầu tiên | `V-4` · `KD-11` · `TD-22` | điều kiện ra I-2 |

**Hoãn sang Phase 2** *(có lý do, ⛔ không trôi)*: bộ kiểm Warehouse · phép kiểm
6 cổng Screen Design Gate · tách `md-client.tsx` *(`TD-18`)* · `TD-27` đổi ngưỡng
`.delete()` sang danh sách miễn trừ tường minh.

---

## §2 · `P1-1` — `TD-17` · HAI MÀN HÌNH, MỘT CON SỐ

### 2.1 Khuyết tật `[MEASURED]`

`po-twin.service.ts:132` truyền `late_milestones: 0` — một **hằng số**.
`po-flow.ts:111` đọc `late_milestones > 0` để nâng mức khẩn lên `CRITICAL`.

| Màn hình | Nguồn số | Kết quả |
|---|---|---|
| Bảng danh sách PO *(`po.service.ts`)* | **đếm thật** từ `order_milestones` | `CRITICAL` |
| Trang PO 360° *(`po-twin.service.ts`)* | **hằng số `0`** | `NORMAL` |

⇒ **Cùng một đơn hàng, hai màn hình, hai mức khẩn cấp.** Người điều độ tin màn
hình nào cũng sai một nửa. Lỗi **im lặng** — ⛔ không ngoại lệ, ⛔ không cảnh báo.

### 2.2 Cách sửa — và vì sao ⛔ không vá riêng

⛔ **Không** chép vòng lặp sang tệp thứ hai. Chép là tạo bản chép tay thứ hai —
đúng thứ đã sinh ra khuyết tật, và `AC-1` cấm.

Luật đếm được rút ra thành **hàm thuần dùng chung**:

```
lib/mos/calculators/milestone-lateness.calculator.ts
   laMocTre()        một mốc có đang trễ không  ← nguồn sự thật duy nhất
   demMocTre()       đếm cho MỘT đơn            → po-twin.service.ts
   mocTreTheoDon()   đếm cho NHIỀU đơn          → po.service.ts
```

| Tệp | Thay đổi |
|---|---|
| `lib/mos/calculators/milestone-lateness.calculator.ts` | 🆕 hàm thuần, ⛔ không import gì |
| `app/(dashboard)/md/_services/po.service.ts` | vòng lặp viết thẳng → gọi `mocTreTheoDon()`. **Hành vi ⛔ không đổi** |
| `app/(dashboard)/md/po/[poId]/_services/po-twin.service.ts` | thêm truy vấn `order_milestones` · hằng số `0` → `demMocTre()` |

### 2.3 Hai quyết định nhỏ, nói rõ để khỏi tranh cãi sau

| # | Quyết định |
|---|---|
| ① | **Đọc hỏng ⇒ đếm ra `0`, NHƯNG `'mốc tiến độ'` vào danh sách `partial`.** Giao diện thừa nhận *"chưa đọc được"* thay vì trưng một con số bịa. Đúng cơ chế trung thực sẵn có của chính tệp đó |
| ② | **So chuỗi `YYYY-MM-DD` bằng `<`, ⛔ không dựng `Date`.** Dạng này sắp xếp theo từ điển **trùng** thứ tự thời gian, và nó tránh hẳn việc kéo múi giờ máy chủ vào phép so ngày. `lib/time.ts` giữ độc quyền biết giờ Việt Nam; hàm thuần chỉ **nhận** `homNay` |

---

## §3 · `P1-2` — `TD-03` · PHÉP KIỂM VỐN TỪ TRẠNG THÁI

> SPRINT_2_PLAN gọi đây là *"hạng mục có đòn bẩy cao nhất toàn Sprint 2"*.

### 3.1 Cơ chế

`arch.test.mjs` mục ⑫ đối chiếu **hai vế**, ⛔ không suy diễn vế nào:

```
vế CSDL   ràng buộc `CHECK (cột IN (…))` trích từ 54 migration
          — cả trong CREATE TABLE lẫn ALTER TABLE trong khối DO $$
vế mã     `export const X = [...] as const` trong lib/ và schemas/
so sánh   theo TẬP HỢP, ⛔ không theo thứ tự
```

Mọi vốn từ phải nằm ở **đúng một ô**; bộ mới ⛔ không thuộc ô nào ⇒ **HỎNG**:

| Ô | Nghĩa | Số |
|---|---|---|
| `anhXa` | đã ánh xạ tới `bảng.cột` và **ĐANG KHỚP** — lệch là hỏng ngay | **36** |
| `mienTrong` | dẫn xuất hoặc ⛔ không phải vốn từ nghiệp vụ — **kèm lý do** | 14 |
| `chuaPhanLoai` | **lệch đã đo**, chưa sửa được ở tầng mã — chỉ được ngắn đi | 8 |
| `csdlKhongCoTrongMa` | vốn từ CSDL chưa có đại diện trong mã — chỉ được ngắn đi | 17 |
| `trungTenDaBiet` | hai hằng số khác giá trị cùng một tên | 2 |

🔑 **Khác `TD-27` ở chỗ then chốt: danh sách TƯỜNG MINH, ⛔ không phải ngưỡng
đếm.** Ngưỡng đếm cho phép thêm cái mới miễn là bớt cái cũ; danh sách tường minh
thì ⛔ không.

### 3.2 Phát hiện `[MEASURED]` — tám chỗ lệch thật

| # | Lệch | Mức |
|---|---|---|
| `VT-1` | 🔴 **`orders.status` ⛔ KHÔNG có ràng buộc `CHECK` nào.** Vốn từ chỉ sống trong **một dòng chú thích** (`002:17`), và chú thích đó liệt kê **4** giá trị trong khi mã khai **6** *(thiếu `SHIPPED`, `CANCELLED`)*. **Đây là bảng trung tâm của cả hệ thống** | 🔴 |
| `VT-2` | 🔴 **`shipments.status` có 9 giá trị, mã khai 8 — thiếu `CANCELLED`.** Trong khi `026b_shipment_cancel_guard.sql` tồn tại đúng để canh phép huỷ. **Mã ⛔ không biểu diễn nổi một lô đã huỷ** | 🔴 |
| `VT-3` | **`wh_audit_log.action` lệch theo CẢ HAI CHIỀU** — CSDL có `POST`·`TRANSFER`·`SCRAP` mà mã ⛔ không có; mã có `EXPORT` mà CSDL ⛔ không có | 🟠 |
| `VT-4` | **`INCOTERMS` TRÙNG TÊN** — `lib/mos/shipment.ts` khai **11** giá trị, `schemas/md/common.ts` khai **7**. Hai vốn từ Incoterm khác nhau cùng tồn tại trong CSDL *(`shipments.incoterm` ⟷ `customers.incoterm`)* | 🟠 |
| `VT-5` | **`MATERIAL_CATEGORIES` TRÙNG TÊN** — `TRIM` *(MD)* ⟷ `TRIMS` + `THREAD` *(Kho)*. **Khác nhau đúng một chữ cái** | 🟠 |
| `VT-6` | `qa_logs.aql_status` ⛔ không ràng buộc — CSDL nhận mọi chuỗi | 🟡 |
| `VT-7` | `materials.uom` ⛔ không ràng buộc — 8 đơn vị chỉ được canh ở tầng Zod | 🟡 |
| `VT-8` | 17 vốn từ CSDL ⛔ **chưa có đại diện trong mã** — `subcon_orders.status`, `production_orders.status`, `purchase_orders.status`, `material_requests.status`, `partners.partner_type`… | 🟠 |

> 🔑 **`VT-4` và `VT-5` suýt lọt.** Bản đầu của phép kiểm dùng `Map` khoá theo
> tên, nên hằng số thứ hai **ghi đè im lặng** hằng số thứ nhất — *phép kiểm tự
> giấu mất đúng loại khuyết tật nó sinh ra để bắt*. Bắt được nhờ đối chiếu số
> lượng vốn từ đọc ra với số lượng `export const` đếm bằng `grep`.

### 3.3 Phép kiểm đã được chứng minh là CÓ RĂNG

> ⚠️ **Phép kiểm chưa từng đỏ là phép kiểm chưa chứng minh được gì.**

Tiêm drift có kiểm soát: thêm `'BLOCKED'` vào `MILESTONE_STATUSES`.

```
⛔ Vốn từ đã ánh xạ KHỚP CSDL (36 bộ)
   ← MILESTONE_STATUSES ⟷ order_milestones.status · CSDL THIẾU [BLOCKED]
KIỂM KIẾN TRÚC: 50 đạt · 1 hỏng
```

Khôi phục ⇒ xanh lại. **Hỏng trước, xanh sau.** `[MEASURED]`

---

## §4 · `P1-3` — BỘ KIỂM NGHIỆP VỤ MD ĐẦU TIÊN

`tests/business/md-formulas.test.mjs` — **59 phép đo · 0 hỏng**.

### 4.1 Vì sao nó là bài kiểm đầu tiên thuộc loại này

Toàn bộ 9 bài kiểm hiện có đo **phân quyền** — *ai đọc được gì, ai ghi được gì*.
⛔ Không bài nào hỏi ***"con số in ra màn hình có ĐÚNG không"***. Hai câu hỏi
khác nhau, và câu thứ hai chưa từng được hỏi trên **19.058 dòng mã MD**.

### 4.2 Phủ gì

| Nhóm | Nội dung |
|---|---|
| ① | Quy đổi vải Kg ⟷ Mét ⟷ Yard — kèm phép **khứ hồi** và chặn chia-cho-0 |
| ② | Định mức BOM — hao hụt dương, bằng 0, và **âm** *(vải đầu tấm tái dùng)* |
| ③ | Hao hụt bàn cắt · số bán thành phẩm dự kiến |
| ④ | **AQL 2.5 · ISO 2859-1** — biên bảng `90/91`, `150/151`, `10001`, vượt bảng |
| ⑤ | Tỷ lệ lỗi · **DHU** · RFT |
| ⑥ | Takt time · hiệu suất chuyền |
| ⑦ | **Quyết toán công nợ nhà thầu** — thứ tự trừ phạt/tạm ứng |
| ⑧ | Tồn an toàn · tiến độ · trễ hạn |
| ⑨ | **Mốc trễ** — chống tái phát `TD-17` |

### 4.3 Ba phép đo đáng kể nhất

| # | Phép đo | Bắt được gì |
|---|---|---|
| `B-1` | 🔑 **Lô 10001 · 14 lỗi Major ⇒ vẫn ĐẠT** | `4.44% > 2.5%` — bài này **RỚT** nếu ai đó thay bảng ISO bằng phép so phần trăm. Chính `garment-math.ts` cảnh báo cái bẫy này ở dòng 45; nay lời cảnh báo **có răng** |
| `B-2` | 🔑 **Tạm ứng ⛔ KHÔNG được trừ trước phạt** | Thứ tự trừ là **quyết định nghiệp vụ**. Đảo thứ tự ⇒ `afterPenalty` sai ⇒ chứng từ đối chiếu với nhà thầu sai |
| `B-3` | 🔑 **`demMocTre` ⟷ `mocTreTheoDon` ra CÙNG số** | Phép kiểm **chống tái phát `TD-17`** ở mức công thức |

Thêm hai biên dễ sai được ghim: **DHU vượt 100% là hợp lệ** *(một SP nhiều lỗi)*
và **mốc đúng ngày hôm nay là CHƯA trễ** *(sai biên này thì mọi mốc của hôm nay
nhảy đỏ ngay từ sáng)*.

### 4.4 Một thay đổi hạ tầng, nói rõ

Bài kiểm **nạp thẳng `.ts`** bằng `--experimental-strip-types` để đo **đúng mã
đang chạy**, ⛔ không đo một bản chép sang `.mjs` — bản chép sẽ lệch đúng vào
ngày công thức đổi mà ⛔ không ai nhớ sửa hai chỗ.

⇒ **CI bump Node `20` → `22`** *(cờ cần Node ≥ 22.6)*. Đây cũng khép một khoảng
lệch có sẵn: máy phát triển chạy Node 24, CI chạy Node 20.

---

## §5 · KẾT QUẢ ĐO

| Cổng | Trước Phase 1 | Sau Phase 1 |
|---|---|---|
| `npm run typecheck` | ✅ sạch | ✅ sạch |
| `npm run lint` | ✅ 0 cảnh báo | ✅ 0 cảnh báo |
| `npm run test:arch` | ✅ **43** đạt · 0 hỏng | ✅ **51** đạt · 0 hỏng |
| Bài kiểm nghiệp vụ MD | ⛔ **⛔ KHÔNG CÓ** | ✅ **59** đạt · 0 hỏng |
| Tổng phép đo tĩnh | **43** | **110** |

**Điều kiện ra Sprint I-2** *(Baseline §3.2)*:

| Điều kiện | Trạng thái |
|---|---|
| `test:arch` có đủ **5 phép kiểm mới** | 🟠 **1/5** — mục ⑫ *(8 phép đo)*. Còn 4, sang Phase 2 |
| **MD có bài kiểm nghiệp vụ** | ✅ **ĐẠT** — 59 phép đo |

---

## §6 · PHASE 2 — ĐỀ XUẤT

| # | Hạng mục | Nợ | Ghi chú |
|---|---|---|---|
| `P2-1` | Phép kiểm **6 cổng Screen Design Gate** | EDD-05 §1.1 | phép kiểm mới #2 |
| `P2-2` | `TD-27` — `.delete()` đổi **ngưỡng → danh sách miễn trừ theo `tệp:dòng`** | `TD-27` | #3 · cùng khuôn với ⑫ |
| `P2-3` | Phép kiểm **`request_id` trên mọi bảng chứng từ** | Playbook XXXIV · ADR-003 | #4 |
| `P2-4` | Phép kiểm **cấm màn hình tự tính** *(Điều V·VII)* | Cổng D | #5 |
| `P2-5` | Bộ kiểm nghiệp vụ **Warehouse** | EDD-06 §7 | four-point · quality |
| `P2-6` | Tách `md-client.tsx` 886/900 dòng | `TD-18` | trước khi chạm trần |

---

## §7 · CHỖ TÔI CÓ THỂ SAI

1. 🔴 **`P1-1` chưa nghiệm thu bằng phiên đăng nhập thật.** Typecheck và lint
   xanh, hàm thuần có bài kiểm — nhưng câu truy vấn `order_milestones` mới thêm
   **chưa từng chạy trên CSDL thật**. CLAUDE.md §5 bước 3–4 đòi đăng nhập bằng
   tài khoản seed và đối chiếu câu select với CSDL đang chạy. **Tôi ⛔ không tự
   làm được việc đó** — ADR-011 §2.4 mục 3.
2. **Mục ⑫ đọc KHO, ⛔ không đọc CSDL đang chạy.** Nó bắt lệch *mã ⟷ migration*;
   lệch *migration ⟷ CSDL* vẫn cần bài kiểm động — đúng bài học `043`.
3. **Phép trích `ALTER TABLE` dùng cửa sổ 600 ký tự** để tìm tên bảng gần nhất
   phía trước. Migration viết theo khuôn khác có thể bị bỏ sót — sót thì cột đó
   ⛔ không được canh, và bài kiểm **⛔ không báo gì**. Đây là điểm mù đã biết.
4. **`chuaPhanLoai` có 8 mục, và tôi là người xếp chúng vào đó.** Nếu tôi xếp
   sai một mục lẽ ra phải sửa ngay, phép kiểm sẽ **hợp thức hoá** chỗ lệch đó.
   `VT-1` *(`orders.status`)* và `VT-2` *(`shipments.status`)* theo tôi cần
   migration + ADR; Board có thể thấy chúng nặng hơn thế.
5. **CI bump Node 20 → 22 chưa chạy thử.** Tôi ⛔ không có CI để đo. Next 14.2
   khai hỗ trợ Node ≥ 18.17 nên rủi ro thấp, nhưng **thấp ⛔ không phải bằng 0**.

---

## THAM CHIẾU

- [`TECHNICAL_FOUNDATION_CERTIFICATE.md`](../audit/TECHNICAL_FOUNDATION_CERTIFICATE.md) — `TFC-001`, điều kiện khởi động
- [`GOVERNANCE_PENDING_REPORT.md`](../audit/GOVERNANCE_PENDING_REPORT.md) — `GPR-001`
- [EDD-06 §7](../enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) · [`ARCHITECTURE_BASELINE.md`](../ARCHITECTURE_BASELINE.md) §3.2
- [`SPRINT_2_PLAN.md`](SPRINT_2_PLAN.md) Luồng 4
- `tests/architecture/vocabulary-baseline.json` — sổ vốn từ trạng thái
- `tests/business/md-formulas.test.mjs` — bộ kiểm nghiệp vụ MD
