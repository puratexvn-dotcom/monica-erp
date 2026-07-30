'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, BarChart3, Sparkles } from 'lucide-react';

import { ROLE_HOME, type Role } from '@/lib/rbac';
import ChatSheet from '@/components/chat-sheet';
import ReportSheet, { type ReportMetric } from '@/components/report-sheet';
import AiSheet from '@/components/ai-sheet';

// ============================================================================
// THANH ĐIỀU HƯỚNG CỐ ĐỊNH — 4 nút, luôn hiện dù đang ở bộ phận nào
//
//   1. Bàn làm việc  -> điều hướng về dashboard của chính bộ phận (ROLE_HOME)
//   2. Chat          -> mở sheet trao đổi liên bộ phận, có tag @
//   3. Báo cáo       -> mở bảng số liệu, xuất được thành ảnh gửi Zalo
//   4. A.I           -> mở khung trợ lý
//
// ─── VÌ SAO ẨN Ở CÁC TRANG XÁC THỰC ──────────────────────────────────────
// Đặt ở layout gốc nên thanh này cũng phủ lên /login, /update-password,
// /unauthorized. Ở những trang đó người dùng chưa có phiên hợp lệ, hiện thanh
// điều hướng chỉ gây nhiễu và mời họ bấm vào nơi sẽ bị chặn ngay.
// Layout là Server Component không đọc được pathname, nên việc ẩn phải làm ở
// client — đó là lý do component này có 'use client'.
// ============================================================================

const HIDE_ON = ['/login', '/update-password', '/unauthorized', '/auth'];

export default function AppBottomNav({
  role,
  reportMetrics = [],
}: {
  role: Role | null;
  /** Số liệu báo cáo của bộ phận; rỗng thì panel hiện trạng thái chưa có dữ liệu */
  reportMetrics?: ReportMetric[];
}) {
  const pathname = usePathname();
  const [openSheet, setOpenSheet] = useState<'chat' | 'report' | 'ai' | null>(null);

  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null;

  // Chưa đăng nhập thì Bàn làm việc chưa biết dẫn đi đâu -> đưa về /login
  const workbenchHref = role ? ROLE_HOME[role] : '/login';
  const onWorkbench = role ? pathname === ROLE_HOME[role] : false;

  // TỶ LỆ ICON/CHỮ ĐẢO NGƯỢC so với bản trước: icon to (28px) làm phần nhận
  // diện chính, chữ thu về 10px chỉ còn vai trò chú thích.
  //
  // Lý do: trên thanh điều hướng, người dùng nhận ra nút bằng HÌNH trước khi
  // kịp đọc chữ. Bản cũ để chữ 20px nên "Bàn làm việc" phải cắt thành "Bàn
  // việc" mới vừa ô 90px trên màn 360px, mà cắt chữ thì lại mất luôn nghĩa.
  // Ở cỡ 10px thì cả bốn nhãn đầy đủ đều vừa, không phải cắt bớt chữ nào.
  const btn =
    'flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold leading-none tracking-tight transition';
  const icon = 'h-7 w-7 shrink-0';

  return (
    <>
      <nav
        aria-label="Điều hướng chính"
        className="fixed bottom-0 left-0 z-50 w-full border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(15,23,42,0.06)] backdrop-blur-lg"
      >
        <ul className="mx-auto flex h-16 max-w-2xl items-stretch">
          <li className="flex-1">
            <Link
              href={workbenchHref}
              aria-current={onWorkbench ? 'page' : undefined}
              className={`${btn} ${onWorkbench ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <span className="relative">
                <LayoutDashboard className={icon} aria-hidden="true" />
                {onWorkbench && (
                  <span
                    className="absolute -top-2.5 left-1/2 h-1 w-7 -translate-x-1/2 rounded-full bg-indigo-600"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span>Bàn làm việc</span>
            </Link>
          </li>

          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpenSheet('chat')}
              className={`${btn} ${openSheet === 'chat' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <MessageSquare className={icon} aria-hidden="true" />
              Chat
            </button>
          </li>

          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpenSheet('report')}
              className={`${btn} ${openSheet === 'report' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <BarChart3 className={icon} aria-hidden="true" />
              Báo cáo
            </button>
          </li>

          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpenSheet('ai')}
              className={`${btn} ${openSheet === 'ai' ? 'text-violet-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Sparkles className={icon} aria-hidden="true" />
              A.I
            </button>
          </li>
        </ul>
      </nav>

      <ChatSheet open={openSheet === 'chat'} onClose={() => setOpenSheet(null)} role={role} />
      <ReportSheet
        open={openSheet === 'report'}
        onClose={() => setOpenSheet(null)}
        role={role}
        metrics={reportMetrics}
      />
      <AiSheet open={openSheet === 'ai'} onClose={() => setOpenSheet(null)} role={role} />
    </>
  );
}
