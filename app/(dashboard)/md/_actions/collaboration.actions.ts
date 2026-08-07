'use server';

import { revalidatePath } from 'next/cache';

import { guard, friendlyDbError } from '../_services/guard';
import { writeAudit } from './audit';
import {
  documentFormSchema,
  commentFormSchema,
  changeRequestSchema,
  extractMentions,
  zodFieldErrors,
  type ActionResult,
} from '@/schemas/md';

const PATH = '/md';

function nz(v: string | undefined | null): string | null {
  return v && v.trim() !== '' ? v : null;
}

// ─── 1. TÀI LIỆU ────────────────────────────────────────────────────────────

/** Ghi bản ghi tài liệu SAU KHI tệp đã lên Storage.
 *  Tách hai bước là cố ý: tải tệp thất bại giữa chừng thì không để lại bản ghi
 *  trỏ vào một đường dẫn không tồn tại. */
export async function saveDocument(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = documentFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { error } = await g.supabase.from('md_documents').insert({
    entity_type: v.entity_type,
    entity_id: v.entity_id,
    doc_type: v.doc_type,
    title: v.title,
    storage_path: v.storage_path,
    file_size: v.file_size ?? null,
    mime_type: nz(v.mime_type),
    version: v.version,
    uploaded_by: g.userId,
  });

  if (error) return { ok: false, message: friendlyDbError('saveDocument', error) };

  await writeAudit(v.entity_type, v.entity_id, 'CREATE', { document: { from: null, to: v.title } });
  revalidatePath(PATH);
  return { ok: true, message: `Đã lưu tài liệu ${v.title} (phiên bản ${v.version}).` };
}

/**
 * 🔴 **ĐÃ CHẶN 07/08/2026 · BOARD DECISION `BUG-5`:**
 *
 *   > *"**⛔ Không Delete vật lý. Chỉ Archive.**"*
 *
 * ─── ⚠️ VÌ SAO HÀM VẪN CÒN Ở ĐÂY, ⛔ KHÔNG BỊ XOÁ ────────────────────────
 * Ràng buộc ② *(CLAUDE.md §6)*: **⛔ không xoá logic hay file cũ**. Và quan
 * trọng hơn — `document-center.tsx` đang **gọi hàm này**. Xoá hàm đi thì màn
 * hình gãy lúc dựng; để nó **trả lời thẳng** thì người dùng nhận đúng một câu
 * tiếng Việt nói rõ chuyện gì đang xảy ra.
 *
 * ─── 🔴 VÌ SAO ⛔ CHƯA THAY ĐƯỢC BẰNG "ARCHIVE" ─────────────────────────
 * `md_documents` **⛔ không có** cột trạng thái, **⛔ không có** `deleted_at`
 * *(migration `015` Mục 8 — đã đối chiếu, ⛔ không nhớ)*. ⛔ **Không** tồn tại
 * một cột nào để đánh dấu *"đã lưu trữ"* mà ⛔ không nói dối về nghiệp vụ.
 *
 * Thêm cột = **migration** = ADR + phê duyệt Board, và `SECURITY FREEZE`
 * *(`MOS §XI.1`)* đang chặn. Bản nháp + phân tích tác động: **`ADR-027`**.
 *
 * ⚠️ **TÔI ĐÃ CÂN NHẮC VÀ BÁC một phương án khác:** dựng "bia mộ" trong
 * `activity_log` rồi lọc ở tầng đọc. Nó chạy được mà ⛔ không cần migration,
 * nhưng có **BA** chỗ đọc `md_documents` *(`collaboration.service` ·
 * `po.service` · `po-twin.service`)*. Sót một chỗ ⇒ **hai màn hình cùng một
 * hệ thống trả lời khác nhau câu *"tài liệu này còn ⛔ không"*** — đúng loại
 * lệch mà kho mã này đã trả giá nhiều lần *(hai bảng đếm · hai bộ KPI)*.
 * Một cột `deleted_at` với chỉ mục MỘT PHẦN giải quyết dứt điểm; một mẹo ở
 * tầng ứng dụng thì ⛔ không.
 *
 * 🔑 **Nói thẳng là ⛔ chưa làm được, tốt hơn một nút bấm vào báo thành công.**
 */
export async function deleteDocument(id: string): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  // Vẫn ghi nhật ký: **ý định** gỡ tài liệu là dữ kiện có giá trị kiểm toán,
  // kể cả khi hệ thống từ chối thực hiện.
  await writeAudit('DOCUMENT', id, 'DELETE', {
    ket_qua: { from: null, to: 'BỊ TỪ CHỐI — xoá vật lý đã bị Board cấm 07/08/2026' },
  });

  return {
    ok: false,
    message:
      '⛔ Xoá vật lý tài liệu đã bị CẤM (Board Decision 07/08/2026: "⛔ Không Delete '
      + 'vật lý. Chỉ Archive"). Bảng md_documents ⛔ CHƯA có cột lưu trữ, nên chức năng '
      + 'Lưu trữ ⛔ chưa dùng được — cần migration, xem ADR-027. '
      + 'Sai tên hay sai tệp thì dùng "Sửa tài liệu": nó thay tệp và TĂNG số phiên bản, '
      + 'bản cũ vẫn tra lại được.',
  };
}

// ─── 2. THẢO LUẬN ───────────────────────────────────────────────────────────

export async function postCommentAnywhere(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = commentFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  // Rút @mention lại ở MÁY CHỦ từ chính nội dung, không tin danh sách do trình
  // duyệt gửi lên: người ta có thể sửa để tag bừa cả chục bộ phận.
  const mentions = extractMentions(v.body);

  const { error } = await g.supabase.from('md_comments').insert({
    entity_type: v.entity_type,
    entity_id: v.entity_id,
    parent_id: nz(v.parent_id),
    body: v.body,
    mentions,
    is_task: v.is_task,
    task_status: v.is_task ? (v.task_status ?? 'OPEN') : null,
    assigned_role: nz(v.assigned_role),
    due_date: nz(v.due_date),
    author_id: g.userId,
  });

  if (error) return { ok: false, message: friendlyDbError('postCommentAnywhere', error) };

  revalidatePath(PATH);
  return {
    ok: true,
    message: mentions.length > 0 ? `Đã gửi, có nhắc tới: ${mentions.join(', ')}.` : 'Đã gửi thảo luận.',
  };
}

export async function setTaskStatus(
  id: string,
  status: 'OPEN' | 'DOING' | 'DONE' | 'CANCELLED',
): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const { error } = await g.supabase.from('md_comments').update({ task_status: status }).eq('id', id);
  if (error) return { ok: false, message: friendlyDbError('setTaskStatus', error) };

  revalidatePath(PATH);
  const LABEL: Record<string, string> = {
    OPEN: 'Chưa xử lý', DOING: 'Đang xử lý', DONE: 'Đã xong', CANCELLED: 'Đã huỷ',
  };
  return { ok: true, message: `Đã chuyển việc sang "${LABEL[status]}".` };
}

// ─── 3. YÊU CẦU THAY ĐỔI ────────────────────────────────────────────────────

export async function createChangeRequest(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = changeRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { error } = await g.supabase.from('change_requests').insert({
    request_no: v.request_no,
    order_id: v.order_id,
    style_id: nz(v.style_id),
    change_type: v.change_type,
    old_value: v.old_value,
    new_value: v.new_value,
    reason: nz(v.reason),
    impact_note: nz(v.impact_note),
    status: 'PENDING',
    requested_by: g.userId,
  });

  if (error) {
    const msg = friendlyDbError('createChangeRequest', error);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { request_no: 'Số yêu cầu này đã dùng' } : undefined,
    };
  }

  await writeAudit('ORDER', v.order_id, 'CREATE', {
    [v.change_type]: { from: v.old_value, to: v.new_value },
  });

  revalidatePath(PATH);
  return { ok: true, message: `Đã gửi yêu cầu thay đổi ${v.request_no}, đang chờ duyệt.` };
}

/**
 * Duyệt hoặc từ chối yêu cầu thay đổi.
 *
 * ⚠️ CHỈ đổi trạng thái của chính yêu cầu, KHÔNG tự ghi giá trị mới vào đơn
 * hàng. Số lượng và ngày giao là dữ liệu gốc của sản xuất; tự động sửa từ một
 * ô văn bản tự do sẽ có ngày ghi nhầm "5000 pcs (chờ khách xác nhận)" thành số
 * lượng thật. Người phụ trách vào PO sửa tay, có nhật ký đi kèm.
 */
export async function decideChangeRequest(
  id: string,
  decision: 'APPROVED' | 'REJECTED' | 'APPLIED',
): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const patch: Record<string, unknown> = { status: decision };
  if (decision === 'APPROVED' || decision === 'REJECTED') {
    patch.approved_by = g.userId;
    patch.approved_at = new Date().toISOString();
  }

  const { error } = await g.supabase.from('change_requests').update(patch).eq('id', id);
  if (error) return { ok: false, message: friendlyDbError('decideChangeRequest', error) };

  await writeAudit('CHANGE_REQUEST', id, decision === 'REJECTED' ? 'REJECT' : 'APPROVE', {
    status: { from: 'PENDING', to: decision },
  });

  revalidatePath(PATH);
  const LABEL: Record<string, string> = {
    APPROVED: 'Đã duyệt yêu cầu thay đổi. Hãy vào PO cập nhật số liệu thật.',
    REJECTED: 'Đã từ chối yêu cầu thay đổi.',
    APPLIED: 'Đã đánh dấu yêu cầu thay đổi là đã áp dụng vào đơn hàng.',
  };
  return { ok: true, message: LABEL[decision] };
}
