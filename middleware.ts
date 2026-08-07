import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { canAccess, isProtectedPath, isRole, ROLE_HOME } from '@/lib/rbac';

// ============================================================================
// CHỐT CHẶN TRUNG TÂM — chạy trước MỌI request vào khu vực nội bộ
//
// ⚠️ File này BẮT BUỘC nằm ở thư mục gốc dự án. Trước đây repo có
// utils/supabase/middleware.ts với đầy đủ nội dung middleware nhưng đặt sai
// chỗ, nên Next.js chưa từng nạp nó — toàn bộ ứng dụng chạy KHÔNG có chốt
// chặn nào suốt thời gian qua.
//
// Thứ tự kiểm tra (không được đảo):
//   1. Chưa đăng nhập + vào route nội bộ      -> /login?next=...
//   2. Đã đăng nhập nhưng còn cờ đổi mật khẩu -> /update-password (ép tuyệt đối)
//   3. Vai trò không được phép vào route      -> /unauthorized
//
// Bước 2 phải đứng TRƯỚC bước 3: người dùng chưa đổi mật khẩu mặc định thì
// không được chạm vào bất cứ dữ liệu nào, kể cả phân hệ đúng quyền của họ.
// ============================================================================

/** Đọc vai trò từ app_metadata — nơi người dùng KHÔNG tự sửa được.
 *  Cố ý không đọc user_metadata: chỗ đó ai đăng nhập cũng ghi đè được, dùng
 *  làm căn cứ phân quyền là tự mở cửa cho leo thang đặc quyền. */
function readRole(appMeta: Record<string, unknown> | undefined) {
  const raw = appMeta?.role;
  return isRole(raw) ? raw : null;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  // Các route thao tác phiên (/auth/signout...) phải LUÔN đi lọt.
  // Nếu để bước ép đổi mật khẩu bên dưới chặn chúng thì nút "Đăng xuất" trên
  // chính trang /update-password sẽ bị đá ngược về /update-password, và người
  // dùng kẹt cứng trong đó không có đường ra.
  if (path.startsWith('/auth/')) return response;

  const protectedPath = isProtectedPath(path);
  const isPasswordReset = path === '/update-password';
  const requiresAuth = protectedPath || isPasswordReset;

  // ── 0. THIẾU CẤU HÌNH ─────────────────────────────────────────────────────
  // createServerClient NÉM LỖI nếu url/key rỗng. Middleware ném lỗi thì Vercel
  // trả 500 MIDDLEWARE_INVOCATION_FAILED cho MỌI request — cả trang công khai
  // lẫn trang tĩnh, tức là sập toàn bộ site chỉ vì một biến môi trường.
  //
  // Lưu ý: biến NEXT_PUBLIC_* được Next.js NỘI TUYẾN vào bundle lúc build, nên
  // thêm biến trên Vercel mà không redeploy thì bản đang chạy vẫn giữ giá trị
  // undefined của lần build trước.
  //
  // Xử lý: không ném lỗi, nhưng cũng KHÔNG cho vào khu vực nội bộ — không xác
  // thực được thì phải coi như chưa đăng nhập, tuyệt đối không "mở cửa cho qua".
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[middleware] Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Kiểm tra biến môi trường rồi REDEPLOY (đổi biến không tự kích hoạt build lại).',
    );
    if (requiresAuth) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      url.searchParams.set('error', 'config');
      return NextResponse.redirect(url);
    }
    return response;
  }

  // ══ ĐƯỜNG TẮT: ⛔ KHÔNG CÓ COOKIE PHIÊN ⇒ ⛔ KHÔNG GỌI MẠNG ══════════════
  //
  // 🔴 Sửa 07/08/2026 sau khi ĐO. `supabase.auth.getUser()` là **một lượt
  // đi–về mạng tới máy chủ Auth**, và middleware chạy cho **mọi** request khớp
  // matcher — kể cả trang chủ công khai và mọi lần Next.js nạp trước
  // (`?_rsc=`). Đo được: TTFB trang chủ **901 ms**, trong đó phần lớn là lượt
  // gọi này.
  //
  // 🔑 **Phép suy luận, ⛔ không phải phỏng đoán:** Supabase giữ phiên trong
  // cookie `sb-…-auth-token`. ⛔ **Không có cookie đó ⇒ ⛔ không thể có phiên**
  // — `getUser()` chắc chắn trả `null`. Gọi mạng để nghe câu trả lời đã biết
  // trước là trả tiền cho một thông tin ⛔ không có.
  //
  // ⚠️ ĐÂY ⛔ **KHÔNG** PHẢI NỚI LỎNG PHÂN QUYỀN. Nhánh này kết luận **CHƯA
  // ĐĂNG NHẬP** — kết luận **NGHIÊM NHẤT** có thể. Nó ⛔ không cho ai vào đâu
  // cả: đường bảo vệ *(chuyển hướng `/login` khi vào khu nội bộ)* giữ **y
  // nguyên**. Thứ duy nhất bỏ đi là lượt gọi mạng thừa.
  //
  // ⚠️ Cookie **có** mà giả mạo thì vẫn đi tiếp xuống `getUser()` như cũ — ⛔
  // không có đường tắt nào cho trường hợp đó, và ⛔ không được có.
  const coCookiePhien = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'));

  if (!coCookiePhien) {
    if (!requiresAuth) return response;
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // ══ ĐƯỜNG TẮT ②: TRANG CÔNG KHAI ⇒ ⛔ KHÔNG GỌI AUTH ═══════════════════
  //
  // 🔴 Sửa 07/08/2026 sau khi ĐO. Với người **đã đăng nhập**, TTFB trang chủ là
  // **857 ms** — gần như toàn bộ là lượt `getUser()` này. Tệ hơn: trang chủ gọi
  // Auth **HAI LẦN** — một ở đây *(chặn từng byte HTML)*, một ở `HomeBody`.
  //
  // 🔑 Middleware cần `user` cho đúng **ba** việc: chặn khu nội bộ · ép đổi mật
  // khẩu · đá khỏi `/login` khi đã đăng nhập. Trang công khai ⛔ **không** dùng
  // tới việc nào trong ba, trừ cổng ép-đổi-mật-khẩu.
  //
  // ⚠️ CỔNG ÉP ĐỔI MẬT KHẨU **⛔ KHÔNG BỊ BỎ** — nó **chuyển chỗ** sang
  // `app/_home/home-body.tsx`, nơi đã sẵn có `getSessionUser()` và nằm **trong
  // `<Suspense>`** nên ⛔ không chặn lần vẽ đầu. Kết quả với người dùng là **y
  // hệt**: vẫn bị đá sang `/update-password`. Đây là **dời phép kiểm**, ⛔
  // KHÔNG phải nới lỏng phân quyền — mọi khu nội bộ vẫn qua nhánh dưới.
  //
  // ⚠️ `/login` và `/update-password` **⛔ KHÔNG** đi đường tắt: hai trang đó
  // dùng `user` cho chính logic của chúng.
  const congKhaiThuan = !requiresAuth && path !== '/login';
  if (congKhaiThuan) return response;

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() xác thực token với máy chủ Supabase, KHÔNG dùng getSession()
  // (getSession chỉ đọc cookie, nội dung cookie có thể bị giả mạo).
  //
  // Bọc try/catch: đây là lời gọi mạng, Supabase quá tải hay hết thời gian chờ
  // là chuyện bình thường. Không bắt lỗi thì mỗi lần đó cả site trả 500.
  // Lỗi mạng được coi như CHƯA ĐĂNG NHẬP — hướng an toàn.
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (e) {
    console.error('[middleware] Không xác thực được phiên:', e);
    if (requiresAuth) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      url.searchParams.set('error', 'unreachable');
      return NextResponse.redirect(url);
    }
    return response;
  }

  // ── 1. Chưa đăng nhập ─────────────────────────────────────────────────────
  if (!user) {
    if (!requiresAuth) return response;
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    // Ghi lại nơi định đến để đăng nhập xong quay lại đúng chỗ
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  const role = readRole(user.app_metadata);
  const mustChangePassword = user.user_metadata?.force_password_change === true;

  // ── 2. Bắt buộc đổi mật khẩu lần đầu ──────────────────────────────────────
  if (mustChangePassword) {
    // Chặn TẤT CẢ, kể cả phân hệ đúng quyền: chưa đổi mật khẩu mặc định thì
    // chưa được chạm vào dữ liệu nào.
    if (!isPasswordReset) {
      const url = request.nextUrl.clone();
      url.pathname = '/update-password';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return response; // đang ở đúng trang đổi mật khẩu -> cho qua, bỏ bước RBAC
  }

  // Đã đổi rồi thì không cho quay lại trang đổi mật khẩu bắt buộc nữa
  if (isPasswordReset) {
    const url = request.nextUrl.clone();
    url.pathname = role ? ROLE_HOME[role] : '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Đã đăng nhập rồi thì không cần xem trang login nữa
  if (path === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = role ? ROLE_HOME[role] : '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // ── 3. Phân quyền theo vai trò ────────────────────────────────────────────
  if (protectedPath && !canAccess(role, path)) {
    const url = request.nextUrl.clone();
    url.pathname = '/unauthorized';
    url.search = '';
    // Cho trang 403 biết người dùng đã cố vào đâu, để hiện thông báo cụ thể
    url.searchParams.set('from', path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Bỏ qua tài nguyên tĩnh và ảnh; mọi thứ còn lại đều đi qua chốt chặn.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
