import 'server-only';

import { guard, safeQuery } from '../../../_services/guard';
import {
  judgeLine, summarise, type HealthSummary, type Readiness,
} from '@/lib/mos/material-readiness';
import type { SummaryLine } from './executive.service';

// ============================================================================
// LÁT CẮT 3 — SẴN SÀNG NGUYÊN PHỤ LIỆU · TẦNG NGHIỆP VỤ
//
// ─── MỘT LƯỢT ĐI-VỀ DUY NHẤT ─────────────────────────────────────────────
// Toàn bộ phép nối sáu bảng nằm trong view v_po_material_readiness (migration
// 022). Ở đây chỉ còn MỘT truy vấn.
//
// Số đo đã có: một truy vấn rỗng tốn 200ms; hai chặng 5 truy vấn tốn 723ms.
// Độ trễ đường truyền là thứ ngốn thời gian, không phải Postgres — nên cách
// duy nhất để nhanh là bớt số lượt đi-về, không phải tối ưu truy vấn.
//
// ─── ĐIỀU VII ────────────────────────────────────────────────────────────
// Luật "thế nào là Sẵn sàng" nằm ở lib/mos/material-readiness.ts — thuần TS,
// kiểm thử được bằng số mà không cần dựng Postgres. View chỉ gộp số thô.
//
// ─── TRUY VẾT CUỘN NẠP RIÊNG, THEO YÊU CẦU ───────────────────────────────
// Nhét cuộn vào view chính sẽ nhân số dòng lên theo số cuộn của từng vật tư.
// Người dùng chỉ xem cuộn khi bấm vào một mã vải có vấn đề, nên nạp lúc bấm.
// ============================================================================

export interface MaterialLine {
  bomId: string;
  materialId: string | null;
  materialCode: string | null;
  itemName: string;
  unit: string | null;
  consumptionPerPcs: number | null;
  wastagePct: number | null;
  /** Nhu cầu = định mức × (1 + hao hụt) × sản lượng. null = chưa tính được */
  required: number | null;
  onHand: number;
  available: number;
  reservedForPo: number;
  blocked: number;
  inInspection: number;
  rollsTotal: number;
  rollsPassed: number;
  rollsFailed: number;
  rollsPending: number;
  inspectionsFailed: number;
  status: Readiness;
  coverage: number | null;
  shortage: number | null;
  qaFlag: boolean;
}

export interface RollTrace {
  rollId: string;
  rollCode: string;
  lotNo: string | null;
  shadeCode: string | null;
  lengthM: number | null;
  qaStatus: string;
  score: number | null;
  /** Đang giữ cho đơn nào. null = còn trống */
  reservedForOrder: string | null;
  reservationStatus: string | null;
}

export type EmptyReason = 'NO_STYLE' | 'NO_BOM' | null;

export interface MaterialReadiness {
  lines: MaterialLine[];
  health: HealthSummary;
  insights: SummaryLine[];
  /**
   * Vì sao bảng trống. Ba tình huống KHÁC HẲN nhau về hành động phải làm:
   *   NO_STYLE — đơn chưa gắn mã hàng  → Merchandiser phải gắn
   *   NO_BOM   — mã hàng chưa có định mức → phòng kỹ thuật phải lập
   *   null     — có dữ liệu bình thường
   * Gộp cả ba thành một khung xám chung sẽ khiến người dùng tưởng hệ thống hỏng.
   */
  emptyReason: EmptyReason;
  partial: string[];
}

export type MaterialResult =
  | { ok: true; data: MaterialReadiness }
  | { ok: false; message: string };

interface RawLine {
  bom_id: string;
  material_id: string | null;
  material_code: string | null;
  material_name: string | null;
  item_name: string | null;
  unit: string | null;
  consumption_per_pcs: number | null;
  wastage_percent: number | null;
  required_qty: number | null;
  on_hand_qty: number | null;
  available_qty: number | null;
  reserved_for_po: number | null;
  blocked_qty: number | null;
  in_inspection_qty: number | null;
  rolls_total: number | null;
  rolls_passed: number | null;
  rolls_failed: number | null;
  rolls_pending: number | null;
  inspections_failed: number | null;
}

interface RawTrace {
  roll_id: string;
  roll_code: string;
  lot_no: string | null;
  shade_code: string | null;
  current_length_m: number | null;
  qa_status: string;
  four_point_score: number | null;
  reserved_for_order: string | null;
  reservation_status: string | null;
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

const COLS =
  'bom_id, material_id, material_code, material_name, item_name, unit,' +
  'consumption_per_pcs, wastage_percent, required_qty,' +
  'on_hand_qty, available_qty, reserved_for_po, blocked_qty, in_inspection_qty,' +
  'rolls_total, rolls_passed, rolls_failed, rolls_pending, inspections_failed';

export async function getMaterialReadiness(poId: string): Promise<MaterialResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };
  const sb = g.supabase;

  const res = await safeQuery<RawLine>('định mức nguyên phụ liệu', () =>
    sb.from('v_po_material_readiness').select(COLS).eq('order_id', poId).limit(1000));

  if (res.error) {
    const missing = /does not exist|schema cache/i.test(res.error);
    return {
      ok: false,
      message: missing
        ? 'Chưa có view dữ liệu cho chức năng này. Hãy chạy migration 022_po_material_readiness.sql rồi thử lại.'
        : res.error,
    };
  }

  const lines: MaterialLine[] = res.rows.map((r) => {
    const v = judgeLine({
      required: nOrNull(r.required_qty),
      available: n(r.available_qty),
      onHand: n(r.on_hand_qty),
      reservedForPo: n(r.reserved_for_po),
      blocked: n(r.blocked_qty),
      inInspection: n(r.in_inspection_qty),
      rollsTotal: n(r.rolls_total),
      rollsFailed: n(r.rolls_failed),
      rollsPending: n(r.rolls_pending),
      inspectionsFailed: n(r.inspections_failed),
    });
    return {
      bomId: r.bom_id,
      materialId: r.material_id,
      materialCode: r.material_code,
      itemName: r.item_name ?? r.material_name ?? '—',
      unit: r.unit,
      consumptionPerPcs: nOrNull(r.consumption_per_pcs),
      wastagePct: nOrNull(r.wastage_percent),
      required: nOrNull(r.required_qty),
      onHand: n(r.on_hand_qty),
      available: n(r.available_qty),
      reservedForPo: n(r.reserved_for_po),
      blocked: n(r.blocked_qty),
      inInspection: n(r.in_inspection_qty),
      rollsTotal: n(r.rolls_total),
      rollsPassed: n(r.rolls_passed),
      rollsFailed: n(r.rolls_failed),
      rollsPending: n(r.rolls_pending),
      inspectionsFailed: n(r.inspections_failed),
      ...v,
    };
  })
    // Dòng nguy hiểm nhất lên đầu: thiếu trước, một phần sau, đủ xuống cuối.
    // Merchandiser mở tab này vì đang lo thiếu hàng, không phải để ngắm dòng đủ.
    .sort((a, b) => {
      const rank: Record<Readiness, number> = { MISSING: 0, PARTIAL: 1, UNKNOWN: 2, READY: 3 };
      const d = rank[a.status] - rank[b.status];
      return d !== 0 ? d : (b.shortage ?? 0) - (a.shortage ?? 0);
    });

  const health = summarise(lines);

  // Bảng trống thì phải nói RÕ VÌ SAO — ba nguyên nhân, ba hành động khác nhau
  let emptyReason: EmptyReason = null;
  if (lines.length === 0) {
    const style = await safeQuery<{ style_id: string | null }>('mã hàng của đơn', () =>
      sb.from('orders').select('style_id').eq('id', poId).limit(1));
    emptyReason = !style.error && style.rows[0]?.style_id ? 'NO_BOM' : 'NO_STYLE';
  }

  return {
    ok: true,
    data: { lines, health, insights: buildInsights(lines, health), emptyReason, partial: [] },
  };
}

/** Nhận định bằng LUẬT trên số thật. Mỗi câu mang theo con số kiểm chứng được. */
function buildInsights(lines: readonly MaterialLine[], h: HealthSummary): SummaryLine[] {
  const out: SummaryLine[] = [];
  const nf = new Intl.NumberFormat('vi-VN');

  if (lines.length === 0) return out;

  const worst = lines.filter((l) => l.status === 'MISSING').slice(0, 2);
  for (const l of worst) {
    out.push({
      tone: 'DANGER',
      key: 'po_mt_missing',
      values: [l.itemName, nf.format(Number((l.shortage ?? 0).toFixed(2))), l.unit ?? ''],
    });
  }
  if (h.missing > 2) {
    out.push({ tone: 'DANGER', key: 'po_mt_missing_more', values: [String(h.missing - 2)] });
  }

  for (const l of lines.filter((l) => l.qaFlag).slice(0, 2)) {
    out.push({
      tone: 'WARN',
      key: 'po_mt_qa',
      values: [l.itemName, String(l.rollsFailed), String(l.inspectionsFailed)],
    });
  }

  if (h.unknown > 0) {
    out.push({ tone: 'INFO', key: 'po_mt_unknown', values: [String(h.unknown)] });
  }
  if (h.missing === 0 && h.partial === 0 && h.ready > 0) {
    out.push({ tone: 'GOOD', key: 'po_mt_all_ready', values: [String(h.ready)] });
  }

  const rank = { DANGER: 0, WARN: 1, INFO: 2, GOOD: 3 } as const;
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 6);
}

/** Truy vết cuộn của MỘT vật tư — nạp khi người dùng bấm vào, không nạp sẵn. */
export async function getRollTrace(materialId: string): Promise<
  { ok: true; rolls: RollTrace[] } | { ok: false; message: string }
> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const res = await safeQuery<RawTrace>('danh sách cuộn', () =>
    g.supabase
      .from('v_material_roll_trace')
      .select('roll_id, roll_code, lot_no, shade_code, current_length_m, qa_status,' +
        'four_point_score, reserved_for_order, reservation_status')
      .eq('material_id', materialId)
      .order('roll_code')
      .limit(500));

  if (res.error) return { ok: false, message: res.error };
  return {
    ok: true,
    rolls: res.rows.map((r) => ({
      rollId: r.roll_id,
      rollCode: r.roll_code,
      lotNo: r.lot_no,
      shadeCode: r.shade_code,
      lengthM: nOrNull(r.current_length_m),
      qaStatus: r.qa_status,
      score: nOrNull(r.four_point_score),
      reservedForOrder: r.reserved_for_order,
      reservationStatus: r.reservation_status,
    })),
  };
}
