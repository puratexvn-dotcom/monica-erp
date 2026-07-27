// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Lấy ma trận phân quyền từ utils/rbac
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/giam-doc': ['ADMIN', 'DIRECTOR'],
  '/kho': ['ADMIN', 'DIRECTOR', 'WAREHOUSE_MANAGER'],
  '/to-truong-cat': ['ADMIN', 'DIRECTOR', 'CUTTING_MANAGER'],
  '/to-truong-may': ['ADMIN', 'DIRECTOR', 'SEWING_MANAGER'],
  '/qa': ['ADMIN', 'DIRECTOR', 'QA_MANAGER'],
  '/hoan-thanh': ['ADMIN', 'DIRECTOR', 'FINISHING_MANAGER'],
  '/xuat-hang': ['ADMIN', 'DIRECTOR', 'LOGISTICS_MANAGER'],
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Bỏ qua các route công khai (Auth, API, Static files)
  if (path.startsWith('/login') || path.startsWith('/_next') || path.includes('.')) {
    return supabaseResponse
  }

  // 1. Nếu chưa đăng nhập mà vào route nội bộ -> Đẩy về /login
  if (!user && path !== '/') {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // 2. Kiểm tra RBAC (Phân quyền) nếu đã đăng nhập
  if (user) {
    // Tìm cấu hình quyền của route hiện tại (Chỉ lấy root path, vd: /giam-doc)
    const protectedRoute = Object.keys(ROUTE_PERMISSIONS).find(route => path.startsWith(route))
    
    if (protectedRoute) {
      const allowedRoles = ROUTE_PERMISSIONS[protectedRoute]
      
      // Fetch role từ DB ở Edge
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const userRole = profile?.role || 'USER'

      // Nếu Role không nằm trong danh sách cho phép -> Đẩy về trang /unauthorized
      if (!allowedRoles.includes(userRole)) {
        const unauthorizedUrl = request.nextUrl.clone()
        unauthorizedUrl.pathname = '/unauthorized' // Bạn có thể tạo thêm page app/unauthorized/page.tsx sau
        return NextResponse.redirect(unauthorizedUrl)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}