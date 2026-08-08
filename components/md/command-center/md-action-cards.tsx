'use client';

// ============================================================================
// ACTION CENTER — dải thao tác nhanh, ĐỨNG NGAY DƯỚI ĐẦU TRANG
//
// Board Directive 07/08/2026 *(MD Home V2)* §2:
//   > *"Đây là khu vực thao tác nhanh … **⛔ Không được giấu trong menu. ⛔
//   > Không để cuối trang.**"*
//
// ─── 🔑 VÌ SAO ĐÂY ⛔ KHÔNG PHẢI BẢN SAO CỦA THANH TAB ───────────────────
// Thanh tab trả lời *"tôi muốn XEM khu nào"*. Dải này trả lời *"tôi muốn LÀM
// việc gì"* — hai câu khác nhau.
//
// ═══ 🔴 BOARD DIRECTIVE *MD UI VISUAL FIX* · 08/08/2026 ═══════════════════
//   > *"**BẮT BUỘC mỗi ô có màu nhận diện khác nhau.** PO → xanh dương ·
//   > Khách hàng → xanh lá · Chiết tính → tím · Định mức → cam · Tech Pack →
//   > xanh ngọc · Yêu cầu NPL → hồng/đỏ. **⛔ Không được để 6 ô cùng một màu
//   > xanh.**"*
//   > *"Mỗi card cần: **Icon · Tên chức năng · một dòng mô tả ngắn**. ⛔ Không
//   > nhồi nhiều text."*
//   > *"**XOÁ 2 TIÊU ĐỀ** … ⛔ không để lại khoảng trắng."*
//
// ─── ⚠️ MỘT MÂU THUẪN GIỮA HAI CHỈ THỊ, VÀ CÁCH GIẢI ───────────────────
// Chỉ thị hôm nay nói *"**Giữ 6 chức năng**"* rồi liệt kê đúng sáu. Nhưng
// `BUG-1` *(Board, 07/08/2026)* đã ra lệnh **thêm ba** — *Báo giá · Sản xuất ·
// Yêu cầu thay đổi* — kèm lý do đo được: ba nghiệp vụ ấy **⛔ không có lối vào
// trực tiếp nào khác**, và chỉ thị hôm nay cũng ghi *"**⛔ KHÔNG đổi
// navigation logic**"*.
//
// 🔑 Xoá ba thẻ đó là **cắt đường vào của ba nghiệp vụ** — tức đổi navigation,
// thứ chỉ thị hôm nay cấm. Nên: **sáu thẻ Board liệt kê dựng đúng theo ảnh
// mẫu** *(dải màu đầu thẻ, mỗi thẻ một sắc)*; **ba thẻ `BUG-1` xuống hàng
// phụ**, nhỏ và nhẹ hơn hẳn. ⛔ Không mất gì, và thứ bậc nói đúng sự thật:
// sáu việc chính, ba việc ⛔ không thường xuyên.
//
// ⚠️ Tệp này ⛔ **KHÔNG chứa một literal màu nào** — bánh cóc `TD-07`. Sắc lấy
// từ `SAC_O` ở `components/ui`, nơi chuỗi lớp viết **nguyên** *(ghép chuỗi ⇒
// Tailwind cắt mất ⇒ giao diện trắng trơn mà `next build` vẫn xanh)*.
// ============================================================================
import type { LucideIcon } from 'lucide-react';
import {
  FilePlus2, UserPlus, Calculator, Shirt, FileText, Boxes,
  FileQuestion, Factory, ClipboardList,
} from 'lucide-react';

import { TYPE, FONT_WEIGHT, LINE_HEIGHT } from '@/lib/design/typography';
import {
  SAC_O, theHanhDong, daiHanhDong, huyHanhDong, theLauncher, huyLauncher,
  type SacOKey,
} from '@/components/ui';

export interface HanhDongMd {
  taoPo: () => void;
  khachHang: () => void;
  chietTinh: () => void;
  dinhMuc: () => void;
  techPack: () => void;
  yeuCauNpl: () => void;
  // 🔴 BA HÀNH ĐỘNG THÊM 07/08/2026 — Board Decision `BUG-1`.
  baoGia: () => void;
  sanXuat: () => void;
  yeuCauThayDoi: () => void;
}

/** Thẻ hành động chính — dựng theo đúng ảnh mẫu Board gửi:
 *  dải màu đầu thẻ ⇒ huy hiệu tròn trắng ⇒ tiêu đề mang sắc ⇒ vạch ngắn ⇒
 *  **một** dòng mô tả ⇒ vạch đáy cùng sắc. */
function The({ nhan, phu, icon: Icon, sac, chay }: {
  nhan: string; phu: string; icon: LucideIcon; sac: SacOKey; chay: () => void;
}) {
  const s = SAC_O[sac];
  return (
    <button type="button" onClick={chay} className={theHanhDong(sac)}>
      <span className={daiHanhDong(sac)}>
        <span className={huyHanhDong(sac)}>
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </span>

      <span className="flex flex-col items-center gap-1 px-2 pb-2.5 pt-6 text-center">
        <span className={`block ${s.chu} ${TYPE.bodySm} ${FONT_WEIGHT.bold}`}>+ {nhan}</span>
        {/* Vạch ngắn dưới tiêu đề — chi tiết của ảnh mẫu, và nó có việc: tách
            *tên hành động* khỏi *lời giải thích* mà ⛔ không tốn một dòng. */}
        <span className={`block h-0.5 w-6 rounded-full ${s.vach}`} aria-hidden="true" />
        {/* ⚠️ **MỘT** dòng, ⛔ không hai — Board: *"⛔ Không nhồi nhiều text. ⛔
            Không để card quá cao."* `line-clamp-2` là **trần**, ⛔ không phải
            đích: câu ⛔ không được dài tới mức chạm nó. */}
        <span className={`line-clamp-2 text-slate-500 ${TYPE.caption} ${LINE_HEIGHT.snug}`}>{phu}</span>
      </span>

      <span className={`mt-auto block h-1 w-full ${s.vach}`} aria-hidden="true" />
    </button>
  );
}

/** Thẻ hành động **phụ** — ba việc của `BUG-1`. Dùng lại đúng khuôn thẻ
 *  Launcher: nhẹ hơn hẳn hàng trên nên thứ bậc đọc được ngay, mà vẫn có sắc
 *  định danh riêng như Board yêu cầu. */
function ThePhu({ nhan, phu, icon: Icon, sac, chay }: {
  nhan: string; phu: string; icon: LucideIcon; sac: SacOKey; chay: () => void;
}) {
  return (
    <button type="button" onClick={chay} className={`${theLauncher(sac)} !flex-row !items-center !gap-2.5 !text-left`}>
      <span className={huyLauncher(sac)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className={`block truncate text-slate-700 ${TYPE.caption} ${FONT_WEIGHT.semibold}`}>+ {nhan}</span>
        <span className={`block truncate text-slate-500 ${TYPE.caption}`}>{phu}</span>
      </span>
    </button>
  );
}

export default function MdActionCards({ hd }: { hd: HanhDongMd }) {
  return (
    // 🔴 *"XOÁ 2 TIÊU ĐỀ … ⛔ không để lại khoảng trắng."* `<h2>Bắt đầu việc
    // gì?</h2>` đã gỡ cùng `mb-2` của nó. `aria-label` giữ lại cho trình đọc
    // màn hình — gỡ chữ hiện hình ⛔ không có nghĩa là gỡ cả ngữ nghĩa.
    <section aria-label="Action Center" className="mb-4">
      {/* 🔴 SÁU THẺ CHÍNH — đúng sáu chức năng và đúng sáu sắc Board chỉ định.
          ⚠️ **Sáu cột chia hết cho sáu thẻ** ⇒ ⛔ không thẻ nào mồ côi cuối
          dòng. Điện thoại 2, bảng 3, máy bàn 6. */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <The nhan="Thêm PO" phu="Thêm đơn hàng mới" icon={FilePlus2} sac="blue" chay={hd.taoPo} />
        <The nhan="Thêm khách hàng" phu="Thêm khách hàng mới" icon={UserPlus} sac="emerald" chay={hd.khachHang} />
        <The nhan="Thêm chiết tính" phu="Tạo bảng chiết tính" icon={Calculator} sac="violet" chay={hd.chietTinh} />
        <The nhan="Thêm định mức" phu="Tạo mã hàng & BOM" icon={Shirt} sac="orange" chay={hd.dinhMuc} />
        <The nhan="Thêm Tech Pack" phu="Tạo hồ sơ kỹ thuật" icon={FileText} sac="teal" chay={hd.techPack} />
        <The nhan="Yêu cầu NPL" phu="Tạo yêu cầu nguyên phụ liệu" icon={Boxes} sac="rose" chay={hd.yeuCauNpl} />
      </div>

      {/* ═══ 🔴 BA HÀNH ĐỘNG CỦA `BUG-1` — HÀNG PHỤ ═══════════════════════
          > Board 07/08/2026: *"Chỉ bổ sung Action Center còn thiếu: **Báo giá ·
          > Sản xuất · Yêu cầu thay đổi**. Đảm bảo **tất cả nghiệp vụ đều đi
          > được** từ Action Center hoặc Business Launcher."*

          ⚠️ Ba nghiệp vụ này **⛔ KHÔNG có lối vào trực tiếp nào khác** — đo
          được: đối chiếu 13 tab với màn hình mặc định, `rfq` · `production` ·
          `changes` chỉ tới được qua ba cú bấm trong `More ▼`. Xoá ba thẻ này
          là hạ ba nghiệp vụ xuống hạng hai **vì bố cục**, ⛔ không vì nghiệp vụ.

          ⚠️ Chúng ⛔ KHÔNG lên Business Launcher: mọi ô Launcher mang **một con
          số**, còn *"Yêu cầu thay đổi"* nhét vào đó sẽ phải bịa ra một con số
          hoặc hiện ⚪ vĩnh viễn. Hai khối, hai câu hỏi — ⛔ không trộn. */}
      {/* ⚠️ `flex flex-wrap`, ⛔ KHÔNG `grid-cols-3`: lưới ba cột kéo mỗi thẻ ra
          ~420 px trên máy bàn, và một thẻ 420 px chứa đúng một biểu tượng với
          hai dòng chữ ngắn đọc ra là **ba mảng trống**. Thẻ phụ nên **co theo
          nội dung** — nó là việc phụ, và kích thước phải nói đúng điều đó. */}
      <div className="mt-2.5 flex flex-col flex-wrap gap-2.5 sm:flex-row">
        <ThePhu nhan="Báo giá" phu="Nhận yêu cầu từ khách" icon={FileQuestion} sac="sky" chay={hd.baoGia} />
        <ThePhu nhan="Sản xuất" phu="Lệnh sản xuất từ SAM" icon={Factory} sac="amber" chay={hd.sanXuat} />
        <ThePhu nhan="Yêu cầu thay đổi" phu="Khách đổi số lượng · ngày" icon={ClipboardList} sac="violet" chay={hd.yeuCauThayDoi} />
      </div>
    </section>
  );
}
