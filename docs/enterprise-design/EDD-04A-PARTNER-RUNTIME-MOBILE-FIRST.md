# EDD-04A · TU CHÍNH A
## PARTNER RUNTIME
### Danh tính đa thuê bao · Đo đạc sử dụng · Kiến trúc Mobile First

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-04A · Tu chính của [EDD-04](EDD-04-WORKFLOW-RULE-PERMISSION.md) |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Nguồn thẩm quyền** | Board Decision `BDR-18` ✅ · `BDR-19` ✅ · **Board Additional Request — Mobile First** |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §0 · QUYẾT ĐỊNH ĐÃ HẤP THỤ

| Quyết định | Nội dung | Thi hành ở |
|---|---|---|
| `BDR-18` ✅ | **Một Subcontract · một Identity · một Party Number** · làm việc cho nhiều Tenant · Portal hỗ trợ **Tenant Context** · ⛔ không tạo nhiều tài khoản cho cùng một doanh nghiệp | §1 |
| `BDR-19` ✅ | Monica chịu chi phí giai đoạn đầu · **đo 6 chỉ số**: Active User · Storage · API Usage · Message · Attachment · **AI Usage** | §2 |
| 🔴 **Additional Request** | **Subcontract Portal = MOBILE FIRST.** ⛔ Không thiết kế desktop rồi thu nhỏ. *"Portal quan trọng nhất đối với hoạt động sản xuất"* | §3 |

---
---

# §1 · DANH TÍNH ĐỐI TÁC ĐA THUÊ BAO — thi hành `BDR-18`

## 1.1 Ba tầng — tách bạch để vừa dùng chung vừa cô lập

Chỉ thị *"một Party Number, nhiều Tenant"* đòi một mô hình ba tầng. Gộp lại là **lộ dữ liệu chéo doanh nghiệp**.

```
╔═ TẦNG 1 · TOÀN CỤC ═══════════════════════════════════════════════════════╗
║  GlobalParty          tenant_id = NULL · TỐI THIỂU, chỉ danh tính pháp lý  ║
║  ├─ 🔴 party_number   MỘT SỐ HIỆU DUY NHẤT TOÀN NỀN TẢNG                  ║
║  ├─ tax_id (duy nhất) · legal_name · country                              ║
║  └─ status: ACTIVE | MERGED | BLOCKED                                     ║
║                                                                           ║
║  PartnerIdentity      thông tin đăng nhập                                 ║
║  ├─ identity_id · global_party_id · email/phone · 🔴 MFA BẮT BUỘC         ║
║  └─ preferred_language · preferred_device                                 ║
╠═ TẦNG 2 · THÀNH VIÊN ═════════════════════════════════════════════════════╣
║  TenantMembership     identity × tenant                                   ║
║  ├─ identity_id · tenant_id · local_party_id                              ║
║  ├─ roles[] · status: INVITED | ACTIVE | SUSPENDED | REVOKED              ║
║  └─ joined_at · revoked_at                                                ║
╠═ TẦNG 3 · HỒ SƠ THEO TENANT — 🔴 CÔ LẬP TUYỆT ĐỐI ════════════════════════╣
║  TenantPartyProfile   MỖI TENANT MỘT BẢN, ⛔ KHÔNG BAO GIỜ dùng chung     ║
║  ├─ điều khoản thương mại · đơn giá gia công · công nợ                    ║
║  ├─ WorkCenter · năng lực · Assignment · lịch sử chất lượng · KPI         ║
║  └─ hồ sơ · tài liệu · hội thoại                                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

| Tầng | Dùng chung? | Vì sao |
|---|---|---|
| **1 · GlobalParty** | ✅ dùng chung | *"Một Party Number"* — chỉ thị Joseph |
| **1 · PartnerIdentity** | ✅ dùng chung | *"⛔ không tạo nhiều tài khoản cho cùng một doanh nghiệp"* |
| **2 · TenantMembership** | ⚠️ nối | Mỗi tenant cấp/thu hồi độc lập |
| **3 · TenantPartyProfile** | 🔴 **⛔ TUYỆT ĐỐI KHÔNG** | Đơn giá, công nợ, KPI, Assignment của tenant A ⛔ không bao giờ chạm tenant B |

> `DL-083` · **Danh tính dùng chung, hồ sơ cô lập.** Đây là cách duy nhất thoả đồng thời *"một Party Number"* và *"cô lập đa thuê bao"* — hai yêu cầu nhìn thì mâu thuẫn, thực ra ở hai tầng khác nhau.

## 1.2 🔴 Lỗ rò tôi phải nêu — sổ đăng ký toàn cục làm lộ quan hệ

Nếu tenant A **tra cứu được** `GlobalParty`, họ biết *"xưởng Phú Thịnh đã có trong hệ thống"* ⇒ suy ra **xưởng này đang làm cho một doanh nghiệp khác**. Đó là thông tin cạnh tranh thật.

```
🔴 LUẬT CHỐNG SUY LUẬN

⛔ CẤM:  tenant tìm kiếm / duyệt / đếm trên GlobalParty
⛔ CẤM:  thông báo lỗi phân biệt "đã tồn tại" ⟷ "chưa tồn tại"
⛔ CẤM:  API trả về party_number của bên chưa là đối tác của tenant đó

✅ CÁCH THÊM ĐỐI TÁC — luồng LỜI MỜI, ⛔ không phải luồng TÌM KIẾM:
   ① Tenant nhập mã số thuế + tên + email liên hệ
   ② Hệ thống ÂM THẦM: khớp GlobalParty theo tax_id, hoặc tạo mới
   ③ Gửi LỜI MỜI tới email/điện thoại đối tác
   ④ Đối tác chấp nhận ⇒ TenantMembership ACTIVE
   ⑤ 🔴 Tenant KHÔNG BAO GIỜ biết bước ② đã khớp hay đã tạo mới
```

> `DL-084` · **Luồng LỜI MỜI, ⛔ không phải luồng TÌM KIẾM.** Thông báo phản hồi **giống hệt nhau** dù đối tác đã tồn tại hay chưa. Một thông báo lỗi khác nhau là một kênh rò rỉ.
>
> ⚠️ Đây là loại lỗ hổng ⛔ không lộ ra khi kiểm phân quyền thông thường — nó rò qua **sự khác biệt của phản hồi**, không qua dữ liệu trả về.

## 1.3 Tenant Context trên Portal

```
╔═══════════════════════════════════╗
║  XƯỞNG PHÚ THỊNH                  ║
║  ┌─────────────────────────────┐  ║
║  │ 🏢 Monica Garment        ● 3│  ║  ← đang chọn · 3 việc
║  │ 🏢 Công ty May An Phát   ● 1│  ║  ← chuyển tenant
║  └─────────────────────────────┘  ║
╠═══════════════════════════════════╣
║  ⛔ CHỈ dữ liệu của tenant đang chọn ║
╚═══════════════════════════════════╝
```

**Bốn luật Tenant Context:**

| # | Luật | Vì sao |
|---|---|---|
| `TC-1` | 🔴 **⛔ KHÔNG BAO GIỜ hiện dữ liệu hai tenant trên cùng một màn hình** | Kể cả tổng hợp. *"Tổng công nợ 62.000 USD"* gộp hai tenant là **đã rò** |
| `TC-2` | **Chuyển tenant là hành động tường minh** — có xác nhận, đổi màu nhận diện | ⛔ Không nhầm lẫn ngữ cảnh khi nhập sản lượng |
| `TC-3` | ⚠️ **Chỉ số việc chờ hiện theo tenant, ⛔ không cộng gộp** | Con số gộp là một phép rò tinh vi |
| `TC-4` | 🔴 **Phiên gắn `tenant_id`**; chuyển tenant ⇒ **cấp phiên mới**, xoá bộ đệm cục bộ của tenant cũ | Bộ đệm ngoại tuyến là nơi dữ liệu hai tenant có thể gặp nhau |

> `TC-4` là luật quan trọng nhất và là chỗ **ngoại tuyến gặp đa thuê bao** — §3.3.

## 1.4 Thu hồi và bảo mật

| Tình huống | Xử lý |
|---|---|
| Tenant A thu hồi đối tác | `TenantMembership` → `REVOKED` · 🔴 **huỷ phiên NGAY** *(`DL-078`)* · **xoá bộ đệm ngoại tuyến của tenant đó** · Tenant B ⛔ không ảnh hưởng |
| Đối tác rời bỏ nhân viên | Thu hồi `PartnerIdentity` của người đó · các identity khác của cùng Party ⛔ không ảnh hưởng |
| 🔴 **Danh tính bị chiếm** | **MỌI tenant bị ảnh hưởng** ⇒ 🔴 **MFA bắt buộc, ⛔ không phải tuỳ chọn** · thông báo mọi tenant · khoá toàn bộ membership |
| Đối tác ngừng hoạt động | `GlobalParty` → `BLOCKED` · mọi membership treo · dữ liệu giữ theo `M68` |

> `DL-085` · **MFA là BẮT BUỘC với mọi `PartnerIdentity` làm việc cho ≥2 tenant.**
> Danh tính dùng chung khuếch đại hậu quả: một mật khẩu yếu ở xưởng nhỏ mở cửa vào **nhiều doanh nghiệp**. Đây là cái giá của lợi ích mạng lưới, và nó phải trả bằng MFA.
> ⚠️ Với xưởng chỉ làm cho một tenant, MFA vẫn **khuyến nghị mạnh** nhưng tenant quyết.

---
---

# §2 · ĐO ĐẠC SỬ DỤNG — thi hành `BDR-19`

## 2.1 Sáu chỉ số — định nghĩa chính xác

> 🔴 **Chỉ số định nghĩa mơ hồ tạo ra mô hình giá vô dụng.** *"Active User"* có bốn cách hiểu và bốn con số khác nhau.

| # | Chỉ số | 🔴 Định nghĩa chính xác | Chu kỳ | Chiều |
|---|---|---|---|---|
| **1** | **Active User** | Số `PartnerIdentity` **riêng biệt** có **≥1 hành động ghi** *(⛔ không tính đăng nhập, ⛔ không tính xem)* trong kỳ | tháng | tenant · party |
| **2** | **Storage** | Byte của **tệp đính kèm + media**, tính theo bản gốc sau nén, ⛔ không tính bản kết xuất tạm | ngày *(đỉnh)* | tenant · party · loại media |
| **3** | **API Usage** | Số lượt gọi có xác thực · **tách đọc ⟷ ghi** · ⛔ không tính lượt thăm dò sức khoẻ | ngày | tenant · điểm cuối |
| **4** | **Message** | Tin nhắn trong `Thread` + `CollaborationRequest` · ⛔ không tính thông báo hệ thống | tháng | tenant · party |
| **5** | **Attachment** | **Số lượng** tệp *(khác chỉ số 2 đo dung lượng)* · tách ảnh · video · âm thanh · tài liệu | tháng | tenant · party · loại |
| **6** | 🔴 **AI Usage** | **Token vào + token ra**, tách theo **mục đích** *(mô tả · chẩn đoán · dự báo · đề xuất)*. Đắt nhất và biến động nhất | ngày | tenant · mục đích · mô hình |

## 2.2 Kiến trúc đo đạc

```
UsageEvent  (chỉ ghi thêm, tách vật lý khỏi dữ liệu nghiệp vụ)
├─ tenant_id · party_id? · identity_id?
├─ meter_code · quantity · unit · occurred_at
├─ dimension JSONB   ← loại media, điểm cuối, mục đích AI
└─ 🔴 KHÔNG chứa nội dung nghiệp vụ nào
      ▼ tổng hợp mỗi giờ
UsageRollup  tenant × meter × ngày × chiều → tổng · đỉnh · phân vị
```

**Bốn luật đo đạc:**

| # | Luật | Vì sao |
|---|---|---|
| `MTR-1` | 🔴 **Đo đạc ⛔ KHÔNG BAO GIỜ chặn nghiệp vụ.** Hàng đợi không đồng bộ; hỏng thì mất số đo, ⛔ không mất giao dịch | ⛔ Không ai được mất một bản ghi sản lượng vì hệ thống tính tiền hỏng |
| `MTR-2` | 🔴 **`UsageEvent` ⛔ không chứa nội dung nghiệp vụ** — chỉ định danh và số lượng | Nếu chứa, dữ liệu tính tiền thành bản sao mật thứ hai *(cùng lập luận `DL-075`)* |
| `MTR-3` | **Loại dữ liệu: `MONICA_DATA`** · lưu 3 năm · sao lưu đầy đủ | `BDR-13` |
| `MTR-4` | 🔴 **Tổng hợp, ⛔ không giám sát cá nhân** — xem §2.4 | |

## 2.3 Sáu chỉ số này chống được mô hình giá nào

| Mô hình giá | Chỉ số cần | Đánh giá |
|---|---|---|
| Theo tenant *(giá cố định theo bậc quy mô)* | 1 · 2 | ✅ đơn giản, dễ bán |
| Theo người dùng hoạt động | 1 | ⚠️ **phạt nhà máy số hoá sâu** — nghịch với mục tiêu sản phẩm |
| 🔴 **Theo tài khoản đối tác hoạt động** | 1 *(chiều party)* | ✅ **Khớp giá trị thật** — cổng đối tác là DNA của Monica ONE |
| Theo mức dùng *(storage · AI)* | 2 · 6 | ✅ **bắt buộc cho AI** — chi phí biến động lớn |
| Hỗn hợp: nền + đối tác + AI theo mức dùng | 1 · 2 · 6 | ⭐ **Khả năng cao nhất** |

> `DL-086` · **Đo cả sáu ngay từ v1, ⛔ không tính tiền.** Sau 12 tháng có số liệu thật ⇒ mô hình giá dựa trên **dữ liệu**, ⛔ không phải phỏng đoán. Chi phí thiết kế ngay ≈ 0; thêm sau phải rà lại toàn bộ để biết đo cái gì.

## 2.4 🔴 Ranh giới đạo đức — đo đạc ⛔ không được thành giám sát lao động

```
✅ ĐƯỢC:  "Xưởng Phú Thịnh · 12 người dùng hoạt động · 340 ảnh · 2,1 GB tháng 8"
⛔ CẤM:   "Nguyễn Văn A đăng nhập 7h02, nhập 4 lần, ngừng 11h30, đăng nhập lại 13h15"
```

> `DL-087` · **Đo đạc tổng hợp ở cấp TENANT và PARTY. ⛔ Không bao giờ báo cáo hành vi cá nhân của nhân viên đối tác cho mục đích thương mại.**
>
> Ba lý do: ① Nhân viên xưởng gia công ⛔ **không phải nhân viên Monica** — theo dõi họ vượt quá quan hệ hợp đồng · ② Nhiều nước có luật bảo vệ dữ liệu lao động · ③ Nếu nhà thầu nghi Portal là công cụ giám sát, **họ sẽ ngừng nhập liệu trung thực** — và Monica mất đúng thứ Portal sinh ra để có.
>
> ⚠️ **Phân biệt:** `AuditEntry` *(ai làm gì — bằng chứng pháp lý, `BDR-14`)* và `UsageEvent` *(bao nhiêu — cơ sở tính tiền)* là **hai dòng chảy tách biệt, hai mục đích, hai quyền truy cập**. ⛔ Không trộn.

---
---

# §3 · KIẾN TRÚC MOBILE FIRST — thi hành Board Additional Request

> Joseph: *"⛔ Không thiết kế theo tư duy Desktop rồi thu nhỏ xuống Mobile. Đây là Portal quan trọng nhất đối với hoạt động sản xuất."*

## 3.1 Mobile First nghĩa là gì ở tầng KIẾN TRÚC

Mobile-first ⛔ **không phải** một quyết định giao diện. Nó là **năm quyết định kiến trúc**:

| # | Tầng | Desktop-first *(sai)* | 🔴 Mobile-first *(đúng)* |
|---|---|---|---|
| 1 | **Dữ liệu** | máy chủ là nguồn duy nhất, luôn trực tuyến | 🔴 **Thiết bị có bản sao cục bộ + hàng đợi ghi** |
| 2 | **Đồng bộ** | yêu cầu–phản hồi | 🔴 **Bất đồng bộ, chống trùng, xử lý xung đột tường minh** |
| 3 | **Media** | tải lên tệp | 🔴 **Đường ống thu nhận có băm tại nguồn** |
| 4 | **Định danh** | gõ mã | 🔴 **Quét QR/mã vạch, phân giải được khi ngoại tuyến** |
| 5 | **Tương tác** | chuột · bàn phím · di chuột | 🔴 **Ngón cái · một tay · ⛔ không gõ phím** |

> `DL-088` · **Mobile-first là quyết định TẦNG DỮ LIỆU, ⛔ không phải tầng giao diện.**
> Bằng chứng: nếu chỉ đổi CSS mà mô hình dữ liệu vẫn *"máy chủ là nguồn duy nhất, luôn trực tuyến"*, thì mất wifi ⇒ màn hình trắng ⇒ **quản đốc ghi ra giấy** ⇒ Monica ONE mất dữ liệu sản xuất. Đúng thứ Portal sinh ra để tránh.

## 3.2 🔴 Ngoại tuyến — QUAN SÁT ghi được, CAM KẾT thì không

Đây là quy tắc cốt lõi của thiết kế ngoại tuyến, và tôi ⛔ không thấy hệ ERP nào phát biểu rõ:

```
🟢 QUAN SÁT — "điều này ĐÃ xảy ra"        ✅ GHI ĐƯỢC KHI NGOẠI TUYẾN
   · sản lượng theo giờ / công đoạn / bó
   · sự cố dừng chuyền + lý do
   · xác nhận đã nhận NPL
   · ảnh · video · ghi âm
   · nháp báo cáo ngày
   · quét QR bó · quét mã vạch cuộn
   ▶ Sự thật ĐÃ tồn tại ở thế giới thật. Mạng chỉ là đường truyền tin.

🔴 CAM KẾT — "tôi ĐỒNG Ý điều này"         ⛔ BẮT BUỘC TRỰC TUYẾN
   · CHẤP NHẬN / TỪ CHỐI Assignment
   · gửi CollaborationRequest
   · xác nhận số liệu công nợ
   · nộp báo cáo ngày (nháp thì ngoại tuyến, NỘP thì trực tuyến)
   ▶ Sự thật chỉ tồn tại KHI HAI BÊN CÙNG BIẾT.
```

> `DL-089` · **Ghi ngoại tuyến cho QUAN SÁT; bắt buộc trực tuyến cho CAM KẾT.**
>
> Ví dụ vì sao: nhà thầu **chấp nhận** một Assignment lúc 8h khi ngoại tuyến, đồng bộ lúc 14h. Trong 6 giờ đó Monica tưởng họ ⛔ không nhận và **đã giao cho xưởng khác**. Giờ hai xưởng cùng làm một lô.
>
> Ngược lại, *"chuyền 1 ra 128 chiếc lúc 10h"* là **sự thật đã xảy ra** — ghi lúc nào ⛔ không đổi bản chất, chỉ đổi độ trễ thông tin.

## 3.3 Giao thức đồng bộ và xử lý xung đột

```
┌── THIẾT BỊ ─────────────────────────────────────────────┐
│  Bộ đệm đọc (theo TENANT, mã hoá)                       │
│  ├─ Assignment · Bundle · WorkCenter    TTL 24h         │
│  ├─ Line Map · sản lượng hôm nay        TTL 15 phút     │
│  └─ Thương mại (đơn giá · công nợ)      TTL 1h          │
│                                                          │
│  🔴 Hàng đợi ghi (bền, có thứ tự, chống trùng)          │
│  ├─ mỗi mục: request_id UUID sinh TRÊN THIẾT BỊ         │
│  ├─ device_captured_at + server_received_at             │
│  └─ thử lại luỹ thoái · ⛔ không bao giờ tự bỏ           │
└──────────────────────┬──────────────────────────────────┘
                       │ có mạng
┌── MÁY CHỦ ───────────▼──────────────────────────────────┐
│  ① Bắt 23505 trên request_id ⇒ TRẢ VỀ BẢN CŨ, ok:true   │
│  ② Kiểm phạm vi LẠI (assignment còn hiệu lực không?)     │
│  ③ Phát hiện xung đột ⇒ §dưới                           │
└─────────────────────────────────────────────────────────┘
```

### 🔴 Xung đột dữ liệu sản xuất — **⛔ không bao giờ ghi đè im lặng**

```
Cùng khoá (work_center, ngày, giờ, công đoạn) được gửi hai lần, giá trị khác nhau:

❌ SAI:  bản sau đè bản trước         ⇒ MẤT DỮ LIỆU, ⛔ không ai biết
❌ SAI:  từ chối bản sau              ⇒ người dùng mất công nhập, sẽ ngừng nhập
✅ ĐÚNG: bản sau thành ĐỀ NGHỊ ĐIỀU CHỈNH
         · bản gốc GIỮ NGUYÊN
         · sinh WorkItem cho tổ trưởng/quản đốc duyệt
         · duyệt ⇒ bút toán điều chỉnh (⛔ không sửa bản gốc)
```

> `DL-090` · **Xung đột dữ liệu sản xuất giải bằng CHỨNG TỪ ĐIỀU CHỈNH, ⛔ không bằng ghi đè.**
> Nhất quán với `DOC-1` *(chứng từ chốt ⛔ không sửa)* và `IM-1` *(sổ chỉ-ghi-thêm)*. **Ghi đè im lặng là cách hệ thống mất dữ liệu mà ⛔ không ai phát hiện ra.**

### 🔴 Bộ đệm ngoại tuyến gặp đa thuê bao

| # | Luật |
|---|---|
| `OC-1` | 🔴 **Bộ đệm phân vùng theo `tenant_id`**, mã hoá bằng khoá dẫn xuất từ phiên |
| `OC-2` | 🔴 **Chuyển tenant ⇒ XOÁ bộ đệm tenant cũ** *(`TC-4`)* — ⛔ không giữ song song |
| `OC-3` | 🔴 **Thu hồi membership ⇒ xoá từ xa** bộ đệm của tenant đó ở lần kết nối kế tiếp |
| `OC-4` | **Bộ đệm có hạn tối đa 7 ngày** kể cả ⛔ không kết nối được — hết hạn thì xoá, ⛔ không hiện dữ liệu cũ |
| `OC-5` | 🔴 **Hàng đợi GHI ⛔ không bị xoá** khi thu hồi — nó chứa **sự thật đã xảy ra**; đồng bộ xong mới xoá, kèm cờ *"gửi sau khi thu hồi"* để rà soát |

> `OC-5` là chỗ tinh tế: **thu hồi quyền ⛔ không được làm mất dữ liệu sản xuất đã ghi**. Nhà thầu bị chấm dứt hợp đồng vẫn phải nộp được sản lượng của những ngày họ đã làm.

## 3.4 🔴 Media là BẰNG CHỨNG — băm tại nguồn

Joseph yêu cầu **chụp ảnh · quay video · gửi voice**. Với Hiến pháp Điều 8 và `BDR-09`, media ⛔ không phải tệp đính kèm — nó là **bằng chứng**.

```
Thu nhận trên thiết bị
   ① Chụp/quay/ghi âm
   ② 🔴 BĂM NGAY TRÊN THIẾT BỊ, TRƯỚC KHI NÉN, TRƯỚC KHI GỬI
   ③ Gắn siêu dữ liệu: thời điểm thiết bị · người · assignment · đối tượng nghiệp vụ
   ④ Nén để gửi (giữ bản gốc tới khi máy chủ xác nhận)
   ⑤ Xếp hàng đợi, tải lên có thể tiếp tục sau khi gián đoạn
   ▼
Máy chủ  · xác minh băm  · gắn vào Evidence  · ⛔ KHÔNG SỬA ĐƯỢC (BDR-09)
```

> `DL-091` · **Băm tại thời điểm THU NHẬN, ⛔ không phải lúc tải lên.**
> Băm lúc tải lên chỉ chứng minh *"tệp ⛔ không đổi trên đường truyền"*. Băm lúc chụp chứng minh *"ảnh này chính là ảnh đã chụp lúc 14:02"* — **đó mới là thứ có giá trị trong tranh chấp**.

| Loại media | Ràng buộc | Ghi chú |
|---|---|---|
| 📷 **Ảnh** | nén tới ~1,5MB · 🔴 **giữ nguyên dấu thời gian** · gợi ý đặt thước đo trong khung | *"Ảnh bằng chứng ⛔ không có tỷ lệ là bằng chứng yếu"* |
| 🎥 **Video** | tối đa 60 giây · nén mạnh · tải lên nền | Dùng cho sự cố chuyền, thao tác sai |
| 🎙️ **Ghi âm** | tối đa 120 giây · **tiếng Việt** | 🔴 **Bản gốc âm thanh LÀ hồ sơ.** Phiên âm là `AI_GENERATED`, **hỗ trợ, ⛔ không thay thế** *(`DL-032`)* |
| 📄 Tài liệu | ảnh chụp chứng từ giấy | |

> 🔴 **Ghi âm là năng lực Joseph yêu cầu mà tôi thấy có giá trị đặc biệt:** quản đốc đang đứng ở chuyền, tay bẩn, mô tả sự cố **nhanh hơn gõ 10 lần**. Và bản ghi âm giữ được **ngữ điệu và mức độ khẩn cấp** mà văn bản mất.

## 3.5 🔴 QR và mã vạch — cách lấy dữ liệu cấp bó mà ⛔ không gõ phím

Đây là mắt xích nối **chỉ thị Mobile First** với **năng lực Monica đã có** *(theo dõi tới bó × công đoạn × giờ)*.

| Đối tượng | Mã | Quét để làm gì |
|---|---|---|
| **Bó** | QR trên thẻ bó *(`DOC-42`)* | 🔴 **Báo sản lượng công đoạn** · xem lịch sử bó · chuyển công đoạn |
| **Cuộn vải** | mã vạch của NCC + mã nội bộ | Xác nhận nhận · cấp phát · trả về |
| **Thùng** | QR trên nhãn thùng | Đóng gói · kiểm container |
| **WorkCenter** | QR dán tại chuyền | Chấm ca · mở màn hình chuyền |
| **Assignment** | QR trên phiếu giao việc | Mở nhanh trên điện thoại |

```
🔴 NỘI DUNG MÃ — CHỈ ĐỊNH DANH MỜ, ⛔ KHÔNG DỮ LIỆU NGHIỆP VỤ

✅ ĐÚNG:  MON1:B:7f3a9c2e:4b
          tiền tố · loại · id mờ · tổng kiểm

⛔ SAI:   {"bundle":"B-2588-M-NVY","style":"ZR-2601","customer":"Zara","qty":40}
          ▲ ảnh chụp thẻ bó lọt ra ngoài = lộ khách hàng
```

> `DL-092` · **Mã chỉ chứa định danh mờ.** Thẻ bó là **vật thể vật lý rời khỏi nhà máy** — đi theo hàng tới xưởng in, xưởng thêu, nhà thầu. Mã chứa tên khách là vi phạm `DL-063` *(che danh tính khách)* ở dạng vật lý ⛔ không thu hồi được.
>
> 🔴 **Phân giải ngoại tuyến:** thiết bị đệm sẵn bó thuộc assignment của mình ⇒ **quét vẫn chạy khi mất mạng**. Quét mã ⛔ không thuộc phạm vi ⇒ *"⛔ không thuộc công việc của bạn"*, ⛔ không tiết lộ gì thêm.

## 3.6 Ràng buộc tương tác — thiết kế cho tay bẩn, một tay, đứng

| # | Ràng buộc | Con số |
|---|---|---|
| `UX-1` | 🔴 **Vùng ngón cái** — mọi hành động chính ở **nửa dưới** màn hình | |
| `UX-2` | **Vùng chạm tối thiểu** | ≥ 48×48 dp · cách nhau ≥ 8dp |
| `UX-3` | 🔴 **⛔ Không gõ phím cho số liệu** — nút tăng/giảm · giá trị đặt sẵn · bàn phím số lớn | |
| `UX-4` | 🔴 **≤ 3 chạm** để nhập xong sản lượng một chuyền | |
| `UX-5` | **⛔ Không di chuột, ⛔ không chuột phải, ⛔ không phím tắt** | |
| `UX-6` | 🔴 **⛔ Không menu sâu** — tối đa **hai** cấp |
| `UX-7` | **Tương phản cao** — xưởng may sáng chói hoặc tối | ≥ 7:1 |
| `UX-8` | 🔴 **Thao tác không đảo ngược cần vuốt xác nhận**, ⛔ không phải một chạm | Ngón tay bẩn chạm nhầm |
| `UX-9` | 🔴 **Tiếng Việt mặc định**, chữ ≥ 16px | |
| `UX-10` | 🔴 **Trạng thái CHỜ GỬI hiện rõ** — *"3 mục chờ gửi"* | Người dùng phải biết dữ liệu đã tới chưa |

## 3.7 Ngân sách mạng và thiết bị

| Hạng mục | Ngân sách | Vì sao |
|---|---|---|
| Tải lần đầu | ≤ 300 KB | 3G yếu ở khu công nghiệp |
| Chuyển màn hình | ≤ 50 KB | |
| Ảnh sau nén | ~1,5 MB | Cân bằng bằng chứng ⟷ băng thông |
| 🔴 **Thời gian tới màn hình đầu, 3G** | **≤ 3 giây** | Quá 3 giây là quản đốc bỏ |
| Thiết bị đích | Android tầm thấp, RAM 2GB, trình duyệt cũ 2 năm | ⛔ Không phải iPhone mới |
| 🔴 **Mất mạng** | **Hiện số liệu cuối + dấu thời gian** | ⛔ **Màn hình trắng = ứng dụng bị bỏ vĩnh viễn** |

## 3.8 PWA hay ứng dụng gốc — quyết định

| | **PWA** ⭐ | **Ứng dụng gốc** |
|---|---|---|
| Cài đặt | mở link, thêm vào màn hình chính | qua cửa hàng ứng dụng |
| Cập nhật | tức thì | phụ thuộc người dùng cập nhật |
| Camera · QR | ✅ đủ dùng | ✅ tốt hơn chút |
| Ngoại tuyến | ✅ service worker + IndexedDB | ✅ tốt hơn |
| Chi phí | **một mã nguồn** | 2 mã nguồn + cửa hàng |
| Ma sát với đối tác | 🔴 **rất thấp** | 🔴 **cao — xưởng nhỏ ngại cài app** |

> `DL-093` · **PWA.** Ba lý do: ① Đối tác là **hàng chục xưởng nhỏ** — ma sát cài đặt là rào cản thật · ② **Cập nhật tức thì** quan trọng với hệ trọng yếu vận hành · ③ ✅ **Monica ĐÃ có nền PWA** — commit `541309c6` *"đóng gói thành ứng dụng doanh nghiệp cài được"*.
>
> ⚠️ **Chỗ tôi có thể sai:** nếu về sau cần quét mã vạch liên tục tốc độ cao *(kho lớn)* hoặc chạy nền lâu, PWA sẽ chạm giới hạn. Khi đó dựng **ứng dụng gốc mỏng bọc PWA**, ⛔ không viết lại.

## 3.9 Màn hình chính

```
╔═══════════════════════════════════╗
║ 🏢 Monica Garment ▾   📶 ⚠️ 3 chờ ║  ← tenant · trạng thái mạng · hàng đợi
╠═══════════════════════════════════╣
║ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║ ┃  📊  NHẬP SẢN LƯỢNG          ┃  ║  ← nút lớn nhất, vùng ngón cái
║ ┃      Chuyền 1 · 10h chưa nhập┃  ║
║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║ ┃  📷  QUÉT BÓ                 ┃  ║
║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
╠═══════════════════════════════════╣
║ 🔴 CHƯA NỘP BÁO CÁO 03/08         ║
║    [ NHẬP NGAY ]                  ║
╠═══════════════════════════════════╣
║ 🆕 ASG-0148 · 6.200 pcs · 26/08   ║
║    1,42 USD/pc                    ║
║    [ NHẬN ]  [ TỪ CHỐI ]  📶      ║  ← 📶 = CAM KẾT, cần mạng (DL-089)
╠═══════════════════════════════════╣
║ ⚠️ CAPA-091 chờ 4 ngày   [Xem]    ║
╚═══════════════════════════════════╝
  [Việc] [Line Map] [NPL] [Chat]      ← 4 mục, ⛔ không hơn
```

**Luồng nhập sản lượng — ≤ 3 chạm:**

```
① Chạm "NHẬP SẢN LƯỢNG"
      ▼
② Chuyền 1 · Giờ 10h *(hệ thống đoán từ đồng hồ)*
   Sản lượng:  [ − ]  128  [ + ]      ← nút to, ⛔ không gõ phím
   Có sự cố?   [ Không ]  [ Có ]
      ▼
③ Vuốt để xác nhận  ───▶
      ▼
   ✅ Đã ghi · ⚠️ chờ gửi (mất mạng)   ← ghi ngay, gửi sau
```

---

# §4 · DECISION LOG — 11 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-083` | **Danh tính dùng chung, hồ sơ cô lập** — ba tầng | Cách duy nhất thoả cả *"một Party Number"* lẫn cô lập đa thuê bao | 🔴 rất khó |
| `DL-084` | 🔴 **Luồng LỜI MỜI, ⛔ không phải TÌM KIẾM** · phản hồi giống hệt nhau dù đối tác đã tồn tại hay chưa | Sổ đăng ký toàn cục tra được ⇒ lộ *"xưởng này làm cho ai khác"* | ⚠️ |
| `DL-085` | **MFA BẮT BUỘC** với identity làm cho ≥2 tenant | Danh tính chung khuếch đại hậu quả một mật khẩu yếu | ✅ |
| `DL-086` | **Đo cả 6 chỉ số từ v1, ⛔ không tính tiền** | Mô hình giá dựa trên dữ liệu thật sau 12 tháng | ✅ |
| `DL-087` | 🔴 **Đo tổng hợp cấp tenant/party. ⛔ KHÔNG báo cáo hành vi cá nhân nhân viên đối tác** | Nhân viên xưởng ⛔ không phải nhân viên Monica · nghi ngờ giám sát ⇒ **ngừng nhập trung thực** | ⚠️ |
| `DL-088` | 🔴 **Mobile-first là quyết định TẦNG DỮ LIỆU** | Đổi CSS mà giữ *"luôn trực tuyến"* ⇒ mất mạng ⇒ quản đốc ghi ra giấy | 🔴 rất khó |
| `DL-089` | 🔴 **QUAN SÁT ghi ngoại tuyến · CAM KẾT bắt buộc trực tuyến** | Chấp nhận Assignment ngoại tuyến ⇒ hai xưởng cùng làm một lô | ⚠️ |
| `DL-090` | 🔴 **Xung đột sản lượng giải bằng CHỨNG TỪ ĐIỀU CHỈNH, ⛔ không ghi đè** | Ghi đè im lặng = mất dữ liệu ⛔ không ai phát hiện | ⚠️ |
| `DL-091` | 🔴 **Băm media tại lúc THU NHẬN, ⛔ không phải lúc tải lên** | Chứng minh *"ảnh này chính là ảnh chụp lúc 14:02"* | ⚠️ |
| `DL-092` | 🔴 **QR/mã vạch chỉ chứa định danh mờ** | Thẻ bó là vật thể **rời khỏi nhà máy** — mã chứa tên khách là rò rỉ vật lý ⛔ không thu hồi được | ✅ |
| `DL-093` | **PWA, ⛔ không phải ứng dụng gốc** | Ma sát cài đặt với hàng chục xưởng nhỏ · cập nhật tức thì · ✅ Monica đã có nền PWA | ✅ |

**Cộng dồn EDD-01 → 04A: 93 quyết định.**

---

# §5 · BOARD DECISION REQUIRED — 2

---

## `BDR-23` · TÀI KHOẢN RIÊNG TỪNG NGƯỜI HAY DÙNG CHUNG CẢ XƯỞNG?

**Vấn đề.** Một xưởng gia công có 1 quản đốc + 4 tổ trưởng nhập liệu. **Mỗi người một tài khoản, hay cả xưởng dùng chung một tài khoản?** Câu này chạm ba thứ cùng lúc: chất lượng bằng chứng · chi phí *(`Active User` là chỉ số tính tiền)* · ma sát triển khai.

| | **A · Một tài khoản cho cả xưởng** | **B · Mỗi người một tài khoản** |
|---|---|---|
| Triển khai | 🔴 **Rất nhanh** — một lời mời, xong | Chậm — mời từng người, mỗi người MFA |
| 🔴 **Bằng chứng** | *"Xưởng Phú Thịnh đã nhập"* — 🔴 **⛔ không biết AI** | ✅ *"Trần Văn B, tổ trưởng chuyền 2, lúc 14:02"* |
| `BDR-14` Audit Log | 🔴 **Yếu** — chủ thể là một tổ chức, ⛔ không phải một người | ✅ Đủ mạnh làm bằng chứng pháp lý |
| Thu hồi khi nhân viên nghỉ | 🔴 **Phải đổi mật khẩu cả xưởng** | ✅ Thu hồi một người |
| Chi phí *(`Active User`)* | 1 | 5 |
| Rủi ro | 🔴 **Mật khẩu dùng chung ⇒ dán lên tường ⇒ ai cũng dùng được** | Thấp |
| Với 100 khách | Ma sát thấp, bằng chứng yếu | Bằng chứng mạnh, ma sát cao |

> **Khuyến nghị: PHƯƠNG ÁN B, với hai cơ chế giảm ma sát.**
>
> ① 🔴 **Mời hàng loạt bằng số điện thoại** — quản đốc nhập 5 số, mỗi người nhận một liên kết, đăng nhập bằng **OTP qua SMS/Zalo, ⛔ không cần mật khẩu**. Ma sát gần bằng phương án A.
> ② **Vai trong xưởng phân hai mức**: `WorkshopManager` *(nhận việc · xem công nợ · nộp báo cáo)* và `LineOperator` *(chỉ nhập sản lượng chuyền mình · quét bó)*. Người nhập sản lượng ⛔ không cần thấy đơn giá.
>
> Lý do quyết định: 🔴 **`BDR-14` yêu cầu Audit Log là bằng chứng pháp lý.** Một nhật ký ghi *"Xưởng Phú Thịnh"* thay vì *"Trần Văn B"* ⛔ **không đứng vững trong tranh chấp** — và tranh chấp với nhà thầu về sản lượng và hao hụt là chuyện xảy ra thật.
>
> ⚠️ **Chỗ tôi có thể sai:** nếu thực tế xưởng gia công Việt Nam **sẽ dùng chung tài khoản dù ta cấp riêng** *(đưa điện thoại cho nhau)*, thì phương án B chỉ tạo ảo giác về bằng chứng. Nếu Joseph biết thực tế là vậy, **A + ghi nhận rõ giới hạn** trung thực hơn.

**🔲 Board chọn: A · B-với-OTP-và-2-vai · A-cho-nhỏ-B-cho-lớn**

---

## `BDR-24` · VỊ TRÍ ĐỊA LÝ VÀ SIÊU DỮ LIỆU THIẾT BỊ TRONG BẰNG CHỨNG

**Vấn đề.** Ảnh chụp từ điện thoại mang được **toạ độ GPS, mã thiết bị, thời điểm**. Toạ độ tăng giá trị bằng chứng — *"ảnh này chụp TẠI xưởng Phú Thịnh"* mạnh hơn *"ảnh này ai đó gửi"*. Nhưng nó cũng là **theo dõi vị trí người lao động của một doanh nghiệp khác**.

| | **A · ⛔ Không thu thập vị trí** | **B · Thu thập, có thông báo và đồng ý** |
|---|---|---|
| Cách làm | Chỉ lưu thời điểm + thiết bị + người | Lưu thêm toạ độ; báo rõ khi bật camera; đối tác **bật/tắt được ở cấp xưởng** |
| Giá trị bằng chứng | Trung bình — chứng minh *khi nào*, ⛔ không chứng minh *ở đâu* | 🔴 **Cao** — chống được gian lận *"chụp ảnh lô hàng khác gửi lên"* |
| Rủi ro pháp lý | ⛔ Không | ⚠️ Một số nước yêu cầu đồng ý minh thị của **người lao động**, ⛔ không phải của chủ xưởng |
| Rủi ro quan hệ | ⛔ Không | 🔴 Nhà thầu nghi bị giám sát ⇒ **giảm hợp tác** |
| Với 100 khách | An toàn ở mọi thị trường | Cần cấu hình theo nước |

> **Khuyến nghị: PHƯƠNG ÁN B, mặc định TẮT, bật theo từng xưởng và có thông báo.**
>
> ① Mặc định **TẮT** — hầu hết ảnh ⛔ không cần vị trí · ② Bật **chỉ cho loại bằng chứng có tranh chấp cao** *(xác nhận nhận NPL · ảnh lô hàng trước khi giao)* · ③ **Hiện rõ trên màn hình** khi vị trí đang được ghi · ④ Cấu hình ở cấp **xưởng**, ⛔ không phải cấp người
>
> Lý do: giá trị bằng chứng của vị trí là **thật và cụ thể** — nó chống gian lận *"chụp ảnh lô khác"*. Nhưng nó **⛔ không cần cho 95% ảnh**. Bật chọn lọc thu được gần hết giá trị với một phần nhỏ rủi ro.
>
> ⚠️ Nhất quán với `DL-087`: đây là **bằng chứng cho một giao dịch**, ⛔ không phải theo dõi hành vi người lao động. Ranh giới: **ghi vị trí của một SỰ KIỆN cụ thể** ✅ · **theo dõi vị trí một NGƯỜI theo thời gian** ⛔.

**🔲 Board chọn: A · B-tắt-mặc-định · B-bật-toàn-bộ**

---

# §6 · TÓM TẮT

## 6.1 Đã bàn giao

| § | Nội dung |
|---|---|
| **1** | Danh tính đa thuê bao — 3 tầng · 🔴 **luật chống suy luận** · Tenant Context 4 luật · thu hồi và MFA |
| **2** | Đo đạc — **6 chỉ số định nghĩa chính xác** · kiến trúc · mô hình giá chống được · 🔴 **ranh giới đạo đức** |
| **3** | Mobile First — 5 quyết định kiến trúc · 🔴 **quan sát ⟷ cam kết** · giao thức đồng bộ · **xử lý xung đột** · media là bằng chứng · QR/mã vạch · 10 ràng buộc tương tác · ngân sách mạng · PWA · màn hình |

**Quyết định tự ra:** 11 *(cộng dồn 93)* · **Cần Board quyết:** 2

## 6.2 Ba điểm đáng nhớ nhất

| # | Điểm |
|---|---|
| **1** | 🔴 **QUAN SÁT ghi được khi ngoại tuyến; CAM KẾT bắt buộc trực tuyến.** *"Chuyền 1 ra 128 chiếc lúc 10h"* là sự thật đã tồn tại — ghi lúc nào ⛔ không đổi bản chất. *"Tôi nhận việc này"* chỉ tồn tại khi **hai bên cùng biết** — nhận ngoại tuyến lúc 8h, đồng bộ lúc 14h thì Monica đã giao cho xưởng khác |
| **2** | 🔴 **Mobile-first là quyết định TẦNG DỮ LIỆU, ⛔ không phải tầng giao diện.** Đổi CSS mà giữ mô hình *"máy chủ là nguồn duy nhất, luôn trực tuyến"* ⇒ mất wifi ⇒ màn hình trắng ⇒ **quản đốc ghi ra giấy** ⇒ Monica ONE mất đúng thứ Portal sinh ra để có |
| **3** | 🔴 **Sổ đăng ký Party toàn cục rò rỉ qua SỰ KHÁC BIỆT CỦA PHẢN HỒI**, ⛔ không qua dữ liệu trả về. Tenant A thử thêm một xưởng, hệ thống báo *"đã tồn tại"* ⇒ A biết xưởng đó làm cho ai khác. Lời giải: **luồng lời mời, phản hồi giống hệt nhau trong mọi trường hợp** |

## 6.3 Trạng thái

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

**Tiếp theo:** EDD-05 — Phase 11 Workspace · Work Inbox · Dashboard · Executive Center · Phase 12 Module Architecture.

---

## THAM CHIẾU

- **Board Decision** `BDR-18` ✅ · `BDR-19` ✅ · **Board Additional Request — Mobile First**
- [EDD-03A](EDD-03A-PARTNER-PORTAL-ARCHITECTURE.md) — ba Portal độc lập · `DL-063` che danh tính khách · `DL-066` trọng yếu vận hành
- [EDD-04](EDD-04-WORKFLOW-RULE-PERMISSION.md) — `DL-075` tham chiếu không bản sao · `DL-078` huỷ hiệu lực ngay · `BDR-13` 5 loại dữ liệu
- [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) Điều 8 *(Evidence First)* · Điều 45 *(đa ngôn ngữ)*
- Kho mã: commit `541309c6` — nền PWA đã có
