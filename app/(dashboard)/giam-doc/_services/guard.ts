import 'server-only';

import { createClient } from '@/utils/supabase/server';
import { canAccess, isRole, type Role } from '@/lib/rbac';

// ============================================================================
// CHỐT QUYỀN CỦA BÀN GIÁM ĐỐC (PRODUCTION DIRECTOR)
//
// ⚠️ Đây là **trùng lặp CÓ CHỦ Ý** — kiến trúc §2.3: mỗi phân hệ giữ `guard.ts`
// riêng, khác nhau ở `MODULE_PATH` và thông điệp lỗi. ⛔ Đừng gộp chúng lại.
//
// ─── 🔴 VÌ SAO TỆP NÀY RA ĐỜI, 07/08/2026 ───────────────────────────────
// `/giam-doc` đang gọi `napNguonDigest()` của **phân hệ MD**, mà hàm đó chốt
// quyền bằng guard của MD với `MODULE_PATH = '/md'`. Trong `lib/rbac.ts`:
//
//     giamdoc: ['/giam-doc', '/orders', '/subcon']     ← ⛔ KHÔNG có '/md'
//
// ⇒ Guard **luôn từ chối** giám đốc, `napNguonDigest` trả về nguồn RỖNG, và
// báo cáo ngày trên bàn giám đốc **vĩnh viễn hiện *"⚪ chưa ai báo cáo"***
// — kể cả khi tổ trưởng đã báo đủ. Đo được: `/md` hiện *"Sản lượng nội bộ
// 1 sp"* trong khi `/giam-doc` cùng lúc hiện *"⚪"*.
//
// 🔑 Đây đúng là kiểu hỏng mà `V.1` cảnh báo: màn hình nói *"chưa đo được"*
// nghe như trung thực, nên ⛔ **không ai nghi ngờ** — trong khi sự thật là
// **chốt quyền sai**, và người bị bịt mắt lại chính là **người ra quyết định
// cao nhất của sản xuất**.
//
// ⚠️ Cách sửa ⛔ **KHÔNG** phải thêm `'/md'` vào quyền của `giamdoc` — đổi
// phân quyền là **thẩm quyền Board**. Giám đốc vốn đã đọc được các bảng nhật
// ký ở tầng RLS *(đã đo: `gd001` đọc `finishing_logs`, `hourly_production_logs`,
// `qa_audit_reports` bình thường)*; cái sai chỉ nằm ở chỗ **mượn nhầm guard**.
// ============================================================================

const MODULE_PATH = '/giam-doc';

export interface GuardOk {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  role: Role;
  error: null;
}
export interface GuardFail {
  supabase: null;
  userId: null;
  role: null;
  error: string;
}

export async function guard(): Promise<GuardOk | GuardFail> {
  const fail = (error: string): GuardFail => ({ supabase: null, userId: null, role: null, error });

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return fail('Không kết nối được máy chủ dữ liệu.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return fail('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

  const raw = user.app_metadata?.role;
  if (!isRole(raw) || !canAccess(raw, MODULE_PATH)) {
    return fail('Bạn không có quyền truy cập bàn điều hành của Giám đốc.');
  }

  return { supabase, userId: user.id, role: raw, error: null };
}
