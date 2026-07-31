// ============================================================================
// DÒNG CHẢY ĐƠN HÀNG — LOGIC THUẦN
//
// Không phụ thuộc React, không đọc cơ sở dữ liệu. Đặt ở lib/mos vì cổng khách
// hàng và bảng tổng của giám đốc rồi cũng phải hiện ĐÚNG những con số này —
// hai nơi tính riêng là hai nơi sẽ lệch.
//
// ─── VÌ SAO ĐỔI TỪ DANH SÁCH SANG DÒNG CHẢY ──────────────────────────────
// Bảng danh sách trả lời "có những đơn nào". Merchandiser cần trả lời câu khác:
// "hôm nay tôi phải chạm vào đơn nào trước". Hai câu đó cần hai cách bày.
//
// ─── ĐỘ KHẨN TÍNH TỪ NGÀY GIAO, KHÔNG TỪ TRẠNG THÁI ──────────────────────
// Trạng thái chỉ nói đơn đang ở khâu nào. Một đơn "đang sản xuất" còn 30 ngày
// và một đơn "đang sản xuất" còn 2 ngày là hai mức khẩn hoàn toàn khác nhau,
// nhưng trạng thái của chúng giống hệt. Đếm ngược mới là thứ xếp thứ tự việc.
// ============================================================================

/** Giai đoạn hiển thị trên dòng chảy. Gộp từ status thô của bảng orders. */
export const PO_STAGES = ['APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'SHIPPED'] as const;
export type PoStage = (typeof PO_STAGES)[number];

/**
 * Mức khẩn, xếp từ nặng tới nhẹ.
 *   OVERDUE  — đã quá ngày giao
 *   CRITICAL — còn ≤ 7 ngày, hoặc rủi ro CRITICAL, hoặc đã trễ mốc T&A
 *   WARNING  — còn ≤ 21 ngày, hoặc rủi ro HIGH
 *   NORMAL   — còn xa, không cờ nào
 */
export const URGENCY_LEVELS = ['OVERDUE', 'CRITICAL', 'WARNING', 'NORMAL'] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number];

/** Ngưỡng ngày. Đặt thành hằng số để đổi một chỗ, không phải lùng trong mã. */
export const CRITICAL_DAYS = 7;
export const WARNING_DAYS = 21;

/** Chỉ những trường THẬT SỰ cần để xếp dòng chảy — nhận đúng chừng này thì hàm
 *  dùng lại được ở cổng khách hàng mà không phải kéo theo cả PoRow. */
export interface FlowInput {
  status: string;
  /** YYYY-MM-DD */
  delivery_date: string;
  risk_level: string | null;
  late_milestones: number;
  total_quantity: number;
}

export interface FlowFacts {
  stage: PoStage | null;
  urgency: Urgency;
  /** Số ngày còn lại tới ngày giao. Âm = đã quá hạn. null = không đọc được ngày. */
  daysLeft: number | null;
}

/**
 * Hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD.
 *
 * ⚠️ Máy chủ chạy giờ UTC. Lấy thẳng ngày của máy chủ thì từ 0h đến 7h sáng giờ
 * Việt Nam nó vẫn trả về ngày HÔM QUA — đúng khung giờ ca đêm của xưởng, và
 * mọi phép đếm ngược sẽ lệch một ngày với người đang đứng ở chuyền.
 */
export function vnTodayISO(now: number = Date.now()): string {
  return new Date(now + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Số ngày từ hôm nay tới ngày giao.
 *
 * So sánh theo NGÀY LỊCH chứ không theo mốc thời gian: dùng hiệu số mili giây
 * rồi chia cho 86.400.000 sẽ ra 0,9 ngày và làm tròn thành 0 — người dùng thấy
 * "còn 0 ngày" cho một đơn giao ngày mai.
 */
export function daysUntil(deliveryDate: string | null, today: string = vnTodayISO()): number | null {
  if (!deliveryDate) return null;
  const d = Date.parse(`${deliveryDate.slice(0, 10)}T00:00:00Z`);
  const t = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(d) || Number.isNaN(t)) return null;
  return Math.round((d - t) / 86_400_000);
}

/** Gộp status thô về giai đoạn hiển thị. Trạng thái lạ hoặc đã huỷ trả null —
 *  đơn huỷ KHÔNG được đứng trong dòng chảy, nó làm sai mọi phép cộng. */
export function stageOf(status: string): PoStage | null {
  const s = status.toUpperCase();
  return (PO_STAGES as readonly string[]).includes(s) ? (s as PoStage) : null;
}

export function urgencyOf(po: FlowInput, today: string = vnTodayISO()): Urgency {
  const stage = stageOf(po.status);
  // Đã xuất hàng thì không còn gì để giục, dù ngày giao đã qua từ lâu.
  if (stage === 'SHIPPED') return 'NORMAL';

  const left = daysUntil(po.delivery_date, today);
  if (left !== null && left < 0) return 'OVERDUE';

  const risk = (po.risk_level ?? '').toUpperCase();
  if (risk === 'CRITICAL' || po.late_milestones > 0) return 'CRITICAL';
  if (left !== null && left <= CRITICAL_DAYS) return 'CRITICAL';
  if (risk === 'HIGH') return 'WARNING';
  if (left !== null && left <= WARNING_DAYS) return 'WARNING';
  return 'NORMAL';
}

export function factsOf(po: FlowInput, today: string = vnTodayISO()): FlowFacts {
  return {
    stage: stageOf(po.status),
    urgency: urgencyOf(po, today),
    daysLeft: daysUntil(po.delivery_date, today),
  };
}

export interface StageBucket {
  stage: PoStage;
  count: number;
  quantity: number;
  /** Số đơn trong giai đoạn này đang ở mức OVERDUE hoặc CRITICAL */
  hot: number;
}

/** Đếm theo giai đoạn. LUÔN trả đủ 4 giai đoạn kể cả khi rỗng — cột biến mất
 *  khiến người dùng tưởng giai đoạn đó không tồn tại, chứ không phải đang trống. */
export function bucketByStage<T extends FlowInput>(
  rows: readonly T[],
  today: string = vnTodayISO(),
): StageBucket[] {
  const map = new Map<PoStage, StageBucket>(
    PO_STAGES.map((s) => [s, { stage: s, count: 0, quantity: 0, hot: 0 }]),
  );
  for (const r of rows) {
    const st = stageOf(r.status);
    if (!st) continue;
    const b = map.get(st);
    if (!b) continue;
    b.count += 1;
    b.quantity += Number(r.total_quantity) || 0;
    const u = urgencyOf(r, today);
    if (u === 'OVERDUE' || u === 'CRITICAL') b.hot += 1;
  }
  return [...map.values()];
}

export interface UrgencyLane {
  urgency: Urgency;
  count: number;
  quantity: number;
}

/** Đếm theo mức khẩn. Cũng luôn trả đủ bốn mức, vì lý do trên. */
export function laneByUrgency<T extends FlowInput>(
  rows: readonly T[],
  today: string = vnTodayISO(),
): UrgencyLane[] {
  const map = new Map<Urgency, UrgencyLane>(
    URGENCY_LEVELS.map((u) => [u, { urgency: u, count: 0, quantity: 0 }]),
  );
  for (const r of rows) {
    if (!stageOf(r.status)) continue;
    const lane = map.get(urgencyOf(r, today));
    if (!lane) continue;
    lane.count += 1;
    lane.quantity += Number(r.total_quantity) || 0;
  }
  return [...map.values()];
}

/** Xếp việc theo đúng thứ tự cần chạm vào: khẩn trước, trong cùng mức khẩn thì
 *  đơn nào tới hạn sớm hơn đứng trước. Đơn không có ngày giao xuống cuối. */
export function sortByPriority<T extends FlowInput>(
  rows: readonly T[],
  today: string = vnTodayISO(),
): T[] {
  const rank = (u: Urgency) => URGENCY_LEVELS.indexOf(u);
  return [...rows].sort((a, b) => {
    const ra = rank(urgencyOf(a, today));
    const rb = rank(urgencyOf(b, today));
    if (ra !== rb) return ra - rb;
    const da = daysUntil(a.delivery_date, today);
    const db = daysUntil(b.delivery_date, today);
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });
}
