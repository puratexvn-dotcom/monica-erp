// ============================================================================
// MD WORKSPACE — SIÊU DỮ LIỆU 13 TAB
//
// Tách khỏi `md-client.tsx` ngày 06/08/2026 theo **Board Directive** — `KD-4`
// `TD-39`. Tệp gốc chạm **897/900 dòng**: bộ kiểm kiến trúc mục ⑤ đỏ ở dòng
// 901, tức **mọi việc MD tiếp theo đều bị chặn**.
//
// 🔑 **PHÉP DỜI THUẦN.** ⛔ Không đổi nghiệp vụ · ⛔ không đổi giao diện · ⛔
// không đổi API. `TABS` · `GROUPS` · `CREATE_LABEL` · `fmtDate` · `nf` giữ
// **nguyên văn từng ký tự**; cái đổi duy nhất là **nơi chúng được khai**.
//
// ⚠️ **VÌ SAO ĐÂY LÀ TỆP `.ts`, ⛔ KHÔNG PHẢI `.tsx`.**
// Bản nháp đầu tôi bê cả `MdCharts` *(có JSX cho trạng thái đang tải)* sang
// đây, và bộ kiểm mục ⑩ đỏ ngay: JSX ấy mang `text-sm` — một giá trị **⛔
// không lấy từ thang chữ hiến định**. Nó vốn là nợ **đã có** của
// `md-client.tsx`, nhưng dời sang tệp MỚI thì bánh cóc `TD-10` đọc ra là **nợ
// mới**, và `type-debt-baseline.json` ghi rõ: *"THÊM tên vào danh sách này là
// hành vi **cần Board phê duyệt**"*.
//
// ⇒ Tệp này cố ý **⛔ KHÔNG chứa một dòng JSX nào**, nên nó ⛔ không mang được
// nợ màu hay nợ chữ. `MdCharts` **ở lại** `md-client.tsx`.
//
// ─── BA NHÓM, MƯỜI BA TAB ────────────────────────────────────────────────
// THƯƠNG MẠI: khách hàng → yêu cầu báo giá → chiết tính giá
// TRIỂN KHAI: mã hàng → đơn hàng → vật tư → sản xuất → giao hàng
// PHỐI HỢP:   tài liệu · thảo luận · thay đổi · rủi ro · nhật ký
// Xếp đúng thứ tự vòng đời thật, đọc từ trái sang phải là đi hết một đơn hàng
// từ lúc khách hỏi giá tới lúc lên tàu.
//
// ─── VÌ SAO NẠP DỮ LIỆU THEO TAB ─────────────────────────────────────────
// Mười ba tab mà nạp hết một lượt là mười ba nhóm truy vấn cho mỗi lần mở
// trang, trong khi người dùng thường chỉ làm việc trên hai ba tab. Mỗi tab tự
// nạp lần đầu được mở, sau đó giữ lại trong bộ nhớ cho tới khi bấm Tải lại.
//
// ─── HAI LỐI TẠO Ở TAB VẬT TƯ VÀ SẢN XUẤT ────────────────────────────────
// "Sinh tự động" lấy định mức và SAM có sẵn để tính ra; "Tạo thủ công" giữ
// nguyên đường cũ cho các trường hợp ngoại lệ. Không bỏ đường cũ đi.
// ============================================================================
import {
  Building2, PackageSearch, Boxes, Factory, Ship, Shirt,
  FileQuestion, Calculator, FileText, MessageSquare, ClipboardList, TriangleAlert, History,
  type LucideIcon,
} from 'lucide-react';

export const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

export type TabKey =
  | 'customers' | 'rfq' | 'costing'
  | 'styles' | 'po' | 'materials' | 'production' | 'shipments'
  | 'documents' | 'comments' | 'changes' | 'risks' | 'audit';

export interface TabDef {
  key: TabKey;
  label: string;
  short: string;
  icon: LucideIcon;
  group: 'Thương mại' | 'Triển khai' | 'Phối hợp';
}

export const TABS: TabDef[] = [
  { key: 'customers', label: 'Khách hàng', short: 'Khách', icon: Building2, group: 'Thương mại' },
  { key: 'rfq', label: 'Yêu cầu báo giá', short: 'Báo giá', icon: FileQuestion, group: 'Thương mại' },
  { key: 'costing', label: 'Chiết tính giá', short: 'Chiết tính', icon: Calculator, group: 'Thương mại' },
  { key: 'styles', label: 'Mã hàng', short: 'Mã hàng', icon: Shirt, group: 'Triển khai' },
  { key: 'po', label: 'Đơn hàng (PO)', short: 'PO', icon: PackageSearch, group: 'Triển khai' },
  { key: 'materials', label: 'Vật tư', short: 'Vật tư', icon: Boxes, group: 'Triển khai' },
  { key: 'production', label: 'Sản xuất', short: 'Sản xuất', icon: Factory, group: 'Triển khai' },
  { key: 'shipments', label: 'Giao hàng', short: 'Giao', icon: Ship, group: 'Triển khai' },
  { key: 'documents', label: 'Tài liệu', short: 'Tài liệu', icon: FileText, group: 'Phối hợp' },
  { key: 'comments', label: 'Thảo luận', short: 'Thảo luận', icon: MessageSquare, group: 'Phối hợp' },
  { key: 'changes', label: 'Yêu cầu thay đổi', short: 'Thay đổi', icon: ClipboardList, group: 'Phối hợp' },
  { key: 'risks', label: 'Rủi ro', short: 'Rủi ro', icon: TriangleAlert, group: 'Phối hợp' },
  { key: 'audit', label: 'Nhật ký', short: 'Nhật ký', icon: History, group: 'Phối hợp' },
];

export const GROUPS = ['Thương mại', 'Triển khai', 'Phối hợp'] as const;

export function fmtDate(v: string | null): string {
  if (!v) return '—';
  const [y, m, d] = v.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Nhãn nút tạo mới của từng tab. Tab nào không tạo trực tiếp được thì để null
 *  và ẩn nút — hiện một nút bấm vào không làm gì là tệ hơn không có nút. */
export const CREATE_LABEL: Record<TabKey, string | null> = {
  customers: 'Thêm khách hàng',
  rfq: 'Nhận yêu cầu báo giá',
  costing: 'Tạo bản chiết tính',
  styles: 'Tạo mã hàng',
  po: 'Tạo PO',
  materials: 'Tạo thủ công',
  production: 'Tạo thủ công',
  shipments: 'Tạo lệnh giao hàng',
  documents: null,
  comments: null,
  changes: null, // có nút riêng bên trong màn hình
  risks: null,
  audit: null,
};
