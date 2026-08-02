import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import type { ModuleItem } from '../home-modules';
import { moduleStatus, TONE_DOT, TONE_TEXT } from './module-status';
import { GLASS } from './surface';
import type { HomeMetrics } from '../home-metrics';

// ============================================================================
// DÒNG PLATFORM SERVICE — HẠ TẦNG: TỐI GIẢN, SẠCH, KỸ THUẬT
//
// §34.1: *"Platform Services are infrastructure capabilities."* Hạ tầng thì
// không tranh chỗ với nghiệp vụ. Nó là một DÒNG chứ không phải một THẺ — cùng
// họ với mục cuối trong danh sách Cài đặt của macOS: luôn có mặt, không bao
// giờ giành sự chú ý.
//
// ─── "KỸ THUẬT" THỂ HIỆN Ở ĐÂU ───────────────────────────────────────────
//   • Không bóng đổ. Chỉ một đường viền tóc — hạ tầng nằm PHẲNG trên mặt
//     phẳng, nó không nổi lên như thẻ nghiệp vụ.
//   • Số liệu đặt trong ô chữ đều bề ngang (`font-mono`), đọc ra là số đo hệ
//     thống chứ không phải một chỉ số kinh doanh.
//   • Bo góc nhỏ hơn hai khối trên (12px so với 20px): góc càng vuông càng đọc
//     ra "công cụ", góc càng tròn càng đọc ra "sản phẩm".
//
// Tối giản KHÔNG phải sơ sài. Vẫn đủ: ô icon kính mờ, trạng thái, số liệu
// thật, mũi tên chỉ hướng, vòng focus riêng, vùng chạm cao 64px.
// ============================================================================

export default function PlatformRow({
  mod,
  metrics,
}: {
  mod: ModuleItem;
  metrics: HomeMetrics;
}) {
  const Icon = mod.icon;
  const st = moduleStatus(mod, metrics);

  const inner = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] ${mod.tile} ${GLASS}`}
      >
        <Icon className="h-[17px] w-[17px]" strokeWidth={1.7} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold tracking-[-0.01em] text-slate-800">
          {mod.name}
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] text-slate-500">{mod.desc}</span>
      </span>

      {/* Số đo hệ thống — chữ đều bề ngang, nền chìm. Đọc ra "thông số", không
          đọc ra "chỉ số kinh doanh". */}
      <span className="hidden shrink-0 rounded-md bg-slate-50 px-2 py-1 font-mono text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200/70 sm:block">
        {st.line}
      </span>

      <span className="flex shrink-0 items-center gap-1.5">
        <span
          className={`h-[5px] w-[5px] rounded-full ${TONE_DOT[st.tone]}`}
          aria-hidden="true"
        />
        <span
          className={`hidden text-[9.5px] font-bold uppercase tracking-[0.1em] sm:block ${TONE_TEXT[st.tone]}`}
        >
          {st.label}
        </span>
      </span>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-400"
        aria-hidden="true"
      />
    </>
  );

  const base =
    'group flex min-h-[4rem] items-center gap-3.5 rounded-xl bg-white px-4 ring-1 ring-inset ring-slate-200/60';

  if (!mod.href) {
    return <div className={base}>{inner}</div>;
  }

  return (
    <Link
      href={mod.href}
      className={`${base} transition-colors duration-200 hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 ${mod.ring} ${mod.focus}`}
    >
      {inner}
    </Link>
  );
}
