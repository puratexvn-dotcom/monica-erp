# EDD-04 · ENTERPRISE DESIGN DOCUMENT
## Phase 8 · Workflow Engine  ·  Phase 9 · Rule Engine  ·  Phase 10 · Permission Model

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-04 |
| **Sprint** | Enterprise Business Design · Sprint 4 |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Trạng thái** | ⏳ **CHỜ PHÊ DUYỆT** |
| **Tiền đề** | [EDD-01](EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) ✅ · [EDD-02](EDD-02-MASTER-DATA-BUSINESS-OBJECT.md) ✅ · [EDD-03](EDD-03-DOCUMENT-INFORMATION-ARCHITECTURE.md) ✅ · [EDD-03A](EDD-03A-PARTNER-PORTAL-ARCHITECTURE.md) |
| **Nguyên tắc kiểm chứng** | 🔴 *"Nếu ngày mai triển khai cho 100 doanh nghiệp may khác nhau, kiến trúc này còn đúng không?"* — **§11 kiểm chứng bằng 5 doanh nghiệp mẫu** |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §0 · GHI NHẬN VÀ ĐÍNH CHÍNH

## 0.1 ⚠️ Trùng số hiệu — xử lý

Board đánh số `BDR-14` *(Audit Log)* và `BDR-15` *(Legal Conversation)*. Hai số này **trùng** với hai câu tôi trình ở EDD-03A và **chưa được trả lời**.

| Số cũ *(EDD-03A)* | Số mới | Nội dung | Trạng thái |
|---|---|---|---|
| `BDR-14` | 🔄 **`BDR-18`** | Nhà thầu dùng chung giữa nhiều doanh nghiệp | ⏳ **chưa trả lời — mang tiếp §10** |
| `BDR-15` | 🔄 **`BDR-19`** | Chi phí hạ tầng cổng đối tác | ⏳ **chưa trả lời — mang tiếp §10** |

Số `BDR-14` · `BDR-15` từ nay thuộc về quyết định của Board *(Audit Log · Legal Conversation)*.

## 0.2 Chín quyết định đã hấp thụ

| BDR | Quyết định | Tác động lên EDD-04 |
|---|---|---|
| **09** | QA Evidence chia sẻ theo quyền · ⛔ **không sửa/xoá sau khi xác nhận** | §10.4 Immutable Record |
| **10** | Ngôn ngữ theo hợp đồng · mặc định VN→vi · Mỹ/quốc tế→en · TQ→zh | `M69 LanguagePolicy` §9.5 |
| **11** | Anonymous Benchmarking là **Product Capability chiến lược** · thiết kế ngay · **tắt mặc định** | §10.3 phân loại dữ liệu · `DL-081` |
| **12** | Nhà thầu xem KPI · hiệu suất · Line Map · QA · Dashboard **của chính họ** | ✅ đã thi hành ở EDD-03A `DL-065` |
| **13** | 🔴 **Tách tối thiểu 4 loại dữ liệu** — Customer · Monica · Legal · AI Generated. Mỗi loại có Owner · Permission · Retention · Audit · Backup | 🔴 **Trục phân loại THỨ HAI** — §10.3 |
| **14** | 🔴 **Audit Log BẤT BIẾN** — bằng chứng pháp lý | §10.4 chuỗi băm |
| **15** | 🔴 **Legal Conversation** — hội thoại về PO · QA · Approval · Change · Commercial | §10.4 · `DL-082` |
| **16** | Lưu lịch sử **toàn bộ** Notification | §10.4 |
| **17** | 🔴 **AI Decision History** — prompt · context · recommendation · người duyệt · quyết định cuối | §10.5 |

---
---

# PHASE 8 · WORKFLOW ENGINE

> Joseph: *"Thiết kế toàn bộ Workflow. Không hardcode. Không if/else. Có thể mở rộng."*

## 8.1 🔴 Phát biểu nền — **không có MỘT loại workflow**

Sai lầm phổ biến nhất khi xây workflow engine doanh nghiệp: **dùng một cơ chế cho mọi thứ**. Kết quả là một BPMN engine cồng kềnh mà 60% quy trình bị bẻ cong để vừa khuôn, và 20% quy trình ⛔ không diễn đạt được.

**Bốn nguyên mẫu, bốn cơ chế:**

| | **A · LIFECYCLE** | **B · APPROVAL** | **C · ORCHESTRATION** | **D · CASE** |
|---|---|---|---|---|
| **Bản chất** | Một aggregate đổi trạng thái | Định tuyến tới **người** | Chuỗi dài, nhiều aggregate, song song | 🔴 **Không có đường đi định trước** |
| **Câu hỏi** | *"được chuyển sang trạng thái này không?"* | *"ai phải ký?"* | *"bước nào tiếp theo, ai làm?"* | *"mục tiêu đạt chưa?"* |
| **Điều khiển** | máy trạng thái + guard | chính sách duyệt | định nghĩa quy trình | mục tiêu + danh mục kiểm |
| **Thời gian sống** | tức thời | giờ → ngày | ngày → tháng | ngày → tháng |
| **Ví dụ** | `Order` · `Assignment` · `PurchaseOrder` | duyệt chiết tính · duyệt huỷ đơn · duyệt PO | `ProcessRoute` 13 công đoạn · Order-to-Cash | 🔴 **CAPA · tranh chấp khấu trừ · khiếu nại chất lượng** |
| **Định nghĩa** | `StateMachineDefinition` | `ApprovalPolicy` | `ProcessDefinition` | `CaseTemplate` |

> ### 🔴 Vì sao **D · CASE** phải tách riêng — điểm quan trọng nhất Phase 8
>
> **CAPA và tranh chấp khấu trừ ⛔ KHÔNG có đường đi định trước.** Một CAPA có thể là: điều tra → tìm nguyên nhân → hành động → xác minh. Hoặc: hành động tạm → điều tra → phát hiện nguyên nhân khác → hành động lại → xác minh → tái phát → điều tra lại.
>
> Ép nó vào máy trạng thái tạo ra **tuân thủ giả**: người dùng bấm qua các bước để hệ thống cho đi tiếp, ⛔ không phải vì công việc thật đã xong.
>
> **Case = mục tiêu + danh mục kiểm + người tham gia + bằng chứng.** Con người quyết thứ tự; hệ thống bảo đảm ⛔ không mục nào bị bỏ sót và mọi bước đều có vết.

## 8.2 Mô hình định nghĩa — workflow là **DỮ LIỆU**

```
WorkflowDefinition   (Master Data · T1 mẫu chuẩn ngành · T2 riêng doanh nghiệp)
├─ workflow_code · version · archetype
├─ 🔴 tenant_id       NULL = mẫu chuẩn ngành dùng chung · có giá trị = riêng doanh nghiệp
├─ applies_to: object_type
├─ scope_condition    ← RuleRef: workflow này áp cho đơn nào (FOB? khách nào? nhà máy nào?)
├─ status: DRAFT → ACTIVE → DEPRECATED
├─ effective_from · effective_to
├─ 🔴 test_cases[]    ← BẮT BUỘC — xem WF-6
└─ definition:  StateMachine | ApprovalPolicy | ProcessDefinition | CaseTemplate
```

### A · `StateMachineDefinition`

```
├─ states[] · initial_state · terminal_states[]
└─ Transition[]
     from · to · trigger
     🔴 guard_rules[]      ← THAM CHIẾU tới Rule Engine, ⛔ KHÔNG viết điều kiện tại chỗ
     required_capability   ← ai được kích hoạt
     approval_policy_ref?  ← nếu cần duyệt
     side_effects[]        ← sự kiện phát ra
     is_reversible: bool
```

### B · `ApprovalPolicy`

```
├─ trigger_condition (RuleRef) · steps[]
│    step_no · approver_resolution: ROLE | SPECIFIC_PERSON | RULE_BASED | HIERARCHY
│    quorum: ALL | ANY | N_OF_M
│    🔴 sla_hours · on_timeout: ESCALATE | AUTO_REJECT | REMIND
│    escalation_to
├─ 🔴 delegation_allowed: bool
├─ 🔴 sod_check: bool          ← người trình ⛔ không được là người duyệt
└─ 🔴 decision_snapshot: bool  ← chụp lại ĐÚNG thứ người duyệt đã nhìn thấy
```

### C · `ProcessDefinition`

```
└─ ProcessStep[]
     step_code · type: SYSTEM | HUMAN | 🔴 EXTERNAL_PARTY | WAIT | PARALLEL_SPLIT | JOIN
     assignee_resolution  ← Role · Assignment · 🔴 PartnerAccount qua Portal
     entry_guard (RuleRef) · exit_guard (RuleRef)
     🔴 sla · on_breach: RiskSignal
     compensation_step?   ← bước bù khi hỏng
```

### D · `CaseTemplate`

```
├─ goal_statement · 🔴 required_outcomes[]   ← PHẢI đạt, ⛔ không quy định THỨ TỰ
├─ suggested_activities[]                     ← gợi ý, ⛔ không bắt buộc
├─ participant_roles[] · 🔴 evidence_requirements[]
├─ closure_condition (RuleRef)                ← khi nào được đóng
└─ sla · escalation
```

## 8.3 Bảy luật workflow

| # | Luật | Vì sao |
|---|---|---|
| `WF-1` | 🔴 **Workflow là DỮ LIỆU, ⛔ không phải mã.** ⛔ Không `if/else` nghiệp vụ trong mã ứng dụng | Chỉ thị Joseph. Và điều kiện để 100 doanh nghiệp dùng chung một bộ mã |
| `WF-2` | 🔴 **Guard là THAM CHIẾU tới Rule Engine**, ⛔ không phải biểu thức viết tại chỗ | Ranh giới §8.5. Điều kiện viết tại chỗ ⇒ luật nằm rải, ⛔ không quản trị tập trung được |
| `WF-3` | 🔴 **Thể hiện đang chạy GẮN CHẶT vào PHIÊN BẢN định nghĩa lúc nó khởi tạo** | Đổi workflow giữa chừng ⛔ không được làm gãy đơn đang chạy. Bản mới chỉ áp cho thể hiện mới |
| `WF-4` | **Mọi bước có chủ sở hữu và SLA**; quá hạn sinh `RiskSignal` | Bước không có chủ và hạn là bước sẽ bị quên |
| `WF-5` | 🔴 **Bước của đối tác ngoài đi qua `CollaborationRequest`**, ⛔ không ghi thẳng | `DL-060`. Khách/nhà thầu là **người tham gia workflow**, ⛔ không phải người ghi dữ liệu |
| `WF-6` | 🔴 **Workflow ⛔ KHÔNG được `ACTIVE` nếu chưa có test case** | Workflow là mã nghiệp vụ. Mã không kiểm thử ⛔ không được lên production — kể cả khi nó là dữ liệu |
| `WF-7` | **Mọi chuyển bước ghi vào Audit Log bất biến** | `BDR-14` |

## 8.4 Bốn workflow cốt lõi — thiết kế đầy đủ

### 8.4.1 `ORDER_LIFECYCLE` · nguyên mẫu A

```
DRAFT ──▶ CONFIRMED ──▶ PLANNED ──▶ IN_PRODUCTION ──▶ PRODUCTION_COMPLETE
                                                            ▼
CLOSED ◀── SETTLED ◀── INVOICED ◀── SHIPPED ◀───────────────┘
   ▲          ▲                        ▲
   └──── ON_HOLD (quay về đúng trạng thái trước) ────┘
                    │
              CANCELLED (đầu cuối)
```

| Cổng | Guard *(RuleRef)* | Duyệt | Kiểu |
|---|---|---|---|
| `DRAFT→CONFIRMED` | `R-ORD-GATE1` — có PO khách · giá đã duyệt · ngày giao · sở hữu NPL quyết · **CTP trả lời** | GĐSX | ⚠️ **MỀM** — cảnh báo + ghi người bỏ qua |
| `CONFIRMED→PLANNED` | `R-ORD-GATE2` — T&A sinh · phân bổ xong · MRP tính | Planner | ⚠️ MỀM |
| `PLANNED→IN_PRODUCTION` | `R-ORD-GATE3` — **PP duyệt** + **NPL sẵn sàng ≥ ngưỡng** | GĐSX | 🔴 **CỨNG** — vượt phải có lý do |
| `→SHIPPED` | `R-ORD-GATE4` — QA Final đạt · packing list · booking · **bộ chứng từ đủ** | Logistics | 🔴 **CỨNG** |
| `*→CANCELLED` | `R-ORD-CANCEL` — có kế hoạch xử lý NPL · Assignment · Reservation · CapacityBooking | 🔴 **GĐSX + đồng ký** *(`DL-042`)* | 🔴 CỨNG |

### 8.4.2 `COSTING_APPROVAL` · nguyên mẫu B

```
Merchandiser trình
      ▼
🔴 SoD check: người trình ≠ người duyệt          ← WF sod_check
      ▼
GĐSX duyệt  ── SLA 24h ── quá hạn ⇒ nhắc, +48h ⇒ báo CEO
      │
      ├─ 🔴 decision_snapshot: chụp giá lần trước · biên · ngưỡng ĐÚNG lúc duyệt
      ├─ 🔴 delegation: uỷ quyền có thời hạn (GĐSX vắng ⇒ CEO)
      ▼
APPROVED ─▶ Costing khoá · sinh Quotation được
REJECTED ─▶ về DRAFT kèm lý do bắt buộc
```

> ⚠️ **Uỷ quyền có thời hạn là BẮT BUỘC, ⛔ không phải tuỳ chọn.** *"Chỉ duy nhất GĐSX duyệt giá"* rất tốt cho kiểm soát và tạo ra **một điểm chết** — GĐSX nghỉ thì **mọi báo giá đứng**.

### 8.4.3 `PRODUCTION_FLOW` · nguyên mẫu C

```
Sinh từ ProcessRoute (M58) — 13 công đoạn, ⛔ KHÔNG viết cứng

Kho NPL ──▶ Cắt ──┬──▶ [In]     ← EXTERNAL_PARTY nếu is_outsourced
                  ├──▶ [Thêu]     leaves_factory ⇒ sinh StageTransfer
                  └──▶ [Ép]                        + theo dõi "hàng đang ở ngoài"
                         │
                    (JOIN) ──▶ May ──▶ QC Inline ──▶ Hoàn thành ──▶ Ủi
                                                          ▼
                    Xuất ◀── Thành phẩm ◀── Đóng gói ◀── Gấp

🔴 Mỗi bước:  entry_guard · exit_guard · SLA · người phụ trách
🔴 Bước EXTERNAL_PARTY: giao qua Subcontract Portal, nhà thầu ghi sản lượng
```

### 8.4.4 `QUALITY_CAPA` · nguyên mẫu D — **Case, ⛔ không phải máy trạng thái**

```
CaseTemplate: CAPA
├─ Mục tiêu: "lỗi ⛔ không tái diễn"
├─ 🔴 Kết quả BẮT BUỘC (⛔ không quy định thứ tự):
│    ✓ nguyên nhân gốc đã xác định + bằng chứng
│    ✓ hành động khắc phục đã thực hiện + bằng chứng
│    ✓ hành động phòng ngừa đã thực hiện
│    ✓ xác minh hiệu quả sau N ngày + bằng chứng
├─ Người tham gia: QA Manager · Production · 🔴 Nhà thầu (qua Portal)
├─ Điều kiện đóng: R-CAPA-CLOSE — đủ 4 kết quả + xác minh đạt
└─ SLA 14 ngày · quá hạn ⇒ RiskSignal ⇒ leo thang
```

> **Vì sao Case chứ ⛔ không phải State Machine:** thứ tự thật thay đổi theo từng vụ. Hệ thống bảo đảm **⛔ không kết quả nào bị bỏ sót** và **mọi bước có bằng chứng** — ⛔ không ép một trình tự giả.

## 8.5 🔴 Ranh giới Workflow ⟷ Rule Engine

```
WORKFLOW trả lời:  KHI NÀO · AI · THEO THỨ TỰ NÀO
RULE trả lời:      CÓ ĐƯỢC KHÔNG · GIÁ TRỊ BAO NHIÊU · VÌ SAO
```

| Thuộc Workflow | Thuộc Rule |
|---|---|
| Trạng thái và phép chuyển | Điều kiện guard |
| Thứ tự bước · song song · hội tụ | Giá trị dẫn xuất *(sở hữu NPL · thời gian chuẩn)* |
| Ai được kích hoạt | Ai phải duyệt *(định tuyến)* |
| SLA · leo thang | Ngưỡng · giới hạn · công thức |
| Bù trừ khi hỏng | Tín hiệu rủi ro |

> `DL-067` · **Guard ⛔ không bao giờ là biểu thức viết trong định nghĩa workflow — luôn là `RuleRef`.**
> Lý do: cùng một điều kiện *("NPL sẵn sàng ≥ 90%")* xuất hiện ở **guard cổng 3**, ở **tín hiệu rủi ro**, và ở **Work Inbox**. Viết ba lần ⇒ ba nơi lệch nhau. Đây là `BR-RPT-001` ở tầng logic.

## 8.6 Phiên bản và thay đổi khi đang chạy

```
Order-2588 khởi tạo với ORDER_LIFECYCLE v3
Ngày mai doanh nghiệp đổi cổng 3 (ngưỡng NPL 90% → 85%) ⇒ v4 ACTIVE
   ▶ Order-2588 tiếp tục chạy v3        ← ⛔ KHÔNG bị ảnh hưởng
   ▶ Order-2601 (đơn mới) chạy v4
   ▶ v3 chuyển DEPRECATED, ⛔ không xoá  ← còn thể hiện đang chạy
```

> `DL-068` · **Thể hiện gắn chặt vào phiên bản định nghĩa lúc khởi tạo.**
> ⚠️ Đánh đổi: nhiều phiên bản cùng sống, cần công cụ xem *"đơn nào đang chạy phiên bản nào"*. Chấp nhận vì phương án kia — **đổi luật giữa chừng làm gãy đơn đang sản xuất** — là ⛔ không chấp nhận được.
> **Ngoại lệ duy nhất:** vá lỗi bảo mật được áp cho mọi thể hiện, có ghi vết và thông báo.

---
---

# PHASE 9 · RULE ENGINE

> Joseph: *"Tất cả Rule quản lý tập trung."*

## 9.1 Bảy loại quy tắc — một sổ đăng ký, nhiều bộ đánh giá

| # | Loại | Trả lời | Ví dụ | Mức |
|---|---|---|---|---|
| **R1** | **DẪN XUẤT** | *giá trị là gì?* | sở hữu NPL từ `order_type` · thời gian chuẩn · năng lực tuần-chuyền | — |
| **R2** | **KIỂM TRA** | *dữ liệu này hợp lệ không?* | `Σ size = line qty` · số lượng > 0 · ngày giao > hôm nay | BLOCK · WARN |
| **R3** | **CỔNG** | *được chuyển trạng thái không?* | 4 cổng của `Order` · cổng thả lệnh SX | BLOCK |
| **R4** | **ĐỊNH TUYẾN** | *ai phải duyệt?* | chiết tính → GĐSX · PO → MD + GĐSX · huỷ đơn → GĐSX + đồng ký | — |
| **R5** | **TÍN HIỆU** | *khi nào cảnh báo?* | 5 tín hiệu rủi ro · trễ mốc · thiếu NPL | WARN · CRITICAL |
| **R6** | **TÍNH TOÁN** | *công thức nào?* | giá vốn · lãi trên biến phí · lãi toàn bộ · lương sản phẩm · AQL | — |
| **R7** | **PHÂN QUYỀN** | *người này được làm không?* | → Phase 10 | BLOCK |

> `DL-069` · **MỘT sổ đăng ký, BẢY bộ đánh giá.** *"Quản lý tập trung"* nghĩa là **một nơi tra cứu, một nơi kiểm thử, một nơi kiểm toán** — ⛔ không có nghĩa là một cơ chế đánh giá cho bảy bài toán khác nhau về bản chất.

## 9.2 Mô hình quy tắc

```
BusinessRule   (Master Data)
├─ rule_code · version · rule_type · domain · priority
├─ 🔴 tenant_id       NULL = chuẩn ngành · có giá trị = riêng doanh nghiệp
├─ scope_condition    ← quy tắc này áp cho đối tượng nào
├─ when: ConditionTree   ← §9.3
├─ then: Outcome         ← giá trị · chặn · cảnh báo · định tuyến · tín hiệu
├─ severity: BLOCK | WARN | INFO
├─ 🔴 explanation_i18n   ← NGƯỜI DÙNG THẤY GÌ khi quy tắc chạy
├─ 🔴 evidence_refs[]    ← quy tắc đã nhìn vào dữ liệu nào
├─ effective_from · effective_to
├─ 🔴 test_cases[]       ← BẮT BUỘC
└─ status: DRAFT → ACTIVE → DEPRECATED
```

> ### 🔴 `explanation_i18n` là trường quan trọng nhất của mô hình này
>
> Một quy tắc chặn mà ⛔ không giải thích được **vì sao** thì người dùng sẽ **tìm đường vòng** — và luật thành trang trí.
>
> ```
> ❌ "Không thể chuyển sang IN_PRODUCTION"
> ✅ "Chưa thể lên chuyền: NPL sẵn sàng 82% (cần ≥ 90%).
>     Thiếu: vải chính 240m, nhãn dệt 3.200 cái.
>     [Xem chi tiết]  [Đề nghị GĐSX cho vượt]"
> ```
>
> Đây cũng là tiền lệ mà `BDR-17` *(AI phải giải thích được)* đặt ra — **và nó phải áp cho cả luật thường, ⛔ không riêng AI.**

## 9.3 Ngôn ngữ điều kiện — quyết định an ninh, ⛔ không phải quyết định tiện lợi

| | **A · Mã tự do** *(eval JS/Python)* | **B · DSL có cấu trúc** | **C · Lai** ⭐ |
|---|---|---|---|
| Sức biểu đạt | vô hạn | hạn chế | 95% DSL + vị từ có tên cho 5% khó |
| An toàn | 🔴 **Doanh nghiệp viết mã chạy trên máy chủ = thực thi mã từ xa** | ✅ an toàn | ✅ an toàn |
| Kiểm thử | ⛔ không | ✅ | ✅ |
| Giải thích tự động | ⛔ không | ✅ | ✅ |
| Đa thuê bao | 🔴 ⛔ **KHÔNG CHẤP NHẬN ĐƯỢC** | ✅ | ✅ |

```
ConditionTree  (JSON, có kiểu, kiểm được)
{ "all": [
    { "field": "order.order_type", "op": "eq", "value": "FOB" },
    { "field": "material.category", "op": "in", "value": ["FABRIC","TRIM"] },
    { "predicate": "material_readiness_gte", "args": { "pct": 90 } }
                    ▲ vị từ CÓ TÊN, cài đặt bằng mã, đăng ký sẵn
]}
```

**Vị từ có tên** — Monica ONE cài đặt, doanh nghiệp **dùng chứ ⛔ không viết**:
`material_readiness_gte` · `capacity_available_in_window` · `shade_group_compatible` ·
`aql_within_limit` · `sample_stage_approved` · `document_set_complete` · `customer_credit_ok`

> `DL-070` · **⛔ KHÔNG BAO GIỜ thực thi mã tự do do người dùng nhập.** Với đa thuê bao, mã của doanh nghiệp A chạy trên máy chủ chung là **thực thi mã từ xa** — hỏng chết người, ⛔ không có cách vá.
> Cần logic phức tạp ⇒ Monica ONE **thêm một vị từ có tên**, kiểm thử, phát hành. Chậm hơn, và là **cách duy nhất an toàn**.

## 9.4 Bộ quy tắc — ví dụ FOB/CMT Joseph nêu

Joseph đưa ví dụ: `FOB → Procurement → Supplier → Material → Inspection` và `CMT → Customer Material → …`

```
RuleSet: ORDER_MATERIAL_FLOW
│
├─ R-MAT-010  order_type = FOB
│              → ownership = MONICA_OWNED
│              → kích hoạt luồng: PurchaseRequisition → Sourcing → PO → GoodsReceipt → Inspection
│
├─ R-MAT-020  order_type = CMT
│              → ownership = CUSTOMER_SUPPLIED
│              → kích hoạt luồng: InboundReceipt → 🔴 ĐỐI CHIẾU ĐỊNH MỨC → Inspection
│
├─ R-MAT-030  order_type = CMT ∧ category ∈ {PACKAGING, CONSUMABLE}
│              → ownership = MONICA_OWNED       ← 🔴 ghi đè: thùng, túi PE, chỉ
│              (priority CAO hơn R-MAT-020)
│
└─ R-MAT-040  contract.nominated_supplier = true
               → ownership = CUSTOMER_NOMINATED
               → Monica đặt hàng, khách đã đàm phán giá
```

**Giải quyết xung đột:** `priority` cao chạy trước · cùng priority thì **cụ thể hơn thắng** · vẫn hoà ⇒ 🔴 **lỗi định nghĩa, chặn lúc kích hoạt quy tắc, ⛔ không phải lúc chạy**.

> `DL-071` · **Phát hiện quy tắc mâu thuẫn tại thời điểm ĐỊNH NGHĨA, ⛔ không phải lúc chạy.** Hai quy tắc cùng điều kiện, cùng priority, kết quả khác nhau ⇒ ⛔ **không cho `ACTIVE`**. Phát hiện lúc chạy nghĩa là một đơn hàng thật bị kẹt vào lúc tệ nhất.

## 9.5 Ba bộ quy tắc mới từ quyết định Board

```
M69 · LanguagePolicy  ← BDR-10
  R-LANG-010  customer.country = 'VN'                     → document_language = 'vi'
  R-LANG-020  customer.country = 'CN'                     → 'zh'
  R-LANG-030  mặc định                                    → 'en'
  R-LANG-040  contract.language_of_record có giá trị       → GHI ĐÈ tất cả (priority cao nhất)

M70 · DataCategoryPolicy  ← BDR-13   (§10.3)
M71 · BenchmarkEligibility ← BDR-11
  R-BM-010  tenant.benchmark_consent = false              → LOẠI TRỪ hoàn toàn
  R-BM-020  nhóm so sánh < 7 doanh nghiệp                 → ⛔ KHÔNG hiện
  R-BM-030  trường ∈ {customer_name, price, supplier_name, salary} → 🔴 ⛔ KHÔNG BAO GIỜ đưa vào
```

## 9.6 Sáu luật quy tắc

| # | Luật |
|---|---|
| `RL-1` | 🔴 **Mọi quy tắc nghiệp vụ nằm trong sổ đăng ký.** ⛔ Không `if` nghiệp vụ trong mã ứng dụng — phép kiểm kiến trúc bắt được |
| `RL-2` | 🔴 **Quy tắc ⛔ không `ACTIVE` nếu chưa có test case** |
| `RL-3` | 🔴 **Mọi quy tắc có `explanation_i18n`** — chặn mà ⛔ không giải thích được thì ⛔ không được chặn |
| `RL-4` | **Mâu thuẫn phát hiện lúc định nghĩa** |
| `RL-5` | 🔴 **⛔ Không thực thi mã tự do** — chỉ DSL + vị từ có tên |
| `RL-6` | **Mọi lần quy tắc chạy và CHẶN đều ghi Audit Log** kèm dữ liệu đầu vào | `BDR-14` |

---
---

# PHASE 10 · PERMISSION MODEL

> Joseph liệt kê 12 khái niệm. Chúng ⛔ không cùng một tầng — §10.1 xếp lại.

## 10.1 Mô hình hình thức

```
┌── AI (chủ thể) ────────────────────────────────────────────┐
│  Person ──n:m──▶ RoleAssignment(Role, OrgScope, validity)   │
│  PartnerAccount ──▶ Party ──▶ Assignment[]  (đối tác ngoài) │
└────────────────────────────┬───────────────────────────────┘
                             │
┌── LÀM GÌ ──────────────────┼───────────────────────────────┐
│  Role ──▶ Capability[]     │   verb:object                  │
│  Responsibility            │   🔴 KẾT QUẢ phải chịu — không suy ra được từ quyền │
│  DecisionAuthority         │   được gây chuyển trạng thái   │
│  ApprovalAuthority         │   được PHÊ CHUẨN quyết định người khác │
│  DataOwnership             │   giữ sổ aggregate — 🔴 ĐÚNG MỘT Role │
└────────────────────────────┼───────────────────────────────┘
                             │
┌── TRÊN CÁI GÌ ─────────────┼───────────────────────────────┐
│  6 chiều phạm vi           │   Tenant · Org · Factory · Warehouse · Party · Assignment │
│  6 lớp tiết lộ             │   ai được THẤY                │
│  🆕 5 loại dữ liệu (BDR-13)│   dữ liệu CỦA AI, luật gì     │
└────────────────────────────┴───────────────────────────────┘

QUYẾT ĐỊNH TRUY CẬP =
   Capability ∩ DataCategory ∩ Disclosure ∩ Scope(6) ∩ StateGuard ∩ SoD
```

## 10.2 Sáu khái niệm — phân biệt và chỗ dễ nhầm

| # | Khái niệm | Trả lời | Nhầm với | Vì sao phải tách |
|---|---|---|---|---|
| 1 | **Role** | *anh là ai* | chức danh | Role là **tập năng lực**, ⛔ không phải ô trên sơ đồ tổ chức. Một người nhiều Role |
| 2 | **Responsibility** | *anh chịu trách nhiệm KẾT QUẢ gì* | Permission | 🔴 **⛔ Không suy ra được từ quyền.** Merchandiser chịu trách nhiệm ngày giao nhưng ⛔ không có quyền điều chuyền |
| 3 | **Permission** | *anh được làm THAO TÁC gì* | Role | Gắn vào **động từ + đối tượng** |
| 4 | **DataOwnership** | *anh GIỮ SỔ aggregate nào* | Permission | 🔴 **ĐÚNG MỘT Role mỗi aggregate.** Nhiều người ghi được, một người chịu trách nhiệm ĐÚNG |
| 5 | **DecisionAuthority** | *anh làm trạng thái ĐỔI được* | Approval | Người **RA** quyết định |
| 6 | **ApprovalAuthority** | *anh PHÊ CHUẨN quyết định người khác* | Decision | 🔴 **⛔ KHÔNG BAO GIỜ cùng Role cho cùng một phép chuyển** |

## 10.3 🔴 `BDR-13` — TRỤC PHÂN LOẠI THỨ HAI

Joseph yêu cầu tách tối thiểu 4 loại. **Đây là trục HOÀN TOÀN KHÁC với 6 lớp tiết lộ**, và trộn hai trục là sai lầm dễ mắc nhất.

| | **Disclosure Class** *(EDD-03)* | 🆕 **Data Category** *(BDR-13)* |
|---|---|---|
| Trả lời | *AI ĐƯỢC THẤY?* | *DỮ LIỆU CỦA AI, LUẬT GÌ CHI PHỐI?* |
| Chi phối | phép chiếu · phạm vi | **sở hữu · lưu trữ · sao lưu · kiểm toán · khi chấm dứt quan hệ** |
| Ví dụ | `CUSTOMER_SCOPED` | `CUSTOMER_DATA` |

**Năm loại — 4 Joseph bắt buộc + 1 tôi bổ sung:**

| Loại | Chủ sở hữu | Quyền | Lưu trữ | Kiểm toán | Sao lưu | Khi chấm dứt quan hệ |
|---|---|---|---|---|---|---|
| 👤 **`CUSTOMER_DATA`**<br>*TechPack · artwork · PO khách · thông số* | 🔴 **Khách hàng** *(Monica giữ hộ)* | theo `M66 IPOwnership` | theo `M66` | mọi lượt truy cập | có mã hoá | 🔴 **Xuất trả đầy đủ** · Monica lưu trữ nếu `CUSTOMER_OWNED` thì ⛔ **không dùng lại** |
| 🏭 **`PARTNER_DATA`** 🆕<br>*báo cáo ngày nhà thầu · chào giá NCC · xác nhận PO* | **Đối tác** *(Monica giữ hộ)* | phạm vi đối tác | 3 năm | mọi lượt truy cập | có mã hoá | Xuất trả · Monica giữ bản đối chiếu |
| 🏢 **`MONICA_DATA`**<br>*chiết tính · thời gian chuẩn · lịch sử chất lượng · giá vốn · năng lực* | 🔴 **Monica** — **tài sản** | `RESTRICTED` phần lớn | ⛔ không giới hạn | mọi lượt truy cập với dữ liệu `RESTRICTED` | đầy đủ | 🔴 **Monica GIỮ** — kể cả tri thức sinh từ đơn của khách đó |
| ⚖️ **`LEGAL_RECORD`**<br>*hoá đơn · tờ khai · hợp đồng · Audit Log · Legal Conversation* | **Pháp nhân** *(LegalEntity)* | chỉ đọc sau khi chốt | 🔴 **theo luật — `M68`** | 🔴 **BẤT BIẾN, chuỗi băm** | 🔴 **đầy đủ, ⛔ không xoá được** | 🔴 **⛔ KHÔNG XOÁ ĐƯỢC kể cả khi khách yêu cầu** |
| 🤖 **`AI_GENERATED`**<br>*dự báo · đề xuất · phát hiện bất thường · nhật ký AI* | **Monica** | 🔴 **kế thừa mức tiết lộ CAO NHẤT trong context** | 2 năm *(dự báo)* · theo `LEGAL_RECORD` *(nhật ký quyết định)* | mọi lượt | đầy đủ | Monica giữ |

> ### 🔴 Hàng `AI_GENERATED` chứa một cạm bẫy phải nói rõ
>
> Nếu AI đọc `Costing` *(`RESTRICTED`)* để dự báo nguy cơ lỗ, thì **kết quả dự báo và nhật ký AI cũng chứa thông tin `RESTRICTED`**.
>
> `DL-072` · **Dữ liệu AI sinh ra KẾ THỪA mức tiết lộ CAO NHẤT trong ngữ cảnh nó đọc.** ⛔ Không bao giờ hạ thấp.
>
> Hệ quả cụ thể: **⛔ không bao giờ hiện dự báo sinh từ dữ liệu `RESTRICTED` cho người ⛔ không có quyền `RESTRICTED`** — kể cả khi bản thân câu dự báo *"đơn này có nguy cơ lỗ"* trông vô hại. Nó **suy ra được biên lợi nhuận**.
>
> Đây là mâu thuẫn thật giữa `BDR-17` *(lưu đầy đủ prompt và context)* và lớp `RESTRICTED` — xem `BDR-22`.

## 10.4 🔴 KIẾN TRÚC BẢN GHI BẤT BIẾN — `BDR-09` · `14` · `15` · `16` · `17`

Năm quyết định của Board cùng đòi **một cơ chế**: bản ghi ⛔ không sửa được, truy vết được, dùng làm bằng chứng pháp lý.

```
ImmutableLog  (một cơ chế, năm dòng chảy)
├─ log_id · tenant_id · occurred_at (đồng hồ máy chủ, ⛔ không nhận từ client)
├─ stream: AUDIT | LEGAL_CONVERSATION | NOTIFICATION | AI_DECISION | QA_EVIDENCE
├─ actor_type · actor_id · on_behalf_of?   ← uỷ quyền · break-glass
├─ action · object_type · object_id
├─ 🔴 before_state_hash · after_state_hash
├─ 🔴 what_actor_saw   ← chụp lại thứ người đó NHÌN THẤY lúc quyết định
├─ evidence_refs[] · ip · device · session_id
├─ 🔴 prev_entry_hash  ← CHUỖI BĂM — sửa một dòng làm gãy cả chuỗi
└─ entry_hash
```

**Năm dòng chảy — cùng cơ chế, khác nội dung:**

| Dòng | Nguồn | Ghi gì | Lưu |
|---|---|---|---|
| `AUDIT` *(`BDR-14`)* | mọi ghi/duyệt/truy cập `RESTRICTED` | ai · lúc nào · làm gì · **thấy gì** | theo `LEGAL_RECORD` |
| 🔴 `LEGAL_CONVERSATION` *(`BDR-15`)* | `Thread` neo vào **PO · QA · Approval · ChangeRequest · CommercialDecision** | toàn bộ tin nhắn · đính kèm · ⛔ **không sửa, không xoá, không thu hồi** | theo `LEGAL_RECORD` |
| `NOTIFICATION` *(`BDR-16`)* | mọi thông báo | nội dung · người nhận · kênh · **đã mở chưa** | 3 năm |
| 🔴 `AI_DECISION` *(`BDR-17`)* | mọi tương tác AI | §10.5 | theo `LEGAL_RECORD` |
| 🔴 `QA_EVIDENCE` *(`BDR-09`)* | ảnh · video · báo cáo · nhận xét sau khi xác nhận | băm nội dung · người chụp · thiết bị · thời điểm | theo yêu cầu buyer, tối thiểu 3 năm |

### 🔴 Ba luật — và một giới hạn tôi phải nói thật

| # | Luật |
|---|---|
| `IM-1` | ⛔ **Không `UPDATE`, không `DELETE`** — trigger CSDL chặn, kiểm bằng `pg_trigger` ⛔ **không kiểm bằng ghi thử** |
| `IM-2` | 🔴 **Chuỗi băm** — mỗi bản ghi chứa băm của bản trước. Sửa một dòng ⇒ **gãy chuỗi, phát hiện được** |
| `IM-3` | 🔴 **Neo định kỳ** — mỗi ngày xuất một bản tóm tắt băm ra **ngoài CSDL** *(lưu trữ chỉ-ghi-thêm, hoặc gửi kiểm toán viên)* |

> ### ⚠️ Giới hạn kỹ thuật tôi ⛔ không được che
>
> **⛔ Không có giải pháp nào TRONG cơ sở dữ liệu chống được người có quyền quản trị cơ sở dữ liệu.** Ai có `superuser` Postgres đều tắt được trigger, sửa bảng, tính lại băm.
>
> Chuỗi băm làm cho việc sửa **PHÁT HIỆN ĐƯỢC**, ⛔ không phải **NGĂN ĐƯỢC**.
> **Neo ra ngoài** làm cho việc sửa **CHỨNG MINH ĐƯỢC** — vì bản tóm tắt hôm qua đã nằm ngoài tầm với.
>
> `DL-073` · Để Audit Log thật sự là **bằng chứng pháp lý** như `BDR-14` yêu cầu, **`IM-3` neo ra ngoài là BẮT BUỘC, ⛔ không phải tuỳ chọn.** Thiếu nó thì đó chỉ là một bảng ghi chép được tin cậy trong nội bộ.

### 🔴 Khi nào một hội thoại trở thành `LEGAL_CONVERSATION`

`BDR-15` liệt kê 5 loại. Nhưng một cuộc trò chuyện có thể bắt đầu vu vơ rồi thành cam kết thương mại.

```
DL-074 · LUẬT PHÂN LOẠI TỰ ĐỘNG
  Thread NEO vào PO · Inspection · ApprovalRequest · OrderChange · Quotation · Contract
      ⇒ 🔴 LEGAL_CONVERSATION NGAY TỪ TIN NHẮN ĐẦU TIÊN
  Thread ⛔ không neo vào đối tượng nào  ⇒ hội thoại thường (lưu 1 năm)
  🔴 Hội thoại thường được NÂNG LÊN legal khi ai đó neo nó vào một đối tượng
      ⇒ nâng lên có hiệu lực HỒI TỐ toàn bộ lịch sử, ⛔ không thể hạ xuống
```

> **Vì sao neo-thì-legal-ngay:** nếu chờ tới khi có *"quyết định thương mại"* mới bắt đầu lưu, thì phần hội thoại dẫn tới quyết định đó — **phần có giá trị chứng cứ nhất** — đã có thể bị xoá. `DL-061` *(chat neo vào đối tượng)* làm cho luật này thi hành được tự động.

## 10.5 🔴 `BDR-17` — NHẬT KÝ QUYẾT ĐỊNH AI

```
AIInteraction  (bất biến, chuỗi băm)
├─ interaction_id · tenant_id · occurred_at
├─ 🔴 acting_on_behalf_of_user   ← AI đọc bằng QUYỀN CỦA AI (luật AI-1)
├─ prompt_text · prompt_hash · prompt_template_version
├─ 🔴 context_refs[]  ← THAM CHIẾU + băm ảnh chụp, ⛔ KHÔNG PHẢI BẢN SAO
│     { object_type, object_id, as_of, snapshot_hash, disclosure_class }
├─ model_id · model_version · parameters · tokens
├─ recommendation · confidence · reasoning_summary
├─ 🔴 inherited_disclosure  ← mức CAO NHẤT trong context_refs (DL-072)
├─ presented_to · presented_at
├─ 🔴 human_decision: ACCEPTED | REJECTED | MODIFIED | IGNORED
├─ 🔴 decided_by · decided_at · modification_note
├─ 🔴 resulting_action_id   ← hành động nghiệp vụ THẬT sinh ra
└─ prev_entry_hash · entry_hash
```

> ### 🔴 `context_refs` lưu THAM CHIẾU, ⛔ không lưu BẢN SAO — ba lý do
>
> ① **Tránh nhân bản cơ sở dữ liệu** vào nhật ký AI — sau một năm nhật ký lớn hơn dữ liệu nghiệp vụ
> ② 🔴 **Tránh nhân bản dữ liệu MẬT ra ngoài ranh giới tiết lộ của nó** — nếu lưu bản sao chiết tính vào nhật ký AI, thì ai đọc được nhật ký sẽ đọc được chiết tính
> ③ **`snapshot_hash` vẫn chứng minh được** dữ liệu lúc đó là gì — đủ cho giải thích và truy vết
>
> `DL-075` · **Nhật ký AI lưu THAM CHIẾU + BĂM, ⛔ không lưu nội dung.** Giải thích được, truy vết được, ⛔ không tạo ra một bản sao mật thứ hai.

**Bốn luật AI — cưỡng chế**

| # | Luật |
|---|---|
| `AI-1` | 🔴 **AI đọc qua CÙNG lớp phân quyền với người đang hỏi.** ⛔ Không đường tắt `service_role`. AI ⛔ không được là kênh vượt RLS |
| `AI-2` | 🔴 **Mọi phát biểu trỏ được về bản ghi gốc.** ⛔ Không nguồn = ⛔ không hiện |
| `AI-3` | 🔴 **AI ⛔ không ghi vào bảng nghiệp vụ.** Nó điền biểu mẫu; **người bấm lưu** |
| `AI-4` | 🔴 **Kết quả AI kế thừa mức tiết lộ cao nhất trong ngữ cảnh** *(`DL-072`)* |

## 10.6 Phân tách nhiệm vụ — kiểm lúc CẤP, ⛔ không phải lúc DÙNG

```
SoDRule   (Master Data)
├─ rule_code · conflicting_roles[] · scope: GLOBAL | PER_OBJECT | PER_ORG
├─ severity: BLOCK | 🔴 WARN_AND_LOG      ← xem BDR-21
└─ mitigation_required: bool

Bộ khởi tạo:
  SOD-01  MaterialRequester    ⟷ ProcurementApprover   (người cần hàng ⛔ không duyệt tiền mua)
  SOD-02  ProcurementOfficer   ⟷ GoodsReceiver         (người mua ⛔ không xác nhận hàng về)
  SOD-03  Storekeeper          ⟷ WarehouseManager      (người đề xuất ⛔ không duyệt điều chỉnh)
  SOD-04  QCInspector          ⟷ QAManager             (người kiểm ⛔ không kết luận lô)
  SOD-05  người TRÌNH duyệt    ⟷ người DUYỆT           (mọi luồng duyệt)
  SOD-06  PriceApprover        ⟷ ProcurementApprover   🔴 ĐANG VI PHẠM tại Monica (GĐSX giữ cả hai)
```

> `DL-076` · **Kiểm SoD lúc CẤP Role, ⛔ không phải lúc thực hiện thao tác.**
> Kiểm lúc dùng thì người ta đã nhận việc rồi mới bị chặn — bực bội và ⛔ không sửa được gốc. Kiểm lúc cấp thì quản trị viên thấy xung đột **trước khi tạo ra nó**.
> ⚠️ `SOD-06` đang bị vi phạm ở Monica *(GĐSX duyệt cả giá bán lẫn giá mua)* — xem `BDR-21`.

## 10.7 Uỷ quyền · quyền khẩn cấp

```
Delegation
├─ from_person · to_person · capabilities[] · valid_from/to · reason
├─ 🔴 ⛔ KHÔNG uỷ quyền được: DataOwnership · quyền quản trị nền tảng
├─ ✅ Uỷ quyền được: ApprovalAuthority · DecisionAuthority thường ngày
└─ mọi thao tác dưới uỷ quyền ghi `on_behalf_of` trong Audit Log

BreakGlass   🔴 quyền khẩn cấp
├─ granted_to · reason (BẮT BUỘC, tự do) · valid_for: tối đa 4 giờ
├─ 🔴 THÔNG BÁO NGAY cho CEO + chủ sở hữu dữ liệu
├─ 🔴 mọi thao tác gắn cờ BREAK_GLASS trong Audit Log
└─ 🔴 rà soát bắt buộc trong 24 giờ
```

> `DL-077` · **Có quyền khẩn cấp, nhưng ỒN ÀO.** Hệ thống ⛔ không có đường thoát khẩn cấp thì lúc sự cố thật người ta sẽ **dùng chung tài khoản `superadmin`** — và khi đó ⛔ không còn dấu vết nào. Thà có một cửa có chuông báo động còn hơn có một cửa sau im lặng.

## 10.8 Hiệu năng — đánh giá quyền phải nhanh

Sáu chiều phạm vi × phân loại × tiết lộ ⇒ ⛔ không thể tính lại mỗi truy vấn.

```
Lúc đăng nhập → tính SessionScope một lần:
  tenant_id · legal_entity_ids[] · site_ids[] · warehouse_ids[]
  party_ids[] · assignment_ids[] · capabilities[] · disclosure_levels[]
       ▼
  RLS dùng SessionScope (biến phiên), ⛔ không join lại bảng phân quyền
       ▼
  🔴 Assignment đổi ⇒ HUỶ HIỆU LỰC phiên NGAY, ⛔ không chờ hết hạn
```

> `DL-078` · **Huỷ hiệu lực ngay khi phạm vi đổi.** Monica huỷ một Assignment thì nhà thầu **mất quyền xem ngay lập tức**, ⛔ không có thời gian ân hạn. Phạm vi tính sẵn mà ⛔ không huỷ được ngay là một lỗ hổng thời gian.

## 10.9 Kiểm thử phân quyền

| # | Luật |
|---|---|
| `PT-1` | 🔴 **Mỗi kịch bản có ít nhất MỘT vai CHỜ THẤY > 0** *(quy tắc K-3)* — bài kiểm toàn vai chờ-0 ⛔ không phân biệt *khoanh đúng* với *chặn hết* |
| `PT-2` | 🔴 **Bài kiểm rò chéo tenant** — dựng 2 tenant, khẳng định A ⛔ không thấy một dòng nào của B |
| `PT-3` | 🔴 **Bài kiểm hai đối tác** — 2 nhà thầu, 2 khách; ⛔ không ai thấy dữ liệu của ai |
| `PT-4` | 🔴 **Bài kiểm tương quan** — nhà thầu có 3 assignment từ 3 khách ⇒ ⛔ **không suy ra được danh tính khách nào** |
| `PT-5` | **Bài kiểm liệt kê phép chiếu** — mỗi phép chiếu chứa **đúng N trường**; thêm trường mà quên sửa bài kiểm ⇒ **hỏng** |
| `PT-6` | ⛔ **Bảng rỗng ⛔ không kết luận được** — bài kiểm tự dựng dữ liệu rồi dọn trong `finally` |

---
---

# §11 · KIỂM CHỨNG NGUYÊN TẮC ENTERPRISE

> Joseph: *"Nếu ngày mai triển khai cho 100 doanh nghiệp may khác nhau, kiến trúc này còn đúng không?"*
> Tôi kiểm bằng **5 doanh nghiệp mẫu có thật trong ngành** — ⛔ không kiểm bằng lời khẳng định.

## 11.1 Năm doanh nghiệp mẫu

| | **① Xưởng CMT nhỏ** | **② Monica** | **③ Nhà FOB lớn** | **④ Dệt–may tích hợp** | **⑤ Văn phòng nguồn hàng** |
|---|---|---|---|---|---|
| Quy mô | 150 CN · 4 chuyền · 1 nhà máy | 600 CN · 6 chuyền | 3.000 CN · 4 nhà máy · 2 nước | 5.000 · có nhà máy **dệt nhuộm** | 20 nhân viên · 🔴 **⛔ KHÔNG có nhà máy** |
| Mô hình | 100% CMT | 30 FOB / 70 CMT | 90% FOB | FOB tích hợp dọc | 100% thuê ngoài |
| IE · Planning · Procurement | ⛔ ⛔ ⛔ | ⚠️ kiêm | ✅ ✅ ✅ | ✅ ✅ ✅ | ⛔ ⚠️ ✅ |
| Thuê ngoài | ⛔ không | ✅ nhiều | ⚠️ ít | ⛔ không | 🔴 **100%** |

## 11.2 Kết quả kiểm chứng

| Thành phần kiến trúc | ① | ② | ③ | ④ | ⑤ | Kết luận |
|---|---|---|---|---|---|---|
| **14 Domain + Activation Model** | 9 bật | 14 bật | 14 bật | 14 bật | 🔴 **10 bật, Manufacturing DORMANT** | ✅ **giữ** |
| **Party một bản ghi, role thuộc tính** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`WorkCenter` có `ownership`** | INTERNAL | cả hai | INTERNAL | INTERNAL | 🔴 **100% SUBCONTRACTED** | ✅ **giữ được vì có `ownership`** |
| **`ProcessRoute` là dữ liệu chủ** | 1 mẫu | 4 mẫu | 12 mẫu | 🔴 **cần công đoạn DỆT·NHUỘM** | 4 mẫu | ⚠️ **xem §11.3** |
| **Workflow 4 nguyên mẫu** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Rule Engine DSL + vị từ** | ✅ | ✅ | ✅ | ⚠️ cần vị từ mới | ✅ | ✅ **mở rộng bằng vị từ** |
| **6 chiều phạm vi** | 3 dùng | 5 dùng | **6 dùng** | 6 dùng | 4 dùng | ✅ |
| **5 loại dữ liệu** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **3 Portal độc lập** | 🔴 **chỉ Customer** | cả 3 | 2 *(ít subcon)* | Customer + Supplier | 🔴 **Subcontract là CHÍNH** | ✅ **độc lập nên bật/tắt được** |
| 🔴 **SoD nghiêm ngặt** | 🔴 **⛔ KHÔNG THỂ** — 1 người 6 vai | ⚠️ vi phạm `SOD-06` | ✅ | ✅ | ⚠️ | 🔴 **→ `BDR-21`** |
| **Multi-currency 3 tầng** | 1 tiền tệ | 2 | 🔴 **3 + hợp nhất** | 3 | 2 | ✅ |
| **Đa thuê bao** | dùng chung | dùng chung | 🔴 **có thể đòi Dedicated** | Dedicated | dùng chung | ✅ **`DL-058`** |

## 11.3 🔴 MỘT CHỖ KIẾN TRÚC **KHÔNG ĐÚNG** — tôi phải nói ra

**Doanh nghiệp ④ · Dệt–may tích hợp dọc — kiến trúc hiện tại ⛔ KHÔNG phủ được.**

| Vấn đề | Vì sao ⛔ không phủ được |
|---|---|
| **Sản xuất vải** *(sợi → dệt → nhuộm → hoàn tất)* | Đây là **biến đổi vật chất liên tục**, ⛔ không phải lắp ráp rời rạc. BOM của Monica ONE là **cấu trúc lắp ráp** *(n chi tiết → 1 sản phẩm)*; dệt nhuộm là **công thức** *(x kg sợi + y kg thuốc nhuộm → z mét vải, có tỷ lệ hao hụt phi tuyến)* |
| **Đơn vị đo đổi giữa chừng** | sợi tính **kg** → vải mộc tính **mét** → vải thành phẩm tính **mét khác** *(co rút sau nhuộm)*. `UOMConversion` gắn `Material` ⛔ không mô tả được **biến đổi trong quá trình** |
| **Đồng nhất lô nhuộm** | `ShadeGroup` mô hình hoá **kết quả**, ⛔ không mô hình hoá **quá trình tạo ra dải màu** |

> ### 🔴 Kết luận trung thực
>
> **Monica ONE phủ được ~85% thị trường may mặc** *(CMT · FOB · OEM · ODM · văn phòng nguồn hàng · đa nhà máy · đa quốc gia)*, và **⛔ KHÔNG phủ được doanh nghiệp dệt–may tích hợp dọc** nếu ⛔ không thêm một Domain mới.
>
> `DL-079` · **⛔ KHÔNG cố mở rộng `ProcessRoute` và `BOM` để nhét sản xuất vải vào.** Làm thế sẽ:
> ① Làm phức tạp mô hình cho **100% khách hàng** để phục vụ **~5%**
> ② Vẫn ⛔ không đúng — sản xuất theo công thức cần `Formula` và `ProcessOrder`, ⛔ không phải `BOM` và `ProductionOrder`
>
> **Cách đúng:** ⏳ **`D15 Textile Manufacturing`** là một Domain DORMANT, mô hình hoá riêng khi có khách hàng thật. Chừa đường ngay: `Material` phải phân biệt được `SOURCED` ⟷ `MANUFACTURED_IN_HOUSE`.
>
> Đây là **giới hạn có tên**, ⛔ không phải một lỗ hổng im lặng — và tôi nêu ra vì Board yêu cầu trả lời thật câu hỏi *"còn đúng hay không"*.

## 11.4 Chỗ kiến trúc **đúng ngoài mong đợi**

**Doanh nghiệp ⑤ · Văn phòng nguồn hàng — 100% thuê ngoài, ⛔ không có nhà máy.**

Đây là phép thử khắc nghiệt nhất, và kiến trúc **giữ được**:

| Cơ chế | Vì sao giữ được |
|---|---|
| `WorkCenter.ownership = SUBCONTRACTED` | 🔴 100% WorkCenter thuộc nhà thầu — **⛔ không cần một dòng mã đặc biệt nào** *(`DL-031`)* |
| Domain Activation | Manufacturing ⚪ DORMANT · Subcontract 🟢 ACTIVE · Warehouse 🟡 EMBEDDED |
| Line Map | 🔴 **Hiện được toàn bộ dòng chảy dù ⛔ không sở hữu một chuyền nào** — vì `FlowStage` ⛔ không quan tâm ai sở hữu |
| Subcontract Portal | Từ *"kênh phụ"* thành **giao diện vận hành chính** — và nó **độc lập** nên làm được điều đó *(`DL-062`)* |

> 🔴 **Đây là bằng chứng mạnh nhất cho quyết định của Joseph ở EDD-03A.** Nếu Subcontract Portal chỉ là *"một cấu hình của Customer Portal"* như tôi từng đề xuất, thì với doanh nghiệp ⑤ **cấu hình phụ lại là sản phẩm chính** — và kiến trúc sẽ sai ngay từ tiền đề.

---

# §12 · DECISION LOG — 13 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-067` | 🔴 **Guard luôn là `RuleRef`**, ⛔ không phải biểu thức tại chỗ | Cùng điều kiện xuất hiện ở guard · tín hiệu · Work Inbox — viết 3 lần ⇒ 3 chỗ lệch | ⚠️ |
| `DL-068` | **Thể hiện gắn chặt phiên bản định nghĩa lúc khởi tạo** | Đổi luật giữa chừng ⛔ không được làm gãy đơn đang sản xuất | ⚠️ |
| `DL-069` | **MỘT sổ đăng ký, BẢY bộ đánh giá** | *"Tập trung"* = một nơi tra cứu/kiểm thử/kiểm toán, ⛔ không phải một cơ chế cho 7 bài toán | ✅ |
| `DL-070` | 🔴 **⛔ KHÔNG BAO GIỜ thực thi mã tự do do người dùng nhập** | Đa thuê bao: mã của A chạy trên máy chủ chung = **thực thi mã từ xa** | 🔴 rất khó |
| `DL-071` | **Phát hiện quy tắc mâu thuẫn lúc ĐỊNH NGHĨA** | Phát hiện lúc chạy = đơn hàng thật kẹt vào lúc tệ nhất | ✅ |
| `DL-072` | 🔴 **Dữ liệu AI KẾ THỪA mức tiết lộ cao nhất trong ngữ cảnh** | *"Đơn này có nguy cơ lỗ"* **suy ra được biên lợi nhuận** | ⚠️ |
| `DL-073` | 🔴 **Neo băm ra NGOÀI CSDL là BẮT BUỘC** để Audit Log là bằng chứng pháp lý | ⛔ Không giải pháp trong CSDL nào chống được quản trị viên CSDL | ⚠️ |
| `DL-074` | **Thread neo vào 6 loại đối tượng ⇒ `LEGAL_CONVERSATION` NGAY**, nâng lên có hiệu lực hồi tố, ⛔ không hạ xuống | Chờ tới lúc có *"quyết định thương mại"* thì phần có giá trị chứng cứ nhất đã có thể bị xoá | ✅ |
| `DL-075` | 🔴 **Nhật ký AI lưu THAM CHIẾU + BĂM, ⛔ không lưu nội dung** | Tránh nhân bản CSDL **và** tránh nhân bản dữ liệu mật ra ngoài ranh giới tiết lộ | ⚠️ |
| `DL-076` | **Kiểm SoD lúc CẤP Role, ⛔ không phải lúc dùng** | Kiểm lúc dùng ⇒ người ta đã nhận việc rồi mới bị chặn | ✅ |
| `DL-077` | **Có quyền khẩn cấp, nhưng ỒN ÀO** — 4 giờ · báo CEO ngay · rà soát 24h | ⛔ Không có cửa khẩn cấp ⇒ người ta dùng chung `superadmin` ⇒ ⛔ không còn dấu vết | ✅ |
| `DL-078` | **Huỷ hiệu lực phiên NGAY khi phạm vi đổi** | Assignment huỷ ⇒ mất quyền tức thì, ⛔ không ân hạn | ✅ |
| `DL-079` | 🔴 **⛔ KHÔNG nhét sản xuất vải vào `BOM`/`ProcessRoute`** — `D15 Textile` là Domain DORMANT riêng | Làm phức tạp mô hình cho 100% khách để phục vụ ~5%, **và vẫn sai** | ⚠️ |
| `DL-080` | **`M69 LanguagePolicy` · `M70 DataCategoryPolicy` · `M71 BenchmarkEligibility`** là dữ liệu chủ | `BDR-10` · `13` · `11` | ✅ |
| `DL-081` | **Benchmark tách vật lý khỏi read-model vận hành · ngưỡng ≥7 doanh nghiệp · danh sách trường cấm tuyệt đối** | `BDR-11` | ✅ |
| `DL-082` | **`PARTNER_DATA` là loại dữ liệu thứ năm** *(mở rộng 4 loại Board bắt buộc)* | Báo cáo ngày nhà thầu là **dữ liệu của họ**, khác `MONICA_DATA` khi chấm dứt quan hệ | ✅ |

**Cộng dồn EDD-01 → 04: 82 quyết định.**

---

# §13 · BOARD DECISION REQUIRED — 5

> Hai câu đầu **mang tiếp từ EDD-03A**, chưa được trả lời do trùng số hiệu.

---

## `BDR-18` *(cũ: EDD-03A BDR-14)* · NHÀ THẦU DÙNG CHUNG GIỮA NHIỀU DOANH NGHIỆP

**Vấn đề.** Một xưởng gia công nhận việc từ **Monica** và từ **một doanh nghiệp khác cũng dùng Monica ONE**. Một tài khoản hay hai?

| | **A · Một tài khoản mỗi tenant** | **B · Một danh tính, nhiều tenant** |
|---|---|---|
| Ưu | Cô lập tuyệt đối · dễ giải thích | 🔴 **Hiệu ứng mạng phía cung** — xưởng dùng cho 3 khách sẽ đề nghị khách thứ 4 dùng Monica ONE |
| Nhược | Nhà thầu ghét — 2 mật khẩu, 2 nơi nhập báo cáo ngày | 🔴 Cô lập sai một chỗ ⇒ **lộ dữ liệu chéo DOANH NGHIỆP** |
| Với 100 khách | Công cụ nội bộ từng nhà máy | 🔴 **Hạ tầng của một mạng lưới sản xuất** |

> **Khuyến nghị: B với ba ràng buộc cứng** — danh tính chung, dữ liệu cô lập tuyệt đối · chuyển tenant là hành động tường minh, ⛔ không bao giờ hiện hai tenant cùng màn hình · bài kiểm rò chéo qua danh tính chung chạy mỗi vòng.

**🔲 Board chọn: A · B-ba-ràng-buộc**

---

## `BDR-19` *(cũ: EDD-03A BDR-15)* · CHI PHÍ HẠ TẦNG CỔNG ĐỐI TÁC

**Vấn đề.** Hai cổng bắt buộc v1, Subcontract Portal là hệ thống trọng yếu vận hành. Ai trả chi phí dự phòng, giám sát, tài khoản đối tác?

> **Khuyến nghị: Monica chịu, NHƯNG THIẾT KẾ ĐO ĐẠC ngay từ v1** — đếm tài khoản đối tác hoạt động, dung lượng, lượt gọi theo tenant. ⛔ Không tính tiền, chỉ **đo**. Khi thương mại hoá, mô hình giá dựa trên số liệu thật thay vì phỏng đoán. Chi phí thiết kế đo đạc ngay ≈ 0; thêm sau phải rà lại toàn bộ để biết đo cái gì.

**🔲 Board chọn: A-có-đo-đạc · A-không-đo · B-tính-vào-giá**

---

## `BDR-20` · AI ĐƯỢC QUYỀN VIẾT WORKFLOW VÀ RULE KHÔNG?

**Vấn đề.** Workflow và Rule là **dữ liệu**, ⛔ không phải mã. Vậy **ai được sửa chúng cho một doanh nghiệp**? Đây quyết định **mô hình sản phẩm, mô hình hỗ trợ và mô hình giá**.

| | **A · Chỉ Monica ONE sửa** *(cấu hình có kiểm soát)* | **B · Doanh nghiệp tự sửa** *(tự phục vụ)* | **C · Lai — phân tầng** |
|---|---|---|---|
| Ai sửa | đội triển khai Monica ONE | quản trị viên của doanh nghiệp | 🔴 **Tham số** → doanh nghiệp · **Cấu trúc** → Monica ONE |
| Ưu | Chất lượng bảo đảm · test case đầy đủ · ⛔ không ai tự bắn vào chân | Doanh nghiệp linh hoạt · ⛔ không chờ nhà cung cấp · chi phí hỗ trợ thấp | Cân bằng: sửa ngưỡng và mẫu lịch tự do; đổi trạng thái và cổng thì có kiểm soát |
| Nhược | 🔴 **⛔ Không mở rộng được cho 100 khách** — mỗi thay đổi nhỏ là một yêu cầu hỗ trợ | 🔴 **Doanh nghiệp tự tạo workflow hỏng**, rồi gọi hỗ trợ · rủi ro dữ liệu | Cần phân định rõ đâu là tham số, đâu là cấu trúc |
| Với Monica | Đúng hôm nay — một khách hàng | Chưa cần | Đúng cả hai giai đoạn |
| Với 100 khách | 🔴 **Cổ chai chết người** | 🔴 Chi phí hỗ trợ do khách tự làm hỏng | ✅ |

> **Khuyến nghị: PHƯƠNG ÁN C**, phân định như sau:
>
> | 🟢 Doanh nghiệp tự sửa | 🔴 Chỉ Monica ONE sửa |
> |---|---|
> | Ngưỡng · giá trị · % · SLA | Tập trạng thái và **phép chuyển hợp lệ** |
> | Mẫu lịch T&A · chặng kiểm | Guard của **cổng CỨNG** |
> | Ai giữ Role nào | **Luật phân tách nhiệm vụ** |
> | Luật sinh việc Work Inbox | Ranh giới bảo mật cổng đối tác |
> | Nhãn hiển thị · ngôn ngữ | **Vị từ có tên** trong Rule Engine |
>
> Ranh giới này **đã được chốt từ EDD-01 §1.3.1** *(bất biến ⟷ cấu hình được)*. `BDR-20` chỉ hỏi: **ai cầm chìa khoá phần cấu hình được**.
>
> ⚠️ **Kèm điều kiện bắt buộc:** doanh nghiệp sửa workflow/rule thì `WF-6` và `RL-2` vẫn áp — **⛔ không `ACTIVE` nếu chưa có test case đạt**. Đây là thứ ngăn họ tự bắn vào chân.

**🔲 Board chọn: A · B · C-phân-tầng**

---

## `BDR-21` · PHÂN TÁCH NHIỆM VỤ — CHẶN CỨNG HAY CẢNH BÁO?

**Vấn đề.** `SOD-06` *(người duyệt giá bán ⟷ người duyệt giá mua)* **đang bị vi phạm tại Monica** — GĐSX giữ cả hai. Với xưởng CMT 150 công nhân *(doanh nghiệp mẫu ①)*, **một người giữ sáu vai** là chuyện bình thường và ⛔ không tránh được.

| | **A · Chặn cứng** | **B · Cảnh báo + ghi nhật ký + bù đắp** |
|---|---|---|
| Cách làm | ⛔ Không cấp được hai Role xung đột. Chấm hết | Cấp được, nhưng: cảnh báo lúc cấp · ghi Audit Log · **bắt buộc khai biện pháp bù đắp** · báo cáo tháng liệt kê mọi xung đột đang tồn tại |
| Ưu | Kiểm soát nội bộ đúng sách · rõ ràng | 🔴 **Doanh nghiệp nhỏ dùng được sản phẩm** · Monica dùng được **ngay hôm nay** · xung đột **nhìn thấy được** thay vì bị giấu |
| Nhược | 🔴 **Xưởng 150 công nhân ⛔ KHÔNG THỂ dùng Monica ONE** · Monica hôm nay cũng ⛔ không dùng được | Kiểm soát yếu hơn · phụ thuộc kỷ luật |
| Với Monica | 🔴 **⛔ Không triển khai được** — phải tuyển thêm người trước | ✅ Dùng được ngay, và **GĐSX biết mình đang giữ hai vai xung đột** |
| Với 100 khách | 🔴 **Loại bỏ toàn bộ phân khúc doanh nghiệp nhỏ và vừa** | ✅ Phủ mọi quy mô |

> **Khuyến nghị: PHƯƠNG ÁN B, với ba ràng buộc — và một ngoại lệ cứng.**
>
> ① **Cảnh báo lúc CẤP Role**, ⛔ không phải lúc dùng · ② **Bắt buộc khai biện pháp bù đắp** *(ví dụ: "CEO rà soát báo cáo duyệt giá hằng tháng")* · ③ **Báo cáo tháng liệt kê mọi xung đột đang tồn tại**, gửi CEO
>
> 🔴 **Ngoại lệ CHẶN CỨNG — 3 quy tắc ⛔ không bao giờ cảnh báo suông:**
> - `SOD-05` người **TRÌNH** duyệt ⟷ người **DUYỆT** cùng một chứng từ *(tự duyệt chính mình)*
> - `SOD-03` người **đề xuất** điều chỉnh tồn ⟷ người **duyệt** *(dễ lạm dụng nhất trong kho)*
> - `SOD-04` người **kiểm** ⟷ người **kết luận** lô AQL *(tự chấm điểm hàng mình làm)*
>
> Ba cái này ⛔ **không thể bù đắp bằng rà soát sau** — vì hành vi và hậu quả xảy ra cùng lúc.
>
> ⚠️ **Đây là quyết định xác định Monica ONE bán được cho phân khúc nào**, ⛔ không phải một tuỳ chọn kỹ thuật.

**🔲 Board chọn: A · B-với-3-ngoại-lệ-cứng · B-toàn-bộ**

---

## `BDR-22` · NHẬT KÝ AI ⟷ DỮ LIỆU MẬT — MÂU THUẪN GIỮA HAI QUYẾT ĐỊNH ĐÃ DUYỆT

**Vấn đề.** `BDR-17` yêu cầu lưu **prompt + context** của mọi tương tác AI. Lớp `RESTRICTED` cấm phần lớn nhân viên xem chiết tính và biên lợi nhuận. **Hai điều này va nhau:** nếu AI đọc chiết tính để cảnh báo nguy cơ lỗ, thì nhật ký AI chứa dấu vết dữ liệu `RESTRICTED` — và **ai kiểm toán nhật ký sẽ thấy nó**.

| | **A · Nhật ký AI kế thừa mức tiết lộ cao nhất** *(`DL-072`)* | **B · Nhật ký AI luôn là `LEGAL_RECORD`, chỉ kiểm toán viên xem** |
|---|---|---|
| Cách làm | Nhật ký của tương tác chạm `RESTRICTED` ⇒ **chỉ Role `RESTRICTED` đọc được** | Mọi nhật ký AI thuộc một lớp riêng; **chỉ CEO + kiểm toán viên nội bộ** đọc được, bất kể nội dung |
| Ưu | Nhất quán với mô hình tiết lộ · ⛔ không tạo lớp mới | 🔴 **Đơn giản, ⛔ không rò** · thoả `BDR-17` triệt để · **kiểm toán được toàn bộ hoạt động AI ở một chỗ** |
| Nhược | 🔴 **Nhật ký AI bị phân mảnh** theo mức tiết lộ ⇒ ⛔ không kiểm toán được toàn bộ hoạt động AI ở một chỗ — đúng thứ `BDR-17` muốn | Tạo một lớp truy cập rất hẹp · phải tin kiểm toán viên |
| Với 100 khách | Mỗi tenant tự quản, phức tạp | ✅ Vai kiểm toán viên chuẩn hoá được |

> **Khuyến nghị: PHƯƠNG ÁN B**, với `DL-075` giữ nguyên.
>
> Lý do: `DL-075` đã bảo đảm nhật ký AI lưu **tham chiếu + băm, ⛔ không lưu nội dung**. Nghĩa là nhật ký chứa *"đã đọc `Costing` CST-114 lúc 14:02, băm abc123"* — ⛔ **không chứa con số biên lợi nhuận**.
>
> Rủi ro còn lại là **suy luận từ siêu dữ liệu** *(biết AI đọc chiết tính nào, vào lúc nào)*. Rủi ro đó nhỏ và **kiểm soát được bằng cách thu hẹp người đọc nhật ký**, thay vì phân mảnh nhật ký ra sáu mức và mất khả năng kiểm toán tổng thể.
>
> ⚠️ **Chỗ tôi có thể sai:** nếu Board coi *"ai đọc chiết tính nào lúc nào"* là thông tin nhạy cảm ngang chính chiết tính, thì A đúng và ta chấp nhận mất khả năng kiểm toán AI tập trung.

**🔲 Board chọn: A · B · B-khác**

---

# §14 · SPRINT SUMMARY

## 14.1 Đã bàn giao

| Phase | Nội dung | Khối lượng |
|---|---|---|
| **8 · Workflow** | **4 nguyên mẫu** *(Lifecycle · Approval · Orchestration · Case)* · mô hình định nghĩa · **7 luật** · 4 workflow cốt lõi · ranh giới với Rule · phiên bản khi đang chạy |
| **9 · Rule** | **7 loại quy tắc** · mô hình · **ngôn ngữ điều kiện lai** · bộ quy tắc FOB/CMT · giải quyết xung đột · 3 bộ quy tắc mới từ Board · **6 luật** |
| **10 · Permission** | Mô hình hình thức · **6 khái niệm** · 🔴 **5 loại dữ liệu (`BDR-13`)** · 🔴 **kiến trúc bản ghi bất biến (5 dòng chảy)** · 🔴 **nhật ký quyết định AI** · SoD · uỷ quyền · quyền khẩn cấp · hiệu năng · **6 luật kiểm thử** |
| **11 · Kiểm chứng** | 🔴 **5 doanh nghiệp mẫu** — kết quả: phủ ~85% thị trường, **tìm ra 1 chỗ kiến trúc KHÔNG đúng** |

**Quyết định tự ra:** 16 *(cộng dồn 82)* · **Cần Board quyết:** 5 · **Câu hỏi mở:** 0

## 14.2 Ba điểm đáng nhớ nhất

| # | Điểm |
|---|---|
| **1** | 🔴 **⛔ Không có MỘT loại workflow.** Bốn nguyên mẫu, bốn cơ chế. Quan trọng nhất: **CAPA và tranh chấp là CASE, ⛔ không phải máy trạng thái** — ép chúng vào trình tự cố định tạo ra **tuân thủ giả**: người dùng bấm qua các bước để hệ thống cho đi tiếp, ⛔ không phải vì công việc thật đã xong |
| **2** | 🔴 **Kiến trúc ⛔ KHÔNG đúng với doanh nghiệp dệt–may tích hợp dọc.** Sản xuất vải là **biến đổi theo công thức**, ⛔ không phải lắp ráp theo BOM. Tôi **⛔ không nhét nó vào** — làm thế sẽ phức tạp hoá mô hình cho 100% khách để phục vụ ~5%, **và vẫn sai**. Đây là **giới hạn có tên**, ⛔ không phải lỗ hổng im lặng |
| **3** | 🔴 **Doanh nghiệp mẫu ⑤ *(văn phòng nguồn hàng, 100% thuê ngoài)* là bằng chứng mạnh nhất cho quyết định của Joseph ở EDD-03A.** Nếu Subcontract Portal chỉ là *"một cấu hình của Customer Portal"* như tôi từng đề xuất, thì với doanh nghiệp này **cấu hình phụ lại là sản phẩm chính** — kiến trúc sai ngay từ tiền đề |

## 14.3 Lộ trình còn lại

| Sprint | Deliverable | Phase | Nội dung |
|---|---|---|---|
| ✅ 1–4 | EDD-01 · 02 · 03 · 03A · **04** | 1–10 | Business → Permission |
| 5 | EDD-05 | 11 · 12 | Workspace · Work Inbox · Dashboard · Executive Center · **Module Architecture** |
| 6 | EDD-06 | — | Hợp nhất · rà mâu thuẫn toàn bộ 82 quyết định · **hồ sơ Board ký** |
| → | | | 🔓 **Board ký ⇒ mở khoá Implementation** |

## 14.4 Trạng thái

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

---

## THAM CHIẾU

- **Board Decision EDD-03 Review** — `BDR-09` … `BDR-17`
- **Board Working Principle v2.0** · **Enterprise Principle** *(kiểm chứng 100 doanh nghiệp)*
- [EDD-01](EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) · [EDD-02](EDD-02-MASTER-DATA-BUSINESS-OBJECT.md) · [EDD-03](EDD-03-DOCUMENT-INFORMATION-ARCHITECTURE.md) · [EDD-03A](EDD-03A-PARTNER-PORTAL-ARCHITECTURE.md)
- [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) v1.5 — Điều 8 · 12 · 31 · 39 · 40 · 45
- [`ENGINEERING_PLAYBOOK.md`](../ENGINEERING_PLAYBOOK.md) Điều XXX — phân quyền theo Assignment
- [`tests/README.md`](../../tests/README.md) — K-1 · K-2 · K-3 · V.1
