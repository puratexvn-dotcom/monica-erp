'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa thông qua localStorage
    const userSession = localStorage.getItem('monica_user');
    if (!userSession) {
      // Nếu chưa có phiên đăng nhập, lập tức đá về trang login
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Khung nội dung chính của các phân hệ */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}