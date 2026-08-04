# EDD-01 · ENTERPRISE DESIGN DOCUMENT
## Phase 1 · Business Model  ·  Phase 2 · Capability Model  ·  Phase 3 · Domain Model

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-01 |
| **Sprint** | Enterprise Business Design · Sprint 1 |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Trạng thái** | ⏳ **CHỜ PHÊ DUYỆT** |
| **Phase phủ** | 1 · 2 · 3 |
| **Thay thế** | `TARGET_ARCHITECTURE.md` §1 (Domain) — bản đó trở thành hồ sơ lịch sử |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor cho tới khi Board ký duyệt toàn bộ Enterprise Business Design |

---

# §0 · PHƯƠNG PHÁP VÀ CÁCH ĐỌC

## 0.1 Thứ tự tư duy bắt buộc — Board Directive

```
Business → Enterprise → Capability → Domain → Business Object → Operating Model
  → Information Architecture → Document Architecture → Workflow → Rule
  → Permission → Workspace → Module → UI → API → Database → Code
```

**EDD-01 phủ bốn ô đầu.** Không ô nào phía sau được thiết kế trong tài liệu này — kể cả khi tôi đã biết câu trả lời. Nhảy bước là thứ đã tạo ra 87 bảng không ai sở hữu.

## 0.2 Ba nhãn bằng chứng — giữ nguyên từ ADR-011

| Nhãn | Nghĩa |
|---|---|
| ✅ `VERIFIED` | Joseph/Board đã phát biểu, hoặc đo được bằng chứng cứng |
| 🔬 `ANALYSIS` | Kết luận của kiến trúc sư từ dữ kiện đã có — **có thể sai, đã ghi rõ vì sao chọn** |
| 📚 `INDUSTRY` | Thực tiễn ngành may gia công — **không phải sự thật về Monica** |

⚠️ **Không phát biểu nào trong tài liệu này về Monica được gắn `VERIFIED` nếu Joseph chưa nói.**

## 0.3 Nguyên tắc thiết kế cho thương mại hoá

Mọi quyết định trong tài liệu này chịu **phép thử hai chiều**:

| Chiều | Câu hỏi |
|---|---|
| **Monica hôm nay** | Nhà máy 70% CMT, ~6 chuyền, kiêm nhiệm nhiều vai — thiết kế này **có chạy được không**? |
| **Doanh nghiệp thứ 100** | Nhà máy 100% FOB, 4 nhà máy, có IE, có phòng mua, không thuê ngoài — thiết kế này **có phải viết lại không**? |

**Thiết kế nào chỉ đạt một chiều đều bị loại.** Đây là ràng buộc khắt khe nhất của toàn bộ tài liệu, và nó là lý do nhiều quyết định dưới đây trông "thừa" so với nhu cầu Monica hôm nay.

---

---

# PHASE 1 · ENTERPRISE BUSINESS MODEL

> **Câu hỏi:** *Monica Garment thực sự là doanh nghiệp như thế nào?*

---

## 1.1 BUSINESS MODEL

### 1.1.1 Monica bán cái gì — phát biểu nền tảng

> ✅ **Monica không bán quần áo. Monica bán NĂNG LỰC SẢN XUẤT ĐƯỢC CHUYỂN HOÁ THÀNH HÀNG HOÁ THEO MỘT NGÀY GIAO CỐ ĐỊNH.**

Đây không phải cách nói. Nó là **phát biểu kiến trúc**, và nó phân biệt Monica ONE với mọi ERP thời trang trên thị trường:

| | Thương hiệu / Nhà bán lẻ | **Nhà máy gia công** |
|---|---|---|
| Đơn vị bán | SKU | 🔴 **Phút chuyền trong một khung thời gian** |
| Tài nguyên khan hiếm | vốn · kênh phân phối · thị hiếu | 🔴 **Năng lực × thời gian** |
| Rủi ro chính | hàng tồn không bán được | 🔴 **Chuyền đứng · giao trễ · khấu trừ** |
| Vòng đời trung tâm | Product Lifecycle | 🔴 **Customer Order Lifecycle** |
| Thất bại điển hình | dự báo sai nhu cầu | **cam kết vượt năng lực** |

**Hệ quả kiến trúc:** SAP FMS · BlueCherry · Infor M3 Fashion đều mô hình hoá *mùa · bộ sưu tập · SKU · kênh*. Monica ONE mô hình hoá *đơn hàng · năng lực · thời gian · bằng chứng*. **Hai bộ xương khác loài — không mượn được.**

### 1.1.2 Hai mô hình kinh doanh dưới một mái nhà

> ✅ `VERIFIED` · Joseph 04/08: **FOB ~30% · CMT ~70%**

```
┌─────────────────────── CMT · 70% ──────────────────────────┐
│ Khách cấp NPL → Monica cắt, may, hoàn thiện → giao         │
│ Doanh thu   = PHÍ GIA CÔNG (nhân công + chi phí + lãi)     │
│ Rủi ro NPL  = 0                                            │
│ Vốn lưu động= THẤP                                         │
│ Biên LN     = thấp trên doanh thu, CAO trên vốn bỏ ra      │
│ Thất bại    = chuyền đứng · trễ · lỗi chất lượng           │
└────────────────────────────────────────────────────────────┘

┌─────────────────────── FOB · 30% ──────────────────────────┐
│ Monica mua NPL → sản xuất → giao trọn gói                  │
│ Doanh thu   = TRỌN GÓI (NPL + gia công + lãi)              │
│ Rủi ro NPL  = CAO — giá · chất lượng · thời gian giao       │
│ Vốn lưu động= CAO — ứng tiền mua NPL trước khi thu          │
│ Biên LN     = cao trên doanh thu, THẤP hơn trên vốn         │
│ Thất bại    = NPL trễ · mua sai · sai định mức · lỗ tỷ giá │
└────────────────────────────────────────────────────────────┘
```

> ### 🔬 `ANALYSIS` — kết luận quan trọng nhất Phase 1
>
> **FOB KHÔNG PHẢI "CMT cộng thêm mua hàng".** Đó là hai mô hình kinh doanh khác nhau về **rủi ro, vốn, chu kỳ tiền và kiểu thất bại**.
>
> Mọi ERP tổng quát coi FOB là CMT + một module Purchasing. Hệ quả: chúng **không mô hình hoá được** rằng một đơn FOB trễ NPL 2 tuần là *lỗ vốn lưu động + phạt trễ + chuyền đứng*, trong khi một đơn CMT trễ NPL là *chuyền đứng, khách chịu trách nhiệm*.
>
> **Monica ONE phải mô hình hoá hai chuỗi rủi ro riêng biệt ngay từ tầng Domain**, không phải ở tầng cấu hình.

### 1.1.3 Business Model Canvas — bản ngành may gia công

| Khối | Nội dung | Nhãn |
|---|---|---|
| **Phân khúc khách** | Công ty thương mại *(chính)* · Brand · Buying Office · Importer · khách lẻ | ✅ |
| **Giá trị mang lại** | Giao đúng hạn · đạt chuẩn buyer · năng lực linh hoạt *(nội bộ + thuê ngoài)* · giá cạnh tranh · **minh bạch tiến độ** | 🔬 |
| **Kênh** | Quan hệ trực tiếp · email · 🆕 **Customer Portal** | ✅ |
| **Quan hệ khách** | Dài hạn, lặp lại theo mùa · dựa trên độ tin cậy giao hàng | 📚 |
| **Dòng doanh thu** | Phí gia công *(CMT)* · trọn gói *(FOB)* · ❓ phí mẫu | ✅ |
| **Tài nguyên chính** | 🔴 **Năng lực chuyền** · thợ có tay nghề · quan hệ buyer · **vốn lưu động (FOB)** · quan hệ nhà thầu | 🔬 |
| **Hoạt động chính** | Giành đơn · phát triển mẫu · mua NPL *(FOB)* · sản xuất · đảm bảo chất lượng · giao hàng | ✅ |
| **Đối tác chính** | Nhà thầu may · xưởng in/thêu · NCC vải & phụ liệu · forwarder · MISA | ✅ |
| **Cấu trúc chi phí** | NPL *(60–70% giá trị đơn FOB)* · nhân công trực tiếp · chi phí xưởng · phí gia công ngoài · logistics | 📚 |

### 1.1.4 Kinh tế đơn vị — nơi Monica thật sự kiếm và mất tiền

```
        ĐƠN CMT                              ĐƠN FOB
  Giá gia công/chiếc  100%           Giá trọn gói/chiếc     100%
  ├ Nhân công          45%           ├ NPL                   62%
  ├ Chi phí xưởng      30%           ├ Nhân công             17%
  ├ Gia công ngoài      8%           ├ Chi phí xưởng         11%
  └ LÃI GỘP            17%           ├ Logistics/tài chính    4%
                                     └ LÃI GỘP                6%

  🔴 Ăn mòn lãi:                     🔴 Ăn mòn lãi:
   · chuyền đứng                      · tất cả của CMT, CỘNG:
   · làm lại                          · giá NPL biến động
   · hao hụt vượt định mức            · NPL trễ → chuyền đứng
   · phạt trễ giao                    · thừa NPL sau đơn
   · khấu trừ chất lượng              · chênh tỷ giá USD/VND
```

> 🔬 `ANALYSIS` **Tỷ trọng là minh hoạ ngành, không phải số liệu Monica.** Điều đúng bất kể tỷ lệ thật: **biên lãi của FOB mỏng hơn và có nhiều đường mất tiền hơn**. Đó là lý do Procurement phải là Domain đầy đủ dù chỉ phục vụ 30% đơn — 30% đơn đó mang **phần lớn rủi ro tài chính**.

---

## 1.2 VALUE CHAIN

### 1.2.1 Chuỗi giá trị — bản ngành may gia công

```
╔══════════════════ HOẠT ĐỘNG CHÍNH ═══════════════════════════════════════╗
║                                                                          ║
║  ① GIÀNH   ② ĐỊNH    ③ CAM KẾT  ④ CUNG    ⑤ SẢN     ⑥ GIAO   ⑦ THU     ║
║    VIỆC      NGHĨA      & LẬP      ỨNG       XUẤT      HÀNG     TIỀN     ║
║             SẢN PHẨM    KẾ HOẠCH   NPL      & KIỂM                       ║
║      │         │          │         │         │         │        │       ║
║   Inquiry   TechPack   Order     PO mua   CutTicket  Booking  Invoice    ║
║   Quote     Sample     T&A       Nhận     Bundle     Packing  Payment    ║
║   Contract  BOM        Capacity  Kho      Inspection Export   Debt       ║
║             SMV        ProdOrder Cấp phát Assignment Doc      Deduction  ║
╚══════════════════════════════════════════════════════════════════════════╝
╔══════════════════ HOẠT ĐỘNG HỖ TRỢ ══════════════════════════════════════╗
║  Kỹ thuật công nghiệp (SMV·phương pháp)  ·  Nhân sự & tay nghề            ║
║  Tài sản & bảo trì  ·  Tuân thủ & kiểm định  ·  Nền tảng thông tin        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### 1.2.2 🔴 Nơi giá trị được TẠO ra và nơi giá trị bị PHÁ HUỶ

Đây là phân tích quan trọng nhất trong Phase 1, vì nó **quyết định ERP phải làm gì**.

| Tạo giá trị | Cơ chế |
|---|---|
| **Chuyển hoá** *(cắt · may · hoàn thiện)* | Hoạt động duy nhất khách trả tiền cho |
| **Điều phối** *(merchandising)* | Biến cam kết thành việc chạy được |
| **Đảm bảo chất lượng** | Ngăn khấu trừ và trả hàng |

| 🔴 Phá huỷ giá trị | Bản chất | ERP giải bằng |
|---|---|---|
| **CHỜ ĐỢI** — NPL trễ · mẫu nằm ở khách · chờ duyệt · chờ kiểm | ⏱ **vấn đề THỜI GIAN + THÔNG TIN** | Work Inbox · cảnh báo sớm · đồng hồ đếm |
| **LÀM LẠI** — lỗi phải sửa | 🔬 vấn đề chất lượng | Kiểm trong chuyền · CAPA |
| **NĂNG LỰC BỎ TRỐNG** — chuyền không có việc | 📅 vấn đề hoạch định | Mô hình năng lực · CTP |
| **CAM KẾT VƯỢT KHẢ NĂNG** | 📅 vấn đề hoạch định | CTP tại cổng xác nhận đơn |
| **KHẤU TRỪ** — trễ · lỗi · thiếu | 💰 hệ quả của bốn cái trên | Bằng chứng · đối chiếu |
| **HAO HỤT NPL** vượt định mức | 📦 vấn đề vật tư | Sổ tồn · trả về · đối chiếu định mức |

> ### 🔬 `ANALYSIS` — mệnh đề định hướng toàn bộ sản phẩm
>
> **Bốn trong sáu nguồn phá huỷ giá trị lớn nhất là vấn đề THỜI GIAN và THÔNG TIN, không phải vấn đề GHI CHÉP.**
>
> ⇒ Monica ONE **không được** thiết kế như một hệ thống nhập liệu có báo cáo. Nó phải được thiết kế như một **hệ thống phát hiện sớm và điều phối**.
>
> Đây là lý do `Work Inbox`, `Exception`, `Critical Path`, `CTP` và `Line Map` là **năng lực cốt lõi**, không phải tính năng phụ trợ. Và là lý do một ERP chỉ ghi chép — dù đầy đủ tới đâu — **không giải quyết được vấn đề của Monica**.

---

## 1.3 OPERATING MODEL

### 1.3.1 Phân loại theo khung MIT CISR

Khung Ross/Weill phân bốn kiểu mô hình vận hành theo hai trục: **chuẩn hoá quy trình** × **tích hợp dữ liệu**.

| | Tích hợp dữ liệu THẤP | Tích hợp dữ liệu CAO |
|---|---|---|
| **Chuẩn hoá quy trình THẤP** | Diversification | 🔵 **COORDINATION** ← *Monica hôm nay* |
| **Chuẩn hoá quy trình CAO** | 🟢 **REPLICATION** ← *cần cho thương mại hoá* | 🔴 **UNIFICATION** ← *đích của Monica* |

| Trạng thái | Đặc điểm | Nhãn |
|---|---|---|
| **Hôm nay · Coordination** | Chia sẻ khách hàng và dữ liệu giữa nội bộ và nhà thầu, nhưng **quy trình chưa chuẩn hoá** — thoả thuận kế hoạch bằng miệng, không có cổng kiểm soát, mỗi người làm theo cách riêng | 🔬 |
| **Đích Monica · Unification** | Một quy trình chuẩn, một nguồn dữ liệu, nội bộ và thuê ngoài cùng mô hình | 🔬 |
| **Đích thương mại hoá · Replication** | Quy trình chuẩn **nhân bản** sang doanh nghiệp khác, dữ liệu tách biệt theo tenant | 🔬 |

> **Hệ quả kiến trúc:** Monica ONE phải **đồng thời** đạt Unification *(cho Monica)* và Replication *(cho 100 doanh nghiệp)*. Hai thứ này va nhau ở **cấu hình**: quá cứng thì không nhân bản được, quá mềm thì mỗi khách một nhánh mã.
>
> 🔴 **Ranh giới tôi đề nghị chốt ngay tại Phase 1:**
>
> | ⛔ BẤT BIẾN — không cấu hình được | ✅ CẤU HÌNH ĐƯỢC theo doanh nghiệp |
> |---|---|
> | Ranh giới Domain | Domain nào bật/tắt *(Activation Model)* |
> | Aggregate và luật sở hữu dữ liệu | Ngưỡng duyệt · giá trị · % |
> | Tập trạng thái và **phép chuyển hợp lệ** | Ai giữ Role nào |
> | Luật phân tách nhiệm vụ | Mẫu lịch T&A · chặng kiểm |
> | Mô hình bằng chứng | Nhãn hiển thị · ngôn ngữ · đơn vị đo |
> | Ranh giới bảo mật cổng đối tác | Luật sinh việc trong Work Inbox |
>
> **Doanh nghiệp nào cũng chạy được cùng một bộ mã. Không có nhánh riêng cho khách hàng.**

### 1.3.2 Quyền quyết định — hiện trạng

> ✅ `VERIFIED` · Joseph

```
CEO (Joseph)          ── định hướng · rủi ro lớn
     │
GĐSX (anh Dũng)       ── 🔴 DUYỆT GIÁ BÁN + duyệt mua NPL + điều hành sản xuất
     │                      + thống nhất kế hoạch với MD
     ├── Merchandising ── vào đơn · chiết tính · T&A · kiêm MUA HÀNG
     ├── Tổ trưởng     ── chuyền
     └── Nhà thầu      ── phần được giao
QA                    ── chất lượng
Kho                   ── vật tư
Kế toán               ── MISA · công nợ
```

| 🔬 Nhận định | Nội dung |
|---|---|
| **Điểm mạnh** | Quyết định nhanh, ít tầng. Đúng cho quy mô hiện tại |
| 🔴 **Rủi ro cấu trúc** | GĐSX nắm **giá bán + giá mua + sản xuất**. Ba thẩm quyền nhạy cảm nhất, không ai đối trọng, và ba thứ đó có **động cơ xung đột nhau** |
| **Điểm chết** | Một người duyệt giá duy nhất ⇒ anh Dũng nghỉ thì **mọi báo giá đứng** |
| **Đề nghị** | Không đổi người. Thêm ba cơ chế chi phí bằng 0: hiện giá lần trước khi duyệt · uỷ quyền có thời hạn · báo cáo tháng các lần duyệt dưới ngưỡng. Xem `BDR-03` |

---

## 1.4 ORGANIZATION MODEL

### 1.4.1 Ba thang quy mô — và Monica ở đâu

| | 🟢 **NHỎ** | 🔵 **VỪA** ← *Monica* | 🔴 **LỚN** |
|---|---|---|---|
| Công nhân | < 200 | 200 – 1.000 | > 1.000 |
| Chuyền | 1 – 4 | 4 – 20 | > 20 |
| Nhà máy | 1 | 1 – 3 | nhiều · nhiều pháp nhân |
| Bộ phận riêng | không có | **một phần** | đầy đủ |
| Kiêm nhiệm | rất nhiều | 🔵 **nhiều** | ít |
| IE riêng | ❌ | ⚠️ hiếm | ✅ |
| Planning riêng | ❌ | ⚠️ đôi khi | ✅ |
| Procurement riêng | ❌ | ⚠️ đôi khi | ✅ |

> ### 🔴 Nguyên tắc tổ chức — quan trọng nhất cho thương mại hoá
>
> **ERP KHÔNG ĐƯỢC MÃ HOÁ SƠ ĐỒ TỔ CHỨC.**
>
> Bằng chứng vì sao: `lib/rbac.ts` hôm nay có `hoanthanh → ['/hoan-thanh', '/to-truong-hoan-thanh']` và `ketoanvattu → ['/kho', '/ke-toan']` — **hai vết vá sinh ra vì Workspace mang tên chức danh**. Danh sách vá đó sẽ dài thêm mỗi lần Monica tuyển một vị trí mới, và sẽ **hoàn toàn sai** với doanh nghiệp thứ hai.
>
> **Mô hình đúng:**
> ```
> Person ──n:m──▶ Role ──▶ Capability      "được làm gì"
>          └──▶ OrgScope                    "ở nhà máy/kho/khách nào"
> Assignment ──▶ ResourceScope              "trên đối tượng cụ thể nào"
> ```
> Doanh nghiệp nhỏ: **một người giữ 6 Role**. Doanh nghiệp lớn: **sáu người, mỗi người một Role**. **Cùng một bộ mã. Không một dòng khác biệt.**

---

## 1.5 COMMERCIAL MODEL

| Khía cạnh | Nội dung | Nhãn |
|---|---|---|
| **Cửa vào đơn hàng** | Hai cửa **ngang hàng**: ① Email + Tech Pack *(khách quen)* · ② Inquiry *(khách mới · yêu cầu báo giá · yêu cầu may mẫu)* | ✅ |
| **Cấu trúc giá CMT** | `CM = SMV × đơn giá phút + phân bổ chi phí + lãi` | 📚 |
| **Cấu trúc giá FOB** | `= NPL + CM + logistics + tài chính + lãi` | 📚 |
| 🔴 **Duyệt giá** | **Chỉ GĐSX** — không phân ngưỡng | ✅ |
| **Chuỗi cam kết** | Inquiry *(tuỳ chọn)* → Sample → Costing → Quotation → **Contract** → PO khách | ✅ |
| **Điều kiện thanh toán** | ❓ chưa rõ — mô hình hoá hỗ trợ LC · TT trước · TT sau N ngày | 🔬 |
| **Khấu trừ** | ❓ chưa xác nhận — mô hình hoá **bắt buộc phải có**, vì không có nó thì đối chiếu MISA không giải thích được chênh lệch | 🔬 |
| **Rủi ro tập trung khách** | ❓ chưa đo — mô hình hoá `CustomerConcentration` như chỉ số điều hành | 🔬 |

> 🔬 **Nhận xét về thứ tự Sample → Costing:** Joseph xác nhận mẫu đi **trước** chiết tính. 📚 Điều này **khác thực tiễn phổ biến** *(nhiều nhà máy báo giá sơ bộ trước khi may mẫu để sàng lọc)*. Nó có nghĩa Monica **đầu tư công phát triển mẫu trước khi biết đơn có thắng không** — chi phí thật, chưa ai đo.
>
> ⇒ Mô hình hoá **`SampleCost` và `SampleIterationCount`** để Monica đo được chi phí phát triển mẫu trên mỗi đơn thắng. Không đổi quy trình; chỉ làm cho chi phí nhìn thấy được.

---

## 1.6 MANUFACTURING MODEL

| Khía cạnh | Nội dung | Nhãn |
|---|---|---|
| **Hệ sản xuất** | 📚 **Progressive Bundle System (PBS)** — suy từ việc Monica theo dõi *"theo bó"* | 🔬 |
| **Theo dõi sản lượng** | ✅ **Bó × công đoạn × giờ × ngày** — 🔴 **trên mặt bằng ngành** | ✅ |
| **Cấu trúc** | Nhà máy → Xưởng → Bộ phận → Chuyền → Trạm | 🔬 |
| **13 công đoạn dòng chảy** | Kho NPL · Cắt · In · Thêu · Ép · May · QC Inline · Hoàn thành · Ủi · Gấp · Đóng gói · Thành phẩm · Xuất hàng | ✅ |
| **Make / Buy** | Nội bộ + nhà thầu may + **xưởng in/thêu chuyên biệt** | ✅ |
| 🔴 **Rời khỏi nhà máy rồi quay lại** | In · Thêu — chi tiết đã cắt **rời khỏi nhà máy** rồi về | 🔬 |
| **Đơn vị năng lực** | ❌ chưa có · đề xuất **tuần-chuyền** *(§3 Phase 3)* | 🔬 |
| **Thời gian chuẩn** | ❌ **chưa có** — 🔴 khoảng trống nghiêm trọng nhất | ✅ |

> ### 🔴 `ANALYSIS` — nghịch lý lớn nhất của Monica
>
> **Monica có dữ liệu sản lượng ở mức hạng nhất, và không tính được hiệu suất.**
>
> ```
> Hiệu suất = (Sản lượng × THỜI GIAN CHUẨN) ÷ (Nhân lực × Phút làm việc)
>                          ▲
>                    Monica KHÔNG CÓ số này
> ```
>
> Thiếu **một** con số làm mất **bốn** năng lực cùng lúc: đo hiệu suất · tính năng lực · tính giá vốn công · trả lương sản phẩm công bằng.
>
> Và Monica ở vị thế đặc biệt để lấp: các nhà máy khác phải **thuê IE bấm giờ hàng tháng**. Monica đã có **100% dữ liệu thực tế** — chỉ cần một ước lượng ban đầu, hệ thống tự học từ dữ liệu đã có sau mỗi đơn. **Đây là hạng mục giá trị/chi phí cao nhất toàn dự án.**

---

## 1.7 SUPPLY CHAIN MODEL

```
════════════ CHUỖI CMT · 70% ═══════════════════════════════════════════
 Khách mua NPL ─▶ Gửi tới Monica ─▶ 🔴 ĐỐI CHIẾU ĐỊNH MỨC ─▶ Kho ─▶ SX
                                    (Monica KHÔNG CÓ khâu này)
 ⚠️ Monica giữ hộ, KHÔNG sở hữu · thiếu/thừa phải đối soát với khách
 ⚠️ Monica vẫn tự mua: chỉ may · túi PE · thùng carton · nhãn phụ

════════════ CHUỖI FOB · 30% ═══════════════════════════════════════════
 BOM ─▶ Đề nghị mua ─▶ 🆕 GỘP nhiều đơn ─▶ So sánh NCC ─▶ PO mua
   ─▶ Theo dõi ─▶ Nhận ─▶ Kiểm ─▶ Kho ─▶ SX ─▶ đối chiếu 3 chiều ─▶ Nợ NCC
 ⚠️ Monica sở hữu · rủi ro giá + thời gian + chất lượng thuộc Monica

════════════ CHUỖI GIA CÔNG NGOÀI ══════════════════════════════════════
 Cấp NPL ─▶ Assignment ─▶ Nhà thầu SX ─▶ Nhận về ─▶ 🔴 ĐỐI SOÁT HAO HỤT
 In/Thêu: chi tiết RỜI KHỎI nhà máy ─▶ ⚠️ HÀNG ĐANG Ở NGOÀI ─▶ về
```

**Ba khoảng trống chuỗi cung ứng — xếp theo tác động:**

| # | Khoảng trống | Hệ quả |
|---|---|---|
| **1** | 🔴 **Không đối chiếu định mức khi nhận NPL khách** | Với 70% đơn CMT, *"khách gửi thiếu"* chỉ lộ ra **khi đang cắt** — muộn 2–3 tuần |
| **2** | 🔴 **Không theo dõi hàng đang ở ngoài** *(in · thêu)* | Chỗ nhà máy gia công **mất dấu hàng thường xuyên nhất** |
| **3** | **Không gộp nhu cầu mua** | 📚 Chênh giá theo khối lượng 3–8%. Trên chi phí NPL FOB, đây là tiền thật |

---

## 1.8 FINANCE MODEL

### 1.8.1 Hai hệ thống, hai loại sự thật

> ✅ `VERIFIED` · Joseph: **MISA xuất hoá đơn + kế toán + BCTC. Monica ONE quản công nợ · doanh thu · chi phí · dòng tiền theo đơn. Hai hệ chạy song song, phải đối chiếu được.**

| | **Monica ONE** | **MISA** |
|---|---|---|
| Sự thật về | 🔴 **Vận hành & thương mại** | 🔴 **Kế toán & pháp lý** |
| Câu trả lời | *"Đơn PO-2588 lãi bao nhiêu?"* | *"Quý này nộp thuế bao nhiêu?"* |
| Đơn vị | **đơn hàng** | **kỳ kế toán** |
| Sở hữu | giá vốn thật · khấu trừ · công nợ theo đơn · dòng tiền dự kiến | hoá đơn · sổ cái · thuế · BCTC |

> 🔴 **Luật số 1:** Monica ONE **không bao giờ tự nhận là sổ kế toán**. Mọi con số hiện kèm nguồn: `theo Monica ONE` · `theo MISA` · `⚠️ chênh lệch`.
>
> Hai hệ **sẽ** lệch — chúng ghi nhận theo hai thời điểm và hai nguyên tắc. **Việc của kiến trúc là làm cho chênh lệch NHÌN THẤY ĐƯỢC và GIẢI THÍCH ĐƯỢC, không phải triệt tiêu nó.** Giấu chênh lệch để "trông cho khớp" là điều tệ nhất có thể làm.

### 1.8.2 Chu kỳ tiền — vì sao FOB nguy hiểm hơn

```
CMT:  Nhận NPL ──▶ Sản xuất ──▶ Giao ──▶ Hoá đơn ──▶ Thu
      vốn bỏ ra: chỉ nhân công + chi phí xưởng            ~30–60 ngày

FOB:  🔴 MUA NPL ──▶ Nhận ──▶ Sản xuất ──▶ Giao ──▶ Hoá đơn ──▶ Thu
      ▲ TIỀN RA TRƯỚC 60–90 ngày                          ~90–150 ngày
      vốn bỏ ra: NPL (62% giá trị đơn) + nhân công + chi phí
```

⇒ **Một đơn FOB bị huỷ sau khi đã mua NPL là mất tiền thật, không phải mất cơ hội.** Đây là lý do `OQ-004` *(ai được huỷ đơn, NPL đã mua xử lý ra sao)* là câu hỏi **tài chính**, không phải câu hỏi quy trình — và là lý do nó nằm trong `BDR-02`.

### 1.8.3 Rủi ro tỷ giá

Doanh thu **USD**, chi phí **VND**. Chênh lệch tỷ giá giữa ngày báo giá và ngày thu tiền là **lãi/lỗ thật**, không phải bút toán. Với biên FOB ~6%, biến động tỷ giá 3% ăn **một nửa lãi**.

⇒ `Costing` phải ghi `fx_rate_at_quote`; `Payment` ghi `fx_rate_at_receipt`; chênh lệch là một dòng riêng trong giá vốn thật.

---

## 1.9 SERVICE MODEL

Monica bán hàng hoá, nhưng **giữ khách bằng dịch vụ**:

| Dịch vụ | Hôm nay | Với Monica ONE |
|---|---|---|
| Phát triển mẫu | ✅ có | + hồ sơ số hoá, phiên bản, bằng chứng |
| Tìm nguồn NPL *(FOB)* | ✅ có | + so sánh NCC, truy vết |
| Đảm bảo chất lượng | ✅ có | + báo cáo chia sẻ có kiểm soát |
| Chứng từ xuất khẩu | ✅ có | + bộ chứng từ đủ, cảnh báo thiếu |
| 🆕 **Minh bạch tiến độ** | ❌ email/điện thoại | 🔴 **Customer Portal — Line Map, ETA, mốc** |
| 🆕 **Duyệt mẫu có hồ sơ** | ❌ email | 🔴 **Portal + chữ ký + bằng chứng** |

> 🔬 **Minh bạch tiến độ là năng lực dịch vụ có sức khác biệt lớn nhất mà Monica chưa dùng.** Buyer sợ nhất là *"không biết đơn của mình đang thế nào"*. Nhà máy nào trả lời được câu đó **bằng số, tự động, mọi lúc** thì có lợi thế đàm phán mà đối thủ không có — và Monica **đã có dữ liệu** để làm điều đó.

---

## 1.10 DIGITAL MODEL

### Sáu nguyên tắc số hoá — ràng buộc mọi thiết kế về sau

| # | Nguyên tắc | Nghĩa |
|---|---|---|
| **DM-1** | **Một nền tảng** | Mọi năng lực trong một sản phẩm. Không ốc đảo. *(Hiến pháp Điều 7)* |
| **DM-2** | 🔴 **Bằng chứng trước** | Mọi hoạt động quan trọng để lại bản ghi kiểm chứng được. Tranh chấp ngành may được xử bằng **ảnh và chứng từ** |
| **DM-3** | 🔴 **Đối tác là công dân hạng nhất** | Nhà thầu **GHI**; khách **DUYỆT**. Không phải người xem thụ động |
| **DM-4** | **Xưởng dùng điện thoại, chạy được offline** | Wifi xưởng sẽ rớt. Rớt mạng không được dừng ghi sản lượng |
| **DM-5** | 🔴 **Một nguồn cho mọi con số** | Mọi báo cáo đối soát ra cùng một số. Không màn hình nào tự tính |
| **DM-6** | **Ba ngôn ngữ ngang hàng** | VI vận hành · EN/ZH cho khách. Không phải bản dịch của sản phẩm tiếng Anh |

---

---

# PHASE 2 · ENTERPRISE CAPABILITY MODEL

> **Bản đồ năng lực trả lời *"doanh nghiệp phải làm được gì"* — độc lập với ai làm, làm bằng gì, và tổ chức thế nào.**
>
> ⚠️ **Capability ≠ Domain.** Một năng lực có thể trải nhiều Domain; một Domain chứa nhiều năng lực. Trộn hai bản đồ là sai lầm phổ biến nhất khi thiết kế ERP.

## 2.1 LEVEL 0 — Ba tầng

```
╔═══════════════════════════════════════════════════════════════════════╗
║  L0-A · ĐỊNH HƯỚNG        Lái doanh nghiệp                            ║
╠═══════════════════════════════════════════════════════════════════════╣
║  L0-B · TẠO GIÁ TRỊ       Giành việc → Định nghĩa → Cam kết           ║
║                           → Cung ứng → Sản xuất → Giao → Thu tiền     ║
╠═══════════════════════════════════════════════════════════════════════╣
║  L0-C · HỖ TRỢ            Con người · Tài sản · Thông tin · Tuân thủ   ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## 2.2 LEVEL 1 — Mười lăm nhóm năng lực

| L0 | L1 | Nhóm năng lực | Số L2 |
|---|---|---|---|
| A | **C01** | Quản trị chiến lược & hiệu quả | 4 |
| B | **C02** | Quản lý nhu cầu & khách hàng | 6 |
| B | **C03** | Phát triển sản phẩm | 6 |
| B | **C04** | Kỹ thuật công nghiệp & phương pháp | 5 |
| B | **C05** | Chiết tính & định giá | 5 |
| B | **C06** | Quản lý đơn hàng | 7 |
| B | **C07** | Hoạch định năng lực & sản xuất | 6 |
| B | **C08** | Mua hàng & nhà cung cấp | 6 |
| B | **C09** | Kho & tồn kho | 8 |
| B | **C10** | Thực thi sản xuất | 7 |
| B | **C11** | Quản lý chất lượng | 6 |
| B | **C12** | Sản xuất bên ngoài | 5 |
| B | **C13** | Hậu cần & xuất khẩu | 5 |
| B | **C14** | Tài chính thương mại | 7 |
| C | **C15** | Nền tảng doanh nghiệp | 8 |
| | | **TỔNG** | **91** |

## 2.3 LEVEL 2 & LEVEL 3 — chi tiết đầy đủ

> Ký hiệu tình trạng: ✅ đã có · ⚠️ một phần · ❌ chưa có · 🔴 khoảng trống nghiêm trọng

### C01 · QUẢN TRỊ CHIẾN LƯỢC & HIỆU QUẢ

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C01.1 | Quản trị mục tiêu doanh nghiệp | định mục tiêu · phân rã theo bộ phận · theo dõi · rà soát định kỳ | ❌ |
| C01.2 | 🔴 **Điều hành theo ngoại lệ** | định nghĩa ngoại lệ · ngưỡng · leo thang · hàng đợi quyết định · truy vết quyết định | ❌ |
| C01.3 | 🔴 **Đối soát hiệu quả một nguồn** | định nghĩa chỉ số có mã · tầng read-model · luật đối soát · truy về sự kiện gốc | 🔴 |
| C01.4 | Quản trị kiến trúc & thay đổi | ADR · thứ bậc văn bản · phản biện độc lập · sổ nợ kỹ thuật | ✅ |

### C02 · QUẢN LÝ NHU CẦU & KHÁCH HÀNG

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C02.1 | Hồ sơ khách hàng | pháp nhân · liên hệ · địa chỉ giao · phân loại *(Trading·Brand·Buying Office·Importer)* · xoá mềm · gộp trùng | ⚠️ |
| C02.2 | 🔴 **Tiếp nhận nhu cầu hai cửa** | ① Email+TechPack *(khách quen)* · ② Inquiry *(khách mới · báo giá · may mẫu)* · phân loại ý định · gán người phụ trách | ⚠️ |
| C02.3 | Quản lý hợp đồng | hợp đồng khung · phụ lục · điều khoản · Incoterm · hiệu lực · cảnh báo hết hạn | ❌ |
| C02.4 | Quản lý giá & hiệu lực | bảng giá theo khách/mã hàng/mùa · hiệu lực · lịch sử · 🔴 **duyệt giá — chỉ GĐSX** · uỷ quyền có thời hạn | ❌ |
| C02.5 | Điều kiện thương mại | điều kiện thanh toán *(LC·TT trước·TT sau N)* · hạn mức tín dụng · tiền tệ · Incoterm | ❌ |
| C02.6 | Trao đổi với khách | luồng trao đổi theo ngữ cảnh · chia sẻ tài liệu · thông báo · **Customer Portal** | ⚠️ |

### C03 · PHÁT TRIỂN SẢN PHẨM

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C03.1 | Quản lý mã hàng | mã hàng · phiên bản · **ma trận màu × cỡ** · thuộc tính · vòng đời `DEVELOPMENT→APPROVED→IN_PRODUCTION→DISCONTINUED` · **dùng lại nhiều đơn** | ⚠️ |
| C03.2 | 🔴 **Tech Pack có phiên bản** | phiên bản · so sánh bản · thông số đo · hình kỹ thuật · artwork · trim card · **giữ bản cũ để đối chiếu tranh chấp** | 🔴 |
| C03.3 | 🔴 **Quản lý mẫu** | 7 chặng `PROTO·FIT·SIZE_SET·SMS·PP·TOP·SHIPMENT` · vòng gửi–phản hồi · **ảnh có thước đo · video** · bình luận gắn điểm đo · **đồng hồ đếm ngày ở khách** · phả hệ phiên bản · **số vòng lặp & chi phí mẫu** | ⚠️ |
| C03.4 | 🔴 **Định mức & hao hụt (BOM)** | dòng NPL · định mức theo cỡ/màu · hao hụt theo công đoạn · hiệu suất sơ đồ · **bí mật kỹ thuật — phân loại Hạn chế** | ⚠️ |
| C03.5 | Rập & sơ đồ | rập · nhảy cỡ · sơ đồ · hiệu suất sơ đồ *(ảnh hưởng thẳng giá vốn)* | ❌ |
| C03.6 | Họp tiền sản xuất | biên bản PP · danh mục kiểm · người dự · quyết định · **điều kiện lên chuyền** | ❌ |

### C04 · KỸ THUẬT CÔNG NGHIỆP & PHƯƠNG PHÁP

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C04.1 | 🔴 **Sổ thời gian chuẩn** | thời gian chuẩn theo mã hàng/công đoạn · **nguồn `ESTIMATE→BENCHMARK→TIME_STUDY`** · độ tin cậy · 🔴 **thời gian thực tế tự tính từ dữ liệu bó × công đoạn** · so ước lượng ⟷ thực | 🔴 |
| C04.2 | Thư viện công đoạn | mã công đoạn · loại máy · bậc tay nghề · bộ phận · dùng chung mọi mã hàng | ❌ |
| C04.3 | Bảng công đoạn theo mã hàng | trình tự · công đoạn · thời gian · loại máy · mục tiêu giờ · phiên bản | ❌ |
| C04.4 | Cân bằng chuyền | bố trí trạm · phân công · **tìm nút thắt** · hiệu suất cân bằng · mô phỏng số người | ❌ |
| C04.5 | 🔴 **Đường cong học tập** | hiệu suất theo ngày sản xuất · nhóm độ khó · thời gian lên chuẩn | ❌ |

### C05 · CHIẾT TÍNH & ĐỊNH GIÁ

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C05.1 | Chiết tính có phiên bản | phiên bản · so sánh bản · trạng thái `DRAFT→SUBMITTED→APPROVED\|REJECTED\|REVISE\|SUPERSEDED` | ✅ |
| C05.2 | Cấu thành chi phí | NPL *(từ BOM)* · nhân công *(từ thời gian chuẩn)* · chi phí xưởng · logistics · tài chính · **truy vết mọi dòng về nguồn** | ⚠️ |
| C05.3 | 🔴 **Biên lợi nhuận** | biên kế hoạch *(TÍNH, không lưu)* · ngưỡng cảnh báo · **chụp lại tại điểm phê duyệt** · biên thực *(từ C14)* · **ăn mòn biên** | ⚠️ |
| C05.4 | Mô phỏng what-if | đổi giá NPL · đổi hiệu suất · đổi tỷ giá · đổi số lượng · so nhiều phương án | ❌ |
| C05.5 | Báo giá | nhiều phương án theo số lượng · hiệu lực + cảnh báo hết hạn · lịch sử gửi–phản hồi · **lý do thua chuẩn hoá** · chuyển thành đơn | ❌ |

### C06 · QUẢN LÝ ĐƠN HÀNG

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C06.1 | 🔴 **Sổ đơn hàng & vòng đời** | đơn + dòng + cỡ + lịch giao · **máy trạng thái CÓ LUẬT CHUYỂN** · treo/thả · **HUỶ có xử lý NPL** · nhân bản | 🔴 |
| C06.2 | 🔴 **Bốn cổng kiểm soát** | ① Xác nhận *(giá+ngày+NPL+CTP)* · ② Lập kế hoạch *(T&A+phân bổ+MRP)* · ③ Lên chuyền *(PP duyệt+NPL đủ)* · ④ Xuất hàng *(QA đạt+chứng từ)* · **vượt cổng có người + lý do** | ❌ |
| C06.3 | Tách & gộp | một đơn → nhiều lệnh sản xuất · **nhiều đơn → một lệnh** *(gộp cùng mã hàng)* · đối soát tổng | ❌ |
| C06.4 | 🔴 **Lịch T&A & đường găng** | mẫu lịch theo hình thức gia công · lùi ngược từ mốc gốc · **đồ thị phụ thuộc** · **tính đường găng** · chủ mốc theo Role · **leo thang khi trễ** | ⚠️ |
| C06.5 | 🔴 **Kế hoạch sở hữu NPL** | mặc định theo `order_type` · **ghi đè TỪNG DÒNG** · `MONICA_PURCHASED \| CUSTOMER_SUPPLIED \| CUSTOMER_NOMINATED` · % sẵn sàng · dòng đang chặn | 🔴 |
| C06.6 | Phân bổ sản xuất | nội bộ · thuê ngoài · **cả hai** · xem năng lực trống trước khi chia · đối soát tổng phân bổ | ⚠️ |
| C06.7 | Quản lý thay đổi | yêu cầu đổi *(số lượng·màu·ngày·giá)* · **phân tích tác động: T&A·NPL·năng lực·giá·shipment** · luồng duyệt · phiên bản đơn · **thay đổi từ khách qua Portal đi cùng đường** | ⚠️ |

### C07 · HOẠCH ĐỊNH NĂNG LỰC & SẢN XUẤT

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C07.1 | 🔴 **Mô hình năng lực** | lịch nhà máy · ca · nghỉ lễ · năng lực **tuần-chuyền** · hệ số hiệu suất · **năng lực hiệu dụng** · năng lực còn trống | 🔴 |
| C07.2 | 🔴 **Đặt chỗ năng lực (tầng 1)** | đặt chỗ lúc xác nhận đơn · chân trời 3–12 tháng · **cảnh báo vượt năng lực** · xác nhận của GĐSX | 🔴 |
| C07.3 | 🔴 **Trả lời cam kết được (CTP)** | tính phút cần · lùi từ ngày giao · tìm chuyền trống · kiểm NPL kịp · kiểm mẫu kịp · kết quả `FEASIBLE\|WITH_OT\|SUBCON\|NOT_FEASIBLE` | ❌ |
| C07.4 | Xếp lịch chuyền (tầng 2) | block ngày-chuyền · thời gian chuyển mã · kéo-thả · chân trời 6 tuần | ❌ |
| C07.5 | Lệnh sản xuất | lệnh · dòng · **cổng thả có điều kiện** · trạng thái `PENDING→RELEASED→IN_PROGRESS→COMPLETED\|CANCELLED` | ⚠️ |
| C07.6 | Tính nhu cầu NPL & what-if | `cần − có − đang về = thiếu` · cảnh báo thiếu · **mô phỏng chen đơn gấp: đơn nào bị đẩy** | ❌ |

### C08 · MUA HÀNG & NHÀ CUNG CẤP

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C08.1 | Hồ sơ nhà cung cấp | pháp nhân *(là một `Party`)* · liên hệ · nhóm hàng cung cấp · thời gian giao chuẩn · lịch sử giá | ⚠️ |
| C08.2 | 🔴 **Đề nghị mua & GỘP** | sinh tự động từ kế hoạch NPL · **gộp nhiều đơn cùng vật tư** · gom theo NCC · duyệt | ❌ |
| C08.3 | Tìm nguồn & so sánh | yêu cầu chào giá · so sánh · **giá NPL là bí mật — không lộ ra cổng nào** | ❌ |
| C08.4 | Đơn mua | PO ra NCC · lịch giao · xác nhận của NCC · sửa PO có vết · theo dõi ngày về · nhắc NCC | ⚠️ |
| C08.5 | 🔴 **Đối chiếu ba chiều** | PO ⟷ phiếu nhập ⟷ hoá đơn NCC · ngoại lệ lệch · duyệt lệch | ❌ |
| C08.6 | NCC do khách chỉ định | khách chỉ định NCC vải · giá do khách đàm phán · Monica chỉ đặt hàng | ❌ |

### C09 · KHO & TỒN KHO

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C09.1 | Cây vị trí | Kho → Khu → Kệ → Ô · loại kho `RM\|FG\|WIP\|QUARANTINE` · sức chứa · cho phép trộn | ✅ |
| C09.2 | 🔴 **Phân tách sở hữu vật tư** | `MONICA_OWNED \| CUSTOMER_SUPPLIED` · chủ sở hữu là bên nào · ⛔ **hàng khách A không dùng cho đơn khách B** · không định giá hàng khách vào tồn Monica | 🔴 |
| C09.3 | 🔴 **Nhận hàng & đối chiếu định mức** | nhận NPL mua · **nhận NPL khách cấp** · đếm · ảnh bằng chứng · 🔴 **so định mức BOM → báo thiếu/thừa** · khu chờ kiểm | 🔴 |
| C09.4 | 🔴 **Vải · cuộn · dải màu** | cuộn · **dài hoá đơn ⟷ dài đo thực** · khổ · **mã dải màu** · độ co · gsm · phân loại sau kiểm | 🔴 |
| C09.5 | Sổ tồn chỉ-ghi-thêm | bút toán ⛔ **không sửa không xoá** · bút toán ngược · số dư là phép chiếu · **đối soát `Σ sổ = số dư` mỗi vòng kiểm** | ⚠️ |
| C09.6 | Giữ chỗ & cấp phát | giữ chỗ theo đơn · hết hạn tự nhả · phiếu soạn · **FIFO + ràng buộc dải màu** · xuất kho · 🔴 **TRẢ VỀ hàng dư** | ⚠️ |
| C09.7 | Chuyển · điều chỉnh · huỷ | chuyển ô/kho/nhà máy · 🔴 **điều chỉnh BẮT BUỘC duyệt + lý do + ảnh** · huỷ/phế liệu đồng duyệt | ⚠️ |
| C09.8 | Kiểm kê | kiểm xoay vòng · kiểm toàn bộ *(đóng băng giao dịch)* · kiểm đột xuất · **chụp số hệ thống lúc BẮT ĐẦU đếm** · duyệt chênh lệch | ✅ |

### C10 · THỰC THI SẢN XUẤT

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C10.1 | Cấu trúc sản xuất | Nhà máy → Xưởng → Bộ phận → Chuyền → Trạm · máy · ⛔ **không phải cây chức danh** | ⚠️ |
| C10.2 | Cắt & truy vết cuộn | sơ đồ · trải vải · 🔴 **bó mang mã cuộn** · phiếu cắt · chênh lệch tiêu thụ vải · ⛔ không trải chung dải màu khác | ⚠️ |
| C10.3 | 🔴 **Dòng chảy 13 công đoạn** | 4 kiểu: `BUFFER \| FLOW \| BATCH \| GATE` · in/thêu/ép **rời khỏi nhà máy rồi về** · 🔴 **hàng đang di chuyển giữa công đoạn** | ❌ |
| C10.4 | Ghi nhận dữ liệu xưởng | sản lượng **bó × công đoạn × giờ** · quét mã · **chạy offline + chống trùng** · chốt ca · ⛔ số đã chốt không sửa trực tiếp | ✅ |
| C10.5 | WIP & tồn công đoạn | WIP theo bó *(dẫn xuất)* · tuổi bó cũ nhất · 🔴 **hàng đợi sửa lại** · ngày phủ mỗi công đoạn | ❌ |
| C10.6 | Dừng chuyền & Andon | 🔴 **bảng mã lý do chuẩn** *(không ghi tự do)* · thời lượng · tác động · gọi hỗ trợ · leo thang | ⚠️ |
| C10.7 | 🔴 **Line Map — trung tâm điều hành** | 13 công đoạn × 31 chỉ số · **tìm nút thắt bằng công thức** · ETA theo công đoạn · **tổn thất năng suất** · 3 màn hình: TV xưởng · điều hành · cổng đối tác | ❌ |

### C11 · QUẢN LÝ CHẤT LƯỢNG

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C11.1 | Kế hoạch kiểm theo khách | chặng `MATERIAL·INLINE·PRE_FINAL·FINAL·PACKING` · **chặng nào bắt buộc / tuỳ khách** · mức AQL | ❌ |
| C11.2 | 🔴 **MỘT chứng từ kiểm, nhiều lăng kính** | một `Inspection` · `performed_by_party: MONICA\|CUSTOMER\|THIRD_PARTY\|SUBCON` · 🔴 **mức tiết lộ ở TỪNG PHÁT HIỆN** · mặc định `INTERNAL_ONLY` | 🔴 |
| C11.3 | Kiểm trong chuyền | kiểm theo giờ · DHU theo giờ · RFT · dừng công đoạn lỗi hàng loạt | ⚠️ |
| C11.4 | Chuẩn AQL | ISO 2859-1 · cỡ mẫu · giới hạn chấp nhận · kết luận · 🔴 **xử lý lô trượt: kiểm 100% · sửa · xin nhân nhượng · loại** | ⚠️ |
| C11.5 | Lỗi & khắc phục | danh mục lỗi chuẩn · phân loại nặng/nhẹ · sửa lại · CAPA · xác minh hiệu quả | ✅ |
| C11.6 | 🔴 **Kiểm NPL đầu vào** | kiểm vải **4 điểm** · đo khổ · đo dài thực · **phân dải màu** · kiểm phụ liệu theo AQL · quyết nhận/từ chối/nhận có điều kiện | ❌ |

### C12 · SẢN XUẤT BÊN NGOÀI

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C12.1 | Hồ sơ nhà thầu | pháp nhân *(là một `Party`)* · chuyền · năng lực · lịch sử chất lượng · **tiêu chí chọn xưởng** | ⚠️ |
| C12.2 | 🔴 **Giao việc (Assignment)** | giao · chấp nhận/từ chối · **máy trạng thái có luật chuyển** · phạm vi tài nguyên · ⛔ nhà thầu không tự tạo | ✅ |
| C12.3 | Điều khoản thương mại | đơn giá gia công · điều kiện thanh toán · giữ lại % · công nợ | ⚠️ |
| C12.4 | Giao & nhận gia công | cấp NPL *(chuyển quyền giữ hộ, không chuyển sở hữu)* · nhận thành phẩm · 🔴 **đối soát hao hụt** | ⚠️ |
| C12.5 | 🔴 **Xưởng chuyên biệt (in·thêu·ép)** | chi tiết rời khỏi nhà máy rồi về · **hàng đang ở ngoài** · thời gian quay vòng · **hiện liền mạch trong Line Map** | ❌ |

### C13 · HẬU CẦN & XUẤT KHẨU

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C13.1 | Đặt chỗ vận chuyển | hãng tàu · tàu/chuyến · ETD/ETA · container · **hạn booking** | ❌ |
| C13.2 | Đóng gói | thùng · nội dung thùng · shipping mark · `SOLID\|RATIO\|ASSORT` · cân · kích thước | ✅ |
| C13.3 | Lô hàng | **một đơn ↔ nhiều lô** · mốc lô hàng · theo dõi tới cảng đích | ⚠️ |
| C13.4 | 🔴 **Bộ chứng từ xuất khẩu** | hoá đơn thương mại · packing list · C/O · vận đơn · tờ khai · **cảnh báo thiếu tờ nào** | ❌ |
| C13.5 | 🔴 **Truy vết đầu-cuối** | cuộn → bó → chuyền → thùng → lô hàng → khách · **hai chiều xuôi/ngược** · thu hồi đúng phạm vi | ❌ |

### C14 · TÀI CHÍNH THƯƠNG MẠI

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C14.1 | Đề nghị xuất hoá đơn | sinh từ lô hàng · dữ liệu chuyển sang MISA · trạng thái | ❌ |
| C14.2 | 🔴 **Gương chứng từ MISA** | số hoá đơn · ngày · tiền · phiếu thu — bản sao trong Monica ONE | ❌ |
| C14.3 | 🔴 **Đối chiếu Monica ONE ⟷ MISA** | chạy định kỳ · **4 loại chênh: thời điểm · khấu trừ · tỷ giá · LỆCH THẬT** · ngoại lệ vào Work Inbox | ❌ |
| C14.4 | 🔴 **Khấu trừ** | trễ · lỗi · thiếu số · **lý do chuẩn hoá** · thương lượng · duyệt · **giải thích chênh lệch MISA** | ❌ |
| C14.5 | Công nợ phải thu | theo đơn · tuổi nợ · nhắc nợ · hạn mức · **cảnh báo quá hạn + đơn đang chạy** | ❌ |
| C14.6 | Công nợ phải trả | nợ NCC *(sau đối chiếu 3 chiều)* · nợ nhà thầu *(theo sản lượng/mốc/khoán, có giữ lại %)* | ❌ |
| C14.7 | 🔴 **Giá vốn thật & biên thực** | NPL thật · nhân công thật · chi phí phân bổ · **chênh tỷ giá** · biên kế hoạch ⟷ biên thực · **ăn mòn biên** | ❌ |

### C15 · NỀN TẢNG DOANH NGHIỆP

| L2 | Năng lực | L3 | TT |
|---|---|---|---|
| C15.1 | Định danh & phân quyền | tài khoản · Role · Capability · **Assignment → phạm vi tài nguyên** · phạm vi tổ chức · phân tách nhiệm vụ | ✅ |
| C15.2 | 🔴 **Cổng đối tác** | Customer · Subcontractor · Supplier · **một nền tảng ba cấu hình** · mặc định CẤM · bài kiểm mỗi mức tiết lộ | ⚠️ |
| C15.3 | 🔴 **Chứng từ & bằng chứng** | tài liệu **có phiên bản** · đính kèm · liên kết bằng chứng · nhật ký tải về · lưu trữ | ⚠️ |
| C15.4 | 🔴 **Luồng duyệt & uỷ quyền** | chính sách duyệt · nhiều cấp · **uỷ quyền có thời hạn** · leo thang theo thời gian · **chụp lại thứ người duyệt đã nhìn thấy** | ❌ |
| C15.5 | 🔴 **Hộp thư công việc** | **luật sinh việc theo Domain** · 5 loại việc · **ưu tiên theo tác động** · việc là phép chiếu, tự biến mất | ❌ |
| C15.6 | Trao đổi & thông báo | luồng theo ngữ cảnh · thông báo có hành động · gộp · ⛔ không gửi dữ liệu mật ra email | ⚠️ |
| C15.7 | Dữ liệu chủ & mã hoá | `Party` · vật tư · đơn vị đo + quy đổi · màu · cỡ · lịch · tiền tệ · tỷ giá · dãy số chứng từ | ⚠️ |
| C15.8 | Nhật ký & truy vết | sự kiện nghiệp vụ chỉ-ghi-thêm · nhật ký thay đổi · truy vết ai · lúc nào · thấy gì | ✅ |

## 2.4 Tổng kết Phase 2

| Chỉ số | Số | % |
|---|---|---|
| **Năng lực L2** | **91** | 100% |
| ✅ Đã có đầy đủ | 12 | **13%** |
| ⚠️ Có một phần | 27 | 30% |
| ❌ Chưa có | 52 | **57%** |
| 🔴 Trong đó: khoảng trống nghiêm trọng | **24** | 26% |

> **Con số 13% khớp độc lập với BKB §G.5** *(6/36 quy tắc `Verified` đang khớp = 17%)*. Hai phép đo hoàn toàn khác nhau, cùng kết luận: **hệ thống hiện phủ khoảng một phần bảy tới một phần sáu năng lực cần có.**
>
> ⚠️ Đây **không phải** đánh giá tiêu cực. Nó là **bản đồ khối lượng công việc**, và nó cho biết ba điều: ① 13% đã có là phần khó nhất *(phân quyền · kho · assignment)* · ② 57% chưa có phần lớn là **năng lực điều phối**, không phải năng lực ghi chép · ③ 24 khoảng trống nghiêm trọng tập trung ở **bốn cụm**: thời gian chuẩn · năng lực · tài chính · dòng chảy sản xuất.

---

---

# PHASE 3 · ENTERPRISE DOMAIN MODEL

## 3.1 Phép thử Domain — tiêu chí, không phải danh sách

Board đã yêu cầu giải thích *"vì sao là con số này"*. Câu trả lời không nằm ở con số mà ở **tiêu chí**. Xin Board phê duyệt **tiêu chí**; con số tự rơi ra.

| # | Phép thử | Câu hỏi | Vì sao |
|---|---|---|---|
| **T1** | **Ngôn ngữ riêng** | Có từ nào ở đây mang nghĩa khác chỗ khác? | Mạnh nhất. Hai nghĩa một từ trong một Domain ⇒ mô hình sẽ hỏng |
| **T2** | **Sở hữu dữ liệu** | Có aggregate nào **chỉ nó được ghi**? | Không sở hữu gì ⇒ là view, không phải Domain |
| **T3** | **Nhịp thay đổi** | Đổi theo nhịp khác hàng xóm? | Cùng nhịp ⇒ tách ra chỉ tạo chi phí điều phối |
| **T4** | **Người chịu trách nhiệm** | Có **một** người chịu trách nhiệm kết quả? | Không chủ ⇒ Domain sẽ bị bỏ rơi |
| **T5** | **Sai độc lập** | Nó **sai một mình** được không? | Không ⇒ nó là hệ quả của cái khác |

**Luật chấm:** ≥4/5 = **Domain** · 3/5 = **Module** · ≤2/5 = **Feature**

> ⚠️ **T4 áp cho VAI TRÒ, không áp cho CON NGƯỜI.** Một Domain có Role được định nghĩa nhưng hôm nay do người khác kiêm nhiệm thì **vẫn đạt T4**. Đây là điểm sửa so với bản trình trước — và nó là lý do IE và Procurement đủ tư cách Domain dù Monica chưa có hai bộ phận đó.

## 3.2 🔴 Domain Activation Model — cơ chế cho phép cùng một mã chạy cho mọi quy mô

Đây là **cơ chế then chốt của thương mại hoá**. Không có nó, bán cho 100 doanh nghiệp = 100 nhánh mã.

| Trạng thái | Aggregate | Role | Workspace | Ai làm việc |
|---|---|---|---|---|
| 🟢 **ACTIVE** | có, có dữ liệu | có, có người chuyên trách | **hiện trên trang chủ** | người chuyên trách |
| 🟡 **EMBEDDED** | **có, có dữ liệu** | **có, do người Domain khác kiêm** | **ẩn** — việc hiện trong Workspace người kiêm, **mang nhãn Domain thật** | người kiêm nhiệm |
| ⚪ **DORMANT** | lược đồ đặt chỗ, 0 dòng | chưa có | ẩn | chưa ai |

**Năm cơ chế khiến chi phí chuyển trạng thái ≈ 0:**

| # | Cơ chế | Khi chuyển ACTIVE cần |
|---|---|---|
| 1 | Aggregate riêng từ ngày đầu — ⛔ không phải cột trên aggregate Domain khác | **0 di trú dữ liệu** |
| 2 | Role riêng từ ngày đầu, hôm nay gán người kiêm | **1 thao tác quản trị** |
| 3 | Không gian quyền riêng `<domain>.*` | **0** |
| 4 | Gọi chéo qua **sự kiện**, không đọc thẳng bảng | **0** |
| 5 | Workspace dựng sẵn, cờ `activation` điều khiển hiển thị | **1 dòng cấu hình** |

> 💡 **Cơ chế 2 có tác dụng phụ tinh tế và có giá trị:** hôm nay chị Lan thấy việc mua hàng trong hộp thư của mình, **mang nhãn `Procurement`**. Chị ấy **học được ranh giới Domain trước khi Monica có phòng riêng**. Đến ngày tách, không ai bất ngờ.

## 3.3 Bản đồ 14 Business Domain

### 🔴 CORE — nơi Monica thắng hoặc thua

| # | Domain | Câu hỏi nghiệp vụ | Sở hữu dữ liệu gốc | Điểm | Monica |
|---|---|---|---|---|---|
| **D1** | **Commercial** | *Khách này là ai, ta cam kết gì, họ trả tiền thế nào?* | `Customer` · `Contract` · `PriceAgreement` · `PaymentTerm` | 5 | 🟡 |
| **D2** | **Merchandising** | *Đơn đang ở đâu, có kịp không, ai phải làm gì tiếp?* | `Inquiry` · `Costing` · `Quotation` · **`Order`** · `TnAPlan` · `OrderChange` · `OrderMaterialPlan` · `OrderAllocation` | 5 | 🟢 |
| **D3** | **Product Development** | *Sản phẩm may thế nào, tốn bao nhiêu vật tư?* | `Style` · `TechPack` · `Sample` · `BOM` · `Marker` · `PPMeeting` | 5 | 🟡 |
| **D4** | **Industrial Engineering** | *May cái này mất bao nhiêu phút?* | **`StandardTime`** · `Operation` · `OperationBulletin` · `LineLayout` · `LearningCurve` | 5 | ⚪→🟡 |
| **D5** | **Planning** | *Ta nhận nổi đơn này không, chạy chuyền nào, ngày nào?* | `Capacity` · `CapacityBooking` · `ProductionPlan` · `LineSchedule` · `ProductionOrder` · `MaterialRequirement` | 5 | 🟡 |
| **D6** | **Manufacturing** | *Hôm nay ra bao nhiêu, tắc ở đâu?* | `Factory`→`Line` · `CutTicket` · `Bundle` · `StageThroughput` · `StageTransfer` · `Downtime` | 5 | 🟢 |
| **D7** | **Quality** | *Hàng đạt chưa, lỗi gì, ai chịu trách nhiệm?* | `InspectionPlan` · **`Inspection`** · `Defect` · `CAPA` · `MaterialInspection` | 5 | 🟢 |

### 🟠 SUPPORTING — bắt buộc phải đúng, nhưng không tạo lợi thế cạnh tranh

| # | Domain | Câu hỏi nghiệp vụ | Sở hữu dữ liệu gốc | Điểm | Monica |
|---|---|---|---|---|---|
| **D8** | **Procurement** | *Mua của ai, giá nào, hàng về chưa, nợ bao nhiêu?* | `Supplier` · `PurchaseRequisition` · `PurchaseOrder` · `MatchResult` | 5 | 🟢 |
| **D9** | **Warehouse** | *Hàng gì, ở đâu, bao nhiêu, **CỦA AI**?* | `Location` · **`StockLedger`** · `MaterialLot` · `FabricRoll` · `Reservation` · `StockCount` | 5 | 🟢 |
| **D10** | **Logistics** | *Hàng đi chuyến nào, chứng từ đủ chưa?* | `Booking` · `Shipment` · `PackingList` · `ExportDocument` · `Carton` | 5 | 🟢 |
| **D11** | **Subcontract** | *Giao xưởng nào, họ làm tới đâu, nợ bao nhiêu?* | `Subcontractor` · **`Assignment`** · `AssignmentTerm` · `PartnerAccount` | 5 | 🟢 |
| **D12** | **Finance** | *Xuất bao nhiêu, thu bao nhiêu, lãi THẬT bao nhiêu?* | `InvoiceRequest` · `ExternalInvoiceMirror` · `Payment` · **`Deduction`** · `Receivable` · `Payable` · `CostActual` · `Reconciliation` | 5 | 🟢 |
| **D13** | **People** | *Ai làm gì, năng suất bao nhiêu, lương thế nào?* | `Employee` · `Attendance` · `SkillMatrix` · `PieceRateEarning` | 5 | 🟡 |

### 🔵 OVERSIGHT

| # | Domain | Bản chất | Điểm |
|---|---|---|---|
| **D14** | **Executive Center** | ⚠️ **Workspace KHÔNG có Domain.** Không sở hữu bảng nào; tiêu thụ read-model | **1/5** |

> ### ⚠️ D14 trượt phép thử của chính tôi — tôi phải nói ra
>
> Executive Center được **1/5**. Theo luật chấm, nó là **Feature**, không phải Domain.
>
> Nó ở trong danh sách vì **Hiến pháp Điều 18 đã ban hành nó là Workspace**, và Hiến pháp ở bậc 1 còn phép thử của tôi ở bậc 6.
>
> **Con số "14" thực chất là 13 Domain + 1 Workspace không có Domain.** Xin Board tu chính Điều 18 ghi nhận ngoại lệ này — `BDR-04`.

### ⚪ SHARED KERNEL — 9, không phải Workspace, không lên trang chủ

| # | Kernel | Nội dung | Vì sao phải Shared |
|---|---|---|---|
| **S1** | 🔴 **Party & Organization** | `Party` → `Customer` · `Supplier` · `Subcontractor` · `Employee` · `Factory` | **Một pháp nhân có thể vừa bán vải vừa nhận may.** Hai bảng rời ⇒ hai mã, hai sổ nợ, không đối soát được. Với 100 doanh nghiệp, tình huống này **chắc chắn xảy ra ở một số tenant** |
| **S2** | **Identity · Role · Assignment · Authorization** | Role · Capability · Assignment · ResourceScope · OrgScope · PartnerAccount | ✅ đã có nền tốt — nâng cấp, không viết lại |
| **S3** | **Item & Product Master** | `Material` · `UOM`+quy đổi · `Colour` · `SizeScale` · `Currency` · `FxRate` | Vải có mét·yard·kg·cuộn cùng lúc |
| **S4** | **Document & Evidence** | `Document` **có phiên bản** · `Attachment` · `EvidenceLink` · nhật ký tải | Hiến pháp Điều 8 · Điều 33 |
| **S5** | 🔴 **Workflow & Approval** | `ApprovalPolicy` · `ApprovalRequest` · **`Delegation`** · `EscalationRule` | Không có ⇒ mỗi Domain tự viết luồng duyệt riêng. Luồng duyệt là thứ **thay đổi thường xuyên nhất** trong đời một ERP |
| **S6** | **Communication & Notification** | Luồng theo ngữ cảnh · thông báo · đăng ký nhận | Hiến pháp Điều 30 |
| **S7** | 🔴 **Reporting & Reconciliation** | `MetricDefinition` · `ReadModel` · `WorkItemRule` · `ReconciliationRule` | **Lời giải duy nhất cho `BR-RPT-001`** và là nền của Work Inbox |
| **S8** | **Calendar · Numbering · Localization** | `FactoryCalendar` · `Shift` · `Holiday` · `DocumentSeries` · `Locale` | Lịch nhà máy quyết định **mọi** phép tính ngày của T&A và năng lực |
| **S9** | **Audit Trail & Event Log** | `DomainEvent` chỉ-ghi-thêm · `AuditLog` · `ChangeHistory` | Hiến pháp Điều 8 · §39.7 |

### ⏳ DORMANT — chừa đường, không xây

| Domain | Vì sao hoãn | Chừa đường gì **ngay** |
|---|---|---|
| **Compliance & Social Audit** | 📚 đạt 5/5 phép thử nhưng **Board chưa yêu cầu** | `Document` gắn được vào `Factory` và `Party`, không chỉ vào `Order` |
| **Maintenance & Asset** | Board chưa yêu cầu | `Machine` là thực thể có mã ngay trong D6 |
| **Wholesale & Retail** | `FD-001` nghiệp vụ phụ | 🔴 **`SalesOrder` là aggregate TÁCH BIỆT với `Order`** — xem `DL-012` |

## 3.4 Vì sao **không** 10 · 11 · 16 — trả lời trực tiếp

| Con số | Phải bỏ/thêm gì | Vì sao **không** |
|---|---|---|
| **11** *(Hiến pháp)* | bỏ PD · IE · Procurement | 🔴 Trượt **T1** tại 3 chỗ. Bằng chứng: `/md` hôm nay có **13 tab** nói **ba ngôn ngữ** *(khách hàng · sản phẩm · đơn hàng)*, tệp chính **886/900 dòng** — chạm trần kỹ thuật vì ranh giới sai |
| **10** | thêm: gộp Logistics vào MD, **hoặc** Subcontract vào Manufacturing | Logistics trượt **T3** *(chạy theo lịch tàu, không theo lịch đơn)*. Subcontract trượt **T1** — bên trong nó, *"giao hàng"* nghĩa là **chuyển quyền giữ hộ ra khỏi pháp nhân Monica**, khái niệm pháp lý mà Manufacturing nội bộ không có. Và gộp nó **xoá ranh giới trong/ngoài** khỏi mô hình — ranh giới bảo mật cứng nhất toàn hệ thống |
| **16** | thêm Compliance · Maintenance | Cả hai **đạt tiêu chuẩn kỹ thuật** nhưng thiếu **thẩm quyền nghiệp vụ**. Board chưa yêu cầu. **16 là con số của kiến trúc sư; 14 là con số của kiến trúc sư CỘNG giới hạn thẩm quyền của mình** |

## 3.5 Cái gì **chỉ là Module** — phản biện chính mình

| Ứng viên | Điểm | Kết luận | Lập luận |
|---|---|---|---|
| 🔴 **Sample Management** | **3/5** | **Module ⊂ D3** | ⚠️ **Board đã gọi đây là "năng lực nghiệp vụ ĐỘC LẬP"** *(`BR-SMP-003`)*. Tôi vẫn xếp Module, và không mâu thuẫn Board: **Capability ≠ Domain**. Bản đồ năng lực trả lời *"doanh nghiệp làm được gì"*; bản đồ Domain trả lời *"dữ liệu thuộc về ai"*. Sample là **năng lực độc lập** *(Board đúng)* **nằm trong** Domain Product Development *(mô hình đúng)*. Nó trượt **T2**: `Sample` không sống được thiếu `Style` |
| 🔴 **Costing** | **3/5** | **Module ⊂ D2** | Trượt **T3** *(đổi cùng nhịp với đơn)* và **T4** *(chủ là merchandiser, không có chức danh riêng)*. ⚠️ **Nếu Monica lập bộ phận Chiết tính riêng, Costing lên 5/5 và thành Domain thứ 15** — Activation Model xử lý được mà không đổi mã |
| **T&A / Critical Path** | 2/5 | Module ⊂ D2 | FastReact bán riêng nó. Ở Monica nó không sở hữu gì ngoài `Milestone`, và mọi mốc đều là mốc **của một đơn** |
| **Capacity** | 2/5 | Module ⊂ D5 | Trượt T4 · T5 |
| **Document Management** | 2/5 | **Kernel S4** | Mọi Domain đọc, không Domain nào sở hữu |

## 3.6 Cái gì **chỉ là Feature**

| Ứng viên | Kết luận | Lập luận |
|---|---|---|
| **AQL Engine** | Feature — **hàm thuần** | Không trạng thái, không sở hữu dữ liệu. Đã tồn tại ở `lib/garment-math.ts` |
| **Line Map** | **Feature ⊂ D6** — nhưng là feature **lớn nhất hệ thống** | Nó **không sở hữu dữ liệu nào** — nó chiếu dữ liệu của D6 · D7 · D9 · D11 qua S7. 🔴 **Chính vì thế nó phải đọc read-model, không đọc thẳng bảng** |
| **Efficiency** | 🔴 **MetricDefinition ⊂ S7** | **0/5.** Cần D4 *(thời gian chuẩn)* + D6 *(sản lượng)* + D13 *(công)*. **Một con số có 3 nguồn và 0 chủ sẽ thành 3 con số.** Nó **bắt buộc** phải là định nghĩa chỉ số, ⛔ không được là cột trong bảng nào |
| **AI Assistant** | **Global Service** | ⛔ Không sở hữu dữ liệu nghiệp vụ. Nếu AI có bảng riêng, nó thành nguồn chân lý thứ hai |

## 3.7 🔴 Ranh giới sở hữu — nguyên tắc THÌ CỦA ĐỘNG TỪ

Bốn Domain hay chồng chéo nhất **sở hữu bốn THÌ khác nhau của cùng một hiện thực**:

| Domain | Thì | Sở hữu | Câu hỏi |
|---|---|---|---|
| **D2 Merchandising** | **Tương lai đã hứa** | `Order` — *cam kết* | *"Ta đã hứa gì với khách?"* |
| **D5 Planning** | **Tương lai dự định** | `ProductionOrder` · `Capacity` — *ý định* | *"Ta định làm khi nào, ở đâu?"* |
| **D6 Manufacturing** | **Quá khứ đã xảy ra** | `StageThroughput` — *sự kiện* | *"Thực tế đã xảy ra gì?"* |
| **D9 Warehouse** | **Hiện tại đang giữ** | `StockLedger` — *hiện trạng* | *"Bây giờ có gì, ở đâu, của ai?"* |

**Phép thử một câu giải mọi tranh chấp sở hữu:**

> *Con số này là **lời hứa**, **ý định**, **sự kiện đã xảy ra**, hay **hiện trạng vật lý**?*

| Tranh chấp | Áp phép thử | Chủ sở hữu |
|---|---|---|
| *"% sẵn sàng NPL của đơn"* | hiện trạng vật lý | 🔴 **D9 tính · D2 chỉ HIỂN THỊ** — MD ⛔ không lưu |
| *"Số lượng đã sản xuất"* | sự kiện đã xảy ra | 🔴 **D6** — `orders` ⛔ không có cột `produced_qty` |
| *"Ngày giao"* | 🔴 **HAI con số, không phải một**: `confirmed_delivery` *(lời hứa, D2)* ⟷ `planned_finish` *(ý định, D5)* | ✅ Hai Domain, hai cột — **và chênh lệch giữa chúng là cảnh báo sớm quan trọng nhất** |

> **Ca thứ ba là lý do phép thử này đáng giá.** Mô hình cũ gộp chúng thành một cột `due_date` và **mất luôn tín hiệu cảnh báo**. Ranh giới Domain vẽ đúng không chỉ tránh chồng chéo — **nó sinh ra thông tin mới**.

## 3.8 Bốn luật phụ thuộc — cưỡng chế bằng phép kiểm

| # | Luật | Kiểm bằng |
|---|---|---|
| **DEP-1** | ⛔ Không Domain nào đọc thẳng bảng gốc của Domain khác — đọc qua **read-model** hoặc **contract** | quét lệnh truy vấn theo Domain |
| **DEP-2** | ⛔ Shared Kernel không import Domain nào | phép kiểm phụ thuộc |
| **DEP-3** | ⛔ **Cấm lưu trường dẫn xuất qua ranh giới Domain** | danh sách trường cấm |
| **DEP-4** | ⛔ Executive Center không có quyền GHI nghiệp vụ nào *(Hiến pháp §18.7)* | phép kiểm quyền |

> 🔴 **DEP-3 là luật duy nhất chưa tồn tại trong mã, và là luật đã bị vi phạm.** `po-twin.service.ts:132` giữ một trường thuộc Domain khác và giữ **sai** — bằng hằng số `0`. Cùng một đối tượng, hai màn hình, hai con số. Đây là bằng chứng cụ thể vì sao luật này cần có răng.

## 3.9 🔴 Thương mại hoá — Domain nào bắt buộc, Domain nào bật/tắt

Đây là câu trả lời cho *"có phù hợp doanh nghiệp nhỏ, vừa và lớn không"*.

| Domain | 🟢 Nhỏ <200 | 🔵 Vừa 200–1000 *(Monica)* | 🔴 Lớn >1000 | Bắt buộc? |
|---|---|---|---|---|
| D1 Commercial | 🟡 kiêm | 🟡 kiêm | 🟢 | ✅ **luôn** |
| D2 Merchandising | 🟢 | 🟢 | 🟢 | ✅ **luôn** |
| D3 Product Development | 🟡 kiêm | 🟡 → 🟢 | 🟢 | ✅ **luôn** |
| D4 Industrial Engineering | ⚪ | 🟡 *(Monica)* | 🟢 | ⚙️ **bật/tắt** |
| D5 Planning | 🟡 kiêm | 🟡 *(Monica)* | 🟢 | ✅ **luôn** |
| D6 Manufacturing | 🟢 | 🟢 | 🟢 | ✅ **luôn** |
| D7 Quality | 🟡 | 🟢 | 🟢 | ✅ **luôn** |
| D8 Procurement | ⚪ *(CMT thuần)* | 🟢 *(Monica — FOB 30%)* | 🟢 | ⚙️ **bật/tắt** |
| D9 Warehouse | 🟢 | 🟢 | 🟢 | ✅ **luôn** |
| D10 Logistics | 🟡 | 🟢 | 🟢 | ✅ **luôn** |
| D11 Subcontract | ⚪ *(tự làm hết)* | 🟢 *(Monica)* | 🟢 | ⚙️ **bật/tắt** |
| D12 Finance | 🟡 | 🟢 | 🟢 | ✅ **luôn** |
| D13 People | ⚪ *(dùng HRM khác)* | 🟡 | 🟢 | ⚙️ **bật/tắt** |
| D14 Executive | 🟡 | 🟢 | 🟢 | ✅ **luôn** |

> **Chín Domain bắt buộc · năm Domain bật/tắt.** Nhà máy CMT thuần 150 công nhân bật **9 Domain**, trong đó 5 ở trạng thái EMBEDDED — họ thấy một hệ thống gọn, không bị ngợp. Tập đoàn 4 nhà máy FOB bật **14 Domain**, tất cả ACTIVE.
>
> 🔴 **Cùng một bộ mã nguồn. Khác nhau ở bảng cấu hình `domain_activation`. Không một nhánh mã riêng nào.**
>
> Đây là điều SAP làm bằng *"module licensing + configuration"* — và cũng là chỗ SAP tạo ra ma trận tổ hợp không ai kiểm thử nổi. **Khác biệt của Monica ONE: chỉ có BA trạng thái kích hoạt, không phải hàng nghìn cờ cấu hình.** Ba trạng thái × 14 Domain là 42 tổ hợp có ý nghĩa, kiểm thử được.

## 3.10 So sánh chuẩn ngành — vẽ ranh giới ở đâu

| Hệ | Vẽ ranh giới thế nào | 🟢 Đúng | 🔴 Sai với nhà máy CMT |
|---|---|---|---|
| **SAP S/4HANA Fashion** | Theo **module chức năng** *(SD·MM·PP·QM·FI)* + org structure | Trừu tượng hoá tổ chức *(company code·plant)* cho phép một hệ chạy nhiều pháp nhân | Ranh giới theo **chức năng phần mềm**, không theo **lĩnh vực nghiệp vụ**. IE và Planning nằm rải khắp PP. Không có khái niệm *hàng đang ở nhà thầu* |
| **Infor M3 Fashion** | Theo **luồng đơn hàng** | Item matrix theo thuộc tính · đa đơn vị đo | Coi nhà máy là **nhà cung cấp**, không phải chủ thể |
| **CGS BlueCherry** | **PLM ⟷ ERP** hai khối | Ma trận Style×Màu×Cỡ hạng nhất | Ranh giới **brand-centric**: PLM cho nhà thiết kế, ERP cho bán sỉ. **Không có Domain nào cho xưởng** |
| **FastReact** | **Một Domain duy nhất: Planning** | Chuẩn vàng về block năng lực · đường găng · what-if | Đứng một mình ⇒ **lịch không biết NPL về chưa, không biết tiền còn không** ⇒ lạc quan theo cấu trúc |
| **Dynamics 365** | Theo **app** | Mô hình mở rộng sống sót qua nâng cấp | Sản xuất **rời rạc**, không hiểu bó·chuyền·SAM |
| **NetSuite** | Theo **record type** | 🟢 **One version of the truth** — đúng thứ `BR-RPT-001` đòi | Xưởng may gần như không có |
| **ERPNext** | Theo **DocType** | Sinh giàn giáo bằng metadata — tốc độ rất cao | BOM/Work Order chung chung · **phân quyền không diễn đạt nổi cổng đối tác** |
| **Odoo** | Theo **app cài thêm** | Tốc độ và sự gọn gàng của giao diện | 🔴 **Record rules mặc định "hiện trừ khi ẩn"** — không thiết kế cho người ngoài có động cơ đối nghịch |

### 🔴 Ba điều Monica ONE làm khác — và vì sao khó sao chép

| # | Khác biệt | Vì sao đối thủ không gắn thêm được |
|---|---|---|
| **1** | **Ranh giới Domain vẽ theo LĨNH VỰC NGHIỆP VỤ CỦA XƯỞNG**, không theo module phần mềm | SAP/Infor/BlueCherry đã đóng băng ranh giới từ 20 năm trước quanh mô hình *thương hiệu bán hàng*. Vẽ lại = viết lại sản phẩm |
| **2** | 🔴 **Đối tác ngoài là công dân hạng nhất, phân quyền theo Assignment cưỡng chế tới CSDL** | Đòi **viết lại mô hình bảo mật từ gốc**. Không hệ nào trong bảng gắn thêm được |
| **3** | 🔴 **Nội bộ và thuê ngoài dùng CÙNG mô hình dữ liệu** — Line Map hiện liền mạch xưởng in ngoài và chuyền trong nhà | Mọi hệ khác coi gia công ngoài là *mua dịch vụ*, mất dấu hàng ngay khi rời nhà máy. **Đây là chỗ nhà máy gia công mất hàng thường xuyên nhất** |

---

---

# §4 · DECISION LOG

> Quyết định tôi **tự ra** theo thẩm quyền [ADR-011 §2.1](../adr/ADR-011-tham-quyen-kien-truc.md). Ghi lại để chịu trách nhiệm và để phản biện được.

| Mã | Quyết định | Căn cứ | Rút lại được? |
|---|---|---|---|
| `DL-001` | **Phép thử 5 câu** là tiêu chí xác định Domain | Cần tiêu chí bảo vệ được thay vì danh sách | ✅ |
| `DL-002` | **14 Domain** = 13 Domain + 1 Workspace-không-Domain | Áp `DL-001` | ✅ |
| `DL-003` | **Domain Activation Model** — 3 trạng thái ACTIVE/EMBEDDED/DORMANT | Điều kiện cần để thương mại hoá; tránh 100 nhánh mã | ⚠️ khó |
| `DL-004` | **9 Domain bắt buộc · 5 Domain bật-tắt** | §3.9 | ✅ |
| `DL-005` | **Sample là Module ⊂ D3**, không phải Domain | Capability ≠ Domain. ⚠️ khác cách Board gọi | ✅ |
| `DL-006` | **Costing là Module ⊂ D2** | Trượt T3·T4. Lên Domain nếu Monica lập bộ phận riêng | ✅ |
| `DL-007` | **Efficiency là MetricDefinition ⊂ S7**, ⛔ không là cột ở đâu cả | 0/5 phép thử. 3 nguồn, 0 chủ ⇒ sẽ thành 3 con số | ⚠️ khó |
| `DL-008` | **Nguyên tắc THÌ CỦA ĐỘNG TỪ** để phân định sở hữu | §3.7 | ✅ |
| `DL-009` | **Kernel `Party`** — Customer/Supplier/Subcontractor/Employee là một `Party` | Với 100 tenant, trùng pháp nhân **chắc chắn xảy ra** | ⚠️ khó |
| `DL-010` | **1 `Order` : N `Shipment`** | Bất đối xứng chi phí: mô hình 1:N mà thực tế 1:1 tốn ~0; ngược lại **tốn một cuộc di trú** | 🔴 rất khó |
| `DL-011` | **1 `Style` : N `Order`** — mã hàng dùng lại | Cùng lập luận `DL-010` | 🔴 rất khó |
| `DL-012` | **`SalesOrder` (bán lẻ) là aggregate TÁCH BIỆT với `Order` (gia công)** | Ép chung ⇒ 40% cột luôn NULL; tách sau ⇒ di trú dữ liệu thật | 🔴 rất khó |
| `DL-013` | **`ProductionOrder` tham chiếu NHIỀU `OrderLine` từ NHIỀU `Order`** — giải cả tách lẫn gộp | Gộp hai PO cùng mã hàng thành một lệnh cắt là thực tiễn thật | ⚠️ khó |
| `DL-014` | **`Customer` · `Contract` thuộc D1 Commercial**; Merchandiser giữ Role trong cả hai Domain | Ranh giới Domain là **kỹ thuật**; ai ngồi làm là **tổ chức** | ✅ |
| `DL-015` | **Đơn vị năng lực = TUẦN-CHUYỀN** ở tầng 1 | Dùng được ngay không cần SMV; khi có thời gian chuẩn thì tự tính, **không đổi giao diện** | ✅ |
| `DL-016` | **Sổ Thời gian chuẩn** thay cho IE đầy đủ ở giai đoạn 1 | Monica đã có 100% dữ liệu thực tế — hệ thống tự học sau mỗi đơn | ✅ |
| `DL-017` | **Mốc gốc T&A do mẫu lịch khai báo**, mặc định = **ETD** | ETD là cam kết hợp đồng; ngày xuất xưởng là dẫn xuất | ✅ |
| `DL-018` | **Kế hoạch kiểm cấu hình theo khách**, mặc định `INLINE + FINAL` | Chặng kiểm là yêu cầu riêng từng buyer | ✅ |
| `DL-019` | **Xử lý lô trượt AQL:** kiểm 100% · sửa · xin nhân nhượng · loại. QA Manager quyết ba cái đầu; **nhân nhượng cần khách duyệt**; loại cần GĐSX+CEO | 📚 chuẩn ngành | ✅ |
| `DL-020` | **Mặc định tiết lộ = `INTERNAL_ONLY`**; chia sẻ là hành động có chủ ý, có người, có dấu thời gian | Bất đối xứng kiểu lỗi: quên-ẩn thì rò im lặng, quên-khai thì khách gọi điện | ⚠️ khó |
| `DL-021` | **Mức tiết lộ nằm ở TỪNG PHÁT HIỆN**, không ở cả chứng từ | Một lần kiểm chứa cả *"lệch số đo"* (chia sẻ) và *"công nhân mới ở trạm 12"* (nội bộ) | ⚠️ khó |
| `DL-022` | **Ranh giới BẤT BIẾN ⟷ CẤU HÌNH ĐƯỢC** chốt tại §1.3.1 | Điều kiện để một bộ mã chạy cho mọi tenant | 🔴 rất khó |
| `DL-023` | **Work Item là PHÉP CHIẾU**, không phải bảng ai đó tạo và đóng | 90% Work Inbox chết vì mô hình bảng-việc | ⚠️ khó |
| `DL-024` | **Trang chủ có HAI vùng hiến định**: Công việc *(động)* + Business Apps *(ổn định)* | Cần tu chính Điều 13 — `BDR-04` | ✅ |
| `DL-025` | **Monica ONE ⛔ KHÔNG xây sổ cái, ⛔ không phát hành hoá đơn.** Chỉ đối chiếu với MISA | Joseph 04/08. Sổ cái kép = hai nguồn sự thật kế toán | ⚠️ khó |
| `DL-026` | **`Deduction` là aggregate bắt buộc** dù chưa xác nhận quy tắc | Không có nó thì đối chiếu MISA **không giải thích nổi chênh lệch** | ✅ |
| `DL-027` | **`ownership` ở cấp DÒNG NPL**, mặc định suy từ `order_type` | Đơn CMT vẫn có dòng Monica mua *(chỉ · túi PE · thùng)*. Chi phí ~0 | ✅ |
| `DL-028` | **Tích hợp MISA giai đoạn 1 dùng FILE**, không dùng API | Chưa xác minh MISA bản Monica có API. File chạy được ngay; nâng lên API **không đổi mô hình dữ liệu** | ✅ |
| `DL-029` | **`dải màu` và `kiểm vải 4 điểm` mô hình hoá mặc định, tắt được theo tenant** | 📚 Lỗi lệch dải màu là lỗi tốn kém nhất ngành may và **không hệ ERP tổng quát nào chặn** | ✅ |
| `DL-030` | **Bốn kiểu công đoạn** `BUFFER\|FLOW\|BATCH\|GATE` trong Line Map | 13 công đoạn không cùng hình dạng; mô hình hoá giống nhau sẽ sai ở 8 chỗ | ⚠️ khó |

---

# §5 · OPEN QUESTIONS

> Chỉ giữ câu **không quyết được bằng phân tích**. 15 câu cũ đã đóng bằng `DL-010`…`DL-029`.

| Mã | Câu hỏi | Vì sao không tự quyết | Chặn phase nào |
|---|---|---|---|
| `OQ-A` | **Khách có khấu trừ vì trễ · lỗi · thiếu số không? Quy tắc cố định hay thương lượng?** | Ảnh hưởng **quy tắc**, không ảnh hưởng **mô hình** — `Deduction` vẫn xây *(`DL-026`)*. Nhưng nếu Monica **chưa từng bị khấu trừ**, ưu tiên hạ xuống | Phase 9 Rule |
| `OQ-B` | **Điều kiện thanh toán thực tế đang dùng?** *(LC · TT trước · TT sau N ngày)* | Là **dữ liệu chủ**, không phải mô hình. Cần trước khi tính công nợ thật | Phase 4 Master Data |
| `OQ-C` | **Công nợ nhà thầu tính theo sản lượng · mốc · hay khoán? Có giữ lại % không?** | Mô hình hỗ trợ cả ba. Cần biết cái nào dùng để đặt mặc định | Phase 4 |
| `OQ-D` | **MISA bản nào — desktop hay AMIS online?** | Quyết định file hay API. Không chặn thiết kế, chặn thi hành | Phase 12 |
| `OQ-E` | **Có NCC nào đồng thời là nhà thầu không?** | `DL-009` đã quyết xây `Party` *(vì thương mại hoá)*. Câu này chỉ quyết **ưu tiên** | Phase 4 |

---

# §6 · BOARD DECISION REQUIRED

> Bốn quyết định. Không có chúng thì **thiết kế sai hoặc phải làm lại**.

### 🔴 `BDR-01` · Chạy truy vấn `pg_policies` — **1 phút**

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('costings','costing_items','style_bom',
                    'change_requests','risk_assessments',
                    'production_orders','material_requests','order_milestones');
```

| | |
|---|---|
| **Vì sao là quyết định của Board** | Kiến trúc sư không chạm được CSDL |
| **Không có thì sao** | Không biết dữ liệu **giá · biên lợi nhuận · định mức** có đang mở cho khách hàng và nhà thầu không. Đây là **rủi ro thương mại tồn vong**, không phải lỗi kỹ thuật |
| **Ghi chú** | Đã xin **6 lần** qua các lượt trước. Nếu có lý do không chạy được, xin Joseph cho biết để tôi tìm đường khác |

### 🔴 `BDR-02` · Ai được huỷ đơn đã xác nhận? NPL đã mua xử lý ra sao?

| | |
|---|---|
| **Vì sao không tự quyết** | Với đơn FOB, NPL đã mua là **62% giá trị đơn, tiền đã ra khỏi công ty**. Bốn hướng xử lý — trả NCC · tính cho khách · giữ dùng lại · huỷ bỏ — có **bốn hệ quả tài chính khác nhau** |
| **Không có thì sao** | 🔴 `[VERIFIED]` **Hôm nay không thao tác nào đặt được `CANCELLED`. Đơn vào hệ thống là không bao giờ ra được.** Đây là lối thoát duy nhất của vòng đời |
| **Cần** | ① Ai được huỷ *(và có khác nhau theo giá trị đơn không)* · ② Bốn hướng xử lý NPL, hướng nào dùng khi nào |

### 🟠 `BDR-03` · Tách người duyệt **PO MUA** khỏi Giám đốc sản xuất?

| | |
|---|---|
| **Hiện trạng** | GĐSX **duyệt giá bán** + **duyệt giá mua** + **điều hành sản xuất** |
| **Rủi ro** | Chuyền sắp đói việc ⇒ động cơ duyệt giá bán thấp. Chuyền sắp đứng ⇒ động cơ mua nhanh bằng mọi giá. **Không ai đối trọng** |
| **Vì sao không tự quyết** | Đây là **quyết định tổ chức**, không phải thiết kế |
| **Đề nghị** | Tách `ProcurementApprover` sang **CEO** hoặc **Kế toán trưởng**. Nếu chưa tách được, tôi vẫn **tách Role trong mô hình** *(hôm nay cùng người giữ)* và thêm ba cơ chế chi phí 0: hiện giá lần trước khi duyệt · **uỷ quyền có thời hạn** · báo cáo tháng các lần duyệt dưới ngưỡng |
| ⚠️ **Đi kèm** | **Uỷ quyền có thời hạn là bắt buộc**, không phải tuỳ chọn. *"Chỉ duy nhất một người duyệt"* rất tốt cho kiểm soát và tạo ra **một điểm chết** — anh Dũng nghỉ thì mọi báo giá đứng |

### 🟡 `BDR-04` · Phê duyệt bốn nền tảng của EDD-01

| # | Phê duyệt cái gì | Hệ quả nếu bác |
|---|---|---|
| a | **Phép thử 5 câu** *(`DL-001`)* làm tiêu chí Domain | Phải có tiêu chí khác, hoặc quay về quyết theo cảm tính |
| b | **14 Domain** *(`DL-002`)* + **Activation Model** *(`DL-003`)* | Phase 4–12 phải làm lại từ đầu |
| c | **Tu chính Điều 18** — ghi nhận Executive Center là *Workspace không có Domain* | Hiến pháp §5.4 tiếp tục mâu thuẫn với mô hình |
| d | **Tu chính Điều 13** — trang chủ có hai vùng: Công việc + Business Apps | Work Inbox không có chỗ hiến định |

---

# §7 · SPRINT SUMMARY

## 7.1 Đã bàn giao

| Phase | Nội dung | Khối lượng |
|---|---|---|
| **1** | Enterprise Business Model — 10 mô hình con | Business · Value Chain · Operating · Organization · Commercial · Manufacturing · Supply Chain · Finance · Service · Digital |
| **2** | Enterprise Capability Model | 3 tầng L0 · **15 nhóm L1** · **91 năng lực L2** · ~280 mục L3 |
| **3** | Enterprise Domain Model | **14 Domain** · **9 Shared Kernel** · 3 Dormant · phép thử · Activation Model · luật sở hữu · so sánh 8 hệ chuẩn ngành |

**Quyết định tự ra:** 30 · **Câu hỏi mở:** 5 · **Cần Board quyết:** 4

## 7.2 Ba phát hiện đáng nhớ nhất Sprint này

| # | Phát hiện |
|---|---|
| **1** | 🔴 **Monica có dữ liệu sản lượng hạng nhất và không tính được hiệu suất.** Thiếu **một** con số — thời gian chuẩn — làm mất **bốn** năng lực cùng lúc: hiệu suất · năng lực · giá vốn công · lương sản phẩm. Và Monica ở vị thế đặc biệt để lấp: đã có 100% dữ liệu thực tế, chỉ cần một ước lượng ban đầu rồi hệ thống tự học |
| **2** | 🔴 **Bốn trong sáu nguồn phá huỷ giá trị lớn nhất là vấn đề THỜI GIAN và THÔNG TIN**, không phải ghi chép. ⇒ Monica ONE phải là **hệ thống phát hiện sớm và điều phối**, không phải hệ thống nhập liệu có báo cáo |
| **3** | 🔴 **FOB không phải "CMT cộng mua hàng".** Hai mô hình kinh doanh khác nhau về rủi ro, vốn, chu kỳ tiền và kiểu thất bại. Mọi ERP tổng quát mô hình sai chỗ này |

## 7.3 Lộ trình Enterprise Business Design

| Sprint | Deliverable | Phase | Nội dung chính |
|---|---|---|---|
| **1** ✅ | **EDD-01** | 1 · 2 · 3 | Business Model · Capability Model · Domain Model |
| **2** | **EDD-02** | 4 · 5 | **Master Data** *(~40 thực thể)* · **Business Object** *(~45 aggregate, mỗi cái: sứ mệnh · vòng đời · chủ · quyền · quan hệ · quy tắc)* |
| **3** | **EDD-03** | 6 · 7 | **Document Architecture** *(mọi chứng từ: sinh ra khi nào · ai ký · ai xem · lưu bao lâu)* · **Information Architecture** *(ai sở hữu · sửa · xem · tham chiếu · quyết định)* |
| **4** | **EDD-04** | 8 · 9 · 10 | **Workflow** *(khai báo, không hardcode)* · **Rule Engine** *(mọi quy tắc tập trung)* · **Permission** *(6 khái niệm × 5 loại phạm vi)* |
| **5** | **EDD-05** | 11 · 12 | **Workspace · Work Inbox · Dashboard · Executive Center · Portal** · **Module Architecture** |
| **6** | **EDD-06** | — | Hợp nhất · rà mâu thuẫn · **hồ sơ Board ký duyệt** |
| **→** | | | 🔓 **Board ký ⇒ mở khoá Implementation** |

⚠️ **Sprint 2 là sprint nặng nhất.** Phase 4 Master Data một mình đã bằng khối lượng ba phase đầu, và nó là nền của Phase 5–12. Tôi đề nghị **không nén nó chung với sprint khác**.

## 7.4 Trạng thái thi hành

| | |
|---|---|
| ⛔ **Mã nguồn** | không chạm — 0 dòng |
| ⛔ **Migration** | không viết |
| ⛔ **Refactor** | không thực hiện |
| ⛔ **SECURITY FREEZE** | vẫn giữ nguyên hiệu lực |

---

## THAM CHIẾU

- **Board Directive 04/08/2026** — Enterprise Business Design · thứ tự tư duy bắt buộc
- **Joseph 04/08/2026** — FOB 30%/CMT 70% · duyệt giá GĐSX · MISA song song · sản lượng bó×công đoạn×giờ · wifi+TV · 13 công đoạn Line Map
- [`docs/architecture/00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) v1.5 — Điều 5 · 7 · 8 · 13 · 16 · 18 · 22 · 37 · 40 · 43
- [`docs/business/BUSINESS_KNOWLEDGE_BASE.md`](../business/BUSINESS_KNOWLEDGE_BASE.md) v2.0
- [`docs/adr/ADR-010`](../adr/ADR-010-thu-bac-van-ban-chuan-tac.md) · [`ADR-011`](../adr/ADR-011-tham-quyen-kien-truc.md)
- [`docs/audit/MONICA_ONE_AUDIT_REPORT.md`](../audit/MONICA_ONE_AUDIT_REPORT.md) — hiện trạng đo được
- `docs/architecture/TARGET_ARCHITECTURE.md` — **bị EDD-01 §Phase 3 thay thế phần Domain**; giữ làm hồ sơ lịch sử theo Hiến pháp §43.7
