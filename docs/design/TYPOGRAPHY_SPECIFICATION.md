# ĐẶC TẢ CHỮ — MONICA ONE

> **Màu nói "cái này thuộc về đâu". Chữ nói "cái nào quan trọng hơn cái nào".**

| Trường | Giá trị |
|---|---|
| **Trạng thái** | ✅ Giai đoạn 1 — đã thi hành |
| **Thẩm quyền** | Quyết nghị Architecture Board, 03/08/2026 |
| **Nợ kỹ thuật** | [TD-10](../TECHNICAL_DEBT.md#td-10) |
| **Thi hành ở** | [`lib/design/typography.ts`](../../lib/design/typography.ts) |
| **Cưỡng chế** | [`tests/architecture/arch.test.mjs`](../../tests/architecture/arch.test.mjs) mục ⑩ |
| **Anh em** | [`lib/design/tokens.ts`](../../lib/design/tokens.ts) — hệ thẻ màu, Hiến pháp Điều 44 |

---

## 0. VÌ SAO CÓ TÀI LIỆU NÀY

### Hiện trạng đã đo, trước khi có hệ thẻ

| Phép đo | Kết quả |
|---|---|
| Lần dùng cỡ chữ tuỳ ý `text-[..px]` | **298** |
| Số cỡ tuỳ ý khác nhau | **12** — `9` `9,5` `10` `10,5` `11` `12` `12,5` `13` `15` `17` `26` `38` px |
| Bậc chữ Tailwind dùng **song song** | **11** |
| Biến thể `tracking-[...]` tuỳ ý | **7** |
| Tệp có thang chữ đặt tại chỗ | **115** |

Hai hệ đo cùng tồn tại trên một sản phẩm. `12,5px` nằm cạnh `13px` — khác biệt
**không ai nhìn ra** nhưng **ai cũng phải bảo trì**. Và `9px` thì đơn giản là
dưới ngưỡng đọc được của phần lớn quản đốc xưởng may.

### Ba điều đặc tả này giải quyết

1. **Thứ bậc nhất quán** — người dùng học cách đọc **một lần**, dùng ở mọi phân hệ.
2. **Đổi phông không phải sửa màn hình** — phông đi qua biến CSS.
3. **Quy tắc có răng** — cơ chế bánh cóc ở mục ⑩, không phải một lời nhắc trong tài liệu.

---

## 1. NGUYÊN TẮC

1. **Tên thẻ đặt theo VAI TRÒ, không theo cỡ.** `cardTitle`, không phải `text16`.
   Đặt theo cỡ thì ngày chỉnh thang, mọi tên đều nói dối.
2. **Màn hình nghiệp vụ chỉ dùng `TYPE`.** Bảy nhóm nguyên thuỷ là để dựng nên
   `TYPE` và để tài liệu quy chiếu — không phải để gọi rải rác.
3. **Chuỗi phải nguyên vẹn.** Không ghép `text-[${n}px]`; Tailwind quét bằng
   biểu thức chính quy, nó không chạy JavaScript.
4. **Khả năng tiếp cận là ràng buộc, không phải gợi ý.**

---

## 2. HỌ CHỮ

| Thẻ | Lớp | Dùng cho |
|---|---|---|
| `FONT_FAMILY.sans` | `font-sans` | Toàn bộ giao diện |
| `FONT_FAMILY.mono` | `font-mono` | Mã chứng từ, mã cuộn, thông số kỹ thuật |

**Bộ chữ chính thức: `Inter Variable`** *(Board chốt 03/08/2026)*.

`font-sans` **không** trỏ thẳng vào tên phông. Nó trỏ vào biến CSS
`--font-sans`, do `next/font` đặt ở [`app/layout.tsx`](../../app/layout.tsx) và
được [`tailwind.config.ts`](../../tailwind.config.ts) đọc lại.

```
next/font  →  --font-sans  →  Tailwind font-sans  →  TYPE.*  →  màn hình
```

> ### ⚠️ Vì sao lớp gián tiếp này quan trọng
>
> Giai đoạn 2 đổi nguồn phông từ `next/font/google` sang `next/font/local` chỉ
> phải sửa **ba dòng** trong `app/layout.tsx`. `tailwind.config.ts`,
> `lib/design/typography.ts` và **cả 115 màn hình** không phải đụng tới.
>
> Nếu thẻ chữ viết thẳng `font-[Inter]` thì Giai đoạn 2 sẽ là một đợt sửa toàn
> kho — đúng thứ Board yêu cầu tránh khi nói *"without changing the token
> architecture"*.

### Trạng thái Giai đoạn 2

⚠️ **Đang chờ tệp phông.** Kho hiện **không có tệp `.woff2` nào**; `public/` chỉ
chứa `MONICA.png`. Cần đặt `InterVariable.woff2` vào `app/fonts/`, sau đó:

```ts
import localFont from 'next/font/local';
const inter = localFont({
  src: './fonts/InterVariable.woff2',
  variable: '--font-sans',
  display: 'swap',
});
```

**Vì sao phải tự lưu trữ:** `next/font/google` tải phông lúc **build**. Bản dựng
phụ thuộc một máy chủ ngoài — máy chủ đó hỏng hoặc bị chặn ở mạng nhà máy thì
bản dựng hỏng theo.

---

## 3. ĐỘ ĐẬM — ĐÚNG BỐN BẬC

| Thẻ | Lớp | Số | Dùng cho |
|---|---|---|---|
| `regular` | `font-normal` | 400 | Thân bài, mô tả |
| `medium` | `font-medium` | 500 | Nhãn, ô bảng cần nổi nhẹ |
| `semibold` | `font-semibold` | 600 | Tiêu đề thẻ, tiêu đề mục |
| `bold` | `font-bold` | 700 | Tiêu đề trang, số liệu lớn |

⚠️ **Bốn, không phải chín.** Bản cũ dùng cả chín bậc Tailwind. Ở chín bậc, mắt
không phân biệt nổi `medium` với `semibold`, nên chúng **thôi mang thông tin**.
Bốn bậc cách nhau đủ xa để mỗi bậc nói một điều khác nhau.

---

## 4. THANG CỠ CHỮ — MƯỜI BẬC

| Thẻ | px | Ghi chú |
|---|---|---|
| `micro` | 11 | ⚠️ **CHỈ** cho nhãn CHỮ HOA có giãn chữ |
| `caption` | 12 | Chú thích, chữ trợ giúp |
| `bodySm` | 13 | Chữ phụ |
| `body` | 14 | **Mặc định** |
| `bodyLg` | 16 | Đoạn dẫn |
| `title` | 18 | Tiêu đề mục nhỏ |
| `titleLg` | 22 | Tiêu đề mục |
| `display` | 28 | Tiêu đề trang |
| `displayLg` | 36 | Chữ hiển thị |
| `displayXl` | 48 | Chữ hiển thị lớn nhất |

**Đã loại bỏ:** `9px` · `9,5px` · `10px` · `10,5px` · `12,5px` · `15px` · `17px`
· `26px` · `38px`.

⚠️ **Thang dừng ở 11px.** `9px` và `9,5px` nằm dưới ngưỡng đọc được của người
trên 40 tuổi dưới ánh đèn cao áp — mà ngành may thì phần lớn quản đốc ở độ tuổi đó.

⚠️ **Không còn nửa pixel.**

---

## 5. GIÃN DÒNG

| Thẻ | Giá trị | Dùng cho |
|---|---|---|
| `tight` | 1.05 | Chữ hiển thị rất lớn |
| `snug` | 1.2 | Tiêu đề |
| `normal` | 1.35 | Tiêu đề nhỏ, nhãn |
| `relaxed` | 1.6 | Thân bài |

**Quy luật: chữ càng lớn thì giãn dòng càng chặt.** Tiêu đề 48px để giãn 1,6 sẽ
rời ra thành mấy dòng không liên quan; thân bài 14px để 1,1 thì các dòng dính
nhau và mắt lạc dòng khi xuống hàng.

---

## 6. GIÃN CHỮ

| Thẻ | Giá trị | Dùng cho |
|---|---|---|
| `tighter` | −0.03em | Chữ hiển thị rất lớn |
| `tight` | −0.015em | Tiêu đề |
| `normal` | 0 | Thân bài |
| `wide` | +0.08em | Nhãn CHỮ HOA nhỏ |
| `wider` | +0.16em | Chữ dẫn, nhãn hệ thống |

**Quy luật: bóp âm ở cỡ lớn, nới dương ở cỡ nhỏ.** Giãn chữ mặc định của phông
được thiết kế cho cỡ thân bài; giữ nguyên khi phóng to thì chữ cái rời rạc, giữ
nguyên khi thu nhỏ thì chúng dính nhau.

---

## 7. CHỮ SỐ — MỤC QUAN TRỌNG NHẤT VỚI PHẦN MỀM NHÀ MÁY

| Thẻ | Lớp | Dùng cho |
|---|---|---|
| `NUMERIC.table` | `tabular-nums` | **Mọi** số trong bảng và danh sách |
| `NUMERIC.metric` | `tabular-nums` | Số liệu lớn ở thẻ chỉ số |
| `NUMERIC.inline` | `proportional-nums` | Số lẫn trong câu văn xuôi |
| `NUMERIC.code` | `font-mono tabular-nums` | Mã chứng từ, mã cuộn, khoá đơn |

> ### ⚠️ `tabular-nums` không phải chi tiết thẩm mỹ
>
> Nó bắt mọi chữ số có **cùng bề ngang**. Thiếu nó, `111` hẹp hơn `999`, và một
> cột số trong bảng sẽ răng cưa — mắt **không so được** hàng nào lớn hơn hàng
> nào mà phải đọc từng con số một.
>
> Trong một bảng tồn kho 200 dòng, đó là khác biệt giữa *quét trong ba giây* và
> *đọc trong ba phút*.

**Mọi con số đo được — sản lượng, tồn kho, tiền, phần trăm, số thùng — bắt buộc
dùng `table` hoặc `metric`.**

`NUMERIC.code` dùng phông đều bề ngang vì ở đó **nhầm `0` với `O` là sai một lô hàng**.

---

## 8. THANG ĐÁP ỨNG

Chỉ **ba** vai trò lớn nhất đổi cỡ theo khổ màn hình:

| Vai trò | Điện thoại | Từ `sm` |
|---|---|---|
| `display` | 36px | 48px |
| `pageTitle` | 22px | 28px |
| `sectionTitle` | 18px | 22px |

> ### ⚠️ Thân bài KHÔNG đổi theo màn hình
>
> 14px trên điện thoại và 14px trên màn 27 inch là **đúng**, vì khoảng cách mắt
> tới màn hình cũng khác nhau tương ứng.
>
> Thu nhỏ thân bài trên điện thoại là lỗi kinh điển: nó làm chữ khó đọc **đúng
> lúc điều kiện đọc tệ nhất** — ngoài trời, cầm một tay, đứng trên sàn xưởng.

---

## 9. QUY TẮC KHẢ NĂNG TIẾP CẬN

| Quy tắc | Giá trị | Lý do |
|---|---|---|
| Cỡ nhỏ nhất cho chữ ĐỌC | **12px** | Dưới mức này chỉ cho nhãn CHỮ HOA |
| Điều kiện dùng `micro` (11px) | CHỮ HOA **+** đậm ≥ 600 **+** giãn ≥ 0.08em | Ba thứ đó bù lại phần cỡ bị mất |
| Cỡ nhỏ nhất cho ô nhập | **16px** | Safari trên iOS **tự phóng to cả trang** khi chạm ô chữ nhỏ hơn 16px, và trang đã phóng thì không tự thu lại |
| Độ tương phản | AA — 4,5:1 chữ nhỏ · 3:1 chữ lớn | Xem `lib/design/tokens.ts` |

⚠️ **Dùng 11px cho câu thường là vi phạm**, kể cả khi trông vẫn đọc được trên
màn hình của người thiết kế.

---

## 10. THẺ VAI TRÒ — CỬA VÀO DUY NHẤT

| Thẻ | Cỡ | Đậm | Ghi chú |
|---|---|---|---|
| `TYPE.display` | 36 → 48 | 700 | Trang chủ, màn hình chào |
| `TYPE.pageTitle` | 22 → 28 | 700 | `h1` |
| `TYPE.sectionTitle` | 18 → 22 | 600 | `h2` |
| `TYPE.cardTitle` | 16 | 600 | `h3` |
| `TYPE.bodyLg` | 16 | 400 | Đoạn dẫn |
| `TYPE.body` | 14 | 400 | **Mặc định** |
| `TYPE.bodySm` | 13 | 400 | Chữ phụ |
| `TYPE.caption` | 12 | 400 | Chú thích |
| `TYPE.label` | 13 | 500 | Nhãn biểu mẫu |
| `TYPE.overline` | 11 | 600 | CHỮ HOA · giãn 0.16em |
| `TYPE.metric` | 28 | 700 | `tabular-nums` |
| `TYPE.metricSm` | 14 | 500 | `tabular-nums` |
| `TYPE.tableHeader` | 12 | 600 | CHỮ HOA · giãn 0.08em |
| `TYPE.tableCell` | 13 | 400 | `tabular-nums` |
| `TYPE.code` | 12 | 500 | `font-mono` · `tabular-nums` |
| `TYPE.input` | **16** | 400 | Bắt buộc — xem §9 |

### Cách dùng

```tsx
import { TYPE } from '@/lib/design/typography';

<h2 className={`${TYPE.sectionTitle} text-slate-900`}>Sản lượng hôm nay</h2>
<p className={`${TYPE.bodySm} text-slate-500`}>Cập nhật lúc 14:30</p>
<td className={`${TYPE.tableCell} text-slate-700`}>1.248</td>
```

Thẻ chữ cấp **thang chữ**; màu vẫn lấy từ `lib/design/tokens.ts`. Hai hệ tách
nhau có chủ ý: một chữ có thể mang bất kỳ màu nào, và ngược lại.

---

## 11. CƯỠNG CHẾ

Mục ⑩ của bài kiểm kiến trúc chặn thang chữ đặt tại chỗ trong `app/` và
`components/`. Chạy **không cần CSDL** nên nằm ở tầng `kiem-tra-tinh` của CI.

**Cơ chế bánh cóc:** 115 tệp đang nợ đóng băng trong
[`type-debt-baseline.json`](../../tests/architecture/type-debt-baseline.json).
Tệp **MỚI** vi phạm ⇒ **HỎNG**. Danh sách chỉ được **ngắn đi**.

Chuyển xong một tệp thì **gỡ tên nó khỏi danh sách trong cùng commit** — bài
kiểm sẽ nhắc nếu quên.

### Đã chứng minh phép kiểm có răng thật

Tạo một tệp mới chứa `text-2xl font-black bg-emerald-200` ⇒ **cả hai** mục ⑨ và
⑩ đều HỎNG và gọi đúng tên tệp; xoá tệp ⇒ xanh lại.

> Một phép kiểm chưa bao giờ thấy đỏ là một phép kiểm **chưa được chứng minh**.

### Phạm vi chặn — hẹp một cách có chủ ý

| Chặn | Không chặn |
|---|---|
| `text-[..px]` · `text-xs…text-9xl` | `text-center` · `text-left` |
| `font-normal…font-black` | `truncate` · `line-clamp-*` |
| `leading-*` | `uppercase` · `italic` |
| `tracking-*` | `text-<màu>-<bậc>` *(việc của mục ⑨)* |

Bốn nhóm bên trái **dựng nên thang chữ**. Nhóm bên phải là bố cục và ngữ nghĩa.
Chặn cả chúng sẽ biến quy tắc thành thứ không ai theo nổi — mà quy tắc không thể
tuân thủ thì người ta tắt nó đi.

---

## 12. LỘ TRÌNH

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| **1** | Hệ thẻ chữ, độc lập với tệp phông · đặc tả · cưỡng chế | ✅ **Xong** |
| **2** | Chuyển sang `next/font/local` + `InterVariable.woff2` | ⏸ **Chờ tệp phông từ Board** |
| **3** | Chuyển 115 tệp sang thẻ chữ, cùng nhịp với [TD-07](../TECHNICAL_DEBT.md#td-07) | ⏳ Chưa bắt đầu |

⚠️ Giai đoạn 3 **chưa được phép bắt đầu**: Board đã chỉ thị *không làm lại giao
diện theo từng trang cho tới khi nền móng Design System hoàn tất*. Còn thiếu
[TD-11 · Iconography](../TECHNICAL_DEBT.md#td-11) và
[TD-12 · Motion](../TECHNICAL_DEBT.md#td-12).

---

## 13. THAM CHIẾU

| Nguồn | Nội dung |
|---|---|
| [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) | Điều 44 — Enterprise Visual Identity · §44.7 Accessibility |
| [`adr/ADR-009`](../adr/ADR-009-enterprise-design-system.md) | Hệ thẻ màu — anh em của tài liệu này |
| [`TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) | TD-10 · TD-07 · TD-11 · TD-12 |
| [`UI_UX_STANDARDS.md`](../UI_UX_STANDARDS.md) | Bố cục một phân hệ |
