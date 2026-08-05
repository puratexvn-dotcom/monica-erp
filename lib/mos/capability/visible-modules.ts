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
