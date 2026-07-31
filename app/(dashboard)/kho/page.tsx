import { listStock, listRolls } from './_services/stock.service';
import { listMaterials, listTransactions, listPoOptions } from './wh-actions';
import WarehouseClient from './warehouse-client';

// ============================================================================
// TRUNG TÂM ĐIỀU HÀNH KHO VẬT TƯ
//
// ─── VÌ SAO VẪN LÀ /kho CHỨ KHÔNG PHẢI /warehouse ─────────────────────────
// Trang chủ có đúng mười hai nút và vai trò `kho` đã được RBAC gán vào route
// này. Đổi đường dẫn nghĩa là hoặc thành mười ba nút, hoặc để lại một phân hệ
// chết — cả hai đều phá ràng buộc nền của dự án. Tên đường dẫn không quyết
// định đẳng cấp của màn hình.
//
// ─── VÌ SAO KHÔNG CÒN KHỐI TIÊU ĐỀ Ở ĐÂY ──────────────────────────────────
// Tiêu đề đã chuyển lên thanh đầu trang (dashboard-topbar.tsx), nằm ngang hàng
// với logo. Khối tiêu đề cũ chiếm gần 90px mà không mang thông tin nào cần cuộn
// theo, trong khi ba cột điều hành phải nằm trong tầm nhìn đầu tiên.
//
// ─── DỮ LIỆU CŨ GIỮ NGUYÊN ────────────────────────────────────────────────
// listMaterials / listTransactions / listPoOptions của màn hình cũ vẫn được
// gọi và truyền xuống; hai form nhập/xuất cũ còn chạy nguyên vẹn ở tab tương
// ứng. Không xoá thứ đang phục vụ người dùng để thay bằng thứ chưa xong.
// ============================================================================

export const dynamic = 'force-dynamic';

export default async function WarehousePage() {
  // allSettled: một truy vấn lỗi không được kéo cả trang sang error boundary.
  // Mỗi nhóm dữ liệu tự báo lỗi của riêng nó, phần còn lại vẫn dùng được.
  const [stockRes, rollRes, matRes, txRes, poRes] = await Promise.allSettled([
    listStock(),
    listRolls(),
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

  const stock = pick(stockRes, 'Đọc bảng tồn kho');
  const rolls = pick(rollRes, 'Đọc danh sách cuộn vải');
  const materials = pick(matRes, 'Đọc danh mục vật tư');
  const tx = pick(txRes, 'Đọc lịch sử kho');
  const pos = pick(poRes, 'Đọc danh sách PO');

  return (
    // Phần chừa chỗ cho thanh điều hướng cố định đã làm ở app/layout.tsx
    // (pb-20) — làm lại ở đây sẽ ra khoảng trắng gấp đôi ở cuối trang.
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
      <WarehouseClient
        initialStock={stock.rows}
        initialStockError={stock.error}
        initialRolls={rolls.rows}
        initialRollError={rolls.error}
        initialMaterials={materials.rows}
        initialMatError={materials.error}
        initialTx={tx.rows}
        initialTxError={tx.error}
        poOptions={pos.rows}
        initialPoError={pos.error}
      />
    </div>
  );
}
