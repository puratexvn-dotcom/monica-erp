// ============================================================================
// MONICA GARMENT ERP — RBAC: NGUỒN CHÂN LÝ DUY NHẤT
//
// File này KHÔNG import gì ngoài kiểu dữ liệu, để middleware chạy được trên
// Edge Runtime (nơi không có Node API).
//
// ─── VÌ SAO VAI TRÒ NẰM TRONG app_metadata ───────────────────────────────
// Supabase có hai chỗ chứa metadata của user:
//   • user_metadata — người dùng TỰ SỬA ĐƯỢC qua supabase.auth.updateUser()
//   • app_metadata  — chỉ sửa được bằng service_role key ở phía máy chủ
// Vai trò BẮT BUỘC nằm ở app_metadata. Nếu để ở user_metadata, bất kỳ ai
// đăng nhập cũng có thể tự nâng mình lên 'superadmin' bằng một lời gọi API.
//
// Ngược lại, cờ force_password_change lại CỐ Ý để ở user_metadata: sau khi
// đổi mật khẩu thành công, chính người dùng phải xoá được cờ đó mà không cần
// service_role key. Cờ này là chính sách vận hành, không phải hàng rào bảo
// mật — người dùng có tự tắt cũng vẫn phải biết mật khẩu mới đăng nhập được.
// ============================================================================

import type { Role } from '@/types/erp';

export type { Role };

/** Toàn bộ vai trò hợp lệ — dùng để kiểm tra dữ liệu đọc từ token */
export const ALL_ROLES: readonly Role[] = [
  'superadmin', 'giamdoc', 'md', 'qa', 'totruongmay',
  'totruongcat', 'hoanthanh', 'kho', 'ketoan', 'subcon', 'buyer',
] as const;

export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ALL_ROLES as readonly string[]).includes(v);
}

export const ROLE_LABEL: Record<Role, string> = {
  superadmin: 'Super Admin',
  giamdoc: 'Giám đốc',
  md: 'Merchandiser & Thu Mua',
  qa: 'QA / QC',
  totruongmay: 'Tổ trưởng May',
  totruongcat: 'Tổ trưởng Cắt',
  hoanthanh: 'Tổ Hoàn Thành',
  kho: 'Quản lý Kho',
  ketoan: 'Kế toán',
  subcon: 'Xưởng gia công',
  buyer: 'Khách hàng (Buyer)',
};

// ── MA TRẬN PHÂN QUYỀN ──────────────────────────────────────────────────────
// Nguyên tắc: mỗi vai trò CHỈ thấy phân hệ của bộ phận mình. superadmin là
// ngoại lệ duy nhất (quản trị hệ thống nên phải vào được mọi nơi).
//
// Giám đốc chỉ có /giam-doc vì bản thân trang đó đã là bảng tổng hợp toàn nhà
// máy — không cần mở thêm quyền vào từng phân hệ con. Nếu sau này ban giám đốc
// cần xem chi tiết, chỉ việc thêm route vào đúng dòng 'giamdoc' bên dưới.
export const MODULE_ACCESS: Record<Role, readonly string[]> = {
  superadmin: ['*'],
  giamdoc: ['/giam-doc'],
  md: ['/md', '/orders'],
  qa: ['/qa'],
  totruongcat: ['/to-truong-cat'],
  totruongmay: ['/to-truong-may'],
  hoanthanh: ['/hoan-thanh', '/to-truong-hoan-thanh'],
  kho: ['/kho', '/xuat-hang'],
  ketoan: ['/ke-toan'],
  subcon: ['/subcon'],
  buyer: ['/buyer'],
};

/** Trang đích ngay sau khi đăng nhập */
export const ROLE_HOME: Record<Role, string> = {
  superadmin: '/admin',
  giamdoc: '/giam-doc',
  md: '/md',
  qa: '/qa',
  totruongmay: '/to-truong-may',
  totruongcat: '/to-truong-cat',
  hoanthanh: '/hoan-thanh',
  kho: '/kho',
  ketoan: '/ke-toan',
  subcon: '/subcon',
  buyer: '/buyer',
};

/**
 * Mọi route thuộc khu vực nội bộ. Bất cứ đường dẫn nào bắt đầu bằng một trong
 * các tiền tố này đều phải đăng nhập mới vào được.
 *
 * Danh sách này là DANH SÁCH TRẮNG NGƯỢC: middleware chặn theo nguyên tắc
 * "mặc định cấm" — route lạ không nằm ở đây vẫn bị đòi đăng nhập.
 */
export const PROTECTED_PREFIXES: readonly string[] = [
  '/admin', '/giam-doc', '/md', '/orders', '/qa', '/to-truong-cat',
  '/to-truong-may', '/to-truong-hoan-thanh', '/hoan-thanh', '/kho',
  '/xuat-hang', '/ke-toan', '/subcon', '/buyer',
];

/** Route ai cũng vào được, kể cả khi chưa đăng nhập */
export const PUBLIC_PATHS: readonly string[] = ['/', '/login', '/unauthorized'];

/** Khớp tiền tố nhưng phải trọn một đoạn đường dẫn:
 *  '/kho' khớp '/kho' và '/kho/abc', KHÔNG khớp '/kho-thanh-pham'. */
function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix + '/');
}

export function isProtectedPath(path: string): boolean {
  return PROTECTED_PREFIXES.some((p) => matchesPrefix(path, p));
}

export function canAccess(role: Role | null | undefined, path: string): boolean {
  if (!role) return false;
  const allowed = MODULE_ACCESS[role];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.some((p) => matchesPrefix(path, p));
}

/** Danh sách route mà vai trò này được vào — dùng để dựng menu */
export function allowedModules(role: Role | null | undefined): readonly string[] {
  if (!role) return [];
  const allowed = MODULE_ACCESS[role];
  if (!allowed) return [];
  return allowed.includes('*') ? PROTECTED_PREFIXES : allowed;
}
