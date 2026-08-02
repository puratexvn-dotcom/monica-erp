import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import type { ModuleItem } from '../home-modules';
import { moduleStatus, TONE_DOT, TONE_TEXT } from './module-status';
import { ELEV_REST, ELEV_HOVER, GLASS, GLASS_GLOW } from './surface';
import type { HomeMetrics } from '../home-metrics';

// ============================================================================
// THẺ BUSINESS WORKSPACE — ba mức nhấn, một ngữ pháp
//
// ─── VÌ SAO BA MỨC CHỨ KHÔNG PHẢI MỘT ────────────────────────────────────
//   hero      2 cột × 2 hàng   icon 88px   tên 24px   dọc, rộng rãi
//   wide      2 cột × 1 hàng   icon 72px   tên 19px   NGANG (icon trái)
//   standard  1 cột × 1 hàng   icon 64px   tên 16px   dọc
//
// `wide` xoay ngang là quyết định có lý do: một thẻ rộng gấp đôi mà vẫn xếp
// dọc sẽ để lại một mảng trống bên phải, và mảng trống KHÔNG CHỦ Ý đọc ra là
// lỗi bố cục. Xoay ngang thì bề rộng thừa biến thành chỗ cho câu vận hành thở.
//
// ─── THANG BẬC CHỮ: BỐN CẤP, KHÁC NHAU Ở BỐN THUỘC TÍNH ──────────────────
//   Tên        16–24px · 600 · tracking-tight  · slate-900
//   Mô tả      13–15px · 400 · leading-relaxed · slate-500
//   Trạng thái 10px    · 700 · uppercase 0.09em · theo tông
//   Câu vận hành 12–14px · 500 · tabular-nums  · slate-600 / slate-400
//
// Đổi mỗi cỡ chữ thì mắt vẫn phải ĐỌC mới phân biệt được — mà đọc chính là thứ
// ta đang cố tránh. Bốn cấp này khác nhau ở cỡ, độ đậm, giãn chữ VÀ màu.
//
// `tabular-nums`: chữ số đều bề ngang nên các thẻ cạnh nhau thẳng hàng. Thiếu
// nó thì "111" hẹp hơn "999" và cả lưới trông xộc xệch.
//
// ─── MŨI TÊN CHỈ HƯỚNG ───────────────────────────────────────────────────
// `ArrowUpRight` mờ ở trạng thái nghỉ, rõ dần và nhích lên khi rê chuột. Nó
// nói "bấm vào đây sẽ ĐI ĐÂU ĐÓ" — phân biệt thẻ điều hướng với thẻ chỉ hiển
// thị. Thẻ Beta KHÔNG có mũi tên: không hứa một hành vi không tồn tại.
// ============================================================================

const SPAN: Record<string, string> = {
  hero: 'col-span-2 lg:col-span-2 lg:row-span-2',
  wide: 'col-span-2 lg:col-span-2',
  standard: 'col-span-1',
};

const PAD: Record<string, string> = {
  hero: 'p-6 sm:p-8',
  wide: 'p-5 sm:p-6',
  standard: 'p-4 sm:p-5',
};

const TILE: Record<string, string> = {
  hero: 'h-[4.5rem] w-[4.5rem] rounded-[1.375rem] sm:h-[5.5rem] sm:w-[5.5rem]',
  wide: 'h-[3.5rem] w-[3.5rem] rounded-[1.125rem] sm:h-[4.5rem] sm:w-[4.5rem]',
  standard: 'h-[3.25rem] w-[3.25rem] rounded-[1rem] sm:h-16 sm:w-16',
};

const GLYPH: Record<string, string> = {
  hero: 'h-8 w-8 sm:h-10 sm:w-10',
  wide: 'h-6 w-6 sm:h-8 sm:w-8',
  standard: 'h-[22px] w-[22px] sm:h-7 sm:w-7',
};

const TITLE: Record<string, string> = {
  hero: 'text-[19px] sm:text-[24px]',
  wide: 'text-[16px] sm:text-[19px]',
  standard: 'text-[14px] sm:text-[16px]',
};

const DESC: Record<string, string> = {
  hero: 'text-[13px] sm:text-[15px]',
  wide: 'text-[12px] sm:text-[13.5px]',
  standard: 'text-[12px] sm:text-[13px]',
};

const MIN_H: Record<string, string> = {
  hero: 'min-h-[15rem]',
  wide: 'min-h-[9.5rem]',
  standard: 'min-h-[12.5rem] sm:min-h-[13.5rem]',
};

export default function WorkspaceCard({
  mod,
  metrics,
}: {
  mod: ModuleItem;
  metrics: HomeMetrics;
}) {
  const Icon = mod.icon;
  const st = moduleStatus(mod, metrics);
  const f = mod.feature ?? 'standard';
  const horizontal = f === 'wide';

  const tile = (
    <span
      className={`flex shrink-0 items-center justify-center transition-[transform,box-shadow] duration-300 ease-out group-hover:scale-[1.03] ${TILE[f]} ${mod.tile} ${GLASS} ${GLASS_GLOW}`}
    >
      <Icon className={GLYPH[f]} strokeWidth={1.6} aria-hidden="true" />
    </span>
  );

  const heading = (
    <>
      <h3
        className={`font-semibold leading-[1.2] tracking-[-0.015em] text-slate-900 ${TITLE[f]}`}
      >
        {mod.name}
      </h3>
      <p className={`mt-1.5 font-normal leading-relaxed text-slate-500 ${DESC[f]}`}>
        {mod.desc}
      </p>
    </>
  );

  // Chân thẻ: chấm trạng thái + nhãn, rồi câu vận hành. Luôn nằm ở đáy nhờ
  // mt-auto, nên mọi thẻ trong một hàng có chân thẳng đúng một đường ngang dù
  // tên dài ngắn khác nhau.
  const footer = (
    <div className={horizontal ? 'mt-3' : 'mt-auto pt-6'}>
      <div className="flex items-center gap-1.5">
        <span
          className={`h-[5px] w-[5px] shrink-0 rounded-full ${TONE_DOT[st.tone]}`}
          aria-hidden="true"
        />
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.09em] ${TONE_TEXT[st.tone]}`}
        >
          {st.label}
        </span>
      </div>
      <p
        className={`mt-1.5 truncate font-medium tabular-nums ${
          st.hasData ? 'text-slate-600' : 'text-slate-500'
        } ${f === 'hero' ? 'text-[13.5px]' : 'text-[12px]'}`}
      >
        {st.line}
      </p>
    </div>
  );

  const inner = horizontal ? (
    // ─── wide: icon trái, chữ phải ─────────────────────────────────────
    <div className="flex h-full items-start gap-4 sm:gap-5">
      {tile}
      <div className="flex min-w-0 flex-1 flex-col">
        {heading}
        {footer}
      </div>
      {mod.href && <Arrow />}
    </div>
  ) : (
    // ─── hero · standard: xếp dọc ──────────────────────────────────────
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        {tile}
        {mod.href && <Arrow />}
      </div>
      {heading}
      {footer}
    </>
  );

  const base = `group relative flex flex-col rounded-[1.25rem] bg-white text-left ${SPAN[f]} ${PAD[f]} ${MIN_H[f]}`;

  if (!mod.href) {
    // Chưa có route ⇒ không bọc <Link>: bấm vào sẽ là 404. Giữ nguyên màu và
    // bố cục, chỉ bỏ hiệu ứng nhấc lên — không hứa một hành vi không có.
    return (
      <div className={`${base} ${ELEV_REST}`} title={`${mod.name} — đang phát triển`}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={mod.href}
      // Chỉ chuyển động `transform` và `box-shadow`: hai thuộc tính này trình
      // duyệt chạy trên GPU. Thêm `background-color` hay `width` vào danh sách
      // là buộc nó tính lại bố cục 60 lần mỗi giây.
      className={`${base} ${ELEV_REST} ${ELEV_HOVER} ring-1 ring-inset ring-transparent transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 active:duration-75 ${mod.ring} ${mod.focus}`}
    >
      {inner}
    </Link>
  );
}

/** Mũi tên chỉ hướng — mờ khi nghỉ, rõ và nhích chéo lên khi rê chuột. */
function Arrow() {
  return (
    <ArrowUpRight
      className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-400 group-hover:opacity-100"
      aria-hidden="true"
    />
  );
}
