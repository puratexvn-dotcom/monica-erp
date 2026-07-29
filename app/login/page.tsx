import Image from 'next/image';
import { ShieldCheck, Lock, Factory } from 'lucide-react';

import LoginForm from './form';

export const dynamic = 'force-dynamic';

const HIGHLIGHTS = [
  { icon: Factory, text: 'Toàn tuyến sản xuất trên một nền tảng dữ liệu' },
  { icon: ShieldCheck, text: 'Phân quyền chặt theo từng bộ phận' },
  { icon: Lock, text: 'Bắt buộc đổi mật khẩu ở lần đăng nhập đầu' },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100">
      {/* ── Nền kính mờ ─────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-indigo-300/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-32 h-[36rem] w-[36rem] rounded-full bg-violet-300/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 sm:px-6">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">
          {/* ── Cột giới thiệu (ẩn trên mobile để form lên trên) ────── */}
          <section className="hidden lg:block">
            <div className="relative mb-8 h-16 w-52">
              <Image
                src="/monica-logo.jpg"
                alt="Monica Garment"
                fill
                sizes="208px"
                className="object-contain object-left"
                priority
              />
            </div>

            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
              Hệ thống quản trị sản xuất
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 xl:text-5xl">
              Chào mừng trở lại với <span className="text-indigo-600">MONICA&nbsp;ERP</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
              Đăng nhập bằng tài khoản công ty để vào phân hệ làm việc của bộ phận bạn.
            </p>

            <ul className="mt-9 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/70 text-indigo-600 shadow-sm backdrop-blur">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-base font-semibold text-slate-700">{text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Thẻ đăng nhập ──────────────────────────────────────── */}
          <section className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
              {/* Logo cho mobile — bản desktop đã có ở cột trái */}
              <div className="relative mx-auto mb-7 h-14 w-44 lg:hidden">
                <Image
                  src="/monica-logo.jpg"
                  alt="Monica Garment"
                  fill
                  sizes="176px"
                  className="object-contain"
                  priority
                />
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Đăng nhập</h2>
                <p className="mt-2 text-base text-slate-500">
                  Vui lòng dùng tài khoản do Quản trị hệ thống cấp.
                </p>
              </div>

              <LoginForm next={next} />

              <p className="mt-7 border-t border-slate-200 pt-5 text-center text-sm leading-relaxed text-slate-500">
                Quên mật khẩu hoặc chưa có tài khoản? Liên hệ Quản trị hệ thống —{' '}
                <a
                  href="tel:0908779585"
                  className="font-bold text-indigo-600 underline-offset-4 transition hover:underline"
                >
                  0908779585
                </a>
              </p>
            </div>

            <p className="mt-6 text-center text-sm font-medium text-slate-500">
              Bản quyền © Joseph · Monica Garment ERP
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
