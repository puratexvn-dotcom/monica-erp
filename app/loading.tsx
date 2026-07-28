'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8">
      
      {/* Skeleton Header */}
      <div className="text-center max-w-3xl mb-14 flex flex-col items-center w-full">
        <div className="w-20 h-20 bg-slate-200 animate-pulse rounded-[24px] mb-6"></div>
        <div className="h-10 w-3/4 sm:w-96 bg-slate-200 animate-pulse rounded-full mb-4"></div>
        <div className="h-5 w-2/3 sm:w-80 bg-slate-200 animate-pulse rounded-full"></div>
      </div>

      {/* Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 max-w-[1200px] w-full">
        {Array.from({ length: 11 }).map((_, i) => (
          <div 
            key={i} 
            className="flex flex-col justify-between p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm min-h-[220px]"
          >
            <div>
              <div className="w-14 h-14 bg-slate-100 animate-pulse rounded-[18px] mb-5"></div>
              <div className="h-5 w-2/3 bg-slate-100 animate-pulse rounded-full mb-3"></div>
              <div className="h-4 w-full bg-slate-50 animate-pulse rounded-full mb-2"></div>
              <div className="h-4 w-4/5 bg-slate-50 animate-pulse rounded-full"></div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="h-4 w-20 bg-slate-100 animate-pulse rounded-full"></div>
              <div className="w-7 h-7 bg-slate-100 animate-pulse rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}