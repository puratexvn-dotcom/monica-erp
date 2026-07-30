'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

import type { z } from 'zod';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { createStyle } from '@/app/(dashboard)/md/_actions/style.actions';
import {
  styleFormSchema,
  STYLE_STATUSES, STYLE_STATUS_LABEL,
  GENDERS, GENDER_LABEL,
  type StyleFormValues,
} from '@/schemas/md';

/** Kiểu Ô NHẬP, khác kiểu KẾT QUẢ: `status` có .default() nên trước khi lược đồ
 *  chạy nó vẫn có thể trống. Tách hai kiểu này ra là cách duy nhất để useForm
 *  khớp với zodResolver mà không phải ép `any` (dự án cấm dùng any). */
type StyleFormInput = z.input<typeof styleFormSchema>;

// ============================================================================
// FORM TẠO MÃ HÀNG
//
// Chỉ hỏi phần LÕI. Bảng màu, size, công đoạn và định mức khai ở màn hình chi
// tiết sau khi tạo — nhồi hết vào một form là bắt người dùng điền 30 ô trước
// khi lưu được dòng đầu tiên.
// ============================================================================

function Err({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

const DEFAULTS: StyleFormInput = {
  style_no: '',
  style_name: '',
  customer_id: '',
  season_id: '',
  product_group: '',
  gender: '',
  hs_code: '',
  fabric_type: '',
  sam_minutes: undefined,
  needle_type: '',
  machine_types: '',
  marker_code: '',
  marker_length_m: undefined,
  marker_efficiency: undefined,
  tech_pack_url: '',
  status: 'DEVELOPMENT',
  notes: '',
};

export default function StyleFormDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const form = useForm<StyleFormInput, unknown, StyleFormValues>({
    resolver: zodResolver(styleFormSchema),
    defaultValues: DEFAULTS,
  });
  const { register, formState, reset, setError, handleSubmit } = form;

  // Mở lại phải là tờ giấy trắng, không giữ dữ liệu lần nhập trước
  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const res = await createStyle(values);

    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof StyleFormInput, { type: 'server', message });
        }
      }
      toast.error('Không tạo được mã hàng', { description: res.message });
      return;
    }

    toast.success('Đã tạo mã hàng', { description: res.message });
    reset(DEFAULTS);
    onClose();
    await onCreated();
  });

  return (
    <Modal open={open} title="Tạo mã hàng mới" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mã hàng (Style No)" hint="chữ, số, gạch ngang — tự chuyển in hoa">
            <input className={inputCls} placeholder="JK-W26-001" {...register('style_no')} />
            <Err>{formState.errors.style_no?.message}</Err>
          </Field>

          <Field label="Tên mã hàng">
            <input className={inputCls} placeholder="Áo khoác gió nữ 2 lớp" {...register('style_name')} />
            <Err>{formState.errors.style_name?.message}</Err>
          </Field>

          <Field label="Nhóm hàng">
            <input className={inputCls} placeholder="Áo khoác" {...register('product_group')} />
            <Err>{formState.errors.product_group?.message}</Err>
          </Field>

          <Field label="Giới tính">
            <select className={inputCls} {...register('gender')}>
              <option value="">— Không xác định —</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {GENDER_LABEL[g]}
                </option>
              ))}
            </select>
            <Err>{formState.errors.gender?.message}</Err>
          </Field>

          <Field label="Loại vải chính">
            <input className={inputCls} placeholder="Polyester 75D chống thấm" {...register('fabric_type')} />
            <Err>{formState.errors.fabric_type?.message}</Err>
          </Field>

          <Field label="Mã HS">
            <input className={inputCls} placeholder="6201.40.00" {...register('hs_code')} />
            <Err>{formState.errors.hs_code?.message}</Err>
          </Field>

          <Field label="Thời gian chuẩn SAM" hint="phút/sản phẩm, tối đa 3 số lẻ">
            <input
              className={inputCls}
              type="number"
              min={0.001}
              step={0.001}
              inputMode="decimal"
              placeholder="18.500"
              {...register('sam_minutes', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.sam_minutes?.message}</Err>
          </Field>

          <Field label="Loại kim">
            <input className={inputCls} placeholder="DBx1 #11" {...register('needle_type')} />
            <Err>{formState.errors.needle_type?.message}</Err>
          </Field>

          <Field label="Mã sơ đồ rập">
            <input className={inputCls} placeholder="MK-JK-001" {...register('marker_code')} />
            <Err>{formState.errors.marker_code?.message}</Err>
          </Field>

          <Field label="Hiệu suất sơ đồ" hint="phần trăm, 0–100">
            <input
              className={inputCls}
              type="number"
              min={0}
              max={100}
              step={0.01}
              inputMode="decimal"
              placeholder="86.5"
              {...register('marker_efficiency', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.marker_efficiency?.message}</Err>
          </Field>

          <Field label="Trạng thái">
            <select className={inputCls} {...register('status')}>
              {STYLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STYLE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <Err>{formState.errors.status?.message}</Err>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Ghi chú kỹ thuật">
            <textarea
              className={`${inputCls} min-h-[70px] resize-y`}
              placeholder="Yêu cầu đặc biệt, loại máy dùng, lưu ý khi may..."
              {...register('machine_types')}
            />
            <Err>{formState.errors.machine_types?.message}</Err>
          </Field>
        </div>

        <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-[11px] leading-relaxed text-indigo-800">
          Sau khi tạo, mở <strong>Chi tiết</strong> để khai bảng màu, bảng size, công đoạn và định mức
          nguyên phụ liệu. Khai một lần ở đây, mọi đơn hàng dùng mã này đều lấy theo — không nhập lại.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={formState.isSubmitting}>
            Hủy
          </button>
          <button type="submit" className={btnPrimary} disabled={formState.isSubmitting}>
            {formState.isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Tạo mã hàng
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
