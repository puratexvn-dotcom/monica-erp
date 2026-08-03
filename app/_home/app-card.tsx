'use client';

import Link from 'next/link';

import type { ModuleItem } from '../home-modules';
import { MODULE_SURFACE, GLASS } from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';
import { useLanguage } from '@/lib/i18n';

// ============================================================================
// BUSINESS APP — KHÔNG CÒN KHUNG. BIỂU TƯỢNG VÀ TÊN, HẾT.
//
// ═══ VÌ SAO BỎ HẲN KHUNG ════════════════════════════════════════════════
// Cái khung không mang thông tin nào cả. Nó chỉ vẽ một đường bao quanh thứ
// vốn đã tách bạch nhờ khoảng trắng. Mười sáu cái khung xếp cạnh nhau tạo ra
// mười sáu đường viền, mười sáu nền màu, mười sáu vệt bóng — tức là ba lớp
// nhiễu chồng lên nội dung thật, mà nội dung thật chỉ có hai thứ: BIỂU TƯỢNG
// và TÊN.
//
// Bỏ khung đi thì trang thở ra. Đây đúng là cách màn hình chính điện thoại
// hoạt động: không ai vẽ hộp quanh từng ứng dụng, mà chưa bao giờ có ai nhầm
// ứng dụng này với ứng dụng kia.
//
// ═══ KHI MẤT KHUNG, BIỂU TƯỢNG PHẢI GÁNH TẤT CẢ ═════════════════════════
// Khung biến mất nghĩa là mất luôn nền màu và mất luôn bóng đổ — hai thứ
// trước đây làm nhiệm vụ nhận diện và tách lớp. Nên biểu tượng phải:
//
//   • TO HẲN LÊN            64 → 80px, đủ sức làm mỏ neo một mình
//   • BO GÓC MỀM            góc bo 28% cạnh — tỷ lệ của biểu tượng iOS, khác
//                           hẳn góc bo của một cái thẻ
//   • CÓ BÓNG RIÊNG         bóng nay thuộc về BIỂU TƯỢNG, không thuộc về hộp;
//                           nhờ vậy nó nổi trên nền trang chứ không nằm trong
//                           một cái khay
//   • MÀU BÃO HOÀ           màu nay là thứ DUY NHẤT phân biệt mười sáu mục
//
// ═══ CĂN GIỮA ═══════════════════════════════════════════════════════════
// Biểu tượng và tên cùng một trục dọc, tên nằm chính giữa bên dưới. Ghim tên
// đúng hai dòng để mọi ô trong một hàng có đáy bằng nhau, dù tên dài ngắn khác
// nhau và dù đang ở tiếng Việt, Anh hay Trung.
//
// ⚠️ Câu mô tả chuyển vào thuộc tính `title` — hiện khi rê chuột, không còn
// chiếm chỗ trên lưới. Màn hình chính điện thoại không có dòng mô tả nào dưới
// tên ứng dụng, và đó chính là lý do nó trông thoáng.
// ============================================================================

export default function AppCard({ mod }: { mod: ModuleItem }) {
  const { t } = useLanguage();
  const Icon = mod.icon;
  const sf = MODULE_SURFACE[mod.key];
  const mo = Boolean(mod.href);

  // Bóng của BIỂU TƯỢNG, không phải của hộp. Hai lớp: một lớp sát để bắt mép,
  // một lớp toả rộng và thấp để nó có vẻ đang nổi trên mặt trang.
  const iconShadow =
    'shadow-[0_2px_4px_-1px_rgba(16,24,40,0.10),0_12px_24px_-8px_rgba(16,24,40,0.18)]';
  const iconShadowHover =
    'group-hover:shadow-[0_4px_8px_-2px_rgba(16,24,40,0.12),0_20px_36px_-10px_rgba(16,24,40,0.26)]';

  const inner = (
    <>
      <span className="relative">
        {/* rounded-[28%] — tỷ lệ bo góc của biểu tượng điện thoại. Dùng giá trị
            phần trăm để góc bo giãn theo kích thước ô ở từng khổ màn, giữ đúng
            dáng ở mọi cỡ. */}
        {/* 80 → 96px. Bỏ khung rồi thì biểu tượng là mỏ neo DUY NHẤT; ở cỡ 80
            nó vẫn còn dáng một cái nút, ở 96 nó thành một biểu tượng ứng dụng
            thật sự. */}
        <span
          className={`flex h-20 w-20 items-center justify-center rounded-[28%] transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.06] group-active:scale-95 group-active:duration-75 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100 sm:h-24 sm:w-24 ${sf.tileStrong} ${GLASS} ${iconShadow} ${iconShadowHover}`}
        >
          <Icon className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.6} aria-hidden="true" />
        </span>

        {/* Beta — chấm nhỏ ở góc trên phải biểu tượng, đúng chỗ điện thoại đặt
            huy hiệu. Viền trắng để nó tách khỏi màu biểu tượng bên dưới. */}
        {!mo && (
          <span
            className={`${TYPE.overline} absolute -right-1.5 -top-1.5 rounded-full bg-white px-1.5 py-0.5 text-slate-500 shadow-[0_1px_3px_rgba(16,24,40,0.16)] ring-1 ring-slate-200`}
          >
            {t('home.beta')}
          </span>
        )}
      </span>

      {/* Tên App — ghim hai dòng để đáy mọi ô trong một hàng bằng nhau, bất kể
          tên dài ngắn và bất kể ngôn ngữ. */}
      <span
        className={`${TYPE.appLabel} mt-4 flex min-h-[2.6em] w-full items-start justify-center text-center text-slate-800 transition-colors duration-200 group-hover:text-slate-900`}
      >
        {mod.name}
      </span>

      {/* ⚠️ DÒNG CHÚ THÍCH QUAY LẠI — nhưng ở đúng hạng của nó.
          Tên App là từ vựng hiến định bằng tiếng Anh: "Merchandising",
          "Subcontract" — người chưa quen hệ thống không đoán được đó là bộ
          phận nào. Dòng tiếng Việt này là thứ khiến họ CHỌN ĐƯỢC.
          Nét thanh (300) và cỡ nhỏ (11–12px) nên nó đọc được mà không tranh
          chấp với tên. Ghim hai dòng để lưới không so le. */}
      <span
        className={`${TYPE.appHint} mt-1.5 flex min-h-[2.9em] w-full items-start justify-center text-center text-slate-500`}
      >
        {t(mod.descKey)}
      </span>
    </>
  );

  // Không nền. Không viền. Không bóng trên vùng bấm. Vùng bấm vẫn phủ trọn cả
  // biểu tượng lẫn tên — người dùng chạm vào chữ cũng mở được App.
  const base = 'group flex flex-col items-center rounded-2xl p-2 focus-visible:outline-none';

  if (!mo) {
    return (
      <div
        className={`${base} cursor-default opacity-60`}
        title={`${mod.name} — ${t(mod.descKey)} · ${t('home.betaHint')}`}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={mod.href as string}
      title={`${mod.name} — ${t(mod.descKey)}`}
      className={`${base} focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F7F9]`}
    >
      {inner}
    </Link>
  );
}
