'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus, Save } from 'lucide-react';
import type { z } from 'zod';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { createInquiry } from '@/app/(dashboard)/md/_actions/commercial.actions';
import { updateInquiry } from '@/app/(dashboard)/md/_actions/revisions.actions';
import { useSuaChungTu, oChu, oSo, oNgay } from '@/app/(dashboard)/md/use-sua-chung-tu';
import {
  inquiryFormSchema, vnToday,
  CURRENCIES, CURRENCY_LABEL, ORDER_TYPES, ORDER_TYPE_LABEL,
  INQUIRY_STATUSES, INQUIRY_STATUS_LABEL,
  type InquiryFormValues,
} from '@/schemas/md';

// ============================================================================
// FORM YÊU CẦU BÁO GIÁ
//
// Hạn chót báo giá là ô quan trọng nhất ở đây: trễ hạn thì khách chuyển đơn
// sang nhà máy khác, mà đây lại là ô hay bị bỏ trống nhất. Lược đồ đã chặn
// trường hợp hạn chót đứng trước ngày nhận yêu cầu.
// ============================================================================

type Input = z.input<typeof inquiryFormSchema>;

function Err({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

/** 🔴 Hai chế độ — `suaId` khác `null` ⇒ **Sửa** *(Board `BUG-5`, 07/08/2026)*.
 *  Lý lẽ vì sao một tệp hai chế độ: xem `customer-form-dialog.tsx`. */
export default function InquiryFormDialog({
  open, customers, onClose, onCreated, suaId,
}: {
  open: boolean;
  customers: ReadonlyArray<{ id: string; customer_code: string; name: string }>;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  suaId?: string | null;
}) {
  const sua = useSuaChungTu('INQUIRY', open, suaId);

  const defaults: Input = {
    inquiry_no: '', customer_id: '', season_id: '', product_name: '', description: '',
    expected_qty: undefined, target_price: undefined, currency: 'USD', order_type: 'FOB',
    received_date: vnToday(), due_date: '', status: 'NEW', notes: '',
  };

  const { register, formState, reset, setError, handleSubmit } =
    useForm<Input, unknown, InquiryFormValues>({
      resolver: zodResolver(inquiryFormSchema),
      defaultValues: defaults,
    });

  useEffect(() => {
    if (!open) return;
    if (sua.laSua) {
      if (!sua.row) return;   // chờ bản ghi ĐẦY ĐỦ về mới đổ — xem hook
      reset({
        inquiry_no: oChu(sua.row, 'inquiry_no'),
        customer_id: oChu(sua.row, 'customer_id'),
        season_id: oChu(sua.row, 'season_id'),
        product_name: oChu(sua.row, 'product_name'),
        description: oChu(sua.row, 'description'),
        expected_qty: oSo(sua.row, 'expected_qty'),
        target_price: oSo(sua.row, 'target_price'),
        currency: (oChu(sua.row, 'currency') || 'USD') as Input['currency'],
        order_type: (oChu(sua.row, 'order_type') || 'FOB') as Input['order_type'],
        received_date: oNgay(sua.row, 'received_date') || vnToday(),
        due_date: oNgay(sua.row, 'due_date'),
        status: (oChu(sua.row, 'status') || 'NEW') as Input['status'],
        notes: oChu(sua.row, 'notes'),
      });
      return;
    }
    reset({ ...defaults, received_date: vnToday() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sua.laSua, sua.row, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const res = suaId ? await updateInquiry(suaId, values) : await createInquiry(values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof Input, { type: 'server', message });
        }
      }
      toast.error(suaId ? 'Không lưu được thay đổi' : 'Không tạo được yêu cầu báo giá', { description: res.message });
      return;
    }
    toast.success(suaId ? 'Đã lưu thay đổi' : 'Đã tạo yêu cầu báo giá', { description: res.message });
    onClose();
    await onCreated();
  });

  return (
    <Modal
      open={open}
      title={suaId ? 'Sửa yêu cầu báo giá' : 'Nhận yêu cầu báo giá mới'}
      onClose={onClose}
      wide
    >
      <form onSubmit={onSubmit} noValidate>
        {sua.loi && (
          <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {sua.loi}
          </p>
        )}
        {sua.dangNap && (
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Đang nạp yêu cầu báo giá...
          </p>
        )}
        {customers.length === 0 && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Chưa có khách hàng nào. Hãy thêm khách hàng ở tab Khách hàng trước — yêu cầu báo giá
            bắt buộc phải gắn với một khách hàng.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Số yêu cầu" hint="tự chuyển in hoa">
            <input className={inputCls} placeholder="RFQ-2026-001" {...register('inquiry_no')} />
            <Err>{formState.errors.inquiry_no?.message}</Err>
          </Field>

          <Field label="Khách hàng">
            <select className={inputCls} {...register('customer_id')}>
              <option value="">— Chọn khách hàng —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.customer_code} — {c.name}</option>
              ))}
            </select>
            <Err>{formState.errors.customer_id?.message}</Err>
          </Field>

          <Field label="Tên sản phẩm">
            <input className={inputCls} placeholder="Áo khoác gió nữ 2 lớp" {...register('product_name')} />
            <Err>{formState.errors.product_name?.message}</Err>
          </Field>

          <Field label="Hình thức gia công">
            <select className={inputCls} {...register('order_type')}>
              {ORDER_TYPES.map((t) => (
                <option key={t} value={t}>{ORDER_TYPE_LABEL[t]}</option>
              ))}
            </select>
            <Err>{formState.errors.order_type?.message}</Err>
          </Field>

          <Field label="Số lượng dự kiến">
            <input
              className={inputCls}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              {...register('expected_qty', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.expected_qty?.message}</Err>
          </Field>

          <Field label="Giá mục tiêu của khách">
            <input
              className={inputCls}
              type="number"
              min={0}
              step={0.0001}
              inputMode="decimal"
              {...register('target_price', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.target_price?.message}</Err>
          </Field>

          <Field label="Đồng tiền">
            <select className={inputCls} {...register('currency')}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{CURRENCY_LABEL[c]}</option>
              ))}
            </select>
            <Err>{formState.errors.currency?.message}</Err>
          </Field>

          <Field label="Trạng thái">
            <select className={inputCls} {...register('status')}>
              {INQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>{INQUIRY_STATUS_LABEL[s]}</option>
              ))}
            </select>
            <Err>{formState.errors.status?.message}</Err>
          </Field>

          <Field label="Ngày nhận yêu cầu">
            <input className={inputCls} type="date" {...register('received_date')} />
            <Err>{formState.errors.received_date?.message}</Err>
          </Field>

          <Field label="Hạn chót báo giá" hint="trễ hạn là mất đơn">
            <input className={inputCls} type="date" {...register('due_date')} />
            <Err>{formState.errors.due_date?.message}</Err>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Mô tả yêu cầu">
            <textarea
              className={`${inputCls} min-h-[70px] resize-y`}
              placeholder="Chất liệu, quy cách, yêu cầu đặc biệt của khách..."
              {...register('description')}
            />
            <Err>{formState.errors.description?.message}</Err>
          </Field>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={formState.isSubmitting}>
            Hủy
          </button>
          <button
            type="submit"
            className={btnPrimary}
            disabled={formState.isSubmitting || sua.dangNap || customers.length === 0}
          >
            {formState.isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
              : suaId
                ? <><Save className="h-4 w-4" /> Lưu thay đổi</>
                : <><Plus className="h-4 w-4" /> Tạo yêu cầu</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
