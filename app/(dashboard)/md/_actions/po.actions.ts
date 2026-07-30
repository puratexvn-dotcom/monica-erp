'use server';

import { revalidatePath } from 'next/cache';

import { guard, friendlyDbError, safeQuery } from '../_services/guard';
import {
  poFormSchema,
  sizeBreakdownSchema,
  sampleFormSchema,
  riskAssessmentSchema,
  commentFormSchema,
  generateMilestones,
  extractMentions,
  zodFieldErrors,
  type ActionResult,
} from '@/schemas/md';

const PATH = '/md';

function nz(v: string | undefined | null): string | null {
  return v && v.trim() !== '' ? v : null;
}

// ─── 1. Tạo PO ──────────────────────────────────────────────────────────────
export async function createPo(input: unknown): Promise<ActionResult<{ id: string }>> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = poFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  // Lấy tên khách từ bảng customers để cột customer_name (kiểu text, có từ
  // thời trước) luôn khớp với customer_id. Hai chỗ lệch nhau thì báo cáo theo
  // tên và báo cáo theo id sẽ ra hai kết quả khác nhau.
  let customerName = '';
  if (v.customer_id) {
    const { data } = await g.supabase.from('customers').select('name').eq('id', v.customer_id).maybeSingle();
    customerName = (data as { name: string } | null)?.name ?? '';
  }

  const { data, error } = await g.supabase
    .from('orders')
    .insert({
      po_number: v.po_number,
      style_id: v.style_id,
      customer_id: nz(v.customer_id),
      customer_name: customerName || 'Chưa gán khách hàng',
      season_id: nz(v.season_id),
      costing_id: nz(v.costing_id),
      total_quantity: v.total_quantity,
      order_type: v.order_type,
      incoterm: nz(v.incoterm),
      currency: v.currency,
      unit_price: v.unit_price ?? null,
      order_date: v.order_date,
      delivery_date: v.delivery_date,
      ex_factory_date: nz(v.ex_factory_date),
      factory_name: nz(v.factory_name),
      subcontractor_id: nz(v.subcontractor_id),
      ship_mode: nz(v.ship_mode),
      status: v.status,
      evidence_path: nz(v.evidence_path),
      created_by: g.userId,
    })
    .select('id')
    .single();

  if (error) {
    const msg = friendlyDbError('createPo', error);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { po_number: 'Mã PO này đã dùng' } : undefined,
    };
  }

  const orderId = (data as { id: string }).id;

  // Sinh lịch T&A ngay khi tạo PO. Làm tự động vì lịch trống thì cảnh báo trễ
  // không có gì để so, mà lập tay 15 mốc cho mỗi PO là việc không ai làm nổi.
  await seedMilestones(orderId, v.delivery_date, v.order_type);

  revalidatePath(PATH);
  return { ok: true, message: `Đã tạo PO ${v.po_number} và sinh lịch tiến độ.`, data: { id: orderId } };
}

/** Sinh lịch T&A từ mẫu. Ưu tiên mẫu đúng hình thức gia công, không có thì
 *  dùng mẫu mặc định. Không tìm được mẫu nào thì bỏ qua chứ KHÔNG chặn tạo PO —
 *  thiếu lịch còn hơn không tạo được đơn. */
async function seedMilestones(orderId: string, deliveryDate: string, orderType: string): Promise<void> {
  const g = await guard();
  if (!g.supabase) return;

  const tplRes = await safeQuery<{ id: string; order_type: string | null; is_default: boolean }>(
    'mẫu lịch T&A',
    () => g.supabase.from('ta_templates').select('id, order_type, is_default'),
  );
  const tpl =
    tplRes.rows.find((t) => t.order_type === orderType) ?? tplRes.rows.find((t) => t.is_default);
  if (!tpl) return;

  const itemsRes = await safeQuery<{
    seq_no: number;
    milestone: string;
    offset_days_before_delivery: number;
    is_critical: boolean;
    responsible_role: string | null;
  }>('mốc trong mẫu', () =>
    g.supabase
      .from('ta_template_items')
      .select('seq_no, milestone, offset_days_before_delivery, is_critical, responsible_role')
      .eq('template_id', tpl.id)
      .order('seq_no'),
  );
  if (itemsRes.rows.length === 0) return;

  const milestones = generateMilestones(deliveryDate, itemsRes.rows);
  await g.supabase
    .from('order_milestones')
    .insert(milestones.map((m) => ({ ...m, order_id: orderId, status: 'PENDING' })));
}

// ─── 2. Số lượng theo màu × size ────────────────────────────────────────────
export async function saveSizeBreakdown(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = sizeBreakdownSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  // Xoá rồi ghi lại toàn bộ: bảng màu×size luôn được sửa cả cụm, so từng ô để
  // biết thêm/sửa/xoá phức tạp hơn nhiều mà không được lợi gì.
  const { error: delErr } = await g.supabase
    .from('order_size_breakdown')
    .delete()
    .eq('order_id', v.order_id);
  if (delErr) return { ok: false, message: friendlyDbError('clearBreakdown', delErr) };

  const { error } = await g.supabase.from('order_size_breakdown').insert(
    v.rows.map((r) => ({
      order_id: v.order_id,
      color_code: r.color_code.toUpperCase(),
      size_code: r.size_code.toUpperCase(),
      quantity: r.quantity,
    })),
  );
  if (error) return { ok: false, message: friendlyDbError('saveBreakdown', error) };

  revalidatePath(PATH);
  const total = v.rows.reduce((s, r) => s + r.quantity, 0);
  return { ok: true, message: `Đã lưu ${v.rows.length} dòng, tổng ${total} sản phẩm.` };
}

// ─── 3. Mốc tiến độ ─────────────────────────────────────────────────────────
/** Đánh dấu một mốc đã xong. Tách riêng khỏi updateMilestone vì đây là thao
 *  tác một chạm ngay trên bảng, không cần mở form. */
export async function completeMilestone(
  milestoneId: string,
  actualDate: string,
): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const { error } = await g.supabase
    .from('order_milestones')
    .update({ actual_date: actualDate, status: 'DONE' })
    .eq('id', milestoneId);

  if (error) return { ok: false, message: friendlyDbError('completeMilestone', error) };

  revalidatePath(PATH);
  // delay_days là cột SINH TỰ ĐỘNG, không tự tính ở đây
  return { ok: true, message: 'Đã đánh dấu hoàn thành mốc này.' };
}

// ─── 4. Mẫu duyệt ───────────────────────────────────────────────────────────
export async function saveSample(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = sampleFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { error } = await g.supabase.from('sample_submissions').insert({
    order_id: nz(v.order_id),
    style_id: nz(v.style_id),
    stage: v.stage,
    round_no: v.round_no,
    sent_date: nz(v.sent_date),
    reply_date: nz(v.reply_date),
    status: v.status,
    buyer_comment: nz(v.buyer_comment),
    attachment_url: nz(v.attachment_url),
    created_by: g.userId,
  });

  if (error) {
    const msg = friendlyDbError('saveSample', error);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại')
        ? { round_no: 'Lần gửi này đã có, hãy tăng số lần gửi' }
        : undefined,
    };
  }

  revalidatePath(PATH);
  return { ok: true, message: 'Đã ghi nhận mẫu duyệt.' };
}

// ─── 5. Chấm điểm rủi ro ────────────────────────────────────────────────────
export async function saveRisk(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = riskAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  // total_score là cột SINH TỰ ĐỘNG theo trọng số trong migration 015 — chỉ
  // gửi bốn điểm thành phần, KHÔNG gửi điểm tổng.
  const { error } = await g.supabase.from('risk_assessments').upsert(
    {
      order_id: v.order_id,
      material_score: v.material_score,
      schedule_score: v.schedule_score,
      quality_score: v.quality_score,
      capacity_score: v.capacity_score,
      computed_at: new Date().toISOString(),
    },
    { onConflict: 'order_id' },
  );

  if (error) return { ok: false, message: friendlyDbError('saveRisk', error) };

  revalidatePath(PATH);
  return { ok: true, message: 'Đã cập nhật điểm rủi ro.' };
}

// ─── 6. Thảo luận ───────────────────────────────────────────────────────────
export async function postComment(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = commentFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  // Rút tag @ từ chính nội dung thay vì tin danh sách client gửi lên: client
  // có thể gửi mentions không khớp với chữ trong bài, dẫn tới báo sai người.
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

  if (error) return { ok: false, message: friendlyDbError('postComment', error) };

  revalidatePath(PATH);
  return {
    ok: true,
    message: mentions.length > 0 ? `Đã gửi và gọi ${mentions.length} bộ phận.` : 'Đã gửi.',
  };
}
