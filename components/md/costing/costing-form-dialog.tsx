'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import type { z } from 'zod';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { createCosting } from '@/app/(dashboard)/md/_actions/commercial.actions';
import {
  costingFormSchema, costingItemSchema,
  CURRENCIES, CURRENCY_LABEL, ORDER_TYPES, ORDER_TYPE_LABEL,
  COST_CATEGORIES, COST_CATEGORY_LABEL,
  type CostingFormValues, type CostingItemValues,
} from '@/schemas/md';
import { addCostingItem, createCostingFromOperations } from '@/app/(dashboard)/md/_actions/commercial.actions';
import {
  congDoanTheoNhom, macDinhTheoNhom, tinhCM, giaChaoBan,
  NHOM_SAN_PHAM, NHOM_SAN_PHAM_LABEL, KHAU, KHAU_LABEL, type NhomSanPham,
} from '@/lib/mos/md/operations';

// ============================================================================
// HAI FORM CỦA CHIẾT TÍNH GIÁ: TẠO BẢN MỚI VÀ THÊM KHOẢN MỤC
//
// Phiên bản KHÔNG cho gõ tay — máy chủ tự đặt v1 khi tạo và tự +1 khi làm bản
// mới. Để người dùng tự đánh số là mở đường cho trùng số và nhảy cóc, mà bản
// chiết tính lại chính là căn cứ khi tranh chấp giá với khách.
// ============================================================================

function Err({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

// ─── 1. TẠO BẢN CHIẾT TÍNH ──────────────────────────────────────────────────

type CostingInput = z.input<typeof costingFormSchema>;

export function CostingFormDialog({
  open, customers, styles, onClose, onCreated,
}: {
  open: boolean;
  customers: ReadonlyArray<{ id: string; customer_code: string; name: string }>;
  styles: ReadonlyArray<{ id: string; style_no: string; style_name: string }>;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const defaults: CostingInput = {
    costing_no: '', inquiry_id: '', style_id: '', customer_id: '',
    order_type: 'FOB', currency: 'USD',
    quantity: undefined, target_price: undefined, quoted_price: undefined, notes: '',
  };

  const { register, formState, reset, setError, handleSubmit } =
    useForm<CostingInput, unknown, CostingFormValues>({
      resolver: zodResolver(costingFormSchema),
      defaultValues: defaults,
    });

  useEffect(() => {
    if (open) reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const res = await createCosting(values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof CostingInput, { type: 'server', message });
        }
      }
      toast.error('Không tạo được bản chiết tính', { description: res.message });
      return;
    }
    toast.success('Đã tạo bản chiết tính', { description: res.message });
    onClose();
    await onCreated();
  });

  return (
    <Modal open={open} title="Tạo bản chiết tính giá" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Số chiết tính" hint="phiên bản 1 do máy chủ tự đặt">
            <input className={inputCls} placeholder="CT-2026-001" {...register('costing_no')} />
            <Err>{formState.errors.costing_no?.message}</Err>
          </Field>

          <Field label="Khách hàng">
            <select className={inputCls} {...register('customer_id')}>
              <option value="">— Chưa gắn —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.customer_code} — {c.name}</option>
              ))}
            </select>
            <Err>{formState.errors.customer_id?.message}</Err>
          </Field>

          <Field label="Mã hàng">
            <select className={inputCls} {...register('style_id')}>
              <option value="">— Chưa gắn —</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>{s.style_no} — {s.style_name}</option>
              ))}
            </select>
            <Err>{formState.errors.style_id?.message}</Err>
          </Field>

          <Field label="Hình thức gia công">
            <select className={inputCls} {...register('order_type')}>
              {ORDER_TYPES.map((t) => (
                <option key={t} value={t}>{ORDER_TYPE_LABEL[t]}</option>
              ))}
            </select>
            <Err>{formState.errors.order_type?.message}</Err>
          </Field>

          <Field label="Đồng tiền">
            <select className={inputCls} {...register('currency')}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{CURRENCY_LABEL[c]}</option>
              ))}
            </select>
            <Err>{formState.errors.currency?.message}</Err>
          </Field>

          <Field label="Số lượng chiết tính">
            <input
              className={inputCls}
              type="number" min={1} step={1} inputMode="numeric"
              {...register('quantity', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.quantity?.message}</Err>
          </Field>

          <Field label="Giá mục tiêu của khách">
            <input
              className={inputCls}
              type="number" min={0} step={0.0001} inputMode="decimal"
              {...register('target_price', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.target_price?.message}</Err>
          </Field>

          <Field label="Giá mình báo" hint="dùng để tính biên lợi nhuận">
            <input
              className={inputCls}
              type="number" min={0} step={0.0001} inputMode="decimal"
              {...register('quoted_price', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.quoted_price?.message}</Err>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Ghi chú">
            <textarea className={`${inputCls} min-h-[60px] resize-y`} {...register('notes')} />
            <Err>{formState.errors.notes?.message}</Err>
          </Field>
        </div>

        <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-800">
          Sau khi tạo, mở <strong>Chi tiết</strong> để nhập từng khoản mục chi phí. Thành tiền của
          mỗi khoản mục do cơ sở dữ liệu tự tính (định mức × đơn giá), giao diện không tự nhân —
          nhờ vậy bảng chiết tính và báo cáo lợi nhuận không thể ra hai con số khác nhau.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={formState.isSubmitting}>
            Hủy
          </button>
          <button type="submit" className={btnPrimary} disabled={formState.isSubmitting}>
            {formState.isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
              : <><Plus className="h-4 w-4" /> Tạo bản chiết tính</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── 2. THÊM KHOẢN MỤC CHI PHÍ ──────────────────────────────────────────────

type ItemInput = z.input<typeof costingItemSchema>;

export function CostingItemDialog({
  open, costingId, currency, onClose, onCreated,
}: {
  open: boolean;
  costingId: string | null;
  currency: string | null;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const defaults: ItemInput = {
    costing_id: costingId ?? '', category: 'FABRIC', item_name: '',
    unit: '', consumption: undefined, unit_price: undefined, notes: '',
  };

  const { register, formState, reset, setError, handleSubmit, watch } =
    useForm<ItemInput, unknown, CostingItemValues>({
      resolver: zodResolver(costingItemSchema),
      defaultValues: defaults,
    });

  useEffect(() => {
    if (open) reset({ ...defaults, costing_id: costingId ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, costingId, reset]);

  const consumption = Number(watch('consumption') ?? 0);
  const unitPrice = Number(watch('unit_price') ?? 0);
  const preview = consumption > 0 && unitPrice > 0 ? consumption * unitPrice : null;

  const onSubmit = handleSubmit(async (values) => {
    const res = await addCostingItem(values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof ItemInput, { type: 'server', message });
        }
      }
      toast.error('Không thêm được khoản mục', { description: res.message });
      return;
    }
    toast.success('Đã thêm khoản mục', { description: res.message });
    reset({ ...defaults, costing_id: costingId ?? '' });
    onClose();
    await onCreated();
  });

  return (
    <Modal open={open} title="Thêm khoản mục chi phí" onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <input type="hidden" {...register('costing_id')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nhóm chi phí">
            <select className={inputCls} {...register('category')}>
              {COST_CATEGORIES.map((c) => (
                <option key={c} value={c}>{COST_CATEGORY_LABEL[c]}</option>
              ))}
            </select>
            <Err>{formState.errors.category?.message}</Err>
          </Field>

          <Field label="Tên khoản mục">
            <input className={inputCls} placeholder="Vải chính 75D" {...register('item_name')} />
            <Err>{formState.errors.item_name?.message}</Err>
          </Field>

          <Field label="Đơn vị">
            <input className={inputCls} placeholder="m" {...register('unit')} />
            <Err>{formState.errors.unit?.message}</Err>
          </Field>

          <Field label="Định mức trên một sản phẩm">
            <input
              className={inputCls}
              type="number" min={0} step={0.0001} inputMode="decimal"
              {...register('consumption', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.consumption?.message}</Err>
          </Field>

          <Field label="Đơn giá">
            <input
              className={inputCls}
              type="number" min={0} step={0.0001} inputMode="decimal"
              {...register('unit_price', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.unit_price?.message}</Err>
          </Field>
        </div>

        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Thành tiền xem trước:{' '}
          <strong className="tabular-nums text-slate-900">
            {preview === null ? '—' : `${preview.toFixed(4)} ${currency ?? ''}`.trim()}
          </strong>
          <span className="ml-1 text-slate-400">
            (con số lưu chính thức do cơ sở dữ liệu tính, đây chỉ là xem trước)
          </span>
        </p>

        <div className="mt-3">
          <Field label="Ghi chú">
            <input className={inputCls} {...register('notes')} />
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
              : <><Plus className="h-4 w-4" /> Thêm khoản mục</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 🔴 TÍNH GIÁ THEO CÔNG ĐOẠN — Board Directive 06/08/2026
//
// *"Cầm sản phẩm mẫu, tích vào bảng những công đoạn đó — tuỳ từng mẫu mà có
// công đoạn tương ứng. Chỉ cần **nhập và xác nhận** là ra costing chính xác."*
//
// ─── 🔑 VÌ SAO MÀN HÌNH NÀY KHÁC "THÊM KHOẢN MỤC" Ở TRÊN ──────────────────
// Form trên bắt người dùng **tự nghĩ ra** từng khoản rồi tự gõ số tiền. Màn
// hình này **bày sẵn công đoạn theo nhóm sản phẩm** và tự cộng SAM — người
// dùng chỉ còn **tích và sửa**. Khác biệt giữa *tự lập bảng* và *trả lời câu
// hỏi*.
//
// ⚠️ SAM bày ra là **số tham chiếu ngành**, sửa được tại chỗ. Khi xưởng đã bấm
// giờ thật thì số đó thắng — xem `lib/mos/md/operations.ts`.
//
// ⚠️ Đặt TRONG tệp này, ⛔ không tách tệp mới: tệp này đã nằm trong sổ nợ
// `TD-07`/`TD-10`, còn tệp MỚI mang màu/cỡ chữ thẳng sẽ làm bánh cóc đỏ và
// thêm tên vào sổ nợ là việc **cần Board duyệt**.
// ════════════════════════════════════════════════════════════════════════════

export function CostingByOperationsDialog({
  open, onClose, onDone, customers,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void | Promise<void>;
  customers: Array<{ id: string; name: string }>;
}) {
  const [nhom, setNhom] = useState<NhomSanPham>('TSHIRT');
  const [tick, setTick] = useState<Set<string>>(new Set());
  const [samSua, setSamSua] = useState<Record<string, number>>({});
  const [so, setSo] = useState('');
  const [khach, setKhach] = useState('');
  const [sl, setSl] = useState('1000');
  const [giaPhut, setGiaPhut] = useState('0.045');
  const [hieuSuat, setHieuSuat] = useState('75');
  const [overhead, setOverhead] = useState('12');
  const [npl, setNpl] = useState('4.20');
  const [bien, setBien] = useState('18');
  const [dang, setDang] = useState(false);

  const ds = useMemo(() => congDoanTheoNhom(nhom), [nhom]);

  // Đổi nhóm sản phẩm ⇒ tích lại theo mặc định của nhóm đó. Giữ tích cũ sẽ để
  // sót công đoạn của sản phẩm khác — đúng lỗi người dùng ⛔ không nhìn ra.
  useEffect(() => {
    if (!open) return;
    setTick(new Set(macDinhTheoNhom(nhom)));
    setSamSua({});
  }, [nhom, open]);

  const chon = useMemo(
    () => ds.filter((c) => tick.has(c.ma))
      .map((c) => ({ ma: c.ma, ten: c.ten, khau: c.khau, sam: samSua[c.ma] ?? c.sam })),
    [ds, tick, samSua],
  );

  const ts = {
    giaPhut: Number(giaPhut) || 0,
    hieuSuat: Number(hieuSuat) || 0,
    overhead: Number(overhead) || 0,
  };
  const cm = tinhCM(chon, ts);
  const giaVon = cm.cmMotSanPham + (Number(npl) || 0);
  const chao = giaChaoBan(giaVon, Number(bien) || 0);

  const chot = () => {
    setDang(true);
    void createCostingFromOperations({
      costing_no: so.trim(),
      customer_id: khach || null,
      order_type: 'FOB',
      currency: 'USD',
      quantity: Number(sl) || null,
      congDoan: chon,
      giaPhut: ts.giaPhut,
      hieuSuat: ts.hieuSuat,
      overhead: ts.overhead,
      npl: Number(npl) || 0,
      bienPhanTram: Number(bien) || 0,
    }).then((r) => {
      if (r.ok) { toast.success(r.message ?? 'Đã tạo.'); void onDone(); onClose(); }
      else toast.error(r.message ?? 'Không tạo được.');
    }).finally(() => setDang(false));
  };

  return (
    <Modal open={open} title="Tính giá theo công đoạn" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Số chiết tính">
            <input value={so} onChange={(e) => setSo(e.target.value)} className={inputCls} placeholder="CT-2026-001" />
          </Field>
          <Field label="Khách hàng">
            <select value={khach} onChange={(e) => setKhach(e.target.value)} className={inputCls}>
              <option value="">— chọn —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Số lượng (sp)">
            <input type="number" min={1} value={sl} onChange={(e) => setSl(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Nhóm sản phẩm">
            <select value={nhom} onChange={(e) => setNhom(e.target.value as NhomSanPham)} className={inputCls}>
              {NHOM_SAN_PHAM.map((n) => <option key={n} value={n}>{NHOM_SAN_PHAM_LABEL[n]}</option>)}
            </select>
          </Field>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
          {KHAU.map((k) => {
            const trongKhau = ds.filter((c) => c.khau === k);
            if (trongKhau.length === 0) return null;
            return (
              <div key={k}>
                <p className="sticky top-0 bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                  {KHAU_LABEL[k]}
                </p>
                {trongKhau.map((c) => (
                  <label key={c.ma} className="flex items-center gap-3 border-b border-slate-100 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={tick.has(c.ma)}
                      className="h-4 w-4"
                      onChange={(e) => {
                        const n = new Set(tick);
                        if (e.target.checked) n.add(c.ma); else n.delete(c.ma);
                        setTick(n);
                      }}
                    />
                    <span className="flex-1 text-sm text-slate-800">{c.ten}</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={samSua[c.ma] ?? c.sam}
                      onChange={(e) => setSamSua({ ...samSua, [c.ma]: Number(e.target.value) })}
                      className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm tabular-nums"
                      aria-label={`SAM cua ${c.ma}`}
                    />
                    <span className="w-8 text-xs text-slate-400">phút</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Field label="Giá 1 phút">
            <input type="number" step="0.001" value={giaPhut} onChange={(e) => setGiaPhut(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Hiệu suất %">
            <input type="number" min="1" max="100" value={hieuSuat} onChange={(e) => setHieuSuat(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Phụ phí %">
            <input type="number" min="0" value={overhead} onChange={(e) => setOverhead(e.target.value)} className={inputCls} />
          </Field>
          <Field label="NPL / sp">
            <input type="number" step="0.01" value={npl} onChange={(e) => setNpl(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Biên %">
            <input type="number" min="0" max="99" value={bien} onChange={(e) => setBien(e.target.value)} className={inputCls} />
          </Field>
        </div>

        {/* Kết quả đổi NGAY khi tích — ⛔ không có nút "Tính". */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Tổng SAM</p>
            <p className="text-lg font-extrabold tabular-nums text-slate-900">{cm.tongSam}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Chi phí gia công</p>
            <p className="text-lg font-extrabold tabular-nums text-slate-900">{cm.cmMotSanPham}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Giá vốn</p>
            <p className="text-lg font-extrabold tabular-nums text-slate-900">{giaVon.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Giá chào</p>
            <p className="text-lg font-extrabold tabular-nums text-blue-700">
              {chao.hopLe ? chao.gia : 'biên không hợp lệ'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          {chon.length} công đoạn đã tích · SAM thực tế sau hiệu suất {cm.samThucTe} phút.
          Giá chào = giá vốn ÷ (1 − biên), ⛔ <strong>không</strong> phải nhân (1 + biên).
        </p>

        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Huỷ</button>
          <button
            type="button"
            className={btnPrimary}
            disabled={dang || !so.trim() || chon.length === 0}
            onClick={chot}
          >
            {dang ? 'Đang lưu…' : 'Xác nhận & tạo bản chiết tính'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
