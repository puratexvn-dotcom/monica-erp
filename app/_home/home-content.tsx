'use client';

import { MODULES } from '../home-modules';
import AppCard from './app-card';
import { useLanguage } from '@/lib/i18n';
import { TYPE } from '@/lib/design/typography';
import { LOGO_TEXT_GRADIENT } from '@/lib/brand';

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
          <span className={`${TYPE.bodyLg} text-slate-400`}>{t('home.welcomeTo')}</span>
          {/* Tên sản phẩm — KHÔNG BAO GIỜ đi qua t() (§45.3).
              `pr-[0.06em]`: dải chuyển sắc cắt theo chữ (`bg-clip-text`) hay bị
              xén mất đuôi ký tự cuối ở một số bộ chữ. */}
          <span
            className={`${TYPE.display} bg-clip-text pr-[0.06em] text-transparent`}
            style={{ backgroundImage: LOGO_TEXT_GRADIENT }}
          >
            MONICA ONE
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
        {/* Một dòng duy nhất dưới wordmark. Hai mệnh đề, ngăn bằng dấu chấm
            giữa — không phải hai dòng xếp chồng. Xếp chồng sẽ thành tầng chữ
            thứ ba và thứ tư, mà phần nghi thức chỉ chịu được hai tầng. */}
        <p className={`${TYPE.body} mx-auto mt-5 max-w-xl text-slate-500`}>
          {t('brand.tagline')}
          <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
          <span className="text-slate-400">{t('home.hint')}</span>
        </p>
      </section>

      {/* ═══ LƯỚI BUSINESS APP — ngay dưới Hero ══════════════════════════
          Mobile 2 · Tablet 3 · Desktop 4. Khoảng cách đều ở mọi mốc. */}
      {/* ⚠️ Khoảng cách lưới NỚI RỘNG một nấc (3→4 ở màn hẹp, 4→5 từ sm).
          Mười sáu thẻ là mật độ cao; khoảng cách hẹp làm chúng đọc ra như các ô
          của MỘT bảng, khoảng cách rộng làm mỗi thẻ đọc ra như MỘT ứng dụng
          riêng. Đây là thay đổi rẻ nhất và có tác dụng lớn nhất trong cả lượt
          tinh chỉnh này. */}
      <section aria-label={t('home.appsLabel')}>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {MODULES.map((mod) => (
            <AppCard key={mod.name} mod={mod} />
          ))}
        </div>
      </section>
    </>
  );
}
