import { SO_BUSINESS_APP } from '@/lib/mos/registry/business-apps';

// ============================================================================
// KHUNG CHỜ CỦA TRANG CHỦ
//
// ⚠️ Nó **⛔ không** phải một vòng xoay. Vòng xoay nói *"đang bận"*; khung này
// nói *"trang trông sẽ như thế này"* — và nhờ vậy khi nội dung thật về, **⛔
// không có cú nhảy bố cục**.
//
// 🔑 Kích thước ở đây phải **khớp** với `app-card.tsx`: biểu tượng `68px` ·
//    `120px` từ `sm`. Lệch một chút thì trang **giật** đúng lúc người dùng vừa
//    bắt đầu nhìn — và cú giật đó đắt hơn hẳn vài trăm mili giây chờ.
//
// ⚠️ ⛔ KHÔNG bịa tên App vào đây. Ô xám ⛔ không nói dối; một tên App giả thì
// có — và nó sẽ nhấp nháy đổi thành tên khác khi dữ liệu thật về.
// ============================================================================

/** Một ô xám, đúng dáng ô thật. */
function OCho() {
  return (
    <div className="flex flex-col items-center p-2">
      <div className="h-[96px] w-[96px] animate-pulse rounded-[28%] bg-slate-200/70 sm:h-[164px] sm:w-[164px]" />
      <div className="mt-2.5 h-3 w-3/4 animate-pulse rounded bg-slate-200/60 sm:mt-4" />
      <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-slate-200/40" />
    </div>
  );
}

export default function HomeSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto max-w-5xl pt-28 sm:pt-36">
      {/* 🔴 REV 4 — PHẲNG THEO NỘI DUNG THẬT.

          Khung chờ phải là **cùng hình dạng** với thứ sắp thay nó. Rev 2 chia
          sáu nhóm nên khung chờ cũng chia sáu; Rev 4 phẳng nên khung chờ
          phẳng. Lệch hình là **cú nhảy bố cục** đúng lúc người dùng vừa bắt
          đầu nhìn.

          🔑 Số ô đọc từ `SO_BUSINESS_APP` — thêm một Business App là khung
          chờ **tự dài ra**, ⛔ không ai phải nhớ sửa. */}
      <div className="grid grid-cols-4 gap-x-1.5 gap-y-6 sm:gap-x-4 sm:gap-y-8">
        {Array.from({ length: SO_BUSINESS_APP }, (_, i) => <OCho key={i} />)}
      </div>
    </div>
  );
}
