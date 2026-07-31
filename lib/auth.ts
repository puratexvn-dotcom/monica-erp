// ============================================================================
// MONICA MOS — Lớp tương thích cho session phía client
//
// TRƯỚC ĐÂY file này tự làm xác thực: đọc bảng `users`, SO SÁNH MẬT KHẨU DẠNG
// CHỮ THƯỜNG, rồi nhét cả người dùng vào localStorage. Ba lỗ hổng cùng lúc:
//   • Mật khẩu lưu thô, ai đọc được bảng là có toàn bộ tài khoản.
//   • Phiên nằm ở localStorage — chỉ cần sửa một dòng trong DevTools là tự
//     phong mình làm superadmin, máy chủ không hề hay biết.
//   • Máy chủ không xác thực gì cả, mọi kiểm tra đều nằm ở trình duyệt.
//
// NAY: Supabase Auth giữ phiên trong cookie có chữ ký, máy chủ xác thực lại
// từng request qua middleware. File này chỉ còn là lớp mỏng để các màn hình
// cũ (sidebar, admin, md, buyer, ke-toan) tiếp tục biên dịch được.
//
// Vai trò LUÔN đọc từ app_metadata — xem giải thích trong lib/rbac.ts.
// ============================================================================

import type { Role } from '@/types/erp';
import { createClient } from '@/utils/supabase/client';
import { isRole } from '@/lib/rbac';

export type { Role };
export {
  ROLE_LABEL,
  ROLE_HOME,
  MODULE_ACCESS,
  canAccess,
  allowedModules,
  isRole,
} from '@/lib/rbac';

export interface SessionUser {
  id: string;
  email: string;
  /** Phần trước dấu @ của email — giữ tên cũ để màn hình admin không phải sửa */
  username: string;
  name: string;
  /** Chữ cái viết tắt hiển thị trên avatar tròn */
  avatar: string;
  role: Role;
  /**
   * Ràng buộc phạm vi dữ liệu cho tài khoản đối tác, lấy từ user_metadata.
   * Chỉ dùng để LỌC HIỂN THỊ cho tiện — không được coi là hàng rào bảo mật,
   * vì user_metadata do chính người dùng sửa được. Muốn chặn thật thì phải
   * viết RLS policy so khớp auth.uid() ở phía Supabase.
   */
  buyer_brand?: string | null;
  subcon_id?: string | null;
}

export interface Session {
  user: SessionUser;
  loginAt: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  // Tiếng Việt viết họ trước tên, tên gọi nằm ở cuối => lấy chữ cái cuối trước
  return (parts[parts.length - 1][0] + parts[0][0]).toUpperCase();
}

/**
 * Đọc phiên hiện tại từ Supabase (bất đồng bộ — khác hẳn bản localStorage cũ
 * vốn trả về ngay lập tức). Trả về null nếu chưa đăng nhập hoặc chưa có vai trò.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const role = user.app_metadata?.role;
  if (!isRole(role)) return null;

  const meta = user.user_metadata ?? {};
  const name = typeof meta.full_name === 'string' && meta.full_name ? meta.full_name : (user.email ?? 'Người dùng');
  const email = user.email ?? '';

  return {
    user: {
      id: user.id,
      email,
      username: email.split('@')[0] || user.id.slice(0, 8),
      name,
      avatar: initials(name),
      role,
      buyer_brand: typeof meta.buyer_brand === 'string' ? meta.buyer_brand : null,
      subcon_id: typeof meta.subcon_id === 'string' ? meta.subcon_id : null,
    },
    loginAt: user.last_sign_in_at ?? new Date().toISOString(),
  };
}

/** Đăng xuất thật sự: huỷ phiên ở máy chủ rồi mới rời trang.
 *  Bản cũ chỉ xoá localStorage — token vẫn còn hiệu lực. */
export async function clearSession(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') window.location.assign('/login');
}
