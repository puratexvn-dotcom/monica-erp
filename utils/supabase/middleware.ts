// middleware.ts
import { NextResponse, type NextRequest } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Tạo response mặc định để Supabase có thể đính kèm cookie mới vào
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Khởi tạo Supabase client chuẩn Edge cho Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Gọi hàm getUser() để refresh token tự động nếu token cũ sắp hết hạn
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/login')

  // Nếu CHƯA đăng nhập và cố tình vào các trang nội bộ -> Đá về trang /login
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Nếu ĐÃ đăng nhập mà cố tình vào lại trang /login -> Đá vào /portal
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/portal'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// Chỉ định Middleware chạy trên toàn bộ hệ thống ngoại trừ file tĩnh (ảnh, css...)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}