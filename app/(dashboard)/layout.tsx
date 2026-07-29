import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Khung giao diện chung cho toàn bộ khu vực Dashboard */}
      <main className="w-full">{children}</main>

      {/*
        Toaster đặt ở layout để mọi module dùng chung một hàng đợi thông báo.
        richColors: xanh cho thành công, đỏ cho lỗi — người vận hành phân biệt
        kết quả mà không phải đọc hết chữ.
        closeButton: thông báo lỗi thường dài, phải cho đóng chủ động thay vì
        buộc chờ hết thời gian.
      */}
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </div>
  )
}
