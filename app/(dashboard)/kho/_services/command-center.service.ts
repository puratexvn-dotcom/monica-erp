import 'server-only';

import { guard, safeQuery, one } from './guard';
import { vnToday, daysPast, isBelowMin, stockValue } from '@/schemas/warehouse';

// ============================================================================
// MISSION CONTROL CỦA KHO — BA CỘT
//
// ─── NGUYÊN TẮC GIỐNG HỆT COMMAND CENTER CỦA MERCHANDISER ─────────────────
// KHÔNG dựng bảng "việc cần làm" riêng. Việc của thủ kho vốn đã nằm trong
// nghiệp vụ: lô hàng đang chờ nhận, lô chờ kiểm, lệnh chờ soạn, phiếu kiểm kê
// còn mở. Ở đây chỉ GOM lại và sắp theo mức khẩn.
//
// Nhờ vậy danh sách luôn khớp nghiệp vụ vì nó CHÍNH LÀ nghiệp vụ — không có
// chuyện đánh dấu xong ở màn hình này mà phiếu nhập vẫn treo ở khâu kiểm.
//
// ─── NGƯỠNG CẢNH BÁO ĐẶT CAO ──────────────────────────────────────────────
// Cảnh báo mà cái gì cũng kêu thì thủ kho ngừng đọc, tới lúc đứt chuyền thật
// lại bỏ qua. Ngưỡng cụ thể ghi ngay tại chỗ dùng bên dưới.
// ============================================================================

export type WhTaskKind = 'RECEIVE' | 'INSPECT' | 'PICK' | 'COUNT';

export interface WhTask {
  id: string;
  kind: WhTaskKind;
  /** Câu mệnh lệnh: đọc là biết phải LÀM GÌ, không phải suy ra */
  title: string;
  subtitle: string;
  refNo: string;
  /** Số ngày phiếu đã nằm ở khâu này. Càng lâu càng phải xử lý trước. */
  ageDays: number;
}

export interface WhKpi {
  /** Tổng tồn thực tế, cộng qua mọi đơn vị tính — chỉ để đếm đầu dòng, không
   *  cộng số lượng khác đơn vị vào nhau. */
  skuCount: number | null;
  totalOnHand: number | null;
  totalAvailable: number | null;
  totalReserved: number | null;
  /** Giá trị tồn kho. null = CHƯA đơn nào có đơn giá, khác hẳn 0. */
  totalValue: number | null;
  valuedCount: number;
  unvaluedCount: number;
  currency: string;
  /** Hàng đang đi đường = đã đặt mua, chưa nhận đủ */
  inTransitQty: number | null;
  receivedToday: number | null;
  issuedToday: number | null;
}

export type WhAlertKind = 'SHORTAGE' | 'LATE_ARRIVAL' | 'QA_FAIL' | 'NO_LOCATION' | 'SLOW_MOVING';

export interface WhAlert {
  id: string;
  kind: WhAlertKind;
  title: string;
  detail: string;
  metric: string;
}

export interface WhCommandCenter {
  tasks: WhTask[];
  kpi: WhKpi;
  alerts: WhAlert[];
  errors: Record<string, string | null>;
}

const EMPTY_KPI: WhKpi = {
  skuCount: null, totalOnHand: null, totalAvailable: null, totalReserved: null,
  totalValue: null, valuedCount: 0, unvaluedCount: 0, currency: 'USD',
  inTransitQty: null, receivedToday: null, issuedToday: null,
};

export async function getWhCommandCenter(): Promise<WhCommandCenter> {
  const g = await guard();
  if (!g.supabase) return { tasks: [], kpi: EMPTY_KPI, alerts: [], errors: { all: g.error } };
  const sb = g.supabase;
  const today = vnToday();

  const [slRes, inRes, outRes, cntRes, poRes, mvRes, rollRes] = await Promise.all([
    safeQuery<RawLevel>('bảng tồn kho', () =>
      sb
        .from('stock_levels')
        .select(
          'material_id, uom, on_hand_qty, reserved_qty, available_qty, bin_id, updated_at,' +
            ' materials ( material_code, name, unit_price, currency, min_stock_qty )',
        )
        .limit(3000),
    ),
    safeQuery<RawInbound>('phiếu nhập', () =>
      sb
        .from('inbound_receipts')
        .select('id, receipt_no, status, received_date, suppliers ( name )')
        .limit(1000),
    ),
    safeQuery<RawOutbound>('lệnh xuất', () =>
      sb
        .from('outbound_issues')
        .select('id, issue_no, status, issue_date, issue_to_dept, orders ( po_number )')
        .limit(1000),
    ),
    safeQuery<{ id: string; count_no: string; status: string; count_date: string }>('phiếu kiểm kê', () =>
      sb.from('stock_counts').select('id, count_no, status, count_date').limit(500),
    ),
    safeQuery<RawPoItem>('đơn mua', () =>
      sb
        .from('purchase_order_items')
        .select('outstanding_qty, purchase_orders ( po_no, status, eta_date, suppliers ( name ) )')
        .limit(2000),
    ),
    safeQuery<{ movement_type: string; qty: number; created_at: string }>('biến động kho', () =>
      sb.from('stock_movements').select('movement_type, qty, created_at').limit(5000),
    ),
    safeQuery<RawRoll>('cuộn vải', () =>
      sb
        .from('fabric_rolls')
        .select('id, roll_code, qa_status, four_point_score, bin_id, status, materials ( name )')
        .limit(2000),
    ),
  ]);

  // ─── CỘT TRÁI: NHIỆM VỤ HÔM NAY ──────────────────────────────────────────
  const tasks: WhTask[] = [];

  for (const r of inRes.rows) {
    const age = r.received_date ? Math.max(0, daysPast(r.received_date, today)) : 0;
    if (r.status === 'ARRIVED') {
      tasks.push({
        id: `in-${r.id}`, kind: 'RECEIVE',
        title: `Nhận lô hàng ${r.receipt_no}`,
        subtitle: one(r.suppliers)?.name ?? 'Chưa rõ nhà cung cấp',
        refNo: r.receipt_no, ageDays: age,
      });
    } else if (r.status === 'INSPECTING') {
      tasks.push({
        id: `insp-${r.id}`, kind: 'INSPECT',
        title: `Kiểm hàng lô ${r.receipt_no}`,
        subtitle: 'Chấm điểm 4 point, đo co rút và độ bền màu',
        refNo: r.receipt_no, ageDays: age,
      });
    }
  }

  for (const o of outRes.rows) {
    if (!['REQUESTED', 'ALLOCATED', 'PICKING'].includes(o.status)) continue;
    const age = o.issue_date ? Math.max(0, daysPast(o.issue_date, today)) : 0;
    tasks.push({
      id: `out-${o.id}`, kind: 'PICK',
      title: o.status === 'REQUESTED' ? `Phân bổ lệnh ${o.issue_no}` : `Soạn hàng lệnh ${o.issue_no}`,
      subtitle: `${one(o.orders)?.po_number ?? 'Không gắn PO'} · giao ${o.issue_to_dept ?? 'chưa rõ bộ phận'}`,
      refNo: o.issue_no, ageDays: age,
    });
  }

  for (const c of cntRes.rows) {
    if (!['OPEN', 'COUNTING', 'REVIEW'].includes(c.status)) continue;
    tasks.push({
      id: `cnt-${c.id}`, kind: 'COUNT',
      title: `Kiểm kê ${c.count_no}`,
      subtitle: c.status === 'REVIEW' ? 'Chờ đối chiếu chênh lệch' : 'Đang đếm thực tế',
      refNo: c.count_no,
      ageDays: c.count_date ? Math.max(0, daysPast(c.count_date, today)) : 0,
    });
  }

  // Việc tồn lâu nhất lên đầu. Cùng số ngày thì nhận hàng trước — hàng nằm ở
  // sân chờ nhận là hàng chưa vào sổ, rủi ro mất mát cao nhất.
  const KIND_WEIGHT: Record<WhTaskKind, number> = { RECEIVE: 0, INSPECT: 1, PICK: 2, COUNT: 3 };
  tasks.sort((a, b) => b.ageDays - a.ageDays || KIND_WEIGHT[a.kind] - KIND_WEIGHT[b.kind]);

  // ─── CỘT GIỮA: TỔNG QUAN TỒN KHO ─────────────────────────────────────────
  const levels = slRes.rows;
  const valued = levels
    .map((l) => ({
      value: stockValue(Number(l.on_hand_qty) || 0, one(l.materials)?.unit_price ?? null),
      currency: one(l.materials)?.currency ?? 'USD',
    }))
    .filter((v) => v.value !== null);

  const curCount = new Map<string, number>();
  for (const v of valued) curCount.set(v.currency, (curCount.get(v.currency) ?? 0) + 1);
  const currency = [...curCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'USD';

  const inTransit = poRes.rows
    .filter((p) => {
      const po = one(p.purchase_orders);
      return po && ['SENT', 'CONFIRMED', 'PARTIAL'].includes(po.status);
    })
    .reduce((s, p) => s + (Number(p.outstanding_qty) || 0), 0);

  const todayMoves = mvRes.rows.filter((m) => m.created_at?.slice(0, 10) === today);

  const kpi: WhKpi = {
    skuCount: slRes.error ? null : new Set(levels.map((l) => l.material_id)).size,
    totalOnHand: slRes.error ? null : levels.reduce((s, l) => s + (Number(l.on_hand_qty) || 0), 0),
    totalAvailable: slRes.error ? null : levels.reduce((s, l) => s + (Number(l.available_qty) || 0), 0),
    totalReserved: slRes.error ? null : levels.reduce((s, l) => s + (Number(l.reserved_qty) || 0), 0),
    // Chưa dòng nào có đơn giá thì trả null để giao diện hiện "—". Hiện 0 ở đây
    // nghĩa là báo cả kho không đáng giá gì — sai và dễ bị đem đi báo cáo.
    totalValue: slRes.error || valued.length === 0
      ? null
      : Number(valued.reduce((s, v) => s + (v.value ?? 0), 0).toFixed(2)),
    valuedCount: valued.length,
    unvaluedCount: levels.length - valued.length,
    currency,
    inTransitQty: poRes.error ? null : Number(inTransit.toFixed(3)),
    receivedToday: mvRes.error
      ? null
      : todayMoves.filter((m) => m.movement_type === 'RECEIPT').reduce((s, m) => s + Math.abs(Number(m.qty) || 0), 0),
    issuedToday: mvRes.error
      ? null
      : todayMoves.filter((m) => m.movement_type === 'ISSUE').reduce((s, m) => s + Math.abs(Number(m.qty) || 0), 0),
  };

  // ─── CỘT PHẢI: CẢNH BÁO RỦI RO ───────────────────────────────────────────
  const alerts: WhAlert[] = [];

  // 1. Thiếu hụt: phần CÓ SẴN tụt dưới mức tồn tối thiểu.
  //    Chưa khai mức tối thiểu thì KHÔNG cảnh báo — ngưỡng chưa ai đặt ra thì
  //    cảnh báo dựa trên nó là cảnh báo giả.
  for (const l of levels) {
    const m = one(l.materials);
    const min = m?.min_stock_qty === null || m?.min_stock_qty === undefined ? null : Number(m.min_stock_qty);
    const avail = Number(l.available_qty) || 0;
    if (!isBelowMin(avail, min)) continue;
    alerts.push({
      id: `sh-${l.material_id}`, kind: 'SHORTAGE',
      title: `Thiếu hụt: ${m?.name ?? m?.material_code ?? 'Vật tư'}`,
      detail: `Có sẵn ${avail} / tối thiểu ${min} ${l.uom}`,
      metric: `thiếu ${Number(((min as number) - avail).toFixed(3))}`,
    });
  }

  // 2. Hàng về trễ: quá ngày dự kiến từ 3 ngày mà chưa nhận đủ
  for (const p of poRes.rows) {
    const po = one(p.purchase_orders);
    if (!po?.eta_date || !['SENT', 'CONFIRMED', 'PARTIAL'].includes(po.status)) continue;
    if ((Number(p.outstanding_qty) || 0) <= 0) continue;
    const late = daysPast(po.eta_date, today);
    if (late < 3) continue;
    alerts.push({
      id: `lt-${po.po_no}`, kind: 'LATE_ARRIVAL',
      title: `Hàng về trễ: ${po.po_no}`,
      detail: one(po.suppliers)?.name ?? 'Chưa rõ nhà cung cấp',
      metric: `trễ ${late} ngày`,
    });
  }

  // 3. Rớt QA
  for (const r of rollRes.rows) {
    if (r.qa_status !== 'FAILED') continue;
    alerts.push({
      id: `qa-${r.id}`, kind: 'QA_FAIL',
      title: `Cuộn rớt QA: ${r.roll_code}`,
      detail: one(r.materials)?.name ?? 'Chưa rõ vật tư',
      metric: r.four_point_score === null ? 'chưa có điểm' : `${Number(r.four_point_score)} điểm`,
    });
  }

  // 4. Sai vị trí: còn hàng trong kho mà chưa xếp chỗ — không tìm ra khi cần lấy
  const noLoc = levels.filter((l) => !l.bin_id && (Number(l.on_hand_qty) || 0) > 0);
  if (noLoc.length > 0) {
    alerts.push({
      id: 'noloc', kind: 'NO_LOCATION',
      title: 'Có hàng chưa xếp vị trí',
      detail: 'Còn tồn nhưng chưa gán ô kệ, thủ kho sẽ không tìm ra khi cần lấy',
      metric: `${noLoc.length} dòng`,
    });
  }

  // 5. Tồn đọng: còn hàng nhưng KHÔNG có biến động nào trong 90 ngày.
  //    Ngưỡng 90 ngày vì một mùa vụ ngành may thường kéo 3 tháng — dưới mức đó
  //    thì "chậm luân chuyển" chỉ là chưa tới lượt dùng.
  const lastMoveBy = new Map<string, string>();
  for (const l of levels) {
    if (l.updated_at) lastMoveBy.set(l.material_id, l.updated_at);
  }
  for (const [materialId, at] of lastMoveBy) {
    const idle = daysPast(at.slice(0, 10), today);
    if (idle < 90) continue;
    const l = levels.find((x) => x.material_id === materialId);
    if (!l || (Number(l.on_hand_qty) || 0) <= 0) continue;
    alerts.push({
      id: `slow-${materialId}`, kind: 'SLOW_MOVING',
      title: `Tồn đọng: ${one(l.materials)?.name ?? materialId}`,
      detail: 'Không phát sinh biến động trong hơn 90 ngày',
      metric: `${idle} ngày`,
    });
  }

  return {
    tasks,
    kpi,
    alerts,
    errors: {
      stock: slRes.error,
      inbound: inRes.error,
      outbound: outRes.error,
      counts: cntRes.error,
      purchase: poRes.error,
      movements: mvRes.error,
      rolls: rollRes.error,
    },
  };
}

// ─── Kiểu thô ───────────────────────────────────────────────────────────────

interface RawLevel {
  material_id: string;
  uom: string;
  on_hand_qty: number;
  reserved_qty: number;
  available_qty: number;
  bin_id: string | null;
  updated_at: string | null;
  materials:
    | { material_code: string; name: string; unit_price: number | null; currency: string | null; min_stock_qty: number | null }
    | { material_code: string; name: string; unit_price: number | null; currency: string | null; min_stock_qty: number | null }[]
    | null;
}
interface RawInbound {
  id: string;
  receipt_no: string;
  status: string;
  received_date: string | null;
  suppliers: { name: string } | { name: string }[] | null;
}
interface RawOutbound {
  id: string;
  issue_no: string;
  status: string;
  issue_date: string | null;
  issue_to_dept: string | null;
  orders: { po_number: string } | { po_number: string }[] | null;
}
interface RawPoItem {
  outstanding_qty: number;
  purchase_orders:
    | { po_no: string; status: string; eta_date: string | null; suppliers: { name: string } | { name: string }[] | null }
    | { po_no: string; status: string; eta_date: string | null; suppliers: { name: string } | { name: string }[] | null }[]
    | null;
}
interface RawRoll {
  id: string;
  roll_code: string;
  qa_status: string;
  four_point_score: number | null;
  bin_id: string | null;
  status: string;
  materials: { name: string } | { name: string }[] | null;
}
