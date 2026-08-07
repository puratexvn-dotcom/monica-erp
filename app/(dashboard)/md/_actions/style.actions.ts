'use server';

import { revalidatePath } from 'next/cache';

import { guard, friendlyDbError } from '../_services/guard';
import {
  styleFormSchema,
  colorwayFormSchema,
  sizeRangeSchema,
  operationFormSchema,
  styleBomFormSchema,
  parseSizeRange,
  zodFieldErrors,
  type ActionResult,
} from '@/schemas/md';

const PATH = '/md';

/** Chuyển chuỗi rỗng của form thành NULL cho DB.
 *  Ghi thẳng '' vào cột khoá ngoại UUID sẽ lỗi kiểu; ghi '' vào cột text thì
 *  sau này lọc "chưa điền" phải kiểm cả NULL lẫn '' — rườm rà và dễ sót. */
function nz(v: string | undefined | null): string | null {
  return v && v.trim() !== '' ? v : null;
}

export async function createStyle(input: unknown): Promise<ActionResult<{ id: string }>> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = styleFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { data, error } = await g.supabase
    .from('styles')
    .insert({
      style_no: v.style_no,
      style_name: v.style_name,
      customer_id: nz(v.customer_id),
      season_id: nz(v.season_id),
      product_group: nz(v.product_group),
      gender: nz(v.gender),
      hs_code: nz(v.hs_code),
      fabric_type: nz(v.fabric_type),
      sam_minutes: v.sam_minutes ?? null,
      needle_type: nz(v.needle_type),
      machine_types: nz(v.machine_types),
      marker_code: nz(v.marker_code),
      marker_length_m: v.marker_length_m ?? null,
      marker_efficiency: v.marker_efficiency ?? null,
      tech_pack_url: nz(v.tech_pack_url),
      status: v.status,
      notes: nz(v.notes),
      created_by: g.userId,
    })
    .select('id')
    .single();

  if (error) {
    const msg = friendlyDbError('createStyle', error);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { style_no: 'Mã hàng này đã dùng' } : undefined,
    };
  }

  revalidatePath(PATH);
  return { ok: true, message: `Đã tạo mã hàng ${v.style_no}.`, data: { id: (data as { id: string }).id } };
}

export async function addColorway(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = colorwayFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { error } = await g.supabase.from('style_colorways').insert({
    style_id: v.style_id,
    color_code: v.color_code,
    color_name: v.color_name,
    pantone: nz(v.pantone),
    hex_preview: nz(v.hex_preview),
  });

  if (error) {
    const msg = friendlyDbError('addColorway', error);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { color_code: 'Mã màu này đã có trong mã hàng' } : undefined,
    };
  }

  revalidatePath(PATH);
  return { ok: true, message: `Đã thêm màu ${v.color_code} — ${v.color_name}.` };
}

/**
 * Thêm CẢ DẢI size trong một lần: "S,M,L,XL".
 *
 * Nhập từng size một cho mã hàng 8 size là 8 lần mở hộp thoại. Thứ tự người
 * dùng gõ chính là sort_order — sắp theo bảng chữ cái sẽ ra L, M, S, sai hoàn
 * toàn so với thứ tự thật.
 */
export async function addSizeRange(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = sizeRangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;
  const codes = parseSizeRange(v.sizes);

  const { error } = await g.supabase.from('style_sizes').insert(
    codes.map((size_code, i) => ({
      style_id: v.style_id,
      size_code,
      sort_order: (i + 1) * 10, // bước 10 để chèn size mới vào giữa mà không phải đánh số lại
      size_group: nz(v.size_group),
    })),
  );

  if (error) {
    const msg = friendlyDbError('addSizeRange', error);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { sizes: 'Có size đã tồn tại trong mã hàng' } : undefined,
    };
  }

  revalidatePath(PATH);
  return { ok: true, message: `Đã thêm ${codes.length} size: ${codes.join(', ')}.` };
}

export async function addOperation(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = operationFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { error } = await g.supabase.from('style_operations').insert({
    style_id: v.style_id,
    seq_no: v.seq_no,
    operation: v.operation,
    machine_type: nz(v.machine_type),
    sam_minutes: v.sam_minutes,
    notes: nz(v.notes),
  });

  if (error) return { ok: false, message: friendlyDbError('addOperation', error) };

  revalidatePath(PATH);
  return { ok: true, message: `Đã thêm công đoạn ${v.operation} (${v.sam_minutes} phút).` };
}

export async function addStyleBom(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = styleBomFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { error } = await g.supabase.from('style_bom').insert({
    style_id: v.style_id,
    colorway_id: nz(v.colorway_id),
    material_id: nz(v.material_id),
    item_name: v.item_name,
    category: v.category,
    unit: v.unit,
    consumption_per_pcs: v.consumption_per_pcs,
    wastage_percent: v.wastage_percent,
    supplier: nz(v.supplier),
    notes: nz(v.notes),
  });

  if (error) return { ok: false, message: friendlyDbError('addStyleBom', error) };

  revalidatePath(PATH);
  // net_consumption là cột SINH TỰ ĐỘNG trong SQL, không gửi lên và cũng không
  // tự nhân ở đây — để một công thức duy nhất nằm trong DB.
  return {
    ok: true,
    message: `Đã thêm định mức ${v.item_name}: ${v.consumption_per_pcs} ${v.unit}/sp, hao hụt ${v.wastage_percent}%.`,
  };
}

export async function deleteStyleChild(
  // ⚠️ `style_bom` ĐÃ BỊ GỠ khỏi kiểu này — `TD-35`, Board Decision 05/08/2026.
  //
  // ADR-018 §6.2 giữ quyền `DELETE` cho ĐÚNG SÁU bảng, và `style_bom` KHÔNG
  // nằm trong số đó ⇒ migration `042` đã thu hồi quyền. Trước bản vá, giao diện
  // vẫn chào nút "Xoá" ở tab Định mức NPL, và người dùng bấm vào sẽ nhận **lỗi
  // phân quyền** thay vì một thông báo nghiệp vụ.
  //
  // 🔑 Giữ `style_bom` trong kiểu union là để trình biên dịch NÓI DỐI: nó xác
  // nhận một lối gọi mà cơ sở dữ liệu chắc chắn từ chối. Gỡ khỏi kiểu ⇒ mọi nơi
  // gọi sai bị bắt lúc BIÊN DỊCH, không phải lúc người dùng bấm nút.
  //
  // ⛔ KHÔNG cấp lại quyền `DELETE` cho `style_bom` — đi ngược ADR-018 đã chạy.
  // Xoá mềm là đích cuối, và nó cần cột `deleted_at` ⇒ ADR riêng, gộp `TC-1`.
  table: 'style_colorways' | 'style_sizes' | 'style_operations',
  id: string,
): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  // 🟢 08/08/2026 · migration `053` — XOÁ MỀM QUA RPC, ⛔ không `.delete()`.
  //
  // `053` đã THU HỒI quyền `DELETE` của `authenticated` trên ba bảng này
  // (đóng `TD-25`), nên lời gọi cũ nay sẽ đổ `42501`.
  //
  // ⚠️ Đi qua RPC `SECURITY DEFINER` chứ ⛔ không `UPDATE` thẳng: policy
  // `<bảng>_an_da_luu_tru` lọc `deleted_at IS NULL`, mà PostgREST luôn kèm
  // `RETURNING` ⇒ dòng vừa gỡ ⛔ không tự trả về được (CLAUDE.md §7).
  const { error } = await g.supabase.rpc('mos_md_luu_tru', { p_bang: table, p_id: id });
  if (error) return { ok: false, message: friendlyDbError(`luuTru:${table}`, error) };

  revalidatePath(PATH);
  return { ok: true, message: 'Đã gỡ khỏi mã hàng. Dữ liệu GIỮ NGUYÊN — khôi phục được.' };
}
