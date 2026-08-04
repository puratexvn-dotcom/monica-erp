# EDD-06 · ARCHITECTURE FREEZE PACKAGE
## Architecture Consistency Audit · Decision Baseline · Implementation Readiness

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-06 |
| **Sprint** | Enterprise Business Design · Sprint 6 — 🔴 **Sprint KIỂM TOÁN, ⛔ không phải thiết kế** |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Phạm vi** | ⛔ **Không mở rộng.** ⛔ Không Domain · Module · Capability · Workflow · Business Object mới |
| **Thẩm quyền được cấp** | *"Nếu phát hiện mâu thuẫn, được phép sửa tài liệu."* |
| **Trạng thái Freeze** | 🟡 **CÓ ĐIỀU KIỆN** — xem §1 |

---

# §1 · 🔴 KẾT LUẬN KIỂM TOÁN — ĐỌC TRƯỚC

> **Board yêu cầu một Architecture Freeze. Tôi ⛔ KHÔNG thể cấp chứng nhận vô điều kiện, và phải nói rõ vì sao.**

## 1.1 Kết quả một câu

```
🟢 KIẾN TRÚC NHẤT QUÁN NỘI BỘ.       149 quyết định · ⛔ 0 xung đột thực chất
🔴 KIẾN TRÚC MÂU THUẪN HIẾN PHÁP     ở BA điểm — cần ba tu chính hiến định
🟡 NỀN NGHIỆP VỤ CHƯA PHÊ CHUẨN      BKB vẫn là DRAFT (bậc 0′ chưa có hiệu lực)
🟡 THẨM QUYỀN THIẾT KẾ CHƯA PHÊ CHUẨN ADR-011 vẫn ⏳ chờ duyệt
```

## 1.2 Vì sao ⛔ không thể cấp Freeze vô điều kiện

**Hiến pháp ở bậc 1. Enterprise Design ở bậc 2′.** Bậc dưới ⛔ **không thể ghi đè bậc trên** — Hiến pháp §5.12 · §43.3 · ADR-010.

Ba chỗ EDD-01…EDD-05 **mâu thuẫn trực tiếp** với Hiến pháp:

| Điểm | Hiến pháp nói | EDD nói | Hệ quả |
|---|---|---|---|
| **C-1** | §16.2 — **11 Business Workspace**, thêm phải có ADR | EDD-01 — **14 Domain / 14 Workspace** | 🔴 Ba Workspace *(Product Development · Industrial Engineering · Procurement)* **hiện đang vi hiến** |
| **C-2** | §5.4 — *"mỗi Workspace đại diện MỘT Business Domain"* | EDD-01 §1.1 — Executive Center ⛔ **không sở hữu dữ liệu nào** | 🔴 Ngoại lệ chưa được hiến định hoá |
| **C-3** | Điều 13 *(ADR-001 v1.1)* — trang chủ là **Business Operating System Launcher** | EDD-05 §2.2 — trang chủ có **HAI vùng**: Công việc + Apps | 🔴 Vùng *"Công việc"* chưa có chỗ hiến định |

> 🔴 **Ba mâu thuẫn này ⛔ KHÔNG phải lỗi thiết kế.** Board **đã phê duyệt** EDD-01 và EDD-05 chứa chúng. Nhưng **phê duyệt một tài liệu bậc 2′ ⛔ không tự động tu chính Hiến pháp** — Hiến pháp Điều 42 đòi tu chính qua ADR.
>
> ⇒ Đây là **thiếu sót thủ tục**, ⛔ không phải bất đồng nội dung. Ba ADR chỉ **ghi lại điều Board đã quyết**.

## 1.3 Điều kiện để Freeze có hiệu lực

```
🔴 BA TU CHÍNH HIẾN ĐỊNH — nội dung đã sẵn ở §2.4, chỉ cần Board ban hành

   ADR-015  Ba Business Workspace bổ sung (§16.2)
   ADR-016  Executive Center là Workspace ⛔ không có Domain (Điều 18 · §5.4)
   ADR-017  Trang chủ hai vùng (Điều 13)

🟡 HAI PHÊ CHUẨN CÒN THIẾU

   BKB v2.0   DRAFT → ADOPTED     (nền nghiệp vụ bậc 0′)
   ADR-011    ⏳ chờ → APPROVED    (thẩm quyền thiết kế)
```

⚠️ **⛔ Không mục nào đòi thiết kế lại.** Cả năm đều là **hành vi phê chuẩn**.

---
---

# §2 · ARCHITECTURE CONSISTENCY REPORT

## 2.1 Phạm vi rà chéo

| Nguồn | Đơn vị rà |
|---|---|
| Constitution v1.5 | 45 Điều · 8 Phần |
| BKB v2.0 | 60 quy tắc `BR-*` · 8 `CF` · 36 `OQ` · 3 `VR` |
| ADR | 11 bản |
| EDD-01 → EDD-05 | 13 tài liệu |
| Decision Log | **149** |
| Board Decision | **29** |
| Project Memory | 12 mục |
| CLAUDE.md | 7 mục |
| **Tổng cặp đối chiếu** | ~**2.100** |

## 2.2 Tổng hợp phát hiện — 19

| Mức | Số | Trạng thái |
|---|---|---|
| 🔴 **CRITICAL** — chặn Freeze | **5** | cần Board ban hành |
| 🟠 **HIGH** — chặn Implementation | **3** | cần hành động trước khi viết mã |
| 🟡 **MEDIUM** — lỗi tài liệu | **8** | ✅ **đã sửa / errata trong EDD-06** |
| 🔵 **LOW** — ghi nhận | **3** | ✅ ghi nhận |

## 2.3 🔴 CRITICAL — 5

| Mã | Phát hiện | Nguồn mâu thuẫn | Xử lý |
|---|---|---|---|
| **C-1** | **11 ⟷ 14 Workspace** | Hiến pháp §16.2 ⟷ EDD-01 §1.3 | 🔴 **ADR-015** — §2.4 |
| **C-2** | **Executive Center ⛔ không sở hữu Domain** | Hiến pháp §5.4 ⟷ EDD-01 §1.1 | 🔴 **ADR-016** — §2.4 |
| **C-3** | **Trang chủ hai vùng** | Hiến pháp Điều 13 ⟷ EDD-05 §2.2 | 🔴 **ADR-017** — §2.4 |
| **C-4** | 🔴 **BKB v2.0 vẫn là DRAFT** — bậc 0′ **chưa có hiệu lực** | BKB Document Control | Board đổi `Status: ADOPTED` |
| **C-5** | 🔴 **ADR-011 vẫn ⏳ chờ duyệt** — 149 quyết định ban hành dưới một thẩm quyền **chưa được phê chuẩn** | ADR-011 header | Board phê duyệt |

> ### ⚠️ `C-4` và `C-5` là hai phát hiện tôi **phải** nêu dù chúng bất lợi cho chính tôi
>
> **`C-5`:** Toàn bộ 149 quyết định được ra dưới thẩm quyền ADR-011 §2.1. ADR đó **chưa được Board ký**. Về mặt thủ tục, thẩm quyền của tôi đang là **thẩm quyền thực tế**, ⛔ không phải **thẩm quyền chính thức**.
>
> **`C-4`:** Mọi thiết kế nghiệp vụ đứng trên BKB v2.0 — một tài liệu **DRAFT** mà chính nó ghi ⛔ *"VĂN BẢN NÀY CHƯA CÓ HIỆU LỰC"*.
>
> ⇒ Freeze một kiến trúc xây trên nền chưa phê chuẩn là **đóng băng một giả định**. Board phải phê chuẩn nền trước.

## 2.4 🔴 NỘI DUNG BA TU CHÍNH — sẵn để Board ban hành

> ⚠️ **⛔ Không phải thiết kế mới.** Ba văn bản này **chỉ ghi lại điều Board đã quyết** khi phê duyệt EDD-01 và EDD-05.

### `ADR-015` · Ba Business Workspace bổ sung

```
Tu chính Hiến pháp §16.2 — danh sách Business Workspace hiến định
từ 11 lên 14, bổ sung:

  · Product Development   — Board xác nhận Sample là năng lực độc lập (BR-SMP-003)
                            và Hiến pháp PART IV chưa có Điều cho nó (FD-003)
  · Industrial Engineering — SMV có 4 người tiêu thụ và 0 chủ sở hữu
  · Procurement            — Board Decision EDD-02 Review: "Procurement là
                             Business Domain chính thức, ⛔ không chờ tương lai"

Căn cứ: phép thử 5 câu (DL-001) · Board phê duyệt EDD-01 · Board Decision
        về Procurement · Board phê duyệt EDD-05
Hệ quả: §16.2 · §5.3 (ví dụ Workspace) · Điều 20 (Sample chuyển sang PD)
Rollback: quay lui = 3 Workspace về EMBEDDED trong Merchandising
```

### `ADR-016` · Executive Center là Workspace ⛔ không có Domain

```
Tu chính Hiến pháp Điều 18 và §5.4.

Ghi nhận: Executive Center ⛔ KHÔNG sở hữu bảng dữ liệu gốc nào.
Nó là NGƯỜI TIÊU THỤ read-model của mọi Domain khác.

§5.4 bổ sung: "Ngoại lệ hiến định duy nhất — Executive Center là
Business Workspace ⛔ không có Business Domain tương ứng."

Điều 18 bổ sung khoản: "Executive Center ⛔ KHÔNG có quyền ghi nghiệp vụ.
Mọi hành động điều hành đi qua workflow của Domain sở hữu dữ liệu."
(khoản này chỉ ghi lại §18.7 hiện hành ở dạng tường minh hơn)

Căn cứ: EDD-01 §1.1 · điểm 1/5 phép thử · Board phê duyệt EDD-01, EDD-05
Rollback: ⛔ không có — đây là ghi nhận sự thật, ⛔ không phải lựa chọn
```

### `ADR-017` · Trang chủ hai vùng

```
Tu chính Hiến pháp Điều 13 (đã tu chính lần trước bởi ADR-001 v1.1).

§13.3 bổ sung: trang chủ gồm HAI vùng hiến định
  ① Vùng Công việc — động, cá nhân, mặc định mở khi đăng nhập
  ② Business Operating System Launcher — ổn định, cấu trúc

§13.5 giữ nguyên và được nhấn mạnh: Launcher LỌC THEO QUYỀN.
  ⛔ Không thẻ nào dẫn tới /unauthorized. (trả TD-05)

Căn cứ: EDD-05 §2.2 · DL-024 · Board phê duyệt EDD-05
Rollback: gỡ vùng ① — Work Inbox chuyển thành một mục trong Launcher
```

## 2.5 🟠 HIGH — 3

| Mã | Phát hiện | Chặn gì | Xử lý |
|---|---|---|---|
| **H-1** | 🔴 **`VR-001` chưa chạy** — 8 bảng MD có thể đang mở giá và biên LN cho khách và nhà thầu | ⛔ **Implementation**, ⛔ không chặn Freeze | Board chạy 1 truy vấn |
| **H-2** | 🔴 **Vòng khoá SECURITY FREEZE** — `031d`–`031g` bị chặn vì *"bảng còn 0 dòng"*; freeze giữ tới khi `031a→031g` xong | ⛔ **Mọi migration** | Board cắt vòng — phương án A ở Audit Report §7 |
| **H-3** | **Hai `ADR-001` khác nhau** — `architecture/adr/` và `assignment/` | Truy vết ADR *(Hiến pháp §37.5 · §37.7)* | Cấp lại số cho một bản, giữ bản gốc |

## 2.6 🟡 MEDIUM — 8, **đã xử lý trong EDD-06**

| Mã | Phát hiện | Xử lý |
|---|---|---|
| **M-1** | 🔴 **`BDR-03` bị bỏ rơi im lặng.** EDD-02 §9 trình `BDR-03` = *"mở sổ chiết tính cho buyer FOB"*. Board trả lời `BDR-03` bằng một quyết định về **Customer Portal** — chủ đề của `BDR-04`. **Câu hỏi mở sổ chiết tính chưa bao giờ được trả lời** | ✅ **Errata E-1** — §2.7 |
| **M-2** | **EDD-01 §1.3 danh sách DORMANT thiếu `D15 Textile Manufacturing`** — được thêm ở EDD-04 §11.3 nhưng ⛔ không cập nhật ngược | ✅ **Errata E-2** |
| **M-3** | **EDD-05 §4.2 ghi *"~208 màn hình"*; cộng thật theo Workspace ra ~226** | ✅ **Errata E-3** |
| **M-4** | **EDD-05 §1.1 gán nhãn nút cây là `◆ Capability/Module`** — trộn hai khái niệm khác nhau *(93 Business Capability L2 ⟷ 78 Module)* | ✅ **Errata E-4** |
| **M-5** | **CLAUDE.md §6 ghi *"trang chủ luôn đủ 12 phân hệ"*** — mã hiện có 16, đích 19 | ✅ **đã sửa CLAUDE.md** |
| **M-6** | **CLAUDE.md §6 ghi *"bottom nav luôn đủ 4 nút"*** — Hiến pháp §15.3–§15.8 khai **năm** | ✅ **đã sửa CLAUDE.md** |
| **M-7** | **`TARGET_ARCHITECTURE.md` ⛔ không có nhãn cảnh báo đã bị thay thế** — người đọc có thể dùng làm nguồn thiết kế | ✅ **đã thêm nhãn** |
| **M-8** | **`DL-104` thêm chỉ số đo thứ bảy** *(`AuthMessage`)* vào bộ 6 của `BDR-19` — ⛔ chưa được Board xác nhận tường minh | ✅ **Errata E-5** — ghi nhận là mở rộng của CSA |

## 2.7 ERRATA — sửa lỗi trong tài liệu đã phê duyệt

> ⚠️ **Tài liệu đã phê duyệt ⛔ KHÔNG sửa trực tiếp** *(Hiến pháp §43.7 — ⛔ không viết lại lịch sử)*. Sai sót ghi ở đây và **errata thắng bản gốc**.

| Mã | Tài liệu | Bản gốc ghi | 🔴 Đúng là |
|---|---|---|---|
| **E-1** | EDD-02 §9 `BDR-03` | *"Mở sổ chiết tính FOB — chờ Board"* | 🔴 **Board ⛔ không trả lời câu này.** Áp mặc định an toàn: `Costing.disclosure = INTERNAL_ONLY` **cứng** *(EDD-03 §5.2)*. Mở sổ chiết tính **⛔ KHÔNG được thiết kế, ⛔ không có trường nào** ⇒ nếu Monica cần về sau, **bắt buộc ADR mới** |
| **E-2** | EDD-01 §1.3 DORMANT | 3 Domain: Compliance · Maintenance · Wholesale | 🔴 **4 Domain** — thêm **`D15 Textile Manufacturing`** *(`DL-079`)* |
| **E-3** | EDD-05 §4.2 | *"~208 màn hình"* | 🔴 **~226 màn hình** *(196 nội bộ + 30 cổng đối tác)* |
| **E-4** | EDD-05 §1.1 | nút cây `◆ Capability/Module` | 🔴 **`◆ Module`**. `Business Capability` là khái niệm của **EDD-01 §2** *(93 mục L2)*; `Module` là khái niệm của **EDD-05 §2** *(78 mục)*. **Hai bản đồ khác nhau, ⛔ không được trộn** |
| **E-5** | `DL-104` | chỉ số thứ bảy `AuthMessage` | 🔴 Là **mở rộng do CSA đề xuất**, ⛔ chưa có xác nhận tường minh của Board. Giữ trong thiết kế; Board xác nhận hoặc gỡ ở lần rà tới |

## 2.8 🔵 LOW — 3, ghi nhận

| Mã | Phát hiện | Ghi nhận |
|---|---|---|
| **L-1** | `BC2-Q3` *(Customer/Contract thuộc Commercial hay MD)* được giải bằng `DL-014` và **phê chuẩn ngầm** qua việc Board duyệt EDD-01 — ⛔ không có câu trả lời tường minh | Chấp nhận: phê duyệt tài liệu = phê chuẩn quyết định trong tài liệu |
| **L-2** | Nhiều `OQ` của BKB *(`OQ-012` · `OQ-016` · `OQ-022` · `OQ-026`…)* được CSA quyết bằng `DL-*` thay vì Board trả lời | Hợp lệ theo Working Principle v2.0 — *"⛔ không hỏi những gì suy ra được"* |
| **L-3** | `BDR-28` · `BDR-29` do CSA tự quyết, phê chuẩn ngầm qua duyệt EDD-05 | Board có thể phủ quyết bất cứ lúc nào — `DL-149` rút lại được |

## 2.9 🟢 KIỂM TRA KHÔNG PHÁT HIỆN VẤN ĐỀ

| Hạng mục kiểm | Kết quả |
|---|---|
| **Decision Log xung đột** | 🟢 **0 xung đột thực chất** trong 149 quyết định. Ba cặp *"trông như xung đột"* đã được giải tường minh: `DL-041` ⟷ `DL-138` *(chụp bằng chứng ⛔ không phải nhập trùng)* · `DL-047` ⟷ `P-ZERODUP` *(tỷ giá là sự kiện)* · `DL-089` ⟷ `DL-124` *(cùng ranh giới sự kiện⟷cam kết)* |
| **Capability lặp** | 🟢 93 L2 — ⛔ không mục nào xuất hiện hai lần. `C15.2` đã tách thành 3 ở EDD-03A |
| **Business Object lặp** | 🟢 88 aggregate — mỗi cái đúng một Domain sở hữu |
| **Module chồng chéo** | 🟢 78 Module — `MOD-1` cưỡng chế mỗi Module đúng một Workspace; 9 Shared Capability ⛔ không là Module *(`DL-148`)* |
| **Workflow mâu thuẫn** | 🟢 4 nguyên mẫu ⛔ không chồng lấn · guard luôn là `RuleRef` *(`DL-067`)* ⇒ ⛔ không có điều kiện viết hai nơi |
| **Permission mâu thuẫn** | 🟢 6 chiều phạm vi × 6 lớp tiết lộ × 5 loại dữ liệu — ⛔ không cặp nào mâu thuẫn. 9 `SOD-H*` ⛔ không chồng lấn |
| **Domain sai ranh giới** | 🟢 Nguyên tắc **thì-của-động-từ** *(`DL-008`)* giải hết 3 ca tranh chấp đã biết |
| **Tài liệu lỗi thời** | 🟢 5 tài liệu bị thay thế đã ghi ở Project Memory §2.2; nay có nhãn cảnh báo |
| **Hiến pháp §45 i18n ⟷ `DL-032`** | 🟢 ⛔ Không mâu thuẫn — dịch **nhãn của mã**, ⛔ không dịch **nội dung hồ sơ** |
| **`DL-025` ⟷ D12 Finance** | 🟢 ⛔ Không mâu thuẫn — Monica ONE giữ **sự thật thương mại**; MISA giữ **sự thật kế toán** |

---
---

# §3 · DECISION BASELINE

## 3.1 Đường cơ sở

```
🔒 ARCHITECTURE BASELINE  ·  MONICA ONE  ·  2026-08-04

   Constitution            v1.5 ADOPTED          45 Điều
   + 3 tu chính chờ ban hành                     ADR-015 · 016 · 017
   BKB                     v2.0 ⏳ DRAFT          60 quy tắc nghiệp vụ
   ADR                     11 bản (1 chờ duyệt)
   Enterprise Design       EDD-01 … EDD-05       13 tài liệu
   Decision Log            DL-001 … DL-149       149 quyết định
   Board Decision          BDR-01 … BDR-29       29 quyết định
   Design Principles       5                     P-COMMIT · P-IRREV · P-ATTRIB
                                                 P-ZEROMAN · P-ZERODUP
```

## 3.2 Phân loại 149 quyết định theo mức khoá

| Mức | Số | Nghĩa | Thủ tục đổi |
|---|---|---|---|
| 🔴 **CHỊU LỰC** | **19** | Đổi = cascade toàn hệ · di trú dữ liệu | ⛔ **Board Decision + ADR mới** |
| ⚠️ **KHÓ RÚT** | **48** | Đổi = sửa nhiều tài liệu và nhiều màn hình | Board Decision |
| ✅ **DỄ RÚT** | **82** | Đổi = sửa cấu hình hoặc một tài liệu | CSA quyết, ghi Decision Log |

*Danh sách 19 quyết định chịu lực: Project Memory §5.1.*

## 3.3 Cái gì bị KHOÁ, cái gì còn MỞ

| 🔒 **KHOÁ — cần ADR để đổi** | 🔓 **MỞ — cấu hình được** |
|---|---|
| 14 Business Domain + ranh giới sở hữu | Domain nào ACTIVE/EMBEDDED/DORMANT |
| 9 Shared Kernel | Ngưỡng · giá trị · % · SLA |
| 88 Business Object + aggregate boundary | Mẫu lịch T&A · chặng kiểm · `ProcessRoute` |
| Tập trạng thái + **phép chuyển hợp lệ** | Ai giữ Role nào |
| 6 lớp tiết lộ · 6 chiều phạm vi · 5 loại dữ liệu | Luật sinh việc Work Inbox |
| 9 `SOD-H*` chặn cứng | Nhãn hiển thị · ngôn ngữ · lịch nhà máy |
| 5 nguyên tắc thiết kế + cổng kiểm 6 câu | Bố cục dashboard · ngưỡng KPI |
| 3 Portal độc lập + phép chiếu tiết lộ | Mức tiết lộ *(qua cổng L2)* |
| 4 nguyên mẫu Workflow · 7 loại Rule | Nội dung Workflow · Rule cụ thể |
| Object Control Tower 11 lớp | Lens Tabs của từng OCT |

---
---

# §4 · ARCHITECTURE TRACEABILITY MATRIX

> Chuỗi 12 tầng Board yêu cầu, truy vết trên **12 yêu cầu nghiệp vụ đại diện** phủ toàn bộ 14 Domain.

## 4.1 Ký hiệu cột

`BR` yêu cầu · `D` Domain · `CAP` Capability *(EDD-01 §2)* · `BO` Business Object ·
`WF` Workflow · `R` Rule · `PERM` Permission · `WS` Workspace · `MOD` Module ·
`DB` bảng chính · `API` bề mặt · `UI` màn hình

## 4.2 Ma trận

| # | BR | D | CAP | BO | WF | R | PERM | WS | MOD | DB | API | UI |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **1** | `BR-ORD-001` Vào đơn: Email+TechPack **hoặc** Inquiry | D2 | C18 | `Inquiry` `Order` | `ORDER_LIFECYCLE` A | `R-ORD-GATE1` | `order.create` + PartyScope | Merchandising | Order Book · Inquiry | `orders` `inquiries` | `POST /orders` | 🅩 New Order Wizard · 🅛 Order List |
| **2** | `BR-CST-001` Mẫu **trước** chiết tính | D3→D2 | C11·C19 | `Sample` `Costing` | `ORDER_LIFECYCLE` cổng 1 | `R-ORD-GATE1` *(mềm)* | `costing.create` | Product Dev → MD | Sample · Costing | `sample_submissions` `costings` | `GET /samples` | 🅓 Sample Dossier → 🅓 Costing |
| **3** | 🔴 `BR-ACC-002` Khách ⛔ **không** xem chiết tính | D2 | C19 | `Costing` | — | `RESTRICTED` cứng | ⛔ **⛔ không có trong `customer_view.*`** | — | — | `costings` ⛔ không cấp quyền vai ngoài | ⛔ **⛔ không có endpoint** | ⛔ **⛔ không có màn hình** |
| **4** | 🔴 `BR-ACC-006` Nhà thầu **BẮT BUỘC GHI** | D11·D6 | C44 | `SubconDailyReport` `StageThroughput` | `ASSIGNMENT` A | `R-SUBCON-DAILY` | `output.write` ∩ AssignmentScope | Subcontract Portal | Output Capture | `stage_throughput` | `POST /partner/output` *(offline queue)* | 🅜 Quick Output · 🅜 Daily Report |
| **5** | `BR-MAT-001` Sở hữu NPL **theo từng dòng** | D2·D9 | C22 | `OrderMaterialPlan` | `ORDER_LIFECYCLE` cổng 2 | `M67 OwnershipPolicy` | `matplan.write` | Merchandising | Material Ownership Plan | `order_material_plan_lines` | `GET/PUT /orders/{id}/material-plan` | 🅓 Material Plan |
| **6** | `BR-PRD-002` Một PO chia nhiều nhà máy | D2·D11·D5 | C29 | `OrderAllocation` `Assignment` `ProductionOrder` | `ASSIGNMENT` A | `R-ALLOC-SUM` | `alloc.propose` / `alloc.approve` | Merchandising · Subcontract | Allocation · Assignment | `assignments` `production_orders` | `POST /allocations` | 🅓 Allocation Board · 🅓 Assignment 360° |
| **7** | 🔴 `BR-QUA-001` **Một** chứng từ QA, nhiều lăng kính | D7 | C38 | `Inspection` `InspectionFinding` | `QUALITY_CAPA` D | `R-QA-DISCLOSE` | `disclosure` **từng phát hiện** | Quality *(+3 Portal)* | Inspection | `inspections` `inspection_findings` | `GET /inspections/{id}` **qua 4 phép chiếu** | 🅓 Inspection 360° · 🅜 Capture |
| **8** | 🔴 `BR-RPT-001` Mọi báo cáo **một con số** | S7 | C68 | `ReadModel` `MetricDefinition` | — | `RM-1` `RM-2` `RM-3` | theo lớp tiết lộ chỉ số | mọi Workspace | Dashboard | `read_model.*` `metric_definitions` | `GET /metrics/{code}` | 🅑 mọi Dashboard |
| **9** | `BR-FIN-001` Monica phát hành hoá đơn | D12 | C61·C62 | `InvoiceRequest` `ExternalInvoiceMirror` | `APPROVAL` B | `R-FIN-RECON` | `invoice.request` / `finance.read` | Finance | Invoice Request · MISA Mirror | `invoice_requests` `external_invoice_mirror` | `POST /invoice-requests` · file MISA | 🅓 Invoice Request · 🅑 Reconciliation |
| **10** | 🔴 `BR-TNA-002` Trễ mốc ⇒ nâng khẩn cấp | D2 | C23 | `TnAPlan` `Milestone` `RiskSignal` | `ORCHESTRATION` C | `R-TNA-ESCALATE` | `tna.read` | Merchandising | T&A Plan | `tna_milestones` `risk_signals` | `GET /orders/{id}/tna` | 🅓 T&A Board · ⓪ Work Inbox |
| **11** | `BR-EXE-002` Bảng CEO theo **ngoại lệ** | D14·S7 | C69 | `ReadModel` `RiskSignal` | — | 5 tín hiệu luật `DL-043` | `dash.exec` + `RESTRICTED` | Executive Center | Cockpit · Early Warning | `read_model.exec_*` | `GET /exec/cockpit` | 🅑 Executive Cockpit |
| **12** | 🔴 `BR-LFC-002` Huỷ đơn + xử lý NPL | D2·D8·D9·D11·D12 | C21 | `Order` + 4 aggregate liên đới | `ORDER_LIFECYCLE` A | `R-ORD-CANCEL` | `order.cancel` + **đồng ký** *(`DL-042`)* | Merchandising | Order Book | `orders` `reservations` `assignments` | `POST /orders/{id}/cancel` | 🅖 Cancel Order Dialog |

## 4.3 Ba dòng đáng chú ý

| Dòng | Vì sao |
|---|---|
| **#3** | 🔴 Cả bốn cột cuối đều là **"⛔ KHÔNG CÓ"**. Đây là `DL-064` *(che ⛔ không đủ, phải ⛔ không tồn tại)* thể hiện trong ma trận truy vết: **cách bảo vệ mạnh nhất là ⛔ không có gì để bảo vệ** |
| **#8** | Yêu cầu **⛔ không thuộc Domain nào** — nó thuộc Kernel `S7` và áp cho **mọi** Workspace. Đây là loại yêu cầu mà ma trận truy vết theo Domain thông thường **bỏ sót** |
| **#12** | Một yêu cầu chạm **5 Domain**. Đây là lý do `DL-042` đòi đồng ký: huỷ đơn ⛔ không phải một thao tác, nó là một giao dịch xuyên Domain |

---
---

# §5 · IMPLEMENTATION READINESS CHECKLIST

## 5.1 🔴 CỔNG A — Phê chuẩn *(chặn Freeze)*

| # | Hạng mục | Ai | Trạng thái |
|---|---|---|---|
| A1 | Ban hành **ADR-015** *(3 Workspace bổ sung)* | Board | ⬜ |
| A2 | Ban hành **ADR-016** *(Executive Center)* | Board | ⬜ |
| A3 | Ban hành **ADR-017** *(trang chủ hai vùng)* | Board | ⬜ |
| A4 | 🔴 **BKB v2.0 → `ADOPTED`** | Board | ⬜ |
| A5 | 🔴 **ADR-011 → `APPROVED`** | Board | ⬜ |
| A6 | Ký **Architecture Freeze Certificate** | Board | ⬜ |

## 5.2 🟠 CỔNG B — Trước dòng mã đầu tiên

| # | Hạng mục | Ai | Trạng thái |
|---|---|---|---|
| B1 | 🔴 **Chạy `VR-001`** — truy vấn `pg_policies` *(1 phút)* | Board | ⬜ |
| B2 | 🔴 **Cắt vòng khoá SECURITY FREEZE** | Board | ⬜ |
| B3 | Gộp hai `ADR-001` — cấp lại số cho một bản | CSA | ⬜ |
| B4 | Chỉ định người thứ hai cho `SOD-H04` · `H05` · `H06` | Joseph | ⬜ |
| B5 | Định **thời hạn phản biện tối đa** *(ADR-011 §4.2)* | Board | ⬜ |
| B6 | Dựng `docs/review/` cho hồ sơ phản biện *(TD-15)* | CSA | ⬜ |

## 5.3 🟡 CỔNG C — Dữ liệu chủ trước Sprint nghiệp vụ

| # | Hạng mục | Nguồn |
|---|---|---|
| C1 | `OQ-A` khấu trừ có tồn tại ⛔ không · quy tắc nào | Board |
| C2 | `OQ-B` điều kiện thanh toán thực dùng | Board |
| C3 | `OQ-C` công nợ nhà thầu tính theo gì | Board |
| C4 | `OQ-D` MISA bản nào *(desktop / AMIS)* | Board |
| C5 | `OQ-E` có NCC kiêm nhà thầu ⛔ không | Board |
| C6 | Ngưỡng: giá trị duyệt · % NPL cổng 3 · SLA từng bước | Board |
| C7 | Bộ dữ liệu chủ khởi tạo T0/T1 *(~700 bản ghi)* | CSA |

## 5.4 🟢 CỔNG D — Hạ tầng kỹ thuật

| # | Hạng mục |
|---|---|
| D1 | Bộ kiểm phép chiếu tiết lộ — mỗi phép chiếu một bài kiểm liệt kê trường *(`DP-3`)* |
| D2 | Bài kiểm rò chéo tenant *(`MT-5`)* · rò chéo đối tác *(`SP-3`)* · **tương quan** *(`SP-4`)* |
| D3 | Phép kiểm vốn từ trạng thái mã ⟷ CSDL *(TD-03)* |
| D4 | Phép kiểm cấm màn hình tự tính chỉ số *(`RM-2`)* |
| D5 | Phép kiểm `duplicate_field_count = 0` *(`DL-140`)* |
| D6 | Máy in nhãn: tổ cắt · kho · đóng gói *(bậc ② `P-ZEROMAN`)* |
| D7 | Neo băm Audit Log ra ngoài CSDL *(`DL-073`)* |

---
---

# §6 · PROJECT STRUCTURE INDEX

```
monica-erp/
├─ CLAUDE.md                          🔴 cửa vào — trỏ tới PROJECT_MEMORY
├─ docs/
│  ├─ 🧠 PROJECT_MEMORY.md            🔴 CHỈ MỤC DUY NHẤT — đọc trước tiên
│  │
│  ├─ architecture/
│  │  ├─ 00-CONSTITUTION.md           bậc 1 · v1.5 · 45 Điều
│  │  ├─ adr/ADR-001                  ⚠️ trùng số — xem H-3
│  │  ├─ TARGET_ARCHITECTURE.md       ⛔ ĐÃ BỊ THAY THẾ
│  │  ├─ CM_OPERATING_MODEL.md        ⛔ §1.3 · §3 đã bị thay thế
│  │  └─ NEEDS_CLARIFICATION.md       ⛔ đã bị BKB Phần E thay thế
│  │
│  ├─ business/
│  │  ├─ BUSINESS_KNOWLEDGE_BASE.md   bậc 0′ · ⏳ DRAFT · 60 quy tắc
│  │  └─ BUSINESS_CONFIRMATION_1·2.md 38 câu hỏi Board
│  │
│  ├─ adr/                            bậc 2 · ADR-002…011
│  │
│  ├─ enterprise-design/              bậc 2′ · 14 tài liệu
│  │  ├─ EDD-01  Business·Capability·Domain      DL-001…030
│  │  ├─ EDD-02  Master Data·Business Object     DL-031…043
│  │  ├─ EDD-03  Document·Information            DL-044…061
│  │  ├─ EDD-03A Partner Portal                  DL-062…066
│  │  ├─ EDD-04  Workflow·Rule·Permission        DL-067…082
│  │  ├─ EDD-04A Partner Runtime·Mobile          DL-083…093
│  │  ├─ EDD-04B Config Governance·Versioning    DL-094…099
│  │  ├─ EDD-04C Subcontract Portal Runtime      DL-100…112
│  │  ├─ EDD-04D Irrevocability Principle        DL-113…123
│  │  ├─ EDD-04E Zero Manual Principle           DL-124…129
│  │  ├─ EDD-04F Data Egress Control             DL-130…137
│  │  ├─ EDD-04G Zero Duplicate·Design Gate      DL-138…141
│  │  ├─ EDD-05  Product Architecture v2         DL-142…149
│  │  └─ EDD-06  Architecture Freeze Package     ← tài liệu này
│  │
│  ├─ audit/           MONICA_ONE_AUDIT_REPORT · MD_PRODUCT_AUDIT
│  ├─ planning/        SPRINT_2_PLAN
│  ├─ TECHNICAL_DEBT.md · MIGRATION_INDEX.md
│  ├─ UI_UX_STANDARDS.md · MUTATION_POLICY.md          bậc 3
│  ├─ MONICA_CONSTITUTION.md · ENGINEERING_PLAYBOOK.md bậc 4
│  └─ DOMAIN_GLOSSARY.md · RLS_COVERAGE_MATRIX.md      bậc 5
│
├─ app/ · components/ · lib/ · supabase/ · tests/       bậc 6
└─ ⛔ KHÔNG chạm cho tới khi Board mở khoá Implementation
```

---
---

# §7 · IMPLEMENTATION ROADMAP

> Kế thừa lộ trình EDD-04B §7.3, cập nhật theo Freeze.

| Sprint | Tên | Nội dung | Điều kiện ra |
|---|---|---|---|
| **I-0** | 🔴 **Phê chuẩn** | Cổng A + Cổng B §5 | Freeze Certificate có hiệu lực |
| **I-1** | 🔴 **An toàn** | `VR-001` → ADR-013 → `031d`–`031g` → bài kiểm phép chiếu *(hỏng trước, xanh sau)* | `pg_policies` trên CSDL thật cho thấy 8 bảng đã thu hẹp |
| **I-2** | **Lưới an toàn** | Bộ kiểm nghiệp vụ MD + Warehouse · phép kiểm vốn từ *(TD-03)* · sửa `po-twin:132` · phép kiểm 6 cổng | `test:arch` có đủ 5 phép kiểm mới |
| **I-3** | **Nền tảng** | `tenant_id` mọi bảng · phép chiếu tiết lộ · read-model S7 · `MetricDefinition` | Bài kiểm rò chéo tenant + chéo đối tác xanh |
| **I-4** | **Vòng đời đơn hàng** | `ORDER_TRANSITIONS` · **huỷ đơn** · 4 cổng · Work Inbox | Một đơn huỷ được trọn vẹn có bằng chứng |
| **I-5** | **Ranh giới Workspace** | Gộp 4 route Production · `Commercial` thôi trỏ `/buyer` · Smart Routing · trang chủ lọc quyền | ⛔ **0 route mang tên chức danh** |
| **I-6** | **Object Control Tower** | Khung OCT 11 lớp · Order 360° · Roll 360° · Bundle 360° | Hai màn hình cùng đối tượng ra **cùng** con số |
| **I-7** | **Order-to-Cash** | D12 Finance · `Deduction` · đối chiếu MISA · `CostActual` 4 trục | Một đơn đi trọn tới `CLOSED` |
| **I-8** | **Hoạch định** | D5 · mô hình năng lực · **CTP** · cổng thả có điều kiện | Trả lời *"nhận nổi đơn này ⛔ không"* **bằng số** |
| **I-9** | **Cổng đối tác** | Partner Foundation · Customer Portal · Subcontract Portal *(mobile, offline)* | `SP-3` · `SP-4` xanh |
| **I-10** | **Xưởng** | Line Map 13 công đoạn · quét mã bó · Andon · **Sổ Thời gian chuẩn** | Truy vết cuộn→thùng ⛔ không đứt |

---
---

# §8 · KNOWN LIMITATIONS

> Giới hạn **có tên**, ⛔ không phải lỗ hổng im lặng.

| # | Giới hạn | Phạm vi ảnh hưởng | Quyết định |
|---|---|---|---|
| **KL-1** | 🔴 **⛔ Không phủ doanh nghiệp DỆT–MAY TÍCH HỢP DỌC.** Sản xuất vải là **biến đổi theo công thức**, ⛔ không phải lắp ráp theo BOM | ~5% thị trường | `DL-079` — `D15` DORMANT, ⛔ không nhét vào `BOM`/`ProcessRoute` |
| **KL-2** | **Đóng dấu chìm dữ liệu bảng là RĂN ĐE, ⛔ không phải TRUY VẾT.** CSV ⛔ không đóng dấu được | Xuất dữ liệu | `DL-133` — truy vết đến từ `DownloadLog` + băm |
| **KL-3** | 🔴 **⛔ Không có giải pháp TRONG CSDL chống được quản trị viên CSDL.** Chuỗi băm làm việc sửa **phát hiện được**, ⛔ không **ngăn được** | Audit Log | `DL-073` — neo băm ra ngoài là **bắt buộc** |
| **KL-4** | **Chụp màn hình và sao chép–dán ⛔ KHÔNG ngăn được** | Mọi màn hình `RESTRICTED` | `P-ATTRIB` — chuyển sang quy trách nhiệm bằng dấu chìm màn hình |
| **KL-5** | **Bậc ① *(tự động suy)* ⛔ không có người kiểm** | `P-ZEROMAN` | `DL-126` — giá trị vào tiền/cam kết phải có cổng xác nhận |
| **KL-6** | 🔴 **Tấn công tương quan ⛔ không chặn được bằng lọc dòng** — nhà thầu có nhiều assignment có thể suy ra danh tính khách | Subcontract Portal | `DL-063` che mặc định + `SP-4` bài kiểm |
| **KL-7** | **Mô hình học máy cần 6–12 tháng dữ liệu** — v1 chỉ có 5 tín hiệu bằng luật | AI tầng 3–4 | `DL-043` — luật trước, học máy sau |
| **KL-8** | **Nếu xưởng gia công dùng chung một tài khoản dù ta cấp riêng**, `BDR-23` chỉ tạo ảo giác bằng chứng | Subcontract Portal | Rủi ro còn lại, ⛔ chưa đo được |
| **KL-9** | 🔴 **Freeze đóng băng một kiến trúc xây trên BKB DRAFT.** Nếu Board sửa BKB khi phê duyệt, một phần thiết kế phải rà lại | Toàn hệ | `C-4` — phê chuẩn BKB **trước** khi Freeze có hiệu lực |

---
---

# §9 · TECHNICAL DEBT REGISTER

## 9.1 Nợ từ kho mã hiện có

| Mã | Nội dung | Mức | Sprint xử |
|---|---|---|---|
| `TD-01` | `saveSizeBreakdown` bù trừ thay giao dịch thật | 🔴 | I-4 |
| `TD-02` | `cut_bundles.status` `VARCHAR` tự do | 🟡 | I-2 |
| `TD-03` | 🔴 **⛔ Không có phép kiểm vốn từ mã ⟷ CSDL** | 🔴 | **I-2** |
| `TD-04` | `components/sidebar.tsx` 10 lối vào ⛔ không gắn layout | 🟡 | I-5 |
| `TD-05` | Trang chủ hiện đủ thẻ cho mọi người | 🟡 | **I-5** |
| `TD-06` | Nhãn phân hệ chưa qua `lib/i18n` | 🟡 | I-5 |
| `TD-07` | 108 tệp còn màu viết thẳng | 🟡 | sau Design System |
| `TD-09` | 3 tệp Recharts chưa dùng `CHART_PALETTE` | 🟡 | sau |
| `TD-10` | Hệ thẻ chữ — GĐ2·3 chờ | 🟡 | sau |
| `TD-11` `TD-12` | Chưa có hệ biểu tượng · hệ chuyển động | 🟡 | sau |
| `TD-13` | i18n — chuỗi viết thẳng phần lớn màn hình | 🟡 | I-5 |
| `TD-15` | Chưa có `docs/review/` cho hồ sơ phản biện | 🟢 | **B6** |

## 9.2 🆕 Nợ phát sinh từ Enterprise Design

| Mã | Nội dung | Mức | Sprint |
|---|---|---|---|
| `TD-16` | 🔴 **8 bảng MD ⛔ không có policy thu hẹp** *(`KD-2`)* | 🔴 | **I-1** |
| `TD-17` | 🔴 **`po-twin.service.ts:132` hằng số `0`** — hai màn hình cùng đơn, hai mức khẩn cấp | 🔴 | **I-2** |
| `TD-18` | `md-client.tsx` 886/900 dòng — 14 dòng nữa gãy arch test | 🟠 | I-2 |
| `TD-19` | `md-legacy-client.tsx` mã chết — **nơi DUY NHẤT gọi `garment-math`** | 🟠 | I-6 *(nối lại trước khi xoá)* |
| `TD-20` | `/subcon` phục vụ **7 vai trò** gồm cả nhà thầu ngoài | 🔴 | **I-9** |
| `TD-21` | 3 lát cắt PO cấp quyền mà ⛔ không dựng *(`buyer`·`finance`·`activity`)* | 🟡 | I-6 |
| `TD-22` | MD ⛔ **không có một bài kiểm nghiệp vụ nào** — 19.058 dòng | 🔴 | **I-2** |
| `TD-23` | Hai `ADR-001` khác nhau | 🟡 | **B3** |
| `TD-24` | 8 bộ từ vựng trạng thái ⛔ không luật chuyển *(trừ `assignment.ts`)* | 🔴 | I-4 |

**Tổng: 22 khoản nợ · 8 mức 🔴.**

---
---

# §10 · ARCHITECTURE CHANGE PROCEDURE

> 🔴 Hiệu lực **từ thời điểm Freeze**. Mọi thay đổi kiến trúc phải đi qua đây.

## 10.1 Nguyên tắc gốc

```
🔴 PHÁT HIỆN VẤN ĐỀ KIẾN TRÚC KHI LẬP TRÌNH
       ▼
   ⛔ ⛔ KHÔNG SỬA BẰNG MÃ                    (DL-143)
       ▼
   ① CẬP NHẬT TÀI LIỆU KIẾN TRÚC TRƯỚC
       ▼
   ② SAU ĐÓ MỚI ĐƯỢC SỬA IMPLEMENTATION
```

## 10.2 Bốn loại thay đổi

| Loại | Ví dụ | Thủ tục | Ai duyệt |
|---|---|---|---|
| **T1 · CẤU HÌNH** | ngưỡng · mẫu lịch · nhãn · ai giữ Role | ⛔ Không cần thủ tục — cổng L1/L2 *(`DL-094`)* | quản trị viên tenant |
| **T2 · THIẾT KẾ NHỎ** | thêm màn hình trong Module đã có · thêm luật sinh việc | Ghi **Decision Log mới** · qua **Screen Design Gate** | CSA |
| **T3 · THIẾT KẾ LỚN** | thêm Business Object · đổi Workflow · đổi phép chiếu | **ADR mới** + phản biện độc lập *(ADR-011 §2.2)* | **Board** |
| **T4 · NỀN TẢNG** | thêm/bỏ Domain · đổi ranh giới sở hữu · đổi 1 trong **19 quyết định chịu lực** · đổi 1 trong **5 nguyên tắc** | **ADR + tu chính Hiến pháp** *(Điều 42)* + phản biện | 🔴 **Board — ⛔ không uỷ quyền được** |

## 10.3 Hồ sơ bắt buộc cho T3 và T4

Theo ADR-011 §2.3 — **thiếu mục nào thì hồ sơ chưa đủ để trình**:

```
① ĐỀ XUẤT              quyết định là gì, phạm vi tới đâu
② BẰNG CHỨNG ĐO ĐƯỢC   số liệu · tệp:dòng · kết quả truy vấn
                        🔴 nhận định ⛔ không kèm phép đo ⛔ KHÔNG phải bằng chứng
③ PHƯƠNG ÁN ĐÃ LOẠI    đã cân nhắc gì, VÌ SAO ⛔ KHÔNG chọn
④ CHỖ TÔI CÓ THỂ SAI   🔴 liệt kê tường minh giả định chưa xác minh
⑤ 🆕 RÀ 6 CỔNG          Screen Design Gate cho mọi màn hình bị ảnh hưởng
⑥ 🆕 TÁC ĐỘNG BASELINE  quyết định nào trong 149 bị ảnh hưởng · mức rút lại
```

## 10.4 Quy trình

```
Phát hiện ─▶ Phân loại T1/T2/T3/T4 ─▶ Lập hồ sơ 6 mục
   ─▶ Phản biện độc lập (T3·T4) ─▶ Board Decision
   ─▶ Ban hành ADR / cập nhật EDD ─▶ Cập nhật Decision Log
   ─▶ 🔴 CẬP NHẬT PROJECT MEMORY ─▶ Mới được sửa mã
```

## 10.5 Ba điều cấm tuyệt đối sau Freeze

| # | ⛔ Cấm | Vì sao |
|---|---|---|
| `AC-1` | 🔴 **Sửa mã để bù cho sai kiến trúc** | `DL-143` — vá chạy được nhưng để khuyết tật sống dưới một lớp mã, nổi lên ở màn hình thứ hai |
| `AC-2` | 🔴 **Thêm màn hình nhập liệu để né `P-ZERODUP`** | `DL-139` — nhập trùng là chỉ điểm của 1 trong 4 khuyết tật kiến trúc; phải sửa khuyết tật |
| `AC-3` | 🔴 **Tắt bài kiểm để cho mã đi qua** | Bài kiểm phép chiếu là **nghĩa vụ pháp lý** của `BDR-25`, ⛔ không chỉ nghĩa vụ kỹ thuật |

---
---

# §11 · ARCHITECTURE FREEZE CERTIFICATE

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║              ARCHITECTURE FREEZE CERTIFICATE                              ║
║                        MONICA ONE                                         ║
║                                                                           ║
║  Baseline           EDD-01 … EDD-06 · 149 Decision Log · 29 Board Decision║
║  Constitution       v1.5 ADOPTED + 3 tu chính CHỜ BAN HÀNH                ║
║  Nguyên tắc         P-COMMIT · P-IRREV · P-ATTRIB · P-ZEROMAN · P-ZERODUP ║
║  Ngày kiểm toán     2026-08-04                                            ║
║  Cặp đối chiếu      ~2.100                                                ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  KẾT QUẢ KIỂM TOÁN                                                        ║
║                                                                           ║
║   🟢 Nhất quán nội bộ          149 quyết định · 0 xung đột thực chất      ║
║   🟢 ⛔ Không Capability lặp    93 L2 · ⛔ 0 trùng                          ║
║   🟢 ⛔ Không Business Object lặp 88 aggregate · mỗi cái 1 chủ sở hữu       ║
║   🟢 ⛔ Không Module chồng chéo  78 Module · MOD-1 cưỡng chế                ║
║   🟢 ⛔ Không Workflow mâu thuẫn 4 nguyên mẫu · guard là RuleRef            ║
║   🟢 ⛔ Không Permission mâu thuẫn 6 scope × 6 disclosure × 5 category      ║
║   🟢 ⛔ Không Domain sai ranh giới nguyên tắc thì-của-động-từ giải hết      ║
║   🟡 8 lỗi tài liệu             ✅ ĐÃ SỬA / ERRATA                        ║
║   🔴 5 mâu thuẫn HIẾN PHÁP      ⬜ CHỜ BOARD BAN HÀNH                     ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  🟡 TRẠNG THÁI:  FREEZE CÓ ĐIỀU KIỆN                                      ║
║                                                                           ║
║  Kiến trúc NHẤT QUÁN và SẴN SÀNG bàn giao.                                ║
║  Chứng nhận này CÓ HIỆU LỰC khi Board hoàn tất Cổng A (§5.1):             ║
║                                                                           ║
║     ⬜ A1  ADR-015  ba Business Workspace bổ sung                          ║
║     ⬜ A2  ADR-016  Executive Center ⛔ không có Domain                     ║
║     ⬜ A3  ADR-017  trang chủ hai vùng                                     ║
║     ⬜ A4  BKB v2.0 → ADOPTED                                             ║
║     ⬜ A5  ADR-011 → APPROVED                                             ║
║     ⬜ A6  Board ký chứng nhận này                                        ║
║                                                                           ║
║  ⛔ ⛔ KHÔNG mục nào đòi THIẾT KẾ LẠI. Cả sáu là HÀNH VI PHÊ CHUẨN.        ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Chief Enterprise Architect    ✅ ký · 2026-08-04                          ║
║  Architecture Board            ⬜ chờ ký                                   ║
║                                                                           ║
║  Sau khi có hiệu lực: mọi thay đổi kiến trúc đi qua §10                   ║
║  Architecture Change Procedure. ⛔ KHÔNG sửa trực tiếp bằng mã.            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

# §12 · SPRINT SUMMARY

## 12.1 Mười hạng mục Board yêu cầu

| # | Hạng mục | § |
|---|---|---|
| 1 | Architecture Freeze Certificate | §11 |
| 2 | Architecture Consistency Report | §2 |
| 3 | Decision Baseline | §3 |
| 4 | Implementation Readiness Checklist | §5 |
| 5 | Architecture Traceability Matrix | §4 |
| 6 | Project Structure Index | §6 |
| 7 | Implementation Roadmap | §7 |
| 8 | Known Limitations | §8 |
| 9 | Technical Debt Register | §9 |
| 10 | Architecture Change Procedure | §10 |

## 12.2 Ba điểm đáng nhớ nhất

| # | Điểm |
|---|---|
| **1** | 🔴 **Kiến trúc nhất quán nội bộ nhưng mâu thuẫn Hiến pháp ở BA điểm.** Board đã phê duyệt EDD-01 và EDD-05 chứa chúng — nhưng **phê duyệt một tài liệu bậc 2′ ⛔ không tự động tu chính Hiến pháp bậc 1**. Hiến pháp Điều 42 đòi ADR. Đây là **thiếu sót thủ tục**, ⛔ không phải bất đồng nội dung — và ba ADR chỉ ghi lại điều Board đã quyết |
| **2** | 🔴 **`BDR-03` bị bỏ rơi im lặng.** EDD-02 trình câu *"mở sổ chiết tính cho buyer FOB"*; Board trả lời `BDR-03` bằng một quyết định về **Customer Portal** — chủ đề của `BDR-04`. Câu hỏi gốc **chưa bao giờ được trả lời**. Thiết kế đã áp mặc định an toàn *(`INTERNAL_ONLY` cứng, ⛔ không có trường nào để mở)*, nên hệ quả bằng 0 — nhưng nó cho thấy **một câu hỏi có thể biến mất giữa hai lượt trao đổi** |
| **3** | 🔴 **Hai phát hiện bất lợi cho chính tôi phải nêu:** `C-5` — 149 quyết định ban hành dưới **ADR-011 chưa được phê duyệt**; `C-4` — mọi thiết kế nghiệp vụ đứng trên **BKB DRAFT** mà chính nó ghi *"văn bản này chưa có hiệu lực"*. **Freeze một kiến trúc xây trên nền chưa phê chuẩn là đóng băng một giả định** |

## 12.3 Đã sửa trong Sprint này

| Hành động | Tệp |
|---|---|
| Sửa *"12 phân hệ"* → **19 Business App** | `CLAUDE.md` §6 |
| Sửa *"bottom nav 4 nút"* → **5 nút** *(Hiến pháp §15)* | `CLAUDE.md` §6 |
| Thêm nhãn **ĐÃ BỊ THAY THẾ** | `TARGET_ARCHITECTURE.md` |
| 5 errata cho tài liệu đã phê duyệt | §2.7 |
| Cập nhật chỉ mục | `PROJECT_MEMORY.md` |

## 12.4 Trạng thái

```
⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor
🔴 SECURITY FREEZE giữ nguyên — chờ Board cắt vòng khoá (H-2)
🟡 ARCHITECTURE FREEZE: CÓ ĐIỀU KIỆN — chờ Cổng A
```

---

## THAM CHIẾU

- [`PROJECT_MEMORY.md`](../PROJECT_MEMORY.md) — chỉ mục toàn bộ
- [`architecture/00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) §5.4 · §13 · §16.2 · §37 · §42 · §43.7
- [`business/BUSINESS_KNOWLEDGE_BASE.md`](../business/BUSINESS_KNOWLEDGE_BASE.md) — ⏳ DRAFT
- [`adr/ADR-010`](../adr/ADR-010-thu-bac-van-ban-chuan-tac.md) · [`adr/ADR-011`](../adr/ADR-011-tham-quyen-kien-truc.md) — ⏳ chờ duyệt
- EDD-01 … EDD-05 · 149 Decision Log · 29 Board Decision
