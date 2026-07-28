'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, Briefcase, Building2, Calculator, Box, 
  ShieldCheck, Scissors, Shirt, Package, Users, UserCog 
} from 'lucide-react';

// Import component đã tách (điều chỉnh đường dẫn import phù hợp với dự án của bạn)
import DepartmentCard from './department-card'; 

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
    router.push(`/${path}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8 selection:bg-blue-200">
      
      {/* Header Section */}
      <div className="text-center max-w-3xl mb-14">
        <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-blue-600 to-blue-500 text-white rounded-[24px] flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25 ring-4 ring-blue-50">
          <Shirt className="w-10 h-10" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Hệ sinh thái <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">MONICA ERP</span>
        </h1>
        <p className="text-[15px] text-slate-500 font-medium max-w-xl mx-auto">
          Lựa chọn phân hệ làm việc chuyên trách của bạn để truy cập vào không gian quản trị dữ liệu.
        </p>
      </div>

      {/* Grid Layout Tối Ưu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 max-w-[1200px] w-full">
        {DEPARTMENTS.map((dept) => (
          <DepartmentCard 
            key={dept.id} 
            department={dept} 
            onClick={handleSelectDepartment} 
          />
        ))}
      </div>
    </div>
  );
}