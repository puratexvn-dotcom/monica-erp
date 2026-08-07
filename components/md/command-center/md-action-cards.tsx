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
import { FilePlus2, UserPlus, Calculator, Shirt, FileText, Boxes } from 'lucide-react';

import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { SAC_NHOM } from '@/components/ui';

export interface HanhDongMd {
  taoPo: () => void;
  khachHang: () => void;
  chietTinh: () => void;
  dinhMuc: () => void;
  techPack: () => void;
  yeuCauNpl: () => void;
}

// 🔴 Board §12: *"Các nút tạo mới: **⛔ Không dùng button trắng.** Phải nổi
// bật. Có icon. Có màu."* — sắc **Action = xanh dương**.
// Thẻ PHỤ: viền nhạt, **nền trắng** — nhẹ hơn thẻ chính một bậc để mắt phân
// biệt được ngay mà ⛔ không cần đọc nhãn.
const the =
  `group flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition ` +
  `hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 ` +
  SAC_NHOM.action.tuongTac;

function The({ nhan, phu, icon: Icon, chay }: {
  nhan: string; phu: string; icon: LucideIcon; chay: () => void;
}) {
  return (
    <button type="button" onClick={chay} className={the}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${SAC_NHOM.action.huy} group-hover:scale-105`}>
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className={`block text-slate-800 ${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>+ {nhan}</span>
        <span className={`block text-slate-500 ${TYPE.caption}`}>{phu}</span>
      </span>
    </button>
  );
}

export default function MdActionCards({ hd }: { hd: HanhDongMd }) {
  return (
    <section aria-label="Action Center" className="mb-5">
      <h2 className={`mb-2.5 text-slate-700 ${TYPE.overline}`}>Bắt đầu việc gì?</h2>

      {/* 🔴 MỘT PRIMARY, NĂM SECONDARY — Board §3: *"+ Tạo PO nổi bật nhất."*
          🔑 Sáu nút **cùng cỡ, cùng màu** là sáu nút **⛔ không nút nào nổi**.
          Người dùng phải đọc cả sáu nhãn mới chọn được — đó là thuế nhận thức
          trả cho một quyết định mà 80% thời gian đã biết trước câu trả lời. */}
      {/* ⚠️ **BẢY** cột, ⛔ không phải sáu: thẻ chính chiếm 2 ô ⇒ 2 + 5 = 7 vừa
          khít một hàng. Để `grid-cols-6` thì ô thứ sáu bị đẩy xuống dòng riêng
          và dải trông như bị vỡ. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <button
          type="button"
          onClick={hd.taoPo}
          className={
            'group col-span-2 flex items-center gap-3 rounded-2xl border p-4 text-left transition ' +
            `${SAC_NHOM.action.vien} ${SAC_NHOM.action.nen} ` +
            'hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 ' +
            SAC_NHOM.action.tuongTac
          }
        >
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${SAC_NHOM.action.huy} group-hover:scale-105`}>
            <FilePlus2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className={`block ${SAC_NHOM.action.chu} ${TYPE.body} ${FONT_WEIGHT.bold}`}>+ Tạo PO</span>
            <span className={`block text-slate-500 ${TYPE.caption}`}>đơn hàng mới — việc chính của MD</span>
          </span>
        </button>

        <The nhan="Khách hàng" phu="thêm vào danh mục" icon={UserPlus} chay={hd.khachHang} />
        <The nhan="Chiết tính" phu="tích công đoạn ⇒ giá" icon={Calculator} chay={hd.chietTinh} />
        <The nhan="Định mức" phu="mã hàng · BOM" icon={Shirt} chay={hd.dinhMuc} />
        <The nhan="Tech Pack" phu="tài liệu kỹ thuật" icon={FileText} chay={hd.techPack} />
        <The nhan="Yêu cầu NPL" phu="đề nghị mua vật tư" icon={Boxes} chay={hd.yeuCauNpl} />
      </div>
    </section>
  );
}
