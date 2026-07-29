import { z } from 'zod';

import { ALL_ROLES } from '@/lib/rbac';
import type { Role } from '@/types/erp';

// ============================================================================
// Lược đồ dùng CHUNG cho client (React Hook Form) và server (Server Action).
//
// Khai báo một lần để hai phía không bao giờ lệch luật: nếu chỉ validate ở
// client thì bất kỳ ai gọi thẳng Server Action cũng bỏ qua được toàn bộ ràng
// buộc — Server Action là endpoint HTTP công khai, không phải hàm nội bộ.
// ============================================================================

/** ALL_ROLES là readonly Role[]; z.enum cần tuple không rỗng nên phải ép kiểu. */
const roleEnum = z.enum(ALL_ROLES as unknown as [Role, ...Role[]]);

export const staffFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email')
    .email('Email không đúng định dạng')
    .toLowerCase(),
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(255, 'Họ tên quá dài'),
  employeeCode: z
    .string()
    .trim()
    .max(50, 'Mã nhân viên quá dài')
    .optional()
    .or(z.literal('')),
  role: roleEnum,
  password: z
    .string()
    .min(10, 'Mật khẩu khởi tạo phải từ 10 ký tự')
    .max(72, 'Mật khẩu quá dài'),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;

export const resetPasswordSchema = z.object({
  userId: z.string().uuid('Mã người dùng không hợp lệ'),
  password: z.string().min(10, 'Mật khẩu mới phải từ 10 ký tự').max(72, 'Mật khẩu quá dài'),
});

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
