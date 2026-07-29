// ============================================================================
// MONICA GARMENT ERP — Danh sách nhân sự đọc từ profiles + user_roles
//
// Bảng `users` cũ (lưu mật khẩu dạng chữ thường) đã bị xoá trong migration 010.
// Nguồn dữ liệu nhân sự nay gồm ba mảnh:
//   • auth.users      — email và thông tin đăng nhập, KHÔNG truy cập được từ
//                       trình duyệt; chỉ đọc bằng service_role phía máy chủ.
//   • public.profiles — họ tên, mã nhân viên, phòng ban, trạng thái khoá
//   • public.user_roles -> public.roles — vai trò
//
// Vì email nằm ở schema `auth` mà trình duyệt không với tới, phần hiển thị
// email được lấy qua Server Action (xem app/(dashboard)/admin/actions.ts).
// Hàm ở file này chỉ đọc phần công khai trong schema `public`.
// ============================================================================

import { getSupabase } from '@/lib/supabase';
import { isRole } from '@/lib/rbac';
import type { Role } from '@/types/erp';

export interface Staff {
  id: string;
  fullName: string;
  employeeCode: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  role: Role | null;
  isActive: boolean;
  /** Chữ cái viết tắt cho avatar tròn */
  avatar: string;
  /** Chỉ có khi đọc qua Server Action (email nằm ở schema auth) */
  email?: string | null;
}

export interface StaffResult {
  rows: Staff[];
  /** Thông báo lỗi thân thiện, null nếu đọc thành công */
  error: string | null;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  // Tiếng Việt: tên gọi nằm cuối, họ nằm đầu
  return (parts[parts.length - 1][0] + parts[0][0]).toUpperCase();
}

// Supabase trả quan hệ lồng nhau khi thì là object, khi thì là mảng, tuỳ cách
// suy luận khoá ngoại. Chuẩn hoá về một dạng để phần dưới khỏi phải phân nhánh.
function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v.length > 0 ? v[0] : null;
  return v ?? null;
}

interface DepartmentRow {
  code: string | null;
  name: string | null;
}
interface RoleRow {
  code: string | null;
}
interface UserRoleRow {
  roles: RoleRow | RoleRow[] | null;
}
interface ProfileRow {
  id: string;
  full_name: string | null;
  employee_code: string | null;
  is_active: boolean | null;
  departments: DepartmentRow | DepartmentRow[] | null;
  user_roles: UserRoleRow[] | null;
}

/**
 * Đọc toàn bộ nhân sự. KHÔNG rơi về mock như fetchTable: danh sách tài khoản
 * mà hiển thị dữ liệu giả thì người quản trị có thể khoá nhầm hoặc xoá nhầm
 * người không tồn tại. Lỗi thì trả về danh sách rỗng kèm thông báo rõ ràng.
 */
export async function fetchStaff(): Promise<StaffResult> {
  try {
    const { data, error } = await getSupabase()
      .from('profiles')
      .select(
        'id, full_name, employee_code, is_active, departments ( code, name ), user_roles ( roles ( code ) )',
      )
      .order('employee_code', { ascending: true });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('jwt') || msg.includes('401') || msg.includes('unauthor')) {
        return { rows: [], error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' };
      }
      return { rows: [], error: `Không đọc được danh sách nhân sự: ${error.message}` };
    }

    const rows: Staff[] = (data ?? []).map((r) => {
      const p = r as unknown as ProfileRow;
      const dept = one(p.departments);
      const roleCode = one(p.user_roles)?.roles;
      const code = one(roleCode)?.code ?? null;
      const fullName = p.full_name?.trim() || '(chưa đặt tên)';

      return {
        id: p.id,
        fullName,
        employeeCode: p.employee_code,
        departmentCode: dept?.code ?? null,
        departmentName: dept?.name ?? null,
        role: isRole(code) ? code : null,
        isActive: p.is_active !== false,
        avatar: initials(fullName),
      };
    });

    return { rows, error: null };
  } catch (e) {
    return {
      rows: [],
      error: e instanceof Error ? e.message : 'Không kết nối được máy chủ dữ liệu.',
    };
  }
}
