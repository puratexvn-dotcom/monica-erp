import {
  LayoutDashboard, Handshake, Briefcase, CalendarRange, Factory, ShieldCheck,
  Package, Ship, Users, Wallet, IdCard, PieChart, MessagesSquare, Sparkles,
  FileText, SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

import type { ModuleKey } from '@/lib/design/tokens';

// ============================================================================
// SỔ ĐĂNG KÝ BUSINESS APP — TRANG CHỦ MONICA ONE
//
// ĐÚNG 16 mục, đúng tên hiến định. Không bịa, không giữ tên cũ.
//
// ─── ⚠️ TỆP NÀY KHÔNG CÒN GIỮ MỘT MÃ MÀU NÀO ────────────────────────────
// Trước đây mỗi mục mang bốn chuỗi lớp màu viết thẳng tại chỗ (`bg-blue-50`,
// `hover:ring-blue-200`…) — tổng cộng 64 chuỗi rải trong một tệp. Điều 44.6
// cấm cách đó: màu viết thẳng thì mỗi lần ai đó sửa một chỗ, danh tính của
// phân hệ trôi đi một chút, và sáu tháng sau không ai còn biết đâu là màu
// thật của nó.
//
// Nay mỗi mục chỉ mang một KHOÁ (`key`). Toàn bộ màu tra từ `MODULE_IDENTITY`
// trong `lib/design/tokens.ts` — một chỗ duy nhất, sửa một lần, đổi khắp nơi.
//
// ─── PHÂN LOẠI LÀ DỮ LIỆU, KHÔNG PHẢI BỐ CỤC ────────────────────────────
//   WORKSPACES  11 mục — Business Workspace   · §16.2
//   SERVICES     4 mục — Global Service       · §29 · §30 · §31 · §33
//   PLATFORM     1 mục — Platform Service     · §34
//
// Trang chủ KHÔNG dựng chúng thành ba khối có tiêu đề. Phân loại hiến định mô
// tả BẢN CHẤT từng thứ, nó không phải bố cục của trang chủ. Giữ ba mảng để
// phân loại được ghi lại đúng chỗ, còn giao diện thì bày một lưới phẳng.
// ============================================================================

export interface ModuleItem {
  /** Tên hiến định. KHÔNG dịch, KHÔNG đổi. */
  name: string;
  /** Một dòng, ≤ 40 ký tự. Dài hơn thì thẻ hết thở. */
  desc: string;
  /**
   * Đường dẫn phân hệ, hoặc `null` khi chưa có route.
   *
   * ⚠️ Đây LÀ đường dẫn thật, KHÔNG phải `/login`. Khách chưa đăng nhập bấm
   * vào sẽ được `middleware.ts` chuyển sang `/login?next=<đường dẫn>`, đăng
   * nhập xong quay đúng về nơi họ bấm. Đó chính là luồng bắt buộc:
   * Trang chủ → chọn App → Đăng nhập → Workspace.
   */
  href: string | null;
  icon: LucideIcon;
  /** `true` = chưa có route, thẻ mang nhãn Beta và không bấm được */
  beta: boolean;
  /** Khoá tra màu trong `MODULE_IDENTITY`. Nguồn màu DUY NHẤT của mục này. */
  key: ModuleKey;
}

// ─── BUSINESS WORKSPACES · §16.2 ────────────────────────────────────────────
export const WORKSPACES: ModuleItem[] = [
  { name: 'Executive Center', desc: 'Điều hành và phê duyệt toàn nhà máy',
    href: '/giam-doc', icon: LayoutDashboard, beta: false, key: 'executive' },
  { name: 'Commercial', desc: 'Khách hàng, báo giá và đơn đặt hàng',
    href: '/buyer', icon: Handshake, beta: false, key: 'commercial' },
  { name: 'Merchandising', desc: 'Mã hàng, định mức và điều phối đơn',
    href: '/md', icon: Briefcase, beta: false, key: 'merchandising' },
  { name: 'Planning', desc: 'Kế hoạch, năng lực chuyền và mốc giao',
    href: null, icon: CalendarRange, beta: true, key: 'planning' },
  { name: 'Production', desc: 'Tổ cắt, chuyền may và sản lượng giờ',
    href: '/to-truong-may', icon: Factory, beta: false, key: 'production' },
  { name: 'Quality', desc: 'Kiểm hàng AQL 2.5 và khắc phục lỗi',
    href: '/qa', icon: ShieldCheck, beta: false, key: 'quality' },
  { name: 'Warehouse', desc: 'Nhập, xuất, kiểm kê và tồn kho',
    href: '/kho', icon: Package, beta: false, key: 'warehouse' },
  { name: 'Shipment', desc: 'Đóng thùng, container và chứng từ',
    href: '/xuat-hang', icon: Ship, beta: false, key: 'shipment' },
  { name: 'Subcontract', desc: 'Xưởng gia công ngoài và báo cáo ngày',
    href: '/subcon', icon: Users, beta: false, key: 'subcontract' },
  { name: 'Finance', desc: 'Công nợ, giá thành và đối soát',
    href: '/ke-toan', icon: Wallet, beta: false, key: 'finance' },
  { name: 'Human Resources', desc: 'Nhân sự, chấm công và đào tạo',
    href: null, icon: IdCard, beta: true, key: 'humanResources' },
];

// ─── GLOBAL SERVICES · §29 · §30 · §31 · §33 ────────────────────────────────
export const SERVICES: ModuleItem[] = [
  { name: 'Business Reporting', desc: 'Báo cáo một chạm, kèm bằng chứng gốc',
    href: null, icon: PieChart, beta: true, key: 'reporting' },
  { name: 'Business Communication', desc: 'Trao đổi gắn với đơn hàng, lưu vĩnh viễn',
    href: null, icon: MessagesSquare, beta: true, key: 'communication' },
  // AI Assistant là mục DUY NHẤT dùng dải chuyển sắc (Điều 44.2) — dải đó khai
  // ở `MODULE_IDENTITY.ai.soft`, không khai ở đây.
  { name: 'AI Assistant', desc: 'Trợ lý hiểu ngữ cảnh việc đang làm',
    href: null, icon: Sparkles, beta: true, key: 'ai' },
  { name: 'Documents', desc: 'Tech pack, chứng từ và phiên bản',
    href: null, icon: FileText, beta: true, key: 'documents' },
];

// ─── PLATFORM SERVICE · §34 ─────────────────────────────────────────────────
export const PLATFORM: ModuleItem[] = [
  { name: 'Platform Services', desc: 'Tài khoản, phân quyền, ngôn ngữ và cấu hình',
    href: '/admin', icon: SlidersHorizontal, beta: false, key: 'platform' },
];

/**
 * Cả 16 Business App trong MỘT danh sách phẳng, theo đúng thứ tự hiến định.
 *
 * Đây là thứ trang chủ dựng ra: **một lưới duy nhất**, không tiêu đề nhóm.
 * Phân loại vẫn còn nguyên ở ba mảng trên — nó chỉ không xuất hiện trên màn
 * hình.
 */
export const MODULES: ModuleItem[] = [...WORKSPACES, ...SERVICES, ...PLATFORM];
