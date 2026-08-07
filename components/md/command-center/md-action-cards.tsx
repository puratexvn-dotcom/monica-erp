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
import { theBamDuoc, huyHieuThe } from '@/components/ui';

export interface HanhDongMd {
  taoPo: () => void;
  khachHang: () => void;
  chietTinh: () => void;
  dinhMuc: () => void;
  techPack: () => void;
  yeuCauNpl: () => void;
}

const the = `group flex flex-col items-start gap-2.5 p-4 ${theBamDuoc}`;

function The({ nhan, phu, icon: Icon, chay }: {
  nhan: string; phu: string; icon: LucideIcon; chay: () => void;
}) {
  return (
    <button type="button" onClick={chay} className={the}>
      <span className={`${huyHieuThe} h-10 w-10`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className={`block text-slate-900 ${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>+ {nhan}</span>
        <span className={`block text-slate-500 ${TYPE.caption}`}>{phu}</span>
      </span>
    </button>
  );
}

export default function MdActionCards({ hd }: { hd: HanhDongMd }) {
  return (
    <section aria-label="Action Center" className="mb-5">
      <h2 className={`mb-2.5 text-slate-700 ${TYPE.overline}`}>Bắt đầu việc gì?</h2>
      {/* Sáu ô — điện thoại 2, bảng 3, máy bàn 6. ⛔ Không để xuống dòng lẻ. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <The nhan="Tạo PO" phu="đơn hàng mới" icon={FilePlus2} chay={hd.taoPo} />
        <The nhan="Khách hàng" phu="thêm vào danh mục" icon={UserPlus} chay={hd.khachHang} />
        <The nhan="Chiết tính" phu="tích công đoạn ⇒ giá" icon={Calculator} chay={hd.chietTinh} />
        <The nhan="Định mức" phu="mã hàng · BOM" icon={Shirt} chay={hd.dinhMuc} />
        <The nhan="Tech Pack" phu="tài liệu kỹ thuật" icon={FileText} chay={hd.techPack} />
        <The nhan="Yêu cầu NPL" phu="đề nghị mua vật tư" icon={Boxes} chay={hd.yeuCauNpl} />
      </div>
    </section>
  );
}
