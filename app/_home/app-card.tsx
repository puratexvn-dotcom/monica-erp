'use client';

import Link from 'next/link';
import { Lock, Check } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { ModuleItem } from '../home-modules';
import type { PermissionState } from '@/lib/mos/capability/visible-modules';
import type { LiveStateOrNull } from '@/lib/mos/registry/live-state';
import { MODULE_SURFACE, STATUS, moduleGlow } from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';
import { useLanguage } from '@/lib/i18n';

// ============================================================================
// BUSINESS APP — KHÔNG CÒN KHUNG. BIỂU TƯỢNG · TÊN · MỘT DÒNG MÔ TẢ.
//
// ═══ 🔴 BA THÀNH PHẦN, ⛔ KHÔNG BỐN — Board Rev 2, tái khẳng định Rev 6 ═══
// *"Chỉ giữ: Icon · Tên · Một dòng mô tả ngắn. ⛔ Không thêm bất kỳ nội dung
// nào khác lên Homepage."*
//
// Ô này dựng **đúng ba thứ đó và ⛔ không gì khác** — `mod.name` và
// `t(mod.shortKey)`. Ba thứ khác **cố ý ⛔ KHÔNG lên ô**, chúng nằm ở `title`
// tức chỉ hiện khi người xem **đã dừng lại**: `descKey` *(câu chức năng đầy
// đủ)* · `valueKey` *(business value)* · câu giải thích vì sao ô ⛔ không mở
// được. 🔑 Nhân một câu với 22 ô là 22 dòng chữ — mắt thôi **quét** và phải
// **đọc**, mà quét-trong-hai-giây chính là lý do Launcher tồn tại.
//
// ⚠️ Ghi chú cũ ở đây viết *"BIỂU TƯỢNG VÀ TÊN, HẾT"* và *"Câu mô tả chuyển
// vào thuộc tính `title`… ⛔ không còn chiếm chỗ trên lưới"*. **SAI** — dòng
// mô tả ngắn ĐÃ quay lại từ Rev 2 *(xem cuối tệp)* và Board Rev 6 **yêu cầu
// giữ nó**. Sửa 06/08/2026, ⛔ đừng đọc ghi chú cũ rồi đi xoá dòng đó.
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
//   • TO HẲN LÊN            đủ sức làm mỏ neo một mình. ⚠️ Từ Rev 6 cỡ ô
//                           **co theo cột**, ⛔ không còn con số cứng nào —
//                           trần 164px, sàn do bề rộng cột quyết định
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
// ⚠️ Chỉ câu mô tả **ĐẦY ĐỦ** ở trong `title`. Câu **RÚT GỌN** (`shortKey`)
// vẫn dựng ra dưới tên — xem khối `Rev 2` ở cuối tệp để biết vì sao hai câu
// khác nhau chứ ⛔ không phải một câu bị cắt.
// ============================================================================

/** Bốn màu chấm sống — lấy từ THẺ TRẠNG THÁI, ⛔ không viết màu thẳng.
 *
 *  ⚠️ Bản nháp đầu tôi viết `bg-emerald-600` ngay tại đây và **bánh cóc màu bắt
 *  ngay** *(nợ 106 → 107)*. Đúng thứ nó sinh ra để chặn: bốn màu này nói về
 *  **TRẠNG THÁI**, mà trạng thái thì đã có thẻ riêng — dùng lại thì đổi một
 *  lần là đổi khắp nơi, viết thẳng thì mỗi chỗ trôi một kiểu.
 *
 *  🔑 Và nó khớp **đúng ngữ nghĩa**: chấm trên trang chủ với chip trạng thái
 *  trong Workspace nay **cùng một màu cho cùng một ý**. */
const MAU_SONG: Record<NonNullable<LiveStateOrNull>, string> = {
  normal: STATUS.healthy.dot,
  attention: STATUS.warning.dot,
  action: STATUS.critical.dot,
  update: STATUS.inProgress.dot,
};

export default function AppCard({
  mod,
  state,
  live = null,
}: {
  mod: ModuleItem;
  /** Trạng thái quyền của ô với NGƯỜI ĐANG XEM — `UI-3` · ADR-022. */
  state: PermissionState;
  /**
   * Mức sống của App — `Rev 3`. `null`/bỏ trống ⇒ **⛔ không có chấm**.
   *
   * ⚠️ Ô này **⛔ không tự quyết** có được hiện chấm hay không. Cổng quyền
   * nằm ở `docMucSong()` phía máy chủ *(`LS-1`)*, nơi dữ liệu của App mà
   * người xem ⛔ không mở được **⛔ chưa từng bị đọc**. Lọc ở đây thì đã
   * muộn: dữ liệu **đã rời khỏi CSDL** và đã qua ranh giới mạng.
   */
  live?: LiveStateOrNull;
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

  // ═══ 🔴 REV 6 — QUẦNG SÁNG MANG MÀU CỦA CHÍNH APP ══════════════════════
  //
  // 🔴 **VÀ NÓ SỬA MỘT LỖI THẬT, ⛔ không phải chuyện thẩm mỹ.**
  // Bản trước dán **BỐN** lớp cùng khai `box-shadow` lên một thẻ: `GLASS` ·
  // `GLASS_GLOW` · `iconShadow` · `iconShadowHover`. Cả bốn đều biên dịch ra
  // `--tw-shadow`, nên chúng **⛔ không cộng vào nhau** — lớp nào đứng sau
  // trong tệp CSS đã dựng thì **thắng tuyệt đối**, ba lớp còn lại bị **vứt
  // sạch**. Tức ô Launcher xưa nay chỉ hiện **một** trong bốn hiệu ứng, và
  // ⛔ không ai chọn nó — thứ tự sinh CSS của Tailwind chọn hộ.
  //
  // ⇒ Nay **MỘT khai báo cho mỗi trạng thái**, ba lớp gộp trong cùng một
  // chuỗi: ① vệt sáng mép trên *(bề mặt)* ② bóng tiếp xúc *(vật chạm mặt
  // phẳng)* ③ **quầng màu toả rộng** *(vật phát sáng)*.
  //
  // 🔑 Màu của ③ đi qua **biến CSS** `--tile-glow`, đặt bằng `style` ngay dưới.
  // Lớp Tailwind vì vậy vẫn là **chuỗi nguyên vẹn**, ⛔ không ghép — đúng luật
  // ② của `tokens.ts`, nên bộ quét ⛔ không thể cắt mất ở bản dựng thật.
  const tileShadow =
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_5px_-1px_rgba(16,24,40,0.16),0_16px_30px_-10px_var(--tile-glow)]';
  const tileShadowHover =
    'group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_5px_12px_-2px_rgba(16,24,40,0.18),0_28px_50px_-12px_var(--tile-glow-strong)]';

  // ⚠️ Khai kiểu tường minh thay vì `as` — `any` bị arch test chặn, mà thuộc
  // tính tuỳ biến `--*` thì `CSSProperties` chuẩn ⛔ không biết tới.
  // 🔴 Board Directive 06/08/2026 — ô KHOÁ hạ quầng sáng xuống **ngang mức ô
  // ⛔ chưa được cấp quyền**. Đây là vế *"subtle visual treatment"*: ô vẫn
  // **giữ nguyên màu định danh** *(Điều 44.6 — màu là THÔNG TIN)*, chỉ **bớt
  // phát sáng**. Người dùng vẫn đọc ra *"đây là Kho"*, chỉ ⛔ không đọc ra
  // *"bấm được"*.
  const lamMo = khongQuyen || sapCo;

  const glowVars: CSSProperties & Record<'--tile-glow' | '--tile-glow-strong', string> = {
    '--tile-glow': moduleGlow(mod.key, lamMo ? 0.18 : 0.42),
    '--tile-glow-strong': moduleGlow(mod.key, lamMo ? 0.3 : 0.62),
  };

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
    state === 'COMING_SOON' ? `\n${t('home.lockedHint')}`
    : state === 'UNAUTHORIZED' ? `\n${t('home.noAccessHint')}`
    : state === 'ANONYMOUS' ? `\n${t('home.signInHint')}`
    : '';

  const inner = (
    <>
      {/* 🔑 Bề rộng khai ở **hộp bọc**, ⛔ không ở ô.
          Hộp bọc là một `flex item` dưới `items-center`, nên bề rộng của nó
          **co theo nội dung**. Đặt `w-full` cho ô mà ⛔ không cho hộp bọc thì
          `100%` đang trỏ vào một bề rộng chính nó phải suy ra từ ô — vòng
          tròn, và trình duyệt sẽ rơi về cỡ nội dung *(24px của `<svg>`)*.
          Khai ở hộp bọc thì `100%` có một con số thật để bám vào. */}
      <span className="relative w-full max-w-[164px]">
        {/* rounded-[28%] — tỷ lệ bo góc của biểu tượng điện thoại. Dùng giá trị
            phần trăm để góc bo giãn theo kích thước ô ở từng khổ màn, giữ đúng
            dáng ở mọi cỡ. */}
        {/* ═══ 🔴 REV 6 — Ô CO THEO CỘT, ⛔ KHÔNG CÒN CỠ CỨNG ═════════════
            Bản trước khai cứng `96px` ở điện thoại và `164px` từ `sm`. Cỡ
            cứng ⛔ **không bao giờ biết cột rộng bao nhiêu**, và hậu quả đo
            được ở hai khổ:

              390px · 4 cột  ⇒ lòng ô **69px**, ô vẽ **96px**  → TRÀN 27px
              640px · 4 cột  ⇒ lòng ô **120px**, ô vẽ **164px** → TRÀN 44px

            Tràn thì lưới bị đẩy phình, khe hai bên bị nuốt, và trang đọc ra
            **chật** — đúng triệu chứng Board mô tả. 🔑 Đây là **lỗi bố cục
            thật**, ⛔ không phải chuyện thẩm mỹ.

            ⇒ `w-full` + `aspect-square` + `max-w-[164px]`:
              • ô **luôn vừa cột** ⇒ ⛔ **không thể** tràn ở bất kỳ khổ nào
              • điện thoại 3 cột ⇒ ~98px *(cũ 96px nhưng đang tràn)*
              • màn rộng vẫn dừng ở **164px** — ⛔ không phình vô hạn khi cột
                giãn tới 244px

            🔑 Cách này thay **hai mốc rời rạc** bằng **một đường liên tục**:
            mọi bề ngang màn hình, kể cả các khổ ⛔ chưa ai thử, đều có ô đúng
            tỷ lệ. Khai thêm mốc `md:` `lg:` chỉ vá được đúng khổ đã nghĩ ra.

            `rounded-[28%]` — bo góc theo PHẦN TRĂM nên dáng góc giữ nguyên ở
            mọi cỡ, đúng tỷ lệ biểu tượng điện thoại. */}
        <span
          style={glowVars}
          className={`flex aspect-square w-full items-center justify-center rounded-[28%] transition-[transform,box-shadow,opacity] duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.06] group-active:scale-95 group-active:duration-75 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100 ${sf.tileStrong} ${tileShadow} ${tileShadowHover} ${khongQuyen ? 'opacity-50 group-hover:opacity-80' : sapCo ? 'opacity-50' : ''}`}
        >
          {/* ═══ 🔴 REV 6 — NÉT VẼ TO HƠN VÀ DÀY HƠN ════════════════════
              Board: *"Icon lớn hơn"* · *"sắc nét"*.

              `48% → 54%` bề ngang ô, và nét `1.75 → 2`.

              🔑 Hai con số này đi **cùng nhau, ⛔ không tách**. Phóng to một
              nét mảnh chỉ cho ra một hình **loãng hơn** — nét giữ nguyên độ
              dày trong khi khoảng trống quanh nó nở ra, nên biểu tượng càng
              to càng **nhạt đi**. Dày thêm 0,25 giữ đúng **tỷ trọng mực trên
              ô**, và đó mới là thứ mắt đọc ra là *"sắc nét"*.

              ⚠️ Vẫn dừng ở 54%: `rounded-[28%]` cắt góc ô khá sâu, nên biểu
              tượng vuông vượt quá ~56% sẽ **chạm vào phần bo góc**.

              `h-auto` để ghi đè thuộc tính `height="24"` mà lucide đặt sẵn
              trên thẻ `<svg>`; thiếu nó thì bề ngang co còn bề cao đứng yên
              và biểu tượng bị **kéo dẹt**. */}
          <Icon className="h-auto w-[54%]" strokeWidth={2} aria-hidden="true" />
        </span>

        {/* ═══ 🔴 TRẠNG THÁI KHOÁ — Board Directive 06/08/2026 ══════════════
            Board **đảo lại** quyết định trước đó: ⛔ **không tách, ⛔ không ẩn**
            App chưa mở. Chúng **giữ nguyên vị trí** trong lưới, và nhãn *"Sắp
            có"* được thay bằng **ổ khoá**.

            🔑 **Vì sao đổi chữ, ⛔ không chỉ đổi hình.** Board nói rõ ý nghĩa:
            *"The lock indicates capability that **exists** within the MONICA
            ONE ecosystem but is **not yet enabled**, rather than functionality
            that **does not exist**."*

            Chữ cũ ⛔ nói ngược lại điều đó: `comingSoonHint` = *"chưa mở, **đang
            xây dựng**"* — tức *"thứ này CHƯA TỒN TẠI"*. Giữ ổ khoá mà giữ luôn
            câu ấy thì hình mới nói một đằng, chữ cũ nói một nẻo. ⇒ khoá mới
            `home.locked` · `home.lockedHint`.

            ⚠️ `home.comingSoon` · `home.comingSoonHint` **GIỮ NGUYÊN** ở cả ba
            tệp dịch *(ràng buộc ② — ⛔ không xoá chữ cũ, chỉ thôi dựng)*. Từ bản
            này chúng **⛔ không còn nơi nào dựng** — kho chữ nằm chờ, ⛔ không
            phải chữ đang sống.

            ─── 🔑 HAI Ổ KHOÁ, HAI LÝ DO, ⛔ KHÔNG ĐƯỢC LẪN ─────────────────
            Ô này và ô `UNAUTHORIZED` bên dưới nay **cùng dùng một hình ổ khoá**
            — đó là chủ ý của Board *(một ngôn ngữ "khoá" duy nhất)*. Nhưng
            ADR-022 §2.2 đòi giao diện phải **NÓI RA** người dùng đang gặp lý do
            nào; hai ô khoá trông giống hệt mà ⛔ không nói gì thì đúng là *"lời
            nói dối của giao diện"* mà ADR-017 cảnh báo.

            ⇒ Hình **giống nhau**, chữ **khác nhau**, và chữ đi cả vào `title`
            lẫn `sr-only`:
              · chưa kích hoạt cho doanh nghiệp → `home.locked`
              · đã đăng nhập, ⛔ chưa được cấp quyền → `home.noAccess`

            Hai trạng thái ⛔ không bao giờ chồng nhau *(cùng một góc, và
            `COMING_SOON` xét TRƯỚC phiên đăng nhập)*. */}
        {/* ✓ App đã hoàn thiện — Board Directive 06/08/2026. Cùng khuôn huy
            hiệu với ổ khoá, đổi màu và đổi hình: xanh lá = mở được. */}
        {moDuoc && !khongQuyen && (
          <span
            className={`absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full shadow-[0_1px_3px_rgba(16,24,40,0.16)] ring-1 sm:-right-1.5 sm:-top-1.5 sm:h-6 sm:w-6 ${STATUS.healthy.chip}`}
            title={t('home.ready')}
          >
            <Check className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" strokeWidth={3} aria-hidden="true" />
            <span className="sr-only">{t('home.ready')}</span>
          </span>
        )}

        {!moDuoc && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_1px_3px_rgba(16,24,40,0.16)] ring-1 ring-slate-200 sm:-right-1.5 sm:-top-1.5 sm:h-6 sm:w-6"
            title={t('home.lockedHint')}
          >
            <Lock className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" strokeWidth={2.4} aria-hidden="true" />
            {/* Trình đọc màn hình phải NGHE được điều mắt thấy — ⛔ không có
                dòng này, mười hai App khoá trở thành ⛔ không phân biệt được
                với mười hai App đang chạy. */}
            <span className="sr-only">{t('home.locked')}</span>
          </span>
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

        {/* 🔴 REV 3 — CHẤM SỐNG. Board: *"Chỉ MỘT CHẤM MÀU là đủ."*

            ⚠️ MỘT CHẤM, ⛔ KHÔNG PHẢI MỘT CON SỐ. Chấm nói *"có việc"* và
            CHỈ ĐƯỜNG; con số nói *"47 việc"* và bắt người dùng ĐỌC rồi SUY
            — lúc đó trang chủ đã thành Dashboard, thứ §2 phủ nhận ba lần.
            Ranh giới nằm đúng ở đây (LS-2).

            🔑 Chấm chỉ tới được đây khi docMucSong() đã cho qua cổng quyền.
            Ô ⛔ KHÔNG tự quyết — và đó là lý do một chấm đỏ trên ô Kho ⛔
            không bao giờ lọt ra mắt khách. */}
        {live && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white sm:-bottom-1 sm:-right-1 sm:h-4 sm:w-4 ${MAU_SONG[live]}`}
            title={t(`liveState.${live}` as never)}
          >
            <span className="sr-only">{t(`liveState.${live}` as never)}</span>
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
        // 🔴 ĐÃ BỎ `opacity-60` trên TOÀN nút — Board Directive 06/08/2026.
        //
        // Hai lý do, và lý do thứ hai là lỗi thật:
        // ① *"Subtle"* — làm mờ cả ô 40% là **nhấn mạnh** trạng thái khoá, đúng
        //    thứ Board bảo thôi nhấn mạnh. Nay chỉ **biểu tượng** hạ độ mờ, y
        //    hệt ô ⛔ chưa được cấp quyền.
        // ② 🔴 **`LI-3`**: *"độ mờ chỉ đặt lên BIỂU TƯỢNG, ⛔ không đặt lên
        //    chữ"* — chữ giữ nguyên màu thì tương phản 4,5:1 được giữ **theo
        //    cấu trúc**. `opacity-60` trên nút kéo mờ **cả tên App lẫn dòng mô
        //    tả**, tức mười hai ô đang nằm dưới ngưỡng tương phản. Nhánh
        //    `UNAUTHORIZED` xưa nay vẫn làm đúng; chỉ nhánh này lệch.
        className={`${base} cursor-not-allowed`}
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
      // 🔴 TẮT PREFETCH — 07/08/2026, sửa sau khi ĐO.
      //
      // Next.js mặc định **nạp trước** mọi `<Link>` lọt vào khung nhìn. Trang
      // chủ có tới 15 thẻ App ⇒ mở trang là bắn **15 request `?_rsc=`** cùng
      // lúc. Mỗi request đó:
      //   ① đi qua `middleware.ts` ⇒ **một lượt đi–về mạng tới Supabase Auth**
      //   ② dựng cả một trang Workspace ở máy chủ ⇒ truy vấn CSDL thật
      //
      // Đo được (CPU×4, 4G, cache rỗng): bốn tệp lâu nhất của trang chủ đều là
      // prefetch — `subcon 904ms` · `giam-doc 805ms` · `md 776ms` ·
      // `admin 591ms`. Chúng **giành băng thông và CPU máy chủ** với chính
      // trang người dùng đang chờ.
      //
      // 🔑 Người dùng mở trang chủ để bấm **MỘT** App, ⛔ không phải mười lăm.
      // Nạp trước 15 Workspace là trả giá cho 14 lần đoán sai.
      //
      // ⚠️ ⛔ KHÔNG mất gì về chức năng: `prefetch={false}` vẫn nạp khi **rê
      // chuột** lên thẻ, nên cú bấm thật vẫn nhanh như cũ.
      prefetch={false}
      title={`${chuThich}${duoiChuThich}`}
      className={`${base} focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F7F9]`}
    >
      {inner}
    </Link>
  );
}
