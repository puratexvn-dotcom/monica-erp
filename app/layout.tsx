import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. Import Provider ngôn ngữ
import { LanguageProvider } from "@/lib/i18n"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Monica Garment ERP",
  description: "Hệ thống quản trị sản xuất ngành may",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {/* 2. Bọc toàn bộ ứng dụng (children) bên trong LanguageProvider */}
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}