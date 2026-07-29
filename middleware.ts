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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const protectedPath = isProtectedPath(path);

  // /update-password đòi đăng nhập, nhưng KHÔNG thuộc phân hệ nào nên phải
  // đứng ngoài bước kiểm tra vai trò ở dưới — nếu không, người dùng đang bị
  // ép đổi mật khẩu sẽ bị chính bước RBAC đá sang /unauthorized và kẹt cứng.
  const isPasswordReset = path === '/update-password';
  const requiresAuth = protectedPath || isPasswordReset;

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
