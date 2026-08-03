import TopNavbar from './top-navbar';
import { MODULES } from './home-modules';
import AppCard from './_home/app-card';
import { NOISE_URL, CANVAS } from '@/lib/design/tokens';
import { LOGO_TEXT_GRADIENT, APP_NAME } from '@/lib/brand';

// ============================================================================
// TRANG CHỦ MONICA ONE — LỐI VÀO CÔNG KHAI
//
// ═══ ⚠️ TRANG NÀY LÀ GÌ, VÀ TUYỆT ĐỐI KHÔNG PHẢI GÌ ═════════════════════
// Trang chủ KHÔNG phải Workspace. KHÔNG phải Dashboard. KHÔNG phải Trung tâm
// vận hành. Nó là **lối vào công khai** của MONICA ONE — bất kỳ ai gõ đúng
// địa chỉ đều thấy nó, kể cả khi chưa đăng nhập một giây nào.
//
// Luồng sản phẩm bắt buộc:
//
//   Trang chủ → chọn Business App → Đăng nhập → Workspace
//             → Bảng điều hành → Công việc → Báo cáo → Biểu đồ → Vận hành
//
// Trang chủ đứng ở bước MỘT. Mọi thứ từ "Bảng điều hành" trở đi chỉ được phép
// xuất hiện SAU khi xác thực, và xuất hiện BÊN TRONG Workspace.
//
// ─── VÌ SAO TRANG NÀY KHÔNG GỌI `getHomeMetrics()` ──────────────────────
// Cố ý không gọi. Gọi rồi thì sớm muộn cũng có người bày số ra màn hình, và
// mỗi con số bày ra ở đây là một mẩu thông tin vận hành nằm ở bước SAI trong
// luồng. `app/home-metrics.ts` giữ nguyên không sửa một dòng — nó vẫn phục vụ
// các bảng điều hành bên trong `/giam-doc`, `/md`. Chỉ trang chủ thôi không
// gọi tới.
//
// KHÔNG có ở đây, và không được phép có: lời chào theo buổi · vai trò người
// dùng · việc cần chú ý · thông báo · chờ duyệt · KPI · biểu đồ · số liệu ·
// trạng thái vận hành.
//
// ─── MỘT LƯỚI, KHÔNG CHIA KHỐI ──────────────────────────────────────────
// Không có tiêu đề "Business Workspaces" / "Global Services" / "Platform
// Services" trên màn hình. Ba cái tên đó là **phân loại hiến định** — cách
// Hiến pháp mô tả bản chất từng thứ — chứ KHÔNG phải bố cục của trang chủ.
// Phân loại vẫn được giữ nguyên vẹn trong dữ liệu, ở ba mảng của
// `app/home-modules.ts`. Trang chủ chỉ bày ra các Business App.
//
// ─── BỐN TẦNG, KHÔNG HƠN ────────────────────────────────────────────────
//   Top Header (giữ nguyên, kèm Lời Chúa căn giữa) → Hero → Lưới App → Chân
//
// ⚠️ Top Header và Lời Chúa KHÔNG được đụng tới. Lời Chúa nằm căn giữa trên
// cùng, phía trên mọi thứ — đó là bản sắc tinh thần của MONICA ONE, và nó
// thuộc về thanh đầu trang chứ không phải phần Hero.
//
// ⚠️ TAILWIND JIT: class màu phải là chuỗi NGUYÊN VẸN, xem app/home-modules.ts.
// ============================================================================

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    // Nền KHÔNG trắng tinh. Trắng trên trắng buộc phải kẻ viền đậm, mà viền
    // đậm thì màn hình lập tức ồn. Xám rất nhạt để thẻ trắng nổi lên bằng
    // chính độ sáng của nó.
    <div className={`relative min-h-screen ${CANVAS}`}>
      {/* Hạt giấy dưới 1% — phá mảng màu phẳng tuyệt đối, thứ khiến một trang
          đọc ra là "trang web" thay vì một mặt vật liệu. Sinh ngay trong trình
          duyệt bằng feTurbulence: không tải ảnh, không thêm byte mạng nào. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022] mix-blend-multiply"
        style={{ backgroundImage: NOISE_URL }}
      />

      <div className="relative z-10">
        <TopNavbar />

        <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          {/* ═══ HERO — hai dòng, không hơn ═══════════════════════════════
              Một dòng chào, một dòng nói đây là thứ gì. Hết. Không đoạn văn,
              không tóm tắt vận hành, không lời chào theo giờ, không vai trò.

              tracking âm ở cỡ chữ lớn: khoảng cách chữ mặc định được thiết kế
              cho cỡ chữ thân bài; giữ nguyên khi phóng to thì các chữ cái rời
              rạc. Bóp lại là thứ khiến một tiêu đề lớn đọc ra "được sắp chữ"
              thay vì "được phóng to". */}
          <section className="mb-12 text-center sm:mb-16">
            <h1 className="flex flex-wrap items-baseline justify-center gap-x-2.5 whitespace-nowrap sm:gap-x-4">
              <span className="text-[15px] font-medium tracking-tight text-slate-500 sm:text-xl">
                Welcome to
              </span>
              <span
                className="bg-clip-text text-[38px] font-black leading-[1.02] tracking-[-0.04em] text-transparent sm:text-6xl lg:text-7xl"
                style={{ backgroundImage: LOGO_TEXT_GRADIENT }}
              >
                MONICA ONE
              </span>
            </h1>

            {/* MỘT dòng duy nhất. Nói đúng một điều: đây là loại phần mềm gì. */}
            <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.28em] text-slate-500 sm:mt-6 sm:text-[13px]">
              Business Operating System
            </p>
          </section>

          {/* ═══ LƯỚI BUSINESS APP — ngay dưới Hero ══════════════════════
              Một lưới duy nhất, 16 thẻ đồng cỡ, không tiêu đề nhóm.
              Mobile 2 · Tablet 3 · Desktop 4. Khoảng cách đều ở mọi mốc. */}
          <section aria-label="Business Apps">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {MODULES.map((mod) => (
                <AppCard key={mod.name} mod={mod} />
              ))}
            </div>
          </section>
        </main>

        <footer className="pb-12 text-center">
          <p className="text-[10.5px] font-medium tracking-wide text-slate-600">
            © 2026 {APP_NAME}
          </p>
        </footer>
      </div>
    </div>
  );
}
