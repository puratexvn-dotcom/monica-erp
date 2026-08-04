# EDD-04C · TU CHÍNH C
## SUBCONTRACT PORTAL RUNTIME SPECIFICATION
### Danh tính · Bằng chứng · Năm nguyên tắc First · Bốn hạng mục runtime · Luật ba chạm

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-04C · Tu chính của [EDD-04A](EDD-04A-PARTNER-RUNTIME-MOBILE-FIRST.md) |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Nguồn thẩm quyền** | `BDR-23` ✅ · `BDR-24` ✅ · **Additional Direction — 5 nguyên tắc First** · **Additional Request — 4 hạng mục** · **Enterprise UX Principle — 3 chạm** |
| **Thẩm quyền tự quyết** | 🔴 *"Nếu đây là Enterprise Best Practice, anh tự quyết. Chỉ cập nhật Decision Log."* |
| **Board Decision Required** | **0** — Joseph đã uỷ quyền toàn bộ phạm vi này |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §0 · QUYẾT ĐỊNH ĐÃ HẤP THỤ

| Quyết định | Nội dung | Thi hành ở |
|---|---|---|
| `BDR-23` ✅ | **One Person · One Identity · One Audit Trail** · ⛔ không dùng chung tài khoản · **OTP ưu tiên, mật khẩu ⛔ không bắt buộc** · 🆕 **hỗ trợ SSO / Identity Provider** | §1 |
| `BDR-24` ✅ | GPS **chỉ là bằng chứng**, ⛔ không theo dõi nhân viên · mặc định tắt · bật chọn lọc | §2 |
| 🆕 **5 nguyên tắc First** | Offline · Mobile · Low Bandwidth · **Low Training** · **Low Friction** | §3 |
| 🆕 **4 hạng mục** | Media Compression · Background Sync · Offline Retention · Camera + Gallery | §4 |
| 🆕 **UX Principle** | **Tối đa 3 chạm** cho 5 tác vụ tần suất cao | §5 |

---
---

# §1 · DANH TÍNH — thi hành `BDR-23`

## 1.1 Ba tầng xác thực — khớp với mô hình quan sát ⟷ cam kết

Chỉ thị *"OTP ưu tiên, mật khẩu ⛔ không bắt buộc"* va với **Offline First**: nếu phiên hết hạn lúc mất mạng, OTP ⛔ không tới được và **quản đốc bị khoá ngoài với dữ liệu chưa gửi**.

Lời giải: **ba tầng xác thực, khớp đúng với `DL-089`** *(quan sát ⟷ cam kết)*:

```
┌─ TẦNG 0 · THIẾT BỊ ĐÃ GẮN + PIN/vân tay ────────── ✅ CHẠY ĐƯỢC KHI MẤT MẠNG
│  ✅ Ghi QUAN SÁT: sản lượng · sự cố · ảnh · quét QR · nháp báo cáo
│  ⛔ ⛔ KHÔNG đọc được dữ liệu thương mại (đơn giá · công nợ)
│  ⛔ ⛔ KHÔNG thực hiện được CAM KẾT
│
├─ TẦNG 1 · PHIÊN HỢP LỆ ──────────────────────────── cần mạng lần đầu
│  ✅ Đọc toàn bộ phạm vi được phép · gửi đề nghị · trò chuyện
│
└─ TẦNG 2 · XÁC THỰC TĂNG CƯỜNG (OTP mới) ────────── 🔴 BẮT BUỘC CÓ MẠNG
   ✅ CAM KẾT: chấp nhận/từ chối Assignment · xác nhận số liệu công nợ · nộp báo cáo ngày
```

> `DL-100` · **Ba tầng xác thực ánh xạ 1-1 với ba mức hệ quả nghiệp vụ.**
> Ghi *"chuyền 1 ra 128 chiếc"* ⛔ không cần cùng mức bảo đảm danh tính với *"tôi chấp nhận đơn 8.804 USD"*. Ép cùng một mức thì **hoặc là mất dữ liệu khi offline, hoặc là hạ thấp bảo đảm cho cam kết**.

## 1.2 🔴 Hết hạn phiên ⛔ KHÔNG BAO GIỜ được huỷ dữ liệu đã ghi

```
Quản đốc nhập sản lượng 3 giờ liền khi mất mạng
   ▶ phiên hết hạn lúc 15:00
   ▶ có mạng lại lúc 17:00

❌ SAI:  đăng xuất → xoá hàng đợi → MẤT 3 GIỜ DỮ LIỆU SẢN XUẤT
✅ ĐÚNG: hàng đợi ghi TỒN TẠI ĐỘC LẬP với phiên
         → yêu cầu đăng nhập lại → đồng bộ hàng đợi → ⛔ không mất gì
```

> `DL-101` · **Hàng đợi ghi có vòng đời độc lập với phiên đăng nhập.**
> Nó chứa **sự thật đã xảy ra ở thế giới thật** *(`DL-089`)*. Xoá nó vì lý do xác thực là để một vấn đề kỹ thuật xoá một sự kiện sản xuất. Nhất quán với `OC-5`.

## 1.3 Phương thức đăng nhập — theo thứ tự ưu tiên

| # | Phương thức | Khi nào | Ghi chú |
|---|---|---|---|
| **1** | 🔴 **OTP qua Zalo** | mặc định tại Việt Nam | 📚 Rẻ hơn SMS, tin cậy hơn ở khu công nghiệp, quản đốc **đã có Zalo** |
| **2** | **OTP qua SMS** | dự phòng khi ⛔ không có Zalo | Tốn phí — xem §1.6 |
| **3** | **PIN/vân tay trên thiết bị đã gắn** | 🔴 **khi mất mạng** — Tầng 0 | ⛔ Chỉ mở khoá ghi quan sát |
| **4** | **OIDC liên kết** *(SSO)* | khi đối tác có IdP riêng | §1.4 |
| **5** | Mật khẩu | ⛔ **⛔ KHÔNG mặc định** — chỉ khi doanh nghiệp yêu cầu | `BDR-23` |

**Gắn thiết bị:** đăng nhập lần đầu bằng OTP ⇒ thiết bị được gắn **90 ngày** ⇒ mở app ⛔ không cần OTP lại. Yêu cầu OTP mới khi: thiết bị mới · thao tác Tầng 2 · 30 ngày ⛔ không hoạt động · quản trị viên thu hồi.

## 1.4 🔴 Liên kết danh tính (SSO) — thi hành yêu cầu mới của Board

Đây là bổ sung có ý nghĩa kiến trúc: một **tập đoàn gia công lớn** hoặc một **tenant lớn** có hệ thống danh tính riêng.

```
PartnerIdentity  (toàn cục — EDD-04A §1.1)
└─ AuthenticationMethod[]     ← MỘT danh tính, NHIỀU cách xác thực
     OTP_ZALO | OTP_SMS | DEVICE_PIN | PASSWORD | OIDC_FEDERATED

PartyIdentityProvider   (đăng ký ở cấp Party)
├─ party_id · provider_type: OIDC | SAML
├─ 🔴 verified_domains[]   ← BẮT BUỘC xác minh quyền sở hữu tên miền
├─ issuer · client_id · jwks_uri
└─ status: PENDING_VERIFICATION | ACTIVE | SUSPENDED
```

### 🔴 Ba luật liên kết — luật đầu quan trọng nhất

| # | Luật | Vì sao |
|---|---|---|
| `FED-1` | 🔴 **Liên kết XÁC THỰC, ⛔ KHÔNG PHÂN QUYỀN.** IdP của đối tác nói *"đây là Trần Văn B"*. Monica ONE quyết B thấy gì — qua `TenantMembership` + `Assignment`. ⛔ **KHÔNG BAO GIỜ tin `roles`/`groups` do IdP gửi** | Tin nhóm từ IdP nghĩa là **giao quyền phân quyền cho hệ thống của người khác**. Quản trị viên IdP của đối tác sẽ tự cấp quyền cho mình |
| `FED-2` | 🔴 **Bắt buộc xác minh quyền sở hữu tên miền** trước khi kích hoạt | ⛔ Không xác minh ⇒ ai đăng ký `@zara.com` cũng chiếm được danh tính người của Zara |
| `FED-3` | 🔴 **IdP của đối tác hỏng ⇒ OTP vẫn dùng được** | Portal là **hệ trọng yếu vận hành** *(`DL-066`)*. ⛔ Không được để hạ tầng của bên thứ ba làm dừng dữ liệu sản xuất |

> `DL-102` · **Liên kết chỉ thay bước XÁC THỰC. Phân quyền luôn thuộc Monica ONE.**
> Và **⛔ không bao giờ là con đường duy nhất** — OTP luôn là lối dự phòng.

**Đa thuê bao + liên kết:** một `PartnerIdentity` làm cho 3 tenant, đăng nhập một lần qua IdP của **chính đối tác** *(⛔ không phải của tenant)*. `TenantContext` vẫn tách tuyệt đối *(`TC-1`…`TC-4`)*.

## 1.5 One Audit Trail

`BDR-23` yêu cầu **One Audit Trail**. Với danh tính đa thuê bao, câu hỏi là: nhật ký thuộc về ai?

```
🔴 MỖI HÀNH VI ghi vào Audit Log CỦA TENANT nơi nó xảy ra
   ├─ actor: identity_id · person_name · party_number   ← danh tính toàn cục
   ├─ tenant_id                                          ← nơi hành vi xảy ra
   └─ auth_tier · auth_method · device_id                ← ĐÃ XÁC THỰC THẾ NÀO
⛔ ⛔ KHÔNG BAO GIỜ có một nhật ký hợp nhất xuyên tenant cho đối tác
```

> `DL-103` · **"One Audit Trail" nghĩa là MỘT DÒNG DÕI CHO MỘT CON NGƯỜI TRONG MỘT TENANT** — ⛔ không phải một nhật ký gộp mọi tenant.
> Nhật ký gộp xuyên tenant sẽ **để tenant A nhìn thấy hoạt động của đối tác ở tenant B** — vi phạm `TC-1`.
>
> 🔴 Ghi thêm `auth_tier` là chi tiết có giá trị pháp lý: *"bản ghi này tạo ở Tầng 0 (PIN thiết bị, ngoại tuyến)"* có sức nặng chứng cứ **khác** *"tạo ở Tầng 2 (OTP mới)"*.

## 1.6 ⚠️ Một khoảng trống trong bộ đo — tôi bổ sung

`BDR-19` khai 6 chỉ số. **⛔ Không chỉ số nào đo chi phí OTP** — mà với `BDR-23` *(OTP ưu tiên, mỗi người một tài khoản)*, đây là chi phí biến đổi thật:

```
Ước lượng thô ở quy mô 100 tenant:
  100 tenant × 40 đối tác × 5 người = 20.000 danh tính
  Gắn thiết bị 90 ngày ⇒ ~4 OTP/người/năm + thao tác Tầng 2
  ⇒ hàng trăm nghìn tin nhắn/năm
```

> `DL-104` · **Bổ sung chỉ số thứ bảy: `AuthMessage`** — số OTP đã gửi, tách theo kênh *(Zalo ⟷ SMS)* và tenant.
> Đây là chi phí **tăng tuyến tính theo số tài khoản đối tác** — đúng thứ `BDR-19` sinh ra để đo. Ưu tiên Zalo cũng chính là quyết định giảm chi phí này.

---
---

# §2 · GPS LÀ BẰNG CHỨNG — thi hành `BDR-24`

## 2.1 🔴 Lưu PHÁN QUYẾT VÙNG, ⛔ không lưu toạ độ thô

Board chốt: *"GPS chỉ được dùng như Evidence. ⛔ Không được dùng để Tracking nhân viên."* Có một cách thiết kế đạt **cả hai vế** thay vì cân bằng giữa chúng:

```
❌ Lưu toạ độ thô  →  20.6543°N, 106.1234°E
     ▶ giá trị bằng chứng ✅
     ▶ 🔴 nhưng tạo ra một DẤU VẾT VỊ TRÍ của người lao động

✅ Lưu PHÁN QUYẾT VÙNG  →  { geofence: "PHU_THINH_WORKSHOP", inside: true,
                             accuracy_m: 12, evaluated_on_device: true }
     ▶ giá trị bằng chứng ✅  — chứng minh "ảnh chụp TẠI xưởng đã đăng ký"
     ▶ ⛔ KHÔNG có toạ độ  ⇒  ⛔ KHÔNG dựng lại được lộ trình di chuyển
```

> `DL-105` · **Mặc định lưu phán quyết vùng, ⛔ không lưu toạ độ. Đánh giá vùng chạy TRÊN THIẾT BỊ; toạ độ thô ⛔ không rời khỏi máy.**
>
> Điều này giữ **gần trọn** giá trị bằng chứng — nó chống được đúng thứ cần chống: *"chụp ảnh lô hàng khác ở nơi khác rồi gửi lên"*. Và nó **⛔ không tạo ra dữ liệu theo dõi** để về sau bị lạm dụng hoặc bị đòi cung cấp.
>
> ⚠️ Toạ độ thô chỉ lưu khi tenant bật tường minh cho **một loại bằng chứng cụ thể**, có ghi vết ai bật.

## 2.2 Hồ sơ thu nhận bằng chứng

```
EvidenceCaptureProfile   (L2 · Partner Configuration — EDD-04B)
├─ evidence_type
├─ require_camera_only: bool     ← ⛔ cấm chọn từ thư viện (§4.4)
├─ geofence_mode: OFF | VERDICT | RAW_COORDINATES
├─ require_measurement_reference: bool   ← nhắc đặt thước trong khung
└─ compression_tier: ROUTINE | EVIDENCE_GRADE

Mặc định theo loại:
  Sản lượng thường ngày        OFF · thư viện ✅ · ROUTINE
  🔴 Xác nhận nhận NPL          VERDICT · 🔴 chỉ camera · EVIDENCE_GRADE
  🔴 Ảnh lô trước khi giao      VERDICT · 🔴 chỉ camera · EVIDENCE_GRADE
  🔴 Đối soát hao hụt           VERDICT · 🔴 chỉ camera · EVIDENCE_GRADE
  Sự cố chuyền                 OFF · thư viện ✅ · ROUTINE
```

## 2.3 Hai luật minh bạch

| # | Luật |
|---|---|
| `GEO-1` | 🔴 **Hiện rõ trên màn hình khi vùng đang được ghi**: `📍 Đang xác nhận vị trí xưởng` — ⛔ không bao giờ ghi ngầm |
| `GEO-2` | 🔴 **Cấu hình ở cấp XƯỞNG, ⛔ không phải cấp người** · nhất quán `DL-087` — ghi vị trí của **một SỰ KIỆN** ✅ · theo dõi vị trí **một NGƯỜI theo thời gian** ⛔ |

---
---

# §3 · NĂM NGUYÊN TẮC FIRST — nghĩa kiến trúc

> ⛔ Không phải khẩu hiệu. Mỗi nguyên tắc là **một ràng buộc kiểm được**.

| Nguyên tắc | Nghĩa kiến trúc | Đo bằng |
|---|---|---|
| **① Offline First** | 🔴 Kho cục bộ là **đích ghi chính**; máy chủ là **bên đồng bộ**, ⛔ không phải người gác cổng | ⛔ Không tác vụ quan sát nào hỏng khi tắt mạng |
| **② Mobile First** | Quyết định **tầng dữ liệu** *(`DL-088`)*, ⛔ không phải tầng giao diện | ⛔ Không màn hình nào cần > 1 ngón tay |
| **③ Low Bandwidth First** | Ngân sách gói tin · đồng bộ chênh lệch · ⛔ không thăm dò định kỳ · media hoãn tới wifi | 🔴 **Dùng được ở 2G · < 5 MB/người/ngày** |
| **④ Low Training First** | 🔴 **Người mới làm đúng NGAY LẦN ĐẦU, ⛔ không cần ai dạy** | §3.1 |
| **⑤ Low Friction First** | 🔴 **Lần thứ một trăm phải NHANH** | §5 · luật 3 chạm |

## 3.1 🔴 Low Training First — nguyên tắc mới, và là nguyên tắc khó nhất

Đây là nguyên tắc duy nhất trong năm cái tôi chưa đề cập ở EDD-04A. Nó ⛔ **không giống** Low Friction:

```
Low TRAINING  = LẦN ĐẦU  · "tôi có tự hiểu được không?"     → cần RÕ RÀNG
Low FRICTION  = LẦN 100  · "có nhanh không?"                → cần TẮT ĐƯỜNG

🔴 HAI CÁI NÀY XUNG ĐỘT NHAU.
   Rõ ràng đòi nhãn đầy đủ, giải thích, xác nhận.
   Nhanh đòi mặc định thông minh, phím tắt, bỏ bước.
```

**Lời giải: giao diện TIẾN TRIỂN theo người dùng.**

```
Lần 1–5:    nhãn đầy đủ · gợi ý *("Chạm vào ô số để sửa")* · xác nhận từng bước
Lần 6–20:   gợi ý mờ dần · giá trị mặc định bắt đầu đoán trước
Lần 20+:    biểu tượng gọn · mặc định đoán đúng · một chạm xác nhận
```

**Bảy ràng buộc Low Training — cụ thể, kiểm được:**

| # | Ràng buộc | ❌ Sai | ✅ Đúng |
|---|---|---|---|
| `LT-1` | 🔴 **Từ ngữ của xưởng, ⛔ không phải từ ngữ ERP** | *"Ghi nhận Throughput"* · *"Aggregate"* · *"Assignment"* | *"Nhập sản lượng"* · *"Việc được giao"* |
| `LT-2` | **Một hành động chính mỗi màn hình** | 5 nút cùng cỡ | 1 nút to + phụ nhỏ hơn |
| `LT-3` | 🔴 **Ngăn lỗi thay vì báo lỗi** | cho gõ 99999 rồi báo *"vượt số lượng"* | ô số **chặn tại số lượng còn lại** |
| `LT-4` | **Nhận diện thay vì nhớ lại** | *"Nhập mã Assignment"* | hiện danh sách việc, chạm chọn |
| `LT-5` | **Vị trí nhất quán** — nút nhập sản lượng **luôn ở đúng chỗ** | | hình thành trí nhớ cơ bắp |
| `LT-6` | 🔴 **Hoàn tác thay vì xác nhận** | *"Bạn có chắc?"* trước mỗi thao tác | làm ngay + *"Đã ghi · Hoàn tác"* 5 giây |
| `LT-7` | 🔴 **⛔ Không cần tài liệu hướng dẫn** cho 5 tác vụ chính | | nếu phải viết hướng dẫn ⇒ **thiết kế sai** |

> `DL-106` · **Tiêu chí nghiệm thu Low Training — đo được, ⛔ không phải cảm tính:**
>
> 🔴 **Một quản đốc chưa từng thấy hệ thống, ⛔ không được hướng dẫn, hoàn thành lần nhập sản lượng đầu tiên trong ≤ 90 giây, ⛔ không hỏi ai.**
>
> Nếu ⛔ không đạt, thiết kế sai — ⛔ không phải người dùng cần đào tạo. Kiểm bằng thử nghiệm với người thật trước khi phát hành.
>
> `LT-6` *(hoàn tác thay vì xác nhận)* đáng chú ý: nó phục vụ **cả** Low Training **lẫn** Low Friction — hiếm khi hai nguyên tắc xung đột lại có một giải pháp chung. ⚠️ Ngoại lệ: thao tác thuộc **CAM KẾT** *(`DL-089`)* vẫn giữ xác nhận có chủ ý.

---
---

# §4 · BỐN HẠNG MỤC RUNTIME — Joseph giao tự quyết

## 4.1 A · MEDIA COMPRESSION

### 🔴 Vấn đề: nén phá vỡ chuỗi bằng chứng

`DL-091` yêu cầu **băm tại lúc thu nhận**. Nhưng nếu nén rồi mới gửi, băm của tệp nhận được ⛔ **không khớp** băm đã ghi.

**Lời giải — tải lên hai pha:**

```
① THU NHẬN     ảnh gốc 4,2 MB
                🔴 băm NGAY: original_hash = sha256(gốc)
                giữ bản gốc trên máy

② NÉN & GỬI    bản làm việc ~280 KB → gửi NGAY
                ghi: original_hash · working_hash · compression_params
                ▶ Nghiệp vụ dùng được trong vài giây, kể cả mạng yếu

③ GỬI BẢN GỐC  khi có wifi + đang sạc, chạy nền
                máy chủ xác minh original_hash ⇒ chuỗi bằng chứng KHÉP KÍN
                ▶ Xoá bản gốc khỏi máy sau khi máy chủ xác nhận
```

> `DL-107` · **Tải lên hai pha: bản nén để VẬN HÀNH ngay, bản gốc để LÀM BẰNG CHỨNG sau.**
> Giữ trọn vẹn cả `DL-091` *(băm tại nguồn)* lẫn Low Bandwidth First. Đây là chỗ hai yêu cầu tưởng xung đột giải được bằng cách **tách thời điểm**, ⛔ không phải bằng cách thoả hiệp.

### Tham số nén

| Loại | Tầng `ROUTINE` | Tầng `EVIDENCE_GRADE` |
|---|---|---|
| **Ảnh** | cạnh dài 1280px · JPEG q70 · ~200 KB | cạnh dài 2048px · JPEG q88 · ~800 KB |
| **Video** | 480p · 30s · ~2 MB | 720p · 60s · ~8 MB · 🔴 **chỉ gửi qua wifi** |
| **Âm thanh** | Opus 16 kbps mono · 120s · ~250 KB | như trên |

🔴 **Luật:** loại bằng chứng có tranh chấp cao *(nhận NPL · ảnh lô trước giao · đối soát hao hụt · lỗi QA)* **bắt buộc `EVIDENCE_GRADE`** — nén mạnh có thể **xoá mất chính cái lỗi cần chứng minh**.

## 4.2 B · BACKGROUND SYNC

```
SyncQueue  (IndexedDB · bền qua đóng app · đóng trình duyệt · khởi động lại máy)
├─ item: { request_id, tenant_id, aggregate_key, payload, captured_at,
│          attempt_count, last_error, priority, media_refs[] }
├─ 🔴 Thứ tự: THEO TỪNG aggregate (10h trước 11h);
│             aggregate khác nhau chạy SONG SONG
├─ Kích hoạt: có mạng lại · Background Sync API · mở app · kéo làm mới · định kỳ 15'
├─ Thử lại: luỹ thoái + nhiễu ngẫu nhiên · 30s → 2' → 8' → 30' → 2h → tối đa 6h
└─ 🔴 ⛔ KHÔNG BAO GIỜ tự bỏ mục nào
```

**Bốn luật:**

| # | Luật | Vì sao |
|---|---|---|
| `BS-1` | 🔴 **Ưu tiên: quan sát nghiệp vụ TRƯỚC media.** Số liệu sản lượng đi trước ảnh | Con số quyết định điều hành; ảnh là bằng chứng bổ sung |
| `BS-2` | **Media lớn hoãn tới wifi**, trừ khi người dùng ép gửi | Low Bandwidth First · dữ liệu di động của quản đốc là tiền túi họ |
| `BS-3` | 🔴 **Hỏng > 5 lần ⇒ NỔI LÊN MÀN HÌNH**, ⛔ không im lặng | Im lặng bỏ = mất dữ liệu ⛔ không ai biết |
| `BS-4` | 🔴 **Trạng thái hàng đợi luôn nhìn thấy** — `⚠️ 3 mục chờ gửi` chạm vào xem chi tiết + ép gửi | Người dùng phải biết dữ liệu đã tới chưa. ⛔ Không biết ⇒ họ ghi thêm ra giấy để chắc |

> `DL-108` · **Background Sync có thứ tự theo aggregate, song song giữa aggregate, ⛔ không bao giờ tự bỏ.**
> ⚠️ Đồng bộ tuần tự toàn cục sẽ để **một ảnh lớn chặn toàn bộ số liệu sản lượng**. Đó là lỗi thiết kế phổ biến và nó biến hàng đợi thành nút thắt.

## 4.3 C · OFFLINE RETENTION POLICY

**Hai dòng dữ liệu, hai chính sách hoàn toàn khác nhau:**

```
📥 BỘ ĐỆM ĐỌC (máy chủ → thiết bị)          — CÓ HẠN, xoá được tự do
   Assignment · Bundle · WorkCenter    TTL 24h · cứng 7 ngày
   Line Map · sản lượng hôm nay         TTL 15 phút
   Thương mại (đơn giá · công nợ)       TTL 1h
   🔴 Hết hạn cứng 7 ngày ⇒ XOÁ, hiện "cần kết nối để xem"
      ▶ ⛔ KHÔNG BAO GIỜ hiện dữ liệu thương mại quá 7 ngày tuổi

📤 HÀNG ĐỢI GHI (thiết bị → máy chủ)         — 🔴 VÔ HẠN cho tới khi đồng bộ
   ⛔ KHÔNG hết hạn · ⛔ KHÔNG xoá khi hết phiên · ⛔ KHÔNG xoá khi thu hồi quyền
   Chỉ xoá sau khi máy chủ XÁC NHẬN đã nhận

🖼 MEDIA
   bản nén: xoá sau khi máy chủ nhận
   bản gốc: 🔴 GIỮ tới khi máy chủ xác nhận nhận BẢN GỐC, tối đa 30 ngày
```

**Bốn luật:**

| # | Luật |
|---|---|
| `OR-1` | 🔴 **Thiếu dung lượng ⇒ dọn BỘ ĐỆM ĐỌC trước; ⛔ KHÔNG BAO GIỜ dọn hàng đợi ghi** |
| `OR-2` | 🔴 **Mã hoá toàn bộ dữ liệu trên máy** bằng khoá dẫn xuất từ phiên, phân vùng theo `tenant_id` *(`OC-1`)* |
| `OR-3` | 🔴 **Thu hồi quyền ⇒ xoá bộ đệm ĐỌC của tenant đó ngay ở lần kết nối kế tiếp; hàng đợi GHI vẫn đồng bộ** kèm cờ *"gửi sau khi thu hồi"* để rà soát *(`OC-5`)* |
| `OR-4` | **30 ngày ⛔ không kết nối ⇒ xoá toàn bộ bộ đệm đọc**, giữ hàng đợi ghi, yêu cầu đăng nhập lại |

> `DL-109` · **Bộ đệm ĐỌC có hạn; hàng đợi GHI vô hạn.**
> Đây là hệ quả trực tiếp của `DL-089`: dữ liệu đọc là **bản sao của sự thật ở nơi khác** — mất ⛔ không sao. Hàng đợi ghi là **bản gốc duy nhất của một sự kiện sản xuất** — mất là mất hẳn.
>
> 🔴 `OR-3` là chỗ tinh tế: nhà thầu bị chấm dứt hợp đồng vẫn phải **nộp được sản lượng của những ngày họ đã làm**. Thu hồi quyền **xem** ⛔ không được xoá nghĩa vụ **báo cáo**.

## 4.4 D · CAMERA + GALLERY SUPPORT

### 🔴 Camera và thư viện ⛔ KHÔNG có giá trị bằng chứng ngang nhau

```
📷 CAMERA     ảnh chụp NGAY trong ngữ cảnh
              → dấu thời gian thiết bị · người đang đăng nhập · vùng địa lý (nếu bật)
              → ✅ BẰNG CHỨNG MẠNH

🖼 THƯ VIỆN   ảnh chọn từ máy — 🔴 XUẤT XỨ KHÔNG BIẾT
              → có thể chụp hôm qua · chụp nơi khác · người khác gửi qua Zalo
              → ⚠️ BẰNG CHỨNG YẾU HƠN, và hệ thống PHẢI GHI RÕ điều đó
```

```
EvidenceItem
├─ 🔴 capture_source: CAMERA | GALLERY | SHARED_IN
├─ device_captured_at         ← camera: đồng hồ máy · thư viện: từ EXIF
├─ 🔴 exif_original_at?       ← thư viện: thời điểm gốc trong EXIF
├─ 🔴 time_discrepancy_days   ← DẪN XUẤT: chênh giữa EXIF và lúc tải lên
└─ geofence_verdict?          ← chỉ camera có
```

> `DL-110` · **Cho phép chọn từ thư viện, nhưng GHI RÕ nguồn và chênh lệch thời gian.**
> `time_discrepancy_days` là một trường nhỏ có giá trị lớn: một ảnh *"lô hàng hôm nay"* mà EXIF ghi **12 ngày trước** là một dữ kiện đáng để ai đó nhìn. Hệ thống ⛔ không kết luận — nó **hiển thị**.
>
> 🔴 **Loại bằng chứng tranh chấp cao đặt `require_camera_only = true`** ⇒ ⛔ **⛔ không cho chọn thư viện**. Với ảnh xác nhận nhận NPL hay ảnh lô trước khi giao, xuất xứ ⛔ không biết là **⛔ không dùng được**.

**Vì sao vẫn phải có thư viện:** chụp lúc app chưa mở · ảnh do người khác trong xưởng gửi · ảnh chụp chứng từ giấy · chụp lại khi camera trong app lỗi. **Cấm hẳn thư viện sẽ đẩy người dùng ra ngoài hệ thống** — họ gửi qua Zalo, và Monica mất luôn bằng chứng.

---
---

# §5 · LUẬT BA CHẠM — thi hành Enterprise UX Principle

## 5.1 Đếm thật năm tác vụ Joseph nêu

| # | Tác vụ | Chạm | Thiết kế |
|---|---|---|---|
| **1** | 🔴 **Xem việc cần làm** | **0** | Đây **là** màn hình chính. Mở app = thấy việc |
| **2** | **Quét QR** | **2** | ① nút Quét *(hoặc lối tắt PWA từ màn hình chính điện thoại)* → quét *(⛔ không tính chạm)* → ② xác nhận hành động theo ngữ cảnh |
| **3** | **Chụp ảnh** | **2** | ① biểu tượng máy ảnh **trong ngữ cảnh** → ② nút chụp → tự gắn + tự xếp hàng, hiện *"Đã ghi · Hoàn tác"* |
| **4** | **Cập nhật sản lượng** | **2–3** | ① nút lớn → ② xác nhận *(nếu số đoán đúng)* · ③ nếu sửa: ± hoặc bàn phím số lớn |
| **5** | **Gửi yêu cầu** | **3** | ① Gửi yêu cầu → ② chọn loại *(chip: thiếu NPL · lùi lịch · hỏi kỹ thuật · khác)* → ③ **giữ để ghi âm, thả là gửi** |

> 🔴 **Ghi âm là thứ biến "gửi yêu cầu" từ 20 chạm thành 3 chạm.** Gõ một đoạn mô tả sự cố trên điện thoại ở chuyền may là ~20–40 lần chạm. Giữ nút và nói là **một** thao tác. Đây là lý do năng lực ghi âm Joseph yêu cầu ⛔ không phải tính năng phụ.

## 5.2 🔴 Đoán trước làm cho tác vụ ③ đạt 2 chạm

```
Hệ thống đã biết, ⛔ không cần hỏi:
  · Chuyền nào    → từ Assignment đang chạy · hoặc từ QR đã quét
  · Giờ nào       → từ đồng hồ
  · Mã hàng nào   → từ lịch chuyền
  · Sản lượng bao nhiêu → 🔴 ĐOÁN từ nhịp trung bình các giờ trước

╔═══════════════════════════════╗
║ Chuyền 1 · 10h · PO-2588      ║
║                               ║
║      [ − ]   128   [ + ]      ║  ← đoán từ nhịp; đúng thì ⛔ không chạm
║           ✏️ sửa               ║
║                               ║
║  ━━━━━━ Vuốt để ghi ━━━━━▶    ║  ← chạm ②
╚═══════════════════════════════╝
```

> `DL-111` · **Chỉ số sản phẩm `tap_count_p90` cho từng tác vụ, giám sát liên tục.**
> Vượt 3 ⇒ **lỗi thiết kế, đưa vào danh sách phải sửa**. Nguyên tắc ⛔ không đo được là nguyên tắc sẽ bị trôi. Kèm chỉ số phụ: **`prediction_accuracy`** — % lần số đoán đúng, ⛔ không cần sửa. Đây là đòn bẩy trực tiếp lên số chạm.

## 5.3 🔴 Thao tác ĐƯỢC PHÉP vượt 3 chạm — ma sát có chủ ý

| Thao tác | Vì sao chậm là ĐÚNG |
|---|---|
| 🔴 **Chấp nhận / từ chối Assignment** | **CAM KẾT** *(`DL-089`)* — cần đọc kỹ số lượng, ngày giao, đơn giá. Nhanh ở đây là **sai** |
| **Nộp báo cáo ngày** *(khác với nháp)* | Cam kết chính thức, cần xem lại |
| **Xác nhận số liệu công nợ** | Có hệ quả tài chính |
| Đổi cấu hình · đổi tenant | Hiếm, và nhầm thì tốn |

> `DL-112` · **Luật ba chạm áp cho tác vụ TẦN SUẤT CAO. Thao tác CAM KẾT giữ ma sát có chủ ý.**
> Ánh xạ trực tiếp lên ba tầng xác thực §1.1: Tầng 0–1 = nhanh · **Tầng 2 = chậm, có chủ ý**.

## 5.4 Màn hình chính — hợp nhất mọi ràng buộc

```
╔═══════════════════════════════════════╗
║ 🏢 Monica Garment ▾    📶  ⚠️ 3 chờ   ║ ← tenant · mạng · hàng đợi (BS-4)
╠═══════════════════════════════════════╣
║ ┏━━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━━┓    ║
║ ┃   📊 SẢN     ┃ ┃   📷 QUÉT    ┃    ║ ← hai tác vụ tần suất cao nhất
║ ┃     LƯỢNG    ┃ ┃      QR      ┃    ║   vùng ngón cái · 1 chạm tới đích
║ ┃  Chuyền 1·10h┃ ┃              ┃    ║
║ ┗━━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━━┛    ║
╠═══════════════════════════════════════╣
║ 🔴 CHƯA NỘP BÁO CÁO 03/08             ║
║    [ NHẬP NGAY ]                      ║
╠═══════════════════════════════════════╣
║ 🆕 ASG-0148 · 6.200 pcs · giao 26/08  ║
║    1,42 USD/pc = 8.804 USD            ║
║    [ Xem chi tiết ]           📶      ║ ← CAM KẾT: cần mạng + đọc kỹ (DL-112)
╠═══════════════════════════════════════╣
║ ⚠️ CAPA-091 chờ 4 ngày      [ Xem ]   ║
╚═══════════════════════════════════════╝
   [Việc]  [Line Map]  [NPL]  [Chat]      ← 4 mục · ⛔ không hơn
```

⚠️ Lưu ý mục `ASG-0148`: nút **⛔ không phải** `[NHẬN]` trực tiếp mà là `[Xem chi tiết]` — theo `DL-112`, chấp nhận một cam kết 8.804 USD **⛔ không được là một chạm**.

---

# §6 · DECISION LOG — 13 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-100` | **Ba tầng xác thực** ánh xạ 1-1 với ba mức hệ quả nghiệp vụ | Ép cùng một mức ⇒ hoặc mất dữ liệu offline, hoặc hạ thấp bảo đảm cho cam kết | ⚠️ |
| `DL-101` | 🔴 **Hàng đợi ghi có vòng đời ĐỘC LẬP với phiên đăng nhập** | Xoá nó vì lý do xác thực = để vấn đề kỹ thuật xoá một sự kiện sản xuất | 🔴 rất khó |
| `DL-102` | 🔴 **Liên kết XÁC THỰC, ⛔ không phân quyền** · ⛔ không bao giờ tin `roles` từ IdP · OTP luôn là lối dự phòng | Tin nhóm từ IdP = giao quyền phân quyền cho hệ thống người khác | 🔴 rất khó |
| `DL-103` | **"One Audit Trail" = một dòng dõi cho MỘT NGƯỜI trong MỘT TENANT** · ghi thêm `auth_tier` | Nhật ký gộp xuyên tenant vi phạm `TC-1` | ⚠️ |
| `DL-104` | **Chỉ số thứ bảy: `AuthMessage`** — đếm OTP theo kênh và tenant | Chi phí tăng tuyến tính theo số tài khoản đối tác — đúng thứ `BDR-19` sinh ra để đo | ✅ |
| `DL-105` | 🔴 **Lưu PHÁN QUYẾT VÙNG, ⛔ không lưu toạ độ** · đánh giá trên thiết bị | Giữ gần trọn giá trị bằng chứng mà ⛔ **không tạo dấu vết vị trí người lao động** | ⚠️ |
| `DL-106` | **Tiêu chí nghiệm thu Low Training: quản đốc mới, ⛔ không hướng dẫn, hoàn thành nhập sản lượng đầu tiên ≤ 90 giây** | Nguyên tắc ⛔ không đo được là khẩu hiệu | ✅ |
| `DL-107` | 🔴 **Tải lên hai pha** — bản nén để vận hành ngay, bản gốc làm bằng chứng sau | Giải xung đột `DL-091` ⟷ Low Bandwidth bằng **tách thời điểm**, ⛔ không thoả hiệp | ⚠️ |
| `DL-108` | **Đồng bộ nền có thứ tự theo aggregate, song song giữa aggregate, ⛔ không tự bỏ** | Tuần tự toàn cục ⇒ một ảnh lớn chặn toàn bộ số liệu sản lượng | ✅ |
| `DL-109` | 🔴 **Bộ đệm ĐỌC có hạn 7 ngày; hàng đợi GHI vô hạn** · thu hồi quyền ⛔ không xoá nghĩa vụ báo cáo | Dữ liệu đọc là bản sao; hàng đợi ghi là **bản gốc duy nhất của một sự kiện sản xuất** | ⚠️ |
| `DL-110` | **Cho phép thư viện, nhưng ghi rõ `capture_source` và `time_discrepancy_days`** · loại tranh chấp cao ⇒ **chỉ camera** | Cấm hẳn thư viện đẩy người dùng ra Zalo ⇒ Monica **mất luôn bằng chứng** | ✅ |
| `DL-111` | **Chỉ số `tap_count_p90` + `prediction_accuracy`**, giám sát liên tục · vượt 3 ⇒ lỗi thiết kế | Nguyên tắc ⛔ không đo được sẽ trôi | ✅ |
| `DL-112` | 🔴 **Luật ba chạm áp cho tần suất cao. CAM KẾT giữ ma sát có chủ ý** | Chấp nhận đơn 8.804 USD bằng một chạm là **sai thiết kế**, ⛔ không phải thành tựu UX | ✅ |

**Cộng dồn EDD-01 → 04C: 112 quyết định.**

---

# §7 · TÓM TẮT

## 7.1 Board Decision Required: **0**

Joseph đã uỷ quyền toàn bộ phạm vi này *(*"anh tự quyết, chỉ cập nhật Decision Log"*)*. ⛔ Không mục nào trong EDD-04C vượt quá thẩm quyền đó.

⚠️ **Một mục cần Board BIẾT:** `DL-104` bổ sung **chỉ số đo thứ bảy** *(`AuthMessage`)* vào bộ 6 chỉ số của `BDR-19` — vì `BDR-23` *(OTP ưu tiên, mỗi người một tài khoản)* tạo ra một chi phí biến đổi mà bộ 6 ⛔ không bắt được.

## 7.2 Ba điểm đáng nhớ nhất

| # | Điểm |
|---|---|
| **1** | 🔴 **Hết hạn phiên ⛔ KHÔNG BAO GIỜ được huỷ dữ liệu đã ghi.** Quản đốc nhập 3 giờ khi mất mạng, phiên hết hạn — nếu đăng xuất xoá hàng đợi thì **3 giờ dữ liệu sản xuất biến mất vì một lý do kỹ thuật**. Hàng đợi ghi phải có vòng đời độc lập với phiên |
| **2** | 🔴 **Lưu PHÁN QUYẾT VÙNG thay vì toạ độ.** *"Ảnh chụp trong ranh giới xưởng Phú Thịnh: ĐÚNG"* giữ **gần trọn** giá trị bằng chứng — chống được đúng thứ cần chống *(chụp ảnh lô khác ở nơi khác)* — mà ⛔ **không tạo ra dấu vết vị trí** để về sau bị lạm dụng. Đây là cách đạt **cả hai vế** của `BDR-24` thay vì cân bằng giữa chúng |
| **3** | 🔴 **Low Training và Low Friction XUNG ĐỘT nhau**, và giải bằng **giao diện tiến triển** — rõ ràng ở lần 1–5, tắt đường ở lần 20+. `LT-6` *(hoàn tác thay vì xác nhận)* là giải pháp hiếm hoi phục vụ **cả hai** |

## 7.3 Trạng thái

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

**Tiếp theo:** EDD-05 — Phase 11 Workspace · Work Inbox · Dashboard · Executive Center · Phase 12 Module Architecture. **Sprint cuối trước hợp nhất.**

---

## THAM CHIẾU

- **Board Decision** `BDR-23` ✅ · `BDR-24` ✅ · **Additional Direction** *(5 First)* · **Additional Request** *(4 hạng mục)* · **Enterprise UX Principle** *(3 chạm)*
- [EDD-04A](EDD-04A-PARTNER-RUNTIME-MOBILE-FIRST.md) — `DL-088` mobile-first tầng dữ liệu · `DL-089` quan sát ⟷ cam kết · `DL-091` băm tại nguồn · `OC-1`…`OC-5`
- [EDD-04B](EDD-04B-CONFIGURATION-GOVERNANCE-VERSIONING.md) — L2 Partner Configuration
- [EDD-03A](EDD-03A-PARTNER-PORTAL-ARCHITECTURE.md) — `DL-066` trọng yếu vận hành
- [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) Điều 8 *(Evidence First)* · Điều 40 *(Security)*
