'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import type { z } from 'zod';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import {
  generateMaterialRequests, generateProductionOrder,
} from '@/app/(dashboard)/md/_actions/planning.actions';
import {
  materialGenSchema, productionGenSchema, computeProductionPlan,
  type MaterialGenValues, type ProductionGenValues,
} from '@/schemas/md';
import type { PoRow } from '@/schemas/md';

// ============================================================================
// HAI HỘP THOẠI SINH TỰ ĐỘNG
//
// Cả hai đều KHÔNG hỏi lại những con số đã có trong hệ thống. Định mức nằm ở
// mã hàng, thời gian chuẩn nằm ở SAM — hỏi lại chỉ tạo thêm cơ hội gõ sai.
// Người dùng chỉ khai phần mà máy không thể biết: mức dự phòng và năng lực
// chuyền của ngày hôm đó.
// ============================================================================

function Err({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

// ─── 1. SINH ĐỀ NGHỊ MUA NPL ────────────────────────────────────────────────

type MatInput = z.input<typeof materialGenSchema>;

export function MaterialGenDialog({
  open, pos, onClose, onDone,
}: {
  open: boolean;
  pos: ReadonlyArray<PoRow>;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const defaults: MatInput = { order_id: '', needed_date: '', buffer_percent: 0 };

  const { register, formState, reset, setError, handleSubmit, watch } =
    useForm<MatInput, unknown, MaterialGenValues>({
      resolver: zodResolver(materialGenSchema),
      defaultValues: defaults,
    });

  useEffect(() => {
    if (open) reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  const chosen = pos.find((p) => p.id === watch('order_id'));

  const onSubmit = handleSubmit(async (values) => {
    const res = await generateMaterialRequests(values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof MatInput, { type: 'server', message });
        }
      }
      toast.error('Không sinh được đề nghị mua NPL', { description: res.message });
      return;
    }
    toast.success('Đã sinh đề nghị mua NPL', { description: res.message, duration: 8000 });
    onClose();
    await onDone();
  });

  return (
    <Modal open={open} title="Sinh đề nghị mua NPL từ định mức" onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-900">
          Nhu cầu từng loại nguyên phụ liệu được <strong>tính ra</strong> bằng
          định mức đã cộng hao hụt của mã hàng × số lượng đơn. Bạn không phải gõ lại con số nào.
          Đề nghị sinh ra ở trạng thái <strong>Nháp</strong> để soát lại trước khi trình duyệt.
        </p>

        <div className="space-y-4">
          <Field label="Đơn hàng">
            <select className={inputCls} {...register('order_id')}>
              <option value="">— Chọn đơn hàng —</option>
              {pos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.po_number} — {p.customer_name} ({p.total_quantity} sp)
                  {p.style_no ? ` · ${p.style_no}` : ' · CHƯA GẮN MÃ HÀNG'}
                </option>
              ))}
            </select>
            <Err>{formState.errors.order_id?.message}</Err>
          </Field>

          {chosen && !chosen.style_no && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              Đơn này chưa gắn mã hàng nên không có định mức để tính. Hãy gắn mã hàng cho PO trước.
            </p>
          )}

          <Field label="Ngày cần hàng về kho" hint="bỏ trống thì lấy theo mốc T&A của đơn">
            <input className={inputCls} type="date" {...register('needed_date')} />
            <Err>{formState.errors.needed_date?.message}</Err>
          </Field>

          <Field label="Dự phòng thêm (%)" hint="cộng ngoài phần hao hụt đã có trong định mức">
            <input
              className={inputCls}
              type="number" min={0} max={100} step={0.01} inputMode="decimal"
              {...register('buffer_percent', { setValueAs: (v) => (v === '' ? 0 : Number(v)) })}
            />
            <Err>{formState.errors.buffer_percent?.message}</Err>
          </Field>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={formState.isSubmitting}>
            Hủy
          </button>
          <button type="submit" className={btnPrimary} disabled={formState.isSubmitting || pos.length === 0}>
            {formState.isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang tính...</>
              : <><Sparkles className="h-4 w-4" /> Sinh đề nghị</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── 2. SINH LỆNH SẢN XUẤT ──────────────────────────────────────────────────

type ProdInput = z.input<typeof productionGenSchema>;

export function ProductionGenDialog({
  open, pos, styleSam, onClose, onDone,
}: {
  open: boolean;
  pos: ReadonlyArray<PoRow>;
  /** SAM của từng đơn, tra theo id đơn — dùng để xem trước số ngày ngay tại form */
  styleSam: Readonly<Record<string, number | null>>;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const defaults: ProdInput = {
    order_id: '', workers: 30, hours_per_day: 8, efficiency_percent: 75, due_date: '',
  };

  const { register, formState, reset, setError, handleSubmit, watch } =
    useForm<ProdInput, unknown, ProductionGenValues>({
      resolver: zodResolver(productionGenSchema),
      defaultValues: defaults,
    });

  useEffect(() => {
    if (open) reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  const orderId = watch('order_id');
  const chosen = pos.find((p) => p.id === orderId);
  const sam = orderId ? styleSam[orderId] ?? null : null;

  // Xem trước dùng ĐÚNG hàm mà máy chủ dùng để ghi xuống — không viết lại phép
  // tính ở đây, nếu không thì con số xem trước và con số lưu sẽ có ngày lệch.
  const dueDate = watch('due_date') || chosen?.ex_factory_date || chosen?.delivery_date || '';
  const preview =
    chosen && sam && sam > 0 && dueDate
      ? computeProductionPlan(
          sam,
          chosen.total_quantity,
          Number(watch('workers')) || 0,
          Number(watch('hours_per_day')) || 0,
          Number(watch('efficiency_percent')) || 0,
          dueDate,
        )
      : null;

  const onSubmit = handleSubmit(async (values) => {
    const res = await generateProductionOrder(values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof ProdInput, { type: 'server', message });
        }
      }
      toast.error('Không sinh được lệnh sản xuất', { description: res.message });
      return;
    }
    toast.success('Đã tạo lệnh sản xuất', { description: res.message, duration: 8000 });
    onClose();
    await onDone();
  });

  return (
    <Modal open={open} title="Sinh lệnh sản xuất từ thời gian chuẩn (SAM)" onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-900">
          Số ngày sản xuất tính từ <strong>SAM của mã hàng</strong>: tổng phút chuẩn =
          SAM × số lượng, chia cho năng lực một ngày của chuyền. Bạn chỉ khai phần
          máy không tự biết được: số công nhân, số giờ và hiệu suất.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Đơn hàng">
              <select className={inputCls} {...register('order_id')}>
                <option value="">— Chọn đơn hàng —</option>
                {pos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.po_number} — {p.customer_name} ({p.total_quantity} sp)
                  </option>
                ))}
              </select>
              <Err>{formState.errors.order_id?.message}</Err>
            </Field>
          </div>

          {chosen && (!sam || sam <= 0) && (
            <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              Mã hàng của đơn này chưa khai thời gian chuẩn (SAM) nên không tính được số ngày.
              Hãy khai SAM ở tab Mã hàng trước.
            </p>
          )}

          <Field label="Số công nhân trên chuyền">
            <input
              className={inputCls}
              type="number" min={1} step={1} inputMode="numeric"
              {...register('workers', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.workers?.message}</Err>
          </Field>

          <Field label="Số giờ làm mỗi ngày">
            <input
              className={inputCls}
              type="number" min={0.5} max={24} step={0.5} inputMode="decimal"
              {...register('hours_per_day', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.hours_per_day?.message}</Err>
          </Field>

          <Field label="Hiệu suất chuyền (%)" hint="tỷ lệ thời gian thực sự tạo ra sản phẩm">
            <input
              className={inputCls}
              type="number" min={1} max={100} step={1} inputMode="numeric"
              {...register('efficiency_percent', { setValueAs: (v) => (v === '' ? 75 : Number(v)) })}
            />
            <Err>{formState.errors.efficiency_percent?.message}</Err>
          </Field>

          <Field label="Ngày phải xong" hint="bỏ trống thì lấy ngày xuất xưởng của đơn">
            <input className={inputCls} type="date" {...register('due_date')} />
            <Err>{formState.errors.due_date?.message}</Err>
          </Field>
        </div>

        {preview && (
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-slate-50 p-3 text-xs">
            <dt className="text-slate-500">Tổng phút chuẩn</dt>
            <dd className="text-right font-semibold tabular-nums text-slate-800">
              {preview.totalStandardMinutes.toLocaleString('vi-VN')} phút
            </dd>
            <dt className="text-slate-500">Năng lực một ngày</dt>
            <dd className="text-right font-semibold tabular-nums text-slate-800">
              {preview.dailyCapacityMinutes.toLocaleString('vi-VN')} phút
            </dd>
            <dt className="text-slate-500">Số ngày cần</dt>
            <dd className="text-right font-extrabold tabular-nums text-blue-700">{preview.days} ngày</dd>
            <dt className="text-slate-500">Chạy từ</dt>
            <dd className="text-right font-semibold tabular-nums text-slate-800">
              {preview.startDate} → {preview.dueDate}
            </dd>
          </dl>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-amber-800">
          ⚠️ Số ngày đếm theo <strong>ngày lịch</strong>, chưa trừ chủ nhật và ngày lễ — hệ thống
          chưa có bảng lịch nghỉ của nhà máy, đoán bừa lịch nghỉ còn nguy hiểm hơn là nói rõ cách
          đếm. Hãy tự cộng thêm ngày nghỉ khi chốt lịch với khách.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={formState.isSubmitting}>
            Hủy
          </button>
          <button type="submit" className={btnPrimary} disabled={formState.isSubmitting || pos.length === 0}>
            {formState.isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang tính...</>
              : <><Sparkles className="h-4 w-4" /> Tạo lệnh sản xuất</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
