import { ShieldAlert } from 'lucide-react';

import { createClient } from '@/utils/supabase/server';
import { isRole, ROLE_HOME, ROLE_LABEL } from '@/lib/rbac';
import { STATUS } from '@/lib/design/tokens';
import ForbiddenContent from './content';

// ============================================================================
// TRANG 403 — KHUNG · `UI-1.4` *(phần dư)*
//
// ─── ⚠️ TRANG NÀY CỐ Ý ⛔ KHÔNG DÙNG `AuthBackdrop` ─────────────────────
// `/login` và `/update-password` là **cánh cửa vào** — chúng chia sẻ nền mờ và
// logo. Trang 403 là **thông báo lỗi**: nó phải trông **khác hẳn**, nếu ⛔ không
// người dùng sẽ tưởng mình chỉ cần đăng nhập lại là xong, trong khi sự thật là
// **tài khoản của họ ⛔ không có quyền vào đó**.
//
// Đây chính là lý do `UI-1.3` ⛔ **không** gộp ba trang vào một `layout.tsx`.
//
// ⚠️ `ROLE_LABEL[role]` tra ở **server** rồi truyền xuống dạng chuỗi: nhãn vai
// là **dữ liệu nghiệp vụ**, và Điều 45 cấm dịch dữ liệu nghiệp vụ.
// ============================================================================

export const dynamic = 'force-dynamic';

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = isRole(user?.app_metadata?.role) ? user.app_metadata.role : null;
  const home = role ? ROLE_HOME[role] : '/';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-10">
        <div
          className={`${STATUS.critical.chip} mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1`}
        >
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </div>

        <ForbiddenContent
          from={from}
          home={home}
          roleLabel={role ? ROLE_LABEL[role] : null}
        />
      </div>
    </main>
  );
}
