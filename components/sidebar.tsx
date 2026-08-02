'use client';

// ============================================================================
// MONICA MOS — Sidebar điều hướng phân quyền 10 vai trò
// Desktop: cố định bên trái, thu gọn được. Mobile: drawer trượt.
// ============================================================================

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ElementType } from 'react';
import {
  Factory, LayoutDashboard, ClipboardList, ShieldCheck, Shirt, Scissors,
  Warehouse, Calculator, Handshake, Globe, Settings, LogOut,
  ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { canAccess, clearSession, ROLE_LABEL, type Session } from '@/lib/auth';

export interface NavItem {
  path: string;
  label: string;
  icon: ElementType;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/giam-doc',      label: 'Giám đốc (BOD)',   icon: LayoutDashboard },
  { path: '/md',            label: 'Merchandiser',      icon: ClipboardList },
  { path: '/to-truong-cat', label: 'Tổ trưởng Cắt',     icon: Scissors },
  { path: '/to-truong-may', label: 'Tổ trưởng May',     icon: Shirt },
  { path: '/qa',            label: 'QA / QC',           icon: ShieldCheck },
  { path: '/kho',           label: 'Kho NPL & TP',      icon: Warehouse },
  { path: '/ke-toan',       label: 'Kế toán',           icon: Calculator },
  { path: '/subcon',        label: 'Cổng Subcon',       icon: Handshake },
  { path: '/buyer',         label: 'Cổng Buyer',        icon: Globe },
  { path: '/admin',         label: 'Super Admin',       icon: Settings },
];

export default function Sidebar({ session, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: {
  session: Session;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = session;
  const items = NAV_ITEMS.filter((it) => canAccess(user.role, it.path));

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const body = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex items-center gap-3 border-b border-slate-100 px-4 py-4 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
          <Factory className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-slate-900">
              MONICA <span className="font-medium text-blue-600">ONE</span>
            </p>
            <p className="truncate text-[11px] text-slate-400">Hệ thống quản trị sản xuất</p>
          </div>
        )}
        <button onClick={onCloseMobile} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User */}
      <div className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="relative shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white">
            {user.avatar}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
            title="Đang online" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
            <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
              {ROLE_LABEL[user.role]}
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
        {items.map((it) => {
          const active = pathname.startsWith(it.path);
          return (
            <Link key={it.path} href={it.path} onClick={onCloseMobile}
              title={collapsed ? it.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-2' : ''}`}>
              <it.icon className="h-4.5 w-4.5 h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{it.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-2.5">
        <button onClick={onToggleCollapse}
          className="mb-1 hidden w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 lg:flex"
          style={collapsed ? { justifyContent: 'center' } : undefined}>
          {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
          {!collapsed && 'Thu gọn'}
        </button>
        <button onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 ${collapsed ? 'justify-center px-2' : ''}`}>
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && 'Đăng xuất'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-slate-200 bg-white transition-all lg:block ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        {body}
      </aside>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl">{body}</aside>
        </div>
      )}
    </>
  );
}
