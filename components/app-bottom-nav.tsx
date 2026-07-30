'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [openSheet, setOpenSheet] = useState<'chat' | 'report' | 'ai' | null>(null);

  // Chưa đăng nhập thì Bàn làm việc chưa biết dẫn đi đâu -> đưa về /login
  const workbenchHref = role ? ROLE_HOME[role] : '/login';
  const onWorkbench = role ? pathname === ROLE_HOME[role] : false;
  const hidden = HIDE_ON.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // TỶ LỆ ICON/CHỮ ĐẢO NGƯỢC so với bản trước: icon to (28px) làm phần nhận
  // diện chính, chữ thu về 10px chỉ còn vai trò chú thích.
  //
  // Lý do: trên thanh điều hướng, người dùng nhận ra nút bằng HÌNH trước khi
  // kịp đọc chữ. Bản cũ để chữ 20px nên "Bàn làm việc" phải cắt thành "Bàn
  // việc" mới vừa ô 90px trên màn 360px, mà cắt chữ thì lại mất luôn nghĩa.
  // Ở cỡ 10px thì cả bốn nhãn đầy đủ đều vừa, không phải cắt bớt chữ nào.
  // ─── LỖI "BẤM BÀN LÀM VIỆC BỊ ĐƠ" — NGUYÊN NHÂN THẬT ─────────────────────
  // Nút này VỐN ĐÃ là <Link href> của Next.js, điều hướng không hỏng. Cái hỏng
  // là ba nút kia mở panel bằng state `openSheet` mà KHÔNG ai đóng lại: bấm
  // "Bàn làm việc" trong lúc Chat đang mở thì Link chạy đúng, nhưng panel Chat
  // vẫn nằm nguyên đè lên trang. Nếu người dùng đã đứng sẵn ở /md thì Link còn
  // là lệnh rỗng (cùng route) — nhìn y hệt màn hình bị treo.
  //
  // Sửa: MỌI nút trên thanh này đều đóng panel đang mở trước. Đứng sẵn ở bàn
  // làm việc thì chỉ đóng panel; đang ở trang khác thì đóng panel rồi mới đẩy
  // route đi. Đóng và điều hướng cùng lúc trong một khung hình khiến React
  // tháo panel giữa chừng chuyển trang, gây nháy trắng trên máy yếu.
  const goWorkbench = useCallback(
    (e: React.MouseEvent) => {
      const hadSheet = openSheet !== null;
      setOpenSheet(null);
      if (onWorkbench) {
        // Cùng route: chặn hẳn Link để trình duyệt không phải dựng lại trang
        e.preventDefault();
        return;
      }
      if (hadSheet) {
        e.preventDefault();
        router.push(workbenchHref);
      }
      // Không có panel nào mở thì để Link tự chạy như bình thường
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openSheet, onWorkbench, workbenchHref, router],
  );

  /** Bấm lại đúng nút đang mở thì đóng panel — hành vi bật/tắt mà người dùng
   *  điện thoại luôn mong đợi ở thanh điều hướng dưới đáy. */
  const toggleSheet = useCallback(
    (key: 'chat' | 'report' | 'ai') => setOpenSheet((cur) => (cur === key ? null : key)),
    [],
  );

  // z-[100] cao hơn lớp phủ của Sheet (z-[60]) và của PO 360 (z-[70]) — thanh
  // này phải NẰM TRÊN mọi lớp trượt. Trước đây nav ở z-50 nên vừa mở Chat là
  // lớp phủ đè lên, người dùng tưởng thanh điều hướng biến mất.
  // Đối ứng: các Sheet dừng lại phía trên dải nav (xem components/sheet.tsx)
  // để nav không che mất nội dung panel.
  // touch-manipulation: tắt thao tác nhấn-đúp-để-phóng-to, nhờ đó trình duyệt
  // di động không phải chờ 300ms xem người dùng có chạm lần hai hay không.
  // select-none: chạm giữ trên nút không bôi đen chữ.
  const btn =
    'flex h-full w-full touch-manipulation select-none flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold leading-none tracking-tight transition active:scale-95';
  const icon = 'h-7 w-7 shrink-0';

  // Lối thoát sớm đặt SAU toàn bộ hook: để trước thì lượt render ở /login gọi
  // ít hook hơn lượt render ở /md, React so lệch thứ tự hook và văng lỗi.
  if (hidden) return null;

  return (
    <>
      <nav
        aria-label="Điều hướng chính"
        className="fixed bottom-0 left-0 z-[100] w-full border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(15,23,42,0.06)] backdrop-blur-lg"
      >
        <ul className="mx-auto flex h-16 max-w-2xl items-stretch">
          <li className="flex-1">
            <Link
              href={workbenchHref}
              onClick={goWorkbench}
              aria-current={onWorkbench ? 'page' : undefined}
              className={`${btn} ${onWorkbench ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <span className="relative">
                <LayoutDashboard className={icon} aria-hidden="true" />
                {onWorkbench && (
                  <span
                    className="absolute -top-2.5 left-1/2 h-1 w-7 -translate-x-1/2 rounded-full bg-blue-600"
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
              onClick={() => toggleSheet('chat')}
              className={`${btn} ${openSheet === 'chat' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <MessageSquare className={icon} aria-hidden="true" />
              Chat
            </button>
          </li>

          <li className="flex-1">
            <button
              type="button"
              onClick={() => toggleSheet('report')}
              className={`${btn} ${openSheet === 'report' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <BarChart3 className={icon} aria-hidden="true" />
              Báo cáo
            </button>
          </li>

          <li className="flex-1">
            <button
              type="button"
              onClick={() => toggleSheet('ai')}
              className={`${btn} ${openSheet === 'ai' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
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
