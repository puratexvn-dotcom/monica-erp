import { PageHeader } from '@/components/ui';

import { listOrders } from '../orders/actions';
import { loadMdSnapshot, type MdSnapshot } from './md-actions';
import MdClient from './md-client';
import type { PoOption } from './md-types';

// ============================================================================
// BÀN LÀM VIỆC MERCHANDISER
//
// Trung tâm điều phối: khách hàng -> PO -> đề nghị mua NPL -> lệnh sản xuất ->
// lệnh giao hàng. PO gộp hẳn vào đây, không còn là phân hệ độc lập trên trang
// chủ (trang chủ giữ đúng 12 nút).
//
// Server Component nạp dữ liệu lần đầu để bảng có nội dung ở khung hình đầu
// tiên, không phải chờ một vòng gọi API từ trình duyệt.
//
// ⚠️ KHÔNG truyền tham chiếu component (icon={...}) xuống client: hàm không
// serialize được qua ranh giới server/client. Icon nằm trong md-client.tsx.
//
// Màn hình MD cũ (BOM / tiến độ mẫu / costing) được giữ ở ./md-legacy-client.tsx,
// hiện chưa gắn vào route nào.
// ============================================================================

export const dynamic = 'force-dynamic';

export default async function MerchandiserPage() {
  // allSettled: một truy vấn lỗi không được kéo cả trang sang error boundary.
  // Mỗi nhóm dữ liệu tự báo lỗi của riêng nó, phần còn lại vẫn dùng được.
  const [snapRes, poRes] = await Promise.allSettled([loadMdSnapshot(), listOrders()]);

  let snapshot: MdSnapshot;
  if (snapRes.status === 'fulfilled') {
    snapshot = snapRes.value;
  } else {
    console.error('[md:page] loadMdSnapshot ném lỗi:', snapRes.reason);
    const detail = snapRes.reason instanceof Error ? snapRes.reason.message : String(snapRes.reason);
    const msg = `Không đọc được dữ liệu: ${detail}`;
    snapshot = {
      customers: [],
      materialRequests: [],
      productionOrders: [],
      shipments: [],
      errors: { customers: msg, materialRequests: msg, productionOrders: msg, shipments: msg },
    };
  }

  let po: { rows: Awaited<ReturnType<typeof listOrders>>['rows']; error: string | null };
  if (poRes.status === 'fulfilled') {
    po = poRes.value;
  } else {
    console.error('[md:page] listOrders ném lỗi:', poRes.reason);
    const detail = poRes.reason instanceof Error ? poRes.reason.message : String(poRes.reason);
    po = { rows: [], error: `Không đọc được danh sách PO: ${detail}` };
  }

  // Danh sách PO cho các ô chọn trong form NPL / sản xuất / giao hàng
  const poOptions: PoOption[] = po.rows.map((r) => ({
    id: r.id,
    po_number: r.po_number,
    style_code: r.style_code,
    customer_name: r.customer_name,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Bàn làm việc Merchandiser"
        desc="Trung tâm điều phối: khách hàng, đơn hàng, nguyên phụ liệu, lệnh sản xuất và giao hàng."
      />

      <MdClient
        initialSnapshot={snapshot}
        initialPoRows={po.rows}
        initialPoError={po.error}
        poOptions={poOptions}
      />
    </div>
  );
}
