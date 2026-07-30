'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import type { z } from 'zod';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { addContact } from '@/app/(dashboard)/md/_actions/commercial.actions';
import { customerContactSchema, type CustomerContactValues } from '@/schemas/md';

// ============================================================================
// THÊM NGƯỜI LIÊN HỆ CỦA KHÁCH HÀNG
//
// Một khách hàng thường có nhiều đầu mối: người mua hàng, người kỹ thuật,
// người chất lượng. Gửi bảng màu cho người phụ trách chứng từ là mất một vòng
// email — đó là lý do bảng này tách riêng khỏi ô "người liên hệ chính".
// ============================================================================

type Input = z.input<typeof customerContactSchema>;

function Err({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

export default function ContactFormDialog({
  open, customerId, customerName, onClose, onCreated,
}: {
  open: boolean;
  customerId: string | null;
  customerName: string;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const defaults: Input = {
    customer_id: customerId ?? '',
    full_name: '', job_title: '', department: '', email: '', phone: '',
    is_primary: false, notes: '',
  };

  const { register, formState, reset, setError, handleSubmit } =
    useForm<Input, unknown, CustomerContactValues>({
      resolver: zodResolver(customerContactSchema),
      defaultValues: defaults,
    });

  // customer_id đến từ dòng đang mở, không phải người dùng gõ — nạp lại mỗi
  // lần mở để không lưu nhầm liên hệ sang khách hàng vừa xem trước đó.
  useEffect(() => {
    if (open) reset({ ...defaults, customer_id: customerId ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customerId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const res = await addContact(values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof Input, { type: 'server', message });
        }
      }
      toast.error('Không thêm được người liên hệ', { description: res.message });
      return;
    }
    toast.success('Đã thêm người liên hệ', { description: res.message });
    onClose();
    await onCreated();
  });

  return (
    <Modal open={open} title={`Thêm người liên hệ — ${customerName}`} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <input type="hidden" {...register('customer_id')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Họ tên">
            <input className={inputCls} {...register('full_name')} />
            <Err>{formState.errors.full_name?.message}</Err>
          </Field>

          <Field label="Chức danh">
            <input className={inputCls} placeholder="Merchandiser" {...register('job_title')} />
            <Err>{formState.errors.job_title?.message}</Err>
          </Field>

          <Field label="Bộ phận">
            <input className={inputCls} placeholder="Thu mua" {...register('department')} />
            <Err>{formState.errors.department?.message}</Err>
          </Field>

          <Field label="Email">
            <input className={inputCls} type="email" {...register('email')} />
            <Err>{formState.errors.email?.message}</Err>
          </Field>

          <Field label="Điện thoại">
            <input className={inputCls} inputMode="tel" {...register('phone')} />
            <Err>{formState.errors.phone?.message}</Err>
          </Field>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register('is_primary')} />
          Đây là đầu mối chính
        </label>
        <p className="mt-1 text-[11px] text-slate-400">
          Chọn ô này sẽ tự bỏ đánh dấu đầu mối chính của những người còn lại — mỗi khách hàng
          chỉ có đúng một đầu mối chính.
        </p>

        <div className="mt-3">
          <Field label="Ghi chú">
            <input className={inputCls} {...register('notes')} />
            <Err>{formState.errors.notes?.message}</Err>
          </Field>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={formState.isSubmitting}>
            Hủy
          </button>
          <button type="submit" className={btnPrimary} disabled={formState.isSubmitting}>
            {formState.isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
              : <><Plus className="h-4 w-4" /> Thêm liên hệ</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
