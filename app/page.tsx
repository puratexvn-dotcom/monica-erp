import TopNavbar from './top-navbar';
import { WORKSPACES, SERVICES, PLATFORM } from './home-modules';
import { getHomeMetrics } from './home-metrics';
import ExecutiveHero from './_home/executive-hero';
import SectionHeading from './_home/section-heading';
import WorkspaceCard from './_home/workspace-card';
import AiHeroCard from './_home/ai-hero-card';
import ServiceCard from './_home/service-card';
import PlatformRow from './_home/platform-row';
import { NOISE_URL } from './_home/surface';
import { APP_NAME } from '@/lib/brand';
import { gioVN, MUI_GIO } from '@/lib/time';

// ============================================================================
// TRANG CHỦ — BUSINESS OPERATING SYSTEM LAUNCHER (Điều 13.3 · ADR-001)
//
// ═══ TRIẾT LÝ ═══════════════════════════════════════════════════════════
// Trang này trả lời đúng MỘT câu hỏi: *"sáng nay tôi vào đâu trước?"*
//
// Năm nguyên tắc, rút từ chỗ Apple · Linear · Stripe · Fiori GIỐNG nhau —
// không phải chỗ chúng khác nhau:
//
//   ① MÀU LÀ THÔNG TIN, KHÔNG PHẢI TRANG TRÍ.
//      Nền trung tính có hạt, thẻ trắng tinh, màu chỉ xuất hiện ở ô icon và
//      chấm trạng thái. Mười sáu khối màu bão hoà cạnh nhau đọc ra "phần mềm
//      quản trị nội bộ"; mười sáu thẻ trắng mỗi thẻ một mỏ neo màu đọc ra
//      "sản phẩm".
//
//   ② KHÔNG PHẢI Ô NÀO CŨNG BẰNG NHAU.
//      Mười sáu ô cùng cỡ buộc mắt phải QUÉT. Ba mức nhấn cho mắt một điểm
//      rơi: nó biết bắt đầu từ đâu trước khi đọc chữ nào.
//
//   ③ THỨ BẬC DỰNG BẰNG CỠ, NHỊP VÀ ĐỘ CAO — KHÔNG BẰNG KHUNG VIỀN.
//      Workspace nổi bốn lớp bóng · Service chìm một lớp · Platform phẳng
//      không bóng. Ba mức nhìn ra ngay, không cần đọc tiêu đề khối.
//
//   ④ CHUYỂN ĐỘNG ĐỂ XÁC NHẬN, KHÔNG ĐỂ MUA VUI.
//      200ms, chỉ `transform` và `box-shadow` — hai thứ chạy trên GPU. Không
//      nảy, không xoay, không mờ dần.
//
//   ⑤ THÀ THIẾU MỘT DÒNG CÒN HƠN MỘT DÒNG BỊA.
//      Mọi con số lấy từ CSDL thật. Không đọc được thì nói thẳng là chưa có
//      số liệu — KHÔNG BAO GIỜ hiện 0. Trong nhà máy, "không có số" và "số
//      bằng 0" là hai sự thật khác hẳn nhau.
//
// ═══ BA KHỐI, BA PHÂN LOẠI HIẾN ĐỊNH ════════════════════════════════════
// §17.3 cấm trộn phân loại, nên ba khối có ba ngôn ngữ thị giác tách bạch —
// không chỉ ba tiêu đề khác nhau trên cùng một kiểu thẻ:
//
//   Business Workspace  §16.2   thẻ nổi · 3 cỡ · icon tới 88px · nhấc 3px
//   Global Service      §17     dòng chìm · icon 44px · không nhấc
//   Platform Service    §34     dòng phẳng · icon 36px · số liệu chữ đều
//
// ⚠️ KHÔNG mất chức năng nào: 16 mục giữ nguyên tên, nguyên route, nguyên
// phân loại. `app/home-metrics.ts` không sửa một dòng.
//
// ⚠️ TAILWIND JIT: class màu phải là chuỗi NGUYÊN VẸN, xem app/home-modules.ts.
// ============================================================================

export const dynamic = 'force-dynamic';

/** Ngày hôm nay bằng tiếng Việt đầy đủ — "Thứ Hai, 03 tháng 8, 2026" */
function ngayChu(): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: MUI_GIO,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export default async function HomePage() {
  // Chưa đăng nhập thì hàm này KHÔNG truy vấn gì và trả 'unauthenticated' —
  // trang chủ là trang công khai, không phơi số liệu cho khách vãng lai.
  const metrics = await getHomeMetrics();

  // AI Assistant tách ra khỏi hàng dịch vụ bằng CỜ trong sổ đăng ký, không
  // bằng cách so tên. So tên là thứ hỏng im lặng vào ngày ai đó sửa một chữ.
  const aiHero = SERVICES.find((s) => s.feature === 'hero');
  const restServices = SERVICES.filter((s) => s.feature !== 'hero');

  return (
    // Nền KHÔNG trắng tinh. Trắng trên trắng buộc phải kẻ viền đậm, mà viền
    // đậm thì màn hình lập tức ồn. Xám rất nhạt để thẻ trắng nổi lên bằng
    // chính độ sáng của nó.
    <div className="relative min-h-screen bg-[#F6F7F9]">
      {/* Hạt giấy dưới 1% — phá mảng màu phẳng tuyệt đối. Sinh ngay trong
          trình duyệt bằng feTurbulence: không tải ảnh, không thêm byte mạng. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022] mix-blend-multiply"
        style={{ backgroundImage: NOISE_URL }}
      />

      <div className="relative z-10">
        <TopNavbar showVerse={false} />

        <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:px-8">
          <ExecutiveHero metrics={metrics} hour={gioVN()} today={ngayChu()} />

          {/* ═══ BUSINESS WORKSPACES · §16.2 ═════════════════════════════
              Lưới 4 cột: hai hàng trên là ba thẻ nổi bật (hero 2×2 + hai wide
              2×1), hai hàng dưới là tám thẻ chuẩn. Khít, không ô trống.
              `auto-rows` đặt chiều cao hàng cố định để `row-span-2` của thẻ
              hero ăn đúng hai hàng — thiếu nó, hàng tự co theo nội dung và
              thẻ hero sẽ thò ra. */}
          <section aria-labelledby="h-workspaces" className="mb-16 sm:mb-24">
            <div id="h-workspaces">
              <SectionHeading
                level="primary"
                eyebrow="Nơi công việc diễn ra"
                title="Business Workspaces"
                note="Mỗi Workspace là một miền vận hành của doanh nghiệp"
                count={WORKSPACES.length}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:auto-rows-[13.75rem] lg:grid-cols-4">
              {WORKSPACES.map((mod) => (
                <WorkspaceCard key={mod.name} mod={mod} metrics={metrics} />
              ))}
            </div>
          </section>

          {/* ═══ GLOBAL SERVICES · §17 ═══════════════════════════════════ */}
          <section aria-labelledby="h-services" className="mb-16 sm:mb-24">
            <div id="h-services">
              <SectionHeading
                level="secondary"
                title="Global Services"
                note="Năng lực dùng chung cho mọi Workspace"
                count={SERVICES.length}
              />
            </div>
            {aiHero && (
              <div className="mb-3">
                <AiHeroCard mod={aiHero} metrics={metrics} />
              </div>
            )}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {restServices.map((mod) => (
                <ServiceCard key={mod.name} mod={mod} metrics={metrics} />
              ))}
            </div>
          </section>

          {/* ═══ PLATFORM SERVICES · §34 ═════════════════════════════════ */}
          <section aria-labelledby="h-platform">
            <div id="h-platform">
              <SectionHeading
                level="tertiary"
                title="Platform Services"
                note="Hạ tầng nền tảng"
                count={PLATFORM.length}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PLATFORM.map((mod) => (
                <PlatformRow key={mod.name} mod={mod} metrics={metrics} />
              ))}
            </div>
          </section>
        </main>

        <footer className="pb-12 text-center">
          {/* slate-600: chân trang vẫn là chữ thật, vẫn phải đọc được. Xem
              ghi chú độ tương phản ở app/_home/executive-hero.tsx. */}
          <p className="text-[10.5px] font-medium tracking-wide text-slate-600">
            © 2026 {APP_NAME}
          </p>
        </footer>
      </div>
    </div>
  );
}
