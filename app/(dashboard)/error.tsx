'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy } from 'lucide-react';

// ============================================================================
// ERROR BOUNDARY CHO KHU VỰC DASHBOARD
//
// VÌ SAO PHẢI CÓ FILE NÀY:
// Trước đây cả ứng dụng chỉ có duy nhất app/error.tsx ở thư mục gốc. Bất kỳ lỗi
// nào trong một phân hệ đều bốc lên tận gốc và THAY THẾ TOÀN BỘ ứng dụng — mất
// luôn sidebar, mất luôn đường quay lại. Boundary đặt ở tầng (dashboard) giữ
// lỗi lại trong phạm vi khu vực này.
//
// VÀ VÌ SAO HIỆN CHI TIẾT LỖI:
// Bản cũ cố ý ẩn error.message với lý do bảo mật. Nhưng đây là ERP nội bộ, chỉ
// người đã đăng nhập mới vào được, mà ẩn sạch thông báo thì người vận hành chỉ
// thấy "Đã xảy ra sự cố" và không ai — kể cả người viết code — biết chuyện gì
// xảy ra. Hiện thông báo kỹ thuật kèm nút sao chép để báo lỗi cho IT nhanh hơn
// nhiều so với việc phải đi mò log.
// ============================================================================

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ghi ra console trình duyệt để lập trình viên thấy đầy đủ stack trace
    console.error('[Dashboard Error]', error);
  }, [error]);

  const detail = [
    `Thông báo: ${error.message || '(không có)'}`,
    error.digest ? `Mã lỗi (digest): ${error.digest}` : null,
    `Đường dẫn: ${typeof window !== 'undefined' ? window.location.pathname : ''}`,
    `Thời điểm: ${new Date().toLocaleString('vi-VN')}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Phân hệ này gặp lỗi và không tải được
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Các phân hệ khác vẫn hoạt động bình thường. Bấm “Thử lại” trước; nếu lỗi lặp lại, sao chép
              phần chi tiết bên dưới và gửi cho Quản trị hệ thống.
            </p>

            {/* Chi tiết kỹ thuật — thứ thực sự giúp chẩn đoán */}
            <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
              {detail}
            </pre>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Thử lại
              </button>

              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(detail)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Sao chép chi tiết lỗi
              </button>

              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Về trang chủ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
