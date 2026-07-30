'use server';

import { createClient } from '@/utils/supabase/server';
import { isRole, type Role } from '@/lib/rbac';

// ============================================================================
// SỐ LIỆU CHO BÁO CÁO GIÁM ĐỐC HẰNG NGÀY
//
// ─── VÌ SAO ĐẶT Ở app/actions CHỨ KHÔNG Ở _services CỦA /md ────────────────
// Nút Báo cáo nằm trên thanh điều hướng toàn cục, dùng được ở MỌI trang chứ
// không riêng /md. Đặt trong thư mục riêng của một phân hệ sẽ tạo phụ thuộc
// ngược: thanh điều hướng chung phải import từ ruột một phân hệ.
//
// ─── VÌ SAO MỌI CON SỐ ĐỀU CÓ THỂ LÀ null ──────────────────────────────────
// Báo cáo này được CHỤP LẠI THÀNH ẢNH rồi gửi thẳng cho giám đốc. Một con số 0
// hiện ra khi thật ra là lỗi quyền sẽ nằm vĩnh viễn trong ảnh đó, và không ai
// biết là nó sai. Không đọc được thì phải nói là không đọc được.
//
// ─── VÌ SAO KHÔNG DÙNG guard() CỦA /md ─────────────────────────────────────
// guard() chỉ cho vai trò có quyền vào /md. Báo cáo này còn phục vụ giám đốc
// và các bộ phận khác, nên kiểm quyền riêng ở đây: phải đăng nhập, và RLS của
// cơ sở dữ liệu vẫn là hàng rào thật sự cho từng bảng.
// ============================================================================

export interface RevenueBar {
  /** Nhãn tháng dạng "07/2026" */
  month: string;
  /** Giá trị đơn giao trong tháng = đơn giá × số lượng, chỉ cộng đơn có đơn giá */
  value: number;
  /** Số lượng sản phẩm giao trong tháng */
  quantity: number;
}

export interface DeliverySlice {
  name: string;
  value: number;
}

export interface RiskAlert {
  key: 'MATERIAL' | 'QA' | 'SCHEDULE';
  label: string;
  /** Số vụ việc đang mở */
  count: number | null;
  /** Câu mô tả ngắn để giám đốc hiểu ngay con số nói gì */
  detail: string;
  level: 'OK' | 'WARN' | 'CRITICAL';
}

/** Số liệu cho tab "Số liệu bộ phận" — tính từ đơn giá × số lượng của PO */
export interface DeptMetrics {
  /** Doanh thu dự kiến của các đơn ĐANG CHẠY. null = chưa đơn nào có đơn giá. */
  revenue: number | null;
  /** Giá trị đơn trung bình. null khi không có đơn nào tính được. */
  aov: number | null;
  /** Tổng sản lượng đang chạy */
  quantity: number | null;
  currency: string;
  /** Số đơn đã dùng để tính doanh thu (đơn có đơn giá) */
  pricedOrders: number;
  /** Số đơn đang chạy nhưng thiếu đơn giá — cho biết con số trên hụt bao nhiêu */
  unpricedOrders: number;
  /**
   * Biến động doanh thu THÁNG NÀY so với THÁNG TRƯỚC, theo phần trăm.
   * null khi tháng trước không có doanh thu — chia cho 0 thì không ra tỷ lệ nào
   * có nghĩa, và bịa ra một con số "+100%" là nói dối.
   */
  revenueTrendPct: number | null;
  revenueThisMonth: number;
  revenueLastMonth: number;
}

export interface CeoReport {
  role: Role | null;
  /** Mốc thời gian chốt số liệu, giờ Việt Nam, dạng ISO */
  generatedAt: string;
  kpi: {
    runningOrders: number | null;
    runningQuantity: number | null;
    /** Tổng giá trị các đơn đang chạy, chỉ cộng đơn ĐÃ có đơn giá */
    runningValue: number | null;
    /** Số đơn đang chạy nhưng chưa nhập đơn giá — cho biết con số trên thiếu bao nhiêu */
    ordersWithoutPrice: number | null;
    currency: string;
  };
  revenue: RevenueBar[];
  dept: DeptMetrics;
  delivery: DeliverySlice[];
  /** Tổng số đơn đã tới hạn dùng để tính tỷ lệ đúng hạn */
  deliveryBase: number;
  risks: RiskAlert[];
  errors: Record<string, string | null>;
}

/** Ngày hôm nay theo giờ Việt Nam (UTC+7). Máy chủ chạy giờ UTC nên phải bù,
 *  không thì sau 17h chiều mọi so sánh "quá hạn" đều lệch một ngày. */
function vnToday(): string {
  return new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
}

function monthKey(iso: string): string {
  return `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** Sáu tháng gần nhất kết thúc ở tháng hiện tại. Dựng đủ khung trước rồi mới
 *  đổ số vào: tháng không có đơn phải hiện cột 0, bỏ trống sẽ làm biểu đồ co
 *  lại và trông như tháng đó chưa tới. */
function last6Months(todayIso: string): string[] {
  const y = Number(todayIso.slice(0, 4));
  const m = Number(todayIso.slice(5, 7));
  const out: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const t = y * 12 + (m - 1) - i;
    out.push(`${String((t % 12) + 1).padStart(2, '0')}/${Math.floor(t / 12)}`);
  }
  return out;
}

const CLOSED = new Set(['COMPLETED', 'SHIPPED', 'CANCELLED', 'CLOSED']);
const DELIVERED = new Set(['COMPLETED', 'SHIPPED', 'CLOSED']);

const EMPTY: Omit<CeoReport, 'role' | 'generatedAt'> = {
  kpi: {
    runningOrders: null, runningQuantity: null, runningValue: null,
    ordersWithoutPrice: null, currency: 'USD',
  },
  revenue: [],
  dept: {
    revenue: null, aov: null, quantity: null, currency: 'USD',
    pricedOrders: 0, unpricedOrders: 0,
    revenueTrendPct: null, revenueThisMonth: 0, revenueLastMonth: 0,
  },
  delivery: [],
  deliveryBase: 0,
  risks: [],
  errors: {},
};

export async function getCeoReport(): Promise<CeoReport> {
  const today = vnToday();
  const generatedAt = new Date(Date.now() + 7 * 3_600_000).toISOString();

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return { ...EMPTY, role: null, generatedAt, errors: { all: 'Không kết nối được máy chủ dữ liệu.' } };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ...EMPTY, role: null, generatedAt, errors: { all: 'Phiên đăng nhập đã hết hạn.' } };
  }
  const raw = user.app_metadata?.role;
  const role: Role | null = isRole(raw) ? raw : null;

  const [odRes, msRes, mrRes, qaRes] = await Promise.allSettled([
    supabase
      .from('orders')
      .select('id, status, total_quantity, unit_price, currency, delivery_date, ex_factory_date')
      .limit(3000),
    supabase
      .from('order_milestones')
      .select('order_id, planned_date, actual_date, status')
      .limit(8000),
    supabase.from('material_requests').select('status, needed_date').limit(3000),
    supabase.from('qa_audit_reports').select('inspected_qty, passed_qty, defect_qty').limit(3000),
  ]);

  /** Lấy dữ liệu ra hoặc trả câu lỗi — KHÔNG bao giờ trả mảng rỗng lặng lẽ */
  function unwrap<T>(
    res: PromiseSettledResult<{ data: unknown; error: { message: string } | null }>,
    label: string,
  ): { rows: T[]; error: string | null } {
    if (res.status === 'rejected') {
      console.error(`[ceo-report] ${label}:`, res.reason);
      return { rows: [], error: `Không đọc được ${label}.` };
    }
    if (res.value.error) {
      console.error(`[ceo-report] ${label}:`, res.value.error);
      return { rows: [], error: `Không đọc được ${label}: ${res.value.error.message}` };
    }
    return { rows: (res.value.data ?? []) as T[], error: null };
  }

  const orders = unwrap<{
    id: string; status: string; total_quantity: number; unit_price: number | null;
    currency: string | null; delivery_date: string; ex_factory_date: string | null;
  }>(odRes, 'đơn hàng');
  const milestones = unwrap<{
    order_id: string; planned_date: string | null; actual_date: string | null; status: string;
  }>(msRes, 'mốc tiến độ');
  const materials = unwrap<{ status: string; needed_date: string | null }>(mrRes, 'đề nghị mua NPL');
  const qa = unwrap<{ inspected_qty: number; passed_qty: number; defect_qty: number }>(qaRes, 'báo cáo chất lượng');

  // ─── 1. KPI + biểu đồ giá trị theo tháng ──────────────────────────────────
  const running = orders.rows.filter((o) => !CLOSED.has(String(o.status).toUpperCase()));
  const months = last6Months(today);
  const bucket = new Map(months.map((m) => [m, { value: 0, quantity: 0 }]));

  for (const o of orders.rows) {
    if (!o.delivery_date) continue;
    const slot = bucket.get(monthKey(o.delivery_date));
    if (!slot) continue;
    const qty = Number(o.total_quantity) || 0;
    slot.quantity += qty;
    // Chỉ cộng đơn ĐÃ có đơn giá. Coi đơn thiếu giá như 0 sẽ làm cột tháng đó
    // thấp giả tạo mà không ai biết vì sao.
    if (o.unit_price !== null && o.unit_price !== undefined) {
      slot.value += Number(o.unit_price) * qty;
    }
  }

  const priced = running.filter((o) => o.unit_price !== null && o.unit_price !== undefined);
  // Đồng tiền lấy theo đơn phổ biến nhất trong nhóm đang chạy. Trộn nhiều đồng
  // tiền vào một tổng là sai, nên nhãn phải nói rõ đang quy về đồng nào.
  const curCount = new Map<string, number>();
  for (const o of priced) curCount.set(o.currency ?? 'USD', (curCount.get(o.currency ?? 'USD') ?? 0) + 1);
  const currency = [...curCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'USD';

  // ─── 1b. Số liệu bộ phận: doanh thu, giá trị đơn trung bình, sản lượng ────
  const runningQty = running.reduce((s, o) => s + (Number(o.total_quantity) || 0), 0);
  const runningRevenue = priced.reduce(
    (s, o) => s + Number(o.unit_price) * (Number(o.total_quantity) || 0),
    0,
  );

  // Trend so THÁNG NÀY với THÁNG TRƯỚC, lấy từ chính bucket đã gom ở trên nên
  // không phải quét lại lần nữa. Đây là con số THẬT, không phải minh hoạ.
  const thisKey = monthKey(today);
  const prevDate = new Date(`${today.slice(0, 8)}01T00:00:00Z`);
  prevDate.setUTCMonth(prevDate.getUTCMonth() - 1);
  const prevKey = monthKey(prevDate.toISOString().slice(0, 10));
  const revThis = bucket.get(thisKey)?.value ?? 0;
  const revPrev = bucket.get(prevKey)?.value ?? 0;

  const dept: DeptMetrics = {
    revenue: orders.error || priced.length === 0 ? null : Number(runningRevenue.toFixed(2)),
    aov:
      orders.error || priced.length === 0
        ? null
        : Number((runningRevenue / priced.length).toFixed(2)),
    quantity: orders.error ? null : runningQty,
    currency,
    pricedOrders: priced.length,
    unpricedOrders: running.length - priced.length,
    // Tháng trước bằng 0 thì KHÔNG có tỷ lệ nào đúng — trả null để giao diện
    // hiện "chưa có nền so sánh" thay vì một mũi tên tăng vô nghĩa.
    revenueTrendPct: revPrev > 0 ? Number((((revThis - revPrev) / revPrev) * 100).toFixed(1)) : null,
    revenueThisMonth: Number(revThis.toFixed(2)),
    revenueLastMonth: Number(revPrev.toFixed(2)),
  };

  // ─── 2. Đúng hạn hay trễ ──────────────────────────────────────────────────
  // Chỉ xét đơn ĐÃ TỚI HẠN: đơn có ngày giao tháng sau mà tính vào "chưa đúng
  // hạn" thì tỷ lệ đúng hạn luôn thấp giả tạo.
  const due = orders.rows.filter((o) => o.delivery_date && o.delivery_date <= today);
  const onTime = due.filter((o) => DELIVERED.has(String(o.status).toUpperCase())).length;
  const late = due.length - onTime;

  // ─── 3. Ba nhóm cảnh báo rủi ro ───────────────────────────────────────────
  const PENDING_MR = new Set(['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED']);
  const mrPending = materials.rows.filter((m) => PENDING_MR.has(String(m.status).toUpperCase()));
  const mrOverdue = mrPending.filter((m) => m.needed_date && m.needed_date < today).length;

  const lateMs = milestones.rows.filter(
    (m) => m.status !== 'SKIPPED' && !m.actual_date && m.planned_date && m.planned_date < today,
  );
  const lateOrders = new Set(lateMs.map((m) => m.order_id)).size;

  const inspected = qa.rows.reduce((s, r) => s + (Number(r.inspected_qty) || 0), 0);
  const defect = qa.rows.reduce((s, r) => s + (Number(r.defect_qty) || 0), 0);
  const defectRate = inspected > 0 ? (defect / inspected) * 100 : null;

  const risks: RiskAlert[] = [
    {
      key: 'MATERIAL',
      label: 'Nguyên phụ liệu',
      count: materials.error ? null : mrPending.length,
      detail: materials.error
        ? 'không đọc được dữ liệu'
        : mrOverdue > 0
          ? `${mrOverdue} đề nghị đã quá ngày cần hàng`
          : 'chưa có đề nghị nào quá hạn',
      level: materials.error ? 'WARN' : mrOverdue > 0 ? 'CRITICAL' : mrPending.length > 0 ? 'WARN' : 'OK',
    },
    {
      key: 'SCHEDULE',
      label: 'Tiến độ T&A',
      count: milestones.error ? null : lateMs.length,
      detail: milestones.error
        ? 'không đọc được dữ liệu'
        : lateMs.length > 0
          ? `mốc đang trễ, thuộc ${lateOrders} đơn hàng`
          : 'toàn bộ mốc đúng tiến độ',
      level: milestones.error ? 'WARN' : lateMs.length > 0 ? 'CRITICAL' : 'OK',
    },
    {
      key: 'QA',
      label: 'Chất lượng',
      count: qa.error || defectRate === null ? null : Number(defectRate.toFixed(2)),
      detail: qa.error
        ? 'không đọc được dữ liệu'
        : defectRate === null
          ? 'chưa có lượt kiểm nào được ghi nhận'
          : `% lỗi trên ${inspected.toLocaleString('vi-VN')} sản phẩm đã kiểm`,
      level: qa.error || defectRate === null ? 'WARN' : defectRate >= 5 ? 'CRITICAL' : defectRate >= 2 ? 'WARN' : 'OK',
    },
  ];

  return {
    role,
    generatedAt,
    kpi: {
      runningOrders: orders.error ? null : running.length,
      runningQuantity: orders.error ? null : running.reduce((s, o) => s + (Number(o.total_quantity) || 0), 0),
      // KHÔNG có đơn nào ghi đơn giá thì trả null để giao diện hiện "—".
      // Hiện "0 USD" trong trường hợp này là nói sai: giá trị không phải bằng
      // không, mà là chưa ai nhập giá. Ảnh báo cáo gửi cho giám đốc mà ghi 0
      // thì người đọc sẽ tưởng nhà máy đang chạy không công.
      runningValue:
        orders.error || priced.length === 0
          ? null
          : Number(priced.reduce((s, o) => s + Number(o.unit_price) * (Number(o.total_quantity) || 0), 0).toFixed(2)),
      ordersWithoutPrice: orders.error ? null : running.length - priced.length,
      currency,
    },
    dept,
    revenue: months.map((m) => {
      const b = bucket.get(m) as { value: number; quantity: number };
      return { month: m, value: Number(b.value.toFixed(2)), quantity: b.quantity };
    }),
    delivery: orders.error
      ? []
      : [
          { name: 'Giao đúng hạn', value: onTime },
          { name: 'Trễ hoặc chưa xong', value: late },
        ],
    deliveryBase: due.length,
    risks,
    errors: {
      orders: orders.error,
      milestones: milestones.error,
      materials: materials.error,
      qa: qa.error,
    },
  };
}
