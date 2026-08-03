import {
  LayoutDashboard, Handshake, Briefcase, CalendarRange, Factory, ShieldCheck,
  Package, Ship, Users, Wallet, IdCard, PieChart, MessagesSquare, Sparkles,
  FileText, SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

import type { ModuleKey } from '@/lib/design/tokens';
// Chỉ nhập KIỂU — bị xoá lúc biên dịch, nên tệp này vẫn dùng được ở Server
// Component dù `lib/i18n.tsx` là module phía client.
import type { DictionaryKey } from '@/lib/i18n';

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
  /**
   * Tên hiến định — **KHÔNG DỊCH** ở bất kỳ ngôn ngữ nào (Hiến pháp §45.3).
   *
   * Đây là bản sắc sản phẩm, không phải nhãn giao diện. Xem
   * `lib/constitutional-terms.ts`; bài kiểm kiến trúc mục ⑪ cưỡng chế điều này.
   */
  name: string;
  /**
   * KHOÁ i18n cho câu mô tả — không phải bản thân câu chữ (§45.4).
   *
   * Trước đây trường này giữ thẳng tiếng Việt, nên bản tiếng Anh và tiếng Trung
   * của trang chủ vẫn hiện mô tả tiếng Việt. Nay câu chữ nằm ở
   * `messages/{vi,en,zh}.json`, tệp này chỉ giữ khoá.
   */
  descKey: DictionaryKey;
  /**
   * KHOÁ i18n cho bản mô tả RÚT GỌN — dùng ở khổ điện thoại.
   *
   * ⚠️ Vì sao phải có bản thứ hai: lưới điện thoại là bốn cột, mỗi ô rộng
   * khoảng 80px. Câu mô tả đầy đủ ở cỡ chữ 11px sẽ trải thành NĂM dòng và
   * biến lưới thành một bức tường chữ. Bản rút gọn 2–4 từ thì vừa ba dòng.
   *
   * Cắt chữ bằng `line-clamp` KHÔNG thay thế được: "Điều hành và phê duyệt
   * toàn nhà máy" bị cắt còn "Điều hành và…" thì mất đúng phần mang nghĩa.
   * Muốn ngắn mà vẫn hiểu được thì phải VIẾT LẠI, không phải cắt bớt.
   */
  shortKey: DictionaryKey;
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
  { name: 'Executive Center', descKey: 'appDesc.executive', shortKey: 'appShort.executive',
    href: '/giam-doc', icon: LayoutDashboard, beta: false, key: 'executive' },
  { name: 'Commercial', descKey: 'appDesc.commercial', shortKey: 'appShort.commercial',
    href: '/buyer', icon: Handshake, beta: false, key: 'commercial' },
  { name: 'Merchandising', descKey: 'appDesc.merchandising', shortKey: 'appShort.merchandising',
    href: '/md', icon: Briefcase, beta: false, key: 'merchandising' },
  { name: 'Planning', descKey: 'appDesc.planning', shortKey: 'appShort.planning',
    href: null, icon: CalendarRange, beta: true, key: 'planning' },
  { name: 'Production', descKey: 'appDesc.production', shortKey: 'appShort.production',
    href: '/to-truong-may', icon: Factory, beta: false, key: 'production' },
  { name: 'Quality', descKey: 'appDesc.quality', shortKey: 'appShort.quality',
    href: '/qa', icon: ShieldCheck, beta: false, key: 'quality' },
  { name: 'Warehouse', descKey: 'appDesc.warehouse', shortKey: 'appShort.warehouse',
    href: '/kho', icon: Package, beta: false, key: 'warehouse' },
  { name: 'Shipment', descKey: 'appDesc.shipment', shortKey: 'appShort.shipment',
    href: '/xuat-hang', icon: Ship, beta: false, key: 'shipment' },
  { name: 'Subcontract', descKey: 'appDesc.subcontract', shortKey: 'appShort.subcontract',
    href: '/subcon', icon: Users, beta: false, key: 'subcontract' },
  { name: 'Finance', descKey: 'appDesc.finance', shortKey: 'appShort.finance',
    href: '/ke-toan', icon: Wallet, beta: false, key: 'finance' },
  { name: 'Human Resources', descKey: 'appDesc.humanResources', shortKey: 'appShort.humanResources',
    href: null, icon: IdCard, beta: true, key: 'humanResources' },
];

// ─── GLOBAL SERVICES · §29 · §30 · §31 · §33 ────────────────────────────────
export const SERVICES: ModuleItem[] = [
  { name: 'Business Reporting', descKey: 'appDesc.reporting', shortKey: 'appShort.reporting',
    href: null, icon: PieChart, beta: true, key: 'reporting' },
  { name: 'Business Communication', descKey: 'appDesc.communication', shortKey: 'appShort.communication',
    href: null, icon: MessagesSquare, beta: true, key: 'communication' },
  // AI Assistant là mục DUY NHẤT dùng dải chuyển sắc (Điều 44.2) — dải đó khai
  // ở `MODULE_IDENTITY.ai.soft`, không khai ở đây.
  { name: 'AI Assistant', descKey: 'appDesc.ai', shortKey: 'appShort.ai',
    href: null, icon: Sparkles, beta: true, key: 'ai' },
  { name: 'Documents', descKey: 'appDesc.documents', shortKey: 'appShort.documents',
    href: null, icon: FileText, beta: true, key: 'documents' },
];

// ─── PLATFORM SERVICE · §34 ─────────────────────────────────────────────────
export const PLATFORM: ModuleItem[] = [
  { name: 'Platform Services', descKey: 'appDesc.platform', shortKey: 'appShort.platform',
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
