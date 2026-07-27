// ============================================================================
// MONICA GARMENT ERP — Auth & RBAC (demo)
// ⚠️ BẢO MẬT: Đây là cơ chế demo với mật khẩu lưu trong bảng users.
//    Production BẮT BUỘC chuyển sang Supabase Auth (bcrypt) + RLS policies.
// ============================================================================
import type { Role, User } from '@/types/erp';
import { fetchTable } from '@/lib/supabase';

const SESSION_KEY = 'monica_erp_session_v1';

export interface Session {
  user: User;
  loginAt: string;
}

// ── Vai trò → nhãn hiển thị ─────────────────────────────────────────────────
export const ROLE_LABEL: Record<Role, string> = {
  superadmin: 'Super Admin',
  giamdoc: 'Giám đốc',
  md: 'Merchandiser',
  qa: 'QA / QC',
  totruongmay: 'Tổ trưởng May',
  totruongcat: 'Tổ trưởng Cắt',
  kho: 'Quản lý Kho',
  ketoan: 'Kế toán',
  subcon: 'Xưởng gia công',
  buyer: 'Khách hàng (Buyer)',
};

// ── Vai trò → trang mặc định sau đăng nhập ──────────────────────────────────
export const ROLE_HOME: Record<Role, string> = {
  superadmin: '/admin',
  giamdoc: '/giam-doc',
  md: '/md',
  qa: '/qa',
  totruongmay: '/to-truong-may',
  totruongcat: '/to-truong-cat',
  kho: '/kho',
  ketoan: '/ke-toan',
  subcon: '/subcon',
  buyer: '/buyer',
};

// ── Ma trận RBAC: module → vai trò được VÀO XEM (superadmin luôn được) ──────
export const MODULE_ACCESS: Record<string, Role[]> = {
  '/admin':         ['superadmin'],
  '/giam-doc':      ['superadmin', 'giamdoc'],
  '/md':            ['superadmin', 'giamdoc', 'md'],
  '/qa':            ['superadmin', 'giamdoc', 'md', 'qa'],
  '/to-truong-may': ['superadmin', 'giamdoc', 'md', 'totruongmay'],
  '/to-truong-cat': ['superadmin', 'giamdoc', 'md', 'totruongcat'],
  '/kho':           ['superadmin', 'giamdoc', 'md', 'kho', 'totruongcat'],
  '/ke-toan':       ['superadmin', 'giamdoc', 'ketoan'],
  '/subcon':        ['superadmin', 'giamdoc', 'md', 'subcon'],
  '/buyer':         ['superadmin', 'giamdoc', 'md', 'buyer'],
};

export function canAccess(role: Role, modulePath: string): boolean {
  if (role === 'superadmin') return true;
  const allowed = MODULE_ACCESS[modulePath];
  return allowed ? allowed.includes(role) : false;
}

// ── Đăng nhập: đối chiếu bảng users (Supabase → fallback mock) ─────────────
export async function login(username: string, password: string): Promise<User | null> {
  const { rows } = await fetchTable<User>('users');
  const u = rows.find(
    (x) => x.username === username.trim().toLowerCase() && x.password === password && x.active !== false,
  );
  return u ?? null;
}

// ── Session (localStorage — chạy trong app Next.js của bạn) ────────────────
export function saveSession(user: User): void {
  if (typeof window === 'undefined') return;
  const session: Session = { user, loginAt: new Date().toISOString() };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s?.user?.role ? s : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
}
