'use client'

/**
 * error.tsx — Error Boundary cho phân hệ Gia Công.
 *
 * Bắt mọi lỗi throw từ Server Component (vd: getSubconDashboardData() fail do
 * mất kết nối Supabase, RLS chặn quyền, timeout...) thay vì để user thấy
 * màn hình lỗi mặc định của Next.js (hoặc crash trắng trang ở production).
 *
 * Lưu ý bảo mật: KHÔNG hiển thị error.message thô ra UI ở production —
 * message từ Supabase/Postgres có thể lộ tên bảng, cấu trúc query.
 * Chỉ hiển thị digest để đối chiếu server log.
 */
import { useEffect } from 'react'

export default function SubconError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Gửi về hệ thống monitoring nếu có (Sentry, Axiom...). Tạm thời log console.
    console.error('[Subcon Module Error]', error)
  }, [error])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-rose-200 bg-rose-50/50 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Không thể tải dữ liệu Phân hệ Gia Công</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-md">
            Đã xảy ra lỗi khi kết nối máy chủ dữ liệu. Vui lòng thử lại — nếu lỗi lặp lại,
            liên hệ quản trị hệ thống kèm mã lỗi bên dưới.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-slate-400">Mã lỗi: {error.digest}</p>
          )}
        </div>
        <button
          onClick={reset}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          ↻ Thử tải lại
        </button>
      </div>
    </div>
  )
}
