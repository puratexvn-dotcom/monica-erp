import {
  LayoutDashboard, Briefcase, Package, Factory, ShieldCheck, Ship, Users,
  Building2, Truck, Handshake, CalendarRange, PieChart, History,
  Sparkles, FileText, Settings,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// SỔ ĐĂNG KÝ PHÂN HỆ — MONICA ONE APP LAUNCHER
//
// ĐÚNG 16 phân hệ. Không thiếu, không thừa, KHÔNG chia nhóm.
//
// ─── VÌ SAO THẺ TRẮNG + Ô ICON MÀU, KHÔNG PHẢI KHỐI MÀU ĐẶC ──────────────
// Bản trước dùng thẻ nền màu đặc kín. Đó chính là ngôn ngữ thị giác của
// dashboard ERP đời cũ — mười sáu khối màu bão hoà cạnh nhau đọc ra "phần mềm
// quản trị nội bộ", không phải "nền tảng SaaS cao cấp".
//
// Notion · Linear · Microsoft 365 · Google Workspace đều làm ngược lại: nền
// thẻ trung tính, MÀU dồn vào một ô icon nhỏ. Màu vẫn là thứ nhận diện phân
// hệ ngay lập tức, nhưng mắt không bị mười sáu mảng màu đánh cùng lúc.
//
// ─── BETA, KHÔNG PHẢI "SẮP RA MẮT" ───────────────────────────────────────
// Bảy phân hệ chưa có route mang huy hiệu `Beta` nhỏ ở góc trên phải. KHÔNG
// làm xám, KHÔNG icon khoá, KHÔNG chữ "Coming Soon" — thẻ trông đầy đủ y hệt
// các phân hệ khác.
//
// ⚠️ Chúng vẫn KHÔNG bọc <Link>: chưa có route thì bấm vào là 404. Một huy
// hiệu Beta nói thật rằng phần này đang dựng, còn một cú 404 thì phá vỡ niềm
// tin vào toàn bộ hệ thống.
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
  /** Ô icon: nền nhạt + chữ đậm cùng dải màu — đây là thứ nhận diện phân hệ */
  tile: string;
  /** Viền sáng lên khi rê chuột, cùng dải màu với ô icon */
  ring: string;
}

export const MODULES: ModuleItem[] = [
  {
    name: 'Dashboard', desc: 'Tổng quan điều hành toàn nhà máy',
    href: '/giam-doc', icon: LayoutDashboard, beta: false,
    tile: 'bg-slate-100 text-slate-700', ring: 'hover:ring-slate-300',
  },
  {
    name: 'Merchandising', desc: 'Khách hàng, đơn hàng, mã hàng và giao hàng',
    href: '/md', icon: Briefcase, beta: false,
    tile: 'bg-red-50 text-red-600', ring: 'hover:ring-red-200',
  },
  {
    name: 'Warehouse', desc: 'Nhập xuất, kiểm kê và tồn kho nguyên phụ liệu',
    href: '/kho', icon: Package, beta: false,
    tile: 'bg-green-50 text-green-600', ring: 'hover:ring-green-200',
  },
  {
    name: 'Production', desc: 'Chuyền may, tổ cắt và sản lượng theo giờ',
    href: '/to-truong-may', icon: Factory, beta: false,
    tile: 'bg-blue-50 text-blue-600', ring: 'hover:ring-blue-200',
  },
  {
    name: 'Quality', desc: 'Kiểm soát chất lượng và xử lý hàng lỗi',
    href: '/qa', icon: ShieldCheck, beta: false,
    tile: 'bg-teal-50 text-teal-600', ring: 'hover:ring-teal-200',
  },
  {
    name: 'Shipment', desc: 'Kho thành phẩm, đóng container và lô xuất',
    href: '/xuat-hang', icon: Ship, beta: false,
    tile: 'bg-emerald-50 text-emerald-600', ring: 'hover:ring-emerald-200',
  },
  {
    name: 'Subcontract', desc: 'Xưởng gia công ngoài và báo cáo tiến độ',
    href: '/subcon', icon: Users, beta: false,
    tile: 'bg-violet-50 text-violet-600', ring: 'hover:ring-violet-200',
  },
  {
    name: 'Customer', desc: 'Cổng khách hàng, đơn hàng và chứng từ',
    href: '/buyer', icon: Building2, beta: false,
    tile: 'bg-orange-50 text-orange-600', ring: 'hover:ring-orange-200',
  },
  {
    name: 'Supplier', desc: 'Nhà cung cấp, đánh giá và đơn đặt mua',
    href: null, icon: Truck, beta: true,
    tile: 'bg-indigo-50 text-indigo-600', ring: 'hover:ring-indigo-200',
  },
  {
    name: 'CRM', desc: 'Cơ hội, báo giá và chăm sóc khách hàng',
    href: null, icon: Handshake, beta: true,
    tile: 'bg-cyan-50 text-cyan-600', ring: 'hover:ring-cyan-200',
  },
  {
    name: 'Planning', desc: 'Lịch sản xuất, năng lực chuyền và mốc giao',
    href: null, icon: CalendarRange, beta: true,
    tile: 'bg-gray-100 text-gray-600', ring: 'hover:ring-gray-300',
  },
  {
    name: 'Reports', desc: 'Báo cáo vận hành và xuất dữ liệu',
    href: null, icon: PieChart, beta: true,
    tile: 'bg-slate-100 text-slate-500', ring: 'hover:ring-slate-300',
  },
  {
    name: 'Audit Center', desc: 'Nhật ký thao tác và truy vết vận hành',
    href: null, icon: History, beta: true,
    tile: 'bg-neutral-200 text-neutral-700', ring: 'hover:ring-neutral-400',
  },
  {
    // Dải chuyển sắc tím → xanh: phân hệ duy nhất dùng gradient, cố ý — nó là
    // thứ khác loại với mười lăm phân hệ nghiệp vụ còn lại.
    name: 'AI Center', desc: 'Trợ lý phân tích và gợi ý theo dữ liệu thật',
    href: null, icon: Sparkles, beta: true,
    tile: 'bg-gradient-to-br from-violet-100 to-blue-100 text-violet-600',
    ring: 'hover:ring-violet-200',
  },
  {
    name: 'Documents', desc: 'Tài liệu kỹ thuật, chứng từ và phiên bản',
    href: null, icon: FileText, beta: true,
    tile: 'bg-neutral-100 text-neutral-600', ring: 'hover:ring-neutral-300',
  },
  {
    name: 'Administration', desc: 'Tài khoản, phân quyền và cấu hình hệ thống',
    href: '/admin', icon: Settings, beta: false,
    tile: 'bg-fuchsia-50 text-fuchsia-600', ring: 'hover:ring-fuchsia-200',
  },
];
