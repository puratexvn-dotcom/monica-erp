'use client';

import Link from 'next/link';

import type { ModuleItem } from '../home-modules';
import {
  MODULE_IDENTITY, MODULE_SURFACE, ELEV_REST, ELEV_HOVER, GLASS, GLASS_GLOW,
  FOCUS_OFFSET_CANVAS,
} from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';
import { useLanguage } from '@/lib/i18n';

// ============================================================================
// THẺ BUSINESS APP — BẢN DỰNG LẠI SAU KHI BOARD TỪ CHỐI BẢN CŨ
//
// ═══ BẢN CŨ SAI Ở ĐÂU ═══════════════════════════════════════════════════
// Không sai về kỹ thuật. Sai về TỶ LỆ.
//
//   • Ô icon 72px cạnh tên 16px  → tỷ lệ 4,5:1. Đó là bàn phím ứng dụng của
//     điện thoại, không phải hệ điều hành doanh nghiệp.
//   • Thẻ cao 240px chứa hai dòng chữ → một phần ba dưới trống trơn, thẻ
//     không có điểm tựa ở đáy.
//   • 240×330 gần vuông → tỷ lệ ít sức sống nhất có thể chọn.
//   • Vạch màu tràn mép trên → khuôn mẫu "panel cảnh báo" của bảng điều
//     khiển đời cũ.
//   • Tên App 16px → bằng cỡ chữ thân bài ở chỗ khác, tức tự hạ nó xuống
//     hàng chú thích.
//
// ═══ BẢN NÀY ĐẢO NGƯỢC TỶ LỆ ════════════════════════════════════════════
//
//   ô icon 72 → 44px          tên 16 → 18px
//   cao 240 → 176px           tỷ lệ ~1,9:1 (nằm ngang, có hướng)
//
// Icon thôi làm nhân vật chính; TÊN ỨNG DỤNG làm nhân vật chính. Icon lùi về
// đúng vai trò: mỏ neo màu để nhận diện khi quét mắt.
//
// ⚠️ ĐÃ GỠ vạch màu mép trên và mũi tên góc.
// "Premium products remove." Màu vẫn còn nguyên ở ô icon — mười sáu sắc, đủ
// để nhận ra bằng mắt. Thêm một vạch màu nữa chỉ là nói cùng một điều hai lần
// bằng một khuôn mẫu đã cũ.
//
// ⚠️ Bo góc: thẻ 16px, ô icon 12px. Bản cũ để cả hai 20px nên ô icon đọc ra
// như một cái thẻ con nằm trong thẻ mẹ. Khác cấp thì phải khác bo góc.
// ============================================================================

export default function AppCard({ mod }: { mod: ModuleItem }) {
  const { t } = useLanguage();
  const Icon = mod.icon;
  const id = MODULE_IDENTITY[mod.key];
  const sf = MODULE_SURFACE[mod.key];
  const mo = Boolean(mod.href);

  const inner = (
    <>
      <div className="mb-3.5 flex items-start justify-between gap-3">
        {/* ⚠️ Ô ICON 64px, BIỂU TƯỢNG TRẮNG TRÊN NỀN BÃO HOÀ.
            Đây là nơi "sinh động" thật sự nằm. Nền thẻ chỉ ở sắc độ 50 để chữ
            còn đọc được; sức sống dồn hết vào ô này. Biểu tượng trắng trên nền
            đặc cho tương phản cao nhất có thể — nhận ra được từ khoảng cách xa
            gấp đôi so với biểu tượng màu trên nền nhạt. */}
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-[transform,box-shadow] duration-300 ease-out group-hover:scale-105 sm:h-16 sm:w-16 ${sf.tileStrong} ${GLASS} ${GLASS_GLOW}`}
        >
          <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.8} aria-hidden="true" />
        </span>

        {/* Beta: chấm + chữ, KHÔNG khung viên thuốc. Khung làm nhãn nặng ngang
            ô icon; bỏ khung đi thì nó lùi về đúng hạng — một ghi chú, không
            phải một huy hiệu. */}
        {!mo && (
          <span className="flex shrink-0 items-center gap-1.5 pt-1">
            <span className={`h-1 w-1 rounded-full ${id.bar}`} aria-hidden="true" />
            <span className={`${TYPE.overline} text-slate-400`}>{t('home.beta')}</span>
          </span>
        )}
      </div>

      {/* Tên ứng dụng — nhân vật chính của thẻ */}
      <h2 className={`${TYPE.appTitle} text-slate-900`}>{mod.name}</h2>

      {/* ⚠️ `line-clamp-2` + `min-h`: mười sáu câu mô tả dài ngắn khác nhau, và
          ba ngôn ngữ dài ngắn khác nhau nữa. Không ghim chiều cao thì đáy thẻ
          nhấp nhô theo từng ô — thứ phá vỡ cảm giác "một lưới" nhanh hơn bất
          cứ chi tiết nào khác. */}
      {/* slate-600 chứ không slate-500: nay chữ nằm trên nền MÀU, không phải
          nền trắng, nên phải đậm thêm một bậc mới giữ được ngưỡng AA. */}
      <p className={`${TYPE.bodySm} mt-1.5 line-clamp-2 min-h-[2.6em] text-slate-600`}>
        {t(mod.descKey)}
      </p>
    </>
  );

  // 176px: vừa đủ cho ô icon 44 + tên 18 + hai dòng mô tả + đệm. Không dư một
  // vùng trống nào ở đáy.
  // ⚠️ `base` KHÔNG khai nền. Bản trước để `bg-white` ở đây rồi ghi đè bằng
  // `bg-white/60` ở nhánh Beta — mà thứ tự lớp trong CHUỖI không quyết định
  // được ai thắng, thứ tự trong TỆP CSS mới quyết định. Nó chạy đúng hôm nay
  // hoàn toàn do may mắn về thứ tự Tailwind sinh ra. Nay mỗi nhánh tự khai nền
  // của mình, không còn chỗ cho may rủi.
  // ⚠️ `before:` — MÉP TRÊN BẮT SÁNG.
  //
  // Trang nay có một trần sáng ở đầu (xem app/page.tsx). Nếu các thẻ không
  // phản ứng với nguồn sáng đó thì trần sáng chỉ là một vệt trang trí dán lên
  // nền. Một đường sáng trắng mảnh chạy dọc mép TRÊN của mỗi thẻ — đúng chỗ
  // ánh sáng từ trên chạm vào một khối bo tròn — biến bóng đổ bên dưới từ
  // "hiệu ứng" thành "hệ quả".
  //
  // Rộng 60%, căn giữa, mờ dần hai đầu: ánh sáng thật không dừng đột ngột ở
  // góc. Một pixel, gradient, và cả lưới thôi trông như dán phẳng.
  // ⚠️ HỘP NHỎ LẠI, ICON TO LÊN — đúng chỉ thị.
  //   cao 176 → 160px  ·  đệm 20 → 16px  ·  ô icon 44 → 64px
  // Tỷ lệ icon/hộp đảo hẳn: icon nay chiếm 40% chiều cao thẻ thay vì 25%. Thẻ
  // đọc ra là MỘT ỨNG DỤNG có biểu tượng, không phải một ô chữ có hình minh hoạ.
  const base =
    'group relative flex min-h-[10rem] flex-col overflow-hidden rounded-2xl p-4 text-left ring-1 ring-inset ' +
    'before:pointer-events-none before:absolute before:inset-x-[15%] before:top-0 before:h-px ' +
    'before:bg-gradient-to-r before:from-transparent before:via-white/90 before:to-transparent';

  if (!mo) {
    // Chưa có route ⇒ không bọc <Link>. Nền cùng sắc nhưng giảm độ đục: 6 thẻ
    // chưa mở vẫn giữ danh tính màu, chỉ lùi lại một bước so với 10 thẻ mở được.
    return (
      <div
        className={`${base} ${sf.surface} ${sf.edge} opacity-75 ${ELEV_REST}`}
        title={`${mod.name} — ${t('home.betaHint')}`}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={mod.href as string}
      className={`${base} ${sf.surface} ${sf.edge} ${ELEV_REST} ${ELEV_HOVER} transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${FOCUS_OFFSET_CANVAS} active:translate-y-0 active:duration-75 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${id.focus}`}
    >
      {inner}
    </Link>
  );
}
