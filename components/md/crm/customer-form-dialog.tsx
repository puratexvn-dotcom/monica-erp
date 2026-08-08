'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Loader2, Plus, Save, FileQuestion, PackagePlus,
  Building2, Contact, Shirt, Banknote, CreditCard,
} from 'lucide-react';
import type { z } from 'zod';

import { Modal, Field, NhomGap, inputCls, btnGhost, btnPrimary } from '@/components/ui';
import { TYPE } from '@/lib/design/typography';
import { createCustomerFull } from '@/app/(dashboard)/md/_actions/commercial.actions';
import { updateCustomer } from '@/app/(dashboard)/md/_actions/revisions.actions';
import { useSuaChungTu, oChu, oSo } from '@/app/(dashboard)/md/use-sua-chung-tu';
import {
  customerFormSchema, CURRENCIES, CURRENCY_LABEL, INCOTERMS, INCOTERM_LABEL,
  type CustomerFormValues,
} from '@/schemas/md';

// ============================================================================
// FORM KHÁCH HÀNG — HỒ SƠ B2B NGÀNH MAY
//
// 🔴 **BOARD DIRECTIVE 08/08/2026 · *FIX MD INPUT EXPERIENCE***
//   > *"CUSTOMER FORM — Bổ sung chuẩn B2B garment: **Buyer information ·
//   > Commercial profile · Payment profile · Credit rule · Product category ·
//   > Market**."*
//   > *"UX — **⛔ Không tạo popup dài. Chia section/tab.**"*
//
// ─── ⚠️ NGUYÊN TRẠNG BOARD VỪA CHỤP MÀN HÌNH ───────────────────────────
// **15 ô phẳng trong một hộp thoại cuộn dài**, ⛔ không nhóm, ⛔ không nhãn
// phân đoạn. Người nhập ⛔ không biết mình đang khai *hành chính* hay *tín
// dụng*, và hai ô quyết định rủi ro tiền bạc *(hạn mức · điều khoản thanh
// toán)* nằm lẫn giữa số điện thoại và địa chỉ.
//
// ─── NĂM NHÓM, PHỦ ĐỦ SÁU MỤC BOARD GỌI TÊN ────────────────────────────
//   Ⓐ Buyer information          Ⓑ Liên hệ & pháp lý
//   Ⓒ Product category · Market  Ⓓ Commercial profile
//   Ⓔ Payment profile · Credit rule
//
// 🔑 Bốn cột **thật sự còn thiếu** — `product_categories` · `market` ·
// `credit_term_days` · `buyer_since` — do migration `054` thêm. Mười một ô còn
// lại **đã có cột từ trước**; việc của bản vá này là **xếp chúng lại cho đọc
// được**, ⛔ không phải đẻ thêm cột cho đủ danh sách.
// ============================================================================

type Input = z.input<typeof customerFormSchema>;

/** ⚠️ **GỢI Ý, ⛔ KHÔNG phải danh mục chuẩn.** CSDL ⛔ không có ràng buộc nào
 *  trên hai cột này. Chúng chỉ để bớt gõ và bớt lệch chính tả — một nhà máy
 *  nhận mặt hàng lạ vẫn gõ tự do được, và đó là chủ ý: chặn bằng một danh sách
 *  do người viết mã đoán ra là ép nghiệp vụ theo mã. */
const GOI_Y_NHOM_HANG = [
  'Áo sơ mi', 'Áo khoác', 'Áo thun', 'Quần tây', 'Quần jean',
  'Đầm / Váy', 'Đồ thể thao', 'Đồ bảo hộ', 'Đồ lót', 'Đồ trẻ em',
] as const;

const GOI_Y_THI_TRUONG = ['EU', 'US', 'JP', 'KR', 'CN', 'UK', 'AU', 'CA', 'Nội địa'] as const;

const DEFAULTS: Input = {
  customer_code: '', name: '', brand: '', buyer_group: '', contact_person: '',
  phone: '', email: '', country: '', address: '', tax_code: '',
  currency: 'USD', incoterm: 'FOB', payment_term: '', credit_limit: undefined,
  credit_term_days: undefined, product_categories: '', market: '', buyer_since: '',
  notes: '',
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
  const soNgayNo = watch('credit_term_days');
  const dongTien = watch('currency') ?? 'USD';

  // 🔑 Board hỏi *"Credit rule"* — **một quy tắc**, ⛔ không phải hai con số rời.
  // Câu này ghép chúng lại thành đúng một phát biểu đọc được, và nói thẳng khi
  // quy tắc mới có **một nửa** — trạng thái nguy hiểm nhất, vì nó trông như đã
  // khai xong.
  const tomTatTinDung = useMemo(() => {
    const coHanMuc = hanMucHienTai !== undefined;
    const coSoNgay = soNgayNo !== undefined;
    if (!coHanMuc && !coSoNgay) return '⚪ Chưa khai quy tắc tín dụng';
    if (coHanMuc && hanMucHienTai === 0) return '🔒 Hạn mức 0 — khách này ⛔ không được nợ';
    if (coHanMuc && !coSoNgay) {
      return `⚠️ Hạn mức ${hanMucHienTai.toLocaleString('vi-VN')} ${dongTien} nhưng ⛔ CHƯA khai số ngày `
        + '— kế toán ⛔ không tính được tuổi nợ';
    }
    if (!coHanMuc && coSoNgay) {
      return `⚠️ Cho nợ ${soNgayNo} ngày nhưng ⛔ CHƯA khai hạn mức — ⛔ không có trần rủi ro`;
    }
    if (soNgayNo === 0) {
      return `Hạn mức ${(hanMucHienTai ?? 0).toLocaleString('vi-VN')} ${dongTien} · trả NGAY (COD)`;
    }
    return `✅ Cho nợ tối đa ${(hanMucHienTai ?? 0).toLocaleString('vi-VN')} ${dongTien}, trong ${soNgayNo} ngày`;
  }, [hanMucHienTai, soNgayNo, dongTien]);

  // Ⓐ Ⓑ mở sẵn — đủ để lưu một khách hàng hợp lệ. Ba nhóm sau gấp lại nhưng
  // **vẫn hiện tóm tắt**, nên người dùng biết trong đó đang có gì.
  const [mo, setMo] = useState({ a: true, b: true, c: false, d: false, e: false });
  const bat = (k: keyof typeof mo) => () => setMo((v) => ({ ...v, [k]: !v[k] }));

  useEffect(() => {
    if (!open) return;
    setMo({ a: true, b: true, c: false, d: false, e: false });
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
        // 🔴 Bốn ô hồ sơ B2B — **phải đổ ở đây nữa**. Bỏ sót một dòng ở khối
        // này là ô đó mở ra **rỗng** rồi ghi rỗng đè lên dữ liệu thật ngay lần
        // Lưu đầu tiên — mất dữ liệu lặng lẽ, ⛔ không lỗi nào báo.
        credit_term_days: oSo(sua.row, 'credit_term_days'),
        product_categories: oChu(sua.row, 'product_categories'),
        market: oChu(sua.row, 'market'),
        buyer_since: oChu(sua.row, 'buyer_since'),
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
      <form onSubmit={onSubmit} noValidate className="space-y-2.5">
        {/* ═══ Ⓐ BUYER INFORMATION ══════════════════════════════════════ */}
        <NhomGap ten="Ⓐ Thông tin khách mua (Buyer information)" icon={Building2}
          mo={mo.a} onMo={bat('a')} phu={watch('name') || undefined}>
          <Field label="Mã khách hàng" hint="tự chuyển in hoa">
            <input className={inputCls} placeholder="KH-001" {...register('customer_code')} />
            <Err>{formState.errors.customer_code?.message}</Err>
          </Field>

          <Field label="Tên khách hàng">
            <input className={inputCls} placeholder="Uniqlo Vietnam Co., Ltd" {...register('name')} />
            <Err>{formState.errors.name?.message}</Err>
          </Field>

          <Field label="Thương hiệu (Brand)">
            <input className={inputCls} placeholder="Uniqlo" {...register('brand')} />
            <Err>{formState.errors.brand?.message}</Err>
          </Field>

          <Field label="Tập đoàn / Nhóm mua (Buyer group)">
            <input className={inputCls} placeholder="Fast Retailing" {...register('buyer_group')} />
            <Err>{formState.errors.buyer_group?.message}</Err>
          </Field>

          <Field label="Quốc gia">
            <input className={inputCls} placeholder="Nhật Bản" {...register('country')} />
            <Err>{formState.errors.country?.message}</Err>
          </Field>

          {/* 🔑 *"Khách từ năm nào"* ⛔ không phải trang trí — nó là thứ dùng để
              xếp thứ tự ưu tiên khi chuyền quá tải và hai đơn cùng kẹt ngày. */}
          <Field label="Khách hàng từ" hint="để trống nếu ⛔ chưa rõ">
            <input className={inputCls} type="date" {...register('buyer_since')} />
            <Err>{formState.errors.buyer_since?.message}</Err>
          </Field>
        </NhomGap>

        {/* ═══ Ⓑ LIÊN HỆ & PHÁP LÝ ══════════════════════════════════════ */}
        <NhomGap ten="Ⓑ Liên hệ & pháp lý" icon={Contact}
          mo={mo.b} onMo={bat('b')} phu={watch('contact_person') || undefined}>
          <Field label="Người liên hệ chính">
            <input className={inputCls} {...register('contact_person')} />
            <Err>{formState.errors.contact_person?.message}</Err>
          </Field>

          <Field label="Điện thoại">
            <input className={inputCls} inputMode="tel" {...register('phone')} />
            <Err>{formState.errors.phone?.message}</Err>
          </Field>

          <Field label="Email">
            <input className={inputCls} type="email" {...register('email')} />
            <Err>{formState.errors.email?.message}</Err>
          </Field>

          <Field label="Mã số thuế">
            <input className={inputCls} {...register('tax_code')} />
            <Err>{formState.errors.tax_code?.message}</Err>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Địa chỉ">
              <input className={inputCls} {...register('address')} />
              <Err>{formState.errors.address?.message}</Err>
            </Field>
          </div>
        </NhomGap>

        {/* ═══ Ⓒ PRODUCT CATEGORY · MARKET ══════════════════════════════ */}
        {/* 🔴 Hai mục Board gọi tên riêng — và là hai mục **⛔ CHƯA TỪNG CÓ
            CỘT** trước migration `054`. Chúng ⛔ không phải thông tin hành
            chính: nhóm hàng quyết định lọc mã hàng và xếp năng lực chuyền, thị
            trường quyết định **tiêu chuẩn kiểm và bộ chứng từ xuất khẩu**. */}
        <NhomGap ten="Ⓒ Nhóm hàng & thị trường (Product category · Market)" icon={Shirt}
          mo={mo.c} onMo={bat('c')}
          phu={[watch('product_categories'), watch('market')].filter(Boolean).join(' · ') || undefined}>
          <Field label="Nhóm hàng khách đặt" hint="ngăn cách bằng dấu phẩy">
            <input
              className={inputCls} list="goi-y-nhom-hang"
              placeholder="Áo khoác, Quần tây"
              {...register('product_categories')}
            />
            {/* ⚠️ **GỢI Ý, ⛔ KHÔNG phải danh mục bắt buộc.** CSDL ⛔ không có
                ràng buộc nào trên cột này, nên gõ giá trị ngoài danh sách vẫn
                lưu được — và đó là chủ ý: một nhà máy nhận mặt hàng lạ ⛔ không
                nên bị chặn bởi một danh sách do người viết mã đoán ra. */}
            <datalist id="goi-y-nhom-hang">
              {GOI_Y_NHOM_HANG.map((g) => <option key={g} value={g} />)}
            </datalist>
            <Err>{formState.errors.product_categories?.message}</Err>
          </Field>

          <Field label="Thị trường đích" hint="quyết định tiêu chuẩn kiểm và chứng từ">
            <input
              className={inputCls} list="goi-y-thi-truong"
              placeholder="EU, US"
              {...register('market')}
            />
            <datalist id="goi-y-thi-truong">
              {GOI_Y_THI_TRUONG.map((g) => <option key={g} value={g} />)}
            </datalist>
            <Err>{formState.errors.market?.message}</Err>
          </Field>
        </NhomGap>

        {/* ═══ Ⓓ COMMERCIAL PROFILE ═════════════════════════════════════ */}
        <NhomGap ten="Ⓓ Hồ sơ thương mại (Commercial profile)" icon={Banknote}
          mo={mo.d} onMo={bat('d')} phu={`${dongTien} · ${watch('incoterm') ?? 'FOB'}`}>
          <Field label="Đồng tiền giao dịch" hint="tự áp cho mọi đơn của khách này">
            <select className={inputCls} {...register('currency')}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{CURRENCY_LABEL[c]}</option>
              ))}
            </select>
            <Err>{formState.errors.currency?.message}</Err>
          </Field>

          <Field label="Điều kiện giao hàng mặc định (Incoterm)">
            <select className={inputCls} {...register('incoterm')}>
              {INCOTERMS.map((i) => (
                <option key={i} value={i}>{INCOTERM_LABEL[i]}</option>
              ))}
            </select>
            <Err>{formState.errors.incoterm?.message}</Err>
          </Field>

          <div className="sm:col-span-2">
            <p className={`rounded-lg bg-slate-50 px-3 py-2 ${TYPE.caption} text-slate-600`}>
              🔑 Hai giá trị này <strong>tự điền</strong> vào mọi đơn hàng lập cho khách này — MD ⛔ không
              phải chọn lại từng lần. Sửa ở đây là sửa cho **các đơn lập sau**; đơn cũ giữ nguyên giá trị
              đã chốt lúc lập.
            </p>
          </div>
        </NhomGap>

        {/* ═══ Ⓔ PAYMENT PROFILE · CREDIT RULE ══════════════════════════ */}
        <NhomGap ten="Ⓔ Thanh toán & quy tắc tín dụng (Payment profile · Credit rule)"
          icon={CreditCard} mo={mo.e} onMo={bat('e')} phu={tomTatTinDung}>
          <div className="sm:col-span-2">
            <Field label="Điều khoản thanh toán (Payment term)">
              <input className={inputCls} placeholder="T/T 30 ngày sau B/L" {...register('payment_term')} />
              <Err>{formState.errors.payment_term?.message}</Err>
            </Field>
          </div>

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
          </Field>

          {/* 🔴 **NỬA CÒN LẠI CỦA QUY TẮC TÍN DỤNG** — Board 08/08/2026.
              *"Cho nợ 100.000 USD"* ⛔ **không** nói **bao lâu**. Thiếu số ngày
              thì kế toán ⛔ không tính nổi tuổi nợ, và *"Credit rule"* mà Board
              hỏi mới có một nửa. Cùng luật ba trạng thái với hạn mức. */}
          <Field label="Số ngày cho nợ" hint="để TRỐNG = ⛔ chưa khai · nhập 0 = trả ngay (COD)">
            <input
              className={inputCls}
              type="number"
              min={0}
              max={365}
              step={1}
              inputMode="numeric"
              placeholder="30"
              {...register('credit_term_days', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.credit_term_days?.message}</Err>
          </Field>

          <div className="sm:col-span-2">
            <p className={`rounded-lg bg-slate-50 px-3 py-2 ${TYPE.caption} text-slate-600`}>
              {tomTatTinDung}
            </p>
          </div>
        </NhomGap>

        <div>
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
