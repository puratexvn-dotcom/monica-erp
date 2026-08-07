# MD_WORKSPACE_BLUEPRINT_V4

> **Tài liệu PRODUCT — trình Board duyệt. ⛔ Chưa code, ⛔ chưa commit.**
>
> Board Directive 07/08/2026: *"Sau khi Blueprint được Freeze mới bắt đầu
> coding."*

| Trường | Giá trị |
|---|---|
| **Trạng thái** | ⏳ **CHỜ BOARD DUYỆT** |
| **Căn cứ** | [`MD_WORKSPACE_BLUEPRINT_CURRENT.md`](MD_WORKSPACE_BLUEPRINT_CURRENT.md) *(đo hiện trạng)* · [`MD_WORKSPACE_PRODUCT_REDUCTION.md`](MD_WORKSPACE_PRODUCT_REDUCTION.md) *(quyết định cắt)* |
| **Chuẩn kế thừa** | [`WORKSPACE_DESIGN_DNA.md`](WORKSPACE_DESIGN_DNA.md) · [ADR-026](adr/ADR-026-workspace-design-dna.md) |
| **Ba tầng** | Business Identity → Daily Operation → Management |

---

## 0. 🔴 MỘT MÂU THUẪN PHẢI GIẢI TRƯỚC KHI VẼ

`MD_WORKSPACE_PRODUCT_REDUCTION.md` §4 đề xuất **MOVE** `+ Định mức` và
`+ Tech Pack` ra khỏi dải hằng ngày, lý do: *"việc đầu vòng đời mã hàng, làm 1
lần/style"*.

Chỉ thị V4 nói ngược lại:

> *"Business Launcher … ⛔ Không được bỏ. ⛔ Không được cắt. ⛔ Không được
> gộp. ⛔ Không được đưa xuống cuối."*

**Board ở bậc 0 ⇒ Board thắng.** Đề xuất MOVE kia **⛔ bị huỷ**.

🔑 Và Board **đúng vì một lý do tôi đã bỏ sót**: tôi chấm điểm theo **tần suất
bấm**, còn Board chấm theo **giá trị nhận diện**. Một Launcher đủ 10 nghiệp vụ
nói với người mua *"đây là một phòng Merchandising hoàn chỉnh"* — kể cả khi
người dùng chỉ bấm 3 ô mỗi ngày. Cắt theo tần suất là **tối ưu thao tác mà hy
sinh thương mại**.

⚠️ Nhưng mâu thuẫn đó đẻ ra **rủi ro số một của V4**: Launcher và Action Center
đứng cạnh nhau rất dễ **biến thành một**. §4.3 đặt luật chặn.

---

## 1. DESKTOP WIREFRAME — ≥ 1280 px

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [MONICA] │ Merchandising            [🔍 Tìm PO · mã hàng · khách  Ctrl K]  [🔔3] │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ╔══════════════════ TẦNG ① BUSINESS IDENTITY ══════════════════════════════╗   │
│  ║  PHÒNG MERCHANDISING                                                      ║   │
│  ║  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐            ║   │
│  ║  │ 📦 ││ 🏢 ││ 🏭 ││ 🖩  ││ 📄 ││ 📐 ││ 📥 ││ 🚢 ││ 🤝 ││ 💬 │            ║   │
│  ║  │ PO ││Khách│Nhà ││Chiết│Tech││Định││Yêu ││Giao││Gia ││Trao│            ║   │
│  ║  │    ││hàng││máy ││tính││Pack││mức ││cầu ││hàng││công││đổi │            ║   │
│  ║  │ 14 ││ 8  ││ 3  ││ 2  ││ 9  ││ 9  ││NPL ││ 1  ││ngoài│ 5  │            ║   │
│  ║  └────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘            ║   │
│  ╚═══════════════════════════════════════════════════════════════════════════╝   │
│                                                                                  │
│  ╔══════════════════ TẦNG ② DAILY OPERATION ════════════════════════════════╗   │
│  ║ ┌──────────────────────────────────────────────────────────────────────┐ ║   │
│  ║ │ 🔴 CẦN XỬ LÝ NGAY                                    6 · xem tất cả  │ ║   │
│  ║ │ ┌────────────────────┐┌────────────────────┐┌────────────────────┐  │ ║   │
│  ║ │ │⚠ PO-2601 trễ 11ng ││⚠ PO-2602 trễ 7ng  ││⚠ NPL-014 quá mốc  │  │ ║   │
│  ║ │ │       [Mở đơn ↗]   ││       [Mở đơn ↗]   ││    [Mở phiếu ↗]    │  │ ║   │
│  ║ │ └────────────────────┘└────────────────────┘└────────────────────┘  │ ║   │
│  ║ └──────────────────────────────────────────────────────────────────────┘ ║   │
│  ║                                                                          ║   │
│  ║ ┌──────────────────────────────────────────────────────────────────────┐ ║   │
│  ║ │ ⚡ BẮT ĐẦU VIỆC GÌ                                                    │ ║   │
│  ║ │ [+ Tạo PO]  [+ Khách hàng]  [+ Chiết tính]  [+ Yêu cầu NPL]          │ ║   │
│  ║ └──────────────────────────────────────────────────────────────────────┘ ║   │
│  ║                                                                          ║   │
│  ║ ┌────────────────────────────────┬─────────────────────────────────────┐ ║   │
│  ║ │ 🎯 HÔM NAY                     │ 📊 TÔI ĐANG QUẢN LÝ                 │ ║   │
│  ║ │ ① Chốt mẫu Fit PO-2603         │  14 đơn   ·   43% đúng tiến độ      │ ║   │
│  ║ │ ② Gọi buyer H&M — chờ 6 ngày   │  167 việc tới hạn                   │ ║   │
│  ║ │ ③ Duyệt chiết tính JK-W26      │  Báo cáo hôm nay  3/4 ▓▓▓░          │ ║   │
│  ║ │ ④ Booking tàu PO-2605          │  ⛔ chờ: Nhà thầu ngoài             │ ║   │
│  ║ └────────────────────────────────┴─────────────────────────────────────┘ ║   │
│  ║                                                                          ║   │
│  ║ ┌──────────────────────────────────────────────────────────────────────┐ ║   │
│  ║ │ 🧭 ĐƠN HÀNG ĐANG Ở ĐÂU?                          [lọc: đang chạy ▾]  │ ║   │
│  ║ │  PO ──▶ NPL ──▶ Sản xuất ──▶ QA ──▶ Giao hàng ──▶ Hoàn tất           │ ║   │
│  ║ │  ┌──────────────────────────────────────────────────────────────┐    │ ║   │
│  ║ │  │ [biểu đồ phân bố đơn theo chặng]                             │    │ ║   │
│  ║ │  └──────────────────────────────────────────────────────────────┘    │ ║   │
│  ║ └──────────────────────────────────────────────────────────────────────┘ ║   │
│  ║                                                                          ║   │
│  ║ ┌──────────────────────────────────────────────────────────────────────┐ ║   │
│  ║ │ 📋 PO WORKSPACE          [🔍 tìm] [lọc ▾] [sắp xếp ▾]      14 đơn    │ ║   │
│  ║ │ PO         Khách       Mã hàng   SL     Tiến độ   ETA      Việc      │ ║   │
│  ║ │ PO-2601    Uniqlo      TEE01     4.800  ▓░░░ 17%  27/07 🔴 [Mua NPL] │ ║   │
│  ║ │ PO-2602    Decathlon   POLO02    3.200  ▓░░░ 17%  31/07 🔴 [Mua NPL] │ ║   │
│  ║ │ PO-2603    H&M         SHIRT03   2.600  ▓░░░ 17%  01/08 🔴 [Mua NPL] │ ║   │
│  ║ │ PO-2604    Mango       JKT05     1.800  ▓░░░ 17%  05/08 🟡 [Mua NPL] │ ║   │
│  ║ │                                                    [Xem đủ 14 ⌄]     │ ║   │
│  ║ └──────────────────────────────────────────────────────────────────────┘ ║   │
│  ║                                                                          ║   │
│  ║ ┌──────────────────────────────────────────────────────────────────────┐ ║   │
│  ║ │ 💬 TRAO ĐỔI CÔNG VIỆC                                     3 chưa đọc │ ║   │
│  ║ │ • Buyer H&M hỏi ngày giao PO-2603          — 2 giờ trước  [Trả lời]  │ ║   │
│  ║ │ • Xưởng An Khang báo thiếu chỉ             — hôm qua      [Trả lời]  │ ║   │
│  ║ │ • QA: lô SEED-BD-01 vượt ngưỡng lỗi        — hôm qua      [Xem]      │ ║   │
│  ║ └──────────────────────────────────────────────────────────────────────┘ ║   │
│  ╚═══════════════════════════════════════════════════════════════════════════╝   │
│                                                                                  │
│  ╔══════════════════ TẦNG ③ MANAGEMENT — mặc định THU GỌN ══════════════════╗   │
│  ║  ▸ 📈 Báo cáo ngày            (chốt ca 17:00)                             ║   │
│  ║  ▸ 🕐 Dòng thời gian đơn hàng                                             ║   │
│  ║  ▸ 📊 Phân tích                                                           ║   │
│  ║  ▸ 📜 Nhật ký thao tác                                                    ║   │
│  ║  ▸ 🔔 Thông báo                                                           ║   │
│  ╚═══════════════════════════════════════════════════════════════════════════╝   │
├──────────────────────────────────────────────────────────────────────────────────┤
│  [Bàn làm việc]  [Chat]  [Báo cáo]  [A.I]  [Hướng dẫn]                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Mốc First Screen (1000 px):** Tầng ① + *Cần xử lý ngay* + *Bắt đầu việc gì* +
*Hôm nay* — **⛔ không cần cuộn**.

---

## 2. TABLET WIREFRAME — 768 – 1279 px

```
┌────────────────────────────────────────────────┐
│ [MONICA] │ Merchandising      [🔍] [🔔3]      │
├────────────────────────────────────────────────┤
│ PHÒNG MERCHANDISING                            │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐                │  ← 5 ô/hàng × 2 hàng
│ │ PO ││Khách│Nhà ││Chiết│Tech│                │    ⛔ KHÔNG cuộn ngang
│ └────┘└────┘└────┘└────┘└────┘                │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐                │
│ │Định││ NPL││Giao││Gia ││Trao│                │
│ └────┘└────┘└────┘└────┘└────┘                │
├────────────────────────────────────────────────┤
│ 🔴 CẦN XỬ LÝ NGAY                    6 · tất cả│
│ ┌──────────────────┐┌──────────────────┐      │  ← 2 cột
│ │⚠ PO-2601 trễ 11ng││⚠ PO-2602 trễ 7ng│      │
│ └──────────────────┘└──────────────────┘      │
├────────────────────────────────────────────────┤
│ ⚡ [+ Tạo PO][+ Khách][+ Chiết tính][+ NPL]    │
├────────────────────────────────────────────────┤
│ 🎯 HÔM NAY            │ 📊 TÔI ĐANG QUẢN LÝ   │  ← vẫn 2 cột
│ ① ② ③ ④              │ 14 · 43% · 167 · 3/4  │
├────────────────────────────────────────────────┤
│ 🧭 ĐƠN HÀNG ĐANG Ở ĐÂU?                        │
├────────────────────────────────────────────────┤
│ 📋 PO WORKSPACE                                │  ← bảng ẩn cột "Mã hàng"
├────────────────────────────────────────────────┤
│ 💬 TRAO ĐỔI CÔNG VIỆC                          │
├────────────────────────────────────────────────┤
│ ▸ Tầng ③ (thu gọn)                             │
└────────────────────────────────────────────────┘
```

🔑 **Tablet ⛔ KHÔNG phải "desktop thu nhỏ".** Ba cột ở 1024 px cho mỗi cột
~320 px — bảng PO buộc phải cuộn ngang. **Hai cột** là giới hạn thật.

---

## 3. MOBILE WIREFRAME — < 768 px

```
┌───────────────────────────┐
│ [MONICA] Merchandising    │
│              [🔍] [🔔3]   │
├───────────────────────────┤
│ 🔴 CẦN XỬ LÝ NGAY      6 │  ← 🔑 LÊN ĐẦU, TRƯỚC cả Launcher
│ ⚠ PO-2601 trễ 11 ngày    │
│ ⚠ PO-2602 trễ 7 ngày     │
│ ⚠ NPL-014 quá mốc        │
│ [Xem tất cả 6 ⌄]          │
├───────────────────────────┤
│ 🎯 HÔM NAY                │
│ ① Chốt mẫu Fit PO-2603   │
│ ② Gọi buyer H&M          │
│ ③ Duyệt chiết tính       │
├───────────────────────────┤
│ ⚡ BẮT ĐẦU VIỆC GÌ         │
│ ┌────────┐┌────────┐      │
│ │+ Tạo PO││+ Khách │      │
│ └────────┘└────────┘      │
│ ┌────────┐┌────────┐      │
│ │+Chiết  ││+ NPL   │      │
│ └────────┘└────────┘      │
├───────────────────────────┤
│ PHÒNG MERCHANDISING       │  ← Launcher xuống thứ 4
│ ┌───┐┌───┐┌───┐┌───┐     │    (lý do ở §7.2)
│ │PO ││Khá││Nhà││Chiế│     │
│ └───┘└───┘└───┘└───┘     │
│ ┌───┐┌───┐┌───┐┌───┐     │
│ │Tec││Địn││NPL││Giao│     │
│ └───┘└───┘└───┘└───┘     │
│ ┌───┐┌───┐                │
│ │Gia││Trao│               │
│ └───┘└───┘                │
├───────────────────────────┤
│ 🧭 ĐƠN HÀNG ĐANG Ở ĐÂU?   │
├───────────────────────────┤
│ 📋 PO WORKSPACE           │  ← thẻ, ⛔ KHÔNG bảng
│ ┌───────────────────────┐ │
│ │PO-2601  Uniqlo   🔴   │ │
│ │4.800 sp · 17% · 27/07 │ │
│ │        [Mua NPL ↗]    │ │
│ └───────────────────────┘ │
├───────────────────────────┤
│ 💬 TRAO ĐỔI            3 │
├───────────────────────────┤
│ ▸ Tầng ③ (thu gọn)        │
├───────────────────────────┤
│ [Bàn][Chat][BC][AI][HD]   │
└───────────────────────────┘
```

⚠️ **Bảng → thẻ trên điện thoại.** Bảng 7 cột ở 390 px là **cuộn ngang**, và
tổ trưởng/MD ở xưởng cầm điện thoại một tay ⛔ không cuộn ngang được.

---

## 4. TẦNG ① — BUSINESS IDENTITY

### 4.1 Mục tiêu
> *"Người dùng phải cảm thấy: **đây chính là phòng Merchandising của tôi**."*

### 4.2 Mười ô — **⛔ không cắt, ⛔ không gộp, ⛔ không đưa xuống**

| # | Ô | Mở tới | Con số trên ô |
|---|---|---|---|
| 1 | **PO** | danh sách đơn hàng | số đơn đang chạy |
| 2 | **Khách hàng** | danh mục khách | số khách |
| 3 | **Nhà máy** | năng lực · chuyền | số chuyền |
| 4 | **Chiết tính** | bảng giá thành | số bản chờ duyệt |
| 5 | **Tech Pack** | tài liệu kỹ thuật | số tài liệu |
| 6 | **Định mức / BOM** | mã hàng · định mức | số mã hàng |
| 7 | **Yêu cầu NPL** | phiếu đề nghị vật tư | số phiếu mở |
| 8 | **Giao hàng** | lịch tàu · chứng từ | số lô |
| 9 | **Gia công ngoài** | nhà thầu · giao nhận | sp còn ở ngoài |
| 10 | **Trao đổi** | thảo luận theo PO | số chưa đọc |

⚠️ **Con số trên ô là BẮT BUỘC.** Một Launcher ⛔ không số chỉ là menu. Có số
thì nó thành **bản đồ tình trạng phòng ban** — và đó mới là *identity*.

⚠️ **`V.1`:** số ⛔ đọc được ⇒ hiện **⚪**, ⛔ **KHÔNG** hiện `0`.

### 4.3 🔴 LUẬT CHỐNG TRÙNG — Launcher ⟷ Action Center

Đây là **rủi ro số một** của V4: hai dải cạnh nhau, rất dễ thành một.

| | Launcher (tầng ①) | Action Center (tầng ②) |
|---|---|---|
| **Trả lời** | *"phòng tôi có những gì"* | *"tôi tạo cái gì bây giờ"* |
| **Từ loại** | **DANH TỪ** — PO · Khách hàng · Chiết tính | **ĐỘNG TỪ** — + Tạo PO · + Khách hàng |
| **Bấm vào ra gì** | **danh sách** của nghiệp vụ đó | **biểu mẫu tạo mới** |
| **Số lượng** | **10 · cố định** | **≤ 4 · đổi theo vai** |
| **Có con số** | ✅ bắt buộc | ⛔ không bao giờ |

🔑 **Phép thử một câu:** *nếu đổi nhãn ô Launcher thành "+ Tạo …" mà vẫn đúng
⇒ nó đang lấn sang Action Center.*

---

## 5. TẦNG ② — DAILY OPERATION

Thứ tự **⛔ không được đảo** *(Board)*:

```
① CẦN XỬ LÝ NGAY  →  ② ACTION CENTER  →  ③ TODAY
→  ④ ORDER JOURNEY  →  ⑤ PO WORKSPACE  →  ⑥ WORK COMMUNICATION
```

| Khối | Nội dung | Trần mặc định | Action |
|---|---|---|---|
| ① **Cần xử lý ngay** | rủi ro hệ thống phát hiện | **3 thẻ** + *"xem tất cả"* | nút mỗi thẻ |
| ② **Bắt đầu việc gì** | **4** nút tạo | — | 4 |
| ③ **Hôm nay** | 3–4 việc MD phải chốt **+ Tôi đang quản lý** | 4 dòng | *Mở* mỗi dòng |
| ④ **Đơn hàng đang ở đâu** | 6 chặng + biểu đồ phân bố | 1 biểu đồ | lọc · bấm chặng |
| ⑤ **PO Workspace** | bảng PO + **tìm · lọc · sắp xếp** | **4 dòng** | *Việc kế tiếp* |
| ⑥ **Trao đổi công việc** | tin nhắn theo PO | **3 dòng** | *Trả lời* |

### 5.1 ⚠️ Ba thay đổi so với hiện trạng — nói rõ để ⛔ không ai tưởng là bug

1. **`Cần xử lý ngay` từ 170 mục → 6.** Hiện đang đổ cả 167 mốc T&A quá hạn
   vào đây. **Mốc T&A là VIỆC, ⛔ không phải RỦI RO** — nó thuộc *Hôm nay* và
   *Hộp thư việc*. Rủi ro chỉ gồm: trễ giao · thiếu NPL · chờ khách quá hạn ·
   nhà thầu ⛔ không phản hồi · lô vượt ngưỡng lỗi.
2. **`Hộp thư việc` biến mất khỏi tầng ②** — phần khẩn lên *Hôm nay*, phần còn
   lại vào tầng ③ *(Dòng thời gian)*. MD ⛔ không đọc 167 dòng lúc 08:00.
3. **`Trao đổi công việc` là khối MỚI.** Hiện `Thảo luận` nằm trong 13 tab, tức
   MD phải **nhớ mà vào**. Buyer hỏi mà 6 tiếng sau mới trả lời là **mất đơn**,
   ⛔ không phải chậm.

### 5.2 🔴 Khuyết tật tiếp cận PHẢI vá trong V4
Blueprint hiện trạng §6.8 đo được `role="alert"` = **0** dù có 170 mục rủi ro.
⇒ V4: khối ① mang `role="alert"`, mỗi thẻ có `aria-label` đủ nghĩa.
**⛔ Không đưa vào Freeze Checklist như "nên có" — đây là điều kiện.**

---

## 6. TẦNG ③ — MANAGEMENT

Năm khối, **mặc định thu gọn**, ⛔ **không** chiếm First Screen.

| Khối | Câu trả lời | Ai mở |
|---|---|---|
| **Báo cáo ngày** | *"chốt ca hôm nay ra sao"* | MD lúc 17:00 |
| **Dòng thời gian đơn hàng** | *"đơn này đã đi qua những gì"* | khi truy vết |
| **Phân tích** | *"tháng này so tháng trước"* | cuối tuần / cuối tháng |
| **Nhật ký thao tác** | *"ai vừa đổi gì"* | khi nghi ngờ |
| **Thông báo** | *"có gì mới"* | khi có chấm đỏ |

⚠️ **Thu gọn ⛔ KHÔNG phải ẩn.** Tiêu đề + con số **luôn hiện**; chỉ nội dung
mới gấp. Một khối ẩn hẳn là một khối **⛔ không ai biết là có**.

---

## 7. PRODUCT DNA — Board hỏi bốn câu, đây là bốn câu trả lời

### 7.1 Tại sao **Business Launcher** luôn đứng đầu?

**⛔ Không phải vì nó được bấm nhiều nhất** — đo thật thì MD chỉ bấm 3/10 ô mỗi
ngày.

Nó đứng đầu vì nó trả lời câu hỏi **trước** mọi câu hỏi khác: ***"tôi đang ở
đâu?"***. Một màn hình mở ra bằng danh sách rủi ro mà ⛔ không nói mình là
phòng nào thì người dùng mới **⛔ không biết mình đang ở đâu trong doanh
nghiệp** — và người mua ⛔ không thấy sản phẩm bao phủ được nghiệp vụ nào.

🔑 **Định danh là hạ tầng của mọi thứ bên dưới nó.** Rủi ro, việc hôm nay, đơn
hàng — tất cả chỉ có nghĩa **sau khi** biết đây là phòng Merchandising.

### 7.2 Vậy tại sao trên **ĐIỆN THOẠI** Launcher lại xuống thứ 4?

Vì trên điện thoại, **định danh đã có ở thanh trên** *(logo + chữ
"Merchandising")* — nó ⛔ không cần lặp lại bằng một lưới 10 ô cao 400 px đẩy
mọi thứ khác ra khỏi màn hình đầu.

🔑 Máy bàn: định danh **và** rủi ro cùng nhìn thấy ⇒ định danh lên trước.
Điện thoại: **chỉ một thứ** vừa màn hình ⇒ chọn thứ **cứu được đơn hàng**.
Đây ⛔ không phải mâu thuẫn — đây là **cùng một nguyên tắc, khác ràng buộc**.

### 7.3 Tại sao **Journey** đứng giữa?

Journey là **bản lề** giữa *"có vấn đề gì"* và *"làm gì với nó"*.

- Đứng **trên** Risk ⇒ MD nhìn dòng chảy trước khi biết chỗ nào cháy — **xem
  tranh trước khi biết nhà đang cháy**.
- Đứng **dưới** PO Workspace ⇒ MD đọc 14 dòng bảng rồi mới thấy bức tranh —
  tức **phải tự ghép bức tranh trong đầu**, đúng việc phần mềm nên làm hộ.

🔑 Journey ở giữa vì nó **biến danh sách thành câu chuyện**, và câu chuyện phải
đến **trước** chi tiết.

### 7.4 Tại sao **Report** ở cuối?

Vì báo cáo là **bằng chứng của việc đã làm**, ⛔ không phải **đầu vào của việc
sắp làm**.

MD lúc 08:00 ⛔ không cần biết hôm qua đạt bao nhiêu phần trăm — họ cần biết
**hôm nay đơn nào cháy**. Đặt Report lên đầu là biến Command Center thành
Dashboard, và Board đã bác điều đó ba lần.

⚠️ Report ⛔ **không kém quan trọng** — nó chỉ **thôi đứng chắn**. Lúc 17:00 nó
là khối quan trọng nhất màn hình.

### 7.5 Tại sao **Timeline ⛔ KHÔNG được chen vào Today?**

Vì hai khối trả lời **hai thì khác nhau**:

```
TODAY     →  thì TƯƠNG LAI GẦN   →  "tôi SẼ làm gì"   →  hành động
TIMELINE  →  thì QUÁ KHỨ         →  "đã xảy ra gì"    →  đọc hiểu
```

Trộn chúng buộc mắt **đổi thì liên tục** giữa các dòng cạnh nhau. Đó là loại
mệt mà người dùng ⛔ không gọi tên được — họ chỉ thấy *"màn hình này rối"*.

🔑 Và có một hậu quả cụ thể: một dòng quá khứ nằm trong danh sách việc **⛔
không tick được**, nên danh sách việc **⛔ không bao giờ về 0**. Cảm giác hoàn
thành bị phá bởi đúng những dòng ⛔ không thuộc về đó.

---

## 8. WORKFLOW — một ngày của Merchandiser

| Giờ | MD làm gì | Khối phục vụ | Bằng chứng đủ |
|---|---|---|---|
| **08:00** | *"Đêm qua có gì cháy?"* | ① **Cần xử lý ngay** | ⛔ không cuộn · ≤ 3 thẻ · mỗi thẻ 1 nút |
| **08:30** | *"Hôm nay chốt gì?"* | ③ **Hôm nay** | 3–4 việc · ⛔ không lặp khối ① |
| **09:30** | Tạo PO · duyệt chiết tính · gửi mẫu | ② **Bắt đầu việc gì** + ① Launcher | 1 cú bấm tới biểu mẫu |
| **13:30** | *"NPL về chưa? Chuyền chạy chưa?"* | ④ **Journey** + ① ô *Yêu cầu NPL* | thấy chặng đang nghẽn |
| **15:00** | Trả lời buyer · theo nhà thầu | ⑥ **Trao đổi công việc** | ⛔ không phải vào tab mới thấy |
| **17:00** | Chốt số, gửi giám đốc | ③ **Báo cáo ngày** *(tầng ③)* | biết **ai chưa gửi số** |

✅ **Sáu mốc — sáu khối. ⛔ Không mốc nào thiếu chỗ dựa, ⛔ không khối nào thừa.**

---

## 9. ATTENTION FLOW

### Máy bàn
```
① Launcher (10 ô có số)   ← 0,0–0,5 s  "tôi đang ở phòng Merchandising"
② Khối ĐỎ Cần xử lý ngay  ← 0,5–1,5 s  "có 6 thứ đang cháy"
③ Dải nút xanh dương      ← 1,5–2,0 s  "tôi bắt đầu ở đây"
④ Hôm nay + đang quản lý  ← 2,0–3,0 s  "hôm nay chốt 4 việc"
⑤ Journey                 ← khi cuộn
```
✅ **Ba giây — bốn câu hỏi Board đặt ra đều có câu trả lời.**

### 🔑 Ba luật giữ luồng mắt ⛔ không vỡ

1. **Chỉ MỘT khối màu đỏ trên màn hình đầu.** Đỏ thứ hai làm đỏ thứ nhất mất
   nghĩa.
2. **Launcher dùng sắc TRUNG TÍNH.** Nó là *nền*, ⛔ không phải *báo động*. Tô
   màu 10 ô sẽ đánh bại chính khối rủi ro ngay bên dưới — **lỗi đang có ở V2**,
   khi 6 thẻ xanh dương hút mắt khỏi khối đỏ.
3. **⛔ KHÔNG có khối nào ở tầng ② lặp lại nội dung khối phía trên nó.**

---

## 10. COMMERCIAL VALUE — *"tại sao mua MONICA ONE thay vì ERP khác?"*

| Điều người mua thấy trong 30 giây | ERP truyền thống | MONICA ONE V4 |
|---|---|---|
| Mở lên thấy gì trước | menu · dashboard số liệu | **10 ô nghiệp vụ có số + việc đang cháy** |
| *"Đơn hàng đang ở đâu?"* | ⛔ tự ghép từ 4 báo cáo | **một dòng chảy 6 chặng** |
| Rủi ro | **giấu trong báo cáo** | **đưa lên đầu, mỗi dòng một nút** |
| *"Hôm nay làm gì?"* | ⛔ không trả lời | **3–4 việc, ⛔ không cuộn** |
| Trao đổi với buyer | email ngoài hệ thống | **gắn vào PO, đếm chưa đọc** |
| Học mất bao lâu | mỗi module một kiểu | **một DNA cho 13 Workspace** |

### Ba câu bán hàng, mỗi câu có **bằng chứng trên màn hình**

1. **"Mở lên là biết phải làm gì"** — ⛔ không phải *"mở lên là thấy dữ liệu"*.
   Bằng chứng: khối ① và ③ nằm trong First Screen.
2. **"Đơn hàng ⛔ không bao giờ mất dấu"** — Journey 6 chặng.
   🔑 **Đây là thứ ⛔ không ERP phổ thông nào có**, và là lý do đáng trả tiền.
3. **"Học một lần, dùng cả hệ thống"** — ADR-026: 13 Workspace **một DNA**.

### ⚠️ Vì sao ⛔ KHÔNG hy sinh Identity để giảm Widget
Product Reduction §4 từng đề xuất bỏ 2 ô ít bấm. Nhìn theo **thao tác** thì
đúng; nhìn theo **thương mại** thì sai: người mua đếm **độ phủ nghiệp vụ**,
⛔ không đếm số lần bấm. Một Launcher 8 ô trông như *"phần mềm làm được 8
việc"*, dù người dùng chỉ bấm 3.

---

## 11. FREEZE CHECKLIST

Blueprint được Freeze khi **tất cả** ✅:

| # | Điều kiện | Đo bằng |
|---|---|---|
| 1 | Launcher **10 ô**, luôn trên cùng ở máy bàn/tablet | đếm DOM |
| 2 | Mỗi ô Launcher có **con số**; ⛔ đọc được ⇒ `⚪` ⛔ không phải `0` | đọc DOM |
| 3 | Thứ tự tầng ② **đúng 6 khối**, ⛔ không đảo | toạ độ `y` |
| 4 | `Cần xử lý ngay` **≤ 3 thẻ** mặc định | đếm DOM |
| 5 | 🔴 Khối ① mang `role="alert"` | `querySelectorAll('[role=alert]')` ≥ 1 |
| 6 | First Screen 1000 px chứa đủ **Launcher + Risk + Action + Today** | `getBoundingClientRect` |
| 7 | Tầng ③ **mặc định thu gọn**, tiêu đề + số vẫn hiện | ảnh chụp |
| 8 | Mỗi mã PO xuất hiện **≤ 3 lần** trên một màn hình | đếm chuỗi |
| 9 | **⛔ Không khối nào trùng TÊN** với khối khác | so tiêu đề |
| 10 | Nút trên First Screen **≤ 40** | đếm DOM |
| 11 | Điện thoại 390 px: **⛔ không tràn ngang**, PO là **thẻ** ⛔ không phải bảng | CDP |
| 12 | Tablet 1024 px: **≤ 2 cột**, bảng ⛔ không cuộn ngang | CDP |
| 13 | Launcher dùng **sắc trung tính**; chỉ **một** khối đỏ ở First Screen | ảnh chụp |
| 14 | `role="alert"` ⛔ không dùng cho khối ⛔ không phải rủi ro | đọc DOM |

---

## 12. ĐIỀU BLUEPRINT NÀY ⛔ KHÔNG KHẲNG ĐỊNH

- ⛔ **Chưa hỏi MD thật.** Workflow §8 dựng từ quy trình ngành may + dữ liệu
  CSDL, ⛔ không phải phỏng vấn. Một buổi ngồi cạnh MD có thể lật vài dòng.
- ⛔ **Chưa biết `Nhà máy` và `Trao đổi` lấy dữ liệu ở đâu.** Hai ô Launcher
  này Board liệt kê, nhưng kho **⛔ chưa có** nguồn cho *"số chuyền"* và *"số
  tin chưa đọc"*. Cần Board xác nhận nguồn — hoặc chấp nhận `⚪` cho tới khi có.
- ⛔ **Chưa đo chi phí render** của Launcher 10 ô có số: mỗi con số là **một
  truy vấn**. Nếu làm sai sẽ lặp lại đúng lỗi TTFB 901 ms vừa sửa ⇒ V4 **phải**
  gom chúng vào **một** lời gọi máy chủ.
- ⛔ **Không** khẳng định 6 khối tầng ② là con số cuối. Nó là **con số Board
  ấn định**, và tài liệu này thi hành.
