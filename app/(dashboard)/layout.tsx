// ============================================================================
// KHUNG CHUNG KHU VỰC DASHBOARD
//
// Thanh điều hướng 4 nút, Toaster và các sheet (Chat / Báo cáo / A.I) đã chuyển
// lên app/layout.tsx để dùng chung cho MỌI trang, kể cả trang chủ nằm ngoài
// group (dashboard) này. Để lại ở đây sẽ ra hai thanh điều hướng và hai hàng
// đợi thông báo chồng nhau.
//
// Phần chừa chỗ cho thanh cố định (pb-16) cũng đã làm ở layout gốc.
// ============================================================================

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="w-full">{children}</main>
    </div>
  );
}
