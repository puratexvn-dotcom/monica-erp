# Tiêu chuẩn UI/UX & Luồng dữ liệu — MONICA MOS (Manufacturing Operating System)

> Tài liệu này chắt lọc từ quá trình dựng phân hệ **Merchandiser (`/md`)**. Mọi phân hệ
> làm sau (Kho, Sản xuất, Mua hàng, QA…) phải theo đúng các quy tắc dưới đây để mười hai
> phân hệ nhìn và hành xử như một hệ thống, không phải mười hai ứng dụng ghép lại.
>
> Mỗi quy tắc đều kèm **lý do**. Quy tắc không có lý do thì người sau sẽ phá bỏ ngay lần
> đầu thấy bất tiện — mà phần lớn các quy tắc ở đây sinh ra từ một lỗi có thật.

---

## 0. BỐN RÀNG BUỘC BẤT DI BẤT DỊCH

Trước mọi thứ khác:

1. **Trang chủ luôn đủ 12 phân hệ**, thanh điều hướng dưới luôn đủ 4 nút
   (Bàn làm việc · Chat · Báo cáo · A.I). Mất một link là mất đường vào của cả một bộ phận.
2. **Không xoá logic hay file cũ.** Chỉ thêm, hoặc thay đường dùng. File chưa gắn route
   vẫn giữ (`md-legacy-client.tsx`, `md-forms.tsx`…).
3. **TypeScript nghiêm ngặt, cấm `any`.**
4. **Toàn bộ giao diện, nhãn, bảng biểu bằng tiếng Việt** chuẩn thuật ngữ ngành may.
   Mã nguồn, tên biến, tên file vẫn tiếng Anh.

---

## 1. KIẾN TRÚC LAYOUT

Thứ tự từ trên xuống, áp dụng cho **mọi** trang phân hệ:

```
┌ Top Header (sticky)  logo · tiêu đề + khẩu hiệu · [Tìm nhanh] [🔔] [Trang chủ] ┐
├ Main Action Tabs     hiện THẲNG, không bọc accordion                           ┤
├ KPI / Command Center lưới pastel, màu ngữ nghĩa, bấm được                       ┤
├ Bảng dữ liệu         mỗi bảng một vùng overflow-x-auto riêng                    ┤
├ Biểu đồ              cuối cùng                                                  ┤
└ Bottom Nav (fixed)   4 nút, z-[100], tự ẩn thông minh                          ┘
```

### 1.1 Nghiệp vụ trước, biểu đồ sau
Biểu đồ là thứ xem **một lần mỗi sáng**; danh sách đơn là thứ mở **hàng chục lần mỗi ngày**.
Đặt biểu đồ lên đầu buộc người dùng cuộn qua gần một màn hình mới tới được chỗ làm việc.

### 1.2 Không bọc khu làm việc trong accordion
Đã thử và đã gỡ. Gấp lại thì mỗi lần muốn mở một tab phải bấm thêm một nhát — với người
vào hàng chục lần mỗi ngày là hàng chục cú bấm thừa. **Thứ tự ưu tiên thể hiện bằng VỊ TRÍ,
không bằng cách giấu phần còn lại đi.**

### 1.3 Tiêu đề trang nằm ở Top Header, không nằm trong thân trang
Khối tiêu đề trong thân trang chiếm ~90px và đẩy phần nghiệp vụ xuống dưới nếp gấp màn hình.
Gộp lên header vừa lấy lại chiều cao đó, vừa cho tiêu đề dính theo khi cuộn.

Header **tra tiêu đề theo đường dẫn** (`PAGE_IDENTITY` trong
[`components/dashboard-topbar.tsx`](../components/dashboard-topbar.tsx)) chứ không nhận prop:
header dựng ở layout, mà layout không biết trang con là trang nào. Nhận prop nghĩa là mỗi
trang tự dựng lại header → mười hai bản sao lệch nhau.

**Thêm phân hệ mới thì thêm một dòng vào `PAGE_IDENTITY`, không sửa gì khác.**

### 1.4 Header ↔ nội dung trang giao tiếp bằng sự kiện window
Nút Tìm nhanh nằm ở header (cây component của layout), còn trạng thái bảng lệnh nằm trong
client component của trang — hai cây khác nhau, không có đường truyền prop. Dựng context
provider bọc cả ứng dụng chỉ để bật một hộp thoại là quá tay.

```ts
// Header phát
window.dispatchEvent(new CustomEvent('monica:open-palette'));
// Trang nghe
window.addEventListener('monica:open-palette', () => setPaletteOpen(true));
```

Nút chỉ hiện ở trang **đã dựng** bảng lệnh (danh sách `HAS_PALETTE`). Hiện nút ở trang chưa
có mà bấm vào không xảy ra gì thì tệ hơn là không có nút.

---

## 2. HỆ MÀU

### 2.1 Hai bảng màu TÁCH BIỆT — đây là quy tắc quan trọng nhất của mục này

| | Dùng cho | Ở đâu |
|---|---|---|
| **Màu thẩm mỹ** (`Tone`) | nhấn, thành công, cảnh báo chung | [`components/ui.tsx`](../components/ui.tsx) |
| **Màu nghiệp vụ** (`BIZ_TONE`) | *nội dung này thuộc nghiệp vụ nào* | [`components/md/semantic-tone.ts`](../components/md/semantic-tone.ts) |

Trộn hai khái niệm vào một bảng thì **mỗi lần đổi màu nhấn của hệ thống lại vô tình đổi luôn
ý nghĩa nghiệp vụ**.

### 2.2 Màu thương hiệu: xanh dương `blue-600`
`indigo-600` (#4f46e5) về kỹ thuật là "chàm" nhưng **mắt người dùng thấy là tím** — đã bị
phản ánh và đã đổi toàn bộ. Đổi màu thì phải đổi **cả mã hex** trong bảng màu biểu đồ, nếu
không cột và hình tròn vẫn giữ màu cũ trong khi giao diện đã đổi.

### 2.3 Bảng màu nghiệp vụ

| Nhóm | Màu | Dùng cho |
|---|---|---|
| `MATERIAL` | 🟢 emerald | Nguyên phụ liệu |
| `QUALITY` | 🔴 red | Chất lượng, lỗi, nguy kịch |
| `SHIPPING` | 🔵 blue | Giao hàng, vận tải |
| `SAMPLE` | 🟣 purple | Hàng mẫu |
| `PLANNING` | 🟠 amber | Kế hoạch, cảnh báo trễ |

Tím **chỉ** mang nghĩa hàng mẫu, không bao giờ là màu thương hiệu.

⚠️ **Đỏ (`red`) khác hồng (`rose`).** Nếu đã dùng `rose` cho "trễ tiến độ" thì dùng `red`
cho "nguy kịch" — hai thẻ cạnh nhau cùng sắc hồng là mất luôn ý nghĩa phân biệt.

### 2.4 Tương phản: ĐO, KHÔNG ĐOÁN

**Bắt buộc đo bằng thuật toán WCAG 2.1 trước khi chốt một cặp màu.** Ngưỡng AA cho chữ
thường là **4,5:1**.

Cặp an toàn đã đo:

| Cặp | Tỷ lệ |
|---|---|
| chữ trắng / `blue-600` | 5,17:1 |
| sắc độ 700 / nền 50 | 5,21 – 6,84:1 |
| sắc độ 700–800 / nền 100 | 4,84 – 6,37:1 |
| sắc độ 900 / nền 50 | 8,71 – 16,30:1 |

⚠️ **Hai cái bẫy đã sập:**
- `slate-500` trên nền pastel chỉ đạt **4,33:1** — dưới chuẩn. Nhãn và phụ đề phải là `slate-600`.
- `amber-700` trên `amber-100` chỉ đạt **4,51:1**, sát ngưỡng tới mức một lần chỉnh nhẹ là rớt.
  Hổ phách dùng sắc độ **800**.

### 2.5 Icon luôn nằm trên huy hiệu bo góc
`bg-{color}-100 text-{color}-700` trong khối `rounded-lg`/`rounded-xl`. Icon đơn sắc trên nền
trắng khiến các thẻ trông hệt nhau; huy hiệu màu cho mắt phân biệt trước cả khi đọc nhãn.

---

## 3. MOBILE-FIRST & RESPONSIVE

### 3.1 `dvh`, không bao giờ `vh`
`100vh` tính theo màn hình khi thanh địa chỉ **đã** thu lại. Lúc thanh còn hiện thì panel cao
hơn vùng nhìn thấy và ô nhập bị đẩy khỏi màn hình. `dvh` bám theo chiều cao thực tế.

Áp dụng cho: chiều cao panel, `max-h` của modal, mọi thứ đo theo màn hình.

### 3.2 Bàn phím ảo: dùng `visualViewport`, KHÔNG dùng sự kiện `focus`
Focus vào ô nhập trên máy bàn **không bật bàn phím nào** — ẩn thanh lúc đó là ẩn vô cớ.
`visualViewport.height` co lại thì chắc chắn có thứ gì đó đang chiếm chỗ thật.

Ngưỡng **25%**: thanh địa chỉ trình duyệt cũng làm viewport co 8–12%; bàn phím ảo luôn chiếm
trên 30%. Xem [`lib/use-nav-visibility.ts`](../lib/use-nav-visibility.ts).

### 3.3 Chặn cuộn ngang
```css
html, body { overflow-x: hidden; max-width: 100vw; }
p, h1..h4, li, dd, dt, span, label { overflow-wrap: anywhere; }
```
Đặt trên **cả `html` lẫn `body`** — chỉ đặt ở body thì iOS Safari vẫn sinh thanh cuộn ở tầng html.

⚠️ **Tuyệt đối không đặt `overflow` trên div bọc trung gian** — `position: sticky` bên trong sẽ
chết, mà Top Header đang dùng sticky.

`max-width: 100vw` chặn nốt phần tử con rộng hơn màn hình: `overflow-x: hidden` chỉ **giấu**
phần tràn chứ không ngăn nó đẩy rộng ra.

### 3.4 Bảng
Mỗi bảng bọc trong `div.overflow-x-auto` **riêng**, đặt `min-w` cho `<table>` để cột không bị
bóp tới mức chữ xuống dòng từng ký tự. Bảng cuộn trong lòng nó, **không** làm cuộn cả trang.

### 3.5 Khoá zoom
```ts
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1,
  maximumScale: 1, userScalable: false, viewportFit: 'cover',
};
```
⚠️ **Đánh đổi đã biết:** đi ngược WCAG 1.4.4. Chấp nhận vì đây là ứng dụng nội bộ nhà máy và
cỡ chữ nhỏ nhất là 10px ở nhãn thanh điều hướng. Lưu ý **iOS từ bản 10 vẫn bỏ qua
`user-scalable=no`** — thứ thật sự sửa lỗi "phải tự zoom" là dẹp tràn viền, không phải thẻ meta.

### 3.6 Vùng chạm
Nút bấm bằng tay: tối thiểu **44px** (`h-11 w-11`). Ô nhập trên mobile để `text-base`
(iOS tự phóng to trang khi chạm vào ô chữ nhỏ hơn 16px). Mọi nút thêm `touch-manipulation`
để bỏ độ trễ 300ms.

### 3.7 Flex và tràn viền
`min-w-0` là **bắt buộc** cho flex item chứa chữ: mặc định `min-width: auto` nên ô nhập
không co nhỏ hơn nội dung, gõ dài là tràn cả khung.

### 3.8 Thanh điều hướng và các lớp trượt
- Nav: `fixed bottom-0 left-0 w-full z-[100]`, cao `h-14`, icon 24px, chữ 10px.
- Nav **nằm trên** mọi lớp trượt (`z-[100]` > sheet `z-[60]` > PO 360 `z-[70]`).
- Lớp trượt dừng lại **phía trên** dải nav bằng biến CSS `--nav-h`:
  ```ts
  style={{ bottom: 'var(--nav-h, 3.5rem)', height: 'calc(100dvh - var(--nav-h, 3.5rem))' }}
  ```
  Nav ẩn đi thì chỗ nó nhường được panel dùng ngay, không để lại dải trống ở đáy.
- **Không tự ẩn nav khi panel đang mở** — người dùng cần nó để đóng panel; ẩn lúc đó là bẫy
  họ trong panel.
- Phần chừa chỗ ở layout gốc giữ **cố định** `pb-20`, không bám `--nav-h`: bám theo thì mỗi
  lần ẩn/hiện trang lại co giãn và nhảy mất vị trí đang đọc.

### 3.9 Panel toàn màn trên desktop
Chat và A.I dùng `size="full"`: từ `md` trở lên chiếm trọn bề ngang, **mobile không đổi gì**.

⚠️ Toàn màn **không** có nghĩa là kéo chữ dài 1920px — nội dung giới hạn `max-w-3xl` căn giữa.
Dòng quá dài thì mắt rất khó bắt đầu dòng kế tiếp.

Chế độ toàn màn bỏ lớp nền mờ (panel che kín rồi) nên **không bấm ra ngoài để đóng được** —
nút ✕ và phím `Esc` là lối thoát, cả hai phải luôn hoạt động.

---

## 4. TÍNH CHÍNH TRỰC DỮ LIỆU

> Quy tắc nền tảng nhất của cả tài liệu này.

### 4.1 `—` và `0` là hai chuyện khác hẳn nhau

| Hiển thị | Nghĩa |
|---|---|
| `—` | **Chưa có / không đọc được** dữ liệu |
| `0` | Đã đọc được, và giá trị **thật sự bằng không** |

Trong nhà máy, "không có mốc nào trễ" và "không đọc được dữ liệu mốc trễ" dẫn tới hai hành
động hoàn toàn khác nhau. Hiện `0` khi thật ra là lỗi quyền sẽ khiến người điều hành **yên
tâm nhầm**.

Vì vậy mọi trường số trong kiểu dữ liệu đều là `number | null`, và tầng service trả `null`
khi truy vấn lỗi:

```ts
runningOrders: odRes.error ? null : running.length,
```

### 4.2 Tuyệt đối không bịa số
Không mock, không placeholder, không "%tăng trưởng minh hoạ". Nếu chỉ số cần một con số so
sánh thì **tính ra từ dữ liệu thật**; không đủ dữ liệu thì nói là không đủ.

Ví dụ đã làm: trend doanh thu tính từ tháng này so với tháng trước trong bảng `orders`.
Tháng trước bằng 0 → trả `null` → giao diện hiện *"chưa có nền so sánh"*, **không** hiện
`+100%`. Chia cho 0 không ra tỷ lệ nào có nghĩa.

Báo cáo được **chụp thành ảnh gửi giám đốc** — một con số bịa sẽ nằm lại vĩnh viễn trong
nhóm chat mà không ai kiểm chứng được.

### 4.3 Nói rõ con số thiếu bao nhiêu
Doanh thu chỉ cộng đơn **đã có đơn giá**, và phụ đề ghi rõ *"chưa gồm N đơn thiếu đơn giá"*.
Coi đơn thiếu giá như 0 sẽ làm con số thấp giả tạo mà không ai biết vì sao.

### 4.4 Công thức nằm ở MỘT chỗ duy nhất
Công thức phải nhất quán giữa các màn hình thì đặt làm **cột sinh tự động trong SQL**
(`GENERATED ALWAYS AS ... STORED`), Server Action chỉ gửi thành phần đầu vào, **không** gửi
kết quả:

```sql
net_consumption NUMERIC GENERATED ALWAYS AS (consumption_per_pcs * (1 + wastage_percent/100)) STORED
total_score     NUMERIC GENERATED ALWAYS AS (material*0.35 + schedule*0.30 + quality*0.20 + capacity*0.15) STORED
```

Hai màn hình không thể ra hai con số khác nhau. Đổi công thức thì sửa đúng một chỗ.

### 4.5 Không dựng bảng "todo" song song
Việc cần làm **gom** từ nghiệp vụ có sẵn (mốc T&A quá hạn, mẫu chưa hồi âm, NPL quá ngày,
thảo luận gắn cờ việc, yêu cầu thay đổi chờ duyệt). Nhờ vậy danh sách **luôn khớp nghiệp vụ
vì nó chính là nghiệp vụ** — không có chuyện đánh dấu xong ở dashboard mà mốc vẫn treo.

### 4.6 Ngưỡng cảnh báo đặt CAO
Cảnh báo mà cái gì cũng kêu thì người vận hành ngừng đọc, tới lúc có chuyện thật lại bỏ qua.
Ngưỡng đang dùng: mốc đường găng trễ ≥3 ngày · mốc thường ≥7 · NPL ≥3 · tỷ lệ lỗi ≥5% **và**
chỉ khi đã kiểm ≥50 sản phẩm (mẫu nhỏ hơn thì tỷ lệ chưa đáng tin).

### 4.7 Lỗi phải nói ra, không nuốt
`safeQuery` trả `{ rows: [], error: string }` — một bảng hỏng **không** được kéo cả trang sang
error boundary, nhưng cũng **không** được im lặng thành danh sách rỗng. Thông báo lỗi phải
chỉ thẳng nguyên nhân và việc cần làm ("Hãy chạy migration 016 rồi thử lại").

---

## 5. HIỆU NĂNG

### 5.1 `React.memo` cho bảng nặng — nhưng phải kèm prop ổn định
Bọc memo **vô hiệu hoàn toàn** nếu prop đổi danh tính mỗi lượt vẽ. Hai lỗi đã sập:

```tsx
// SAI — hàm mũi tên trong JSX sinh danh tính mới mỗi lần vẽ
<PoList onRefresh={() => loadTab('po', true)} />

// ĐÚNG — dựng sẵn một lần
const reloaders = useMemo(() => ({ po: () => loadTab('po', true) }), [loadTab]);
<PoList onRefresh={reloaders.po} />
```

```tsx
// SAI — đối tượng mới mỗi lượt vẽ
const samByOrder: Record<string, number|null> = {};
for (const p of poRows) samByOrder[p.id] = p.sam_minutes;

// ĐÚNG
const samByOrder = useMemo(() => { /* ... */ }, [poRows]);
```

### 5.2 Đọc trạng thái qua `ref` để hàm giữ danh tính cố định
Hàm nạp dữ liệu cần biết tab nào đã nạp. Đọc thẳng 8 biến state → chúng vào danh sách phụ
thuộc → hàm đổi danh tính sau **mỗi** lần nạp → mọi bảng con vẽ lại. Đó chính là cảm giác
giật khi chuyển tab.

```ts
const loadedRef = useRef<Record<string, boolean>>({});
const loadTab = useCallback(async (key, force) => { /* đọc loadedRef.current */ }, []);
```

### 5.3 Nạp theo yêu cầu
- Thư viện biểu đồ (~100 kB) nạp bằng `next/dynamic`, **không** vào gói dùng chung.
- Dữ liệu của tab nạp khi mở tab, có nhớ đệm; nút "Tải lại" mới bỏ qua đệm.
- Chuông cảnh báo có mặt ở mọi trang → **nạp khi mở**, không nạp sẵn.

**Mốc cần giữ: gói dùng chung mọi trang ≤ 90 kB.** Hiện là 87,6 kB.

### 5.4 Gom sự kiện cuộn trong một khung hình
Sự kiện `scroll` bắn hàng chục lần mỗi giây; gọi `setState` theo từng lần là nguồn gốc giật khung.

```ts
if (ticking) return;
ticking = true;
requestAnimationFrame(apply);
window.addEventListener('scroll', onScroll, { passive: true });
```

### 5.5 Gom truy vấn, không gọi lồng theo từng dòng
Bảng 500 dòng mà gọi lồng thành 1.000 lượt đi về máy chủ. Kéo về đúng cột cần rồi ghép trong
bộ nhớ, hoặc dùng cú pháp `count` của PostgREST:

```ts
.select('id, style_no, style_colorways ( count ), style_bom ( count ), orders ( count )')
```

---

## 6. XUẤT ẢNH BÁO CÁO

### 6.1 `toBlob` + `createObjectURL`, KHÔNG dùng `toPng` + data URL
Ảnh ở `pixelRatio: 2` nặng 2–5 MB → chuỗi data URL dài vài triệu ký tự. Gán vào
`<a download>` rồi click là **nguyên nhân số một** khiến "bấm nút mà không thấy ảnh đâu":
Chrome lặng lẽ bỏ qua, Safari iOS chặn hẳn.

### 6.2 Bốn cạm bẫy còn lại
1. **Nền trắng bắt buộc** — `foreignObject` không kế thừa nền trong suốt, thiếu là ảnh ra nền đen.
2. **Gọi hai lượt** — lượt đầu của `html-to-image` thường thiếu phông và ảnh vì chúng còn đang
   tải trong bản sao vừa dựng. Bỏ lượt đầu, chỉ lấy lượt sau.
3. **Đợi trước khi chụp** — `await document.fonts.ready` + hai khung hình, để Recharts vẽ xong SVG.
4. **KHÔNG ép bề rộng khác kích thước thật.** Truyền `width: 900` trong khi khối chỉ rộng
   340px → 560px trắng bên phải. Dùng `getBoundingClientRect()` và làm tròn **lên**.

### 6.3 Vùng chụp khoá bề rộng điện thoại
`w-[390px]` cho ảnh dạng đứng gần 9:16, vừa khung xem trước Zalo, và giống hệt nhau dù người
lập báo cáo dùng điện thoại hay máy bàn. Nút bấm và thanh công cụ để **ngoài** vùng chụp.

### 6.4 Có lối lui
Trình duyệt di động có thể chặn tải tệp khởi tạo bằng mã → mở ảnh ở tab mới để người dùng
nhấn giữ và lưu. Lỗi thì **báo nguyên văn ra màn hình**, không nuốt.

---

## 7. BẢO MẬT & QUYỀN

### 7.1 Vai trò đọc từ `app_metadata`, không đọc `user_metadata`
`user_metadata` do người dùng tự ghi được → đọc vai trò từ đó là mở đường leo thang đặc quyền.

### 7.2 Mọi service/action tự chốt quyền, không dựa vào middleware
Server Action và service là endpoint có thể **bị gọi thẳng**, không nhất thiết đi qua đường
điều hướng trang. Mỗi hàm gọi `guard()` trước.

### 7.3 Service dùng chung nhiều phân hệ thì không dùng `guard()` của một phân hệ
`guard()` của `/md` chỉ cho vai trò MD. Thứ dùng chung 12 phân hệ (chuông, báo cáo) phải có
nguồn riêng chỉ đòi "đã đăng nhập", rồi **để RLS của từng bảng** quyết định người này đọc được gì.

### 7.4 `server-only` cho mọi service
Client muốn gọi thì đi qua một Server Action cầu nối. Mã truy vấn cơ sở dữ liệu không bao giờ
lọt xuống trình duyệt.

### 7.5 Lọc ở client KHÔNG phải hàng rào bảo mật
Ai mở DevTools cũng đọc được hết. Hàng rào thật là RLS.

---

## 8. QUY TRÌNH NGHIỆM THU — BẮT BUỘC TRƯỚC MỖI COMMIT

Build sạch **chưa đủ**. Nhiều lỗi thật chỉ lộ ra ở bước 4–5:
`orders.notes` không tồn tại · ràng buộc `entity_type` lệch giữa hai bảng · tương phản 4,33:1
· Tailwind cắt mất lớp màu động (giao diện ra trắng trơn mà build vẫn báo sạch).

1. `npx tsc --noEmit` sạch
2. `npx next lint` sạch
3. `npx next build` không cảnh báo
4. `npx next start` + **đăng nhập bằng tài khoản seed thật**, tải trang, kiểm chuỗi rác
   (`undefined`, `[object Object]`, `NaN`) không lọt ra HTML
5. **Đối chiếu mọi câu select/insert với CSDL đang chạy** bằng chính phiên đó (kiểm cả cột
   lẫn RLS); dựng dữ liệu thật có chủ đích để thử phép gộp, rồi **dọn sạch và xác nhận còn 0 dòng**
6. **Soi tệp CSS đã dựng** để chắc Tailwind không cắt mất lớp nào (lớp bị cắt hỏng thầm lặng)
7. **Bật lại cờ `force_password_change`** nếu đã tạm tắt để test
8. Commit bằng tiếng Việt, nêu rõ **lỗi thật đã phát hiện** và **cách kiểm chứng**

### 8.1 Migration
Người dùng **tự chạy** trên Supabase SQL Editor — không có RPC nào chạy DDL từ mã nguồn.
Migration phải **idempotent**, không xoá dữ liệu, chỉ nới rộng ràng buộc chứ không thu hẹp.
Luôn đối chiếu với **CSDL đang chạy** thay vì tin file migration.

### 8.2 Báo cáo trung thực
Nói rõ thứ **chưa kiểm được** (ví dụ: không có trình duyệt thật nên chưa xem được ảnh PNG
xuất ra). Không báo "đã xong" cho phần mới chỉ đúng về mặt mã.

---

## 9. CẤU TRÚC THƯ MỤC CHUẨN CHO MỘT PHÂN HỆ

```
app/(dashboard)/<module>/
  page.tsx                 Server Component, nạp dữ liệu lần đầu (Promise.allSettled)
  <module>-client.tsx      Client Component, giữ state và bố cục
  _services/
    guard.ts               guard() · safeQuery() · friendlyDbError() · one()
    *.service.ts           'server-only', chỉ đọc
  _actions/
    *.actions.ts           'use server', ghi + revalidatePath
    *.client.ts            cầu nối mỏng cho client gọi service
schemas/<module>/
  index.ts                 barrel — CHỈ schema, kiểu, hàm thuần. KHÔNG import Server Action
components/<module>/
  <feature>/*.tsx          tách nhỏ, không file nào ôm cả chục tab
docs/UI_UX_STANDARDS.md    tài liệu này
```

**Quy tắc đặt nhãn:** enum đặt cùng chỗ với `Record<Enum, string>` nhãn tiếng Việt.
Tra nhãn không thấy thì **hiện mã gốc**, không để trống — người vận hành còn biết mà báo lại.

---

## 10. DANH SÁCH KIỂM TRA NHANH CHO PHÂN HỆ MỚI

- [ ] Thêm dòng vào `PAGE_IDENTITY` của `dashboard-topbar.tsx`
- [ ] Layout đúng thứ tự: tab → KPI → bảng → biểu đồ
- [ ] Tab hiện thẳng, **không** bọc accordion
- [ ] Mọi bảng có `overflow-x-auto` riêng
- [ ] Mọi flex item chứa chữ có `min-w-0`
- [ ] Nút chạm tay ≥44px, có `touch-manipulation`
- [ ] Dùng `BIZ_TONE` cho màu nghiệp vụ, `Tone` cho màu thẩm mỹ
- [ ] **Đo tương phản** mọi cặp màu mới, ≥4,5:1
- [ ] Mọi trường số là `number | null`; `—` khi không đọc được
- [ ] Không mock, không placeholder, không % minh hoạ
- [ ] Bảng nặng bọc `React.memo`, prop callback dựng sẵn bằng `useMemo`
- [ ] Service có `server-only`, action có `guard()`
- [ ] Chạy đủ 8 bước nghiệm thu ở mục 8

---

*Cập nhật lần cuối: 31/07/2026 — chốt sau khi nghiệm thu phân hệ Merchandiser.*
