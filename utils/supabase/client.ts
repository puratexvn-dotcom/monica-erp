import { createBrowserClient } from '@supabase/ssr'

/**
 * Khởi tạo Supabase Client cho Trình duyệt (Client Component).
 * Tự động đọc biến môi trường NEXT_PUBLIC_... và quản lý Cookie an toàn dưới nền.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}