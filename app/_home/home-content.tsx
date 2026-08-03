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
      {/* ─── NHỊP DỌC: 3 · 7 · 3 ────────────────────────────────────────
          Khoảng cách KHÔNG đều nhau, và đó là chủ ý. "Welcome to" dính sát
          wordmark vì hai thứ đó là MỘT câu; tagline đứng xa hơn hẳn vì nó là
          một phát biểu riêng; dòng gợi ý nép lại gần tagline vì nó phụ thuộc
          vào tagline.
          Khoảng cách đều nhau sẽ khiến bốn dòng đọc ra như bốn mục ngang hàng —
          mắt phải tự đoán cái nào quan trọng. Nhịp lệch làm việc đó thay mắt. */}
      <section className="mb-14 text-center sm:mb-20">
        {/* `items-baseline`: chữ nhỏ ngồi trên CÙNG ĐƯỜNG CHÂN với wordmark,
            không phải căn giữa theo chiều cao. Căn giữa sẽ làm "Welcome to"
            trôi lên lơ lửng giữa thân chữ MONICA ONE. */}
        <h1 className="flex flex-wrap items-baseline justify-center gap-x-3 whitespace-nowrap sm:gap-x-4">
          <span className={`${TYPE.bodyLg} text-slate-500`}>{t('home.welcomeTo')}</span>
          {/* Tên sản phẩm — KHÔNG BAO GIỜ đi qua t() (§45.3).
              `pr-[0.06em]`: dải chuyển sắc cắt theo chữ (`bg-clip-text`) hay bị
              xén mất phần đuôi của ký tự cuối ở một số bộ chữ. Thêm một chút
              đệm phải là cách rẻ nhất để chữ "E" không bị gọt cạnh. */}
          <span
            className={`${TYPE.display} bg-clip-text pr-[0.06em] text-transparent`}
            style={{ backgroundImage: LOGO_TEXT_GRADIENT }}
          >
            MONICA ONE
          </span>
        </h1>

        {/* `brand.tagline` cố ý GIỐNG NHAU ở cả ba tệp dịch: "Business
            Operating System" là từ hiến định (§45.3). Vẫn cho nó đi qua khoá
            dịch để giữ đúng MỘT cửa vào cho mọi chuỗi hiển thị — và bài kiểm
            mục ⑪ sẽ chặn nếu có ai đó dịch nó.
            slate-600 chứ không slate-500: chữ 11px giãn rộng trên nền #F6F7F9
            cần đậm hơn một bậc mới đạt ngưỡng AA. */}
        <p className={`${TYPE.overline} mt-7 text-slate-600 sm:mt-8`}>
          {t('brand.tagline')}
        </p>

        <p className={`${TYPE.bodySm} mt-3 text-slate-600`}>{t('home.hint')}</p>
      </section>

      {/* ═══ LƯỚI BUSINESS APP — ngay dưới Hero ══════════════════════════
          Mobile 2 · Tablet 3 · Desktop 4. Khoảng cách đều ở mọi mốc. */}
      {/* ⚠️ Khoảng cách lưới NỚI RỘNG một nấc (3→4 ở màn hẹp, 4→5 từ sm).
          Mười sáu thẻ là mật độ cao; khoảng cách hẹp làm chúng đọc ra như các ô
          của MỘT bảng, khoảng cách rộng làm mỗi thẻ đọc ra như MỘT ứng dụng
          riêng. Đây là thay đổi rẻ nhất và có tác dụng lớn nhất trong cả lượt
          tinh chỉnh này. */}
      <section aria-label={t('home.appsLabel')}>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {MODULES.map((mod) => (
            <AppCard key={mod.name} mod={mod} />
          ))}
        </div>
      </section>
    </>
  );
}
