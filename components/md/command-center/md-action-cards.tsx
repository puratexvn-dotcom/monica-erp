'use client';

// ============================================================================
// ACTION CENTER — dải thao tác nhanh, ĐỨNG NGAY DƯỚI ĐẦU TRANG
//
// Board Directive 07/08/2026 *(MD Home V2)* §2:
//
//   > *"Đây là khu vực thao tác nhanh … **⛔ Không được giấu trong menu. ⛔
//   > Không để cuối trang.**"*
//
// Sáu nút, **đúng thứ tự Board khai**:
//   Tạo PO · Khách hàng · Chiết tính · Định mức · Tech Pack · Yêu cầu NPL
//
// ─── 🔑 VÌ SAO ĐÂY ⛔ KHÔNG PHẢI BẢN SAO CỦA THANH TAB ───────────────────
// Thanh tab trả lời *"tôi muốn XEM khu nào"*. Dải này trả lời *"tôi muốn LÀM
// việc gì"* — hai câu khác nhau. Vào tab *"Khách hàng"* rồi còn phải tìm nút
// *"Thêm khách hàng"* là **hai cú bấm cho một ý định**.
//
// ⚠️ Mỗi nút phải dẫn tới **một hành động có thật**. Một nút mở ra chỗ ⛔ không
// tồn tại là *"lời nói dối của giao diện"*.
//
// ⚠️ Màu/lớp thẻ từ `components/ui`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import type { LucideIcon } from 'lucide-react';
import {
  FilePlus2, UserPlus, Calculator, Shirt, FileText, Boxes,
  FileQuestion, Factory, ClipboardList,
} from 'lucide-react';

import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { SAC_NHOM, theHanhDongChinh, huyHieuTheChinh, chuPhuTheChinh } from '@/components/ui';

export interface HanhDongMd {
  taoPo: () => void;
  khachHang: () => void;
  chietTinh: () => void;
  dinhMuc: () => void;
  techPack: () => void;
  yeuCauNpl: () => void;
  // 🔴 BA HÀNH ĐỘNG THÊM 07/08/2026 — Board Decision `BUG-1`. Xem khối chú
  // thích ngay trên chỗ dựng chúng ở cuối tệp.
  baoGia: () => void;
  sanXuat: () => void;
  yeuCauThayDoi: () => void;
}

// 🔴 Board §12: *"Các nút tạo mới: **⛔ Không dùng button trắng.** Phải nổi
// bật. Có icon. Có màu."* — sắc **Action = xanh dương**.
// Thẻ PHỤ: viền nhạt, **nền trắng** — nhẹ hơn thẻ chính một bậc để mắt phân
// biệt được ngay mà ⛔ không cần đọc nhãn.
// 🔴 Board *MD V5.1* §1: *"Chiếm quá nhiều chiều cao. Giảm ~30%. Mỗi card chỉ
// giữ icon · tiêu đề · 1 dòng mô tả. ⛔ Không cần nhiều khoảng trắng."*
//
// ─── 🔑 XẾP NGANG, ⛔ KHÔNG XẾP DỌC ─────────────────────────────────────
// Bản trước xếp **dọc**: biểu tượng một dòng, tên một dòng, mô tả một dòng ⇒
// ba tầng chồng lên nhau. Xếp **ngang** *(biểu tượng ⟷ chữ)* bỏ được nguyên
// một tầng mà ⛔ không mất thông tin nào — đúng nghĩa *"giảm chiều cao"*, ⛔
// không phải *"cắt nội dung"*.
//
// ⚠️ `truncate` ở dòng mô tả: ô hẹp thì cắt bằng dấu ba chấm, ⛔ KHÔNG xuống
// dòng. Một thẻ xuống dòng làm cả hàng sáu thẻ cao theo — đúng thứ đang sửa.
const the =
  `group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition ` +
  `hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 ` +
  SAC_NHOM.action.tuongTac;

function The({ nhan, phu, icon: Icon, chay }: {
  nhan: string; phu: string; icon: LucideIcon; chay: () => void;
}) {
  return (
    <button type="button" onClick={chay} className={the}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${SAC_NHOM.action.huy} group-hover:scale-105`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className={`block truncate text-slate-800 ${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>+ {nhan}</span>
        <span className={`block truncate text-slate-500 ${TYPE.caption}`}>{phu}</span>
      </span>
    </button>
  );
}

export default function MdActionCards({ hd }: { hd: HanhDongMd }) {
  return (
    <section aria-label="Action Center" className="mb-4">
      <h2 className={`mb-2 text-slate-500 ${TYPE.overline}`}>Bắt đầu việc gì?</h2>

      {/* 🔴 MỘT PRIMARY, NĂM SECONDARY — Board §3: *"+ Tạo PO nổi bật nhất."*
          🔑 Sáu nút **cùng cỡ, cùng màu** là sáu nút **⛔ không nút nào nổi**.
          Người dùng phải đọc cả sáu nhãn mới chọn được — đó là thuế nhận thức
          trả cho một quyết định mà 80% thời gian đã biết trước câu trả lời. */}
      {/* 🔴 **NĂM cột, HAI hàng** — đổi 07/08/2026 theo `BUG-1`.
          Bản trước là `lg:grid-cols-7`: thẻ chính chiếm 2 ô ⇒ 2 + 5 = 7 khít
          **một** hàng. Nay có **tám** thẻ phụ ⇒ 2 + 8 = **10** ô = đúng **hai**
          hàng năm cột, ⛔ không thẻ nào mồ côi ở cuối dòng.
          ⚠️ Giữ `grid-cols-7` mà nhét 10 ô sẽ ra 7 + 3 — hàng dưới trống bốn ô,
          nhìn như dải bị vỡ. Số cột phải chia hết tổng số ô, ⛔ không phải chọn
          cho đẹp rồi hy vọng. */}
      {/* §10: khe 3 ⇒ 2.5. Thêm một hàng là thêm ~46 px — đó là **cái giá đã
          biết** của việc đưa đủ nghiệp vụ lên mặt trước, ⛔ không phải phình
          ngoài ý muốn. */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <button
          type="button"
          onClick={hd.taoPo}
          // 🔴 Board *MD V5* §6: *"+ Tạo PO phải LỚN NHẤT. Màu nổi bật nhất."*
          //
          // ⚠️ ĐỔI TỪ NỀN NHẠT SANG **NỀN ĐẶC**. Bản trước dùng `bg-blue-50` —
          // trên ảnh chụp Board gửi, thẻ chính nhạt gần bằng năm thẻ trắng bên
          // cạnh, nên *"nổi bật nhất"* chỉ đúng trên giấy. Nền đặc + chữ trắng
          // là thứ duy nhất trên màn hình này, nên ⛔ không thể nhầm.
          //
          // ⚠️ Lớp lấy từ `components/ui`, ⛔ không viết màu thẳng — bánh cóc
          // `TD-07` đã bắt đúng lần đầu tôi viết `bg-blue-600` ở đây.
          className={theHanhDongChinh}
        >
          <span className={huyHieuTheChinh}>
            <FilePlus2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className={`block text-white ${TYPE.cardTitle} ${FONT_WEIGHT.bold}`}>+ Tạo PO</span>
            <span className={`block ${chuPhuTheChinh} ${TYPE.caption}`}>đơn hàng mới — việc chính của MD</span>
          </span>
        </button>

        <The nhan="Khách hàng" phu="thêm vào danh mục" icon={UserPlus} chay={hd.khachHang} />
        <The nhan="Báo giá" phu="nhận yêu cầu từ khách" icon={FileQuestion} chay={hd.baoGia} />
        <The nhan="Chiết tính" phu="tích công đoạn ⇒ giá" icon={Calculator} chay={hd.chietTinh} />
        <The nhan="Định mức" phu="mã hàng · BOM" icon={Shirt} chay={hd.dinhMuc} />
        <The nhan="Tech Pack" phu="tài liệu kỹ thuật" icon={FileText} chay={hd.techPack} />
        <The nhan="Yêu cầu NPL" phu="đề nghị mua vật tư" icon={Boxes} chay={hd.yeuCauNpl} />
        <The nhan="Sản xuất" phu="lệnh sản xuất từ SAM" icon={Factory} chay={hd.sanXuat} />
        <The nhan="Yêu cầu thay đổi" phu="khách đổi số lượng · ngày" icon={ClipboardList} chay={hd.yeuCauThayDoi} />
      </div>

      {/* ═══ 🔴 BUG-1 · BA HÀNH ĐỘNG BỔ SUNG · Board Decision 07/08/2026 ═════
          > *"Chỉ bổ sung Action Center còn thiếu: **Báo giá · Sản xuất · Yêu
          > cầu thay đổi**. Đảm bảo **tất cả nghiệp vụ đều đi được** từ Action
          > Center hoặc Business Launcher. **⛔ Không được tạo thêm thanh điều
          > hướng mới.**"*

          ─── ⚠️ LỖ HỔNG ĐANG VÁ, ĐO ĐƯỢC ────────────────────────────────
          Sau `V5`, màn hình mặc định bày **10 ô Launcher + 6 thẻ hành động**.
          Đối chiếu với **13 tab** nghiệp vụ, **ba tab ⛔ KHÔNG có lối vào trực
          tiếp nào**: `rfq` · `production` · `changes`. Tới được thì vẫn tới —
          nhưng phải **ba cú bấm** qua `More ▼`, tức là ba nghiệp vụ bị hạ cấp
          xuống hạng hai chỉ vì bố cục, ⛔ không vì nghiệp vụ.

          🔑 **Vá ở ĐÂY chứ ⛔ không khôi phục 13 tab**, và ⛔ không thêm thanh
          điều hướng: Board đã bác cả hai. Action Center trả lời *"tôi muốn LÀM
          gì"* — thêm ba việc vào một danh sách việc là **đúng chỗ**, còn thêm
          một thanh nữa là đúng thứ Board cấm.

          ⚠️ **Ba nghiệp vụ này ⛔ KHÔNG lên Business Launcher.** Launcher trả
          lời *"tôi có bao nhiêu X"* và mọi ô của nó đều mang **một con số**;
          *"Yêu cầu thay đổi"* nhét vào đó sẽ phải bịa ra một con số, hoặc hiện
          ⚪ vĩnh viễn. Hai khối, hai câu hỏi — ⛔ không trộn.

          ⚠️ Mỗi nút mở **đúng chỗ làm việc đó**, ⛔ không chỉ đổi tab rồi để
          người dùng tự tìm nút — xem `hanhDong` ở `md-client.tsx`. */}
    </section>
  );
}
