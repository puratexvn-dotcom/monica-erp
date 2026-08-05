import {
  LayoutDashboard, Handshake, Briefcase, CalendarRange, Factory, ShieldCheck,
  Package, Ship, Users, Wallet, IdCard, PieChart, MessagesSquare, Sparkles,
  FileText, SlidersHorizontal, Contact, Scissors, Shirt, PackageCheck,
  Warehouse, Calculator,
  type LucideIcon,
} from 'lucide-react';

import type { ModuleKey } from '@/lib/design/tokens';
// Chỉ nhập KIỂU — bị xoá lúc biên dịch, nên tệp này vẫn dùng được ở Server
// Component dù `lib/i18n.tsx` là module phía client.
import type { DictionaryKey } from '@/lib/i18n';
import type { Role } from '@/lib/rbac';

// ============================================================================
// BUSINESS APP REGISTRY — NGUỒN CHÂN LÝ DUY NHẤT VỀ "DOANH NGHIỆP CÓ GÌ"
//
// ═══ 🔴 REV 2 — TRANG CHỦ PHẢN ÁNH DOANH NGHIỆP, ⛔ KHÔNG PHẢN ÁNH MÃ ══
// Board *(Homepage Launcher Rev 2)*: *"Homepage phải hiển thị **đầy đủ tất cả
// Business Apps mà doanh nghiệp sẽ sử dụng**… ⛔ Không giới hạn ở 16 ô."*
//
// Bản trước có **16 ô**, và chúng là **16 Module đã có trong mã** — tức trang
// chủ đang kể câu chuyện của **kho mã nguồn**, ⛔ không kể câu chuyện của
// **doanh nghiệp**. Đó đúng thứ `Product Constitution §2` cấm: Homepage tồn tại
// để *"giúp người dùng nhìn thấy ngay doanh nghiệp của chính họ"*.
//
// ⇒ Nay **22 ô**, và thêm App mới chỉ là **thêm một dòng** ở đây.
//
// ═══ 🔑 BA TRƯỜNG ĐỊNH DANH, BA VIỆC KHÁC NHAU ═════════════════════════
//   `id`     khoá i18n — **duy nhất mỗi App**
//   `key`    khoá MÀU — **dùng chung trong một nhóm**, và đó là CHỦ Ý
//   `group`  nhóm nghiệp vụ — quyết định ô nằm ở khu nào
//
// ⚠️ Ba App sản xuất *(Cutting · Sewing · Finishing Leader)* **cùng dải màu
// `production`**. Trước Rev 2, luật là *"16 dải, ⛔ không dải nào dùng hai
// lần"*. Nay màu chuyển vai: từ **định danh của một App** thành **định danh của
// một NHÓM**. Ba ô xanh dương cạnh nhau **đọc ra là ba khâu của cùng một
// xưởng** — đó là thông tin, ⛔ không phải trùng lặp.
//
// 🔑 Và nó giải được bài toán thật: 22 App mà mỗi App một dải màu riêng thì
//    ⛔ không ai phân biệt nổi 22 sắc độ. Màu theo nhóm thì mắt chỉ phải nhớ
//    **sáu**.
//
// ═══ NHÓM THEO NĂNG LỰC, ⛔ KHÔNG THEO PHÒNG BAN ═══════════════════════
// Hiến pháp §13.3: *"The Homepage shall **not** be organized by organizational
// hierarchy, job titles or technical system modules."*
//
// Sáu nhóm dưới đây là **khu vực nghiệp vụ** *(việc gì đang diễn ra)*, ⛔ không
// phải sơ đồ tổ chức *(ai báo cáo cho ai)*. `BA-1 §8.6` đã chốt hướng này.
// ============================================================================

/** Sáu khu vực nghiệp vụ. **Thứ tự này là thứ tự trên màn hình** — nó đi theo
 *  **dòng chảy của một đơn hàng**: quyết định → bán → làm → chứa → giao → đỡ.
 *
 *  ⚠️ ⛔ Không sắp theo bảng chữ cái. Người dùng ⛔ không tra cứu trang chủ —
 *  họ **đi theo công việc**, và công việc thì có chiều. */
export const NHOM = ['dieuHanh', 'kinhDoanh', 'sanXuat', 'khoVan', 'hauCan', 'hoTro'] as const;
export type NhomKey = (typeof NHOM)[number];

interface ModuleBase {
  /**
   * Khoá **duy nhất** của App — gốc của mọi khoá i18n *(`appShort.<id>`…)*.
   *
   * ⚠️ Tách khỏi `key` từ Rev 2: nhiều App **dùng chung một dải màu**, nhưng
   * mỗi App phải có **câu chữ riêng**. Gộp hai thứ này lại thì ba App sản xuất
   * sẽ cùng đọc một dòng mô tả.
   */
  id: string;
  /**
   * Tên hiến định — **KHÔNG DỊCH** ở bất kỳ ngôn ngữ nào (Hiến pháp §45.3).
   * Bài kiểm kiến trúc mục ⑪ cưỡng chế điều này.
   */
  name: string;
  /** Khoá i18n cho câu mô tả đầy đủ — dùng ở tiêu đề Workspace *(`moTaKey`)*. */
  descKey: DictionaryKey;
  /**
   * 🔑 **DÒNG DUY NHẤT hiện trên ô** *(Rev 2)*.
   *
   * Board: *"Mỗi ô chỉ cần **Icon · Tên · 1 dòng mô tả ngắn**… ⛔ không hiển
   * thị business value dài trên Homepage."*
   *
   * ⚠️ Mục tiêu là **quét trong 2 giây**. Ba dòng chữ dưới mỗi ô nhân với 22 ô
   * là **66 dòng** — mắt ⛔ không quét được, nó phải **đọc**.
   */
  shortKey: DictionaryKey;
  /**
   * Business Value — **chỉ hiện khi rê chuột** *(Rev 2)*.
   *
   * Nó viết cho **Sales · Investor · Customer**, ⛔ không cho người vận hành.
   * Họ **đọc**, ⛔ không **quét** — nên chỗ của nó là tooltip, đúng lúc người
   * xem đã dừng lại ở một ô.
   */
  valueKey: DictionaryKey;
  icon: LucideIcon;
  /** Khoá tra màu. **Dùng chung trong một nhóm** — xem khối chú thích đầu tệp. */
  key: ModuleKey;
  /**
   * Khu vực nghiệp vụ. `Rev 4` bỏ tiêu đề nhóm khỏi màn hình, nhưng trường
   * này **giữ nguyên**: nó vẫn quyết định **thứ tự** trên lưới và **màu** của
   * ô, và tầng AI sẽ cần nó để hiểu App nào cùng một khâu.
   */
  group: NhomKey;
  /**
   * **Ai là người dùng chính** của App này.
   *
   * 🔑 Dành cho **AI Assistant**: khi người dùng hỏi *"tôi nên vào đâu"*, AI
   * cần biết App nào **viết cho vai của họ** — chứ ⛔ không chỉ App nào họ
   * **có quyền** mở. Hai câu đó khác nhau: `superadmin` có quyền mở mọi thứ
   * và **⛔ không phải người dùng chính** của App nào.
   *
   * ⚠️ 🔴 **ĐÂY ⛔ KHÔNG PHẢI MỘT NGUỒN PHÂN QUYỀN.** Nguồn duy nhất vẫn là
   * `MODULE_ACCESS` qua `canAccess()`. Trường này **mô tả**, ⛔ không **cho
   * phép** — và ⛔ không dòng mã nào được đọc nó để quyết định cho vào hay
   * chặn.
   *
   * 🔑 Vì sao phải nói ra: `TD-42` sinh ra đúng từ một bảng **trông có thẩm
   * quyền** mà **⛔ không điều khiển gì**. Bốn bảng RBAC ở `001` vẫn nằm đó
   * làm bằng chứng. ⛔ Đừng tạo cái thứ hai.
   */
  primaryUser: Role | null;
  /**
   * **Người dùng vào đây để LÀM GÌ** — một cụm động từ, ⛔ không phải mô tả.
   *
   * 🔑 Cũng dành cho AI: `workIntent` là thứ khớp được với câu người dùng gõ
   * *("tôi cần ghi sản lượng")*, trong khi `name` và `descKey` thì ⛔ không —
   * chúng nói App **là gì**, ⛔ không nói người ta **làm gì** với nó.
   */
workIntent: DictionaryKey;
}

/** App **đã có route** — bấm được. */
export interface ModuleReady extends ModuleBase {
  status: 'READY';
  href: string;
}

/**
 * App **⛔ chưa có route** — hiện, khoá, gắn nhãn *Coming Soon* *(Board `Q2`)*.
 *
 * 🔑 **⛔ KHÔNG có trường `href`.** Thử đọc `mod.href` trên nhánh này là **lỗi
 * biên dịch** — mạnh hơn mọi quy ước viết trong chú thích.
 */
export interface ModuleComingSoon extends ModuleBase {
  status: 'COMING_SOON';
}

export type ModuleItem = ModuleReady | ModuleComingSoon;

// ─── ① ĐIỀU HÀNH ────────────────────────────────────────────────────────────
const DIEU_HANH: ModuleItem[] = [
  { id: 'executive', name: 'Executive Center', descKey: 'appDesc.executive', shortKey: 'appShort.executive', valueKey: 'appValue.executive',
    status: 'READY', href: '/giam-doc', icon: LayoutDashboard, key: 'executive', group: 'dieuHanh', primaryUser: 'giamdoc', workIntent: 'workIntent.executive' },
];

// ─── ② KINH DOANH ───────────────────────────────────────────────────────────
const KINH_DOANH: ModuleItem[] = [
  { id: 'crm', name: 'CRM', descKey: 'appDesc.crm', shortKey: 'appShort.crm', valueKey: 'appValue.crm',
    status: 'COMING_SOON', icon: Contact, key: 'commercial', group: 'kinhDoanh', primaryUser: null, workIntent: 'workIntent.crm' },
  { id: 'commercial', name: 'Commercial', descKey: 'appDesc.commercial', shortKey: 'appShort.commercial', valueKey: 'appValue.commercial',
    status: 'READY', href: '/buyer', icon: Handshake, key: 'commercial', group: 'kinhDoanh', primaryUser: 'buyer', workIntent: 'workIntent.commercial' },
  { id: 'merchandising', name: 'Merchandising', descKey: 'appDesc.merchandising', shortKey: 'appShort.merchandising', valueKey: 'appValue.merchandising',
    status: 'READY', href: '/md', icon: Briefcase, key: 'merchandising', group: 'kinhDoanh', primaryUser: 'md', workIntent: 'workIntent.merchandising' },
];

// ─── ③ SẢN XUẤT ─────────────────────────────────────────────────────────────
const SAN_XUAT: ModuleItem[] = [
  { id: 'planning', name: 'Planning', descKey: 'appDesc.planning', shortKey: 'appShort.planning', valueKey: 'appValue.planning',
    status: 'COMING_SOON', icon: CalendarRange, key: 'planning', group: 'sanXuat', primaryUser: null, workIntent: 'workIntent.planning' },
  { id: 'production', name: 'Production', descKey: 'appDesc.production', shortKey: 'appShort.production', valueKey: 'appValue.production',
    status: 'COMING_SOON', icon: Factory, key: 'production', group: 'sanXuat', primaryUser: null, workIntent: 'workIntent.production' },
  { id: 'cuttingLeader', name: 'Cutting Leader', descKey: 'appDesc.cuttingLeader', shortKey: 'appShort.cuttingLeader', valueKey: 'appValue.cuttingLeader',
    status: 'READY', href: '/to-truong-cat', icon: Scissors, key: 'production', group: 'sanXuat', primaryUser: 'totruongcat', workIntent: 'workIntent.cuttingLeader' },
  { id: 'sewingLeader', name: 'Sewing Leader', descKey: 'appDesc.sewingLeader', shortKey: 'appShort.sewingLeader', valueKey: 'appValue.sewingLeader',
    status: 'READY', href: '/to-truong-may', icon: Shirt, key: 'production', group: 'sanXuat', primaryUser: 'totruongmay', workIntent: 'workIntent.sewingLeader' },
  { id: 'finishingLeader', name: 'Finishing Leader', descKey: 'appDesc.finishingLeader', shortKey: 'appShort.finishingLeader', valueKey: 'appValue.finishingLeader',
    status: 'READY', href: '/hoan-thanh', icon: PackageCheck, key: 'production', group: 'sanXuat', primaryUser: 'hoanthanh', workIntent: 'workIntent.finishingLeader' },
  { id: 'quality', name: 'Quality', descKey: 'appDesc.quality', shortKey: 'appShort.quality', valueKey: 'appValue.quality',
    status: 'READY', href: '/qa', icon: ShieldCheck, key: 'quality', group: 'sanXuat', primaryUser: 'qa', workIntent: 'workIntent.quality' },
  { id: 'subcontract', name: 'Subcontract', descKey: 'appDesc.subcontract', shortKey: 'appShort.subcontract', valueKey: 'appValue.subcontract',
    status: 'READY', href: '/subcon', icon: Users, key: 'subcontract', group: 'sanXuat', primaryUser: 'subcon', workIntent: 'workIntent.subcontract' },
];

// ─── ④ KHO VẬN ──────────────────────────────────────────────────────────────
const KHO_VAN: ModuleItem[] = [
  { id: 'warehouse', name: 'Raw Material Warehouse', descKey: 'appDesc.warehouse', shortKey: 'appShort.warehouse', valueKey: 'appValue.warehouse',
    status: 'READY', href: '/kho', icon: Package, key: 'warehouse', group: 'khoVan', primaryUser: 'kho', workIntent: 'workIntent.warehouse' },
  { id: 'warehouseFinished', name: 'Finished Goods Warehouse', descKey: 'appDesc.warehouseFinished', shortKey: 'appShort.warehouseFinished', valueKey: 'appValue.warehouseFinished',
    status: 'COMING_SOON', icon: Warehouse, key: 'warehouse', group: 'khoVan', primaryUser: null, workIntent: 'workIntent.warehouseFinished' },
];

// ─── ⑤ HẬU CẦN ──────────────────────────────────────────────────────────────
const HAU_CAN: ModuleItem[] = [
  { id: 'shipment', name: 'Shipment', descKey: 'appDesc.shipment', shortKey: 'appShort.shipment', valueKey: 'appValue.shipment',
    status: 'READY', href: '/xuat-hang', icon: Ship, key: 'shipment', group: 'hauCan', primaryUser: 'kho', workIntent: 'workIntent.shipment' },
];

// ─── ⑥ HỖ TRỢ ───────────────────────────────────────────────────────────────
const HO_TRO: ModuleItem[] = [
  { id: 'finance', name: 'Finance', descKey: 'appDesc.finance', shortKey: 'appShort.finance', valueKey: 'appValue.finance',
    status: 'READY', href: '/ke-toan', icon: Wallet, key: 'finance', group: 'hoTro', primaryUser: 'ketoan', workIntent: 'workIntent.finance' },
  { id: 'costing', name: 'Costing', descKey: 'appDesc.costing', shortKey: 'appShort.costing', valueKey: 'appValue.costing',
    status: 'COMING_SOON', icon: Calculator, key: 'finance', group: 'hoTro', primaryUser: null, workIntent: 'workIntent.costing' },
  { id: 'humanResources', name: 'Human Resources', descKey: 'appDesc.humanResources', shortKey: 'appShort.humanResources', valueKey: 'appValue.humanResources',
    status: 'COMING_SOON', icon: IdCard, key: 'humanResources', group: 'hoTro', primaryUser: null, workIntent: 'workIntent.humanResources' },
  { id: 'reporting', name: 'Business Reporting', descKey: 'appDesc.reporting', shortKey: 'appShort.reporting', valueKey: 'appValue.reporting',
    status: 'COMING_SOON', icon: PieChart, key: 'reporting', group: 'hoTro', primaryUser: null, workIntent: 'workIntent.reporting' },
  { id: 'communication', name: 'Business Communication', descKey: 'appDesc.communication', shortKey: 'appShort.communication', valueKey: 'appValue.communication',
    status: 'COMING_SOON', icon: MessagesSquare, key: 'communication', group: 'hoTro', primaryUser: null, workIntent: 'workIntent.communication' },
  // AI Assistant là mục DUY NHẤT dùng dải chuyển sắc (Điều 44.2).
  { id: 'ai', name: 'AI Assistant', descKey: 'appDesc.ai', shortKey: 'appShort.ai', valueKey: 'appValue.ai',
    status: 'COMING_SOON', icon: Sparkles, key: 'ai', group: 'hoTro', primaryUser: null, workIntent: 'workIntent.ai' },
  { id: 'documents', name: 'Documents', descKey: 'appDesc.documents', shortKey: 'appShort.documents', valueKey: 'appValue.documents',
    status: 'COMING_SOON', icon: FileText, key: 'documents', group: 'hoTro', primaryUser: null, workIntent: 'workIntent.documents' },
  { id: 'platform', name: 'Platform Services', descKey: 'appDesc.platform', shortKey: 'appShort.platform', valueKey: 'appValue.platform',
    status: 'READY', href: '/admin', icon: SlidersHorizontal, key: 'platform', group: 'hoTro', primaryUser: 'superadmin', workIntent: 'workIntent.platform' },
];

/**
 * Cả 22 Business App, **theo đúng thứ tự nhóm**.
 *
 * ⚠️ Thứ tự là **ràng buộc**, ⛔ không phải chi tiết: vị trí một App trong lưới
 * là **trí nhớ cơ bắp** *(`P13`)*, và sắp lại phải qua ADR.
 */
export const MODULES: ModuleItem[] = [
  ...DIEU_HANH, ...KINH_DOANH, ...SAN_XUAT, ...KHO_VAN, ...HAU_CAN, ...HO_TRO,
];

/** Nhóm → danh sách App, giữ nguyên thứ tự khai báo. Trang chủ dựng theo đây. */
export const MODULES_THEO_NHOM: ReadonlyArray<{ nhom: NhomKey; apps: readonly ModuleItem[] }> = [
  { nhom: 'dieuHanh', apps: DIEU_HANH },
  { nhom: 'kinhDoanh', apps: KINH_DOANH },
  { nhom: 'sanXuat', apps: SAN_XUAT },
  { nhom: 'khoVan', apps: KHO_VAN },
  { nhom: 'hauCan', apps: HAU_CAN },
  { nhom: 'hoTro', apps: HO_TRO },
];

// ⚠️ Ba mảng cũ *(`WORKSPACES` · `SERVICES` · `PLATFORM`)* đã được thay bằng
// sáu nhóm nghiệp vụ. Phân loại hiến định *(Workspace / Global Service /
// Platform)* mô tả **BẢN CHẤT** từng thứ; nhóm nghiệp vụ mô tả **NƠI NGƯỜI
// DÙNG TÌM NÓ**. Hai cách phân loại khác nhau, và trang chủ phục vụ cách thứ
// hai — đúng `Product Constitution §2`.

// ─── HÀM TRA CỨU — ⛔ ĐỂ KHÔNG NƠI NÀO VIẾT CỨNG MỘT CON SỐ ─────────────────
//
// Board Rev 3: *"Homepage ⛔ không được hardcode số lượng Business Apps.
// Chuyển sang đọc từ **Business App Registry**… Homepage **chỉ render**."*
//
// ⚠️ Bản trước tôi tự vi phạm điều đó ngay trong khung chờ: 
// viết cứng số ô mỗi nhóm. Thêm một App là khung chờ **lệch** khỏi nội dung
// thật — và cú lệch đó **⛔ không phép kiểm nào bắt được**, nó chỉ hiện ra
// thành một cú nhảy bố cục mà ⛔ không ai truy được nguyên nhân.

/** Tổng số Business App. ⛔ Không nơi nào được viết cứng con số này. */
export const SO_BUSINESS_APP = MODULES.length;

/** Số ô mỗi nhóm, đúng thứ tự hiển thị — khung chờ dựng theo đây. */
export const SO_O_MOI_NHOM: readonly number[] = MODULES_THEO_NHOM.map((g) => g.apps.length);

/** Tra một App theo uid=197609(JOSEP) gid=197609 groups=197609.  khi ⛔ không có — ⛔ không ném lỗi, vì tra
 *  hụt là chuyện **dữ liệu**, ⛔ không phải chuyện **lập trình sai**. */
export function timApp(id: string): ModuleItem | null {
  return MODULES.find((m) => m.id === id) ?? null;
}
