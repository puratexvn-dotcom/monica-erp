import { guard } from './_services/guard';
import { loadMdSnapshot, type MdSnapshot } from './md-actions';
import { listPoRows } from './_services/po.service';
import { listStyles } from './_services/style.service';
import { napNguonDigest } from './_services/daily-digest.service';
// 🔴 NẠP COMMAND CENTER Ở MÁY CHỦ — sửa lỗi "hiện giao diện CŨ vài giây".
//
// Trước bản này `md-client` gọi `getCommandCenterClient()` trong `useEffect`,
// tức **sau khi hydrate**. HTML đầu tiên vì vậy ⛔ KHÔNG có ba cột — người
// dùng thấy khung cũ + thanh tab, rồi mới thấy Workspace mới thay vào.
//
// 🔑 Đó ⛔ không phải "chậm" — đó là **hai giao diện khác nhau nối tiếp nhau**,
// đúng thứ Board cấm. Sửa bằng cách nạp ở máy chủ để **HTML đầu tiên đã là
// giao diện cuối cùng**.
import { getCommandCenter } from './_services/command-center.service';
import { tongHopNgay } from '@/lib/mos/md/daily-digest';
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
  const [snapRes, poRes, styleRes, digestRes, ccRes, roleRes] = await Promise.allSettled([
    loadMdSnapshot(),
    listPoRows(),
    listStyles(),
    // Báo cáo ngày — Board 06/08/2026. Nguồn hỏng ⇒ digest tự ghi "⚪ chưa đo
    // được" thay vì bịa số 0, nên ⛔ không cần nhánh lỗi riêng ở đây.
    napNguonDigest(),
    // ⚠️ Trong CÙNG `allSettled`: nó chạy **song song** với bốn nguồn kia, nên
    // ⛔ không cộng thêm thời gian chờ — chỉ dời chỗ từ client sang server.
    getCommandCenter(),
    // 🔴 SỬA 07/08/2026 · UAT `BUG-2` — TRƯỚC ĐÂY `guard()` được `await`
    // **ngay bên trong JSX** (`role={(await guard()).role}`).
    //
    // ─── 🔑 VÌ SAO MỘT DÒNG ĐÓ LÀM MẤT TOÀN BỘ STATE ────────────────────
    // `await` trong JSX là một **điểm treo nằm SAU** phần render còn lại. Mỗi
    // lần Server Action gọi `revalidatePath('/md')`, route được vẽ lại, điểm
    // treo đó treo lần nữa, và React **huỷ rồi dựng lại** `MdClient`.
    // Dựng lại ⇒ `useState<TabKey>('po')` về mặc định.
    //
    // Hệ quả đo được bằng phiên md001 thật: **tạo xong bất kỳ chứng từ nào,
    // người dùng bị ném về màn hình Command Center** và ⛔ không thấy thứ vừa
    // tạo. Đo tách bạch: bấm *"Tải lại"* (thuần client) thì tab **giữ nguyên**;
    // chỉ Server Action mới làm mất — đúng dấu vân tay của điểm treo này.
    //
    // ⚠️ Đặt vào CÙNG `allSettled` chứ ⛔ không `await` riêng một dòng: nó chạy
    // **song song** với năm nguồn kia nên ⛔ không cộng thêm mili-giây nào, và
    // ⛔ không còn `await` nào nằm trong JSX.
    guard(),
  ]);

  // Vai chỉ để giao diện ⛔ không mời bấm thứ chắc chắn bị từ chối. `guard()`
  // hỏng ⇒ `null` ⇒ giao diện khoá chặt hơn, ⛔ không mở rộng hơn.
  const role = roleRes.status === 'fulfilled' ? roleRes.value.role : null;

  // Command Center hỏng ⇒ trả cấu trúc RỖNG kèm lời khai, ⛔ không ném lỗi:
  // ba cột vẫn phải dựng được để người dùng thấy phần còn lại.
  const cc = ccRes.status === 'fulfilled'
    ? ccRes.value
    : {
      tasks: [], pos: [], alerts: [],
      errors: {
        all: `Không đọc được Command Center: ${ccRes.reason instanceof Error ? ccRes.reason.message : String(ccRes.reason)}`,
      } as Record<string, string | null>,
    };

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
      qaReports: [],
      errors: {
        customers: msg, materialRequests: msg, productionOrders: msg,
        shipments: msg, qaReports: msg,
      },
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
        baoCaoNgay={tongHopNgay(
          digestRes.status === 'fulfilled'
            ? digestRes.value
            : { ngay: new Date().toISOString().slice(0, 10), sanLuong: [], subcon: [], kiem: [], don: [], nplTre: [] },
        )}
        // 🔴 Vai truyền xuống CHỈ để giao diện ⛔ không mời người dùng bấm thứ
        // chắc chắn bị từ chối. Hàng rào thật nằm ở `setCostingStatus` (máy chủ)
        // và RLS — xem `lib/mos/md/costing-approval.ts`.
        role={role}
        initialCc={cc}
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
