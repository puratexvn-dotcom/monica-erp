'use client';

import { MODULES } from '../home-modules';
import AppCard from './app-card';
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

export default function HomeContent() {
  const { t } = useLanguage();

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
      </section>

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
      <section aria-label={t('home.appsLabel')}>
        {/* ⚠️ BỐN CỘT Ở MỌI KHỔ MÀN, kể cả điện thoại.
            Trên màn 390px, trừ đệm hai bên và ba khe giữa thì mỗi ô chỉ còn
            khoảng 80px. Vì vậy khe ngang phải bóp xuống `gap-x-2` (8px) —
            giữ `gap-x-4` như cũ sẽ ăn mất 48px, tức hơn một nửa bề ngang của
            một ô.
            Khe DỌC ngược lại vẫn phải rộng: tên App có thể xuống ba dòng ở khổ
            hẹp, thiếu khoảng dọc thì chữ hàng trên chạm biểu tượng hàng dưới. */}
        <div className="mx-auto grid max-w-5xl grid-cols-4 gap-x-2 gap-y-7 sm:gap-x-6 sm:gap-y-12">
          {MODULES.map((mod) => (
            <AppCard key={mod.name} mod={mod} />
          ))}
        </div>
      </section>
    </>
  );
}
