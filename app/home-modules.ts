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

/**
 * Phần chung của mọi Business App — mọi trường **⛔ không** phụ thuộc trạng thái.
 *
 * ─── 🔴 BOARD DECISION `Q2` · 05/08/2026 ─────────────────────────────────
 * *"5 module chưa có chức năng: hiển thị · disable · badge Coming Soon ·
 * **⛔ không dùng `href: null`**."*
 *
 * Trước bản này, App chưa có route mang `href: null` + `beta: true`. Hai vấn đề:
 *
 *   ① `href: null` buộc mọi nơi dùng phải tự nhớ kiểm tra `null`, và
 *      `app-card.tsx:183` đã phải viết `mod.href as string` — một phép ép kiểu
 *      **tắt máy kiểm** đúng chỗ nguy hiểm nhất.
 *   ② `beta` mô tả *"đang phát triển"*, ⛔ không mô tả *"⛔ chưa có route"*.
 *      Hai khái niệm khác nhau bị gộp làm một.
 *
 * ⇒ Nay dùng **union phân biệt**: mục `COMING_SOON` **⛔ không có trường `href`
 * nào cả**. Trình biên dịch ⛔ **không cho** ai đặt liên kết vào một App chưa có
 * route — mạnh hơn mọi quy ước viết trong chú thích.
 */
interface ModuleBase {
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
   * KHOÁ i18n cho **Business Value** — một câu nói *doanh nghiệp được gì*.
   *
   * ─── VÌ SAO CẦN LỚP THỨ BA, KHI ĐÃ CÓ `descKey` VÀ `shortKey` ──────────
   * Hai trường kia trả lời **"App này LÀM GÌ"** — chúng viết cho người vận
   * hành, người đã biết mình cần gì và chỉ đang tìm đường vào.
   *
   * Trường này trả lời **"doanh nghiệp ĐƯỢC GÌ"** — nó viết cho một nhóm khán
   * giả khác hẳn: Sales · Investor · Customer · người mới vào. Với họ,
   * *"Nhập, xuất, kiểm kê và tồn kho"* ⛔ **không** nói lên điều gì; *"biết
   * chính xác còn bao nhiêu vải trước khi ra lệnh cắt"* thì có.
   *
   * ⚠️ **⛔ KHÔNG in trên ô lưới.** Một câu đầy đủ nhân với 16 ô biến lưới
   * thành một bức tường chữ — đúng thứ ô Launcher tồn tại để tránh. Nó nằm ở
   * `title`, tức chỗ người ta **đọc** khi đã dừng lại ở một ô.
   *
   * 🔑 Một Module, **hai câu, hai khán giả, hai chỗ**.
   */
  valueKey: DictionaryKey;
  icon: LucideIcon;
  /** Khoá tra màu trong `MODULE_IDENTITY`. Nguồn màu DUY NHẤT của mục này. */
  key: ModuleKey;
}

/**
 * App **đã có route** — bấm được.
 *
 * ⚠️ `href` LÀ đường dẫn thật, KHÔNG phải `/login`. Người chưa đăng nhập bấm
 * vào sẽ được `middleware.ts` chuyển sang `/login?next=<đường dẫn>`, đăng nhập
 * xong quay đúng về nơi họ bấm.
 */
export interface ModuleReady extends ModuleBase {
  status: 'READY';
  href: string;
}

/**
 * App **⛔ chưa có route** — hiện, khoá, gắn nhãn *Coming Soon* *(Board `Q2`)*.
 *
 * 🔑 **⛔ KHÔNG có trường `href`.** Đó là điểm mấu chốt: ⛔ không phải `href`
 * bằng `null`, mà là **⛔ không tồn tại `href`**. Thử đọc `mod.href` trên nhánh
 * này là **lỗi biên dịch**.
 */
export interface ModuleComingSoon extends ModuleBase {
  status: 'COMING_SOON';
}

export type ModuleItem = ModuleReady | ModuleComingSoon;

// ─── BUSINESS WORKSPACES · §16.2 ────────────────────────────────────────────
export const WORKSPACES: ModuleItem[] = [
  { name: 'Executive Center', descKey: 'appDesc.executive', shortKey: 'appShort.executive', valueKey: 'appValue.executive',
    status: 'READY', href: '/giam-doc', icon: LayoutDashboard, key: 'executive' },
  { name: 'Commercial', descKey: 'appDesc.commercial', shortKey: 'appShort.commercial', valueKey: 'appValue.commercial',
    status: 'READY', href: '/buyer', icon: Handshake, key: 'commercial' },
  { name: 'Merchandising', descKey: 'appDesc.merchandising', shortKey: 'appShort.merchandising', valueKey: 'appValue.merchandising',
    status: 'READY', href: '/md', icon: Briefcase, key: 'merchandising' },
  { name: 'Planning', descKey: 'appDesc.planning', shortKey: 'appShort.planning', valueKey: 'appValue.planning',
    status: 'COMING_SOON', icon: CalendarRange, key: 'planning' },
  { name: 'Production', descKey: 'appDesc.production', shortKey: 'appShort.production', valueKey: 'appValue.production',
    status: 'READY', href: '/to-truong-may', icon: Factory, key: 'production' },
  { name: 'Quality', descKey: 'appDesc.quality', shortKey: 'appShort.quality', valueKey: 'appValue.quality',
    status: 'READY', href: '/qa', icon: ShieldCheck, key: 'quality' },
  { name: 'Warehouse', descKey: 'appDesc.warehouse', shortKey: 'appShort.warehouse', valueKey: 'appValue.warehouse',
    status: 'READY', href: '/kho', icon: Package, key: 'warehouse' },
  { name: 'Shipment', descKey: 'appDesc.shipment', shortKey: 'appShort.shipment', valueKey: 'appValue.shipment',
    status: 'READY', href: '/xuat-hang', icon: Ship, key: 'shipment' },
  { name: 'Subcontract', descKey: 'appDesc.subcontract', shortKey: 'appShort.subcontract', valueKey: 'appValue.subcontract',
    status: 'READY', href: '/subcon', icon: Users, key: 'subcontract' },
  { name: 'Finance', descKey: 'appDesc.finance', shortKey: 'appShort.finance', valueKey: 'appValue.finance',
    status: 'READY', href: '/ke-toan', icon: Wallet, key: 'finance' },
  { name: 'Human Resources', descKey: 'appDesc.humanResources', shortKey: 'appShort.humanResources', valueKey: 'appValue.humanResources',
    status: 'COMING_SOON', icon: IdCard, key: 'humanResources' },
];

// ─── GLOBAL SERVICES · §29 · §30 · §31 · §33 ────────────────────────────────
export const SERVICES: ModuleItem[] = [
  { name: 'Business Reporting', descKey: 'appDesc.reporting', shortKey: 'appShort.reporting', valueKey: 'appValue.reporting',
    status: 'COMING_SOON', icon: PieChart, key: 'reporting' },
  { name: 'Business Communication', descKey: 'appDesc.communication', shortKey: 'appShort.communication', valueKey: 'appValue.communication',
    status: 'COMING_SOON', icon: MessagesSquare, key: 'communication' },
  // AI Assistant là mục DUY NHẤT dùng dải chuyển sắc (Điều 44.2) — dải đó khai
  // ở `MODULE_IDENTITY.ai.soft`, không khai ở đây.
  { name: 'AI Assistant', descKey: 'appDesc.ai', shortKey: 'appShort.ai', valueKey: 'appValue.ai',
    status: 'COMING_SOON', icon: Sparkles, key: 'ai' },
  { name: 'Documents', descKey: 'appDesc.documents', shortKey: 'appShort.documents', valueKey: 'appValue.documents',
    status: 'COMING_SOON', icon: FileText, key: 'documents' },
];

// ─── PLATFORM SERVICE · §34 ─────────────────────────────────────────────────
export const PLATFORM: ModuleItem[] = [
  { name: 'Platform Services', descKey: 'appDesc.platform', shortKey: 'appShort.platform', valueKey: 'appValue.platform',
    status: 'READY', href: '/admin', icon: SlidersHorizontal, key: 'platform' },
];

/**
 * Cả 16 Business App trong MỘT danh sách phẳng, theo đúng thứ tự hiến định.
 *
 * Đây là thứ trang chủ dựng ra: **một lưới duy nhất**, không tiêu đề nhóm.
 * Phân loại vẫn còn nguyên ở ba mảng trên — nó chỉ không xuất hiện trên màn
 * hình.
 */
export const MODULES: ModuleItem[] = [...WORKSPACES, ...SERVICES, ...PLATFORM];
