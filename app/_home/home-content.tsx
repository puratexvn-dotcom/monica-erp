'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { MODULES_THEO_NHOM } from '../home-modules';
import AppCard from './app-card';
import { modulePermissionState } from '@/lib/mos/capability/visible-modules';
import type { Role } from '@/lib/rbac';
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
}: {
  /** Vai của người đang đăng nhập. `null` = **chưa đăng nhập**. */
  role: Role | null;
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
  const daDangNhap = role !== null;

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
      <section className="mb-14 text-center sm:mb-20">
        {/* ⚠️ CĂN GIỮA — quay lại đúng như vậy, và lần này là quyết định cuối.
            Lượt trước tôi kéo phần chào sang trái để khớp trục với lưới App.
            Về mặt bố cục thì đúng; về mặt SẢN PHẨM thì sai. Đây là CỬA CHÍNH
            của hệ điều hành, và cửa chính thì đứng giữa. Trục đối xứng cũng là
            trục của câu Lời Chúa ngay phía trên — hai thứ đó phải cùng một
            đường, nếu không phần đầu trang gãy làm hai nửa lệch nhau.

            Lưới App bên dưới vẫn căn trái. Đó KHÔNG phải xung đột: khối nghi
            thức đứng giữa, khối làm việc trải đều — đúng cách một tiền sảnh
            mở ra một không gian làm việc. */}
        <h1 className="flex flex-wrap items-baseline justify-center gap-x-3 whitespace-nowrap sm:gap-x-4">
          <span className={`${TYPE.heroLead} text-slate-400`}>{t('home.welcomeTo')}</span>
          {/* Tên sản phẩm — KHÔNG BAO GIỜ đi qua t() (§45.3).
              `pr-[0.06em]`: dải chuyển sắc cắt theo chữ (`bg-clip-text`) hay bị
              xén mất đuôi ký tự cuối ở một số bộ chữ. */}
          {/* ⚠️ TỪNG CHỮ MỘT MÀU, khớp cách logo tô.
              Bản trước tô cả cụm bằng MỘT dải chuyển sắc — nhìn xa thì giống,
              nhưng nó KHÔNG phải cách logo hoạt động: logo tô rời từng chữ cái,
              mỗi chữ một màu đặc. Dải chuyển sắc làm màu trôi qua giữa các chữ
              nên không chữ nào mang đúng màu của nó.
              Nay mỗi chữ là một phần tử riêng, lấy đúng màu từ bảng logo.
              `aria-label` giữ nguyên cả cụm để trình đọc màn hình đọc liền
              "MONICA ONE" chứ không đánh vần từng chữ cái. */}
          <span className={TYPE.heroMark} aria-label="MONICA ONE">
            <span aria-hidden="true">
              {LOGO_LETTER_COLORS.map(({ ch, color }, i) => (
                <span
                  key={`${ch}-${i}`}
                  style={{ color, textShadow: LOGO_LETTER_SHADOW }}
                >
                  {ch}
                </span>
              ))}
              {/* "ONE" tô một màu xanh dương đặc — đó là chữ KHÔNG có trên
                  logo, nên nó không được phép giành sắc độ với sáu chữ kia. */}
              <span
                className="ml-[0.18em]"
                style={{ color: LOGO_COLORS[4], textShadow: LOGO_LETTER_SHADOW }}
              >
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
        <p className={`${TYPE.heroTagline} mx-auto mt-6 text-slate-500`}>
          {t('brand.tagline')}
        </p>

        {/* ── LANDING — chỉ khi CHƯA đăng nhập · Board `Q3` ──────────────
            Người chưa đăng nhập nhận một trang GIỚI THIỆU: nói MONICA ONE là
            gì, và mời đăng nhập. ⛔ Không bản đồ phân hệ.

            ⚠️ Ba trụ cột này lặp lại ba dòng đã có ở `/login`. Đó là **cố ý**:
            hai màn hình cùng đứng trước cánh cửa, và chúng phải nói **cùng một
            câu chuyện**. Câu chữ nằm ở `messages/`, ⛔ không chép tay hai nơi. */}
        {/* ── LỐI ĐĂNG NHẬP — chỉ khi CHƯA đăng nhập ─────────────────────
            ⚠️ `UI-3` BỎ danh sách ba trụ cột khỏi trang chủ. Hai lý do:

            ① `HP-1` *(baseline đã khoá)* đòi **hàng ô App đầu tiên phải thấy
               được ⛔ KHÔNG cần cuộn** ở 1366×768 **và** 390×844. Danh sách ba
               trụ cột cao ~180px và đứng ngay trên lưới — nó đẩy hàng đầu
               xuống dưới nếp gấp đúng với khán giả cần thấy lưới nhất: khách.

            ② Ba dòng đó **lặp nguyên văn** ba dòng ở `/login`, và `/login` là
               nơi chúng thuộc về — người đã bấm vào một Module thì đang **trên
               đường vào**, ⛔ không còn cần được thuyết phục.

            🔑 Khoá `landing.pillar*` **GIỮ NGUYÊN** ở cả ba tệp dịch: `/login`
            vẫn dựng chúng. ⛔ Không xoá chữ, chỉ đổi chỗ dựng. */}
        {!daDangNhap && (
          <>
            <p className={`${TYPE.bodyLg} mx-auto mt-4 max-w-xl text-slate-500`}>
              {t('landing.lead')}
            </p>

            {/* Cao 44px — ngưỡng vùng chạm tối thiểu, đủ cho ngón tay. */}
            <Link
              href="/login"
              // ⚠️ Cỡ chữ lấy từ `TYPE.label`, ⛔ không viết `text-sm font-bold`.
              // Bản nháp đầu viết thẳng và **mục ⑩ bắt được ngay** — đúng thứ
              // cơ chế bánh cóc sinh ra để chặn. Sửa bằng THẺ, ⛔ không bằng
              // cách thêm tệp vào sổ nợ.
              className={`${TYPE.label} mt-7 inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-white shadow-lg transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 active:scale-[0.98]`}
            >
              {t('landing.signIn')}
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </>
        )}
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
          Mobile 2 · Tablet 3 · Desktop 4. Khoảng cách đều ở mọi mốc. */}
      {/* ⚠️ Khoảng cách lưới NỚI RỘNG một nấc (3→4 ở màn hẹp, 4→5 từ sm).
          Mười sáu thẻ là mật độ cao; khoảng cách hẹp làm chúng đọc ra như các ô
          của MỘT bảng, khoảng cách rộng làm mỗi thẻ đọc ra như MỘT ứng dụng
          riêng. Đây là thay đổi rẻ nhất và có tác dụng lớn nhất trong cả lượt
          tinh chỉnh này. */}
      {/* ⚠️ LƯỚI 4 CỘT Ở MÀN RỘNG — 16 mục chia đúng 4 hàng, thành một khối
          VUÔNG. Bỏ khung rồi thì bố cục không còn đường viền nào để dựa vào,
          nên hình dạng tổng thể của lưới trở thành thứ giữ trật tự thay cho
          chúng. 4×4 là hình cân nhất có thể chia từ mười sáu.

          ⚠️ `max-w-4xl mx-auto`: lưới HẸP HƠN phần chào phía trên. Bỏ khung
          thì mỗi ô chỉ còn biểu tượng và một dòng chữ; trải chúng ra hết bề
          ngang 1400px sẽ khiến mười sáu mục trôi nổi rời rạc. Thu lại thì
          chúng thành MỘT khối, có mép trái mép phải rõ ràng, và khoảng trắng
          hai bên trở thành khoảng thở có chủ đích.

          ⚠️ Khoảng cách DỌC rộng hơn ngang (gap-y 10 so với gap-x 4). Tên có
          thể xuống hai dòng, nên thiếu khoảng cách dọc thì chữ của hàng trên
          dính vào biểu tượng của hàng dưới. */}
      {/* `id="business-apps"` — đích đến của nút **`Monica`** ở thanh dưới.
          `Product Constitution §6`: *"Monica **chính là** Application Launcher"*
          ⇒ trên trang chủ nó cuộn thẳng xuống lưới App, bỏ qua khối thương
          hiệu. Với người vào **mỗi ngày**, đó là **một cú bấm thay cho một lần
          cuộn**.

          ⚠️ `scroll-mt-24` chừa chỗ cho thanh đầu trang — thiếu nó thì hàng ô
          đầu tiên bị thanh đó che mất, và cú bấm đưa người dùng tới đúng chỗ
          họ **⛔ không** nhìn thấy. */}
      <section id="business-apps" aria-label={t('home.appsLabel')} className="scroll-mt-24">
        {/* ⚠️ BỐN CỘT Ở MỌI KHỔ MÀN, kể cả điện thoại.
            Trên màn 390px, trừ đệm hai bên và ba khe giữa thì mỗi ô chỉ còn
            khoảng 80px. Vì vậy khe ngang phải bóp xuống `gap-x-2` (8px) —
            giữ `gap-x-4` như cũ sẽ ăn mất 48px, tức hơn một nửa bề ngang của
            một ô.
            Khe DỌC ngược lại vẫn phải rộng: tên App có thể xuống ba dòng ở khổ
            hẹp, thiếu khoảng dọc thì chữ hàng trên chạm biểu tượng hàng dưới. */}
        {/* ═══ 🔴 REV 2 — CHIA THEO SÁU KHU VỰC NGHIỆP VỤ ═══════════════════
            Board: *"nhóm các Business App theo **khu vực nghiệp vụ** thay vì
            chỉ xếp thành lưới đều nhau… người dùng sẽ định vị nhanh hơn rất
            nhiều mà vẫn giữ đúng tinh thần Launcher."*

            🔑 Và lý do nó **càng ngày càng đúng**: một lưới phẳng 16 ô còn quét
            được; **22 ô** thì mắt phải **đọc từng ô**. Chia nhóm biến bài toán
            *"tìm trong 22"* thành *"chọn 1 trong 6, rồi tìm trong 3"*.

            ⚠️ Nhóm ở đây là **khu vực NGHIỆP VỤ** *(việc gì đang diễn ra)*,
            ⛔ **không** phải sơ đồ tổ chức — §13.3 cấm tổ chức trang chủ theo
            *"organizational hierarchy"*. `BA-1 §8.6` đã chốt hướng này.

            ⚠️ Tiêu đề nhóm cố ý **rất nhẹ** *(chữ nhỏ, xám nhạt)*: nó là **mốc
            định vị**, ⛔ không phải nội dung. Tiêu đề đậm sẽ giành mất sự chú ý
            của chính thứ nó đang giới thiệu. */}
        <div className="mx-auto flex max-w-5xl flex-col gap-y-9 sm:gap-y-14">
          {MODULES_THEO_NHOM.map(({ nhom, apps }) => (
            <div key={nhom}>
              <h2 className={`${TYPE.overline} mb-3 px-0.5 text-slate-400 sm:mb-5`}>
                {t(`appGroup.${nhom}` as never)}
              </h2>
              {/* 🔑 Cả 22 App, ⛔ KHÔNG lọc. Quyền đi vào `state`, ⛔ không đi
                  vào việc có mặt hay vắng mặt. */}
              <div className="grid grid-cols-4 gap-x-2 gap-y-7 sm:gap-x-6 sm:gap-y-10">
                {apps.map((mod) => (
                  <AppCard
                    key={mod.id}
                    mod={mod}
                    state={modulePermissionState(role, mod)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
