import {
  LayoutDashboard, Handshake, Briefcase, CalendarRange, Factory, ShieldCheck,
  Package, Ship, Users, Wallet, IdCard, PieChart, MessagesSquare, Sparkles,
  FileText, SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// SỔ ĐĂNG KÝ PHÂN HỆ — BUSINESS OPERATING SYSTEM LAUNCHER
//
// ĐÚNG 16 mục, đúng tên hiến định. Không bịa, không giữ tên cũ.
//
//   WORKSPACES  11 mục — Business Workspace   · §16.2
//   SERVICES     4 mục — Global Service       · §29 · §30 · §31 · §33
//   PLATFORM     1 mục — Platform Service     · §34
//
// ─── VÌ SAO TÁCH BA MẢNG THAY VÌ MỘT MẢNG CÓ CỜ PHÂN LOẠI ────────────────
// Hiến pháp có ba phân loại tách bạch, và §17.3 cấm trộn chúng vào nhau. Ba
// mảng riêng khiến việc trộn nhầm trở thành **lỗi biên dịch** chứ không còn là
// một dòng `filter` ai đó quên viết. Trang chủ dựng ba khối, ba ngôn ngữ thị
// giác khác nhau — xem `app/_home/`.
//
// ⚠️ Xuất hiện trên Launcher KHÔNG đổi phân loại hiến định (ADR-001):
// §17.3 *"Global Services may appear on the Business Operating System Launcher
// without becoming Business Workspaces"*; §34.1 nói điều tương tự cho Platform.
//
// 📄 docs/architecture/adr/ADR-001-homepage-conceptual-model.md
//
// ─── VÌ SAO THẺ TRẮNG + Ô ICON MÀU ───────────────────────────────────────
// Mười sáu khối màu bão hoà cạnh nhau đọc ra "phần mềm quản trị nội bộ". Dồn
// màu vào một ô icon bo tròn: vẫn nhận diện tức thì, mắt không bị đánh cùng lúc.
// Màu ở đây là THÔNG TIN (phân hệ nào), không phải trang trí.
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

/**
 * Mức nhấn thị giác của một mục trên trang chủ.
 *
 * ─── VÌ SAO KHÔNG PHẢI 16 Ô BẰNG NHAU ────────────────────────────────────
 * Mười sáu ô cùng cỡ buộc mắt phải QUÉT — đọc từng cái một cho tới khi thấy
 * thứ cần. Đó là hành vi của một bảng chọn, không phải của một tổng hành dinh.
 * Kích cỡ khác nhau cho mắt một điểm rơi: nó biết bắt đầu từ đâu trước khi kịp
 * đọc chữ nào.
 *
 * Ba mục được nâng cấp KHÔNG phải theo sở thích — chúng là ba câu hỏi mà một
 * nhà máy may trả lời mỗi sáng: *nhà máy có ổn không* (Executive Center),
 * *khách đang cần gì* (Commercial), *chuyền có chạy không* (Production).
 */
export type Feature = 'hero' | 'wide' | 'standard';

export interface ModuleItem {
  /** Tên hiến định. KHÔNG dịch, KHÔNG đổi. */
  name: string;
  /** Một dòng, ≤ 40 ký tự. Dài hơn thì thẻ hết thở. */
  desc: string;
  /** `null` = chưa có route → thẻ không bấm được, mang nhãn Beta */
  href: string | null;
  icon: LucideIcon;
  beta: boolean;
  /** Ô icon: nền nhạt + chữ đậm cùng dải màu */
  tile: string;
  /** Viền sáng lên khi rê chuột */
  ring: string;
  /** Vòng focus bàn phím — cùng dải màu, để lối đi bằng Tab cũng có nhận diện */
  focus: string;
  /** Chấm nhận diện cạnh tên — mỏ neo màu thứ hai, dùng ở khối mật độ cao */
  dot: string;
  /** Mức nhấn thị giác. Mặc định `standard` nếu không khai. */
  feature?: Feature;
}

// ─── BUSINESS WORKSPACES · §16.2 ────────────────────────────────────────────
//
// Khối chính, chiếm phần lớn màn hình đầu. Ba mức nhấn:
//
//   hero      Executive Center      chiếm 2 cột × 2 hàng
//   wide      Commercial            chiếm 2 cột × 1 hàng
//   wide      Production            chiếm 2 cột × 1 hàng
//   standard  tám mục còn lại       1 cột × 1 hàng
//
// Ba mục đầu lấp kín hai hàng trên của lưới bốn cột, tám mục sau lấp kín đúng
// hai hàng dưới. Không ô trống, không hàng cụt — bố cục khít là thứ mắt cảm
// nhận được ngay cả khi không biết vì sao.
//
// ⚠️ THỨ TỰ MẢNG = THỨ TỰ LƯỚI. Ba mục nổi bật phải đứng đầu, nếu không lưới
// sẽ chèn chúng vào giữa và vỡ bố cục hai hàng trên.
export const WORKSPACES: ModuleItem[] = [
  {
    name: 'Executive Center', desc: 'Điều hành và phê duyệt toàn nhà máy',
    href: '/giam-doc', icon: LayoutDashboard, beta: false,
    tile: 'bg-indigo-50 text-indigo-600',
    ring: 'hover:ring-indigo-200', focus: 'focus-visible:ring-indigo-500',
    dot: 'bg-indigo-500', feature: 'hero',
  },
  {
    name: 'Commercial', desc: 'Khách hàng, báo giá và đơn đặt hàng',
    href: '/buyer', icon: Handshake, beta: false,
    tile: 'bg-orange-50 text-orange-600',
    ring: 'hover:ring-orange-200', focus: 'focus-visible:ring-orange-500',
    dot: 'bg-orange-500', feature: 'wide',
  },
  {
    name: 'Production', desc: 'Tổ cắt, chuyền may và sản lượng giờ',
    href: '/to-truong-may', icon: Factory, beta: false,
    tile: 'bg-blue-50 text-blue-600',
    ring: 'hover:ring-blue-200', focus: 'focus-visible:ring-blue-500',
    dot: 'bg-blue-500', feature: 'wide',
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
//
// Ngôn ngữ thị giác PHẢI khác Workspace, nếu không phân loại hiến định trở
// thành thứ chỉ tồn tại trong tài liệu. Khác ở đâu, xem `app/_home/service-
// card.tsx`: nền ngà thay vì trắng, bố cục ngang thay vì dọc, không nhấc lên
// khi rê chuột. Đọc ra "năng lực dùng chung", không đọc ra "nơi để tới".
//
// Mỗi mục còn có lối vào thứ hai đúng chuẩn Hiến pháp, vẫn chạy nguyên vẹn:
//   Business Reporting     → nút "Báo cáo"   · Bottom Navigation
//   Business Communication → nút "Chat"      · Bottom Navigation
//   AI Assistant           → nút "A.I"       · Bottom Navigation
//   Documents              → khối "Tài liệu" · Order Context Rail
// Trang chủ là lối vào HỢP NHẤT, không phải lối vào DUY NHẤT.
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
    //
    // `feature: 'hero'` — AI Assistant KHÔNG phải một mục nữa trong hàng. Nó là
    // trí tuệ của nền tảng, nên nó được một dải riêng chiếm trọn bề ngang phía
    // trên ba dịch vụ còn lại. Đây là mục DUY NHẤT trong 16 mục được cả hai
    // đặc quyền: chuyển sắc và mức nhấn hero.
    name: 'AI Assistant', desc: 'Trợ lý hiểu ngữ cảnh việc đang làm',
    href: null, icon: Sparkles, beta: true,
    tile: 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700',
    ring: 'hover:ring-fuchsia-200', focus: 'focus-visible:ring-fuchsia-500',
    dot: 'bg-fuchsia-500', feature: 'hero',
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
// Hạ tầng. Nhẹ nhất về thị giác, vẫn phải sắc nét. Lối vào thứ hai: nút bánh
// răng ở Top Header (xem app/top-navbar.tsx).
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
 * Cả 16 mục theo đúng thứ tự hiến định.
 *
 * Dùng cho phép đếm và bài kiểm; **không** dùng để dựng lưới — dựng lưới phải
 * đi qua ba mảng trên để ba phân loại giữ được ba ngôn ngữ thị giác riêng.
 */
export const MODULES: ModuleItem[] = [...WORKSPACES, ...SERVICES, ...PLATFORM];
