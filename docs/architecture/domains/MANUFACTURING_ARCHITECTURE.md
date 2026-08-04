# D4 + D5 + D6 · MANUFACTURING — KIẾN TRÚC ĐẦY ĐỦ
## Industrial Engineering · Planning · Production

| Trường | Giá trị |
|---|---|
| **Domain** | D4 Industrial Engineering · D5 Planning · D6 Production |
| **Hiến pháp** | Điều 21 · Điều 22 |
| **Ngày** | 2026-08-04 |
| **Trạng thái** | ⏳ ĐỀ XUẤT |
| **Cha** | [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md) |

---

# 0. VÌ SAO BA DOMAIN NÀY ĐI CHUNG MỘT TÀI LIỆU

Chúng nối với nhau qua **một con số duy nhất: SMV**.

```
D4 IE     đo SMV        ──▶  SMV là đơn vị tiền tệ của nhà máy
                              │
              ┌───────────────┼───────────────┬──────────────┐
              ▼               ▼               ▼              ▼
        D2 Costing      D5 Capacity     D6 Efficiency   D13 Lương SP
        (giá thành)     (nhận nổi?)     (đạt bao nhiêu) (trả bao nhiêu)
```

> 🔴 **Nếu bốn nơi này dùng bốn con số SMV khác nhau, doanh nghiệp lỗ mà không
> biết lỗ ở đâu.** Đây là `CF-8` ở dạng nghiêm trọng nhất, và là lý do D4 phải là
> một Domain có chủ sở hữu, không phải một cột trong bảng nào đó.

---

# PHẦN A · D4 — INDUSTRIAL ENGINEERING

## A.1 Mission

> **IE biến một sản phẩm thành một con số: bao nhiêu phút để may ra nó.**
> Con số đó là nền của giá, của lịch, của lương và của mọi lời hứa với khách.

## A.2 Business Objects & Aggregates

```
Operation (root) — thư viện công đoạn dùng chung mọi style
├─ operation_code · name_vi/en/zh
├─ machine_type: SNLS | DNLS | OVERLOCK | FLATLOCK | BARTACK | BUTTONHOLE | MANUAL | PRESS …
├─ skill_level: 1..5
└─ section: CUTTING | SEWING | FINISHING | PACKING

SMVStudy (root) — MỘT phép đo, có bằng chứng
├─ style_id → D3 · operation_id · study_date · engineer_id
├─ TimeObservation 1..n   (cycle_time × n lần bấm giờ)
├─ rating_factor          (đánh giá nhịp độ công nhân, %)
├─ allowance_pf_d         (nghỉ ngơi · sinh lý · trì hoãn, %)
├─ 🔴 smv  (DẪN XUẤT — KHÔNG LƯU)
│     = trung bình(cycle) × rating_factor × (1 + allowance)
├─ status: DRAFT → APPROVED → SUPERSEDED
└─ evidence_id? → S4   (video bấm giờ)

OperationBulletin (root) — bảng công đoạn của MỘT style
├─ style_id · version · status: DRAFT→APPROVED→SUPERSEDED
├─ OBLine 1..n
│    sequence · operation_id · smv_study_id · machine_type · skill_level
└─ 🔴 total_smv (DẪN XUẤT = Σ OBLine.smv)

LineLayout (root) — bố trí một chuyền cho một style
├─ line_id → D6 · operation_bulletin_id · target_output_per_hour
├─ Workstation 1..n  (operator_count · operations[] · theoretical_output)
└─ LineBalanceResult (DẪN XUẤT)
     bottleneck_station · balance_efficiency · required_operators

LearningCurve (root)
├─ style_complexity_class
└─ EfficiencyRamp: day_1 = 45% … day_n = 85%
```

## A.3 Ba luật của D4

| # | Luật | Vì sao |
|---|---|---|
| `IE-R01` | 🔴 **`SMV` là con số DUY NHẤT.** D2 · D5 · D6 · D13 đều đọc từ `OperationBulletin` đã `APPROVED`, không nơi nào tự đặt | Bốn con số khác nhau = lỗ không biết lỗ ở đâu |
| `IE-R02` | 🔴 **`smv` và `total_smv` TÍNH, không LƯU** | `CLAUDE.md` §2.5 · đổi `allowance` thì mọi phép tính phải đổi theo |
| `IE-R03` | **Không sửa `SMVStudy` đã `APPROVED`** — đo lại thì lập bản mới, `SUPERSEDED` bản cũ | Giá đã báo cho khách dựa trên SMV nào phải truy được |

## A.4 🔴 Learning Curve — chỗ mọi ERP tổng quát tính sai

Một chuyền mới chạy style mới **không** đạt hiệu suất mục tiêu ngay.
Ngày 1 khoảng 45–55%, phải 5–10 ngày mới lên 80–85%.

```
Năng lực thật ngày n = số công nhân × phút làm việc × efficiency(n)
                                                       ▲
                                                learning curve
```

> Bỏ qua learning curve ⇒ **năng lực bị tính vống 20–35% ở tuần đầu mỗi mã hàng**.
> Với nhà máy chạy nhiều mã ngắn — đúng mô hình gia công — sai số này là **thường
> trực**, không phải ngoại lệ. Đây là lý do nhiều nhà máy *"lịch đẹp mà vẫn trễ"*.

## A.5 Features · KPI

**Features:** thư viện công đoạn · bấm giờ có video · duyệt SMV · bảng công đoạn theo style ·
cân bằng chuyền · tìm nút thắt · mô phỏng số công nhân · đường cong học tập theo nhóm độ khó ·
so sánh SMV kế hoạch ⟷ thời gian thực tế.

| KPI | Công thức |
|---|---|
| `M-IE-01` **Độ chính xác SMV** | `\|SMV thực − SMV chuẩn\| ÷ SMV chuẩn` |
| `M-IE-02` **Hiệu suất cân bằng chuyền** | `Σ SMV ÷ (số trạm × SMV trạm nút thắt)` |
| `M-IE-03` **Phủ SMV** | `% style có OperationBulletin APPROVED` |
| `M-IE-04` **Thời gian lên chuẩn** | số ngày từ ngày 1 tới khi đạt hiệu suất mục tiêu |

---

# PHẦN B · D5 — PLANNING

## B.1 Mission

> **Planning trả lời một câu, và cả doanh nghiệp phụ thuộc vào việc câu đó đúng:**
> ***"Ta có nhận nổi đơn này, giao đúng ngày này không?"***

## B.2 Mô hình năng lực — nền của mọi thứ

```
Capacity (root)
├─ factory_id · line_id · date
├─ available_minutes = số công nhân × giờ/ca × 60 × số ca
├─ efficiency_factor  ← learning curve (D4) + hiệu suất lịch sử chuyền (D6)
├─ 🔴 effective_minutes (DẪN XUẤT) = available_minutes × efficiency_factor
├─ committed_minutes   ← Σ block đã xếp
└─ free_minutes (DẪN XUẤT) = effective_minutes − committed_minutes
```

❓ **`OQ-021` chặn ở đây.** Đơn vị năng lực là **phút chuyền**, **số chuyền**, hay
**số công nhân**? Thiết kế trên giả định **phút chuyền (SAM-minute)** vì đó là đơn
vị duy nhất cộng được giữa các mã hàng khác nhau.

`[Chỗ tôi có thể sai]` Nếu Monica hoạch định theo **số chuyền × ngày** *(phổ biến
ở xưởng nhỏ)*, mô hình đơn giản hơn nhiều — nhưng **không so sánh được** hai mã
hàng có độ khó khác nhau.

## B.3 🔴 CTP — Capable To Promise: năng lực đang thiếu quan trọng nhất

```
CapacityCheck(style_id, qty, requested_delivery)
  ├─ ① lấy total_smv từ D4               → tổng phút cần
  ├─ ② trừ thời gian cắt · hoàn thành · đóng gói · đệm QC
  ├─ ③ lùi ngược từ requested_delivery   → cửa sổ thời gian khả dụng
  ├─ ④ tìm chuyền có free_minutes đủ trong cửa sổ đó
  ├─ ⑤ kiểm điều kiện đầu vào: NPL kịp về? (D9 · D8) · mẫu PP kịp duyệt? (D3)
  └─▶ CapacityCheckResult
        FEASIBLE            — chuyền X, ngày Y..Z
        FEASIBLE_WITH_OT    — cần tăng ca N giờ, chi phí thêm
        FEASIBLE_SUBCON     — cần thuê ngoài, nhà thầu gợi ý
        NOT_FEASIBLE        — sớm nhất có thể là ngày W
```

> 🔴 **Đây là câu trả lời cho việc "Monica ONE là ERP hay là sổ ghi chép".**
> Sổ ghi chép ghi lại việc đã hứa. ERP nói cho anh biết **có nên hứa không**.
> Hôm nay hệ thống **không có một dòng mã nào** làm việc này.

## B.4 Aggregates còn lại

```
ProductionPlan (root)      — kế hoạch tuần/tháng, có phiên bản, so sánh được
LineSchedule (root)        — ScheduleBlock (order · line · từ ngày → đến ngày · qty · smv)
                             Changeover (thời gian chuyển mã, phụ thuộc độ giống nhau)
ProductionOrder (root)     🔴 LỆNH SẢN XUẤT — KHÔNG phải PO nội bộ (giải CF-3)
├─ production_order_no · order_id → D2 · style · colorway · qty
├─ line_id · planned_start/end
├─ status: PENDING → RELEASED → IN_PROGRESS → COMPLETED | CANCELLED
└─ 🔴 ReleaseGate  — CỔNG THẢ CÓ ĐIỀU KIỆN
     pp_sample_approved (D3) · material_readiness ≥ ngưỡng (D9)
     operation_bulletin_approved (D4) · line_available
     override_by · override_reason        ← ❓ OQ-023 ai được vượt

MaterialRequirement (root) — MRP: cần − có − đang về = thiếu
```

## B.5 Business Rules

| Mã | Quy tắc | Trạng thái |
|---|---|---|
| `PL-R01` | 🔴 Năng lực tính bằng **phút hiệu dụng**, có learning curve | ❌ chưa có |
| `PL-R02` | 🔴 **Không xác nhận đơn khi CTP chưa trả lời** | ❌ chưa có |
| `PL-R03` | 🔴 `ProductionOrder` **không `RELEASED`** khi ReleaseGate chưa đạt, trừ khi có người vượt **kèm lý do** | ❌ `RELEASED` chỉ là nhãn |
| `PL-R04` | `Σ ScheduleBlock.smv ≤ effective_minutes` mỗi chuyền mỗi ngày | ❌ |
| `PL-R05` | Chèn đơn gấp **bắt buộc** hiện đơn nào bị đẩy lùi | ❌ ❓ `OQ-007` |
| `PL-R06` | Thời gian chuyển mã tính vào năng lực | ❌ |
| `PL-R07` | `ProductionOrder` **là lệnh sản xuất**, không mang ngữ nghĩa PO thương mại | ❓ `CF-3` |

## B.6 Exception · KPI

| Ngoại lệ | Chủ | Hành động |
|---|---|---|
| Quá tải chuyền | Planner | Tăng ca · chuyển chuyền · thuê ngoài |
| Đơn gấp chen vào | Planner | Chạy what-if, trình MD danh sách đơn bị đẩy |
| NPL không kịp cổng thả | Procurement | Lùi lịch · đổi thứ tự |
| Mẫu PP chưa duyệt sát ngày | Product Developer | Leo thang MD + khách |
| Hiệu suất thực dưới kế hoạch | Production Manager | Tính lại ngày kết thúc, báo MD |

| KPI | Công thức |
|---|---|
| `M-PL-01` **Độ chính xác kế hoạch** | `\|thực − kế hoạch\| ÷ kế hoạch` |
| `M-PL-02` **Sử dụng năng lực** | `committed ÷ effective_minutes` |
| `M-PL-03` **Đạt lịch** | `% ProductionOrder xong đúng hạn` |
| `M-PL-04` **Tuân thủ cổng thả** | `% thả đúng điều kiện, không vượt` |
| `M-PL-05` **Ổn định lịch** | số lần đổi lịch sau khi chốt |

---

# PHẦN C · D6 — PRODUCTION

## C.1 🔴 Cấu trúc nhà máy — KHÔNG phải cấu trúc chức danh

```
Factory                 nhà máy · địa điểm · múi giờ · lịch làm việc
  └─ Workshop           xưởng
      └─ Section        CUTTING | SEWING | FINISHING | PACKING | EMBROIDERY | PRINTING
          └─ Line       chuyền · số công nhân · loại máy · hiệu suất lịch sử
              └─ Workstation   trạm · máy · công nhân
```

> Đây là bản thay thế cho 4 route `/to-truong-*` hiện tại.
> **Một Workspace Production, một cây tổ chức sản xuất.** Tổ trưởng May thấy chuyền
> của mình vì `Assignment` gán họ vào `Line`, **không** vì họ có một route riêng.
> Hiến pháp §22.4 · §22.5.

## C.2 CUTTING

```
CutTicket (root)
├─ cut_ticket_no · production_order_id → D5 · style · colorway
├─ marker_id → D3 (sơ đồ) · marker_efficiency · fabric_required
├─ SpreadingRecord 1..n
│    🔴 roll_id → D9   ← MẮT XÍCH TRUY VẾT QUAN TRỌNG NHẤT
│    layers · length_used · actual_consumption
├─ Bundle 1..n
│    bundle_no · size · colorway · qty · 🔴 roll_id (kế thừa)
│    status: CREATED → ISSUED_TO_LINE → IN_PROGRESS → COMPLETED
└─ CuttingVariance (DẪN XUẤT) = thực tiêu thụ − định mức lý thuyết
```

**Ba luật:**

| # | Luật | Vì sao |
|---|---|---|
| `CU-R01` | 🔴 **Mỗi `Bundle` mang `roll_id`** | Mắt xích duy nhất nối vải với thành phẩm. Đứt ở đây là mất toàn bộ truy vết |
| `CU-R02` | 🔴 **Không trải chung cuộn khác dải màu trong một lớp** | `WH-R06` — lỗi tốn kém nhất ngành may |
| `CU-R03` | **Chênh lệch tiêu thụ vải phải giải trình** khi vượt ngưỡng | Vải là 60–70% giá vốn CMT |

## C.3 SEWING

```
SewingRun (root)
├─ production_order_id · line_id · date · shift
├─ line_layout_id → D4 · target_output (từ SMV + learning curve)
├─ HourlyOutput 1..n   hour · output_qty · operator_count · cumulative
├─ BundleProgress      bundle_id · operation_id · completed_qty · operator_id
├─ DowntimeEvent 1..n  🔴 reason_code · từ · đến · impact_minutes
└─ EfficiencyResult (DẪN XUẤT)
     = (output × SMV) ÷ (số công nhân × phút làm việc)
```

**`DowntimeReason` — bảng mã chuẩn, không phải ô ghi chú tự do:**
`MACHINE_BREAKDOWN` · `MATERIAL_SHORTAGE` · `QUALITY_HOLD` · `POWER_OUTAGE` ·
`OPERATOR_ABSENT` · `STYLE_CHANGEOVER` · `SAMPLE_PENDING` · `MEETING_TRAINING` · `OTHER`

> 🔴 **Ô ghi chú tự do làm hỏng mọi phân tích nguyên nhân.** Sau 6 tháng sẽ có 400
> cách viết khác nhau cho *"máy hỏng"*. Đây là **TD-02 ở dạng chưa xảy ra** — chặn
> trước, đừng chặn sau.

## C.4 WIP — WORK IN PROGRESS

```
WIP theo bó, không theo tổng:
  Đã cắt → Đã cấp chuyền → Đang may (theo công đoạn) → Đã may xong
  → Đang hoàn thành → Đã đóng gói

🔴 WIP là DẪN XUẤT từ BundleProgress, KHÔNG PHẢI một cột lưu sẵn.
```

**Vì sao theo bó:** WIP tổng cho biết *"còn 3.000 chiếc dở dang"*.
WIP theo bó cho biết *"1.200 chiếc đang kẹt ở công đoạn tra tay chuyền 3"* —
con số thứ hai hành động được, con số thứ nhất thì không.

## C.5 FINISHING · PACKING

```
FinishingRun   ủi · gấp · gắn nhãn · treo · kiểm kim (needle detection)
PackingRun     đóng thùng · cân · dán nhãn vận chuyển
               → Carton (D9 · D10)
               pack_method: SOLID | RATIO | ASSORT
```

⚠️ `needle_break_logs` đã có trong lược đồ ✅ — **kiểm kim gãy là yêu cầu bắt buộc
của mọi buyer lớn**, giữ nguyên và nối vào quy trình.

## C.6 SHOP-FLOOR DATA CAPTURE

| Cách | Ưu | Nhược | Đề nghị |
|---|---|---|---|
| Nhập tay theo giờ | rẻ, không cần thiết bị | trễ, dễ sai, dễ làm đẹp số | **giai đoạn 1** |
| Quét mã bó | chính xác tới bó | cần thiết bị | **giai đoạn 2 — đích** |
| Máy đếm tự động | thời gian thực | đắt | sau |

**Ba yêu cầu bắt buộc dù chọn cách nào:**

| # | Yêu cầu |
|---|---|
| 1 | 🔴 **Hoạt động OFFLINE.** Xưởng may mất mạng là chuyện thường — mất mạng không được dừng ghi sản lượng |
| 2 | 🔴 **Màn hình điện thoại, tiếng Việt, chữ to, ít thao tác.** Người dùng là công nhân, không phải nhân viên văn phòng |
| 3 | **Không sửa được số đã chốt ca** — sửa bằng chứng từ điều chỉnh có duyệt |

## C.7 Business Rules

| Mã | Quy tắc |
|---|---|
| `PR-R01` | 🔴 `Bundle` mang `roll_id` — truy vết không đứt |
| `PR-R02` | 🔴 Chỉ sản xuất khi `ProductionOrder` = `RELEASED` |
| `PR-R03` | 🔴 Sản lượng đã chốt ca **không sửa trực tiếp** |
| `PR-R04` | `Σ output theo công đoạn ≤ qty đã cấp chuyền` |
| `PR-R05` | 🔴 Downtime dùng **bảng mã chuẩn**, không ghi tự do |
| `PR-R06` | Hiệu suất **TÍNH**, không lưu |
| `PR-R07` | 🔴 Nhà thầu ghi sản lượng qua **cùng một mô hình** với chuyền nội bộ — `Assignment` là thứ khác nhau, dữ liệu là một |
| `PR-R08` | Hàng lỗi phải có `Defect` *(D7)* trước khi ghi giảm sản lượng |
| `PR-R09` | Ghi offline **bắt buộc** có `request_id` chống trùng khi đồng bộ lại |

## C.8 Exception · KPI

| Ngoại lệ | Phát hiện | Chủ | Leo thang |
|---|---|---|---|
| Sản lượng giờ dưới mục tiêu | tự động | Line Supervisor | 2 giờ liên tiếp → Production Manager |
| Chuyền dừng > N phút | tự động | Line Supervisor | ngay → PM |
| Thiếu NPL tại chuyền | thủ công | Storekeeper | ngay → Planning + MD |
| Lỗi hàng loạt cùng công đoạn | tự động từ D7 | Inline QC | dừng công đoạn |
| Chênh lệch tiêu thụ vải vượt ngưỡng | tự động | Cutting Manager | Cost Controller |
| Nhà thầu không báo cáo ngày | tự động | Subcon Coordinator | 2 ngày → MD |

| KPI | Công thức |
|---|---|
| `M-PR-01` 🔴 **Hiệu suất chuyền** | `(output × SMV) ÷ (công nhân × phút làm việc)` |
| `M-PR-02` **Đạt mục tiêu ngày** | `output ÷ target` |
| `M-PR-03` 🔴 **RFT — đúng ngay lần đầu** | `thành phẩm không sửa ÷ tổng sản xuất` |
| `M-PR-04` **DHU** | `số lỗi ÷ (số chiếc kiểm ÷ 100)` |
| `M-PR-05` **Tỷ lệ dừng chuyền** | `phút dừng ÷ phút làm việc` |
| `M-PR-06` **Chênh lệch tiêu thụ vải** | `(thực − lý thuyết) ÷ lý thuyết` |
| `M-PR-07` **Thời gian qua chuyền** | ngày từ cấp chuyền tới đóng gói |
| `M-PR-08` **WIP ageing** | tuổi trung bình bó chưa xong |

---

# PHẦN D · PERMISSIONS ba Domain

| Hành động | IE Eng | Planner | Prod Mgr | Line Sup | Cutting Mgr | QA | MD | Subcon |
|---|---|---|---|---|---|---|---|---|
| Xem SMV | ✅ | ✅ | ✅ | ⚠️ chuyền mình | ✅ | ❌ | ✅ | ⚠️ phần mình |
| 🔴 **Duyệt SMV** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cân bằng chuyền | ✅ | ⚠️ xem | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Xem năng lực | ✅ | ✅ | ✅ | ⚠️ chuyền mình | ✅ | ❌ | ✅ | ❌ |
| 🔴 **Chạy CTP** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ **hỏi** | ❌ |
| Xếp lịch chuyền | ❌ | ✅ | ⚠️ đề nghị | ❌ | ❌ | ❌ | ❌ | ❌ |
| 🔴 **Thả lệnh sản xuất** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Vượt cổng thả** | ❌ | ⚠️ ❓`OQ-023` | ⚠️ ❓ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ghi sản lượng | ❌ | ❌ | ✅ | ✅ **chuyền mình** | ✅ | ❌ | ❌ | ✅ **phần mình** |
| Ghi downtime | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Chốt ca | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Sửa số đã chốt | ❌ | ❌ | ⚠️ qua điều chỉnh | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tạo phiếu cắt | ❌ | ⚠️ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Xem giá / chi phí | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⛔ chỉ giá của mình |

> 🔴 **Dòng cuối là ranh giới quan trọng nhất bảng này.** Không vai trò sản xuất
> nào cần thấy giá. Cấp quyền xem giá cho tổ trưởng là mở rộng bề mặt rò rỉ mà
> không đổi lấy giá trị nghiệp vụ nào.

---

# PHẦN E · CHỖ TÔI CÓ THỂ SAI

| # | Giả định | Nếu sai |
|---|---|---|
| `MF-U1` | Monica **có** bộ phận IE và **đo** SMV bằng bấm giờ | Nếu báo giá theo kinh nghiệm, D4 xuống P3 và mô hình năng lực phải dùng đơn vị thô hơn *(chuyền × ngày)*. `BC2-Q4` |
| `MF-U2` | Đơn vị năng lực là **phút chuyền** | `OQ-021`. Nếu là số chuyền × ngày, §B.2 đơn giản hơn nhiều nhưng mất khả năng so sánh mã hàng |
| `MF-U3` | Learning curve **đáng mô hình hoá** | Nếu Monica chạy ít mã, nhiều số lượng, ảnh hưởng nhỏ hơn nhiều. `BC2-Q5` |
| `MF-U4` | Có thể ghi sản lượng tới cấp **bó × công đoạn** | Nếu chỉ ghi được tổng theo chuyền theo ngày, WIP theo bó không dựng được và truy vết đứt ở `CU-R01` |
| `MF-U5` | Xưởng **có** điện thoại/máy tính bảng dùng được | Nếu ghi tay rồi nhập lại cuối ngày, mọi cảnh báo thời gian thực vô nghĩa. `BC2-Q6` |
| `MF-U6` | `production_orders` là **lệnh sản xuất** | `CF-3` chưa phán quyết |
| `MF-U7` | Nhà thầu ghi sản lượng theo **cùng mô hình** với chuyền nội bộ | Nếu họ chỉ báo tổng ngày, `PR-R07` phải nới và số liệu hai bên không so sánh được |

---

## THAM CHIẾU

[TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md) · Hiến pháp Điều 21 · 22 *(§22.4 · §22.5)* ·
[BKB](../../business/BUSINESS_KNOWLEDGE_BASE.md) C.7 `OQ-021` `OQ-022` `OQ-023` `OQ-024` `CF-3` ·
`lib/garment-math.ts` *(công thức đã có, chưa ai gọi)* · [BC#2](../../business/BUSINESS_CONFIRMATION_2.md)
