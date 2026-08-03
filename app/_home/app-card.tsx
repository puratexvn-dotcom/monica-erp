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
        {/* ⚠️ Điện thoại 56px · từ `sm` là 96px.
            Bốn cột trên màn 390px chỉ chừa mỗi ô khoảng 80px, nên biểu tượng
            80px của bản trước sẽ TRÀN ra ngoài ô. 56px để lại đủ lề hai bên và
            vẫn là mỏ neo rõ ràng — đúng cỡ biểu tượng trên màn hình chính điện
            thoại. */}
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-[28%] transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.06] group-active:scale-95 group-active:duration-75 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100 sm:h-24 sm:w-24 ${sf.tileStrong} ${GLASS} ${iconShadow} ${iconShadowHover}`}
        >
          <Icon className="h-7 w-7 sm:h-12 sm:w-12" strokeWidth={1.6} aria-hidden="true" />
        </span>

        {/* Beta — chấm nhỏ ở góc trên phải biểu tượng, đúng chỗ điện thoại đặt
            huy hiệu. Viền trắng để nó tách khỏi màu biểu tượng bên dưới. */}
        {/* ⚠️ Ở khổ điện thoại chỉ còn MỘT CHẤM, từ `sm` mới hiện chữ "Beta".
            Bản nháp đầu tôi bóp chữ xuống 9px cho vừa biểu tượng 56px — và
            bài kiểm thang chữ chặn ngay, đúng lúc: 9px chính là cỡ đã bị loại
            khỏi thang vì nằm dưới ngưỡng đọc được. Thu nhỏ chữ tới mức không
            ai đọc nổi thì cái nhãn đó thôi làm nhãn.
            Một chấm thì không cần đọc — nó chỉ cần được THẤY, và ở đó nó làm
            đúng việc của mình. */}
        {!mo && (
          <>
            <span
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-white shadow-[0_1px_3px_rgba(16,24,40,0.16)] ring-1 ring-slate-200 sm:hidden"
              aria-hidden="true"
            >
              <span className={`absolute inset-[3px] rounded-full ${sf.tileStrong}`} />
            </span>
            <span
              className={`${TYPE.overline} absolute -right-1.5 -top-1.5 hidden rounded-full bg-white px-1.5 py-0.5 text-slate-500 shadow-[0_1px_3px_rgba(16,24,40,0.16)] ring-1 ring-slate-200 sm:block`}
            >
              {t('home.beta')}
            </span>
            {/* Khổ hẹp mất chữ "Beta", nên phải có lối đọc cho trình đọc màn
                hình — nếu không, sáu App chưa mở trở thành không phân biệt
                được với mười App đang chạy. */}
            <span className="sr-only sm:hidden">{t('home.beta')}</span>
          </>
        )}
      </span>

      {/* Tên App — ghim hai dòng để đáy mọi ô trong một hàng bằng nhau, bất kể
          tên dài ngắn và bất kể ngôn ngữ. */}
      {/* ⚠️ Ghim BA dòng ở khổ hẹp, HAI dòng từ `sm`.
          Ô rộng ~80px thì "Business Communication" và "Human Resources" phải
          xuống ba dòng mới đủ chỗ. Ghim hai dòng như cũ sẽ cắt cụt chữ. Ghim
          ba dòng thì đáy mọi ô trong một hàng vẫn bằng nhau — mà đó mới là
          điều kiện để lưới đọc ra là một lưới. */}
      <span
        className={`${TYPE.appLabel} mt-2.5 flex min-h-[3.9em] w-full items-start justify-center break-words px-0.5 text-center text-slate-800 transition-colors duration-200 group-hover:text-slate-900 sm:mt-4 sm:min-h-[2.6em] sm:px-0`}
      >
        {mod.name}
      </span>

      {/* ⚠️ DÒNG CHÚ THÍCH QUAY LẠI — nhưng ở đúng hạng của nó.
          Tên App là từ vựng hiến định bằng tiếng Anh: "Merchandising",
          "Subcontract" — người chưa quen hệ thống không đoán được đó là bộ
          phận nào. Dòng tiếng Việt này là thứ khiến họ CHỌN ĐƯỢC.
          Nét thanh (300) và cỡ nhỏ (11–12px) nên nó đọc được mà không tranh
          chấp với tên. Ghim hai dòng để lưới không so le. */}
      {/* ═══ CHÚ THÍCH — HAI BẢN, MỘT VAI TRÒ ═══════════════════════════
          Điện thoại và máy tính dùng HAI câu khác nhau, không phải một câu bị
          cắt bớt.

          Ô trên điện thoại rộng khoảng 80px; ở cỡ chữ 11px nó chứa chừng bảy
          ký tự mỗi dòng. Câu đầy đủ "Điều hành và phê duyệt toàn nhà máy" sẽ
          trải thành NĂM dòng và biến lưới thành một bức tường chữ.

          ⚠️ Cắt chữ bằng `line-clamp` KHÔNG giải quyết được: cắt xong còn
          "Điều hành và…" thì mất đúng phần mang nghĩa, mà chú thích tồn tại
          chính là để người dùng HIỂU và CHỌN ĐƯỢC. Muốn ngắn mà vẫn hiểu thì
          phải VIẾT LẠI — nên có bản rút gọn 2–4 từ, dịch đủ ba ngôn ngữ. */}
      <span
        className={`${TYPE.appHint} mt-1.5 flex w-full items-start justify-center text-center text-slate-500 sm:hidden`}
      >
        {t(mod.shortKey)}
      </span>
      <span
        className={`${TYPE.appHint} mt-1.5 hidden min-h-[2.9em] w-full items-start justify-center text-center text-slate-500 sm:flex`}
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
