# EPIC UX-1 · PRODUCT EXPERIENCE ARCHITECTURE

| Trường | Giá trị |
|---|---|
| **EPIC** | **UX-1 · Product Experience Architecture** |
| **Thẩm quyền** | Board Directive BA-1 & UX-1 *(Revised)* — 05/08/2026 |
| **Vai trò** | Chief Solution Architect — **phản biện**, ⛔ không bảo vệ thiết kế hiện tại |
| **Ràng buộc** | ⛔ **Không viết Production Code** |
| **Kết luận** | 🟠 **Khuyến nghị Phương án C** · 🔴 **4 điểm va chạm văn bản bậc 1 — cần Board quyết** |

---

# §0 · BỐN ĐIỂM VA CHẠM VỚI HIẾN PHÁP — ĐỌC TRƯỚC

> Board yêu cầu phản biện thẳng. Đây là phần thẳng nhất.
>
> ⚠️ Tôi ⛔ **không** kết luận Board sai. Tôi chỉ ra rằng **bốn** điểm trong chỉ
> thị mâu thuẫn với **văn bản bậc 1 đang có hiệu lực**, nên chúng ⛔ không thi
> hành được bằng một chỉ thị — chúng cần **ADR + tu chính Hiến pháp** *(§37)*.

## `VC-1` 🔴 *"Homepage ⛔ KHÔNG PHẢI Work Zone"* ⟷ Hiến pháp §13.3

Chỉ thị viết: *"Homepage ⛔ không phải Work Zone… Work Zone chỉ hiện sau khi
người dùng chọn Module và đăng nhập."*

**§13.3 nguyên văn** *(ADR-017 → v1.6)*:

> *"It consists of **two constitutional zones**: **(a) The Work Zone** … and
> **shall be the default view upon sign-in**. **(b)** The Business Operating
> System Launcher …
> **Both zones are constitutional. Neither may be removed.**"*

⇒ Hiến pháp đặt Work Zone **TRÊN Homepage**, và là **khung nhìn mặc định khi
đăng nhập**. Chỉ thị dời nó **ra khỏi** Homepage.

🔑 **Đây ⛔ không phải tôi tự giả định** — Board nói đúng rằng *"Homepage sau
đăng nhập phải trở thành Work Zone"* là một giả định kỹ thuật. Nhưng nó ⛔
**không phải giả định của tôi**: nó là **§13.3**, do chính Board ban hành qua
ADR-017 ngày 04/08/2026. `UI-1.5` thi hành điều khoản đó.

⇒ Muốn đổi thì **tu chính §13.3**. Tôi ⛔ không tự làm.

## `VC-2` 🔴 *"Chọn Department"* ⟷ Hiến pháp §13.3 câu cuối

**§13.3 nguyên văn**:

> *"The Homepage **shall not be organized by organizational hierarchy, job
> titles or technical system modules**."*

Luồng trong chỉ thị: *"Homepage → chọn **Department** / Module"*, và BA-1 yêu
cầu *"Workspace Definition cho **từng phòng ban**"*.

⇒ Tổ chức Homepage theo **phòng ban** là đúng thứ §13.3 **cấm tường minh**.

**Và nó đảo ngược ADR-015.** 14 Business Workspace được duyệt là **miền năng
lực**, ⛔ không phải sơ đồ tổ chức — xem §1.2 dưới đây. Đây là điểm sâu nhất của
cả tài liệu.

## `VC-3` 🟠 Bottom Navigation ⟷ Hiến pháp §15.3 · §15.4

**§15.3 nguyên văn**: năm năng lực hiến định là **Home · Business Communication
· AI Assistant · Business Reporting · User Guidance**, và
*"The Bottom Navigation shall contain **only platform-wide capabilities**."*

| Vị trí | Chỉ thị Board | §15.3 | Nhận xét |
|---|---|---|---|
| 1 | `Work` | `Home` | §15.4: *"Home shall **always** return users to the constitutional Homepage"* |
| 2 | `Chat` | Business Communication | ✅ khớp |
| 3 | **`Monica`** *(Website/Brand)* | AI Assistant | 🔴 Website/thương hiệu ⛔ **không phải** *platform-wide capability* |
| 4 | `AI` | Business Reporting | lệch vị trí |
| 5 | `Guide` | User Guidance | ✅ khớp |

⇒ Bản Homepage của chỉ thị **thay `Business Reporting` bằng một liên kết
thương hiệu**. Đó là chỗ va chạm thật: §15.3 nói bottom nav chỉ chứa **năng lực
nền tảng**, và một trang giới thiệu công ty ⛔ không phải năng lực.

⚠️ Ý *"Homepage ⛔ không cần nút Home"* thì **hợp lý** — đứng ở nhà mà có nút về
nhà là thừa. Nhưng cách giải quyết đúng là **tu chính §15.4**, ⛔ không phải
lặng lẽ đổi.

## `VC-4` 🟢 Showcase cho khách ⟷ §13.5 — **⛔ KHÔNG va chạm**

**§13.5 nguyên văn**:

> *"The Homepage shall display only the … Services that **the authenticated
> user is authorized to access**."*

🔑 Điều khoản này ràng buộc **người ĐÃ xác thực**. Nó **im lặng** về khách chưa
đăng nhập. ⇒ Showcase cho khách **⛔ không vi phạm §13.5** — đó là **khoảng
trống**, ⛔ không phải mâu thuẫn.

⚠️ Nhưng nó **mở lại `UI-F1`** như một rủi ro **cạnh tranh**, ⛔ không phải rủi
ro hiến định. Xem §3.

---

# §1 · BA KHÁI NIỆM — VÀ MỘT KHÁI NIỆM THỨ TƯ BỊ THIẾU

## 1.1 Ba khái niệm Board nêu — tôi đồng ý hoàn toàn

| | Là gì | Phục vụ ai | Trả lời câu hỏi |
|---|---|---|---|
| **Homepage** | Application Launcher | mọi người | *"Doanh nghiệp này có những gì?"* |
| **Work Zone** | Dashboard cá nhân | người đã đăng nhập | *"Hôm nay tôi phải làm gì?"* |
| **Workspace** | Nơi thao tác nghiệp vụ | người có quyền | *"Làm việc đó thế nào?"* |

Ba câu hỏi **khác nhau**, ba nhịp **khác nhau**. Việc Board tách bạch chúng là
**đúng**, và nó sửa một chỗ nhập nhằng có thật trong `UI-1.5`.

## 1.2 🔴 Khái niệm thứ tư bị thiếu: **DEPARTMENT ⛔ KHÔNG PHẢI WORKSPACE**

Đây là điểm quan trọng nhất tôi có thể đóng góp cho BA-1.

| | **Department** | **Business Workspace** |
|---|---|---|
| Là gì | đơn vị **tổ chức** — ai báo cáo cho ai | miền **năng lực** — việc gì được làm |
| Đổi khi nào | tái cơ cấu · tuyển người · sáp nhập | mô hình kinh doanh đổi |
| Tần suất đổi | **vài lần mỗi năm** | **vài năm một lần** |
| Nguồn | sơ đồ tổ chức | ADR-015 · EDD-01 |

**Ánh xạ giữa chúng là NHIỀU–NHIỀU, ⛔ không phải một–một:**

```
Phòng Kế hoạch  ──┬─► Planning        (D5)
                  └─► Merchandising   (D2)   ← lập kế hoạch NPL cho đơn

Phòng Kho       ──┬─► Warehouse       (D9)
                  └─► Procurement     (D8)   ← nhận hàng, đối chiếu PO

Merchandising   ──┬─► Merchandising   (D2)
   (phòng)        ├─► Commercial      (D1)   ← chào giá
                  └─► Product Dev     (D3)   ← theo mẫu
```

🔑 **Vì sao điều này quan trọng hơn nó trông:**

Nếu Workspace = phòng ban, thì **mỗi lần tái cơ cấu là một lần đổi kiến trúc phần
mềm**. Gộp hai phòng ⇒ phải gộp hai Workspace ⇒ phải dời dữ liệu, dời quyền,
dời màn hình. Doanh nghiệp may tái cơ cấu **thường xuyên hơn** đổi mô hình kinh
doanh rất nhiều.

Nếu Workspace = miền năng lực, tái cơ cấu chỉ đổi **bảng ánh xạ** `Department →
Workspace`. **⛔ Không một dòng mã nào phải sửa.**

⇒ Đó chính là lý do §13.3 cấm tổ chức Homepage theo sơ đồ tổ chức, và là lý do
ADR-015 chọn 14 **miền năng lực**.

⚠️ **Hệ quả cho BA-1:** yêu cầu *"Workspace Definition cho từng phòng ban"*
phải đọc lại thành **hai danh mục + một bảng ánh xạ**. Chi tiết ở
[`EPIC-BA-1`](EPIC-BA-1-ENTERPRISE-BUSINESS-ARCHITECTURE.md).

---

# §2 · SO SÁNH PHƯƠNG ÁN

## 2.1 Phương án A — Homepage **chỉ có** Work Zone

| Tiêu chí | Đánh giá |
|---|---|
| **Ưu điểm** | Đường ngắn nhất tới việc. Người dùng hằng ngày mở máy là thấy ngay việc của mình. Tải nhận thức thấp nhất |
| **Nhược điểm** | ⛔ **Không có bề mặt sản phẩm nào.** Người mới ⛔ không biết hệ thống có gì. Thêm Module mới ⇒ ⛔ không ai thấy |
| **Khả năng bán hàng** | 🔴 **Gần bằng 0** — ⛔ không có gì để trình bày |
| **Khả năng demo** | 🔴 **Gần bằng 0** — demo một hộp thư đến ⛔ không bán được hệ điều hành |
| **Khả năng mở rộng** | 🔴 **Kém** — 19 App mà ⛔ không có nơi bày |
| **Onboarding** | 🔴 **Kém** — nhân viên mới ⛔ không thấy bức tranh tổng thể |
| **Trải nghiệm** | 🟢 tốt cho người thạo · 🔴 kém cho mọi người còn lại |
| 🔴 **Hiến pháp** | **VI PHẠM §13.3** — bỏ Launcher là *"removing a constitutional zone"* |

⇒ **Phương án A bị loại**, ⛔ không phải vì UX mà vì nó **xoá một vùng hiến định**.

## 2.2 Phương án B — Homepage là Application Launcher đầy đủ

| Tiêu chí | Đánh giá |
|---|---|
| **Ưu điểm** | Bề mặt sản phẩm mạnh. Mô hình *"màn hình điện thoại"* ai cũng hiểu ⛔ không cần dạy. Thêm App = thêm một ô. Onboarding tốt |
| **Nhược điểm** | ⛔ **Không trả lời được *"hôm nay tôi làm gì"***. Người dùng hằng ngày phải trả **một cú bấm mỗi sáng** cho thứ họ ⛔ không cần |
| **Rủi ro** | ① Bày cho khách ⇒ lộ cấu trúc vận hành *(`UI-F1`)* · ② 19 ô thành **bức tường ô vuông** · ③ route mang tên chức danh *(`/giam-doc`, `/to-truong-may`)* **lộ sơ đồ tổ chức** ngay trên thanh địa chỉ |
| **Trade-off** | **Khám phá ⟷ tức thời.** B chọn khám phá |
| **Mở rộng** | 🟢 **Tốt nhất** — mô hình lưới chịu được 19 → 30 App |
| **Demo** | 🟢 **Tốt nhất** |
| **Bán hàng** | 🟢 **Tốt nhất** |
| **Đào tạo** | 🟢 **Tốt** — bức tranh tổng thể có sẵn |
| 🟠 **Hiến pháp** | **VI PHẠM §13.3** nếu bỏ Work Zone khỏi Homepage *(`VC-1`)* |

## 2.3 🔑 Điều cả A lẫn B đều bỏ sót

Cả hai phương án đều giả định **Homepage là MỘT bề mặt**. Nhưng nó đang phục vụ
**hai khán giả có lợi ích ngược nhau**:

| Khán giả | Muốn gì | Tần suất |
|---|---|---|
| **Khách / người mua** | thấy **toàn bộ năng lực**, kể cả thứ chưa mở | **một lần** |
| **Nhân viên vận hành** | vào **đúng việc của mình** nhanh nhất | **mỗi ngày** |

⇒ Tối ưu cho một bên là làm hỏng bên kia. **Đó là lý do tranh luận A ⟷ B ⛔
không có lời giải**: câu hỏi bị đặt sai.

---

# §3 · 🔑 PHƯƠNG ÁN C — KHUYẾN NGHỊ

## 3.1 Nội dung

> **Homepage là Application Launcher *(Board đúng)*, nhưng nó có HAI BỀ MẶT
> KHÁC NHAU, ⛔ không phải một bề mặt bật/tắt tính năng.**

```
┌── KHÁCH CHƯA ĐĂNG NHẬP ────────┐   ┌── ĐÃ ĐĂNG NHẬP ────────────────┐
│  SHOWCASE                      │   │  LAUNCHER                       │
│  • 19 năng lực SẢN PHẨM        │   │  • App được cấp quyền — nổi bật │
│  • nội dung ĐƯỢC BIÊN SOẠN     │   │  • App khác — mờ, "Coming Soon" │
│  • ⛔ không liên kết vào app    │   │  • lối tắt sang Work Zone       │
│  • giống nhau với MỌI khách    │   │  • §13.5 lọc theo quyền         │
└────────────────────────────────┘   └─────────────────────────────────┘
```

## 3.2 🔴 Vì sao Showcase phải là bề mặt RIÊNG, ⛔ không phải Launcher-bị-khoá

Đây là chỗ tôi khác đề xuất cuối của Board, và là đóng góp chính của tài liệu này.

Đề xuất của Board: *"khách thấy toàn bộ module như một showcase, nhưng ⛔ không
cho truy cập dữ liệu"*. Nếu thi hành bằng cách **dựng chính Launcher rồi khoá
liên kết**, ba vấn đề xuất hiện:

| # | Vấn đề | Vì sao |
|---|---|---|
| ① | **Lộ cấu hình của CHÍNH tenant này** | Launcher phản ánh những gì **doanh nghiệp này** đã triển khai. Đối thủ đọc được **Monica đang chạy gì**, ⛔ không phải *"MONICA ONE có thể làm gì"* |
| ② | **Lộ tên route** | `/giam-doc` · `/to-truong-may` · `/ke-toan` — **tên chức danh trên thanh địa chỉ**. Đây cũng đúng thứ Sprint **I-5** phải xoá |
| ③ | 🔴 **Bề mặt bán hàng TỰ TRÔI** | Thêm một Module ⇒ nó **tự xuất hiện** trước khách mà ⛔ **không ai quyết định**. Một bề mặt bán hàng ⛔ không được thay đổi vì một lần deploy |

⇒ **Showcase là tài sản MARKETING, Launcher là công cụ VẬN HÀNH.** Chúng tình
cờ trông giống nhau hôm nay; chúng ⛔ **không** cùng vòng đời, ⛔ không cùng chủ,
⛔ không cùng lý do thay đổi.

🔑 **Và Showcase riêng thì BÁN TỐT HƠN:** nó bày được **cả 19 năng lực đích**
*(gồm 6 thứ chưa mở)* + nói bằng ngôn ngữ khách hàng, thay vì 16 ô phản ánh
trạng thái triển khai hiện tại. **Bản brochure luôn thắng ảnh chụp màn hình.**

## 3.3 Work Zone đặt ở đâu — ba lối, và vì sao tôi chọn ①

| # | Lối | Hiến pháp | Đánh giá |
|---|---|---|---|
| **①** ⭐ | **Homepage = Launcher nổi bật + một dải Work Zone gọn** *(việc quá hạn · chờ duyệt · đếm số)*, bấm vào mở Work Zone đầy đủ | ✅ **§13.3 thoả** — hai vùng đều còn | Giữ cả hai khán giả. Người vận hành thấy việc **ngay dòng đầu**; khách thấy Launcher |
| ② | Work Zone **dời hẳn** vào sau khi chọn Module | 🔴 **vi phạm §13.3** | Cần tu chính Hiến pháp |
| ③ | Homepage **chỉ** Launcher, Work Zone là App thứ 20 | 🔴 **vi phạm §13.3** | Cần tu chính |

⇒ **Lối ① đạt được điều Board muốn mà ⛔ không phải tu chính Hiến pháp**:
Homepage **là** Launcher *(Board đúng)*, Work Zone **có mặt** nhưng **⛔ không
chiếm chỗ** *(§13.3 thoả)*.

⚠️ Nếu Board vẫn muốn lối ② — dời hẳn Work Zone — thì đó là **quyết định hợp lệ**,
nhưng phải đi qua **ADR + tu chính §13.3**. Tôi ⛔ không thi hành bằng chỉ thị.

## 3.4 Trade-off của C — nói rõ, ⛔ không giấu

| Cái mất | Mức |
|---|---|
| **Hai bề mặt phải bảo trì** — Showcase và Launcher | 🟠 thật. Giảm nhẹ: Showcase là **nội dung tĩnh**, đổi vài lần mỗi năm |
| **Showcase có thể lệch thực tế** — quảng cáo App chưa có | 🟠 chính là điều **cần** cho bán hàng, miễn nhãn *"Coming Soon"* trung thực |
| **Người vận hành vẫn thấy Launcher mỗi sáng** | 🟢 nhẹ — dải Work Zone ở dòng đầu trả lời ngay *"hôm nay làm gì"* |

---

# §4 · BOTTOM NAVIGATION — PHẢN BIỆN

## 4.1 Ý đúng của Board

*"Homepage ⛔ không cần nút Home"* — **đúng**. Đứng ở nhà mà có nút về nhà là
một ô lãng phí trong năm ô hiếm hoi.

## 4.2 Chỗ tôi ⛔ không đồng ý: đưa **`Monica` (Website/Brand)** vào bottom nav

| # | Lý do |
|---|---|
| ① | **§15.3 nói bottom nav chỉ chứa *platform-wide capabilities*.** Một trang web giới thiệu ⛔ không phải năng lực — nó là **nội dung** |
| ② | **Nó đưa người dùng RA KHỎI hệ điều hành.** Bốn ô kia đưa người dùng đi sâu vào công việc; ô thứ năm đá họ sang trang tiếp thị |
| ③ | **Nó lấy chỗ của `Business Reporting`** — một năng lực hiến định *(§15.7)*, và là thứ **giám đốc dùng hằng ngày** |
| ④ | Khách cần liên kết thương hiệu; **nhân viên thì ⛔ không**. Mà bottom nav là thanh của **nhân viên** |

**Đề nghị:** logo/wordmark **ở thanh ĐẦU trang** đã là lối vào thương hiệu — nó
đang có sẵn. Bottom nav giữ đúng năm năng lực §15.3.

Nếu Board vẫn muốn `Monica` ở bottom nav ⇒ **tu chính §15.3**, vì điều khoản đó
nói *"only platform-wide capabilities"*.

---

# §5 · KHUYẾN NGHỊ CUỐI CÙNG

```
╔════════════════════════════════════════════════════════════════════════╗
║  KHUYẾN NGHỊ — Chief Solution Architect                                ║
║                                                                        ║
║  ✅ Phương án C   Homepage = Application Launcher, HAI BỀ MẶT          ║
║                   • Khách    → SHOWCASE riêng, nội dung biên soạn      ║
║                   • Đăng nhập → LAUNCHER lọc quyền + dải Work Zone     ║
║                                                                        ║
║  ⛔ Loại A        xoá Launcher ⇒ vi phạm §13.3, và ⛔ bán được gì       ║
║  🟠 B chưa đủ     đúng hướng, nhưng bỏ Work Zone ⇒ vi phạm §13.3       ║
║                                                                        ║
║  🔴 CẦN BOARD QUYẾT — 4 điểm, ⛔ không thi hành bằng chỉ thị:          ║
║     VC-1  dời Work Zone khỏi Homepage        ⇒ tu chính §13.3          ║
║     VC-2  tổ chức Homepage theo Department   ⇒ tu chính §13.3 + ADR-015║
║     VC-3  `Monica` vào bottom nav            ⇒ tu chính §15.3          ║
║     VC-4  showcase cho khách                 ✅ KHÔNG cần — §13.5 im lặng║
╚════════════════════════════════════════════════════════════════════════╝
```

## 5.1 Vì sao tôi khuyến nghị C chứ ⛔ không phải B nguyên bản

Board hỏi tôi phản biện, nên tôi nói thẳng: **B đúng về hướng, sai về một chi
tiết đắt tiền.**

Hướng đúng: Homepage **là** Launcher, ⛔ không phải Dashboard. Điều đó phục vụ
bán hàng, demo, onboarding — và tôi đã **đánh giá thấp** ba thứ đó khi làm
`UI-1.5`. `UI-F1` tôi phát hiện là thật, nhưng cách tôi đóng nó — **giấu sạch
bản đồ khỏi khách** — đã hy sinh một tài sản bán hàng mà tôi ⛔ không có thẩm
quyền hy sinh. **Đó là sai của tôi, và Board sửa đúng.**

Chi tiết sai của B: dùng **cùng một bề mặt** cho hai khán giả có lợi ích ngược
nhau, và **bỏ Work Zone** khỏi một điều khoản hiến định nói *"neither may be
removed"*.

C giữ **toàn bộ** giá trị bán hàng của B, đóng `UI-F1` **⛔ không mất gì**, và
⛔ **không cần tu chính Hiến pháp**.

---

## THAM CHIẾU

- Hiến pháp **§13.3** · **§13.5** · **§15.3** · **§15.4** — bậc 1
- **ADR-015** *(14 Business Workspace)* · **ADR-017** *(trang chủ hai vùng)*
- [`EPIC-BA-1`](EPIC-BA-1-ENTERPRISE-BUSINESS-ARCHITECTURE.md) — Department ⟷ Workspace
- [`EPIC-UI-1-EXECUTIVE-SUMMARY.md`](EPIC-UI-1-EXECUTIVE-SUMMARY.md) — `UI-F1`

> **Trạng thái:** ⏳ trình Board. ⛔ Chưa viết một dòng Production Code nào.
