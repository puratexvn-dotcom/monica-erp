# ADR-028 — Ngôn ngữ chính thức thứ tư: Tiếng Hàn

| | |
|---|---|
| **Trạng thái** | 🔴 **ĐỀ XUẤT — CHỜ BOARD.** ⛔ **CHƯA thi hành một dòng nào.** |
| **Ngày** | 08/08/2026 |
| **Người soạn** | Chief Solution Architect |
| **Nguồn nghiệp vụ** | Board Directive *GLOBAL SEARCH + LANGUAGE MENU* 08/08/2026 §9 — *"Bổ sung Korean"* |
| **Sửa đổi** | `Hiến pháp Điều 45.2 · Official Languages` — **bậc 1** |
| **Phản biện độc lập** | ⛔ **CHƯA có** |

---

## 0. VÌ SAO CÓ TÀI LIỆU NÀY THAY VÌ MỘT DÒNG MÃ

Board ra chỉ thị rõ ràng:

> *"Language selector … phải chuyển thành một dropdown duy nhất … **Bổ sung
> Korean**."*

Phần **dropdown** đã thi hành xong. Phần **Korean** thì ⛔ không, và đây là lý
do — ⛔ không phải bỏ sót:

### 🔴 Rào cản ① — Điều 45.2 khai ĐÚNG BA ngôn ngữ

```
MONICA ONE officially supports:
  - Vietnamese
  - English
  - Simplified Chinese

All three languages hold equal constitutional status.
```

Thêm ngôn ngữ thứ tư là **sửa Hiến pháp**, bậc 1 trong thứ bậc văn bản. CLAUDE.md
§0 nói thẳng việc phải làm khi gặp ca này:

> *"Nếu một yêu cầu mâu thuẫn với Hiến pháp: **DỪNG** · **GIẢI THÍCH** · ⛔
> **KHÔNG thi hành** · **xin ADR trước**."*

⚠️ Điều này ⛔ **không** phải nói Board sai. Board là **bậc 0** và có toàn quyền
sửa Điều 45 — chính Board đã sửa nó hai lần *(bản 1.4 và 1.5)*. Thứ tôi ⛔
không được phép làm là **tự sửa Hiến pháp bằng một dòng mã**.

### 🔴 Rào cản ② — Bày cờ Hàn mà ⛔ chưa có bản dịch là VI PHẠM Điều 45.4

```
No screen shall present more than one language at a time.
```

Kho hiện có `messages/{vi,en,zh}.json` **328 khoá mỗi tệp**, cộng `MD_DICT`
*(1.383 dòng)* và `WAREHOUSE_DICT` *(373 dòng)* — cả hai khai kiểu
`Record<Language, …>`, nên thêm `KR` vào `Language` sẽ làm **`tsc` đỏ** cho tới
khi có đủ nhánh Hàn.

🔑 Thêm `KR` vào danh sách mà ⛔ không có bản dịch cho ra một màn hình **tiếng
Việt lẫn tiếng Anh dưới nhãn tiếng Hàn** — vi phạm thẳng khoản trên, và **tệ
hơn một nút ⛔ chưa có**: người dùng Hàn bấm vào, thấy hệ thống ⛔ không hiểu
tiếng của họ, và kết luận sản phẩm nói dối.

---

## 1. ĐỀ XUẤT

### 1.1 Sửa `Hiến pháp Điều 45.2`

```
MONICA ONE officially supports:
  - Vietnamese
  - English
  - Simplified Chinese
  - Korean            ← THÊM

All four languages hold equal constitutional status.
```

⚠️ **Ngôn ngữ hiến định vẫn là tiếng Anh** *(§45.2 đoạn hai)* — ⛔ không đổi.
**Từ vựng hiến định vẫn ⛔ không bao giờ được dịch** *(§45.3)* — tên Business
App giữ nguyên trong bản Hàn.

### 1.2 Khối lượng thi hành — đo được, ⛔ không ước lượng

| Việc | Khối lượng | Ghi chú |
|---|---|---|
| `messages/ko.json` | **328 khoá** | gương của `vi.json`, ⛔ không được thiếu khoá nào — bài kiểm ⑪ chặn |
| `lib/i18n.tsx` | `Language` · `LANGUAGES` · `MESSAGES` · `dictionary` · `dangKyTuDienNganh` · `core.KR` | ~6 chỗ |
| `lib/dictionaries/md.ts` | nhánh `KR` | tệp 1.383 dòng |
| `lib/dictionaries/warehouse.ts` | nhánh `KR` | tệp 373 dòng |
| `components/flag-icons.tsx` | `FlagKR` | SVG nội tuyến — ⛔ **không** emoji *(Windows ⛔ không có cờ trong phông hệ thống)* |
| `components/language-switcher.tsx` | một dòng trong `FLAG` | phần dễ nhất, và là phần duy nhất trông giống "thêm Korean" |
| `locale` BCP-47 | `ko-KR` cho `formatDate` · `formatCurrency` *(§45.6)* | |

🔑 **Dòng cuối là điểm mấu chốt của ADR này**: việc trông như *"thêm một mục
vào mảng"* thực ra là **một tệp dịch 328 khoá cộng hai từ điển ngành**. Làm ẩu
phần đó cho ra một sản phẩm **nói tiếng Hàn sai**, và ⛔ không ai trong nhóm
đọc được để phát hiện.

### 1.3 ⚠️ Điều tôi ⛔ KHÔNG đề xuất

⛔ **Dịch máy rồi phát hành.** `Điều 45.4` đòi *"every visible sentence shall
be localized"* — nó ⛔ không đòi *"shall be machine-translated"*. Một bản dịch
⛔ không ai kiểm là một bản dịch ⛔ không ai chịu trách nhiệm, và với **thuật
ngữ ngành may** *(AQL · SAM · CMT · định mức · chuyền)* thì dịch sai một từ là
đổi nghĩa một điều khoản hợp đồng.

⇒ Đề nghị Board **chỉ định người rà bản dịch Hàn** trước khi hợp nhất.

---

## 2. TÍNH ĐẢO NGƯỢC

| Phần | Mức | Ghi chú |
|---|---|---|
| Sửa `Điều 45.2` | **ĐẢO ĐƯỢC** | một quyết nghị Board ngược lại |
| `messages/ko.json` + nhánh `KR` | **ĐẢO ĐƯỢC** | xoá tệp, gỡ nhánh |
| Người dùng **đã chọn** tiếng Hàn | **ĐẢO MỘT PHẦN** | `localStorage` còn `KR`; `lib/i18n` phải rơi về `VN` khi gặp mã ⛔ không còn hợp lệ — ⛔ **chưa có** phép phòng đó, phải thêm cùng lúc |

---

## 3. TRẠNG THÁI HIỆN TẠI — nói rõ để ⛔ không ai hiểu nhầm

✅ **Dropdown ngôn ngữ ĐÃ thi hành xong** — một nút duy nhất, ngôn ngữ hiện tại
được đánh dấu bằng **nền + dấu ✓** *(⛔ không chỉ bằng màu — `Điều 44`)*, đóng
khi bấm ra ngoài và khi bấm `Esc`, có `role="listbox"` và điều hướng bàn phím.

🔴 **Tiếng Hàn ⛔ CHƯA có** — chờ ADR này được duyệt.

⚠️ Lý do đã ghi ngay trong `components/language-switcher.tsx` để người sửa tiếp
theo ⛔ không tưởng đó là thiếu sót rồi *"vá nhanh"* bằng một dòng.
