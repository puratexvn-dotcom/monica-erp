import { SO_O_MOI_NHOM } from '@/lib/mos/registry/business-apps';

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
      <div className="h-[68px] w-[68px] animate-pulse rounded-[28%] bg-slate-200/70 sm:h-[120px] sm:w-[120px]" />
      <div className="mt-2.5 h-3 w-3/4 animate-pulse rounded bg-slate-200/60 sm:mt-4" />
      <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-slate-200/40" />
    </div>
  );
}

export default function HomeSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto flex max-w-5xl flex-col gap-y-9 pt-28 sm:gap-y-14 sm:pt-36">
      {/* 🔴 REV 3 — SỐ Ô ĐỌC TỪ REGISTRY, ⛔ KHÔNG VIẾT CỨNG.

          Bản trước tôi viết cứng `[1, 3, 7, 2, 1, 8]` ngay tại đây — và đó đúng
          thứ Board cấm ở Rev 3. Thêm một Business App là khung chờ **lệch**
          khỏi nội dung thật, mà cú lệch đó **⛔ không phép kiểm nào bắt được**:
          nó chỉ hiện ra thành một **cú nhảy bố cục** ⛔ không ai truy được
          nguyên nhân. */}
      {SO_O_MOI_NHOM.map((soO, nhom) => (
        <div key={nhom}>
          <div className="mb-3 h-2.5 w-24 animate-pulse rounded bg-slate-200/50 sm:mb-5" />
          <div className="grid grid-cols-4 gap-x-2 gap-y-7 sm:gap-x-6 sm:gap-y-10">
            {Array.from({ length: soO }, (_, i) => <OCho key={i} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
