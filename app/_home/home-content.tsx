'use client';

import { MODULES } from '../home-modules';
import AppCard from './app-card';
import { useLanguage } from '@/lib/i18n';
import { TYPE } from '@/lib/design/typography';
import { LOGO_TEXT_GRADIENT } from '@/lib/brand';

// ============================================================================
// NỘI DUNG TRANG CHỦ — Hiến pháp Điều 45 · đa ngôn ngữ
//
// ═══ VÌ SAO TÁCH RA THÀNH COMPONENT PHÍA CLIENT ════════════════════════
// Ngôn ngữ do người dùng chọn và lưu ở `localStorage`, nên nó chỉ tồn tại phía
// trình duyệt. `app/page.tsx` vẫn là Server Component — nó giữ khung, nền,
// thanh đầu trang và chân trang; chỉ phần CHỮ chuyển xuống đây.
//
// Đổi ngôn ngữ vì vậy vẽ lại ngay lập tức: không tải lại trang, không còn chữ
// cũ sót lại, không màn hình lẫn hai thứ tiếng — đúng ba yêu cầu của Board.
//
// ⚠️ `MONICA ONE` và 16 tên Business App **KHÔNG dịch** (§45.3). Chỉ những
// dòng chữ xung quanh chúng mới đi qua `t()`.
// ============================================================================

export default function HomeContent() {
  const { t } = useLanguage();

  return (
    <>
      {/* ═══ HERO — hai dòng, không hơn ═══════════════════════════════════
          ⚠️ MỌI cỡ chữ ở đây lấy từ `TYPE` (TD-10). Bản nháp đầu tiên của tệp
          này tự đặt `text-[38px] font-black sm:text-6xl` và **bài kiểm mục ⑩
          đã bắt được ngay** — đúng thứ cơ chế bánh cóc sinh ra để chặn. Sửa
          bằng cách dùng thẻ, KHÔNG bằng cách thêm tệp vào danh sách nợ. */}
      <section className="mb-12 text-center sm:mb-16">
        <h1 className="flex flex-wrap items-baseline justify-center gap-x-2.5 whitespace-nowrap sm:gap-x-4">
          <span className={`${TYPE.bodyLg} text-slate-500`}>{t('home.welcomeTo')}</span>
          {/* Tên sản phẩm — KHÔNG BAO GIỜ đi qua t() (§45.3) */}
          <span
            className={`${TYPE.display} bg-clip-text text-transparent`}
            style={{ backgroundImage: LOGO_TEXT_GRADIENT }}
          >
            MONICA ONE
          </span>
        </h1>

        {/* `brand.tagline` cố ý GIỐNG NHAU ở cả ba tệp dịch: "Business
            Operating System" là từ hiến định (§45.3). Vẫn cho nó đi qua khoá
            dịch để giữ đúng MỘT cửa vào cho mọi chuỗi hiển thị — và bài kiểm
            mục ⑪ sẽ chặn nếu có ai đó dịch nó. */}
        <p className={`${TYPE.overline} mt-5 text-slate-500 sm:mt-6`}>
          {t('brand.tagline')}
        </p>

        <p className={`${TYPE.bodySm} mt-3 text-slate-500`}>{t('home.hint')}</p>
      </section>

      {/* ═══ LƯỚI BUSINESS APP — ngay dưới Hero ══════════════════════════
          Mobile 2 · Tablet 3 · Desktop 4. Khoảng cách đều ở mọi mốc. */}
      <section aria-label={t('home.appsLabel')}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {MODULES.map((mod) => (
            <AppCard key={mod.name} mod={mod} />
          ))}
        </div>
      </section>
    </>
  );
}
