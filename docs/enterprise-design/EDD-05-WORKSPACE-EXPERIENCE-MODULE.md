# EDD-05 · ENTERPRISE DESIGN DOCUMENT
## Phase 11 · Workspace · Work Inbox · Dashboard · Executive Center · Portal
## Phase 12 · Module Architecture

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-05 |
| **Sprint** | Enterprise Business Design · Sprint 5 — **sprint cuối trước hợp nhất** |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Trạng thái** | ⏳ **CHỜ PHÊ DUYỆT** |
| **Nguyên tắc bắt buộc** | 🔴 `P-ZERODUP` · `P-ZEROMAN` · `P-COMMIT` · `P-IRREV` · `P-ATTRIB` — **Enterprise Design Principles chính thức** |
| **Cổng bắt buộc** | 🔴 **Screen Design Gate** *(mọi màn hình)* · 🆕 **Enterprise Design Review Gate** |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §0 · `BDR-27` ĐÃ HẤP THỤ — API cho công cụ BI

Board duyệt phương án B kèm đặc tả chi tiết. Ghi nhận và khớp vào kiến trúc:

```
BIAccessToken
├─ 🔴 tenant_id · identity_id · tool_name · purpose · scope[]
├─ 🔴 expires_at        ← hết hạn định kỳ, gia hạn phải duyệt
├─ status: ACTIVE | SUSPENDED | REVOKED
└─ rate_limit · accumulated_threshold

🔴 BỐN RÀNG BUỘC CỨNG
① API đọc TỪ PHÉP CHIẾU đã qua Permission Engine
   ⛔ KHÔNG BAO GIỜ chạm Database hoặc Business Object trực tiếp
② Mọi lượt gọi ghi vào CÙNG MỘT Data Egress Audit Log với Export · Print · Download
③ Áp cùng ngưỡng tích luỹ (DL-135) và phát hiện bất thường
④ Rate Limit · Revocation · Monitoring
```

> `DL-142` · **`E3` API là kênh thứ ba trong MỘT sổ dữ liệu ra duy nhất.** Xuất tệp · in ấn · API — ba đường, một nhật ký, một ngưỡng tích luỹ, một cơ chế giám sát. Đây là `DL-130` *(một chính sách sáu kênh)* được Board xác nhận ở kênh khó nhất.

---

# §1 · HAI CỔNG KIỂM

## 1.1 🔴 SCREEN DESIGN GATE — danh mục 6 câu của Joseph

Mọi màn hình mang hồ sơ này. **⛔ Không có hồ sơ ⇒ ⛔ không được thiết kế tiếp.**

| # | Câu hỏi | Vi phạm khi | Sửa bằng |
|---|---|---|---|
| **G1** | `P-ZERODUP` — nhập lại dữ liệu đã có? | có trường người dùng gõ mà hệ thống đã biết | 🔴 sửa **1 trong 4 khuyết tật** `A1`…`A4` |
| **G2** | `P-ZEROMAN` — nhập tay khi có thể thu nhận? | có trường bậc ⑧ ⛔ không giải trình được | thang 7 bậc |
| **G3** | `P-COMMIT` — biến quyết định thành thao tác tự động? | cam kết ≤ 1 chạm · cam kết chạy ngoại tuyến | thêm **ma sát có chủ ý** |
| **G4** | `P-IRREV` — làm lộ thứ ⛔ không thu hồi? | trường ngoài phép chiếu · vượt lớp tiết lộ | 8 cơ chế phòng ngừa |
| **G5** | `P-ATTRIB` — ⛔ không ngăn được cũng ⛔ không quy trách nhiệm? | có kiểm soát giả · thiếu dấu vết | dấu chìm · nhật ký · **hoặc gỡ bỏ** |
| **G6** | 🔴 **Single Source of Truth** — một dữ liệu ở nhiều nơi? | màn hình **TỰ TÍNH** một chỉ số | đọc từ `MetricDefinition` · read-model |

> 🔴 **`G6` là câu Joseph bổ sung, và nó bắt loại lỗi mà năm câu kia ⛔ không bắt được:** một màn hình ⛔ không nhập trùng, ⛔ không nhập tay, ⛔ không lộ gì — nhưng **tự cộng một con số** và ra kết quả lệch màn hình khác. Đây chính là `CF-8` và `BR-RPT-001`.

## 1.2 🆕 ENTERPRISE DESIGN REVIEW GATE — Board vừa bổ sung

```
Thiết kế ──▶ ⓵ Screen Design Gate      mỗi màn hình · 6 câu
         ──▶ ⓶ Domain Boundary Gate    ai sở hữu · ai ghi · O/W/R/F/D
         ──▶ ⓷ Security Gate           phép chiếu · phân loại · 6 chiều phạm vi
         ──▶ ⓸ Workflow & Rule Gate    guard là RuleRef · phiên bản gắn kết
         ──▶ ⓹ Test Gate               🔴 test case tồn tại và ĐẠT
         ──▶ ⓺ ENTERPRISE DESIGN REVIEW GATE   toàn cảnh · mâu thuẫn chéo
                    │
                    ▼  chỉ khi vượt ĐỦ SÁU
              🔓 IMPLEMENTATION
```

> `DL-143` · 🔴 **⛔ KHÔNG ĐƯỢC SỬA BẰNG MÃ ĐỂ BÙ CHO SAI KIẾN TRÚC** — chỉ thị Board.
>
> Cụ thể hoá thành ba điều cấm:
> ① Màn hình trượt `G1` ⇒ ⛔ **cấm** thêm nút *"sao chép từ đơn trước"* — phải nối quan hệ
> ② Màn hình trượt `G6` ⇒ ⛔ **cấm** thêm hàm tính trong component — phải dựng `MetricDefinition`
> ③ Màn hình trượt `G4` ⇒ ⛔ **cấm** thêm `if (role !== 'buyer')` — phải sửa phép chiếu
>
> **Ba cách vá trên đều CHẠY ĐƯỢC và đều SAI** — chúng để khuyết tật kiến trúc sống sót dưới một lớp mã, và khuyết tật đó sẽ nổi lên ở màn hình thứ hai, thứ ba.

---

# §2 · KIẾN TRÚC WORKSPACE

## 2.1 Bốn tầng điều hướng + tầng số 0

```
⓪ CÔNG VIỆC CỦA TÔI      🆕 cửa vào cá nhân — mọi Domain, một danh sách
        │ bấm việc → nhảy thẳng tầng ④, đúng ngữ cảnh
        ▼
① BUSINESS APPS LAUNCHER  14 Workspace + 4 Global Service + 1 Platform
        ▼
② WORKSPACE SHELL         danh tính màu · Top Header · Bottom Nav 5 nút
        ▼
③ MODULE TABS             hiện thẳng, ⛔ không accordion
        ▼
④ OBJECT CONTROL TOWER    PO 360° · Style 360° · Roll 360° · Subcon 360°
```

## 2.2 Trang chủ — 19 thẻ, **lọc theo quyền**

```
╔═══════════════════════════════════════════════════════════════╗
║ MONICA ONE      🔍  🔔 3   🌐 VI   👤 Lan                      ║
╠═══════════════════════════════════════════════════════════════╣
║  Chào chị Lan · Thứ Ba 04/08                                  ║
║  ┏━━━━━┓ ┏━━━━━┓ ┏━━━━━┓ ┏━━━━━┓                             ║
║  ┃🔴 2 ┃ ┃🟠 1 ┃ ┃🔵 5 ┃ ┃⚪ 3 ┃   ← bấm để lọc               ║
║  ┗━━━━━┛ ┗━━━━━┛ ┗━━━━━┛ ┗━━━━━┛                             ║
║  ┌─────────────────────────────────────────────────┐          ║
║  │ 🔴 PO-2588 · thiếu 240m vải · 4 ngày tới chuyền │  Kho ▸   ║
║  │ 🔴 PO-2601 · mốc Duyệt PP quá hạn 2 ngày        │   MD ▸   ║
║  └─────────────────────────────────────────────────┘          ║
║                      ▾ Xem tất cả 11 việc                     ║
║ ───────────────────────────────────────────────────────────── ║
║  BUSINESS APPS                        [Của tôi] [Tất cả]      ║
║   📋 Merchandising   🤝 Commercial   📦 Procurement            ║
║   🏭 Production      ✅ Quality      🚚 Shipment               ║
║   📊 Reporting       💬 Communication  ✨ AI   📁 Documents    ║
╠═══════════════════════════════════════════════════════════════╣
║  🏠 Trang chủ  💬 Trao đổi  ✨ A.I  📊 Báo cáo  ❓ Hướng dẫn   ║
╚═══════════════════════════════════════════════════════════════╝
```

| Gate | Kết quả |
|---|---|
| `G4` `P-IRREV` | 🔴 **Mặc định `[Của tôi]`** — chỉ hiện app người dùng vào được. **Trả `TD-05`** · Hiến pháp §13.5. Thẻ ⛔ không bấm được là **lời nói dối của giao diện** |
| `G6` SSoT | 🔴 Bốn ô đếm đọc từ **cùng một read-model** với danh sách bên dưới — ⛔ không đếm riêng |

---

# §3 · WORK INBOX — một mô hình, bảy hình dạng

## 3.1 Mô hình chung

`WorkItem` là **phép chiếu**, ⛔ không phải bảng *(`DL-023`)*. Năm loại: 🔴 **NGOẠI LỆ** · 🟠 **CHỜ TÔI KÝ** · 🔵 **CẦN LÀM** · 🟣 **SẮP TỚI HẠN** · ⚪ **TÔI ĐANG CHỜ**.

## 3.2 🔴 Bảy hình dạng công việc — cùng mô hình, khác nhịp

| Nhân vật | Số việc/ngày | Loại chiếm ưu thế | Nhịp | Thiết bị |
|---|---|---|---|---|
| **CEO** | 2–5 | 🔴 NGOẠI LỆ | tuỳ lúc | máy tính |
| **MD** | 10–20 | 🔵 CẦN LÀM + ⚪ ĐANG CHỜ | liên tục | máy tính |
| **GĐSX** | 8–15 | 🟠 CHỜ KÝ + 🔴 NGOẠI LỆ | theo ca | máy tính + di động |
| **QA** | 5–12 | 🟠 CHỜ KẾT LUẬN | theo lô | 🔴 **di động tại xưởng** |
| **Kho** | 15–30 | 🔵 CẦN LÀM | liên tục | 🔴 **di động + quét mã** |
| **Customer** | 0–3 | 🟣 SẮP TỚI HẠN | thưa | máy tính |
| **Subcon** | 3–6 | 🔵 CẦN LÀM *(bắt buộc)* | 🔴 **hằng ngày** | 🔴 **điện thoại, offline** |

> `DL-144` · **Một `WorkItemRule` engine, bảy cấu hình hiển thị.** ⛔ Không viết bảy hộp thư — viết một, cấu hình bảy. Khác biệt nằm ở **loại nào lên trên · mật độ · thiết bị đích**, ⛔ không ở mô hình.

---

# §4 · BẢY TRẢI NGHIỆM — màn hình thật + rà cổng

## 4.1 👔 CEO — Joseph

```
╔═══════════════════════════════════════════════════════════════════╗
║ Chào anh Joseph · Thứ Ba 04/08                    🔴 3 việc       ║
╠═══════════════════════════════════════════════════════════════════╣
║ 🔴 ① PO-2588 · Zara · 142.000 USD · NGUY CƠ LỠ TÀU               ║
║    Thiếu NPL 240m → lùi lên chuyền 3 ngày → ETD 22/08            ║
║    Tàu kế 29/08 → trễ 7 ngày → ước khấu trừ ~4.200 USD           ║
║    Chị Lan đang xử lý · chưa có phương án chốt                   ║
║    [Xem đơn] [Gọi chị Lan] [Yêu cầu phương án trước 14h]         ║
║                                                                   ║
║ 🔴 ② Tháng 9 ĐÃ NHẬN VƯỢT NĂNG LỰC 118%                          ║
║    24 tuần-chuyền khả dụng · đã cam kết 28,3                     ║
║    [Xem bảng năng lực] [Họp với GĐSX]                            ║
║                                                                   ║
║ 🔴 ③ Mango quá hạn 86.400 USD · 47 ngày                          ║
║    ⚠️ Đang chạy tiếp 2 đơn · 210.000 USD                         ║
║    [Xem công nợ] [Tạm dừng đơn mới?]                             ║
╠═══════════════════════════════════════════════════════════════════╣
║ 📊 Sổ đơn 2,84 tr · Đúng hạn 87% · Biên KH 16,2% / Thực 13,8%    ║
║    ▲ theo `M-MD-03` `M-MD-01` `M-MD-04` `M-MD-05`  [Executive ▸] ║
╚═══════════════════════════════════════════════════════════════════╝
```

| Gate | Kết quả |
|---|---|
| `G1` | ✅ ⛔ Không có trường nhập nào |
| `G2` | ✅ |
| `G3` | ✅ Ba nút đều là **hành động tiếp theo**, ⛔ không phải quyết định một chạm. *"Tạm dừng đơn mới?"* mở màn hình quyết định có ma sát |
| `G4` | ⚠️ **Biên LN 13,8% là `RESTRICTED`** ⇒ 🔴 **màn hình đóng dấu chìm** *(`DL-136`)* |
| `G5` | ✅ Dấu chìm |
| `G6` | 🔴 **VI PHẠM ĐÃ SỬA** — bản nháp đầu tôi để dashboard tự tính *"2,84 tr"*. Nay **mỗi con số ghi mã `MetricDefinition`**, đọc từ read-model |

> 🔴 **Hộp thư CEO chỉ có BA dòng — đó là chủ ý.** Hộp thư CEO 40 dòng là hộp thư hỏng: hệ thống đang đẩy việc của người khác lên anh. Luật lọc: chỉ lên tới CEO khi ① chỉ CEO quyết được · ② vượt ngưỡng · ③ **đã leo thang hai cấp mà chưa ai xử**.

## 4.2 📋 MERCHANDISER — chị Lan

```
╔═══════════════════════════════════════════════════════════════════╗
║ 🔴 NGOẠI LỆ                                                       ║
║ PO-2588 thiếu 240m vải chính · 4 ngày tới chuyền · 142.000 USD   ║
║   [Xem tồn kho] [Hỏi NCC] [Lùi lịch] [Đổi phân bổ]      Kho ▸    ║
╠═══════════════════════════════════════════════════════════════════╣
║ 🔵 CẦN LÀM HÔM NAY                                                ║
║ ④ PO-2609 xác nhận 2 ngày trước · CHƯA có lịch T&A               ║
║    [ SINH LỊCH T&A ]  ← 🔴 hệ thống sinh, chị Lan XEM và duyệt   ║
║ ⑤ INQ-338 · Mango · quá hạn báo giá 1 ngày                       ║
║ ⑥ PO-2577 · 4 dòng NPL chưa gửi đề nghị mua      Procurement ▸   ║
╠═══════════════════════════════════════════════════════════════════╣
║ ⚪ CHỊ ĐANG CHỜ                                                   ║
║ ⑨ Mẫu PP STY-4471 gửi Zara 11 NGÀY chưa phản hồi                 ║
║    [Nhắc khách] [Gọi]                            Product Dev ▸   ║
║ ⑩ CST-119 chờ GĐSX duyệt · 2 ngày                                ║
║ ⑪ Kết quả kiểm vải FAB-2201 chờ QA · 2 ngày         Quality ▸    ║
╚═══════════════════════════════════════════════════════════════════╝
```

| Gate | Kết quả |
|---|---|
| `G1` | 🔴 **VI PHẠM ĐÃ SỬA** — nút cũ là *"Lập lịch T&A"* *(nhập tay ngày)*. Nay **`[SINH LỊCH T&A]`** — hệ thống lùi từ `anchor` theo mẫu `order_type`, chị Lan **xem và duyệt**. Khuyết tật `A4` |
| `G2` | ✅ |
| `G3` | ✅ Sinh lịch là **đề xuất**; duyệt là quyết định riêng |
| `G4` | ✅ ⛔ Không hiện biên LN trên hộp thư |
| `G6` | ✅ *"11 NGÀY"* từ `M-MD-SAMPLE-AGE`, ⛔ không tự trừ ngày |

> 🔴 **Khối ⚪ *"đang chờ"* có 3 mục — đây là thứ Excel ⛔ không bao giờ hiện.** Chị Lan ⛔ không quên mẫu nằm ở Zara 11 ngày — chị ấy **⛔ không có cách nào biết** trừ khi lục email. Đây là loại lãng phí lớn nhất ngành may, và nó chỉ hiện ra khi có mô hình *"tôi đang chờ ai"*.

## 4.3 🏭 GIÁM ĐỐC SẢN XUẤT — anh Dũng

```
╔═══════════════════════════════════════════════════════════════════╗
║ 🟠 CHỜ ANH DUYỆT — 4                                              ║
║ ① 💰 GIÁ · CST-119 · H&M · 96.000 USD                            ║
║    Chào 3,84 USD/pc · biên 14,1% ⚠️ dưới ngưỡng 15%              ║
║    🔴 Lần trước cùng khách, cùng loại: 3,96 USD · biên 16,8%     ║
║    [ Xem chi tiết ]  ← ⛔ KHÔNG có nút Duyệt ở đây (P-COMMIT)     ║
║ ③ 🛒 PO MUA vải chính · 18.400 USD · Dệt Phong Phú               ║
║    4,12 USD/m ⚠️ cao hơn lần trước 6%                            ║
║    ✍️ Chữ ký MD (kỹ thuật): ✅ chị Lan 04/08 09:14               ║
║    [ Xem chi tiết ]                                              ║
║ ④ 🏭 Vượt cổng lên chuyền · PO-2577 · NPL 82% (cần 90%)          ║
║    Thiếu: vải chính 240m · nhãn dệt 3.200 cái                    ║
╠═══════════════════════════════════════════════════════════════════╣
║ 🔴 NGOẠI LỆ SẢN XUẤT                                              ║
║ ⑤ Chuyền 3 hiệu suất 61% · ngày 9/14 của mã · dưới chuẩn        ║
║ ⑥ Chuyền 5 dừng 47' sáng nay: 30' chờ NPL · 17' máy hỏng        ║
║    ▲ từ Andon, ⛔ không ai gõ (ZM-GAP-5)                          ║
╚═══════════════════════════════════════════════════════════════════╝
```

| Gate | Kết quả |
|---|---|
| `G1` | ✅ *"Lần trước 3,96 USD"* **kế thừa** từ `PriceAgreement` lịch sử |
| `G2` | ✅ Downtime từ Andon *(bậc ①②)*, ⛔ không gõ |
| `G3` | 🔴 **VI PHẠM ĐÃ SỬA** — bản nháp có nút `[Duyệt]` ngay trên hộp thư. **Duyệt giá 96.000 USD ⛔ KHÔNG được là một chạm.** Nay chỉ `[Xem chi tiết]` → màn hình duyệt có ảnh chụp bằng chứng + gõ xác nhận nếu dưới ngưỡng |
| `G4` | ⚠️ Biên LN `RESTRICTED` ⇒ dấu chìm màn hình |
| `G6` | ✅ Hiệu suất 61% từ `M-PR-01`, ⛔ không tính tại chỗ |

> ⚠️ **Màn hình này phơi bày tập trung quyền:** anh Dũng duyệt **giá bán** + **giá mua** + **cổng lên chuyền**. `SOD-06` giữ ở mức cảnh báo *(`BDR-21`)*, và **báo cáo tháng liệt kê mọi lần duyệt dưới ngưỡng** là đối trọng.

## 4.4 ✅ QA — anh Hùng · 🔴 di động tại xưởng

```
╔═══════════════════════════════════╗
║ 🔴 Chuyền 3 · DHU 8,4 (ngưỡng 5)  ║
║    3 giờ liên tiếp · TRA TAY      ║
║    ⚠️ 1.240 pcs đã qua            ║
║    [Xem lỗi] [Dừng công đoạn]     ║
╠═══════════════════════════════════╣
║ 🟠 CHỜ ANH KẾT LUẬN               ║
║ Final PO-2560 · QC Trang kiểm     ║
║   Lô 1.200 → mẫu 32 · 4 lỗi nặng  ║
║   🔴 AQL 2.5 → giới hạn 7         ║
║   ▲ cỡ mẫu và giới hạn TỰ TRA     ║
║      từ ISO 2859-1, ⛔ không gõ    ║
║   [ Xem phiếu kiểm ]              ║
╠═══════════════════════════════════╣
║ 🔵 HÔM NAY                        ║
║ 🔴 KHÁCH kiểm Final PO-2560 NGÀY  ║
║    MAI 9h — Pre-Final CHƯA làm    ║
║ 📷 [ QUÉT LÔ ĐỂ KIỂM ]            ║
╚═══════════════════════════════════╝
```

| Gate | Kết quả |
|---|---|
| `G1` | 🔴 **VI PHẠM ĐÃ SỬA** *(`ZD-2`)* — QC ⛔ không gõ thông số chuẩn. `Measurement.spec_value` **kế thừa từ `TechPackVersion`**; chỉ nhập **số đo thực**, và quét mã lô để mở phiếu |
| `G2` | ✅ Cỡ mẫu · Ac/Re **tự tra** `AQLPlan` từ cỡ lô — bậc ①. Lỗi nhập bằng **chip mã lỗi**, ⛔ không gõ chữ |
| `G3` | 🔴 **Kết luận lô là QUYẾT ĐỊNH** — hệ thống hiện *"đề xuất: ĐẠT"* nhưng **⛔ không có nút Đạt ở hộp thư**. Vào phiếu, xem, rồi kết luận |
| `G4` | ✅ Phát hiện `INTERNAL_ONLY` ⛔ không rời khỏi màn hình nội bộ |
| `G6` | ✅ DHU từ `M-PR-04` |

> 🔴 **Việc *"khách kiểm ngày mai mà Pre-Final chưa làm"* là loại việc chỉ hệ thống nghĩ ra được** — nó nối *lịch khách kiểm* với *trạng thái kiểm nội bộ*. ⛔ Không ai ghép hai dữ kiện đó bằng tay mỗi sáng.

## 4.5 📦 KHO — anh Tuấn · 🔴 di động + quét mã

```
╔═══════════════════════════════════╗
║ 🔴 THIẾU NPL KHÁCH CẤP · PO-2588  ║
║    Định mức 8.240m · nhận 8.000m  ║
║    THIẾU 240m · 3 ngày chưa báo   ║
║    ▲ so định mức TỰ ĐỘNG (C48)    ║
║    [Lập biên bản thiếu] [Báo MD]  ║
╠═══════════════════════════════════╣
║ 🟠 CHỜ ANH DUYỆT                  ║
║ Thủ kho Nam đề nghị ĐIỀU CHỈNH    ║
║   chỉ #40 · −18 cuộn · lệch 4,2%  ║
║   📷 có ảnh · lý do: kiểm kê lệch ║
║   [ Xem ảnh và duyệt ]            ║
╠═══════════════════════════════════╣
║ 🔵 HÔM NAY                        ║
║ 📷 [ QUÉT NHẬN HÀNG ]  ← 3 lô     ║
║ 📷 [ QUÉT SOẠN HÀNG ]  ← chuyền 3 ║
║    ⚠️ 3 cuộn LỆCH DẢI MÀU đã loại ║
║ 🔄 Trả về kho 118m vải dư PO-2571 ║
╚═══════════════════════════════════╝
```

| Gate | Kết quả |
|---|---|
| `G1` | ✅ Số lượng nhận từ **quét mã cuộn** *(`ZM-GAP-3`)*, ⛔ không gõ. Định mức kế thừa từ `BOM` |
| `G2` | ✅ Bậc ② chủ đạo |
| `G3` | 🔴 **Duyệt điều chỉnh tồn là QUYẾT ĐỊNH** — `SOD-H03` chặn cứng người đề xuất tự duyệt. Nút là `[Xem ảnh và duyệt]`, ⛔ không phải `[Duyệt]` |
| `G4` | ✅ ⛔ Không có giá vật tư trên màn hình kho |
| `G6` | ✅ *"lệch 4,2%"* tính từ read-model kiểm kê |

## 4.6 👤 CUSTOMER PORTAL

```
╔═══════════════════════════════════════════════════════════════╗
║ ZARA VIETNAM                    🌐 EN ▾        [ Yêu cầu + ]  ║
╠═══════════════════════════════════════════════════════════════╣
║ 🟣 CẦN BẠN XÁC NHẬN                                           ║
║ Mẫu PP · STY-4471 · gửi 24/07 (11 ngày)                       ║
║   📷 6 ảnh · 📄 bảng thông số · 🎥 video                       ║
║   [ Xem hồ sơ mẫu ]   ← duyệt ở màn hình chi tiết             ║
╠═══════════════════════════════════════════════════════════════╣
║ 📦 ĐƠN HÀNG CỦA BẠN                                           ║
║ PO-2588 · 18.400 pcs                          ETD 22/08 ⚠️    ║
║   Cắt ██████████ 88% · May ████░░░░ 44% · Đóng gói ░░ 0%      ║
║   🔴 ETA cập nhật: 26/08 (+4 ngày) — lý do: chờ NPL           ║
║ PO-2560 · 9.200 pcs                    ✅ Đã xuất 28/07       ║
║   Hoá đơn INV-2024-0891 ▸ theo MISA · Thanh toán: chờ         ║
╠═══════════════════════════════════════════════════════════════╣
║ 💬 Trao đổi (3)      📁 Chứng từ (12)      📊 Báo cáo         ║
╚═══════════════════════════════════════════════════════════════╝
```

| Gate | Kết quả |
|---|---|
| `G1` | ✅ Khách ⛔ không nhập gì — mọi thứ kế thừa |
| `G3` | ✅ Duyệt mẫu ở **màn hình chi tiết**, ⛔ không phải nút trên danh sách. Và **mọi yêu cầu → `CollaborationRequest`**, ⛔ không ghi thẳng |
| `G4` | 🔴 **Đọc từ `customer_view.*`, ⛔ KHÔNG chạm bảng gốc** *(`DL-057`)*. ⛔ Không có: hiệu suất · SMV · số công nhân · tên nhà thầu · chiết tính |
| `G5` | ✅ `opened_at` · `downloaded_at` mọi chứng từ |
| `G6` | 🔴 **Trạng thái hoá đơn ghi rõ *"theo MISA"*** — ⛔ không giả vờ Monica ONE là nguồn |

> 🔴 **Dòng *"ETA cập nhật 26/08 (+4 ngày) — lý do: chờ NPL"* là lợi thế cạnh tranh cụ thể.** Nhà máy khác để khách phát hiện trễ **khi tới ngày**. Monica báo trước 18 ngày, kèm lý do. Đó là thứ giữ khách.

## 4.7 🔧 SUBCONTRACT PORTAL — điện thoại, offline

```
╔═══════════════════════════════════╗
║ 🏢 Monica Garment ▾  📶 ⚠️ 3 chờ  ║
╠═══════════════════════════════════╣
║ ┏━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━┓    ║
║ ┃ 📊 SẢN     ┃ ┃ 📷 QUÉT    ┃    ║
║ ┃   LƯỢNG    ┃ ┃    QR      ┃    ║
║ ┃ Chuyền1·10h┃ ┃            ┃    ║
║ ┗━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━┛    ║
╠═══════════════════════════════════╣
║ 🔵 BÁO CÁO NGÀY 03/08 ĐÃ SẴN      ║
║    Tổng 994 pcs · 3 sự cố         ║
║    ▲ TỰ TỔNG HỢP từ số đã nhập    ║
║    [ XEM VÀ XÁC NHẬN ]  ← DL-128  ║
╠═══════════════════════════════════╣
║ 🆕 ASG-0148 · 6.200 pcs · 26/08   ║
║    1,42 USD/pc = 8.804 USD        ║
║    [ Xem chi tiết ]        📶     ║
╠═══════════════════════════════════╣
║ ⚠️ CAPA-091 chờ 4 ngày   [Xem]    ║
╚═══════════════════════════════════╝
  [Việc] [Line Map] [NPL] [Chat]
```

| Gate | Kết quả |
|---|---|
| `G1` | 🔴 **VI PHẠM ĐÃ SỬA** *(`ZD-1`)* — báo cáo ngày **tự tổng hợp**, nút đổi từ `[NHẬP NGAY]` sang `[XEM VÀ XÁC NHẬN]` |
| `G2` | ✅ Sản lượng qua **quét bó**; ± chỉ là đường dự phòng |
| `G3` | 🔴 `[Xem chi tiết]` cho Assignment 8.804 USD — **cam kết ⛔ không được là một chạm** *(`DL-112`)*. 📶 báo cần mạng *(`DL-089`)* |
| `G4` | 🔴 `subcon_view.*` ⛔ không chứa `costings` · tên khách ẩn danh hoá *(`DL-063`)* |
| `G6` | ✅ *"Tổng 994"* từ chính `StageThroughput` họ đã nhập — ⛔ **không có nguồn thứ hai** |

---

# §5 · DASHBOARD

## 5.1 🔴 Ranh giới Work Inbox ⟷ Dashboard

| | **Work Inbox** | **Dashboard** |
|---|---|---|
| Trả lời | *"tôi phải LÀM gì"* | *"mọi thứ đang ĐI thế nào"* |
| Phạm vi | cá nhân | tập thể |
| Vòng đời | **biến mất khi xử lý xong** | luôn ở đó |
| Hành động | 🔴 **bắt buộc có nút** | có thể chỉ để nhìn |

> `DL-145` · 🔴 **Mọi ô đếm *"cần chú ý"* trên dashboard chuyển thành nguồn sinh `WorkItemRule`.**
> Một con số *"5 đơn cần chú ý"* trên dashboard đòi ai đó nhớ bấm vào. Năm việc trong hộp thư của **đúng merchandiser phụ trách** thì tự biến mất khi xử lý. Dashboard nhẹ đi và **trở nên phân tích hơn**.

## 5.2 Hai lăng kính lợi nhuận — thi hành `BDR-05`

```
╔═══════════════════════════════════════════════════════════════╗
║ LỢI NHUẬN                    [Lãi trên biến phí] [Toàn bộ]    ║
╠═══════════════════════════════════════════════════════════════╣
║ 🔵 LÃI TRÊN BIẾN PHÍ · dùng để QUYẾT ĐỊNH NHẬN ĐƠN            ║
║    = Doanh thu − chi phí trực tiếp   ⛔ không phân bổ CP chung ║
║    Theo đơn ▸  Theo khách ▸  Theo nhà máy ▸  Theo nhà thầu ▸  ║
║                                                               ║
║ 🟣 GIÁ THÀNH TOÀN BỘ · dùng để ĐÁNH GIÁ HIỆU QUẢ              ║
║    CP chung phân bổ theo 🔴 PHÚT CHUYỀN TIÊU THỤ              ║
║    ⚠️ Cơ sở phân bổ: phút chuyền · kỳ 08/2026                 ║
╚═══════════════════════════════════════════════════════════════╝
```

> 🔴 **⛔ KHÔNG BAO GIỜ hiện một con số *"lợi nhuận"* mà ⛔ không nói rõ phương pháp.** Hai con số khác nhau, hai mục đích, luôn kèm nhãn.

## 5.3 Rà cổng dashboard

| Gate | Phát hiện |
|---|---|
| `G4` | 🔴 **VI PHẠM ĐÃ SỬA** — **đi sâu vào chỉ số ⛔ không được vượt phạm vi người xem**. Người ⛔ không có `RESTRICTED` bấm vào biên LN ⇒ thấy **tổng hợp ⛔ không suy ra được số gốc**, ⛔ không phải bảng chi tiết |
| `G4` | 🔴 **VI PHẠM ĐÃ SỬA** — **ô đếm cũng rò**. Badge *"12 đơn biên thấp"* cho người ⛔ không xem được biên LN là đã rò. **Đếm cũng đi qua phép chiếu** |
| `G6` | 🔴 Mọi ô có mã `MetricDefinition` hiện được khi di chuột |

---

# §6 · EXECUTIVE CENTER

```
╔═══════════════════════════════════════════════════════════════╗
║ EXECUTIVE CENTER                                Tháng 8/2026  ║
╠═══════════════════════════════════════════════════════════════╣
║ 🔴 CẦN ANH — 3          [→ Work Inbox]                        ║
╠═══════════════════════════════════════════════════════════════╣
║ 📊 SỨC KHOẺ KINH DOANH                                        ║
║   Sổ đơn 2,84 tr USD    Đúng hạn 87% ▼3    Biên thực 13,8% ▼  ║
║   🔴 Ăn mòn biên 2,4đ ▸ nguyên nhân: khấu trừ 0,9 · vượt      ║
║      định mức vải 0,8 · làm lại 0,7                           ║
╠═══════════════════════════════════════════════════════════════╣
║ ⚡ CẢNH BÁO SỚM · từ 5 tín hiệu luật (DL-043)                 ║
║   🔴 3 đơn nguy cơ trễ tàu (sớm 2–4 tuần)                     ║
║   🔴 1 đơn nguy cơ LỖ · PO-2544 · dự phóng −1,2%              ║
║   🟠 Tháng 9 vượt năng lực 118%                               ║
╠═══════════════════════════════════════════════════════════════╣
║ 🏭 Nhà máy ▸   👥 Khách ▸   🔧 Nhà thầu ▸   💰 Dòng tiền ▸    ║
╚═══════════════════════════════════════════════════════════════╝
```

| Gate | Kết quả |
|---|---|
| `G3` | 🔴 **Executive Center ⛔ KHÔNG có quyền GHI nghiệp vụ nào** — Hiến pháp §18.7. Mọi hành động → Work Inbox → workflow của Domain sở hữu |
| `G4` | Toàn bộ `RESTRICTED` ⇒ dấu chìm màn hình · ⛔ không xuất được nếu ⛔ không có quyền |
| `G6` | 🔴 **Ăn mòn biên phân rã thành ba nguyên nhân** — mỗi nguyên nhân là một `MetricDefinition` truy được về sự kiện gốc |

> 🔴 **Dòng *"ăn mòn biên 2,4 điểm, phân rã thành ba nguyên nhân"* là thứ CEO thật sự cần.** Biết *"biên thực 13,8%"* ⛔ không hành động được. Biết *"mất 0,8 điểm vì vượt định mức vải"* thì có người để gọi và có việc để sửa.

---

# §7 · PHASE 12 · MODULE ARCHITECTURE

## 7.1 Năm cấp — định nghĩa

| Cấp | Là gì | Số lượng | Ví dụ |
|---|---|---|---|
| **Business App** | Mục trên trang chủ | **19** | Merchandising |
| **Workspace** | Vỏ trải nghiệm của một Domain | **14** | Workspace Merchandising |
| **Module** | Nhóm năng lực = một tab | ~**70** | Order Book · Costing · T&A |
| **Submodule** | Nhóm chức năng trong Module | ~**180** | Order Book › Danh sách · 360° · Thay đổi |
| **Feature** | Một việc người dùng làm | ~**650** | Sinh lịch T&A · Tách đơn |

## 7.2 Bản đồ Module — 14 Workspace

| Workspace | Modules |
|---|---|
| **Executive Center** | Cockpit · Cảnh báo sớm · Hàng đợi quyết định · Tài chính · Sức khoẻ sổ đơn |
| **Commercial** | Khách hàng · Hợp đồng · Bảng giá · Điều kiện TM · Trao đổi khách |
| **Merchandising** | Hỏi hàng · **Chiết tính** · Báo giá · **Sổ đơn** · **T&A** · Sở hữu NPL · Phân bổ · Thay đổi · **Control Tower** |
| **Product Development** | Mã hàng · **Tech Pack** · **Mẫu** · BOM · Rập & sơ đồ · PP Meeting |
| **Industrial Eng.** | **Sổ thời gian chuẩn** · Thư viện công đoạn · Bảng công đoạn · Cân bằng chuyền · Đường cong học tập |
| **Planning** | **Năng lực** · **CTP** · Kế hoạch SX · Xếp lịch chuyền · Lệnh SX · MRP · What-if |
| **Production** | Cấu trúc nhà máy · Cắt · **Line Map** · Ghi sản lượng · WIP · Dừng chuyền · Hoàn thành–Đóng gói |
| **Quality** | Kế hoạch kiểm · **Kiểm hàng** · Kiểm trong chuyền · AQL · Lỗi & CAPA · Kiểm NPL |
| **Procurement** | Nhà cung cấp · Đề nghị mua · Tìm nguồn · **PO mua** · Nhận hàng · **Đối chiếu 3 chiều** |
| **Warehouse** | Vị trí · **Nhận hàng** · Cuộn & lô · **Sổ tồn** · Giữ chỗ · **Soạn–Xuất–Trả** · Điều chỉnh · Kiểm kê · Thành phẩm |
| **Shipment** | Booking · Đóng gói · Lô hàng · **Bộ chứng từ** · Theo dõi giao |
| **Subcontract** | Nhà thầu · **Assignment** · Điều khoản TM · Giao–Nhận · **Đối soát hao hụt** · Quản trị cổng |
| **Finance** | Đề nghị hoá đơn · **Gương MISA** · Thu tiền · **Khấu trừ** · Phải thu · Phải trả · **Giá vốn thật** · **Đối chiếu** |
| **Human Resources** | Nhân sự · Chấm công · Tay nghề · **Lương sản phẩm** |

## 7.3 Bốn luật Module

| # | Luật | Vì sao |
|---|---|---|
| `MOD-1` | 🔴 **Module thuộc đúng MỘT Workspace** | Module xuất hiện ở hai nơi ⇒ ranh giới Domain vẽ sai |
| `MOD-2` | 🔴 **Năng lực dùng chung *(Chứng từ · Trao đổi · Nhật ký)* ⛔ KHÔNG là Module** — chúng là **lớp ngữ cảnh** trong Object Control Tower | Nếu là Module thì mỗi Workspace có một tab *"Chứng từ"* ⇒ **14 bản sao** ⇒ vi phạm `G6` |
| `MOD-3` | **Module có thể ẩn theo `domain_activation`** | Doanh nghiệp nhỏ thấy 9 Workspace, ⛔ không phải 14 |
| `MOD-4` | 🔴 **Mọi Feature mang hồ sơ `ScreenDesignGate`** | Chỉ thị Board |

> `MOD-2` là luật quan trọng nhất. Nó ngăn đúng cái bẫy mà **mọi ERP đều mắc**: nhân bản *"Documents"*, *"Comments"*, *"Activity"* thành tab ở khắp nơi, rồi mỗi nơi lưu một bảng riêng.

---

# §8 · 🔴 TỔNG HỢP RÀ CỔNG — vi phạm phát hiện và đã sửa

| # | Màn hình | Cổng trượt | Vi phạm | Đã sửa |
|---|---|---|---|---|
| 1 | CEO dashboard | `G6` | Dashboard **tự tính** sổ đơn, đúng hạn, biên LN | Mọi số có mã `MetricDefinition`, đọc read-model |
| 2 | MD · lập T&A | `G1` `A4` | Bắt MD **nhập ngày mốc** | 🔴 `[SINH LỊCH T&A]` — hệ thống lùi từ anchor, MD duyệt |
| 3 | GĐSX · hộp thư | `G3` | Nút `[Duyệt]` cho giá **96.000 USD ngay trên danh sách** | Chỉ `[Xem chi tiết]` → màn hình duyệt có ma sát |
| 4 | QA · kiểm hàng | `G1` `A3` | QC **gõ lại thông số chuẩn** từ TechPack | Kế thừa `spec_value`; chỉ nhập số đo thực |
| 5 | QA · cỡ mẫu | `G2` | Gõ cỡ mẫu và giới hạn Ac/Re | **Tự tra `AQLPlan`** từ cỡ lô — bậc ① |
| 6 | Kho · nhận hàng | `G2` | Gõ số lượng nhận | **Quét mã cuộn** — bậc ② |
| 7 | Subcon · báo cáo ngày | `G1` `D1` | **Nhập lại** thứ đã nhập theo giờ | `[XEM VÀ XÁC NHẬN]` — tự tổng hợp |
| 8 | Dashboard · đi sâu | `G4` | Đi sâu chỉ số **vượt phạm vi tiết lộ** | Người ⛔ không có `RESTRICTED` chỉ thấy tổng hợp ⛔ không suy ngược |
| 9 | 🔴 Dashboard · **ô đếm** | `G4` | Badge *"12 đơn biên thấp"* **đã rò** dù bấm vào bị chặn | **Đếm cũng đi qua phép chiếu** |
| 10 | Module · năng lực chung | `G6` | *"Chứng từ"*, *"Trao đổi"* thành tab ở 14 Workspace ⇒ **14 bản sao** | `MOD-2` — là **lớp ngữ cảnh**, ⛔ không phải Module |
| 11 | Portal khách · hoá đơn | `G6` | ⛔ Không nói rõ nguồn | Ghi rõ **"theo MISA"** |
| 12 | Executive Center | `G3` | Có nút hành động trực tiếp | ⛔ **0 quyền ghi** — mọi hành động → Work Inbox → workflow Domain |

**12 vi phạm phát hiện · 12 đã sửa trong thiết kế · 0 sửa bằng mã** *(`DL-143`)*.

> 🔴 **Hai vi phạm đáng chú ý nhất — cả hai đều là loại mà mắt thường ⛔ không thấy:**
>
> **#9 · Ô đếm cũng rò.** Một badge *"12 đơn biên thấp"* ⛔ không hiện số liệu nào, nhưng nó **xác nhận có 12 đơn biên thấp** — thông tin mà người xem ⛔ không được biết. Đây là `C6` *(phản hồi đồng nhất)* áp vào một chỗ ⛔ không ai nghĩ tới.
>
> **#10 · Năng lực chung thành Module là nhân bản 14 lần.** Nó ⛔ không vi phạm `G1` *(⛔ không ai nhập trùng)* cũng ⛔ không vi phạm `G4` *(⛔ không rò)* — nó chỉ vi phạm `G6`. **Đây chính là lý do Joseph bổ sung câu thứ sáu.**

---

# §9 · DECISION LOG — 6 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-142` | **API BI là kênh `E3` trong MỘT sổ dữ liệu ra duy nhất** | `BDR-27` · `DL-130` | ✅ |
| `DL-143` | 🔴 **⛔ Cấm sửa bằng mã để bù sai kiến trúc** — 3 điều cấm cụ thể | Chỉ thị Board. Ba cách vá đều **chạy được** và đều **sai** | 🔴 rất khó |
| `DL-144` | **Một engine `WorkItemRule`, bảy cấu hình hiển thị** | ⛔ Không viết bảy hộp thư | ✅ |
| `DL-145` | 🔴 **Mọi ô đếm *"cần chú ý"* trên dashboard chuyển thành nguồn `WorkItemRule`** | Con số đòi người nhớ bấm; việc trong hộp thư tự biến mất | ✅ |
| `DL-146` | 🔴 **Ô ĐẾM cũng đi qua phép chiếu** — badge cũng là kênh rò | Badge xác nhận **sự tồn tại** của thứ người xem ⛔ không được biết | ⚠️ |
| `DL-147` | 🔴 **Năng lực dùng chung là LỚP NGỮ CẢNH, ⛔ không phải Module** *(`MOD-2`)* | Nếu là Module ⇒ 14 tab *"Chứng từ"* ⇒ 14 bản sao ⇒ vi phạm `G6` | ⚠️ |

**Cộng dồn EDD-01 → 05: 147 quyết định.**

---

# §10 · BOARD DECISION REQUIRED — 2

## `BDR-28` · NHÂN VIÊN NỘI BỘ TẠI XƯỞNG — di động hay máy tính?

**Vấn đề.** Subcontract Portal là **mobile-first** theo chỉ thị Board. Nhưng **QA · Kho · Tổ trưởng** cũng làm việc **trong môi trường sản xuất** — đứng, đi lại, tay bẩn. Họ dùng gì?

| | **A · Nội bộ desktop-first, di động chỉ để xem** | **B · Ba Workspace nội bộ *(QA · Kho · Production)* cũng mobile-first** |
|---|---|---|
| **Ưu** | Ít việc hơn · màn hình lớn hợp cho phân tích · ⛔ không nhân đôi giao diện | 🔴 **QA kiểm ngay tại chuyền, Kho quét ngay tại kệ** — dữ liệu vào **lúc sự việc xảy ra**, ⛔ không phải cuối ca |
| **Nhược** | 🔴 **QA ghi ra giấy rồi nhập lại cuối ca** ⇒ vi phạm `P-ZERODUP` `D1` **ngay từ thiết kế**. Kho ⛔ không quét được tại kệ ⇒ mất `P-ZEROMAN` bậc ② | Nhân công việc giao diện cho 3 Workspace · cần thiết bị cho nhân viên |
| **Với Monica** | Rẻ hơn trước mắt | ✅ Xưởng đã có wifi; QA và Kho là hai nơi `P-ZEROMAN` có đòn bẩy lớn nhất |
| **Với 100 khách** | Sản phẩm *"ERP văn phòng có thêm cổng đối tác"* | 🔴 Sản phẩm **vận hành tại xưởng** |

> **Khuyến nghị: PHƯƠNG ÁN B cho ba Workspace, ⛔ không phải toàn bộ.**
> QA · Warehouse · Production = **mobile-first**. Executive · Commercial · MD · Planning · IE · Procurement · Finance · HR = **desktop-first, di động chỉ đọc**.
>
> Lý do: phương án A **vi phạm hai nguyên tắc ngay từ bản thiết kế**. QA ghi giấy rồi nhập lại là `P-ZERODUP` `D1`; Kho ⛔ không quét tại kệ là mất bậc ② của `P-ZEROMAN`. Chúng ta vừa mất bốn sprint để loại bỏ đúng hai lỗi đó ở cổng đối tác — ⛔ không nên tự tạo lại chúng ở nội bộ.
>
> ⚠️ **Chỗ tôi có thể sai:** chi phí là thật *(ba giao diện di động nữa)*. Nếu Board muốn giới hạn phạm vi v1, tôi đề nghị **ưu tiên Kho trước** — vì quét mã ở kho mở khoá nhiều `ZM-GAP` nhất.

**🔲 Board chọn: A · B-ba-workspace · B-chỉ-Kho-trước**

---

## `BDR-29` · TENANT CÓ ĐƯỢC TỰ DỰNG DASHBOARD KHÔNG?

**Vấn đề.** `BDR-27` mở API cho Power BI. Vậy Monica ONE có cần **công cụ dựng dashboard trong sản phẩm** ⛔ không? Đây là quyết định **phạm vi sản phẩm**, ⛔ không phải kỹ thuật.

| | **A · Dashboard cố định do Monica ONE thiết kế** | **B · Tenant tự dựng dashboard trong sản phẩm** |
|---|---|---|
| **Ưu** | 🔴 **Mọi số qua `MetricDefinition`** ⇒ `G6` bảo đảm tuyệt đối · chất lượng thiết kế nhất quán · ít việc | Tenant tự chủ · ⛔ không phải chờ nhà cung cấp · giảm yêu cầu hỗ trợ |
| **Nhược** | Tenant muốn một biểu đồ khác ⇒ **yêu cầu hỗ trợ** ⇒ cổ chai với 100 tenant | 🔴 **Tenant tự tạo chỉ số sai** ⇒ hai dashboard cùng tenant ra hai con số ⇒ **phá `BR-RPT-001` từ bên trong** |
| **Với 100 khách** | Cổ chai | Rủi ro nhất quán số liệu |

> **Khuyến nghị: PHƯƠNG ÁN A + đường thoát, ⛔ không phải B.**
> ① Monica ONE thiết kế **bộ dashboard chuẩn theo vai trò** · ② Tenant **sắp xếp lại, ẩn/hiện, đặt ngưỡng** — ⛔ không tạo chỉ số mới · ③ 🔴 **Cần chỉ số mới ⇒ dùng API BI *(`BDR-27`)*** — ra ngoài sản phẩm, ⛔ không phá nguồn chân lý bên trong.
>
> Lý do: `G6` là câu Joseph vừa bổ sung, và **công cụ dựng chỉ số tự do là cách nhanh nhất để phá nó**. Tenant sẽ tạo *"doanh thu"* theo định nghĩa riêng, rồi hỏi vì sao ⛔ không khớp báo cáo chuẩn. `BDR-27` đã cho họ **một lối thoát ở đúng chỗ** — bên ngoài, có kiểm soát, ⛔ không mang danh nghĩa nguồn chân lý.

**🔲 Board chọn: A-có-đường-thoát · B · A-thuần**

---

# §11 · SPRINT SUMMARY

## 11.1 Đã bàn giao

| Phase | Nội dung |
|---|---|
| **11** | Hai cổng kiểm · kiến trúc Workspace · **Work Inbox 7 hình dạng** · **7 trải nghiệm với màn hình thật** · Dashboard 2 lăng kính lợi nhuận · Executive Center |
| **12** | 5 cấp · **bản đồ 70 Module** cho 14 Workspace · 4 luật Module |
| **Rà cổng** | 🔴 **12 vi phạm phát hiện · 12 sửa trong THIẾT KẾ · 0 sửa bằng mã** |

## 11.2 Ba điểm đáng nhớ nhất

| # | Điểm |
|---|---|
| **1** | 🔴 **Câu `G6` Joseph bổ sung bắt được hai lỗi mà năm câu kia ⛔ không bắt được.** Vi phạm #10 *(năng lực chung thành Module ⇒ 14 bản sao)* ⛔ không nhập trùng, ⛔ không nhập tay, ⛔ không rò gì — nó **chỉ** vi phạm Single Source of Truth. ⛔ Không có câu thứ sáu thì nó lọt qua |
| **2** | 🔴 **Ô đếm cũng là kênh rò.** Badge *"12 đơn biên thấp"* ⛔ không hiện số nào, nhưng **xác nhận có 12 đơn biên thấp** — thông tin người xem ⛔ không được biết. Đây là `C6` *(phản hồi đồng nhất)* ở chỗ ⛔ không ai nghĩ tới |
| **3** | 🔴 **Ba vi phạm `P-COMMIT` đều nằm ở cùng một chỗ: nút Duyệt trên DANH SÁCH.** Duyệt giá 96.000 USD · nhận Assignment 8.804 USD · kết luận lô AQL — cả ba đều bị tôi đặt nút hành động ngay trên hộp thư ở bản nháp. **Hộp thư là nơi THẤY việc, ⛔ không phải nơi QUYẾT việc** |

## 11.3 Lộ trình

| Sprint | Deliverable | Trạng thái |
|---|---|---|
| 1–4 | EDD-01 · 02 · 03 · 03A · 04 · 04A–04G | ✅ |
| **5** | **EDD-05** | ⏳ chờ duyệt |
| **6** | **EDD-06** — hợp nhất · rà mâu thuẫn **147 quyết định** · **hồ sơ Board ký** | tiếp theo |
| → | 🔓 **Board ký ⇒ mở khoá Implementation** | |

## 11.4 Trạng thái

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

---

## THAM CHIẾU

- **Board Decision `BDR-27`** ✅ · **Board Additional Direction** — 5 Enterprise Design Principles · Enterprise Design Review Gate
- [EDD-04G](EDD-04G-ZERO-DUPLICATE-AND-DESIGN-GATE.md) — cổng kiểm 5 câu · 4 khuyết tật `A1`…`A4`
- [EDD-04F](EDD-04F-DATA-EGRESS-CONTROL.md) · [EDD-04E](EDD-04E-ZERO-MANUAL-PRINCIPLE.md) · [EDD-04D](EDD-04D-IRREVOCABILITY-PRINCIPLE.md) · [EDD-04C](EDD-04C-SUBCONTRACT-PORTAL-RUNTIME.md)
- [EDD-03](EDD-03-DOCUMENT-INFORMATION-ARCHITECTURE.md) — `DL-057` phép chiếu · read-model S7
- [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) §13.5 · §15 · §18.7 · §22.4 · §44
