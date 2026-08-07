'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Loader2, PackagePlus, Fingerprint, Shirt, Banknote, Truck, UserCog,
} from 'lucide-react';
import type { z } from 'zod';

import { Modal, Field, inputCls, btnGhost, btnPrimary, SAC_NHOM } from '@/components/ui';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { createPo } from './_actions/po.actions';
import type { OChonKhachHang } from './_services/commercial.service';
import {
  poFormSchema, vnToday,
  CURRENCIES, CURRENCY_LABEL, ORDER_TYPES, ORDER_TYPE_LABEL,
  INCOTERMS, INCOTERM_LABEL, SHIP_MODES, SHIP_MODE_LABEL,
  PO_STATUSES, PO_STATUS_LABEL,
  type PoFormValues, type StyleRow,
} from '@/schemas/md';

// ============================================================================
// 🔴 ORDER MASTER — **BOARD DIRECTIVE *MD FINAL INPUT EXPERIENCE* §B · §C · §D**
//
//   > *"Biến form tạo PO thành **Order Master**."*
//
// ─── ⚠️ LỖ HỔNG ĐANG VÁ ─────────────────────────────────────────────────
// Nút *"+ Tạo PO"* của MD Workspace đang mở `orders/po-form-dialog.tsx` —
// biểu mẫu **đời đầu**, chỉ có **8 ô**, và hai ô quan trọng nhất là **CHỮ GÕ
// TAY**: *"Mã khách hàng / Tên khách"* và *"Style (mã hàng)"*.
//
// 🔴 Nghĩa là mọi PO lập từ màn hình chính đều **⛔ KHÔNG gắn `customer_id`,
// ⛔ KHÔNG gắn `style_id`** — chúng chỉ có chuỗi tên. Hậu quả đo được:
//   · PO ⛔ không tra ngược được về hồ sơ khách *(CRM 360° trống)*
//   · PO ⛔ không lấy được định mức NPL / SAM từ mã hàng ⇒ ⛔ không sinh được
//     yêu cầu NPL lẫn lệnh sản xuất
//   · gõ *"Nordic EU"* và *"NORDIC-EU"* thành **hai khách hàng** trong báo cáo
//
// 🔑 Trong khi đó `schemas/md/order.schema.ts` **ĐÃ CÓ SẴN** biểu mẫu đầy đủ
// và `po.actions.ts::createPo` **đã biết** gắn khoá ngoại + **sinh lịch T&A 15
// mốc**. Cả hai nằm đó từ trước, chỉ **⛔ chưa có màn hình nào gọi tới**.
// Tệp này nối phần còn thiếu — ⛔ **không** viết lại nghiệp vụ.
//
// ─── §C · NĂM NHÓM, ⛔ KHÔNG PHẢI MỘT DANH SÁCH 20 Ô ────────────────────
//   ① Order Identity  ② Product Information  ③ Commercial
//   ④ Delivery        ⑤ Ownership
// Board: *"Popup ⛔ không được quá dài."* ⇒ mỗi nhóm **gấp/mở được**, và mở
// sẵn đúng ba nhóm đủ để lưu; hai nhóm còn lại bung ra khi cần.
//
// ─── 🔴 BỐN Ô BOARD YÊU CẦU MÀ **⛔ KHÔNG** ĐƯỢC LƯU VÀO `orders` ───────
//   Buyer · Brand · Payment Term  → **ĐỌC TỪ HỒ SƠ KHÁCH HÀNG**
//     Chép sang `orders` là dựng nguồn sự thật thứ hai: khách đổi điều khoản
//     thanh toán thì 200 PO cũ vẫn mang giá trị cũ và ⛔ không ai biết cái nào
//     đúng. `P-ZERODUP` + CLAUDE.md §2.5 *(⛔ không lưu dữ liệu tính được)*.
//
//   Inspection Date · Ship Date → **ĐÃ LÀ MỐC T&A**
//     🔑 ĐO ĐƯỢC, ⛔ không suy đoán: `ta_template_items` của mẫu `FOB` có
//     **`Kiểm AQL cuối` (−7 ngày)** và **`Đóng container - xuất hàng` (−0
//     ngày)**. `createPo` sinh đủ 15 mốc ngay khi tạo đơn. Thêm hai cột
//     `inspection_date`/`ship_date` vào `orders` là **chép lại hai dòng đã có**
//     — rồi hai chỗ lệch nhau và ⛔ không ai biết chuyền phải tin cái nào.
//     ⇒ Form **hiện chúng dưới dạng XEM TRƯỚC** *(tính từ ngày giao)*, và sau
//     khi tạo, chúng là **mốc sửa được** trong tab *Lịch trình T&A* của PO360.
//
// ⚠️ **Merchandiser Owner** = người lập đơn = `created_by`, `createPo` đã ghi.
// `orders` ⛔ chưa có cột *chuyển giao* chủ sở hữu; đổi chủ là việc của
// Assignment, ⛔ không phải một ô trong form tạo. Hiện tên, ⛔ không cho sửa.
//
// ⚠️ Tệp này ⛔ **KHÔNG chứa một literal màu hay cỡ chữ nào** — bánh cóc
// `TD-07`/`TD-10`. Sắc từ `SAC_NHOM`, thang chữ từ `TYPE`/`FONT_WEIGHT`.
//
// ⚠️ Nằm ở `app/…/md/`, ⛔ không ở `components/`: nó nhập `createPo` từ `app/`,
// mà bài kiểm ③ chặn `components/ → app/` ở **39 tệp** *(`AD-01`)*.
// ============================================================================

type Input = z.input<typeof poFormSchema>;

function Err({ children }: { children?: string }) {
  if (!children) return null;
  return <span className={`mt-1 block ${SAC_NHOM.risk.chu} ${TYPE.caption}`}>{children}</span>;
}

/** Cộng/trừ ngày trên chuỗi `YYYY-MM-DD`. ⛔ KHÔNG dùng `new Date()` + số ma
 *  thuật múi giờ — bài kiểm kiến trúc ④ cấm, và giờ VN có nguồn riêng. */
function themNgay(ngay: string, so: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return '';
  const d = new Date(`${ngay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + so);
  return d.toISOString().slice(0, 10);
}

/** Một nhóm ô — §C. Gấp được, và **nhớ trạng thái mở** trong một lượt điền. */
function Nhom({
  ten, icon: Icon, mo, onMo, children, phu,
}: {
  ten: string;
  icon: typeof Fingerprint;
  mo: boolean;
  onMo: () => void;
  children: React.ReactNode;
  phu?: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={onMo}
        aria-expanded={mo}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Icon className={`h-4 w-4 shrink-0 ${SAC_NHOM.action.chu}`} aria-hidden="true" />
        <span className={`text-slate-800 ${TYPE.label} ${FONT_WEIGHT.bold}`}>{ten}</span>
        {phu && <span className={`truncate text-slate-400 ${TYPE.caption}`}>{phu}</span>}
        <span className={`ml-auto text-slate-400 ${TYPE.caption}`}>{mo ? '−' : '+'}</span>
      </button>
      {mo && <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-3 sm:grid-cols-2">{children}</div>}
    </section>
  );
}

/** Số ngày trước ngày giao của hai mốc T&A mà Board hỏi tên — đọc từ mẫu `FOB`
 *  đang chạy trên CSDL *(`Kiểm AQL cuối` · `Đóng container - xuất hàng`)*.
 *
 *  ⚠️ Đây là **XEM TRƯỚC**, ⛔ không phải nguồn sự thật. Mốc thật do
 *  `seedMilestones()` sinh từ chính bảng `ta_template_items` lúc tạo đơn, và
 *  sửa được ở PO360. Hai con số dưới đây chỉ để MD **thấy ngay** lịch sẽ rơi
 *  vào ngày nào trước khi bấm Lưu. Mẫu đổi ⇒ mốc thật đổi theo, xem trước lệch
 *  đi vài ngày — chấp nhận được, và nhãn đã nói rõ *"dự kiến"*. */
const XEM_TRUOC = { kiemHang: 7, xuatHang: 0 } as const;

export default function PoMasterDialog({
  open, onClose, onCreated, customers, styles, seasons, khachMacDinh, tenNguoiLap,
}: {
  open: boolean;
  onClose: () => void;
  /** Nhận id PO vừa tạo — §D: *"⛔ Không quay Dashboard. Đi thẳng PO360."* */
  onCreated: (poId: string, poNumber: string) => void | Promise<void>;
  customers: readonly OChonKhachHang[];
  styles: readonly StyleRow[];
  seasons: ReadonlyArray<{ id: string; code: string; name: string | null }>;
  /** Khách chọn sẵn khi đi thẳng từ màn hình *"vừa tạo khách hàng"* (§D). */
  khachMacDinh?: string | null;
  tenNguoiLap: string;
}) {
  // ⚠️ `total_quantity` là **số bắt buộc** trong lược đồ, nên kiểu Ô NHẬP đòi
  // `number`. Nhưng ô trống lúc mở form là trạng thái THẬT — ép `0` vào đó sẽ
  // hiện *"0"* sẵn và người dùng dễ lưu nhầm một đơn 0 sản phẩm.
  // 🔑 Khai `Partial<Input>` cho giá trị mặc định, rồi ép đúng MỘT chỗ này —
  // ⛔ không rải `as` khắp nơi, và ⛔ không nới lược đồ.
  const DEFAULTS = useMemo(() => ({
    po_number: '', style_id: '', customer_id: khachMacDinh ?? '', season_id: '', costing_id: '',
    total_quantity: undefined, order_type: 'FOB', incoterm: '', currency: 'USD',
    unit_price: undefined,
    order_date: vnToday(), delivery_date: '', ex_factory_date: '',
    factory_name: '', subcontractor_id: '', ship_mode: '',
    status: 'DRAFT', notes: '', evidence_path: '',
  } as unknown as Input), [khachMacDinh]);

  const { register, formState, reset, setError, handleSubmit, watch, setValue } =
    useForm<Input, unknown, PoFormValues>({
      resolver: zodResolver(poFormSchema),
      defaultValues: DEFAULTS,
    });

  // §C — ba nhóm đầu mở sẵn (đủ để lưu một đơn hợp lệ), hai nhóm sau gấp lại.
  // 🔑 Board: *"Popup ⛔ không được quá dài."* Mở hết 20 ô là quay lại đúng cái
  // đang sửa; gấp hết thì người dùng ⛔ không biết còn gì bên dưới.
  const [mo, setMo] = useState({ id: true, sp: true, tm: true, gh: false, sh: false });
  const bat = (k: keyof typeof mo) => () => setMo((v) => ({ ...v, [k]: !v[k] }));

  useEffect(() => { if (open) { reset(DEFAULTS); setMo({ id: true, sp: true, tm: true, gh: false, sh: false }); } }, [open, reset, DEFAULTS]);

  const khachId = watch('customer_id');
  const ngayGiao = watch('delivery_date');
  const soLuong = watch('total_quantity');
  const donGia = watch('unit_price');

  // 🔴 Buyer · Brand · Payment Term — **ĐỌC** từ hồ sơ khách, ⛔ KHÔNG lưu lại.
  const khach = useMemo(() => customers.find((c) => c.id === khachId) ?? null, [customers, khachId]);

  // Chọn khách ⇒ áp mặc định thương mại CỦA KHÁCH ĐÓ. ⚠️ Chỉ áp cho ô người
  // dùng ⛔ CHƯA đụng tới — ghi đè lựa chọn họ vừa gõ là thô lỗ và dễ ra giá sai.
  useEffect(() => {
    if (!khach) return;
    if (khach.currency) setValue('currency', khach.currency as Input['currency'], { shouldDirty: false });
    if (khach.incoterm) setValue('incoterm', khach.incoterm as Input['incoterm'], { shouldDirty: false });
  }, [khach, setValue]);

  const tongTien = useMemo(() => {
    const q = Number(soLuong); const p = Number(donGia);
    return Number.isFinite(q) && Number.isFinite(p) && q > 0 && p > 0 ? q * p : null;
  }, [soLuong, donGia]);

  const onSubmit = handleSubmit(async (values) => {
    const res = await createPo(values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setError(name as keyof Input, { type: 'server', message });
        }
      }
      toast.error('Không tạo được đơn hàng', { description: res.message });
      return;
    }
    toast.success('Đã tạo đơn hàng', { description: res.message });
    reset(DEFAULTS);
    onClose();
    // 🔴 §D — *"⛔ Không quay Dashboard. Đi thẳng PO360."*
    if (res.data?.id) await onCreated(res.data.id, values.po_number);
  });

  const chuPhu = `text-slate-500 ${TYPE.caption}`;

  return (
    <Modal open={open} title="Tạo đơn hàng (Order Master)" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate className="space-y-2.5">
        {customers.length === 0 && (
          <p className={`rounded-lg px-3 py-2 ${SAC_NHOM.today.nen} ${SAC_NHOM.today.chu} ${TYPE.caption}`}>
            ⛔ Chưa có khách hàng nào đang giao dịch. Thêm khách hàng trước — đơn hàng phải gắn với một khách.
          </p>
        )}
        {styles.length === 0 && (
          <p className={`rounded-lg px-3 py-2 ${SAC_NHOM.today.nen} ${SAC_NHOM.today.chu} ${TYPE.caption}`}>
            ⛔ Chưa có mã hàng nào. Mã hàng mang định mức NPL và SAM — thiếu nó thì ⛔ không sinh được
            yêu cầu vật tư lẫn lệnh sản xuất.
          </p>
        )}

        {/* ═══ ① ORDER IDENTITY ═══════════════════════════════════════════ */}
        <Nhom ten="① Nhận diện đơn hàng" icon={Fingerprint} mo={mo.id} onMo={bat('id')}
          phu={khach ? `${khach.customer_code} — ${khach.name}` : undefined}>
          <Field label="Mã PO" hint="tự chuyển in hoa">
            <input className={inputCls} placeholder="PO-2026-001" {...register('po_number')} />
            <Err>{formState.errors.po_number?.message}</Err>
          </Field>

          {/* 🔴 Ô CHỌN, ⛔ KHÔNG phải ô gõ tay. Đây là ô sửa lỗi lớn nhất của
              biểu mẫu cũ: gõ tay ⇒ PO ⛔ không có `customer_id` ⇒ CRM 360°
              trống và báo cáo tách một khách thành nhiều. */}
          <Field label="Khách hàng">
            <select className={inputCls} {...register('customer_id')}>
              <option value="">— Chọn khách hàng —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.customer_code} — {c.name}</option>
              ))}
            </select>
            <Err>{formState.errors.customer_id?.message}</Err>
          </Field>

          {/* Buyer · Brand — ĐỌC từ hồ sơ khách. ⛔ Không ô nhập: một ô nhập ở
              đây là mời người dùng gõ giá trị thứ hai khác hồ sơ gốc. */}
          <Field label="Buyer (tập đoàn / nhóm mua)">
            <p className={`${inputCls} bg-slate-50 text-slate-600`}>
              {khach?.buyer_group || (khach ? '⚪ hồ sơ khách chưa khai' : '— chọn khách hàng trước —')}
            </p>
            <span className={chuPhu}>lấy từ hồ sơ khách hàng · ⛔ không lưu lại trên đơn</span>
          </Field>
          <Field label="Brand (thương hiệu)">
            <p className={`${inputCls} bg-slate-50 text-slate-600`}>
              {khach?.brand || (khach ? '⚪ hồ sơ khách chưa khai' : '— chọn khách hàng trước —')}
            </p>
            <span className={chuPhu}>lấy từ hồ sơ khách hàng · ⛔ không lưu lại trên đơn</span>
          </Field>

          <Field label="Mùa vụ (Season)">
            <select className={inputCls} {...register('season_id')}>
              <option value="">— Chưa gắn —</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.code}{s.name ? ` — ${s.name}` : ''}</option>
              ))}
            </select>
            <Err>{formState.errors.season_id?.message}</Err>
          </Field>

          <Field label="Hình thức gia công (Order Type)">
            <select className={inputCls} {...register('order_type')}>
              {ORDER_TYPES.map((t) => <option key={t} value={t}>{ORDER_TYPE_LABEL[t]}</option>)}
            </select>
            <Err>{formState.errors.order_type?.message}</Err>
          </Field>
        </Nhom>

        {/* ═══ ② PRODUCT INFORMATION ══════════════════════════════════════ */}
        <Nhom ten="② Thông tin sản phẩm" icon={Shirt} mo={mo.sp} onMo={bat('sp')}>
          <Field label="Mã hàng (Style)" hint="mang định mức NPL và SAM">
            <select className={inputCls} {...register('style_id')}>
              <option value="">— Chọn mã hàng —</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>{s.style_no} — {s.style_name}</option>
              ))}
            </select>
            <Err>{formState.errors.style_id?.message}</Err>
          </Field>

          <Field label="Số lượng (pcs)">
            <input
              className={inputCls} type="number" min={1} step={1} inputMode="numeric"
              {...register('total_quantity', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.total_quantity?.message}</Err>
          </Field>

          {/* ⚠️ Bảng MÀU × SIZE, BOM, NPL, Sản xuất, QA, Xuất hàng CỐ Ý ⛔
              KHÔNG có ở đây — Board §B liệt kê đúng chúng vào diện *"⛔ không
              đưa vào popup"*. Chúng nằm ở PO360, nơi có đủ chỗ cho một bảng. */}
        </Nhom>

        {/* ═══ ③ COMMERCIAL ══════════════════════════════════════════════ */}
        <Nhom ten="③ Thương mại" icon={Banknote} mo={mo.tm} onMo={bat('tm')}
          phu={tongTien !== null ? `≈ ${tongTien.toLocaleString('vi-VN')} ${watch('currency')}` : undefined}>
          <Field label="Đồng tiền">
            <select className={inputCls} {...register('currency')}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{CURRENCY_LABEL[c]}</option>)}
            </select>
            <Err>{formState.errors.currency?.message}</Err>
          </Field>

          <Field label="Đơn giá (mỗi sản phẩm)" hint="để trống nếu chưa chốt giá">
            <input
              className={inputCls} type="number" min={0} step={0.0001} inputMode="decimal"
              {...register('unit_price', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.unit_price?.message}</Err>
            {/* 🔑 Tổng tiền TÍNH TẠI CHỖ, ⛔ không lưu: nó là tích của hai ô
                ngay trên. Lưu nó là mở đường cho ba con số lệch nhau. */}
            <span className={chuPhu}>
              {tongTien === null ? '⚪ chưa đủ số lượng và đơn giá để tính tổng'
                : `Tổng giá trị đơn ≈ ${tongTien.toLocaleString('vi-VN')} ${watch('currency')}`}
            </span>
          </Field>

          <Field label="Điều khoản thanh toán (Payment Term)">
            <p className={`${inputCls} bg-slate-50 text-slate-600`}>
              {khach?.payment_term || (khach ? '⚪ hồ sơ khách chưa khai' : '— chọn khách hàng trước —')}
            </p>
            <span className={chuPhu}>lấy từ hồ sơ khách hàng · sửa ở màn hình Khách hàng</span>
          </Field>

          <Field label="Điều kiện giao hàng (Incoterm)">
            <select className={inputCls} {...register('incoterm')}>
              <option value="">— Theo mặc định của khách —</option>
              {INCOTERMS.map((i) => <option key={i} value={i}>{INCOTERM_LABEL[i]}</option>)}
            </select>
            <Err>{formState.errors.incoterm?.message}</Err>
          </Field>
        </Nhom>

        {/* ═══ ④ DELIVERY ════════════════════════════════════════════════ */}
        <Nhom ten="④ Giao hàng" icon={Truck} mo={mo.gh} onMo={bat('gh')}
          phu={ngayGiao ? `giao ${ngayGiao}` : '⛔ chưa có ngày giao'}>
          <Field label="Ngày đặt hàng">
            <input className={inputCls} type="date" {...register('order_date')} />
            <Err>{formState.errors.order_date?.message}</Err>
          </Field>

          <Field label="Ngày giao hàng" hint="mốc cam kết với khách">
            <input className={inputCls} type="date" {...register('delivery_date')} />
            <Err>{formState.errors.delivery_date?.message}</Err>
          </Field>

          <Field label="Ngày xuất xưởng (Ex Factory)" hint="phải trước hoặc bằng ngày giao">
            <input className={inputCls} type="date" {...register('ex_factory_date')} />
            <Err>{formState.errors.ex_factory_date?.message}</Err>
          </Field>

          <Field label="Phương thức vận chuyển">
            <select className={inputCls} {...register('ship_mode')}>
              <option value="">— Chưa chốt —</option>
              {SHIP_MODES.map((m) => <option key={m} value={m}>{SHIP_MODE_LABEL[m]}</option>)}
            </select>
            <Err>{formState.errors.ship_mode?.message}</Err>
          </Field>

          {/* 🔴 INSPECTION DATE · SHIP DATE — Board §B yêu cầu, và chúng ở ĐÂY
              dưới dạng **XEM TRƯỚC**, ⛔ KHÔNG phải ô nhập.
              🔑 Lý do đầy đủ ở khối chú thích đầu tệp: hai ngày này ĐÃ là mốc
              trong `ta_template_items` và được `createPo` sinh ra thật. Thêm ô
              nhập ở đây là chép lại dữ liệu đã có — rồi hai chỗ lệch nhau. */}
          <div className="sm:col-span-2">
            <div className={`rounded-lg px-3 py-2 ${SAC_NHOM.journey.nen} ${SAC_NHOM.journey.chu}`}>
              <p className={`${TYPE.caption} ${FONT_WEIGHT.bold}`}>
                Lịch T&amp;A sẽ tự sinh 15 mốc khi lưu — hai mốc Board hỏi:
              </p>
              <p className={TYPE.caption}>
                · <strong>Ngày kiểm hàng (AQL cuối)</strong>:{' '}
                {ngayGiao ? themNgay(ngayGiao, -XEM_TRUOC.kiemHang) : '⚪ nhập ngày giao để xem'}
                {' · '}
                <strong>Ngày xuất hàng</strong>:{' '}
                {ngayGiao ? themNgay(ngayGiao, -XEM_TRUOC.xuatHang) : '⚪ nhập ngày giao để xem'}
              </p>
              <p className={TYPE.caption}>
                ⚠️ Đây là <strong>dự kiến</strong>. Mốc thật sinh từ mẫu T&amp;A và sửa được ở
                tab <strong>Lịch trình T&amp;A</strong> của PO360.
              </p>
            </div>
          </div>
        </Nhom>

        {/* ═══ ⑤ OWNERSHIP ═══════════════════════════════════════════════ */}
        <Nhom ten="⑤ Phụ trách & xưởng" icon={UserCog} mo={mo.sh} onMo={bat('sh')} phu={tenNguoiLap}>
          <Field label="Merchandiser phụ trách">
            <p className={`${inputCls} bg-slate-50 text-slate-600`}>{tenNguoiLap}</p>
            {/* ⚠️ ⛔ Không cho sửa: `orders` ⛔ chưa có cột chuyển giao chủ sở
                hữu, và đổi người phụ trách là việc của Assignment chứ ⛔ không
                phải một ô trong form tạo. Bày ô nhập ⛔ không lưu được là nói
                dối. */}
            <span className={chuPhu}>người lập đơn · ghi vào `created_by`</span>
          </Field>

          <Field label="Xưởng sản xuất">
            <input className={inputCls} placeholder="Xưởng 1 — Chuyền A" {...register('factory_name')} />
            <Err>{formState.errors.factory_name?.message}</Err>
          </Field>

          <Field label="Trạng thái">
            <select className={inputCls} {...register('status')}>
              {PO_STATUSES.map((s) => <option key={s} value={s}>{PO_STATUS_LABEL[s]}</option>)}
            </select>
            <Err>{formState.errors.status?.message}</Err>
          </Field>

          <Field label="Ghi chú">
            <input className={inputCls} {...register('notes')} />
            <Err>{formState.errors.notes?.message}</Err>
          </Field>
        </Nhom>

        {/* §C — *"Các nút Save · Cancel · Edit phải rõ ràng."* */}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btnGhost} onClick={onClose} disabled={formState.isSubmitting}>
            Hủy
          </button>
          <button
            type="submit"
            className={btnPrimary}
            disabled={formState.isSubmitting || customers.length === 0 || styles.length === 0}
          >
            {formState.isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang lưu...</>
              : <><PackagePlus className="h-4 w-4" aria-hidden="true" /> Lưu &amp; mở PO 360°</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
