import { Card, PageHeader } from '@/components/ui';
import { listOrders } from './actions';
import OrdersClient from './orders-client';

// ============================================================================
// PHÂN HỆ MERCHANDISER — DANH SÁCH ĐƠN HÀNG (PO)
//
// Server Component: nạp dữ liệu lần đầu ngay tại máy chủ để bảng có nội dung ở
// khung hình đầu tiên, không phải chờ một vòng gọi API từ trình duyệt.
//
// ⚠️ KHÔNG truyền tham chiếu component (vd: icon={Package}) xuống client
// component. Hàm không serialize được qua ranh giới server/client và Next.js sẽ
// ném lỗi lúc render. Vì vậy dải KPI nằm trong ./orders-client.tsx, nơi icon
// được import trực tiếp ở phía client.
// ============================================================================

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const { rows, error } = await listOrders();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Quản lý Đơn hàng (PO)"
        desc="Theo dõi tiến độ đơn hàng từ lúc duyệt tới khi xuất container."
      />

      <OrdersClient initialRows={rows} initialError={error} />
    </div>
  );
}
