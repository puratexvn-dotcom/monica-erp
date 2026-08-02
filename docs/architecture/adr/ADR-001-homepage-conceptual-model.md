# ADR-001 — Homepage Conceptual Model

| Trường | Giá trị |
|---|---|
| **Số hiệu** | ADR-001 *(chuỗi Constitutional ADR — xem [README](README.md))* |
| **Tiêu đề** | Homepage Conceptual Model |
| **Trạng thái** | ✅ **ACCEPTED** |
| **Ngày quyết định** | 2026-08-03 |
| **Thẩm quyền** | MONICA ONE Architecture Board |
| **Điều khoản chịu tác động** | Điều 13 · §17.3 · §34.1 · Glossary |
| **Hiến pháp sau sửa đổi** | [`00-CONSTITUTION.md`](../00-CONSTITUTION.md) — Version **1.1** |

---

## 1. Background

Hiến pháp v1.0 định nghĩa Trang chủ tại **Điều 13** là *Business Workspace Launcher*.

Song song, **§17.3** phát biểu:

> Global Services shall not become Business Workspaces.

và **§34.1** phát biểu:

> Platform Services are infrastructure capabilities. They are not Business Workspaces.

Bản triển khai ngày 02/08/2026 dựng trang chủ thành mười sáu thẻ: mười một Business
Workspace hiến định, cộng năm dịch vụ toàn cục — Business Reporting · Business
Communication · AI Assistant · Documents · Platform Services.

---

## 2. Problem

Ba điều khoản trên, đọc liền nhau, sinh ra một suy luận sai:

```
Điều 13   Trang chủ là bộ khởi chạy Business Workspace
§17.3     Global Service không được TRỞ THÀNH Business Workspace
──────────────────────────────────────────────────────────────
suy ra    Global Service không được xuất hiện trên trang chủ
```

Bước suy luận cuối **không đứng vững**. Nó lẫn lộn hai khái niệm khác hẳn nhau:

| | Câu hỏi nó trả lời | Ai quyết |
|---|---|---|
| **Phân loại** | *Thứ này LÀ gì?* | Hiến pháp |
| **Lối vào** | *Người dùng ĐI VÀO nó từ đâu?* | Kiến trúc thông tin |

Một dịch vụ toàn cục hiện trên trang chủ vẫn **là** dịch vụ toàn cục — y như một cánh
cửa mở vào nhà kho không biến hành lang thành nhà kho.

**Bằng chứng đo được.** Vận hành theo cách đọc sai ở trên đã làm mất lối vào thật:

- `/admin` (Platform Services) chỉ có **đúng một** lối vào trong toàn bộ giao diện là
  thẻ trên trang chủ. `components/sidebar.tsx` có mục `/admin` nhưng thành phần này
  **không được gắn ở bất kỳ layout nào** — kiểm bằng `grep` cho một kết quả duy nhất,
  và đó là một lệnh `import { NAV_ITEMS }` để đọc nhãn, không phải để dựng thanh bên.
- Gỡ thẻ trang chủ ⇒ Quản trị hệ thống **không còn đường vào** phân hệ quản trị.

Một cách đọc Hiến pháp mà thi hành xong thì hệ thống mất một lối vào vận hành là cách
đọc cần được sửa, không phải hệ thống cần bị cắt.

---

## 3. Decision

Trang chủ được định nghĩa là

> ### Business Operating System Launcher

thay cho *Business Workspace Launcher*.

MONICA ONE là một **Business Operating System**. Trang chủ là **lối vào hợp nhất** của
hệ điều hành nghiệp vụ đó. Nó cấp lối vào:

- **Business Workspaces**
- **Global Services**
- **Platform Services**

theo ba yếu tố, đúng chuỗi phân quyền hiến định:

- **Authorization** — người dùng được cấp quyền gì
- **Assignment** — Monica đã giao việc gì cho người đó
- **Operational Context** — người đó đang ở tình huống vận hành nào

**Nguyên tắc phân định, phát biểu một lần cho dứt điểm:**

> Việc một Global Service hay Platform Service xuất hiện trên Trang chủ **KHÔNG** làm
> thay đổi phân loại hiến định của nó.
>
> **Homepage is an Entry Point. It is NOT a classification mechanism.**

Bản thân Trang chủ không phải Business Workspace, không phải Global Service, cũng
không phải Platform Service.

---

## 4. Alternatives Considered

### Phương án A — Giữ nguyên Hiến pháp, gỡ 5 dịch vụ khỏi trang chủ

Trang chủ còn 11 thẻ Business Workspace. Dịch vụ toàn cục vào bằng thanh dưới, header
và Context Rail.

**Vì sao không chọn.** Đã dựng thử và đo: `/admin` mất sạch lối vào (xem §2). Phải chế
thêm một nút bánh răng ở header chỉ để bù lại thứ vừa gỡ đi — tức là vẫn đặt Platform
Services vào một lối vào toàn cục, chỉ khác chỗ và khó tìm hơn. Phương án này trả giá
bằng khả năng dùng được mà **không** giải quyết được điều gì về mặt khái niệm: mâu
thuẫn Điều 13 ↔ §17.3 vẫn nguyên vẹn, chỉ là tạm thời không ai chạm vào.

### Phương án B — Đổi phân loại 5 dịch vụ thành Business Workspace

Sửa §17.2 và §34.3, chuyển Business Reporting · Business Communication · AI Assistant
· Documents · Platform Services thành Business Workspace hiến định.

**Vì sao không chọn.** Phá thẳng §17.3 và §7 (One Platform). Dịch vụ toàn cục sở dĩ
dùng lại được ở **mọi** Workspace là vì nó **không thuộc** Workspace nào. Biến chúng
thành Workspace là mời gọi mỗi Workspace tự dựng bản Chat riêng, bản Báo cáo riêng —
đúng thứ phân mảnh mà §17.8 cấm. Giá phải trả nằm ở tầng kiến trúc, không phải giao diện.

### Phương án C — Trang chủ hai vùng: "Workspaces" và "Services"

Giữ nguyên Điều 13, thêm một vùng thứ hai có tiêu đề riêng cho dịch vụ toàn cục.

**Vì sao không chọn.** Lách chữ chứ không giải mâu thuẫn: nếu §17.3 thật sự cấm dịch vụ
toàn cục xuất hiện trên trang chủ thì đặt chúng dưới một tiêu đề khác cũng vẫn là vi
phạm. Ngoài ra nó dựng lại đúng mô hình chia nhóm mà quyết định trước đó đã bỏ: tiêu đề
nhóm chỉ có nghĩa với người đã thuộc hệ thống; với người mở lần đầu nó là chướng ngại
phải đọc trước khi thấy thứ cần bấm.

### Phương án D — Định nghĩa lại Trang chủ là Business Operating System Launcher ✅

Sửa **khái niệm sai**, không sửa **hệ quả của nó**.

**Vì sao chọn.** Đây là phương án duy nhất khiến ba điều khoản cùng đúng một lúc mà
không phải hy sinh điều nào: Điều 13 nói về **lối vào**, §17.3 và §34.1 nói về **phân
loại**, và hai trục đó vốn độc lập với nhau. Không mất lối vào nào. Không dịch vụ nào
bị đổi hạng. Không phải chế thêm cơ chế điều hướng bù.

---

## 5. Consequences

### Lợi ích

- **Không mất lối vào.** Cả 16 mục giữ nguyên lối vào chính; `/admin` vẫn tới được.
- **Mâu thuẫn khép lại tận gốc.** Điều 13 ↔ §17.3 ↔ §34.1 không còn chỗ đọc lệch.
- **Trang chủ nói đúng tên sản phẩm.** MONICA ONE tự nhận là Business Operating System;
  từ nay trang đầu tiên người dùng thấy cũng mang đúng khái niệm ấy.
- **Khoảng cách triển khai Điều 13 khép lại.** Đây là một trong bốn khoảng cách Board
  ghi nhận còn mở tại Quyết nghị v1.0.

### Đánh đổi

- **Trang chủ dài hơn.** 16 thẻ thay vì 11. Lưới phẳng 2 · 3 · 4 cột giữ nguyên, chỉ
  thêm hàng — đổi lại là không có tiêu đề nhóm nào phải đọc.
- **Ranh giới mới phải được canh.** "Lối vào" không phải giấy phép nhét bất cứ thứ gì
  lên trang chủ. §13.4 (Information Simplicity) và §13.5 (Visibility) vẫn là hàng rào;
  mọi mục mới vẫn phải qua ADR.

### Nợ kỹ thuật ghi nhận

| # | Nội dung | Trạng thái |
|---|---|---|
| **TD-04** | `components/sidebar.tsx` khai mười mục điều hướng nhưng **không được gắn ở layout nào**. Đây là mã chết đang giả dạng lối vào — nó chính là thứ khiến `/admin` trông như có nhiều đường vào trong khi thực tế chỉ có một. | 🟡 Mở |
| **TD-05** | §13.5 đòi trang chủ **chỉ hiện thứ người dùng được phép vào**. Bản đang chạy hiện đủ 16 thẻ cho mọi người; chặn thật nằm ở middleware và guard. Đúng về bảo mật, chưa đúng về Điều 13. | 🟡 Mở |
| **TD-06** | Tên 16 mục và toàn bộ chữ trên trang chủ chưa đi qua `lib/i18n`. Bộ chọn VN · EN · CN vẫn chạy, nhưng nhãn phân hệ không đổi theo. | 🟡 Mở |

---

## 6. Architecture Diagram

### Trước — lối vào bị nhầm thành phân loại

```
                      ┌──────────────────────┐
                      │       HOMEPAGE       │
                      │  "Workspace Launcher"│
                      └──────────┬───────────┘
                                 │  chỉ Business Workspace
                                 ▼
             ┌───────────────────────────────────┐
             │  11 × Business Workspace          │
             └───────────────────────────────────┘

   Global Service ─── ✗ bị suy ra là "không được lên trang chủ"
   Platform Service ─ ✗ /admin MẤT LỐI VÀO
```

### Sau — hai trục tách rời

```
                      ┌────────────────────────────────────┐
                      │             HOMEPAGE               │
                      │  Business Operating System Launcher│
                      │      — ENTRY POINT, not a class —  │
                      └────────────────┬───────────────────┘
                                       │
              lọc theo: Authorization · Assignment · Operational Context
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌────────────────────┐    ┌────────────────────────┐    ┌────────────────────┐
│ BUSINESS WORKSPACE │    │    GLOBAL SERVICE      │    │  PLATFORM SERVICE  │
│      §16.2         │    │  §29 · §30 · §31 · §33 │    │        §34         │
├────────────────────┤    ├────────────────────────┤    ├────────────────────┤
│ Executive Center   │    │ Business Reporting     │    │ Platform Services  │
│ Commercial         │    │ Business Communication │    │                    │
│ Merchandising      │    │ AI Assistant           │    │                    │
│ Planning           │    │ Documents              │    │                    │
│ Production         │    │                        │    │                    │
│ Quality            │    │                        │    │                    │
│ Warehouse          │    │                        │    │                    │
│ Shipment           │    │                        │    │                    │
│ Subcontract        │    │                        │    │                    │
│ Finance            │    │                        │    │                    │
│ Human Resources    │    │                        │    │                    │
└────────────────────┘    └────────────────────────┘    └────────────────────┘

  TRỤC PHÂN LOẠI giữ nguyên — xuất hiện trên Launcher KHÔNG đổi được ô nào ở trên.

  Lối vào KHÔNG chỉ có một: dịch vụ toàn cục vẫn vào được từ Bottom Navigation
  (Chat · Báo cáo · A.I · Hướng dẫn), Top Header và Order Context Rail. Trang chủ
  là lối vào HỢP NHẤT, không phải lối vào DUY NHẤT.
```

---

## 7. Rollback Impact

Quay lui về mô hình *Business Workspace Launcher* đòi hỏi, không thiếu bước nào:

1. Hoàn nguyên Điều 13 · §17.3 · §34.1 · Glossary về Hiến pháp v1.0.
2. Gỡ 5 mục khỏi `MODULES` trong `app/home-modules.ts`.
3. **Dựng lại lối vào thay thế cho `/admin`** — nếu không, Quản trị hệ thống mất
   đường vào (đây là bước dễ quên nhất, và là bước đắt nhất).
4. Viết ADR mới đánh dấu ADR-001 *Superseded*.

Không có migration, không đụng lược đồ, không đụng RLS. Rủi ro quay lui nằm ở **khả
năng dùng được**, không nằm ở dữ liệu.

---

## 8. Status

**ACCEPTED** — Architecture Board, 2026-08-03.

Hiến pháp đã sửa đổi và ban hành ở **Version 1.1**.

---

## 9. Revision History

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-08-03 | Architecture Board | Ban hành ADR-001. Trang chủ định nghĩa lại là **Business Operating System Launcher**. Sửa đổi Điều 13 · §17.3 · §34.1 · Glossary. Hiến pháp lên Version 1.1. Ghi nhận TD-04 · TD-05 · TD-06. |

---

## 10. References

| Nguồn | Nội dung liên quan |
|---|---|
| [`00-CONSTITUTION.md`](../00-CONSTITUTION.md) | Điều 13 (Homepage) · §17.3 (Workspace Independence) · §34.1 (Platform Services) · Glossary |
| [`../MONICA_CONSTITUTION.md`](../../MONICA_CONSTITUTION.md) | 12 nguyên tắc đang có hiệu lực |
| [`../ENGINEERING_PLAYBOOK.md`](../../ENGINEERING_PLAYBOOK.md) | Điều XXX — phân quyền theo Assignment |
| [`../UI_UX_STANDARDS.md`](../../UI_UX_STANDARDS.md) | §9 — cấu trúc một phân hệ |
| [`../TECHNICAL_DEBT.md`](../../TECHNICAL_DEBT.md) | Sổ theo dõi TD-04 · TD-05 · TD-06 |
| `app/home-modules.ts` · `app/page.tsx` · `app/top-navbar.tsx` | Nơi quyết định này được thi hành |
