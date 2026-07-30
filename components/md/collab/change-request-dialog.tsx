'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import type { z } from 'zod';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { createChangeRequest } from '@/app/(dashboard)/md/_actions/collaboration.actions';
import {
  changeRequestSchema, CHANGE_TYPES, CHANGE_TYPE_LABEL, type ChangeRequestValues,
} from '@/schemas/md';
import type { PoRow } from '@/schemas/md';

// ============================================================================
// FORM YÊU CẦU THAY ĐỔI
//
// Ô "Giá trị cũ" là BẮT BUỘC và đó là chủ đích. Khi khách đổi phút chót rồi
// tranh chấp, đây là bằng chứng duy nhất cho biết ban đầu đã chốt cái gì. Bỏ
// trống ô này thì cả bản ghi mất hết giá trị pháp lý.
// ============================================================================

type Input = z.input<typeof changeRequestSchema>;

function Err({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

const DEFAULTS: Input = {
  request_no: '', order_id: '', style_id: '', change_type: 'QUANTITY',
  old_value: '', new_value: '', reason: '', impact_note: '',
};

export default function ChangeRequestDialog({
  open, pos, onClose, onCreated,
}: {
  open: boolean;
  pos: ReadonlyArray<PoRow>;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const { register, formState, reset, setError, handleSubmit } =
    useForm<Input, unknown, ChangeRequestValues>({
      resolver: zodResolver(changeRequestSchema),
      defaultValues: DEFAULTS,
    });

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const res = await createChangeRequest(values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof Input, { type: 'server', message });
        }
      }
      toast.error('Không gửi được yêu cầu', { description: res.message });
      return;
    }
    toast.success('Đã gửi yêu cầu thay đổi', { description: res.message });
    onClose();
    await onCreated();
  });

  return (
    <Modal open={open} title="Tạo yêu cầu thay đổi" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        {pos.length === 0 && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Chưa có đơn hàng nào. Yêu cầu thay đổi luôn phải gắn với một PO cụ thể.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Số yêu cầu" hint="tự chuyển in hoa">
            <input className={inputCls} placeholder="CR-2026-001" {...register('request_no')} />
            <Err>{formState.errors.request_no?.message}</Err>
          </Field>

          <Field label="Đơn hàng">
            <select className={inputCls} {...register('order_id')}>
              <option value="">— Chọn đơn hàng —</option>
              {pos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.po_number} — {p.customer_name}
                </option>
              ))}
            </select>
            <Err>{formState.errors.order_id?.message}</Err>
          </Field>

          <Field label="Loại thay đổi">
            <select className={inputCls} {...register('change_type')}>
              {CHANGE_TYPES.map((t) => (
                <option key={t} value={t}>{CHANGE_TYPE_LABEL[t]}</option>
              ))}
            </select>
            <Err>{formState.errors.change_type?.message}</Err>
          </Field>

          <Field label="Giá trị cũ" hint="bắt buộc — đây là bằng chứng khi tranh chấp">
            <input className={inputCls} placeholder="5.000 sản phẩm" {...register('old_value')} />
            <Err>{formState.errors.old_value?.message}</Err>
          </Field>

          <Field label="Giá trị mới">
            <input className={inputCls} placeholder="6.500 sản phẩm" {...register('new_value')} />
            <Err>{formState.errors.new_value?.message}</Err>
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <Field label="Lý do thay đổi">
            <textarea
              className={`${inputCls} min-h-[60px] resize-y`}
              placeholder="Khách tăng đơn do bán tốt tại thị trường Nhật..."
              {...register('reason')}
            />
            <Err>{formState.errors.reason?.message}</Err>
          </Field>

          <Field label="Ảnh hưởng tới sản xuất">
            <textarea
              className={`${inputCls} min-h-[60px] resize-y`}
              placeholder="Cần đặt thêm 2.800 m vải, ngày giao lùi 7 ngày, phát sinh phí vận chuyển gấp..."
              {...register('impact_note')}
            />
            <Err>{formState.errors.impact_note?.message}</Err>
          </Field>
        </div>

        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
          Duyệt yêu cầu này <strong>chỉ đổi trạng thái của chính yêu cầu</strong>, không tự sửa số
          liệu trên đơn hàng. Sau khi duyệt, người phụ trách vào PO cập nhật tay — thao tác đó
          được ghi vào nhật ký nên vẫn truy được ai sửa và sửa lúc nào.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={formState.isSubmitting}>
            Hủy
          </button>
          <button type="submit" className={btnPrimary} disabled={formState.isSubmitting || pos.length === 0}>
            {formState.isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi...</>
              : <><Plus className="h-4 w-4" /> Gửi yêu cầu</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
