'use client';

// ============================================================================
// ĐĂNG KÝ TỪ ĐIỂN NGÀNH CHO NHÓM ROUTE `(dashboard)`
//
// 🔴 Tối ưu khởi động 06/08/2026.
//
// Trước bản này `lib/i18n.tsx` **nhập giá trị** hai từ điển ngành nặng 82 KB
// *(`md.ts` 65 KB · `warehouse.ts` 17 KB)*. Vì `LanguageProvider` nằm ở layout
// GỐC, hai tệp đó bị ép vào gói của **mọi trang** — kể cả **Trang chủ**, nơi
// ⛔ không dùng một khoá nào của chúng.
//
// Đo được trên trình duyệt *(CPU ×4, mạng 4G)*: chunk chứa từ điển MD là tệp
// **nặng nhất** của Trang chủ và mất **1.897 ms** để tải.
//
// ⇒ Nay `i18n.tsx` chỉ `import type` *(xoá sạch lúc biên dịch, 0 byte)*, còn
// giá trị thật được đăng ký **ở đây** — trong nhóm route `(dashboard)`.
//
// ─── 🔑 VÌ SAO GỌI Ở MODULE SCOPE, ⛔ KHÔNG TRONG `useEffect` ─────────────
// Module scope chạy **lúc chunk được nạp**, tức **trước** khi component đầu
// tiên của Workspace render. Đặt trong `useEffect` thì lần render đầu `t()` sẽ
// trả về **tên khoá** thay vì bản dịch — một cú nháy chữ mà người dùng nhìn
// thấy, và ⛔ không phép kiểm nào bắt được.
//
// ⚠️ Component này **⛔ không vẽ gì**. Nó tồn tại chỉ để layout `(dashboard)`
// có cớ import chunk này. ⛔ Đừng xoá vì tưởng nó thừa.
// ============================================================================
import { dangKyTuDienNganh } from '@/lib/i18n';
import { WAREHOUSE_DICT } from '@/lib/dictionaries/warehouse';
import { MD_DICT } from '@/lib/dictionaries/md';

dangKyTuDienNganh(WAREHOUSE_DICT);
dangKyTuDienNganh(MD_DICT);

export default function DangKyTuDien(): null {
  return null;
}
