import {
  LayoutDashboard, Handshake, Briefcase, CalendarRange, Factory, ShieldCheck,
  Package, Ship, Users, Wallet, IdCard, PieChart, MessagesSquare, Sparkles,
  FileText, SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// SỔ ĐĂNG KÝ BUSINESS APP — TRANG CHỦ MONICA ONE
//
// ĐÚNG 16 mục, đúng tên hiến định. Không bịa, không giữ tên cũ.
//
// ─── ⚠️ PHÂN LOẠI LÀ DỮ LIỆU, KHÔNG PHẢI BỐ CỤC ─────────────────────────
// Ba mảng dưới đây giữ nguyên ba phân loại hiến định:
//
//   WORKSPACES  11 mục — Business Workspace   · §16.2
//   SERVICES     4 mục — Global Service       · §29 · §30 · §31 · §33
//   PLATFORM     1 mục — Platform Service     · §34
//
// Nhưng TRANG CHỦ **KHÔNG** dựng chúng thành ba khối có tiêu đề. Phân loại
// hiến định là cách Hiến pháp mô tả bản chất của từng thứ — nó KHÔNG phải là
// bố cục của trang chủ. Trang chủ chỉ bày ra các Business App.
//
// Giữ ba mảng thay vì gộp thẳng thành một: phân loại vẫn được ghi lại đúng chỗ
// (trong dữ liệu), người đọc mã sau này vẫn biết mục nào thuộc loại nào, mà
// giao diện thì không bị ép phải phơi nó ra.
//
// ─── VÌ SAO THẺ TRẮNG + Ô ICON MÀU ───────────────────────────────────────
// Mười sáu khối màu bão hoà cạnh nhau đọc ra "phần mềm quản trị nội bộ". Dồn
// màu vào một ô icon bo tròn: vẫn nhận diện tức thì, mắt không bị đánh cùng
// lúc. Màu ở đây là THÔNG TIN (phân hệ nào), không phải trang trí.
//
// ─── MỖI PHÂN HỆ MỘT DẢI MÀU RIÊNG ───────────────────────────────────────
// 16 dải Tailwind khác nhau, không dải nào dùng hai lần, trên cả bốn thuộc
// tính: `tile` · `ring` · `focus` · `dot`. Người vận hành xưởng nhận ra
// Production · Quality · Warehouse · Shipment bằng MÀU trước khi kịp đọc chữ.
// AI Assistant là mục DUY NHẤT được dùng dải chuyển sắc.
//
// ⚠️ TAILWIND JIT: mọi class màu phải là chuỗi NGUYÊN VẸN. Không ghép động
// `bg-${x}-50` — dev vẫn hiện màu nhờ cache, production mất sạch màu.
// ============================================================================

export interface ModuleItem {
  /** Tên hiến định. KHÔNG dịch, KHÔNG đổi. */
  name: string;
  /** Một dòng, ≤ 40 ký tự. Dài hơn thì thẻ hết thở. */
  desc: string;
  /**
   * Đường dẫn phân hệ, hoặc `null` khi chưa có route.
   *
   * ⚠️ Đây LÀ đường dẫn thật của phân hệ, KHÔNG phải `/login`. Khách chưa đăng
   * nhập bấm vào sẽ được `middleware.ts` chuyển sang `/login?next=<đường dẫn>`,
   * đăng nhập xong quay đúng về nơi họ bấm. Đó chính là luồng bắt buộc:
   * Trang chủ → chọn App → Đăng nhập → Workspace.
   */
  href: string | null;
  icon: LucideIcon;
  /** `true` = chưa có route, thẻ mang nhãn Beta và không bấm được */
  beta: boolean;
  /** Ô icon: nền nhạt + chữ đậm cùng dải màu */
  tile: string;
  /** Viền sáng lên khi rê chuột */
  ring: string;
  /** Vòng focus bàn phím — cùng dải màu, để lối đi bằng Tab cũng có nhận diện */
  focus: string;
  /** Chấm nhận diện — mỏ neo màu thứ hai, dùng ở nhãn Beta */
  dot: string;
}

// ─── BUSINESS WORKSPACES · §16.2 ────────────────────────────────────────────
export const WORKSPACES: ModuleItem[] = [
  {
    name: 'Executive Center', desc: 'Điều hành và phê duyệt toàn nhà máy',
    href: '/giam-doc', icon: LayoutDashboard, beta: false,
    tile: 'bg-indigo-50 text-indigo-600',
    ring: 'hover:ring-indigo-200', focus: 'focus-visible:ring-indigo-500',
    dot: 'bg-indigo-500',
  },
  {
    name: 'Commercial', desc: 'Khách hàng, báo giá và đơn đặt hàng',
    href: '/buyer', icon: Handshake, beta: false,
    tile: 'bg-orange-50 text-orange-600',
    ring: 'hover:ring-orange-200', focus: 'focus-visible:ring-orange-500',
    dot: 'bg-orange-500',
  },
  {
    name: 'Merchandising', desc: 'Mã hàng, định mức và điều phối đơn',
    href: '/md', icon: Briefcase, beta: false,
    tile: 'bg-red-50 text-red-600',
    ring: 'hover:ring-red-200', focus: 'focus-visible:ring-red-500',
    dot: 'bg-red-500',
  },
  {
    name: 'Planning', desc: 'Kế hoạch, năng lực chuyền và mốc giao',
    href: null, icon: CalendarRange, beta: true,
    tile: 'bg-teal-50 text-teal-600',
    ring: 'hover:ring-teal-200', focus: 'focus-visible:ring-teal-500',
    dot: 'bg-teal-500',
  },
  {
    name: 'Production', desc: 'Tổ cắt, chuyền may và sản lượng giờ',
    href: '/to-truong-may', icon: Factory, beta: false,
    tile: 'bg-blue-50 text-blue-600',
    ring: 'hover:ring-blue-200', focus: 'focus-visible:ring-blue-500',
    dot: 'bg-blue-500',
  },
  {
    name: 'Quality', desc: 'Kiểm hàng AQL 2.5 và khắc phục lỗi',
    href: '/qa', icon: ShieldCheck, beta: false,
    tile: 'bg-emerald-50 text-emerald-600',
    ring: 'hover:ring-emerald-200', focus: 'focus-visible:ring-emerald-500',
    dot: 'bg-emerald-500',
  },
  {
    name: 'Warehouse', desc: 'Nhập, xuất, kiểm kê và tồn kho',
    href: '/kho', icon: Package, beta: false,
    tile: 'bg-green-50 text-green-600',
    ring: 'hover:ring-green-200', focus: 'focus-visible:ring-green-500',
    dot: 'bg-green-500',
  },
  {
    name: 'Shipment', desc: 'Đóng thùng, container và chứng từ',
    href: '/xuat-hang', icon: Ship, beta: false,
    tile: 'bg-cyan-50 text-cyan-600',
    ring: 'hover:ring-cyan-200', focus: 'focus-visible:ring-cyan-500',
    dot: 'bg-cyan-500',
  },
  {
    name: 'Subcontract', desc: 'Xưởng gia công ngoài và báo cáo ngày',
    href: '/subcon', icon: Users, beta: false,
    tile: 'bg-purple-50 text-purple-600',
    ring: 'hover:ring-purple-200', focus: 'focus-visible:ring-purple-500',
    dot: 'bg-purple-500',
  },
  {
    // "Gold" trong bảng màu Board = dải amber của Tailwind.
    name: 'Finance', desc: 'Công nợ, giá thành và đối soát',
    href: '/ke-toan', icon: Wallet, beta: false,
    tile: 'bg-amber-50 text-amber-700',
    ring: 'hover:ring-amber-200', focus: 'focus-visible:ring-amber-500',
    dot: 'bg-amber-500',
  },
  {
    name: 'Human Resources', desc: 'Nhân sự, chấm công và đào tạo',
    href: null, icon: IdCard, beta: true,
    tile: 'bg-rose-50 text-rose-600',
    ring: 'hover:ring-rose-200', focus: 'focus-visible:ring-rose-500',
    dot: 'bg-rose-500',
  },
];

// ─── GLOBAL SERVICES · §29 · §30 · §31 · §33 ────────────────────────────────
export const SERVICES: ModuleItem[] = [
  {
    name: 'Business Reporting', desc: 'Báo cáo một chạm, kèm bằng chứng gốc',
    href: null, icon: PieChart, beta: true,
    tile: 'bg-slate-100 text-slate-600',
    ring: 'hover:ring-slate-300', focus: 'focus-visible:ring-slate-500',
    dot: 'bg-slate-400',
  },
  {
    name: 'Business Communication', desc: 'Trao đổi gắn với đơn hàng, lưu vĩnh viễn',
    href: null, icon: MessagesSquare, beta: true,
    tile: 'bg-sky-50 text-sky-600',
    ring: 'hover:ring-sky-200', focus: 'focus-visible:ring-sky-500',
    dot: 'bg-sky-500',
  },
  {
    // Mục DUY NHẤT dùng dải chuyển sắc — nó khác loại với 15 mục còn lại.
    // Viền/vòng dùng fuchsia chứ KHÔNG dùng purple: purple đã là của
    // Subcontract, hai mục chung màu viền là mất hết tác dụng nhận diện.
    name: 'AI Assistant', desc: 'Trợ lý hiểu ngữ cảnh việc đang làm',
    href: null, icon: Sparkles, beta: true,
    tile: 'bg-gradient-to-br from-violet-100 to-sky-100 text-violet-600',
    ring: 'hover:ring-fuchsia-200', focus: 'focus-visible:ring-fuchsia-500',
    dot: 'bg-fuchsia-500',
  },
  {
    name: 'Documents', desc: 'Tech pack, chứng từ và phiên bản',
    href: null, icon: FileText, beta: true,
    tile: 'bg-stone-100 text-stone-600',
    ring: 'hover:ring-stone-300', focus: 'focus-visible:ring-stone-500',
    dot: 'bg-stone-400',
  },
];

// ─── PLATFORM SERVICE · §34 ─────────────────────────────────────────────────
export const PLATFORM: ModuleItem[] = [
  {
    name: 'Platform Services', desc: 'Tài khoản, phân quyền, ngôn ngữ và cấu hình',
    href: '/admin', icon: SlidersHorizontal, beta: false,
    tile: 'bg-violet-50 text-violet-600',
    ring: 'hover:ring-violet-200', focus: 'focus-visible:ring-violet-500',
    dot: 'bg-violet-500',
  },
];

/**
 * Cả 16 Business App trong MỘT danh sách phẳng, theo đúng thứ tự hiến định.
 *
 * Đây là thứ trang chủ dựng ra: **một lưới duy nhất**, không tiêu đề nhóm,
 * không chia khối. Phân loại vẫn còn nguyên ở ba mảng trên — nó chỉ không
 * xuất hiện trên màn hình.
 */
export const MODULES: ModuleItem[] = [...WORKSPACES, ...SERVICES, ...PLATFORM];
