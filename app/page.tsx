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
// ─── BUSINESS OPERATING SYSTEM LAUNCHER (Điều 13.3 · ADR-001) ────────────
// Trang chủ là LỐI VÀO HỢP NHẤT của hệ điều hành nghiệp vụ, không phải cơ chế
// phân loại. Nó dựng cả ba loại hiến định thành thẻ: Business Workspace (§16.2)
// · Global Service (§29 · §30 · §31 · §33) · Platform Service (§34).
//
// Việc một dịch vụ xuất hiện ở đây KHÔNG đổi phân loại hiến định của nó — §17.3
// và §34.1 nay nói rõ điều đó. Xem app/home-modules.ts và
// docs/architecture/adr/ADR-001-homepage-conceptual-model.md.
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

      {/* Ô icon là mỏ neo thị giác — người vận hành nhận ra phân hệ bằng MÀU và
          HÌNH trước khi kịp đọc chữ. Vì vậy nó to hơn hẳn phần chữ. */}
      <span
        className={`mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 sm:mb-4 sm:h-16 sm:w-16 ${mod.tile}`}
      >
        <Icon className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h2 className="text-sm font-bold leading-snug tracking-tight text-slate-900 sm:text-base">
        {mod.name}
      </h2>
      <p className="mt-1 text-xs font-medium leading-snug text-slate-500">
        {mod.desc}
      </p>
    </>
  );

  // rounded-3xl + ring-inset: bo tròn mềm, viền vẽ vào PHÍA TRONG nên thẻ không
  // đổi kích thước giữa hai trạng thái — hàng thẻ không nhích khi rê chuột.
  //
  // ⚠️ Chiều cao tối thiểu 9,5rem (152px) ở màn hẹp: người vận hành xưởng bấm
  // bằng ngón tay, nhiều khi đeo găng. 44px là ngưỡng tối thiểu của WCAG; một
  // thẻ điều hướng chính đáng được rộng hơn nhiều lần ngưỡng đó.
  const base =
    'group relative flex min-h-[9.5rem] flex-col rounded-3xl bg-white p-5 text-left ring-1 ring-inset ring-slate-200/80 sm:min-h-[11.5rem] sm:p-6';

  if (!mod.href) {
    // Chưa có route ⇒ không bọc <Link>: bấm vào sẽ là 404. Vẫn giữ nguyên màu
    // và bố cục, chỉ bỏ hiệu ứng nhấc lên để không hứa một hành vi không có.
    return (
      <div className={`${base} shadow-sm`} title={`${mod.name} — đang phát triển`}>
        {inner}
      </div>
    );
  }

  // Vòng focus mang MÀU CỦA CHÍNH PHÂN HỆ, không phải một màu chung: người đi
  // bằng bàn phím cũng nhận diện được mình đang ở đâu, y như người dùng chuột.
  return (
    <Link
      href={mod.href}
      className={`${base} shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98] ${mod.ring} ${mod.focus}`}
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
        <section aria-label="Business Operating System Launcher">
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
