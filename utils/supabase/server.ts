import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Khởi tạo Supabase Client cho Máy chủ (Server Component / Server Actions / Route Handlers).
 * Cho phép đọc/ghi Cookie an toàn để xác thực người dùng.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Khối catch này được yêu cầu bởi @supabase/ssr.
            // Bỏ qua lỗi nếu hàm này được gọi từ một Server Component (nơi không thể ghi cookie trực tiếp).
          }
        },
      },
    }
  )
}