import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/utils/supabase/server';

/**
 * Đăng xuất bằng POST, không phải GET.
 *
 * Nếu để đăng xuất qua GET thì chỉ cần nhúng <img src="/auth/signout"> vào
 * một trang bất kỳ là đá được người dùng ra khỏi hệ thống (CSRF). Trình duyệt
 * không tự phát sinh POST chéo trang kèm cookie theo cách tương tự.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL('/login', request.url), {
    status: 303, // buộc trình duyệt chuyển POST -> GET khi đi tiếp
  });
}
