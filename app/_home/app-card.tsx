'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import type { ModuleItem } from '../home-modules';
import {
  MODULE_IDENTITY, ELEV_REST, ELEV_HOVER, GLASS, GLASS_GLOW, FOCUS_OFFSET_CANVAS,
} from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';
import { useLanguage } from '@/lib/i18n';

// ============================================================================
// THẺ BUSINESS APP — MỘT KIỂU DUY NHẤT CHO CẢ 16 MỤC
//
// ─── ⚠️ ĐÂY LÀ MỘT ỨNG DỤNG, KHÔNG PHẢI MỘT THẺ THÔNG TIN ───────────────
// Người dùng phải cảm thấy đang MỞ PHẦN MỀM, không phải đang ĐỌC MỘT Ô. Bốn
// thứ tạo ra cảm giác đó, và cả bốn đều rất nhỏ:
//
//   ① Mũi tên LUÔN hiện, chỉ rất mờ. Bản trước để `opacity-0` — thẻ không hề
//      báo mình bấm được cho tới khi con trỏ chạm vào, mà trên màn cảm ứng thì
//      **không bao giờ có lúc chạm vào**. Nay nó mờ sẵn và rõ dần khi rê.
//   ② Ô icon nhấc lên cùng thẻ, không phóng to rời rạc.
//   ③ Vạch nhấn nhạt lúc nghỉ, đậm hẳn khi rê — App "sáng lên" khi được chọn.
//   ④ Nhấn xuống có phản hồi tức thì (75ms), như một nút vật lý.
//
// ─── ⚠️ MỌI CỠ CHỮ LẤY TỪ `TYPE` (TD-10) ────────────────────────────────
// Tệp này trước đây tự đặt `text-[15px] sm:text-[17px]`, `text-[12.5px]`,
// `text-[9.5px]`. Nay dùng thẻ. Hai thứ được lợi:
//   • Nhịp chữ khớp với phần còn lại của hệ thống, không còn nửa pixel.
//   • Nhãn Beta từ **9,5px lên 11px** — 9,5px nằm DƯỚI SÀN ĐỌC ĐƯỢC của đặc
//     tả (§9), tức bản trước là một lỗi khả năng tiếp cận, không phải một lựa
//     chọn thẩm mỹ.
//
// ─── LUỒNG KHI BẤM ───────────────────────────────────────────────────────
//   Trang chủ → chọn App → Đăng nhập → Workspace
//
// `href` là đường dẫn THẬT, không phải `/login`. Khách chưa đăng nhập bấm vào
// thì `middleware.ts` chuyển sang `/login?next=<đường dẫn>`; đăng nhập xong
// quay đúng về nơi đã bấm.
//
// ⚠️ VÌ SAO KHÔNG TRỎ THẲNG VÀO `/login`: middleware xoá sạch chuỗi truy vấn
// khi người ĐÃ đăng nhập chạm `/login`, rồi đẩy về `ROLE_HOME`. Trỏ thẳng sẽ
// khiến người đã đăng nhập bấm "Merchandising" mà rơi về trang chủ vai trò.
// ============================================================================

export default function AppCard({ mod }: { mod: ModuleItem }) {
  const { t } = useLanguage();
  const Icon = mod.icon;
  // Nguồn màu DUY NHẤT của thẻ này — Điều 44.6.
  const id = MODULE_IDENTITY[mod.key];
  const mo = Boolean(mod.href);

  const inner = (
    <>
      {/* Vạch nhấn mép trên — Điều 44.2 · 44.9 Colour Ownership.
          Quét dọc lưới, mắt bắt được dải màu trước cả ô icon vì nó nằm ở mép.
          ⚠️ Lúc nghỉ chỉ 60% đục: mười sáu vạch màu no đủ cạnh nhau đọc ra một
          bảng phân loại; mờ đi thì chúng lùi về đúng vai trò — dấu nhận biết,
          không phải trang trí. Rê chuột mới lên 100%, và đó là lúc màu cần nói. */}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-[3px] rounded-t-[1.25rem] opacity-60 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none ${id.bar}`}
      />

      <div className="mb-5 flex items-start justify-between gap-3">
        {/* Ô icon — mỏ neo thị giác. Người vận hành xưởng nhận ra phân hệ bằng
            HÌNH và MÀU trước khi kịp đọc chữ, nên nó to hơn hẳn phần chữ.
            Vệt sáng ở mép trên (GLASS) là chỗ ánh sáng chạm vào khối bo tròn. */}
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-[1.25rem] transition-shadow duration-300 ease-out sm:h-[4.5rem] sm:w-[4.5rem] ${id.soft} ${id.primary} ${GLASS} ${GLASS_GLOW}`}
        >
          <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.6} aria-hidden="true" />
        </span>

        {mo ? (
          // Mờ sẵn chứ KHÔNG ẩn: trên màn cảm ứng không có trạng thái "rê
          // chuột", nên thứ chỉ hiện khi hover là thứ một nửa người dùng không
          // bao giờ thấy.
          <ArrowUpRight
            className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-500 motion-reduce:transition-none"
            aria-hidden="true"
          />
        ) : (
          // Nhãn Beta nói về TÌNH TRẠNG DỰNG PHẦN MỀM, không phải tình hình
          // kinh doanh. Đặt đúng chỗ mũi tên để hai trạng thái không làm lệch
          // bố cục của nhau.
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 ring-1 ring-inset ring-slate-200/80">
            <span className={`h-1 w-1 rounded-full ${id.bar}`} aria-hidden="true" />
            <span className={`${TYPE.overline} text-slate-500`}>{t('home.beta')}</span>
          </span>
        )}
      </div>

      <h2 className={`${TYPE.cardTitle} text-slate-900`}>{mod.name}</h2>
      {/* slate-500 trên nền trắng đạt 4,76:1 — vượt ngưỡng WCAG AA. slate-400
          chỉ đạt 2,56:1 và biến mất trên màn hình xưởng dưới đèn cao áp. */}
      <p className={`${TYPE.bodySm} mt-2 text-slate-500`}>{t(mod.descKey)}</p>
    </>
  );

  // ⚠️ `min-h` tăng và `p` tăng: mười sáu thẻ sát nhau thì khoảng thở là thứ
  // duy nhất ngăn lưới đọc ra như một bảng tính. Phần mềm doanh nghiệp phải
  // TĨNH, và tĩnh đến từ khoảng trống chứ không từ màu.
  const base =
    'group relative flex min-h-[13.5rem] flex-col rounded-[1.25rem] bg-white p-5 text-left sm:min-h-[15rem] sm:p-6';

  if (!mo) {
    // Chưa có route ⇒ không bọc <Link>: bấm vào sẽ là 404. Giữ nguyên màu và
    // bố cục, chỉ bỏ hiệu ứng nhấc lên — không hứa một hành vi không có.
    return (
      <div className={`${base} ${ELEV_REST}`} title={`${mod.name} — ${t('home.betaHint')}`}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={mod.href as string}
      // Chỉ chuyển động `transform` và `box-shadow` — hai thuộc tính chạy trên
      // GPU. Thêm `background-color` hay `width` là buộc trình duyệt tính lại
      // bố cục 60 lần mỗi giây.
      //
      // ⚠️ Nhấc 2px, không phải 3px. Nhấc mạnh đọc ra là hoạt ảnh; nhấc nhẹ đọc
      // ra là vật thể phản hồi. Ở đây người dùng cần nhận ra sự CHẮC CHẮN, chứ
      // không cần nhận ra chuyển động.
      //
      // ⚠️ `motion-reduce:*` — tôn trọng thiết lập giảm chuyển động của hệ điều
      // hành. Người rối loạn tiền đình có thể chóng mặt thật; đây là khả năng
      // tiếp cận, không phải tuỳ chọn thẩm mỹ.
      className={`${base} ${ELEV_REST} ${ELEV_HOVER} ring-1 ring-inset ring-transparent transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${FOCUS_OFFSET_CANVAS} active:translate-y-0 active:duration-75 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${id.hover} ${id.focus}`}
    >
      {inner}
    </Link>
  );
}
