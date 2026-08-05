# EPIC UI-1 · AUTHENTICATION UI — ARCHITECTURE REPORT

| Trường | Giá trị |
|---|---|
| **EPIC** | **UI-1 · Authentication UI + Homepage Shell** |
| **Thẩm quyền** | Board Directive 05/08/2026 — khởi động sau khi khoá Sprint I-2 |
| **Phạm vi** | Khảo sát · phân tích phụ thuộc · đề xuất kiến trúc · backlog |
| **Ràng buộc** | ⛔ **Không viết Production Code** |
| **Ngày** | 2026-08-05 |

---

# §1 · KIẾN TRÚC HIỆN TRẠNG — `[MEASURED]`

## 1.1 Bề mặt

| Tệp | Dòng | Vai trò |
|---|---|---|
| `middleware.ts` | 174 | Chốt chặn điều hướng — **Edge Runtime** |
| `app/login/page.tsx` · `form.tsx` · `actions.ts` | 157 · 82 · 64 | Đăng nhập |
| `app/update-password/` | 80 + form | Ép đổi mật khẩu lần đầu |
| `app/unauthorized/page.tsx` | 77 | 403 |
| `app/auth/signout/route.ts` | — | Đóng phiên |
| `app/page.tsx` | 158 | **Trang chủ / Launcher** |
| `app/home-modules.ts` | 135 | Sổ đăng ký **16 thẻ** |
| `lib/rbac.ts` | 223 | `Role` · `MODULE_ACCESS` · `ROLE_HOME` · `PROTECTED_PREFIXES` |
| `components/app-bottom-nav.tsx` | 273 | 5 nút hiến định |

## 1.2 Luồng xác thực hiện tại

```
/login ──(server action)──► signInWithPassword
   │                              │
   │                    force_password_change?
   │                        ├─ có  ──► /update-password  (ép tuyệt đối)
   │                        └─ không ─► next ?? ROLE_HOME[role]
   │
   └─ ⛔ chưa gán role ⇒ signOut() + báo lỗi   ← đúng: không cho lọt

middleware (mọi request)
   0. thiếu ENV        ─► /login?error=config      (fail-closed)
   1. chưa đăng nhập   ─► /login?next=…            (chỉ khi route được bảo vệ)
   2. phải đổi mật khẩu ─► /update-password        (chặn TẤT CẢ, trước cả RBAC)
   3. sai quyền route  ─► /unauthorized?from=…
```

**Điểm mạnh đã có, ⛔ không được phá khi làm UI-1:**

| | |
|---|---|
| `getUser()` ⛔ không `getSession()` | cookie giả mạo được |
| Vai đọc từ `app_metadata` | `user_metadata` người dùng tự sửa được |
| `safeNext()` chặn open-redirect | bắt đầu `/`, ⛔ không `//`, phải là route được bảo vệ |
| Lỗi mạng ⇒ coi như **chưa đăng nhập** | hướng an toàn |
| ⛔ Không phân biệt *sai email* với *sai mật khẩu* | tránh dò email có thật |
| `/auth/*` luôn đi lọt | nếu ⛔ không, nút Đăng xuất trên `/update-password` kẹt cứng |

## 1.3 🔴 BỐN PHÁT HIỆN — `[MEASURED]`

### `UI-F1` 🔴 Trang chủ **công khai hoàn toàn**

```
grep -cE "getUser|createClient|auth" app/page.tsx  →  0
```

`app/page.tsx` là component **tĩnh, ⛔ không biết phiên**. `middleware` ⛔ không
bảo vệ `/` *(⛔ không nằm trong `PROTECTED_PREFIXES`)*.

⇒ **Bất kỳ ai trên internet đều thấy trọn bản đồ 16 phân hệ của doanh nghiệp.**

⚠️ ⛔ **Không phải rò dữ liệu** — mọi liên kết đều bị middleware chặn. Nhưng nó
**lộ cấu trúc vận hành nội bộ**, và vi phạm **Hiến pháp §13.5** *(lọc theo
quyền)* — điều mà **ADR-017 đã nâng thành điều kiện thi hành**.

*(Đây là `TD-05`, nhưng phát biểu sắc hơn: vấn đề ⛔ không phải "hiện đủ 16 thẻ
cho mọi người dùng" mà là "hiện đủ 16 thẻ cho **người chưa đăng nhập**".)*

### `UI-F2` 🔴 **⛔ Không có Work Zone**

**ADR-017** *(đã phê duyệt → Hiến pháp §13.3)* quy định trang chủ có **HAI vùng
hiến định**: **Work Zone** *(mặc định mở khi đăng nhập)* + **Business Operating
System Launcher**.

Hiện trạng: **chỉ có Launcher**. Vùng thứ nhất ⛔ **chưa tồn tại**.

### `UI-F3` 🔴 Login và trang chủ **⛔ không đi qua i18n**

```
app/login/page.tsx   0 lời gọi i18n
app/page.tsx         0 lời gọi i18n
app-bottom-nav.tsx   12  ← đã làm đúng
```

**Hiến pháp Điều 45**: ba ngôn ngữ **ngang hàng**, **cấm chuỗi viết thẳng**. Hai
màn hình **nhiều người xem nhất** đang vi phạm.

### `UI-F4` 🟠 **16 thẻ / đích 19**

`KD-7`. `WORKSPACES` 11 · `SERVICES` 4 · `PLATFORM` 1 = **16**. EDD-01 khai đích
**19** *(14 Workspace · 4 Global Service · 1 Platform)* ⇒ thiếu **3 Workspace**.

⚠️ **5/16 thẻ có `href: null`** *(Planning · HR · Reporting · Communication · AI
· Documents)* — chúng là **thẻ chết**, bấm ⛔ không đi đâu.

---

# §2 · PHÂN TÍCH PHỤ THUỘC

## 2.1 Dependency Graph

```
                      ┌──────────────────────┐
                      │  lib/rbac.ts         │  ⚠️ Edge-safe: KHÔNG import gì
                      │  Role · MODULE_ACCESS│     ngoài kiểu dữ liệu
                      │  ROLE_HOME           │
                      └──────────┬───────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌───────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ middleware.ts │      │ login/actions.ts │      │ app/page.tsx    │
│ (Edge)        │      │ (server action)  │      │ ⛔ CHƯA dùng rbac│
└───────┬───────┘      └────────┬─────────┘      └────────┬────────┘
        │                       │                         │
        └───────────┬───────────┘                         │
                    ▼                                      ▼
        ┌────────────────────────┐              ┌──────────────────────┐
        │ utils/supabase/server  │              │ app/home-modules.ts  │
        │ @supabase/ssr · cookie │              │ 16 thẻ · 5 href=null │
        └────────────────────────┘              └──────────────────────┘
                    │
                    ▼
        ┌────────────────────────┐
        │ Supabase Auth + RLS    │  ← HÀNG RÀO THẬT
        └────────────────────────┘
```

## 2.2 Ràng buộc phụ thuộc — ⛔ không được phá

| # | Ràng buộc | Vì sao |
|---|---|---|
| `D-1` | 🔴 **`lib/rbac.ts` ⛔ KHÔNG import gì ngoài kiểu** | Nó chạy trên **Edge Runtime**. Thêm một import nặng ⇒ middleware ⛔ không build được ⇒ **mất chốt chặn** |
| `D-2` | `app/page.tsx` hiện **⛔ không phụ thuộc** `rbac` | Thêm phụ thuộc này là **thay đổi có chủ ý** của UI-1, cần ghi rõ |
| `D-3` | `middleware` ⛔ không bảo vệ `/` | Trang chủ phải tự đọc phiên ở **Server Component**, ⛔ không dựa middleware |
| `D-4` | `MODULE_ACCESS` là **theo ROUTE**, ⛔ không theo Assignment | `TD-26`. Launcher lọc theo quyền **kế thừa** hạn chế đó — ⛔ không sửa được trong UI-1 |

## 2.3 🔑 Lưới an toàn Sprint I-2 **nay ràng buộc EPIC này**

| Phép kiểm | Ràng buộc lên UI-1 |
|---|---|
| **⑯** hồ sơ 6 cổng | 🔴 **Mọi route MỚI phải có mục trong `screen-gates.json`** — ⛔ không thì arch test đỏ |
| **⑭** cấm màn hình tự tính | Work Zone ⛔ **không được** tự cộng chỉ số; phải nhận số đã tính |
| **⑤** God Object | Tệp mới ⛔ không quá 900 dòng |
| **⑨ ⑩** màu · chữ | Tệp **MỚI** ⛔ không được viết màu/thang chữ thẳng — sổ nợ ⛔ không nhận thêm |
| **⑪** i18n | Khoá mới phải đủ **vi · en · zh**, ⛔ không khoá rỗng |

⇒ **Đây là lần đầu lưới an toàn hoạt động đúng mục đích**: nó ép EPIC mới làm
đúng ngay từ đầu thay vì sinh thêm nợ.

---

# §3 · KIẾN TRÚC ĐỀ XUẤT

## 3.1 Bốn lớp

```
① SESSION LAYER        lib/auth/session.ts  (server-only)
   getSessionUser() → { user, role, mustChangePassword } | null
   ⇒ MỘT nguồn phiên duy nhất cho UI. Hiện mỗi nơi tự gọi getUser().

② AUTH UI SHELL        app/(auth)/layout.tsx
   Khung dùng chung cho login · update-password · unauthorized.
   Hiện ba trang tự dựng nền, logo, footer riêng — ba bản chép tay.

③ CAPABILITY RESOLVER  lib/mos/capability/visible-modules.ts  (HÀM THUẦN)
   visibleModules(role: Role | null): ModuleItem[]
   ⇒ Kiểm được bằng bài kiểm thuần, KHÔNG cần CSDL.

④ HOMEPAGE SHELL       app/page.tsx  →  Server Component
   ├─ Work Zone      (ADR-017 vùng 1) — chỉ khi ĐÃ đăng nhập
   └─ Launcher       (ADR-017 vùng 2) — lọc qua ③
```

## 3.2 Vì sao tách `visibleModules` thành **hàm thuần**

| | |
|---|---|
| Kiểm được ⛔ không cần CSDL | cùng khuôn `garment-math` · `milestone-lateness` — đã có 213 phép đo chạy theo lối này |
| ⛔ Không đụng `rbac.ts` | giữ `D-1` — Edge Runtime an toàn |
| Một chỗ quyết định *"ai thấy gì"* | ⛔ không rải điều kiện `role === …` khắp JSX |
| ⑭ ⛔ không bắt nó | nó nằm ở `lib/`, ⛔ không phải `components/` |

## 3.3 Homepage Shell — hai vùng theo ADR-017

```
┌─ CHƯA ĐĂNG NHẬP ──────────────┐   ┌─ ĐÃ ĐĂNG NHẬP ────────────────┐
│  Hero + giới thiệu            │   │  ▸ WORK ZONE   (mặc định mở)  │
│  [Đăng nhập]                  │   │    việc cần làm hôm nay       │
│  ⛔ KHÔNG hiện bản đồ phân hệ  │   │  ▸ LAUNCHER    (lọc theo quyền)│
└───────────────────────────────┘   └───────────────────────────────┘
```

🔑 **Đây là chỗ `UI-F1` được đóng.** Người chưa đăng nhập thấy **trang giới
thiệu**, ⛔ không thấy bản đồ vận hành.

⚠️ **Work Zone lấy dữ liệu ở đâu là câu hỏi CHƯA có lời đáp.** EDD-05 khai
*"Work Inbox"* nhưng **chưa migration nào dựng**. ⇒ Xem `R-2`.

## 3.4 ⛔ KHÔNG thuộc UI-1

| ⛔ Không làm | Vì sao |
|---|---|
| Đổi `MODULE_ACCESS` · `ROLE_HOME` | **thay đổi mô hình phân quyền** ⇒ ADR + Board |
| Bỏ route mang tên chức danh | Sprint **I-5** |
| Đổi `MODULE_ACCESS` sang Assignment | `TD-26` ⇒ Sprint I-3 |
| Thêm 3 Workspace còn thiếu | mở Module mới ⇒ **SECURITY FREEZE** cấm |
| Dựng Work Inbox thật | cần migration ⇒ `B2` chưa cắt |
| Sửa `md-client.tsx` | `TD-39` — Board đã chỉ thị ⛔ không đụng |

---

# §4 · RISK

| # | Rủi ro | KN | Giảm nhẹ |
|---|---|---|---|
| `R-1` | 🔴 **Đụng `rbac.ts` làm gãy Edge Runtime ⇒ MẤT CHỐT CHẶN.** Đây là rủi ro **nặng nhất** EPIC | thấp–TB | ⛔ **Không sửa `rbac.ts`.** `visibleModules` là tệp MỚI ở `lib/mos/capability/`, chỉ **đọc** `MODULE_ACCESS` |
| `R-2` | 🔴 **Work Zone ⛔ không có nguồn dữ liệu** — Work Inbox chưa dựng | **cao** | Giai đoạn 1 làm **khung + trạng thái rỗng trung thực** *("chưa có việc nào")*, ⛔ **không** bịa dữ liệu mẫu |
| `R-3` | 🟠 **Lọc launcher che mất lối vào hợp lệ** — `MODULE_ACCESS` theo route, `/subcon` phục vụ **7 vai** *(`KD-6`)* | TB | Bài kiểm thuần: **mọi vai phải thấy ≥ 1 thẻ**, và `ROLE_HOME[role]` **luôn** nằm trong danh sách thấy được |
| `R-4` | 🟠 **5 thẻ `href: null`** — lọc xong người dùng thấy thẻ bấm ⛔ không đi đâu | **cao** | Quyết trước: **ẩn** hay **hiện kèm nhãn "sắp có"**. Đề nghị **hiện + nhãn** — ẩn đi thì người dùng ⛔ không biết hệ thống sẽ có gì |
| `R-5` | 🟠 **i18n cho 2 màn hình lớn** — `UI-F3` đòi thêm nhiều khoá × 3 ngôn ngữ | TB | ⑪ bắt buộc đủ 3 ngôn ngữ; ⛔ **không** dịch máy từ vựng hiến định *(29 từ)* |
| `R-6` | 🟡 Route mới ⇒ ⑯ đỏ nếu quên ghi `screen-gates.json` | thấp | Ghi **cùng lượt** với route |
| `R-7` | 🟡 **⛔ Không nghiệm thu bằng mắt được** — `F-8`, CSA ⛔ không có trình duyệt | chắc chắn | Mọi hạng mục chạm giao diện **phải** có người chạy nghi thức UI_UX_STANDARDS §8 |

---

# §5 · ESTIMATED TIMELINE

> Ước theo **lượt làm việc**, ⛔ không phải giờ — ChatGPT quy đổi.

| Giai đoạn | Hạng mục | Ước |
|---|---|---|
| **UI-1.A** | Session layer + capability resolver + bài kiểm thuần | **~1 lượt** |
| **UI-1.B** | Auth UI Shell *(gộp khung 3 trang)* + i18n | **~1–2 lượt** |
| **UI-1.C** | Homepage Shell — hai vùng + lọc quyền | **~2 lượt** |
| **UI-1.D** | Hồ sơ 6 cổng cho route chạm tới + tài liệu + khoá | **~1 lượt** |
| ⇒ **Tổng** | | **~5–6 lượt** |

⚠️ **`UI-1.C` phụ thuộc `R-2`**: nếu Board muốn Work Zone **có dữ liệu thật**
thì cần migration ⇒ **`B2` phải cắt trước** ⇒ ước lượng ⛔ không còn đúng.

---

# §6 · BACKLOG

## `UI-1.1` · Session Layer

| | |
|---|---|
| **Priority** | **P0** |
| **Effort** | `S` |
| **Dependency** | — |
| **Deliverables** | `lib/auth/session.ts` — `getSessionUser()` |
| **Verification** | ⛔ Không tệp nào ngoài nó gọi `supabase.auth.getUser()` ở tầng UI *(trừ `middleware` — Edge)*; tiêm: đổi `getUser`→`getSession` ⇒ phải có bài kiểm đỏ |
| **Exit** | `typecheck` · `lint` · `test:arch` xanh; `middleware` **⛔ không đổi một dòng** |

## `UI-1.2` · Capability Resolver

| | |
|---|---|
| **Priority** | **P0** |
| **Effort** | `S` |
| **Dependency** | — |
| **Deliverables** | `lib/mos/capability/visible-modules.ts` *(hàm thuần)* · `tests/business/capability.test.mjs` |
| **Verification** | 🔑 **Mọi vai thấy ≥ 1 thẻ** · `ROLE_HOME[role]` **luôn** nằm trong danh sách thấy được · `null` *(chưa đăng nhập)* ⇒ **danh sách RỖNG** · tiêm: bỏ `superadmin: ['*']` ⇒ đỏ |
| **Exit** | ≥ 25 phép đo · 0 hỏng · hỏng-trước-xanh-sau · ⛔ **không đụng `rbac.ts`** |

## `UI-1.3` · Auth UI Shell

| | |
|---|---|
| **Priority** | **P1** |
| **Effort** | `M` |
| **Dependency** | `UI-1.1` |
| **Deliverables** | `app/(auth)/layout.tsx` · rút `login` · `update-password` · `unauthorized` về khung chung |
| **Verification** | Ba trang giữ **nguyên hành vi**: `safeNext` · ⛔ không lộ *sai email/mật khẩu* · `/auth/*` vẫn lọt · nút Đăng xuất trên `/update-password` vẫn thoát được |
| **Exit** | ⛔ Không đổi `actions.ts` · ⑨⑩ ⛔ không nhận nợ mới · 🔴 **`F-8` nghi thức nghiệm thu** |

## `UI-1.4` · i18n cho Auth + Trang chủ

| | |
|---|---|
| **Priority** | **P1** |
| **Effort** | `M` |
| **Dependency** | `UI-1.3` |
| **Deliverables** | Khoá mới ở `messages/{vi,en,zh}.json` |
| **Verification** | ⑪ — đủ 3 ngôn ngữ, ⛔ 0 khoá rỗng, **29 từ hiến định ⛔ không bị dịch** |
| **Exit** | `test:arch` ⑪ xanh · `grep -c i18n app/login/page.tsx > 0` |

## `UI-1.5` · Homepage Shell — hai vùng

| | |
|---|---|
| **Priority** | **P0** |
| **Effort** | **`L`** |
| **Dependency** | `UI-1.1` · `UI-1.2` |
| **Deliverables** | `app/page.tsx` → Server Component · `components/home/work-zone.tsx` · `launcher.tsx` |
| **Verification** | 🔑 **Chưa đăng nhập ⇒ ⛔ KHÔNG hiện thẻ phân hệ nào** *(đóng `UI-F1`)* · đã đăng nhập ⇒ đúng danh sách của `UI-1.2` · Work Zone rỗng hiện **trạng thái rỗng trung thực**, ⛔ không dữ liệu mẫu |
| **Exit** | ⑭ ⛔ không bắt *(Work Zone ⛔ không tự tính)* · ⑤ < 900 dòng · 🔴 **`F-8`** |

## `UI-1.6` · Hồ sơ 6 cổng + khoá EPIC

| | |
|---|---|
| **Priority** | **P1** |
| **Effort** | `S` |
| **Dependency** | tất cả |
| **Deliverables** | Mục `screen-gates.json` cho route chạm tới · báo cáo hoàn thành EPIC |
| **Verification** | ⑯ xanh · mục **đã đánh giá** phải có **ngày · người phán · nguồn** |
| **Exit** | 🔴 **Người phán là NGƯỜI THẬT** — CSA ⛔ không tự phán *(`TD-38`)* |

---

# §7 · CẦN BOARD TRƯỚC KHI VIẾT MÃ

| # | Câu hỏi |
|---|---|
| `Q-1` | 🔴 **`R-2`** — Work Zone giai đoạn 1: **khung + trạng thái rỗng**, hay chờ Work Inbox *(⇒ cần migration ⇒ cắt `B2`)*? |
| `Q-2` | 🔴 **`R-4`** — 5 thẻ `href: null`: **ẩn** hay **hiện kèm nhãn "sắp có"**? Đề nghị: hiện + nhãn |
| `Q-3` | **`UI-F1`** — xác nhận trang chủ **chưa đăng nhập ⛔ không hiện bản đồ phân hệ**. Đây là **đổi hành vi thấy được**, ⛔ không phải sửa lỗi thầm lặng |
| `Q-4` | **`TD-38`** — ai là **người phán** 6 cổng cho các màn hình UI-1? |

---

## THAM CHIẾU

- ADR-017 *(trang chủ hai vùng)* · Hiến pháp §13.3 · §13.5 · §15 · Điều 45
- EDD-01 *(19 Business App)* · EDD-05 §1.1 *(6 cổng)*
- `TD-05` · `TD-26` · `TD-38` · `KD-6` · `KD-7`
- `tests/architecture/arch.test.mjs` ⑤ ⑨ ⑩ ⑪ ⑭ ⑯

> **Trạng thái:** ⏳ **Architecture Report — trình Board.** ⛔ Chưa viết một dòng
> Production Code nào.
