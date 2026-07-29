import Image from "next/image";
import Link from "next/link";
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
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// TRANG CHỦ — LAUNCHPAD PHÂN HỆ
//
// Server Component thuần (không 'use client') => trang được prerender tĩnh,
// không tốn JS phía client. Mọi điều hướng dùng <Link> của Next.js.
//
// Quy ước màu: mỗi NHÓM nghiệp vụ mang một tone riêng, dùng xuyên suốt cho
// nền pastel, viền, icon và gạch chân tiêu đề nhóm — giúp người dùng định vị
// phân hệ bằng màu thay vì phải đọc hết chữ.
//
// LƯU Ý KHI SỬA: Tailwind JIT chỉ sinh CSS cho các class xuất hiện nguyên vẹn
// trong source. Vì vậy TONE bên dưới phải viết class đầy đủ dạng chuỗi literal,
// TUYỆT ĐỐI không ghép chuỗi kiểu `bg-${color}-50` — class đó sẽ không được sinh.
// ============================================================================

type Tone = "indigo" | "amber" | "rose" | "emerald" | "slate";

interface ToneStyle {
  /** Chấm tròn + nhãn của tiêu đề nhóm */
  dot: string;
  label: string;
  /** Gạch chân mảnh chạy hết chiều ngang nhóm */
  rule: string;
  /** Nền pastel + viền màu của tile (thay cho nền trắng đơn điệu) */
  tile: string;
  /** Khung icon: nền trắng viền màu, hover đảo thành nền đặc */
  iconWrap: string;
  icon: string;
  /** Màu tiêu đề khi hover + dòng CTA "Truy cập" */
  title: string;
  cta: string;
  /** Ring khi focus bằng bàn phím (a11y) */
  ring: string;
}

const TONE: Record<Tone, ToneStyle> = {
  indigo: {
    dot: "bg-indigo-500",
    label: "text-indigo-700",
    rule: "from-indigo-200",
    tile: "border-indigo-200 bg-indigo-50/60 hover:border-indigo-400 hover:bg-indigo-50",
    iconWrap: "bg-white ring-1 ring-indigo-200 group-hover:bg-indigo-600 group-hover:ring-indigo-600",
    icon: "text-indigo-600 group-hover:text-white",
    title: "group-hover:text-indigo-700",
    cta: "text-indigo-600",
    ring: "focus-visible:ring-indigo-400",
  },
  amber: {
    dot: "bg-amber-500",
    label: "text-amber-700",
    rule: "from-amber-200",
    tile: "border-amber-200 bg-amber-50/60 hover:border-amber-400 hover:bg-amber-50",
    iconWrap: "bg-white ring-1 ring-amber-200 group-hover:bg-amber-500 group-hover:ring-amber-500",
    icon: "text-amber-600 group-hover:text-white",
    title: "group-hover:text-amber-700",
    cta: "text-amber-600",
    ring: "focus-visible:ring-amber-400",
  },
  rose: {
    dot: "bg-rose-500",
    label: "text-rose-700",
    rule: "from-rose-200",
    tile: "border-rose-200 bg-rose-50/60 hover:border-rose-400 hover:bg-rose-50",
    iconWrap: "bg-white ring-1 ring-rose-200 group-hover:bg-rose-500 group-hover:ring-rose-500",
    icon: "text-rose-600 group-hover:text-white",
    title: "group-hover:text-rose-700",
    cta: "text-rose-600",
    ring: "focus-visible:ring-rose-400",
  },
  emerald: {
    dot: "bg-emerald-500",
    label: "text-emerald-700",
    rule: "from-emerald-200",
    tile: "border-emerald-200 bg-emerald-50/60 hover:border-emerald-400 hover:bg-emerald-50",
    iconWrap: "bg-white ring-1 ring-emerald-200 group-hover:bg-emerald-600 group-hover:ring-emerald-600",
    icon: "text-emerald-600 group-hover:text-white",
    title: "group-hover:text-emerald-700",
    cta: "text-emerald-600",
    ring: "focus-visible:ring-emerald-400",
  },
  slate: {
    dot: "bg-slate-500",
    label: "text-slate-700",
    rule: "from-slate-200",
    tile: "border-slate-200 bg-slate-100/70 hover:border-slate-400 hover:bg-slate-100",
    iconWrap: "bg-white ring-1 ring-slate-200 group-hover:bg-slate-700 group-hover:ring-slate-700",
    icon: "text-slate-600 group-hover:text-white",
    title: "group-hover:text-slate-900",
    cta: "text-slate-600",
    ring: "focus-visible:ring-slate-400",
  },
};

interface ModuleItem {
  name: string;
  desc: string;
  href: string;
  icon: LucideIcon;
}

interface ModuleGroup {
  id: string;
  label: string;
  desc: string;
  tone: Tone;
  modules: ModuleItem[];
}

const GROUPS: ModuleGroup[] = [
  {
    id: "dieu-hanh",
    label: "Điều Hành & Kinh Doanh",
    desc: "Hoạch định, đơn hàng, đối tác và dòng tiền",
    tone: "indigo",
    modules: [
      { name: "Ban Giám Đốc", desc: "Báo cáo tổng quan & Phê duyệt", href: "/giam-doc", icon: BarChart3 },
      { name: "Merchandiser & Thu Mua", desc: "Quản lý đơn hàng, tiến độ & mua NPL", href: "/md", icon: Briefcase },
      { name: "Khách Hàng", desc: "Hồ sơ đối tác & Đơn đặt hàng", href: "/buyer", icon: Building2 },
      { name: "Kế Toán", desc: "Công nợ & Thanh toán", href: "/ke-toan", icon: Calculator },
    ],
  },
  {
    id: "kho-van",
    label: "Kho Vận",
    desc: "Tồn kho nguyên phụ liệu và thành phẩm",
    tone: "amber",
    modules: [
      { name: "Kho Vật Tư", desc: "Xuất/Nhập & Tồn kho NPL", href: "/kho", icon: Package },
      { name: "Kho Thành Phẩm", desc: "Nhập kho FG & Đóng container", href: "/xuat-hang", icon: Archive },
    ],
  },
  {
    id: "chat-luong",
    label: "Chất Lượng",
    desc: "Kiểm soát chất lượng toàn tuyến",
    tone: "rose",
    modules: [
      { name: "QA / QC", desc: "Kiểm soát chất lượng & AQL", href: "/qa", icon: ShieldCheck },
    ],
  },
  {
    id: "san-xuat",
    label: "Sản Xuất",
    desc: "Chuyền cắt, may, hoàn thành và gia công ngoài",
    tone: "emerald",
    modules: [
      { name: "Tổ Trưởng Cắt", desc: "Sản lượng cắt & BTP", href: "/to-truong-cat", icon: Scissors },
      { name: "Tổ Trưởng May", desc: "Sản lượng chuyền may", href: "/to-truong-may", icon: Shirt },
      { name: "Tổ Hoàn Thành", desc: "Ủi, Đóng gói & Xuất hàng", href: "/hoan-thanh", icon: Box },
      { name: "Trạm Subcon", desc: "Cổng báo cáo Xưởng gia công", href: "/subcon", icon: Users },
    ],
  },
  {
    id: "he-thong",
    label: "Hệ Thống",
    desc: "Cấu hình và phân quyền toàn hệ thống",
    tone: "slate",
    modules: [
      { name: "Quản Trị Hệ Thống", desc: "Cài đặt & Phân quyền", href: "/admin", icon: Settings },
    ],
  },
];

// ── Tile một phân hệ ────────────────────────────────────────────────────────
function ModuleTile({ mod, tone }: { mod: ModuleItem; tone: Tone }) {
  const t = TONE[tone];
  const Icon = mod.icon;

  return (
    <Link
      href={mod.href}
      className={`group flex h-full flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${t.tile} ${t.ring}`}
    >
      <div>
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-colors duration-300 ${t.iconWrap}`}
        >
          <Icon className={`h-6 w-6 transition-colors duration-300 ${t.icon}`} aria-hidden="true" />
        </div>
        <h3 className={`mb-1.5 text-base font-bold leading-snug tracking-tight text-slate-900 transition-colors ${t.title}`}>
          {mod.name}
        </h3>
        <p className="mb-5 text-sm leading-relaxed text-slate-600">{mod.desc}</p>
      </div>

      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${t.cta}`}>
        Truy cập
        <ArrowRight
          className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

// ── Tiêu đề một nhóm nghiệp vụ ──────────────────────────────────────────────
function GroupHeading({ group }: { group: ModuleGroup }) {
  const t = TONE[group.tone];
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.dot}`} aria-hidden="true" />
      <div className="shrink-0">
        <h2 className={`text-sm font-bold uppercase tracking-wider ${t.label}`}>{group.label}</h2>
        <p className="text-xs text-slate-500">{group.desc}</p>
      </div>
      <span className={`h-px flex-1 bg-gradient-to-r to-transparent ${t.rule}`} aria-hidden="true" />
    </div>
  );
}

export default function HomePage() {
  const totalModules = GROUPS.reduce((sum, g) => sum + g.modules.length, 0);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      {/* ================= HEADER: LOGO & LỜI CHÀO ================= */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pb-12 pt-14 text-center sm:px-6">
          <div className="relative mb-7 h-24 w-72">
            <Image
              src="/monica-logo.jpg"
              alt="Monica Garment — Hệ thống quản trị sản xuất"
              fill
              sizes="288px"
              className="object-contain"
              priority
            />
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Hệ Thống Quản Trị Sản Xuất May Mặc
          </p>
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Kính chào Quý Anh/Chị đến với{" "}
            <span className="text-indigo-600">MONICA&nbsp;ERP</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Toàn bộ hoạt động sản xuất — từ tiếp nhận đơn hàng, kho nguyên phụ liệu, các chuyền
            cắt&nbsp;–&nbsp;may&nbsp;–&nbsp;hoàn thành cho đến xuất container — được vận hành trên một nền tảng dữ liệu
            hợp nhất. Xin mời Quý Anh/Chị chọn phân hệ phụ trách để bắt đầu.
          </p>

          <p className="mt-6 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-500">
            {totalModules} phân hệ · {GROUPS.length} nhóm nghiệp vụ
          </p>
        </div>
      </header>

      {/* ================= MAIN: LƯỚI PHÂN HỆ THEO NHÓM ================= */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6">
        <div className="space-y-11">
          {GROUPS.map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <div id={`group-${group.id}`}>
                <GroupHeading group={group} />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.modules.map((mod) => (
                  <ModuleTile key={mod.href} mod={mod} tone={group.tone} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-1.5 px-4 py-7 text-center sm:flex-row sm:justify-center sm:gap-3 sm:px-6">
          <p className="text-sm font-medium text-slate-600">
            Bản quyền © Joseph
          </p>
          <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
            |
          </span>
          <p className="text-sm font-medium text-slate-600">
            Hotline:{" "}
            <a
              href="tel:0908779585"
              className="font-bold text-indigo-600 underline-offset-4 transition-colors hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
              0908779585
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
