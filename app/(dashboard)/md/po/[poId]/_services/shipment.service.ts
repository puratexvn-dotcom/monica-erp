import 'server-only';

import { guard, safeQuery } from '../../../_services/guard';
import {
  delaysOf, flagsOf, summariseShipping, stageIndexOf, daysToFirstEtd,
  type Delays, type ShipSummary, type ShipmentFlag, type ShipmentStatus,
  isShipmentStatus,
} from '@/lib/mos/shipment';
import type { SummaryLine } from './executive.service';

// ============================================================================
// LÁT CẮT 5 — TRUNG TÂM XUẤT HÀNG · TẦNG NGHIỆP VỤ
//
// ─── HAI TRUY VẤN, MỘT LƯỢT CHỜ ──────────────────────────────────────────
// Tổng hợp theo ĐƠN và chi tiết theo LÔ là hai grain khác nhau — gộp vào một
// view sẽ nhân số dòng lên theo số lô và làm sai mọi con số tổng. Hai view,
// chạy SONG SONG bằng Promise.all: thời gian chờ là lượt chậm hơn, không phải
// tổng hai lượt. Đo ở Phase 5: hai truy vấn song song 228ms.
//
// ─── ĐIỀU VII ────────────────────────────────────────────────────────────
// Độ trễ, tỉ lệ, cảnh báo bất thường — tất cả ở lib/mos/shipment.ts. View chỉ
// trả số thô (Điều XXVIII.1: không lưu dữ liệu tính toán được).
//
// ─── RLS ─────────────────────────────────────────────────────────────────
// Hai view đều khai `security_invoker = true` trong migration 024, nên chúng
// tôn trọng RLS của người gọi. Buyer chỉ thấy lô hàng của đơn thuộc khách mình
// — đúng như `buyer_scope_by_order` của migration 018 quy định.
// ============================================================================

export interface ShipmentRow {
  shipmentId: string;
  shipmentNo: string;
  status: ShipmentStatus | null;
  /** Vị trí trong dòng chảy 8 bước. null = đã huỷ hoặc trạng thái lạ. */
  stageIndex: number | null;

  bookingNo: string | null;
  blNo: string | null;
  coNo: string | null;
  invoiceNo: string | null;
  containerNo: string | null;
  sealNo: string | null;
  vesselName: string | null;
  forwarder: string | null;
  incoterm: string | null;
  portOfLoading: string | null;
  destinationPort: string | null;

  bookingDate: string | null;
  stuffingDate: string | null;
  customClearanceDate: string | null;
  gateOutDate: string | null;
  etdDate: string | null;
  atdDate: string | null;
  etaDate: string | null;
  ataDate: string | null;

  cartons: number;
  qty: number;
  notes: string | null;
  delays: Delays;
  flags: ShipmentFlag[];
}

export interface ShipmentCenter {
  summary: ShipSummary;
  shipments: ShipmentRow[];
  /** Số ngày tới chuyến tàu gần nhất. Âm = đã qua. null = chưa có lịch. */
  daysToEtd: number | null;
  poNumber: string | null;
  insights: SummaryLine[];
  partial: string[];
}

export type ShipmentResult =
  | { ok: true; data: ShipmentCenter }
  | { ok: false; message: string };

interface RawReadiness {
  order_id: string;
  po_number: string | null;
  ordered_qty: number | null;
  packed_cartons: number | null;
  packed_qty: number | null;
  shipped_cartons: number | null;
  shipped_qty: number | null;
  shipment_count: number | null;
  shipment_active: number | null;
  first_etd: string | null;
  last_ata: string | null;
}

interface RawShipment {
  shipment_id: string;
  shipment_no: string;
  status: string | null;
  booking_no: string | null;
  bl_no: string | null;
  co_no: string | null;
  invoice_no: string | null;
  container_no: string | null;
  seal_no: string | null;
  vessel_name: string | null;
  forwarder: string | null;
  incoterm: string | null;
  port_of_loading: string | null;
  destination_port: string | null;
  booking_date: string | null;
  stuffing_date: string | null;
  custom_clearance_date: string | null;
  gate_out_date: string | null;
  etd_date: string | null;
  atd_date: string | null;
  eta_date: string | null;
  ata_date: string | null;
  notes: string | null;
  cartons: number | null;
  qty: number | null;
}

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const nOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};

const READY_COLS =
  'order_id, po_number, ordered_qty, packed_cartons, packed_qty,' +
  'shipped_cartons, shipped_qty, shipment_count, shipment_active, first_etd, last_ata';

const SHIP_COLS =
  'shipment_id, shipment_no, status, booking_no, bl_no, co_no, invoice_no,' +
  'container_no, seal_no, vessel_name, forwarder, incoterm,' +
  'port_of_loading, destination_port, booking_date, stuffing_date,' +
  'custom_clearance_date, gate_out_date, etd_date, atd_date, eta_date, ata_date,' +
  'notes, cartons, qty';

export async function getShipmentCenter(poId: string): Promise<ShipmentResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };
  const sb = g.supabase;

  const [readyRes, shipRes] = await Promise.all([
    safeQuery<RawReadiness>('tổng hợp xuất hàng', () =>
      sb.from('v_po_shipment_readiness').select(READY_COLS).eq('order_id', poId).limit(1)),
    safeQuery<RawShipment>('danh sách lô hàng', () =>
      sb.from('v_po_shipments').select(SHIP_COLS).eq('order_id', poId)
        // Chưa có ETD xếp xuống cuối: `nullsFirst: false`. Lô chưa có lịch mà
        // nằm trên đầu sẽ đẩy chuyến sắp chạy xuống dưới màn hình.
        .order('etd_date', { ascending: true, nullsFirst: false }).limit(500)),
  ]);

  if (readyRes.error) {
    const missing = /does not exist|schema cache/i.test(readyRes.error);
    return {
      ok: false,
      message: missing
        ? 'Chưa có view dữ liệu cho chức năng này. Hãy chạy migration 024_shipment_center.sql rồi thử lại.'
        : readyRes.error,
    };
  }

  const partial: string[] = [];
  // Lỗi ở danh sách lô KHÔNG kéo sập cả tab: con số tổng hợp vẫn đọc được và
  // vẫn có ích. Nhưng phải nói ra là mục nào đang thiếu.
  if (shipRes.error) partial.push('shipments');

  const r = readyRes.rows[0];

  const shipments: ShipmentRow[] = shipRes.rows.map((s) => ({
    shipmentId: s.shipment_id,
    shipmentNo: s.shipment_no,
    status: isShipmentStatus(s.status) ? s.status : null,
    stageIndex: stageIndexOf(s.status),
    bookingNo: s.booking_no,
    blNo: s.bl_no,
    coNo: s.co_no,
    invoiceNo: s.invoice_no,
    containerNo: s.container_no,
    sealNo: s.seal_no,
    vesselName: s.vessel_name,
    forwarder: s.forwarder,
    incoterm: s.incoterm,
    portOfLoading: s.port_of_loading,
    destinationPort: s.destination_port,
    bookingDate: s.booking_date,
    stuffingDate: s.stuffing_date,
    customClearanceDate: s.custom_clearance_date,
    gateOutDate: s.gate_out_date,
    etdDate: s.etd_date,
    atdDate: s.atd_date,
    etaDate: s.eta_date,
    ataDate: s.ata_date,
    cartons: n(s.cartons),
    qty: n(s.qty),
    notes: s.notes,
    delays: delaysOf({
      etdDate: s.etd_date, atdDate: s.atd_date, etaDate: s.eta_date, ataDate: s.ata_date,
    }),
    flags: flagsOf({
      status: s.status, etdDate: s.etd_date, atdDate: s.atd_date,
      etaDate: s.eta_date, ataDate: s.ata_date, blNo: s.bl_no, coNo: s.co_no,
    }),
  }));

  const summary = summariseShipping({
    orderedQty: nOrNull(r?.ordered_qty),
    packedQty: n(r?.packed_qty),
    shippedQty: n(r?.shipped_qty),
    packedCartons: n(r?.packed_cartons),
    shippedCartons: n(r?.shipped_cartons),
  });

  const daysToEtd = daysToFirstEtd(r?.first_etd ?? null);

  return {
    ok: true,
    data: {
      summary,
      shipments,
      daysToEtd,
      poNumber: r?.po_number ?? null,
      insights: buildInsights(summary, shipments, daysToEtd),
      partial,
    },
  };
}

/**
 * Câu nhận xét cho người điều hành.
 *
 * Ở service chứ không ở component: câu chữ là việc của giao diện, nhưng QUYẾT
 * ĐỊNH "có đáng cảnh báo không" là nghiệp vụ (Playbook Điều VII, bài học Phase 2).
 */
function buildInsights(
  sum: ShipSummary,
  ships: ShipmentRow[],
  daysToEtd: number | null,
): SummaryLine[] {
  const out: SummaryLine[] = [];
  const s = (v: number): string => String(v);

  if (ships.length === 0 && sum.packedCartons === 0) {
    out.push({ tone: 'INFO', key: 'po_sh_nothing', values: [] });
    return out;
  }

  if (ships.length === 0) {
    // Đã đóng gói mà chưa mở lô hàng nào — hàng đang nằm kho thành phẩm.
    out.push({ tone: 'WARN', key: 'po_sh_packed_no_ship', values: [s(sum.packedCartons)] });
  }

  if (sum.awaitingCartons > 0 && ships.length > 0) {
    out.push({ tone: 'WARN', key: 'po_sh_awaiting', values: [s(sum.awaitingCartons)] });
  }

  if (sum.overPacked) {
    out.push({ tone: 'WARN', key: 'po_sh_overpacked', values: [s(sum.packedQty), s(sum.orderedQty ?? 0)] });
  }

  // Số âm nghĩa là dữ liệu mâu thuẫn: xuất nhiều hơn đã đóng gói. Không im lặng.
  if (sum.awaitingCartons < 0) {
    out.push({ tone: 'DANGER', key: 'po_sh_inconsistent', values: [] });
  }

  const late = ships.filter((x) => x.delays.departure !== null && x.delays.departure > 0);
  if (late.length > 0) {
    const worst = Math.max(...late.map((x) => x.delays.departure ?? 0));
    out.push({ tone: 'DANGER', key: 'po_sh_dep_late', values: [s(late.length), s(worst)] });
  }

  const lateArr = ships.filter((x) => x.delays.arrival !== null && x.delays.arrival > 0);
  if (lateArr.length > 0) {
    const worst = Math.max(...lateArr.map((x) => x.delays.arrival ?? 0));
    out.push({ tone: 'WARN', key: 'po_sh_arr_late', values: [s(lateArr.length), s(worst)] });
  }

  const noDocs = ships.filter((x) => x.flags.includes('NO_DOCS'));
  if (noDocs.length > 0) {
    out.push({ tone: 'DANGER', key: 'po_sh_no_docs', values: [s(noDocs.length)] });
  }

  const otherFlags = ships.filter((x) => x.flags.some((f) => f !== 'NO_DOCS'));
  if (otherFlags.length > 0) {
    out.push({ tone: 'WARN', key: 'po_sh_flagged', values: [s(otherFlags.length)] });
  }

  if (daysToEtd !== null && daysToEtd >= 0 && daysToEtd <= 7 && sum.awaitingCartons > 0) {
    out.push({ tone: 'DANGER', key: 'po_sh_etd_soon', values: [s(daysToEtd), s(sum.awaitingCartons)] });
  }

  return out;
}
