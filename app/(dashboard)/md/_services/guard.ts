import { createClient } from '@/utils/supabase/server';
import { canAccess, isRole, type Role } from '@/lib/rbac';

// ============================================================================
// CHỐT QUYỀN DÙNG CHUNG CHO MỌI SERVICE / ACTION CỦA PHÂN HỆ MD
//
// Mỗi hàm đọc-ghi đều phải gọi guard() trước. KHÔNG dựa vào middleware: Server
// Action và Server Component service là endpoint có thể bị gọi thẳng, không
// nhất thiết đi qua đường điều hướng trang.
// ============================================================================

const MODULE_PATH = '/md';

export interface GuardOk {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  role: Role;
  error: null;
}
export interface GuardFail {
  supabase: null;
  userId: null;
  role: null;
  error: string;
}

export async function guard(): Promise<GuardOk | GuardFail> {
  const fail = (error: string): GuardFail => ({ supabase: null, userId: null, role: null, error });

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return fail('Không kết nối được máy chủ dữ liệu.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return fail('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

  const raw = user.app_metadata?.role;
  if (!isRole(raw) || !canAccess(raw, MODULE_PATH)) {
    return fail('Bạn không có quyền truy cập phân hệ Merchandiser.');
  }

  return { supabase, userId: user.id, role: raw, error: null };
}

/** In đủ code/details/hint ra log máy chủ. PostgREST đặt nguyên nhân thật ở
 *  `details` và `hint`; `message` thường chỉ là câu chung chung. */
export function logDbError(where: string, e: unknown): void {
  const err = e as { message?: string; code?: string; details?: string; hint?: string } | null;
  console.error(`[md:${where}]`, {
    code: err?.code,
    message: err?.message,
    details: err?.details,
    hint: err?.hint,
  });
}

/** Dịch lỗi DB sang câu người vận hành đọc hiểu */
export function friendlyDbError(where: string, e: { message: string; code?: string }): string {
  logDbError(where, e);
  const m = e.message.toLowerCase();

  if (e.code === '23505' || m.includes('duplicate key')) {
    return 'Mã này đã tồn tại. Vui lòng dùng mã khác.';
  }
  if (e.code === '23503' || m.includes('foreign key')) {
    return 'Dữ liệu đang được tham chiếu ở nơi khác nên không thể thực hiện.';
  }
  if (e.code === '42P01' || m.includes('schema cache') || m.includes('does not exist')) {
    return 'Chưa có bảng dữ liệu cho chức năng này. Hãy chạy migration 015 rồi thử lại.';
  }
  if (m.includes('row-level security')) {
    return 'Bị chặn bởi RLS. Kiểm tra policy trong migration 015 đã tạo chưa.';
  }
  return e.message;
}

/** Supabase trả quan hệ lồng khi thì object khi thì mảng, tuỳ cách suy luận
 *  khoá ngoại. Chuẩn hoá về một dạng thay vì phân nhánh ở tầng giao diện. */
export function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v.length > 0 ? v[0] : null;
  return v ?? null;
}

/**
 * Bọc một truy vấn: lỗi trả về danh sách rỗng kèm thông báo, KHÔNG ném.
 * Một bảng hỏng không được kéo cả trang sang error boundary.
 *
 * ─── VÌ SAO NHẬN `data: unknown` RỒI MỚI ÉP KIỂU ─────────────────────────
 * Supabase suy kiểu kết quả bằng cách PHÂN TÍCH CHUỖI select ở tầng type. Chuỗi
 * nối bằng dấu + không còn là literal nên bộ suy luận bó tay và trả về
 * GenericStringError[], khiến mọi truy vấn có select dài đều đỏ.
 * Ở đây nhận unknown rồi ép sang T ĐÚNG MỘT CHỖ, kèm interface Raw* khai báo
 * tường minh ở nơi gọi — vẫn kiểm soát được kiểu mà không phải viết select
 * thành một dòng dài hàng trăm ký tự.
 */
export async function safeQuery<T>(
  label: string,
  run: () => PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>,
): Promise<{ rows: T[]; error: string | null }> {
  try {
    const { data, error } = await run();
    if (error) return { rows: [], error: `Không đọc được ${label}: ${friendlyDbError(label, error)}` };
    return { rows: (data ?? []) as T[], error: null };
  } catch (e) {
    logDbError(label, e);
    const detail = e instanceof Error ? e.message : String(e);
    return { rows: [], error: `Không đọc được ${label}: ${detail}` };
  }
}
