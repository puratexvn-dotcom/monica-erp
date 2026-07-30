'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import type { z } from 'zod';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { createCustomerFull } from '@/app/(dashboard)/md/_actions/commercial.actions';
import {
  customerFormSchema, CURRENCIES, CURRENCY_LABEL, INCOTERMS, INCOTERM_LABEL,
  type CustomerFormValues,
} from '@/schemas/md';

// ============================================================================
// FORM KHÁCH HÀNG (BẢN ĐẦY ĐỦ CHO CRM 360°)
//
// Khác form khách hàng cũ ở chỗ hỏi thêm phần THƯƠNG MẠI: đồng tiền, điều kiện
// giao hàng, điều khoản thanh toán, hạn mức công nợ. Bốn thứ này quyết định
// cách lập hoá đơn và mức rủi ro công nợ — thiếu chúng thì kế toán phải đi hỏi
// lại từng đơn một.
// ============================================================================

type Input = z.input<typeof customerFormSchema>;

const DEFAULTS: Input = {
  customer_code: '', name: '', brand: '', buyer_group: '', contact_person: '',
  phone: '', email: '', country: '', address: '', tax_code: '',
  currency: 'USD', incoterm: 'FOB', payment_term: '', credit_limit: undefined, notes: '',
};

function Err({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

export default function CustomerFormDialog({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const { register, formState, reset, setError, handleSubmit } = useForm<Input, unknown, CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const res = await createCustomerFull(values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof Input, { type: 'server', message });
        }
      }
      toast.error('Không tạo được khách hàng', { description: res.message });
      return;
    }
    toast.success('Đã tạo khách hàng', { description: res.message });
    reset(DEFAULTS);
    onClose();
    await onCreated();
  });

  return (
    <Modal open={open} title="Thêm khách hàng" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mã khách hàng" hint="tự chuyển in hoa">
            <input className={inputCls} placeholder="KH-001" {...register('customer_code')} />
            <Err>{formState.errors.customer_code?.message}</Err>
          </Field>

          <Field label="Tên khách hàng">
            <input className={inputCls} placeholder="Uniqlo Vietnam Co., Ltd" {...register('name')} />
            <Err>{formState.errors.name?.message}</Err>
          </Field>

          <Field label="Thương hiệu">
            <input className={inputCls} placeholder="Uniqlo" {...register('brand')} />
            <Err>{formState.errors.brand?.message}</Err>
          </Field>

          <Field label="Tập đoàn / Nhóm mua">
            <input className={inputCls} placeholder="Fast Retailing" {...register('buyer_group')} />
            <Err>{formState.errors.buyer_group?.message}</Err>
          </Field>

          <Field label="Người liên hệ chính">
            <input className={inputCls} {...register('contact_person')} />
            <Err>{formState.errors.contact_person?.message}</Err>
          </Field>

          <Field label="Quốc gia">
            <input className={inputCls} placeholder="Nhật Bản" {...register('country')} />
            <Err>{formState.errors.country?.message}</Err>
          </Field>

          <Field label="Điện thoại">
            <input className={inputCls} inputMode="tel" {...register('phone')} />
            <Err>{formState.errors.phone?.message}</Err>
          </Field>

          <Field label="Email">
            <input className={inputCls} type="email" {...register('email')} />
            <Err>{formState.errors.email?.message}</Err>
          </Field>

          <Field label="Đồng tiền giao dịch">
            <select className={inputCls} {...register('currency')}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{CURRENCY_LABEL[c]}</option>
              ))}
            </select>
            <Err>{formState.errors.currency?.message}</Err>
          </Field>

          <Field label="Điều kiện giao hàng mặc định">
            <select className={inputCls} {...register('incoterm')}>
              {INCOTERMS.map((i) => (
                <option key={i} value={i}>{INCOTERM_LABEL[i]}</option>
              ))}
            </select>
            <Err>{formState.errors.incoterm?.message}</Err>
          </Field>

          <Field label="Điều khoản thanh toán">
            <input className={inputCls} placeholder="T/T 30 ngày sau B/L" {...register('payment_term')} />
            <Err>{formState.errors.payment_term?.message}</Err>
          </Field>

          <Field label="Hạn mức công nợ" hint="theo đồng tiền giao dịch ở trên">
            <input
              className={inputCls}
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              {...register('credit_limit', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.credit_limit?.message}</Err>
          </Field>

          <Field label="Mã số thuế">
            <input className={inputCls} {...register('tax_code')} />
            <Err>{formState.errors.tax_code?.message}</Err>
          </Field>

          <Field label="Địa chỉ">
            <input className={inputCls} {...register('address')} />
            <Err>{formState.errors.address?.message}</Err>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Ghi chú">
            <textarea className={`${inputCls} min-h-[60px] resize-y`} {...register('notes')} />
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
              : <><Plus className="h-4 w-4" /> Thêm khách hàng</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
