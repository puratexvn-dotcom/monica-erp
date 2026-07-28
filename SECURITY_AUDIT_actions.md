# 🔐 Security Audit — Phân hệ Gia Công (app/subcon)

> **Phạm vi:** File `page.tsx` đã được audit trực tiếp. File `./actions.ts` (chứa
> `getSubconDashboardData`, `createSubconOrder`, `issueBundleToSubcon`,
> `receiveBundleFromSubcon`) **chưa được cung cấp** — phần dưới đây là checklist
> bắt buộc + template hardening để bạn tự đối chiếu, hoặc gửi file để audit chi tiết.

---

## 1. Rủi ro nhìn thấy được từ page.tsx

| # | Rủi ro | Mức độ | Giải thích |
|---|--------|--------|------------|
| R1 | **Server Action = Public API endpoint** | 🔴 Cao | Mọi Server Action đều có thể bị gọi trực tiếp qua HTTP POST mà không cần đi qua UI. `required`, `min="1"`, `pattern` trên form chỉ là UX — kẻ tấn công bypass được 100%. Bắt buộc validate lại toàn bộ ở server. |
| R2 | **`order_id` nhận UUID thô từ input text** | 🔴 Cao | Nếu action chèn thẳng giá trị này vào query mà không validate định dạng UUID + kiểm tra order thuộc quyền truy cập của user (IDOR), user có thể tạo SCO trỏ tới đơn hàng của đơn vị khác. Đã thêm `pattern` UUID phía client (UX), nhưng server vẫn phải là chốt chặn cuối. |
| R3 | **Số lượng âm / vượt tồn** | 🟠 Trung bình | `quantity_sent`, `quantity_good`, `quantity_defect` phải được ép kiểu + chặn số âm ở server, và đối chiếu: `quantity_sent ≤ tồn của bundle`, `quantity_good + quantity_defect ≤ quantity_sent` của SCO. Nếu không, sổ kho có thể bị "bơm" số liệu ảo. |
| R4 | **`defect_evidence_urls` nhận URL tự do** | 🟠 Trung bình | Cần validate mỗi phần tử là URL hợp lệ (chỉ `https:`), giới hạn số lượng và độ dài — tránh lưu chuỗi rác/payload vào DB và tránh stored-XSS nếu nơi khác render URL này thành `<a href>` hoặc `<img src>`. |
| R5 | **`is_chargeable` là checkbox** | 🟡 Thấp | Checkbox không tick sẽ **không xuất hiện trong FormData** (không phải `"false"`). Server phải xử lý `formData.get('is_chargeable') === 'on'` — không được `Boolean(value)` kiểu ngây thơ. |
| R6 | **Race condition double-submit** | 🟠 Trung bình | Đã chặn phía client bằng disable nút khi pending, nhưng server vẫn cần idempotency (unique constraint trên movement, hoặc kiểm tra trạng thái bundle trong transaction) vì 2 tab / 2 user có thể thao tác cùng một bó. |

## 2. Checklist bắt buộc cho `actions.ts`

- [ ] **Authentication:** Mỗi action (kể cả `getSubconDashboardData`) mở đầu bằng
      `const { data: { user } } = await supabase.auth.getUser()` và `throw`/redirect nếu `!user`.
      Dùng `getUser()` (verify với Auth server), **không** tin `getSession()` đơn thuần.
- [ ] **Authorization:** Kiểm tra role/phòng ban của user có quyền thao tác phân hệ gia công
      (qua bảng profiles/roles hoặc RLS). Không suy ra quyền từ dữ liệu client gửi lên.
- [ ] **RLS bật trên mọi bảng liên quan:** `subcontractors`, `subcon_orders`, `bundles`,
      `cut_tickets`, `orders`... Nếu action dùng `service_role` key thì RLS bị bypass —
      khi đó authorization trong code là chốt chặn DUY NHẤT, phải kiểm tra kỹ gấp đôi.
- [ ] **Validate input bằng schema (zod)** trước khi đụng vào DB — xem template bên dưới.
- [ ] **Ràng buộc nghiệp vụ trong transaction/RPC:** trừ tồn bundle + đổi status + ghi movement
      nên nằm trong 1 Postgres function (`supabase.rpc(...)`) để atomic, tránh race condition.
- [ ] **Không trả raw error của Postgres về client** (lộ tên bảng/cột). Bắt lỗi, log server-side,
      trả message chung chung.
- [ ] **revalidatePath('/subcon')** sau mỗi mutation để dashboard đồng bộ.

## 3. Template hardening (tham khảo — KHÔNG thay đổi business logic hiện có)

```ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server' // giữ nguyên client hiện có của bạn

// ---- Schema validate đầu vào (thêm MỚI, không đổi logic) ----
const IssueBundleSchema = z.object({
  subcon_order_id: z.string().uuid('SCO ID không hợp lệ'),
  bundle_id: z.string().uuid('Bundle ID không hợp lệ'),
  quantity_sent: z.coerce.number().int().positive('Số lượng xuất phải > 0').max(1_000_000),
  notes: z.string().trim().max(500).optional().default(''),
})

const ReceiveBundleSchema = z
  .object({
    subcon_order_id: z.string().uuid(),
    bundle_id: z.string().uuid(),
    quantity_good: z.coerce.number().int().min(0).max(1_000_000),
    quantity_defect: z.coerce.number().int().min(0).max(1_000_000),
    defect_reason: z.string().trim().max(500).optional().default(''),
    is_chargeable: z.preprocess((v) => v === 'on' || v === true, z.boolean()), // checkbox!
    defect_evidence_urls: z.preprocess(
      (v) =>
        String(v ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      z.array(z.string().url().startsWith('https://')).max(10),
    ),
  })
  // Nghiệp vụ: có hàng lỗi thì bắt buộc có bằng chứng + lý do
  .refine((d) => d.quantity_defect === 0 || d.defect_evidence_urls.length > 0, {
    message: 'Có hàng lỗi thì bắt buộc đính kèm URL ảnh bằng chứng',
  })
  .refine((d) => d.quantity_good + d.quantity_defect > 0, {
    message: 'Tổng số lượng thu hồi phải > 0',
  })

// ---- Guard auth dùng chung ----
async function requireUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('UNAUTHORIZED')
  return { supabase, user }
}

// ---- Ví dụ bọc action hiện có (giữ nguyên phần query/business bên trong) ----
export async function issueBundleToSubcon(formData: FormData) {
  const { supabase, user } = await requireUser()           // ① AUTH

  const parsed = IssueBundleSchema.safeParse(
    Object.fromEntries(formData.entries()),
  )
  if (!parsed.success) {                                    // ② VALIDATE
    return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }
  }
  const input = parsed.data

  // ③ BUSINESS LOGIC HIỆN CÓ CỦA BẠN — GIỮ NGUYÊN 100%
  //    (đối chiếu tồn bundle, insert movement, update status...)
  //    Khuyến nghị chuyển sang supabase.rpc('issue_bundle_tx', {...}) để atomic.

  revalidatePath('/subcon')                                 // ④ SYNC UI
}
```

## 4. Khuyến nghị RLS mẫu (chạy trong SQL Editor — chỉ THÊM policy, không đổi schema)

```sql
-- Bật RLS (nếu chưa)
alter table public.subcon_orders enable row level security;

-- Chỉ user đã đăng nhập và có role sản xuất mới đọc/ghi
create policy "subcon_orders_select" on public.subcon_orders
  for select to authenticated
  using ( true );  -- siết thêm theo org_id/factory_id nếu hệ thống multi-tenant

create policy "subcon_orders_insert" on public.subcon_orders
  for insert to authenticated
  with check ( auth.uid() is not null );
```

> ⚠️ Nếu hệ thống multi-tenant (nhiều nhà máy/công ty dùng chung), điều kiện `using (true)`
> phải thay bằng đối chiếu `org_id = (select org_id from profiles where id = auth.uid())`.

---

**Bước tiếp theo đề xuất:** gửi `app/subcon/actions.ts` (+ file khởi tạo Supabase client
và `middleware.ts`) để audit chi tiết từng query — checklist trên mới là khung, chưa thay
thế được việc đọc code thật.
