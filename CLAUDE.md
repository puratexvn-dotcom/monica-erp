# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Tài liệu, giao diện và commit message của dự án này **viết bằng tiếng Việt**;
> mã nguồn, tên biến, tên file viết bằng tiếng Anh. Giữ đúng quy ước đó.

---

# MONICA ONE CONSTITUTION

Before any design, coding, refactoring or architecture decision:

1. Read docs/architecture/00-CONSTITUTION.md

2. Follow it strictly.

3. Never violate the Constitution.

4. If a request conflicts with the Constitution:

- Stop.
- Explain the conflict.
- Do NOT implement.
- Request an ADR approval first.

> ✅ **[`docs/architecture/00-CONSTITUTION.md`](docs/architecture/00-CONSTITUTION.md)
> ĐÃ BAN HÀNH: `v1.5 · ADOPTED`, hiệu lực 02/08/2026 — 8 Phần · 45 Điều.**
> Đây là **Hiến pháp duy nhất** (§43.9: *"the single constitutional source of
> architectural authority"*).
>
> ⚠️ Ghi chú cũ ở chỗ này từng nói `00-CONSTITUTION.md` là "bộ khung rỗng" và
> `MONICA_CONSTITUTION.md` mới đang có hiệu lực. **Ghi chú đó SAI** và đã khiến
> mọi phiên làm việc khởi động bằng tiền đề sai. Đã sửa 04/08/2026 theo
> [ADR-010](docs/adr/ADR-010-thu-bac-van-ban-chuan-tac.md).
>
> Mục lục thư mục: [`docs/architecture/README.md`](docs/architecture/README.md).

---

## 0. ĐỌC TRƯỚC KHI SINH DÒNG CODE ĐẦU TIÊN

> ### 🔒 ARCHITECTURE FROZEN · 2026-08-04
>
> Kiến trúc Monica ONE **đã được khoá** — [`docs/ARCHITECTURE_BASELINE.md`](docs/ARCHITECTURE_BASELINE.md).
> Baseline `MONICA-ONE-BASELINE-2026-08-04` · Hiến pháp **v1.6** · BKB **v2.0 ADOPTED** ·
> 15 tài liệu ADR · 14 EDD · **149 quyết định kiến trúc**.
>
> 🔴 **⛔ KHÔNG được thay đổi kiến trúc trực tiếp bằng mã.**
> Phát hiện vấn đề kiến trúc khi lập trình ⇒ **cập nhật tài liệu TRƯỚC**, sau đó
> mới sửa Implementation — [Architecture Change Procedure](docs/enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) EDD-06 §10.
>
> ⛔ Ba điều cấm: sửa mã bù sai kiến trúc · thêm màn hình nhập liệu để né
> `P-ZERODUP` · tắt bài kiểm để cho mã đi qua.

> ### 🧠 BẮT ĐẦU TỪ ĐÂY: [`docs/PROJECT_MEMORY.md`](docs/PROJECT_MEMORY.md)
>
> **Project Memory là chỉ mục duy nhất của toàn bộ tri thức dự án** — 13 tài liệu
> Enterprise Design, 149 quyết định kiến trúc, 29 Board Decision, 5 nguyên tắc
> thiết kế, 14 Business Domain, và **13 khuyết tật đã biết chưa sửa**.
>
> Nó **không chứa tri thức mới** — nó cho biết tri thức nằm ở đâu. Đọc §10 *(lộ
> trình nhập môn)* trước khi làm bất cứ việc gì; đọc §8 *(khuyết tật đã biết)*
> trước khi viết dòng mã đầu tiên.
>
> 🔴 **Project Memory ⟷ tài liệu gốc mâu thuẫn ⇒ TÀI LIỆU GỐC THẮNG.**

Dự án có một bộ luật nội bộ, và nó **thắng mọi mặc định** của bạn. Thứ bậc bảy
bậc dưới đây do [ADR-010](docs/adr/ADR-010-thu-bac-van-ban-chuan-tac.md) ấn định
— **bậc trên luôn thắng bậc dưới**:

| Bậc | Tài liệu | Vai trò |
|---|---|---|
| **0** | Quyết định của Board | nguồn duy nhất của **sự thật nghiệp vụ** |
| **0′** | [`docs/business/BUSINESS_KNOWLEDGE_BASE.md`](docs/business/BUSINESS_KNOWLEDGE_BASE.md) | tối cao về **nghiệp vụ** — ⏳ *đang là DRAFT, chờ Board duyệt* |
| **1** | [`docs/architecture/00-CONSTITUTION.md`](docs/architecture/00-CONSTITUTION.md) | **Hiến pháp duy nhất** — 45 Điều · `v1.5 ADOPTED` |
| **2** | [`docs/adr/`](docs/adr/) | quyết định kiến trúc — **bất biến, không sửa** |
| **2′** | [`docs/enterprise-design/`](docs/enterprise-design/) | **Enterprise Design** — 13 tài liệu EDD · 149 Decision Log · chỉ mục ở [`PROJECT_MEMORY.md`](docs/PROJECT_MEMORY.md) |
| **3** | [`docs/UI_UX_STANDARDS.md`](docs/UI_UX_STANDARDS.md) · [`docs/MUTATION_POLICY.md`](docs/MUTATION_POLICY.md) | Engineering Standards |
| **4** | [`docs/MONICA_CONSTITUTION.md`](docs/MONICA_CONSTITUTION.md) · [`docs/ENGINEERING_PLAYBOOK.md`](docs/ENGINEERING_PLAYBOOK.md) | Approved Playbooks — 12 nguyên tắc + 34 quy tắc, **vẫn ràng buộc đầy đủ** |
| **5** | [`docs/DOMAIN_GLOSSARY.md`](docs/DOMAIN_GLOSSARY.md) · audit · discovery | Technical Documentation |
| **6** | mã nguồn · lược đồ CSDL | **thấp nhất — mã không bao giờ là nguồn chân lý** |

⚠️ **Nghiệp vụ ⟷ Hiến pháp phân theo LĨNH VỰC, không theo thứ tự.** BKB tối cao
về *cái gì là thật*; Hiến pháp tối cao về *phải xây thế nào*. Mâu thuẫn thật giữa
hai bên ⇒ **DỪNG**, ghi vào
[`NEEDS_CLARIFICATION.md`](docs/architecture/NEEDS_CLARIFICATION.md), Board phán
quyết. Không tự chọn bên thắng.

⚠️ **Ba bộ đánh số cùng tồn tại.** Trích dẫn phải nói rõ nguồn — `Điều IX` trần,
không nguồn, là trích dẫn **không hợp lệ**:

| Viết | Nghĩa |
|---|---|
| `Hiến pháp Điều 43.3` | `00-CONSTITUTION.md` — số Ả Rập, bậc 1 |
| `Playbook Điều XXX` | `ENGINEERING_PLAYBOOK.md` — số La Mã, bậc 4 |
| `MOS Điều IX` | `MONICA_CONSTITUTION.md` — số La Mã, bậc 4 |
| `BKB §12` | `BUSINESS_KNOWLEDGE_BASE.md` — bậc 0′ |

**Nếu một yêu cầu mâu thuẫn với các tài liệu trên: DỪNG LẠI VÀ GIẢI THÍCH, không tự ý sửa kiến trúc.**

---

## 1. LỆNH THƯỜNG DÙNG

```bash
npm run dev            # http://localhost:3000 (predev tự chạy build-manuals)
npm run build          # prebuild tự chạy build-manuals
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
npm run verify         # typecheck + lint + test  ← cổng chính trước khi commit

npm test               # toàn bộ bộ kiểm (bài cần CSDL tự bỏ qua nếu thiếu bí mật)
npm run test:arch      # CHỈ kiến trúc — không cần CSDL, chạy được ở mọi nơi
npm run test:security  # phân quyền external user, CẦN CSDL
npm run test:regression # toàn vẹn dữ liệu nền, CẦN CSDL
npm run bench          # đo chi phí RLS — phép ĐO, luôn thoát 0, không phải phép KIỂM

npm run manuals        # sinh lib/manuals/manifest.generated.ts từ các tệp .md
```

**Chạy một bài kiểm đơn lẻ** — mỗi bài là một script Node độc lập:

```bash
node tests/architecture/arch.test.mjs
node tests/security/rls-external.test.mjs
node tests/regression/seed-integrity.test.mjs
```

**Script tiện ích:**

```bash
node scripts/seed-users.mjs [--dry-run|--reset|--prune]  # tạo tài khoản, CẦN service_role key
node scripts/check-supabase.mjs                          # chẩn đoán kết nối / khoá API
node scripts/diag.mjs                                    # khám lỗi 401
```

⚠️ Bài kiểm cần CSDL mà thiếu bí mật sẽ in `⚪ BỎ QUA` và **thoát 0**.
**"Bỏ qua" ≠ "đạt".** Đọc log, đừng đọc mỗi màu xanh.

**Biến môi trường** (`.env.local`, xem `.env.local.example` — lưu ý file example còn ghi tên
biến cũ `NEXT_PUBLIC_SUPABASE_KEY`, mã nguồn **không dùng** biến đó nữa):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     # chỉ script chạy tay + app/(dashboard)/admin/actions.ts
```

`SUPABASE_SERVICE_ROLE_KEY` **tuyệt đối không** được đặt tiền tố `NEXT_PUBLIC_` — làm vậy là
đóng gói khoá vượt-mọi-RLS vào bundle trình duyệt.

---

## 2. KIẾN TRÚC — BỨC TRANH LỚN

Next.js 14 App Router · TypeScript strict · Tailwind · Supabase (Auth + Postgres + RLS)
· TanStack Query/Table · react-hook-form + Zod · Recharts.

### 2.1 Ba tầng phòng thủ, không tầng nào thay được tầng nào

```
middleware.ts          chốt chặn điều hướng  → chưa đăng nhập / ép đổi mật khẩu / RBAC route
_services/guard.ts     chốt quyền mỗi hàm     → Server Action là endpoint gọi thẳng được
supabase/migrations/   RLS + policy           ← HÀNG RÀO THẬT
```

Hai tầng đầu chỉ để **giao diện không mời người dùng bấm vào thứ chắc chắn bị từ chối**.
Hàng rào thật luôn nằm ở CSDL. Không bao giờ coi middleware là đủ.

- Vai trò đọc từ `user.app_metadata.role` — **không bao giờ** từ `user_metadata` (người dùng
  tự sửa được ⇒ tự leo thang đặc quyền).
- Luôn `supabase.auth.getUser()`, **không** `getSession()` (cookie giả mạo được).
- [`lib/rbac.ts`](lib/rbac.ts) là **nguồn chân lý duy nhất** cho `Role`, `MODULE_ACCESS`,
  `ROLE_HOME`, `PROTECTED_PREFIXES`, `WH_PERMISSIONS`. File này không import gì ngoài kiểu
  dữ liệu, để middleware chạy được trên Edge Runtime.

### 2.2 Phân quyền theo ASSIGNMENT, không theo ROLE (Playbook Điều XXX — ƯU TIÊN TỐI CAO)

```
Identity → Assignment → Resource Scope → Permission → Action
```

Vai trò chỉ là **nhóm quyền mặc định**. Quyền thật trả lời câu hỏi
*"Monica đã giao việc gì cho người đó?"* — không phải *"người đó là ai."*

- **Cấm hardcode `subcon_id`** hoặc so chuỗi `'subcon'` trong bất kỳ logic nghiệp vụ nào.
- **Cấm truy vấn thẳng theo `subcon_id` mà bỏ qua Assignment.**
- `Actor.partnerId` phải phân giải từ bảng `partner_accounts` (có `is_active`),
  **không** lấy từ claim trong JWT — claim không đổi khi quan hệ đối tác chấm dứt.
- Nhà thầu **bắt buộc GHI** (sản lượng, sự cố, Daily Report), không phải người chỉ đọc.
  Buyer thì ngược lại: Đọc · Duyệt · Bình luận · Tải về.
- Bộ luật phân quyền thuần nằm ở [`lib/mos/permission/`](lib/mos/permission/) — nó **cố ý
  không biết** Supabase, JWT, hay tên bảng: nhận DỮ LIỆU, trả PHÁN QUYẾT.

⚠️ Đang có **SECURITY FREEZE** (Hiến pháp XI.1): **không mở Domain / Module / bảng nghiệp vụ
mới** cho tới khi chuỗi migration `031a→031g` hoàn tất và được xác nhận bằng văn bản.
Được làm: vá lỗ hổng đã đo, viết bài kiểm/tài liệu/audit, sửa lỗi gãy vận hành.

### 2.3 Cấu trúc một phân hệ (bắt buộc theo — xem UI_UX_STANDARDS §9)

```
app/(dashboard)/<module>/
  page.tsx               Server Component, nạp dữ liệu lần đầu (Promise.allSettled)
  <module>-client.tsx    Client Component, giữ state + bố cục
  _services/
    guard.ts             guard() · safeQuery() · friendlyDbError() · one() · logDbError()
    *.service.ts         'server-only', CHỈ ĐỌC
  _actions/
    *.actions.ts         'use server', GHI + revalidatePath
    *.client.ts          cầu nối mỏng để client gọi service
schemas/<module>/index.ts  barrel: CHỈ schema Zod / kiểu / hàm thuần. KHÔNG import Server Action
components/<module>/       render UI, KHÔNG chứa business logic
```

Mỗi phân hệ có `guard.ts` **riêng** (khác nhau ở `MODULE_PATH` và thông điệp lỗi) — đây là
trùng lặp có chủ ý, đừng gộp chúng lại thành một.

### 2.4 Lõi dùng chung

| Đường dẫn | Vai trò |
|---|---|
| `lib/mos/domain/`, `lib/mos/value-objects/` | Domain thuần — **cấm** import từ `app/`, `components/`, `hooks/`; value-objects còn cấm import `lib/i18n` |
| `lib/mos/policies/`, `lib/mos/calculators/` | state machine, phép tính dẫn xuất (không lưu vào DB) |
| `lib/mos/contracts/query-keys/` | **cửa vào duy nhất** cho query key. Mỗi miền một `<miền>.keys.ts` theo khuôn `all / lists() / list(f) / details() / detail(id)` + `xxxInvalidationKeys()`. Gốc hai miền không được trùng |
| `lib/garment-math.ts` | toàn bộ công thức ngành may: quy đổi vải, BOM, hao hụt, AQL 2.5 (ISO 2859-1), DHU/RFT, takt, công nợ |
| `lib/time.ts` | **nguồn sự thật duy nhất** cho giờ VN. Cấm viết `7 * 3600 * 1000` ở bất cứ đâu — arch test bắt |
| `lib/i18n.tsx` + `lib/dictionaries/` | VN · EN · CN. Giai đoạn 1 hiển thị 100% tiếng Việt nhưng **mọi nhãn phải qua i18n**, không hardcode |
| `utils/supabase/{client,server}.ts` | `@supabase/ssr`, dùng chung cookie phiên với middleware ⇒ RLS nhìn đúng người |
| `lib/supabase.ts` | data layer cho client component, có fallback mock. ⚠️ Fallback này từng che giấu lỗi 401 suốt thời gian dài — Playbook Điều XX nói "Không Mock" |

### 2.5 Nguyên tắc dữ liệu hay bị vi phạm nhất

- **Không lưu dữ liệu tính toán được** (`delay_days`, `completion_percent`, `risk_score`…).
  Dùng SQL View / Materialized View / Service.
- **Soft delete bắt buộc** (`deleted_at`, `deleted_by`) — arch test cấm `.delete()` trong mã
  ứng dụng. Soft delete xung khắc `UNIQUE` ⇒ phải dùng **chỉ mục duy nhất MỘT PHẦN**
  (`UNIQUE ... WHERE deleted_at IS NULL`).
- **Chứng từ đã Đóng/Duyệt không được `UPDATE`** — lập chứng từ Điều chỉnh.
- **DB chỉ lưu Business Code** (`APPROVED`, `IN_TRANSIT`), Frontend dịch. Ngoại lệ đã có ADR:
  UDMD dùng cột `name_translations JSONB` (ADR-005).
- **`TIMESTAMPTZ` (UTC)** trong DB, convert múi giờ ở Frontend.
- **Mọi con số phải có đơn vị và tiền tệ.**
- **`NULL` là phát biểu trung thực** — migration **không được suy diễn** dữ liệu nghiệp vụ.
- **`request_id UUID` + unique index** bắt buộc trên mọi bảng chứng từ lập-mới-được
  (Playbook XXXIV / ADR-003). Sinh khoá lúc **MỞ** biểu mẫu, không lúc BẤM.
  Service phải bắt `23505` và **trả về dòng cũ với `ok:true`**.
- **Xung đột ghi đè** dùng mã tự đặt `P0409`, **không** dùng `40001` (thư viện sẽ tự retry —
  mà retry ở đây là sai).

---

## 3. CƠ SỞ DỮ LIỆU & MIGRATION

```
supabase/migrations/   NNN[hậu tố]_<ten>.sql   — đã chạy thì KHÔNG SỬA, chỉ thêm file mới
supabase/seeds/        S001_business_baseline.sql — dữ liệu nền, chạy TRƯỚC mỗi đợt audit
supabase/audits/       A001 view security · A002 policy coverage
supabase/maintenance/  M001, M002 — dọn hậu quả của bài kiểm sai
supabase/drafts/       bản nháp CHƯA hoàn chỉnh — arch test cấm để trong migrations/
supabase/snapshots/
```

**Quy trình bắt buộc, không được đảo** (Hiến pháp IV · Playbook XXXIII):

```
Architecture Review → ADR (PHẢI DUYỆT XONG) → Migration Design → Impact Analysis
  → SQL Migration → Regression → Performance → Security → Snapshot → Commit
```

> **KHÔNG viết SQL trước khi ADR được phê duyệt.** Áp dụng từ migration 030 trở đi,
> không ngoại lệ.

- **Người dùng tự chạy migration** trên Supabase SQL Editor. Không có RPC nào chạy DDL từ mã
  nguồn. Đừng cố tự áp dụng migration.
- Migration phải **idempotent**, không `DROP` dữ liệu, không phá View/Function đang chạy.
- **Luôn đối chiếu với CSDL đang chạy**, không tin nội dung file migration hay trí nhớ.
- Mọi thay đổi Schema / Migration / RLS / Policy là **quyết định kiến trúc**: phân tích tác
  động → đề xuất → **chờ phê duyệt**. Kể cả khi thay đổi là *siết chặt* và có vẻ an toàn.
- Hàm SQL đặt tiền tố `mos_*`. Mỗi hàm `SECURITY DEFINER` phải được ghi vào
  [`docs/SECURITY_DEFINER_REGISTRY.md`](docs/SECURITY_DEFINER_REGISTRY.md) kèm lý do, ADR và
  bài kiểm hồi quy — nó là lỗ khoét xuyên qua toàn bộ RLS.
- ⚠️ **VIEW mặc định vượt mặt RLS.** `A001` là bài kiểm hồi quy **bắt buộc mọi vòng**, không
  chỉ khi đụng tới view.
- ⚠️ **Policy không được truy vấn bảng mà chính người gọi không đọc được** (quy tắc K-3) —
  subquery trong policy vẫn chịu RLS dưới quyền người gọi, biến phép *khoanh vùng* thành
  phép *chặn phẳng*. Bắc cầu bằng hàm `SECURITY DEFINER` không tham số rồi **so cột**.
- Cập nhật [`docs/RLS_COVERAGE_MATRIX.md`](docs/RLS_COVERAGE_MATRIX.md) sau mỗi migration
  chạm RLS.

---

## 4. KIỂM THỬ — BỐN QUY TẮC SINH TỪ SỰ CỐ THẬT

Chi tiết ở [`tests/README.md`](tests/README.md). Tóm tắt bốn thứ hay sai nhất:

- **K-1 · Bảng chỉ-ghi-thêm kiểm bằng LƯỢC ĐỒ** (`pg_trigger`), không bằng ghi thử. Ghi vào
  sổ cái là **cửa một chiều** — xoá không được, kể cả bằng `service_role`.
- **K-2 · Không đo quyền GHI bằng cách GHI bừa.** `INSERT {}` giả định ngầm mọi bảng đều có
  ràng buộc chặn lại; bốn bảng nullable hết ⇒ lệnh **thành công**, sinh dữ liệu rác. Đọc
  `pg_policies`, hoặc chạy trong giao dịch kết thúc bằng `ROLLBACK`.
- **K-3 · Mỗi kịch bản phải có ít nhất MỘT vai CHỜ THẤY > 0.** Bài kiểm toàn vai chờ-0 không
  phân biệt được "khoanh đúng" với "chặn hết".
- **V.1 · Không kết luận trên bảng RỖNG.** Ghi `⚪ chưa đo được`, không ghi `✅`.

Mọi bài kiểm dựng tài khoản/dữ liệu **dùng-một-lần** rồi dọn trong `finally`. Không bài nào
được `UPDATE`/`DELETE`/`INSERT` thẳng lên dữ liệu nghiệp vụ thật.

**Arch test (`npm run test:arch`) chặn cứng:** `any` · `.delete()` · `lib|components` import
từ `app/` · số ma thuật múi giờ · file logic > 900 dòng · thiếu tài liệu bắt buộc · migration
sai khuôn tên · ADR trùng số hoặc < 6 bản.

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) có hai tầng: `kiem-tra-tinh`
(không cần bí mật, chạy mọi push/PR) và `kiem-tra-song` (cần Secrets, không chạy trên PR
từ fork vì nó **ghi dữ liệu tạm lên CSDL thật**).

---

## 5. NGHIỆM THU TRƯỚC KHI COMMIT

**Build sạch chưa đủ.** Quy trình đầy đủ ở UI_UX_STANDARDS §8; rút gọn:

1. `npm run verify` sạch
2. `next build` không cảnh báo
3. `next start` + **đăng nhập bằng tài khoản seed thật**, tải trang, kiểm không lọt
   `undefined` / `[object Object]` / `NaN` ra HTML
4. **Đối chiếu mọi câu select/insert với CSDL đang chạy bằng chính phiên đó** (cả cột lẫn RLS)
5. Soi CSS đã dựng — Tailwind cắt mất lớp màu động thì giao diện ra trắng trơn mà build vẫn xanh
6. Bật lại cờ `force_password_change` nếu đã tạm tắt để test
7. Commit **bằng tiếng Việt**, nêu rõ **lỗi thật đã phát hiện** và **cách kiểm chứng**

**Báo cáo trung thực:** nói rõ thứ **chưa kiểm được**. Không báo "đã xong" cho phần mới chỉ
đúng về mặt mã.

---

## 6. BỐN RÀNG BUỘC BẤT DI BẤT DỊCH VỀ GIAO DIỆN

1. Trang chủ luôn đủ **19 Business App** (14 Workspace · 4 Global Service · 1 Platform);
   bottom nav luôn đủ **5 nút** (Trang chủ · Business Communication · AI Assistant ·
   Business Reporting · User Guidance — Hiến pháp §15.3–§15.8).
   Mất một link là mất đường vào của cả một bộ phận.
   > ⚠️ Sửa 04/08/2026 theo EDD-06 §2.6 `M-5` `M-6`. Ghi chú cũ *"12 phân hệ · 4 nút"*
   > **SAI** — mã hiện có 16 thẻ (`app/home-modules.ts:135`), đích 19 theo EDD-01;
   > Hiến pháp khai **năm** năng lực toàn cục, không phải bốn.
2. **Không xoá logic hay file cũ.** Chỉ thêm, hoặc đổi đường dùng. File chưa gắn route vẫn
   giữ (`md-legacy-client.tsx`, `md-forms.tsx`…).
3. **TypeScript strict, cấm `any`** — arch test bắt.
4. **Toàn bộ giao diện, nhãn, bảng biểu bằng tiếng Việt** chuẩn thuật ngữ ngành may.

Bố cục mọi trang phân hệ, từ trên xuống: Top Header (sticky) → Main Action Tabs (hiện thẳng,
**không** bọc accordion) → KPI/Command Center → bảng dữ liệu (mỗi bảng một vùng
`overflow-x-auto` riêng) → **biểu đồ đặt cuối cùng** → Bottom Nav.

Tiêu đề trang tra theo đường dẫn trong `PAGE_IDENTITY` ở
[`components/dashboard-topbar.tsx`](components/dashboard-topbar.tsx) — thêm phân hệ mới thì
thêm **một dòng** ở đó, không sửa gì khác.

Quy tắc nhãn: enum đặt cùng chỗ với `Record<Enum, string>` nhãn tiếng Việt. Tra không thấy
thì **hiện mã gốc**, không để trống.

---

## 7. VÀI CÁI BẪY ĐÃ TỐN GIÁ

- **`middleware.ts` phải nằm ở thư mục gốc.** Từng có bản đầy đủ ở `utils/supabase/middleware.ts`
  và Next.js chưa từng nạp nó — ứng dụng chạy không chốt chặn suốt thời gian dài.
- **Biến `NEXT_PUBLIC_*` được nội tuyến lúc build.** Thêm biến trên Vercel mà không redeploy
  thì bản đang chạy vẫn giữ giá trị `undefined` của lần build trước.
- **PostgREST bọc mọi `PATCH` trong CTE có `RETURNING`** bất kể header `Prefer` ⇒ policy
  `SELECT` được áp lên **dòng MỚI**. Đó là lý do soft delete phải đi qua RPC (`036b`).
- **Supabase suy kiểu `select` bằng cách phân tích chuỗi literal.** Chuỗi nối bằng `+` làm
  bộ suy luận trả `GenericStringError[]` ⇒ dùng `safeQuery` nhận `unknown` rồi ép kiểu đúng
  một chỗ, kèm interface `Raw*` khai báo tường minh ở nơi gọi.
- **Sửa file `.md` trong `lib/manuals/` phải chạy lại `npm run manuals`** (đã móc vào
  `predev`/`prebuild`, nhưng nhớ khi chạy tay).
- **`retry: 0` ở tầng ứng dụng chỉ chặn 1 trong 4 đường gửi trùng.** Ba đường còn lại — bấm
  hai lần, trình duyệt gửi lại, hai tab — chỉ CSDL chặn được (⇒ `request_id`).
