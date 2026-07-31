'use client';

// ============================================================================
// TOP NAVBAR — Glassmorphism, Lời Chúa, bộ chọn ngôn ngữ
//
// ─── VÌ SAO VẪN LÀ CLIENT COMPONENT ───────────────────────────────────────
// Bộ chọn ngôn ngữ cần state và localStorage. Riêng dải Lời Chúa vẫn là Server
// Component lồng vào đây: câu được chọn theo NGÀY nên máy chủ và trình duyệt
// tính ra cùng kết quả, không thêm byte JavaScript nào.
//
// ─── ĐÃ GỠ ────────────────────────────────────────────────────────────────
// Đồng hồ thời gian thực, ô tìm kiếm Ctrl+K (kèm toàn bộ bảng lệnh và phím
// tắt), và nút hồ sơ "JS · Quản trị viên". Gỡ nút mà giữ lại phím tắt sẽ thành
// một chức năng ẩn không ai biết đường gọi.
// ============================================================================

import Link from 'next/link';
import Image from 'next/image';
import { Bell } from 'lucide-react';

import HeaderVerse from '@/components/header-verse';
import LanguageSwitcher from '@/components/language-switcher';

import { LOGO_SRC, LOGO_ALT } from '@/lib/brand';

export default function TopNavbar() {
  return (
    <>
      {/* ── Thanh điều hướng kính mờ ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-3 sm:h-20 sm:gap-4 sm:px-6 lg:px-8">
          {/* Logo — h-10/w-32 (mobile), h-14/w-52 (từ sm): đúng một nửa cỡ ở
              bản trước. Chiều cao thanh hạ theo (h-24/sm:h-32 -> h-16/sm:h-20),
              nếu giữ nguyên thanh cao thì logo nhỏ sẽ trôi giữa một dải trống
              rất rộng.
              Bấm vào về trang chủ: logo dẫn về "/" là quy ước chung của mọi ứng
              dụng web, và đây cũng là đường duy nhất quay lại trang chủ từ khu
              vực nội bộ. */}
          <Link
            href="/"
            aria-label="Về trang chủ Monica ERP"
            className="relative h-10 w-32 shrink-0 rounded-lg transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:h-14 sm:w-52"
          >
            <Image
              src={LOGO_SRC}
              alt={LOGO_ALT}
              fill
              sizes="(max-width: 640px) 128px, 208px"
              className="object-contain object-left"
              priority
            />
          </Link>

          {/* ── LỜI CHÚA ─────────────────────────────────────────────────
              Chiếm phần giữa thanh, ép một dòng và cắt chữ nếu dài. Ẩn dưới
              sm: trên màn 360px thì logo + 3 nút ngôn ngữ + chuông đã kín chỗ,
              nhồi thêm câu Kinh Thánh vào sẽ cắt cụt tới mức không đọc nổi —
              mà khối lớn giữa trang vẫn hiện đầy đủ cho mọi cỡ màn. */}
          <HeaderVerse className="mx-3 hidden sm:block" />

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher />

            {/* Chuông thông báo */}
            <button
              type="button"
              aria-label="Thông báo (3 chưa đọc)"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                3
              </span>
            </button>
          </div>
        </div>
      </header>

    </>
  );
}
