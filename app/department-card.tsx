'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  icon: LucideIcon;
  desc: string;
  path: string;
}

interface DepartmentCardProps {
  department: Department;
  onClick: (path: string) => void;
}

export default function DepartmentCard({ department, onClick }: DepartmentCardProps) {
  const IconComponent = department.icon;

  return (
    <button
      onClick={() => onClick(department.path)}
      className="group relative flex flex-col justify-between p-6 bg-white rounded-[24px] border border-slate-200/50 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 ease-out text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-50"
    >
      <div>
        {/* Icon Wrapper */}
        <div className="w-14 h-14 bg-slate-50 group-hover:bg-blue-600 text-slate-600 group-hover:text-white rounded-[18px] flex items-center justify-center mb-5 transition-all duration-300 shadow-sm group-hover:shadow-blue-600/30">
          <IconComponent className="w-7 h-7" strokeWidth={1.75} />
        </div>
        
        {/* Content */}
        <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-blue-700 transition-colors duration-300">
          {department.name}
        </h3>
        <p className="text-[13px] text-slate-500 font-medium mt-1.5 leading-relaxed line-clamp-2">
          {department.desc}
        </p>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[13px] font-semibold text-blue-600">
        <span>Truy cập</span>
        <div className="w-7 h-7 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
          <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
        </div>
      </div>
    </button>
  );
}