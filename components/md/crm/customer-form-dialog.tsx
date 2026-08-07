'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus, Save, FileQuestion, PackagePlus } from 'lucide-react';
import type { z } from 'zod';

import { Modal, Field, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { TYPE } from '@/lib/design/typography';
import { createCustomerFull } from '@/app/(dashboard)/md/_actions/commercial.actions';
import { updateCustomer } from '@/app/(dashboard)/md/_actions/revisions.actions';
import { useSuaChungTu, oChu, oSo } from '@/app/(dashboard)/md/use-sua-chung-tu';
import {
  customerFormSchema, CURRENCIES, CURRENCY_LABEL, INCOTERMS, INCOTERM_LABEL,
  type CustomerFormValues,
} from '@/schemas/md';

// ============================================================================
// FORM KHÁCH HÀNG (BẢN ĐẦY ĐỦ CHO CRM 360°)
//
// Khác form khách hàng cũ ở chỗ hỏi thêm phần THƯƠNG MẠI: đồng tiền, điều kiện
// giao hàng, điều khoản thanh toán, hạn mức công nợ. Bốn thứ này quyết định
// cách lập hoá đơn và mức rủi ro công nợ — thiếu chúng thì kế toán phải đi hỏi
// lại từng đơn một.
// ============================================================================

type Input = z.input<typeof customerFormSchema>;

const DEFAULTS: Input = {
  customer_code: '', name: '', brand: '', buyer_group: '', contact_person: '',
  phone: '', email: '', country: '', address: '', tax_code: '',
  currency: 'USD', incoterm: 'FOB', payment_term: '', credit_limit: undefined, notes: '',
};

function Err({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="mt-1 block text-xs font-semibold text-rose-600">{children}</span>;
}

/**
 * 🔴 **HAI CHẾ ĐỘ TRONG MỘT HỘP THOẠI** — `suaId` khác `null` ⇒ chế độ **Sửa**
 * *(Board `BUG-5`, 07/08/2026)*.
 *
 * 🔑 Dựng một `CustomerEditDialog` riêng sẽ là **bản sao 180 dòng** của tệp
 * này, và hai bản sao ⛔ không bao giờ đứng yên cùng nhau: thêm một ô vào form
 * Tạo mà quên form Sửa ⇒ ô đó **⛔ không sửa được vĩnh viễn**. Một tệp, hai
 * chế độ — thêm ô một lần là xong cả hai.
 *
 * ⚠️ Ở chế độ Sửa, dữ liệu đổ vào form đến từ `useSuaChungTu` *(đọc nguyên
 * dòng)*, ⛔ **KHÔNG** từ dòng danh sách — xem chú thích ở hook đó.
 */
export default function CustomerFormDialog({
  open, onClose, onCreated, suaId, onTaoTiep,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  /** `null`/thiếu ⇒ Tạo mới. Có giá trị ⇒ Sửa đúng bản ghi đó. */
  suaId?: string | null;
  /**
   * 🔴 Board Directive *MD Final Input Experience* §D: *"Sau khi tạo Customer:
   * **có thể quay lại tạo RFQ/PO ngay**."*
   *
   * 🔑 MD ⛔ không tạo khách hàng để có một dòng trong danh mục — họ tạo vì
   * **sắp lập báo giá hoặc đơn hàng cho khách đó**. Đóng hộp thoại rồi bắt họ
   * tự đi tìm nút kế tiếp là cắt đứt đúng giữa một ý định.
   */
  onTaoTiep?: (dich: 'rfq' | 'po', khachId: string) => void;
}) {
  /** Khách vừa tạo xong — giữ lại để hỏi *"làm gì tiếp?"*. */
  const [vuaTao, setVuaTao] = useState<{ id: string; ten: string } | null>(null);
  const sua = useSuaChungTu('CUSTOMER', open, suaId);

  const { register, formState, reset, setError, handleSubmit, watch } =
    useForm<Input, unknown, CustomerFormValues>({
      resolver: zodResolver(customerFormSchema),
      defaultValues: DEFAULTS,
    });

  // 🔴 Đọc NGAY giá trị đang gõ để câu chú thích dưới ô nói đúng ba trạng thái
  // *(⛔ chưa khai · bằng 0 · có hạn mức)*. Board §A: *"0 = ⛔ không cho nợ ·
  // NULL = ⛔ chưa khai báo · ⛔ Không được dùng chung."* Một quy tắc mà màn
  // hình ⛔ không nói ra thì người nhập ⛔ không có cách nào biết.
  const hanMucHienTai = watch('credit_limit');
  const dongTien = watch('currency') ?? 'USD';

  useEffect(() => {
    if (!open) return;
    // ⚠️ Chờ dữ liệu về MỚI đổ. Đổ sớm thì form hiện rỗng một nhịp, và người
    // gõ nhanh có thể bấm Lưu trước khi bản ghi thật kịp về.
    if (sua.laSua) {
      if (!sua.row) return;
      reset({
        customer_code: oChu(sua.row, 'customer_code'),
        name: oChu(sua.row, 'name'),
        brand: oChu(sua.row, 'brand'),
        buyer_group: oChu(sua.row, 'buyer_group'),
        contact_person: oChu(sua.row, 'contact_person'),
        phone: oChu(sua.row, 'phone'),
        email: oChu(sua.row, 'email'),
        country: oChu(sua.row, 'country'),
        address: oChu(sua.row, 'address'),
        tax_code: oChu(sua.row, 'tax_code'),
        currency: (oChu(sua.row, 'currency') || 'USD') as Input['currency'],
        incoterm: (oChu(sua.row, 'incoterm') || 'FOB') as Input['incoterm'],
        payment_term: oChu(sua.row, 'payment_term'),
        credit_limit: oSo(sua.row, 'credit_limit'),
        notes: oChu(sua.row, 'notes'),
      });
      return;
    }
    reset(DEFAULTS);
  }, [open, sua.laSua, sua.row, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const res = suaId ? await updateCustomer(suaId, values) : await createCustomerFull(values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof Input, { type: 'server', message });
        }
      }
      toast.error(suaId ? 'Không lưu được thay đổi' : 'Không tạo được khách hàng', { description: res.message });
      return;
    }
    toast.success(suaId ? 'Đã lưu thay đổi' : 'Đã tạo khách hàng', { description: res.message });
    reset(DEFAULTS);

    // 🔴 Board §D — TẠO MỚI xong thì **⛔ chưa đóng**: hỏi *"làm gì tiếp?"*.
    // Sửa xong thì đóng luôn — sửa là việc đã trọn vẹn, ⛔ không có bước kế.
    if (!suaId && onTaoTiep && res.data?.id) {
      setVuaTao({ id: res.data.id, ten: values.name });
      await onCreated();
      return;
    }
    onClose();
    await onCreated();
  });

  const dong = () => { setVuaTao(null); onClose(); };

  // 🔴 Board §D — MÀN HÌNH "LÀM GÌ TIẾP?". ⛔ Không phải một `toast` rồi biến
  // mất: MD vừa khai xong một khách hàng, và **99% lần** việc kế tiếp là lập
  // báo giá hoặc đơn hàng cho chính khách đó.
  if (vuaTao) {
    return (
      <Modal open={open} title="Đã tạo khách hàng — làm gì tiếp?" onClose={dong}>
        <div className="space-y-3">
          <p className={`${TYPE.body} text-slate-700`}>
            Đã thêm <strong>{vuaTao.ten}</strong> vào danh mục.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              className={btnPrimary}
              onClick={() => { onTaoTiep?.('rfq', vuaTao.id); setVuaTao(null); }}
            >
              <FileQuestion className="h-4 w-4" aria-hidden="true" />
              Nhận yêu cầu báo giá
            </button>
            <button
              type="button"
              className={btnPrimary}
              onClick={() => { onTaoTiep?.('po', vuaTao.id); setVuaTao(null); }}
            >
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
              Tạo đơn hàng (PO)
            </button>
          </div>
          <button type="button" className={`${btnGhost} w-full`} onClick={dong}>
            Xong — quay lại danh sách khách hàng
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} title={suaId ? 'Sửa khách hàng' : 'Thêm khách hàng'} onClose={onClose} wide>
      {sua.loi && (
        <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {sua.loi}
        </p>
      )}
      {sua.dangNap && (
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Đang nạp hồ sơ đầy đủ...
        </p>
      )}
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mã khách hàng" hint="tự chuyển in hoa">
            <input className={inputCls} placeholder="KH-001" {...register('customer_code')} />
            <Err>{formState.errors.customer_code?.message}</Err>
          </Field>

          <Field label="Tên khách hàng">
            <input className={inputCls} placeholder="Uniqlo Vietnam Co., Ltd" {...register('name')} />
            <Err>{formState.errors.name?.message}</Err>
          </Field>

          <Field label="Thương hiệu">
            <input className={inputCls} placeholder="Uniqlo" {...register('brand')} />
            <Err>{formState.errors.brand?.message}</Err>
          </Field>

          <Field label="Tập đoàn / Nhóm mua">
            <input className={inputCls} placeholder="Fast Retailing" {...register('buyer_group')} />
            <Err>{formState.errors.buyer_group?.message}</Err>
          </Field>

          <Field label="Người liên hệ chính">
            <input className={inputCls} {...register('contact_person')} />
            <Err>{formState.errors.contact_person?.message}</Err>
          </Field>

          <Field label="Quốc gia">
            <input className={inputCls} placeholder="Nhật Bản" {...register('country')} />
            <Err>{formState.errors.country?.message}</Err>
          </Field>

          <Field label="Điện thoại">
            <input className={inputCls} inputMode="tel" {...register('phone')} />
            <Err>{formState.errors.phone?.message}</Err>
          </Field>

          <Field label="Email">
            <input className={inputCls} type="email" {...register('email')} />
            <Err>{formState.errors.email?.message}</Err>
          </Field>

          <Field label="Đồng tiền giao dịch">
            <select className={inputCls} {...register('currency')}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{CURRENCY_LABEL[c]}</option>
              ))}
            </select>
            <Err>{formState.errors.currency?.message}</Err>
          </Field>

          <Field label="Điều kiện giao hàng mặc định">
            <select className={inputCls} {...register('incoterm')}>
              {INCOTERMS.map((i) => (
                <option key={i} value={i}>{INCOTERM_LABEL[i]}</option>
              ))}
            </select>
            <Err>{formState.errors.incoterm?.message}</Err>
          </Field>

          <Field label="Điều khoản thanh toán">
            <input className={inputCls} placeholder="T/T 30 ngày sau B/L" {...register('payment_term')} />
            <Err>{formState.errors.payment_term?.message}</Err>
          </Field>

          {/* 🔴 **`0` VÀ ĐỂ TRỐNG LÀ HAI ĐIỀU KHÁC NHAU** — Board Directive
              *MD Final Input Experience* §A:
                `0`    = **⛔ không cho nợ** *(đã quyết, hạn mức bằng không)*
                `NULL` = **⛔ chưa khai báo** *(chưa ai quyết)*
              *"⛔ Không được dùng chung."*

              ⚠️ Phân biệt này **⛔ không tự có** — nó phải đúng ở CẢ BA tầng:
                · ô nhập  → `''` ⇒ `undefined`, ⛔ KHÔNG ⇒ `0`
                · lược đồ → `nonNegativeDecimal` chấp nhận `0`
                            *(bản cũ dùng `positiveDecimal` và **bác** `0` ⇒
                             5/17 khách hàng ⛔ không lưu nổi — lỗi thật, UAT
                             07/08 tìm ra)*
                · action  → `v.credit_limit ?? null` giữ nguyên `0`
              Sai một tầng là hai nghĩa nhập lại làm một. */}
          <Field
            label="Hạn mức công nợ"
            hint="để TRỐNG = ⛔ chưa khai báo · nhập 0 = ⛔ không cho nợ"
          >
            <input
              className={inputCls}
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              placeholder="để trống nếu chưa khai"
              // ⚠️ `''` ⇒ `undefined`, ⛔ KHÔNG ⇒ `Number('')` = `0`. Ép rỗng
              // thành 0 là biến *"⛔ chưa khai"* thành *"⛔ không cho nợ"* —
              // một quyết định tín dụng ⛔ chưa ai đưa ra.
              {...register('credit_limit', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.credit_limit?.message}</Err>
            <span className={`mt-1 block ${TYPE.caption} text-slate-500`}>
              {hanMucHienTai === undefined
                ? '⚪ Chưa khai báo hạn mức'
                : hanMucHienTai === 0
                  ? '🔒 Hạn mức 0 — khách này ⛔ không được nợ'
                  : `Hạn mức ${hanMucHienTai.toLocaleString('vi-VN')} ${dongTien}`}
            </span>
          </Field>

          <Field label="Mã số thuế">
            <input className={inputCls} {...register('tax_code')} />
            <Err>{formState.errors.tax_code?.message}</Err>
          </Field>

          <Field label="Địa chỉ">
            <input className={inputCls} {...register('address')} />
            <Err>{formState.errors.address?.message}</Err>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Ghi chú">
            <textarea className={`${inputCls} min-h-[60px] resize-y`} {...register('notes')} />
            <Err>{formState.errors.notes?.message}</Err>
          </Field>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={formState.isSubmitting}>
            Hủy
          </button>
          <button
            type="submit"
            className={btnPrimary}
            // ⚠️ Khoá luôn khi ĐANG NẠP ở chế độ Sửa: bấm Lưu lúc form còn
            // rỗng sẽ ghi rỗng đè lên bản ghi thật.
            disabled={formState.isSubmitting || sua.dangNap}
          >
            {formState.isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
              : suaId
                ? <><Save className="h-4 w-4" /> Lưu thay đổi</>
                : <><Plus className="h-4 w-4" /> Thêm khách hàng</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
