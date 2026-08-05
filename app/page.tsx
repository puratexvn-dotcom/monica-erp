import TopNavbar from './top-navbar';
import HomeContent from './_home/home-content';
import { NOISE_URL, CANVAS } from '@/lib/design/tokens';
import { LOGO_COLORS } from '@/lib/brand';
import BrandFooter from '@/components/brand-footer';
import { getSessionUser } from '@/lib/auth/session';

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

export default async function HomePage() {
  // 🔴 `UI-1.5` — trang chủ nay ĐỌC PHIÊN.
  //
  // Trước bản này `app/page.tsx` là component TĨNH, ⛔ không một lời gọi xác
  // thực nào, và `middleware.ts` ⛔ không bảo vệ `/`. Hệ quả đo được: **bản đồ
  // 16 phân hệ của doanh nghiệp hiện công khai cho mọi khách trên internet**
  // *(`UI-F1`)*. ⛔ Không rò dữ liệu — mọi liên kết đều bị chặn — nhưng nó lộ
  // cấu trúc vận hành, và trái §13.5 mà ADR-017 nâng thành điều kiện thi hành.
  //
  // ⚠️ Truyền **`role`**, ⛔ không truyền danh sách App đã lọc. Lý do kỹ thuật:
  // `ModuleItem.icon` là một **component**, ⛔ không tuần tự hoá được qua ranh
  // giới Server → Client. Lọc vì vậy chạy ở client, bằng **cùng một hàm thuần**.
  //
  // 🔑 Điều đó ⛔ **không** làm yếu gì: đây là quyết định **BÀY CÁI GÌ**, ⛔
  // không phải **CHO VÀO HAY KHÔNG**. Hàng rào vẫn là middleware · guard · RLS.
  const phien = await getSessionUser();
  const ten = phien?.email?.split('@')[0] ?? null;
  return (
    // Nền KHÔNG trắng tinh. Trắng trên trắng buộc phải kẻ viền đậm, mà viền
    // đậm thì màn hình lập tức ồn. Xám rất nhạt để thẻ trắng nổi lên bằng
    // chính độ sáng của nó.
    <div className={`relative min-h-screen ${CANVAS}`}>
      {/* Hạt giấy dưới 1% — phá mảng màu phẳng tuyệt đối, thứ khiến một trang
          đọc ra là "trang web" thay vì một mặt vật liệu. Sinh ngay trong trình
          duyệt bằng feTurbulence: không tải ảnh, không thêm byte mạng nào. */}
      {/* ═══ TRẦN ÁNH SÁNG — linh hồn của bản dựng này ═══════════════════
          Chẩn đoán của Board là "đúng nhưng PHẲNG VỀ CẢM XÚC". Phẳng không
          phải vì thiếu thành phần — thêm thành phần chỉ làm trang ồn hơn.
          Phẳng vì trang KHÔNG CÓ ÁNH SÁNG: một mặt xám đều tăm tắp, không
          nguồn sáng, không hướng, nên không có gì để mắt tin là có chiều sâu.

          Ba lớp, tất cả đều rất mờ, đặt phía trên đầu trang:
            ① một vũng sáng trắng ngay trên wordmark — nguồn sáng
            ② một quầng hồng ấm lệch trái
            ③ một quầng lam mát lệch phải
          Hai quầng màu lấy từ CHÍNH bảng màu logo, nên nó là tiếng vọng rất
          nhỏ của wordmark chứ không phải một dải chuyển sắc thứ hai cạnh
          tranh với nó.

          ⚠️ Độ mờ 0,10–0,14. Nhìn thẳng gần như không thấy. Nhưng nó cho
          trang một HƯỚNG SÁNG — và một khi có hướng sáng thì bóng đổ của các
          thẻ bên dưới thôi là hiệu ứng, bắt đầu là hệ quả. Đó là toàn bộ khác
          biệt giữa "sạch" và "đắt".

          ⚠️ Cắt ở `h-[560px]`: ánh sáng chỉ thuộc về phần nghi thức. Để nó
          tràn xuống lưới App sẽ làm 16 thẻ nằm trên nền không đều màu. */}
      {/* ═══ NỀN — SÁU QUẦNG MÀU THƯƠNG HIỆU ════════════════════════════
          ⚠️ BẢN TRƯỚC HỎNG. Ba quầng ở độ mờ 0,10–0,14 — nhìn ảnh chụp thật
          thì chúng KHÔNG hiện ra chút nào. Tôi từng nói nếu nhìn không thấy
          thì phải nâng lên; đây là lúc làm đúng điều đó.

          Nay sáu quầng, độ mờ 0,20–0,30, và trải khắp CẢ TRANG chứ không chỉ
          đầu trang. Màu lấy nguyên từ bảng logo nên nền là tiếng vọng của
          thương hiệu, không phải một lớp trang trí ngoại lai.

          Bố trí lệch nhau có chủ ý — không quầng nào đối xứng với quầng nào.
          Đặt đối xứng thì mắt đọc ra ngay là hình trang trí; đặt lệch thì nó
          đọc ra là ÁNH SÁNG. Đây là toàn bộ khác biệt giữa "có hoạ tiết nền"
          và "có không khí".

          ⚠️ `blur-3xl` trên khối lớn: mọi quầng đều phải nhoè tới mức không
          còn thấy đường viền tròn. Thấy được mép tròn là hỏng — lúc đó nó
          thành sáu cái đốm, không phải ánh sáng. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        {/* Nguồn sáng chính ngay trên wordmark */}
        <div
          className="absolute left-1/2 top-[-300px] h-[680px] w-[1200px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'rgba(255,255,255,0.98)' }}
        />
        {/* Hồng — trên trái */}
        <div
          className="absolute left-[-140px] top-[-120px] h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: LOGO_COLORS[0], opacity: 0.26 }}
        />
        {/* Xanh lơ — trên phải */}
        <div
          className="absolute right-[-160px] top-[-60px] h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: LOGO_COLORS[3], opacity: 0.3 }}
        />
        {/* Vàng — giữa trái, thấp hơn hẳn để phá thế đối xứng */}
        <div
          className="absolute left-[6%] top-[46%] h-[460px] w-[460px] rounded-full blur-3xl"
          style={{ background: LOGO_COLORS[1], opacity: 0.2 }}
        />
        {/* Xanh dương — giữa phải */}
        <div
          className="absolute right-[2%] top-[38%] h-[500px] w-[500px] rounded-full blur-3xl"
          style={{ background: LOGO_COLORS[4], opacity: 0.2 }}
        />
        {/* Xanh chanh — đáy trái, khép lại nhịp màu ở cuối trang */}
        <div
          className="absolute bottom-[-160px] left-[24%] h-[480px] w-[480px] rounded-full blur-3xl"
          style={{ background: LOGO_COLORS[2], opacity: 0.22 }}
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022] mix-blend-multiply"
        style={{ backgroundImage: NOISE_URL }}
      />

      <div className="relative z-10">
        <TopNavbar />

        {/* ⚠️ Khoảng thở trên nới từ 12/16 lên 14/20. Trang chủ là màn hình đầu
            tiên người dùng thấy mỗi sáng — nó phải mở ra bằng khoảng trống, chứ
            không đập ngay vào mặt. Phần mềm rẻ tiền lấp đầy mọi pixel; phần mềm
            đắt tiền để trống có chủ ý. */}
        <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          <HomeContent role={phien?.role ?? null} ten={ten} />

        </main>

        <BrandFooter className="pb-12" />
      </div>
    </div>
  );
}
