// app/(dashboard)/subcon/loading.tsx
import { Loader2 } from "lucide-react";

export default function SubconLoading() {
  return (
    <div className="min-h-screen p-8 bg-[#F8FAFC]">
      {/* Phần Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Phần Bảng Dữ liệu Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-center py-20 flex-col gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Đang đồng bộ dữ liệu từ máy chủ...
          </p>
        </div>
      </div>
    </div>
  );
}