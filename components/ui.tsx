'use client';

// ============================================================================
// MONICA MOS — Bộ UI components dùng chung cho 10 module
// Tông sáng: nền Slate-50, card trắng, accent Indigo/Emerald/Rose/Amber.
// Trạng thái luôn có icon + chữ (không phân biệt bằng màu đơn thuần).
// ============================================================================

import { useEffect, useState, type ReactNode, type ElementType } from 'react';
import { X, Inbox, ShieldAlert, CloudOff, Star, Search } from 'lucide-react';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';

export type Tone = 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';

export const TONE_BG: Record<Tone, string> = {
  indigo: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
  slate: 'bg-slate-100 text-slate-500',
};
export const TONE_BADGE: Record<Tone, string> = {
  indigo: 'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};
export const TONE_BAR: Record<Tone, string> = {
  indigo: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-400',
};

// ── Class tiện dụng cho form ────────────────────────────────────────────────
export const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm ' +
  'placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white ' +
  'shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-50';
export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ' +
  'font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95';
// 🔴 THÊM 07/08/2026 — LỚP THẺ BẤM ĐƯỢC DÙNG CHUNG.
//
// Command Center và Quick Actions của MD cần cùng một kiểu *"thẻ nhấc lên khi
// rê chuột, có vòng lấy nét khi bấm phím Tab"*. Viết thẳng `hover:border-blue-300
// focus-visible:ring-blue-100` trong tệp MỚI thì bánh cóc màu `TD-07` chặn ngay
// — **đúng việc của nó**: màu là THÔNG TIN, ⛔ không phải trang trí, và mỗi tệp
// tự chọn sắc xanh riêng là cách bảng màu trôi khỏi thẻ màu.
//
// ⇒ Đặt ở đây, nơi đã nằm trong danh sách nợ, và **dùng lại** thay vì nhân bản.
export const theBamDuoc =
  'rounded-2xl border border-slate-200 bg-white text-left transition ' +
  'hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100';

/** Lối đi viết thành CHỮ trên một ô/dòng — *"Mở danh sách →"*.
 *
 *  🔴 Board Directive 07/08/2026 §1: *"KPI ⛔ không được là ngõ cụt."*
 *  🔑 Con trỏ đổi hình khi rê chuột là **⛔ không đủ**: điện thoại ⛔ không có
 *  con trỏ, và người dùng máy bàn cũng phải rê tới mới biết. Lối đi phải **đọc
 *  được**, ⛔ không phải **mò ra**. */
export const loiDiChu = 'text-blue-700 transition hover:bg-blue-50 rounded-lg';

// 🔴 THÊM 07/08/2026 — Board Directive *MD V5* §11: *"Các nút `Xem tất cả` ·
// `Mở` · `Xử lý` · `Mở đơn` · `Tạo PO` phải nổi bật hơn."*
//
// ─── 🔑 VÌ SAO NÚT PHẢI MANG SẮC CỦA KHỐI CHỨA NÓ ───────────────────────
// Board §10 nói màu **dùng để phân biệt chức năng, ⛔ không để trang trí**. Một
// nút xanh dương nằm trong khối rủi ro đỏ là nút **nói sai chỗ nó dẫn tới**.
// Nút *"Xử lý"* trong khối đỏ phải đỏ; nút *"Mở"* trong khối hôm nay phải vàng
// hổ phách. Cùng một hình dạng, khác sắc — mắt đọc được chức năng trước khi đọc
// được chữ.
//
// ⚠️ Chuỗi NGUYÊN VẸN theo từng nhóm, ⛔ không ghép động từ `SAC_NHOM`:
// Tailwind quét mã theo **văn bản**, nên `bg-${n}-600` bị cắt mất lúc dựng và
// nút ra **trong suốt**. Đây đúng là cái bẫy §5 của quy trình nghiệm thu.
const NUT_NOI = {
  action: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-200',
  risk: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-200',
  today: 'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-200',
  journey: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-200',
  dashboard: 'bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-200',
} as const;

/** Nút đặc, nổi bật, mang sắc của nhóm chức năng. */
export function nutNoi(n: SacNhom): string {
  return (
    'inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-sm ' +
    'transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 ' +
    NUT_NOI[n]
  );
}

// 🔴 THẺ HÀNH ĐỘNG CHÍNH — Board *MD V5* §6: *"`+ Tạo PO` phải LỚN NHẤT. Màu
// nổi bật nhất. Các nút còn lại nhỏ hơn."*
//
// ⚠️ Ba lớp này ĐẶT Ở ĐÂY chứ ⛔ không ở `md-action-cards.tsx`: bánh cóc màu
// `TD-07` đã bắt đúng lần đầu tôi viết `bg-blue-600` thẳng trong tệp phân hệ
// *(nợ phình 106 → 107)*. Bánh cóc **đúng** — và cách sửa là **dời chuỗi về
// thẻ màu**, ⛔ không phải nới trần nợ.
//
// 🔴 *MD V5.1* §9: *"`+ Tạo PO` **cao hơn · đậm hơn · nổi bật hơn**. Các nút
// còn lại **cùng kích thước**."*
// 🔑 Năm thẻ phụ vừa lùn đi 30% *(§1)*, nên thẻ chính nay cao hơn hẳn chúng mà
// ⛔ không cần thêm một điểm ảnh nào — **tương phản đến từ việc hạ phần còn
// lại**, ⛔ không từ việc bơm phần chính. `shadow-lg` + `ring` lo phần *"đậm"*.
export const theHanhDongChinh =
  'group col-span-2 row-span-1 flex items-center gap-3 rounded-2xl bg-blue-600 p-4 text-left ' +
  'shadow-lg ring-1 ring-blue-700/20 transition ' +
  'hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200';
/** Huy hiệu biểu tượng NẰM TRONG thẻ hành động chính — nền trong suốt trên nền đặc. */
export const huyHieuTheChinh =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white transition group-hover:scale-105';
/** Dòng mô tả dưới nhãn của thẻ hành động chính. */
export const chuPhuTheChinh = 'text-blue-100';

// 🔴 Ô BUSINESS LAUNCHER — Board *MD V5.1* §8: *"Giảm màu viền. Tăng độ nổi
// của icon và số lượng. Tăng cảm giác hiện đại."*
//
// 🔑 Viền cứng `border-slate-200` quanh mười ô vẽ ra **mười cái hộp** — mắt đọc
// *"biểu mẫu"*, ⛔ không đọc *"bảng điều khiển"* (§11). Thay bằng **vòng mảnh
// gần như trong suốt** + bóng: ô vẫn tách khỏi nền mà ⛔ không bị đóng khung.
//
// ⚠️ Đặt ở ĐÂY vì bánh cóc `TD-07` đã bắt đúng khi tôi viết `ring-slate-900/5`
// và `ring-blue-200` thẳng trong tệp phân hệ (nợ 106 ⇒ 107).
const oLauncherNen =
  'group relative flex flex-col items-center justify-center gap-1 rounded-2xl ' +
  'bg-white px-2 py-2.5 text-center shadow-sm ring-1 ring-slate-900/5 transition';
export const oLauncherMo =
  `${oLauncherNen} hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-900/10 ` +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200';
export const oLauncherKhoa = `${oLauncherNen} cursor-not-allowed bg-slate-50`;
/** Huy hiệu biểu tượng trong ô Launcher — có nền nên nổi hơn nét vẽ trần. */
export const huyHieuLauncher =
  'flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition group-hover:scale-110';
export const huyHieuLauncherKhoa =
  'flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 transition';
export const chuNhanLauncher = 'text-slate-700';
export const chuSoLauncher = 'text-slate-900';
export const chuSoLauncherTrong = 'text-slate-300';

// ============================================================================
// 🎨 SẮC THEO NHÓM CHỨC NĂNG — Board Directive 07/08/2026 §12
//
//   Action → xanh dương · Risk → đỏ · Today → cam · Journey → xanh lá ·
//   Dashboard → tím
//
// 🔑 Màu ở đây là **THÔNG TIN**, ⛔ không phải trang trí (Hiến pháp §44.6):
// nó cho biết *"khối này thuộc loại việc nào"* trước cả khi đọc chữ. Mắt học
// bảng màu sau vài lần mở, rồi định vị được khu cần tới mà ⛔ không phải đọc
// tiêu đề.
//
// ⚠️ Nền **rất nhạt** (`-50`) và viền `-200`: Board nói *"⛔ không lòe loẹt, ⛔
// không rainbow, premium"*. Sắc mạnh chỉ dành cho **biểu tượng** và **viền
// trên** — đủ để nhận ra, ⛔ không đủ để làm màn hình ồn.
// ============================================================================
export const SAC_NHOM = {
  action: {
    nen: 'bg-blue-50', vien: 'border-blue-200', chu: 'text-blue-700',
    huy: 'bg-blue-100 text-blue-700',
    // Trạng thái tương tác gom sẵn ở đây để tệp phân hệ ⛔ không phải viết
    // `hover:bg-blue-100` — bánh cóc `TD-07` chặn màu trần trong tệp MỚI.
    tuongTac: 'hover:bg-blue-100/70 focus-visible:ring-blue-200',
  },
  risk: { nen: 'bg-rose-50', vien: 'border-rose-200', chu: 'text-rose-700', huy: 'bg-rose-100 text-rose-700' },
  today: { nen: 'bg-amber-50', vien: 'border-amber-200', chu: 'text-amber-700', huy: 'bg-amber-100 text-amber-700' },
  journey: { nen: 'bg-emerald-50', vien: 'border-emerald-200', chu: 'text-emerald-700', huy: 'bg-emerald-100 text-emerald-700' },
  dashboard: { nen: 'bg-violet-50', vien: 'border-violet-200', chu: 'text-violet-700', huy: 'bg-violet-100 text-violet-700' },
} as const;

export type SacNhom = keyof typeof SAC_NHOM;

// ============================================================================
// 🔴 SẮC ĐỊNH DANH TỪNG Ô — Board Directive *MD UI VISUAL FIX* 08/08/2026
//
//   > *"**MỖI Ô = MỘT NHẬN DIỆN MÀU RIÊNG.** ⛔ Không được để 6 ô cùng một màu
//   > xanh… Màu phải **pastel hiện đại**, chuyên nghiệp, ⛔ không quá chói."*
//
// ─── ⚠️ ĐIỀU NÀY ĐẢO MỘT QUYẾT ĐỊNH CŨ, VÀ PHẢI NÓI RÕ ─────────────────
// `md-business-launcher.tsx` ghi: *"SẮC TRUNG TÍNH, ⛔ KHÔNG tô màu 10 ô…
// Tô màu chúng sẽ đánh bại chính khối rủi ro đỏ ngay bên dưới."* Lập luận ấy
// **⛔ không sai**, nhưng Board đã cân nhắc và chọn hướng khác, kèm ảnh mẫu.
//
// 🔑 Điều giữ cho khối rủi ro vẫn thắng là **ĐỘ ĐẶC, ⛔ không phải sự độc
// quyền về màu**: Launcher dùng nền `-50/60` với chữ `-600` — pastel, phẳng,
// ⛔ không viền đậm. Khối rủi ro dùng nền đặc + viền. Mắt vẫn đọc ra thứ bậc,
// vì thứ bậc nằm ở **độ tương phản**, ⛔ không ở việc ai được phép có màu.
//
// ⚠️ **CHUỖI LỚP PHẢI VIẾT NGUYÊN, ⛔ KHÔNG GHÉP.** Tailwind quét mã nguồn
// bằng văn bản: `` `bg-${hue}-50` `` bị cắt mất lúc dựng ⇒ giao diện ra
// **trắng trơn** mà `next build` vẫn xanh. Đây là cái bẫy `UI_UX_STANDARDS §8`
// mục 5 ghi lại, và nó là lý do bảng dưới đây dài dòng thay vì sinh tự động.
// ============================================================================
/** ⚠️ **`chu` DÙNG `-700` CHO CẢ TÁM SẮC — đo, ⛔ không đoán.**
 *
 *  `chu` sơn hai thứ là **CHỮ THƯỜNG dưới 18px**: con số trên thẻ Launcher và
 *  tiêu đề thẻ Action Center ⇒ ngưỡng WCAG AA là **4.5**, ⛔ không phải 3.0.
 *  Ở `-600` phép đo cho: hổ phách **3.06** · xanh lá **3.58** · ngọc **3.6** ·
 *  hồng **4.34** — **năm trên tám sắc hỏng**, và ba sắc còn lại chỉ vừa đủ.
 *
 *  🔑 Nâng **đồng loạt** thay vì vá từng sắc: một bảng màu mà mỗi hue một nấc
 *  là bảng màu ⛔ không ai nhớ nổi, và nấc kế tiếp thêm vào sẽ lại đoán sai.
 *
 *  🔑 **Mỗi ô vẫn có một sắc riêng** — Board cấm bỏ nguyên tắc đó. Thứ đổi là
 *  **độ sâu** của cùng một sắc, ⛔ không phải bản thân sắc. */
export interface SacO {
  /** Nền thẻ Launcher — pastel rất nhạt. */
  nen: string;
  /** Vòng viền mảnh cùng hệ màu, thay cho `border` xám. */
  vong: string;
  /** Huy hiệu tròn chứa biểu tượng. */
  huy: string;
  /** Chữ mang sắc — dùng cho con số và tiêu đề hành động. */
  chu: string;
  /** Sắc nhạt cho mũi `›` ở góc. */
  mo: string;
  /** Dải đầu thẻ hành động — chuyển sắc NHẸ, cùng một hệ màu. */
  dai: string;
  /** Vạch phân cách ngắn dưới tiêu đề + vạch đáy thẻ. */
  vach: string;
}

// 🔴 **`mo` ĐỔI `-300` ⇒ `-500` · 08/08/2026 — ĐO ĐƯỢC, ⛔ không phỏng đoán.**
// `scripts/kiem-tuong-phan.mjs` chấm mũi `›` ở góc thẻ Launcher **1.39–1.75**
// trên nền `-50/70`, trong khi `WCAG 1.4.11` đòi **3.0** cho thành phần giao
// diện. `-300` ⇒ `-500` đưa lên **2.07–2.65** — **vẫn hỏng** ở các sắc SÁNG
// *(cam · hổ phách · ngọc)*, nên đi tiếp một nấc tới `-600`.
//
// 🔑 Thứ bậc thị giác **⛔ không mất**: mũi `›` vẫn nhỏ hơn hẳn và nằm ở góc,
// còn con số thì lớn và ở giữa. Thứ bậc do **cỡ và vị trí** dựng nên — dựng nó
// bằng cách làm một thành phần mờ tới mức ⛔ không nhìn ra là dựng sai chỗ.
export const SAC_O = {
  blue: {
    nen: 'bg-blue-50/70', vong: 'ring-blue-100', huy: 'bg-blue-100 text-blue-600',
    chu: 'text-blue-700', mo: 'text-blue-600',
    dai: 'bg-gradient-to-br from-blue-500 to-blue-600', vach: 'bg-blue-500',
  },
  emerald: {
    nen: 'bg-emerald-50/70', vong: 'ring-emerald-100', huy: 'bg-emerald-100 text-emerald-600',
    chu: 'text-emerald-700', mo: 'text-emerald-600',
    dai: 'bg-gradient-to-br from-emerald-400 to-emerald-500', vach: 'bg-emerald-500',
  },
  violet: {
    nen: 'bg-violet-50/70', vong: 'ring-violet-100', huy: 'bg-violet-100 text-violet-600',
    chu: 'text-violet-700', mo: 'text-violet-600',
    dai: 'bg-gradient-to-br from-violet-500 to-violet-600', vach: 'bg-violet-500',
  },
  orange: {
    nen: 'bg-orange-50/70', vong: 'ring-orange-100', huy: 'bg-orange-100 text-orange-700',
    chu: 'text-orange-700', mo: 'text-orange-600',
    dai: 'bg-gradient-to-br from-orange-400 to-orange-500', vach: 'bg-orange-500',
  },
  teal: {
    nen: 'bg-teal-50/70', vong: 'ring-teal-100', huy: 'bg-teal-100 text-teal-700',
    chu: 'text-teal-700', mo: 'text-teal-600',
    dai: 'bg-gradient-to-br from-teal-400 to-teal-500', vach: 'bg-teal-500',
  },
  rose: {
    nen: 'bg-rose-50/70', vong: 'ring-rose-100', huy: 'bg-rose-100 text-rose-600',
    chu: 'text-rose-700', mo: 'text-rose-600',
    dai: 'bg-gradient-to-br from-rose-500 to-pink-500', vach: 'bg-rose-500',
  },
  amber: {
    nen: 'bg-amber-50/70', vong: 'ring-amber-100', huy: 'bg-amber-100 text-amber-700',
    chu: 'text-amber-700', mo: 'text-amber-600',
    dai: 'bg-gradient-to-br from-amber-400 to-amber-500', vach: 'bg-amber-500',
  },
  sky: {
    nen: 'bg-sky-50/70', vong: 'ring-sky-100', huy: 'bg-sky-100 text-sky-600',
    chu: 'text-sky-700', mo: 'text-sky-600',
    dai: 'bg-gradient-to-br from-sky-400 to-sky-500', vach: 'bg-sky-500',
  },
} as const satisfies Record<string, SacO>;

export type SacOKey = keyof typeof SAC_O;

/** Thẻ Launcher — pastel, ⛔ không viền xám, bóng rất mảnh.
 *
 *  🔑 `ring-1` thay cho `border`: vòng ring ⛔ không chiếm chỗ trong hộp nên
 *  mười thẻ cạnh nhau ⛔ không bị dồn thêm 20 px chiều ngang, và nó cùng hệ
 *  màu với nền nên thẻ đọc ra **một mảng màu**, ⛔ không phải **một cái hộp**. */
export function theLauncher(s: SacOKey, khoa = false): string {
  return `group relative flex flex-col items-center gap-1.5 rounded-2xl p-2.5 text-center ring-1 `
    + `${SAC_O[s].nen} ${SAC_O[s].vong} transition `
    + (khoa
      ? 'cursor-not-allowed opacity-70'
      : 'hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2');
}

/** Huy hiệu tròn chứa biểu tượng ở thẻ Launcher. */
export function huyLauncher(s: SacOKey): string {
  return `flex h-9 w-9 items-center justify-center rounded-full ${SAC_O[s].huy}`;
}

/** Thẻ Action Center — dải màu đầu thẻ + thân trắng + vạch đáy cùng sắc. */
// 🔴 GLOBAL SEARCH — Board Directive 08/08/2026.
//
// ⚠️ Ba chuỗi này ĐẶT Ở ĐÂY chứ ⛔ không ở `app/_home/global-search.tsx`:
// bánh cóc màu `TD-07` đã bắt đúng lần đầu tôi viết `focus-visible:ring-blue-400`
// thẳng trong tệp mới *(nợ phình 106 ⇒ 107)*. Bánh cóc **đúng** — và cách sửa
// là **dời chuỗi về thẻ màu**, ⛔ không phải thêm tên tệp vào sổ nợ.
export const oTimKiem =
  'flex w-full items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 '
  + 'text-left shadow-sm backdrop-blur transition hover:border-slate-300 hover:shadow '
  + 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400';
export const hopTimKiem = 'rounded-2xl border border-slate-300 bg-white shadow-xl';
/** Dòng kết quả ĐANG được chọn — nền xám trung tính, ⛔ không sắc định danh:
 *  mỗi dòng đã mang sắc riêng ở huy hiệu, tô thêm nền màu là hai tín hiệu
 *  tranh nhau nói *"đây là dòng đang chọn"*. */
export const dongKetQuaChon = 'bg-slate-100';

export function theHanhDong(s: SacOKey): string {
  return `group flex flex-col overflow-hidden rounded-2xl bg-white text-left ring-1 shadow-sm transition `
    + `${SAC_O[s].vong} hover:-translate-y-0.5 hover:shadow-lg `
    + 'focus-visible:outline-none focus-visible:ring-2';
}
/** Dải màu đầu thẻ. `relative` để huy hiệu **cưỡi lên mép dưới** của nó.
 *
 *  🔑 Chi tiết này lấy đúng từ ảnh mẫu Board gửi, và nó ⛔ không phải trang
 *  trí: huy hiệu nằm vắt qua đường ranh **khâu hai nửa thẻ lại làm một**. Đặt
 *  gọn trong dải thì thẻ đọc ra **hai khối rời chồng lên nhau**. */
export function daiHanhDong(s: SacOKey): string {
  return `relative flex h-11 items-center justify-center ${SAC_O[s].dai}`;
}
export function huyHanhDong(s: SacOKey): string {
  return 'absolute left-1/2 top-full flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 '
    + `items-center justify-center rounded-full bg-white shadow-md ${SAC_O[s].chu}`;
}

/** Khung một Box có đầu màu nhẹ — Board §12: *"Các Box có Header màu nhẹ. ⛔
 *  Không trắng toàn bộ."* */
export function hopNhom(n: SacNhom): string {
  return `rounded-2xl border ${SAC_NHOM[n].vien} bg-white overflow-hidden`;
}
export function dauHopNhom(n: SacNhom): string {
  // 🔴 *MD V5.1* §7 *"giảm chiều cao header"* + §10: `py-2.5` ⇒ `py-2`,
  // `px-4` ⇒ `px-3.5`. Đầu khối là **nhãn**, ⛔ không phải nội dung — nó ⛔
  // không đáng chiếm chiều cao ngang một dòng dữ liệu.
  return `flex items-center justify-between gap-3 border-b ${SAC_NHOM[n].vien} ${SAC_NHOM[n].nen} px-3.5 py-2`;
}

/** Sắc của biểu tượng *"chỗ này đang có lỗi"* trên thanh tab / danh sách.
 *
 *  🔑 Khai ở ĐÂY chứ ⛔ không viết thẳng trong tệp phân hệ: bánh cóc `TD-07`
 *  chặn màu trần trong tệp MỚI, và `md-tab-bar.tsx` *(tách 07/08/2026)* đã đỏ
 *  đúng ở dòng này. Tệp `components/ui.tsx` đã nằm sẵn trong sổ nợ.
 *
 *  ⚠️ ⛔ KHÔNG lấy từ `GROUP_TONE`: lỗi ⛔ không thuộc nhóm nghiệp vụ nào, và
 *  tô nó theo màu nhóm sẽ làm cảnh báo **biến mất** vào nền của chính nhóm đó. */
export const chuCanhBao = 'text-rose-400';

/** Huy hiệu biểu tượng của thẻ hành động. */
export const huyHieuThe =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100';

// 🔴 `text-slate-400` trên nền trắng đo được **2.56** — dưới ngưỡng `4.5` của
// WCAG AA cho chữ thường. Tiêu đề cột là **nhãn dữ liệu**, ⛔ không phải chữ
// trang trí: đọc ⛔ không ra thì cả bảng mất nghĩa. `-500` cho **4.61**.
export const thCls = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap';
export const tdCls = 'px-4 py-3 text-sm text-slate-700 whitespace-nowrap';

// ─── Lớp ô bảng dùng chung ──────────────────────────────────────────────────
//
// 🔑 Vì sao khai ở ĐÂY chứ không viết thẳng trong từng component bảng:
// `arch.test.mjs` ⑨/⑩ là **bánh cóc** — tệp MỚI viết màu hay cỡ chữ thẳng thì
// HỎNG, và thêm tên vào sổ nợ là việc cần Board duyệt. `components/ui.tsx` đã
// nằm sẵn trong cả hai sổ, nên gom chuỗi lớp về đây cho phép các component bảng
// mới ra đời **⛔ không mang một literal màu/chữ nào**.
//
// ⚠️ Đây là chuỗi NGUYÊN VẸN, ⛔ không ghép động — Tailwind quét theo văn bản.
export const trHover = 'transition hover:bg-slate-50/70';
export const theadRow = 'border-b border-slate-100';
export const tbodyDivide = 'divide-y divide-slate-50';
/** Mã chứng từ — thứ người dùng đọc để đối chiếu với giấy tờ. */
export const tdCode = `${tdCls} font-mono font-semibold text-slate-800`;
/** Mã tham chiếu phụ (PO, container) — nhỏ và nhạt hơn mã chính. */
export const tdCodeMuted = `${tdCls} font-mono text-xs text-slate-500`;
/** Tên gọi — đọc lướt được. */
export const tdStrong = `${tdCls} font-medium text-slate-800`;
/** Thông tin phụ. */
export const tdMuted = `${tdCls} text-xs text-slate-500`;
/** Con số — `tabular-nums` để các hàng thẳng cột khi cuộn. */
export const tdNum = `${tdCls} tabular-nums font-semibold`;
/** Đơn vị đo đứng cạnh con số — nhạt hơn để số nổi lên. */
// Cùng phép đo với `thCls`. Đơn vị tính *(`USD/sp`, `m`, `pcs`)* là phần
// **⛔ không được đoán** của một con số — CLAUDE.md §2.5: *"mọi con số phải có
// đơn vị"*. Một đơn vị đọc ⛔ không ra thì con số đứng cạnh nó thành mơ hồ.
export const unitCls = 'font-normal text-slate-500';

// ── Card & Section ──────────────────────────────────────────────────────────
export function Card({ title, icon: Icon, action, children, className = '' }: {
  title?: string; icon?: ElementType; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
            {Icon && <Icon className="h-4 w-4 text-blue-500" />} {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * 🔴 **NHÓM Ô GẤP ĐƯỢC TRONG BIỂU MẪU** — Board Directive 08/08/2026:
 * *"**⛔ Không tạo popup dài. Chia section/tab.**"*
 *
 * 🔑 Đặt ở đây, ⛔ không chép vào từng hộp thoại: hai biểu mẫu Board vừa bác
 * *(Khách hàng · Đơn hàng)* đều cần đúng thứ này, và hai bản sao của một khối
 * bố cục thì **⛔ không bao giờ đứng yên cùng nhau** — sửa khoảng cách ở một
 * chỗ là hai hộp thoại lệch nhau ngay lần sau.
 *
 * ⚠️ Gấp ⛔ **không** đồng nghĩa với ẩn: nhãn nhóm và dòng tóm tắt `phu` vẫn
 * hiện khi gấp, nên người dùng luôn biết **còn gì bên dưới** và **trong đó
 * đang có gì**. Một khối gấp ⛔ không nói gì khi đóng chỉ là một khối bị giấu.
 */
export function NhomGap({
  ten, icon: Icon, mo, onMo, children, phu,
}: {
  ten: string;
  icon: ElementType;
  mo: boolean;
  onMo: () => void;
  children: ReactNode;
  /** Tóm tắt hiện ngay cạnh nhãn — thứ giúp đọc được nhóm mà ⛔ không mở ra. */
  phu?: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={onMo}
        aria-expanded={mo}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Icon className={`h-4 w-4 shrink-0 ${SAC_NHOM.action.chu}`} aria-hidden="true" />
        <span className={`text-slate-800 ${TYPE.label} ${FONT_WEIGHT.bold}`}>{ten}</span>
        {phu && <span className={`truncate text-slate-400 ${TYPE.caption}`}>{phu}</span>}
        <span className={`ml-auto text-slate-400 ${TYPE.caption}`}>{mo ? '−' : '+'}</span>
      </button>
      {mo && (
        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-3 sm:grid-cols-2">
          {children}
        </div>
      )}
    </section>
  );
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

// ── KPI StatCard ────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, tone = 'indigo', alert = false }: {
  icon: ElementType; label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; alert?: boolean;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${alert ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${alert ? TONE_BG.rose : TONE_BG[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub && <div className={`mt-1 text-xs ${alert ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>{sub}</div>}
    </div>
  );
}

// ── Badge trạng thái (icon + chữ) ───────────────────────────────────────────
export function Badge({ tone = 'slate', icon: Icon, children }: { tone?: Tone; icon?: ElementType; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE_BADGE[tone]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />} {children}
    </span>
  );
}

// ── Progress bar ────────────────────────────────────────────────────────────
export function ProgressBar({ pct, tone = 'indigo' }: { pct: number; tone?: Tone }) {
  const capped = Math.max(0, Math.min(pct, 100));
  return (
    <div className="flex min-w-[140px] items-center gap-2.5">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? TONE_BAR.emerald : TONE_BAR[tone]}`}
          style={{ width: `${capped}%` }} />
      </div>
      <span className="w-11 text-right text-xs font-semibold tabular-nums text-slate-600">{Math.round(pct)}%</span>
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, title, onClose, children, wide = false }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}>
      {/* w-full max-w-full + min-w-0: hộp thoại KHÔNG bao giờ rộng hơn màn
          hình. Trên điện thoại nó dán đáy như tấm trượt của ứng dụng gốc; từ
          sm trở lên mới nổi giữa màn hình. 92dvh thay cho 92vh để lúc bàn phím
          ảo bật lên, hộp thoại co theo vùng nhìn thấy thật. */}
      <div className={`max-h-[92dvh] w-full min-w-0 max-w-full overflow-y-auto overflow-x-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Field ───────────────────────────────────────────────────────────────────
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
/** Ô tìm nhanh trong một bảng.
 *
 *  🔑 Đặt ở đây, ⛔ không đặt ở tệp mới: `PoList` · `StyleList` · `CustomerList`
 *  · `InquiryList` · `CostingList` mỗi tệp tự dựng một ô tìm riêng, nên năm ô
 *  ấy **đã lệch nhau** về khổ chữ và chỗ đặt biểu tượng. Một ô dùng chung thì
 *  lần sau sửa một chỗ là đủ.
 *
 *  ⚠️ Đây là ô **lọc phía client trên dữ liệu đã tải** — ⛔ không phải tìm kiếm
 *  toàn hệ. Nó ⛔ không gọi CSDL, nên nó ⛔ không thấy dòng nào chưa nạp về. */
export function SearchBox({ value, onChange, placeholder, label }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative mb-3">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={`${inputCls} pl-9`}
      />
    </div>
  );
}

/** Dòng nhắc khi ô tìm lọc mất hết hàng.
 *
 *  🔑 ⛔ Không có nó, người dùng gõ nhầm một ký tự sẽ thấy **bảng trắng** và
 *  hiểu nhầm là *"⛔ không có dữ liệu"* — trong khi dữ liệu vẫn còn nguyên, chỉ
 *  bị từ khoá che. Đây là chỗ một ô tìm im lặng nói dối. */
export function NoDataTable({ hien, tong }: { hien: number; tong: number }) {
  if (hien > 0) return null;
  return (
    <p className="px-4 py-6 text-center text-sm text-slate-500">
      Không có dòng nào khớp từ khoá — <span className="font-semibold">{tong}</span> dòng đang bị lọc.
    </p>
  );
}

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 py-12 text-center text-slate-400">
      <Inbox className="mx-auto mb-2 h-8 w-8" />
      <p className="text-sm font-medium">{title}</p>
      {sub && <p className="mt-1 text-xs">{sub}</p>}
    </div>
  );
}

// ── Access denied ───────────────────────────────────────────────────────────
export function AccessDenied() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <p className="text-base font-bold text-slate-800">Không có quyền truy cập</p>
      <p className="max-w-sm text-sm text-slate-500">
        Tài khoản của bạn không được phân quyền vào module này. Liên hệ Super Admin nếu cần cấp quyền.
      </p>
    </div>
  );
}

// ── Badge "đang dùng dữ liệu demo" ──────────────────────────────────────────
export function MockBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <CloudOff className="h-3.5 w-3.5" /> Dữ liệu demo (mất kết nối Supabase)
    </span>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────
export function Skeleton({ className = 'h-4 w-24' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-100 ${className}`} />;
}

// ── Toast ───────────────────────────────────────────────────────────────────
export function useToast(): { toast: string; showToast: (msg: string) => void } {
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  return { toast, showToast: setToast };
}
export function ToastView({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
      {message}
    </div>
  );
}

// ── Biểu đồ cột ngang thuần div (một trục, nhãn trực tiếp, lưới mờ) ────────
export function SimpleBarChart({ data, tone = 'indigo', unit = '' }: {
  data: Array<{ label: string; value: number; sub?: string; alert?: boolean }>;
  tone?: Tone; unit?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3 p-5">
      {data.length === 0 && <EmptyState title="Chưa có dữ liệu" />}
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-slate-600">{d.label}</span>
            <span className={`text-xs font-semibold tabular-nums ${d.alert ? 'text-rose-600' : 'text-slate-700'}`}>
              {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(d.value)}{unit}
              {d.sub && <span className="ml-1.5 font-normal text-slate-400">{d.sub}</span>}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${d.alert ? TONE_BAR.rose : TONE_BAR[tone]}`}
              style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Đánh giá sao ────────────────────────────────────────────────────────────
export function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onChange} onClick={() => onChange && onChange(i)}
          className={onChange ? 'transition active:scale-90' : 'cursor-default'}>
          <Star className={`h-5 w-5 ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}
