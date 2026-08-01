import { AccessDenied } from '@/components/ui';

import { guard } from '../_services/guard';
import AssignmentsClient from './assignments-client';

// ============================================================================
// MÀN HÌNH PHẦN VIỆC — SERVER COMPONENT
//
// ─── VÌ SAO KHÔNG NẠP DỮ LIỆU Ở ĐÂY ──────────────────────────────────────
// Chuẩn UI mục 9 nói `page.tsx` nạp dữ liệu lần đầu bằng `Promise.allSettled`.
// Màn hình này CỐ Ý làm khác, và lý do rất cụ thể: nhánh `/md/assignments` chạy
// React Query (quyết định Kiến trúc sư), nên dữ liệu nạp qua hook và nằm trong
// bộ nhớ đệm dùng chung.
//
// Nạp thêm ở đây sẽ thành HAI nguồn cho cùng một dữ liệu: bản do máy chủ dựng và
// bản trong bộ nhớ đệm. Sau lần ghi đầu tiên, `invalidate` chỉ làm mới bản thứ
// hai — và màn hình hiện số cũ do máy chủ dựng cho tới khi tải lại trang.
//
// ⚠️ Nhưng `guard()` VẪN chạy ở đây. Không phải để lấy dữ liệu mà để chặn ngay
// ở cửa: hiện khung màn hình rồi mới báo "không có quyền" là để lộ cả bố cục
// nghiệp vụ cho người không được vào. Đây là lớp ĐẦU; mỗi service vẫn tự chốt
// quyền lần nữa (chuẩn UI 7.2 — Server Action là điểm vào gọi thẳng được).
// ============================================================================

export default async function AssignmentsPage() {
  const g = await guard();
  if (!g.supabase) return <AccessDenied />;

  return <AssignmentsClient />;
}
