import 'server-only';

import { MODULES } from '@/lib/mos/registry/business-apps';
import { modulePermissionState } from '@/lib/mos/capability/visible-modules';
import {
  duocThayTrangThai, mucSongTuViec, type LiveStateOrNull,
} from '@/lib/mos/registry/live-state';
import type { WorkItem } from '@/lib/mos/workspace/work-item';
import type { Role } from '@/lib/rbac';

// ============================================================================
// ĐO MỨC SỐNG CỦA TỪNG BUSINESS APP
//
// ═══ 🔴 HAI CỔNG PHẢI QUA TRƯỚC KHI ĐO ═════════════════════════════════
//   ① `duocThayTrangThai(quyen)` — người này có được thấy trạng thái ⛔ không
//   ② có Command Center ⛔ không — App ⛔ chưa có thì ⛔ **không đo bừa**
//
// ⚠️ Cổng ① đứng **TRƯỚC** mọi lời gọi dữ liệu, ⛔ không phải sau. Đọc rồi mới
// lọc thì dữ liệu **đã rời khỏi CSDL** — và ở tầng này, *"⛔ không hiện"* ⛔
// **không** đồng nghĩa *"⛔ không đọc"*.
//
// 🔑 Đọc **⛔ ít hơn** cũng là lý do trang chủ vẫn nhanh: người dùng thường chỉ
//    mở được **2–3** trong 22 App, nên ta gọi **2–3** Command Center, ⛔ không
//    phải 22.
//
// ═══ ⛔ KHÔNG BỊA CHẤM CHO APP CHƯA CÓ COMMAND CENTER ═══════════════════
// Mười bảy App ⛔ chưa có Command Center. Cho chúng chấm xanh *"bình thường"*
// sẽ là **nói dối bằng màu**: ô trông như đang được theo dõi, trong khi ⛔
// không ai đo nó cả. ⇒ Trả `null`, và ô ⛔ không có chấm.
// ============================================================================

/** Bộ đo của một Domain. Trả về **hộp thư việc** — cùng thứ Workspace dùng,
 *  nên chấm và hộp thư ⛔ không bao giờ lệch nhau. */
type BoDo = () => Promise<{ viec: WorkItem[]; loi: string | null }>;

/**
 * Sổ bộ đo — **⛔ chỉ App nào thật sự có Command Center mới có mặt ở đây.**
 *
 * ⚠️ Nạp **động** *(`import()`)*, ⛔ không nạp tĩnh: nạp tĩnh sẽ kéo cả năm
 * Command Center vào gói của trang chủ, và trang chủ phải **chờ chúng biên
 * dịch** — đúng thứ Board bảo tránh *("⛔ không chờ dữ liệu Workspace mới hiển
 * thị Homepage")*.
 */
const BO_DO: Record<string, BoDo> = {
  quality: async () => (await import('@/app/(dashboard)/qa/_services/command-center.service')).getQaCommandCenter(),
  cuttingLeader: async () => (await import('@/app/(dashboard)/to-truong-cat/_services/command-center.service')).getCatCommandCenter(),
  sewingLeader: async () => (await import('@/app/(dashboard)/to-truong-may/_services/command-center.service')).getMayCommandCenter(),
};

/** Mức khẩn cao nhất trong một hộp thư. `null` khi hộp thư rỗng. */
function khanCaoNhat(viec: readonly WorkItem[]): 'CRITICAL' | 'WARNING' | 'INFO' | null {
  if (viec.some((v) => v.severity === 'CRITICAL')) return 'CRITICAL';
  if (viec.some((v) => v.severity === 'WARNING')) return 'WARNING';
  return viec.length > 0 ? 'INFO' : null;
}

/**
 * Mức sống của từng App, khoá theo `id`.
 *
 * ⚠️ Chạy **song song** *(`Promise.allSettled`)*: ba lời gọi tuần tự là ba lượt
 * đi–về cộng dồn. Và `allSettled` chứ ⛔ không `all` — **một** Command Center
 * hỏng ⛔ **không** được làm mất chấm của hai cái còn lại.
 */
export async function docMucSong(role: Role | null): Promise<Record<string, LiveStateOrNull>> {
  const canDo = MODULES.filter((m) => {
    // ① CỔNG QUYỀN — đứng trước mọi lời gọi dữ liệu.
    if (!duocThayTrangThai(modulePermissionState(role, m))) return false;
    // ② CÓ BỘ ĐO ⛔ KHÔNG — ⛔ không có thì ⛔ không đo bừa.
    return m.id in BO_DO;
  });

  const ketQua = await Promise.allSettled(canDo.map((m) => BO_DO[m.id]()));

  const ra: Record<string, LiveStateOrNull> = {};
  canDo.forEach((m, i) => {
    const kq = ketQua[i];
    // ⚠️ Đo hỏng ⇒ `null`, ⛔ **KHÔNG** rơi về `'normal'`. Một chấm xanh nói
    // *"mọi thứ ổn"*, mà *"tôi ⛔ không đọc được"* thì ⛔ không phải *"ổn"*.
    if (kq.status !== 'fulfilled' || kq.value.loi) { ra[m.id] = null; return; }
    ra[m.id] = mucSongTuViec(khanCaoNhat(kq.value.viec));
  });

  return ra;
}
