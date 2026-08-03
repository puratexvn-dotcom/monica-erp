import Image from 'next/image';

import { LOGO_SRC, LOGO_ALT } from '@/lib/brand';
import { TYPE } from '@/lib/design/typography';
import { CANVAS } from '@/lib/design/tokens';

// ============================================================================
// TRANG MẤT KẾT NỐI
//
// Service worker trả về trang này khi mạng chết giữa lúc điều hướng.
//
// ⚠️ KHÔNG có một con số nghiệp vụ nào ở đây, và đó là điều quan trọng nhất
// của trang. Trong nhà máy, một con số cũ trông y hệt một con số mới — người
// đọc không có cách nào phân biệt. Thà nói thẳng là đang mất mạng còn hơn bày
// ra dữ liệu lần cuối rồi để ai đó quyết định dựa trên nó.
//
// ⚠️ Trang này bị service worker đệm lại, nên nó phải TĨNH HOÀN TOÀN: không
// đọc phiên đăng nhập, không gọi cơ sở dữ liệu, không đa ngôn ngữ theo phiên.
// Chữ để tiếng Việt vì đây là ngôn ngữ mặc định của hệ thống — bản đệm không
// biết người dùng đã chọn thứ tiếng nào.
// ============================================================================

export const metadata = { title: 'Mất kết nối' };

export default function OfflinePage() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center px-6 text-center ${CANVAS}`}
    >
      <div className="relative mb-8 h-16 w-52 opacity-40 grayscale">
        <Image src={LOGO_SRC} alt={LOGO_ALT} fill sizes="208px" className="object-contain" priority />
      </div>

      <h1 className={`${TYPE.pageTitle} text-slate-800`}>Mất kết nối mạng</h1>

      <p className={`${TYPE.body} mt-3 max-w-sm text-slate-600`}>
        Thiết bị hiện không kết nối được máy chủ. Kiểm tra đường truyền rồi thử lại.
      </p>

      <p className={`${TYPE.bodySm} mt-6 max-w-sm text-slate-500`}>
        Số liệu vận hành không được lưu trên máy, nên màn hình này không hiển thị dữ liệu cũ —
        một con số cũ trông y hệt một con số mới.
      </p>
    </main>
  );
}
