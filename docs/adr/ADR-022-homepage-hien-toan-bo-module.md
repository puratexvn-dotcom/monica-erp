# ADR-022 — Homepage hiển thị toàn bộ Module · quyền kiểm lúc MỞ

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-022 |
| **Trạng thái** | ⏳ Chờ phản biện độc lập + Board phê duyệt |
| **Thẩm quyền** | Board Directive Rev 2 *(04/08/2026)* · Board Directive *"Close BA-1 & UX-1"* *(05/08/2026)* |
| **Tu chính** | Hiến pháp **§13.5** |
| **Quan hệ** | 🔴 **ĐẢO NGƯỢC** [ADR-017](ADR-017-trang-chu-hai-vung.md) §2.3 |
| **Nguồn** | [`EPIC-UX-1`](../planning/EPIC-UX-1-PRODUCT-EXPERIENCE-ARCHITECTURE.md) §7 §10 §14 |
| **Migration** | ⛔ **KHÔNG** — ⛔ không chạm CSDL |

---

## 1. Problem — `[MEASURED]`

### 1.1 Nguyên văn §13.5

> *"The Homepage shall display **only** the Business Workspaces, Global Services
> and Platform Services that the authenticated user is authorized to access.
> Users shall **not be distracted by inaccessible** or unrelated Workspaces or
> Services."*

### 1.2 ⚠️ ADR-017 đã **cố ý** tái khẳng định vế này

> **ADR-017 §2.3:** *"🔴 **Launcher chỉ hiển thị Business App mà người dùng có
> quyền truy cập.** ⛔ **⛔ Không thẻ nào dẫn tới `/unauthorized`.** Thẻ ⛔ không
> bấm được là **lời nói dối của giao diện**."*

🔑 **ADR này ⛔ không sửa một chỗ sót — nó đảo ngược một quyết định được cân nhắc
kỹ.** Phải nói thẳng điều đó, và phải **trả lời được lập luận của ADR-017**, ⛔
không được lờ đi.

### 1.3 Điều ADR-017 tối ưu — và điều nó **⛔ không** tính tới

ADR-017 tối ưu cho **đúng một khán giả: người vận hành đã đăng nhập.** Với khán
giả đó, lập luận của nó **đúng**.

Nhưng Homepage có **sáu khán giả khác** — đo ở `UX-1 §10`:

| Khán giả | §13.5 *(ẩn)* phục vụ họ thế nào |
|---|---|
| **Sales** | 🔴 khách thấy **3 ô** thay vì 19 ⇒ sản phẩm trông như *"một công cụ nội bộ"* |
| **Demo** | 🔴 phải dựng **bản demo riêng** ⇒ hai bề mặt để trôi khỏi nhau |
| **Investor** | 🔴 ⛔ không thấy được quy mô và lộ trình |
| **Customer** *(buyer)* | 🔴 ⛔ không thấy QA · Warehouse · Shipment tồn tại ⇒ mất tín hiệu trưởng thành vận hành |
| **Recruitment** | 🟠 ứng viên ⛔ không thấy hệ thống thật |
| **Onboarding** | 🟠 nhân viên mới ⛔ không thấy doanh nghiệp có gì |

⇒ **§13.5 ⛔ không sai về kỹ thuật. Nó hẹp về phạm vi khán giả.**

### 1.4 🔑 Và bậc ③ **⛔ chưa bao giờ** là hàng rào — `[MEASURED]`

`BA-1 §15` *(Board duyệt Rev 4, `PA-1`)*:

```
Bậc ①–④  TRẢI NGHIỆM   ← Module hiện trên Homepage nằm ở bậc ③
════════ ĐƯỜNG RANH GIỚI AN NINH ════════
Bậc ⑤–⑦  AN NINH       ← guard.ts · Server Action · RLS
```

⇒ Ẩn thẻ trên Homepage **⛔ không bảo vệ gì cả**. Ai biết đường dẫn vẫn gõ được
`/kho`, và **`guard.ts` + RLS chặn họ** — hôm nay đã vậy, ⛔ không cần §13.5.

🔑 **⇒ ADR này ⛔ không nới lỏng bảo mật. Nó gọi đúng tên một tầng vốn ⛔ chưa
bao giờ là hàng rào** *(`PA-2`)*.

---

## 2. Decision

### 2.1 Tu chính §13.5

> **§13.5 Workspace Visibility**
> *"The Homepage shall display **all** constitutional Business Workspaces,
> Global Services and Platform Services, **regardless of the viewer's
> authorization**.*
>
> *Each entry shall carry a **Permission State** indicating whether the viewer
> may open it. Entries the viewer is not authorized to open **shall be
> de-emphasised, and shall never be hidden**.*
>
> *Authorization shall be enforced **at the point of access**, never by
> omission from the Homepage."*

### 2.2 🔑 Trả lời lập luận *"lời nói dối của giao diện"*

**ADR-017 đúng, và ADR này ⛔ không bác nó — ADR này thoả nó.**

```
Lời nói dối   = thẻ trông MỞ ĐƯỢC nhưng ⛔ không mở được.
Sự thật       = thẻ nói rõ "cái này ⛔ không phải của bạn" — và vẫn cho bạn
                THẤY nó tồn tại.
```

⇒ Vấn đề của ADR-017 ⛔ không phải *"hiện thẻ ⛔ không mở được"* mà là *"hiện thẻ
⛔ không mở được **mà ⛔ không nói**"*. **Bốn `Permission State` §2.3 chính là
lời nói đó.**

### 2.3 Bốn `Permission State` — ràng buộc thi hành

| State | Khi nào | Hiện thế nào | Bấm |
|---|---|---|---|
| `AUTHORIZED` | đã đăng nhập **và** có quyền | **đủ màu** | → Workspace |
| `UNAUTHORIZED` | đã đăng nhập, ⛔ không quyền | **làm mờ** — ⛔ **KHÔNG ẨN** | → 403 |
| `COMING_SOON` | ⛔ chưa có route | nhãn *"Sắp có"* · ⛔ không bấm được | — |
| `ANONYMOUS` | ⛔ chưa đăng nhập | **đủ màu** — như `AUTHORIZED` | → `/login` |

### 2.4 Ba luật ⛔ không được vi phạm

| # | Luật | Vì sao |
|---|---|---|
| `LI-1` | **Làm mờ bằng ĐỘ MỜ, ⛔ KHÔNG bằng đổi màu** | màu là **định danh** *(Điều 44.6)*. Ô Kho phải **luôn** là màu Kho — người dùng học *"xanh lá = Kho"*, ⛔ không học *"xám = ⛔ không quyền"* |
| `LI-2` | **`ANONYMOUS` ⛔ KHÔNG được làm mờ** | với khách, hệ thống **⛔ không biết** họ sẽ có quyền gì ⇒ làm mờ là **nói dối**, và nó giết đúng giá trị mà ADR này mua |
| `LI-3` | 🔴 **Chữ trên ô mờ vẫn phải đạt tương phản ≥ 4,5:1** | ⛔ Không có ngưỡng, *"làm mờ"* **trượt dần thành "ẩn trá hình"** — và khi đó §2.1 bị vi phạm mà ⛔ không ai chỉ ra được lúc nào |

⚠️ **`LI-3` là điều khoản giữ cho ADR này ⛔ không bị vô hiệu hoá âm thầm.** Nó
biến *"làm mờ"* từ một **tính từ** thành một **phép đo**.

---

## 3. Hai hệ quả an ninh phải nói rõ

| # | Hệ quả | Phán quyết |
|---|---|---|
| ① | **`UI-F1` ⛔ KHÔNG được đóng.** Bản đồ Module lộ ra cho mọi người xem | ⚠️ Chuyển từ *"lỗ hổng phải đóng"* thành **"GIỚI HẠN CÓ TÊN, Board chấp nhận để đổi lấy giá trị bán hàng"**. Ghi vào `GPR-001` — ⛔ **không im lặng** |
| ② | **Route mang tên chức danh** *(`/to-truong-cat` · `/giam-doc`)* nay **khách cũng thấy** | 🟠 Lộ **cơ cấu tổ chức** ở mức thô. ⛔ Không phải lỗ hổng kỹ thuật, nhưng là **thông tin doanh nghiệp**. ⇒ trình Board |

⚠️ **`/unauthorized` trở thành màn hình lưu lượng cao**, ⛔ không còn là ngoại lệ
⇒ phải được thiết kế như **một phần của luồng duyệt bình thường** *(`EP-3`)*.

---

## 4. Alternatives Considered

| # | Phương án | Vì sao **⛔ không** chọn |
|---|---|---|
| ① | **Giữ §13.5** *(ẩn theo quyền)* | Board **đã bác** — nó hy sinh **sáu khán giả** để phục vụ một |
| ② | **Hai bề mặt: Showcase cho khách · Launcher cho nhân viên** | 🔴 Board **đã bác** ở Rev 2. **Hai bề mặt là hai thứ phải nuôi, và bề mặt ít người xem sẽ chết dần** |
| ③ | **Hiện toàn bộ nhưng ⛔ không phân biệt trạng thái quyền** | 🔴 Đây **đúng là** *"lời nói dối của giao diện"* mà ADR-017 cảnh báo. §2.3 tồn tại để tránh nó |
| ④ | **Ẩn với khách, hiện với nhân viên** | 🔴 Vẫn là hai bề mặt, chỉ trá hình. Và nó **giết đúng giá trị bán hàng** — khách chính là người cần thấy nhất |

---

## 5. Impact

| Hạng mục | Tác động |
|---|---|
| **Hiến pháp** | §13.5 — ⇒ **v1.7** *(cùng đợt ADR-021)* |
| **ADR-017** | 🔴 §2.3 **bị đảo ngược** |
| **`lib/mos/capability/visible-modules.ts`** | 🔴 `canSeeModule` đổi vai: từ **lọc** sang **gán trạng thái**. ⛔ **KHÔNG XOÁ** |
| **`app/_home/app-card.tsx`** | thêm `Permission State` |
| **`app/(dashboard)/…/guard.ts` · RLS** | ✅ **⛔ KHÔNG chạm** — hàng rào thật ⛔ không đổi |
| **`/unauthorized`** | thiết kế lại như **màn hình thường gặp** |
| **`GPR-001`** | ghi `UI-F1` là **giới hạn được chấp nhận có chủ ý** |
| **CSDL · Migration · Permission Model** | ✅ **⛔ KHÔNG chạm** |

---

## 6. Chỗ tôi có thể sai — ADR-011 §2.3 mục 4

| # | Rủi ro | Mức |
|---|---|---|
| ① | 🔴 **Đường cụt lặp lại**: bấm → login → 403. Với người **vừa bị thu hồi quyền**, 403 trông như **lỗi hệ thống**, ⛔ không như quyết định phân quyền *(`EP-4`)*. Tôi ⛔ **không có số đo** về tần suất | 🔴 cao |
| ② | **19 → 30 ô có thể thành một bức tường.** Ngưỡng ~20 ô ở `NV-2` là **ước lượng, ⛔ chưa đo** | 🟠 vừa |
| ③ | `LI-3` chọn **4,5:1** vì đó là ngưỡng `MODULE_IDENTITY` đang tuân. Nhưng với **chữ bị làm mờ có chủ ý**, ngưỡng đúng có thể khác — **⛔ chưa đo trên màn hình thật** | 🟠 vừa |
| ④ | Hệ quả §3 ② *(lộ cơ cấu tổ chức)* tôi đánh giá 🟠. **Đây là phán đoán nghiệp vụ, ⛔ không phải kỹ thuật** ⇒ **Board mới là người định mức đúng** | 🟠 vừa |

---

## 7. Decision Record

| | |
|---|---|
| **Đề xuất** | Chief Solution Architect — 05/08/2026 |
| **Phản biện độc lập** | ⏳ **chưa thực hiện** — bắt buộc theo ADR-011 §2.2 |
| **Board phê duyệt** | ⏳ **chưa** |
| **Hiệu lực** | ⛔ **chưa** — ⛔ **không dòng mã nào được viết trước khi mục này chuyển ✅** |

---

## 8. References

- Hiến pháp §13.1 · §13.5 · Điều 44.6 *(màu là định danh)*
- [ADR-017](ADR-017-trang-chu-hai-vung.md) §2.3 — quyết định bị đảo ngược
- [ADR-021](ADR-021-homepage-launcher-va-work-zone-toan-cuc.md) — §13.1 §13.3 §15.3, đi **cùng đợt**
- [`EPIC-UX-1`](../planning/EPIC-UX-1-PRODUCT-EXPERIENCE-ARCHITECTURE.md) §7 §10 §14
- [`EPIC-BA-1`](../planning/EPIC-BA-1-ENTERPRISE-BUSINESS-ARCHITECTURE.md) §15 *(`PA-1` `PA-2`)* · §20
- `GPR-001` — `UI-F1`
