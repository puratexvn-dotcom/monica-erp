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
import { Bell, SlidersHorizontal } from 'lucide-react';

import HeaderVerse from '@/components/header-verse';
import LanguageSwitcher from '@/components/language-switcher';

import { LOGO_SRC, LOGO_ALT, APP_NAME } from '@/lib/brand';

export default function TopNavbar({
  /**
   * Trang chủ đặt `false`: câu Lời Chúa đã có một khối riêng, trang trọng hơn,
   * trong Executive Hero. Hiện hai lần trên cùng một màn hình thì cả hai lần
   * đều mất giá trị.
   *
   * ⚠️ Mặc định vẫn là `true` — không màn hình nào khác bị đổi hành vi, và câu
   * Lời Chúa KHÔNG bị gỡ khỏi hệ thống, chỉ đổi chỗ trên đúng một trang.
   */
  showVerse = true,
}: {
  showVerse?: boolean;
} = {}) {
  return (
    <>
      {/* ── Thanh điều hướng kính mờ ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="relative mx-auto flex min-h-16 max-w-[1600px] items-center gap-3 px-3 py-2 sm:min-h-20 sm:gap-4 sm:px-6 lg:min-h-[6.5rem] lg:px-8">
          {/* Logo — h-8/w-24 (mobile), h-10/w-36 (từ sm). Thu thêm một nấc so
              với bản trước để nhường bề ngang cho câu Lời Chúa ở giữa: câu càng
              có nhiều chỗ thì càng ít phải xuống dòng.
              Bấm vào về trang chủ: logo dẫn về "/" là quy ước chung của mọi ứng
              dụng web, và đây cũng là đường duy nhất quay lại trang chủ từ khu
              vực nội bộ. */}
          <Link
            href="/"
            aria-label={`Về trang chủ ${APP_NAME}`}
            className="relative h-8 w-24 shrink-0 rounded-lg transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:h-10 sm:w-36"
          >
            <Image
              src={LOGO_SRC}
              alt={LOGO_ALT}
              fill
              sizes="(max-width: 640px) 96px, 144px"
              className="object-contain object-left"
              priority
            />
          </Link>

          {/* ── LỜI CHÚA (màn rộng) — căn giữa TUYỆT ĐỐI theo thanh ─────
              Nằm ngoài luồng flex nên không bị logo và cụm nút đẩy lệch. Chỉ
              hiện từ lg: khối căn tuyệt đối không đẩy được ai ra, màn hẹp hơn
              thì nó sẽ đè lên logo — biến thể 'bar' bên dưới lo phần đó. */}
          {showVerse && <HeaderVerse variant="center" />}

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

            {/* ── PLATFORM SERVICES (§34) — lối vào ở Top Header ────────────
                §14 định nghĩa Top Header là Global Command Bar thường trực, nên
                đây là chỗ đúng cho một lối vào nền tảng: vào được /admin từ MỌI
                trang, không phải quay về trang chủ trước.
                Thẻ trên Launcher vẫn giữ (ADR-001) — hai lối vào cho cùng một
                dịch vụ là chủ ý, không phải trùng lặp. Trước ADR-001, /admin
                từng chỉ có ĐÚNG MỘT lối vào là thẻ trang chủ; `components/
                sidebar.tsx` có khai mục /admin nhưng không được gắn ở layout
                nào (nợ kỹ thuật TD-04).
                ⚠️ KHÔNG đổi phân quyền: middleware và guard của /admin giữ
                nguyên, nút này chỉ là đường dẫn. Ai không đủ quyền vẫn bị
                chặn đúng như trước. */}
            <Link
              href="/admin"
              aria-label="Platform Services — quản trị hệ thống"
              title="Platform Services"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition-all hover:border-violet-300 hover:text-violet-600 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* ── LỜI CHÚA (điện thoại & máy tính bảng) — hàng riêng ──────────
            Nằm TRONG luồng nên tự chiếm chỗ, không đè lên logo. Đây là cách
            duy nhất để câu hiện được ở màn hẹp mà vẫn giữ căn giữa tuyệt đối
            ở màn rộng. */}
        {showVerse && <HeaderVerse variant="bar" />}
      </header>

    </>
  );
}
