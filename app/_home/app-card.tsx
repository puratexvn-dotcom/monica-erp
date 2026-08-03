'use client';

import Link from 'next/link';

import type { ModuleItem } from '../home-modules';
import {
  MODULE_IDENTITY, ELEV_REST, ELEV_HOVER, GLASS, GLASS_GLOW, FOCUS_OFFSET_CANVAS,
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
  const mo = Boolean(mod.href);

  const inner = (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-shadow duration-300 ease-out ${id.soft} ${id.primary} ${GLASS} ${GLASS_GLOW}`}
        >
          <Icon className="h-[22px] w-[22px]" strokeWidth={1.7} aria-hidden="true" />
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
      <p className={`${TYPE.bodySm} mt-2 line-clamp-2 min-h-[2.6em] text-slate-500`}>
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
  const base =
    'group relative flex min-h-[11rem] flex-col rounded-2xl p-5 text-left';

  if (!mo) {
    // Chưa có route ⇒ không bọc <Link>. Nền ngà thay vì trắng: khác biệt rất
    // nhẹ nhưng đủ để mắt phân loại được 6 thẻ chưa mở với 10 thẻ mở được, mà
    // không cần đọc nhãn Beta.
    return (
      <div
        className={`${base} bg-white/70 ${ELEV_REST}`}
        title={`${mod.name} — ${t('home.betaHint')}`}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={mod.href as string}
      className={`${base} bg-white ${ELEV_REST} ${ELEV_HOVER} ring-1 ring-inset ring-transparent transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${FOCUS_OFFSET_CANVAS} active:translate-y-0 active:duration-75 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${id.hover} ${id.focus}`}
    >
      {inner}
    </Link>
  );
}
