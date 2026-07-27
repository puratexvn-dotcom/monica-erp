'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, Briefcase, Building2, Calculator, Box, 
  ShieldCheck, Scissors, Shirt, Package, Users, UserCog 
} from 'lucide-react';

// Danh sách khớp chuẩn 100% với tên thư mục thực tế trong (dashboard)
const DEPARTMENTS = [
  { id: 'giam-doc', name: 'Ban Giám Đốc', icon: BarChart3, desc: 'Báo cáo tổng quan & Phê duyệt', path: 'giam-doc' },
  { id: 'md', name: 'Merchandiser (MD)', icon: Briefcase, desc: 'Quản lý đơn hàng & Tiến độ', path: 'md' },
  { id: 'buyer', name: 'Buyer', icon: Building2, desc: 'Quản lý Vật tư & Mua hàng', path: 'buyer' },
  { id: 'ke-toan', name: 'Kế Toán', icon: Calculator, desc: 'Công nợ & Thanh toán', path: 'ke-toan' },
  { id: 'kho', name: 'Quản Lý Kho', icon: Box, desc: 'Xuất/Nhập & Tồn kho', path: 'kho' },
  { id: 'qa', name: 'QA / QC', icon: ShieldCheck, desc: 'Kiểm soát chất lượng', path: 'qa' },
  { id: 'to-truong-cat', name: 'Tổ Trưởng Cắt', icon: Scissors, desc: 'Sản lượng cắt & BTP', path: 'to-truong-cat' },
  { id: 'to-truong-may', name: 'Tổ Trưởng May', icon: Shirt, desc: 'Sản lượng chuyên may', path: 'to-truong-may' },
  { id: 'to-truong-hoan-thanh', name: 'Tổ Hoàn Thành', icon: Package, desc: 'Ủi, Đóng gói & Xuất hàng', path: 'to-truong-hoan-thanh' },
  { id: 'subcon', name: 'Trạm Subcon', icon: Users, desc: 'Cổng báo cáo Xưởng gia công', path: 'subcon' },
  { id: 'admin', name: 'Quản Trị Hệ Thống', icon: UserCog, desc: 'Cài đặt & Phân quyền', path: 'admin' },
];

export default function HomePage() {
  const router = useRouter();

  const handleSelectDepartment = (path: string) => {
    // Trỏ thẳng trực tiếp vào đúng đường dẫn dashboard phân hệ
    router.push(`/${path}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="text-center max-w-3xl mb-12">
        <div className="mx-auto w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/20">
          <Shirt className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          Hệ sinh thái MONICA ERP
        </h1>
        <p className="text-base text-slate-600 font-medium">
          Vui lòng chọn phân hệ làm việc của bạn để vào không gian quản trị.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 max-w-7xl w-full">
        {DEPARTMENTS.map((dept) => {
          const IconComponent = dept.icon;
          return (
            <div 
              key={dept.id}
              onClick={() => handleSelectDepartment(dept.path)}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {dept.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>Truy cập ngay</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}