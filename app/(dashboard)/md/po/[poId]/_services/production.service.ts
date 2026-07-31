import 'server-only';

import { guard, safeQuery, one } from '../../../_services/guard';
import { daysUntil, vnTodayISO } from '@/lib/mos/po-flow';
import type { SummaryLine } from './executive.service';

// ============================================================================
// LÁT CẮT 2 — BẢN SAO SỐ CỦA XƯỞNG MAY · TẦNG NGHIỆP VỤ
//
// ─── ⚠️ VÌ SAO KHÔNG DÙNG BẢNG prod_logs (140 DÒNG) ──────────────────────
// Đã đo trên cơ sở dữ liệu đang chạy, hai lý do đều đủ để loại:
//
//   1. Toàn bộ 140 dòng thuộc order_id 'a0000000-…' — MỘT ĐƠN KHÔNG TỒN TẠI
//      trong bảng orders. Đó là dữ liệu seed mồ côi. Đọc nó lên màn hình PO
//      thật nghĩa là hiển thị sản lượng của một đơn không có thật.
//   2. Cột line_id ở đó là CHỮ tự do ('L1'), không phải khoá ngoại tới
//      sewing_lines. Không nối được với chuyền nào cả.
//
// `hourly_production_logs` thì khoá ngoại khớp CẢ sewing_lines LẪN orders, và
// có sẵn target_qty + actual_qty — đúng thứ cần cho Hiệu suất chuyền.
//
// ─── HIỆU SUẤT CHUYỀN THAY CHO OEE (đã được phê duyệt) ───────────────────
// OEE cần dữ liệu dừng máy mà hệ thống chưa có bảng nào chứa. Hiệu suất chuyền
// = Thực tế / Kế hoạch là con số nhà máy may thực sự dùng, tính được ngay.
//
// ─── ĐIỀU VII: DỮ LIỆU TRẢ VỀ ĐÃ ĐỊNH DẠNG SẴN CHO BIỂU ĐỒ ───────────────
// Component KHÔNG phải map hay reduce gì. Mảng `chart` trả về đúng hình dạng
// mà Recharts cần.
// ============================================================================

export interface LineStat {
  lineId: string;
  lineCode: string;
  lineName: string | null;
  /** Năng lực thiết kế của chuyền, sản phẩm/giờ. null = chưa khai */
  ratedPerHour: number | null;
  target: number;
  actual: number;
  rework: number;
  /** Thực tế / Kế hoạch, %. null khi kế hoạch bằng 0 — chia cho 0 ra Infinity */
  efficiency: number | null;
  /** Số ca đã ghi nhận — ít quá thì con số hiệu suất chưa đáng tin */
  slots: number;
  /** Số NGÀY liên tiếp gần nhất chạy dưới kế hoạch */
  daysBelow: number;
}

/**
 * Một điểm trên biểu đồ, đã đúng hình dạng Recharts cần.
 *
 * Chữ ký chỉ mục ở cuối là BẮT BUỘC: chart-kit nhận
 * `ReadonlyArray<Record<string, string | number>>`, mà một interface không có
 * chữ ký chỉ mục thì TypeScript từ chối gán vào Record — đây là chỗ dễ mất
 * mười phút nếu không biết trước.
 */
export interface DayPoint {
  day: string;
  target: number;
  actual: number;
  [k: string]: string | number;
}

export interface ProductionTwin {
  lines: LineStat[];
  chart: DayPoint[];
  totals: { target: number; actual: number; rework: number; efficiency: number | null };
  wip: {
    /** Đã cắt, từ cut_tickets. null = chưa có lệnh cắt nào */
    cut: number | null;
    /** Đã may, từ hourly_production_logs */
    sewn: number | null;
    /** Đang dở dang = đã cắt − đã may. null khi thiếu một đầu */
    wip: number | null;
  };
  /**
   * WIP theo TỪNG chuyền có tính được không.
   *
   * Hiện là false: hệ thống ghi được sản lượng RA của mỗi chuyền, nhưng không
   * ghi số lượng VÀO chuyền (bundles không có line_id, cut_tickets cũng không).
   * Thiếu đầu vào thì không có phép trừ nào cho ra WIP của riêng một chuyền.
   * Nói thẳng ra màn hình thay vì lấy WIP toàn đơn gán cho từng chuyền.
   */
  perLineWip: boolean;
  insights: SummaryLine[];
  partial: string[];
}

export type ProductionResult =
  | { ok: true; data: ProductionTwin }
  | { ok: false; message: string };

interface RawHourly {
  line_id: string | null;
  log_date: string;
  target_qty: number | null;
  actual_qty: number | null;
  rework_qty: number | null;
  sewing_lines: { line_code: string; line_name: string | null; target_pcs_per_hour: number | null }
    | { line_code: string; line_name: string | null; target_pcs_per_hour: number | null }[] | null;
}
interface RawCut { total_actual_pcs: number | null }
interface RawOrder { total_quantity: number | null; delivery_date: string | null; status: string }

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

/** Dưới ngưỡng này coi là chuyền chạy hụt. 90% là mức nhà máy may thường chốt
 *  cho một ca ổn định; dưới đó là có chuyện. */
export const EFFICIENCY_WARN = 90;
/** Chạy hụt liên tiếp bấy nhiêu ngày thì không còn là dao động ngẫu nhiên */
export const CONSECUTIVE_DAYS = 3;
/** Tỷ lệ tái chế vượt mức này là dấu hiệu tay nghề hoặc thiết bị có vấn đề */
export const REWORK_WARN_PCT = 3;

export async function getProductionTwin(poId: string): Promise<ProductionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };
  const sb = g.supabase;

  const [hr, cut, ord] = await Promise.all([
    safeQuery<RawHourly>('sản lượng theo giờ', () =>
      sb.from('hourly_production_logs')
        .select('line_id, log_date, target_qty, actual_qty, rework_qty,' +
          'sewing_lines(line_code, line_name, target_pcs_per_hour)')
        .eq('order_id', poId).order('log_date').limit(5000)),
    safeQuery<RawCut>('lệnh cắt', () =>
      sb.from('cut_tickets').select('total_actual_pcs').eq('order_id', poId).limit(500)),
    safeQuery<RawOrder>('đơn hàng', () =>
      sb.from('orders').select('total_quantity, delivery_date, status').eq('id', poId).limit(1)),
  ]);

  if (ord.error) return { ok: false, message: ord.error };
  const o = ord.rows[0];
  if (!o) return { ok: false, message: 'Không tìm thấy đơn hàng này.' };

  const partial = [hr.error && 'sản lượng theo giờ', cut.error && 'lệnh cắt']
    .filter((x): x is string => typeof x === 'string');

  const rows = hr.error ? [] : hr.rows;

  // ─── Gom theo CHUYỀN ─────────────────────────────────────────────────────
  const byLine = new Map<string, LineStat & { dayMap: Map<string, { t: number; a: number }> }>();
  for (const r of rows) {
    if (!r.line_id) continue;
    const meta = one(r.sewing_lines);
    let s = byLine.get(r.line_id);
    if (!s) {
      s = {
        lineId: r.line_id,
        lineCode: meta?.line_code ?? '—',
        lineName: meta?.line_name ?? null,
        ratedPerHour: meta?.target_pcs_per_hour ?? null,
        target: 0, actual: 0, rework: 0, efficiency: null, slots: 0, daysBelow: 0,
        dayMap: new Map(),
      };
      byLine.set(r.line_id, s);
    }
    const t = n(r.target_qty);
    const a = n(r.actual_qty);
    s.target += t;
    s.actual += a;
    s.rework += n(r.rework_qty);
    s.slots += 1;
    const d = s.dayMap.get(r.log_date) ?? { t: 0, a: 0 };
    d.t += t;
    d.a += a;
    s.dayMap.set(r.log_date, d);
  }

  const lines: LineStat[] = [...byLine.values()].map((s) => {
    // Đếm ngược từ ngày GẦN NHẤT: chuỗi ngày hụt phải là chuỗi ĐANG diễn ra,
    // không phải một chuỗi nào đó hồi đầu tháng đã khắc phục xong.
    const days = [...s.dayMap.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
    let streak = 0;
    for (const [, v] of days) {
      if (v.t > 0 && (v.a / v.t) * 100 < EFFICIENCY_WARN) streak += 1;
      else break;
    }
    return {
      lineId: s.lineId, lineCode: s.lineCode, lineName: s.lineName,
      ratedPerHour: s.ratedPerHour, target: s.target, actual: s.actual, rework: s.rework,
      // Chia cho 0 ra Infinity rồi hiện "∞%" ra màn hình. Kế hoạch bằng 0 thì
      // không có hiệu suất nào để nói.
      efficiency: s.target > 0 ? (s.actual / s.target) * 100 : null,
      slots: s.slots,
      daysBelow: streak,
    };
  }).sort((a, b) => (a.efficiency ?? 999) - (b.efficiency ?? 999));

  // ─── Gom theo NGÀY, đã đúng hình dạng biểu đồ ────────────────────────────
  const byDay = new Map<string, DayPoint>();
  for (const r of rows) {
    const p = byDay.get(r.log_date) ?? { day: r.log_date.slice(5), target: 0, actual: 0 };
    p.target += n(r.target_qty);
    p.actual += n(r.actual_qty);
    byDay.set(r.log_date, p);
  }
  const chart = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, v]) => v);

  const target = lines.reduce((s, l) => s + l.target, 0);
  const actual = lines.reduce((s, l) => s + l.actual, 0);
  const rework = lines.reduce((s, l) => s + l.rework, 0);

  const cutQty = cut.error || cut.rows.length === 0
    ? null
    : cut.rows.reduce((s, r) => s + n(r.total_actual_pcs), 0);
  const sewn = rows.length === 0 ? null : actual;

  return {
    ok: true,
    data: {
      lines,
      chart,
      totals: { target, actual, rework, efficiency: target > 0 ? (actual / target) * 100 : null },
      wip: { cut: cutQty, sewn, wip: cutQty !== null && sewn !== null ? cutQty - sewn : null },
      perLineWip: false,
      insights: buildInsights(lines, { target, actual, rework }, o, sewn),
      partial,
    },
  };
}

/**
 * Nhận diện điểm nghẽn bằng LUẬT trên số liệu thật.
 *
 * Mỗi câu mang theo con số kiểm chứng được — "chuyền 4 chạy dưới kế hoạch 20%
 * ba ngày liên tiếp" chứ không phải "có chuyền gặp vấn đề".
 */
function buildInsights(
  lines: LineStat[],
  totals: { target: number; actual: number; rework: number },
  o: RawOrder,
  sewn: number | null,
): SummaryLine[] {
  const out: SummaryLine[] = [];

  if (lines.length === 0) {
    out.push({ tone: 'INFO', key: 'po_pr_no_data', values: [] });
    return out;
  }

  for (const l of lines) {
    if (l.efficiency === null) continue;
    if (l.daysBelow >= CONSECUTIVE_DAYS) {
      out.push({
        tone: 'DANGER',
        key: 'po_pr_streak',
        values: [l.lineCode, String(Math.round(EFFICIENCY_WARN - l.efficiency)), String(l.daysBelow)],
      });
    } else if (l.efficiency < EFFICIENCY_WARN) {
      out.push({
        tone: 'WARN',
        key: 'po_pr_below',
        values: [l.lineCode, l.efficiency.toFixed(1)],
      });
    }
  }

  // Chuyền chạy tốt nhất — để đề xuất san tải sang đó, chứ không chỉ báo xấu
  const best = lines.filter((l) => l.efficiency !== null).slice(-1)[0];
  const worst = lines.find((l) => l.efficiency !== null && l.efficiency < EFFICIENCY_WARN);
  if (best && worst && best.lineId !== worst.lineId && (best.efficiency ?? 0) >= EFFICIENCY_WARN) {
    out.push({ tone: 'INFO', key: 'po_pr_rebalance', values: [worst.lineCode, best.lineCode] });
  }

  if (totals.actual > 0) {
    const pct = (totals.rework / totals.actual) * 100;
    if (pct > REWORK_WARN_PCT) {
      out.push({ tone: 'WARN', key: 'po_pr_rework_high', values: [pct.toFixed(1)] });
    }
  }

  // Còn phải may bao nhiêu mỗi ngày mới kịp — con số quyết định có tăng ca không
  const left = daysUntil(o.delivery_date, vnTodayISO());
  const remain = n(o.total_quantity) - (sewn ?? 0);
  if (left !== null && remain > 0 && o.status !== 'SHIPPED') {
    if (left <= 0) {
      out.push({ tone: 'DANGER', key: 'po_pr_overdue_remain', values: [String(Math.round(remain))] });
    } else {
      const need = Math.ceil(remain / left);
      out.push({ tone: 'WARN', key: 'po_pr_need_rate', values: [String(need), String(left)] });
    }
  }

  const rank = { DANGER: 0, WARN: 1, INFO: 2, GOOD: 3 } as const;
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 6);
}
