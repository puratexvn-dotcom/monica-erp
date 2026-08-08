# MONICA ONE — KẾ HOẠCH BẢO MẬT KHO BẰNG CHỨNG

| | |
|---|---|
| **Trạng thái** | ✅ **ĐÃ THI HÀNH (`IMPLEMENTED`)** — 08/08/2026. `057` đã chạy · hành vi đo **13/13**. Xem §9. |
| **Ngày** | 08/08/2026 |
| **Nguồn** | Board Directive *EVIDENCE SECURITY FOUNDATION* 08/08/2026 |
| **Người soạn** | Chief Solution Architect |
| **Tiền đề** | [`MONICA_ONE_QUANTITY_EVIDENCE_AUDIT.md`](MONICA_ONE_QUANTITY_EVIDENCE_AUDIT.md) §1 |

---

> 🧾 **Khuôn đã đóng gói để dùng lại:** [`MONICA_ONE_EVIDENCE_DNA.md`](MONICA_ONE_EVIDENCE_DNA.md)
> — tệp này ghi *vì sao và đã làm gì*; DNA ghi *phân hệ mới làm thế nào*.

## 0. 🔑 KẾT LUẬN QUAN TRỌNG NHẤT — ĐỌC TRƯỚC

Đo trên CSDL và kho lưu trữ **đang chạy**, 08/08/2026:

```
Bucket `evidences`  ............ TỆP TRONG KHO: 0
Tham chiếu tệp trong CSDL ...... 0   (11 cột đã đếm)
Nơi mã gọi `getPublicUrl` ...... 1   (upload-action.ts:156)
```

⇒ **Đây là thời điểm RẺ NHẤT có thể để vá.** ⛔ Không tệp nào phải chuyển, ⛔
không URL nào phải viết lại, ⛔ không màn hình nào gãy.

🔑 Mỗi ngày trì hoãn, con số `0` kia lớn lên — và cùng với nó là **chi phí của
chính việc vá này**. Vá lúc kho rỗng tốn **một migration**; vá khi có 5.000 tệp
tốn thêm một cuộc di trú, một đợt viết lại URL, và một khoảng thời gian hệ
thống chạy nửa chừng.

⚠️ Ba dòng duy nhất có dữ liệu — `qa_defects.image_url` — trỏ sang
`images.unsplash.com`. Đó là **dữ liệu mẫu**, ⛔ không phải kho của ta, và nó
⛔ không chịu ảnh hưởng.

---

## 1. HIỆN TRẠNG — ĐO, ⛔ KHÔNG SUY ĐOÁN

### 1.1 Kho lưu trữ

**Đúng MỘT bucket** trên toàn hệ thống:

| | |
|---|---|
| `id` | `evidences` |
| `public` | 🔴 **`true`** |
| `file_size_limit` | `8 388 608` *(8 MB)* |
| `allowed_mime_types` | `image/jpeg` · `image/png` · `image/webp` · `image/heic` · `image/heif` |

### 1.2 Bốn policy trên `storage.objects` — `013_storage_evidences.sql`

| Policy | Phép | Vai | Điều kiện |
|---|---|---|---|
| `evidences_public_read` | `SELECT` | 🔴 **`public`** | `bucket_id = 'evidences'` |
| `evidences_authenticated_insert` | `INSERT` | `authenticated` | `auth.uid() IS NOT NULL` |
| `evidences_authenticated_update` | `UPDATE` | `authenticated` | `owner = auth.uid()` |
| `evidences_authenticated_delete` | `DELETE` | `authenticated` | `owner = auth.uid()` |

⚠️ **⛔ Không policy nào biết tới nghiệp vụ.** Chúng chỉ hỏi *"đã đăng nhập
chưa"* và *"có phải người tải lên ⛔ không"* — ⛔ không hề hỏi *"người này có
quyền với đơn hàng đó ⛔ không"*.

### 1.3 Nơi mã dùng URL — **chỉ MỘT**

```
app/actions/upload-action.ts:156   supabase.storage.from('evidences').getPublicUrl(path)
```

🔑 **CSDL lưu `path`, ⛔ KHÔNG lưu URL** — `upload-action.ts` khai rõ điều đó và
mọi nơi gọi đều làm đúng. URL công khai chỉ dùng để **xem trước ngay sau khi
tải lên**, ⛔ không lưu lại.

⇒ Đây là lý do việc chuyển sang bucket riêng tư **rẻ**: đổi **một dòng**.

---

## 2. RỦI RO — chứng minh bằng hành vi, ⛔ không bằng đọc policy

### 2.1 🔴 P0 · Bất kỳ ai trên internet đọc được mọi tệp bằng chứng

Phép thử thật, 08/08/2026 — tải một tệp bằng phiên `md001`, rồi gọi URL bằng
`fetch` **trần**: ⛔ không cookie, ⛔ không `apikey`, ⛔ không đăng nhập.

```
md001 tải lên .................. ĐƯỢC
KHÁCH VÃNG LAI đọc URL ......... HTTP 200   🔴
```

**Mức rủi ro: HIGH.**

Cái mất khi lộ: ảnh sản lượng · packing list · biên bản lỗi · **PO của khách** ·
đơn giá in trên chứng từ · tên khách hàng. Đây là **dữ liệu thương mại của bên
thứ ba** — nhà máy giữ hộ khách, và làm lộ nó là chuyện hợp đồng, ⛔ không phải
chuyện kỹ thuật nội bộ.

⚠️ *"URL chứa `uuid` nên khó đoán"* **⛔ không phải phòng thủ**. Một URL bị dán
vào email, Zalo, ảnh chụp màn hình, hay log của một proxy là một URL đã ra
ngoài — và nó **⛔ không hết hạn**.

### 2.2 🟠 P1 · Người tải tự xoá được bằng chứng, ⛔ không một dòng vết

```
md001 tự xoá tệp mình tải ...... ĐƯỢC   🔴 ⛔ không dòng nhật ký nào
```

🔑 **Cùng một họ khuyết tật với lỗ hổng `activity_log` vừa đóng bằng `056`**:
người ghi con số **tự xoá được bằng chứng của chính con số đó**. `056` đã bịt
đường xoá *vết ghi*; đường xoá *bằng chứng* vẫn mở.

**Mức rủi ro: MEDIUM** — hiện chưa có tệp nào, nhưng nó sẽ thành HIGH đúng lúc
bằng chứng bắt đầu có giá trị tranh chấp.

### 2.3 🔴 P0-b · **PDF ⛔ KHÔNG tải lên được** — khuyết tật ĐANG CHẠY

Phát hiện khi đo, ⛔ không nằm trong chỉ thị:

```
PDF  → BỊ TỪ CHỐI: mime type application/pdf is not supported
PNG  → ĐƯỢC
```

**Nguyên nhân:** `upload-action.ts` **có** `application/pdf` trong allowlist của
ứng dụng *(thêm 06/08/2026)*, nhưng `allowed_mime_types` của **bucket** ⛔ chưa
bao giờ được cập nhật theo. Hai allowlist, chỉ một cái được sửa.

🔴 **Đây là khuyết tật của chính tôi, đã đẩy lên nhánh chạy thật.** Khối *"đính
kèm hình ảnh & tài liệu"* của form PO mời người dùng chọn PDF, và Supabase từ
chối. Tính năng chạy **đúng một nửa**.

**Mức rủi ro: MEDIUM** *(⛔ không lộ dữ liệu, nhưng chức năng nói dối người dùng)*.

---

## 3. KIẾN TRÚC ĐỀ XUẤT

### 3.1 Chiến lược bucket — **giữ MỘT bucket**, ⛔ không tách nhiều

⛔ **BÁC** phương án *"mỗi phân hệ một bucket"*: policy nhân theo số bucket, và
⛔ không cái nào biết nghiệp vụ hơn cái nào. Phân tách theo **đường dẫn** đã đủ
và đã có sẵn: `<phân hệ>/<userId>/<ngày>/<uuid>.<ext>`.

| Thuộc tính | Nay | Đề xuất |
|---|---|---|
| `public` | `true` | 🔴 **`false`** |
| `allowed_mime_types` | 5 định dạng ảnh | **+ `application/pdf`** *(vá §2.3)* |
| `file_size_limit` | 8 MB | giữ |

### 3.2 Đường đọc — **Signed URL**, phát từ máy chủ

```
Trình duyệt  →  Server Action  →  guard() kiểm quyền nghiệp vụ
                                →  createSignedUrl(path, 300s)
                                →  trả URL có hạn
```

🔑 **Điểm cốt lõi, và là thứ hiện ⛔ hoàn toàn không có:** trước khi phát URL,
máy chủ hỏi *"người này có quyền đọc **bản ghi** mà tệp đó thuộc về ⛔"* —
⛔ không phải *"người này đã đăng nhập ⛔"*.

⚠️ Đây là chỗ `md_documents` trở nên **thiết yếu**: nó biết `entity_type` +
`entity_id`, tức biết tệp thuộc đơn nào — nên nó **kiểm được quyền**. Bảy khuôn
`evidence_path TEXT` kia **⛔ không biết gì** ngoài một chuỗi đường dẫn.

⇒ **Bảo mật kho bằng chứng và việc hợp nhất bảy khuôn là CÙNG MỘT việc**, ⛔
không phải hai.

### 3.3 Policy đề xuất

| Phép | Vai | Điều kiện |
|---|---|---|
| `SELECT` | ⛔ **KHÔNG AI** *(qua policy)* | chỉ đọc được bằng **Signed URL** máy chủ phát |
| `INSERT` | `authenticated` | `bucket_id = 'evidences'` — giữ nguyên |
| `UPDATE` | ⛔ **KHÔNG AI** | thay tệp = tải tệp mới + đánh dấu bản cũ; ⛔ không ghi đè |
| `DELETE` | 🔴 **CHỜ BOARD** | xem `Q2` ở §6 |

### 3.4 Xoá bằng chứng — **ba phương án, ⛔ tôi ⛔ không tự chọn**

| | Phương án | Được | Mất |
|---|---|---|---|
| **A** | ⛔ **Không cho xoá.** Chỉ thay thế; bản cũ giữ, đánh dấu `superseded` | Bằng chứng thành **bất biến**, đồng bộ với `056` | Tệp tải nhầm nằm lại vĩnh viễn |
| **B** | Cho xoá, **bắt buộc ghi `activity_log`** | Cân bằng; có vết | Vẫn xoá được bằng chứng bất lợi |
| **C** | Cho xoá **trong 15 phút đầu**, sau đó khoá | Sửa được lỗi tay nhanh | Thêm một luật thời gian phải giải thích |

🔑 **Đề nghị A** — nhất quán với `BDR-14` và `056`: nếu sổ kiểm toán bất biến
thì **bằng chứng của con số cũng nên bất biến**. Nhưng đây là **quyết định
nghiệp vụ**, ⛔ không phải kỹ thuật.

---

## 4. CÁC BƯỚC CHUYỂN ĐỔI

> ⚠️ Từng bước **đảo được**, và bước phá nhiều nhất *(đóng đường công khai)*
> đứng **sau** khi đường thay thế đã chạy.

| # | Việc | Đảo được? | Điều kiện tiên quyết |
|---|---|---|---|
| **0** | ✅ *(xong)* Đo hiện trạng: 0 tệp · 0 tham chiếu · 1 nơi gọi URL | — | — |
| **1** | Thêm `application/pdf` vào `allowed_mime_types` — **vá `§2.3` ngay**, ⛔ không phụ thuộc phần còn lại | ✅ | ⛔ không |
| **2** | Viết Server Action `layUrlBangChung(entityType, entityId, path)` — `guard()` + `createSignedUrl` | ✅ | ⛔ không |
| **3** | Đổi nơi hiển thị sang gọi ⑵ *(hiện chỉ có xem trước sau khi tải)* | ✅ | ⑵ |
| **4** | 🔴 `public = false` + **gỡ** `evidences_public_read` | ✅ *(một lệnh)* | ⑵ ⑶ chạy thật |
| **5** | Gỡ `UPDATE`; `DELETE` theo phán quyết `Q2` | ✅ | Board duyệt `Q2` |
| **6** | Ghi `activity_log` khi đính kèm / thay thế bằng chứng | ✅ | `Q2` |

🔑 **Bước ① tách rời có chủ ý.** Nó vá một khuyết tật đang chạy, ⛔ không chạm
bảo mật, và ⛔ không cần chờ `Q1`–`Q5`. Gộp nó vào gói lớn là bắt một lỗi đơn
giản chờ một quyết định phức tạp.

---

## 5. KẾ HOẠCH LÙI

| Bước | Cách lùi | Mất gì |
|---|---|---|
| ① mime | bỏ `application/pdf` khỏi mảng | quay lại lỗi `§2.3` |
| ② ③ Signed URL | ⛔ không lùi — thuần **thêm** đường mới | — |
| ④ đóng công khai | `public = true` + dựng lại policy `evidences_public_read` | quay lại lỗ hổng P0 |
| ⑤ ⑥ | dựng lại policy cũ | quay lại P1 |

⚠️ **Bước ④ lùi được trong một lệnh, nhưng ⛔ KHÔNG lùi được hậu quả**: URL đã
phát ra ngoài trong lúc kho công khai vẫn sống. Đó là lý do vá **lúc kho rỗng**
rẻ hơn hẳn — hiện **⛔ chưa có URL nào từng được phát**.

---

## 6. 🔴 CẦN BOARD QUYẾT

| | Câu hỏi | Đề nghị |
|---|---|---|
| **Q1** | Vá `§2.3` *(PDF)* **ngay** và tách khỏi gói bảo mật? | ✅ **Có** — khuyết tật đang chạy, ⛔ không chạm bảo mật |
| **Q2** | Xoá bằng chứng: phương án **A · B · C** *(§3.4)* | **A** — nhất quán với `056` |
| **Q3** | Hạn Signed URL bao lâu? | **300 giây** — đủ mở một tệp, quá ngắn để dán đi chỗ khác |
| **Q4** | Bucket riêng tư có cần ADR ⛔? | 🔴 **CÓ** — chạm policy tầng CSDL, `ADR-011 §2.2` |
| **Q5** | Người **ngoài** *(nhà thầu · khách)* đọc bằng chứng thế nào? | Cùng đường Signed URL, nhưng `guard()` phải hỏi **Assignment**, ⛔ không hỏi vai |

---

## 7. KẾ HOẠCH KIỂM THỬ

Mỗi mục phải đo **bằng hành vi**, ⛔ không đọc policy — đúng cách `A003` đã làm
với sổ kiểm toán.

| # | Phép thử | Kỳ vọng |
|---|---|---|
| 1 | Khách vãng lai gọi URL công khai cũ | 🔴 **HTTP 400/404** |
| 2 | `md001` xin Signed URL cho đơn **của mình** | ✅ ĐƯỢC |
| 3 | `qa001` xin Signed URL cho đơn **⛔ không có quyền** | 🔴 **BỊ TỪ CHỐI** |
| 4 | ⭐ **Cặp `K-3`** — `qa001` xin cho bản ghi QA của chính họ | ✅ **ĐƯỢC** *(⛔ chặn phẳng là hỏng)* |
| 5 | Signed URL sau khi hết hạn | 🔴 **BỊ TỪ CHỐI** |
| 6 | Tải lên PDF | ✅ ĐƯỢC *(sau bước ①)* |
| 7 | Tải lên `.exe` · `.docx` | 🔴 **BỊ TỪ CHỐI** |
| 8 | Tải lên 20 MB | 🔴 **BỊ TỪ CHỐI** |
| 9 | Xoá bằng chứng | theo phán quyết `Q2` |
| 10 | Đính kèm ⇒ có dòng `activity_log` | ✅ *(sau bước ⑥)* |
| 11 | Đính vào bản ghi **⛔ không có quyền** | 🔴 **BỊ TỪ CHỐI** |
| 12 | Điện thoại: chụp ảnh ⇒ tải ⇒ xem lại | ✅ |

⚠️ Phép **4** là phép quan trọng nhất và dễ bị bỏ nhất: ⛔ không có nó thì một
bản vá **chặn phẳng mọi người** cũng cho bài kiểm màu xanh.

---

## 8. ⚠️ ĐIỀU KẾ HOẠCH NÀY **⛔ CHƯA** LÀM

- ⛔ **Chưa** thiết kế phần *"ai được đọc bằng chứng của bản ghi nào"* tới mức
  chi tiết. Nó phụ thuộc `Q5` và phải dùng lại `guard()` của từng phân hệ —
  ⛔ không được viết một bộ luật quyền **thứ hai** cạnh `lib/mos/permission/`.
- ⛔ **Chưa** ước lượng **dung lượng** khi 24 điểm số lượng đều đính kèm.
- ⛔ **Chưa** xét ảnh **HEIC** từ iPhone: bucket nhận, nhưng trình duyệt trên
  máy bàn **⛔ không hiển thị được**. Cần chuyển đổi hoặc cảnh báo — ⛔ chưa có.

---

## 9. TRẠNG THÁI THI HÀNH — ✅ `IMPLEMENTED` · 08/08/2026

### 9.1 TRƯỚC ⟷ SAU

| | **TRƯỚC** | **SAU** |
|---|---|---|
| **Kho** | `public = true` | `public = false` |
| **Khách vãng lai đọc tệp** | 🔴 **`HTTP 200`** — `fetch` trần, ⛔ không cookie | ✅ **bị chặn** |
| **Đường đọc** | URL công khai vĩnh viễn | **Signed URL 300 giây**, phát sau **2** phép kiểm |
| **Phép kiểm quyền** | *"đã đăng nhập chưa"* | *"tệp có thuộc bản ghi ⛔"* **+** *"đọc được bản ghi cha ⛔"* *(hỏi RLS)* |
| **Người dùng xoá tệp** | 🟠 **được**, ⛔ không vết | ✅ **⛔ không ai** — bỏ tệp = lưu trữ mềm `md_documents` |
| **Người dùng sửa/ghi đè tệp** | 🟠 **được** | ✅ **⛔ không ai** |
| **Tải PDF** | 🟠 **bị từ chối** *(`mime type application/pdf is not supported`)* | ✅ **được** |
| **Allowlist MIME** | **2 bản lệch nhau**, ⛔ không ai canh | **1 bản gốc** + **1 phép đo** bắt lúc lệch |

### 9.2 THI HÀNH

| # | Việc | Trạng thái |
|---|---|---|
| ① | `lib/mos/evidence/mime.ts` — **một nguồn allowlist**; `upload-action` + ô chọn tệp đọc từ đó | ✅ |
| ② | `app/actions/evidence-url-action.ts` — Signed URL 300 giây, **hai** phép kiểm | ✅ |
| ③ | `lib/mos/evidence/access.ts` — hằng số + ánh xạ đối tượng ⟷ bảng | ✅ |
| ④ | `components/md/collab/document-center.tsx` — nút *"Mở tài liệu"* chuyển sang đường mới | ✅ |
| ⑤ | `scripts/kiem-bang-chung.mjs` — **13** phép đo hành vi | ✅ |
| ⑥ | `ADR-031` | ✅ |
| ⑦ | **`057_evidence_private_bucket.sql`** | ✅ **ĐÃ CHẠY** — tự kiểm **6/6** |

### 9.3 MÔ HÌNH BẢO MẬT SAU THI HÀNH

```
ĐỌC   ⛔ KHÔNG policy nào.  Chỉ vào bằng Signed URL 300s do Server Action phát:
        ① tra `md_documents`   — tệp có THUỘC bản ghi ⛔      (chống IDOR)
        ② đọc bản ghi cha      — bằng PHIÊN CỦA NGƯỜI GỌI     (hỏi RLS)
        ③ ký                   — bằng khoá nâng quyền, CHỈ SAU KHI ①② cho qua
GHI   `authenticated`.  SỬA · XOÁ  ⛔ KHÔNG AI.
```

🔑 **Ranh giới ở ③ là toàn bộ thiết kế:** *phán quyết* chạy dưới quyền **người
gọi**; *hành động* chạy dưới quyền **nâng cấp**. Đảo thứ tự là mở toang.

⚠️ **Giới hạn, nói thẳng:** kín với `anon`, với **mọi vai nghiệp vụ**, và với
mọi đường ứng dụng. **⛔ KHÔNG kín** trước `service_role` *(mang `BYPASSRLS`, và
storage ⛔ không đặt trigger được như `056`)* hay superuser. Phòng thủ còn lại là
**giữ khoá** — nó chỉ ở máy chủ và script chạy tay.

### 9.4 KẾT QUẢ ĐO — TRƯỚC ⟷ SAU, cùng một bài kiểm

```
TRƯỚC `057`   3 đạt · 6 hỏng      SAU `057`   13 đạt · 0 hỏng
```

🔑 Sáu phép hỏng lúc trước **đúng bằng** sáu khuyết tật đã biết. Đó là điều
khiến `13/13` hôm nay **có nghĩa**: bài kiểm đã chứng minh nó **phân biệt được**
trạng thái hở với trạng thái kín — một bộ kiểm chỉ từng xanh thì ⛔ không chứng
minh được gì.

| Nhóm | Phép đo | |
|---|---|---|
| ① Tải lên | PNG · JPG · **PDF** · từ chối `.txt` | 4 ✅ |
| ② Kho riêng tư | `public=false` · **khách vãng lai bị chặn** | 2 ✅ |
| ③ Signed URL | phát được · **hạn 300s** · mở được · **chống IDOR** · **`qa001` bị từ chối** | 5 ✅ |
| ④ Xoá | `md001` **⛔ không xoá được** | 1 ✅ |
| ⑤ Một nguồn | allowlist KHO ⟷ `mime.ts` | 1 ✅ |

Hồi quy: `npm run verify` **20/20** · `uat-md-form-dau-vao` **46/0** ·
`uat-md-vong-doi` **72/0** · `next build` sạch.

### 9.5 🔴 MỘT KHẲNG ĐỊNH SAI ĐÃ BỊ CHÍNH PHÉP ĐO BÁC BỎ

Kế hoạch này, `ADR-031` và `057` bản đầu **đều** ghi: *"`createSignedUrl` ⛔
không cần policy `SELECT`."* **SAI** — đo sau khi `057` chạy: ký bằng phiên
`md001` trả **`Object not found`**. `createSignedUrl` **vẫn chịu RLS của vai
gọi**.

⚠️ Hậu quả nếu ⛔ không đo: mọi nút *"Mở tài liệu"* đứng im, **lược đồ vẫn đúng
y như thiết kế**, và ⛔ không một bài kiểm lược đồ nào bắt được. Cùng họ sai lầm
với `22P02` ở `056`. Cả hai lần thứ bắt được đều là **phép đo hành vi**.

Đã sửa ở ba nơi *(mã · ADR · migration)*, ⛔ không xoá dấu vết.

### 9.6 ⚠️ CÒN NỢ

| | |
|---|---|
| **Phản biện độc lập** | ⛔ **CHƯA có** — `ADR-011 §2.2` |
| **Board phê chuẩn `ADR-031`** | 🟠 duyệt triển khai, ⛔ chưa phê chuẩn chính thức |
| **27 điểm sản lượng ⛔ chưa có bằng chứng** | `MONICA_ONE_QUANTITY_EVIDENCE_AUDIT.md` — đây mới là *hạ tầng*, ⛔ chưa phải *phủ sóng* |
| **Tệp cũ** | ⛔ **không có** — kho rỗng lúc vá *(0 tệp · 0 tham chiếu)*. ⛔ Không URL nào từng rò |
