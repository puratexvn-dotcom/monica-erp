'use server';

// ============================================================================
// QUẢN TRỊ TÀI KHOẢN — Server Actions
//
// Tạo / khoá / xoá tài khoản đều phải đi qua Supabase Admin API, mà API đó chỉ
// chấp nhận service_role key. Khoá này TUYỆT ĐỐI không được xuống trình duyệt,
// nên toàn bộ thao tác nằm ở đây (Server Action) thay vì gọi thẳng từ trang.
//
// Mỗi hàm đều tự kiểm tra người gọi có phải superadmin không. Không dựa vào
// việc middleware đã chặn: Server Action là một endpoint HTTP có thể bị gọi
// trực tiếp, không nhất thiết đi qua đường điều hướng trang.
// ============================================================================

import { createClient as createServerSupabase } from '@/utils/supabase/server';
import { isRole } from '@/lib/rbac';
import type { Role } from '@/types/erp';

export interface ActionResult {
  ok: boolean;
  message: string;
}

interface AdminContext {
  url: string;
  serviceKey: string;
  actorEmail: string;
}

/** Xác thực người gọi là superadmin và lấy cấu hình admin API. */
async function requireSuperadmin(): Promise<AdminContext | ActionResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' };

  const role = user.app_metadata?.role;
  if (!isRole(role) || role !== 'superadmin') {
    return { ok: false, message: 'Chỉ Super Admin mới được thao tác trên tài khoản người dùng.' };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return {
      ok: false,
      message:
        'Máy chủ thiếu SUPABASE_SERVICE_ROLE_KEY nên không tạo/khoá được tài khoản. ' +
        'Thêm biến này vào biến môi trường của môi trường triển khai.',
    };
  }

  return { url, serviceKey, actorEmail: user.email ?? 'superadmin' };
}

function isFailure(v: AdminContext | ActionResult): v is ActionResult {
  return 'ok' in v;
}

async function adminFetch(
  ctx: AdminContext,
  path: string,
  init: { method: string; body?: unknown },
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(`${ctx.url}/auth/v1${path}`, {
    method: init.method,
    headers: {
      apikey: ctx.serviceKey,
      Authorization: `Bearer ${ctx.serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
}

function errText(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    for (const k of ['msg', 'message', 'error_description', 'error']) {
      if (typeof b[k] === 'string' && b[k]) return b[k] as string;
    }
  }
  return fallback;
}

// ── Đọc email kèm theo danh sách nhân sự ────────────────────────────────────
/**
 * profiles không chứa email (email nằm ở schema auth, trình duyệt không đọc
 * được). Hàm này trả về bản đồ id -> email để trang admin ghép vào.
 */
export async function fetchStaffEmails(): Promise<Record<string, string>> {
  const ctx = await requireSuperadmin();
  if (isFailure(ctx)) return {};

  const res = await adminFetch(ctx, '/admin/users?per_page=200', { method: 'GET' });
  if (!res.ok || !res.body || typeof res.body !== 'object') return {};

  const users = (res.body as { users?: Array<{ id?: string; email?: string }> }).users ?? [];
  const map: Record<string, string> = {};
  for (const u of users) {
    if (u.id && u.email) map[u.id] = u.email;
  }
  return map;
}

// ── Tạo tài khoản ───────────────────────────────────────────────────────────
export async function createStaffAccount(input: {
  email: string;
  fullName: string;
  role: Role;
  employeeCode?: string;
  password: string;
}): Promise<ActionResult> {
  const ctx = await requireSuperadmin();
  if (isFailure(ctx)) return ctx;

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  if (!email || !email.includes('@')) return { ok: false, message: 'Email không hợp lệ.' };
  if (!fullName) return { ok: false, message: 'Vui lòng nhập họ tên.' };
  if (!isRole(input.role)) return { ok: false, message: 'Vai trò không hợp lệ.' };
  if (input.password.length < 10) {
    return { ok: false, message: 'Mật khẩu khởi tạo phải dài tối thiểu 10 ký tự.' };
  }

  const res = await adminFetch(ctx, '/admin/users', {
    method: 'POST',
    body: {
      email,
      password: input.password,
      email_confirm: true,
      app_metadata: { role: input.role },
      user_metadata: {
        full_name: fullName,
        employee_code: input.employeeCode?.trim() || null,
        // Người mới luôn phải đổi mật khẩu khởi tạo ở lần đăng nhập đầu
        force_password_change: true,
      },
    },
  });

  if (!res.ok) {
    if (res.status === 422) {
      return { ok: false, message: `Email ${email} đã tồn tại trong hệ thống.` };
    }
    return { ok: false, message: errText(res.body, `Không tạo được tài khoản (mã ${res.status}).`) };
  }

  // Gán vai trò trong bảng public.user_roles để hồ sơ nhân sự khớp với token.
  // Trigger on_auth_user_created đã tạo sẵn dòng profiles.
  const newId = (res.body as { id?: string } | null)?.id;
  if (newId) {
    const supabase = await createServerSupabase();
    const { data: roleRow } = await supabase.from('roles').select('id').eq('code', input.role).single();
    if (roleRow?.id) {
      await supabase.from('user_roles').upsert(
        { user_id: newId, role_id: roleRow.id as string },
        { onConflict: 'user_id,role_id' },
      );
    }
  }

  return { ok: true, message: `Đã tạo tài khoản ${email}. Người dùng sẽ phải đổi mật khẩu ở lần đăng nhập đầu.` };
}

// ── Khoá / mở khoá ──────────────────────────────────────────────────────────
export async function setStaffActive(userId: string, active: boolean): Promise<ActionResult> {
  const ctx = await requireSuperadmin();
  if (isFailure(ctx)) return ctx;

  // ban_duration khoá luôn ở tầng đăng nhập — chỉ đổi cờ is_active trong
  // profiles là chưa đủ, người dùng vẫn đăng nhập và lấy token bình thường.
  const res = await adminFetch(ctx, `/admin/users/${userId}`, {
    method: 'PUT',
    body: { ban_duration: active ? 'none' : '876000h' }, // ~100 năm
  });

  if (!res.ok) {
    return { ok: false, message: errText(res.body, `Không đổi được trạng thái (mã ${res.status}).`) };
  }

  const supabase = await createServerSupabase();
  await supabase.from('profiles').update({ is_active: active }).eq('id', userId);

  return { ok: true, message: active ? 'Đã mở khoá tài khoản.' : 'Đã khoá tài khoản.' };
}

// ── Xoá tài khoản ───────────────────────────────────────────────────────────
export async function deleteStaffAccount(userId: string): Promise<ActionResult> {
  const ctx = await requireSuperadmin();
  if (isFailure(ctx)) return ctx;

  // Chặn tự xoá chính mình: xoá xong sẽ không còn superadmin nào để khôi phục.
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === userId) {
    return { ok: false, message: 'Không thể xoá chính tài khoản đang đăng nhập.' };
  }

  const res = await adminFetch(ctx, `/admin/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) {
    return { ok: false, message: errText(res.body, `Không xoá được tài khoản (mã ${res.status}).`) };
  }

  return { ok: true, message: 'Đã xoá tài khoản khỏi hệ thống.' };
}

// ── Đặt lại mật khẩu ────────────────────────────────────────────────────────
export async function resetStaffPassword(userId: string, newPassword: string): Promise<ActionResult> {
  const ctx = await requireSuperadmin();
  if (isFailure(ctx)) return ctx;

  if (newPassword.length < 10) {
    return { ok: false, message: 'Mật khẩu mới phải dài tối thiểu 10 ký tự.' };
  }

  // Đọc metadata hiện tại rồi TRỘN, không ghi đè: PUT với user_metadata mới sẽ
  // thay thế cả cụm, làm mất full_name và employee_code của người dùng.
  const cur = await adminFetch(ctx, `/admin/users/${userId}`, { method: 'GET' });
  if (!cur.ok) {
    return { ok: false, message: errText(cur.body, `Không đọc được tài khoản (mã ${cur.status}).`) };
  }
  const curMeta =
    cur.body && typeof cur.body === 'object'
      ? ((cur.body as { user_metadata?: Record<string, unknown> }).user_metadata ?? {})
      : {};

  const res = await adminFetch(ctx, `/admin/users/${userId}`, {
    method: 'PUT',
    body: {
      password: newPassword,
      user_metadata: { ...curMeta, force_password_change: true },
    },
  });

  if (!res.ok) {
    return { ok: false, message: errText(res.body, `Không đặt lại được mật khẩu (mã ${res.status}).`) };
  }

  return { ok: true, message: 'Đã đặt lại mật khẩu. Người dùng phải đổi lại ở lần đăng nhập kế tiếp.' };
}
