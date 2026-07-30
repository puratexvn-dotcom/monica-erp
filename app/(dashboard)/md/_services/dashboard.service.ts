import 'server-only';

import { guard, safeQuery } from './guard';
import { isPoRunning, resolveMilestoneState, vnToday } from '@/schemas/md';

// ============================================================================
// SỐ LIỆU TỔNG QUAN ĐẦU TRANG MERCHANDISER
//
// ─── VÌ SAO KHÔNG DÙNG head+count CHO TỪNG Ô ────────────────────────────────
// Bảng dữ liệu của một nhà máy may cỡ vừa nằm trong khoảng vài nghìn dòng.
// Kéo về đúng những cột cần rồi gộp trong bộ nhớ tốn ít lượt khứ hồi mạng hơn
// nhiều so với chục truy vấn đếm riêng lẻ — mà một truy vấn hỏng thì cũng chỉ
// mất đúng nhóm số liệu đó.
//
// ─── VÌ SAO MỌI Ô ĐỀU CÓ THỂ LÀ null ────────────────────────────────────────
// "Không đọc được" và "bằng 0" là hai chuyện khác hẳn nhau trong nhà máy.
// Hiện 0 khi thật ra là lỗi quyền sẽ khiến người điều hành yên tâm nhầm.
// ============================================================================

export interface MdDashboardData {
  kpi: {
    runningOrders: number | null;
    runningQuantity: number | null;
    lateMilestones: number | null;
    ordersWithLate: number | null;
    pendingMaterials: number | null;
    openChangeRequests: number | null;
    criticalRisks: number | null;
    openInquiries: number | null;
  };
  /** Số lượng giao theo tháng (12 tháng gần nhất tính từ hôm nay) */
  deliveryByMonth: Array<{ month: string; quantity: number; orders: number }>;
  /** Số mốc T&A trễ, gom theo bộ phận phụ trách */
  lateByRole: Array<{ role: string; late: number }>;
  /** Tiến độ đề nghị mua NPL theo trạng thái */
  materialByStatus: Array<{ status: string; count: number }>;
  /** Phân bố mức rủi ro */
  riskByLevel: Array<{ level: string; count: number }>;
  errors: Record<string, string | null>;
}

const EMPTY: MdDashboardData = {
  kpi: {
    runningOrders: null, runningQuantity: null, lateMilestones: null, ordersWithLate: null,
    pendingMaterials: null, openChangeRequests: null, criticalRisks: null, openInquiries: null,
  },
  deliveryByMonth: [],
  lateByRole: [],
  materialByStatus: [],
  riskByLevel: [],
  errors: {},
};

/** Nhãn tháng dạng "07/2026" — dùng làm khoá gộp và luôn là trục hoành biểu đồ */
function monthKey(isoDate: string): string {
  return `${isoDate.slice(5, 7)}/${isoDate.slice(0, 4)}`;
}

/** 12 nhãn tháng liên tiếp kết thúc ở tháng hiện tại.
 *  Dựng đủ khung trước rồi mới đổ số vào: tháng không có đơn phải hiện cột 0,
 *  bỏ trống sẽ làm biểu đồ co lại và nhìn như tháng đó chưa tới. */
function last12Months(todayIso: string): string[] {
  const year = Number(todayIso.slice(0, 4));
  const month = Number(todayIso.slice(5, 7));
  const out: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const total = year * 12 + (month - 1) - i;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    out.push(`${String(m).padStart(2, '0')}/${y}`);
  }
  return out;
}

export async function getMdDashboard(): Promise<MdDashboardData> {
  const g = await guard();
  if (!g.supabase) return { ...EMPTY, errors: { all: g.error } };
  const sb = g.supabase;

  const today = vnToday();

  const [odRes, msRes, mrRes, crRes, rkRes, iqRes] = await Promise.all([
    safeQuery<{ id: string; total_quantity: number; delivery_date: string; status: string }>(
      'đơn hàng',
      () => sb.from('orders').select('id, total_quantity, delivery_date, status').limit(2000),
    ),
    safeQuery<{ order_id: string; planned_date: string | null; actual_date: string | null; status: string; responsible_role: string | null }>(
      'mốc tiến độ',
      () =>
        sb
          .from('order_milestones')
          .select('order_id, planned_date, actual_date, status, responsible_role')
          .limit(5000),
    ),
    safeQuery<{ status: string }>('đề nghị mua NPL', () =>
      sb.from('material_requests').select('status').limit(2000),
    ),
    safeQuery<{ status: string }>('yêu cầu thay đổi', () =>
      sb.from('change_requests').select('status').limit(2000),
    ),
    safeQuery<{ risk_level: string }>('điểm rủi ro', () =>
      sb.from('v_order_risk').select('risk_level').limit(2000),
    ),
    safeQuery<{ status: string }>('yêu cầu báo giá', () =>
      sb.from('inquiries').select('status').limit(2000),
    ),
  ]);

  // ─── Đơn hàng ─────────────────────────────────────────────────────────────
  const running = odRes.rows.filter((o) => isPoRunning(o.status));
  const months = last12Months(today);
  const byMonth = new Map(months.map((m) => [m, { quantity: 0, orders: 0 }]));
  for (const o of odRes.rows) {
    if (!o.delivery_date) continue;
    const k = monthKey(o.delivery_date);
    const slot = byMonth.get(k);
    if (!slot) continue; // ngoài cửa sổ 12 tháng
    slot.quantity += Number(o.total_quantity) || 0;
    slot.orders += 1;
  }

  // ─── Mốc T&A trễ ──────────────────────────────────────────────────────────
  // Trễ THỰC TẾ: quá ngày kế hoạch mà chưa có ngày thực tế thì tính là trễ,
  // không chờ ai vào bấm đổi trạng thái.
  const lateMs = msRes.rows.filter((m) => resolveMilestoneState(m, today).state === 'LATE');
  const lateRole = new Map<string, number>();
  for (const m of lateMs) {
    const r = m.responsible_role ?? 'KHÁC';
    lateRole.set(r, (lateRole.get(r) ?? 0) + 1);
  }

  const countBy = (rows: ReadonlyArray<{ status: string }>) => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.status, (map.get(r.status) ?? 0) + 1);
    return [...map.entries()].map(([status, count]) => ({ status, count }));
  };

  const riskLevel = new Map<string, number>();
  for (const r of rkRes.rows) riskLevel.set(r.risk_level, (riskLevel.get(r.risk_level) ?? 0) + 1);

  // "Chưa về kho" = mọi trạng thái trừ đã nhận và đã bị từ chối. Đây chính là
  // phần NPL còn có thể làm chậm sản xuất.
  const PENDING_MR = new Set(['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED']);
  const OPEN_INQUIRY = new Set(['NEW', 'COSTING', 'QUOTED']);

  return {
    kpi: {
      runningOrders: odRes.error ? null : running.length,
      runningQuantity: odRes.error ? null : running.reduce((s, o) => s + (Number(o.total_quantity) || 0), 0),
      lateMilestones: msRes.error ? null : lateMs.length,
      ordersWithLate: msRes.error ? null : new Set(lateMs.map((m) => m.order_id)).size,
      pendingMaterials: mrRes.error
        ? null
        : mrRes.rows.filter((m) => PENDING_MR.has(String(m.status).toUpperCase())).length,
      openChangeRequests: crRes.error
        ? null
        : crRes.rows.filter((c) => String(c.status).toUpperCase() === 'PENDING').length,
      criticalRisks: rkRes.error
        ? null
        : rkRes.rows.filter((r) => r.risk_level === 'CRITICAL' || r.risk_level === 'HIGH').length,
      openInquiries: iqRes.error
        ? null
        : iqRes.rows.filter((i) => OPEN_INQUIRY.has(String(i.status).toUpperCase())).length,
    },
    deliveryByMonth: months.map((m) => ({ month: m, ...(byMonth.get(m) as { quantity: number; orders: number }) })),
    lateByRole: [...lateRole.entries()]
      .map(([role, late]) => ({ role, late }))
      .sort((a, b) => b.late - a.late),
    materialByStatus: countBy(mrRes.rows),
    riskByLevel: [...riskLevel.entries()].map(([level, count]) => ({ level, count })),
    errors: {
      orders: odRes.error,
      milestones: msRes.error,
      materials: mrRes.error,
      changes: crRes.error,
      risks: rkRes.error,
      inquiries: iqRes.error,
    },
  };
}
