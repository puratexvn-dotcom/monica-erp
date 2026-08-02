import { Sparkles } from 'lucide-react';

import type { ModuleItem } from '../home-modules';
import { moduleStatus } from './module-status';
import { GLASS } from './surface';
import type { HomeMetrics } from '../home-metrics';

// ============================================================================
// AI ASSISTANT — DẢI RIÊNG, KHÔNG PHẢI MỘT THẺ NỮA TRONG HÀNG
//
// §31 xếp AI Assistant là Global Service, và phân loại đó KHÔNG đổi. Nhưng
// trong ba dịch vụ còn lại, đây là thứ duy nhất **hiểu ngữ cảnh việc đang
// làm** thay vì chờ được gọi. Xếp nó ngang hàng Documents là nói sai về bản
// chất của nó.
//
// ─── BỐN THỨ CHỈ MỤC NÀY CÓ ─────────────────────────────────────────────
//   ① Chiếm trọn bề ngang, đứng trên ba dịch vụ kia
//   ② Nền chuyển sắc (mục DUY NHẤT trong 16 mục được phép — §17.2 · ADR-001)
//   ③ Quầng sáng toả sau ô icon
//   ④ Chấm bi rất mờ ở nền, gợi "một thứ đang tính toán"
//
// ⚠️ Sang trọng KHÔNG có nghĩa là ồn ào. Chuyển sắc dừng ở sắc độ 50–100, chấm
// bi ở 40% mờ. Nếu dải này hút mắt mạnh hơn Business Workspaces thì trang chủ
// nói sai thứ tự ưu tiên — Workspace mới là nơi công việc diễn ra.
//
// ⚠️ Chưa có route ⇒ KHÔNG bọc <Link>. Nói thật là đang phát triển. Lối vào
// đang chạy của nó là nút "A.I" ở thanh điều hướng dưới.
// ============================================================================

export default function AiHeroCard({
  mod,
  metrics,
}: {
  mod: ModuleItem;
  metrics: HomeMetrics;
}) {
  const st = moduleStatus(mod, metrics);

  return (
    <div
      title={mod.href ? undefined : `${mod.name} — đang phát triển`}
      className="group relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-violet-50 via-white to-sky-50 p-5 shadow-[0_0_0_1px_rgba(16,24,40,0.04),0_1px_2px_-1px_rgba(16,24,40,0.05),0_8px_20px_-12px_rgba(109,40,217,0.18)] sm:p-6"
    >
      {/* Hai quầng sáng rất mờ — chiều sâu không dùng tới một pixel ảnh nào.
          `blur-3xl` biến hai hình tròn thành sương màu; ở 40% mờ chúng chỉ
          làm nền ấm lên chứ không đọc ra là hai đốm. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-violet-200/40 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-8 h-52 w-52 rounded-full bg-sky-200/40 blur-3xl"
      />

      <div className="relative flex items-center gap-4 sm:gap-5">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.125rem] bg-gradient-to-br from-violet-100 to-sky-100 text-violet-600 transition-transform duration-300 group-hover:scale-[1.03] sm:h-[4.5rem] sm:w-[4.5rem] ${GLASS}`}
        >
          <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.6} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-slate-900 sm:text-[20px]">
              {mod.name}
            </h3>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-violet-600 ring-1 ring-inset ring-violet-200/70">
              {st.label}
            </span>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500 sm:text-[14px]">
            {mod.desc} — hiểu đơn hàng, công đoạn và bằng chứng bạn đang mở.
          </p>
        </div>

        {/* Câu vận hành tách hẳn sang phải trên màn rộng: nó là siêu dữ liệu,
            không phải phần của lời giới thiệu. */}
        <p className="hidden shrink-0 text-[12px] font-medium text-slate-500 lg:block">
          {st.line}
        </p>
      </div>
    </div>
  );
}
