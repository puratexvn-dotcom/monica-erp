'use server';

import { revalidatePath } from 'next/cache';

import { guard, friendlyDbError, safeQuery } from '../_services/guard';
import { writeAudit, writeVersion } from './audit';
// Luật ai-được-duyệt nằm ở `lib/` — Cổng khách hàng và bảng tổng của Giám đốc
// rồi cũng phải đọc đúng luật này.
import { kiemQuyen, duocTrinh } from '@/lib/mos/md/costing-approval';
import { tinhCM, giaChaoBan, type Khau } from '@/lib/mos/md/operations';
import {
  customerFormSchema,
  customerContactSchema,
  inquiryFormSchema,
  costingFormSchema,
  costingItemSchema,
  summarizeCosting,
  calcMargin,
  zodFieldErrors,
  type ActionResult,
  type CostingItemRow,
} from '@/schemas/md';

const PATH = '/md';

function nz(v: string | undefined | null): string | null {
  return v && v.trim() !== '' ? v : null;
}

// ─── 1. KHÁCH HÀNG ──────────────────────────────────────────────────────────

/**
 * Tạo khách hàng với ĐỦ hồ sơ thương mại (đồng tiền, điều kiện giao hàng, điều
 * khoản thanh toán, hạn mức công nợ).
 *
 * Hàm createCustomer cũ trong md-actions.ts vẫn giữ nguyên, không xoá — nó chỉ
 * ghi phần tối thiểu và đang được form cũ dùng. Hàm này là bản đầy đủ cho màn
 * hình CRM 360°.
 */
export async function createCustomerFull(input: unknown): Promise<ActionResult<{ id: string }>> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = customerFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { data, error } = await g.supabase
    .from('customers')
    .insert({
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
      // 🔴 Hồ sơ B2B — Board 08/08/2026. Cột do `054` thêm.
      // ⚠️ `?? null` chứ ⛔ KHÔNG `?? 0`: `0` = *"trả ngay (COD)"*, `null` =
      // *"⛔ chưa khai"* — cùng luật ba trạng thái với `credit_limit`.
      credit_term_days: v.credit_term_days ?? null,
      product_categories: nz(v.product_categories),
      market: nz(v.market),
      buyer_since: nz(v.buyer_since),
      notes: nz(v.notes),
      created_by: g.userId,
    })
    .select('*')
    .single();

  if (error) {
    const msg = friendlyDbError('createCustomerFull', error);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { customer_code: 'Mã khách hàng này đã dùng' } : undefined,
    };
  }

  const dong = data as Record<string, unknown>;
  const id = dong.id as string;
  await writeAudit('CUSTOMER', id, 'CREATE', { customer_code: { from: null, to: v.customer_code } });
  // 🔴 **LỖI THẬT — UAT BIỂU MẪU 08/08/2026 TÌM RA: `CUSTOMER` ⛔ CHƯA TỪNG CÓ
  //    PHIÊN BẢN 1.**
  //
  // Đo được: tạo một khách hàng rồi sửa nó **một lần** ⇒ sổ phiên bản đọc ra
  // `[1]`, ⛔ không phải `[1, 2]`. Vì lượt tạo chỉ gọi `writeAudit` — một
  // **dòng nhật ký**, ⛔ không phải một **ảnh chụp**. `writeVersion` đếm số
  // ảnh chụp đang có, thấy `0`, nên lượt SỬA đầu tiên tự đánh số `1`.
  //
  // 🔑 Hai hậu quả, và cái thứ hai nặng hơn:
  //   ① số phiên bản **lệch một** so với số lần chứng từ thật sự đổi
  //   ② **giá trị GỐC ⛔ không được chụp lại ở đâu cả** ⇒ sửa xong thì ⛔
  //      không còn đường nào biết lúc lập nó mang giá trị gì
  //
  // ⚠️ Board `BUG-5` 07/08/2026 đòi *"lưu Version, ⛔ không overwrite dữ
  // liệu"*. Ghi vết *"ai đã tạo"* mà ⛔ không chụp *"tạo ra cái gì"* thì điều
  // khoản ấy mới thi hành được một nửa.
  await writeVersion('CUSTOMER', id, 'CREATE', null, dong);

  revalidatePath(PATH);
  return { ok: true, message: `Đã tạo khách hàng ${v.customer_code} — ${v.name}.`, data: { id } };
}

export async function addContact(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = customerContactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  // Chỉ được một người liên hệ chính: hạ cờ của những người còn lại trước.
  // Hai người cùng là "chính" thì email xác nhận đơn hàng biết gửi cho ai?
  if (v.is_primary) {
    await g.supabase
      .from('customer_contacts')
      .update({ is_primary: false })
      .eq('customer_id', v.customer_id);
  }

  const { error } = await g.supabase.from('customer_contacts').insert({
    customer_id: v.customer_id,
    full_name: v.full_name,
    job_title: nz(v.job_title),
    department: nz(v.department),
    email: nz(v.email),
    phone: nz(v.phone),
    is_primary: v.is_primary,
    notes: nz(v.notes),
  });

  if (error) return { ok: false, message: friendlyDbError('addContact', error) };

  revalidatePath(PATH);
  return { ok: true, message: `Đã thêm người liên hệ ${v.full_name}.` };
}

// ─── 2. YÊU CẦU BÁO GIÁ ─────────────────────────────────────────────────────

export async function createInquiry(input: unknown): Promise<ActionResult<{ id: string }>> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = inquiryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { data, error } = await g.supabase
    .from('inquiries')
    .insert({
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
      created_by: g.userId,
    })
    .select('*')
    .single();

  if (error) {
    const msg = friendlyDbError('createInquiry', error);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { inquiry_no: 'Số yêu cầu này đã dùng' } : undefined,
    };
  }

  const dong = data as Record<string, unknown>;
  const id = dong.id as string;
  await writeAudit('INQUIRY', id, 'CREATE', { inquiry_no: { from: null, to: v.inquiry_no } });
  // 🔴 Cùng khuyết tật, cùng cách vá — xem chú thích ở `createCustomerFull`.
  await writeVersion('INQUIRY', id, 'CREATE', null, dong);

  revalidatePath(PATH);
  return { ok: true, message: `Đã tạo yêu cầu báo giá ${v.inquiry_no}.`, data: { id } };
}

export async function setInquiryStatus(id: string, status: string): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const { data: before } = await g.supabase.from('inquiries').select('status').eq('id', id).maybeSingle();

  const { error } = await g.supabase.from('inquiries').update({ status }).eq('id', id);
  if (error) return { ok: false, message: friendlyDbError('setInquiryStatus', error) };

  await writeAudit('INQUIRY', id, 'UPDATE', {
    status: { from: (before as { status: string } | null)?.status ?? null, to: status },
  });

  revalidatePath(PATH);
  return { ok: true, message: 'Đã cập nhật trạng thái yêu cầu báo giá.' };
}

// ─── 3. CHIẾT TÍNH GIÁ ──────────────────────────────────────────────────────

export async function createCosting(input: unknown): Promise<ActionResult<{ id: string }>> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = costingFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { data, error } = await g.supabase
    .from('costings')
    .insert({
      costing_no: v.costing_no,
      version: 1,
      inquiry_id: nz(v.inquiry_id),
      style_id: nz(v.style_id),
      customer_id: nz(v.customer_id),
      order_type: v.order_type,
      currency: v.currency,
      quantity: v.quantity ?? null,
      target_price: v.target_price ?? null,
      quoted_price: v.quoted_price ?? null,
      status: 'DRAFT',
      notes: nz(v.notes),
      created_by: g.userId,
    })
    .select('*')
    .single();

  if (error) {
    const msg = friendlyDbError('createCosting', error);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại')
        ? { costing_no: 'Số chiết tính này đã có phiên bản 1. Dùng nút "Làm bản mới" để tăng phiên bản.' }
        : undefined,
    };
  }

  const dong = data as Record<string, unknown>;
  const id = dong.id as string;
  await writeAudit('COSTING', id, 'CREATE', { costing_no: { from: null, to: `${v.costing_no} v1` } });
  // 🔴 Cùng khuyết tật, cùng cách vá — xem chú thích ở `createCustomerFull`.
  // ⚠️ `version` của bản chiết tính và **số phiên bản chứng từ** là HAI thứ
  // khác nhau: cái đầu là bản chào giá thứ mấy với khách, cái sau là lần sửa
  // thứ mấy của một bản. Chúng ⛔ không thay thế được cho nhau.
  await writeVersion('COSTING', id, 'CREATE', null, dong);

  revalidatePath(PATH);
  return { ok: true, message: `Đã tạo bản chiết tính ${v.costing_no} phiên bản 1.`, data: { id } };
}

export async function addCostingItem(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const parsed = costingItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  // amount là cột SINH TỰ ĐỘNG (định mức × đơn giá) — không gửi lên, cũng
  // không tự nhân ở đây, để công thức chỉ nằm đúng một chỗ trong SQL.
  const { error } = await g.supabase.from('costing_items').insert({
    costing_id: v.costing_id,
    category: v.category,
    item_name: v.item_name,
    unit: nz(v.unit),
    consumption: v.consumption ?? null,
    unit_price: v.unit_price ?? null,
    notes: nz(v.notes),
  });

  if (error) return { ok: false, message: friendlyDbError('addCostingItem', error) };

  await syncCostingMargin(v.costing_id);
  revalidatePath(PATH);
  return { ok: true, message: `Đã thêm khoản mục ${v.item_name}.` };
}

export async function deleteCostingItem(itemId: string, costingId: string): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  // 🟢 08/08/2026 · migration `053` — XOÁ MỀM QUA RPC, ⛔ không `.delete()`.
  // `053` thu hồi quyền `DELETE` của `authenticated` (đóng `TD-25`).
  //
  // ⚠️ Trigger `046` vẫn đứng nguyên: khoản mục của chiết tính **ĐÃ DUYỆT**
  // bất động hoàn toàn, nên lệnh này sẽ đổ `23514` ở đó — ĐÚNG, và người dùng
  // nhận câu tiếng Việt qua `friendlyDbError`.
  const { error } = await g.supabase.rpc('mos_md_luu_tru',
    { p_bang: 'costing_items', p_id: itemId });
  if (error) return { ok: false, message: friendlyDbError('deleteCostingItem', error) };

  await syncCostingMargin(costingId);
  revalidatePath(PATH);
  return { ok: true, message: 'Đã xoá khoản mục.' };
}

/**
 * Cập nhật lại margin_percent lưu sẵn sau mỗi lần khoản mục thay đổi.
 *
 * Màn hình luôn TÍNH LẠI biên lợi nhuận từ khoản mục nên không phụ thuộc cột
 * này; cột lưu sẵn tồn tại để bảng danh sách 500 dòng không phải mở từng bản
 * chiết tính ra cộng. Đồng bộ ngay tại đây để hai chỗ không lệch nhau.
 */
async function syncCostingMargin(costingId: string): Promise<void> {
  const g = await guard();
  if (!g.supabase) return;

  const [itRes, cRes] = await Promise.all([
    safeQuery<CostingItemRow>('khoản mục chiết tính', () =>
      g.supabase
        .from('costing_items')
        .select('id, category, item_name, unit, consumption, unit_price, amount')
        .eq('costing_id', costingId),
    ),
    g.supabase.from('costings').select('quoted_price').eq('id', costingId).maybeSingle(),
  ]);

  const quoted = (cRes.data as { quoted_price: number | null } | null)?.quoted_price ?? null;
  const { total } = summarizeCosting(itRes.rows.map((i) => ({ ...i, amount: Number(i.amount ?? 0) })));
  const margin = calcMargin(quoted === null ? null : Number(quoted), total);

  await g.supabase.from('costings').update({ margin_percent: margin }).eq('id', costingId);
}

export async function setCostingStatus(
  id: string,
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISE',
  reason?: string,
): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  // 🔴 CHỐT VAI — Board 06/08/2026: MD **trình**, MD ⛔ **không duyệt**.
  //
  // Trước bản này ⛔ không có dòng nào kiểm vai ở đây, và màn hình hiện nút
  // "Duyệt" cho mọi người ⇒ **MD tự duyệt được giá của chính mình**.
  //
  // ⚠️ Kiểm ở MÁY CHỦ, ⛔ không chỉ ẩn nút: Server Action là **endpoint gọi
  // thẳng được** *(CLAUDE.md §2.1)*. Ẩn nút chỉ là phép lịch sự với giao diện.
  const q = kiemQuyen(g.role, status);
  if (!q.ok) return { ok: false, message: q.vi };

  // Từ chối mà không nêu lý do thì người làm lại bản chiết tính không biết
  // phải sửa gì — vòng lặp trình duyệt sẽ chạy vô tận.
  if ((status === 'REJECTED' || status === 'REVISE') && !nz(reason ?? null)) {
    return { ok: false, message: 'Phải nêu lý do khi từ chối hoặc yêu cầu làm lại.' };
  }

  const patch: Record<string, unknown> = { status };
  if (status === 'APPROVED') {
    patch.approved_by = g.userId;
    patch.approved_at = new Date().toISOString();
    patch.reject_reason = null;
  }
  if (status === 'REJECTED' || status === 'REVISE') patch.reject_reason = nz(reason ?? null);

  const { error } = await g.supabase.from('costings').update(patch).eq('id', id);
  if (error) return { ok: false, message: friendlyDbError('setCostingStatus', error) };

  await writeAudit('COSTING', id, status === 'APPROVED' ? 'APPROVE' : status === 'REJECTED' ? 'REJECT' : 'UPDATE', {
    status: { from: null, to: status },
  });

  revalidatePath(PATH);
  const LABEL: Record<string, string> = {
    SUBMITTED: 'đã trình duyệt', APPROVED: 'đã duyệt',
    REJECTED: 'đã từ chối', REVISE: 'đã yêu cầu làm lại',
  };
  return { ok: true, message: `Bản chiết tính ${LABEL[status]}.` };
}

/**
 * Làm PHIÊN BẢN MỚI của một bản chiết tính: chép nguyên các khoản mục sang bản
 * mới rồi đánh dấu bản cũ là "đã có bản mới thay thế".
 *
 * Sửa đè lên bản cũ là mất dấu vết. Khi khách hỏi "sao lần trước báo 4,20 USD
 * mà giờ 4,65?", phải mở lại được đúng bản 4,20 để chỉ ra khoản nào tăng.
 */
export async function reviseCosting(costingId: string): Promise<ActionResult<{ id: string }>> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  const { data: src, error: readErr } = await g.supabase
    .from('costings')
    .select(
      'costing_no, version, inquiry_id, style_id, customer_id, order_type, currency,' +
        ' quantity, target_price, quoted_price, notes',
    )
    .eq('id', costingId)
    .maybeSingle();

  if (readErr) return { ok: false, message: friendlyDbError('reviseCosting:read', readErr) };
  if (!src) return { ok: false, message: 'Không tìm thấy bản chiết tính gốc.' };

  // Ép qua unknown vì chuỗi select nối bằng dấu + không còn là literal nên bộ
  // suy kiểu của Supabase trả về GenericStringError thay vì hình dạng thật.
  const s = src as unknown as {
    costing_no: string; version: number; inquiry_id: string | null; style_id: string | null;
    customer_id: string | null; order_type: string | null; currency: string | null;
    quantity: number | null; target_price: number | null; quoted_price: number | null; notes: string | null;
  };

  // Lấy số phiên bản lớn nhất đang có, không dùng version của bản đang mở:
  // mở bản v1 trong khi đã có v3 mà +1 thì đụng khoá trùng ngay.
  const { data: maxRow } = await g.supabase
    .from('costings')
    .select('version')
    .eq('costing_no', s.costing_no)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((maxRow as { version: number } | null)?.version ?? s.version) + 1;

  const { data: created, error } = await g.supabase
    .from('costings')
    .insert({
      costing_no: s.costing_no,
      version: nextVersion,
      inquiry_id: s.inquiry_id,
      style_id: s.style_id,
      customer_id: s.customer_id,
      order_type: s.order_type,
      currency: s.currency,
      quantity: s.quantity,
      target_price: s.target_price,
      quoted_price: s.quoted_price,
      status: 'DRAFT',
      notes: s.notes,
      created_by: g.userId,
    })
    .select('*')
    .single();

  if (error) return { ok: false, message: friendlyDbError('reviseCosting:insert', error) };
  const newId = (created as { id: string }).id;

  // Chép khoản mục sang bản mới để người dùng sửa từ nền cũ, không gõ lại 20 dòng
  const itemsRes = await safeQuery<{
    category: string; item_name: string; unit: string | null;
    consumption: number | null; unit_price: number | null; notes: string | null;
  }>('khoản mục chiết tính', () =>
    g.supabase
      .from('costing_items')
      .select('category, item_name, unit, consumption, unit_price, notes')
      .eq('costing_id', costingId),
  );

  let copied = 0;
  if (itemsRes.rows.length > 0) {
    const { error: copyErr } = await g.supabase
      .from('costing_items')
      .insert(itemsRes.rows.map((i) => ({ ...i, costing_id: newId })));
    if (copyErr) {
      // Bản mới đã tạo được; báo thật là khoản mục chưa chép sang thay vì im lặng
      return {
        ok: true,
        message: `Đã tạo phiên bản ${nextVersion} nhưng CHƯA chép được khoản mục: ${friendlyDbError('reviseCosting:copy', copyErr)}`,
        data: { id: newId },
      };
    }
    copied = itemsRes.rows.length;
  }

  // ⚠️ PHẢI kiểm cả `error` LẪN số dòng khớp — `error === null` MỘT MÌNH không
  // đủ. RLS lọc dòng thì **im lặng**: lệnh trả về thành công với 0 dòng, không
  // ném lỗi. Chỉ số dòng mới phân biệt được "đã đổi" với "không chạm được dòng
  // nào".
  //
  // Đây không phải lo xa. Đo trên CSDL thật 05/08/2026 cho thấy `UPDATE` lên
  // `costing_items` của một chiết tính đã duyệt trả về **0 dòng, không lỗi** —
  // đúng đường im lặng đó, ở bảng ngay cạnh. Bản trước gọi rồi bỏ qua hoàn toàn
  // kết quả, nên nếu đường này chạm tới `costings` thì hệ thống sẽ sinh HAI bản
  // cùng `APPROVED` cho một mã hàng mà người dùng vẫn thấy báo thành công.
  //
  // Xem docs/review/ADR-018-review.md §B-1.
  const { data: daThayThe, error: supErr } = await g.supabase
    .from('costings').update({ status: 'SUPERSEDED' }).eq('id', costingId).select('id');
  if (supErr || !daThayThe?.length) {
    return {
      ok: false,
      message:
        `Đã tạo phiên bản ${nextVersion} nhưng KHÔNG chuyển được bản cũ sang trạng thái "đã có bản mới thay thế"` +
        `${supErr ? `: ${friendlyDbError('reviseCosting:supersede', supErr)}` : ' — không có dòng nào được cập nhật.'}` +
        ` Hai bản đang cùng hiệu lực cho ${s.costing_no}. Báo quản trị trước khi dùng số liệu này.`,
      data: { id: newId },
    };
  }

  await syncCostingMargin(newId);
  await writeAudit('COSTING', newId, 'CREATE', {
    version: { from: s.version, to: nextVersion },
  });

  revalidatePath(PATH);
  return {
    ok: true,
    message: `Đã tạo phiên bản ${nextVersion} của ${s.costing_no}, chép sang ${copied} khoản mục. Bản cũ chuyển thành "đã có bản mới thay thế".`,
    data: { id: newId },
  };
}

// ─── CHIẾT TÍNH TỪ CÔNG ĐOẠN ────────────────────────────────────────────────
//
// Board 06/08/2026: *"Cầm sản phẩm mẫu, tích vào bảng những công đoạn đó… chỉ
// cần **nhập và xác nhận** là ra costing chính xác."*

export interface TaoTuCongDoanInput {
  costing_no: string;
  customer_id?: string | null;
  style_id?: string | null;
  order_type: string;
  currency: string;
  quantity?: number | null;
  /** Công đoạn đã tích, SAM có thể đã được sửa tại chỗ. */
  congDoan: Array<{ ma: string; ten: string; khau: string; sam: number }>;
  giaPhut: number;
  hieuSuat: number;
  overhead: number;
  /** Chi phí nguyên phụ liệu cho MỘT sản phẩm. */
  npl: number;
  bienPhanTram: number;
}

/**
 * Tạo bản chiết tính **kèm từng dòng công đoạn**.
 *
 * 🔑 **Mỗi công đoạn là MỘT dòng `costing_items`** *(category `CM`)*, với
 * `consumption` = SAM và `unit_price` = **giá phút đã chia hiệu suất**. Cột
 * `amount` do CSDL tự tính *(`GENERATED ALWAYS`)*, nên tổng tiền ⛔ không bao
 * giờ lệch giữa các màn hình.
 *
 * ⚠️ Nhờ vậy bản chiết tính **⛔ không phụ thuộc danh mục công đoạn trong mã**:
 * mai kia sửa SAM tham chiếu thì bản đã chốt vẫn giữ nguyên con số đã dùng.
 *
 * 🔴 Tính lại TOÀN BỘ ở máy chủ, ⛔ không tin con số client gửi lên — client chỉ
 * gửi **lựa chọn**, giá thành do máy chủ tính.
 */
export async function createCostingFromOperations(
  v: TaoTuCongDoanInput,
): Promise<ActionResult<{ id: string; cm: number; giaVon: number; giaChao: number }>> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };
  if (!duocTrinh(g.role)) {
    return { ok: false, message: 'Bạn không có quyền lập bản chiết tính.' };
  }
  if (v.congDoan.length === 0) {
    return { ok: false, message: 'Hãy tích ít nhất một công đoạn trước khi chốt.' };
  }

  const cm = tinhCM(
    v.congDoan.map((c) => ({ ma: c.ma, ten: c.ten, khau: c.khau as Khau, sam: c.sam })),
    { giaPhut: v.giaPhut, hieuSuat: v.hieuSuat, overhead: v.overhead },
  );
  const npl = Number.isFinite(v.npl) && v.npl > 0 ? v.npl : 0;
  const giaVon = cm.cmMotSanPham + npl;
  const chao = giaChaoBan(giaVon, v.bienPhanTram);
  if (!chao.hopLe) {
    return { ok: false, message: 'Biên lợi nhuận phải nằm trong khoảng 0–99%.' };
  }

  const { data, error } = await g.supabase.from('costings').insert({
    costing_no: v.costing_no, version: 1,
    style_id: nz(v.style_id ?? null), customer_id: nz(v.customer_id ?? null),
    order_type: v.order_type, currency: v.currency,
    quantity: v.quantity ?? null,
    quoted_price: chao.gia,
    margin_percent: v.bienPhanTram,
    status: 'DRAFT',
    notes: `Chiết tính theo ${v.congDoan.length} công đoạn · tổng SAM ${cm.tongSam}′ `
      + `· hiệu suất ${v.hieuSuat}% · phụ phí ${v.overhead}%`,
    created_by: g.userId,
  }).select('id').single();

  if (error) {
    const msg = friendlyDbError('createCostingFromOperations', error);
    return {
      ok: false, message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { costing_no: 'Số chiết tính này đã dùng' } : undefined,
    };
  }
  const id = (data as { id: string }).id;

  // Giá một phút SAU khi chia hiệu suất — nhân với SAM ra đúng tiền nhân công.
  const giaPhutThuc = v.hieuSuat > 0 ? v.giaPhut / (v.hieuSuat / 100) : 0;
  const dong = v.congDoan.map((c) => ({
    costing_id: id, category: 'CM', item_name: c.ten,
    unit: 'phút', consumption: c.sam, unit_price: giaPhutThuc,
    notes: `${c.ma} · khâu ${c.khau}`,
  }));
  if (cm.overhead > 0) {
    dong.push({
      costing_id: id, category: 'OVERHEAD', item_name: `Phụ phí quản lý xưởng (${v.overhead}%)`,
      unit: 'sp', consumption: 1, unit_price: cm.overhead, notes: 'tính trên chi phí nhân công',
    });
  }
  if (npl > 0) {
    dong.push({
      costing_id: id, category: 'OTHER', item_name: 'Nguyên phụ liệu — tổng',
      unit: 'sp', consumption: 1, unit_price: npl, notes: 'nhập gộp; tách chi tiết ở tab Cấu trúc NPL',
    });
  }

  const { error: eItem } = await g.supabase.from('costing_items').insert(dong);
  if (eItem) {
    // ⚠️ Bản chiết tính đã tạo nhưng CHƯA có dòng nào ⇒ nói thẳng, ⛔ không
    // báo thành công rồi để người dùng mở ra thấy trống.
    return {
      ok: false,
      message: `Đã tạo bản ${v.costing_no} nhưng ⛔ không ghi được các dòng công đoạn: `
        + friendlyDbError('createCostingFromOperations:items', eItem),
    };
  }

  await writeAudit('COSTING', id, 'CREATE', {
    costing_no: { from: null, to: v.costing_no },
    so_cong_doan: { from: null, to: v.congDoan.length },
    tong_sam: { from: null, to: cm.tongSam },
    gia_chao: { from: null, to: chao.gia },
  });

  revalidatePath(PATH);
  return {
    ok: true,
    message: `Đã tạo ${v.costing_no}: CM ${cm.cmMotSanPham} · giá chào ${chao.gia} ${v.currency}.`,
    data: { id, cm: cm.cmMotSanPham, giaVon, giaChao: chao.gia },
  };
}
