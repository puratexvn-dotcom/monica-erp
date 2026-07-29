import Image from "next/image";
import Link from "next/link";
import {
  BarChart,
  Briefcase,
  Building,
  Calculator,
  Package,
  Archive,
  ShieldCheck,
  Scissors,
  Shirt,
  Box,
  Users,
  Settings,
  ArrowRight
} from "lucide-react";

// ==========================================
// 1. DỮ LIỆU CẤU HÌNH (DATA CONFIGURATION)
// Tách biệt dữ liệu khỏi giao diện để dễ bảo trì
// ==========================================
const modules = [
  { id: 1, name: "Ban Giám Đốc", desc: "Báo cáo tổng quan & Phê duyệt", href: "/giam-doc", icon: BarChart, color: "text-monica-pink", bg: "bg-pink-50" },
  { id: 2, name: "Merchandiser (MD)", desc: "Quản lý đơn hàng & Tiến độ", href: "/md", icon: Briefcase, color: "text-monica-cyan", bg: "bg-cyan-50" },
  { id: 3, name: "Buyer", desc: "Quản lý Vật tư & Mua hàng", href: "/buyer", icon: Building, color: "text-monica-green", bg: "bg-green-50" },
  { id: 4, name: "Kế Toán", desc: "Công nợ & Thanh toán", href: "/ke-toan", icon: Calculator, color: "text-monica-blue", bg: "bg-blue-50" },
  { id: 5, name: "Kho Vật Tư", desc: "Xuất/Nhập & Tồn kho NPL", href: "/kho", icon: Package, color: "text-monica-yellow", bg: "bg-yellow-50" },
  { id: 6, name: "Kho Thành Phẩm", desc: "Quản lý thành phẩm (FG)", href: "/xuat-hang", icon: Archive, color: "text-monica-red", bg: "bg-red-50" },
  { id: 7, name: "QA / QC", desc: "Kiểm soát chất lượng", href: "/qa", icon: ShieldCheck, color: "text-monica-pink", bg: "bg-pink-50" },
  { id: 8, name: "Tổ Trưởng Cắt", desc: "Sản lượng cắt & BTP", href: "/to-truong-cat", icon: Scissors, color: "text-monica-cyan", bg: "bg-cyan-50" },
  { id: 9, name: "Tổ Trưởng May", desc: "Sản lượng chuyền may", href: "/to-truong-may", icon: Shirt, color: "text-monica-green", bg: "bg-green-50" },
  { id: 10, name: "Tổ Hoàn Thành", desc: "Ủi, Đóng gói & Xuất hàng", href: "/hoan-thanh", icon: Box, color: "text-monica-blue", bg: "bg-blue-50" },
  { id: 11, name: "Trạm Subcon", desc: "Cổng báo cáo Xưởng gia công", href: "/subcon", icon: Users, color: "text-monica-yellow", bg: "bg-yellow-50" },
  { id: 12, name: "Quản Trị Hệ Thống", desc: "Cài đặt & Phân quyền", href: "/admin", icon: Settings, color: "text-monica-red", bg: "bg-red-50" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* ==========================================
          HEADER: LOGO & CHÀO MỪNG
          ========================================== */}
      <header className="flex flex-col items-center justify-center pt-20 pb-10 px-4 text-center">
        <div className="relative w-72 h-24 mb-6">
          <Image
            src="/monica-logo.jpg"
            alt="Monica ERP Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
          Hệ sinh thái <span className="text-monica-blue">MONICA ERP</span>
        </h1>
        <p className="text-slate-500 max-w-lg text-lg">
          Lựa chọn phân hệ làm việc chuyên trách của bạn để truy cập vào không gian quản trị dữ liệu.
        </p>
      </header>

      {/* ==========================================
          MAIN: LƯỚI MODULE (LAUNCHPAD)
          ========================================== */}
      <main className="flex-grow max-w-7xl mx-auto px-4 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((mod) => {
            const IconComponent = mod.icon;
            return (
              <Link href={mod.href} key={mod.id} className="group">
                <div className="bg-white rounded-2xl p-6 h-full border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1">
                  <div>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${mod.bg}`}>
                      <IconComponent className={`w-7 h-7 ${mod.color}`} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-monica-blue transition-colors">
                      {mod.name}
                    </h2>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                  <div className="flex items-center text-sm font-bold text-monica-blue">
                    <span>Truy cập</span>
                    <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* ==========================================
          FOOTER: BẢN QUYỀN JOSEPH
          ========================================== */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center mt-auto">
        <p className="text-base text-slate-600 font-medium mb-1">
          Thiết kế và bản quyền thuộc <span className="text-slate-900 font-extrabold uppercase tracking-wide">Joseph</span>
        </p>
        <p className="text-sm text-slate-400">
          Hotline Hỗ Trợ: <a href="tel:0908779585" className="hover:text-monica-blue transition-colors font-semibold">0908779585</a>
        </p>
      </footer>
      
    </div>
  );
}