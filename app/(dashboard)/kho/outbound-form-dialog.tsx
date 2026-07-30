'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, PackageMinus, TriangleAlert } from 'lucide-react';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { createOutbound } from './wh-actions';
import {
  outboundFormSchema,
  vnToday,
  type MaterialRow,
  type OutboundFormValues,
  type PoOption,
} from './wh-schema';

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

function ErrMsg({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

export default function OutboundFormDialog({
  open,
  onClose,
  onCreated,
  materials,
  poOptions,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  materials: MaterialRow[];
  poOptions: PoOption[];
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OutboundFormValues>({
    resolver: zodResolver(outboundFormSchema),
    defaultValues: {
      material_id: '',
      quantity: 0,
      issued_date: vnToday(),
      order_id: '',
      reference_no: '',
      notes: '',
    },
  });

  const [selectedId, setSelectedId] = useState('');
  const watchedId = watch('material_id');

  useEffect(() => {
    setSelectedId(watchedId ?? '');
  }, [watchedId]);

  useEffect(() => {
    if (open) reset({ issued_date: vnToday(), quantity: 0, material_id: '', order_id: '' });
  }, [open, reset]);

  // Hiện tồn hiện tại của mã đang chọn để người lập phiếu biết trần được xuất,
  // thay vì gõ số rồi mới bị máy chủ từ chối.
  const selected = useMemo(
    () => materials.find((m) => m.id === selectedId) ?? null,
    [materials, selectedId],
  );

  const onSubmit = handleSubmit(async (values) => {
    const res = await createOutbound(values);

    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof OutboundFormValues, { type: 'server', message });
        }
      }
      toast.error('Không xuất kho được', { description: res.message });
      return;
    }

    toast.success('Đã xuất kho', { description: res.message });
    reset();
    onClose();
    await onCreated();
  });

  const noStock = materials.length === 0;

  return (
    <Modal open={open} title="Phiếu xuất kho cấp phát sản xuất" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        {noStock ? (
          <p className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            Chưa có mã vật tư nào trong kho. Lập phiếu nhập trước khi xuất.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Mã vật tư cần xuất" hint="chọn từ danh mục đang có tồn">
                <select className={inputCls} {...register('material_id')}>
                  <option value="">— Chọn mã vật tư —</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.material_code} · {m.name} (còn {nf.format(Number(m.stock_qty))} {m.unit})
                    </option>
                  ))}
                </select>
                <ErrMsg>{errors.material_id?.message}</ErrMsg>
              </Field>

              <Field
                label="Số lượng xuất"
                hint={
                  selected
                    ? `tối đa ${nf.format(Number(selected.stock_qty))} ${selected.unit}`
                    : 'chọn mã vật tư trước'
                }
              >
                <input
                  className={inputCls}
                  type="number"
                  min={0.01}
                  step={0.01}
                  max={selected ? Number(selected.stock_qty) : undefined}
                  inputMode="decimal"
                  {...register('quantity', { valueAsNumber: true })}
                />
                <ErrMsg>{errors.quantity?.message}</ErrMsg>
              </Field>

              <Field label="Ngày xuất" hint="không được ở tương lai">
                <input className={inputCls} type="date" max={vnToday()} {...register('issued_date')} />
                <ErrMsg>{errors.issued_date?.message}</ErrMsg>
              </Field>

              <Field label="Cấp phát cho PO" hint="bắt buộc, để tính định mức tiêu hao">
                <select className={inputCls} {...register('order_id')}>
                  <option value="">— Chọn đơn hàng —</option>
                  {poOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.po_number} · {p.style_code} · {p.customer_name}
                    </option>
                  ))}
                </select>
                <ErrMsg>{errors.order_id?.message}</ErrMsg>
              </Field>

              <Field label="Số phiếu xuất">
                <input className={inputCls} placeholder="PX-2026-0417" {...register('reference_no')} />
                <ErrMsg>{errors.reference_no?.message}</ErrMsg>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Ghi chú">
                <textarea
                  className={`${inputCls} min-h-[76px] resize-y`}
                  placeholder="Cấp cho bàn cắt số mấy, ca nào, người nhận..."
                  {...register('notes')}
                />
                <ErrMsg>{errors.notes?.message}</ErrMsg>
              </Field>
            </div>

            {poOptions.length === 0 && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                Chưa có đơn hàng nào nên không thể lập phiếu xuất. Tạo PO ở phân hệ Đơn hàng trước.
              </p>
            )}
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={isSubmitting}>
            Hủy
          </button>
          <button
            type="submit"
            className={btnPrimary}
            disabled={isSubmitting || noStock || poOptions.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <PackageMinus className="h-4 w-4" /> Lưu phiếu xuất
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
