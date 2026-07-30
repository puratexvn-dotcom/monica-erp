import { PageHeader } from '@/components/ui';
import { listMaterials, listTransactions, listPoOptions } from './wh-actions';
import KhoClient from './kho-client';

// ============================================================================
// PHÂN HỆ KHO NGUYÊN PHỤ LIỆU
//
// Server Component nạp dữ liệu lần đầu; phần tương tác nằm ở ./kho-client.tsx.
//
// ⚠️ KHÔNG truyền tham chiếu component (icon={...}) xuống client component:
// hàm không serialize được qua ranh giới server/client và Next.js sẽ ném lỗi
// lúc render. Vì vậy dải KPI nằm hẳn trong kho-client.tsx.
// ============================================================================

export const dynamic = 'force-dynamic';

export default async function WarehousePage() {
  const [materials, tx, pos] = await Promise.all([
    listMaterials(),
    listTransactions(),
    listPoOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Quản Lý Kho Nguyên Phụ Liệu"
        desc="Theo dõi tồn kho realtime, lập phiếu nhập vải/NPL và tra cứu lịch sử xuất nhập."
      />

      <KhoClient
        initialMaterials={materials.rows}
        initialTx={tx.rows}
        poOptions={pos.rows}
        initialError={materials.error ?? tx.error ?? pos.error}
      />
    </div>
  );
}
