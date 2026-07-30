'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, PackageSearch, Scissors, Shirt, ShieldCheck,
  Warehouse, Calculator, Handshake, Globe, Settings, Box, Archive, Home,
  type LucideIcon,
} from 'lucide-react';

import { allowedModules, type Role } from '@/lib/rbac';

// ============================================================================
// THANH ĐIỀU HƯỚNG ĐÁY — dành cho điện thoại ở xưởng
//
// Chỉ hiện dưới breakpoint lg. Sidebar vẫn là cách điều hướng chính trên máy
// tính; ở xưởng công nhân dùng điện thoại một tay nên các đích đến phải nằm
// trong tầm ngón cái, tức là ở đáy màn hình.
//
// ─── BA CHI TIẾT DỄ BỎ SÓT ───────────────────────────────────────────────
// 1. LỌC THEO QUYỀN. Menu lấy từ allowedModules(role) — cùng một nguồn với
//    middleware. Hiện nút dẫn tới nơi sẽ bị chặn là mời người dùng đâm vào
//    trang /unauthorized.
// 2. VÙNG AN TOÀN iOS. pb-[env(safe-area-inset-bottom)] để thanh không bị
//    gạch Home của iPhone che mất nửa dưới.
// 3. KHỚP TRỌN ĐOẠN ĐƯỜNG DẪN. '/kho' không được coi là đang mở khi ở
//    '/kho-thanh-pham' — dùng đúng quy tắc so khớp của lib/rbac.
// ============================================================================

const ICONS: Record<string, LucideIcon> = {
  '/giam-doc': LayoutDashboard,
  '/md': ClipboardList,
  '/orders': PackageSearch,
  '/to-truong-cat': Scissors,
  '/to-truong-may': Shirt,
  '/hoan-thanh': Box,
  '/to-truong-hoan-thanh': Box,
  '/qa': ShieldCheck,
  '/kho': Warehouse,
  '/xuat-hang': Archive,
  '/ke-toan': Calculator,
  '/subcon': Handshake,
  '/buyer': Globe,
  '/admin': Settings,
};

const LABELS: Record<string, string> = {
  '/giam-doc': 'Giám đốc',
  '/md': 'MD',
  '/orders': 'Đơn hàng',
  '/to-truong-cat': 'Cắt',
  '/to-truong-may': 'May',
  '/hoan-thanh': 'Hoàn thành',
  '/to-truong-hoan-thanh': 'Hoàn thành',
  '/qa': 'QA/QC',
  '/kho': 'Kho NPL',
  '/xuat-hang': 'Kho TP',
  '/ke-toan': 'Kế toán',
  '/subcon': 'Subcon',
  '/buyer': 'Buyer',
  '/admin': 'Quản trị',
};

/** Khớp trọn đoạn: '/kho' khớp '/kho' và '/kho/x', KHÔNG khớp '/kho-thanh-pham' */
function isActive(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

export default function BottomNav({ role }: { role: Role | null }) {
  const pathname = usePathname();

  // Tối đa 5 ô: quá 5 thì mỗi ô hẹp dưới 64px, chạm bằng ngón tay rất dễ sai.
  // superadmin có quyền vào mọi nơi nên phải cắt bớt, ưu tiên nhóm hay dùng.
  const modules = allowedModules(role).slice(0, 4);

  if (modules.length === 0) return null;

  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch">
        <li className="flex-1">
          <Link
            href="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
              pathname === '/' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="h-5 w-5" aria-hidden="true" />
            Trang chủ
          </Link>
        </li>

        {modules.map((path) => {
          const Icon = ICONS[path] ?? LayoutDashboard;
          const active = isActive(pathname, path);
          return (
            <li key={path} className="flex-1">
              <Link
                href={path}
                aria-current={active ? 'page' : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition ${
                  active ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {active && (
                    <span
                      className="absolute -top-2 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-indigo-600"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="max-w-full truncate">{LABELS[path] ?? path.replace('/', '')}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
