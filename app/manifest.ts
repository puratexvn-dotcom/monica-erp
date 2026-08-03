import type { MetadataRoute } from 'next';

import { APP_NAME } from '@/lib/brand';

// ============================================================================
// WEB APP MANIFEST — Next.js App Router sinh ra /manifest.webmanifest
//
// ⚠️ Đặt ở `app/manifest.ts` chứ không phải một tệp tĩnh trong `public/`:
// làm vậy thì tên ứng dụng lấy thẳng từ `lib/brand.ts`, không thể lệch với
// phần còn lại của hệ thống. Đổi tên sản phẩm chỉ sửa một chỗ.
// ============================================================================

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: `${APP_NAME} — Business Operating System`,
    short_name: APP_NAME,
    description:
      'Nền tảng vận hành hợp nhất cho ngành may: đơn hàng, sản xuất, chất lượng, kho và xuất hàng trên một hệ thống duy nhất.',

    // `standalone`: mở từ màn hình chính thì KHÔNG còn thanh địa chỉ và nút
    // điều hướng của trình duyệt — đó là toàn bộ khác biệt giữa "một trang
    // web đã lưu" và "một ứng dụng".
    display: 'standalone',
    // Chuỗi dự phòng cho trình duyệt chưa hiểu `standalone`.
    display_override: ['standalone', 'minimal-ui'],

    // ⚠️ `any` chứ không khoá `portrait`. Người vận hành hay đặt máy tính bảng
    // nằm ngang ở chuyền; khoá dọc là ép họ xoay máy mỗi lần mở app.
    orientation: 'any',

    start_url: '/',
    // `scope` bao cả site: bấm vào một Business App vẫn ở TRONG ứng dụng.
    // Thu hẹp scope sẽ khiến mọi liên kết ngoài phạm vi bật ra trình duyệt,
    // tức người dùng rơi khỏi app ngay ở cú chạm đầu tiên.
    scope: '/',

    lang: 'vi',
    dir: 'ltr',
    categories: ['business', 'productivity', 'utilities'],

    // Trắng cho cả hai: nền trang là #F6F7F9 nhưng màn hình khởi động dùng
    // trắng để khớp ảnh khởi động iOS và nền của chính logo.
    theme_color: '#FFFFFF',
    background_color: '#FFFFFF',

    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // ⚠️ `maskable` PHẢI là tệp riêng, không dùng lại tệp `any`. Android cắt
      // icon maskable theo hình của từng hãng máy; logo trong tệp `any` chiếm
      // 88% khung nên sẽ bị xén mất chữ đầu và chữ cuối. Tệp maskable để logo
      // ở 62% nên nằm gọn trong vùng an toàn.
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],

    // Menu ngữ cảnh khi nhấn giữ biểu tượng ứng dụng. Chỉ đưa vào những lối
    // vào ĐÃ CÓ route thật — lối tắt dẫn tới 404 còn tệ hơn không có lối tắt.
    shortcuts: [
      {
        name: 'Merchandising',
        short_name: 'Merchandising',
        description: 'Mã hàng, định mức và điều phối đơn',
        url: '/md',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Production',
        short_name: 'Production',
        description: 'Tổ cắt, chuyền may và sản lượng giờ',
        url: '/to-truong-may',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Warehouse',
        short_name: 'Warehouse',
        description: 'Nhập, xuất, kiểm kê và tồn kho',
        url: '/kho',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Quality',
        short_name: 'Quality',
        description: 'Kiểm hàng AQL 2.5 và khắc phục lỗi',
        url: '/qa',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
