import { canAccess, type Role } from '@/lib/rbac';

// ============================================================================
// LỌC BUSINESS APP THEO QUYỀN — HÀM THUẦN · `UI-1.2`
//
// Hiến pháp **§13.5** đòi trang chủ **lọc theo quyền**; **ADR-017** nâng khoản
// đó thành **điều kiện thi hành**.
//
// ─── 🔑 VÌ SAO LÀ HÀM THUẦN, VÀ VÌ SAO NHẬN DANH SÁCH QUA THAM SỐ ────────
// Sổ đăng ký Business App nằm ở `app/home-modules.ts`. Arch test mục ③ **cấm**
// `lib/` nhập từ `app/` — nên hàm này ⛔ **không** đi lấy danh sách, mà **nhận**
// nó. Nhờ vậy:
//
//   • kiểm được **⛔ không cần CSDL** và **⛔ không cần React**
//   • ⛔ không tạo phụ thuộc ngược `lib/ → app/`
//   • dùng lại được cho cổng đối tác về sau, nơi danh sách App khác hẳn
//
// ─── 🔴 VÀ VÌ SAO NÓ GỌI `canAccess`, ⛔ KHÔNG TỰ SO CHUỖI ───────────────
// `middleware.ts` dùng `canAccess()` để **chặn**. Nếu ở đây tôi tự viết một
// phép so tiền tố thứ hai, hai bộ luật sẽ trôi khỏi nhau — và ngày chúng lệch,
// giao diện sẽ mời người dùng bấm vào đúng thứ middleware chắc chắn từ chối.
//
// **Một sự thật, một nguồn.** Đây chính là `G6` áp cho phân quyền.
//
// ⚠️ Hàm này quyết định **BÀY CÁI GÌ**, ⛔ không quyết định **CHO VÀO HAY
// KHÔNG**. Hàng rào vẫn là middleware · guard · RLS.
// ============================================================================

/** Trạng thái một Business App. `COMING_SOON` = đã có tên hiến định, ⛔ chưa có
 *  route. Board Decision `Q2` 05/08/2026: **hiện, khoá, gắn nhãn** — ⛔ không ẩn. */
export type ModuleStatus = 'READY' | 'COMING_SOON';

/**
 * Chỉ những trường cần để phán quyền. Nhận đúng chừng này thì hàm dùng lại
 * được ở cổng đối tác mà ⛔ không kéo theo cả `ModuleItem`.
 *
 * 🔑 Khai bằng **union phân biệt**: mục `COMING_SOON` ⛔ **không có trường
 * `href`**. Board `Q2` chỉ thị *"⛔ không dùng `href: null`"*, và cách này mạnh
 * hơn một quy ước — **trình biên dịch** ⛔ không cho ai đặt liên kết vào một App
 * chưa có route.
 */
export type ModuleAccess =
  | { status: 'READY'; href: string }
  | { status: 'COMING_SOON' };

/**
 * Vai này có được **thấy** App đó ⛔ không.
 *
 * | Trường hợp | Kết quả | Vì sao |
 * |---|---|---|
 * | ⛔ chưa đăng nhập | **⛔ không** | Board `Q3` — trang chủ công khai ⛔ không bày bản đồ phân hệ |
 * | `COMING_SOON` | **có** *(khi đã đăng nhập)* | Board `Q2` — hiện + khoá + nhãn |
 * | `READY` | theo `canAccess` | dùng lại đúng bộ luật của middleware |
 */
export function canSeeModule(role: Role | null | undefined, mod: ModuleAccess): boolean {
  // 🔴 Vế này đóng `UI-F1`: người chưa đăng nhập ⛔ không thấy App nào.
  if (!role) return false;
  if (mod.status === 'COMING_SOON') return true;
  return canAccess(role, mod.href);
}

/**
 * Lọc danh sách App theo quyền, **giữ nguyên thứ tự hiến định**.
 *
 * ⚠️ Giữ thứ tự là ràng buộc, ⛔ không phải chi tiết: `MODULES` xếp theo
 * Workspace → Global Service → Platform. Sắp lại sẽ làm vị trí một App nhảy chỗ
 * giữa hai người dùng, và trí nhớ cơ bắp là thứ đắt nhất để xây lại.
 */
export function visibleModules<T extends ModuleAccess>(
  mods: readonly T[],
  role: Role | null | undefined,
): T[] {
  return mods.filter((m) => canSeeModule(role, m));
}

// ============================================================================
// TRẠNG THÁI QUYỀN CỦA MỘT Ô LAUNCHER — `UI-3` · ADR-022
//
// ═══ 🔴 ĐÂY LÀ ĐẢO CHIỀU SO VỚI `canSeeModule` PHÍA TRÊN ════════════════
// `canSeeModule` trả lời *"có ẩn App này đi ⛔ không"*. Board đã bác cách đó:
// trang chủ **hiện TOÀN BỘ Module**, quyền kiểm **lúc MỞ**, ⛔ không kiểm bằng
// cách vắng mặt.
//
// ⚠️ Hai hàm **cùng tồn tại có chủ ý** — ⛔ không xoá hàm cũ:
//   • `canSeeModule` / `visibleModules` vẫn là bộ luật cho **cổng đối tác** và
//     mọi bề mặt CÓ lọc; 62 phép kiểm đang đứng trên nó.
//   • `modulePermissionState` là bộ luật cho **trang chủ**.
//
// ═══ 🔑 VÌ SAO TÍNH Ở CLIENT LÀ AN TOÀN ════════════════════════════════
// Trạng thái này nằm ở **bậc ③** của Permission Architecture — tầng TRẢI
// NGHIỆM, ⛔ **không** phải tầng AN NINH *(`PA-1`)*. Hàng rào là `guard.ts`
// *(⑤)*, Server Action *(⑥)* và **RLS** *(⑦)*.
//
// ⇒ Tính sai ở đây **⛔ không tạo ra lỗ hổng** — nó tạo ra **một cú bấm hụt**.
//   Đó chính là `PA-2`: ô Launcher **⛔ CHƯA BAO GIỜ** là hàng rào.
// ============================================================================

/**
 * Bốn trạng thái một ô Launcher có thể mang.
 *
 * ⚠️ `ANONYMOUS` **⛔ KHÔNG được suy thành `UNAUTHORIZED`** *(`LI-2`)*. Với
 * khách, hệ thống **⛔ không biết** họ sẽ có quyền gì — làm mờ ô của họ là
 * **nói dối**, và nó giết đúng giá trị mà Board mua bằng việc hiện toàn bộ.
 */
export type PermissionState =
  | 'AUTHORIZED'
  | 'UNAUTHORIZED'
  | 'COMING_SOON'
  | 'ANONYMOUS';

/**
 * Ô này ở trạng thái nào với người đang xem.
 *
 * | Trường hợp | Kết quả | Bấm thì sao |
 * |---|---|---|
 * | ⛔ chưa có route | `COMING_SOON` | ⛔ không bấm được |
 * | ⛔ chưa đăng nhập | `ANONYMOUS` | → `/login?next=…` *(middleware)* |
 * | có quyền | `AUTHORIZED` | → Workspace |
 * | ⛔ không quyền | `UNAUTHORIZED` | → `/unauthorized` *(middleware)* |
 *
 * 🔑 Thứ tự hai vế đầu **quan trọng**: `COMING_SOON` xét TRƯỚC đăng nhập. Một
 * App ⛔ chưa có route thì ⛔ không ai mở được, kể cả `superadmin` — nên nó ⛔
 * không được đổi mặt theo phiên.
 */
export function modulePermissionState(
  role: Role | null | undefined,
  mod: ModuleAccess,
): PermissionState {
  if (mod.status === 'COMING_SOON') return 'COMING_SOON';
  if (!role) return 'ANONYMOUS';
  return canAccess(role, mod.href) ? 'AUTHORIZED' : 'UNAUTHORIZED';
}

/** Ô có bấm được ⛔ không. Chỉ `COMING_SOON` là ⛔ không. */
export function moduleClickable(state: PermissionState): boolean {
  return state !== 'COMING_SOON';
}
