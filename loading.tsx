/**
 * loading.tsx — Skeleton UI tự động hiển thị trong lúc Server Component
 * SubconManagementPage đang await getSubconDashboardData().
 *
 * Vì page dùng `force-dynamic` (query Supabase mỗi request), nếu không có
 * file này người dùng sẽ nhìn màn hình trắng trong lúc chờ dữ liệu.
 * Skeleton mô phỏng đúng layout thật (header → 3 metric cards → 3 forms → bảng)
 * để tránh layout-shift khi dữ liệu về.
 */
export default function SubconLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse" aria-busy="true" aria-label="Đang tải dữ liệu gia công...">
      {/* Header skeleton */}
      <div className="border-b border-slate-200 pb-5 space-y-2">
        <div className="h-7 w-2/5 rounded-lg bg-slate-200" />
        <div className="h-4 w-3/5 rounded bg-slate-100" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-3 w-1/2 rounded bg-slate-200" />
            <div className="h-8 w-1/4 rounded-lg bg-slate-200" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Forms skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="h-3 w-1/3 rounded bg-slate-100" />
                <div className="h-10 w-full rounded-lg bg-slate-100" />
              </div>
            ))}
            <div className="h-10 w-full rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="h-4 w-1/4 rounded bg-slate-200" />
        </div>
        <div className="p-5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 w-full rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
