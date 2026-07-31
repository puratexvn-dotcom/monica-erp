// ============================================================================
// MONICA MOS — RBAC: NGUỒN CHÂN LÝ DUY NHẤT
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
  // Ba vai trò chuyên trách của kho (migration 017). Vai trò `kho` cũ GIỮ
  // NGUYÊN là Quản lý Kho — mọi tài khoản đang có vẫn đăng nhập bình thường.
  'khotruong', 'thukho', 'ketoanvattu',
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
  khotruong: 'Tổ trưởng Kho',
  thukho: 'Thủ kho',
  ketoanvattu: 'Kế toán vật tư',
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
  // Giám đốc xem được cả danh sách PO: /giam-doc là bảng tổng hợp, còn
  // /orders là chi tiết từng đơn — hai thứ bổ sung cho nhau.
  giamdoc: ['/giam-doc', '/orders'],
  md: ['/md', '/orders'],
  qa: ['/qa'],
  totruongcat: ['/to-truong-cat'],
  totruongmay: ['/to-truong-may'],
  hoanthanh: ['/hoan-thanh', '/to-truong-hoan-thanh'],
  kho: ['/kho', '/xuat-hang'],
  ketoan: ['/ke-toan'],
  subcon: ['/subcon'],
  buyer: ['/buyer'],
  // Ba vai trò kho cùng vào /kho; phân biệt việc ai được LÀM GÌ nằm ở tầng
  // hành động (xem WH_PERMISSIONS bên dưới), không nằm ở quyền vào route.
  // Chặn ở route thì tổ trưởng và thủ kho phải có hai màn hình khác nhau —
  // vô lý vì họ đứng cạnh nhau xử lý cùng một lô hàng.
  khotruong: ['/kho', '/xuat-hang'],
  thukho: ['/kho'],
  ketoanvattu: ['/kho', '/ke-toan'],
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
  khotruong: '/kho',
  thukho: '/kho',
  ketoanvattu: '/kho',
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

// ============================================================================
// QUYỀN THAO TÁC TRONG PHÂN HỆ KHO
//
// Vào được /kho là một chuyện, được BẤM NÚT nào lại là chuyện khác. Thủ kho
// nhận hàng và soạn hàng hằng ngày nhưng không được tự điều chỉnh tồn kho —
// đó là thao tác dễ bị lạm dụng nhất trong kho. Kế toán vật tư ngược lại:
// xem và duyệt được, nhưng không đụng vào hàng thật.
//
// ⚠️ Đây là LỚP CHẶN THỨ HAI, không phải hàng rào duy nhất. Hàng rào thật vẫn
// là RLS của cơ sở dữ liệu; kiểm ở đây để giao diện không mời người dùng bấm
// vào thứ chắc chắn sẽ bị từ chối.
// ============================================================================

export const WH_ACTIONS = [
  'receive',    // nhận hàng về kho
  'inspect',    // chấm điểm QA
  'putaway',    // cất vào vị trí
  'reserve',    // giữ chỗ cho đơn hàng
  'pick',       // soạn hàng
  'issue',      // xuất kho
  'transfer',   // chuyển kho
  'adjust',     // điều chỉnh tồn
  'count',      // kiểm kê
  'scrap',      // huỷ / phế liệu
  'valuate',    // định giá, khoá sổ
] as const;
export type WhAction = (typeof WH_ACTIONS)[number];

export const WH_ACTION_LABEL: Record<WhAction, string> = {
  receive: 'Nhận hàng',
  inspect: 'Kiểm hàng QA',
  putaway: 'Cất vào vị trí',
  reserve: 'Giữ chỗ',
  pick: 'Soạn hàng',
  issue: 'Xuất kho',
  transfer: 'Chuyển kho',
  adjust: 'Điều chỉnh tồn',
  count: 'Kiểm kê',
  scrap: 'Huỷ / phế liệu',
  valuate: 'Định giá tồn kho',
};

const ALL_WH: readonly WhAction[] = WH_ACTIONS;

export const WH_PERMISSIONS: Partial<Record<Role, readonly WhAction[]>> = {
  superadmin: ALL_WH,
  kho: ALL_WH,
  khotruong: ALL_WH,
  // Thủ kho: làm mọi việc chân tay với hàng, KHÔNG được điều chỉnh tồn, huỷ
  // hàng hay định giá — ba thao tác đổi số mà không đổi hàng thật.
  thukho: ['receive', 'putaway', 'pick', 'issue', 'transfer', 'count'],
  // QA chỉ chấm điểm, không đụng tới hàng
  qa: ['inspect'],
  // Kế toán vật tư: xem, đối chiếu kiểm kê, định giá. Không cấp phát hàng.
  ketoanvattu: ['count', 'valuate'],
  ketoan: ['valuate'],
};

/** Vai trò này có được làm thao tác kho đó không */
export function canDoWh(role: Role | null | undefined, action: WhAction): boolean {
  if (!role) return false;
  return (WH_PERMISSIONS[role] ?? []).includes(action);
}
