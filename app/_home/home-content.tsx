'use client';

import { MODULES } from '@/lib/mos/registry/business-apps';
import AppCard from './app-card';
import { modulePermissionState } from '@/lib/mos/capability/visible-modules';
import type { Role } from '@/lib/rbac';
import type { LiveStateOrNull } from '@/lib/mos/registry/live-state';
import { useLanguage } from '@/lib/i18n';
import { TYPE } from '@/lib/design/typography';
import { LOGO_LETTER_COLORS, LOGO_LETTER_SHADOW, LOGO_COLORS } from '@/lib/brand';

// ============================================================================
// NỘI DUNG TRANG CHỦ — Hiến pháp Điều 45 · đa ngôn ngữ
//
// ═══ VÌ SAO TÁCH RA THÀNH COMPONENT PHÍA CLIENT ════════════════════════
// Ngôn ngữ do người dùng chọn và lưu ở `localStorage`, nên nó chỉ tồn tại phía
// trình duyệt. `app/page.tsx` vẫn là Server Component — nó giữ khung, nền,
// thanh đầu trang và chân trang; chỉ phần CHỮ chuyển xuống đây.
//
// Đổi ngôn ngữ vì vậy vẽ lại ngay lập tức: không tải lại trang, không còn chữ
// cũ sót lại, không màn hình lẫn hai thứ tiếng — đúng ba yêu cầu của Board.
//
// ⚠️ `MONICA ONE` và 16 tên Business App **KHÔNG dịch** (§45.3). Chỉ những
// dòng chữ xung quanh chúng mới đi qua `t()`.
// ============================================================================

export default function HomeContent({
  role,
  mucSong = {},
}: {
  /** Vai của người đang đăng nhập. `null` = **chưa đăng nhập**. */
  role: Role | null;
  /** Mức sống theo `id` App — đã qua cổng quyền ở máy chủ *(`LS-1`)*. */
  mucSong?: Record<string, LiveStateOrNull>;
}) {
  const { t } = useLanguage();

  // ═══ 🔴 `UI-3` — ĐẢO CHIỀU SO VỚI `UI-1.5` ══════════════════════════════
  //
  // `UI-1.5` đóng `UI-F1` bằng cách **ẩn** mọi Module với người chưa đăng nhập.
  // Board đã bác cách đó *(Directive Rev 2, và tái khẳng định ở Build Mode)*:
  //
  //   *"Homepage hiển thị toàn bộ Module, quyền chỉ kiểm khi mở.
  //     ⛔ KHÔNG ẩn Module ngay từ Homepage."*
  //
  // ─── VÌ SAO ĐÂY ⛔ KHÔNG PHẢI NỚI LỎNG BẢO MẬT ─────────────────────────
  // Ô Launcher nằm ở **bậc ③** — tầng TRẢI NGHIỆM *(`PA-1`)*. Ẩn thẻ ⛔ **không
  // bảo vệ gì cả**: ai biết đường dẫn vẫn gõ được `/kho`, và `guard.ts` *(⑤)*
  // cùng RLS *(⑦)* chặn họ — **hôm nay đã vậy**. Board chỉ **gọi đúng tên** một
  // tầng vốn ⛔ chưa bao giờ là hàng rào *(`PA-2`)*.
  //
  // ⚠️ Cái mất là có thật và **có tên**: `UI-F1` ⛔ **không** được đóng — bản đồ
  // 16 phân hệ lộ ra cho mọi người xem. Board chấp nhận **có chủ ý** để đổi lấy
  // giá trị bán hàng · demo · onboarding. Ghi ở `GPR-001`, ⛔ không im lặng.
  //
  // 🔑 `modulePermissionState` thay `visibleModules`: từ **LỌC** sang **GÁN
  //    TRẠNG THÁI**. Cùng một `canAccess`, ⛔ không phải bản chép tay thứ hai.

  return (
    <>
      {/* ═══ HERO — hai dòng, không hơn ═══════════════════════════════════
          ⚠️ MỌI cỡ chữ ở đây lấy từ `TYPE` (TD-10). Bản nháp đầu tiên của tệp
          này tự đặt `text-[38px] font-black sm:text-6xl` và **bài kiểm mục ⑩
          đã bắt được ngay** — đúng thứ cơ chế bánh cóc sinh ra để chặn. Sửa
          bằng cách dùng thẻ, KHÔNG bằng cách thêm tệp vào danh sách nợ. */}
      {/* ─── NHỊP DỌC: 3 · 7 · 3 ────────────────────────────────────────
          Khoảng cách KHÔNG đều nhau, và đó là chủ ý. "Welcome to" dính sát
          wordmark vì hai thứ đó là MỘT câu; tagline đứng xa hơn hẳn vì nó là
          một phát biểu riêng; dòng gợi ý nép lại gần tagline vì nó phụ thuộc
          vào tagline.
          Khoảng cách đều nhau sẽ khiến bốn dòng đọc ra như bốn mục ngang hàng —
          mắt phải tự đoán cái nào quan trọng. Nhịp lệch làm việc đó thay mắt. */}
      {/* ═══ HERO — CĂN TRÁI, HAI TẦNG ══════════════════════════════════
          ⚠️ ĐÂY LÀ THAY ĐỔI LỚN NHẤT CỦA LƯỢT DỰNG LẠI NÀY.

          Bản cũ căn GIỮA phần chào, trong khi lưới App căn TRÁI. Hai trục đối
          nhau trong cùng một khung nhìn: mắt đọc xong phần giữa phải nhảy về
          mép trái để bắt đầu quét lưới. Cú nhảy đó rất nhỏ nhưng lặp lại mỗi
          sáng, và nó là thứ khiến trang đọc ra như MỘT TRANG GIỚI THIỆU đặt
          trên một bảng chọn, thay vì một sản phẩm liền mạch.

          Nay cả hai cùng một mép trái. Trang có XƯƠNG SỐNG — đúng thứ khiến
          Linear và Raycast trông chắc chắn ngay từ giây đầu.

          ⚠️ Bốn tầng chữ rút còn HAI. "Click a Business App to continue" gộp
          vào cùng dòng với tagline, ngăn bằng dấu chấm giữa. Phần mềm cao cấp
          không dạy người dùng rằng thẻ thì bấm được. */}
      {/* ⚠️ `sm:mb-16 → sm:mb-12` — cùng phép đo `HP-1` với đệm trên ở
          `page.tsx`. Hai chỗ này cộng lại trả về **32px** cho hàng ô đầu tiên
          ở khổ 1366×768. Khổ điện thoại giữ nguyên `mb-12`. */}
      <section className="mb-12">
        {/* ═══ 🔴 REV 5 — BRAND HIERARCHY, ⛔ KHÔNG PHẢI CĂN GIỮA CỤM ═════
            Board *(Hero Layout Clarification)*: *"Đây **⛔ không** phải yêu
            cầu căn giữa toàn bộ cụm Hero. **Chỉ có MONICA ONE** là trung tâm
            thương hiệu và phải luôn nằm **đúng tâm màn hình**."*

            🔴 **BẢN TRƯỚC CỦA TÔI SAI ĐÚNG CHỖ NÀY.** Tôi để `Welcome to` và
            wordmark trong **một hàng `flex justify-center`** — tức căn giữa
            **cả cụm**. Hệ quả: `Welcome to` **đẩy wordmark lệch sang phải**,
            và tâm thị giác rơi vào **khoảng giữa hai thứ**, ⛔ không rơi vào
            thương hiệu.

            ⚠️ Cú lệch đó **⛔ không ai nhìn ra bằng mắt** — nó chỉ vài chục
            pixel. Nhưng nó làm đúng một việc: **thương hiệu thôi là điểm
            nhìn đầu tiên**.

            ⇒ Ba tầng, ba trục khác nhau:
              ③ `Welcome to`               lời dẫn  → **lệch trái**, ⛔ không
                                                       ảnh hưởng tâm
              ① `MONICA ONE`               thương hiệu → **đúng tâm màn hình**
              ② `Business Operating System` giải nghĩa → **cùng trục với ①**

            🔑 Ba tầng này là **Brand Hierarchy**, ⛔ không phải quyết định
            thẩm mỹ — nên chúng ⛔ không được gộp vào một hàng flex, dù hàng
            đó trông gọn hơn. */}

        {/* ③ Lời dẫn — nằm trong một hộp HẸP HƠN và căn trái trong hộp đó.
            Nhờ vậy nó rơi về **bên trái tâm**, đúng như sơ đồ Board vẽ, mà
            ⛔ **không** kéo theo bất cứ thứ gì bên dưới. */}
        <div className="mx-auto max-w-2xl px-4 text-left">
          <span className={`${TYPE.heroLead} text-slate-400`}>{t('home.welcomeTo')}</span>
        </div>

        {/* ① Thương hiệu — khối riêng, `text-center` trên TOÀN bề rộng.
            Đây là thứ duy nhất định nghĩa tâm của Hero. */}
        <h1 className="mt-1 text-center sm:mt-1.5">
          {/* Tên sản phẩm — ⛔ KHÔNG BAO GIỜ đi qua `t()` *(§45.3)*.
              Mỗi chữ một màu, khớp cách logo tô: logo tô RỜI từng chữ cái,
              mỗi chữ một màu đặc. Một dải chuyển sắc làm màu trôi qua giữa
              các chữ nên ⛔ không chữ nào mang đúng màu của nó. */}
          <span className={TYPE.heroMark} aria-label="MONICA ONE">
            <span aria-hidden="true">
              {LOGO_LETTER_COLORS.map(({ ch, color }, i) => (
                <span key={`${ch}-${i}`} style={{ color, textShadow: LOGO_LETTER_SHADOW }}>
                  {ch}
                </span>
              ))}
              {/* "ONE" tô một màu xanh dương đặc — đó là chữ ⛔ KHÔNG có trên
                  logo, nên nó ⛔ không được phép giành sắc độ với sáu chữ kia. */}
              <span className="ml-[0.18em]" style={{ color: LOGO_COLORS[4], textShadow: LOGO_LETTER_SHADOW }}>
                ONE
              </span>
            </span>
          </span>
        </h1>

        {/* `brand.tagline` cố ý GIỐNG NHAU ở cả ba tệp dịch — "Business
            Operating System" là từ hiến định (§45.3). Vẫn đi qua khoá dịch để
            giữ đúng MỘT cửa vào cho mọi chuỗi hiển thị; bài kiểm mục ⑪ chặn
            nếu có ai dịch nó.

            ⚠️ Bỏ CHỮ HOA giãn rộng 11px. Kiểu "chữ dẫn" đó là khuôn mẫu đã mòn,
            và ở 11px nó gần như tàng hình dưới một wordmark 48px. Nay là chữ
            thường 14px — đọc được, có trọng lượng thật, và để wordmark giữ
            trọn vai trò điểm nhấn. */}
        {/* ⚠️ ĐÃ BỎ dòng "Chọn một Business App để tiếp tục".
            Phần nghi thức nay còn đúng HAI tầng: wordmark và một dòng nói đây
            là thứ gì. Câu hướng dẫn kia dạy người dùng rằng thẻ thì bấm được —
            điều mà mười sáu ô rõ ràng đã tự nói. Bỏ đi thì tagline đứng một
            mình dưới wordmark và câu chuyện gọn lại còn một nhịp.

            Khoá `home.hint` GIỮ NGUYÊN ở cả ba tệp dịch: nó không còn được
            dựng ra, nhưng bộ khoá ba ngôn ngữ vẫn cân nhau và muốn dùng lại
            thì chỉ là một dòng. */}
        {/* ② Tagline thương hiệu — **cùng trục** với wordmark, ⛔ không căn
            theo `Welcome to`. Hai dòng này là **một khối thương hiệu**. */}
        <p className={`${TYPE.heroTagline} mt-4 text-center text-slate-500 sm:mt-5`}>
          {t('brand.tagline')}
        </p>

        {/* ── LANDING ĐÃ RỜI TRANG CHỦ — `UI-3` + yêu cầu Board 06/08/2026 ──
            Trước đây, người CHƯA đăng nhập còn nhận thêm hai thứ ở ngay dưới
            tagline: dòng dẫn `landing.lead` và nút `landing.signIn` → `/login`.
            🔴 **Cả hai đã BỎ.** Hero giờ chỉ còn khối thương hiệu, và lưới
            Business App đứng ngay sau nó — **giống hệt nhau** với khách và với
            người đã đăng nhập.

            ─── VÌ SAO ────────────────────────────────────────────────────
            ① `HP-1` *(baseline đã khoá)* đòi **hàng ô App đầu tiên phải thấy
               được ⛔ KHÔNG cần cuộn** ở 1366×768 **và** 390×844. Dòng dẫn +
               nút CTA cao ~110px và đứng ngay trên lưới — chúng đẩy hàng đầu
               xuống dưới nếp gấp đúng với khán giả cần thấy lưới nhất: khách.
               *(Cùng lý do đã hạ ba trụ cột `landing.pillar*` ở lượt trước.)*

            ② Trang chủ ⛔ **không phải cổng đăng nhập**. Hiến pháp §13.1: nó
               là một **Business Operating System** — nhiệm vụ của nó là bày ra
               bản đồ phân hệ. Việc mời đăng nhập thuộc về `/login`.

            ─── LỐI VÀO `/login` ⛔ KHÔNG MẤT ─────────────────────────────
            Đã **đo trên HTML đã dựng**, ⛔ không suy đoán: khách vẫn còn HAI
            đường vào, và cả hai đều **có sẵn từ trước**, ⛔ không phải bù đắp
            dựng thêm cho lượt này:

            ① Nút **Bàn làm việc** ở Bottom Nav — `app-bottom-nav.tsx:65` cho
               `workbenchHref = role ? ROLE_HOME[role] : '/login'`. Đây là lối
               vào **hiển thị**, nằm trong 5 nút Hiến pháp §15.3–§15.8 nên nó
               ⛔ không thể lặng lẽ biến mất.
            ② Bấm bất kỳ Business App nào ⇒ `middleware.ts` đẩy sang `/login`.

            🔑 Cái mất là **lời mời**, ⛔ không phải **cánh cửa**.

            🔑 Khoá `landing.lead` · `landing.signIn` · `landing.pillar*`
            **GIỮ NGUYÊN** ở cả ba tệp dịch *(ràng buộc ② — ⛔ không xoá chữ cũ,
            chỉ thôi dựng)*. ⚠️ Từ lượt này chúng **⛔ KHÔNG còn nơi nào dựng**:
            `/login` kể cùng câu chuyện nhưng bằng bộ khoá RIÊNG `login.*`
            *(xem `app/login/intro.tsx`)*. Đây là **kho chữ nằm chờ**, ⛔ không
            phải chữ đang sống — đừng sửa nó rồi tưởng trang đổi theo. */}
      </section>

      {/* ══ WORK ZONE ĐÃ RỜI TRANG CHỦ — `UI-3` · ADR-021 ═══════════════════
          Board: *"⛔ không thêm Work Zone vào Homepage"*.

          Hiến pháp §13.1 nói nguyên văn ba lần: *"The Homepage **is not a
          dashboard**… The Homepage **is** a Business Operating System
          Launcher."* Một Work Zone *"cá nhân, động, hiện việc cần chú ý"*
          **là** một dashboard cá nhân — nên nó đứng ở đây là trang chủ tự mâu
          thuẫn với chính điều khoản định nghĩa ra mình.

          ⚠️ `app/_home/work-zone.tsx` **GIỮ NGUYÊN, ⛔ KHÔNG XOÁ** *(ràng buộc
          giao diện #2)*. Nó chỉ thôi được dựng **ở đây**. Nơi đến của nó —
          năng lực toàn cục sau nút `Work` — chờ `ADR-021` được phê duyệt;
          Board đã chỉ thị **⛔ không đổi Bottom Navigation** ở lượt này.

          🔑 Định nghĩa đã chốt: **Work Inbox** = việc chờ tôi trong MỘT Domain;
          **Work Zone** = HỢP của mọi Work Inbox tôi có quyền. Nó là **phép
          chiếu**, ⛔ không sở hữu dữ liệu — nên dời chỗ nó là quyết định ĐIỀU
          HƯỚNG, ⛔ không phải quyết định DỮ LIỆU, và ⛔ không mất gì. */}

      {/* ═══ LƯỚI BUSINESS APP — ngay dưới Hero ══════════════════════════
          **Điện thoại 3 · từ `sm` là 4.** Khoảng cách dọc luôn rộng hơn ngang.

          ⚠️ Ghi chú cũ ở chỗ này ghi *"Mobile 2 · Tablet 3 · Desktop 4"* và
          *"16 mục chia đúng 4 hàng, thành một khối VUÔNG"*. **Cả hai đã SAI**
          từ lâu: lưới thực tế là 4 cột ở mọi khổ, còn số ô thì **đã đổi ba
          lần** *(16 → 22 → 24)*. Lập luận *"khối vuông 4×4"* vì vậy ⛔ không
          còn nền tảng nào — và bài học là **⛔ đừng viết số ô vào bố cục**.
          Lưới ⛔ không được phép biết Registry có bao nhiêu mục.

          ⚠️ `max-w-5xl mx-auto`: lưới HẸP HƠN phần chào phía trên. Bỏ khung
          thì mỗi ô chỉ còn biểu tượng và hai dòng chữ; trải chúng ra hết bề
          ngang 1400px sẽ khiến các ô trôi nổi rời rạc. Thu lại thì chúng
          thành MỘT khối, có mép trái mép phải rõ ràng, và khoảng trắng hai
          bên trở thành khoảng thở có chủ đích. */}
      {/* `id="business-apps"` — đích đến của nút **`Monica`** ở thanh dưới.
          `Product Constitution §6`: *"Monica **chính là** Application Launcher"*
          ⇒ trên trang chủ nó cuộn thẳng xuống lưới App, bỏ qua khối thương
          hiệu. Với người vào **mỗi ngày**, đó là **một cú bấm thay cho một lần
          cuộn**.

          ⚠️ `scroll-mt-24` chừa chỗ cho thanh đầu trang — thiếu nó thì hàng ô
          đầu tiên bị thanh đó che mất, và cú bấm đưa người dùng tới đúng chỗ
          họ **⛔ không** nhìn thấy. */}
      <section id="business-apps" aria-label={t('home.appsLabel')} className="scroll-mt-24">
        {/* ═══ 🔴 REV 6 — ĐIỆN THOẠI BA CỘT, ⛔ KHÔNG CÒN BỐN ════════════
            Board Rev 6: *"Trên mobile chuyển từ 4 cột → 3 cột… mỗi Launcher
            lớn hơn, khoảng trắng cân đối hơn, dễ bấm… **Ưu tiên chất lượng
            trải nghiệm hơn số lượng icon trên một hàng.**"*

            ─── PHÉP TÍNH, ⛔ không phải cảm tính ─────────────────────────
            Màn 390px · `main` có `px-4` ⇒ còn **358px** để chia.

              4 cột, `gap-x-1.5`  (6×3=18)  ⇒ (358−18)/4 = **85px** mỗi cột
              3 cột, `gap-x-2`    (8×2=16)  ⇒ (358−16)/3 = **114px** mỗi cột

            Mỗi ô có `p-2` ⇒ lòng ô **69px** *(cũ)* → **98px** *(mới)*.
            Tức ô Launcher **to thêm ~42%**, ⛔ không phải nới vài pixel.

            🔴 **VÀ NÓ VÁ MỘT LỖI THẬT.** Ở bản 4 cột, biểu tượng khai cứng
            `w-[96px]` nhưng lòng ô chỉ **69px** — biểu tượng **RỘNG HƠN ô
            chứa nó**. Lưới bị đẩy phình ra ⇒ đúng cái cảm giác *"chật, ⛔
            không cân"* Board mô tả. Cỡ cứng ⛔ không bao giờ biết ô rộng bao
            nhiêu; lượt này biểu tượng chuyển sang **co theo ô**
            *(`app-card.tsx`)*, nên lỗi ⛔ không tái diễn ở bất kỳ khổ nào.

            ─── KHE DỌC NỚI THEO ──────────────────────────────────────────
            Ô to thêm 42% mà khe dọc giữ nguyên thì các hàng **dính vào
            nhau** — trang trông ĐẶC hơn chứ ⛔ không thoáng hơn, tức ngược
            hẳn điều Board yêu cầu. `gap-y` 6→8 ở điện thoại, 8→10 từ `sm`.

            ⚠️ Khe DỌC vẫn rộng hơn khe NGANG ở mọi khổ. Tên App xuống hai–ba
            dòng ở khổ hẹp; thiếu khoảng dọc thì chữ hàng trên chạm biểu
            tượng hàng dưới và hai hàng đọc ra thành một.

            ⚠️ Từ `sm` **GIỮ 4 cột** — Board chỉ nói *"trên mobile"*. ⛔ Không
            tự nới sang màn rộng: ở đó ô đã 164px và bề ngang ⛔ chưa bao giờ
            là thứ thiếu. */}
        {/* ═══ 🔴 REV 4 — MỘT LƯỚI PHẲNG, ⛔ KHÔNG CÒN NHÓM ═══════════════
            Board Rev 4: *"⛔ Không chia thành từng vùng. ⛔ Không có tiêu đề…
            ⛔ Không có bất kỳ đường phân cách nào… Toàn bộ Business Apps nằm
            **liên tục trên một lưới thống nhất**. Người dùng chỉ cần **cuộn
            xuống như đang xem màn hình điện thoại**."*

            ⚠️ Đây là **đảo ngược Rev 2**, và Board đảo chính đề xuất của
            mình. Tôi đã dựng sáu nhóm có tiêu đề ở Rev 2 theo gợi ý đó.

            🔑 Lập luận Rev 4 mạnh hơn, và nó nằm ở **phép so sánh gốc**:
            màn hình chính điện thoại **⛔ không có tiêu đề nhóm nào cả** —
            ⛔ không "Mạng xã hội", ⛔ không "Công cụ". Nó chỉ là **một lưới
            liên tục**, và ⛔ chưa ai từng lạc trên đó. Tiêu đề nhóm biến một
            **Launcher** thành một **mục lục**, và mục lục thì phải ĐỌC.

            ⚠️ **Thứ tự nhóm thì GIỮ NGUYÊN.** `MODULES` vẫn xếp theo dòng
            chảy đơn hàng *(quyết định → bán → làm → chứa → giao → đỡ)*, nên
            App cùng khâu vẫn **nằm cạnh nhau**. Mất tiêu đề ⛔ không có
            nghĩa mất trật tự — nó chỉ có nghĩa **trật tự thôi tự xưng tên**.

            🔑 Và màu vẫn theo nhóm *(Rev 2)*, nên **mắt vẫn thấy cụm** dù
            ⛔ không còn chữ nào nói ra. Đó đúng cách màn hình điện thoại
            hoạt động. */}
        {/* ═══ 🔴 BA CỘT TRÊN TOÀN DẢI ĐIỆN THOẠI — Board 06/08/2026 ══════
            Board: *"Đổi Business Launcher từ 4 cột → 3 cột… launcher lớn hơn,
            dễ bấm hơn, khoảng trắng đẹp hơn."*

            ⚠️ Điện thoại **đã là 3 cột từ Rev 6**. Chỗ còn 4 cột là dải
            **640–767px** — `sm:` bắt đầu ở 640, mà điện thoại lớn nằm đúng
            trong dải đó. Vì vậy mốc đổi cột dời `sm:` → `md:` *(768px)*:

              < 768px   3 cột   ← toàn bộ điện thoại, kể cả máy lớn
              ≥ 768px   4 cột   ← máy tính bảng và máy bàn, GIỮ NGUYÊN

            🔑 Khoảng cách vẫn nới ở `sm:` như cũ — ô to thêm nhờ bớt một cột,
            ⛔ không phải nhờ bóp khoảng trắng. Đó là vế *"khoảng trắng đẹp
            hơn"*.

            ⚠️ `home-skeleton.tsx` phải đổi **CÙNG MỘT MỐC**, nếu không khung
            chờ 4 cột sẽ nhảy sang 3 cột lúc dữ liệu về — đúng thứ khung chờ
            sinh ra để tránh. */}
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-x-2 gap-y-8 sm:gap-x-4 sm:gap-y-10 md:grid-cols-5">
          {MODULES.map((mod) => (
            <AppCard
              key={mod.id}
              mod={mod}
              state={modulePermissionState(role, mod)}
              live={mucSong[mod.id] ?? null}
            />
          ))}
        </div>
      </section>
    </>
  );
}
