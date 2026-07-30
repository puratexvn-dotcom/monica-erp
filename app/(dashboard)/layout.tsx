import { Toaster } from 'sonner';

import { createClient } from '@/utils/supabase/server';
import { isRole, type Role } from '@/lib/rbac';
import BottomNav from '@/components/bottom-nav';
import ChatDrawer from '@/components/chat-drawer';

// ============================================================================
// KHUNG CHUNG KHU VỰC DASHBOARD
//
// Đọc vai trò MỘT LẦN ở đây rồi truyền xuống, thay vì để BottomNav và
// ChatDrawer mỗi cái tự gọi Supabase — hai lời gọi mạng cho cùng một thông tin.
//
// Vai trò lấy từ app_metadata (xem lib/rbac.ts): user_metadata do chính người
// dùng sửa được nên không dùng làm căn cứ phân quyền.
// ============================================================================

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let role: Role | null = null;

  // Lỗi ở đây KHÔNG được phép làm sập cả khu vực dashboard: thiếu vai trò thì
  // chỉ ẩn thanh điều hướng đáy và khung chat, các trang vẫn dùng bình thường
  // (middleware đã lo phần chặn quyền).
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
    <div className="min-h-screen bg-slate-50">
      {/* pb-20 trên mobile: chừa chỗ cho thanh điều hướng đáy, nếu không nội
          dung cuối trang bị thanh đó che mất */}
      <main className="w-full pb-20 lg:pb-0">{children}</main>

      <BottomNav role={role} />
      <ChatDrawer role={role} />

      {/*
        Toaster đặt ở layout để mọi module dùng chung một hàng đợi thông báo.
        richColors: xanh cho thành công, đỏ cho lỗi — người vận hành phân biệt
        kết quả mà không phải đọc hết chữ.
        closeButton: thông báo lỗi thường dài, phải cho đóng chủ động thay vì
        buộc chờ hết thời gian.
      */}
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </div>
  );
}
