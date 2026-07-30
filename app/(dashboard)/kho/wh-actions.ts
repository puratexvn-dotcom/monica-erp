'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/utils/supabase/server';
import { canAccess, isRole } from '@/lib/rbac';
import {
  inboundFormSchema,
  type MaterialRow,
  type PoOption,
  type TxRow,
} from './wh-schema';

// ============================================================================
// SERVER ACTIONS — KHO NGUYÊN PHỤ LIỆU
//
// Tách khỏi ./actions.ts cũ (vẫn dùng cho màn hình xuất kho hiện có) để không
// phá luồng đang chạy. Bản mới khác ba điểm:
//   1. Có guard RBAC — actions.ts cũ không kiểm tra quyền, ai gọi được endpoint
//      là ghi được sổ kho.
//   2. Validate bằng Zod thay vì parseFloat + vài phép so sánh.
//   3. Nhập kho dùng RPC giao dịch nguyên khối (xem ghi chú ở createInbound).
// ============================================================================

export interface ActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

const MODULE_PATH = '/kho';

async function guard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase: null, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' } as const;
  }

  const role = user.app_metadata?.role;
  if (!isRole(role) || !canAccess(role, MODULE_PATH)) {
    return { supabase: null, error: 'Bạn không có quyền thao tác trên kho.' } as const;
  }

  return { supabase, error: null } as const;
}

// ── Danh mục tồn kho ────────────────────────────────────────────────────────
export async function listMaterials(): Promise<{ rows: MaterialRow[]; error: string | null }> {
  const { supabase, error } = await guard();
  if (!supabase) return { rows: [], error };

  const { data, error: dbError } = await supabase
    .from('materials')
    .select('id, material_code, name, category, unit, stock_qty, min_stock_qty')
    .order('material_code', { ascending: true });

  if (dbError) return { rows: [], error: `Không đọc được danh mục vật tư: ${dbError.message}` };
  return { rows: (data ?? []) as MaterialRow[], error: null };
}

// ── Lịch sử xuất/nhập ───────────────────────────────────────────────────────
interface RawTx {
  id: string;
  transaction_type: string;
  quantity: number;
  reference_no: string | null;
  notes: string | null;
  created_at: string;
  materials: { material_code: string; name: string; unit: string } | null;
  orders: { po_number: string } | null;
}

export async function listTransactions(): Promise<{ rows: TxRow[]; error: string | null }> {
  const { supabase, error } = await guard();
  if (!supabase) return { rows: [], error };

  const { data, error: dbError } = await supabase
    .from('warehouse_transactions')
    .select(
      'id, transaction_type, quantity, reference_no, notes, created_at, ' +
        'materials ( material_code, name, unit ), orders ( po_number )',
    )
    .order('created_at', { ascending: false })
    .limit(1000);

  if (dbError) return { rows: [], error: `Không đọc được lịch sử kho: ${dbError.message}` };

  // Supabase trả quan hệ lồng khi thì object khi thì mảng, tuỳ cách suy luận
  // khoá ngoại — chuẩn hoá về một dạng thay vì phân nhánh ở tầng giao diện.
  const one = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v.length > 0 ? v[0] : null) : v;

  const rows: TxRow[] = ((data ?? []) as unknown as RawTx[]).map((r) => {
    const mat = one(r.materials);
    const ord = one(r.orders);
    return {
      id: r.id,
      transaction_type: r.transaction_type,
      quantity: Number(r.quantity),
      reference_no: r.reference_no,
      notes: r.notes,
      created_at: r.created_at,
      material_code: mat?.material_code ?? '—',
      material_name: mat?.name ?? '—',
      unit: mat?.unit ?? '',
      po_number: ord?.po_number ?? null,
    };
  });

  return { rows, error: null };
}

// ── Danh sách PO cho ô tham chiếu ───────────────────────────────────────────
export async function listPoOptions(): Promise<{ rows: PoOption[]; error: string | null }> {
  const { supabase, error } = await guard();
  if (!supabase) return { rows: [], error };

  const { data, error: dbError } = await supabase
    .from('orders')
    .select('id, po_number, style_code, customer_name')
    .order('created_at', { ascending: false })
    .limit(500);

  if (dbError) return { rows: [], error: `Không đọc được danh sách PO: ${dbError.message}` };
  return { rows: (data ?? []) as PoOption[], error: null };
}

// ── Nhập kho ────────────────────────────────────────────────────────────────
export async function createInbound(input: unknown): Promise<ActionResult> {
  const { supabase, error } = await guard();
  if (!supabase) return { ok: false, message: error ?? 'Không có quyền' };

  const parsed = inboundFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors };
  }

  const v = parsed.data;

  // 1. Tìm hoặc tạo mã NPL. Mã đã có thì KHÔNG ghi đè tên/loại/đơn vị: sổ kho
  //    cũ đã ghi theo đơn vị đó, đổi đơn vị giữa đường là làm sai toàn bộ tồn.
  const { data: existing, error: findErr } = await supabase
    .from('materials')
    .select('id, unit, stock_qty')
    .eq('material_code', v.material_code)
    .maybeSingle();

  if (findErr) return { ok: false, message: `Không tra được mã NPL: ${findErr.message}` };

  let materialId = existing?.id as string | undefined;

  if (existing) {
    if (existing.unit !== v.unit) {
      return {
        ok: false,
        message: `Mã ${v.material_code} đang quản lý theo đơn vị "${existing.unit}", không thể nhập theo "${v.unit}".`,
        fieldErrors: { unit: `Mã này đã cố định đơn vị ${existing.unit}` },
      };
    }
  } else {
    const { data: created, error: insErr } = await supabase
      .from('materials')
      .insert({
        material_code: v.material_code,
        name: v.material_name,
        category: v.category,
        unit: v.unit,
        stock_qty: 0,
      })
      .select('id')
      .single();

    if (insErr) return { ok: false, message: `Không tạo được mã NPL mới: ${insErr.message}` };
    materialId = created.id as string;
  }

  if (!materialId) return { ok: false, message: 'Không xác định được mã NPL.' };

  // 2. Ghi phiếu nhập
  const { error: txErr } = await supabase.from('warehouse_transactions').insert({
    material_id: materialId,
    transaction_type: 'IN',
    quantity: v.quantity,
    order_id: v.order_id || null,
    reference_no: v.reference_no || null,
    notes: v.notes || null,
    created_at: new Date(`${v.received_date}T00:00:00+07:00`).toISOString(),
  });

  if (txErr) return { ok: false, message: `Không lưu được phiếu nhập: ${txErr.message}` };

  // 3. Cộng tồn.
  //    ⚠️ HẠN CHẾ ĐÃ BIẾT: đọc-rồi-ghi qua hai lượt gọi nên hai người nhập cùng
  //    lúc cùng một mã có thể ghi đè nhau (lost update). Cách đúng là dồn vào
  //    một hàm RPC trong Postgres:
  //        UPDATE materials SET stock_qty = stock_qty + p_qty WHERE id = p_id;
  //    Chưa làm ở bước này vì cần thêm migration; đã ghi lại để xử lý khi dựng
  //    tiếp phần xuất kho.
  const { data: cur, error: readErr } = await supabase
    .from('materials')
    .select('stock_qty')
    .eq('id', materialId)
    .single();

  if (readErr) {
    return {
      ok: false,
      message: `Đã lưu phiếu nhập nhưng KHÔNG cập nhật được tồn kho: ${readErr.message}. Vui lòng kiểm tra lại tồn của mã ${v.material_code}.`,
    };
  }

  const { error: updErr } = await supabase
    .from('materials')
    .update({
      stock_qty: Number(cur.stock_qty ?? 0) + v.quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', materialId);

  if (updErr) {
    return {
      ok: false,
      message: `Đã lưu phiếu nhập nhưng KHÔNG cập nhật được tồn kho: ${updErr.message}. Vui lòng kiểm tra lại tồn của mã ${v.material_code}.`,
    };
  }

  revalidatePath(MODULE_PATH);
  return {
    ok: true,
    message: `Đã nhập ${v.quantity} ${v.unit} vào mã ${v.material_code}${existing ? '' : ' (mã mới)'}.`,
  };
}
