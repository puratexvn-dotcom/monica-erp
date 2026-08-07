'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus, Save } from 'lucide-react';

import type { z } from 'zod';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { createStyle } from '@/app/(dashboard)/md/_actions/style.actions';
import { updateStyle } from '@/app/(dashboard)/md/_actions/revisions.actions';
import { useSuaChungTu, oChu, oSo } from '@/app/(dashboard)/md/use-sua-chung-tu';
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

/** 🔴 Hai chế độ — `suaId` khác `null` ⇒ **Sửa** *(Board `BUG-5`, 07/08/2026)*.
 *
 *  ⚠️ `StyleRow` của bảng danh sách **⛔ không mang** `hs_code` · `marker_code`
 *  · `marker_length_m` · `needle_type` · `tech_pack_url`. Đổ form từ nó rồi
 *  lưu sẽ **xoá sạch** năm ô đó. Vì vậy chế độ Sửa **bắt buộc** đi qua
 *  `useSuaChungTu` — đọc nguyên dòng từ CSDL. */
export default function StyleFormDialog({
  open,
  onClose,
  onCreated,
  suaId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  suaId?: string | null;
}) {
  const sua = useSuaChungTu('STYLE', open, suaId);

  const form = useForm<StyleFormInput, unknown, StyleFormValues>({
    resolver: zodResolver(styleFormSchema),
    defaultValues: DEFAULTS,
  });
  const { register, formState, reset, setError, handleSubmit } = form;

  // Mở lại phải là tờ giấy trắng, không giữ dữ liệu lần nhập trước —
  // TRỪ chế độ Sửa, khi đó đổ đúng bản ghi đầy đủ vừa đọc về.
  useEffect(() => {
    if (!open) return;
    if (sua.laSua) {
      if (!sua.row) return;
      reset({
        style_no: oChu(sua.row, 'style_no'),
        style_name: oChu(sua.row, 'style_name'),
        customer_id: oChu(sua.row, 'customer_id'),
        season_id: oChu(sua.row, 'season_id'),
        product_group: oChu(sua.row, 'product_group'),
        gender: oChu(sua.row, 'gender') as StyleFormInput['gender'],
        hs_code: oChu(sua.row, 'hs_code'),
        fabric_type: oChu(sua.row, 'fabric_type'),
        sam_minutes: oSo(sua.row, 'sam_minutes'),
        needle_type: oChu(sua.row, 'needle_type'),
        machine_types: oChu(sua.row, 'machine_types'),
        marker_code: oChu(sua.row, 'marker_code'),
        marker_length_m: oSo(sua.row, 'marker_length_m'),
        marker_efficiency: oSo(sua.row, 'marker_efficiency'),
        tech_pack_url: oChu(sua.row, 'tech_pack_url'),
        status: (oChu(sua.row, 'status') || 'DEVELOPMENT') as StyleFormInput['status'],
        notes: oChu(sua.row, 'notes'),
      });
      return;
    }
    reset(DEFAULTS);
  }, [open, sua.laSua, sua.row, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const res = suaId ? await updateStyle(suaId, values) : await createStyle(values);

    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof StyleFormInput, { type: 'server', message });
        }
      }
      toast.error(suaId ? 'Không lưu được thay đổi' : 'Không tạo được mã hàng', { description: res.message });
      return;
    }

    toast.success(suaId ? 'Đã lưu thay đổi' : 'Đã tạo mã hàng', { description: res.message });
    reset(DEFAULTS);
    onClose();
    await onCreated();
  });

  return (
    <Modal open={open} title={suaId ? 'Sửa mã hàng' : 'Tạo mã hàng mới'} onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        {sua.loi && (
          <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {sua.loi}
          </p>
        )}
        {sua.dangNap && (
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Đang nạp mã hàng...
          </p>
        )}
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

        <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-800">
          Sau khi tạo, mở <strong>Chi tiết</strong> để khai bảng màu, bảng size, công đoạn và định mức
          nguyên phụ liệu. Khai một lần ở đây, mọi đơn hàng dùng mã này đều lấy theo — không nhập lại.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={formState.isSubmitting}>
            Hủy
          </button>
          <button type="submit" className={btnPrimary} disabled={formState.isSubmitting || sua.dangNap}>
            {formState.isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : suaId ? (
              <>
                <Save className="h-4 w-4" /> Lưu thay đổi
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
