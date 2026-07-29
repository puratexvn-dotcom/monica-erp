'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { ROLE_LABEL, ALL_ROLES } from '@/lib/rbac';
import { createStaffAccount } from './actions';
import { staffFormSchema, type StaffFormValues } from './staff-schema';

function ErrMsg({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

export default function StaffFormDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: { email: '', fullName: '', employeeCode: '', role: 'md', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await createStaffAccount({
      email: values.email,
      fullName: values.fullName,
      role: values.role,
      employeeCode: values.employeeCode || undefined,
      password: values.password,
    });

    if (!res.ok) {
      toast.error('Không tạo được tài khoản', { description: res.message });
      return;
    }

    toast.success('Đã tạo tài khoản', { description: res.message });
    reset();
    onClose();
    await onCreated();
  });

  return (
    <Modal open={open} title="Tạo tài khoản mới" onClose={onClose} wide>
      {/* noValidate: để Zod báo lỗi tiếng Việt thay vì bong bóng mặc định của trình duyệt */}
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email công ty" hint="dùng để đăng nhập">
            <input className={inputCls} type="email" autoComplete="off" {...register('email')} />
            <ErrMsg>{errors.email?.message}</ErrMsg>
          </Field>

          <Field label="Mã nhân viên">
            <input className={inputCls} placeholder="WH-003" {...register('employeeCode')} />
            <ErrMsg>{errors.employeeCode?.message}</ErrMsg>
          </Field>

          <Field label="Họ tên hiển thị">
            <input className={inputCls} {...register('fullName')} />
            <ErrMsg>{errors.fullName?.message}</ErrMsg>
          </Field>

          <Field label="Vai trò">
            <select className={inputCls} {...register('role')}>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <ErrMsg>{errors.role?.message}</ErrMsg>
          </Field>

          <Field label="Mật khẩu khởi tạo" hint="tối thiểu 10 ký tự">
            <input className={inputCls} autoComplete="new-password" {...register('password')} />
            <ErrMsg>{errors.password?.message}</ErrMsg>
          </Field>
        </div>

        <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-[11px] leading-relaxed text-indigo-800">
          Tài khoản tạo qua Supabase Auth, mật khẩu lưu dạng băm. Hệ thống tự bật cờ buộc đổi mật khẩu ở
          lần đăng nhập đầu, nên mật khẩu khởi tạo chỉ sống đúng một phiên. Gửi riêng cho từng người.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={isSubmitting}>
            Hủy
          </button>
          <button type="submit" className={btnPrimary} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Tạo tài khoản
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
