// utils/rbac.ts
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// 1. TỪ ĐIỂN VAI TRÒ (ROLES)
export type AppRole = 
  | 'ADMIN' 
  | 'DIRECTOR' 
  | 'WAREHOUSE_MANAGER' 
  | 'CUTTING_MANAGER' 
  | 'SEWING_MANAGER' 
  | 'QA_MANAGER' 
  | 'FINISHING_MANAGER' 
  | 'LOGISTICS_MANAGER'
  | 'USER'

// 2. MA TRẬN PHÂN QUYỀN ROUTE (ROUTE ACCESS MATRIX)
export const ROUTE_PERMISSIONS: Record<string, AppRole[]> = {
  '/giam-doc': ['ADMIN', 'DIRECTOR'],
  '/kho': ['ADMIN', 'DIRECTOR', 'WAREHOUSE_MANAGER'],
  '/to-truong-cat': ['ADMIN', 'DIRECTOR', 'CUTTING_MANAGER'],
  '/to-truong-may': ['ADMIN', 'DIRECTOR', 'SEWING_MANAGER'],
  '/qa': ['ADMIN', 'DIRECTOR', 'QA_MANAGER'],
  '/hoan-thanh': ['ADMIN', 'DIRECTOR', 'FINISHING_MANAGER'],
  '/xuat-hang': ['ADMIN', 'DIRECTOR', 'LOGISTICS_MANAGER'],
}

// 3. HELPER FUNCTION CHO SERVER COMPONENTS & ACTIONS
export async function getCurrentUserRole(): Promise<AppRole | null> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  // Truy vấn Role từ bảng public.profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return 'USER'
  
  return profile.role as AppRole
}

// 4. CHỐT CHẶN BẢO VỆ SERVER COMPONENT (Dùng trên đầu các file page.tsx)
export async function requireRoles(allowedRoles: AppRole[]) {
  const role = await getCurrentUserRole()
  
  if (!role) {
    redirect('/login')
  }
  
  if (!allowedRoles.includes(role)) {
    redirect('/unauthorized') // Trang báo lỗi 403 Không có quyền
  }
  
  return role
}