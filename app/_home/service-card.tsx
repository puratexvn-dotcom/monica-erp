import Link from 'next/link';

import type { ModuleItem } from '../home-modules';
import { moduleStatus } from './module-status';
import { ELEV_SUNKEN, GLASS } from './surface';
import type { HomeMetrics } from '../home-metrics';

// ============================================================================
// THẺ GLOBAL SERVICE — NĂNG LỰC, KHÔNG PHẢI ĐIỂM ĐẾN
//
// §17.3 nói Global Service không phải Business Workspace. Nếu hai loại trông
// giống nhau thì phân loại hiến định chỉ tồn tại trong tài liệu, không tồn tại
// trên màn hình. Khác ở NĂM chỗ, cả năm đều cố ý:
//
//   ① Bố cục NGANG                     Workspace xếp DỌC
//   ② Nền trắng CHÌM, bóng một lớp     Workspace bóng bốn lớp, nổi
//   ③ KHÔNG nhấc lên khi rê chuột      Workspace nhấc 3px
//   ④ Ô icon 44px                      Workspace 64–88px
//   ⑤ Không có mũi tên chỉ hướng       Workspace có
//
// Đọc ra "một năng lực mình GỌI TỚI", không đọc ra "một nơi mình ĐI TỚI". Đó
// đúng là quan hệ hiến định: Workspace **tiêu thụ** Global Service.
//
// ⚠️ Chìm KHÔNG có nghĩa là chết. Rê chuột thì nền sáng lên và viền đậm lại —
// vẫn rõ là chạm được, chỉ là chạm vào một thứ khác loại.
// ============================================================================

export default function ServiceCard({
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
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.875rem] ${mod.tile} ${GLASS}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold tracking-[-0.01em] text-slate-800">
          {mod.name}
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] font-normal leading-relaxed text-slate-500">
          {mod.desc}
        </span>
      </span>

      {/* Nhãn trạng thái ở khối này là chữ chìm, KHÔNG phải chấm màu như
          Workspace: một dịch vụ dùng chung không có "sức khoẻ vận hành" theo
          nghĩa một phân hệ sản xuất có. Nói quá lên là nói sai. */}
      <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
        {st.label}
      </span>
    </>
  );

  const base = `group flex min-h-[4.25rem] items-center gap-3.5 rounded-[1rem] bg-white px-4 py-3 ${ELEV_SUNKEN}`;

  if (!mod.href) {
    return (
      <div className={base} title={`${mod.name} — đang phát triển`}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={mod.href}
      className={`${base} transition-colors duration-200 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 ${mod.ring} ${mod.focus}`}
    >
      {inner}
    </Link>
  );
}
