'use client';

import { useLanguage } from '@/lib/i18n';
import { TYPE } from '@/lib/design/typography';
import { APP_NAME } from '@/lib/brand';

// ============================================================================
// CHÂN TRANG THƯƠNG HIỆU — dùng chung cho Trang chủ và Trang đăng nhập
//
// ⚠️ MỘT component, HAI nơi gọi. Chép hai bản là cách chắc chắn để sáu tháng
// nữa số hotline ở trang chủ khác số hotline ở trang đăng nhập — và người gọi
// nhầm số thì không bao giờ báo lại cho ai biết.
//
// ─── ⚠️ SỐ ĐIỆN THOẠI PHẢI BẤM GỌI ĐƯỢC ──────────────────────────────────
// `tel:` chứ không phải chữ trơn. Phần lớn người mở trang này trên điện thoại
// giữa xưởng; bắt họ nhớ mười chữ số rồi tự bấm lại là mất đúng cuộc gọi cần
// nhất. Chữ hiển thị tách nhóm `0908 779 585` cho dễ đọc, còn `href` giữ
// nguyên liền `0908779585` để máy quay số hiểu đúng.
//
// ⚠️ Chữ "MONICA ONE" và "Joseph" KHÔNG đi qua t() — tên riêng, và
// "MONICA ONE" là từ vựng hiến định (§45.3). Phần dịch được chỉ là "Phát
// triển bởi…" và nhãn "Hotline".
// ============================================================================

const HOTLINE_RAW = '0908779585';
const HOTLINE_TEXT = '0908 779 585';

export default function BrandFooter({ className = '' }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <footer className={`text-center ${className}`}>
      {/* Dấu chấm giữa ngăn ba mệnh đề trên MỘT dòng ở màn rộng; ở màn hẹp
          `flex-wrap` cho chúng tự xuống dòng thay vì bị cắt cụt. */}
      <p
        className={`${TYPE.caption} flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-slate-500`}
      >
        <span>© 2026 {APP_NAME}</span>
        <span className="text-slate-300" aria-hidden="true">·</span>
        <span>{t('footer.developedBy')}</span>
        <span className="text-slate-300" aria-hidden="true">·</span>
        <span>
          {t('footer.hotline')}{' '}
          {/* Dùng thẻ chữ `label` (13px · 500) thay vì tự đặt `font-semibold`:
              số hotline cần nhỉnh hơn phần chữ quanh nó, và `label` đúng là vai
              trò đó. Màu giữ ở dải trung tính — chân trang không phải chỗ dựng
              thêm một sắc nhấn thứ hai. */}
          <a
            href={`tel:${HOTLINE_RAW}`}
            className={`${TYPE.label} text-slate-700 underline-offset-4 transition-colors hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400`}
          >
            {HOTLINE_TEXT}
          </a>
        </span>
      </p>
    </footer>
  );
}
