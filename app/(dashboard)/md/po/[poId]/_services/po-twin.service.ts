import 'server-only';

import { guard, safeQuery, one } from '../../../_services/guard';
import { factsOf } from '@/lib/mos/po-flow';
import type {
  PoTwinHeader, PoTwinResult,
} from '@/lib/mos/po-twin.contract';

// ============================================================================
// PO DIGITAL TWIN — TẦNG NGHIỆP VỤ CHO THANH ĐẦU
//
// ─── ĐIỀU V & VII: KHÔNG MỘT PHÉP TÍNH NÀO Ở COMPONENT ───────────────────
// Cộng sản lượng, quy ra phần trăm, tính DHU, tính công nợ — tất cả ở đây.
// Component nhận số đã tính và vẽ.
//
// ─── VÌ SAO KHÔNG SỬA po.service.ts ĐANG CHẠY ────────────────────────────
// Luật #10 của bản phê duyệt: không sửa service đang hoạt động. `po.service.ts`
// đang phục vụ bảng danh sách và PO 360° cũ mà khách hàng dùng hàng ngày.
// Tệp này ĐỌC SONG SONG, không đụng vào nó.
//
// ─── VÌ SAO MỖI LĨNH VỰC MỘT LỖI RIÊNG ───────────────────────────────────
// Một PO có thể đọc được sản xuất nhưng hỏng phần tài chính. Gộp thành một lỗi
// chung rồi báo "không tải được trang" là lấy đi bảy phần dữ liệu còn dùng
// được. Ô nào hỏng thì ô đó hiện "—", phần còn lại vẫn làm việc.
// ============================================================================

interface RawOrder {
  id: string; po_number: string; customer_id: string | null; customer_name: string | null;
  total_quantity: number | null; order_date: string | null; delivery_date: string | null;
  ex_factory_date: string | null; order_type: string | null; currency: string | null;
  unit_price: number | null; status: string; factory_name: string | null;
  styles: { style_no: string; style_name: string | null } | { style_no: string; style_name: string | null }[] | null;
}
interface RawRisk {
  material_score: number | null; schedule_score: number | null; quality_score: number | null;
  capacity_score: number | null; total_score: number | null; risk_level: string | null;
  computed_at: string | null;
}
interface RawProd { qty_ok: number | null; qty_defect: number | null; stage: string | null }
interface RawCut { total_planned_pcs: number | null; total_actual_pcs: number | null }
interface RawBom { npl_status: string | null }
interface RawQa { checked_qty: number | null; qty_defect: number | null; aql_status: string | null }
interface RawFin {
  unit_price: number | null; advance_pay: number | null; total_pay: number | null;
  penalty_amount: number | null; qa_passed_qty: number | null;
}
interface RawShip { etd_date: string | null }

const n = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};

/** Cộng một cột. Trả null khi KHÔNG CÓ DÒNG NÀO — mảng rỗng cộng ra 0, mà 0 ở
 *  đây nghĩa là "đã may xong 0 sản phẩm", khác hẳn "chưa ai nhập gì". */
function sum<T>(rows: readonly T[], pick: (r: T) => number | null): number | null {
  if (rows.length === 0) return null;
  return rows.reduce((s, r) => s + (pick(r) ?? 0), 0);
}

export async function getPoTwinHeader(poId: string): Promise<PoTwinResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };
  const sb = g.supabase;

  const [ord, risk, prod, cut, bom, qa, fin, ship, res, doc, chg, smp] = await Promise.all([
    safeQuery<RawOrder>('đơn hàng', () =>
      sb.from('orders').select(
        'id, po_number, customer_id, customer_name, total_quantity, order_date, delivery_date,' +
        // ⚠️ ĐÃ ĐO: orders KHÔNG có khoá ngoại tới `subcons`, nên `subcons(name)`
        // làm PostgREST từ chối cả câu truy vấn. Tên nhà máy nằm THẲNG trong cột
        // `orders.factory_name` — đúng cách po.service.ts đang dùng.
        'ex_factory_date, order_type, currency, unit_price, status, factory_name,' +
        'styles(style_no, style_name)').eq('id', poId).limit(1)),
    safeQuery<RawRisk>('điểm rủi ro', () =>
      sb.from('v_order_risk').select(
        'material_score, schedule_score, quality_score, capacity_score, total_score, risk_level, computed_at')
        .eq('order_id', poId).order('computed_at', { ascending: false }).limit(1)),
    safeQuery<RawProd>('sản lượng', () =>
      sb.from('prod_logs').select('qty_ok, qty_defect, stage').eq('order_id', poId).limit(5000)),
    safeQuery<RawCut>('lệnh cắt', () =>
      sb.from('cut_tickets').select('total_planned_pcs, total_actual_pcs').eq('order_id', poId).limit(500)),
    safeQuery<RawBom>('định mức NPL', () =>
      sb.from('bom').select('npl_status').eq('order_id', poId).limit(500)),
    safeQuery<RawQa>('kiểm chất lượng', () =>
      sb.from('qa_logs').select('checked_qty, qty_defect, aql_status').eq('order_id', poId).limit(2000)),
    safeQuery<RawFin>('tài chính', () =>
      sb.from('financial_records').select('unit_price, advance_pay, total_pay, penalty_amount, qa_passed_qty')
        .eq('order_id', poId).limit(200)),
    safeQuery<RawShip>('lô xuất', () =>
      sb.from('shipments').select('etd_date').eq('order_id', poId).order('etd_date').limit(200)),
    safeQuery<{ id: string }>('giữ chỗ NPL', () =>
      sb.from('stock_reservations').select('id').eq('order_id', poId).in('status', ['ACTIVE', 'ALLOCATED']).limit(2000)),
    safeQuery<{ id: string }>('tài liệu', () =>
      sb.from('md_documents').select('id').eq('entity_type', 'ORDER').eq('entity_id', poId).limit(500)),
    safeQuery<{ id: string }>('yêu cầu thay đổi', () =>
      sb.from('change_requests').select('id').eq('order_id', poId).limit(500)),
    safeQuery<{ id: string }>('mẫu chờ duyệt', () =>
      sb.from('sample_submissions').select('id').eq('order_id', poId).limit(500)),
  ]);

  if (ord.error) return { ok: false, message: ord.error };
  const o = ord.rows[0];
  if (!o) return { ok: false, message: 'Không tìm thấy đơn hàng này.' };

  // Lĩnh vực nào đọc hỏng thì ghi tên vào đây; giao diện hiện "—" đúng ô đó.
  const partial = [
    risk.error && 'điểm rủi ro', prod.error && 'sản lượng', cut.error && 'lệnh cắt',
    bom.error && 'định mức NPL', qa.error && 'kiểm chất lượng', fin.error && 'tài chính',
    ship.error && 'lô xuất', res.error && 'giữ chỗ NPL',
  ].filter((x): x is string => typeof x === 'string');

  const style = one(o.styles);
  const qty = n(o.total_quantity) ?? 0;

  const sewnOk = prod.error ? null : sum(prod.rows, (r) => n(r.qty_ok));
  const inspected = qa.error ? null : sum(qa.rows, (r) => n(r.checked_qty));
  const defects = qa.error ? null : sum(qa.rows, (r) => n(r.qty_defect));

  const unitPrice = n(o.unit_price) ?? (fin.error ? null : n(fin.rows[0]?.unit_price));
  const advance = fin.error ? null : sum(fin.rows, (r) => n(r.advance_pay));
  const paid = fin.error ? null : sum(fin.rows, (r) => n(r.total_pay));
  const penalty = fin.error ? null : sum(fin.rows, (r) => n(r.penalty_amount));
  const orderValue = unitPrice !== null && qty > 0 ? unitPrice * qty : null;

  const facts = factsOf({
    status: o.status,
    delivery_date: o.delivery_date ?? '',
    risk_level: risk.error ? null : (risk.rows[0]?.risk_level ?? null),
    late_milestones: 0,
    total_quantity: qty,
  });

  const data: PoTwinHeader = {
    identity: {
      id: o.id,
      poNumber: o.po_number,
      customerId: o.customer_id,
      customerName: o.customer_name ?? '—',
      styleNo: style?.style_no ?? null,
      styleName: style?.style_name ?? null,
      totalQuantity: qty,
      orderDate: o.order_date,
      deliveryDate: o.delivery_date,
      exFactoryDate: o.ex_factory_date,
      factoryName: o.factory_name,
      orderType: o.order_type,
      currency: o.currency,
      unitPrice,
      status: o.status,
    },
    risk: {
      materialScore: risk.error ? null : n(risk.rows[0]?.material_score),
      scheduleScore: risk.error ? null : n(risk.rows[0]?.schedule_score),
      qualityScore: risk.error ? null : n(risk.rows[0]?.quality_score),
      capacityScore: risk.error ? null : n(risk.rows[0]?.capacity_score),
      totalScore: risk.error ? null : n(risk.rows[0]?.total_score),
      level: risk.error ? null : (risk.rows[0]?.risk_level ?? null),
      computedAt: risk.error ? null : (risk.rows[0]?.computed_at ?? null),
    },
    progress: {
      sewnOk,
      sewnDefect: prod.error ? null : sum(prod.rows, (r) => n(r.qty_defect)),
      cutPlanned: cut.error ? null : sum(cut.rows, (r) => n(r.total_planned_pcs)),
      cutActual: cut.error ? null : sum(cut.rows, (r) => n(r.total_actual_pcs)),
      packedCartons: null, // Tab 6 sẽ nạp — thùng hàng không thuộc thanh đầu
      // Chia cho 0 ra Infinity rồi hiện ra màn hình là "∞%". Thiếu mẫu số thì
      // trả null để ô hiện "—".
      sewnPct: sewnOk !== null && qty > 0 ? Math.min((sewnOk / qty) * 100, 100) : null,
    },
    material: {
      bomLines: bom.error ? null : bom.rows.length,
      readyLines: bom.error ? null : bom.rows.filter((r) => (r.npl_status ?? '').toUpperCase() === 'READY').length,
      missingLines: bom.error ? null : bom.rows.filter((r) => (r.npl_status ?? '').toUpperCase() !== 'READY').length,
      reservedRolls: res.error ? null : res.rows.length,
    },
    quality: {
      inspected,
      defects,
      // Lỗi trên trăm sản phẩm. Chưa kiểm cái nào thì null, KHÔNG phải 0 —
      // 0 nghĩa là kiểm rồi và không có lỗi nào.
      dhu: inspected !== null && inspected > 0 && defects !== null ? (defects / inspected) * 100 : null,
      aqlPassed: qa.error ? null : qa.rows.filter((r) => (r.aql_status ?? '').toUpperCase() === 'PASS').length,
      aqlFailed: qa.error ? null : qa.rows.filter((r) => (r.aql_status ?? '').toUpperCase() === 'FAIL').length,
    },
    finance: {
      unitPrice,
      currency: o.currency,
      orderValue,
      advancePay: advance,
      totalPay: paid,
      penalty,
      outstanding: orderValue !== null ? orderValue - (paid ?? 0) - (advance ?? 0) + (penalty ?? 0) : null,
    },
    shipment: {
      shipments: ship.error ? null : ship.rows.length,
      cartons: null, // Tab 6 nạp
      earliestEtd: ship.error ? null : (ship.rows[0]?.etd_date ?? null),
    },
    collab: {
      comments: null, // Tab 5 nạp — đếm bình luận cần join hai nguồn, để đúng chỗ
      documents: doc.error ? null : doc.rows.length,
      openChanges: chg.error ? null : chg.rows.length,
      pendingSamples: smp.error ? null : smp.rows.length,
    },
    stage: facts.stage,
    urgency: facts.urgency,
    daysLeft: facts.daysLeft,
  };

  return { ok: true, data, partial };
}
