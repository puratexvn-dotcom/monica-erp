import 'server-only';

import { guard, safeQuery, friendlyDbError } from './guard';
import type {
  AllocateResult, AllocationBoard, CutTicket, MaterialOption, ShadeGroup, ShadeRoll,
} from '@/schemas/warehouse/allocation.schema';

// ============================================================================
// GIỮ CHỖ & PHÂN BỔ THEO TÔNG MÀU — TẦNG NGHIỆP VỤ
//
// ─── ĐIỀU VII: GOM NHÓM VÀ TÍNH NHU CẦU ĐỀU NẰM Ở ĐÂY ────────────────────
// Component chỉ nhận danh sách nhóm đã xếp sẵn và vẽ ra.
//
// ─── BA LUẬT CHẶN KHÔNG NẰM Ở ĐÂY ────────────────────────────────────────
// Trigger `wh_reservation_guard` (migration 020) mới là nơi chặn. Service này
// KHÔNG kiểm lại trước khi ghi: kiểm hai nơi thì tới một ngày hai nơi lệch
// nhau, và nơi ở trình duyệt luôn là nơi sai. Ở đây chỉ dịch câu lỗi của cơ sở
// dữ liệu sang câu người vận hành đọc hiểu.
// ============================================================================

interface RawBoardRow {
  roll_id: string;
  roll_code: string;
  material_id: string | null;
  material_code: string | null;
  material_name: string | null;
  lot_id: string | null;
  lot_no: string | null;
  shade_code: string | null;
  current_length_m: number | null;
  width_m: number | null;
  qa_status: string;
  four_point_score: number | null;
  reservation_id: string | null;
  cut_ticket_id: string | null;
  reservation_status: string | null;
}

interface RawTicket {
  id: string;
  ticket_no: string;
  marker_code: string | null;
  marker_length_m: number | null;
  ply_count: number | null;
  bom_allowance_m: number | null;
  total_planned_pcs: number | null;
  status: string | null;
}

/** Số hoặc null. Không bao giờ trả 0 thay cho "không đọc được". */
function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Chuỗi rỗng hoặc toàn khoảng trắng cũng là "chưa có", không phải một giá trị.
 *
 * ⚠️ ĐO ĐƯỢC TRÊN CƠ SỞ DỮ LIỆU THẬT: cột cũ `fabric_rolls.shade_lot` là
 * NOT NULL, nên phép COALESCE trong view v_shade_board KHÔNG BAO GIỜ trả NULL —
 * cuộn chưa gán tông thật ra mang chuỗi rỗng. Chỉ kiểm `=== null` thì nhóm
 * "chưa gán tông" không bao giờ xuất hiện, và cảnh báo hổ phách trên giao diện
 * thành ra chết cứng: đúng cái rủi ro cần chỉ ra lại là cái bị giấu đi.
 */
function blank(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

/**
 * Nhu cầu vải của một lệnh cắt, mét.
 *
 *   cần = dài sơ đồ × số lá + hao hụt định mức
 *
 * Thiếu dài sơ đồ hoặc số lá thì trả null chứ KHÔNG trả 0: 0 nghĩa là lệnh này
 * không cần vải, hoàn toàn khác với "chưa biết cần bao nhiêu". Người thủ kho
 * nhìn thấy 0 sẽ tưởng đã đủ và bỏ qua lệnh đó.
 */
function neededMeters(t: RawTicket): number | null {
  const marker = num(t.marker_length_m);
  const ply = num(t.ply_count);
  if (marker === null || ply === null || marker <= 0 || ply <= 0) return null;
  return marker * ply + (num(t.bom_allowance_m) ?? 0);
}

/**
 * Đọc toàn bộ dữ liệu cho màn phân bổ.
 *
 * Một lời gọi chứ không ba: mạng ở xưởng chập chờn, ba vòng đi-về nối tiếp
 * khiến màn hình dựng lên từng mảnh.
 */
export async function getAllocationBoard(materialId: string | null): Promise<AllocationBoard> {
  const g = await guard();
  if (!g.supabase) return { materials: [], groups: [], tickets: [], error: g.error };
  const sb = g.supabase;

  const COLS =
    'roll_id, roll_code, material_id, material_code, material_name, lot_id, lot_no,' +
    'shade_code, current_length_m, width_m, qa_status, four_point_score,' +
    'reservation_id, cut_ticket_id, reservation_status';

  const [allRes, ticketRes] = await Promise.all([
    safeQuery<RawBoardRow>('bảng tông màu', () =>
      sb.from('v_shade_board').select(COLS).order('roll_code').limit(3000)),
    safeQuery<RawTicket>('danh sách lệnh cắt', () =>
      sb
        .from('cut_tickets')
        .select('id, ticket_no, marker_code, marker_length_m, ply_count, bom_allowance_m, total_planned_pcs, status')
        .order('ticket_no')
        .limit(500)),
  ]);

  const err = [allRes.error, ticketRes.error].filter(Boolean).join(' · ') || null;
  if (allRes.error) return { materials: [], groups: [], tickets: [], error: err };

  // ─── Danh sách vật tư có cuộn ────────────────────────────────────────────
  const byMaterial = new Map<string, MaterialOption>();
  for (const r of allRes.rows) {
    if (!r.material_id) continue;
    const cur = byMaterial.get(r.material_id);
    if (cur) cur.rollCount += 1;
    else
      byMaterial.set(r.material_id, {
        id: r.material_id,
        code: blank(r.material_code) ?? '—',
        name: blank(r.material_name) ?? '—',
        rollCount: 1,
      });
  }
  const materials = [...byMaterial.values()].sort((a, b) => a.code.localeCompare(b.code, 'vi'));

  // ─── Gom nhóm theo (tông màu × lô) ───────────────────────────────────────
  // Khoá gom giữ nguyên null của tông: cuộn chưa gán tông phải đứng thành nhóm
  // riêng để người thủ kho THẤY chúng, chứ không bị trộn vào một nhóm nào đó.
  const rows = materialId ? allRes.rows.filter((r) => r.material_id === materialId) : [];
  const groupMap = new Map<string, ShadeGroup>();
  for (const r of rows) {
    const shade = blank(r.shade_code);
    // Dấu '~' chỉ là ký tự ngăn cách khoá gom nhóm, không bao giờ hiện ra màn
    // hình. CỐ Ý dùng ký tự NHÌN THẤY ĐƯỢC: bản đầu tôi để lọt ký tự NUL vô hình
    // vào đúng chỗ này, mã vẫn chạy nhưng mắt không soi ra nổi.
    const key = `${shade ?? '~'}|${r.lot_id ?? '~'}`;
    let grp = groupMap.get(key);
    if (!grp) {
      grp = { shadeCode: shade, lotId: r.lot_id, lotNo: blank(r.lot_no), rolls: [], availableM: 0 };
      groupMap.set(key, grp);
    }
    const roll: ShadeRoll = {
      rollId: r.roll_id,
      rollCode: r.roll_code,
      lengthM: num(r.current_length_m),
      widthM: num(r.width_m),
      qaStatus: r.qa_status,
      score: num(r.four_point_score),
      // View chỉ nối các phiếu còn hiệu lực, nhưng vẫn lọc lại: một dòng
      // reservation_id có mà status đã RELEASED nghĩa là view và bảng lệch nhau.
      reservationId:
        r.reservation_id && (r.reservation_status === 'ACTIVE' || r.reservation_status === 'ALLOCATED')
          ? r.reservation_id
          : null,
      cutTicketId: r.cut_ticket_id,
    };
    grp.rolls.push(roll);
    // Chỉ cuộn ĐẠT và chưa có chủ mới được tính vào phần hứa được
    if ((roll.qaStatus === 'PASSED' || roll.qaStatus === 'CONDITIONAL') && roll.reservationId === null) {
      grp.availableM += roll.lengthM ?? 0;
    }
  }

  // Nhóm có nhiều vải khả dụng nhất lên trước: thủ kho hầu như luôn chọn nhóm
  // đủ vải cho cả lệnh, để không phải ghép từ hai tông.
  const groups = [...groupMap.values()].sort((a, b) => b.availableM - a.availableM);

  // ─── Lệnh cắt kèm nhu cầu và phần đã ghép ────────────────────────────────
  const matchedByTicket = new Map<string, { m: number; shade: string | null }>();
  for (const r of allRes.rows) {
    if (!r.cut_ticket_id) continue;
    if (r.reservation_status !== 'ACTIVE' && r.reservation_status !== 'ALLOCATED') continue;
    const cur = matchedByTicket.get(r.cut_ticket_id) ?? { m: 0, shade: null };
    cur.m += num(r.current_length_m) ?? 0;
    if (cur.shade === null) cur.shade = blank(r.shade_code);
    matchedByTicket.set(r.cut_ticket_id, cur);
  }

  const tickets: CutTicket[] = ticketRes.rows.map((t) => {
    const got = matchedByTicket.get(t.id);
    return {
      id: t.id,
      ticketNo: t.ticket_no,
      markerCode: blank(t.marker_code),
      status: t.status,
      plannedPcs: num(t.total_planned_pcs),
      neededM: neededMeters(t),
      matchedM: got?.m ?? 0,
      shadeInUse: got?.shade ?? null,
    };
  });

  return { materials, groups, tickets, error: err };
}

/** Dịch lỗi của trigger sang câu người vận hành hiểu, giữ nguyên phần cụ thể. */
function allocError(e: { message: string; code?: string }): string {
  if (e.code === '23505') return 'Cuộn này đã được ghép cho một lệnh cắt khác.';
  // Trigger wh_reservation_guard ném ERRCODE 23514 kèm câu tiếng Việt đã đủ rõ
  // (tên cuộn, tên tông màu). Giữ nguyên thay vì thay bằng câu chung chung —
  // câu của cơ sở dữ liệu cụ thể hơn bất cứ câu nào viết sẵn ở đây.
  if (e.code === '23514') return e.message;
  return friendlyDbError('ghép cuộn', e);
}

export async function allocateRoll(input: {
  rollId: string;
  cutTicketId: string;
  materialId: string;
  lotId: string | null;
  qtyM: number;
}): Promise<AllocateResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };
  const sb = g.supabase;

  const { error } = await sb.from('stock_reservations').insert({
    material_id: input.materialId,
    lot_id: input.lotId,
    roll_id: input.rollId,
    cut_ticket_id: input.cutTicketId,
    reserved_qty: input.qtyM,
    uom: 'METERS',
    status: 'ACTIVE',
    created_by: g.userId,
  });

  if (error) {
    const missing = error.code === 'PGRST204' || error.code === '42703';
    return {
      ok: false,
      message: missing
        ? 'Chưa có cột dữ liệu cho chức năng này. Hãy chạy migration 020_warehouse_allocation.sql rồi thử lại.'
        : allocError(error),
    };
  }
  return { ok: true };
}

/**
 * Bỏ ghép: đổi trạng thái sang RELEASED, KHÔNG xoá dòng.
 *
 * Xoá đi thì mất dấu ai đã hứa cuộn này cho ai và vào lúc nào. Trigger đồng bộ
 * chỉ đếm phiếu ACTIVE/ALLOCATED nên cuộn vẫn được trả về phần khả dụng ngay.
 */
export async function releaseReservation(reservationId: string): Promise<AllocateResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const { error } = await g.supabase
    .from('stock_reservations')
    .update({ status: 'RELEASED', released_at: new Date().toISOString() })
    .eq('id', reservationId);

  if (error) return { ok: false, message: friendlyDbError('bỏ ghép', error) };
  return { ok: true };
}
