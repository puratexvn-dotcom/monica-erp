import 'server-only';

import { guard, safeQuery, one } from './guard';
import {
  isPoRunning,
  type PoRow,
  type SizeBreakdownRow,
  type MilestoneRow,
  type SampleRow,
  type StyleBomRow,
  type RiskRow,
  type CommentRow,
  type DocumentRow,
} from '@/schemas/md';

// ============================================================================
// ĐỌC DỮ LIỆU ĐƠN HÀNG + GÓI DỮ LIỆU CHO MÀN HÌNH PO 360°
// ============================================================================

interface RawOrder {
  id: string;
  po_number: string;
  customer_name: string;
  total_quantity: number;
  order_type: string | null;
  currency: string | null;
  unit_price: number | null;
  order_date: string | null;
  delivery_date: string;
  ex_factory_date: string | null;
  factory_name: string | null;
  status: string;
  styles:
    | { style_no: string; style_name: string; sam_minutes: number | null }
    | { style_no: string; style_name: string; sam_minutes: number | null }[]
    | null;
}

/**
 * Danh sách PO cho bảng chính.
 *
 * Điểm rủi ro và số mốc trễ đọc BẰNG HAI TRUY VẤN GOM, không phải mỗi dòng một
 * lần gọi: bảng 500 PO mà gọi lồng sẽ thành 1.000 lượt truy vấn.
 */
export async function listPoRows(): Promise<{ rows: PoRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  const ordersRes = await safeQuery<RawOrder>('danh sách đơn hàng', () =>
    g.supabase
      .from('orders')
      .select(
        'id, po_number, customer_name, total_quantity, order_type, currency, unit_price,' +
          ' order_date, delivery_date, ex_factory_date, factory_name, status,' +
          ' styles ( style_no, style_name, sam_minutes )',
      )
      .order('delivery_date', { ascending: true })
      .limit(500),
  );
  if (ordersRes.error) return { rows: [], error: ordersRes.error };

  const ids = ordersRes.rows.map((r) => r.id);
  if (ids.length === 0) return { rows: [], error: null };

  const [riskRes, msRes] = await Promise.all([
    safeQuery<{ order_id: string; total_score: number; risk_level: string }>('điểm rủi ro', () =>
      g.supabase.from('v_order_risk').select('order_id, total_score, risk_level').in('order_id', ids),
    ),
    safeQuery<{ order_id: string; planned_date: string | null; actual_date: string | null; status: string }>(
      'mốc tiến độ',
      () =>
        g.supabase
          .from('order_milestones')
          .select('order_id, planned_date, actual_date, status')
          .in('order_id', ids),
    ),
  ]);

  const riskBy = new Map(riskRes.rows.map((r) => [r.order_id, r]));

  // Đếm mốc TRỄ THỰC TẾ: quá ngày kế hoạch mà chưa có ngày thực tế thì tính là
  // trễ, không cần chờ ai vào bấm đổi trạng thái.
  const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const lateBy = new Map<string, number>();
  for (const m of msRes.rows) {
    if (m.status === 'SKIPPED' || m.actual_date) continue;
    if (m.planned_date && m.planned_date < today) {
      lateBy.set(m.order_id, (lateBy.get(m.order_id) ?? 0) + 1);
    }
  }

  const rows: PoRow[] = ordersRes.rows.map((r) => {
    const st = one(r.styles);
    const risk = riskBy.get(r.id);
    return {
      id: r.id,
      po_number: r.po_number,
      style_no: st?.style_no ?? null,
      style_name: st?.style_name ?? null,
      sam_minutes: st?.sam_minutes === null || st?.sam_minutes === undefined ? null : Number(st.sam_minutes),
      customer_name: r.customer_name,
      total_quantity: Number(r.total_quantity),
      order_type: r.order_type,
      currency: r.currency,
      unit_price: r.unit_price === null ? null : Number(r.unit_price),
      order_date: r.order_date,
      delivery_date: r.delivery_date,
      ex_factory_date: r.ex_factory_date,
      factory_name: r.factory_name,
      status: r.status,
      risk_score: risk ? Number(risk.total_score) : null,
      risk_level: risk?.risk_level ?? null,
      late_milestones: lateBy.get(r.id) ?? 0,
    };
  });

  return { rows, error: null };
}

// ─── PO 360° ────────────────────────────────────────────────────────────────

export interface Po360Header {
  id: string;
  po_number: string;
  customer_name: string;
  style_id: string | null;
  style_no: string | null;
  style_name: string | null;
  sam_minutes: number | null;
  total_quantity: number;
  order_type: string | null;
  incoterm: string | null;
  currency: string | null;
  unit_price: number | null;
  order_date: string | null;
  delivery_date: string;
  ex_factory_date: string | null;
  factory_name: string | null;
  ship_mode: string | null;
  status: string;
}

/** Nhu cầu NPL của PO: TÍNH RA từ định mức mã hàng × số lượng, không nhập lại */
export interface MaterialNeed extends StyleBomRow {
  required_qty: number;
}

export interface ProductionRow {
  line_name: string | null;
  target_qty: number;
  actual_qty: number;
  log_date: string;
}

export interface QualityRow {
  line_name: string;
  inspected_qty: number;
  passed_qty: number;
  defect_qty: number;
  created_at: string;
}

export interface PackingRow {
  carton_code: string;
  color_code: string;
  size_code: string;
  quantity_per_carton: number;
  gross_weight_kg: number | null;
  status: string;
}

export interface ShipmentRow {
  shipment_no: string;
  container_no: string | null;
  vessel_name: string | null;
  destination_port: string | null;
  etd_date: string | null;
  status: string;
}

export interface Po360Data {
  header: Po360Header | null;
  breakdown: SizeBreakdownRow[];
  milestones: MilestoneRow[];
  samples: SampleRow[];
  materialNeeds: MaterialNeed[];
  production: ProductionRow[];
  quality: QualityRow[];
  packing: PackingRow[];
  shipments: ShipmentRow[];
  risk: RiskRow | null;
  comments: CommentRow[];
  documents: DocumentRow[];
  /** Lỗi theo TỪNG tab con — một tab hỏng không làm hỏng chín tab kia */
  errors: Record<string, string | null>;
}

const EMPTY: Omit<Po360Data, 'errors'> = {
  header: null,
  breakdown: [],
  milestones: [],
  samples: [],
  materialNeeds: [],
  production: [],
  quality: [],
  packing: [],
  shipments: [],
  risk: null,
  comments: [],
  documents: [],
};

/**
 * Nạp toàn bộ dữ liệu cho màn hình PO 360°.
 *
 * Mười truy vấn chạy SONG SONG. Gọi tuần tự thì mở một PO mất mười lượt đi về
 * máy chủ nối đuôi nhau — trên mạng xưởng là vài giây chờ trắng màn hình.
 */
export async function getPo360(orderId: string): Promise<Po360Data> {
  const g = await guard();
  if (!g.supabase) {
    return { ...EMPTY, errors: { all: g.error } };
  }
  const sb = g.supabase;

  const headerP = sb
    .from('orders')
    .select(
      'id, po_number, customer_name, style_id, total_quantity, order_type, incoterm,' +
        ' currency, unit_price, order_date, delivery_date, ex_factory_date, factory_name,' +
        ' ship_mode, status, styles ( style_no, style_name, sam_minutes )',
    )
    .eq('id', orderId)
    .maybeSingle();

  const [
    headerRes, bdRes, msRes, spRes, prodRes, qaRes, ctRes, shRes, riskRes, cmRes, docRes,
  ] = await Promise.all([
    headerP,
    safeQuery<SizeBreakdownRow>('số lượng theo màu-size', () =>
      sb.from('order_size_breakdown').select('id, color_code, size_code, quantity').eq('order_id', orderId),
    ),
    safeQuery<MilestoneRow>('lịch trình T&A', () =>
      sb
        .from('order_milestones')
        .select(
          'id, seq_no, milestone, planned_date, actual_date, is_critical,' +
            ' responsible_role, status, delay_days',
        )
        .eq('order_id', orderId)
        .order('seq_no'),
    ),
    safeQuery<SampleRow>('mẫu duyệt', () =>
      sb
        .from('sample_submissions')
        .select('id, stage, round_no, sent_date, reply_date, status, buyer_comment, attachment_url')
        .eq('order_id', orderId)
        .order('created_at'),
    ),
    safeQuery<{ target_qty: number; actual_qty: number; log_date: string; sewing_lines: { line_name: string } | { line_name: string }[] | null }>(
      'tiến độ sản xuất',
      () =>
        sb
          .from('hourly_production_logs')
          .select('target_qty, actual_qty, log_date, sewing_lines ( line_name )')
          .eq('order_id', orderId)
          .order('log_date', { ascending: false })
          .limit(200),
    ),
    safeQuery<QualityRow>('báo cáo chất lượng', () =>
      sb
        .from('qa_audit_reports')
        .select('line_name, inspected_qty, passed_qty, defect_qty, created_at')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(200),
    ),
    safeQuery<PackingRow>('đóng thùng', () =>
      sb
        .from('cartons')
        .select('carton_code, color_code, size_code, quantity_per_carton, gross_weight_kg, status')
        .eq('order_id', orderId)
        .limit(500),
    ),
    safeQuery<ShipmentRow>('lệnh giao hàng', () =>
      sb
        .from('shipments')
        .select('shipment_no, container_no, vessel_name, destination_port, etd_date, status')
        .eq('order_id', orderId),
    ),
    safeQuery<RiskRow>('điểm rủi ro', () =>
      sb.from('v_order_risk').select('*').eq('order_id', orderId),
    ),
    safeQuery<CommentRow & { profiles: { full_name: string } | { full_name: string }[] | null }>(
      'thảo luận',
      () =>
        sb
          .from('md_comments')
          .select(
            'id, parent_id, body, mentions, is_task, task_status, assigned_role, due_date,' +
              ' created_at, profiles:author_id ( full_name )',
          )
          .eq('entity_type', 'ORDER')
          .eq('entity_id', orderId)
          .order('created_at', { ascending: false })
          .limit(100),
    ),
    safeQuery<DocumentRow>('tài liệu', () =>
      sb
        .from('md_documents')
        .select('id, doc_type, title, storage_path, file_size, mime_type, version, created_at')
        .eq('entity_type', 'ORDER')
        .eq('entity_id', orderId)
        .order('created_at', { ascending: false }),
    ),
  ]);

  const errors: Record<string, string | null> = {
    header: headerRes.error ? `Không đọc được đơn hàng: ${headerRes.error.message}` : null,
    breakdown: bdRes.error,
    milestones: msRes.error,
    samples: spRes.error,
    production: prodRes.error,
    quality: qaRes.error,
    packing: ctRes.error,
    shipments: shRes.error,
    risk: riskRes.error,
    comments: cmRes.error,
    documents: docRes.error,
  };

  const h = headerRes.data as
    | (Omit<Po360Header, 'style_no' | 'style_name' | 'sam_minutes'> & {
        styles: { style_no: string; style_name: string; sam_minutes: number | null } | { style_no: string; style_name: string; sam_minutes: number | null }[] | null;
      })
    | null;
  const st = h ? one(h.styles) : null;

  const header: Po360Header | null = h
    ? {
        ...h,
        total_quantity: Number(h.total_quantity),
        unit_price: h.unit_price === null ? null : Number(h.unit_price),
        style_no: st?.style_no ?? null,
        style_name: st?.style_name ?? null,
        sam_minutes: st?.sam_minutes === undefined || st?.sam_minutes === null ? null : Number(st.sam_minutes),
      }
    : null;

  // ── Nhu cầu NPL: TÍNH RA từ định mức mã hàng, KHÔNG nhập lại ──────────────
  // Đây chính là nguyên tắc không nhập dữ liệu hai lần: sửa định mức ở mã hàng
  // là mọi PO dùng mã đó đều cập nhật theo.
  let materialNeeds: MaterialNeed[] = [];
  if (header?.style_id) {
    const bomRes = await safeQuery<{
      id: string; item_name: string; category: string; unit: string;
      consumption_per_pcs: number; wastage_percent: number; net_consumption: number;
      supplier: string | null;
      style_colorways: { color_code: string } | { color_code: string }[] | null;
    }>('định mức NPL của mã hàng', () =>
      sb
        .from('style_bom')
        .select(
          'id, item_name, category, unit, consumption_per_pcs, wastage_percent,' +
            ' net_consumption, supplier, style_colorways ( color_code )',
        )
        .eq('style_id', header.style_id as string),
    );
    errors.materialNeeds = bomRes.error;

    materialNeeds = bomRes.rows.map((b) => {
      const net = Number(b.net_consumption);
      return {
        id: b.id,
        item_name: b.item_name,
        category: b.category,
        unit: b.unit,
        consumption_per_pcs: Number(b.consumption_per_pcs),
        wastage_percent: Number(b.wastage_percent),
        net_consumption: net,
        supplier: b.supplier,
        color_code: one(b.style_colorways)?.color_code ?? null,
        required_qty: Number((net * header.total_quantity).toFixed(3)),
      };
    });
  } else {
    errors.materialNeeds = header ? 'Đơn hàng chưa gắn mã hàng nên chưa tính được nhu cầu NPL.' : null;
  }

  return {
    header,
    breakdown: bdRes.rows,
    milestones: msRes.rows.map((m) => ({
      ...m,
      delay_days: m.delay_days === null ? null : Number(m.delay_days),
    })),
    samples: spRes.rows,
    materialNeeds,
    production: prodRes.rows.map((p) => ({
      line_name: one(p.sewing_lines)?.line_name ?? null,
      target_qty: Number(p.target_qty),
      actual_qty: Number(p.actual_qty),
      log_date: p.log_date,
    })),
    quality: qaRes.rows,
    packing: ctRes.rows,
    shipments: shRes.rows,
    risk: riskRes.rows[0] ?? null,
    comments: cmRes.rows.map((c) => ({
      ...c,
      author_name: one(c.profiles)?.full_name ?? null,
      author_role: null,
    })),
    documents: docRes.rows,
    errors,
  };
}

/** Đếm nhanh cho dải KPI đầu tab PO */
export function summarizePoList(rows: ReadonlyArray<PoRow>) {
  const running = rows.filter((r) => isPoRunning(r.status));
  return {
    total: rows.length,
    running: running.length,
    late: rows.filter((r) => r.late_milestones > 0).length,
    critical: rows.filter((r) => r.risk_level === 'CRITICAL' || r.risk_level === 'HIGH').length,
  };
}
