'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, PackagePlus } from 'lucide-react';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { createInbound } from './wh-actions';
import {
  inboundFormSchema,
  MATERIAL_CATEGORIES,
  CATEGORY_LABEL,
  UNITS,
  UNIT_LABEL,
  vnToday,
  type InboundFormValues,
  type PoOption,
} from './wh-schema';

function ErrMsg({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

export default function InboundFormDialog({
  open,
  onClose,
  onCreated,
  poOptions,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  poOptions: PoOption[];
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InboundFormValues>({
    resolver: zodResolver(inboundFormSchema),
    defaultValues: {
      material_code: '',
      material_name: '',
      category: 'FABRIC',
      unit: 'METERS',
      quantity: 0,
      received_date: vnToday(),
      order_id: '',
      reference_no: '',
      notes: '',
    },
  });

  // Mở lại phải là tờ giấy trắng, nhưng ngày nhập vẫn mặc định hôm nay
  useEffect(() => {
    if (open) reset({ received_date: vnToday(), category: 'FABRIC', unit: 'METERS', quantity: 0 });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const res = await createInbound(values);

    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof InboundFormValues, { type: 'server', message });
        }
      }
      toast.error('Không nhập kho được', { description: res.message });
      return;
    }

    toast.success('Đã nhập kho', { description: res.message });
    reset();
    onClose();
    await onCreated();
  });

  return (
    <Modal open={open} title="Phiếu nhập kho nguyên phụ liệu" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mã vải / NPL" hint="tự động viết HOA; mã đã có sẽ cộng dồn tồn">
            <input className={inputCls} placeholder="FB-TC65-NAVY" {...register('material_code')} />
            <ErrMsg>{errors.material_code?.message}</ErrMsg>
          </Field>

          <Field label="Tên vải / NPL">
            <input className={inputCls} placeholder="Vải TC 65/35 màu Navy" {...register('material_name')} />
            <ErrMsg>{errors.material_name?.message}</ErrMsg>
          </Field>

          <Field label="Loại NPL">
            <select className={inputCls} {...register('category')}>
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <ErrMsg>{errors.category?.message}</ErrMsg>
          </Field>

          <Field label="Đơn vị tính" hint="mã đã có thì phải giữ đúng đơn vị cũ">
            <select className={inputCls} {...register('unit')}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABEL[u]}
                </option>
              ))}
            </select>
            <ErrMsg>{errors.unit?.message}</ErrMsg>
          </Field>

          <Field label="Số lượng nhập" hint="lớn hơn 0, tối đa 2 số thập phân">
            <input
              className={inputCls}
              type="number"
              min={0.01}
              step={0.01}
              inputMode="decimal"
              {...register('quantity', { valueAsNumber: true })}
            />
            <ErrMsg>{errors.quantity?.message}</ErrMsg>
          </Field>

          <Field label="Ngày nhập" hint="không được ở tương lai">
            <input className={inputCls} type="date" max={vnToday()} {...register('received_date')} />
            <ErrMsg>{errors.received_date?.message}</ErrMsg>
          </Field>

          <Field label="PO tham chiếu" hint="để trống nếu nhập kho chung">
            <select className={inputCls} {...register('order_id')}>
              <option value="">— Không gắn PO —</option>
              {poOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.po_number} · {p.style_code} · {p.customer_name}
                </option>
              ))}
            </select>
            <ErrMsg>{errors.order_id?.message}</ErrMsg>
          </Field>

          <Field label="Số chứng từ / Invoice">
            <input className={inputCls} placeholder="INV-2026-0417" {...register('reference_no')} />
            <ErrMsg>{errors.reference_no?.message}</ErrMsg>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Ghi chú">
            <textarea
              className={`${inputCls} min-h-[76px] resize-y`}
              placeholder="Số cuộn, khổ vải, nhà cung cấp, kết quả kiểm 4-point..."
              {...register('notes')}
            />
            <ErrMsg>{errors.notes?.message}</ErrMsg>
          </Field>
        </div>

        {poOptions.length === 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
            Chưa có đơn hàng nào trong hệ thống nên danh sách PO tham chiếu đang trống. Tạo PO ở phân hệ
            Đơn hàng trước nếu cần gắn phiếu nhập vào đơn cụ thể.
          </p>
        )}

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
                <PackagePlus className="h-4 w-4" /> Lưu phiếu nhập
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
