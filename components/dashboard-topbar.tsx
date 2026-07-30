import Image from 'next/image';
import Link from 'next/link';
import { Home } from 'lucide-react';

import { LOGO_SRC, LOGO_ALT } from '@/lib/brand';

// ============================================================================
// THANH ĐẦU TRANG CHO KHU VỰC DASHBOARD
//
// ─── VÌ SAO PHẢI CÓ ─────────────────────────────────────────────────────
// Trước đây các trang phân hệ KHÔNG có header nào: TopNavbar chỉ tồn tại ở
// app/page.tsx. Cộng với thanh điều hướng dưới đáy chỉ có đúng 4 nút (Bàn làm
// việc / Chat / Báo cáo / A.I) mà nút "Bàn làm việc" lại dẫn về dashboard bộ
// phận, kết quả là KHÔNG CÒN ĐƯỜNG NÀO quay về trang chủ sau khi đăng nhập.
// Người dùng vì thế không bao giờ thấy Lời Chúa ở trang chủ.
//
// Thanh này cố ý làm mỏng và chỉ có một việc: logo dẫn về "/". Không nhồi thêm
// chức năng để tránh tranh chỗ với thanh 4 nút ở đáy.
// ============================================================================

export default function DashboardTopbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Về trang chủ Monica ERP"
          className="relative h-9 w-28 shrink-0 rounded-lg transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:h-10 sm:w-32"
        >
          <Image src={LOGO_SRC} alt={LOGO_ALT} fill sizes="128px" className="object-contain object-left" />
        </Link>

        <Link
          href="/"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          Trang chủ
        </Link>
      </div>
    </header>
  );
}
