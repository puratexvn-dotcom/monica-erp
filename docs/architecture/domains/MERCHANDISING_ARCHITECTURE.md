# D2 · MERCHANDISING — KIẾN TRÚC ĐẦY ĐỦ
## Từ email đầu tiên của khách tới lúc khách trả tiền

| Trường | Giá trị |
|---|---|
| **Domain** | D2 · Merchandising · CORE |
| **Hiến pháp** | Điều 20 |
| **Ngày** | 2026-08-04 |
| **Trạng thái** | ⏳ ĐỀ XUẤT — chờ phản biện, chờ Board |
| **Cha** | [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md) |

---

# 1. MISSION

> **Merchandising giữ LỜI HỨA của Monica với khách hàng, và biến lời hứa đó
> thành một đơn hàng chạy được.**

Ba mệnh đề cụ thể hoá:

| # | Mệnh đề | Hệ quả kiến trúc |
|---|---|---|
| 1 | **MD là nguồn chân lý duy nhất của Order.** Mọi Domain khác đọc Order, không Domain nào sửa Order | Hiến pháp §20.5 · `Order` là aggregate root, sửa qua **duy nhất** MD |
| 2 | **MD chịu trách nhiệm về THỜI GIAN, không chịu trách nhiệm về việc THỰC THI** | MD sở hữu `TnAPlan`; Production sở hữu sản lượng. MD **cảnh báo**, không **điều chuyền** |
| 3 | **MD là nơi cam kết thương mại gặp năng lực sản xuất** | Nút giao MD ⟷ Planning là điểm nghẽn kiến trúc quan trọng nhất toàn hệ thống |

---

# 2. RESPONSIBILITY

| Trách nhiệm | Đo bằng |
|---|---|
| Đơn hàng được xác nhận với **giá đúng, ngày đúng, điều kiện đúng** | biên LN kế hoạch ⟷ thực · tỷ lệ đơn phải sửa sau xác nhận |
| Lịch T&A được lập và **theo dõi tới cùng** | tỷ lệ mốc đạt hạn |
| Ngoại lệ được **phát hiện sớm và leo thang đúng người** | thời gian từ lúc phát sinh tới lúc có người xử lý |
| Thay đổi của khách được **kiểm soát, có phân tích tác động** | số thay đổi không qua luồng duyệt = **phải bằng 0** |
| Đơn hàng **đóng được** — không tồn tại đơn treo vô hạn | số đơn quá hạn đóng |

---

# 3. BUSINESS BOUNDARY — ranh giới sở hữu

## 3.1 MD SỞ HỮU *(ghi được, chịu trách nhiệm)*

`Inquiry` · `Costing` · `Quotation` · **`Order`** · `OrderLine` · `SizeBreakdown` ·
`DeliverySchedule` · `TnAPlan` · `Milestone` · `OrderChange` · `OrderMaterialPlan` ·
`OrderAllocation` · `OrderDocument` · `OrderComment` · `OrderRisk`

## 3.2 MD ĐỌC, KHÔNG SỞ HỮU

| Đọc gì | Của Domain |
|---|---|
| `Customer` · `Contract` · `PriceAgreement` · `PaymentTerm` | D1 Commercial |
| `Style` · `TechPack` · `Sample` · `BOM` · `Consumption` | D3 Product Development |
| `SMV` · `OperationBulletin` | D4 Industrial Engineering |
| `Capacity` · `ProductionOrder` · `MaterialRequirement` | D5 Planning |
| Sản lượng · WIP | D6 Production |
| Kết quả kiểm | D7 Quality |
| Tồn kho · sẵn sàng NPL | D9 Warehouse |
| `Shipment` | D10 Shipment |
| `Assignment` | D11 Subcontract |
| `Invoice` · `Payment` · công nợ | D12 Finance |

## 3.3 Ba đường ranh dễ vẽ sai — và cách vẽ đúng

| Ranh giới | Sai phổ biến | Đúng |
|---|---|---|
| **MD ⟷ Commercial** | MD sở hữu luôn `Customer` *(hiện trạng)* | Commercial sở hữu **quan hệ và giá**; MD sở hữu **giao dịch**. ⚠️ Một người có thể giữ cả hai Role — **ranh giới Domain không phải sơ đồ tổ chức** |
| **MD ⟷ Planning** | MD tự xếp lịch chuyền | MD **hỏi** *"nhận nổi không"*, Planning **trả lời**. MD nhận `CapacityCheckResult`, không nhận quyền xếp chuyền |
| **MD ⟷ Product Development** | MD sở hữu Style và mẫu *(hiện trạng)* | PD sở hữu **sản phẩm**; MD **tham chiếu** sản phẩm vào đơn. Một Style dùng cho nhiều PO |

> ### ⚠️ Mâu thuẫn phải trình Board — không tự quyết
>
> **BKB §B.5 *(bậc 0′)*** ghi *"Thuộc MD: khách hàng · vào đơn · chiết tính ·
> **hợp đồng** · sở hữu NPL · **mẫu** · phân bổ sản xuất."*
>
> **Hiến pháp Điều 19 *(bậc 1)*** giao *Customer · Contract · Price* cho
> **Commercial**.
>
> Hai bên cùng thẩm quyền, khác lĩnh vực: BKB nói *ai làm việc đó trong nhà máy*,
> Hiến pháp nói *dữ liệu thuộc Domain nào*. **`CLAUDE.md` §0 bắt DỪNG khi hai bên
> mâu thuẫn thật.**
>
> **Lời giải tôi đề nghị:** cả hai đều đúng, vì chúng nói về hai trục khác nhau.
> Domain boundary là **kỹ thuật**; ai ngồi làm là **tổ chức**. Merchandiser của
> Monica được cấp Role trong **cả hai** Domain. → **`BC2-Q3` xin Board xác nhận.**

---

# 4. BUSINESS OBJECTS & AGGREGATES

## 4.1 Aggregate `Order` — trung tâm toàn hệ thống

```
Order  (aggregate root)
├─ OrderHeader
│    order_no · customer_id → D1 · contract_id → D1
│    order_type: CMT | FOB | OEM | ODM          ← rẽ nhánh quy trình
│    order_nature: SAMPLE | BULK                ← ❓ OQ-014
│    currency · incoterm · payment_term_id → D1
│    order_date · requested_delivery · confirmed_delivery
│    status  (máy trạng thái §6)
│    request_id UUID UNIQUE                     ← chống gửi trùng · ADR-003
│    version INT                                ← khoá lạc quan · ADR-004
│    deleted_at · deleted_by                    ← xoá mềm
├─ OrderLine  1..n
│    style_id → D3 · colorway · qty · unit_price · currency
│    ⚠️ unit_price ở dòng, KHÔNG ở header — mỗi màu có thể một giá
├─ SizeBreakdown  1..n theo OrderLine
│    size · qty · ratio
├─ DeliverySchedule  1..n            ← ❓ OQ-012 quyết 1-1 hay 1-n
│    delivery_no · qty · eta · port_of_discharge
└─ OrderDocument · OrderComment · OrderRisk
```

**Bốn luật bất biến của aggregate này:**

| # | Luật | Cưỡng chế ở đâu |
|---|---|---|
| 1 | `Σ SizeBreakdown.qty = OrderLine.qty` | ràng buộc CSDL + bài kiểm |
| 2 | `Σ DeliverySchedule.qty = Σ OrderLine.qty` | ràng buộc CSDL |
| 3 | Đơn đã `CONFIRMED` **không `UPDATE` trực tiếp** — phải qua `OrderChange` | trigger + guard |
| 4 | **Mọi con số có đơn vị và tiền tệ** | kiểu dữ liệu · `CLAUDE.md` §2.5 |

## 4.2 Aggregate `Costing` — có phiên bản

```
Costing (root)
├─ costing_no · order_id? · inquiry_id? · style_id → D3
├─ version INT · supersedes_id            ← phiên bản, không sửa đè
├─ status: DRAFT→SUBMITTED→APPROVED|REJECTED|REVISE|SUPERSEDED   ✅ đã có
├─ CostingLine  1..n
│    category: MATERIAL | TRIM | LABOUR | OVERHEAD | LOGISTICS | FINANCE | OTHER
│    source_ref     ← BOM line (D3) hoặc SMV (D4) — TRUY VẾT được
│    qty · unit · unit_cost · currency · fx_rate · amount
├─ CostingSummary  (DẪN XUẤT — không lưu)
│    total_cost · target_price · quoted_price
│    🔴 margin_percent = TÍNH, KHÔNG LƯU   ← sửa vi phạm hiện tại (F16)
└─ CostingApproval → S5
```

**Ba luật:**

| # | Luật |
|---|---|
| 1 | 🔴 **`margin_percent` KHÔNG được lưu.** Suy được từ giá ⇒ `CLAUDE.md` §2.5 cấm |
| 2 | 🔴 **`Costing` là dữ liệu Restricted.** Không cổng ngoài nào đọc được — dù chỉ một cột |
| 3 | Mỗi `CostingLine` phải **truy ngược** được về `BOM` *(D3)* hoặc `SMV` *(D4)*. Số gõ tay phải đánh dấu `manual_override` kèm lý do |

## 4.3 Aggregate `TnAPlan`

```
TnAPlan (root)
├─ order_id · template_id → TnATemplate · anchor_type · anchor_date
│    ❓ OQ-022: anchor = ngày xuất xưởng hay ngày tàu chạy
├─ Milestone  1..n
│    code · name · owner_role · owner_user
│    planned_date · actual_date · status: PENDING|IN_PROGRESS|DONE|LATE|SKIPPED
│    depends_on[]              ← ĐỒ THỊ phụ thuộc, không phải danh sách phẳng
│    is_critical  (DẪN XUẤT — tính từ đường găng, không lưu)
│    lead_days · buffer_days
└─ TnABreach                   ← sự kiện trễ, sinh Exception
```

**Ba luật:**

| # | Luật | Vì sao |
|---|---|---|
| 1 | 🔴 **`Milestone` có `depends_on[]`** — đồ thị, không phải danh sách | Không có phụ thuộc thì không tính được **đường găng**, và T&A chỉ là một cái checklist |
| 2 | 🔴 **`is_critical` TÍNH, không LƯU** | Đường găng đổi khi ngày thực tế đổi |
| 3 | **Mỗi mốc có chủ sở hữu là ROLE**, không phải người cụ thể | Người nghỉ việc thì mốc vẫn có chủ |

## 4.4 Aggregate `OrderMaterialPlan` — giải bài toán đơn hỗn hợp

> 🔴 **Đây là aggregate MỚI, không tồn tại hôm nay, và nó sửa một sai lầm mô hình
> đang có.**
> Hôm nay `order_type` là **một cột trên header** ⇒ mô hình chỉ diễn đạt được
> *"cả đơn là CMT"* hoặc *"cả đơn là FOB"*. Nếu Monica có đơn **hỗn hợp**
> *(khách cấp vải, Monica mua phụ liệu)* — chuyện rất phổ biến — mô hình hiện tại
> **không diễn đạt nổi**. → `BC1-B11`

```
OrderMaterialPlan (root)
├─ order_id
├─ MaterialPlanLine  1..n      ← MỘT DÒNG CHO MỖI VẬT TƯ
│    bom_line_id → D3 · material_id → S3
│    ownership: CUSTOMER_SUPPLIED | MONICA_PURCHASED | CUSTOMER_NOMINATED
│    required_qty · uom
│    expected_arrival · responsible_party
│    procurement_ref → D8 (nếu Monica mua)
│    inbound_ref → D9 (nếu khách cấp)
└─ MaterialReadiness (DẪN XUẤT từ D9 — không lưu)
     ready_percent · shortage_list · blocking_lines
```

## 4.5 Các aggregate còn lại

| Aggregate | Root fields chính | Ghi chú |
|---|---|---|
| `Inquiry` | `inquiry_no` · `customer_id` · `status: NEW→COSTING→QUOTED→WON\|LOST\|CANCELLED` | ✅ đã có. ⚠️ **KHÔNG được là cửa vào duy nhất** — `BR-ORD-001` |
| `Quotation` | `quotation_no` · `version` · `costing_id` · `valid_until` | ❌ chưa có bảng riêng |
| `OrderChange` | `change_no` · `change_type` · `before/after` · `impact_analysis` · `approval_id → S5` | ⚠️ có `change_requests`, chưa nối luồng |
| `OrderAllocation` | `order_id` · `target: INTERNAL\|SUBCON` · `production_order_id → D5` · `assignment_id → D11` · `qty` | ⚠️ hiện ẩn trong `assignments` |
| `OrderRisk` | `risk_type` · `severity` · `owner` · `mitigation` | ⚠️ có `risk_assessments`, không nối |

---

# 5. WORKFLOW — 14 bước của Board, ánh xạ đầy đủ

## 5.1 Sơ đồ tổng

```
① Email + TechPack từ khách ──┐
                              ├──▶ [Order Intake]  ⚠️ HAI cửa vào NGANG HÀNG
   (tuỳ chọn) Hỏi hàng ───────┘         │              — BR-ORD-001
                                        ▼
② Mẫu vật lý / thông tin kỹ thuật đủ   [D3 Product Development]
                                        ▼
③ CHIẾT TÍNH  ⚠️ SAU mẫu               [Costing v1]  ◀── BOM (D3) + SMV (D4)
                                        ▼
④ (tuỳ chọn) May mẫu                   [D3 Sample: PROTO→FIT→SIZE_SET…]
                                        ▼
⑤ BÁO GIÁ                              [Quotation]  ──▶ duyệt giá (S5) ❓OQ-002
                                        ▼
⑥ HỢP ĐỒNG                             [D1 Contract] ❓OQ-009
                                        ▼
⑦ PO CỦA KHÁCH                         [Order: DRAFT]
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
        ⑧ SỞ HỮU NPL           [CTP check → D5]      [T&A generate]
      [OrderMaterialPlan]      "nhận nổi không?"     lùi từ anchor
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        ▼
                                 [Order: CONFIRMED]  ← CỔNG 1
                                        ▼
⑨ Phát triển mẫu + PP MEETING          [D3 PPMeeting] ──▶ PP sample APPROVED
                                        ▼
⑩ PHÂN BỔ SẢN XUẤT                     [OrderAllocation]
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
          [D5 ProductionOrder]                    [D11 Assignment]
             nội bộ                                  thuê ngoài
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        ▼
                                 [Order: PLANNED]  ← CỔNG 2
                                        ▼
                          [D9 cấp NPL] ──▶ [D6 Production]
                                        ▼
                                 [Order: IN_PRODUCTION]  ← CỔNG 3
                                        ▼
⑪ KIỂM CHẤT LƯỢNG                      [D7: Inline → Pre-Final → FINAL → Packing]
                                        │        ❓OQ-026 chặng nào bắt buộc
                                        ▼
                                 [Order: PRODUCTION_COMPLETE]
                                        ▼
⑫ XUẤT HÀNG                            [D10: Booking → Packing → Shipment]
                                        ▼
                                 [Order: SHIPPED]  ← CỔNG 4
                                        ▼
⑬ HOÁ ĐƠN                              [D12 Invoice]  ❓OQ-001
                                        ▼
                                 [Order: INVOICED]
                                        ▼
⑭ THU TIỀN · CÔNG NỢ                   [D12 Payment - Deduction] ❓OQ-017 OQ-018
                                        ▼
                                 [Order: CLOSED]  ❓OQ-035 — đóng ở đâu?
```

## 5.2 Bốn cổng kiểm soát — nơi thật sự cần thiết kế

| Cổng | Chuyển | Điều kiện bắt buộc | Ai vượt được | Trạng thái |
|---|---|---|---|---|
| **CỔNG 1** | `DRAFT → CONFIRMED` | ① có chứng từ PO khách · ② giá đã chốt *(Costing `APPROVED` hoặc `Contract` price)* · ③ có ngày giao · ④ `OrderMaterialPlan` đã quyết · ⑤ **CTP trả lời được** | ❓ `OQ-003` | ❌ **không tồn tại hôm nay** |
| **CỔNG 2** | `CONFIRMED → PLANNED` | ① T&A đã sinh · ② phân bổ xong · ③ `MaterialRequirement` đã tính | Planner | ❌ không tồn tại |
| **CỔNG 3** | `PLANNED → IN_PRODUCTION` | ① **mẫu PP đã duyệt** · ② **NPL sẵn sàng ≥ ngưỡng** | ❓ `OQ-023` | ❌ `RELEASED` chỉ là nhãn |
| **CỔNG 4** | `PRODUCTION_COMPLETE → SHIPPED` | ① QA Final **đạt** · ② packing list · ③ booking · ④ bộ chứng từ đủ | Logistics Officer | ⚠️ một phần |

> 🔴 **Không cổng nào trong bốn cổng này tồn tại hôm nay.** Đây là lý do gốc khiến
> hệ thống *"ghi lại việc đã xảy ra"* thay vì *"kiểm soát việc sắp xảy ra"* — và
> đó là khác biệt giữa một sổ ghi chép và một ERP.

---

# 6. MÁY TRẠNG THÁI `Order` — có LUẬT CHUYỂN

> Hiện tại: mã dùng **10 chuỗi trạng thái**, CSDL **không ràng buộc gì**.
> Đây là thiết kế thay thế, theo khuôn `lib/mos/domain/assignment.ts:73-80` —
> khuôn duy nhất trong kho mã đang làm đúng.

```typescript
export const ORDER_STATUSES = [
  'DRAFT', 'CONFIRMED', 'PLANNED', 'IN_PRODUCTION',
  'PRODUCTION_COMPLETE', 'SHIPPED', 'INVOICED', 'CLOSED',
  'ON_HOLD', 'CANCELLED',
] as const;

export const TERMINAL_STATUSES = ['CLOSED', 'CANCELLED'] as const;

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  DRAFT:               ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:           ['PLANNED', 'ON_HOLD', 'CANCELLED'],
  PLANNED:             ['IN_PRODUCTION', 'ON_HOLD', 'CANCELLED'],
  IN_PRODUCTION:       ['PRODUCTION_COMPLETE', 'ON_HOLD', 'CANCELLED'],
  PRODUCTION_COMPLETE: ['SHIPPED', 'ON_HOLD'],
  SHIPPED:             ['INVOICED'],
  INVOICED:            ['CLOSED'],
  ON_HOLD:             ['CONFIRMED', 'PLANNED', 'IN_PRODUCTION', 'CANCELLED'],
  CLOSED:              [],
  CANCELLED:           [],
};
```

## 6.1 Bốn quyết định thiết kế phải giải thích

| # | Quyết định | Lý do |
|---|---|---|
| 1 | **`SHIPPED` không quay lui được** | Hàng đã lên tàu. Sai sót xử lý bằng **chứng từ điều chỉnh**, không bằng đổi trạng thái — `CLAUDE.md` §2.5 |
| 2 | **`PRODUCTION_COMPLETE` không huỷ được** | Hàng đã may xong. Huỷ ở đây là chuyện thương mại, phải có chứng từ riêng, không phải một phép chuyển |
| 3 | **`ON_HOLD` quay lại đúng trạng thái trước đó** | Cần lưu `status_before_hold`. Treo đơn rồi thả ra phải về đúng chỗ |
| 4 | **`CLOSED` sau `INVOICED`, không sau `SHIPPED`** | ⚠️ Giả định của tôi. ❓ `OQ-035` — nếu Board nói đóng khi **thu đủ tiền**, thêm `SETTLED` giữa `INVOICED` và `CLOSED` |

## 6.2 Huỷ đơn — thao tác đang thiếu hoàn toàn

```
CancelOrder(order_id, reason, material_disposition)
  ├─ kiểm quyền huỷ          ❓ OQ-004 — AI được huỷ
  ├─ kiểm trạng thái cho phép
  ├─ BẮT BUỘC: kế hoạch xử lý NPL đã mua   ❓ OQ-004
  │     RETURN_TO_SUPPLIER | CHARGE_TO_CUSTOMER | STOCK_FOR_REUSE | SCRAP
  ├─ BẮT BUỘC: xử lý các Assignment đang mở  → D11
  ├─ BẮT BUỘC: xử lý Reservation trong kho   → D9
  ├─ sinh Deduction/Claim nếu có             → D12
  └─ emit OrderCancelled → S7 read-model
```

> 🔴 **Đây là lý do `OQ-004` là câu quan trọng thứ hai của Confirmation #1.**
> Huỷ đơn **không phải** đổi một cột — nó là một giao dịch chạm bốn Domain.

---

# 7. FEATURES — kiểm kê đầy đủ theo module

## 7.1 Order Intake

Nhận đơn từ email *(gắn tệp gốc làm bằng chứng)* · nhập từ hỏi hàng · **nhập thẳng PO cho khách quen** ·
nhập hàng loạt từ Excel · **nhân bản đơn cũ** *(F11 — đang thiếu)* · kiểm trùng PO number ·
`request_id` sinh lúc **MỞ** biểu mẫu *(ADR-003)* · gắn TechPack phiên bản.

## 7.2 Costing

Tạo từ BOM *(D3)* + SMV *(D4)* · **nhiều phiên bản, so sánh cạnh nhau** ·
what-if *(đổi giá vải · đổi hiệu suất chuyền · đổi tỷ giá)* · chiết tính theo màu/size ·
mẫu chiết tính theo `order_type` · **cảnh báo khi biên LN dưới ngưỡng** ·
gửi duyệt *(S5)* · sao chép từ style tương tự · xuất PDF.

## 7.3 Quotation

Nhiều phương án *(số lượng khác nhau → giá khác nhau)* · hiệu lực báo giá + **cảnh báo hết hạn** ·
lịch sử gửi–phản hồi · **chuyển thành đơn một bấm** · tỷ lệ thắng theo khách.

## 7.4 Order Book — trung tâm

Danh sách theo **ngoại lệ** *(mặc định lọc "cần chú ý")* · Order 360° · sửa có kiểm soát ·
🔴 **huỷ · tách · gộp · nhân bản** *(bốn thao tác cơ bản đang thiếu hết)* ·
đổi ngày giao có phân tích tác động · treo/thả đơn · phân trang *(F34)* ·
lọc theo `order_type` · `order_nature` · khách · style · trạng thái · mức khẩn cấp.

## 7.5 T&A / Critical Path

Sinh lịch từ mẫu theo `order_type` · lùi ngược từ anchor · **tính đường găng** ·
gán chủ sở hữu theo Role · đánh dấu hoàn thành + bằng chứng ·
🔴 **leo thang tự động khi trễ** *(quy tắc đang chết một nửa — Audit §M4)* ·
xem dạng Gantt · so sánh kế hoạch ⟷ thực tế · mẫu lịch cấu hình được.

## 7.6 Material Ownership Plan

Sinh từ BOM · **chọn sở hữu theo TỪNG DÒNG** · sinh yêu cầu mua *(D8)* cho dòng Monica mua ·
theo dõi hàng khách cấp *(D9)* · **bảng sẵn sàng NPL theo %** ·
🔴 **danh sách dòng đang chặn lên chuyền** · cảnh báo NPL về trễ *(`OQ-029`)*.

## 7.7 Allocation

Chia đơn theo số lượng/màu/size cho nhiều đích · nội bộ *(→ D5)* · thuê ngoài *(→ D11)* · **cả hai** ·
xem năng lực còn trống trước khi chia · **hồ sơ năng lực nhà thầu** *(`OQ-024` — đang thiếu)* ·
theo dõi tiến độ từng phần · đối soát tổng phần chia = tổng đơn.

## 7.8 Change Management

Tạo yêu cầu thay đổi · **phân tích tác động tự động**: T&A · NPL · năng lực · giá · shipment ·
luồng duyệt *(S5)* · áp dụng thay đổi *(sinh phiên bản đơn mới, giữ bản cũ)* ·
lịch sử thay đổi đầy đủ · **thay đổi từ khách qua Portal cũng đi đường này**.

## 7.9 Order Control Tower

🔴 **Bảng ngoại lệ, không phải bảng dữ liệu** · nhóm theo loại vấn đề ·
mỗi ngoại lệ có **chủ sở hữu và hạn xử lý** · một bấm sang màn hình xử lý ·
xu hướng theo tuần · lọc theo merchandiser.

---

# 8. PERMISSIONS

| Hành động | Merchandiser | MD Manager | Commercial Mgr | Planner | CEO/Director | Customer | Subcon |
|---|---|---|---|---|---|---|---|
| Xem Order *(phạm vi)* | mọi đơn được giao | mọi đơn | đơn của khách mình phụ trách | mọi đơn | mọi đơn | **đơn của mình** | ❌ |
| Tạo Order | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Xác nhận Order** | ⚠️ ❓`OQ-003` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Sửa Order chưa xác nhận | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sửa Order đã xác nhận | ❌ *(qua OrderChange)* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Huỷ Order** | ❌ | ⚠️ ❓`OQ-004` | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tách / gộp Order | ✅ đề xuất | ✅ duyệt | ❌ | ✅ đề xuất | ❌ | ❌ | ❌ |
| 🔴 **Xem Costing** | ✅ | ✅ | ✅ | ❌ | ✅ | ⛔ **KHÔNG** | ⛔ **KHÔNG** |
| 🔴 **Xem biên lợi nhuận** | ⚠️ ❓ | ✅ | ✅ | ❌ | ✅ | ⛔ | ⛔ |
| Duyệt Costing | ❌ | ⚠️ ❓`OQ-002` | ⚠️ ❓ | ❌ | ✅ | ❌ | ❌ |
| Xem T&A | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ mốc công khai | ⚠️ mốc phần mình |
| Cập nhật mốc T&A | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ⚠️ mốc phần mình |
| Phân bổ sản xuất | ✅ đề xuất | ✅ chốt | ❌ | ✅ | ✅ | ❌ | ❌ |
| Tạo OrderChange | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **đề nghị** | ❌ |
| Duyệt OrderChange | ❌ | ✅ | ⚠️ nếu chạm giá | ⚠️ nếu chạm lịch | ✅ | ❌ | ❌ |
| Bình luận | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ *(luồng chung)* | ✅ *(luồng phần mình)* |

**Ba luật cưỡng chế ở tầng CSDL, không chỉ ở giao diện:**

| # | Luật |
|---|---|
| P1 | 🔴 **`Costing` · `CostingLine` · `OrderMaterialPlan.unit_cost`: cấm tuyệt đối mọi vai ngoài.** Policy `deny` tường minh, không dựa vào việc "không có policy cho phép" |
| P2 | **`Order` với vai `buyer`: chỉ đơn có `customer_id` khớp `PartnerAccount` đang `is_active`** — không lấy từ claim JWT |
| P3 | **`Order` với vai `subcon`: chỉ qua `Assignment`**, không bao giờ qua `subcon_id` — Playbook Điều XXX |

---

# 9. DASHBOARD

## 9.1 Nguyên tắc

> **Bảng điều khiển MD trả lời "hôm nay tôi phải làm gì", không trả lời "có bao
> nhiêu đơn".** `BR-EXE-002` cấm bảng dữ liệu thô — nguyên tắc đó áp cho MD luôn.

## 9.2 Bố cục — từ trên xuống

```
┌─ HÀNG NGOẠI LỆ  (ưu tiên tuyệt đối — luôn ở trên cùng)
│   🔴 Đơn trễ mốc găng     🔴 NPL thiếu chặn lên chuyền
│   🔴 Mẫu quá hạn phản hồi 🟠 Báo giá sắp hết hiệu lực
│   🟠 Thay đổi chờ duyệt   🟠 Đơn chưa phân bổ sát ngày
│   🟠 Đơn biên LN dưới ngưỡng
├─ KPI HÀNG *(6 ô — mỗi ô có MetricDefinition mang mã)*
│   Sổ đơn (giá trị · số lượng) · Đúng hạn % · Biên LN kế hoạch ⟷ thực
│   Mốc T&A đạt % · Đơn cần chú ý · Tỷ lệ thắng báo giá
├─ ĐƯỜNG ỐNG ĐƠN HÀNG  (phễu theo trạng thái, bấm được)
├─ BẢNG ĐƠN CẦN CHÚ Ý  (mặc định LỌC, không phải liệt kê tất cả)
├─ LỊCH GIAO 8 TUẦN TỚI  (theo tuần, so với năng lực)
└─ BIỂU ĐỒ  (LUÔN cuối — UI_UX_STANDARDS)
```

---

# 10. AUTOMATION

| # | Tự động hoá | Kích hoạt | Hành động |
|---|---|---|---|
| A1 | **Sinh lịch T&A** | Order `CONFIRMED` | Lấy mẫu theo `order_type`, lùi từ anchor, gán chủ theo Role |
| A2 | 🔴 **Leo thang khi trễ mốc** | mốc quá hạn | Nâng mức khẩn cấp · thông báo chủ mốc · +N ngày báo lên cấp trên |
| A3 | **Cảnh báo thiếu NPL** | `MaterialReadiness < ngưỡng` và còn ≤ N ngày tới cổng 3 | Ngoại lệ + thông báo MD + Planning + Procurement |
| A4 | **Nhắc mẫu quá hạn** | mẫu `SENT` quá N ngày chưa phản hồi | Nhắc khách qua Portal + báo MD |
| A5 | **Báo giá sắp hết hiệu lực** | `valid_until` − 7 ngày | Nhắc MD |
| A6 | **Tính lại đường găng** | mốc có `actual_date` | Tính lại `is_critical`, phát cảnh báo nếu đường găng đổi |
| A7 | **Đề nghị phân bổ** | Order `CONFIRMED` | Gợi ý nội bộ/thuê ngoài từ năng lực trống *(D5)* + năng lực nhà thầu *(D11)* — **gợi ý, không tự quyết** |
| A8 | **Sinh yêu cầu mua** | `OrderMaterialPlan` chốt | Đẩy dòng `MONICA_PURCHASED` sang D8 |
| A9 | **Đối soát tổng phân bổ** | mỗi lần đổi allocation | Cảnh báo nếu `Σ allocation ≠ Σ order qty` |
| A10 | **Đóng đơn** | `INVOICED` + thanh toán đủ | Đề nghị đóng — **cần người xác nhận**, không tự đóng |

> ⚠️ **Không tự động hoá nào được ra quyết định nghiệp vụ.** Hiến pháp §12.5 ·
> §31.7 — AI và tự động hoá tăng cường con người, không thay con người.

---

# 11. REPORTS

| Báo cáo | Câu hỏi trả lời | Người dùng | Nguồn |
|---|---|---|---|
| **Order Book** | Ta đang cam kết bao nhiêu, tới ngày nào | MD · CEO | S7 |
| **OTD — Đúng hạn** | Bao nhiêu % giao đúng hạn, trễ vì sao | MD · CEO · Commercial | S7 |
| **Biên LN kế hoạch ⟷ thực** | Đơn nào lãi thật, đơn nào lỗ | MD · CFO · CEO | S7 + D12 |
| **T&A Compliance** | Mốc nào hay trễ, ở khâu nào | MD · Planning | S7 |
| **Sample Hit Rate** | Mẫu duyệt lần đầu bao nhiêu % | MD · PD | S7 |
| **Quotation Win Rate** | Báo giá thắng bao nhiêu, thua vì giá hay vì thời gian | Commercial | S7 |
| **Change Impact** | Thay đổi làm trễ bao nhiêu, tốn bao nhiêu | MD · CEO | S7 |
| **Customer Profitability** | Khách nào đáng giữ | Commercial · CEO | S7 + D12 |
| **Material Readiness** | Đơn nào sắp tắc vì NPL | MD · Planning · Procurement | S7 + D9 |

🔴 **Mọi báo cáo trên đọc từ S7. Không báo cáo nào tự tính.** `BR-RPT-001`.

---

# 12. APPROVAL — luồng duyệt

> Dùng **Approval Engine S5** dùng chung, không viết riêng cho MD.

| Luồng | Người trình | Người duyệt | Ngưỡng | Trạng thái |
|---|---|---|---|---|
| Duyệt Costing / giá báo khách | Merchandiser | ❓ `OQ-002` | ❓ theo giá trị · biên LN · khách | ❌ chưa có |
| Xác nhận nhận đơn | Merchandiser | ❓ `OQ-003` | ❓ | ❌ chưa có |
| **Huỷ đơn** | Merchandiser | ❓ `OQ-004` | ❓ | ❌ chưa có |
| Thay đổi đơn *(số lượng · ngày · giá)* | bất kỳ | MD Manager *(+ Commercial nếu chạm giá, + Planning nếu chạm lịch)* | mọi thay đổi sau `CONFIRMED` | ⚠️ có bảng, chưa nối |
| Vượt cổng 3 khi thiếu điều kiện | Planner | ❓ `OQ-023` | — | ❌ chưa có |
| Chốt phân bổ sản xuất | Merchandiser | MD Manager | — | ❌ chưa có |

**Yêu cầu với Approval Engine S5** *(dùng chung mọi Domain)*:
nhiều cấp · uỷ quyền khi vắng · **leo thang theo thời gian** · duyệt hàng loạt ·
🔴 **truy vết đầy đủ: ai duyệt, lúc nào, thấy dữ liệu gì lúc đó** *(Hiến pháp Điều 8)*.

---

# 13. DOCUMENTS

| Chứng từ | Sở hữu | Phiên bản | Ai xem |
|---|---|---|---|
| Email/PO gốc của khách | MD | — | nội bộ + khách |
| 🔴 **Tech Pack** | D3 | ✅ **BẮT BUỘC có phiên bản** | nội bộ + khách + *(bản rút gọn cho nhà thầu)* |
| Hợp đồng | D1 | ✅ + phụ lục | nội bộ + khách |
| 🔴 **Bảng chiết tính** | MD | ✅ | ⛔ **CHỈ nội bộ** |
| Báo giá | MD | ✅ | nội bộ + khách |
| Biên bản PP Meeting | D3 | — | nội bộ + khách |
| Bảng thông số size | D3 | ✅ | nội bộ + khách + nhà thầu |
| Trim card · artwork | D3 | ✅ | nội bộ + nhà thầu |
| Packing list · invoice · CO · BL | D10 · D12 | — | nội bộ + khách |

**Ba luật:**

| # | Luật | Nguồn |
|---|---|---|
| 1 | 🔴 **Tech Pack không sửa đè — phiên bản mới, giữ bản cũ** | Hiến pháp Điều 8 · `OQ-015`. Tranh chấp với khách được xử bằng *"lúc đó bản nào đang hiệu lực"* |
| 2 | **Mọi chứng từ gắn được vào Order · Style · Shipment · Party** — không chỉ vào Order | Kernel S4 |
| 3 | **Mỗi lần tải về được ghi nhật ký** | Hiến pháp Điều 8 · điều tra rò rỉ |

---

# 14. INTEGRATION

| Tích hợp | Chiều | Trạng thái | Chặn bởi |
|---|---|---|---|
| **Phần mềm kế toán** | MD/D12 → ngoài | ❌ | 🔴 `OQ-001` |
| **Cổng khách hàng của Buyer / EDI** | hai chiều | ❌ | `FD-002` |
| **Hãng tàu / forwarder** | D10 ↔ ngoài | ❌ | `FD-002` |
| **Email vào đơn** | ngoài → MD | ❌ | — *(đáng làm sớm: bước ① của Board là email)* |
| **Customer Portal** | nội bộ ↔ khách | ⚠️ một phần | `VR-001` |
| **Subcontract Portal** | nội bộ ↔ nhà thầu | ⚠️ một phần | `VR-002` |

**Nguyên tắc tích hợp:** mọi tích hợp đi qua **contract tường minh** *(không đọc
thẳng bảng)*, có **hàng đợi và thử lại**, có **nhật ký đầy đủ**, và **thất bại
tích hợp không được làm hỏng giao dịch nghiệp vụ**.

---

# 15. BUSINESS RULES — sổ đăng ký của MD

| Mã | Quy tắc | Nguồn | Cưỡng chế ở đâu |
|---|---|---|---|
| `MD-R01` | Vào đơn có **hai cửa ngang hàng**: Email+TechPack hoặc Hỏi hàng | `BR-ORD-001` | giao diện + service |
| `MD-R02` | **PO = PO của khách.** Không tạo PO nội bộ | `BR-ORD-002` | mô hình dữ liệu |
| `MD-R03` | Mẫu vật lý đi **TRƯỚC** chiết tính | `BR-CST-001` | cổng 1 · ❓ mềm hay cứng: `OQ-011` |
| `MD-R04` | Chiết tính **có phiên bản**, không sửa đè | `BR-CST-002` | CSDL ✅ đã có |
| `MD-R05` | 🔴 **`margin_percent` KHÔNG lưu** | `CLAUDE.md` §2.5 | arch test |
| `MD-R06` | 🔴 **Chiết tính và biên LN: cấm tuyệt đối vai ngoài** | `BR-ACC-002` | **RLS** + bài kiểm |
| `MD-R07` | **Sở hữu NPL quyết theo TỪNG DÒNG**, cho phép hỗn hợp | `BR-MAT-001` · `OQ-016` | mô hình dữ liệu |
| `MD-R08` | Đơn `CONFIRMED` **không `UPDATE` trực tiếp** | `CLAUDE.md` §2.5 | trigger + guard |
| `MD-R09` | Mọi phép chuyển trạng thái phải nằm trong `ORDER_TRANSITIONS` | §6 · TD-03 | mã + CSDL + **phép kiểm đối chiếu** |
| `MD-R10` | `Σ SizeBreakdown = OrderLine.qty` | §4.1 | ràng buộc CSDL |
| `MD-R11` | `Σ Allocation = Σ Order qty` | §7.7 | service + A9 |
| `MD-R12` | 🔴 **Trễ mốc T&A ⇒ nâng mức khẩn cấp** | `BR-TNA-002` | ⚠️ **đang chết ở PO 360°** — Audit §M4 |
| `MD-R13` | T&A lùi ngược từ anchor theo mẫu của `order_type` | `BR-TNA-001` | service · ❓ anchor: `OQ-022` |
| `MD-R14` | **Một PO chia nhiều nhà máy; một nhà máy nhận nhiều PO** | `BR-PRD-002` | ✅ `assignments` |
| `MD-R15` | `request_id` sinh lúc **MỞ** biểu mẫu; service bắt `23505` trả dòng cũ `ok:true` | ADR-003 | service |
| `MD-R16` | Xung đột ghi đè dùng mã **`P0409`**, không dùng `40001` | ADR-004 | service |
| `MD-R17` | Xoá mềm bắt buộc; `UNIQUE` phải là chỉ mục **một phần** | `CLAUDE.md` §2.5 | CSDL |
| `MD-R18` | Huỷ đơn **bắt buộc** kèm kế hoạch xử lý NPL | §6.2 · `OQ-004` | service |
| `MD-R19` | Mọi chỉ số hiển thị phải có `MetricDefinition` | `BR-RPT-001` | arch test |
| `MD-R20` | Tech Pack **có phiên bản**, giữ bản cũ | Hiến pháp Điều 8 · `OQ-015` | mô hình dữ liệu |

---

# 16. EXCEPTION HANDLING

> **Ngoại lệ là sản phẩm chính của MD, không phải sự cố.** Một merchandiser giỏi
> là người xử ngoại lệ nhanh — hệ thống phải làm cho ngoại lệ **nhìn thấy được và
> có chủ**.

| Mã | Ngoại lệ | Phát hiện | Chủ sở hữu | Leo thang | Trạng thái |
|---|---|---|---|---|---|
| `EX-01` | **Trễ mốc T&A** | tự động | chủ mốc | +2 ngày → MD Manager · +5 → Director | ⚠️ chết ở PO 360° |
| `EX-02` | **NPL về trễ / thiếu** | tự động từ D9 | Procurement | MD + Planning ngay | ❌ `OQ-029` |
| `EX-03` | **Mẫu bị khách từ chối** | sự kiện D3 | Product Developer | lần 2 → MD Manager | ⚠️ một phần |
| `EX-04` | **Khách đổi yêu cầu sau xác nhận** | thủ công / Portal | Merchandiser | luồng OrderChange | ⚠️ có bảng |
| `EX-05` | **Trượt AQL** | sự kiện D7 | QA Manager | MD + khách | ❌ `OQ-027` |
| `EX-06` | **Năng lực không đủ / chen đơn gấp** | tự động D5 | Planner | MD + Director | ❌ chưa có D5 |
| `EX-07` | **Nhà thầu chậm tiến độ** | báo cáo ngày D11 | Subcon Coordinator | MD | ⚠️ một phần |
| `EX-08` | **Trễ tàu / lỡ booking** | sự kiện D10 | Logistics | MD + khách | ❌ thiếu trường |
| `EX-09` | **Khách khấu trừ** | sự kiện D12 | Accountant | CFO + Commercial | ❌ `OQ-017` |
| `EX-10` | **Khách quá hạn thanh toán** | tự động D12 | Accountant | Commercial + CEO | ❌ chưa có D12 |
| `EX-11` | **Biên LN thực dưới ngưỡng** | tự động | Cost Controller | MD Manager + CFO | ❌ chưa có |
| `EX-12` | **Đơn treo quá lâu ở một trạng thái** | tự động | Merchandiser | MD Manager | ❌ chưa có |

**Khuôn xử lý chung — mọi ngoại lệ phải có đủ 6 mục:**
`phát hiện` → `chủ sở hữu` → `hạn xử lý` → `hành động` → `leo thang` → `đóng kèm lý do`.

> ⚠️ **Ngoại lệ không có chủ sở hữu và hạn xử lý là một dòng thông báo, không phải
> một cơ chế quản trị.** Đây là chỗ phần lớn dashboard ERP thất bại.

---

# 17. KPI — có công thức, có mã số

> 🔴 Mỗi KPI dưới đây là một `MetricDefinition` trong S7. **Không màn hình nào tự
> tính lại.** Đây là cách `BR-RPT-001` được cưỡng chế.

| Mã | KPI | Công thức | Ngưỡng |
|---|---|---|---|
| `M-MD-01` | **On-Time Delivery** | `số shipment đi đúng/trước confirmed_delivery ÷ tổng shipment` | ❓ Board |
| `M-MD-02` | **T&A Milestone Compliance** | `mốc DONE đúng hạn ÷ tổng mốc tới hạn` | ❓ |
| `M-MD-03` | **Order Book Value** | `Σ (OrderLine.qty × unit_price)` đơn chưa `CLOSED`, quy về một tiền tệ | — |
| `M-MD-04` | **Planned Margin** | `(quoted − total_cost) ÷ quoted` | ❓ `OQ-002` |
| `M-MD-05` | **Realized Margin** | `(doanh thu thực thu − CostActual) ÷ doanh thu thực thu` | ❓ |
| `M-MD-06` | 🔴 **Margin Erosion** | `M-MD-04 − M-MD-05` | **Con số quan trọng nhất của MD.** Nó đo *lời hứa ⟷ thực tế* |
| `M-MD-07` | **Sample First-Pass Rate** | `mẫu duyệt lần đầu ÷ tổng mẫu gửi` | ❓ |
| `M-MD-08` | **Quotation Win Rate** | `inquiry WON ÷ (WON + LOST)` | ❓ |
| `M-MD-09` | **Order Change Rate** | `đơn có ≥1 OrderChange sau CONFIRMED ÷ tổng đơn` | ❓ |
| `M-MD-10` | **Material Readiness at Gate 3** | `dòng NPL sẵn sàng ÷ tổng dòng`, đo tại thời điểm vào cổng 3 | ❓ |
| `M-MD-11` | **Order Cycle Time** | `ngày từ Order.created tới CLOSED` | ❓ |
| `M-MD-12` | **Exception Ageing** | tuổi trung bình ngoại lệ chưa đóng | ❓ |
| `M-MD-13` | **Deduction Rate** | `Σ Deduction ÷ Σ Invoice` | ❓ `OQ-017` |
| `M-MD-14` | **Customer Profitability** | `Σ realized margin` theo khách, 12 tháng trượt | — |

⚠️ **Ngưỡng của 12/14 KPI đang trống.** Đây chính là `OQ-005` *("con số nào mà hai
phòng báo lệch là không chấp nhận được")* nhìn từ phía MD.

---

# 18. CHỖ TÔI CÓ THỂ SAI

| # | Giả định | Nếu sai |
|---|---|---|
| `MD-U1` | `CLOSED` sau `INVOICED` | Nếu Board nói đóng khi **thu đủ tiền** ⇒ thêm `SETTLED`. `OQ-035` |
| `MD-U2` | Đơn hỗn hợp NPL **có tồn tại** ở Monica | Nếu không bao giờ có, `OrderMaterialPlan` là kỹ thuật thừa — một cột `order_type` là đủ. `OQ-016` |
| `MD-U3` | Mẫu → chiết tính là ràng buộc **mềm**, vượt được có lý do | Nếu là ràng buộc **cứng**, cổng 1 phải chặn tuyệt đối. `OQ-011` |
| `MD-U4` | Một `Order` ↔ nhiều `Shipment` | `OQ-012` — **rất khó sửa về sau** |
| `MD-U5` | Khách **có** duyệt mẫu trong hệ thống | Nếu duyệt qua email, Portal thu hẹp còn chỉ-đọc |
| `MD-U6` | `Contract` là thực thể thật, không phải cách nói | `OQ-009` |
| `MD-U7` | MD **không** sở hữu `Customer` *(giao D1)* | Trái BKB §B.5. **`BC2-Q3`** |
| `MD-U8` | Đường găng đáng tính | Nếu T&A thực tế chỉ là checklist tuần tự, `depends_on[]` là phức tạp thừa |

---

## THAM CHIẾU

[TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md) · [BKB](../../business/BUSINESS_KNOWLEDGE_BASE.md) C.3 C.4 C.5 C.8 C.13 D ·
Hiến pháp Điều 8 · 19 · 20 · 21 · 39 · 40 · [ADR-003](../../adr/ADR-003-request-id.md) · [ADR-004](../../adr/ADR-004-concurrency-control.md) ·
[MD_PRODUCT_AUDIT](../../audit/MD_PRODUCT_AUDIT.md) · [BC#1](../../business/BUSINESS_CONFIRMATION_1.md) · [BC#2](../../business/BUSINESS_CONFIRMATION_2.md)
