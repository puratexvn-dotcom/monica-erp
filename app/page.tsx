import Link from 'next/link';
import {
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  Package,
  Archive,
  ShieldCheck,
  Scissors,
  Shirt,
  Box,
  Users,
  Settings,
  Activity,
  TrendingUp,
  Target,
  Container,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

import TopNavbar, { type NavModule } from './top-navbar';
import { getHomeMetrics, DASH, type HomeMetrics } from './home-metrics';

// ============================================================================
// TRANG CHỦ — ULTRA PREMIUM ENTERPRISE DASHBOARD
//
// Server Component thuần: toàn bộ nội dung dưới đây được prerender tĩnh.
// Phần cần tương tác (đồng hồ realtime, bảng lệnh Ctrl+K) nằm trong
// ./top-navbar.tsx — client component duy nhất của trang.
//
// ─── LƯU Ý 1: TAILWIND JIT ───────────────────────────────────────────────
// Tailwind chỉ sinh CSS cho class xuất hiện NGUYÊN VẸN trong source. Mọi
// class màu dưới đây phải là chuỗi literal. Tuyệt đối không ghép động kiểu
// `bg-${color}-700` — dev server có thể vẫn hiện màu nhờ cache, nhưng bản
// production build sẽ mất sạch màu.
//
// ─── LƯU Ý 2: SỐ LIỆU LẤY TỪ SUPABASE ────────────────────────────────────
// KPI và nhãn góc thẻ đọc thật từ DB qua ./home-metrics.ts. Mảng MODULES và
// KPI_CARDS dưới đây chỉ còn giữ phần TRÌNH BÀY (tên, icon, màu); phần SỐ
// tra theo href trong metrics.badges.
// Vì phải đọc cookie phiên đăng nhập nên trang chuyển sang render động
// (force-dynamic), không còn prerender tĩnh như trước.
// Khi không lấy được số (chưa đăng nhập / lỗi truy vấn) thì hiện dấu "—",
// TUYỆT ĐỐI không hiện 0: trong ERP, "0 PO đang chạy" và "không đọc được số"
// là hai chuyện khác hẳn nhau.
//
// ─── LƯU Ý 3: ĐỘ TƯƠNG PHẢN (đã đo, không phải ước lượng) ────────────────
// Nền thẻ mức -700 được chọn vì các mức nhạt hơn KHÔNG đạt chuẩn với chữ
// trắng: amber-600/white chỉ 3,3:1 và green-600/white 3,4:1 (cần >= 4,5:1).
// Tỷ lệ đo được trên cả 12 dải màu:
//   tiêu đề  (trắng    / nền -700) : 5,02 – 10,35:1   > 4,5  AA
//   mô tả    (chữ -100 / nền -700) : 4,51 –  8,40:1   > 4,5  AA
//   nhãn     (chữ -800 / nền trắng): 7,09 – 14,63:1   > 4,5  AA
//   icon     (trắng / chip white/15): 3,83 – 6,59:1   > 3,0  AA đồ hoạ
// Khi đổi màu, phải đo lại — đừng đổi -700 sang -500/-600 cho "tươi hơn".
// ============================================================================

interface ModuleItem {
  name: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  /**
   * Kiểu nhãn: nền TRẮNG ĐẶC + chữ mức -800 cùng dải màu.
   * Không dùng nền trong suốt (bg-white/20): khi phủ lên nền thẻ -700 thì
   * chữ trắng chỉ còn 3,5–4,5:1 — trượt chuẩn WCAG AA ở 8/12 dải màu.
   */
  badgeCls: string;
  /** Nền thẻ (đặc, mức -700) */
  bg: string;
  /** Màu chữ mô tả — mức -100 cùng dải để vẫn đạt tương phản */
  sub: string;
  /** Bóng đổ nhuốm màu khi hover */
  glow: string;
  /** Chấm màu dùng lại trong bảng lệnh Ctrl+K */
  dot: string;
}

const MODULES: ModuleItem[] = [
  {
    name: 'Ban Giám Đốc', desc: 'Báo cáo tổng quan & Phê duyệt', href: '/giam-doc', icon: BarChart3,
    bg: 'bg-slate-700', badgeCls: 'bg-white text-slate-800', sub: 'text-slate-200', glow: 'hover:shadow-slate-500/40', dot: 'bg-slate-700',
  },
  {
    name: 'Merchandiser & Thu Mua', desc: 'Đơn hàng, tiến độ & mua NPL', href: '/md', icon: Briefcase,
    bg: 'bg-red-700', badgeCls: 'bg-white text-red-800', sub: 'text-red-100', glow: 'hover:shadow-red-500/40', dot: 'bg-red-700',
  },
  {
    name: 'Khách Hàng', desc: 'Hồ sơ đối tác & Đơn đặt hàng', href: '/buyer', icon: Building2,
    bg: 'bg-orange-700', badgeCls: 'bg-white text-orange-800', sub: 'text-orange-100', glow: 'hover:shadow-orange-500/40', dot: 'bg-orange-700',
  },
  {
    name: 'Kế Toán', desc: 'Công nợ & Thanh toán', href: '/ke-toan', icon: Calculator,
    bg: 'bg-amber-700', badgeCls: 'bg-white text-amber-800', sub: 'text-amber-100', glow: 'hover:shadow-amber-500/40', dot: 'bg-amber-700',
  },
  {
    name: 'Kho Vật Tư', desc: 'Xuất/Nhập & Tồn kho NPL', href: '/kho', icon: Package,
    bg: 'bg-green-700', badgeCls: 'bg-white text-green-800', sub: 'text-green-100', glow: 'hover:shadow-green-500/40', dot: 'bg-green-700',
  },
  {
    name: 'Kho Thành Phẩm', desc: 'Nhập kho FG & Đóng container', href: '/xuat-hang', icon: Archive,
    bg: 'bg-emerald-700', badgeCls: 'bg-white text-emerald-800', sub: 'text-emerald-100', glow: 'hover:shadow-emerald-500/40', dot: 'bg-emerald-700',
  },
  {
    name: 'QA / QC', desc: 'Kiểm soát chất lượng & AQL', href: '/qa', icon: ShieldCheck,
    bg: 'bg-teal-700', badgeCls: 'bg-white text-teal-800', sub: 'text-teal-100', glow: 'hover:shadow-teal-500/40', dot: 'bg-teal-700',
  },
  {
    name: 'Tổ Trưởng Cắt', desc: 'Sản lượng cắt & Bán thành phẩm', href: '/to-truong-cat', icon: Scissors,
    bg: 'bg-cyan-700', badgeCls: 'bg-white text-cyan-800', sub: 'text-cyan-100', glow: 'hover:shadow-cyan-500/40', dot: 'bg-cyan-700',
  },
  {
    name: 'Tổ Trưởng May', desc: 'Sản lượng chuyền may', href: '/to-truong-may', icon: Shirt,
    bg: 'bg-blue-700', badgeCls: 'bg-white text-blue-800', sub: 'text-blue-100', glow: 'hover:shadow-blue-500/40', dot: 'bg-blue-700',
  },
  {
    name: 'Tổ Hoàn Thành', desc: 'Ủi, Đóng gói & Xuất hàng', href: '/hoan-thanh', icon: Box,
    bg: 'bg-indigo-700', badgeCls: 'bg-white text-indigo-800', sub: 'text-indigo-100', glow: 'hover:shadow-indigo-500/40', dot: 'bg-indigo-700',
  },
  {
    name: 'Trạm Subcon', desc: 'Cổng báo cáo Xưởng gia công', href: '/subcon', icon: Users,
    bg: 'bg-violet-700', badgeCls: 'bg-white text-violet-800', sub: 'text-violet-100', glow: 'hover:shadow-violet-500/40', dot: 'bg-violet-700',
  },
  {
    name: 'Quản Trị Hệ Thống', desc: 'Cài đặt & Phân quyền', href: '/admin', icon: Settings,
    bg: 'bg-fuchsia-700', badgeCls: 'bg-white text-fuchsia-800', sub: 'text-fuchsia-100', glow: 'hover:shadow-fuchsia-500/40', dot: 'bg-fuchsia-700',
  },
];

/** Chỉ cấu hình trình bày — số thực lấy từ metrics.kpi[key] */
interface KpiCard {
  key: keyof HomeMetrics['kpi'];
  label: string;
  icon: LucideIcon;
  chip: string;
}

const KPI_CARDS: KpiCard[] = [
  { key: 'activeOrders', label: 'Đơn hàng đang chạy', icon: Activity, chip: 'bg-indigo-50 text-indigo-600' },
  { key: 'outputToday', label: 'Sản lượng may hôm nay', icon: TrendingUp, chip: 'bg-emerald-50 text-emerald-600' },
  { key: 'aqlRate', label: 'Tỷ lệ đạt AQL (30 ngày)', icon: Target, chip: 'bg-teal-50 text-teal-600' },
  { key: 'pendingShipments', label: 'Lô hàng chờ xuất', icon: Container, chip: 'bg-amber-50 text-amber-600' },
];

// Chỉ truyền trường serialize được sang client — không truyền icon component
const NAV_MODULES: NavModule[] = MODULES.map(({ name, desc, href, dot }) => ({ name, desc, href, dot }));

// Đọc cookie phiên đăng nhập => không thể prerender tĩnh
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const metrics = await getHomeMetrics();
  const live = metrics.status === 'ok';

  return (
    <div className="min-h-screen bg-slate-100/70">
      <TopNavbar modules={NAV_MODULES} />

      {/* pb-28: chừa chỗ cho system footer cố định ở đáy màn hình */}
      <main className="mx-auto max-w-[1600px] px-4 pb-28 pt-10 sm:px-6 lg:px-8">
        {/* ================= LỜI CHÀO ================= */}
        <section className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
            Monica Garment · Hệ thống quản trị sản xuất
          </p>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Welcome to <span className="text-indigo-600">Monica</span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            Nền tảng quản trị dữ liệu hợp nhất từ Đơn hàng đến Xuất container. Vui lòng chọn phân hệ
            làm việc của bạn.
          </p>
        </section>

        {/* ================= DẢI KPI ================= */}
        <section aria-label="Chỉ số vận hành" className="mb-12">
          {/* Nói rõ vì sao đang thiếu số, thay vì để người dùng tưởng nhà máy đứng im */}
          {metrics.status === 'error' && (
            <p className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-base font-semibold text-rose-900">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              Không kết nối được máy chủ dữ liệu. Các chỉ số bên dưới tạm thời chưa khả dụng.
            </p>
          )}
          {metrics.status === 'ok' && metrics.partial && (
            <p className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-base font-semibold text-amber-900">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              Một số bảng dữ liệu không đọc được — các ô hiện dấu “{DASH}” là số còn thiếu.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {KPI_CARDS.map((card) => {
              const Icon = card.icon;
              const m = metrics.kpi[card.key];
              const hasValue = m.value !== DASH;
              return (
                <div
                  key={card.key}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.chip}`}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    {live && hasValue ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        LIVE
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                        CHƯA CÓ SỐ
                      </span>
                    )}
                  </div>
                  <p className="text-base font-semibold text-slate-500">{card.label}</p>
                  <p className="mt-1.5 flex items-baseline gap-1.5">
                    <span
                      className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${hasValue ? 'text-slate-900' : 'text-slate-300'}`}
                    >
                      {m.value}
                    </span>
                    {hasValue && m.unit && <span className="text-base font-bold text-slate-400">{m.unit}</span>}
                  </p>
                  <p className={`mt-2 text-sm font-semibold ${hasValue ? 'text-slate-500' : 'text-slate-400'}`}>
                    {m.delta}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= LƯỚI PHÂN HỆ ================= */}
        <section aria-label="Danh sách phân hệ">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Phân hệ làm việc</h2>
            <p className="text-base font-semibold text-slate-500">{MODULES.length} phân hệ</p>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className={`group relative flex min-h-[15rem] flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-lg ring-1 ring-inset ring-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${mod.bg} ${mod.glow}`}
                >
                  {/* Vệt sáng trang trí góc trên — nằm dưới nội dung, không cản click */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-150"
                  />

                  <div className="relative">
                    <div className="mb-6 flex items-start justify-between gap-3">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/25">
                        <Icon className="h-8 w-8 text-white" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ring-1 ring-black/5 ${mod.badgeCls}`}
                      >
                        {metrics.badges[mod.href] ?? DASH}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold leading-snug tracking-tight text-white">
                      {mod.name}
                    </h3>
                  </div>

                  <p className={`relative mt-3 text-base font-medium leading-relaxed ${mod.sub}`}>
                    {mod.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* ================= SYSTEM FOOTER CỐ ĐỊNH ================= */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-3.5 text-center sm:px-6 lg:px-8">
          <span className="text-base font-semibold text-slate-700">Bản quyền © Joseph</span>
          <span className="text-slate-300" aria-hidden="true">|</span>
          <span className="text-base font-semibold text-slate-700">
            Hotline:{' '}
            <a
              href="tel:0908779585"
              className="font-bold text-indigo-600 underline-offset-4 transition-colors hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
              0908779585
            </a>
          </span>
          <span className="text-slate-300" aria-hidden="true">|</span>
          <span className="flex items-center gap-2 text-base font-semibold text-slate-700">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Trạng thái: <span className="font-bold text-emerald-600">Ổn định</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
