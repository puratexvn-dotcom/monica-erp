'use client';

// ============================================================================
// ĐĂNG KÝ TỪ ĐIỂN CHO NHÁNH ROUTE `/md`
//
// ─── 🔑 VÌ SAO Ở ĐÂY, ⛔ KHÔNG Ở LAYOUT `(dashboard)` ────────────────────
// Bản trước đăng ký ở `app/(dashboard)/dictionaries.tsx`, tức layout **dùng
// chung mọi Workspace**. Hệ quả: tổ trưởng hoàn thành mở `/hoan-thanh` vẫn
// phải tải **82 KB** từ điển của MD và Kho mà màn hình của họ ⛔ không dùng
// **một khoá nào**.
//
// Đo được: `md_*` chỉ xuất hiện dưới `/md`, `wh_*` chỉ dưới `/md` và `/kho`.
// ⇒ Đăng ký **theo nhánh route**, ⛔ không theo nhóm route.
//
// ⚠️ Vẫn gọi ở **module scope**, ⛔ không trong `useEffect` — module scope chạy
// lúc chunk được nạp, tức **trước** lần render đầu. Đặt trong `useEffect` thì
// lần render đầu `t()` trả về **tên khoá** thay vì bản dịch: một cú nháy chữ
// người dùng nhìn thấy mà ⛔ không phép kiểm nào bắt được.
//
// ⚠️ Component này **⛔ không vẽ gì**. Nó tồn tại chỉ để layout có cớ import
// chunk này. ⛔ Đừng xoá vì tưởng nó thừa.
//
// ⚠️ Nhánh `/md` cần **cả hai** từ điển: `components/md/po-command/tabs/*` tra
// khoá `wh_*` *(vật tư · kiểm vải)*. Bỏ `WAREHOUSE_DICT` ở đây là Trung tâm
// Điều hành PO hiện tên khoá trần.
// ============================================================================
import { dangKyTuDienNganh } from '@/lib/i18n';
import { MD_DICT } from '@/lib/dictionaries/md';
import { WAREHOUSE_DICT } from '@/lib/dictionaries/warehouse';

dangKyTuDienNganh(WAREHOUSE_DICT);
dangKyTuDienNganh(MD_DICT);

export default function DangKyTuDienMd(): null {
  return null;
}
