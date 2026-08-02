import { createClient } from '@/utils/supabase/server';
import { isRole } from '@/lib/rbac';
import type { Role } from '@/types/erp';
import { ngayVN } from '@/lib/time';

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

/** Ngày hiện tại theo giờ Việt Nam, dạng 'YYYY-MM-DD' (khớp cột kiểu DATE) */
const vnToday = ngayVN;

/** Mốc nửa đêm giờ Việt Nam, quy về ISO UTC (khớp cột kiểu TIMESTAMPTZ) */
function vnStartOfTodayUtc(): string {
  return new Date(`${vnToday()}T00:00:00+07:00`).toISOString();
}

function vnDaysAgoUtc(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function vnDatePlus(days: number): string {
  return new Date(new Date(`${ngayVN()}T00:00:00+07:00`).getTime() + days * 24 * 60 * 60 * 1000)
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

/** Một dòng trong khối "Hoạt động gần đây" — dựng từ đơn hàng THẬT, không bịa */
export interface ActivityRow {
  poNumber: string;
  customer: string;
  status: string;
  /** `YYYY-MM-DD` hoặc null khi chưa chốt ngày giao */
  deliveryDate: string | null;
  /** true khi ngày giao đã qua mà đơn chưa đóng */
  late: boolean;
}

/** Tiến độ kế hoạch ngày — dùng cho thanh tiến trình ở bảng điều hành */
export interface ProgressValue {
  /** 0–100, hoặc null khi chưa đặt kế hoạch ngày */
  percent: number | null;
  done: string;
  target: string;
}

/**
 * Một việc cần xử lý hôm nay. Ba nguồn, tất cả từ dữ liệu THẬT:
 *   • phần việc đang chạy mà CHƯA gửi báo cáo ngày  (Playbook XXX mục 7)
 *   • biên bản QA có hàng lỗi trong 7 ngày
 *   • lô hàng có ETD đúng hôm nay
 */
export interface TaskRow {
  kind: 'REPORT_MISSING' | 'QA_DEFECT' | 'SHIP_TODAY';
  title: string;
  detail: string;
  href: string;
}

/** Ba con số cảnh báo vận hành. `null` = chưa đọc được, KHÔNG phải 0. */
export interface OpsCounts {
  reportMissing: number | null;
  qaDefect: number | null;
  shipToday: number | null;
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
  /** Đơn hàng mới nhất — tối đa 6 dòng, đã sắp xếp giảm dần theo ngày giao */
  recent: ActivityRow[];
  /** Tiến độ sản lượng so với kế hoạch NGÀY */
  dayProgress: ProgressValue;
  /** Việc cần xử lý hôm nay — tối đa 6 dòng, ưu tiên việc trễ trước */
  tasks: TaskRow[];
  /** Ba con số cảnh báo vận hành */
  ops: OpsCounts;
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
    recent: [],
    dayProgress: { percent: null, done: DASH, target: DASH },
    tasks: [],
    ops: { reportMissing: null, qaDefect: null, shipToday: null },
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
  po_number?: string | null;
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
interface AssignmentRow {
  id: string;
  assignment_no: string | null;
  status: string | null;
  planned_finish: string | null;
}
interface DailyReportRow {
  assignment_id: string | null;
}
interface QaDefectRow {
  line_name: string | null;
  defect_qty: number | null;
  inspected_qty: number | null;
}
interface ShipTodayRow {
  shipment_no: string | null;
  destination_port: string | null;
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
      safeRows<OrderRow>(() =>
        supabase.from('orders').select('status, customer_name, delivery_date, po_number')),
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

  // ── Ba nguồn cho "Việc hôm nay" ───────────────────────────────────────────
  // Tách khỏi Promise.all ở trên để không phải sửa mảng huỷ cấu trúc 10 phần tử
  // đang chạy tốt — thêm phần tử vào đó là chỗ rất dễ lệch thứ tự mà TypeScript
  // không bắt được (mọi phần tử đều là Res<...>).
  const [assignments, todayReports, qaDefects, shipsToday] = await Promise.all([
    safeRows<AssignmentRow>(() =>
      supabase.from('assignments').select('id, assignment_no, status, planned_finish')
        .in('status', ['ACCEPTED', 'IN_PROGRESS']).is('deleted_at', null).limit(500)),
    safeRows<DailyReportRow>(() =>
      supabase.from('assignment_daily_reports').select('assignment_id')
        .eq('report_date', todayDate).limit(500)),
    safeRows<QaDefectRow>(() =>
      supabase.from('qa_audit_reports').select('line_name, defect_qty, inspected_qty')
        .gt('defect_qty', 0).gte('created_at', vnDaysAgoUtc(7)).limit(200)),
    safeRows<ShipTodayRow>(() =>
      supabase.from('shipments').select('shipment_no, destination_port, status')
        .eq('etd_date', todayDate).limit(100)),
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

  // ── Hoạt động gần đây ─────────────────────────────────────────────────────
  // Lấy từ ĐƠN HÀNG THẬT. Sắp theo ngày giao gần nhất trước — đó là thứ người
  // điều hành cần thấy đầu tiên, không phải thứ tự nhập liệu.
  // Đơn chưa chốt ngày giao xếp cuối: `''` luôn nhỏ hơn mọi chuỗi ngày.
  const recent: ActivityRow[] = openOrders
    .slice()
    .sort((a, b) => (a.delivery_date ?? '').localeCompare(b.delivery_date ?? ''))
    .slice(0, 6)
    .map((o) => ({
      poNumber: (o.po_number ?? '').trim() || DASH,
      customer: (o.customer_name ?? '').trim() || DASH,
      status: (o.status ?? '').trim() || DASH,
      deliveryDate: o.delivery_date,
      late: Boolean(o.delivery_date && o.delivery_date < todayDate),
    }));

  // ── Tiến độ kế hoạch ngày ─────────────────────────────────────────────────
  // `null` khi chưa đặt kế hoạch — KHÔNG hiện 0%, vì "chưa lập kế hoạch" và
  // "lập rồi nhưng chưa làm được gì" là hai chuyện khác hẳn nhau.
  const dayProgress: ProgressValue = {
    percent: sewing.ok && targetToday > 0
      ? Math.min(100, Math.round((sewnToday / targetToday) * 100))
      : null,
    done: sewing.ok ? fmt(sewnToday) : DASH,
    target: sewing.ok && targetToday > 0 ? fmt(targetToday) : DASH,
  };

  // ── VIỆC HÔM NAY ──────────────────────────────────────────────────────────
  // Playbook Điều XXX mục 7: phần việc chưa gửi báo cáo ngày phải hiện
  // `REPORT MISSING` trên bảng điều khiển — Giám đốc, Merchandiser và QA đều
  // thấy. Đây chính là chỗ thi hành điều khoản đó ở trang chủ.
  const reportedToday = new Set(
    todayReports.v.map((r) => r.assignment_id).filter((x): x is string => Boolean(x)),
  );
  const missing = assignments.v.filter((a) => !reportedToday.has(a.id));

  const tasks: TaskRow[] = [
    ...missing.slice(0, 3).map<TaskRow>((a) => ({
      kind: 'REPORT_MISSING',
      title: `Chưa có báo cáo ngày — ${a.assignment_no ?? DASH}`,
      detail: a.planned_finish ? `Hạn hoàn thành ${a.planned_finish}` : 'Chưa đặt hạn hoàn thành',
      href: '/md/assignments',
    })),
    ...qaDefects.v.slice(0, 2).map<TaskRow>((q) => ({
      kind: 'QA_DEFECT',
      title: `Hàng lỗi tại ${q.line_name ?? DASH}`,
      detail: `${fmt(q.defect_qty ?? 0)} lỗi / ${fmt(q.inspected_qty ?? 0)} pcs đã kiểm`,
      href: '/qa',
    })),
    ...shipsToday.v.slice(0, 2).map<TaskRow>((s) => ({
      kind: 'SHIP_TODAY',
      title: `Lô xuất hôm nay — ${s.shipment_no ?? DASH}`,
      detail: `${s.destination_port ?? 'Chưa có cảng đích'} · ${s.status ?? DASH}`,
      href: '/xuat-hang',
    })),
  ].slice(0, 6);

  const ops: OpsCounts = {
    reportMissing: assignments.ok && todayReports.ok ? missing.length : null,
    qaDefect: qaDefects.ok ? qaDefects.v.length : null,
    shipToday: shipsToday.ok ? shipsToday.v.length : null,
  };

  return {
    status: 'ok',
    role,
    partial,
    recent,
    dayProgress,
    tasks,
    ops,
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
