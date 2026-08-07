'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, PackagePlus } from 'lucide-react';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { createOrder } from './actions';
import {
  poFormSchema,
  PO_STATUSES,
  PO_STATUS_LABEL,
  CURRENCIES,
  CURRENCY_LABEL,
  vnToday,
  type PoFormValues,
} from './po-schema';

function ErrMsg({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

export default function PoFormDialog({
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
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PoFormValues>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      po_number: '',
      customer_name: '',
      style_code: '',
      total_quantity: 0,
      delivery_date: '',
      currency: 'USD',
      // ⛔ KHÔNG đặt 0: `0` là *"giá bằng không"*, ⛔ không phải *"chưa chốt
      // giá"*. Để trống ⇒ ghi `null` ⇒ báo cáo hiện ⚪ **chưa đo được**.
      unit_price: undefined,
      status: 'APPROVED',
    },
  });

  // Mở lại hộp thoại phải là tờ giấy trắng, không giữ dữ liệu lần nhập trước
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const res = await createOrder(values);

    if (!res.ok) {
      // Máy chủ có thể bắt lỗi mà client không biết trước (vd: trùng mã PO)
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof PoFormValues, { type: 'server', message });
        }
      }
      toast.error('Không tạo được đơn hàng', { description: res.message });
      return;
    }

    toast.success('Đã tạo đơn hàng', { description: res.message });
    reset();
    onClose();
    await onCreated();
  });

  return (
    <Modal open={open} title="Tạo đơn hàng mới (PO)" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mã PO" hint="tự động viết HOA">
            <input className={inputCls} placeholder="PO-2026-001" {...register('po_number')} />
            <ErrMsg>{errors.po_number?.message}</ErrMsg>
          </Field>

          <Field label="Mã khách hàng / Tên khách">
            <input className={inputCls} placeholder="NORDIC EU" {...register('customer_name')} />
            <ErrMsg>{errors.customer_name?.message}</ErrMsg>
          </Field>

          <Field label="Style (mã hàng)">
            <input className={inputCls} placeholder="JACKET-WINTER-01" {...register('style_code')} />
            <ErrMsg>{errors.style_code?.message}</ErrMsg>
          </Field>

          <Field label="Số lượng (pcs)">
            <input
              className={inputCls}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              {...register('total_quantity', { valueAsNumber: true })}
            />
            <ErrMsg>{errors.total_quantity?.message}</ErrMsg>
          </Field>

          {/* 🔴 THÊM 07/08/2026 — trước đó biểu mẫu ⛔ KHÔNG có ô nào nhập
              giá trị thương mại của đơn, nên mọi PO do người dùng lập đều
              ⛔ không tính được doanh thu. Xem `po-schema.ts`. */}
          <Field label="Tiền tệ">
            <select className={inputCls} {...register('currency')}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABEL[c]}
                </option>
              ))}
            </select>
            <ErrMsg>{errors.currency?.message}</ErrMsg>
          </Field>

          <Field label="Đơn giá (mỗi sản phẩm)" hint="để trống nếu chưa chốt giá">
            <input
              className={inputCls}
              type="number"
              min={0}
              step="0.0001"
              inputMode="decimal"
              placeholder="2.4750"
              // Ô trống phải thành `undefined`, ⛔ KHÔNG thành `NaN`:
              // `valueAsNumber` biến '' thành `NaN` và Zod báo *"Đơn giá phải
              // là số"* ngay khi người dùng ⛔ không định nhập gì.
              {...register('unit_price', {
                setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)),
              })}
            />
            <ErrMsg>{errors.unit_price?.message}</ErrMsg>
          </Field>

          <Field label="Ngày giao" hint="không được ở quá khứ">
            <input className={inputCls} type="date" min={vnToday()} {...register('delivery_date')} />
            <ErrMsg>{errors.delivery_date?.message}</ErrMsg>
          </Field>

          <Field label="Trạng thái">
            <select className={inputCls} {...register('status')}>
              {PO_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PO_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <ErrMsg>{errors.status?.message}</ErrMsg>
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={isSubmitting}>
            Hủy
          </button>
          <button type="submit" className={btnPrimary} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <PackagePlus className="h-4 w-4" /> Tạo đơn hàng
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
