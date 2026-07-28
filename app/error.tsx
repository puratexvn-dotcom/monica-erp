'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Tùy chọn: Log lỗi vào hệ thống theo dõi (VD: Sentry)
    console.error('Lỗi khi tải trang hệ sinh thái ERP:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" strokeWidth={2} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Đã xảy ra sự cố
        </h2>
        <p className="text-sm text-slate-500 font-medium mb-8">
          Không thể tải danh sách phân hệ lúc này. Vui lòng thử lại hoặc liên hệ quản trị viên IT.
        </p>

        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors active:scale-[0.98]"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Thử tải lại trang</span>
        </button>
      </div>
    </div>
  );
}