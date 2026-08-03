import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Layers, FileCheck2, AlertTriangle, ArrowLeft } from 'lucide-react';

import { LOGO_SRC, LOGO_ALT } from '@/lib/brand';
import BrandFooter from '@/components/brand-footer';
import LoginForm from './form';

export const dynamic = 'force-dynamic';

// Ba trụ cột hiến định, nói bằng ngôn ngữ khách hàng chứ không bằng ngôn ngữ
// kỹ thuật: một nền tảng (§7) · phân quyền theo Workspace (§10) · bằng chứng
// và truy vết (§8). Đúng ba thứ phân biệt MONICA ONE với một ERP thông thường.
const HIGHLIGHTS = [
  { icon: Layers, text: 'Một nền tảng vận hành hợp nhất cho toàn doanh nghiệp' },
  { icon: ShieldCheck, text: 'Không gian làm việc theo vai trò, phân quyền chặt' },
  { icon: FileCheck2, text: 'Mọi thao tác đều có bằng chứng và truy vết đầy đủ' },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  // Middleware chuyển hướng về đây kèm ?error= khi KHÔNG THỂ xác thực, để lỗi
  // hạ tầng hiện thành câu tiếng Việt rõ ràng thay vì trang 500 trống trơn.
  const configError =
    error === 'config'
      ? 'Hệ thống chưa được cấu hình kết nối máy chủ dữ liệu. Quản trị viên cần kiểm tra biến môi trường trên Vercel rồi Redeploy — đổi biến không tự kích hoạt build lại.'
      : error === 'unreachable'
        ? 'Không liên lạc được máy chủ xác thực. Vui lòng thử lại sau ít phút.'
        : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100">
      {/* ── Nền kính mờ ─────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-blue-300/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-32 h-[36rem] w-[36rem] rounded-full bg-blue-300/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 sm:px-6">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">
          {/* ── Cột giới thiệu (ẩn trên mobile để form lên trên) ────── */}
          <section className="hidden lg:block">
            <div className="relative mb-9 h-28 w-[22rem]">
              <Image
                src={LOGO_SRC}
                alt={LOGO_ALT}
                fill
                sizes="352px"
                className="object-contain object-left"
                priority
              />
            </div>

            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
              Business Operating System
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 xl:text-5xl">
              Chào mừng trở lại.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
              Đăng nhập bằng tài khoản công ty để vào không gian làm việc được cấp quyền của bạn.
            </p>

            <ul className="mt-10 space-y-3.5">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-blue-600 shadow-sm backdrop-blur">
                    <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="pt-2 text-[15px] font-semibold leading-snug text-slate-700">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Thẻ đăng nhập ──────────────────────────────────────── */}
          <section className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
              {/* Logo cho mobile — bản desktop đã có ở cột trái */}
              <div className="relative mx-auto mb-8 h-24 w-72 lg:hidden">
                <Image
                  src={LOGO_SRC}
                  alt={LOGO_ALT}
                  fill
                  sizes="288px"
                  className="object-contain"
                  priority
                />
              </div>

              <div className="mb-7">
                <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-slate-900">
                  Đăng nhập
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                  Dùng tài khoản công ty do Quản trị hệ thống cấp.
                </p>
              </div>

              {configError && (
                <p
                  role="alert"
                  className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
                >
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  {configError}
                </p>
              )}

              <LoginForm next={next} />

              {/* ── Lối về trang chủ ─────────────────────────────────────
                  Nút phụ, viền nhạt, không cạnh tranh với nút Đăng nhập. Đặt
                  ngay dưới biểu mẫu vì đó là nơi mắt dừng lại sau khi đọc xong
                  form. Cao 44px và có vòng focus riêng — đi bằng Tab tới đây
                  vẫn thấy rõ mình đang ở đâu. */}
              <Link
                href="/"
                className="mt-6 flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                Về trang chủ
              </Link>

              <p className="mt-6 border-t border-slate-200 pt-5 text-center text-[13px] leading-relaxed text-slate-500">
                Quên mật khẩu hoặc chưa có tài khoản? Liên hệ Quản trị hệ thống —{' '}
                <a
                  href="tel:0908779585"
                  className="font-bold text-blue-600 underline-offset-4 transition hover:underline"
                >
                  0908 779 585
                </a>
              </p>
            </div>

            <BrandFooter className="mt-6" />
          </section>
        </div>
      </div>
    </main>
  );
}
