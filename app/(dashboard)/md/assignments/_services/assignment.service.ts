import 'server-only';

import { guard, safeQuery, friendlyDbError, one } from '../../_services/guard';
import {
  currentReports,
  type AssignmentCore,
  type AssignmentStatus,
  type DailyReportCore,
  isAssignmentStatus,
  isScopeLevel,
} from '@/lib/mos/domain/assignment';
import type {
  AssignmentDetailDTO,
  AssignmentFilterDTO,
  AssignmentSummaryDTO,
  CreateAssignmentDTO,
  DailyReportDTO,
  ItemResult,
  ListResult,
  MutationResult,
} from '@/lib/mos/contracts/assignment.contract';
import { canTransition, checkScopeShape } from '@/lib/mos/policies/assignment-transition.policy';
import {
  canManageAssignment,
  canReadAssignment,
  type Actor,
} from '@/lib/mos/permission/assignment-permission';
import { calcReportStatus } from '@/lib/mos/calculators/report-status.calculator';
import { calcAssignmentProgress } from '@/lib/mos/calculators/assignment-progress.calculator';

// ============================================================================
// ASSIGNMENT — TẦNG NGHIỆP VỤ (phía Monica)
//
// ─── TẦNG NÀY KHÔNG TÍNH GÌ CẢ (Yêu cầu 7) ───────────────────────────────
// Không một phép chia, không một phép trừ ngày nào nằm trong tệp này. Mọi con
// số đến từ `calculators/`, mọi phán quyết đến từ `policies/` và
// `permission/`. Service chỉ làm ba việc: **đọc dữ liệu · gọi luật · ghi kết
// quả**.
//
// Ranh giới đó là thứ khiến toàn bộ luật nghiệp vụ kiểm thử được bằng Node mà
// không cần Postgres — 88 phép kiểm trong `verify-assignment-domain.mjs`.
//
// ─── ĐIỀU XII · LOOSELY COUPLED ──────────────────────────────────────────
// Tệp này đọc `orders`, `partners`, `production_sites`, `sewing_lines`,
// `style_operations` — nhưng **KHÔNG GHI** vào bảng nào ngoài bốn bảng của
// chính Assignment. Nếu một ngày nó cần sửa `orders`, đó là dấu hiệu ranh giới
// sai, không phải dấu hiệu cần thêm quyền.
//
// ─── RLS ─────────────────────────────────────────────────────────────────
// Migration 029 Mục 11 hiện **chặn sạch người ngoài** trên cả năm bảng. Tầng
// này vì thế chỉ phục vụ người nội bộ. Cổng đối tác mở sau 030 + 031.
// ============================================================================

/**
 * Người nội bộ đi qua `guard()` của phân hệ /md.
 *
 * ⚠️ Đối tác sẽ KHÔNG dùng hàm này. `Actor.partnerId` của họ phải phân giải từ
 * bảng `partner_accounts`, tuyệt đối không lấy từ `app_metadata` của JWT —
 * "JWT không mang quyền, JWT chỉ mang Identity" (Điều XXX). Việc đó thuộc
 * `_partner-core/`, dựng sau 031.
 */
function internalActor(userId: string): Actor {
  return { kind: 'INTERNAL', userId };
}

// ⚠️ MỌI hình dạng trả về nằm ở `lib/mos/contracts/assignment.contract.ts`.
// Khai một `interface` cục bộ ở đây là mở lại đúng cánh cửa mà Contract vừa
// đóng: hook sẽ nhập khẩu từ service, và ranh giới biến mất.

// ── TRUY VẤN ────────────────────────────────────────────────────────────────
//
// ⚠️ `assignments` có CHÍN khoá ngoại trỏ vào `profiles` (created_by,
// assigned_by, accepted_by, rejected_by, closed_by, cancelled_by, updated_by,
// deleted_by, owner_user_id). Nhúng bằng `profiles(...)` trần sẽ hỏng với
// "more than one relationship" — đúng cái bẫy đã dính ở Phase 5. Phải chỉ đích
// danh cột: `owner:owner_user_id(...)`.
const SELECT_LIST = `
  id, assignment_no, status, priority, scope_level,
  partner_id, order_id, site_id, line_id, style_operation_id,
  assigned_qty, uom, owner_user_id,
  planned_start, planned_finish, actual_start, actual_finish,
  deleted_at,
  partner:partner_id ( partner_code, name ),
  po:order_id ( po_number, style_code, customer_name ),
  site:site_id ( name ),
  line:line_id ( line_name ),
  op:style_operation_id ( seq_no, operation ),
  owner:owner_user_id ( full_name )
`;

interface RawJoin {
  partner: { partner_code: string | null; name: string | null } | null;
  po: { po_number: string | null; style_code: string | null; customer_name: string | null } | null;
  site: { name: string | null } | null;
  line: { line_name: string | null } | null;
  op: { seq_no: number | null; operation: string | null } | null;
  owner: { full_name: string | null } | null;
}

type RawAssignment = AssignmentCore & {
  assigned_qty: number | null;
  uom: string | null;
} & { [K in keyof RawJoin]: RawJoin[K] | RawJoin[K][] };

/**
 * Hình dạng dòng sổ cái đọc lên. KHÔNG xuất khẩu — nó là chi tiết cài đặt, và
 * `DailyReportDTO` mới là thứ ra ngoài.
 */
interface LedgerRow extends DailyReportCore {
  correction_reason: string | null;
  rework_qty: number | null;
  downtime_minutes: number | null;
  issue_note: string | null;
  support_request: string | null;
  submitted_at: string;
}

const LEDGER_COLUMNS =
  'id, assignment_id, report_date, parent_report_id, correction_reason, ' +
  'target_qty, output_qty, defect_qty, rework_qty, downtime_minutes, ' +
  'issue_note, support_request, submitted_at';

function toRow(r: RawAssignment): AssignmentSummaryDTO {
  const partner = one(r.partner);
  const po = one(r.po);
  const site = one(r.site);
  const line = one(r.line);
  const op = one(r.op);
  const owner = one(r.owner);

  return {
    id: r.id,
    assignmentNo: r.assignment_no,
    status: r.status,
    priority: r.priority,
    scopeLevel: r.scope_level,

    partnerId: r.partner_id,
    partnerCode: partner?.partner_code ?? null,
    partnerName: partner?.name ?? null,

    orderId: r.order_id,
    poNumber: po?.po_number ?? null,
    styleCode: po?.style_code ?? null,
    customerName: po?.customer_name ?? null,

    siteName: site?.name ?? null,
    lineName: line?.line_name ?? null,
    // Công đoạn hiển thị kèm số thứ tự: "12 · Tra cổ" phân biệt được hai công
    // đoạn trùng tên ở hai vị trí khác nhau trong chuyền.
    operationName: op?.operation ? `${op.seq_no ?? '?'} · ${op.operation}` : null,

    assignedQty: r.assigned_qty,
    uom: r.uom,
    ownerName: owner?.full_name ?? null,

    plannedStart: r.planned_start,
    plannedFinish: r.planned_finish,
    actualStart: r.actual_start,
    actualFinish: r.actual_finish,
  };
}

export async function listAssignments(
  filter: AssignmentFilterDTO = {},
): Promise<ListResult<AssignmentSummaryDTO>> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const sb = g.supabase;

  const { rows, error } = await safeQuery<RawAssignment>('danh sách phần việc', () => {
    let q = sb
      .from('assignments')
      .select(SELECT_LIST)
      .is('deleted_at', null)
      .order('planned_finish', { ascending: true, nullsFirst: false })
      .order('assignment_no', { ascending: false });

    if (filter.orderId) q = q.eq('order_id', filter.orderId);
    if (filter.partnerId) q = q.eq('partner_id', filter.partnerId);
    if (filter.status?.length) q = q.in('status', filter.status);
    else if (!filter.includeTerminal) q = q.not('status', 'in', '("CLOSED","CANCELLED")');

    return q;
  });

  if (error) return { rows: [], error };
  return { rows: rows.map(toRow), error: null };
}

// ── CHI TIẾT ────────────────────────────────────────────────────────────────

export async function getAssignmentDetail(
  assignmentId: string,
): Promise<ItemResult<AssignmentDetailDTO>> {
  const g = await guard();
  if (!g.supabase) return { data: null, error: g.error };
  const sb = g.supabase;

  // Hai truy vấn SONG SONG. Sổ cái và bản ghi chính là hai grain khác nhau —
  // nhúng báo cáo ngày vào cùng một select sẽ nhân số dòng lên theo số ngày.
  const [head, ledger] = await Promise.all([
    safeQuery<RawAssignment>('phần việc', () =>
      sb.from('assignments').select(SELECT_LIST).eq('id', assignmentId).limit(1),
    ),
    safeQuery<LedgerRow>('sổ cái báo cáo ngày', () =>
      sb
        .from('assignment_daily_reports')
        .select(LEDGER_COLUMNS)
        .eq('assignment_id', assignmentId)
        .order('report_date', { ascending: true }),
    ),
  ]);

  if (head.error) return { data: null, error: head.error };
  const raw = head.rows[0];
  if (!raw) return { data: null, error: 'Không tìm thấy phần việc này.' };

  // Sổ cái hỏng KHÔNG được kéo cả trang sang lỗi: người dùng vẫn cần xem được
  // phần việc. Nhưng cũng KHÔNG được im lặng — số liệu tính trên dữ liệu thiếu
  // sẽ sai, nên lỗi được đẩy lên cùng dữ liệu.
  const reports = ledger.rows;

  const actor = internalActor(g.userId);
  const read = canReadAssignment(actor, raw);
  if (!read.ok) return { data: null, error: read.code };

  const reportStatus = calcReportStatus(raw, reports);
  const progress = calcAssignmentProgress(raw, reports);

  const allowedTransitions = (
    ['ISSUED', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED', 'CLOSED', 'CANCELLED'] as AssignmentStatus[]
  ).filter((to) =>
    // Lý do và ngữ cảnh chưa có lúc dựng danh sách nút, nên bỏ qua hai loại từ
    // chối đó: giao diện sẽ hỏi lý do rồi mới gọi `transitionAssignment`, và
    // lần kiểm THẬT diễn ra ở đó.
    ['assignment_err_reason_too_short', 'assignment_err_completion_unchecked', ''].includes(
      canTransition(raw, to, 'x'.repeat(20), { overdueCount: reportStatus.overdueCount }).code,
    ),
  );

  return {
    data: {
      ...toRow(raw),
      progress,
      reporting: reportStatus,
      reports: toReportDTOs(reports),
      allowedTransitions,
    },
    error: ledger.error,
  };
}

/**
 * Dịch sổ cái sang ngôn ngữ nghiệp vụ.
 *
 * ⚠️ `parent_report_id` KHÔNG ra ngoài. Màn hình cần *"đây có phải bản đính
 * chính không"* và *"phiếu này còn hiệu lực không"* — hai câu hỏi nghiệp vụ.
 * Còn quy tắc "bản đang hiệu lực là bản KHÔNG CÓ CON" là cơ chế sổ cái, và cơ
 * chế ở lại bên trong.
 */
function toReportDTOs(rows: readonly LedgerRow[]): DailyReportDTO[] {
  const liveIds = new Set(currentReports(rows).map((r) => r.id));
  return rows.map((r) => ({
    id: r.id,
    reportDate: r.report_date,
    isCorrection: r.parent_report_id !== null,
    correctsReportId: r.parent_report_id,
    correctionReason: r.correction_reason ?? null,
    isCurrent: liveIds.has(r.id),
    targetQty: r.target_qty,
    outputQty: r.output_qty,
    defectQty: r.defect_qty,
    reworkQty: r.rework_qty ?? null,
    downtimeMinutes: r.downtime_minutes ?? null,
    issueNote: r.issue_note ?? null,
    supportRequest: r.support_request ?? null,
    submittedAt: r.submitted_at,
  }));
}

// ── LẬP PHẦN VIỆC ───────────────────────────────────────────────────────────

/**
 * Lập phần việc ở trạng thái `DRAFT`.
 *
 * ⚠️ KHÔNG truyền `assignment_no`. Số được sinh bởi `next_assignment_no()` qua
 * `DEFAULT` của cột (029 Mục 2) — `nextval` là thứ duy nhất bảo đảm hai người
 * bấm "Giao việc" cùng lúc không nhận cùng một số. Sinh số ở đây là dựng nguồn
 * sự thật thứ hai, và nó sẽ trùng.
 */
export async function createAssignment(input: CreateAssignmentDTO): Promise<MutationResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, id: null, error: g.error };
  const sb = g.supabase;

  const manage = canManageAssignment(internalActor(g.userId));
  if (!manage.ok) return { ok: false, id: null, error: manage.code };

  if (!isScopeLevel(input.scopeLevel)) {
    return { ok: false, id: null, error: 'assignment_err_scope_level_invalid' };
  }

  const draft = {
    scope_level: input.scopeLevel,
    site_id: input.siteId ?? null,
    line_id: input.lineId ?? null,
    style_operation_id: input.styleOperationId ?? null,
  };

  // Kiểm hình dạng phạm vi TRƯỚC khi gọi cơ sở dữ liệu: ràng buộc
  // `assignments_scope_shape` sẽ ném `23514` với tên ràng buộc, còn ở đây trả
  // đúng TÊN CỘT để giao diện tô đỏ đúng ô.
  const scope = checkScopeShape(draft);
  if (!scope.ok) return { ok: false, id: null, error: scope.code };

  const { data, error } = await g.supabase
    .from('assignments')
    .insert({
      request_id: input.requestId,
      partner_id: input.partnerId,
      order_id: input.orderId,
      ...draft,
      assigned_qty: input.assignedQty ?? null,
      uom: input.uom ?? null,
      owner_user_id: input.ownerUserId ?? null,
      priority: input.priority ?? 'NORMAL',
      planned_start: input.plannedStart ?? null,
      planned_finish: input.plannedFinish ?? null,
      status: 'DRAFT',
    })
    .select('id, assignment_no')
    .single();

  if (error) {
    // ⚠️ GỬI TRÙNG KHÔNG PHẢI LỖI — nó là một THÀNH CÔNG đã xảy ra rồi.
    //
    // Để `23505` nổi lên là phản tác dụng: người dùng thấy "Mã này đã tồn tại"
    // cho một thao tác ĐÃ thành công, tưởng là hỏng, rồi bấm lại với khoá mới —
    // tạo ra đúng bản trùng mà cả cơ chế sinh ra để chặn.
    //
    // Kiểm ĐÚNG TÊN chỉ mục chứ không kiểm chung mã 23505: `assignment_no` cũng
    // có chỉ mục duy nhất, và một va chạm ở đó là lỗi THẬT phải báo ra.
    if (error.code === '23505' && error.message?.includes('uq_assignments_request_id')) {
      const prior = await safeQuery<{ id: string }>('phần việc đã lập', () =>
        sb.from('assignments').select('id').eq('request_id', input.requestId).limit(1),
      );
      const existing = prior.rows[0];
      if (existing) return { ok: true, id: existing.id, error: null };

      // Không đọc lại được thì KHÔNG giả vờ thành công. Trả một câu nói THẬT
      // rằng tình trạng chưa rõ, kèm việc người dùng nên làm — im lặng gật đầu
      // ở đây có thể là gật cho một chứng từ không tồn tại.
      return {
        ok: false,
        id: null,
        error: 'Phần việc có thể đã được lập. Hãy tải lại danh sách để kiểm tra.',
      };
    }
    return { ok: false, id: null, error: friendlyDbError('lập phần việc', error) };
  }

  await writeAudit(sb, data.id, 'assignment_created', g.role, {
    assignment_no: data.assignment_no,
  });

  return { ok: true, id: data.id, error: null };
}

// ── CHUYỂN TRẠNG THÁI ───────────────────────────────────────────────────────

/**
 * Cột đóng dấu cho từng đích đến.
 *
 * ⚠️ `SUSPENDED` CỐ Ý không có cặp `at`/`by`. Một phần việc có thể tạm dừng và
 * chạy lại nhiều lần (hết vải → có vải → hết vải), nên một cột `suspended_at`
 * chỉ giữ được lần cuối và sẽ nói dối về những lần trước. Lịch sử tạm dừng nằm
 * ở `activity_log`, và hiện ra qua `v_assignment_timeline`.
 */
const STAMP: Partial<Record<AssignmentStatus, { at: string; by: string; reason?: string }>> = {
  ISSUED: { at: 'assigned_at', by: 'assigned_by' },
  ACCEPTED: { at: 'accepted_at', by: 'accepted_by' },
  REJECTED: { at: 'rejected_at', by: 'rejected_by', reason: 'reject_reason' },
  CLOSED: { at: 'closed_at', by: 'closed_by', reason: 'close_reason' },
  CANCELLED: { at: 'cancelled_at', by: 'cancelled_by', reason: 'cancel_reason' },
};

export async function transitionAssignment(
  assignmentId: string,
  to: string,
  reason?: string | null,
): Promise<MutationResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, id: null, error: g.error };
  const sb = g.supabase;

  if (!isAssignmentStatus(to)) {
    return { ok: false, id: null, error: 'assignment_err_status_invalid' };
  }

  const actor = internalActor(g.userId);
  const manage = canManageAssignment(actor);
  if (!manage.ok) return { ok: false, id: null, error: manage.code };

  // ⚠️ Monica KHÔNG được nhận hoặc từ chối việc thay đối tác. Nếu bấm hộ thì
  // `accepted_at` mất hết giá trị pháp lý — nó phải trả lời được câu "đối tác
  // biết việc này từ ngày nào" khi hàng trễ.
  if (to === 'ACCEPTED' || to === 'REJECTED') {
    return { ok: false, id: null, error: 'assignment_err_partner_decides' };
  }

  const { rows } = await safeQuery<AssignmentCore & { assigned_qty: number | null }>(
    'phần việc',
    () =>
      g.supabase
        .from('assignments')
        .select(
          'id, assignment_no, partner_id, order_id, scope_level, site_id, line_id, style_operation_id, status, priority, assigned_qty, planned_start, planned_finish, actual_start, actual_finish, owner_user_id, deleted_at',
        )
        .eq('id', assignmentId)
        .limit(1),
  );

  const current = rows[0];
  if (!current) return { ok: false, id: null, error: 'Không tìm thấy phần việc này.' };

  // `→ COMPLETED` cần biết còn ngày nào thiếu báo cáo. Chỉ đọc sổ cái khi THẬT
  // SỰ cần: mọi đích đến khác không dùng tới con số này.
  let overdueCount = 0;
  if (to === 'COMPLETED') {
    const ledger = await safeQuery<DailyReportCore>('sổ cái báo cáo ngày', () =>
      sb
        .from('assignment_daily_reports')
        .select('id, assignment_id, report_date, parent_report_id, target_qty, output_qty, defect_qty')
        .eq('assignment_id', assignmentId),
    );
    if (ledger.error) return { ok: false, id: null, error: ledger.error };
    overdueCount = calcReportStatus(current, ledger.rows).overdueCount;
  }

  const verdict = canTransition(current, to, reason, { overdueCount });
  if (!verdict.ok) return { ok: false, id: null, error: verdict.code };

  const patch: Record<string, unknown> = { status: to };
  const stamp = STAMP[to];
  if (stamp) {
    patch[stamp.at] = new Date().toISOString();
    patch[stamp.by] = g.userId;
    if (stamp.reason && reason) patch[stamp.reason] = reason.trim();
  }
  if (to === 'SUSPENDED' && reason) patch.suspend_reason = reason.trim();

  const { error } = await sb.from('assignments').update(patch).eq('id', assignmentId);
  if (error) {
    return { ok: false, id: null, error: friendlyDbError('chuyển trạng thái phần việc', error) };
  }

  await writeAudit(sb, assignmentId, `assignment_${to.toLowerCase()}`, g.role, {
    from: current.status,
    to,
    reason: reason?.trim() ?? null,
  });

  return { ok: true, id: assignmentId, error: null };
}

// ── AUDIT ───────────────────────────────────────────────────────────────────

/**
 * Playbook Điều XI: 100% audit, không ngoại lệ.
 *
 * ⚠️ Ghi nhật ký hỏng KHÔNG được làm hỏng nghiệp vụ đã thành công. Phần việc đã
 * chuyển trạng thái rồi; ném lỗi ở đây sẽ khiến người dùng bấm lại và tạo ra
 * một chuyển trạng thái thứ hai. Lỗi được ghi ra log máy chủ để đội vận hành
 * thấy, chứ không đẩy ngược lên giao diện.
 */
async function writeAudit(
  supabase: NonNullable<Awaited<ReturnType<typeof guard>>['supabase']>,
  entityId: string,
  action: string,
  actorRole: string,
  changes: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('activity_log').insert({
    entity_type: 'assignment',
    entity_id: entityId,
    action,
    actor_role: actorRole,
    changes,
  });
  if (error) console.error('[assignment:audit]', { action, entityId, error });
}
