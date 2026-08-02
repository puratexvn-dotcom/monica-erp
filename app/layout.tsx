import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
// 1. Import Provider ngôn ngữ
import { LanguageProvider } from "@/lib/i18n";

import { createClient } from "@/utils/supabase/server";
import { isRole, type Role } from "@/lib/rbac";
import { APP_NAME } from "@/lib/brand";
import AppBottomNav from "@/components/app-bottom-nav";
import type { ReportMetric } from "@/components/report-sheet";

const inter = Inter({ subsets: ["latin"] });

// Thẻ meta dùng tên NGẮN: đây là chữ trên tab trình duyệt, nơi chỉ hiện được
// khoảng 20 ký tự trước khi bị cắt bằng dấu ba chấm.
export const metadata: Metadata = {
  title: APP_NAME,
  description: "MONICA ONE — Hệ thống quản trị sản xuất ngành may",
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
};

// ============================================================================
// Đọc vai trò MỘT LẦN ở layout gốc rồi truyền xuống thanh điều hướng, thay vì
// để mỗi panel tự gọi Supabase.
//
// Layout gốc phải đọc cookie => toàn app render động. Đây là hệ quả bắt buộc
// khi muốn thanh điều hướng biết vai trò ở MỌI trang; các trang vốn đã
// force-dynamic từ trước nên không mất gì thêm.
// ============================================================================

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let role: Role | null = null;
  let reportMetrics: ReportMetric[] = [];

  // Lỗi ở đây không được làm sập cả ứng dụng: thiếu vai trò thì thanh điều
  // hướng vẫn hiện, nút "Bàn làm việc" chỉ dẫn về /login.
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const raw = user?.app_metadata?.role;
    if (isRole(raw)) role = raw;

    // Số liệu cho nút Báo cáo. Hiện chỉ làm cho MD/Giám đốc theo yêu cầu; các
    // bộ phận khác để rỗng và panel tự hiện trạng thái "chưa có số liệu" —
    // KHÔNG dựng số giả cho có, vì báo cáo bịa số thì tệ hơn không có báo cáo.
    if (role === 'md' || role === 'giamdoc') {
      const CLOSED = ['COMPLETED', 'CLOSED', 'CANCELLED', 'SHIPPED'];
      const [poRes, prodRes] = await Promise.allSettled([
        supabase.from('orders').select('status'),
        supabase.from('production_orders').select('status'),
      ]);

      const running =
        poRes.status === 'fulfilled' && !poRes.value.error
          ? (poRes.value.data ?? []).filter(
              (o) => !CLOSED.includes(String(o.status ?? '').toUpperCase()),
            ).length
          : null;

      const pendingProd =
        prodRes.status === 'fulfilled' && !prodRes.value.error
          ? (prodRes.value.data ?? []).filter(
              (p) => String(p.status ?? '').toUpperCase() === 'PENDING',
            ).length
          : null;

      const nf = new Intl.NumberFormat('vi-VN');
      reportMetrics = [
        {
          label: 'Tổng số PO đang chạy',
          value: running === null ? '—' : nf.format(running),
          unit: running === null ? undefined : 'PO',
        },
        {
          label: 'Lệnh sản xuất chờ xử lý',
          value: pendingProd === null ? '—' : nf.format(pendingProd),
          unit: pendingProd === null ? undefined : 'lệnh',
          tone: pendingProd && pendingProd > 0 ? 'amber' : 'emerald',
        },
      ];
    }
  } catch {
    role = null;
  }

  return (
    <html lang="vi">
      <body className={inter.className}>
        {/* 2. Bọc toàn bộ ứng dụng (children) bên trong LanguageProvider */}
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

          <AppBottomNav role={role} reportMetrics={reportMetrics} />

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
