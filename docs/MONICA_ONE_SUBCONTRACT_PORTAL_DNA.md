# MONICA ONE — SUBCONTRACT PORTAL DNA

## **SUBCONTRACTOR OPERATING PORTAL**
### *Production Partner Portal — cổng vận hành cho toàn mạng lưới gia công bên ngoài*

| | |
|---|---|
| **Trạng thái** | 🟠 **BẢN ĐỊNH NGHĨA — CHỜ BOARD/CEO DUYỆT.** ⛔ CHƯA CODE. |
| **Ngày** | 08/08/2026 |
| **Nguồn** | Board Directive *SUBCONTRACT PORTAL DEFINITION* 08/08/2026 |
| **Bậc văn bản** | **3 — Engineering Standards** *(ADR-010)*. Phần **nghiệp vụ** phải vào **BKB (bậc 0′)** khi Board duyệt |
| **ADR cần có trước khi code** | ⛔ **CHƯA soạn** — Hiến pháp **Điều 4** |
| **Phản biện độc lập** | ⛔ **CHƯA có** — `ADR-011 §2.2` |

---

# 0. 🔴 ĐIỀU QUAN TRỌNG NHẤT — ĐỌC TRƯỚC MỌI THỨ KHÁC

Board tuyên bố hiểu biết cũ về Subcontract Portal là **CHƯA ĐÚNG ĐẦY ĐỦ**.
Tôi đã **đo hệ thống đang chạy** trước khi viết một dòng nào. Kết quả ⛔ **không
phải** điều tôi dự đoán:

> ## Phần lớn kiến trúc Board mô tả **ĐÃ ĐƯỢC THIẾT KẾ ĐÚNG** ở `027` · `029` · `031`.
> ## Nó ⛔ **KHÔNG chạy** — vì **⛔ chưa gieo dữ liệu** và **⛔ chưa có cổng vào**.

```
partner_accounts ............  🔴 0 dòng   ⇒ ⛔ KHÔNG subcontractor nào ĐĂNG NHẬP ĐƯỢC
contract_types ..............  🔴 0 dòng   ⇒ CM · CMT · FOB ⛔ KHÔNG chọn được
style_operations ............  🔴 0 dòng   ⇒ giao theo CÔNG ĐOẠN ⛔ KHÔNG dùng được thật
partners ....................  ✅ 6 dòng
assignments .................  ✅ 3 dòng
assignment_daily_reports ....  ✅ 2 dòng
assignment_commercial_terms .  ✅ 2 dòng   (contract_type_code đang RỖNG)
```

🔑 **Đây là tin tốt và tin xấu cùng lúc.** Tốt: ⛔ không phải xây lại từ đầu —
`SCOPE_LEVELS`, chín trạng thái Assignment, bộ luật quyền thuần, sổ báo cáo
ngày chỉ-ghi-thêm **đều đã có và đúng hướng Board vừa mô tả**. Xấu: một hệ
thống **đúng mà ⛔ không ai vào được** thì giá trị vận hành của nó **bằng 0** —
và điều đó ⛔ không lộ ra ở bất kỳ bảng điều khiển nào, vì mọi thứ *"đã xong"*
trên giấy.

## 0.1 🔴 VÀ CÓ **HAI** MÔ HÌNH SUBCONTRACT ĐANG SỐNG SONG SONG

Đây là phát hiện nghiêm trọng nhất của phép đo, và nó **giải thích chính xác**
vì sao hiểu biết cũ *"chưa đúng đầy đủ"*:

| | **MÔ HÌNH ① — CŨ, HẸP** | **MÔ HÌNH ② — MỚI, RỘNG** |
|---|---|---|
| Bảng | `subcontractors` · `subcon_orders` | `partners` · `assignments` · `assignment_daily_reports` |
| Dữ liệu thật | 2 nhà · 3 đơn | 6 đối tác · 3 assignment · 2 báo cáo |
| Phân loại | `service_type`: **`GIAT` · `IN_THEU`** | `partner_type`: `PRODUCTION_PARTNER` · `SERVICE_PARTNER` · `FORWARDER` |
| Phạm vi giao | `process_type` — **một chuỗi phẳng** | `scope_level`: `ORDER · SITE · LINE · STYLE_OPERATION` |
| Vòng đời | `status` đơn giản | **9 trạng thái**, có nhánh và vòng lặp |
| Thương mại | `unit_price` — **một con số** | `assignment_commercial_terms` — **hai lớp** |
| Báo cáo | ⛔ **không có** | `assignment_daily_reports` — **sổ chỉ-ghi-thêm** |
| Đăng nhập của đối tác | ⛔ **không có** | `partner_accounts` *(🔴 0 dòng)* |
| Giao diện | ✅ `/subcon` — **màn hình NỘI BỘ** | 🔴 **⛔ chưa có màn hình nào** |

🔴 **`/subcon` hiện tại chạy trên MÔ HÌNH ①.** Nó là màn hình **cho người MONICA
dùng** để theo dõi việc gửi hàng đi giặt/in — ⛔ **không phải** cổng cho đối tác
đăng nhập. Đúng như Board nói: đó ⛔ **không phải** Subcontract Portal.

⚠️ Và `partners` còn mang **bốn cột legacy** — `customer_id` · `subcon_id` ·
`subcontractor_id` · `supplier_id` — chính là **cầu nối tạm** giữa hai mô hình.

🔑 **Hai mô hình cùng sống là nguồn sự thật kép**, và chúng sẽ lệch nhau đúng
vào lúc ⛔ không ai để ý. §9 xử lý việc này — và nó phải được xử lý **trước**
khi mở cổng, ⛔ không phải sau.

---

# 1. BUSINESS DEFINITION

## 1.1 Subcontractor là ai

> **Subcontractor = MỌI đơn vị sản xuất/gia công bên ngoài mà MONICA giao việc
> và chịu trách nhiệm về kết quả.**

⚠️ **⛔ KHÔNG phải Supplier.** Board §9 nói thẳng và điều này phải vào từ vựng:

| | Supplier *(nhà cung cấp)* | **Subcontractor** *(đối tác sản xuất)* |
|---|---|---|
| Đưa cho MONICA | **vật tư** — vải, chỉ, cúc | **công sức trên hàng của MONICA** |
| Quyền sở hữu hàng | của họ tới lúc bán | 🔑 **luôn là của MONICA/khách** |
| Cần báo cáo tiến độ ⛔ | ⛔ không | ✅ **hằng ngày, có khi hằng giờ** |
| Hệ quả khi trễ | thiếu vật tư | 🔴 **trễ tàu, phạt buyer** |

🔑 Dòng *"quyền sở hữu"* là gốc của mọi thứ còn lại: **hàng ở xưởng ngoài vẫn
là hàng của MONICA.** Vì thế MONICA phải thấy nó, ⛔ không phải *"được phép hỏi
thăm"*.

## 1.2 Hai hình thái giao việc

### Ⓐ FULL ORDER — giao trọn đơn

```
PO 2601 · 10.000 pcs  ──►  Xưởng Minh Phát
   nhận NPL · cắt · may · hoàn thiện · đóng gói · giao hàng
```

⇒ `scope_level = 'ORDER'`. ✅ **Đã chạy được** — 2/3 assignment thật đang ở cấp này.

### Ⓑ PROCESS SUBCONTRACT — giao theo công đoạn

```
Order 20.000 pcs
  ├─ Nhà máy A   Cutting    20.000 pcs
  ├─ Nhà máy B   Sewing     20.000 pcs
  └─ Nhà máy C   Printing   20.000 pcs
```

⇒ `scope_level = 'STYLE_OPERATION'`. 🔴 **Có trên lược đồ, ⛔ KHÔNG dùng được
thật:** `style_operations` có **0 dòng**. Giao diện sẽ hiện một ô chọn **rỗng**.

⚠️ Ⓑ đặt ra một câu hỏi mà mô hình hiện tại **⛔ chưa trả lời**:

> **Ba nhà máy cùng làm trên MỘT lô 20.000 pcs. Hàng đi từ A sang B thế nào ⛔**

`assignment_bundles` nối Assignment với `cut_bundles` — đó là **mầm** của câu
trả lời. Nhưng *"B ⛔ không được bắt đầu trước khi A giao"* là **luật phụ thuộc
giữa các Assignment**, và luật đó **⛔ CHƯA TỒN TẠI**. Xem §9 `R-5`.

## 1.3 Mô hình thương mại — **⛔ KHÔNG hard-code**

Board liệt kê: `CM` · `CMT` · `CMPT` · `CMPTH` · `FOB` · `Full package` · *và
những mô hình tương lai*.

✅ **Kiến trúc đã đúng, đã có, ⛔ chỉ chưa gieo.** `029` dùng **HAI LỚP**, và sự
tách lớp đó chính là thứ khiến *"⛔ không hard-code"* thành sự thật:

| Lớp | Là gì | Cài đặt | Vì sao |
|---|---|---|---|
| ① **Quan hệ thương mại** | `CM` · `CMT` · `FOB` … | **bảng `contract_types`** — dữ liệu nền | ⚠️ Danh sách này **⛔ KHÔNG hữu hạn**. Thêm mô hình mới = **thêm một DÒNG**, ⛔ không phải một migration |
| ② **Cách tính một đồng** | `PER_UNIT` · `PER_OPERATION` · `PER_SAM_MINUTE` · `PER_KG` · `LUMP_SUM` | **`CHECK`** trên `rate_method` | 🔑 Danh sách này **hữu hạn và ổn định** — chỉ có ngần ấy cách tính tiền gia công trong ngành may |

🔑 **Vì sao tách hai lớp là quyết định đúng, ⛔ không phải phức tạp hoá:**
`CM` và `CMT` khác nhau ở **phạm vi trách nhiệm** *(ai mua phụ liệu)*, ⛔ không
khác ở cách tính tiền — **cả hai** đều có thể trả `PER_UNIT`. Gộp làm một
enum ⇒ mỗi lần thêm mô hình phải thêm **một migration**, và Board vừa nói
tương lai **sẽ có** mô hình mới.

🔴 **Nợ:** `contract_types` **0 dòng** ⇒ `contract_type_code` của 2 điều khoản
đang có đều **RỖNG**. Mô hình thương mại hiện **⛔ không ghi nhận được**.

---

# 2. USER MODEL

## 2.1 Cấp tài khoản — **ba thứ, ⛔ không phải một**

```
Tài khoản  factory001@subcon.com
Mật khẩu   ******** (ép đổi lần đăng nhập đầu — `force_password_change`)
Đường vào  subcon.monicalink.com
```

## 2.2 🔑 `partner_accounts` — vì sao ⛔ KHÔNG dùng claim trong JWT

> ⚠️ **`Actor.partnerId` PHẢI phân giải từ `partner_accounts`. ⛔ TUYỆT ĐỐI
> KHÔNG lấy từ `app_metadata` của JWT.**

**Lý do, và nó là một lỗ hổng thật ⛔ không phải lo xa:**

```
Hôm nay      cấp tài khoản cho Xưởng A  →  JWT mang claim partner = A
6 tháng sau  chấm dứt hợp tác với A
             JWT cũ VẪN CÒN HẠN, VẪN MANG claim A
             ⇒ họ VẪN VÀO ĐƯỢC, vẫn thấy đơn hàng
```

🔑 **JWT ⛔ không mang QUYỀN. JWT chỉ mang DANH TÍNH.** `partner_accounts` có
cột `is_active` — tắt một dòng là **cắt ngay lập tức**, ⛔ không chờ token hết
hạn.

⚠️ Một tài khoản thuộc **ĐÚNG MỘT** đối tác đang hiệu lực *(chỉ mục duy nhất
`uq_partner_account_active`)*. Người làm cho hai xưởng cần **hai tài khoản** —
vì mọi phép hỏi quyền sẽ phải hỏi *"trong ngữ cảnh nào ⛔"*, và ⛔ không có
ngữ cảnh nào để hỏi.

## 2.3 🔴 KHOẢNG TRỐNG ĐÃ ĐO — **0 dòng**

```
partner_accounts:  🔴 0 dòng
```

⇒ **⛔ Chưa từng có một subcontractor nào đăng nhập vào Monica ONE.** Toàn bộ
kiến trúc phân quyền đối tác *(`027` · `029` · `031` · `assignment-permission.ts`)*
hiện **⛔ chưa được một người thật nào đi qua**.

⚠️ Đây là lý do §10 đặt **thí điểm một xưởng** làm điều kiện bắt buộc: một bộ
luật quyền ⛔ chưa ai đi qua thì ⛔ **chưa được chứng minh** — chỉ mới **được
lập luận**.

---

# 3. PERMISSION MODEL

## 3.1 🔑 LUẬT NỀN — phân quyền theo **ASSIGNMENT**, ⛔ không theo **ROLE**

> **Playbook Điều XXX — ƯU TIÊN TỐI CAO**

```
Identity → Assignment → Resource Scope → Permission → Action
```

**Vai trò là thuộc tính của NGƯỜI. Assignment là thuộc tính của VIỆC.**

⚠️ Chỉ dựa vào vai thì một người mang vai `subcon` **thấy mọi thứ mà `subcon`
được thấy** — ⛔ không có chỗ nào nói *"người này, việc này, đơn này, tới ngày
này"*. Đó **chính là gốc của ba lỗ hổng thật đã vá ở `025`/`026`**.

🔴 **Ba điều cấm tuyệt đối:**

| ⛔ Cấm | Vì sao |
|---|---|
| Hard-code `subcon_id` | quyền ⛔ không đến từ *"anh là ai"* |
| So chuỗi `'subcon'` trong logic nghiệp vụ | như trên |
| Truy vấn theo `subcon_id` mà **bỏ qua Assignment** | bỏ qua đúng thứ khoanh vùng |

## 3.2 Bốn vai Board yêu cầu ⟷ hiện trạng

| Vai Board | Quyền | Hiện trạng |
|---|---|---|
| **MONICA ADMIN** | tạo đối tác · giao việc · xem toàn bộ | ✅ `superadmin` |
| **MONICA MD** | theo dõi đơn mình phụ trách | ✅ `md` |
| **SUBCON MANAGER** | xem đơn của **xưởng mình** · cập nhật tiến độ · xác nhận nhận việc | 🔴 **⛔ CHƯA CÓ** |
| **SUBCON OPERATOR** | **nhập sản lượng** · tải bằng chứng | 🔴 **⛔ CHƯA CÓ** |

**Hiện chỉ có MỘT vai `subcon`** — ⛔ không tách quản lý với người nhập số.

### ⚠️ Vì sao tách hai vai là **ĐÚNG**, ⛔ không phải vẽ vời

🔑 Đây là **Phân tách trách nhiệm** *(SoD)* — cùng nguyên tắc đã vá lỗ hổng MD
tự duyệt chiết tính:

```
Người GÕ con số        ⛔ KHÔNG nên là người XÁC NHẬN con số đó với MONICA
Người NHẬN việc         là người CHỊU TRÁCH NHIỆM  ⇒ phải là MANAGER
```

⚠️ **Nhưng ⛔ KHÔNG được hiểu Operator là "người chỉ đọc".** Ghi nhớ nền tảng
của dự án: **nhà thầu BẮT BUỘC GHI** — sản lượng, sự cố, báo cáo ngày. Buyer
mới là bên Đọc · Duyệt · Bình luận · Tải về. **Operator là vai GHI nhiều nhất
hệ thống.**

## 3.3 Bốn hàng rào — mỗi hàng rào **⛔ không thay được** hàng rào khác

```
① subcon.monicalink.com    tên miền riêng  →  ⛔ KHÔNG phải hàng rào bảo mật
② middleware.ts            chốt điều hướng →  để ⛔ không mời họ bấm vào thứ sẽ bị từ chối
③ assignment-permission.ts bộ luật thuần   →  nhận DỮ LIỆU, trả PHÁN QUYẾT
④ RLS (migration 031)      🔴 HÀNG RÀO THẬT
```

🔴 **① là mỹ quan, ⛔ KHÔNG phải bảo mật.** Cùng một ứng dụng, cùng một CSDL.
Đối tác gõ `app.monica…` vẫn tới cùng chỗ. **Hàng rào thật luôn ở CSDL.**

🔑 **③ ⛔ không phải bản cài đặt thứ hai của ④** — nó là **tầng thực thi thứ
hai**, và hai bên **có bài kiểm đối chiếu**. Bộ luật thuần cố ý ⛔ **không
biết** Supabase, JWT, tên bảng.

## 3.4 Bốn điều đối tác **⛔ KHÔNG BAO GIỜ** được thấy

```
⛔ Xưởng khác          — kể cả cùng một đơn hàng
⛔ Giá bán cho khách   — biết giá FOB là biết biên lợi nhuận của MONICA
⛔ Dữ liệu nội bộ      — chiết tính · công nợ · lương
⛔ Đơn NGOÀI phạm vi   — kể cả của chính họ, nếu Assignment đã đóng
```

🔑 Dòng cuối là dòng hay bị bỏ sót nhất, và nó là lý do `PARTNER_ACCESS_BY_STATUS`
tồn tại: quyền **⛔ không vĩnh viễn**, nó **theo trạng thái của việc**.

---

# 4. WORKFLOW

## 4.1 Luồng chuẩn — Board §7, ánh xạ sang chín trạng thái đã có

```
MONICA lập assignment ─────────────────────────►  DRAFT
   chọn: đối tác · đơn · style · SL · công đoạn · hạn
        │
        ▼ phát hành                                ISSUED
Đối tác NHẬN VIỆC ──┬── xác nhận ───────────────►  ACCEPTED
                    └── từ chối ────────────────►  REJECTED ──► (sửa) ISSUED
        │
        ▼ bắt đầu làm                              IN_PROGRESS
   ┌────────────────────────────┐
   │ BÁO CÁO NGÀY  (+ hằng giờ) │  ◄── vòng lặp hằng ngày
   │ MONICA theo dõi · phản hồi │
   └────────────────────────────┘
        │                       └── sự cố ──────►  SUSPENDED ──► IN_PROGRESS
        ▼ báo xong                                 COMPLETED
MONICA nghiệm thu ──┬── đạt ───────────────────►  CLOSED    ⬛ cuối
                    └── ⛔ không đạt ───────────►  IN_PROGRESS
                                                   CANCELLED ⬛ cuối
```

✅ **Đồ thị này đã tồn tại** trong `ALLOWED_TRANSITIONS`, và `029` có **trigger
`I-9`** chặn ghi con vào trạng thái cuối — nên giao diện và CSDL **nói cùng một
câu**.

## 4.2 🔑 Ba điểm trong luồng dễ bị làm hỏng nhất

### ① `ACCEPTED` là **cam kết hai chiều**, ⛔ không phải một cú bấm

> *"Tôi đã nhận 20.000 pcs · Cutting · giao trước 20/08."*

🔑 Thiếu bước này thì tranh chấp *"tôi ⛔ chưa từng nhận việc đó"* **⛔ không có
gì để đối chiếu**. Đó là lý do `REJECTED` **phải tồn tại** như một trạng thái
hạng nhất, có `reject_reason` — ép người từ chối **nói ra vì sao**, thay vì im
lặng ⛔ không làm.

### ② `COMPLETED` ⛔ **KHÔNG** phải trạng thái cuối

Nó là *"đối tác **báo** xong"*. `CLOSED` là *"MONICA **xác nhận** xong"*.

🔑 Gộp hai cái làm một là để **bên báo cáo tự nghiệm thu chính mình** — cùng
họ khuyết tật với MD tự duyệt chiết tính, và với việc người ghi số tự xoá được
bằng chứng. **Vòng lặp `COMPLETED → IN_PROGRESS`** là đường về khi nghiệm thu
⛔ không đạt, và nó phải giữ.

### ③ `SUSPENDED` — ⛔ không phải trạng thái thừa

Mất điện · hết NPL · máy hỏng · đình công. ⚠️ ⛔ Không có nó, đối tác sẽ **báo
sản lượng 0** — và *"0 vì dừng"* ⟷ *"0 vì ⛔ không làm"* là **hai chuyện hoàn
toàn khác nhau**, mà biểu đồ ⛔ không phân biệt được.

🔑 Đây là ứng dụng trực tiếp của luật `NULL là phát biểu trung thực`:
**⛔ không đo được ≠ đo được bằng 0.**

---

# 5. REPORTING MODEL

## 5.1 `assignment_daily_reports` — ✅ **đã có, và thiết kế đã đúng**

| Cột | Trả lời |
|---|---|
| `target_qty` · `output_qty` | kế hoạch ⟷ thực tế |
| `defect_qty` · `rework_qty` | **chất lượng** |
| `downtime_minutes` | **⛔ vì sao ⛔ không đạt** |
| `issue_note` · `support_request` | 🔑 **đối tác XIN GIÚP** |
| `parent_report_id` · `correction_reason` | **đính chính** |
| `submitted_by` · `submitted_at` · `request_id` | ai · khi nào · chống gửi trùng |

### 🔑 Hai quyết định thiết kế đáng giữ

**Ⓐ Sổ CHỈ-GHI-THÊM.** Sửa một báo cáo = **lập bản đính chính** trỏ về bản cũ
qua `parent_report_id`, ⛔ **không** `UPDATE`. `029b` đã thu hồi quyền xoá cứng.

> Cùng nguyên tắc với `activity_log` *(`056`)* và với bằng chứng *(`057`)*:
> **người ghi con số ⛔ KHÔNG được xoá dấu vết của con số đó.**

⚠️ Và nó **buộc `correction_reason` phải có** — người sửa **phải nói vì sao**.
Con số đầu tiên vẫn nằm đó. Đó chính là thứ MONICA cần khi buyer hỏi.

**Ⓑ `support_request` — cột quan trọng nhất và dễ bị bỏ nhất.**

🔑 Nó lật ngược quan hệ: portal ⛔ **không chỉ** là chỗ MONICA **đòi** số, mà là
chỗ đối tác **xin** giúp. ⚠️ Một portal chỉ đòi mà ⛔ không nghe thì đối tác sẽ
báo cáo **cho xong** — và **số liệu đối phó tệ hơn ⛔ không có số liệu**, vì nó
trông giống dữ liệu thật.

## 5.2 🔴 BÁO CÁO THEO GIỜ — **⛔ CHƯA TỒN TẠI**

Board §4⑤ yêu cầu:

```
08:00  500 pcs      09:00  800 pcs      10:00  1.200 pcs
```

🔴 **⛔ Không có bảng nào.** `assignment_daily_reports` có `report_date` kiểu
`DATE` — ⛔ **không giữ được giờ**.

### ⚠️ Và đây là chỗ dễ thiết kế sai nhất trong toàn bộ tài liệu này

| ⛔ SAI — đổi `report_date` thành `TIMESTAMPTZ` | ✅ ĐÚNG — bảng con `assignment_hourly_reports` |
|---|---|
| Phá **2 dòng dữ liệu thật** và mọi truy vấn theo ngày | báo cáo ngày giữ nguyên |
| Nhập nhằng: một dòng là *cả ngày* hay *một giờ* ⛔ | ⛔ không nhập nhằng |
| Tổng ngày phải suy ra ⇒ nguy cơ **đếm hai lần** | ngày là **chốt**, giờ là **chi tiết** |

🔑 **Và luật vàng của dự án quyết định luôn phần còn lại:** *⛔ không lưu dữ
liệu tính toán được*. ⇒ Tổng ngày **⛔ KHÔNG** cộng tự động từ các dòng giờ.

⚠️ Vì sao: báo cáo giờ là **⛔ không đầy đủ theo bản chất** *(ai cũng bỏ sót
vài giờ)*. Cộng chúng lại rồi ghi đè lên con số ngày là **biến một ước lượng
thành một chốt** — và ⛔ không ai biết con số đó ⛔ không đáng tin.

⇒ **Hai con số cùng tồn tại**, và giao diện **hiện chênh lệch ra** thay vì
giấu đi. `SUM(giờ) ≠ ngày` là **một tín hiệu vận hành**, ⛔ không phải một lỗi.

**Bật theo yêu cầu, ⛔ không bật cho tất cả** — `assignments.require_hourly`.
Đơn gấp cần theo giờ; đơn thường mà bắt báo 12 lần/ngày là **cách chắc chắn
nhất để họ ⛔ ngừng báo**.

---

# 6. EVIDENCE MODEL

## 6.1 🔑 ⛔ KHÔNG dựng khuôn mới — dùng **EVIDENCE DNA**

> [`docs/MONICA_ONE_EVIDENCE_DNA.md`](MONICA_ONE_EVIDENCE_DNA.md) §8:
> **⛔ KHÔNG tạo `SubconEvidence`. Cùng một bài toán ⇒ MỘT khuôn.**

Dùng lại **nguyên vẹn**: `md_documents` · bucket `evidences` *(riêng tư)* ·
`layUrlBangChung` *(Signed URL 300 giây)* · `mime.ts` *(một allowlist)*.

🔴 **Và ở đây, `layUrlBangChung` bước ② TỰ ĐỘNG đúng luật Assignment** — vì nó
**hỏi RLS** bằng phiên của chính người gọi, mà RLS `031` đã thi hành khoanh
vùng theo Assignment. ⇒ Đối tác **⛔ không xem được ảnh của xưởng khác** mà
⛔ **không phải viết thêm một dòng quyền nào**.

🔑 Đó ⛔ không phải may mắn — đó là **phần thưởng của việc ⛔ không viết bộ luật
quyền thứ hai**.

## 6.2 Việc phải làm — ⛔ CHƯA làm

| # | Việc | Ghi chú |
|---|---|---|
| ① | `ASSIGNMENT` · `ASSIGNMENT_REPORT` vào `md_documents_entity_type_check` **VÀ** `BANG_THEO_ENTITY` | ⚠️ **CẢ HAI** — quên một bên ⇒ bằng chứng ⛔ không xem được |
| ② | `md_documents.field_name` — nợ `R-1` của Evidence DNA | để ảnh gắn vào **`output_qty`**, ⛔ không chỉ gắn vào cả báo cáo |
| ③ | `require_evidence` trên `assignments` | Board §5: *"khi cần"* — ⛔ không phải luôn luôn |

## 6.3 ⚠️ **Bằng chứng ⛔ KHÔNG được là rào cản làm người ta ngừng báo**

Board §5 viết *"khi cần"*, và đó là **chữ quan trọng nhất của cả mục**.

```
Bắt buộc ảnh cho MỌI con số  ⇒  tổ trưởng ⛔ không báo nữa
                             ⇒  MONICA MẤT LUÔN cả con số
```

🔑 **⛔ Không có số liệu còn tệ hơn có số liệu ⛔ chưa có ảnh.** Cấu hình theo
đơn hàng: đơn tranh chấp cao · buyer đòi truy xuất ⇒ bật. Đơn thường ⇒ khuyến
khích, ⛔ không chặn.

⚠️ Và giới hạn thật, đã ghi ở Evidence DNA §9.5: hệ thống kiểm được **có ảnh**,
⛔ **không** kiểm được **ảnh chụp cái gì**. Ảnh biến *"tin lời"* thành *"có cái
để đối chiếu"* — nó ⛔ **không** biến thành *"chắc chắn đúng"*.

## 6.4 Ràng buộc hiện trường — quyết định kỹ thuật đã chốt

```
getUserMedia  ⇒  đòi HTTPS.  Xưởng gia công chạy LAN http://192.168.x.x
              ⇒  BỊ CHẶN THẲNG, ⛔ không đường lùi.
```

⇒ `<input type="file" accept="image/*" capture="environment">`. Hồ sơ **ẢNH
HIỆN TRƯỜNG** *(Evidence DNA §3.8)* — bằng chứng cho một con số ở xưởng
**phải là ảnh**, ⛔ không phải PDF.

---

# 7. PRODUCTION VISIBILITY MODEL

## 7.1 Board §2 — luồng đòi hỏi trách nhiệm

```
Customer ──đòi tiến độ──► MONICA ──đòi tiến độ──► Subcontractor
                              ▲                        │
                              └────── báo cáo ─────────┘
```

🔑 **MONICA ⛔ không thể hứa với khách điều mà chính MONICA ⛔ không nhìn thấy.**
Đó là toàn bộ lý do tồn tại của portal.

## 7.2 SUBCONTRACTOR COMMAND CENTER *(đối tác nhìn)*

Xếp theo **tám tầng** của [`WORKSPACE_DESIGN_DNA`](WORKSPACE_DESIGN_DNA.md) —
trả lời ***"tôi phải làm gì bây giờ?"***, ⛔ **không** phải *"tôi có dữ liệu gì?"*:

```
① Command Center   3 số:  việc CHỜ XÁC NHẬN · ĐANG LÀM · TRỄ HẠN
② Quick Actions    [Xác nhận nhận việc] [Báo cáo hôm nay] [Báo sự cố]
③ Risk Center      🔴 trễ hạn · ⚠️ hôm qua ⛔ chưa báo · ⛔ thiếu bằng chứng
④ Business Flow    PO 2601 → Cutting ✅100% → Sewing 65% → Packing ⏳
⑤ Today's Focus    hôm nay phải xong bao nhiêu, đã được bao nhiêu
⑥ Data             danh sách Assignment
⑦ Task             báo cáo ⛔ chưa nộp · phản hồi từ MONICA
⑧ Report           lịch sử · năng suất · tỷ lệ lỗi CỦA CHÍNH HỌ
```

⚠️ **Tầng ③ là lý do đối tác quay lại mỗi ngày.** Một portal chỉ có ⑥ *(danh
sách)* là **một cái kho**, ⛔ không phải một cổng vận hành — và ⛔ không ai mở
kho mỗi sáng.

## 7.3 SUBCONTRACTOR CONTROL CENTER *(MONICA nhìn)*

```
PO 2601 · ABC Brand · 20.000 pcs
├─ Xưởng A  Cutting   ████████████████████ 100%   ✅ CLOSED
├─ Xưởng B  Sewing    █████████████░░░░░░░  65%   ⚠️ chậm 2 ngày
└─ Xưởng C  Packing   ████░░░░░░░░░░░░░░░░  20%   🔴 ⛔ chưa báo 3 ngày
```

Lát cắt: đơn hàng · công đoạn · **tiến độ** · **trễ hạn** · **năng suất** ·
**chất lượng** · **bằng chứng** · **lịch sử báo cáo**.

### 🔑 Ba luật dữ liệu ⛔ không được vi phạm ở màn hình này

| Luật | Nghĩa ở đây |
|---|---|
| **⛔ Không lưu dữ liệu tính toán được** | `%` hoàn thành · `trễ mấy ngày` · `năng suất` **⛔ KHÔNG có cột trong CSDL**. Dùng **SQL View** |
| **`NULL` là phát biểu trung thực** | 🔴 *"⛔ chưa báo"* ⟷ *"báo 0"* phải hiện **KHÁC NHAU**. Vẽ cả hai thành `0%` là **xoá mất tín hiệu quan trọng nhất** — im lặng thường là dấu hiệu sớm nhất của trục trặc |
| **Mọi con số có đơn vị** | `pcs` ⟷ `kg` ⟷ `mét` — `assignments.uom` đã có |

## 7.4 ⚠️ *"Thời gian thực"* — nói cho đúng

Board §2 viết *"real-time"*. Trung thực:

```
✅ Làm được   dữ liệu MỚI NHẤT MÀ ĐỐI TÁC ĐÃ NỘP, hiện ngay khi nộp
⛔ KHÔNG làm được   biết chuyện gì đang xảy ra ở xưởng ngoài khi họ ⛔ chưa nộp
```

🔑 **Cấp độ thật là *"cận thời gian thực, do người nhập"*.** Ai bán nó như
*"giám sát thời gian thực"* là đang hứa thay cho một con người ở xưởng khác.

⚠️ ⇒ **Chỉ số quan trọng nhất của portal ⛔ không phải sản lượng — mà là TỶ LỆ
NỘP BÁO CÁO ĐÚNG HẠN.** Nó đo thứ duy nhất quyết định mọi số còn lại có tồn tại
hay ⛔ không.

---

# 8. FUTURE SCALABILITY

## 8.1 🔴 SUBCONTRACTOR CAPABILITY MODEL — Board §10

> **⛔ KHÔNG tạo CM portal riêng · CMT portal riêng · FOB portal riêng.**

```
Xưởng A
  Năng lực     Cutting · Sewing · Printing · Packing
  Mô hình      CM · CMT · FOB
```

⇒ **MỘT cổng**, hiển thị theo **năng lực và mô hình của từng đối tác**.

🔑 **Vì sao đây ⛔ không phải chuyện gọn gàng:** ba cổng ⇒ **ba** bản cài đặt
phân quyền, **ba** đường tải bằng chứng, **ba** chỗ sửa khi luật đổi. Đối tác
làm **cả CM lẫn FOB** thì họ vào cổng nào ⛔ Câu hỏi đó ⛔ **không có câu trả
lời đúng** — vì tiền đề *"một đối tác = một mô hình"* **sai ngay từ đầu**.

## 8.2 🔴 KHOẢNG TRỐNG — **⛔ KHÔNG CÓ bảng năng lực**

```
partner_capabilities:   🔴 ⛔ KHÔNG TỒN TẠI
```

Hiện chỉ có `partners.partner_type` — **một giá trị cho cả đối tác**:

```
SC1 Xưởng Minh Phát   PRODUCTION_PARTNER
SUB-IN-01 Xưởng In    SERVICE_PARTNER
```

🔴 **⛔ Không diễn đạt nổi** *"Xưởng A làm được cắt và may, ⛔ không làm được
in"* — mà đó **chính là** câu hỏi phải trả lời khi giao việc theo công đoạn.

⚠️ Hệ quả cụ thể: lúc lập Assignment `STYLE_OPERATION`, ô chọn đối tác sẽ liệt
kê **mọi** đối tác — kể cả xưởng ⛔ không làm được công đoạn đó. **Sai sót loại
này ⛔ không lộ ra cho tới lúc hàng đã gửi đi.**

**Khuôn đề xuất** *(⛔ CHƯA làm — `R-2`)*:

```sql
CREATE TABLE public.partner_capabilities (
  partner_id      UUID NOT NULL REFERENCES public.partners(id),
  capability_code VARCHAR(30) NOT NULL,   -- ⚠️ tra BẢNG, ⛔ không CHECK
  capacity_per_day NUMERIC(14,3),         -- năng lực/ngày — để gợi ý khi giao
  uom             VARCHAR(20),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
);
```

🔑 **`capability_code` tra bảng, ⛔ KHÔNG dùng `CHECK`** — cùng lý do
`contract_types` là bảng: Board nói tương lai **sẽ có** năng lực mới *(ép nhiệt,
laser, seamless…)*. Thêm năng lực = **thêm một DÒNG**, ⛔ không phải một
migration. Ngược lại `rate_method` **hữu hạn và ổn định** ⇒ `CHECK` đúng chỗ.

⚠️ **`capacity_per_day` là GỢI Ý, ⛔ KHÔNG phải hàng rào.** Chặn cứng khi vượt
năng lực sẽ khiến người điều độ ⛔ không giao được trong lúc gấp — và họ sẽ đi
đường vòng ngoài hệ thống. **Cảnh báo, ⛔ đừng chặn.**

## 8.3 Ba hướng mở rộng — kiểm tra **ngay bây giờ** rằng khuôn chịu được

| Tương lai | Khuôn chịu được ⛔ |
|---|---|
| Mô hình thương mại mới *(CMPTH…)* | ✅ **1 dòng** vào `contract_types` |
| Năng lực mới *(ép nhiệt · laser)* | ✅ **1 dòng** vào `partner_capabilities` *(sau `R-2`)* |
| Đối tác **thầu lại cho đối tác khác** | 🔴 **⛔ KHÔNG** — `assignments.partner_id` là **một** đối tác; ⛔ không có khái niệm chuỗi nhiều cấp |

⚠️ **Dòng thứ ba là giới hạn thật, và nó có thật trong ngành.** Xưởng A nhận
20.000 pcs rồi thầu lại 5.000 cho Xưởng D — MONICA **⛔ không nhìn thấy D**.
Ghi ra ở đây để khi nó xảy ra, ⛔ không ai ngạc nhiên. ⇒ `R-6`.

---

# 9. 🔴 HIỆN TRẠNG ⟷ ĐÍCH — bảng khoảng cách, **đo ⛔ không ước**

| # | Board yêu cầu | Hiện trạng | Nợ |
|---|---|---|---|
| 1 | Đối tác **đăng nhập** được | 🔴 `partner_accounts` **0 dòng** | `R-3` |
| 2 | Giao **trọn đơn** | ✅ **chạy được** | — |
| 3 | Giao **theo công đoạn** | 🟠 lược đồ có · `style_operations` **0 dòng** | `R-4` |
| 4 | **CM · CMT · FOB…** | 🟠 hai lớp đúng · `contract_types` **0 dòng** | `R-1` |
| 5 | **Năng lực** đối tác | 🔴 **⛔ không có bảng** | `R-2` |
| 6 | **Báo cáo ngày** | ✅ **đã có, thiết kế đúng** | — |
| 7 | **Báo cáo giờ** | 🔴 **⛔ không có bảng** | `R-7` |
| 8 | **Bằng chứng** trên báo cáo | 🟠 hạ tầng ✅ · ⛔ chưa nối | `R-8` |
| 9 | **SUBCON MANAGER/OPERATOR** | 🔴 chỉ có **một** vai `subcon` | `R-9` |
| 10 | **Command Center** của đối tác | 🔴 **⛔ chưa có màn hình** | `R-10` |
| 11 | **Control Center** của MONICA | 🔴 **⛔ chưa có màn hình** | `R-11` |
| 12 | Phụ thuộc giữa các công đoạn | 🔴 **⛔ không có luật** | `R-5` |
| 13 | Thầu lại nhiều cấp | 🔴 **⛔ không mô hình hoá** | `R-6` |
| 14 | **Hợp nhất hai mô hình song song** | 🔴 **⛔ chưa quyết** | `R-0` |

## 9.1 🔴 `R-0` — VIỆC PHẢI QUYẾT **TRƯỚC** MỌI VIỆC KHÁC

Hai mô hình ở §0.1 **⛔ không được cùng sống** khi cổng mở. Ba đường:

| | Đường | Đánh giá |
|---|---|---|
| ⓐ | Giữ cả hai, mỗi cái một việc | 🔴 **BÁC** — hai nguồn sự thật về *"đối tác nào đang làm gì"* |
| ⓑ | Chuyển ① sang ②, giữ `/subcon` làm **màn hình nội bộ** đọc từ ② | ✅ **ĐỀ XUẤT** |
| ⓒ | Xoá ① | ⛔ **BÁC** — *"⛔ không xoá logic cũ"*, và ① đang có **3 đơn thật** |

**Vì sao ⓑ:** ② là siêu tập của ① *(`service_type: GIAT` ⇒ một `capability_code`;
`process_type` ⇒ `style_operation`; `unit_price` ⇒ `rate_method='PER_UNIT'`)*.
⇒ Chuyển được **⛔ không mất mát**. Và `/subcon` **giữ nguyên** — nó vẫn hữu
ích, chỉ đổi **nguồn đọc**.

⚠️ Cột `assignment_id` **đã có sẵn** trên `subcon_orders` — cầu nối đã được ai
đó chuẩn bị. Dùng nó.

## 9.2 Năm giai đoạn

```
GĐ 0  ⛔ CHƯA MỞ   Board/CEO duyệt tài liệu · ADR · quyết R-0 · gỡ SECURITY FREEZE
GĐ 1  NỀN          R-0 R-1 R-2 R-4  → gieo dữ liệu + bảng năng lực. ⛔ CHƯA có cổng
GĐ 2  CỔNG         R-3 R-9 R-10     → MỘT xưởng thật đăng nhập, FULL ORDER
      🔴 CHẠY THẬT 2 TUẦN rồi mới đi tiếp
GĐ 3  NHÌN THẤY    R-8 R-11         → bằng chứng + Control Center
GĐ 4  MỞ RỘNG      R-5 R-7 R-6      → công đoạn nối nhau · báo giờ · thầu lại
```

### 🔑 Vì sao GĐ 2 dừng lại **hai tuần** và ⛔ không được bỏ

Rào cản thật của portal này ⛔ **không phải kỹ thuật** — mà là **hành vi con
người ở một tổ chức MONICA ⛔ không quản lý được**:

```
⛔ Xưởng có chịu báo cáo mỗi ngày ⛔
⛔ Ai ở xưởng thật sự gõ số — chủ xưởng hay tổ trưởng ⛔
⛔ Mạng ở xưởng có tải nổi ảnh 3 MB ⛔
⛔ Bắt buộc bằng chứng có khiến họ NGỪNG báo ⛔
```

⚠️ **⛔ Không câu nào trả lời được bằng suy luận.** Mở cho 6 đối tác cùng lúc
rồi mới phát hiện là **hỏng quan hệ với 6 đối tác**, ⛔ không phải hỏng một
tính năng. Và quan hệ với xưởng gia công ⛔ **không khôi phục nhanh** — họ có
thể đơn giản là **⛔ không dùng nữa**, và MONICA mất luôn cả tầm nhìn lẫn thiện
chí.

## 9.3 ⚠️ ĐIỀU KIỆN TIÊN QUYẾT — 🔴 **CÒN HIỆU LỰC**

| | |
|---|---|
| **SECURITY FREEZE** *(`MOS §XI.1` · Hiến pháp XI.1)* | 🔴 *"⛔ **không mở Domain / Module / bảng nghiệp vụ mới**"* cho tới khi `031a→031g` hoàn tất **và được xác nhận bằng văn bản**. `B2` ⛔ chưa cắt |
| **ADR** | 🔴 Hiến pháp **Điều 4** — ⛔ **KHÔNG viết SQL trước khi ADR được duyệt** |
| **Nghiệp vụ vào BKB** | Định nghĩa Subcontractor · mô hình thương mại · luật báo cáo thuộc **bậc 0′** |

🔴 **⇒ GĐ 1 ⛔ KHÔNG ĐƯỢC BẮT ĐẦU.** `R-2` · `R-7` là **bảng nghiệp vụ mới** —
đúng thứ SECURITY FREEZE cấm. Cần Board **gỡ hoặc miễn trừ tường minh**.

⚠️ Tôi ⛔ **không** tự cho mình ngoại lệ vì *"Board vừa yêu cầu"*. Board yêu cầu
**định nghĩa** *(§11: "CHƯA CODE")* — đó chính là việc tài liệu này làm.

---

# 10. ⛔ ĐIỀU TÀI LIỆU NÀY **KHÔNG** HỨA

| ⛔ Không hứa | Vì sao |
|---|---|
| Giám sát **thời gian thực** | §7.4 — cận thời gian thực, **do người nhập** |
| Số liệu đối tác nộp là **đúng** | Bằng chứng cho *"có cái đối chiếu"*, ⛔ không cho *"chắc chắn đúng"* |
| Đối tác **sẽ** dùng | Đây là **thay đổi vận hành ở tổ chức khác**. §9.2 GĐ 2 là chỗ đo điều đó |
| Nhìn thấy **thầu lại nhiều cấp** | §8.3 — ⛔ chưa mô hình hoá |
| Chặn `service_role` / superuser | Evidence DNA §4.5 — storage ⛔ không đặt trigger được |

---

# 11. THAM CHIẾU

| Loại | Đường dẫn |
|---|---|
| **Luật phân quyền** | `docs/ENGINEERING_PLAYBOOK.md` **Điều XXX** |
| **Bộ luật thuần** | `lib/mos/permission/assignment-permission.ts` |
| **Từ vựng Assignment** | `lib/mos/domain/assignment.ts` |
| **Migration nền** | `027_partner_domain` · `029_assignment_domain` · `029b_revoke_hard_delete` · `031*` |
| **Bằng chứng** | [`MONICA_ONE_EVIDENCE_DNA.md`](MONICA_ONE_EVIDENCE_DNA.md) |
| **Bố cục Workspace** | [`WORKSPACE_DESIGN_DNA.md`](WORKSPACE_DESIGN_DNA.md) |
| **Mô hình cũ** *(sẽ chuyển)* | `app/(dashboard)/subcon/` · `subcontractors` · `subcon_orders` |

---

## 📌 MỘT TRANG

```
① Subcontractor ⛔ KHÔNG phải Supplier — họ làm việc TRÊN HÀNG CỦA MONICA
② Quyền theo ASSIGNMENT ⛔ không theo ROLE.  ⛔ Cấm hard-code `subcon_id`.
③ partnerId phân giải từ `partner_accounts` (có `is_active`) ⛔ KHÔNG từ JWT
④ MỘT cổng · Capability Model  ⛔ KHÔNG CM/CMT/FOB portal riêng
⑤ Hai lớp thương mại:  quan hệ = BẢNG (mở) · cách tính tiền = CHECK (đóng)
⑥ Sổ báo cáo CHỈ-GHI-THÊM.  Sửa = đính chính có lý do, ⛔ không UPDATE.
⑦ Bằng chứng dùng EVIDENCE DNA ⛔ KHÔNG dựng SubconEvidence
⑧ "⛔ chưa báo" ⟷ "báo 0" phải HIỆN KHÁC NHAU — im lặng là tín hiệu sớm nhất
⑨ Chỉ số quan trọng nhất ⛔ không phải sản lượng — là TỶ LỆ NỘP ĐÚNG HẠN
```

> 🔴 **Và điều quan trọng hơn chín dòng trên:**
> Kiến trúc đã đúng ~70%. Thứ thiếu ⛔ **không phải thiết kế** — mà là **dữ
> liệu nền, cổng vào, và một xưởng thật đi qua nó**. `partner_accounts` có
> **0 dòng**: ⛔ **chưa một subcontractor nào từng đăng nhập**. Một bộ luật
> quyền ⛔ chưa ai đi qua thì ⛔ **chưa được chứng minh** — nó mới chỉ **được
> lập luận**.
