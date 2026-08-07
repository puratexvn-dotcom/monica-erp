# MD_WORKSPACE_BLUEPRINT_CURRENT

> **Product Audit — ảnh chụp trạng thái, ⛔ KHÔNG phải đề xuất.**
>
> Board Directive 07/08/2026: *"Vẽ lại CHÍNH XÁC giao diện hiện tại. ⛔ Không
> đề xuất. ⛔ Không tối ưu. ⛔ Không redesign. Chỉ mô tả đúng những gì đang
> tồn tại."*

| Trường | Giá trị |
|---|---|
| **Đối tượng** | `/md` — Merchandising Workspace |
| **Commit đo** | `1c03d83d` *(MD V2 Final)* |
| **Ngày đo** | 07/08/2026 |
| **Phiên đo** | `md001` — vai `md`, dữ liệu **thật** trong CSDL đang chạy |
| **Cách đo** | Đọc **DOM đang chạy** qua CDP. ⛔ **KHÔNG** đọc mã nguồn rồi suy ra — mã nói *ý định*, DOM nói *sự thật* |
| **Khổ máy bàn** | 1500 × 1000 px · **chiều cao trang 4.498 px** |
| **Khổ điện thoại** | 390 × 844 px *(giả lập CDP)* · **chiều cao trang 8.434 px** · ⛔ không tràn ngang |

---

## 1. WIREFRAME — DESKTOP (1500 px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [MONICA]│ Merchandiser Command Center          [🔍 Tìm PO…  Ctrl K]   [🔔]  │ ← thanh trên (ngoài Workspace)
│         │ ĐÚNG · ĐỦ · ĐỀU • TẬN TÂM & TRÁCH NHIỆM                            │
├──────────────────────────────────────────────────────────────────────────────┤
│  BẮT ĐẦU VIỆC GÌ?                                          y=97   cao 150px  │
│  ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐                │
│  │+Tạo PO ││+Khách  ││+Chiết  ││+Định   ││+Tech   ││+Yêu cầu│  ← 6 thẻ xanh  │
│  │ 🗎      ││ 👤+    ││ 🖩      ││ 👕     ││ 📄     ││  📦    │     dương     │
│  └────────┘└────────┘└────────┘└────────┘└────────┘└────────┘                │
├─────────────────┬──────────────────────────────┬─────────────────────────────┤
│ CỘT TRÁI 293px  │ CỘT GIỮA 606px               │ CỘT PHẢI 293px              │
│ "Công việc      │ "Khu làm việc chính"         │ "Cần xử lý ngay"            │
│  của tôi"       │                              │                             │
│ y=267 cao 2087  │ y=267 cao 2087               │ y=267 cao 2087              │
│                 │                              │                             │
│ ┌─────┐┌─────┐  │ ┌──────────────────────────┐ │  CẦN XỬ LÝ NGAY   170 mục   │
│ │ĐƠN  ││ĐÚNG │  │ │ ĐƠN HÀNG ĐANG Ở ĐÂU?     │ │  ┌────────────────────────┐ │
│ │ĐANG ││TIẾN │  │ │  ┌────────────────────┐  │ │  │⚠ DEMO-PO-2601 quá hạn │ │
│ │QUẢN │││ĐỘ   │  │ │  │  [biểu đồ cột]     │  │ │  │  Trễ 11 ngày           │ │
│ │ 14  ││ 43% │  │ │  │  6 chặng           │  │ │  │       [Mở đơn hàng ↗]  │ │
│ │Mở → ││Xem →│  │ │  └────────────────────┘  │ │  └────────────────────────┘ │
│ └─────┘└─────┘  │ │  ┌────────────────────┐  │ │  ┌────────────────────────┐ │
│ ┌─────┐┌─────┐  │ │  │ bảng: PO·Khách·    │  │ │  │⚠ DEMO-PO-2602 quá hạn │ │
│ │CẦN  ││TRỄ  │  │ │  │ Sức khoẻ·Tiến độ·  │  │ │  └────────────────────────┘ │
│ │ĐỂ   ││GIAO │  │ │  │ Hành trình·Việc    │  │ │  ┌────────────────────────┐ │
│ │MẮT 2││  6  │  │ │  └────────────────────┘  │ │  │⚠ DEMO-PO-2603 quá hạn │ │
│ │Xem →││Xử → │  │ │  [Xem đủ 14 đơn ⌄]       │ │  └────────────────────────┘ │
│ └─────┘└─────┘  │ └──────────────────────────┘ │  ┌────────────────────────┐ │
│ ┌────────────┐  │ ┌──────────────────────────┐ │  │⚠ DEMO-PO-2604 quá hạn │ │
│ │VIỆC HÔM NAY│  │ │ 🏭 Đơn hàng đang chạy 14 │ │  └────────────────────────┘ │
│ │    167     │  │ │  DEMO-PO-2601 15 mốc trễ │ │  …và 166 mục nữa            │
│ │khẩn: quá   │  │ │  ▓░░░░░ 0%  0/4.800      │ │                             │
│ │hạn 131ngày │  │ │  DEMO-PO-2602 15 mốc trễ │ │                             │
│ │Mở tiêu điểm│  │ │  DEMO-PO-2603 …          │ │                             │
│ └────────────┘  │ │  DEMO-PO-2604 …          │ │                             │
│ ┌────────────┐  │ └──────────────────────────┘ │                             │
│ │✨ Hôm nay   │  │ ┌──────────────────────────┐ │                             │
│ │xưởng đã làm│  │ │ Danh sách PO      14 đơn │ │                             │
│ │Nội bộ 985sp│  │ │  [bảng PO đầy đủ]        │ │                             │
│ │Gia công ⚪  │  │ │  [Xem đủ 14 PO ⌄]        │ │                             │
│ │Lỗi 2,7 %   │  │ └──────────────────────────┘ │                             │
│ └────────────┘  │                              │                             │
│ ┌────────────┐  │                              │                             │
│ │🎯 Hôm nay   │  │                              │                             │
│ │cần chốt    │  │                              │                             │
│ │① PO-2601   │  │                              │                             │
│ │② PO-2602   │  │                              │                             │
│ │③ PO-2603   │  │                              │                             │
│ │④ Nhắc thầu │  │                              │                             │
│ │⑤ PO-2604   │  │                              │                             │
│ └────────────┘  │                              │                             │
│ ┌────────────┐  │                              │                             │
│ │Báo cáo hôm │  │                              │                             │
│ │nay   3 / 4 │  │                              │                             │
│ │▓▓▓░ 75%    │  │                              │                             │
│ │Chờ: Nhà    │  │                              │                             │
│ │thầu ngoài  │  │                              │                             │
│ └────────────┘  │                              │                             │
│ ┌────────────┐  │                              │                             │
│ │Hộp thư việc│  │                              │                             │
│ │ Trễ mốc …  │  │                              │                             │
│ │ (167 việc) │  │                              │                             │
│ └────────────┘  │                              │                             │
│ ┌────────────┐  │                              │                             │
│ │🕐 Hoạt động │  │                              │                             │
│ │gần đây     │  │                              │                             │
│ │[Nạp nhật ký]│ │                              │                             │
│ └────────────┘  │                              │                             │
├─────────────────┴──────────────────────────────┴─────────────────────────────┤
│  BÁO CÁO NGÀY 07/08/2026            (dưới ba cột, full ngang)                │
│  [biểu đồ cột]  [Nội bộ 985][Đạt KH ⚪][Gia công ⚪][Lỗi 2,7%]                │
├──────────────────────────────────────────────────────────────────────────────┤
│  ── THANH 13 TAB ──                                                          │
│  THƯƠNG MẠI  [Khách hàng][Yêu cầu báo giá][Chiết tính giá]                   │
│  TRIỂN KHAI  [Mã hàng 9][Đơn hàng (PO) 14][Vật tư][Sản xuất][Giao hàng 1]    │
│  PHỐI HỢP    [Tài liệu][Thảo luận][Yêu cầu thay đổi][Rủi ro][Nhật ký]        │
│  [Phần việc giao đối tác ↗]                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  ĐƠN HÀNG (PO)                                     [Tải lại] [+ Tạo PO]      │
│   "Hành trình đơn hàng và danh sách PO nằm ở cột giữa phía trên."             │
├──────────────────────────────────────────────────────────────────────────────┤
│  TỔNG QUAN ĐIỀU HÀNH          y=3098  cao 321   ← KHỐI CỦA KHUNG WorkspaceShell│
│  [4 ô KPI]                                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  BIỂU ĐỒ PHÂN TÍCH            y=3442  cao 677                                │
│  [SL giao theo tháng] [Số đơn theo tháng] [Mốc T&A trễ] [Tiến độ NPL]        │
│  [Phân bố mức rủi ro]                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  Lịch & mốc sắp tới        SẮP CÓ   (khối thiết kế xong, ⛔ chưa có bảng)     │
│  Hoạt động gần đây         SẮP CÓ   (khối thiết kế xong, ⛔ chưa có bảng)     │
├──────────────────────────────────────────────────────────────────────────────┤
│  [Bàn làm việc] [Chat] [Báo cáo] [A.I] [Hướng dẫn]      ← thanh dưới cố định │
└──────────────────────────────────────────────────────────────────────────────┘
                                                        TỔNG CHIỀU CAO 4.498 px
```

---

## 2. WIREFRAME — MOBILE (390 px)

```
┌───────────────────────────┐
│ [MONICA] Merchandiser Co…│
│         [🔍] [🔔]         │
├───────────────────────────┤
│ BẮT ĐẦU VIỆC GÌ?  y=81    │
│ ┌────────┐ ┌────────┐     │
│ │+Tạo PO │ │+Khách  │     │  2 cột
│ └────────┘ └────────┘     │
│ ┌────────┐ ┌────────┐     │
│ │+Chiết  │ │+Định   │     │
│ └────────┘ └────────┘     │
│ ┌────────┐ ┌────────┐     │
│ │+Tech   │ │+Yêu cầu│     │
│ └────────┘ └────────┘     │
├───────────────────────────┤
│ CẦN XỬ LÝ NGAY   y=525    │ ← 🔴 LÊN TRƯỚC "Công việc của tôi"
│ ⚠ DEMO-PO-2601 quá hạn   │    (order-1, ngược thứ tự máy bàn)
│ ⚠ DEMO-PO-2602 quá hạn   │
│ ⚠ DEMO-PO-2603 quá hạn   │
│ ⚠ DEMO-PO-2604 quá hạn   │
│ …và 166 mục nữa           │
├───────────────────────────┤
│ CÔNG VIỆC CỦA TÔI y=996   │
│ ┌──────┐ ┌──────┐         │
│ │ĐƠN 14│ │ĐÚNG  │         │
│ │      │ │43%   │         │
│ └──────┘ └──────┘         │
│ ┌──────┐ ┌──────┐         │
│ │CẦN 2 │ │TRỄ 6 │         │
│ └──────┘ └──────┘         │
│ ┌────────────────┐        │
│ │VIỆC HÔM NAY 167│        │
│ └────────────────┘        │
│ ✨ Hôm nay xưởng đã làm    │
├───────────────────────────┤
│ 🎯 Hôm nay cần chốt y=1589│
│ ① ② ③ ④ ⑤                 │
│ Báo cáo hôm nay 3/4       │
├───────────────────────────┤
│ Hộp thư việc      y=2167  │
├───────────────────────────┤
│ 🕐 Hoạt động gần đây       │
├───────────────────────────┤
│ KHU LÀM VIỆC CHÍNH y=3011 │
│ ĐƠN HÀNG ĐANG Ở ĐÂU?      │
│ [biểu đồ]  [bảng]         │
│ Đơn hàng đang chạy y=3479 │
│ Danh sách PO              │
├───────────────────────────┤
│ BÁO CÁO NGÀY              │
├───────────────────────────┤
│ 13 TAB (xuống dòng)       │
├───────────────────────────┤
│ TỔNG QUAN ĐIỀU HÀNH y=5478│
├───────────────────────────┤
│ BIỂU ĐỒ PHÂN TÍCH  y=6407 │
├───────────────────────────┤
│ SẮP CÓ ×2                 │
├───────────────────────────┤
│ [thanh dưới 5 nút]        │
└───────────────────────────┘
      TỔNG CHIỀU CAO 8.434 px
```

---

## 3. DANH SÁCH SECTION — theo thứ tự dọc, đo bằng `getBoundingClientRect`

| # | y (px) | Cao | Tên | Mục đích | Dữ liệu hiển thị | Action? | Trùng với |
|---|---|---|---|---|---|---|---|
| 1 | 97 | 150 | **Action Center** | Bắt đầu một việc | 6 thẻ tĩnh | ✅ 6 nút | `#12` nút **+ Tạo PO** |
| 2 | 267 | 638 | **Tổng quan điều hành** *(cột trái)* | Chỉ số cá nhân | 5 ô: 14 · 43% · 2 · 6 · 167 | ✅ 5 lối đi | `#13` khối cùng tên · `#7` cùng đếm PO |
| 3 | 267 | 535 | **Khu rủi ro** *(cột phải)* | Vấn đề đang cháy | 4/170 mục | ✅ nút mỗi dòng | `#5` `#7` `#9` cùng PO |
| 4 | 267 | 2087 | **Khu làm việc chính** *(cột giữa)* | Bao ngoài | — | ⛔ | — |
| 5 | 267 | ~700 | **Đơn hàng đang ở đâu?** | Dòng chảy đơn | 1 biểu đồ + bảng 14 đơn | ✅ *Việc kế tiếp* | `#7` `#9` cùng 14 PO |
| 6 | 735 | 623 | **Đơn hàng đang chạy** | PO cần chạm | 14 đơn · mốc trễ · % | ✅ mở PO | `#5` `#9` cùng 14 PO |
| 7 | 925 | 586 | **Tiêu điểm hôm nay** | 3–5 việc chốt hôm nay | 5 dòng | ✅ *Mở* | `#3` — 4/5 dòng **lấy từ Risk** |
| 8 | ~1500 | — | **Báo cáo hôm nay** | Tiến độ gom báo cáo | 3/4 nguồn | ⛔ | `#11` cùng 4 chỉ số |
| 9 | 1530 | 703 | **Hộp thư việc** | Toàn bộ việc | 167 việc | ✅ *Xử lý* | `#3` `#7` cùng mốc trễ |
| 10 | ~2200 | — | **Hoạt động gần đây** | Nhật ký | ⛔ chưa nạp | ✅ *Nạp nhật ký* | `#19` khối **SẮP CÓ** cùng tên |
| 11 | ~2700 | — | **Báo cáo ngày** | Số liệu ngày | 1 biểu đồ + 4 thẻ | ⛔ | `#8` cùng 4 chỉ số |
| 12 | ~2900 | — | **Thanh 13 tab + Card PO** | Điều hướng | 13 tab · 1 dòng chỉ đường | ✅ 15 nút | `#1` nút **+ Tạo PO** |
| 13 | 3098 | 321 | **Tổng quan điều hành** *(khung)* | KPI của `WorkspaceShell` | 4 ô KPI | — | `#2` **cùng tên, khác số** |
| 14 | 3442 | 677 | **Biểu đồ phân tích** | Phân tích tháng | **3 biểu đồ recharts** *(SL giao/tháng · Số đơn/tháng · Mốc T&A trễ)* + **2 khối ⛔ KHÔNG phải biểu đồ** *(Tiến độ NPL · Phân bố mức rủi ro — chỉ là tiêu đề + thanh/nhãn)* | ⛔ | `#9` mốc T&A · `#3` mức rủi ro |
| 15 | — | — | **Lịch & mốc sắp tới** | ⛔ chưa có bảng | `SẮP CÓ` | ⛔ | — |
| 16 | — | — | **Hoạt động gần đây** *(SẮP CÓ)* | ⛔ chưa có bảng | `SẮP CÓ` | ⛔ | `#10` **cùng tên** |

---

## 4. DUPLICATE MATRIX

> Đo bằng cách đếm **số lần một chuỗi xuất hiện trong `document.innerText`** của
> **một** lần tải trang. ⛔ Không suy đoán.

### 4.1 Cùng một mã PO xuất hiện mấy lần trên MỘT màn hình

| Mã PO | Số lần | Xuất hiện ở |
|---|---|---|
| `DEMO-PO-2601` | **7** | Risk · Tiêu điểm · Hành trình · Đơn đang chạy · Danh sách PO · Hộp thư việc ×2 |
| `DEMO-PO-2602` | **7** | như trên |
| `DEMO-PO-2603` | **6** | Risk · Tiêu điểm · Hành trình · Đơn đang chạy · Danh sách PO · Hộp thư |
| `DEMO-PO-2604` | **6** | như trên |
| `DEMO-PO-2605` | **4** | Risk · Hành trình · Đơn đang chạy · Danh sách PO |
| `DEMO-PO-2606` | **4** | như trên |
| `SEED-PO-0001` | 2 | Hành trình · Danh sách PO |
| `PO-M2601` | 2 | Hành trình · Danh sách PO |

### 4.2 Ma trận trùng theo cặp Section

| A | ↔ | B | Trùng cái gì |
|---|---|---|---|
| Tiêu điểm hôm nay | ↔ | Cần xử lý ngay | **4/5 dòng giống hệt** — cùng nguồn `canhBao` |
| Cần xử lý ngay | ↔ | Hộp thư việc | 166 mục bị cắt ở Risk **nằm nguyên** trong Hộp thư |
| Đơn hàng đang ở đâu? | ↔ | Đơn hàng đang chạy | **cùng 14 PO**, khác cách bày |
| Đơn hàng đang ở đâu? | ↔ | Danh sách PO | **cùng 14 PO**, khác cột |
| Đơn hàng đang chạy | ↔ | Danh sách PO | **cùng 14 PO**, khác cột |
| Báo cáo hôm nay (3/4) | ↔ | Báo cáo ngày | **cùng 4 chỉ số** — một bên đếm nguồn, một bên bày số |
| Tổng quan điều hành *(cột trái)* | ↔ | Tổng quan điều hành *(khung)* | **CÙNG TÊN**, khác bộ số — 5 ô ⟷ 4 ô |
| Hoạt động gần đây *(cột trái)* | ↔ | Hoạt động gần đây *(SẮP CÓ)* | **CÙNG TÊN**, một cái nạp được, một cái ⛔ chưa có bảng |
| Action Center | ↔ | Card PO | nút **+ Tạo PO** ở cả hai |
| Biểu đồ phân tích *(Mốc T&A trễ)* | ↔ | Hộp thư việc | cùng đếm mốc trễ |
| Biểu đồ phân tích *(Phân bố rủi ro)* | ↔ | Cần xử lý ngay | cùng tập rủi ro |

**Tổng: 11 cặp trùng.**

---

## 5. THỐNG KÊ — đếm trên DOM đang chạy

| Hạng mục | Số lượng |
|---|---|
| **Section** *(`<section aria-label>`)* | **11** *(+1 vùng thông báo)* |
| **Card / Box** *(khối có viền, đếm tay theo wireframe)* | **19** |
| **Button** | **99** |
| **Link** *(`<a href>`)* | **17** |
| **Chart** *(`.recharts-wrapper`)* | **5** — đã cuộn hết trang rồi đếm lại, ⛔ không phải 10 |
| **Table** *(`<table>`)* | **2** |
| **Form** | **0** *(biểu mẫu nằm trong hộp thoại)* |
| **Input / Select** | **1** *(ô tìm kiếm)* |
| **Progress bar** | **1** |
| **`role="status"`** | **5** |
| **`role="alert"`** | **0** |
| **`<h2>` / `<h3>`** | **14** / **6** |
| **`<li>`** | **28** |
| **Khối `SẮP CÓ`** | **2** |
| **Chiều cao — máy bàn** | **4.498 px** *(4,5 màn hình 1000px)* |
| **Chiều cao — điện thoại** | **8.434 px** *(10 màn hình 844px)* |
| **Số lần lặp dữ liệu nhiều nhất** | **7 lần** cho một mã PO |

---

### 5b. Năm biểu đồ — vị trí chính xác

| y (px) | Thuộc khối |
|---|---|
| 326 | Đơn hàng đang ở đâu? *(phân bố đơn theo chặng)* |
| 2.424 | Báo cáo ngày |
| 3.534 | Số lượng giao theo tháng |
| 3.534 | Số đơn giao theo tháng |
| 3.862 | Mốc T&A trễ theo bộ phận |

⚠️ **Tôi đếm sai một lần.** Bản nháp đầu ghi *"5 hiện + 5 nữa = 10"* vì suy từ
**số tiêu đề**. Cuộn hết trang rồi đếm `.recharts-wrapper` thì chỉ có **5** —
hai khối *Tiến độ nguyên phụ liệu* và *Phân bố mức rủi ro* có tiêu đề nhưng ⛔
**không phải biểu đồ**. Ghi lại để ⛔ không ai kế thừa con số sai.

---

## 6. QUAN SÁT — ⛔ KHÔNG phải đề xuất

Ghi lại **sự kiện đo được**, để V4 quyết định. ⛔ Tài liệu này ⛔ không đề nghị
sửa gì.

1. **Bốn khu cùng bày 14 PO**: *Đơn hàng đang ở đâu?* · *Đơn hàng đang chạy* ·
   *Danh sách PO* · *Hộp thư việc*.
2. **Hai Section trùng tên** *"Tổng quan điều hành"* — cột trái 5 ô, khung 4 ô,
   **khác bộ số**.
3. **Hai Section trùng tên** *"Hoạt động gần đây"* — một nạp được, một `SẮP CÓ`.
4. **Tiêu điểm hôm nay ⟷ Cần xử lý ngay** trùng **4/5 dòng**.
5. **Khu *Biểu đồ phân tích* (y=3442) nằm SAU thanh 13 tab** — dưới cả khối
   *Tổng quan điều hành* của khung. Trong đó **2/5 tiêu đề ⛔ không có biểu đồ
   thật** đi kèm.
6. **99 nút** trên một màn hình.
7. **Điện thoại cao gấp 1,9 lần máy bàn** *(8.434 ⟷ 4.498 px)*.
8. **`role="alert"` = 0** dù có 170 mục rủi ro — trình đọc màn hình ⛔ không
   được báo động.
9. Nút **+ Tạo PO** xuất hiện **2 chỗ**.
10. Khối **`SẮP CÓ` ×2** vẫn chiếm chỗ ở cuối trang.
