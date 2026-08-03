'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, BarChart3, Sparkles, BookOpen, Globe } from 'lucide-react';

import { ROLE_HOME, type Role } from '@/lib/rbac';
import { NAV_ICON } from '@/lib/design/tokens';
import { useNavVisibility } from '@/lib/use-nav-visibility';
import { moduleOfPath } from '@/lib/mos/mos-context';
import ChatSheet from '@/components/chat-sheet';
import ReportSheet, { type ReportMetric } from '@/components/report-sheet';
import AiSheet from '@/components/ai-sheet';
import ContextualGuideSheet from '@/components/mos/contextual-guide-sheet';

// ============================================================================
// THANH ĐIỀU HƯỚNG CỐ ĐỊNH — 5 nút, luôn hiện dù đang ở bộ phận nào
//
//   1. Bàn làm việc  -> điều hướng về dashboard của chính bộ phận (ROLE_HOME)
//   2. Chat          -> mở sheet trao đổi liên bộ phận, có tag @
//   3. Báo cáo       -> mở bảng số liệu, xuất được thành ảnh gửi Zalo
//   4. A.I           -> mở khung trợ lý
//   5. Hướng dẫn     -> mở sách hướng dẫn của ĐÚNG phân hệ đang mở
//
// ⚠️ Bốn nút đầu GIỮ NGUYÊN 100% chức năng cũ. Nút thứ năm là thêm mới, không
// thay thế và không rút gọn nút nào.
//
// ─── VÌ SAO 5 NÚT VẪN VỪA MÀN 360px ──────────────────────────────────────
// Ô nút hẹp lại từ 90px còn 72px. Ngưỡng vùng chạm khuyến nghị là 44px nên vẫn
// dư. Chữ mới dài nhất là "Bàn làm việc" (12 ký tự) — ở cỡ 10px chiếm khoảng
// 62px, vẫn lọt trong 72px trừ đi 4px đệm mỗi bên. Không nhãn nào phải cắt.
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
  const [openSheet, setOpenSheet] = useState<'chat' | 'report' | 'ai' | 'guide' | null>(null);

  // Kênh hội thoại theo phân hệ đang đứng: mở chat ở /kho là nói trong kênh kho,
  // không lẫn với kênh Merchandiser. Suy từ đường dẫn vì thanh này dựng ở layout
  // và layout không biết trang con là trang nào.
  const mod = moduleOfPath(pathname);

  // Trang chủ đổi ô thứ ba sang nút Monica (xem chú thích ở dưới).
  const onHome = pathname === '/';

  // Chưa đăng nhập thì Bàn làm việc chưa biết dẫn đi đâu -> đưa về /login
  const workbenchHref = role ? ROLE_HOME[role] : '/login';
  const onWorkbench = role ? pathname === ROLE_HOME[role] : false;

  // ─── LỖI "BÀN LÀM VIỆC LÚC NÀO CŨNG XANH" — NGUYÊN NHÂN THẬT ─────────────
  // Phép so đường dẫn ở trên VỐN ĐÃ khớp trọn vẹn, không phải khớp tiền tố, nên
  // nó không hề sai. Cái sai là ba nút kia mở PANEL TRƯỢT chứ không đổi URL:
  // bấm Chat khi đang đứng ở /md thì đường dẫn vẫn là /md, nên "Bàn làm việc"
  // giữ nguyên màu xanh và Chat cũng xanh — HAI nút cùng sáng, người dùng không
  // còn biết mình đang ở đâu.
  //
  // Trạng thái đang chọn phải phản ánh THỨ ĐANG HIỆN TRƯỚC MẮT, không phải
  // riêng thanh địa chỉ. Panel mở đè lên trang thì chính panel mới là nơi người
  // dùng đang đứng; Bàn làm việc lúc đó trả về xám như mọi nút khác.
  const workbenchActive = onWorkbench && openSheet === null;
  const hidden = HIDE_ON.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Ẩn khi bàn phím ảo bật lên hoặc khi cuộn xuống; hiện lại khi cuộn lên.
  // Hook cũng ghi biến CSS --nav-h để các lớp trượt lấy lại đúng phần chỗ mà
  // thanh vừa nhường ra (xem components/sheet.tsx).
  //
  // ⚠️ Panel đang mở thì KHÔNG ẩn: người dùng cần thanh này để đóng panel và
  // nhảy sang chỗ khác. Ẩn lúc đó là bẫy họ trong panel.
  const navVisible = useNavVisibility({ rendered: !hidden, autoHide: openSheet === null });

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
    (key: 'chat' | 'report' | 'ai' | 'guide') => setOpenSheet((cur) => (cur === key ? null : key)),
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
    'flex h-full w-full touch-manipulation select-none flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-bold leading-none tracking-tight transition active:scale-95';
  // Thu từ 28px xuống 24px: thanh gọn hơn một phần tám chiều cao mà vẫn
  // vượt xa ngưỡng nhận diện; vùng chạm vẫn là cả ô nút chứ không phải
  // riêng cái icon, nên độ chính xác khi bấm không đổi.
  const icon = 'h-6 w-6 shrink-0';

  // Lối thoát sớm đặt SAU toàn bộ hook: để trước thì lượt render ở /login gọi
  // ít hook hơn lượt render ở /md, React so lệch thứ tự hook và văng lỗi.
  if (hidden) return null;

  return (
    <>
      <nav
        aria-label="Điều hướng chính"
        // translate-y-full thay vì display:none — trượt xuống mượt và không
        // làm trang nhảy layout. will-change báo trước cho trình duyệt để nó
        // dựng sẵn lớp tăng tốc phần cứng, chuyển động không bị khựng.
        className={`fixed bottom-0 left-0 z-[100] w-full border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(15,23,42,0.06)] backdrop-blur-lg transition-transform duration-200 will-change-transform ${
          navVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <ul className="mx-auto flex h-14 max-w-2xl items-stretch">
          <li className="flex-1">
            <Link
              href={workbenchHref}
              onClick={goWorkbench}
              aria-current={workbenchActive ? 'page' : undefined}
              className={`${btn} ${workbenchActive ? NAV_ICON.workbench : 'text-slate-600'}`}
            >
              <span className="relative">
                <LayoutDashboard className={`${icon} ${NAV_ICON.workbench}`} aria-hidden="true" />
                {workbenchActive && (
                  <span
                    className="absolute -top-2 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-blue-600"
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
              className={`${btn} ${openSheet === 'chat' ? NAV_ICON.chat : 'text-slate-600'}`}
            >
              <MessageSquare className={`${icon} ${NAV_ICON.chat}`} aria-hidden="true" />
              Chat
            </button>
          </li>

          {/* ─── Ô THỨ BA: TRANG CHỦ THÌ LÀ MONICA, NƠI KHÁC LÀ BÁO CÁO ─────
              Chỉ thị 03/08/2026: *"trang chủ sẽ thay nút báo cáo bằng nút
              monica, nhấp vào sẽ trỏ đến website monica là puratex.vn"*.

              Đổi CHỈ ở trang chủ. Mọi màn hình bên trong vẫn giữ nút Báo cáo
              nguyên vẹn — ở đó người dùng đang làm việc và cần nó.

              ⚠️ Trang chủ là trang CÔNG KHAI, người xem có thể chưa đăng nhập,
              nên bảng Báo cáo ở đó vốn không có gì để hiện. Thay bằng đường dẫn
              ra website công ty là đổi một ô trống lấy một lối đi thật.

              ⚠️ `rel="noopener noreferrer"`: mở tab ngoài mà thiếu `noopener`
              thì trang đích giữ được tham chiếu `window.opener` và có thể tự ý
              điều hướng tab gốc sang chỗ khác. */}
          <li className="flex-1">
            {onHome ? (
              <a
                href="https://puratex.vn"
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn} text-slate-600`}
              >
                <Globe className={`${icon} ${NAV_ICON.monica}`} aria-hidden="true" />
                Monica
              </a>
            ) : (
              <button
                type="button"
                onClick={() => toggleSheet('report')}
                className={`${btn} ${openSheet === 'report' ? NAV_ICON.report : 'text-slate-600'}`}
              >
                <BarChart3 className={`${icon} ${NAV_ICON.report}`} aria-hidden="true" />
                Báo cáo
              </button>
            )}
          </li>

          <li className="flex-1">
            <button
              type="button"
              onClick={() => toggleSheet('ai')}
              className={`${btn} ${openSheet === 'ai' ? NAV_ICON.ai : 'text-slate-600'}`}
            >
              <Sparkles className={`${icon} ${NAV_ICON.ai}`} aria-hidden="true" />
              A.I
            </button>
          </li>

          <li className="flex-1">
            <button
              type="button"
              onClick={() => toggleSheet('guide')}
              className={`${btn} ${openSheet === 'guide' ? NAV_ICON.guide : 'text-slate-600'}`}
            >
              <BookOpen className={`${icon} ${NAV_ICON.guide}`} aria-hidden="true" />
              Hướng dẫn
            </button>
          </li>
        </ul>
      </nav>

      <ChatSheet
        open={openSheet === 'chat'}
        onClose={() => setOpenSheet(null)}
        role={role}
        channel={{ module: mod.key, contextType: 'module', contextId: null }}
        channelLabel={mod.label}
      />
      <ReportSheet
        open={openSheet === 'report'}
        onClose={() => setOpenSheet(null)}
        role={role}
        metrics={reportMetrics}
      />
      <AiSheet open={openSheet === 'ai'} onClose={() => setOpenSheet(null)} role={role} />
      <ContextualGuideSheet open={openSheet === 'guide'} onClose={() => setOpenSheet(null)} />
    </>
  );
}
