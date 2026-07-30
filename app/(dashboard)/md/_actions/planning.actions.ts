'use server';

import { revalidatePath } from 'next/cache';

import { guard, friendlyDbError, safeQuery, one } from '../_services/guard';
import { writeAudit } from './audit';
import {
  materialGenSchema,
  productionGenSchema,
  computeMaterialNeeds,
  computeProductionPlan,
  zodFieldErrors,
  type ActionResult,
} from '@/schemas/md';

const PATH = '/md';

interface OrderForPlan {
  id: string;
  po_number: string;
  total_quantity: number;
  delivery_date: string;
  ex_factory_date: string | null;
  style_id: string | null;
  styles: { style_no: string; sam_minutes: number | null } | { style_no: string; sam_minutes: number | null }[] | null;
}

async function readOrder(orderId: string): Promise<{ order: OrderForPlan | null; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { order: null, error: g.error };

  const { data, error } = await g.supabase
    .from('orders')
    .select(
      'id, po_number, total_quantity, delivery_date, ex_factory_date, style_id,' +
        ' styles ( style_no, sam_minutes )',
    )
    .eq('id', orderId)
    .maybeSingle();

  if (error) return { order: null, error: friendlyDbError('readOrder', error) };
  if (!data) return { order: null, error: 'Không tìm thấy đơn hàng.' };
  return { order: data as unknown as OrderForPlan, error: null };
}

// ─── 1. SINH ĐỀ NGHỊ MUA NPL TỪ ĐỊNH MỨC MÃ HÀNG ───────────────────────────

/**
 * Nhu cầu NPL = định mức đã tính hao hụt × số lượng đơn (× dự phòng nếu có).
 * Toàn bộ đầu vào lấy từ mã hàng, người dùng không gõ lại một con số nào.
 *
 * Số đề nghị đặt theo mã PO kèm số thứ tự, ví dụ PO123-NPL-01. Trùng số là
 * lỗi cứng ở tầng dữ liệu nên phải kiểm phần đã có trước khi đánh số tiếp.
 */
export async function generateMaterialRequests(input: unknown): Promise<ActionResult<{ created: number }>> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = materialGenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { order, error: odErr } = await readOrder(v.order_id);
  if (!order) return { ok: false, message: odErr ?? 'Không tìm thấy đơn hàng.' };

  if (!order.style_id) {
    return {
      ok: false,
      message: 'Đơn hàng chưa gắn mã hàng nên không có định mức để tính. Hãy gắn mã hàng cho PO trước.',
    };
  }

  const bomRes = await safeQuery<{
    item_name: string; category: string; unit: string;
    net_consumption: number; supplier: string | null;
  }>('định mức nguyên phụ liệu', () =>
    g.supabase
      .from('style_bom')
      .select('item_name, category, unit, net_consumption, supplier')
      .eq('style_id', order.style_id as string),
  );
  if (bomRes.error) return { ok: false, message: bomRes.error };

  if (bomRes.rows.length === 0) {
    return {
      ok: false,
      message: `Mã hàng ${one(order.styles)?.style_no ?? ''} chưa khai định mức nguyên phụ liệu. Vào tab Mã hàng khai định mức rồi sinh lại.`.trim(),
    };
  }

  const needs = computeMaterialNeeds(bomRes.rows, Number(order.total_quantity), v.buffer_percent);

  // Ngày cần hàng: ưu tiên người dùng chọn, sau đó tới mốc T&A "chốt/về NPL",
  // cuối cùng mới lùi 45 ngày trước ngày giao. Không bịa ngày khi có mốc thật.
  let neededDate = v.needed_date ?? null;
  if (!neededDate) {
    const msRes = await safeQuery<{ planned_date: string | null; milestone: string }>('mốc tiến độ', () =>
      g.supabase
        .from('order_milestones')
        .select('planned_date, milestone')
        .eq('order_id', v.order_id)
        .order('seq_no'),
    );
    const npl = msRes.rows.find((m) => /npl|nguyên|vải|material|fabric/i.test(m.milestone) && m.planned_date);
    neededDate = npl?.planned_date ?? null;
  }
  if (!neededDate) {
    const d = new Date(`${order.delivery_date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 45);
    neededDate = d.toISOString().slice(0, 10);
  }

  // Đánh số tiếp sau những đề nghị đã có của chính PO này
  const existRes = await safeQuery<{ request_no: string }>('đề nghị mua NPL đã có', () =>
    g.supabase.from('material_requests').select('request_no').eq('order_id', v.order_id),
  );
  let seq = existRes.rows.length;

  const payload = needs.map((n) => {
    seq += 1;
    return {
      request_no: `${order.po_number}-NPL-${String(seq).padStart(2, '0')}`,
      order_id: v.order_id,
      material_name: n.item_name,
      category: n.category,
      quantity: n.quantity,
      unit: n.unit,
      needed_date: neededDate,
      status: 'DRAFT',
      notes:
        `Sinh tự động từ định mức mã hàng: ${n.net_consumption} ${n.unit}/sp × ${order.total_quantity} sp` +
        (v.buffer_percent > 0 ? ` × dự phòng ${v.buffer_percent}%` : '') +
        (n.supplier ? ` · NCC gợi ý: ${n.supplier}` : ''),
      created_by: g.userId,
    };
  });

  const { error } = await g.supabase.from('material_requests').insert(payload);
  if (error) return { ok: false, message: friendlyDbError('generateMaterialRequests', error) };

  await writeAudit('ORDER', v.order_id, 'CREATE', {
    material_requests: { from: existRes.rows.length, to: existRes.rows.length + payload.length },
  });

  revalidatePath(PATH);
  return {
    ok: true,
    message: `Đã sinh ${payload.length} đề nghị mua NPL cho ${order.po_number}, ngày cần hàng ${neededDate}. Trạng thái ban đầu là Nháp để bạn soát lại trước khi trình duyệt.`,
    data: { created: payload.length },
  };
}

// ─── 2. SINH LỆNH SẢN XUẤT TỪ THỜI GIAN CHUẨN ──────────────────────────────

/**
 * Lệnh sản xuất tính từ SAM của mã hàng:
 *   tổng phút chuẩn = SAM × số lượng
 *   năng lực/ngày   = số công nhân × giờ/ngày × 60 × hiệu suất
 *   số ngày         = làm tròn lên (tổng phút chuẩn / năng lực ngày)
 *
 * Không có SAM thì DỪNG chứ không đoán: một con số ngày bịa ra sẽ được chuyền
 * dùng để hứa ngày giao với khách.
 */
export async function generateProductionOrder(input: unknown): Promise<ActionResult<{ order_no: string }>> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = productionGenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { order, error: odErr } = await readOrder(v.order_id);
  if (!order) return { ok: false, message: odErr ?? 'Không tìm thấy đơn hàng.' };

  const style = one(order.styles);
  const sam = style?.sam_minutes === null || style?.sam_minutes === undefined ? null : Number(style.sam_minutes);
  if (!sam || sam <= 0) {
    return {
      ok: false,
      message: 'Mã hàng chưa khai thời gian chuẩn (SAM) nên không tính được số ngày sản xuất. Hãy khai SAM ở tab Mã hàng.',
    };
  }

  const dueDate = v.due_date ?? order.ex_factory_date ?? order.delivery_date;
  const plan = computeProductionPlan(
    sam,
    Number(order.total_quantity),
    v.workers,
    v.hours_per_day,
    v.efficiency_percent,
    dueDate,
  );

  const existRes = await safeQuery<{ order_no: string }>('lệnh sản xuất đã có', () =>
    g.supabase.from('production_orders').select('order_no').eq('order_id', v.order_id),
  );
  const orderNo = `${order.po_number}-SX-${String(existRes.rows.length + 1).padStart(2, '0')}`;

  const { error } = await g.supabase.from('production_orders').insert({
    order_no: orderNo,
    order_id: v.order_id,
    planned_qty: Number(order.total_quantity),
    start_date: plan.startDate,
    due_date: plan.dueDate,
    status: 'PENDING',
    notes:
      `Sinh tự động từ SAM ${sam} phút/sp × ${order.total_quantity} sp = ${plan.totalStandardMinutes} phút chuẩn. ` +
      `Năng lực ${v.workers} công nhân × ${v.hours_per_day} giờ × hiệu suất ${v.efficiency_percent}% ` +
      `= ${plan.dailyCapacityMinutes} phút/ngày → ${plan.days} ngày lịch (chưa trừ ngày nghỉ).`,
    created_by: g.userId,
  });

  if (error) return { ok: false, message: friendlyDbError('generateProductionOrder', error) };

  await writeAudit('ORDER', v.order_id, 'CREATE', { production_order: { from: null, to: orderNo } });

  revalidatePath(PATH);
  return {
    ok: true,
    message: `Đã tạo lệnh ${orderNo}: ${plan.days} ngày, chạy từ ${plan.startDate} tới ${plan.dueDate}. Số ngày đếm theo ngày lịch, chưa trừ ngày nghỉ.`,
    data: { order_no: orderNo },
  };
}
