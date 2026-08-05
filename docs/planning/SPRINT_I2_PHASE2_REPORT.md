# SPRINT I-2 · PHASE 2 — BÁO CÁO HOÀN THÀNH

| Trường | Giá trị |
|---|---|
| **Sprint** | **I-2 · Lưới an toàn** — Phase 2 |
| **Ngày** | 2026-08-05 |
| **Chế độ** | Sprint Autonomy *(Board Directive 05/08/2026)* |
| **Điều kiện ra Sprint I-2** | ✅ **ĐẠT CẢ HAI** |
| **Trạng thái** | 🔒 **PHASE 2 ĐÓNG** — 1 hạng mục hoãn có lý do đo được |

---

# §1 · ĐIỀU KIỆN RA — ĐẠT

| # | Điều kiện *(Baseline §3.2)* | Trạng thái |
|---|---|---|
| `E-1` | `test:arch` có đủ **5 phép kiểm mới** | ✅ **5/5** |
| `E-2` | **MD có bài kiểm nghiệp vụ** | ✅ đạt *(Phase 1)* · **mở rộng sang Kho** |

**Năm phép kiểm mới:**

| # | Luật | Trả nợ | Phát hiện kèm |
|---|---|---|---|
| ⑫ | Vốn từ trạng thái *(mã ⟷ migration)* | `TD-03` | 7 chỗ lệch — `VT-1`…`VT-8` |
| ⑬ | `.delete()` theo danh sách miễn trừ | `TD-27` | **`TD-35`** — nút xoá mà CSDL đã cấm |
| ⑭ | Cấm màn hình tự tính *(`G6`)* | `M-2` | 11 tệp tự tính chỉ số |
| ⑮ | Sổ đăng ký `request_id` | ADR-003 | 7 bảng vẫn gửi trùng được |
| ⑯ | Hồ sơ 6 cổng thiết kế | EDD-05 §1.1 | **`TD-38`** — 0/16 màn hình có hồ sơ |

---

# §2 · SỐ ĐO — TRƯỚC ⟷ SAU

| Phép đo | Đầu Phase 2 | **Cuối Phase 2** |
|---|---|---|
| `test:arch` | 51 đạt · 0 hỏng | ✅ **74 đạt · 0 hỏng** |
| Nghiệp vụ MD | 59 đạt | 59 đạt |
| Nghiệp vụ Kho | ⛔ **⛔ không có** | ✅ **154 đạt · 0 hỏng** |
| **Tổng phép đo tĩnh** | **110** | ✅ **287** |
| Mô-đun Kho đo được | 0/5 | ✅ **5/5** |
| Độ phủ CI | 9/10 | 9/10 |
| `npm test` | 9/10 | **10/11** |

🔴 **`md-internal-scope` vẫn hỏng đúng 6 mục `TC-1`** — quy tắc `F-5` thoả,
⛔ không hồi quy suốt Phase.

---

# §3 · HẠNG MỤC

| # | Hạng mục | Kết quả |
|---|---|---|
| `B2-0` | Kiểm CI Node 22 | ✅ 4/4 lượt xanh |
| `B2-2a` | Spike đo ⑭ | ✅ ranh giới kế hoạch **sai 50%** ⇒ Board thu hẹp |
| `B2-1` | ⑬ danh sách miễn trừ | ✅ + `TD-35` |
| `B2-2b` | ⑭ màn hình tự tính | ✅ 11 tệp vào sổ |
| `B2-5` | Bộ kiểm nghiệp vụ Kho | ✅ 2/5 ⇒ **5/5** sau `TD-36` |
| `B2-4` | ⑯ hồ sơ 6 cổng | ✅ + `TD-38` |
| `B2-3` | ⑮ sổ `request_id` | ✅ **E-1 5/5** |
| `B2-6` | Tách `md-client.tsx` | 🔴 **HOÃN** — `TD-39` |
| `B2-7` | Tài liệu · khoá Phase | ✅ tài liệu này |

**Ngoài kế hoạch, phát hiện trong lúc làm:** `TD-35` ✅ trả · `TD-36` ✅ trả ·
`TD-37` 🟡 *(Board giữ nguyên)* · `TD-38` 🔴 · `TD-39` 🔴.

---

# §4 · 🔴 `B2-6` HOÃN — VÌ SAO

`TD-39`. Kế hoạch của **chính tôi** viết: *"Nhóm đã là ranh giới có sẵn trong
mã"*. Đo ra thì **sai**: `GROUPS` chỉ là **mảng nhãn cho thanh tab**.

```
21  hook useState trong MỘT component
17  guard `tab === '…'` đan xen trong MỘT cây JSX (dòng 554–784)
 1  loadTab switch trên TabKey, dùng chung loadedRef · setLoadingTab
```

⇒ Tách phải đưa **~30 thành viên** qua ranh giới. Hai lối: **props** *(⛔ không
kiểm chứng được — `F-8`)* hoặc **Context** *(⇒ **thay đổi kiến trúc**)*.

Sprint Autonomy điều 3 buộc **dừng** ở cả hai. ⇒ Trình Board.

⚠️ Trần **886/900** còn nguyên — arch test ⑤ đỏ khi ai đó thêm 15 dòng.

---

# §5 · BÀI HỌC ĐO ĐƯỢC

## 5.1 Ba lần một phép đo viết vội trả con số **trông hợp lý** mà sai

| Nơi | Lỗi | Nếu tin nó |
|---|---|---|
| ⑫ | `Map` khoá theo tên ⇒ hằng số thứ hai **ghi đè im lặng** | Bỏ sót `INCOTERMS` · `MATERIAL_CATEGORIES` trùng tên |
| Spike `B2-2a` | `\([^)]*=>` ⛔ không vượt `)` của `(s, r)` | Kết luận *"⛔ không tệp nào cộng dồn"* — ngược hoàn toàn |
| `TD-36` | `extname('./commercial.schema')` → `.schema` | Loader dừng ở **4/5** thay vì 5/5 |

🔑 **Cả ba đều ⛔ không tự báo là mình sai** — chúng trả một con số, và con số
trông hợp lý. Đó là lý do **tiêm lỗi** là bắt buộc, ⛔ không phải nghi thức.

## 5.2 Một lần bài kiểm đỏ oan, và **mã thì đúng**

`W-2` báo `FAILED` khi tôi chờ `PASSED`. Đo ra: `areaSqYd = 99.999999999999985`
⇒ điểm `20.0000000000000035` — **lớn hơn 20 thật**. Sai ở cách **tôi dựng số**.

⇒ Sửa bằng cách đo ngữ nghĩa `≤` **trực tiếp**, ⛔ không đi vòng qua một phép
nhân–chia dấu phẩy động.

## 5.3 Đếm ⛔ không phải đo

Spike `B2-2a`: ranh giới ⑭ bắt **24 tệp ≤ ngưỡng 40** ⇒ *"đạt"* theo chữ. Nhưng
**12/24 là dương tính giả**. **Ngưỡng trong kế hoạch của tôi đã đặt sai câu
hỏi** — số lượng đạt, còn **độ chính xác** mới quyết định phép kiểm sống hay
chết.

## 5.4 Ba phép kiểm tự khai giới hạn của chính nó

⑫ đọc **kho**, ⛔ không đọc CSDL · ⑮ ⛔ không chứng minh danh sách **đủ** ·
⑯ ⛔ **không** chứng minh màn hình **đạt** 6 cổng.

🔑 Một phép kiểm tự nhận nhiều hơn nó đo được **chính là kiểm soát giả** — đúng
thứ `G5` cấm.

---

# §6 · CÒN NGUYÊN SAU PHASE 2

> Ghi ở đây để ⛔ không ai đọc *"E-1 5/5"* thành *"đường đã thông"*.

| # | Còn nguyên | Chặn |
|---|---|---|
| `TC-1` | 6 bảng còn `DELETE` cứng | Cổng C |
| `TC-2` | Engine bất biến mới phủ 2/88 aggregate | I-4 |
| `TC-3` | `saveSizeBreakdown` bù trừ | Cổng C |
| `TC-4` | `orders.status` ⛔ không ràng buộc `CHECK` | Cổng C |
| `TC-5` | Mã ⛔ không biểu diễn nổi lô đã huỷ | I-7 |
| `A-1`…`A-5` | 5 migration dưới ADR chưa duyệt · freeze chưa cắt | Cổng C |
| `TD-38` | 0/16 màn hình có hồ sơ 6 cổng | I-5 · I-6 |
| `TD-39` | `md-client.tsx` 886/900, ⛔ không lối thoát rẻ | Board |

🔑 **Phase 2 làm lưới an toàn DÀY HƠN, ⛔ không làm hệ thống ĐÚNG HƠN.** Nó
biến **năm loại khuyết tật** từ *⛔ không ai canh* thành *đếm được và chặn được
nợ mới*. Phần **trả nợ** vẫn ở phía trước, và phần lớn cần **Board**, ⛔ không
cần thêm mã.

---

# §7 · CẦN BOARD

| # | Việc |
|---|---|
| `Q-1` | 🔴 **`TD-39`** — chọn lối ① props hay ② Context *(⇒ ADR)* cho `B2-6` |
| `Q-2` | `TD-37` — Board đang giữ nguyên; vật cản kỹ thuật **đã gỡ** |
| `Q-3` | `TD-38` — xác nhận cách trả *(2–3 màn hình/Sprint)*, và **ai** là người phán |
| `Q-4` | Xác nhận **Sprint I-2 đóng** với `B2-6` hoãn sang I-5 |

---

## THAM CHIẾU

- [`SPRINT_I2_PHASE2_BACKLOG.md`](SPRINT_I2_PHASE2_BACKLOG.md) · [`SPRINT_I2_PHASE1_REPORT.md`](SPRINT_I2_PHASE1_REPORT.md) 🔒
- [`SPIKE-B2-2a-REPORT.md`](SPIKE-B2-2a-REPORT.md) · [`RDY-001`](SPRINT_I2_PHASE2_READINESS.md)
- [`TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) `TD-35`…`TD-39`
- `tests/architecture/` — 5 sổ · `tests/business/` — 2 bộ kiểm · `tests/_lib/ts-resolve.loader.mjs`
