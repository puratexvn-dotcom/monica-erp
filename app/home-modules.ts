import {
  LayoutDashboard, Handshake, Briefcase, CalendarRange, Factory, ShieldCheck,
  Package, Ship, Users, Wallet, IdCard, PieChart, MessagesSquare, Sparkles,
  FileText, SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// SỔ ĐĂNG KÝ PHÂN HỆ — MONICA ONE APP LAUNCHER
//
// ĐÚNG 16 mục, đúng tên hiến định. Không bịa, không giữ tên cũ.
//
//   1–11  Business Workspace   — §16.2
//   12–15 Global Service       — §29 · §30 · §31 · §33
//   16    Platform Service     — §34
//
// ─── ADR-001 · HOMEPAGE CONCEPTUAL MODEL (Board, 03/08/2026) ─────────────
// Trang chủ là **Business Operating System Launcher**, không phải *Business
// Workspace Launcher*. Nó cấp lối vào cho cả ba loại trên, lọc theo
// Authorization · Assignment · Operational Context (Điều 13.3 sau sửa đổi).
//
// > **Homepage is an Entry Point. It is NOT a classification mechanism.**
//
// Xuất hiện ở đây KHÔNG đổi phân loại hiến định của mục nào: §17.3 nay nói rõ
// *"Global Services may appear on the Business Operating System Launcher
// without becoming Business Workspaces"*, và §34.1 nói điều tương tự cho
// Platform Services. Ba loại nằm chung một lưới, vẫn là ba loại.
//
// ⚠️ Đây KHÔNG phải giấy phép nhét thêm thứ gì lên trang chủ. §13.4 và §13.5
// vẫn là hàng rào; mọi mục mới vẫn phải đi qua một ADR.
//
// 📄 docs/architecture/adr/ADR-001-homepage-conceptual-model.md
//
// ─── VÌ SAO THẺ TRẮNG + Ô ICON MÀU ───────────────────────────────────────
// Mười sáu khối màu bão hoà cạnh nhau đọc ra "phần mềm quản trị nội bộ". Dồn
// màu vào một ô icon bo tròn: vẫn nhận diện tức thì, mắt không bị đánh cùng lúc.
// Đúng ngôn ngữ của Notion · Linear · Microsoft 365.
//
// ─── MỖI PHÂN HỆ MỘT DẢI MÀU RIÊNG ───────────────────────────────────────
// 16 dải Tailwind khác nhau, không dải nào dùng hai lần. Mỗi mục có bốn thứ
// khớp nhau: nền ô icon · màu chữ icon · viền khi rê chuột · vòng khi focus.
// AI Assistant là mục DUY NHẤT được dùng dải chuyển sắc — nó khác loại với
// mười lăm mục còn lại.
//
// ⚠️ TAILWIND JIT: mọi class màu phải là chuỗi NGUYÊN VẸN. Không ghép động
// `bg-${x}-50` — dev vẫn hiện màu nhờ cache, production mất sạch màu.
// ============================================================================

export interface ModuleItem {
  name: string;
  desc: string;
  /** `null` = chưa có route → thẻ không bấm được, mang huy hiệu Beta */
  href: string | null;
  icon: LucideIcon;
  beta: boolean;
  /** Ô icon: nền nhạt + chữ đậm cùng dải màu */
  tile: string;
  /** Viền sáng lên khi rê chuột */
  ring: string;
  /** Vòng focus bàn phím — cùng dải màu, để lối đi bằng Tab cũng có nhận diện */
  focus: string;
}

/**
 * MƯỜI SÁU MỤC CỦA BUSINESS OPERATING SYSTEM LAUNCHER (Điều 13.3 · ADR-001).
 *
 * Thứ tự trong mảng = thứ tự trên lưới: 11 Business Workspace trước, rồi 4
 * Global Service, cuối cùng là Platform Service. Không có tiêu đề nhóm nào
 * hiện ra — phân loại là chuyện của Hiến pháp, không phải chuyện người dùng
 * phải đọc trước khi tìm được thứ cần bấm.
 */
export const MODULES: ModuleItem[] = [
  // ─── BUSINESS WORKSPACES (§16.2) ─────────────────────────────────────────
  {
    name: 'Executive Center', desc: 'Điều hành tổng quan và phê duyệt toàn nhà máy',
    href: '/giam-doc', icon: LayoutDashboard, beta: false,
    tile: 'bg-indigo-100 text-indigo-700',
    ring: 'hover:ring-indigo-300', focus: 'focus-visible:ring-indigo-500',
  },
  {
    name: 'Commercial', desc: 'Khách hàng, báo giá, hợp đồng và đơn đặt hàng',
    href: '/buyer', icon: Handshake, beta: false,
    tile: 'bg-orange-100 text-orange-700',
    ring: 'hover:ring-orange-300', focus: 'focus-visible:ring-orange-500',
  },
  {
    name: 'Merchandising', desc: 'Mã hàng, định mức, chiết tính và điều phối đơn',
    href: '/md', icon: Briefcase, beta: false,
    tile: 'bg-red-100 text-red-700',
    ring: 'hover:ring-red-300', focus: 'focus-visible:ring-red-500',
  },
  {
    name: 'Planning', desc: 'Kế hoạch sản xuất, năng lực chuyền và mốc giao hàng',
    href: null, icon: CalendarRange, beta: true,
    tile: 'bg-teal-100 text-teal-700',
    ring: 'hover:ring-teal-300', focus: 'focus-visible:ring-teal-500',
  },
  {
    name: 'Production', desc: 'Tổ cắt, chuyền may, hoàn thành và sản lượng theo giờ',
    href: '/to-truong-may', icon: Factory, beta: false,
    tile: 'bg-blue-100 text-blue-700',
    ring: 'hover:ring-blue-300', focus: 'focus-visible:ring-blue-500',
  },
  {
    name: 'Quality', desc: 'Kiểm hàng, AQL 2.5, lỗi và hành động khắc phục',
    href: '/qa', icon: ShieldCheck, beta: false,
    tile: 'bg-emerald-100 text-emerald-700',
    ring: 'hover:ring-emerald-300', focus: 'focus-visible:ring-emerald-500',
  },
  {
    name: 'Warehouse', desc: 'Nhập, xuất, kiểm kê và tồn kho nguyên phụ liệu',
    href: '/kho', icon: Package, beta: false,
    tile: 'bg-green-100 text-green-700',
    ring: 'hover:ring-green-300', focus: 'focus-visible:ring-green-500',
  },
  {
    name: 'Shipment', desc: 'Đóng thùng, container, chứng từ và giao hàng',
    href: '/xuat-hang', icon: Ship, beta: false,
    tile: 'bg-cyan-100 text-cyan-700',
    ring: 'hover:ring-cyan-300', focus: 'focus-visible:ring-cyan-500',
  },
  {
    name: 'Subcontract', desc: 'Xưởng gia công ngoài và báo cáo tiến độ ngày',
    href: '/subcon', icon: Users, beta: false,
    tile: 'bg-purple-100 text-purple-700',
    ring: 'hover:ring-purple-300', focus: 'focus-visible:ring-purple-500',
  },
  {
    // "Gold" trong bảng màu Board = dải amber của Tailwind.
    name: 'Finance', desc: 'Công nợ, thanh toán, giá thành và đối soát',
    href: '/ke-toan', icon: Wallet, beta: false,
    tile: 'bg-amber-100 text-amber-800',
    ring: 'hover:ring-amber-300', focus: 'focus-visible:ring-amber-500',
  },
  {
    name: 'Human Resources', desc: 'Nhân sự, chấm công, năng lực và đào tạo',
    href: null, icon: IdCard, beta: true,
    tile: 'bg-rose-100 text-rose-700',
    ring: 'hover:ring-rose-300', focus: 'focus-visible:ring-rose-500',
  },

  // ─── GLOBAL SERVICES (§29 · §30 · §31 · §33) ─────────────────────────────
  //
  // Xuất hiện ở đây là LỐI VÀO, không phải phân loại (§17.3 · ADR-001). Mỗi mục
  // còn có lối vào thứ hai đúng chuẩn Hiến pháp, và lối đó vẫn chạy nguyên vẹn:
  //
  //   Business Reporting     → nút "Báo cáo"   · Bottom Navigation
  //   Business Communication → nút "Chat"      · Bottom Navigation
  //   AI Assistant           → nút "A.I"       · Bottom Navigation
  //   Documents              → khối "Tài liệu" · Order Context Rail
  //
  // Trang chủ là lối vào HỢP NHẤT, không phải lối vào DUY NHẤT.
  {
    name: 'Business Reporting', desc: 'Báo cáo một chạm, luôn kèm bằng chứng gốc',
    href: null, icon: PieChart, beta: true,
    tile: 'bg-slate-200 text-slate-700',
    ring: 'hover:ring-slate-400', focus: 'focus-visible:ring-slate-500',
  },
  {
    name: 'Business Communication', desc: 'Trao đổi gắn với đơn hàng, lưu vĩnh viễn',
    href: null, icon: MessagesSquare, beta: true,
    tile: 'bg-sky-100 text-sky-700',
    ring: 'hover:ring-sky-300', focus: 'focus-visible:ring-sky-500',
  },
  {
    // Mục DUY NHẤT dùng dải chuyển sắc — nó khác loại với 15 mục còn lại.
    name: 'AI Assistant', desc: 'Trợ lý hiểu ngữ cảnh công việc đang làm',
    href: null, icon: Sparkles, beta: true,
    // Viền/vòng dùng fuchsia chứ KHÔNG dùng purple: purple đã là của
    // Subcontract, và hai mục chung một màu viền thì mất hết tác dụng nhận
    // diện. Fuchsia đứng cạnh dải chuyển sắc tím→lam vẫn thuận mắt.
    tile: 'bg-gradient-to-br from-purple-200 to-blue-200 text-purple-800',
    ring: 'hover:ring-fuchsia-300', focus: 'focus-visible:ring-fuchsia-500',
  },
  {
    name: 'Documents', desc: 'Tech pack, chứng từ và quản lý phiên bản',
    href: null, icon: FileText, beta: true,
    tile: 'bg-gray-200 text-gray-700',
    ring: 'hover:ring-gray-400', focus: 'focus-visible:ring-gray-500',
  },
  // ─── PLATFORM SERVICE (§34) ──────────────────────────────────────────────
  // Lối vào thứ hai: nút bánh răng ở Top Header (xem app/top-navbar.tsx).
  {
    name: 'Platform Services', desc: 'Tài khoản, phân quyền, ngôn ngữ và cấu hình',
    href: '/admin', icon: SlidersHorizontal, beta: false,
    tile: 'bg-violet-100 text-violet-700',
    ring: 'hover:ring-violet-300', focus: 'focus-visible:ring-violet-500',
  },
];
