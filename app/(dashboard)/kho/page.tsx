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
  // Promise.allSettled thay vì Promise.all: một truy vấn ném lỗi không được
  // phép làm sập cả trang và đẩy người dùng sang error boundary. Mỗi nhóm dữ
  // liệu tự báo lỗi của riêng nó, phần còn lại vẫn dùng được.
  const [matRes, txRes, poRes] = await Promise.allSettled([
    listMaterials(),
    listTransactions(),
    listPoOptions(),
  ]);

  const pick = <T,>(
    r: PromiseSettledResult<{ rows: T[]; error: string | null }>,
    label: string,
  ): { rows: T[]; error: string | null } => {
    if (r.status === 'fulfilled') return r.value;
    const detail = r.reason instanceof Error ? r.reason.message : String(r.reason);
    console.error(`[kho:page] ${label} ném lỗi:`, r.reason);
    return { rows: [], error: `${label} lỗi: ${detail}` };
  };

  const materials = pick(matRes, 'Đọc tồn kho');
  const tx = pick(txRes, 'Đọc lịch sử kho');
  const pos = pick(poRes, 'Đọc danh sách PO');

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
        initialMatError={materials.error}
        initialTxError={tx.error}
        initialPoError={pos.error}
      />
    </div>
  );
}
