import 'server-only';

import { guard, safeQuery, one } from './guard';
import { isPoRunning, vnToday } from '@/schemas/md';

// ============================================================================
// COMMAND CENTER — TỔNG HỢP "VIỆC PHẢI LÀM" TỪ DỮ LIỆU CÓ THẬT
//
// ─── NGUYÊN TẮC ────────────────────────────────────────────────────────────
// KHÔNG có bảng "todo" nào trong cơ sở dữ liệu, và cũng KHÔNG dựng thêm. Việc
// cần làm của một Merchandiser vốn đã nằm rải rác trong nghiệp vụ: mốc T&A tới
// hạn, mẫu gửi đi chưa có phản hồi, NPL quá ngày cần hàng, việc được giao
// trong thảo luận, yêu cầu thay đổi chờ duyệt. Ở đây chỉ GOM chúng lại và sắp
// theo mức khẩn.
//
// Hệ quả quan trọng: danh sách này luôn khớp với nghiệp vụ vì nó CHÍNH LÀ
// nghiệp vụ. Không có chuyện đánh dấu xong trong Command Center mà mốc T&A vẫn
// còn treo, vì hai chỗ đọc cùng một dòng dữ liệu.
//
// ─── VÌ SAO GOM TRUY VẤN ───────────────────────────────────────────────────
// Sáu nguồn, sáu truy vấn chạy song song, rồi ghép trong bộ nhớ. Gọi lồng theo
// từng đơn sẽ thành hàng trăm lượt đi về máy chủ cho một lần mở trang.
// ============================================================================

export type TaskKind = 'MILESTONE' | 'SAMPLE' | 'MATERIAL' | 'COMMENT' | 'CHANGE';

export interface TodayTask {
  id: string;
  kind: TaskKind;
  /** Câu mệnh lệnh ngắn: người đọc biết ngay phải LÀM GÌ */
  title: string;
  subtitle: string;
  /** Ngày tới hạn (ISO). null = không có hạn rõ ràng. */
  dueDate: string | null;
  /** Số ngày đã quá hạn. 0 = tới hạn hôm nay. */
  overdueDays: number;
  orderId: string | null;
  poNumber: string | null;
}

export interface ActionablePo {
  id: string;
  po_number: string;
  customer_name: string;
  style_no: string | null;
  total_quantity: number;
  /** Đã may, cộng từ nhật ký sản lượng theo giờ */
  sewn: number;
  pct: number;
  delivery_date: string;
  /** Số ngày còn lại tới ngày giao. Âm = đã quá ngày giao. */
  daysLeft: number;
  lateMilestones: number;
  riskLevel: string | null;
  status: string;
}

export type AlertKind = 'SCHEDULE' | 'MATERIAL' | 'QUALITY' | 'RISK';

export interface CriticalAlert {
  id: string;
  kind: AlertKind;
  title: string;
  detail: string;
  orderId: string | null;
  poNumber: string | null;
  /** Con số làm bằng chứng: số ngày trễ, % lỗi, điểm rủi ro... */
  metric: string;
}

export interface CommandCenterData {
  tasks: TodayTask[];
  pos: ActionablePo[];
  alerts: CriticalAlert[];
  errors: Record<string, string | null>;
}

const EMPTY: Omit<CommandCenterData, 'errors'> = { tasks: [], pos: [], alerts: [] };

/** Số ngày từ `date` tới `today`. Dương = đã qua. */
function daysPast(date: string, today: string): number {
  return Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000);
}

/** Mẫu gửi đi coi như còn treo khi chưa có kết luận duyệt hay từ chối */
const SAMPLE_OPEN = new Set(['SENT', 'PENDING', 'REVISE', 'RESENT']);
const MR_PENDING = new Set(['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED']);
const TASK_OPEN = new Set(['OPEN', 'DOING']);

export async function getCommandCenter(): Promise<CommandCenterData> {
  const g = await guard();
  if (!g.supabase) return { ...EMPTY, errors: { all: g.error } };
  const sb = g.supabase;
  const today = vnToday();

  const [odRes, msRes, spRes, mrRes, cmRes, crRes, prodRes, qaRes, rkRes] = await Promise.all([
    safeQuery<RawOrder>('đơn hàng', () =>
      sb
        .from('orders')
        .select('id, po_number, customer_name, total_quantity, delivery_date, status, styles ( style_no )')
        .limit(1000),
    ),
    safeQuery<RawMilestone>('mốc tiến độ', () =>
      sb
        .from('order_milestones')
        .select('id, order_id, milestone, planned_date, actual_date, status, is_critical')
        .limit(5000),
    ),
    safeQuery<RawSample>('mẫu duyệt', () =>
      sb.from('sample_submissions').select('id, order_id, stage, round_no, sent_date, status').limit(2000),
    ),
    safeQuery<RawMaterial>('đề nghị mua NPL', () =>
      sb
        .from('material_requests')
        .select('id, order_id, request_no, material_name, needed_date, status')
        .limit(2000),
    ),
    safeQuery<RawComment>('việc trong thảo luận', () =>
      sb
        .from('md_comments')
        .select('id, entity_type, entity_id, body, is_task, task_status, assigned_role, due_date')
        .eq('is_task', true)
        .limit(1000),
    ),
    safeQuery<RawChange>('yêu cầu thay đổi', () =>
      sb
        .from('change_requests')
        .select('id, order_id, request_no, change_type, status, created_at')
        .eq('status', 'PENDING')
        .limit(500),
    ),
    safeQuery<{ order_id: string; actual_qty: number }>('sản lượng', () =>
      sb.from('hourly_production_logs').select('order_id, actual_qty').limit(20000),
    ),
    safeQuery<{ order_id: string; inspected_qty: number; defect_qty: number }>('chất lượng', () =>
      sb.from('qa_audit_reports').select('order_id, inspected_qty, defect_qty').limit(5000),
    ),
    safeQuery<{ order_id: string; total_score: number; risk_level: string }>('điểm rủi ro', () =>
      sb.from('v_order_risk').select('order_id, total_score, risk_level').limit(2000),
    ),
  ]);

  // ─── Bảng tra đơn hàng, dùng lại cho cả ba khu ────────────────────────────
  const orderById = new Map(odRes.rows.map((o) => [o.id, o]));
  const poNo = (id: string | null) => (id ? orderById.get(id)?.po_number ?? null : null);

  // ─── KHU 1: VIỆC CẦN LÀM HÔM NAY ─────────────────────────────────────────
  const tasks: TodayTask[] = [];

  // 1a. Mốc T&A tới hạn hôm nay hoặc đã quá hạn mà chưa có ngày thực tế
  for (const m of msRes.rows) {
    if (m.status === 'SKIPPED' || m.actual_date || !m.planned_date) continue;
    const late = daysPast(m.planned_date, today);
    if (late < 0) continue; // còn hạn, chưa phải việc của hôm nay
    tasks.push({
      id: `ms-${m.id}`,
      kind: 'MILESTONE',
      title: `Chốt mốc "${m.milestone}"`,
      subtitle: m.is_critical ? 'Mốc đường găng — trễ là trễ cả đơn' : 'Mốc theo lịch T&A',
      dueDate: m.planned_date,
      overdueDays: late,
      orderId: m.order_id,
      poNumber: poNo(m.order_id),
    });
  }

  // 1b. Mẫu đã gửi cho khách mà chưa có phản hồi
  for (const s of spRes.rows) {
    if (!SAMPLE_OPEN.has(String(s.status).toUpperCase())) continue;
    const waited = s.sent_date ? daysPast(s.sent_date, today) : 0;
    tasks.push({
      id: `sp-${s.id}`,
      kind: 'SAMPLE',
      title: `Theo mẫu ${s.stage} lần ${s.round_no}`,
      subtitle: s.sent_date ? `Đã gửi ${waited} ngày, chưa có phản hồi` : 'Chưa ghi ngày gửi',
      dueDate: s.sent_date,
      // Mẫu không có "hạn" cứng; quá 7 ngày chưa hồi âm thì coi là đang trễ.
      // Bảy ngày là một vòng chuyển phát quốc tế cộng thời gian khách xem.
      overdueDays: Math.max(0, waited - 7),
      orderId: s.order_id,
      poNumber: poNo(s.order_id),
    });
  }

  // 1c. Đề nghị mua NPL quá ngày cần hàng mà chưa nhận
  for (const r of mrRes.rows) {
    if (!MR_PENDING.has(String(r.status).toUpperCase())) continue;
    if (!r.needed_date) continue;
    const late = daysPast(r.needed_date, today);
    if (late < 0) continue;
    tasks.push({
      id: `mr-${r.id}`,
      kind: 'MATERIAL',
      title: `Giục NPL: ${r.material_name}`,
      subtitle: `Phiếu ${r.request_no} — quá ngày cần hàng`,
      dueDate: r.needed_date,
      overdueDays: late,
      orderId: r.order_id,
      poNumber: poNo(r.order_id),
    });
  }

  // 1d. Việc được giao trong thảo luận, tới hạn hoặc quá hạn
  for (const c of cmRes.rows) {
    if (!TASK_OPEN.has(String(c.task_status ?? 'OPEN').toUpperCase())) continue;
    const late = c.due_date ? daysPast(c.due_date, today) : 0;
    if (c.due_date && late < 0) continue;
    tasks.push({
      id: `cm-${c.id}`,
      kind: 'COMMENT',
      // Cắt ngắn nội dung nhưng KHÔNG bỏ hẳn: câu chữ người viết là thứ cho
      // biết chính xác phải làm gì, tóm tắt lại bằng máy sẽ mất ý.
      title: c.body.length > 70 ? `${c.body.slice(0, 70)}…` : c.body,
      subtitle: c.assigned_role ? `Giao cho bộ phận ${c.assigned_role}` : 'Chưa giao bộ phận',
      dueDate: c.due_date,
      overdueDays: late,
      orderId: c.entity_type === 'ORDER' ? c.entity_id : null,
      poNumber: c.entity_type === 'ORDER' ? poNo(c.entity_id) : null,
    });
  }

  // 1e. Yêu cầu thay đổi đang chờ quyết định
  for (const c of crRes.rows) {
    tasks.push({
      id: `cr-${c.id}`,
      kind: 'CHANGE',
      title: `Duyệt yêu cầu thay đổi ${c.request_no}`,
      subtitle: `Loại: ${c.change_type}`,
      dueDate: c.created_at?.slice(0, 10) ?? null,
      overdueDays: c.created_at ? Math.max(0, daysPast(c.created_at.slice(0, 10), today)) : 0,
      orderId: c.order_id,
      poNumber: poNo(c.order_id),
    });
  }

  // Trễ nhiều nhất lên đầu. Cùng mức trễ thì mốc T&A đứng trước, vì nó kéo
  // theo cả chuỗi công đoạn phía sau.
  const KIND_WEIGHT: Record<TaskKind, number> = {
    MILESTONE: 0, MATERIAL: 1, SAMPLE: 2, CHANGE: 3, COMMENT: 4,
  };
  tasks.sort((a, b) => b.overdueDays - a.overdueDays || KIND_WEIGHT[a.kind] - KIND_WEIGHT[b.kind]);

  // ─── KHU 2: PO ĐANG CHẠY, CÓ THỂ HÀNH ĐỘNG NGAY ──────────────────────────
  const sewnBy = new Map<string, number>();
  for (const p of prodRes.rows) {
    sewnBy.set(p.order_id, (sewnBy.get(p.order_id) ?? 0) + (Number(p.actual_qty) || 0));
  }
  const lateBy = new Map<string, number>();
  for (const m of msRes.rows) {
    if (m.status === 'SKIPPED' || m.actual_date || !m.planned_date) continue;
    if (m.planned_date < today) lateBy.set(m.order_id, (lateBy.get(m.order_id) ?? 0) + 1);
  }
  const riskBy = new Map(rkRes.rows.map((r) => [r.order_id, r]));

  const pos: ActionablePo[] = odRes.rows
    .filter((o) => isPoRunning(o.status))
    .map((o) => {
      const qty = Number(o.total_quantity) || 0;
      const sewn = sewnBy.get(o.id) ?? 0;
      return {
        id: o.id,
        po_number: o.po_number,
        customer_name: o.customer_name,
        style_no: one(o.styles)?.style_no ?? null,
        total_quantity: qty,
        sewn,
        pct: qty > 0 ? Math.min(100, (sewn / qty) * 100) : 0,
        delivery_date: o.delivery_date,
        daysLeft: o.delivery_date ? -daysPast(o.delivery_date, today) : 0,
        lateMilestones: lateBy.get(o.id) ?? 0,
        riskLevel: riskBy.get(o.id)?.risk_level ?? null,
        status: o.status,
      };
    })
    // Gấp nhất lên trước: còn ít ngày nhất, rồi tới đơn đang có mốc trễ
    .sort((a, b) => a.daysLeft - b.daysLeft || b.lateMilestones - a.lateMilestones);

  // ─── KHU 3: CHỈ CẢNH BÁO MỨC ĐỎ ──────────────────────────────────────────
  // Ngưỡng cố ý đặt cao. Cảnh báo mà cái gì cũng kêu thì người vận hành sẽ
  // ngừng đọc, đúng lúc có chuyện thật lại bỏ qua.
  const alerts: CriticalAlert[] = [];

  for (const m of msRes.rows) {
    if (m.status === 'SKIPPED' || m.actual_date || !m.planned_date) continue;
    const late = daysPast(m.planned_date, today);
    // Chỉ mốc ĐƯỜNG GĂNG trễ từ 3 ngày, hoặc mốc thường trễ từ 7 ngày
    if (!(m.is_critical ? late >= 3 : late >= 7)) continue;
    alerts.push({
      id: `al-ms-${m.id}`,
      kind: 'SCHEDULE',
      title: `Trễ mốc "${m.milestone}"`,
      detail: m.is_critical ? 'Mốc đường găng — kéo trễ toàn bộ đơn' : 'Mốc theo lịch T&A',
      orderId: m.order_id,
      poNumber: poNo(m.order_id),
      metric: `trễ ${late} ngày`,
    });
  }

  for (const r of mrRes.rows) {
    if (!MR_PENDING.has(String(r.status).toUpperCase()) || !r.needed_date) continue;
    const late = daysPast(r.needed_date, today);
    if (late < 3) continue;
    alerts.push({
      id: `al-mr-${r.id}`,
      kind: 'MATERIAL',
      title: `NPL chưa về: ${r.material_name}`,
      detail: `Phiếu ${r.request_no} vẫn ở trạng thái ${r.status}`,
      orderId: r.order_id,
      poNumber: poNo(r.order_id),
      metric: `trễ ${late} ngày`,
    });
  }

  // Tỷ lệ lỗi gộp theo đơn, không theo từng lượt kiểm: một lượt kiểm 10 sản
  // phẩm lỗi 1 cái ra 10% nhưng chưa nói lên điều gì.
  const qaBy = new Map<string, { inspected: number; defect: number }>();
  for (const q of qaRes.rows) {
    const cur = qaBy.get(q.order_id) ?? { inspected: 0, defect: 0 };
    cur.inspected += Number(q.inspected_qty) || 0;
    cur.defect += Number(q.defect_qty) || 0;
    qaBy.set(q.order_id, cur);
  }
  for (const [orderId, v] of qaBy) {
    if (v.inspected < 50) continue; // mẫu quá nhỏ, tỷ lệ chưa đáng tin
    const rate = (v.defect / v.inspected) * 100;
    if (rate < 5) continue;
    alerts.push({
      id: `al-qa-${orderId}`,
      kind: 'QUALITY',
      title: 'Tỷ lệ lỗi vượt ngưỡng',
      detail: `${v.defect} lỗi trên ${v.inspected} sản phẩm đã kiểm`,
      orderId,
      poNumber: poNo(orderId),
      metric: `${rate.toFixed(1)}% lỗi`,
    });
  }

  for (const r of rkRes.rows) {
    if (r.risk_level !== 'CRITICAL') continue;
    alerts.push({
      id: `al-rk-${r.order_id}`,
      kind: 'RISK',
      title: 'Đơn hàng ở mức nguy kịch',
      detail: 'Điểm rủi ro tổng hợp từ NPL, tiến độ, chất lượng và năng lực xưởng',
      orderId: r.order_id,
      poNumber: poNo(r.order_id),
      metric: `${Number(r.total_score).toFixed(0)} điểm`,
    });
  }

  return {
    tasks,
    pos,
    alerts,
    errors: {
      orders: odRes.error,
      milestones: msRes.error,
      samples: spRes.error,
      materials: mrRes.error,
      comments: cmRes.error,
      changes: crRes.error,
      production: prodRes.error,
      quality: qaRes.error,
      risks: rkRes.error,
    },
  };
}

// ─── Kiểu thô đọc từ cơ sở dữ liệu ─────────────────────────────────────────

interface RawOrder {
  id: string;
  po_number: string;
  customer_name: string;
  total_quantity: number;
  delivery_date: string;
  status: string;
  styles: { style_no: string } | { style_no: string }[] | null;
}
interface RawMilestone {
  id: string;
  order_id: string;
  milestone: string;
  planned_date: string | null;
  actual_date: string | null;
  status: string;
  is_critical: boolean;
}
interface RawSample {
  id: string;
  order_id: string;
  stage: string;
  round_no: number;
  sent_date: string | null;
  status: string;
}
interface RawMaterial {
  id: string;
  order_id: string;
  request_no: string;
  material_name: string;
  needed_date: string | null;
  status: string;
}
interface RawComment {
  id: string;
  entity_type: string;
  entity_id: string;
  body: string;
  is_task: boolean;
  task_status: string | null;
  assigned_role: string | null;
  due_date: string | null;
}
interface RawChange {
  id: string;
  order_id: string;
  request_no: string;
  change_type: string;
  status: string;
  created_at: string | null;
}
