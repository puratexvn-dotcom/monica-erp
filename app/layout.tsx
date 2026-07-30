import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
// 1. Import Provider ngôn ngữ
import { LanguageProvider } from "@/lib/i18n";

import { createClient } from "@/utils/supabase/server";
import { isRole, type Role } from "@/lib/rbac";
import AppBottomNav from "@/components/app-bottom-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Monica Garment ERP",
  description: "Hệ thống quản trị sản xuất ngành may",
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

  // Lỗi ở đây không được làm sập cả ứng dụng: thiếu vai trò thì thanh điều
  // hướng vẫn hiện, nút "Bàn làm việc" chỉ dẫn về /login.
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const raw = user?.app_metadata?.role;
    if (isRole(raw)) role = raw;
  } catch {
    role = null;
  }

  return (
    <html lang="vi">
      <body className={inter.className}>
        {/* 2. Bọc toàn bộ ứng dụng (children) bên trong LanguageProvider */}
        <LanguageProvider>
          {/* pb-16: chừa chỗ cho thanh điều hướng cố định, nếu không nội dung
              cuối trang bị thanh đó che mất */}
          <div className="pb-16">{children}</div>

          <AppBottomNav role={role} />

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
