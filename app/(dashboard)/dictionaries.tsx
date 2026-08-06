// ============================================================================
// 🔴 ĐÃ CHUYỂN CHỖ 07/08/2026 — TỆP NÀY CHỈ CÒN LÀ BẢN CHỈ ĐƯỜNG
//
// Trước đây tệp này đăng ký `MD_DICT` + `WAREHOUSE_DICT` cho **cả nhóm route
// `(dashboard)`**. Hệ quả đo được trên `app-build-manifest.json`:
//
//     /(dashboard)/layout     tải từ điển MD: 84 KB   ← MỌI Workspace
//
// Tổ trưởng hoàn thành, kế toán, giám đốc đều tải 84 KB từ điển họ ⛔ không
// tra một khoá nào. Truy khoá cho thấy `md_*` chỉ dùng dưới `/md`, `wh_*` chỉ
// dưới `/md` và `/kho` ⇒ đăng ký **theo nhánh route**:
//
//     app/(dashboard)/md/dictionaries.tsx    ← MD_DICT + WAREHOUSE_DICT
//     app/(dashboard)/kho/dictionaries.tsx   ← WAREHOUSE_DICT
//
// ⚠️ Tệp này **⛔ KHÔNG được import ở đâu nữa**. Giữ lại vì ràng buộc ② của
// dự án — *⛔ không xoá file cũ, chỉ đổi đường dùng*. Nó ⛔ không nằm trong
// gói nào (⛔ không ai import ⇒ ⛔ không vào bundle).
//
// ⛔ ĐỪNG khôi phục phần đăng ký vào đây. Làm vậy là kéo lại đúng 84 KB vừa
// cắt được, và ⛔ không phép kiểm nào bắt được điều đó.
// ============================================================================
export {};
