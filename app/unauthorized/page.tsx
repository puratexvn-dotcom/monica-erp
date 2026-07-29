import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

import { createClient } from '@/utils/supabase/server';
import { isRole, ROLE_HOME, ROLE_LABEL } from '@/lib/rbac';

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
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </div>

        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-rose-600">Lỗi 403</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Bạn không có quyền vào khu vực này
        </h1>

        <p className="mt-4 text-base leading-relaxed text-slate-600">
          {from ? (
            <>
              Đường dẫn <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-800">{from}</code>{' '}
              thuộc phân hệ của bộ phận khác.
            </>
          ) : (
            'Phân hệ bạn vừa mở thuộc quyền quản lý của bộ phận khác.'
          )}{' '}
          Nếu đây là nhầm lẫn trong phân quyền, vui lòng liên hệ Quản trị hệ thống.
        </p>

        {role && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
            Tài khoản đang đăng nhập:
            <span className="font-bold text-slate-900">{ROLE_LABEL[role]}</span>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={home}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            Về phân hệ của tôi
          </Link>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-base font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              Đăng xuất
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
