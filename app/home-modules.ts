// ============================================================================
// SỔ ĐĂNG KÝ BUSINESS APP — LỚP TƯƠNG THÍCH
//
// ⚠️ **Dữ liệu thật đã chuyển xuống `lib/mos/registry/business-apps.ts`.**
//
// Board Rev 3: *"Homepage ⛔ không được hardcode số lượng Business Apps. Chuyển
// sang đọc từ **Business App Registry**… Business Group cũng chuyển sang
// Registry, Homepage **chỉ render**."*
//
// ─── VÌ SAO REGISTRY THUỘC VỀ `lib/`, ⛔ KHÔNG THUỘC `app/` ─────────────
// *"Doanh nghiệp có những Business App nào"* là **tri thức nghiệp vụ**, ⛔ không
// phải chi tiết của một màn hình. Đặt nó ở `app/` thì:
//
//   • khung chờ, bài kiểm và tầng AI **⛔ không đọc được** — arch test mục ③
//     cấm `lib/` nhập từ `app/`;
//   • và trang chủ trở thành **chủ sở hữu** danh mục, trong khi nó chỉ nên là
//     **một trong nhiều người đọc**.
//
// 🔑 Tệp này **giữ lại** để mọi nơi đang nhập từ `@/app/home-modules` vẫn chạy
//    *(ràng buộc giao diện #2 — ⛔ không xoá đường dùng cũ)*. Mã mới nên nhập
//    thẳng từ `@/lib/mos/registry/business-apps`.
// ============================================================================

export {
  NHOM,
  MODULES,
  MODULES_THEO_NHOM,
  SO_BUSINESS_APP,
  SO_O_MOI_NHOM,
  timApp,
} from '@/lib/mos/registry/business-apps';

export type {
  NhomKey,
  ModuleItem,
  ModuleReady,
  ModuleComingSoon,
} from '@/lib/mos/registry/business-apps';
