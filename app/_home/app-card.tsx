import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import type { ModuleItem } from '../home-modules';
import {
  MODULE_IDENTITY, ELEV_REST, ELEV_HOVER, GLASS, GLASS_GLOW,
} from '@/lib/design/tokens';

// ============================================================================
// THẺ BUSINESS APP — MỘT KIỂU DUY NHẤT CHO CẢ 16 MỤC
//
// ─── ⚠️ TRÊN THẺ KHÔNG CÓ MỘT MẨU THÔNG TIN VẬN HÀNH NÀO ────────────────
// Không số liệu, không trạng thái vận hành, không KPI, không việc tồn đọng.
// Trang chủ là LỐI VÀO CÔNG KHAI: bất kỳ ai gõ đúng địa chỉ đều thấy nó, kể
// cả khi chưa đăng nhập. Mọi thông tin vận hành chỉ được phép xuất hiện SAU
// khi xác thực, và xuất hiện bên trong Workspace — không phải ở đây.
//
// Thẻ vì vậy chỉ mang đúng bốn thứ: ô icon · tên hiến định · một dòng mô tả
// nghiệp vụ · mũi tên chỉ hướng. Nhãn Beta chỉ nói về TÌNH TRẠNG DỰNG PHẦN
// MỀM, không nói gì về tình hình kinh doanh.
//
// ─── LUỒNG KHI BẤM ───────────────────────────────────────────────────────
//   Trang chủ → chọn App → Đăng nhập → Workspace
//
// `href` là đường dẫn THẬT của phân hệ, không phải `/login`. Khách chưa đăng
// nhập bấm vào thì `middleware.ts` chặn và chuyển sang `/login?next=<đường
// dẫn>`; đăng nhập xong họ quay đúng về nơi đã bấm.
//
// ⚠️ VÌ SAO KHÔNG TRỎ THẲNG `href` VÀO `/login`: `middleware.ts` xoá sạch
// chuỗi truy vấn khi người ĐÃ đăng nhập chạm `/login` (`url.search = ''`),
// rồi đẩy họ về `ROLE_HOME`. Trỏ thẳng vào `/login?next=/md` sẽ khiến người
// đã đăng nhập bấm "Merchandising" mà lại rơi về trang chủ vai trò của mình —
// gãy đúng bước cuối của luồng bắt buộc. Giữ `href` thật là cách DUY NHẤT để
// cả hai trạng thái đều đi đúng đường.
//
// ─── THANG BẬC CHỮ ───────────────────────────────────────────────────────
//   Tên   16–18px · 600 · tracking-tight   · slate-900
//   Mô tả 12.5–13px · 400 · leading-relaxed · slate-500
//
// Hai cấp, khác nhau ở cỡ, độ đậm, giãn chữ và màu. Trang chủ không có gì để
// nói thêm ngoài "đây là App gì" — thêm cấp chữ thứ ba là thêm thứ phải đọc.
// ============================================================================

export default function AppCard({ mod }: { mod: ModuleItem }) {
  const Icon = mod.icon;
  // Nguồn màu DUY NHẤT của thẻ này. Không một mã màu nào được viết thẳng
  // trong tệp — Điều 44.6.
  const id = MODULE_IDENTITY[mod.key];

  const inner = (
    <>
      {/* Vạch nhấn mép trên — Điều 44.2. Một dải 3px mang đúng sắc của App,
          nằm sát mép thẻ. Đây là thứ khiến mười sáu thẻ trắng thôi đọc ra
          "mười sáu ô giống nhau": quét dọc lưới, mắt bắt được dải màu trước
          cả ô icon, vì nó nằm ở mép — nơi mắt chạm đầu tiên khi lướt. */}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-[3px] rounded-t-[1.25rem] ${id.bar}`}
      />

      <div className="mb-5 flex items-start justify-between gap-3">
        {/* Ô icon 80px — mỏ neo thị giác. Người vận hành xưởng nhận ra phân hệ
            bằng HÌNH và MÀU trước khi kịp đọc chữ, nên nó to hơn hẳn phần chữ.
            Vệt sáng mảnh ở mép trên (GLASS) là chỗ ánh sáng chạm vào một khối
            bo tròn — một dòng, và ô icon thôi trông như mảng màu, bắt đầu
            trông như một vật thể có bề mặt. */}
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-[1.25rem] transition-[transform,box-shadow] duration-300 ease-out group-hover:scale-[1.04] sm:h-20 sm:w-20 ${id.soft} ${id.primary} ${GLASS} ${GLASS_GLOW}`}
        >
          <Icon className="h-7 w-7 sm:h-9 sm:w-9" strokeWidth={1.6} aria-hidden="true" />
        </span>

        {mod.href ? (
          <ArrowUpRight
            className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-400 group-hover:opacity-100"
            aria-hidden="true"
          />
        ) : (
          // Nhãn Beta nói về TÌNH TRẠNG DỰNG PHẦN MỀM, không phải tình hình
          // kinh doanh. Đặt ở đúng chỗ mũi tên để hai trạng thái không làm
          // lệch bố cục của nhau.
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 ring-1 ring-inset ring-slate-200/80">
            <span className={`h-1 w-1 rounded-full ${id.bar}`} aria-hidden="true" />
            <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Beta
            </span>
          </span>
        )}
      </div>

      <h2 className="text-[15px] font-semibold leading-tight tracking-[-0.015em] text-slate-900 sm:text-[17px]">
        {mod.name}
      </h2>
      {/* slate-500 trên nền trắng đạt 4,76:1 — vượt ngưỡng WCAG AA (4,5:1).
          slate-400 chỉ đạt 2,56:1 và sẽ biến mất trên màn hình xưởng dưới
          ánh đèn cao áp. */}
      <p className="mt-1.5 text-[12.5px] font-normal leading-relaxed text-slate-500 sm:text-[13px]">
        {mod.desc}
      </p>
    </>
  );

  const base =
    'group relative flex min-h-[13rem] flex-col rounded-[1.25rem] bg-white p-5 text-left sm:min-h-[14.5rem] sm:p-6';

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
      className={`${base} ${ELEV_REST} ${ELEV_HOVER} ring-1 ring-inset ring-transparent transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 active:duration-75 ${id.hover} ${id.focus}`}
    >
      {inner}
    </Link>
  );
}
