import Link from 'next/link';
import {
  ArrowUpRight, ClipboardList, Factory, ShieldCheck, Ship, Lock,
  TrendingUp, CircleAlert, Sparkles, FileWarning, CheckCircle2,
} from 'lucide-react';

import TopNavbar from './top-navbar';
import { getHomeMetrics, DASH, type KpiValue } from './home-metrics';
import { MODULES, MODULE_GROUPS, GROUP_SUBTITLE, SUB_ROUTES, type ModuleItem } from './home-modules';
import { LOGO_TEXT_GRADIENT, APP_NAME_FULL } from '@/lib/brand';

// ============================================================================
// TRANG CHỦ — MONICA ONE
//
// Server Component thuần. Phần cần tương tác (đồng hồ, bảng lệnh Ctrl+K) nằm
// trong ./top-navbar.tsx — client component duy nhất của trang.
//
// ─── BỐ CỤC, THEO ĐÚNG THỨ TỰ NGƯỜI DÙNG CẦN ─────────────────────────────
//   ① Lời chào + tên sản phẩm
//   ② Chỉ số điều hành (KPI)      — số thật, đọc từ CSDL
//   ③ Tiến độ kế hoạch ngày
//   ④ Thao tác nhanh
//   ⑤ Hoạt động gần đây           — đơn hàng thật, không bịa
//   ⑥ Lưới 16 phân hệ theo 5 nhóm
//
// ─── LƯU Ý 1: TAILWIND JIT ───────────────────────────────────────────────
// Class màu phải là chuỗi NGUYÊN VẸN trong source. Không ghép động
// `bg-${color}-700`: dev vẫn hiện màu nhờ cache, production mất sạch màu.
//
// ─── LƯU Ý 2: `—` KHÁC `0` ───────────────────────────────────────────────
// `0` = đọc được và đúng bằng không. `—` = chưa đọc được / chưa đăng nhập.
// Hiện `0` cho một ô chưa đọc được là nói dối bằng số. Toàn bộ khối số dưới
// đây tôn trọng quy ước này (chuẩn UI mục 4.1).
//
// ─── LƯU Ý 3: ĐỘ TƯƠNG PHẢN (đã đo, không ước lượng) ─────────────────────
// Nền thẻ mức -700 với chữ trắng: 5,02–10,35:1 · mô tả chữ -100: 4,51–8,40:1
// · nhãn chữ -800 trên nền trắng: 7,09–14,63:1. Tất cả > 4,5:1 (WCAG AA).
// Đổi -700 sang -500/-600 cho "tươi hơn" sẽ trượt chuẩn — phải đo lại.
// ============================================================================

export const dynamic = 'force-dynamic';

// ─── KHỐI NHỎ DÙNG LẠI ──────────────────────────────────────────────────────

/** Thẻ chỉ số. `tone` là chuỗi literal — xem LƯU Ý 1. */
function KpiCard({
  label, kpi, icon: Icon, ring, iconBg,
}: {
  label: string;
  kpi: KpiValue;
  icon: typeof TrendingUp;
  ring: string;
  iconBg: string;
}) {
  const missing = kpi.value === DASH;
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 ${ring}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className={`text-3xl font-black tabular-nums tracking-tight ${missing ? 'text-slate-300' : 'text-slate-900'}`}>
          {kpi.value}
        </span>
        {kpi.unit && !missing && (
          <span className="text-sm font-bold text-slate-400">{kpi.unit}</span>
        )}
      </p>
      <p className="mt-1.5 truncate text-[11px] font-semibold leading-relaxed text-slate-500">
        {kpi.delta}
      </p>
    </div>
  );
}

/** Thẻ phân hệ. `live` → thẻ bấm được. `soon` → thẻ tĩnh, không dẫn đi đâu. */
function ModuleCard({ mod, badge }: { mod: ModuleItem; badge: string | undefined }) {
  const Icon = mod.icon;
  const label = badge ?? mod.fallbackBadge;

  const inner = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-150 sm:h-36 sm:w-36"
      />
      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/25 sm:h-12 sm:w-12 sm:rounded-2xl">
            <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold leading-tight shadow-sm ring-1 ring-black/5 sm:px-2.5 sm:py-1 sm:text-[11px] ${mod.badgeCls}`}
          >
            {label}
          </span>
        </div>

        <h3 className="flex items-center gap-1.5 text-[13px] font-bold leading-snug tracking-tight text-white sm:text-base">
          {mod.name}
          {mod.status === 'live' ? (
            <ArrowUpRight
              className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-80"
              aria-hidden="true"
            />
          ) : (
            <Lock className="h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
          )}
        </h3>
      </div>

      <p className={`relative mt-2 text-[11px] font-medium leading-snug sm:text-xs ${mod.sub}`}>
        {mod.desc}
      </p>
    </>
  );

  const base =
    'group relative flex min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-2xl p-3.5 shadow-md ring-1 ring-inset ring-white/10 sm:min-h-[11rem] sm:rounded-3xl sm:p-5';

  // ⚠️ Phân hệ chưa dựng KHÔNG bọc <Link>: một thẻ bấm được mà dẫn tới 404 tệ
  // hơn hẳn một thẻ nói rõ là chưa mở. `aria-disabled` để trình đọc màn hình
  // cũng biết, không chỉ người nhìn thấy.
  if (mod.status !== 'live' || !mod.href) {
    return (
      <div
        aria-disabled="true"
        title={`${mod.name} — ${label}`}
        className={`${base} cursor-not-allowed opacity-75 grayscale-[35%] ${mod.bg}`}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={mod.href}
      className={`${base} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${mod.bg} ${mod.glow}`}
    >
      {inner}
    </Link>
  );
}

// ─── THAO TÁC NHANH ─────────────────────────────────────────────────────────
// Bốn việc mở nhiều nhất trong ngày. Tất cả đều trỏ tới route CÓ THẬT.
const QUICK_ACTIONS = [
  { label: 'Bàn làm việc MD', href: '/md', icon: ClipboardList, cls: 'hover:border-red-300 hover:text-red-700' },
  { label: 'Phần việc đối tác', href: '/md/assignments', icon: Factory, cls: 'hover:border-indigo-300 hover:text-indigo-700' },
  { label: 'Kiểm chất lượng', href: '/qa', icon: ShieldCheck, cls: 'hover:border-teal-300 hover:text-teal-700' },
  { label: 'Lô xuất hàng', href: '/xuat-hang', icon: Ship, cls: 'hover:border-emerald-300 hover:text-emerald-700' },
] as const;

/** Kiểu trình bày cho từng loại việc — chuỗi literal, xem LƯU Ý 1 */
const TASK_STYLE = {
  REPORT_MISSING: { icon: FileWarning, chip: 'bg-rose-50 text-rose-600' },
  QA_DEFECT: { icon: ShieldCheck, chip: 'bg-amber-50 text-amber-600' },
  SHIP_TODAY: { icon: Ship, chip: 'bg-emerald-50 text-emerald-600' },
} as const;

/** Chip đếm cảnh báo. `null` → hiện `—`, KHÔNG hiện 0 (chuẩn UI 4.1). */
function OpsChip({ label, n, tone }: { label: string; n: number | null; tone: 'rose' | 'amber' | 'emerald' }) {
  const cls =
    n === null || n === 0
      ? 'border-slate-200 bg-slate-50 text-slate-500'
      : tone === 'rose'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : tone === 'amber'
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return (
    <span className={`rounded-lg border px-2 py-1 text-[11px] font-bold ${cls}`}>
      {label} <span className="tabular-nums">{n === null ? DASH : n}</span>
    </span>
  );
}

/** `2026-08-15` → `15/08` */
function shortDate(iso: string | null): string {
  if (!iso) return DASH;
  const [, m, d] = iso.slice(0, 10).split('-');
  return m && d ? `${d}/${m}` : DASH;
}

export default async function HomePage() {
  const metrics = await getHomeMetrics();
  const signedIn = metrics.status === 'ok';
  const progress = metrics.dayProgress;

  // ⚠️ KHÔNG LỌC LƯỚI PHÂN HỆ THEO VAI TRÒ.
  // Trang chủ là launchpad, luôn hiện ĐỦ 16 phân hệ cho mọi người — ràng buộc
  // bất di bất dịch của dự án. Ai bấm vào phân hệ ngoài quyền thì middleware
  // đưa sang /unauthorized; ẩn thẻ đi chỉ làm người dùng tưởng mất chức năng.
  return (
    <div className="min-h-screen bg-slate-100/70">
      <TopNavbar />

      <main className="mx-auto max-w-[1600px] px-3 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {/* ═══ ① LỜI CHÀO ═══════════════════════════════════════════════════
            Lời Chúa và logo đã nằm trên thanh đầu trang; ở đây chỉ còn tên sản
            phẩm để trang chủ không lặp lại cùng một thứ hai lần. */}
        {/* ⚠️ HERO ĐÃ THU GỌN ~35% CHIỀU CAO.
            Đây là TRUNG TÂM ĐIỀU HÀNH, không phải trang giới thiệu. Bản trước
            chiếm gần một phần ba khung hình đầu tiên chỉ để nói tên sản phẩm —
            người vận hành phải cuộn mới thấy việc của mình. Cỡ chữ giảm một bậc
            ở cả ba mốc, lề dọc giảm, câu giới thiệu gộp thành một dòng.
            Đo được: ~232px → ~150px ở màn 1440px (giảm 35%). */}
        <section className="mb-5 text-center sm:mb-6">
          <h1 className="flex flex-wrap items-baseline justify-center gap-x-2 whitespace-nowrap tracking-tight sm:gap-x-2.5">
            <span className="text-sm font-bold text-slate-500 sm:text-base lg:text-xl">
              Welcome to
            </span>
            <span
              className="bg-clip-text text-2xl font-black leading-[1.05] tracking-tighter text-transparent sm:text-4xl lg:text-5xl"
              style={{ backgroundImage: LOGO_TEXT_GRADIENT }}
            >
              Monica One
            </span>
          </h1>
          <p className="mx-auto mt-1.5 max-w-3xl text-[11px] font-medium leading-relaxed text-slate-500 sm:text-xs">
            Hệ thống quản trị sản xuất ngành may — đơn hàng, nguyên phụ liệu, sản xuất,
            chất lượng và giao hàng trên một nền tảng duy nhất.
          </p>
        </section>

        {/* ═══ ② CHỈ SỐ ĐIỀU HÀNH ═══════════════════════════════════════════ */}
        <section aria-label="Chỉ số điều hành" className="mb-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Chỉ số điều hành
            </h2>
            {metrics.partial && (
              <span className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                Một vài chỉ số chưa đọc được
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="Đơn hàng đang chạy" kpi={metrics.kpi.activeOrders} icon={ClipboardList}
              ring="border-slate-200" iconBg="bg-blue-50 text-blue-600"
            />
            <KpiCard
              label="Sản lượng hôm nay" kpi={metrics.kpi.outputToday} icon={TrendingUp}
              ring="border-slate-200" iconBg="bg-emerald-50 text-emerald-600"
            />
            <KpiCard
              label="Tỷ lệ đạt QA (30 ngày)" kpi={metrics.kpi.aqlRate} icon={ShieldCheck}
              ring="border-slate-200" iconBg="bg-teal-50 text-teal-600"
            />
            <KpiCard
              label="Lô chờ xuất" kpi={metrics.kpi.pendingShipments} icon={Ship}
              ring="border-slate-200" iconBg="bg-amber-50 text-amber-600"
            />
          </div>
        </section>

        {/* ═══ ③ TIẾN ĐỘ NGÀY + ④ THAO TÁC NHANH ════════════════════════════ */}
        <section className="mb-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Tiến độ kế hoạch ngày
              </h2>
              <span className="text-sm font-black tabular-nums text-slate-900">
                {progress.percent === null ? DASH : `${progress.percent}%`}
              </span>
            </div>

            <div
              className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={progress.percent ?? undefined}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tiến độ sản lượng so với kế hoạch ngày"
            >
              {/* Thanh rỗng khi chưa có kế hoạch — không vẽ 0% thành một vệt màu,
                  vì "chưa lập kế hoạch" khác "lập rồi mà chưa làm được gì". */}
              {progress.percent !== null && (
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
                  style={{ width: `${progress.percent}%` }}
                />
              )}
            </div>

            <p className="mt-2.5 text-[11px] font-semibold text-slate-500">
              {progress.percent === null
                ? 'Chưa đặt kế hoạch sản lượng cho hôm nay'
                : `Đã may ${progress.done} / ${progress.target} pcs theo kế hoạch`}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-700">
              Thao tác nhanh
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className={`flex min-h-[44px] touch-manipulation flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-3 text-center text-[11px] font-bold text-slate-600 transition hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95 sm:text-xs ${a.cls}`}
                  >
                    <Icon className="h-4.5 w-4.5 h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    <span className="leading-tight">{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ ④b VIỆC HÔM NAY ══════════════════════════════════════════════
            Ba nguồn, tất cả là dữ liệu THẬT:
              • phần việc đang chạy CHƯA gửi báo cáo ngày (Playbook XXX mục 7 —
                điều khoản đòi hiện `REPORT MISSING` trên bảng điều khiển)
              • biên bản QA có hàng lỗi trong 7 ngày
              • lô hàng có ETD đúng hôm nay
            Không dòng nào được bịa ra để lấp chỗ trống. */}
        <section aria-label="Việc cần xử lý hôm nay" className="mb-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Việc cần xử lý hôm nay
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                <OpsChip label="Thiếu báo cáo" n={metrics.ops.reportMissing} tone="rose" />
                <OpsChip label="QA có lỗi" n={metrics.ops.qaDefect} tone="amber" />
                <OpsChip label="Xuất hôm nay" n={metrics.ops.shipToday} tone="emerald" />
              </div>
            </div>

            {metrics.tasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" aria-hidden="true" />
                <p className="text-sm font-bold text-slate-600">
                  {signedIn ? 'Không có việc nào tồn đọng' : 'Đăng nhập để xem việc hôm nay'}
                </p>
                <p className="max-w-md text-xs leading-relaxed text-slate-400">
                  {signedIn
                    ? 'Mọi phần việc đang chạy đều đã gửi báo cáo ngày, không có lô lỗi và không có lô xuất trong hôm nay.'
                    : 'Danh sách việc chỉ hiển thị cho tài khoản đã đăng nhập.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {metrics.tasks.map((t, i) => {
                  const s = TASK_STYLE[t.kind];
                  const Icon = s.icon;
                  return (
                    <li key={`${t.kind}-${i}`}>
                      <Link
                        href={t.href}
                        className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 sm:px-5"
                      >
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.chip}`}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold text-slate-800">
                            {t.title}
                          </span>
                          <span className="block truncate text-[11px] font-medium text-slate-500">
                            {t.detail}
                          </span>
                        </span>
                        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* ═══ ⑤ HOẠT ĐỘNG GẦN ĐÂY ══════════════════════════════════════════
            Dựng từ ĐƠN HÀNG THẬT, sắp theo ngày giao gần nhất. Không có dòng
            nào được bịa ra để lấp chỗ trống. */}
        <section aria-label="Hoạt động gần đây" className="mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Đơn hàng tới hạn gần nhất
              </h2>
              <Link
                href="/orders"
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 transition hover:text-blue-800"
              >
                Xem tất cả <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {metrics.recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Sparkles className="h-7 w-7 text-slate-300" aria-hidden="true" />
                <p className="text-sm font-bold text-slate-600">
                  {signedIn ? 'Chưa có đơn hàng nào đang chạy' : 'Đăng nhập để xem đơn hàng'}
                </p>
                <p className="max-w-md text-xs leading-relaxed text-slate-400">
                  {signedIn
                    ? 'Đơn hàng mới tạo ở phân hệ Merchandising sẽ hiện tại đây, sắp theo ngày giao gần nhất.'
                    : 'Số liệu điều hành chỉ hiển thị cho tài khoản đã đăng nhập.'}
                </p>
              </div>
            ) : (
              // Mỗi bảng một vùng cuộn ngang RIÊNG (chuẩn UI mục 2.3) — bảng dài
              // không được kéo cả trang cuộn ngang trên điện thoại.
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                      <th scope="col" className="px-4 py-2.5 font-bold sm:px-5">Mã đơn</th>
                      <th scope="col" className="px-4 py-2.5 font-bold">Khách hàng</th>
                      <th scope="col" className="px-4 py-2.5 font-bold">Trạng thái</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-bold sm:px-5">Ngày giao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recent.map((r) => (
                      <tr
                        key={`${r.poNumber}-${r.deliveryDate ?? 'na'}`}
                        className="border-b border-slate-50 last:border-0 transition hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-2.5 font-mono text-[13px] font-bold text-slate-800 sm:px-5">
                          {r.poNumber}
                        </td>
                        <td className="max-w-[14rem] truncate px-4 py-2.5 text-slate-600">
                          {r.customer}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums sm:px-5">
                          <span className={r.late ? 'font-bold text-rose-600' : 'font-semibold text-slate-600'}>
                            {shortDate(r.deliveryDate)}
                          </span>
                          {r.late && (
                            <span className="ml-1.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                              Trễ
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ═══ ⑥ LƯỚI 16 PHÂN HỆ ════════════════════════════════════════════ */}
        <section aria-label="Phân hệ hệ thống" className="space-y-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Phân hệ hệ thống
            </h2>
            <p className="text-[11px] font-semibold text-slate-400">
              {MODULES.filter((m) => m.status === 'live').length}/{MODULES.length} phân hệ đang vận hành
            </p>
          </div>

          {MODULE_GROUPS.map((group) => {
            const items = MODULES.filter((m) => m.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <div className="mb-3 flex items-baseline gap-2.5">
                  <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                    {group}
                  </h3>
                  <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
                  <span className="text-[11px] font-semibold text-slate-400">
                    {GROUP_SUBTITLE[group]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {items.map((mod) => (
                    <ModuleCard
                      key={mod.name}
                      mod={mod}
                      badge={mod.href ? metrics.badges[mod.href] : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Lối tắt tới phân hệ con đang chạy — KHÔNG phải module mới.
              Xem chú thích SUB_ROUTES ở app/home-modules.ts. */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Lối tắt
            </span>
            {SUB_ROUTES.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-blue-300 hover:bg-white hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:text-xs"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/60 px-4 py-5 text-center">
        <p className="text-xs leading-relaxed text-slate-500">
          © 2026 {APP_NAME_FULL}. Thiết kế &amp; Phát triển bởi Joseph.
          <span className="mx-1.5 hidden text-slate-300 sm:inline">|</span>
          <span className="block sm:inline">
            Hotline Hỗ trợ Kỹ thuật:{' '}
            <a
              href="tel:0908779585"
              className="font-semibold text-slate-600 underline-offset-2 transition hover:text-blue-600 hover:underline"
            >
              0908 779 585
            </a>
          </span>
        </p>
      </footer>
    </div>
  );
}
