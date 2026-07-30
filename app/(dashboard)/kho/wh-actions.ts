'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/utils/supabase/server';
import { canAccess, isRole } from '@/lib/rbac';
import {
  inboundFormSchema,
  outboundFormSchema,
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

/**
 * Ghi log lỗi Supabase ra console máy chủ (xem được ở Vercel > Logs).
 * In đủ code / details / hint chứ không chỉ message: PostgREST đặt nguyên nhân
 * thật ở `details` và `hint`, còn `message` thường chỉ là một câu chung chung.
 */
function logDbError(where: string, e: unknown): void {
  const err = e as { message?: string; code?: string; details?: string; hint?: string } | null;
  console.error(`[kho:${where}]`, {
    code: err?.code,
    message: err?.message,
    details: err?.details,
    hint: err?.hint,
  });
}

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

  if (dbError) {
    logDbError('listMaterials', dbError);
    return { rows: [], error: `Không đọc được danh mục vật tư: ${dbError.message}` };
  }
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

  if (dbError) {
    logDbError('listTransactions', dbError);
    return { rows: [], error: `Không đọc được lịch sử kho: ${dbError.message}` };
  }

  // Supabase trả quan hệ lồng khi thì object khi thì mảng, tuỳ cách suy luận
  // khoá ngoại — chuẩn hoá về một dạng thay vì phân nhánh ở tầng giao diện.
  const one = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v.length > 0 ? v[0] : null) : v;

  // Bọc try/catch: nếu Supabase đổi hình dạng quan hệ lồng (object <-> mảng)
  // thì phép biến đổi bên dưới có thể ném, và một lỗi ở đây sẽ làm sập cả trang
  // thay vì chỉ hỏng một bảng.
  try {
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
  } catch (e) {
    logDbError('listTransactions:transform', e);
    return {
      rows: [],
      error: `Không đọc được lịch sử kho: ${e instanceof Error ? e.message : 'dữ liệu trả về không đúng định dạng'}`,
    };
  }
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

  if (dbError) {
    logDbError('listPoOptions', dbError);
    return { rows: [], error: `Không đọc được danh sách PO: ${dbError.message}` };
  }
  return { rows: (data ?? []) as PoOption[], error: null };
}

// ── Lõi ghi sổ kho ──────────────────────────────────────────────────────────
type Supa = NonNullable<Awaited<ReturnType<typeof guard>>['supabase']>;

interface MovementInput {
  materialId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  orderId?: string | null;
  referenceNo?: string | null;
  notes?: string | null;
  occurredAt: string;
}

/** Mã lỗi Postgres/PostgREST cho "hàm không tồn tại" */
function isMissingFunction(code: string | undefined, message: string): boolean {
  return code === '42883' || code === 'PGRST202' || /apply_stock_movement/i.test(message);
}

/** Dịch lỗi từ hàm SQL sang câu tiếng Việt có số liệu cụ thể */
function translateRpcError(message: string): string {
  const insufficient = message.match(/INSUFFICIENT_STOCK\|([\d.]+)\|([\d.]+)/);
  if (insufficient) {
    return `Không đủ tồn kho: hiện còn ${insufficient[1]}, không thể xuất ${insufficient[2]}.`;
  }
  if (message.includes('MATERIAL_NOT_FOUND')) return 'Không tìm thấy mã vật tư.';
  if (message.includes('INVALID_QUANTITY')) return 'Số lượng phải lớn hơn 0.';
  if (message.includes('INVALID_TYPE')) return 'Loại giao dịch không hợp lệ.';
  if (message.includes('materials_stock_qty_non_negative')) {
    return 'Thao tác này sẽ làm tồn kho xuống dưới 0 nên đã bị chặn.';
  }
  return message;
}

/**
 * Ghi một giao dịch kho.
 *
 * Ưu tiên gọi hàm apply_stock_movement (migration 011): hàm đó khoá dòng vật tư
 * rồi kiểm tra tồn, ghi phiếu và cộng/trừ tồn trong CÙNG một giao dịch, nên hai
 * người thao tác đồng thời trên một mã không ghi đè nhau và không xuất âm được.
 *
 * Nếu chưa chạy migration 011, hàm chưa tồn tại -> quay về đường cũ đọc-rồi-ghi
 * và GẮN CẢNH BÁO vào thông báo trả về. Cố ý không im lặng: đường cũ vẫn có khe
 * hở lost update, người vận hành phải biết để giục chạy migration.
 */
async function applyMovement(
  supabase: Supa,
  m: MovementInput,
): Promise<{ ok: boolean; message: string; degraded?: boolean }> {
  const rpc = await supabase.rpc('apply_stock_movement', {
    p_material_id: m.materialId,
    p_type: m.type,
    p_quantity: m.quantity,
    p_order_id: m.orderId ?? null,
    p_reference_no: m.referenceNo ?? null,
    p_notes: m.notes ?? null,
    p_occurred_at: m.occurredAt,
  });

  if (!rpc.error) return { ok: true, message: '' };

  if (!isMissingFunction(rpc.error.code, rpc.error.message)) {
    logDbError('applyMovement:rpc', rpc.error);
    return { ok: false, message: translateRpcError(rpc.error.message) };
  }
  console.warn('[kho] apply_stock_movement chưa tồn tại — dùng đường dự phòng. Hãy chạy migration 011.');

  // ── Đường dự phòng: chưa chạy migration 011 ──────────────────────────────
  const { data: cur, error: readErr } = await supabase
    .from('materials')
    .select('stock_qty')
    .eq('id', m.materialId)
    .single();

  if (readErr) return { ok: false, message: `Không đọc được tồn kho: ${readErr.message}` };

  const stock = Number(cur.stock_qty ?? 0);
  if (m.type === 'OUT' && stock < m.quantity) {
    return { ok: false, message: `Không đủ tồn kho: hiện còn ${stock}, không thể xuất ${m.quantity}.` };
  }

  const { error: txErr } = await supabase.from('warehouse_transactions').insert({
    material_id: m.materialId,
    transaction_type: m.type,
    quantity: m.quantity,
    order_id: m.orderId ?? null,
    reference_no: m.referenceNo ?? null,
    notes: m.notes ?? null,
    created_at: m.occurredAt,
  });
  if (txErr) return { ok: false, message: `Không lưu được phiếu kho: ${txErr.message}` };

  const { error: updErr } = await supabase
    .from('materials')
    .update({
      stock_qty: m.type === 'IN' ? stock + m.quantity : stock - m.quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', m.materialId);

  if (updErr) {
    return {
      ok: false,
      message: `Đã lưu phiếu kho nhưng KHÔNG cập nhật được tồn: ${updErr.message}. Vui lòng kiểm tra lại tồn của mã này.`,
    };
  }

  return { ok: true, message: '', degraded: true };
}

const DEGRADED_WARNING =
  ' ⚠ Chưa chạy migration 011 nên tồn kho đang cập nhật theo cách cũ, có thể sai nếu hai người thao tác cùng lúc.';

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

  // 2. Ghi phiếu + cộng tồn trong một giao dịch nguyên khối
  const mv = await applyMovement(supabase, {
    materialId,
    type: 'IN',
    quantity: v.quantity,
    orderId: v.order_id || null,
    referenceNo: v.reference_no || null,
    notes: v.notes || null,
    occurredAt: new Date(`${v.received_date}T00:00:00+07:00`).toISOString(),
  });

  if (!mv.ok) return { ok: false, message: mv.message };

  revalidatePath(MODULE_PATH);
  return {
    ok: true,
    message:
      `Đã nhập ${v.quantity} ${v.unit} vào mã ${v.material_code}${existing ? '' : ' (mã mới)'}.` +
      (mv.degraded ? DEGRADED_WARNING : ''),
  };
}

// ── Xuất kho (cấp phát cho sản xuất) ────────────────────────────────────────
export async function createOutbound(input: unknown): Promise<ActionResult> {
  const { supabase, error } = await guard();
  if (!supabase) return { ok: false, message: error ?? 'Không có quyền' };

  const parsed = outboundFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors };
  }

  const v = parsed.data;

  // Đọc mã vật tư chỉ để dựng thông báo cho người dùng. Việc CHẶN xuất quá tồn
  // do hàm SQL đảm nhiệm — kiểm tra ở đây rồi mới gọi là kiểm tra hai lần mà
  // vẫn hở, vì tồn có thể đổi giữa hai lượt gọi.
  const { data: mat, error: matErr } = await supabase
    .from('materials')
    .select('material_code, unit')
    .eq('id', v.material_id)
    .maybeSingle();

  if (matErr) return { ok: false, message: `Không tra được mã vật tư: ${matErr.message}` };
  if (!mat) {
    return {
      ok: false,
      message: 'Mã vật tư không tồn tại.',
      fieldErrors: { material_id: 'Vui lòng chọn lại mã vật tư' },
    };
  }

  const mv = await applyMovement(supabase, {
    materialId: v.material_id,
    type: 'OUT',
    quantity: v.quantity,
    orderId: v.order_id,
    referenceNo: v.reference_no || null,
    notes: v.notes || null,
    occurredAt: new Date(`${v.issued_date}T00:00:00+07:00`).toISOString(),
  });

  if (!mv.ok) {
    return { ok: false, message: mv.message, fieldErrors: { quantity: 'Kiểm tra lại số lượng xuất' } };
  }

  revalidatePath(MODULE_PATH);
  return {
    ok: true,
    message:
      `Đã xuất ${v.quantity} ${mat.unit} từ mã ${mat.material_code}.` +
      (mv.degraded ? DEGRADED_WARNING : ''),
  };
}

