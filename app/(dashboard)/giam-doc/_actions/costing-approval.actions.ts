'use server';

import { revalidatePath } from 'next/cache';

import { guard } from '../_services/guard';
import { writeVersion } from '../../md/_actions/audit';
import { kiemQuyen } from '@/lib/mos/md/costing-approval';

// ============================================================================
// 🔴 DUYỆT GIÁ — BÀN LÀM VIỆC CỦA GIÁM ĐỐC
//
// ─── LỖI THẬT, UAT VÒNG ĐỜI 08/08/2026 TÌM RA ───────────────────────────
//
//   Đăng nhập gd001 (vai `giamdoc`) → duyệt một bản chiết tính đã TRÌNH
//   ⇒ **BỊ TỪ CHỐI**. Trạng thái CSDL vẫn `SUBMITTED`.
//
// 🔴 **NGHĨA LÀ ⛔ KHÔNG BẢN CHIẾT TÍNH NÀO TRONG HỆ THỐNG CÓ THỂ ĐƯỢC DUYỆT.**
//
// ─── VÌ SAO ────────────────────────────────────────────────────────────
// `setCostingStatus` nằm ở `md/_actions/commercial.actions.ts`, dùng guard của
// phân hệ MD với `MODULE_PATH = '/md'`. Nhưng trong `lib/rbac.ts`:
//
//     MODULE_ACCESS.giamdoc = ['/giam-doc', '/orders', '/subcon']   ⛔ KHÔNG có '/md'
//
// Trong khi luật thuần `costing-approval.ts` nói **chỉ `giamdoc` và
// `superadmin` được duyệt**, và MD **⛔ không được tự duyệt** *(phân tách trách
// nhiệm — MD tự duyệt giá của chính mình là SoD thủng ở chỗ đắt nhất)*.
//
// 🔑 Hai điều khoản đúng, ghép lại thành một **ngõ cụt**: người DUY NHẤT có
// quyền duyệt là người DUY NHẤT ⛔ không vào được màn hình để bấm.
//
// ─── ⛔ HAI CÁCH SỬA ĐÃ BỊ BÁC ─────────────────────────────────────────
// ⛔ **Thêm `/md` vào `MODULE_ACCESS.giamdoc`.** Đó là trao cho Giám đốc
//    **cả phân hệ Merchandising** — hàng chục màn hình và hàng chục hành động
//    — chỉ để mở một nút. Quyết định phân quyền, ⛔ không phải hệ quả phụ của
//    một lượt vá.
// ⛔ **Nới `kiemQuyen` cho MD tự duyệt.** Xoá đúng điều khoản SoD mà Board
//    dựng lên 06/08/2026.
//
// ─── ✅ CÁCH ĐÚNG ──────────────────────────────────────────────────────
// Đưa **hành động** về nơi người có quyền đang đứng. Giám đốc duyệt giá ở
// **bàn làm việc của Giám đốc** — đúng ngữ nghĩa, và ⛔ không nới quyền nào.
//
// 🔑 Cùng khuôn đã dùng cho `reopenOrder` *(đặt ở `/orders` vì `giamdoc` vào
// được đó)*. Đây là **mẫu lặp lại thứ hai** ⇒ ghi vào DNA: *"đặt hành động ở
// module mà VAI CÓ QUYỀN với tới được, ⛔ không ở module SỞ HỮU dữ liệu."*
//
// ⚠️ Luật *ai được duyệt* vẫn đọc từ **đúng một** nguồn — `kiemQuyen()` ở
// `lib/mos/md/costing-approval.ts`. Tệp này ⛔ **không** dựng bộ luật thứ hai;
// nó chỉ mở một **cửa vào** cho bộ luật đã có.
// ============================================================================

/**
 * Giám đốc duyệt / từ chối / yêu cầu làm lại một bản chiết tính.
 *
 * ⚠️ Trả về cùng hình dạng `ActionResult` như `setCostingStatus` để màn hình
 * xử lý kết quả y hệt.
 */
export async function duyetChietTinh(
  id: string,
  status: 'APPROVED' | 'REJECTED' | 'REVISE',
  lyDo?: string,
): Promise<{ ok: boolean; message: string }> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  // 🔴 Chốt quyền ở MÁY CHỦ bằng ĐÚNG bộ luật thuần — Server Action là endpoint
  // gọi thẳng được, ẩn nút chỉ là phép lịch sự với giao diện.
  const q = kiemQuyen(g.role, status);
  if (!q.ok) return { ok: false, message: q.vi };

  // Từ chối mà ⛔ không nêu lý do thì người làm lại bản chiết tính ⛔ không biết
  // phải sửa gì — vòng trình duyệt sẽ chạy vô tận.
  const ly = (lyDo ?? '').trim();
  if ((status === 'REJECTED' || status === 'REVISE') && ly === '') {
    return { ok: false, message: 'Phải nêu lý do khi từ chối hoặc yêu cầu làm lại.' };
  }

  const { data: truoc } = await g.supabase
    .from('costings').select('*').eq('id', id).maybeSingle();
  if (!truoc) return { ok: false, message: 'Không tìm thấy bản chiết tính.' };
  const cu = truoc as Record<string, unknown> & { status: string; costing_no: string };

  // ⚠️ Chỉ bản ĐÃ TRÌNH mới duyệt được. Duyệt thẳng một bản `DRAFT` là bỏ qua
  // bước trình — và bước trình chính là chỗ MD xác nhận số liệu đã xong.
  if (String(cu.status).toUpperCase() !== 'SUBMITTED') {
    return {
      ok: false,
      message: `Bản chiết tính đang ở trạng thái "${cu.status}" — chỉ duyệt được bản ĐÃ TRÌNH (SUBMITTED).`,
    };
  }

  const patch: Record<string, unknown> = { status };
  if (status === 'APPROVED') {
    patch.approved_by = g.userId;
    patch.approved_at = new Date().toISOString();
    patch.reject_reason = null;
  } else {
    patch.reject_reason = ly;
  }

  // ⚠️ `.select('*')` — `error === null` MỘT MÌNH ⛔ không đủ: RLS lọc dòng thì
  // lệnh trả **thành công với 0 dòng**. Bài học đã trả giá ở `reviseCosting`
  // (`ADR-018` §B-1). Đây cũng là nguồn ảnh chụp SAU.
  const { data: sau, error } = await g.supabase
    .from('costings').update(patch).eq('id', id).select('*');
  if (error) return { ok: false, message: `Không cập nhật được: ${error.message}` };
  if (!sau?.length) {
    return {
      ok: false,
      message: '⛔ Không có dòng nào được cập nhật — RLS đã chặn. '
        + 'Vai `giamdoc` có thể ⛔ chưa được cấp quyền GHI trên bảng `costings` '
        + '(migration 042 cấp cho `superadmin,md`). Báo quản trị hệ thống.',
    };
  }

  await writeVersion('COSTING', id,
    status === 'APPROVED' ? 'APPROVE' : 'REJECT',
    cu, sau[0] as Record<string, unknown>);

  revalidatePath('/giam-doc');
  revalidatePath('/md');
  const NHAN: Record<string, string> = {
    APPROVED: 'đã DUYỆT', REJECTED: 'đã TỪ CHỐI', REVISE: 'đã yêu cầu LÀM LẠI',
  };
  return { ok: true, message: `Bản chiết tính ${cu.costing_no} ${NHAN[status]}.` };
}

/** Danh sách bản chiết tính **đang chờ Giám đốc duyệt**. */
export async function listChoDuyet(): Promise<{
  rows: Array<{
    id: string; costing_no: string; version: number; quoted_price: number | null;
    currency: string | null; quantity: number | null; created_at: string;
  }>;
  error: string | null;
}> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  const { data, error } = await g.supabase
    .from('costings')
    .select('id, costing_no, version, quoted_price, currency, quantity, created_at')
    .eq('status', 'SUBMITTED')
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) return { rows: [], error: `Không đọc được hộp thư duyệt giá: ${error.message}` };
  return { rows: (data ?? []) as Array<{
    id: string; costing_no: string; version: number; quoted_price: number | null;
    currency: string | null; quantity: number | null; created_at: string;
  }>, error: null };
}
