import HomeContent from './home-content';
import { getSessionUser } from '@/lib/auth/session';
import { docMucSong } from './live-state.service';
import { redirect } from 'next/navigation';

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

  // 🔴 CỔNG ÉP ĐỔI MẬT KHẨU — dời từ `middleware.ts` xuống đây, 07/08/2026.
  //
  // Middleware phải gọi Auth **trước từng byte HTML**, nên phép kiểm này khiến
  // TTFB trang chủ **857 ms** với người đã đăng nhập. Ở đây nó nằm trong
  // `<Suspense>`: khung trang vẽ xong rồi mới tới lượt nó chạy.
  //
  // 🔑 Kết quả với người dùng **y hệt** — vẫn bị đá sang `/update-password`.
  // Thứ duy nhất đổi là **lúc nào** phép kiểm chạy, ⛔ không phải **có chạy hay
  // không**.
  //
  // ⚠️ Đây là lớp **trải nghiệm**, ⛔ không phải hàng rào. Hàng rào thật vẫn là
  // `middleware` cho mọi khu nội bộ · `guard()` mỗi hàm · RLS ở CSDL.
  if (phien?.mustChangePassword) redirect('/update-password');

  const role = phien?.role ?? null;

  // ⚠️ Đo mức sống **SAU** khi biết vai — ⛔ không song song được với nó:
  // cổng quyền `LS-1` cần chính cái vai đó để quyết **App nào được đọc**.
  //
  // 🔑 Nhưng nó ⛔ **không** làm trang chậm thêm bao nhiêu: người dùng
  //    thường chỉ mở được **2–3** trong 22 App, nên đây là 2–3 lời gọi
  //    **chạy song song**, ⛔ không phải 22 lời gọi tuần tự.
  const mucSong = await docMucSong(role);

  return <HomeContent role={role} mucSong={mucSong} />;
}
