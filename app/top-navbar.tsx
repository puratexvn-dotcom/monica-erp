'use client';

// ============================================================================
// TOP NAVBAR — Glassmorphism, Command Palette (Ctrl+K), đồng hồ realtime
//
// Tách riêng khỏi app/page.tsx vì phần này BẮT BUỘC chạy client (đồng hồ,
// bàn phím, router). Nhờ vậy phần còn lại của trang chủ vẫn là Server
// Component và tiếp tục được prerender tĩnh.
//
// Props chỉ nhận dữ liệu thuần chuỗi — KHÔNG nhận component icon, vì tham
// chiếu component không serialize được qua ranh giới Server -> Client.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Bell, ChevronDown, CornerDownLeft } from 'lucide-react';

import { LOGO_SRC, LOGO_ALT } from '@/lib/brand';

export interface NavModule {
  name: string;
  desc: string;
  href: string;
  /** Class Tailwind literal cho chấm màu, vd "bg-blue-700" */
  dot: string;
}

/**
 * Bỏ dấu tiếng Việt để tìm kiếm gõ không dấu vẫn khớp
 * ("kho vat tu" -> tìm được "Kho Vật Tư").
 */
function deaccent(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

// ── Đồng hồ thời gian thực ──────────────────────────────────────────────────
function LiveClock() {
  // Khởi tạo null: server render ra placeholder, client mới điền giờ thật.
  // Nếu gọi new Date() ngay lúc render sẽ lệch giờ giữa server và client
  // => hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';
  const date = now
    ? now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return (
    <div className="hidden text-right lg:block" suppressHydrationWarning>
      <p className="text-lg font-bold tabular-nums leading-tight tracking-tight text-slate-900">{time}</p>
      <p className="text-xs font-medium capitalize text-slate-500">{date || ' '}</p>
    </div>
  );
}

export default function TopNavbar({ modules }: { modules: NavModule[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = deaccent(query.trim());
    if (!q) return modules;
    return modules.filter((m) => deaccent(`${m.name} ${m.desc} ${m.href}`).includes(q));
  }, [modules, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  // Phím tắt mở/đóng bảng lệnh
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Khoá cuộn nền + focus ô nhập khi mở
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Giữ con trỏ chọn luôn nằm trong phạm vi kết quả sau khi lọc
  useEffect(() => {
    setActive((i) => (i >= results.length ? 0 : i));
  }, [results.length]);

  function onPaletteKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active].href);
    }
  }

  return (
    <>
      {/* ── Thanh điều hướng kính mờ ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-24 max-w-[1600px] items-center gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="relative h-16 w-48 shrink-0 sm:h-[4.5rem] sm:w-64">
            <Image
              src={LOGO_SRC}
              alt={LOGO_ALT}
              fill
              sizes="256px"
              className="object-contain object-left"
              priority
            />
          </div>

          {/* Ô tìm kiếm nhanh */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Mở tìm kiếm nhanh"
            className="group flex h-11 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 text-left shadow-sm transition-all hover:border-indigo-300 hover:bg-white hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 md:max-w-md"
          >
            <Search className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-500" />
            <span className="flex-1 truncate text-base text-slate-400">Tìm phân hệ, nghiệp vụ...</span>
            <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 sm:inline-block">
              Ctrl K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <LiveClock />

            {/* Chuông thông báo */}
            <button
              type="button"
              aria-label="Thông báo (3 chưa đọc)"
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                3
              </span>
            </button>

            {/* Hồ sơ người dùng */}
            <button
              type="button"
              aria-label="Tài khoản"
              className="flex h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-white/80 pl-1.5 pr-2.5 shadow-sm transition-all hover:border-indigo-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                JS
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-bold leading-tight text-slate-900">Joseph</span>
                <span className="block text-xs leading-tight text-slate-500">Quản trị viên</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Bảng lệnh Ctrl+K ───────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={close}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tìm kiếm nhanh phân hệ"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onPaletteKey}
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-5">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Gõ tên phân hệ (không dấu cũng được)..."
                aria-label="Từ khoá tìm kiếm"
                className="h-16 flex-1 bg-transparent text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">
                ESC
              </kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-4 py-10 text-center text-base text-slate-400">
                  Không tìm thấy phân hệ khớp với “{query}”.
                </p>
              ) : (
                results.map((m, i) => (
                  <button
                    key={m.href}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(m.href)}
                    className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-left transition-colors ${
                      i === active ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${m.dot}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold text-slate-900">{m.name}</span>
                      <span className="block truncate text-sm text-slate-500">{m.desc}</span>
                    </span>
                    {i === active && <CornerDownLeft className="h-4 w-4 shrink-0 text-indigo-400" />}
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50/70 px-5 py-2.5 text-xs font-medium text-slate-500">
              <span>↑↓ di chuyển</span>
              <span>↵ mở phân hệ</span>
              <span>esc đóng</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
