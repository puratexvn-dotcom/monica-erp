'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/utils/supabase/server';
import { canAccess, isRole } from '@/lib/rbac';
import { poFormSchema, type PoRow } from './po-schema';

// ============================================================================
// SERVER ACTIONS — Quản lý đơn hàng (bảng `orders`)
//
// Bản cũ có hai lỗ hổng đã sửa ở đây:
//   1. Không kiểm tra quyền — bất kỳ ai gọi được endpoint là tạo được PO.
//      Server Action là endpoint HTTP công khai, không phải hàm nội bộ, nên
//      không được ỷ vào việc middleware đã chặn đường vào trang.
//   2. Validate chỉ bằng vài phép kiểm tra rỗng, ép kiểu bằng parseInt nên
//      "abc" thành NaN vẫn lọt xuống DB.
// ============================================================================

export interface ActionResult {
  ok: boolean;
  message: string;
  /** Lỗi theo từng trường, để form tô đỏ đúng ô thay vì báo chung chung */
  fieldErrors?: Record<string, string>;
}

export interface ListResult {
  rows: PoRow[];
  error: string | null;
}

const MODULE_PATH = '/orders';

/** Xác thực người gọi và quyền vào phân hệ đơn hàng. */
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
    return { supabase: null, error: 'Bạn không có quyền thao tác trên đơn hàng.' } as const;
  }

  return { supabase, error: null } as const;
}

// ── Đọc danh sách ───────────────────────────────────────────────────────────
export async function listOrders(): Promise<ListResult> {
  const { supabase, error } = await guard();
  if (!supabase) return { rows: [], error };

  const { data, error: dbError } = await supabase
    .from('orders')
    .select('id, po_number, customer_name, style_code, total_quantity, delivery_date, status, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (dbError) return { rows: [], error: `Không đọc được danh sách đơn hàng: ${dbError.message}` };

  return { rows: (data ?? []) as PoRow[], error: null };
}

// ── Tạo mới ─────────────────────────────────────────────────────────────────
export async function createOrder(input: unknown): Promise<ActionResult> {
  const { supabase, error } = await guard();
  if (!supabase) return { ok: false, message: error ?? 'Không có quyền' };

  // Validate lại ở server bằng ĐÚNG lược đồ client dùng
  const parsed = poFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors };
  }

  const { error: dbError } = await supabase.from('orders').insert({
    po_number: parsed.data.po_number,
    customer_name: parsed.data.customer_name,
    style_code: parsed.data.style_code,
    total_quantity: parsed.data.total_quantity,
    delivery_date: parsed.data.delivery_date,
    // Giá trị thương mại — xem chú thích ở `po-schema.ts`. `undefined` ⇒ ghi
    // `null`, ⛔ KHÔNG ghi 0: `0` đọc thành *"đơn giá bằng không"*, một tin
    // sai; `null` đọc thành *"⛔ chưa chốt giá"*, đúng sự thật.
    currency: parsed.data.currency,
    unit_price: parsed.data.unit_price ?? null,
    status: parsed.data.status,
  });

  if (dbError) {
    // 23505 = vi phạm UNIQUE. Báo đúng ô bị trùng thay vì ném mã lỗi Postgres.
    if (dbError.code === '23505') {
      return {
        ok: false,
        message: `Mã PO "${parsed.data.po_number}" đã tồn tại.`,
        fieldErrors: { po_number: 'Mã PO này đã có trong hệ thống' },
      };
    }
    return { ok: false, message: `Không tạo được đơn hàng: ${dbError.message}` };
  }

  revalidatePath(MODULE_PATH);
  return { ok: true, message: `Đã tạo đơn hàng ${parsed.data.po_number}.` };
}

// ── Đổi trạng thái ──────────────────────────────────────────────────────────
export async function updateOrderStatus(id: string, status: string): Promise<ActionResult> {
  const { supabase, error } = await guard();
  if (!supabase) return { ok: false, message: error ?? 'Không có quyền' };

  const parsed = poFormSchema.shape.status.safeParse(status);
  if (!parsed.success) return { ok: false, message: 'Trạng thái không hợp lệ.' };

  const { error: dbError } = await supabase
    .from('orders')
    .update({ status: parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (dbError) return { ok: false, message: `Không cập nhật được trạng thái: ${dbError.message}` };

  revalidatePath(MODULE_PATH);
  return { ok: true, message: 'Đã cập nhật trạng thái đơn hàng.' };
}
