// ============================================================================
// GIỮ CHỖ & PHÂN BỔ THEO TÔNG MÀU — KIỂU DỮ LIỆU
//
// ⚠️ TÊN CỘT THẬT, ĐÃ ĐO TRÊN CƠ SỞ DỮ LIỆU ĐANG CHẠY:
//   materials    -> material_code, name        (KHÔNG có material_name)
//   cut_tickets  -> ticket_no, marker_code, marker_length_m, ply_count,
//                   bom_allowance_m, total_planned_pcs, status
//   v_shade_board-> roll_id, roll_code, shade_code, qa_status, four_point_score,
//                   reservation_id, cut_ticket_id, reservation_status
// ============================================================================

/** Một cuộn trên bảng tông màu */
export interface ShadeRoll {
  rollId: string;
  rollCode: string;
  /** Chiều dài còn lại, mét. null = không đọc được (hiện "—", KHÔNG hiện 0) */
  lengthM: number | null;
  widthM: number | null;
  qaStatus: 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL' | string;
  /** Điểm 4-Point. null = chưa kiểm */
  score: number | null;
  /** Phiếu giữ chỗ đang hiệu lực, null nếu cuộn còn trống */
  reservationId: string | null;
  cutTicketId: string | null;
}

/** Một nhóm: cùng tông màu, cùng lô */
export interface ShadeGroup {
  /** null = cuộn chưa gán tông. KHÔNG dồn vào nhóm chung — giấu đi là giấu rủi ro */
  shadeCode: string | null;
  lotId: string | null;
  lotNo: string | null;
  rolls: ShadeRoll[];
  /** Tổng chiều dài các cuộn ĐẠT và chưa bị ghép cho ai */
  availableM: number;
}

/** Vật tư có cuộn trong kho — dùng cho ô chọn ở đầu màn hình */
export interface MaterialOption {
  id: string;
  code: string;
  name: string;
  rollCount: number;
}

export interface CutTicket {
  id: string;
  ticketNo: string;
  markerCode: string | null;
  status: string | null;
  plannedPcs: number | null;
  /**
   * Nhu cầu vải, mét:  dài sơ đồ × số lá + hao hụt định mức.
   * null khi thiếu dữ liệu để tính — hiện "—" chứ không hiện 0, vì 0 nghĩa là
   * lệnh này không cần vải, hoàn toàn khác với "chưa biết cần bao nhiêu".
   */
  neededM: number | null;
  /** Tổng chiều dài đã ghép cho lệnh này */
  matchedM: number;
  /** Tông màu lệnh này đang dùng. null = chưa ghép cuộn nào nên còn tự do. */
  shadeInUse: string | null;
}

export interface AllocationBoard {
  materials: MaterialOption[];
  groups: ShadeGroup[];
  tickets: CutTicket[];
  error: string | null;
}

export type AllocateResult = { ok: true } | { ok: false; message: string };

/** Vì sao một cuộn không ghép được — để giao diện nói rõ thay vì chỉ làm mờ nút */
export type BlockReason = 'QA' | 'TAKEN' | 'SHADE' | null;

/**
 * Quyết định cuộn có ghép được vào lệnh đang chọn không.
 *
 * Ba luật này được CƠ SỞ DỮ LIỆU thi hành (trigger wh_reservation_guard ở
 * migration 020). Hàm dưới đây chỉ để giao diện làm mờ nút và giải thích lý do
 * TRƯỚC khi người dùng bấm — nếu có lệch nhau thì cơ sở dữ liệu vẫn là nơi
 * quyết định, và người dùng nhận đúng câu báo lỗi từ đó.
 */
export function blockReasonOf(
  roll: ShadeRoll,
  groupShade: string | null,
  ticket: CutTicket | null,
): BlockReason {
  if (roll.qaStatus !== 'PASSED' && roll.qaStatus !== 'CONDITIONAL') return 'QA';
  if (roll.reservationId !== null) return 'TAKEN';
  if (ticket && ticket.shadeInUse !== null && ticket.shadeInUse !== groupShade) return 'SHADE';
  return null;
}
