# EDD-03 · ENTERPRISE DESIGN DOCUMENT
## Phase 6 · Document Architecture  ·  Phase 7 · Information Architecture

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-03 |
| **Sprint** | Enterprise Business Design · Sprint 3 |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Trạng thái** | ⏳ **CHỜ PHÊ DUYỆT** |
| **Tiền đề** | [EDD-01](EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) ✅ · [EDD-02](EDD-02-MASTER-DATA-BUSINESS-OBJECT.md) ✅ **APPROVED** |
| **Chỉ thị nền** | 🔴 **Monica ONE là NỀN TẢNG CỘNG TÁC** — 7 bên, một nguồn dữ liệu, mỗi bên chỉ thấy phần của mình |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §0 · QUYẾT ĐỊNH BOARD ĐÃ HẤP THỤ

| BDR | Quyết định | Tác động lên EDD-03 |
|---|---|---|
| **01** | Multi-tenant từ đầu · Single/Multi/Dedicated · Cloud + On-premise | 🔴 **`tenant_id` là chiều phạm vi thứ SÁU** — §7.3 · §7.8 |
| **02** | IP Ownership là **Master Data**, ≥4 giá trị | 🆕 `M66 IPOwnershipModel` — §0.1 |
| **03·04** | **Customer Portal bắt buộc v1** · Read·Comment·Chat·Request, ⛔ không Update/Delete/Approve | 🔴 **Định hình toàn bộ Phase 7** — §7.4 · §7.11 |
| **05** | Hai tầng lợi nhuận — Contribution Margin + Full Cost | Hai read-model song song — §7.7 |
| **06** | 🔴 **Một Party · một số hiệu · một bản ghi gốc. Role là THUỘC TÍNH** | ⚠️ **Sửa mô hình EDD-02** — §0.2 |
| **07** | Material Ownership **không hard-code** — theo Contract · OrderType · Business Rule | 🆕 `M67 OwnershipPolicy` — §0.3 |
| **08** | Multi-currency — **tôi tự thiết kế** | §0.4 |

## 0.1 `BDR-02` → Mô hình sở hữu trí tuệ

```
M66 · IPOwnershipModel   (T1 · Master Data · 🔤 nhãn 3 ngôn ngữ)
├─ code · label_i18n · description
├─ monica_may_reuse: bool          ← Monica dùng lại cho khách khác?
├─ customer_may_take_away: bool    ← Khách mang rập/định mức sang xưởng khác?
├─ requires_royalty: bool
├─ requires_written_consent: bool
└─ default_retention_on_termination: RETURN | ARCHIVE | PURGE

Bộ khởi tạo — 5 giá trị:
  CUSTOMER_OWNED   khách sở hữu · Monica ⛔ không dùng lại · trả/lưu trữ khi chấm dứt
  MONICA_OWNED     Monica sở hữu · khách ⛔ không mang đi
  JOINT            đồng sở hữu   · cả hai cần văn bản đồng ý
  LICENSED         khách cấp phép có thời hạn · có thể có phí bản quyền
  PUBLIC_DOMAIN    mẫu cơ bản, không ai độc quyền
```

`Style` và `TechPack` mang `ip_ownership_code` → `M66`. ⛔ **Không cột boolean cứng nào.**
`Contract` khai `default_ip_ownership`; `Style` kế thừa, **ghi đè được từng mã hàng**.

> `DL-044` · **Sở hữu trí tuệ là dữ liệu chủ có luật đi kèm, không phải một nhãn.** Ba cột boolean *(`monica_may_reuse` · `customer_may_take_away` · `requires_written_consent`)* biến nó từ **phân loại** thành **quy tắc thi hành được** — hệ thống chặn được việc gán một Style `CUSTOMER_OWNED` sang khách khác.

## 0.2 `BDR-06` → Sửa mô hình `Party` — ghi nhận và điều chỉnh

Joseph: *"Một Party. Một Party Number. Một Master Record. Role chỉ là thuộc tính, không phải thực thể độc lập."*

⚠️ **EDD-02 §4.5 khai `M02 PartyRole` như một thực thể riêng. Tôi sửa lại.**

```
❌ EDD-02 (sai theo chỉ thị)          ✅ EDD-03 (đúng chỉ thị)
Party ──1:n──▶ PartyRole (thực thể)   Party  ← MỘT bản ghi gốc DUY NHẤT
                                       ├─ party_number   🔴 MỘT SỐ HIỆU, dùng ở mọi vai
                                       ├─ roles: SET<RoleCode>  ← THUỘC TÍNH, nhiều giá trị
                                       └─ Facet  ← thuộc tính RIÊNG theo vai, cùng bản ghi gốc
```

**Vấn đề thật phải giải quyết trung thực:** vai `CUSTOMER` cần *hạn mức tín dụng*; vai `SUPPLIER` cần *thời gian giao chuẩn*; vai `SUBCONTRACTOR` cần *năng lực chuyền*. Ba nhóm thuộc tính khác nhau — chúng phải nằm ở đâu?

```
Party (bản ghi gốc duy nhất)
├─ party_number  ✅ MỘT · tax_id · legal_name · country · status
├─ roles: {CUSTOMER, SUPPLIER, SUBCONTRACTOR}     ← thuộc tính đa trị
└─ facets:                                        ← KHÔNG phải master record riêng
     CustomerFacet     hạn mức · điều kiện thanh toán · nhóm khách · IP mặc định
     SupplierFacet     thời gian giao · nhóm hàng · điều kiện thanh toán
     SubcontractorFacet WorkCenter sở hữu · năng lực · đơn giá gia công
     CarrierFacet      tuyến · dịch vụ
```

> `DL-045` · **`Facet` không phải thực thể chủ — nó là nhóm thuộc tính có điều kiện của cùng một bản ghi gốc.**
>
> Ba hệ quả kiểm chứng được, đúng tinh thần Joseph:
> ① **Một `party_number`** dùng trên PO mua, trên Assignment, trên hoá đơn bán — **không bao giờ hai mã**
> ② **Một địa chỉ, một tài khoản ngân hàng, một mã số thuế** — sửa một chỗ, đúng mọi nơi
> ③ **Công nợ bù trừ được** — ta nợ họ 50k *(vai supplier)*, họ nợ ta 30k *(vai customer)* ⇒ **một bảng cân đối**
>
> ⚠️ Nếu Board muốn tuyệt đối không có bảng phụ nào, giải pháp thay thế là **một cột `attributes JSONB`** trên `Party`. Tôi ⛔ **không chọn** vì mất kiểm tra kiểu và mất ràng buộc CSDL trên những trường có tiền *(hạn mức tín dụng)*. Facet giữ đúng nguyên tắc *"một bản ghi gốc"* mà không hy sinh toàn vẹn dữ liệu.

## 0.3 `BDR-07` → Chính sách sở hữu vật tư điều khiển bằng luật

```
M67 · OwnershipPolicy   (T1/T2 · Master Data)
├─ policy_code · priority              ← luật ưu tiên cao chạy trước
├─ Điều kiện (bất kỳ tổ hợp nào):
│    contract_id? · order_type? · customer_id? · material_category?
│    incoterm? · site_id?
├─ → resulting_ownership: MONICA_OWNED | CUSTOMER_SUPPLIED
│                       | CUSTOMER_NOMINATED | THIRD_PARTY_CONSIGNED
└─ is_overridable_by_role: RoleCode?   ← ai được ghi đè thủ công

Bộ khởi tạo:
  P10  order_type = FOB                        → MONICA_OWNED
  P20  order_type = CMT                        → CUSTOMER_SUPPLIED
  P30  order_type = CMT ∧ category = PACKAGING → MONICA_OWNED   ← thùng, túi PE
  P40  order_type = CMT ∧ category = CONSUMABLE→ MONICA_OWNED   ← chỉ, kim
  P50  contract.nominated_supplier = true      → CUSTOMER_NOMINATED
```

> `DL-046` · **Quyết định sở hữu vật tư là một PHÉP TRA LUẬT, không phải một cột.**
> Luật chạy theo `priority`, kết quả điền sẵn vào từng dòng `OrderMaterialPlan`, người dùng ghi đè được nếu Role cho phép. Doanh nghiệp khác thêm luật riêng *(ví dụ: khách A luôn cấp nhãn dệt)* mà ⛔ **không sửa một dòng mã**.
> Đây cũng là mảnh ghép đầu tiên của **Rule Engine** ở Phase 9.

## 0.4 `BDR-08` → Thiết kế đa tiền tệ *(tôi tự quyết)*

📚 Chuẩn Enterprise ERP là **ba tầng tiền tệ**. Monica cần đủ ba vì: doanh thu **USD**, chi phí **VND**, và thương mại hoá đa quốc gia cần hợp nhất.

| Tầng | Là gì | Ví dụ Monica |
|---|---|---|
| **TC · Transaction** | Tiền tệ của **chứng từ** | Đơn hàng USD · PO mua vải VND · phí gia công VND |
| **FC · Functional** | Tiền tệ sổ sách của **`LegalEntity`** | **VND** — khớp MISA |
| **GC · Group** | Tiền tệ hợp nhất của **`Tenant`** | VND *(Monica)* · USD *(tập đoàn đa quốc gia)* |

**Bốn quyết định thiết kế:**

| # | Quyết định | Lý do |
|---|---|---|
| `DL-047` | 🔴 **Lưu số tiền ở CẢ BA tiền tệ tại thời điểm ghi sổ** | ⚠️ Đây **có vẻ** vi phạm *"không lưu dữ liệu tính được"*. Nhưng **tỷ giá tại thời điểm đó là một SỰ KIỆN, không phải một phép tính** — tính lại sau sẽ ra số khác. Cùng lập luận với `approval_snapshot` (`DL-041`) |
| `DL-048` | **Bốn loại tỷ giá:** `SPOT` · `MONTHLY_AVG` · `CONTRACT_FIXED` · `BUDGET` | `CONTRACT_FIXED` là thứ ngành may cần — hợp đồng chốt tỷ giá để phòng rủi ro |
| `DL-049` | **Ngày lấy tỷ giá khai theo LOẠI CHỨNG TỪ** | Hoá đơn lấy ngày phát hành; chiết tính lấy ngày báo giá; thanh toán lấy ngày thu tiền |
| `DL-050` | 🔴 **Tách chênh lệch tỷ giá ĐÃ THỰC HIỆN và CHƯA THỰC HIỆN** thành hai dòng riêng trong `CostActual` | Với biên FOB ~6%, biến động tỷ giá 3% ăn **một nửa lãi**. Trộn vào chi phí sản xuất sẽ **kết luận sai về hiệu quả nhà máy** |

---
---

# PHASE 6 · DOCUMENT ARCHITECTURE

## 6.1 🔴 Ba thứ khác nhau cùng tên "chứng từ" — sai lầm gốc của mọi ERP

> **Đây là phát biểu nền của Phase 6.** Gộp ba thứ này lại là lý do các hệ thống *"lưu PO thành file PDF"* — rồi không truy vấn được, không so sánh phiên bản được, không đối chiếu được.

| | **① Business Document** *(chứng từ)* | **② File** *(tệp)* | **③ Evidence** *(bằng chứng)* |
|---|---|---|---|
| Bản chất | **DỮ LIỆU có cấu trúc** mang giá trị pháp lý/thương mại | **NHỊ PHÂN** — ảnh, PDF, video, Excel | **File + NGỮ CẢNH nghiệp vụ + XUẤT XỨ** |
| Ví dụ | Purchase Order · Packing List · Inspection Report | ảnh chụp, PDF khách gửi | ảnh cuộn vải lúc nhận, kèm ai chụp · lúc nào · ở đâu · chứng minh điều gì |
| Truy vấn được? | ✅ | ❌ | ⚠️ qua siêu dữ liệu |
| Có phiên bản? | ✅ theo luật §6.4 | ❌ bất biến theo hash | ❌ bất biến |
| Kết xuất được? | ✅ ra 3 ngôn ngữ, nhiều mẫu | — | — |
| Ai tạo | Monica ONE | người dùng hoặc bên ngoài | người dùng, tại hiện trường |

```
BusinessDocument  ── là BẢN GHI. Kết xuất ra PDF khi cần, ⛔ PDF không phải bản ghi
   ├─ rendered_as ──▶ File (bản kết xuất, có hash, bất biến)
   └─ supported_by ─▶ Evidence ──▶ File (bản gốc)
```

> `DL-051` · **Chứng từ là DỮ LIỆU, không phải TỆP.** PDF là **bản kết xuất tại một thời điểm**, có hash, gắn vào bản ghi — ⛔ nó không bao giờ là nguồn chân lý.
> Hệ quả cụ thể: khi khách hỏi *"packing list bản nào đang hiệu lực"*, hệ thống trả lời bằng **truy vấn**, không bằng việc ai đó đi tìm file trong email.

## 6.2 🔴 Chứng từ VÀO và chứng từ RA — điểm mù lớn nhất

Mọi thiết kế ERP đều mô hình hoá chứng từ **Monica tạo ra**. Rất ít mô hình hoá chứng từ **Monica NHẬN VÀO** — mà với nền tảng cộng tác 7 bên, chứng từ vào chiếm gần một nửa.

| | **OUTBOUND — Monica tạo** | **INBOUND — Monica nhận** |
|---|---|---|
| Nguồn chân lý | Monica ONE | 🔴 **bên ngoài** |
| Monica được sửa? | ✅ theo luật phiên bản | ⛔ **KHÔNG BAO GIỜ** — sửa là **giả mạo chứng từ** |
| Cần gì | mẫu kết xuất · đánh số · chữ ký | 🔴 **xuất xứ**: ai gửi · lúc nào · qua kênh nào · hash · bản gốc |
| Ví dụ | Quotation · PO mua · Packing List · Inspection Report của Monica | **Tech Pack của khách** · PO của khách · hoá đơn NCC · báo cáo SGS · chứng chỉ thí nghiệm · **hoá đơn từ MISA** |

```
InboundDocument
├─ document_type · received_from_party_id · received_at
├─ channel: PORTAL | EMAIL | API | MANUAL_UPLOAD | POST
├─ 🔴 original_file_hash        ← chứng minh không bị sửa
├─ 🔴 provenance_chain[]        ← ai chuyển tay qua những đâu
├─ extracted_data JSONB?        ← AI trích xuất — ⚠️ ĐỀ XUẤT, người xác nhận
├─ verification_status: UNVERIFIED | VERIFIED | DISPUTED
└─ linked_business_object_id
```

> `DL-052` · **Chứng từ vào ⛔ KHÔNG BAO GIỜ sửa được, kể cả bởi `superadmin`.** Sai sót xử lý bằng cách **nhận bản mới** kèm lý do thay thế.
> 🔴 **Ứng dụng ngay: hoá đơn từ MISA là chứng từ VÀO.** `ExternalInvoiceMirror` (B67) phải mang đủ xuất xứ, và Monica ONE ⛔ không được sửa số tiền của nó — đó là nền của đối chiếu trung thực.

## 6.3 Mô hình chứng từ

```
BusinessDocument
├─ document_number      🔴 duy nhất theo TENANT × SITE × LOẠI × NĂM
├─ document_type → M59 · tenant_id · site_id · legal_entity_id
├─ direction: OUTBOUND | INBOUND
├─ version · supersedes_id · superseded_by_id
├─ status: DRAFT → ISSUED → SUPERSEDED | CANCELLED | VOID
├─ 🔴 disclosure_class → M64        ← ai được thấy chứng từ này
├─ source_object_type · source_object_id   ← aggregate sinh ra nó
├─ language_of_record                ← BDR-10
├─ 🔴 retention_class → M68          ← lưu bao lâu, luật nào
├─ Signature[]  ký nội bộ · ký điện tử đối tác · đóng dấu vật lý
├─ Rendering[]  ngôn ngữ · mẫu · file_hash · rendered_at
├─ Distribution[] 🔴 gửi ai · kênh nào · lúc nào · ĐÃ MỞ CHƯA
└─ EvidenceLink[]
```

## 6.4 Bốn luật chứng từ

| # | Luật | Vì sao |
|---|---|---|
| **DOC-1** | 🔴 **Chứng từ đã `ISSUED` ⛔ KHÔNG sửa.** Sửa = **chứng từ mới** tham chiếu bản cũ | 📚 Nguyên tắc chứng từ — học từ SAP, sống được 30 năm mà lịch sử không bị viết lại |
| **DOC-2** | **Có phiên bản** với chứng từ mang tính **thoả thuận** *(Contract · TechPack · Quotation · PriceAgreement · PackingList)*; **bất biến** với chứng từ ghi **giao dịch** *(GoodsReceipt · IssueNote · Payment)* | Thoả thuận thì thay đổi được và cần đối chiếu bản cũ. Giao dịch đã xảy ra thì không |
| **DOC-3** | 🔴 **Đánh số theo `tenant × site × loại × năm`**, ⛔ không bao giờ tái sử dụng số đã bỏ | Multi-tenant + đa nhà máy. Số đã in lên thùng hàng, đã vào tờ khai hải quan |
| **DOC-4** | **Huỷ bằng `VOID`**, ⛔ không xoá; `VOID` phải có lý do và người | Kiểm toán |

## 6.5 Kết xuất và đa ngôn ngữ

```
MỘT BusinessDocument  ──▶  N Rendering
                            ├─ vi · mẫu nội bộ
                            ├─ en · mẫu gửi khách
                            ├─ zh · mẫu gửi khách Trung Quốc
                            └─ en · mẫu hải quan
```

**Ba luật kết xuất:**

| # | Luật |
|---|---|
| `RND-1` | 🔴 **Nhãn trường dịch được; NỘI DUNG hồ sơ ⛔ không dịch** — `DL-032`. *"Số lượng"/"Quantity"/"数量"* dịch; tên khách, ghi chú người kiểm thì không |
| `RND-2` | **Mỗi bản kết xuất lưu hash và thời điểm.** Khách nhận bản nào thì bản đó truy được |
| `RND-3` | 🔴 **Chứng từ pháp lý có MỘT ngôn ngữ gốc** *(`language_of_record`)*; bản khác ghi rõ *"bản dịch tham khảo"* | `BDR-10` |

## 6.6 Phân phối và dấu vết

```
Distribution
├─ recipient_party_id · recipient_person_id?
├─ channel: PORTAL | EMAIL | API | PRINT
├─ sent_at · sent_by
├─ 🔴 opened_at · downloaded_at     ← BẰNG CHỨNG khách đã nhận
├─ rendering_id                     ← chính xác bản nào đã gửi
└─ disclosure_check_passed: bool    ← đã qua kiểm tra tiết lộ
```

> 🔴 **`opened_at` là trường nhỏ có giá trị đàm phán lớn.** Tranh chấp *"tôi không nhận được Tech Pack bản mới"* giải bằng một dòng dữ liệu: *"gửi 12/07 09:14, mở 12/07 14:22 bởi ontact@zara.com"*.
> Đây là **DNA-1 Đồ thị bằng chứng** áp vào chứng từ.

## 6.7 Lưu trữ và tiêu huỷ

```
M68 · RetentionClass  (T1 · Master Data)
├─ code · label_i18n · retention_years · legal_basis
├─ purge_allowed: bool
└─ hold_on_dispute: bool     ← đang tranh chấp thì ⛔ KHÔNG được xoá
```

| Lớp | Năm | Căn cứ | Ví dụ |
|---|---|---|---|
| `ACCOUNTING` | **10** | 📚 Luật Kế toán Việt Nam | hoá đơn · chứng từ thanh toán |
| `CUSTOMS` | **5** | 📚 Luật Hải quan | tờ khai · C/O · vận đơn |
| `CONTRACT` | **hết hạn + 10** | dân sự | hợp đồng · phụ lục |
| `QUALITY` | **theo yêu cầu buyer**, mặc định 3 | hợp đồng | báo cáo kiểm · CAPA |
| `PRODUCTION` | 2 | vận hành | phiếu cắt · báo cáo ngày |
| `IP_ASSET` | **theo `M66`** | `BDR-13` | Tech Pack · rập · định mức |

> `DL-053` · **Thời hạn lưu trữ là dữ liệu chủ theo `tenant`, ⛔ không viết cứng.** Doanh nghiệp Bangladesh có luật khác Việt Nam. `hold_on_dispute` chặn tiêu huỷ khi đang tranh chấp — đây là ràng buộc pháp lý, không phải tuỳ chọn.

## 6.8 SỔ ĐĂNG KÝ CHỨNG TỪ — 66 loại

> **D** hướng: ⬆️ ra · ⬇️ vào · ↔️ hai chiều · **V** có phiên bản · **S** cần chữ ký
> **Tiết lộ:** 🔒 nội bộ · 👤 khách · 🏭 nhà thầu · 🚚 NCC · 🌐 mọi bên

### G1 · THƯƠNG MẠI — 8

| # | Chứng từ | D | V | S | Tiết lộ | Ghi chú |
|---|---|---|---|---|---|---|
| DOC-01 | Yêu cầu báo giá *(khách gửi)* | ⬇️ | | | 👤 | Nguồn của `Inquiry` |
| DOC-02 | **Báo giá** | ⬆️ | ✅ | ✅ | 👤 | ⚖️ GĐSX ký |
| DOC-03 | **Hợp đồng / phụ lục** | ↔️ | ✅ | ✅ | 👤 | Lưu 10 năm sau hết hạn |
| DOC-04 | **PO của khách** | ⬇️ | ✅ | | 👤 | 🔴 Chứng từ VÀO — ⛔ không sửa |
| DOC-05 | Xác nhận đơn hàng | ⬆️ | ✅ | ✅ | 👤 | Monica xác nhận nhận đơn |
| DOC-06 | **Bảng giá thoả thuận** | ↔️ | ✅ | ✅ | 👤 | ⚖️ GĐSX |
| DOC-07 | Yêu cầu thay đổi đơn | ↔️ | ✅ | ✅ | 👤 | Từ khách hoặc từ Monica |
| DOC-08 | Thư xác nhận huỷ đơn | ⬆️ | | ✅ | 👤 | ⚖️ GĐSX + đồng ký |

### G2 · PHÁT TRIỂN SẢN PHẨM — 10

| # | Chứng từ | D | V | S | Tiết lộ | Ghi chú |
|---|---|---|---|---|---|---|
| DOC-09 | 🔴 **Tech Pack** | ⬇️ | ✅ | | 👤🏭* | 🔴 Chứng từ VÀO **có phiên bản** — nền của mọi tranh chấp |
| DOC-10 | Bảng thông số đo | ↔️ | ✅ | ✅ | 👤🏭 | 🟢 **Số hoá hoàn toàn — duyệt trên Portal có hiệu lực** |
| DOC-11 | File artwork · in | ⬇️ | ✅ | | 👤🏭 | |
| DOC-12 | Trim card | ↔️ | ✅ | | 👤🏭 | |
| DOC-13 | **Phiếu gửi mẫu** | ⬆️ | ✅ | | 👤 | Kèm vận đơn chuyển phát |
| DOC-14 | **Phiếu nhận xét mẫu** | ⬇️ | ✅ | ✅ | 👤 | 🔴 Khách ký — bằng chứng duyệt |
| DOC-15 | **Biên bản họp PP** | ⬆️ | ✅ | ✅ | 👤🏭 | Cổng vào sản xuất |
| DOC-16 | 🔒 **Bảng định mức BOM** | ⬆️ | ✅ | | 🔒 + 🏭* | ⛔ Bản đầy đủ **chỉ nội bộ**; nhà thầu chỉ phần cần may |
| DOC-17 | 🔒 Sơ đồ / báo cáo hiệu suất sơ đồ | ⬆️ | ✅ | | 🔒 | Bí mật kỹ thuật |
| DOC-18 | Bảng công đoạn | ⬆️ | ✅ | | 🔒🏭 | |

`*` = bản rút gọn, chỉ phần cần thiết để may

### G3 · CHIẾT TÍNH — 3 *(nhóm bí mật nhất)*

| # | Chứng từ | D | V | S | Tiết lộ | Ghi chú |
|---|---|---|---|---|---|---|
| DOC-19 | 🔴 **Bảng chiết tính** | ⬆️ | ✅ | ✅ | 🔒 **CỨNG** | ⛔ **Không cơ chế nào mở ra ngoài** |
| DOC-20 | 🔴 Bản ghi phê duyệt giá | ⬆️ | | ✅ | 🔒 | Chụp lại **đúng thứ GĐSX đã nhìn thấy** |
| DOC-21 | 🔒 Bảng so sánh phương án | ⬆️ | ✅ | | 🔒 | |

### G4 · MUA HÀNG — 8

| # | Chứng từ | D | V | S | Tiết lộ | Ghi chú |
|---|---|---|---|---|---|---|
| DOC-22 | Đề nghị mua | ⬆️ | | ✅ | 🔒 | MD lập |
| DOC-23 | Yêu cầu chào giá | ⬆️ | | | 🚚 | Gửi NCC |
| DOC-24 | 🔒 **Chào giá của NCC** | ⬇️ | ✅ | | 🔒 | ⛔ **Giá NCC không lộ ra cổng nào** |
| DOC-25 | 🔒 Bảng so sánh NCC | ⬆️ | | | 🔒 | |
| DOC-26 | **PO mua** | ⬆️ | ✅ | ✅✅ | 🚚 | 🔴 **HAI chữ ký: MD kỹ thuật + GĐSX thương mại** |
| DOC-27 | Xác nhận PO của NCC | ⬇️ | | ✅ | 🚚 | Supplier Portal |
| DOC-28 | Phiếu nhập kho | ⬆️ | | ✅ | 🚚 | |
| DOC-29 | **Hoá đơn NCC** | ⬇️ | | | 🔒 | Chứng từ VÀO — nền đối chiếu 3 chiều |

### G5 · KHO — 10

| # | Chứng từ | D | V | S | Tiết lộ | Ghi chú |
|---|---|---|---|---|---|---|
| DOC-30 | **Phiếu nhận NPL khách cấp** | ⬆️ | | ✅ | 👤 | 🔴 70% đơn của Monica |
| DOC-31 | 🔴 **Biên bản đối chiếu định mức** | ⬆️ | | ✅ | 👤 | 🔴 **Báo thiếu/thừa cho khách** — năng lực đang thiếu |
| DOC-32 | Báo cáo kiểm vải 4 điểm | ⬆️ | | ✅ | 👤🔒 | Kèm phân dải màu |
| DOC-33 | Phiếu cất vị trí | ⬆️ | | | 🔒 | |
| DOC-34 | Phiếu soạn hàng | ⬆️ | | | 🔒 | Kèm ràng buộc dải màu |
| DOC-35 | Phiếu xuất kho | ⬆️ | | ✅ | 🔒 | |
| DOC-36 | 🔴 **Phiếu trả về kho** | ⬆️ | | ✅ | 🔒 | 🔴 Không có ⇒ hao hụt thật ⛔ không đo được |
| DOC-37 | Phiếu chuyển kho | ⬆️ | | ✅ | 🔒 | |
| DOC-38 | 🔴 **Phiếu điều chỉnh tồn** | ⬆️ | | ✅ | 🔒 | ⚖️ **Bắt buộc duyệt + lý do + ảnh** |
| DOC-39 | Biên bản kiểm kê | ⬆️ | | ✅ | 🔒 | |

### G6 · SẢN XUẤT — 7

| # | Chứng từ | D | V | S | Tiết lộ | Ghi chú |
|---|---|---|---|---|---|---|
| DOC-40 | **Lệnh sản xuất** | ⬆️ | | ✅ | 🔒🏭 | Cổng thả có điều kiện |
| DOC-41 | **Phiếu cắt** | ⬆️ | | ✅ | 🔒 | Ghi `roll_id` — mắt xích truy vết |
| DOC-42 | 🔴 **Thẻ bó** | ⬆️ | | | 🔒🏭 | 🔴 **Chứng từ VẬT LÝ đi theo bó** — nền truy vết |
| DOC-43 | Báo cáo sản xuất ngày | ⬆️ | | ✅ | 🔒 | |
| DOC-44 | Nhật ký dừng chuyền | ⬆️ | | | 🔒 | Mã lý do chuẩn |
| DOC-45 | Phiếu chuyển công đoạn | ⬆️ | | ✅ | 🔒🏭 | 🔴 Kèm khi ra ngoài in/thêu |
| DOC-46 | Báo cáo tổn thất năng suất | ⬆️ | | | 🔒 | Cắt 1.000 → đóng 988, mất ở đâu |

### G7 · CHẤT LƯỢNG — 9

| # | Chứng từ | D | V | S | Tiết lộ | Ghi chú |
|---|---|---|---|---|---|---|
| DOC-47 | Kế hoạch kiểm | ⬆️ | ✅ | ✅ | 👤 | Theo yêu cầu từng khách |
| DOC-48 | Báo cáo kiểm trong chuyền | ⬆️ | | ✅ | 🔒 | ⛔ Nội bộ |
| DOC-49 | Báo cáo kiểm Pre-Final | ⬆️ | | ✅ | 🔒👤* | Tiết lộ theo **từng phát hiện** |
| DOC-50 | 🔴 **Báo cáo kiểm Final (AQL)** | ⬆️ | | ✅ | 👤 | Chứng từ QA quan trọng nhất với khách |
| DOC-51 | Báo cáo kiểm đóng gói | ⬆️ | | ✅ | 👤 | |
| DOC-52 | Báo cáo lỗi | ⬆️ | | | 🔒🏭* | Nhà thầu chỉ thấy phần của mình |
| DOC-53 | **CAPA** | ↔️ | ✅ | ✅ | 👤🏭 | Nhà thầu phản hồi được |
| DOC-54 | 🔴 **Báo cáo bên thứ ba** *(SGS·Intertek·BV)* | ⬇️ | | ✅ | 👤 | 🔴 **Chỉ đính kèm — sửa là giả mạo** |
| DOC-55 | Chứng chỉ thí nghiệm | ⬇️ | | ✅ | 👤 | |

### G8 · GIA CÔNG NGOÀI — 6

| # | Chứng từ | D | V | S | Tiết lộ | Ghi chú |
|---|---|---|---|---|---|---|
| DOC-56 | Hợp đồng gia công | ↔️ | ✅ | ✅ | 🏭 | |
| DOC-57 | **Phiếu giao việc** | ⬆️ | ✅ | ✅ | 🏭 | Nhà thầu chấp nhận/từ chối |
| DOC-58 | Phiếu giao NPL cho nhà thầu | ⬆️ | | ✅ | 🏭 | 🔴 Chuyển **quyền giữ hộ**, ⛔ không chuyển sở hữu |
| DOC-59 | Phiếu nhận thành phẩm về | ⬆️ | | ✅ | 🏭 | |
| DOC-60 | **Báo cáo ngày của nhà thầu** | ⬇️ | | ✅ | 🏭 | 🔴 Nhà thầu **BẮT BUỘC GHI** |
| DOC-61 | 🔴 **Biên bản đối soát hao hụt** | ⬆️ | | ✅ | 🏭 | NPL cấp ⟷ TP nhận ⟷ định mức |

### G9 · HẬU CẦN & XUẤT KHẨU — 9

| # | Chứng từ | D | V | S | Tiết lộ | Ghi chú |
|---|---|---|---|---|---|---|
| DOC-62 | Yêu cầu / xác nhận booking | ↔️ | ✅ | | 👤 | |
| DOC-63 | 🔴 **Packing List** | ⬆️ | ✅ | ✅ | 👤🌐 | |
| DOC-64 | Quy cách shipping mark | ↔️ | ✅ | | 👤🏭 | |
| DOC-65 | Biên bản kiểm đóng container | ⬆️ | | ✅ | 👤 | Ảnh niêm phong |
| DOC-66 | **Hoá đơn thương mại** | ⬇️ | | ✅ | 👤 | 🔴 **Từ MISA — chứng từ VÀO** |
| DOC-67 | **C/O** | ⬇️ | | ✅ | 👤 | Từ VCCI/Bộ Công Thương |
| DOC-68 | **Vận đơn B/L · AWB** | ⬇️ | | ✅ | 👤 | Từ hãng tàu |
| DOC-69 | **Tờ khai hải quan** | ↔️ | | ✅ | 🔒 | Lưu 5 năm |
| DOC-70 | Phiếu giao hàng | ⬆️ | | ✅ | 👤 | |

### G10 · TÀI CHÍNH — 6

| # | Chứng từ | D | V | S | Tiết lộ | Ghi chú |
|---|---|---|---|---|---|---|
| DOC-71 | Đề nghị xuất hoá đơn *(gửi MISA)* | ⬆️ | | | 🔒 | ⛔ Monica ONE **không** phát hành hoá đơn |
| DOC-72 | 🔴 **Gương hoá đơn MISA** | ⬇️ | | | 👤 | Chứng từ VÀO — ⛔ không sửa |
| DOC-73 | Phiếu thu *(gương MISA)* | ⬇️ | | | 👤 | |
| DOC-74 | 🔴 **Thông báo khấu trừ** | ↔️ | ✅ | ✅ | 👤 | ⚖️ Kế toán trưởng · lý do chuẩn hoá |
| DOC-75 | Bảng công nợ | ⬆️ | | | 👤🏭🚚 | Mỗi bên **chỉ thấy của mình** |
| DOC-76 | 🔴 **Báo cáo đối chiếu ONE ⟷ MISA** | ⬆️ | | ✅ | 🔒 | 4 loại chênh lệch |

**Tổng: 76 loại chứng từ · 24 chứng từ VÀO (32%).**

> 🔴 **32% chứng từ đến từ bên ngoài.** Con số này xác nhận chỉ thị *nền tảng cộng tác* của Joseph là đúng về mặt kiến trúc: Monica ONE ⛔ không phải hệ thống tự sinh chứng từ — nó là **điểm hội tụ của bảy dòng chứng từ**.

## 6.9 Bộ chứng từ — thứ phải đi cùng nhau

```
DocumentPackage
├─ package_type · required_documents[] · optional_documents[]
├─ completeness_check     ← 🔴 CẢNH BÁO KHI THIẾU
└─ blocking: bool         ← thiếu thì CHẶN bước tiếp theo

Ba bộ chuẩn:
  EXPORT_SET      Invoice · Packing List · C/O · B/L · Tờ khai   🔴 BLOCKING
  PP_READY_SET    TechPack · Bảng thông số · Mẫu PP duyệt · Biên bản PP · BOM  🔴 BLOCKING cổng 3
  SHIPMENT_SET    Kiểm Final đạt · Packing List · Booking · Kiểm container  🔴 BLOCKING cổng 4
```

> `DL-054` · **Bộ chứng từ là đối tượng có kiểm tra đầy đủ, ⛔ không phải một danh sách trong đầu ai đó.**
> 📚 Thiếu một tờ C/O là **hàng nằm cảng, phát sinh phí lưu container**. Đây là loại lỗi tốn tiền mà hoàn toàn phòng được bằng một phép kiểm.

---
---

# PHASE 7 · INFORMATION ARCHITECTURE

> Joseph hỏi: *"Ai sở hữu. Ai được sửa. Ai được xem. Ai tham chiếu. Ai quyết định."*
> **Năm câu hỏi = năm quan hệ khác nhau.** Gộp lại là nguồn gốc của mọi mô hình phân quyền hỏng.

## 7.1 Năm quan hệ dữ liệu

| Quan hệ | Ký hiệu | Nghĩa | Số lượng |
|---|---|---|---|
| **SỞ HỮU** | **O** | Chịu trách nhiệm dữ liệu **ĐÚNG**. Người giữ sổ | 🔴 **Đúng MỘT Role cho mỗi aggregate** |
| **GHI** | **W** | Tạo/sửa được. Có thể uỷ quyền trong Domain sở hữu | 1..n |
| **ĐỌC** | **R** | Xem được nội dung | 1..n |
| **THAM CHIẾU** | **F** | 🔴 **Dùng ID nhưng ⛔ KHÔNG đọc nội dung bên trong** | 1..n |
| **QUYẾT ĐỊNH** | **D** | Gây được **chuyển trạng thái** | 1..n |

> ### 🔴 **F · THAM CHIẾU** là quan hệ bị bỏ quên và là quan hệ quan trọng nhất cho khả năng mở rộng
>
> `Shipment` *(D10)* **tham chiếu** `order_id` — nó cần biết lô hàng thuộc đơn nào, nhưng ⛔ **không cần đọc giá, không cần đọc chiết tính, không cần đọc điều khoản thanh toán**.
>
> Phân biệt **R** với **F** cho phép:
> ① Tách Domain sang dịch vụ riêng về sau mà ⛔ không sửa mã · ② Thu hẹp quyền tới mức tối thiểu thật sự · ③ Phép kiểm bắt được vi phạm *(Domain nào đọc bảng nào)*
>
> Mọi hệ ERP tổng quát chỉ có R hoặc không-R. Đó là lý do chúng không tách được.

## 7.2 Sáu lớp phân loại dữ liệu

| Lớp | Ai thấy | Ví dụ |
|---|---|---|
| 🌐 `PUBLIC_TO_PARTIES` | mọi bên liên quan | kết luận kiểm, mốc giao hàng |
| 🔒 `INTERNAL_ONLY` | **chỉ nhân viên Monica** | nguyên nhân lỗi nội bộ, nhật ký dừng chuyền |
| 👤 `CUSTOMER_SCOPED` | Monica + **đúng khách đó** | PO của họ, tiến độ, QA chia sẻ |
| 🏭 `SUBCON_SCOPED` | Monica + **đúng nhà thầu đó** | Assignment, đơn giá của họ, công nợ của họ |
| 🚚 `SUPPLIER_SCOPED` | Monica + **đúng NCC đó** | PO mua gửi họ, công nợ Monica nợ họ |
| 🔴 `RESTRICTED` | **chỉ Role được chỉ định** | 🔴 chiết tính · biên lợi nhuận · lương · giá vốn · giá mua NCC |

> `DL-055` · **`RESTRICTED` là lớp riêng, ⛔ không phải "INTERNAL_ONLY nghiêm ngặt hơn".**
> Lý do: `INTERNAL_ONLY` là *"ai trong Monica cũng xem được"*. Nhưng **tổ trưởng may ⛔ không cần biết biên lợi nhuận**. Không có lớp thứ sáu thì mọi bí mật thương mại mở cho toàn bộ nhân viên — đó **không phải bảo mật, đó là phạm vi tin cậy rộng bằng số nhân viên**.

## 7.3 Sáu chiều phạm vi

```
Được truy cập = Capability(Role) ∩ Classification ∩ TenantScope ∩ OrgScope
                ∩ FactoryScope ∩ WarehouseScope ∩ PartyScope ∩ Assignment
```

| # | Chiều | Nghĩa | Ai bị ràng buộc |
|---|---|---|---|
| **1** | 🔴 **`TenantScope`** | Doanh nghiệp nào | **TẤT CẢ** — lớp ngoài cùng, `BDR-01` |
| **2** | `OrgScope` | Pháp nhân nào | kế toán · điều hành |
| **3** | `FactoryScope` | Nhà máy nào | sản xuất · kho · QA |
| **4** | `WarehouseScope` | Kho nào | thủ kho |
| **5** | 🔴 **`PartyScope`** | Khách/NCC/nhà thầu nào | **mọi vai bên ngoài** |
| **6** | 🔴 **`AssignmentScope`** | Đối tượng cụ thể được giao | nhà thầu · merchandiser · tổ trưởng |

> `DL-056` · **`TenantScope` là lớp NGOÀI CÙNG, kiểm TRƯỚC mọi chiều khác.**
> Nó ⛔ không bao giờ suy từ dữ liệu người dùng nhập — luôn từ phiên đăng nhập đã xác thực. Vi phạm chiều này là **lộ dữ liệu chéo doanh nghiệp** — hỏng chết người của một nền tảng đa thuê bao.

## 7.4 🔴 KIẾN TRÚC PHÉP CHIẾU TIẾT LỘ — trung tâm của Phase 7

**Bài toán:** cùng một bản ghi `Inspection` phải hiện cho Monica *(toàn bộ)*, Khách *(một số phát hiện)*, Nhà thầu B *(chỉ phát hiện của họ)*, Tổ trưởng *(chỉ chuyền mình)*. Đây là kiểm soát **cấp trường + cấp dòng + cấp bên** trên **một** bản ghi.

### Hai cách làm — và vì sao chỉ một cách sống được

| | **A · Lọc khi truy vấn** *(cách phổ biến)* | **B · Phép chiếu tiết lộ** ⭐ |
|---|---|---|
| Cách làm | Bên ngoài truy vấn bảng gốc, RLS + mã ứng dụng lọc bớt cột | 🔴 **Bên ngoài ⛔ KHÔNG BAO GIỜ chạm bảng gốc.** Đọc từ **read-model riêng cho từng loại bên**, chỉ chứa trường đã được tiết lộ |
| Mặc định | **hiện, trừ khi ẩn** | 🔴 **không tồn tại, trừ khi khai** |
| Quên một dòng | 🔴 **RÒ RỈ IM LẶNG** — không ai biết cho tới khi mất khách | **Thiếu tính năng** — khách gọi điện phàn nàn hôm sau |
| Kiểm thử | phải chứng minh **không có gì lọt** — bài toán vô hạn | ✅ **Khẳng định phép chiếu chứa ĐÚNG N trường** — hữu hạn, kiểm được |
| Hiệu năng cổng | truy vấn nặng, phải join bảng gốc | ✅ đã tính sẵn, nhanh |

```
        ┌─────────── BẢNG GỐC (Domain sở hữu) ────────────┐
        │  Inspection · InspectionFinding · Measurement   │
        └────────────────────┬───────────────────────────┘
                             │ luật tiết lộ (M64 + disclosure của TỪNG phát hiện)
        ┌────────────────────┼────────────────────┬──────────────────┐
        ▼                    ▼                    ▼                  ▼
  internal_view       customer_view.*      subcon_view.*      supplier_view.*
  (RLS theo Role)     ⛔ chỉ trường đã     ⛔ chỉ Assignment  ⛔ chỉ PO của họ
                        tiết lộ + PartyScope   của họ
        ▲                    ▲                    ▲                  ▲
   Nhân viên Monica    Customer Portal    Subcon Portal      Supplier Portal
```

**Bốn luật cưỡng chế:**

| # | Luật | Kiểm bằng |
|---|---|---|
| `DP-1` | 🔴 **Vai ngoài ⛔ KHÔNG có quyền `SELECT` trên bất kỳ bảng gốc nào** | Quét `pg_privileges`: role ngoài ⇒ 0 quyền trên schema gốc |
| `DP-2` | 🔴 **Phép chiếu khai TƯỜNG MINH từng trường.** ⛔ Cấm `SELECT *` | Rà mã phép chiếu |
| `DP-3` | **Mọi phép chiếu có bài kiểm liệt kê chính xác tập trường**; thêm trường mà quên sửa bài kiểm ⇒ **hỏng** | Bài kiểm hồi quy mỗi vòng |
| `DP-4` | 🔴 **Mỗi phép chiếu có ≥1 vai CHỜ THẤY > 0** *(quy tắc K-3)* | Bài kiểm toàn vai chờ-0 ⛔ không phân biệt *khoanh đúng* với *chặn hết* |

> `DL-057` · **Chọn phương án B — Phép chiếu tiết lộ.**
>
> Lý do quyết định ⛔ **không phải hiệu năng, không phải sự gọn gàng — mà là BẤT ĐỐI XỨNG KIỂU LỖI.** Cùng một sơ suất của cùng một lập trình viên: phương án A gây **rò rỉ im lặng và tồn vong**; phương án B gây **thiếu tính năng, ồn ào và vô hại**.
>
> Kiến trúc tốt ⛔ không phải kiến trúc giả định người ta không sai. Là kiến trúc **chọn trước lỗi sẽ mắc là loại nào**.
>
> 🔬 **Bằng chứng đây là vấn đề thật ở Monica:** `VR-001` và `VR-002` cho thấy hôm nay **chưa ai chứng minh được MỘT cổng nào là an toàn** — vì với phương án A, ⛔ **không bao giờ chứng minh được**.

## 7.5 MA TRẬN SỞ HỮU DỮ LIỆU

> **O** sở hữu · **W** ghi · **R** đọc · **F** tham chiếu · **D** quyết định

### Aggregate cốt lõi

| Aggregate | O | W | R | F | D *(chuyển trạng thái)* |
|---|---|---|---|---|---|
| **`Order`** | Merchandiser | MD · MD Mgr | D1·D5·D6·D7·D9·D10·D12·D14 | D11 | Xác nhận: **GĐSX** · Huỷ: **GĐSX** + đồng ký |
| 🔴 **`Costing`** | Merchandiser | MD | 🔴 **MD · MD Mgr · GĐSX · CEO · Cost Controller — HẾT** | — | Duyệt: **chỉ GĐSX** |
| **`TnAPlan`** | Merchandiser | MD · Planner | D5·D6·D14 · 👤*(mốc công khai)* | — | MD |
| **`OrderMaterialPlan`** | Merchandiser | MD | D8·D9 | — | MD; sở hữu do **`M67` quyết** |
| **`Style` · `TechPack`** | Product Developer | PD | D2·D4·D5·D6·D7 · 👤 · 🏭* | — | PD; khách **duyệt** |
| **`Sample`** | Product Developer | PD | D2 · 👤 | — | 🔴 **Khách duyệt** |
| **`BOM`** | Product Developer | PD | D2·D5·D8·D9 · 🏭* | — | PD |
| 🔴 **`StandardTime`** | StandardTimeKeeper | IE | **D2·D5·D6·D13 chỉ ĐỌC** | — | IE |
| **`Capacity` · `CapacityBooking`** | CapacityPlanner | Planner · GĐSX | D2·D14 | — | GĐSX |
| **`ProductionOrder`** | LineScheduler | Planner | D6·D7·D9·D11 | D2 | Thả: **GĐSX** *(cổng 3)* |
| **`Bundle` · `StageThroughput`** | Section Head | Line Sup · 🏭 | D5·D7·D14 · 👤*(tổng hợp)* · 🏭*(phần mình)* | — | Line Sup |
| 🔴 **`Inspection`** | QA Manager | QC · 👤 · 🏭 | **theo `disclosure` TỪNG phát hiện** | — | Kết luận: **QA Mgr** |
| **`PurchaseOrder`** | ProcurementOfficer | MD · GĐSX | D9·D12 | D2 | 🔴 **HAI chữ ký** |
| 🔴 **`StockLedgerEntry`** | Storekeeper | WH | D2·D5·D8·D12·D14 | — | ⛔ **chỉ-ghi-thêm, không ai sửa** |
| **`FabricRoll`** | Storekeeper | WH · QC | D6·D7 | — | WH |
| **`Assignment`** | Subcon Coordinator | Subcon Coord | D2·D5·D6·D9 · 🏭 | — | Giao: Monica · **Chấp nhận: 🏭 nhà thầu** |
| **`Shipment`** | Logistics Officer | Logistics | D2·D12·D14 · 👤 | D2 *(chỉ order_id)* | Logistics |
| **`Invoice*` · `Payment` · `Deduction`** | Accountant | Kế toán | D2·D14 · 👤 | D10 | Khấu trừ: **Kế toán trưởng** |
| 🔴 **`CostActual`** | Cost Controller | tự động | 🔴 **CEO · GĐSX · Kế toán trưởng · Cost Controller — HẾT** | — | — |

### 🔴 Ba hàng đáng chú ý nhất

| Hàng | Vì sao |
|---|---|
| **`Costing`** — cột R chỉ 5 Role | ⛔ **Tổ trưởng, thủ kho, QA, kế toán vật tư đều KHÔNG đọc được.** Đây là lớp `RESTRICTED` hoạt động |
| **`StandardTime`** — 4 Domain **chỉ đọc** | ⛔ Không Domain nào sao chép. Vi phạm `DEP-3` |
| **`Shipment`** — cột F với D2 | Logistics **tham chiếu** `order_id`, ⛔ **không đọc** giá và điều khoản. Đây là **F** hoạt động |

## 7.6 Bốn luật tham chiếu chéo Domain

| # | Luật | Kiểm bằng |
|---|---|---|
| `XD-1` | 🔴 **Đọc chéo Domain qua READ-MODEL hoặc CONTRACT, ⛔ không đọc thẳng bảng** | Quét truy vấn theo Domain |
| `XD-2` | 🔴 **⛔ Cấm lưu trường dẫn xuất qua ranh giới Domain** | Danh sách trường cấm — `po-twin.service.ts:132` là ca vi phạm đã đo |
| `XD-3` | **Ghi chéo Domain chỉ qua SỰ KIỆN**, ⛔ không gọi thẳng | Phép kiểm phụ thuộc |
| `XD-4` | **Shared Kernel ⛔ không import Domain nào** | Phép kiểm phụ thuộc |

## 7.7 Tầng read-model S7 — lời giải cho `BR-RPT-001` và cho `BDR-05`

```
Domain (ghi) ──emit──▶ DomainEvent ──▶ ReadModel ──▶ MỌI báo cáo · Work Inbox · Portal · Line Map
                                          ▲
                                   MetricDefinition
                            (một công thức, một chỗ, có mã số)
```

**Hai read-model lợi nhuận song song — thi hành `BDR-05`:**

| Read-model | Công thức | Dùng để | Ai xem |
|---|---|---|---|
| `rm_margin_contribution` | `Doanh thu − chi phí trực tiếp` | 🔴 **Quyết định nhận đơn** | MD · GĐSX · CEO |
| `rm_margin_full` | `Doanh thu − trực tiếp − chung phân bổ theo PHÚT CHUYỀN` | 🔴 **Đánh giá hiệu quả thật** | CEO · Kế toán trưởng · Cost Controller |

Cả hai chiếu trên **bốn trục**: đơn hàng · khách hàng · nhà máy · nhà thầu.
🔴 **Dashboard luôn hiện CẢ HAI kèm nhãn rõ ràng** — ⛔ không bao giờ hiện một con số *"lợi nhuận"* không nói rõ phương pháp.

**Ba luật:**

| # | Luật |
|---|---|
| `RM-1` | 🔴 **Mọi chỉ số hiển thị phải có `MetricDefinition` mang mã.** Không mã ⇒ ⛔ không được lên màn hình |
| `RM-2` | ⛔ **Không màn hình nào tự tính chỉ số** — kể cả một phép cộng |
| `RM-3` | **Read-model mang `as_of` và `source_event_id`** — mọi con số truy ngược được về sự kiện gốc |

## 7.8 Cô lập đa thuê bao — thi hành `BDR-01`

Joseph yêu cầu hỗ trợ **Single · Multi · Dedicated · Cloud · On-premise** mà ⛔ **không đổi nền tảng CSDL**.

```
Mô hình DUY NHẤT — lược đồ dùng chung, tenant_id mọi bảng, RLS cô lập
        │
        ├─▶ SINGLE TENANT     một tenant trong instance    → Monica hôm nay
        ├─▶ MULTI TENANT      n tenant trong instance      → SaaS
        ├─▶ DEDICATED TENANT  🔴 MỘT tenant, instance riêng — CÙNG bộ mã
        ├─▶ CLOUD             Supabase / hạ tầng đám mây
        └─▶ ON-PREMISE        🔴 Postgres tại nhà máy — CÙNG bộ mã
```

> `DL-058` · **Bốn hình thái triển khai là bốn CẤU HÌNH TRIỂN KHAI, ⛔ không phải bốn kiến trúc.**
> Điều kiện để đúng: `tenant_id` mọi bảng ngay từ bảng đầu tiên · ⛔ **không phụ thuộc dịch vụ riêng của một nhà cung cấp đám mây nào** ở tầng nghiệp vụ · tệp lưu trữ qua một giao diện trừu tượng *(S3 hoặc đĩa cục bộ)*.
>
> 🔴 **`Dedicated` = tách một tenant sang instance riêng, cùng mã, cùng lược đồ.** Đây là lối thoát cho khách hàng lớn đòi cô lập vật lý — và nó ⛔ không tốn một dòng mã nào nếu `tenant_id` có từ đầu.

**Năm luật cô lập:**

| # | Luật |
|---|---|
| `MT-1` | 🔴 **Mọi bảng có `tenant_id NOT NULL`** — kể cả bảng cấu hình |
| `MT-2` | 🔴 **RLS theo tenant là policy NGOÀI CÙNG**, đánh giá trước mọi policy khác |
| `MT-3` | ⛔ **`tenant_id` không bao giờ lấy từ tham số người dùng gửi lên** — chỉ từ phiên đã xác thực |
| `MT-4` | **Dữ liệu chủ T0/T1 dùng chung** *(tenant_id NULL = toàn cục)*; T2/T3 luôn theo tenant |
| `MT-5` | 🔴 **Bài kiểm rò rỉ chéo tenant chạy MỖI VÒNG** — dựng 2 tenant, khẳng định tenant A ⛔ không thấy một dòng nào của B |

## 7.9 Xuất xứ và truy vết dữ liệu

```
Mọi con số quan trọng trả lời được BỐN câu:
  ① Từ đâu ra?      source_event_id → DomainEvent → aggregate gốc
  ② Ai làm ra?      created_by · approved_by
  ③ Lúc nào?        as_of · effective_from
  ④ Bằng gì?        evidence_link[]
```

Đây là hạ tầng của **DNA-1 Đồ thị bằng chứng** và là điều kiện của Hiến pháp Điều 8.

**Ứng dụng cụ thể — chuỗi truy vết sản phẩm không đứt:**

```
FabricRoll ──▶ CutTicket ──▶ Bundle ──▶ StageThroughput ──▶ Carton ──▶ Shipment ──▶ Customer
   ▲ xuôi: "cuộn lỗi này đã vào những thùng nào?" ⇒ thu hồi ĐÚNG phạm vi
   ▼ ngược: "thùng này làm từ cuộn nào, ai cắt, chuyền nào may, ai kiểm?" ⇒ tìm nguyên nhân
```

## 7.10 Vòng đời dữ liệu

| Giai đoạn | Nội dung | Luật |
|---|---|---|
| **Tạo** | `DRAFT` | `request_id` chống trùng |
| **Hoạt động** | giao dịch bình thường | RLS + phân loại |
| **Đóng** | `CLOSED` / `POSTED` | ⛔ không sửa |
| **Lưu trữ** | chuyển sang lưu trữ nguội sau N năm | đọc được, ⛔ không sửa |
| **Tiêu huỷ** | chỉ khi hết hạn lưu trữ `M68` | 🔴 ⛔ **CHẶN nếu `hold_on_dispute`** |

> `DL-059` · **Chấm dứt quan hệ ⛔ KHÔNG kích hoạt tiêu huỷ.** Khách ngừng hợp tác thì dữ liệu chuyển `ARCHIVED`, **giữ tới hết thời hạn pháp lý**. Tiêu huỷ sớm là **huỷ bằng chứng** — và bằng chứng là thứ cần nhất khi tranh chấp xảy ra **sau** khi quan hệ chấm dứt. → `BDR-13`

## 7.11 🔴 MÔ HÌNH DỮ LIỆU NỀN TẢNG CỘNG TÁC — thi hành chỉ thị Joseph

> *"Mỗi đối tượng làm việc trên cùng một nguồn dữ liệu, nhưng chỉ nhìn thấy đúng dữ liệu họ được phép."*

### Bảy bên và bốn quyền của mỗi bên

| Bên | Đọc | Bình luận | Trò chuyện | 🔴 Đề nghị | Ghi trực tiếp |
|---|---|---|---|---|---|
| **Monica nội bộ** | theo Role + Scope | ✅ | ✅ | — | ✅ theo O/W |
| **Customer** | 👤 phạm vi mình | ✅ | ✅ | ✅ | ⛔ **KHÔNG BAO GIỜ** |
| **Supplier** | 🚚 phạm vi mình | ✅ | ✅ | ✅ | ⛔ **KHÔNG** |
| **Subcontractor** | 🏭 theo Assignment | ✅ | ✅ | ✅ | 🔴 **CÓ — sản lượng, sự cố, báo cáo ngày** |
| **QA bên thứ ba** | lô được giao | ✅ | ✅ | — | ⚠️ chỉ báo cáo của chính họ |
| **Logistics/Forwarder** | lô hàng được giao | ✅ | ✅ | ✅ | ⚠️ chỉ cập nhật trạng thái vận chuyển |
| **Finance/MISA** | qua tích hợp | — | — | — | ⚠️ chỉ gương chứng từ |

> ### 🔴 Bất đối xứng cốt lõi — Customer ⛔ không ghi, Subcontractor ✅ có ghi
>
> Đây ⛔ không phải sự thiếu nhất quán — nó phản ánh **hai quan hệ kinh doanh khác nhau**:
> - **Khách hàng MUA kết quả** ⇒ họ **duyệt** và **yêu cầu**, ⛔ không vận hành
> - **Nhà thầu BÁN năng lực** ⇒ họ **thực thi**, nên họ **phải báo cáo việc mình làm**
>
> `BR-ACC-005` và `BR-ACC-006` của Board đã phát biểu đúng điều này từ đầu.

### 🔴 `CollaborationRequest` — cách khách "ghi" mà ⛔ không ghi

Thi hành `BDR-03` · `BDR-04`: *"Mọi Request đều phải đi qua Workflow. Có đầy đủ Audit Trail."*

```
CollaborationRequest
├─ request_number · from_party_id · from_person_id
├─ request_type:
│    ORDER_CHANGE        đổi số lượng · màu · ngày giao
│    SAMPLE_FEEDBACK     nhận xét / duyệt / từ chối mẫu
│    DOCUMENT_REQUEST    xin chứng từ
│    INSPECTION_BOOKING  đặt lịch kiểm
│    NEW_INQUIRY         hỏi hàng mới
│    COMPLAINT           khiếu nại chất lượng / giao hàng
│    GENERAL             khác
├─ target_object_type · target_object_id     ← đề nghị này chạm cái gì
├─ 🔴 status: SUBMITTED → UNDER_REVIEW → ACCEPTED | REJECTED | NEEDS_INFO
│                            └─▶ 🔴 SINH RA công việc trong Work Inbox của Monica
├─ 🔴 resulting_object_id?   ← nếu chấp nhận, tạo ra OrderChange/Inquiry... của MONICA
├─ sla_due_at · responded_at · responded_by
└─ AuditTrail[]  🔴 mọi bước, mọi người, mọi thời điểm
```

```
Khách bấm "Đề nghị đổi số lượng PO-2588 từ 18.400 → 16.000"
        ▼
CollaborationRequest  SUBMITTED        ⛔ CHƯA có gì trong Order thay đổi
        ▼
🔴 WorkItem xuất hiện trong hộp thư chị Lan (MD)
        ▼
MD phân tích tác động: T&A · NPL đã mua · năng lực đã đặt · giá
        ▼
Nếu chấp nhận ─▶ MONICA tạo OrderChange ─▶ luồng duyệt nội bộ ─▶ áp dụng
Nếu từ chối   ─▶ phản hồi kèm lý do, khách thấy trên Portal
```

> `DL-060` · **Đề nghị của đối tác ⛔ KHÔNG BAO GIỜ là một bản ghi nghiệp vụ. Nó là ĐẦU VÀO của một bản ghi nghiệp vụ do Monica tạo.**
>
> Ba hệ quả: ① Dữ liệu vận hành của Monica **chỉ có một nguồn ghi** · ② Mọi đề nghị có **SLA và dấu vết đầy đủ** — khách thấy Monica trả lời trong bao lâu · ③ ⛔ Không đề nghị nào **âm thầm** đổi dữ liệu.
>
> 🔴 **Và đây chính là thứ tạo lợi thế cạnh tranh Joseph muốn:** khách thấy đề nghị của mình **đang ở đâu, ai đang xử lý, bao giờ trả lời**. Không nhà máy nào cho khách thấy điều đó — họ chỉ có email không ai biết đã đọc chưa.

### `Thread` — trò chuyện gắn ngữ cảnh

```
Thread
├─ context_object_type · context_object_id   ← 🔴 GẮN VÀO ĐỐI TƯỢNG, không phải phòng chat rời
├─ 🔴 anchor?   ← gắn tới TRƯỜNG cụ thể: "điểm đo Vòng ngực" của "Sample v3"
├─ participants[]  ← Monica + đúng những bên được phép
├─ disclosure_class
└─ Message[]  nội dung · đính kèm · dịch-hỗ-trợ *(hiển thị, ⛔ không lưu)*
```

> `DL-061` · **Trò chuyện gắn vào ĐỐI TƯỢNG và TRƯỜNG, ⛔ không phải phòng chat theo người.**
> Lý do: *"Vòng ngực rộng 1,5cm"* gắn đúng dòng của bảng thông số **phiên bản 3** — sáu tháng sau vẫn tra được. Chat theo người thì nội dung đó nằm lẫn trong 4.000 tin nhắn.
> 📚 Đây là chỗ Monica ONE khác **mọi** hệ trong bảng benchmark — không hệ nào có trò chuyện neo tới cấp trường.

---
---

# §8 · DECISION LOG — 18 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-044` | IP Ownership là dữ liệu chủ **có luật đi kèm** *(3 cột boolean)*, không phải nhãn | Biến phân loại thành quy tắc thi hành được | ✅ |
| `DL-045` | **`Facet` = nhóm thuộc tính có điều kiện của cùng bản ghi gốc**, ⛔ không phải master record riêng | Giữ *"một Party, một số hiệu"* mà ⛔ không mất toàn vẹn dữ liệu | ⚠️ |
| `DL-046` | Sở hữu vật tư là **phép tra luật `M67`**, ⛔ không phải một cột | `BDR-07` · mảnh đầu của Rule Engine | ✅ |
| `DL-047` | **Lưu số tiền ở CẢ BA tiền tệ tại thời điểm ghi sổ** | Tỷ giá lúc đó là **sự kiện**, không phải phép tính | ⚠️ |
| `DL-048` | Bốn loại tỷ giá — có `CONTRACT_FIXED` | Ngành may chốt tỷ giá hợp đồng để phòng rủi ro | ✅ |
| `DL-049` | Ngày lấy tỷ giá khai **theo loại chứng từ** | Hoá đơn ≠ chiết tính ≠ thanh toán | ✅ |
| `DL-050` | 🔴 **Tách chênh lệch tỷ giá thành dòng riêng** trong `CostActual` | Biên FOB ~6%, tỷ giá 3% ăn nửa lãi. Trộn vào chi phí SX ⇒ **kết luận sai về nhà máy** | ⚠️ |
| `DL-051` | 🔴 **Chứng từ là DỮ LIỆU, ⛔ không phải TỆP.** PDF là bản kết xuất có hash | Sai lầm gốc của mọi ERP | 🔴 rất khó |
| `DL-052` | 🔴 **Chứng từ VÀO ⛔ KHÔNG BAO GIỜ sửa được**, kể cả `superadmin` | Sửa = giả mạo chứng từ. Áp cho hoá đơn MISA, TechPack khách, báo cáo SGS | ⚠️ |
| `DL-053` | Thời hạn lưu trữ là dữ liệu chủ theo tenant · `hold_on_dispute` chặn tiêu huỷ | Đa quốc gia, luật khác nhau | ✅ |
| `DL-054` | **Bộ chứng từ có kiểm tra đầy đủ và CHẶN bước tiếp theo** | Thiếu C/O = hàng nằm cảng | ✅ |
| `DL-055` | 🔴 **`RESTRICTED` là lớp phân loại RIÊNG**, ⛔ không phải "internal nghiêm hơn" | ⛔ Tổ trưởng không cần biết biên lợi nhuận | ⚠️ |
| `DL-056` | **`TenantScope` là lớp NGOÀI CÙNG**, ⛔ không bao giờ từ tham số người dùng | Rò chéo tenant là hỏng chết người của SaaS | 🔴 rất khó |
| `DL-057` | 🔴 **PHÉP CHIẾU TIẾT LỘ — vai ngoài ⛔ KHÔNG chạm bảng gốc** | **Bất đối xứng kiểu lỗi.** `VR-001`/`VR-002` chứng minh cách cũ ⛔ không chứng minh được an toàn | 🔴 rất khó |
| `DL-058` | **4 hình thái triển khai = 4 CẤU HÌNH, ⛔ không phải 4 kiến trúc** | `BDR-01`. `Dedicated` ⛔ không tốn một dòng mã | 🔴 rất khó |
| `DL-059` | **Chấm dứt quan hệ ⛔ KHÔNG kích hoạt tiêu huỷ** — chuyển `ARCHIVED` | Bằng chứng cần nhất **sau** khi quan hệ chấm dứt | ✅ |
| `DL-060` | 🔴 **Đề nghị của đối tác ⛔ KHÔNG BAO GIỜ là bản ghi nghiệp vụ** — nó là đầu vào | `BDR-03` · `BDR-04`. Và nó **chính là** lợi thế cạnh tranh: khách thấy đề nghị đang ở đâu | ⚠️ |
| `DL-061` | **Trò chuyện gắn vào ĐỐI TƯỢNG và TRƯỜNG**, ⛔ không phải phòng chat theo người | ⛔ Không hệ nào trong benchmark có | ⚠️ |

**Cộng dồn EDD-01 + 02 + 03: 61 quyết định.**

---

# §9 · BOARD DECISION REQUIRED — 5

---

## `BDR-09` · BẰNG CHỨNG NỘI BỘ TRONG TRANH CHẤP CHẤT LƯỢNG

**Vấn đề.** Khách khiếu nại lô hàng. Monica có **ảnh kiểm nội bộ, nhật ký chuyền, báo cáo lỗi nội bộ** chứng minh hàng đạt lúc xuất. Có đưa cho khách không? Hôm nay `BR-ACC-002` ghi ⛔ **khách không được xem QA nội bộ**.

| | **A · Giữ nguyên — ⛔ không bao giờ mở QA nội bộ** | **B · Mở CÓ KIỂM SOÁT khi có tranh chấp** |
|---|---|---|
| Cách làm | Chỉ báo cáo Final đã chia sẻ được dùng | `DisputeCase` — người có thẩm quyền **chọn từng bằng chứng** mở cho khách, ghi vết ai mở, mở gì, lúc nào |
| Ưu | Đơn giản · ⛔ không rò · ⛔ không lộ vấn đề nội bộ | 🔴 **Bằng chứng là thứ thắng đàm phán khấu trừ.** Ảnh có thước đo, có dấu thời gian, có người ký mạnh hơn mọi lời giải thích |
| Nhược | 🔴 Monica **có bằng chứng mà ⛔ không dùng được** ⇒ chấp nhận khấu trừ mà lẽ ra bác được | Mở nhầm một ảnh có ghi chú nội bộ *("công nhân mới ở trạm 12")* ⇒ **tự tố cáo mình** |
| Với Monica | An toàn, **mất tiền khấu trừ** | Cần kỷ luật, đổi lại **vị thế đàm phán** |
| Với 100 khách | Portal chỉ để xem | 🔴 **DNA-1 và DNA-6 phát huy hết giá trị** |

> **Khuyến nghị: PHƯƠNG ÁN B**, với ba ràng buộc:
> ① Mở bằng chứng là **hành động có chủ ý từng mục**, ⛔ không bao giờ mở cả gói · ② Chỉ **QA Manager + GĐSX** được mở · ③ Mỗi lần mở ghi **ai · mục nào · lý do · lúc nào**, và bản ghi đó ⛔ không xoá được.
>
> Lý do: `DL-057` đã bảo đảm mặc định là **không thấy**. Mở một mục là **thêm vào phép chiếu**, ⛔ không phải gỡ một tấm chắn. Rủi ro ở đây là **hữu hạn và kiểm soát được** — khác hẳn rủi ro của việc mở cả một bảng.

**🔲 Board chọn: A · B · B-với-điều-kiện-khác**

---

## `BDR-10` · NGÔN NGỮ GỐC CỦA CHỨNG TỪ PHÁP LÝ

**Vấn đề.** Monica ONE hỗ trợ VI·EN·ZH. Khi tranh chấp, **bản ngôn ngữ nào là bản có hiệu lực**? Hợp đồng ký tiếng Anh, Tech Pack tiếng Anh, nhưng biên bản nội bộ tiếng Việt, và khách Trung Quốc đọc bản tiếng Trung.

| | **A · Tiếng Anh là ngôn ngữ gốc cho MỌI chứng từ đối ngoại** | **B · Ngôn ngữ gốc khai theo TỪNG hợp đồng** |
|---|---|---|
| Cách làm | Cố định `language_of_record = 'en'` cho chứng từ ra ngoài; VI/ZH là *"bản dịch tham khảo"* | `Contract.language_of_record`; mọi chứng từ thuộc hợp đồng đó kế thừa |
| Ưu | Đơn giản · **chuẩn thương mại quốc tế** · ⛔ không tranh cãi | Linh hoạt · khách Trung Quốc ký hợp đồng tiếng Trung được · ⛔ không ép khách nội địa dùng tiếng Anh |
| Nhược | Khách nội địa và khách Trung Quốc có thể ⛔ không chấp nhận | Phải quản nhiều bản gốc · **rủi ro hai bản gốc mâu thuẫn** |
| Với Monica | Đúng hôm nay — khách chính là công ty thương mại quốc tế | Chuẩn bị cho khách Trung Quốc và nội địa |
| Với 100 khách | Nhà máy Trung Quốc bán cho khách Trung Quốc ⛔ **không dùng được** | Nhân bản được mọi thị trường |

> **Khuyến nghị: PHƯƠNG ÁN B**, mặc định `en`.
> Chi phí: **một trường trên `Contract`**. Lợi ích: sản phẩm bán được ở thị trường không nói tiếng Anh.
> 🔴 Kèm một luật cứng: **mỗi chứng từ có ĐÚNG MỘT bản gốc**; mọi bản khác in nhãn *"Bản dịch tham khảo — bản gốc là [ngôn ngữ]"*. Hai bản gốc là mời gọi tranh chấp.

**🔲 Board chọn: A · B**

---

## `BDR-11` · ĐỐI SÁNH NGÀNH ẨN DANH GIỮA CÁC DOANH NGHIỆP

**Vấn đề.** Với đa thuê bao, Monica ONE nắm dữ liệu vận hành thật của nhiều nhà máy. Có thể cung cấp **đối sánh ẩn danh**: *"Hiệu suất chuyền của bạn 78% — trung vị ngành 82%"*, *"DHU của bạn 4,2 — nhóm 25% tốt nhất là 2,1"*. Đây là **quyết định chiến lược sản phẩm**, ⛔ không phải quyết định kỹ thuật.

| | **A · ⛔ KHÔNG bao giờ dùng dữ liệu tenant cho mục đích khác** | **B · Đối sánh ẩn danh, có ĐỒNG Ý MINH THỊ** |
|---|---|---|
| Cách làm | Dữ liệu tenant chỉ phục vụ chính tenant đó | Tenant **chọn tham gia**; dữ liệu tổng hợp ≥ N doanh nghiệp; ⛔ không bao giờ lộ danh tính, khách hàng, giá |
| Ưu | Niềm tin tuyệt đối · ⛔ không rủi ro pháp lý · dễ giải thích khi bán hàng | 🔴 **Năng lực mà ⛔ không sản phẩm nào trong 8 hệ benchmark có.** Giá trị **tăng theo số khách** — hiệu ứng mạng thật · lý do để nhà máy ở lại |
| Nhược | Bỏ qua tài sản dữ liệu lớn nhất của nền tảng | Rủi ro danh tiếng nếu ẩn danh làm sai · cần văn bản đồng ý · nhà máy có thể nghi ngờ |
| Với Monica | ⛔ Không ảnh hưởng — mới một tenant | ⛔ Không ảnh hưởng hôm nay; **quyết định phải làm SỚM** vì nó đổi thiết kế phân tách dữ liệu |
| Với 100 khách | Sản phẩm là **công cụ** | 🔴 Sản phẩm thành **hạ tầng ngành** |

> **Khuyến nghị: PHƯƠNG ÁN B, mặc định TẮT, chuẩn bị kiến trúc ngay.**
> Cụ thể: ① `Tenant.benchmark_consent` mặc định `false` · ② Read-model đối sánh **tách vật lý** khỏi read-model vận hành · ③ Ngưỡng tối thiểu **≥ 7 doanh nghiệp** mỗi nhóm so sánh · ④ ⛔ Không bao giờ đưa vào: tên khách hàng · giá · tên nhà cung cấp · dữ liệu nhân sự.
>
> ⚠️ **Vì sao phải quyết SỚM dù chưa dùng:** nếu về sau mới thêm, phải rà lại toàn bộ mô hình dữ liệu để biết trường nào an toàn để tổng hợp — một cuộc rà soát lớn. Quyết bây giờ thì **phân loại đúng ngay từ đầu**, chi phí ~0.

**🔲 Board chọn: A · B-tắt-mặc-định · B-bật**

---

## `BDR-12` · MINH BẠCH HIỆU SUẤT VỚI NHÀ THẦU

**Vấn đề.** Nhà thầu có nên thấy **hiệu suất, tỷ lệ lỗi, xếp hạng của chính họ** không? Giúp họ cải thiện — nhưng cũng cho họ biết vị thế đàm phán.

| | **A · Nhà thầu chỉ thấy DỮ LIỆU THÔ của mình** *(sản lượng, số lỗi)* | **B · Nhà thầu thấy CHỈ SỐ HIỆU SUẤT của mình** *(hiệu suất, DHU, đúng hạn, xu hướng)* |
|---|---|---|
| Ưu | Monica giữ vị thế thông tin · đơn giản | 🔴 **Nhà thầu tự cải thiện được** — nhà máy tốt nhất thế giới đều làm thế. Giảm chi phí giám sát · thu hút nhà thầu tốt |
| Nhược | Nhà thầu ⛔ không biết mình yếu chỗ nào ⇒ **Monica phải đi dạy từng người** | Nhà thầu biết mình giỏi ⇒ **đòi giá cao hơn** · biết mình kém ⇒ có thể rút lui |
| Với Monica | Hôm nay Monica thuê ngoài đáng kể — chi phí giám sát thật | Nâng chất lượng mạng lưới nhà thầu |
| Với 100 khách | — | 🔴 **Subcontract Portal thành lý do nhà thầu muốn làm với khách dùng Monica ONE** — hiệu ứng mạng phía cung |

> **Khuyến nghị: PHƯƠNG ÁN B, ⛔ KHÔNG kèm xếp hạng so với nhà thầu khác.**
> Nhà thầu thấy **chỉ số của chính mình và xu hướng của chính mình** — đủ để cải thiện. ⛔ **Không thấy thứ hạng** — vì thứ hạng biến quan hệ hợp tác thành cuộc đua và làm lộ cấu trúc mạng lưới nhà thầu của Monica.
>
> Lý do sâu: *"nhà thầu giỏi đòi giá cao hơn"* là **kết quả đúng của một thị trường lành mạnh** — và Monica vẫn có lựa chọn. Nhưng *"nhà thầu không biết mình kém"* thì ⛔ **không có kết quả tốt nào cả**.

**🔲 Board chọn: A · B-không-xếp-hạng · B-có-xếp-hạng**

---

## `BDR-13` · DỮ LIỆU VÀ TÀI SẢN TRÍ TUỆ KHI CHẤM DỨT QUAN HỆ

**Vấn đề.** Khách ngừng hợp tác. Monica giữ Tech Pack, rập, định mức, thời gian chuẩn, lịch sử chất lượng của họ. **Chuyện gì xảy ra?** Câu này gắn với `BDR-02` *(IP Ownership)* và ảnh hưởng cả nghĩa vụ pháp lý lẫn tài sản của Monica.

| | **A · Trả và xoá theo yêu cầu khách** | **B · Lưu trữ theo `M66 IPOwnershipModel` + hạn pháp lý** |
|---|---|---|
| Cách làm | Khách yêu cầu ⇒ xuất toàn bộ, xoá khỏi hệ thống | Xuất toàn bộ cho khách; Monica **giữ ở trạng thái `ARCHIVED`** tới hết hạn lưu trữ; ⛔ **không dùng cho khách khác** nếu `CUSTOMER_OWNED` |
| Ưu | Khách yên tâm tuyệt đối · dễ bán | 🔴 **Giữ được bằng chứng** — tranh chấp thường xảy ra **sau** khi quan hệ chấm dứt · giữ tri thức Monica tự tạo *(thời gian chuẩn, lịch sử chất lượng)* |
| Nhược | 🔴 **Xoá bằng chứng ⇒ Monica ⛔ không tự bảo vệ được** nếu khách kiện sau · mất tri thức đã đầu tư | Khách có thể ⛔ không chấp nhận · cần điều khoản hợp đồng rõ |
| Với Monica | Rủi ro pháp lý thật | An toàn hơn |
| Với 100 khách | ⛔ Không đáp ứng được nghĩa vụ lưu trữ kế toán/hải quan | Đúng luật |

> **Khuyến nghị: PHƯƠNG ÁN B**, với ba phân tách rõ:
> ① **Dữ liệu của khách** *(TechPack, artwork)* — trả bản đầy đủ, Monica lưu trữ, ⛔ không dùng lại nếu `CUSTOMER_OWNED` · ② **Dữ liệu Monica tự tạo** *(thời gian chuẩn, lịch sử chất lượng, chi phí)* — **Monica giữ, là tài sản của Monica** · ③ **Chứng từ pháp lý** *(hoá đơn, tờ khai)* — **⛔ bắt buộc giữ theo luật, ⛔ không xoá được kể cả khi khách yêu cầu**.
>
> ⚠️ **Chỗ tôi có thể sai:** tôi ⛔ không biết hợp đồng gia công của Monica có điều khoản về dữ liệu khi chấm dứt không. Nếu có và trái với B, hợp đồng thắng.

**🔲 Board chọn: A · B**

---

# §10 · SPRINT SUMMARY

## 10.1 Đã bàn giao

| Phase | Nội dung | Khối lượng |
|---|---|---|
| **6** | Document Architecture | 3 khái niệm tách bạch · **vào/ra** · 4 luật chứng từ · kết xuất đa ngôn ngữ · phân phối · lưu trữ · **76 loại chứng từ** *(24 chứng từ VÀO)* · 3 bộ chứng từ chặn |
| **7** | Information Architecture | **5 quan hệ dữ liệu** · **6 lớp phân loại** · **6 chiều phạm vi** · 🔴 **Kiến trúc phép chiếu tiết lộ** · ma trận sở hữu · luật tham chiếu chéo · read-model 2 tầng lợi nhuận · cô lập đa thuê bao · xuất xứ · vòng đời · **mô hình cộng tác 7 bên** |
| **+** | Hấp thụ 8 BDR | IP Ownership · Party sửa lại · Ownership Policy · **Multi-currency 3 tầng** |

**Quyết định tự ra:** 18 *(cộng dồn 61)* · **Cần Board quyết:** 5 · **Câu hỏi mở:** 0

## 10.2 Ba phát hiện đáng nhớ nhất

| # | Phát hiện |
|---|---|
| **1** | 🔴 **Kiến trúc phép chiếu tiết lộ — vai ngoài ⛔ KHÔNG BAO GIỜ chạm bảng gốc.** Lý do chọn ⛔ không phải hiệu năng mà là **bất đối xứng kiểu lỗi**: cách cũ gây *rò rỉ im lặng*, cách mới gây *thiếu tính năng ồn ào*. Và nó biến việc chứng minh an toàn từ **bài toán vô hạn** thành **một bài kiểm liệt kê hữu hạn** — điều mà `VR-001`/`VR-002` cho thấy hôm nay ⛔ không làm được |
| **2** | 🔴 **32% chứng từ đến từ BÊN NGOÀI** — Tech Pack khách, hoá đơn NCC, báo cáo SGS, hoá đơn MISA. Chúng ⛔ **không bao giờ sửa được**, và chúng cần **xuất xứ** chứ không cần **quyền tác giả**. Đây là điểm mù của mọi thiết kế ERP và là xác nhận kiến trúc cho chỉ thị *nền tảng cộng tác* |
| **3** | 🔴 **Đề nghị của đối tác ⛔ không bao giờ là bản ghi nghiệp vụ — nó là ĐẦU VÀO của một bản ghi do Monica tạo.** Và chính điều đó tạo lợi thế cạnh tranh: khách thấy đề nghị của mình **đang ở đâu, ai xử lý, bao giờ trả lời**. ⛔ Không nhà máy nào cho khách thấy điều đó — họ chỉ có email không biết đã đọc chưa |

## 10.3 Lộ trình còn lại

| Sprint | Deliverable | Phase | Nội dung |
|---|---|---|---|
| ✅ 1 | EDD-01 | 1·2·3 | Business · Capability · Domain |
| ✅ 2 | EDD-02 | 4·5 | Master Data · Business Object |
| ✅ 3 | **EDD-03** | 6·7 | **Document · Information Architecture** |
| 4 | EDD-04 | 8·9·10 | **Workflow Engine · Rule Engine · Permission** |
| 5 | EDD-05 | 11·12 | Workspace · Portal · Module Architecture |
| 6 | EDD-06 | — | Hợp nhất · rà mâu thuẫn · hồ sơ Board ký |
| → | | | 🔓 **Board ký ⇒ mở khoá Implementation** |

## 10.4 Trạng thái thi hành

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

---

## THAM CHIẾU

- **Board Decision EDD-02 Review** — BDR-01…08 · Chỉ thị **nền tảng cộng tác**
- **Board Working Principle v2.0**
- [EDD-01](EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) · [EDD-02](EDD-02-MASTER-DATA-BUSINESS-OBJECT.md)
- [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) v1.5 — Điều 8 · 33 · 39 · 40 · 45
- [`BUSINESS_KNOWLEDGE_BASE.md`](../business/BUSINESS_KNOWLEDGE_BASE.md) Phần D — ranh giới truy cập
- Chuẩn tham chiếu: Luật Kế toán VN *(lưu 10 năm)* · Luật Hải quan VN *(5 năm)* · Incoterms 2020 · ISO 2859-1
