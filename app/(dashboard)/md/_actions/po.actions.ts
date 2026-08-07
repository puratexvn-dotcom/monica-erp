'use server';

import { revalidatePath } from 'next/cache';

import { guard, friendlyDbError, safeQuery } from '../_services/guard';
import { writeAudit } from './audit';
import { duocSuaPo, kiemSuaPo, canhBaoGiamSoLuong } from '@/lib/mos/md/po-edit';
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
/**
 * Sinh lịch T&A cho **những đơn đang chạy CHƯA có mốc nào**.
 *
 * ─── 🔴 VÌ SAO CẦN HÀM NÀY, 07/08/2026 ──────────────────────────────────
 * `seedMilestones()` **chỉ chạy lúc TẠO PO**. Nhưng 14 đơn đang chạy trong
 * CSDL được tạo **trước** khi có đoạn mã đó ⇒ ⛔ **không đơn nào có mốc**.
 *
 * Hậu quả đo được trên màn hình: khu **Vấn đề cần xử lý** có 7 dòng, trong khi
 * ô *"Việc hôm nay"* hiện **0** và hộp thư việc trống trơn — vì cả năm bảng
 * nuôi nó *(`order_milestones` · `sample_submissions` · `change_requests` ·
 * `md_comments` · `v_order_risk`)* đều RỖNG.
 *
 * 🔑 MD mở máy thấy *"⛔ không có việc nào"* trong khi có **6 đơn đã quá hạn
 * giao**. Đó là màn hình **nói dối theo kiểu trấn an** — nguy hơn báo động sai,
 * vì báo động sai thì người ta đi kiểm, còn trấn an sai thì ⛔ không ai đi đâu.
 *
 * ⚠️ ⛔ **KHÔNG đụng đơn đã có mốc.** Đơn nào đã có lịch thì lịch đó là **sự
 * thật nghiệp vụ** — có thể MD đã sửa tay. Ghi đè lên nó là **xoá công của
 * người dùng**, và `order_milestones` ⛔ không có bản sao để lùi.
 *
 * ⚠️ ⛔ Không đụng lược đồ, ⛔ không đụng công thức: dùng **đúng**
 * `seedMilestones()` mà `createPo` vẫn gọi, trên **đúng** mẫu `ta_templates`
 * đang có *(`FOB-STD`, 15 mốc)*.
 */
export async function sinhLichTaChoDonCu(): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const donRes = await safeQuery<{ id: string; po_number: string; delivery_date: string | null; order_type: string | null; status: string }>(
    'đơn hàng',
    () => g.supabase.from('orders').select('id, po_number, delivery_date, order_type, status'),
  );
  if (donRes.error) return { ok: false, message: donRes.error };

  const mocRes = await safeQuery<{ order_id: string }>(
    'mốc tiến độ',
    () => g.supabase.from('order_milestones').select('order_id'),
  );
  if (mocRes.error) return { ok: false, message: mocRes.error };

  const daCo = new Set(mocRes.rows.map((m) => m.order_id));
  const DA_DONG = ['COMPLETED', 'CLOSED', 'CANCELLED'];

  const canSinh = donRes.rows.filter(
    (d) => !daCo.has(d.id)
      && Boolean(d.delivery_date)
      && !DA_DONG.includes(String(d.status ?? '').toUpperCase()),
  );

  if (canSinh.length === 0) {
    return { ok: true, message: 'Mọi đơn đang chạy đều đã có lịch T&A — ⛔ không có gì để sinh.' };
  }

  // ⚠️ Tuần tự, ⛔ không song song: mỗi lượt là một chuỗi đọc-rồi-ghi, và bắn
  // 14 chuỗi cùng lúc lên một kết nối ⛔ không nhanh hơn bao nhiêu mà lại khó
  // truy khi một đơn hỏng.
  let xong = 0;
  for (const d of canSinh) {
    await seedMilestones(d.id, d.delivery_date as string, d.order_type ?? 'FOB');
    xong += 1;
  }

  revalidatePath(PATH);
  return {
    ok: true,
    message: `Đã sinh lịch T&A cho ${xong}/${canSinh.length} đơn đang chạy.`,
  };
}

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
  //
  // ⚠️ NHƯNG XOÁ VÀ GHI LÀ HAI CÂU LỆNH RIÊNG, KHÔNG CÙNG MỘT GIAO DỊCH.
  // Bản trước xoá xong mới ghi. Câu ghi hỏng — mạng đứt, RLS chặn, ràng buộc
  // đổ — là **MẤT SẠCH** bảng cỡ/màu của đơn đó, không đường khôi phục.
  //
  // Ở đây CHỤP TRƯỚC, và nếu câu ghi hỏng thì GHI LẠI BẢN CHỤP. Cửa sổ mất
  // dữ liệu thu từ "toàn phần, vĩnh viễn" xuống "chỉ khi cả câu ghi lẫn câu
  // khôi phục cùng hỏng" — và trường hợp đó được báo bằng một thông điệp nói
  // thẳng là dữ liệu đã mất, thay vì im lặng.
  //
  // ⚠️ Đây là phương án BÙ TRỪ, không phải giao dịch thật. Cách đúng là một
  // RPC làm cả hai trong MỘT câu lệnh. Đã ghi vào Technical Debt (TD-01) —
  // không làm ở đây vì nó cần migration, mà migration thì phải có người chạy;
  // bản vá này phải có tác dụng NGAY, không chờ ai.
  const { data: banChup, error: snapErr } = await g.supabase
    .from('order_size_breakdown')
    .select('color_code, size_code, quantity')
    .eq('order_id', v.order_id);
  if (snapErr) return { ok: false, message: friendlyDbError('snapshotBreakdown', snapErr) };

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
  if (error) {
    // Khôi phục theo bản chụp. Không dùng chuỗi viết cứng — Điều XXXI mức ②.
    if (banChup && banChup.length > 0) {
      const { error: restoreErr } = await g.supabase.from('order_size_breakdown').insert(
        banChup.map((r) => ({ ...r, order_id: v.order_id })),
      );
      if (restoreErr) {
        return {
          ok: false,
          message:
            'Lưu thất bại VÀ khôi phục cũng thất bại — bảng cỡ/màu của đơn này ' +
            'hiện đang TRỐNG. Vui lòng nhập lại ngay và báo quản trị hệ thống. ' +
            `(${friendlyDbError('restoreBreakdown', restoreErr)})`,
        };
      }
    }
    return { ok: false, message: friendlyDbError('saveBreakdown', error) };
  }

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

// ─── SỬA ĐƠN HÀNG + ĐÍNH KÈM ────────────────────────────────────────────────
//
// Board 06/08/2026: *"PO phải **upload được hình ảnh mẫu và tài liệu đi kèm**;
// PD và MD **sửa được số lượng và tiến độ** của PO đó."*
//
// ✅ **Production Director = giám đốc = vai `giamdoc`** *(Board xác nhận)*.
//
// ⛔ KHÔNG đụng lược đồ: `orders` đã có `total_quantity` · `status` ·
// `delivery_date`; ảnh và tài liệu dùng bảng `attachments` (migration `001`)
// cùng bucket `evidences` đã có sẵn.

/**
 * Sửa **số lượng · tiến độ · ngày giao** của một PO.
 *
 * 🔴 **Đọc lại số ĐÃ SẢN XUẤT trước khi cho sửa số lượng.** PO 5.000 cái đã may
 * 4.800, sửa xuống 3.000 thì tiến độ thành **160%** và mọi báo cáo sản lượng
 * đọc ra là dối. Hàm ⛔ không tự chặn *(có khi khách thật sự cắt đơn)* nhưng
 * **bắt buộc người gọi xác nhận** qua cờ `xacNhanGiam`.
 */
export async function updatePo(
  id: string,
  v: { total_quantity: number; status: string; delivery_date: string },
  xacNhanGiam = false,
): Promise<ActionResult<{ canhBao?: string }>> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  if (!duocSuaPo(g.role)) {
    return { ok: false, message: 'Chỉ Merchandiser và Giám đốc sản xuất mới được sửa đơn hàng.' };
  }
  const kiem = kiemSuaPo(v);
  if (!kiem.ok) return { ok: false, message: kiem.vi, fieldErrors: { [kiem.truong]: kiem.vi } };

  const { data: truoc } = await g.supabase
    .from('orders').select('total_quantity, status, delivery_date, po_number').eq('id', id).maybeSingle();
  if (!truoc) return { ok: false, message: 'Không tìm thấy đơn hàng, hoặc bạn không có quyền xem nó.' };
  const cu = truoc as { total_quantity: number; status: string; delivery_date: string; po_number: string };

  // Số đã ghi nhận sản xuất — đọc từ lệnh sản xuất, ⛔ không đoán.
  const { data: sx } = await g.supabase
    .from('production_orders').select('planned_qty').eq('order_id', id).neq('status', 'CANCELLED');
  const daLam = (sx ?? []).reduce((t, r) => t + Number((r as { planned_qty: number }).planned_qty || 0), 0);
  const canhBao = canhBaoGiamSoLuong(v.total_quantity, daLam);
  if (canhBao && !xacNhanGiam) return { ok: false, message: canhBao, data: { canhBao } };

  const { error } = await g.supabase.from('orders').update({
    total_quantity: v.total_quantity, status: v.status, delivery_date: v.delivery_date,
  }).eq('id', id);
  if (error) return { ok: false, message: friendlyDbError('updatePo', error) };

  await writeAudit('ORDER', id, 'UPDATE', {
    total_quantity: { from: cu.total_quantity, to: v.total_quantity },
    status: { from: cu.status, to: v.status },
    delivery_date: { from: cu.delivery_date, to: v.delivery_date },
  });

  revalidatePath(PATH);
  return { ok: true, message: `Đã cập nhật đơn ${cu.po_number}.` };
}

/**
 * Gắn một tệp **đã upload** vào PO — ảnh mẫu, tech pack, chứng từ.
 *
 * ⚠️ Hàm này ⛔ **không** nhận tệp. Việc tải lên do `uploadEvidence` làm *(nó đã
 * kiểm loại tệp, dung lượng và ghi vào bucket `evidences`)*; ở đây chỉ **ghi
 * mối liên hệ**. Tách hai việc để một lần tải lên hỏng ⛔ không tạo ra bản ghi
 * trỏ tới tệp ⛔ không tồn tại.
 */
export async function attachToPo(
  orderId: string, fileUrl: string, moTa?: string,
): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };
  if (!fileUrl || !/^https?:\/\//.test(fileUrl)) {
    return { ok: false, message: 'Đường dẫn tệp không hợp lệ.' };
  }

  const { error } = await g.supabase.from('attachments').insert({
    entity_type: 'ORDER', entity_id: orderId, file_url: fileUrl, uploaded_by: g.userId,
  });
  if (error) return { ok: false, message: friendlyDbError('attachToPo', error) };

  await writeAudit('ORDER', orderId, 'UPDATE', {
    attachment: { from: null, to: moTa?.trim() || fileUrl },
  });
  revalidatePath(PATH);
  return { ok: true, message: 'Đã đính kèm tệp vào đơn hàng.' };
}

/** Danh sách tệp đã đính kèm của một PO. */
export async function listPoAttachments(
  orderId: string,
): Promise<{ rows: Array<{ id: string; file_url: string; created_at: string }>; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const { data, error } = await g.supabase
    .from('attachments').select('id, file_url, created_at')
    .eq('entity_type', 'ORDER').eq('entity_id', orderId)
    .order('created_at', { ascending: false });
  if (error) return { rows: [], error: friendlyDbError('listPoAttachments', error) };
  return { rows: (data ?? []) as Array<{ id: string; file_url: string; created_at: string }>, error: null };
}
