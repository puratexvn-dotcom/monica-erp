# EDD-03A · TU CHÍNH A
## PARTNER PORTAL ARCHITECTURE
### Customer Portal · Subcontract Portal · Supplier Portal — ba Business Capability độc lập

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-03A · Tu chính của [EDD-03](EDD-03-DOCUMENT-INFORMATION-ARCHITECTURE.md) |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Nguồn thẩm quyền** | **Board Additional Decision** — *"Subcontract Portal là Business Capability bắt buộc"* |
| **Sửa** | 🔴 `DL-062` **thay thế** phần *"một nền tảng Portal, ba cấu hình"* mà tôi đề xuất trước đây |
| **Kéo về sớm** | Phase 11 *(Portal)* — theo chỉ thị *"phải thiết kế ngay, không bổ sung sau"* |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §1 · GHI NHẬN — TÔI ĐÃ SAI Ở ĐÂU

Ở buổi bảo vệ kiến trúc trước, tôi đề xuất **"một nền tảng Portal, ba cấu hình"** với lập luận: ba cổng chia sẻ ~80% cơ chế, gộp lại thì chỉ có **một bề mặt bảo mật để kiểm** thay vì ba.

**Lập luận đó đúng về bảo mật và sai về nghiệp vụ.** Joseph bác đúng chỗ.

## 1.1 Vì sao tôi sai — bằng chứng cụ thể

Tôi so sánh hai cổng bằng **cơ chế kỹ thuật** *(xác thực · phạm vi · tải chứng từ)* mà **không so sánh bằng NGƯỜI DÙNG THẬT**:

| | 👤 **Customer Portal** | 🏭 **Subcontract Portal** |
|---|---|---|
| **Người dùng thật** | Merchandiser của buyer, văn phòng Hồng Kông / Thượng Hải | 🔴 **Quản đốc xưởng may ở Nam Định** |
| **Thiết bị** | máy tính, màn hình lớn | 🔴 **điện thoại, một tay, đứng ở chuyền** |
| **Kết nối** | ổn định | 🔴 **wifi xưởng, hay rớt** |
| **Ngôn ngữ mặc định** | EN · ZH | 🔴 **VI** |
| **Tần suất** | vài lần một tuần, tuỳ hứng | 🔴 **MỖI NGÀY, BẮT BUỘC** |
| **Quan hệ kinh doanh** | **MUA kết quả** | **BÁN năng lực** |
| **Quyền ghi** | ⛔ **KHÔNG BAO GIỜ** *(BDR-04)* | 🔴 **BẮT BUỘC GHI** *(BR-ACC-006)* |
| **Khoá phạm vi** | `customer_id` — **tĩnh, một chiều** | 🔴 `assignment_id` — **có thời hạn, có số lượng, thu hồi được** |
| **Hỏng thì sao?** | khách khó chịu | 🔴 **DỮ LIỆU SẢN XUẤT NGỪNG CHẢY** |

> 🔴 **Dòng cuối là dòng quyết định.** Customer Portal hỏng là một sự phiền toái. **Subcontract Portal hỏng là Monica mất khả năng nhìn thấy 30–40% sản lượng của mình.**
>
> Hai thứ có **mức độ trọng yếu vận hành khác nhau một bậc** thì ⛔ không thể là hai cấu hình của cùng một thứ.

## 1.2 Đọc đúng chỉ thị — ba tầng, không mâu thuẫn

Chỉ thị *"Không được xem Subcontract chỉ là một Party hoặc WorkCenter"* ⛔ **không bác** hai quyết định dữ liệu đã duyệt. Từ khoá là **"chỉ"**.

| Tầng | Nhà thầu là gì | Quyết định | Trạng thái |
|---|---|---|---|
| **Dữ liệu chủ** | **một `Party`** với vai `SUBCONTRACTOR` | `BDR-06` · `DL-045` | ✅ **GIỮ NGUYÊN** |
| **Năng lực sản xuất** | chuyền của họ là **`WorkCenter`** *(`ownership = SUBCONTRACTED`)* | `DL-031` | ✅ **GIỮ NGUYÊN** |
| **Business Capability** | 🔴 **Subcontract Portal — năng lực độc lập, có mô hình quyền riêng và trải nghiệm riêng** | 🆕 **Board Additional Decision** | 🆕 **BỔ SUNG** |

**Ba tầng này bổ trợ nhau.** Chính vì nhà thầu là một `Party` mà công nợ bù trừ được; chính vì chuyền của họ là `WorkCenter` mà **Line Map hiện liền mạch trong nhà và ngoài nhà** — điều không hệ ERP nào trong 8 hệ benchmark làm được. Và chính vì họ có **Portal riêng** mà họ ghi được dữ liệu mỗi ngày từ điện thoại ở xưởng.

---

# §2 · KIẾN TRÚC BA CỔNG — CHUNG NỀN, RIÊNG THÂN

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  🟦 NỀN TẢNG DÙNG CHUNG · Partner Foundation                              ║
║                                                                           ║
║  · Định danh & xác thực   PartnerAccount · MFA · phiên · chính sách MK    ║
║  · Collaboration Engine   Thread · CollaborationRequest · Notification     ║
║  · Giao chứng từ          Document · Rendering · Distribution · opened_at  ║
║  · Cơ chế phép chiếu      hạ tầng Disclosure Projection (DL-057)          ║
║  · Đa ngôn ngữ            VI · EN · ZH                                     ║
║  · Nhật ký kiểm toán      AuditEntry · ai · lúc nào · thấy gì             ║
║  · Cô lập đa thuê bao     TenantScope là lớp ngoài cùng                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
        ▲                        ▲                          ▲
        │                        │                          │
┌───────┴────────┐      ┌────────┴─────────┐      ┌────────┴─────────┐
│ 👤 CUSTOMER    │      │ 🏭 SUBCONTRACT   │      │ 🚚 SUPPLIER      │
│    PORTAL      │      │    PORTAL        │      │    PORTAL        │
│                │      │                  │      │                  │
│ Permission     │      │ Permission       │      │ Permission       │
│  MODEL RIÊNG   │      │  MODEL RIÊNG     │      │  MODEL RIÊNG     │
│ Projection     │      │ Projection       │      │ Projection       │
│  RIÊNG         │      │  RIÊNG           │      │  RIÊNG           │
│ UX RIÊNG       │      │ UX RIÊNG         │      │ UX RIÊNG         │
│                │      │                  │      │                  │
│ ⛔ CHỈ ĐỌC     │      │ 🔴 CÓ GHI        │      │ ⚠️ GHI HẠN CHẾ   │
│ desktop-first  │      │ 🔴 mobile-first  │      │ desktop-first    │
│ EN · ZH        │      │ 🔴 VI            │      │ VI · ZH          │
│ 🟢 v1 BẮT BUỘC │      │ 🟢 v1 BẮT BUỘC   │      │ 🟡 v2            │
└────────────────┘      └──────────────────┘      └──────────────────┘
```

## 2.1 Cái gì DÙNG CHUNG · cái gì PHẢI RIÊNG

| Hạng mục | Chung | Riêng | Vì sao |
|---|---|---|---|
| Xác thực · phiên · MFA | ✅ | | Một cơ chế bảo mật, kiểm một lần |
| `PartnerAccount` · thu hồi tài khoản | ✅ | | Cùng vòng đời quản trị |
| `Thread` · `CollaborationRequest` · `Notification` | ✅ | | Cùng ngữ nghĩa cộng tác |
| Hạ tầng phép chiếu tiết lộ | ✅ | | Một cơ chế, kiểm một lần |
| Khung đa ngôn ngữ · nhật ký kiểm toán | ✅ | | |
| 🔴 **Mô hình quyền** | | 🔴 **RIÊNG** | Khoá phạm vi khác nhau về **bản chất** — §3 |
| 🔴 **Nội dung phép chiếu** | | 🔴 **RIÊNG** | Bảng khác, cột khác, luật khác |
| 🔴 **Trải nghiệm người dùng** | | 🔴 **RIÊNG** | Thiết bị · kết nối · ngôn ngữ · tần suất khác nhau |
| 🔴 **Mô hình công việc** | | 🔴 **RIÊNG** | Khách: **theo yêu cầu**. Nhà thầu: **theo nhiệm vụ, bắt buộc hằng ngày** |
| 🔴 **Yêu cầu sẵn sàng** | | 🔴 **RIÊNG** | Subcon Portal hỏng = **mất dữ liệu sản xuất** |
| Đào tạo · tài liệu hướng dẫn | | RIÊNG | Hai nhóm người dùng khác nhau hoàn toàn |

> `DL-062` · **Ba Portal là BA Business Capability độc lập, chung một Partner Foundation.**
> **Thay thế** đề xuất *"một nền tảng ba cấu hình"* trước đây của tôi.
>
> ⚠️ **Đánh đổi tôi chấp nhận:** ba mô hình quyền = ba bề mặt phải kiểm thay vì một. Bù lại bằng `DP-3` — **mỗi phép chiếu có bài kiểm liệt kê chính xác tập trường**; thêm trường mà quên sửa bài kiểm ⇒ **hỏng**. Ba bài kiểm hữu hạn vẫn kiểm được; một trải nghiệm sai cho quản đốc xưởng thì ⛔ không sửa được bằng bài kiểm nào.

---

# §3 · MÔ HÌNH QUYỀN — VÌ SAO KHÔNG THỂ CHUNG

## 3.1 Khoá phạm vi khác nhau về bản chất

```
👤 CUSTOMER — phạm vi TĨNH, một chiều
   PartnerAccount.party_id ──▶ Order.customer_id
   · quan hệ tồn tại chừng nào còn là khách hàng
   · một chiều, không hết hạn, không có số lượng

🏭 SUBCONTRACT — phạm vi ĐỘNG, nhiều chiều, CÓ HẠN
   PartnerAccount.party_id ──▶ Assignment[] ──▶ OrderLine[] ──▶ Bundle[] · WorkCenter[]
   · 🔴 CÓ THỜI HẠN     assignment kết thúc ⇒ quyền xem kết thúc
   · 🔴 CÓ SỐ LƯỢNG     chỉ phần được giao, không phải cả đơn
   · 🔴 THU HỒI ĐƯỢC    Monica huỷ assignment ⇒ mất quyền NGAY
   · 🔴 NHIỀU MẢNH      một nhà thầu có n assignment từ n đơn của n khách
```

> 🔴 **`AssignmentScope` là bài toán phân quyền khó hơn `PartyScope` một bậc**, và nó ⛔ không diễn đạt được bằng cùng một mô hình. Đây là lý do kỹ thuật quan trọng nhất cho quyết định của Joseph.

## 3.2 🔴 Tấn công tương quan — rủi ro tôi phải nêu

Ngay cả khi lọc dòng đúng tuyệt đối, một nhà thầu có **nhiều assignment** vẫn có thể **suy ra danh tính khách hàng** từ dữ liệu hợp lệ:

| Đường rò gián tiếp | Ví dụ |
|---|---|
| Mã hàng theo mẫu đặt tên | `ZR-2601-NVY` ⇒ *Zara* |
| Shipping mark trên nhãn thùng | in tên brand |
| Quy cách đóng gói · nhãn dệt | đặc trưng từng buyer |
| Cảng đích trên lô hàng | Zaragoza ⇒ Inditex |
| Tài liệu kỹ thuật | logo trên trang bìa Tech Pack |
| Chặng kiểm bất thường | *"kiểm 4 chặng + bên thứ ba"* ⇒ buyer lớn |

```
CustomerIdentityDisclosurePolicy   (Master Data · theo Contract, ghi đè theo Assignment)
├─ level:
│    HIDDEN      🔴 MẶC ĐỊNH — che tên khách · mã hàng ẩn danh hoá
│                             · shipping mark ẩn tới bước đóng gói
│                             · cảng đích ẩn
│    PARTIAL     hiện nhóm khách, ⛔ không hiện tên
│    DISCLOSED   hiện đầy đủ (khi hợp đồng cho phép)
└─ áp dụng cho: subcon_portal · supplier_portal
```

> `DL-063` · **Che danh tính khách hàng là MẶC ĐỊNH, mở là NGOẠI LỆ có hợp đồng.**
> ⚠️ Đây là chỗ `OQ-031` *(nhà thầu có biết tên khách cuối không)* vẫn chưa có câu trả lời. Tôi ⛔ **không hỏi lại** — tôi thiết kế **cơ chế** cho cả hai đáp án, mặc định phía an toàn. Chi phí: một trường trên `Contract`. Board đặt chính sách sau mà ⛔ không phải sửa kiến trúc.
>
> 🔴 **Rủi ro kinh doanh nếu để lộ:** nhà thầu biết khách cuối ⇒ có thể tiếp cận trực tiếp ⇒ **Monica bị loại khỏi chuỗi**. Đây là rủi ro tồn vong của mô hình gia công, không phải rủi ro bảo mật thông thường.

## 3.3 Ma trận quyền hai cổng

| Hành động | 👤 Customer | 🏭 Subcontract |
|---|---|---|
| **ĐỌC** phạm vi của mình | ✅ | ✅ |
| **Bình luận** | ✅ | ✅ |
| **Trò chuyện** | ✅ | ✅ |
| **Gửi đề nghị** | ✅ | ✅ |
| 🔴 **GHI dữ liệu vận hành** | ⛔ **KHÔNG BAO GIỜ** | 🔴 **BẮT BUỘC** — sản lượng · sự cố · báo cáo ngày · xác nhận nhận NPL |
| 🔴 **Chấp nhận / từ chối công việc** | — | 🔴 **CÓ** — `Assignment: ISSUED → ACCEPTED\|REJECTED` |
| **Xác nhận** | ✅ *(nhận hàng · nhận chứng từ)* | ✅ *(nhận NPL · nhận công việc)* |
| **Duyệt** | ⛔ **KHÔNG** *(BDR-04)* | ⛔ **KHÔNG** |
| **Sửa · xoá** | ⛔ | ⛔ *(kể cả dữ liệu chính họ đã chốt ca)* |
| **Tự tạo công việc cho mình** | — | ⛔ **KHÔNG** *(migration `026` đã chặn ở CSDL — giữ nguyên)* |

> ### 🔴 Bất đối xứng cốt lõi — và nó ⛔ không phải sự thiếu nhất quán
>
> - **Khách hàng MUA kết quả** ⇒ họ **duyệt** và **yêu cầu**, ⛔ không vận hành
> - **Nhà thầu BÁN năng lực** ⇒ họ **thực thi**, nên họ **phải báo cáo việc mình làm**
>
> `BR-ACC-005` và `BR-ACC-006` của Board đã phát biểu đúng điều này từ đầu. Hai cổng có **hai mô hình quyền** vì chúng phục vụ **hai quan hệ kinh tế ngược chiều nhau**.

---

# §4 · SUBCONTRACT PORTAL — THIẾT KẾ ĐẦY ĐỦ

## 4.1 Mười một năng lực Joseph chỉ định — ánh xạ kiến trúc

| # | Joseph yêu cầu | Nguồn dữ liệu | Khoá phạm vi | Che gì |
|---|---|---|---|---|
| 1 | **Xem PO được giao** | `Assignment` + `OrderLine` | `assignment_id` | 🔴 **số PO khách · tên khách** *(theo `DL-063`)* · giá bán · điều khoản |
| 2 | **Xem Production Plan** | `LineSchedule` lọc theo `WorkCenter` của họ | `work_center.operated_by = party` | lịch của chuyền khác · đơn khác |
| 3 | 🔴 **Line Map của chính họ** | `FlowStage` + `StageThroughput` | `work_center_id ∈ của họ` | công đoạn Monica · nhà thầu khác · **hiệu suất của Monica** |
| 4 | **Xem Material** | `SubconIssue` · `SubconReceipt` · `ReturnNote` | `assignment_id` | tồn kho Monica · **giá vật tư** · NPL đơn khác |
| 5 | **Xem Bundle** | `Bundle` đang trong quyền giữ hộ của họ | `bundle.custody_party = họ` | bó của nhà thầu khác |
| 6 | **Xem QA** | `InspectionFinding` với `disclosure = SUBCON` **và** thuộc assignment của họ | `assignment_id` + `disclosure` | 🔴 **phát hiện `INTERNAL_ONLY`** · lỗi của nhà thầu khác · nhận xét của khách |
| 7 | **Xem Shipment** | `Shipment` chứa sản phẩm của họ — **trạng thái, ⛔ không chi tiết** | qua `Carton → Bundle → Assignment` | 🔴 **cảng đích · tên consignee · shipping mark** *(theo `DL-063`)* |
| 8 | **Chat** | `Thread` gắn `Assignment` | `assignment_id` | luồng của nhà thầu khác |
| 9 | **Request** | `CollaborationRequest` | `party_id` | — |
| 10 | **Dashboard** | read-model riêng cổng nhà thầu | `party_id` | mọi thứ ngoài phạm vi |
| 11 | 🔴 **KPI** | `rm_subcon_performance` | `party_id` | 🔴 **xếp hạng so với nhà thầu khác** — xem §4.4 |

## 4.2 Sáu điều nhà thầu ⛔ KHÔNG BAO GIỜ thấy — cưỡng chế bằng phép chiếu

Joseph liệt kê sáu. Tôi bổ sung năm đường rò gián tiếp mà chỉ lọc dòng ⛔ không chặn được:

| Joseph nêu | Cơ chế chặn |
|---|---|
| Customer khác | `assignment_id` scope + phép chiếu ⛔ không có cột `customer_id` |
| PO khác | như trên |
| 🔴 **Costing** | 🔴 **Bảng `costings` ⛔ KHÔNG TỒN TẠI trong phép chiếu nhà thầu** — không phải "bị lọc", mà là **không có** |
| 🔴 **Margin** | như trên |
| Dữ liệu tài chính | phép chiếu chỉ có `SubconStatement` — **công nợ CỦA CHÍNH HỌ** |
| Dữ liệu nội bộ Monica | phép chiếu ⛔ không đụng bảng gốc nào |

| 🆕 Tôi bổ sung — đường rò gián tiếp | Cơ chế chặn |
|---|---|
| **Danh tính khách qua mã hàng** | ẩn danh hoá mã hàng theo `DL-063` |
| **Danh tính khách qua shipping mark** | ẩn tới bước đóng gói cuối |
| **Danh tính khách qua cảng đích** | `Shipment` hiện **trạng thái**, ⛔ không hiện cảng |
| **Đơn giá của nhà thầu khác** | phép chiếu ⛔ không có bảng `AssignmentCommercialTerm` của bên thứ ba |
| 🔴 **Hiệu suất của Monica và của nhà thầu khác** | `rm_subcon_performance` **chỉ chứa dòng của chính họ** — ⛔ không có trung bình ngành, không có xếp hạng |

> `DL-064` · **Với cổng đối tác, "che" ⛔ không đủ — phải "KHÔNG TỒN TẠI".**
> `costings` · `margin` · `AssignmentCommercialTerm` của bên khác **⛔ không xuất hiện trong lược đồ mà vai `subcon` có quyền truy cập**. Đây là `DL-057` áp dụng triệt để: quên một dòng lọc ⇒ **không có gì để lộ**.

## 4.3 Phép chiếu tiết lộ — cổng nhà thầu

```
subcon_view.assignment        assignment_no · style_code_masked · qty · dates · status
                              ⛔ KHÔNG có: customer_id · customer_po_no · sell_price
subcon_view.work_schedule     work_center · từ ngày → đến ngày · qty · sequence
subcon_view.line_map          stage · in · out · wip · /giờ · hiệu suất CỦA HỌ · lỗi · ETA
                              ⛔ KHÔNG có: công đoạn Monica · nhà thầu khác
subcon_view.material          issued · received · returned · balance
                              ⛔ KHÔNG có: unit_cost · tồn kho Monica
subcon_view.bundle            bundle_no · size · colour · qty · stage · custody
subcon_view.qa_finding        CHỈ disclosure IN (SUBCON, ALL_PARTIES) ∧ assignment của họ
subcon_view.shipment_status   trạng thái · ngày ⛔ KHÔNG có: cảng · consignee · mark
subcon_view.commercial        đơn giá CỦA HỌ · thành tiền · công nợ CỦA HỌ · kỳ thanh toán
subcon_view.kpi               hiệu suất · DHU · đúng hạn · hao hụt — CHỈ của họ + xu hướng
                              ⛔ KHÔNG có: trung bình ngành · thứ hạng · nhà thầu khác
```

**Bốn luật — kế thừa `DP-1`…`DP-4`, siết thêm cho cổng nhà thầu:**

| # | Luật |
|---|---|
| `SP-1` | 🔴 Vai `subcon` ⛔ **0 quyền `SELECT`** trên mọi bảng gốc — kiểm bằng `pg_privileges` |
| `SP-2` | 🔴 Mọi phép chiếu **lọc theo `assignment_id` đang HIỆU LỰC** — assignment `CLOSED`/`CANCELLED` ⇒ **mất quyền ngay**, ⛔ không có thời gian ân hạn |
| `SP-3` | 🔴 **Bài kiểm hai nhà thầu**: dựng nhà thầu A và B, khẳng định A ⛔ không thấy **một dòng nào** của B — chạy **mỗi vòng** |
| `SP-4` | 🔴 **Bài kiểm tương quan**: nhà thầu có 3 assignment từ 3 khách khác nhau ⇒ khẳng định ⛔ **không suy ra được danh tính khách nào** |

> `SP-4` là bài kiểm **không hệ nào có** và là bài kiểm khó viết nhất. Nó kiểm điều mà lọc dòng ⛔ không kiểm được: **suy luận từ dữ liệu hợp lệ**.

## 4.4 🔴 KPI nhà thầu — chỉ thị của Joseph đã trả lời `BDR-12`

Joseph yêu cầu **KPI** trong Subcontract Portal. Điều này **giải quyết `BDR-12`** *(minh bạch hiệu suất với nhà thầu)* theo hướng **B** mà tôi đã khuyến nghị.

```
subcon_view.kpi   — CHỈ của chính họ, CÓ xu hướng, ⛔ KHÔNG có xếp hạng
├─ Hiệu suất           (output × standard_time) ÷ (nhân lực × phút)
├─ DHU                 lỗi ÷ (số chiếc kiểm ÷ 100)
├─ RFT                 đúng ngay lần đầu
├─ Đúng hạn            assignment hoàn thành đúng cam kết
├─ Hao hụt NPL         (cấp − trả về) ÷ định mức lý thuyết
├─ Tuân thủ báo cáo    % ngày đã nộp báo cáo đúng hạn
└─ Xu hướng 12 tuần    của CHÍNH họ — ⛔ không so với ai
```

> `DL-065` · **Nhà thầu thấy chỉ số CỦA CHÍNH MÌNH và xu hướng CỦA CHÍNH MÌNH — ⛔ KHÔNG thấy thứ hạng.**
>
> Lý do giữ nguyên khuyến nghị `BDR-12`: *"nhà thầu giỏi đòi giá cao hơn"* là **kết quả đúng của một thị trường lành mạnh**, và Monica vẫn có lựa chọn. Nhưng *"nhà thầu ⛔ không biết mình kém"* thì **không có kết quả tốt nào cả**.
>
> ⛔ **Không xếp hạng** vì thứ hạng ① biến hợp tác thành cuộc đua · ② **làm lộ cấu trúc mạng lưới nhà thầu của Monica** — thông tin cạnh tranh thật.

## 4.5 🔴 Trải nghiệm — thiết kế cho quản đốc xưởng, ⛔ không phải cho nhân viên văn phòng

```
╔═══════════════════════════════════╗   ← điện thoại · một tay · tiếng Việt
║ XƯỞNG PHÚ THỊNH      Thứ Ba 04/08 ║
╠═══════════════════════════════════╣
║ 🔴 CHƯA NỘP BÁO CÁO HÔM QUA       ║
║    [ NHẬP NGAY ]                  ║  ← nút to nhất màn hình
╠═══════════════════════════════════╣
║ 🆕 CÔNG VIỆC MỚI                  ║
║ ASG-0148 · 6.200 pcs · giao 26/08 ║
║ 1,42 USD/pc · 8.804 USD           ║  ← giá CỦA HỌ — được xem
║ [ NHẬN ]        [ TỪ CHỐI ]       ║
╠═══════════════════════════════════╣
║ ⚠️ CAPA-091 chờ 4 ngày            ║
║ [ Xem lỗi + ảnh ] [ Phản hồi ]    ║
╠═══════════════════════════════════╣
║ 📦 NPL đã xuất — xác nhận nhận    ║
║ [ ĐÃ NHẬN ]     [ BÁO THIẾU ]     ║
╠═══════════════════════════════════╣
║ 📊 Chuyền 1 · hôm nay 856/994     ║
║    Hiệu suất 78% ▼                ║
╠═══════════════════════════════════╣
║ 💰 Công nợ: 34.280 USD · TT 15/08 ║
╚═══════════════════════════════════╝
 [Việc]  [Line Map]  [NPL]  [Chat]
```

**Sáu ràng buộc trải nghiệm — ⛔ không thương lượng:**

| # | Ràng buộc | Vì sao |
|---|---|---|
| `UX-1` | 🔴 **Nhập sản lượng CHẠY OFFLINE**, đồng bộ khi có mạng, `request_id` chống trùng | Wifi xưởng may **sẽ rớt**. Rớt mạng ⛔ không được dừng ghi sản lượng |
| `UX-2` | 🔴 **Tiếng Việt mặc định**, chữ to, tương phản cao | Người dùng là quản đốc xưởng, ⛔ không phải nhân viên văn phòng |
| `UX-3` | 🔴 **Việc bắt buộc hôm nay ở TRÊN CÙNG**, nút lớn nhất | Báo cáo ngày là **nghĩa vụ hợp đồng**, ⛔ không phải tuỳ chọn |
| `UX-4` | **≤ 3 chạm** để nhập xong sản lượng một chuyền | Họ đang đứng ở chuyền, ⛔ không ngồi bàn |
| `UX-5` | **Mất mạng vẫn hiện số cuối** kèm dấu *"dữ liệu lúc 13:47"* | Màn trắng = ứng dụng bị bỏ |
| `UX-6` | ⛔ **Không có menu sâu, không có tab lồng nhau** | Tối đa hai cấp |

## 4.6 Sẵn sàng vận hành — cấp độ khác Customer Portal

| | Customer Portal | 🔴 Subcontract Portal |
|---|---|---|
| Hỏng thì sao | khách khó chịu | 🔴 **dữ liệu sản xuất ngừng chảy** |
| Mục tiêu sẵn sàng | tiêu chuẩn | 🔴 **cao hơn một bậc** |
| Phương án dự phòng | chờ | 🔴 **BẮT BUỘC** — nhập offline hàng đợi, hoặc SMS/Zalo tối giản |
| Nhịp đồng bộ | 15 phút | 🔴 **thời gian thực khi ghi**, 15 phút khi đọc |

> `DL-066` · **Subcontract Portal là hệ thống TRỌNG YẾU VẬN HÀNH, ⛔ không phải kênh thông tin.**
> Hệ quả: hàng đợi offline · cơ chế nhập dự phòng · giám sát riêng · và **bài kiểm khôi phục sau sự cố**. Customer Portal ⛔ không cần những thứ này.

---

# §5 · CUSTOMER PORTAL — xác nhận thiết kế

Không đổi so với `BDR-03` · `BDR-04`, ghi lại để đối chiếu:

| Được | ⛔ Không được |
|---|---|
| Xem toàn bộ PO của chính họ · tiến độ realtime · Line Map được chia sẻ · QA được chia sẻ · lô hàng · chứng từ · trạng thái hoá đơn · trạng thái thanh toán · dashboard | **Update · Delete · Approve · sửa dữ liệu Monica** |
| **Chat · Gửi Request · Gửi Feedback · Xác nhận** | 🔴 **Chiết tính · biên lợi nhuận · QA nội bộ · định mức đầy đủ · thông tin nhà thầu · đơn khách khác · giá mua NPL** |

**Mọi thay đổi đi qua `CollaborationRequest` → Work Inbox của Monica → workflow nội bộ.** *(`DL-060`)*

**Line Map cho khách — ba lăng kính, cùng một dữ liệu:**

| Chỉ số | 🏭 Monica | 👤 Khách | 🔧 Nhà thầu |
|---|---|---|---|
| % hoàn thành · cộng dồn · **ETA** | ✅ | ✅ | ✅ |
| Input/Output/WIP theo công đoạn | ✅ | ⚠️ chỉ % | ✅ *(của họ)* |
| 🔴 **Hiệu suất · SMV · số công nhân · số máy** | ✅ | ⛔ **KHÔNG** | ⚠️ *(của họ)* |
| Tỷ lệ lỗi | ✅ | ⚠️ chỉ kết quả kiểm cuối | ✅ *(của họ)* |
| Nút thắt · lý do dừng · Andon · hàng sửa lại | ✅ | ⛔ **KHÔNG** | ✅ *(của họ)* |
| 🔴 **Danh tính nhà thầu đang may** | ✅ | ⛔ **KHÔNG** *(`OQ-031`)* | — |

> ⛔ **Khách biết Monica chạy 78% hiệu suất là khách biết chính xác nên ép giá tới đâu.** Hiệu suất là **tình báo năng lực**, ⛔ không phải thông tin tiến độ.

---

# §6 · SUPPLIER PORTAL — năng lực thứ ba

Chỉ thị *nền tảng cộng tác* của Joseph liệt kê Supplier là một trong bảy bên. Ghi nhận là **Business Capability độc lập thứ ba**, cùng Partner Foundation.

| | Nội dung |
|---|---|
| **Ưu tiên** | 🟡 **v2** — sau Customer và Subcontract |
| **Lý do** | Với FOB 30%, số NCC hoạt động thường xuyên ít hơn nhiều so với số khách và số nhà thầu. Giá trị/công thấp hơn |
| ✅ **Xem** | PO mua gửi cho mình · lịch giao · kết quả kiểm vải/phụ liệu lô của mình · công nợ Monica nợ mình |
| ⛔ **Không** | NCC khác · giá NCC khác · **khách hàng cuối** · BOM đầy đủ · đơn hàng · giá bán |
| ⚠️ **Ghi hạn chế** | Xác nhận PO · cập nhật ngày giao dự kiến · tải chứng từ lô · báo chậm giao |
| ⛔ **Không sửa** | Giá đã chốt · số lượng PO · kết quả kiểm hàng |

> ⚠️ **Kiến trúc dựng ngay từ v1** *(phép chiếu · mô hình quyền · vai `supplier`)*, **giao diện dựng ở v2**. Theo Domain Activation Model: `activation = EMBEDDED` — dữ liệu và quyền có sẵn, cổng chưa mở.

---

# §7 · TÁC ĐỘNG LÊN CÁC TÀI LIỆU ĐÃ DUYỆT

| Tài liệu | Thay đổi |
|---|---|
| **EDD-01** §7 *(bảo vệ kiến trúc)* | 🔴 *"Một nền tảng Portal, ba cấu hình"* → **bị `DL-062` thay thế** |
| **EDD-01** Capability Model | `C15.2 Cổng đối tác` tách thành **ba năng lực L2**: `C15.2a Customer Portal` · `C15.2b Subcontract Portal` · `C15.2c Supplier Portal`. **Tổng L2: 91 → 93** |
| **EDD-02** `DL-031` *(chuyền nhà thầu là WorkCenter)* | ✅ **GIỮ NGUYÊN** — tầng dữ liệu |
| **EDD-03** `BDR-06` *(Party, role là thuộc tính)* | ✅ **GIỮ NGUYÊN** — tầng dữ liệu |
| **EDD-03** §7.4 *(phép chiếu tiết lộ)* | ✅ Giữ cơ chế · **nội dung tách thành ba phép chiếu độc lập** |
| **EDD-03** §7.11 *(cộng tác 7 bên)* | ✅ Giữ · bổ sung `DL-063` che danh tính khách |
| **BDR-12** *(minh bạch hiệu suất nhà thầu)* | 🔴 **ĐÃ ĐƯỢC GIẢI QUYẾT** bởi chỉ thị KPI của Joseph → phương án **B không xếp hạng** *(`DL-065`)* |
| **Phase 11** | Portal **kéo về sớm** vào EDD-03A theo chỉ thị |

---

# §8 · DECISION LOG — 5 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-062` | 🔴 **Ba Portal = ba Business Capability độc lập, chung Partner Foundation.** Thay thế đề xuất *"một nền tảng ba cấu hình"* | Người dùng khác nhau về **thiết bị · kết nối · ngôn ngữ · tần suất · quyền ghi · mức trọng yếu** | 🔴 rất khó |
| `DL-063` | **Che danh tính khách hàng là MẶC ĐỊNH; mở là ngoại lệ có hợp đồng** | Nhà thầu biết khách cuối ⇒ có thể tiếp cận trực tiếp ⇒ **Monica bị loại khỏi chuỗi** | ✅ |
| `DL-064` | 🔴 **Với cổng đối tác, "che" ⛔ không đủ — phải "KHÔNG TỒN TẠI"** | Quên một dòng lọc ⇒ ⛔ không có gì để lộ | ⚠️ khó |
| `DL-065` | **Nhà thầu thấy KPI của chính mình + xu hướng; ⛔ KHÔNG thấy thứ hạng** | Giải quyết `BDR-12`. Xếp hạng làm lộ cấu trúc mạng lưới nhà thầu | ✅ |
| `DL-066` | 🔴 **Subcontract Portal là hệ thống TRỌNG YẾU VẬN HÀNH** — offline · dự phòng · giám sát riêng | Hỏng = **mất dữ liệu sản xuất 30–40% sản lượng** | ⚠️ khó |

**Cộng dồn EDD-01 → 03A: 66 quyết định.**

---

# §9 · BOARD DECISION REQUIRED — 2

---

## `BDR-14` · NHÀ THẦU DÙNG CHUNG GIỮA NHIỀU DOANH NGHIỆP

**Vấn đề.** Với đa thuê bao, một xưởng gia công có thể nhận việc từ **Monica** và từ **một doanh nghiệp khác cũng dùng Monica ONE**. Họ có **một tài khoản** hay **hai tài khoản**? Đây là quyết định chiến lược sản phẩm, ⛔ không phải kỹ thuật.

| | **A · Một tài khoản mỗi tenant** *(cô lập tuyệt đối)* | **B · Một danh tính, nhiều tenant** *(mạng lưới nhà thầu)* |
|---|---|---|
| Cách làm | Xưởng có 2 tài khoản, 2 mật khẩu, 2 đường dẫn | Một danh tính, chuyển tenant như chuyển không gian làm việc; ⛔ dữ liệu vẫn cô lập tuyệt đối |
| Ưu | Cô lập tuyệt đối · ⛔ không rủi ro rò chéo · đơn giản · dễ giải thích | 🔴 **Nhà thầu muốn khách hàng của mình dùng Monica ONE** — vì họ đã quen · giảm ma sát · **hiệu ứng mạng phía cung** |
| Nhược | Nhà thầu ghét — 2 mật khẩu, 2 nơi nhập báo cáo ngày · ⛔ không có hiệu ứng mạng | 🔴 **Nếu cô lập sai một chỗ ⇒ lộ dữ liệu chéo DOANH NGHIỆP** — hỏng chết người của SaaS |
| Với Monica | ⛔ Không ảnh hưởng — mới một tenant | ⛔ Không ảnh hưởng hôm nay; **quyết định phải làm SỚM** vì nó đổi mô hình danh tính |
| Với 100 khách | Sản phẩm là công cụ nội bộ từng nhà máy | 🔴 **Sản phẩm thành hạ tầng của một mạng lưới sản xuất** |

> **Khuyến nghị: PHƯƠNG ÁN B, với ba ràng buộc cứng.**
> ① **Danh tính** dùng chung; **dữ liệu cô lập tuyệt đối** theo `TenantScope` *(`MT-1`…`MT-5`)* · ② **Chuyển tenant là hành động tường minh**, ⛔ không bao giờ hiện dữ liệu hai tenant trên cùng một màn hình · ③ **Bài kiểm rò chéo tenant qua danh tính dùng chung** chạy **mỗi vòng**.
>
> Lý do: đây là **hiệu ứng mạng phía cung** — cùng loại giá trị với `BDR-11` nhưng ở phía đối tác. Một xưởng gia công dùng Monica ONE cho ba khách hàng sẽ **đề nghị khách thứ tư dùng Monica ONE**.
>
> ⚠️ **Chỗ tôi có thể sai:** nếu Board đánh giá rủi ro rò chéo doanh nghiệp cao hơn giá trị mạng lưới, A là lựa chọn đúng và ⛔ không có gì phải tiếc — chi phí là sự bất tiện cho nhà thầu, ⛔ không phải mất năng lực.

**🔲 Board chọn: A · B-với-ba-ràng-buộc · B-khác**

---

## `BDR-15` · CHI PHÍ HẠ TẦNG CỔNG ĐỐI TÁC

**Vấn đề.** Cả hai cổng bắt buộc ở v1, và Subcontract Portal là hệ thống trọng yếu vận hành *(`DL-066`)*. Điều này phát sinh chi phí hạ tầng thật: dự phòng, giám sát, hàng đợi offline, tài khoản đối tác. **Ai trả?**

| | **A · Monica chịu toàn bộ** | **B · Tính vào giá gia công / hợp đồng** |
|---|---|---|
| Cách làm | Cổng là chi phí bán hàng và chi phí vận hành của Monica | Điều khoản hợp đồng: đối tác dùng cổng, chi phí phản ánh trong đơn giá |
| Ưu | ⛔ Không ma sát khi triển khai · nhà thầu và khách dùng ngay | Chi phí minh bạch · khi thương mại hoá, **mô hình giá theo số tài khoản đối tác** rõ ràng |
| Nhược | 🔴 Chi phí tăng tuyến tính theo số đối tác — với 40 nhà thầu là chi phí thật | Ma sát khi triển khai · nhà thầu nhỏ có thể từ chối |
| Với Monica | Đơn giản, đúng giai đoạn đầu | Phức tạp không cần thiết bây giờ |
| Với 100 khách | 🔴 **Mô hình giá SaaS ⛔ không rõ** — bán theo cái gì? | 🔴 **Mô hình giá rõ**: theo tenant + theo số tài khoản đối tác hoạt động |

> **Khuyến nghị: A cho Monica hôm nay, và THIẾT KẾ ĐO ĐẠC ngay từ v1.**
> Cụ thể: đếm **tài khoản đối tác hoạt động**, **dung lượng lưu trữ**, **lượt gọi** theo tenant — ⛔ **không tính tiền**, chỉ **đo**. Khi thương mại hoá, mô hình giá dựa trên số liệu thật thay vì phỏng đoán.
>
> ⚠️ Đây là quyết định **chiến lược thương mại**, ⛔ không phải kỹ thuật — nên tôi trình thay vì tự quyết. Chi phí thiết kế đo đạc ngay: gần bằng 0. Chi phí thêm sau: phải rà lại toàn bộ để biết đo cái gì.

**🔲 Board chọn: A-có-đo-đạc · A-không-đo · B**

---

# §10 · TÓM TẮT

## 10.1 Đã bàn giao

| Nội dung | Khối lượng |
|---|---|
| Ghi nhận sai lầm thiết kế trước + bằng chứng | §1 |
| Kiến trúc ba cổng — chung nền, riêng thân | §2 |
| Mô hình quyền — vì sao ⛔ không thể chung · **tấn công tương quan** | §3 |
| **Subcontract Portal đầy đủ** — 11 năng lực · 11 điều bị chặn · phép chiếu · 4 luật · KPI · 6 ràng buộc trải nghiệm · sẵn sàng vận hành | §4 |
| Customer Portal xác nhận · Line Map ba lăng kính | §5 |
| Supplier Portal — năng lực thứ ba | §6 |
| Tác động lên tài liệu đã duyệt | §7 |

**Quyết định tự ra:** 5 *(cộng dồn 66)* · **Cần Board quyết:** 2 · **Đã giải quyết:** `BDR-12`

## 10.2 Ba điểm đáng nhớ

| # | Điểm |
|---|---|
| **1** | 🔴 **Tôi đã so sánh hai cổng bằng CƠ CHẾ KỸ THUẬT thay vì bằng NGƯỜI DÙNG THẬT.** Merchandiser ở văn phòng Hồng Kông và quản đốc xưởng ở Nam Định ⛔ không thể dùng chung một trải nghiệm — và **mức trọng yếu vận hành của hai cổng chênh nhau một bậc** |
| **2** | 🔴 **Với cổng đối tác, "che" ⛔ không đủ — phải "KHÔNG TỒN TẠI".** `costings` và `margin` ⛔ không xuất hiện trong lược đồ mà vai `subcon` truy cập được. Quên một dòng lọc ⇒ ⛔ không có gì để lộ |
| **3** | 🔴 **Tấn công tương quan là rủi ro mà lọc dòng ⛔ không chặn được.** Nhà thầu có 3 assignment có thể suy ra danh tính khách từ mã hàng, shipping mark, cảng đích. `SP-4` là bài kiểm ⛔ không hệ nào có |

## 10.3 Trạng thái

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

**Tiếp theo:** EDD-04 — Phase 8 Workflow Engine · Phase 9 Rule Engine · Phase 10 Permission.
⚠️ Phase 10 Permission nay **kế thừa trực tiếp** ba mô hình quyền của EDD-03A.

---

## THAM CHIẾU

- **Board Additional Decision** 04/08/2026 — Subcontract Portal
- **Board Decision EDD-02 Review** — `BDR-03` · `BDR-04` Customer Portal
- [EDD-01](EDD-01-BUSINESS-CAPABILITY-DOMAIN.md) · [EDD-02](EDD-02-MASTER-DATA-BUSINESS-OBJECT.md) · [EDD-03](EDD-03-DOCUMENT-INFORMATION-ARCHITECTURE.md)
- [`BUSINESS_KNOWLEDGE_BASE.md`](../business/BUSINESS_KNOWLEDGE_BASE.md) Phần D — `BR-ACC-003` · `BR-ACC-004` · `BR-ACC-005` · `BR-ACC-006` · `OQ-031`
- [`ENGINEERING_PLAYBOOK.md`](../ENGINEERING_PLAYBOOK.md) Điều XXX — phân quyền theo Assignment
- Migration `026` — chặn nhà thầu tự tạo Assignment ở tầng CSDL
