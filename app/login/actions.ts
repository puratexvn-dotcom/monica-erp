// app/login/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Kiểm tra đầu vào cơ bản
  if (!email || !password) {
    return { error: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' }
  }

  const supabase = await createClient()

  // 1. Xác thực với Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { error: 'Email hoặc mật khẩu không chính xác.' }
  }

  // 2. Truy vấn Roles của User từ Database
  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('roles ( code )')
    .eq('user_id', authData.user.id)

  if (rolesError || !rolesData || rolesData.length === 0) {
    // Thoát phiên nếu user không có role (Chưa được cấp quyền)
    await supabase.auth.signOut()
    return { error: 'Tài khoản chưa được phân quyền. Vui lòng liên hệ Admin nhà máy.' }
  }

  // Ép kiểu dữ liệu để lấy mảng mã code (VD: ['DIRECTOR', 'QA_QC'])
  const userRoles = rolesData.map((r: any) => r.roles.code)

  // 3. Logic điều hướng (Routing) theo yêu cầu của PO
  let redirectPath = '/portal'

  if (userRoles.length > 1) {
    // Nếu có >= 2 roles, điều hướng về Portal chung
    redirectPath = '/portal'
  } else {
    // Nếu chỉ có 1 role, điều hướng thẳng vào phân hệ tương ứng
    const role = userRoles[0]
    switch (role) {
      case 'WAREHOUSE_MGR':
        redirectPath = '/warehouse'
        break
      case 'SEWING_LEADER':
        redirectPath = '/sewing'
        break
      case 'MD':
        redirectPath = '/md'
        break
      case 'QA_QC':
        redirectPath = '/qc'
        break
      case 'DIRECTOR':
      case 'ADMIN':
        redirectPath = '/portal'
        break
      default:
        redirectPath = '/portal' // Fallback an toàn
    }
  }

  // Redirect (Lưu ý: hàm redirect của Next.js sẽ ném ra một error nội bộ, 
  // nên không được bọc nó trong khối try/catch thông thường).
  redirect(redirectPath)
}