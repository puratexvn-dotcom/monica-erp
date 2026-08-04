# BUSINESS KNOWLEDGE BASE — MONICA ONE
## Đặc tả nghiệp vụ chính thức · Official Business Specification

| Trường | Giá trị |
|---|---|
| **Version** | 2.0 |
| **Status** | ✅ **ADOPTED** — Board Decision 04/08/2026 |
| **Ngày hiệu lực** | **2026-08-04** |
| **Thẩm quyền khi được duyệt** | Bậc 0′ — [ADR-010](../adr/ADR-010-thu-bac-van-ban-chuan-tac.md) · đặc tả nghiệp vụ có thẩm quyền cho **mọi** kiến trúc về sau |
| **Người soạn** | Chief Solution Architect · 04/08/2026 |
| **Thẩm quyền yêu cầu** | Board Decision 04/08/2026 |
| **Thay thế** | `BUSINESS_KNOWLEDGE_BASE.md` v1.0 *(bản dựng lại, 04/08/2026)* |
| **Nguồn hợp nhất** | Business DNA v1.0 · MD Discovery Phase 1 · MD Discovery Phase 2 · Bộ phỏng vấn 31 câu · NEEDS_CLARIFICATION |
| **Ngôn ngữ** | Thuật ngữ hiến định giữ nguyên gốc, không dịch — Hiến pháp Điều 45 |

---

> ## ✅ VĂN BẢN NÀY ĐÃ CÓ HIỆU LỰC — Board Decision 04/08/2026
>
> **Nguyên tắc 1: Board là nguồn duy nhất của sự thật nghiệp vụ.** Board đã phê
> chuẩn bản hợp nhất này. Từ 04/08/2026, đây là **đặc tả nghiệp vụ chính thức**
> ở **bậc 0′** — tối cao về *cái gì là thật* trong nghiệp vụ Monica.
>
> 🔓 **Domain Modeling và Enterprise Design đã hoàn tất** trên nền văn bản này —
> xem [`EDD-01`](../enterprise-design/EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) …
> [`EDD-06`](../enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md).
>
> ⚠️ **Ghi chú cũ ở chỗ này từng nói *"văn bản này chưa có hiệu lực"* và *"thi hành
> đóng băng"*.** Cả hai đã được Board dỡ bỏ ngày 04/08/2026. Giữ lại lời ghi nhận
> này theo Hiến pháp §43.7 — không viết lại lịch sử.
>
> ⚠️ **Các câu hỏi mở ở Phần E vẫn còn giá trị.** Phê chuẩn văn bản không có nghĩa
> mọi `OQ` đã được trả lời — nó có nghĩa **những gì đã ghi là đúng**. Xem
> [`EDD-06 §5.3`](../enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) —
> 5 câu còn lại là **dữ liệu chủ**, không chặn kiến trúc.

---

# PHẦN 0 — VỀ TÀI LIỆU NÀY

## 0.1 Hệ phân loại — theo chỉ thị Board

Mọi phát biểu trong tài liệu này mang **đúng một** nhãn phân loại:

| Nhãn | Nghĩa | Được dùng để thiết kế? |
|---|---|---|
| ✅ `Verified` | Board đã phát biểu, hoặc đã đo được bằng chứng cứng | **Có** — sau khi Board duyệt |
| ❓ `Needs Clarification` | Chưa đủ rõ để thiết kế. **Không được suy diễn câu trả lời** | **Không** |
| 🕐 `Future Decision` | Đã biết là có, Board **cố ý hoãn** quyết định | **Không** — nhưng phải chừa đường |

⚠️ **Ba nhãn này phân loại SỰ THẬT NGHIỆP VỤ, không phải tình trạng thi hành.**
Một quy tắc `Verified` vẫn có thể chưa được hệ thống làm. Vì vậy mỗi quy tắc có
**thêm một cột riêng** — *Khoảng cách thi hành* — và cột đó **không** phải một
nhãn phân loại. Trộn hai trục này lại là nguồn gốc của mọi bản đặc tả tự mâu
thuẫn. `[Quyết định thiết kế của kiến trúc sư — xin Board xác nhận]`

## 0.2 Vấn đề "Business Owner" — phải nói trước

Board yêu cầu **mọi quy tắc nghiệp vụ phải có Business Owner**. Nhưng
Discovery Phase 2 Mục 4 và Mục 9 đã xác lập: **quyền sở hữu quyết định trong nhà
máy hiện chưa ai phát biểu** — ai duyệt giá, ai nhận đơn, ai huỷ đơn, ai cho lên
chuyền đều còn trống.

Hai yêu cầu của Board va nhau ở đây: *"mọi quy tắc phải có Business Owner"* và
*"không được suy diễn câu trả lời"*. Tôi giải theo hướng **giữ Nguyên tắc 4**:

| Ký hiệu Owner | Nghĩa |
|---|---|
| **Board** | Board đã tự phát biểu quy tắc ⇒ Board sở hữu nó cho tới khi uỷ quyền cho một chức danh |
| **Architecture Board** | Quy tắc sinh từ Hiến pháp / Playbook, không từ nghiệp vụ |
| ⚠️ **CHƯA CHỈ ĐỊNH** | Chủ sở hữu là một chức danh trong nhà máy mà **chưa ai nói là ai**. Ô này để trống có tên, kèm mã câu hỏi sẽ lấp nó |

**Không một dòng nào trong bảng dưới đây được tôi tự gán chủ sở hữu.**

## 0.3 Hệ mã định danh

| Tiền tố | Dùng cho | Đánh số |
|---|---|---|
| `BR-<MIỀN>-nnn` | Quy tắc nghiệp vụ | mới, liên tục, **không tái sử dụng** |
| `OQ-nnn` | Câu hỏi nghiệp vụ còn mở | **giữ nguyên số** của bộ phỏng vấn 31 câu (`OQ-001` = `Q1`) |
| `CF-n` | Mâu thuẫn giữa các nguồn | **giữ nguyên số** `C1–C8` của `NEEDS_CLARIFICATION.md` |
| `VR-nnn` | Việc xác minh kỹ thuật *(chạy truy vấn · đăng nhập thật)* | mới |
| `FD-nnn` | Quyết định hoãn lại | mới |

Giữ nguyên số của hai bộ cũ là **cố ý**: hàng chục trích dẫn `C2`, `Q16`… đã nằm
trong các tài liệu khác. Đánh số lại sẽ làm chúng trỏ sai.

## 0.4 Bốn tầng kiểm chứng và trần trạng thái

```
Business Knowledge → Constitution → Live Database → Running Application
```

`[VERIFIED]` Kiến trúc sư kiểm được tầng ①②, **một phần** tầng ③ (đọc được lược
đồ và ràng buộc `CHECK`; **không** đọc được `pg_policies`), và **không** kiểm
được tầng ④ — không có trình duyệt nối vào phiên, không nhập được mật khẩu.

⚠️ **Không mục nào trong tài liệu này được gắn `Verified + Implemented`.** Nhãn
đó bắt buộc phải do người xác minh trên ứng dụng đang chạy — [ADR-011 §2.4](../adr/ADR-011-tham-quyen-kien-truc.md).

⚠️ **Bảng rỗng ≠ bảng an toàn.** 8 bảng cốt lõi của MD đang **0 dòng**
`Verified (Database)`. Mọi phép đo phân quyền dựa trên số dòng đều **không mang
thông tin**. Đã xảy ra thật một lần và suýt dẫn tới kết luận sai.

---

# PHẦN A — BUSINESS DNA

## A.1 Bản sắc sản phẩm

| # | Phát biểu | Phân loại |
|---|---|---|
| A1.1 | **MONICA ONE là Enterprise Business Operating System cho NHÀ MÁY MAY GIA CÔNG** — `CMT` · `FOB` · `OEM` · `ODM` | ✅ `Verified` |
| A1.2 | ⛔ **KHÔNG** mô hình hoá như Fashion ERP · Fashion PLM · Retail ERP · Ecommerce Platform | ✅ `Verified` |
| A1.3 | Nghiệp vụ phụ: **bán sỉ · bán lẻ online** | 🕐 `Future Decision` — `FD-001` |
| A1.4 | Sản phẩm khởi đầu từ **Customer Order Lifecycle**, không phải Fashion Product Lifecycle | ✅ `Verified` |

## A.2 Điều gì khiến nhà máy gia công khác một thương hiệu

`[HYPOTHESIS — kiến trúc sư suy từ thực tiễn ngành, Board CHƯA xác nhận]`

> Thương hiệu bán sản phẩm. Nhà máy gia công bán **năng lực sản xuất theo thời
> gian**, dưới hình thức các đơn hàng có ngày giao cố định.

⚠️ Phát biểu này **không** có nguồn Board. Nó được giữ lại vì nó chi phối cách
đọc toàn bộ Phần B, nhưng nó **chưa đủ tư cách** để thiết kế. Nếu Board xác nhận,
nó trở thành `A2.1 Verified`. Nếu không, xoá.

| # | Phát biểu | Phân loại |
|---|---|---|
| A2.1 | Đơn vị tài nguyên khan hiếm là **phút chuyền may (SAM-minute)** trong một khung thời gian | ❓ `Needs Clarification` — `OQ-021` |
| A2.2 | Bốn hình thức gia công khác nhau ở **ai mua NPL**, nên chúng phải **rẽ nhánh quy trình** | ✅ `Verified` *(nguyên tắc)* · ❓ chi tiết ở `OQ-016` |

## A.3 Khách hàng

| # | Phát biểu | Phân loại |
|---|---|---|
| A3.1 | Khách hàng chính là **công ty thương mại (Trading Company)** | ✅ `Verified` |
| A3.2 | Ngoài ra: Brand · Buying Office · Importer · khách lẻ | ✅ `Verified` |
| A3.3 | ⚠️ **Buyer = Customer. KHÔNG có thực thể Buyer riêng** | ✅ `Verified` — mâu thuẫn mã: `CF-1` |

## A.4 Tiêu chí thành công

| # | Phát biểu | Phân loại |
|---|---|---|
| A4.1 | **Giảm sai sót sản xuất** | ✅ `Verified` |
| A4.2 | **Mọi báo cáo phải đối soát ra cùng một con số** | ✅ `Verified` — ⚠️ đây là **ràng buộc kiến trúc**, không phải KPI |
| A4.3 | **Nhất quán quan trọng hơn đẹp mắt** | ✅ `Verified` |

---

# PHẦN B — KIẾN TRÚC NGHIỆP VỤ

## B.1 Vòng đời đơn hàng — 14 bước

✅ `Verified` — thứ tự do Board quy định (Discovery Phase 2 §6)

```
①  Email + Tech Pack từ khách            ⚠️ KHÔNG mặc định qua RFQ
②  Mẫu vật lý / thông tin kỹ thuật đủ
③  Chiết tính                            ⚠️ SAU mẫu, không trước
④  (tuỳ chọn) May mẫu
⑤  Báo giá
⑥  Hợp đồng
⑦  Purchase Order của khách
⑧  Xác định sở hữu NPL cho đơn này
⑨  Phát triển mẫu + họp tiền sản xuất (PP Meeting)
⑩  Phân bổ sản xuất — nội bộ / thuê ngoài / cả hai
⑪  Kiểm chất lượng — QA nội bộ và/hoặc QA của khách
⑫  Xuất hàng
⑬  Hoá đơn
⑭  Thu tiền · công nợ
```

⚠️ **Hai bước Board đảo ngược so với hiểu biết thông thường** — cả hai đều là chỗ
kiến trúc sư từng suy sai: vào đơn **không** bắt buộc qua RFQ; mẫu đi **trước**
chiết tính.

❓ Còn mở: bước nào bắt buộc, bước nào bỏ qua được (`OQ-010` · `OQ-011`); đơn
**kết thúc** ở bước nào (`OQ-035`); đơn **quay lui** được không (`OQ-004`).

## B.2 Bản đồ năng lực — 14 năng lực bắt buộc

| # | Năng lực | Nguồn | Mức | Khoảng cách thi hành `[VERIFIED]` |
|---|---|---|---|---|
| N1 | Quản lý khách hàng | A.3 | Bắt buộc | ⚠️ có, **không xoá được** |
| N2 | Tiếp nhận đơn qua Email + Tech Pack | B.1 ① | Bắt buộc | ⚠️ **Mâu thuẫn** — MD lấy RFQ làm cửa vào |
| N3 | Chiết tính **sau** mẫu vật lý | B.1 ③ | Bắt buộc | ⚠️ **Mâu thuẫn** — không ràng buộc thứ tự |
| N4 | Quản lý hợp đồng | B.1 ⑥ | Bắt buộc | ❌ **không có bảng hợp đồng** |
| N5 | Xác định sở hữu NPL **theo từng đơn** | B.1 ⑧ | Bắt buộc | ⚠️ `order_type` chỉ rẽ nhánh **1 chỗ** |
| N6 | Phát triển mẫu + PP Meeting | B.1 ⑨ | **Năng lực ĐỘC LẬP** | ⚠️ có 7 chặng; giao diện **chỉ ở thế hệ cũ** |
| N7 | Phân bổ sản xuất trong / ngoài / cả hai | B.1 ⑩ | Bắt buộc | ✅ **Khớp** — `assignments` đầy đủ |
| N8 | QA nội bộ **và** QA của khách | B.1 ⑪ | Bắt buộc | ❌ **không phân biệt hai loại** |
| N9 | Theo dõi xuất hàng | B.1 ⑫ | Theo yêu cầu khách | ⚠️ thiếu ETA · booking · container |
| N10 | Hoá đơn · công nợ phải thu · phải trả | B.1 ⑬⑭ | Bắt buộc | ❌ **không có bảng** |
| N11 | Cổng khách hàng | D.1 | Bắt buộc | ⏳ **chưa xác minh** — `VR-001` |
| N12 | Cổng nhà thầu | D.2 | Bắt buộc | ⏳ **chưa xác minh** — `VR-002` |
| N13 | Bảng điều hành cho CEO | C.11 | Bắt buộc | ⏳ có `/giam-doc`, chưa đánh giá |
| N14 | Đối soát số liệu toàn hệ thống | A4.2 | **Tiêu chí thành công** | ❌ tính rải rác nhiều nơi |
| — | **Line Map** | D.1 · D.2 | ? | ❌ **0 kết quả toàn kho** — ❓ chưa rõ nghĩa · `OQ-030` |

**Năm năng lực thiếu hẳn: N4 · N8 · N10 · N14 · Line Map.** Hai trong số đó nằm ở
khâu thu tiền và chất lượng — hai chỗ khách hàng quan tâm nhất.

## B.3 Đối tượng nghiệp vụ

| Đối tượng | Phân loại | Ghi chú |
|---|---|---|
| Khách hàng | ✅ `Verified` | Buyer = Customer |
| Tech Pack | ✅ `Verified` | ❓ có vòng đời/phiên bản riêng không — `OQ-015` |
| Hợp đồng | ✅ `Verified` | Đứng **trước** PO. ❓ thực thể thật hay cách nói — `OQ-009` |
| Purchase Order | ✅ `Verified` | **PO = PO của khách** |
| Chiết tính | ✅ `Verified` | Có phiên bản, có trạng thái |
| Mẫu | ✅ `Verified` | 7 chặng — xem B.4 |
| NPL | ✅ `Verified` | Sở hữu **theo từng đơn** |
| Nhà thầu | ✅ `Verified` | |
| Báo cáo QA | ✅ `Verified` | **HAI loại**: nội bộ và của khách |
| Lô hàng | ✅ `Verified` | ETA · booking · container · chứng từ |
| Hoá đơn | ✅ `Verified` | phụ thuộc `OQ-001` |
| Công nợ | ✅ `Verified` | phải thu · phải trả · nợ khách · nợ nhà thầu |
| **Line Map** | ❓ `Needs Clarification` | `OQ-030` — **không định nghĩa được thì không thiết kế được** |
| Khấu trừ | ❓ `Needs Clarification` | `OQ-017` — Board chưa nhắc tới |
| Nhận NPL của khách | ❓ `Needs Clarification` | `OQ-028` |

## B.4 Máy trạng thái đã được mã hoá

✅ `Verified (Database)` — ràng buộc `CHECK` **là quyết định nghiệp vụ đã mã hoá**,
đây là bằng chứng cứng chứ không phải suy diễn:

| Đối tượng | Trạng thái hợp lệ |
|---|---|
| Hỏi hàng | `NEW → COSTING → QUOTED → WON \| LOST \| CANCELLED` |
| Chiết tính | `DRAFT → SUBMITTED → APPROVED \| REJECTED \| REVISE \| SUPERSEDED` |
| Mã hàng | `DEVELOPMENT → APPROVED → IN_PRODUCTION → DISCONTINUED` |
| **Mẫu** | `PENDING → SENT → APPROVED \| REJECTED \| APPROVED_WITH_COMMENT` |
| **Chặng mẫu** | `PROTO · FIT · SIZE_SET · SMS · PP · TOP · SHIPMENT` |
| Mốc T&A | `PENDING → IN_PROGRESS → DONE \| LATE \| SKIPPED` |
| Đề nghị NPL | `DRAFT → SUBMITTED → APPROVED → ORDERED → RECEIVED \| REJECTED` |
| Lệnh sản xuất | `PENDING → RELEASED → IN_PROGRESS → COMPLETED \| CANCELLED` |
| Yêu cầu thay đổi | `PENDING → APPROVED \| REJECTED → APPLIED` |

> ### ⚠️ Phát hiện cấu trúc quan trọng nhất của Phần B
>
> **Tám bộ trạng thái độc lập, không bộ nào ánh xạ sang bộ nào. Không nơi nào
> định nghĩa *phép chuyển nào hợp lệ* — chỉ định nghĩa *giá trị nào hợp lệ*.**
>
> `[VERIFIED]` Riêng **đơn hàng** thì ngược lại: mã dùng 10 chuỗi trạng thái khác
> nhau nhưng CSDL **không ràng buộc gì cả**. ❓ `OQ-036`

## B.5 Ranh giới phân hệ

✅ `Verified (Architecture)`

**Thuộc MD:** khách hàng · vào đơn · chiết tính · hợp đồng · sở hữu NPL · mẫu ·
phân bổ sản xuất.

**Ngoài MD:** thực thi sản xuất *(Production)* · kiểm chất lượng thực tế
*(Quality)* · nhập xuất tồn *(Warehouse)* · kế toán công nợ *(Finance)* · quản trị
người dùng *(Platform Services)*.

❓ **Hai ranh giới chưa rõ:** `assignments` thuộc MD hay Subcontract (`OQ-032`);
ai sở hữu vòng đời `production_orders` (`OQ-033`).

---

# PHẦN C — SỔ ĐĂNG KÝ QUY TẮC NGHIỆP VỤ

> Mỗi quy tắc có: **Mã · Chủ sở hữu · Nguồn bằng chứng · Tham chiếu Hiến pháp**.
> Cột *Khoảng cách thi hành* là trục riêng, **không phải** nhãn phân loại (§0.1).
> Tham chiếu Hiến pháp ghi ở **cấp Điều** — cấp khoản chỉ ghi khi đã đọc trực tiếp.

## C.1 Bản sắc và phạm vi

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-IDN-001` | MONICA ONE phục vụ nhà máy may gia công `CMT · FOB · OEM · ODM` | ✅ Verified | **Board** | Business DNA A1.1 | Điều 1 · Điều 6 | — |
| `BR-IDN-002` | Cấm mô hình hoá như Fashion ERP / PLM / Retail ERP / Ecommerce | ✅ Verified | **Board** | Business DNA A1.2 | Điều 4 · Điều 6 | — |
| `BR-IDN-003` | Bán sỉ và bán lẻ online là nghiệp vụ **phụ** | 🕐 Future Decision | **Board** | Business DNA A1.3 | Điều 6 | ❌ không có chỗ trong mô hình · `FD-001` |

## C.2 Khách hàng

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-CUS-001` | **Buyer = Customer.** Không có thực thể Buyer riêng | ✅ Verified | **Board** | Business DNA A3.3 | Điều 19 · Điều 20 | ⚠️ **Mâu thuẫn** — `buyer_accounts` ở 4 migration · vai `buyer` 5 lần trong `lib/rbac.ts` · `CF-1` |
| `BR-CUS-002` | Khách chính là công ty thương mại; ngoài ra Brand · Buying Office · Importer · khách lẻ | ✅ Verified | **Board** | Business DNA A3.1–A3.2 | Điều 19 | ⚠️ `customers` không phân loại |
| `BR-CUS-003` | Khách hàng **không xoá được** khỏi hệ thống | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 1 §5 — không có hàm xoá | Điều 39 *(xoá mềm)* | ⚠️ đúng hiện trạng, **chưa biết có chủ ý không** · `OQ-034` |

## C.3 Vào đơn và hợp đồng

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-ORD-001` | Vào đơn: **Email → Tech Pack → PO.** KHÔNG mặc định có RFQ | ✅ Verified | **Board** | Business DNA · Phase 2 §6 ① | Điều 20 | ⚠️ **Mâu thuẫn** — MD lấy tab "Yêu cầu báo giá" làm cửa vào · `OQ-010` |
| `BR-ORD-002` | **PO = PO của khách.** Không tạo mô hình PO nội bộ trừ khi có yêu cầu cụ thể | ✅ Verified | **Board** | Business DNA · Phase 2 §5 | Điều 20 | ❓ `production_orders` là lệnh sản xuất hay PO nội bộ · `CF-3` |
| `BR-ORD-003` | Thứ tự: **Contract → PO → Sản xuất** | ✅ Verified | **Board** | Business DNA · Phase 2 §6 ⑥⑦ | Điều 19 | ❌ **không có bảng hợp đồng** · `OQ-009` |
| `BR-ORD-004` | Ai quyết định **nhận hay từ chối** một đơn, theo tiêu chí gì | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §9 D1 | Điều 20 · Điều 21 | ❌ không có bước duyệt · `OQ-003` |
| `BR-ORD-005` | Một PO **tách / gộp** được thành nhiều đơn sản xuất | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §7 W2 | Điều 20 · Điều 22 | ❌ không có thao tác tách/gộp · `OQ-013` |
| `BR-ORD-006` | **Đơn mẫu** và **đơn sản xuất loạt** là hai loại đơn khác nhau | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §5 E4 | Điều 20 | ❌ `orders` không có cột phân biệt · `OQ-014` |
| `BR-ORD-007` | **Tech Pack có phiên bản**, giữ bản cũ để đối chiếu khi tranh chấp | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §12 C5 | **Điều 8 Evidence First** · Điều 33 | ⚠️ `styles.tech_pack_url` là **một cột**, không có phiên bản · `OQ-015` |

## C.4 Chiết tính và báo giá

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-CST-001` | **Mẫu vật lý → Chiết tính → (may mẫu) → Báo giá.** Mẫu đi **TRƯỚC** chiết tính | ✅ Verified | **Board** | Business DNA · Phase 2 §6 ②③ | Điều 20 | ⚠️ **Mâu thuẫn** — không ràng buộc thứ tự · `OQ-011` |
| `BR-CST-002` | Chiết tính có **phiên bản** và **máy trạng thái** `DRAFT→SUBMITTED→APPROVED\|REJECTED\|REVISE\|SUPERSEDED` | ✅ Verified (Database) | **Board** | ràng buộc `CHECK` · `reviseCosting` | Điều 39 | ✅ khớp |
| `BR-CST-003` | Giá báo cho khách **phải qua duyệt** ở một ngưỡng nào đó | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §4 O1–O2 | Điều 18 · Playbook XXX | ❌ **không có bước duyệt giá nào** · `OQ-002` |
| `BR-CST-004` | Hình thức gia công **rẽ nhánh quy trình** — CMT không mua NPL, FOB thì có | ✅ Verified *(nguyên tắc)* | **Board** | Business DNA A2.2 | Điều 20 · Điều 24 | ⚠️ `order_type` xuất hiện 13 tệp, **rẽ nhánh đúng 1 chỗ** (`po.actions.ts:102`) · `OQ-016` |

## C.5 Nguyên phụ liệu

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-MAT-001` | **Sở hữu NPL quyết định THEO TỪNG ĐƠN** — khách cấp · Monica mua · hỗn hợp | ✅ Verified | **Board** | Business DNA | Điều 20 · Điều 24 | ⚠️ chỉ lưu `order_type`, không mô hình hoá hỗn hợp · `OQ-016` |
| `BR-MAT-002` | Đơn khách cấp NPL: kho **đối chiếu định mức và báo thiếu** | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 1 C9 · Phase 2 §3 | Điều 24 | ❌ **không có bảng nhận NPL** — đơn CMT không có khâu đầu vào · `OQ-028` |
| `BR-MAT-003` | **NPL về trễ**: ai được báo, ai quyết định lùi lịch | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §10 X1 | Điều 21 · Điều 24 | ❌ không có cảnh báo · `OQ-029` |

## C.6 Mẫu

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-SMP-001` | **Monica tự phát triển mẫu** | ✅ Verified | **Board** | Business DNA | Điều 20 | ✅ có `saveSample` |
| `BR-SMP-002` | Có **PP Meeting** (họp tiền sản xuất) | ✅ Verified | **Board** | Business DNA · Phase 2 §6 ⑨ | Điều 21 · Điều 22 | ❌ không thấy mô hình hoá |
| `BR-SMP-003` | **Sample Management là NĂNG LỰC NGHIỆP VỤ ĐỘC LẬP** | ✅ Verified | **Board** | Business DNA | ⚠️ **Hiến pháp không có Điều riêng cho Sample** | ⚠️ giao diện **chỉ ở thế hệ cũ** (`tabs-planning.tsx:219`); Command Center chỉ đếm số lượt |
| `BR-SMP-004` | Bảy chặng mẫu: `PROTO · FIT · SIZE_SET · SMS · PP · TOP · SHIPMENT` | ✅ Verified (Database) | **Board** | ràng buộc `CHECK` trên `sample_submissions` | Điều 20 | ✅ khớp chuẩn ngành |

⚠️ `BR-SMP-003` chỉ ra một **khoảng trống hiến định**: Board xếp Sample Management
là năng lực độc lập, nhưng Hiến pháp PART IV không có Điều nào cho nó. Cần Board
quyết: tu chính Hiến pháp, hay Sample nằm trong Điều 20 Merchandising?

## C.7 Sản xuất và phân bổ

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-PRD-001` | Sản xuất **nội bộ · thuê ngoài · hoặc cả hai** | ✅ Verified | **Board** | Business DNA | Điều 22 · Điều 26 · **MOS Điều II** | ✅ khớp |
| `BR-PRD-002` | **Một PO chia cho nhiều nhà máy; một nhà máy nhận nhiều PO** | ✅ Verified | **Board** | Business DNA | Điều 26 | ✅ `assignments` đầy đủ |
| `BR-PRD-003` | Phân quyền theo **Assignment**, không theo Role. `Identity → Assignment → Resource Scope → Permission → Action` | ✅ Verified | **Architecture Board** | Playbook Điều XXX · ADR-002 · ADR-006 | Điều 26 · Điều 40 | ✅ `lib/mos/permission/` |
| `BR-PRD-004` | **Điều kiện lên chuyền**: mẫu PP đã duyệt + NPL về đủ | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §4 O4 | Điều 21 · Điều 22 | ❓ `production_orders.RELEASED` là cổng kiểm soát hay chỉ là nhãn · `OQ-023` |
| `BR-PRD-005` | **Tiêu chí chọn nhà thầu** cho một đơn | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §9 D4 | Điều 26 | ❌ không có hồ sơ năng lực đối tác · `OQ-024` |
| `BR-PRD-006` | **Đơn vị hoạch định năng lực** — phút chuyền / số chuyền / số công nhân | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §3 · A2.1 | Điều 21 | ❌ **không có mô hình năng lực** — Planning không thiết kế được · `OQ-021` |
| `BR-PRD-007` | **Ưu tiên khi hai đơn tranh một chuyền** | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §9 D8 | Điều 21 | ❌ không có logic xếp lịch · `OQ-007` |

## C.8 Lịch T&A

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-TNA-001` | Lịch T&A tính **ngược** từ một mốc gốc; mẫu lịch theo hình thức gia công | ✅ Verified (Architecture) | ⚠️ CHƯA CHỈ ĐỊNH | `po.actions.ts:102` · `order_milestones` | Điều 21 | ⚠️ ❓ mốc gốc là **ngày xuất xưởng** hay **ngày tàu chạy** · `OQ-022` |
| `BR-TNA-002` | **Trễ mốc T&A ⇒ nâng mức khẩn cấp của đơn** | ✅ Verified (Architecture) | ⚠️ CHƯA CHỈ ĐỊNH | `lib/mos/po-flow.ts:111` | Điều 18 · Điều 21 | 🔴 **BROKEN** — `po-twin.service.ts:132` truyền **hằng số `0`**, mệnh đề không bao giờ đúng |

> ### 🔴 `BR-TNA-002` là quy tắc nghiệp vụ duy nhất trong sổ này đang **CHẾT**
>
> Quy tắc tồn tại trong mã, và không bao giờ chạy. Trong nhà máy gia công, trễ mốc
> T&A là **tín hiệu cảnh báo sớm quan trọng nhất** — nó xuất hiện hàng tuần trước
> khi trễ tàu.
>
> ⚠️ Nó cũng vi phạm **Hiến pháp Điều 8 Evidence First**: một con số bịa được đưa
> vào một phép tính nghiệp vụ. `[VERIFIED]`
>
> 🧊 **Không sửa** — thi hành đang đóng băng theo chỉ thị Board.

## C.9 Chất lượng

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-QUA-001` | **HAI tổ chức QA** — QA nội bộ và QA của khách | ✅ Verified | **Board** | Business DNA | Điều 23 | ❌ `[VERIFIED]` grep `customer_qa` · `buyer_qa` = **0 kết quả** · `OQ-025` |
| `BR-QUA-002` | Chặng kiểm `Inline · Pre-Final · Final · Packing`, **tuỳ yêu cầu từng khách** | ✅ Verified | **Board** | Business DNA | Điều 23 | ❌ `[VERIFIED]` grep 4 chặng = **0 kết quả** · `OQ-026` |
| `BR-QUA-003` | **Hàng trượt AQL**: kiểm lại 100% / giảm giá / huỷ — ai quyết | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §10 X6 | Điều 23 · Điều 27 | ❌ không mô hình hoá · `OQ-027` |

⚠️ `BR-QUA-001` + `BR-ACC-002` cộng lại thành một **rủi ro rò rỉ**: cổng khách bị
cấm xem QA nội bộ, nhưng hệ thống chưa phân biệt được hai loại báo cáo. Nghĩa là
hoặc khách đang xem nhầm, hoặc cổng chưa mở. **Chưa ai đo.**

## C.10 Xuất hàng và tài chính

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-SHP-001` | Theo dõi xuất hàng: ETA · booking · container · chứng từ | ✅ Verified | **Board** | Business DNA · Phase 2 §5 | Điều 25 | ⚠️ `shipments` thiếu trường |
| `BR-SHP-002` | Một PO giao **mấy đợt, mấy cảng** | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §7 W2 | Điều 25 | ❓ quyết định `shipments ↔ orders` là 1-1 hay 1-nhiều — **khó sửa về sau** · `OQ-012` |
| `BR-FIN-001` | **Monica phát hành hoá đơn** | ✅ Verified | **Board** | Business DNA | Điều 27 | ❌ **không có bảng `invoices`** — ⚠️ phụ thuộc `OQ-001` |
| `BR-FIN-002` | Theo dõi **công nợ phải thu · phải trả · nợ khách · nợ nhà thầu** | ✅ Verified | **Board** | Business DNA | Điều 27 | ❌ **không có bảng `payments`** |
| `BR-FIN-003` | **Khấu trừ sau giao hàng** (trễ · lỗi · thiếu số) | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §10 X10 | Điều 27 | ❌ không có khái niệm — doanh thu hệ thống sẽ **luôn cao hơn thực tế** · `OQ-017` |
| `BR-FIN-004` | **Điều kiện thanh toán** — LC / TT trước / TT sau N ngày | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Bộ phỏng vấn Q18 | Điều 27 | ❌ không tính được ngày phải thu · `OQ-018` |
| `BR-FIN-005` | **Công nợ nhà thầu** tính theo sản lượng / mốc / khoán | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Bộ phỏng vấn Q19 | Điều 26 · Điều 27 | ❌ không dựng được con số mà `BR-ACC-003` **bắt buộc** phải cho nhà thầu xem · `OQ-019` |

## C.11 Điều hành

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-EXE-001` | **CEO đăng nhập như mọi người dùng khác** | ✅ Verified | **Board** | Business DNA | Điều 10 · Điều 18 | ⏳ chưa đánh giá |
| `BR-EXE-002` | Bảng điều khiển CEO **cá nhân hoá**: sản xuất · doanh thu · chi phí · tiến độ · vấn đề nóng · việc ưu tiên — **KHÔNG phải bảng dữ liệu thô** | ✅ Verified | **Board** | Business DNA | Điều 18 · Điều 9 | ⏳ có `/giam-doc`, chưa đánh giá |
| `BR-EXE-003` | Định nghĩa **"vấn đề nóng"** | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §13 K4 | Điều 18 | ❌ không định nghĩa được thì bảng điều hành chỉ là bảng số — đúng thứ `BR-EXE-002` cấm · `OQ-006` |

## C.12 Báo cáo và đối soát

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-RPT-001` | **Mọi báo cáo phải đối soát ra cùng một con số** | ✅ Verified | **Board** | Business DNA A4.2 | Điều 29 · Điều 39 | ❌ `[EVIDENCE]` `ceo-report.ts` · `components/report/` · `home-metrics.ts` · service MD — **nhiều nơi tự tính, không có tầng tổng hợp dùng chung** · `CF-8` |
| `BR-RPT-002` | **Con số nào** bắt buộc phải khớp | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §13 K2 | Điều 29 | ❌ không biết phải hợp nhất phép tính nào · `OQ-005` |
| `BR-RPT-003` | Giảm sai sót sản xuất · nhất quán hơn đẹp mắt | ✅ Verified | **Board** | Business DNA A4.1 · A4.3 | Điều 9 · Điều 44 | — |

⚠️ `BR-RPT-001` là **ràng buộc kiến trúc trá hình thành tiêu chí thành công**. Nó
đòi một quyết định: mọi con số phải sinh từ **một nguồn duy nhất** — View, hàm SQL,
hoặc service. Cần ADR riêng **sau khi** `OQ-005` được trả lời.

## C.13 Vòng đời và ngoại lệ

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Nguồn bằng chứng | Hiến pháp | Khoảng cách thi hành |
|---|---|---|---|---|---|---|
| `BR-LFC-001` | Vòng đời đơn hàng gồm **14 bước** — xem B.1 | ✅ Verified | **Board** | Phase 2 §6 | Điều 20 | ⚠️ hệ thống phủ ①–⑫, **đứt ở ⑬⑭** |
| `BR-LFC-002` | **Huỷ đơn**: ai được phép, điều kiện gì, NPL đã mua xử lý ra sao | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 1 §5 · Phase 2 §9 D7 | Điều 20 · Điều 27 · Điều 39 | 🔴 `[VERIFIED]` **Không thao tác nào đặt được `CANCELLED`.** Đơn vào hệ thống là **không bao giờ ra được** · `OQ-004` |
| `BR-LFC-003` | Đơn **kết thúc** ở bước nào — xuất hàng · xuất hoá đơn · hay thu đủ tiền | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §6 L2 | Điều 20 | ❌ không định nghĩa · `OQ-035` |
| `BR-LFC-004` | **Phép chuyển trạng thái nào hợp lệ** cho từng đối tượng | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §8 S1–S2 | Điều 39 | ❌ CSDL chỉ ràng buộc **giá trị**, không ràng buộc **phép chuyển** · `OQ-036` |
| `BR-LFC-005` | Quy trình **thay đổi đơn** sau xác nhận (số lượng · màu · ngày giao) | ❓ Needs Clarification | ⚠️ CHƯA CHỈ ĐỊNH | Phase 2 §7 W1 | Điều 20 | ⚠️ có `change_requests`, **chưa biết có khớp quy trình thật không** |

---

# PHẦN D — RANH GIỚI TRUY CẬP

> ✅ `Verified` — **đây là ranh giới cứng nhất Board đặt ra**, và là phần duy
> nhất của ma trận quyết định đã có nguồn rõ ràng.

## D.1 Cổng khách hàng

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Hiến pháp |
|---|---|---|---|---|
| `BR-ACC-001` | **ĐƯỢC xem:** PO · giao hàng · báo cáo QA · Line Map · tài liệu · dòng thời gian · hoá đơn | ✅ Verified | **Board** | Điều 19 · Điều 40 |
| `BR-ACC-002` | ⛔ **TUYỆT ĐỐI KHÔNG:** thông tin nhà thầu · đơn của khách khác · **chiết tính nội bộ** · **biên lợi nhuận** · QA nội bộ · bình luận nội bộ | ✅ Verified | **Board** | Điều 40 |
| `BR-ACC-005` | Khách hàng: **Đọc · Duyệt · Bình luận · Tải về** — không phải người ghi dữ liệu vận hành | ✅ Verified | **Board** | Điều 19 · Playbook XXX |

## D.2 Cổng nhà thầu

| Mã | Quy tắc | Phân loại | Chủ sở hữu | Hiến pháp |
|---|---|---|---|---|
| `BR-ACC-003` | **ĐƯỢC xem:** PO được giao · tiến độ · báo cáo ngày · Line Map · sản lượng · **đơn giá · thành tiền · công nợ CỦA CHÍNH HỌ** | ✅ Verified | **Board** | Điều 26 · Điều 40 |
| `BR-ACC-004` | ⛔ **KHÔNG:** nhà máy khác · PO khác · thông tin khách hàng | ✅ Verified | **Board** | Điều 40 |
| `BR-ACC-006` | Nhà thầu **BẮT BUỘC GHI** — sản lượng · sự cố · Daily Report. **Không phải người chỉ đọc** | ✅ Verified | **Board** | Điều 26 · Playbook XXX |

## D.3 Nguyên tắc bất đối xứng — điểm tinh tế nhất của mô hình

> ✅ `Verified` **Nhà thầu ĐƯỢC xem giá *của chính họ*. Khách hàng KHÔNG được xem
> giá vốn *của nhà máy*. Hai vế đều là "giá" nhưng thuộc hai lớp bí mật khác nhau.**

| Quyết định xem | Khách hàng | Nhà thầu | Nội bộ |
|---|---|---|---|
| PO của mình | ✅ | ✅ *(phần được giao)* | ✅ |
| Đơn giá của mình | ✅ | ✅ | ✅ |
| **Giá vốn / biên lợi nhuận** | ❌ | ❌ | ✅ |
| QA nội bộ | ❌ | — | ✅ |
| Nhà thầu khác | ❌ | ❌ | ✅ |
| Khách khác | ❌ | ❌ | ✅ |

## D.4 Ba câu hỏi ranh giới còn mở

| Mã | Câu hỏi | Vì sao chặn |
|---|---|---|
| `OQ-031` | Nhà thầu có biết **tên khách hàng cuối** không? Khách có biết **đơn của mình may ở xưởng nào** không? | Không viết được policy RLS cho hai cổng mà không đoán |
| `OQ-020` | Nhà thầu A có xem được đơn giá nhà máy trả cho nhà thầu B không? Có xem được **giá bán cho khách** không? | Quyết định `031c3` siết đúng mức hay siết quá tay |
| `OQ-030` | **Line Map là gì?** | Một năng lực Board bắt buộc ở cả hai cổng mà **không ai biết nó là gì** |

## D.5 🔴 Rủi ro cao nhất toàn tài liệu

| Mã | Rủi ro | Bằng chứng | Việc phải làm |
|---|---|---|---|
| `VR-001` | `BR-ACC-002` có thể **đang bị vi phạm**. Bảng `costings` chứa `target_price` · `quoted_price` · `margin_percent` dường như chạy bằng policy nền `authenticated_only USING (auth.uid() IS NOT NULL)` từ migration `010` | `[EVIDENCE]` Quét 40 migration **không tìm thấy** `CREATE POLICY ... ON costings`. Không bài kiểm nào chạm bảng này | **Chạy truy vấn `pg_policies`** — xem dưới |
| `VR-002` | `BR-ACC-003` có thể **đang bị siết quá tay** — nhà thầu không thấy cả đơn giá của chính mình | `[EVIDENCE]` `031c3` thu hẹp `subcon_orders` theo `assignment_id`. Đo 04/08: subcon mới thấy **0/3** — nhưng tài khoản đó **chưa gắn assignment** nên số 0 không mang thông tin | **Đăng nhập thật** bằng tài khoản `subcon` đã gắn assignment |
| `VR-003` | `style_bom` — bí mật kỹ thuật của khách — có thể cũng không thu hẹp | như `VR-001` | cùng truy vấn |

> ### ⛔ ĐÍNH CHÍNH `VR-001` và `VR-003` — 04/08/2026
>
> **Đã đo xong bằng phiên đăng nhập thật** trên CSDL đang chạy:
> [`docs/audit/VR-001-KET-QUA.md`](../audit/VR-001-KET-QUA.md).
>
> **Cột *Bằng chứng* của hai dòng trên là SAI.** Phép quét migration tìm theo
> khuôn `CREATE POLICY ... ON costings`, không thấy, rồi kết luận trên chỗ không
> tìm thấy. Lớp bảo vệ thật **không đặt theo từng bảng** — nó là hai policy
> `RESTRICTIVE` quét toàn bộ schema: `buyer_denied` (`018:307`) và
> `subcon_denied` (`025:111`).
>
> ⇒ **`BR-ACC-002` KHÔNG bị vi phạm.** Buyer và nhà thầu **không** đọc được
> `costings`, `costing_items`, `style_bom`.
>
> **Nhưng có một vi phạm khác, nặng hơn, ở phía NỘI BỘ** — `F-2`: 23 bảng chạy
> bằng `authenticated_only` = `FOR ALL` + `GRANT ALL`, nên **mọi vai nội bộ đọc,
> sửa và xoá cứng được** cơ cấu giá thành và định mức. Và `F-1`: sổ kiểm toán
> `activity_log` sửa được — đã vá bằng migration `041`.
>
> Xử lý `F-2`: [ADR-018](../adr/ADR-018-thu-hep-authenticated-only.md) — ⏳ chờ
> Board phê duyệt.
>
> Giữ nguyên hai dòng sai bên trên theo **Hiến pháp Điều 43.7** *(không viết lại
> lịch sử)*. Chúng là **tư liệu**, không còn là kết luận có hiệu lực. Bản BKB kế
> tiếp phải viết lại — ghi nhận `TD-22`.

> ### 🔴 `VR-001` · Việc cần Board làm — một truy vấn, một phút
>
> ```sql
> SELECT tablename, policyname, cmd, qual
> FROM pg_policies
> WHERE schemaname = 'public'
>   AND tablename IN ('costings','costing_items','style_bom');
> ```
>
> Chạy trên Supabase SQL Editor. Kiến trúc sư **không chạm được CSDL**.
>
> ⚠️ **Đừng đếm số dòng trong `costings` để kết luận.** Chuyện đó đã xảy ra: đo
> bằng phiên `buyer` ra 0 dòng, nhưng `service_role` cũng ra 0 — **bảng rỗng**,
> nên con số 0 không mang thông tin nào. Phải đọc `pg_policies`.

---

# PHẦN E — SỔ ĐĂNG KÝ CÂU HỎI CÒN MỞ

> **Nguyên tắc 4 của Board: mọi câu hỏi chưa giải vẫn để mở. Không suy diễn câu
> trả lời.** Không mục nào dưới đây được thiết kế cho tới khi có câu trả lời.

## E.1 Mâu thuẫn giữa các nguồn — `CF-1` … `CF-8`

Khác với câu hỏi: đây là chỗ **hai nguồn cùng phát biểu nhưng phát biểu khác nhau**.

| Mã | Mâu thuẫn | Hai bên | Mức |
|---|---|---|---|
| `CF-1` | Buyer = Customer *(Board)* ⟷ có `buyer_accounts` ở 4 migration, vai `buyer` 5 lần, 4 policy `buyer_scope_*` *(mã)* | Board ⟷ mã | 🔴 |
| `CF-2` | Khách không được xem chiết tính/biên LN *(Board)* ⟷ không tìm thấy policy thu hẹp `costings` *(mã)* | Board ⟷ mã | 🔴 → `VR-001` |
| `CF-3` | Không tạo PO nội bộ *(Board)* ⟷ có bảng `production_orders` với `order_no UNIQUE` *(mã)* | Board ⟷ mã | 🟠 |
| `CF-4` | Nhà thầu **được** xem đơn giá của mình *(Board)* ⟷ commit `3f0ef36` coi đó là "rò rỉ giá" và `031c3` đã siết *(lịch sử dự án)* | Board ⟷ lịch sử | 🟠 → `VR-002` |
| `CF-5` | Hai tổ chức QA *(Board)* ⟷ mã không phân biệt *(grep 0 kết quả)* | Board ⟷ mã | 🟡 |
| `CF-6` | Line Map ở cả hai cổng *(Board)* ⟷ 0 kết quả toàn kho *(mã)* | Board ⟷ mã | 🟡 |
| `CF-7` | Bán sỉ · bán lẻ online là nghiệp vụ phụ *(Board)* ⟷ mô hình chỉ nói về gia công | Board ⟷ mô hình | 🟡 → `FD-001` |
| `CF-8` | Mọi báo cáo khớp một con số *(Board)* ⟷ nhiều nơi tự tính độc lập *(mã)* | Board ⟷ mã | 🟠 |

⚠️ **Nguyên tắc 6 áp dụng:** mã được phép sai. Với mọi `CF-*`, mặc định **Board
đúng và mã sai** — nhưng phải xác nhận từng mục, vì có mục là hiểu lầm chứ không
phải lỗi *(`CF-1` có thể chỉ là bảng ánh xạ tài khoản; `CF-3` có thể là lệnh sản
xuất chứ không phải PO nội bộ)*.

## E.2 Câu hỏi nghiệp vụ — `OQ-001` … `OQ-036`

Giữ nguyên số của bộ phỏng vấn 31 câu. **`OQ-032`…`OQ-036` là bổ sung mới** từ
Phase 1 và Phase 2 chưa nằm trong bộ 31.

### Buổi 1 · CEO / Ban giám đốc 🔴 P0

| Mã | Câu hỏi | Chặn cái gì |
|---|---|---|
| **`OQ-001`** | Công ty dùng phần mềm kế toán nào? MONICA **phát hành** hoá đơn hay chỉ **gửi dữ liệu**? | `BR-FIN-001` — có xây `invoices`·`payments` hay không |
| **`OQ-002`** | Merchandiser tự quyết giá không? Ngưỡng nào phải duyệt — giá trị đơn · biên LN · hay khách hàng? | `BR-CST-003` |
| `OQ-003` | Ai quyết nhận / từ chối đơn, theo tiêu chí gì? | `BR-ORD-004` |
| **`OQ-004`** | Ai được huỷ đơn đã xác nhận? **NPL đã mua xử lý ra sao?** | `BR-LFC-002` — **lối thoát duy nhất của vòng đời** |
| **`OQ-005`** | **Con số nào** mà hai phòng báo lệch là không chấp nhận được? | `BR-RPT-002` — tiêu chí thành công quan trọng nhất |
| `OQ-006` | "Vấn đề nóng" là gì — việc gì khiến giám đốc phải can thiệp ngay trong ngày? | `BR-EXE-003` |
| `OQ-007` | Hai đơn tranh một chuyền thì ưu tiên theo gì? | `BR-PRD-007` |
| `OQ-008` | Bán sỉ · bán lẻ online có đi qua MD không, hay hệ thống riêng? | `BR-IDN-003` · `FD-001` |

### Buổi 2 · Merchandiser trưởng 🔴 P0

| Mã | Câu hỏi | Chặn cái gì |
|---|---|---|
| `OQ-009` | Có ký hợp đồng riêng trước PO không? Một hợp đồng nhiều PO hay 1-1? | `BR-ORD-003` — thực thể `contracts` |
| `OQ-010` | Khách quen có phải tạo bản hỏi hàng trước, hay nhập thẳng PO? | `BR-ORD-001` · `CF` cửa vào hệ thống |
| `OQ-011` | Có bao giờ báo giá khi chưa có mẫu vật lý không? Trường hợp nào? | `BR-CST-001` |
| `OQ-012` | Một PO giao **mấy đợt, mấy cảng**? | `BR-SHP-002` — `shipments↔orders` 1-1 hay 1-nhiều, **khó sửa về sau** |
| `OQ-013` | Có tách một PO / gộp nhiều PO thành lô sản xuất không? | `BR-ORD-005` |
| `OQ-014` | Đơn may mẫu có ghi nhận như một đơn hàng không? | `BR-ORD-006` |
| `OQ-015` | Khách sửa Tech Pack giữa chừng có xảy ra không? Cần giữ bản cũ không? | `BR-ORD-007` · Điều 8 Evidence First |
| **`OQ-016`** | Ai và ở bước nào chốt **sở hữu NPL**? Có đơn **hỗn hợp** không? | `BR-MAT-001` · `BR-CST-004` — khác biệt vận hành lớn nhất CMT ⟷ FOB |

### Buổi 3 · Kế toán 🔴 P0

| Mã | Câu hỏi | Chặn cái gì |
|---|---|---|
| `OQ-017` | Khách có trừ tiền vì trễ · lỗi · thiếu số không? Quy tắc cố định hay thương lượng? | `BR-FIN-003` |
| `OQ-018` | Điều kiện thanh toán — LC · TT trước · TT sau N ngày? | `BR-FIN-004` |
| `OQ-019` | Công nợ nhà thầu tính theo sản lượng · mốc · hay khoán? Có giữ lại % không? | `BR-FIN-005` · `BR-ACC-003` |
| `OQ-020` | Nhà thầu A xem được đơn giá của nhà thầu B không? Xem được giá bán cho khách không? | `BR-ACC-003` · `VR-002` |

### Buổi 4 · Kế hoạch + Quản đốc 🟠 P1

| Mã | Câu hỏi | Chặn cái gì |
|---|---|---|
| `OQ-021` | Đơn vị hoạch định năng lực — **phút chuyền · số chuyền · số công nhân**? | `BR-PRD-006` — toàn bộ mô hình Planning |
| `OQ-022` | Lịch T&A lùi từ **ngày xuất xưởng** hay **ngày tàu chạy**? Mốc nào quan trọng? | `BR-TNA-001` |
| `OQ-023` | Bắt buộc mẫu PP duyệt + NPL đủ mới lên chuyền? Ai được phép cho lên khi thiếu? | `BR-PRD-004` |
| `OQ-024` | Chọn xưởng theo gì — giá · năng lực trống · chất lượng · quan hệ? | `BR-PRD-005` |

### Buổi 5 · QA trưởng 🟠 P1

| Mã | Câu hỏi | Chặn cái gì |
|---|---|---|
| `OQ-025` | QA nội bộ và QA của khách là **hai loại chứng từ khác nhau** hay cùng loại khác người ký? | `BR-QUA-001` · `CF-5` |
| `OQ-026` | Chặng nào **luôn làm**, chặng nào **tuỳ khách**? | `BR-QUA-002` |
| `OQ-027` | Lô trượt AQL thì làm gì — kiểm lại 100% · giảm giá · huỷ? Ai quyết? | `BR-QUA-003` |

### Buổi 6 · Kho 🟠 P1

| Mã | Câu hỏi | Chặn cái gì |
|---|---|---|
| `OQ-028` | Khách gửi vải tới, kho có đối chiếu định mức và **báo thiếu** không? Thiếu thì ai chịu? | `BR-MAT-002` — khâu đầu vào của đơn CMT |
| `OQ-029` | NPL về trễ thì ai được báo, ai quyết lùi lịch? | `BR-MAT-003` |

### Buổi 7 · CEO + MD · chốt cổng đối tác 🟡 P2

| Mã | Câu hỏi | Chặn cái gì |
|---|---|---|
| `OQ-030` | **Line Map là gì?** Sơ đồ bố trí chuyền · phân công công đoạn · hay tiến độ theo chuyền? | `CF-6` — năng lực bắt buộc ở cả hai cổng |
| `OQ-031` | Nhà thầu biết tên khách cuối không? Khách biết đơn may ở xưởng nào không? | `BR-ACC-004` · policy RLS hai cổng |

### Bổ sung mới — chưa nằm trong bộ 31

| Mã | Câu hỏi | Nguồn | Chặn cái gì |
|---|---|---|---|
| `OQ-032` | **`assignments` thuộc MD hay thuộc Subcontract?** | Phase 1 §2.3 · §13 Q9 | Ranh giới phân hệ · Hiến pháp Điều 20 ⟷ Điều 26 |
| `OQ-033` | Ai sở hữu vòng đời `production_orders` — MD tạo, phân hệ khác thực thi | Phase 1 §13 Q10 | `CF-3` · ranh giới phân hệ |
| `OQ-034` | Có cần **xoá mềm** cho khách hàng · mã hàng · đơn hàng không? | Phase 1 §13 Q11 | `BR-CUS-003` |
| `OQ-035` | Đơn **kết thúc** ở bước nào — xuất hàng · hoá đơn · hay thu đủ tiền? | Phase 2 §6 L2 | `BR-LFC-003` |
| `OQ-036` | **Phép chuyển trạng thái nào hợp lệ** cho từng đối tượng? Chuyển nào cần duyệt? | Phase 2 §8 S1–S2 | `BR-LFC-004` — 8 máy trạng thái không có luật chuyển |

## E.3 Bốn câu chặn nhiều nhất

Nếu Board chỉ trả lời được bốn câu, chọn bốn câu này:

| Mã | Quyết định điều gì |
|---|---|
| **`OQ-001`** | Có xây `invoices` · `payments` hay không — hai bảng lớn |
| **`OQ-004`** | Lối thoát duy nhất của vòng đời đơn hàng |
| **`OQ-005`** | Tiêu chí thành công quan trọng nhất của Board |
| **`OQ-016`** | Khác biệt vận hành lớn nhất giữa CMT và FOB |

Cộng thêm **`VR-001`** — không phải câu hỏi, mà là một truy vấn một phút.

## E.4 Mười bảy câu đã loại và lý do

Giữ lại để Board kiểm chứng bộ lọc, và để không ai tưởng bị bỏ sót. Nguyên tắc
lọc: *bỏ một câu đi mà kiến trúc không đổi ⇒ xoá câu đó.*

| Câu bị loại | Lý do |
|---|---|
| CEO xem theo ngày/tuần/tháng · có cần xuất Excel-PDF · bảng nào cần phân trang | Giao diện hoặc kỹ thuật, không đổi lược đồ |
| "Sai sót sản xuất" đo bằng gì · KPI báo cho khách · mẫu bị từ chối mấy lần thì báo | Định nghĩa chỉ số, thêm sau được — sau `OQ-005` và `OQ-006` |
| Chứng từ đánh số theo quy tắc nào · bằng chứng lưu bao lâu · đơn lưu trữ bao lâu | Cấu hình hoặc chính sách |
| Ai được xoá bằng chứng · trạng thái nào quay lui được · `SKIPPED` ai được bỏ mốc | Suy được từ `OQ-004` và `OQ-022` |
| Tỷ trọng CMT/FOB · mã hàng dùng lại cho nhiều PO | Không đổi lược đồ — `OQ-016` mới đổi |
| Tích hợp máy chấm công · tích hợp hãng tàu · nhà thầu báo qua Zalo hay MONICA | Ngoài phạm vi, hoặc `OQ-001` đã bao quát |

---

# PHẦN F — QUYẾT ĐỊNH HOÃN LẠI

| Mã | Nội dung | Vì sao hoãn | Phải chừa đường gì |
|---|---|---|---|
| `FD-001` | **Bán sỉ · bán lẻ online** | Board xếp là nghiệp vụ phụ; toàn bộ mô hình hiện chỉ nói về gia công | ❓ `OQ-008` — nếu dùng chung `orders` thì **mô hình đơn hàng phải khác hẳn**. Quyết muộn = di trú dữ liệu |
| `FD-002` | **Tích hợp bên ngoài** — EDI khách · hãng tàu · phần mềm kế toán · máy quét xưởng | Board chưa nhắc tới tích hợp nào. `[VERIFIED]` hệ thống hiện chỉ phụ thuộc Supabase | `OQ-001` chạm phần quan trọng nhất *(kế toán)*. Phần còn lại chưa cần |
| `FD-003` | **Sample Management thành Điều riêng của Hiến pháp** | Board xếp là năng lực độc lập (`BR-SMP-003`) nhưng Hiến pháp PART IV không có Điều cho nó | Cần Board quyết: tu chính Hiến pháp theo Điều 42, hay Sample nằm trong Điều 20 |
| `FD-004` | **Tầng tổng hợp số liệu dùng chung** | `BR-RPT-001` đòi một nguồn duy nhất, nhưng chưa biết **con số nào** | Sau `OQ-005` ⇒ ADR riêng |

---

# PHẦN G — TRUY VẾT VÀ BẰNG CHỨNG

## G.1 Nguồn đã hợp nhất vào bản này

| Nguồn | Vai trò | Địa vị sau khi hợp nhất |
|---|---|---|
| Business DNA v1.0 *(bản tóm tắt trong bộ nhớ tác nhân)* | Phát biểu gốc của Board | ⚠️ Xem §G.2 |
| [`docs/discovery/MD_DISCOVERY_PHASE_1.md`](../discovery/MD_DISCOVERY_PHASE_1.md) | Hệ thống hiện **thực sự** làm gì | Bằng chứng — giữ nguyên, không thay thế |
| [`docs/discovery/MD_DISCOVERY_PHASE_2.md`](../discovery/MD_DISCOVERY_PHASE_2.md) | Nghiệp vụ lấy doanh nghiệp làm trung tâm | Bằng chứng — giữ nguyên |
| [`docs/discovery/MD_BUSINESS_INTERVIEW.md`](../discovery/MD_BUSINESS_INTERVIEW.md) | 31 câu hỏi đã lọc | **Vẫn là công cụ thi hành** để lấp Phần E |
| [`docs/architecture/NEEDS_CLARIFICATION.md`](../architecture/NEEDS_CLARIFICATION.md) | `C1–C8` · `Q1–Q7` | **Được Phần E thay thế** — xem §G.3 |
| [`docs/architecture/CM_OPERATING_MODEL.md`](../architecture/CM_OPERATING_MODEL.md) | Mô hình vận hành dựng độc lập | ⚠️ **§3 đã sai** — xem Phụ lục H |
| [`docs/audit/MD_PRODUCT_AUDIT.md`](../audit/MD_PRODUCT_AUDIT.md) | Audit sản phẩm | Bằng chứng kỹ thuật |

## G.2 ⚠️ Business DNA v1.0 không tồn tại dưới dạng văn bản Board ký

`[VERIFIED]` `find docs -iname "*business*" -o -iname "*knowledge*"` — không có
tệp nào ngoài bộ phỏng vấn. Business DNA chỉ sống trong **bản tóm tắt trong bộ
nhớ làm việc của tác nhân AI**, ghi 03/08/2026.

**Ba hệ quả Board phải biết:**

1. Câu chữ trong Phần A và Phần D có thể đã **trôi** so với phát biểu gốc.
2. Số hiệu mục `§1`–`§15` mà các tài liệu khác đang trích dẫn là **khôi phục từ
   trích dẫn**, không phải từ bản gốc. `[NEEDS-VERIFICATION]`
3. **Hai mục `§10` và `§14` của bản đánh số cũ không có nội dung nào** — không
   trích dẫn nào chạm tới, bộ nhớ không giữ gì. Tôi **không điền**.

⚠️ **Nếu Board còn giữ bản gốc, bản gốc thắng và Phần A · D của tài liệu này phải
bị thay bằng nguyên văn.** Đây là lý do bản này đánh số lại theo `A/B/C/D` thay vì
tiếp tục dùng `§1–§15` — để không giả vờ là bản gốc.

## G.3 Ánh xạ số hiệu cũ → mới

Giữ cho mọi trích dẫn cũ vẫn tra được:

| Nguồn cũ | Mã cũ | Mã mới |
|---|---|---|
| `NEEDS_CLARIFICATION` | `C1`…`C8` | `CF-1`…`CF-8` — **giữ nguyên số** |
| `NEEDS_CLARIFICATION` | `Q1` một PO nhiều đợt giao | `OQ-012` |
| `NEEDS_CLARIFICATION` | `Q2` khấu trừ | `OQ-017` |
| `NEEDS_CLARIFICATION` | `Q3` đơn vị hoạch định | `OQ-021` |
| `NEEDS_CLARIFICATION` | `Q4` nhận NPL khách | `OQ-028` |
| `NEEDS_CLARIFICATION` | `Q5` đơn mẫu / đơn loạt | `OQ-014` |
| `NEEDS_CLARIFICATION` | `Q6` ai duyệt giá | `OQ-002` |
| `NEEDS_CLARIFICATION` | `Q7` vai trò riêng cho Chiết tính·Mua hàng·Kế hoạch | ⚠️ **chưa có mã mới** — xem §G.4 |
| Bộ phỏng vấn | `Q1`…`Q31` | `OQ-001`…`OQ-031` — **giữ nguyên số** |
| Phase 1 §13 | `Q9` · `Q10` · `Q11` | `OQ-032` · `OQ-033` · `OQ-034` |
| Phase 2 §6 · §8 | `L2` · `S1`+`S2` | `OQ-035` · `OQ-036` |

## G.4 Một câu tôi cố ý chưa cấp mã

`NEEDS_CLARIFICATION Q7` — *"Phòng Chiết tính · Mua hàng · Kế hoạch có cần vai trò
đăng nhập riêng không?"* `[VERIFIED]` hiện chỉ `md` và `superadmin` vào được
`/md` (`lib/rbac.ts:77`).

Tôi **chưa cấp mã `OQ`** vì đây là câu hỏi **tổ chức**, không phải quy tắc nghiệp
vụ — và nó chồng lấn với `OQ-002`·`OQ-003`·`OQ-016`, những câu sẽ tự lộ ra ai làm
việc gì. Đề nghị Board: hoãn tới sau Buổi 1 và Buổi 2. **Nếu Board muốn giữ nó
thành câu độc lập, tôi cấp `OQ-037`.**

## G.5 Thống kê

| Chỉ số | Số lượng |
|---|---|
| **Quy tắc nghiệp vụ có mã** | **60** |
| — ✅ `Verified` | **36** |
| — ❓ `Needs Clarification` | **23** |
| — 🕐 `Future Decision` | **1** |
| Quy tắc `Verified` có dấu ✅ ở cột thi hành | **6** — `CST-002` · `SMP-001` · `SMP-004` · `PRD-001` · `PRD-002` · `PRD-003` |
| Quy tắc `Verified` đang có **khoảng cách thi hành** | **19** |
| Quy tắc `Verified` **chưa xác minh được** ⏳ | **11** — 8 quy tắc `BR-ACC-*` phụ thuộc `VR-001`·`VR-002`, cùng `EXE-001`·`EXE-002`·`SHP-001` |
| Quy tắc đang **BROKEN** trong mã | **1** — `BR-TNA-002` |
| Chủ sở hữu = **Board** | **34** |
| Chủ sở hữu = **Architecture Board** | **1** — `BR-PRD-003` |
| Chủ sở hữu ⚠️ **CHƯA CHỈ ĐỊNH** | **25** |
| Mâu thuẫn `CF` | **8** |
| Câu hỏi mở `OQ` | **36** |
| Việc xác minh `VR` | **3** |
| Quyết định hoãn `FD` | **4** |

⚠️ **Hai con số quan trọng nhất bảng này:**

**25 quy tắc chưa có chủ sở hữu** — Phase 2 Mục 4 và Mục 9 (*"ai quyết định cái
gì"*) vẫn trống nguyên. Không luồng phê duyệt nào thiết kế được trước khi lấp xong.

**Chỉ 6 trên 36 quy tắc `Verified` đang thực sự khớp với hệ thống.** Nói cách
khác: **83% những gì Board đã xác nhận là đúng nghiệp vụ thì hệ thống chưa làm
được, làm sai, hoặc chưa ai đo.** Đây là con số đo khoảng cách giữa đặc tả và sản
phẩm, và nó là lý do Board đóng băng thi hành đúng lúc.

---

# PHỤ LỤC H — GIẢ ĐỊNH ĐÃ BỊ BẮT SAI

Giữ vĩnh viễn theo Hiến pháp Điều 43.7. Đây là bằng chứng vì sao Nguyên tắc 3
*(không thiết kế từ mã)* và Nguyên tắc 4 *(khám phá trước thiết kế)* là bắt buộc:
**cả bốn đều là chỗ kiến trúc sư tự tin, không phải chỗ phân vân.**

| # | Đã suy | Sự thật | Quy tắc đúng |
|---|---|---|---|
| H1 | Vòng đời bắt đầu bằng **RFQ / hỏi hàng** | Email → Tech Pack → PO | `BR-ORD-001` |
| H2 | **Báo giá đi trước mẫu** | Mẫu vật lý đi **trước** chiết tính | `BR-CST-001` |
| H3 | Khách **chỉ định nhà cung cấp vải** *(nominated supplier)* | Board không nhắc tới — hạ xuống `NEEDS-VERIFICATION` | ⚠️ **đã gỡ khỏi mọi quy tắc** |
| H4 | Nhận PO khách rồi **tạo đơn nội bộ** | **PO = PO của khách** | `BR-ORD-002` |

Cả bốn sinh từ cùng một hành vi: **lấy kinh nghiệm ngành chung lấp vào chỗ Board
chưa phát biểu.**

⚠️ **Hệ quả với `CM_OPERATING_MODEL.md`:** Mục 3 *(vòng đời 15 bước)* và Mục 1.3
của tài liệu đó **được xây trên H1–H4**. Chúng **không** được dùng làm nguồn thiết
kế. Tài liệu giữ lại làm hồ sơ lịch sử; **Phần B của bản này thay thế nó.**

---

# PHẦN I — VIỆC CẦN BOARD, XẾP THEO THỨ TỰ

| # | Việc | Chi phí Board | Mở khoá |
|---|---|---|---|
| 1 | 🔴 **Chạy truy vấn `VR-001`** | 1 phút | `CF-2` — biết đây là "không có gì" hay "dừng mọi thứ" |
| 2 | Xác nhận **§G.2** — bản hợp nhất có trung thành không; còn bản gốc thì nộp bản gốc | 1 lượt đọc | Toàn bộ Phần A · D |
| 3 | Xác nhận **§0.1** — tách *phân loại sự thật* khỏi *khoảng cách thi hành* | 1 quyết định | Cấu trúc tài liệu |
| 4 | Xác nhận **§0.2** — cách xử lý ô Business Owner còn trống | 1 quyết định | 20 ô chủ sở hữu |
| 5 | Phán quyết **`CF-1` · `CF-3` · `CF-4`** — ba câu domain model | 1 buổi | Domain Modeling |
| 6 | **Buổi 1 + Buổi 3** của bộ phỏng vấn | ~70 phút | 12 câu 🔴 P0 |
| 7 | Buổi 2 · 4 · 5 · 6 · 7 | ~2 giờ 10 | 19 câu còn lại |
| 8 | **Phê duyệt tài liệu này** ⇒ `Status: ADOPTED` | — | 🔓 **Domain Modeling được phép bắt đầu** |

---

## REFERENCES

- **Board Decision 04/08/2026** — mục tiêu 1–5 · thi hành đóng băng
- **Board Directive 04/08/2026** — Nguyên tắc 1 · 2 · 3 · 4 · 5 · 6 · 7
- [ADR-010](../adr/ADR-010-thu-bac-van-ban-chuan-tac.md) — thẩm quyền bậc 0′
- [ADR-011](../adr/ADR-011-tham-quyen-kien-truc.md) — trần trạng thái tự cấp · phản biện bắt buộc
- Hiến pháp [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) `v1.5` — Điều 8 · 18–29 · 39 · 40 · 42 · 43.7 · 45
- [`docs/ENGINEERING_PLAYBOOK.md`](../ENGINEERING_PLAYBOOK.md) — Điều XXX phân quyền theo Assignment
- [`docs/MONICA_CONSTITUTION.md`](../MONICA_CONSTITUTION.md) — MOS Điều II Hybrid Manufacturing
