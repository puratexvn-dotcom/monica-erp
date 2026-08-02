import Link from 'next/link';

import TopNavbar from './top-navbar';
import { MODULES, type ModuleItem } from './home-modules';
import { LOGO_TEXT_GRADIENT, APP_NAME } from '@/lib/brand';

// ============================================================================
// TRANG CHỦ — MONICA ONE · APP LAUNCHER
//
// Bốn tầng, không hơn:
//   Top Header  →  Hero  →  Module Launcher  →  Footer rất nhỏ
//
// ─── VÌ SAO GỠ SẠCH KPI, TIẾN ĐỘ, ĐƠN TỚI HẠN, THAO TÁC NHANH ────────────
// Bản trước nhồi sáu khối số liệu lên trang chủ. Đó là ngôn ngữ của dashboard
// ERP đời cũ: mở hệ thống ra là một bức tường widget, và người dùng phải đọc
// hết mới tìm được lối vào việc của mình.
//
// Notion · Linear · Microsoft 365 · Google Workspace đều làm ngược lại: trang
// đầu chỉ trả lời MỘT câu hỏi — *"tôi muốn vào đâu?"*. Số liệu thuộc về bên
// trong từng phân hệ, nơi nó có ngữ cảnh để mà hiểu.
//
// ⚠️ KHÔNG mất chức năng nào: `app/home-metrics.ts` giữ nguyên không sửa một
// dòng, và các bảng điều hành bên trong `/giam-doc`, `/md` vẫn dùng nó. Ở đây
// chỉ là trang chủ thôi không gọi tới.
//
// ─── KHÔNG CHIA NHÓM ─────────────────────────────────────────────────────
// Không CORE/BUSINESS/COMMERCIAL/... Một lưới phẳng mười sáu ô, đúng kiểu
// App Launcher. Tiêu đề nhóm chỉ có nghĩa với người đã thuộc hệ thống; với
// người mở lần đầu nó là năm chướng ngại phải đọc trước khi thấy thứ cần bấm.
//
// ⚠️ TAILWIND JIT: class màu phải là chuỗi NGUYÊN VẸN, xem app/home-modules.ts.
// ============================================================================

export const dynamic = 'force-dynamic';

function ModuleCard({ mod }: { mod: ModuleItem }) {
  const Icon = mod.icon;

  const inner = (
    <>
      {/* Huy hiệu Beta — nhỏ, góc trên phải, không cạnh tranh với tên phân hệ */}
      {mod.beta && (
        <span className="absolute right-3 top-3 rounded-full bg-slate-900/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:text-[10px]">
          Beta
        </span>
      )}

      <span
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 sm:mb-4 sm:h-14 sm:w-14 ${mod.tile}`}
      >
        <Icon className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h2 className="text-[13px] font-bold leading-snug tracking-tight text-slate-900 sm:text-[15px]">
        {mod.name}
      </h2>
      <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">
        {mod.desc}
      </p>
    </>
  );

  // rounded-3xl + ring-inset: bo tròn mềm, viền vẽ vào PHÍA TRONG nên thẻ không
  // đổi kích thước giữa hai trạng thái — hàng thẻ không nhích khi rê chuột.
  const base =
    'group relative flex min-h-[8.5rem] flex-col rounded-3xl bg-white p-4 text-left ring-1 ring-inset ring-slate-200/80 sm:min-h-[10.5rem] sm:p-5';

  if (!mod.href) {
    // Chưa có route ⇒ không bọc <Link>: bấm vào sẽ là 404. Vẫn giữ nguyên màu
    // và bố cục, chỉ bỏ hiệu ứng nhấc lên để không hứa một hành vi không có.
    return (
      <div className={`${base} shadow-sm`} title={`${mod.name} — đang phát triển`}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={mod.href}
      className={`${base} shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 active:translate-y-0 active:scale-[0.98] ${mod.ring}`}
    >
      {inner}
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavbar />

      <main className="mx-auto max-w-[1400px] px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        {/* ═══ HERO — hai dòng, không hơn ═══════════════════════════════════ */}
        <section className="mb-8 text-center sm:mb-12">
          <h1 className="flex flex-wrap items-baseline justify-center gap-x-2 whitespace-nowrap tracking-tight sm:gap-x-3">
            <span className="text-sm font-semibold text-slate-400 sm:text-lg">
              Welcome to
            </span>
            <span
              className="bg-clip-text text-3xl font-black leading-[1.05] tracking-tighter text-transparent sm:text-5xl lg:text-6xl"
              style={{ backgroundImage: LOGO_TEXT_GRADIENT }}
            >
              MONICA ONE
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
            Nền tảng quản trị toàn bộ chuỗi sản xuất may mặc trên một hệ thống duy nhất.
          </p>
        </section>

        {/* ═══ MODULE LAUNCHER — lưới phẳng, không nhóm, không tiêu đề ══════
            Mobile 2 · Tablet 3 · Desktop 4. Khoảng cách đều ở mọi mốc. */}
        <section aria-label="Phân hệ hệ thống">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {MODULES.map((mod) => (
              <ModuleCard key={mod.name} mod={mod} />
            ))}
          </div>
        </section>
      </main>

      <footer className="pb-8 text-center">
        <p className="text-[11px] font-medium text-slate-400">© 2026 {APP_NAME}</p>
      </footer>
    </div>
  );
}
