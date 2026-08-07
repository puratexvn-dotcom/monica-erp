import type { Metadata, Viewport } from "next";
import { Suspense } from 'react';

import BottomNavData from './_shell/bottom-nav-data';
// ─── BỘ CHỮ — GIAI ĐOẠN 1 CỦA TD-10 ────────────────────────────────────────
//
// Board chốt **Inter Variable, tự lưu trữ qua `next/font/local`**. Kho hiện
// CHƯA có tệp `InterVariable.woff2`, nên giai đoạn này vẫn nạp qua
// `next/font/google` — cùng bộ chữ, khác nguồn.
//
// ⚠️ Điểm mấu chốt: phông được phơi ra bằng **biến CSS** `--font-sans` chứ
// không bằng `inter.className`. Nhờ vậy Giai đoạn 2 chỉ đổi ĐÚNG BA DÒNG ở
// đây — `import` và lời gọi — còn `tailwind.config.ts`,
// `lib/design/typography.ts` và toàn bộ màn hình **không phải đụng tới**.
// Đó chính là yêu cầu của Board: chuyển nguồn phông mà kiến trúc thẻ giữ
// nguyên.
//
// Giai đoạn 2 sẽ thành:
//   import localFont from 'next/font/local';
//   const sans = localFont({
//     src: './fonts/InterVariable.woff2',
//     variable: '--font-sans', display: 'swap',
//   });
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
// 1. Import Provider ngôn ngữ
import { LanguageProvider } from "@/lib/i18n";

import { createClient } from "@/utils/supabase/server";
import { isRole, type Role } from "@/lib/rbac";
import { APP_NAME } from "@/lib/brand";
import AppBottomNav from "@/components/app-bottom-nav";
import PwaRegister from "@/components/pwa-register";
import type { ReportMetric } from "@/components/report-sheet";

const inter = Inter({
  subsets: ["latin"],
  // `variable` thay cho `className`: phông đi vào CSS qua biến, nên
  // `tailwind.config.ts` trỏ `font-sans` vào đúng một chỗ và không cần biết
  // phông đến từ Google hay từ tệp cục bộ.
  variable: "--font-sans",
  // `swap`: hiện ngay bằng phông dự phòng rồi đổi khi phông thật tải xong.
  // Mặc định `block` sẽ giấu chữ tới 3 giây — trên mạng xưởng đó là ba giây
  // màn hình trắng.
  display: "swap",
});

// Thẻ meta dùng tên NGẮN: đây là chữ trên tab trình duyệt, nơi chỉ hiện được
// khoảng 20 ký tự trước khi bị cắt bằng dấu ba chấm.
export const metadata: Metadata = {
  title: APP_NAME,
  description: "MONICA ONE — Hệ thống quản trị sản xuất ngành may",

  // ═══ ĐÓNG GÓI THÀNH ỨNG DỤNG ═══════════════════════════════════════════
  // ⚠️ ĐÂY LÀ PHẦN QUYẾT ĐỊNH iPhone HIỆN LOGO HAY HIỆN CHỮ CÁI MẶC ĐỊNH.
  // Thiếu `apple` icon thì Safari tự dựng một ô vuông trắng có chữ "M" — và
  // đó chính xác là thứ đề bài yêu cầu phải loại bỏ.
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // Safari CHỈ đọc `apple-touch-icon`. Nó không hiểu manifest icons.
    apple: [{ url: "/icons/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico" }],
    other: [
      { rel: "mask-icon", url: "/icons/icon-192.png" },
      // Windows ghim lối tắt lên Start
      { rel: "msapplication-TileImage", url: "/icons/icon-192.png" },
    ],
  },

  appleWebApp: {
    // `capable` là thứ bỏ thanh địa chỉ khi mở từ Màn hình chính trên iOS.
    capable: true,
    title: APP_NAME,
    // `default` giữ thanh trạng thái trắng chữ đen — khớp nền trắng của app.
    // `black-translucent` sẽ để nội dung chui lên dưới đồng hồ và pin.
    statusBarStyle: "default",
    // iOS KHÔNG dùng `background_color` của manifest. Thiếu ảnh khởi động thì
    // mở app sẽ thấy khung trắng trống trơn cho tới khi trang vẽ xong.
    startupImage: [
      { url: "/icons/splash-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/icons/splash-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/icons/splash-1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/icons/splash-1125x2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/icons/splash-828x1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/icons/splash-1536x2048.png", media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" },
    ],
  },

  formatDetection: {
    // Tắt tự động biến chuỗi số thành liên kết gọi điện: mã PO và mã cuộn vải
    // toàn số, iOS sẽ tô xanh và biến chúng thành nút gọi.
    telephone: false,
  },

  other: {
    "msapplication-TileColor": "#FFFFFF",
    "mobile-web-app-capable": "yes",
  },
};

// ============================================================================
// KHOÁ HÀNH VI PHÓNG TO TỰ DO TRÊN DI ĐỘNG
//
// Next.js tự chèn sẵn width=device-width, initial-scale=1 nhưng KHÔNG khoá
// phóng to. Hệ quả trên xưởng: một khối tràn nhẹ là Safari/Chrome thu nhỏ cả
// trang, người dùng phải tự chụm tay phóng lại mỗi lần mở panel.
//
// viewportFit: 'cover' để trang dùng hết phần màn hình dưới tai thỏ; phần chừa
// an toàn đã xử lý bằng env(safe-area-inset-bottom) ở thanh điều hướng.
//
// ⚠️ ĐÁNH ĐỔI ĐÃ BIẾT: khoá phóng to là đi ngược tiêu chí WCAG 1.4.4 (người
// dùng phải phóng được tới 200%). Chấp nhận vì đây là ứng dụng nội bộ nhà máy
// và cỡ chữ nhỏ nhất trong hệ thống đã là 10px ở nhãn thanh điều hướng, còn
// nội dung nghiệp vụ đều từ 12px trở lên. iOS từ bản 10 cũng bỏ qua
// user-scalable=no, nên trên iPhone người dùng VẪN phóng to được.
// ============================================================================
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Màu thanh trạng thái Android và thanh tiêu đề cửa sổ ứng dụng trên máy tính.
  themeColor: "#FFFFFF",
};

// ============================================================================
// Đọc vai trò MỘT LẦN ở layout gốc rồi truyền xuống thanh điều hướng, thay vì
// để mỗi panel tự gọi Supabase.
//
// Layout gốc phải đọc cookie => toàn app render động. Đây là hệ quả bắt buộc
// khi muốn thanh điều hướng biết vai trò ở MỌI trang; các trang vốn đã
// force-dynamic từ trước nên không mất gì thêm.
// ============================================================================

// ============================================================================
// 🔴 LAYOUT GỐC TRỞ LẠI ĐỒNG BỘ — 07/08/2026, sửa sau khi ĐO.
//
// Trước bản này hàm dưới đây là `async` và bên trong nó `await` một lượt gọi
// Auth **cùng hai truy vấn CSDL**. Layout gốc `await` thì React ⛔ **không có
// gì để gửi đi** — nên **từng byte HTML của MỌI trang** xếp hàng sau chúng.
//
// Đo bằng `curl` ngay trên máy chủ: `ttfb 0,026 s` khi ⛔ không có cookie phiên
// ⟷ **`0,426 – 0,720 s`** khi có. Và `time_starttransfer == time_total` — máy
// chủ giữ **toàn bộ** trang, ⛔ không stream byte nào.
//
// 🔑 `<Suspense>` ở `app/page.tsx` **vô tác dụng** với thứ chặn nằm ở layout
// gốc — nó ở **phía trên** ranh giới đó. Đây là lý do vòng tối ưu trước ⛔
// không giải quyết được: tôi đã bọc đúng chỗ, nhưng ⛔ không phải chỗ chặn.
//
// ⇒ Phần cần dữ liệu dời sang `app/_shell/bottom-nav-data.tsx`, bọc `<Suspense>`.
// ============================================================================
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `inter.variable` đặt biến `--font-sans` lên thẻ gốc; `font-sans` của
    // Tailwind đọc biến đó. Đổi nguồn phông ở Giai đoạn 2 không chạm dòng này.
    <html lang="vi" className={inter.variable}>
      <body className="font-sans">
        {/* 2. Bọc toàn bộ ứng dụng (children) bên trong LanguageProvider */}
        <PwaRegister />
        <LanguageProvider>
          {/* Chừa chỗ cho thanh điều hướng cố định (nay cao h-14 = 56px).
              pb-20 = 80px, dư 24px làm khoảng thở: chừa đúng bằng chiều cao
              thanh thì dòng nội dung cuối cùng dính sát mép trên của thanh.

              Cố ý chừa CỐ ĐỊNH chứ không bám --nav-h: thanh tự ẩn khi cuộn
              xuống, nếu phần chừa cũng co theo thì mỗi lần ẩn/hiện trang lại
              co giãn và nhảy vị trí đọc.

              Phần chừa nằm ở ĐÂY chứ không trong từng trang — mọi trang dùng
              chung một thanh thì cũng chỉ chừa một lần; chừa hai lần sẽ ra một
              khoảng trắng gấp đôi ở cuối trang. */}
          <div className="pb-20">{children}</div>

          {/* 🔑 Bọc `<Suspense>`: khung trang bay đi NGAY, thanh dưới điền vào
              sau. `fallback` là một khối cao đúng bằng thanh thật — ⛔ để trống
              thì nội dung nhảy vị trí lúc thanh xuất hiện. */}
          <Suspense fallback={<div className="h-14" aria-hidden="true" />}>
            <BottomNavData />
          </Suspense>

          {/*
            Toaster đặt ở layout gốc để mọi trang dùng chung một hàng đợi.
            richColors: xanh cho thành công, đỏ cho lỗi.
            closeButton: thông báo lỗi thường dài, phải cho đóng chủ động.
          */}
          <Toaster position="top-right" richColors closeButton duration={4000} />
        </LanguageProvider>
      </body>
    </html>
  );
}
