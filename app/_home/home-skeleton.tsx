import { SO_O_TRANG_CHU } from '@/lib/mos/registry/business-apps';

// ============================================================================
// KHUNG CHỜ CỦA TRANG CHỦ
//
// ⚠️ Nó **⛔ không** phải một vòng xoay. Vòng xoay nói *"đang bận"*; khung này
// nói *"trang trông sẽ như thế này"* — và nhờ vậy khi nội dung thật về, **⛔
// không có cú nhảy bố cục**.
//
// 🔑 Kích thước ở đây phải **khớp** với `app-card.tsx`. Lệch một chút thì trang
//    **giật** đúng lúc người dùng vừa bắt đầu nhìn — và cú giật đó đắt hơn hẳn
//    vài trăm mili giây chờ.
//
// ⚠️ Ghi chú cũ ở dòng này ghi *"biểu tượng `68px` · `120px` từ `sm`"* — **SAI**,
// mã khi đó đã là `96/164`. Con số cứng viết trong ghi chú **luôn trôi khỏi mã**,
// nên Rev 6 bỏ hẳn: cả hai tệp nay dùng **cùng một công thức** thay vì cùng một
// con số — `w-full` · `aspect-square` · trần `max-w-[164px]`.
//
// 🔴 **HAI TỆP NÀY PHẢI SỬA CÙNG LÚC.** Rev 6 đổi lưới `4 → 3` cột ở điện thoại;
// quên tệp này thì khung chờ vẽ 4 cột rồi nội dung thật vẽ 3 — **cú nhảy bố cục
// toàn trang**, đúng thứ tệp này sinh ra để triệt.
//
// ⚠️ ⛔ KHÔNG bịa tên App vào đây. Ô xám ⛔ không nói dối; một tên App giả thì
// có — và nó sẽ nhấp nháy đổi thành tên khác khi dữ liệu thật về.
// ============================================================================

/** Một ô xám, đúng dáng ô thật. */
function OCho() {
  return (
    <div className="flex flex-col items-center p-2">
      <div className="aspect-square w-full max-w-[164px] animate-pulse rounded-[28%] bg-slate-200/70" />
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

          🔑 Số ô đọc từ `SO_O_TRANG_CHU` — thêm một Business App là khung
          chờ **tự dài ra**, ⛔ không ai phải nhớ sửa. */}
      {/* ⚠️ Chuỗi lớp này phải **giống hệt** lưới thật ở `home-content.tsx`.
          Đọc cả hai cạnh nhau trước khi sửa một bên. */}
      <div className="grid grid-cols-3 gap-x-2 gap-y-8 sm:gap-x-4 sm:gap-y-10 md:grid-cols-5">
        {Array.from({ length: SO_O_TRANG_CHU }, (_, i) => <OCho key={i} />)}
      </div>
    </div>
  );
}
