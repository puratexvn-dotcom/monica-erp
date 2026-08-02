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
//   1–11  Business Workspace   — Hiến pháp §16.2
//   12–16 Global / Platform Service — §29 · §30 · §31 · §33 · §34
//
// ⚠️ ĐIỂM CẦN BOARD PHÊ DUYỆT: §13.3 nói trang chủ trình bày **Business
// Workspace** làm mô hình điều hướng chính, và §17.3 nói *"Global Services
// shall not become Business Workspaces."* Năm mục 12–16 là Global/Platform
// Service, nay xuất hiện như thẻ trên trang chủ. Hiển thị chúng như **lối vào**
// không biến chúng **thành** Workspace, nhưng ranh giới này chưa được Hiến pháp
// nói rõ. Đã báo cáo để Board quyết.
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

export const MODULES: ModuleItem[] = [
  // ─── BUSINESS WORKSPACES (§16.2) ──────────────────────────────────────────
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

  // ─── GLOBAL / PLATFORM SERVICES (§29 · §30 · §31 · §33 · §34) ────────────
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
    tile: 'bg-gradient-to-br from-purple-200 to-blue-200 text-purple-800',
    ring: 'hover:ring-purple-300', focus: 'focus-visible:ring-purple-500',
  },
  {
    name: 'Documents', desc: 'Tech pack, chứng từ và quản lý phiên bản',
    href: null, icon: FileText, beta: true,
    tile: 'bg-gray-200 text-gray-700',
    ring: 'hover:ring-gray-400', focus: 'focus-visible:ring-gray-500',
  },
  {
    name: 'Platform Services', desc: 'Tài khoản, phân quyền, ngôn ngữ và cấu hình',
    href: '/admin', icon: SlidersHorizontal, beta: false,
    tile: 'bg-violet-100 text-violet-700',
    ring: 'hover:ring-violet-300', focus: 'focus-visible:ring-violet-500',
  },
];
