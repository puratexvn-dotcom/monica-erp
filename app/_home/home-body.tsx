import HomeContent from './home-content';
import { getSessionUser } from '@/lib/auth/session';

// ============================================================================
// THÂN TRANG CHỦ — TÁCH RA ĐỂ TRANG CHỦ ⛔ KHÔNG CHỜ PHIÊN
//
// ═══ VẤN ĐỀ ĐO ĐƯỢC ════════════════════════════════════════════════════
// `app/page.tsx` gọi `await getSessionUser()` **trước khi dựng một byte HTML
// nào**. Đó là một lượt đi–về tới Supabase Auth, và **toàn bộ trang** — nền,
// thanh đầu, wordmark, chân trang — **⛔ không xuất hiện** cho tới khi lượt đó
// xong.
//
// ⚠️ Với người dùng ở xa máy chủ, đó là **vài trăm mili giây màn hình trắng**
// cho một trang mà **phần lớn nội dung ⛔ không cần phiên chút nào**.
//
// ═══ CÁCH SỬA ══════════════════════════════════════════════════════════
// Đẩy lời gọi xuống **một component con**, rồi bọc nó bằng `<Suspense>`. Next.js
// **stream** phần khung ra ngay, và chỉ phần **thật sự cần phiên** mới chờ.
//
// 🔑 Phiên chỉ quyết định **trạng thái quyền của ô** *(sáng hay mờ)* và **lời
//    mời đăng nhập**. Nó ⛔ **không** quyết định **có bao nhiêu ô** — Board đã
//    chốt *"hiện toàn bộ Module"*. Vì vậy phần chờ là **nhỏ**, và phần hiện
//    ngay là **gần như cả trang**.
//
// ⚠️ ⛔ KHÔNG dùng `getSession()` ở đây. `getUser()` xác thực token với máy chủ
// Auth; `getSession()` chỉ đọc cookie, mà cookie thì **giả mạo được**.
// ============================================================================

export default async function HomeBody() {
  const phien = await getSessionUser();
  return <HomeContent role={phien?.role ?? null} />;
}
