# ENTERPRISE DESIGN SYSTEM — MONICA ONE

> **Cửa vào duy nhất của mọi quyết định thị giác.**
> Mọi màn hình hiện tại và tương lai phải dẫn xuất từ đây.

| Trường | Giá trị |
|---|---|
| **Thẩm quyền** | Hiến pháp `v1.5` · [Điều 44](../architecture/00-CONSTITUTION.md) — Enterprise Visual Identity |
| **ADR nền tảng** | [ADR-009](../adr/ADR-009-enterprise-design-system.md) |
| **Trạng thái** | 🟡 Nền móng đang dựng — 2/4 trụ đã xong |

---

## 0. HỆ NÀY GỒM BỐN TRỤ

§44.8 nói rõ: màu, chữ, biểu tượng và chuyển động là **bốn thành phần của MỘT
ngôn ngữ**, không phải bốn hệ độc lập.

| Trụ | Thẻ | Đặc tả | Cưỡng chế | Trạng thái |
|---|---|---|---|---|
| **Màu** | [`lib/design/tokens.ts`](../../lib/design/tokens.ts) | [ADR-009](../adr/ADR-009-enterprise-design-system.md) | `arch.test` mục ⑨ | ✅ Xong |
| **Chữ** | [`lib/design/typography.ts`](../../lib/design/typography.ts) | [Đặc tả chữ](TYPOGRAPHY_SPECIFICATION.md) | `arch.test` mục ⑩ | ✅ Thẻ xong · [TD-10](../TECHNICAL_DEBT.md#td-10) |
| **Biểu tượng** | — | — | — | ⏳ [TD-11](../TECHNICAL_DEBT.md#td-11) |
| **Chuyển động** | — | — | — | ⏳ [TD-12](../TECHNICAL_DEBT.md#td-12) |

Thêm một trụ ngang hàng, không thuộc Điều 44 nhưng ràng buộc mọi component:

| | Nguồn | Đặc tả | Cưỡng chế | Trạng thái |
|---|---|---|---|---|
| **Ngôn ngữ** | [`messages/`](../../messages) · [`lib/i18n.tsx`](../../lib/i18n.tsx) | Hiến pháp Điều 45 | `arch.test` mục ⑪ | ✅ Kiến trúc xong · [TD-13](../TECHNICAL_DEBT.md#td-13) |

---

## 1. QUY TẮC BẤT DI BẤT DỊCH

1. **Không viết thẳng giá trị thị giác vào màn hình nghiệp vụ.** Màu, cỡ chữ,
   độ đậm, giãn dòng, giãn chữ — tất cả lấy từ thẻ.
2. **Chuỗi lớp phải nguyên vẹn.** Không ghép `bg-${x}-50` hay `text-[${n}px]`.
   Tailwind quét bằng biểu thức chính quy, nó **không chạy JavaScript**.
3. **`lib/**` phải nằm trong danh sách quét** của `tailwind.config.ts`. Thiếu là
   mất sạch màu và cỡ chữ ở bản dựng thật, trong khi dev vẫn đủ.
4. **Khả năng tiếp cận là ràng buộc**, không phải gợi ý (§44.7 · §45).
5. **Mọi chuỗi hiển thị đi qua `t()`**; từ vựng hiến định không bao giờ dịch.

---

## 2. MỘT COMPONENT ĐẠT CHUẨN PHẢI CÓ ĐỦ SÁU THỨ

Theo chỉ thị Board 03/08/2026:

| # | Yêu cầu | Lấy từ đâu |
|---|---|---|
| 1 | **Danh tính màu** | `MODULE_IDENTITY` · `STATUS` |
| 2 | **Đa ngôn ngữ** | `useLanguage().t()` |
| 3 | **Khả năng tiếp cận** | tương phản AA · vùng chạm ≥ 44px · không chỉ dựa vào màu |
| 4 | **Đáp ứng** | thang `RESPONSIVE`, thân bài KHÔNG đổi theo màn hình |
| 5 | **Sẵn sàng chế độ tối** | ⏳ chưa có — xem §5 |
| 6 | **Sẵn sàng đổi chủ đề** | ⏳ chưa có — xem §5 |

Mẫu đối chiếu: [`components/ui/status-chip.tsx`](../../components/ui/status-chip.tsx)
— đạt (1) (3) (4); còn thiếu (2) (5) (6).

---

## 3. CÁCH DÙNG

```tsx
import { MODULE_IDENTITY, STATUS, ELEV_REST } from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';
import { useLanguage } from '@/lib/i18n';

const id = MODULE_IDENTITY.production;
const { t } = useLanguage();

<div className={`rounded-2xl bg-white ${ELEV_REST}`}>
  <span className={`h-1 w-full ${id.bar}`} />
  <h3 className={`${TYPE.cardTitle} text-slate-900`}>{t('nav.reports')}</h3>
  <p className={`${TYPE.bodySm} text-slate-500`}>{t('empty.noData')}</p>
</div>
```

Ba hệ **tách nhau có chủ ý**: một chữ có thể mang bất kỳ màu nào, và ngược lại.
Gộp chúng thành một thẻ "cardTitleProduction" sẽ sinh ra tổ hợp bùng nổ.

---

## 4. CƯỠNG CHẾ — CƠ CHẾ BÁNH CÓC

Ba mục của `npm run test:arch` gác Design System. Tất cả chạy **không cần CSDL**
nên nằm ở tầng `kiem-tra-tinh` của CI và gác mọi push.

| Mục | Chặn | Sổ nợ | Đang nợ |
|---|---|---|---|
| ⑨ | màu định danh viết thẳng | `color-debt-baseline.json` | 108 tệp |
| ⑩ | thang chữ đặt tại chỗ | `type-debt-baseline.json` | 115 tệp |
| ⑪ | khoá dịch lệch / từ hiến định bị dịch | — | 0 |

**Bánh cóc, không phải cổng chặn.** Tệp MỚI vi phạm ⇒ HỎNG. Sổ nợ chỉ được
**ngắn đi**. Đặt ngưỡng 0 khi thực tế là 108 thì bài kiểm đỏ vĩnh viễn, mà bài
kiểm đỏ vĩnh viễn thì người ta ngừng đọc nó.

> **Đã chứng minh cả ba mục có răng thật**, không phải chỉ chạy xanh: tạo một
> tệp mới chứa `text-2xl font-black bg-emerald-200` ⇒ ⑨ và ⑩ đều HỎNG và gọi
> đúng tên tệp. Bánh cóc ⑩ còn bắt được **chính tệp do tôi viết ra**
> (`home-content.tsx`) và buộc phải sửa bằng thẻ.

---

## 5. NHỮNG THỨ CHƯA CÓ — NÓI THẲNG

| Thiếu | Hệ quả | Theo dõi ở |
|---|---|---|
| Hệ biểu tượng | 22 cỡ · **8 độ dày nét** trên 105 tệp | [TD-11](../TECHNICAL_DEBT.md#td-11) |
| Hệ chuyển động | 4 thời lượng · **0 khai báo `prefers-reduced-motion`** | [TD-12](../TECHNICAL_DEBT.md#td-12) |
| Chế độ tối | chưa có lớp ngữ nghĩa nào cho bề mặt | chưa mở |
| Đổi chủ đề | thẻ màu đang cứng, chưa qua biến CSS | chưa mở |

⚠️ **`prefers-reduced-motion` là lỗi khả năng tiếp cận, không phải thiếu sót
thẩm mỹ.** Người rối loạn tiền đình có thể chóng mặt thật khi giao diện chuyển
động mà không tôn trọng thiết lập hệ điều hành.

⚠️ **Chế độ tối sẽ đòi tái cấu trúc thẻ màu**: hiện `MODULE_IDENTITY` khoá cứng
sắc độ (`bg-blue-50`). Muốn có chế độ tối thì mỗi vai trò phải trỏ qua một biến
CSS, giống cách `--font-sans` đang làm với bộ chữ. Làm sớm thì rẻ; làm sau khi
đã chuyển 108 tệp thì phải chuyển lại lần nữa.

---

## 6. THỨ TỰ THI HÀNH ĐƯỢC BOARD DUYỆT

```
TD-08 ✅ → TD-10 🟡 → TD-07 ⏳ → TD-09 ⏳
                ↑
        đang ở đây (thẻ xong, chuyển đổi chưa)
```

Ngoài trình tự: TD-11 · TD-12 · TD-13.

**Không cho phép làm lại giao diện theo từng trang cho tới khi nền móng hoàn
tất.** Nền móng = bốn trụ ở §0.

---

## 7. THAM CHIẾU

| Nguồn | Nội dung |
|---|---|
| [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) | Điều 44 (13 khoản) · Điều 45 (8 khoản) |
| [`ADR-009`](../adr/ADR-009-enterprise-design-system.md) | Vì sao có hệ thẻ · 4 phương án đã cân nhắc |
| [`TYPOGRAPHY_SPECIFICATION.md`](TYPOGRAPHY_SPECIFICATION.md) | 13 mục · bản đồ chuyển đổi |
| [`TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) | TD-07 → TD-13 |
| [`UI_UX_STANDARDS.md`](../UI_UX_STANDARDS.md) | Bố cục một phân hệ |
