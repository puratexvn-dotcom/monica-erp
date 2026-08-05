'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';

import type { ModuleItem } from '../home-modules';
import type { PermissionState } from '@/lib/mos/capability/visible-modules';
import { MODULE_SURFACE, GLASS } from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';
import { useLanguage } from '@/lib/i18n';

// ============================================================================
// BUSINESS APP — KHÔNG CÒN KHUNG. BIỂU TƯỢNG VÀ TÊN, HẾT.
//
// ═══ VÌ SAO BỎ HẲN KHUNG ════════════════════════════════════════════════
// Cái khung không mang thông tin nào cả. Nó chỉ vẽ một đường bao quanh thứ
// vốn đã tách bạch nhờ khoảng trắng. Mười sáu cái khung xếp cạnh nhau tạo ra
// mười sáu đường viền, mười sáu nền màu, mười sáu vệt bóng — tức là ba lớp
// nhiễu chồng lên nội dung thật, mà nội dung thật chỉ có hai thứ: BIỂU TƯỢNG
// và TÊN.
//
// Bỏ khung đi thì trang thở ra. Đây đúng là cách màn hình chính điện thoại
// hoạt động: không ai vẽ hộp quanh từng ứng dụng, mà chưa bao giờ có ai nhầm
// ứng dụng này với ứng dụng kia.
//
// ═══ KHI MẤT KHUNG, BIỂU TƯỢNG PHẢI GÁNH TẤT CẢ ═════════════════════════
// Khung biến mất nghĩa là mất luôn nền màu và mất luôn bóng đổ — hai thứ
// trước đây làm nhiệm vụ nhận diện và tách lớp. Nên biểu tượng phải:
//
//   • TO HẲN LÊN            64 → 80px, đủ sức làm mỏ neo một mình
//   • BO GÓC MỀM            góc bo 28% cạnh — tỷ lệ của biểu tượng iOS, khác
//                           hẳn góc bo của một cái thẻ
//   • CÓ BÓNG RIÊNG         bóng nay thuộc về BIỂU TƯỢNG, không thuộc về hộp;
//                           nhờ vậy nó nổi trên nền trang chứ không nằm trong
//                           một cái khay
//   • MÀU BÃO HOÀ           màu nay là thứ DUY NHẤT phân biệt mười sáu mục
//
// ═══ CĂN GIỮA ═══════════════════════════════════════════════════════════
// Biểu tượng và tên cùng một trục dọc, tên nằm chính giữa bên dưới. Ghim tên
// đúng hai dòng để mọi ô trong một hàng có đáy bằng nhau, dù tên dài ngắn khác
// nhau và dù đang ở tiếng Việt, Anh hay Trung.
//
// ⚠️ Câu mô tả chuyển vào thuộc tính `title` — hiện khi rê chuột, không còn
// chiếm chỗ trên lưới. Màn hình chính điện thoại không có dòng mô tả nào dưới
// tên ứng dụng, và đó chính là lý do nó trông thoáng.
// ============================================================================

export default function AppCard({
  mod,
  state,
}: {
  mod: ModuleItem;
  /** Trạng thái quyền của ô với NGƯỜI ĐANG XEM — `UI-3` · ADR-022. */
  state: PermissionState;
}) {
  const { t } = useLanguage();
  const Icon = mod.icon;
  const sf = MODULE_SURFACE[mod.key];

  // ⚠️ Trước bản này là `Boolean(mod.href)` — suy trạng thái từ chỗ CÓ hay
  // KHÔNG có đường dẫn. Nay trạng thái được khai TƯỜNG MINH (`Q2`), nên đọc
  // thẳng. Suy gián tiếp là chỗ hai khái niệm *"chưa có route"* và *"đang phát
  // triển"* từng bị gộp làm một.
  const sapCo = state === 'COMING_SOON';
  const moDuoc = !sapCo;

  // 🔴 `UNAUTHORIZED` — hiện, LÀM MỜ, ⛔ KHÔNG ẨN *(ADR-022 §2.3)*.
  //
  // ⚠️ `LI-1` — làm mờ bằng **ĐỘ MỜ**, ⛔ KHÔNG bằng cách đổi sang xám. Màu là
  // **định danh** *(Điều 44.6)*: người dùng học *"xanh lá = Kho"* bằng mắt
  // trong vài ngày. Đổi ô Kho thành xám là xoá đúng thứ họ đã học — và dạy họ
  // một quy ước vô nghĩa *("xám = ⛔ không quyền")* thay vào đó.
  //
  // ⚠️ `LI-3` — độ mờ chỉ đặt lên **BIỂU TƯỢNG**, ⛔ không đặt lên chữ. Chữ giữ
  // nguyên màu ⇒ tương phản ⛔ không đổi ⇒ ngưỡng 4,5:1 được giữ **theo cấu
  // trúc**, ⛔ không phải nhờ ai đó nhớ kiểm lại.
  //
  // 🔑 Đây là chỗ *"làm mờ ⛔ ≠ ẩn"* thành mã chạy được thay vì một câu trong
  //    tài liệu.
  const khongQuyen = state === 'UNAUTHORIZED';

  // Bóng của BIỂU TƯỢNG, không phải của hộp. Hai lớp: một lớp sát để bắt mép,
  // một lớp toả rộng và thấp để nó có vẻ đang nổi trên mặt trang.
  const iconShadow =
    'shadow-[0_2px_4px_-1px_rgba(16,24,40,0.10),0_12px_24px_-8px_rgba(16,24,40,0.18)]';
  const iconShadowHover =
    'group-hover:shadow-[0_4px_8px_-2px_rgba(16,24,40,0.12),0_20px_36px_-10px_rgba(16,24,40,0.26)]';

  // ─── TOOLTIP — nơi DUY NHẤT `Business Value` được hiện ────────────────────
  //
  // Ba lớp chữ, ba khán giả, và chúng ⛔ KHÔNG tranh chỗ của nhau:
  //
  //   `shortKey`  trên ô, khổ điện thoại  → người vận hành QUÉT
  //   `descKey`   trên ô, từ `sm`         → người vận hành ĐỌC LƯỚT
  //   `valueKey`  CHỈ ở đây               → Sales · Investor · người mới ĐỌC
  //
  // ⚠️ Vì sao `valueKey` ⛔ KHÔNG lên ô: một câu đầy đủ nhân với 16 ô biến lưới
  // thành bức tường chữ — đúng thứ Launcher tồn tại để tránh. Tooltip chỉ hiện
  // khi người dùng ĐÃ DỪNG LẠI ở một ô, tức đúng lúc họ muốn biết thêm.
  //
  // Xuống dòng bằng `\n`: trình duyệt hiện `title` nhiều dòng, nên câu giá trị
  // đứng tách khỏi câu chức năng thay vì dính thành một chuỗi dài không ngắt.
  const chuThich = `${mod.name} — ${t(mod.descKey)}\n${t(mod.valueKey)}`;

  /** Câu đuôi tooltip — nói RÕ vì sao ô này ⛔ không mở ra Workspace ngay.
   *
   *  🔑 ADR-017 cảnh báo đúng: *"thẻ ⛔ không bấm được là **lời nói dối của
   *  giao diện**"*. Câu trả lời của ADR-022 ⛔ không phải *"cứ hiện đại"* mà là
   *  **hiện KÈM LỜI NÓI** — dòng này là lời nói đó. */
  const duoiChuThich =
    state === 'COMING_SOON' ? `\n${t('home.comingSoonHint')}`
    : state === 'UNAUTHORIZED' ? `\n${t('home.noAccessHint')}`
    : state === 'ANONYMOUS' ? `\n${t('home.signInHint')}`
    : '';

  const inner = (
    <>
      <span className="relative">
        {/* rounded-[28%] — tỷ lệ bo góc của biểu tượng điện thoại. Dùng giá trị
            phần trăm để góc bo giãn theo kích thước ô ở từng khổ màn, giữ đúng
            dáng ở mọi cỡ. */}
        {/* 80 → 96px. Bỏ khung rồi thì biểu tượng là mỏ neo DUY NHẤT; ở cỡ 80
            nó vẫn còn dáng một cái nút, ở 96 nó thành một biểu tượng ứng dụng
            thật sự. */}
        {/* ⚠️ Điện thoại 56px · từ `sm` là 96px.
            Bốn cột trên màn 390px chỉ chừa mỗi ô khoảng 80px, nên biểu tượng
            80px của bản trước sẽ TRÀN ra ngoài ô. 56px để lại đủ lề hai bên và
            vẫn là mỏ neo rõ ràng — đúng cỡ biểu tượng trên màn hình chính điện
            thoại. */}
        <span
          className={`flex h-[68px] w-[68px] items-center justify-center rounded-[28%] transition-[transform,box-shadow,opacity] duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.06] group-active:scale-95 group-active:duration-75 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100 sm:h-[120px] sm:w-[120px] ${sf.tileStrong} ${GLASS} ${iconShadow} ${iconShadowHover} ${khongQuyen ? 'opacity-50 group-hover:opacity-80' : ''}`}
        >
          <Icon className="h-[34px] w-[34px] sm:h-[60px] sm:w-[60px]" strokeWidth={1.6} aria-hidden="true" />
        </span>

        {/* Beta — chấm nhỏ ở góc trên phải biểu tượng, đúng chỗ điện thoại đặt
            huy hiệu. Viền trắng để nó tách khỏi màu biểu tượng bên dưới. */}
        {/* ⚠️ Ở khổ điện thoại chỉ còn MỘT CHẤM, từ `sm` mới hiện chữ "Beta".
            Bản nháp đầu tôi bóp chữ xuống 9px cho vừa biểu tượng 56px — và
            bài kiểm thang chữ chặn ngay, đúng lúc: 9px chính là cỡ đã bị loại
            khỏi thang vì nằm dưới ngưỡng đọc được. Thu nhỏ chữ tới mức không
            ai đọc nổi thì cái nhãn đó thôi làm nhãn.
            Một chấm thì không cần đọc — nó chỉ cần được THẤY, và ở đó nó làm
            đúng việc của mình. */}
        {!moDuoc && (
          <>
            <span
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-white shadow-[0_1px_3px_rgba(16,24,40,0.16)] ring-1 ring-slate-200 sm:hidden"
              aria-hidden="true"
            >
              <span className={`absolute inset-[3px] rounded-full ${sf.tileStrong}`} />
            </span>
            <span
              className={`${TYPE.overline} absolute -right-1.5 -top-1.5 hidden rounded-full bg-white px-1.5 py-0.5 text-slate-500 shadow-[0_1px_3px_rgba(16,24,40,0.16)] ring-1 ring-slate-200 sm:block`}
            >
              {t('home.comingSoon')}
            </span>
            {/* Khổ hẹp mất chữ "Beta", nên phải có lối đọc cho trình đọc màn
                hình — nếu không, sáu App chưa mở trở thành không phân biệt
                được với mười App đang chạy. */}
            <span className="sr-only sm:hidden">{t('home.comingSoon')}</span>
          </>
        )}

        {/* ── Ổ KHOÁ — ô đã đăng nhập nhưng ⛔ chưa được cấp quyền ──────────
            🔑 Đây là **lời nói** mà ADR-022 §2.2 đòi. Một ô mờ mà ⛔ không nói
            gì mới đúng là *"lời nói dối của giao diện"* — người dùng ⛔ không
            biết đó là *"⛔ chưa có"* hay *"⛔ không phải của tôi"*.

            Ổ khoá đặt đúng chỗ nhãn *"Sắp có"* đứng, nên hai trạng thái ⛔
            không bao giờ chồng nhau — và chúng loại trừ nhau theo cấu trúc:
            `COMING_SOON` xét TRƯỚC phiên đăng nhập. */}
        {khongQuyen && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_1px_3px_rgba(16,24,40,0.16)] ring-1 ring-slate-200 sm:-right-1.5 sm:-top-1.5 sm:h-6 sm:w-6"
            title={t('home.noAccessHint')}
          >
            <Lock className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" strokeWidth={2.4} aria-hidden="true" />
            {/* Trình đọc màn hình phải NGHE được điều mắt thấy. ⛔ Không có
                dòng này, ô mờ với họ chỉ là một ô bình thường. */}
            <span className="sr-only">{t('home.noAccess')}</span>
          </span>
        )}
      </span>

      {/* Tên App — ghim hai dòng để đáy mọi ô trong một hàng bằng nhau, bất kể
          tên dài ngắn và bất kể ngôn ngữ. */}
      {/* ⚠️ Ghim BA dòng ở khổ hẹp, HAI dòng từ `sm`.
          Ô rộng ~80px thì "Business Communication" và "Human Resources" phải
          xuống ba dòng mới đủ chỗ. Ghim hai dòng như cũ sẽ cắt cụt chữ. Ghim
          ba dòng thì đáy mọi ô trong một hàng vẫn bằng nhau — mà đó mới là
          điều kiện để lưới đọc ra là một lưới. */}
      {/* ⚠️ KHỔ ĐIỆN THOẠI KHÔNG GHIM CHIỀU CAO TÊN NỮA.
          Ghim ba dòng khiến tên ngắn như "Quality" hay "Finance" để lại hai
          dòng trống bên dưới, đẩy câu chú thích rơi xa hẳn khỏi biểu tượng —
          nhìn ra là chú thích của ô bên dưới chứ không phải của ô đang xem.
          Bỏ ghim thì chữ bám sát biểu tượng, và cụm biểu tượng–tên–chú thích
          đọc ra là MỘT khối.
          Đổi lại đáy các ô trong hàng sẽ so le đôi chút. Chấp nhận: khoảng
          cách dọc giữa các hàng đã đủ rộng để không ai nhầm hàng, còn việc chú
          thích dính đúng vào module của nó thì quan trọng hơn nhiều.
          Từ `sm` vẫn ghim hai dòng vì ô rộng, tên hiếm khi tràn. */}
      <span
        className={`${TYPE.appLabel} mt-2.5 flex w-full items-start justify-center break-words px-0.5 text-center text-slate-800 transition-colors duration-200 group-hover:text-slate-900 sm:mt-4 sm:min-h-[2.6em] sm:px-0`}
      >
        {mod.name}
      </span>

      {/* ⚠️ DÒNG CHÚ THÍCH QUAY LẠI — nhưng ở đúng hạng của nó.
          Tên App là từ vựng hiến định bằng tiếng Anh: "Merchandising",
          "Subcontract" — người chưa quen hệ thống không đoán được đó là bộ
          phận nào. Dòng tiếng Việt này là thứ khiến họ CHỌN ĐƯỢC.
          Nét thanh (300) và cỡ nhỏ (11–12px) nên nó đọc được mà không tranh
          chấp với tên. Ghim hai dòng để lưới không so le. */}
      {/* ═══ CHÚ THÍCH — HAI BẢN, MỘT VAI TRÒ ═══════════════════════════
          Điện thoại và máy tính dùng HAI câu khác nhau, không phải một câu bị
          cắt bớt.

          Ô trên điện thoại rộng khoảng 80px; ở cỡ chữ 11px nó chứa chừng bảy
          ký tự mỗi dòng. Câu đầy đủ "Điều hành và phê duyệt toàn nhà máy" sẽ
          trải thành NĂM dòng và biến lưới thành một bức tường chữ.

          ⚠️ Cắt chữ bằng `line-clamp` KHÔNG giải quyết được: cắt xong còn
          "Điều hành và…" thì mất đúng phần mang nghĩa, mà chú thích tồn tại
          chính là để người dùng HIỂU và CHỌN ĐƯỢC. Muốn ngắn mà vẫn hiểu thì
          phải VIẾT LẠI — nên có bản rút gọn 2–4 từ, dịch đủ ba ngôn ngữ. */}
      {/* `mt-0.5` — chú thích nép SÁT ngay dưới tên. Khoảng cách giữa tên và
          chú thích phải NHỎ HƠN hẳn khoảng cách giữa biểu tượng và tên, nếu
          không ba thứ đọc ra là ba mục rời chứ không phải một cụm. */}
      {/* ═══ 🔴 REV 2 — MỘT DÒNG, ⛔ KHÔNG PHẢI BA ═══════════════════════
          Board: *"Mỗi ô chỉ cần **Icon · Tên · 1 dòng mô tả ngắn**… ⛔ không
          hiển thị business value dài trên Homepage."*

          Bản trước ô mang **ba** dòng chữ *(tagline · mô tả · business
          value)*. Nhân với **22 ô** là **66 dòng** — mắt ⛔ không **quét**
          được nữa, nó phải **đọc**. Mà mục tiêu của Launcher là **quét trong
          hai giây**.

          ⚠️ `descKey` và `valueKey` **⛔ không bị xoá** — chúng nằm ở `title`,
          tức hiện khi **rê chuột**, đúng lúc người xem **đã dừng lại** ở một
          ô. Board: *"Business Value chỉ hiển thị khi hover."* */}
      <span
        className={`${TYPE.appHint} mt-1 flex w-full items-start justify-center px-0.5 text-center text-slate-500`}
      >
        {t(mod.shortKey)}
      </span>
    </>
  );

  // Không nền. Không viền. Không bóng trên vùng bấm. Vùng bấm vẫn phủ trọn cả
  // biểu tượng lẫn tên — người dùng chạm vào chữ cũng mở được App.
  const base = 'group flex flex-col items-center rounded-2xl p-2 focus-visible:outline-none';

  // ─── App CHƯA có route — Board `Q2`: hiện · khoá · gắn nhãn ─────────────
  //
  // 🔑 Dùng `<button disabled>`, ⛔ không dùng `<div>`. Người đi bằng bàn phím
  // và trình đọc màn hình phải **nghe được rằng nó bị khoá**; một `<div>` mờ đi
  // thì với họ nó đơn giản là ⛔ không tồn tại.
  //
  // `aria-disabled` + `disabled`: cái đầu để trình đọc màn hình đọc ra, cái sau
  // để trình duyệt ⛔ không cho bấm và ⛔ không đưa vào thứ tự Tab.
  // ⚠️ Rẽ nhánh trên `mod.status`, ⛔ **KHÔNG** trên `sapCo`.
  //
  // Hai vế **luôn cùng giá trị** — `modulePermissionState` trả `COMING_SOON`
  // đúng khi `mod.status === 'COMING_SOON'` — nhưng TypeScript ⛔ không biết
  // điều đó. Rẽ trên biến trung gian thì kiểu **⛔ không thu hẹp**, và nhánh
  // dưới mất `mod.href`; lối thoát duy nhất còn lại khi ấy là `as string` —
  // đúng phép ép kiểu mà `UI-1.2` đã bỏ đi.
  //
  // 🔑 Rẽ trên nguồn sự thật thì máy kiểm **chứng minh** `href` tồn tại, thay
  //    vì ta ép nó im lặng.
  if (mod.status === 'COMING_SOON') {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={`${base} cursor-not-allowed opacity-60`}
        title={`${chuThich}${duoiChuThich}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      // 🔑 ⛔ Không còn `as string`. Trong nhánh này TypeScript đã thu hẹp kiểu
      // về `ModuleReady`, nên `href` chắc chắn tồn tại — máy kiểm chứng minh
      // điều đó thay vì ta ép nó im lặng.
      href={mod.href}
      title={`${chuThich}${duoiChuThich}`}
      className={`${base} focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F7F9]`}
    >
      {inner}
    </Link>
  );
}
