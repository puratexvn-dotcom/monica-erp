import Image from 'next/image';
import { Bell } from 'lucide-react';

import { LOGO_SRC, LOGO_ALT } from '@/lib/brand';
import DailyVerses from '@/components/daily-verses';

// ============================================================================
// HEADER TRANG CHỦ — Logo · Lời Chúa · Chuông thông báo
//
// Bố cục 3 khu: logo bên trái, Lời Chúa CHÍNH GIỮA và chiếm phần lớn chiều
// ngang (khối nổi bật nhất trang theo yêu cầu), chuông bên phải.
//
// ─── VÌ SAO KHÔNG DÙNG grid-cols-3 ───────────────────────────────────────
// grid 3 cột đều nhau sẽ cắt Lời Chúa còn 1/3 chiều ngang, câu dài bị ép xuống
// 5–6 dòng. Ở đây logo và chuông để chiều rộng tự nhiên (shrink-0), phần giữa
// flex-1 nên Lời Chúa ăn hết chỗ còn lại.
//
// Trên mobile xếp dọc: logo + chuông một hàng, Lời Chúa xuống dưới nguyên khổ.
// Nhồi cả ba vào một hàng ngang trên màn 360px thì Lời Chúa còn ~180px, không
// đọc nổi.
// ============================================================================

export default function HomeHeader({ showVerses }: { showVerses: boolean }) {
  return (
    <header className="mb-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
        {/* ── Hàng logo + chuông (mobile) / hai đầu (desktop) ─────────── */}
        <div className="flex items-center justify-between gap-4 lg:contents">
          <div className="relative h-14 w-44 shrink-0 lg:order-1 lg:h-20 lg:w-56">
            <Image
              src={LOGO_SRC}
              alt={LOGO_ALT}
              fill
              sizes="224px"
              className="object-contain object-left"
              priority
            />
          </div>

          <button
            type="button"
            aria-label="Thông báo (3 chưa đọc)"
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 lg:order-3 lg:h-14 lg:w-14"
          >
            <Bell className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
              3
            </span>
          </button>
        </div>

        {/* ── Lời Chúa: khối nổi bật nhất, chiếm hết phần giữa ───────── */}
        {showVerses && (
          <div className="min-w-0 flex-1 lg:order-2">
            <DailyVerses />
          </div>
        )}
      </div>
    </header>
  );
}
