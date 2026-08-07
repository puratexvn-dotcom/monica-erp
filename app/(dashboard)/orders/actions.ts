'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/utils/supabase/server';
import { canAccess, isRole } from '@/lib/rbac';
import { poFormSchema, type PoRow } from './po-schema';
// 🔴 UAT `BUG-3` — xem chú thích tại chỗ gọi trong `createOrder`.
// ⚠️ Dùng LẠI hàm ghi nhật ký đã có ở phân hệ MD, ⛔ không viết hàm thứ hai:
// hai đường ghi nhật ký là hai khuôn bản ghi, và lúc tra cứu sẽ phải hợp nhất
// hai định dạng — đúng thứ một sổ kiểm toán ⛔ không được phép có.
import { writeAudit } from '../md/_actions/audit';

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

  const { data: dong, error: dbError } = await supabase.from('orders').insert({
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
  }).select('id').single();

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

  // 🔴 THÊM 07/08/2026 · UAT `BUG-3` — TRƯỚC ĐÂY TẠO PO ⛔ KHÔNG ĐỂ LẠI VẾT.
  //
  // Đo bằng phiên md001 thật: lập một PO qua giao diện rồi mở tab **Nhật ký**
  // ⇒ ⛔ không có dòng nào. Đếm trong mã: `commercial.actions.ts` gọi
  // `writeAudit` **8 lần**, `po.actions.ts` **3 lần**, còn tệp này — đúng cái
  // mà nút *"+ Tạo PO"* gọi — **0 lần**.
  //
  // 🔑 Nghĩa là **chứng từ quan trọng nhất hệ thống là chứng từ DUY NHẤT
  // ⛔ không có vết**. Khách hàng · yêu cầu báo giá · chiết tính đều truy được
  // *"ai lập, lúc nào"*; đơn hàng thì ⛔ không.
  //
  // ⚠️ `writeAudit` cố ý **⛔ không ném lỗi** *(xem `audit.ts`)*: nhật ký hỏng
  // ⛔ không được làm hỏng việc tạo đơn. Nên đặt nó SAU khi ghi thành công và
  // ⛔ không `try/catch` thêm ở đây — thêm nữa là che mất log máy chủ.
  await writeAudit('ORDER', (dong as { id: string } | null)?.id ?? null, 'CREATE', {
    po_number: { from: null, to: parsed.data.po_number },
    total_quantity: { from: null, to: parsed.data.total_quantity },
    // Giá trị thương mại vào thẳng nhật ký: đây là ô hay bị sửa nhất sau khi
    // đàm phán lại, và cũng là ô cần truy vết nhất.
    unit_price: { from: null, to: parsed.data.unit_price ?? null },
    currency: { from: null, to: parsed.data.currency },
  });

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
