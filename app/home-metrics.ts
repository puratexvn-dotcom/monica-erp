import { createClient } from '@/utils/supabase/server';
import { isRole } from '@/lib/rbac';
import type { Role } from '@/types/erp';

// ============================================================================
// NẠP SỐ LIỆU THẬT CHO TRANG CHỦ (KPI + nhãn trạng thái trên thẻ)
//
// Đây là module server thuần, CHỈ được import bởi Server Component app/page.tsx.
// Cố ý KHÔNG khai báo 'use server': file này không phải Server Action, không cần
// phơi ra endpoint RPC cho client gọi.
//
// ─── QUYỀN ĐỌC (đã dò trực tiếp trên DB đang chạy) ───────────────────────
// Trang chủ là trang công khai — repo hiện KHÔNG có middleware.ts ở root nên
// không có gì chặn khách vãng lai.
//
// Đo thực tế bằng anon key: `orders`, `materials`, `hourly_production_logs`,
// `cartons` ĐỀU ĐỌC ĐƯỢC dù chưa đăng nhập, tức RLS trên DB thật KHÔNG khớp
// với migration 002 (file đó khai báo SELECT cần auth.role()='authenticated').
// Riêng `profiles` trả về rỗng.
//
// Vì vậy hàm này tự chặn ở tầng ứng dụng: chưa đăng nhập thì KHÔNG truy vấn
// gì cả và trả về 'unauthenticated'. Hai lý do:
//   1. Không phơi số liệu sản xuất, tên khách hàng cho người lạ xem.
//   2. `profiles` rỗng sẽ ra "0 tài khoản" — số SAI mà trông như thật. Trong
//      ERP, "không có PO nào" và "bạn không được phép xem" là hai chuyện khác
//      hẳn nhau, nên chỗ thiếu số phải hiện "—" chứ không bao giờ hiện 0.
//
// CẢNH BÁO BẢO MẬT (nằm ngoài phạm vi file này): anon key được nhúng sẵn
// trong bundle trình duyệt, nên bất kỳ ai cũng gọi thẳng REST API đọc được
// các bảng trên. Cần siết lại RLS ở phía Supabase — sửa ở đây không giải
// quyết được gốc rễ.
//
// ─── MÚI GIỜ ──────────────────────────────────────────────────────────────
// Vercel chạy UTC, nhà máy ở Asia/Ho_Chi_Minh (UTC+7). Nếu lấy "hôm nay" theo
// giờ server thì sản lượng ngày sẽ nhảy về 0 lúc 07:00 giờ Việt Nam. Mọi mốc
// thời gian dưới đây đều quy chiếu về nửa đêm giờ Việt Nam.
// ============================================================================

/** Dấu hiển thị khi không có số liệu — không bao giờ thay bằng 0 */
export const DASH = '—';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Ngày hiện tại theo giờ Việt Nam, dạng 'YYYY-MM-DD' (khớp cột kiểu DATE) */
function vnToday(): string {
  return new Date(Date.now() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Mốc nửa đêm giờ Việt Nam, quy về ISO UTC (khớp cột kiểu TIMESTAMPTZ) */
function vnStartOfTodayUtc(): string {
  return new Date(`${vnToday()}T00:00:00+07:00`).toISOString();
}

function vnDaysAgoUtc(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function vnDatePlus(days: number): string {
  return new Date(Date.now() + VN_OFFSET_MS + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

const nf = new Intl.NumberFormat('vi-VN');
const fmt = (n: number) => nf.format(Math.round(n));

export type MetricsStatus = 'ok' | 'unauthenticated' | 'error';

export interface KpiValue {
  value: string;
  unit?: string;
  delta: string;
}

export interface HomeMetrics {
  status: MetricsStatus;
  /** Vai trò người đang đăng nhập — trang chủ dùng để quyết định hiện khối nào */
  role: Role | null;
  /** true khi có ít nhất một truy vấn lỗi — số hiển thị có thể thiếu */
  partial: boolean;
  kpi: {
    activeOrders: KpiValue;
    outputToday: KpiValue;
    aqlRate: KpiValue;
    pendingShipments: KpiValue;
  };
  /** Nhãn góc thẻ, tra theo href của phân hệ */
  badges: Record<string, string>;
}

function blank(status: MetricsStatus): HomeMetrics {
  const none: KpiValue = { value: DASH, delta: status === 'unauthenticated' ? 'Cần đăng nhập' : 'Không lấy được số liệu' };
  return {
    status,
    role: null,
    partial: false,
    kpi: { activeOrders: none, outputToday: none, aqlRate: none, pendingShipments: none },
    badges: {},
  };
}

// ── Bọc truy vấn: một bảng lỗi không được làm sập cả trang ──────────────────
interface Res<T> {
  v: T;
  ok: boolean;
}

async function safeRows<T>(
  run: () => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<Res<T[]>> {
  try {
    const { data, error } = await run();
    if (error) return { v: [], ok: false };
    return { v: data ?? [], ok: true };
  } catch {
    return { v: [], ok: false };
  }
}

async function safeCount(
  run: () => PromiseLike<{ count: number | null; error: unknown }>,
): Promise<Res<number>> {
  try {
    const { count, error } = await run();
    if (error) return { v: 0, ok: false };
    return { v: count ?? 0, ok: true };
  } catch {
    return { v: 0, ok: false };
  }
}

// ── Kiểu dòng dữ liệu đọc về ────────────────────────────────────────────────
interface OrderRow {
  status: string | null;
  customer_name: string | null;
  delivery_date: string | null;
}
interface MaterialRow {
  stock_qty: number | null;
  min_stock_qty: number | null;
}
interface SewingRow {
  actual_qty: number | null;
  target_qty: number | null;
}
interface CutRow {
  total_actual_pcs: number | null;
}
interface QaRow {
  inspected_qty: number | null;
  passed_qty: number | null;
}
interface ShipmentRow {
  status: string | null;
}
interface FinishingRow {
  ironing_qty: number | null;
}
interface SubconRow {
  status: string | null;
}

/** Trạng thái coi như PO đã đóng — so sánh sau khi viết hoa toàn bộ,
 *  vì dữ liệu seed dùng 'Approved' còn migration mặc định 'APPROVED'. */
const CLOSED_ORDER_STATUS = new Set(['COMPLETED', 'CLOSED', 'CANCELLED', 'SHIPPED']);

const SUBCON_RUNNING = new Set(['ISSUED', 'IN_PROGRESS', 'PARTIAL_RECEIVED']);

const sum = (arr: Array<number | null | undefined>) => arr.reduce<number>((s, n) => s + (n ?? 0), 0);

export async function getHomeMetrics(): Promise<HomeMetrics> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return blank('error');
  }

  // Chưa đăng nhập -> không truy vấn gì cả (xem ghi chú QUYỀN ĐỌC ở đầu file)
  let role: Role | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return blank('unauthenticated');
    const raw = data.user.app_metadata?.role;
    role = isRole(raw) ? raw : null;
  } catch {
    return blank('error');
  }

  const todayDate = vnToday();
  const todayStart = vnStartOfTodayUtc();
  const last30d = vnDaysAgoUtc(30);
  const dueSoon = vnDatePlus(14);

  const [orders, materials, sewing, cutting, qa, shipments, finishing, subcon, cartonsPacked, staff] =
    await Promise.all([
      safeRows<OrderRow>(() => supabase.from('orders').select('status, customer_name, delivery_date')),
      safeRows<MaterialRow>(() => supabase.from('materials').select('stock_qty, min_stock_qty')),
      safeRows<SewingRow>(() =>
        supabase.from('hourly_production_logs').select('actual_qty, target_qty').eq('log_date', todayDate),
      ),
      safeRows<CutRow>(() =>
        supabase.from('cut_tickets').select('total_actual_pcs').gte('created_at', todayStart),
      ),
      safeRows<QaRow>(() =>
        supabase.from('qa_audit_reports').select('inspected_qty, passed_qty').gte('created_at', last30d),
      ),
      safeRows<ShipmentRow>(() => supabase.from('shipments').select('status')),
      safeRows<FinishingRow>(() =>
        supabase.from('finishing_logs').select('ironing_qty').gte('created_at', todayStart),
      ),
      safeRows<SubconRow>(() => supabase.from('subcon_orders').select('status')),
      safeCount(() =>
        supabase.from('cartons').select('id', { count: 'exact', head: true }).eq('status', 'PACKED'),
      ),
      safeCount(() => supabase.from('profiles').select('id', { count: 'exact', head: true })),
    ]);

  const partial = [orders, materials, sewing, cutting, qa, shipments, finishing, subcon, cartonsPacked, staff]
    .some((r) => !r.ok);

  // ── Đơn hàng ──────────────────────────────────────────────────────────────
  const openOrders = orders.v.filter((o) => !CLOSED_ORDER_STATUS.has((o.status ?? '').toUpperCase()));
  const activeOrderCount = openOrders.length;
  const dueSoonCount = openOrders.filter(
    (o) => o.delivery_date && o.delivery_date >= todayDate && o.delivery_date <= dueSoon,
  ).length;
  const customerCount = new Set(
    orders.v.map((o) => (o.customer_name ?? '').trim()).filter(Boolean),
  ).size;

  // ── Sản xuất trong ngày ───────────────────────────────────────────────────
  const sewnToday = sum(sewing.v.map((r) => r.actual_qty));
  const targetToday = sum(sewing.v.map((r) => r.target_qty));
  const cutToday = sum(cutting.v.map((r) => r.total_actual_pcs));
  const ironedToday = sum(finishing.v.map((r) => r.ironing_qty));

  // ── Chất lượng 30 ngày ────────────────────────────────────────────────────
  const inspected = sum(qa.v.map((r) => r.inspected_qty));
  const passed = sum(qa.v.map((r) => r.passed_qty));
  const passRate = inspected > 0 ? (passed / inspected) * 100 : null;

  // ── Kho & logistics ───────────────────────────────────────────────────────
  const lowStock = materials.v.filter(
    (m) => (m.stock_qty ?? 0) <= (m.min_stock_qty ?? 0),
  ).length;
  const draftShipments = shipments.v.filter((s) => (s.status ?? '').toUpperCase() === 'DRAFT').length;

  // ── Gia công ngoài ────────────────────────────────────────────────────────
  const subconRunning = subcon.v.filter((s) => SUBCON_RUNNING.has((s.status ?? '').toUpperCase())).length;
  const subconToSettle = subcon.v.filter((s) => (s.status ?? '').toUpperCase() === 'COMPLETED').length;

  return {
    status: 'ok',
    role,
    partial,
    kpi: {
      activeOrders: {
        value: orders.ok ? fmt(activeOrderCount) : DASH,
        unit: 'PO',
        delta: orders.ok
          ? dueSoonCount > 0
            ? `${fmt(dueSoonCount)} đơn giao trong 14 ngày`
            : 'Chưa có đơn tới hạn gần'
          : 'Không lấy được số liệu',
      },
      outputToday: {
        value: sewing.ok ? fmt(sewnToday) : DASH,
        unit: 'pcs',
        delta: !sewing.ok
          ? 'Không lấy được số liệu'
          : targetToday > 0
            ? `${Math.round((sewnToday / targetToday) * 100)}% kế hoạch ngày`
            : 'Chưa đặt kế hoạch ngày',
      },
      aqlRate: {
        value: qa.ok && passRate !== null ? passRate.toFixed(1).replace('.', ',') : DASH,
        unit: '%',
        delta: !qa.ok
          ? 'Không lấy được số liệu'
          : inspected > 0
            ? `${fmt(inspected)} pcs đã kiểm (30 ngày)`
            : 'Chưa có biên bản kiểm 30 ngày',
      },
      pendingShipments: {
        value: shipments.ok ? fmt(draftShipments) : DASH,
        unit: 'lô',
        delta: cartonsPacked.ok ? `${fmt(cartonsPacked.v)} thùng chờ nhập kho` : 'Không lấy được số liệu',
      },
    },
    badges: {
      '/giam-doc': orders.ok ? `${fmt(activeOrderCount)} PO đang chạy` : DASH,
      '/md': orders.ok
        ? dueSoonCount > 0
          ? `${fmt(dueSoonCount)} đơn tới hạn`
          : `${fmt(activeOrderCount)} đơn mở`
        : DASH,
      '/buyer': orders.ok ? `${fmt(customerCount)} khách hàng` : DASH,
      '/ke-toan': subcon.ok
        ? subconToSettle > 0
          ? `${fmt(subconToSettle)} đơn chờ chốt`
          : 'Đã chốt hết'
        : DASH,
      '/kho': materials.ok
        ? lowStock > 0
          ? `${fmt(lowStock)} mã chạm ngưỡng`
          : 'Tồn ổn định'
        : DASH,
      '/xuat-hang': cartonsPacked.ok ? `${fmt(cartonsPacked.v)} thùng chờ nhập` : DASH,
      '/qa': qa.ok && passRate !== null ? `Đạt ${passRate.toFixed(1).replace('.', ',')}%` : DASH,
      '/to-truong-cat': cutting.ok
        ? cutToday > 0
          ? `${fmt(cutToday)} pcs hôm nay`
          : 'Chưa có số hôm nay'
        : DASH,
      '/to-truong-may': sewing.ok
        ? sewnToday > 0
          ? `${fmt(sewnToday)} pcs hôm nay`
          : 'Chưa có số hôm nay'
        : DASH,
      '/hoan-thanh': finishing.ok
        ? ironedToday > 0
          ? `${fmt(ironedToday)} pcs đã ủi`
          : 'Chưa có số hôm nay'
        : DASH,
      '/subcon': subcon.ok
        ? subconRunning > 0
          ? `${fmt(subconRunning)} đơn đang chạy`
          : 'Không có đơn chạy'
        : DASH,
      '/admin': staff.ok ? `${fmt(staff.v)} tài khoản` : DASH,
    },
  };
}
