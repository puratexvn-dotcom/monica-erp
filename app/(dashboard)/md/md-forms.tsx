'use client';

import { useEffect } from 'react';
import { useForm, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import EvidenceUpload from '@/components/evidence-upload';
import type { PoOption } from './md-types';
import {
  customerFormSchema,
  materialRequestSchema,
  productionOrderSchema,
  shipmentFormSchema,
  vnToday,
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_LABEL,
  type CustomerFormValues,
  type MaterialRequestValues,
  type ProductionOrderValues,
  type ShipmentFormValues,
} from './md-schema';
import {
  createCustomer,
  createMaterialRequest,
  createProductionOrder,
  createShipmentOrder,
  type ActionResult,
} from './md-actions';

// ============================================================================
// BỐN FORM TẠO MỚI CỦA PHÂN HỆ MERCHANDISER
//
// Bốn form đều theo cùng một khuôn: RHF + zodResolver, gửi qua Server Action,
// nhận lại fieldErrors để tô đỏ đúng ô, toast báo kết quả. Phần lặp lại gom vào
// applyResult() bên dưới.
//
// Riêng form Khách hàng KHÔNG có ô ảnh chứng từ: hồ sơ khách hàng là dữ liệu
// danh mục, không phát sinh chứng từ gốc như PO hay lệnh giao hàng.
// ============================================================================

/**
 * Xử lý kết quả Server Action: tô lỗi vào đúng ô, toast, đóng form, nạp lại.
 *
 * CỐ Ý KHÔNG bọc cả useForm vào một hook generic. zodResolver có ba tham số
 * kiểu (input/context/output) và các lược đồ ở đây dùng .transform(), nên khi
 * truyền qua một `ZodType<T>` chung thì TypeScript không khớp nổi input với
 * output. Cách duy nhất để qua được là ép `any` — mà dự án cấm dùng any.
 * Vì vậy mỗi form tự gọi useForm với lược đồ cụ thể của nó, chỉ phần lặp lại
 * dưới đây được gom.
 */
async function applyResult<T extends FieldValues>(
  form: UseFormReturn<T>,
  res: ActionResult,
  onClose: () => void,
  onDone: () => void | Promise<void>,
): Promise<void> {
  if (!res.ok) {
    if (res.fieldErrors) {
      for (const [name, message] of Object.entries(res.fieldErrors)) {
        form.setError(name as Path<T>, { type: 'server', message });
      }
    }
    toast.error('Không lưu được', { description: res.message });
    return;
  }

  toast.success('Đã lưu', { description: res.message });
  form.reset();
  onClose();
  await onDone();
}

function Err({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

function Actions({
  onClose,
  busy,
  label,
}: {
  onClose: () => void;
  busy: boolean;
  label: string;
}) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button type="button" className={btnGhost} onClick={onClose} disabled={busy}>
        Hủy
      </button>
      <button type="submit" className={btnPrimary} disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> {label}
          </>
        )}
      </button>
    </div>
  );
}

/** Ô chọn PO dùng chung cho 3 form. Nếu chưa có PO nào thì nói rõ, đừng để
 *  người dùng thấy danh sách rỗng rồi không hiểu vì sao không chọn được. */
function PoSelect<T extends FieldValues>({
  form,
  name,
  pos,
  label,
  hint,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  pos: PoOption[];
  label: string;
  hint?: string;
}) {
  const msg = form.formState.errors[name]?.message;
  return (
    <Field label={label} hint={pos.length === 0 ? 'Chưa có PO nào — tạo PO trước' : hint}>
      <select className={inputCls} disabled={pos.length === 0} {...form.register(name)}>
        <option value="">— Chọn đơn hàng —</option>
        {pos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.po_number} · {p.style_code} · {p.customer_name}
          </option>
        ))}
      </select>
      <Err>{typeof msg === 'string' ? msg : undefined}</Err>
    </Field>
  );
}

// ── 1. KHÁCH HÀNG ───────────────────────────────────────────────────────────
export function CustomerFormDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const defaults: CustomerFormValues = {
    customer_code: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    country: '',
    address: '',
    notes: '',
  };
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: defaults,
  });

  // Mở lại hộp thoại phải là tờ giấy trắng, không giữ dữ liệu lần nhập trước
  useEffect(() => {
    if (open) form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = form.handleSubmit(async (values) => {
    await applyResult(form, await createCustomer(values), onClose, onDone);
  });
  const { register, formState } = form;

  return (
    <Modal open={open} title="Tạo khách hàng mới" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mã khách hàng" hint="chữ, số, gạch ngang — tự chuyển in hoa">
            <input className={inputCls} placeholder="NORDIC-EU" {...register('customer_code')} />
            <Err>{formState.errors.customer_code?.message}</Err>
          </Field>
          <Field label="Tên khách hàng">
            <input className={inputCls} {...register('name')} />
            <Err>{formState.errors.name?.message}</Err>
          </Field>
          <Field label="Người liên hệ">
            <input className={inputCls} {...register('contact_person')} />
            <Err>{formState.errors.contact_person?.message}</Err>
          </Field>
          <Field label="Điện thoại">
            <input className={inputCls} {...register('phone')} />
            <Err>{formState.errors.phone?.message}</Err>
          </Field>
          <Field label="Email">
            <input className={inputCls} type="email" {...register('email')} />
            <Err>{formState.errors.email?.message}</Err>
          </Field>
          <Field label="Quốc gia">
            <input className={inputCls} placeholder="Đức" {...register('country')} />
            <Err>{formState.errors.country?.message}</Err>
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <Field label="Địa chỉ">
            <textarea className={`${inputCls} min-h-[64px] resize-y`} {...register('address')} />
            <Err>{formState.errors.address?.message}</Err>
          </Field>
          <Field label="Ghi chú">
            <textarea className={`${inputCls} min-h-[64px] resize-y`} {...register('notes')} />
            <Err>{formState.errors.notes?.message}</Err>
          </Field>
        </div>

        <Actions onClose={onClose} busy={formState.isSubmitting} label="Tạo khách hàng" />
      </form>
    </Modal>
  );
}

// ── 2. ĐỀ NGHỊ MUA NPL ──────────────────────────────────────────────────────
export function MaterialRequestDialog({
  open,
  onClose,
  onDone,
  pos,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void | Promise<void>;
  pos: PoOption[];
}) {
  const defaults: MaterialRequestValues = {
    request_no: '',
    order_id: '',
    material_name: '',
    category: 'FABRIC',
    quantity: 0,
    unit: 'm',
    needed_date: vnToday(),
    notes: '',
    evidence_path: '',
  };
  const form = useForm<MaterialRequestValues>({
    resolver: zodResolver(materialRequestSchema),
    defaultValues: defaults,
  });

  // Mở lại hộp thoại phải là tờ giấy trắng, không giữ dữ liệu lần nhập trước
  useEffect(() => {
    if (open) form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = form.handleSubmit(async (values) => {
    await applyResult(form, await createMaterialRequest(values), onClose, onDone);
  });
  const { register, formState, setValue } = form;

  return (
    <Modal open={open} title="Tạo đề nghị mua nguyên phụ liệu" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Số phiếu đề nghị">
            <input className={inputCls} placeholder="DN-2026-0042" {...register('request_no')} />
            <Err>{formState.errors.request_no?.message}</Err>
          </Field>

          <PoSelect form={form} name="order_id" pos={pos} label="Đơn hàng liên quan" hint="tuỳ chọn" />

          <Field label="Tên nguyên phụ liệu">
            <input className={inputCls} placeholder="Vải chính 100% Cotton 180gsm" {...register('material_name')} />
            <Err>{formState.errors.material_name?.message}</Err>
          </Field>

          <Field label="Loại NPL">
            <select className={inputCls} {...register('category')}>
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {MATERIAL_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <Err>{formState.errors.category?.message}</Err>
          </Field>

          <Field label="Số lượng">
            <input
              className={inputCls}
              type="number"
              min={0.01}
              step={0.01}
              inputMode="decimal"
              {...register('quantity', { valueAsNumber: true })}
            />
            <Err>{formState.errors.quantity?.message}</Err>
          </Field>

          <Field label="Đơn vị">
            <input className={inputCls} placeholder="m / kg / cái" {...register('unit')} />
            <Err>{formState.errors.unit?.message}</Err>
          </Field>

          <Field label="Ngày cần hàng">
            <input className={inputCls} type="date" {...register('needed_date')} />
            <Err>{formState.errors.needed_date?.message}</Err>
          </Field>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Ghi chú">
            <textarea
              className={`${inputCls} min-h-[64px] resize-y`}
              placeholder="Yêu cầu kỹ thuật, nhà cung cấp đề xuất..."
              {...register('notes')}
            />
            <Err>{formState.errors.notes?.message}</Err>
          </Field>

          <EvidenceUpload
            folder="material"
            hint="Báo giá NPL, mẫu vải, thư xác nhận của nhà cung cấp..."
            onChange={(p) => setValue('evidence_path', p ?? '')}
          />
        </div>

        <Actions onClose={onClose} busy={formState.isSubmitting} label="Tạo đề nghị" />
      </form>
    </Modal>
  );
}

// ── 3. LỆNH SẢN XUẤT ────────────────────────────────────────────────────────
export function ProductionOrderDialog({
  open,
  onClose,
  onDone,
  pos,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void | Promise<void>;
  pos: PoOption[];
}) {
  const defaults: ProductionOrderValues = {
    order_no: '',
    order_id: '',
    planned_qty: 0,
    start_date: vnToday(),
    due_date: vnToday(),
    notes: '',
    evidence_path: '',
  };
  const form = useForm<ProductionOrderValues>({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: defaults,
  });

  // Mở lại hộp thoại phải là tờ giấy trắng, không giữ dữ liệu lần nhập trước
  useEffect(() => {
    if (open) form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = form.handleSubmit(async (values) => {
    await applyResult(form, await createProductionOrder(values), onClose, onDone);
  });
  const { register, formState, setValue } = form;

  return (
    <Modal open={open} title="Tạo lệnh sản xuất" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Số lệnh sản xuất">
            <input className={inputCls} placeholder="LSX-2026-0117" {...register('order_no')} />
            <Err>{formState.errors.order_no?.message}</Err>
          </Field>

          <PoSelect form={form} name="order_id" pos={pos} label="Đơn hàng cần sản xuất" hint="bắt buộc" />

          <Field label="Số lượng kế hoạch" hint="số nguyên, đơn vị pcs">
            <input
              className={inputCls}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              {...register('planned_qty', { valueAsNumber: true })}
            />
            <Err>{formState.errors.planned_qty?.message}</Err>
          </Field>

          <Field label="Ngày bắt đầu">
            <input className={inputCls} type="date" {...register('start_date')} />
            <Err>{formState.errors.start_date?.message}</Err>
          </Field>

          <Field label="Ngày tới hạn">
            <input className={inputCls} type="date" {...register('due_date')} />
            <Err>{formState.errors.due_date?.message}</Err>
          </Field>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Ghi chú">
            <textarea
              className={`${inputCls} min-h-[64px] resize-y`}
              placeholder="Chuyền được phân, yêu cầu đặc biệt..."
              {...register('notes')}
            />
            <Err>{formState.errors.notes?.message}</Err>
          </Field>

          <EvidenceUpload
            folder="production"
            hint="Bảng phân chuyền, tài liệu kỹ thuật, sơ đồ cắt..."
            onChange={(p) => setValue('evidence_path', p ?? '')}
          />
        </div>

        <Actions onClose={onClose} busy={formState.isSubmitting} label="Tạo lệnh sản xuất" />
      </form>
    </Modal>
  );
}

// ── 4. LỆNH GIAO HÀNG ───────────────────────────────────────────────────────
export function ShipmentFormDialog({
  open,
  onClose,
  onDone,
  pos,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void | Promise<void>;
  pos: PoOption[];
}) {
  const defaults: ShipmentFormValues = {
    shipment_no: '',
    order_id: '',
    container_no: '',
    seal_no: '',
    vessel_name: '',
    destination_port: '',
    etd_date: vnToday(),
    notes: '',
    evidence_path: '',
  };
  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: defaults,
  });

  // Mở lại hộp thoại phải là tờ giấy trắng, không giữ dữ liệu lần nhập trước
  useEffect(() => {
    if (open) form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = form.handleSubmit(async (values) => {
    await applyResult(form, await createShipmentOrder(values), onClose, onDone);
  });
  const { register, formState, setValue } = form;

  return (
    <Modal open={open} title="Tạo lệnh giao hàng" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Số lệnh giao hàng">
            <input className={inputCls} placeholder="LGH-2026-0088" {...register('shipment_no')} />
            <Err>{formState.errors.shipment_no?.message}</Err>
          </Field>

          <PoSelect form={form} name="order_id" pos={pos} label="Đơn hàng cần giao" hint="bắt buộc" />

          <Field label="Số container">
            <input className={inputCls} placeholder="MSKU1234567" {...register('container_no')} />
            <Err>{formState.errors.container_no?.message}</Err>
          </Field>

          <Field label="Số seal">
            <input className={inputCls} {...register('seal_no')} />
            <Err>{formState.errors.seal_no?.message}</Err>
          </Field>

          <Field label="Tên tàu">
            <input className={inputCls} {...register('vessel_name')} />
            <Err>{formState.errors.vessel_name?.message}</Err>
          </Field>

          <Field label="Cảng đến">
            <input className={inputCls} placeholder="Hamburg" {...register('destination_port')} />
            <Err>{formState.errors.destination_port?.message}</Err>
          </Field>

          <Field label="Ngày dự kiến rời cảng (ETD)">
            <input className={inputCls} type="date" {...register('etd_date')} />
            <Err>{formState.errors.etd_date?.message}</Err>
          </Field>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Ghi chú">
            <textarea className={`${inputCls} min-h-[64px] resize-y`} {...register('notes')} />
            <Err>{formState.errors.notes?.message}</Err>
          </Field>

          <EvidenceUpload
            folder="shipment"
            hint="Packing list, booking note, vận đơn..."
            onChange={(p) => setValue('evidence_path', p ?? '')}
          />
        </div>

        <Actions onClose={onClose} busy={formState.isSubmitting} label="Tạo lệnh giao hàng" />
      </form>
    </Modal>
  );
}
