import BrandFooter from '@/components/brand-footer';
import { LOGO_COLORS } from '@/lib/brand';
import { AuthBackdrop, AuthLogo } from '@/components/auth/auth-backdrop';
import LoginForm from './form';
import LoginIntro from './intro';
import {
  LoginHeading, LoginErrorNotice, LoginFooterLinks, type LoginErrorCode,
} from './heading';

// ============================================================================
// MÀN HÌNH ĐĂNG NHẬP — KHUNG · `UI-1.4`
//
// ─── TỆP NÀY GIỮ GÌ, VÀ ⛔ KHÔNG GIỮ GÌ ─────────────────────────────────
// Đây là **Server Component**: nó đọc `searchParams` *(`?next=` · `?error=`)*
// và dựng khung. Nó **⛔ không giữ một câu chữ hiển thị nào** — ngôn ngữ do
// người dùng chọn nằm ở `localStorage`, chỉ tồn tại phía trình duyệt, nên mọi
// chuỗi đi qua `t()` ở các component client bên cạnh.
//
// Trước `UI-1.4`, tệp này giữ **8 chuỗi tiếng Việt viết thẳng** — kể cả hai
// thông báo lỗi hạ tầng. Người dùng chọn tiếng Anh vẫn nhận tiếng Việt, đúng
// lúc họ cần hiểu nhất. Hiến pháp **Điều 45**.
//
// ⚠️ `?error=` được **thu về đúng hai mã hợp lệ** trước khi truyền xuống. Nhận
// bừa giá trị từ URL rồi bày ra màn hình là một lối chèn nội dung.
// ============================================================================

export const dynamic = 'force-dynamic';

function maLoi(raw: string | undefined): LoginErrorCode {
  return raw === 'config' || raw === 'unreachable' ? raw : null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100">
      <AuthBackdrop />
      {/* Quầng thứ ba — riêng của `/login`, để bố cục hai cột ⛔ không rỗng ở
          khoảng giữa. `update-password` là thẻ đơn nên ⛔ không cần. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: LOGO_COLORS[2], opacity: 0.22 }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 sm:px-6">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">
          {/* ── Cột giới thiệu — ẩn ở khổ hẹp để biểu mẫu lên trên ────── */}
          <section className="hidden lg:block">
            <AuthLogo className="mb-9 !mx-0 h-28 w-[22rem]" />
            <LoginIntro />
          </section>

          {/* ── Thẻ đăng nhập ──────────────────────────────────────── */}
          <section className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
              {/* Logo cho khổ hẹp — bản rộng đã có ở cột trái */}
              <AuthLogo className="mb-8 lg:hidden" />

              <LoginHeading />
              <LoginErrorNotice code={maLoi(error)} />
              <LoginForm next={next} />
              <LoginFooterLinks />
            </div>

            <BrandFooter className="mt-6" />
          </section>
        </div>
      </div>
    </main>
  );
}
