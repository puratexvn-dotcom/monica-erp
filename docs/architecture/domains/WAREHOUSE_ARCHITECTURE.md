# D9 · WAREHOUSE — KIẾN TRÚC ĐẦY ĐỦ
## Kho nguyên phụ liệu · kho thành phẩm · truy vết không đứt

| Trường | Giá trị |
|---|---|
| **Domain** | D9 · Warehouse · SUPPORTING |
| **Hiến pháp** | Điều 24 |
| **Ngày** | 2026-08-04 |
| **Trạng thái** | ⏳ ĐỀ XUẤT |
| **Cha** | [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md) |
| **Hiện trạng** | ✅ 15 bảng đã có — **phần trưởng thành thứ hai sau MD** |

---

# 1. MISSION & NGUYÊN TẮC

> **Kho trả lời bốn câu, luôn luôn, không bao giờ được sai:**
> *Hàng gì · Ở đâu · Bao nhiêu · **CỦA AI***

Câu thứ tư là câu mà kho của một nhà máy gia công khác kho của một nhà máy thường:
**vật tư trong kho Monica có ba loại chủ sở hữu khác nhau**, và trộn chúng lại là
sai phạm pháp lý, không chỉ là sai số liệu.

| # | Nguyên tắc hiến định | Hệ quả kiến trúc |
|---|---|---|
| **W1** | **Custody Principle** *(§24.4)* — kho **giữ hộ**, không **sở hữu** | Mọi tồn kho phải mang `ownership` và `owner_party_id` |
| **W2** | **Inventory Integrity** *(§24.5)* — sổ là chân lý | `StockLedgerEntry` **chỉ-ghi-thêm**; số dư là **dẫn xuất** |
| **W3** | **Evidence First** *(Điều 8)* | Nhận · điều chỉnh · huỷ đều bắt buộc có bằng chứng |
| **W4** | **Không lưu dữ liệu tính được** *(`CLAUDE.md` §2.5)* | ⚠️ Xung đột thực dụng — xem §4.2 |

---

# 2. BA LOẠI SỞ HỮU VẬT TƯ — nền của toàn bộ Domain

| Sở hữu | Nghĩa | Ràng buộc pháp lý | Hệ quả |
|---|---|---|---|
| `MONICA_OWNED` | Monica mua bằng tiền mình *(đơn FOB/OEM)* | — | Vào giá vốn · định giá tồn |
| `CUSTOMER_SUPPLIED` | Khách gửi tới *(đơn CMT)* | 🔴 **Không phải tài sản Monica** | ⛔ **Không được định giá vào tồn kho Monica** · phải báo cáo lại cho khách · thừa/thiếu phải đối soát |
| `BONDED_IMPORT` | Nhập khẩu theo loại hình gia công *(E31/E21)* | 🔴 **Chịu giám sát hải quan** | ⛔ **Không được dùng cho đơn khác** · phải đối soát nhập ⟷ xuất · thanh khoản tờ khai |

> ### 🔴 Đây là khoảng trống lớn nhất của kho hiện tại
>
> `[VERIFIED]` Quét lược đồ: **không bảng nào có cột `ownership`.** 15 bảng kho mô
> hình hoá *hàng gì, ở đâu, bao nhiêu* — **không mô hình hoá *của ai***.
>
> Với một nhà máy CMT, đây không phải thiếu sót nhỏ. Nó nghĩa là:
> - Vải của khách A **có thể** bị cấp cho đơn của khách B mà hệ thống không chặn.
> - NPL nhập gia công **không đối soát được** với hàng xuất ⇒ không thanh khoản
>   được tờ khai hải quan.
> - Tồn kho định giá **sai** vì gộp cả hàng không phải tài sản Monica.
>
> ⚠️ `BC2-Q8` — cần Board xác nhận Monica có nhập khẩu trực tiếp không.

---

# 3. MÔ HÌNH VỊ TRÍ

```
Warehouse            kho vật lý · warehouse_type: RM | FG | WIP | QUARANTINE | BONDED
  └─ Zone            khu · zone_type: RECEIVING | STORAGE | PICKING | STAGING | QC_HOLD
      └─ Rack        kệ
          └─ Bin     ô chứa — ĐƠN VỊ TỒN KHO NHỎ NHẤT
               capacity · bin_type · is_mixed_allowed · temperature_class
```

✅ **Đã có đủ 4 cấp** — `warehouses` · `wh_zones` · `wh_racks` · `wh_bins`.

**Bốn luật vị trí:**

| # | Luật | Vì sao |
|---|---|---|
| L1 | **Tồn kho luôn ở một `Bin` cụ thể**, không bao giờ "ở kho" chung chung | Không có vị trí thì không kiểm kê được, không soạn hàng được |
| L2 | 🔴 **`QUARANTINE` là kho riêng, không phải một cờ** | Hàng chờ QC **không được** nằm trong tồn khả dụng. Một cột `is_quarantine` sẽ bị quên trong mọi truy vấn tồn |
| L3 | 🔴 **`BONDED` là kho riêng** | Hải quan yêu cầu tách vật lý và tách sổ |
| L4 | **`Bin` cho phép trộn hay không là thuộc tính của Bin** | Vải cùng dải màu mới được chung ô |

---

# 4. SỔ TỒN KHO — trái tim của Domain

## 4.1 `StockLedgerEntry` — chỉ ghi thêm, không bao giờ sửa

```
StockLedgerEntry (append-only, KHÔNG UPDATE, KHÔNG DELETE)
├─ entry_no · posted_at (TIMESTAMPTZ) · posted_by
├─ movement_type   RECEIPT | PUTAWAY | ISSUE | RETURN | TRANSFER_OUT | TRANSFER_IN
│                  | ADJUSTMENT | SCRAP | COUNT_GAIN | COUNT_LOSS
│                  | SUBCON_ISSUE | SUBCON_RETURN | CUSTOMER_RETURN
├─ material_id → S3 · lot_id? · roll_id?
├─ bin_id · qty (±) · uom
├─ 🔴 ownership · owner_party_id      ← CỘT ĐANG THIẾU
├─ reserved_for_order_id?             ← giữ chỗ theo đơn
├─ bonded_declaration_id?             ← nếu là hàng gia công
├─ source_document_type · source_document_id
├─ unit_cost? · currency?             ← chỉ với MONICA_OWNED
└─ evidence_id? → S4
```

**Ba luật cưỡng chế ở CSDL, không ở ứng dụng:**

| # | Luật | Cưỡng chế |
|---|---|---|
| K1 | 🔴 **Không `UPDATE`, không `DELETE`** — kể cả `service_role` | Trigger `BEFORE UPDATE/DELETE → RAISE EXCEPTION`. Kiểm bằng **`pg_trigger`, không bằng ghi thử** *(quy tắc K-1)* |
| K2 | **Sai sót sửa bằng bút toán ngược**, không bằng xoá | `ADJUSTMENT` có `reverses_entry_id` |
| K3 | **Mọi bút toán truy về được chứng từ gốc** | `source_document_*` NOT NULL |

## 4.2 `StockBalance` — số dư, và một đánh đổi phải nói rõ

`CLAUDE.md` §2.5 cấm lưu dữ liệu tính được. Số dư tồn kho **tính được** từ sổ.
Nhưng tính lại `Σ` trên hàng triệu dòng cho mỗi lần soạn hàng là không chạy nổi.

> ### ⚖️ Quyết định thiết kế — có đánh đổi, ghi rõ
>
> **Giữ `StockBalance` như một MATERIALIZED PROJECTION, không phải nguồn chân lý.**
>
> | Ràng buộc | Nội dung |
> |---|---|
> | 1 | `StockLedgerEntry` là **nguồn chân lý duy nhất** |
> | 2 | `StockBalance` chỉ cập nhật bằng **trigger từ sổ**, không bao giờ ghi tay |
> | 3 | Có `last_ledger_entry_id` để biết đã chiếu tới đâu |
> | 4 | 🔴 **Bài kiểm hồi quy đối soát `Σ ledger = balance` chạy MỖI VÒNG** |
>
> **Vì sao chấp nhận:** đây không phải "lưu dữ liệu tính được" theo nghĩa xấu —
> nó là **read-model có cơ chế đối soát**. Cái §2.5 cấm là *lưu rồi quên đối soát*.
>
> `[Chỗ tôi có thể sai]` Nếu Board coi đây là vi phạm §2.5 thì phải dùng
> `MATERIALIZED VIEW` refresh theo lịch — chậm hơn nhưng không có bảng ghi song song.

```
StockBalance (projection)
├─ material_id · bin_id · lot_id? · roll_id?
├─ ownership · owner_party_id
├─ qty_on_hand · qty_reserved
├─ qty_available  (DẪN XUẤT: on_hand − reserved — không lưu)
└─ last_ledger_entry_id · last_updated_at
```

---

# 5. VẢI · CUỘN · LÔ — chỗ kho may khác mọi kho khác

## 5.1 `FabricRoll` — cuộn là đơn vị truy vết

```
FabricRoll (aggregate root)
├─ roll_no  (mã cuộn của NCC) · internal_roll_no
├─ material_id → S3 · lot_id
├─ 🔴 supplier_length ⟷ actual_length     ← DÀI HOÁ ĐƠN ⟷ DÀI ĐO THỰC
├─ width_actual · width_usable            ← khổ thực · khổ dùng được
├─ 🔴 shade_code · shade_group            ← DẢI MÀU
├─ gsm · shrinkage_warp · shrinkage_weft  ← độ co
├─ inspection_result → D7 (4-point) · defect_points · grade
├─ status: RECEIVED | INSPECTING | AVAILABLE | RESERVED | ISSUED | PARTIAL | CONSUMED | REJECTED
├─ remaining_length  (DẪN XUẤT từ sổ)
├─ ownership · owner_party_id · bonded_declaration_id?
└─ bin_id
```

**Bốn luật của vải — không hệ ERP tổng quát nào có:**

| # | Luật | Vì sao **bắt buộc** |
|---|---|---|
| `F1` | 🔴 **Không trộn dải màu trong một mã hàng.** Một style/màu chỉ dùng cuộn cùng `shade_group` | Hai cuộn lệch dải màu may vào cùng một áo ⇒ **cả lô bị khách trả về**. Đây là lỗi tốn kém nhất của ngành may và **không hệ ERP tổng quát nào chặn** |
| `F2` | 🔴 **`supplier_length` ≠ `actual_length` là bình thường** — hệ thống phải giữ **cả hai** | Chênh lệch là cơ sở khiếu nại NCC. Chỉ lưu một con số là mất tiền |
| `F3` | **Cấp phát vải theo cuộn, không theo mét** | Kho giao cuộn; phần dư quay lại sổ với `PARTIAL` |
| `F4` | **FIFO theo lô + ràng buộc dải màu** — không phải FIFO thuần | FIFO thuần sẽ chọn cuộn cũ nhất bất kể dải màu ⇒ vi phạm `F1` |

## 5.2 `MaterialLot`

```
MaterialLot
├─ lot_no · material_id · supplier_id → D8
├─ received_date · expiry_date?          ← keo · mực in có hạn
├─ po_reference → D8 · invoice_reference
├─ ownership · owner_party_id
├─ inspection_status → D7
└─ shade_group?                          ← lô nhuộm
```

## 5.3 Phụ liệu

Nút · chỉ · nhãn · khoá kéo: quản theo **lô + số lượng**, không theo cuộn.
⚠️ **Nhưng nhãn và khoá kéo có `colour_matching` với vải** — phải kiểm tra khi cấp phát.

---

# 6. QUY TRÌNH KHO

## 6.1 INBOUND — nhận hàng

```
① Thông báo hàng về  (từ PO của D8, hoặc từ khách với đơn CMT)
        ▼
② TIẾP NHẬN  InboundReceipt
     ├─ đối chiếu PO / packing list của khách
     ├─ đếm kiện · cân · chụp ảnh bằng chứng
     ├─ 🔴 GHI OWNERSHIP ngay tại bước này
     └─ → kho QUARANTINE (không vào tồn khả dụng)
        ▼
③ KIỂM HÀNG  → D7
     ├─ vải: 4-point + đo khổ + đo dài thực + phân dải màu
     ├─ phụ liệu: kiểm mẫu theo AQL
     └─ kết quả: PASS | PASS_WITH_DEVIATION | REJECT
        ▼
④ 🔴 ĐỐI CHIẾU ĐỊNH MỨC   ← ❓ OQ-028 — ĐANG THIẾU HOÀN TOÀN
     ├─ so số nhận ⟷ định mức BOM × số lượng đơn
     ├─ THIẾU  → cảnh báo MD + khách ngay
     └─ THỪA   → ghi nhận, hỏi khách xử lý
        ▼
⑤ CẤT VÀO VỊ TRÍ  Putaway
     ├─ gợi ý bin theo loại · dải màu · sở hữu
     └─ ledger: RECEIPT + PUTAWAY
        ▼
⑥ SẴN SÀNG  → tồn khả dụng
```

🔴 **Bước ④ đang không tồn tại và nó là khâu đầu vào của mọi đơn CMT.**
Không có nó, nhà máy chỉ biết thiếu vải **khi đang cắt** — muộn hơn 2–3 tuần so
với lúc lẽ ra biết được.

## 6.2 RESERVATION — giữ chỗ

```
Reservation
├─ order_id → D2 · production_order_id? → D5 · assignment_id? → D11
├─ material_id · lot_id? · roll_id? · qty
├─ reserved_at · expires_at · priority
└─ status: ACTIVE | PARTIALLY_CONSUMED | CONSUMED | RELEASED | EXPIRED
```

**Ba luật:**

| # | Luật |
|---|---|
| `R1` | 🔴 **`CUSTOMER_SUPPLIED` chỉ giữ chỗ được cho đơn của CHÍNH khách đó.** Cưỡng chế ở CSDL, không ở giao diện |
| `R2` | 🔴 **`BONDED_IMPORT` chỉ dùng cho tờ khai tương ứng** |
| `R3` | Giữ chỗ có **hạn** — hết hạn tự nhả để hàng không nằm chết |

## 6.3 OUTBOUND — cấp phát

```
① Yêu cầu cấp phát   (từ CutTicket của D6, hoặc SubconIssue của D11)
        ▼
② SINH PHIẾU SOẠN  PickList
     ├─ chọn cuộn/lô theo FIFO + RÀNG BUỘC DẢI MÀU
     ├─ kiểm sở hữu khớp đơn        ← R1 · R2
     └─ gợi ý đường đi trong kho
        ▼
③ SOẠN HÀNG  Picking — quét mã · xác nhận cuộn thực
        ▼
④ XUẤT KHO  IssueNote
     ├─ ledger: ISSUE (−)
     ├─ giải phóng Reservation
     └─ nếu tới nhà thầu → SUBCON_ISSUE, chuyển quyền giữ hộ
        ▼
⑤ TRẢ VỀ  ReturnNote  (vải dư · phụ liệu dư · hàng lỗi)
     └─ ledger: RETURN (+) — 🔴 phần dư quay lại sổ, KHÔNG biến mất
```

🔴 **Bước ⑤ là chỗ hao hụt bị giấu.** Nếu phần dư không quay lại sổ, hệ thống sẽ
báo đã tiêu thụ 100% định mức trong khi thực tế còn hàng ⇒ **hao hụt thật không
bao giờ đo được**, và đó là con số quyết định giá vốn.

## 6.4 TRANSFER · ADJUSTMENT · SCRAP

| Thao tác | Ai làm | Ai duyệt | Bằng chứng |
|---|---|---|---|
| `Transfer` giữa bin/kho | Storekeeper | — | — |
| `Transfer` giữa nhà máy | Storekeeper | WH Manager | phiếu vận chuyển |
| 🔴 `Adjustment` | Storekeeper đề xuất | **WH Manager duyệt** | 🔴 **bắt buộc lý do + ảnh** |
| `Scrap` | Storekeeper đề xuất | **WH Manager + Cost Controller** | 🔴 bắt buộc ảnh |

> 🔴 **`Adjustment` là thao tác dễ bị lạm dụng nhất trong kho.**
> `lib/rbac.ts:211` đã đúng — `thukho` **không** có quyền `adjust`. Giữ nguyên,
> và **thêm luồng duyệt**.

## 6.5 STOCK TAKE

| Loại | Tần suất | Phạm vi |
|---|---|---|
| **Cycle Count** | hàng tuần | luân phiên theo bin — không dừng kho |
| **Full Stock Take** | quý / năm | 🔴 **đóng băng giao dịch** trong lúc đếm |
| **Spot Check** | đột xuất | khi nghi ngờ |

```
StockCount → StockCountItem (system_qty · counted_qty · variance)
  → phê duyệt chênh lệch → ledger COUNT_GAIN / COUNT_LOSS
```

⚠️ **`system_qty` phải chụp lại tại thời điểm bắt đầu đếm**, không đọc lúc duyệt —
nếu không, mọi giao dịch xảy ra trong lúc đếm sẽ làm sai chênh lệch.

## 6.6 🔴 BONDED RECONCILIATION — nghiệp vụ không hệ nào có

```
BondedDeclaration  (tờ khai nhập gia công)
├─ declaration_no · declaration_type: E31 | E21 | khác
├─ import_date · deadline_date
├─ contract_ref (hợp đồng gia công với khách)
├─ ImportLine   material · qty nhập
├─ ExportLine   shipment → D10 · qty quy đổi theo định mức
└─ Reconciliation  (DẪN XUẤT)
     đã dùng · còn lại · chênh lệch · quá hạn thanh khoản?
```

**Ba luật:**

| # | Luật |
|---|---|
| `B1` | Vật tư nhập theo tờ khai **chỉ dùng cho hợp đồng gia công tương ứng** |
| `B2` | Xuất khẩu phải **quy đổi ngược** theo định mức để trừ vào tờ khai |
| `B3` | 🔴 **Cảnh báo trước hạn thanh khoản** — quá hạn là phạt và truy thu thuế |

⚠️ `BC2-Q8` — nếu Monica **không** nhập khẩu trực tiếp, bỏ toàn bộ mục này.

---

# 7. KHO THÀNH PHẨM

```
FGStock
├─ order_id → D2 · style_id · colorway · size
├─ qty · carton_id?
├─ status: PACKED | QC_PASSED | READY_TO_SHIP | STAGED | SHIPPED
└─ bin_id

Carton  (→ D10)
├─ carton_no · shipping_mark · gross/net weight · dimensions
├─ CartonContent  (style · màu · size · số lượng)
└─ pack_method: SOLID | RATIO | ASSORT
```

⚠️ **Thành phẩm KHÔNG dùng chung mô hình `StockBalance` với NPL.** Đơn vị khác
*(chiếc/thùng)*, vòng quay khác *(vài ngày)*, người dùng khác. **Cùng Workspace,
khác aggregate.**

---

# 8. TRUY VẾT — chuỗi không được đứt

```
Supplier/Customer → BondedDeclaration? → InboundReceipt → MaterialLot → FabricRoll
     → Bin → PickList → IssueNote → CutTicket (D6) → Bundle → SewingLine
     → FinishedGarment → Carton → PackingList → Shipment (D10) → Customer
```

**Hai câu phải trả lời được trong dưới 5 giây:**

| Chiều | Câu hỏi | Dùng khi |
|---|---|---|
| **Xuôi** | *Cuộn vải X đã đi vào những thùng hàng nào?* | Phát hiện vải lỗi ⇒ **thu hồi đúng phạm vi**, không thu hồi cả lô hàng |
| **Ngược** | *Thùng hàng Y làm từ cuộn nào, ai cắt, chuyền nào may, ai kiểm?* | Khách khiếu nại ⇒ **tìm nguyên nhân gốc** |

🔴 **Chuỗi đứt ở một mắt xích là mất toàn bộ giá trị.** Hôm nay mắt xích
`Bundle → Garment → Carton` là chỗ yếu nhất — không có ràng buộc nào bắt buộc nối.

---

# 9. MATERIAL REQUIREMENT & STOCK ALERT

```
MaterialRequirement  (thuộc D5, kho cung cấp dữ liệu)
  Cần    = Σ (BOM.qty_per_unit × order_qty × (1 + wastage%))
  Có     = qty_available theo ownership khớp đơn
  Đang về = PO đã đặt chưa nhận (D8) + hàng khách đang gửi
  🔴 Thiếu = Cần − Có − Đang về    ← con số quan trọng nhất của kho
```

| Cảnh báo | Kích hoạt | Gửi ai |
|---|---|---|
| **Thiếu NPL chặn lên chuyền** | `Thiếu > 0` và còn ≤ N ngày tới cổng 3 *(D2)* | MD · Planning · Procurement |
| **Hàng về trễ** | `expected_arrival` quá hạn | Procurement · MD |
| **Tồn chết** | không chuyển động > N ngày | WH Manager · Cost Controller |
| **Sắp hết hạn** | `expiry_date` − N ngày | WH Manager |
| **Bonded sắp quá hạn thanh khoản** | `deadline_date` − N ngày | WH Manager · Finance |
| **Chênh lệch kiểm kê vượt ngưỡng** | `\|variance\| > x%` | WH Manager · Cost Controller |

---

# 10. DASHBOARD

```
┌─ NGOẠI LỆ  (trên cùng)
│   🔴 Đơn bị chặn vì thiếu NPL     🔴 Bonded sắp quá hạn
│   🔴 Chênh lệch kiểm kê chờ duyệt 🟠 Hàng nằm QC quá lâu
│   🟠 Tồn chết                     🟠 Điều chỉnh chờ duyệt
├─ KPI:  Độ chính xác tồn kho · Vòng quay · % lấp đầy vị trí
│        Đúng hạn nhận · Tỷ lệ hao hụt · Tuổi hàng QC
├─ SẴN SÀNG NPL THEO ĐƠN  (bảng: đơn × % sẵn sàng × dòng đang chặn)
├─ CHUYỂN ĐỘNG HÔM NAY    (nhận · xuất · chuyển · điều chỉnh)
├─ TỒN THEO SỞ HỮU        (Monica · khách · bonded — TÁCH BẠCH)
└─ Biểu đồ (cuối)
```

---

# 11. BUSINESS RULES

| Mã | Quy tắc | Cưỡng chế |
|---|---|---|
| `WH-R01` | 🔴 Mọi tồn kho mang `ownership` + `owner_party_id` | CSDL NOT NULL |
| `WH-R02` | 🔴 `CUSTOMER_SUPPLIED` chỉ dùng cho đơn của chính khách đó | RLS + service + bài kiểm |
| `WH-R03` | 🔴 `BONDED_IMPORT` chỉ dùng cho tờ khai tương ứng | service + bài kiểm |
| `WH-R04` | 🔴 `StockLedgerEntry` **không `UPDATE`, không `DELETE`** | trigger · kiểm bằng `pg_trigger` *(K-1)* |
| `WH-R05` | Sai sót sửa bằng bút toán ngược | service |
| `WH-R06` | 🔴 Không trộn dải màu trong một mã hàng | service cấp phát |
| `WH-R07` | Giữ cả `supplier_length` và `actual_length` | CSDL |
| `WH-R08` | FIFO theo lô **+ ràng buộc dải màu** | service |
| `WH-R09` | Hàng chưa kiểm nằm `QUARANTINE`, không vào tồn khả dụng | mô hình kho |
| `WH-R10` | 🔴 Điều chỉnh tồn **bắt buộc duyệt + lý do + ảnh** | luồng S5 |
| `WH-R11` | 🔴 Vải/phụ liệu dư **phải trả về sổ** | service |
| `WH-R12` | `system_qty` chụp tại lúc **bắt đầu** đếm | service |
| `WH-R13` | Kiểm kê toàn bộ **đóng băng giao dịch** | service |
| `WH-R14` | 🔴 Nhận NPL khách **bắt buộc đối chiếu định mức** | ❓ `OQ-028` |
| `WH-R15` | Chuỗi truy vết cuộn→thùng **không được đứt** | ràng buộc + bài kiểm |
| `WH-R16` | `Σ ledger = StockBalance` — đối soát **mỗi vòng kiểm** | bài kiểm hồi quy |
| `WH-R17` | Xuất cho nhà thầu **chuyển quyền giữ hộ**, không chuyển sở hữu | mô hình |
| `WH-R18` | Xoá mềm; `UNIQUE` là chỉ mục một phần | CSDL |

---

# 12. EXCEPTION HANDLING

| Mã | Ngoại lệ | Chủ | Hành động bắt buộc |
|---|---|---|---|
| `WEX-01` | **Nhận thiếu so với packing list** | Storekeeper | Ghi nhận · ảnh · báo NCC/khách trong 24h |
| `WEX-02` | **Nhận thừa** | Storekeeper | Ghi nhận · hỏi khách — ⛔ **không tự nhập vào tồn** |
| `WEX-03` | 🔴 **Vải trượt kiểm 4-point** | WH + QA | Cách ly · báo MD · quyết dùng/trả/giảm giá |
| `WEX-04` | 🔴 **Lệch dải màu phát hiện khi cấp phát** | Storekeeper | ⛔ **DỪNG cấp phát** · báo MD + QA |
| `WEX-05` | **Thiếu NPL chặn lên chuyền** | Procurement | Cảnh báo D2 · D5 ngay |
| `WEX-06` | **Chênh lệch kiểm kê vượt ngưỡng** | WH Manager | Điều tra trước khi duyệt |
| `WEX-07` | **Nhà thầu báo hao hụt vượt định mức** | Subcon Coordinator | Đối soát · quyết ai chịu |
| `WEX-08` | 🔴 **Bonded quá hạn thanh khoản** | WH Manager + Finance | Leo thang ngay — rủi ro pháp lý |
| `WEX-09` | **Hàng nằm QC quá lâu** | QA Manager | Leo thang |
| `WEX-10` | **Tồn chết** | Cost Controller | Đề xuất xử lý |

---

# 13. PERMISSIONS

| Hành động | Storekeeper | WH Manager | Material Controller | QA | MD | Subcon |
|---|---|---|---|---|---|---|
| Xem tồn | ✅ | ✅ | ✅ | ⚠️ lô kiểm | ⚠️ đơn của mình | ⛔ |
| Nhận hàng | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kiểm hàng | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Cất vị trí | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Giữ chỗ | ✅ | ✅ | ❌ | ❌ | ✅ đề nghị | ❌ |
| Soạn · xuất | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Chuyển kho | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 🔴 **Điều chỉnh tồn** | ❌ đề xuất | ✅ **duyệt** | ❌ | ❌ | ❌ | ❌ |
| 🔴 **Huỷ / phế liệu** | ❌ đề xuất | ✅ | ✅ đồng duyệt | ❌ | ❌ | ❌ |
| Kiểm kê | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Duyệt chênh lệch | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Định giá tồn | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Xác nhận đã nhận NPL | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **phần của mình** |

✅ `lib/rbac.ts` `WH_PERMISSIONS` đã mô hình đúng phần lớn — **giữ nguyên, thêm
luồng duyệt cho `adjust` và `scrap`**.

---

# 14. KPI

| Mã | KPI | Công thức |
|---|---|---|
| `M-WH-01` | 🔴 **Độ chính xác tồn kho** | `bin đếm khớp ÷ tổng bin đếm` |
| `M-WH-02` | **Vòng quay tồn kho** | `giá trị xuất kỳ ÷ tồn bình quân` |
| `M-WH-03` | **Sẵn sàng NPL tại cổng 3** | `dòng đủ ÷ tổng dòng` |
| `M-WH-04` | 🔴 **Tỷ lệ hao hụt thật** | `(xuất − trả về) ÷ định mức lý thuyết` |
| `M-WH-05` | **Đúng hạn nhận hàng** | `lô về đúng hạn ÷ tổng lô` |
| `M-WH-06` | **Tuổi hàng chờ QC** | trung bình ngày nằm `QUARANTINE` |
| `M-WH-07` | **Tồn chết** | giá trị hàng không chuyển động > N ngày |
| `M-WH-08` | **Truy vết đầy đủ** | `% thùng truy ngược được về cuộn` |
| `M-WH-09` | **Đối soát bonded** | `% tờ khai thanh khoản đúng hạn` |
| `M-WH-10` | **Lấp đầy vị trí** | `bin có hàng ÷ tổng bin` |

---

# 15. CHỖ TÔI CÓ THỂ SAI

| # | Giả định | Nếu sai |
|---|---|---|
| `WH-U1` | Monica **có** nhập khẩu trực tiếp theo loại hình gia công | Bỏ toàn bộ §6.6 Bonded. `BC2-Q8` |
| `WH-U2` | Kiểm vải 4-point là chuẩn Monica đang dùng | Có xưởng dùng 10-point. `BC2-Q9` |
| `WH-U3` | Dải màu được quản tới cấp cuộn | Nếu chỉ quản tới cấp lô nhuộm, `F1` đơn giản hơn nhiều |
| `WH-U4` | `StockBalance` dạng projection được chấp nhận | Nếu Board coi là vi phạm §2.5 ⇒ dùng `MATERIALIZED VIEW` |
| `WH-U5` | Kho NPL và kho FG dùng chung Workspace | Nếu hai đội tách biệt hoàn toàn ⇒ cân nhắc tách |
| `WH-U6` | Vải dư **có** trả về kho | Nếu thực tế để lại chuyền, `WH-R11` không thi hành được và hao hụt không đo được |
| `WH-U7` | Monica dùng mã vạch / QR ở kho | Nếu ghi tay hoàn toàn, toàn bộ luồng quét phải thiết kế lại |

---

## THAM CHIẾU

[TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md) · Hiến pháp Điều 8 · 24 · 39 ·
[BKB](../../business/BUSINESS_KNOWLEDGE_BASE.md) C.5 `OQ-028` `OQ-029` ·
`lib/rbac.ts` `WH_PERMISSIONS` · [tests/README.md](../../../tests/README.md) K-1 K-2 · [BC#2](../../business/BUSINESS_CONFIRMATION_2.md)
