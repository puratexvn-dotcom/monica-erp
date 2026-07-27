export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Khung giao diện chung cho toàn bộ khu vực Dashboard */}
      <main className="w-full">{children}</main>
    </div>
  )
}