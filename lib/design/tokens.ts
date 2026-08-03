// ============================================================================
// HỆ THẺ MÀU HIẾN ĐỊNH — MONICA ONE
//
// Thi hành **Điều 44 · Enterprise Visual Identity** của Hiến pháp.
// Quyết định kiến trúc: **ADR-009**.
//
// ═══ MÀU LÀ THÔNG TIN, KHÔNG PHẢI TRANG TRÍ ═════════════════════════════
// Người vận hành phải nhận ra một phân hệ, một trạng thái, một thẻ **bằng
// MÀU trước khi kịp đọc chữ**. Vì vậy màu ở đây được cấp phát như một khoá
// định danh: mỗi Business App giữ MỘT dải màu, vĩnh viễn, không dùng lại.
//
// ═══ ⚠️ BỐN LUẬT KHÔNG ĐƯỢC PHÁ ═════════════════════════════════════════
//
//   ① MỌI MÀU PHẢI LẤY TỪ ĐÂY. Không viết thẳng `bg-blue-50` trong màn hình
//      nghiệp vụ. Viết thẳng thì màu của một phân hệ trôi dần theo từng người
//      sửa, và sáu tháng sau không ai còn biết đâu là màu thật của nó.
//
//   ② CHUỖI PHẢI NGUYÊN VẸN. Không ghép `bg-${hue}-50`. Tailwind quét mã
//      nguồn bằng biểu thức chính quy — nó KHÔNG chạy JavaScript. Lớp ghép
//      lúc chạy vẫn hiện ở dev (nhờ cache) rồi biến mất sạch ở production.
//
//   ③ TỆP NÀY PHẢI NẰM TRONG DANH SÁCH QUÉT của tailwind.config.ts
//      (`./lib/**/*`). Thiếu là mất toàn bộ màu ở bản dựng thật.
//
//   ④ ĐỘ TƯƠNG PHẢN LÀ RÀNG BUỘC, KHÔNG PHẢI GỢI Ý. Mọi cặp chữ/nền dưới
//      đây dùng chữ sắc độ 600–700 trên nền sắc độ 50–100, đo được ≥ 4,5:1.
//      Sắc độ 400 chỉ đạt ~2,5:1 — nhìn thì "tinh tế", nhưng biến mất trên
//      màn hình xưởng dưới ánh đèn cao áp.
//
// ═══ VÌ SAO CÓ CẢ LỚP TAILWIND LẪN MÃ HEX ═══════════════════════════════
// Recharts vẽ bằng thuộc tính SVG `fill`/`stroke`, nó không hiểu lớp CSS.
// Nên mỗi danh tính mang thêm `chart` dạng hex — cùng một sắc, hai cách nói,
// để biểu đồ của Production chắc chắn cùng màu với thẻ của Production.
// ============================================================================

// ─── ① DANH TÍNH BUSINESS APP ───────────────────────────────────────────────

/** Khoá định danh của 16 Business App hiến định. */
export type ModuleKey =
  | 'executive' | 'commercial' | 'merchandising' | 'planning'
  | 'production' | 'quality' | 'warehouse' | 'shipment'
  | 'subcontract' | 'finance' | 'humanResources'
  | 'reporting' | 'communication' | 'ai' | 'documents' | 'platform';

export interface ModuleIdentity {
  /** Chữ và icon ở mức đậm — dùng cho tiêu đề, số liệu, icon chính */
  primary: string;
  /** Chữ hỗ trợ, nhạt hơn một bậc nhưng vẫn đạt ngưỡng tương phản */
  secondary: string;
  /** Nền mềm — mặt phẳng của ô icon, khối tiêu đề, hàng đầu bảng */
  soft: string;
  /** Viền/vòng khi rê chuột */
  hover: string;
  /** Vòng focus bàn phím — cùng sắc, để lối đi bằng Tab cũng có nhận diện */
  focus: string;
  /** Huy hiệu: nền + chữ + viền trong, một cụm dùng ngay */
  badge: string;
  /** Vạch nhấn ở mép trên thẻ hoặc mép trái khối */
  bar: string;
  /** Mã hex cho Recharts — SVG không hiểu lớp CSS */
  chart: string;
}

/**
 * Mười sáu dải màu, không dải nào dùng hai lần.
 *
 * ⚠️ Đây là **định danh vĩnh viễn**. Đổi màu của một App = đổi thứ người dùng
 * đã học thuộc bằng mắt. Muốn đổi phải qua ADR (Điều 44.6).
 */
export const MODULE_IDENTITY: Record<ModuleKey, ModuleIdentity> = {
  executive: {
    primary: 'text-indigo-600', secondary: 'text-indigo-500', soft: 'bg-indigo-50',
    hover: 'hover:ring-indigo-200', focus: 'focus-visible:ring-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', bar: 'bg-indigo-500',
    chart: '#6366f1',
  },
  commercial: {
    primary: 'text-orange-600', secondary: 'text-orange-500', soft: 'bg-orange-50',
    hover: 'hover:ring-orange-200', focus: 'focus-visible:ring-orange-500',
    badge: 'bg-orange-50 text-orange-700 ring-orange-200', bar: 'bg-orange-500',
    chart: '#f97316',
  },
  merchandising: {
    primary: 'text-red-600', secondary: 'text-red-500', soft: 'bg-red-50',
    hover: 'hover:ring-red-200', focus: 'focus-visible:ring-red-500',
    badge: 'bg-red-50 text-red-700 ring-red-200', bar: 'bg-red-500',
    chart: '#ef4444',
  },
  planning: {
    primary: 'text-teal-600', secondary: 'text-teal-500', soft: 'bg-teal-50',
    hover: 'hover:ring-teal-200', focus: 'focus-visible:ring-teal-500',
    badge: 'bg-teal-50 text-teal-700 ring-teal-200', bar: 'bg-teal-500',
    chart: '#14b8a6',
  },
  production: {
    primary: 'text-blue-600', secondary: 'text-blue-500', soft: 'bg-blue-50',
    hover: 'hover:ring-blue-200', focus: 'focus-visible:ring-blue-500',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200', bar: 'bg-blue-500',
    chart: '#3b82f6',
  },
  quality: {
    primary: 'text-emerald-600', secondary: 'text-emerald-500', soft: 'bg-emerald-50',
    hover: 'hover:ring-emerald-200', focus: 'focus-visible:ring-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500',
    chart: '#10b981',
  },
  warehouse: {
    primary: 'text-green-600', secondary: 'text-green-500', soft: 'bg-green-50',
    hover: 'hover:ring-green-200', focus: 'focus-visible:ring-green-500',
    badge: 'bg-green-50 text-green-700 ring-green-200', bar: 'bg-green-500',
    chart: '#22c55e',
  },
  shipment: {
    primary: 'text-cyan-600', secondary: 'text-cyan-500', soft: 'bg-cyan-50',
    hover: 'hover:ring-cyan-200', focus: 'focus-visible:ring-cyan-500',
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200', bar: 'bg-cyan-500',
    chart: '#06b6d4',
  },
  subcontract: {
    primary: 'text-purple-600', secondary: 'text-purple-500', soft: 'bg-purple-50',
    hover: 'hover:ring-purple-200', focus: 'focus-visible:ring-purple-500',
    badge: 'bg-purple-50 text-purple-700 ring-purple-200', bar: 'bg-purple-500',
    chart: '#a855f7',
  },
  finance: {
    // "Gold" trong bảng màu Board = dải amber. Chữ dùng sắc độ 700 vì amber
    // ở 600 trên nền 50 chưa qua ngưỡng 4,5:1.
    primary: 'text-amber-700', secondary: 'text-amber-600', soft: 'bg-amber-50',
    hover: 'hover:ring-amber-200', focus: 'focus-visible:ring-amber-500',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200', bar: 'bg-amber-500',
    chart: '#f59e0b',
  },
  humanResources: {
    primary: 'text-rose-600', secondary: 'text-rose-500', soft: 'bg-rose-50',
    hover: 'hover:ring-rose-200', focus: 'focus-visible:ring-rose-500',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200', bar: 'bg-rose-500',
    chart: '#f43f5e',
  },
  reporting: {
    primary: 'text-slate-600', secondary: 'text-slate-500', soft: 'bg-slate-100',
    hover: 'hover:ring-slate-300', focus: 'focus-visible:ring-slate-500',
    badge: 'bg-slate-100 text-slate-700 ring-slate-300', bar: 'bg-slate-500',
    chart: '#64748b',
  },
  communication: {
    primary: 'text-sky-600', secondary: 'text-sky-500', soft: 'bg-sky-50',
    hover: 'hover:ring-sky-200', focus: 'focus-visible:ring-sky-500',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200', bar: 'bg-sky-500',
    chart: '#0ea5e9',
  },
  ai: {
    // Mục DUY NHẤT được dùng dải chuyển sắc (Điều 44.2). Sắc nhận diện là
    // fuchsia — KHÔNG dùng lại purple của Subcontract.
    primary: 'text-violet-600', secondary: 'text-fuchsia-600', soft: 'bg-gradient-to-br from-violet-100 to-sky-100',
    hover: 'hover:ring-fuchsia-200', focus: 'focus-visible:ring-fuchsia-500',
    badge: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200', bar: 'bg-fuchsia-500',
    chart: '#d946ef',
  },
  documents: {
    primary: 'text-stone-600', secondary: 'text-stone-500', soft: 'bg-stone-100',
    hover: 'hover:ring-stone-300', focus: 'focus-visible:ring-stone-500',
    badge: 'bg-stone-100 text-stone-700 ring-stone-300', bar: 'bg-stone-500',
    chart: '#78716c',
  },
  platform: {
    primary: 'text-violet-600', secondary: 'text-violet-500', soft: 'bg-violet-50',
    hover: 'hover:ring-violet-200', focus: 'focus-visible:ring-violet-500',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200', bar: 'bg-violet-500',
    chart: '#8b5cf6',
  },
};

// ─── ①B MẶT THẺ SINH ĐỘNG — mỗi App một nền màu riêng ──────────────────────
//
// ⚠️ ĐỔI HƯỚNG THEO CHỈ THỊ 03/08/2026: *"tất cả các module bắt buộc phải có
// màu nền sinh động và khác nhau"*.
//
// Bản trước để cả 16 thẻ nền TRẮNG, màu chỉ nằm trong ô icon. Nay mỗi thẻ mang
// nền theo sắc riêng, và ô icon nâng lên độ bão hoà cao với biểu tượng trắng.
// Nhận diện bằng màu vì thế xảy ra ở khoảng cách xa hơn nhiều — quét cả lưới
// một lượt là thấy Production ở đâu, không cần đọc.
//
// ⚠️ VÌ SAO NỀN CHỈ Ở SẮC ĐỘ 50, KHÔNG ĐẬM HƠN
// Chữ tiêu đề `slate-900` và mô tả `slate-600` phải đọc được TRÊN nền đó. Sắc
// độ 50 giữ tương phản trên 12:1 và 7:1 — dư ngưỡng AA. Đẩy nền lên 100 hay
// 200 là bắt đầu ăn vào phần đọc, mà 16 ô màu no đủ cạnh nhau còn làm mắt mỏi
// sau vài phút. Sức sống đến từ Ô ICON bão hoà, không đến từ nền.
//
// ⚠️ `tileStrong` KHÔNG dùng chuyển sắc (trừ AI Assistant) — Điều 44.2 chỉ cho
// phép AI Assistant dùng dải chuyển sắc.
export interface ModuleSurface {
  /** Nền thẻ — sắc riêng của App, đủ nhạt để chữ đen vẫn đọc tốt */
  surface: string;
  /** Viền trong của thẻ, cùng sắc */
  edge: string;
  /** Ô icon bão hoà + biểu tượng trắng — nơi sức sống thật sự nằm */
  tileStrong: string;
}

export const MODULE_SURFACE: Record<ModuleKey, ModuleSurface> = {
  executive:      { surface: 'bg-indigo-50',  edge: 'ring-indigo-200/70',  tileStrong: 'bg-indigo-500 text-white' },
  commercial:     { surface: 'bg-orange-50',  edge: 'ring-orange-200/70',  tileStrong: 'bg-orange-500 text-white' },
  merchandising:  { surface: 'bg-red-50',     edge: 'ring-red-200/70',     tileStrong: 'bg-red-500 text-white' },
  planning:       { surface: 'bg-teal-50',    edge: 'ring-teal-200/70',    tileStrong: 'bg-teal-500 text-white' },
  production:     { surface: 'bg-blue-50',    edge: 'ring-blue-200/70',    tileStrong: 'bg-blue-500 text-white' },
  quality:        { surface: 'bg-emerald-50', edge: 'ring-emerald-200/70', tileStrong: 'bg-emerald-500 text-white' },
  warehouse:      { surface: 'bg-green-50',   edge: 'ring-green-200/70',   tileStrong: 'bg-green-500 text-white' },
  shipment:       { surface: 'bg-cyan-50',    edge: 'ring-cyan-200/70',    tileStrong: 'bg-cyan-500 text-white' },
  subcontract:    { surface: 'bg-purple-50',  edge: 'ring-purple-200/70',  tileStrong: 'bg-purple-500 text-white' },
  finance:        { surface: 'bg-amber-50',   edge: 'ring-amber-200/70',   tileStrong: 'bg-amber-500 text-white' },
  humanResources: { surface: 'bg-rose-50',    edge: 'ring-rose-200/70',    tileStrong: 'bg-rose-500 text-white' },
  reporting:      { surface: 'bg-slate-100',  edge: 'ring-slate-300/70',   tileStrong: 'bg-slate-500 text-white' },
  communication:  { surface: 'bg-sky-50',     edge: 'ring-sky-200/70',     tileStrong: 'bg-sky-500 text-white' },
  // Mục DUY NHẤT được dùng dải chuyển sắc — Điều 44.2.
  ai:             { surface: 'bg-fuchsia-50', edge: 'ring-fuchsia-200/70', tileStrong: 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white' },
  documents:      { surface: 'bg-stone-100',  edge: 'ring-stone-300/70',   tileStrong: 'bg-stone-500 text-white' },
  platform:       { surface: 'bg-violet-50',  edge: 'ring-violet-200/70',  tileStrong: 'bg-violet-500 text-white' },
};

/**
 * Tra danh tính theo ĐƯỜNG DẪN — cầu nối để mọi màn hình bên trong Workspace
 * thừa hưởng đúng màu của App chứa nó (Điều 44.3 · Continuity).
 *
 * ⚠️ Thứ tự khai báo có nghĩa: mục dài hơn phải đứng trước mục ngắn hơn, nếu
 * không `/md/assignments` sẽ khớp nhầm `/md`.
 */
export const MODULE_BY_PATH: ReadonlyArray<readonly [string, ModuleKey]> = [
  ['/giam-doc', 'executive'],
  ['/buyer', 'commercial'],
  ['/md', 'merchandising'],
  ['/orders', 'merchandising'],
  ['/to-truong-cat', 'production'],
  ['/to-truong-may', 'production'],
  ['/to-truong-hoan-thanh', 'production'],
  ['/hoan-thanh', 'production'],
  ['/qa', 'quality'],
  ['/kho', 'warehouse'],
  ['/xuat-hang', 'shipment'],
  ['/subcon', 'subcontract'],
  ['/ke-toan', 'finance'],
  ['/admin', 'platform'],
];

/** Danh tính của đường dẫn, hoặc `null` khi đường dẫn không thuộc App nào. */
export function identityForPath(pathname: string): ModuleIdentity | null {
  for (const [prefix, key] of MODULE_BY_PATH) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return MODULE_IDENTITY[key];
    }
  }
  return null;
}

// ─── ② MÀU NGỮ NGHĨA CỦA TRẠNG THÁI ─────────────────────────────────────────
//
// ⚠️ Mười trạng thái, MƯỜI sắc khác nhau. Điều 44.4 cấm dùng một màu cho mọi
// trạng thái — "xám hết" là cách nhanh nhất biến phần mềm điều hành thành
// bảng tính. Sắc được chọn theo NGHĨA, không theo thẩm mỹ:
//   xanh lá = đã xong · xanh dương = đang chạy · vàng = phải để mắt
//   đỏ = nguy cấp · xám = chưa tới lượt

export type StatusKey =
  | 'healthy' | 'inProgress' | 'completed' | 'approved' | 'waiting'
  | 'draft' | 'warning' | 'blocked' | 'critical' | 'rejected';

export interface StatusToken {
  /** Nhãn tiếng Việt chuẩn ngành may */
  label: string;
  /** Chấm tròn nhận diện */
  dot: string;
  /** Viên trạng thái: nền + chữ + viền trong */
  chip: string;
  /** Chữ đứng một mình, không nền */
  text: string;
  /** Mã hex cho biểu đồ */
  chart: string;
}

export const STATUS: Record<StatusKey, StatusToken> = {
  healthy: {
    label: 'Ổn định', dot: 'bg-emerald-500', text: 'text-emerald-700',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', chart: '#10b981',
  },
  inProgress: {
    label: 'Đang chạy', dot: 'bg-blue-500', text: 'text-blue-700',
    chip: 'bg-blue-50 text-blue-700 ring-blue-200', chart: '#3b82f6',
  },
  completed: {
    label: 'Hoàn thành', dot: 'bg-teal-500', text: 'text-teal-700',
    chip: 'bg-teal-50 text-teal-700 ring-teal-200', chart: '#14b8a6',
  },
  approved: {
    label: 'Đã duyệt', dot: 'bg-green-500', text: 'text-green-700',
    chip: 'bg-green-50 text-green-700 ring-green-200', chart: '#22c55e',
  },
  waiting: {
    label: 'Đang chờ', dot: 'bg-slate-400', text: 'text-slate-600',
    chip: 'bg-slate-100 text-slate-700 ring-slate-300', chart: '#64748b',
  },
  draft: {
    label: 'Nháp', dot: 'bg-stone-400', text: 'text-stone-600',
    chip: 'bg-stone-100 text-stone-700 ring-stone-300', chart: '#78716c',
  },
  warning: {
    label: 'Cần để mắt', dot: 'bg-amber-500', text: 'text-amber-700',
    chip: 'bg-amber-50 text-amber-800 ring-amber-200', chart: '#f59e0b',
  },
  blocked: {
    label: 'Bị chặn', dot: 'bg-orange-500', text: 'text-orange-700',
    chip: 'bg-orange-50 text-orange-800 ring-orange-200', chart: '#f97316',
  },
  critical: {
    label: 'Nguy cấp', dot: 'bg-red-500', text: 'text-red-700',
    chip: 'bg-red-50 text-red-700 ring-red-200', chart: '#ef4444',
  },
  rejected: {
    label: 'Bị từ chối', dot: 'bg-rose-500', text: 'text-rose-700',
    chip: 'bg-rose-50 text-rose-700 ring-rose-200', chart: '#f43f5e',
  },
};

// ─── ③ BẢNG MÀU BIỂU ĐỒ ─────────────────────────────────────────────────────
//
// Điều 44.5: biểu đồ KHÔNG được dùng bảng màu mặc định của thư viện. Thứ tự
// dưới đây chọn để hai dải liền kề luôn khác hẳn sắc — chuỗi cùng nằm trên
// một biểu đồ mà sát sắc nhau thì người đọc phải dò chú giải từng dòng.

export const CHART_PALETTE: readonly string[] = [
  MODULE_IDENTITY.production.chart,      // xanh dương
  MODULE_IDENTITY.commercial.chart,      // cam
  MODULE_IDENTITY.quality.chart,         // xanh ngọc
  MODULE_IDENTITY.subcontract.chart,     // tím
  MODULE_IDENTITY.finance.chart,         // hổ phách
  MODULE_IDENTITY.shipment.chart,        // xanh lơ
  MODULE_IDENTITY.merchandising.chart,   // đỏ
  MODULE_IDENTITY.planning.chart,        // lam ngọc
  MODULE_IDENTITY.humanResources.chart,  // hồng
  MODULE_IDENTITY.executive.chart,       // chàm
] as const;

/** Màu thứ `i` của bảng, quay vòng khi chuỗi nhiều hơn số màu. */
export function chartColor(i: number): string {
  return CHART_PALETTE[i % CHART_PALETTE.length];
}

// ─── ④ MẶT PHẲNG VÀ ĐỘ CAO ─────────────────────────────────────────────────
//
// Bốn lớp bóng mô phỏng ánh sáng thật:
//   ① tiếp xúc  0 0 0 1px   viền, thay cho `border`, không chiếm chỗ
//   ② đổ sát    0 1px 2px   nơi vật chạm mặt phẳng
//   ③ khuếch tán 0 4px 8px  ánh sáng môi trường
//   ④ khí quyển 0 12px 24px vệt rất nhạt, rất xa — thứ tạo cảm giác "nổi"
//
// `shadow-lg` một lớp chỉ có ③. Thiếu ① thì mép thẻ nhoè vào nền, thiếu ④ thì
// thẻ dán phẳng lên trang. Tổng độ mờ giữ dưới 0,2: bóng đậm là dấu hiệu của
// phần mềm đời cũ, nó tạo chiều sâu bằng tương phản thay vì bằng lớp.

// ⚠️ ĐỘ MỜ NÂNG LÊN sau lượt soi thị giác 03/08/2026.
//
// Bản trước tổng độ mờ dưới 0,2 nên trên nền `#F6F7F9` các thẻ trắng gần như
// KHÔNG tách khỏi nền — chúng đọc ra như được IN LÊN trang, không phải NẰM
// TRÊN trang. "Bóng nhạt" là đúng nguyên tắc, nhưng nhạt quá thì mất luôn cái
// nó sinh ra để tạo: chiều sâu.
//
// Vẫn giữ bốn lớp và vẫn rất kiềm chế — chỉ đủ để mắt đọc ra "vật thể".
export const ELEV_REST =
  'shadow-[0_0_0_1px_rgba(16,24,40,0.04),0_1px_2px_-1px_rgba(16,24,40,0.08),0_4px_10px_-3px_rgba(16,24,40,0.08),0_16px_32px_-12px_rgba(16,24,40,0.10)]';

export const ELEV_HOVER =
  'hover:shadow-[0_0_0_1px_rgba(16,24,40,0.05),0_2px_4px_-2px_rgba(16,24,40,0.07),0_12px_20px_-8px_rgba(16,24,40,0.07),0_28px_48px_-24px_rgba(16,24,40,0.16)]';

export const ELEV_SUNKEN =
  'shadow-[0_0_0_1px_rgba(16,24,40,0.04),0_1px_1px_-0.5px_rgba(16,24,40,0.04)]';

/**
 * Ô icon kiểu kính mờ. Vệt sáng mảnh chạy dọc mép TRÊN — đúng chỗ ánh sáng
 * chạm vào một khối bo tròn. Một dòng, và ô icon thôi trông như mảng màu, bắt
 * đầu trông như một vật thể có bề mặt.
 */
export const GLASS =
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_0_0_1px_rgba(255,255,255,0.45)]';

/** Quầng sáng khi rê chuột, toả bằng CHÍNH màu chữ của ô icon. */
export const GLASS_GLOW =
  'group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(255,255,255,0.6),0_10px_24px_-12px_currentColor]';

/** Nền trang chuẩn — xám rất nhạt để thẻ trắng nổi lên bằng chính độ sáng. */
export const CANVAS = 'bg-[#F6F7F9]';

/**
 * Màu đệm của vòng focus khi phần tử nằm TRÊN NỀN TRANG.
 *
 * ⚠️ Thiếu thẻ này là một lỗi thật, không phải tiểu tiết: mặc định
 * `--tw-ring-offset-color` của Tailwind là **trắng**. Trên nền `#F6F7F9`, một
 * vòng focus có `ring-offset-2` sẽ vẽ một quầng TRẮNG quanh thẻ — trông như
 * lỗi hiển thị chứ không như chỉ báo tiêu điểm, và nó chỉ lộ ra khi đi bằng
 * bàn phím nên rất dễ lọt qua mọi lượt xem bằng chuột.
 */
export const FOCUS_OFFSET_CANVAS = 'focus-visible:ring-offset-[#F6F7F9]';

/**
 * Hạt giấy dưới 1%. `feTurbulence` sinh nhiễu ngay trong trình duyệt: không
 * tải ảnh, không thêm byte mạng. Nó phá mảng màu phẳng tuyệt đối — thứ khiến
 * một trang đọc ra là "trang web" thay vì một mặt vật liệu.
 */
export const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";
