'use server';

import { revalidatePath } from 'next/cache';

import { guard, friendlyDbError } from '../_services/guard';
import { writeVersion } from './audit';
import {
  phanQuyetSua, duocSua, LUAT,
  type LoaiChungTu,
} from '@/lib/mos/md/document-lock';
import {
  customerFormSchema,
  inquiryFormSchema,
  costingFormSchema,
  styleFormSchema,
  styleBomFormSchema,
  zodFieldErrors,
  type ActionResult,
} from '@/schemas/md';
import { materialRequestSchema } from '../md-schema';

// ============================================================================
// 🔴 BUG-5 · SỬA VÀ LƯU TRỮ — **BOARD DECISION 07/08/2026**
//
//   > *"Bổ sung đầy đủ Update cho: Customer · RFQ · Costing · Style · Tech Pack
//   > · BOM · Material Request · Purchase Order. **⛔ Không Delete vật lý. Chỉ
//   > Archive.**"*
//
// ─── ⚠️ LỖ HỔNG ĐANG VÁ, ĐO ĐƯỢC ─────────────────────────────────────────
// Trước tệp này, TOÀN BỘ phân hệ MD có **đúng MỘT** hàm sửa: `updatePo`. Nghĩa
// là gõ nhầm tên khách hàng · sai mã HS · sai định mức vải ⇒ **sai vĩnh viễn**,
// và lối thoát duy nhất là tạo một bản ghi thứ hai — sinh ra đúng loại dữ liệu
// trùng mà `P-ZERODUP` cấm.
//
// ─── 🔑 BA THỨ MỌI LƯỢT SỬA Ở ĐÂY ĐỀU LÀM, ⛔ KHÔNG NGOẠI LỆ ─────────────
//   ① **Hỏi luật khoá TRƯỚC khi ghi** — `document-lock.ts`, khoá theo
//      **workflow** chứ ⛔ không theo `status` đơn thuần.
//   ② **Đếm dòng ĐÃ ghi** — `error === null` MỘT MÌNH ⛔ không đủ: RLS lọc
//      dòng thì lệnh trả **thành công với 0 dòng**, ⛔ không ném lỗi. Bài học
//      đã trả giá ở `reviseCosting` (`ADR-018` §B-1).
//   ③ **Ghi phiên bản** — ảnh chụp TRƯỚC và SAU vào sổ chỉ-ghi-thêm
//      *(`041_activity_log_immutable`)*. Board: *"⛔ Không overwrite dữ liệu."*
//
// ─── 🔴 VÌ SAO ⛔ KHÔNG CÓ MỘT HÀM `deleteX` NÀO Ở TỆP NÀY ───────────────
// ⛔ Không phải vì quên. Migration `042` Mục 1b **đã thu hồi `DELETE`** khỏi
// vai `authenticated` trên 16 bảng MD — xoá cứng ở đây sẽ đổ `42501` ngay.
// Tầng CSDL và tầng này nói **cùng một câu**, và tầng CSDL nói trước.
//
// ─── 🟢 08/08/2026 · MIGRATION `052` — LƯU TRỮ MỀM ĐÃ ĐỦ TÁM CHỨNG TỪ ────
// `md_documents` · `style_bom` · `material_requests` nay CÓ `deleted_at`.
// ⚠️ VẪN ⛔ KHÔNG mượn `REJECTED` làm "đã lưu trữ" — *"bị từ chối"* là một sự
// kiện nghiệp vụ KHÁC, và nay ⛔ không cần mượn nữa.
//
// 🔑 Ba loại đó đi qua **RPC**, ⛔ không `UPDATE` thẳng — xem `luuTruMem()`.
// ============================================================================

const PATH = '/md';

function nz(v: string | undefined | null): string | null {
  return v && v.trim() !== '' ? v : null;
}

/**
 * 🔴 **CHỈ GIỮ LẠI Ô THỰC SỰ ĐỔI** — Board Directive *MD Final Input
 * Experience* §A: *"chỉ update field người dùng sửa · ⛔ không ghi đè null
 * vào dữ liệu cũ"*.
 *
 * ─── ⚠️ VÌ SAO CẦN, DÙ FORM ĐÃ ĐỌC LẠI NGUYÊN DÒNG ──────────────────────
 * `docDeSua()` đã chặn kiểu mất dữ liệu **thô** *(form thiếu ô ⇒ ghi `null`
 * đè)*. Nhưng nó ⛔ **không** chặn được kiểu **tinh vi hơn**: hai người mở
 * cùng một hồ sơ, A sửa số điện thoại và lưu, B *(mở trước đó)* sửa địa chỉ
 * rồi lưu ⇒ bản của B mang số điện thoại **CŨ** và **ghi đè** thay đổi của A.
 * Ghi cả 15 ô là ghi đè 14 ô mình ⛔ không đụng tới.
 *
 * 🔑 Chỉ gửi ô đã đổi thì hai người sửa hai ô khác nhau **⛔ không giẫm lên
 * nhau nữa** — mà ⛔ không cần thêm cột phiên bản hay khoá lạc quan.
 *
 * ⚠️ **`null` và `0` là HAI GIÁ TRỊ KHÁC NHAU**, và `undefined` là giá trị
 * thứ ba. So bằng `JSON.stringify` để `0 ≠ null ≠ ""` — dùng `==` ở đây sẽ
 * coi `0` bằng `null` và nuốt mất đúng thay đổi Board yêu cầu phân biệt.
 */
function chiGhiODaDoi(
  truoc: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const con: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    // Cột ⛔ không có trong bản cũ ⇒ GIỮ LẠI: có thể là cột mới thêm, và bỏ
    // qua nó sẽ âm thầm nuốt mất một thay đổi hợp lệ.
    if (!(k in truoc)) { con[k] = v; continue; }
    const a = truoc[k] ?? null;
    const b = v ?? null;
    // ⚠️ CSDL trả `NUMERIC` về dạng chuỗi ("0", "100.00") còn form gửi lên
    // dạng số ⇒ so thẳng sẽ thấy "đổi" ở MỌI lượt lưu. So theo giá trị số khi
    // cả hai bên đều là số hợp lệ.
    const caiSo = a !== null && b !== null
      && a !== '' && b !== ''
      && Number.isFinite(Number(a)) && Number.isFinite(Number(b))
      && typeof b === 'number';
    if (caiSo ? Number(a) === Number(b) : JSON.stringify(a) === JSON.stringify(b)) continue;
    con[k] = v;
  }
  return con;
}

/** Bảng CSDL của từng loại chứng từ. Một chỗ khai, để tên bảng ⛔ không rải
 *  rác thành tám chuỗi literal rồi lệch nhau khi đổi. */
const BANG: Record<LoaiChungTu, string> = {
  CUSTOMER: 'customers',
  INQUIRY: 'inquiries',
  COSTING: 'costings',
  STYLE: 'styles',
  TECH_PACK: 'md_documents',
  BOM: 'style_bom',
  MATERIAL_REQUEST: 'material_requests',
  ORDER: 'orders',
};

// ─── ĐỌC NGUYÊN DÒNG ĐỂ ĐỔ VÀO FORM SỬA ────────────────────────────────────

/**
 * 🔴 **⛔ KHÔNG đổ form Sửa từ dòng trong DANH SÁCH.**
 *
 * Các kiểu `CustomerRow` · `StyleRow` · `InquiryRow` · `CostingRow` là **phép
 * CHIẾU**, ⛔ không phải bản ghi đầy đủ: `CustomerRow` ⛔ không mang `phone` ·
 * `email` · `address` · `tax_code` · `payment_term` · `notes`; `StyleRow` ⛔
 * không mang `hs_code` · `marker_*` · `needle_type` · `tech_pack_url`.
 *
 * 🔴 Đổ form từ chúng rồi lưu = **ghi `null` đè lên mọi ô ⛔ không có trong
 * phép chiếu**. Người dùng sửa một chữ trong tên khách hàng và **mất sạch số
 * điện thoại, email, địa chỉ, mã số thuế** — mà màn hình vẫn báo *"Đã cập
 * nhật"*. Đây là loại mất dữ liệu **im lặng**, tệ hơn hẳn một lỗi nổ ra.
 *
 * ⇒ Hộp thoại Sửa **phải** gọi hàm này trước, và chờ nó trả về mới bày ô nhập.
 *
 * ⚠️ Tốn thêm **một** lượt đi–về mỗi lần mở form sửa. Đó là cái giá **đã biết**
 * và **rẻ hơn nhiều** so với một lần mất dữ liệu ⛔ không có đường lùi —
 * `customers` ⛔ không có bản sao để khôi phục.
 */
export async function docDeSua(
  loai: LoaiChungTu,
  id: string,
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { row: null, error: g.error };

  const { data, error } = await g.supabase
    .from(BANG[loai]).select('*').eq('id', id).maybeSingle();
  if (error) return { row: null, error: friendlyDbError(`docDeSua:${BANG[loai]}`, error) };
  if (!data) {
    return { row: null, error: `Không tìm thấy ${LUAT[loai].nhan.toLowerCase()}, hoặc bạn ⛔ không có quyền xem nó.` };
  }
  return { row: data as Record<string, unknown>, error: null };
}

// ─── LÕI DÙNG CHUNG ────────────────────────────────────────────────────────

/**
 * Một lượt sửa **hoàn chỉnh**: đọc bản cũ → hỏi luật khoá → ghi → đếm dòng →
 * ghi phiên bản.
 *
 * 🔑 Bảy chứng từ đi qua **đúng một** hàm này. Viết bảy lần là bảy cơ hội để
 * một trong bảy quên mất phép đếm dòng ở ②, và cái quên đó **im lặng** — người
 * dùng thấy *"Đã lưu"* trong khi CSDL ⛔ không đổi gì.
 *
 * ⚠️ `ORDER` **⛔ KHÔNG** dùng hàm này: phán quyết của PO cần đọc bảng
 * `production_orders`, và `phanQuyetSua()` tự ném lỗi nếu bị gọi với `'ORDER'`.
 * PO đi qua `updatePo()` ở `po.actions.ts`.
 */
async function ghiSua(
  loai: Exclude<LoaiChungTu, 'ORDER'>,
  id: string,
  patch: Record<string, unknown>,
  moTa: string,
): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const bang = BANG[loai];
  const luat = LUAT[loai];

  // ① Ảnh chụp TRƯỚC — nguyên dòng, ⛔ không chỉ vài cột. Sổ phiên bản chụp
  //    thiếu cột thì lúc tra lại ⛔ không dựng lại được chứng từ.
  const { data: cu, error: eDoc } = await g.supabase
    .from(bang).select('*').eq('id', id).maybeSingle();
  if (eDoc) return { ok: false, message: friendlyDbError(`ghiSua:${bang}:read`, eDoc) };
  if (!cu) {
    return { ok: false, message: `Không tìm thấy ${luat.nhan.toLowerCase()}, hoặc bạn ⛔ không có quyền xem nó.` };
  }
  const truoc = cu as Record<string, unknown>;

  // ② Luật khoá theo workflow — TRƯỚC mọi lệnh ghi. Kiểm sau khi ghi ⛔ không
  //    phải là kiểm.
  const tt = luat.cotTrangThai === null ? null : String(truoc[luat.cotTrangThai] ?? '');
  const pq = phanQuyetSua(loai, tt);
  if (!duocSua(pq)) {
    return { ok: false, message: pq.loiRa ? `${pq.vi} ${pq.loiRa}` : pq.vi };
  }

  // ③ 🔴 CHỈ GHI Ô ĐÃ ĐỔI — Board *MD Final Input Experience* §A.
  const patchThuc = chiGhiODaDoi(truoc, patch);
  if (Object.keys(patchThuc).length === 0) {
    // ⛔ Không có gì đổi ⇒ ⛔ KHÔNG chạm CSDL và ⛔ KHÔNG ghi phiên bản. Một
    // dòng nhật ký "đã sửa" mà ⛔ không ô nào đổi là **nhiễu sổ kiểm toán** —
    // nó làm loãng đúng thứ người ta mở sổ ra để tìm.
    return { ok: true, message: `⛔ Không có gì thay đổi ở ${moTa}.` };
  }

  // Lấy LẠI dòng mới — vừa là phép đếm, vừa là ảnh chụp SAU.
  const { data: sau, error } = await g.supabase
    .from(bang).update(patchThuc).eq('id', id).select('*');
  if (error) return { ok: false, message: friendlyDbError(`ghiSua:${bang}`, error) };
  if (!sau?.length) {
    return {
      ok: false,
      message: `⛔ Không có dòng nào được cập nhật — bạn ⛔ không có quyền sửa ${luat.nhan.toLowerCase()} `
        + 'này ở tầng CSDL. Dữ liệu GIỮ NGUYÊN, ⛔ không mất gì.',
    };
  }

  await writeVersion(loai, id, 'UPDATE', truoc, sau[0] as Record<string, unknown>);

  revalidatePath(PATH);
  return { ok: true, message: `Đã cập nhật ${moTa}.` };
}

/**
 * Lưu trữ *(Archive)* — **⛔ KHÔNG xoá**.
 *
 * 🔴 Chứng từ nào ⛔ chưa có chỗ lưu trữ trung thực thì hàm **từ chối và nói
 * rõ vì sao**, ⛔ không im lặng thành công. Một nút *"Lưu trữ"* bấm vào báo
 * thành công mà dữ liệu ⛔ không đổi gì là **lời nói dối của giao diện** —
 * tệ hơn hẳn một nút bị vô hiệu hoá kèm lời giải thích.
 */
async function ghiLuuTru(
  loai: Exclude<LoaiChungTu, 'ORDER'>,
  id: string,
  patch: Record<string, unknown>,
  moTa: string,
): Promise<ActionResult> {
  const luat = LUAT[loai];
  if (luat.trangThaiLuuTru === null) {
    return { ok: false, message: `⛔ Chưa lưu trữ được ${luat.nhan.toLowerCase()}. ${luat.ghiChuLuuTru}` };
  }

  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const bang = BANG[loai];
  const { data: cu, error: eDoc } = await g.supabase
    .from(bang).select('*').eq('id', id).maybeSingle();
  if (eDoc) return { ok: false, message: friendlyDbError(`ghiLuuTru:${bang}:read`, eDoc) };
  if (!cu) return { ok: false, message: `Không tìm thấy ${luat.nhan.toLowerCase()}.` };
  const truoc = cu as Record<string, unknown>;

  const { data: sau, error } = await g.supabase
    .from(bang).update(patch).eq('id', id).select('*');
  if (error) return { ok: false, message: friendlyDbError(`ghiLuuTru:${bang}`, error) };
  if (!sau?.length) {
    return { ok: false, message: '⛔ Không có dòng nào được cập nhật — RLS đã chặn. Dữ liệu GIỮ NGUYÊN.' };
  }

  // ⚠️ `DELETE` trong sổ kiểm toán, dù CSDL ⛔ không xoá dòng nào. Nhật ký phải
  // nói **ý định nghiệp vụ** *("chứng từ này thôi hiệu lực")*, ⛔ không phải
  // **cơ chế kỹ thuật** *("một cột đổi giá trị")*. Lọc `action='DELETE'` ra là
  // thấy đủ mọi lần chứng từ bị rút khỏi lưu thông.
  await writeVersion(loai, id, 'DELETE', truoc, sau[0] as Record<string, unknown>);

  revalidatePath(PATH);
  return { ok: true, message: `Đã lưu trữ ${moTa}. Dữ liệu GIỮ NGUYÊN, chỉ thôi hiệu lực.` };
}

/** Ba bảng có `deleted_at` — khớp đúng danh sách trong RPC của `052`. */
type BangMem = 'md_documents' | 'style_bom' | 'material_requests';

/**
 * 🟢 **LƯU TRỮ MỀM QUA RPC** — migration `052`.
 *
 * ─── ⚠️ VÌ SAO ⛔ KHÔNG `UPDATE` THẲNG NHƯ BỐN LOẠI KIA ─────────────────
 * PostgREST bọc mọi `PATCH` trong CTE có `RETURNING`, **bất kể** header
 * `Prefer`. Vì có `RETURNING`, PostgreSQL áp policy `SELECT` lên **DÒNG MỚI**.
 * Policy `<bảng>_an_da_luu_tru` lọc `deleted_at IS NULL` ⇒ dòng vừa lưu trữ
 * **theo định nghĩa** ⛔ không thoả nữa ⇒ lệnh trả **0 dòng**.
 *
 * 🔴 Nếu vẫn dùng `ghiLuuTru()`, hàm sẽ báo *"⛔ không có dòng nào được cập
 * nhật — RLS đã chặn"* **dù dữ liệu ĐÃ đổi**. Người dùng bấm lại, và mỗi lần
 * bấm đều "thất bại" trong khi thực ra thành công.
 *
 * ⇒ Đi qua RPC `SECURITY DEFINER` — đúng khuôn `036b` đã chạy thật.
 * 🔑 Bốn loại còn lại *(khách hàng · RFQ · chiết tính · mã hàng)* dùng **cột
 * trạng thái nghiệp vụ**, ⛔ không phải `deleted_at`, nên ⛔ không bị policy
 * này lọc và vẫn đi đường `ghiLuuTru()` bình thường.
 */
async function luuTruMem(
  loai: Exclude<LoaiChungTu, 'ORDER'>,
  bang: BangMem,
  id: string,
  moTa: string,
): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  // Ảnh chụp TRƯỚC — đọc lúc dòng còn hiện, vì sau khi lưu trữ policy sẽ ẩn nó.
  const { data: cu } = await g.supabase.from(bang).select('*').eq('id', id).maybeSingle();
  if (!cu) return { ok: false, message: `Không tìm thấy ${moTa}, hoặc nó đã được lưu trữ.` };

  const { error } = await g.supabase.rpc('mos_md_luu_tru', { p_bang: bang, p_id: id });
  if (error) return { ok: false, message: friendlyDbError(`luuTruMem:${bang}`, error) };

  // ⚠️ `DELETE` trong sổ kiểm toán dù ⛔ không dòng nào bị xoá: nhật ký nói **ý
  // định nghiệp vụ** *("chứng từ này thôi hiệu lực")*, ⛔ không nói cơ chế.
  await writeVersion(loai, id, 'DELETE', cu as Record<string, unknown>, {
    ...(cu as Record<string, unknown>), deleted_at: new Date().toISOString(),
  });

  revalidatePath(PATH);
  return { ok: true, message: `Đã lưu trữ ${moTa}. Dữ liệu GIỮ NGUYÊN — khôi phục được.` };
}

/** Khôi phục một dòng đã lưu trữ mềm. */
async function khoiPhucMem(
  loai: Exclude<LoaiChungTu, 'ORDER'>,
  bang: BangMem,
  id: string,
  moTa: string,
): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const { error } = await g.supabase.rpc('mos_md_khoi_phuc', { p_bang: bang, p_id: id });
  if (error) return { ok: false, message: friendlyDbError(`khoiPhucMem:${bang}`, error) };

  // Đọc SAU khi khôi phục — lúc này policy đã cho thấy lại.
  const { data: sau } = await g.supabase.from(bang).select('*').eq('id', id).maybeSingle();
  await writeVersion(loai, id, 'UPDATE', null, (sau ?? {}) as Record<string, unknown>);

  revalidatePath(PATH);
  return { ok: true, message: `Đã khôi phục ${moTa}.` };
}

// ─── 1. KHÁCH HÀNG ─────────────────────────────────────────────────────────

export async function updateCustomer(id: string, input: unknown): Promise<ActionResult> {
  const parsed = customerFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  return ghiSua('CUSTOMER', id, {
    customer_code: v.customer_code,
    name: v.name,
    brand: nz(v.brand),
    buyer_group: nz(v.buyer_group),
    contact_person: nz(v.contact_person),
    phone: nz(v.phone),
    email: nz(v.email),
    country: nz(v.country),
    address: nz(v.address),
    tax_code: nz(v.tax_code),
    currency: v.currency,
    incoterm: v.incoterm,
    payment_term: nz(v.payment_term),
    credit_limit: v.credit_limit ?? null,
    notes: nz(v.notes),
  }, `khách hàng ${v.customer_code}`);
}

/** 🔑 Khách hàng ⛔ không có `status`; vòng đời của nó là cờ `is_active` có sẵn
 *  từ migration `014`. Hạ cờ = *"ngưng giao dịch"* — mọi đơn cũ, công nợ cũ,
 *  KPI cũ **GIỮ NGUYÊN**. Đó đúng là ngữ nghĩa lưu trữ. */
export async function archiveCustomer(id: string): Promise<ActionResult> {
  return ghiLuuTru('CUSTOMER', id, { is_active: false }, 'khách hàng');
}

export async function restoreCustomer(id: string): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const { data: cu } = await g.supabase.from('customers').select('*').eq('id', id).maybeSingle();
  if (!cu) return { ok: false, message: 'Không tìm thấy khách hàng.' };

  const { data: sau, error } = await g.supabase
    .from('customers').update({ is_active: true }).eq('id', id).select('*');
  if (error) return { ok: false, message: friendlyDbError('restoreCustomer', error) };
  if (!sau?.length) return { ok: false, message: '⛔ Không có dòng nào được cập nhật — RLS đã chặn.' };

  await writeVersion('CUSTOMER', id, 'UPDATE',
    cu as Record<string, unknown>, sau[0] as Record<string, unknown>);
  revalidatePath(PATH);
  return { ok: true, message: 'Đã mở lại giao dịch với khách hàng này.' };
}

// ─── 2. YÊU CẦU BÁO GIÁ ────────────────────────────────────────────────────

export async function updateInquiry(id: string, input: unknown): Promise<ActionResult> {
  const parsed = inquiryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  return ghiSua('INQUIRY', id, {
    inquiry_no: v.inquiry_no,
    customer_id: v.customer_id,
    season_id: nz(v.season_id),
    product_name: v.product_name,
    description: nz(v.description),
    expected_qty: v.expected_qty ?? null,
    target_price: v.target_price ?? null,
    currency: v.currency,
    order_type: v.order_type,
    received_date: v.received_date,
    due_date: nz(v.due_date),
    status: v.status,
    notes: nz(v.notes),
  }, `yêu cầu báo giá ${v.inquiry_no}`);
}

export async function archiveInquiry(id: string): Promise<ActionResult> {
  return ghiLuuTru('INQUIRY', id, { status: 'CANCELLED' }, 'yêu cầu báo giá');
}

// ─── 3. CHIẾT TÍNH GIÁ ─────────────────────────────────────────────────────

/**
 * ⚠️ Chỉ sửa được bản **⛔ CHƯA duyệt**. Bản `APPROVED` bị chặn bởi **ba tầng
 * CSDL độc lập** *(RLS `042` · trigger `045`/`045b` · con `046`)*, và
 * `phanQuyetSua('COSTING', …)` khai đúng như vậy để người dùng nhận câu tiếng
 * Việt thay vì mã lỗi `23514`.
 *
 * 🔑 Đường đúng cho bản đã duyệt là **`reviseCosting()`** — lập phiên bản mới,
 * bản cũ chuyển `SUPERSEDED` và **giữ nguyên làm bằng chứng**. Nó đã có từ
 * trước và ⛔ không bị tệp này thay thế.
 */
export async function updateCosting(id: string, input: unknown): Promise<ActionResult> {
  const parsed = costingFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  return ghiSua('COSTING', id, {
    costing_no: v.costing_no,
    inquiry_id: nz(v.inquiry_id),
    style_id: nz(v.style_id),
    customer_id: nz(v.customer_id),
    order_type: v.order_type,
    currency: v.currency,
    quantity: v.quantity ?? null,
    target_price: v.target_price ?? null,
    quoted_price: v.quoted_price ?? null,
    notes: nz(v.notes),
  }, `bản chiết tính ${v.costing_no}`);
}

export async function archiveCosting(id: string): Promise<ActionResult> {
  return ghiLuuTru('COSTING', id, { status: 'SUPERSEDED' }, 'bản chiết tính');
}

// ─── 4. MÃ HÀNG ────────────────────────────────────────────────────────────

export async function updateStyle(id: string, input: unknown): Promise<ActionResult> {
  const parsed = styleFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  return ghiSua('STYLE', id, {
    style_no: v.style_no,
    style_name: v.style_name,
    customer_id: nz(v.customer_id),
    season_id: nz(v.season_id),
    product_group: nz(v.product_group),
    gender: nz(v.gender),
    hs_code: nz(v.hs_code),
    fabric_type: nz(v.fabric_type),
    sam_minutes: v.sam_minutes ?? null,
    needle_type: nz(v.needle_type),
    machine_types: nz(v.machine_types),
    marker_code: nz(v.marker_code),
    marker_length_m: v.marker_length_m ?? null,
    marker_efficiency: v.marker_efficiency ?? null,
    tech_pack_url: nz(v.tech_pack_url),
    status: v.status,
    notes: nz(v.notes),
  }, `mã hàng ${v.style_no}`);
}

export async function archiveStyle(id: string): Promise<ActionResult> {
  return ghiLuuTru('STYLE', id, { status: 'DISCONTINUED' }, 'mã hàng');
}

// ─── 5. TECH PACK / TÀI LIỆU ───────────────────────────────────────────────

/**
 * Sửa **siêu dữ liệu** của một tài liệu, và **TĂNG SỐ PHIÊN BẢN**.
 *
 * 🔑 `md_documents` là bảng MD **duy nhất** đã có sẵn cột `version` *(migration
 * `015`)*. Board yêu cầu *"⛔ không overwrite"* — ở đây điều đó có nghĩa **cụ
 * thể hơn** mọi bảng khác: đổi `storage_path` mà giữ nguyên `version` là nói
 * rằng tệp cũ và tệp mới **là một**, trong khi chúng là hai bản Tech Pack khác
 * nhau mà xưởng có thể đã cắt theo bản cũ.
 *
 * ⚠️ Tệp cũ trong bucket **⛔ KHÔNG bị xoá** — ảnh chụp phiên bản còn giữ
 * `storage_path` cũ, nên mở lại được. Dọn tệp mồ côi là việc của tác vụ nền,
 * ⛔ không phải của lượt sửa này.
 */
export async function updateTechPack(
  id: string,
  v: { title: string; doc_type: string; storage_path?: string | null; mime_type?: string | null },
): Promise<ActionResult> {
  const title = v.title.trim();
  if (title.length < 1) {
    return { ok: false, message: 'Tên tài liệu ⛔ không được để trống.', fieldErrors: { title: 'Nhập tên tài liệu' } };
  }

  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const { data: cu } = await g.supabase
    .from('md_documents').select('*').eq('id', id).maybeSingle();
  if (!cu) return { ok: false, message: 'Không tìm thấy tài liệu.' };
  const truoc = cu as Record<string, unknown> & { version: number; storage_path: string };

  const duongDanMoi = nz(v.storage_path ?? null);
  const doiTep = duongDanMoi !== null && duongDanMoi !== truoc.storage_path;

  const patch: Record<string, unknown> = {
    title,
    doc_type: v.doc_type,
    mime_type: nz(v.mime_type ?? null),
  };
  if (doiTep) {
    patch.storage_path = duongDanMoi;
    patch.version = Number(truoc.version ?? 1) + 1;
  }

  const { data: sau, error } = await g.supabase
    .from('md_documents').update(patch).eq('id', id).select('*');
  if (error) return { ok: false, message: friendlyDbError('updateTechPack', error) };
  if (!sau?.length) return { ok: false, message: '⛔ Không có dòng nào được cập nhật — RLS đã chặn.' };

  await writeVersion('TECH_PACK', id, 'UPDATE', truoc, sau[0] as Record<string, unknown>);

  revalidatePath(PATH);
  return {
    ok: true,
    message: doiTep
      ? `Đã cập nhật tài liệu và nâng lên phiên bản ${patch.version}. Tệp cũ vẫn còn trong kho.`
      : 'Đã cập nhật thông tin tài liệu.',
  };
}

/** 🟢 Lưu trữ mềm — migration `052`. Tệp gốc và mọi phiên bản GIỮ NGUYÊN. */
export async function archiveTechPack(id: string): Promise<ActionResult> {
  return luuTruMem('TECH_PACK', 'md_documents', id, 'tài liệu');
}

/** Khôi phục một tài liệu đã lưu trữ. */
export async function restoreTechPack(id: string): Promise<ActionResult> {
  return khoiPhucMem('TECH_PACK', 'md_documents', id, 'tài liệu');
}

// ─── 6. ĐỊNH MỨC NPL (BOM) ─────────────────────────────────────────────────

export async function updateBom(id: string, input: unknown): Promise<ActionResult> {
  const parsed = styleBomFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  // ⚠️ `net_consumption` là cột **SINH TỰ ĐỘNG** *(`GENERATED ALWAYS`, migration
  // `015`)* — gửi nó lên sẽ đổ lỗi `428C9`. Công thức hao hụt nằm đúng MỘT chỗ,
  // trong SQL, và ⛔ không được nhân lại ở đây.
  return ghiSua('BOM', id, {
    colorway_id: nz(v.colorway_id),
    material_id: nz(v.material_id),
    item_name: v.item_name,
    category: v.category,
    unit: v.unit,
    consumption_per_pcs: v.consumption_per_pcs,
    wastage_percent: v.wastage_percent,
    supplier: nz(v.supplier),
    notes: nz(v.notes),
  }, `định mức ${v.item_name}`);
}

/** 🟢 Lưu trữ mềm — migration `052`. Dòng định mức GIỮ NGUYÊN, chỉ thôi tính
 *  vào nhu cầu NPL. */
export async function archiveBom(id: string): Promise<ActionResult> {
  return luuTruMem('BOM', 'style_bom', id, 'định mức NPL');
}

export async function restoreBom(id: string): Promise<ActionResult> {
  return khoiPhucMem('BOM', 'style_bom', id, 'định mức NPL');
}

// ─── 7. YÊU CẦU NPL ────────────────────────────────────────────────────────

export async function updateMaterialRequest(id: string, input: unknown): Promise<ActionResult> {
  const parsed = materialRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  return ghiSua('MATERIAL_REQUEST', id, {
    request_no: v.request_no,
    order_id: nz(v.order_id),
    material_name: v.material_name,
    category: v.category,
    quantity: v.quantity,
    unit: v.unit,
    needed_date: v.needed_date,
    notes: nz(v.notes),
    evidence_path: nz(v.evidence_path),
  }, `yêu cầu NPL ${v.request_no}`);
}

/**
 * 🟢 Lưu trữ mềm — migration `052`.
 *
 * ⚠️ VẪN ⛔ KHÔNG mượn `REJECTED`: *"bị từ chối"* ⛔ **KHÔNG** đồng nghĩa
 * *"đã lưu trữ"*, và nay ⛔ không cần mượn nữa vì đã có `deleted_at` thật.
 *
 * 🔴 `052` còn chặn ở **tầng CSDL**: phiếu ĐÃ NHẬN KHO (`RECEIVED`) ⛔ không
 * lưu trữ được — nó là chứng từ đối ứng của một phiếu nhập, gỡ đi là lệch tồn
 * kho mà ⛔ không lỗi nào nổ ra.
 */
export async function archiveMaterialRequest(id: string): Promise<ActionResult> {
  return luuTruMem('MATERIAL_REQUEST', 'material_requests', id, 'yêu cầu NPL');
}

export async function restoreMaterialRequest(id: string): Promise<ActionResult> {
  return khoiPhucMem('MATERIAL_REQUEST', 'material_requests', id, 'yêu cầu NPL');
}

/**
 * Danh sách dòng **ĐÃ LƯU TRỮ** của một bảng.
 *
 * 🔴 **⛔ KHÔNG PHẢI TIỆN NGHI — LÀ AN TOÀN.** Policy `<bảng>_an_da_luu_tru`
 * ẩn chúng khỏi mọi câu `SELECT` thường, nên ⛔ không có hàm này thì lưu trữ là
 * **cửa MỘT CHIỀU**: bấm nhầm một cái, dòng biến mất và ⛔ không ai tìm lại
 * được để khôi phục. Một thao tác đảo ngược được mà ⛔ không có đường đảo là
 * một thao tác **⛔ không đảo ngược được trên thực tế**.
 */
export async function listDaLuuTru(
  bang: 'md_documents' | 'style_bom' | 'material_requests',
): Promise<{ rows: Array<{ id: string; nhan: string; deleted_at: string }>; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const { data, error } = await g.supabase.rpc('mos_md_ds_luu_tru', { p_bang: bang });
  if (error) return { rows: [], error: friendlyDbError('listDaLuuTru', error) };
  return { rows: (data ?? []) as Array<{ id: string; nhan: string; deleted_at: string }>, error: null };
}
