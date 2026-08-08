'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

import NotificationBell from '@/components/notification-bell';

import { LOGO_SRC, LOGO_ALT, APP_NAME } from '@/lib/brand';
import { identityForPath } from '@/lib/design/tokens';

// ============================================================================
// THANH ĐẦU TRANG CHO KHU VỰC DASHBOARD
//
// ─── VÌ SAO PHẢI CÓ ─────────────────────────────────────────────────────
// Trước đây các trang phân hệ KHÔNG có header nào: TopNavbar chỉ tồn tại ở
// app/page.tsx. Cộng với thanh điều hướng dưới đáy mà nút "Bàn làm việc" lại
// dẫn về dashboard bộ phận, kết quả là KHÔNG CÒN ĐƯỜNG NÀO quay về trang chủ
// sau khi đăng nhập. Người dùng vì thế không bao giờ thấy Lời Chúa ở trang chủ.
//
// Nay đường về trang chủ là CHÍNH CÁI LOGO bên trái. Nút "Trang chủ" riêng đã
// gỡ vì trùng chức năng với logo.
//
// ─── VÌ SAO TIÊU ĐỀ TRANG NẰM Ở ĐÂY, KHÔNG NẰM TRONG THÂN TRANG ─────────
// Để trong thân trang thì khối tiêu đề chiếm gần 90px, đẩy phần nghiệp vụ
// xuống dưới nếp gấp màn hình. Gộp lên ngang hàng với logo vừa lấy lại chiều
// cao đó, vừa cho tiêu đề DÍNH THEO khi cuộn (thanh này sticky) nên người dùng
// luôn biết mình đang đứng ở phân hệ nào.
//
// ─── VÌ SAO TRA THEO ĐƯỜNG DẪN, KHÔNG NHẬN PROP ────────────────────────
// Thanh này dựng ở layout, mà layout KHÔNG biết trang con là trang nào. Muốn
// truyền prop thì mỗi trang phải tự dựng lại header — thành mười hai bản sao
// lệch nhau. Tra theo đường dẫn giữ đúng một nguồn sự thật.
// ============================================================================

interface PageIdentity {
  title: string;
  /** Câu nhắc nghiệp vụ, chỉ hiện trên màn rộng */
  slogan?: string;
}

const PAGE_IDENTITY: Record<string, PageIdentity> = {
  // ⚠️ PHẢI đứng TRƯỚC '/md'. `identityOf` duyệt theo thứ tự khai báo và trả về
  // mục khớp ĐẦU TIÊN — đặt sau thì '/md/assignments' khớp '/md' và không bao
  // giờ tới được dòng này.
  '/md/assignments': {
    title: 'Phần việc giao đối tác',
    slogan: 'GIAO RÕ · THEO SÁT · NGHIỆM THU ĐÚNG',
  },
  '/md': {
    title: 'Merchandiser Command Center',
    slogan: 'ĐÚNG · ĐỦ · ĐỀU • TẬN TÂM & TRÁCH NHIỆM',
  },
  '/orders': { title: 'Đơn hàng' },
  '/kho': {
    title: 'Warehouse Command Center',
    slogan: 'ĐÚNG HÀNG · ĐÚNG LÔ · ĐÚNG CHỖ • KHÔNG ĐỂ ĐỨT CHUYỀN',
  },
  '/qa': { title: 'Kiểm soát chất lượng' },
  '/admin': { title: 'Quản trị hệ thống' },
  '/buyer': { title: 'Thu mua' },
  '/ke-toan': { title: 'Kế toán' },
  '/giam-doc': { title: 'Ban giám đốc' },
  '/subcon': { title: 'Gia công ngoài' },
  '/xuat-hang': { title: 'Xuất hàng' },
  '/hoan-thanh': { title: 'Hoàn thành' },
  '/to-truong-cat': { title: 'Tổ trưởng cắt' },
  '/to-truong-may': { title: 'Tổ trưởng may' },
  '/to-truong-hoan-thanh': { title: 'Tổ trưởng hoàn thành' },
};

/** Khớp trọn đoạn đường dẫn: '/kho' không được khớp nhầm '/kho-thanh-pham' */
function identityOf(pathname: string): PageIdentity | null {
  for (const [prefix, id] of Object.entries(PAGE_IDENTITY)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return id;
  }
  return null;
}

/** Đường dẫn nào có bảng lệnh tìm nhanh. Hiện chỉ /md dựng nó; hiện nút ở
 *  trang chưa có mà bấm vào không xảy ra gì thì tệ hơn là không có nút. */
const HAS_PALETTE = ['/md'];

export default function DashboardTopbar() {
  const pathname = usePathname();
  const id = identityOf(pathname);
  // Danh tính MÀU của App chứa màn hình này (Điều 44.3). `null` khi đường dẫn
  // chưa được gán App — khi đó thanh giữ nguyên vẻ trung tính.
  const identity = identityForPath(pathname);
  const canSearch = HAS_PALETTE.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // ─── VÌ SAO DÙNG SỰ KIỆN TOÀN CỤC THAY VÌ TRUYỀN PROP ────────────────────
  // Thanh này dựng ở layout, còn trạng thái bảng lệnh nằm trong md-client —
  // hai cây component khác nhau, không có đường truyền prop giữa chúng. Dựng
  // một context provider bọc cả ứng dụng chỉ để bật một hộp thoại là quá tay.
  // Một sự kiện trên window là đủ, và md-client vốn đã nghe Ctrl+K sẵn.
  const openPalette = () => window.dispatchEvent(new CustomEvent('monica:open-palette'));

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          aria-label={`Về trang chủ ${APP_NAME}`}
          className="relative h-9 w-24 shrink-0 rounded-lg transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:h-10 sm:w-28"
        >
          <Image src={LOGO_SRC} alt={LOGO_ALT} fill sizes="128px" className="object-contain object-left" />
        </Link>

        {id && (
          // ─── DANH TÍNH MÀU CHẢY TIẾP VÀO BÊN TRONG — Điều 44.3 ──────────
          //
          // Đây là điểm đòn bẩy lớn nhất của cả hệ thẻ màu: thanh này dựng ở
          // layout của MỌI màn hình nội bộ. Một chỗ sửa, và cả 12 phân hệ lập
          // tức mang đúng sắc của mình ở đầu trang — Production xanh dương,
          // Quality xanh ngọc, Warehouse xanh lá, Finance hổ phách.
          //
          // Không có nó thì màu chỉ sống ở trang chủ rồi tắt ngóm ngay khi
          // người dùng bước vào trong, và danh tính thành ra một lớp sơn ở
          // cửa chứ không phải bản sắc của phân hệ.
          //
          // `identity` có thể `null` với đường dẫn chưa gán App — khi đó vạch
          // màu không dựng và thanh trở về trung tính, KHÔNG đoán bừa một màu.
          <div
            className={`min-w-0 flex-1 border-l pl-3 sm:pl-4 ${
              identity ? 'border-transparent' : 'border-slate-200'
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {identity && (
                // Vạch dọc thay cho đường kẻ xám: cùng vị trí, cùng vai trò
                // ngăn cách, nhưng mang thông tin thay vì chỉ chia đôi.
                <span
                  aria-hidden="true"
                  className={`h-7 w-[3px] shrink-0 rounded-full ${identity.bar}`}
                />
              )}
              <h1 className="truncate text-sm font-bold tracking-tight text-slate-800 sm:text-base">
                {id.title}
              </h1>
            </div>
            {id.slogan && (
              // Ẩn ở màn hẹp: nhét cả câu khẩu hiệu vào bề ngang 360px sẽ bóp
              // tiêu đề còn vài chữ, mà tiêu đề mới là thứ cần đọc trước.
              // Khẩu hiệu nay mang sắc của chính phân hệ, không còn xanh dương
              // cứng cho mọi nơi.
              //
              // 🔴 **`md:` ⇒ `lg:` — 08/08/2026, lỗi ĐO ĐƯỢC bằng ảnh chụp
              // khổ 768.** Ở đúng mốc `md` câu hiện ra nhưng **bị cắt cụt**:
              //     `ĐÚNG · ĐỦ · ĐỀU • TẬN TÂM & TRÁ…`
              //
              // 🔑 Một khẩu hiệu cắt giữa chữ ⛔ không phải *"rút gọn"* — nó
              // đọc ra là **lỗi dựng trang**, và nó nói sai chính câu nó mang.
              // `truncate` giữ lại làm lưới cuối cho tiêu đề phân hệ dài bất
              // thường; nhưng khoảng hiện phải là khoảng **đủ chỗ**, ⛔ không
              // phải khoảng *"vừa đủ để bắt đầu cắt"*.
              <p
                className={`ml-0 hidden truncate text-[11px] font-semibold uppercase tracking-[0.12em] lg:block ${
                  identity ? identity.primary : 'text-slate-500'
                } ${identity ? 'lg:ml-[1.375rem]' : ''}`}
              >
                {id.slogan}
              </p>
            )}
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {canSearch && (
            <button
              type="button"
              onClick={openPalette}
              aria-label="Tìm nhanh (Ctrl + K)"
              // Màn hẹp chỉ còn cái kính lúp; từ md trở lên mới nở ra thành ô
              // tìm kiếm đầy đủ. Nhét cả ô rộng vào 360px sẽ đè bẹp tiêu đề.
              className="flex h-9 touch-manipulation items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-slate-500 shadow-sm transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 md:w-64 md:px-3"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden min-w-0 flex-1 truncate text-left text-xs text-slate-400 md:block">
                Tìm PO, mã hàng, khách hàng...
              </span>
              <span className="hidden shrink-0 items-center gap-0.5 md:flex">
                <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-sans text-[10px] font-bold text-slate-500">
                  Ctrl
                </kbd>
                <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-sans text-[10px] font-bold text-slate-500">
                  K
                </kbd>
              </span>
            </button>
          )}

          {/* Nút "Trang chủ" đã GỠ: chính cái logo bên trái đã là đường về trang
              chủ, hai lối vào cùng một nơi trên một thanh chỉ tốn chỗ và bắt mắt
              phải cân nhắc thừa. Logo giữ nguyên aria-label để người dùng đọc
              màn hình vẫn nghe rõ đó là đường về trang chủ. */}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
