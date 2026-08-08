'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Loader2, PackagePlus, Fingerprint, Shirt, Banknote, Factory, GitBranch, Lock,
} from 'lucide-react';
import type { z } from 'zod';

import {
  Modal, Field, NhomGap, oChiDoc, hangNutDayHopThoai,
  inputCls, btnGhost, btnPrimary, SAC_NHOM,
} from '@/components/ui';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { createPo } from './_actions/po.actions';
import { listPoFormOptionsClient } from './_actions/md4.client';
import type { OChonKhachHang, OChonDonHang } from './_services/commercial.service';
import {
  poFormSchema, vnToday,
  CURRENCIES, CURRENCY_LABEL, ORDER_TYPES, ORDER_TYPE_LABEL,
  INCOTERMS, INCOTERM_LABEL, SHIP_MODES, SHIP_MODE_LABEL,
  PO_STATUS_KHI_TAO, PO_STATUS_LABEL,
  type PoFormValues, type StyleRow,
} from '@/schemas/md';

// ============================================================================
// 🔴 ORDER MASTER — **BOARD DIRECTIVE 08/08/2026 · *FIX MD INPUT EXPERIENCE***
//
//   > *"Thiết kế lại hai form này theo góc nhìn **Merchandiser may mặc sử dụng
//   > 8 giờ/ngày**."*
//
// ─── NĂM NHÓM BOARD CHỈ ĐỊNH, ĐÚNG TÊN ĐÚNG THỨ TỰ ──────────────────────
//   Ⓐ Order Identity  — PO · Customer · Brand · Buyer · Season · MD Owner
//   Ⓑ Product         — Style · Product name · Category · Quantity
//   Ⓒ Commercial      — Currency · Price · Payment term · Incoterm · Costing ref
//   Ⓓ Production      — Factory/Subcon · Timeline · Delivery milestone
//   Ⓔ Workflow        — Draft · Review · Approved · Production · Completed
//
// 🔑 **Thứ tự LÀ nội dung.** Nó là thứ tự một MD thật sự nghĩ: *đơn của ai* →
// *hàng gì* → *bao nhiêu tiền* → *ai làm, khi nào* → *đang ở đâu trong quy
// trình*. Xếp Workflow lên đầu là bắt người ta khai trạng thái của một thứ ⛔
// chưa tồn tại.
//
// ─── 🔴 *"⛔ KHÔNG CHO MẶC ĐỊNH 'ĐÃ DUYỆT' KHI TẠO MỚI"* ────────────────
// Vá ở **ba tầng**, vì vá một tầng thì hai tầng kia vẫn hở:
//   ① ô chọn ở nhóm Ⓔ chỉ liệt kê `PO_STATUS_KHI_TAO` = **Nháp · Chờ duyệt**
//   ② `DEFAULTS.status = 'DRAFT'`
//   ③ `orders.status DEFAULT 'DRAFT'` — migration `054`
// Tầng ③ là tầng duy nhất chặn được người gọi thẳng CSDL.
//
// ─── ⛔ BỐN Ô BOARD YÊU CẦU MÀ **⛔ KHÔNG** ĐƯỢC LƯU VÀO `orders` ────────
//   Buyer · Brand · Payment Term  → **ĐỌC TỪ HỒ SƠ KHÁCH HÀNG**
//     Chép sang `orders` là dựng nguồn sự thật thứ hai: khách đổi điều khoản
//     thanh toán thì 200 PO cũ vẫn mang giá trị cũ và ⛔ không ai biết cái nào
//     đúng. `P-ZERODUP` + CLAUDE.md §2.5 *(⛔ không lưu dữ liệu tính được)*.
//
//   Product name · Category → **ĐỌC TỪ MÃ HÀNG**
//     Cùng một lý do. Mã hàng là nơi khai tên và nhóm sản phẩm; PO chỉ tham
//     chiếu tới nó. Board hỏi hai ô này ở nhóm Ⓑ, và chúng **có mặt** — chỉ là
//     dưới dạng **đọc**, ⛔ không phải ô gõ.
//
//   Inspection Date · Ship Date → **ĐÃ LÀ MỐC T&A**
//     🔑 ĐO ĐƯỢC: `ta_template_items` của mẫu `FOB` có **`Kiểm AQL cuối`
//     (−7 ngày)** và **`Đóng container - xuất hàng` (−0 ngày)**. `createPo`
//     sinh đủ 15 mốc ngay khi tạo đơn ⇒ thêm hai cột là **chép lại hai dòng đã
//     có**. Form hiện chúng dưới dạng **xem trước** ở nhóm Ⓓ.
//
// ─── ⛔ NHỮNG THỨ CỐ Ý ⛔ KHÔNG CÓ TRONG HỘP THOẠI NÀY ──────────────────
// Bảng MÀU × SIZE · BOM · NPL · Sản xuất · QA · Xuất hàng. Board §B liệt kê
// đúng chúng vào diện *"⛔ không đưa vào popup"* — chúng nằm ở **PO360**, nơi
// có đủ chỗ cho một bảng. Nhét vào đây là dựng lại đúng cái popup dài mà Board
// vừa bác.
//
// ⚠️ Tệp này ⛔ **KHÔNG chứa một literal màu hay cỡ chữ nào** — bánh cóc
// `TD-07`/`TD-10`. Sắc từ `SAC_NHOM`, thang chữ từ `TYPE`/`FONT_WEIGHT`.
//
// ⚠️ Nằm ở `app/…/md/`, ⛔ không ở `components/`: nó nhập `createPo` từ `app/`,
// mà bài kiểm ③ chặn `components/ → app/` ở **39 tệp** *(`AD-01`)*.
// ============================================================================

// ⚠️ **KÝ TỰ `⛔` · `⚪` · `✅` LÀ QUY ƯỚC VIẾT TÀI LIỆU, ⛔ KHÔNG dùng trong
// CHUỖI HIỂN THỊ.** Trình duyệt dựng chúng thành **emoji tròn CÓ MÀU**, và một
// vệt màu đặc giữa các dòng chú thích xám hút mắt mạnh hơn cả nhãn ô. Board
// 08/08/2026 cấm *"UI giống game"*; chúng ở lại trong chú thích mã, ⛔ không ra
// màn hình.
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

/** Ô **chỉ đọc** — giá trị lấy từ hồ sơ gốc, ⛔ không lưu lại trên đơn.
 *
 *  🔑 Dựng thành một thành phần riêng vì có **năm** ô như vậy, và chúng phải
 *  trông giống hệt nhau: người dùng cần nhận ra ngay *"ô này tôi ⛔ không sửa ở
 *  đây"* mà ⛔ không phải thử bấm vào từng ô. */
function ODoc({ label, gia_tri, nguon, daChon }: {
  label: string; gia_tri: string | null; nguon: string; daChon: boolean;
}) {
  return (
    <Field label={label}>
      <p className={oChiDoc}>
        <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <span className="min-w-0 truncate">
          {gia_tri || (daChon ? 'hồ sơ gốc chưa khai' : 'chọn ở ô trên trước')}
        </span>
      </p>
      <span className={`text-slate-500 ${TYPE.caption}`}>{nguon}</span>
    </Field>
  );
}

/** Số ngày trước ngày giao của hai mốc T&A mà Board hỏi tên — đọc từ mẫu `FOB`
 *  đang chạy trên CSDL *(`Kiểm AQL cuối` · `Đóng container - xuất hàng`)*.
 *
 *  ⚠️ Đây là **XEM TRƯỚC**, ⛔ không phải nguồn sự thật. Mốc thật do
 *  `seedMilestones()` sinh từ chính bảng `ta_template_items` lúc tạo đơn, và
 *  sửa được ở PO360. */
const XEM_TRUOC = { kiemHang: 7, xuatHang: 0 } as const;

/** Cảng xuất khẩu chính của Việt Nam — **GỢI Ý, ⛔ không phải danh mục bắt
 *  buộc**. Đơn đi cảng lạ vẫn gõ tự do được; danh sách chỉ để bớt lệch chính
 *  tả, vì `Hai Phong` và `Haiphong` trên hai chứng từ là hai cảng khác nhau
 *  dưới mắt một phần mềm. */
const CANG_VN = [
  'Hai Phong', 'Ho Chi Minh (Cat Lai)', 'Cai Mep', 'Da Nang', 'Quy Nhon',
  'Nghi Son', 'Noi Bai (Air)', 'Tan Son Nhat (Air)',
] as const;

const RONG: OChonDonHang = { nguoiPhuTrach: [], xuongNgoai: [], chietTinh: [] };

export default function PoMasterDialog({
  open, onClose, onCreated, customers, styles, seasons, khachMacDinh, tenNguoiLap,
}: {
  open: boolean;
  onClose: () => void;
  /** Nhận id PO vừa tạo — *"⛔ Không quay Dashboard. Đi thẳng PO360."* */
  onCreated: (poId: string, poNumber: string) => void | Promise<void>;
  customers: readonly OChonKhachHang[];
  styles: readonly StyleRow[];
  seasons: ReadonlyArray<{ id: string; code: string; name: string | null }>;
  /** Khách chọn sẵn khi đi thẳng từ màn hình *"vừa tạo khách hàng"*. */
  khachMacDinh?: string | null;
  tenNguoiLap: string;
}) {
  // ⚠️ `total_quantity` là **số bắt buộc** trong lược đồ, nên kiểu Ô NHẬP đòi
  // `number`. Nhưng ô trống lúc mở form là trạng thái THẬT — ép `0` vào đó sẽ
  // hiện *"0"* sẵn và người dùng dễ lưu nhầm một đơn 0 sản phẩm.
  // 🔑 Khai `Partial<Input>` cho giá trị mặc định, rồi ép đúng MỘT chỗ này —
  // ⛔ không rải `as` khắp nơi, và ⛔ không nới lược đồ.
  const DEFAULTS = useMemo(() => ({
    po_number: '', customer_po_no: '', style_id: '', customer_id: khachMacDinh ?? '',
    season_id: '', costing_id: '', md_owner_id: '',
    total_quantity: undefined, qty_tolerance_percent: undefined,
    order_type: 'FOB', incoterm: '', currency: 'USD', unit_price: undefined,
    order_date: vnToday(), delivery_date: '', ex_factory_date: '', material_eta: '',
    port_of_loading: '', port_of_destination: '',
    factory_name: '', subcontractor_id: '', ship_mode: '',
    // 🔴 *"⛔ Không cho mặc định 'Đã duyệt' khi tạo mới."* — tầng ②/③.
    status: 'DRAFT', notes: '', evidence_path: '',
  } as unknown as Input), [khachMacDinh]);

  const { register, formState, reset, setError, handleSubmit, watch, setValue } =
    useForm<Input, unknown, PoFormValues>({
      resolver: zodResolver(poFormSchema),
      defaultValues: DEFAULTS,
    });

  // Ba danh sách nạp **khi mở**, ⛔ không nạp sẵn cho mọi lượt vào `/md`.
  const [chon, setChon] = useState<OChonDonHang>(RONG);

  // 🔑 Ba nhóm đầu mở sẵn — đủ để lưu một đơn hợp lệ. Board: *"⛔ Không tạo
  // popup dài."* Mở hết 20 ô là quay lại đúng cái đang sửa; gấp hết thì người
  // dùng ⛔ không biết còn gì bên dưới.
  const [mo, setMo] = useState({ a: true, b: true, c: true, d: false, e: false });
  const bat = (k: keyof typeof mo) => () => setMo((v) => ({ ...v, [k]: !v[k] }));

  useEffect(() => {
    if (!open) return;
    reset(DEFAULTS);
    setMo({ a: true, b: true, c: true, d: false, e: false });
    let huy = false;
    // ⚠️ `huy` chặn ghi state sau khi hộp thoại đã đóng — mở/đóng nhanh hai lần
    // thì lượt nạp cũ về sau và ghi đè lượt mới.
    void listPoFormOptionsClient()
      .then((r) => { if (!huy) setChon(r); })
      .catch(() => { if (!huy) setChon(RONG); });
    return () => { huy = true; };
  }, [open, reset, DEFAULTS]);

  const khachId = watch('customer_id');
  const styleId = watch('style_id');
  const ngayGiao = watch('delivery_date');
  const soLuong = watch('total_quantity');
  const donGia = watch('unit_price');
  const dungSai = watch('qty_tolerance_percent');
  const chietTinhId = watch('costing_id');

  // 🔴 Buyer · Brand · Payment Term — **ĐỌC** từ hồ sơ khách, ⛔ KHÔNG lưu lại.
  const khach = useMemo(() => customers.find((c) => c.id === khachId) ?? null, [customers, khachId]);
  // 🔴 Product name · Category — **ĐỌC** từ mã hàng.
  const style = useMemo(() => styles.find((s) => s.id === styleId) ?? null, [styles, styleId]);

  // Chọn khách ⇒ áp mặc định thương mại CỦA KHÁCH ĐÓ. ⚠️ Chỉ áp cho ô người
  // dùng ⛔ CHƯA đụng tới — ghi đè lựa chọn họ vừa gõ là thô lỗ và dễ ra giá sai.
  useEffect(() => {
    if (!khach) return;
    if (khach.currency) setValue('currency', khach.currency as Input['currency'], { shouldDirty: false });
    if (khach.incoterm) setValue('incoterm', khach.incoterm as Input['incoterm'], { shouldDirty: false });
  }, [khach, setValue]);

  // 🔑 **CHIẾT TÍNH CHỈ HIỆN BẢN ĐÚNG KHÁCH VÀ ĐÚNG MÃ HÀNG.**
  // Bày cả 300 bản chiết tính của mọi khách là mời người dùng gắn nhầm căn cứ
  // giá của khách khác lên đơn này — một lỗi ⛔ không màn hình nào bắt được về
  // sau, vì con số vẫn *hợp lệ*.
  const chietTinhHop = useMemo(
    () => chon.chietTinh.filter(
      (c) => (!khachId || c.customer_id === khachId) && (!styleId || c.style_id === styleId),
    ),
    [chon.chietTinh, khachId, styleId],
  );

  // Gắn chiết tính ⇒ **tự điền đơn giá**. Board: *"ít nhập tay · tự lấy dữ
  // liệu · reuse dữ liệu đã có."* Giá đã chốt ở bản chiết tính rồi — bắt MD gõ
  // lại là mời một con số thứ hai lệch với căn cứ mà chính đơn này trỏ tới.
  const ganGia = useCallback((id: string) => {
    const c = chon.chietTinh.find((x) => x.id === id);
    if (!c) return;
    if (c.quoted_price !== null) setValue('unit_price', c.quoted_price, { shouldDirty: true });
    if (c.currency) setValue('currency', c.currency as Input['currency'], { shouldDirty: true });
  }, [chon.chietTinh, setValue]);

  // 🔑 **Dung sai là một con số TRỪU TƯỢNG cho tới khi thấy nó thành số áo.**
  // `±3%` ⛔ không nói gì; *"giao 4.850 – 5.150"* thì MD đọc phát hiểu ngay, và
  // đó chính là con số họ sẽ phải cãi với khách lúc giao thiếu.
  const khoangGiao = useMemo(() => {
    const q = Number(soLuong); const t = Number(dungSai);
    if (!Number.isFinite(q) || q <= 0) return 'nhập số lượng để xem khoảng giao được phép';
    if (dungSai === undefined || dungSai === null || String(dungSai) === '') {
      return 'chưa thoả thuận dung sai — mặc định phải giao đúng số lượng';
    }
    if (!Number.isFinite(t) || t === 0) return `Phải giao đúng ${q.toLocaleString('vi-VN')} sp`;
    const min = Math.floor(q * (1 - t / 100));
    const max = Math.ceil(q * (1 + t / 100));
    return `Được giao ${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} sp`;
  }, [soLuong, dungSai]);

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
    // 🔴 *"⛔ Không quay Dashboard. Đi thẳng PO360."*
    if (res.data?.id) await onCreated(res.data.id, values.po_number);
  });

  const chuPhu = `text-slate-500 ${TYPE.caption}`;
  const trangThai = watch('status');

  return (
    <Modal open={open} title="Tạo đơn hàng (Order Master)" onClose={onClose} wide>
      <form onSubmit={onSubmit} noValidate className="space-y-2.5">
        {customers.length === 0 && (
          <p className={`rounded-lg px-3 py-2 ${SAC_NHOM.today.nen} ${SAC_NHOM.today.chu} ${TYPE.caption}`}>
            Chưa có khách hàng nào đang giao dịch. Thêm khách hàng trước — đơn hàng phải gắn với một khách.
          </p>
        )}
        {styles.length === 0 && (
          <p className={`rounded-lg px-3 py-2 ${SAC_NHOM.today.nen} ${SAC_NHOM.today.chu} ${TYPE.caption}`}>
            Chưa có mã hàng nào. Mã hàng mang định mức NPL và SAM — thiếu nó thì không sinh được
            yêu cầu vật tư lẫn lệnh sản xuất.
          </p>
        )}

        {/* ═══ Ⓐ ORDER IDENTITY ═══════════════════════════════════════════ */}
        <NhomGap sac="blue" ten="Ⓐ Nhận diện đơn hàng" icon={Fingerprint} mo={mo.a} onMo={bat('a')}
          phu={khach ? `${khach.customer_code} — ${khach.name}` : undefined}>
          <Field label="Mã PO nội bộ" hint="tự chuyển in hoa">
            <input className={inputCls} placeholder="PO-2026-001" {...register('po_number')} />
            <Err>{formState.errors.po_number?.message}</Err>
          </Field>

          {/* 🔴 **SỐ PO CỦA KHÁCH — ô ⛔ CHƯA TỪNG CÓ, và nó là ô đắt nhất
              trong nhóm này.** Nhà máy có mã nội bộ; khách có số của họ. Toàn
              bộ **Commercial Invoice · Packing List · B/L · L/C** tham chiếu
              số của KHÁCH.
              ⇒ Thiếu nó thì tới lúc lập chứng từ, MD phải lục email tìm lại,
              và ngân hàng **từ chối** bộ chứng từ ⛔ không khớp số trên L/C. */}
          <Field label="Số PO của khách" hint="số ghi trên chứng từ xuất khẩu và L/C">
            <input className={inputCls} placeholder="4500123456" {...register('customer_po_no')} />
            <Err>{formState.errors.customer_po_no?.message}</Err>
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

          <ODoc label="Buyer (tập đoàn / nhóm mua)" gia_tri={khach?.buyer_group ?? null}
            nguon="theo hồ sơ khách hàng" daChon={!!khach} />
          <ODoc label="Brand (thương hiệu)" gia_tri={khach?.brand ?? null}
            nguon="theo hồ sơ khách hàng" daChon={!!khach} />

          <Field label="Mùa vụ (Season)">
            <select className={inputCls} {...register('season_id')}>
              <option value="">— Chưa gắn —</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.code}{s.name ? ` — ${s.name}` : ''}</option>
              ))}
            </select>
            <Err>{formState.errors.season_id?.message}</Err>
          </Field>

          {/* 🔴 **MD OWNER — Ô CHỌN THẬT, ⛔ KHÔNG còn là chữ chết.**
              Bản trước hiện tên người lập kèm ghi chú *"không cho sửa"*, vì
              `orders` ⛔ chưa có cột nào để chuyển giao. Migration `054` thêm
              `md_owner_id`, và ô này là chỗ dùng nó.
              🔑 Nó **KHÁC `created_by`**: *"ai ĐANG phụ trách"* đổi được khi
              bàn giao; *"ai ĐÃ LẬP"* là lịch sử và ⛔ không bao giờ đổi. */}
          <Field label="Merchandiser phụ trách (MD Owner)" hint="chuyển giao được khi bàn giao việc">
            <select className={inputCls} {...register('md_owner_id')}>
              <option value="">— Mặc định: {tenNguoiLap} (người lập) —</option>
              {chon.nguoiPhuTrach.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.full_name || 'chưa khai tên'}{n.employee_code ? ` · ${n.employee_code}` : ''}
                </option>
              ))}
            </select>
            <Err>{formState.errors.md_owner_id?.message}</Err>
            <span className={chuPhu}>để trống ⇒ chính bạn phụ trách · hệ thống vẫn ghi riêng ai đã lập đơn</span>
          </Field>
        </NhomGap>

        {/* ═══ Ⓑ PRODUCT ═════════════════════════════════════════════════ */}
        <NhomGap sac="rose" ten="Ⓑ Sản phẩm" icon={Shirt} mo={mo.b} onMo={bat('b')}
          phu={style ? `${style.style_no} — ${style.style_name}` : undefined}>
          <Field label="Mã hàng (Style)" hint="mang định mức NPL và SAM">
            <select className={inputCls} {...register('style_id')}>
              <option value="">— Chọn mã hàng —</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>{s.style_no} — {s.style_name}</option>
              ))}
            </select>
            <Err>{formState.errors.style_id?.message}</Err>
          </Field>

          {/* 🔴 Board hỏi *"Product name"* và *"Category"*. Chúng ở đây — dưới
              dạng **ĐỌC từ mã hàng**, ⛔ không phải ô gõ. Gõ tay ở đây là dựng
              tên sản phẩm thứ hai khác tên trong hồ sơ mã hàng, rồi báo cáo
              theo PO và báo cáo theo mã hàng trả hai kết quả. */}
          <ODoc label="Tên sản phẩm (Product name)" gia_tri={style?.style_name ?? null}
            nguon="theo hồ sơ mã hàng" daChon={!!style} />
          <ODoc label="Nhóm hàng (Category)" gia_tri={style?.product_group ?? null}
            nguon="theo hồ sơ mã hàng" daChon={!!style} />

          {/* ⚠️ Bảng MÀU × SIZE, BOM, NPL, QA CỐ Ý ⛔ KHÔNG có ở đây — chúng
              nằm ở PO360, nơi có đủ chỗ cho một bảng. */}

          {/* ⚠️ **Số lượng và dung sai ĐỨNG CẠNH NHAU, có chủ ý.**
              Dòng tóm tắt *"được giao 4.850 – 5.150 sp"* đọc từ **cả hai** ô;
              xếp chúng hai hàng khác nhau là bắt mắt nhảy qua lại để hiểu
              đúng một câu. */}
          <Field label="Số lượng (pcs)">
            <input
              className={inputCls} type="number" min={1} step={1} inputMode="numeric"
              {...register('total_quantity', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.total_quantity?.message}</Err>
          </Field>

          {/* 🔴 **DUNG SAI ±% — con số quyết định đơn có bị phạt hay không.**
              Chuẩn ngành `±3%` / `±5%`, và **L/C ghi rõ**. ⛔ Không có nó thì
              giao 4.950/5.000 bị đọc là **giao thiếu** trong khi hợp đồng cho
              phép — tranh chấp này ⛔ không giải được bằng trí nhớ của MD. */}
          <Field label="Dung sai số lượng (±%)" hint="để trống = chưa thoả thuận · 0 = giao đúng tuyệt đối">
            <input
              className={inputCls} type="number" min={0} max={10} step={0.5} inputMode="decimal"
              placeholder="3"
              {...register('qty_tolerance_percent', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            <Err>{formState.errors.qty_tolerance_percent?.message}</Err>
            <span className={chuPhu}>{khoangGiao}</span>
          </Field>

</NhomGap>

        {/* ═══ Ⓒ COMMERCIAL ══════════════════════════════════════════════ */}
        <NhomGap sac="violet" ten="Ⓒ Thương mại" icon={Banknote} mo={mo.c} onMo={bat('c')}
          phu={tongTien !== null ? `≈ ${tongTien.toLocaleString('vi-VN')} ${watch('currency')}` : undefined}>
          {/* 🔴 **COSTING REFERENCE — Board nhóm Ⓒ.**
              Đặt **đầu nhóm** chứ ⛔ không cuối: chọn nó xong thì đơn giá và
              đồng tiền tự điền, nên hai ô dưới thường ⛔ không phải gõ. Đặt
              cuối thì người dùng gõ tay xong mới thấy nó — vô nghĩa. */}
          <Field label="Căn cứ giá (bản chiết tính)" hint="chọn xong sẽ tự điền đơn giá">
            <select
              className={inputCls}
              {...register('costing_id', {
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => ganGia(e.target.value),
              })}
            >
              <option value="">— Chưa gắn chiết tính —</option>
              {chietTinhHop.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.costing_no} · v{c.version} · {c.status}
                  {c.quoted_price !== null ? ` · ${c.quoted_price} ${c.currency ?? ''}` : ''}
                </option>
              ))}
            </select>
            <Err>{formState.errors.costing_id?.message}</Err>
            <span className={chuPhu}>
              {chietTinhId
                ? 'Đơn giá dưới đây lấy từ bản chiết tính — sửa được nếu đã đàm phán lại'
                : chietTinhHop.length === 0
                  ? 'Chưa có bản chiết tính nào cho đúng khách + mã hàng này'
                  : `${chietTinhHop.length} bản chiết tính khớp khách hàng và mã hàng đã chọn`}
            </span>
          </Field>

          <Field label="Hình thức gia công (Order Type)">
            <select className={inputCls} {...register('order_type')}>
              {ORDER_TYPES.map((t) => <option key={t} value={t}>{ORDER_TYPE_LABEL[t]}</option>)}
            </select>
            <Err>{formState.errors.order_type?.message}</Err>
          </Field>

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
              {tongTien === null ? 'chưa đủ số lượng và đơn giá để tính tổng'
                : `Tổng giá trị đơn ≈ ${tongTien.toLocaleString('vi-VN')} ${watch('currency')}`}
            </span>
          </Field>

          <ODoc label="Điều khoản thanh toán (Payment term)" gia_tri={khach?.payment_term ?? null}
            nguon="theo hồ sơ khách hàng" daChon={!!khach} />

          <Field label="Điều kiện giao hàng (Incoterm)">
            <select className={inputCls} {...register('incoterm')}>
              <option value="">— Theo mặc định của khách —</option>
              {INCOTERMS.map((i) => <option key={i} value={i}>{INCOTERM_LABEL[i]}</option>)}
            </select>
            <Err>{formState.errors.incoterm?.message}</Err>
          </Field>

          {/* 🔴 **CẢNG ĐI · CẢNG ĐẾN — đặt NGAY DƯỚI Incoterm, có chủ ý.**
              🔑 `Incoterm` mà ⛔ không có cảng là điều khoản **⛔ chưa hoàn
              chỉnh**: `FOB` nghĩa là *"giao lên tàu tại cảng X"*. Thiếu X thì
              ⛔ không xác định được **điểm chuyển rủi ro** lẫn **ai trả cước
              tới đâu** — `FOB Hải Phòng` và `FOB Hồ Chí Minh` chênh nhau hàng
              nghìn đô cước nội địa trên một container. */}
          <Field label="Cảng đi (Port of loading)">
            <input className={inputCls} list="goi-y-cang-di" placeholder="Hai Phong"
              {...register('port_of_loading')} />
            <datalist id="goi-y-cang-di">
              {CANG_VN.map((c) => <option key={c} value={c} />)}
            </datalist>
            <Err>{formState.errors.port_of_loading?.message}</Err>
          </Field>

          <Field label="Cảng đến (Port of destination)">
            <input className={inputCls} placeholder="Hamburg" {...register('port_of_destination')} />
            <Err>{formState.errors.port_of_destination?.message}</Err>
            <span className={chuPhu}>
              {khach?.market ? `thị trường của khách: ${khach.market}` : 'theo hợp đồng với khách'}
            </span>
          </Field>
        </NhomGap>

        {/* ═══ Ⓓ PRODUCTION ══════════════════════════════════════════════ */}
        <NhomGap sac="amber" ten="Ⓓ Sản xuất & tiến độ" icon={Factory} mo={mo.d} onMo={bat('d')}
          phu={ngayGiao ? `giao ${ngayGiao}` : 'chưa có ngày giao'}>
          <Field label="Nơi sản xuất" hint="xưởng hoặc chuyền nhận đơn này">
            <input className={inputCls} placeholder="Xưởng 1 — Chuyền A" {...register('factory_name')} />
            <Err>{formState.errors.factory_name?.message}</Err>
          </Field>

          {/* 🔴 **NHÃN NÀY TỪNG SAI BẢN CHẤT DỮ LIỆU — sửa 08/08/2026.**
              Bản trước gọi nó *"Xưởng gia công ngoài (Subcon)"*, ngụ ý **nơi
              MAY** đơn hàng. Đo bảng `subcontractors` trên CSDL thật: chỉ có
              `service_type` **`GIAT`** và **`IN_THEU`** — tức nhà cung cấp
              **DỊCH VỤ** *(giặt · in · thêu)*, ⛔ **không** phải xưởng may.
              `partner.service.ts` đã ghi đúng điều này từ trước.

              🔑 Một ô chọn mang nhãn sai còn tệ hơn một ô ⛔ chưa có: MD chọn
              *"Xưởng In Lưới Tân Bình"* để khai nơi may, và từ đó mọi báo cáo
              năng lực chuyền đọc ra một xưởng in đang may 5.000 áo. */}
          <Field label="Dịch vụ thuê ngoài" hint="giặt · in · thêu — ⛔ không phải nơi may">
            <select className={inputCls} {...register('subcontractor_id')}>
              <option value="">— Không thuê ngoài —</option>
              {chon.xuongNgoai.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.vendor_code} — {x.vendor_name}{x.service_type ? ` · ${x.service_type}` : ''}
                </option>
              ))}
            </select>
            <Err>{formState.errors.subcontractor_id?.message}</Err>
          </Field>

          <Field label="Ngày đặt hàng" hint="ngày chốt đơn với khách">
            <input className={inputCls} type="date" {...register('order_date')} />
            <Err>{formState.errors.order_date?.message}</Err>
          </Field>

          {/* 🔴 **NGÀY NPL PHẢI VỀ KHO — mốc SỚM NHẤT có thể làm trễ cả đơn.**
              Chuyền ⛔ không cắt được khi vải chưa về. Lược đồ ép đúng thứ tự
              sản xuất: **NPL về ⇒ xuất xưởng ⇒ giao khách**, và bắt sai ngay
              lúc lập rẻ hơn nhiều so với lúc chuyền đứng chờ vải. */}
          <Field label="Ngày NPL về kho" hint="mốc cam kết ngược lại với bộ phận vật tư">
            <input className={inputCls} type="date" {...register('material_eta')} />
            <Err>{formState.errors.material_eta?.message}</Err>
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

          {/* 🔴 **DELIVERY MILESTONE** — Board nhóm Ⓓ. Ở đây dưới dạng **XEM
              TRƯỚC**, ⛔ KHÔNG phải ô nhập. Lý do đầy đủ ở đầu tệp: hai ngày
              này ĐÃ là mốc trong `ta_template_items` và `createPo` sinh chúng
              thật. Thêm ô nhập là chép lại dữ liệu đã có. */}
          <div className="sm:col-span-2">
            <div className={`rounded-lg px-3 py-2 ${SAC_NHOM.journey.nen} ${SAC_NHOM.journey.chu}`}>
              <p className={`${TYPE.caption} ${FONT_WEIGHT.bold}`}>
                Lịch T&amp;A sẽ tự sinh 15 mốc khi lưu — hai mốc quan trọng nhất:
              </p>
              <p className={TYPE.caption}>
                · <strong>Ngày kiểm hàng (AQL cuối)</strong>:{' '}
                {ngayGiao ? themNgay(ngayGiao, -XEM_TRUOC.kiemHang) : 'nhập ngày giao để xem'}
                {' · '}
                <strong>Ngày xuất hàng</strong>:{' '}
                {ngayGiao ? themNgay(ngayGiao, -XEM_TRUOC.xuatHang) : 'nhập ngày giao để xem'}
              </p>
              <p className={TYPE.caption}>
                Đây là <strong>dự kiến</strong>. Mốc thật sinh từ mẫu T&amp;A và sửa được ở
                tab <strong>Lịch trình T&amp;A</strong> của PO360.
              </p>
            </div>
          </div>
        </NhomGap>

        {/* ═══ Ⓔ WORKFLOW ════════════════════════════════════════════════ */}
        <NhomGap sac="emerald" ten="Ⓔ Quy trình" icon={GitBranch} mo={mo.e} onMo={bat('e')}
          phu={PO_STATUS_LABEL[(trangThai ?? 'DRAFT') as keyof typeof PO_STATUS_LABEL]}>
          {/* 🔴 **CHỈ HAI BẬC ĐẦU ĐƯỢC CHỌN KHI TẠO MỚI.**
              Board: *"Không cho mặc định 'Đã duyệt' khi tạo mới."*
              🔑 Bản vá này đi xa hơn chữ *"mặc định"*: nó **bỏ hẳn** `Đã duyệt`
              khỏi danh sách. Để nó nằm đó thì chỉ mất một cú bấm để quay lại
              đúng chỗ cũ, và bấm nhầm ⛔ không phân biệt được với cố ý.
              ⚠️ Ba bậc sau **⛔ không biến mất** — chúng đặt được ở màn hình
              sửa PO, nơi mỗi lần đổi đều ghi nhật ký và chịu luật khoá. */}
          <Field label="Trạng thái khi tạo" hint="đơn mới chưa ai duyệt">
            <select className={inputCls} {...register('status')}>
              {PO_STATUS_KHI_TAO.map((s) => (
                <option key={s} value={s}>{PO_STATUS_LABEL[s]}</option>
              ))}
            </select>
            <Err>{formState.errors.status?.message}</Err>
            <span className={chuPhu}>
              {trangThai === 'REVIEW'
                ? 'Gửi duyệt ngay — đơn sẽ hiện ở hàng chờ của Giám đốc'
                : 'Giữ nháp — bạn còn sửa tiếp trước khi gửi duyệt'}
            </span>
          </Field>

          {/* 🔴 **Ô NÀY TỪNG VỨT DỮ LIỆU IM LẶNG.** Biểu mẫu có ô, lược đồ
              Zod có trường, nhưng `orders` **⛔ KHÔNG CÓ CỘT `notes`** ⇒
              `createPo` ⛔ không hề ghi nó. Người dùng gõ *"khách yêu cầu in
              nhãn size riêng"*, bấm Lưu, hệ thống báo **thành công**, và câu
              đó **biến mất ⛔ không dấu vết**.
              🔑 Loại lỗi tệ nhất trong nhóm mất dữ liệu: nó **trông như đã
              lưu**. Migration `055` thêm cột và vá đúng chỗ đó. */}
          <div className="sm:col-span-2">
            <Field label="Yêu cầu đặc biệt của khách" hint="in nhãn riêng · cách gấp · quy cách đóng thùng…">
              <textarea className={`${inputCls} min-h-[60px] resize-y`} {...register('notes')} />
              <Err>{formState.errors.notes?.message}</Err>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <p className={`rounded-lg px-3 py-2 ${SAC_NHOM.journey.nen} ${SAC_NHOM.journey.chu} ${TYPE.caption}`}>
              <strong>Nháp</strong> → <strong>Chờ duyệt</strong> → <strong>Đã duyệt</strong> →{' '}
              <strong>Đang sản xuất</strong> → <strong>Hoàn thành</strong> <Lock className="inline h-3 w-3" aria-hidden="true" />
              <br />
              Từ <strong>Đã duyệt</strong> trở đi, mỗi lần đổi đều ghi nhật ký và lưu phiên bản.
              Đơn đã sinh lệnh sản xuất thì không sửa trực tiếp được nữa — phải lập Yêu cầu thay đổi.
            </p>
          </div>
        </NhomGap>

        {/* *"Các nút Save · Cancel · Edit phải rõ ràng."* — và **với tới
            được**: hàng nút dán đáy vùng cuộn, xem `hangNutDayHopThoai`. */}
        <div className={hangNutDayHopThoai}>
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
