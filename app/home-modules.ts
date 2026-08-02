import {
  BarChart3, Briefcase, Package, Factory, ShieldCheck, Archive, Users,
  Building2, Truck, Handshake, CalendarRange, PieChart, History,
  Sparkles, FileText, Settings,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// SỔ ĐĂNG KÝ PHÂN HỆ — MONICA ONE
//
// ĐÚNG 16 PHÂN HỆ, chia 5 nhóm, theo danh sách đã chốt. Không thêm, không bớt,
// không đổi tên. Tên phân hệ giữ nguyên dạng quốc tế; phần tiếng Việt nằm ở
// dòng mô tả bên dưới — người vận hành vẫn đọc hiểu mà tên gọi thì thống nhất
// với tài liệu và với cách khách hàng gọi.
//
// ─── HAI TRẠNG THÁI ──────────────────────────────────────────────────────
//   'live' — đã chạy, có route thật  → thẻ BẤM ĐƯỢC, nền màu
//   'soon' — chưa dựng, chưa có route → thẻ KHÔNG bấm được, nền xám
//
// ⚠️ Thẻ `soon` CỐ Ý không bấm được. "Hiện đủ 16 phân hệ" và "không còn route
// chết, không màn hình trắng" chỉ dung hoà được theo cách này: phân hệ vẫn hiện
// đủ (icon · tên · mô tả · trạng thái · nhãn) nhưng không dẫn ai vào ngõ cụt.
// Đây là cách các sản phẩm SaaS trưởng thành trình bày phần chưa mở.
//
// ⚠️ TAILWIND JIT: mọi class màu phải là chuỗi NGUYÊN VẸN. Tuyệt đối không ghép
// động `bg-${x}-700` — dev vẫn hiện màu nhờ cache, production mất sạch màu.
//
// ⚠️ ĐỘ TƯƠNG PHẢN: nền mức -700 với chữ trắng đạt WCAG AA (đo ở app/page.tsx).
// Đổi sang -500/-600 cho "tươi hơn" sẽ trượt chuẩn.
// ============================================================================

export type ModuleStatus = 'live' | 'soon';

export type ModuleGroup = 'Core' | 'Business' | 'Commercial' | 'Management' | 'Platform';

/** Thứ tự hiển thị của năm nhóm trên trang chủ */
export const MODULE_GROUPS: readonly ModuleGroup[] = [
  'Core', 'Business', 'Commercial', 'Management', 'Platform',
] as const;

/** Nhãn tiếng Việt của nhóm — tên nhóm giữ nguyên tiếng Anh theo yêu cầu */
export const GROUP_SUBTITLE: Record<ModuleGroup, string> = {
  Core: 'Điều hành trung tâm',
  Business: 'Vận hành sản xuất',
  Commercial: 'Thương mại & đối tác',
  Management: 'Quản trị & báo cáo',
  Platform: 'Nền tảng & hệ thống',
};

export interface ModuleItem {
  name: string;
  desc: string;
  group: ModuleGroup;
  /** `null` nghĩa là chưa có route — thẻ sẽ KHÔNG bấm được */
  href: string | null;
  icon: LucideIcon;
  status: ModuleStatus;
  /** Nhãn dùng khi không tra được số liệu thật theo href */
  fallbackBadge: string;
  bg: string;
  badgeCls: string;
  sub: string;
  glow: string;
}

const LIVE = (bg: string, badgeCls: string, sub: string, glow: string) => ({ bg, badgeCls, sub, glow });
const SOON = {
  bg: 'bg-slate-500', badgeCls: 'bg-white text-slate-700', sub: 'text-slate-100', glow: '',
} as const;

export const MODULES: ModuleItem[] = [
  // ─── CORE ─────────────────────────────────────────────────────────────────
  {
    name: 'Dashboard', desc: 'Bảng điều hành tổng quan & phê duyệt toàn nhà máy',
    group: 'Core', href: '/giam-doc', icon: BarChart3, status: 'live', fallbackBadge: 'Điều hành',
    ...LIVE('bg-slate-700', 'bg-white text-slate-800', 'text-slate-200', 'hover:shadow-slate-500/40'),
  },

  // ─── BUSINESS ─────────────────────────────────────────────────────────────
  {
    name: 'Merchandising', desc: 'Khách hàng, PO, mã hàng, NPL, sản xuất & giao hàng',
    group: 'Business', href: '/md', icon: Briefcase, status: 'live', fallbackBadge: 'Trung tâm điều phối',
    ...LIVE('bg-red-700', 'bg-white text-red-800', 'text-red-100', 'hover:shadow-red-500/40'),
  },
  {
    name: 'Warehouse', desc: 'Nhập, xuất, kiểm kê & tồn kho nguyên phụ liệu',
    group: 'Business', href: '/kho', icon: Package, status: 'live', fallbackBadge: 'Kho NPL',
    ...LIVE('bg-green-700', 'bg-white text-green-800', 'text-green-100', 'hover:shadow-green-500/40'),
  },
  {
    name: 'Production', desc: 'Chuyền may, tổ cắt, hoàn thành & sản lượng theo giờ',
    group: 'Business', href: '/to-truong-may', icon: Factory, status: 'live', fallbackBadge: 'Sản xuất',
    ...LIVE('bg-blue-700', 'bg-white text-blue-800', 'text-blue-100', 'hover:shadow-blue-500/40'),
  },
  {
    name: 'Quality', desc: 'Kiểm soát chất lượng, AQL 2.5 & xử lý lỗi hàng',
    group: 'Business', href: '/qa', icon: ShieldCheck, status: 'live', fallbackBadge: 'Chất lượng',
    ...LIVE('bg-teal-700', 'bg-white text-teal-800', 'text-teal-100', 'hover:shadow-teal-500/40'),
  },
  {
    name: 'Shipment', desc: 'Kho thành phẩm, đóng container & lô xuất hàng',
    group: 'Business', href: '/xuat-hang', icon: Archive, status: 'live', fallbackBadge: 'Logistics',
    ...LIVE('bg-emerald-700', 'bg-white text-emerald-800', 'text-emerald-100', 'hover:shadow-emerald-500/40'),
  },
  {
    name: 'Subcontract', desc: 'Cổng xưởng gia công ngoài & báo cáo tiến độ ngày',
    group: 'Business', href: '/subcon', icon: Users, status: 'live', fallbackBadge: 'Đối tác ngoài',
    ...LIVE('bg-violet-700', 'bg-white text-violet-800', 'text-violet-100', 'hover:shadow-violet-500/40'),
  },

  // ─── COMMERCIAL ───────────────────────────────────────────────────────────
  {
    name: 'Customer', desc: 'Cổng khách hàng — đơn hàng, tiến độ & chứng từ',
    group: 'Commercial', href: '/buyer', icon: Building2, status: 'live', fallbackBadge: 'Cổng đối tác',
    ...LIVE('bg-orange-700', 'bg-white text-orange-800', 'text-orange-100', 'hover:shadow-orange-500/40'),
  },
  {
    name: 'Supplier', desc: 'Hồ sơ nhà cung cấp, đánh giá & đơn đặt mua',
    group: 'Commercial', href: null, icon: Truck, status: 'soon', fallbackBadge: 'Sắp ra mắt', ...SOON,
  },
  {
    name: 'CRM', desc: 'Cơ hội, báo giá & lịch sử chăm sóc khách hàng',
    group: 'Commercial', href: null, icon: Handshake, status: 'soon', fallbackBadge: 'Sắp ra mắt', ...SOON,
  },

  // ─── MANAGEMENT ───────────────────────────────────────────────────────────
  {
    name: 'Planning', desc: 'Lịch sản xuất, năng lực chuyền & mốc giao hàng',
    group: 'Management', href: null, icon: CalendarRange, status: 'soon', fallbackBadge: 'Sắp ra mắt', ...SOON,
  },
  {
    name: 'Reports', desc: 'Đang dùng được ở nút Báo cáo trên thanh điều hướng dưới',
    group: 'Management', href: null, icon: PieChart, status: 'soon', fallbackBadge: 'Ở thanh dưới', ...SOON,
  },
  {
    name: 'Audit Center', desc: 'Nhật ký thao tác, truy vết & bằng chứng vận hành',
    group: 'Management', href: null, icon: History, status: 'soon', fallbackBadge: 'Sắp ra mắt', ...SOON,
  },

  // ─── PLATFORM ─────────────────────────────────────────────────────────────
  {
    name: 'AI Center', desc: 'Đang dùng được ở nút A.I trên thanh điều hướng dưới',
    group: 'Platform', href: null, icon: Sparkles, status: 'soon', fallbackBadge: 'Ở thanh dưới', ...SOON,
  },
  {
    name: 'Documents', desc: 'Kho tài liệu kỹ thuật, chứng từ & quản lý phiên bản',
    group: 'Platform', href: null, icon: FileText, status: 'soon', fallbackBadge: 'Sắp ra mắt', ...SOON,
  },
  {
    name: 'Administration', desc: 'Tài khoản, phân quyền, cấu hình & nhật ký hệ thống',
    group: 'Platform', href: '/admin', icon: Settings, status: 'live', fallbackBadge: 'Quản trị',
    ...LIVE('bg-fuchsia-700', 'bg-white text-fuchsia-800', 'text-fuchsia-100', 'hover:shadow-fuchsia-500/40'),
  },
];

// ============================================================================
// LỐI TẮT TỚI PHÂN HỆ CON ĐANG CHẠY
//
// ⚠️ ĐÂY KHÔNG PHẢI MODULE MỚI — không thêm thẻ nào vào lưới 16.
//
// Ba route dưới đây đã chạy thật nhưng không có thẻ riêng trong danh sách 16:
// `Production` gộp cả ba tổ sản xuất, còn Kế toán nằm trong nhóm chưa tách thẻ.
// Bỏ hẳn lối vào sẽ làm ba màn hình đang chạy trở nên không tới được — đúng lỗi
// "route chết" mà phiên này phải dẹp. Nên chúng ở đây dưới dạng liên kết chữ,
// nhỏ và phụ thuộc, không cạnh tranh với lưới phân hệ chính.
// ============================================================================
export interface QuickRoute {
  label: string;
  href: string;
}

export const SUB_ROUTES: QuickRoute[] = [
  { label: 'Tổ Cắt', href: '/to-truong-cat' },
  { label: 'Tổ Hoàn Thành', href: '/hoan-thanh' },
  { label: 'Kế Toán', href: '/ke-toan' },
  { label: 'Danh sách đơn hàng', href: '/orders' },
];
