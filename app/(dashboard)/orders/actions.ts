'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/utils/supabase/server';
import { canAccess, isRole, type Role } from '@/lib/rbac';
import { poFormSchema, type PoRow } from './po-schema';
import { PO_STATUS_KHI_TAO } from '@/schemas/md';
// 🔴 BUG-4 · Board 07/08/2026. Bộ luật khoá **thuần** — xem chú thích đầu tệp.
import {
  phanQuyetSuaPo, phanQuyetMoLaiPo, duocSua, PO_SAU_KHI_MO_LAI,
} from '@/lib/mos/md/document-lock';
// 🔴 UAT `BUG-3` — xem chú thích tại chỗ gọi trong `createOrder`.
// ⚠️ Dùng LẠI hàm ghi nhật ký đã có ở phân hệ MD, ⛔ không viết hàm thứ hai:
// hai đường ghi nhật ký là hai khuôn bản ghi, và lúc tra cứu sẽ phải hợp nhất
// hai định dạng — đúng thứ một sổ kiểm toán ⛔ không được phép có.
import { writeAudit, writeVersion } from '../md/_actions/audit';

// ============================================================================
// SERVER ACTIONS — Quản lý đơn hàng (bảng `orders`)
//
// Bản cũ có hai lỗ hổng đã sửa ở đây:
//   1. Không kiểm tra quyền — bất kỳ ai gọi được endpoint là tạo được PO.
//      Server Action là endpoint HTTP công khai, không phải hàm nội bộ, nên
//      không được ỷ vào việc middleware đã chặn đường vào trang.
//   2. Validate chỉ bằng vài phép kiểm tra rỗng, ép kiểu bằng parseInt nên
//      "abc" thành NaN vẫn lọt xuống DB.
// ============================================================================

export interface ActionResult {
  ok: boolean;
  message: string;
  /** Lỗi theo từng trường, để form tô đỏ đúng ô thay vì báo chung chung */
  fieldErrors?: Record<string, string>;
}

export interface ListResult {
  rows: PoRow[];
  error: string | null;
}

const MODULE_PATH = '/orders';

/** Xác thực người gọi và quyền vào phân hệ đơn hàng.
 *
 *  🔑 **TRẢ VỀ CẢ `role`.** Bản trước nuốt nó đi, nên mọi action ở tệp này đều
 *  ⛔ không phân biệt được ai đang gọi — và `reopenOrder` bên dưới **⛔ không
 *  thi hành được** điều khoản *"chỉ CEO hoặc Director"* nếu ⛔ không biết vai. */
async function guard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase: null, role: null,
      error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    } as const;
  }

  // ⚠️ `app_metadata`, ⛔ KHÔNG `user_metadata` — người dùng tự sửa được
  // `user_metadata` ⇒ tự leo thang lên `giamdoc` rồi tự mở lại đơn đã khoá.
  const role = user.app_metadata?.role;
  if (!isRole(role) || !canAccess(role, MODULE_PATH)) {
    return {
      supabase: null, role: null,
      error: 'Bạn không có quyền thao tác trên đơn hàng.',
    } as const;
  }

  return { supabase, role: role as Role, error: null } as const;
}

/** Đọc trạng thái + số lệnh sản xuất của một PO — hai dữ kiện `phanQuyetSuaPo`
 *  cần. Gom lại một chỗ để ba nơi gọi ⛔ không đo bằng ba cách khác nhau. */
async function boiCanhPo(
  supabase: NonNullable<Awaited<ReturnType<typeof guard>>['supabase']>,
  id: string,
): Promise<{ cu: Record<string, unknown> | null; daSinhLenhSanXuat: boolean }> {
  const { data: cu } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (!cu) return { cu: null, daSinhLenhSanXuat: false };

  const { data: sx } = await supabase
    .from('production_orders').select('id').eq('order_id', id).neq('status', 'CANCELLED');

  return {
    cu: cu as Record<string, unknown>,
    daSinhLenhSanXuat: (sx ?? []).length > 0,
  };
}

// ── Đọc danh sách ───────────────────────────────────────────────────────────
export async function listOrders(): Promise<ListResult> {
  const { supabase, error } = await guard();
  if (!supabase) return { rows: [], error };

  const { data, error: dbError } = await supabase
    .from('orders')
    .select('id, po_number, customer_name, style_code, total_quantity, delivery_date, status, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (dbError) return { rows: [], error: `Không đọc được danh sách đơn hàng: ${dbError.message}` };

  return { rows: (data ?? []) as PoRow[], error: null };
}

// ── Tạo mới ─────────────────────────────────────────────────────────────────
export async function createOrder(input: unknown): Promise<ActionResult> {
  const { supabase, error } = await guard();
  if (!supabase) return { ok: false, message: error ?? 'Không có quyền' };

  // Validate lại ở server bằng ĐÚNG lược đồ client dùng
  const parsed = poFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors };
  }

  // 🔴 **CÙNG MỘT LUẬT VỚI ORDER MASTER** — Board 08/08/2026.
  // Vá riêng biểu mẫu MD mà bỏ đường này là để nguyên một cửa sau: cùng bảng
  // `orders`, cùng hậu quả, chỉ khác màn hình. Một điều luật chỉ áp ở một trong
  // hai lối vào thì ⛔ không phải điều luật.
  //
  // ⚠️ Cần ghi một đơn CŨ đã duyệt từ trước? Lập ở `Nháp` rồi đổi trạng thái —
  // đường đó đi qua `updateOrderStatus`, nơi **ghi nhật ký và lưu phiên bản**.
  // Chậm hơn một bước, và bước đó chính là **cái vết** cần có.
  if (!(PO_STATUS_KHI_TAO as readonly string[]).includes(parsed.data.status)) {
    return {
      ok: false,
      message: 'Đơn hàng mới chỉ được tạo ở trạng thái Nháp hoặc Chờ duyệt. '
        + 'Duyệt là hành động riêng, phải có người bấm và có vết trong nhật ký.',
      fieldErrors: { status: 'Chỉ được chọn Nháp hoặc Chờ duyệt khi tạo mới' },
    };
  }

  const { data: dong, error: dbError } = await supabase.from('orders').insert({
    po_number: parsed.data.po_number,
    customer_name: parsed.data.customer_name,
    style_code: parsed.data.style_code,
    total_quantity: parsed.data.total_quantity,
    delivery_date: parsed.data.delivery_date,
    // Giá trị thương mại — xem chú thích ở `po-schema.ts`. `undefined` ⇒ ghi
    // `null`, ⛔ KHÔNG ghi 0: `0` đọc thành *"đơn giá bằng không"*, một tin
    // sai; `null` đọc thành *"⛔ chưa chốt giá"*, đúng sự thật.
    currency: parsed.data.currency,
    unit_price: parsed.data.unit_price ?? null,
    status: parsed.data.status,
  }).select('*').single();

  if (dbError) {
    // 23505 = vi phạm UNIQUE. Báo đúng ô bị trùng thay vì ném mã lỗi Postgres.
    if (dbError.code === '23505') {
      return {
        ok: false,
        message: `Mã PO "${parsed.data.po_number}" đã tồn tại.`,
        fieldErrors: { po_number: 'Mã PO này đã có trong hệ thống' },
      };
    }
    return { ok: false, message: `Không tạo được đơn hàng: ${dbError.message}` };
  }

  // 🔴 THÊM 07/08/2026 · UAT `BUG-3` — TRƯỚC ĐÂY TẠO PO ⛔ KHÔNG ĐỂ LẠI VẾT.
  //
  // Đo bằng phiên md001 thật: lập một PO qua giao diện rồi mở tab **Nhật ký**
  // ⇒ ⛔ không có dòng nào. Đếm trong mã: `commercial.actions.ts` gọi
  // `writeAudit` **8 lần**, `po.actions.ts` **3 lần**, còn tệp này — đúng cái
  // mà nút *"+ Tạo PO"* gọi — **0 lần**.
  //
  // 🔑 Nghĩa là **chứng từ quan trọng nhất hệ thống là chứng từ DUY NHẤT
  // ⛔ không có vết**. Khách hàng · yêu cầu báo giá · chiết tính đều truy được
  // *"ai lập, lúc nào"*; đơn hàng thì ⛔ không.
  //
  // ⚠️ `writeAudit` cố ý **⛔ không ném lỗi** *(xem `audit.ts`)*: nhật ký hỏng
  // ⛔ không được làm hỏng việc tạo đơn. Nên đặt nó SAU khi ghi thành công và
  // ⛔ không `try/catch` thêm ở đây — thêm nữa là che mất log máy chủ.
  await writeAudit('ORDER', (dong as { id: string } | null)?.id ?? null, 'CREATE', {
    po_number: { from: null, to: parsed.data.po_number },
    total_quantity: { from: null, to: parsed.data.total_quantity },
    // Giá trị thương mại vào thẳng nhật ký: đây là ô hay bị sửa nhất sau khi
    // đàm phán lại, và cũng là ô cần truy vết nhất.
    unit_price: { from: null, to: parsed.data.unit_price ?? null },
    currency: { from: null, to: parsed.data.currency },
  });
  // 🔴 **VÁ 08/08/2026 — vết CÓ, ảnh chụp ⛔ KHÔNG.**
  // Dòng `writeAudit` ngay trên ghi được *"ai lập, lúc nào"* nhưng chỉ chụp
  // **bốn ô**. `writeVersion` chụp **nguyên dòng** và đánh số phiên bản `1`.
  // Thiếu nó thì lượt SỬA đầu tiên tự đánh số `1` — sổ phiên bản lệch một, và
  // giá trị lúc lập ⛔ không còn ở đâu để đối chiếu.
  await writeVersion('ORDER', (dong as { id: string } | null)?.id ?? '', 'CREATE',
    null, dong as Record<string, unknown>);

  revalidatePath(MODULE_PATH);
  return { ok: true, message: `Đã tạo đơn hàng ${parsed.data.po_number}.` };
}

// ── Đổi trạng thái ──────────────────────────────────────────────────────────
/**
 * 🔴 **HAI LỖ HỔNG ĐÃ VÁ Ở ĐÂY · UAT 07/08/2026 · `BUG-4`.**
 *
 * ① **⛔ KHÔNG có Audit Log.** Board: *"Mọi thao tác phải ghi Audit Log."*
 *    Hàm này đổi được **trạng thái** — dữ kiện quyết định cả việc khoá chứng
 *    từ lẫn việc tính *"PO đang chạy"* — mà ⛔ không để lại một dòng nào. Nó
 *    là **anh em sinh đôi của `BUG-3`**: `BUG-3` vá đường TẠO ở tệp này, còn
 *    đường ĐỔI TRẠNG THÁI thì vẫn câm.
 *
 * ② **⛔ KHÔNG có phép khoá nào.** Một PO `COMPLETED` lật ngược về `DRAFT`
 *    bằng đúng một lời gọi — *"khoá tuyệt đối"* của Board sẽ chỉ là chữ trên
 *    giấy nếu cửa sau này còn mở. `/orders` là **cửa sau thật**: `giamdoc`
 *    vào được `/orders` nhưng ⛔ không vào được `/md`, nên chốt đặt ở `/md`
 *    ⛔ không che được lối này.
 */
export async function updateOrderStatus(id: string, status: string): Promise<ActionResult> {
  const { supabase, error } = await guard();
  if (!supabase) return { ok: false, message: error ?? 'Không có quyền' };

  const parsed = poFormSchema.shape.status.safeParse(status);
  if (!parsed.success) return { ok: false, message: 'Trạng thái không hợp lệ.' };

  const { cu, daSinhLenhSanXuat } = await boiCanhPo(supabase, id);
  if (!cu) return { ok: false, message: 'Không tìm thấy đơn hàng, hoặc bạn không có quyền xem nó.' };

  const pq = phanQuyetSuaPo({ status: String(cu.status ?? ''), daSinhLenhSanXuat });
  if (!duocSua(pq)) {
    return { ok: false, message: pq.loiRa ? `${pq.vi} ${pq.loiRa}` : pq.vi };
  }

  const { data: sau, error: dbError } = await supabase
    .from('orders')
    .update({ status: parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*');

  if (dbError) return { ok: false, message: `Không cập nhật được trạng thái: ${dbError.message}` };
  if (!sau?.length) {
    return {
      ok: false,
      message: 'Không có dòng nào được cập nhật — RLS đã chặn. Trạng thái GIỮ NGUYÊN.',
    };
  }

  await writeVersion('ORDER', id, 'UPDATE', cu, sau[0] as Record<string, unknown>);

  revalidatePath(MODULE_PATH);
  return { ok: true, message: 'Đã cập nhật trạng thái đơn hàng.' };
}

// ── Mở lại chứng từ đã đóng ─────────────────────────────────────────────────
/**
 * 🔴 **RE-OPEN WORKFLOW** — Board Decision 07/08/2026, mục *"Bổ sung thêm ②"*:
 *
 *   > *"Completed chỉ được Re-open bởi **CEO hoặc Director**."*
 *
 * ─── ⚠️ VÌ SAO HÀM NÀY NẰM Ở `/orders`, ⛔ KHÔNG Ở `/md` ─────────────────
 * `MODULE_ACCESS.giamdoc = ['/giam-doc', '/orders', '/subcon']` — **⛔ KHÔNG
 * có `/md`**. `guard()` của phân hệ MD kiểm `canAccess(role, '/md')` và sẽ
 * **bác Giám đốc**. Đặt Re-open ở `/md` là viết một điều khoản mà **đúng người
 * được trao quyền lại ⛔ không với tới được** — thứ trông như đã thi hành
 * nhưng đo ra là chưa.
 *
 * 🔑 Cùng lý do, nút Re-open bày ở màn hình `/orders`, ⛔ không ở Workspace MD.
 *
 * ⚠️ **⛔ KHÔNG mở rộng `MODULE_ACCESS` để giải bài này.** Mở `/md` cho
 * `giamdoc` là trao thêm **cả phân hệ**, ⛔ không chỉ một nút — đó là quyết
 * định phân quyền, cần Board, ⛔ không phải hệ quả phụ của một lượt vá UAT.
 */
export async function reopenOrder(id: string, lyDo: string): Promise<ActionResult> {
  const { supabase, role, error } = await guard();
  if (!supabase) return { ok: false, message: error ?? 'Không có quyền' };

  // Mở lại một chứng từ đã đóng mà ⛔ không nêu lý do thì dòng nhật ký sinh ra
  // trả lời được *"ai · lúc nào"* nhưng ⛔ không trả lời được *"vì sao"* — mà
  // đó mới là câu người kiểm toán hỏi.
  const ly = lyDo.trim();
  if (ly.length < 10) {
    return {
      ok: false,
      message: 'Phải nêu LÝ DO mở lại (ít nhất 10 ký tự). Đây là chứng từ đã đóng.',
      fieldErrors: { lyDo: 'Nêu rõ vì sao phải mở lại đơn này' },
    };
  }

  const { cu } = await boiCanhPo(supabase, id);
  if (!cu) return { ok: false, message: 'Không tìm thấy đơn hàng, hoặc bạn không có quyền xem nó.' };

  const pq = phanQuyetMoLaiPo(String(cu.status ?? ''), role);
  if (!duocSua(pq)) {
    return { ok: false, message: pq.loiRa ? `${pq.vi} ${pq.loiRa}` : pq.vi };
  }

  const { data: sau, error: dbError } = await supabase
    .from('orders')
    .update({ status: PO_SAU_KHI_MO_LAI, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*');

  if (dbError) return { ok: false, message: `Không mở lại được đơn hàng: ${dbError.message}` };
  if (!sau?.length) {
    return { ok: false, message: 'Không có dòng nào được cập nhật — RLS đã chặn. Đơn GIỮ NGUYÊN trạng thái đóng.' };
  }

  // ⚠️ `APPROVE`, ⛔ không `UPDATE`: mở lại một chứng từ đã đóng là **hành vi
  // thẩm quyền**, và sổ kiểm toán phải phân biệt được nó với một lượt sửa
  // thường. Lọc `action = 'APPROVE'` ra là thấy đủ mọi lần chứng từ bị mở lại.
  await writeVersion('ORDER', id, 'APPROVE', cu, {
    ...(sau[0] as Record<string, unknown>),
    __ly_do_mo_lai: ly,
  });

  revalidatePath(MODULE_PATH);
  revalidatePath('/md');
  return {
    ok: true,
    message: `Đã mở lại đơn hàng về trạng thái "${PO_SAU_KHI_MO_LAI}". Lý do đã ghi vào nhật ký.`,
  };
}
