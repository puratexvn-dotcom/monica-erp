import { loadMdSnapshot, type MdSnapshot } from './md-actions';
import { listPoRows } from './_services/po.service';
import { listStyles } from './_services/style.service';
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
// ─── VÌ SAO KHÔNG CÒN KHỐI TIÊU ĐỀ Ở ĐÂY ─────────────────────────────────
// Tiêu đề và câu khẩu hiệu đã chuyển lên thanh đầu trang (components/
// dashboard-topbar.tsx), nằm ngang hàng với logo. Khối tiêu đề cũ chiếm gần
// 90px chiều cao mà không mang thông tin nào cần cuộn theo, trong khi thanh
// tab nghiệp vụ phải nằm trong tầm nhìn đầu tiên.
//
// Màn hình MD cũ (BOM / tiến độ mẫu / costing) được giữ ở ./md-legacy-client.tsx,
// hiện chưa gắn vào route nào.
// ============================================================================

export const dynamic = 'force-dynamic';

export default async function MerchandiserPage() {
  // allSettled: một truy vấn lỗi không được kéo cả trang sang error boundary.
  // Mỗi nhóm dữ liệu tự báo lỗi của riêng nó, phần còn lại vẫn dùng được.
  const [snapRes, poRes, styleRes] = await Promise.allSettled([
    loadMdSnapshot(),
    listPoRows(),
    listStyles(),
  ]);

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

  let po: Awaited<ReturnType<typeof listPoRows>>;
  if (poRes.status === 'fulfilled') {
    po = poRes.value;
  } else {
    console.error('[md:page] listPoRows ném lỗi:', poRes.reason);
    const detail = poRes.reason instanceof Error ? poRes.reason.message : String(poRes.reason);
    po = { rows: [], error: `Không đọc được danh sách PO: ${detail}` };
  }

  let styles: Awaited<ReturnType<typeof listStyles>>;
  if (styleRes.status === 'fulfilled') {
    styles = styleRes.value;
  } else {
    console.error('[md:page] listStyles ném lỗi:', styleRes.reason);
    const detail = styleRes.reason instanceof Error ? styleRes.reason.message : String(styleRes.reason);
    styles = { rows: [], error: `Không đọc được danh sách mã hàng: ${detail}` };
  }

  // Danh sách PO cho các ô chọn trong form NPL / sản xuất / giao hàng.
  // style_code lấy từ style_no của Mã hàng; PO chưa gắn mã hàng thì để trống
  // chứ không bịa ra chuỗi giả.
  const poOptions: PoOption[] = po.rows.map((r) => ({
    id: r.id,
    po_number: r.po_number,
    style_code: r.style_no ?? '',
    customer_name: r.customer_name,
  }));

  return (
    // Phần chừa chỗ cho thanh điều hướng cố định đã làm ở app/layout.tsx
    // (pb-24) — làm lại ở đây sẽ ra khoảng trắng gấp đôi ở cuối trang.
    // ⛔ KHONG boc them lop can giua: WorkspaceShell da co mx-auto max-w-7xl.
    <>
      <MdClient
        initialSnapshot={snapshot}
        initialPoRows={po.rows}
        initialPoError={po.error}
        initialStyles={styles.rows}
        initialStyleError={styles.error}
        poOptions={poOptions}
      />
    </>
  );
}
