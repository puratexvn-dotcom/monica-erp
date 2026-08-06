'use client';

// ============================================================================
// ② QUICK ACTIONS — THẺ HÀNH ĐỘNG, ĐẶT NGAY DƯỚI COMMAND CENTER
//
// Board Directive 07/08/2026 §2:
//
//   > *"Các hành động MD dùng thường xuyên phải nhìn thấy ngay … ⛔ Không để
//   > người dùng phải tìm trong tab/menu. Thiết kế dạng **action card nổi
//   > bật**."*
//
// ─── 🔑 VÌ SAO ĐÂY ⛔ KHÔNG PHẢI BẢN SAO CỦA THANH TAB ───────────────────
// Thanh 13 tab bên dưới trả lời *"tôi muốn XEM khu nào"*. Dải này trả lời
// *"tôi muốn LÀM việc gì"* — và hai câu đó khác nhau. Vào tab *"Khách hàng"*
// rồi còn phải tìm nút *"Thêm khách hàng"* là **hai cú bấm cho một ý định**.
//
// ⚠️ Mỗi thẻ phải dẫn tới **một hành động có thật**. Một thẻ mở ra chỗ ⛔ không
// tồn tại là *"lời nói dối của giao diện"* — cùng luật đã ghi ở
// `md-quick-actions.ts`.
//
// ⚠️ Màu từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import type { LucideIcon } from 'lucide-react';
import { FilePlus2, UserPlus, Calculator, Handshake, Ship, Users } from 'lucide-react';
import Link from 'next/link';

import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
// ⚠️ Lớp thẻ + huy hiệu lấy từ `components/ui`, ⛔ KHÔNG viết màu thẳng ở đây —
// bánh cóc `TD-07` chặn tệp mới, và nó chặn đúng.
import { theBamDuoc, huyHieuThe } from '@/components/ui';

export interface TheHanhDong {
  id: string;
  nhan: string;
  phu: string;
  icon: LucideIcon;
  /** Một trong hai: chạy hàm, hoặc đi tới đường dẫn. */
  chay?: () => void;
  href?: string;
}

const the = `group flex items-start gap-3 p-4 ${theBamDuoc}`;

function NoiDung({ nhan, phu, icon: Icon }: { nhan: string; phu: string; icon: LucideIcon }) {
  return (
    <>
      <span className={`mt-0.5 ${huyHieuThe}`}>
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className={`block text-slate-900 ${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>{nhan}</span>
        <span className={`block text-slate-500 ${TYPE.caption}`}>{phu}</span>
      </span>
    </>
  );
}

export default function MdActionCards({
  onTaoPo, onTaoKhach, onChietTinh, onShipment,
}: {
  onTaoPo: () => void;
  onTaoKhach: () => void;
  onChietTinh: () => void;
  onShipment: () => void;
}) {
  const dsThe: TheHanhDong[] = [
    { id: 'po', nhan: 'Tạo PO', phu: 'mở biểu mẫu đơn hàng mới', icon: FilePlus2, chay: onTaoPo },
    { id: 'khach', nhan: 'Tạo khách hàng', phu: 'thêm khách vào danh mục', icon: UserPlus, chay: onTaoKhach },
    { id: 'gia', nhan: 'Chiết tính giá', phu: 'tích công đoạn ⇒ ra giá chào', icon: Calculator, chay: onChietTinh },
    // ⚠️ Board liệt kê "Tạo đơn hàng" tách khỏi "Tạo PO": đó là **Thương mại**
    // (`/orders`) — nơi lập đơn bán, khác với PO sản xuất ở `/md`.
    { id: 'don', nhan: 'Đơn hàng thương mại', phu: 'sang phân hệ Commercial', icon: Handshake, href: '/orders' },
    { id: 'ship', nhan: 'Theo dõi shipment', phu: 'lịch tàu · chứng từ xuất', icon: Ship, chay: onShipment },
    // ⚠️ GIỮ LỐI VÀO CŨ. Dải này thay thế *"Việc làm nhanh"* của khung, mà
    // khung vốn có `/orders` và `/subcon`. Ràng buộc ② của dự án: **⛔ không
    // xoá lối cũ, chỉ đổi đường dùng** — bỏ mục này là làm mất đường vào phần
    // việc giao nhà thầu của cả một bộ phận.
    { id: 'gc', nhan: 'Gia công ngoài', phu: 'giao việc · thu hồi bó hàng', icon: Users, href: '/subcon' },
  ];

  return (
    <section aria-label="Việc làm nhanh" className="mb-5">
      <h2 className={`mb-2 text-slate-700 ${TYPE.overline}`}>Bắt đầu việc gì?</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {dsThe.map((c) =>
          c.href ? (
            <Link key={c.id} href={c.href} className={the}>
              <NoiDung nhan={c.nhan} phu={c.phu} icon={c.icon} />
            </Link>
          ) : (
            <button key={c.id} type="button" onClick={c.chay} className={the}>
              <NoiDung nhan={c.nhan} phu={c.phu} icon={c.icon} />
            </button>
          ),
        )}
      </div>
    </section>
  );
}
